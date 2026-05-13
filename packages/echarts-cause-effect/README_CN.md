# @echarts-extension/cause-effect

语言：[English](./README.md) | 中文

ECharts 因果图（鱼骨图 / 石川图）扩展。

![Cause and Effect 图表截图](../../visual-baseline/echarts-cause-effect.png)

```js
import * as echarts from 'echarts';
import '@echarts-extension/cause-effect';

chart.setOption({
  series: [
    {
      type: 'causeEffect',
      effect: 'Late delivery',
      categories: [
        {
          name: 'People',
          causes: [
            'handoff gaps',
            { name: 'unclear owner', children: ['no escalation path'] }
          ]
        },
        ['Process', 'manual approval', 'batch release'],
        ['Tools', 'slow build']
      ],
      label: { show: true }
    }
  ]
});
```

该系列接受 `effect`，并通过 `categories`、`causes` 或 `data` 定义主要鱼骨分支。每个分类可以使用 `causes`、`items` 或 `children`；嵌套原因会作为次级骨架布局。

## 配置项

<!-- OPTIONS:START -->
此表由 `scripts/sync-options-from-readmes.mjs --write-readmes` 生成。更新英文 README 的配置表后，运行 `npm run docs:sync-options` 可刷新文档页。

| 配置项 | 说明 | 可选值 |
| --- | --- | --- |
| `type` | 向 ECharts 注册该包的系列类型。 | `'causeEffect'` |
| `silent` | 为 true 时禁用mouse events for the 系列。 | `布尔值` |
| `width` | 系列区域宽度。 | `数字 \| 字符串 (像素或百分比)` |
| `height` | 系列区域高度。 | `数字 \| 字符串 (像素或百分比)` |
| `top` | 距离图表容器顶部的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `right` | 距离图表容器右侧的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `bottom` | 距离图表容器底部的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `left` | 距离图表容器左侧的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `effect` | Main effect, problem, or outcome shown at the spine 结束。 | `字符串 \| 数字 \| 对象` |
| `problem` | main effect box的别名。 | `字符串 \| 数字 \| 对象` |
| `outcome` | main effect box的别名。 | `字符串 \| 数字 \| 对象` |
| `categories` | Cause 分类 with nested causes。 | `数组<对象 \| array \| 字符串 \| 数字>` |
| `categories.name` | 显示名称。 | `字符串` |
| `categories.text` | 显示文本。 | `字符串` |
| `categories.value` | 数值。 | `数字` |
| `categories.causes` | causes字段。 | `数组<对象>` |
| `categories.causes.name` | 显示名称。 | `字符串` |
| `categories.causes.text` | 显示文本。 | `字符串` |
| `categories.causes.value` | 数值。 | `数字` |
| `categories.causes.causes` | causes字段。 | `数组<对象>` |
| `categories.causes.causes.name` | 显示名称。 | `字符串` |
| `categories.causes.causes.text` | 显示文本。 | `字符串` |
| `categories.causes.causes.value` | 数值。 | `数字` |
| `categories.causes.causes.itemStyle` | 单条记录的图元样式。 | `对象` |
| `categories.causes.causes.itemStyle.color` | 填充颜色。 | `字符串` |
| `categories.causes.causes.itemStyle.fill` | 填充颜色的别名。 | `字符串` |
| `categories.causes.causes.itemStyle.opacity` | 填充透明度。 | `数字` |
| `categories.causes.causes.itemStyle.borderColor` | 边框颜色。 | `字符串` |
| `categories.causes.causes.itemStyle.borderWidth` | 边框宽度。 | `数字` |
| `categories.causes.causes.itemStyle.borderRadius` | 圆角半径。 | `数字` |
| `categories.causes.causes.itemStyle.shadowBlur` | 阴影模糊半径。 | `数字` |
| `categories.causes.causes.itemStyle.shadowColor` | 阴影颜色。 | `字符串` |
| `categories.causes.causes.itemStyle.lineWidth` | icon or shape 样式使用的Stroke 宽度。 | `数字` |
| `categories.causes.causes.label` | 单条记录的标签样式。 | `对象` |
| `categories.causes.causes.label.show` | 为 true 时显示标签。 | `布尔值` |
| `categories.causes.causes.label.color` | 标签文字颜色。 | `字符串` |
| `categories.causes.causes.label.fontSize` | 标签文字大小。 | `数字` |
| `categories.causes.causes.label.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `categories.causes.causes.label.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `categories.causes.children` | 子记录。 | `数组<对象>` |
| `categories.causes.children.id` | 记录 ID。 | `字符串 \| 数字` |
| `categories.causes.children.parentId` | Parent 记录 ID。 | `字符串 \| 数字` |
| `categories.causes.children.name` | 显示名称。 | `字符串` |
| `categories.causes.children.value` | 数值。 | `数字` |
| `categories.causes.children.children` | 子记录。 | `数组<对象>` |
| `categories.causes.children.children.name` | 显示名称。 | `字符串` |
| `categories.causes.children.children.value` | 数值。 | `数字` |
| `categories.causes.children.children.itemStyle` | 单条记录的图元样式。 | `对象` |
| `categories.causes.children.children.itemStyle.color` | 填充颜色。 | `字符串` |
| `categories.causes.children.children.itemStyle.fill` | 填充颜色的别名。 | `字符串` |
| `categories.causes.children.children.itemStyle.opacity` | 填充透明度。 | `数字` |
| `categories.causes.children.children.itemStyle.borderColor` | 边框颜色。 | `字符串` |
| `categories.causes.children.children.itemStyle.borderWidth` | 边框宽度。 | `数字` |
| `categories.causes.children.children.itemStyle.borderRadius` | 圆角半径。 | `数字` |
| `categories.causes.children.children.itemStyle.shadowBlur` | 阴影模糊半径。 | `数字` |
| `categories.causes.children.children.itemStyle.shadowColor` | 阴影颜色。 | `字符串` |
| `categories.causes.children.children.itemStyle.lineWidth` | icon or shape 样式使用的Stroke 宽度。 | `数字` |
| `categories.causes.children.children.label` | 单条记录的标签样式。 | `对象` |
| `categories.causes.children.children.label.show` | 为 true 时显示标签。 | `布尔值` |
| `categories.causes.children.children.label.color` | 标签文字颜色。 | `字符串` |
| `categories.causes.children.children.label.fontSize` | 标签文字大小。 | `数字` |
| `categories.causes.children.children.label.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `categories.causes.children.children.label.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `categories.causes.children.itemStyle` | 单条记录的图元样式。 | `对象` |
| `categories.causes.children.itemStyle.color` | 填充颜色。 | `字符串` |
| `categories.causes.children.itemStyle.fill` | 填充颜色的别名。 | `字符串` |
| `categories.causes.children.itemStyle.opacity` | 填充透明度。 | `数字` |
| `categories.causes.children.itemStyle.borderColor` | 边框颜色。 | `字符串` |
| `categories.causes.children.itemStyle.borderWidth` | 边框宽度。 | `数字` |
| `categories.causes.children.itemStyle.borderRadius` | 圆角半径。 | `数字` |
| `categories.causes.children.itemStyle.shadowBlur` | 阴影模糊半径。 | `数字` |
| `categories.causes.children.itemStyle.shadowColor` | 阴影颜色。 | `字符串` |
| `categories.causes.children.itemStyle.lineWidth` | icon or shape 样式使用的Stroke 宽度。 | `数字` |
| `categories.causes.children.label` | 单条记录的标签样式。 | `对象` |
| `categories.causes.children.label.show` | 为 true 时显示标签。 | `布尔值` |
| `categories.causes.children.label.color` | 标签文字颜色。 | `字符串` |
| `categories.causes.children.label.fontSize` | 标签文字大小。 | `数字` |
| `categories.causes.children.label.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `categories.causes.children.label.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `categories.causes.itemStyle` | 单条记录的图元样式。 | `对象` |
| `categories.causes.itemStyle.color` | 填充颜色。 | `字符串` |
| `categories.causes.itemStyle.fill` | 填充颜色的别名。 | `字符串` |
| `categories.causes.itemStyle.opacity` | 填充透明度。 | `数字` |
| `categories.causes.itemStyle.borderColor` | 边框颜色。 | `字符串` |
| `categories.causes.itemStyle.borderWidth` | 边框宽度。 | `数字` |
| `categories.causes.itemStyle.borderRadius` | 圆角半径。 | `数字` |
| `categories.causes.itemStyle.shadowBlur` | 阴影模糊半径。 | `数字` |
| `categories.causes.itemStyle.shadowColor` | 阴影颜色。 | `字符串` |
| `categories.causes.itemStyle.lineWidth` | icon or shape 样式使用的Stroke 宽度。 | `数字` |
| `categories.causes.label` | 单条记录的标签样式。 | `对象` |
| `categories.causes.label.show` | 为 true 时显示标签。 | `布尔值` |
| `categories.causes.label.color` | 标签文字颜色。 | `字符串` |
| `categories.causes.label.fontSize` | 标签文字大小。 | `数字` |
| `categories.causes.label.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `categories.causes.label.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `categories.children` | 子记录。 | `数组<对象>` |
| `categories.children.id` | 记录 ID。 | `字符串 \| 数字` |
| `categories.children.parentId` | Parent 记录 ID。 | `字符串 \| 数字` |
| `categories.children.name` | 显示名称。 | `字符串` |
| `categories.children.value` | 数值。 | `数字` |
| `categories.children.children` | 子记录。 | `数组<对象>` |
| `categories.children.children.name` | 显示名称。 | `字符串` |
| `categories.children.children.value` | 数值。 | `数字` |
| `categories.children.children.itemStyle` | 单条记录的图元样式。 | `对象` |
| `categories.children.children.itemStyle.color` | 填充颜色。 | `字符串` |
| `categories.children.children.itemStyle.fill` | 填充颜色的别名。 | `字符串` |
| `categories.children.children.itemStyle.opacity` | 填充透明度。 | `数字` |
| `categories.children.children.itemStyle.borderColor` | 边框颜色。 | `字符串` |
| `categories.children.children.itemStyle.borderWidth` | 边框宽度。 | `数字` |
| `categories.children.children.itemStyle.borderRadius` | 圆角半径。 | `数字` |
| `categories.children.children.itemStyle.shadowBlur` | 阴影模糊半径。 | `数字` |
| `categories.children.children.itemStyle.shadowColor` | 阴影颜色。 | `字符串` |
| `categories.children.children.itemStyle.lineWidth` | icon or shape 样式使用的Stroke 宽度。 | `数字` |
| `categories.children.children.label` | 单条记录的标签样式。 | `对象` |
| `categories.children.children.label.show` | 为 true 时显示标签。 | `布尔值` |
| `categories.children.children.label.color` | 标签文字颜色。 | `字符串` |
| `categories.children.children.label.fontSize` | 标签文字大小。 | `数字` |
| `categories.children.children.label.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `categories.children.children.label.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `categories.children.itemStyle` | 单条记录的图元样式。 | `对象` |
| `categories.children.itemStyle.color` | 填充颜色。 | `字符串` |
| `categories.children.itemStyle.fill` | 填充颜色的别名。 | `字符串` |
| `categories.children.itemStyle.opacity` | 填充透明度。 | `数字` |
| `categories.children.itemStyle.borderColor` | 边框颜色。 | `字符串` |
| `categories.children.itemStyle.borderWidth` | 边框宽度。 | `数字` |
| `categories.children.itemStyle.borderRadius` | 圆角半径。 | `数字` |
| `categories.children.itemStyle.shadowBlur` | 阴影模糊半径。 | `数字` |
| `categories.children.itemStyle.shadowColor` | 阴影颜色。 | `字符串` |
| `categories.children.itemStyle.lineWidth` | icon or shape 样式使用的Stroke 宽度。 | `数字` |
| `categories.children.label` | 单条记录的标签样式。 | `对象` |
| `categories.children.label.show` | 为 true 时显示标签。 | `布尔值` |
| `categories.children.label.color` | 标签文字颜色。 | `字符串` |
| `categories.children.label.fontSize` | 标签文字大小。 | `数字` |
| `categories.children.label.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `categories.children.label.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `categories.itemStyle` | 单条记录的图元样式。 | `对象` |
| `categories.itemStyle.color` | 填充颜色。 | `字符串` |
| `categories.itemStyle.fill` | 填充颜色的别名。 | `字符串` |
| `categories.itemStyle.opacity` | 填充透明度。 | `数字` |
| `categories.itemStyle.borderColor` | 边框颜色。 | `字符串` |
| `categories.itemStyle.borderWidth` | 边框宽度。 | `数字` |
| `categories.itemStyle.borderRadius` | 圆角半径。 | `数字` |
| `categories.itemStyle.shadowBlur` | 阴影模糊半径。 | `数字` |
| `categories.itemStyle.shadowColor` | 阴影颜色。 | `字符串` |
| `categories.itemStyle.lineWidth` | icon or shape 样式使用的Stroke 宽度。 | `数字` |
| `categories.label` | 单条记录的标签样式。 | `对象` |
| `categories.label.show` | 为 true 时显示标签。 | `布尔值` |
| `categories.label.color` | 标签文字颜色。 | `字符串` |
| `categories.label.fontSize` | 标签文字大小。 | `数字` |
| `categories.label.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `categories.label.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `causes` | 分类 data的别名。 | `数组<对象 \| array \| 字符串 \| 数字>` |
| `causes.name` | 显示名称。 | `字符串` |
| `causes.text` | 显示文本。 | `字符串` |
| `causes.value` | 数值。 | `数字` |
| `causes.causes` | causes字段。 | `数组<对象>` |
| `causes.causes.name` | 显示名称。 | `字符串` |
| `causes.causes.text` | 显示文本。 | `字符串` |
| `causes.causes.value` | 数值。 | `数字` |
| `causes.causes.itemStyle` | 单条记录的图元样式。 | `对象` |
| `causes.causes.itemStyle.color` | 填充颜色。 | `字符串` |
| `causes.causes.itemStyle.fill` | 填充颜色的别名。 | `字符串` |
| `causes.causes.itemStyle.opacity` | 填充透明度。 | `数字` |
| `causes.causes.itemStyle.borderColor` | 边框颜色。 | `字符串` |
| `causes.causes.itemStyle.borderWidth` | 边框宽度。 | `数字` |
| `causes.causes.itemStyle.borderRadius` | 圆角半径。 | `数字` |
| `causes.causes.itemStyle.shadowBlur` | 阴影模糊半径。 | `数字` |
| `causes.causes.itemStyle.shadowColor` | 阴影颜色。 | `字符串` |
| `causes.causes.itemStyle.lineWidth` | icon or shape 样式使用的Stroke 宽度。 | `数字` |
| `causes.causes.label` | 单条记录的标签样式。 | `对象` |
| `causes.causes.label.show` | 为 true 时显示标签。 | `布尔值` |
| `causes.causes.label.color` | 标签文字颜色。 | `字符串` |
| `causes.causes.label.fontSize` | 标签文字大小。 | `数字` |
| `causes.causes.label.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `causes.causes.label.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `causes.children` | 子记录。 | `数组<对象>` |
| `causes.children.id` | 记录 ID。 | `字符串 \| 数字` |
| `causes.children.parentId` | Parent 记录 ID。 | `字符串 \| 数字` |
| `causes.children.name` | 显示名称。 | `字符串` |
| `causes.children.value` | 数值。 | `数字` |
| `causes.children.children` | 子记录。 | `数组<对象>` |
| `causes.children.children.name` | 显示名称。 | `字符串` |
| `causes.children.children.value` | 数值。 | `数字` |
| `causes.children.children.itemStyle` | 单条记录的图元样式。 | `对象` |
| `causes.children.children.itemStyle.color` | 填充颜色。 | `字符串` |
| `causes.children.children.itemStyle.fill` | 填充颜色的别名。 | `字符串` |
| `causes.children.children.itemStyle.opacity` | 填充透明度。 | `数字` |
| `causes.children.children.itemStyle.borderColor` | 边框颜色。 | `字符串` |
| `causes.children.children.itemStyle.borderWidth` | 边框宽度。 | `数字` |
| `causes.children.children.itemStyle.borderRadius` | 圆角半径。 | `数字` |
| `causes.children.children.itemStyle.shadowBlur` | 阴影模糊半径。 | `数字` |
| `causes.children.children.itemStyle.shadowColor` | 阴影颜色。 | `字符串` |
| `causes.children.children.itemStyle.lineWidth` | icon or shape 样式使用的Stroke 宽度。 | `数字` |
| `causes.children.children.label` | 单条记录的标签样式。 | `对象` |
| `causes.children.children.label.show` | 为 true 时显示标签。 | `布尔值` |
| `causes.children.children.label.color` | 标签文字颜色。 | `字符串` |
| `causes.children.children.label.fontSize` | 标签文字大小。 | `数字` |
| `causes.children.children.label.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `causes.children.children.label.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `causes.children.itemStyle` | 单条记录的图元样式。 | `对象` |
| `causes.children.itemStyle.color` | 填充颜色。 | `字符串` |
| `causes.children.itemStyle.fill` | 填充颜色的别名。 | `字符串` |
| `causes.children.itemStyle.opacity` | 填充透明度。 | `数字` |
| `causes.children.itemStyle.borderColor` | 边框颜色。 | `字符串` |
| `causes.children.itemStyle.borderWidth` | 边框宽度。 | `数字` |
| `causes.children.itemStyle.borderRadius` | 圆角半径。 | `数字` |
| `causes.children.itemStyle.shadowBlur` | 阴影模糊半径。 | `数字` |
| `causes.children.itemStyle.shadowColor` | 阴影颜色。 | `字符串` |
| `causes.children.itemStyle.lineWidth` | icon or shape 样式使用的Stroke 宽度。 | `数字` |
| `causes.children.label` | 单条记录的标签样式。 | `对象` |
| `causes.children.label.show` | 为 true 时显示标签。 | `布尔值` |
| `causes.children.label.color` | 标签文字颜色。 | `字符串` |
| `causes.children.label.fontSize` | 标签文字大小。 | `数字` |
| `causes.children.label.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `causes.children.label.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `causes.itemStyle` | 单条记录的图元样式。 | `对象` |
| `causes.itemStyle.color` | 填充颜色。 | `字符串` |
| `causes.itemStyle.fill` | 填充颜色的别名。 | `字符串` |
| `causes.itemStyle.opacity` | 填充透明度。 | `数字` |
| `causes.itemStyle.borderColor` | 边框颜色。 | `字符串` |
| `causes.itemStyle.borderWidth` | 边框宽度。 | `数字` |
| `causes.itemStyle.borderRadius` | 圆角半径。 | `数字` |
| `causes.itemStyle.shadowBlur` | 阴影模糊半径。 | `数字` |
| `causes.itemStyle.shadowColor` | 阴影颜色。 | `字符串` |
| `causes.itemStyle.lineWidth` | icon or shape 样式使用的Stroke 宽度。 | `数字` |
| `causes.label` | 单条记录的标签样式。 | `对象` |
| `causes.label.show` | 为 true 时显示标签。 | `布尔值` |
| `causes.label.color` | 标签文字颜色。 | `字符串` |
| `causes.label.fontSize` | 标签文字大小。 | `数字` |
| `causes.label.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `causes.label.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `data` | 分类 data的别名。 | `数组<对象 \| array \| 字符串 \| 数字>` |
| `data.name` | 显示名称。 | `字符串` |
| `data.text` | 显示文本。 | `字符串` |
| `data.value` | 数值。 | `数字` |
| `data.causes` | causes字段。 | `数组<对象>` |
| `data.causes.name` | 显示名称。 | `字符串` |
| `data.causes.text` | 显示文本。 | `字符串` |
| `data.causes.value` | 数值。 | `数字` |
| `data.causes.causes` | causes字段。 | `数组<对象>` |
| `data.causes.causes.name` | 显示名称。 | `字符串` |
| `data.causes.causes.text` | 显示文本。 | `字符串` |
| `data.causes.causes.value` | 数值。 | `数字` |
| `data.causes.causes.itemStyle` | 单条记录的图元样式。 | `对象` |
| `data.causes.causes.itemStyle.color` | 填充颜色。 | `字符串` |
| `data.causes.causes.itemStyle.fill` | 填充颜色的别名。 | `字符串` |
| `data.causes.causes.itemStyle.opacity` | 填充透明度。 | `数字` |
| `data.causes.causes.itemStyle.borderColor` | 边框颜色。 | `字符串` |
| `data.causes.causes.itemStyle.borderWidth` | 边框宽度。 | `数字` |
| `data.causes.causes.itemStyle.borderRadius` | 圆角半径。 | `数字` |
| `data.causes.causes.itemStyle.shadowBlur` | 阴影模糊半径。 | `数字` |
| `data.causes.causes.itemStyle.shadowColor` | 阴影颜色。 | `字符串` |
| `data.causes.causes.itemStyle.lineWidth` | icon or shape 样式使用的Stroke 宽度。 | `数字` |
| `data.causes.causes.label` | 单条记录的标签样式。 | `对象` |
| `data.causes.causes.label.show` | 为 true 时显示标签。 | `布尔值` |
| `data.causes.causes.label.color` | 标签文字颜色。 | `字符串` |
| `data.causes.causes.label.fontSize` | 标签文字大小。 | `数字` |
| `data.causes.causes.label.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `data.causes.causes.label.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `data.causes.children` | 子记录。 | `数组<对象>` |
| `data.causes.children.id` | 记录 ID。 | `字符串 \| 数字` |
| `data.causes.children.parentId` | Parent 记录 ID。 | `字符串 \| 数字` |
| `data.causes.children.name` | 显示名称。 | `字符串` |
| `data.causes.children.value` | 数值。 | `数字` |
| `data.causes.children.children` | 子记录。 | `数组<对象>` |
| `data.causes.children.children.name` | 显示名称。 | `字符串` |
| `data.causes.children.children.value` | 数值。 | `数字` |
| `data.causes.children.children.itemStyle` | 单条记录的图元样式。 | `对象` |
| `data.causes.children.children.itemStyle.color` | 填充颜色。 | `字符串` |
| `data.causes.children.children.itemStyle.fill` | 填充颜色的别名。 | `字符串` |
| `data.causes.children.children.itemStyle.opacity` | 填充透明度。 | `数字` |
| `data.causes.children.children.itemStyle.borderColor` | 边框颜色。 | `字符串` |
| `data.causes.children.children.itemStyle.borderWidth` | 边框宽度。 | `数字` |
| `data.causes.children.children.itemStyle.borderRadius` | 圆角半径。 | `数字` |
| `data.causes.children.children.itemStyle.shadowBlur` | 阴影模糊半径。 | `数字` |
| `data.causes.children.children.itemStyle.shadowColor` | 阴影颜色。 | `字符串` |
| `data.causes.children.children.itemStyle.lineWidth` | icon or shape 样式使用的Stroke 宽度。 | `数字` |
| `data.causes.children.children.label` | 单条记录的标签样式。 | `对象` |
| `data.causes.children.children.label.show` | 为 true 时显示标签。 | `布尔值` |
| `data.causes.children.children.label.color` | 标签文字颜色。 | `字符串` |
| `data.causes.children.children.label.fontSize` | 标签文字大小。 | `数字` |
| `data.causes.children.children.label.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `data.causes.children.children.label.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `data.causes.children.itemStyle` | 单条记录的图元样式。 | `对象` |
| `data.causes.children.itemStyle.color` | 填充颜色。 | `字符串` |
| `data.causes.children.itemStyle.fill` | 填充颜色的别名。 | `字符串` |
| `data.causes.children.itemStyle.opacity` | 填充透明度。 | `数字` |
| `data.causes.children.itemStyle.borderColor` | 边框颜色。 | `字符串` |
| `data.causes.children.itemStyle.borderWidth` | 边框宽度。 | `数字` |
| `data.causes.children.itemStyle.borderRadius` | 圆角半径。 | `数字` |
| `data.causes.children.itemStyle.shadowBlur` | 阴影模糊半径。 | `数字` |
| `data.causes.children.itemStyle.shadowColor` | 阴影颜色。 | `字符串` |
| `data.causes.children.itemStyle.lineWidth` | icon or shape 样式使用的Stroke 宽度。 | `数字` |
| `data.causes.children.label` | 单条记录的标签样式。 | `对象` |
| `data.causes.children.label.show` | 为 true 时显示标签。 | `布尔值` |
| `data.causes.children.label.color` | 标签文字颜色。 | `字符串` |
| `data.causes.children.label.fontSize` | 标签文字大小。 | `数字` |
| `data.causes.children.label.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `data.causes.children.label.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `data.causes.itemStyle` | 单条记录的图元样式。 | `对象` |
| `data.causes.itemStyle.color` | 填充颜色。 | `字符串` |
| `data.causes.itemStyle.fill` | 填充颜色的别名。 | `字符串` |
| `data.causes.itemStyle.opacity` | 填充透明度。 | `数字` |
| `data.causes.itemStyle.borderColor` | 边框颜色。 | `字符串` |
| `data.causes.itemStyle.borderWidth` | 边框宽度。 | `数字` |
| `data.causes.itemStyle.borderRadius` | 圆角半径。 | `数字` |
| `data.causes.itemStyle.shadowBlur` | 阴影模糊半径。 | `数字` |
| `data.causes.itemStyle.shadowColor` | 阴影颜色。 | `字符串` |
| `data.causes.itemStyle.lineWidth` | icon or shape 样式使用的Stroke 宽度。 | `数字` |
| `data.causes.label` | 单条记录的标签样式。 | `对象` |
| `data.causes.label.show` | 为 true 时显示标签。 | `布尔值` |
| `data.causes.label.color` | 标签文字颜色。 | `字符串` |
| `data.causes.label.fontSize` | 标签文字大小。 | `数字` |
| `data.causes.label.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `data.causes.label.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
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
| `padding` | 内边距 around the cause-effect diagram。 | `数字 \| 对象` |
| `padding.top` | 顶部内边距。 | `数字` |
| `padding.right` | 右侧内边距。 | `数字` |
| `padding.bottom` | 底部内边距。 | `数字` |
| `padding.left` | 左侧内边距。 | `数字` |
| `effectWidth` | 宽度 of the effect box。 | `数字` |
| `effectHeight` | 高度 of the effect box。 | `数字` |
| `effectGap` | 间距 between the spine and effect box。 | `数字` |
| `categoryGap` | 间距 between 分类 branches。 | `数字` |
| `categoryLength` | Length of 分类 branch 线。 | `数字` |
| `categoryAngle` | 角度 of 分类 branch 线。 | `数字 (degrees)` |
| `causeGap` | 间距 between causes along a branch。 | `数字` |
| `causeLength` | Length of indivIDual cause 线。 | `数字` |
| `maxCauseDepth` | 最大值 nested cause depth to 渲染。 | `数字` |
| `spineArrowSize` | Ar行 大小 at the 结束 of the spine。 | `数字` |
| `lineStyle` | 设置主干线样式。 | `对象` |
| `lineStyle.color` | 主颜色。 | `字符串` |
| `lineStyle.stroke` | 描边颜色。 | `字符串` |
| `lineStyle.width` | 宽度值。 | `数字` |
| `lineStyle.lineWidth` | 线宽。 | `数字` |
| `lineStyle.opacity` | 透明度。 | `数字` |
| `lineStyle.type` | 线条或图元类型。 | `'solid' \| 'dashed' \| 'dotted' \| 数字[]` |
| `categoryLineStyle` | 设置分类分支线样式。 | `对象` |
| `categoryLineStyle.color` | 主颜色。 | `字符串` |
| `categoryLineStyle.stroke` | 描边颜色。 | `字符串` |
| `categoryLineStyle.width` | 宽度值。 | `数字` |
| `categoryLineStyle.lineWidth` | 线宽。 | `数字` |
| `categoryLineStyle.opacity` | 透明度。 | `数字` |
| `categoryLineStyle.type` | 线条或图元类型。 | `'solid' \| 'dashed' \| 'dotted' \| 数字[]` |
| `causeLineStyle` | 设置原因线样式。 | `对象` |
| `causeLineStyle.color` | 主颜色。 | `字符串` |
| `causeLineStyle.stroke` | 描边颜色。 | `字符串` |
| `causeLineStyle.width` | 宽度值。 | `数字` |
| `causeLineStyle.lineWidth` | 线宽。 | `数字` |
| `causeLineStyle.opacity` | 透明度。 | `数字` |
| `causeLineStyle.type` | 线条或图元类型。 | `'solid' \| 'dashed' \| 'dotted' \| 数字[]` |
| `effectStyle` | 设置结果框样式。 | `对象` |
| `effectStyle.color` | 主颜色。 | `字符串` |
| `effectStyle.fill` | 填充颜色。 | `字符串` |
| `effectStyle.opacity` | 透明度。 | `数字` |
| `effectStyle.borderColor` | 边框颜色。 | `字符串` |
| `effectStyle.borderWidth` | 边框宽度。 | `数字` |
| `effectStyle.borderRadius` | 圆角半径。 | `数字` |
| `label` | Default 标签 样式 for diagram 文本。 | `对象` |
| `label.show` | 为 true 时显示标签。 | `布尔值` |
| `label.color` | 标签文字颜色。 | `字符串` |
| `label.fontSize` | 标签文字大小。 | `数字` |
| `label.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `label.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `effectLabel` | 设置结果标签样式。 | `对象` |
| `effectLabel.show` | 为 true 时显示标签。 | `布尔值` |
| `effectLabel.color` | 标签文字颜色。 | `字符串` |
| `effectLabel.fontSize` | 标签文字大小。 | `数字` |
| `effectLabel.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `effectLabel.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `categoryLabel` | 设置分类标签样式。 | `对象` |
| `categoryLabel.show` | 为 true 时显示标签。 | `布尔值` |
| `categoryLabel.color` | 标签文字颜色。 | `字符串` |
| `categoryLabel.fontSize` | 标签文字大小。 | `数字` |
| `categoryLabel.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `categoryLabel.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `causeLabel` | 设置原因标签样式。 | `对象` |
| `causeLabel.show` | 为 true 时显示标签。 | `布尔值` |
| `causeLabel.color` | 标签文字颜色。 | `字符串` |
| `causeLabel.fontSize` | 标签文字大小。 | `数字` |
| `causeLabel.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `causeLabel.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `emphasis` | 设置elements while 悬停时样式。 | `对象` |
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
