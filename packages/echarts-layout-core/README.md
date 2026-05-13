# @echarts-extension/layout-core

Language: English | [中文](./README_CN.md)

Shared layout and rendering helpers for the ECharts extension packages in this monorepo. Most chart users do not import this package directly; use it when you are building a new extension or testing the local graph layouts.

![Layout Core chart](../../docs/packages/echarts-layout-core/screenshot.png)

## Install

```bash
npm install @echarts-extension/layout-core
```

If you are rendering through ECharts, install `echarts` in the host application as well.

## Compute a Layout

```js
import { computeGraphLayout } from '@echarts-extension/layout-core';

const result = computeGraphLayout('radial', {
  nodes: [
    { id: 'root', value: 10 },
    { id: 'a', value: 4 },
    { id: 'b', value: 3 }
  ],
  edges: [
    { source: 'root', target: 'a' },
    { source: 'root', target: 'b' }
  ]
}, {
  center: [300, 220],
  unitRadius: 90,
  nodeSize: 18
});

console.log(result.nodes);
```

`computeGraphLayout(type, input, options)` supports `arc`, `concentric`, `grid`, `mds`, and `radial`.

## Register a Graph Series

```js
import * as echarts from 'echarts/lib/echarts';
import { installGraphLayout } from '@echarts-extension/layout-core';

installGraphLayout(echarts, {
  chartType: 'customRadial',
  layoutType: 'radial'
});
```

The registered series accepts ECharts graph-style `data`/`links` or `nodes`/`edges` input and renders nodes, labels, and links with the shared graph view.

## Main Exports

- `normalizeGraphData`: normalizes graph-style input into nodes and edges.
- `computeGraphLayout`: dispatches to a named graph layout.
- `computeArcLayout`, `computeConcentricLayout`, `computeGridLayout`, `computeMDSLayout`, `computeRadialLayout`: layout-specific APIs.
- `installGraphLayout`: registers a graph-style ECharts series.
- `installFisheyeController`, `resolveFisheyeOptions`, `fisheyeTransform`: reusable fisheye magnifier primitives for chart packages.
- `installElementHover`, `renderAlive`, `clearAliveRender`, `setAliveRenderKey`: shared rendering helpers used by custom chart packages.
