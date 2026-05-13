# @echarts-extension/radial

Language: English | [中文](./README_CN.md)

ECharts extension chart using a custom radial graph layout. Import this package for side effects to register `series.type = 'radial'`.

![Radial chart](../../tests/browser-visual/__snapshots__/echarts-radial.png)

## Install

```bash
npm install echarts @echarts-extension/radial
```

## Basic Usage

```js
import * as echarts from 'echarts';
import '@echarts-extension/radial';

const chart = echarts.init(document.getElementById('main'));

chart.setOption({
  series: [
    {
      type: 'radial',
      data: [
        { id: 'root', value: 10 },
        { id: 'a', value: 4 },
        { id: 'b', value: 3 },
        { id: 'c', value: 2 }
      ],
      links: [
        { source: 'root', target: 'a' },
        { source: 'root', target: 'b' },
        { source: 'a', target: 'c' }
      ],
      label: { show: true },
      layout: {
        focusNode: 'root',
        unitRadius: 90,
        linkDistance: 140,
        preventOverlap: true
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

- `layout.focusNode`: node id or name placed at the center. The first node is used by default.
- `layout.unitRadius`: radial distance between graph levels.
- `layout.linkDistance`: fallback edge length when levels are inferred.
- `layout.strictRadial`: keeps nodes on strict level rings.
- `layout.preventOverlap` and `layout.preventOverlapPadding`: separate crowded nodes.
