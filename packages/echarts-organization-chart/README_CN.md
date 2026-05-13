# @echarts-extension/organization-chart

语言：[English](./README.md) | 中文

ECharts 组织结构图扩展。导入本包即可注册 `series.type = 'organizationChart'`。

![Organization Chart 图表截图](../../tests/browser-visual/__snapshots__/echarts-organization-chart.png)

## 安装

```bash
npm install echarts @echarts-extension/organization-chart
```

## 基础用法

```js
import * as echarts from 'echarts';
import '@echarts-extension/organization-chart';

const chart = echarts.init(document.getElementById('main'));

chart.setOption({
  series: [
    {
      type: 'organizationChart',
      orient: 'TB',
      data: {
        name: 'CEO',
        children: [
          {
            name: 'Product',
            children: [{ name: 'Design' }, { name: 'Research' }]
          },
          {
            name: 'Engineering',
            children: [{ name: 'Frontend' }, { name: 'Platform' }]
          }
        ]
      },
      label: { show: true, formatter: '{b}' }
    }
  ]
});
```

## 数据

可以使用一个嵌套根节点、嵌套根节点数组、带 `id` 和 `parentId` 的扁平行，或显式的 `nodes` 和 `links`。

```js
{
  type: 'organizationChart',
  data: [
    { id: 'ceo', name: 'CEO' },
    { id: 'ops', parentId: 'ceo', name: 'Operations' },
    { id: 'finance', parentId: 'ceo', name: 'Finance' }
  ]
}
```

## 常用选项

- `orient`：`TB`, `BT`, `LR`, or `RL`.
- `nodeWidth`, `nodeHeight`, `levelGap`, `siblingGap`, and `subtreeGap`: 布局尺寸。
- `idField`, `parentIdField`, `nameField`, and `childrenField`: custom 数据字段名。
- `itemStyle`, `lineStyle`, `label`, and `emphasis`: 展示样式。
