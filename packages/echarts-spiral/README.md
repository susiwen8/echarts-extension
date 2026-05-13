# @echarts-extension/spiral

Language: English | [中文](./README_CN.md)

ECharts extension chart for segmented spiral heatmaps. Import this package for side effects to register `series.type = 'spiral'`.

![Spiral chart](../../docs/packages/echarts-spiral/screenshot.png)

## Install

```bash
npm install echarts @echarts-extension/spiral
```

## Basic Usage

```js
import * as echarts from 'echarts';
import '@echarts-extension/spiral';

const chart = echarts.init(document.getElementById('main'));

chart.setOption({
  series: [
    {
      type: 'spiral',
      data: [
        { name: 'Acquire', value: 42 },
        { name: 'Activate', value: 58 },
        { name: 'Retain', value: 36 },
        { name: 'Refer', value: 24 },
        { name: 'Revenue', value: 51 }
      ],
      turns: 2,
      segmentsPerTurn: 3,
      innerRadius: 28,
      outerRadius: '84%',
      gapAngle: 3,
      label: { show: true, position: 'outside' }
    }
  ]
});
```

## Data

Use objects or array rows:

- Object rows read `nameField` and `valueField`.
- Array rows can be paired with `dimensions`, for example `dimensions: ['name', 'value']`.
- Values control segment color/opacity and can be bounded with `min` and `max`.

## Useful Options

- `turns`: requested number of spiral turns.
- `segmentsPerTurn`: number of segments per ring.
- `innerRadius`, `outerRadius`, `center`, `padding`: geometry controls.
- `startAngle`, `clockwise`, `gapAngle`, `radialGap`, `bandWidth`: segment shape controls.
- `sort`: `asc`, `desc`, `none`, or `false`.
- `minOpacity`, `maxOpacity`, `itemStyle`, `label`, `enterAnimation`: presentation controls.
