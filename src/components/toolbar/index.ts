import { DEFAULT_CLASS_PREFIX } from "@/utils/constant";

export interface ToolbarOptions {
    style: any;
    config: ToolbarConfig[];
}

export interface ToolbarConfig {
    label: string;
    isShow: boolean | ((...args: any[]) => boolean | Promise<boolean>);
    executeFn: (...arg: any[]) => void;
}

class Toolbar {
    private static _instance: Toolbar;
    private toolbarElement: HTMLElement;

    private constructor() {
        this.toolbarElement = document.createElement("div");
        // set default class and style
        this.toolbarElement.className = `${DEFAULT_CLASS_PREFIX}toolbar`;
        this.toolbarElement.style.display = "none";
    }

    public static getInstance(): Toolbar {
        if (!Toolbar._instance) {
            Toolbar._instance = new Toolbar();
        }
        return Toolbar._instance;
    }

    private handleOutsideClick = (event: MouseEvent, reject: (ags?: any) => any): void => {
        const isClickedOutside = !this.toolbarElement.contains(event.target as Node);
        if (isClickedOutside) {
            reject("you clicked outside the toolbar");
        } else {
            reject("you clicked inside the toolbar but not the item");
        }
    };

    private handleOutsideClickWrapper: null | ((event: MouseEvent) => void) = null;

    public show({ style, config }: ToolbarOptions): Promise<string> {
        this.toolbarElement.style.display = "flex";
        // 设置工具条位置
        Object.assign(this.toolbarElement.style, style);
        // 设置工具条选项
        this.toolbarElement.innerHTML = config.reduce((prev, curr) => {
            return (
                prev +
                `<span class="${DEFAULT_CLASS_PREFIX}toolbar-item">
                    <img src="${new URL(`../../assets/img/${curr.label}.svg`, import.meta.url)}">
                    <span>${curr.label}</span>
                 </span>`
            );
        }, "");
        document.body.appendChild(this.toolbarElement);

        return new Promise((resolve, reject) => {
            this.toolbarElement.addEventListener("click", (e) => {
                const target = e.target as HTMLElement;
                let toolbarItem = target.closest(`.${DEFAULT_CLASS_PREFIX}toolbar-item`) as HTMLElement;
                if (toolbarItem) {
                    resolve(toolbarItem.innerText);
                }
            });
            // 添加点击事件监听器以处理点击工具条以外的区域
            this.handleOutsideClickWrapper = (event: MouseEvent) => this.handleOutsideClick(event, reject);
            setTimeout(() => {
                document.addEventListener("click", this.handleOutsideClickWrapper!);
            }, 0);
        });
    }

    public close(): void {
        this.toolbarElement.style.display = "none";
        if (this.handleOutsideClickWrapper) {
            document.removeEventListener("click", this.handleOutsideClickWrapper);
            this.handleOutsideClickWrapper = null;
        }
    }
}

export default Toolbar.getInstance();
