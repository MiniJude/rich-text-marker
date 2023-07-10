import { HTMLAttributes } from "vue"
export enum Config {
  'm_underline' = '划线',
  'd_underline' = '取消划线', // delete
  'm_comment' = '写批注',
}

export interface Options {
  style: HTMLAttributes['style'],
  config?: Config[]
}

class Toolbar {
  private static instance: Toolbar
  private toolbarElement: HTMLElement

  private constructor() {
    this.toolbarElement = document.createElement("div")
    // 设置工具条样式
    this.toolbarElement.classList.add("rich_text_marker__toolbar")
    this.toolbarElement.style.display = "none"
  }

  public static getInstance(): Toolbar {
    if (!Toolbar.instance) {
      Toolbar.instance = new Toolbar()
    }
    return Toolbar.instance
  }
  private handleOutsideClick = (event: MouseEvent, resolve: (ags?: any) => any, reject: (ags?: any) => any): void => {
    const isClickedOutside = !this.toolbarElement.contains(event.target as Node)
    if (isClickedOutside) {
      this.close()
      reject()
    } else {
      resolve()
    }
  }

  private handleOutsideClickWrapper: null | ((event: MouseEvent) => void) = null

  public show(parentEle: HTMLElement, { style, config = [Config.m_underline, Config.m_comment] }: Options): Promise<Config> {
    this.toolbarElement.style.display = "flex"
    // 设置工具条位置
    Object.assign(this.toolbarElement.style, style)
    // 设置工具条选项
    this.toolbarElement.innerHTML = config.reduce((prev, curr) => {
      return prev + `<span class="rich_text_marker__toolbar__item">
        <img src="${new URL(`../img/${curr}.svg`, import.meta.url)}">
        <span>${curr}</span>
      </span>`
    }, '')
    parentEle.appendChild(this.toolbarElement)

    return new Promise((resolve, reject) => {
      this.toolbarElement.addEventListener('click', (e) => {
        const target = e.target as HTMLElement
        let toolbarItem = target.closest('.rich_text_marker__toolbar__item') as HTMLElement
        if (toolbarItem) {
          resolve(toolbarItem.innerText as Config)
        }
      })
      // 添加点击事件监听器以处理点击工具条以外的区域
      this.handleOutsideClickWrapper = (event: MouseEvent) => this.handleOutsideClick(event, resolve, reject)
      document.addEventListener("click", this.handleOutsideClickWrapper)
    })
  }

  public close(): void {
    this.toolbarElement.style.display = "none"
    if (this.handleOutsideClickWrapper) {
      document.removeEventListener("click", this.handleOutsideClickWrapper)
      this.handleOutsideClickWrapper = null
    }
  }
}

export default Toolbar.getInstance()
