import { JSONContent } from "./parser";

// 判断某个树节点是否有某些标签
export function hasTags(node: JSONContent, ...args: string[]) {
    return args.every((key) => node._tags?.includes(key));
}