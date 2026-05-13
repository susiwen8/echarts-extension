# @echarts-extension/radial-area

语言：[English](./README.md) | 中文

ECharts 径向面积图和径向区间面积时间序列扩展。导入本包即可注册 `series.type = 'radialArea'`。

![Radial Area 图表截图](../../docs/packages/echarts-radial-area/screenshot.png)

## 安装

```bash
npm install echarts @echarts-extension/radial-area
```

## 基础用法

```js
import * as echarts from 'echarts';
import '@echarts-extension/radial-area';

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

## 数据

可以使用对象或数组行：

- `angleField` 提供分类、时间或数值角度。
- `valueField` 绘制主线。
- `minField` and `maxField` 绘制区间面积。省略它们即可得到简单径向面积图。
- 使用数组行时请设置 `dimensions`。

## 常用选项

- `angleType`：`category`, `time`, or `value`.
- `innerRadius`, `outerRadius`, `center`, `startAngle`, `endAngle`, `clockwise`：极坐标布局设置。
- `min`, `max`, `tickCount`, `nice`：radial 数值轴设置。
- `grid`, `radialAxis`, `angleAxis`：坐标轴和辅助线设置。
- `rangeAreaStyle`, `areaStyle`, `lineStyle`, `itemStyle`, `showSymbol`, `symbolSize`：系列样式。
