# @echarts-extension/organization-chart

Language: English | [中文](./README_CN.md)

ECharts extension chart for organization charts. Import this package for side effects to register `series.type = 'organizationChart'`.

![Organization Chart chart](../../tests/browser-visual/__snapshots__/echarts-organization-chart.png)

## Install

```bash
npm install echarts @echarts-extension/organization-chart
```

## Basic Usage

```js
import * as echarts from 'echarts';
import '@echarts-extension/organization-chart';

const chart = echarts.init(document.getElementById('main'));

chart.setOption({
  series: [
    {
      type: 'organizationChart',
      orient: 'TB',
      data: {
        name: 'CEO',
        children: [
          {
            name: 'Product',
            children: [{ name: 'Design' }, { name: 'Research' }]
          },
          {
            name: 'Engineering',
            children: [{ name: 'Frontend' }, { name: 'Platform' }]
          }
        ]
      },
      label: { show: true, formatter: '{b}' }
    }
  ]
});
```

## Data

Use one nested root, an array of nested roots, flat rows with `id` and `parentId`, or explicit `nodes` and `links`.

```js
{
  type: 'organizationChart',
  data: [
    { id: 'ceo', name: 'CEO' },
    { id: 'ops', parentId: 'ceo', name: 'Operations' },
    { id: 'finance', parentId: 'ceo', name: 'Finance' }
  ]
}
```

## Useful Options

- `orient`: `TB`, `BT`, `LR`, or `RL`.
- `nodeWidth`, `nodeHeight`, `levelGap`, `siblingGap`, and `subtreeGap`: layout geometry.
- `idField`, `parentIdField`, `nameField`, and `childrenField`: custom data field names.
- `itemStyle`, `lineStyle`, `label`, and `emphasis`: presentation controls.
