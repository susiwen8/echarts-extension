export const DEFAULT_PALETTE = [
  '#4e79a7',
  '#f28e8c',
  '#59a14f',
  '#b07aa1',
  '#f2b447',
  '#76b7b2',
  '#e15759',
  '#8cd17d',
  '#9c755f',
  '#bab0ab'
];

const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 400;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

export type VennLayoutMode = 'hollow' | 'bubble';

export interface VennLayoutOptions {
  width?: number;
  height?: number;
  padding?: number;
  minRadius?: number;
  maxRadius?: number;
  [key: string]: unknown;
}

export interface VennLayoutOption extends VennLayoutOptions {
  data?: unknown[];
  layout?: unknown;
  layoutOptions?: unknown;
  vennType?: unknown;
  mode?: unknown;
}

export interface VennCircle {
  id: string;
  name: string;
  value?: unknown;
  sets?: string[];
  setKey?: string;
  dataIndex: number;
  x: number;
  y: number;
  r: number;
  color?: string;
}

export interface VennLabel {
  id: string;
  name: string;
  value: unknown;
  sets?: string[];
  setKey?: string;
  dataIndex: number;
  x: number;
  y: number;
}

export interface VennLayoutResult {
  mode: VennLayoutMode;
  width: number;
  height: number;
  circles: VennCircle[];
  labels: VennLabel[];
}

interface NormalizedVennItem {
  id: string;
  name: string;
  value: unknown;
  sets: string[];
  setKey: string;
  dataIndex: number;
  color: string;
}

interface LayoutRect {
  width: number;
  height: number;
  padding: number;
}

interface SizeRect {
  width: number;
  height: number;
}

interface Point {
  x: number;
  y: number;
}

export function resolveVennLayout(option: VennLayoutOption = {}): VennLayoutResult {
  const data = Array.isArray(option.data) ? option.data : [];
  const layoutOption = option.layout;
  const layoutOptions: VennLayoutOptions = {
    ...(isPlainObject(layoutOption) ? layoutOption : {}),
    ...(isPlainObject(option.layoutOptions) ? option.layoutOptions : {}),
    width: finiteNumber(option.width, undefined),
    height: finiteNumber(option.height, undefined),
    padding: finiteNumber(option.padding, undefined),
    minRadius: finiteNumber(option.minRadius, undefined),
    maxRadius: finiteNumber(option.maxRadius, undefined)
  };
  const mode = resolveMode(option, data);

  return mode === 'bubble'
    ? layoutBubbleVenn(data, layoutOptions)
    : layoutHollowVenn(data, layoutOptions);
}

export function layoutHollowVenn(data: unknown[], options: VennLayoutOptions = {}): VennLayoutResult {
  const width = finiteNumber(options.width, DEFAULT_WIDTH);
  const height = finiteNumber(options.height, DEFAULT_HEIGHT);
  const padding = finiteNumber(options.padding, 24);
  const items = normalizeItems(data);
  const baseSets = resolveBaseSets(items).slice(0, 3);
  const circleCount = Math.max(1, Math.min(3, baseSets.length || items.length || 1));
  const circles = createHollowCircles(circleCount, baseSets, {
    width,
    height,
    padding
  });
  const labels = createHollowLabels(items, circles, {
    width,
    height
  });

  return {
    mode: 'hollow',
    width,
    height,
    circles,
    labels
  };
}

export function layoutBubbleVenn(data: unknown[], options: VennLayoutOptions = {}): VennLayoutResult {
  const width = finiteNumber(options.width, DEFAULT_WIDTH);
  const height = finiteNumber(options.height, DEFAULT_HEIGHT);
  const padding = finiteNumber(options.padding, 20);
  const innerWidth = Math.max(width - padding * 2, 1);
  const innerHeight = Math.max(height - padding * 2, 1);
  const minRadius = finiteNumber(options.minRadius, Math.max(12, Math.min(innerWidth, innerHeight) * 0.045));
  const maxRadius = finiteNumber(options.maxRadius, Math.max(minRadius, Math.min(innerWidth, innerHeight) * 0.22));
  const items = normalizeItems(data);
  const maxValue = Math.max(...items.map((item) => positiveNumber(item.value, 1)), 1);
  const center = {
    x: width / 2,
    y: height / 2
  };

  const circles = items
    .map((item) => ({
      ...item,
      r: resolveBubbleRadius(item.value, maxValue, minRadius, maxRadius)
    }))
    .sort((left, right) => {
      const valueDiff = positiveNumber(right.value, 0) - positiveNumber(left.value, 0);
      return valueDiff || left.dataIndex - right.dataIndex;
    })
    .map((item, sortedIndex) => {
      const point = placeBubble(sortedIndex, item.r, center, {
        width,
        height,
        padding,
        maxRadius
      });
      return {
        id: item.id,
        name: item.name,
        value: item.value,
        dataIndex: item.dataIndex,
        x: point.x,
        y: point.y,
        r: item.r,
        color: item.color
      };
    });

  return {
    mode: 'bubble',
    width,
    height,
    circles,
    labels: circles.map((circle): VennLabel => ({
      id: circle.id,
      name: circle.name,
      value: circle.value,
      dataIndex: circle.dataIndex,
      x: circle.x,
      y: circle.y
    }))
  };
}

function resolveMode(option: VennLayoutOption, data: unknown[]): VennLayoutMode {
  const layout = option.layout;
  const rawMode = typeof layout === 'string'
    ? layout
    : option.vennType || option.mode || (isPlainObject(layout) ? layout.type : undefined);
  if (rawMode === 'bubble' || rawMode === 'packed' || rawMode === 'circle') return 'bubble';
  if (rawMode === 'hollow' || rawMode === 'venn' || rawMode === 'outline') return 'hollow';
  return data.some((item) => isPlainObject(item) && Array.isArray(item.sets)) ? 'hollow' : 'bubble';
}

function createHollowCircles(count: number, baseSets: string[], rect: LayoutRect): VennCircle[] {
  if (count === 1) return createOneSetCircles(baseSets, rect);
  if (count === 2) return createTwoSetCircles(baseSets, rect);
  return createThreeSetCircles(baseSets, rect);
}

function createOneSetCircles(baseSets: string[], { width, height, padding }: LayoutRect): VennCircle[] {
  const id = baseSets[0] || 'A';
  const r = Math.max(1, Math.min(width - padding * 2, height - padding * 2) / 2);
  return [
    {
      id,
      name: id,
      sets: [id],
      setKey: id,
      dataIndex: -1,
      x: width / 2,
      y: height / 2,
      r
    }
  ];
}

function createTwoSetCircles(baseSets: string[], { width, height, padding }: LayoutRect): VennCircle[] {
  const ids = fillSetNames(baseSets, 2);
  const innerWidth = Math.max(width - padding * 2, 1);
  const innerHeight = Math.max(height - padding * 2, 1);
  const r = Math.max(1, Math.min(innerWidth * 0.34, innerHeight * 0.44));
  const distance = Math.min(r * 1.15, innerWidth - r * 2);
  const cy = height / 2;

  return ids.map((id, index) => ({
    id,
    name: id,
    sets: [id],
    setKey: id,
    dataIndex: -1,
    x: width / 2 + (index === 0 ? -distance / 2 : distance / 2),
    y: cy,
    r
  }));
}

function createThreeSetCircles(baseSets: string[], { width, height, padding }: LayoutRect): VennCircle[] {
  const ids = fillSetNames(baseSets, 3);
  const innerWidth = Math.max(width - padding * 2, 1);
  const innerHeight = Math.max(height - padding * 2, 1);
  const cx = width / 2;
  const cy = height / 2;
  const radiusBounds = [
    innerWidth * 0.29,
    innerHeight * 0.38,
    (width - padding - cx) / 1.75,
    (cx - padding) / 1.75,
    (height - padding - cy) / 1.55,
    (cy - padding) / 1.35
  ];
  const r = Math.max(1, Math.min(...radiusBounds.filter((value) => value > 0)));
  const horizontal = r * 0.72;
  const topOffset = r * 0.32;
  const bottomOffset = r * 0.55;
  const points = [
    [cx - horizontal, cy - topOffset],
    [cx + horizontal, cy - topOffset],
    [cx, cy + bottomOffset]
  ];

  return ids.map((id, index) => ({
    id,
    name: id,
    sets: [id],
    setKey: id,
    dataIndex: -1,
    x: points[index][0],
    y: points[index][1],
    r
  }));
}

function createHollowLabels(items: NormalizedVennItem[], circles: VennCircle[], { width, height }: SizeRect): VennLabel[] {
  const bySetKey = new Map(circles.map((circle) => [circle.setKey, circle]));
  const circleById = new Map(circles.map((circle) => [circle.id, circle]));
  const fallbackNames = circles.map((circle) => circle.id);

  return items.map((item): VennLabel => {
    const sets = item.sets.length ? item.sets : [fallbackNames[item.dataIndex] || item.name];
    const setKey = createSetKey(sets);
    const point = resolveHollowLabelPoint(sets, setKey, bySetKey, circleById, {
      width,
      height
    });

    return {
      id: item.id,
      name: item.name,
      value: item.value,
      sets,
      setKey,
      dataIndex: item.dataIndex,
      x: point.x,
      y: point.y
    };
  });
}

function resolveHollowLabelPoint(
  sets: string[],
  setKey: string,
  bySetKey: Map<string | undefined, VennCircle>,
  circleById: Map<string, VennCircle>,
  rect: SizeRect
): Point {
  const direct = bySetKey.get(setKey);
  if (direct) {
    if (bySetKey.size === 1) return { x: direct.x, y: direct.y };
    if (bySetKey.size === 2) {
      const offset = direct.x < rect.width / 2 ? -direct.r * 0.36 : direct.r * 0.36;
      return { x: direct.x + offset, y: direct.y };
    }
    const horizontal = direct.x < rect.width / 2 ? -direct.r * 0.38 : direct.x > rect.width / 2 ? direct.r * 0.38 : 0;
    const vertical = direct.y > rect.height / 2 ? direct.r * 0.42 : -direct.r * 0.06;
    return { x: direct.x + horizontal, y: direct.y + vertical };
  }

  const selected = sets.map((set) => circleById.get(set)).filter((circle): circle is VennCircle => Boolean(circle));
  if (!selected.length) return { x: rect.width / 2, y: rect.height / 2 };
  if (selected.length === 2) {
    const x = mean(selected.map((circle) => circle.x));
    const y = mean(selected.map((circle) => circle.y));
    const [first, second] = selected;
    const minR = Math.min(first.r, second.r);
    if (bySetKey.size === 3) {
      if (first.y < rect.height / 2 && second.y < rect.height / 2) {
        return { x, y: y - minR * 0.28 };
      }
      return {
        x: x + (x < rect.width / 2 ? -minR * 0.14 : minR * 0.14),
        y: y + minR * 0.1
      };
    }
    return { x, y };
  }

  return {
    x: mean(selected.map((circle) => circle.x)),
    y: mean(selected.map((circle) => circle.y)) + Math.min(...selected.map((circle) => circle.r)) * 0.08
  };
}

function resolveBaseSets(items: NormalizedVennItem[]): string[] {
  const base: string[] = [];
  items.forEach((item) => {
    if (item.sets.length === 1 && !base.includes(item.sets[0])) base.push(item.sets[0]);
  });
  items.forEach((item) => {
    item.sets.forEach((set) => {
      if (!base.includes(set)) base.push(set);
    });
  });
  return base;
}

function normalizeItems(data: unknown[]): NormalizedVennItem[] {
  return (Array.isArray(data) ? data : []).map((item, dataIndex) => {
    const record = isPlainObject(item) ? item : {};
    const name = String(record.name ?? record.id ?? dataIndex);
    const sets = normalizeSets(record.sets);
    const rawValue = record.value;
    const itemStyle = isPlainObject(record.itemStyle) ? record.itemStyle : {};
    const color = typeof itemStyle.color === 'string'
      ? itemStyle.color
      : DEFAULT_PALETTE[dataIndex % DEFAULT_PALETTE.length];
    return {
      id: String(record.id ?? name),
      name,
      value: Array.isArray(rawValue) ? rawValue[0] : rawValue,
      sets,
      setKey: createSetKey(sets),
      dataIndex,
      color
    };
  });
}

function normalizeSets(sets: unknown): string[] {
  if (!Array.isArray(sets)) return [];
  return Array.from(new Set(sets.map((set) => String(set))));
}

function createSetKey(sets: string[]): string {
  return sets.slice().sort().join('&');
}

function fillSetNames(baseSets: string[], count: number): string[] {
  const fallback = ['A', 'B', 'C'];
  const names = baseSets.slice(0, count);
  while (names.length < count) names.push(fallback[names.length]);
  return names;
}

function resolveBubbleRadius(value: unknown, maxValue: number, minRadius: number, maxRadius: number): number {
  const scale = Math.sqrt(positiveNumber(value, 0) / maxValue);
  return minRadius + (maxRadius - minRadius) * scale;
}

function placeBubble(index: number, radius: number, center: Point, options: LayoutRect & { maxRadius: number }): Point {
  if (index === 0) {
    return clampCircle(center.x, center.y, radius, options);
  }

  const distance = options.maxRadius * (0.46 + Math.sqrt(index) * 0.38) + radius * 0.48;
  const angle = index * GOLDEN_ANGLE - Math.PI / 7;
  const x = center.x + Math.cos(angle) * distance;
  const y = center.y + Math.sin(angle) * distance * 0.78;
  return clampCircle(x, y, radius, options);
}

function clampCircle(x: number, y: number, r: number, { width, height, padding }: LayoutRect): Point {
  return {
    x: clamp(x, padding + r, width - padding - r),
    y: clamp(y, padding + r, height - padding - r)
  };
}

function clamp(value: number, min: number, max: number): number {
  if (min > max) return (min + max) / 2;
  return Math.min(Math.max(value, min), max);
}

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function positiveNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;
}

function finiteNumber(value: unknown, fallback: undefined): number | undefined;
function finiteNumber(value: unknown, fallback: number): number;
function finiteNumber(value: unknown, fallback: number | undefined): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}
