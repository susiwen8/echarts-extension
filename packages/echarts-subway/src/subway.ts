import * as echarts from 'echarts/lib/echarts';
import { clearAliveRender, installElementHover, renderAlive, setAliveRenderKey } from '@echarts-extension/layout-core';
import type { AliveRenderState, ElementHoverController, ElementHoverItem, ElementHoverOptions } from '@echarts-extension/layout-core';

import {
  collectSubwayStationData,
  DEFAULT_SUBWAY_COLORS,
  resolveSubwayLayout
} from './layout.js';
import type { SubwayLayoutOption, SubwayLayoutResult, SubwayRouteLayout, SubwayStationLayout } from './layout.js';
import { buildRoundedRoutePathShape, createRoundedRoutePath, createRoutePathShape } from './route-path.js';
import type { RoutePathShape } from './route-path.js';
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
  getBoundingRect?: () => ViewRect;
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
    Rect?: new (options: GraphicElementOptions) => GraphicElement;
    Text: new (options: GraphicElementOptions) => GraphicElement;
    extendShape?: (options: Record<string, unknown>) => new (options: GraphicElementOptions) => GraphicElement;
    makePath?: (path: string, options: { style: Record<string, unknown> }) => GraphicElement;
  };
}

interface SubwayChartView {
  group: GraphicGroup;
  __renderToken?: object | null;
  __hoverController?: ElementHoverController;
  __aliveRenderState?: AliveRenderState;
}



type LabelDirection = 'top' | 'bottom' | 'left' | 'right' | 'topRight' | 'bottomRight' | 'topLeft' | 'bottomLeft';

interface LabelPoint {
  x: number;
  y: number;
  align: string;
  verticalAlign: string;
}

interface RouteObstacle {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  padding: number;
}

interface EnterAnimationConfig {
  enabled: boolean;
  duration: number;
  delay: number;
  easing: string;
}

interface RouteStyleOverride {
  lineStyle: Record<string, unknown>;
  status?: unknown;
  hasStatus: boolean;
}

interface RouteDrawStyle {
  style: Record<string, unknown>;
  cornerRadius: number;
  key: string;
}

interface StationMarkerCircleGeometry {
  type: 'circle';
}

interface StationMarkerCapsuleGeometry {
  type: 'capsule';
  width: number;
  height: number;
  rotation: number;
}

interface StationRouteDirection {
  routeId: string;
  lineWidth: number;
  x: number;
  y: number;
}

interface ParallelStationRouteGroup {
  routeIds: Set<string>;
  lineWidth: number;
  x: number;
  y: number;
}

type StationMarkerGeometry = StationMarkerCircleGeometry | StationMarkerCapsuleGeometry;
type AnimationTargetKey = 'shape' | 'style';
type RoutePathCtor = new (options: GraphicElementOptions) => GraphicElement;

const echartsHost = echarts as unknown as EChartsHost;
let subwayRoutePathCtor: RoutePathCtor | null | undefined;
const LABEL_COLLISION_PADDING = 3;
const LABEL_ROUTE_PADDING = 3;
const LABEL_ROUTE_CLEARANCE = 1;
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
      console.error('[subway] render failed', error);
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
    const stationElements = drawStation(echartsInstance, stationGroup, seriesModel, layout, station, stationIndex, segmentOffsets);
    stationElementsById.set(station.id, stationElements);
  });
  chartGroup.add(stationGroup);

  const labelRects = drawRouteLabels(echartsInstance, chartGroup, seriesModel, layout.routes, routeElementsById);
  drawStationLabels(echartsInstance, chartGroup, seriesModel, layout, stationElementsById, labelRects, segmentOffsets);

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
  const baseStyle = createRouteDrawStyle(seriesModel, route);
  const segmentStyleOverrides = resolveRouteSegmentStyleOverrides(route);
  const animation = readEnterAnimation(seriesModel, routeIndex);
  let normalFragment: SubwayRouteLayout['points'] = [];
  let normalStyle: RouteDrawStyle | null = null;

  const flushNormalFragment = () => {
    if (!normalStyle) {
      normalFragment = [];
      return;
    }
    elements.push(...drawRoutePath(echartsInstance, group, normalFragment, normalStyle.style, normalStyle.cornerRadius, animation));
    normalFragment = [];
    normalStyle = null;
  };

  for (let segmentIndex = 0; segmentIndex < route.points.length - 1; segmentIndex += 1) {
    const previous = route.points[segmentIndex];
    const current = route.points[segmentIndex + 1];
    const drawStyle = segmentStyleOverrides.has(segmentIndex)
      ? createRouteDrawStyle(seriesModel, route, segmentStyleOverrides.get(segmentIndex))
      : baseStyle;
    const segmentOffset = segmentOffsets.get(routeSegmentOffsetKey(route.id, segmentIndex));

    if (segmentOffset) {
      flushNormalFragment();
      elements.push(...drawRoutePath(echartsInstance, group, [
        offsetRoutePoint(previous, segmentOffset),
        offsetRoutePoint(current, segmentOffset)
      ], drawStyle.style, 0, animation));
      continue;
    }

    if (!normalFragment.length) {
      normalFragment.push(previous);
      normalStyle = drawStyle;
    } else if (normalStyle?.key !== drawStyle.key) {
      flushNormalFragment();
      normalFragment.push(previous);
      normalStyle = drawStyle;
    }
    normalFragment.push(current);
  }

  flushNormalFragment();
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
  const RoutePath = getSubwayRoutePathCtor(echartsInstance);

  if (RoutePath) {
    const pathElement = new RoutePath({
      shape: createRoutePathShape(points, cornerRadius),
      style,
      silent: true
    });
    applyPathEnterAnimation(pathElement, 'style', 'strokePercent', animation);
    group.add(pathElement);
    return [pathElement];
  }

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

function getSubwayRoutePathCtor(echartsInstance: EChartsHost): RoutePathCtor | null {
  if (subwayRoutePathCtor !== undefined) return subwayRoutePathCtor;
  if (typeof echartsInstance.graphic.extendShape !== 'function') {
    subwayRoutePathCtor = null;
    return subwayRoutePathCtor;
  }

  subwayRoutePathCtor = echartsInstance.graphic.extendShape({
    type: 'subway-route-path',
    shape: {
      points: [],
      cornerRadius: 0
    },
    buildPath(ctx: unknown, shape: RoutePathShape) {
      buildRoundedRoutePathShape(ctx as Parameters<typeof buildRoundedRoutePathShape>[0], shape);
    }
  });
  return subwayRoutePathCtor;
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
  stationIndex: number,
  segmentOffsets: Map<string, RouteSegmentOffset>
): GraphicElement[] {
  const data = seriesModel.getData();
  const itemModel = station.dataIndex >= 0 && station.dataIndex < data.count() ? data.getItemModel(station.dataIndex) : null;
  const style = readStationStyle(seriesModel, itemModel, data, station, layout);
  const markerGeometry = resolveStationMarkerGeometry(station, layout, segmentOffsets);
  const marker = markerGeometry.type === 'capsule' && echartsInstance.graphic.Rect
    ? createCapsuleStationMarker(echartsInstance, station, markerGeometry, style, seriesModel)
    : createCircleStationMarker(echartsInstance, station, style, seriesModel);
  if (markerGeometry.type === 'capsule' && echartsInstance.graphic.Rect) {
    applyFadeEnterAnimation(marker, readEnterAnimation(seriesModel, layout.routes.length + stationIndex));
  } else {
    applyCircleEnterAnimation(marker, station.radius, readEnterAnimation(seriesModel, layout.routes.length + stationIndex));
  }

  if (itemModel && station.dataIndex >= 0 && station.dataIndex < data.count()) {
    data.setItemLayout(station.dataIndex, [station.x, station.y]);
    data.setItemGraphicEl(station.dataIndex, marker);
  }

  group.add(marker);
  return [marker];
}

function createCircleStationMarker(
  echartsInstance: EChartsHost,
  station: SubwayStationLayout,
  style: Record<string, unknown>,
  seriesModel: SubwaySeriesModel
): GraphicElement {
  return new echartsInstance.graphic.Circle({
    shape: {
      cx: station.x,
      cy: station.y,
      r: station.radius
    },
    style,
    silent: seriesModel.get('silent') === true
  });
}

function createCapsuleStationMarker(
  echartsInstance: EChartsHost,
  station: SubwayStationLayout,
  geometry: StationMarkerCapsuleGeometry,
  style: Record<string, unknown>,
  seriesModel: SubwaySeriesModel
): GraphicElement {
  const Rect = echartsInstance.graphic.Rect as NonNullable<EChartsHost['graphic']['Rect']>;
  const marker = new Rect({
    shape: {
      x: -geometry.width / 2,
      y: -geometry.height / 2,
      width: geometry.width,
      height: geometry.height,
      r: geometry.width / 2
    },
    style,
    silent: seriesModel.get('silent') === true
  });
  const transformable = marker as GraphicElement & { x?: number; y?: number; rotation?: number };
  transformable.x = station.x;
  transformable.y = station.y;
  transformable.rotation = geometry.rotation;
  return marker;
}

function resolveStationMarkerGeometry(
  station: SubwayStationLayout,
  layout: SubwayLayoutResult,
  segmentOffsets: Map<string, RouteSegmentOffset>
): StationMarkerGeometry {
  if (station.lines.length < 2) return { type: 'circle' };
  const parallelGroup = findParallelStationRouteGroup(station, layout.routes, segmentOffsets);
  if (!parallelGroup || parallelGroup.routeIds.size < 2) return { type: 'circle' };

  const shortSize = station.radius * 2;
  const routeSpacing = parallelGroup.lineWidth + 2;
  const longSize = Math.max(shortSize, shortSize + (parallelGroup.routeIds.size - 1) * routeSpacing);

  return {
    type: 'capsule',
    width: shortSize,
    height: longSize,
    rotation: Math.atan2(parallelGroup.y, parallelGroup.x)
  };
}

function findParallelStationRouteGroup(
  station: SubwayStationLayout,
  routes: SubwayRouteLayout[],
  segmentOffsets: Map<string, RouteSegmentOffset>
): ParallelStationRouteGroup | null {
  const directions = collectStationRouteDirections(station, routes, segmentOffsets);
  const groups: ParallelStationRouteGroup[] = [];

  directions.forEach((direction) => {
    const group = groups.find((candidate) => areParallelDirections(candidate, direction));
    if (!group) {
      groups.push({
        routeIds: new Set([direction.routeId]),
        lineWidth: direction.lineWidth,
        x: direction.x,
        y: direction.y
      });
      return;
    }

    group.routeIds.add(direction.routeId);
    group.lineWidth = Math.max(group.lineWidth, direction.lineWidth);
  });

  return groups.reduce<ParallelStationRouteGroup | null>((largest, group) => {
    if (!largest || group.routeIds.size > largest.routeIds.size) return group;
    return largest;
  }, null);
}

function collectStationRouteDirections(
  station: SubwayStationLayout,
  routes: SubwayRouteLayout[],
  segmentOffsets: Map<string, RouteSegmentOffset>
): StationRouteDirection[] {
  const directions: StationRouteDirection[] = [];

  routes.forEach((route) => {
    if (!station.lines.includes(route.id)) return;
    route.points.forEach((point, pointIndex) => {
      if (point.stationId !== station.id) return;
      const previousSegmentIndex = pointIndex - 1;
      const nextSegmentIndex = pointIndex;
      const previous = pointIndex > 0 && segmentOffsets.has(routeSegmentOffsetKey(route.id, previousSegmentIndex))
        ? route.points[pointIndex - 1]
        : null;
      const next = pointIndex < route.points.length - 1 && segmentOffsets.has(routeSegmentOffsetKey(route.id, nextSegmentIndex))
        ? route.points[pointIndex + 1]
        : null;
      const previousDirection = previous ? normalizeRouteDirection(point.x - previous.x, point.y - previous.y) : null;
      const nextDirection = next ? normalizeRouteDirection(next.x - point.x, next.y - point.y) : null;

      if (previousDirection) {
        directions.push({
          routeId: route.id,
          lineWidth: route.lineWidth,
          ...previousDirection
        });
      }
      if (nextDirection) {
        directions.push({
          routeId: route.id,
          lineWidth: route.lineWidth,
          ...nextDirection
        });
      }
    });
  });

  return directions;
}

function normalizeRouteDirection(dx: number, dy: number): { x: number; y: number } | null {
  const length = Math.hypot(dx, dy);
  if (!length) return null;
  let x = dx / length;
  let y = dy / length;
  if (x < -1e-9 || (Math.abs(x) < 1e-9 && y < 0)) {
    x = -x;
    y = -y;
  }
  return { x, y };
}

function areParallelDirections(left: { x: number; y: number }, right: { x: number; y: number }): boolean {
  return Math.abs(left.x * right.y - left.y * right.x) < 0.04;
}

function drawStationLabels(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: SubwaySeriesModel,
  layout: SubwayLayoutResult,
  stationElementsById: Map<string, GraphicElement[]>,
  occupiedLabelRects: ViewRect[],
  segmentOffsets: Map<string, RouteSegmentOffset>
): void {
  const seriesLabelModel = seriesModel.getModel('label');
  if (!seriesLabelModel.get('show')) return;
  const routeObstacles = createRouteObstacles(layout.routes, segmentOffsets);

  layout.stations.forEach((station) => {
    const text = formatStationLabel(seriesLabelModel.get('formatter'), station);
    const labelEl = createStationLabel(echartsInstance, seriesLabelModel, station, text, occupiedLabelRects, routeObstacles);
    setAliveRenderKey(labelEl, `subway-station-label:${station.id}`);
    applyFadeEnterAnimation(labelEl, readEnterAnimation(seriesModel, station.dataIndex));
    addMappedElements(stationElementsById, station.id, [labelEl]);
    group.add(labelEl);
    recordLabelRect(labelEl, occupiedLabelRects);
  });
}

function drawRouteLabels(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: SubwaySeriesModel,
  routes: SubwayRouteLayout[],
  routeElementsById: Map<string, GraphicElement[]>
): ViewRect[] {
  const occupiedLabelRects: ViewRect[] = [];
  const routeLabelModel = seriesModel.getModel('routeLabel');
  if (!routeLabelModel.get('show')) return occupiedLabelRects;

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
    setAliveRenderKey(labelEl, `subway-route-label:${route.id}`);
    applyFadeEnterAnimation(labelEl, readEnterAnimation(seriesModel, routeIndex));
    addMappedElements(routeElementsById, route.id, [labelEl]);
    group.add(labelEl);
    recordLabelRect(labelEl, occupiedLabelRects);
  });
  return occupiedLabelRects;
}

function createRouteDrawStyle(
  seriesModel: SubwaySeriesModel,
  route: SubwayRouteLayout,
  override?: RouteStyleOverride
): RouteDrawStyle {
  const style = readRouteStyle(seriesModel, route, override);
  const cornerRadius = readRouteCornerRadius(seriesModel, route, style, override);
  return {
    style,
    cornerRadius,
    key: createRouteDrawStyleKey(style, cornerRadius)
  };
}

function readRouteStyle(
  seriesModel: SubwaySeriesModel,
  route: SubwayRouteLayout,
  override?: RouteStyleOverride
): Record<string, unknown> {
  const seriesStyle = asRecord(seriesModel.get('lineStyle'));
  const routeStyle = asRecord(asRecord(route.raw).lineStyle);
  const segmentStyle = override?.lineStyle || {};
  const lineWidth = finiteNumber(segmentStyle.width ?? routeStyle.width ?? seriesStyle.width, route.lineWidth);
  const style: Record<string, unknown> = {
    stroke: segmentStyle.color || routeStyle.color || route.color,
    lineWidth,
    opacity: finiteNumber(segmentStyle.opacity ?? routeStyle.opacity ?? seriesStyle.opacity, 1),
    lineCap: segmentStyle.cap || routeStyle.cap || seriesStyle.cap || 'round',
    lineJoin: segmentStyle.join || routeStyle.join || seriesStyle.join || 'round',
    fill: null
  };
  const lineDash = readRouteLineDash([segmentStyle, routeStyle, seriesStyle], readRouteStatus(route, override), lineWidth);
  const lineDashOffset = firstFiniteNumber(
    segmentStyle.lineDashOffset,
    segmentStyle.dashOffset,
    routeStyle.lineDashOffset,
    routeStyle.dashOffset,
    seriesStyle.lineDashOffset,
    seriesStyle.dashOffset
  );

  if (lineDash) style.lineDash = lineDash;
  if (lineDashOffset != null) style.lineDashOffset = lineDashOffset;
  return style;
}

function readRouteCornerRadius(
  seriesModel: SubwaySeriesModel,
  route: SubwayRouteLayout,
  routeStyle: Record<string, unknown>,
  override?: RouteStyleOverride
): number {
  const seriesStyle = asRecord(seriesModel.get('lineStyle'));
  const rawRoute = asRecord(route.raw);
  const itemStyle = asRecord(rawRoute.lineStyle);
  const segmentStyle = override?.lineStyle || {};

  return finiteNumber(
    segmentStyle.cornerRadius ?? rawRoute.cornerRadius ?? itemStyle.cornerRadius ?? seriesModel.get('cornerRadius') ?? seriesStyle.cornerRadius,
    finiteNumber(routeStyle.lineWidth, route.lineWidth) * 2
  );
}

function resolveRouteSegmentStyleOverrides(route: SubwayRouteLayout): Map<number, RouteStyleOverride> {
  const rawRoute = asRecord(route.raw);
  const segmentInputs = Array.isArray(rawRoute.segments) ? rawRoute.segments : [];
  const overrides = new Map<number, RouteStyleOverride>();
  const maxSegmentIndex = route.points.length - 2;

  segmentInputs.forEach((input) => {
    const segment = asRecord(input);
    const lineStyle = asRecord(segment.lineStyle);
    const hasStatus = hasOwn(segment, 'status');
    if (!hasStatus && !Object.keys(lineStyle).length) return;

    const override = {
      lineStyle,
      status: segment.status,
      hasStatus
    };
    const fromId = normalizeSegmentEndpointId(segment.from ?? segment.source ?? segment.start);
    const toId = normalizeSegmentEndpointId(segment.to ?? segment.target ?? segment.end);

    if (fromId && toId) {
      const fromIndex = findRouteStationPointIndex(route, fromId);
      const toIndex = findRouteStationPointIndex(route, toId);
      if (fromIndex >= 0 && toIndex >= 0 && fromIndex !== toIndex) {
        setSegmentStyleOverrideRange(overrides, Math.min(fromIndex, toIndex), Math.max(fromIndex, toIndex) - 1, maxSegmentIndex, override);
        return;
      }
    }

    const segmentIndex = readSegmentIndex(segment.segmentIndex ?? segment.index, maxSegmentIndex);
    if (segmentIndex != null) {
      overrides.set(segmentIndex, override);
      return;
    }

    const startIndex = readSegmentIndex(segment.startIndex ?? segment.fromIndex, maxSegmentIndex);
    const endIndex = readSegmentIndex(segment.endIndex ?? segment.toIndex, maxSegmentIndex);
    if (startIndex != null && endIndex != null) {
      setSegmentStyleOverrideRange(overrides, Math.min(startIndex, endIndex), Math.max(startIndex, endIndex), maxSegmentIndex, override);
    }
  });

  return overrides;
}

function setSegmentStyleOverrideRange(
  overrides: Map<number, RouteStyleOverride>,
  startIndex: number,
  endIndex: number,
  maxSegmentIndex: number,
  override: RouteStyleOverride
): void {
  const start = Math.max(0, startIndex);
  const end = Math.min(maxSegmentIndex, endIndex);
  for (let segmentIndex = start; segmentIndex <= end; segmentIndex += 1) {
    overrides.set(segmentIndex, override);
  }
}

function findRouteStationPointIndex(route: SubwayRouteLayout, stationId: string): number {
  return route.points.findIndex((point) => point.stationId === stationId);
}

function normalizeSegmentEndpointId(value: unknown): string | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined;
  return String(value);
}

function readSegmentIndex(value: unknown, maxSegmentIndex: number): number | null {
  if (typeof value !== 'number' || !Number.isInteger(value)) return null;
  return value >= 0 && value <= maxSegmentIndex ? value : null;
}

function readRouteStatus(route: SubwayRouteLayout, override?: RouteStyleOverride): unknown {
  if (override?.hasStatus) return override.status;
  return asRecord(route.raw).status;
}

function readRouteLineDash(styles: Record<string, unknown>[], status: unknown, lineWidth: number): number[] | null {
  const explicitDash = firstLineDash(styles, 'lineDash') || firstLineDash(styles, 'dashArray');
  if (explicitDash) return explicitDash;

  const lineType = firstDefined(...styles.map((style) => style.type));
  if (lineType != null) return readLineDash(lineType, lineWidth);
  if (isDashedRouteStatus(status)) return readLineDash('dashed', lineWidth);
  return null;
}

function firstLineDash(styles: Record<string, unknown>[], key: 'lineDash' | 'dashArray'): number[] | null {
  for (const style of styles) {
    const dash = readDashArray(style[key]);
    if (dash) return dash;
  }
  return null;
}

function readLineDash(value: unknown, lineWidth: number): number[] | null {
  const dashArray = readDashArray(value);
  if (dashArray) return dashArray;
  if (value === 'dashed') return [Math.max(4, lineWidth * 1.8), Math.max(3, lineWidth * 1.15)];
  if (value === 'dotted') return [Math.max(1, lineWidth * 0.12), Math.max(2, lineWidth * 1.1)];
  return null;
}

function readDashArray(value: unknown): number[] | null {
  if (Array.isArray(value)) {
    const numbers = value.filter((item): item is number => typeof item === 'number' && Number.isFinite(item) && item >= 0);
    return numbers.length ? numbers : null;
  }

  if (typeof value === 'string') {
    const numbers = value
      .trim()
      .split(/[\s,]+/)
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item) && item >= 0);
    return numbers.length ? numbers : null;
  }

  return null;
}

function isDashedRouteStatus(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const status = value.toLowerCase().replace(/[\s_-]/g, '');
  return status === 'planned'
    || status === 'future'
    || status === 'unopened'
    || status === 'pending'
    || status === 'construction'
    || status === 'constructing'
    || status === 'underconstruction'
    || value === '待开通'
    || value === '规划'
    || value === '在建'
    || value === '建设中'
    || value === '未开通';
}

function firstDefined(...values: unknown[]): unknown {
  return values.find((value) => value !== undefined && value !== null);
}

function firstFiniteNumber(...values: unknown[]): number | undefined {
  return values.find((value): value is number => typeof value === 'number' && Number.isFinite(value));
}

function createRouteDrawStyleKey(style: Record<string, unknown>, cornerRadius: number): string {
  return JSON.stringify({
    stroke: style.stroke,
    lineWidth: style.lineWidth,
    opacity: style.opacity,
    lineCap: style.lineCap,
    lineJoin: style.lineJoin,
    fill: style.fill,
    lineDash: style.lineDash,
    lineDashOffset: style.lineDashOffset,
    cornerRadius
  });
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

function getLabelPoint(x: number, y: number, position: LabelDirection, offset: number): LabelPoint {
  if (position === 'top') return { x, y: y - offset, align: 'center', verticalAlign: 'bottom' };
  if (position === 'bottom') return { x, y: y + offset, align: 'center', verticalAlign: 'top' };
  if (position === 'left') return { x: x - offset, y, align: 'right', verticalAlign: 'middle' };
  if (position === 'topRight') return { x: x + offset, y: y - offset, align: 'left', verticalAlign: 'bottom' };
  if (position === 'bottomRight') return { x: x + offset, y: y + offset, align: 'left', verticalAlign: 'top' };
  if (position === 'topLeft') return { x: x - offset, y: y - offset, align: 'right', verticalAlign: 'bottom' };
  if (position === 'bottomLeft') return { x: x - offset, y: y + offset, align: 'right', verticalAlign: 'top' };
  return { x: x + offset, y, align: 'left', verticalAlign: 'middle' };
}

function createStationLabel(
  echartsInstance: EChartsHost,
  labelModel: EChartsModel,
  station: SubwayStationLayout,
  text: unknown,
  occupiedLabelRects: ViewRect[],
  routeObstacles: RouteObstacle[]
): GraphicElement {
  let fallback: GraphicElement | null = null;
  let fallbackCollisionScore = Number.POSITIVE_INFINITY;
  const baseOffset = station.radius + 7;

  for (const offset of labelOffsetCandidates(baseOffset, routeObstacles)) {
    for (const position of labelPositionCandidates(station.labelPosition)) {
      const labelEl = createLabelElement(
        echartsInstance,
        getLabelPoint(station.x, station.y, position, offset),
        text,
        labelModel.get('color') || '#111827',
        labelModel.get('fontSize') || 11,
        labelModel.get('fontWeight') || 600
      );
      const labelRect = readLabelRect(labelEl);
      const labelCollisionArea = labelRect ? totalCollisionArea(labelRect, occupiedLabelRects) : 0;
      const routeCollisionScore = labelRect ? totalRouteCollisionScore(labelRect, routeObstacles) : 0;
      const collisionScore = routeCollisionScore * 1000000 + labelCollisionArea;
      if (collisionScore < fallbackCollisionScore) {
        fallback = labelEl;
        fallbackCollisionScore = collisionScore;
      }
      if (!labelRect || (routeCollisionScore <= 0 && labelCollisionArea <= 0)) {
        return labelEl;
      }
    }
  }

  return fallback as GraphicElement;
}

function createLabelElement(
  echartsInstance: EChartsHost,
  point: LabelPoint,
  text: unknown,
  fill: unknown,
  fontSize: unknown,
  fontWeight: unknown
): GraphicElement {
  return new echartsInstance.graphic.Text({
    style: {
      x: point.x,
      y: point.y,
      text,
      fill,
      fontSize,
      fontWeight,
      align: point.align,
      verticalAlign: point.verticalAlign
    },
    silent: true
  });
}

function labelPositionCandidates(position: string): LabelDirection[] {
  if (position === 'top') return ['top', 'topRight', 'topLeft', 'right', 'left', 'bottomRight', 'bottomLeft', 'bottom'];
  if (position === 'bottom') return ['bottom', 'bottomRight', 'bottomLeft', 'right', 'left', 'topRight', 'topLeft', 'top'];
  if (position === 'left') return ['left', 'topLeft', 'bottomLeft', 'top', 'bottom', 'topRight', 'bottomRight', 'right'];
  return ['right', 'topRight', 'bottomRight', 'top', 'bottom', 'topLeft', 'bottomLeft', 'left'];
}

function labelOffsetCandidates(baseOffset: number, routeObstacles: RouteObstacle[]): number[] {
  const routeClearance = getRouteClearance(routeObstacles);
  const nearRouteOffset = Math.max(baseOffset + 1, routeClearance);
  return uniqueSortedNumbers([
    baseOffset,
    nearRouteOffset,
    nearRouteOffset + 8,
    nearRouteOffset + 18,
    nearRouteOffset + 32,
    nearRouteOffset + 50
  ]);
}

function getRouteClearance(routeObstacles: RouteObstacle[]): number {
  const routeClearance = routeObstacles.reduce((maxPadding, obstacle) => Math.max(maxPadding, obstacle.padding), 0)
    + LABEL_COLLISION_PADDING
    + LABEL_ROUTE_CLEARANCE;
  return routeClearance;
}

function uniqueSortedNumbers(values: number[]): number[] {
  return Array.from(new Set(values)).sort((left, right) => left - right);
}

function createRouteObstacles(routes: SubwayRouteLayout[], segmentOffsets: Map<string, RouteSegmentOffset>): RouteObstacle[] {
  return routes.flatMap((route) => {
    const padding = route.lineWidth / 2 + LABEL_ROUTE_PADDING;
    const obstacles: RouteObstacle[] = [];
    for (let index = 1; index < route.points.length; index += 1) {
      const previous = route.points[index - 1];
      const current = route.points[index];
      const segmentOffset = segmentOffsets.get(routeSegmentOffsetKey(route.id, index - 1));
      const start = segmentOffset ? offsetRoutePoint(previous, segmentOffset) : previous;
      const end = segmentOffset ? offsetRoutePoint(current, segmentOffset) : current;
      obstacles.push({
        x1: start.x,
        y1: start.y,
        x2: end.x,
        y2: end.y,
        padding
      });
    }
    return obstacles;
  });
}

function totalRouteCollisionScore(rect: ViewRect, obstacles: RouteObstacle[]): number {
  return obstacles.reduce((total, obstacle) => (
    total + (segmentIntersectsInflatedRect(obstacle, rect) ? 1 : 0)
  ), 0);
}

function segmentIntersectsInflatedRect(segment: RouteObstacle, rect: ViewRect): boolean {
  return segmentIntersectsRect(segment.x1, segment.y1, segment.x2, segment.y2, {
    x: rect.x - segment.padding,
    y: rect.y - segment.padding,
    width: rect.width + segment.padding * 2,
    height: rect.height + segment.padding * 2
  });
}

function segmentIntersectsRect(x1: number, y1: number, x2: number, y2: number, rect: ViewRect): boolean {
  const left = rect.x;
  const right = rect.x + rect.width;
  const top = rect.y;
  const bottom = rect.y + rect.height;
  let tMin = 0;
  let tMax = 1;
  const dx = x2 - x1;
  const dy = y2 - y1;

  const clip = (edge: number, distance: number): boolean => {
    if (edge === 0) return distance >= 0;
    const t = distance / edge;
    if (edge < 0) {
      if (t > tMax) return false;
      if (t > tMin) tMin = t;
    } else {
      if (t < tMin) return false;
      if (t < tMax) tMax = t;
    }
    return true;
  };

  return clip(-dx, x1 - left)
    && clip(dx, right - x1)
    && clip(-dy, y1 - top)
    && clip(dy, bottom - y1);
}

function recordLabelRect(labelEl: GraphicElement, occupiedLabelRects: ViewRect[]): void {
  const rect = readLabelRect(labelEl);
  if (rect) occupiedLabelRects.push(rect);
}

function readLabelRect(labelEl: GraphicElement): ViewRect | null {
  if (typeof labelEl.getBoundingRect !== 'function') return null;
  const rect = labelEl.getBoundingRect();
  if (!rect || !isFiniteRect(rect)) return null;
  return {
    x: rect.x - LABEL_COLLISION_PADDING,
    y: rect.y - LABEL_COLLISION_PADDING,
    width: rect.width + LABEL_COLLISION_PADDING * 2,
    height: rect.height + LABEL_COLLISION_PADDING * 2
  };
}

function isFiniteRect(rect: ViewRect): boolean {
  return Number.isFinite(rect.x)
    && Number.isFinite(rect.y)
    && Number.isFinite(rect.width)
    && Number.isFinite(rect.height);
}

function totalCollisionArea(rect: ViewRect, occupiedRects: ViewRect[]): number {
  return occupiedRects.reduce((total, occupied) => total + collisionArea(rect, occupied), 0);
}

function collisionArea(left: ViewRect, right: ViewRect): number {
  const width = Math.min(left.x + left.width, right.x + right.width) - Math.max(left.x, right.x);
  const height = Math.min(left.y + left.height, right.y + right.height) - Math.max(left.y, right.y);
  return width > 0 && height > 0 ? width * height : 0;
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

function hasOwn(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

export const __test__ = {
  readLayoutOption,
  readRoutes,
  drawSubway,
  drawRoute,
  drawRoutePath,
  getSubwayRoutePathCtor,
  offsetRoutePoint,
  drawStation,
  createCircleStationMarker,
  createCapsuleStationMarker,
  resolveStationMarkerGeometry,
  findParallelStationRouteGroup,
  collectStationRouteDirections,
  normalizeRouteDirection,
  areParallelDirections,
  drawStationLabels,
  drawRouteLabels,
  createRouteDrawStyle,
  readRouteStyle,
  readRouteCornerRadius,
  resolveRouteSegmentStyleOverrides,
  setSegmentStyleOverrideRange,
  findRouteStationPointIndex,
  normalizeSegmentEndpointId,
  readSegmentIndex,
  readRouteStatus,
  readRouteLineDash,
  firstLineDash,
  readLineDash,
  readDashArray,
  isDashedRouteStatus,
  firstDefined,
  firstFiniteNumber,
  createRouteDrawStyleKey,
  readStationStyle,
  getLabelPoint,
  createStationLabel,
  createLabelElement,
  labelPositionCandidates,
  labelOffsetCandidates,
  getRouteClearance,
  uniqueSortedNumbers,
  createRouteObstacles,
  totalRouteCollisionScore,
  segmentIntersectsInflatedRect,
  segmentIntersectsRect,
  recordLabelRect,
  readLabelRect,
  isFiniteRect,
  totalCollisionArea,
  collisionArea,
  formatStationLabel,
  formatRouteLabel,
  createSubwayHoverItems,
  addMappedElements,
  uniqueGraphicElements,
  readEnterAnimation,
  disabledEnterAnimation,
  resolveAnimationNumber,
  resolveAnimationEasing,
  applyPathEnterAnimation,
  applyCircleEnterAnimation,
  applyFadeEnterAnimation,
  animateGraphicProperty,
  finiteNumber,
  asRecord,
  hasOwn
};
