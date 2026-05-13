# @echarts-extension/mosaic

Language: English | [中文](./README_CN.md)

ECharts extension chart for categorical mosaic plots. Import this package for side effects to register `series.type = 'mosaic'`.

![Mosaic chart](../../docs/packages/echarts-mosaic/screenshot.png)

## Install

```bash
npm install echarts @echarts-extension/mosaic
```

## Basic Usage

```js
import * as echarts from 'echarts';
import '@echarts-extension/mosaic';

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
