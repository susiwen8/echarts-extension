# echarts-mds

ECharts extension chart using a custom multidimensional-scaling graph layout. Import this package for side effects to register `series.type = 'mds'`.

## Install

```bash
npm install echarts echarts-mds
```

## Basic Usage

```js
import * as echarts from 'echarts';
import 'echarts-mds';

const chart = echarts.init(document.getElementById('main'));

chart.setOption({
  series: [
    {
      type: 'mds',
      data: [
        { id: 'alpha', value: 10 },
        { id: 'beta', value: 8 },
        { id: 'gamma', value: 6 },
        { id: 'delta', value: 4 }
      ],
      links: [
        { source: 'alpha', target: 'beta' },
        { source: 'beta', target: 'gamma' },
        { source: 'gamma', target: 'delta' }
      ],
      label: { show: true },
      layout: {
        linkDistance: 120,
        maxIteration: 300,
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

- `layout.linkDistance`: target graph distance used by the MDS solver.
- `layout.maxIteration`: solver iteration limit.
- `layout.center`: center point of the final layout.
- `layout.preventOverlap`: nudges nodes apart after solving.
- `layout.preventOverlapPadding`: extra spacing used by overlap prevention.

## Browser Build

After building this package, load ECharts first and then the bundle:

```html
<script src="../../node_modules/echarts/dist/echarts.min.js"></script>
<script src="../dist/echarts-mds.js"></script>
```

See `examples/index.html` for a runnable demo.

## Local Development

From the repository root:

```bash
npm --workspace echarts-mds run build:ts
npm --workspace echarts-mds run build
```
