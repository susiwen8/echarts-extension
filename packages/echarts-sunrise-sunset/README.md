# @echarts-extension/sunrise-sunset

Language: English | [中文](./README_CN.md)

ECharts extension chart for sunrise, sunset, moonrise, and moonset paths. Import this package for side effects to register `series.type = 'sunriseSunset'`.

![Sunrise Sunset chart](../../docs/packages/echarts-sunrise-sunset/screenshot.png)

## Install

```bash
npm install echarts @echarts-extension/sunrise-sunset
```

## Basic Usage

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

## Data

You can pass values directly on the series or in `data`:

- `sunrise`, `sunset`, `moonrise`, `moonset`, `currentTime`, and `updatedAt` accept `HH:mm`, local date-time strings, timestamps, or `Date` objects.
- `title`, `remainingText`, and `updatedText` can be supplied for static screenshots.
- If countdown text is omitted, the layout computes remaining time from `currentTime`.

## Useful Options

- `padding`, `baselineY`, `dayArcHeight`, `moonArcHeight`: geometry controls.
- `moonStartRatio`, `moonEndRatio`: moon arc anchors inside the day arc.
- `sunIcon`, `moonIcon`: `path://...`, `image://...`, `false`, or an object with `path`, `image`, `size`, `offset`, and `style`.
- `backgroundStyle`, `baselineStyle`, `dayLineStyle`, `moonLineStyle`, `dayAreaStyle`, `moonAreaStyle`: styling.
- `titleLabel`, `remainingLabel`, `updatedLabel`, `eventLabel`: text controls.
- `enterAnimation`: controls the moving sun/moon reveal animation.
