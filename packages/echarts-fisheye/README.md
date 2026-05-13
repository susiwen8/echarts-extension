# @echarts-extension/fisheye

Language: English | [中文](./README_CN.md)

Reusable fisheye magnifier component for ECharts. Import it once, then add a top-level `fisheye` option to any chart.

![Fisheye chart](../../docs/packages/echarts-fisheye/screenshot.png)

```js
import * as echarts from 'echarts';
import '@echarts-extension/fisheye';

const chart = echarts.init(document.getElementById('main'));
chart.setOption({
  fisheye: {
    show: true,
    radius: 140,
    scale: 2.4
  },
  xAxis: {},
  yAxis: {},
  series: [
    {
      type: 'scatter',
      data: [[1, 2], [2, 3], [3, 1]]
    }
  ]
});
```

The component listens to the chart's zrender pointer events and applies a temporary lens transform to display elements near the pointer. Set `show: false` or remove the component to disable it.
