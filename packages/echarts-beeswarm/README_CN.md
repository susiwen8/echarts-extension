# @echarts-extension/beeswarm

语言：[English](./README.md) | 中文

ECharts 蜂群图扩展。导入本包即可注册 `series.type = 'beeswarm'`。

![Beeswarm 图表截图](../../visual-baseline/echarts-beeswarm.png)

## 安装

```bash
npm install echarts @echarts-extension/beeswarm
```

## 基础用法

```js
import * as echarts from 'echarts';
import '@echarts-extension/beeswarm';

const chart = echarts.init(document.getElementById('main'));

chart.setOption({
  series: [
    {
      type: 'beeswarm',
      data: [
        { team: 'Design', score: 62, name: 'D-01' },
        { team: 'Design', score: 64, name: 'D-02' },
        { team: 'Engineering', score: 71, name: 'E-01' },
        { team: 'Engineering', score: 72, name: 'E-02' }
      ],
      categoryField: 'team',
      valueField: 'score',
      nameField: 'name',
      categories: ['Design', 'Engineering'],
      symbolSize: 14,
      collisionPadding: 2,
      label: { show: true }
    }
  ]
});
```

## 数据

可以使用对象或数组行：

- 对象行读取 `categoryField`、`valueField`，以及可选的 `nameField`。
- 数组行可以配合 `dimensions`，例如 `dimensions: ['team', 'score', 'name']`。
- 没有数值的无效行会被跳过。

## 常用选项

- `orient`：`horizontal` 将数值放在 x 轴，`vertical` 将数值放在 y 轴。
- `categories`：显式分类顺序。
- `min`, `max`, `tickCount`, `nice`：数值轴设置。
- `symbolSize`：圆直径。
- `collisionPadding` 和 `swarmRadius`：调节避让重叠的效果。
- `valueAxis`, `categoryAxis`, `grid`, `itemStyle`, `label`, `emphasis`：展示样式。

## 配置项

<!-- OPTIONS:START -->
此表由 `scripts/sync-options-from-readmes.mjs --write-readmes` 生成。更新英文 README 的配置表后，运行 `npm run docs:sync-options` 可刷新文档页。

| 配置项 | 说明 | 可选值 |
| --- | --- | --- |
| `type` | 向 ECharts 注册该包的系列类型。 | `'beeswarm'` |
| `silent` | 为 true 时禁用mouse events for the 系列。 | `布尔值` |
| `width` | 系列区域宽度。 | `数字 \| 字符串 (像素或百分比)` |
| `height` | 系列区域高度。 | `数字 \| 字符串 (像素或百分比)` |
| `top` | 距离图表容器顶部的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `right` | 距离图表容器右侧的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `bottom` | 距离图表容器底部的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `left` | 距离图表容器左侧的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `data` | 点 记录 grouped into a collision-aware swarm。 | `数组<对象 \| 未知[]>` |
| `data.category` | 分类名称或 ID。 | `字符串 \| 数字` |
| `data.value` | 数值。 | `数字` |
| `data.name` | 显示名称。 | `字符串 \| 数字` |
| `dimensions` | 当数据行为数组时，用于命名 tuple 列。 | `字符串[]` |
| `categoryField` | 用于分类的字段。 | `字符串 \| 数字` |
| `valueField` | 用于numeric 数值的字段。 | `字符串 \| 数字` |
| `nameField` | 用于项 名称s的字段。 | `字符串 \| 数字` |
| `categories` | 显式分类顺序。 | `数组<字符串 \| 数字>` |
| `orient` | Swarm direction。 | `'horizontal' \| 'vertical'` |
| `padding` | 图表周围的内边距。 | `数字 \| 对象` |
| `padding.top` | 顶部内边距。 | `数字` |
| `padding.right` | 右侧内边距。 | `数字` |
| `padding.bottom` | 底部内边距。 | `数字` |
| `padding.left` | 左侧内边距。 | `数字` |
| `min` | 数值轴手动最小值。 | `数字` |
| `max` | 数值轴手动最大值。 | `数字` |
| `tickCount` | 数值轴首选刻度数量。 | `数字` |
| `nice` | Rounds 数值 extent to nicer tick 数值。 | `布尔值` |
| `symbolSize` | 大小 of swarm 符号。 | `数字` |
| `collisionPadding` | 最小值 间距 between collIDing 符号。 | `数字` |
| `swarmRadius` | 最大值 半径 used to spread a 分类 swarm。 | `数字` |
| `grid` | 显示或隐藏图表 网格。 | `对象` |
| `grid.show` | 为 true 时显示网格。 | `布尔值` |
| `valueAxis` | 控制数值-坐标轴 标签 and 线。 | `对象` |
| `valueAxis.show` | 为 true 时显示坐标轴。 | `布尔值` |
| `valueAxis.name` | 坐标轴标题文本。 | `字符串` |
| `valueAxis.label` | 设置坐标轴标签样式。 | `对象` |
| `valueAxis.label.show` | 为 true 时显示标签。 | `布尔值` |
| `valueAxis.label.color` | 标签文字颜色。 | `字符串` |
| `valueAxis.label.fontSize` | 标签文字大小。 | `数字` |
| `valueAxis.label.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `valueAxis.label.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `valueAxis.splitLine` | 控制分隔线。 | `对象` |
| `valueAxis.axisLine` | 控制坐标轴基线。 | `对象` |
| `valueAxis.nameTextStyle` | 设置坐标轴标题样式。 | `对象` |
| `valueAxis.nameTextStyle.color` | 文本颜色。 | `字符串` |
| `valueAxis.nameTextStyle.fontSize` | 文本大小。 | `数字` |
| `valueAxis.nameTextStyle.fontWeight` | 文本字重。 | `字符串 \| 数字` |
| `valueAxis.label.rotate` | 坐标轴标签旋转。 | `数字 \| 布尔值 \| 'tangential'` |
| `valueAxis.splitLine.show` | 为 true 时显示分隔线。 | `布尔值` |
| `valueAxis.splitLine.lineStyle` | 设置分隔线样式。 | `对象` |
| `valueAxis.splitLine.lineStyle.show` | 为 true 时显示线 group。 | `布尔值` |
| `valueAxis.splitLine.lineStyle.color` | 线条颜色。 | `字符串` |
| `valueAxis.splitLine.lineStyle.stroke` | 线条颜色的别名。 | `字符串` |
| `valueAxis.splitLine.lineStyle.width` | 线宽。 | `数字` |
| `valueAxis.splitLine.lineStyle.lineWidth` | 线宽的别名。 | `数字` |
| `valueAxis.splitLine.lineStyle.opacity` | 线条透明度。 | `数字` |
| `valueAxis.splitLine.lineStyle.type` | 线条虚线样式。 | `'solid' \| 'dashed' \| 'dotted' \| 数字[] \| 字符串` |
| `valueAxis.splitLine.lineStyle.dashOffset` | 虚线偏移量。 | `数字` |
| `valueAxis.splitLine.lineStyle.lineDashOffset` | 虚线偏移量的别名。 | `数字` |
| `valueAxis.splitLine.lineStyle.cornerRadius` | 折线路径圆角半径。 | `数字` |
| `valueAxis.splitLine.lineStyle.cap` | 线帽样式。 | `'round' \| 'butt' \| 'square'` |
| `valueAxis.splitLine.lineStyle.join` | 线连接样式。 | `'round' \| 'bevel' \| 'miter'` |
| `valueAxis.splitLine.lineStyle.dashArray` | 虚线模式。 | `数字[] \| 字符串` |
| `valueAxis.splitLine.lineStyle.lineDash` | 虚线模式别名。 | `数字[]` |
| `valueAxis.axisLine.show` | 为 true 时显示坐标轴基线。 | `布尔值` |
| `valueAxis.axisLine.lineStyle` | 设置坐标轴基线样式。 | `对象` |
| `valueAxis.axisLine.lineStyle.show` | 为 true 时显示线 group。 | `布尔值` |
| `valueAxis.axisLine.lineStyle.color` | 线条颜色。 | `字符串` |
| `valueAxis.axisLine.lineStyle.stroke` | 线条颜色的别名。 | `字符串` |
| `valueAxis.axisLine.lineStyle.width` | 线宽。 | `数字` |
| `valueAxis.axisLine.lineStyle.lineWidth` | 线宽的别名。 | `数字` |
| `valueAxis.axisLine.lineStyle.opacity` | 线条透明度。 | `数字` |
| `valueAxis.axisLine.lineStyle.type` | 线条虚线样式。 | `'solid' \| 'dashed' \| 'dotted' \| 数字[] \| 字符串` |
| `valueAxis.axisLine.lineStyle.dashOffset` | 虚线偏移量。 | `数字` |
| `valueAxis.axisLine.lineStyle.lineDashOffset` | 虚线偏移量的别名。 | `数字` |
| `valueAxis.axisLine.lineStyle.cornerRadius` | 折线路径圆角半径。 | `数字` |
| `valueAxis.axisLine.lineStyle.cap` | 线帽样式。 | `'round' \| 'butt' \| 'square'` |
| `valueAxis.axisLine.lineStyle.join` | 线连接样式。 | `'round' \| 'bevel' \| 'miter'` |
| `valueAxis.axisLine.lineStyle.dashArray` | 虚线模式。 | `数字[] \| 字符串` |
| `valueAxis.axisLine.lineStyle.lineDash` | 虚线模式别名。 | `数字[]` |
| `categoryAxis` | 控制分类-坐标轴 标签 and 线。 | `对象` |
| `categoryAxis.show` | 为 true 时显示坐标轴。 | `布尔值` |
| `categoryAxis.name` | 坐标轴标题文本。 | `字符串` |
| `categoryAxis.label` | 设置坐标轴标签样式。 | `对象` |
| `categoryAxis.label.show` | 为 true 时显示标签。 | `布尔值` |
| `categoryAxis.label.color` | 标签文字颜色。 | `字符串` |
| `categoryAxis.label.fontSize` | 标签文字大小。 | `数字` |
| `categoryAxis.label.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `categoryAxis.label.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `categoryAxis.splitLine` | 控制分隔线。 | `对象` |
| `categoryAxis.axisLine` | 控制坐标轴基线。 | `对象` |
| `categoryAxis.nameTextStyle` | 设置坐标轴标题样式。 | `对象` |
| `categoryAxis.nameTextStyle.color` | 文本颜色。 | `字符串` |
| `categoryAxis.nameTextStyle.fontSize` | 文本大小。 | `数字` |
| `categoryAxis.nameTextStyle.fontWeight` | 文本字重。 | `字符串 \| 数字` |
| `categoryAxis.label.rotate` | 坐标轴标签旋转。 | `数字 \| 布尔值 \| 'tangential'` |
| `categoryAxis.splitLine.show` | 为 true 时显示分隔线。 | `布尔值` |
| `categoryAxis.splitLine.lineStyle` | 设置分隔线样式。 | `对象` |
| `categoryAxis.splitLine.lineStyle.show` | 为 true 时显示线 group。 | `布尔值` |
| `categoryAxis.splitLine.lineStyle.color` | 线条颜色。 | `字符串` |
| `categoryAxis.splitLine.lineStyle.stroke` | 线条颜色的别名。 | `字符串` |
| `categoryAxis.splitLine.lineStyle.width` | 线宽。 | `数字` |
| `categoryAxis.splitLine.lineStyle.lineWidth` | 线宽的别名。 | `数字` |
| `categoryAxis.splitLine.lineStyle.opacity` | 线条透明度。 | `数字` |
| `categoryAxis.splitLine.lineStyle.type` | 线条虚线样式。 | `'solid' \| 'dashed' \| 'dotted' \| 数字[] \| 字符串` |
| `categoryAxis.splitLine.lineStyle.dashOffset` | 虚线偏移量。 | `数字` |
| `categoryAxis.splitLine.lineStyle.lineDashOffset` | 虚线偏移量的别名。 | `数字` |
| `categoryAxis.splitLine.lineStyle.cornerRadius` | 折线路径圆角半径。 | `数字` |
| `categoryAxis.splitLine.lineStyle.cap` | 线帽样式。 | `'round' \| 'butt' \| 'square'` |
| `categoryAxis.splitLine.lineStyle.join` | 线连接样式。 | `'round' \| 'bevel' \| 'miter'` |
| `categoryAxis.splitLine.lineStyle.dashArray` | 虚线模式。 | `数字[] \| 字符串` |
| `categoryAxis.splitLine.lineStyle.lineDash` | 虚线模式别名。 | `数字[]` |
| `categoryAxis.axisLine.show` | 为 true 时显示坐标轴基线。 | `布尔值` |
| `categoryAxis.axisLine.lineStyle` | 设置坐标轴基线样式。 | `对象` |
| `categoryAxis.axisLine.lineStyle.show` | 为 true 时显示线 group。 | `布尔值` |
| `categoryAxis.axisLine.lineStyle.color` | 线条颜色。 | `字符串` |
| `categoryAxis.axisLine.lineStyle.stroke` | 线条颜色的别名。 | `字符串` |
| `categoryAxis.axisLine.lineStyle.width` | 线宽。 | `数字` |
| `categoryAxis.axisLine.lineStyle.lineWidth` | 线宽的别名。 | `数字` |
| `categoryAxis.axisLine.lineStyle.opacity` | 线条透明度。 | `数字` |
| `categoryAxis.axisLine.lineStyle.type` | 线条虚线样式。 | `'solid' \| 'dashed' \| 'dotted' \| 数字[] \| 字符串` |
| `categoryAxis.axisLine.lineStyle.dashOffset` | 虚线偏移量。 | `数字` |
| `categoryAxis.axisLine.lineStyle.lineDashOffset` | 虚线偏移量的别名。 | `数字` |
| `categoryAxis.axisLine.lineStyle.cornerRadius` | 折线路径圆角半径。 | `数字` |
| `categoryAxis.axisLine.lineStyle.cap` | 线帽样式。 | `'round' \| 'butt' \| 'square'` |
| `categoryAxis.axisLine.lineStyle.join` | 线连接样式。 | `'round' \| 'bevel' \| 'miter'` |
| `categoryAxis.axisLine.lineStyle.dashArray` | 虚线模式。 | `数字[] \| 字符串` |
| `categoryAxis.axisLine.lineStyle.lineDash` | 虚线模式别名。 | `数字[]` |
| `itemStyle` | 设置蜂群图符号样式。 | `对象` |
| `itemStyle.color` | 主颜色。 | `字符串` |
| `itemStyle.opacity` | 透明度。 | `数字` |
| `itemStyle.borderColor` | 边框颜色。 | `字符串` |
| `itemStyle.borderWidth` | 边框宽度。 | `数字` |
| `itemStyle.shadowBlur` | 阴影模糊半径。 | `数字` |
| `itemStyle.shadowColor` | 阴影颜色。 | `字符串` |
| `label` | 设置点 标签样式。 | `对象` |
| `label.show` | 为 true 时显示标签。 | `布尔值` |
| `label.color` | 标签文字颜色。 | `字符串` |
| `label.fontSize` | 标签文字大小。 | `数字` |
| `label.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `label.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `emphasis` | 设置符号 while 悬停时样式。 | `对象` |
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
