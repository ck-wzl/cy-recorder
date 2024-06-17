/**
 * @file 代码生成器
 */

import { EventType } from "~/constants";
import type { ICodeBlock, ParsedEvent } from "~/interface";

// 处理单击事件
const handleClickEvent = (event: ParsedEvent): Promise<ICodeBlock> => {
    return new Promise((resolve, _reject) => {
        resolve({
            code: `cy.get('${event.selector}').click();`,
            prompt: `在选择器为 ${event.selector} 的元素上单击。`
        })
    });
}

// 处理双击事件
const handleDoubleclickEvent = (event: ParsedEvent): Promise<ICodeBlock> => {
    return new Promise((resolve, _reject) => {
        resolve({
            code: `cy.get('${event.selector}').dblclick();`,
            prompt: `在选择器为 ${event.selector} 的元素上双击。`
        })
    })
}

// 处理按键按下事件
const handleKeydownEvent = (event: ParsedEvent): Promise<ICodeBlock | null> => {
    return new Promise((resolve, _reject) => {
        switch (event.key) {
            case 'Backspace':
                resolve({
                    code: `cy.get('${event.selector}').type('{backspace}');`,
                    prompt: `在选择器 ${event.selector} 所对应的元素上按下删除键。`
                })
                break

            case 'Escape':
                resolve({
                    code: `cy.get('${event.selector}').type('{esc}');`,
                    prompt: `在选择器 ${event.selector} 所对应的元素上按下Esc键。`
                })
                break

            case 'ArrowUp':
                resolve({
                    code: `cy.get('${event.selector}').type('{uparrow}');`,
                    prompt: `在选择器 ${event.selector} 所对应的元素上按下向上箭头键。`
                })
                break

            case 'ArrowRight':
                resolve({
                    code: `cy.get('${event.selector}').type('{rightarrow}');`,
                    prompt: `在选择器 ${event.selector} 所对应的元素上按下向右箭头键。`
                })
                break

            case 'ArrowDown':
                resolve({
                    code: `cy.get('${event.selector}').type('{downarrow}');`,
                    prompt: `在选择器 ${event.selector} 所对应的元素上按下向下箭头键。`
                })
                break

            case 'ArrowLeft':
                resolve({
                    code: `cy.get('${event.selector}').type('{leftarrow}');`,
                    prompt: `在选择器 ${event.selector} 所对应的元素上按下向左箭头键。`
                })
                break

            default:
                resolve(null)
        }
    })
}

// 处理改变事件
const handleChangeEvent = (event: ParsedEvent): Promise<ICodeBlock | null> => {
    return new Promise((resolve, _reject) => {
        if (event.inputType === 'checkbox' || event.inputType === 'radio') {
            resolve(null);
        };
        resolve({
            code: `cy.get('${event.selector}').type('${event.value.replace(/'/g, "\\'")}');`,
            prompt: `在选择器 ${event.selector} 所对应的输入框中输入文本 ${event.value.replace(/'/g, "\\'")}。`
        })
    })
}

// 处理提交事件
const handleSubmitEvent = (event: ParsedEvent): Promise<ICodeBlock> => {
    return new Promise((resolve, _reject) => {
        resolve({
            code: `cy.get('${event.selector}').submit();`,
            prompt: `在选择器 ${event.selector} 所对应的表单上提交表单。`
        });
    })
}

// 处理访问的URL
export const handleUrlEvent = (url: string) => {
    const { origin, pathname } = new URL(url);
    return {
        code: `cy.url().should('contains', '${origin + pathname}');`,
        prompt: `当前URL应该包含 ${origin + pathname}。`
    }
}

// 处理创建访问事件
export const handleVisitEvent = (url: string) => {
    return {
        code: `cy.visit('${url}');`,
        prompt: `访问url为 ${url} 的页面。`
    };
}

export const handleCreateBlock = (event: ParsedEvent) => {
    switch (event.action) {
        case EventType.Click:
            return handleClickEvent(event);
        case EventType.DblClick:
            return handleDoubleclickEvent(event);
        case EventType.KeyDown:
            return handleKeydownEvent(event);
        case EventType.Change:
            return handleChangeEvent(event);
        case EventType.Submit:
            return handleSubmitEvent(event);
        default:
            throw new Error(`[cypress-recorder] Uncaptured Events: ${event.action}`);
    }
}
