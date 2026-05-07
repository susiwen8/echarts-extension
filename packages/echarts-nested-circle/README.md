# echarts-nested-circle

ECharts extension chart for bottom-aligned nested circle diagrams. Import this package for side effects to register `series.type = 'nestedCircle'`.

## Install

```bash
npm install echarts echarts-nested-circle
```

## Basic Usage

```js
import * as echarts from 'echarts';
import 'echarts-nested-circle';

const chart = echarts.init(document.getElementById('main'));

chart.setOption({
  series: [
    {
      type: 'nestedCircle',
      data: [
        { name: 'Mathematics', children: ['Probability', 'Linear Algebra', 'Calculus'] },
        { name: 'Python', children: ['Pandas', 'NumPy', 'Scikit-Learn'] },
        { name: 'SQL', children: ['Joins', 'Window Functions', 'Optimization'] }
      ],
      centerRadiusRatio: 0.3,
      label: { show: true },
      titleLabel: { show: true }
    }
  ]
});
```

## Data

Use an ordered array of circle layers:

- Each item becomes one visible ring or circle.
- `name` is the layer title.
- `children` or `items` are labels rendered inside that layer.
- Child entries can be strings, numbers, or objects with `name`, `value`, and optional `label`.

## Useful Options

- `center`, `radius`, `padding`: viewport controls.
- `centerRadiusRatio`, `labelRadiusRatio`, `titleRadiusRatio`: text and ring placement.
- `minRingThickness`: protects readability for many layers.
- `colors`, `ringStyle`, `itemStyle`, `titleLabel`, `label`: presentation controls.

## Browser Build

After building this package, load ECharts first and then the bundle:

```html
<script src="../../node_modules/echarts/dist/echarts.min.js"></script>
<script src="../dist/echarts-nested-circle.js"></script>
```

See `examples/index.html` and `examples/large.html` for runnable demos.

## Local Development

From the repository root:

```bash
npm --workspace echarts-nested-circle run build:ts
npm --workspace echarts-nested-circle run test:unit
npm --workspace echarts-nested-circle run build
```
