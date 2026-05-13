# @echarts-extension/fractal

语言：[English](./README.md) | 中文

ECharts 可缩放分形渲染扩展。导入本包即可注册 `series.type = 'fractal'`。

![Fractal 图表截图](../../visual-baseline/echarts-fractal.png)

## 安装

```bash
npm install echarts @echarts-extension/fractal
```

## 基础用法

```js
import * as echarts from 'echarts';
import '@echarts-extension/fractal';

const chart = echarts.init(document.getElementById('main'));

chart.setOption({
  series: [
    {
      type: 'fractal',
      fractalType: 'mandelbrot',
      roam: true,
      viewport: {
        center: [-0.743643887037151, 0.13182590420533],
        viewWidth: 3.2,
        scale: 1
      },
      baseIterations: 180,
      iterationBoost: 42,
      iterationLimit: 2400,
      maxPixelCount: 420000
    }
  ]
});
```

## 缩放细节

渲染器不会简单缩放固定图片。滚轮缩放和拖拽平移会更新复平面视口，并按当前显示分辨率重新计算分形。交互过程中会先变换上一帧图像提供即时反馈，再在主线程渲染受限预览，随后把完整分辨率细化任务发送给可取消的 Web Worker。当 `maxZoom` 为 `null` 时，`scale` 没有内置上限，缩放会持续到浮点精度或配置的迭代预算成为限制。

常用控制项：

- `viewport.center`, `viewport.viewWidth`, `viewport.scale`：初始复平面相机。
- `roam`：启用滚轮缩放和拖拽平移。
- `baseIterations`, `iterationBoost`, `iterationLimit`：随缩放增加逃逸迭代次数。
- `pixelRatio`, `maxPixelCount`：控制渲染密度和性能。
- `interactivePixelRatio`, `interactiveMaxPixelCount`, `interactiveIterationScale`, `refineDelay`：保持滚轮缩放和拖拽平移响应流畅，并在交互暂停后细化图像。
- `worker`：默认用于最终高细节渲染；设为 `false` 可强制使用旧的同步路径。
- `workerUrl`：可选的自托管 worker 脚本 URL，适用于不允许内联 Blob worker 的部署环境。
- `fractalType`：`mandelbrot`、`julia` 或 `burningShip`。
- `juliaConstant`：Julia 集的复常数。
- `insideColor`, `backgroundColor`, `colorStops`：调色板设置。

## 配置项

<!-- OPTIONS:START -->
此表由 `scripts/sync-options-from-readmes.mjs --write-readmes` 生成。更新英文 README 的配置表后，运行 `npm run docs:sync-options` 可刷新文档页。

| 配置项 | 说明 | 可选值 |
| --- | --- | --- |
| `type` | 向 ECharts 注册该包的系列类型。 | `'fractal'` |
| `silent` | 为 true 时禁用mouse events for the 系列。 | `布尔值` |
| `width` | 系列区域宽度。 | `数字 \| 字符串 (像素或百分比)` |
| `height` | 系列区域高度。 | `数字 \| 字符串 (像素或百分比)` |
| `top` | 距离图表容器顶部的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `right` | 距离图表容器右侧的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `bottom` | 距离图表容器底部的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `left` | 距离图表容器左侧的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `name` | E图表s使用的系列名称。 | `字符串` |
| `fractalType` | Fractal 公式 to 渲染。 | `'mandelbrot' \| 'julia' \| 'burningShip'` |
| `viewport` | Nested 视口 controls。 | `对象` |
| `viewport.center` | 分形平面的中心点。 | `[数字, 数字]` |
| `viewport.viewWidth` | 可见分形平面的宽度。 | `数字` |
| `viewport.scale` | 视口缩放倍率。 | `数字` |
| `viewport.zoom` | 当前缩放值。 | `数字` |
| `center` | 分形平面的中心点。 | `[数字, 数字]` |
| `viewWidth` | 可见分形平面的宽度。 | `数字` |
| `scale` | 视口缩放倍率。 | `数字` |
| `zoom` | 当前缩放值。 | `数字` |
| `roam` | Allows pan and zoom 交互。 | `布尔值` |
| `minZoom` | 最小值 allowed zoom。 | `数字` |
| `maxZoom` | 最大值 allowed zoom, or unlimited when null。 | `数字 \| null` |
| `zoomStep` | Zoom multiplier per wheel or control step。 | `数字` |
| `pixelRatio` | 渲染 pixel ratio, or auto when null。 | `数字 \| null` |
| `maxPixelCount` | 最大值 pixel budget for a full 渲染。 | `数字` |
| `fallbackMaxCells` | Fallback 渲染 cell budget when pixel budget is exceeded。 | `数字` |
| `interactivePixelRatio` | Pixel ratio used du环 交互 渲染s。 | `数字` |
| `interactiveMaxPixelCount` | Pixel budget used du环 交互 渲染s。 | `数字` |
| `interactiveIterationScale` | Iteration multiplier used du环 交互 渲染s。 | `数字` |
| `minInteractiveIterations` | 最小值 iterations du环 交互 渲染s。 | `数字` |
| `refineDelay` | 延迟 before refining after 交互。 | `数字` |
| `worker` | 为 true 时启用基于 worker 的渲染。 | `布尔值` |
| `workerUrl` | 自定义 worker script URL。 | `字符串` |
| `baseIterations` | Base iteration count before zoom boosts。 | `数字` |
| `iterationBoost` | Additional iteration factor as zoom increases。 | `数字` |
| `iterationLimit` | Hard cap for computed iteration count。 | `数字` |
| `maxIterations` | 显式 最大值 iteration count, or auto when null。 | `数字 \| null` |
| `escapeRadius` | 分形公式使用的Escape 半径。 | `数字` |
| `juliaConstant` | Julia 集合使用的Complex constant。 | `[数字, 数字]` |
| `insideColor` | 用于点 insIDe the 集合的颜色。 | `字符串` |
| `backgroundColor` | 画布背景色。 | `字符串` |
| `colorStops` | 逃逸点的渐变色标。 | `数组<[数字, 字符串] \| 对象>` |
| `colorStops.offset` | off集合字段。 | `未知` |
| `colorStops.color` | 颜色字段。 | `字符串 \| 数字` |
| `tooltip` | 控制E图表s 提示框 behavior。 | `对象` |
| `tooltip.trigger` | ECharts tooltip 触发方式。 | `字符串` |
<!-- OPTIONS:END -->
