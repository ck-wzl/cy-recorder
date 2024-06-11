<template>
    <div class="foot-main">
        <a-button class="toggle-button" size="small" :disabled="!props.isValidTab" @click="handleClickToggle">
            {{ toggleText }}
        </a-button>

        <a-button v-if="showResetButton" class="reset-button" size="small" @click="handleClickReset">
            Reset
        </a-button>

        <span v-if="!!copyTip" :class="['copy-tip', copyColor]">{{ copyTip }}</span>

        <a-button v-if="showCopyButton" class="copy-code-button" size="small" :disabled="disabledCopyButton"
            @click="handleClickCopyCode">
            Copy Code
        </a-button>

        <a-button v-if="showCopyButton" class="copy-prompt-button" size="small" :disabled="disabledPromptButton"
            @click="handleClickCopyPrompt">
            Copy Prompt
        </a-button>
    </div>
</template>

<script setup lang="ts">
/**
 * @file popup底部组件 - Foot
 */

import { ActionState, ContentType, RecState } from '~/constants'
import type { ICodeBlock } from '~/interface'

const props = defineProps({
    // 是否符合校验的tab
    isValidTab: {
        type: Boolean,
        required: true,
    },

    // 代码块
    codeData: {
        type: Array as PropType<ICodeBlock[]>,
        required: true
    },

    // 录制状态
    recData: {
        type: String as PropType<RecState>,
        required: true
    },

    // 处理切换事件
    handleToggle: {
        type: Function as PropType<(type: ActionState) => void>,
        required: true,
    },

    // 处理复制操作事件
    handleCopy: {
        type: Function as PropType<(type: ContentType) => Promise<boolean>>,
        required: true,
    },
})

// 复制的提示文本
const copyTip = ref('')

// 复制文本的颜色样式
const copyColor = ref('')

// 复制的timer
const copyTimerId = ref<NodeJS.Timeout | null>(null)

// 录制状态
const recStatus = computed(() => props.recData)

// 代码块
const codeBlocks = computed(() => props.codeData)

// 切换按钮的文本
const toggleText = computed(() => {
    if (!props.isValidTab) return 'Invalid Tab'

    switch (recStatus.value) {
        case RecState.On:
            return 'Pause'

        case RecState.Off:
            return 'Start'

        case RecState.Paused:
            return "Resume"

        default:
            return "Unknown"
    }
});

// 是否显示重置按钮
const showResetButton = computed(() => props.isValidTab && recStatus.value === RecState.Paused)

// 是否显示复制按钮
const showCopyButton = computed(() => props.isValidTab && recStatus.value === RecState.Paused)

// 是否禁用复制代码的按钮
const disabledCopyButton = computed(() => {
    const codeList = codeBlocks.value.map(item => item.code)
    return !codeList.length
})

// 是否禁用复制代码的按钮
const disabledPromptButton = computed(() => {
    const promptList = codeBlocks.value.map(item => item.prompt)
    return !promptList.length
})

// 切换按钮点击事件
const handleClickToggle = () => {
    switch (recStatus.value) {
        case RecState.On:
            props.handleToggle(ActionState.Pause)
            break

        case RecState.Off:
            props.handleToggle(ActionState.Start)
            break

        case RecState.Paused:
            props.handleToggle(ActionState.Resume)

        default:
            break
    }
}

// 重置按钮点击事件
const handleClickReset = () => {
    props.handleToggle(ActionState.Reset)
}

// 处理复制提示文本的事件
const handleCopyTip = (type: ContentType, isSuccess: boolean) => {
    if (copyTimerId.value) {
        copyTip.value = ''
        clearTimeout(copyTimerId.value)
        copyTimerId.value = null
    }

    copyColor.value = isSuccess ? 'copy-success' : 'copy-failed'
    copyTip.value = `Copied ${type} ${isSuccess ? 'successfully' : 'failed'}!`

    copyTimerId.value = setTimeout(() => {
        if (copyTimerId.value) {
            copyTip.value = ''
            clearTimeout(copyTimerId.value)
            copyTimerId.value = null
        }
    }, 800)
}

// 复制代码按钮点击事件
const handleClickCopyCode = async () => {
    const result = await props.handleCopy(ContentType.Code)
    handleCopyTip(ContentType.Code, result)
}

// 复制提示按钮点击事件
const handleClickCopyPrompt = async () => {
    const result = await props.handleCopy(ContentType.Prompt)
    handleCopyTip(ContentType.Prompt, result)
}
</script>

<style scoped>
.foot-main {
    position: relative;
    display: flex;
    align-items: center;
    height: 32px;
    padding: 0 8px;
    border-block-start: 1px solid #ebebeb;
}

.toggle-button,
.reset-button {
    margin-right: 4px;
}

.copy-tip {
    position: absolute;
    font-size: 10px;
    right: 8px;
    bottom: 40px;
}

.copy-failed {
    color: #ec5b56;
}

.copy-success {
    color: #569c30;
}

.copy-code-button {
    margin-left: auto;
}

.copy-prompt-button {
    margin-left: 4px;
}
</style>
