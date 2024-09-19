import { HEAD_TAG_STRING, TAIL_TAG_STRING } from "./constant";
import {
    addStatusByNode,
    addStatusByNodeLeftAndRightIndex,
    addStatusByNodeLeftIndex,
    addStatusByNodeRightIndex,
} from "./dom";
import { JSONContent } from "./parser";
import { hasTags } from "./tags";
import {
    deleteStatusByNode,
    deleteStatusByNodeLeftAndRightIndex,
    deleteStatusByNodeLeftIndex,
    deleteStatusByNodeRightIndex,
    isWholeNode,
    transferStr,
    hasStatusByNode,
} from "./vdom";

interface TreeHandlerOptions {
    /** classes that should be as a whole node, eg: ['ql-formula'] */
    classesAsWhole: string[];
    tempStartOffset: number;
    tempEndOffset: number;
}

export class TreeHandler {
    tree: JSONContent;
    options: TreeHandlerOptions;

    constructor(tree: JSONContent, options: TreeHandlerOptions) {
        this.tree = tree;
        this.options = options;
    }

    setWrapper = (className: string) => {
        const { tempStartOffset, tempEndOffset, classesAsWhole } = this.options;

        let lock = true;
        let fn = (root: any) => {
            if (!root) return;
            let index = root.index,
                type = root.type,
                spanWrapper = null;
            if (hasTags(root, HEAD_TAG_STRING, TAIL_TAG_STRING)) {
                // 选区属于同一节点（都是文字、都是图片）
                let parent = root.parent;
                if (parent.type !== "span") {
                    if (type === "text") {
                        if (parent.attributes?.class?.includes(className)) return; // 重复状态
                        const sentence = root.content;
                        const prefix = transferStr(sentence.slice(0, tempStartOffset));
                        const selected = transferStr(sentence.slice(tempStartOffset, tempEndOffset));
                        const suffix = transferStr(sentence.slice(tempEndOffset));
                        // 插入状态节点
                        spanWrapper = {
                            type: "span",
                            attributes: { class: className },
                            content: [
                                {
                                    type: "text",
                                    content: selected,
                                    parent: null as any,
                                    index: 0,
                                },
                            ],
                            parent,
                            index,
                        };
                        spanWrapper.content[0].parent = spanWrapper;
                        parent.content[index] = spanWrapper;

                        if (tempStartOffset) {
                            parent.content.splice(index, 0, {
                                type: "text",
                                content: prefix,
                                parent,
                                index,
                            });
                        }
                        if (tempEndOffset < sentence.length) {
                            parent.content.splice(index + (tempStartOffset ? 2 : 1), 0, {
                                type: "text",
                                content: suffix,
                                parent,
                                index,
                            });
                        }
                    } else if (type === "img" || isWholeNode(root, this.options.classesAsWhole)) {
                        spanWrapper = {
                            type: "span",
                            attributes: { class: className },
                            index,
                            content: [root],
                            parent,
                        };
                        root.parent = spanWrapper;
                        parent.content[index] = spanWrapper;
                    } else {
                        throw new Error("unexpected case");
                    }
                } else {
                    // 如果有状态span节点

                    if (parent.attributes?.class.includes(className)) {
                        // 如果该状态节点已有该状态，则不做处理
                        if (type === "text") {
                            root.content = transferStr(root.content);
                        }
                    } else {
                        // 否则添加新的状态
                        if (type === "text") {
                            addStatusByNodeLeftAndRightIndex(parent, className, tempStartOffset, tempEndOffset);
                        }
                        if (type === "img" || isWholeNode(root, classesAsWhole)) {
                            addStatusByNode(parent, className);
                        }
                    }
                }
                return;
            }

            if (hasTags(root, HEAD_TAG_STRING)) {
                let parent = root.parent;
                if (parent.type !== "span") {
                    if (type === "text") {
                        // 以文本节点为选区起点
                        let text = root.content;
                        let prefix = transferStr(text.slice(0, tempStartOffset));
                        let suffix = transferStr(text.slice(tempStartOffset));
                        parent.content[index] = {
                            type: "text",
                            content: prefix,
                            parent,
                            index,
                        };
                        if (!suffix) return;
                        spanWrapper = {
                            type: "span",
                            attributes: { class: className },
                            content: [
                                {
                                    type: "text",
                                    content: suffix,
                                    parent: null as any,
                                    index: 0,
                                },
                            ],
                            parent,
                            index: 1,
                        };
                        spanWrapper.content[0].parent = spanWrapper;
                        parent.content.splice(index + 1, 0, spanWrapper);
                    } else {
                        // 包裹图片 or 公式i
                        spanWrapper = {
                            type: "span",
                            attributes: { class: className },
                            content: [root],
                            parent,
                            index: 1,
                        };
                        root.parent = spanWrapper;
                        parent.content.splice(index, 1, spanWrapper);
                    }
                } else {
                    // 如果有状态span节点

                    if (parent.attributes?.class.includes(className)) {
                        // 如果该状态节点已有该状态，则不做处理
                        if (type === "text") {
                            root.content = transferStr(root.content);
                        }
                    } else {
                        // 否则添加新的状态
                        if (type === "text") {
                            addStatusByNodeLeftIndex(parent, className, tempStartOffset);
                        }
                        if (type === "img" || isWholeNode(root, classesAsWhole)) {
                            addStatusByNode(parent, className);
                        }
                    }
                }
                lock = true;
            } else if (hasTags(root, TAIL_TAG_STRING)) {
                let parent = root.parent;
                if (parent.type !== "span") {
                    if (type === "text") {
                        // 以文本节点为选区终点
                        let text = root.content;
                        let prefix = transferStr(text.slice(0, tempEndOffset));
                        let suffix = transferStr(text.slice(tempEndOffset));
                        parent.content[index] = {
                            type: "text",
                            content: suffix,
                            parent,
                            index,
                        };
                        if (!prefix) return;
                        spanWrapper = {
                            type: "span",
                            attributes: { class: className },
                            content: [
                                {
                                    type: "text",
                                    content: prefix,
                                    parent: null as any,
                                    index: 0,
                                },
                            ],
                            parent,
                            index: 0,
                        };
                        spanWrapper.content[0].parent = spanWrapper;
                        parent.content.splice(root.index, 0, spanWrapper);
                    } else if (root.type === "img" || isWholeNode(root, classesAsWhole)) {
                        // 包裹图片
                        spanWrapper = {
                            type: "span",
                            attributes: { class: className },
                            content: [root],
                            parent,
                            index: 1,
                        };
                        root.parent = spanWrapper;
                        parent.content.splice(index, 1, spanWrapper);
                    }
                } else {
                    // 如果有状态span节点

                    if (parent.attributes?.class.includes(className)) {
                        // 如果该状态节点已有该状态，则不做处理
                        if (type === "text") {
                            root.content = transferStr(root.content);
                        }
                    } else {
                        // 否则添加新的状态
                        if (type === "text") {
                            addStatusByNodeRightIndex(parent, className, tempEndOffset);
                        }
                        if (type === "img" || isWholeNode(root, classesAsWhole)) {
                            addStatusByNode(parent, className);
                        }
                    }
                }
                lock = false;
            } else if ((type === "text" || type === "img" || isWholeNode(root, classesAsWhole)) && !lock) {
                let parent = root.parent;
                // 选区中间的节点（既不是开头也不是结尾）

                if (parent.type !== "span") {
                    if (type === "text") {
                        root.content = transferStr(root.content);
                    }
                    spanWrapper = {
                        type: "span",
                        attributes: { class: className },
                        content: [root],
                        parent,
                        index,
                    };
                    root.parent = spanWrapper;
                    parent.content[root.index] = spanWrapper;
                } else {
                    // 叠加状态
                    addStatusByNode(root.parent, className);
                }
            } else {
                if (type === "text") {
                    root.content = transferStr(root.content);
                }
            }
            if (root.content.length && root.type !== "text") {
                if (isWholeNode(root, classesAsWhole)) return; //  如果是公式的节点，不遍历其子节点
                if (hasStatusByNode(root)) return;
                // 倒序遍历，规避子节点向当前节点插入了新的节点导致遍历异常
                for (let i = root.content.length - 1, child: JSONContent; (child = root.content[i--]); ) {
                    fn(child);
                }
            }
        };

        fn(this.tree);
    };

    removeWrapper = (className: string) => {
        const { tempStartOffset, tempEndOffset, classesAsWhole } = this.options;
        let lock = true;
        const fn = (root: any) => {
            if (!root) return;
            let type = root.type;
            if (hasTags(root, HEAD_TAG_STRING, TAIL_TAG_STRING)) {
                // 选区属于同一节点（都是文字、都是图片）
                let parent = root.parent;
                if (parent.type === "span" && parent.attributes?.class.includes(className)) {
                    deleteStatusByNodeLeftAndRightIndex({
                        node: root,
                        status: className,
                        l: tempStartOffset,
                        r: tempEndOffset,
                        classesAsWhole,
                    });
                }
                return;
            }

            if (hasTags(root, HEAD_TAG_STRING)) {
                let parent = root.parent;
                if (parent.type === "span" && parent.attributes?.class.includes(className)) {
                    deleteStatusByNodeLeftIndex({
                        node: root,
                        status: className,
                        l: tempStartOffset,
                        classesAsWhole,
                    });
                }
                lock = true;
            } else if (hasTags(root, TAIL_TAG_STRING)) {
                let parent = root.parent;
                if (parent.type === "span" && parent.attributes?.class.includes(className)) {
                    deleteStatusByNodeRightIndex({
                        node: root,
                        status: className,
                        r: tempEndOffset,
                        classesAsWhole,
                    });
                }
                lock = false;
            } else if ((type === "text" || type === "img" || isWholeNode(root, classesAsWhole)) && !lock) {
                let parent = root.parent;
                if (parent.type === "span" && parent.attributes?.class.includes(className)) {
                    deleteStatusByNode(root, className);
                }
            }
            if (root.content.length && root.type !== "text") {
                if (isWholeNode(root, classesAsWhole)) return; //  如果是公式的节点，不遍历其子节点
                // 倒序遍历，规避子节点向当前节点插入了新的节点导致遍历异常
                for (let i = root.content.length - 1, child: JSONContent; (child = root.content[i--]); ) {
                    fn(child);
                }
            }
        };
        fn(this.tree);
    };
}
