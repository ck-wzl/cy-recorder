import { sendMessage } from 'webext-bridge/content-script'
import { finder, Options } from '@medv/finder'
import { EventType } from '~/constants'
import { useWebExtensionStorage } from '~/composables/useWebExtensionStorage'
import type { ParsedEvent } from '~/interface'

// 生成格式化的数据
const getFormattedValue = (event: Event) => {
  // 选中的选择器
  const selectorList = useWebExtensionStorage('curSelectors', [] as string[])

  // 全部的选择器
  const optionList = useWebExtensionStorage('optionList', [] as string[])

  let curSelector = ""

  // 当前的选择器，一个一个的遍历selectorList
  for (const item of selectorList.value) {
    if ((event.target as Element).hasAttribute(item)) {
      curSelector = `[${item}=${(event.target as Element).getAttribute(item)}]`
      break
    }
  }

  // 如果没有上面的自定义选择器，就使用finder来生成
  if (!curSelector) {
    const finderConfig: Options = {
      root: document.body,
      idName: (name) => true,
      className: (name) => true,
      tagName: (name) => true,
      attr: (name) => optionList.value.includes(name),
      seedMinLength: 1,
      optimizedMinLength: 2,
      threshold: 1000,
      maxNumberOfTries: 10_000,
      timeoutMs: void 0,
    }

    curSelector = finder(event.target as Element, finderConfig)
  }

  const parsedEvent: ParsedEvent = {
    selector: curSelector,
    action: event.type,
    tag: (event.target as Element).tagName,
    value: (event.target as HTMLInputElement).value,
  }

  if ((event.target as HTMLAnchorElement).hasAttribute('href')) {
    parsedEvent.href = (event.target as HTMLAnchorElement).href
  }

  if ((event.target as Element).hasAttribute('id')) {
    parsedEvent.id = (event.target as Element).id
  }

  if (parsedEvent.tag === 'INPUT') {
    parsedEvent.inputType = (event.target as HTMLInputElement).type
  }

  if (event.type === 'keydown') {
    parsedEvent.key = (event as KeyboardEvent).key
  }

  return parsedEvent
}

// 处理监听事件的事件
const handleEventListener = (event: Event) => {
  // 用户实际操作的事件
  if (event.isTrusted !== true) {
    return
  }

  const eventObject: ParsedEvent = getFormattedValue(event)

  sendMessage('content-event-message', { event: eventObject })
    .then(() => console.log('[cypress-recorder][content]发送消息成功', eventObject))
    .catch(error => console.error('[cypress-recorder][content]发送消息失败：', error))
}

// 给DOM添加监听事件
const addDOMListeners = () => {
  console.log('[cypress-recorder][content]添加DOM监听事件')
  Object.values(EventType).forEach((event) => {
    document.addEventListener(event, handleEventListener, { capture: true, passive: true })
  })
}

// 给DOM移除监听事件
const removeDOMListeners = () => {
  console.log('[cypress-recorder][content]移除DOM监听事件')
  Object.values(EventType).forEach((event) => {
    document.removeEventListener(event, handleEventListener, { capture: true })
  })
}

// 初始化执行
(() => {
  console.log(`[cypress-recorder][content]${new Date().toLocaleString()}已加载`)

  /**
   * name是当前 URL 的主机名部分（不包括协议、端口号和路径）
   * name将传递到 onConnect 中，用于侦听连接事件的进程
   */
  const curPort = browser.runtime.connect({ name: window.location.hostname })

  console.log('[cypress-recorder][content]当前端口已连接：', curPort)

  // 当端口与另一端断开连接时触发
  curPort.onDisconnect.addListener(removeDOMListeners)

  // 给DOM添加事件监听
  addDOMListeners()
})()
