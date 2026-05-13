# @echarts-extension/circle-packing

语言：[English](./README.md) | 中文

ECharts 层级圆堆积图扩展。导入本包即可注册 `series.type = 'circlePacking'`。

![Circle Packing 图表截图](../../visual-baseline/echarts-circle-packing.png)

## 安装

```bash
npm install echarts @echarts-extension/circle-packing
```

## 基础用法

```js
import * as echarts from 'echarts';
import '@echarts-extension/circle-packing';

const chart = echarts.init(document.getElementById('main'));

chart.setOption({
  series: [
    {
      type: 'circlePacking',
      data: {
        name: 'Portfolio',
        children: [
          { name: 'Core', children: [{ name: 'Search', value: 54 }, { name: 'Editor', value: 38 }] },
          { name: 'Growth', children: [{ name: 'Campaigns', value: 32 }, { name: 'Referrals', value: 22 }] }
        ]
      },
      siblingGap: 2,
      nodePadding: 4,
      label: { show: true }
    }
  ]
});
```

## 数据

使用一个根对象或根对象数组：

- 子节点可以存放在 `children` 中，也可以通过 `childrenField` 配置。
- 数值默认读取 `value`；嵌套字段可使用 `valueField`，例如 `metrics.size`。
- 名称默认读取 `name`；自定义数据可使用 `nameField`。
- 传入数组时，设置 `rootVisible: false` 可隐藏合成根节点。

## 常用选项

- `padding`, `nodePadding`, `siblingGap`：间距设置。
- `center`, `radius`：圆堆积视口设置。
- `rootName`, `rootVisible`：根节点行为。
- `sort`：`value`, `name`, `asc`, `desc`, `none`, `true`, or `false`.
- `colors`, `itemStyle`, `label`, `emphasis`, `enterAnimation`：展示样式。

## 配置项

<!-- OPTIONS:START -->
此表由 `scripts/sync-options-from-readmes.mjs --write-readmes` 生成。更新英文 README 的配置表后，运行 `npm run docs:sync-options` 可刷新文档页。

| 配置项 | 说明 | 可选值 |
| --- | --- | --- |
| `type` | 向 ECharts 注册该包的系列类型。 | `'circlePacking'` |
| `silent` | 为 true 时禁用mouse events for the 系列。 | `布尔值` |
| `width` | 系列区域宽度。 | `数字 \| 字符串 (像素或百分比)` |
| `height` | 系列区域高度。 | `数字 \| 字符串 (像素或百分比)` |
| `top` | 距离图表容器顶部的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `right` | 距离图表容器右侧的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `bottom` | 距离图表容器底部的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `left` | 距离图表容器左侧的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `data` | 层级 记录 to pack into nested circles。 | `对象 \| 数组<对象>` |
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
| `rootVisible` | 为 true 时显示根 circle。 | `布尔值` |
| `padding` | 内边距 around the circle packing 布局。 | `数字 \| 对象` |
| `padding.top` | 顶部内边距。 | `数字` |
| `padding.right` | 右侧内边距。 | `数字` |
| `padding.bottom` | 底部内边距。 | `数字` |
| `padding.left` | 左侧内边距。 | `数字` |
| `nodePadding` | 内边距 insIDe parent circles。 | `数字` |
| `siblingGap` | Space between sibling circles。 | `数字` |
| `center` | 中心点 点 of the packed 层级。 | `[数字 \| 字符串, 数字 \| 字符串]` |
| `radius` | 外 半径 of the packed 层级。 | `数字 \| 字符串 (像素或百分比)` |
| `valueField` | 用于圆大小的字段。 | `字符串` |
| `nameField` | 用于标签 and 名称s的字段。 | `字符串` |
| `childrenField` | 字段 containing 子项 节点。 | `字符串` |
| `sort` | 对层级 节点 before 布局排序。 | `布尔值 \| 'none' \| 'value' \| 'name' \| 'asc' \| 'desc'` |
| `colors` | depth or groups使用的调色板。 | `字符串[]` |
| `layout` | Nested 层级 布局 options。 | `对象` |
| `layout.rootName` | Display 名称 for an implicit 根 节点。 | `字符串` |
| `layout.rootVisible` | 为 true 时显示根 circle。 | `布尔值` |
| `layout.padding` | 内边距 around the 层级。 | `数字 \| 对象` |
| `layout.padding.top` | 顶部内边距。 | `数字` |
| `layout.padding.right` | 右侧内边距。 | `数字` |
| `layout.padding.bottom` | 底部内边距。 | `数字` |
| `layout.padding.left` | 左侧内边距。 | `数字` |
| `layout.nodePadding` | 内边距 insIDe parent circles。 | `数字` |
| `layout.siblingGap` | Space between sibling circles。 | `数字` |
| `layout.center` | 中心点 点 of the packed 层级。 | `[数字 \| 字符串, 数字 \| 字符串]` |
| `layout.radius` | 外 半径 of the packed 层级。 | `数字 \| 字符串 (像素或百分比)` |
| `layout.valueField` | 用于圆大小的字段。 | `字符串` |
| `layout.nameField` | 用于标签 and 名称s的字段。 | `字符串` |
| `layout.childrenField` | 字段 containing 子项 节点。 | `字符串` |
| `layout.sort` | 对层级 节点 before 布局排序。 | `布尔值 \| 'none' \| 'value' \| 'name' \| 'asc' \| 'desc'` |
| `layoutOptions` | nested 层级 布局 options的别名。 | `字段同 layout` |
| `layoutOptions.rootName` | Display 名称 for an implicit 根 节点。 | `字符串` |
| `layoutOptions.rootVisible` | 为 true 时显示根 circle。 | `布尔值` |
| `layoutOptions.padding` | 内边距 around the 层级。 | `数字 \| 对象` |
| `layoutOptions.padding.top` | 顶部内边距。 | `数字` |
| `layoutOptions.padding.right` | 右侧内边距。 | `数字` |
| `layoutOptions.padding.bottom` | 底部内边距。 | `数字` |
| `layoutOptions.padding.left` | 左侧内边距。 | `数字` |
| `layoutOptions.nodePadding` | 内边距 insIDe parent circles。 | `数字` |
| `layoutOptions.siblingGap` | Space between sibling circles。 | `数字` |
| `layoutOptions.center` | 中心点 点 of the packed 层级。 | `[数字 \| 字符串, 数字 \| 字符串]` |
| `layoutOptions.radius` | 外 半径 of the packed 层级。 | `数字 \| 字符串 (像素或百分比)` |
| `layoutOptions.valueField` | 用于圆大小的字段。 | `字符串` |
| `layoutOptions.nameField` | 用于标签 and 名称s的字段。 | `字符串` |
| `layoutOptions.childrenField` | 字段 containing 子项 节点。 | `字符串` |
| `layoutOptions.sort` | 对层级 节点 before 布局排序。 | `布尔值 \| 'none' \| 'value' \| 'name' \| 'asc' \| 'desc'` |
| `enterAnimation` | 为circles into place添加动画。 | `布尔值 \| 对象` |
| `enterAnimation.show` | 为 true 时显示动画。 | `布尔值` |
| `enterAnimation.enabled` | 为 true 时启用动画。 | `布尔值` |
| `enterAnimation.duration` | 动画时长。 | `数字 \| 函数` |
| `enterAnimation.delay` | 动画开始前的延迟。 | `数字 \| 函数` |
| `enterAnimation.stagger` | 图元之间增加的延迟。 | `数字 \| 函数` |
| `enterAnimation.easing` | 动画缓动名称。 | `字符串` |
| `itemStyle` | 设置circles样式。 | `对象` |
| `itemStyle.color` | 主颜色。 | `字符串` |
| `itemStyle.opacity` | 透明度。 | `数字` |
| `itemStyle.borderColor` | 边框颜色。 | `字符串` |
| `itemStyle.borderWidth` | 边框宽度。 | `数字` |
| `itemStyle.shadowBlur` | 阴影模糊半径。 | `数字` |
| `itemStyle.shadowColor` | 阴影颜色。 | `字符串` |
| `label` | 设置圆标签样式。 | `对象` |
| `label.show` | 为 true 时显示标签。 | `布尔值` |
| `label.color` | 标签文字颜色。 | `字符串` |
| `label.fontSize` | 标签文字大小。 | `数字` |
| `label.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `label.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `label.lineHeight` | 标签 线 高度。 | `数字` |
| `label.minRadius` | 最小值 半径，用于判断何时标签 is shown。 | `数字` |
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
