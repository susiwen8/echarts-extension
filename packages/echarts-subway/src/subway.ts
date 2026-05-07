import * as echarts from 'echarts/lib/echarts';
import { clearAliveRender, installElementHover, renderAlive } from '@echarts-extension/layout-core';
import type { AliveRenderState, ElementHoverController, ElementHoverItem, ElementHoverOptions } from '@echarts-extension/layout-core';

import {
  collectSubwayStationData,
  DEFAULT_SUBWAY_COLORS,
  resolveSubwayLayout
} from './layout.js';
import type { SubwayLayoutOption, SubwayLayoutResult, SubwayRouteLayout, SubwayStationLayout } from './layout.js';
import { createRoundedRoutePath } from './route-path.js';
import { resolveSharedSegmentOffsets, routeSegmentOffsetKey } from './route-segments.js';
import type { RouteSegmentOffset } from './route-segments.js';

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

interface SubwaySeriesModel extends EChartsModel {
  option?: SubwayLayoutOption;
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
}

interface EChartsHost {
  extendSeriesModel(option: Record<string, unknown>): void;
  extendChartView(option: Record<string, unknown>): void;
  helper: {
    createDimensions(source: unknown[], options: Record<string, unknown>): unknown;
    getLayoutRect(params: unknown, container: { width: number; height: number }): ViewRect;
  };
  List: new (dimensions: unknown, host: SubwaySeriesModel) => SeriesData;
  graphic: {
    Group: new () => GraphicGroup;
    Circle: new (options: GraphicElementOptions) => GraphicElement;
    Line: new (options: GraphicElementOptions) => GraphicElement;
    Polyline?: new (options: GraphicElementOptions) => GraphicElement;
    Text: new (options: GraphicElementOptions) => GraphicElement;
    makePath?: (path: string, options: { style: Record<string, unknown> }) => GraphicElement;
  };
}

interface SubwayChartView {
  group: GraphicGroup;
  __renderToken?: object | null;
  __hoverController?: ElementHoverController;
  __aliveRenderState?: AliveRenderState;
}



interface LabelPoint {
  x: number;
  y: number;
  align: string;
  verticalAlign: string;
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
  'stationRadius',
  'interchangeRadius',
  'lineWidth',
  'cornerRadius',
  'preserveAspectRatio',
  'colors'
] as const satisfies ReadonlyArray<Extract<keyof SubwayLayoutOption, string>>;

echartsHost.extendSeriesModel({
  type: 'series.subway',

  visualDrawType: 'fill',

  getInitialData(this: SubwaySeriesModel, option: SubwayLayoutOption) {
    const routes = readRoutes(option);
    const source = collectSubwayStationData(routes);
    const dimensions = echartsHost.helper.createDimensions(source, {
      coordDimensions: ['value']
    });
    const list = new echartsHost.List(dimensions, this);
    list.initData(source);
    return list;
  },

  defaultOption: {
    left: 'center',
    top: 'center',
    width: '92%',
    height: '86%',
    padding: 24,
    stationRadius: 4,
    interchangeRadius: 8,
    lineWidth: 8,
    cornerRadius: null,
    preserveAspectRatio: true,
    colors: DEFAULT_SUBWAY_COLORS,
    enterAnimation: true,
    lineStyle: {
      opacity: 1,
      cap: 'round',
      join: 'round'
    },
    stationStyle: {
      color: '#ffffff',
      borderColor: null,
      borderWidth: 2
    },
    interchangeStyle: {
      color: '#ffffff',
      borderColor: '#111827',
      borderWidth: 3
    },
    label: {
      show: true,
      color: '#111827',
      fontSize: 11,
      fontWeight: 600,
      formatter: null
    },
    routeLabel: {
      show: false,
      position: 'end',
      color: null,
      fontSize: 12,
      fontWeight: 700,
      formatter: null
    },
    emphasis: {
      itemStyle: {
        shadowBlur: 8,
        shadowColor: 'rgba(17, 24, 39, 0.22)'
      }
    }
  }
});

echartsHost.extendChartView({
  type: 'subway',

  render(this: SubwayChartView, seriesModel: SubwaySeriesModel, ecModel: unknown, api: EChartsApi) {
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
      const layout = resolveSubwayLayout(readLayoutOption(seriesModel, rect));
      if (this.__renderToken !== renderToken) return;
      const { hoverItems } = renderAlive(this, echartsHost, group, seriesModel, (targetGroup, targetSeriesModel) => (
        drawSubway(echartsHost, targetGroup, targetSeriesModel, layout, rect)
      ));
      this.__hoverController = installElementHover(hoverItems, {
        zrender: api.getZr?.()
      });
    } catch (error) {
      if (typeof console !== 'undefined') {
        console.error('[subway] render failed', error);
      }
    }
  },

  remove(this: SubwayChartView) {
    this.__renderToken = null;
    this.__hoverController?.dispose();
    this.__hoverController = undefined;
    clearAliveRender(this);
    this.group.removeAll();
  },

  dispose(this: SubwayChartView) {
    this.__renderToken = null;
    this.__hoverController?.dispose();
    this.__hoverController = undefined;
    clearAliveRender(this);
    this.group.removeAll();
  }
});

function readLayoutOption(seriesModel: SubwaySeriesModel, rect: ViewRect): SubwayLayoutOption {
  const option = seriesModel.option || {};
  const layoutOption: SubwayLayoutOption = {
    data: readRoutes(option),
    width: rect.width,
    height: rect.height
  };

  optionKeys.forEach((key) => {
    const value = seriesModel.get(key);
    if (value !== undefined && value !== null) layoutOption[key as string] = value;
  });

  return layoutOption;
}

function readRoutes(option: SubwayLayoutOption): unknown[] {
  return Array.isArray(option.routes) ? option.routes : Array.isArray(option.data) ? option.data : [];
}

function drawSubway(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: SubwaySeriesModel,
  layout: SubwayLayoutResult,
  rect: ViewRect
): ElementHoverItem[] {
  const chartGroup = new echartsInstance.graphic.Group();
  const routeElementsById = new Map<string, GraphicElement[]>();
  const stationElementsById = new Map<string, GraphicElement[]>();
  chartGroup.x = rect.x;
  chartGroup.y = rect.y;

  const routeGroup = new echartsInstance.graphic.Group();
  const segmentOffsets = resolveSharedSegmentOffsets(layout.routes);
  layout.routes.forEach((route, routeIndex) => {
    const routeElements = drawRoute(echartsInstance, routeGroup, seriesModel, route, routeIndex, segmentOffsets);
    if (routeElements.length) routeElementsById.set(route.id, routeElements);
  });
  chartGroup.add(routeGroup);

  const stationGroup = new echartsInstance.graphic.Group();
  layout.stations.forEach((station, stationIndex) => {
    const stationElements = drawStation(echartsInstance, stationGroup, seriesModel, layout, station, stationIndex);
    if (stationElements.length) stationElementsById.set(station.id, stationElements);
  });
  chartGroup.add(stationGroup);

  drawRouteLabels(echartsInstance, chartGroup, seriesModel, layout.routes, routeElementsById);
  drawStationLabels(echartsInstance, chartGroup, seriesModel, layout.stations, stationElementsById);

  group.add(chartGroup);
  if (seriesModel.get('silent') === true) return [];
  return createSubwayHoverItems(layout, routeElementsById, stationElementsById);
}

function drawRoute(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: SubwaySeriesModel,
  route: SubwayRouteLayout,
  routeIndex: number,
  segmentOffsets: Map<string, RouteSegmentOffset>
): GraphicElement[] {
  if (route.points.length < 2) return [];
  const elements: GraphicElement[] = [];
  const style = readRouteStyle(seriesModel, route);
  const cornerRadius = readRouteCornerRadius(seriesModel, route, style);
  const hasSharedSegments = route.points.some((point, index) => index > 0 && segmentOffsets.has(routeSegmentOffsetKey(route.id, index - 1)));

  if (!hasSharedSegments) {
    return drawRoutePath(echartsInstance, group, route.points, style, cornerRadius, readEnterAnimation(seriesModel, routeIndex));
  }

  let normalFragment: SubwayRouteLayout['points'] = [];

  for (let segmentIndex = 0; segmentIndex < route.points.length - 1; segmentIndex += 1) {
    const previous = route.points[segmentIndex];
    const current = route.points[segmentIndex + 1];
    const segmentOffset = segmentOffsets.get(routeSegmentOffsetKey(route.id, segmentIndex));

    if (segmentOffset) {
      elements.push(...drawRoutePath(echartsInstance, group, normalFragment, style, cornerRadius, readEnterAnimation(seriesModel, routeIndex)));
      normalFragment = [];
      elements.push(...drawRoutePath(echartsInstance, group, [
        offsetRoutePoint(previous, segmentOffset),
        offsetRoutePoint(current, segmentOffset)
      ], style, 0, readEnterAnimation(seriesModel, routeIndex)));
      continue;
    }

    if (!normalFragment.length) normalFragment.push(previous);
    normalFragment.push(current);
  }

  elements.push(...drawRoutePath(echartsInstance, group, normalFragment, style, cornerRadius, readEnterAnimation(seriesModel, routeIndex)));
  return elements;
}

function drawRoutePath(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  points: SubwayRouteLayout['points'],
  style: Record<string, unknown>,
  cornerRadius: number,
  animation: EnterAnimationConfig
): GraphicElement[] {
  if (points.length < 2) return [];
  const path = createRoundedRoutePath(points, cornerRadius);

  if (path && echartsInstance.graphic.makePath) {
    const pathElement = echartsInstance.graphic.makePath(path, {
      style
    });
    pathElement.silent = true;
    applyPathEnterAnimation(pathElement, 'style', 'strokePercent', animation);
    group.add(pathElement);
    return [pathElement];
  }

  if (echartsInstance.graphic.Polyline) {
    const polyline = new echartsInstance.graphic.Polyline({
      shape: {
        points: points.map((point) => [point.x, point.y])
      },
      style,
      silent: true
    });
    applyPathEnterAnimation(polyline, 'shape', 'percent', animation);
    group.add(polyline);
    return [polyline];
  }

  const elements: GraphicElement[] = [];
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const line = new echartsInstance.graphic.Line({
      shape: {
        x1: previous.x,
        y1: previous.y,
        x2: current.x,
        y2: current.y
      },
      style,
      silent: true
    });
    applyPathEnterAnimation(line, 'shape', 'percent', animation);
    group.add(line);
    elements.push(line);
  }
  return elements;
}

function offsetRoutePoint(point: SubwayRouteLayout['points'][number], offset: RouteSegmentOffset): SubwayRouteLayout['points'][number] {
  return {
    ...point,
    x: point.x + offset.offsetX,
    y: point.y + offset.offsetY
  };
}

function drawStation(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: SubwaySeriesModel,
  layout: SubwayLayoutResult,
  station: SubwayStationLayout,
  stationIndex: number
): GraphicElement[] {
  const data = seriesModel.getData();
  const itemModel = station.dataIndex >= 0 && station.dataIndex < data.count() ? data.getItemModel(station.dataIndex) : null;
  const circle = new echartsInstance.graphic.Circle({
    shape: {
      cx: station.x,
      cy: station.y,
      r: station.radius
    },
    style: readStationStyle(seriesModel, itemModel, data, station, layout),
    silent: seriesModel.get('silent') === true
  });
  applyCircleEnterAnimation(circle, station.radius, readEnterAnimation(seriesModel, layout.routes.length + stationIndex));

  if (itemModel && station.dataIndex >= 0 && station.dataIndex < data.count()) {
    data.setItemLayout(station.dataIndex, [station.x, station.y]);
    data.setItemGraphicEl(station.dataIndex, circle);
  }

  group.add(circle);
  return [circle];
}

function drawStationLabels(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: SubwaySeriesModel,
  stations: SubwayStationLayout[],
  stationElementsById: Map<string, GraphicElement[]>
): void {
  const seriesLabelModel = seriesModel.getModel('label');
  if (!seriesLabelModel.get('show')) return;

  stations.forEach((station) => {
    const labelPoint = getLabelPoint(station.x, station.y, station.labelPosition, station.radius + 7);
    const text = formatStationLabel(seriesLabelModel.get('formatter'), station);

    const labelEl = new echartsInstance.graphic.Text({
      style: {
        x: labelPoint.x,
        y: labelPoint.y,
        text,
        fill: seriesLabelModel.get('color') || '#111827',
        fontSize: seriesLabelModel.get('fontSize') || 11,
        fontWeight: seriesLabelModel.get('fontWeight') || 600,
        align: labelPoint.align,
        verticalAlign: labelPoint.verticalAlign
      },
      silent: true
    });
    applyFadeEnterAnimation(labelEl, readEnterAnimation(seriesModel, station.dataIndex));
    addMappedElements(stationElementsById, station.id, [labelEl]);
    group.add(labelEl);
  });
}

function drawRouteLabels(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: SubwaySeriesModel,
  routes: SubwayRouteLayout[],
  routeElementsById: Map<string, GraphicElement[]>
): void {
  const routeLabelModel = seriesModel.getModel('routeLabel');
  if (!routeLabelModel.get('show')) return;

  routes.forEach((route, routeIndex) => {
    if (!route.points.length) return;
    const position = routeLabelModel.get('position') === 'start' ? 'start' : 'end';
    const anchor = position === 'start' ? route.points[0] : route.points[route.points.length - 1];
    const previous = position === 'start' ? route.points[1] || anchor : route.points[route.points.length - 2] || anchor;
    const directionX = anchor.x - previous.x;
    const directionY = anchor.y - previous.y;
    const horizontal = Math.abs(directionX) >= Math.abs(directionY);
    const offset = route.lineWidth + 8;
    const labelPoint: LabelPoint = horizontal
      ? {
          x: anchor.x + (directionX >= 0 ? offset : -offset),
          y: anchor.y,
          align: directionX >= 0 ? 'left' : 'right',
          verticalAlign: 'middle'
        }
      : {
          x: anchor.x,
          y: anchor.y + (directionY >= 0 ? offset : -offset),
          align: 'center',
          verticalAlign: directionY >= 0 ? 'top' : 'bottom'
        };

    const labelEl = new echartsInstance.graphic.Text({
      style: {
        x: labelPoint.x,
        y: labelPoint.y,
        text: formatRouteLabel(routeLabelModel.get('formatter'), route),
        fill: routeLabelModel.get('color') || route.color,
        fontSize: routeLabelModel.get('fontSize') || 12,
        fontWeight: routeLabelModel.get('fontWeight') || 700,
        align: labelPoint.align,
        verticalAlign: labelPoint.verticalAlign
      },
      silent: true
    });
    applyFadeEnterAnimation(labelEl, readEnterAnimation(seriesModel, routeIndex));
    addMappedElements(routeElementsById, route.id, [labelEl]);
    group.add(labelEl);
  });
}

function readRouteStyle(seriesModel: SubwaySeriesModel, route: SubwayRouteLayout): Record<string, unknown> {
  const seriesStyle = asRecord(seriesModel.get('lineStyle'));
  const routeStyle = asRecord(asRecord(route.raw).lineStyle);

  return {
    stroke: routeStyle.color || route.color,
    lineWidth: finiteNumber(routeStyle.width ?? seriesStyle.width, route.lineWidth),
    opacity: finiteNumber(routeStyle.opacity ?? seriesStyle.opacity, 1),
    lineCap: routeStyle.cap || seriesStyle.cap || 'round',
    lineJoin: routeStyle.join || seriesStyle.join || 'round',
    fill: null
  };
}

function readRouteCornerRadius(
  seriesModel: SubwaySeriesModel,
  route: SubwayRouteLayout,
  routeStyle: Record<string, unknown>
): number {
  const seriesStyle = asRecord(seriesModel.get('lineStyle'));
  const rawRoute = asRecord(route.raw);
  const itemStyle = asRecord(rawRoute.lineStyle);

  return finiteNumber(
    rawRoute.cornerRadius ?? itemStyle.cornerRadius ?? seriesModel.get('cornerRadius') ?? seriesStyle.cornerRadius,
    finiteNumber(routeStyle.lineWidth, route.lineWidth) * 2
  );
}

function readStationStyle(
  seriesModel: SubwaySeriesModel,
  itemModel: EChartsModel | null,
  data: SeriesData,
  station: SubwayStationLayout,
  layout: SubwayLayoutResult
): Record<string, unknown> {
  const normal = asRecord(seriesModel.get(station.interchange ? 'interchangeStyle' : 'stationStyle'));
  const itemStyle = asRecord(asRecord(station.raw).itemStyle);
  const itemModelStyle = itemModel ? asRecord(itemModel.get('itemStyle')) : {};
  const visualStyle = station.dataIndex >= 0 && station.dataIndex < data.count()
    ? asRecord(data.getItemVisual(station.dataIndex, 'style'))
    : {};
  const firstRoute = layout.routes.find((route) => station.lines.includes(route.id));

  return {
    fill: itemStyle.color || itemModelStyle.color || normal.color || visualStyle.fill || '#ffffff',
    stroke: itemStyle.borderColor || itemModelStyle.borderColor || normal.borderColor || firstRoute?.color || '#111827',
    lineWidth: finiteNumber(itemStyle.borderWidth ?? itemModelStyle.borderWidth ?? normal.borderWidth, station.interchange ? 3 : 2),
    opacity: finiteNumber(itemStyle.opacity ?? itemModelStyle.opacity ?? normal.opacity, 1)
  };
}

function getLabelPoint(x: number, y: number, position: string, offset: number): LabelPoint {
  if (position === 'top') return { x, y: y - offset, align: 'center', verticalAlign: 'bottom' };
  if (position === 'bottom') return { x, y: y + offset, align: 'center', verticalAlign: 'top' };
  if (position === 'left') return { x: x - offset, y, align: 'right', verticalAlign: 'middle' };
  return { x: x + offset, y, align: 'left', verticalAlign: 'middle' };
}

function formatStationLabel(formatter: unknown, station: SubwayStationLayout): unknown {
  const params = {
    data: station.raw,
    name: station.name,
    lines: station.lines,
    interchange: station.interchange
  };

  if (typeof formatter === 'function') {
    return (formatter as (input: typeof params) => unknown)(params);
  }
  if (typeof formatter === 'string') {
    return formatter
      .replace(/\{b\}/g, station.name)
      .replace(/\{line\}/g, station.lines.join('/'));
  }
  return station.name;
}

function formatRouteLabel(formatter: unknown, route: SubwayRouteLayout): unknown {
  const params = {
    data: route.raw,
    name: route.name,
    color: route.color
  };

  if (typeof formatter === 'function') {
    return (formatter as (input: typeof params) => unknown)(params);
  }
  if (typeof formatter === 'string') {
    return formatter
      .replace(/\{b\}/g, route.name)
      .replace(/\{color\}/g, route.color);
  }
  return route.name;
}

function createSubwayHoverItems(
  layout: SubwayLayoutResult,
  routeElementsById: Map<string, GraphicElement[]>,
  stationElementsById: Map<string, GraphicElement[]>
): ElementHoverItem[] {
  const hoverItems: ElementHoverItem[] = [];

  layout.routes.forEach((route) => {
    const routeElements = routeElementsById.get(route.id) || [];
    const stationElements = route.stationIds.flatMap((stationId) => stationElementsById.get(stationId) || []);
    const elements = uniqueGraphicElements([...routeElements, ...stationElements]);
    if (routeElements.length && elements.length) {
      hoverItems.push({
        elements,
        triggerElements: uniqueGraphicElements(routeElements)
      });
    }
  });

  layout.stations.forEach((station) => {
    const stationElements = stationElementsById.get(station.id) || [];
    if (!stationElements.length) return;

    const relatedRouteIds = new Set(station.lines);
    const routeElements = station.lines.flatMap((routeId) => routeElementsById.get(routeId) || []);
    const relatedStationElements = layout.stations
      .filter((candidate) => candidate.lines.some((routeId) => relatedRouteIds.has(routeId)))
      .flatMap((candidate) => stationElementsById.get(candidate.id) || []);

    hoverItems.push({
      elements: uniqueGraphicElements([...stationElements, ...routeElements, ...relatedStationElements]),
      triggerElements: uniqueGraphicElements(stationElements)
    });
  });

  return hoverItems;
}

function addMappedElements(map: Map<string, GraphicElement[]>, key: string, elements: GraphicElement[]): void {
  if (!elements.length) return;
  const current = map.get(key) || [];
  current.push(...elements);
  map.set(key, current);
}

function uniqueGraphicElements(elements: GraphicElement[]): GraphicElement[] {
  const unique: GraphicElement[] = [];
  const seen = new Set<GraphicElement>();
  elements.forEach((element) => {
    if (!element || seen.has(element)) return;
    seen.add(element);
    unique.push(element);
  });
  return unique;
}

function readEnterAnimation(
  seriesModel: SubwaySeriesModel,
  itemIndex: number,
  animationOption = seriesModel.get('enterAnimation')
): EnterAnimationConfig {
  if (seriesModel.get('animation') === false || animationOption === false) return disabledEnterAnimation();

  const option = animationOption == null || animationOption === true ? {} : asRecord(animationOption);
  if (option.show === false || option.enabled === false) return disabledEnterAnimation();

  const baseDelay = resolveAnimationNumber(option.delay ?? seriesModel.get('animationDelay'), itemIndex, itemIndex, 0);
  const stagger = resolveAnimationNumber(option.stagger, itemIndex, itemIndex, 45);
  return {
    enabled: true,
    duration: resolveAnimationNumber(option.duration ?? seriesModel.get('animationDuration'), itemIndex, itemIndex, 640),
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

function applyPathEnterAnimation(
  element: GraphicElement,
  targetKey: AnimationTargetKey,
  propertyName: 'percent' | 'strokePercent',
  animation: EnterAnimationConfig
): void {
  if (!animation.enabled) return;
  const animatable = element as AnimatableGraphicElement;
  if (typeof animatable.animate !== 'function') return;

  const target = animatable[targetKey] || {};
  target[propertyName] = 0;
  animatable[targetKey] = target;
  animateGraphicProperty(animatable, targetKey, animation, { [propertyName]: 1 });
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
