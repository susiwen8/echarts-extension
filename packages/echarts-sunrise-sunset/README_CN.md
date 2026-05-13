# @echarts-extension/sunrise-sunset

语言：[English](./README.md) | 中文

ECharts 日出、日落、月升和月落路径图扩展。导入本包即可注册 `series.type = 'sunriseSunset'`。

![Sunrise Sunset 图表截图](../../visual-baseline/echarts-sunrise-sunset.png)

## 安装

```bash
npm install echarts @echarts-extension/sunrise-sunset
```

## 基础用法

```js
import * as echarts from 'echarts';
import '@echarts-extension/sunrise-sunset';

const chart = echarts.init(document.getElementById('main'));

chart.setOption({
  series: [
    {
      type: 'sunriseSunset',
      sunrise: '05:12',
      sunset: '18:39',
      moonrise: '22:08',
      moonset: '07:59',
      currentTime: '2026-05-05 10:47:33',
      title: 'Time until sunset',
      remainingText: '07:51:27',
      updatedText: 'Updated 10:46'
    }
  ]
});
```

## 数据

可以直接在 series 上传入值，也可以放在 `data` 中：

- `sunrise`、`sunset`、`moonrise`、`moonset`、`currentTime` 和 `updatedAt` 接受 `HH:mm`、本地日期时间字符串、时间戳或 `Date` 对象。
- 可提供 `title`、`remainingText` 和 `updatedText` 用于静态截图。
- 如果省略倒计时文本，布局会根据 `currentTime` 计算剩余时间。

## 常用选项

- `padding`, `baselineY`, `dayArcHeight`, `moonArcHeight`：几何设置。
- `moonStartRatio`, `moonEndRatio`：日弧内部的月弧锚点。
- `sunIcon`, `moonIcon`：可为 `path://...`、`image://...`、`false`，或包含 `path`、`image`、`size`、`offset` 和 `style` 的对象。
- `backgroundStyle`, `baselineStyle`, `dayLineStyle`, `moonLineStyle`, `dayAreaStyle`, `moonAreaStyle`：样式设置。
- `titleLabel`, `remainingLabel`, `updatedLabel`, `eventLabel`：文本设置。
- `enterAnimation`：控制太阳/月亮移动揭示动画。

## 配置项

<!-- OPTIONS:START -->
此表由 `scripts/sync-options-from-readmes.mjs --write-readmes` 生成。更新英文 README 的配置表后，运行 `npm run docs:sync-options` 可刷新文档页。

| 配置项 | 说明 | 可选值 |
| --- | --- | --- |
| `type` | 向 ECharts 注册该包的系列类型。 | `'sunriseSunset'` |
| `silent` | 为 true 时禁用mouse events for the 系列。 | `布尔值` |
| `width` | 系列区域宽度。 | `数字 \| 字符串 (像素或百分比)` |
| `height` | 系列区域高度。 | `数字 \| 字符串 (像素或百分比)` |
| `top` | 距离图表容器顶部的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `right` | 距离图表容器右侧的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `bottom` | 距离图表容器底部的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `left` | 距离图表容器左侧的距离。 | `数字 \| 字符串 (像素或百分比)` |
| `data` | Single 记录 or 记录 containing sun, moon, title, and status 文本 数值。 | `对象 \| 数组<对象>` |
| `data.sunrise` | sunrise字段。 | `字符串 \| 数字 \| 日期` |
| `data.sunset` | sun集合字段。 | `字符串 \| 数字 \| 日期` |
| `data.moonrise` | moonrise字段。 | `字符串 \| 数字 \| 日期` |
| `data.moonset` | moon集合字段。 | `字符串 \| 数字 \| 日期` |
| `data.currentTime` | current time字段。 | `字符串 \| 数字 \| 日期` |
| `data.updatedAt` | updated at字段。 | `字符串 \| 数字 \| 日期` |
| `data.title` | title字段。 | `字符串` |
| `data.remainingText` | remaining 文本字段。 | `字符串` |
| `data.updatedText` | updated 文本字段。 | `字符串` |
| `sunrise` | Sunrise time。 | `字符串 \| 数字 \| 日期` |
| `sunset` | Sun集合 time。 | `字符串 \| 数字 \| 日期` |
| `moonrise` | Moonrise time。 | `字符串 \| 数字 \| 日期` |
| `moonset` | Moon集合 time。 | `字符串 \| 数字 \| 日期` |
| `currentTime` | Time used to compute current progress and remaining 文本。 | `字符串 \| 数字 \| 日期` |
| `updatedAt` | Timestamp shown by the updated 标签。 | `字符串 \| 数字 \| 日期` |
| `title` | Title 文本 shown above the arc。 | `字符串` |
| `remainingText` | 文本 shown for remaining daylight or night time。 | `字符串` |
| `updatedText` | 文本 shown for update status。 | `字符串` |
| `enterAnimation` | 为sun and moon elements into place添加动画。 | `布尔值 \| 对象` |
| `enterAnimation.show` | 为 true 时显示动画。 | `布尔值` |
| `enterAnimation.enabled` | 为 true 时启用动画。 | `布尔值` |
| `enterAnimation.duration` | 动画时长。 | `数字 \| 函数` |
| `enterAnimation.delay` | 动画开始前的延迟。 | `数字 \| 函数` |
| `enterAnimation.stagger` | 图元之间增加的延迟。 | `数字 \| 函数` |
| `enterAnimation.easing` | 动画缓动名称。 | `字符串` |
| `sunIcon` | 自定义 sun icon。 | `字符串 \| false \| 对象` |
| `sunIcon.path` | 图标矢量路径。 | `字符串` |
| `sunIcon.image` | 图标图片地址。 | `字符串` |
| `sunIcon.size` | 图标大小。 | `数字 \| [数字, 数字]` |
| `sunIcon.width` | 图标宽度。 | `数字` |
| `sunIcon.height` | 图标高度。 | `数字` |
| `sunIcon.offset` | 图标偏移。 | `[数字, 数字]` |
| `sunIcon.offsetX` | 图标水平偏移。 | `数字` |
| `sunIcon.offsetY` | 图标垂直偏移。 | `数字` |
| `sunIcon.style` | 设置图标图形样式。 | `对象` |
| `sunIcon.style.fill` | 图标填充颜色。 | `字符串` |
| `sunIcon.style.stroke` | 图标描边颜色。 | `字符串` |
| `sunIcon.style.lineWidth` | 图标描边宽度。 | `数字` |
| `sunIcon.style.opacity` | 图标透明度。 | `数字` |
| `moonIcon` | 自定义 moon icon。 | `字符串 \| false \| 对象` |
| `moonIcon.path` | 图标矢量路径。 | `字符串` |
| `moonIcon.image` | 图标图片地址。 | `字符串` |
| `moonIcon.size` | 图标大小。 | `数字 \| [数字, 数字]` |
| `moonIcon.width` | 图标宽度。 | `数字` |
| `moonIcon.height` | 图标高度。 | `数字` |
| `moonIcon.offset` | 图标偏移。 | `[数字, 数字]` |
| `moonIcon.offsetX` | 图标水平偏移。 | `数字` |
| `moonIcon.offsetY` | 图标垂直偏移。 | `数字` |
| `moonIcon.style` | 设置图标图形样式。 | `对象` |
| `moonIcon.style.fill` | 图标填充颜色。 | `字符串` |
| `moonIcon.style.stroke` | 图标描边颜色。 | `字符串` |
| `moonIcon.style.lineWidth` | 图标描边宽度。 | `数字` |
| `moonIcon.style.opacity` | 图标透明度。 | `数字` |
| `padding` | 图表周围的内边距。 | `数字` |
| `baselineY` | 垂直 position of the horizon 基线。 | `数字` |
| `dayArcHeight` | 高度 of the day arc。 | `数字` |
| `moonArcHeight` | 高度 of the moon arc。 | `数字` |
| `moonStartRatio` | Relative 开始 position of the moon arc。 | `数字` |
| `moonEndRatio` | Relative 结束 position of the moon arc。 | `数字` |
| `backgroundStyle` | 设置图表背景区域样式。 | `对象` |
| `backgroundStyle.color` | 主颜色。 | `字符串` |
| `backgroundStyle.opacity` | 透明度。 | `数字` |
| `baselineStyle` | 设置地平线基线样式。 | `对象` |
| `baselineStyle.color` | 主颜色。 | `字符串` |
| `baselineStyle.stroke` | 描边颜色。 | `字符串` |
| `baselineStyle.width` | 宽度值。 | `数字` |
| `baselineStyle.lineWidth` | 线宽。 | `数字` |
| `baselineStyle.opacity` | 透明度。 | `数字` |
| `baselineStyle.type` | 线条或图元类型。 | `'solid' \| 'dashed' \| 'dotted' \| 数字[]` |
| `dayLineStyle` | 设置太阳路径线样式。 | `对象` |
| `dayLineStyle.color` | 主颜色。 | `字符串` |
| `dayLineStyle.stroke` | 描边颜色。 | `字符串` |
| `dayLineStyle.width` | 宽度值。 | `数字` |
| `dayLineStyle.lineWidth` | 线宽。 | `数字` |
| `dayLineStyle.opacity` | 透明度。 | `数字` |
| `dayLineStyle.type` | 线条或图元类型。 | `'solid' \| 'dashed' \| 'dotted' \| 数字[]` |
| `moonLineStyle` | 设置月亮路径线样式。 | `对象` |
| `moonLineStyle.color` | 主颜色。 | `字符串` |
| `moonLineStyle.stroke` | 描边颜色。 | `字符串` |
| `moonLineStyle.width` | 宽度值。 | `数字` |
| `moonLineStyle.lineWidth` | 线宽。 | `数字` |
| `moonLineStyle.opacity` | 透明度。 | `数字` |
| `moonLineStyle.type` | 线条或图元类型。 | `'solid' \| 'dashed' \| 'dotted' \| 数字[]` |
| `dayAreaStyle` | 设置日光区域填充样式。 | `对象` |
| `dayAreaStyle.color` | 主颜色。 | `字符串` |
| `dayAreaStyle.opacity` | 透明度。 | `数字` |
| `moonAreaStyle` | 设置月亮区域填充样式。 | `对象` |
| `moonAreaStyle.color` | 主颜色。 | `字符串` |
| `moonAreaStyle.opacity` | 透明度。 | `数字` |
| `titleLabel` | 设置title 文本样式。 | `对象` |
| `titleLabel.show` | 为 true 时显示标签。 | `布尔值` |
| `titleLabel.color` | 标签文字颜色。 | `字符串` |
| `titleLabel.fontSize` | 标签文字大小。 | `数字` |
| `titleLabel.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `titleLabel.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `remainingLabel` | 设置剩余时间文本样式。 | `对象` |
| `remainingLabel.show` | 为 true 时显示标签。 | `布尔值` |
| `remainingLabel.color` | 标签文字颜色。 | `字符串` |
| `remainingLabel.fontSize` | 标签文字大小。 | `数字` |
| `remainingLabel.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `remainingLabel.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `updatedLabel` | 设置更新时间文本样式。 | `对象` |
| `updatedLabel.show` | 为 true 时显示标签。 | `布尔值` |
| `updatedLabel.color` | 标签文字颜色。 | `字符串` |
| `updatedLabel.fontSize` | 标签文字大小。 | `数字` |
| `updatedLabel.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `updatedLabel.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
| `eventLabel` | 设置日出、日落、月出和月落标签样式。 | `对象` |
| `eventLabel.show` | 为 true 时显示标签。 | `布尔值` |
| `eventLabel.color` | 标签文字颜色。 | `字符串` |
| `eventLabel.fontSize` | 标签文字大小。 | `数字` |
| `eventLabel.fontWeight` | 标签字重。 | `字符串 \| 数字` |
| `eventLabel.formatter` | 格式化标签 文本。 | `字符串 \| 函数` |
<!-- OPTIONS:END -->
