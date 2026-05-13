# @echarts-extension/concentric

Language: English | [中文](./README_CN.md)

ECharts extension chart using a custom concentric graph layout. Import this package for side effects to register `series.type = 'concentric'`.

![Concentric chart](../../docs/packages/echarts-concentric/screenshot.png)

## Install

```bash
npm install echarts @echarts-extension/concentric
```

## Basic Usage

```js
import * as echarts from 'echarts';
import '@echarts-extension/concentric';

const chart = echarts.init(document.getElementById('main'));

chart.setOption({
  series: [
    {
      type: 'concentric',
      data: [
        { id: 'hub', value: 20 },
        { id: 'ops', value: 8 },
        { id: 'sales', value: 6 },
        { id: 'support', value: 5 }
      ],
      links: [
        { source: 'hub', target: 'ops' },
        { source: 'hub', target: 'sales' },
        { source: 'hub', target: 'support' }
      ],
      label: { show: true },
      layout: {
        sortBy: 'degree',
        preventOverlap: true,
        nodeSpacing: 16
      }
    }
  ]
});
```

## Data

Use ECharts graph-style input:

- `data` or `nodes` for nodes.
- `links` or `edges` for connections.
- Each link uses `source` and `target`, matching a node `id` or `name`.
- When `symbolSize` is omitted, node size is inferred from numeric `value`.

## Useful Options

- `layout.sortBy`: field name or function used to order nodes into rings. `degree` is useful for hub-first layouts.
- `layout.equidistant`: keeps ring spacing even.
- `layout.startAngle`: rotates the first node position.
- `layout.clockwise`: set to `false` to place nodes counterclockwise.
- `layout.preventOverlap` and `layout.nodeSpacing`: keep symbols readable.
