# @echarts-extension/sequence-diagram

语言：[English](./README.md) | 中文

ECharts UML 时序图扩展。

![Sequence Diagram 图表截图](../../visual-baseline/echarts-sequence-diagram.png)

```js
import * as echarts from 'echarts';
import '@echarts-extension/sequence-diagram';

const chart = echarts.init(document.getElementById('main'));
chart.setOption({
  series: [
    {
      type: 'sequenceDiagram',
      participants: [
        { id: 'browser', name: 'Browser' },
        { id: 'api', name: 'API' },
        { id: 'db', name: 'Database' }
      ],
      messages: [
        { from: 'browser', to: 'api', text: 'GET /orders', type: 'sync' },
        { from: 'api', to: 'db', text: 'SELECT orders', type: 'async' },
        { from: 'db', to: 'api', text: 'rows', type: 'return' },
        { from: 'api', to: 'api', text: 'cache()', type: 'self' }
      ],
      activations: [
        { participant: 'api', start: 0, end: 3 }
      ]
    }
  ]
});
```

也可以通过 `dsl` 或 `source` 直接传入文本 DSL：

```js
chart.setOption({
  series: [
    {
      type: 'sequenceDiagram',
      dsl: `
        sequenceDiagram
          actor C as Client
          participant API as Order API
          create participant Session
          C->>+API: GET /orders
          API->>Session**: create session
          Note right of API: validate token
          opt cached
            API-->>-C: response
          end
          duration API,Session: < 100ms
          API-xSession: close
      `
    }
  ]
});
```

## 配置项

<!-- OPTIONS:START -->
此表由 `scripts/sync-options-from-readmes.mjs --write-readmes` 生成。更新英文 README 的配置表后，运行 `npm run docs:sync-options` 可刷新文档页。

| 配置项 | 说明 | 可选值 |
| --- | --- | --- |
| `type` | 向 ECharts 注册该包的系列类型。 | `'sequenceDiagram'` |
| `silent` | 为 true 时禁用mouse events for the 系列。 | `布尔值` |
| `width` | 系列区域宽度。 | `数字 \| 字符串 (像素或百分比)` |
| `height` | 系列区域高度。 | `数字 \| 字符串 (像素或百分比)` |
| `top` | 距离图表容器顶部的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `right` | 距离图表容器右侧的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `bottom` | 距离图表容器底部的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `left` | 距离图表容器左侧的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `participants` | 参与者 or actors that appear across the top of the diagram。 | `数组<对象 \| [id, name] \| 字符串 \| 数字>` |
| `participants.id` | 记录 ID。 | `字符串 \| 数字` |
| `participants.name` | 显示名称。 | `字符串 \| 数字` |
| `participants.label` | 单条记录的标签样式。 | `对象` |
| `participants.label.show` | 为 true 时显示标签。 | `布尔值` |
| `participants.label.color` | 标签文字颜色。 | `字符串` |
| `participants.label.fontSize` | 标签文字大小。 | `数字` |
| `participants.label.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `participants.label.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `messages` | 消息 ar行 between 参与者。 | `数组<对象 \| [from, to, text, type]>` |
| `messages.from` | 源参与者或项目 ID。 | `字符串 \| 数字` |
| `messages.to` | 目标参与者或项目 ID。 | `字符串 \| 数字` |
| `messages.text` | 显示文本。 | `字符串 \| 数字` |
| `messages.type` | 记录类型。 | `字符串 \| 数字` |
| `messages.lineStyle` | 线 样式字段。 | `对象` |
| `messages.lineStyle.show` | 为 true 时显示线 group。 | `布尔值` |
| `messages.lineStyle.color` | 线条颜色。 | `字符串` |
| `messages.lineStyle.stroke` | 线条颜色的别名。 | `字符串` |
| `messages.lineStyle.width` | 线宽。 | `数字` |
| `messages.lineStyle.lineWidth` | 线宽的别名。 | `数字` |
| `messages.lineStyle.opacity` | 线条透明度。 | `数字` |
| `messages.lineStyle.type` | 线条虚线样式。 | `'solid' \| 'dashed' \| 'dotted' \| 数字[] \| 字符串` |
| `messages.lineStyle.dashOffset` | 虚线偏移量。 | `数字` |
| `messages.lineStyle.lineDashOffset` | 虚线偏移量的别名。 | `数字` |
| `messages.lineStyle.cornerRadius` | 折线路径圆角半径。 | `数字` |
| `messages.lineStyle.cap` | 线帽样式。 | `'round' \| 'butt' \| 'square'` |
| `messages.lineStyle.join` | 线连接样式。 | `'round' \| 'bevel' \| 'miter'` |
| `messages.lineStyle.dashArray` | 虚线模式。 | `数字[] \| 字符串` |
| `messages.lineStyle.lineDash` | 虚线模式别名。 | `数字[]` |
| `messages.label` | 单条记录的标签样式。 | `对象` |
| `messages.label.show` | 为 true 时显示标签。 | `布尔值` |
| `messages.label.color` | 标签文字颜色。 | `字符串` |
| `messages.label.fontSize` | 标签文字大小。 | `数字` |
| `messages.label.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `messages.label.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `data` | 消息 行的别名。 | `数组<对象 \| [from, to, text, type]>` |
| `data.from` | 源参与者或项目 ID。 | `字符串 \| 数字` |
| `data.to` | 目标参与者或项目 ID。 | `字符串 \| 数字` |
| `data.text` | 显示文本。 | `字符串 \| 数字` |
| `data.type` | 记录类型。 | `字符串 \| 数字` |
| `data.lineStyle` | 线 样式字段。 | `对象` |
| `data.lineStyle.show` | 为 true 时显示线 group。 | `布尔值` |
| `data.lineStyle.color` | 线条颜色。 | `字符串` |
| `data.lineStyle.stroke` | 线条颜色的别名。 | `字符串` |
| `data.lineStyle.width` | 线宽。 | `数字` |
| `data.lineStyle.lineWidth` | 线宽的别名。 | `数字` |
| `data.lineStyle.opacity` | 线条透明度。 | `数字` |
| `data.lineStyle.type` | 线条虚线样式。 | `'solid' \| 'dashed' \| 'dotted' \| 数字[] \| 字符串` |
| `data.lineStyle.dashOffset` | 虚线偏移量。 | `数字` |
| `data.lineStyle.lineDashOffset` | 虚线偏移量的别名。 | `数字` |
| `data.lineStyle.cornerRadius` | 折线路径圆角半径。 | `数字` |
| `data.lineStyle.cap` | 线帽样式。 | `'round' \| 'butt' \| 'square'` |
| `data.lineStyle.join` | 线连接样式。 | `'round' \| 'bevel' \| 'miter'` |
| `data.lineStyle.dashArray` | 虚线模式。 | `数字[] \| 字符串` |
| `data.lineStyle.lineDash` | 虚线模式别名。 | `数字[]` |
| `data.label` | 单条记录的标签样式。 | `对象` |
| `data.label.show` | 为 true 时显示标签。 | `布尔值` |
| `data.label.color` | 标签文字颜色。 | `字符串` |
| `data.label.fontSize` | 标签文字大小。 | `数字` |
| `data.label.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `data.label.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `activations` | Activation bars on 参与者 life线。 | `数组<对象>` |
| `activations.participant` | 参与者字段。 | `字符串 \| 数字` |
| `activations.start` | 开始字段。 | `数字` |
| `activations.end` | 结束字段。 | `数字` |
| `activations.itemStyle` | 单条记录的图元样式。 | `对象` |
| `activations.itemStyle.color` | 填充颜色。 | `字符串` |
| `activations.itemStyle.fill` | 填充颜色的别名。 | `字符串` |
| `activations.itemStyle.opacity` | 填充透明度。 | `数字` |
| `activations.itemStyle.borderColor` | 边框颜色。 | `字符串` |
| `activations.itemStyle.borderWidth` | 边框宽度。 | `数字` |
| `activations.itemStyle.borderRadius` | 圆角半径。 | `数字` |
| `activations.itemStyle.shadowBlur` | 阴影模糊半径。 | `数字` |
| `activations.itemStyle.shadowColor` | 阴影颜色。 | `字符串` |
| `activations.itemStyle.lineWidth` | icon or shape 样式使用的Stroke 宽度。 | `数字` |
| `notes` | 文本 notes attached to a 参与者 or span。 | `数组<对象>` |
| `notes.participant` | 参与者字段。 | `字符串 \| 数字` |
| `notes.text` | 显示文本。 | `字符串` |
| `notes.start` | 开始字段。 | `数字` |
| `notes.end` | 结束字段。 | `数字` |
| `notes.itemStyle` | 单条记录的图元样式。 | `对象` |
| `notes.itemStyle.color` | 填充颜色。 | `字符串` |
| `notes.itemStyle.fill` | 填充颜色的别名。 | `字符串` |
| `notes.itemStyle.opacity` | 填充透明度。 | `数字` |
| `notes.itemStyle.borderColor` | 边框颜色。 | `字符串` |
| `notes.itemStyle.borderWidth` | 边框宽度。 | `数字` |
| `notes.itemStyle.borderRadius` | 圆角半径。 | `数字` |
| `notes.itemStyle.shadowBlur` | 阴影模糊半径。 | `数字` |
| `notes.itemStyle.shadowColor` | 阴影颜色。 | `字符串` |
| `notes.itemStyle.lineWidth` | icon or shape 样式使用的Stroke 宽度。 | `数字` |
| `notes.label` | 单条记录的标签样式。 | `对象` |
| `notes.label.show` | 为 true 时显示标签。 | `布尔值` |
| `notes.label.color` | 标签文字颜色。 | `字符串` |
| `notes.label.fontSize` | 标签文字大小。 | `数字` |
| `notes.label.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `notes.label.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `fragments` | Alt, opt, loop, or other grouped 交互 片段。 | `数组<对象>` |
| `fragments.type` | 记录类型。 | `字符串` |
| `fragments.text` | 显示文本。 | `字符串` |
| `fragments.start` | 开始字段。 | `数字` |
| `fragments.end` | 结束字段。 | `数字` |
| `fragments.messages` | 消息字段。 | `数组<对象>` |
| `fragments.messages.from` | 源参与者或项目 ID。 | `字符串 \| 数字` |
| `fragments.messages.to` | 目标参与者或项目 ID。 | `字符串 \| 数字` |
| `fragments.messages.text` | 显示文本。 | `字符串` |
| `fragments.messages.type` | 记录类型。 | `字符串` |
| `fragments.messages.lineStyle` | 线 样式字段。 | `对象` |
| `fragments.messages.lineStyle.show` | 为 true 时显示线 group。 | `布尔值` |
| `fragments.messages.lineStyle.color` | 线条颜色。 | `字符串` |
| `fragments.messages.lineStyle.stroke` | 线条颜色的别名。 | `字符串` |
| `fragments.messages.lineStyle.width` | 线宽。 | `数字` |
| `fragments.messages.lineStyle.lineWidth` | 线宽的别名。 | `数字` |
| `fragments.messages.lineStyle.opacity` | 线条透明度。 | `数字` |
| `fragments.messages.lineStyle.type` | 线条虚线样式。 | `'solid' \| 'dashed' \| 'dotted' \| 数字[] \| 字符串` |
| `fragments.messages.lineStyle.dashOffset` | 虚线偏移量。 | `数字` |
| `fragments.messages.lineStyle.lineDashOffset` | 虚线偏移量的别名。 | `数字` |
| `fragments.messages.lineStyle.cornerRadius` | 折线路径圆角半径。 | `数字` |
| `fragments.messages.lineStyle.cap` | 线帽样式。 | `'round' \| 'butt' \| 'square'` |
| `fragments.messages.lineStyle.join` | 线连接样式。 | `'round' \| 'bevel' \| 'miter'` |
| `fragments.messages.lineStyle.dashArray` | 虚线模式。 | `数字[] \| 字符串` |
| `fragments.messages.lineStyle.lineDash` | 虚线模式别名。 | `数字[]` |
| `fragments.messages.label` | 单条记录的标签样式。 | `对象` |
| `fragments.messages.label.show` | 为 true 时显示标签。 | `布尔值` |
| `fragments.messages.label.color` | 标签文字颜色。 | `字符串` |
| `fragments.messages.label.fontSize` | 标签文字大小。 | `数字` |
| `fragments.messages.label.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `fragments.messages.label.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `fragments.itemStyle` | 单条记录的图元样式。 | `对象` |
| `fragments.itemStyle.color` | 填充颜色。 | `字符串` |
| `fragments.itemStyle.fill` | 填充颜色的别名。 | `字符串` |
| `fragments.itemStyle.opacity` | 填充透明度。 | `数字` |
| `fragments.itemStyle.borderColor` | 边框颜色。 | `字符串` |
| `fragments.itemStyle.borderWidth` | 边框宽度。 | `数字` |
| `fragments.itemStyle.borderRadius` | 圆角半径。 | `数字` |
| `fragments.itemStyle.shadowBlur` | 阴影模糊半径。 | `数字` |
| `fragments.itemStyle.shadowColor` | 阴影颜色。 | `字符串` |
| `fragments.itemStyle.lineWidth` | icon or shape 样式使用的Stroke 宽度。 | `数字` |
| `fragments.label` | 单条记录的标签样式。 | `对象` |
| `fragments.label.show` | 为 true 时显示标签。 | `布尔值` |
| `fragments.label.color` | 标签文字颜色。 | `字符串` |
| `fragments.label.fontSize` | 标签文字大小。 | `数字` |
| `fragments.label.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `fragments.label.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `constraints` | Ti最小值g or 时长 annotations。 | `数组<对象>` |
| `constraints.from` | 源参与者或项目 ID。 | `字符串 \| 数字` |
| `constraints.to` | 目标参与者或项目 ID。 | `字符串 \| 数字` |
| `constraints.text` | 显示文本。 | `字符串` |
| `constraints.lineStyle` | 线 样式字段。 | `对象` |
| `constraints.lineStyle.show` | 为 true 时显示线 group。 | `布尔值` |
| `constraints.lineStyle.color` | 线条颜色。 | `字符串` |
| `constraints.lineStyle.stroke` | 线条颜色的别名。 | `字符串` |
| `constraints.lineStyle.width` | 线宽。 | `数字` |
| `constraints.lineStyle.lineWidth` | 线宽的别名。 | `数字` |
| `constraints.lineStyle.opacity` | 线条透明度。 | `数字` |
| `constraints.lineStyle.type` | 线条虚线样式。 | `'solid' \| 'dashed' \| 'dotted' \| 数字[] \| 字符串` |
| `constraints.lineStyle.dashOffset` | 虚线偏移量。 | `数字` |
| `constraints.lineStyle.lineDashOffset` | 虚线偏移量的别名。 | `数字` |
| `constraints.lineStyle.cornerRadius` | 折线路径圆角半径。 | `数字` |
| `constraints.lineStyle.cap` | 线帽样式。 | `'round' \| 'butt' \| 'square'` |
| `constraints.lineStyle.join` | 线连接样式。 | `'round' \| 'bevel' \| 'miter'` |
| `constraints.lineStyle.dashArray` | 虚线模式。 | `数字[] \| 字符串` |
| `constraints.lineStyle.lineDash` | 虚线模式别名。 | `数字[]` |
| `constraints.label` | 单条记录的标签样式。 | `对象` |
| `constraints.label.show` | 为 true 时显示标签。 | `布尔值` |
| `constraints.label.color` | 标签文字颜色。 | `字符串` |
| `constraints.label.fontSize` | 标签文字大小。 | `数字` |
| `constraints.label.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `constraints.label.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `dsl` | MermaID-like sequence diagram source st环。 | `字符串` |
| `source` | dsl source st环的别名。 | `字符串` |
| `padding` | 内边距 around the sequence diagram。 | `数字 \| 对象` |
| `padding.top` | 顶部内边距。 | `数字` |
| `padding.right` | 右侧内边距。 | `数字` |
| `padding.bottom` | 底部内边距。 | `数字` |
| `padding.left` | 左侧内边距。 | `数字` |
| `headerHeight` | 高度 of the 参与者 header area。 | `数字` |
| `headerWidth` | 最小值 宽度 reserved for each 参与者 header。 | `数字` |
| `messageGap` | 垂直 间距 between 消息 行。 | `数字` |
| `selfLoopWidth` | 宽度 of self-loop 消息。 | `数字` |
| `selfLoopHeight` | 高度 of self-loop 消息。 | `数字` |
| `activationWidth` | 宽度 of activation bars。 | `数字` |
| `activationMargin` | 用于nested activations的水平 off集合。 | `数字` |
| `participantStyle` | 设置参与者头部样式。 | `对象` |
| `participantStyle.color` | 主颜色。 | `字符串` |
| `participantStyle.fill` | 填充颜色。 | `字符串` |
| `participantStyle.opacity` | 透明度。 | `数字` |
| `participantStyle.borderColor` | 边框颜色。 | `字符串` |
| `participantStyle.borderWidth` | 边框宽度。 | `数字` |
| `participantStyle.borderRadius` | 圆角半径。 | `数字` |
| `lifelineStyle` | 设置参与者生命线样式。 | `对象` |
| `lifelineStyle.color` | 主颜色。 | `字符串` |
| `lifelineStyle.stroke` | 描边颜色。 | `字符串` |
| `lifelineStyle.width` | 宽度值。 | `数字` |
| `lifelineStyle.lineWidth` | 线宽。 | `数字` |
| `lifelineStyle.opacity` | 透明度。 | `数字` |
| `lifelineStyle.type` | 线条或图元类型。 | `'solid' \| 'dashed' \| 'dotted' \| 数字[]` |
| `activationStyle` | 设置激活条样式。 | `对象` |
| `activationStyle.color` | 主颜色。 | `字符串` |
| `activationStyle.opacity` | 透明度。 | `数字` |
| `activationStyle.borderColor` | 边框颜色。 | `字符串` |
| `activationStyle.borderWidth` | 边框宽度。 | `数字` |
| `activationStyle.shadowBlur` | 阴影模糊半径。 | `数字` |
| `activationStyle.shadowColor` | 阴影颜色。 | `字符串` |
| `noteStyle` | 设置notes样式。 | `对象` |
| `noteStyle.color` | 主颜色。 | `字符串` |
| `noteStyle.fill` | 填充颜色。 | `字符串` |
| `noteStyle.opacity` | 透明度。 | `数字` |
| `noteStyle.borderColor` | 边框颜色。 | `字符串` |
| `noteStyle.borderWidth` | 边框宽度。 | `数字` |
| `noteStyle.borderRadius` | 圆角半径。 | `数字` |
| `fragmentStyle` | 设置片段样式。 | `对象` |
| `fragmentStyle.color` | 主颜色。 | `字符串` |
| `fragmentStyle.fill` | 填充颜色。 | `字符串` |
| `fragmentStyle.opacity` | 透明度。 | `数字` |
| `fragmentStyle.borderColor` | 边框颜色。 | `字符串` |
| `fragmentStyle.borderWidth` | 边框宽度。 | `数字` |
| `fragmentStyle.borderRadius` | 圆角半径。 | `数字` |
| `constraintStyle` | 设置时序和持续时间约束样式。 | `对象` |
| `constraintStyle.color` | 主颜色。 | `字符串` |
| `constraintStyle.stroke` | 描边颜色。 | `字符串` |
| `constraintStyle.width` | 宽度值。 | `数字` |
| `constraintStyle.lineWidth` | 线宽。 | `数字` |
| `constraintStyle.opacity` | 透明度。 | `数字` |
| `constraintStyle.type` | 线条或图元类型。 | `'solid' \| 'dashed' \| 'dotted' \| 数字[]` |
| `lineStyle` | 设置消息 线样式。 | `对象` |
| `lineStyle.color` | 主颜色。 | `字符串` |
| `lineStyle.stroke` | 描边颜色。 | `字符串` |
| `lineStyle.width` | 宽度值。 | `数字` |
| `lineStyle.lineWidth` | 线宽。 | `数字` |
| `lineStyle.opacity` | 透明度。 | `数字` |
| `lineStyle.type` | 线条或图元类型。 | `'solid' \| 'dashed' \| 'dotted' \| 数字[]` |
| `label` | 设置消息标签样式。 | `对象` |
| `label.show` | 为 true 时显示标签。 | `布尔值` |
| `label.color` | 标签文字颜色。 | `字符串` |
| `label.fontSize` | 标签文字大小。 | `数字` |
| `label.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `label.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `participantLabel` | 设置参与者标签样式。 | `对象` |
| `participantLabel.show` | 为 true 时显示标签。 | `布尔值` |
| `participantLabel.color` | 标签文字颜色。 | `字符串` |
| `participantLabel.fontSize` | 标签文字大小。 | `数字` |
| `participantLabel.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `participantLabel.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `emphasis` | 设置diagram elements while 悬停时样式。 | `对象` |
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
