# @echarts-extension/organization-chart

语言：[English](./README.md) | 中文

ECharts 组织结构图扩展。导入本包即可注册 `series.type = 'organizationChart'`。

![Organization Chart 图表截图](../../visual-baseline/echarts-organization-chart.png)

## 安装

```bash
npm install echarts @echarts-extension/organization-chart
```

## 基础用法

```js
import * as echarts from 'echarts';
import '@echarts-extension/organization-chart';

const chart = echarts.init(document.getElementById('main'));

chart.setOption({
  series: [
    {
      type: 'organizationChart',
      orient: 'TB',
      data: {
        name: 'CEO',
        children: [
          {
            name: 'Product',
            children: [{ name: 'Design' }, { name: 'Research' }]
          },
          {
            name: 'Engineering',
            children: [{ name: 'Frontend' }, { name: 'Platform' }]
          }
        ]
      },
      label: { show: true, formatter: '{b}' }
    }
  ]
});
```

## 数据

可以使用一个嵌套根节点、嵌套根节点数组、带 `id` 和 `parentId` 的扁平行，或显式的 `nodes` 和 `links`。

```js
{
  type: 'organizationChart',
  data: [
    { id: 'ceo', name: 'CEO' },
    { id: 'ops', parentId: 'ceo', name: 'Operations' },
    { id: 'finance', parentId: 'ceo', name: 'Finance' }
  ]
}
```

## 常用选项

- `orient`：`TB`, `BT`, `LR`, or `RL`.
- `nodeWidth`, `nodeHeight`, `levelGap`, `siblingGap`, and `subtreeGap`: 布局尺寸。
- `idField`, `parentIdField`, `nameField`, and `childrenField`: custom 数据字段名。
- `itemStyle`, `lineStyle`, `label`, and `emphasis`: 展示样式。

## 配置项

<!-- OPTIONS:START -->
此表由 `scripts/sync-options-from-readmes.mjs --write-readmes` 生成。更新英文 README 的配置表后，运行 `npm run docs:sync-options` 可刷新文档页。

| 配置项 | 说明 | 可选值 |
| --- | --- | --- |
| `type` | 向 ECharts 注册该包的系列类型。 | `'organizationChart'` |
| `silent` | 为 true 时禁用mouse events for the 系列。 | `布尔值` |
| `width` | 系列区域宽度。 | `数字 \| 字符串 (像素或百分比)` |
| `height` | 系列区域高度。 | `数字 \| 字符串 (像素或百分比)` |
| `top` | 距离图表容器顶部的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `right` | 距离图表容器右侧的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `bottom` | 距离图表容器底部的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `left` | 距离图表容器左侧的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `data` | Tree or flat organization 记录。 | `对象 \| 数组<对象>` |
| `data.id` | 记录 ID。 | `字符串 \| 数字` |
| `data.parentId` | Parent 记录 ID。 | `字符串 \| 数字` |
| `data.name` | 显示名称。 | `字符串` |
| `data.value` | 数值。 | `数字` |
| `data.children` | 子记录。 | `数组<对象>` |
| `data.children.id` | 记录 ID。 | `字符串 \| 数字` |
| `data.children.parentId` | Parent 记录 ID。 | `字符串 \| 数字` |
| `data.children.name` | 显示名称。 | `字符串` |
| `data.children.value` | 数值。 | `数字` |
| `data.children.children` | 子记录。 | `数组<对象>` |
| `data.children.children.name` | 显示名称。 | `字符串` |
| `data.children.children.value` | 数值。 | `数字` |
| `data.children.children.itemStyle` | 单条记录的图元样式。 | `对象` |
| `data.children.children.itemStyle.color` | 填充颜色。 | `字符串` |
| `data.children.children.itemStyle.fill` | 填充颜色的别名。 | `字符串` |
| `data.children.children.itemStyle.opacity` | 填充透明度。 | `数字` |
| `data.children.children.itemStyle.borderColor` | 边框颜色。 | `字符串` |
| `data.children.children.itemStyle.borderWidth` | 边框宽度。 | `数字` |
| `data.children.children.itemStyle.borderRadius` | 圆角半径。 | `数字` |
| `data.children.children.itemStyle.shadowBlur` | 阴影模糊半径。 | `数字` |
| `data.children.children.itemStyle.shadowColor` | 阴影颜色。 | `字符串` |
| `data.children.children.itemStyle.lineWidth` | icon or shape 样式使用的Stroke 宽度。 | `数字` |
| `data.children.children.label` | 单条记录的标签样式。 | `对象` |
| `data.children.children.label.show` | 为 true 时显示标签。 | `布尔值` |
| `data.children.children.label.color` | 标签文字颜色。 | `字符串` |
| `data.children.children.label.fontSize` | 标签文字大小。 | `数字` |
| `data.children.children.label.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `data.children.children.label.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `data.children.itemStyle` | 单条记录的图元样式。 | `对象` |
| `data.children.itemStyle.color` | 填充颜色。 | `字符串` |
| `data.children.itemStyle.fill` | 填充颜色的别名。 | `字符串` |
| `data.children.itemStyle.opacity` | 填充透明度。 | `数字` |
| `data.children.itemStyle.borderColor` | 边框颜色。 | `字符串` |
| `data.children.itemStyle.borderWidth` | 边框宽度。 | `数字` |
| `data.children.itemStyle.borderRadius` | 圆角半径。 | `数字` |
| `data.children.itemStyle.shadowBlur` | 阴影模糊半径。 | `数字` |
| `data.children.itemStyle.shadowColor` | 阴影颜色。 | `字符串` |
| `data.children.itemStyle.lineWidth` | icon or shape 样式使用的Stroke 宽度。 | `数字` |
| `data.children.label` | 单条记录的标签样式。 | `对象` |
| `data.children.label.show` | 为 true 时显示标签。 | `布尔值` |
| `data.children.label.color` | 标签文字颜色。 | `字符串` |
| `data.children.label.fontSize` | 标签文字大小。 | `数字` |
| `data.children.label.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `data.children.label.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `data.itemStyle` | 单条记录的图元样式。 | `对象` |
| `data.itemStyle.color` | 填充颜色。 | `字符串` |
| `data.itemStyle.fill` | 填充颜色的别名。 | `字符串` |
| `data.itemStyle.opacity` | 填充透明度。 | `数字` |
| `data.itemStyle.borderColor` | 边框颜色。 | `字符串` |
| `data.itemStyle.borderWidth` | 边框宽度。 | `数字` |
| `data.itemStyle.borderRadius` | 圆角半径。 | `数字` |
| `data.itemStyle.shadowBlur` | 阴影模糊半径。 | `数字` |
| `data.itemStyle.shadowColor` | 阴影颜色。 | `字符串` |
| `data.itemStyle.lineWidth` | icon or shape 样式使用的Stroke 宽度。 | `数字` |
| `data.label` | 单条记录的标签样式。 | `对象` |
| `data.label.show` | 为 true 时显示标签。 | `布尔值` |
| `data.label.color` | 标签文字颜色。 | `字符串` |
| `data.label.fontSize` | 标签文字大小。 | `数字` |
| `data.label.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `data.label.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `nodes` | Flat 节点 记录 for organization 图表s。 | `数组<对象>` |
| `nodes.id` | 记录 ID。 | `字符串 \| 数字` |
| `nodes.parentId` | Parent 记录 ID。 | `字符串 \| 数字` |
| `nodes.name` | 显示名称。 | `字符串 \| 数字` |
| `nodes.children` | 子记录。 | `数组<对象>` |
| `nodes.children.id` | 记录 ID。 | `字符串 \| 数字` |
| `nodes.children.parentId` | Parent 记录 ID。 | `字符串 \| 数字` |
| `nodes.children.name` | 显示名称。 | `字符串` |
| `nodes.children.value` | 数值。 | `数字` |
| `nodes.children.children` | 子记录。 | `数组<对象>` |
| `nodes.children.children.name` | 显示名称。 | `字符串` |
| `nodes.children.children.value` | 数值。 | `数字` |
| `nodes.children.children.itemStyle` | 单条记录的图元样式。 | `对象` |
| `nodes.children.children.itemStyle.color` | 填充颜色。 | `字符串` |
| `nodes.children.children.itemStyle.fill` | 填充颜色的别名。 | `字符串` |
| `nodes.children.children.itemStyle.opacity` | 填充透明度。 | `数字` |
| `nodes.children.children.itemStyle.borderColor` | 边框颜色。 | `字符串` |
| `nodes.children.children.itemStyle.borderWidth` | 边框宽度。 | `数字` |
| `nodes.children.children.itemStyle.borderRadius` | 圆角半径。 | `数字` |
| `nodes.children.children.itemStyle.shadowBlur` | 阴影模糊半径。 | `数字` |
| `nodes.children.children.itemStyle.shadowColor` | 阴影颜色。 | `字符串` |
| `nodes.children.children.itemStyle.lineWidth` | icon or shape 样式使用的Stroke 宽度。 | `数字` |
| `nodes.children.children.label` | 单条记录的标签样式。 | `对象` |
| `nodes.children.children.label.show` | 为 true 时显示标签。 | `布尔值` |
| `nodes.children.children.label.color` | 标签文字颜色。 | `字符串` |
| `nodes.children.children.label.fontSize` | 标签文字大小。 | `数字` |
| `nodes.children.children.label.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `nodes.children.children.label.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `nodes.children.itemStyle` | 单条记录的图元样式。 | `对象` |
| `nodes.children.itemStyle.color` | 填充颜色。 | `字符串` |
| `nodes.children.itemStyle.fill` | 填充颜色的别名。 | `字符串` |
| `nodes.children.itemStyle.opacity` | 填充透明度。 | `数字` |
| `nodes.children.itemStyle.borderColor` | 边框颜色。 | `字符串` |
| `nodes.children.itemStyle.borderWidth` | 边框宽度。 | `数字` |
| `nodes.children.itemStyle.borderRadius` | 圆角半径。 | `数字` |
| `nodes.children.itemStyle.shadowBlur` | 阴影模糊半径。 | `数字` |
| `nodes.children.itemStyle.shadowColor` | 阴影颜色。 | `字符串` |
| `nodes.children.itemStyle.lineWidth` | icon or shape 样式使用的Stroke 宽度。 | `数字` |
| `nodes.children.label` | 单条记录的标签样式。 | `对象` |
| `nodes.children.label.show` | 为 true 时显示标签。 | `布尔值` |
| `nodes.children.label.color` | 标签文字颜色。 | `字符串` |
| `nodes.children.label.fontSize` | 标签文字大小。 | `数字` |
| `nodes.children.label.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `nodes.children.label.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `links` | 显式 parent-子项 连接 when using 节点/连接 data。与 edges 效果相同。 | `数组<对象>` |
| `links.source` | 源节点 ID 或名称。 | `字符串 \| 数字` |
| `links.target` | 目标节点 ID 或名称。 | `字符串 \| 数字` |
| `edges` | 与 links 效果相同。显式 parent-子项 连接 when using 节点/连接 data。 | `数组<对象>` |
| `edges.source` | 源节点 ID 或名称。 | `字符串 \| 数字` |
| `edges.target` | 目标节点 ID 或名称。 | `字符串 \| 数字` |
| `orient` | Direction of the organization tree。 | `'TB' \| 'BT' \| 'LR' \| 'RL' \| 'vertical' \| 'horizontal'` |
| `padding` | 图表周围的内边距。 | `数字 \| 对象` |
| `padding.top` | 顶部内边距。 | `数字` |
| `padding.right` | 右侧内边距。 | `数字` |
| `padding.bottom` | 底部内边距。 | `数字` |
| `padding.left` | 左侧内边距。 | `数字` |
| `nodeWidth` | 宽度 of each person or group box。 | `数字` |
| `nodeHeight` | 高度 of each person or group box。 | `数字` |
| `levelGap` | Distance between 层级 levels。 | `数字` |
| `siblingGap` | Distance between sibling 节点。 | `数字` |
| `subtreeGap` | Distance between separate subtrees。 | `数字` |
| `idField` | 字段 used as 节点 ID。 | `字符串 \| 数字` |
| `parentIdField` | 字段 used as parent ID in flat data。 | `字符串 \| 数字` |
| `nameField` | 用于节点标签的字段。 | `字符串 \| 数字` |
| `childrenField` | 字段 containing 子项 节点。 | `字符串 \| 数字` |
| `itemStyle` | 设置组织节点样式。 | `对象` |
| `itemStyle.color` | 主颜色。 | `字符串` |
| `itemStyle.fill` | 填充颜色。 | `字符串` |
| `itemStyle.opacity` | 透明度。 | `数字` |
| `itemStyle.borderColor` | 边框颜色。 | `字符串` |
| `itemStyle.borderWidth` | 边框宽度。 | `数字` |
| `itemStyle.borderRadius` | 圆角半径。 | `数字` |
| `lineStyle` | 设置连接线样式。 | `对象` |
| `lineStyle.color` | 主颜色。 | `字符串` |
| `lineStyle.stroke` | 描边颜色。 | `字符串` |
| `lineStyle.width` | 宽度值。 | `数字` |
| `lineStyle.lineWidth` | 线宽。 | `数字` |
| `lineStyle.opacity` | 透明度。 | `数字` |
| `lineStyle.type` | 线条或图元类型。 | `'solid' \| 'dashed' \| 'dotted' \| 数字[]` |
| `label` | 设置节点标签样式。 | `对象` |
| `label.show` | 为 true 时显示标签。 | `布尔值` |
| `label.color` | 标签文字颜色。 | `字符串` |
| `label.fontSize` | 标签文字大小。 | `数字` |
| `label.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `label.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `emphasis` | 设置节点 while 悬停时样式。 | `对象` |
| `emphasis.itemStyle` | 嵌套 项 样式 选项。 | `对象` |
| `emphasis.itemStyle.color` | 填充颜色。 | `字符串` |
| `emphasis.itemStyle.fill` | 填充颜色的别名。 | `字符串` |
| `emphasis.itemStyle.opacity` | 填充透明度。 | `数字` |
| `emphasis.itemStyle.borderColor` | 边框颜色。 | `字符串` |
| `emphasis.itemStyle.borderWidth` | 边框宽度。 | `数字` |
| `emphasis.itemStyle.borderRadius` | 圆角半径。 | `数字` |
| `emphasis.itemStyle.shadowBlur` | 阴影模糊半径。 | `数字` |
| `emphasis.itemStyle.shadowColor` | 阴影颜色。 | `字符串` |
| `emphasis.itemStyle.lineWidth` | icon or shape 样式使用的Stroke 宽度。 | `数字` |
| `emphasis.edgeStyle` | 嵌套 边tyle 选项。 | `对象` |
| `emphasis.edgeStyle.color` | 填充颜色。 | `字符串` |
| `emphasis.edgeStyle.fill` | 填充颜色的别名。 | `字符串` |
| `emphasis.edgeStyle.opacity` | 填充透明度。 | `数字` |
| `emphasis.edgeStyle.borderColor` | 边框颜色。 | `字符串` |
| `emphasis.edgeStyle.borderWidth` | 边框宽度。 | `数字` |
| `emphasis.edgeStyle.borderRadius` | 圆角半径。 | `数字` |
| `emphasis.edgeStyle.shadowBlur` | 阴影模糊半径。 | `数字` |
| `emphasis.edgeStyle.shadowColor` | 阴影颜色。 | `字符串` |
| `emphasis.edgeStyle.lineWidth` | icon or shape 样式使用的Stroke 宽度。 | `数字` |
| `emphasis.focus` | 嵌套 focus 选项。 | `字符串` |
| `emphasis.blurScope` | 嵌套 blurScope 选项。 | `字符串` |
<!-- OPTIONS:END -->
