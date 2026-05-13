# @echarts-extension/nested-circle

Language: English | [中文](./README_CN.md)

ECharts extension chart for bottom-aligned nested circle diagrams. Import this package for side effects to register `series.type = 'nestedCircle'`.

![Nested Circle chart](../../tests/browser-visual/__snapshots__/echarts-nested-circle.png)

## Install

```bash
npm install echarts @echarts-extension/nested-circle
```

## Basic Usage

```js
import * as echarts from 'echarts';
import '@echarts-extension/nested-circle';

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
