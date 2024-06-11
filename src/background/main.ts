import { onMessage } from 'webext-bridge/background'
import type { Runtime, WebNavigation } from 'webextension-polyfill'
import { handleCreateBlock, handleUrlEvent, handleVisitEvent } from '~/helper/codeGenerator'
import { useWebExtensionStorage } from '~/composables/useWebExtensionStorage'
import { ActionState, EventType, RecState } from '~/constants'
import type { ICodeBlock, ParsedEvent } from '~/interface'
import { isFirefox, isForbiddenUrl } from '~/env'

if (import.meta.hot) {
  // @ts-expect-error
  import('/@vite/client')
  import('./contentScriptHMR')
}

const session: {
  activePort: Runtime.Port | null
  originalHost: string | null
  lastURL: string
} = {
  activePort: null,
  originalHost: null,
  lastURL: '',
}

// 当前录制状态
const recStatus = useWebExtensionStorage('recStatus', RecState.Off)

// 当前代码块
const codeBlocks = useWebExtensionStorage('codeBlocks', [] as ICodeBlock[])

// 在导航事件（尤其是主框架的导航事件）发生时断开当前活动端口的连接
const disconnectActivePortOnNavigation = (details?: WebNavigation.OnBeforeNavigateDetailsType): void => {
  // frameId === 0 表示导航发生在选项卡内容窗口中
  // 正值表示子框架中的导航
  // frameId 对于给定选项卡和进程是唯一的。
  if (session.activePort && (!details || details.frameId === 0)) {
    session.activePort.disconnect()
  }
}

// 处理导航提交时的事件
const handleNavigationEvent = (details: WebNavigation.OnCommittedDetailsType): void => {
  // 是否是主界面
  const isMainFrame = details.frameId === 0
  // 是否非当前活动端口
  const isDifferentHost = !details.url.includes(session.originalHost ?? '')
  // 是否导航是通过前进/后退按钮触发的
  const isFromForwardBack = details.transitionQualifiers.includes('forward_back')
  // 是否导航是通过地址栏触发的
  const isFromAddressBar = details.transitionQualifiers.includes('from_address_bar')

  if (isMainFrame && (isDifferentHost || isFromForwardBack || isFromAddressBar)) {
    pauseRecord()
    return
  }

  if (details.url.includes(session.originalHost ?? '')) {
    const urlBlock = handleUrlEvent(details.url)
    codeBlocks.value.push({ code: urlBlock, prompt: 'prompt-----url' })
  }
}

// 向页面注入事件记录器脚本
const injectEventRecorderScript = (details?: WebNavigation.OnDOMContentLoadedDetailsType): void => {
  if (!details || details.frameId !== 0 || isForbiddenUrl(details.url))
    return

  browser.tabs.executeScript(details.tabId, {
    file: `${isFirefox ? '' : '.'}/dist/contentScripts/index.global.js`,
    runAt: 'document_end',
  }).catch((error: any) => console.error('[cypress-recorder][background]注入脚本报错：', error))
}

// 开始录制
const startRecord = async () => {
  injectEventRecorderScript()
  recStatus.value = RecState.On
  await Promise.resolve()
  browser.action.setBadgeText({ text: 'rec' })
}

// 结束录制
const pauseRecord = async () => {
  disconnectActivePortOnNavigation()
  browser.webNavigation.onDOMContentLoaded.removeListener(injectEventRecorderScript)
  browser.webNavigation.onCommitted.removeListener(handleNavigationEvent)
  browser.webNavigation.onBeforeNavigate.removeListener(disconnectActivePortOnNavigation)
  recStatus.value = RecState.Paused
  await Promise.resolve()
  session.activePort = null;
  session.originalHost = null;
  browser.action.setBadgeText({ text: 'pause' })
}

// 重置录制
const resetRecord = async () => {
  session.lastURL = ''
  recStatus.value = RecState.Off
  codeBlocks.value = []
  await Promise.resolve()
  browser.action.setBadgeText({ text: '' })
}

// 执行清理的操作
const clearUp = () => {
  disconnectActivePortOnNavigation()
  recStatus.value = RecState.Off
  codeBlocks.value = []
}

clearUp()

// 安装时的监听事件
browser.runtime.onInstalled.addListener(() => console.log('[cypress-recorder][background]扩展已安装'))

// 连接时的监听事件
browser.runtime.onConnect.addListener((port: Runtime.Port) => {
  session.activePort = port
  if (recStatus.value === RecState.On) {
    // 存储当前活动端口的名称（通常是扩展连接的名称）
    session.originalHost = port.name

    // 在即将发生导航时触发
    browser.webNavigation.onBeforeNavigate.addListener(disconnectActivePortOnNavigation)
    // 在提交导航时触发，浏览器已决定切换到新文档。
    browser.webNavigation.onCommitted.addListener(handleNavigationEvent)
    // 当页面的 DOM 已完全构建，但引用的资源可能无法完成加载时触发。
    browser.webNavigation.onDOMContentLoaded.addListener(injectEventRecorderScript, { url: [{ hostEquals: session.originalHost }] })

    if (port.sender && port.sender.url && session.lastURL !== port.sender.url) {
      const visitBlock = handleVisitEvent(port.sender.url)
      session.lastURL = port.sender.url
      codeBlocks.value.push({ code: visitBlock, prompt: 'prompt-----visit' })
    }
  }
})

// 接受来自contentScript的content-event-message
onMessage<{ event: ParsedEvent }, 'content-event-message'>('content-event-message', async (event) => {
  console.log('[cypress-recorder][background]接受来自content的event消息: ', event)

  const eventObject = event.data.event

  /** TODO@WZL 这里还可以生成prompt */
  const block = await handleCreateBlock(eventObject)

  if (!block) {
    return
  }

  if (eventObject.action === EventType.DblClick) {
    // 双击时，会注入两个单击事件进去，所以需要先删除前面两个单击事件
    codeBlocks.value.splice(codeBlocks.value.length - 2, 2)
    await Promise.resolve()
    codeBlocks.value.push({ code: block, prompt: 'prompt-----双击', })
  } else {
    codeBlocks.value.push({ code: block, prompt: 'prompt-----非双击', })
  }
})

// 接受来自popup的popup-action-message
onMessage<{ action: ActionState }, 'popup-action-message'>('popup-action-message', async (event) => {
  console.log('[cypress-recorder][background]接受来自popup的action消息: ', event)

  const actionStr = event.data.action

  switch (actionStr) {
    case ActionState.Start:
    case ActionState.Resume:
      await startRecord()
      break

    case ActionState.Pause:
      await pauseRecord()
      break

    case ActionState.Reset:
      await resetRecord()
      break

    default:
      console.error(`[cypress-recorder][background]未捕获的操作：${actionStr}`)
      break
  }
})
