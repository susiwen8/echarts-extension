# @echarts-extension/spiral

语言：[English](./README.md) | 中文

ECharts 分段螺旋热力图扩展。导入本包即可注册 `series.type = 'spiral'`。

![Spiral 图表截图](../../docs/packages/echarts-spiral/screenshot.png)

## 安装

```bash
npm install echarts @echarts-extension/spiral
```

## 基础用法

```js
import * as echarts from 'echarts';
import '@echarts-extension/spiral';

const chart = echarts.init(document.getElementById('main'));

chart.setOption({
  series: [
    {
      type: 'spiral',
      data: [
        { name: 'Acquire', value: 42 },
        { name: 'Activate', value: 58 },
        { name: 'Retain', value: 36 },
        { name: 'Refer', value: 24 },
        { name: 'Revenue', value: 51 }
      ],
      turns: 2,
      segmentsPerTurn: 3,
      innerRadius: 28,
      outerRadius: '84%',
      gapAngle: 3,
      label: { show: true, position: 'outside' }
    }
  ]
});
```

## 数据

可以使用对象或数组行：

- 对象行读取 `nameField` 和 `valueField`。
- 数组行可以配合 `dimensions`，例如 `dimensions: ['name', 'value']`。
- 数值控制分段颜色和透明度，并可通过 `min` 和 `max` 限定范围。

## 常用选项

- `turns`：期望的螺旋圈数。
- `segmentsPerTurn`：每圈的分段数量。
- `innerRadius`, `outerRadius`, `center`, `padding`：几何设置。
- `startAngle`, `clockwise`, `gapAngle`, `radialGap`, `bandWidth`：分段形状设置。
- `sort`：`asc`, `desc`, `none`, or `false`.
- `minOpacity`, `maxOpacity`, `itemStyle`, `label`, `enterAnimation`：展示样式。
