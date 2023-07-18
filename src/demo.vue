<template>
    <!-- <div>
      <template v-for="item in 6">
        <RichTextMarker v-model="html['case' + item]"></RichTextMarker>
        <div style="height: 4px;background-color: red;"></div>
      </template>
    </div> -->
    <div style="display: flex;width: 100%;height: 100%;">
      <div style="flex:1;height: 100%;overflow: auto;padding: 80px;">
        <RichTextMarker @takeComment="handleTakeComment" @clear="handleClear" ref="richTextMarkerRef"
          v-model="html['case2']"></RichTextMarker>
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
  
  <script lang="ts" setup>
  import { reactive, ref } from 'vue'
  import RichTextMarker from './index.vue'
  import { getHtmlStrByNeedRemovedKey } from './index'
    
  // 建议：公式和图片两侧都加空格！！！！
  let case1 = `<p>这是一道问答题，你需要仔细读题。如果不是题目中有明确要求，请尽量使用键盘作答。回答问答题时需要逻辑清晰，用词准确。如果题干要求拍照上传答案，例如画一个sin(x)的曲线。你需要点击输入框下方的相机图标<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAVCAYAAABc6S4mAAAC/klEQVRIia1Uv0sycRj/nEW4CIFUHEQ66DmZSxE0S+cixA0NTQ5Zi7v/QJBTBLaEg5tQg4NFTQ0NSoEFgotCGRUnFDbY4d2V5+cdXpR8O3t5fzzw8IXn1+f7/BReX185OTkJQRDwP8kwDNRqNTju7u7+e3AAcDqdmJ2dxfh3Ro+Pj9jc3MTt7S16vR5IDvHY2BjW1taws7Nj6+92uwFVVTmKNjY2uLe3R13XaZom39/f+fHxwW63S8uyqGkaw+Ewz8/Pbf1VVSVGBS+VSlxYWKCu6yM/QJKnp6eMRCLUNO2Lrlwuc7zVaqFarSKZTKLZbA6lt7u7C6fT+W2tI5EILi4uEAwGYVkWAEAURaRSKbhcLqBcLnNpaYmXl5fs9XoD7pNpmsxms4xGowwEAgwEAoxGo8xmszRNc2D32ffq6oqLi4s/S1Qulzk3N0fLsmxruLKywlgsxmKxSE3TqGkai8UiY7EYZVnmqB72Y6LRaNDj8bDb7Q4ZmKZJWZaZTqdH1j+dTlOW5aFM+uTxePj09ESH1+u13YNcLgdRFJFIJEbWP5FIQBRF5HK5LzpBEKCqKhytVguCIIDkkEE+n0c8Hv+2wQAQj8eRz+dtAUhi/P7+3hagXq8jFAqNDKyqKgAgFAqhXq/bAoiiCMdntD+hg4MDFAqFkXpBEDAzMwOH2+22BZAkCZVKxdb57e0NZ2dnWF5eRqVSgSRJtgDNZhMOr9cLAF8AFEVBJpMZkj0/P+Po6Airq6uIRCKYn59HJpOBoii2H1FVFWi32/T5fF9OQn9M9/f3B7LDw0NubW3x+Pj4t2Pq8/lYKpV+Lprf72en07FdNFmW/2rR/H4/G40Gx/v1smuyKIooFArI5XJIpVKDaZEkCYqiYH19HRMTE982GbVajeFwmCcnJ+x0OtR1fYgNw6BhGINz3T/Z/bPdP92WZQ1uWLVaZTAY5MvLCwWSvLm5QTKZxMPDwyATkoPMPst+fe1k09PT2N7extTUFIR2u02Xy2Wb5r/S9fU1fgA242HT6fTCsgAAAABJRU5ErkJggg==">，如果此时你的手机已经处于本场考试的监考模式下，你的手机上会自动进入拍照模式，将镜头对准要拍摄的内容，按照网页的提示进行拍照上传。</p><p>如果你的手机没有连接本场考试，你需要用手机扫码弹出的二维码。下面请填写一个简短的自我介绍，并添加自己将要用于答题的电脑设备的照片（1~3张照片）。</p>`
  let case2 = '<p>这是第一行文字，后面接了个图片：<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAVCAYAAABc6S4mAAAC/klEQVRIia1Uv0sycRj/nEW4CIFUHEQ66DmZSxE0S+cixA0NTQ5Zi7v/QJBTBLaEg5tQg4NFTQ0NSoEFgotCGRUnFDbY4d2V5+cdXpR8O3t5fzzw8IXn1+f7/BReX185OTkJQRDwP8kwDNRqNTju7u7+e3AAcDqdmJ2dxfh3Ro+Pj9jc3MTt7S16vR5IDvHY2BjW1taws7Nj6+92uwFVVTmKNjY2uLe3R13XaZom39/f+fHxwW63S8uyqGkaw+Ewz8/Pbf1VVSVGBS+VSlxYWKCu6yM/QJKnp6eMRCLUNO2Lrlwuc7zVaqFarSKZTKLZbA6lt7u7C6fT+W2tI5EILi4uEAwGYVkWAEAURaRSKbhcLqBcLnNpaYmXl5fs9XoD7pNpmsxms4xGowwEAgwEAoxGo8xmszRNc2D32ffq6oqLi4s/S1Qulzk3N0fLsmxruLKywlgsxmKxSE3TqGkai8UiY7EYZVnmqB72Y6LRaNDj8bDb7Q4ZmKZJWZaZTqdH1j+dTlOW5aFM+uTxePj09ESH1+u13YNcLgdRFJFIJEbWP5FIQBRF5HK5LzpBEKCqKhytVguCIIDkkEE+n0c8Hv+2wQAQj8eRz+dtAUhi/P7+3hagXq8jFAqNDKyqKgAgFAqhXq/bAoiiCMdntD+hg4MDFAqFkXpBEDAzMwOH2+22BZAkCZVKxdb57e0NZ2dnWF5eRqVSgSRJtgDNZhMOr9cLAF8AFEVBJpMZkj0/P+Po6Airq6uIRCKYn59HJpOBoii2H1FVFWi32/T5fF9OQn9M9/f3B7LDw0NubW3x+Pj4t2Pq8/lYKpV+Lprf72en07FdNFmW/2rR/H4/G40Gx/v1smuyKIooFArI5XJIpVKDaZEkCYqiYH19HRMTE982GbVajeFwmCcnJ+x0OtR1fYgNw6BhGINz3T/Z/bPdP92WZQ1uWLVaZTAY5MvLCwWSvLm5QTKZxMPDwyATkoPMPst+fe1k09PT2N7extTUFIR2u02Xy2Wb5r/S9fU1fgA242HT6fTCsgAAAABJRU5ErkJggg==">，你可以对它们划线，写批注，组件也提供了删除的api，可以删除指定id的批注</p><p>这是另一行文字，支持跨标签</p>'
  let case3 = '<p>这是第二<img src="https://www.antdv.com/assets/logo.1ef800a8.svg">行<img src="https://www.antdv.com/assets/logo.1ef800a8.svg">文字</p>'
  let case4 = '<p>这是传入的htmlstr字符串</p><p>这是第二<img src="https://www.antdv.com/assets/logo.1ef800a8.svg"> 行 <img src="https://www.antdv.com/assets/logo.1ef800a8.svg"> 文字</p><p><img src="https://www.antdv.com/assets/logo.1ef800a8.svg">这是第3行文字</p>'
  let case5 = '<p>这是<strong>传入</strong>的<em>ht</em>mlstr字<img src="https://www.antdv.com/assets/logo.1ef800a8.svg">符串</p><p>这是<u>第二<img src="https://www.antdv.com/assets/logo.1ef800a8.svg">行</u>文<span class="ql-formula" data-value=" \tfrac{v}{d} ">﻿<span contenteditable="false"><span class="katex"><span class="katex-mathml"><math xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><mfrac><mi>v</mi><mi>d</mi></mfrac></mrow><annotation encoding="application/x-tex"> \tfrac{v}{d} </annotation></semantics></math></span><span class="katex-html" aria-hidden="true"><span class="base"><span class="strut" style="height: 1.0404em; vertical-align: -0.345em;"></span><span class="mord"><span class="mopen nulldelimiter"></span><span class="mfrac"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height: 0.6954em;"><span class="" style="top: -2.655em;"><span class="pstrut" style="height: 3em;"></span><span class="sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight">d</span></span></span></span><span class="" style="top: -3.23em;"><span class="pstrut" style="height: 3em;"></span><span class="frac-line" style="border-bottom-width: 0.04em;"></span></span><span class="" style="top: -3.394em;"><span class="pstrut" style="height: 3em;"></span><span class="sizing reset-size6 size3 mtight"><span class="mord mtight"><span class="mord mathnormal mtight" style="margin-right: 0.0359em;">v</span></span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height: 0.345em;"><span class=""></span></span></span></span></span><span class="mclose nulldelimiter"></span></span></span></span></span></span>﻿</span> 字</p>'
  let case6 = '<p>这<span class="ql-formula" data-value="\cfrac{1}{a + \cfrac{7}{b + \cfrac{2}{9}}} =c ">&#xFEFF;<span contenteditable="false"><span class="katex"><span class="katex-mathml"><math xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><mstyle displaystyle="true" scriptlevel="0"><mfrac><mn>1</mn><mrow><mi>a</mi><mo>+</mo><mstyle displaystyle="true" scriptlevel="0"><mfrac><mn>7</mn><mrow><mi>b</mi><mo>+</mo><mstyle displaystyle="true" scriptlevel="0"><mfrac><mn>2</mn><mn>9</mn></mfrac></mstyle></mrow></mfrac></mstyle></mrow></mfrac></mstyle><mo>=</mo><mi>c</mi></mrow><annotation encoding="application/x-tex">\cfrac{1}{a + \cfrac{7}{b + \cfrac{2}{9}}} =c </annotation></semantics></math></span><span class="katex-html" aria-hidden="true"><span class="base"><span class="strut" style="height: 5.236em; vertical-align: -3.646em;"></span><span class="mord"><span class="mopen nulldelimiter"></span><span class="mfrac"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height: 1.59em;"><span class="" style="top: -2.11em;"><span class="pstrut" style="height: 3.59em;"></span><span class="mord"><span class="mord mathnormal">a</span><span class="mspace" style="margin-right: 0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right: 0.2222em;"></span><span class="mord"><span class="mopen nulldelimiter"></span><span class="mfrac"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height: 1.59em;"><span class="" style="top: -2.11em;"><span class="pstrut" style="height: 3.59em;"></span><span class="mord"><span class="mord mathnormal">b</span><span class="mspace" style="margin-right: 0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right: 0.2222em;"></span><span class="mord"><span class="mopen nulldelimiter"></span><span class="mfrac"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height: 1.59em;"><span class="" style="top: -2.314em;"><span class="pstrut" style="height: 3em;"></span><span class="mord"><span class="mord">9</span></span></span><span class="" style="top: -3.23em;"><span class="pstrut" style="height: 3em;"></span><span class="frac-line" style="border-bottom-width: 0.04em;"></span></span><span class="" style="top: -3.74em;"><span class="pstrut" style="height: 3em;"></span><span class="mord"><span class="mord">2</span></span></span></span><span class="vlist-s">&ZeroWidthSpace;</span></span><span class="vlist-r"><span class="vlist" style="height: 0.686em;"><span class=""></span></span></span></span></span><span class=""></span></span></span></span><span class="" style="top: -3.82em;"><span class="pstrut" style="height: 3.59em;"></span><span class="frac-line" style="border-bottom-width: 0.04em;"></span></span><span class="" style="top: -4.33em;"><span class="pstrut" style="height: 3.59em;"></span><span class="mord"><span class="mord">7</span></span></span></span><span class="vlist-s">&ZeroWidthSpace;</span></span><span class="vlist-r"><span class="vlist" style="height: 2.166em;"><span class=""></span></span></span></span></span><span class=""></span></span></span></span><span class="" style="top: -3.82em;"><span class="pstrut" style="height: 3.59em;"></span><span class="frac-line" style="border-bottom-width: 0.04em;"></span></span><span class="" style="top: -4.33em;"><span class="pstrut" style="height: 3.59em;"></span><span class="mord"><span class="mord">1</span></span></span></span><span class="vlist-s">&ZeroWidthSpace;</span></span><span class="vlist-r"><span class="vlist" style="height: 3.646em;"><span class=""></span></span></span></span></span><span class=""></span></span><span class="mspace" style="margin-right: 0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right: 0.2778em;"></span></span><span class="base"><span class="strut" style="height: 0.4306em;"></span><span class="mord mathnormal">c</span></span></span></span></span>&#xFEFF;</span>s是一个超级复杂的公式</p><p>这是第二行的公式：<span class="ql-formula" data-value="a">&#xFEFF;<span contenteditable="false"><span class="katex"><span class="katex-mathml"><math xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><mi>a</mi></mrow><annotation encoding="application/x-tex">a</annotation></semantics></math></span><span class="katex-html" aria-hidden="true"><span class="base"><span class="strut" style="height: 0.4306em;"></span><span class="mord mathnormal">a</span></span></span></span></span>&#xFEFF;</span> </p>'
  const html = reactive<Record<string, string>>({
    case1,
    case2,
    case3,
    case4,
    case5,
    case6
  })
  // HTMLParser(case1).then(res => {
  //   console.log(res)
  // })
  
  const richTextMarkerRef = ref<InstanceType<typeof RichTextMarker>>()
  
  type CommentModel = {
    key: string
    title: string
  }
  const list = ref<CommentModel[]>([])
  function handleTakeComment(comment: CommentModel) {
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
    let newHtml = await getHtmlStrByNeedRemovedKey(html['case2'] as any ,key)
    html.case2 = newHtml
  }
  
  </script>
  
  <style lang="less" scoped>
  .delete-btn {
    margin-left: 10px;
    font-size: 12px;
    border-radius: 2px;
    border: 1px solid #ccc;
    background-color: bisque;
    cursor: pointer;
  }
  </style>