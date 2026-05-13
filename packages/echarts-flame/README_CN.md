# @echarts-extension/flame

语言：[English](./README.md) | 中文

ECharts 层级火焰图扩展。导入本包即可注册 `series.type = 'flame'`。

![Flame 图表截图](../../visual-baseline/echarts-flame.png)

## 安装

```bash
npm install echarts @echarts-extension/flame
```

## 基础用法

```js
import * as echarts from 'echarts';
import '@echarts-extension/flame';

const chart = echarts.init(document.getElementById('main'));

chart.setOption({
  series: [
    {
      type: 'flame',
      data: {
        name: 'root',
        children: [
          { name: 'render', value: 30, children: [{ name: 'diff', value: 18 }, { name: 'patch', value: 12 }] },
          { name: 'commit', value: 20 }
        ]
      },
      orient: 'up',
      rootVisible: false,
      gap: 1,
      label: { show: true, formatter: '{b}' }
    }
  ]
});
```

## 数据

使用一个根对象或根对象数组：

- 节点使用 `name`，并可选使用 `value` 和 `children`。
- 父节点省略 `value` 时，会根据子节点推断。
- 如果父节点数值大于子节点总和，额外数值会绘制为自身耗时。
- 设置 `rootVisible: false` 可隐藏根框。

## 常用选项

- `orient`：`up` 将子节点绘制在父节点上方，`down` 将子节点绘制在下方。
- `padding` and `gap`：框架间距。
- `rootName`, `rootVisible`：根节点行为。
- `sort`：`value`, `name`, `none`, `true`, or `false`.
- `colors`, `itemStyle`, `label`, `emphasis`：展示样式。

## 配置项

<!-- OPTIONS:START -->
此表由 `scripts/sync-options-from-readmes.mjs --write-readmes` 生成。更新英文 README 的配置表后，运行 `npm run docs:sync-options` 可刷新文档页。

| 配置项 | 说明 | 可选值 |
| --- | --- | --- |
| `type` | 向 ECharts 注册该包的系列类型。 | `'flame'` |
| `silent` | 为 true 时禁用mouse events for the 系列。 | `布尔值` |
| `width` | 系列区域宽度。 | `数字 \| 字符串 (像素或百分比)` |
| `height` | 系列区域高度。 | `数字 \| 字符串 (像素或百分比)` |
| `top` | 距离图表容器顶部的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `right` | 距离图表容器右侧的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `bottom` | 距离图表容器底部的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `left` | 距离图表容器左侧的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `data` | 层级 flame 图 记录。 | `对象 \| 数组<对象>` |
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
| `rootName` | Display 名称 for an implicit 根 节点。 | `字符串` |
| `rootVisible` | 为 true 时显示根 band。 | `布尔值` |
| `orient` | Direction the flame 图 g行。 | `'up' \| 'down'` |
| `padding` | 内边距 around the flame 图。 | `数字` |
| `gap` | 间距 between flame 图 矩形s。 | `数字` |
| `sort` | 对子项 before 布局排序。 | `布尔值 \| 'none' \| 'value' \| 'name'` |
| `colors` | depth or groups使用的调色板。 | `字符串[]` |
| `itemStyle` | 设置火焰图矩形样式。 | `对象` |
| `itemStyle.color` | 主颜色。 | `字符串` |
| `itemStyle.opacity` | 透明度。 | `数字` |
| `itemStyle.borderColor` | 边框颜色。 | `字符串` |
| `itemStyle.borderWidth` | 边框宽度。 | `数字` |
| `itemStyle.shadowBlur` | 阴影模糊半径。 | `数字` |
| `itemStyle.shadowColor` | 阴影颜色。 | `字符串` |
| `label` | 设置矩形标签样式。 | `对象` |
| `label.show` | 为 true 时显示标签。 | `布尔值` |
| `label.color` | 标签文字颜色。 | `字符串` |
| `label.fontSize` | 标签文字大小。 | `数字` |
| `label.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `label.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `emphasis` | 设置矩形s while 悬停时样式。 | `对象` |
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
