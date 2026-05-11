import * as echarts from 'echarts/lib/echarts';
import { clearAliveRender, installElementHover, renderAlive, setAliveRenderKey } from '@echarts-extension/layout-core';
import type { AliveRenderState, ElementHoverController, ElementHoverItem, ElementHoverOptions } from '@echarts-extension/layout-core';

import {
  flattenOrganizationChartData,
  resolveOrganizationChartLayout
} from './layout.js';
import type {
  OrganizationChartLayoutOption,
  OrganizationChartLayoutResult,
  OrganizationChartLink,
  OrganizationChartNode,
  OrganizationChartPoint
} from './layout.js';

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
  getItemLayout(dataIndex: number): unknown;
  setItemLayout(dataIndex: number, layout: [number, number]): void;
  setItemGraphicEl(dataIndex: number, element: GraphicElement): void;
}

interface OrganizationChartSeriesModel extends EChartsModel {
  option?: OrganizationChartLayoutOption;
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
  List: new (dimensions: unknown, host: OrganizationChartSeriesModel) => SeriesData;
  graphic: {
    Group: new () => GraphicGroup;
    Line: new (options: GraphicElementOptions) => GraphicElement;
    Polyline?: new (options: GraphicElementOptions) => GraphicElement;
    Rect: new (options: GraphicElementOptions) => GraphicElement;
    Text: new (options: GraphicElementOptions) => GraphicElement;
  };
}

interface OrganizationChartView {
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
const DEFAULT_COLORS = ['#dbeafe', '#dcfce7', '#ffedd5', '#fce7f3', '#ede9fe', '#cffafe', '#fef9c3'];
const optionKeys = [
  'padding',
  'nodeWidth',
  'nodeHeight',
  'levelGap',
  'siblingGap',
  'subtreeGap',
  'orient',
  'idField',
  'parentIdField',
  'nameField',
  'childrenField',
  'nodes',
  'links'
] as const satisfies ReadonlyArray<Extract<keyof OrganizationChartLayoutOption, string>>;
const layerZ = {
  link: 2,
  node: 6,
  label: 7
} as const;

echartsHost.extendSeriesModel({
  type: 'series.organizationChart',

  visualStyleAccessPath: 'itemStyle',
  visualDrawType: 'fill',

  getInitialData(this: OrganizationChartSeriesModel, option: OrganizationChartLayoutOption) {
    const source = flattenOrganizationChartData(option);
    const dimensions = echartsHost.helper.createDimensions(source, {
      coordDimensions: ['value']
    });
    const list = new echartsHost.List(dimensions, this);
    list.initData(source);
    this.legendVisualProvider = createLegendVisualProvider(this);
    return list;
  },

  getTooltipPosition(this: OrganizationChartSeriesModel, dataIndex: number) {
    const layout = this.getData().getItemLayout(dataIndex);
    return Array.isArray(layout) ? layout : undefined;
  },

  defaultOption: {
    left: 'center',
    top: 'center',
    width: '94%',
    height: '86%',
    padding: 24,
    nodeWidth: 132,
    nodeHeight: 48,
    levelGap: 78,
    siblingGap: 24,
    subtreeGap: 36,
    orient: 'TB',
    idField: 'id',
    parentIdField: 'parentId',
    nameField: 'name',
    childrenField: 'children',
    enterAnimation: true,
    itemStyle: {
      color: '#dbeafe',
      borderColor: '#2563eb',
      borderWidth: 1.2,
      borderRadius: 6,
      opacity: 0.96
    },
    lineStyle: {
      color: '#64748b',
      width: 1.4,
      opacity: 0.9,
      type: 'solid'
    },
    label: {
      show: true,
      color: '#0f172a',
      fontSize: 12,
      fontWeight: 700,
      formatter: '{b}'
    },
    tooltip: {
      trigger: 'item'
    },
    emphasis: {
      itemStyle: {
        shadowBlur: 10,
        shadowColor: 'rgba(37, 99, 235, 0.22)',
        borderWidth: 2
      }
    }
  }
});

echartsHost.extendChartView({
  type: 'organizationChart',

  render(this: OrganizationChartView, seriesModel: OrganizationChartSeriesModel, ecModel: unknown, api: EChartsApi) {
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
      const layout = resolveOrganizationChartLayout(readLayoutOption(seriesModel, rect));
      if (this.__renderToken !== renderToken) return;
      const { hoverItems } = renderAlive(this, echartsHost, group, seriesModel, (targetGroup, targetSeriesModel) => (
        drawOrganizationChart(echartsHost, targetGroup, targetSeriesModel, layout, rect)
      ));
      this.__hoverController = installElementHover(hoverItems, {
        zrender: api.getZr?.()
      });
    } catch (error) {
      console.error('[organizationChart] render failed', error);
    }
  },

  remove(this: OrganizationChartView) {
    this.__renderToken = null;
    this.__hoverController?.dispose();
    this.__hoverController = undefined;
    clearAliveRender(this);
    this.group.removeAll();
  },

  dispose(this: OrganizationChartView) {
    this.__renderToken = null;
    this.__hoverController?.dispose();
    this.__hoverController = undefined;
    clearAliveRender(this);
    this.group.removeAll();
  }
});

function readLayoutOption(seriesModel: OrganizationChartSeriesModel, rect: ViewRect): OrganizationChartLayoutOption {
  const option = seriesModel.option || {};
  const layoutOption: OrganizationChartLayoutOption = {
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

function drawOrganizationChart(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: OrganizationChartSeriesModel,
  layout: OrganizationChartLayoutResult,
  rect: ViewRect
): ElementHoverItem[] {
  const chartGroup = new echartsInstance.graphic.Group();
  chartGroup.x = rect.x;
  chartGroup.y = rect.y;

  drawLinks(echartsInstance, chartGroup, seriesModel, layout.links);
  const hoverItems = drawNodes(echartsInstance, chartGroup, seriesModel, layout.nodes);
  group.add(chartGroup);
  return hoverItems;
}

function drawLinks(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: OrganizationChartSeriesModel,
  links: OrganizationChartLink[]
): void {
  const style = readLineStyle(seriesModel.getModel('lineStyle'), {
    stroke: '#64748b',
    lineWidth: 1.4,
    opacity: 0.9
  });

  links.forEach((link) => {
    const element = createLinkElement(echartsInstance, link.points, style);
    setAliveRenderKey(element, `organization-chart-link:${link.id}`);
    group.add(element);
  });
}

function createLinkElement(
  echartsInstance: EChartsHost,
  points: OrganizationChartPoint[],
  style: Record<string, unknown>
): GraphicElement {
  if (echartsInstance.graphic.Polyline) {
    return new echartsInstance.graphic.Polyline({
      shape: {
        points: points.map((point) => [point.x, point.y])
      },
      style,
      silent: true,
      z2: layerZ.link
    });
  }

  const [first, second] = points;
  return new echartsInstance.graphic.Line({
    shape: {
      x1: first?.x ?? 0,
      y1: first?.y ?? 0,
      x2: second?.x ?? first?.x ?? 0,
      y2: second?.y ?? first?.y ?? 0
    },
    style,
    silent: true,
    z2: layerZ.link
  });
}

function drawNodes(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: OrganizationChartSeriesModel,
  nodes: OrganizationChartNode[]
): ElementHoverItem[] {
  const data = seriesModel.getData();
  const hoverItems: ElementHoverItem[] = [];
  const hoverItemsByDataIndex = new Map<number, ElementHoverItem>();

  nodes.forEach((node, index) => {
    if (node.width <= 0 || node.height <= 0) return;
    const itemModel = node.dataIndex >= 0 && node.dataIndex < data.count() ? data.getItemModel(node.dataIndex) : null;
    const rect = new echartsInstance.graphic.Rect({
      shape: {
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
        r: readBorderRadius(itemModel, seriesModel)
      },
      style: readNodeStyle(data, seriesModel, itemModel, node, index),
      z2: layerZ.node
    });
    setAliveRenderKey(rect, `organization-chart-node:${node.id}`);
    applyRectEnterAnimation(rect, node, readEnterAnimation(seriesModel, index));

    if (node.dataIndex >= 0 && node.dataIndex < data.count()) {
      data.setItemLayout(node.dataIndex, [node.x + node.width / 2, node.y + node.height / 2]);
      data.setItemGraphicEl(node.dataIndex, rect);
      const hoverItem = createHoverItem(rect);
      hoverItems.push(hoverItem);
      hoverItemsByDataIndex.set(node.dataIndex, hoverItem);
    }

    group.add(rect);
  });

  drawLabels(echartsInstance, group, seriesModel, data, nodes, hoverItemsByDataIndex);
  return hoverItems;
}

function drawLabels(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: OrganizationChartSeriesModel,
  data: SeriesData,
  nodes: OrganizationChartNode[],
  hoverItemsByDataIndex: Map<number, ElementHoverItem>
): void {
  const seriesLabelModel = seriesModel.getModel('label');
  if (seriesLabelModel.get('show') === false) return;

  nodes.forEach((node) => {
    const itemModel = node.dataIndex >= 0 && node.dataIndex < data.count() ? data.getItemModel(node.dataIndex) : null;
    const itemLabelModel = itemModel?.getModel('label');
    const show = itemLabelModel?.get('show') ?? seriesLabelModel.get('show');
    if (show === false) return;

    const baseFontSize = finiteNumber(itemLabelModel?.get('fontSize') ?? seriesLabelModel.get('fontSize'), 12);
    const fontSize = Math.min(baseFontSize, Math.max(8, Math.min(node.height * 0.34, node.width * 0.16)));
    const text = formatLabel(itemLabelModel?.get('formatter') || seriesLabelModel.get('formatter'), node);
    const maxChars = Math.max(3, Math.floor(Math.max(node.width - 14, 1) / Math.max(fontSize * 0.56, 1)));
    const label = new echartsInstance.graphic.Text({
      style: {
        x: node.x + node.width / 2,
        y: node.y + node.height / 2,
        text: ellipsize(String(text), maxChars),
        fill: itemLabelModel?.get('color') || seriesLabelModel.get('color') || '#0f172a',
        fontSize,
        fontWeight: itemLabelModel?.get('fontWeight') || seriesLabelModel.get('fontWeight') || 700,
        align: 'center',
        verticalAlign: 'middle'
      },
      silent: true,
      z2: layerZ.label
    });
    setAliveRenderKey(label, `organization-chart-label:${node.id}`);
    applyFadeEnterAnimation(label, readEnterAnimation(seriesModel, node.dataIndex));
    addHoverElement(hoverItemsByDataIndex.get(node.dataIndex), label);
    group.add(label);
  });
}

function readNodeStyle(
  data: SeriesData,
  seriesModel: OrganizationChartSeriesModel,
  itemModel: EChartsModel | null,
  node: OrganizationChartNode,
  index: number
): Record<string, unknown> {
  const seriesStyle = asRecord(seriesModel.get('itemStyle'));
  const rawStyle = readRawItemStyle(node.raw);
  const itemStyle = itemModel ? asRecord(itemModel.get('itemStyle')) : rawStyle;
  const visualStyle = node.dataIndex >= 0 && node.dataIndex < data.count()
    ? asRecord(data.getItemVisual(node.dataIndex, 'style'))
    : {};

  return {
    fill: itemStyle.color || rawStyle.color || seriesStyle.color || visualStyle.fill || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
    stroke: itemStyle.borderColor || rawStyle.borderColor || seriesStyle.borderColor || '#2563eb',
    lineWidth: finiteNumber(itemStyle.borderWidth ?? rawStyle.borderWidth ?? seriesStyle.borderWidth, 1.2),
    opacity: finiteNumber(itemStyle.opacity ?? rawStyle.opacity ?? seriesStyle.opacity, 0.96),
    shadowBlur: finiteNumber(itemStyle.shadowBlur ?? rawStyle.shadowBlur ?? seriesStyle.shadowBlur, 0),
    shadowColor: itemStyle.shadowColor || rawStyle.shadowColor || seriesStyle.shadowColor
  };
}

function readRawItemStyle(raw: unknown): Record<string, unknown> {
  const record = asRecord(raw);
  return asRecord(record.itemStyle);
}

function readBorderRadius(itemModel: EChartsModel | null, seriesModel: OrganizationChartSeriesModel): number {
  const itemStyle = itemModel ? asRecord(itemModel.get('itemStyle')) : {};
  const seriesStyle = asRecord(seriesModel.get('itemStyle'));
  return Math.max(0, finiteNumber(itemStyle.borderRadius ?? seriesStyle.borderRadius, 6));
}

function readLineStyle(model: EChartsModel, fallback: Record<string, unknown>): Record<string, unknown> {
  const width = finiteNumber(model.get('width') ?? model.get('lineWidth'), fallback.lineWidth as number);
  const type = model.get('type');
  return {
    stroke: model.get('color') || model.get('stroke') || fallback.stroke,
    lineWidth: width,
    opacity: finiteNumber(model.get('opacity'), fallback.opacity as number),
    lineDash: normalizeLineDash(type, width),
    lineDashOffset: finiteNumber(model.get('dashOffset') ?? model.get('lineDashOffset'), 0)
  };
}

function normalizeLineDash(type: unknown, width: number): number[] | undefined {
  if (Array.isArray(type)) {
    const dash = type.map((value) => finiteNumber(value, NaN)).filter(Number.isFinite);
    return dash.length ? dash : undefined;
  }
  if (type === 'dashed') return [Math.max(4, width * 4), Math.max(3, width * 3)];
  if (type === 'dotted') return [Math.max(1, width), Math.max(3, width * 3)];
  return undefined;
}

function formatLabel(formatter: unknown, node: OrganizationChartNode): unknown {
  const params = {
    data: node.raw,
    name: node.name,
    id: node.id,
    depth: node.depth,
    childrenCount: node.childIds.length,
    node
  };

  if (typeof formatter === 'function') {
    return (formatter as (input: typeof params) => unknown)(params);
  }
  if (typeof formatter === 'string') {
    return formatter
      .replace(/\{b\}/g, node.name)
      .replace(/\{id\}/g, node.id)
      .replace(/\{depth\}/g, String(node.depth))
      .replace(/\{c\}/g, String(node.childIds.length));
  }
  return node.name;
}

function createLegendVisualProvider(seriesModel: OrganizationChartSeriesModel) {
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
        fill: itemStyle.color || DEFAULT_COLORS[dataIndex % DEFAULT_COLORS.length],
        stroke: itemStyle.borderColor || '#2563eb',
        opacity: finiteNumber(itemStyle.opacity, 0.96)
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
  seriesModel: OrganizationChartSeriesModel,
  itemIndex: number,
  animationOption = seriesModel.get('enterAnimation')
): EnterAnimationConfig {
  if (seriesModel.get('animation') === false || animationOption === false) return disabledEnterAnimation();

  const option = animationOption == null || animationOption === true ? {} : asRecord(animationOption);
  if (option.show === false || option.enabled === false) return disabledEnterAnimation();

  const baseDelay = resolveAnimationNumber(option.delay ?? seriesModel.get('animationDelay'), itemIndex, itemIndex, 0);
  const stagger = resolveAnimationNumber(option.stagger, itemIndex, itemIndex, 12);
  return {
    enabled: true,
    duration: resolveAnimationNumber(option.duration ?? seriesModel.get('animationDuration'), itemIndex, itemIndex, 480),
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

function applyRectEnterAnimation(element: GraphicElement, node: OrganizationChartNode, animation: EnterAnimationConfig): void {
  if (!animation.enabled) return;
  const animatable = element as AnimatableGraphicElement;
  if (typeof animatable.animate !== 'function') return;

  const shape = animatable.shape || {};
  const style = animatable.style || {};
  const opacity = finiteNumber(style.opacity, 1);
  shape.height = 0;
  shape.y = node.y + node.height / 2;
  style.opacity = 0;
  animatable.shape = shape;
  animatable.style = style;
  animateGraphicProperty(animatable, 'shape', animation, {
    y: node.y,
    height: node.height
  });
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

function ellipsize(value: string, maxChars: number): string {
  if (value.length <= maxChars) return value;
  return `${value.slice(0, Math.max(1, maxChars - 1))}...`;
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

export const __test__ = {
  readLayoutOption,
  drawOrganizationChart,
  drawNodes,
  createLinkElement,
  readNodeStyle,
  readLineStyle,
  formatLabel,
  normalizeLineDash
};
