import * as echarts from 'echarts/lib/echarts';
import { installGraphLayout } from '@echarts-extension/layout-core';

installGraphLayout(echarts, {
  chartType: 'arc',
  layoutType: 'arc'
});
