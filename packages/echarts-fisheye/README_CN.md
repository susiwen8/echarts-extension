# @echarts-extension/fisheye

语言：[English](./README.md) | 中文

ECharts 可复用鱼眼放大交互组件。导入一次后，可在任意图表中添加顶层 `fisheye` 选项。

![Fisheye 图表截图](../../visual-baseline/echarts-fisheye.png)

```js
import * as echarts from 'echarts';
import '@echarts-extension/fisheye';

const chart = echarts.init(document.getElementById('main'));
chart.setOption({
  fisheye: {
    show: true,
    radius: 140,
    scale: 2.4
  },
  xAxis: {},
  yAxis: {},
  series: [
    {
      type: 'scatter',
      data: [[1, 2], [2, 3], [3, 1]]
    }
  ]
});
```

组件会监听图表的 zrender 指针事件，并对指针附近的显示元素应用临时放大镜变换。设置 `show: false` 或移除组件即可关闭。

## 配置项

<!-- OPTIONS:START -->
此表由 `scripts/sync-options-from-readmes.mjs --write-readmes` 生成。更新英文 README 的配置表后，运行 `npm run docs:sync-options` 可刷新文档页。

| 配置项 | 说明 | 可选值 |
| --- | --- | --- |
| `fisheye` | 顶层 分量 option added to an E图表s option 对象。 | `对象 \| 对象[]` |
| `fisheye.labelScale` | 标签 magnification factor near the lens 中心点。 | `数字` |
| `fisheye.type` | 分量 类型 marker。 | `'fisheye'` |
| `fisheye.show` | 为 true 时显示and enables the 放大镜。 | `布尔值` |
| `fisheye.enabled` | enabling the 放大镜的别名。 | `布尔值` |
| `fisheye.radius` | Lens 半径 around the 指针。 | `数字 \| 字符串 (像素或百分比)` |
| `fisheye.scale` | Magnification factor at the lens 中心点。 | `数字` |
| `fisheye.magnification` | scale的别名。 | `数字` |
| `fisheye.stroke` | Lens out线 颜色。 | `字符串` |
| `fisheye.borderColor` | lens out线 颜色的别名。 | `字符串` |
| `fisheye.strokeWidth` | Lens out线 宽度。 | `数字` |
| `fisheye.borderWidth` | lens out线 宽度的别名。 | `数字` |
| `fisheye.opacity` | Lens out线 透明度。 | `数字` |
| `fisheye.preview` | 运行initial preview pulse when available。 | `布尔值` |
<!-- OPTIONS:END -->
