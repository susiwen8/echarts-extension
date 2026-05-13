# @echarts-extension/layout-core

语言：[English](./README.md) | 中文

本 monorepo 中 ECharts 扩展包共享的布局与渲染辅助库。大多数图表用户不需要直接导入它；它主要用于构建新扩展或测试本地图布局。

![Layout Core 图表截图](../../docs/packages/echarts-layout-core/screenshot.png)

## 安装

```bash
npm install @echarts-extension/layout-core
```

如果通过 ECharts 渲染，也需要在宿主应用中安装 `echarts`。

## 计算布局

```js
import { computeGraphLayout } from '@echarts-extension/layout-core';

const result = computeGraphLayout('radial', {
  nodes: [
    { id: 'root', value: 10 },
    { id: 'a', value: 4 },
    { id: 'b', value: 3 }
  ],
  edges: [
    { source: 'root', target: 'a' },
    { source: 'root', target: 'b' }
  ]
}, {
  center: [300, 220],
  unitRadius: 90,
  nodeSize: 18
});

console.log(result.nodes);
```

`computeGraphLayout(type, input, options)` 支持 `arc`、`concentric`、`grid`、`mds` 和 `radial`。

## 注册图关系系列

```js
import * as echarts from 'echarts/lib/echarts';
import { installGraphLayout } from '@echarts-extension/layout-core';

installGraphLayout(echarts, {
  chartType: 'customRadial',
  layoutType: 'radial'
});
```

注册后的系列接受 ECharts 图关系风格的 `data`/`links` 或 `nodes`/`edges` 输入，并通过共享图视图渲染节点、标签和连线。

## 主要导出

- `normalizeGraphData`：将图关系风格输入规范化为节点和边。
- `computeGraphLayout`：分发到指定名称的图布局。
- `computeArcLayout`, `computeConcentricLayout`, `computeGridLayout`, `computeMDSLayout`, `computeRadialLayout`：各布局对应的 API。
- `installGraphLayout`：注册图关系风格的 ECharts 系列。
- `installFisheyeController`, `resolveFisheyeOptions`, `fisheyeTransform`：供图表包复用的鱼眼放大基础能力。
- `installElementHover`, `renderAlive`, `clearAliveRender`, `setAliveRenderKey`：自定义图表包使用的共享渲染辅助函数。
