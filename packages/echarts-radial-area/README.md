# echarts-radial-area

ECharts extension chart for radial area and radial range-area time series. Import this package for side effects to register `series.type = 'radialArea'`.

## Install

```bash
npm install echarts echarts-radial-area
```

## Basic Usage

```js
import * as echarts from 'echarts';
import 'echarts-radial-area';

const chart = echarts.init(document.getElementById('main'));

chart.setOption({
  series: [
    {
      type: 'radialArea',
      angleField: 'date',
      angleType: 'time',
      valueField: 'avg',
      minField: 'min',
      maxField: 'max',
      innerRadius: '34%',
      outerRadius: '88%',
      data: [
        { date: '2026-01-01', min: 22, avg: 28, max: 34 },
        { date: '2026-02-01', min: 24, avg: 31, max: 39 },
        { date: '2026-03-01', min: 27, avg: 36, max: 44 }
      ],
      rangeAreaStyle: { color: '#c9dceb', opacity: 0.82 },
      lineStyle: { color: '#3f86bd', width: 2 },
      showSymbol: true
    }
  ]
});
```

## Data

Use objects or array rows:

- `angleField` provides the category, time, or numeric angle value.
- `valueField` draws the main line.
- `minField` and `maxField` draw the range area. Omit them for a simple radial area.
- Set `dimensions` when using array rows.

## Useful Options

- `angleType`: `category`, `time`, or `value`.
- `innerRadius`, `outerRadius`, `center`, `startAngle`, `endAngle`, `clockwise`: polar layout controls.
- `min`, `max`, `tickCount`, `nice`: radial value-axis controls.
- `grid`, `radialAxis`, `angleAxis`: axis and guide-line controls.
- `rangeAreaStyle`, `areaStyle`, `lineStyle`, `itemStyle`, `showSymbol`, `symbolSize`: series styling.

## Browser Build

After building this package, load ECharts first and then the bundle:

```html
<script src="../../node_modules/echarts/dist/echarts.min.js"></script>
<script src="../dist/echarts-radial-area.js"></script>
```

See `examples/index.html` and `examples/large.html` for runnable demos.

## Local Development

From the repository root:

```bash
npm --workspace echarts-radial-area run build:ts
npm --workspace echarts-radial-area run test:unit
npm --workspace echarts-radial-area run build
```
