// 选区标记
export enum SelectionBoundaryEnum {
    START = 'data-select_start',
    END = 'data-select_end'
}

// 评论
export interface Comment {
    key: string
    title: string // 选中的html内容
}