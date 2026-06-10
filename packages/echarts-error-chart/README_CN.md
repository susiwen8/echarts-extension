# @echarts-extension/error-chart

ECharts 误差图扩展，可在柱状图、条形图、折线图和散点图上绘制上/下误差区间。导入本包即可注册 `series.type = 'errorChart'`。

![Error Chart 图表截图](../../visual-baseline/echarts-error-chart.png)

## 安装

```bash
npm install echarts @echarts-extension/error-chart
```

## 使用

```ts
import * as echarts from 'echarts';
import '@echarts-extension/error-chart';

const chart = echarts.init(document.getElementById('chart'));
chart.setOption({
  series: [
    {
      type: 'errorChart',
      variant: 'line',
      categoryField: 'month',
      valueField: 'duration',
      lowField: 'low',
      highField: 'high',
      data: [
        { month: 'Jan', duration: 28, low: 18, high: 40 },
        { month: 'Feb', duration: 54, lowerError: 10, upperError: 8 },
        { month: 'Mar', duration: 88, low: 76, high: 100 }
      ]
    }
  ]
});
```

散点误差图可以在两个数值轴上同时显示横向和纵向误差：

```ts
chart.setOption({
  title: {
    text: 'Prime Costs and Prices for ACME Fashion\nCollection "Spring-Summer, 2016"'
  },
  series: [
    {
      type: 'errorChart',
      variant: 'scatter',
      xField: 'cost',
      yField: 'price',
      xLowField: 'costLow',
      xHighField: 'costHigh',
      yLowField: 'priceLow',
      yHighField: 'priceHigh',
      data: [
        { name: 'A', cost: 120, price: 250, costLow: 105, costHigh: 132, priceLow: 220, priceHigh: 280 }
      ]
    }
  ]
});
```

## 配置项

<!-- OPTIONS:START -->
此表由 `scripts/sync-options-from-readmes.mjs --write-readmes` 生成。更新 README 的配置表后，运行 `npm run docs:sync-options` 可刷新静态文档页。

| 配置项 | 说明 | 可选值 |
| --- | --- | --- |
| `type` | 向 ECharts 注册该包的系列类型。 | `'errorChart'` |
| `variant` | 选择与误差区间一起绘制的图形形态。 | `'column' \| 'bar' \| 'line' \| 'scatter'` |
| `data` | 误差图数据。分类形态读取 category、value、low/high 或 lowerError/upperError；散点形态还会读取 x 和 x 方向误差字段。 | `Array<Object \| Array>` |
| `categoryField` | 分类形态使用的分类字段或数组下标。 | `string \| number` |
| `valueField` | 分类形态使用的数值字段或数组下标。 | `string \| number` |
| `lowField` | 分类形态的绝对下界字段，也可作为散点 y 下界兜底字段。 | `string \| number` |
| `highField` | 分类形态的绝对上界字段，也可作为散点 y 上界兜底字段。 | `string \| number` |
| `lowerErrorField` | 相对下误差值字段；没有绝对下界时使用。 | `string \| number` |
| `upperErrorField` | 相对上误差值字段；没有绝对上界时使用。 | `string \| number` |
| `xField` | 散点形态使用的 x 数值字段。 | `string \| number` |
| `yField` | 散点形态使用的 y 数值字段。 | `string \| number` |
| `xLowField` | 散点形态的绝对 x 下界字段。 | `string \| number` |
| `xHighField` | 散点形态的绝对 x 上界字段。 | `string \| number` |
| `xMinusField` | 相对 x 下误差值字段。 | `string \| number` |
| `xPlusField` | 相对 x 上误差值字段。 | `string \| number` |
| `yLowField` | 散点形态的绝对 y 下界字段。 | `string \| number` |
| `yHighField` | 散点形态的绝对 y 上界字段。 | `string \| number` |
| `categories` | 分类形态的显式分类顺序。 | `Array<string \| number>` |
| `padding` | 绘图区内边距。 | `number \| { top, right, bottom, left }` |
| `min` | 数值轴或 y 轴下界。 | `number` |
| `max` | 数值轴或 y 轴上界。 | `number` |
| `xMin` | 散点 x 轴下界。 | `number` |
| `xMax` | 散点 x 轴上界。 | `number` |
| `baseline` | 柱状和条形形态使用的基线。 | `number` |
| `tickCount` | 生成的数值刻度数量。 | `number` |
| `barWidth` | 柱宽或水平条形高度。 | `number` |
| `capWidth` | 误差线端帽宽度。 | `number` |
| `symbolSize` | 折线和散点形态的圆点大小。 | `number` |
| `valueAxis` | 设置数值轴、标签、分割线和轴名样式。 | `Object` |
| `xAxis` | 设置散点形态的 x 数值轴样式。 | `Object` |
| `categoryAxis` | 设置分类标签样式。 | `Object` |
| `lineStyle` | 设置折线形态的连线样式。 | `Object` |
| `errorBarStyle` | 设置误差区间线和端帽样式。 | `Object` |
| `itemStyle` | 设置柱形和点符号样式。 | `Object` |
| `label` | 可选数值标签，支持 `{b}`、`{c}`、`{category}`、`{lower}` 和 `{upper}` 字符串模板。 | `Object` |
<!-- OPTIONS:END -->
