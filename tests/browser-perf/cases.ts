export const browserPerfCases = [
  ['echarts-radial', '/docs/packages/echarts-radial/large.html'],
  ['echarts-concentric', '/docs/packages/echarts-concentric/large.html'],
  ['echarts-grid', '/docs/packages/echarts-grid/large.html'],
  ['echarts-mds', '/docs/packages/echarts-mds/large.html'],
  ['echarts-arc', '/docs/packages/echarts-arc/large.html'],
  ['echarts-radial-area', '/docs/packages/echarts-radial-area/large.html'],
  ['echarts-radial-boxplot', '/docs/packages/echarts-radial-boxplot/large.html'],
  ['echarts-venn', '/docs/packages/echarts-venn/large.html'],
  ['echarts-pack-bubble', '/docs/packages/echarts-pack-bubble/large.html'],
  ['echarts-circle-packing', '/docs/packages/echarts-circle-packing/large.html'],
  ['echarts-nested-circle', '/docs/packages/echarts-nested-circle/large.html'],
  ['echarts-mosaic', '/docs/packages/echarts-mosaic/large.html'],
  ['echarts-voronoi-treemap', '/docs/packages/echarts-voronoi-treemap/large.html'],
  ['echarts-subway', '/docs/packages/echarts-subway/large.html'],
  ['echarts-sequence-diagram', '/docs/packages/echarts-sequence-diagram/large.html'],
  ['echarts-flame', '/docs/packages/echarts-flame/large.html'],
  ['echarts-sunrise-sunset', '/docs/packages/echarts-sunrise-sunset/large.html'],
  ['echarts-lollipop', '/docs/packages/echarts-lollipop/large.html'],
  ['echarts-beeswarm', '/docs/packages/echarts-beeswarm/large.html'],
  ['echarts-spiral', '/docs/packages/echarts-spiral/large.html'],
  ['echarts-smith', '/docs/packages/echarts-smith/large.html'],
  ['echarts-vector-field', '/docs/packages/echarts-vector-field/large.html']
].map(([name, path]) => ({
  name,
  path,
  readySelector: '#chart canvas, #chart svg',
  resultExpression: 'window.__ECHARTS_EXTENSION_PERF__?.ready'
}));
