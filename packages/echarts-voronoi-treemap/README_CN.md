# @echarts-extension/voronoi-treemap

语言：[English](./README.md) | 中文

ECharts 加权 Voronoi 矩形树图扩展。导入本包即可注册 `series.type = 'voronoiTreemap'`。

![Voronoi Treemap 图表截图](../../docs/packages/echarts-voronoi-treemap/screenshot.png)

## 安装

```bash
npm install echarts @echarts-extension/voronoi-treemap
```

## 基础用法

```js
import * as echarts from 'echarts';
import '@echarts-extension/voronoi-treemap';

const chart = echarts.init(document.getElementById('main'));

chart.setOption({
  series: [
    {
      type: 'voronoiTreemap',
      data: {
        name: 'Portfolio',
        children: [
          { name: 'Core', children: [{ name: 'Search', value: 48 }, { name: 'Ads', value: 32 }] },
          { name: 'Growth', children: [{ name: 'Cloud', value: 34 }, { name: 'AI', value: 26 }] }
        ]
      },
      gap: 2,
      maxIteration: 18,
      label: { show: true, showInternal: false }
    }
  ]
});
```

## 数据

可以使用一个根对象、根对象数组或数组行：

- 层级结构默认使用 `children`。
- 扁平数组行可以使用 `dimensions`、`nameField` 和 `valueField`。
- `childrenField`、`nameField` 和 `valueField` 支持自定义数据结构。
- 设置 `rootVisible: false` 可隐藏合成根节点。

## 常用选项

- `padding` and `gap`：多边形间距。
- `rootName`, `rootVisible`：根节点行为。
- `sort`：`value`, `name`, `none`, `true`, or `false`.
- `maxIteration`：本地 Voronoi 松弛迭代次数。
- `colors`, `itemStyle`, `label`, `emphasis`：展示样式。
- 标签 formatter 参数包括 `name`、`value`、`percent`、`depth`、`isLeaf` 和 `parentId`。
