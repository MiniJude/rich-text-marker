<template>
    <div ref="containerRef" class="rich_text_marker">
        <div ref="markerRef" v-html="modelValue" @mousedown="startTiming" @mouseup="handleMouseUp"></div>
    </div>
</template>
<script lang="ts" setup>
import { ref, nextTick } from 'vue'
import useClickOrSelect, { OperateTypeEnum } from '@/hooks/useClickOrSelect';
import useRecords from '@/hooks/useRecords';
import useSelection from '@/hooks/useSelection';
import Toolbar, { Config } from '@/Toolbar/index';
import { uuid, clearCustomAttributes } from '@/utils/domUtils.ts'
const props = defineProps<{
    modelValue: string
}>()
const emits = defineEmits<{
    (e: 'update:modelValue', value: string): void
    (e: 'takeComment', value: Comment): void
    (e: 'reset'): void
}>()

const containerRef = ref<HTMLElement>()
const markerRef = ref<HTMLElement>()

// 初始化历史记录
const Records = useRecords(props.modelValue, (str: string) => emits('update:modelValue', str))

// 选区
const Selection = useSelection(markerRef)

// 区分点击和选中
const { startTiming, endTiming } = useClickOrSelect()
function handleMouseUp() {
    endTiming() === OperateTypeEnum.SELECT ? handleSelect() : handleClick()
}

// 获取toolbar配置
async function getToolbarConfig() {
    let config = [Config.m_underline, Config.m_comment]
    let hasUnderline = await Selection.hasStatus('m_underline')
    if (hasUnderline) {
        // 如果值为true说明选区内有划线， 添加删除划线的选项
        config.splice(1, 0, Config.d_underline)
    }
    return config
}

// 计算工具条样式
function getToolbarPosition() {
    try {
        // 获取containerRef的getBoundingClientRect
        const { x: x1, y: y1 } = containerRef.value!.getBoundingClientRect()
        const { x: x2, y: y2, width: width2 } = Selection.rect.value!
        return {
            left: x2 - x1 + (width2 - 70) / 2 + 'px',
            top: y2 - y1 - 50 + 'px'
        }
    } catch (error) {
        return {
            left: '0px',
            top: '0px'
        }
    }
}

async function handleSelect() {
    console.log('handleSelect')
    let isValid = await Selection.valid()
    if (!isValid) return
    Selection.tagRange() // 标记选区
    try {
        let config = await getToolbarConfig()
        let textTypeName = await Toolbar.show(containerRef.value!, {
            style: getToolbarPosition(),
            config
        })
        console.log(textTypeName)
        let key
        switch (textTypeName) {
            case Config.m_underline:
                await Selection.updateStrByClassName('m_underline')
                break
            case Config.m_comment:
                // 生成唯一comment-id-xxx,
                key = 'm_comment-id-' + uuid()
                await Selection.updateStrByClassName(key)
                break
            case Config.d_underline:
                await Selection.updateStrByClassName('d_underline')
                break
        }
        // 等待工具栏操作
        emits('update:modelValue', Selection.richText.value)
        await nextTick()
        // key存在 及批注情况下暴露出批注的title
        if (key) {
            const titleElemArr = containerRef.value?.querySelectorAll(`.${key}`)
            const title = Array.from(titleElemArr!).reduce(
                (prev, current) => prev + current.innerHTML,
                ''
            )
            emits('takeComment', { key, title: title || '' } as Comment)
        }
        Records.push(Selection.richText.value)
        Toolbar.close()
    } catch (error) {
        console.log('取消：', error)
        // 如果取消，纯操作dom来清空自定义标记属性
        clearCustomAttributes(containerRef.value)
        Toolbar.close()
    }
}
function handleClick() {
    console.log('click')
}
</script>