# 划词高亮

效果：https://www.awesomescreenshot.com/video/19088409?key=fa26430424e70b0255ae336dfe03d4ec

### useage

```
npm install rich-text-marker
```

```html
<template>
  <div style="display: flex;width: 100%;height: 100%;">
    <div style="flex:1;height: 100%;overflow: auto;padding: 80px;">
      <RichTextMarker @takeComment="handleTakeComment" @clear="handleClear" v-model="htmlStr"></RichTextMarker>
    </div>
    <div style="width:2px;background-color: rosybrown;"> </div>
    <div style="flex:1;height: 100%;overflow: auto;padding: 80px;">
      <div>
        <div v-for="item in list">
          <span v-html="item.title"></span>
          <span class="delete-btn" @click="removeComment(item.key)">删除</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import RichTextMarker from 'rich-text-marker';

let htmlStr = ref('<p>这是第一行文字，后面接了个图片：<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAVCAYAAABc6S4mAAAC/klEQVRIia1Uv0sycRj/nEW4CIFUHEQ66DmZSxE0S+cixA0NTQ5Zi7v/QJBTBLaEg5tQg4NFTQ0NSoEFgotCGRUnFDbY4d2V5+cdXpR8O3t5fzzw8IXn1+f7/BReX185OTkJQRDwP8kwDNRqNTju7u7+e3AAcDqdmJ2dxfh3Ro+Pj9jc3MTt7S16vR5IDvHY2BjW1taws7Nj6+92uwFVVTmKNjY2uLe3R13XaZom39/f+fHxwW63S8uyqGkaw+Ewz8/Pbf1VVSVGBS+VSlxYWKCu6yM/QJKnp6eMRCLUNO2Lrlwuc7zVaqFarSKZTKLZbA6lt7u7C6fT+W2tI5EILi4uEAwGYVkWAEAURaRSKbhcLqBcLnNpaYmXl5fs9XoD7pNpmsxms4xGowwEAgwEAoxGo8xmszRNc2D32ffq6oqLi4s/S1Qulzk3N0fLsmxruLKywlgsxmKxSE3TqGkai8UiY7EYZVnmqB72Y6LRaNDj8bDb7Q4ZmKZJWZaZTqdH1j+dTlOW5aFM+uTxePj09ESH1+u13YNcLgdRFJFIJEbWP5FIQBRF5HK5LzpBEKCqKhytVguCIIDkkEE+n0c8Hv+2wQAQj8eRz+dtAUhi/P7+3hagXq8jFAqNDKyqKgAgFAqhXq/bAoiiCMdntD+hg4MDFAqFkXpBEDAzMwOH2+22BZAkCZVKxdb57e0NZ2dnWF5eRqVSgSRJtgDNZhMOr9cLAF8AFEVBJpMZkj0/P+Po6Airq6uIRCKYn59HJpOBoii2H1FVFWi32/T5fF9OQn9M9/f3B7LDw0NubW3x+Pj4t2Pq8/lYKpV+Lprf72en07FdNFmW/2rR/H4/G40Gx/v1smuyKIooFArI5XJIpVKDaZEkCYqiYH19HRMTE982GbVajeFwmCcnJ+x0OtR1fYgNw6BhGINz3T/Z/bPdP92WZQ1uWLVaZTAY5MvLCwWSvLm5QTKZxMPDwyATkoPMPst+fe1k09PT2N7extTUFIR2u02Xy2Wb5r/S9fU1fgA242HT6fTCsgAAAABJRU5ErkJggg==">，你可以对它们划线，写批注，组件也提供了删除的api，可以删除指定id的批注</p><p>这是另一行文字，支持跨标签</p>')

type Comment = {
  key: string
  title: string
}
const list = ref<Comment[]>([])
async function handleTakeComment(comment: Comment) {
  console.log(comment)
  list.value.unshift(comment)
}

function handleClear() {
  list.value = []
}

async function removeComment(key: string) {
  let index = list.value.findIndex(item => item.key === key)
  if (index > -1) {
    list.value.splice(index, 1)
  }
  // let newHtml = await getHtmlStrByNeedRemovedKey(html['case1'] as any ,key)
  // html.case1 = newHtml
}

</script>

<style scoped>
.delete-btn {
  margin-left: 10px;
  font-size: 12px;
  border-radius: 2px;
  border: 1px solid #ccc;
  background-color: bisque;
  cursor: pointer;
}
</style>

```