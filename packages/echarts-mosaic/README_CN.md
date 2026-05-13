# @echarts-extension/mosaic

语言：[English](./README.md) | 中文

ECharts 分类马赛克图扩展。导入本包即可注册 `series.type = 'mosaic'`。

![Mosaic 图表截图](../../tests/browser-visual/__snapshots__/echarts-mosaic.png)

## 安装

```bash
npm install echarts @echarts-extension/mosaic
```

## 基础用法

```js
import * as echarts from 'echarts';
import '@echarts-extension/mosaic';

const chart = echarts.init(document.getElementById('main'));

chart.setOption({
  series: [
    {
      type: 'mosaic',
      xField: 'device',
      yField: 'browser',
      valueField: 'users',
      data: [
        { device: 'Desktop', browser: 'Chrome', users: 50 },
        { device: 'Desktop', browser: 'Safari', users: 10 },
        { device: 'Mobile', browser: 'Chrome', users: 35 },
        { device: 'Mobile', browser: 'Safari', users: 30 }
      ],
      gap: 2,
      label: {
        show: true,
        formatter: '{x}\n{y}: {c}'
      }
    }
  ]
});
```

## 数据

可以使用对象或数组行：

- `xField` 控制列分组。
- `yField` 控制每列内部的纵向拆分。
- `valueField` 控制面积。
- 使用 `xCategories` 和 `yCategories` 可强制指定分类顺序。
- 使用数组行时请设置 `dimensions`。

## 常用选项

- `padding` and `gap`：间距设置。
- `sort`：`value`, `name`, `none`, `true`, or `false`.
- `colors`, `itemStyle`, `label`, `emphasis`：展示样式。
- 标签 formatter 参数包括 `xCategory`、`yCategory`、`value`、`percent` 和 `columnPercent`。
