import * as echarts from 'echarts/lib/echarts';
import { clearAliveRender, installElementHover, renderAlive } from '@echarts-extension/layout-core';
import type { AliveRenderState, ElementHoverController, ElementHoverItem, ElementHoverOptions } from '@echarts-extension/layout-core';

import {
  DEFAULT_CIRCLE_PACKING_COLORS,
  flattenCirclePackingData,
  resolveCirclePackingLayout
} from './layout.js';
import type { CirclePackingLayoutOption, CirclePackingLayoutResult, CirclePackingNode } from './layout.js';

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
  setItemLayout(dataIndex: number, layout: [number, number, number]): void;
  setItemGraphicEl(dataIndex: number, element: GraphicElement): void;
}

interface CirclePackingSeriesModel extends EChartsModel {
  option?: CirclePackingLayoutOption;
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
  List: new (dimensions: unknown, host: CirclePackingSeriesModel) => SeriesData;
  graphic: {
    Group: new () => GraphicGroup;
    Circle: new (options: GraphicElementOptions) => GraphicElement;
    Text: new (options: GraphicElementOptions) => GraphicElement;
  };
}


interface CirclePackingChartView {
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

interface LabelPosition {
  x: number;
  y: number;
}

interface LabelBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

const echartsHost = echarts as unknown as EChartsHost;
const optionKeys = [
  'padding',
  'nodePadding',
  'siblingGap',
  'center',
  'radius',
  'rootName',
  'rootVisible',
  'valueField',
  'nameField',
  'childrenField',
  'sort',
  'colors'
] as const satisfies ReadonlyArray<Extract<keyof CirclePackingLayoutOption, string>>;

echartsHost.extendSeriesModel({
  type: 'series.circlePacking',

  visualStyleAccessPath: 'itemStyle',
  visualDrawType: 'fill',

  getInitialData(this: CirclePackingSeriesModel, option: CirclePackingLayoutOption) {
    const source = flattenCirclePackingData(option.data, readInitialDataOptions(option));
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
    height: '88%',
    padding: 18,
    nodePadding: 2.5,
    siblingGap: 1.5,
    center: null,
    radius: null,
    rootName: 'root',
    rootVisible: null,
    valueField: 'value',
    nameField: 'name',
    childrenField: 'children',
    sort: true,
    colors: DEFAULT_CIRCLE_PACKING_COLORS,
    enterAnimation: true,
    itemStyle: {
      opacity: 0.88,
      borderColor: '#ffffff',
      borderWidth: 1.2
    },
    label: {
      show: true,
      color: '#101828',
      fontSize: 12,
      fontWeight: 650,
      lineHeight: 14,
      minRadius: 18,
      formatter: null
    },
    emphasis: {
      itemStyle: {
        shadowBlur: 10,
        shadowColor: 'rgba(15, 23, 42, 0.22)'
      }
    }
  }
});

echartsHost.extendChartView({
  type: 'circlePacking',

  render(this: CirclePackingChartView, seriesModel: CirclePackingSeriesModel, ecModel: unknown, api: EChartsApi) {
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
      const layout = resolveCirclePackingLayout(readLayoutOption(seriesModel, rect));
      if (this.__renderToken !== renderToken) return;
      const { hoverItems } = renderAlive(this, echartsHost, group, seriesModel, (targetGroup, targetSeriesModel) => (
        drawCirclePacking(echartsHost, targetGroup, targetSeriesModel, layout, rect)
      ));
      this.__hoverController = installElementHover(hoverItems, {
        zrender: api.getZr?.()
      });
    } catch (error) {
      console.error('[circlePacking] render failed', error);
    }
  },

  remove(this: CirclePackingChartView) {
    this.__renderToken = null;
    this.__hoverController?.dispose();
    this.__hoverController = undefined;
    clearAliveRender(this);
    this.group.removeAll();
  },

  dispose(this: CirclePackingChartView) {
    this.__renderToken = null;
    this.__hoverController?.dispose();
    this.__hoverController = undefined;
    clearAliveRender(this);
    this.group.removeAll();
  }
});

function readInitialDataOptions(option: CirclePackingLayoutOption): CirclePackingLayoutOption {
  const layoutOption: CirclePackingLayoutOption = {
    ...(isPlainObject(option.layout) ? option.layout : {}),
    ...(isPlainObject(option.layoutOptions) ? option.layoutOptions : {})
  };

  optionKeys.forEach((key) => {
    const value = option[key];
    if (value !== undefined && value !== null) layoutOption[key as string] = value;
  });

  return layoutOption;
}

function readLayoutOption(seriesModel: CirclePackingSeriesModel, rect: ViewRect): CirclePackingLayoutOption {
  const option = seriesModel.option || {};
  const layoutOption: CirclePackingLayoutOption = {
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

function drawCirclePacking(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: CirclePackingSeriesModel,
  layout: CirclePackingLayoutResult,
  rect: ViewRect
): ElementHoverItem[] {
  const data = seriesModel.getData();
  const chartGroup = new echartsInstance.graphic.Group();
  const hoverItems: ElementHoverItem[] = [];
  const hoverItemsByDataIndex = new Map<number, ElementHoverItem>();
  const hoverItemsByNodeId = new Map<string, ElementHoverItem>();
  chartGroup.x = rect.x;
  chartGroup.y = rect.y;

  layout.nodes.forEach((node, index) => {
    if (node.r <= 0) return;

    const itemModel = node.dataIndex >= 0 && node.dataIndex < data.count() ? data.getItemModel(node.dataIndex) : null;
    const circleEl = new echartsInstance.graphic.Circle({
      shape: {
        cx: node.x,
        cy: node.y,
        r: node.r
      },
      style: readNodeStyle(data, seriesModel, itemModel, node, index)
    });
    applyCircleEnterAnimation(circleEl, node.r, readEnterAnimation(seriesModel, index));

    if (itemModel && node.dataIndex >= 0 && node.dataIndex < data.count()) {
      data.setItemLayout(node.dataIndex, [node.x, node.y, node.r]);
      data.setItemGraphicEl(node.dataIndex, circleEl);
      const hoverItem = createHoverItem(circleEl);
      hoverItems.push(hoverItem);
      hoverItemsByDataIndex.set(node.dataIndex, hoverItem);
      hoverItemsByNodeId.set(node.id, hoverItem);
    }

    chartGroup.add(circleEl);
  });

  drawLabels(echartsInstance, chartGroup, seriesModel, data, layout.nodes, hoverItemsByDataIndex);
  includeDescendantsInHoverItems(layout.nodes, hoverItemsByNodeId);
  group.add(chartGroup);
  return hoverItems;
}

function drawLabels(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: CirclePackingSeriesModel,
  data: SeriesData,
  nodes: CirclePackingNode[],
  hoverItemsByDataIndex: Map<number, ElementHoverItem>
): void {
  const seriesLabelModel = seriesModel.getModel('label');
  if (!seriesLabelModel.get('show')) return;

  nodes.forEach((node) => {
    const itemModel = node.dataIndex >= 0 && node.dataIndex < data.count() ? data.getItemModel(node.dataIndex) : null;
    const itemLabelModel = itemModel?.getModel('label');
    const show = itemLabelModel?.get('show') ?? seriesLabelModel.get('show');
    const minRadius = finiteNumber(itemLabelModel?.get('minRadius') ?? seriesLabelModel.get('minRadius'), 18);
    if (!show || node.r < minRadius) return;

    const requestedFontSize = finiteNumber(itemLabelModel?.get('fontSize') ?? seriesLabelModel.get('fontSize'), 12);
    const fontSize = Math.min(requestedFontSize, Math.max(8, node.r * 0.32));
    const lineHeight = finiteNumber(itemLabelModel?.get('lineHeight') ?? seriesLabelModel.get('lineHeight'), fontSize + 2);
    const text = formatLabel(itemLabelModel?.get('formatter') || seriesLabelModel.get('formatter'), node);
    const wrappedText = wrapText(String(text), node.r * 1.5, fontSize, node.r);
    const position = resolveLabelPosition(node, wrappedText, fontSize, lineHeight);
    const textEl = new echartsInstance.graphic.Text({
      style: {
        x: position.x,
        y: position.y,
        text: wrappedText,
        fill: itemLabelModel?.get('color') || seriesLabelModel.get('color') || '#101828',
        fontSize,
        fontWeight: itemLabelModel?.get('fontWeight') || seriesLabelModel.get('fontWeight') || 650,
        lineHeight,
        align: 'center',
        verticalAlign: 'middle'
      },
      silent: true
    });
    applyFadeEnterAnimation(textEl, readEnterAnimation(seriesModel, node.dataIndex));
    addHoverElement(hoverItemsByDataIndex.get(node.dataIndex), textEl);
    group.add(textEl);
  });
}

function readNodeStyle(
  data: SeriesData,
  seriesModel: CirclePackingSeriesModel,
  itemModel: EChartsModel | null,
  node: CirclePackingNode,
  index: number
): Record<string, unknown> {
  const seriesStyle = asRecord(seriesModel.get('itemStyle'));
  const rawStyle = readRawItemStyle(node.raw);
  const itemStyle = itemModel ? asRecord(itemModel.get('itemStyle')) : rawStyle;
  const visualStyle = node.dataIndex >= 0 && node.dataIndex < data.count()
    ? asRecord(data.getItemVisual(node.dataIndex, 'style'))
    : {};

  return {
    fill: itemStyle.color || rawStyle.color || seriesStyle.color || visualStyle.fill || node.color || DEFAULT_CIRCLE_PACKING_COLORS[index % DEFAULT_CIRCLE_PACKING_COLORS.length],
    stroke: itemStyle.borderColor || rawStyle.borderColor || seriesStyle.borderColor || '#ffffff',
    lineWidth: finiteNumber(itemStyle.borderWidth ?? rawStyle.borderWidth ?? seriesStyle.borderWidth, 1.2),
    opacity: finiteNumber(itemStyle.opacity ?? rawStyle.opacity ?? seriesStyle.opacity, 0.88)
  };
}

function formatLabel(formatter: unknown, node: CirclePackingNode): unknown {
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

function wrapText(text: string, maxWidth: number, fontSize: number, radius: number): string {
  const maxChars = Math.max(3, Math.floor(maxWidth / Math.max(fontSize * 0.56, 1)));
  const maxLines = radius > fontSize * 3.2 ? 2 : 1;
  if (text.length <= maxChars) return text;

  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  if (words.length > 1) {
    let current = '';
    words.forEach((word) => {
      const next = current ? `${current} ${word}` : word;
      if (next.length <= maxChars) {
        current = next;
      } else {
        if (current) lines.push(current);
        current = word;
      }
    });
    lines.push(current);
  } else {
    for (let index = 0; index < text.length; index += maxChars) {
      lines.push(text.slice(index, index + maxChars));
    }
  }

  const visible = lines.slice(0, maxLines);
  const usedText = visible.join('').replace(/\s+/g, '');
  const originalText = text.replace(/\s+/g, '');
  if (usedText.length < originalText.length && visible.length) {
    const last = visible[visible.length - 1];
    visible[visible.length - 1] = `${last.slice(0, Math.max(0, maxChars - 3))}...`;
  }

  return visible.join('\n');
}

function resolveLabelPosition(
  node: CirclePackingNode,
  text: string,
  fontSize: number,
  lineHeight: number
): LabelPosition {
  const children = node.children ?? [];
  if (!children.length) {
    return {
      x: node.x,
      y: node.y
    };
  }

  const size = measureLabelText(text, fontSize, lineHeight);
  const candidates = createParentLabelCandidates(node, size);
  let best = candidates[0];
  let bestScore = Infinity;

  candidates.forEach((candidate) => {
    const box = createCenteredLabelBox(candidate, size);
    const score = scoreParentLabelCandidate(node, box);
    if (score < bestScore) {
      best = candidate;
      bestScore = score;
    }
  });

  return best;
}

function measureLabelText(text: string, fontSize: number, lineHeight: number): { width: number; height: number } {
  const lines = text.split('\n');
  return {
    width: Math.max(...lines.map((line) => line.length), 1) * fontSize * 0.56,
    height: lines.length * lineHeight
  };
}

function createParentLabelCandidates(
  node: CirclePackingNode,
  size: { width: number; height: number }
): LabelPosition[] {
  const gap = Math.max(4, Math.min(12, node.r * 0.08));
  const childBounds = getChildCircleBounds(node.children);
  const radialFactors = [0.86, 0.72, 0.58, 0.44, 0.3];
  const angles = [
    -Math.PI / 2,
    -Math.PI * 0.72,
    -Math.PI * 0.28,
    Math.PI / 2,
    Math.PI,
    0,
    -Math.PI * 0.86,
    -Math.PI * 0.14,
    Math.PI * 0.14,
    Math.PI * 0.86
  ];
  const candidates: LabelPosition[] = [
    {
      x: node.x,
      y: childBounds.minY - size.height / 2 - gap
    },
    {
      x: node.x,
      y: childBounds.maxY + size.height / 2 + gap
    },
    {
      x: childBounds.minX - size.width / 2 - gap,
      y: node.y
    },
    {
      x: childBounds.maxX + size.width / 2 + gap,
      y: node.y
    }
  ];
  radialFactors.forEach((factor) => {
    angles.forEach((angle) => {
      candidates.push({
        x: node.x + Math.cos(angle) * node.r * factor,
        y: node.y + Math.sin(angle) * node.r * factor
      });
    });
  });
  candidates.push({
    x: node.x,
    y: node.y - node.r - size.height / 2 - gap
  });
  candidates.push({
    x: node.x,
    y: node.y
  });
  return dedupeLabelCandidates(candidates);
}

function getChildCircleBounds(children: CirclePackingNode[]): { minX: number; maxX: number; minY: number; maxY: number } {
  return children.reduce((bounds, child) => ({
    minX: Math.min(bounds.minX, child.x - child.r),
    maxX: Math.max(bounds.maxX, child.x + child.r),
    minY: Math.min(bounds.minY, child.y - child.r),
    maxY: Math.max(bounds.maxY, child.y + child.r)
  }), {
    minX: Infinity,
    maxX: -Infinity,
    minY: Infinity,
    maxY: -Infinity
  });
}

function dedupeLabelCandidates(candidates: LabelPosition[]): LabelPosition[] {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = `${candidate.x.toFixed(3)},${candidate.y.toFixed(3)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function createCenteredLabelBox(position: LabelPosition, size: { width: number; height: number }): LabelBox {
  return {
    x: position.x - size.width / 2,
    y: position.y - size.height / 2,
    width: size.width,
    height: size.height
  };
}

function scoreParentLabelCandidate(node: CirclePackingNode, box: LabelBox): number {
  const distances = node.children.map((child) => distanceFromBoxToCircle(box, child));
  const overlapPenalty = distances.reduce((sum, distance, index) => (
    sum + (distance < 0 ? 100000 + Math.abs(distance) * 1000 + node.children[index].r : 0)
  ), 0);
  const clearance = Math.min(...distances);
  const parentOverflow = labelBoxOverflowFromCircle(box, node);
  const centerDistance = Math.hypot(box.x + box.width / 2 - node.x, box.y + box.height / 2 - node.y);
  return overlapPenalty + parentOverflow * 50 - clearance + centerDistance * 0.01;
}

function distanceFromBoxToCircle(box: LabelBox, circle: CirclePackingNode): number {
  const closestX = Math.max(box.x, Math.min(circle.x, box.x + box.width));
  const closestY = Math.max(box.y, Math.min(circle.y, box.y + box.height));
  return Math.hypot(closestX - circle.x, closestY - circle.y) - circle.r;
}

function labelBoxOverflowFromCircle(box: LabelBox, circle: CirclePackingNode): number {
  const points = [
    [box.x, box.y],
    [box.x + box.width / 2, box.y],
    [box.x + box.width, box.y],
    [box.x, box.y + box.height / 2],
    [box.x + box.width, box.y + box.height / 2],
    [box.x, box.y + box.height],
    [box.x + box.width / 2, box.y + box.height],
    [box.x + box.width, box.y + box.height]
  ];
  return points.reduce((overflow, [x, y]) => (
    Math.max(overflow, Math.hypot(x - circle.x, y - circle.y) - circle.r)
  ), 0);
}

function createLegendVisualProvider(seriesModel: CirclePackingSeriesModel) {
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
        fill: itemStyle.color || DEFAULT_CIRCLE_PACKING_COLORS[dataIndex % DEFAULT_CIRCLE_PACKING_COLORS.length],
        stroke: itemStyle.borderColor || '#ffffff',
        opacity: finiteNumber(itemStyle.opacity, 0.88)
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
  seriesModel: CirclePackingSeriesModel,
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
    duration: resolveAnimationNumber(option.duration ?? seriesModel.get('animationDuration'), itemIndex, itemIndex, 580),
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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function asRecord(value: unknown): Record<string, unknown> {
  return isPlainObject(value) ? value : {};
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

function includeDescendantsInHoverItems(
  nodes: CirclePackingNode[],
  hoverItemsByNodeId: Map<string, ElementHoverItem>
): void {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  nodes.forEach((node) => {
    const hoverItem = hoverItemsByNodeId.get(node.id);
    if (!hoverItem) return;

    let parentId = node.parentId;
    while (parentId) {
      const parentHoverItem = hoverItemsByNodeId.get(parentId);
      if (parentHoverItem) addHoverElements(parentHoverItem, hoverItem.elements);
      parentId = nodesById.get(parentId)?.parentId ?? null;
    }
  });
}

function addHoverElements(item: ElementHoverItem, elements: GraphicElement[]): void {
  elements.forEach((element) => {
    if (!item.elements.includes(element)) item.elements.push(element);
  });
}

export const __test__ = {
  readInitialDataOptions,
  readLayoutOption,
  drawCirclePacking,
  drawLabels,
  readNodeStyle,
  formatLabel,
  wrapText,
  createLegendVisualProvider,
  collectDataNames,
  readRawItemStyle,
  readEnterAnimation,
  disabledEnterAnimation,
  resolveAnimationNumber,
  resolveAnimationEasing,
  applyCircleEnterAnimation,
  applyFadeEnterAnimation,
  animateGraphicProperty,
  finiteNumber,
  isPlainObject,
  asRecord,
  createHoverItem,
  addHoverElement,
  includeDescendantsInHoverItems,
  addHoverElements
};
