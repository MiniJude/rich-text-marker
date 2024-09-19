// 获取className字符串中的m-comment-ids
export function getCommentIdsByClassName(className: string): string[] {
    let prefix = "m_comment-id-";
    let classList = className.split(" ");
    let ids: string[] = classList
        .filter((item) => {
            return item.startsWith(prefix);
        })
        .map((item) => {
            return item.trim();
        });
    return ids;
}

// 获取给定节点的comment-id集合 (暂时没用到，但是需要)
export function getCommentIdsByNode(node: HTMLElement): string[] {
    let ans: string[] = [];
    const findCommentIds = (node: HTMLElement) => {
        let ids = getCommentIdsByClassName(node.className);
        if (ids.length) {
            ans.push(...ids);
            return;
        }
        if (node.parentElement?.tagName === "P") return;
        if (node.parentElement) {
            findCommentIds(node.parentElement);
        }
    };
    findCommentIds(node);
    return ans;
}

// 给给定dom节点添加自定义属性
export function setAttrByNode(node: any, ...args: string[]) {
    args.forEach((key) => {
        if (!node.attributes) {
            node.attributes = { [`data-${key}`]: "" };
        } else {
            node.attributes[`data-${key}`] = "";
        }
    });
}

// 叠加状态类名标注
export function addStatusByNode(node: any, status: string) {
    if (!node.attributes) {
        node.attributes = {
            class: status,
        };
        return;
    }
    if (!node.attributes.class?.trim()) {
        node.attributes.class = status;
        return;
    }
    if (node.attributes.class.includes(status)) return;
    node.attributes.class += ` ${status}`;
}

export function addStatusByNodeLeftIndex(node: any, status: string, l: number) {
    // 暂认为能走到这个函数，一定是需要一分为二的
    let oldTextObj = node.content[0];
    let suffix = oldTextObj.content.slice(l);
    oldTextObj.content = oldTextObj.content.slice(0, l);
    node.parent.content.splice(node.index + 1, 0, copyNode(node, suffix, status));
}
export function addStatusByNodeRightIndex(node: any, status: string, r: number) {
    // 暂认为能走到这个函数，一定是需要一分为二的
    let oldTextObj = node.content[0];
    let prefix = oldTextObj.content.slice(0, r);
    oldTextObj.content = oldTextObj.content.slice(r);
    node.parent.content.splice(node.index, 0, copyNode(node, prefix, status));
}
export function addStatusByNodeLeftAndRightIndex(node: any, status: string, l: number, r: number) {
    // 暂认为能走到这个函数，一定是需要一分为三的
    let oldTextObj = node.content[0];
    let prefix = oldTextObj.content.slice(0, l),
        suffix = oldTextObj.content.slice(r),
        middle = oldTextObj.content.slice(l, r);
    if (suffix) node.parent.content.splice(node.index + 1, 0, copyNode(node, suffix));
    if (middle) node.parent.content.splice(node.index, 1, copyNode(node, middle, status));
    if (prefix) node.parent.content.splice(node.index, 0, copyNode(node, prefix));
}

function copyNode(node: any, text: string, status?: string) {
    let {
        attributes: { class: oldClass },
        ...newNode
    } = node;
    newNode.attributes = {
        class: oldClass,
    };
    newNode.content = [
        {
            type: "text",
            content: text,
            parent: newNode,
        },
    ];
    if (status) newNode.attributes.class += ` ${status}`;
    return newNode;
}

// 判断字符串是否为 HTML 字符串
export function isHTMLString(str: string): boolean {
    const pattern = /<[a-z][\s\S]*>/i;
    return pattern.test(str);
}
