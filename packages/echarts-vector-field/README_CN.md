# @echarts-extension/vector-field

语言：[English](./README.md) | 中文

ECharts 向量场和风场图扩展。导入本包即可注册 `series.type = 'vectorField'`。

![Vector Field 图表截图](../../visual-baseline/echarts-vector-field.png)

## 安装

```bash
npm install echarts @echarts-extension/vector-field
```

## 基础用法

```js
import * as echarts from 'echarts';
import '@echarts-extension/vector-field';

const chart = echarts.init(document.getElementById('main'));

chart.setOption({
  series: [
    {
      type: 'vectorField',
      data: [
        { longitude: 0.125, latitude: 45.125, u: -2.32, v: -2.07 },
        { longitude: 0.375, latitude: 45.125, u: -2.41, v: -2.15 },
        { longitude: 0.125, latitude: 45.375, u: -2.15, v: -1.88 }
      ],
      xField: 'longitude',
      yField: 'latitude',
      uField: 'u',
      vField: 'v',
      samplingStep: 1,
      maxLength: 18,
      lineStyle: {
        color: '#1d4ed8',
        width: 1.15,
        opacity: 0.88
      }
    }
  ]
});
```

## 数据

可以使用对象或元组：

- 对象行读取 `xField`、`yField`、`uField` 和 `vField`。
- 默认字段为 `longitude`、`latitude`、`u` 和 `v`。
- 元组行为 `[x, y, u, v]`。
- 缺少数值坐标或向量的无效行会被跳过。

## 常用选项

- `xExtent`, `yExtent`：显式坐标边界。
- `invertY`：默认为 `true`，用于北向上的坐标渲染。
- `samplingStep`：密集网格中每隔 n 个向量渲染一次。
- `minLength`, `maxLength`, `lengthScale`：箭头长度设置。
- `arrowHeadLength`, `arrowHeadAngle`：箭头头部几何设置。
- `lineStyle`, `emphasis`, `enterAnimation`：展示样式。

## 配置项

<!-- OPTIONS:START -->
此表由 `scripts/sync-options-from-readmes.mjs --write-readmes` 生成。更新英文 README 的配置表后，运行 `npm run docs:sync-options` 可刷新文档页。

| 配置项 | 说明 | 可选值 |
| --- | --- | --- |
| `type` | 向 ECharts 注册该包的系列类型。 | `'vectorField'` |
| `silent` | 为 true 时禁用mouse events for the 系列。 | `布尔值` |
| `width` | 系列区域宽度。 | `数字 \| 字符串 (像素或百分比)` |
| `height` | 系列区域高度。 | `数字 \| 字符串 (像素或百分比)` |
| `top` | 距离图表容器顶部的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `right` | 距离图表容器右侧的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `bottom` | 距离图表容器底部的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `left` | 距离图表容器左侧的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `data` | Vector 行。对象使用 x/y/u/v fields；元组使用 [x, y, u, v]。 | `数组<对象 \| [数字, 数字, 数字, 数字]>` |
| `data.x` | X 坐标或分类。 | `数字` |
| `data.y` | Y 坐标或分类。 | `数字` |
| `data.u` | 水平向量分量。 | `数字` |
| `data.v` | 垂直向量分量。 | `数字` |
| `padding` | 内边距 around the vector字段。 | `数字` |
| `xExtent` | 显式 x-坐标 定义域。 | `[数字, 数字]` |
| `yExtent` | 显式 y-坐标 定义域。 | `[数字, 数字]` |
| `xField` | 用于x 坐标的字段。 | `字符串` |
| `yField` | 用于y 坐标的字段。 | `字符串` |
| `uField` | 用于水平 vector 分量的字段。 | `字符串` |
| `vField` | 用于垂直 vector 分量的字段。 | `字符串` |
| `invertY` | 翻转y 数值 for north-up 坐标 渲染。 | `布尔值` |
| `samplingStep` | 渲染every nth vector for dense data。 | `数字` |
| `minLength` | 最小值 ar行 length after scaling。 | `数字` |
| `maxLength` | 最大值 ar行 length after scaling。 | `数字 \| null` |
| `lengthScale` | Multiplier from vector magnitude to ar行 length。 | `数字 \| null` |
| `arrowHeadLength` | Length of ar行 heads。 | `数字 \| null` |
| `arrowHeadAngle` | 角度 of ar行 heads。 | `数字 \| null (radians)` |
| `layout` | Nested 布局 option 对象。 | `对象` |
| `layout.xExtent` | 显式 x-坐标 定义域。 | `[数字, 数字]` |
| `layout.yExtent` | 显式 y-坐标 定义域。 | `[数字, 数字]` |
| `layout.xField` | 用于x 坐标的字段。 | `字符串` |
| `layout.yField` | 用于y 坐标的字段。 | `字符串` |
| `layout.uField` | 用于水平 vector 分量的字段。 | `字符串` |
| `layout.vField` | 用于垂直 vector 分量的字段。 | `字符串` |
| `layout.invertY` | 翻转y 数值 for north-up 坐标 渲染。 | `布尔值` |
| `layout.samplingStep` | 渲染every nth vector for dense data。 | `数字` |
| `layout.minLength` | 最小值 ar行 length after scaling。 | `数字` |
| `layout.maxLength` | 最大值 ar行 length after scaling。 | `数字 \| null` |
| `layout.lengthScale` | Multiplier from vector magnitude to ar行 length。 | `数字 \| null` |
| `layout.arrowHeadLength` | Length of ar行 heads。 | `数字 \| null` |
| `layout.arrowHeadAngle` | 角度 of ar行 heads。 | `数字 \| null (radians)` |
| `layoutOptions` | nested 布局 options的别名。 | `字段同 layout` |
| `layoutOptions.xExtent` | 显式 x-坐标 定义域。 | `[数字, 数字]` |
| `layoutOptions.yExtent` | 显式 y-坐标 定义域。 | `[数字, 数字]` |
| `layoutOptions.xField` | 用于x 坐标的字段。 | `字符串` |
| `layoutOptions.yField` | 用于y 坐标的字段。 | `字符串` |
| `layoutOptions.uField` | 用于水平 vector 分量的字段。 | `字符串` |
| `layoutOptions.vField` | 用于垂直 vector 分量的字段。 | `字符串` |
| `layoutOptions.invertY` | 翻转y 数值 for north-up 坐标 渲染。 | `布尔值` |
| `layoutOptions.samplingStep` | 渲染every nth vector for dense data。 | `数字` |
| `layoutOptions.minLength` | 最小值 ar行 length after scaling。 | `数字` |
| `layoutOptions.maxLength` | 最大值 ar行 length after scaling。 | `数字 \| null` |
| `layoutOptions.lengthScale` | Multiplier from vector magnitude to ar行 length。 | `数字 \| null` |
| `layoutOptions.arrowHeadLength` | Length of ar行 heads。 | `数字 \| null` |
| `layoutOptions.arrowHeadAngle` | 角度 of ar行 heads。 | `数字 \| null (radians)` |
| `enterAnimation` | 为ar行 into place添加动画。 | `布尔值 \| 对象` |
| `enterAnimation.show` | 为 true 时显示动画。 | `布尔值` |
| `enterAnimation.enabled` | 为 true 时启用动画。 | `布尔值` |
| `enterAnimation.duration` | 动画时长。 | `数字 \| 函数` |
| `enterAnimation.delay` | 动画开始前的延迟。 | `数字 \| 函数` |
| `enterAnimation.stagger` | 图元之间增加的延迟。 | `数字 \| 函数` |
| `enterAnimation.easing` | 动画缓动名称。 | `字符串` |
| `lineStyle` | 设置箭头样式。 | `对象` |
| `lineStyle.color` | 主颜色。 | `字符串` |
| `lineStyle.stroke` | 描边颜色。 | `字符串` |
| `lineStyle.width` | 宽度值。 | `数字` |
| `lineStyle.lineWidth` | 线宽。 | `数字` |
| `lineStyle.opacity` | 透明度。 | `数字` |
| `lineStyle.type` | 线条或图元类型。 | `'solid' \| 'dashed' \| 'dotted' \| 数字[]` |
| `emphasis` | 设置ar行 while 悬停时样式。 | `对象` |
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
| `tooltip` | 控制E图表s 提示框 behavior。 | `对象` |
| `tooltip.trigger` | ECharts tooltip 触发方式。 | `字符串` |
<!-- OPTIONS:END -->
