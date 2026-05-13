# @echarts-extension/subway

语言：[English](./README.md) | 中文

ECharts 示意地铁线路图扩展。导入本包即可注册 `series.type = 'subway'`。

![Subway 图表截图](../../visual-baseline/echarts-subway.png)

## 安装

```bash
npm install echarts @echarts-extension/subway
```

## 基础用法

```js
import * as echarts from 'echarts';
import '@echarts-extension/subway';

const chart = echarts.init(document.getElementById('main'));

chart.setOption({
  series: [
    {
      type: 'subway',
      lineWidth: 9,
      stationRadius: 4,
      interchangeRadius: 8,
      data: [
        {
          id: 'line1',
          name: 'Line 1',
          color: '#d51f2a',
          stations: [
            { id: 'a', name: 'Alpha', coord: [0, 120] },
            { id: 'central', name: 'Central', coord: [80, 70] },
            { id: 'east', name: 'East', coord: [180, 70] }
          ]
        },
        {
          id: 'line2',
          name: 'Line 2',
          color: '#f5a623',
          stations: [
            { id: 'north', name: 'North', coord: [20, 0] },
            { id: 'central', name: 'Central', coord: [80, 70] },
            { id: 'south', name: 'South', coord: [160, 150] }
          ]
        }
      ],
      label: { show: true },
      routeLabel: { show: true }
    }
  ]
});
```

## 数据

`data` 是线路数组：

- 每条线路可以定义 `id`、`name`、`color`、`stations` 和可选的 `waypoints`。
- 站点可以是带 `coord`、`x`/`y` 的对象，也可以是元组行。
- 不同线路中拥有相同 `id` 的站点会成为换乘站。
- 在线路上使用 `status: 'planned'` 或 `status: 'construction'` 可将整条线路绘制为虚线。
- 使用带 `from`/`to` 站点 id 的 `segments` 可只为某一延伸段设置样式，即使这些站点之间还有途经点。
- 该图表是示意图，不需要地图坐标系或底图。

```js
{
  id: 'line1',
  name: 'Line 1',
  stations: [
    { id: 'central', name: 'Central', coord: [0, 0] },
    { id: 'east', name: 'East', coord: [80, 0] },
    { id: 'future', name: 'Future', coord: [140, 40] }
  ],
  waypoints: [
    ['central', 0, 0],
    ['east', 80, 0],
    [120, 0],
    ['future', 140, 40]
  ],
  segments: [
    { from: 'east', to: 'future', status: 'construction' }
  ]
}
```

## 常用选项

- `padding`, `preserveAspectRatio`：视口行为。
- `lineWidth`, `stationRadius`, `interchangeRadius`, `cornerRadius`：几何设置。
- `colors`, `lineStyle`, `stationStyle`, `interchangeStyle`：样式设置。
- `lineStyle.type`, `lineStyle.dashArray`, `lineStyle.dashOffset`：虚线或点线路样式设置。
- `label` and `routeLabel`：站点和线路文字。
- `routes` 可以作为 `data` 的别名。

## 配置项

<!-- OPTIONS:START -->
此表由 `scripts/sync-options-from-readmes.mjs --write-readmes` 生成。更新英文 README 的配置表后，运行 `npm run docs:sync-options` 可刷新文档页。

| 配置项 | 说明 | 可选值 |
| --- | --- | --- |
| `type` | 向 ECharts 注册该包的系列类型。 | `'subway'` |
| `silent` | 为 true 时禁用mouse events for the 系列。 | `布尔值` |
| `width` | 系列区域宽度。 | `数字 \| 字符串 (像素或百分比)` |
| `height` | 系列区域高度。 | `数字 \| 字符串 (像素或百分比)` |
| `top` | 距离图表容器顶部的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `right` | 距离图表容器右侧的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `bottom` | 距离图表容器底部的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `left` | 距离图表容器左侧的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `data` | 地铁线路记录。Each route can include stations, segments, and way点。 | `数组<对象>` |
| `data.id` | 记录 ID。 | `字符串 \| 数字` |
| `data.name` | 显示名称。 | `字符串` |
| `data.color` | 颜色字段。 | `字符串` |
| `data.stations` | 线路站点记录。 | `数组<对象>` |
| `data.stations.id` | 记录 ID。 | `字符串 \| 数字` |
| `data.stations.name` | 显示名称。 | `字符串` |
| `data.stations.coord` | coord字段。 | `[数字, 数字]` |
| `data.stations.labelPosition` | 标签 position字段。 | `字符串` |
| `data.stations.interchange` | interchange字段。 | `布尔值` |
| `data.stations.itemStyle` | 单条记录的图元样式。 | `对象` |
| `data.stations.itemStyle.color` | 填充颜色。 | `字符串` |
| `data.stations.itemStyle.fill` | 填充颜色的别名。 | `字符串` |
| `data.stations.itemStyle.opacity` | 填充透明度。 | `数字` |
| `data.stations.itemStyle.borderColor` | 边框颜色。 | `字符串` |
| `data.stations.itemStyle.borderWidth` | 边框宽度。 | `数字` |
| `data.stations.itemStyle.borderRadius` | 圆角半径。 | `数字` |
| `data.stations.itemStyle.shadowBlur` | 阴影模糊半径。 | `数字` |
| `data.stations.itemStyle.shadowColor` | 阴影颜色。 | `字符串` |
| `data.stations.itemStyle.lineWidth` | icon or shape 样式使用的Stroke 宽度。 | `数字` |
| `data.stations.label` | 单条记录的标签样式。 | `对象` |
| `data.stations.label.show` | 为 true 时显示标签。 | `布尔值` |
| `data.stations.label.color` | 标签文字颜色。 | `字符串` |
| `data.stations.label.fontSize` | 标签文字大小。 | `数字` |
| `data.stations.label.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `data.stations.label.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `data.segments` | 线路片段记录。 | `数组<对象>` |
| `data.segments.from` | 源参与者或项目 ID。 | `字符串 \| 数字` |
| `data.segments.to` | 目标参与者或项目 ID。 | `字符串 \| 数字` |
| `data.segments.status` | status字段。 | `字符串` |
| `data.segments.lineStyle` | 线 样式字段。 | `对象` |
| `data.segments.lineStyle.show` | 为 true 时显示线 group。 | `布尔值` |
| `data.segments.lineStyle.color` | 线条颜色。 | `字符串` |
| `data.segments.lineStyle.stroke` | 线条颜色的别名。 | `字符串` |
| `data.segments.lineStyle.width` | 线宽。 | `数字` |
| `data.segments.lineStyle.lineWidth` | 线宽的别名。 | `数字` |
| `data.segments.lineStyle.opacity` | 线条透明度。 | `数字` |
| `data.segments.lineStyle.type` | 线条虚线样式。 | `'solid' \| 'dashed' \| 'dotted' \| 数字[] \| 字符串` |
| `data.segments.lineStyle.dashOffset` | 虚线偏移量。 | `数字` |
| `data.segments.lineStyle.lineDashOffset` | 虚线偏移量的别名。 | `数字` |
| `data.segments.lineStyle.cornerRadius` | 折线路径圆角半径。 | `数字` |
| `data.segments.lineStyle.cap` | 线帽样式。 | `'round' \| 'butt' \| 'square'` |
| `data.segments.lineStyle.join` | 线连接样式。 | `'round' \| 'bevel' \| 'miter'` |
| `data.segments.lineStyle.dashArray` | 虚线模式。 | `数字[] \| 字符串` |
| `data.segments.lineStyle.lineDash` | 虚线模式别名。 | `数字[]` |
| `data.waypoints` | 线路路径点记录。 | `数组<对象>` |
| `data.waypoints.id` | 记录 ID。 | `字符串 \| 数字` |
| `data.waypoints.x` | X 坐标或分类。 | `数字` |
| `data.waypoints.y` | Y 坐标或分类。 | `数字` |
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
| `routes` | route 记录的别名。 | `数组<对象>` |
| `routes.id` | 记录 ID。 | `字符串 \| 数字` |
| `routes.name` | 显示名称。 | `字符串` |
| `routes.color` | 颜色字段。 | `字符串` |
| `routes.stations` | 线路站点记录。 | `数组<对象>` |
| `routes.stations.id` | 记录 ID。 | `字符串 \| 数字` |
| `routes.stations.name` | 显示名称。 | `字符串` |
| `routes.stations.coord` | coord字段。 | `[数字, 数字]` |
| `routes.stations.labelPosition` | 标签 position字段。 | `字符串` |
| `routes.stations.interchange` | interchange字段。 | `布尔值` |
| `routes.stations.itemStyle` | 单条记录的图元样式。 | `对象` |
| `routes.stations.itemStyle.color` | 填充颜色。 | `字符串` |
| `routes.stations.itemStyle.fill` | 填充颜色的别名。 | `字符串` |
| `routes.stations.itemStyle.opacity` | 填充透明度。 | `数字` |
| `routes.stations.itemStyle.borderColor` | 边框颜色。 | `字符串` |
| `routes.stations.itemStyle.borderWidth` | 边框宽度。 | `数字` |
| `routes.stations.itemStyle.borderRadius` | 圆角半径。 | `数字` |
| `routes.stations.itemStyle.shadowBlur` | 阴影模糊半径。 | `数字` |
| `routes.stations.itemStyle.shadowColor` | 阴影颜色。 | `字符串` |
| `routes.stations.itemStyle.lineWidth` | icon or shape 样式使用的Stroke 宽度。 | `数字` |
| `routes.stations.label` | 单条记录的标签样式。 | `对象` |
| `routes.stations.label.show` | 为 true 时显示标签。 | `布尔值` |
| `routes.stations.label.color` | 标签文字颜色。 | `字符串` |
| `routes.stations.label.fontSize` | 标签文字大小。 | `数字` |
| `routes.stations.label.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `routes.stations.label.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `routes.segments` | 线路片段记录。 | `数组<对象>` |
| `routes.segments.from` | 源参与者或项目 ID。 | `字符串 \| 数字` |
| `routes.segments.to` | 目标参与者或项目 ID。 | `字符串 \| 数字` |
| `routes.segments.status` | status字段。 | `字符串` |
| `routes.segments.lineStyle` | 线 样式字段。 | `对象` |
| `routes.segments.lineStyle.show` | 为 true 时显示线 group。 | `布尔值` |
| `routes.segments.lineStyle.color` | 线条颜色。 | `字符串` |
| `routes.segments.lineStyle.stroke` | 线条颜色的别名。 | `字符串` |
| `routes.segments.lineStyle.width` | 线宽。 | `数字` |
| `routes.segments.lineStyle.lineWidth` | 线宽的别名。 | `数字` |
| `routes.segments.lineStyle.opacity` | 线条透明度。 | `数字` |
| `routes.segments.lineStyle.type` | 线条虚线样式。 | `'solid' \| 'dashed' \| 'dotted' \| 数字[] \| 字符串` |
| `routes.segments.lineStyle.dashOffset` | 虚线偏移量。 | `数字` |
| `routes.segments.lineStyle.lineDashOffset` | 虚线偏移量的别名。 | `数字` |
| `routes.segments.lineStyle.cornerRadius` | 折线路径圆角半径。 | `数字` |
| `routes.segments.lineStyle.cap` | 线帽样式。 | `'round' \| 'butt' \| 'square'` |
| `routes.segments.lineStyle.join` | 线连接样式。 | `'round' \| 'bevel' \| 'miter'` |
| `routes.segments.lineStyle.dashArray` | 虚线模式。 | `数字[] \| 字符串` |
| `routes.segments.lineStyle.lineDash` | 虚线模式别名。 | `数字[]` |
| `routes.waypoints` | 线路路径点记录。 | `数组<对象>` |
| `routes.waypoints.id` | 记录 ID。 | `字符串 \| 数字` |
| `routes.waypoints.x` | X 坐标或分类。 | `数字` |
| `routes.waypoints.y` | Y 坐标或分类。 | `数字` |
| `routes.lineStyle` | 线 样式字段。 | `对象` |
| `routes.lineStyle.show` | 为 true 时显示线 group。 | `布尔值` |
| `routes.lineStyle.color` | 线条颜色。 | `字符串` |
| `routes.lineStyle.stroke` | 线条颜色的别名。 | `字符串` |
| `routes.lineStyle.width` | 线宽。 | `数字` |
| `routes.lineStyle.lineWidth` | 线宽的别名。 | `数字` |
| `routes.lineStyle.opacity` | 线条透明度。 | `数字` |
| `routes.lineStyle.type` | 线条虚线样式。 | `'solid' \| 'dashed' \| 'dotted' \| 数字[] \| 字符串` |
| `routes.lineStyle.dashOffset` | 虚线偏移量。 | `数字` |
| `routes.lineStyle.lineDashOffset` | 虚线偏移量的别名。 | `数字` |
| `routes.lineStyle.cornerRadius` | 折线路径圆角半径。 | `数字` |
| `routes.lineStyle.cap` | 线帽样式。 | `'round' \| 'butt' \| 'square'` |
| `routes.lineStyle.join` | 线连接样式。 | `'round' \| 'bevel' \| 'miter'` |
| `routes.lineStyle.dashArray` | 虚线模式。 | `数字[] \| 字符串` |
| `routes.lineStyle.lineDash` | 虚线模式别名。 | `数字[]` |
| `routes.label` | 单条记录的标签样式。 | `对象` |
| `routes.label.show` | 为 true 时显示标签。 | `布尔值` |
| `routes.label.color` | 标签文字颜色。 | `字符串` |
| `routes.label.fontSize` | 标签文字大小。 | `数字` |
| `routes.label.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `routes.label.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `padding` | 地图周围的内边距。 | `数字` |
| `stationRadius` | 半径 for regular stations。 | `数字` |
| `interchangeRadius` | 半径 for interchange stations。 | `数字` |
| `lineWidth` | Default 宽度 for route 线。 | `数字` |
| `cornerRadius` | Default route corner 半径。 | `数字` |
| `preserveAspectRatio` | 保持station 坐标 from stretching differently on x and y。 | `布尔值` |
| `colors` | 用于routes的调色板。 | `字符串[]` |
| `lineStyle` | 设置线路线条样式。 | `对象` |
| `lineStyle.color` | 主颜色。 | `字符串` |
| `lineStyle.width` | 宽度值。 | `数字` |
| `lineStyle.opacity` | 透明度。 | `数字` |
| `lineStyle.cornerRadius` | 嵌套 corner半径 选项。 | `数字` |
| `lineStyle.cap` | 嵌套 cap 选项。 | `'round' \| 'butt' \| 'square'` |
| `lineStyle.join` | 嵌套 join 选项。 | `'round' \| 'bevel' \| 'miter'` |
| `lineStyle.type` | 线条或图元类型。 | `'solid' \| 'dashed' \| 'dotted' \| 数字[]` |
| `stationStyle` | 设置普通站点样式。 | `对象` |
| `stationStyle.color` | 主颜色。 | `字符串` |
| `stationStyle.opacity` | 透明度。 | `数字` |
| `stationStyle.borderColor` | 边框颜色。 | `字符串` |
| `stationStyle.borderWidth` | 边框宽度。 | `数字` |
| `stationStyle.shadowBlur` | 阴影模糊半径。 | `数字` |
| `stationStyle.shadowColor` | 阴影颜色。 | `字符串` |
| `interchangeStyle` | 设置换乘站样式。 | `对象` |
| `interchangeStyle.color` | 主颜色。 | `字符串` |
| `interchangeStyle.opacity` | 透明度。 | `数字` |
| `interchangeStyle.borderColor` | 边框颜色。 | `字符串` |
| `interchangeStyle.borderWidth` | 边框宽度。 | `数字` |
| `interchangeStyle.shadowBlur` | 阴影模糊半径。 | `数字` |
| `interchangeStyle.shadowColor` | 阴影颜色。 | `字符串` |
| `label` | 设置站点标签样式。 | `对象` |
| `label.show` | 为 true 时显示标签。 | `布尔值` |
| `label.color` | 标签文字颜色。 | `字符串` |
| `label.fontSize` | 标签文字大小。 | `数字` |
| `label.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `label.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `routeLabel` | 设置route 标签 at the route 开始 or 结束样式。 | `对象` |
| `routeLabel.show` | 为 true 时显示标签。 | `布尔值` |
| `routeLabel.position` | 标签位置。 | `字符串` |
| `routeLabel.color` | 标签文字颜色。 | `字符串` |
| `routeLabel.fontSize` | 标签文字大小。 | `数字` |
| `routeLabel.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `routeLabel.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `emphasis` | 设置stations or route elements while 悬停时样式。 | `对象` |
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
