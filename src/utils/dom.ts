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

// 获取给定节点的comment-id集合 (暂时没用到，但是需要)
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

// 转义字符串中的 HTML 字符
export function transferStr(str: string) {
    return str.replaceAll(/[<]/gi, '&lt;')
        .replaceAll(/[>]/gi, '&gt;')
        .replaceAll(/\n/gi, '<br>')
        .replaceAll(/\s/gi, '&nbsp;')
}