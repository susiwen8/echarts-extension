import * as echarts from 'echarts/lib/echarts';

import {
  ALGORITHM_SORT_LABELS,
  createAlgorithmSortDataSource,
  finiteNumber,
  resolveAlgorithmSortLayout
} from './layout.js';
import type {
  AlgorithmSortBar,
  AlgorithmSortBarState,
  AlgorithmSortLayoutOption,
  AlgorithmSortLayoutResult
} from './layout.js';

interface ViewRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface EChartsApi {
  getWidth(): number;
  getHeight(): number;
}

interface EChartsModel {
  get(path: string | string[]): unknown;
  getModel(path: string | string[]): EChartsModel;
}

interface SeriesData {
  dataType?: unknown;
  initData(source: unknown[]): void;
  count(): number;
  getItemModel(index: number): EChartsModel;
  getItemVisual(dataIndex: number, key: string): unknown;
  getItemLayout(dataIndex: number): unknown;
  setItemLayout(dataIndex: number, layout: [number, number]): void;
  setItemGraphicEl(dataIndex: number, element: GraphicElement): void;
}

interface AlgorithmSortSeriesModel extends EChartsModel {
  option?: AlgorithmSortLayoutOption;
  seriesIndex: number;
  getBoxLayoutParams(): unknown;
  getData(): SeriesData;
}

interface GraphicElement {
  [key: string]: unknown;
}

interface GraphicGroup extends GraphicElement {
  x?: number;
  y?: number;
  add(element: GraphicElement): void;
  removeAll(): void;
}

interface GraphicElementOptions {
  shape?: Record<string, unknown>;
  style?: Record<string, unknown>;
  silent?: boolean;
  z2?: number;
}

interface EChartsHost {
  extendSeriesModel(option: Record<string, unknown>): void;
  extendChartView(option: Record<string, unknown>): void;
  helper: {
    createDimensions(source: unknown[], options: Record<string, unknown>): unknown;
    getECData(element: GraphicElement): {
      dataIndex?: number;
      dataType?: unknown;
      seriesIndex?: number;
      ssrType?: string;
    };
    getLayoutRect(params: unknown, container: { width: number; height: number }): ViewRect;
  };
  List: new (dimensions: unknown, host: AlgorithmSortSeriesModel) => SeriesData;
  graphic: {
    Group: new () => GraphicGroup;
    Line: new (options: GraphicElementOptions) => GraphicElement;
    Rect: new (options: GraphicElementOptions) => GraphicElement;
    Text: new (options: GraphicElementOptions) => GraphicElement;
  };
}

interface AlgorithmSortChartView {
  group: GraphicGroup;
}

const echartsHost = echarts as unknown as EChartsHost;
const optionKeys = [
  'padding',
  'algorithm',
  'order',
  'valueField',
  'nameField',
  'dimensions',
  'currentStep',
  'progress',
  'maxItems',
  'maxFrames',
  'tickCount',
  'barWidth',
  'min',
  'max',
  'nice',
  'values'
] as const satisfies ReadonlyArray<Extract<keyof AlgorithmSortLayoutOption, string>>;

const layerZ = {
  grid: 0,
  range: 1,
  bar: 6,
  label: 8,
  step: 9
} as const;

const stateColors: Record<AlgorithmSortBarState, string> = {
  default: '#5f7eea',
  compare: '#f59e0b',
  swap: '#ef4444',
  write: '#14b8a6',
  pivot: '#8b5cf6',
  sorted: '#22c55e'
};

echartsHost.extendSeriesModel({
  type: 'series.algorithmSort',

  visualStyleAccessPath: 'itemStyle',
  visualDrawType: 'fill',

  getInitialData(this: AlgorithmSortSeriesModel, option: AlgorithmSortLayoutOption) {
    const source = createAlgorithmSortDataSource(option);
    const dimensions = echartsHost.helper.createDimensions(source, {
      coordDimensions: ['value']
    });
    const list = new echartsHost.List(dimensions, this);
    list.initData(source);
    return list;
  },

  getTooltipPosition(this: AlgorithmSortSeriesModel, dataIndex: number) {
    const layout = this.getData().getItemLayout(dataIndex);
    return Array.isArray(layout) ? layout : undefined;
  },

  defaultOption: {
    left: 'center',
    top: 'center',
    width: '94%',
    height: '86%',
    padding: {
      top: 54,
      right: 34,
      bottom: 76,
      left: 62
    },
    algorithm: 'bubble',
    order: 'ascending',
    valueField: 'value',
    nameField: 'name',
    dimensions: null,
    currentStep: 0,
    progress: null,
    maxItems: 96,
    maxFrames: 5000,
    tickCount: 5,
    barWidth: null,
    min: null,
    max: null,
    nice: true,
    grid: {
      show: true
    },
    valueAxis: {
      show: true,
      label: {
        show: true,
        color: '#64748b',
        fontSize: 12,
        fontWeight: 650,
        formatter: '{value}'
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: '#e5e7eb',
          width: 1,
          opacity: 1
        }
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: '#94a3b8',
          width: 1.2,
          opacity: 1
        }
      }
    },
    categoryAxis: {
      show: true,
      label: {
        show: true,
        color: '#64748b',
        fontSize: 11,
        fontWeight: 650,
        rotate: 0
      }
    },
    itemStyle: {
      color: '#5f7eea',
      opacity: 0.9,
      borderColor: '#ffffff',
      borderWidth: 1
    },
    stateStyle: {
      compare: { color: '#f59e0b' },
      swap: { color: '#ef4444' },
      write: { color: '#14b8a6' },
      pivot: { color: '#8b5cf6' },
      sorted: { color: '#22c55e' }
    },
    rangeStyle: {
      color: '#dbeafe',
      opacity: 0.5
    },
    label: {
      show: false,
      color: '#0f172a',
      fontSize: 11,
      fontWeight: 700,
      formatter: '{c}'
    },
    stepLabel: {
      show: true,
      color: '#0f172a',
      mutedColor: '#64748b',
      fontSize: 13,
      fontWeight: 720
    },
    tooltip: {
      trigger: 'item'
    }
  }
});

echartsHost.extendChartView({
  type: 'algorithmSort',

  render(this: AlgorithmSortChartView, seriesModel: AlgorithmSortSeriesModel, ecModel: unknown, api: EChartsApi) {
    const group = this.group;
    group.removeAll();

    try {
      const rect = echartsHost.helper.getLayoutRect(seriesModel.getBoxLayoutParams(), {
        width: api.getWidth(),
        height: api.getHeight()
      });
      const layout = resolveAlgorithmSortLayout(readLayoutOption(seriesModel, rect));
      drawAlgorithmSort(echartsHost, group, seriesModel, layout, rect);
    } catch (error) {
      console.error('[algorithm-sort] render failed', error);
    }
  },

  remove(this: AlgorithmSortChartView) {
    this.group.removeAll();
  },

  dispose(this: AlgorithmSortChartView) {
    this.group.removeAll();
  }
});

function readLayoutOption(seriesModel: AlgorithmSortSeriesModel, rect: ViewRect): AlgorithmSortLayoutOption {
  const option = seriesModel.option || {};
  const layoutOption: AlgorithmSortLayoutOption = {
    data: option.data,
    layout: seriesModel.get('layout'),
    layoutOptions: seriesModel.get('layoutOptions') || {},
    width: rect.width,
    height: rect.height
  };

  optionKeys.forEach((key) => {
    const value = seriesModel.get(key);
    if (value !== undefined && value !== null) layoutOption[key as string] = value;
  });

  return layoutOption;
}

function drawAlgorithmSort(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: AlgorithmSortSeriesModel,
  layout: AlgorithmSortLayoutResult,
  rect: ViewRect
): void {
  const chartGroup = new echartsInstance.graphic.Group();
  chartGroup.x = rect.x;
  chartGroup.y = rect.y;

  drawGrid(echartsInstance, chartGroup, seriesModel, layout);
  drawRange(echartsInstance, chartGroup, seriesModel, layout);
  drawBars(echartsInstance, chartGroup, seriesModel, layout, rect);
  drawStepLabel(echartsInstance, chartGroup, seriesModel, layout);
  group.add(chartGroup);
}

function drawGrid(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: AlgorithmSortSeriesModel,
  layout: AlgorithmSortLayoutResult
): void {
  const gridModel = seriesModel.getModel('grid');
  const valueAxisModel = seriesModel.getModel('valueAxis');
  const categoryAxisModel = seriesModel.getModel('categoryAxis');
  const splitLineModel = valueAxisModel.getModel('splitLine');
  const axisLineModel = valueAxisModel.getModel('axisLine');
  const valueLabelModel = valueAxisModel.getModel('label');
  const categoryLabelModel = categoryAxisModel.getModel('label');

  if (gridModel.get('show') !== false && splitLineModel.get('show') !== false) {
    layout.ticks.forEach((tick) => {
      group.add(new echartsInstance.graphic.Line({
        shape: { x1: tick.x1, y1: tick.y, x2: tick.x2, y2: tick.y },
        style: readLineStyle(splitLineModel.getModel('lineStyle'), '#e5e7eb', 1),
        silent: true,
        z2: layerZ.grid
      }));
    });
  }

  if (axisLineModel.get('show') !== false) {
    group.add(new echartsInstance.graphic.Line({
      shape: { x1: layout.plot.left, y1: layout.plot.bottom, x2: layout.plot.right, y2: layout.plot.bottom },
      style: readLineStyle(axisLineModel.getModel('lineStyle'), '#94a3b8', 1.2),
      silent: true,
      z2: layerZ.grid
    }));
  }

  if (valueAxisModel.get('show') !== false && valueLabelModel.get('show') !== false) {
    layout.ticks.forEach((tick) => {
      group.add(new echartsInstance.graphic.Text({
        style: {
          x: layout.plot.left - 10,
          y: tick.y,
          text: formatAxisLabel(valueLabelModel.get('formatter'), tick.value),
          fill: valueLabelModel.get('color') || '#64748b',
          fontSize: finiteNumber(valueLabelModel.get('fontSize'), 12),
          fontWeight: valueLabelModel.get('fontWeight') || 650,
          align: 'right',
          verticalAlign: 'middle'
        },
        silent: true,
        z2: layerZ.grid
      }));
    });
  }

  if (categoryAxisModel.get('show') !== false && categoryLabelModel.get('show') !== false) {
    layout.bars.forEach((bar) => {
      const maxChars = Math.max(2, Math.floor(bar.width / 6));
      group.add(new echartsInstance.graphic.Text({
        style: {
          x: bar.x + bar.width / 2,
          y: layout.plot.bottom + 16,
          text: ellipsize(formatAxisLabel(categoryLabelModel.get('formatter'), bar.name), maxChars),
          fill: categoryLabelModel.get('color') || '#64748b',
          fontSize: finiteNumber(categoryLabelModel.get('fontSize'), 11),
          fontWeight: categoryLabelModel.get('fontWeight') || 650,
          align: 'center',
          verticalAlign: 'top'
        },
        silent: true,
        z2: layerZ.label
      }));
    });
  }
}

function drawRange(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: AlgorithmSortSeriesModel,
  layout: AlgorithmSortLayoutResult
): void {
  const range = layout.frame.range;
  if (!range || !layout.bars.length) return;
  const start = Math.max(0, Math.min(range[0], layout.bars.length - 1));
  const end = Math.max(start, Math.min(range[1], layout.bars.length - 1));
  const left = layout.bars[start].x;
  const rightBar = layout.bars[end];
  const right = rightBar.x + rightBar.width;
  const rangeModel = seriesModel.getModel('rangeStyle');
  group.add(new echartsInstance.graphic.Rect({
    shape: {
      x: left - 4,
      y: layout.plot.top,
      width: Math.max(right - left + 8, 1),
      height: layout.plot.height
    },
    style: {
      fill: rangeModel.get('color') || '#dbeafe',
      opacity: finiteNumber(rangeModel.get('opacity'), 0.5)
    },
    silent: true,
    z2: layerZ.range
  }));
}

function drawBars(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: AlgorithmSortSeriesModel,
  layout: AlgorithmSortLayoutResult,
  rect: ViewRect
): void {
  const data = seriesModel.getData();
  const seriesLabelModel = seriesModel.getModel('label');

  layout.bars.forEach((bar) => {
    const itemModel = bar.dataIndex >= 0 && bar.dataIndex < data.count() ? data.getItemModel(bar.dataIndex) : null;
    const barRect = new echartsInstance.graphic.Rect({
      shape: {
        x: bar.x,
        y: bar.y,
        width: bar.width,
        height: bar.height,
        r: Math.min(5, bar.width / 2)
      },
      style: readBarStyle(data, seriesModel, itemModel, bar),
      silent: Boolean(seriesModel.get('silent')),
      z2: layerZ.bar
    });

    if (bar.dataIndex >= 0 && bar.dataIndex < data.count()) {
      data.setItemLayout(bar.dataIndex, [rect.x + bar.x + bar.width / 2, rect.y + bar.y]);
      data.setItemGraphicEl(bar.dataIndex, barRect);
      bindTooltipData(echartsInstance, seriesModel, data, bar.dataIndex, barRect);
    }
    group.add(barRect);

    const itemLabelModel = itemModel?.getModel('label');
    const showLabel = itemLabelModel?.get('show') ?? seriesLabelModel.get('show');
    if (!showLabel) return;
    const valueLabel = new echartsInstance.graphic.Text({
      style: {
        x: bar.x + bar.width / 2,
        y: bar.y - 6,
        text: formatLabel(itemLabelModel?.get('formatter') || seriesLabelModel.get('formatter'), bar),
        fill: itemLabelModel?.get('color') || seriesLabelModel.get('color') || '#0f172a',
        fontSize: finiteNumber(itemLabelModel?.get('fontSize') ?? seriesLabelModel.get('fontSize'), 11),
        fontWeight: itemLabelModel?.get('fontWeight') || seriesLabelModel.get('fontWeight') || 700,
        align: 'center',
        verticalAlign: 'bottom'
      },
      silent: true,
      z2: layerZ.label
    });
    bindTooltipData(echartsInstance, seriesModel, data, bar.dataIndex, valueLabel);
    group.add(valueLabel);
  });
}

function drawStepLabel(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: AlgorithmSortSeriesModel,
  layout: AlgorithmSortLayoutResult
): void {
  const model = seriesModel.getModel('stepLabel');
  if (model.get('show') === false) return;
  const frame = layout.frame;
  const label = `${ALGORITHM_SORT_LABELS[layout.algorithm]} · step ${layout.currentStep}/${layout.maxStep}`;
  const metrics = `compare ${frame.comparisons} · swap ${frame.swaps} · write ${frame.writes}`;
  group.add(new echartsInstance.graphic.Text({
    style: {
      x: layout.plot.left,
      y: Math.max(16, layout.plot.top - 32),
      text: label,
      fill: model.get('color') || '#0f172a',
      fontSize: finiteNumber(model.get('fontSize'), 13),
      fontWeight: model.get('fontWeight') || 720,
      align: 'left',
      verticalAlign: 'middle'
    },
    silent: true,
    z2: layerZ.step
  }));
  group.add(new echartsInstance.graphic.Text({
    style: {
      x: layout.plot.right,
      y: Math.max(16, layout.plot.top - 32),
      text: metrics,
      fill: model.get('mutedColor') || '#64748b',
      fontSize: Math.max(10, finiteNumber(model.get('fontSize'), 13) - 1),
      fontWeight: 650,
      align: 'right',
      verticalAlign: 'middle'
    },
    silent: true,
    z2: layerZ.step
  }));
  if (frame.description) {
    group.add(new echartsInstance.graphic.Text({
      style: {
        x: layout.plot.left,
        y: Math.max(34, layout.plot.top - 12),
        text: ellipsize(frame.description, 96),
        fill: model.get('mutedColor') || '#64748b',
        fontSize: Math.max(10, finiteNumber(model.get('fontSize'), 13) - 1),
        fontWeight: 600,
        align: 'left',
        verticalAlign: 'middle'
      },
      silent: true,
      z2: layerZ.step
    }));
  }
}

function readBarStyle(
  data: SeriesData,
  seriesModel: AlgorithmSortSeriesModel,
  itemModel: EChartsModel | null | undefined,
  bar: AlgorithmSortBar
): Record<string, unknown> {
  const itemStyleModel = itemModel?.getModel('itemStyle') || seriesModel.getModel('itemStyle');
  const stateStyleModel = seriesModel.getModel(['stateStyle', bar.state]);
  const dataStyle = data.getItemVisual(bar.dataIndex, 'style');
  const visualColor = data.getItemVisual(bar.dataIndex, 'color');
  const fill = stateStyleModel.get('color')
    || (isPlainObject(dataStyle) ? dataStyle.fill || dataStyle.color : undefined)
    || itemStyleModel.get('color')
    || visualColor
    || stateColors[bar.state];

  return {
    fill,
    opacity: finiteNumber(itemStyleModel.get('opacity'), 0.9),
    stroke: itemStyleModel.get('borderColor') || '#ffffff',
    lineWidth: finiteNumber(itemStyleModel.get('borderWidth'), 1)
  };
}

function readLineStyle(model: EChartsModel, fallbackColor: string, fallbackWidth: number): Record<string, unknown> {
  return {
    stroke: model.get('color') || model.get('stroke') || fallbackColor,
    lineWidth: finiteNumber(model.get('width') ?? model.get('lineWidth'), fallbackWidth),
    opacity: finiteNumber(model.get('opacity'), 1),
    lineDash: normalizeDash(model.get('type'))
  };
}

function normalizeDash(value: unknown): number[] | undefined {
  if (Array.isArray(value)) return value.map((item) => finiteNumber(item, NaN)).filter(Number.isFinite);
  if (value === 'dashed') return [6, 4];
  if (value === 'dotted') return [2, 4];
  return undefined;
}

function bindTooltipData(
  echartsInstance: EChartsHost,
  seriesModel: AlgorithmSortSeriesModel,
  data: SeriesData,
  dataIndex: number,
  element: GraphicElement
): void {
  const ecData = echartsInstance.helper.getECData(element);
  ecData.dataIndex = dataIndex;
  ecData.dataType = data.dataType || 'algorithmSort';
  ecData.seriesIndex = seriesModel.seriesIndex;
  ecData.ssrType = 'chart';
}

function formatAxisLabel(formatter: unknown, value: unknown): string {
  if (typeof formatter === 'function') return String(formatter(value));
  if (typeof formatter === 'string') return formatter.replace(/\{value\}/g, String(value));
  return String(value);
}

function formatLabel(formatter: unknown, bar: AlgorithmSortBar): string {
  if (typeof formatter === 'function') {
    return String(formatter({
      data: bar.raw,
      name: bar.name,
      value: bar.value,
      position: bar.position,
      state: bar.state
    }));
  }
  if (typeof formatter === 'string') {
    return formatter
      .replace(/\{b\}/g, bar.name)
      .replace(/\{c\}/g, String(bar.value))
      .replace(/\{value\}/g, String(bar.value));
  }
  return String(bar.value);
}

function ellipsize(value: string, maxChars: number): string {
  const text = String(value);
  if (text.length <= maxChars) return text;
  return `${text.slice(0, Math.max(1, maxChars - 1))}…`;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export const __test__ = {
  createAlgorithmSortDataSource,
  drawAlgorithmSort,
  formatLabel,
  readLayoutOption,
  resolveAlgorithmSortLayout
};
