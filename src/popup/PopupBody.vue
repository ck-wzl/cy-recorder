<template>
    <div class="body-main">
        <div v-if="!!showTipsText" class="empty-box">{{ showTipsText }}</div>
        <ul v-else class="code-main">
            <li v-for="(item, index) of codeBlocks" :key="index" class="code-block">
                <span class="index-item">{{ index + 1 }}</span>
                <div class="item-block">
                    <div class="code-item">{{ item.code }}</div>
                    <div class="prompt-item">{{ item.prompt }}</div>
                </div>
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
import { RecState } from '~/constants';
import type { ICodeBlock } from '~/interface';

/**
 * @file popup主体组件 - Body
 */

const props = defineProps({
    // 是否符合校验的tab
    isValidTab: {
        type: Boolean,
        required: true
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
    }
})

const codeBlocks = computed(() => props.codeData)

// 是否展示提示文本
const showTipsText = computed(() => {
    if (!props.isValidTab) return 'The current page does not support recording operations'
    if (props.codeData.length === 0 && props.recData === RecState.Off) return 'Click [Start] to start recording your operation'
    return ''
})

</script>

<style scoped>
.body-main {
    height: 320px;
    padding: 10px 20px;
    overflow: hidden auto;
}

.empty-box {
    font-size: 14px;
    height: 20px;
    text-align: center;
    margin-top: 140px;
}

.code-main {
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
}

.code-block {
    margin: 0;
    padding: 0;
    display: flex;
    max-width: 100%;
    color: rgba(0, 0, 0, 0.88);
    align-items: center;
    justify-content: space-between;
    align-items: baseline;
    border-block-end: 1px solid rgba(5, 5, 5, 0.06);
}

.index-item {
    width: 18px;
    height: 18px;
    display: inline-flex;
    font-size: 12px;
    scale: 0.8;
    margin-inline-end: 4px;
    background-color: #d9d9d9;
    border-radius: 50%;
    align-items: center;
    justify-content: center;
}

.item-block {
    flex: 1 0;
    width: 0;
    color: rgba(0, 0, 0, 0.88);
}

.code-item,
.prompt-item {
    white-space: pre-wrap;
    overflow-wrap: break-word;
    word-break: break-word;
}

.code-item {
    font-size: 14px;
    color: rgba(0, 0, 0, 0.88);
    line-height: 22px;
}

.prompt-item {
    font-size: 12px;
    color: rgba(0, 0, 0, 0.45);
    line-height: 20px;
}
</style>
