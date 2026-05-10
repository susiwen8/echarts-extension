const DEFAULT_WIDTH = 480;
const DEFAULT_HEIGHT = 480;
const DEFAULT_PADDING = 28;
const EPSILON = 1e-9;

const DEFAULT_RESISTANCE_VALUES = [0, 0.2, 0.5, 1, 2, 4, 10];
const DEFAULT_REACTANCE_VALUES = [-10, -4, -2, -1, -0.5, -0.2, 0.2, 0.5, 1, 2, 4, 10];

export type SmithField = string | number;
export type SmithDataType = 'impedance' | 'gamma';
export type SmithPaddingOption = number | Partial<SmithPadding>;

export interface SmithPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface SmithGamma {
  real: number;
  imag: number;
  magnitude: number;
  angle: number;
}

export interface SmithNormalizedImpedance {
  r: number;
  x: number;
}

export interface SmithChartLayoutOptions {
  width?: number;
  height?: number;
  padding?: SmithPaddingOption;
  dataType?: SmithDataType;
  referenceImpedance?: number;
  dimensions?: string[];
  nameField?: SmithField;
  resistanceField?: SmithField;
  reactanceField?: SmithField;
  gammaField?: SmithField;
  gammaRealField?: SmithField;
  gammaImagField?: SmithField;
  resistanceValues?: number[];
  reactanceValues?: number[];
  showSwrCircle?: boolean;
  swrMagnitude?: number;
  swrIndex?: number;
  [key: string]: unknown;
}

export interface SmithChartLayoutOption extends SmithChartLayoutOptions {
  data?: unknown[];
  layout?: unknown;
  layoutOptions?: unknown;
}

export interface SmithCircle {
  value: number;
  cx: number;
  cy: number;
  r: number;
  labelX: number;
  labelY: number;
}

export interface SmithReactanceArc {
  value: number;
  cx: number;
  cy: number;
  r: number;
  startAngle: number;
  endAngle: number;
  clockwise: boolean;
  labelX: number;
  labelY: number;
}

export interface SmithSwrCircle {
  magnitude: number;
  swr: number;
  cx: number;
  cy: number;
  r: number;
}

export interface SmithPoint {
  id: string;
  name: string;
  normalized: SmithNormalizedImpedance;
  gamma: SmithGamma;
  x: number;
  y: number;
  dataIndex: number;
  raw: unknown;
}

export interface SmithChartLayoutResult {
  width: number;
  height: number;
  padding: SmithPadding;
  centerX: number;
  centerY: number;
  radius: number;
  referenceImpedance: number;
  unitCircle: SmithCircle;
  resistanceCircles: SmithCircle[];
  reactanceArcs: SmithReactanceArc[];
  reactanceAxis: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
  swrCircle?: SmithSwrCircle;
  points: SmithPoint[];
}

interface NormalizedSmithItem {
  id: string;
  name: string;
  normalized: SmithNormalizedImpedance;
  gamma: SmithGamma;
  dataIndex: number;
  raw: unknown;
}

export function resolveSmithChartLayout(option: SmithChartLayoutOption = {}): SmithChartLayoutResult {
  const layout = isPlainObject(option.layout) ? option.layout : {};
  const layoutOptions = isPlainObject(option.layoutOptions) ? option.layoutOptions : {};
  const merged: SmithChartLayoutOptions = {
    ...layout,
    ...layoutOptions,
    width: finiteNumber(option.width, finiteNumber(layoutOptions.width, finiteNumber(layout.width, DEFAULT_WIDTH))),
    height: finiteNumber(option.height, finiteNumber(layoutOptions.height, finiteNumber(layout.height, DEFAULT_HEIGHT))),
    padding: readPaddingOption(option.padding ?? layoutOptions.padding ?? layout.padding),
    dataType: readDataType(option.dataType ?? layoutOptions.dataType ?? layout.dataType),
    referenceImpedance: finiteNumber(option.referenceImpedance, finiteNumber(layoutOptions.referenceImpedance, finiteNumber(layout.referenceImpedance, undefined))),
    dimensions: normalizeDimensions(option.dimensions ?? layoutOptions.dimensions ?? layout.dimensions),
    nameField: readFieldOption(option.nameField ?? layoutOptions.nameField ?? layout.nameField),
    resistanceField: readFieldOption(option.resistanceField ?? layoutOptions.resistanceField ?? layout.resistanceField),
    reactanceField: readFieldOption(option.reactanceField ?? layoutOptions.reactanceField ?? layout.reactanceField),
    gammaField: readFieldOption(option.gammaField ?? layoutOptions.gammaField ?? layout.gammaField),
    gammaRealField: readFieldOption(option.gammaRealField ?? layoutOptions.gammaRealField ?? layout.gammaRealField),
    gammaImagField: readFieldOption(option.gammaImagField ?? layoutOptions.gammaImagField ?? layout.gammaImagField),
    resistanceValues: normalizeNumberArray(option.resistanceValues ?? layoutOptions.resistanceValues ?? layout.resistanceValues),
    reactanceValues: normalizeNumberArray(option.reactanceValues ?? layoutOptions.reactanceValues ?? layout.reactanceValues),
    showSwrCircle: firstBoolean(option.showSwrCircle, layoutOptions.showSwrCircle, layout.showSwrCircle),
    swrMagnitude: finiteNumber(option.swrMagnitude, finiteNumber(layoutOptions.swrMagnitude, finiteNumber(layout.swrMagnitude, undefined))),
    swrIndex: finiteNumber(option.swrIndex, finiteNumber(layoutOptions.swrIndex, finiteNumber(layout.swrIndex, undefined)))
  };

  return layoutSmithChart(Array.isArray(option.data) ? option.data : [], merged);
}

export function layoutSmithChart(data: unknown[], options: SmithChartLayoutOptions = {}): SmithChartLayoutResult {
  const width = Math.max(1, finiteNumber(options.width, DEFAULT_WIDTH));
  const height = Math.max(1, finiteNumber(options.height, DEFAULT_HEIGHT));
  const padding = normalizePadding(options.padding);
  const innerLeft = clamp(padding.left, 0, Math.max(width - 1, 0));
  const innerTop = clamp(padding.top, 0, Math.max(height - 1, 0));
  const innerRight = Math.max(innerLeft + 1, width - Math.max(0, padding.right));
  const innerBottom = Math.max(innerTop + 1, height - Math.max(0, padding.bottom));
  const innerWidth = Math.max(1, innerRight - innerLeft);
  const innerHeight = Math.max(1, innerBottom - innerTop);
  const radius = Math.max(1, Math.min(innerWidth, innerHeight) / 2);
  const centerX = cleanNumber(innerLeft + innerWidth / 2);
  const centerY = cleanNumber(innerTop + innerHeight / 2);
  const referenceImpedance = Math.max(EPSILON, finiteNumber(options.referenceImpedance, 1));
  const points = normalizeSmithItems(data, { ...options, referenceImpedance })
    .map((item) => ({
      ...item,
      x: projectGammaReal(item.gamma.real, centerX, radius),
      y: projectGammaImag(item.gamma.imag, centerY, radius)
    }));
  const resistanceValues = normalizeResistanceValues(options.resistanceValues);
  const reactanceValues = normalizeReactanceValues(options.reactanceValues);
  const unitCircle = createResistanceCircle(0, centerX, centerY, radius);
  const resistanceCircles = resistanceValues.map((value) => createResistanceCircle(value, centerX, centerY, radius));
  const reactanceArcs = reactanceValues.map((value) => createReactanceArc(value, centerX, centerY, radius));
  const swrCircle = resolveSwrCircle(options, points, centerX, centerY, radius);

  return {
    width,
    height,
    padding,
    centerX,
    centerY,
    radius,
    referenceImpedance,
    unitCircle,
    resistanceCircles,
    reactanceArcs,
    reactanceAxis: {
      x1: centerX - radius,
      y1: centerY,
      x2: centerX + radius,
      y2: centerY
    },
    ...(swrCircle ? { swrCircle } : {}),
    points
  };
}

export function impedanceToGamma(resistance: number, reactance: number): SmithGamma {
  const r = finiteNumber(resistance, NaN);
  const x = finiteNumber(reactance, 0);
  if (!Number.isFinite(r)) return createGamma(1, 0);
  const denominator = (r + 1) ** 2 + x ** 2;
  if (denominator <= EPSILON) return createGamma(1, 0);
  return createGamma((r ** 2 + x ** 2 - 1) / denominator, (2 * x) / denominator);
}

export function gammaToImpedance(real: number, imag: number): SmithNormalizedImpedance {
  const gamma = clampGamma(real, imag);
  const denominator = (1 - gamma.real) ** 2 + gamma.imag ** 2;
  if (denominator <= EPSILON) return { r: Infinity, x: 0 };
  return {
    r: cleanNumber((1 - gamma.real ** 2 - gamma.imag ** 2) / denominator),
    x: cleanNumber((2 * gamma.imag) / denominator)
  };
}

function normalizeSmithItems(data: unknown[], options: SmithChartLayoutOptions): NormalizedSmithItem[] {
  const dimensions = normalizeDimensions(options.dimensions);
  const dataType = options.dataType === 'gamma' ? 'gamma' : 'impedance';
  const referenceImpedance = Math.max(EPSILON, finiteNumber(options.referenceImpedance, 1));
  const items: NormalizedSmithItem[] = [];

  data.forEach((raw, dataIndex) => {
    const nameValue = readField(raw, options.nameField ?? 'name', dimensions, 0, ['label', 'id']);
    const name = stringifyName(nameValue) || `item-${dataIndex}`;
    const id = stringifyName(isPlainObject(raw) ? raw.id : undefined) || name;
    const normalized = dataType === 'gamma'
      ? readGammaImpedance(raw, options, dimensions)
      : readNormalizedImpedance(raw, options, dimensions, referenceImpedance);
    if (!normalized) return;
    const gamma = dataType === 'gamma'
      ? readGamma(raw, options, dimensions)!
      : impedanceToGamma(normalized.r, normalized.x);
    const clampedGamma = clampGamma(gamma.real, gamma.imag);

    items.push({
      id,
      name,
      normalized,
      gamma: clampedGamma,
      dataIndex,
      raw
    });
  });

  return items;
}

function readNormalizedImpedance(
  raw: unknown,
  options: SmithChartLayoutOptions,
  dimensions: string[] | undefined,
  referenceImpedance: number
): SmithNormalizedImpedance | null {
  const pair = readPair(readField(raw, 'impedance', dimensions, -1, ['z', 'impedance']));
  if (pair) return normalizeImpedancePair(pair, referenceImpedance);

  const resistance = readNumber(readField(raw, options.resistanceField ?? 'r', dimensions, 1, ['resistance', 'real', 'ohms']));
  const reactance = readNumber(readField(raw, options.reactanceField ?? 'x', dimensions, 2, ['reactance', 'imag', 'imaginary']));
  if (resistance == null) return null;
  return normalizeImpedancePair([resistance, reactance ?? 0], referenceImpedance);
}

function readGammaImpedance(
  raw: unknown,
  options: SmithChartLayoutOptions,
  dimensions: string[] | undefined
): SmithNormalizedImpedance | null {
  const gamma = readGamma(raw, options, dimensions);
  return gamma ? gammaToImpedance(gamma.real, gamma.imag) : null;
}

function readGamma(raw: unknown, options: SmithChartLayoutOptions, dimensions: string[] | undefined): SmithGamma | null {
  const pair = readPair(readField(raw, options.gammaField ?? 'gamma', dimensions, -1, ['gamma']));
  if (pair) return createGamma(pair[0], pair[1]);

  const real = readNumber(readField(raw, options.gammaRealField ?? 'gammaReal', dimensions, 1, ['real', 'gammaRe']));
  const imag = readNumber(readField(raw, options.gammaImagField ?? 'gammaImag', dimensions, 2, ['imag', 'gammaIm', 'imaginary']));
  return real == null ? null : createGamma(real, imag ?? 0);
}

function normalizeImpedancePair(pair: [number, number], referenceImpedance: number): SmithNormalizedImpedance {
  return {
    r: cleanNumber(pair[0] / referenceImpedance),
    x: cleanNumber(pair[1] / referenceImpedance)
  };
}

function createResistanceCircle(value: number, centerX: number, centerY: number, radius: number): SmithCircle {
  const normalized = Math.max(0, value);
  const circleRadius = radius / (1 + normalized);
  const cx = centerX + radius * (normalized / (1 + normalized));
  const labelGamma = normalized <= EPSILON ? -1 : (normalized - 1) / (normalized + 1);
  return {
    value: cleanNumber(normalized),
    cx: cleanNumber(cx),
    cy: centerY,
    r: cleanNumber(circleRadius),
    labelX: projectGammaReal(labelGamma, centerX, radius),
    labelY: cleanNumber(centerY - 6)
  };
}

function createReactanceArc(value: number, centerX: number, centerY: number, radius: number): SmithReactanceArc {
  const reactance = Math.abs(value) < EPSILON ? EPSILON : value;
  const arcRadius = radius / Math.abs(reactance);
  const cx = centerX + radius;
  const cy = centerY - radius / reactance;
  const open = { x: centerX + radius, y: centerY };
  const zeroResistanceGamma = impedanceToGamma(0, reactance);
  const zeroResistance = {
    x: projectGammaReal(zeroResistanceGamma.real, centerX, radius),
    y: projectGammaImag(zeroResistanceGamma.imag, centerY, radius)
  };

  return {
    value: cleanNumber(reactance),
    cx: cleanNumber(cx),
    cy: cleanNumber(cy),
    r: cleanNumber(arcRadius),
    startAngle: cleanNumber(Math.atan2(open.y - cy, open.x - cx)),
    endAngle: cleanNumber(Math.atan2(zeroResistance.y - cy, zeroResistance.x - cx)),
    clockwise: reactance < 0,
    labelX: cleanNumber(zeroResistance.x),
    labelY: cleanNumber(zeroResistance.y + (reactance > 0 ? -8 : 8))
  };
}

function resolveSwrCircle(
  options: SmithChartLayoutOptions,
  points: SmithPoint[],
  centerX: number,
  centerY: number,
  radius: number
): SmithSwrCircle | undefined {
  if (options.showSwrCircle !== true && options.swrMagnitude == null) return undefined;
  const explicit = finiteNumber(options.swrMagnitude, undefined);
  const pointIndex = clamp(Math.round(finiteNumber(options.swrIndex, 0)), 0, Math.max(points.length - 1, 0));
  const magnitude = clamp(explicit ?? points[pointIndex]?.gamma.magnitude ?? 0, 0, 1);
  return {
    magnitude: cleanNumber(magnitude),
    swr: magnitude >= 1 - EPSILON ? Infinity : cleanNumber((1 + magnitude) / (1 - magnitude)),
    cx: centerX,
    cy: centerY,
    r: cleanNumber(radius * magnitude)
  };
}

function projectGammaReal(value: number, centerX: number, radius: number): number {
  return cleanNumber(centerX + clamp(value, -1, 1) * radius);
}

function projectGammaImag(value: number, centerY: number, radius: number): number {
  return cleanNumber(centerY - clamp(value, -1, 1) * radius);
}

function createGamma(real: number, imag: number): SmithGamma {
  const re = cleanNumber(finiteNumber(real, 0));
  const im = cleanNumber(finiteNumber(imag, 0));
  return {
    real: re,
    imag: im,
    magnitude: cleanNumber(Math.hypot(re, im)),
    angle: Math.atan2(im, re)
  };
}

function clampGamma(real: number, imag: number): SmithGamma {
  const gamma = createGamma(real, imag);
  if (gamma.magnitude <= 1) return gamma;
  return createGamma(gamma.real / gamma.magnitude, gamma.imag / gamma.magnitude);
}

function normalizeResistanceValues(values: unknown): number[] {
  const normalized = normalizeNumberArray(values);
  return uniqueNumbers((normalized.length ? normalized : DEFAULT_RESISTANCE_VALUES)
    .filter((value) => Number.isFinite(value) && value >= 0)
    .sort((left, right) => left - right));
}

function normalizeReactanceValues(values: unknown): number[] {
  const normalized = normalizeNumberArray(values);
  return uniqueNumbers((normalized.length ? normalized : DEFAULT_REACTANCE_VALUES)
    .filter((value) => Number.isFinite(value) && Math.abs(value) > EPSILON)
    .sort((left, right) => left - right));
}

function normalizePadding(value: unknown): SmithPadding {
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

function readPaddingOption(value: unknown): SmithPaddingOption | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (!isPlainObject(value)) return undefined;
  return {
    top: finiteNumber(value.top, undefined),
    right: finiteNumber(value.right, undefined),
    bottom: finiteNumber(value.bottom, undefined),
    left: finiteNumber(value.left, undefined)
  };
}

function readField(
  item: unknown,
  field: SmithField,
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

function readPair(value: unknown): [number, number] | null {
  if (Array.isArray(value)) {
    const real = readNumber(value[0]);
    const imag = readNumber(value[1]);
    return real == null ? null : [real, imag ?? 0];
  }

  if (isPlainObject(value)) {
    const real = readNumber(value.r ?? value.real ?? value.re ?? value.resistance);
    const imag = readNumber(value.x ?? value.imag ?? value.im ?? value.reactance);
    return real == null ? null : [real, imag ?? 0];
  }

  return null;
}

function readNumber(value: unknown): number | null {
  const number = finiteNumber(value, NaN);
  return Number.isFinite(number) ? number : null;
}

function readDataType(value: unknown): SmithDataType | undefined {
  return value === 'gamma' || value === 'impedance' ? value : undefined;
}

function normalizeDimensions(value: unknown): string[] | undefined {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : undefined;
}

function normalizeNumberArray(value: unknown): number[] {
  return Array.isArray(value)
    ? value.map((item) => finiteNumber(item, NaN)).filter((item) => Number.isFinite(item))
    : [];
}

function readFieldOption(value: unknown): SmithField | undefined {
  return typeof value === 'string' || typeof value === 'number' ? value : undefined;
}

function firstBoolean(...values: unknown[]): boolean | undefined {
  return values.find((value): value is boolean => typeof value === 'boolean');
}

function uniqueNumbers(values: number[]): number[] {
  const seen = new Set<string>();
  const result: number[] = [];
  values.forEach((value) => {
    const key = String(cleanNumber(value));
    if (seen.has(key)) return;
    seen.add(key);
    result.push(cleanNumber(value));
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
  return Number(value.toFixed(12));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

export const __test__ = {
  normalizeSmithItems,
  readNormalizedImpedance,
  readGammaImpedance,
  readGamma,
  normalizeImpedancePair,
  createResistanceCircle,
  createReactanceArc,
  resolveSwrCircle,
  projectGammaReal,
  projectGammaImag,
  createGamma,
  clampGamma,
  normalizeResistanceValues,
  normalizeReactanceValues,
  normalizePadding,
  readPaddingOption,
  readField,
  readPair,
  readNumber,
  readDataType,
  normalizeDimensions,
  normalizeNumberArray,
  readFieldOption,
  firstBoolean,
  uniqueNumbers,
  stringifyName,
  finiteNumber,
  cleanNumber,
  clamp,
  isPlainObject
};
