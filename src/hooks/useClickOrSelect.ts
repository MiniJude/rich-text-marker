import { MOUSEUP_TIME_DIVIDE } from '@/config'
export enum OperateTypeEnum {
    CLICK = 'click',
    SELECT = 'select'
}
export default () => {
    let stamp = 0

    function startTiming() {
        stamp = Date.now()
    }

    function endTiming() {
        const now = Date.now()
        if (now - stamp > MOUSEUP_TIME_DIVIDE) {
            // 选区
            return OperateTypeEnum.SELECT
        } else {
            // 点击
            return OperateTypeEnum.CLICK
        }
    }

    return {
        startTiming,
        endTiming
    }
}