import { DEFAULT_Mark_CLASS_PREFIX, DEFAULT_UNDERLINE_CLASS_NAME, MOUSEUP_TIME_DIVIDE } from "@/utils/constant.ts";
import { MarkerSelection } from "../marker-selection";
import { EventEmitter } from "@/utils/eventEmitter";
import Toolbar from "../toolbar";
import { uuid } from "@/utils/uuid";
import { JsonToHtml, htmlToJson } from "@/utils/parser";
import { bfs, isOnlyOneClass, removeClass } from "@/utils/vdom";

export interface MarkerOptions {
    root?: HTMLElement;
    /** classes that should be as a whole node, eg: ['ql-formula'] */
    classesAsWhole?: string[];
}

export enum EventType {
    DOM_UPDATE = "dom:update",
    CREATE = "selection:create",
    REMOVE = "selection:remove",
    HOVER = "selection:hover",
    HOVER_OUT = "selection:hover_out",
    CLICK = "selection:click",
    MAKERCREATE = "marker:create",
}

interface EventHandlerMap {
    [key: string]: (...args: any[]) => void;
    [EventType.CREATE]: (data: { $root: HTMLElement }, e: MouseEvent | TouchEvent) => void;
    [EventType.MAKERCREATE]: (data: { key: string; title: string }) => void;
}

const toolbarConfig = [
    {
        label: "划线",
        isShow: true,
        executeFn: (markerSelection: MarkerSelection) => {
            let ans = markerSelection.getNewInnerHTMLAfterAction("create", DEFAULT_UNDERLINE_CLASS_NAME);
            // Records.push(ans as string)
            markerSelection.options.root!.innerHTML = ans;
        },
    },
    {
        label: "取消划线",
        isShow: (markerSelection: MarkerSelection) => markerSelection.hasStatus(DEFAULT_UNDERLINE_CLASS_NAME),
        executeFn: (markerSelection: MarkerSelection) => {
            let ans = markerSelection.getNewInnerHTMLAfterAction("remove", DEFAULT_UNDERLINE_CLASS_NAME);
            // Records.push(ans as string)
            markerSelection.options.root!.innerHTML = ans;
        },
    },
    {
        label: "写批注",
        isShow: true,
        executeFn: (markerSelection: MarkerSelection, marker: Marker) => {
            let commentId = DEFAULT_Mark_CLASS_PREFIX + uuid();
            let ans = markerSelection.getNewInnerHTMLAfterAction("create", commentId);
            // Records.push(ans as string)
            markerSelection.options.root!.innerHTML = ans;
            const titleElemArr = document.querySelectorAll(`.${commentId}`);
            const title = Array.from(titleElemArr!).reduce((prev, current) => prev + current.innerHTML, "");
            marker.emit(EventType.MAKERCREATE, { key: commentId, title: title || "" });
        },
    },
];

export class Marker extends EventEmitter<EventHandlerMap> {
    $root: HTMLElement;
    options: MarkerOptions;

    private startTime: number | null = null;
    constructor(options: MarkerOptions) {
        super();
        const defaultOptions = this.getDefaultOptions();
        this.options = { ...defaultOptions, ...options };
        this.$root = this.options.root!;

        this.initListener();
    }

    private readonly getDefaultOptions = () => ({
        root: document.body,
        classesAsWhole: ["ql-formula"],
    });

    /**
     * Initializes event listeners for the marker component.
     */
    private readonly initListener = () => {
        this.$root.addEventListener("mousedown", this._handleMouseDown);
        this.$root.addEventListener("mouseup", this._handleMouseUp);
    };

    private readonly _handleMouseDown = () => {
        this.startTime = Date.now();
    };

    private readonly _handleMouseUp = async (e: MouseEvent) => {
        if (this.startTime) {
            const endTime = Date.now();
            const timeDiff = endTime - this.startTime;

            if (timeDiff > MOUSEUP_TIME_DIVIDE) {
                console.log("selected");
                const markerSelection = new MarkerSelection(this.options);
                markerSelection.tagRange();
                this.emit(EventType.DOM_UPDATE, { $root: this.$root }, e);

                try {
                    const { x: x2, y: y2, width } = markerSelection._selection?.getRangeAt(0).getBoundingClientRect()!;
                    let textTypeName = await Toolbar.show({
                        style: { left: x2 + width / 2 + "px", top: y2 - 52 + scrollY + "px" },
                        config: toolbarConfig.filter((item) => {
                            if (item.isShow instanceof Function) {
                                return item.isShow(markerSelection);
                            } else {
                                return item.isShow;
                            }
                        }),
                    });
                    await toolbarConfig.find((item) => item.label === textTypeName)?.executeFn(markerSelection, this);
                } catch (error) {
                    markerSelection.clearRange();
                }
                this.emit(EventType.DOM_UPDATE, { $root: this.$root }, e);
                Toolbar.close();
            } else {
                console.log("clicked");
            }

            this.startTime = null;
        }
    };

    // 删除node中指定的class，如果删除后没有状态，则需要提升子节点
    async removeWrapperByClassName(className: string) {
        let tree = htmlToJson(this.$root);
        console.log(tree);
        const fn = (root: any) => {
            // 广度优先遍历
            if (!root || !root.content?.length) return;
            const queue = [root];
            while (queue.length) {
                const currentNode = queue.shift()!;
                if (currentNode.type === "span" && currentNode.attributes?.class?.includes(className)) {
                    if (isOnlyOneClass(currentNode)) {
                        // 如果父级只有一个状态标注，则提升
                        currentNode.parent.content.splice(currentNode.index, 1, ...currentNode.content);
                    } else {
                        // 否则删除父级的该状态标注
                        currentNode.attributes.class = removeClass(currentNode.attributes.class, className);
                    }
                }
                if (currentNode.type === "text" || currentNode.attributes?.class?.includes("ql-formula")) {
                    continue;
                } else if (currentNode.content?.length) {
                    queue.push(...currentNode.content);
                }
            }
        };
        fn(tree);
        bfs(tree);
        let str = JsonToHtml(tree) as string;
        // 去掉父节点
        let l = str.indexOf(">") + 1;
        let r = str.lastIndexOf("<");
        this.$root.innerHTML = str.slice(l, r);
    }
}
