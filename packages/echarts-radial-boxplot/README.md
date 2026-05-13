# @echarts-extension/radial-boxplot

Language: English | [中文](./README_CN.md)

ECharts extension chart for radial boxplots. Import this package for side effects to register `series.type = 'radialBoxplot'`.

![Radial Boxplot chart](../../docs/packages/echarts-radial-boxplot/screenshot.png)

## Install

```bash
npm install echarts @echarts-extension/radial-boxplot
```

## Basic Usage

```js
import * as echarts from 'echarts';
import '@echarts-extension/radial-boxplot';

const chart = echarts.init(document.getElementById('main'));

chart.setOption({
  series: [
    {
      type: 'radialBoxplot',
      categoryField: 'name',
      min: 0,
      max: 32,
      innerRadius: '18%',
      outerRadius: '82%',
      boxWidth: 0.58,
      capWidth: 0.34,
      data: [
        { name: 'Oceania', min: 1, q1: 8, median: 13, q3: 21, max: 24 },
        { name: 'East Europe', min: 4, q1: 9, median: 12, q3: 15, max: 19 },
        { name: 'Australia', min: 8, q1: 13, median: 16, q3: 20, max: 26 }
      ]
    }
  ]
});
```

## Data

Use objects or array rows:

- `categoryField` or `nameField` identifies each angular slot.
- `minField`, `q1Field`, `medianField`, `q3Field`, and `maxField` can map custom field names.
- Default object fields are `min`, `q1`, `median`, `q3`, and `max`.
- Set `dimensions` when using array rows.

## Useful Options

- `innerRadius`, `outerRadius`, `center`, `startAngle`, `endAngle`, `clockwise`: polar layout controls.
- `min`, `max`, `tickCount`, `nice`: radial value-axis controls.
- `boxWidth`, `capWidth`, `labelRadius`: mark geometry controls.
- `grid`, `radialAxis`, `angleAxis`: axis and guide-line controls.
- `itemStyle`, `whiskerLineStyle`, `medianLineStyle`, `capLineStyle`: series styling.
