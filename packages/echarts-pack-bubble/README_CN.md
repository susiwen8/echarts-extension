# @echarts-extension/pack-bubble

语言：[English](./README.md) | 中文

ECharts 平面气泡堆积图扩展。导入本包即可注册 `series.type = 'packBubble'`。

![Pack Bubble 图表截图](../../tests/browser-visual/__snapshots__/echarts-pack-bubble.png)

## 安装

```bash
npm install echarts @echarts-extension/pack-bubble
```

## 基础用法

```js
import * as echarts from 'echarts';
import '@echarts-extension/pack-bubble';

const chart = echarts.init(document.getElementById('main'));

chart.setOption({
  series: [
    {
      type: 'packBubble',
      data: [
        { name: 'China', value: 1412, region: 'Asia' },
        { name: 'India', value: 1408, region: 'Asia' },
        { name: 'USA', value: 335, region: 'North America' },
        { name: 'Indonesia', value: 281, region: 'Asia' }
      ],
      categoryField: 'region',
      gap: 2,
      maxRadius: 76,
      fillRatio: 0.72,
      label: { show: true, minRadius: 28 }
    }
  ]
});
```

## 数据

使用对象数组：

- `valueField` 默认读取 `value`，并控制圆半径。
- `nameField` 默认读取 `name`，并控制标签。
- 提供 `categoryField` 时会按分类分组颜色。
- 使用数据项级 `itemStyle` 或 `label` 可覆盖单个气泡样式。

## 常用选项

- `padding`, `gap`, `center`：布局间距。
- `minRadius`, `maxRadius`, `fillRatio`：气泡大小与堆积密度。
- `sort`：`asc`, `desc`, `none`, `true`, or `false`.
- `colors`, `itemStyle`, `label`, `emphasis`, `enterAnimation`：展示样式。
- `layout` 或 `layoutOptions` 可以承载相同的布局设置。
