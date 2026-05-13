# @echarts-extension/pack-bubble

Language: English | [中文](./README_CN.md)

ECharts extension chart for flat packed bubble diagrams. Import this package for side effects to register `series.type = 'packBubble'`.

![Pack Bubble chart](../../docs/packages/echarts-pack-bubble/screenshot.png)

## Install

```bash
npm install echarts @echarts-extension/pack-bubble
```

## Basic Usage

```js
import * as echarts from 'echarts';
import '@echarts-extension/pack-bubble';

const chart = echarts.init(document.getElementById('main'));

chart.setOption({
  series: [
    {
      type: 'packBubble',
      data: [
        { name: 'China', value: 1412, region: 'Asia' },
        { name: 'India', value: 1408, region: 'Asia' },
        { name: 'USA', value: 335, region: 'North America' },
        { name: 'Indonesia', value: 281, region: 'Asia' }
      ],
      categoryField: 'region',
      gap: 2,
      maxRadius: 76,
      fillRatio: 0.72,
      label: { show: true, minRadius: 28 }
    }
  ]
});
```

## Data

Use an array of objects:

- `valueField` defaults to `value` and controls circle radius.
- `nameField` defaults to `name` and controls labels.
- `categoryField` groups colors when provided.
- Use item-level `itemStyle` or `label` to override individual bubbles.

## Useful Options

- `padding`, `gap`, `center`: layout spacing.
- `minRadius`, `maxRadius`, `fillRatio`: bubble sizing and packing density.
- `sort`: `asc`, `desc`, `none`, `true`, or `false`.
- `colors`, `itemStyle`, `label`, `emphasis`, `enterAnimation`: presentation controls.
- `layout` or `layoutOptions` can hold the same layout settings.
