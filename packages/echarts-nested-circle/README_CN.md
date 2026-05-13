# @echarts-extension/nested-circle

语言：[English](./README.md) | 中文

ECharts 底部对齐嵌套圆图扩展。导入本包即可注册 `series.type = 'nestedCircle'`。

![Nested Circle 图表截图](../../tests/browser-visual/__snapshots__/echarts-nested-circle.png)

## 安装

```bash
npm install echarts @echarts-extension/nested-circle
```

## 基础用法

```js
import * as echarts from 'echarts';
import '@echarts-extension/nested-circle';

const chart = echarts.init(document.getElementById('main'));

chart.setOption({
  series: [
    {
      type: 'nestedCircle',
      data: [
        { name: 'Mathematics', children: ['Probability', 'Linear Algebra', 'Calculus'] },
        { name: 'Python', children: ['Pandas', 'NumPy', 'Scikit-Learn'] },
        { name: 'SQL', children: ['Joins', 'Window Functions', 'Optimization'] }
      ],
      centerRadiusRatio: 0.3,
      label: { show: true },
      titleLabel: { show: true }
    }
  ]
});
```

## 数据

使用有序的圆层数组：

- 每一项都会成为一个可见圆环或圆。
- `name` 是层标题。
- `children` 或 `items` 是绘制在该层内部的标签。
- 子项可以是字符串、数字，或带 `name`、`value` 和可选 `label` 的对象。

## 常用选项

- `center`, `radius`, `padding`：视口设置。
- `centerRadiusRatio`, `labelRadiusRatio`, `titleRadiusRatio`：文本和圆环位置。
- `minRingThickness`：在层数较多时保护可读性。
- `colors`, `ringStyle`, `itemStyle`, `titleLabel`, `label`：展示样式。
