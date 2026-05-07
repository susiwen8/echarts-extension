import * as echarts from 'echarts/lib/echarts';
import { clearAliveRender, installElementHover, renderAlive } from '@echarts-extension/layout-core';
import type { AliveRenderState, ElementHoverController, ElementHoverItem, ElementHoverOptions } from '@echarts-extension/layout-core';

import { resolveBeeswarmLayout } from './layout.js';
import type { BeeswarmLayoutOption, BeeswarmLayoutResult, BeeswarmPoint, BeeswarmTick } from './layout.js';

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

interface BeeswarmSeriesModel extends EChartsModel {
  option?: BeeswarmLayoutOption;
  getBoxLayoutParams(): unknown;
  getData(): SeriesData;
}

interface GraphicElement {
  [key: string]: unknown;
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
  List: new (dimensions: unknown, host: BeeswarmSeriesModel) => SeriesData;
  graphic: {
    Group: new () => GraphicGroup;
    Circle: new (options: GraphicElementOptions) => GraphicElement;
    Line: new (options: GraphicElementOptions) => GraphicElement;
    Text: new (options: GraphicElementOptions) => GraphicElement;
  };
}


interface BeeswarmChartView {
  group: GraphicGroup;
  __renderToken?: object | null;
  __hoverController?: ElementHoverController;
  __aliveRenderState?: AliveRenderState;
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
  'orient',
  'min',
  'max',
  'tickCount',
  'nice',
  'symbolSize',
  'collisionPadding',
  'swarmRadius'
] as const satisfies ReadonlyArray<Extract<keyof BeeswarmLayoutOption, string>>;
const layerZ = {
  axis: 0,
  hit: 7,
  symbol: 8,
  label: 9
} as const;
const DEFAULT_COLORS = [
  '#1f77b4',
  '#2ca02c',
  '#ff7f0e',
  '#9467bd',
  '#d62728',
  '#17becf',
  '#bcbd22'
];

echartsHost.extendSeriesModel({
  type: 'series.beeswarm',

  visualStyleAccessPath: 'itemStyle',
  visualDrawType: 'fill',

  getInitialData(this: BeeswarmSeriesModel, option: BeeswarmLayoutOption) {
    const source = Array.isArray(option.data) ? option.data : [];
    const dimensions = echartsHost.helper.createDimensions(source, {
      coordDimensions: ['value']
    });
    const list = new echartsHost.List(dimensions, this);
    list.initData(source);
    return list;
  },

  getTooltipPosition(this: BeeswarmSeriesModel, dataIndex: number) {
    const layout = this.getData().getItemLayout(dataIndex);
    return Array.isArray(layout) ? layout : undefined;
  },

  defaultOption: {
    left: 'center',
    top: 'center',
    width: '94%',
    height: '84%',
    padding: {
      top: 32,
      right: 34,
      bottom: 62,
      left: 86
    },
    categoryField: 'category',
    valueField: 'value',
    nameField: null,
    dimensions: null,
    categories: null,
    orient: 'horizontal',
    min: null,
    max: null,
    tickCount: 5,
    nice: true,
    symbolSize: 12,
    collisionPadding: 1,
    swarmRadius: null,
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
        fontSize: 13,
        fontWeight: 500,
        formatter: '{value}'
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: '#d9dee8',
          width: 1,
          opacity: 0.82,
          type: 'dashed'
        }
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: '#9ca3af',
          width: 1.1,
          opacity: 1
        }
      },
      nameTextStyle: {
        color: '#4b5563',
        fontSize: 13,
        fontWeight: 600
      }
    },
    categoryAxis: {
      show: true,
      label: {
        show: true,
        color: '#374151',
        fontSize: 14,
        fontWeight: 650,
        rotate: 0,
        formatter: '{value}'
      }
    },
    itemStyle: {
      color: null,
      borderColor: '#ffffff',
      borderWidth: 1.4,
      opacity: 0.88
    },
    label: {
      show: false,
      color: '#111827',
      fontSize: 12,
      fontWeight: 650,
      formatter: '{b}'
    },
    tooltip: {
      trigger: 'item'
    },
    emphasis: {
      itemStyle: {
        opacity: 1,
        borderWidth: 2,
        shadowBlur: 8,
        shadowColor: 'rgba(31, 41, 55, 0.22)'
      }
    }
  }
});

echartsHost.extendChartView({
  type: 'beeswarm',

  render(this: BeeswarmChartView, seriesModel: BeeswarmSeriesModel, ecModel: unknown, api: EChartsApi) {
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
      const layout = resolveBeeswarmLayout(readLayoutOption(seriesModel, rect));
      if (this.__renderToken !== renderToken) return;
      const { hoverItems } = renderAlive(this, echartsHost, group, seriesModel, (targetGroup, targetSeriesModel) => (
        drawBeeswarm(echartsHost, targetGroup, targetSeriesModel, layout, rect)
      ));
      this.__hoverController = installElementHover(hoverItems, {
        dimOpacity: 0.18,
        zrender: api.getZr?.()
      });
    } catch (error) {
      if (typeof console !== 'undefined') {
        console.error('[beeswarm] render failed', error);
      }
    }
  },

  remove(this: BeeswarmChartView) {
    this.__renderToken = null;
    this.__hoverController?.dispose();
    this.__hoverController = undefined;
    clearAliveRender(this);
    this.group.removeAll();
  },

  dispose(this: BeeswarmChartView) {
    this.__renderToken = null;
    this.__hoverController?.dispose();
    this.__hoverController = undefined;
    clearAliveRender(this);
    this.group.removeAll();
  }
});

function readLayoutOption(seriesModel: BeeswarmSeriesModel, rect: ViewRect): BeeswarmLayoutOption {
  const option = seriesModel.option || {};
  const layoutOption: BeeswarmLayoutOption = {
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

function drawBeeswarm(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: BeeswarmSeriesModel,
  layout: BeeswarmLayoutResult,
  rect: ViewRect
): ElementHoverItem[] {
  const chartGroup = new echartsInstance.graphic.Group();
  chartGroup.x = rect.x;
  chartGroup.y = rect.y;

  drawAxes(echartsInstance, chartGroup, seriesModel, layout);
  const hoverItems = drawPoints(echartsInstance, chartGroup, seriesModel, layout, rect);

  group.add(chartGroup);
  return hoverItems;
}

function drawAxes(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: BeeswarmSeriesModel,
  layout: BeeswarmLayoutResult
): void {
  const valueAxisModel = seriesModel.getModel('valueAxis');
  const categoryAxisModel = seriesModel.getModel('categoryAxis');
  const valueAxisVisible = valueAxisModel.get('show') !== false;
  const categoryAxisVisible = categoryAxisModel.get('show') !== false;

  if (seriesModel.getModel('grid').get('show') !== false && valueAxisVisible) {
    const splitLineModel = valueAxisModel.getModel('splitLine');
    if (splitLineModel.get('show') !== false) {
      const style = readLineStyle(splitLineModel.getModel('lineStyle'), {
        stroke: '#d9dee8',
        lineWidth: 1,
        opacity: 0.82,
        type: 'dashed'
      });
      layout.ticks.forEach((tick) => drawTickLine(echartsInstance, group, tick, style));
    }

    const axisLineModel = valueAxisModel.getModel('axisLine');
    if (axisLineModel.get('show') !== false) {
      group.add(new echartsInstance.graphic.Line({
        shape: layout.orient === 'vertical'
          ? {
              x1: layout.plot.left,
              y1: layout.plot.top,
              x2: layout.plot.left,
              y2: layout.plot.bottom
            }
          : {
              x1: layout.plot.left,
              y1: layout.plot.bottom,
              x2: layout.plot.right,
              y2: layout.plot.bottom
            },
        style: readLineStyle(axisLineModel.getModel('lineStyle'), {
          stroke: '#9ca3af',
          lineWidth: 1.1,
          opacity: 1
        }),
        silent: true,
        z2: layerZ.axis
      }));
    }
  }

  if (valueAxisVisible) drawValueAxisLabels(echartsInstance, group, valueAxisModel, layout);
  if (categoryAxisVisible) drawCategoryAxisLabels(echartsInstance, group, categoryAxisModel, layout);
}

function drawTickLine(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  tick: BeeswarmTick,
  style: Record<string, unknown>
): void {
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
}

function drawValueAxisLabels(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  axisModel: EChartsModel,
  layout: BeeswarmLayoutResult
): void {
  const labelModel = axisModel.getModel('label');
  if (labelModel.get('show') === false) return;

  const fontSize = finiteNumber(labelModel.get('fontSize'), 13);
  layout.ticks.forEach((tick) => {
    group.add(new echartsInstance.graphic.Text({
      style: layout.orient === 'vertical'
        ? {
            x: layout.plot.left - 12,
            y: tick.y,
            text: formatAxisLabel(labelModel.get('formatter'), tick.value),
            fill: labelModel.get('color') || '#6b7280',
            fontSize,
            fontWeight: labelModel.get('fontWeight') || 500,
            align: 'right',
            verticalAlign: 'middle'
          }
        : {
            x: tick.x,
            y: layout.plot.bottom + 12,
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

  const axisName = axisModel.get('name');
  if (typeof axisName !== 'string' || !axisName) return;
  const nameStyle = asRecord(axisModel.get('nameTextStyle'));
  if (layout.orient === 'vertical') {
    const x = Math.max(16, layout.plot.left - 58);
    const y = layout.plot.top + layout.plot.height / 2;
    group.add(new echartsInstance.graphic.Text({
      style: {
        x,
        y,
        text: axisName,
        fill: nameStyle.color || '#4b5563',
        fontSize: finiteNumber(nameStyle.fontSize, 13),
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
    return;
  }

  group.add(new echartsInstance.graphic.Text({
    style: {
      x: layout.plot.left + layout.plot.width / 2,
      y: layout.plot.bottom + 40,
      text: axisName,
      fill: nameStyle.color || '#4b5563',
      fontSize: finiteNumber(nameStyle.fontSize, 13),
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
  layout: BeeswarmLayoutResult
): void {
  const labelModel = axisModel.getModel('label');
  if (labelModel.get('show') === false) return;
  const rotateDegrees = layout.orient === 'vertical' ? finiteNumber(labelModel.get('rotate'), 0) : 0;
  const rotation = rotateDegrees * Math.PI / 180;
  const fontSize = finiteNumber(labelModel.get('fontSize'), 14);

  layout.categoryLabels.forEach((label) => {
    group.add(new echartsInstance.graphic.Text({
      style: {
        x: label.x,
        y: label.y,
        text: formatAxisLabel(labelModel.get('formatter'), label.name),
        fill: labelModel.get('color') || '#374151',
        fontSize,
        fontWeight: labelModel.get('fontWeight') || 650,
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

function drawPoints(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: BeeswarmSeriesModel,
  layout: BeeswarmLayoutResult,
  rect: ViewRect
): ElementHoverItem[] {
  const data = seriesModel.getData();
  const silent = seriesModel.get('silent') === true;
  const hoverItems: ElementHoverItem[] = [];
  const hoverItemsByDataIndex = new Map<number, ElementHoverItem>();

  layout.points.forEach((point, pointIndex) => {
    if (point.dataIndex < 0 || point.dataIndex >= data.count()) return;

    const itemModel = data.getItemModel(point.dataIndex);
    const animation = readEnterAnimation(seriesModel, pointIndex);
    const symbol = new echartsInstance.graphic.Circle({
      shape: {
        cx: point.x,
        cy: point.y,
        r: point.radius
      },
      style: readPointStyle(data, seriesModel, itemModel, point, pointIndex),
      z2: layerZ.symbol
    });
    applyCircleEnterAnimation(symbol, point.radius, animation);
    symbol.silent = silent;

    data.setItemLayout(point.dataIndex, [point.x + rect.x, point.y + rect.y]);
    data.setItemGraphicEl(point.dataIndex, symbol);
    group.add(symbol);

    if (silent) return;

    const hitCircle = new echartsInstance.graphic.Circle({
      shape: {
        cx: point.x,
        cy: point.y,
        r: Math.max(point.radius, 8)
      },
      style: {
        fill: 'rgba(0,0,0,0)',
        stroke: 'rgba(0,0,0,0)',
        opacity: 0
      },
      z2: layerZ.hit
    });
    data.setItemGraphicEl(point.dataIndex, hitCircle);
    group.add(hitCircle);

    const hoverItem = {
      elements: [symbol].filter(Boolean) as GraphicElement[],
      triggerElements: [hitCircle, symbol].filter(Boolean) as GraphicElement[]
    };
    hoverItems.push(hoverItem);
    hoverItemsByDataIndex.set(point.dataIndex, hoverItem);
  });

  drawPointLabels(echartsInstance, group, seriesModel, layout.points, hoverItemsByDataIndex);
  return hoverItems;
}

function drawPointLabels(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: BeeswarmSeriesModel,
  points: BeeswarmPoint[],
  hoverItemsByDataIndex: Map<number, ElementHoverItem>
): void {
  const seriesLabelModel = seriesModel.getModel('label');
  if (seriesLabelModel.get('show') !== true) return;

  points.forEach((point) => {
    const itemModel = seriesModel.getData().getItemModel(point.dataIndex);
    const itemLabelModel = itemModel.getModel('label');
    const show = itemLabelModel.get('show') ?? seriesLabelModel.get('show');
    if (show === false) return;

    const dy = point.y <= point.centerY ? -point.radius - 4 : point.radius + 4;
    const label = new echartsInstance.graphic.Text({
      style: {
        x: point.x,
        y: point.y + dy,
        text: String(formatLabel(itemLabelModel.get('formatter') || seriesLabelModel.get('formatter'), point)),
        fill: itemLabelModel.get('color') || seriesLabelModel.get('color') || '#111827',
        fontSize: finiteNumber(itemLabelModel.get('fontSize'), finiteNumber(seriesLabelModel.get('fontSize'), 12)),
        fontWeight: itemLabelModel.get('fontWeight') || seriesLabelModel.get('fontWeight') || 650,
        align: 'center',
        verticalAlign: dy < 0 ? 'bottom' : 'top'
      },
      silent: true,
      z2: layerZ.label
    });
    applyFadeEnterAnimation(label, readEnterAnimation(seriesModel, point.dataIndex));
    addHoverElement(hoverItemsByDataIndex.get(point.dataIndex), label);
    group.add(label);
  });
}

function readPointStyle(
  data: SeriesData,
  seriesModel: BeeswarmSeriesModel,
  itemModel: EChartsModel,
  point: BeeswarmPoint,
  pointIndex: number
): Record<string, unknown> {
  const itemStyleModel = itemModel.getModel('itemStyle');
  const seriesItemStyleModel = seriesModel.getModel('itemStyle');
  const visualStyle = asRecord(data.getItemVisual(point.dataIndex, 'style'));
  const fill = itemStyleModel.get('color')
    || visualStyle.fill
    || seriesItemStyleModel.get('color')
    || DEFAULT_COLORS[pointIndex % DEFAULT_COLORS.length];

  return {
    fill,
    stroke: itemStyleModel.get('borderColor') || seriesItemStyleModel.get('borderColor') || '#ffffff',
    lineWidth: finiteNumber(itemStyleModel.get('borderWidth'), finiteNumber(seriesItemStyleModel.get('borderWidth'), 1.4)),
    opacity: finiteNumber(itemStyleModel.get('opacity'), finiteNumber(seriesItemStyleModel.get('opacity'), 0.88)),
    shadowBlur: itemStyleModel.get('shadowBlur') || seriesItemStyleModel.get('shadowBlur'),
    shadowColor: itemStyleModel.get('shadowColor') || seriesItemStyleModel.get('shadowColor')
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

function formatLabel(formatter: unknown, point: BeeswarmPoint): unknown {
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
  return point.name;
}

function readEnterAnimation(
  seriesModel: BeeswarmSeriesModel,
  itemIndex: number,
  animationOption = seriesModel.get('enterAnimation')
): EnterAnimationConfig {
  if (seriesModel.get('animation') === false || animationOption === false) return disabledEnterAnimation();

  const option = animationOption == null || animationOption === true ? {} : asRecord(animationOption);
  if (option.show === false || option.enabled === false) return disabledEnterAnimation();

  const baseDelay = resolveAnimationNumber(option.delay ?? seriesModel.get('animationDelay'), itemIndex, itemIndex, 0);
  const stagger = resolveAnimationNumber(option.stagger, itemIndex, itemIndex, 24);
  return {
    enabled: true,
    duration: resolveAnimationNumber(option.duration ?? seriesModel.get('animationDuration'), itemIndex, itemIndex, 520),
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

function applyCircleEnterAnimation(element: GraphicElement, radius: number, animation: EnterAnimationConfig): void {
  if (!animation.enabled) return;
  const animatable = element as AnimatableGraphicElement;
  if (typeof animatable.animate !== 'function') return;

  const shape = animatable.shape || {};
  const style = animatable.style || {};
  const opacity = finiteNumber(style.opacity, 1);
  shape.r = 0;
  style.opacity = 0;
  animatable.shape = shape;
  animatable.style = style;
  animateGraphicProperty(animatable, 'shape', animation, { r: radius });
  animateGraphicProperty(animatable, 'style', animation, { opacity });
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
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function finiteNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}
