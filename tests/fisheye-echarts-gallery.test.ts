import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { test } from 'vitest';

import * as echarts from 'echarts/lib/echarts';
import {
  BarChart,
  BoxplotChart,
  CandlestickChart,
  ChordChart,
  CustomChart,
  EffectScatterChart,
  FunnelChart,
  GaugeChart,
  GraphChart,
  HeatmapChart,
  LineChart,
  LinesChart,
  MapChart,
  ParallelChart,
  PictorialBarChart,
  PieChart,
  RadarChart,
  SankeyChart,
  ScatterChart,
  SunburstChart,
  ThemeRiverChart,
  TreeChart,
  TreemapChart
} from 'echarts/charts';
import {
  GridComponent,
  LegendComponent,
  ParallelComponent,
  RadarComponent,
  SingleAxisComponent,
  TitleComponent,
  TooltipComponent,
  VisualMapComponent
} from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';

import '@echarts-extension/fisheye';

echarts.use([
  SVGRenderer,
  BarChart,
  BoxplotChart,
  CandlestickChart,
  ChordChart,
  CustomChart,
  EffectScatterChart,
  FunnelChart,
  GaugeChart,
  GraphChart,
  HeatmapChart,
  LineChart,
  LinesChart,
  MapChart,
  ParallelChart,
  PictorialBarChart,
  PieChart,
  RadarChart,
  SankeyChart,
  ScatterChart,
  SunburstChart,
  ThemeRiverChart,
  TreeChart,
  TreemapChart,
  GridComponent,
  LegendComponent,
  ParallelComponent,
  RadarComponent,
  SingleAxisComponent,
  TitleComponent,
  TooltipComponent,
  VisualMapComponent
]);

function loadGalleryNamespace() {
  const window = {
    echarts,
    document: {
      addEventListener() {},
      documentElement: { lang: 'en' }
    }
  };
  runInNewContext(readFileSync(new URL('../docs/shared/fisheye-echarts-gallery.js', import.meta.url), 'utf8'), { window });
  return window.EChartsFisheyeGallery;
}

test('fisheye gallery covers every built-in ECharts chart type', () => {
  const namespace = loadGalleryNamespace();

  assert.deepEqual(Array.from(namespace.chartCases, (chartCase) => chartCase.id), [
    'line',
    'bar',
    'pie',
    'scatter',
    'effect-scatter',
    'radar',
    'map',
    'tree',
    'treemap',
    'graph',
    'chord',
    'gauge',
    'funnel',
    'parallel',
    'sankey',
    'boxplot',
    'candlestick',
    'lines',
    'heatmap',
    'pictorial-bar',
    'theme-river',
    'sunburst',
    'custom'
  ]);
});

test('all built-in ECharts chart fisheye examples render without throwing', () => {
  const namespace = loadGalleryNamespace();
  const failures = [];

  for (const chartCase of namespace.chartCases) {
    try {
      chartCase.setup?.(echarts);
      const chart = echarts.init(null, null, {
        renderer: 'svg',
        ssr: true,
        width: 360,
        height: 240
      });
      chart.setOption(namespace.createOption(chartCase), {
        notMerge: true,
        lazyUpdate: false
      });
      const displayList = chart.getZr().storage.getDisplayList();
      if (displayList.length < 2) failures.push(`${chartCase.id}: empty display list`);
      assert.ok(chart.getModel().getComponent('fisheye'), `${chartCase.id} should register fisheye component`);
      chart.dispose();
    } catch (error) {
      failures.push(`${chartCase.id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  assert.deepEqual(failures, []);
});
