# @echarts-extension/layout-core

语言：[English](./README.md) | 中文

本 monorepo 中 ECharts 扩展包共享的布局与渲染辅助库。大多数图表用户不需要直接导入它；它主要用于构建新扩展或测试本地图布局。

![Layout Core 图表截图](../../visual-baseline/echarts-layout-core.png)

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

## 配置项

<!-- OPTIONS:START -->
此表由 `scripts/sync-options-from-readmes.mjs --write-readmes` 生成。更新英文 README 的配置表后，运行 `npm run docs:sync-options` 可刷新文档页。

| 配置项 | 说明 | 可选值 |
| --- | --- | --- |
| `type` | 选择要运行的图布局算法。 | `'radial' \| 'concentric' \| 'grid' \| 'mds' \| 'arc'` |
| `input` | 汇总图布局输入数据和连线配置。 | `对象` |
| `input.data` | 要布局的图节点。与 input.nodes 效果相同。 | `数组<对象 \| 未知[]>` |
| `input.data.id` | 记录 ID。 | `字符串 \| 数字` |
| `input.data.name` | 显示名称。 | `字符串` |
| `input.data.value` | 数值。 | `数字` |
| `input.data.itemStyle` | 单条记录的图元样式。 | `对象` |
| `input.data.itemStyle.color` | 填充颜色。 | `字符串` |
| `input.data.itemStyle.fill` | 填充颜色的别名。 | `字符串` |
| `input.data.itemStyle.opacity` | 填充透明度。 | `数字` |
| `input.data.itemStyle.borderColor` | 边框颜色。 | `字符串` |
| `input.data.itemStyle.borderWidth` | 边框宽度。 | `数字` |
| `input.data.itemStyle.borderRadius` | 圆角半径。 | `数字` |
| `input.data.itemStyle.shadowBlur` | 阴影模糊半径。 | `数字` |
| `input.data.itemStyle.shadowColor` | 阴影颜色。 | `字符串` |
| `input.data.itemStyle.lineWidth` | icon or shape 样式使用的Stroke 宽度。 | `数字` |
| `input.data.label` | 单条记录的标签样式。 | `对象` |
| `input.data.label.show` | 为 true 时显示标签。 | `布尔值` |
| `input.data.label.color` | 标签文字颜色。 | `字符串` |
| `input.data.label.fontSize` | 标签文字大小。 | `数字` |
| `input.data.label.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `input.data.label.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `input.data.x` | X 坐标或分类。 | `数字` |
| `input.data.y` | Y 坐标或分类。 | `数字` |
| `input.data.size` | 单条记录的大小。 | `数字` |
| `input.nodes` | 与 input.data 效果相同。要布局的图节点。 | `数组<对象 \| 未知[]>` |
| `input.nodes.id` | 记录 ID。 | `字符串 \| 数字` |
| `input.nodes.name` | 显示名称。 | `字符串` |
| `input.nodes.value` | 数值。 | `数字` |
| `input.nodes.itemStyle` | 单条记录的图元样式。 | `对象` |
| `input.nodes.itemStyle.color` | 填充颜色。 | `字符串` |
| `input.nodes.itemStyle.fill` | 填充颜色的别名。 | `字符串` |
| `input.nodes.itemStyle.opacity` | 填充透明度。 | `数字` |
| `input.nodes.itemStyle.borderColor` | 边框颜色。 | `字符串` |
| `input.nodes.itemStyle.borderWidth` | 边框宽度。 | `数字` |
| `input.nodes.itemStyle.borderRadius` | 圆角半径。 | `数字` |
| `input.nodes.itemStyle.shadowBlur` | 阴影模糊半径。 | `数字` |
| `input.nodes.itemStyle.shadowColor` | 阴影颜色。 | `字符串` |
| `input.nodes.itemStyle.lineWidth` | icon or shape 样式使用的Stroke 宽度。 | `数字` |
| `input.nodes.label` | 单条记录的标签样式。 | `对象` |
| `input.nodes.label.show` | 为 true 时显示标签。 | `布尔值` |
| `input.nodes.label.color` | 标签文字颜色。 | `字符串` |
| `input.nodes.label.fontSize` | 标签文字大小。 | `数字` |
| `input.nodes.label.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `input.nodes.label.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `input.nodes.x` | X 坐标或分类。 | `数字` |
| `input.nodes.y` | Y 坐标或分类。 | `数字` |
| `input.nodes.size` | 单条记录的大小。 | `数字` |
| `input.links` | 连接 source 与 target 节点的图边。与 input.edges 效果相同。 | `数组<对象>` |
| `input.links.source` | 源节点 ID 或名称。 | `字符串 \| 数字` |
| `input.links.target` | 目标节点 ID 或名称。 | `字符串 \| 数字` |
| `input.edges` | 与 input.links 效果相同。连接 source 与 target 节点的图边。 | `数组<对象>` |
| `input.edges.source` | 源节点 ID 或名称。 | `字符串 \| 数字` |
| `input.edges.target` | 目标节点 ID 或名称。 | `字符串 \| 数字` |
| `width` | 布局视口宽度。 | `数字` |
| `height` | 布局视口高度。 | `数字` |
| `center` | 布局视口内的中心点。 | `[数字 \| 字符串, 数字 \| 字符串]` |
| `nodeSize` | 布局间距和防重叠处理使用的节点 diameter。 | `数字 \| 数字[] \| 函数` |
| `nodeSpacing` | 每个节点周围的额外间距。 | `数字 \| 函数` |
| `preventOverlap` | 分隔节点 when a 布局 can otherwise place them too close。 | `布尔值` |
| `preventOverlapPadding` | 防重叠处理使用的额外间距。 | `数字` |
| `sortBy` | 对节点 before 布局s that use 顺序ing排序。 | `字符串 \| 函数` |
| `linkDistance` | 相连节点之间的目标距离。 | `数字` |
| `focusNode` | 节点 ID or 名称 used as the 径向 中心点。 | `字符串 \| 数字` |
| `unitRadius` | 径向图层级之间的距离。 | `数字` |
| `strictRadial` | 保持径向 节点 on strict level 环。 | `布尔值` |
| `maxIteration` | 最大值 布局 iterations for 径向 refinement。 | `数字` |
| `maxPreventOverlapIteration` | 防重叠处理使用的最大值 iterations。 | `数字` |
| `sortStrength` | Weight applied when 排序后 径向 节点 share a 环。 | `数字` |
| `maxLevelDiff` | 最大值 score difference before 同心 节点 move to a new level。 | `数字` |
| `sweep` | 径向 or 同心 placement使用的角度 span。 | `数字 (radians)` |
| `equidistant` | 强制同心 levels to use equal 环 间距。 | `布尔值` |
| `startAngle` | 开始ing 角度 for 环形 布局s。 | `数字 (radians)` |
| `clockwise` | 放置环形 节点 顺时针。 | `布尔值` |
| `rows` | 网格布局请求的行数。 | `数字` |
| `cols` | 网格布局请求的列数。 | `数字` |
| `begin` | 网格布局左上角起点。 | `[数字 \| 字符串, 数字 \| 字符串]` |
| `condense` | 允许网格 cells shrink to the 最小值 大小 needed by 节点。 | `布尔值` |
| `position` | 固定网格 节点 to 显式 行 and 列 cells。 | `函数(node) => { row, col }` |
| `nodeSep` | 弧形布局中节点之间的水平间距。 | `数字` |
<!-- OPTIONS:END -->
