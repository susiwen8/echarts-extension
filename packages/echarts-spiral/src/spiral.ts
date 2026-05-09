import * as echarts from 'echarts/lib/echarts';
import { clearAliveRender, installElementHover, renderAlive } from '@echarts-extension/layout-core';
import type { AliveRenderState, ElementHoverController, ElementHoverItem, ElementHoverOptions } from '@echarts-extension/layout-core';

import { resolveSpiralLayout } from './layout.js';
import type { SpiralLayoutOption, SpiralLayoutResult, SpiralSegment } from './layout.js';

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

interface SpiralSeriesModel extends EChartsModel {
  option?: SpiralLayoutOption;
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
  List: new (dimensions: unknown, host: SpiralSeriesModel) => SeriesData;
  graphic: {
    Group: new () => GraphicGroup;
    Circle: new (options: GraphicElementOptions) => GraphicElement;
    Line: new (options: GraphicElementOptions) => GraphicElement;
    Text: new (options: GraphicElementOptions) => GraphicElement;
    makePath?: (path: string, options: GraphicElementOptions) => GraphicElement;
  };
}


interface SpiralChartView {
  group: GraphicGroup;
  __renderToken?: object | null;
  __hoverController?: ElementHoverController;
  __aliveRenderState?: AliveRenderState;
  __enterReplayKey?: unknown;
  __spiralEntering?: boolean;
  __spiralEnterTimer?: ReturnType<typeof setTimeout>;
  __spiralSilentElements?: SilentElementSnapshot[];
}

interface EnterAnimationConfig {
  enabled: boolean;
  duration: number;
  delay: number;
  easing: string;
}

interface EnterAnimationTracker {
  totalDuration: number;
}

interface SilentElementSnapshot {
  element: GraphicElement;
  hadSilent: boolean;
  silent: unknown;
}

type AnimationTargetKey = 'shape' | 'style';

const echartsHost = echarts as unknown as EChartsHost;
const optionKeys = [
  'padding',
  'center',
  'innerRadius',
  'outerRadius',
  'turns',
  'segmentsPerTurn',
  'startAngle',
  'clockwise',
  'sort',
  'gapAngle',
  'radialGap',
  'bandWidth',
  'min',
  'max',
  'nameField',
  'valueField',
  'dimensions'
] as const satisfies ReadonlyArray<Extract<keyof SpiralLayoutOption, string>>;

const layerZ = {
  segment: 6,
  label: 8
} as const;

echartsHost.extendSeriesModel({
  type: 'series.spiral',

  visualStyleAccessPath: 'itemStyle',
  visualDrawType: 'fill',

  getInitialData(this: SpiralSeriesModel, option: SpiralLayoutOption) {
    const source = Array.isArray(option.data) ? option.data : [];
    const dimensions = echartsHost.helper.createDimensions(source, {
      coordDimensions: ['value']
    });
    const list = new echartsHost.List(dimensions, this);
    list.initData(source);
    return list;
  },

  getTooltipPosition(this: SpiralSeriesModel, dataIndex: number) {
    const layout = this.getData().getItemLayout(dataIndex);
    return Array.isArray(layout) ? layout : undefined;
  },

  defaultOption: {
    left: 'center',
    top: 'center',
    width: '94%',
    height: '84%',
    padding: 28,
    center: null,
    innerRadius: null,
    outerRadius: null,
    turns: 4,
    segmentsPerTurn: null,
    startAngle: -90,
    clockwise: true,
    sort: false,
    gapAngle: 3,
    radialGap: 10,
    bandWidth: null,
    min: null,
    max: null,
    nameField: 'name',
    valueField: 'value',
    dimensions: null,
    minOpacity: 0.18,
    maxOpacity: 0.92,
    enterAnimation: true,
    itemStyle: {
      color: '#ef4444',
      borderColor: '#ffffff',
      borderWidth: 0,
      opacity: null
    },
    label: {
      show: false,
      position: 'outside',
      color: '#334155',
      fontSize: 12,
      fontWeight: 600,
      formatter: '{b}'
    },
    emphasis: {
      itemStyle: {
        opacity: 1,
        borderColor: '#111827',
        borderWidth: 2.2,
        shadowBlur: 12,
        shadowColor: 'rgba(37, 99, 235, 0.22)'
      }
    },
    tooltip: {
      trigger: 'item'
    }
  }
});

echartsHost.extendChartView({
  type: 'spiral',

  render(this: SpiralChartView, seriesModel: SpiralSeriesModel, ecModel: unknown, api: EChartsApi) {
    const group = this.group;
    const renderToken = {};
    this.__renderToken = renderToken;
    clearSpiralEnterGate(this);
    this.__hoverController?.dispose();
    this.__hoverController = undefined;

    try {
      const rect = echartsHost.helper.getLayoutRect(seriesModel.getBoxLayoutParams(), {
        width: api.getWidth(),
        height: api.getHeight()
      });
      const layout = resolveSpiralLayout(readLayoutOption(seriesModel, rect));
      if (this.__renderToken !== renderToken) return;
      resetAliveRenderForReplay(this, seriesModel, group);
      const enterTracker: EnterAnimationTracker = {
        totalDuration: 0
      };
      const { hoverItems } = renderAlive(this, echartsHost, group, seriesModel, (targetGroup, targetSeriesModel) => (
        drawSpiral(echartsHost, targetGroup, targetSeriesModel, layout, rect, enterTracker)
      ));
      this.__hoverController = installElementHover(hoverItems, {
        dimOpacity: 0.2,
        enabled: () => this.__spiralEntering !== true,
        zrender: api.getZr?.()
      });
      startSpiralEnterGate(this, renderToken, enterTracker.totalDuration, hoverItems);
    } catch (error) {
      if (typeof console !== 'undefined') {
        console.error('[spiral] render failed', error);
      }
    }
  },

  remove(this: SpiralChartView) {
    this.__renderToken = null;
    clearSpiralEnterGate(this);
    this.__hoverController?.dispose();
    this.__hoverController = undefined;
    clearAliveRender(this);
    this.group.removeAll();
  },

  dispose(this: SpiralChartView) {
    this.__renderToken = null;
    clearSpiralEnterGate(this);
    this.__hoverController?.dispose();
    this.__hoverController = undefined;
    clearAliveRender(this);
    this.group.removeAll();
  }
});

function resetAliveRenderForReplay(
  view: SpiralChartView,
  seriesModel: SpiralSeriesModel,
  group: GraphicGroup
): void {
  const replayKey = seriesModel.get(['enterAnimation', 'replayKey']);
  if (replayKey == null || replayKey === view.__enterReplayKey) return;

  view.__enterReplayKey = replayKey;
  clearAliveRender(view);
  group.removeAll();
}

function readLayoutOption(seriesModel: SpiralSeriesModel, rect: ViewRect): SpiralLayoutOption {
  const option = seriesModel.option || {};
  const layoutOption: SpiralLayoutOption = {
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

function drawSpiral(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: SpiralSeriesModel,
  layout: SpiralLayoutResult,
  rect: ViewRect,
  enterTracker: EnterAnimationTracker
): ElementHoverItem[] {
  const data = seriesModel.getData();
  const chartGroup = new echartsInstance.graphic.Group();
  const hoverItems: ElementHoverItem[] = [];
  chartGroup.x = rect.x;
  chartGroup.y = rect.y;

  layout.segments.forEach((segment, itemIndex) => {
    if (segment.dataIndex < 0 || segment.dataIndex >= data.count()) return;

    const itemModel = data.getItemModel(segment.dataIndex);
    const itemGroup = new echartsInstance.graphic.Group();
    const segmentElement = createSegmentElement(
      echartsInstance,
      segment,
      readSegmentStyle(data, seriesModel, itemModel, segment, itemIndex)
    );
    const enterAnimation = resolveEnterAnimation(seriesModel, segment.animationOrder);
    const hoverItem: ElementHoverItem = {
      elements: [segmentElement]
    };

    applyFadeEnterAnimation(segmentElement, enterAnimation, enterTracker);
    enableHover(segmentElement, itemModel);
    itemGroup.add(segmentElement);

    const label = createLabelElement(echartsInstance, seriesModel, itemModel, segment);
    if (label) {
      applyFadeEnterAnimation(label, enterAnimation, enterTracker);
      itemGroup.add(label);
      hoverItem.elements.push(label);
    }

    data.setItemLayout(segment.dataIndex, [segment.x, segment.y]);
    data.setItemGraphicEl(segment.dataIndex, itemGroup);
    chartGroup.add(itemGroup);
    hoverItems.push(hoverItem);
  });

  group.add(chartGroup);
  return hoverItems;
}

function createSegmentElement(
  echartsInstance: EChartsHost,
  segment: SpiralSegment,
  style: Record<string, unknown>
): GraphicElement {
  if (echartsInstance.graphic.makePath) {
    const element = echartsInstance.graphic.makePath(segment.path, {
      style,
      silent: false,
      z2: layerZ.segment
    });
    element.silent = false;
    return element;
  }

  return new echartsInstance.graphic.Circle({
    shape: {
      cx: segment.x,
      cy: segment.y,
      r: Math.max(1, (segment.outerRadius - segment.innerRadius) / 2)
    },
    style,
    silent: false,
    z2: layerZ.segment
  });
}

function createLabelElement(
  echartsInstance: EChartsHost,
  seriesModel: SpiralSeriesModel,
  itemModel: EChartsModel,
  segment: SpiralSegment
): GraphicElement | null {
  const seriesLabelModel = seriesModel.getModel('label');
  const itemLabelModel = itemModel.getModel('label');
  const show = itemLabelModel.get('show') ?? seriesLabelModel.get('show');
  if (show !== true) return null;

  const position = itemLabelModel.get('position') || seriesLabelModel.get('position');
  const inside = position === 'inside';
  const text = formatLabel(itemLabelModel.get('formatter') || seriesLabelModel.get('formatter'), segment);

  return new echartsInstance.graphic.Text({
    style: {
      x: inside ? segment.x : segment.labelX,
      y: inside ? segment.y : segment.labelY,
      text: String(text),
      fill: itemLabelModel.get('color') || seriesLabelModel.get('color') || '#334155',
      fontSize: finiteNumber(itemLabelModel.get('fontSize'), finiteNumber(seriesLabelModel.get('fontSize'), 12)),
      fontWeight: itemLabelModel.get('fontWeight') || seriesLabelModel.get('fontWeight') || 600,
      align: inside ? 'center' : segment.labelAlign,
      verticalAlign: inside ? 'middle' : segment.labelVerticalAlign
    },
    silent: true,
    z2: layerZ.label
  });
}

function readSegmentStyle(
  data: SeriesData,
  seriesModel: SpiralSeriesModel,
  itemModel: EChartsModel,
  segment: SpiralSegment,
  itemIndex: number
): Record<string, unknown> {
  const itemStyleModel = itemModel.getModel('itemStyle');
  const seriesItemStyleModel = seriesModel.getModel('itemStyle');
  const visualStyle = asRecord(data.getItemVisual(segment.dataIndex, 'style'));
  const fill = itemStyleModel.get('color')
    || visualStyle.fill
    || seriesItemStyleModel.get('color')
    || DEFAULT_COLORS[itemIndex % DEFAULT_COLORS.length];
  const opacity = itemStyleModel.get('opacity') ?? seriesItemStyleModel.get('opacity');

  return {
    fill,
    stroke: itemStyleModel.get('borderColor') || seriesItemStyleModel.get('borderColor') || '#ffffff',
    lineWidth: finiteNumber(itemStyleModel.get('borderWidth'), finiteNumber(seriesItemStyleModel.get('borderWidth'), 0)),
    opacity: finiteNumber(opacity, scaledOpacity(seriesModel, segment.valueRatio)),
    shadowBlur: itemStyleModel.get('shadowBlur') || seriesItemStyleModel.get('shadowBlur'),
    shadowColor: itemStyleModel.get('shadowColor') || seriesItemStyleModel.get('shadowColor')
  };
}

function scaledOpacity(seriesModel: SpiralSeriesModel, valueRatio: number): number {
  const minOpacity = clamp(finiteNumber(seriesModel.get('minOpacity'), 0.18), 0, 1);
  const maxOpacity = clamp(finiteNumber(seriesModel.get('maxOpacity'), 0.92), minOpacity, 1);
  return minOpacity + valueRatio * (maxOpacity - minOpacity);
}

function formatLabel(formatter: unknown, point: SpiralSegment): unknown {
  const params = {
    data: point.raw,
    name: point.name,
    value: point.value,
    dataIndex: point.dataIndex
  };

  if (typeof formatter === 'function') {
    return (formatter as (input: typeof params) => unknown)(params);
  }
  if (typeof formatter === 'string') {
    return formatter
      .replace(/\{b\}/g, point.name)
      .replace(/\{c\}/g, String(point.value))
      .replace(/\{value\}/g, String(point.value))
      .replace(/\{name\}/g, point.name);
  }
  return point.name;
}

function resolveEnterAnimation(seriesModel: SpiralSeriesModel, index: number): EnterAnimationConfig {
  if (seriesModel.get('animation') === false) return disabledAnimation();

  const raw = seriesModel.get('enterAnimation');
  if (raw === false) return disabledAnimation();

  const config = raw == null || raw === true ? {} : asRecord(raw);
  if (config.show === false || config.enabled === false) return disabledAnimation();

  const duration = finiteNumber(config.duration ?? seriesModel.get('animationDuration'), 560);
  const delay = resolveAnimationValue(config.delay ?? seriesModel.get('animationDelay'), index, 0)
    + index * finiteNumber(config.stagger, 22);
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

function applyFadeEnterAnimation(
  element: GraphicElement,
  animation: EnterAnimationConfig,
  enterTracker: EnterAnimationTracker
): void {
  if (!animation.enabled) return;

  const animatable = element as AnimatableGraphicElement;
  if (typeof animatable.animate !== 'function') return;

  const style = animatable.style || {};
  const opacity = finiteNumber(style.opacity, 1);
  trackEnterAnimation(enterTracker, animation);
  style.opacity = 0;
  animatable.style = style;
  animateGraphicProperty(animatable, 'style', animation, { opacity });
}

function animateGraphicProperty(
  element: AnimatableGraphicElement,
  key: AnimationTargetKey,
  animation: EnterAnimationConfig,
  target: Record<string, unknown>
): void {
  const animator = element.animate?.(key);
  if (!animator) return;

  const frame = animator.when(animation.duration, target);
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

function trackEnterAnimation(tracker: EnterAnimationTracker, animation: EnterAnimationConfig): void {
  tracker.totalDuration = Math.max(
    tracker.totalDuration,
    Math.max(0, animation.delay) + Math.max(0, animation.duration)
  );
}

function startSpiralEnterGate(
  view: SpiralChartView,
  renderToken: object,
  totalDuration: number,
  hoverItems: ElementHoverItem[]
): void {
  clearSpiralEnterGate(view);
  if (totalDuration <= 0) return;

  view.__spiralEntering = true;
  view.__spiralSilentElements = silenceSpiralHoverElements(hoverItems);
  view.__spiralEnterTimer = setTimeout(() => {
    if (view.__renderToken === renderToken) {
      restoreSpiralHoverElements(view.__spiralSilentElements);
      view.__spiralSilentElements = undefined;
      view.__spiralEntering = false;
    }
    view.__spiralEnterTimer = undefined;
  }, totalDuration);
}

function clearSpiralEnterGate(view: SpiralChartView): void {
  if (view.__spiralEnterTimer) {
    clearTimeout(view.__spiralEnterTimer);
    view.__spiralEnterTimer = undefined;
  }
  restoreSpiralHoverElements(view.__spiralSilentElements);
  view.__spiralSilentElements = undefined;
  view.__spiralEntering = false;
}

function silenceSpiralHoverElements(hoverItems: ElementHoverItem[]): SilentElementSnapshot[] {
  const snapshots: SilentElementSnapshot[] = [];
  const seen = new Set<GraphicElement>();

  hoverItems.forEach((item) => {
    [...item.elements, ...(item.triggerElements || [])].forEach((element) => {
      const target = element as GraphicElement | null | undefined;
      if (!target || seen.has(target)) return;
      seen.add(target);
      snapshots.push({
        element: target,
        hadSilent: Object.prototype.hasOwnProperty.call(target, 'silent'),
        silent: target.silent
      });
      target.silent = true;
    });
  });

  return snapshots;
}

function restoreSpiralHoverElements(snapshots: SilentElementSnapshot[] | undefined): void {
  snapshots?.forEach(({ element, hadSilent, silent }) => {
    if (hadSilent) {
      element.silent = silent;
    } else {
      delete element.silent;
    }
  });
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

const DEFAULT_COLORS = [
  '#ef4444',
  '#f87171',
  '#fca5a5',
  '#fb7185',
  '#dc2626'
];
