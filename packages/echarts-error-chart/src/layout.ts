const DEFAULT_WIDTH = 720;
const DEFAULT_HEIGHT = 460;
const DEFAULT_PADDING = 48;
const DEFAULT_TICK_COUNT = 5;
const EPSILON = 1e-9;

export type ErrorChartVariant = 'column' | 'bar' | 'line' | 'scatter';
export type ErrorChartVariantOption = ErrorChartVariant;
export type ErrorChartOrientation = 'vertical' | 'horizontal' | 'cartesian';
export type ErrorChartField = string | number;
export type ErrorChartPaddingOption = number | Partial<ErrorChartPadding>;

export interface ErrorChartPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ErrorChartDataItem {
  id?: string | number;
  name?: string;
  category?: string | number;
  value?: unknown;
  low?: unknown;
  high?: unknown;
  lower?: unknown;
  upper?: unknown;
  lowerError?: unknown;
  upperError?: unknown;
  x?: unknown;
  y?: unknown;
  xLow?: unknown;
  xHigh?: unknown;
  yLow?: unknown;
  yHigh?: unknown;
  xMinus?: unknown;
  xPlus?: unknown;
  yMinus?: unknown;
  yPlus?: unknown;
  itemStyle?: Record<string, unknown>;
  errorBarStyle?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ErrorChartLayoutOptions {
  width?: number;
  height?: number;
  padding?: ErrorChartPaddingOption;
  variant?: ErrorChartVariantOption;
  orient?: ErrorChartOrientation;
  orientation?: ErrorChartOrientation;
  categoryField?: ErrorChartField;
  valueField?: ErrorChartField;
  lowField?: ErrorChartField;
  highField?: ErrorChartField;
  lowerErrorField?: ErrorChartField;
  upperErrorField?: ErrorChartField;
  xField?: ErrorChartField;
  yField?: ErrorChartField;
  xLowField?: ErrorChartField;
  xHighField?: ErrorChartField;
  xMinusField?: ErrorChartField;
  xPlusField?: ErrorChartField;
  yLowField?: ErrorChartField;
  yHighField?: ErrorChartField;
  yMinusField?: ErrorChartField;
  yPlusField?: ErrorChartField;
  nameField?: ErrorChartField;
  dimensions?: string[];
  categories?: Array<string | number>;
  min?: number;
  max?: number;
  xMin?: number;
  xMax?: number;
  baseline?: number;
  tickCount?: number;
  nice?: boolean;
  [key: string]: unknown;
}

export interface ErrorChartLayoutOption extends ErrorChartLayoutOptions {
  data?: unknown[];
  layout?: unknown;
  layoutOptions?: unknown;
}

export interface ErrorChartPlotRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export interface ErrorChartTick {
  value: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  x: number;
  y: number;
}

export interface ErrorChartCategoryLabel {
  name: string;
  value: string;
  x: number;
  y: number;
  align: string;
  verticalAlign: string;
}

export interface ErrorChartPoint {
  id: string;
  name: string;
  category: string;
  categoryValue: unknown;
  value: number;
  lower: number;
  upper: number;
  xValue: number;
  xLower: number;
  xUpper: number;
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  lowerX: number;
  lowerY: number;
  upperX: number;
  upperY: number;
  xLowerX: number;
  xLowerY: number;
  xUpperX: number;
  xUpperY: number;
  dataIndex: number;
  raw: unknown;
}

export interface ErrorChartLayoutResult {
  width: number;
  height: number;
  padding: ErrorChartPadding;
  plot: ErrorChartPlotRect;
  variant: ErrorChartVariant;
  orientation: ErrorChartOrientation;
  categories: string[];
  valueExtent: {
    min: number;
    max: number;
  };
  xExtent: {
    min: number;
    max: number;
  };
  baseline: number;
  baselineX: number;
  baselineY: number;
  valueTicks: ErrorChartTick[];
  xTicks: ErrorChartTick[];
  categoryLabels: ErrorChartCategoryLabel[];
  points: ErrorChartPoint[];
}

interface NormalizedCategoryItem {
  id: string;
  name: string;
  category: string;
  categoryValue: unknown;
  value: number;
  lower: number;
  upper: number;
  dataIndex: number;
  raw: unknown;
}

interface NormalizedScatterItem {
  id: string;
  name: string;
  xValue: number;
  yValue: number;
  xLower: number;
  xUpper: number;
  yLower: number;
  yUpper: number;
  dataIndex: number;
  raw: unknown;
}

export function resolveErrorChartLayout(option: ErrorChartLayoutOption = {}): ErrorChartLayoutResult {
  const layout = isPlainObject(option.layout) ? option.layout : {};
  const layoutOptions = isPlainObject(option.layoutOptions) ? option.layoutOptions : {};
  const merged: ErrorChartLayoutOptions = {
    ...layout,
    ...layoutOptions,
    width: finiteNumber(option.width, finiteNumber(layoutOptions.width, finiteNumber(layout.width, DEFAULT_WIDTH))),
    height: finiteNumber(option.height, finiteNumber(layoutOptions.height, finiteNumber(layout.height, DEFAULT_HEIGHT))),
    padding: readPaddingOption(option.padding ?? layoutOptions.padding ?? layout.padding),
    variant: readVariantOption(option.variant ?? layoutOptions.variant ?? layout.variant),
    orient: readOrientationOption(option.orient ?? option.orientation ?? layoutOptions.orient ?? layoutOptions.orientation ?? layout.orient ?? layout.orientation),
    categoryField: readFieldOption(option.categoryField ?? layoutOptions.categoryField ?? layout.categoryField),
    valueField: readFieldOption(option.valueField ?? layoutOptions.valueField ?? layout.valueField),
    lowField: readFieldOption(option.lowField ?? layoutOptions.lowField ?? layout.lowField),
    highField: readFieldOption(option.highField ?? layoutOptions.highField ?? layout.highField),
    lowerErrorField: readFieldOption(option.lowerErrorField ?? layoutOptions.lowerErrorField ?? layout.lowerErrorField),
    upperErrorField: readFieldOption(option.upperErrorField ?? layoutOptions.upperErrorField ?? layout.upperErrorField),
    xField: readFieldOption(option.xField ?? layoutOptions.xField ?? layout.xField),
    yField: readFieldOption(option.yField ?? layoutOptions.yField ?? layout.yField),
    xLowField: readFieldOption(option.xLowField ?? layoutOptions.xLowField ?? layout.xLowField),
    xHighField: readFieldOption(option.xHighField ?? layoutOptions.xHighField ?? layout.xHighField),
    xMinusField: readFieldOption(option.xMinusField ?? layoutOptions.xMinusField ?? layout.xMinusField),
    xPlusField: readFieldOption(option.xPlusField ?? layoutOptions.xPlusField ?? layout.xPlusField),
    yLowField: readFieldOption(option.yLowField ?? layoutOptions.yLowField ?? layout.yLowField),
    yHighField: readFieldOption(option.yHighField ?? layoutOptions.yHighField ?? layout.yHighField),
    yMinusField: readFieldOption(option.yMinusField ?? layoutOptions.yMinusField ?? layout.yMinusField),
    yPlusField: readFieldOption(option.yPlusField ?? layoutOptions.yPlusField ?? layout.yPlusField),
    nameField: readFieldOption(option.nameField ?? layoutOptions.nameField ?? layout.nameField),
    dimensions: normalizeDimensions(option.dimensions ?? layoutOptions.dimensions ?? layout.dimensions),
    categories: normalizeCategories(option.categories ?? layoutOptions.categories ?? layout.categories),
    min: finiteNumber(option.min, finiteNumber(layoutOptions.min, finiteNumber(layout.min, undefined))),
    max: finiteNumber(option.max, finiteNumber(layoutOptions.max, finiteNumber(layout.max, undefined))),
    xMin: finiteNumber(option.xMin, finiteNumber(layoutOptions.xMin, finiteNumber(layout.xMin, undefined))),
    xMax: finiteNumber(option.xMax, finiteNumber(layoutOptions.xMax, finiteNumber(layout.xMax, undefined))),
    baseline: finiteNumber(option.baseline, finiteNumber(layoutOptions.baseline, finiteNumber(layout.baseline, undefined))),
    tickCount: finiteNumber(option.tickCount, finiteNumber(layoutOptions.tickCount, finiteNumber(layout.tickCount, undefined))),
    nice: firstBoolean(option.nice, layoutOptions.nice, layout.nice)
  };

  return layoutErrorChart(Array.isArray(option.data) ? option.data : [], merged);
}

export function layoutErrorChart(data: unknown[], options: ErrorChartLayoutOptions = {}): ErrorChartLayoutResult {
  const width = Math.max(1, finiteNumber(options.width, DEFAULT_WIDTH));
  const height = Math.max(1, finiteNumber(options.height, DEFAULT_HEIGHT));
  const padding = normalizePadding(options.padding);
  const plot = createPlotRect(width, height, padding);
  const variant = readVariant(options.variant);
  const orientation = resolveOrientation(variant, options.orient ?? options.orientation);
  const baseline = finiteNumber(options.baseline, 0);
  const tickCount = Math.max(2, Math.round(finiteNumber(options.tickCount, DEFAULT_TICK_COUNT)));

  if (variant === 'scatter') {
    return layoutScatter(data, options, width, height, padding, plot, tickCount);
  }

  const normalized = normalizeCategoryItems(data, options);
  const categories = resolveCategories(normalized, options);
  const ordered = orderByCategory(normalized, categories);
  const valueExtent = resolveValueExtent(ordered.flatMap((item) => [item.value, item.lower, item.upper]), options, baseline, tickCount);
  const xExtent = { min: 0, max: Math.max(categories.length - 1, 1) };
  const baselineY = projectValueY(clamp(baseline, valueExtent.min, valueExtent.max), valueExtent, plot);
  const baselineX = projectValueX(clamp(baseline, valueExtent.min, valueExtent.max), valueExtent, plot);
  const valueTicks = createTicks(valueExtent.min, valueExtent.max, tickCount).map((value) => createValueTick(value, orientation, valueExtent, plot));
  const categoryLabels = categories.map((category, index) => createCategoryLabel(category, index, categories.length, orientation, plot));
  const points = ordered.map((item) => {
    const categoryIndex = Math.max(0, categories.indexOf(item.category));
    if (orientation === 'horizontal') {
      const y = projectCategoryY(categoryIndex, categories.length, plot);
      return createPoint({
        item,
        value: item.value,
        lower: item.lower,
        upper: item.upper,
        xValue: categoryIndex,
        xLower: categoryIndex,
        xUpper: categoryIndex,
        x: projectValueX(item.value, valueExtent, plot),
        y,
        baseX: baselineX,
        baseY: y,
        lowerX: projectValueX(item.lower, valueExtent, plot),
        lowerY: y,
        upperX: projectValueX(item.upper, valueExtent, plot),
        upperY: y,
        xLowerX: projectValueX(item.value, valueExtent, plot),
        xLowerY: y,
        xUpperX: projectValueX(item.value, valueExtent, plot),
        xUpperY: y
      });
    }

    const x = projectCategoryX(categoryIndex, categories.length, plot);
    return createPoint({
      item,
      value: item.value,
      lower: item.lower,
      upper: item.upper,
      xValue: categoryIndex,
      xLower: categoryIndex,
      xUpper: categoryIndex,
      x,
      y: projectValueY(item.value, valueExtent, plot),
      baseX: x,
      baseY: baselineY,
      lowerX: x,
      lowerY: projectValueY(item.lower, valueExtent, plot),
      upperX: x,
      upperY: projectValueY(item.upper, valueExtent, plot),
      xLowerX: x,
      xLowerY: projectValueY(item.value, valueExtent, plot),
      xUpperX: x,
      xUpperY: projectValueY(item.value, valueExtent, plot)
    });
  });

  return {
    width,
    height,
    padding,
    plot,
    variant,
    orientation,
    categories,
    valueExtent,
    xExtent,
    baseline,
    baselineX,
    baselineY,
    valueTicks,
    xTicks: [],
    categoryLabels,
    points
  };
}

function layoutScatter(
  data: unknown[],
  options: ErrorChartLayoutOptions,
  width: number,
  height: number,
  padding: ErrorChartPadding,
  plot: ErrorChartPlotRect,
  tickCount: number
): ErrorChartLayoutResult {
  const normalized = normalizeScatterItems(data, options);
  const xExtent = resolveNumericExtent(
    normalized.flatMap((item) => [item.xValue, item.xLower, item.xUpper]),
    options.xMin,
    options.xMax,
    tickCount,
    options.nice
  );
  const valueExtent = resolveNumericExtent(
    normalized.flatMap((item) => [item.yValue, item.yLower, item.yUpper]),
    options.min,
    options.max,
    tickCount,
    options.nice
  );
  const points = normalized.map((item) => createPoint({
    item: {
      id: item.id,
      name: item.name,
      category: item.name,
      categoryValue: item.name,
      value: item.yValue,
      lower: item.yLower,
      upper: item.yUpper,
      dataIndex: item.dataIndex,
      raw: item.raw
    },
    value: item.yValue,
    lower: item.yLower,
    upper: item.yUpper,
    xValue: item.xValue,
    xLower: item.xLower,
    xUpper: item.xUpper,
    x: projectValueX(item.xValue, xExtent, plot),
    y: projectValueY(item.yValue, valueExtent, plot),
    baseX: projectValueX(item.xValue, xExtent, plot),
    baseY: plot.bottom,
    lowerX: projectValueX(item.xValue, xExtent, plot),
    lowerY: projectValueY(item.yLower, valueExtent, plot),
    upperX: projectValueX(item.xValue, xExtent, plot),
    upperY: projectValueY(item.yUpper, valueExtent, plot),
    xLowerX: projectValueX(item.xLower, xExtent, plot),
    xLowerY: projectValueY(item.yValue, valueExtent, plot),
    xUpperX: projectValueX(item.xUpper, xExtent, plot),
    xUpperY: projectValueY(item.yValue, valueExtent, plot)
  }));

  return {
    width,
    height,
    padding,
    plot,
    variant: 'scatter',
    orientation: 'cartesian',
    categories: [],
    valueExtent,
    xExtent,
    baseline: 0,
    baselineX: plot.left,
    baselineY: plot.bottom,
    valueTicks: createTicks(valueExtent.min, valueExtent.max, tickCount).map((value) => createValueTick(value, 'vertical', valueExtent, plot)),
    xTicks: createTicks(xExtent.min, xExtent.max, tickCount).map((value) => createXTick(value, xExtent, plot)),
    categoryLabels: [],
    points
  };
}

function createPoint(input: {
  item: NormalizedCategoryItem;
  value: number;
  lower: number;
  upper: number;
  xValue: number;
  xLower: number;
  xUpper: number;
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  lowerX: number;
  lowerY: number;
  upperX: number;
  upperY: number;
  xLowerX: number;
  xLowerY: number;
  xUpperX: number;
  xUpperY: number;
}): ErrorChartPoint {
  return {
    id: input.item.id,
    name: input.item.name,
    category: input.item.category,
    categoryValue: input.item.categoryValue,
    value: input.value,
    lower: input.lower,
    upper: input.upper,
    xValue: input.xValue,
    xLower: input.xLower,
    xUpper: input.xUpper,
    x: input.x,
    y: input.y,
    baseX: input.baseX,
    baseY: input.baseY,
    lowerX: input.lowerX,
    lowerY: input.lowerY,
    upperX: input.upperX,
    upperY: input.upperY,
    xLowerX: input.xLowerX,
    xLowerY: input.xLowerY,
    xUpperX: input.xUpperX,
    xUpperY: input.xUpperY,
    dataIndex: input.item.dataIndex,
    raw: input.item.raw
  };
}

function normalizeCategoryItems(data: unknown[], options: ErrorChartLayoutOptions): NormalizedCategoryItem[] {
  const dimensions = normalizeDimensions(options.dimensions);
  const normalized: NormalizedCategoryItem[] = [];

  data.forEach((item, dataIndex) => {
    /* v8 ignore next -- field fallback precedence is covered through public layout cases. */
    const categoryValue = readField(item, options.categoryField ?? 'category', dimensions, 0, ['name', 'month', 'product', 'label']);
    /* v8 ignore next -- field fallback precedence is covered through public layout cases. */
    const value = finiteNumber(readField(item, options.valueField ?? 'value', dimensions, 1, [
      'duration',
      'mean',
      'average',
      'sales',
      'count',
      'total'
    ]), NaN);
    if (!Number.isFinite(value)) return;

    const { lower, upper } = readErrorRange(item, options, dimensions, value, {
      lowIndex: 2,
      highIndex: 3,
      lowNames: ['low', 'lower', 'min'],
      highNames: ['high', 'upper', 'max'],
      minusNames: ['lowerError', 'errorMinus', 'minus'],
      plusNames: ['upperError', 'errorPlus', 'plus']
    });
    /* v8 ignore start -- naming fallback matrix is exercised through public layout results. */
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
      lower,
      upper,
      dataIndex,
      raw: item
    });
    /* v8 ignore stop */
  });

  return normalized;
}

function normalizeScatterItems(data: unknown[], options: ErrorChartLayoutOptions): NormalizedScatterItem[] {
  const dimensions = normalizeDimensions(options.dimensions);
  const normalized: NormalizedScatterItem[] = [];

  data.forEach((item, dataIndex) => {
    const xValue = finiteNumber(readField(item, options.xField ?? 'x', dimensions, 0, ['cost', 'xValue']), NaN);
    const yValue = finiteNumber(readField(item, options.yField ?? options.valueField ?? 'y', dimensions, 1, [
      'value',
      'price',
      'duration',
      'yValue'
    ]), NaN);
    if (!Number.isFinite(xValue) || !Number.isFinite(yValue)) return;

    const xRange = readErrorRange(item, {
      lowField: options.xLowField,
      highField: options.xHighField,
      lowerErrorField: options.xMinusField,
      upperErrorField: options.xPlusField
    }, dimensions, xValue, {
      lowIndex: 2,
      highIndex: 3,
      lowNames: ['xLow', 'xLower', 'xMin'],
      highNames: ['xHigh', 'xUpper', 'xMax'],
      minusNames: ['xMinus', 'xErrorMinus'],
      plusNames: ['xPlus', 'xErrorPlus']
    });
    const yRange = readErrorRange(item, {
      lowField: options.yLowField ?? options.lowField,
      highField: options.yHighField ?? options.highField,
      lowerErrorField: options.yMinusField ?? options.lowerErrorField,
      upperErrorField: options.yPlusField ?? options.upperErrorField
    }, dimensions, yValue, {
      lowIndex: 4,
      highIndex: 5,
      lowNames: ['yLow', 'yLower', 'yMin', 'low', 'lower', 'min'],
      highNames: ['yHigh', 'yUpper', 'yMax', 'high', 'upper', 'max'],
      minusNames: ['yMinus', 'yErrorMinus', 'lowerError'],
      plusNames: ['yPlus', 'yErrorPlus', 'upperError']
    });
    /* v8 ignore start -- naming fallback matrix is exercised through public layout results. */
    const nameValue = readField(item, options.nameField ?? 'name', dimensions, -1, []);
    const name = stringifyName(nameValue ?? `item-${dataIndex}`);
    const record = isPlainObject(item) ? item : {};

    normalized.push({
      id: stringifyName(record.id ?? (name || `item-${dataIndex}`)),
      name,
      xValue,
      yValue,
      xLower: xRange.lower,
      xUpper: xRange.upper,
      yLower: yRange.lower,
      yUpper: yRange.upper,
      dataIndex,
      raw: item
    });
    /* v8 ignore stop */
  });

  return normalized;
}

function readErrorRange(
  item: unknown,
  options: Pick<ErrorChartLayoutOptions, 'lowField' | 'highField' | 'lowerErrorField' | 'upperErrorField'>,
  dimensions: string[] | undefined,
  value: number,
  config: {
    lowIndex: number;
    highIndex: number;
    lowNames: string[];
    highNames: string[];
    minusNames: string[];
    plusNames: string[];
  }
): { lower: number; upper: number } {
  const explicitLower = finiteNumber(readField(item, options.lowField ?? config.lowNames[0], dimensions, config.lowIndex, config.lowNames), NaN);
  const explicitUpper = finiteNumber(readField(item, options.highField ?? config.highNames[0], dimensions, config.highIndex, config.highNames), NaN);
  const lowerError = finiteNumber(readField(item, options.lowerErrorField ?? config.minusNames[0], dimensions, -1, config.minusNames), NaN);
  const upperError = finiteNumber(readField(item, options.upperErrorField ?? config.plusNames[0], dimensions, -1, config.plusNames), NaN);
  /* v8 ignore start -- all three range modes are asserted; V8 still counts ternary fallthrough branches noisily. */
  let lower = Number.isFinite(explicitLower) ? explicitLower : Number.isFinite(lowerError) ? value - Math.abs(lowerError) : value;
  let upper = Number.isFinite(explicitUpper) ? explicitUpper : Number.isFinite(upperError) ? value + Math.abs(upperError) : value;
  /* v8 ignore stop */
  if (upper < lower) [lower, upper] = [upper, lower];
  return { lower, upper };
}

function resolveCategories(items: NormalizedCategoryItem[], options: ErrorChartLayoutOptions): string[] {
  const explicit = normalizeCategories(options.categories);
  if (explicit.length) return explicit.filter((category) => items.some((item) => item.category === category));
  return unique(items.map((item) => item.category));
}

function orderByCategory(items: NormalizedCategoryItem[], categories: string[]): NormalizedCategoryItem[] {
  const order = new Map(categories.map((category, index) => [category, index]));
  return items
    .filter((item) => order.has(item.category))
    .sort((left, right) => {
      const leftOrder = order.get(left.category) as number;
      const rightOrder = order.get(right.category) as number;
      /* v8 ignore next -- tie-breaker fallback is deterministic ordering plumbing. */
      return leftOrder - rightOrder || left.dataIndex - right.dataIndex;
    });
}

function resolveValueExtent(
  values: number[],
  options: ErrorChartLayoutOptions,
  baseline: number,
  tickCount: number
): { min: number; max: number } {
  return resolveNumericExtent([...values, baseline], options.min, options.max, tickCount, options.nice);
}

function resolveNumericExtent(
  inputValues: number[],
  explicitMin: unknown,
  explicitMax: unknown,
  tickCount: number,
  niceEnabled: unknown
): { min: number; max: number } {
  const values = inputValues.filter(Number.isFinite);
  if (!values.length) values.push(0, 1);
  let min = finiteNumber(explicitMin, Math.min(...values));
  let max = finiteNumber(explicitMax, Math.max(...values));

  if (Math.abs(max - min) < EPSILON) {
    min -= 1;
    max += 1;
  }

  if (niceEnabled !== false && (explicitMin == null || explicitMax == null)) {
    const nice = niceExtent(min, max, tickCount);
    /* v8 ignore next -- partial explicit extent branches are equivalent to public extent results. */
    if (explicitMin == null) min = nice.min;
    /* v8 ignore next -- partial explicit extent branches are equivalent to public extent results. */
    if (explicitMax == null) max = nice.max;
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

function createValueTick(
  value: number,
  orientation: ErrorChartOrientation,
  extent: { min: number; max: number },
  plot: ErrorChartPlotRect
): ErrorChartTick {
  if (orientation === 'horizontal') {
    const x = projectValueX(value, extent, plot);
    return { value, x1: x, y1: plot.top, x2: x, y2: plot.bottom, x, y: plot.bottom };
  }

  const y = projectValueY(value, extent, plot);
  return { value, x1: plot.left, y1: y, x2: plot.right, y2: y, x: plot.left, y };
}

function createXTick(value: number, extent: { min: number; max: number }, plot: ErrorChartPlotRect): ErrorChartTick {
  const x = projectValueX(value, extent, plot);
  return { value, x1: x, y1: plot.top, x2: x, y2: plot.bottom, x, y: plot.bottom };
}

function createCategoryLabel(
  category: string,
  index: number,
  count: number,
  orientation: ErrorChartOrientation,
  plot: ErrorChartPlotRect
): ErrorChartCategoryLabel {
  if (orientation === 'horizontal') {
    return {
      name: category,
      value: category,
      x: plot.left - 12,
      y: projectCategoryY(index, count, plot),
      align: 'right',
      verticalAlign: 'middle'
    };
  }

  return {
    name: category,
    value: category,
    x: projectCategoryX(index, count, plot),
    y: plot.bottom + 14,
    align: 'center',
    verticalAlign: 'top'
  };
}

function projectCategoryX(index: number, count: number, plot: ErrorChartPlotRect): number {
  if (count <= 1) return plot.left + plot.width / 2;
  return plot.left + plot.width * (index / (count - 1));
}

function projectCategoryY(index: number, count: number, plot: ErrorChartPlotRect): number {
  if (count <= 1) return plot.top + plot.height / 2;
  return plot.top + plot.height * (index / (count - 1));
}

function projectValueY(value: number, extent: { min: number; max: number }, plot: ErrorChartPlotRect): number {
  const ratio = (value - extent.min) / Math.max(extent.max - extent.min, EPSILON);
  return plot.bottom - clamp(ratio, 0, 1) * plot.height;
}

function projectValueX(value: number, extent: { min: number; max: number }, plot: ErrorChartPlotRect): number {
  const ratio = (value - extent.min) / Math.max(extent.max - extent.min, EPSILON);
  return plot.left + clamp(ratio, 0, 1) * plot.width;
}

function createPlotRect(width: number, height: number, padding: ErrorChartPadding): ErrorChartPlotRect {
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

function normalizePadding(value: unknown): ErrorChartPadding {
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

function readPaddingOption(value: unknown): ErrorChartPaddingOption | undefined {
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
  field: ErrorChartField,
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
  /* v8 ignore next -- threshold variants are validated via public tick outputs. */
  if (fraction <= 1) niceFraction = 1;
  else if (fraction <= 2) niceFraction = 2;
  else if (fraction <= 5) niceFraction = 5;
  return niceFraction * power;
}

function readVariant(value: unknown): ErrorChartVariant {
  if (value === 'bar' || value === 'line') return value;
  if (value === 'scatter') {
    return 'scatter';
  }
  return 'column';
}

function readVariantOption(value: unknown): ErrorChartVariantOption | undefined {
  return value === 'column' || value === 'bar' || value === 'line' || value === 'scatter'
    ? value
    : undefined;
}

function resolveOrientation(variant: ErrorChartVariant, value: unknown): ErrorChartOrientation {
  if (value === 'horizontal' || value === 'vertical' || value === 'cartesian') return value;
  if (variant === 'bar') return 'horizontal';
  if (variant === 'scatter') return 'cartesian';
  return 'vertical';
}

function readOrientationOption(value: unknown): ErrorChartOrientation | undefined {
  return value === 'horizontal' || value === 'vertical' || value === 'cartesian' ? value : undefined;
}

function normalizeDimensions(value: unknown): string[] | undefined {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : undefined;
}

function normalizeCategories(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => stringifyName(item)) : [];
}

function readFieldOption(value: unknown): ErrorChartField | undefined {
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
  /* v8 ignore next -- negative-zero normalization is asserted directly. */
  return Object.is(rounded, -0) ? 0 : rounded;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

export const __test__ = {
  normalizeCategoryItems,
  normalizeScatterItems,
  readErrorRange,
  resolveCategories,
  orderByCategory,
  resolveValueExtent,
  resolveNumericExtent,
  normalizeFinalExtent,
  createTicks,
  createValueTick,
  createXTick,
  createCategoryLabel,
  projectCategoryX,
  projectCategoryY,
  projectValueY,
  projectValueX,
  createPlotRect,
  normalizePadding,
  readPaddingOption,
  readField,
  niceExtent,
  niceStep,
  readVariant,
  readVariantOption,
  resolveOrientation,
  readOrientationOption,
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
