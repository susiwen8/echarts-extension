import * as echarts from 'echarts/lib/echarts';
import { clearAliveRender, installElementHover, renderAlive } from '@echarts-extension/layout-core';
import type { AliveRenderState, ElementHoverController, ElementHoverItem, ElementHoverOptions } from '@echarts-extension/layout-core';

import { DEFAULT_FLAME_COLORS, flattenFlameData, resolveFlameLayout } from './layout.js';
import type { FlameLayoutOption, FlameLayoutResult, FlameNode } from './layout.js';

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
  setItemLayout(dataIndex: number, layout: [number, number, number, number]): void;
  setItemGraphicEl(dataIndex: number, element: GraphicElement): void;
}

interface FlameSeriesModel extends EChartsModel {
  option?: FlameLayoutOption;
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
  List: new (dimensions: unknown, host: FlameSeriesModel) => SeriesData;
  graphic: {
    Group: new () => GraphicGroup;
    Rect: new (options: GraphicElementOptions) => GraphicElement;
    Text: new (options: GraphicElementOptions) => GraphicElement;
  };
}


interface FlameChartView {
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
  'gap',
  'rootName',
  'rootVisible',
  'orient',
  'colors',
  'sort'
] as const satisfies ReadonlyArray<Extract<keyof FlameLayoutOption, string>>;

echartsHost.extendSeriesModel({
  type: 'series.flame',

  visualStyleAccessPath: 'itemStyle',
  visualDrawType: 'fill',

  getInitialData(this: FlameSeriesModel, option: FlameLayoutOption) {
    const source = flattenFlameData(option.data, option.rootName);
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
    width: '92%',
    height: '84%',
    padding: 4,
    gap: 1,
    rootName: 'root',
    rootVisible: null,
    orient: 'up',
    colors: DEFAULT_FLAME_COLORS,
    sort: true,
    enterAnimation: true,
    itemStyle: {
      opacity: 0.95,
      borderColor: '#ffffff',
      borderWidth: 1
    },
    label: {
      show: true,
      color: '#111827',
      fontSize: 12,
      fontWeight: 600,
      formatter: null
    },
    emphasis: {
      itemStyle: {
        shadowBlur: 8,
        shadowColor: 'rgba(31, 41, 55, 0.2)'
      }
    }
  }
});

echartsHost.extendChartView({
  type: 'flame',

  render(this: FlameChartView, seriesModel: FlameSeriesModel, ecModel: unknown, api: EChartsApi) {
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
      const layout = resolveFlameLayout(readLayoutOption(seriesModel, rect));
      if (this.__renderToken !== renderToken) return;
      const { hoverItems } = renderAlive(this, echartsHost, group, seriesModel, (targetGroup, targetSeriesModel) => (
        drawFlame(echartsHost, targetGroup, targetSeriesModel, layout, rect)
      ));
      this.__hoverController = installElementHover(hoverItems, {
        zrender: api.getZr?.()
      });
    } catch (error) {
      if (typeof console !== 'undefined') {
        console.error('[flame] render failed', error);
      }
    }
  },

  remove(this: FlameChartView) {
    this.__renderToken = null;
    this.__hoverController?.dispose();
    this.__hoverController = undefined;
    clearAliveRender(this);
    this.group.removeAll();
  },

  dispose(this: FlameChartView) {
    this.__renderToken = null;
    this.__hoverController?.dispose();
    this.__hoverController = undefined;
    clearAliveRender(this);
    this.group.removeAll();
  }
});

function readLayoutOption(seriesModel: FlameSeriesModel, rect: ViewRect): FlameLayoutOption {
  const option = seriesModel.option || {};
  const layoutOption: FlameLayoutOption = {
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

function drawFlame(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: FlameSeriesModel,
  layout: FlameLayoutResult,
  rect: ViewRect
): ElementHoverItem[] {
  const data = seriesModel.getData();
  const chartGroup = new echartsInstance.graphic.Group();
  const hoverItems: ElementHoverItem[] = [];
  const hoverItemsByDataIndex = new Map<number, ElementHoverItem>();
  chartGroup.x = rect.x;
  chartGroup.y = rect.y;

  layout.nodes.forEach((node, index) => {
    if (node.width <= 0 || node.height <= 0) return;

    const itemModel = node.dataIndex >= 0 && node.dataIndex < data.count() ? data.getItemModel(node.dataIndex) : null;
    const rectEl = new echartsInstance.graphic.Rect({
      shape: {
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height
      },
      style: readNodeStyle(data, seriesModel, itemModel, node, index)
    });
    applyRectEnterAnimation(rectEl, node, readEnterAnimation(seriesModel, index));

    if (itemModel && node.dataIndex >= 0 && node.dataIndex < data.count()) {
      data.setItemLayout(node.dataIndex, [node.x, node.y, node.width, node.height]);
      data.setItemGraphicEl(node.dataIndex, rectEl);
      const hoverItem = createHoverItem(rectEl);
      hoverItems.push(hoverItem);
      hoverItemsByDataIndex.set(node.dataIndex, hoverItem);
    }

    chartGroup.add(rectEl);
  });

  drawLabels(echartsInstance, chartGroup, seriesModel, data, layout.nodes, hoverItemsByDataIndex);
  group.add(chartGroup);
  return hoverItems;
}

function drawLabels(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: FlameSeriesModel,
  data: SeriesData,
  nodes: FlameNode[],
  hoverItemsByDataIndex: Map<number, ElementHoverItem>
): void {
  const seriesLabelModel = seriesModel.getModel('label');
  if (!seriesLabelModel.get('show')) return;

  nodes.forEach((node) => {
    const itemModel = node.dataIndex >= 0 && node.dataIndex < data.count() ? data.getItemModel(node.dataIndex) : null;
    const itemLabelModel = itemModel?.getModel('label');
    const show = itemLabelModel?.get('show') ?? seriesLabelModel.get('show');
    if (!show) return;

    const baseFontSize = finiteNumber(itemLabelModel?.get('fontSize') ?? seriesLabelModel.get('fontSize'), 12);
    if (node.width < Math.max(24, baseFontSize * 2) || node.height < Math.max(12, baseFontSize * 1.1)) return;

    const fontSize = Math.min(baseFontSize, Math.max(8, Math.min(node.height * 0.48, node.width * 0.18)));
    const maxChars = Math.max(3, Math.floor(Math.max(node.width - 8, 1) / Math.max(fontSize * 0.56, 1)));
    const text = formatLabel(itemLabelModel?.get('formatter') || seriesLabelModel.get('formatter'), node);

    const labelEl = new echartsInstance.graphic.Text({
      style: {
        x: node.x + 4,
        y: node.y + node.height / 2,
        text: ellipsize(String(text), maxChars),
        fill: itemLabelModel?.get('color') || seriesLabelModel.get('color') || '#111827',
        fontSize,
        fontWeight: itemLabelModel?.get('fontWeight') || seriesLabelModel.get('fontWeight') || 600,
        align: 'left',
        verticalAlign: 'middle'
      },
      silent: true
    });
    applyFadeEnterAnimation(labelEl, readEnterAnimation(seriesModel, node.dataIndex));
    addHoverElement(hoverItemsByDataIndex.get(node.dataIndex), labelEl);
    group.add(labelEl);
  });
}

function readNodeStyle(
  data: SeriesData,
  seriesModel: FlameSeriesModel,
  itemModel: EChartsModel | null,
  node: FlameNode,
  index: number
): Record<string, unknown> {
  const seriesStyle = asRecord(seriesModel.get('itemStyle'));
  const rawStyle = readRawItemStyle(node.raw);
  const itemStyle = itemModel ? asRecord(itemModel.get('itemStyle')) : rawStyle;
  const visualStyle = node.dataIndex >= 0 && node.dataIndex < data.count()
    ? asRecord(data.getItemVisual(node.dataIndex, 'style'))
    : {};

  return {
    fill: itemStyle.color || rawStyle.color || seriesStyle.color || visualStyle.fill || node.color || DEFAULT_FLAME_COLORS[index % DEFAULT_FLAME_COLORS.length],
    stroke: itemStyle.borderColor || rawStyle.borderColor || seriesStyle.borderColor || '#ffffff',
    lineWidth: finiteNumber(itemStyle.borderWidth ?? rawStyle.borderWidth ?? seriesStyle.borderWidth, 1),
    opacity: finiteNumber(itemStyle.opacity ?? rawStyle.opacity ?? seriesStyle.opacity, 0.95)
  };
}

function formatLabel(formatter: unknown, node: FlameNode): unknown {
  const params = {
    data: node.raw,
    name: node.name,
    value: node.value,
    percent: node.percent,
    depth: node.depth,
    node
  };

  if (typeof formatter === 'function') {
    return (formatter as (input: typeof params) => unknown)(params);
  }
  if (typeof formatter === 'string') {
    return formatter
      .replace(/\{b\}/g, node.name)
      .replace(/\{c\}/g, String(node.value))
      .replace(/\{d\}/g, String(Math.round(node.percent * 100)))
      .replace(/\{p\}/g, `${Math.round(node.percent * 100)}%`);
  }
  return node.name;
}

function ellipsize(value: string, maxChars: number): string {
  if (value.length <= maxChars) return value;
  return `${value.slice(0, Math.max(1, maxChars - 1))}...`;
}

function createLegendVisualProvider(seriesModel: FlameSeriesModel) {
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
        fill: itemStyle.color || DEFAULT_FLAME_COLORS[dataIndex % DEFAULT_FLAME_COLORS.length],
        stroke: itemStyle.borderColor || '#ffffff',
        opacity: finiteNumber(itemStyle.opacity, 0.95)
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

function readRawItemStyle(raw: unknown): Record<string, unknown> {
  const record = asRecord(raw);
  return asRecord(record.itemStyle);
}

function readEnterAnimation(
  seriesModel: FlameSeriesModel,
  itemIndex: number,
  animationOption = seriesModel.get('enterAnimation')
): EnterAnimationConfig {
  if (seriesModel.get('animation') === false || animationOption === false) return disabledEnterAnimation();

  const option = animationOption == null || animationOption === true ? {} : asRecord(animationOption);
  if (option.show === false || option.enabled === false) return disabledEnterAnimation();

  const baseDelay = resolveAnimationNumber(option.delay ?? seriesModel.get('animationDelay'), itemIndex, itemIndex, 0);
  const stagger = resolveAnimationNumber(option.stagger, itemIndex, itemIndex, 10);
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

function applyRectEnterAnimation(element: GraphicElement, node: FlameNode, animation: EnterAnimationConfig): void {
  if (!animation.enabled) return;
  const animatable = element as AnimatableGraphicElement;
  if (typeof animatable.animate !== 'function') return;

  const shape = animatable.shape || {};
  const style = animatable.style || {};
  const opacity = finiteNumber(style.opacity, 1);
  shape.width = 0;
  style.opacity = 0;
  animatable.shape = shape;
  animatable.style = style;
  animateGraphicProperty(animatable, 'shape', animation, { width: node.width });
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
