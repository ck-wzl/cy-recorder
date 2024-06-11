<template>
    <div class="head-main">
        <h1 class="head-title">Cypress Recorder</h1>
        <a-button class="option-button" size="small" shape="circle" :icon="h(SettingOutlined)" title="设置"
            @click="openOptionPage" />
    </div>
</template>

<script setup lang="ts">
/**
 * @file popup头部组件 - Head
 */

import { h } from 'vue';
import { SettingOutlined } from '@ant-design/icons-vue';

const openOptionPage = () => {
    browser.runtime.openOptionsPage();
}

</script>

<style scoped>
.head-main {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 32px;
    padding: 4px 8px;
    border-block-end: 1px solid #ebebeb;
}

.head-title {
    margin: 0;
    font-size: 18px;
    line-height: 24px;
}

.option-button {
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>
