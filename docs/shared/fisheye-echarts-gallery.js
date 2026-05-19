(function (root) {
  const namespace = root.EChartsFisheyeGallery = root.EChartsFisheyeGallery || {};
  const demoMapName = 'fisheye-demo-map';
  let demoMapRegistered = false;

  const chartCases = [
    {
      id: 'line',
      label: 'Line',
      option: () => cartesianOption({
        series: [{ type: 'line', smooth: true, symbolSize: 8, data: [12, 22, 18, 34, 29, 42, 36] }]
      })
    },
    {
      id: 'bar',
      label: 'Bar',
      option: () => cartesianOption({
        series: [{ type: 'bar', data: [18, 31, 24, 39, 33, 46, 41], itemStyle: { borderRadius: [4, 4, 0, 0] } }]
      })
    },
    {
      id: 'pie',
      label: 'Pie',
      option: () => ({
        series: [{
          type: 'pie',
          radius: ['34%', '70%'],
          center: ['50%', '52%'],
          data: namedValues([32, 24, 18, 14, 12]),
          label: { fontSize: 10 }
        }]
      })
    },
    {
      id: 'scatter',
      label: 'Scatter',
      option: () => cartesianOption({
        series: [{
          type: 'scatter',
          symbolSize: (value) => Math.max(8, value[2]),
          data: [
            [0, 12, 10], [1, 23, 14], [2, 18, 12], [3, 35, 20], [4, 28, 18], [5, 42, 24], [6, 36, 22]
          ]
        }]
      })
    },
    {
      id: 'effect-scatter',
      label: 'Effect Scatter',
      option: () => cartesianOption({
        series: [{
          type: 'effectScatter',
          symbolSize: 13,
          rippleEffect: { scale: 2.4 },
          data: [[0, 10], [1, 28], [2, 18], [3, 38], [4, 30], [5, 46]]
        }]
      })
    },
    {
      id: 'radar',
      label: 'Radar',
      option: () => ({
        radar: {
          radius: '68%',
          indicator: ['Speed', 'Cost', 'Quality', 'Scale', 'Risk'].map((name) => ({ name, max: 100 }))
        },
        series: [{ type: 'radar', data: [{ value: [78, 62, 88, 72, 46], name: 'Plan' }], areaStyle: { opacity: 0.18 } }]
      })
    },
    {
      id: 'map',
      label: 'Map',
      setup: registerDemoMap,
      option: () => ({
        visualMap: { show: false, min: 0, max: 100 },
        series: [{
          type: 'map',
          map: demoMapName,
          roam: false,
          label: { show: true, fontSize: 10 },
          data: [
            { name: 'North', value: 48 },
            { name: 'South', value: 72 }
          ]
        }]
      })
    },
    {
      id: 'tree',
      label: 'Tree',
      option: () => ({
        series: [{
          type: 'tree',
          left: '12%',
          right: '18%',
          top: '12%',
          bottom: '12%',
          symbolSize: 9,
          label: { fontSize: 10 },
          data: [{
            name: 'Root',
            children: [
              { name: 'Alpha', children: [{ name: 'A1' }, { name: 'A2' }] },
              { name: 'Beta', children: [{ name: 'B1' }, { name: 'B2' }] }
            ]
          }]
        }]
      })
    },
    {
      id: 'treemap',
      label: 'Treemap',
      option: () => ({
        series: [{
          type: 'treemap',
          roam: false,
          nodeClick: false,
          breadcrumb: { show: false },
          label: { fontSize: 10 },
          data: namedValues([26, 18, 16, 13, 9])
        }]
      })
    },
    {
      id: 'graph',
      label: 'Graph',
      option: () => ({
        series: [{
          type: 'graph',
          layout: 'none',
          roam: false,
          symbolSize: 22,
          label: { show: true, fontSize: 10 },
          data: [
            { name: 'A', x: 90, y: 80 },
            { name: 'B', x: 190, y: 54 },
            { name: 'C', x: 260, y: 138 },
            { name: 'D', x: 145, y: 178 }
          ],
          links: [
            { source: 'A', target: 'B' },
            { source: 'B', target: 'C' },
            { source: 'C', target: 'D' },
            { source: 'D', target: 'A' }
          ]
        }]
      })
    },
    {
      id: 'chord',
      label: 'Chord',
      option: () => ({
        series: [{
          type: 'chord',
          radius: ['62%', '76%'],
          data: ['Alpha', 'Beta', 'Gamma', 'Delta'].map((name) => ({ name })),
          links: [
            { source: 'Alpha', target: 'Beta', value: 8 },
            { source: 'Alpha', target: 'Gamma', value: 5 },
            { source: 'Beta', target: 'Delta', value: 6 },
            { source: 'Gamma', target: 'Delta', value: 4 }
          ],
          label: { fontSize: 10 }
        }]
      })
    },
    {
      id: 'gauge',
      label: 'Gauge',
      option: () => ({
        series: [{
          type: 'gauge',
          progress: { show: true, width: 12 },
          axisLine: { lineStyle: { width: 12 } },
          detail: { fontSize: 18, formatter: '{value}%' },
          data: [{ value: 68, name: 'Load' }]
        }]
      })
    },
    {
      id: 'funnel',
      label: 'Funnel',
      option: () => ({
        series: [{
          type: 'funnel',
          top: 24,
          bottom: 18,
          left: '18%',
          width: '64%',
          label: { fontSize: 10 },
          data: namedValues([100, 82, 61, 38, 21])
        }]
      })
    },
    {
      id: 'parallel',
      label: 'Parallel',
      option: () => ({
        parallelAxis: [
          { dim: 0, min: 0, max: 100 },
          { dim: 1, min: 0, max: 100 },
          { dim: 2, min: 0, max: 100 },
          { dim: 3, min: 0, max: 100 }
        ],
        parallel: { left: 32, right: 28, top: 28, bottom: 30 },
        series: [{
          type: 'parallel',
          lineStyle: { width: 2 },
          data: [[18, 72, 48, 84], [36, 58, 72, 64], [70, 42, 66, 38], [88, 76, 32, 56]]
        }]
      })
    },
    {
      id: 'sankey',
      label: 'Sankey',
      option: () => ({
        series: [{
          type: 'sankey',
          nodeWidth: 12,
          nodeGap: 8,
          label: { fontSize: 10 },
          data: ['Source', 'Alpha', 'Beta', 'Done'].map((name) => ({ name })),
          links: [
            { source: 'Source', target: 'Alpha', value: 8 },
            { source: 'Source', target: 'Beta', value: 6 },
            { source: 'Alpha', target: 'Done', value: 7 },
            { source: 'Beta', target: 'Done', value: 5 }
          ]
        }]
      })
    },
    {
      id: 'boxplot',
      label: 'Boxplot',
      option: () => cartesianOption({
        xAxis: { type: 'category', data: ['A', 'B', 'C', 'D'] },
        yAxis: { type: 'value', min: 0, max: 80 },
        series: [{ type: 'boxplot', data: [[10, 18, 30, 42, 58], [12, 22, 34, 48, 62], [8, 16, 25, 36, 54], [18, 28, 40, 51, 70]] }]
      })
    },
    {
      id: 'candlestick',
      label: 'Candlestick',
      option: () => cartesianOption({
        xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
        yAxis: { type: 'value', min: 20, max: 70 },
        series: [{ type: 'candlestick', data: [[32, 44, 28, 48], [45, 39, 34, 52], [38, 54, 36, 58], [52, 47, 42, 60], [48, 62, 45, 66]] }]
      })
    },
    {
      id: 'lines',
      label: 'Lines',
      option: () => cartesianOption({
        xAxis: { type: 'value', min: 0, max: 100 },
        yAxis: { type: 'value', min: 0, max: 100 },
        series: [{
          type: 'lines',
          coordinateSystem: 'cartesian2d',
          effect: { show: true, symbolSize: 5 },
          lineStyle: { width: 2, curveness: 0.2 },
          data: [
            { coords: [[8, 24], [42, 72], [86, 48]] },
            { coords: [[18, 78], [48, 36], [92, 66]] }
          ]
        }]
      })
    },
    {
      id: 'heatmap',
      label: 'Heatmap',
      option: () => ({
        grid: { left: 34, right: 20, top: 24, bottom: 30 },
        xAxis: { type: 'category', data: ['A', 'B', 'C', 'D', 'E'] },
        yAxis: { type: 'category', data: ['Q1', 'Q2', 'Q3', 'Q4'] },
        visualMap: { show: false, min: 0, max: 100 },
        series: [{
          type: 'heatmap',
          data: Array.from({ length: 20 }, (_, index) => [index % 5, Math.floor(index / 5), (index * 17) % 100])
        }]
      })
    },
    {
      id: 'pictorial-bar',
      label: 'Pictorial Bar',
      option: () => cartesianOption({
        series: [{
          type: 'pictorialBar',
          symbol: 'roundRect',
          symbolRepeat: true,
          symbolSize: [12, 8],
          data: [16, 28, 24, 36, 31, 42, 38]
        }]
      })
    },
    {
      id: 'theme-river',
      label: 'ThemeRiver',
      option: () => ({
        singleAxis: { type: 'time', left: 36, right: 24, top: 24, bottom: 32 },
        series: [{
          type: 'themeRiver',
          data: [
            ['2026/05/01', 10, 'Alpha'], ['2026/05/02', 16, 'Alpha'], ['2026/05/03', 13, 'Alpha'], ['2026/05/04', 20, 'Alpha'],
            ['2026/05/01', 8, 'Beta'], ['2026/05/02', 12, 'Beta'], ['2026/05/03', 18, 'Beta'], ['2026/05/04', 15, 'Beta'],
            ['2026/05/01', 6, 'Gamma'], ['2026/05/02', 10, 'Gamma'], ['2026/05/03', 9, 'Gamma'], ['2026/05/04', 14, 'Gamma']
          ]
        }]
      })
    },
    {
      id: 'sunburst',
      label: 'Sunburst',
      option: () => ({
        series: [{
          type: 'sunburst',
          radius: ['12%', '82%'],
          label: { fontSize: 10 },
          data: [
            { name: 'Alpha', value: 8, children: [{ name: 'A1', value: 4 }, { name: 'A2', value: 4 }] },
            { name: 'Beta', value: 7, children: [{ name: 'B1', value: 3 }, { name: 'B2', value: 4 }] }
          ]
        }]
      })
    },
    {
      id: 'custom',
      label: 'Custom',
      option: () => cartesianOption({
        series: [{
          type: 'custom',
          renderItem(params, api) {
            const categoryIndex = api.value(0);
            const start = api.coord([categoryIndex, api.value(1)]);
            const end = api.coord([categoryIndex, api.value(2)]);
            const size = api.size([0, 1]);
            const rect = root.echarts.graphic.clipRectByRect({
              x: start[0] - size[0] * 0.28,
              y: end[1],
              width: size[0] * 0.56,
              height: start[1] - end[1]
            }, {
              x: params.coordSys.x,
              y: params.coordSys.y,
              width: params.coordSys.width,
              height: params.coordSys.height
            });
            return rect && { type: 'rect', shape: rect, style: api.style() };
          },
          encode: { x: 0, y: [1, 2] },
          data: [[0, 8, 20], [1, 12, 34], [2, 16, 28], [3, 18, 42], [4, 14, 36]]
        }]
      })
    }
  ];

  function cartesianOption(patch) {
    return {
      grid: { left: 34, right: 22, top: 24, bottom: 32 },
      xAxis: { type: 'category', data: ['A', 'B', 'C', 'D', 'E', 'F', 'G'] },
      yAxis: { type: 'value' },
      ...patch
    };
  }

  function namedValues(values) {
    const names = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta'];
    return values.map((value, index) => ({ name: names[index], value }));
  }

  function createOption(chartCase) {
    const option = chartCase.option();
    return {
      animation: false,
      backgroundColor: '#ffffff',
      color: ['#2f83ed', '#20a37a', '#f59e0b', '#c4554d', '#7566f1', '#28c3c7'],
      tooltip: { trigger: 'item', confine: true },
      fisheye: {
        show: true,
        radius: 88,
        scale: 2.25,
        stroke: '#1f2937',
        strokeWidth: 2,
        opacity: 0.82,
        preview: false
      },
      ...option
    };
  }

  function registerDemoMap(echarts) {
    if (demoMapRegistered || !echarts?.registerMap) return;
    echarts.registerMap(demoMapName, {
      type: 'FeatureCollection',
      features: [
        polygonFeature('North', [[0, 0], [12, 0], [12, 9], [0, 9], [0, 0]]),
        polygonFeature('South', [[0, -10], [12, -10], [12, -1], [0, -1], [0, -10]])
      ]
    });
    demoMapRegistered = true;
  }

  function polygonFeature(name, coordinates) {
    return {
      type: 'Feature',
      properties: { name },
      geometry: {
        type: 'Polygon',
        coordinates: [coordinates]
      }
    };
  }

  function mount(selector = '[data-fisheye-echarts-gallery]') {
    const container = root.document?.querySelector?.(selector);
    if (!container || !root.echarts) return [];
    return chartCases.map((chartCase) => mountCase(container, chartCase));
  }

  function mountCase(container, chartCase) {
    const card = root.document.createElement('article');
    card.className = 'fisheye-chart-card';
    card.dataset.chartType = chartCase.id;

    const title = root.document.createElement('h2');
    title.textContent = labelFor(chartCase);

    const chartElement = root.document.createElement('div');
    chartElement.className = 'fisheye-chart-card__chart';
    chartElement.setAttribute('aria-label', `${labelFor(chartCase)} fisheye example`);

    const status = root.document.createElement('span');
    status.className = 'fisheye-chart-card__status';
    status.textContent = 'ready';

    card.append(title, chartElement, status);
    container.append(card);

    try {
      chartCase.setup?.(root.echarts);
      const chart = root.echarts.init(chartElement);
      chart.setOption(createOption(chartCase), { notMerge: true, lazyUpdate: false });
      status.textContent = 'ok';
      return { id: chartCase.id, chart, error: null };
    } catch (error) {
      card.classList.add('fisheye-chart-card--error');
      status.textContent = error?.message || 'error';
      return { id: chartCase.id, chart: null, error };
    }
  }

  function labelFor(chartCase) {
    if (!String(root.document?.documentElement?.lang || '').toLowerCase().startsWith('zh')) return chartCase.label;
    return zhLabels[chartCase.id] || chartCase.label;
  }

  const zhLabels = {
    line: '折线图',
    bar: '柱状图',
    pie: '饼图',
    scatter: '散点图',
    'effect-scatter': '涟漪散点图',
    radar: '雷达图',
    map: '地图',
    tree: '树图',
    treemap: '矩形树图',
    graph: '关系图',
    chord: '和弦图',
    gauge: '仪表盘',
    funnel: '漏斗图',
    parallel: '平行坐标',
    sankey: '桑基图',
    boxplot: '箱线图',
    candlestick: 'K 线图',
    lines: '路径图',
    heatmap: '热力图',
    'pictorial-bar': '象形柱图',
    'theme-river': '主题河流图',
    sunburst: '旭日图',
    custom: '自定义系列'
  };

  namespace.chartCases = chartCases;
  namespace.createOption = createOption;
  namespace.mount = mount;
  namespace.registerDemoMap = registerDemoMap;

  root.document?.addEventListener?.('DOMContentLoaded', () => {
    mount();
  });
})(window);
