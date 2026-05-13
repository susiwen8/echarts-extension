# @echarts-extension/radial

语言：[English](./README.md) | 中文

ECharts 自定义径向图布局扩展。导入本包即可注册 `series.type = 'radial'`。

![Radial 图表截图](../../tests/browser-visual/__snapshots__/echarts-radial.png)

## 安装

```bash
npm install echarts @echarts-extension/radial
```

## 基础用法

```js
import * as echarts from 'echarts';
import '@echarts-extension/radial';

const chart = echarts.init(document.getElementById('main'));

chart.setOption({
  series: [
    {
      type: 'radial',
      data: [
        { id: 'root', value: 10 },
        { id: 'a', value: 4 },
        { id: 'b', value: 3 },
        { id: 'c', value: 2 }
      ],
      links: [
        { source: 'root', target: 'a' },
        { source: 'root', target: 'b' },
        { source: 'a', target: 'c' }
      ],
      label: { show: true },
      layout: {
        focusNode: 'root',
        unitRadius: 90,
        linkDistance: 140,
        preventOverlap: true
      }
    }
  ]
});
```

## 数据

使用 ECharts 图关系风格输入：

- `data` 或 `nodes` 表示节点。
- `links` 或 `edges` 表示连接。
- 每条连线使用 `source` 和 `target`，对应节点的 `id` 或 `name`。
- 省略 `symbolSize` 时，会根据数值型 `value` 推断节点大小。

## 常用选项

- `layout.focusNode`：放在中心的节点 id 或名称。默认使用第一个节点。
- `layout.unitRadius`：图层级之间的径向距离。
- `layout.linkDistance`：推断层级时使用的兜底边长。
- `layout.strictRadial`：让节点保持在严格的层级圆环上。
- `layout.preventOverlap` 和 `layout.preventOverlapPadding`：分离拥挤节点。
