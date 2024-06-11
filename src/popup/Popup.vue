<template>
    <main class="popup-main">
        <PopupHead />
        <PopupBody :is-valid-tab="isValidTab" :code-data="codeBlocks" :rec-data="recStatus" />
        <PopupFoot :is-valid-tab="isValidTab" :code-data="codeBlocks" :rec-data="recStatus"
            :handle-toggle="handleToggle" :handle-copy="copyToClipboard" />
    </main>
</template>

<script setup lang="ts">
/**
 * @file Popup组件主入口
 */

import { sendMessage } from 'webext-bridge/popup'
import { ActionState, ContentType, RecState } from '~/constants'
import type { ICodeBlock } from '~/interface'
import { useWebExtensionStorage } from '~/composables/useWebExtensionStorage'
import { isForbiddenUrl } from '~/env'
import type { Tabs } from 'webextension-polyfill'
import PopupHead from './PopupHead.vue'
import PopupBody from './PopupBody.vue'
import PopupFoot from './PopupFoot.vue'

// 录制状态
const recStatus = useWebExtensionStorage('recStatus', RecState.Off)

// 代码块
const codeBlocks = useWebExtensionStorage('codeBlocks', [] as ICodeBlock[])

// 是否是合格的tab
const isValidTab = ref(true)

// 处理切换事件
const handleToggle = (action: ActionState) => {
    // 更新对应的状态
    switch (action) {
        // 开始/继续
        case ActionState.Start:
        case ActionState.Resume:
            recStatus.value = RecState.On
            codeBlocks.value = []
            break

        // 暂停
        case ActionState.Pause:
            recStatus.value = RecState.Paused
            break

        // 重置
        case ActionState.Reset:
        default:
            recStatus.value = RecState.Off
            codeBlocks.value = []
            break
    }

    // 发送操作的消息
    sendMessage('popup-action-message', { action: action })
        .then(() => console.log('[cypress-recorder][popup]发送消息成功'))
        .catch(error => console.error('[cypress-recorder][popup]发送消息失败：', error))
}

// 复制内容到剪贴板
const copyToClipboard = async (type: ContentType) => {
    try {
        const toBeCopied = codeBlocks.value.map(item => item[type]).join('\n')
        await navigator.clipboard.writeText(toBeCopied)
        return true
    } catch (error) {
        console.error('[cypress-recorder][popup]复制报错：', error)
        return false
    }
}

onMounted(() => {
    const status = useWebExtensionStorage('recStatus', recStatus.value)
    recStatus.value = status.value

    const blocks = useWebExtensionStorage('codeBlocks', codeBlocks.value)
    codeBlocks.value = blocks.value

    // active: 选项卡在其窗口中是否处于活动状态 currentWindow: 选项卡是否在当前窗口中
    browser.tabs.query({ active: true, currentWindow: true }).then(([tab]: Tabs.Tab[]) => {
        // 是否是禁止访问的URL
        const result = tab.url ? isForbiddenUrl(tab.url) : true
        isValidTab.value = !result
    })
})
</script>

<style scoped>
.popup-main {
    width: 460px;
    height: auto;
    display: flex;
    flex-direction: column;
}
</style>