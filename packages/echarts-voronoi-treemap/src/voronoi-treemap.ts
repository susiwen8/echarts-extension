import * as echarts from 'echarts/lib/echarts';
import { clearAliveRender, installElementHover, renderAlive } from '@echarts-extension/layout-core';
import type { AliveRenderState, ElementHoverController, ElementHoverItem, ElementHoverOptions } from '@echarts-extension/layout-core';

import {
  DEFAULT_VORONOI_TREEMAP_COLORS,
  flattenVoronoiTreemapData,
  resolveVoronoiTreemapLayout
} from './layout.js';
import type { VoronoiTreemapLayoutOption, VoronoiTreemapLayoutResult, VoronoiTreemapNode } from './layout.js';

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

interface VoronoiTreemapSeriesModel extends EChartsModel {
  option?: VoronoiTreemapLayoutOption;
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
  List: new (dimensions: unknown, host: VoronoiTreemapSeriesModel) => SeriesData;
  graphic: {
    Group: new () => GraphicGroup;
    Polygon: new (options: GraphicElementOptions) => GraphicElement;
    Text: new (options: GraphicElementOptions) => GraphicElement;
  };
}


interface VoronoiTreemapChartView {
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

interface LabelBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

type AnimationTargetKey = 'style';

const echartsHost = echarts as unknown as EChartsHost;
const optionKeys = [
  'padding',
  'gap',
  'rootName',
  'rootVisible',
  'colors',
  'sort',
  'maxIteration',
  'dimensions',
  'nameField',
  'valueField',
  'childrenField'
] as const satisfies ReadonlyArray<Extract<keyof VoronoiTreemapLayoutOption, string>>;

echartsHost.extendSeriesModel({
  type: 'series.voronoiTreemap',

  visualStyleAccessPath: 'itemStyle',
  visualDrawType: 'fill',

  getInitialData(this: VoronoiTreemapSeriesModel, option: VoronoiTreemapLayoutOption) {
    const source = flattenVoronoiTreemapData(option.data, option);
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
    width: '88%',
    height: '82%',
    padding: 12,
    gap: 1.5,
    rootName: 'root',
    rootVisible: false,
    colors: DEFAULT_VORONOI_TREEMAP_COLORS,
    sort: true,
    maxIteration: 24,
    nameField: 'name',
    valueField: 'value',
    childrenField: 'children',
    enterAnimation: true,
    itemStyle: {
      opacity: 0.94,
      borderColor: '#ffffff',
      borderWidth: 1.2
    },
    label: {
      show: true,
      showInternal: false,
      color: '#111827',
      fontSize: 12,
      fontWeight: 650,
      lineHeight: 14,
      minArea: 760,
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
  type: 'voronoiTreemap',

  render(this: VoronoiTreemapChartView, seriesModel: VoronoiTreemapSeriesModel, ecModel: unknown, api: EChartsApi) {
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
      const layout = resolveVoronoiTreemapLayout(readLayoutOption(seriesModel, rect));
      if (this.__renderToken !== renderToken) return;
      const { hoverItems } = renderAlive(this, echartsHost, group, seriesModel, (targetGroup, targetSeriesModel) => (
        drawVoronoiTreemap(echartsHost, targetGroup, targetSeriesModel, layout, rect)
      ));
      this.__hoverController = installElementHover(hoverItems, {
        zrender: api.getZr?.()
      });
    } catch (error) {
      if (typeof console !== 'undefined') {
        console.error('[voronoiTreemap] render failed', error);
      }
    }
  },

  remove(this: VoronoiTreemapChartView) {
    this.__renderToken = null;
    this.__hoverController?.dispose();
    this.__hoverController = undefined;
    clearAliveRender(this);
    this.group.removeAll();
  },

  dispose(this: VoronoiTreemapChartView) {
    this.__renderToken = null;
    this.__hoverController?.dispose();
    this.__hoverController = undefined;
    clearAliveRender(this);
    this.group.removeAll();
  }
});

function readLayoutOption(seriesModel: VoronoiTreemapSeriesModel, rect: ViewRect): VoronoiTreemapLayoutOption {
  const option = seriesModel.option || {};
  const layoutOption: VoronoiTreemapLayoutOption = {
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

function drawVoronoiTreemap(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: VoronoiTreemapSeriesModel,
  layout: VoronoiTreemapLayoutResult,
  rect: ViewRect
): ElementHoverItem[] {
  const data = seriesModel.getData();
  const chartGroup = new echartsInstance.graphic.Group();
  const hoverItems: ElementHoverItem[] = [];
  const hoverItemsByDataIndex = new Map<number, ElementHoverItem>();
  chartGroup.x = rect.x;
  chartGroup.y = rect.y;

  layout.nodes.forEach((node, index) => {
    if (node.points.length < 3 || node.area <= 0) return;

    const itemModel = node.dataIndex >= 0 && node.dataIndex < data.count() ? data.getItemModel(node.dataIndex) : null;
    const polygon = new echartsInstance.graphic.Polygon({
      shape: {
        points: node.points
      },
      style: readNodeStyle(data, seriesModel, itemModel, node, index),
      z2: node.depth
    });
    applyFadeEnterAnimation(polygon, readEnterAnimation(seriesModel, index));

    if (itemModel && node.dataIndex >= 0 && node.dataIndex < data.count()) {
      data.setItemLayout(node.dataIndex, [node.centroidX + rect.x, node.centroidY + rect.y]);
      data.setItemGraphicEl(node.dataIndex, polygon);
      const hoverItem = createHoverItem(polygon);
      hoverItems.push(hoverItem);
      hoverItemsByDataIndex.set(node.dataIndex, hoverItem);
    }

    chartGroup.add(polygon);
  });

  drawLabels(echartsInstance, chartGroup, seriesModel, data, layout.nodes, hoverItemsByDataIndex);
  group.add(chartGroup);
  return hoverItems;
}

function drawLabels(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: VoronoiTreemapSeriesModel,
  data: SeriesData,
  nodes: VoronoiTreemapNode[],
  hoverItemsByDataIndex: Map<number, ElementHoverItem>
): void {
  const seriesLabelModel = seriesModel.getModel('label');
  if (!seriesLabelModel.get('show')) return;

  nodes.forEach((node) => {
    const itemModel = node.dataIndex >= 0 && node.dataIndex < data.count() ? data.getItemModel(node.dataIndex) : null;
    const itemLabelModel = itemModel?.getModel('label');
    const show = itemLabelModel?.get('show') ?? seriesLabelModel.get('show');
    const showInternal = itemLabelModel?.get('showInternal') ?? seriesLabelModel.get('showInternal');
    if (!show || (!node.isLeaf && !showInternal)) return;

    const minArea = finiteNumber(itemLabelModel?.get('minArea') ?? seriesLabelModel.get('minArea'), 760);
    if (node.area < minArea) return;

    const bounds = pointBounds(node.points);
    const boxWidth = bounds.maxX - bounds.minX;
    const boxHeight = bounds.maxY - bounds.minY;
    const baseFontSize = finiteNumber(itemLabelModel?.get('fontSize') ?? seriesLabelModel.get('fontSize'), 12);
    if (boxWidth < Math.max(24, baseFontSize * 2) || boxHeight < Math.max(14, baseFontSize * 1.15)) return;

    const fontSize = Math.min(baseFontSize, Math.max(8, Math.min(boxHeight * 0.3, boxWidth * 0.15)));
    const lineHeight = finiteNumber(itemLabelModel?.get('lineHeight') ?? seriesLabelModel.get('lineHeight'), fontSize + 3);
    const maxChars = Math.max(3, Math.floor(Math.max(boxWidth - 10, 1) / Math.max(fontSize * 0.56, 1)));
    const text = formatLabel(itemLabelModel?.get('formatter') || seriesLabelModel.get('formatter'), node);

    const labelEl = new echartsInstance.graphic.Text({
      style: {
        x: node.centroidX,
        y: node.centroidY,
        text: wrapText(String(text), maxChars, Math.max(1, Math.floor(boxHeight / lineHeight))),
        fill: itemLabelModel?.get('color') || seriesLabelModel.get('color') || '#111827',
        fontSize,
        fontWeight: itemLabelModel?.get('fontWeight') || seriesLabelModel.get('fontWeight') || 650,
        lineHeight,
        align: 'center',
        verticalAlign: 'middle'
      },
      silent: true,
      z2: node.depth + 20
    });
    applyFadeEnterAnimation(labelEl, readEnterAnimation(seriesModel, node.dataIndex));
    addHoverElement(hoverItemsByDataIndex.get(node.dataIndex), labelEl);
    group.add(labelEl);
  });
}

function readNodeStyle(
  data: SeriesData,
  seriesModel: VoronoiTreemapSeriesModel,
  itemModel: EChartsModel | null,
  node: VoronoiTreemapNode,
  index: number
): Record<string, unknown> {
  const seriesStyle = asRecord(seriesModel.get('itemStyle'));
  const rawStyle = readRawItemStyle(node.raw);
  const itemStyle = itemModel ? asRecord(itemModel.get('itemStyle')) : rawStyle;
  const visualStyle = node.dataIndex >= 0 && node.dataIndex < data.count()
    ? asRecord(data.getItemVisual(node.dataIndex, 'style'))
    : {};

  return {
    fill: itemStyle.color || rawStyle.color || seriesStyle.color || node.color || visualStyle.fill || DEFAULT_VORONOI_TREEMAP_COLORS[index % DEFAULT_VORONOI_TREEMAP_COLORS.length],
    stroke: itemStyle.borderColor || rawStyle.borderColor || seriesStyle.borderColor || '#ffffff',
    lineWidth: finiteNumber(itemStyle.borderWidth ?? rawStyle.borderWidth ?? seriesStyle.borderWidth, 1.2),
    opacity: finiteNumber(itemStyle.opacity ?? rawStyle.opacity ?? seriesStyle.opacity, 0.94)
  };
}

function formatLabel(formatter: unknown, node: VoronoiTreemapNode): unknown {
  const params = {
    data: node.raw,
    name: node.name,
    value: node.value,
    percent: node.percent,
    depth: node.depth,
    isLeaf: node.isLeaf,
    parentId: node.parentId,
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

function wrapText(value: string, maxChars: number, maxLines: number): string {
  if (maxLines <= 1) return value.length > maxChars ? `${value.slice(0, Math.max(1, maxChars - 1))}...` : value;
  if (value.length <= maxChars) return value;

  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  if (words.length <= 1) {
    for (let index = 0; index < value.length && lines.length < maxLines; index += maxChars) {
      lines.push(value.slice(index, index + maxChars));
    }
    return trimLines(lines, maxLines, maxChars);
  }

  words.forEach((word) => {
    if (lines.length >= maxLines) return;
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) {
      current = next;
      return;
    }
    if (current) lines.push(current);
    current = word.length > maxChars ? word.slice(0, maxChars) : word;
  });
  if (current && lines.length < maxLines) lines.push(current);
  return trimLines(lines, maxLines, maxChars);
}

function trimLines(lines: string[], maxLines: number, maxChars: number): string {
  const visible = lines.slice(0, maxLines);
  if (lines.length > maxLines && visible.length) {
    const last = visible[visible.length - 1];
    visible[visible.length - 1] = `${last.slice(0, Math.max(1, maxChars - 1))}...`;
  }
  return visible.join('\n');
}

function createLegendVisualProvider(seriesModel: VoronoiTreemapSeriesModel) {
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
        fill: itemStyle.color || DEFAULT_VORONOI_TREEMAP_COLORS[dataIndex % DEFAULT_VORONOI_TREEMAP_COLORS.length],
        stroke: itemStyle.borderColor || '#ffffff',
        opacity: finiteNumber(itemStyle.opacity, 0.94)
      };
    }
  };
}

function collectDataNames(data: SeriesData): string[] {
  const names: string[] = [];
  for (let index = 0; index < data.count(); index += 1) {
    names.push(data.getName(index));
  }
  return names;
}

function readRawItemStyle(raw: unknown): Record<string, unknown> {
  const record = asRecord(raw);
  return asRecord(record.itemStyle);
}

function readEnterAnimation(
  seriesModel: VoronoiTreemapSeriesModel,
  itemIndex: number,
  animationOption = seriesModel.get('enterAnimation')
): EnterAnimationConfig {
  if (seriesModel.get('animation') === false || animationOption === false) return disabledEnterAnimation();

  const option = animationOption == null || animationOption === true ? {} : asRecord(animationOption);
  if (option.show === false || option.enabled === false) return disabledEnterAnimation();

  const baseDelay = resolveAnimationNumber(option.delay ?? seriesModel.get('animationDelay'), itemIndex, itemIndex, 0);
  const stagger = resolveAnimationNumber(option.stagger, itemIndex, itemIndex, 18);
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

function pointBounds(points: Array<[number, number]>): LabelBounds {
  return points.reduce((bounds, [x, y]) => ({
    minX: Math.min(bounds.minX, x),
    minY: Math.min(bounds.minY, y),
    maxX: Math.max(bounds.maxX, x),
    maxY: Math.max(bounds.maxY, y)
  }), {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity
  });
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
