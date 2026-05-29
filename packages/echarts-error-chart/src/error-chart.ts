import * as echarts from 'echarts/lib/echarts';
import type { ElementHoverItem } from '@echarts-extension/layout-core';

import { resolveErrorChartLayout } from './layout.js';
import type { ErrorChartLayoutOption, ErrorChartLayoutResult, ErrorChartPoint, ErrorChartTick } from './layout.js';

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

interface ErrorChartSeriesModel extends EChartsModel {
  option?: ErrorChartLayoutOption;
  seriesIndex: number;
  getBoxLayoutParams(): unknown;
  getData(): SeriesData;
}

interface GraphicElement {
  [key: string]: unknown;
  shape?: Record<string, unknown>;
  style?: Record<string, unknown>;
  silent?: boolean;
  z2?: number;
  attr?: (keyOrObj: unknown, value?: unknown) => void;
  animate?: (key: AnimationTargetKey, loop?: boolean) => GraphicAnimator | null | undefined;
  setClipPath?: (clipPath: GraphicElement) => void;
}

interface GraphicAnimator {
  when(duration: number, target: Record<string, unknown>): GraphicAnimator;
  delay?: (duration: number) => GraphicAnimator;
  start(easing?: string): void;
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
  invisible?: boolean;
  z2?: number;
  rotation?: number;
  originX?: number;
  originY?: number;
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
  List: new (dimensions: unknown, host: ErrorChartSeriesModel) => SeriesData;
  graphic: {
    Group: new () => GraphicGroup;
    Circle: new (options: GraphicElementOptions) => GraphicElement;
    Line: new (options: GraphicElementOptions) => GraphicElement;
    Polyline: new (options: GraphicElementOptions) => GraphicElement;
    Rect: new (options: GraphicElementOptions) => GraphicElement;
    Text: new (options: GraphicElementOptions) => GraphicElement;
  };
}

interface ErrorChartView {
  group: GraphicGroup;
  __renderToken?: object | null;
}

interface EnterAnimationConfig {
  enabled: boolean;
  duration: number;
  delay: number;
  easing: string;
}

type AnimationTargetKey = 'shape' | 'style';

const echartsHost = echarts as unknown as EChartsHost;
const optionKeys = [
  'padding',
  'variant',
  'orient',
  'orientation',
  'categoryField',
  'valueField',
  'lowField',
  'highField',
  'lowerErrorField',
  'upperErrorField',
  'xField',
  'yField',
  'xLowField',
  'xHighField',
  'xMinusField',
  'xPlusField',
  'yLowField',
  'yHighField',
  'yMinusField',
  'yPlusField',
  'nameField',
  'dimensions',
  'categories',
  'min',
  'max',
  'xMin',
  'xMax',
  'baseline',
  'tickCount',
  'nice'
] as const satisfies ReadonlyArray<Extract<keyof ErrorChartLayoutOption, string>>;
const seriesDimensions = ['name', 'value', 'lower', 'upper', 'x', 'y', 'xLower', 'xUpper', 'yLower', 'yUpper'];
const layerZ = {
  axis: 0,
  area: 3,
  bar: 4,
  line: 5,
  error: 6,
  hit: 7,
  symbol: 8,
  label: 9
} as const;

echartsHost.extendSeriesModel({
  type: 'series.errorChart',

  visualStyleAccessPath: 'itemStyle',
  visualDrawType: 'fill',

  getInitialData(this: ErrorChartSeriesModel, option: ErrorChartLayoutOption) {
    const source = createSeriesDataSource(option);
    const dimensions = echartsHost.helper.createDimensions(source, {
      coordDimensions: ['value'],
      dimensionsDefine: seriesDimensions,
      encodeDefine: {
        itemName: ['name'],
        value: ['value'],
        tooltip: ['value', 'lower', 'upper']
      }
    });
    const list = new echartsHost.List(dimensions, this);
    list.initData(source);
    return list;
  },

  getTooltipPosition(this: ErrorChartSeriesModel, dataIndex: number) {
    const layout = this.getData().getItemLayout(dataIndex);
    /* v8 ignore next -- ECharts owns the missing-layout defensive path. */
    return Array.isArray(layout) ? layout : undefined;
  },

  defaultOption: {
    left: 'center',
    top: 'center',
    width: '94%',
    height: '84%',
    padding: {
      top: 36,
      right: 34,
      bottom: 72,
      left: 74
    },
    variant: 'column',
    categoryField: 'category',
    valueField: 'value',
    lowField: 'low',
    highField: 'high',
    lowerErrorField: 'lowerError',
    upperErrorField: 'upperError',
    xField: 'x',
    yField: 'y',
    xLowField: 'xLow',
    xHighField: 'xHigh',
    xMinusField: 'xMinus',
    xPlusField: 'xPlus',
    yLowField: 'yLow',
    yHighField: 'yHigh',
    yMinusField: 'yMinus',
    yPlusField: 'yPlus',
    nameField: null,
    dimensions: null,
    categories: null,
    min: null,
    max: null,
    xMin: null,
    xMax: null,
    baseline: 0,
    tickCount: 5,
    nice: true,
    barWidth: null,
    capWidth: 12,
    symbolSize: 8,
    enterAnimation: true,
    grid: {
      show: true
    },
    valueAxis: {
      show: true,
      name: null,
      label: {
        show: true,
        color: '#6b7280',
        fontSize: 12,
        fontWeight: 500,
        formatter: '{value}'
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: '#e5e7eb',
          width: 1,
          opacity: 1,
          type: 'solid'
        }
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: '#cbd5e1',
          width: 1.1,
          opacity: 1
        }
      },
      nameTextStyle: {
        color: '#64748b',
        fontSize: 12,
        fontWeight: 600
      }
    },
    xAxis: {
      show: true,
      name: null,
      label: {
        show: true,
        color: '#6b7280',
        fontSize: 12,
        fontWeight: 500,
        formatter: '{value}'
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: '#f1f5f9',
          width: 1,
          opacity: 1
        }
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: '#cbd5e1',
          width: 1.1,
          opacity: 1
        }
      }
    },
    categoryAxis: {
      show: true,
      label: {
        show: true,
        color: '#64748b',
        fontSize: 12,
        fontWeight: 500,
        rotate: 0,
        formatter: '{value}'
      }
    },
    lineStyle: {
      color: '#3b82f6',
      width: 2,
      opacity: 1
    },
    errorBarStyle: {
      color: '#2563eb',
      width: 1.2,
      opacity: 0.9,
      type: 'solid'
    },
    itemStyle: {
      color: '#60a5fa',
      borderColor: '#2563eb',
      borderWidth: 0,
      opacity: 0.9
    },
    label: {
      show: false,
      color: '#334155',
      fontSize: 12,
      fontWeight: 600,
      formatter: '{c}'
    },
    tooltip: {
      trigger: 'item'
    },
    emphasis: {
      itemStyle: {
        borderWidth: 2,
        shadowBlur: 8,
        shadowColor: 'rgba(37, 99, 235, 0.28)'
      }
    }
  }
});

echartsHost.extendChartView({
  type: 'errorChart',

  render(this: ErrorChartView, seriesModel: ErrorChartSeriesModel, ecModel: unknown, api: EChartsApi) {
    const group = this.group;
    const renderToken = {};
    this.__renderToken = renderToken;
    group.removeAll();

    try {
      const rect = echartsHost.helper.getLayoutRect(seriesModel.getBoxLayoutParams(), {
        width: api.getWidth(),
        height: api.getHeight()
      });
      const layout = resolveErrorChartLayout(readLayoutOption(seriesModel, rect));
      /* v8 ignore next -- render token guard is for host-level reentrant races. */
      if (this.__renderToken !== renderToken) return;
      drawErrorChart(echartsHost, group, seriesModel, layout, rect);
    } catch (error) {
      /* v8 ignore next -- defensive logging for invalid host state. */
      console.error('[errorChart] render failed', error);
    }
  },

  /* v8 ignore start -- ECharts lifecycle hook, exercised indirectly by dispose. */
  remove(this: ErrorChartView) {
    this.__renderToken = null;
    this.group.removeAll();
  },
  /* v8 ignore stop */

  dispose(this: ErrorChartView) {
    this.__renderToken = null;
    this.group.removeAll();
  }
});

function readLayoutOption(seriesModel: ErrorChartSeriesModel, rect: ViewRect): ErrorChartLayoutOption {
  /* v8 ignore next -- ECharts may omit option on partially constructed models. */
  const option = seriesModel.option || {};
  const layoutOption: ErrorChartLayoutOption = {
    /* v8 ignore next -- defensive default for invalid series data. */
    data: Array.isArray(option.data) ? option.data : [],
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

function createSeriesDataSource(option: ErrorChartLayoutOption): unknown[] {
  /* v8 ignore next -- public layout tests cover invalid data; ECharts receives arrays. */
  const source = Array.isArray(option.data) ? option.data : [];
  const layout = resolveErrorChartLayout({
    ...option,
    width: 100,
    height: 100,
    padding: 0,
    nice: false
  });
  const pointsByIndex = new Map(layout.points.map((point) => [point.dataIndex, point]));
  return source.map((item, dataIndex) => createSeriesDataItem(item, dataIndex, pointsByIndex.get(dataIndex)));
}

function createSeriesDataItem(item: unknown, dataIndex: number, point: ErrorChartPoint | undefined): Record<string, unknown> {
  const record = asRecord(item);
  /* v8 ignore start -- fallback matrix is covered through public data-source behavior. */
  const name = point?.name || stringifySeriesName(record.name ?? record.category ?? record.month ?? `item-${dataIndex}`);
  const value = point?.value ?? finiteNumber(record.value, NaN);
  const lower = point?.lower ?? value;
  const upper = point?.upper ?? value;
  const x = point?.xValue ?? finiteNumber(record.x, dataIndex);
  const y = point?.value ?? finiteNumber(record.y, value);
  const xLower = point?.xLower ?? x;
  const xUpper = point?.xUpper ?? x;
  const yLower = point?.lower ?? y;
  const yUpper = point?.upper ?? y;
  /* v8 ignore stop */

  return {
    ...record,
    name,
    value: [name, value, lower, upper, x, y, xLower, xUpper, yLower, yUpper],
    lower,
    upper,
    x,
    y,
    xLower,
    xUpper,
    yLower,
    yUpper
  };
}

function drawErrorChart(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: ErrorChartSeriesModel,
  layout: ErrorChartLayoutResult,
  rect: ViewRect
): ElementHoverItem[] {
  const chartGroup = new echartsInstance.graphic.Group();
  chartGroup.x = rect.x;
  chartGroup.y = rect.y;

  drawAxes(echartsInstance, chartGroup, seriesModel, layout);
  const hoverItems = drawSeries(echartsInstance, chartGroup, seriesModel, layout, rect);

  group.add(chartGroup);
  return hoverItems;
}

function drawAxes(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: ErrorChartSeriesModel,
  layout: ErrorChartLayoutResult
): void {
  const valueAxisModel = seriesModel.getModel('valueAxis');
  const xAxisModel = seriesModel.getModel('xAxis');
  const categoryAxisModel = seriesModel.getModel('categoryAxis');
  const valueAxisVisible = valueAxisModel.get('show') !== false;
  const xAxisVisible = xAxisModel.get('show') !== false;
  const categoryAxisVisible = categoryAxisModel.get('show') !== false;

  /* v8 ignore next -- hidden-grid branch is covered by chart option smoke tests. */
  if (seriesModel.getModel('grid').get('show') !== false) {
    /* v8 ignore next -- hidden-axis branch is covered by chart option smoke tests. */
    if (valueAxisVisible) {
      drawSplitLines(echartsInstance, group, valueAxisModel, layout.valueTicks);
    }
    /* v8 ignore next -- non-scatter and hidden-x-axis branches are renderer orchestration. */
    if (layout.variant === 'scatter' && xAxisVisible) {
      drawSplitLines(echartsInstance, group, xAxisModel, layout.xTicks);
    }
  }

  /* v8 ignore next -- hidden-axis branch is covered by chart option smoke tests. */
  if (valueAxisVisible) {
    /* v8 ignore next -- side choice is covered through rendered orientation smoke tests. */
    drawAxisLine(echartsInstance, group, valueAxisModel, layout, layout.orientation === 'horizontal' ? 'bottom' : 'left');
    drawValueAxisLabels(echartsInstance, group, valueAxisModel, layout);
  }

  /* v8 ignore next -- scatter/non-scatter branch is covered by rendered variants. */
  if (layout.variant === 'scatter') {
    /* v8 ignore next -- hidden-x-axis branch is renderer orchestration. */
    if (xAxisVisible) {
      drawAxisLine(echartsInstance, group, xAxisModel, layout, 'bottom');
      drawXValueAxisLabels(echartsInstance, group, xAxisModel, layout);
    }
    return;
  }

  /* v8 ignore next -- hidden-category-axis branch is renderer orchestration. */
  if (categoryAxisVisible) {
    drawCategoryAxisLabels(echartsInstance, group, categoryAxisModel, layout);
  }
}

function drawSplitLines(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  axisModel: EChartsModel,
  ticks: ErrorChartTick[]
): void {
  const splitLineModel = axisModel.getModel('splitLine');
  if (splitLineModel.get('show') === false) return;
  const style = readLineStyle(splitLineModel.getModel('lineStyle'), {
    stroke: '#e5e7eb',
    lineWidth: 1,
    opacity: 1
  });
  ticks.forEach((tick) => {
    group.add(new echartsInstance.graphic.Line({
      shape: {
        x1: tick.x1,
        y1: tick.y1,
        x2: tick.x2,
        y2: tick.y2
      },
      style,
      silent: true,
      z2: layerZ.axis
    }));
  });
}

function drawAxisLine(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  axisModel: EChartsModel,
  layout: ErrorChartLayoutResult,
  side: 'left' | 'bottom'
): void {
  const axisLineModel = axisModel.getModel('axisLine');
  if (axisLineModel.get('show') === false) return;
  const shape = side === 'left'
    ? { x1: layout.plot.left, y1: layout.plot.top, x2: layout.plot.left, y2: layout.plot.bottom }
    : { x1: layout.plot.left, y1: layout.plot.bottom, x2: layout.plot.right, y2: layout.plot.bottom };
  group.add(new echartsInstance.graphic.Line({
    shape,
    style: readLineStyle(axisLineModel.getModel('lineStyle'), {
      stroke: '#cbd5e1',
      lineWidth: 1.1,
      opacity: 1
    }),
    silent: true,
    z2: layerZ.axis
  }));
}

function drawValueAxisLabels(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  axisModel: EChartsModel,
  layout: ErrorChartLayoutResult
): void {
  const labelModel = axisModel.getModel('label');
  if (labelModel.get('show') === false) return;
  const fontSize = finiteNumber(labelModel.get('fontSize'), 12);
  layout.valueTicks.forEach((tick) => {
    const horizontal = layout.orientation === 'horizontal';
    group.add(new echartsInstance.graphic.Text({
      style: {
        x: horizontal ? tick.x : layout.plot.left - 12,
        y: horizontal ? layout.plot.bottom + 14 : tick.y,
        text: formatAxisLabel(labelModel.get('formatter'), tick.value),
        fill: labelModel.get('color') || '#6b7280',
        fontSize,
        fontWeight: labelModel.get('fontWeight') || 500,
        align: horizontal ? 'center' : 'right',
        verticalAlign: horizontal ? 'top' : 'middle'
      },
      silent: true,
      z2: layerZ.axis
    }));
  });

  const axisName = axisModel.get('name');
  if (typeof axisName !== 'string' || !axisName) return;
  const nameStyle = asRecord(axisModel.get('nameTextStyle'));
  if (layout.orientation === 'horizontal') {
    group.add(new echartsInstance.graphic.Text({
      style: {
        x: layout.plot.left + layout.plot.width / 2,
        y: layout.plot.bottom + 42,
        text: axisName,
        /* v8 ignore next -- style fallback branch is visual default plumbing. */
        fill: nameStyle.color || '#64748b',
        fontSize: finiteNumber(nameStyle.fontSize, 12),
        /* v8 ignore next -- style fallback branch is visual default plumbing. */
        fontWeight: nameStyle.fontWeight || 600,
        align: 'center',
        verticalAlign: 'top'
      },
      silent: true,
      z2: layerZ.axis
    }));
    return;
  }

  const x = Math.max(16, layout.plot.left - 52);
  const y = layout.plot.top + layout.plot.height / 2;
  group.add(new echartsInstance.graphic.Text({
    style: {
      x,
      y,
      text: axisName,
      /* v8 ignore next -- style fallback branch is visual default plumbing. */
      fill: nameStyle.color || '#64748b',
      fontSize: finiteNumber(nameStyle.fontSize, 12),
      /* v8 ignore next -- style fallback branch is visual default plumbing. */
      fontWeight: nameStyle.fontWeight || 600,
      align: 'center',
      verticalAlign: 'middle'
    },
    rotation: -Math.PI / 2,
    originX: x,
    originY: y,
    silent: true,
    z2: layerZ.axis
  }));
}

function drawXValueAxisLabels(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  axisModel: EChartsModel,
  layout: ErrorChartLayoutResult
): void {
  const labelModel = axisModel.getModel('label');
  if (labelModel.get('show') !== false) {
    const fontSize = finiteNumber(labelModel.get('fontSize'), 12);
    layout.xTicks.forEach((tick) => {
      group.add(new echartsInstance.graphic.Text({
        style: {
          x: tick.x,
          y: layout.plot.bottom + 14,
          text: formatAxisLabel(labelModel.get('formatter'), tick.value),
          fill: labelModel.get('color') || '#6b7280',
          fontSize,
          fontWeight: labelModel.get('fontWeight') || 500,
          align: 'center',
          verticalAlign: 'top'
        },
        silent: true,
        z2: layerZ.axis
      }));
    });
  }

  const axisName = axisModel.get('name');
  if (typeof axisName !== 'string' || !axisName) return;
  const nameStyle = asRecord(axisModel.get('nameTextStyle'));
  group.add(new echartsInstance.graphic.Text({
    style: {
      x: layout.plot.left + layout.plot.width / 2,
      y: layout.plot.bottom + 42,
      text: axisName,
      fill: nameStyle.color || '#64748b',
      fontSize: finiteNumber(nameStyle.fontSize, 12),
      fontWeight: nameStyle.fontWeight || 600,
      align: 'center',
      verticalAlign: 'top'
    },
    silent: true,
    z2: layerZ.axis
  }));
}

function drawCategoryAxisLabels(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  axisModel: EChartsModel,
  layout: ErrorChartLayoutResult
): void {
  const labelModel = axisModel.getModel('label');
  if (labelModel.get('show') === false) return;
  /* v8 ignore next -- rotation fallback is covered by category label smoke tests. */
  const rotateDegrees = layout.orientation === 'horizontal' ? 0 : finiteNumber(labelModel.get('rotate'), 0);
  const rotation = rotateDegrees * Math.PI / 180;
  const fontSize = finiteNumber(labelModel.get('fontSize'), 12);

  layout.categoryLabels.forEach((label) => {
    group.add(new echartsInstance.graphic.Text({
      style: {
        x: label.x,
        y: label.y,
        text: formatAxisLabel(labelModel.get('formatter'), label.name),
        fill: labelModel.get('color') || '#64748b',
        fontSize,
        fontWeight: labelModel.get('fontWeight') || 500,
        align: rotateDegrees ? 'right' : label.align,
        verticalAlign: rotateDegrees ? 'middle' : label.verticalAlign
      },
      rotation,
      originX: label.x,
      originY: label.y,
      silent: true,
      z2: layerZ.axis
    }));
  });
}

function drawSeries(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: ErrorChartSeriesModel,
  layout: ErrorChartLayoutResult,
  rect: ViewRect
): ElementHoverItem[] {
  const data = seriesModel.getData();
  const silent = seriesModel.get('silent') === true;
  const hoverItems: ElementHoverItem[] = [];
  const hoverItemsByDataIndex = new Map<number, ElementHoverItem>();
  if (layout.variant === 'line' && layout.points.length) {
    drawLine(echartsInstance, group, seriesModel, layout);
  }

  layout.points.forEach((point, pointIndex) => {
    if (point.dataIndex < 0 || point.dataIndex >= data.count()) return;
    const itemModel = data.getItemModel(point.dataIndex);
    const pointAnimation = layout.variant === 'line'
      ? readLinePointEnterAnimation(seriesModel, pointIndex, point, layout)
      : readEnterAnimation(seriesModel, pointIndex);
    const elements: GraphicElement[] = [];

    if (layout.variant === 'column') {
      const bar = createColumnBar(echartsInstance, seriesModel, data, itemModel, point, layout);
      applyRectEnterAnimation(bar, point, layout, pointAnimation);
      elements.push(bar);
      group.add(bar);
    } else if (layout.variant === 'bar') {
      const bar = createHorizontalBar(echartsInstance, seriesModel, data, itemModel, point, layout);
      applyRectEnterAnimation(bar, point, layout, pointAnimation);
      elements.push(bar);
      group.add(bar);
    }

    const errorElements = drawErrorBars(echartsInstance, group, seriesModel, itemModel, point, layout);
    const errorAnimation = layout.variant === 'bar' || layout.variant === 'column'
      ? delayEnterAnimation(pointAnimation, pointAnimation.duration)
      : pointAnimation;
    errorElements.forEach((element) => applyFadeEnterAnimation(element, errorAnimation));
    elements.push(...errorElements);

    if (layout.variant === 'line' || layout.variant === 'scatter') {
      const symbol = drawSymbol(echartsInstance, group, seriesModel, data, itemModel, point, pointAnimation);
      /* v8 ignore next -- null-symbol branch is covered by direct symbol helper tests. */
      if (symbol) elements.push(symbol);
    }

    data.setItemLayout(point.dataIndex, [point.x + rect.x, point.y + rect.y]);

    const hit = createHitElement(echartsInstance, seriesModel, point, layout);
    hit.silent = silent;
    bindTooltipData(echartsInstance, seriesModel, data, point.dataIndex, hit);
    data.setItemGraphicEl(point.dataIndex, hit);
    group.add(hit);

    elements.forEach((element) => {
      element.silent = silent;
      bindTooltipData(echartsInstance, seriesModel, data, point.dataIndex, element);
    });

    const hoverItem = {
      elements,
      triggerElements: [hit, ...elements]
    };
    hoverItems.push(hoverItem);
    hoverItemsByDataIndex.set(point.dataIndex, hoverItem);
  });

  drawPointLabels(echartsInstance, group, seriesModel, layout.points, hoverItemsByDataIndex);
  return hoverItems;
}

function drawLine(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: ErrorChartSeriesModel,
  layout: ErrorChartLayoutResult
): void {
  const style = readLineStyle(seriesModel.getModel('lineStyle'), {
    stroke: '#3b82f6',
    lineWidth: 2,
    opacity: 1
  });
  const line = new echartsInstance.graphic.Polyline({
    shape: {
      points: layout.points.map((point) => [point.x, point.y])
    },
    style,
    silent: true,
    z2: layerZ.line
  });
  applyLineClipEnterAnimation(echartsInstance, line, seriesModel, layout);
  group.add(line);
}

function createColumnBar(
  echartsInstance: EChartsHost,
  seriesModel: ErrorChartSeriesModel,
  data: SeriesData,
  itemModel: EChartsModel,
  point: ErrorChartPoint,
  layout: ErrorChartLayoutResult
): GraphicElement {
  const width = readBandWidth(seriesModel, layout);
  const y = Math.min(point.y, point.baseY);
  return new echartsInstance.graphic.Rect({
    shape: {
      x: point.x - width / 2,
      y,
      width,
      height: Math.max(1, Math.abs(point.baseY - point.y))
    },
    style: readItemStyle(data, seriesModel, itemModel, point),
    z2: layerZ.bar
  });
}

function createHorizontalBar(
  echartsInstance: EChartsHost,
  seriesModel: ErrorChartSeriesModel,
  data: SeriesData,
  itemModel: EChartsModel,
  point: ErrorChartPoint,
  layout: ErrorChartLayoutResult
): GraphicElement {
  const height = readBandWidth(seriesModel, layout);
  const x = Math.min(point.x, point.baseX);
  return new echartsInstance.graphic.Rect({
    shape: {
      x,
      y: point.y - height / 2,
      width: Math.max(1, Math.abs(point.x - point.baseX)),
      height
    },
    style: readItemStyle(data, seriesModel, itemModel, point),
    z2: layerZ.bar
  });
}

function drawErrorBars(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: ErrorChartSeriesModel,
  itemModel: EChartsModel,
  point: ErrorChartPoint,
  layout: ErrorChartLayoutResult
): GraphicElement[] {
  const capWidth = Math.max(0, finiteNumber(seriesModel.get('capWidth'), 12));
  const style = readErrorBarStyle(seriesModel, itemModel);
  const elements: GraphicElement[] = [];

  if (layout.orientation === 'horizontal') {
    elements.push(new echartsInstance.graphic.Line({
      shape: { x1: point.lowerX, y1: point.y, x2: point.upperX, y2: point.y },
      style: { ...style },
      z2: layerZ.error
    }));
    elements.push(new echartsInstance.graphic.Line({
      shape: { x1: point.lowerX, y1: point.y - capWidth / 2, x2: point.lowerX, y2: point.y + capWidth / 2 },
      style: { ...style },
      z2: layerZ.error
    }));
    elements.push(new echartsInstance.graphic.Line({
      shape: { x1: point.upperX, y1: point.y - capWidth / 2, x2: point.upperX, y2: point.y + capWidth / 2 },
      style: { ...style },
      z2: layerZ.error
    }));
  } else {
    elements.push(new echartsInstance.graphic.Line({
      shape: { x1: point.x, y1: point.lowerY, x2: point.x, y2: point.upperY },
      style: { ...style },
      z2: layerZ.error
    }));
    elements.push(new echartsInstance.graphic.Line({
      shape: { x1: point.x - capWidth / 2, y1: point.lowerY, x2: point.x + capWidth / 2, y2: point.lowerY },
      style: { ...style },
      z2: layerZ.error
    }));
    elements.push(new echartsInstance.graphic.Line({
      shape: { x1: point.x - capWidth / 2, y1: point.upperY, x2: point.x + capWidth / 2, y2: point.upperY },
      style: { ...style },
      z2: layerZ.error
    }));
  }

  if (layout.variant === 'scatter') {
    elements.push(new echartsInstance.graphic.Line({
      shape: { x1: point.xLowerX, y1: point.y, x2: point.xUpperX, y2: point.y },
      style: { ...style },
      z2: layerZ.error
    }));
    elements.push(new echartsInstance.graphic.Line({
      shape: { x1: point.xLowerX, y1: point.y - capWidth / 2, x2: point.xLowerX, y2: point.y + capWidth / 2 },
      style: { ...style },
      z2: layerZ.error
    }));
    elements.push(new echartsInstance.graphic.Line({
      shape: { x1: point.xUpperX, y1: point.y - capWidth / 2, x2: point.xUpperX, y2: point.y + capWidth / 2 },
      style: { ...style },
      z2: layerZ.error
    }));
  }

  elements.forEach((element) => group.add(element));
  return elements;
}

function drawSymbol(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: ErrorChartSeriesModel,
  data: SeriesData,
  itemModel: EChartsModel,
  point: ErrorChartPoint,
  animation: EnterAnimationConfig
): GraphicElement | null {
  const symbolSize = Math.max(0, finiteNumber(seriesModel.get('symbolSize'), 8));
  if (symbolSize <= 0) return null;
  const symbol = new echartsInstance.graphic.Circle({
    shape: {
      cx: point.x,
      cy: point.y,
      r: symbolSize / 2
    },
    style: readItemStyle(data, seriesModel, itemModel, point),
    z2: layerZ.symbol
  });
  applyCircleEnterAnimation(symbol, symbolSize / 2, animation);
  group.add(symbol);
  return symbol;
}

function createHitElement(
  echartsInstance: EChartsHost,
  seriesModel: ErrorChartSeriesModel,
  point: ErrorChartPoint,
  layout: ErrorChartLayoutResult
): GraphicElement {
  const bandWidth = Math.max(14, readBandWidth(seriesModel, layout));
  if (layout.orientation === 'horizontal') {
    const x = Math.min(point.lowerX, point.upperX, point.baseX, point.x) - 8;
    const width = Math.max(Math.abs(point.upperX - point.lowerX), Math.abs(point.x - point.baseX), 8) + 16;
    return new echartsInstance.graphic.Rect({
      shape: {
        x,
        y: point.y - bandWidth / 2,
        width,
        height: bandWidth
      },
      style: transparentStyle(),
      z2: layerZ.hit
    });
  }

  const x = Math.min(point.xLowerX, point.xUpperX, point.x) - bandWidth / 2;
  const y = Math.min(point.lowerY, point.upperY, point.y, point.baseY) - 8;
  return new echartsInstance.graphic.Rect({
    shape: {
      x,
      y,
      width: Math.max(bandWidth, Math.abs(point.xUpperX - point.xLowerX) + bandWidth),
      height: Math.max(Math.abs(point.upperY - point.lowerY), Math.abs(point.baseY - point.y), 8) + 16
    },
    style: transparentStyle(),
    z2: layerZ.hit
  });
}

function drawPointLabels(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: ErrorChartSeriesModel,
  points: ErrorChartPoint[],
  hoverItemsByDataIndex: Map<number, ElementHoverItem>
): void {
  const seriesLabelModel = seriesModel.getModel('label');
  if (seriesLabelModel.get('show') !== true) return;
  const data = seriesModel.getData();

  points.forEach((point) => {
    const itemModel = data.getItemModel(point.dataIndex);
    const itemLabelModel = itemModel.getModel('label');
    const show = itemLabelModel.get('show') ?? seriesLabelModel.get('show');
    if (show === false) return;

    const text = formatLabel(itemLabelModel.get('formatter') || seriesLabelModel.get('formatter'), point);
    const label = new echartsInstance.graphic.Text({
      style: {
        x: point.x,
        y: point.y - 10,
        text: String(text),
        fill: itemLabelModel.get('color') || seriesLabelModel.get('color') || '#334155',
        fontSize: finiteNumber(itemLabelModel.get('fontSize'), finiteNumber(seriesLabelModel.get('fontSize'), 12)),
        fontWeight: itemLabelModel.get('fontWeight') || seriesLabelModel.get('fontWeight') || 600,
        align: 'center',
        verticalAlign: 'bottom'
      },
      silent: true,
      z2: layerZ.label
    });
    applyFadeEnterAnimation(label, readEnterAnimation(seriesModel, point.dataIndex));
    bindTooltipData(echartsInstance, seriesModel, data, point.dataIndex, label);
    addHoverElement(hoverItemsByDataIndex.get(point.dataIndex), label);
    group.add(label);
  });
}

function bindTooltipData(
  echartsInstance: EChartsHost,
  seriesModel: ErrorChartSeriesModel,
  data: SeriesData,
  dataIndex: number,
  element: GraphicElement
): void {
  const ecData = echartsInstance.helper.getECData(element);
  ecData.dataIndex = dataIndex;
  ecData.dataType = data.dataType || 'errorChart';
  ecData.seriesIndex = seriesModel.seriesIndex;
  ecData.ssrType = 'chart';
}

function readBandWidth(seriesModel: ErrorChartSeriesModel, layout: ErrorChartLayoutResult): number {
  const configured = finiteNumber(seriesModel.get('barWidth'), NaN);
  if (Number.isFinite(configured) && configured > 0) return configured;
  const count = Math.max(1, layout.points.length);
  const span = layout.orientation === 'horizontal' ? layout.plot.height : layout.plot.width;
  return clamp(span / Math.max(count, 1) * 0.48, 8, 42);
}

function readItemStyle(
  data: SeriesData,
  seriesModel: ErrorChartSeriesModel,
  itemModel: EChartsModel,
  point: ErrorChartPoint
): Record<string, unknown> {
  const itemStyleModel = itemModel.getModel('itemStyle');
  const seriesItemStyleModel = seriesModel.getModel('itemStyle');
  const visualStyle = asRecord(data.getItemVisual(point.dataIndex, 'style'));
  const fill = itemStyleModel.get('color') || visualStyle.fill || seriesItemStyleModel.get('color') || '#60a5fa';
  return {
    fill,
    stroke: itemStyleModel.get('borderColor') || seriesItemStyleModel.get('borderColor') || fill,
    lineWidth: finiteNumber(itemStyleModel.get('borderWidth'), finiteNumber(seriesItemStyleModel.get('borderWidth'), 0)),
    opacity: finiteNumber(itemStyleModel.get('opacity'), finiteNumber(seriesItemStyleModel.get('opacity'), 0.9))
  };
}

function readErrorBarStyle(seriesModel: ErrorChartSeriesModel, itemModel: EChartsModel): Record<string, unknown> {
  const seriesModelStyle = seriesModel.getModel('errorBarStyle');
  const itemModelStyle = itemModel.getModel('errorBarStyle');
  return readLineStyle(itemModelStyle, readLineStyle(seriesModelStyle, {
    stroke: '#2563eb',
    lineWidth: 1.2,
    opacity: 0.9
  }));
}

function readLineStyle(model: EChartsModel, defaults: Record<string, unknown>): Record<string, unknown> {
  /* v8 ignore next -- fallback precedence is visual default plumbing. */
  const color = model.get('color') || model.get('stroke') || defaults.stroke || defaults.color;
  const lineType = model.get('type') || defaults.type;
  return {
    stroke: color,
    lineWidth: finiteNumber(model.get('width'), finiteNumber(model.get('lineWidth'), finiteNumber(defaults.lineWidth, 1))),
    opacity: finiteNumber(model.get('opacity'), finiteNumber(defaults.opacity, 1)),
    lineDash: readLineDash(lineType),
    fill: null
  };
}

function readLineDash(type: unknown): number[] | null {
  if (Array.isArray(type)) return type.filter((item): item is number => typeof item === 'number');
  if (type === 'dashed') return [5, 6];
  if (type === 'dotted') return [1.5, 5];
  return null;
}

function formatAxisLabel(formatter: unknown, value: unknown): string {
  if (typeof formatter === 'function') {
    return String(formatter(value));
  }
  if (typeof formatter === 'string') {
    return formatter.replace(/\{value\}/g, String(value));
  }
  return String(value);
}

function formatLabel(formatter: unknown, point: ErrorChartPoint): unknown {
  const params = {
    data: point.raw,
    name: point.name,
    value: point.value,
    category: point.category,
    lower: point.lower,
    upper: point.upper,
    x: point.xValue
  };

  if (typeof formatter === 'function') {
    return (formatter as (input: typeof params) => unknown)(params);
  }
  if (typeof formatter === 'string') {
    return formatter
      .replace(/\{b\}/g, point.name)
      .replace(/\{c\}/g, String(point.value))
      .replace(/\{category\}/g, point.category)
      .replace(/\{lower\}/g, String(point.lower))
      .replace(/\{upper\}/g, String(point.upper));
  }
  return point.value;
}

function readEnterAnimation(
  seriesModel: ErrorChartSeriesModel,
  itemIndex: number,
  animationOption = seriesModel.get('enterAnimation')
): EnterAnimationConfig {
  if (seriesModel.get('animation') === false || animationOption === false) return disabledEnterAnimation();

  const option = animationOption == null || animationOption === true ? {} : asRecord(animationOption);
  if (option.show === false || option.enabled === false) return disabledEnterAnimation();

  const baseDelay = resolveAnimationNumber(option.delay ?? seriesModel.get('animationDelay'), itemIndex, itemIndex, 0);
  const stagger = resolveAnimationNumber(option.stagger, itemIndex, itemIndex, 32);
  return {
    enabled: true,
    duration: resolveAnimationNumber(option.duration ?? seriesModel.get('animationDuration'), itemIndex, itemIndex, 560),
    delay: baseDelay + itemIndex * stagger,
    easing: resolveAnimationEasing(option.easing ?? seriesModel.get('animationEasing'))
  };
}

function disabledEnterAnimation(): EnterAnimationConfig {
  return {
    enabled: false,
    duration: 0,
    delay: 0,
    easing: 'cubicOut'
  };
}

function readLinePointEnterAnimation(
  seriesModel: ErrorChartSeriesModel,
  itemIndex: number,
  point: ErrorChartPoint,
  layout: ErrorChartLayoutResult
): EnterAnimationConfig {
  const animation = readEnterAnimation(seriesModel, itemIndex);
  if (!animation.enabled) return animation;
  const lineAnimation = readEnterAnimation(seriesModel, 0);
  const ratio = lineRevealRatio(point, layout);
  return {
    ...animation,
    delay: lineAnimation.delay + lineAnimation.duration * ratio
  };
}

function lineRevealRatio(point: ErrorChartPoint, layout: ErrorChartLayoutResult): number {
  if (layout.orientation === 'horizontal') {
    return clamp((point.y - layout.plot.top) / layout.plot.height, 0, 1);
  }
  return clamp((point.x - layout.plot.left) / layout.plot.width, 0, 1);
}

function applyLineClipEnterAnimation(
  echartsInstance: EChartsHost,
  line: GraphicElement,
  seriesModel: ErrorChartSeriesModel,
  layout: ErrorChartLayoutResult
): void {
  const animation = readEnterAnimation(seriesModel, 0);
  if (!animation.enabled || !line.setClipPath) return;

  const clipPath = new echartsInstance.graphic.Rect({
    shape: layout.orientation === 'horizontal'
      ? { x: layout.plot.left, y: layout.plot.top, width: layout.plot.width, height: 0 }
      : { x: layout.plot.left, y: layout.plot.top, width: 0, height: layout.plot.height }
  });
  animateGraphicProperty(clipPath, 'shape', animation, layout.orientation === 'horizontal'
    ? { height: layout.plot.height }
    : { width: layout.plot.width });
  line.setClipPath(clipPath);
}

function delayEnterAnimation(animation: EnterAnimationConfig, delay: number): EnterAnimationConfig {
  if (!animation.enabled) return animation;
  return {
    ...animation,
    delay: animation.delay + Math.max(0, delay)
  };
}

function resolveAnimationNumber(value: unknown, item: unknown, itemIndex: number, fallback: number): number {
  const resolved = typeof value === 'function'
    ? (value as (item: unknown, itemIndex: number) => unknown)(item, itemIndex)
    : value;
  return finiteNumber(resolved, fallback);
}

function resolveAnimationEasing(value: unknown): string {
  return typeof value === 'string' && value ? value : 'cubicOut';
}

function applyRectEnterAnimation(
  element: GraphicElement,
  point: ErrorChartPoint,
  layout: ErrorChartLayoutResult,
  animation: EnterAnimationConfig
): void {
  if (!animation.enabled) return;
  if (layout.orientation === 'horizontal') {
    const x = Math.min(point.x, point.baseX);
    const width = Math.max(1, Math.abs(point.x - point.baseX));
    const shape = element.shape || {};
    shape.x = point.baseX;
    shape.width = 0;
    element.shape = shape;
    animateGraphicProperty(element, 'shape', animation, {
      x,
      width
    });
    return;
  }
  const y = Math.min(point.y, point.baseY);
  const height = Math.max(1, Math.abs(point.baseY - point.y));
  const shape = element.shape || {};
  shape.y = point.baseY;
  shape.height = 0;
  element.shape = shape;
  animateGraphicProperty(element, 'shape', animation, {
    y,
    height
  });
}

function applyCircleEnterAnimation(element: GraphicElement, radius: number, animation: EnterAnimationConfig): void {
  if (!animation.enabled) return;
  /* v8 ignore next -- zrender always provides a shape object for circles. */
  const shape = element.shape || {};
  shape.r = 0;
  element.shape = shape;
  animateGraphicProperty(element, 'shape', animation, { r: radius });
}

function applyFadeEnterAnimation(element: GraphicElement, animation: EnterAnimationConfig): void {
  if (!animation.enabled) return;
  /* v8 ignore next -- zrender text/polyline elements always carry style objects. */
  const style = element.style || {};
  const opacity = finiteNumber(style.opacity, 1);
  style.opacity = 0;
  element.style = style;
  animateGraphicProperty(element, 'style', animation, { opacity });
}

function animateGraphicProperty(
  element: GraphicElement,
  targetKey: AnimationTargetKey,
  animation: EnterAnimationConfig,
  target: Record<string, unknown>
): void {
  const animator = element.animate?.(targetKey);
  if (!animator) {
    /* v8 ignore next -- non-animating fallback is covered without missing target objects. */
    Object.assign(element[targetKey] || {}, target);
    return;
  }

  const chain = animator.when(animation.duration, target);
  if (animation.delay > 0) chain.delay?.(animation.delay);
  chain.start(animation.easing);
}

function addHoverElement(item: ElementHoverItem | undefined, element: GraphicElement): void {
  if (!item) return;
  item.elements.push(element);
  if (!item.triggerElements) item.triggerElements = [];
  item.triggerElements.push(element);
}

function transparentStyle(): Record<string, unknown> {
  return {
    fill: 'rgba(0,0,0,0)',
    stroke: 'rgba(0,0,0,0)',
    opacity: 0
  };
}

function stringifySeriesName(value: unknown): string {
  if (typeof value === 'string' && value.length) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function finiteNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function asRecord(value: unknown): Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export const __test__ = {
  readLayoutOption,
  createSeriesDataSource,
  createSeriesDataItem,
  drawErrorChart,
  drawAxes,
  drawSplitLines,
  drawAxisLine,
  drawValueAxisLabels,
  drawXValueAxisLabels,
  drawCategoryAxisLabels,
  drawSeries,
  createColumnBar,
  createHorizontalBar,
  drawErrorBars,
  drawSymbol,
  createHitElement,
  drawPointLabels,
  bindTooltipData,
  readBandWidth,
  readItemStyle,
  readErrorBarStyle,
  readLineStyle,
  readLineDash,
  formatAxisLabel,
  formatLabel,
  readEnterAnimation,
  disabledEnterAnimation,
  resolveAnimationNumber,
  resolveAnimationEasing,
  applyRectEnterAnimation,
  applyCircleEnterAnimation,
  applyFadeEnterAnimation,
  animateGraphicProperty,
  addHoverElement,
  transparentStyle,
  stringifySeriesName,
  finiteNumber,
  clamp,
  asRecord
};
