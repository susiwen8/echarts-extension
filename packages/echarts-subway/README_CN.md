# @echarts-extension/subway

语言：[English](./README.md) | 中文

ECharts 示意地铁线路图扩展。导入本包即可注册 `series.type = 'subway'`。

![Subway 图表截图](../../docs/packages/echarts-subway/screenshot.png)

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
