/**
 * @file 代码生成器
 */

import { EventType } from "~/constants";
import type { ParsedEvent } from "~/interface";

// 处理单击事件
const handleClickEvent = (event: ParsedEvent): Promise<string> => {
    return new Promise((resolve, _reject) => {
        resolve(`cy.get('${event.selector}').click();`)
    });
}

// 处理双击事件
const handleDoubleclickEvent = (event: ParsedEvent): Promise<string> => {
    return new Promise((resolve, _reject) => {
        resolve(`cy.get('${event.selector}').dblclick();`);
    })
}

// 处理按键按下事件
const handleKeydownEvent = (event: ParsedEvent): Promise<string | null> => {
    return new Promise((resolve, _reject) => {
        switch (event.key) {
            case 'Backspace':
                resolve(`cy.get('${event.selector}').type('{backspace}');`);
            case 'Escape':
                resolve(`cy.get('${event.selector}').type('{esc}');`);
            case 'ArrowUp':
                resolve(`cy.get('${event.selector}').type('{uparrow}');`);
            case 'ArrowRight':
                resolve(`cy.get('${event.selector}').type('{rightarrow}');`);
            case 'ArrowDown':
                resolve(`cy.get('${event.selector}').type('{downarrow}');`);
            case 'ArrowLeft':
                resolve(`cy.get('${event.selector}').type('{leftarrow}');`);
            default:
                resolve(null);
        }
    })
}

// 处理改变事件
const handleChangeEvent = (event: ParsedEvent): Promise<string | null> => {
    return new Promise((resolve, _reject) => {
        if (event.inputType === 'checkbox' || event.inputType === 'radio') {
            resolve(null);
        };
        resolve(`cy.get('${event.selector}').type('${event.value.replace(/'/g, "\\'")}');`);
    })
}

// 处理提交事件
const handleSubmitEvent = (event: ParsedEvent): Promise<string> => {
    return new Promise((resolve, _reject) => {
        resolve(`cy.get('${event.selector}').submit();`);
    })
}

// 处理访问的URL
export const handleUrlEvent = (url: string) => {
    const { origin, pathname } = new URL(url);
    return `cy.url().should('contains', '${origin + pathname}');`;
}

// 处理创建访问事件
export const handleVisitEvent = (url: string) => {
    return `cy.visit('${url}');`;
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
