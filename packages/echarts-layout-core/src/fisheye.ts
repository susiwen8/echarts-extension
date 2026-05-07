export type FisheyePoint = [number, number];

export interface FisheyeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FisheyeOptions {
  radius: number;
  scale: number;
  labelScale: number;
  stroke: unknown;
  strokeWidth: number;
  opacity: number;
  preview: boolean;
}

export interface FisheyeTransform {
  x: number;
  y: number;
  scale: number;
  influence: number;
}

export interface FisheyeController {
  apply(focus: FisheyePoint): void;
  reset(): void;
  dispose(): void;
}

export interface FisheyeGraphicElement {
  [key: string]: unknown;
  x?: number;
  y?: number;
  scaleX?: number;
  scaleY?: number;
  originX?: number;
  originY?: number;
  ignore?: boolean;
  invisible?: boolean;
  shape?: Record<string, unknown>;
  style?: Record<string, unknown>;
  parent?: FisheyeGraphicElement | null;
  attr?: (keyOrObj: unknown, value?: unknown) => void;
  setShape?: (shape: Record<string, unknown>) => void;
  setStyle?: (style: Record<string, unknown>) => void;
  dirty?: () => void;
  getPaintRect?: () => FisheyeRect | null;
  getBoundingRect?: () => FisheyeRect | null;
}

export interface FisheyeZRenderLike {
  on(eventName: string, handler: (event: FisheyeZRenderEvent) => void): void;
  off(eventName: string, handler: (event: FisheyeZRenderEvent) => void): void;
  refresh?: () => void;
  storage?: {
    getDisplayList?: (update?: boolean, includeIgnore?: boolean) => FisheyeGraphicElement[];
  };
}

export interface FisheyeZRenderEvent {
  offsetX?: number;
  offsetY?: number;
  zrX?: number;
  zrY?: number;
}

export interface FisheyeControllerOptions {
  zrender?: FisheyeZRenderLike | null;
  viewport: FisheyeRect;
  fisheye: FisheyeOptions | null;
  lens?: FisheyeGraphicElement | null;
  targetElements?: () => Array<FisheyeGraphicElement | null | undefined>;
  excludeElement?: (element: FisheyeGraphicElement) => boolean;
  onApply?: (focus: FisheyePoint, fisheye: FisheyeOptions) => void;
  onReset?: () => void;
}

interface FisheyeTargetBaseline {
  element: FisheyeGraphicElement;
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  originX: number | undefined;
  originY: number | undefined;
  localOriginX: number;
  localOriginY: number;
  center: FisheyePoint;
}

export function resolveFisheyeOptions(
  raw: unknown,
  viewport: FisheyeRect,
  defaults: Partial<FisheyeOptions> = {}
): FisheyeOptions | null {
  if (raw === false) return null;

  const option = raw == null || raw === true ? {} : asRecord(raw);
  if (option.show === false || option.enabled === false) return null;

  const shortSide = Math.min(viewport.width, viewport.height);
  const defaultRadius = Math.max(48, shortSide * 0.32);
  const radius = resolveFisheyeNumber(option.radius, finiteNumber(defaults.radius, defaultRadius), shortSide);
  const scale = Math.max(1, finiteNumber(option.scale ?? option.magnification, finiteNumber(defaults.scale, 2.2)));

  return {
    radius: Math.max(1, radius),
    scale,
    labelScale: Math.max(1, finiteNumber(option.labelScale, finiteNumber(defaults.labelScale, Math.min(scale, 1.55)))),
    stroke: option.stroke || option.borderColor || defaults.stroke || 'rgba(17, 24, 39, 0.86)',
    strokeWidth: Math.max(0, finiteNumber(option.strokeWidth ?? option.borderWidth, finiteNumber(defaults.strokeWidth, 3))),
    opacity: Math.max(0, Math.min(1, finiteNumber(option.opacity, finiteNumber(defaults.opacity, 0.92)))),
    preview: option.preview === true || defaults.preview === true
  };
}

export function installFisheyeController(options: FisheyeControllerOptions): FisheyeController | undefined {
  const { fisheye, zrender } = options;
  if (!fisheye || !zrender) return undefined;

  const baselines = new Map<FisheyeGraphicElement, FisheyeTargetBaseline>();
  let active = false;
  let disposed = false;

  const apply = (focus: FisheyePoint) => {
    if (disposed) return;
    active = true;
    updateFisheyeLens(options.lens, fisheye, focus, false);
    applyGenericFisheyeTargets(options, baselines, fisheye, focus);
    options.onApply?.(focus, fisheye);
    zrender.refresh?.();
  };

  const reset = () => {
    if (disposed || !active) return;
    active = false;
    updateFisheyeLens(options.lens, fisheye, null, true);
    resetGenericFisheyeTargets(baselines);
    options.onReset?.();
    zrender.refresh?.();
  };

  const handleMove = (event: FisheyeZRenderEvent) => {
    const point = eventPoint(event);
    if (!point || !pointInRect(point, options.viewport)) {
      reset();
      return;
    }
    apply(point);
  };
  const handleLeave = () => reset();

  zrender.on('mousemove', handleMove);
  zrender.on('globalout', handleLeave);
  zrender.on('mouseout', handleLeave);

  if (fisheye.preview) {
    apply([
      options.viewport.x + options.viewport.width / 2,
      options.viewport.y + options.viewport.height / 2
    ]);
  }

  return {
    apply,
    reset,
    dispose() {
      if (disposed) return;
      disposed = true;
      zrender.off('mousemove', handleMove);
      zrender.off('globalout', handleLeave);
      zrender.off('mouseout', handleLeave);
      if (active) {
        updateFisheyeLens(options.lens, fisheye, null, true);
        resetGenericFisheyeTargets(baselines);
        options.onReset?.();
        zrender.refresh?.();
      }
    }
  };
}

export function fisheyeTransform(point: FisheyePoint, fisheye: FisheyeOptions, focus: FisheyePoint): FisheyeTransform {
  const dx = point[0] - focus[0];
  const dy = point[1] - focus[1];
  const distance = Math.hypot(dx, dy);
  if (distance >= fisheye.radius) {
    return {
      x: point[0],
      y: point[1],
      scale: 1,
      influence: 0
    };
  }

  const ratio = 1 - distance / fisheye.radius;
  const influence = ratio * ratio * (3 - 2 * ratio);
  const scale = 1 + (fisheye.scale - 1) * influence;
  const distanceScale = 1 + (fisheye.scale - 1) * influence * 0.35;
  return {
    x: focus[0] + dx * distanceScale,
    y: focus[1] + dy * distanceScale,
    scale,
    influence
  };
}

export function setFisheyeGraphicShape(element: FisheyeGraphicElement, shape: Record<string, unknown>): void {
  const next = {
    ...asRecord(element.shape),
    ...shape
  };
  if (typeof element.setShape === 'function') {
    element.setShape(next);
  } else if (typeof element.attr === 'function') {
    element.attr('shape', next);
  } else {
    element.shape = next;
  }
}

export function setFisheyeGraphicStyle(element: FisheyeGraphicElement, style: Record<string, unknown>): void {
  const next = {
    ...asRecord(element.style),
    ...style
  };
  if (typeof element.setStyle === 'function') {
    element.setStyle(next);
  } else if (typeof element.attr === 'function') {
    element.attr('style', next);
  } else {
    element.style = next;
  }
}

export function setFisheyeGraphicIgnore(element: FisheyeGraphicElement, ignore: boolean): void {
  if (typeof element.attr === 'function') {
    element.attr('ignore', ignore);
  } else {
    element.ignore = ignore;
  }
}

function applyGenericFisheyeTargets(
  options: FisheyeControllerOptions,
  baselines: Map<FisheyeGraphicElement, FisheyeTargetBaseline>,
  fisheye: FisheyeOptions,
  focus: FisheyePoint
): void {
  const elements = resolveTargetElements(options);
  elements.forEach((element) => {
    if (!element || shouldSkipElement(element, options)) return;
    const baseline = resolveTargetBaseline(element, baselines);
    if (!baseline) return;

    const transform = fisheyeTransform(baseline.center, fisheye, focus);
    setFisheyeElementTransform(element, {
      x: baseline.x + transform.x - baseline.center[0],
      y: baseline.y + transform.y - baseline.center[1],
      scaleX: baseline.scaleX * transform.scale,
      scaleY: baseline.scaleY * transform.scale,
      originX: baseline.localOriginX,
      originY: baseline.localOriginY
    });
  });
}

function resetGenericFisheyeTargets(baselines: Map<FisheyeGraphicElement, FisheyeTargetBaseline>): void {
  baselines.forEach((baseline) => {
    setFisheyeElementTransform(baseline.element, {
      x: baseline.x,
      y: baseline.y,
      scaleX: baseline.scaleX,
      scaleY: baseline.scaleY,
      originX: baseline.originX,
      originY: baseline.originY
    });
  });
}

function resolveTargetBaseline(
  element: FisheyeGraphicElement,
  baselines: Map<FisheyeGraphicElement, FisheyeTargetBaseline>
): FisheyeTargetBaseline | null {
  const cached = baselines.get(element);
  if (cached) return cached;

  const rect = readElementRect(element);
  if (!rect) return null;
  const center: FisheyePoint = [
    rect.x + rect.width / 2,
    rect.y + rect.height / 2
  ];
  const x = finiteNumber(element.x, 0);
  const y = finiteNumber(element.y, 0);
  const baseline = {
    element,
    x,
    y,
    scaleX: finiteNumber(element.scaleX, 1),
    scaleY: finiteNumber(element.scaleY, 1),
    originX: typeof element.originX === 'number' && Number.isFinite(element.originX) ? element.originX : undefined,
    originY: typeof element.originY === 'number' && Number.isFinite(element.originY) ? element.originY : undefined,
    localOriginX: center[0] - x,
    localOriginY: center[1] - y,
    center
  };
  baselines.set(element, baseline);
  return baseline;
}

function resolveTargetElements(options: FisheyeControllerOptions): Array<FisheyeGraphicElement | null | undefined> {
  if (options.targetElements) return options.targetElements();
  return options.zrender?.storage?.getDisplayList?.(false, false) || [];
}

function shouldSkipElement(element: FisheyeGraphicElement, options: FisheyeControllerOptions): boolean {
  if (element === options.lens || element.ignore || element.invisible) return true;
  let current: FisheyeGraphicElement | null | undefined = element;
  while (current) {
    if (options.excludeElement?.(current)) return true;
    current = current.parent;
  }
  return false;
}

function updateFisheyeLens(
  lens: FisheyeGraphicElement | null | undefined,
  fisheye: FisheyeOptions,
  focus: FisheyePoint | null,
  ignore: boolean
): void {
  if (!lens) return;
  if (focus) {
    setFisheyeGraphicShape(lens, {
      cx: focus[0],
      cy: focus[1],
      r: fisheye.radius
    });
    setFisheyeGraphicStyle(lens, {
      fill: null,
      stroke: fisheye.stroke,
      lineWidth: fisheye.strokeWidth,
      opacity: fisheye.opacity
    });
  }
  setFisheyeGraphicIgnore(lens, ignore);
}

function setFisheyeElementTransform(
  element: FisheyeGraphicElement,
  transform: {
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
    originX: number | undefined;
    originY: number | undefined;
  }
): void {
  const patch: Record<string, unknown> = {
    x: transform.x,
    y: transform.y,
    scaleX: transform.scaleX,
    scaleY: transform.scaleY
  };
  if (transform.originX == null) {
    delete element.originX;
  } else {
    patch.originX = transform.originX;
  }
  if (transform.originY == null) {
    delete element.originY;
  } else {
    patch.originY = transform.originY;
  }

  if (typeof element.attr === 'function') {
    element.attr(patch);
  } else {
    Object.assign(element, patch);
  }
  element.dirty?.();
}

function readElementRect(element: FisheyeGraphicElement): FisheyeRect | null {
  const rect = element.getPaintRect?.() || element.getBoundingRect?.() || null;
  if (!rect) return null;
  const x = finiteNumber(rect.x, NaN);
  const y = finiteNumber(rect.y, NaN);
  const width = finiteNumber(rect.width, NaN);
  const height = finiteNumber(rect.height, NaN);
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(width) || !Number.isFinite(height)) return null;
  if (width <= 0 && height <= 0) return null;
  return { x, y, width, height };
}

function eventPoint(event: FisheyeZRenderEvent): FisheyePoint | null {
  const x = finiteNumber(event.offsetX, finiteNumber(event.zrX, NaN));
  const y = finiteNumber(event.offsetY, finiteNumber(event.zrY, NaN));
  return Number.isFinite(x) && Number.isFinite(y) ? [x, y] : null;
}

function pointInRect(point: FisheyePoint, rect: FisheyeRect): boolean {
  return point[0] >= rect.x
    && point[0] <= rect.x + rect.width
    && point[1] >= rect.y
    && point[1] <= rect.y + rect.height;
}

function resolveFisheyeNumber(value: unknown, fallback: number, percentBase: number): number {
  if (typeof value === 'string' && value.endsWith('%')) {
    const ratio = Number(value.slice(0, -1));
    return Number.isFinite(ratio) ? percentBase * ratio / 100 : fallback;
  }
  return finiteNumber(value, fallback);
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
