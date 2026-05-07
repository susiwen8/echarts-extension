# echarts-beeswarm

ECharts extension chart for beeswarm plots. Import this package for side effects to register `series.type = 'beeswarm'`.

## Install

```bash
npm install echarts echarts-beeswarm
```

## Basic Usage

```js
import * as echarts from 'echarts';
import 'echarts-beeswarm';

const chart = echarts.init(document.getElementById('main'));

chart.setOption({
  series: [
    {
      type: 'beeswarm',
      data: [
        { team: 'Design', score: 62, name: 'D-01' },
        { team: 'Design', score: 64, name: 'D-02' },
        { team: 'Engineering', score: 71, name: 'E-01' },
        { team: 'Engineering', score: 72, name: 'E-02' }
      ],
      categoryField: 'team',
      valueField: 'score',
      nameField: 'name',
      categories: ['Design', 'Engineering'],
      symbolSize: 14,
      collisionPadding: 2,
      label: { show: true }
    }
  ]
});
```

## Data

Use objects or array rows:

- Object rows read `categoryField`, `valueField`, and optional `nameField`.
- Array rows can be paired with `dimensions`, for example `dimensions: ['team', 'score', 'name']`.
- Invalid rows without a numeric value are skipped.

## Useful Options

- `orient`: `horizontal` places values on the x axis; `vertical` places values on the y axis.
- `categories`: explicit category order.
- `min`, `max`, `tickCount`, `nice`: value-axis controls.
- `symbolSize`: circle diameter.
- `collisionPadding` and `swarmRadius`: tune overlap avoidance.
- `valueAxis`, `categoryAxis`, `grid`, `itemStyle`, `label`, `emphasis`: presentation controls.

## Browser Build

After building this package, load ECharts first and then the bundle:

```html
<script src="../../node_modules/echarts/dist/echarts.min.js"></script>
<script src="../dist/echarts-beeswarm.js"></script>
```

See `examples/index.html` and `examples/large.html` for runnable demos.

## Local Development

From the repository root:

```bash
npm --workspace echarts-beeswarm run build:ts
npm --workspace echarts-beeswarm run test:unit
npm --workspace echarts-beeswarm run build
```
