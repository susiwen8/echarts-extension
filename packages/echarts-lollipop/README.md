# @echarts-extension/lollipop

Language: English | [中文](./README_CN.md)

ECharts extension chart for lollipop plots. Import this package for side effects to register `series.type = 'lollipop'`.

![Lollipop chart](../../tests/browser-visual/__snapshots__/echarts-lollipop.png)

## Install

```bash
npm install echarts @echarts-extension/lollipop
```

## Basic Usage

```js
import * as echarts from 'echarts';
import '@echarts-extension/lollipop';

const chart = echarts.init(document.getElementById('main'));

chart.setOption({
  series: [
    {
      type: 'lollipop',
      data: [
        { country: 'India', population: 1441 },
        { country: 'China', population: 1425 },
        { country: 'United States', population: 342 },
        { country: 'Indonesia', population: 278 }
      ],
      categoryField: 'country',
      valueField: 'population',
      baseline: 0,
      min: 0,
      max: 1600,
      symbolSize: 12,
      label: { show: true }
    }
  ]
});
```

## Data

Use objects or array rows:

- Object rows read `categoryField`, `valueField`, and optional `nameField`.
- Array rows can be paired with `dimensions`, for example `dimensions: ['country', 'population']`.
- Numeric values are drawn from the baseline to the symbol.

## Useful Options

- `categoryField`, `valueField`, `nameField`: map your data fields.
- `categories`: explicit category order.
- `baseline`: value where stems start.
- `min`, `max`, `tickCount`, `nice`: value-axis controls.
- `symbolSize`: lollipop head diameter.
- `stemStyle`, `itemStyle`, `label`, `valueAxis`, `categoryAxis`, `grid`: presentation controls.
