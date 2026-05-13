# @echarts-extension/fractal

语言：[English](./README.md) | 中文

ECharts 可缩放分形渲染扩展。导入本包即可注册 `series.type = 'fractal'`。

![Fractal 图表截图](../../tests/browser-visual/__snapshots__/echarts-fractal.png)

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
