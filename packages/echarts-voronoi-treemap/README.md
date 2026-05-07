# echarts-voronoi-treemap

ECharts extension chart for weighted Voronoi treemaps. Import this package for side effects to register `series.type = 'voronoiTreemap'`.

## Install

```bash
npm install echarts echarts-voronoi-treemap
```

## Basic Usage

```js
import * as echarts from 'echarts';
import 'echarts-voronoi-treemap';

const chart = echarts.init(document.getElementById('main'));

chart.setOption({
  series: [
    {
      type: 'voronoiTreemap',
      data: {
        name: 'Portfolio',
        children: [
          { name: 'Core', children: [{ name: 'Search', value: 48 }, { name: 'Ads', value: 32 }] },
          { name: 'Growth', children: [{ name: 'Cloud', value: 34 }, { name: 'AI', value: 26 }] }
        ]
      },
      gap: 2,
      maxIteration: 18,
      label: { show: true, showInternal: false }
    }
  ]
});
```

## Data

Use one root object, an array of roots, or array rows:

- Hierarchies use `children` by default.
- Flat array rows can use `dimensions`, `nameField`, and `valueField`.
- `childrenField`, `nameField`, and `valueField` support custom shapes.
- Set `rootVisible: false` to hide a synthetic root.

## Useful Options

- `padding` and `gap`: polygon spacing.
- `rootName`, `rootVisible`: root behavior.
- `sort`: `value`, `name`, `none`, `true`, or `false`.
- `maxIteration`: local Voronoi relaxation iteration count.
- `colors`, `itemStyle`, `label`, `emphasis`: presentation controls.
- Label formatter params include `name`, `value`, `percent`, `depth`, `isLeaf`, and `parentId`.

## Browser Build

After building this package, load ECharts first and then the bundle:

```html
<script src="../../node_modules/echarts/dist/echarts.min.js"></script>
<script src="../dist/echarts-voronoi-treemap.js"></script>
```

See `examples/index.html` and `examples/large.html` for runnable demos.

## Local Development

From the repository root:

```bash
npm --workspace echarts-voronoi-treemap run build:ts
npm --workspace echarts-voronoi-treemap run test:unit
npm --workspace echarts-voronoi-treemap run build
```
