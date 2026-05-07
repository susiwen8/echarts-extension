export const browserPerfCases = [
  ['echarts-radial', '/packages/echarts-radial/examples/large.html'],
  ['echarts-concentric', '/packages/echarts-concentric/examples/large.html'],
  ['echarts-grid', '/packages/echarts-grid/examples/large.html'],
  ['echarts-mds', '/packages/echarts-mds/examples/large.html'],
  ['echarts-arc', '/packages/echarts-arc/examples/large.html'],
  ['echarts-radial-area', '/packages/echarts-radial-area/examples/large.html'],
  ['echarts-radial-boxplot', '/packages/echarts-radial-boxplot/examples/large.html'],
  ['echarts-venn', '/packages/echarts-venn/examples/large.html'],
  ['echarts-pack-bubble', '/packages/echarts-pack-bubble/examples/large.html'],
  ['echarts-circle-packing', '/packages/echarts-circle-packing/examples/large.html'],
  ['echarts-nested-circle', '/packages/echarts-nested-circle/examples/large.html'],
  ['echarts-mosaic', '/packages/echarts-mosaic/examples/large.html'],
  ['echarts-voronoi-treemap', '/packages/echarts-voronoi-treemap/examples/large.html'],
  ['echarts-subway', '/packages/echarts-subway/examples/large.html'],
  ['echarts-flame', '/packages/echarts-flame/examples/large.html'],
  ['echarts-sunrise-sunset', '/packages/echarts-sunrise-sunset/examples/large.html'],
  ['echarts-lollipop', '/packages/echarts-lollipop/examples/large.html'],
  ['echarts-beeswarm', '/packages/echarts-beeswarm/examples/large.html'],
  ['echarts-spiral', '/packages/echarts-spiral/examples/large.html'],
  ['echarts-vector-field', '/packages/echarts-vector-field/examples/large.html']
].map(([name, path]) => ({
  name,
  path,
  readySelector: '#chart canvas, #chart svg',
  resultExpression: 'window.__ECHARTS_EXTENSION_PERF__?.ready'
}));
