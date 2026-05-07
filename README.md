# echarts-extension

Monorepo for TypeScript ECharts extension charts inspired by the structure of `echarts-wordcloud`.

Implemented packages:

- `echarts-radial` registers `series.type = 'radial'`
- `echarts-radial-area` registers `series.type = 'radialArea'`
- `echarts-radial-boxplot` registers `series.type = 'radialBoxplot'`
- `echarts-concentric` registers `series.type = 'concentric'`
- `echarts-grid` registers `series.type = 'grid'`
- `echarts-mds` registers `series.type = 'mds'`
- `echarts-arc` registers `series.type = 'arc'`
- `echarts-venn` registers `series.type = 'venn'`
- `echarts-pack-bubble` registers `series.type = 'packBubble'`
- `echarts-circle-packing` registers `series.type = 'circlePacking'`
- `echarts-sleep` registers `series.type = 'sleep'`
- `echarts-nested-circle` registers `series.type = 'nestedCircle'`
- `echarts-mosaic` registers `series.type = 'mosaic'`
- `echarts-voronoi-treemap` registers `series.type = 'voronoiTreemap'`
- `echarts-subway` registers `series.type = 'subway'`
- `echarts-flame` registers `series.type = 'flame'`
- `echarts-sunrise-sunset` registers `series.type = 'sunriseSunset'`
- `echarts-spiral` registers `series.type = 'spiral'`
- `echarts-vector-field` registers `series.type = 'vectorField'`
- `echarts-beeswarm` registers `series.type = 'beeswarm'`

The radial, radial area, radial boxplot, concentric, grid, mds, and arc layouts are implemented locally without `@antv/layout`. The Venn, pack bubble, circle packing, sleep, nested circle, mosaic, Voronoi treemap, subway, flame, sunrise/sunset, spiral, vector-field, and beeswarm extensions also use local deterministic layout implementations.

Source implementation files live in `index.ts` and `src/**/*.ts`; package entrypoints are compiled to `lib/`, and UMD bundles are emitted to `dist/`.

## Examples

Every workspace package has a browser example under `packages/<package>/examples/`. The Venn package includes separate examples for the hollow and bubble cases.

From the repository root, serve the workspace and open the gallery:

```bash
python3 -m http.server 5173
```

Then visit `http://localhost:5173/examples/`.

The examples use local workspace builds from each package's `dist/` directory, so run `npm run build` first if you need fresh bundles.

## Usage

```js
import * as echarts from 'echarts';
import 'echarts-radial';

const chart = echarts.init(document.getElementById('main'));
chart.setOption({
  series: [
    {
      type: 'radial',
      data: [{ id: 'root', value: 10 }, { id: 'a', value: 4 }, { id: 'b', value: 2 }],
      links: [
        { source: 'root', target: 'a' },
        { source: 'root', target: 'b' }
      ],
      label: { show: true },
      layout: {
        unitRadius: 100,
        linkDistance: 200,
        preventOverlap: true
      }
    }
  ]
});
```

The five graph layout packages accept ECharts graph-style `data`/`links` or `nodes`/`edges`. When `symbolSize` is omitted, node sizes are scaled from each node's numeric `value`; set series-level or node-level `symbolSize` to override that behavior.

### Grid

`echarts-grid` places graph nodes into a deterministic row/column grid. It supports `rows`, `cols`, `begin`, `condense`, `preventOverlap`, `preventOverlapPadding`, `nodeSize`, `nodeSpacing`, `position`, and `sortBy`. String `sortBy` values can read either top-level fields or G6-style nested data fields such as `data.cluster`; `sortBy: 'cluster'` also reads `node.data.cluster`.

```js
import * as echarts from 'echarts';
import 'echarts-grid';

const clusterGraph = await fetch(
  'https://assets.antv.antgroup.com/g6/cluster.json'
).then((response) => response.json());

const chart = echarts.init(document.getElementById('main'));
chart.setOption({
  series: [
    {
      type: 'grid',
      data: clusterGraph.nodes,
      links: clusterGraph.edges,
      label: { show: true },
      layout: {
        cols: 7,
        rows: 5,
        preventOverlap: true,
        nodeSpacing: 8,
        sortBy: 'cluster'
      }
    }
  ]
});
```

### Animations

All chart packages include enter animations by default when ECharts animation is enabled. Use `enterAnimation` to tune the timing, or set `enterAnimation: false` on a series to keep that chart static. Global or series-level `animation: false` still disables extension animations.

```js
chart.setOption({
  series: [
    {
      type: 'mosaic',
      enterAnimation: {
        duration: 700,
        stagger: 35,
        easing: 'cubicOut'
      },
      data: [
        { channel: 'Organic', stage: 'New', users: 42 },
        { channel: 'Paid', stage: 'Returning', users: 18 }
      ]
    }
  ]
});
```

### Circle Packing

`echarts-circle-packing` draws hierarchical values as nested packed circles. It accepts a root object or an array of roots, supports `children` / `items` hierarchies, and can read nested value fields.

```js
import * as echarts from 'echarts';
import 'echarts-circle-packing';

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

### Arc

`echarts-arc` supports an optional `edgeAnimation` setting that draws each arc connection from its source node to its target node. Set `edgeAnimation: true` for the default connection animation, or pass an object to control timing.

```js
chart.setOption({
  series: [
    {
      type: 'arc',
      data: [{ id: 'root' }, { id: 'a' }, { id: 'b' }],
      links: [
        { source: 'root', target: 'a' },
        { source: 'root', target: 'b' }
      ],
      edgeAnimation: {
        duration: 720,
        stagger: 80,
        easing: 'cubicOut'
      },
      layout: {
        nodeSep: 58,
        nodeSize: 18
      }
    }
  ]
});
```

### Radial Area

`echarts-radial-area` draws polar radial area and range-area time series. This example uses AntV's seasonal weather data: `avg` is the main line, `min` / `max` is the inner band, and `minmin` / `maxmax` is the outer band.

```js
import * as echarts from 'echarts';
import 'echarts-radial-area';

const weather = await fetch(
  'https://assets.antv.antgroup.com/g2/seasonal-weather.json'
).then((response) => response.json());

const chart = echarts.init(document.getElementById('main'));
chart.setOption({
  series: [
    {
      type: 'radialArea',
      angleField: 'date',
      angleType: 'time',
      valueField: 'avg',
      minField: 'minmin',
      maxField: 'maxmax',
      min: 20,
      max: 90,
      tickCount: 5,
      innerRadius: '36%',
      outerRadius: '91%',
      data: weather,
      rangeAreaStyle: {
        color: '#e8eff7',
        opacity: 0.98
      },
      lineStyle: {
        width: 0,
        opacity: 0
      },
      angleAxis: {
        show: false,
        label: { show: false },
        splitLine: { show: false }
      }
    },
    {
      type: 'radialArea',
      angleField: 'date',
      angleType: 'time',
      valueField: 'avg',
      minField: 'min',
      maxField: 'max',
      min: 20,
      max: 90,
      tickCount: 5,
      innerRadius: '36%',
      outerRadius: '91%',
      data: weather,
      grid: { show: false },
      radialAxis: { show: false },
      angleAxis: {
        show: false,
        label: { show: false },
        splitLine: { show: false }
      },
      rangeAreaStyle: {
        color: '#c9dceb',
        opacity: 0.82
      },
      lineStyle: {
        color: '#3f86bd',
        width: 2.2
      }
    }
  ]
});
```

### Radial Boxplot

`echarts-radial-boxplot` draws five-number summaries around a radial axis. Each category gets one angular slot; `q1` to `q3` becomes the filled annular box, `median` becomes the inner arc, and `min` / `max` become radial whiskers with caps.

```js
import * as echarts from 'echarts';
import 'echarts-radial-boxplot';

const chart = echarts.init(document.getElementById('main'));
chart.setOption({
  series: [
    {
      type: 'radialBoxplot',
      categoryField: 'name',
      min: 0,
      max: 32,
      tickCount: 7,
      innerRadius: '18%',
      outerRadius: '82%',
      boxWidth: 0.58,
      capWidth: 0.34,
      data: [
        { name: 'Oceania', min: 1, q1: 8, median: 13, q3: 21, max: 24 },
        { name: 'East Europe', min: 4, q1: 9, median: 12, q3: 15, max: 19 },
        { name: 'Australia', min: 8, q1: 13, median: 16, q3: 20, max: 26 }
      ]
    }
  ]
});
```

### Sleep

`echarts-sleep` draws a Huawei Health-style night sleep timeline with a dark background, stage bands, total duration, and sleep/wake labels.

```js
import * as echarts from 'echarts';
import 'echarts-sleep';

const chart = echarts.init(document.getElementById('main'));
chart.setOption({
  series: [
    {
      type: 'sleep',
      startLabel: '入睡01:41',
      endLabel: '醒来10:38',
      data: [
        ['2026-05-04 01:41', '2026-05-04 02:06', 'light'],
        ['2026-05-04 02:06', '2026-05-04 02:19', 'awake'],
        ['2026-05-04 02:19', '2026-05-04 02:43', 'deep'],
        ['2026-05-04 02:43', '2026-05-04 03:26', 'light'],
        ['2026-05-04 03:26', '2026-05-04 03:42', 'deep'],
        ['2026-05-04 03:42', '2026-05-04 04:08', 'rem']
      ]
    }
  ]
});
```

### Sunrise Sunset

`echarts-sunrise-sunset` draws a dark, Huawei Health-style sun/moon path with the remaining countdown, update time, sunrise/sunset labels, and moonrise/moonset labels. Times can be `HH:mm`, local date-time strings, timestamps, or `Date` objects.

```js
import * as echarts from 'echarts';
import 'echarts-sunrise-sunset';

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
      title: '距离日落还剩',
      remainingText: '07:51:27',
      updatedText: '更新于10:46',
      sunIcon: {
        path: 'M 0 -18 L 4.2 -7.2 L 15.6 -11 L 10.2 -1.8 L 20 5 L 8.4 6.3 L 9.6 18 L 0 11.2 L -9.6 18 L -8.4 6.3 L -20 5 L -10.2 -1.8 L -15.6 -11 L -4.2 -7.2 Z',
        style: { fill: '#ffa72b' }
      },
      moonIcon: 'path://M -13 0 C -10 -13 4 -19 16 -11 C 7 -10 1 -4 1 5 C 1 11 5 16 11 18 C 0 19 -11 12 -13 0 Z'
    }
  ]
});
```

`sunIcon` and `moonIcon` accept ECharts-style `path://...` and `image://...` strings, or objects such as `{ path, image, size, offset, style }`. Custom moving icons use the same arc enter animation as the solid sun/moon line.

### Nested Circle

`echarts-nested-circle` draws bottom-aligned nested-circle roadmap diagrams. Data is ordered from the smallest inner circle to the largest outer circle, and each circle accepts `children` or `items` for the text labels inside that visible layer.

```js
import * as echarts from 'echarts';
import 'echarts-nested-circle';

const chart = echarts.init(document.getElementById('main'));
chart.setOption({
  series: [
    {
      type: 'nestedCircle',
      data: [
        {
          name: 'Mathematics & Statistics',
          children: ['Probability Theory', 'Linear Algebra', 'Calculus']
        },
        {
          name: 'Python',
          children: ['Syntax', 'Pandas', 'NumPy', 'Scikit-Learn']
        },
        {
          name: 'SQL',
          children: ['Joins, Subqueries', 'Window Functions', 'Query Optimization']
        },
        {
          name: 'Data Visualization',
          children: ['Plotly', 'Seaborn', 'Tableau', 'Matplotlib']
        }
      ],
      centerRadiusRatio: 0.3,
      label: { show: true },
      titleLabel: { show: true }
    }
  ]
});
```

### Mosaic

`echarts-mosaic` draws categorical mosaic plots. Columns are sized by the first category total, then each column is split vertically by the second category's conditional value.

```js
import * as echarts from 'echarts';
import 'echarts-mosaic';

const chart = echarts.init(document.getElementById('main'));
chart.setOption({
  series: [
    {
      type: 'mosaic',
      xField: 'device',
      yField: 'browser',
      valueField: 'users',
      data: [
        { device: 'Desktop', browser: 'Chrome', users: 50 },
        { device: 'Desktop', browser: 'Safari', users: 10 },
        { device: 'Mobile', browser: 'Chrome', users: 35 },
        { device: 'Mobile', browser: 'Safari', users: 30 }
      ],
      gap: 2,
      label: {
        show: true,
        formatter: '{x}\n{y}: {c}'
      }
    }
  ]
});
```

### Flame

`echarts-flame` draws hierarchical flame graphs. Node width is proportional to `value`; parent values are inferred from children when omitted, and an explicit parent value larger than its children leaves visible self-time space.

```js
import * as echarts from 'echarts';
import 'echarts-flame';

const partitionData = await fetch(
  'https://raw.githubusercontent.com/antvis/G2/refs/heads/v5/__tests__/data/partition.json'
).then((response) => response.json());

const chart = echarts.init(document.getElementById('main'));
chart.setOption({
  series: [
    {
      type: 'flame',
      data: partitionData,
      orient: 'up',
      rootVisible: false,
      gap: 1,
      label: {
        show: true,
        formatter: '{b}'
      }
    }
  ]
});
```

### Subway

`echarts-subway` draws schematic subway route maps with route polylines, station circles, transfer stations, station labels, and optional route labels. It does not use a map coordinate system or base map.

```js
import * as echarts from 'echarts';
import 'echarts-subway';

const chart = echarts.init(document.getElementById('main'));
chart.setOption({
  series: [
    {
      type: 'subway',
      lineWidth: 9,
      stationRadius: 4,
      interchangeRadius: 8,
      data: [
        {
          id: 'line1',
          name: '1号线',
          color: '#d51f2a',
          stations: [
            { id: 'xianghu', name: '湘湖', coord: [0, 120] },
            { id: 'fengqi', name: '凤起路', coord: [80, 70] },
            { id: 'east', name: '火车东站', coord: [180, 70] }
          ]
        },
        {
          id: 'line2',
          name: '2号线',
          color: '#f5a623',
          stations: [
            { id: 'liangzhu', name: '良渚', coord: [20, 0] },
            { id: 'fengqi', name: '凤起路', coord: [80, 70] },
            { id: 'chaoyang', name: '朝阳', coord: [160, 150] }
          ]
        }
      ],
      label: { show: true },
      routeLabel: { show: true }
    }
  ]
});
```

### Beeswarm

`echarts-beeswarm` packs individual values into category lanes while keeping circular marks from overlapping. Use `orient: 'horizontal'` for value-on-x swarms or `orient: 'vertical'` for value-on-y swarms.

```js
import * as echarts from 'echarts';
import 'echarts-beeswarm';

const chart = echarts.init(document.getElementById('main'));
chart.setOption({
  series: [
    {
      type: 'beeswarm',
      data: [
        { team: 'Design', score: 62, name: 'D-01' },
        { team: 'Design', score: 64, name: 'D-02' },
        { team: 'Engineering', score: 71, name: 'E-01' },
        { team: 'Engineering', score: 72, name: 'E-02' }
      ],
      categoryField: 'team',
      valueField: 'score',
      nameField: 'name',
      categories: ['Design', 'Engineering'],
      symbolSize: 14,
      collisionPadding: 2
    }
  ]
});
```

### Vector Field

`echarts-vector-field` draws `[x, y, u, v]` or object-based wind vectors as north-up arrows. The bundled demo fetches the AntV wind fixture from `https://gw.alipayobjects.com/os/antfincdn/F5VcgnqRku/wind.json`.

```js
import * as echarts from 'echarts';
import 'echarts-vector-field';

const wind = await fetch(
  'https://gw.alipayobjects.com/os/antfincdn/F5VcgnqRku/wind.json'
).then((response) => response.json());

const chart = echarts.init(document.getElementById('main'));
chart.setOption({
  series: [
    {
      type: 'vectorField',
      data: wind,
      xField: 'longitude',
      yField: 'latitude',
      uField: 'u',
      vField: 'v',
      samplingStep: 3,
      maxLength: 13,
      lineStyle: {
        color: '#1d4ed8',
        width: 1.15,
        opacity: 0.88
      }
    }
  ]
});
```

### Pack Bubble

`echarts-pack-bubble` draws flat, value-sized circles using a deterministic local packing layout. It supports `gap`, `minRadius`, `maxRadius`, `fillRatio`, `valueField`, `nameField`, `categoryField`, `colors`, and labels that can be hidden below a radius threshold with `label.minRadius`.

```js
import * as echarts from 'echarts';
import 'echarts-pack-bubble';

const chart = echarts.init(document.getElementById('main'));
chart.setOption({
  backgroundColor: '#151515',
  series: [
    {
      type: 'packBubble',
      width: '96%',
      height: '90%',
      padding: 24,
      gap: 2,
      maxRadius: 76,
      fillRatio: 0.72,
      categoryField: 'region',
      data: [
        { name: 'China', value: 1412, region: 'Asia' },
        { name: 'India', value: 1408, region: 'Asia' },
        { name: 'USA', value: 335, region: 'North America' },
        { name: 'Indonesia', value: 281, region: 'Asia' }
      ],
      itemStyle: {
        opacity: 0.9,
        borderColor: 'rgba(255, 255, 255, 0.56)',
        borderWidth: 1.3
      },
      label: {
        show: true,
        minRadius: 28
      }
    }
  ]
});
```

### Venn

`echarts-venn` supports two layout modes:

- `layout: 'hollow'` draws two or three set circles as thick outlines and positions labels in the set/intersection regions.
- `layout: 'bubble'` draws translucent, value-sized overlapping circles for bubble-style Venn views.

```js
import * as echarts from 'echarts';
import 'echarts-venn';

const chart = echarts.init(document.getElementById('main'));
chart.setOption({
  legend: {
    data: ['A', 'B', 'C', 'A&B', 'A&C', 'B&C', 'A&B&C']
  },
  series: [
    {
      type: 'venn',
      layout: 'hollow',
      data: [
        { name: 'A', sets: ['A'], value: 100 },
        { name: 'B', sets: ['B'], value: 96 },
        { name: 'C', sets: ['C'], value: 82 },
        { name: 'A&B', sets: ['A', 'B'], value: 34 },
        { name: 'A&C', sets: ['A', 'C'], value: 24 },
        { name: 'B&C', sets: ['B', 'C'], value: 20 },
        { name: 'A&B&C', sets: ['A', 'B', 'C'], value: 12 }
      ],
      hollowStyle: {
        borderWidth: 6
      },
      label: {
        show: true
      }
    }
  ]
});
```

```js
chart.setOption({
  series: [
    {
      type: 'venn',
      layout: 'bubble',
      data: [
        { name: 'Radiohead', value: 100 },
        { name: 'Kanye West', value: 64 },
        { name: 'The Beatles', value: 58 },
        { name: 'Pink Floyd', value: 44 }
      ],
      itemStyle: {
        opacity: 0.6
      },
      label: {
        show: true
      }
    }
  ]
});
```

## Visual Regression

The repository includes ECharts SVG SSR visual baselines for the implemented extension charts.

```bash
npm run test:visual
```

To intentionally accept a visual change:

```bash
npm run test:visual:update
```
