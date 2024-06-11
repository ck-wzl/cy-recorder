/**
 * @file 所有的类型约束文件
 */

// popup里面代码块的类型
export interface ICodeBlock {
    code: string;
    prompt: string;
}

// helper中事件的类型
export interface ParsedEvent {
    selector: string,
    action: string,
    tag: string,
    value: string,
    id?: string,
    key?: string,
    href?: string,
    inputType?: string,
    [key: string]: string | undefined; // 添加字符串索引签名
}
