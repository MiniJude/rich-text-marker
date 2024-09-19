import { MarkerOptions } from "@/components/marker/index";
import { HEAD_TAG_STRING, TAIL_TAG_STRING } from "@/utils/constant";
import { bfs } from "@/utils/vdom";
import { JSONContent, JsonToHtml, htmlToJson } from "@/utils/parser";
import { TreeHandler } from "@/utils/treeHandler";
import { hasAttrByNode } from "@/utils/vdom";

export class MarkerSelection {
    options: MarkerOptions;
    _selection: Selection | null = null;

    tempStartOffset = 0;
    tempEndOffset = 0;

    constructor(options: MarkerOptions) {
        this.options = options;
        this._selection = window.getSelection();
    }

    /**
     * 标记选区的dom范围（根据起止节点操作tree，给首尾节点加上自定义属性m-select_start 和 m-select_end的span包裹），如果是节点是公式或者图片也同样要包裹一层span方便后续合并
     * 关于startContainer和endContainer的说明：
     * 如果边界是img，那么边界对应的startContainer或endContainer将不是text节点，而是img所在的节点，可能是p或strong等等
     * 如果尾边界是新启一行的开头，则endContainer不是text节点，而是p节点
     * 如果尾边界在公式内，则很可能不是文本节点；此时要判断公式节点是否包含endContainer
     * 其他情况下，startContainer和endContainer都是text节点
     */
    tagRange = () => {
        const container = this.options.root!;
        let range = this._selection?.getRangeAt(0);

        // if start and end is the same position, range.collapsed is true  （https://developer.mozilla.org/zh-CN/docs/Web/API/Range/collapsed）
        if (!range || range?.collapsed) return;

        const { startContainer, endContainer, startOffset, endOffset } = range ?? {};

        // Ensure that both the start and end actions occur within the container
        if (!container.contains(startContainer) || !container.contains(endContainer)) return;

        // 保存startOffset, endOffset，因为后面会对选区进行操作，导致这两个值置0
        [this.tempStartOffset, this.tempEndOffset] = [startOffset, endOffset];

        const isSameContainer = startContainer === endContainer;
        let wholeNode = null;

        // set the left boundary
        if ((wholeNode = this.getWholeNode(startContainer))) {
            this.setTagToNode(wholeNode, HEAD_TAG_STRING);
        } else if (startContainer.nodeName === "#text") {
            this.setTagToNode(startContainer, HEAD_TAG_STRING);
        } else {
            // Assuming the left boundary is on the left of the image
            this.setTagToNode(startContainer.childNodes[startOffset], HEAD_TAG_STRING);

            // if the right boundary on the right of the same image
            if (endContainer.nodeName !== "#text" && isSameContainer && endOffset - startOffset === 1) {
                this.setTagToNode(endContainer.childNodes[startOffset], TAIL_TAG_STRING);
                return;
            }
        }

        // set the right boundary
        if ((wholeNode = this.getWholeNode(endContainer))) {
            this.setTagToNode(wholeNode, TAIL_TAG_STRING);
        } else if (endContainer.nodeName === "#text") {
            this.setTagToNode(endContainer, TAIL_TAG_STRING);
        } else {
            if (endOffset) {
                // the right boundary on the right of the same image
                this.setTagToNode(endContainer.childNodes[endOffset - 1], TAIL_TAG_STRING);
            } else {
                this.setTagToNode(endContainer, TAIL_TAG_STRING);
            }
        }
    };

    clearRange = (node: Node = this.options.root!) => {
        try {
            if (Reflect.has(node, "_tags")) {
                Reflect.deleteProperty(node, "_tags");
            }

            node.childNodes.forEach((childNode: ChildNode) => {
                // @ts-ignore
                if (this.options.classesAsWhole?.some((className) => childNode.classList?.contains(className))) return;

                this.clearRange(childNode);
            });
        } catch (error) {
            console.log("clearRange error", error);
        }
    };

    private getWholeNode = (node: Node) => {
        let currentElement = node.parentElement;
        const { root, classesAsWhole } = this.options;

        while (currentElement !== null) {
            if (classesAsWhole?.some((className) => currentElement!.classList.contains(className))) {
                return currentElement;
            }

            if (currentElement === root) return null;

            currentElement = currentElement.parentElement;
        }

        return null;
    };

    private setTagToNode = (node: Node, tag: string) => {
        if (!node._tags?.length) {
            node._tags = [tag];
        } else {
            node._tags.push(tag);
        }
    };

    // 更新选区的文本内容给样式（根据选区的起止节点和类名，更新选区的文本内容）
    // 定义规则：
    // 1. 状态文字全用span包裹
    // 2. span.m-select_start和span.m-select_end 内只能包含文本节点？
    getNewInnerHTMLAfterAction = (actionType: "create" | "remove", actionClassName: string): string => {
        let tree = htmlToJson(this.options.root!);
        let treeHandler = new TreeHandler(tree, {
            classesAsWhole: this.options.classesAsWhole!,
            tempStartOffset: this.tempStartOffset,
            tempEndOffset: this.tempEndOffset,
        });

        if (actionType === "create") {
            treeHandler.setWrapper(actionClassName);
        } else if(actionType === "remove") {
            treeHandler.removeWrapper(actionClassName);
        }
        bfs(tree, this.options.classesAsWhole!);
        let str = JsonToHtml(tree) as string;
        // 去掉父节点
        let l = str.indexOf(">") + 1;
        let r = str.lastIndexOf("<");
        return str.slice(l, r);
    };

    // 判单选区内是否有某一类名的节点
    hasStatus(className: string) {
        let tree = htmlToJson(this.options.root!);
        let lock = true;
        const fn = (root: any) => {
            if (!root) return;
            let type = root.type;
            if (hasAttrByNode(root, "select_start", "select_end")) {
                // 选区属于同一节点（都是文字、都是图片）
                let parent = root.parent;
                if (parent.type === "span" && parent.attributes?.class.includes(className)) {
                    throw new Error("found it");
                }
                return;
            }
            if (hasAttrByNode(root, "select_start")) {
                let parent = root.parent;
                if (parent.type === "span" && parent.attributes?.class.includes(className)) {
                    throw new Error("found it");
                }
                lock = true;
            } else if (hasAttrByNode(root, "select_end")) {
                let parent = root.parent;
                if (parent.type === "span" && parent.attributes?.class.includes(className)) {
                    throw new Error("found it");
                }
                lock = false;
            } else if (
                (type === "text" ||
                    type === "img" ||
                    this.options.classesAsWhole?.some((className) => root.attributes?.class?.includes(className))) &&
                !lock
            ) {
                let parent = root.parent;
                if (parent.type === "span" && parent.attributes?.class.includes(className)) {
                    throw new Error("found it");
                }
            }
            if (root.content.length && root.type !== "text") {
                if (this.options.classesAsWhole?.some((className) => root.attributes?.class?.includes(className))) {
                    //  如果是整节点（如公式节点），则不遍历其子节点
                    return;
                }
                for (let i = root.content.length - 1, child: JSONContent; (child = root.content[i--]); ) {
                    fn(child);
                }
            }
        };
        try {
            fn(tree);
        } catch (error: any) {
            if (error.message === "found it") return true;
        }
        return false;
    }
}
