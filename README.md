# MiniVue

## 介绍

大概是最全的一个基于vue3的 mini-vue 实现了。
从 createApp 开始，模板编译、创建组件实例、运行渲染函数、挂载虚拟 dom、接合响应式系统、patch 更新渲染、scheduler 任务调度。
1000 多行代码，零依赖，几乎实现了 vue 完整的流程。
项目结构尽量还原 vue3 源码，只做主线任务。

## Examples

[预览地址](https://leaon4.github.io/mini-vue)

vue3 原 examples 除 svg 以外全部能移植使用

## B站视频

[B站视频--从零开始写个mini-vue](https://www.bilibili.com/video/BV1564y1s7s5)

## 本地运行

```bash
npm install
cd src/examples
npm install
cd ../..
npm run dev
```
