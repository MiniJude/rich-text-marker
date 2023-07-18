import { HTMLParser, JSONToHTML } from './parser'
import { isOnlyOneClass, removeClass } from './vdom'
import { bfs } from './useAst'

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