/**
 * @file 代码操作器
 */

import { RecState } from "~/constants";
import type { ICodeBlock } from "~/interface";

export default class codeOperation {
    recStatus: RecState = RecState.Off

    codeBlocks: ICodeBlock[] = []

    constructor() {
        this.init()
    }

    init() {
        return new Promise<void>((resolve) => {
            browser.storage.local.get(['recStatus', 'codeBlocks']).then((result: any) => {
                if (result.recStatus === RecState.Off) {
                    this.recStatus = result.recStatus
                    this.codeBlocks = []
                } else {
                    this.recStatus = RecState.Paused
                    this.codeBlocks = result.codeBlocks
                }

                browser.storage.local.set({
                    recStatus: this.recStatus,
                    codeBlocks: this.codeBlocks
                }).then(resolve())
            })
        })
    }

    resetState() {
        return new Promise<void>((resolve) => {
            this.recStatus = RecState.Off
            this.codeBlocks = []

            browser.storage.local.set({
                recStatus: this.recStatus,
                codeBlocks: this.codeBlocks
            }).then(resolve())
        })
    }

    addCodeBlock(block: ICodeBlock) {
        return new Promise((resolve) => {
            this.codeBlocks.push(block)

            browser.storage.local.set({
                codeBlocks: this.codeBlocks
            }).then(resolve(block))
        })
    }

    popTwoCodeBlock() {
        return new Promise<void>((resolve) => {
            this.codeBlocks.splice(this.codeBlocks.length - 2, 2)

            browser.storage.local.set({
                codeBlocks: this.codeBlocks
            }).then(resolve())
        })
    }

    updateState(newState: RecState) {
        return new Promise<void>((resolve) => {
            this.recStatus = newState

            browser.storage.local.set({
                recStatus: this.recStatus
            }).then(resolve())
        })
    }

    /** TODO@WZL */
    delCodeBlock(index: number) {
        return new Promise<void>((resolve) => {
            this.codeBlocks.splice(index, 1)

            browser.storage.local.set({
                codeBlocks: this.codeBlocks
            }).then(resolve())
        })
    }

    /** TODO@WZL */
    moveCodeBlock(i: number, j: number) {
        return new Promise<void>((resolve) => {
            const dragged = this.codeBlocks.splice(i, 1)[0]
            this.codeBlocks.splice(j, 0, dragged)

            browser.storage.local.set({
                codeBlocks: this.codeBlocks
            }).then(resolve())
        })
    }
}
