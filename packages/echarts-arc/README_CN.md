# @echarts-extension/arc

语言：[English](./README.md) | 中文

ECharts 自定义弧形图布局扩展。导入本包即可注册 `series.type = 'arc'`。

![Arc 图表截图](../../docs/packages/echarts-arc/screenshot.png)

## 安装

```bash
npm install echarts @echarts-extension/arc
```

## 基础用法

```js
import * as echarts from 'echarts';
import '@echarts-extension/arc';

const chart = echarts.init(document.getElementById('main'));

chart.setOption({
  series: [
    {
      type: 'arc',
      data: [
        { id: 'root', value: 10 },
        { id: 'a', value: 4 },
        { id: 'b', value: 3 }
      ],
      links: [
        { source: 'root', target: 'a' },
        { source: 'root', target: 'b' }
      ],
      label: { show: true },
      layout: {
        nodeSep: 58,
        nodeSize: 18,
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

- `layout.nodeSep`：弧形节点之间的水平间距。
- `layout.nodeSize`：固定节点大小，或返回大小的函数。
- `layout.begin`：布局起点。
- `layout.preventOverlap`：标签或图形碰撞时将节点轻微分开。
- `edgeAnimation`：`true` 使用默认连线绘制动画，`false` 关闭动画，也可以传入包含 `duration`、`delay`、`stagger` 和 `easing` 的对象。
