const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 520;
const DEFAULT_PADDING = 24;
const DEFAULT_STATION_RADIUS = 4;
const DEFAULT_INTERCHANGE_RADIUS = 8;
const DEFAULT_LINE_WIDTH = 8;

export const DEFAULT_SUBWAY_COLORS = [
  '#d51f2a',
  '#f5a623',
  '#14a75b',
  '#1677c9',
  '#8e44ad',
  '#00a6a6',
  '#ef6c00',
  '#6f7f8f'
];

export type SubwayLabelPosition = 'top' | 'bottom' | 'left' | 'right';

export interface SubwayStationInput {
  id?: string | number;
  name?: string;
  coord?: [number, number] | number[];
  value?: unknown;
  x?: number;
  y?: number;
  labelPosition?: SubwayLabelPosition;
  interchange?: boolean;
  itemStyle?: Record<string, unknown>;
  label?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface SubwayRouteInput {
  id?: string | number;
  name?: string;
  color?: string;
  stations?: unknown[];
  waypoints?: unknown[];
  lineStyle?: Record<string, unknown>;
  label?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface SubwayLayoutOptions {
  width?: number;
  height?: number;
  padding?: number;
  stationRadius?: number;
  interchangeRadius?: number;
  lineWidth?: number;
  cornerRadius?: number;
  preserveAspectRatio?: boolean;
  colors?: string[];
  [key: string]: unknown;
}

export interface SubwayLayoutOption extends SubwayLayoutOptions {
  data?: unknown[];
  routes?: unknown[];
  layout?: unknown;
  layoutOptions?: unknown;
}

export interface SubwayPoint {
  x: number;
  y: number;
  rawX: number;
  rawY: number;
  stationId?: string;
}

export interface SubwayRouteLayout {
  id: string;
  name: string;
  color: string;
  lineWidth: number;
  points: SubwayPoint[];
  stationIds: string[];
  raw: unknown;
}

export interface SubwayStationLayout {
  id: string;
  name: string;
  x: number;
  y: number;
  rawX: number;
  rawY: number;
  radius: number;
  labelPosition: SubwayLabelPosition;
  interchange: boolean;
  lines: string[];
  dataIndex: number;
  raw: unknown;
}

export interface SubwayLayoutResult {
  width: number;
  height: number;
  padding: number;
  stationRadius: number;
  interchangeRadius: number;
  lineWidth: number;
  routes: SubwayRouteLayout[];
  stations: SubwayStationLayout[];
  extent: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
}

interface NormalizedRoute {
  id: string;
  name: string;
  color?: string;
  stations: NormalizedStation[];
  points: NormalizedPathPoint[];
  raw: unknown;
}

interface NormalizedStation {
  id: string;
  name: string;
  x: number;
  y: number;
  labelPosition?: SubwayLabelPosition;
  interchange?: boolean;
  raw: unknown;
}

interface NormalizedPathPoint {
  x: number;
  y: number;
  stationId?: string;
}

interface MutableStation {
  id: string;
  name: string;
  x: number;
  y: number;
  labelPosition?: SubwayLabelPosition;
  interchange: boolean;
  lines: string[];
  raw: unknown;
}

export function resolveSubwayLayout(option: SubwayLayoutOption = {}): SubwayLayoutResult {
  const layoutOptions = isPlainObject(option.layoutOptions) ? option.layoutOptions : {};
  const layout = isPlainObject(option.layout) ? option.layout : {};
  const routes = Array.isArray(option.routes) ? option.routes : Array.isArray(option.data) ? option.data : [];
  const colors = Array.isArray(option.colors) ? option.colors.filter((color): color is string => typeof color === 'string') : undefined;
  const preserveAspectRatio = firstBoolean(option.preserveAspectRatio, layoutOptions.preserveAspectRatio, layout.preserveAspectRatio);

  return layoutSubway(routes, {
    ...layout,
    ...layoutOptions,
    width: finiteNumber(option.width, finiteNumber(layoutOptions.width, finiteNumber(layout.width, DEFAULT_WIDTH))),
    height: finiteNumber(option.height, finiteNumber(layoutOptions.height, finiteNumber(layout.height, DEFAULT_HEIGHT))),
    padding: finiteNumber(option.padding, finiteNumber(layoutOptions.padding, finiteNumber(layout.padding, DEFAULT_PADDING))),
    stationRadius: finiteNumber(
      option.stationRadius,
      finiteNumber(layoutOptions.stationRadius, finiteNumber(layout.stationRadius, DEFAULT_STATION_RADIUS))
    ),
    interchangeRadius: finiteNumber(
      option.interchangeRadius,
      finiteNumber(layoutOptions.interchangeRadius, finiteNumber(layout.interchangeRadius, DEFAULT_INTERCHANGE_RADIUS))
    ),
    lineWidth: finiteNumber(option.lineWidth, finiteNumber(layoutOptions.lineWidth, finiteNumber(layout.lineWidth, DEFAULT_LINE_WIDTH))),
    preserveAspectRatio,
    colors
  });
}

export function layoutSubway(routesInput: unknown[], options: SubwayLayoutOptions = {}): SubwayLayoutResult {
  const width = Math.max(1, finiteNumber(options.width, DEFAULT_WIDTH));
  const height = Math.max(1, finiteNumber(options.height, DEFAULT_HEIGHT));
  const padding = Math.max(0, finiteNumber(options.padding, DEFAULT_PADDING));
  const stationRadius = Math.max(1, finiteNumber(options.stationRadius, DEFAULT_STATION_RADIUS));
  const interchangeRadius = Math.max(stationRadius, finiteNumber(options.interchangeRadius, DEFAULT_INTERCHANGE_RADIUS));
  const lineWidth = Math.max(1, finiteNumber(options.lineWidth, DEFAULT_LINE_WIDTH));
  const preserveAspectRatio = options.preserveAspectRatio !== false;
  const colors = options.colors?.length ? options.colors : DEFAULT_SUBWAY_COLORS;
  const normalizedRoutes = normalizeRoutes(routesInput);
  const mutableStations = mergeStations(normalizedRoutes);
  const rawPoints = collectRawPoints(normalizedRoutes, mutableStations);
  const extent = computeExtent(rawPoints);
  const project = createProjector(extent, width, height, padding, preserveAspectRatio);

  const stations = Array.from(mutableStations.values()).map((station, dataIndex) => {
    const point = project(station.x, station.y);
    const interchange = station.interchange || station.lines.length > 1;

    return {
      id: station.id,
      name: station.name,
      x: point.x,
      y: point.y,
      rawX: station.x,
      rawY: station.y,
      radius: interchange ? interchangeRadius : stationRadius,
      labelPosition: station.labelPosition || autoLabelPosition(point.x, width),
      interchange,
      lines: station.lines,
      dataIndex,
      raw: station.raw
    };
  });

  const routes = normalizedRoutes.map((route, index) => ({
    id: route.id,
    name: route.name,
    color: route.color || colors[index % colors.length],
    lineWidth,
    points: route.points.map((point) => ({
      ...project(point.x, point.y),
      rawX: point.x,
      rawY: point.y,
      stationId: point.stationId
    })),
    stationIds: route.stations.map((station) => station.id),
    raw: route.raw
  }));

  return {
    width,
    height,
    padding,
    stationRadius,
    interchangeRadius,
    lineWidth,
    routes,
    stations,
    extent
  };
}

export function collectSubwayStationData(routesInput: unknown[]): unknown[] {
  const stations: unknown[] = [];
  const seen = new Set<string>();

  normalizeRoutes(routesInput).forEach((route) => {
    route.stations.forEach((station) => {
      if (seen.has(station.id)) return;
      seen.add(station.id);
      stations.push(station.raw);
    });
  });

  return stations;
}

function normalizeRoutes(routesInput: unknown[]): NormalizedRoute[] {
  return routesInput
    .map((routeInput, routeIndex) => normalizeRoute(routeInput, routeIndex))
    .filter((route): route is NormalizedRoute => route != null && (route.stations.length > 0 || route.points.length > 0));
}

function normalizeRoute(routeInput: unknown, routeIndex: number): NormalizedRoute | null {
  const route = asRecord(routeInput);
  const routeId = normalizeId(route.id ?? route.name ?? `route-${routeIndex + 1}`);
  const routeName = normalizeName(route.name ?? route.id, routeId);
  const stationInputs = Array.isArray(route.stations) ? route.stations : Array.isArray(route.data) ? route.data : [];
  const stations = stationInputs
    .map((stationInput, stationIndex) => normalizeStation(stationInput, routeId, stationIndex))
    .filter((station): station is NormalizedStation => station != null);
  const stationById = new Map(stations.map((station) => [station.id, station]));
  const waypointInputs = Array.isArray(route.waypoints) ? route.waypoints : [];
  const points = (waypointInputs.length ? waypointInputs : stations)
    .map((pointInput, pointIndex) => normalizePathPoint(pointInput, stationById, routeId, pointIndex))
    .filter((point): point is NormalizedPathPoint => point != null);

  return {
    id: routeId,
    name: routeName,
    color: typeof route.color === 'string' ? route.color : undefined,
    stations,
    points,
    raw: routeInput
  };
}

function normalizeStation(input: unknown, routeId: string, stationIndex: number): NormalizedStation | null {
  const fallbackId = `${routeId}:${stationIndex + 1}`;

  if (Array.isArray(input)) {
    const parsed = parseArrayStation(input, fallbackId);
    return parsed ? { ...parsed, raw: input } : null;
  }

  const item = asRecord(input);
  const coord = readCoord(item);
  if (!coord) return null;
  const id = normalizeId(item.id ?? item.name ?? fallbackId);

  return {
    id,
    name: normalizeName(item.name ?? item.id, id),
    x: coord[0],
    y: coord[1],
    labelPosition: normalizeLabelPosition(item.labelPosition),
    interchange: item.interchange === true,
    raw: input
  };
}

function parseArrayStation(input: unknown[], fallbackId: string): Omit<NormalizedStation, 'raw'> | null {
  if (typeof input[0] === 'number' && typeof input[1] === 'number') {
    const name = input[2] != null ? String(input[2]) : fallbackId;
    return {
      id: normalizeId(input[3] ?? name),
      name,
      x: input[0],
      y: input[1],
      labelPosition: normalizeLabelPosition(input[4]),
      interchange: input[5] === true
    };
  }

  if ((typeof input[0] === 'string' || typeof input[0] === 'number') && typeof input[2] === 'number' && typeof input[3] === 'number') {
    return {
      id: normalizeId(input[0]),
      name: normalizeName(input[1], normalizeId(input[0])),
      x: input[2],
      y: input[3],
      labelPosition: normalizeLabelPosition(input[4]),
      interchange: input[5] === true
    };
  }

  return null;
}

function normalizePathPoint(
  input: unknown,
  stationById: Map<string, NormalizedStation>,
  routeId: string,
  pointIndex: number
): NormalizedPathPoint | null {
  if (Array.isArray(input)) {
    return parseArrayPathPoint(input, stationById);
  }

  const item = asRecord(input);
  const stationId = normalizeOptionalId(item.stationId ?? item.id);
  const station = stationId ? stationById.get(stationId) : undefined;
  if (station) {
    return {
      x: station.x,
      y: station.y,
      stationId: station.id
    };
  }

  const coord = readCoord(item);
  if (!coord) return null;

  return {
    x: coord[0],
    y: coord[1],
    stationId: stationId || (stationById.has(`${routeId}:${pointIndex + 1}`) ? `${routeId}:${pointIndex + 1}` : undefined)
  };
}

function parseArrayPathPoint(input: unknown[], stationById: Map<string, NormalizedStation>): NormalizedPathPoint | null {
  const stationId = normalizeOptionalId(input[0]);
  if (stationId && typeof input[1] !== 'number') {
    const station = stationById.get(stationId);
    return station ? { x: station.x, y: station.y, stationId: station.id } : null;
  }

  if (stationId && typeof input[1] === 'number' && typeof input[2] === 'number') {
    return {
      x: input[1],
      y: input[2],
      stationId: stationById.has(stationId) ? stationId : undefined
    };
  }

  if (typeof input[0] === 'number' && typeof input[1] === 'number') {
    return {
      x: input[0],
      y: input[1]
    };
  }

  return null;
}

function mergeStations(routes: NormalizedRoute[]): Map<string, MutableStation> {
  const stations = new Map<string, MutableStation>();

  routes.forEach((route) => {
    route.stations.forEach((station) => {
      const existing = stations.get(station.id);
      if (!existing) {
        stations.set(station.id, {
          id: station.id,
          name: station.name,
          x: station.x,
          y: station.y,
          labelPosition: station.labelPosition,
          interchange: station.interchange === true,
          lines: [route.id],
          raw: station.raw
        });
        return;
      }

      if (!existing.lines.includes(route.id)) existing.lines.push(route.id);
      if (!existing.labelPosition && station.labelPosition) existing.labelPosition = station.labelPosition;
      existing.interchange = existing.interchange || station.interchange === true;
    });
  });

  return stations;
}

function collectRawPoints(routes: NormalizedRoute[], stations: Map<string, MutableStation>): Array<[number, number]> {
  const points: Array<[number, number]> = [];

  routes.forEach((route) => {
    route.points.forEach((point) => points.push([point.x, point.y]));
  });
  stations.forEach((station) => points.push([station.x, station.y]));

  return points;
}

function computeExtent(points: Array<[number, number]>): SubwayLayoutResult['extent'] {
  if (!points.length) {
    return {
      minX: 0,
      minY: 0,
      maxX: 0,
      maxY: 0
    };
  }

  return points.reduce((extent, point) => ({
    minX: Math.min(extent.minX, point[0]),
    minY: Math.min(extent.minY, point[1]),
    maxX: Math.max(extent.maxX, point[0]),
    maxY: Math.max(extent.maxY, point[1])
  }), {
    minX: Number.POSITIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY
  });
}

function createProjector(
  extent: SubwayLayoutResult['extent'],
  width: number,
  height: number,
  padding: number,
  preserveAspectRatio: boolean
): (x: number, y: number) => { x: number; y: number } {
  const innerWidth = Math.max(width - padding * 2, 1);
  const innerHeight = Math.max(height - padding * 2, 1);
  const rangeX = extent.maxX - extent.minX;
  const rangeY = extent.maxY - extent.minY;
  const scaleX = rangeX > 0 ? innerWidth / rangeX : 1;
  const scaleY = rangeY > 0 ? innerHeight / rangeY : 1;
  const scale = preserveAspectRatio ? Math.min(scaleX, scaleY) : 1;
  const finalScaleX = preserveAspectRatio ? scale : scaleX;
  const finalScaleY = preserveAspectRatio ? scale : scaleY;
  const drawnWidth = rangeX > 0 ? rangeX * finalScaleX : 0;
  const drawnHeight = rangeY > 0 ? rangeY * finalScaleY : 0;
  const offsetX = padding + (innerWidth - drawnWidth) / 2;
  const offsetY = padding + (innerHeight - drawnHeight) / 2;

  return (x, y) => ({
    x: rangeX > 0 ? offsetX + (x - extent.minX) * finalScaleX : width / 2,
    y: rangeY > 0 ? offsetY + (y - extent.minY) * finalScaleY : height / 2
  });
}

function readCoord(item: Record<string, unknown>): [number, number] | null {
  if (Array.isArray(item.coord) && typeof item.coord[0] === 'number' && typeof item.coord[1] === 'number') {
    return [item.coord[0], item.coord[1]];
  }
  if (Array.isArray(item.value) && typeof item.value[0] === 'number' && typeof item.value[1] === 'number') {
    return [item.value[0], item.value[1]];
  }
  if (typeof item.x === 'number' && typeof item.y === 'number') {
    return [item.x, item.y];
  }
  return null;
}

function autoLabelPosition(x: number, width: number): SubwayLabelPosition {
  return x > width * 0.72 ? 'left' : 'right';
}

function normalizeLabelPosition(value: unknown): SubwayLabelPosition | undefined {
  return value === 'top' || value === 'bottom' || value === 'left' || value === 'right' ? value : undefined;
}

function normalizeOptionalId(value: unknown): string | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined;
  return normalizeId(value);
}

function normalizeId(value: unknown): string {
  return String(value == null || value === '' ? 'station' : value);
}

function normalizeName(value: unknown, fallback: string): string {
  return typeof value === 'string' && value ? value : fallback;
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function firstBoolean(...values: unknown[]): boolean | undefined {
  return values.find((value): value is boolean => typeof value === 'boolean');
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function asRecord(value: unknown): Record<string, unknown> {
  return isPlainObject(value) ? value : {};
}
