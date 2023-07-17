import { computed, ref, Ref } from 'vue'
import { type JSONContent, HTMLParser, JSONToHTML } from '@/utils/parser'
import useDFS, { bfs } from '@/utils/useAst'
import { hasAttrByNode, setAttrByNode, findFormulaNode } from '@/utils/vdom'
export default function useRichTextMarker(container: Ref<Element | undefined>) {

    const selection = ref<Selection | null>()
    const text = computed(() => selection.value?.toString() ?? '')
    const range = computed(() => selection.value?.getRangeAt(0) ?? null) // Selection API规范要求选择的内容始终（仅）具有一个范围，所以这里不考虑多个区域
    const rect = computed(() => selection.value?.getRangeAt(0).getBoundingClientRect() ?? null)

    let tempStartOffset = 0, tempEndOffset = 0

    // 判断选区是否合法
    async function valid() {
        if (!container.value) return false
        selection.value = null // fix: 保证selection.value变化
        selection.value = window.getSelection()
        const isValid = await correctSelection()
        if (!isValid) {
            console.log('warning: selection is invalid') // TODO：这里要清空用于标记选区的自定义属性
            return false
        }
        return true
    }

    // 判断选中内容是否全部属于某个组件节点，如果不是则清空选中内容
    async function correctSelection() {
        return new Promise((resolve) => {
            setTimeout(() => {
                if (!range.value || range.value?.collapsed) {
                    return resolve(false)
                }
                const { startContainer, endContainer } = range.value
                let flag = container.value!.contains(startContainer) && container.value!.contains(endContainer)
                if (!flag) {
                    selection.value = null
                    return resolve(false)
                }
                return resolve(true)
            }, 100);
        })
    }

    // 标记选区的dom范围（根据起止节点操作tree，给首尾节点加上自定义属性m-select_start 和 m-select_end的span包裹），如果是节点是公式或者图片也同样要包裹一层span方便后续合并
    // 关于startContainer和endContainer的说明：
    // 如果边界是img，那么边界对应的startContainer或endContainer将不是text节点，而是img所在的节点，可能是p或strong等等
    // 如果尾边界是新启一行的开头，则endContainer不是text节点，而是p节点
    // 如果尾边界在公式内，则很可能不是文本节点；此时要判断公式节点是否包含endContainer
    // 其他情况下，startContainer和endContainer都是text节点
    function tagRange() {
        if (!range.value) return
        const { collapsed, startContainer, endContainer, startOffset, endOffset } = range.value ?? {}
        if (collapsed || !startContainer || !endContainer) return
        // 保存startOffset, endOffset，因为后面会对选区进行操作，导致这两个值置0
        tempStartOffset = startOffset
        tempEndOffset = endOffset
        let isSameContainer = (startContainer === endContainer);
        let formulaNode = null
        // 判断左边界
        if (formulaNode = findFormulaNode(startContainer)) {
            setAttrByNode(formulaNode, 'select_start')
        } else if (startContainer.nodeName === '#text') {
            setAttrByNode(startContainer, 'select_start')
        } else {
            // 认为左边界在img左侧
            setAttrByNode(startContainer.childNodes[startOffset] as HTMLElement, 'select_start')
            // 如果右边界在这个img右侧， 注意：是同一个img
            if (endContainer.nodeName !== '#text' && isSameContainer && ((endOffset - startOffset) === 1)) {
                setAttrByNode(endContainer.childNodes[startOffset] as HTMLElement, 'select_end')
                return
            }
        }
        // 判断右边界
        if (formulaNode = findFormulaNode(endContainer)) {
            setAttrByNode(formulaNode, 'select_end')
        } else if (endContainer.nodeName === '#text') {
            setAttrByNode(endContainer, 'select_end')
        } else {
            if (endOffset) {
                // 右边界在img右侧
                setAttrByNode(endContainer.childNodes[endOffset - 1] as HTMLElement, 'select_end')
            } else {
                setAttrByNode(endContainer as HTMLElement, 'select_end')
            }
        }
    }

    // 更新选区的文本内容给样式（根据选区的起止节点和类名，更新选区的文本内容）
    // 定义规则：
    // 1. 状态文字全用span包裹
    // 2. span.m-select_start和span.m-select_end 内只能包含文本节点？
    async function updateStrByClassName(className: string = 'm_underline') {
        if (!range.value || !container.value) return
        let tree = await HTMLParser(container.value)
        const { addStatus, deleteStatus } = useDFS(tempStartOffset, tempEndOffset, className)
        if (className.startsWith('m_')) {
            addStatus(tree)
        } else if (className.startsWith('d_')) {
            deleteStatus(tree)
        }
        bfs(tree)
        let str = await JSONToHTML(tree) as string
        // 去掉父节点
        let l = str.indexOf('>') + 1
        let r = str.lastIndexOf('<')
        return str.slice(l, r)
    }

    // 判单选区内是否有某一类名的节点
    async function hasStatus(className: string) {
        if (!range.value || !container.value) return
        let tree = await HTMLParser(container.value)
        let lock = true
        const fn = (root: any) => {
            if (!root) return
            let type = root.type
            if (hasAttrByNode(root, 'select_start', 'select_end')) {
                // 选区属于同一节点（都是文字、都是图片）
                let parent = root.parent
                if (parent.type !== 'span') {
                    // 如果父节点不是span节点，说明其没有任何状态
                } else {
                    // 如果有状态span节点

                    if (parent.attributes?.class.includes(className)) {
                        // 如果该状态节点已有该状态， 通过抛出异常的方式来中断整棵树的遍历
                        console.log('找到了')
                        throw new Error('找到了')
                    } else { }
                }
                return
            }

            if (hasAttrByNode(root, 'select_start')) {
                let parent = root.parent
                if (parent.type !== 'span') {
                } else {
                    // 如果有状态span节点

                    if (parent.attributes?.class.includes(className)) {
                        console.log('找到了')
                        throw new Error('找到了')
                    } else { }
                }
                lock = true
            } else if (hasAttrByNode(root, 'select_end')) {
                let parent = root.parent
                if (parent.type !== 'span') {
                } else {
                    // 如果有状态span节点

                    if (parent.attributes?.class.includes(className)) {
                        console.log('找到了')
                        throw new Error('找到了')
                    } else {
                    }
                }
                lock = false
            } else if ((type === 'text' || type === 'img' || root.attributes?.class?.includes('ql-formula')) && !lock) {
                let parent = root.parent
                // 选区中间的节点（既不是开头也不是结尾）

                if (parent.type !== 'span') {
                } else {
                    console.log('找到了')
                    throw new Error('找到了')
                }
            }
            if (root.content.length && root.type !== 'text') {
                if (root.attributes?.class?.includes('ql-formula')) return //  如果是公式的节点，不遍历其子节点
                for (let i = root.content.length - 1, child: JSONContent; child = root.content[i--];) {
                    fn(child)
                }
            }
        }
        try {
            fn(tree)
        } catch (error: any) {
            if (error.message === '找到了') return true
        }
        return false
    }


    return {
        length,
        text,
        rect,
        range,
        valid,
        tagRange,
        updateStrByClassName,
        hasStatus
    }
}