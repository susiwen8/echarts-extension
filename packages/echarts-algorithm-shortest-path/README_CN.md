# @echarts-extension/algorithm-shortest-path

语言：[English](./README.md) | 中文

ECharts 最短路径算法可视化扩展。导入本包即可注册 `series.type = 'algorithmShortestPath'`。

## 安装

```bash
npm install echarts @echarts-extension/algorithm-shortest-path
```

## 基础用法

```js
import * as echarts from 'echarts';
import '@echarts-extension/algorithm-shortest-path';

const chart = echarts.init(document.getElementById('main'));

chart.setOption({
  series: [
    {
      type: 'algorithmShortestPath',
      algorithm: 'dijkstra',
      start: 'A',
      target: 'F',
      currentStep: 12,
      nodes: [
        { id: 'A', x: 0.08, y: 0.5 },
        { id: 'B', x: 0.25, y: 0.25 },
        { id: 'F', x: 0.9, y: 0.45 }
      ],
      edges: [
        { source: 'A', target: 'B', weight: 2 },
        { source: 'B', target: 'F', weight: 5 }
      ]
    }
  ]
});
```

## 算法

第一版覆盖 Dijkstra、BFS、A* 和 Bellman-Ford。系列内部生成确定性的搜索帧；修改 `currentStep` 或 `progress` 即可拖动查看访问节点、检查边、松弛边和最终路径。

## 常用选项

- `algorithm`：选择最短路径算法。
- `start`, `target`：指定起点和终点节点。
- `currentStep`, `progress`：控制当前搜索帧。
- `nodes`, `edges`：传入带坐标和权重的图数据。
- `stateStyle`：设置起点、终点、当前节点、队列、已访问、松弛边和路径颜色。

## 配置项

<!-- OPTIONS:START -->
此表由 `scripts/sync-options-from-readmes.mjs --write-readmes` 生成。更新英文 README 的配置表后，运行 `npm run docs:sync-options` 可刷新文档页。

| 配置项 | 说明 | 可选值 |
| --- | --- | --- |
| `type` | 向 ECharts 注册该包的系列类型。 | `'algorithmShortestPath'` |
| `silent` | 为 true 时禁用鼠标事件。 | `布尔值` |
| `width` | 系列区域宽度。 | `数字 \| 字符串 (像素或百分比)` |
| `height` | 系列区域高度。 | `数字 \| 字符串 (像素或百分比)` |
| `top` | 距离图表容器顶部的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `right` | 距离图表容器右侧的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `bottom` | 距离图表容器底部的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `left` | 距离图表容器左侧的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `nodes` | 要搜索的图节点；`data` 也可作为别名。 | `对象数组` |
| `edges` | 带权图边；`links` 也可作为别名。 | `对象数组` |
| `nodes.id` | 稳定的节点标识。 | `字符串 \| 数字` |
| `nodes.name` | 节点显示名称。 | `字符串` |
| `nodes.x`, `nodes.y` | 节点坐标；0 到 1 的值会作为相对位置。 | `数字` |
| `edges.source`, `edges.target` | 使用节点 id 指定边的端点。 | `字符串 \| 数字` |
| `edges.weight` | 加权算法使用的边权重。 | `数字` |
| `edges.directed` | 将单条边设为有向。 | `布尔值` |
| `algorithm` | 要可视化的最短路径算法。 | `'dijkstra' \| 'bfs' \| 'a-star' \| 'bellman-ford'` |
| `start` | 起点节点 id；默认使用第一个节点。 | `字符串 \| 数字` |
| `target` | 终点节点 id；默认使用最后一个节点。 | `字符串 \| 数字` |
| `currentStep` | 当前渲染的整数帧序号。 | `数字` |
| `progress` | 0 到 1 的归一化进度；设置 `currentStep` 时会忽略它。 | `数字 (0-1)` |
| `maxNodes` | 用于生成帧的最大节点数。 | `数字` |
| `maxEdges` | 用于生成帧的最大边数。 | `数字` |
| `maxFrames` | 生成帧数量的安全上限。 | `数字` |
| `padding` | 图表周围的内边距。 | `数字 \| 对象` |
| `nodeRadius` | 每个节点的半径。 | `数字` |
| `edgeWidth` | 图边的基础线宽。 | `数字` |
| `directed` | 将所有边按有向边处理，除非单条边覆盖。 | `布尔值` |
| `edgeStyle` | 基础边线样式。 | `对象` |
| `nodeStyle` | 基础节点填充和描边样式。 | `对象` |
| `stateStyle` | 各状态节点和边的颜色。 | `对象` |
| `edgeLabel` | 边权重标签样式。 | `对象` |
| `label` | 节点标签样式。 | `对象` |
| `distanceLabel` | 暂定距离标签样式。 | `对象` |
| `stepLabel` | 顶部步骤说明样式。 | `对象` |
<!-- OPTIONS:END -->
