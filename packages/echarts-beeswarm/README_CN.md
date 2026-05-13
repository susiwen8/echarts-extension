# @echarts-extension/beeswarm

语言：[English](./README.md) | 中文

ECharts 蜂群图扩展。导入本包即可注册 `series.type = 'beeswarm'`。

![Beeswarm 图表截图](../../tests/browser-visual/__snapshots__/echarts-beeswarm.png)

## 安装

```bash
npm install echarts @echarts-extension/beeswarm
```

## 基础用法

```js
import * as echarts from 'echarts';
import '@echarts-extension/beeswarm';

const chart = echarts.init(document.getElementById('main'));

chart.setOption({
  series: [
    {
      type: 'beeswarm',
      data: [
        { team: 'Design', score: 62, name: 'D-01' },
        { team: 'Design', score: 64, name: 'D-02' },
        { team: 'Engineering', score: 71, name: 'E-01' },
        { team: 'Engineering', score: 72, name: 'E-02' }
      ],
      categoryField: 'team',
      valueField: 'score',
      nameField: 'name',
      categories: ['Design', 'Engineering'],
      symbolSize: 14,
      collisionPadding: 2,
      label: { show: true }
    }
  ]
});
```

## 数据

可以使用对象或数组行：

- 对象行读取 `categoryField`、`valueField`，以及可选的 `nameField`。
- 数组行可以配合 `dimensions`，例如 `dimensions: ['team', 'score', 'name']`。
- 没有数值的无效行会被跳过。

## 常用选项

- `orient`：`horizontal` 将数值放在 x 轴，`vertical` 将数值放在 y 轴。
- `categories`：显式分类顺序。
- `min`, `max`, `tickCount`, `nice`：数值轴设置。
- `symbolSize`：圆直径。
- `collisionPadding` 和 `swarmRadius`：调节避让重叠的效果。
- `valueAxis`, `categoryAxis`, `grid`, `itemStyle`, `label`, `emphasis`：展示样式。
