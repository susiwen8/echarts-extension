import * as echarts from 'echarts/lib/echarts';
import { clearAliveRender, installElementHover, renderAlive } from '@echarts-extension/layout-core';
import type { AliveRenderState, ElementHoverController, ElementHoverItem, ElementHoverOptions } from '@echarts-extension/layout-core';

import { DEFAULT_PALETTE, resolveVennLayout } from './layout.js';
import type { VennCircle, VennLabel, VennLayoutOption, VennLayoutResult } from './layout.js';

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

interface VennSeriesModel extends EChartsModel {
  option?: VennLayoutOption;
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
}

interface EChartsHost {
  extendSeriesModel(option: Record<string, unknown>): void;
  extendChartView(option: Record<string, unknown>): void;
  helper: {
    createDimensions(source: unknown[], options: Record<string, unknown>): unknown;
    getLayoutRect(params: unknown, container: { width: number; height: number }): ViewRect;
  };
  List: new (dimensions: unknown, host: VennSeriesModel) => SeriesData;
  graphic: {
    Group: new () => GraphicGroup;
    Circle: new (options: GraphicElementOptions) => GraphicElement;
    Text: new (options: GraphicElementOptions) => GraphicElement;
  };
}


interface VennChartView {
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
const optionKeys = ['padding', 'minRadius', 'maxRadius', 'vennType', 'mode'] as const satisfies ReadonlyArray<
  Extract<keyof VennLayoutOption, string>
>;

echartsHost.extendSeriesModel({
  type: 'series.venn',

  visualStyleAccessPath: 'itemStyle',
  visualDrawType: 'fill',

  getInitialData(this: VennSeriesModel, option: VennLayoutOption) {
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
    width: '78%',
    height: '78%',
    layout: 'hollow',
    layoutOptions: null,
    padding: 20,
    minRadius: null,
    maxRadius: null,
    enterAnimation: true,
    itemStyle: {
      opacity: 0.62,
      borderColor: '#ffffff',
      borderWidth: 1.5
    },
    hollowStyle: {
      opacity: 0.92,
      borderWidth: 6,
      color: null
    },
    label: {
      show: true,
      color: '#1f2937',
      fontSize: 12,
      fontWeight: 600,
      formatter: null
    },
    emphasis: {
      itemStyle: {
        shadowBlur: 10,
        shadowColor: 'rgba(31, 41, 55, 0.22)'
      }
    }
  }
});

echartsHost.extendChartView({
  type: 'venn',

  render(this: VennChartView, seriesModel: VennSeriesModel, ecModel: unknown, api: EChartsApi) {
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
      const layout = resolveVennLayout(readLayoutOption(seriesModel, rect));
      if (this.__renderToken !== renderToken) return;
      const { hoverItems } = renderAlive(this, echartsHost, group, seriesModel, (targetGroup, targetSeriesModel) => (
        drawVenn(echartsHost, targetGroup, targetSeriesModel, layout, rect)
      ));
      this.__hoverController = installElementHover(hoverItems, {
        zrender: api.getZr?.()
      });
    } catch (error) {
      if (typeof console !== 'undefined') {
        console.error('[venn] render failed', error);
      }
    }
  },

  remove(this: VennChartView) {
    this.__renderToken = null;
    this.__hoverController?.dispose();
    this.__hoverController = undefined;
    clearAliveRender(this);
    this.group.removeAll();
  },

  dispose(this: VennChartView) {
    this.__renderToken = null;
    this.__hoverController?.dispose();
    this.__hoverController = undefined;
    clearAliveRender(this);
    this.group.removeAll();
  }
});

function readLayoutOption(seriesModel: VennSeriesModel, rect: ViewRect): VennLayoutOption {
  const option = seriesModel.option || {};
  const layoutOption: VennLayoutOption = {
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

function drawVenn(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: VennSeriesModel,
  layout: VennLayoutResult,
  rect: ViewRect
): ElementHoverItem[] {
  const data = seriesModel.getData();
  const chartGroup = new echartsInstance.graphic.Group();
  const hoverItems: ElementHoverItem[] = [];
  const hoverItemsByDataIndex = new Map<number, ElementHoverItem>();
  chartGroup.x = rect.x;
  chartGroup.y = rect.y;

  if (layout.mode === 'hollow') {
    drawHollowVenn(echartsInstance, chartGroup, seriesModel, data, layout, hoverItems, hoverItemsByDataIndex);
  } else {
    drawBubbleVenn(echartsInstance, chartGroup, seriesModel, data, layout, hoverItems, hoverItemsByDataIndex);
  }

  group.add(chartGroup);
  return hoverItems;
}

function drawHollowVenn(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: VennSeriesModel,
  data: SeriesData,
  layout: VennLayoutResult,
  hoverItems: ElementHoverItem[],
  hoverItemsByDataIndex: Map<number, ElementHoverItem>
): void {
  const circleElementsBySetKey = new Map<string, GraphicElement>();

  layout.circles.forEach((circle, index) => {
    const dataIndex = findDataIndexForCircle(circle, layout.labels, index);
    const itemModel = dataIndex >= 0 ? data.getItemModel(dataIndex) : null;
    const circleEl = new echartsInstance.graphic.Circle({
      shape: {
        cx: circle.x,
        cy: circle.y,
        r: circle.r
      },
      style: readHollowCircleStyle(seriesModel, itemModel, index)
    });
    applyCircleEnterAnimation(circleEl, circle.r, readEnterAnimation(seriesModel, index));
    addCircleElementBySet(circleElementsBySetKey, circle, circleEl);

    if (dataIndex >= 0) {
      data.setItemLayout(dataIndex, [circle.x, circle.y]);
      data.setItemGraphicEl(dataIndex, circleEl);
      const hoverItem = createHoverItem(circleEl);
      hoverItems.push(hoverItem);
      hoverItemsByDataIndex.set(dataIndex, hoverItem);
    }

    group.add(circleEl);
  });

  drawLabels(echartsInstance, group, seriesModel, data, layout.labels, hoverItemsByDataIndex, hoverItems, circleElementsBySetKey);
}

function drawBubbleVenn(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: VennSeriesModel,
  data: SeriesData,
  layout: VennLayoutResult,
  hoverItems: ElementHoverItem[],
  hoverItemsByDataIndex: Map<number, ElementHoverItem>
): void {
  layout.circles.forEach((circle, index) => {
    const itemModel = data.getItemModel(circle.dataIndex);
    const circleEl = new echartsInstance.graphic.Circle({
      shape: {
        cx: circle.x,
        cy: circle.y,
        r: circle.r
      },
      style: readBubbleCircleStyle(data, seriesModel, itemModel, circle.dataIndex, index)
    });
    applyCircleEnterAnimation(circleEl, circle.r, readEnterAnimation(seriesModel, index));

    data.setItemLayout(circle.dataIndex, [circle.x, circle.y]);
    data.setItemGraphicEl(circle.dataIndex, circleEl);
    const hoverItem = createHoverItem(circleEl);
    hoverItems.push(hoverItem);
    hoverItemsByDataIndex.set(circle.dataIndex, hoverItem);
    group.add(circleEl);
  });

  drawLabels(echartsInstance, group, seriesModel, data, layout.labels, hoverItemsByDataIndex);
}

function drawLabels(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: VennSeriesModel,
  data: SeriesData,
  labels: VennLabel[],
  hoverItemsByDataIndex: Map<number, ElementHoverItem>,
  hoverItems?: ElementHoverItem[],
  circleElementsBySetKey?: Map<string, GraphicElement>
): void {
  labels.forEach((label) => {
    const itemModel = data.getItemModel(label.dataIndex);
    const labelModel = itemModel.getModel('label');
    const seriesLabelModel = seriesModel.getModel('label');
    const show = labelModel.get('show') ?? seriesLabelModel.get('show');
    if (!show) return;

    const textEl = new echartsInstance.graphic.Text({
      style: {
        x: label.x,
        y: label.y,
        text: formatLabel(labelModel.get('formatter') || seriesLabelModel.get('formatter'), label),
        fill: labelModel.get('color') || seriesLabelModel.get('color') || '#1f2937',
        fontSize: labelModel.get('fontSize') || seriesLabelModel.get('fontSize') || 12,
        fontWeight: labelModel.get('fontWeight') || seriesLabelModel.get('fontWeight') || 600,
        align: 'center',
        verticalAlign: 'middle'
      },
      silent: true
    });
    applyFadeEnterAnimation(textEl, readEnterAnimation(seriesModel, label.dataIndex));
    addLabelHoverElement(label, textEl, hoverItemsByDataIndex, hoverItems, circleElementsBySetKey);

    group.add(textEl);
  });
}

function addCircleElementBySet(
  circleElementsBySetKey: Map<string, GraphicElement>,
  circle: VennCircle,
  element: GraphicElement
): void {
  [circle.id, circle.name, circle.setKey, ...(circle.sets || [])].forEach((key) => {
    if (typeof key === 'string' && key) circleElementsBySetKey.set(key, element);
  });
}

function addLabelHoverElement(
  label: VennLabel,
  textEl: GraphicElement,
  hoverItemsByDataIndex: Map<number, ElementHoverItem>,
  hoverItems?: ElementHoverItem[],
  circleElementsBySetKey?: Map<string, GraphicElement>
): void {
  const relatedCircleElements = collectRelatedCircleElements(label, circleElementsBySetKey);

  if (relatedCircleElements.length > 1 && hoverItems) {
    hoverItems.push({
      elements: [...relatedCircleElements, textEl],
      triggerElements: [textEl]
    });
    return;
  }

  addHoverElement(hoverItemsByDataIndex.get(label.dataIndex), textEl);
}

function collectRelatedCircleElements(
  label: VennLabel,
  circleElementsBySetKey?: Map<string, GraphicElement>
): GraphicElement[] {
  if (!circleElementsBySetKey || !label.sets?.length) return [];

  const result: GraphicElement[] = [];
  const seen = new Set<GraphicElement>();
  label.sets.forEach((setName) => {
    const circle = circleElementsBySetKey.get(setName);
    if (!circle || seen.has(circle)) return;
    seen.add(circle);
    result.push(circle);
  });
  return result;
}

function findDataIndexForCircle(circle: VennCircle, labels: VennLabel[], fallbackIndex: number): number {
  const label = labels.find((item) => item.setKey === circle.setKey);
  return label?.dataIndex ?? fallbackIndex;
}

function readHollowCircleStyle(seriesModel: VennSeriesModel, itemModel: EChartsModel | null, index: number): Record<string, unknown> {
  const style = asRecord(seriesModel.get('hollowStyle'));
  const itemStyle = itemModel ? asRecord(itemModel.get('itemStyle')) : {};
  const color = itemStyle.color || style.color || DEFAULT_PALETTE[index % DEFAULT_PALETTE.length];

  return {
    fill: null,
    stroke: color,
    lineWidth: finiteNumber(itemStyle.borderWidth ?? style.borderWidth, 6),
    opacity: finiteNumber(itemStyle.opacity ?? style.opacity, 0.92)
  };
}

function readBubbleCircleStyle(
  data: SeriesData,
  seriesModel: VennSeriesModel,
  itemModel: EChartsModel,
  dataIndex: number,
  index: number
): Record<string, unknown> {
  const normal = asRecord(seriesModel.get('itemStyle'));
  const itemStyle = asRecord(itemModel.get('itemStyle'));
  const visualStyle = asRecord(data.getItemVisual(dataIndex, 'style'));
  return {
    fill: itemStyle.color || normal.color || visualStyle.fill || DEFAULT_PALETTE[index % DEFAULT_PALETTE.length],
    stroke: itemStyle.borderColor || normal.borderColor || '#ffffff',
    lineWidth: finiteNumber(itemStyle.borderWidth ?? normal.borderWidth, 1.5),
    opacity: finiteNumber(itemStyle.opacity ?? normal.opacity, 0.62)
  };
}

function formatLabel(formatter: unknown, label: VennLabel): unknown {
  if (typeof formatter === 'function') {
    return (formatter as (params: { data: VennLabel; name: string; value: unknown }) => unknown)({
      data: label,
      name: label.name,
      value: label.value
    });
  }
  if (typeof formatter === 'string') {
    return formatter.replace(/\{b\}/g, label.name).replace(/\{c\}/g, String(label.value ?? ''));
  }
  return label.name;
}

function createLegendVisualProvider(seriesModel: VennSeriesModel) {
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
        fill: itemStyle.color || DEFAULT_PALETTE[dataIndex % DEFAULT_PALETTE.length],
        stroke: itemStyle.borderColor || '#ffffff',
        opacity: finiteNumber(itemStyle.opacity, 0.9)
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

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function readEnterAnimation(
  seriesModel: VennSeriesModel,
  itemIndex: number,
  animationOption = seriesModel.get('enterAnimation')
): EnterAnimationConfig {
  if (seriesModel.get('animation') === false || animationOption === false) return disabledEnterAnimation();

  const option = animationOption == null || animationOption === true ? {} : asRecord(animationOption);
  if (option.show === false || option.enabled === false) return disabledEnterAnimation();

  const baseDelay = resolveAnimationNumber(option.delay ?? seriesModel.get('animationDelay'), itemIndex, itemIndex, 0);
  const stagger = resolveAnimationNumber(option.stagger, itemIndex, itemIndex, 35);
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
