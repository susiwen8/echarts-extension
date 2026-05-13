# @echarts-extension/vector-field

语言：[English](./README.md) | 中文

ECharts 向量场和风场图扩展。导入本包即可注册 `series.type = 'vectorField'`。

![Vector Field 图表截图](../../tests/browser-visual/__snapshots__/echarts-vector-field.png)

## 安装

```bash
npm install echarts @echarts-extension/vector-field
```

## 基础用法

```js
import * as echarts from 'echarts';
import '@echarts-extension/vector-field';

const chart = echarts.init(document.getElementById('main'));

chart.setOption({
  series: [
    {
      type: 'vectorField',
      data: [
        { longitude: 0.125, latitude: 45.125, u: -2.32, v: -2.07 },
        { longitude: 0.375, latitude: 45.125, u: -2.41, v: -2.15 },
        { longitude: 0.125, latitude: 45.375, u: -2.15, v: -1.88 }
      ],
      xField: 'longitude',
      yField: 'latitude',
      uField: 'u',
      vField: 'v',
      samplingStep: 1,
      maxLength: 18,
      lineStyle: {
        color: '#1d4ed8',
        width: 1.15,
        opacity: 0.88
      }
    }
  ]
});
```

## 数据

可以使用对象或元组：

- 对象行读取 `xField`、`yField`、`uField` 和 `vField`。
- 默认字段为 `longitude`、`latitude`、`u` 和 `v`。
- 元组行为 `[x, y, u, v]`。
- 缺少数值坐标或向量的无效行会被跳过。

## 常用选项

- `xExtent`, `yExtent`：显式坐标边界。
- `invertY`：默认为 `true`，用于北向上的坐标渲染。
- `samplingStep`：密集网格中每隔 n 个向量渲染一次。
- `minLength`, `maxLength`, `lengthScale`：箭头长度设置。
- `arrowHeadLength`, `arrowHeadAngle`：箭头头部几何设置。
- `lineStyle`, `emphasis`, `enterAnimation`：展示样式。
