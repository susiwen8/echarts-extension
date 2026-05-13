# @echarts-extension/smith

语言：[English](./README.md) | 中文

ECharts Smith 圆图扩展。导入本包即可注册 `series.type = 'smith'`。

![Smith 图表截图](../../visual-baseline/echarts-smith.png)

## 安装

```bash
npm install echarts @echarts-extension/smith
```

## 基础用法

```js
import * as echarts from 'echarts';
import '@echarts-extension/smith';

const chart = echarts.init(document.getElementById('main'));

chart.setOption({
  series: [
    {
      type: 'smith',
      referenceImpedance: 50,
      resistanceField: 'resistance',
      reactanceField: 'reactance',
      data: [
        { name: 'Matched', resistance: 50, reactance: 0 },
        { name: 'Inductive', resistance: 75, reactance: 25 },
        { name: 'Capacitive', resistance: 25, reactance: -20 }
      ],
      label: { show: true },
      showSwrCircle: true
    }
  ]
});
```

## 数据

默认情况下，数据行会作为阻抗值读取，并按 `referenceImpedance` 归一化。

- 对象行可以使用 `r`/`x`、`resistance`/`reactance` 或自定义字段。
- 数组行可以配合 `dimensions`。
- 设置 `dataType: 'gamma'` 时，可通过 `gamma`、`gammaReal` 和 `gammaImag` 提供反射系数值。

## 常用选项

- `referenceImpedance`：用于归一化电阻/电抗的阻抗。
- `resistanceValues`, `reactanceValues`：网格线取值。
- `showSwrCircle`, `swrMagnitude`, `swrIndex`：恒定 SWR 圆设置。
- `grid.label.resistanceFormatter`, `grid.label.reactanceFormatter`：可选标签模板，例如 `{ohms}` 和 `{ohms}j`。
- `cursor`：任意鼠标位置的交互读数，包括虚线 VSWR 圆、恒定电抗曲线以及阻抗/导纳提示。
- `grid`, `lineStyle`, `itemStyle`, `label`, `swrStyle`：展示样式。

## 配置项

<!-- OPTIONS:START -->
此表由 `scripts/sync-options-from-readmes.mjs --write-readmes` 生成。更新英文 README 的配置表后，运行 `npm run docs:sync-options` 可刷新文档页。

| 配置项 | 说明 | 可选值 |
| --- | --- | --- |
| `type` | 向 ECharts 注册该包的系列类型。 | `'smith'` |
| `silent` | 为 true 时禁用mouse events for the 系列。 | `布尔值` |
| `width` | 系列区域宽度。 | `数字 \| 字符串 (像素或百分比)` |
| `height` | 系列区域高度。 | `数字 \| 字符串 (像素或百分比)` |
| `top` | 距离图表容器顶部的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `right` | 距离图表容器右侧的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `bottom` | 距离图表容器底部的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `left` | 距离图表容器左侧的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `data` | Impedance or reflection-coefficient 记录。 | `数组<对象 \| 未知[]>` |
| `data.name` | 显示名称。 | `字符串` |
| `data.resistance` | resistance字段。 | `数字` |
| `data.reactance` | reactance字段。 | `数字` |
| `data.gamma` | gamma字段。 | `[数字, 数字] \| 字符串` |
| `data.gammaReal` | gamma real字段。 | `数字` |
| `data.gammaImag` | gamma imag字段。 | `数字` |
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
| `dataType` | How input data is interpreted。 | `'impedance' \| 'gamma'` |
| `referenceImpedance` | Reference impedance used to normalize 数值。 | `数字` |
| `dimensions` | 当数据行为数组时，用于命名 tuple 列。 | `字符串[]` |
| `nameField` | 用于标签 and 名称s的字段。 | `字符串 \| 数字` |
| `resistanceField` | 用于resistance 数值的字段。 | `字符串 \| 数字` |
| `reactanceField` | 用于reactance 数值的字段。 | `字符串 \| 数字` |
| `gammaField` | 字段 containing a reflection coefficient pair。 | `字符串 \| 数字` |
| `gammaRealField` | 用于gamma real 数值的字段。 | `字符串 \| 数字` |
| `gammaImagField` | 用于gamma imaginary 数值的字段。 | `字符串 \| 数字` |
| `resistanceValues` | 网格 resistance circles to draw。 | `数字[]` |
| `reactanceValues` | 网格 reactance arcs to draw。 | `数字[]` |
| `padding` | 内边距 around the Smith 图表。 | `数字 \| 对象` |
| `padding.top` | 顶部内边距。 | `数字` |
| `padding.right` | 右侧内边距。 | `数字` |
| `padding.bottom` | 底部内边距。 | `数字` |
| `padding.left` | 左侧内边距。 | `数字` |
| `showSwrCircle` | 为 true 时显示selected SWR circle。 | `布尔值` |
| `swrMagnitude` | 用于SWR circle的Magnitude。 | `数字` |
| `swrIndex` | Index of a data 点 used to derive the SWR circle。 | `数字` |
| `symbolSize` | 点符号大小。 | `数字` |
| `grid` | 控制史密斯圆图网格线和标签。 | `对象` |
| `grid.show` | 为 true 时显示Smith 图表 网格。 | `布尔值` |
| `grid.unitCircle` | 设置unit circle 网格 线样式。 | `对象` |
| `grid.axisLine` | 设置水平 坐标轴 线样式。 | `对象` |
| `grid.resistanceLine` | 设置resistance 网格 circles样式。 | `对象` |
| `grid.reactanceLine` | 设置reactance 网格 arcs样式。 | `对象` |
| `grid.label` | 设置网格 标签样式。 | `对象` |
| `grid.label.show` | 为 true 时显示标签。 | `布尔值` |
| `grid.label.color` | 标签文字颜色。 | `字符串` |
| `grid.label.fontSize` | 标签文字大小。 | `数字` |
| `grid.label.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `grid.label.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `grid.unitCircle.show` | 为 true 时显示网格 线 group。 | `布尔值` |
| `grid.unitCircle.lineStyle` | 设置网格 线 group样式。 | `对象` |
| `grid.unitCircle.lineStyle.show` | 为 true 时显示线 group。 | `布尔值` |
| `grid.unitCircle.lineStyle.color` | 线条颜色。 | `字符串` |
| `grid.unitCircle.lineStyle.stroke` | 线条颜色的别名。 | `字符串` |
| `grid.unitCircle.lineStyle.width` | 线宽。 | `数字` |
| `grid.unitCircle.lineStyle.lineWidth` | 线宽的别名。 | `数字` |
| `grid.unitCircle.lineStyle.opacity` | 线条透明度。 | `数字` |
| `grid.unitCircle.lineStyle.type` | 线条虚线样式。 | `'solid' \| 'dashed' \| 'dotted' \| 数字[] \| 字符串` |
| `grid.unitCircle.lineStyle.dashOffset` | 虚线偏移量。 | `数字` |
| `grid.unitCircle.lineStyle.lineDashOffset` | 虚线偏移量的别名。 | `数字` |
| `grid.unitCircle.lineStyle.cornerRadius` | 折线路径圆角半径。 | `数字` |
| `grid.unitCircle.lineStyle.cap` | 线帽样式。 | `'round' \| 'butt' \| 'square'` |
| `grid.unitCircle.lineStyle.join` | 线连接样式。 | `'round' \| 'bevel' \| 'miter'` |
| `grid.unitCircle.lineStyle.dashArray` | 虚线模式。 | `数字[] \| 字符串` |
| `grid.unitCircle.lineStyle.lineDash` | 虚线模式别名。 | `数字[]` |
| `grid.axisLine.show` | 为 true 时显示网格 线 group。 | `布尔值` |
| `grid.axisLine.lineStyle` | 设置网格 线 group样式。 | `对象` |
| `grid.axisLine.lineStyle.show` | 为 true 时显示线 group。 | `布尔值` |
| `grid.axisLine.lineStyle.color` | 线条颜色。 | `字符串` |
| `grid.axisLine.lineStyle.stroke` | 线条颜色的别名。 | `字符串` |
| `grid.axisLine.lineStyle.width` | 线宽。 | `数字` |
| `grid.axisLine.lineStyle.lineWidth` | 线宽的别名。 | `数字` |
| `grid.axisLine.lineStyle.opacity` | 线条透明度。 | `数字` |
| `grid.axisLine.lineStyle.type` | 线条虚线样式。 | `'solid' \| 'dashed' \| 'dotted' \| 数字[] \| 字符串` |
| `grid.axisLine.lineStyle.dashOffset` | 虚线偏移量。 | `数字` |
| `grid.axisLine.lineStyle.lineDashOffset` | 虚线偏移量的别名。 | `数字` |
| `grid.axisLine.lineStyle.cornerRadius` | 折线路径圆角半径。 | `数字` |
| `grid.axisLine.lineStyle.cap` | 线帽样式。 | `'round' \| 'butt' \| 'square'` |
| `grid.axisLine.lineStyle.join` | 线连接样式。 | `'round' \| 'bevel' \| 'miter'` |
| `grid.axisLine.lineStyle.dashArray` | 虚线模式。 | `数字[] \| 字符串` |
| `grid.axisLine.lineStyle.lineDash` | 虚线模式别名。 | `数字[]` |
| `grid.resistanceLine.show` | 为 true 时显示网格 线 group。 | `布尔值` |
| `grid.resistanceLine.lineStyle` | 设置网格 线 group样式。 | `对象` |
| `grid.resistanceLine.lineStyle.show` | 为 true 时显示线 group。 | `布尔值` |
| `grid.resistanceLine.lineStyle.color` | 线条颜色。 | `字符串` |
| `grid.resistanceLine.lineStyle.stroke` | 线条颜色的别名。 | `字符串` |
| `grid.resistanceLine.lineStyle.width` | 线宽。 | `数字` |
| `grid.resistanceLine.lineStyle.lineWidth` | 线宽的别名。 | `数字` |
| `grid.resistanceLine.lineStyle.opacity` | 线条透明度。 | `数字` |
| `grid.resistanceLine.lineStyle.type` | 线条虚线样式。 | `'solid' \| 'dashed' \| 'dotted' \| 数字[] \| 字符串` |
| `grid.resistanceLine.lineStyle.dashOffset` | 虚线偏移量。 | `数字` |
| `grid.resistanceLine.lineStyle.lineDashOffset` | 虚线偏移量的别名。 | `数字` |
| `grid.resistanceLine.lineStyle.cornerRadius` | 折线路径圆角半径。 | `数字` |
| `grid.resistanceLine.lineStyle.cap` | 线帽样式。 | `'round' \| 'butt' \| 'square'` |
| `grid.resistanceLine.lineStyle.join` | 线连接样式。 | `'round' \| 'bevel' \| 'miter'` |
| `grid.resistanceLine.lineStyle.dashArray` | 虚线模式。 | `数字[] \| 字符串` |
| `grid.resistanceLine.lineStyle.lineDash` | 虚线模式别名。 | `数字[]` |
| `grid.reactanceLine.show` | 为 true 时显示网格 线 group。 | `布尔值` |
| `grid.reactanceLine.lineStyle` | 设置网格 线 group样式。 | `对象` |
| `grid.reactanceLine.lineStyle.show` | 为 true 时显示线 group。 | `布尔值` |
| `grid.reactanceLine.lineStyle.color` | 线条颜色。 | `字符串` |
| `grid.reactanceLine.lineStyle.stroke` | 线条颜色的别名。 | `字符串` |
| `grid.reactanceLine.lineStyle.width` | 线宽。 | `数字` |
| `grid.reactanceLine.lineStyle.lineWidth` | 线宽的别名。 | `数字` |
| `grid.reactanceLine.lineStyle.opacity` | 线条透明度。 | `数字` |
| `grid.reactanceLine.lineStyle.type` | 线条虚线样式。 | `'solid' \| 'dashed' \| 'dotted' \| 数字[] \| 字符串` |
| `grid.reactanceLine.lineStyle.dashOffset` | 虚线偏移量。 | `数字` |
| `grid.reactanceLine.lineStyle.lineDashOffset` | 虚线偏移量的别名。 | `数字` |
| `grid.reactanceLine.lineStyle.cornerRadius` | 折线路径圆角半径。 | `数字` |
| `grid.reactanceLine.lineStyle.cap` | 线帽样式。 | `'round' \| 'butt' \| 'square'` |
| `grid.reactanceLine.lineStyle.join` | 线连接样式。 | `'round' \| 'bevel' \| 'miter'` |
| `grid.reactanceLine.lineStyle.dashArray` | 虚线模式。 | `数字[] \| 字符串` |
| `grid.reactanceLine.lineStyle.lineDash` | 虚线模式别名。 | `数字[]` |
| `grid.label.resistanceFormatter` | 格式化resistance 标签。 | `字符串 \| 函数` |
| `grid.label.reactanceFormatter` | 格式化reactance 标签。 | `字符串 \| 函数` |
| `swrStyle` | 设置SWR circle样式。 | `对象` |
| `swrStyle.color` | 主颜色。 | `字符串` |
| `swrStyle.stroke` | 描边颜色。 | `字符串` |
| `swrStyle.width` | 宽度值。 | `数字` |
| `swrStyle.lineWidth` | 线宽。 | `数字` |
| `swrStyle.opacity` | 透明度。 | `数字` |
| `swrStyle.type` | 线条或图元类型。 | `'solid' \| 'dashed' \| 'dotted' \| 数字[]` |
| `lineStyle` | 设置连接线样式。 | `对象` |
| `lineStyle.color` | 主颜色。 | `字符串` |
| `lineStyle.stroke` | 描边颜色。 | `字符串` |
| `lineStyle.width` | 宽度值。 | `数字` |
| `lineStyle.lineWidth` | 线宽。 | `数字` |
| `lineStyle.opacity` | 透明度。 | `数字` |
| `lineStyle.type` | 线条或图元类型。 | `'solid' \| 'dashed' \| 'dotted' \| 数字[]` |
| `itemStyle` | 设置数据点样式。 | `对象` |
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
| `cursor` | 控制交互式阻抗光标。 | `对象` |
| `cursor.show` | 为 true 时显示交互式 cursor。 | `布尔值` |
| `cursor.lineStyle` | 设置cursor guIDe 线样式。 | `对象` |
| `cursor.lineStyle.show` | 为 true 时显示线 group。 | `布尔值` |
| `cursor.lineStyle.color` | 线条颜色。 | `字符串` |
| `cursor.lineStyle.stroke` | 线条颜色的别名。 | `字符串` |
| `cursor.lineStyle.width` | 线宽。 | `数字` |
| `cursor.lineStyle.lineWidth` | 线宽的别名。 | `数字` |
| `cursor.lineStyle.opacity` | 线条透明度。 | `数字` |
| `cursor.lineStyle.type` | 线条虚线样式。 | `'solid' \| 'dashed' \| 'dotted' \| 数字[] \| 字符串` |
| `cursor.lineStyle.dashOffset` | 虚线偏移量。 | `数字` |
| `cursor.lineStyle.lineDashOffset` | 虚线偏移量的别名。 | `数字` |
| `cursor.lineStyle.cornerRadius` | 折线路径圆角半径。 | `数字` |
| `cursor.lineStyle.cap` | 线帽样式。 | `'round' \| 'butt' \| 'square'` |
| `cursor.lineStyle.join` | 线连接样式。 | `'round' \| 'bevel' \| 'miter'` |
| `cursor.lineStyle.dashArray` | 虚线模式。 | `数字[] \| 字符串` |
| `cursor.lineStyle.lineDash` | 虚线模式别名。 | `数字[]` |
| `cursor.circleStyle` | 设置cursor circles样式。 | `对象` |
| `cursor.circleStyle.show` | 为 true 时显示线 group。 | `布尔值` |
| `cursor.circleStyle.color` | 线条颜色。 | `字符串` |
| `cursor.circleStyle.stroke` | 线条颜色的别名。 | `字符串` |
| `cursor.circleStyle.width` | 线宽。 | `数字` |
| `cursor.circleStyle.lineWidth` | 线宽的别名。 | `数字` |
| `cursor.circleStyle.opacity` | 线条透明度。 | `数字` |
| `cursor.circleStyle.type` | 线条虚线样式。 | `'solid' \| 'dashed' \| 'dotted' \| 数字[] \| 字符串` |
| `cursor.circleStyle.dashOffset` | 虚线偏移量。 | `数字` |
| `cursor.circleStyle.lineDashOffset` | 虚线偏移量的别名。 | `数字` |
| `cursor.circleStyle.cornerRadius` | 折线路径圆角半径。 | `数字` |
| `cursor.circleStyle.cap` | 线帽样式。 | `'round' \| 'butt' \| 'square'` |
| `cursor.circleStyle.join` | 线连接样式。 | `'round' \| 'bevel' \| 'miter'` |
| `cursor.circleStyle.dashArray` | 虚线模式。 | `数字[] \| 字符串` |
| `cursor.circleStyle.lineDash` | 虚线模式别名。 | `数字[]` |
| `cursor.curveStyle` | 设置cursor curves样式。 | `对象` |
| `cursor.curveStyle.show` | 为 true 时显示线 group。 | `布尔值` |
| `cursor.curveStyle.color` | 线条颜色。 | `字符串` |
| `cursor.curveStyle.stroke` | 线条颜色的别名。 | `字符串` |
| `cursor.curveStyle.width` | 线宽。 | `数字` |
| `cursor.curveStyle.lineWidth` | 线宽的别名。 | `数字` |
| `cursor.curveStyle.opacity` | 线条透明度。 | `数字` |
| `cursor.curveStyle.type` | 线条虚线样式。 | `'solid' \| 'dashed' \| 'dotted' \| 数字[] \| 字符串` |
| `cursor.curveStyle.dashOffset` | 虚线偏移量。 | `数字` |
| `cursor.curveStyle.lineDashOffset` | 虚线偏移量的别名。 | `数字` |
| `cursor.curveStyle.cornerRadius` | 折线路径圆角半径。 | `数字` |
| `cursor.curveStyle.cap` | 线帽样式。 | `'round' \| 'butt' \| 'square'` |
| `cursor.curveStyle.join` | 线连接样式。 | `'round' \| 'bevel' \| 'miter'` |
| `cursor.curveStyle.dashArray` | 虚线模式。 | `数字[] \| 字符串` |
| `cursor.curveStyle.lineDash` | 虚线模式别名。 | `数字[]` |
| `cursor.tooltip` | 设置cursor 提示框样式。 | `对象` |
| `cursor.tooltip.show` | 为 true 时显示提示框。 | `布尔值` |
| `cursor.tooltip.backgroundColor` | 提示框背景色。 | `字符串` |
| `cursor.tooltip.color` | 提示框文字颜色。 | `字符串` |
| `cursor.tooltip.fontSize` | 提示框文字大小。 | `数字` |
| `cursor.tooltip.lineHeight` | 提示框行高。 | `数字` |
| `cursor.tooltip.padding` | 提示框内边距。 | `数字 \| [数字, 数字] \| [数字, 数字, 数字, 数字]` |
| `cursor.tooltip.borderRadius` | 提示框圆角半径。 | `数字` |
| `cursor.tooltip.borderColor` | 提示框边框颜色。 | `字符串` |
| `cursor.tooltip.borderWidth` | 提示框边框宽度。 | `数字` |
| `cursor.tooltip.opacity` | 提示框透明度。 | `数字` |
| `cursor.tooltip.fontFamily` | 提示框字体。 | `字符串` |
| `emphasis` | 设置悬停时的点样式。 | `对象` |
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
