# rich-text-marker

[![npm version](https://badge.fury.io/js/rich-text-marker.svg)](https://badge.fury.io/js/rich-text-marker)

一个用于对**富文本编辑器生成的文本**进行**划词高亮**的工具。

> 注意：该工具适用于富文本编辑器生成的富文本，不适用于任何 DOM 结构。

## 安装

```bash
npm install rich-text-marker
```

## 使用说明

### 步骤 1

使用一个标签包裹您的富文本。

```html
<div id="rich-text-container">
    <div id="rich-text-marker">
        <h1>这是一个 h1 标签</h1>
        <p>
            这是一个 p 标签，包含一个
            <strong>这是一个 strong 标签</strong>
            strong 标签
        </p>
        <div>
            这是一个 div 标签，包含一个
            <a href="#">这是一个 a 标签</a>
            a 标签
        </div>
        <p>
            这是一个 div 标签，包含一个
            <img
                src="https://p6-passport.byteacctimg.com/img/user-avatar/976aa386bacba0c2147e5a920bdfde5d~140x140.awebp"
                alt=""
            />
            img 标签
        </p>
        <p>注意，不支持 span 标签，因为 span 会被视为一个状态（下划线或标记）标签</p>
    </div>
</div>
```

### 步骤 2

导入 Marker 并获取实例。

```typescript
import { Marker } from "rich-text-marker";
import "rich-text-marker/dist/style.css";

const marker = new Marker({
    root: document.getElementById("rich-text-container"),
    classesAsWhole: ["ql-formula"], // 指定哪些 class 作为整体，而不是作为状态
});

marker.on("marker:create", (e) => {
    console.log(e); // { title: "", key: "" }
});
```

## API

### Marker

#### 构造函数

```typescript
new Marker(options: MarkerOptions);
```

#### options

```typescript
interface MarkerOptions {
    root: HTMLElement; // 包裹富文本的标签
    classesAsWhole?: string[]; // 指定哪些 class 作为整体，而不是作为状态，主要针对富文本中的公式节点，默认值是["ql-formula"]
}
```

#### 方法

```typescript
marker.on(event: "marker:create", callback: (e: MarkerEvent) => void);
```

#### MarkerEvent

```typescript
interface MarkerEvent {
    title: string;
    key: string;
}
```

## 贡献
欢迎提交 issue 和 PR。
