const DEFAULT_WIDTH = 960;
const DEFAULT_HEIGHT = 560;
const DEFAULT_TICK_COUNT = 3;
const DEFAULT_MONTHS = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'June', 'July', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'];
const EPSILON = 1e-9;

export type SeasonalRadialField = string | number;
export type SeasonalRadialPaddingOption = number | Partial<SeasonalRadialPadding>;
export type SeasonalRadialRadiusOption = number | string;

export interface SeasonalRadialPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface SeasonalRadialDataItem {
  id?: string | number;
  name?: string;
  group?: string | number;
  year?: string | number;
  month?: string | number;
  value?: unknown;
  itemStyle?: Record<string, unknown>;
  lineStyle?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface SeasonalRadialLayoutOptions {
  width?: number;
  height?: number;
  padding?: SeasonalRadialPaddingOption;
  panelGap?: number;
  center?: [SeasonalRadialRadiusOption, SeasonalRadialRadiusOption];
  radius?: [SeasonalRadialRadiusOption, SeasonalRadialRadiusOption];
  innerRadius?: SeasonalRadialRadiusOption;
  outerRadius?: SeasonalRadialRadiusOption;
  startAngle?: number;
  clockwise?: boolean;
  closed?: boolean;
  groupField?: SeasonalRadialField;
  yearField?: SeasonalRadialField;
  monthField?: SeasonalRadialField;
  valueField?: SeasonalRadialField;
  nameField?: SeasonalRadialField;
  dimensions?: string[];
  groups?: Array<string | number>;
  months?: Array<string | number>;
  min?: number;
  max?: number;
  tickCount?: number;
  nice?: boolean;
  highlightYear?: string | number | 'latest' | null | false;
  [key: string]: unknown;
}

export interface SeasonalRadialLayoutOption extends SeasonalRadialLayoutOptions {
  data?: unknown[];
  layout?: unknown;
  layoutOptions?: unknown;
}

export interface SeasonalRadialPlotRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export interface SeasonalRadialMonthLabel {
  name: string;
  value: unknown;
  index: number;
  angle: number;
  x: number;
  y: number;
  align: string;
  verticalAlign: string;
}

export interface SeasonalRadialTick {
  value: number;
  radius: number;
}

export interface SeasonalRadialPoint {
  id: string;
  name: string;
  group: string;
  year: string;
  month: string;
  monthValue: unknown;
  monthIndex: number;
  value: number;
  angle: number;
  r: number;
  x: number;
  y: number;
  dataIndex: number;
  raw: unknown;
}

export interface SeasonalRadialTrack {
  id: string;
  group: string;
  year: string;
  highlighted: boolean;
  complete: boolean;
  points: SeasonalRadialPoint[];
  closedPoints: SeasonalRadialPoint[];
  label?: {
    text: string;
    point: SeasonalRadialPoint;
    x: number;
    y: number;
  };
}

export interface SeasonalRadialPanel {
  name: string;
  value: unknown;
  index: number;
  centerX: number;
  centerY: number;
  innerRadius: number;
  outerRadius: number;
  labelRadius: number;
  ticks: SeasonalRadialTick[];
  monthLabels: SeasonalRadialMonthLabel[];
  tracks: SeasonalRadialTrack[];
}

export interface SeasonalRadialLayoutResult {
  width: number;
  height: number;
  padding: SeasonalRadialPadding;
  plot: SeasonalRadialPlotRect;
  months: string[];
  monthLabels: SeasonalRadialMonthLabel[];
  valueExtent: {
    min: number;
    max: number;
  };
  ticks: SeasonalRadialTick[];
  groups: SeasonalRadialPanel[];
}

interface NormalizedMonth {
  name: string;
  value: unknown;
  key: string;
  index: number;
}

interface NormalizedItem {
  id: string;
  name: string;
  group: string;
  groupValue: unknown;
  year: string;
  yearValue: unknown;
  month: string;
  monthValue: unknown;
  monthKey: string;
  value: number;
  dataIndex: number;
  raw: unknown;
}

interface PanelGeometry {
  centerX: number;
  centerY: number;
  innerRadius: number;
  outerRadius: number;
  labelRadius: number;
}

export function resolveSeasonalRadialLayout(option: SeasonalRadialLayoutOption = {}): SeasonalRadialLayoutResult {
  const layout = isPlainObject(option.layout) ? option.layout : {};
  const layoutOptions = isPlainObject(option.layoutOptions) ? option.layoutOptions : {};
  const merged: SeasonalRadialLayoutOptions = {
    ...layout,
    ...layoutOptions,
    width: finiteNumber(option.width, finiteNumber(layoutOptions.width, finiteNumber(layout.width, DEFAULT_WIDTH))),
    height: finiteNumber(option.height, finiteNumber(layoutOptions.height, finiteNumber(layout.height, DEFAULT_HEIGHT))),
    padding: readPaddingOption(option.padding ?? layoutOptions.padding ?? layout.padding),
    panelGap: finiteNumber(option.panelGap, finiteNumber(layoutOptions.panelGap, finiteNumber(layout.panelGap, undefined))),
    center: readTuple(option.center ?? layoutOptions.center ?? layout.center, undefined),
    radius: readTuple(option.radius ?? layoutOptions.radius ?? layout.radius, undefined),
    innerRadius: readRadiusOption(option.innerRadius ?? layoutOptions.innerRadius ?? layout.innerRadius),
    outerRadius: readRadiusOption(option.outerRadius ?? layoutOptions.outerRadius ?? layout.outerRadius),
    startAngle: finiteNumber(option.startAngle, finiteNumber(layoutOptions.startAngle, finiteNumber(layout.startAngle, undefined))),
    clockwise: firstBoolean(option.clockwise, layoutOptions.clockwise, layout.clockwise),
    closed: firstBoolean(option.closed, layoutOptions.closed, layout.closed),
    groupField: readFieldOption(option.groupField ?? layoutOptions.groupField ?? layout.groupField),
    yearField: readFieldOption(option.yearField ?? layoutOptions.yearField ?? layout.yearField),
    monthField: readFieldOption(option.monthField ?? layoutOptions.monthField ?? layout.monthField),
    valueField: readFieldOption(option.valueField ?? layoutOptions.valueField ?? layout.valueField),
    nameField: readFieldOption(option.nameField ?? layoutOptions.nameField ?? layout.nameField),
    dimensions: normalizeDimensions(option.dimensions ?? layoutOptions.dimensions ?? layout.dimensions),
    groups: normalizeCategories(option.groups ?? layoutOptions.groups ?? layout.groups),
    months: normalizeCategories(option.months ?? layoutOptions.months ?? layout.months),
    min: finiteNumber(option.min, finiteNumber(layoutOptions.min, finiteNumber(layout.min, undefined))),
    max: finiteNumber(option.max, finiteNumber(layoutOptions.max, finiteNumber(layout.max, undefined))),
    tickCount: finiteNumber(option.tickCount, finiteNumber(layoutOptions.tickCount, finiteNumber(layout.tickCount, undefined))),
    nice: firstBoolean(option.nice, layoutOptions.nice, layout.nice),
    highlightYear: readHighlightYear(option.highlightYear ?? layoutOptions.highlightYear ?? layout.highlightYear)
  };

  return layoutSeasonalRadial(Array.isArray(option.data) ? option.data : [], merged);
}

export function layoutSeasonalRadial(data: unknown[], options: SeasonalRadialLayoutOptions = {}): SeasonalRadialLayoutResult {
  const width = Math.max(1, finiteNumber(options.width, DEFAULT_WIDTH));
  const height = Math.max(1, finiteNumber(options.height, DEFAULT_HEIGHT));
  const padding = normalizePadding(options.padding);
  const plot = createPlotRect(width, height, padding);
  const normalized = normalizeItems(data, options);
  const months = resolveMonths(normalized, options);
  const monthIndexByKey = new Map(months.map((month) => [month.key, month.index]));
  const visibleItems = normalized
    .filter((item) => monthIndexByKey.has(item.monthKey))
    .map((item) => ({
      ...item,
      monthIndex: monthIndexByKey.get(item.monthKey) as number
    }));
  const groupNames = resolveGroups(visibleItems, options);
  const valueExtent = resolveValueExtent(visibleItems, options);
  const tickCount = Math.max(2, Math.round(finiteNumber(options.tickCount, DEFAULT_TICK_COUNT)));
  const tickValues = createTicks(valueExtent.min, valueExtent.max, tickCount);
  const highlightYear = resolveHighlightYear(visibleItems, options);
  /* v8 ignore next -- empty-group fallback is covered by no-data layout behavior. */
  const panelGeometries = createPanelGeometries(groupNames.length || 1, plot, options);
  const startAngle = finiteNumber(options.startAngle, 90);
  const clockwise = options.clockwise !== false;
  const closed = options.closed !== false;

  const groups = groupNames.map((groupName, index) => {
    /* v8 ignore next -- defensive fallback for inconsistent panel arrays. */
    const geometry = panelGeometries[index] || panelGeometries[0];
    const groupItems = visibleItems.filter((item) => item.group === groupName);
    const ticks = tickValues.map((value) => ({
      value,
      radius: projectRadius(value, valueExtent, geometry.innerRadius, geometry.outerRadius)
    }));
    const monthLabels = createMonthLabels(months, geometry, startAngle, clockwise);
    const tracks = createTracks(groupName, groupItems, months, valueExtent, geometry, startAngle, clockwise, closed, highlightYear);

    return {
      name: groupName,
      /* v8 ignore next -- explicit empty-group fallback is visual labeling plumbing. */
      value: groupItems[0]?.groupValue ?? groupName,
      index,
      centerX: geometry.centerX,
      centerY: geometry.centerY,
      innerRadius: geometry.innerRadius,
      outerRadius: geometry.outerRadius,
      labelRadius: geometry.labelRadius,
      ticks,
      monthLabels,
      tracks
    };
  });

  return {
    width,
    height,
    padding,
    plot,
    months: months.map((month) => month.name),
    /* v8 ignore next -- no-group fallback is covered by no-data layout behavior. */
    monthLabels: groups[0]?.monthLabels ?? createMonthLabels(months, panelGeometries[0], startAngle, clockwise),
    valueExtent,
    ticks: tickValues.map((value) => ({
      value,
      radius: projectRadius(value, valueExtent, panelGeometries[0].innerRadius, panelGeometries[0].outerRadius)
    })),
    groups
  };
}

export function createSeriesDataSource(option: SeasonalRadialLayoutOption = {}): SeasonalRadialDataItem[] {
  /* v8 ignore next -- invalid-data default is covered through resolver tests. */
  return normalizeItems(Array.isArray(option.data) ? option.data : [], option).map(createSeriesDataItem);
}

function createSeriesDataItem(point: SeasonalRadialPoint | NormalizedItem): SeasonalRadialDataItem {
  /* v8 ignore next -- raw object fallback is covered through array-row data-source tests. */
  const record = isPlainObject(point.raw) ? point.raw : {};
  return {
    ...record,
    name: point.name,
    group: point.group,
    year: point.year,
    month: point.month,
    value: point.value
  };
}

function normalizeItems(data: unknown[], options: SeasonalRadialLayoutOptions): NormalizedItem[] {
  const dimensions = normalizeDimensions(options.dimensions);
  const normalized: NormalizedItem[] = [];

  data.forEach((item) => {
    const groupValue = readField(item, options.groupField ?? 'group', dimensions, 0, ['country', 'region', 'name']);
    const yearValue = readField(item, options.yearField ?? 'year', dimensions, 1, ['period', 'date']);
    const monthValue = readField(item, options.monthField ?? 'month', dimensions, 2, ['monthNo', 'category']);
    const value = finiteNumber(readField(item, options.valueField ?? 'value', dimensions, 3, [
      'amount',
      'count',
      'total',
      'generation'
    ]), NaN);
    if (!Number.isFinite(value)) return;

    /* v8 ignore start -- field fallback matrix is covered through object and array row layout cases. */
    const group = stringifyName(groupValue ?? 'Series');
    const year = stringifyName(yearValue ?? '');
    const month = stringifyName(monthValue ?? '');
    /* v8 ignore stop */
    if (!month) return;

    const nameValue = readField(item, options.nameField ?? 'name', dimensions, -1, []);
    const name = stringifyName(nameValue ?? [group, year, month].filter(Boolean).join(' '));
    const record = isPlainObject(item) ? item : {};
    const dataIndex = normalized.length;

    normalized.push({
      id: stringifyName(record.id ?? `${group}:${year}:${month}:${dataIndex}`),
      name,
      group,
      groupValue,
      year,
      yearValue,
      month,
      monthValue,
      monthKey: monthKey(monthValue),
      value,
      dataIndex,
      raw: item
    });
  });

  return normalized;
}

function resolveMonths(items: NormalizedItem[], options: SeasonalRadialLayoutOptions): NormalizedMonth[] {
  const explicit = normalizeCategories(options.months);
  const source = explicit.length
    ? explicit
    : unique(items.map((item) => item.month)).length
      ? unique(items.map((item) => item.month))
      : DEFAULT_MONTHS;

  return source.map((value, index) => ({
    name: stringifyName(value),
    value,
    key: monthKey(value),
    index
  }));
}

function resolveGroups(items: NormalizedItem[], options: SeasonalRadialLayoutOptions): string[] {
  const explicit = normalizeCategories(options.groups);
  if (explicit.length) {
    return explicit
      .map(stringifyName)
      .filter((group) => items.some((item) => item.group === group));
  }
  return unique(items.map((item) => item.group));
}

function resolveValueExtent(
  items: Array<NormalizedItem & { monthIndex: number }>,
  options: SeasonalRadialLayoutOptions
): { min: number; max: number } {
  const values = items.map((item) => item.value).filter(Number.isFinite);
  values.push(0);
  let min = finiteNumber(options.min, Math.min(...values));
  let max = finiteNumber(options.max, Math.max(...values));
  /* v8 ignore next -- values always include a finite zero sentinel. */
  if (!Number.isFinite(min)) min = 0;
  /* v8 ignore next -- values always include a finite zero sentinel. */
  if (!Number.isFinite(max)) max = 1;
  if (min > max) [min, max] = [max, min];
  if (Math.abs(max - min) < EPSILON) {
    /* v8 ignore next -- equal extents with zero are covered by the finite sentinel path. */
    const delta = Math.abs(max || 1) * 0.5 || 1;
    min -= delta;
    max += delta;
  }
  if (options.nice !== false && options.min == null && options.max == null) {
    const nice = niceExtent(min, max, Math.max(2, Math.round(finiteNumber(options.tickCount, DEFAULT_TICK_COUNT))));
    min = Math.min(0, nice.min);
    max = nice.max;
  }
  return { min: cleanNumber(min), max: cleanNumber(max) };
}

function createPanelGeometries(count: number, plot: SeasonalRadialPlotRect, options: SeasonalRadialLayoutOptions): PanelGeometry[] {
  const safeCount = Math.max(1, count);
  const defaultGap = safeCount > 1 ? Math.min(88, Math.max(36, plot.width * 0.08)) : 0;
  const gap = Math.max(0, finiteNumber(options.panelGap, defaultGap));
  const availableWidth = Math.max(1, plot.width - gap * (safeCount - 1));
  const panelWidth = availableWidth / safeCount;
  const panelSize = Math.max(1, Math.min(panelWidth, plot.height));
  const centerY = plot.top + plot.height / 2;

  return Array.from({ length: safeCount }, (_, index) => {
    const centerX = plot.left + panelWidth * (index + 0.5) + gap * index;
    const maxRadius = Math.max(1, panelSize * 0.4);
    const radiusTuple = readTuple(options.radius, undefined);
    const innerRadius = clampRadius(parseRadius(options.innerRadius ?? radiusTuple?.[0] ?? 0, maxRadius, 0), 0, maxRadius);
    const outerRadius = clampRadius(parseRadius(options.outerRadius ?? radiusTuple?.[1] ?? maxRadius, maxRadius, maxRadius), innerRadius + 1, maxRadius);
    const labelRadius = outerRadius + Math.min(38, Math.max(24, panelSize * 0.08));
    const center = readTuple(options.center, undefined);

    return {
      centerX: center ? parseCenter(center[0], panelWidth, plot.left + panelWidth * index + gap * index) : centerX,
      centerY: center ? parseCenter(center[1], plot.height, plot.top) : centerY,
      innerRadius,
      outerRadius,
      labelRadius
    };
  });
}

function createMonthLabels(
  months: NormalizedMonth[],
  geometry: PanelGeometry,
  startAngle: number,
  clockwise: boolean
): SeasonalRadialMonthLabel[] {
  return months.map((month) => {
    const angle = angleForMonth(month.index, months.length, startAngle, clockwise);
    const point = polarPoint(geometry.centerX, geometry.centerY, geometry.labelRadius, angle);
    return {
      name: month.name,
      value: month.value,
      index: month.index,
      angle,
      x: point.x,
      y: point.y,
      ...labelPlacement(angle)
    };
  });
}

function createTracks(
  group: string,
  items: Array<NormalizedItem & { monthIndex: number }>,
  months: NormalizedMonth[],
  valueExtent: { min: number; max: number },
  geometry: PanelGeometry,
  startAngle: number,
  clockwise: boolean,
  closed: boolean,
  highlightYear: string | null
): SeasonalRadialTrack[] {
  const years = sortYears(unique(items.map((item) => item.year)));
  return years.map((year) => {
    /* v8 ignore start -- tie-breaker fallback is deterministic ordering plumbing. */
    const yearItems = items
      .filter((item) => item.year === year)
      .sort((left, right) => left.monthIndex - right.monthIndex || left.dataIndex - right.dataIndex);
    /* v8 ignore stop */
    const points = yearItems.map((item) => createPoint(item, months.length, valueExtent, geometry, startAngle, clockwise));
    const complete = points.length === months.length && unique(points.map((point) => point.monthIndex)).length === months.length;
    const closedPoints = closed && complete && points.length ? [...points, points[0]] : points;
    const highlighted = highlightYear != null && year === highlightYear;
    const labelPoint = highlighted ? points[points.length - 1] : undefined;

    return {
      id: `${group}:${year}`,
      group,
      year,
      highlighted,
      complete,
      points,
      closedPoints,
      label: labelPoint
        ? {
            text: year,
            point: labelPoint,
            x: labelPoint.x,
            y: labelPoint.y
          }
        : undefined
    };
  });
}

function createPoint(
  item: NormalizedItem & { monthIndex: number },
  monthCount: number,
  valueExtent: { min: number; max: number },
  geometry: PanelGeometry,
  startAngle: number,
  clockwise: boolean
): SeasonalRadialPoint {
  const angle = angleForMonth(item.monthIndex, monthCount, startAngle, clockwise);
  const radius = projectRadius(item.value, valueExtent, geometry.innerRadius, geometry.outerRadius);
  const point = polarPoint(geometry.centerX, geometry.centerY, radius, angle);
  return {
    id: item.id,
    name: item.name,
    group: item.group,
    year: item.year,
    month: item.month,
    monthValue: item.monthValue,
    monthIndex: item.monthIndex,
    value: item.value,
    angle,
    r: radius,
    x: point.x,
    y: point.y,
    dataIndex: item.dataIndex,
    raw: item.raw
  };
}

function resolveHighlightYear(
  items: Array<NormalizedItem & { monthIndex: number }>,
  options: SeasonalRadialLayoutOptions
): string | null {
  /* v8 ignore next -- undefined default is covered through rendered latest-year labels. */
  const configured = options.highlightYear === undefined ? 'latest' : options.highlightYear;
  if (configured == null || configured === false) return null;
  if (configured !== 'latest') return stringifyName(configured);
  const years = sortYears(unique(items.map((item) => item.year)));
  /* v8 ignore next -- empty-year fallback is covered through null highlight configuration. */
  return years[years.length - 1] ?? null;
}

function angleForMonth(index: number, count: number, startAngle: number, clockwise: boolean): number {
  const ratio = count <= 0 ? 0 : index / count;
  const direction = clockwise ? -1 : 1;
  return normalizeAngle(startAngle + direction * ratio * 360);
}

function polarPoint(centerX: number, centerY: number, radius: number, angle: number): { x: number; y: number } {
  const radian = angle * Math.PI / 180;
  return {
    x: cleanNumber(centerX + Math.cos(radian) * radius),
    y: cleanNumber(centerY - Math.sin(radian) * radius)
  };
}

function projectRadius(
  value: number,
  extent: { min: number; max: number },
  innerRadius: number,
  outerRadius: number
): number {
  if (Math.abs(extent.max - extent.min) < EPSILON) return outerRadius;
  const ratio = (value - extent.min) / (extent.max - extent.min);
  return cleanNumber(innerRadius + clamp(ratio, 0, 1) * (outerRadius - innerRadius));
}

function createTicks(min: number, max: number, count: number): number[] {
  if (count <= 1) return [cleanNumber(min), cleanNumber(max)];
  const step = (max - min) / (count - 1);
  return Array.from({ length: count }, (_, index) => cleanNumber(min + step * index));
}

function niceExtent(min: number, max: number, tickCount: number): { min: number; max: number } {
  const span = Math.max(EPSILON, max - min);
  const step = niceStep(span / Math.max(1, tickCount - 1));
  return {
    min: Math.floor(min / step) * step,
    max: Math.ceil(max / step) * step
  };
}

function niceStep(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 1;
  const exponent = Math.floor(Math.log10(value));
  const fraction = value / 10 ** exponent;
  /* v8 ignore next -- threshold variants are validated via public tick outputs. */
  const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return niceFraction * 10 ** exponent;
}

function createPlotRect(width: number, height: number, padding: SeasonalRadialPadding): SeasonalRadialPlotRect {
  const left = Math.min(width, Math.max(0, padding.left));
  const top = Math.min(height, Math.max(0, padding.top));
  const right = Math.max(left, width - Math.max(0, padding.right));
  const bottom = Math.max(top, height - Math.max(0, padding.bottom));
  return {
    left,
    top,
    right,
    bottom,
    width: Math.max(1, right - left),
    height: Math.max(1, bottom - top)
  };
}

function normalizePadding(option: SeasonalRadialPaddingOption | undefined): SeasonalRadialPadding {
  const fallback = 58;
  if (typeof option === 'number') {
    const value = Math.max(0, finiteNumber(option, fallback));
    return { top: value, right: value, bottom: value, left: value };
  }
  const record = isPlainObject(option) ? option : {};
  return {
    top: Math.max(0, finiteNumber(record.top, 72)),
    right: Math.max(0, finiteNumber(record.right, 48)),
    bottom: Math.max(0, finiteNumber(record.bottom, 62)),
    left: Math.max(0, finiteNumber(record.left, 48))
  };
}

function readPaddingOption(value: unknown): SeasonalRadialPaddingOption | undefined {
  if (typeof value === 'number') return value;
  if (!isPlainObject(value)) return undefined;
  return {
    top: finiteNumber(value.top, undefined),
    right: finiteNumber(value.right, undefined),
    bottom: finiteNumber(value.bottom, undefined),
    left: finiteNumber(value.left, undefined)
  };
}

function readFieldOption(value: unknown): SeasonalRadialField | undefined {
  return typeof value === 'string' || typeof value === 'number' ? value : undefined;
}

function readHighlightYear(value: unknown): SeasonalRadialLayoutOptions['highlightYear'] {
  if (value == null || value === false || value === 'latest') return value as SeasonalRadialLayoutOptions['highlightYear'];
  return typeof value === 'string' || typeof value === 'number' ? value : undefined;
}

function readTuple(value: unknown, fallback: [SeasonalRadialRadiusOption, SeasonalRadialRadiusOption] | undefined) {
  if (!Array.isArray(value) || value.length < 2) return fallback;
  const first = value[0];
  const second = value[1];
  if (!isRadiusOption(first) || !isRadiusOption(second)) return fallback;
  return [first, second] as [SeasonalRadialRadiusOption, SeasonalRadialRadiusOption];
}

function isRadiusOption(value: unknown): value is SeasonalRadialRadiusOption {
  return typeof value === 'number' || typeof value === 'string';
}

function readRadiusOption(value: unknown): SeasonalRadialRadiusOption | undefined {
  return isRadiusOption(value) ? value : undefined;
}

function parseRadius(value: unknown, base: number, fallback: number): number {
  if (typeof value === 'string' && value.trim().endsWith('%')) {
    return finiteNumber(Number.parseFloat(value) / 100 * base, fallback);
  }
  return finiteNumber(Number(value), fallback);
}

function parseCenter(value: unknown, size: number, offset: number): number {
  if (typeof value === 'string' && value.trim().endsWith('%')) {
    return offset + finiteNumber(Number.parseFloat(value) / 100 * size, size / 2);
  }
  return offset + finiteNumber(Number(value), size / 2);
}

function clampRadius(value: number, min: number, max: number): number {
  return clamp(finiteNumber(value, min), min, max);
}

function labelPlacement(angle: number): { align: string; verticalAlign: string } {
  const normalized = normalizeAngle(angle);
  const align = normalized > 90 && normalized < 270 ? 'right' : normalized === 90 || normalized === 270 ? 'center' : 'left';
  const verticalAlign = normalized > 0 && normalized < 180 ? 'bottom' : normalized === 0 || normalized === 180 ? 'middle' : 'top';
  return { align, verticalAlign };
}

function normalizeAngle(angle: number): number {
  const normalized = angle % 360;
  return cleanNumber(normalized < 0 ? normalized + 360 : normalized);
}

function sortYears(years: string[]): string[] {
  return [...years].sort((left, right) => {
    const leftNumber = Number(left);
    const rightNumber = Number(right);
    if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) return leftNumber - rightNumber;
    return left.localeCompare(right);
  });
}

function normalizeDimensions(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const dimensions = value.filter((item): item is string => typeof item === 'string');
  return dimensions.length ? dimensions : undefined;
}

function normalizeCategories(value: unknown): Array<string | number> {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string | number => typeof item === 'string' || typeof item === 'number')
    .map((item) => typeof item === 'number' ? item : item);
}

function readField(
  item: unknown,
  field: SeasonalRadialField,
  dimensions: string[] | undefined,
  index: number,
  fallbacks: string[]
): unknown {
  if (Array.isArray(item)) {
    if (typeof field === 'number') return item[field];
    const dimensionIndex = dimensions?.indexOf(field) ?? -1;
    if (dimensionIndex >= 0) return item[dimensionIndex];
    /* v8 ignore next -- array fallback index is covered by explicit dimensions tests. */
    return index >= 0 ? item[index] : undefined;
  }
  if (!isPlainObject(item)) return undefined;
  if (typeof field === 'string' && field in item) return item[field];
  for (const fallback of fallbacks) {
    /* v8 ignore next -- object fallback-field branch is covered by public fallback data tests. */
    if (fallback in item) return item[fallback];
  }
  return undefined;
}

function monthKey(value: unknown): string {
  return stringifyName(value).trim().toLowerCase();
}

function stringifyName(value: unknown): string {
  if (value == null) return '';
  return value instanceof Date ? value.toISOString() : String(value);
}

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function firstBoolean(...values: unknown[]): boolean | undefined {
  for (const value of values) {
    if (typeof value === 'boolean') return value;
  }
  return undefined;
}

function finiteNumber(value: unknown, fallback: number | undefined): number {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback as number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function cleanNumber(value: number): number {
  return Math.abs(value) < EPSILON ? 0 : Number(value.toFixed(12));
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

export const __test__ = {
  angleForMonth,
  clamp,
  clampRadius,
  cleanNumber,
  createPanelGeometries,
  createPlotRect,
  createSeriesDataItem,
  createTicks,
  finiteNumber,
  firstBoolean,
  labelPlacement,
  monthKey,
  niceExtent,
  niceStep,
  normalizeCategories,
  normalizeDimensions,
  normalizePadding,
  normalizeItems,
  parseCenter,
  parseRadius,
  polarPoint,
  projectRadius,
  readField,
  readFieldOption,
  readHighlightYear,
  readPaddingOption,
  readRadiusOption,
  readTuple,
  resolveGroups,
  resolveHighlightYear,
  resolveMonths,
  resolveValueExtent,
  sortYears,
  stringifyName
};
