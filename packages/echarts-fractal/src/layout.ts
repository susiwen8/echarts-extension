const DEFAULT_WIDTH = 640;
const DEFAULT_HEIGHT = 420;
const DEFAULT_PIXEL_RATIO = 1;
const DEFAULT_MAX_PIXEL_COUNT = 380_000;
const DEFAULT_BASE_ITERATIONS = 180;
const DEFAULT_ITERATION_BOOST = 42;
const DEFAULT_ITERATION_LIMIT = 2400;
const DEFAULT_ESCAPE_RADIUS = 2;
const DEFAULT_VIEW_WIDTH = 3.2;
const DEFAULT_INSIDE_COLOR = '#050609';
const DEFAULT_JULIA_CONSTANT: [number, number] = [-0.8, 0.156];

export type FractalType = 'mandelbrot' | 'julia' | 'burningShip';
export type FractalColorStopOption = [number, string] | {
  offset?: number;
  color?: string;
};

export interface FractalViewportOption {
  center?: [number, number];
  viewWidth?: number;
  scale?: number;
  zoom?: number;
}

export interface ResolvedFractalViewport {
  center: [number, number];
  baseViewWidth: number;
  viewWidth: number;
  viewHeight: number;
  scale: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface FractalRenderOption {
  width?: number;
  height?: number;
  pixelRatio?: number;
  maxPixelCount?: number;
  fractalType?: FractalType;
  viewport?: FractalViewportOption;
  center?: [number, number];
  viewWidth?: number;
  scale?: number;
  zoom?: number;
  maxIterations?: number;
  baseIterations?: number;
  iterationBoost?: number;
  iterationLimit?: number;
  escapeRadius?: number;
  juliaConstant?: [number, number];
  colorStops?: FractalColorStopOption[];
  insideColor?: string;
}

export interface FractalRenderProfileOption {
  interactive?: boolean;
  interactivePixelRatio?: number;
  interactiveMaxPixelCount?: number;
  interactiveIterationScale?: number;
  minInteractiveIterations?: number;
}

export interface FractalRenderPlan {
  width: number;
  height: number;
  pixelRatio: number;
  pixelWidth: number;
  pixelHeight: number;
  pixelStepX: number;
  pixelStepY: number;
  fractalType: FractalType;
  viewport: ResolvedFractalViewport;
  iterations: number;
  escapeRadius: number;
  juliaConstant: [number, number];
  colorStops: ResolvedColorStop[];
  insideColor: RgbaColor;
}

export interface FractalIterationOptions {
  fractalType?: FractalType;
  maxIterations?: number;
  escapeRadius?: number;
  juliaConstant?: [number, number];
}

export interface FractalIterationResult {
  escaped: boolean;
  iterations: number;
  smoothIteration: number;
  magnitude: number;
}

export interface FractalRaster {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

export interface FractalViewportImageTransform {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ResolvedColorStop {
  offset: number;
  color: RgbaColor;
}

interface RgbaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

interface ZoomFractalViewportOptions {
  width: number;
  height: number;
  localX: number;
  localY: number;
  zoomFactor: number;
  minZoom?: number;
  maxZoom?: number | null;
}

interface PanFractalViewportOptions {
  width: number;
  height: number;
  deltaX: number;
  deltaY: number;
}

const defaultColorStops: FractalColorStopOption[] = [
  [0, '#07111f'],
  [0.18, '#2454a6'],
  [0.4, '#16a3a3'],
  [0.68, '#e6a13d'],
  [1, '#fff7d6']
];

export function resolveFractalRenderPlan(option: FractalRenderOption = {}): FractalRenderPlan {
  const width = Math.max(1, finiteNumber(option.width, DEFAULT_WIDTH));
  const height = Math.max(1, finiteNumber(option.height, DEFAULT_HEIGHT));
  const fractalType = readFractalType(option.fractalType);
  const viewport = resolveFractalViewport(option, width, height, fractalType);
  const pixelSize = resolvePixelSize(width, height, option.pixelRatio, option.maxPixelCount);
  const iterations = resolveIterationCount(option, viewport.scale);
  const escapeRadius = Math.max(1.01, finiteNumber(option.escapeRadius, DEFAULT_ESCAPE_RADIUS));

  return {
    width,
    height,
    pixelRatio: pixelSize.pixelRatio,
    pixelWidth: pixelSize.pixelWidth,
    pixelHeight: pixelSize.pixelHeight,
    pixelStepX: viewport.viewWidth / pixelSize.pixelWidth,
    pixelStepY: viewport.viewHeight / pixelSize.pixelHeight,
    fractalType,
    viewport,
    iterations,
    escapeRadius,
    juliaConstant: readPoint(option.juliaConstant) ?? DEFAULT_JULIA_CONSTANT,
    colorStops: resolveColorStops(option.colorStops),
    insideColor: parseColor(option.insideColor) ?? parseColor(DEFAULT_INSIDE_COLOR)!
  };
}

export function applyFractalRenderProfile(
  option: FractalRenderOption,
  profile: FractalRenderProfileOption = {}
): FractalRenderOption {
  if (!profile.interactive) return { ...option };

  const iterationScale = clamp(finiteNumber(profile.interactiveIterationScale, 0.45), 0.05, 1);
  const minIterations = Math.max(1, Math.floor(finiteNumber(profile.minInteractiveIterations, 72)));
  const maxPixelCount = Math.max(1, Math.floor(finiteNumber(
    profile.interactiveMaxPixelCount,
    Math.min(finiteNumber(option.maxPixelCount, DEFAULT_MAX_PIXEL_COUNT), 110_000)
  )));
  const pixelRatio = finiteNumber(profile.interactivePixelRatio, NaN);
  const next: FractalRenderOption = {
    ...option,
    maxPixelCount: Math.min(Math.max(1, Math.floor(finiteNumber(option.maxPixelCount, maxPixelCount))), maxPixelCount),
    baseIterations: scaleIterationOption(option.baseIterations, DEFAULT_BASE_ITERATIONS, iterationScale, minIterations),
    iterationBoost: Math.max(0, finiteNumber(option.iterationBoost, DEFAULT_ITERATION_BOOST) * iterationScale),
    iterationLimit: scaleIterationOption(option.iterationLimit, DEFAULT_ITERATION_LIMIT, iterationScale, minIterations)
  };
  const fixedMaxIterations = finiteNumber(option.maxIterations, NaN);

  if (Number.isFinite(pixelRatio)) {
    next.pixelRatio = Math.min(Math.max(0.05, finiteNumber(option.pixelRatio, pixelRatio)), Math.max(0.05, pixelRatio));
  }
  if (Number.isFinite(fixedMaxIterations)) {
    next.maxIterations = Math.max(minIterations, Math.floor(fixedMaxIterations * iterationScale));
  }

  return next;
}

export function resolveFractalViewportImageTransform(
  source: ResolvedFractalViewport,
  target: ResolvedFractalViewport,
  width: number,
  height: number
): FractalViewportImageTransform {
  const scaleX = source.viewWidth / Math.max(target.viewWidth, Number.EPSILON);
  const scaleY = source.viewHeight / Math.max(target.viewHeight, Number.EPSILON);

  return {
    x: (source.minX - target.minX) / Math.max(target.viewWidth, Number.EPSILON) * width,
    y: (target.maxY - source.maxY) / Math.max(target.viewHeight, Number.EPSILON) * height,
    width: width * scaleX,
    height: height * scaleY
  };
}

export function zoomFractalViewport(
  viewport: ResolvedFractalViewport | FractalViewportOption,
  options: ZoomFractalViewportOptions
): ResolvedFractalViewport {
  const width = Math.max(1, finiteNumber(options.width, DEFAULT_WIDTH));
  const height = Math.max(1, finiteNumber(options.height, DEFAULT_HEIGHT));
  const current = ensureResolvedViewport(viewport, width, height);
  const localX = clamp(finiteNumber(options.localX, width / 2), 0, width);
  const localY = clamp(finiteNumber(options.localY, height / 2), 0, height);
  const factor = Math.max(Number.EPSILON, finiteNumber(options.zoomFactor, 1));
  const minZoom = Math.max(Number.EPSILON, finiteNumber(options.minZoom, Number.EPSILON));
  const maxZoom = options.maxZoom == null ? Number.POSITIVE_INFINITY : Math.max(minZoom, finiteNumber(options.maxZoom, Number.POSITIVE_INFINITY));
  const nextScale = clamp(current.scale * factor, minZoom, maxZoom);
  const normalizedX = localX / width - 0.5;
  const normalizedY = 0.5 - localY / height;
  const focusX = current.center[0] + normalizedX * current.viewWidth;
  const focusY = current.center[1] + normalizedY * current.viewHeight;
  const nextViewWidth = current.baseViewWidth / nextScale;
  const nextViewHeight = nextViewWidth * height / width;
  const center: [number, number] = [
    focusX - normalizedX * nextViewWidth,
    focusY - normalizedY * nextViewHeight
  ];

  return makeViewport(center, current.baseViewWidth, nextScale, width, height);
}

export function panFractalViewport(
  viewport: ResolvedFractalViewport | FractalViewportOption,
  options: PanFractalViewportOptions
): ResolvedFractalViewport {
  const width = Math.max(1, finiteNumber(options.width, DEFAULT_WIDTH));
  const height = Math.max(1, finiteNumber(options.height, DEFAULT_HEIGHT));
  const current = ensureResolvedViewport(viewport, width, height);
  const deltaX = finiteNumber(options.deltaX, 0);
  const deltaY = finiteNumber(options.deltaY, 0);
  const center: [number, number] = [
    current.center[0] - deltaX / width * current.viewWidth,
    current.center[1] + deltaY / height * current.viewHeight
  ];

  return makeViewport(center, current.baseViewWidth, current.scale, width, height);
}

export function buildFractalRaster(plan: FractalRenderPlan): FractalRaster {
  const data = new Uint8ClampedArray(plan.pixelWidth * plan.pixelHeight * 4);
  const maxIterations = plan.iterations;
  const escapeRadius = plan.escapeRadius;
  const options: FractalIterationOptions = {
    fractalType: plan.fractalType,
    maxIterations,
    escapeRadius,
    juliaConstant: plan.juliaConstant
  };
  let offset = 0;

  for (let pixelY = 0; pixelY < plan.pixelHeight; pixelY += 1) {
    const y = plan.viewport.maxY - (pixelY + 0.5) * plan.pixelStepY;
    for (let pixelX = 0; pixelX < plan.pixelWidth; pixelX += 1) {
      const x = plan.viewport.minX + (pixelX + 0.5) * plan.pixelStepX;
      const sample = iterateFractalPoint(x, y, options);
      const color = colorForSample(sample, plan);
      data[offset] = color.r;
      data[offset + 1] = color.g;
      data[offset + 2] = color.b;
      data[offset + 3] = color.a;
      offset += 4;
    }
  }

  return {
    width: plan.pixelWidth,
    height: plan.pixelHeight,
    data
  };
}

export function iterateFractalPoint(
  x: number,
  y: number,
  options: FractalIterationOptions = {}
): FractalIterationResult {
  const fractalType = readFractalType(options.fractalType);
  const maxIterations = Math.max(1, Math.floor(finiteNumber(options.maxIterations, DEFAULT_BASE_ITERATIONS)));
  const escapeRadius = Math.max(1.01, finiteNumber(options.escapeRadius, DEFAULT_ESCAPE_RADIUS));
  const escapeRadiusSquared = escapeRadius * escapeRadius;
  const juliaConstant = readPoint(options.juliaConstant) ?? DEFAULT_JULIA_CONSTANT;
  let zr = fractalType === 'mandelbrot' || fractalType === 'burningShip' ? 0 : x;
  let zi = fractalType === 'mandelbrot' || fractalType === 'burningShip' ? 0 : y;
  const cr = fractalType === 'julia' ? juliaConstant[0] : x;
  const ci = fractalType === 'julia' ? juliaConstant[1] : y;
  let magnitudeSquared = zr * zr + zi * zi;

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    if (magnitudeSquared > escapeRadiusSquared) {
      return escapedResult(iteration, magnitudeSquared, maxIterations);
    }

    const nextInputR = fractalType === 'burningShip' ? Math.abs(zr) : zr;
    const nextInputI = fractalType === 'burningShip' ? Math.abs(zi) : zi;
    const nextR = nextInputR * nextInputR - nextInputI * nextInputI + cr;
    const nextI = 2 * nextInputR * nextInputI + ci;
    zr = nextR;
    zi = nextI;
    magnitudeSquared = zr * zr + zi * zi;
  }

  return {
    escaped: false,
    iterations: maxIterations,
    smoothIteration: maxIterations,
    magnitude: Math.sqrt(magnitudeSquared)
  };
}

function resolveFractalViewport(
  option: FractalRenderOption,
  width: number,
  height: number,
  fractalType: FractalType
): ResolvedFractalViewport {
  const viewport = isPlainObject(option.viewport) ? option.viewport : {};
  const center = readPoint(viewport.center)
    ?? readPoint(option.center)
    ?? defaultCenter(fractalType);
  const viewportBaseWidth = isPlainObject(viewport) && typeof viewport.baseViewWidth === 'number'
    ? viewport.baseViewWidth
    : viewport.viewWidth;
  const baseViewWidth = Math.max(
    Number.EPSILON,
    finiteNumber(viewportBaseWidth, finiteNumber(option.viewWidth, defaultViewWidth(fractalType)))
  );
  const scale = Math.max(
    Number.EPSILON,
    finiteNumber(viewport.scale, finiteNumber(viewport.zoom, finiteNumber(option.scale, finiteNumber(option.zoom, 1))))
  );

  return makeViewport(center, baseViewWidth, scale, width, height);
}

function ensureResolvedViewport(
  viewport: ResolvedFractalViewport | FractalViewportOption,
  width: number,
  height: number
): ResolvedFractalViewport {
  if (
    isPlainObject(viewport)
    && typeof viewport.baseViewWidth === 'number'
    && typeof viewport.viewHeight === 'number'
    && Array.isArray(viewport.center)
  ) {
    return makeViewport(
      readPoint(viewport.center) ?? defaultCenter('mandelbrot'),
      Math.max(Number.EPSILON, finiteNumber(viewport.baseViewWidth, DEFAULT_VIEW_WIDTH)),
      Math.max(Number.EPSILON, finiteNumber(viewport.scale, 1)),
      width,
      height
    );
  }

  return resolveFractalViewport({ viewport }, width, height, 'mandelbrot');
}

function makeViewport(
  center: [number, number],
  baseViewWidth: number,
  scale: number,
  width: number,
  height: number
): ResolvedFractalViewport {
  const viewWidth = baseViewWidth / scale;
  const viewHeight = viewWidth * height / width;
  const halfWidth = viewWidth / 2;
  const halfHeight = viewHeight / 2;

  return {
    center,
    baseViewWidth,
    viewWidth,
    viewHeight,
    scale,
    minX: center[0] - halfWidth,
    maxX: center[0] + halfWidth,
    minY: center[1] - halfHeight,
    maxY: center[1] + halfHeight
  };
}

function resolvePixelSize(
  width: number,
  height: number,
  rawPixelRatio: unknown,
  rawMaxPixelCount: unknown
): { pixelRatio: number; pixelWidth: number; pixelHeight: number } {
  const requestedPixelRatio = Math.max(0.05, finiteNumber(rawPixelRatio, DEFAULT_PIXEL_RATIO));
  const maxPixelCount = Math.max(1, Math.floor(finiteNumber(rawMaxPixelCount, DEFAULT_MAX_PIXEL_COUNT)));
  const requestedWidth = Math.max(1, Math.round(width * requestedPixelRatio));
  const requestedHeight = Math.max(1, Math.round(height * requestedPixelRatio));
  const requestedPixels = requestedWidth * requestedHeight;

  if (requestedPixels <= maxPixelCount) {
    return {
      pixelRatio: requestedPixelRatio,
      pixelWidth: requestedWidth,
      pixelHeight: requestedHeight
    };
  }

  const reduction = Math.sqrt(maxPixelCount / requestedPixels);
  const pixelWidth = Math.max(1, Math.floor(requestedWidth * reduction));
  const pixelHeight = Math.max(1, Math.floor(requestedHeight * reduction));

  return {
    pixelRatio: pixelWidth / width,
    pixelWidth,
    pixelHeight
  };
}

function resolveIterationCount(option: FractalRenderOption, scale: number): number {
  const fixedIterations = finiteNumber(option.maxIterations, NaN);
  if (Number.isFinite(fixedIterations)) return Math.max(1, Math.floor(fixedIterations));

  const baseIterations = Math.max(1, Math.floor(finiteNumber(option.baseIterations, DEFAULT_BASE_ITERATIONS)));
  const iterationBoost = Math.max(0, finiteNumber(option.iterationBoost, DEFAULT_ITERATION_BOOST));
  const iterationLimit = Math.max(baseIterations, Math.floor(finiteNumber(option.iterationLimit, DEFAULT_ITERATION_LIMIT)));
  const zoomDepth = Math.max(0, Math.log2(Math.max(1, scale)));
  return Math.min(iterationLimit, Math.ceil(baseIterations + zoomDepth * iterationBoost));
}

function scaleIterationOption(value: unknown, fallback: number, scale: number, minimum: number): number {
  return Math.max(minimum, Math.floor(finiteNumber(value, fallback) * scale));
}

function escapedResult(iterations: number, magnitudeSquared: number, maxIterations: number): FractalIterationResult {
  const magnitude = Math.sqrt(magnitudeSquared);
  const logMagnitude = Math.log(Math.max(magnitude, Number.EPSILON));
  const smoothOffset = logMagnitude > 0
    ? Math.log(logMagnitude / Math.LN2) / Math.LN2
    : 0;

  return {
    escaped: true,
    iterations,
    smoothIteration: clamp(iterations + 1 - smoothOffset, 0, maxIterations),
    magnitude
  };
}

function colorForSample(sample: FractalIterationResult, plan: FractalRenderPlan): RgbaColor {
  if (!sample.escaped) return plan.insideColor;
  const offset = clamp(sample.smoothIteration / Math.max(1, plan.iterations), 0, 1);
  return interpolateColor(plan.colorStops, offset);
}

function resolveColorStops(stops: unknown): ResolvedColorStop[] {
  const rawStops = Array.isArray(stops) && stops.length ? stops : defaultColorStops;
  const resolved = rawStops
    .map(readColorStop)
    .filter((stop): stop is ResolvedColorStop => Boolean(stop))
    .sort((left, right) => left.offset - right.offset);

  if (!resolved.length) return resolveColorStops(defaultColorStops);
  if (resolved[0].offset > 0) resolved.unshift({ offset: 0, color: resolved[0].color });
  if (resolved[resolved.length - 1].offset < 1) resolved.push({ offset: 1, color: resolved[resolved.length - 1].color });
  return resolved;
}

function readColorStop(value: unknown): ResolvedColorStop | null {
  const offset = Array.isArray(value)
    ? finiteNumber(value[0], NaN)
    : isPlainObject(value)
      ? finiteNumber(value.offset, NaN)
      : NaN;
  const color = Array.isArray(value)
    ? parseColor(value[1])
    : isPlainObject(value)
      ? parseColor(value.color)
      : null;

  if (!Number.isFinite(offset) || !color) return null;
  return {
    offset: clamp(offset, 0, 1),
    color
  };
}

function interpolateColor(stops: ResolvedColorStop[], offset: number): RgbaColor {
  let rightIndex = stops.findIndex((stop) => stop.offset >= offset);
  if (rightIndex < 0) rightIndex = stops.length - 1;
  const right = stops[rightIndex];
  const left = stops[Math.max(0, rightIndex - 1)];
  const span = Math.max(Number.EPSILON, right.offset - left.offset);
  const amount = clamp((offset - left.offset) / span, 0, 1);

  return {
    r: Math.round(lerp(left.color.r, right.color.r, amount)),
    g: Math.round(lerp(left.color.g, right.color.g, amount)),
    b: Math.round(lerp(left.color.b, right.color.b, amount)),
    a: Math.round(lerp(left.color.a, right.color.a, amount))
  };
}

function parseColor(value: unknown): RgbaColor | null {
  if (typeof value !== 'string') return null;
  const color = value.trim();
  const named = namedColors[color.toLowerCase()];
  if (named) return named;
  if (color.startsWith('#')) return parseHexColor(color);
  return parseRgbColor(color);
}

function parseHexColor(color: string): RgbaColor | null {
  const hex = color.slice(1);
  if (![3, 4, 6, 8].includes(hex.length) || /[^0-9a-f]/i.test(hex)) return null;
  const expanded = hex.length <= 4
    ? hex.split('').map((part) => `${part}${part}`).join('')
    : hex;
  const numeric = Number.parseInt(expanded, 16);
  const hasAlpha = expanded.length === 8;

  return {
    r: (numeric >> (hasAlpha ? 24 : 16)) & 255,
    g: (numeric >> (hasAlpha ? 16 : 8)) & 255,
    b: (numeric >> (hasAlpha ? 8 : 0)) & 255,
    a: hasAlpha ? numeric & 255 : 255
  };
}

function parseRgbColor(color: string): RgbaColor | null {
  const match = /^rgba?\(([^)]+)\)$/i.exec(color);
  if (!match) return null;
  const parts = match[1].split(',').map((part) => part.trim());
  if (parts.length < 3) return null;
  const r = Number(parts[0]);
  const g = Number(parts[1]);
  const b = Number(parts[2]);
  const a = parts[3] == null ? 1 : Number(parts[3]);
  if (![r, g, b, a].every(Number.isFinite)) return null;

  return {
    r: clamp(Math.round(r), 0, 255),
    g: clamp(Math.round(g), 0, 255),
    b: clamp(Math.round(b), 0, 255),
    a: clamp(Math.round(a * 255), 0, 255)
  };
}

function readFractalType(value: unknown): FractalType {
  return value === 'julia' || value === 'burningShip' ? value : 'mandelbrot';
}

function defaultCenter(fractalType: FractalType): [number, number] {
  if (fractalType === 'julia') return [0, 0];
  if (fractalType === 'burningShip') return [-0.45, -0.55];
  return [-0.62, 0];
}

function defaultViewWidth(fractalType: FractalType): number {
  if (fractalType === 'julia') return 3.1;
  if (fractalType === 'burningShip') return 3.6;
  return DEFAULT_VIEW_WIDTH;
}

function readPoint(value: unknown): [number, number] | null {
  if (!Array.isArray(value) || value.length < 2) return null;
  const x = finiteNumber(value[0], NaN);
  const y = finiteNumber(value[1], NaN);
  return Number.isFinite(x) && Number.isFinite(y) ? [x, y] : null;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function lerp(left: number, right: number, amount: number): number {
  return left + (right - left) * amount;
}

const namedColors: Record<string, RgbaColor> = {
  black: { r: 0, g: 0, b: 0, a: 255 },
  white: { r: 255, g: 255, b: 255, a: 255 },
  transparent: { r: 0, g: 0, b: 0, a: 0 }
};

export const __test__ = {
  resolveFractalViewport,
  ensureResolvedViewport,
  makeViewport,
  resolvePixelSize,
  resolveIterationCount,
  scaleIterationOption,
  escapedResult,
  colorForSample,
  resolveColorStops,
  readColorStop,
  interpolateColor,
  parseColor,
  parseHexColor,
  parseRgbColor,
  readFractalType,
  defaultCenter,
  defaultViewWidth,
  readPoint,
  isPlainObject,
  finiteNumber,
  clamp,
  lerp
};
