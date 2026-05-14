import * as echarts from 'echarts/lib/echarts';
import { clearAliveRender, installElementHover, renderAlive, setAliveRenderKey } from '@echarts-extension/layout-core';
import type { AliveRenderState, ElementHoverController, ElementHoverItem, ElementHoverOptions } from '@echarts-extension/layout-core';

import { resolveLollipopLayout } from './layout.js';
import type { LollipopLayoutOption, LollipopLayoutResult, LollipopPoint, LollipopTick } from './layout.js';

interface ViewRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface EChartsApi {
  getWidth(): number;
  getHeight(): number;
  getZr?(): ElementHoverOptions['zrender'];
}

interface EChartsModel {
  get(path: string | string[]): unknown;
  getModel(path: string | string[]): EChartsModel;
}

interface SeriesData {
  initData(source: unknown[]): void;
  count(): number;
  getItemModel(index: number): EChartsModel;
  getItemVisual(dataIndex: number, key: string): unknown;
  getItemLayout(dataIndex: number): unknown;
  setItemLayout(dataIndex: number, layout: [number, number]): void;
  setItemGraphicEl(dataIndex: number, element: GraphicElement): void;
}

interface LollipopSeriesModel extends EChartsModel {
  option?: LollipopLayoutOption;
  getBoxLayoutParams(): unknown;
  getData(): SeriesData;
}

interface GraphicElement {
  [key: string]: unknown;
  children?: () => GraphicElement[];
  childrenRef?: () => GraphicElement[];
  stopAnimation?: (scope?: string, forwardToLast?: boolean) => void;
}

interface AnimatableGraphicElement extends GraphicElement {
  shape?: Record<string, unknown>;
  style?: Record<string, unknown>;
  animate?: (key: AnimationTargetKey, loop?: boolean) => GraphicAnimator | null | undefined;
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
    getLayoutRect(params: unknown, container: { width: number; height: number }): ViewRect;
  };
  List: new (dimensions: unknown, host: LollipopSeriesModel) => SeriesData;
  graphic: {
    Group: new () => GraphicGroup;
    Circle: new (options: GraphicElementOptions) => GraphicElement;
    Line: new (options: GraphicElementOptions) => GraphicElement;
    Text: new (options: GraphicElementOptions) => GraphicElement;
    makePath?: (path: string, options: GraphicElementOptions) => GraphicElement;
  };
}


interface LollipopChartView {
  group: GraphicGroup;
  __renderToken?: object | null;
  __hoverController?: ElementHoverController;
  __aliveRenderState?: AliveRenderState;
  __lollipopPointIds?: Set<string>;
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
  'categoryField',
  'valueField',
  'nameField',
  'dimensions',
  'categories',
  'min',
  'max',
  'baseline',
  'tickCount',
  'nice'
] as const satisfies ReadonlyArray<Extract<keyof LollipopLayoutOption, string>>;
const layerZ = {
  axis: 0,
  stem: 4,
  hit: 7,
  symbol: 8,
  label: 9
} as const;

echartsHost.extendSeriesModel({
  type: 'series.lollipop',

  visualStyleAccessPath: 'itemStyle',
  visualDrawType: 'fill',

  getInitialData(this: LollipopSeriesModel, option: LollipopLayoutOption) {
    const source = createSeriesDataSource(option);
    const dimensions = echartsHost.helper.createDimensions(source, {
      coordDimensions: ['value']
    });
    const list = new echartsHost.List(dimensions, this);
    list.initData(source);
    return list;
  },

  getTooltipPosition(this: LollipopSeriesModel, dataIndex: number) {
    const layout = this.getData().getItemLayout(dataIndex);
    return Array.isArray(layout) ? layout : undefined;
  },

  defaultOption: {
    left: 'center',
    top: 'center',
    width: '94%',
    height: '84%',
    padding: {
      top: 36,
      right: 28,
      bottom: 78,
      left: 78
    },
    categoryField: 'category',
    valueField: 'value',
    nameField: null,
    dimensions: null,
    categories: null,
    min: null,
    max: null,
    baseline: 0,
    tickCount: 5,
    nice: true,
    large: false,
    symbolSize: 12,
    enterAnimation: true,
    grid: {
      show: true
    },
    valueAxis: {
      show: true,
      name: null,
      label: {
        show: true,
        color: '#c8c9cf',
        fontSize: 14,
        fontWeight: 500,
        formatter: '{value}'
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: '#2f3033',
          width: 1,
          opacity: 1,
          type: 'solid'
        }
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: '#e5e7eb',
          width: 1.2,
          opacity: 1
        }
      },
      nameTextStyle: {
        color: '#aeb0b5',
        fontSize: 14,
        fontWeight: 600
      }
    },
    categoryAxis: {
      show: true,
      label: {
        show: true,
        color: '#d4d4d8',
        fontSize: 14,
        fontWeight: 500,
        rotate: 45,
        formatter: '{value}'
      }
    },
    stemStyle: {
      color: '#28aefc',
      width: 1.4,
      opacity: 0.95,
      type: 'solid'
    },
    itemStyle: {
      color: '#2db5ff',
      borderColor: '#2db5ff',
      borderWidth: 0,
      opacity: 1
    },
    label: {
      show: false,
      color: '#d4d4d8',
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
        shadowColor: 'rgba(45, 181, 255, 0.32)'
      }
    }
  }
});

echartsHost.extendChartView({
  type: 'lollipop',

  render(this: LollipopChartView, seriesModel: LollipopSeriesModel, ecModel: unknown, api: EChartsApi) {
    const group = this.group;
    const renderToken = {};
    this.__renderToken = renderToken;
    this.__hoverController?.dispose();
    this.__hoverController = undefined;

    try {
      const rect = echartsHost.helper.getLayoutRect(seriesModel.getBoxLayoutParams(), {
        width: api.getWidth(),
        height: api.getHeight()
      });
      const layout = resolveLollipopLayout(readLayoutOption(seriesModel, rect));
      if (this.__renderToken !== renderToken) return;
      const previousPointIds = this.__lollipopPointIds;
      if (previousPointIds) settleExistingPointEnterAnimations(group, previousPointIds);
      const { hoverItems } = renderAlive(this, echartsHost, group, seriesModel, (targetGroup, targetSeriesModel) => (
        drawLollipop(echartsHost, targetGroup, targetSeriesModel, layout, rect, previousPointIds, seriesModel)
      ));
      this.__lollipopPointIds = new Set(layout.points.map(lollipopPointKey));
      this.__hoverController = installElementHover(hoverItems, {
        zrender: api.getZr?.()
      });
    } catch (error) {
      console.error('[lollipop] render failed', error);
    }
  },

  remove(this: LollipopChartView) {
    this.__renderToken = null;
    this.__hoverController?.dispose();
    this.__hoverController = undefined;
    this.__lollipopPointIds = undefined;
    clearAliveRender(this);
    this.group.removeAll();
  },

  dispose(this: LollipopChartView) {
    this.__renderToken = null;
    this.__hoverController?.dispose();
    this.__hoverController = undefined;
    this.__lollipopPointIds = undefined;
    clearAliveRender(this);
    this.group.removeAll();
  }
});

function readLayoutOption(seriesModel: LollipopSeriesModel, rect: ViewRect): LollipopLayoutOption {
  const option = seriesModel.option || {};
  const layoutOption: LollipopLayoutOption = {
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

function createSeriesDataSource(option: LollipopLayoutOption): unknown[] {
  const source = Array.isArray(option.data) ? option.data : [];
  const dimensions = normalizeSeriesDimensions(option.dimensions);
  return source.map((item, dataIndex) => createSeriesDataItem(item, dataIndex, option, dimensions));
}

function createSeriesDataItem(
  item: unknown,
  dataIndex: number,
  option: LollipopLayoutOption,
  dimensions: string[] | undefined
): Record<string, unknown> {
  const categoryValue = readSeriesField(item, option.categoryField ?? 'category', dimensions, 0, ['name', 'country', 'label']);
  const value = finiteNumber(readSeriesField(item, option.valueField ?? 'value', dimensions, 1, [
    'population',
    'amount',
    'count',
    'users',
    'total'
  ]), NaN);
  const nameValue = readSeriesField(item, option.nameField ?? 'name', dimensions, -1, []);
  const name = stringifySeriesName(nameValue ?? categoryValue ?? `item-${dataIndex}`);

  return {
    ...(asRecord(item)),
    name,
    value
  };
}

function readSeriesField(
  item: unknown,
  field: string | number,
  dimensions: string[] | undefined,
  fallbackIndex: number,
  fallbackNames: string[]
): unknown {
  if (Array.isArray(item)) {
    const index = typeof field === 'number' ? field : dimensions?.indexOf(field);
    const resolvedIndex = index != null && index >= 0 ? index : fallbackIndex;
    return resolvedIndex >= 0 ? item[resolvedIndex] : undefined;
  }

  const record = asRecord(item);
  if (typeof field === 'string' && record[field] != null) return record[field];
  if (typeof field === 'number') return undefined;
  for (const fallbackName of fallbackNames) {
    if (record[fallbackName] != null) return record[fallbackName];
  }
  return undefined;
}

function normalizeSeriesDimensions(value: unknown): string[] | undefined {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : undefined;
}

function stringifySeriesName(value: unknown): string {
  if (typeof value === 'string' && value.length) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function drawLollipop(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: LollipopSeriesModel,
  layout: LollipopLayoutResult,
  rect: ViewRect,
  previousPointIds?: Set<string>,
  animationSeriesModel: LollipopSeriesModel = seriesModel
): ElementHoverItem[] {
  const chartGroup = new echartsInstance.graphic.Group();
  chartGroup.x = rect.x;
  chartGroup.y = rect.y;

  drawAxes(echartsInstance, chartGroup, seriesModel, layout);
  const hoverItems = drawPoints(echartsInstance, chartGroup, seriesModel, layout, rect, previousPointIds, animationSeriesModel);

  group.add(chartGroup);
  return hoverItems;
}

function drawAxes(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: LollipopSeriesModel,
  layout: LollipopLayoutResult
): void {
  const valueAxisModel = seriesModel.getModel('valueAxis');
  const categoryAxisModel = seriesModel.getModel('categoryAxis');
  const valueAxisVisible = valueAxisModel.get('show') !== false;
  const categoryAxisVisible = categoryAxisModel.get('show') !== false;

  if (seriesModel.getModel('grid').get('show') !== false && valueAxisVisible) {
    const splitLineModel = valueAxisModel.getModel('splitLine');
    if (splitLineModel.get('show') !== false) {
      const style = readLineStyle(splitLineModel.getModel('lineStyle'), {
        stroke: '#2f3033',
        lineWidth: 1,
        opacity: 1
      });
      layout.ticks.forEach((tick) => {
        group.add(new echartsInstance.graphic.Line({
          shape: {
            x1: tick.x1,
            y1: tick.y,
            x2: tick.x2,
            y2: tick.y
          },
          style,
          silent: true,
          z2: layerZ.axis
        }));
      });
    }

    const axisLineModel = valueAxisModel.getModel('axisLine');
    if (axisLineModel.get('show') !== false) {
      group.add(new echartsInstance.graphic.Line({
        shape: {
          x1: layout.plot.left,
          y1: layout.baselineY,
          x2: layout.plot.right,
          y2: layout.baselineY
        },
        style: readLineStyle(axisLineModel.getModel('lineStyle'), {
          stroke: '#e5e7eb',
          lineWidth: 1.2,
          opacity: 1
        }),
        silent: true,
        z2: layerZ.axis
      }));
    }
  }

  if (valueAxisVisible) {
    drawValueAxisLabels(echartsInstance, group, valueAxisModel, layout);
  }
  if (categoryAxisVisible) {
    drawCategoryAxisLabels(echartsInstance, group, categoryAxisModel, layout);
  }
}

function drawValueAxisLabels(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  axisModel: EChartsModel,
  layout: LollipopLayoutResult
): void {
  const labelModel = axisModel.getModel('label');
  if (labelModel.get('show') === false) return;
  const fontSize = finiteNumber(labelModel.get('fontSize'), 14);
  layout.ticks.forEach((tick) => {
    const label = new echartsInstance.graphic.Text({
      style: {
        x: layout.plot.left - 12,
        y: tick.y,
        text: formatAxisLabel(labelModel.get('formatter'), tick.value),
        fill: labelModel.get('color') || '#c8c9cf',
        fontSize,
        fontWeight: labelModel.get('fontWeight') || 500,
        align: 'right',
        verticalAlign: 'middle'
      },
      silent: true,
      z2: layerZ.axis
    });
    setAliveRenderKey(label, `lollipop-value-label:${tick.value}`);
    group.add(label);
  });

  const axisName = axisModel.get('name');
  if (typeof axisName !== 'string' || !axisName) return;
  const nameStyle = asRecord(axisModel.get('nameTextStyle'));
  const name = new echartsInstance.graphic.Text({
    style: {
      x: Math.max(16, layout.plot.left - 58),
      y: layout.plot.top + layout.plot.height / 2,
      text: axisName,
      fill: nameStyle.color || '#aeb0b5',
      fontSize: finiteNumber(nameStyle.fontSize, 14),
      fontWeight: nameStyle.fontWeight || 600,
      align: 'center',
      verticalAlign: 'middle'
    },
    rotation: -Math.PI / 2,
    originX: Math.max(16, layout.plot.left - 58),
    originY: layout.plot.top + layout.plot.height / 2,
    silent: true,
    z2: layerZ.axis
  });
  setAliveRenderKey(name, 'lollipop-value-axis-name');
  group.add(name);
}

function drawCategoryAxisLabels(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  axisModel: EChartsModel,
  layout: LollipopLayoutResult
): void {
  const labelModel = axisModel.getModel('label');
  if (labelModel.get('show') === false) return;
  const rotateDegrees = finiteNumber(labelModel.get('rotate'), 0);
  const rotation = rotateDegrees * Math.PI / 180;
  const fontSize = finiteNumber(labelModel.get('fontSize'), 14);

  layout.categoryLabels.forEach((label) => {
    const text = new echartsInstance.graphic.Text({
      style: {
        x: label.x,
        y: label.y,
        text: formatAxisLabel(labelModel.get('formatter'), label.name),
        fill: labelModel.get('color') || '#d4d4d8',
        fontSize,
        fontWeight: labelModel.get('fontWeight') || 500,
        align: rotateDegrees ? 'right' : 'center',
        verticalAlign: rotateDegrees ? 'middle' : 'top'
      },
      rotation,
      originX: label.x,
      originY: label.y,
      silent: true,
      z2: layerZ.axis
    });
    setAliveRenderKey(text, `lollipop-category-label:${label.value}`);
    group.add(text);
  });
}

function drawPoints(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: LollipopSeriesModel,
  layout: LollipopLayoutResult,
  rect: ViewRect,
  previousPointIds?: Set<string>,
  animationSeriesModel: LollipopSeriesModel = seriesModel
): ElementHoverItem[] {
  const data = seriesModel.getData();
  const symbolSize = Math.max(0, finiteNumber(seriesModel.get('symbolSize'), 12));
  const silent = seriesModel.get('silent') === true;
  const mergedStems = silent && seriesModel.get('large') === true && drawMergedStems(echartsInstance, group, seriesModel, layout.points);
  const hoverItems: ElementHoverItem[] = [];
  const hoverItemsByDataIndex = new Map<number, ElementHoverItem>();

  layout.points.forEach((point, pointIndex) => {
    if (point.dataIndex < 0 || point.dataIndex >= data.count()) return;

    let itemModel: EChartsModel | undefined;
    const readItemModel = () => {
      itemModel = itemModel || data.getItemModel(point.dataIndex);
      return itemModel;
    };
    const pointKey = lollipopPointKey(point);
    const isInsertedPoint = previousPointIds != null && !previousPointIds.has(pointKey);
    const animation = isInsertedPoint
      ? readEnterAnimation(animationSeriesModel, pointIndex)
      : readEnterAnimation(seriesModel, pointIndex);
    let stem: GraphicElement | null = null;
    if (!mergedStems) {
      stem = new echartsInstance.graphic.Line({
        shape: {
          x1: point.baseX,
          y1: point.baseY,
          x2: point.x,
          y2: point.y
        },
        style: readStemStyle(seriesModel, readItemModel()),
        z2: layerZ.stem
      });
      applyStemEnterAnimation(stem, point, animation);
      stem.silent = silent;
      setAliveRenderKey(stem, `lollipop-stem:${pointKey}`);
      group.add(stem);
    }
    data.setItemLayout(point.dataIndex, [point.x + rect.x, point.y + rect.y]);

    let symbol: GraphicElement | null = null;
    if (symbolSize > 0) {
      symbol = new echartsInstance.graphic.Circle({
        shape: {
          cx: point.x,
          cy: point.y,
          r: symbolSize / 2
        },
        style: readPointStyle(data, seriesModel, readItemModel(), point),
        z2: layerZ.symbol
      });
      applyCircleEnterAnimation(symbol, symbolSize / 2, animation);
      symbol.silent = silent;
      if (silent) data.setItemGraphicEl(point.dataIndex, symbol);
      setAliveRenderKey(symbol, `lollipop-symbol:${pointKey}`);
      group.add(symbol);
    }

    if (silent) return;

    const hitCircle = new echartsInstance.graphic.Circle({
      shape: {
        cx: point.x,
        cy: point.y,
        r: Math.max(symbolSize / 2, 8)
      },
      style: {
        fill: 'rgba(0,0,0,0)',
        stroke: 'rgba(0,0,0,0)',
        opacity: 0
      },
      z2: layerZ.hit
    });
    data.setItemGraphicEl(point.dataIndex, hitCircle);
    setAliveRenderKey(hitCircle, `lollipop-hit:${pointKey}`);
    group.add(hitCircle);

    const hoverItem = {
      elements: [stem, symbol].filter(Boolean) as GraphicElement[],
      triggerElements: [hitCircle, stem, symbol].filter(Boolean) as GraphicElement[]
    };
    hoverItems.push(hoverItem);
    hoverItemsByDataIndex.set(point.dataIndex, hoverItem);
  });

  drawPointLabels(echartsInstance, group, seriesModel, layout.points, hoverItemsByDataIndex);
  return hoverItems;
}

function drawMergedStems(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: LollipopSeriesModel,
  points: LollipopPoint[]
): boolean {
  if (!echartsInstance.graphic.makePath) return false;
  const path = points
    .filter((point) => point.dataIndex >= 0)
    .map((point) => `M${pathNumber(point.baseX)} ${pathNumber(point.baseY)}L${pathNumber(point.x)} ${pathNumber(point.y)}`)
    .join('');
  if (!path) return false;

  const stems = echartsInstance.graphic.makePath(path, {
    style: {
      ...readLineStyle(seriesModel.getModel('stemStyle'), {
        stroke: '#28aefc',
        lineWidth: 1.4,
        opacity: 0.95
      }),
      fill: null
    },
    silent: true,
    z2: layerZ.stem
  });
  group.add(stems);
  return true;
}

function drawPointLabels(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: LollipopSeriesModel,
  points: LollipopPoint[],
  hoverItemsByDataIndex: Map<number, ElementHoverItem>
): void {
  const seriesLabelModel = seriesModel.getModel('label');
  if (seriesLabelModel.get('show') !== true) return;

  points.forEach((point) => {
    const itemModel = seriesModel.getData().getItemModel(point.dataIndex);
    const itemLabelModel = itemModel.getModel('label');
    const show = itemLabelModel.get('show') ?? seriesLabelModel.get('show');
    if (show === false) return;

    const text = formatLabel(itemLabelModel.get('formatter') || seriesLabelModel.get('formatter'), point);
    const dy = point.y <= point.baseY ? -10 : 10;
    const label = new echartsInstance.graphic.Text({
      style: {
        x: point.x,
        y: point.y + dy,
        text: String(text),
        fill: itemLabelModel.get('color') || seriesLabelModel.get('color') || '#d4d4d8',
        fontSize: finiteNumber(itemLabelModel.get('fontSize'), finiteNumber(seriesLabelModel.get('fontSize'), 12)),
        fontWeight: itemLabelModel.get('fontWeight') || seriesLabelModel.get('fontWeight') || 600,
        align: 'center',
        verticalAlign: dy < 0 ? 'bottom' : 'top'
      },
      silent: true,
      z2: layerZ.label
    });
    applyFadeEnterAnimation(label, readEnterAnimation(seriesModel, point.dataIndex));
    setAliveRenderKey(label, `lollipop-label:${lollipopPointKey(point)}`);
    addHoverElement(hoverItemsByDataIndex.get(point.dataIndex), label);
    group.add(label);
  });
}

function lollipopPointKey(point: LollipopPoint): string {
  return point.id || point.category || point.name || `item-${point.dataIndex}`;
}

function settleExistingPointEnterAnimations(element: GraphicElement, pointIds: Set<string>): void {
  const aliveKey = typeof element.__aliveRenderKey === 'string' ? element.__aliveRenderKey : '';
  const pointKey = lollipopPointKeyFromAliveKey(aliveKey);
  if (pointKey && pointIds.has(pointKey)) {
    element.stopAnimation?.(undefined, true);
  }
  graphicChildren(element).forEach((child) => settleExistingPointEnterAnimations(child, pointIds));
}

function lollipopPointKeyFromAliveKey(aliveKey: string): string {
  const prefixes = [
    'lollipop-stem:',
    'lollipop-symbol:',
    'lollipop-hit:',
    'lollipop-label:'
  ];
  const prefix = prefixes.find((item) => aliveKey.startsWith(item));
  return prefix ? aliveKey.slice(prefix.length) : '';
}

function graphicChildren(element: GraphicElement): GraphicElement[] {
  if (typeof element.childrenRef === 'function') return element.childrenRef().slice();
  if (typeof element.children === 'function') return element.children().slice();
  return [];
}

function readStemStyle(seriesModel: LollipopSeriesModel, itemModel: EChartsModel): Record<string, unknown> {
  const seriesStemModel = seriesModel.getModel('stemStyle');
  const itemStemModel = itemModel.getModel('stemStyle');
  return readLineStyle(itemStemModel, readLineStyle(seriesStemModel, {
    stroke: '#28aefc',
    lineWidth: 1.4,
    opacity: 0.95
  }));
}

function readPointStyle(
  data: SeriesData,
  seriesModel: LollipopSeriesModel,
  itemModel: EChartsModel,
  point: LollipopPoint
): Record<string, unknown> {
  const itemStyleModel = itemModel.getModel('itemStyle');
  const seriesItemStyleModel = seriesModel.getModel('itemStyle');
  const visualStyle = asRecord(data.getItemVisual(point.dataIndex, 'style'));
  const fill = itemStyleModel.get('color') || visualStyle.fill || seriesItemStyleModel.get('color') || '#2db5ff';
  return {
    fill,
    stroke: itemStyleModel.get('borderColor') || seriesItemStyleModel.get('borderColor') || fill,
    lineWidth: finiteNumber(itemStyleModel.get('borderWidth'), finiteNumber(seriesItemStyleModel.get('borderWidth'), 0)),
    opacity: finiteNumber(itemStyleModel.get('opacity'), finiteNumber(seriesItemStyleModel.get('opacity'), 1))
  };
}

function readLineStyle(model: EChartsModel, defaults: Record<string, unknown>): Record<string, unknown> {
  const color = model.get('color') || model.get('stroke') || defaults.stroke || defaults.color;
  const lineType = model.get('type') || defaults.type;
  return {
    stroke: color,
    lineWidth: finiteNumber(model.get('width'), finiteNumber(model.get('lineWidth'), finiteNumber(defaults.lineWidth, 1))),
    opacity: finiteNumber(model.get('opacity'), finiteNumber(defaults.opacity, 1)),
    lineDash: readLineDash(lineType)
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

function formatLabel(formatter: unknown, point: LollipopPoint): unknown {
  const params = {
    data: point.raw,
    name: point.name,
    value: point.value,
    category: point.category
  };

  if (typeof formatter === 'function') {
    return (formatter as (input: typeof params) => unknown)(params);
  }
  if (typeof formatter === 'string') {
    return formatter
      .replace(/\{b\}/g, point.name)
      .replace(/\{c\}/g, String(point.value))
      .replace(/\{category\}/g, point.category);
  }
  return point.value;
}

function pathNumber(value: number): string {
  return String(Math.round(value * 1000) / 1000);
}

function readEnterAnimation(
  seriesModel: LollipopSeriesModel,
  itemIndex: number,
  animationOption = seriesModel.get('enterAnimation')
): EnterAnimationConfig {
  if (seriesModel.get('animation') === false || animationOption === false) return disabledEnterAnimation();

  const option = animationOption == null || animationOption === true ? {} : asRecord(animationOption);
  if (option.show === false || option.enabled === false) return disabledEnterAnimation();

  const baseDelay = resolveAnimationNumber(option.delay ?? seriesModel.get('animationDelay'), itemIndex, itemIndex, 0);
  const stagger = resolveAnimationNumber(option.stagger, itemIndex, itemIndex, 36);
  return {
    enabled: true,
    duration: resolveAnimationNumber(option.duration ?? seriesModel.get('animationDuration'), itemIndex, itemIndex, 620),
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

function resolveAnimationNumber(value: unknown, item: unknown, itemIndex: number, fallback: number): number {
  const resolved = typeof value === 'function'
    ? (value as (item: unknown, itemIndex: number) => unknown)(item, itemIndex)
    : value;
  return finiteNumber(resolved, fallback);
}

function resolveAnimationEasing(value: unknown): string {
  return typeof value === 'string' && value ? value : 'cubicOut';
}

function applyStemEnterAnimation(element: GraphicElement, point: LollipopPoint, animation: EnterAnimationConfig): void {
  if (!animation.enabled) return;
  const animatable = element as AnimatableGraphicElement;
  if (typeof animatable.animate !== 'function') return;

  const shape = animatable.shape || {};
  shape.x2 = point.baseX;
  shape.y2 = point.baseY;
  animatable.shape = shape;
  animateGraphicProperty(animatable, 'shape', animation, {
    x2: point.x,
    y2: point.y
  });
}

function applyCircleEnterAnimation(element: GraphicElement, radius: number, animation: EnterAnimationConfig): void {
  if (!animation.enabled) return;
  const animatable = element as AnimatableGraphicElement;
  if (typeof animatable.animate !== 'function') return;

  const shape = animatable.shape || {};
  shape.r = 0;
  animatable.shape = shape;
  animateGraphicProperty(animatable, 'shape', animation, { r: radius });
}

function applyFadeEnterAnimation(element: GraphicElement, animation: EnterAnimationConfig): void {
  if (!animation.enabled) return;
  const animatable = element as AnimatableGraphicElement;
  if (typeof animatable.animate !== 'function') return;

  const style = animatable.style || {};
  const opacity = finiteNumber(style.opacity, 1);
  style.opacity = 0;
  animatable.style = style;
  animateGraphicProperty(animatable, 'style', animation, { opacity });
}

function animateGraphicProperty(
  element: AnimatableGraphicElement,
  targetKey: AnimationTargetKey,
  animation: EnterAnimationConfig,
  target: Record<string, unknown>
): void {
  const animator = element.animate?.(targetKey);
  if (!animator) {
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

function finiteNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export const __test__ = {
  readLayoutOption,
  createSeriesDataSource,
  createSeriesDataItem,
  readSeriesField,
  normalizeSeriesDimensions,
  stringifySeriesName,
  drawLollipop,
  drawAxes,
  drawValueAxisLabels,
  drawCategoryAxisLabels,
  drawPoints,
  drawMergedStems,
  drawPointLabels,
  lollipopPointKey,
  settleExistingPointEnterAnimations,
  lollipopPointKeyFromAliveKey,
  graphicChildren,
  readStemStyle,
  readPointStyle,
  readLineStyle,
  readLineDash,
  formatAxisLabel,
  formatLabel,
  pathNumber,
  readEnterAnimation,
  disabledEnterAnimation,
  resolveAnimationNumber,
  resolveAnimationEasing,
  applyStemEnterAnimation,
  applyCircleEnterAnimation,
  applyFadeEnterAnimation,
  animateGraphicProperty,
  addHoverElement,
  finiteNumber,
  asRecord
};
