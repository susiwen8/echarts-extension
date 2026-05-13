# @echarts-extension/circle-packing

语言：[English](./README.md) | 中文

ECharts 层级圆堆积图扩展。导入本包即可注册 `series.type = 'circlePacking'`。

![Circle Packing 图表截图](../../docs/packages/echarts-circle-packing/screenshot.png)

## 安装

```bash
npm install echarts @echarts-extension/circle-packing
```

## 基础用法

```js
import * as echarts from 'echarts';
import '@echarts-extension/circle-packing';

const chart = echarts.init(document.getElementById('main'));

chart.setOption({
  series: [
    {
      type: 'circlePacking',
      data: {
        name: 'Portfolio',
        children: [
          { name: 'Core', children: [{ name: 'Search', value: 54 }, { name: 'Editor', value: 38 }] },
          { name: 'Growth', children: [{ name: 'Campaigns', value: 32 }, { name: 'Referrals', value: 22 }] }
        ]
      },
      siblingGap: 2,
      nodePadding: 4,
      label: { show: true }
    }
  ]
});
```

## 数据

使用一个根对象或根对象数组：

- 子节点可以存放在 `children` 中，也可以通过 `childrenField` 配置。
- 数值默认读取 `value`；嵌套字段可使用 `valueField`，例如 `metrics.size`。
- 名称默认读取 `name`；自定义数据可使用 `nameField`。
- 传入数组时，设置 `rootVisible: false` 可隐藏合成根节点。

## 常用选项

- `padding`, `nodePadding`, `siblingGap`：间距设置。
- `center`, `radius`：圆堆积视口设置。
- `rootName`, `rootVisible`：根节点行为。
- `sort`：`value`, `name`, `asc`, `desc`, `none`, `true`, or `false`.
- `colors`, `itemStyle`, `label`, `emphasis`, `enterAnimation`：展示样式。
