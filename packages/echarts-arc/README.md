# @echarts-extension/arc

Language: English | [中文](./README_CN.md)

ECharts extension chart using a custom arc graph layout. Import this package for side effects to register `series.type = 'arc'`.

![Arc chart](../../tests/browser-visual/__snapshots__/echarts-arc.png)

## Install

```bash
npm install echarts @echarts-extension/arc
```

## Basic Usage

```js
import * as echarts from 'echarts';
import '@echarts-extension/arc';

const chart = echarts.init(document.getElementById('main'));

chart.setOption({
  series: [
    {
      type: 'arc',
      data: [
        { id: 'root', value: 10 },
        { id: 'a', value: 4 },
        { id: 'b', value: 3 }
      ],
      links: [
        { source: 'root', target: 'a' },
        { source: 'root', target: 'b' }
      ],
      label: { show: true },
      layout: {
        nodeSep: 58,
        nodeSize: 18,
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

- `layout.nodeSep`: horizontal spacing between arc nodes.
- `layout.nodeSize`: fixed node size, or a function that returns a size.
- `layout.begin`: starting point for the layout.
- `layout.preventOverlap`: nudges nodes apart when labels or symbols collide.
- `edgeAnimation`: `true` for default edge drawing animation, `false` to disable, or an object with `duration`, `delay`, `stagger`, and `easing`.
