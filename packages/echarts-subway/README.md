# @echarts-extension/subway

Language: English | [中文](./README_CN.md)

ECharts extension chart for schematic subway route maps. Import this package for side effects to register `series.type = 'subway'`.

![Subway chart](../../docs/packages/echarts-subway/screenshot.png)

## Install

```bash
npm install echarts @echarts-extension/subway
```

## Basic Usage

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

## Data

`data` is an array of routes:

- Each route can define `id`, `name`, `color`, `stations`, and optional `waypoints`.
- Stations can be objects with `coord`, `x`/`y`, or tuple rows.
- Stations with the same `id` across routes become interchanges.
- Use `status: 'planned'` or `status: 'construction'` on a route to draw the whole line as dashed.
- Use `segments` with `from`/`to` station ids to style only an extension segment, even when waypoints sit between those stations.
- This chart is schematic; it does not require a map coordinate system or base map.

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

## Useful Options

- `padding`, `preserveAspectRatio`: viewport behavior.
- `lineWidth`, `stationRadius`, `interchangeRadius`, `cornerRadius`: geometry controls.
- `colors`, `lineStyle`, `stationStyle`, `interchangeStyle`: styling.
- `lineStyle.type`, `lineStyle.dashArray`, `lineStyle.dashOffset`: dashed or dotted route styling.
- `label` and `routeLabel`: station and route text.
- `routes` can be used as an alias for `data`.
