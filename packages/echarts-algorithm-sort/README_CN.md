# @echarts-extension/algorithm-sort

语言：[English](./README.md) | 中文

ECharts 排序算法可视化扩展。导入本包即可注册 `series.type = 'algorithmSort'`。

![排序算法可视化截图](../../visual-baseline/echarts-algorithm-sort.png)

## 安装

```bash
npm install echarts @echarts-extension/algorithm-sort
```

## 基础用法

```js
import * as echarts from 'echarts';
import '@echarts-extension/algorithm-sort';

const chart = echarts.init(document.getElementById('main'));

chart.setOption({
  series: [
    {
      type: 'algorithmSort',
      algorithm: 'quick',
      currentStep: 12,
      data: [
        { name: 'A', value: 42 },
        { name: 'B', value: 16 },
        { name: 'C', value: 64 },
        { name: 'D', value: 28 }
      ]
    }
  ]
});
```

## 算法

第一版覆盖冒泡、选择、插入、归并、快速和堆排序。系列内部生成确定性的排序帧；修改 `currentStep` 或 `progress` 即可拖动查看过程。`currentStep` 支持小数，会在相邻帧之间插值柱体位置，让交换像 bar racing 一样移动，而不是硬切。

## 常用选项

- `algorithm`：选择排序算法。
- `order`：升序或降序。
- `currentStep`, `progress`：控制当前帧。
- `maxItems`, `maxFrames`：限制输入规模和帧数量。
- `stateStyle`：设置比较、交换、写入、枢轴和已排序状态的颜色。

## 配置项

<!-- OPTIONS:START -->
此表由 `scripts/sync-options-from-readmes.mjs --write-readmes` 生成。更新英文 README 的配置表后，运行 `npm run docs:sync-options` 可刷新文档页。

| 配置项 | 说明 | 可选值 |
| --- | --- | --- |
| `type` | 向 ECharts 注册该包的系列类型。 | `'algorithmSort'` |
| `silent` | 为 true 时禁用鼠标事件。 | `布尔值` |
| `width` | 系列区域宽度。 | `数字 \| 字符串 (像素或百分比)` |
| `height` | 系列区域高度。 | `数字 \| 字符串 (像素或百分比)` |
| `top` | 距离图表容器顶部的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `right` | 距离图表容器右侧的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `bottom` | 距离图表容器底部的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `left` | 距离图表容器左侧的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `data` | 需要排序的值，支持数字、对象行和数组行。 | `数组<数字 \| 对象 \| 未知[]>` |
| `values` | 数字或行数据的别名输入。 | `数组<数字 \| 对象 \| 未知[]>` |
| `data.name` | 数值的显示名称。 | `字符串 \| 数字` |
| `data.value` | 算法使用的数值。 | `数字` |
| `dimensions` | 当数据行为数组时，用于命名列。 | `字符串[]` |
| `valueField` | 用于读取数值的字段。 | `字符串 \| 数字` |
| `nameField` | 用于读取名称的字段。 | `字符串 \| 数字` |
| `algorithm` | 要可视化的排序算法。 | `'bubble' \| 'selection' \| 'insertion' \| 'merge' \| 'quick' \| 'heap'` |
| `order` | 排序方向。 | `'ascending' \| 'descending'` |
| `currentStep` | 当前渲染的帧序号；小数值会在相邻帧之间插值。 | `数字` |
| `progress` | 0 到 1 的归一化进度；设置 `currentStep` 时会忽略它。 | `数字 (0-1)` |
| `maxItems` | 用于生成帧的最大输入数量。 | `数字` |
| `maxFrames` | 生成帧数量的安全上限。 | `数字` |
| `padding` | 图表周围的内边距。 | `数字 \| 对象` |
| `padding.top` | 顶部内边距。 | `数字` |
| `padding.right` | 右侧内边距。 | `数字` |
| `padding.bottom` | 底部内边距。 | `数字` |
| `padding.left` | 左侧内边距。 | `数字` |
| `min` | 数值轴手动最小值。 | `数字` |
| `max` | 数值轴手动最大值。 | `数字` |
| `nice` | 将数值范围整理为更易读的刻度。 | `布尔值` |
| `tickCount` | 首选刻度数量。 | `数字` |
| `barWidth` | 固定柱宽。 | `数字` |
| `grid` | 显示或隐藏网格线。 | `对象` |
| `grid.show` | 为 true 时显示网格。 | `布尔值` |
| `valueAxis` | 控制数值轴标签和线条。 | `对象` |
| `valueAxis.show` | 为 true 时显示数值轴。 | `布尔值` |
| `valueAxis.label` | 设置数值轴标签样式。 | `对象` |
| `valueAxis.splitLine` | 设置数值分隔线样式。 | `对象` |
| `valueAxis.axisLine` | 设置基线样式。 | `对象` |
| `categoryAxis` | 控制基线上的元素标签。 | `对象` |
| `categoryAxis.show` | 为 true 时显示元素标签。 | `布尔值` |
| `categoryAxis.label` | 设置元素标签样式。 | `对象` |
| `itemStyle` | 基础柱体样式。 | `对象` |
| `itemStyle.color` | 基础柱体填充色。 | `字符串` |
| `itemStyle.opacity` | 基础柱体透明度。 | `数字` |
| `itemStyle.borderColor` | 柱体边框颜色。 | `字符串` |
| `itemStyle.borderWidth` | 柱体边框宽度。 | `数字` |
| `stateStyle` | 各状态的柱体颜色。 | `对象` |
| `stateStyle.compare.color` | 正在比较的柱体颜色。 | `字符串` |
| `stateStyle.swap.color` | 正在交换的柱体颜色。 | `字符串` |
| `stateStyle.write.color` | 归并写入的柱体颜色。 | `字符串` |
| `stateStyle.pivot.color` | 快排枢轴柱体颜色。 | `字符串` |
| `stateStyle.sorted.color` | 已固定排序柱体颜色。 | `字符串` |
| `rangeStyle` | 归并、快排或堆排序活动区间的高亮样式。 | `对象` |
| `rangeStyle.color` | 区间高亮颜色。 | `字符串` |
| `rangeStyle.opacity` | 区间高亮透明度。 | `数字` |
| `label` | 设置柱体上方的数值标签。 | `对象` |
| `label.show` | 为 true 时显示数值标签。 | `布尔值` |
| `label.color` | 标签文字颜色。 | `字符串` |
| `label.fontSize` | 标签文字大小。 | `数字` |
| `label.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `label.formatter` | 格式化标签文本。 | `字符串 \| 函数` |
| `stepLabel` | 设置当前步骤说明样式。 | `对象` |
| `stepLabel.show` | 为 true 时显示步骤说明。 | `布尔值` |
| `stepLabel.color` | 主要步骤文字颜色。 | `字符串` |
| `stepLabel.mutedColor` | 次要步骤文字颜色。 | `字符串` |
| `stepLabel.fontSize` | 步骤文字大小。 | `数字` |
| `stepLabel.fontWeight` | 步骤文字字重。 | `字符串 \| 数字` |
| `emphasis` | 设置悬停时柱体样式。 | `对象` |
| `emphasis.itemStyle` | 嵌套的柱体样式选项。 | `对象` |
<!-- OPTIONS:END -->
