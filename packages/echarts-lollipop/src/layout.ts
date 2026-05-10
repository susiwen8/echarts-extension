const DEFAULT_WIDTH = 720;
const DEFAULT_HEIGHT = 460;
const DEFAULT_PADDING = 48;
const DEFAULT_TICK_COUNT = 5;
const EPSILON = 1e-9;

export type LollipopField = string | number;
export type LollipopPaddingOption = number | Partial<LollipopPadding>;

export interface LollipopPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface LollipopDataItem {
  id?: string | number;
  name?: string;
  category?: string | number;
  value?: unknown;
  itemStyle?: Record<string, unknown>;
  stemStyle?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface LollipopLayoutOptions {
  width?: number;
  height?: number;
  padding?: LollipopPaddingOption;
  categoryField?: LollipopField;
  valueField?: LollipopField;
  nameField?: LollipopField;
  dimensions?: string[];
  categories?: Array<string | number>;
  min?: number;
  max?: number;
  baseline?: number;
  tickCount?: number;
  nice?: boolean;
  [key: string]: unknown;
}

export interface LollipopLayoutOption extends LollipopLayoutOptions {
  data?: unknown[];
  layout?: unknown;
  layoutOptions?: unknown;
}

export interface LollipopPlotRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export interface LollipopTick {
  value: number;
  x1: number;
  x2: number;
  y: number;
}

export interface LollipopCategoryLabel {
  name: string;
  value: string;
  x: number;
  y: number;
  align: string;
  verticalAlign: string;
}

export interface LollipopPoint {
  id: string;
  name: string;
  category: string;
  categoryValue: unknown;
  value: number;
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  dataIndex: number;
  raw: unknown;
}

export interface LollipopLayoutResult {
  width: number;
  height: number;
  padding: LollipopPadding;
  plot: LollipopPlotRect;
  categories: string[];
  valueExtent: {
    min: number;
    max: number;
  };
  baseline: number;
  baselineY: number;
  ticks: LollipopTick[];
  categoryLabels: LollipopCategoryLabel[];
  points: LollipopPoint[];
}

interface NormalizedItem {
  id: string;
  name: string;
  category: string;
  categoryValue: unknown;
  value: number;
  dataIndex: number;
  raw: unknown;
}

export function resolveLollipopLayout(option: LollipopLayoutOption = {}): LollipopLayoutResult {
  const layout = isPlainObject(option.layout) ? option.layout : {};
  const layoutOptions = isPlainObject(option.layoutOptions) ? option.layoutOptions : {};
  const merged: LollipopLayoutOptions = {
    ...layout,
    ...layoutOptions,
    width: finiteNumber(option.width, finiteNumber(layoutOptions.width, finiteNumber(layout.width, DEFAULT_WIDTH))),
    height: finiteNumber(option.height, finiteNumber(layoutOptions.height, finiteNumber(layout.height, DEFAULT_HEIGHT))),
    padding: readPaddingOption(option.padding ?? layoutOptions.padding ?? layout.padding),
    categoryField: readFieldOption(option.categoryField ?? layoutOptions.categoryField ?? layout.categoryField),
    valueField: readFieldOption(option.valueField ?? layoutOptions.valueField ?? layout.valueField),
    nameField: readFieldOption(option.nameField ?? layoutOptions.nameField ?? layout.nameField),
    dimensions: normalizeDimensions(option.dimensions ?? layoutOptions.dimensions ?? layout.dimensions),
    categories: normalizeCategories(option.categories ?? layoutOptions.categories ?? layout.categories),
    min: finiteNumber(option.min, finiteNumber(layoutOptions.min, finiteNumber(layout.min, undefined))),
    max: finiteNumber(option.max, finiteNumber(layoutOptions.max, finiteNumber(layout.max, undefined))),
    baseline: finiteNumber(option.baseline, finiteNumber(layoutOptions.baseline, finiteNumber(layout.baseline, undefined))),
    tickCount: finiteNumber(option.tickCount, finiteNumber(layoutOptions.tickCount, finiteNumber(layout.tickCount, undefined))),
    nice: firstBoolean(option.nice, layoutOptions.nice, layout.nice)
  };

  return layoutLollipop(Array.isArray(option.data) ? option.data : [], merged);
}

export function layoutLollipop(data: unknown[], options: LollipopLayoutOptions = {}): LollipopLayoutResult {
  const width = Math.max(1, finiteNumber(options.width, DEFAULT_WIDTH));
  const height = Math.max(1, finiteNumber(options.height, DEFAULT_HEIGHT));
  const padding = normalizePadding(options.padding);
  const plot = createPlotRect(width, height, padding);
  const baseline = finiteNumber(options.baseline, 0);
  const normalized = normalizeItems(data, options);
  const categories = resolveCategories(normalized, options);
  const ordered = orderByCategory(normalized, categories);
  const valueExtent = resolveValueExtent(ordered, options, baseline);
  const tickCount = Math.max(2, Math.round(finiteNumber(options.tickCount, DEFAULT_TICK_COUNT)));
  const ticks = createTicks(valueExtent.min, valueExtent.max, tickCount).map((value) => ({
    value,
    x1: plot.left,
    x2: plot.right,
    y: projectValue(value, valueExtent, plot)
  }));
  const baselineY = projectValue(clamp(baseline, valueExtent.min, valueExtent.max), valueExtent, plot);
  const categoryLabels = categories.map((category, index) => ({
    name: category,
    value: category,
    x: projectCategory(index, categories.length, plot),
    y: plot.bottom + 14,
    align: 'right',
    verticalAlign: 'middle'
  }));
  const points = ordered.map((item) => {
    const categoryIndex = Math.max(0, categories.indexOf(item.category));
    const x = projectCategory(categoryIndex, categories.length, plot);
    const y = projectValue(item.value, valueExtent, plot);
    return {
      id: item.id,
      name: item.name,
      category: item.category,
      categoryValue: item.categoryValue,
      value: item.value,
      x,
      y,
      baseX: x,
      baseY: baselineY,
      dataIndex: item.dataIndex,
      raw: item.raw
    };
  });

  return {
    width,
    height,
    padding,
    plot,
    categories,
    valueExtent,
    baseline,
    baselineY,
    ticks,
    categoryLabels,
    points
  };
}

function normalizeItems(data: unknown[], options: LollipopLayoutOptions): NormalizedItem[] {
  const dimensions = normalizeDimensions(options.dimensions);
  const normalized: NormalizedItem[] = [];

  data.forEach((item, dataIndex) => {
    const categoryValue = readField(item, options.categoryField ?? 'category', dimensions, 0, ['name', 'country', 'label']);
    const value = finiteNumber(readField(item, options.valueField ?? 'value', dimensions, 1, [
      'population',
      'amount',
      'count',
      'users',
      'total'
    ]), NaN);
    if (!Number.isFinite(value)) return;

    const nameValue = readField(item, options.nameField ?? 'name', dimensions, -1, []);
    const category = stringifyName(categoryValue ?? nameValue ?? `item-${dataIndex}`);
    const name = stringifyName(nameValue ?? category);
    const record = isPlainObject(item) ? item : {};

    normalized.push({
      id: stringifyName(record.id ?? (category || name || `item-${dataIndex}`)),
      name,
      category,
      categoryValue,
      value,
      dataIndex,
      raw: item
    });
  });

  return normalized;
}

function resolveCategories(items: NormalizedItem[], options: LollipopLayoutOptions): string[] {
  const explicit = normalizeCategories(options.categories);
  if (explicit.length) return explicit.filter((category) => items.some((item) => item.category === category));
  return unique(items.map((item) => item.category));
}

function orderByCategory(items: NormalizedItem[], categories: string[]): NormalizedItem[] {
  const order = new Map(categories.map((category, index) => [category, index]));
  return items
    .filter((item) => order.has(item.category))
    .sort((left, right) => {
      const leftOrder = order.get(left.category) as number;
      const rightOrder = order.get(right.category) as number;
      return leftOrder - rightOrder || left.dataIndex - right.dataIndex;
    });
}

function resolveValueExtent(
  items: NormalizedItem[],
  options: LollipopLayoutOptions,
  baseline: number
): { min: number; max: number } {
  const values = items.map((item) => item.value).filter(Number.isFinite);
  values.push(baseline);
  let min = finiteNumber(options.min, Math.min(...values));
  let max = finiteNumber(options.max, Math.max(...values));

  if (Math.abs(max - min) < EPSILON) {
    min -= 1;
    max += 1;
  }

  if (options.nice !== false && (options.min == null || options.max == null)) {
    const nice = niceExtent(min, max, Math.max(2, Math.round(finiteNumber(options.tickCount, DEFAULT_TICK_COUNT))));
    if (options.min == null) min = nice.min;
    if (options.max == null) max = nice.max;
  }

  return normalizeFinalExtent(min, max);
}

function normalizeFinalExtent(min: number, max: number): { min: number; max: number } {
  if (max < min) [min, max] = [max, min];
  if (Math.abs(max - min) < EPSILON) max = min + 1;
  return { min, max };
}

function createTicks(min: number, max: number, tickCount: number): number[] {
  if (tickCount <= 1) return [cleanNumber(min), cleanNumber(max)];
  const step = (max - min) / (tickCount - 1);
  return Array.from({ length: tickCount }, (_, index) => cleanNumber(index === tickCount - 1 ? max : min + step * index));
}

function projectCategory(index: number, count: number, plot: LollipopPlotRect): number {
  if (count <= 1) return plot.left + plot.width / 2;
  return plot.left + plot.width * (index / (count - 1));
}

function projectValue(value: number, extent: { min: number; max: number }, plot: LollipopPlotRect): number {
  const ratio = (value - extent.min) / Math.max(extent.max - extent.min, EPSILON);
  return plot.bottom - clamp(ratio, 0, 1) * plot.height;
}

function createPlotRect(width: number, height: number, padding: LollipopPadding): LollipopPlotRect {
  const left = clamp(padding.left, 0, Math.max(width - 1, 0));
  const top = clamp(padding.top, 0, Math.max(height - 1, 0));
  const right = Math.max(left + 1, width - Math.max(0, padding.right));
  const bottom = Math.max(top + 1, height - Math.max(0, padding.bottom));

  return {
    left,
    top,
    right,
    bottom,
    width: Math.max(1, right - left),
    height: Math.max(1, bottom - top)
  };
}

function normalizePadding(value: unknown): LollipopPadding {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const padding = Math.max(0, value);
    return {
      top: padding,
      right: padding,
      bottom: padding,
      left: padding
    };
  }

  if (isPlainObject(value)) {
    return {
      top: Math.max(0, finiteNumber(value.top, DEFAULT_PADDING)),
      right: Math.max(0, finiteNumber(value.right, DEFAULT_PADDING)),
      bottom: Math.max(0, finiteNumber(value.bottom, DEFAULT_PADDING)),
      left: Math.max(0, finiteNumber(value.left, DEFAULT_PADDING))
    };
  }

  return {
    top: DEFAULT_PADDING,
    right: DEFAULT_PADDING,
    bottom: DEFAULT_PADDING,
    left: DEFAULT_PADDING
  };
}

function readPaddingOption(value: unknown): LollipopPaddingOption | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (isPlainObject(value)) {
    return {
      top: finiteNumber(value.top, undefined),
      right: finiteNumber(value.right, undefined),
      bottom: finiteNumber(value.bottom, undefined),
      left: finiteNumber(value.left, undefined)
    };
  }
  return undefined;
}

function readField(
  item: unknown,
  field: LollipopField,
  dimensions: string[] | undefined,
  fallbackIndex: number,
  fallbackNames: string[]
): unknown {
  if (Array.isArray(item)) {
    const index = typeof field === 'number' ? field : dimensions?.indexOf(field);
    const resolvedIndex = index != null && index >= 0 ? index : fallbackIndex;
    return resolvedIndex >= 0 ? item[resolvedIndex] : undefined;
  }

  if (!isPlainObject(item)) return undefined;
  if (typeof field === 'string' && item[field] != null) return item[field];
  if (typeof field === 'number') return undefined;
  for (const fallbackName of fallbackNames) {
    if (item[fallbackName] != null) return item[fallbackName];
  }
  return undefined;
}

function niceExtent(min: number, max: number, tickCount: number): { min: number; max: number } {
  const span = Math.max(max - min, EPSILON);
  const step = niceStep(span / Math.max(1, tickCount - 1));
  return {
    min: Math.floor(min / step) * step,
    max: Math.ceil(max / step) * step
  };
}

function niceStep(rawStep: number): number {
  const exponent = Math.floor(Math.log10(Math.max(rawStep, EPSILON)));
  const power = 10 ** exponent;
  const fraction = rawStep / power;
  let niceFraction = 10;
  if (fraction <= 1) niceFraction = 1;
  else if (fraction <= 2) niceFraction = 2;
  else if (fraction <= 5) niceFraction = 5;
  return niceFraction * power;
}

function normalizeDimensions(value: unknown): string[] | undefined {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : undefined;
}

function normalizeCategories(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => stringifyName(item)) : [];
}

function readFieldOption(value: unknown): LollipopField | undefined {
  return typeof value === 'string' || typeof value === 'number' ? value : undefined;
}

function firstBoolean(...values: unknown[]): boolean | undefined {
  return values.find((value): value is boolean => typeof value === 'boolean');
}

function unique(values: string[]): string[] {
  const result: string[] = [];
  const seen = new Set<string>();
  values.forEach((value) => {
    if (seen.has(value)) return;
    seen.add(value);
    result.push(value);
  });
  return result;
}

function stringifyName(value: unknown): string {
  if (typeof value === 'string' && value.length) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function finiteNumber(value: unknown, fallback: number): number;
function finiteNumber(value: unknown, fallback: undefined): number | undefined;
function finiteNumber(value: unknown, fallback: number | undefined): number | undefined;
function finiteNumber(value: unknown, fallback: number | undefined): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function cleanNumber(value: number): number {
  const rounded = Number(value.toFixed(12));
  return Object.is(rounded, -0) ? 0 : rounded;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

export const __test__ = {
  normalizeItems,
  resolveCategories,
  orderByCategory,
  resolveValueExtent,
  normalizeFinalExtent,
  createTicks,
  projectCategory,
  projectValue,
  createPlotRect,
  normalizePadding,
  readPaddingOption,
  readField,
  niceExtent,
  niceStep,
  normalizeDimensions,
  normalizeCategories,
  readFieldOption,
  firstBoolean,
  unique,
  stringifyName,
  finiteNumber,
  cleanNumber,
  clamp,
  isPlainObject
};
