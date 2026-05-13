# @echarts-extension/grid

Language: English | [中文](./README_CN.md)

ECharts extension chart using a deterministic grid graph layout. Import this package for side effects to register `series.type = 'grid'`.

![Grid chart](../../docs/packages/echarts-grid/screenshot.png)

## Install

```bash
npm install echarts @echarts-extension/grid
```

## Basic Usage

```js
import * as echarts from 'echarts';
import '@echarts-extension/grid';

const chart = echarts.init(document.getElementById('main'));

chart.setOption({
  series: [
    {
      type: 'grid',
      data: [
        { id: 'a', cluster: 'core', value: 8 },
        { id: 'b', cluster: 'core', value: 5 },
        { id: 'c', cluster: 'edge', value: 4 },
        { id: 'd', cluster: 'edge', value: 3 }
      ],
      links: [
        { source: 'a', target: 'b' },
        { source: 'a', target: 'c' }
      ],
      label: { show: true },
      layout: {
        cols: 2,
        preventOverlap: true,
        nodeSpacing: 10,
        sortBy: 'cluster'
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

- `layout.rows` and `layout.cols`: control the grid shape.
- `layout.begin`: starting point for the first cell.
- `layout.condense`: fills empty cells when explicit positions are sparse.
- `layout.position`: function returning `{ row, col }` for a node.
- `layout.sortBy`: field name or function. Field names can read nested data, such as `data.cluster`.
- `layout.preventOverlap` and `layout.nodeSpacing`: keep adjacent cells readable.
