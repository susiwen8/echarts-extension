import * as echarts from 'echarts/lib/echarts';
import { clearAliveRender, installElementHover, renderAlive } from '@echarts-extension/layout-core';
import type { AliveRenderState, ElementHoverController, ElementHoverItem, ElementHoverOptions } from '@echarts-extension/layout-core';

import { resolveVectorFieldLayout } from './layout.js';
import type { VectorFieldLayoutItem, VectorFieldLayoutOption, VectorFieldLayoutResult } from './layout.js';

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
  setItemLayout(dataIndex: number, layout: [number, number]): void;
  setItemGraphicEl(dataIndex: number, element: GraphicElement): void;
}

interface VectorFieldSeriesModel extends EChartsModel {
  option?: VectorFieldLayoutOption;
  getBoxLayoutParams(): unknown;
  getData(): SeriesData;
}

interface GraphicElement {
  [key: string]: unknown;
}

interface AnimatableGraphicElement extends GraphicElement {
  style?: Record<string, unknown>;
  animate?: (key: 'style', loop?: boolean) => GraphicAnimator | null | undefined;
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
  z2?: number;
}

interface EChartsHost {
  extendSeriesModel(option: Record<string, unknown>): void;
  extendChartView(option: Record<string, unknown>): void;
  helper: {
    createDimensions(source: unknown[], options: Record<string, unknown>): unknown;
    enableHoverEmphasis?: (element: GraphicElement, focus: unknown, blurScope: unknown) => void;
    getLayoutRect(params: unknown, container: { width: number; height: number }): ViewRect;
  };
  List: new (dimensions: unknown, host: VectorFieldSeriesModel) => SeriesData;
  graphic: {
    Group: new () => GraphicGroup;
    Line: new (options: GraphicElementOptions) => GraphicElement;
    makePath?: (path: string, options: GraphicElementOptions) => GraphicElement;
  };
}


interface VectorFieldChartView {
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

const echartsHost = echarts as unknown as EChartsHost;
const optionKeys = [
  'padding',
  'xExtent',
  'yExtent',
  'xField',
  'yField',
  'uField',
  'vField',
  'invertY',
  'samplingStep',
  'minLength',
  'maxLength',
  'lengthScale',
  'arrowHeadLength',
  'arrowHeadAngle'
] as const satisfies ReadonlyArray<Extract<keyof VectorFieldLayoutOption, string>>;

echartsHost.extendSeriesModel({
  type: 'series.vectorField',

  visualStyleAccessPath: 'lineStyle',
  visualDrawType: 'stroke',

  getInitialData(this: VectorFieldSeriesModel, option: VectorFieldLayoutOption) {
    const source = Array.isArray(option.data) ? option.data : [];
    const dimensions = echartsHost.helper.createDimensions(source, {
      coordDimensions: ['x', 'y', 'u', 'v', 'value']
    });
    const list = new echartsHost.List(dimensions, this);
    list.initData(source);
    return list;
  },

  defaultOption: {
    left: 'center',
    top: 'center',
    width: '94%',
    height: '82%',
    padding: 18,
    xField: 'longitude',
    yField: 'latitude',
    uField: 'u',
    vField: 'v',
    invertY: true,
    samplingStep: 1,
    minLength: 0,
    maxLength: null,
    lengthScale: null,
    arrowHeadLength: null,
    arrowHeadAngle: null,
    enterAnimation: true,
    lineStyle: {
      color: '#2563eb',
      width: 1.15,
      opacity: 0.86
    },
    emphasis: {
      itemStyle: {
        opacity: 1,
        width: 1.8,
        shadowBlur: 6,
        shadowColor: 'rgba(37, 99, 235, 0.28)'
      }
    },
    tooltip: {
      trigger: 'item'
    }
  }
});

echartsHost.extendChartView({
  type: 'vectorField',

  render(this: VectorFieldChartView, seriesModel: VectorFieldSeriesModel, ecModel: unknown, api: EChartsApi) {
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
      const layout = resolveVectorFieldLayout(readLayoutOption(seriesModel, rect));
      if (this.__renderToken !== renderToken) return;
      const { hoverItems } = renderAlive(this, echartsHost, group, seriesModel, (targetGroup, targetSeriesModel) => (
        drawVectorField(echartsHost, targetGroup, targetSeriesModel, layout, rect)
      ));
      this.__hoverController = installElementHover(hoverItems, {
        dimOpacity: 0.2,
        zrender: api.getZr?.()
      });
    } catch (error) {
      if (typeof console !== 'undefined') {
        console.error('[vectorField] render failed', error);
      }
    }
  },

  remove(this: VectorFieldChartView) {
    this.__renderToken = null;
    this.__hoverController?.dispose();
    this.__hoverController = undefined;
    clearAliveRender(this);
    this.group.removeAll();
  },

  dispose(this: VectorFieldChartView) {
    this.__renderToken = null;
    this.__hoverController?.dispose();
    this.__hoverController = undefined;
    clearAliveRender(this);
    this.group.removeAll();
  }
});

function readLayoutOption(seriesModel: VectorFieldSeriesModel, rect: ViewRect): VectorFieldLayoutOption {
  const option = seriesModel.option || {};
  const layoutOption: VectorFieldLayoutOption = {
    data: Array.isArray(option.data) ? option.data : [],
    width: rect.width,
    height: rect.height
  };

  optionKeys.forEach((key) => {
    const value = seriesModel.get(key);
    if (value !== undefined && value !== null) layoutOption[key] = value as never;
  });

  return layoutOption;
}

function drawVectorField(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: VectorFieldSeriesModel,
  layout: VectorFieldLayoutResult,
  rect: ViewRect
): ElementHoverItem[] {
  const data = seriesModel.getData();
  const chartGroup = new echartsInstance.graphic.Group();
  const hoverItems: ElementHoverItem[] = [];
  chartGroup.x = rect.x;
  chartGroup.y = rect.y;

  layout.items.forEach((item, itemIndex) => {
    if (item.dataIndex < 0 || item.dataIndex >= data.count()) return;

    const itemModel = data.getItemModel(item.dataIndex);
    const element = createArrowElement(
      echartsInstance,
      item,
      resolveArrowStyle(data, seriesModel, itemModel, item.dataIndex, itemIndex)
    );
    animateEnter(element, itemIndex, resolveEnterAnimation(seriesModel, itemIndex));
    data.setItemLayout(item.dataIndex, [item.x, item.y]);
    data.setItemGraphicEl(item.dataIndex, element);
    enableHover(element, itemModel);
    chartGroup.add(element);
    hoverItems.push({
      elements: [element]
    });
  });

  group.add(chartGroup);
  return hoverItems;
}

function createArrowElement(
  echartsInstance: EChartsHost,
  item: VectorFieldLayoutItem,
  style: Record<string, unknown>
): GraphicElement {
  const path = [
    `M ${formatPathNumber(item.startX)} ${formatPathNumber(item.startY)}`,
    `L ${formatPathNumber(item.endX)} ${formatPathNumber(item.endY)}`,
    `M ${formatPathNumber(item.headLeftX)} ${formatPathNumber(item.headLeftY)}`,
    `L ${formatPathNumber(item.endX)} ${formatPathNumber(item.endY)}`,
    `L ${formatPathNumber(item.headRightX)} ${formatPathNumber(item.headRightY)}`
  ].join(' ');

  if (echartsInstance.graphic.makePath) {
    const element = echartsInstance.graphic.makePath(path, {
      style,
      silent: false
    });
    element.silent = false;
    return element;
  }

  return new echartsInstance.graphic.Line({
    shape: {
      x1: item.startX,
      y1: item.startY,
      x2: item.endX,
      y2: item.endY
    },
    style,
    silent: false
  });
}

function resolveArrowStyle(
  data: SeriesData,
  seriesModel: VectorFieldSeriesModel,
  itemModel: EChartsModel,
  dataIndex: number,
  itemIndex: number
): Record<string, unknown> {
  const normal = asRecord(seriesModel.get('lineStyle'));
  const itemLineStyle = asRecord(itemModel.get('lineStyle'));
  const itemStyle = asRecord(itemModel.get('itemStyle'));
  const visualStyle = asRecord(data.getItemVisual(dataIndex, 'style'));
  const color = itemLineStyle.color
    || itemStyle.color
    || normal.color
    || visualStyle.stroke
    || visualStyle.fill
    || DEFAULT_COLORS[itemIndex % DEFAULT_COLORS.length];

  return {
    stroke: color,
    fill: null,
    lineWidth: finiteNumber(itemLineStyle.width ?? itemStyle.width ?? normal.width, 1.15),
    opacity: finiteNumber(itemLineStyle.opacity ?? itemStyle.opacity ?? normal.opacity, 0.86),
    lineCap: 'round',
    lineJoin: 'round',
    shadowBlur: itemLineStyle.shadowBlur ?? itemStyle.shadowBlur ?? normal.shadowBlur,
    shadowColor: itemLineStyle.shadowColor ?? itemStyle.shadowColor ?? normal.shadowColor
  };
}

function resolveEnterAnimation(seriesModel: VectorFieldSeriesModel, index: number): EnterAnimationConfig {
  if (seriesModel.get('animation') === false) return disabledAnimation();

  const raw = seriesModel.get('enterAnimation');
  if (raw === false) return disabledAnimation();

  const config = raw == null || raw === true ? {} : asRecord(raw);
  if (config.show === false || config.enabled === false) return disabledAnimation();

  const duration = finiteNumber(config.duration ?? seriesModel.get('animationDuration'), 520);
  const delay = resolveAnimationValue(config.delay ?? seriesModel.get('animationDelay'), index, 0)
    + index * finiteNumber(config.stagger, 0);
  const easing = typeof (config.easing ?? seriesModel.get('animationEasing')) === 'string'
    ? String(config.easing ?? seriesModel.get('animationEasing'))
    : 'cubicOut';

  return {
    enabled: true,
    duration,
    delay,
    easing
  };
}

function animateEnter(element: GraphicElement, itemIndex: number, animation: EnterAnimationConfig): void {
  if (!animation.enabled) return;

  const animatable = element as AnimatableGraphicElement;
  if (typeof animatable.animate !== 'function') return;

  const style = animatable.style || {};
  const opacity = finiteNumber(style.opacity, 1);
  style.opacity = 0;
  animatable.style = style;

  const animator = animatable.animate('style');
  if (!animator) {
    style.opacity = opacity;
    return;
  }

  const frame = animator.when(animation.duration, { opacity });
  if (animation.delay > 0) frame.delay?.(animation.delay);
  frame.start(animation.easing);
}

function enableHover(element: GraphicElement, itemModel: EChartsModel): void {
  echartsHost.helper.enableHoverEmphasis?.(
    element,
    itemModel.get(['emphasis', 'focus']),
    itemModel.get(['emphasis', 'blurScope'])
  );
}

function resolveAnimationValue(value: unknown, index: number, fallback: number): number {
  if (typeof value === 'function') {
    return finiteNumber((value as (dataIndex: number) => unknown)(index), fallback);
  }
  return finiteNumber(value, fallback);
}

function disabledAnimation(): EnterAnimationConfig {
  return {
    enabled: false,
    duration: 0,
    delay: 0,
    easing: 'cubicOut'
  };
}

function formatPathNumber(value: number): string {
  return Number(value.toFixed(3)).toString();
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

const DEFAULT_COLORS = [
  '#2563eb',
  '#0f9f88',
  '#d97706',
  '#7c3aed',
  '#dc2626',
  '#0891b2'
];
