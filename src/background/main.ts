import { onMessage, sendMessage } from 'webext-bridge/background'
import type { Runtime, WebNavigation } from 'webextension-polyfill'
import { handleCreateBlock, handleUrlEvent, handleVisitEvent } from '~/helper/codeGenerator'
import codeOperation from '~/helper/codeOperation'
import { ActionState, EventType, RecState } from '~/constants'
import type { ParsedEvent } from '~/interface'

if (import.meta.hot) {
  // @ts-expect-error TODO@wzl 后续可以去掉
  import('/@vite/client')
  import('./contentScriptHMR')
}

const operation = new codeOperation()

const session: {
  activePort: Runtime.Port | null
  originalHost: string | null
  lastURL: string
} = {
  activePort: null,
  originalHost: null,
  lastURL: '',
}

const isRecording = () => {
  return operation.recStatus === RecState.On
}

// 在导航事件（尤其是主框架的导航事件）发生时断开当前活动端口的连接
const disconnectActivePortOnNavigation = (details?: WebNavigation.OnBeforeNavigateDetailsType): void => {
  if (session.activePort && (!details || details.frameId === 0)) {
    session.activePort.disconnect()
  }
}

// 处理导航提交时的事件
const handleNavigationEvent = (details: WebNavigation.OnCommittedDetailsType): void => {
  if (!isRecording()) return

  const isMainFrame = details.frameId === 0
  const isDifferentHost = !details.url.includes(session.originalHost ?? '')
  const isFromForwardBack = details.transitionQualifiers.includes('forward_back')
  const isFromAddressBar = details.transitionQualifiers.includes('from_address_bar')

  if (isMainFrame && (isDifferentHost || isFromForwardBack || isFromAddressBar)) {
    pauseRecord()
    return
  }

  if (details.url.includes(session.originalHost ?? '')) {
    const urlBlock = handleUrlEvent(details.url)
    operation.addCodeBlock(urlBlock).then(() => {
      sendMessage('background-action-message', {
        action: ActionState.Add,
        code: urlBlock
      })
    })
  }
}

// 向页面注入事件记录器脚本
const injectEventRecorderScript = (details?: WebNavigation.OnDOMContentLoadedDetailsType): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!isRecording()) {
      resolve()
      return
    }

    const tabId = details?.tabId ?? session.activePort?.sender?.tab?.id

    if (!tabId) {
      console.warn('[cypress-recorder][background]无法找到 tabId, 无法注入脚本')
      resolve()
      return
    }

    if (!details || details.frameId === 0) {
      browser.scripting.executeScript({
        target: { tabId },
        files: ['dist/contentScripts/index.global.js'],
      }, () => {
        if (browser.runtime.lastError) {
          console.error('[cypress-recorder][background]注入脚本报错：', browser.runtime.lastError)
          reject(browser.runtime.lastError)
        } else {
          console.log('[cypress-recorder][background]注入脚本成功')
          resolve()
        }
      })
    } else {
      resolve()
    }
  })
}

// 开始录制
const startRecord = () => {
  return new Promise<void>((resolve, reject) => {
    injectEventRecorderScript().then(() => {
      operation.updateState(RecState.On).then(() => {
        browser.action.setBadgeText({ text: 'rec' })
        resolve()
      }).catch(reject)
    }).catch(reject)
  })
}

// 结束录制
const pauseRecord = () => {
  return new Promise<void>((resolve) => {
    disconnectActivePortOnNavigation()
    browser.webNavigation.onDOMContentLoaded.removeListener(injectEventRecorderScript)
    browser.webNavigation.onCommitted.removeListener(handleNavigationEvent)
    browser.webNavigation.onBeforeNavigate.removeListener(disconnectActivePortOnNavigation)

    operation.updateState(RecState.Paused).then(() => {
      session.activePort = null
      session.originalHost = null
      browser.action.setBadgeText({ text: 'pause' })
      resolve()
    })
  })
}

// 重置录制
const resetRecord = () => {
  return new Promise<void>((resolve) => {
    session.lastURL = ''
    operation.resetState().then(() => {
      browser.action.setBadgeText({ text: '' })
      resolve()
    })
  })
}

// 执行清理的操作
const clearUp = () => {
  disconnectActivePortOnNavigation()
  operation.init()
}

// 初始化操作
(() => {
  clearUp()

  // 安装时的监听事件
  browser.runtime.onInstalled.addListener(() => console.log('[cypress-recorder][background]扩展已安装'))

  // 连接时的监听事件
  browser.runtime.onConnect.addListener((port: Runtime.Port) => {
    session.activePort = port

    port.onDisconnect.addListener(() => {
      console.log('[cypress-recorder][background]Port disconnected!')
      session.activePort = null
    })

    if (isRecording()) {
      session.originalHost = port.name

      browser.webNavigation.onBeforeNavigate.addListener(disconnectActivePortOnNavigation)
      browser.webNavigation.onCommitted.addListener(handleNavigationEvent)
      browser.webNavigation.onDOMContentLoaded.addListener(injectEventRecorderScript, { url: [{ hostEquals: session.originalHost }] })

      if (port.sender && port.sender.url && session.lastURL !== port.sender.url) {
        const visitBlock = handleVisitEvent(port.sender.url)
        session.lastURL = port.sender.url
        operation.addCodeBlock(visitBlock).then(() => {
          sendMessage('background-action-message', {
            action: ActionState.Add,
            code: visitBlock
          })
        })
      }
    }
  })

  // 接受来自contentScript的content-event-message
  onMessage<{ event: ParsedEvent }, 'content-event-message'>('content-event-message', async (event) => {
    if (!isRecording()) return

    console.log('[cypress-recorder][background]接受来自content的event消息: ', event)

    const eventObject = event.data.event
    const block = await handleCreateBlock(eventObject)

    if (block === null) {
      return
    }

    if (eventObject.action === EventType.DblClick) {
      operation.popTwoCodeBlock().then(() => {
        operation.addCodeBlock(block)
      })
    } else {
      operation.addCodeBlock(block)
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
})()
