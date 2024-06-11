/**
 * @file 常量文件
 */

// 录制状态
export enum RecState {
    On = "on", // 录制中
    Off = "off", // 录制结束
    Paused = "paused", // 录制暂停
}

// 操作状态
export enum ActionState {
    Start = 'start', // 开始
    Pause = 'pause', // 暂停
    Resume = 'resume', // 继续
    Reset = 'reset', // 重置
    Add = 'add', // 添加代码
    Move = 'move', // 移动代码
    Delete = 'delete', // 删除代码
}

// 内容形式
export enum ContentType {
    Code = 'code',
    Prompt = 'prompt',
}

// 键鼠操作事件
export enum EventType {
    Click = 'click',
    DblClick = 'dblclick',
    KeyDown = 'keydown',
    Change = 'change',
    Submit = 'submit',
}
