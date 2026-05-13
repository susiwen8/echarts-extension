# @echarts-extension/venn

语言：[English](./README.md) | 中文

ECharts 空心和气泡维恩图扩展。导入本包即可注册 `series.type = 'venn'`。

| 空心维恩图 | 气泡维恩图 |
| --- | --- |
| ![空心维恩图截图](../../visual-baseline/echarts-venn-hollow.png) | ![气泡维恩图截图](../../visual-baseline/echarts-venn-bubble.png) |

## 安装

```bash
npm install echarts @echarts-extension/venn
```

## 空心维恩图

```js
import * as echarts from 'echarts';
import '@echarts-extension/venn';

const chart = echarts.init(document.getElementById('main'));

chart.setOption({
  series: [
    {
      type: 'venn',
      layout: 'hollow',
      data: [
        { name: 'A', sets: ['A'], value: 100 },
        { name: 'B', sets: ['B'], value: 96 },
        { name: 'C', sets: ['C'], value: 82 },
        { name: 'A&B', sets: ['A', 'B'], value: 34 },
        { name: 'A&C', sets: ['A', 'C'], value: 24 },
        { name: 'B&C', sets: ['B', 'C'], value: 20 },
        { name: 'A&B&C', sets: ['A', 'B', 'C'], value: 12 }
      ],
      hollowStyle: { borderWidth: 6 },
      label: { show: true }
    }
  ]
});
```

## 气泡维恩图

```js
chart.setOption({
  series: [
    {
      type: 'venn',
      layout: 'bubble',
      data: [
        { name: 'Radiohead', value: 100 },
        { name: 'Kanye West', value: 64 },
        { name: 'The Beatles', value: 58 },
        { name: 'Pink Floyd', value: 44 }
      ],
      itemStyle: { opacity: 0.6 },
      label: { show: true }
    }
  ]
});
```

## 数据

- 空心模式使用带 `sets` 的集合行，例如 `['A']`、`['A', 'B']` 或 `['A', 'B', 'C']`。
- 气泡模式使用带 `name` 和 `value` 的扁平行。
- `value` 控制集合或气泡的相对大小。

## 常用选项

- `layout`, `vennType`, or `mode`: `hollow` or `bubble`.
- `padding`, `minRadius`, `maxRadius`：布局边界。
- `layoutOptions`：nested 布局设置。
- `itemStyle`, `hollowStyle`, `label`, `emphasis`：展示样式。

## 配置项

<!-- OPTIONS:START -->
此表由 `scripts/sync-options-from-readmes.mjs --write-readmes` 生成。更新英文 README 的配置表后，运行 `npm run docs:sync-options` 可刷新文档页。

| 配置项 | 说明 | 可选值 |
| --- | --- | --- |
| `type` | 向 ECharts 注册该包的系列类型。 | `'venn'` |
| `silent` | 为 true 时禁用mouse events for the 系列。 | `布尔值` |
| `width` | 系列区域宽度。 | `数字 \| 字符串 (像素或百分比)` |
| `height` | 系列区域高度。 | `数字 \| 字符串 (像素或百分比)` |
| `top` | 距离图表容器顶部的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `right` | 距离图表容器右侧的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `bottom` | 距离图表容器底部的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `left` | 距离图表容器左侧的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `data` | 韦恩集合和交集。每个项使用 name, value, 以及可选的 sets。 | `数组<对象>` |
| `data.name` | 显示名称。 | `字符串 \| 数字` |
| `data.value` | 数值。 | `数字` |
| `data.sets` | 该项使用的可选集合名称。 | `字符串[]` |
| `layout` | 选择韦恩图 布局 mode, or passes a 布局 对象 with 类型。 | `'hollow' \| 'bubble' \| { type: 'hollow' \| 'bubble' }` |
| `layoutOptions` | Nested 布局 sizing options。 | `对象` |
| `layoutOptions.padding` | 内边距 around the 韦恩图 布局。 | `数字` |
| `layoutOptions.minRadius` | Smallest circle 半径。 | `数字` |
| `layoutOptions.maxRadius` | Largest circle 半径。 | `数字` |
| `vennType` | selecting the 韦恩图 布局 mode的别名。 | `'hollow' \| 'bubble'` |
| `mode` | selecting the 韦恩图 布局 mode的别名。 | `'hollow' \| 'bubble'` |
| `padding` | 内边距 around the 韦恩图 布局。 | `数字` |
| `minRadius` | Smallest circle 半径。 | `数字` |
| `maxRadius` | Largest circle 半径。 | `数字` |
| `itemStyle` | 设置韦恩图圆样式。 | `对象` |
| `itemStyle.color` | 主颜色。 | `字符串` |
| `itemStyle.opacity` | 透明度。 | `数字` |
| `itemStyle.borderColor` | 边框颜色。 | `字符串` |
| `itemStyle.borderWidth` | 边框宽度。 | `数字` |
| `itemStyle.shadowBlur` | 阴影模糊半径。 | `数字` |
| `itemStyle.shadowColor` | 阴影颜色。 | `字符串` |
| `hollowStyle` | 设置hollow overlay in hollow mode样式。 | `对象` |
| `hollowStyle.color` | 主颜色。 | `字符串` |
| `hollowStyle.opacity` | 透明度。 | `数字` |
| `hollowStyle.borderWidth` | 边框宽度。 | `数字` |
| `label` | 设置集合 and 交集 标签样式。 | `对象` |
| `label.show` | 为 true 时显示标签。 | `布尔值` |
| `label.color` | 标签文字颜色。 | `字符串` |
| `label.fontSize` | 标签文字大小。 | `数字` |
| `label.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `label.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `emphasis` | 设置circles while 悬停时样式。 | `对象` |
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
