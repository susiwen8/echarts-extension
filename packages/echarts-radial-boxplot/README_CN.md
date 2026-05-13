# @echarts-extension/radial-boxplot

语言：[English](./README.md) | 中文

ECharts 径向箱线图扩展。导入本包即可注册 `series.type = 'radialBoxplot'`。

![Radial Boxplot 图表截图](../../visual-baseline/echarts-radial-boxplot.png)

## 安装

```bash
npm install echarts @echarts-extension/radial-boxplot
```

## 基础用法

```js
import * as echarts from 'echarts';
import '@echarts-extension/radial-boxplot';

const chart = echarts.init(document.getElementById('main'));

chart.setOption({
  series: [
    {
      type: 'radialBoxplot',
      categoryField: 'name',
      min: 0,
      max: 32,
      innerRadius: '18%',
      outerRadius: '82%',
      boxWidth: 0.58,
      capWidth: 0.34,
      data: [
        { name: 'Oceania', min: 1, q1: 8, median: 13, q3: 21, max: 24 },
        { name: 'East Europe', min: 4, q1: 9, median: 12, q3: 15, max: 19 },
        { name: 'Australia', min: 8, q1: 13, median: 16, q3: 20, max: 26 }
      ]
    }
  ]
});
```

## 数据

可以使用对象或数组行：

- `categoryField` 或 `nameField` 用于识别每个角度槽位。
- `minField`, `q1Field`, `medianField`, `q3Field`, and `maxField` 可映射自定义字段名。
- 默认对象字段为 `min`、`q1`、`median`、`q3` 和 `max`。
- 使用数组行时请设置 `dimensions`。

## 常用选项

- `innerRadius`, `outerRadius`, `center`, `startAngle`, `endAngle`, `clockwise`：极坐标布局设置。
- `min`, `max`, `tickCount`, `nice`：radial 数值轴设置。
- `boxWidth`, `capWidth`, `labelRadius`：mark 几何设置。
- `grid`, `radialAxis`, `angleAxis`：坐标轴和辅助线设置。
- `itemStyle`, `whiskerLineStyle`, `medianLineStyle`, `capLineStyle`：系列样式。

## 配置项

<!-- OPTIONS:START -->
此表由 `scripts/sync-options-from-readmes.mjs --write-readmes` 生成。更新英文 README 的配置表后，运行 `npm run docs:sync-options` 可刷新文档页。

| 配置项 | 说明 | 可选值 |
| --- | --- | --- |
| `type` | 向 ECharts 注册该包的系列类型。 | `'radialBoxplot'` |
| `silent` | 为 true 时禁用mouse events for the 系列。 | `布尔值` |
| `width` | 系列区域宽度。 | `数字 \| 字符串 (像素或百分比)` |
| `height` | 系列区域高度。 | `数字 \| 字符串 (像素或百分比)` |
| `top` | 距离图表容器顶部的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `right` | 距离图表容器右侧的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `bottom` | 距离图表容器底部的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `left` | 距离图表容器左侧的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `data` | Boxplot 记录。Each 记录 provIDes 分类 plus 五数概括 数值。 | `数组<对象 \| 未知[]>` |
| `data.category` | 分类名称或 ID。 | `字符串 \| 数字` |
| `data.name` | 显示名称。 | `字符串 \| 数字` |
| `data.min` | 最小值。 | `数字` |
| `data.q1` | 第一四分位值。 | `数字` |
| `data.median` | 中位数。 | `数字` |
| `data.q3` | 第三四分位值。 | `数字` |
| `data.max` | 最大值。 | `数字` |
| `dimensions` | 当数据行为数组时，用于命名 tuple 列。 | `字符串[]` |
| `center` | 中心点 点 of the 径向 boxplot。 | `[数字 \| 字符串, 数字 \| 字符串]` |
| `radius` | 内外半径对。 | `[数字 \| 字符串, 数字 \| 字符串]` |
| `innerRadius` | 内 半径 of the plot。 | `数字 \| 字符串 (像素或百分比)` |
| `outerRadius` | 外 半径 of the plot。 | `数字 \| 字符串 (像素或百分比)` |
| `padding` | 极坐标图周围的内边距。 | `数字` |
| `startAngle` | 角度 where 分类 开始。 | `数字 (degrees)` |
| `endAngle` | 角度 where 分类 结束。 | `数字 (degrees)` |
| `angleSpan` | Total 角度 span when 结束角度 is not supplied。 | `数字 (degrees)` |
| `clockwise` | 放置分类 顺时针。 | `布尔值` |
| `categoryField` | 用于分类 名称s的字段。 | `字符串 \| 数字` |
| `nameField` | 用于项 名称s的字段。 | `字符串 \| 数字` |
| `minField` | 用于lower whisker 数值的字段。 | `字符串 \| 数字` |
| `q1Field` | 用于第一四分位 数值的字段。 | `字符串 \| 数字` |
| `medianField` | 用于median 数值的字段。 | `字符串 \| 数字` |
| `q3Field` | 用于第三四分位 数值的字段。 | `字符串 \| 数字` |
| `maxField` | 用于upper whisker 数值的字段。 | `字符串 \| 数字` |
| `categories` | 显式分类顺序。 | `数组<字符串 \| 数字>` |
| `min` | 手动 径向 数值 最小值。 | `数字` |
| `max` | 手动 径向 数值 最大值。 | `数字` |
| `tickCount` | 径向轴首选刻度数量。 | `数字` |
| `nice` | Rounds 径向 extent to nicer tick 数值。 | `布尔值` |
| `boxWidth` | 角度 宽度 of each box。 | `数字` |
| `capWidth` | 角度 宽度 of whisker caps。 | `数字` |
| `labelRadius` | 用于分类标签的半径。 | `数字 \| 字符串 (像素或百分比)` |
| `grid` | 显示或隐藏polar 网格。 | `对象` |
| `grid.show` | 为 true 时显示网格。 | `布尔值` |
| `radialAxis` | 控制径向数值轴标签和分隔线。 | `对象` |
| `radialAxis.show` | 为 true 时显示坐标轴。 | `布尔值` |
| `radialAxis.label` | 设置坐标轴标签样式。 | `对象` |
| `radialAxis.label.show` | 为 true 时显示标签。 | `布尔值` |
| `radialAxis.label.color` | 标签文字颜色。 | `字符串` |
| `radialAxis.label.fontSize` | 标签文字大小。 | `数字` |
| `radialAxis.label.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `radialAxis.label.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `radialAxis.splitLine` | 控制分隔线。 | `对象` |
| `radialAxis.label.rotate` | 坐标轴标签旋转。 | `数字 \| 布尔值 \| 'tangential'` |
| `radialAxis.splitLine.show` | 为 true 时显示分隔线。 | `布尔值` |
| `radialAxis.splitLine.lineStyle` | 设置分隔线样式。 | `对象` |
| `radialAxis.splitLine.lineStyle.show` | 为 true 时显示线 group。 | `布尔值` |
| `radialAxis.splitLine.lineStyle.color` | 线条颜色。 | `字符串` |
| `radialAxis.splitLine.lineStyle.stroke` | 线条颜色的别名。 | `字符串` |
| `radialAxis.splitLine.lineStyle.width` | 线宽。 | `数字` |
| `radialAxis.splitLine.lineStyle.lineWidth` | 线宽的别名。 | `数字` |
| `radialAxis.splitLine.lineStyle.opacity` | 线条透明度。 | `数字` |
| `radialAxis.splitLine.lineStyle.type` | 线条虚线样式。 | `'solid' \| 'dashed' \| 'dotted' \| 数字[] \| 字符串` |
| `radialAxis.splitLine.lineStyle.dashOffset` | 虚线偏移量。 | `数字` |
| `radialAxis.splitLine.lineStyle.lineDashOffset` | 虚线偏移量的别名。 | `数字` |
| `radialAxis.splitLine.lineStyle.cornerRadius` | 折线路径圆角半径。 | `数字` |
| `radialAxis.splitLine.lineStyle.cap` | 线帽样式。 | `'round' \| 'butt' \| 'square'` |
| `radialAxis.splitLine.lineStyle.join` | 线连接样式。 | `'round' \| 'bevel' \| 'miter'` |
| `radialAxis.splitLine.lineStyle.dashArray` | 虚线模式。 | `数字[] \| 字符串` |
| `radialAxis.splitLine.lineStyle.lineDash` | 虚线模式别名。 | `数字[]` |
| `angleAxis` | 控制分类轴标签和分隔线。 | `对象` |
| `angleAxis.show` | 为 true 时显示坐标轴。 | `布尔值` |
| `angleAxis.label` | 设置坐标轴标签样式。 | `对象` |
| `angleAxis.label.show` | 为 true 时显示标签。 | `布尔值` |
| `angleAxis.label.color` | 标签文字颜色。 | `字符串` |
| `angleAxis.label.fontSize` | 标签文字大小。 | `数字` |
| `angleAxis.label.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `angleAxis.label.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `angleAxis.splitLine` | 控制分隔线。 | `对象` |
| `angleAxis.label.rotate` | 坐标轴标签旋转。 | `数字 \| 布尔值 \| 'tangential'` |
| `angleAxis.splitLine.show` | 为 true 时显示分隔线。 | `布尔值` |
| `angleAxis.splitLine.lineStyle` | 设置分隔线样式。 | `对象` |
| `angleAxis.splitLine.lineStyle.show` | 为 true 时显示线 group。 | `布尔值` |
| `angleAxis.splitLine.lineStyle.color` | 线条颜色。 | `字符串` |
| `angleAxis.splitLine.lineStyle.stroke` | 线条颜色的别名。 | `字符串` |
| `angleAxis.splitLine.lineStyle.width` | 线宽。 | `数字` |
| `angleAxis.splitLine.lineStyle.lineWidth` | 线宽的别名。 | `数字` |
| `angleAxis.splitLine.lineStyle.opacity` | 线条透明度。 | `数字` |
| `angleAxis.splitLine.lineStyle.type` | 线条虚线样式。 | `'solid' \| 'dashed' \| 'dotted' \| 数字[] \| 字符串` |
| `angleAxis.splitLine.lineStyle.dashOffset` | 虚线偏移量。 | `数字` |
| `angleAxis.splitLine.lineStyle.lineDashOffset` | 虚线偏移量的别名。 | `数字` |
| `angleAxis.splitLine.lineStyle.cornerRadius` | 折线路径圆角半径。 | `数字` |
| `angleAxis.splitLine.lineStyle.cap` | 线帽样式。 | `'round' \| 'butt' \| 'square'` |
| `angleAxis.splitLine.lineStyle.join` | 线连接样式。 | `'round' \| 'bevel' \| 'miter'` |
| `angleAxis.splitLine.lineStyle.dashArray` | 虚线模式。 | `数字[] \| 字符串` |
| `angleAxis.splitLine.lineStyle.lineDash` | 虚线模式别名。 | `数字[]` |
| `itemStyle` | 设置箱体主体样式。 | `对象` |
| `itemStyle.color` | 主颜色。 | `字符串` |
| `itemStyle.opacity` | 透明度。 | `数字` |
| `itemStyle.borderColor` | 边框颜色。 | `字符串` |
| `itemStyle.borderWidth` | 边框宽度。 | `数字` |
| `itemStyle.shadowBlur` | 阴影模糊半径。 | `数字` |
| `itemStyle.shadowColor` | 阴影颜色。 | `字符串` |
| `whiskerLineStyle` | 设置须线样式。 | `对象` |
| `whiskerLineStyle.color` | 主颜色。 | `字符串` |
| `whiskerLineStyle.stroke` | 描边颜色。 | `字符串` |
| `whiskerLineStyle.width` | 宽度值。 | `数字` |
| `whiskerLineStyle.lineWidth` | 线宽。 | `数字` |
| `whiskerLineStyle.opacity` | 透明度。 | `数字` |
| `whiskerLineStyle.type` | 线条或图元类型。 | `'solid' \| 'dashed' \| 'dotted' \| 数字[]` |
| `medianLineStyle` | 设置中位线样式。 | `对象` |
| `medianLineStyle.color` | 主颜色。 | `字符串` |
| `medianLineStyle.stroke` | 描边颜色。 | `字符串` |
| `medianLineStyle.width` | 宽度值。 | `数字` |
| `medianLineStyle.lineWidth` | 线宽。 | `数字` |
| `medianLineStyle.opacity` | 透明度。 | `数字` |
| `medianLineStyle.type` | 线条或图元类型。 | `'solid' \| 'dashed' \| 'dotted' \| 数字[]` |
| `capLineStyle` | 设置须端帽样式。 | `对象` |
| `capLineStyle.color` | 主颜色。 | `字符串` |
| `capLineStyle.stroke` | 描边颜色。 | `字符串` |
| `capLineStyle.width` | 宽度值。 | `数字` |
| `capLineStyle.lineWidth` | 线宽。 | `数字` |
| `capLineStyle.opacity` | 透明度。 | `数字` |
| `capLineStyle.type` | 线条或图元类型。 | `'solid' \| 'dashed' \| 'dotted' \| 数字[]` |
| `emphasis` | 设置悬停时的箱体样式。 | `对象` |
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
