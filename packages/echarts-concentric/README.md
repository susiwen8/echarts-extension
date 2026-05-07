# echarts-concentric

ECharts extension chart using a custom concentric graph layout. Import this package for side effects to register `series.type = 'concentric'`.

## Install

```bash
npm install echarts echarts-concentric
```

## Basic Usage

```js
import * as echarts from 'echarts';
import 'echarts-concentric';

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

## Browser Build

After building this package, load ECharts first and then the bundle:

```html
<script src="../../node_modules/echarts/dist/echarts.min.js"></script>
<script src="../dist/echarts-concentric.js"></script>
```

See `examples/index.html` for a runnable demo.

## Local Development

From the repository root:

```bash
npm --workspace echarts-concentric run build:ts
npm --workspace echarts-concentric run build
```
