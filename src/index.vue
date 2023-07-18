<template>
    <div ref="containerRef" class="rich_text_marker">
        <div ref="markerRef" v-html="modelValue" @mousedown="startTiming" @mouseup="handleMouseUp"></div>
    </div>
</template>
<script lang="ts" setup>
import { ref, nextTick } from 'vue'
import '@/Toolbar/index.less'
import useClickOrSelect, { OperateTypeEnum } from '@/hooks/useClickOrSelect'
import useRecords from '@/hooks/useRecords'
import useSelection from '@/hooks/useSelection'
import Toolbar, { type Config } from '@/Toolbar/index'
import { uuid } from '@/utils/common'
import { clearCustomAttributes } from '@/utils/dom'
import type { CommentModel } from '@/types/index'
const props = defineProps<{
    modelValue: string
}>()
const emits = defineEmits<{
    (e: 'update:modelValue', value: string): void
    (e: 'takeComment', value: CommentModel): void
    (e: 'reset'): void
}>()

const containerRef = ref<HTMLElement>()
const markerRef = ref<HTMLElement>()
const Records = useRecords(props.modelValue, (str: string) => emits('update:modelValue', str))
const Selection = useSelection(markerRef)

// distingush click or select
const { startTiming, endTiming } = useClickOrSelect()
function handleMouseUp() {
    endTiming() === OperateTypeEnum.SELECT ? handleSelect() : handleClick()
}

const toolbarConfig: Config[] = [
    {
        label: '划线',
        isShow: true,
        executeFn: async () => {
            let ans = await Selection.updateStrByClassName('m_underline')
            Records.push(ans as string)
        }
    },
    {
        label: '取消划线',
        isShow: () => Selection.hasStatus('m_underline'),
        executeFn: async () => {
            let ans = await Selection.updateStrByClassName('d_underline')
            Records.push(ans as string)
        }
    },
    {
        label: '写批注',
        isShow: true,
        executeFn: async () => {
            let commentId = 'm_comment-id-' + uuid()
            let ans = await Selection.updateStrByClassName(commentId)
            Records.push(ans as string)
            await nextTick() // wait for dom update to get title
            const titleElemArr = containerRef.value?.querySelectorAll(`.${commentId}`)
            const title = Array.from(titleElemArr!).reduce((prev, current) => prev + current.innerHTML, '')
            emits('takeComment', { key: commentId, title: title || '' })
        }
    },
]

// calculate toolbar position
function getToolbarPosition() {
    try {
        const { x: x1, y: y1 } = containerRef.value!.getBoundingClientRect()
        const { x: x2, y: y2, width: width2 } = Selection.rect.value!
        return { left: x2 - x1 + (width2 - 70) / 2 + 'px', top: y2 - y1 - 50 + 'px' }
    } catch (error) {
        return { left: '0px', top: '0px' }
    }
}

async function handleSelect() {
    console.log('select')
    let isValid = await Selection.valid()
    if (!isValid) return
    Selection.tagRange() // tag range
    try {
        let isShowList = await Promise.all(toolbarConfig.map(i => typeof i.isShow === 'function' ? i.isShow() : i.isShow))
        let textTypeName = await Toolbar.show(containerRef.value!, {
            style: getToolbarPosition(),
            config: toolbarConfig.filter((item, index) => isShowList[index])
        })
        console.log(textTypeName)
        toolbarConfig.find(item => item.label === textTypeName)?.executeFn()
    } catch (error) {
        console.log(error)
        // clear custom attributes when error or cancel
        clearCustomAttributes(containerRef.value)
    }
    Toolbar.close()
}

function handleClick() {
    console.log('click')
}
</script>

<style lang="less">
.m_underline {
    border-bottom: 2px solid blue;
}

[class*='m_comment-id-'] {
    background-color: #ccd7fa;
    cursor: pointer;
}
</style>

<style lang="less" scoped>
.rich_text_marker {
    position: relative;
    display: inline-block;
    vertical-align: text-top;
    padding-right: 50px;

    p {
        margin-bottom: 6px;
    }

    &:hover .clear {
        opacity: 1;
    }

    .clear {
        position: absolute;
        top: 2px;
        right: 10px;
        cursor: pointer;
        opacity: 0;
        transition: all ease .3s;
    }
}
</style>@/utils/domV