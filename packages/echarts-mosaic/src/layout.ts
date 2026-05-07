const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 400;
const DEFAULT_PADDING = 12;
const DEFAULT_GAP = 1;
const EMPTY_VALUE = '(empty)';

export const DEFAULT_MOSAIC_COLORS = [
  '#4e79a7',
  '#f28e8c',
  '#59a14f',
  '#f2b447',
  '#76b7b2',
  '#b07aa1',
  '#e15759',
  '#8cd17d',
  '#9c755f',
  '#bab0ab'
];

export type MosaicSort = boolean | 'none' | 'value' | 'name';
export type MosaicField = string | number;

export interface MosaicDataItem {
  id?: string | number;
  name?: string;
  value?: unknown;
  itemStyle?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface MosaicLayoutOptions {
  width?: number;
  height?: number;
  padding?: number;
  gap?: number;
  xField?: MosaicField;
  yField?: MosaicField;
  valueField?: MosaicField;
  dimensions?: string[];
  xCategories?: Array<string | number>;
  yCategories?: Array<string | number>;
  colors?: string[];
  sort?: MosaicSort;
  [key: string]: unknown;
}

export interface MosaicLayoutOption extends MosaicLayoutOptions {
  data?: unknown[];
  layout?: unknown;
  layoutOptions?: unknown;
}

export interface MosaicTile {
  id: string;
  name: string;
  xCategory: string;
  yCategory: string;
  value: number;
  total: number;
  percent: number;
  columnPercent: number;
  dataIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  raw: unknown;
}

export interface MosaicLayoutResult {
  width: number;
  height: number;
  padding: number;
  gap: number;
  total: number;
  xCategories: string[];
  yCategories: string[];
  xTotals: Record<string, number>;
  yTotals: Record<string, number>;
  tiles: MosaicTile[];
}

interface NormalizedMosaicItem {
  id: string;
  name: string;
  xCategory: string;
  yCategory: string;
  value: number;
  dataIndex: number;
  raw: unknown;
}

interface MutableCell extends NormalizedMosaicItem {
  rawItems: unknown[];
}

export function resolveMosaicLayout(option: MosaicLayoutOption = {}): MosaicLayoutResult {
  const layoutOptions: MosaicLayoutOptions = {
    ...(isPlainObject(option.layout) ? option.layout : {}),
    ...(isPlainObject(option.layoutOptions) ? option.layoutOptions : {}),
    width: finiteNumber(option.width, undefined),
    height: finiteNumber(option.height, undefined),
    padding: finiteNumber(option.padding, undefined),
    gap: finiteNumber(option.gap, undefined),
    xField: option.xField,
    yField: option.yField,
    valueField: option.valueField,
    dimensions: Array.isArray(option.dimensions) ? option.dimensions.filter((item): item is string => typeof item === 'string') : undefined,
    xCategories: normalizeExplicitCategories(option.xCategories),
    yCategories: normalizeExplicitCategories(option.yCategories),
    colors: Array.isArray(option.colors) ? option.colors.filter((color): color is string => typeof color === 'string') : undefined,
    sort: option.sort
  };

  return layoutMosaic(Array.isArray(option.data) ? option.data : [], layoutOptions);
}

export function layoutMosaic(data: unknown[], options: MosaicLayoutOptions = {}): MosaicLayoutResult {
  const width = finiteNumber(options.width, DEFAULT_WIDTH);
  const height = finiteNumber(options.height, DEFAULT_HEIGHT);
  const padding = Math.max(0, finiteNumber(options.padding, DEFAULT_PADDING));
  const gap = Math.max(0, finiteNumber(options.gap, DEFAULT_GAP));
  const colors = options.colors?.length ? options.colors : DEFAULT_MOSAIC_COLORS;
  const normalized = normalizeItems(data, options).filter((item) => item.value > 0);
  const cells = mergeCells(normalized);
  const grandTotal = cells.reduce((sum, item) => sum + item.value, 0);
  const xTotals = sumBy(cells, 'xCategory');
  const yTotals = sumBy(cells, 'yCategory');
  const xCategories = resolveCategories('xCategory', cells, normalizeExplicitCategories(options.xCategories), xTotals, options.sort);
  const yCategories = resolveCategories('yCategory', cells, normalizeExplicitCategories(options.yCategories), yTotals, options.sort);
  const tiles: MosaicTile[] = [];

  if (grandTotal <= 0 || !xCategories.length || !yCategories.length) {
    return {
      width,
      height,
      padding,
      gap,
      total: 0,
      xCategories,
      yCategories,
      xTotals,
      yTotals,
      tiles
    };
  }

  const innerWidth = Math.max(width - padding * 2, 1);
  const innerHeight = Math.max(height - padding * 2, 1);
  const activeXCategories = xCategories.filter((category) => positiveNumber(xTotals[category], 0) > 0);
  const xGapTotal = gap * Math.max(0, activeXCategories.length - 1);
  const availableWidth = Math.max(innerWidth - xGapTotal, 1);
  let cursorX = padding;

  activeXCategories.forEach((xCategory) => {
    const columnTotal = xTotals[xCategory] || 0;
    const columnWidth = availableWidth * (columnTotal / grandTotal);
    const columnCells = yCategories
      .map((yCategory) => cells.find((cell) => cell.xCategory === xCategory && cell.yCategory === yCategory))
      .filter((cell): cell is MutableCell => cell != null && cell.value > 0);
    const yGapTotal = gap * Math.max(0, columnCells.length - 1);
    const availableHeight = Math.max(innerHeight - yGapTotal, 1);
    let cursorY = padding;

    columnCells.forEach((cell) => {
      const tileHeight = availableHeight * (cell.value / columnTotal);
      tiles.push({
        id: cell.id,
        name: cell.name,
        xCategory: cell.xCategory,
        yCategory: cell.yCategory,
        value: cell.value,
        total: grandTotal,
        percent: grandTotal > 0 ? cell.value / grandTotal : 0,
        columnPercent: columnTotal > 0 ? cell.value / columnTotal : 0,
        dataIndex: cell.dataIndex,
        x: cursorX,
        y: cursorY,
        width: Math.max(columnWidth, 0),
        height: Math.max(tileHeight, 0),
        color: colors[yCategories.indexOf(cell.yCategory) % colors.length],
        raw: cell.raw
      });
      cursorY += tileHeight + gap;
    });

    cursorX += columnWidth + gap;
  });

  return {
    width,
    height,
    padding,
    gap,
    total: grandTotal,
    xCategories: activeXCategories,
    yCategories,
    xTotals,
    yTotals,
    tiles
  };
}

function normalizeItems(data: unknown[], options: MosaicLayoutOptions): NormalizedMosaicItem[] {
  return data.map((item, dataIndex) => {
    const xCategory = normalizeCategory(readField(item, options.xField ?? 'x', options.dimensions, 0, ['category', 'group']));
    const yCategory = normalizeCategory(readField(item, options.yField ?? 'y', options.dimensions, 1, ['segment', 'series']));
    const value = positiveNumber(readField(item, options.valueField ?? 'value', options.dimensions, 2, ['count', 'size']), 0);
    const record = isPlainObject(item) ? item : {};
    const name = typeof record.name === 'string' && record.name ? record.name : `${xCategory} / ${yCategory}`;

    return {
      id: `${xCategory}\x00${yCategory}`,
      name,
      xCategory,
      yCategory,
      value,
      dataIndex,
      raw: item
    };
  });
}

function mergeCells(items: NormalizedMosaicItem[]): MutableCell[] {
  const byId = new Map<string, MutableCell>();
  items.forEach((item) => {
    const existing = byId.get(item.id);
    if (!existing) {
      byId.set(item.id, {
        ...item,
        rawItems: [item.raw]
      });
      return;
    }
    existing.value += item.value;
    existing.rawItems.push(item.raw);
  });
  return Array.from(byId.values()).map((cell) => ({
    ...cell,
    raw: cell.rawItems.length === 1 ? cell.rawItems[0] : cell.rawItems
  }));
}

function readField(
  item: unknown,
  field: MosaicField,
  dimensions: string[] | undefined,
  fallbackIndex: number,
  fallbackNames: string[]
): unknown {
  if (Array.isArray(item)) {
    const index = typeof field === 'number' ? field : dimensions?.indexOf(field);
    return item[index != null && index >= 0 ? index : fallbackIndex];
  }

  if (!isPlainObject(item)) return undefined;
  if (typeof field === 'string' && item[field] != null) return item[field];
  if (typeof field === 'number') return undefined;
  for (const fallbackName of fallbackNames) {
    if (item[fallbackName] != null) return item[fallbackName];
  }
  return undefined;
}

function resolveCategories(
  key: 'xCategory' | 'yCategory',
  cells: MutableCell[],
  explicitCategories: string[] | undefined,
  totals: Record<string, number>,
  sort: MosaicSort | undefined
): string[] {
  const categories = explicitCategories?.length
    ? explicitCategories.filter((category) => positiveNumber(totals[category], 0) > 0)
    : unique(cells.map((cell) => cell[key]));

  if (sort === true || sort === 'value') {
    return [...categories].sort((left, right) => (totals[right] || 0) - (totals[left] || 0) || left.localeCompare(right));
  }
  if (sort === 'name') return [...categories].sort((left, right) => left.localeCompare(right));
  return categories;
}

function sumBy(cells: MutableCell[], key: 'xCategory' | 'yCategory'): Record<string, number> {
  const totals: Record<string, number> = {};
  cells.forEach((cell) => {
    totals[cell[key]] = (totals[cell[key]] || 0) + cell.value;
  });
  return totals;
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

function normalizeExplicitCategories(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.map(normalizeCategory);
}

function normalizeCategory(value: unknown): string {
  if (typeof value === 'string' && value.length) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return EMPTY_VALUE;
}

function positiveNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return fallback;
}

function finiteNumber(value: unknown, fallback: undefined): number | undefined;
function finiteNumber(value: unknown, fallback: number): number;
function finiteNumber(value: unknown, fallback: number | undefined): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}
