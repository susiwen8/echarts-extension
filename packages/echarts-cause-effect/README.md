# @echarts-extension/cause-effect

Language: English | [中文](./README_CN.md)

Cause and effect (fishbone / Ishikawa) diagram extension for ECharts.

![Cause and Effect chart](../../docs/packages/echarts-cause-effect/screenshot.png)

```js
import * as echarts from 'echarts';
import '@echarts-extension/cause-effect';

chart.setOption({
  series: [
    {
      type: 'causeEffect',
      effect: 'Late delivery',
      categories: [
        {
          name: 'People',
          causes: [
            'handoff gaps',
            { name: 'unclear owner', children: ['no escalation path'] }
          ]
        },
        ['Process', 'manual approval', 'batch release'],
        ['Tools', 'slow build']
      ],
      label: { show: true }
    }
  ]
});
```

The series accepts `effect`, plus `categories`, `causes`, or `data` for the major fishbone branches. Each category can use `causes`, `items`, or `children`; nested cause children are laid out as secondary bones.
