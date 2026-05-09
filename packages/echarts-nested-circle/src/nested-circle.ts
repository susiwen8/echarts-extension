import * as echarts from 'echarts/lib/echarts';
import { clearAliveRender, installElementHover, renderAlive, setAliveRenderKey } from '@echarts-extension/layout-core';
import type { AliveRenderState, ElementHoverController, ElementHoverItem, ElementHoverOptions } from '@echarts-extension/layout-core';

import { DEFAULT_RING_COLORS, resolveNestedCircleLayout } from './layout.js';
import type { NestedCircleLabel, NestedCircleLayoutOption, NestedCircleLayoutResult, NestedCircleRing } from './layout.js';

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
  getName(index: number): string;
  indexOfName(name: string): number;
  getItemModel(index: number): EChartsModel;
  getItemVisual(dataIndex: number, key: string): unknown;
  setItemLayout(dataIndex: number, layout: [number, number]): void;
  setItemGraphicEl(dataIndex: number, element: GraphicElement): void;
}

interface NestedCircleSeriesModel extends EChartsModel {
  option?: NestedCircleLayoutOption;
  legendVisualProvider?: unknown;
  getBoxLayoutParams(): unknown;
  getData(): SeriesData;
  getRawData(): SeriesData;
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
    getLayoutRect(params: unknown, container: { width: number; height: number }): ViewRect;
  };
  List: new (dimensions: unknown, host: NestedCircleSeriesModel) => SeriesData;
  graphic: {
    Group: new () => GraphicGroup;
    Circle: new (options: GraphicElementOptions) => GraphicElement;
    Text: new (options: GraphicElementOptions) => GraphicElement;
  };
}


interface NestedCircleChartView {
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
const layerZ = {
  ring: 0,
  title: 200,
  label: 300
} as const;
const optionKeys = [
  'padding',
  'center',
  'radius',
  'centerRadiusRatio',
  'labelRadiusRatio',
  'titleRadiusRatio',
  'minRingThickness',
  'colors'
] as const satisfies ReadonlyArray<Extract<keyof NestedCircleLayoutOption, string>>;

echartsHost.extendSeriesModel({
  type: 'series.nestedCircle',

  visualStyleAccessPath: 'itemStyle',
  visualDrawType: 'fill',

  getInitialData(this: NestedCircleSeriesModel, option: NestedCircleLayoutOption) {
    const source = Array.isArray(option.data) ? option.data : [];
    const dimensions = echartsHost.helper.createDimensions(source, {
      coordDimensions: ['value']
    });
    const list = new echartsHost.List(dimensions, this);
    list.initData(source);
    this.legendVisualProvider = createLegendVisualProvider(this);
    return list;
  },

  defaultOption: {
    left: 'center',
    top: 'center',
    width: '86%',
    height: '86%',
    padding: 12,
    center: null,
    radius: null,
    centerRadiusRatio: 0.28,
    labelRadiusRatio: null,
    titleRadiusRatio: null,
    minRingThickness: 22,
    colors: DEFAULT_RING_COLORS,
    enterAnimation: true,
    ringStyle: {
      opacity: 1,
      borderColor: 'rgba(30, 58, 138, 0.34)',
      borderWidth: 1
    },
    itemStyle: {
      opacity: 1,
      borderColor: 'rgba(30, 58, 138, 0.34)',
      borderWidth: 1
    },
    titleLabel: {
      show: true,
      color: '#0f172a',
      fontSize: 18,
      fontWeight: 700,
      lineHeight: 22,
      formatter: null
    },
    label: {
      show: true,
      color: '#111827',
      fontSize: 10,
      fontWeight: 500,
      lineHeight: 12,
      formatter: null
    },
    emphasis: {
      itemStyle: {
        shadowBlur: 12,
        shadowColor: 'rgba(30, 58, 138, 0.2)'
      }
    }
  }
});

echartsHost.extendChartView({
  type: 'nestedCircle',

  render(this: NestedCircleChartView, seriesModel: NestedCircleSeriesModel, ecModel: unknown, api: EChartsApi) {
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
      const layout = resolveNestedCircleLayout(readLayoutOption(seriesModel, rect));
      if (this.__renderToken !== renderToken) return;
      const { hoverItems } = renderAlive(this, echartsHost, group, seriesModel, (targetGroup, targetSeriesModel, isUpdate) => (
        drawNestedCircle(echartsHost, targetGroup, targetSeriesModel, layout, rect, isUpdate)
      ));
      this.__hoverController = installElementHover(hoverItems, {
        zrender: api.getZr?.()
      });
    } catch (error) {
      if (typeof console !== 'undefined') {
        console.error('[nestedCircle] render failed', error);
      }
    }
  },

  remove(this: NestedCircleChartView) {
    this.__renderToken = null;
    this.__hoverController?.dispose();
    this.__hoverController = undefined;
    clearAliveRender(this);
    this.group.removeAll();
  },

  dispose(this: NestedCircleChartView) {
    this.__renderToken = null;
    this.__hoverController?.dispose();
    this.__hoverController = undefined;
    clearAliveRender(this);
    this.group.removeAll();
  }
});

function readLayoutOption(seriesModel: NestedCircleSeriesModel, rect: ViewRect): NestedCircleLayoutOption {
  const option = seriesModel.option || {};
  const layoutOption: NestedCircleLayoutOption = {
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

function drawNestedCircle(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: NestedCircleSeriesModel,
  layout: NestedCircleLayoutResult,
  rect: ViewRect,
  isUpdate: boolean
): ElementHoverItem[] {
  const data = seriesModel.getData();
  const chartGroup = new echartsInstance.graphic.Group();
  const hoverItems: ElementHoverItem[] = [];
  const hoverItemsByDataIndex = new Map<number, ElementHoverItem>();
  chartGroup.x = rect.x;
  chartGroup.y = rect.y;

  for (let index = layout.rings.length - 1; index >= 0; index--) {
    const ring = layout.rings[index];
    const itemModel = getRingItemModel(data, ring);
    const z2 = ringZ2(index);
    const circleEl = new echartsInstance.graphic.Circle({
      shape: {
        cx: ring.x,
        cy: ring.y,
        r: ring.outerRadius
      },
      style: readRingStyle(data, seriesModel, itemModel, ring, index),
      z2
    });
    applyCircleEnterAnimation(circleEl, ring.outerRadius, isUpdate ? disabledEnterAnimation() : readEnterAnimation(seriesModel, index));

    if (ring.dataIndex >= 0 && ring.dataIndex < data.count()) {
      data.setItemLayout(ring.dataIndex, [ring.x, ring.y]);
      data.setItemGraphicEl(ring.dataIndex, circleEl);
      const hoverItem = createHoverItem(circleEl);
      hoverItems.push(hoverItem);
      hoverItemsByDataIndex.set(ring.dataIndex, hoverItem);
    }

    setAliveRenderKey(circleEl, `nested-circle-ring:${ring.id}`);
    chartGroup.add(circleEl);
  }

  drawRingTitles(echartsInstance, chartGroup, seriesModel, data, layout.rings, hoverItemsByDataIndex, isUpdate);
  drawLabels(echartsInstance, chartGroup, seriesModel, layout.labels, hoverItemsByDataIndex, isUpdate);

  group.add(chartGroup);
  return hoverItems;
}

function drawRingTitles(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: NestedCircleSeriesModel,
  data: SeriesData,
  rings: NestedCircleRing[],
  hoverItemsByDataIndex: Map<number, ElementHoverItem>,
  isUpdate: boolean
): void {
  rings.forEach((ring, ringIndex) => {
    const itemModel = getRingItemModel(data, ring);
    const seriesLabelModel = seriesModel.getModel('titleLabel');
    const itemLabelModel = itemModel?.getModel('titleLabel');
    const show = itemLabelModel?.get('show') ?? seriesLabelModel.get('show');
    if (!show) return;

    const text = formatLabel(itemLabelModel?.get('formatter') || seriesLabelModel.get('formatter'), {
      name: ring.name,
      value: ring.value,
      data: ring
    });
    const thickness = Math.max(ring.outerRadius - ring.innerRadius, 1);
    const requestedFontSize = finiteNumber(itemLabelModel?.get('fontSize') ?? seriesLabelModel.get('fontSize'), 18);
    const fontSize = Math.min(requestedFontSize, Math.max(12, thickness * 0.42));
    const maxChars = Math.max(8, Math.floor(ring.titleMaxWidth / Math.max(fontSize * 0.56, 1)));

    const titleEl = new echartsInstance.graphic.Text({
      style: {
        x: ring.titleX,
        y: ring.titleY,
        text: wrapText(String(text), maxChars),
        fill: itemLabelModel?.get('color') || seriesLabelModel.get('color') || '#0f172a',
        fontSize,
        fontWeight: itemLabelModel?.get('fontWeight') || seriesLabelModel.get('fontWeight') || 700,
        lineHeight: Math.min(
          finiteNumber(itemLabelModel?.get('lineHeight') ?? seriesLabelModel.get('lineHeight'), fontSize + 4),
          fontSize + 4
        ),
        align: 'center',
        verticalAlign: 'middle'
      },
      silent: true,
      z2: layerZ.title + ringZ2(ringIndex)
    });
    applyFadeEnterAnimation(titleEl, isUpdate ? disabledEnterAnimation() : readEnterAnimation(seriesModel, ring.dataIndex));
    setAliveRenderKey(titleEl, `nested-circle-title:${ring.id}`);
    addHoverElement(hoverItemsByDataIndex.get(ring.dataIndex), titleEl);
    group.add(titleEl);
  });
}

function drawLabels(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: NestedCircleSeriesModel,
  labels: NestedCircleLabel[],
  hoverItemsByDataIndex: Map<number, ElementHoverItem>,
  isUpdate: boolean
): void {
  const seriesLabelModel = seriesModel.getModel('label');
  if (!seriesLabelModel.get('show')) return;

  labels.forEach((label) => {
    const raw = asRecord(label.raw);
    const rawLabel = asRecord(raw.label);
    const formatter = rawLabel.formatter || seriesLabelModel.get('formatter');
    const requestedFontSize = finiteNumber(rawLabel.fontSize ?? seriesLabelModel.get('fontSize'), 10);
    const fontSize = Math.min(requestedFontSize, 10);
    const maxChars = Math.max(7, Math.min(18, Math.floor(label.maxWidth / Math.max(fontSize * 0.52, 1))));
    const text = formatLabel(formatter, {
      name: label.name,
      value: label.value,
      data: label
    });

    const labelEl = new echartsInstance.graphic.Text({
      style: {
        x: label.x,
        y: label.y,
        text: wrapText(String(text), maxChars),
        fill: rawLabel.color || seriesLabelModel.get('color') || '#111827',
        fontSize,
        fontWeight: rawLabel.fontWeight || seriesLabelModel.get('fontWeight') || 500,
        lineHeight: Math.min(finiteNumber(rawLabel.lineHeight ?? seriesLabelModel.get('lineHeight'), fontSize + 2), fontSize + 2),
        align: 'center',
        verticalAlign: 'middle'
      },
      silent: true,
      z2: layerZ.label + ringZ2(label.ringIndex)
    });
    applyFadeEnterAnimation(labelEl, isUpdate ? disabledEnterAnimation() : readEnterAnimation(seriesModel, label.dataIndex));
    setAliveRenderKey(labelEl, `nested-circle-label:${label.id}`);
    addHoverElement(hoverItemsByDataIndex.get(label.dataIndex), labelEl);
    group.add(labelEl);
  });
}

function ringZ2(ringIndex: number): number {
  return layerZ.ring - ringIndex;
}

function getRingItemModel(data: SeriesData, ring: NestedCircleRing): EChartsModel | null {
  return ring.dataIndex >= 0 && ring.dataIndex < data.count() ? data.getItemModel(ring.dataIndex) : null;
}

function readRingStyle(
  data: SeriesData,
  seriesModel: NestedCircleSeriesModel,
  itemModel: EChartsModel | null,
  ring: NestedCircleRing,
  index: number
): Record<string, unknown> {
  const ringStyle = asRecord(seriesModel.get('ringStyle'));
  const seriesItemStyle = asRecord(seriesModel.get('itemStyle'));
  const itemStyle = itemModel ? asRecord(itemModel.get('itemStyle')) : {};
  const visualStyle = ring.dataIndex >= 0 && ring.dataIndex < data.count()
    ? asRecord(data.getItemVisual(ring.dataIndex, 'style'))
    : {};
  const colors = Array.isArray(seriesModel.get('colors'))
    ? (seriesModel.get('colors') as unknown[]).filter((color): color is string => typeof color === 'string')
    : DEFAULT_RING_COLORS;

  return {
    fill: itemStyle.color || visualStyle.fill || ring.color || colors[index % colors.length],
    stroke: itemStyle.borderColor || ringStyle.borderColor || seriesItemStyle.borderColor || 'rgba(30, 58, 138, 0.34)',
    lineWidth: finiteNumber(itemStyle.borderWidth ?? ringStyle.borderWidth ?? seriesItemStyle.borderWidth, 1),
    opacity: finiteNumber(itemStyle.opacity ?? ringStyle.opacity ?? seriesItemStyle.opacity, 1)
  };
}

function formatLabel(formatter: unknown, params: { name: string; value: unknown; data: unknown }): unknown {
  if (typeof formatter === 'function') {
    return (formatter as (input: { data: unknown; name: string; value: unknown }) => unknown)(params);
  }
  if (typeof formatter === 'string') {
    return formatter.replace(/\{b\}/g, params.name).replace(/\{c\}/g, String(params.value ?? ''));
  }
  return params.name;
}

function wrapText(value: string, maxChars: number): string {
  if (value.length <= maxChars) return value;
  const words = value.split(/\s+/).filter(Boolean);
  if (words.length <= 1) return wrapLongWord(value, maxChars).join('\n');

  const lines: string[] = [];
  let current = '';
  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) {
      current = next;
      return;
    }
    if (current) lines.push(current);
    if (word.length > maxChars) {
      const wrapped = wrapLongWord(word, maxChars);
      lines.push(...wrapped.slice(0, -1));
      current = wrapped[wrapped.length - 1] || '';
    } else {
      current = word;
    }
  });
  if (current) lines.push(current);
  return lines.join('\n');
}

function wrapLongWord(value: string, maxChars: number): string[] {
  const size = Math.max(maxChars, 1);
  const lines: string[] = [];
  for (let index = 0; index < value.length; index += size) {
    lines.push(value.slice(index, index + size));
  }
  return lines;
}

function createLegendVisualProvider(seriesModel: NestedCircleSeriesModel) {
  return {
    getAllNames() {
      return collectDataNames(seriesModel.getRawData());
    },

    containName(name: string) {
      return seriesModel.getRawData().indexOfName(name) >= 0;
    },

    indexOfName(name: string) {
      return collectDataNames(seriesModel.getData()).indexOf(name);
    },

    getItemVisual(dataIndex: number, key: string) {
      if (key === 'legendIcon') return null;
      if (key !== 'style') return seriesModel.getData().getItemVisual(dataIndex, key);

      const itemModel = seriesModel.getData().getItemModel(dataIndex);
      const itemStyle = asRecord(itemModel.get('itemStyle'));
      return {
        fill: itemStyle.color || DEFAULT_RING_COLORS[dataIndex % DEFAULT_RING_COLORS.length],
        stroke: itemStyle.borderColor || 'rgba(30, 58, 138, 0.34)',
        opacity: finiteNumber(itemStyle.opacity, 1)
      };
    }
  };
}

function collectDataNames(data: SeriesData): string[] {
  const names: string[] = [];
  for (let index = 0; index < data.count(); index++) {
    names.push(data.getName(index));
  }
  return names;
}

function readEnterAnimation(
  seriesModel: NestedCircleSeriesModel,
  itemIndex: number,
  animationOption = seriesModel.get('enterAnimation')
): EnterAnimationConfig {
  if (seriesModel.get('animation') === false || animationOption === false) return disabledEnterAnimation();

  const option = animationOption == null || animationOption === true ? {} : asRecord(animationOption);
  if (option.show === false || option.enabled === false) return disabledEnterAnimation();

  const baseDelay = resolveAnimationNumber(option.delay ?? seriesModel.get('animationDelay'), itemIndex, itemIndex, 0);
  const stagger = resolveAnimationNumber(option.stagger, itemIndex, itemIndex, 70);
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

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function createHoverItem(element: GraphicElement): ElementHoverItem {
  return {
    elements: [element],
    triggerElements: [element]
  };
}

function addHoverElement(item: ElementHoverItem | undefined, element: GraphicElement): void {
  if (!item) return;
  item.elements.push(element);
  if (!item.triggerElements) item.triggerElements = [];
  item.triggerElements.push(element);
}
