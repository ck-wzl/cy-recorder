<template>
    <main class="option-main">
        <a-select v-model:value="curSelectors" class="option-select" :maxTagCount="4" :maxTagTextLength="12"
            listHeight="200" mode="multiple" style="width: 100%" :options="options" @change="handleChange"></a-select>
        <div v-if="!!showText" class="option-text">{{ showText }}</div>
        <div v-if="!!showTip" class="option-tip">{{ showTip }}</div>
    </main>
</template>

<script setup lang="ts">
/**
 * @file Options组件主入口
 */

import { useWebExtensionStorage } from '~/composables/useWebExtensionStorage'

// 提示的文本
const showTip = ref('')

// showTip的timerid
const timerId = ref<NodeJS.Timeout | null>(null)

// 展示的文本
const showText = computed(() => curSelectors.value.join(' >> '))

// 选项配置
const options = [
    { value: 'utid', disabled: true },
    { value: 'id', disabled: true },
    { value: 'class', disabled: true },
    { value: 'data-href' },
    { value: 'data-cy' },
    { value: 'data-test' },
    { value: 'data-testid' },
    { value: 'test-id' },
]

// 当前的选项配置
const optionList = useWebExtensionStorage('optionList', options.map(i => i.value))

// 当前选择的选择器，默认选择全部
const curSelectors = useWebExtensionStorage('curSelectors', [...optionList.value])

// 处理选择器的改变事件
const handleChange = () => {
    if (timerId.value) {
        showTip.value = ''
        clearTimeout(timerId.value)
        timerId.value = null
    }

    showTip.value = 'Configuration successful!'

    timerId.value = setTimeout(() => {
        if (timerId.value) {
            showTip.value = ''
            clearTimeout(timerId.value)
            timerId.value = null
        }
    }, 800)
}
</script>

<style scoped>
.option-main {
    height: 300px;
    padding: 10px 20px;
}

.option-select :deep(.anticon.anticon-close) {
    vertical-align: baseline;
}

.option-text {
    font-size: 14px;
    color: #999;
    line-height: 20px;
    margin: 8px 0px;
    word-break: break-word;
}

.option-tip {
    position: absolute;
    font-size: 14px;
    color: #569c30;
    line-height: 22px;
    bottom: 10px;
    right: 20px;
}
</style>
