const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 400;
const DEFAULT_PADDING = 12;
const DEFAULT_GAP = 1.5;
const DEFAULT_MAX_ITERATION = 24;
const EPSILON = 1e-6;

export const DEFAULT_VORONOI_TREEMAP_COLORS = [
  '#4f7cac',
  '#d7655b',
  '#5aa469',
  '#e5a93d',
  '#7f63b8',
  '#43a6a8',
  '#c45d89',
  '#8a8f3a',
  '#c77b35',
  '#5d7290'
];

export type VoronoiTreemapSort = boolean | 'none' | 'value' | 'name';
export type VoronoiTreemapField = string | number;

export interface VoronoiTreemapDataItem {
  id?: string | number;
  name?: string;
  label?: string | number;
  value?: number;
  children?: unknown[];
  itemStyle?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface VoronoiTreemapLayoutOptions {
  width?: number;
  height?: number;
  padding?: number;
  gap?: number;
  rootName?: string;
  rootVisible?: boolean;
  colors?: string[];
  sort?: VoronoiTreemapSort;
  maxIteration?: number;
  dimensions?: string[];
  nameField?: VoronoiTreemapField;
  valueField?: VoronoiTreemapField;
  childrenField?: string;
  [key: string]: unknown;
}

export interface VoronoiTreemapLayoutOption extends VoronoiTreemapLayoutOptions {
  data?: unknown;
  layout?: unknown;
  layoutOptions?: unknown;
}

export interface VoronoiTreemapNode {
  id: string;
  name: string;
  value: number;
  depth: number;
  parentId: string | null;
  children: VoronoiTreemapNode[];
  dataIndex: number;
  points: Array<[number, number]>;
  path: string;
  centroidX: number;
  centroidY: number;
  area: number;
  targetArea: number;
  percent: number;
  color: string;
  isLeaf: boolean;
  raw: unknown;
}

export interface VoronoiTreemapLayoutResult {
  width: number;
  height: number;
  padding: number;
  gap: number;
  rootVisible: boolean;
  root: VoronoiTreemapNode;
  nodes: VoronoiTreemapNode[];
}

interface Point {
  x: number;
  y: number;
}

interface MutableNode {
  id: string;
  name: string;
  value: number;
  depth: number;
  parent: MutableNode | null;
  children: MutableNode[];
  dataIndex: number;
  points: Point[];
  targetArea: number;
  color: string;
  raw: unknown;
  synthetic: boolean;
}

interface VoronoiSite {
  x: number;
  y: number;
  weight: number;
  targetArea: number;
}

interface VoronoiCell {
  points: Point[];
  site: VoronoiSite;
}

export function resolveVoronoiTreemapLayout(option: VoronoiTreemapLayoutOption = {}): VoronoiTreemapLayoutResult {
  const layout = isPlainObject(option.layout) ? option.layout : {};
  const nestedLayoutOptions = isPlainObject(option.layoutOptions) ? option.layoutOptions : {};
  const resolvedOptions: VoronoiTreemapLayoutOptions = {
    ...layout,
    ...nestedLayoutOptions,
    width: firstFiniteNumber(option.width, nestedLayoutOptions.width, layout.width),
    height: firstFiniteNumber(option.height, nestedLayoutOptions.height, layout.height),
    padding: firstFiniteNumber(option.padding, nestedLayoutOptions.padding, layout.padding),
    gap: firstFiniteNumber(option.gap, nestedLayoutOptions.gap, layout.gap),
    rootName: readStringOption(option.rootName, nestedLayoutOptions.rootName, layout.rootName),
    rootVisible: readBooleanOption(option.rootVisible, nestedLayoutOptions.rootVisible, layout.rootVisible),
    colors: normalizeColors(option.colors ?? nestedLayoutOptions.colors ?? layout.colors),
    sort: normalizeSort(option.sort ?? nestedLayoutOptions.sort ?? layout.sort),
    maxIteration: firstFiniteNumber(option.maxIteration, nestedLayoutOptions.maxIteration, layout.maxIteration),
    dimensions: normalizeDimensions(option.dimensions ?? nestedLayoutOptions.dimensions ?? layout.dimensions),
    nameField: readFieldOption(option.nameField ?? nestedLayoutOptions.nameField ?? layout.nameField),
    valueField: readFieldOption(option.valueField ?? nestedLayoutOptions.valueField ?? layout.valueField),
    childrenField: readStringOption(option.childrenField, nestedLayoutOptions.childrenField, layout.childrenField)
  };

  return layoutVoronoiTreemap(option.data, resolvedOptions);
}

export function layoutVoronoiTreemap(data: unknown, options: VoronoiTreemapLayoutOptions = {}): VoronoiTreemapLayoutResult {
  const width = finiteNumber(options.width, DEFAULT_WIDTH);
  const height = finiteNumber(options.height, DEFAULT_HEIGHT);
  const padding = Math.max(0, finiteNumber(options.padding, DEFAULT_PADDING));
  const gap = Math.max(0, finiteNumber(options.gap, DEFAULT_GAP));
  const rootVisible = typeof options.rootVisible === 'boolean' ? options.rootVisible : !Array.isArray(data);
  const colors = options.colors?.length ? options.colors : DEFAULT_VORONOI_TREEMAP_COLORS;
  const maxIteration = clamp(Math.round(finiteNumber(options.maxIteration, DEFAULT_MAX_ITERATION)), 1, 80);
  const root = normalizeRoot(data, options);

  computeValues(root, options);
  if (options.sort !== false && options.sort !== 'none') sortChildren(root, options.sort);
  assignColors(root, colors);

  const right = Math.max(width - padding, padding + 1);
  const bottom = Math.max(height - padding, padding + 1);
  root.points = [
    { x: padding, y: padding },
    { x: right, y: padding },
    { x: right, y: bottom },
    { x: padding, y: bottom }
  ];
  root.targetArea = polygonArea(root.points);

  if (root.value > 0) {
    layoutChildren(root, {
      gap,
      maxIteration
    });
  }

  const publicRoot = toPublicNode(root, root.value);
  const visibleNodes = flatten(root)
    .filter((node) => node.value > 0 && node.points.length >= 3 && (rootVisible || node !== root))
    .map((node) => toPublicNode(node, root.value));

  return {
    width,
    height,
    padding,
    gap,
    rootVisible,
    root: publicRoot,
    nodes: visibleNodes
  };
}

export function flattenVoronoiTreemapData(
  data: unknown,
  options: VoronoiTreemapLayoutOptions | string = {}
): unknown[] {
  const layoutOptions = typeof options === 'string' ? { rootName: options } : options;
  return flatten(normalizeRoot(data, layoutOptions))
    .filter((node) => node.dataIndex >= 0)
    .sort((left, right) => left.dataIndex - right.dataIndex)
    .map((node) => node.raw);
}

function normalizeRoot(data: unknown, options: VoronoiTreemapLayoutOptions): MutableNode {
  let nextDataIndex = 0;

  function createNode(
    raw: unknown,
    depth: number,
    parent: MutableNode | null,
    siblingIndex: number,
    forcedName?: string,
    synthetic = false
  ): MutableNode {
    const record = isPlainObject(raw) ? raw : {};
    const nameValue = forcedName ?? readField(raw, options.nameField ?? 'name', options.dimensions, 0, ['label', 'id']);
    const name = normalizeName(nameValue, `node-${siblingIndex}`);
    const idPart = record.id != null ? String(record.id) : `${name}-${siblingIndex}`;
    const id = parent ? `${parent.id}/${idPart}` : idPart;
    const node: MutableNode = {
      id,
      name,
      value: 0,
      depth,
      parent,
      children: [],
      dataIndex: synthetic ? -1 : nextDataIndex++,
      points: [],
      targetArea: 0,
      color: DEFAULT_VORONOI_TREEMAP_COLORS[depth % DEFAULT_VORONOI_TREEMAP_COLORS.length],
      raw,
      synthetic
    };
    const childrenSource = readChildren(raw, options.childrenField);
    node.children = childrenSource.map((child, index) => createNode(child, depth + 1, node, index));
    return node;
  }

  if (Array.isArray(data)) {
    return createNode({
      name: options.rootName || 'root',
      children: data
    }, 0, null, 0, options.rootName || 'root', true);
  }

  if (isPlainObject(data)) {
    return createNode(data, 0, null, 0, options.rootName);
  }

  return createNode({
    name: options.rootName || 'root',
    value: readNonNegativeNumber(data) ?? 0
  }, 0, null, 0, options.rootName || 'root');
}

function computeValues(node: MutableNode, options: VoronoiTreemapLayoutOptions): number {
  const children: MutableNode[] = [];
  let childTotal = 0;

  node.children.forEach((child) => {
    const childValue = computeValues(child, options);
    if (childValue <= 0) return;
    children.push(child);
    childTotal += childValue;
  });
  node.children = children;

  const explicitValue = readNonNegativeNumber(
    readField(node.raw, options.valueField ?? 'value', options.dimensions, 1, ['size', 'weight', 'amount'])
  );

  if (node.children.length) {
    node.value = Math.max(explicitValue ?? 0, childTotal);
    return node.value;
  }

  node.value = explicitValue ?? (node.synthetic ? 0 : 1);
  return node.value;
}

function sortChildren(node: MutableNode, sort: VoronoiTreemapSort | undefined): void {
  if (sort === 'name') {
    node.children.sort((left, right) => left.name.localeCompare(right.name) || right.value - left.value);
  } else {
    node.children.sort((left, right) => right.value - left.value || left.name.localeCompare(right.name));
  }
  node.children.forEach((child) => sortChildren(child, sort));
}

function assignColors(node: MutableNode, colors: string[], inheritedColor?: string): void {
  const baseColor = inheritedColor || colors[0] || DEFAULT_VORONOI_TREEMAP_COLORS[0];
  node.color = readItemColor(node.raw) || baseColor;
  node.children.forEach((child, index) => {
    const childBase = node.parent == null
      ? colors[index % colors.length]
      : adjustColor(baseColor, child.depth, index);
    assignColors(child, colors, childBase);
  });
}

function layoutChildren(node: MutableNode, options: { gap: number; maxIteration: number }): void {
  if (!node.children.length || node.points.length < 3 || polygonArea(node.points) <= EPSILON) return;

  const cells = node.children.length === 1
    ? [{
        points: node.points,
        site: {
          ...polygonCentroid(node.points),
          weight: 0,
          targetArea: polygonArea(node.points)
        }
      }]
    : partitionWeightedVoronoi(node.points, node.children, options.maxIteration);

  node.children.forEach((child, index) => {
    const cell = cells[index];
    const rawPoints = cleanPolygon(cell.points);
    const fallbackPoints = rawPoints.length >= 3
      ? rawPoints
      : createFallbackCell(node.points, cell.site);
    const childPoints = shrinkPolygon(fallbackPoints, options.gap);
    child.points = childPoints;
    child.targetArea = cell?.site.targetArea || polygonArea(child.points);
    layoutChildren(child, options);
  });
}

function partitionWeightedVoronoi(container: Point[], children: MutableNode[], maxIteration: number): VoronoiCell[] {
  const containerArea = polygonArea(container);
  const total = children.reduce((sum, child) => sum + child.value, 0);
  if (containerArea <= EPSILON || total <= 0) {
    return children.map(() => ({
      points: [],
      site: {
        ...polygonCentroid(container),
        weight: 0,
        targetArea: 0
      }
    }));
  }

  const bounds = polygonBounds(container);
  const centroid = polygonCentroid(container);
  const diagonalSquared = Math.max(
    (bounds.maxX - bounds.minX) ** 2 + (bounds.maxY - bounds.minY) ** 2,
    1
  );
  let sites = children.map((child, index) => {
    const targetArea = containerArea * (child.value / total);
    const point = initialSitePoint(container, centroid, bounds, index, children.length);
    return {
      x: point.x,
      y: point.y,
      weight: targetArea / Math.PI,
      targetArea
    };
  });

  for (let iteration = 0; iteration < maxIteration; iteration += 1) {
    const cells = createPowerCells(container, sites);
    let meanWeight = 0;
    sites = sites.map((site, index) => {
      const cell = cells[index];
      const area = polygonArea(cell.points);
      const center = cell.points.length >= 3 ? polygonCentroid(cell.points) : site;
      const targetArea = site.targetArea;
      let weight = site.weight + (targetArea - area) * 0.82;
      if (area <= EPSILON) weight += targetArea * 1.4;
      weight = clamp(weight, -diagonalSquared * 2, diagonalSquared * 2);
      meanWeight += weight;
      return {
        x: center.x,
        y: center.y,
        weight,
        targetArea
      };
    });

    meanWeight /= Math.max(sites.length, 1);
    sites = sites.map((site) => ({
      ...site,
      weight: site.weight - meanWeight
    }));
  }

  return createPowerCells(container, sites).map((cell, index) => {
    if (cell.points.length >= 3 && polygonArea(cell.points) > EPSILON) return cell;
    return {
      points: createFallbackCell(container, sites[index]),
      site: sites[index]
    };
  });
}

function initialSitePoint(
  polygon: Point[],
  centroid: Point,
  bounds: { minX: number; minY: number; maxX: number; maxY: number },
  index: number,
  count: number
): Point {
  const angle = index * Math.PI * (3 - Math.sqrt(5));
  const radius = Math.sqrt((index + 0.5) / Math.max(count, 1)) * Math.min(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY) * 0.42;
  const candidate = {
    x: centroid.x + Math.cos(angle) * radius,
    y: centroid.y + Math.sin(angle) * radius
  };
  if (pointInPolygon(candidate, polygon)) return candidate;

  for (let factor = 0.8; factor > 0; factor -= 0.2) {
    const point = {
      x: centroid.x + (candidate.x - centroid.x) * factor,
      y: centroid.y + (candidate.y - centroid.y) * factor
    };
    if (pointInPolygon(point, polygon)) return point;
  }
  return centroid;
}

function createPowerCells(container: Point[], sites: VoronoiSite[]): VoronoiCell[] {
  return sites.map((site, siteIndex) => {
    let cell = container.slice();
    for (let otherIndex = 0; otherIndex < sites.length && cell.length >= 3; otherIndex += 1) {
      if (siteIndex === otherIndex) continue;
      const other = sites[otherIndex];
      const a = 2 * (other.x - site.x);
      const b = 2 * (other.y - site.y);
      const c = other.x * other.x + other.y * other.y - site.x * site.x - site.y * site.y + site.weight - other.weight;
      cell = clipPolygonByHalfPlane(cell, a, b, c);
    }
    return {
      points: cleanPolygon(cell),
      site
    };
  });
}

function clipPolygonByHalfPlane(points: Point[], a: number, b: number, c: number): Point[] {
  if (points.length < 3) return [];
  const result: Point[] = [];

  function signedDistance(point: Point): number {
    return a * point.x + b * point.y - c;
  }

  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    const currentDistance = signedDistance(current);
    const nextDistance = signedDistance(next);
    const currentInside = currentDistance <= EPSILON;
    const nextInside = nextDistance <= EPSILON;

    if (currentInside && nextInside) {
      result.push(next);
    } else if (currentInside && !nextInside) {
      result.push(intersection(current, next, currentDistance, nextDistance));
    } else if (!currentInside && nextInside) {
      result.push(intersection(current, next, currentDistance, nextDistance));
      result.push(next);
    }
  }

  return cleanPolygon(result);
}

function intersection(current: Point, next: Point, currentDistance: number, nextDistance: number): Point {
  const denominator = currentDistance - nextDistance;
  if (Math.abs(denominator) <= EPSILON) return current;
  const t = currentDistance / denominator;
  return {
    x: current.x + (next.x - current.x) * t,
    y: current.y + (next.y - current.y) * t
  };
}

function createFallbackCell(container: Point[], site: Pick<VoronoiSite, 'x' | 'y' | 'targetArea'>): Point[] {
  const radius = Math.max(1, Math.sqrt(Math.max(site.targetArea, 1)) * 0.18);
  const candidate = [
    { x: site.x, y: site.y - radius },
    { x: site.x + radius, y: site.y },
    { x: site.x, y: site.y + radius },
    { x: site.x - radius, y: site.y }
  ];
  let clipped = candidate;
  const orientation = signedPolygonArea(container) >= 0 ? 1 : -1;
  for (let index = 0; index < container.length && clipped.length >= 3; index += 1) {
    const start = container[index];
    const end = container[(index + 1) % container.length];
    const a = orientation * (start.y - end.y);
    const b = orientation * (end.x - start.x);
    const c = orientation * (start.y * end.x - start.x * end.y);
    clipped = clipPolygonByHalfPlane(clipped, a, b, c);
  }
  const candidates = [container, clipped];
  return cleanPolygon(candidates[Number(clipped.length >= 3)]);
}

function shrinkPolygon(points: Point[], gap: number): Point[] {
  if (gap <= 0 || points.length < 3) return points;
  const centroid = polygonCentroid(points);
  const originalArea = polygonArea(points);
  const shrunk = points.map((point) => {
    const dx = point.x - centroid.x;
    const dy = point.y - centroid.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance <= EPSILON) return point;
    const offset = Math.min(gap, distance * 0.42);
    const scale = Math.max(0, (distance - offset) / distance);
    return {
      x: centroid.x + dx * scale,
      y: centroid.y + dy * scale
    };
  });
  return cleanPolygon(shrunk);
}

function toPublicNode(node: MutableNode, total: number): VoronoiTreemapNode {
  const points = node.points.map((point): [number, number] => [round(point.x), round(point.y)]);
  const centroid = polygonCentroid(node.points);
  const area = polygonArea(node.points);
  return {
    id: node.id,
    name: node.name,
    value: round(node.value),
    depth: node.depth,
    parentId: node.parent ? node.parent.id : null,
    children: node.children.map((child) => toPublicNode(child, total)),
    dataIndex: node.dataIndex,
    points,
    path: pointsToPath(points),
    centroidX: round(centroid.x),
    centroidY: round(centroid.y),
    area: round(area),
    targetArea: round(node.targetArea),
    percent: total > 0 ? round(node.value / total, 6) : 0,
    color: node.color,
    isLeaf: node.children.length === 0,
    raw: node.raw
  };
}

function pointsToPath(points: Array<[number, number]>): string {
  if (!points.length) return '';
  const [first, ...rest] = points;
  return [
    `M ${formatPathNumber(first[0])} ${formatPathNumber(first[1])}`,
    ...rest.map(([x, y]) => `L ${formatPathNumber(x)} ${formatPathNumber(y)}`),
    'Z'
  ].join(' ');
}

function polygonArea(points: Point[]): number {
  return Math.abs(signedPolygonArea(points));
}

function signedPolygonArea(points: Point[]): number {
  if (points.length < 3) return 0;
  let area = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    area += current.x * next.y - next.x * current.y;
  }
  return area / 2;
}

function polygonCentroid(points: Point[]): Point {
  if (!points.length) return { x: 0, y: 0 };
  const area = signedPolygonArea(points);
  if (Math.abs(area) <= EPSILON) {
    const sum = points.reduce((acc, point) => ({
      x: acc.x + point.x,
      y: acc.y + point.y
    }), { x: 0, y: 0 });
    return {
      x: sum.x / points.length,
      y: sum.y / points.length
    };
  }

  let x = 0;
  let y = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    const cross = current.x * next.y - next.x * current.y;
    x += (current.x + next.x) * cross;
    y += (current.y + next.y) * cross;
  }

  return {
    x: x / (6 * area),
    y: y / (6 * area)
  };
}

function polygonBounds(points: Point[]): { minX: number; minY: number; maxX: number; maxY: number } {
  return points.reduce((bounds, point) => ({
    minX: Math.min(bounds.minX, point.x),
    minY: Math.min(bounds.minY, point.y),
    maxX: Math.max(bounds.maxX, point.x),
    maxY: Math.max(bounds.maxY, point.y)
  }), {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity
  });
}

function pointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let index = 0, previousIndex = polygon.length - 1; index < polygon.length; previousIndex = index, index += 1) {
    const current = polygon[index];
    const previous = polygon[previousIndex];
    const intersects = (current.y > point.y) !== (previous.y > point.y)
      && point.x < ((previous.x - current.x) * (point.y - current.y)) / (previous.y - current.y) + current.x;
    if (intersects) inside = !inside;
  }
  return inside;
}

function cleanPolygon(points: Point[]): Point[] {
  const result: Point[] = [];
  points.forEach((point) => {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return;
    const previous = result[result.length - 1];
    if (previous && distanceSquared(previous, point) <= EPSILON * EPSILON) return;
    result.push(point);
  });
  if (result.length > 1 && distanceSquared(result[0], result[result.length - 1]) <= EPSILON * EPSILON) {
    result.pop();
  }
  return result.length >= 3 && polygonArea(result) > EPSILON ? result : [];
}

function flatten(node: MutableNode): MutableNode[] {
  return [node, ...node.children.flatMap(flatten)];
}

function readChildren(raw: unknown, childrenField = 'children'): unknown[] {
  if (!isPlainObject(raw)) return [];
  const value = raw[childrenField];
  if (Array.isArray(value)) return value;
  if (childrenField !== 'children' && Array.isArray(raw.children)) return raw.children;
  return [];
}

function readField(
  item: unknown,
  field: VoronoiTreemapField,
  dimensions: string[] | undefined,
  fallbackIndex: number,
  fallbackNames: string[]
): unknown {
  if (Array.isArray(item)) {
    const index = typeof field === 'number' ? field : dimensions?.indexOf(field);
    return item[index != null && index >= 0 ? index : fallbackIndex];
  }

  if (!isPlainObject(item)) return undefined;
  if (typeof field === 'string') {
    const direct = readPath(item, field);
    if (direct != null) return direct;
  }
  for (const fallbackName of fallbackNames) {
    const value = readPath(item, fallbackName);
    if (value != null) return value;
  }
  return undefined;
}

function readPath(item: Record<string, unknown>, path: string): unknown {
  if (item[path] != null) return item[path];
  if (!path.includes('.')) return undefined;
  return path.split('.').reduce<unknown>((current, key) => {
    if (!isPlainObject(current)) return undefined;
    return current[key];
  }, item);
}

function readNonNegativeNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  }
  return undefined;
}

function readItemColor(raw: unknown): string | undefined {
  if (!isPlainObject(raw) || !isPlainObject(raw.itemStyle)) return undefined;
  const color = raw.itemStyle.color;
  return typeof color === 'string' && color ? color : undefined;
}

function normalizeName(value: unknown, fallback: string): string {
  if (typeof value === 'string' && value.length) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return fallback;
}

function normalizeSort(value: unknown): VoronoiTreemapSort | undefined {
  return value === false || value === true || value === 'none' || value === 'value' || value === 'name'
    ? value
    : undefined;
}

function normalizeColors(value: unknown): string[] | undefined {
  return Array.isArray(value) ? value.filter((color): color is string => typeof color === 'string') : undefined;
}

function normalizeDimensions(value: unknown): string[] | undefined {
  return Array.isArray(value) ? value.filter((dimension): dimension is string => typeof dimension === 'string') : undefined;
}

function readFieldOption(value: unknown): VoronoiTreemapField | undefined {
  return typeof value === 'string' || typeof value === 'number' ? value : undefined;
}

function readStringOption(...values: unknown[]): string | undefined {
  const value = values.find((item) => typeof item === 'string' && item.length);
  return typeof value === 'string' ? value : undefined;
}

function readBooleanOption(...values: unknown[]): boolean | undefined {
  const value = values.find((item) => typeof item === 'boolean');
  return typeof value === 'boolean' ? value : undefined;
}

function adjustColor(color: string, depth: number, index: number): string {
  const hex = parseHexColor(color);
  if (!hex) return color;
  const amount = Math.min(0.22, 0.08 + depth * 0.025 + (index % 3) * 0.025);
  return rgbToHex(
    mixChannel(hex.r, 255, amount),
    mixChannel(hex.g, 255, amount),
    mixChannel(hex.b, 255, amount)
  );
}

function parseHexColor(color: string): { r: number; g: number; b: number } | null {
  const match = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!match) return null;
  const raw = match[1];
  const value = raw.length === 3
    ? raw.split('').map((part) => `${part}${part}`).join('')
    : raw;
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16)
  };
}

function mixChannel(source: number, target: number, amount: number): number {
  return Math.round(source + (target - source) * amount);
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((value) => clamp(value, 0, 255).toString(16).padStart(2, '0')).join('')}`;
}

function finiteNumber(value: unknown, fallback: undefined): number | undefined;
function finiteNumber(value: unknown, fallback: number): number;
function finiteNumber(value: unknown, fallback: number | undefined): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function firstFiniteNumber(...values: unknown[]): number | undefined {
  const value = values.find((item) => typeof item === 'number' && Number.isFinite(item));
  return typeof value === 'number' ? value : undefined;
}

function distanceSquared(left: Point, right: Point): number {
  const dx = left.x - right.x;
  const dy = left.y - right.y;
  return dx * dx + dy * dy;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function round(value: number, digits = 3): number {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function formatPathNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

export const __test__ = {
  normalizeRoot,
  computeValues,
  sortChildren,
  assignColors,
  layoutChildren,
  partitionWeightedVoronoi,
  initialSitePoint,
  createPowerCells,
  clipPolygonByHalfPlane,
  intersection,
  createFallbackCell,
  shrinkPolygon,
  toPublicNode,
  pointsToPath,
  polygonArea,
  signedPolygonArea,
  polygonCentroid,
  polygonBounds,
  pointInPolygon,
  cleanPolygon,
  flatten,
  readChildren,
  readField,
  readPath,
  readNonNegativeNumber,
  readItemColor,
  normalizeName,
  normalizeSort,
  normalizeColors,
  normalizeDimensions,
  readFieldOption,
  readStringOption,
  readBooleanOption,
  adjustColor,
  parseHexColor,
  mixChannel,
  rgbToHex,
  finiteNumber,
  firstFiniteNumber,
  distanceSquared,
  clamp,
  round,
  formatPathNumber,
  isPlainObject
};
