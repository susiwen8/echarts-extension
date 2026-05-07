# echarts-mosaic

ECharts extension chart for categorical mosaic plots. Import this package for side effects to register `series.type = 'mosaic'`.

## Install

```bash
npm install echarts echarts-mosaic
```

## Basic Usage

```js
import * as echarts from 'echarts';
import 'echarts-mosaic';

const chart = echarts.init(document.getElementById('main'));

chart.setOption({
  series: [
    {
      type: 'mosaic',
      xField: 'device',
      yField: 'browser',
      valueField: 'users',
      data: [
        { device: 'Desktop', browser: 'Chrome', users: 50 },
        { device: 'Desktop', browser: 'Safari', users: 10 },
        { device: 'Mobile', browser: 'Chrome', users: 35 },
        { device: 'Mobile', browser: 'Safari', users: 30 }
      ],
      gap: 2,
      label: {
        show: true,
        formatter: '{x}\n{y}: {c}'
      }
    }
  ]
});
```

## Data

Use objects or array rows:

- `xField` controls column groups.
- `yField` controls vertical splits inside each column.
- `valueField` controls area.
- Use `xCategories` and `yCategories` to force category order.
- Set `dimensions` when using array rows.

## Useful Options

- `padding` and `gap`: spacing controls.
- `sort`: `value`, `name`, `none`, `true`, or `false`.
- `colors`, `itemStyle`, `label`, `emphasis`: presentation controls.
- Label formatter params include `xCategory`, `yCategory`, `value`, `percent`, and `columnPercent`.

## Browser Build

After building this package, load ECharts first and then the bundle:

```html
<script src="../../node_modules/echarts/dist/echarts.min.js"></script>
<script src="../dist/echarts-mosaic.js"></script>
```

See `examples/index.html` and `examples/large.html` for runnable demos.

## Local Development

From the repository root:

```bash
npm --workspace echarts-mosaic run build:ts
npm --workspace echarts-mosaic run test:unit
npm --workspace echarts-mosaic run build
```
