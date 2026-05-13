# @echarts-extension/nested-circle

语言：[English](./README.md) | 中文

ECharts 底部对齐嵌套圆图扩展。导入本包即可注册 `series.type = 'nestedCircle'`。

![Nested Circle 图表截图](../../visual-baseline/echarts-nested-circle.png)

## 安装

```bash
npm install echarts @echarts-extension/nested-circle
```

## 基础用法

```js
import * as echarts from 'echarts';
import '@echarts-extension/nested-circle';

const chart = echarts.init(document.getElementById('main'));

chart.setOption({
  series: [
    {
      type: 'nestedCircle',
      data: [
        { name: 'Mathematics', children: ['Probability', 'Linear Algebra', 'Calculus'] },
        { name: 'Python', children: ['Pandas', 'NumPy', 'Scikit-Learn'] },
        { name: 'SQL', children: ['Joins', 'Window Functions', 'Optimization'] }
      ],
      centerRadiusRatio: 0.3,
      label: { show: true },
      titleLabel: { show: true }
    }
  ]
});
```

## 数据

使用有序的圆层数组：

- 每一项都会成为一个可见圆环或圆。
- `name` 是层标题。
- `children` 或 `items` 是绘制在该层内部的标签。
- 子项可以是字符串、数字，或带 `name`、`value` 和可选 `label` 的对象。

## 常用选项

- `center`, `radius`, `padding`：视口设置。
- `centerRadiusRatio`, `labelRadiusRatio`, `titleRadiusRatio`：文本和圆环位置。
- `minRingThickness`：在层数较多时保护可读性。
- `colors`, `ringStyle`, `itemStyle`, `titleLabel`, `label`：展示样式。

## 配置项

<!-- OPTIONS:START -->
此表由 `scripts/sync-options-from-readmes.mjs --write-readmes` 生成。更新英文 README 的配置表后，运行 `npm run docs:sync-options` 可刷新文档页。

| 配置项 | 说明 | 可选值 |
| --- | --- | --- |
| `type` | 向 ECharts 注册该包的系列类型。 | `'nestedCircle'` |
| `silent` | 为 true 时禁用mouse events for the 系列。 | `布尔值` |
| `width` | 系列区域宽度。 | `数字 \| 字符串 (像素或百分比)` |
| `height` | 系列区域高度。 | `数字 \| 字符串 (像素或百分比)` |
| `top` | 距离图表容器顶部的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `right` | 距离图表容器右侧的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `bottom` | 距离图表容器底部的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `left` | 距离图表容器左侧的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `data` | 嵌套圆分组和子项标签。 | `数组<对象>` |
| `data.id` | 记录 ID。 | `字符串 \| 数字` |
| `data.name` | 显示名称。 | `字符串` |
| `data.label` | 单条记录的标签样式。 | `字符串` |
| `data.value` | 数值。 | `数字 \| 字符串` |
| `data.children` | 子记录。 | `数组<对象>` |
| `data.children.id` | 记录 ID。 | `字符串 \| 数字` |
| `data.children.name` | 显示名称。 | `字符串` |
| `data.children.label` | 单条记录的标签样式。 | `字符串 \| 对象` |
| `data.children.label.show` | 为 true 时显示标签。 | `布尔值` |
| `data.children.label.color` | 标签文字颜色。 | `字符串` |
| `data.children.label.fontSize` | 标签文字大小。 | `数字` |
| `data.children.label.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `data.children.label.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `data.children.value` | 数值。 | `数字 \| 字符串` |
| `data.items` | 子项记录。 | `数组<对象>` |
| `data.items.id` | 记录 ID。 | `字符串 \| 数字` |
| `data.items.name` | 显示名称。 | `字符串` |
| `data.items.label` | 单条记录的标签样式。 | `字符串 \| 对象` |
| `data.items.label.show` | 为 true 时显示标签。 | `布尔值` |
| `data.items.label.color` | 标签文字颜色。 | `字符串` |
| `data.items.label.fontSize` | 标签文字大小。 | `数字` |
| `data.items.label.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `data.items.label.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `data.items.value` | 数值。 | `数字 \| 字符串` |
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
| `data.titleLabel` | 单条记录的标题标签样式。 | `对象` |
| `data.titleLabel.show` | 为 true 时显示标签。 | `布尔值` |
| `data.titleLabel.color` | 标签文字颜色。 | `字符串` |
| `data.titleLabel.fontSize` | 标签文字大小。 | `数字` |
| `data.titleLabel.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `data.titleLabel.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `padding` | 内边距 around the nested circles。 | `数字` |
| `center` | 中心点 点 of the 环。 | `[数字 \| 字符串, 数字 \| 字符串]` |
| `radius` | 外 半径 of the nested circle 图表。 | `数字 \| 字符串 (像素或百分比)` |
| `centerRadiusRatio` | Relative 大小 of the 中心点 circle。 | `数字` |
| `labelRadiusRatio` | 子项 标签使用的Relative 半径。 | `数字` |
| `titleRadiusRatio` | title 标签使用的Relative 半径。 | `数字` |
| `minRingThickness` | Smallest 环 thickness。 | `数字` |
| `colors` | 用于环和子项的调色板。 | `字符串[]` |
| `ringStyle` | 设置环背景样式。 | `对象` |
| `ringStyle.opacity` | 透明度。 | `数字` |
| `ringStyle.borderColor` | 边框颜色。 | `字符串` |
| `ringStyle.borderWidth` | 边框宽度。 | `数字` |
| `itemStyle` | 设置子圆项样式。 | `对象` |
| `itemStyle.opacity` | 透明度。 | `数字` |
| `itemStyle.borderColor` | 边框颜色。 | `字符串` |
| `itemStyle.borderWidth` | 边框宽度。 | `数字` |
| `titleLabel` | 设置环标题标签样式。 | `对象` |
| `titleLabel.show` | 为 true 时显示标签。 | `布尔值` |
| `titleLabel.color` | 标签文字颜色。 | `字符串` |
| `titleLabel.fontSize` | 标签文字大小。 | `数字` |
| `titleLabel.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `titleLabel.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `titleLabel.lineHeight` | 标签 线 高度。 | `数字` |
| `label` | 设置子项 标签样式。 | `对象` |
| `label.show` | 为 true 时显示标签。 | `布尔值` |
| `label.color` | 标签文字颜色。 | `字符串` |
| `label.fontSize` | 标签文字大小。 | `数字` |
| `label.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `label.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `label.lineHeight` | 标签 线 高度。 | `数字` |
<!-- OPTIONS:END -->
