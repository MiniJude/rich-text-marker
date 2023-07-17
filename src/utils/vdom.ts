import { HTMLParser, JSONToHTML } from "./parser"
import { bfs } from './useAst'


// 使用DOMParser根据html字符串生成node节点
export function createNodeByStr(str: string) {
    const parser = new DOMParser()
    const doc = parser.parseFromString(str, 'text/html')
    return doc.body.firstChild
}

// 根据event对象和类名拿到最近的拥有该类名的父节点，然后用它的子节点替换它
export function clearNodeByEvent(event: MouseEvent, className: string) {
    const target = event.target as HTMLElement
    const parent = target.closest(`.${className}`)
    if (!parent) return
    const node = createNodeByStr(parent.innerHTML)
    parent.replaceWith(node)
}

export function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
    })
}

// 获取className字符串中的m-comment-ids
export function getCommentIdsByClassName(className: string): string[] {
    let prefix = 'm_comment-id-'
    let classList = className.split(' ')
    let ids: string[] = classList.filter(item => {
        return item.startsWith(prefix)
    }).map(item => {
        return item.trim()
    })
    return ids
}

// 获取给定节点的comment-id集合
export function getCommentIdsByNode(node: HTMLElement): string[] {
    let ans: string[] = []
    const findCommentIds = (node: HTMLElement) => {
        let ids = getCommentIdsByClassName(node.className)
        if (ids.length) {
            ans.push(...ids)
            return
        }
        if (node.parentElement?.tagName === 'P') return
        if (node.parentElement) {
            findCommentIds(node.parentElement)
        }
    }
    findCommentIds(node)
    return ans
}

// 给给定dom节点添加自定义属性
export function setAttrByNode(node: any, ...args: string[]) {
    args.forEach(key => {
        if (!node.attributes) {
            node.attributes = { [`data-${key}`]: '' }
        } else {
            node.attributes[`data-${key}`] = ''
        }
    })
}

// 判断某个dom节点是否有某些自定义属性
export function hasAttrByNode(node: any, ...args: string[]) {
    return args.every(key => Object.keys(node.attributes ?? {}).includes(('data-' + key)))
}

// 清除某个dom节点（包括其子节点）的自定义属性（data-select_start  data-select_end）
export function clearCustomAttributes(node: any) {
    try {
        if (!node) {
            return;
        }
        // 清除自定义属性
        if (node.attributes?.hasOwnProperty('data-select_start')) {
            delete node.attributes['data-select_start']
        }

        if (node.attributes?.hasOwnProperty('data-select_end')) {
            delete node.attributes['data-select_end']
        }

        // 递归清除子节点的自定义属性
        if (node.childNodes?.length) {
            for (let i = 0, childNode = null; childNode = node.childNodes[i++];) {
                if (childNode?.className?.includes('ql-formula')) continue
                clearCustomAttributes(childNode);
            }
        }
    } catch (error) {
        console.log('clearCustomAttributes error', error)
    }
}


// 判断某个dom节点是否已有状态标注
export function hasStatusByNode(node: any, ...args: string[]) {
    if (!node.attributes) return false
    if (args.length) {
        return args.every(key => Object.keys(node.attributes ?? {}).includes((key)))
    }
    return Object.keys(node.attributes).some(key => key.startsWith('m_'))
}

// 叠加状态类名标注
export function addStatusByNode(node: any, status: string) {
    if (!node.attributes) {
        node.attributes = {
            class: status
        }
        return
    }
    if (!node.attributes.class?.trim()) {
        node.attributes.class = status
        return
    }
    if (node.attributes.class.includes(status)) return
    node.attributes.class += ` ${status}`
}

export function addStatusByNodeLeftIndex(node: any, status: string, l: number) {
    // 暂认为能走到这个函数，一定是需要一分为二的
    let oldTextObj = node.content[0]
    let suffix = oldTextObj.content.slice(l)
    oldTextObj.content = oldTextObj.content.slice(0, l)
    node.parent.content.splice(node.index + 1, 0, copyNode(node, suffix, status))
}
export function addStatusByNodeRightIndex(node: any, status: string, r: number) {
    // 暂认为能走到这个函数，一定是需要一分为二的
    let oldTextObj = node.content[0]
    let prefix = oldTextObj.content.slice(0, r)
    oldTextObj.content = oldTextObj.content.slice(r)
    node.parent.content.splice(node.index, 0, copyNode(node, prefix, status))
}
export function addStatusByNodeLeftAndRightIndex(node: any, status: string, l: number, r: number) {
    // 暂认为能走到这个函数，一定是需要一分为三的
    let oldTextObj = node.content[0]
    let prefix = oldTextObj.content.slice(0, l),
        suffix = oldTextObj.content.slice(r),
        middle = oldTextObj.content.slice(l, r)
    if (suffix) node.parent.content.splice(node.index + 1, 0, copyNode(node, suffix))
    if (middle) node.parent.content.splice(node.index, 1, copyNode(node, middle, status))
    if (prefix) node.parent.content.splice(node.index, 0, copyNode(node, prefix))
}

function copyNode(node: any, text: string, status?: string) {
    let { attributes: { class: oldClass }, ...newNode } = node
    newNode.attributes = {
        class: oldClass,
    }
    newNode.content = [{
        type: 'text',
        content: text,
        parent: newNode,
    }]
    if (status) newNode.attributes.class += ` ${status}`
    return newNode
}

function isOnlyOneClass(spanNode: any) {
    return spanNode.attributes?.class?.split(' ')?.length === 1
}

export function deleteStatusByNode(node: any, status: string) {
    // node期望是图片节点/公式节点/文本节点（只存在一种），期望它的父级一定有至少一个状态标注
    if (node.type === 'text') {
        node.content = transferStr(node.content)
    }
    let parent = node.parent,
        grandParent = parent.parent
    if (isOnlyOneClass(parent)) {
        // 如果父级只有一个状态标注，则提升
        grandParent.content.splice(parent.index + 1, 0, node)
        parent.content.splice(node.index, 1)
        if (parent.content.length === 0) {
            grandParent.content.splice(parent.index, 1)
        }
    } else {
        // 否则删除父级的该状态标注
        parent.attributes.class = removeClass(parent.attributes.class, status)
    }
}

export function deleteStatusByNodeLeftAndRightIndex(node: any, status: string, l: number, r: number) {
    // 暂认为能走到这个函数，一定是需要一分为三的
    let parent = node.parent,
        grandParent = parent.parent,
        className = parent.attributes.class
    if (node.type === 'img' || isformulaNode(node)) {
        // 如果是图片则直接提升，或减父级状态（看父级类名个数）
        if (isOnlyOneClass(parent)) {
            if (node.index !== parent.content.length - 1) {
                let suffixSpan = {
                    type: 'span',
                    attributes: parent.attributes,
                    content: parent.content.slice(node.index + 1)
                }
                grandParent.content.splice(parent.index + 1, 0, suffixSpan)
            }
            grandParent.content.splice(parent.index, 1, node)
            if (node.index !== 0) {
                let suffixSpan = {
                    type: 'span',
                    attributes: parent.attributes,
                    content: parent.content.slice(0, node.index)
                }
                grandParent.content.splice(parent.index, 0, suffixSpan)
            }

        } else {
            // 否则删除父级的该状态标注
            parent.attributes.class = removeClass(parent.attributes.class, status)
        }
    } else if (node.type === 'text') {
        // 如果是文字可能会一份为三（看起始点）
        let text = node.content
        let prefix = transferStr(text.slice(0, l)),
            suffix = transferStr(text.slice(r)),
            middle = transferStr(text.slice(l, r))
        // if (suffix) {
        //     parent.content.splice(node.index + 1, 0, { type: 'text', content: suffix })
        //     // grandParent.content.splice(parent.index + 1, 0, generateSingleSonSpanNode(suffix, className))
        // }
        // if (middle) {
        //     if (isOnlyOneClass(parent)) {
        //         grandParent.content.splice(parent.index, 0, {
        //             type: 'text',
        //             content: middle
        //         })

        //     } else {
        //         grandParent.content.splice(parent.index, 1, generateSingleSonSpanNode(middle, removeClass(className, status)))
        //     }
        // }
        // if (prefix) {
        //     if (isOnlyOneClass(parent)) {
        //         grandParent.content.splice(parent.index, 0, generateSingleSonSpanNode(prefix, className))
        //     }
        // }
        // parent.content.splice(node.index, 1)
        let suffixSpanContent = parent.content.splice(node.index + 1)
        if (suffix) suffixSpanContent.unshift({ type: 'text', content: suffix })

        let prefixSpanContent = parent.content.splice(0, node.index)
        if (prefix) prefixSpanContent.push({ type: 'text', content: prefix })

        let mid;
        if (isOnlyOneClass(parent)) {
            mid = {
                type: 'text',
                content: middle,
            }
        } else {
            mid = {
                type: 'span',
                attributes: { class: removeClass(className, status) },
                content: [{ type: 'text', content: middle }]
            }
        }
        grandParent.content.splice(parent.index, 1, {
            type: 'span',
            attributes: { class: className },
            content: prefixSpanContent
        }, mid, {
            type: 'span',
            attributes: { class: className },
            content: suffixSpanContent
        })
    }
}

export function deleteStatusByNodeLeftIndex(node: any, status: string, l: number) {
    // 暂认为能走到这个函数，一定是需要一分为二的
    // node期望是text或者img，其父级一定有至少一个状态标注
    let parent = node.parent,
        grandParent = parent.parent,
        className = parent.attributes.class
    // 如果是img则直接提升，或减父级状态（看父级类名个数）
    if (node.type === 'img' || isformulaNode(node)) {
        if (isOnlyOneClass(parent)) {
            // 如果父级只有一个状态标注且图片在最左边，则提升
            if (node.index === 0) {
                grandParent.content.splice(parent.index, 1, node)
            } else {
                // 从父级中移除该节点
                parent.content.splice(node.index, 1)
                // 向祖父级插入该节点
                grandParent.content.splice(parent.index + 1, 0, node)
            }
        } else {
            // 如果父级有多个状态标注
            if (node.index === 0) {
                // 如果图片在parent的最左边
            } else {

            }
            // 否则删除父级的该状态标注
            // parent.attributes.class = removeClass(parent.attributes.class, status)
        }
    } else if (node.type === 'text') {
        // 如果是文字可能会一分为二（看起始点）
        let text = node.content
        let prefix = transferStr(text.slice(0, l)),
            suffix = transferStr(text.slice(l))
        if (suffix) {
            if (isOnlyOneClass(parent)) {
                grandParent.content.splice(parent.index + 1, 0, { type: 'text', content: suffix })
            } else {
                grandParent.content.splice(parent.index, 0, generateSingleSonSpanNode(suffix, removeClass(className, status)))
            }
        }
        if (prefix) {
            node.content = prefix
        } else {
            parent.content.splice(node.index, 1)
        }
    }
}

export function deleteStatusByNodeRightIndex(node: any, status: string, r: number) {
    // 暂认为能走到这个函数，一定是需要一分为二的
    // node期望是text或者img，其父级一定有至少一个状态标注
    let parent = node.parent,
        grandParent = parent.parent,
        className = parent.attributes.class
    // 如果是img则直接提升，或减父级状态（看父级类名个数）

    if (node.type === 'img' || isformulaNode(node)) {
        if (isOnlyOneClass(parent)) {
            let suffixSpanContent = parent.content.splice(node.index + 1)
            grandParent.content.splice(parent.index + 1, 0, {
                type: 'span',
                attributes: { class: className },
                content: suffixSpanContent
            })
            grandParent.content.splice(parent.index + 1, 0, node)

            parent.content.splice(node.index, 1)

        } else {
            // 如果父级有多个状态标注
            if (node.index === parent.content.length - 1) {
                // 如果图片在parent的最右边
            } else {

            }
            // 否则删除父级的该状态标注
            // parent.attributes.class = removeClass(parent.attributes.class, status)
        }
    } else if (node.type === 'text') {
        // 如果是文字可能会一份为二（看起始点）
        let text = node.content
        let prefix = transferStr(text.slice(0, r)),
            suffix = transferStr(text.slice(r))
        if (isOnlyOneClass(parent)) {
            let suffixSpanContent = parent.content.splice(node.index + 1)
            if (suffix) suffixSpanContent.unshift({ type: 'text', content: suffix })
            grandParent.content.splice(parent.index + 1, 0, {
                type: 'text',
                content: prefix
            }, {
                type: 'span',
                attributes: { class: className },
                content: suffixSpanContent
            })
            parent.content.splice(node.index, 1)
        } else {
            grandParent.content.splice(parent.index + 1, 0, generateSingleSonSpanNode(suffix, className))
        }
        // if (prefix) {
        //     if (isOnlyOneClass(parent)) {
        //         // 如果文字在parent的最左边
        //         if (node.index === 0) {
        //             grandParent.content.splice(parent.index, 0, {
        //                 type: 'text',
        //                 content: prefix
        //             })
        //             parent.content.splice(node.index, 1)
        //         } else {
        //             // 从父级中移除该节点
        //             parent.content.splice(node.index, 1)
        //             // 向祖父级插入该节点
        //             grandParent.content.splice(parent.index + 1, 0, {
        //                 type: 'text',
        //                 content: prefix
        //             })
        //         }
        //     } else {
        //         grandParent.content.splice(parent.index, 1, generateSingleSonSpanNode(prefix, removeClass(className, status)))
        //     }
        // }
    }
    // todo：公式暂未考虑
}


// 生成新的包裹文本或者图片的span状态节点
function generateSingleSonSpanNode(content: any, className: string) {
    return {
        type: 'span',
        attributes: {
            class: className
        },
        content: [{
            type: Array.isArray(content) ? 'img' : 'text',
            content
        }]
    }
}


function reduceNode(node: any, text: string, status?: string) {
    let { attributes: { class: oldClass }, ...newNode } = node
    if (oldClass.split(' ').length === 1) {
        // 判断oldClass长度如果是1说明这个，说明这个状态就是待删除的状态，删除后要提升节点
        if (status) {
            newNode = { ...node.content[0] }
            newNode.parent = node.parent
            newNode.content = text
        } else {
            if (!status) {
                newNode.attributes = { class: oldClass }
                newNode.content[0].content = text
            }
        }
    } else {
        // 否则只要删除对应状态类名
        newNode.attributes = {
            class: oldClass,
        }
        newNode.content = [{
            type: 'text',
            content: text,
            parent: newNode,
        }]
        if (status) {
            newNode.attributes.class = removeClass(newNode.attributes.class, status)
        }
    }

    return newNode
}

function removeClass(classString: string, classToRemove: string) {
    let classArray = classString.split(' ').map(i => i.trim())
    let filteredArray = classArray.filter((className) => className !== classToRemove.trim())
    return filteredArray.join(' ')
}

// 删除node中指定的class，如果删除后没有状态，则需要提升子节点
export async function getHtmlStrByNeedRemovedKey(node: HTMLElement, classToRemove: string) {
    let tree = await HTMLParser(node)
    console.log(tree);
    const fn = (root: any) => {
        // 广度优先遍历
        if (!root || !root.content?.length) return
        const queue = [root]
        while (queue.length) {
            const currentNode = queue.shift()!
            if (currentNode.type === 'span' && currentNode.attributes?.class?.includes(classToRemove)) {
                if (isOnlyOneClass(currentNode)) {
                    // 如果父级只有一个状态标注，则提升
                    currentNode.parent.content.splice(currentNode.index, 1, ...currentNode.content)
                } else {
                    // 否则删除父级的该状态标注
                    currentNode.attributes.class = removeClass(currentNode.attributes.class, classToRemove)
                }
            }
            if (currentNode.type === 'text' || currentNode.attributes?.class?.includes('ql-formula')) {
                continue
            } else if (currentNode.content?.length) {
                queue.push(...currentNode.content)
            }
        }
    }
    fn(tree)
    bfs(tree)
    let str = await JSONToHTML(tree) as string
    // 去掉父节点
    let l = str.indexOf('>') + 1
    let r = str.lastIndexOf('<')
    return str.slice(l, r)
}

// 判断是否是公式节点
export function isformulaNode(node: any) {
    return node?.attributes?.class?.includes('ql-formula')
}

// 查找给定（原生）节点的第一个公式父级节点
export function findFormulaNode(node: any) {
    let currentNode = node;

    while (currentNode !== null) {
        // 检查当前节点是否具有类名 "ql-formula"
        if (currentNode.classList && currentNode.classList.contains("ql-formula")) {
            // 找到符合条件的节点
            return currentNode;
        }

        // 检查是否遇到类名为 ".rich-text-marker" 的节点
        if (currentNode.classList && currentNode.classList.contains("rich-text-marker")) {
            // 停止向上查找，返回 null
            return null;
        }

        currentNode = currentNode.parentNode;
    }

    // 没有找到符合条件的节点
    return null;
}


// 判断字符串是否为 HTML 字符串
export function isHTMLString(str: string): boolean {
    const pattern = /<[a-z][\s\S]*>/i;
    return pattern.test(str);
}

// 转义字符串中的 HTML 字符
export function transferStr (str: string) {
    return str.replaceAll(/[<]/gi, '&lt;')
        .replaceAll(/[>]/gi, '&gt;')
        .replaceAll(/\n/gi, '<br>')
        .replaceAll(/\s/gi, '&nbsp;')
}