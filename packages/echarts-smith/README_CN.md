# @echarts-extension/smith

语言：[English](./README.md) | 中文

ECharts Smith 圆图扩展。导入本包即可注册 `series.type = 'smith'`。

![Smith 图表截图](../../tests/browser-visual/__snapshots__/echarts-smith.png)

## 安装

```bash
npm install echarts @echarts-extension/smith
```

## 基础用法

```js
import * as echarts from 'echarts';
import '@echarts-extension/smith';

const chart = echarts.init(document.getElementById('main'));

chart.setOption({
  series: [
    {
      type: 'smith',
      referenceImpedance: 50,
      resistanceField: 'resistance',
      reactanceField: 'reactance',
      data: [
        { name: 'Matched', resistance: 50, reactance: 0 },
        { name: 'Inductive', resistance: 75, reactance: 25 },
        { name: 'Capacitive', resistance: 25, reactance: -20 }
      ],
      label: { show: true },
      showSwrCircle: true
    }
  ]
});
```

## 数据

默认情况下，数据行会作为阻抗值读取，并按 `referenceImpedance` 归一化。

- 对象行可以使用 `r`/`x`、`resistance`/`reactance` 或自定义字段。
- 数组行可以配合 `dimensions`。
- 设置 `dataType: 'gamma'` 时，可通过 `gamma`、`gammaReal` 和 `gammaImag` 提供反射系数值。

## 常用选项

- `referenceImpedance`：用于归一化电阻/电抗的阻抗。
- `resistanceValues`, `reactanceValues`：网格线取值。
- `showSwrCircle`, `swrMagnitude`, `swrIndex`：恒定 SWR 圆设置。
- `grid.label.resistanceFormatter`, `grid.label.reactanceFormatter`：可选标签模板，例如 `{ohms}` 和 `{ohms}j`。
- `cursor`：任意鼠标位置的交互读数，包括虚线 VSWR 圆、恒定电抗曲线以及阻抗/导纳提示。
- `grid`, `lineStyle`, `itemStyle`, `label`, `swrStyle`：展示样式。
