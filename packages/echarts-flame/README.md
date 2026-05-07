# echarts-flame

ECharts extension chart for hierarchical flame graphs. Import this package for side effects to register `series.type = 'flame'`.

## Install

```bash
npm install echarts echarts-flame
```

## Basic Usage

```js
import * as echarts from 'echarts';
import 'echarts-flame';

const chart = echarts.init(document.getElementById('main'));

chart.setOption({
  series: [
    {
      type: 'flame',
      data: {
        name: 'root',
        children: [
          { name: 'render', value: 30, children: [{ name: 'diff', value: 18 }, { name: 'patch', value: 12 }] },
          { name: 'commit', value: 20 }
        ]
      },
      orient: 'up',
      rootVisible: false,
      gap: 1,
      label: { show: true, formatter: '{b}' }
    }
  ]
});
```

## Data

Use one root object or an array of roots:

- Nodes use `name`, optional `value`, and optional `children`.
- If a parent omits `value`, it is inferred from children.
- If a parent value is greater than the sum of children, the extra value is rendered as self time.
- Set `rootVisible: false` to hide the root frame.

## Useful Options

- `orient`: `up` renders children above parents; `down` renders children below.
- `padding` and `gap`: frame spacing.
- `rootName`, `rootVisible`: root behavior.
- `sort`: `value`, `name`, `none`, `true`, or `false`.
- `colors`, `itemStyle`, `label`, `emphasis`: presentation controls.

## Browser Build

After building this package, load ECharts first and then the bundle:

```html
<script src="../../node_modules/echarts/dist/echarts.min.js"></script>
<script src="../dist/echarts-flame.js"></script>
```

See `examples/index.html` and `examples/large.html` for runnable demos.

## Local Development

From the repository root:

```bash
npm --workspace echarts-flame run build:ts
npm --workspace echarts-flame run test:unit
npm --workspace echarts-flame run build
```
