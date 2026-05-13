# @echarts-extension/venn

语言：[English](./README.md) | 中文

ECharts 空心和气泡维恩图扩展。导入本包即可注册 `series.type = 'venn'`。

| 空心维恩图 | 气泡维恩图 |
| --- | --- |
| ![空心维恩图截图](../../docs/packages/echarts-venn/hollow.png) | ![气泡维恩图截图](../../docs/packages/echarts-venn/bubble.png) |

## 安装

```bash
npm install echarts @echarts-extension/venn
```

## 空心维恩图

```js
import * as echarts from 'echarts';
import '@echarts-extension/venn';

const chart = echarts.init(document.getElementById('main'));

chart.setOption({
  series: [
    {
      type: 'venn',
      layout: 'hollow',
      data: [
        { name: 'A', sets: ['A'], value: 100 },
        { name: 'B', sets: ['B'], value: 96 },
        { name: 'C', sets: ['C'], value: 82 },
        { name: 'A&B', sets: ['A', 'B'], value: 34 },
        { name: 'A&C', sets: ['A', 'C'], value: 24 },
        { name: 'B&C', sets: ['B', 'C'], value: 20 },
        { name: 'A&B&C', sets: ['A', 'B', 'C'], value: 12 }
      ],
      hollowStyle: { borderWidth: 6 },
      label: { show: true }
    }
  ]
});
```

## 气泡维恩图

```js
chart.setOption({
  series: [
    {
      type: 'venn',
      layout: 'bubble',
      data: [
        { name: 'Radiohead', value: 100 },
        { name: 'Kanye West', value: 64 },
        { name: 'The Beatles', value: 58 },
        { name: 'Pink Floyd', value: 44 }
      ],
      itemStyle: { opacity: 0.6 },
      label: { show: true }
    }
  ]
});
```

## 数据

- 空心模式使用带 `sets` 的集合行，例如 `['A']`、`['A', 'B']` 或 `['A', 'B', 'C']`。
- 气泡模式使用带 `name` 和 `value` 的扁平行。
- `value` 控制集合或气泡的相对大小。

## 常用选项

- `layout`, `vennType`, or `mode`: `hollow` or `bubble`.
- `padding`, `minRadius`, `maxRadius`：布局边界。
- `layoutOptions`：nested 布局设置。
- `itemStyle`, `hollowStyle`, `label`, `emphasis`：展示样式。
