const DEFAULT_WIDTH = 760;
const DEFAULT_HEIGHT = 460;
const DEFAULT_PADDING = 42;
const DEFAULT_EFFECT_WIDTH = 138;
const DEFAULT_EFFECT_HEIGHT = 58;
const DEFAULT_EFFECT_GAP = 0;
const DEFAULT_CATEGORY_GAP = 118;
const DEFAULT_CATEGORY_LENGTH = 170;
const DEFAULT_CATEGORY_ANGLE = 48;
const DEFAULT_CAUSE_GAP = 28;
const DEFAULT_CAUSE_LENGTH = 76;
const DEFAULT_SPINE_ARROW_SIZE = 0;

export type CauseEffectSide = 'top' | 'bottom';
export type CauseEffectPaddingOption = number | Partial<CauseEffectPadding>;

export interface CauseEffectPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface CauseEffectPoint {
  x: number;
  y: number;
}

export interface CauseEffectInputItem {
  id?: string | number;
  name?: string;
  label?: string;
  text?: string;
  value?: unknown;
  category?: string | number;
  causes?: unknown[];
  items?: unknown[];
  children?: unknown[];
  itemStyle?: Record<string, unknown>;
  lineStyle?: Record<string, unknown>;
  labelStyle?: Record<string, unknown>;
  [key: string]: unknown;
}

export type CauseEffectCategoryRow = [category: string | number, ...causes: unknown[]];

export interface CauseEffectInput {
  effect?: unknown;
  problem?: unknown;
  outcome?: unknown;
  categories?: unknown[];
  causes?: unknown[];
  data?: unknown[];
}

export interface CauseEffectLayoutOptions {
  width?: number;
  height?: number;
  padding?: CauseEffectPaddingOption;
  effectWidth?: number;
  effectHeight?: number;
  effectGap?: number;
  categoryGap?: number;
  categoryLength?: number;
  categoryAngle?: number;
  causeGap?: number;
  causeLength?: number;
  maxCauseDepth?: number;
  spineArrowSize?: number;
  [key: string]: unknown;
}

export interface CauseEffectLayoutOption extends CauseEffectInput, CauseEffectLayoutOptions {
  layout?: unknown;
  layoutOptions?: unknown;
}

export interface CauseEffectSourceItem {
  id: string;
  name: string;
  kind: 'effect' | 'category' | 'cause';
  categoryId?: string;
  parentId?: string;
  depth: number;
  raw: unknown;
}

export interface CauseEffectCauseLayout {
  id: string;
  name: string;
  side: CauseEffectSide;
  depth: number;
  dataIndex: number;
  raw: unknown;
  x: number;
  y: number;
  line: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
  label: CauseEffectPoint & {
    align: 'left' | 'right';
    verticalAlign: 'top' | 'bottom' | 'middle';
  };
  children: CauseEffectCauseLayout[];
}

export interface CauseEffectCategoryLayout {
  id: string;
  name: string;
  side: CauseEffectSide;
  dataIndex: number;
  raw: unknown;
  anchor: CauseEffectPoint;
  end: CauseEffectPoint;
  label: CauseEffectPoint & {
    align: 'center';
    verticalAlign: 'top' | 'bottom';
  };
  causes: CauseEffectCauseLayout[];
}

export interface CauseEffectLayoutResult {
  width: number;
  height: number;
  padding: CauseEffectPadding;
  spine: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
  arrow: CauseEffectPoint[];
  effect: {
    id: string;
    name: string;
    dataIndex: number;
    raw: unknown;
    x: number;
    y: number;
    width: number;
    height: number;
    label: CauseEffectPoint;
  };
  categories: CauseEffectCategoryLayout[];
  source: CauseEffectSourceItem[];
}

interface NormalizedEffect {
  id: string;
  name: string;
  raw: unknown;
}

interface NormalizedCategory {
  id: string;
  name: string;
  dataIndex: number;
  raw: unknown;
  causes: NormalizedCause[];
}

interface NormalizedCause {
  id: string;
  name: string;
  depth: number;
  dataIndex: number;
  raw: unknown;
  children: NormalizedCause[];
}

interface NormalizedDiagram {
  effect: NormalizedEffect;
  categories: NormalizedCategory[];
  source: CauseEffectSourceItem[];
}

interface ResolvedOptions {
  width: number;
  height: number;
  padding: CauseEffectPadding;
  effectWidth: number;
  effectHeight: number;
  effectGap: number;
  categoryGap: number;
  categoryLength: number;
  categoryAngle: number;
  causeGap: number;
  causeLength: number;
  maxCauseDepth: number;
  spineArrowSize: number;
}

export function resolveCauseEffectLayout(option: CauseEffectLayoutOption = {}): CauseEffectLayoutResult {
  const layout = isPlainObject(option.layout) ? option.layout : {};
  const layoutOptions = isPlainObject(option.layoutOptions) ? option.layoutOptions : {};
  const merged: CauseEffectLayoutOptions = {
    ...layout,
    ...layoutOptions,
    width: finiteNumber(option.width, finiteNumber(layoutOptions.width, finiteNumber(layout.width, DEFAULT_WIDTH))),
    height: finiteNumber(option.height, finiteNumber(layoutOptions.height, finiteNumber(layout.height, DEFAULT_HEIGHT))),
    padding: readPaddingOption(option.padding ?? layoutOptions.padding ?? layout.padding),
    effectWidth: finiteNumber(option.effectWidth, finiteNumber(layoutOptions.effectWidth, finiteNumber(layout.effectWidth, DEFAULT_EFFECT_WIDTH))),
    effectHeight: finiteNumber(option.effectHeight, finiteNumber(layoutOptions.effectHeight, finiteNumber(layout.effectHeight, DEFAULT_EFFECT_HEIGHT))),
    effectGap: finiteNumber(option.effectGap, finiteNumber(layoutOptions.effectGap, finiteNumber(layout.effectGap, DEFAULT_EFFECT_GAP))),
    categoryGap: finiteNumber(option.categoryGap, finiteNumber(layoutOptions.categoryGap, finiteNumber(layout.categoryGap, DEFAULT_CATEGORY_GAP))),
    categoryLength: finiteNumber(option.categoryLength, finiteNumber(layoutOptions.categoryLength, finiteNumber(layout.categoryLength, DEFAULT_CATEGORY_LENGTH))),
    categoryAngle: finiteNumber(option.categoryAngle, finiteNumber(layoutOptions.categoryAngle, finiteNumber(layout.categoryAngle, DEFAULT_CATEGORY_ANGLE))),
    causeGap: finiteNumber(option.causeGap, finiteNumber(layoutOptions.causeGap, finiteNumber(layout.causeGap, DEFAULT_CAUSE_GAP))),
    causeLength: finiteNumber(option.causeLength, finiteNumber(layoutOptions.causeLength, finiteNumber(layout.causeLength, DEFAULT_CAUSE_LENGTH))),
    maxCauseDepth: finiteNumber(option.maxCauseDepth, finiteNumber(layoutOptions.maxCauseDepth, finiteNumber(layout.maxCauseDepth, Infinity))),
    spineArrowSize: finiteNumber(option.spineArrowSize, finiteNumber(layoutOptions.spineArrowSize, finiteNumber(layout.spineArrowSize, DEFAULT_SPINE_ARROW_SIZE)))
  };

  return layoutCauseEffect(option, merged);
}

export function layoutCauseEffect(
  input: CauseEffectInput = {},
  options: CauseEffectLayoutOptions = {}
): CauseEffectLayoutResult {
  const resolved = resolveOptions(options);
  const diagram = normalizeDiagram(input, resolved.maxCauseDepth);
  const width = resolved.width;
  const height = resolved.height;
  const padding = resolved.padding;
  const effectWidth = Math.min(resolved.effectWidth, Math.max(1, width - padding.left - padding.right));
  const effectHeight = Math.min(resolved.effectHeight, Math.max(1, height - padding.top - padding.bottom));
  const spineY = clamp(height / 2, padding.top + 10, height - padding.bottom - 10);
  const effectX = Math.max(padding.left, width - padding.right - effectWidth);
  const effectY = clamp(spineY - effectHeight / 2, padding.top, height - padding.bottom - effectHeight);
  const spineX1 = padding.left;
  const spineX2 = Math.max(spineX1 + 1, effectX - Math.max(0, resolved.effectGap));
  const categorySlots = createCategorySlots(diagram.categories.length, spineX1, spineX2, resolved.categoryGap);
  const topAvailable = Math.max(24, spineY - padding.top);
  const bottomAvailable = Math.max(24, height - padding.bottom - spineY);
  const categoryLength = Math.min(
    Math.max(24, resolved.categoryLength),
    Math.max(24, Math.min(topAvailable, bottomAvailable) + 24)
  );
  const horizontalShift = Math.cos(degreesToRadians(clamp(resolved.categoryAngle, 18, 78))) * categoryLength;
  const verticalShift = Math.sin(degreesToRadians(clamp(resolved.categoryAngle, 18, 78))) * categoryLength;

  const categories = diagram.categories.map((category, index): CauseEffectCategoryLayout => {
    const side: CauseEffectSide = index % 2 === 0 ? 'top' : 'bottom';
    const direction = side === 'top' ? -1 : 1;
    const anchor = { x: categorySlots[index] ?? spineX1, y: spineY };
    const end = {
      x: clamp(anchor.x - horizontalShift, padding.left + 12, spineX2 - 12),
      y: clamp(anchor.y + direction * verticalShift, padding.top + 12, height - padding.bottom - 12)
    };
    const causes = layoutCauses(category.causes, {
      side,
      direction,
      anchor,
      end,
      padding,
      causeGap: Math.max(10, resolved.causeGap),
      causeLength: Math.max(18, resolved.causeLength),
      spineY
    });

    return {
      id: category.id,
      name: category.name,
      side,
      dataIndex: category.dataIndex,
      raw: category.raw,
      anchor,
      end,
      label: {
        x: end.x,
        y: end.y + direction * 10,
        align: 'center',
        verticalAlign: side === 'top' ? 'bottom' : 'top'
      },
      causes
    };
  });

  const arrowSize = Math.max(0, resolved.spineArrowSize);

  return {
    width,
    height,
    padding,
    spine: {
      x1: spineX1,
      y1: spineY,
      x2: spineX2,
      y2: spineY
    },
    arrow: [
      { x: spineX2, y: spineY },
      { x: spineX2 - arrowSize, y: spineY - arrowSize * 0.48 },
      { x: spineX2 - arrowSize, y: spineY + arrowSize * 0.48 }
    ],
    effect: {
      id: diagram.effect.id,
      name: diagram.effect.name,
      dataIndex: 0,
      raw: diagram.effect.raw,
      x: effectX,
      y: effectY,
      width: effectWidth,
      height: effectHeight,
      label: {
        x: effectX + effectWidth / 2,
        y: effectY + effectHeight / 2
      }
    },
    categories,
    source: diagram.source
  };
}

export function collectCauseEffectData(input: CauseEffectInput = {}): CauseEffectSourceItem[] {
  return normalizeDiagram(input, Infinity).source;
}

function resolveOptions(options: CauseEffectLayoutOptions): ResolvedOptions {
  return {
    width: Math.max(1, finiteNumber(options.width, DEFAULT_WIDTH)),
    height: Math.max(1, finiteNumber(options.height, DEFAULT_HEIGHT)),
    padding: normalizePadding(options.padding),
    effectWidth: Math.max(1, finiteNumber(options.effectWidth, DEFAULT_EFFECT_WIDTH)),
    effectHeight: Math.max(1, finiteNumber(options.effectHeight, DEFAULT_EFFECT_HEIGHT)),
    effectGap: Math.max(0, finiteNumber(options.effectGap, DEFAULT_EFFECT_GAP)),
    categoryGap: Math.max(0, finiteNumber(options.categoryGap, DEFAULT_CATEGORY_GAP)),
    categoryLength: Math.max(1, finiteNumber(options.categoryLength, DEFAULT_CATEGORY_LENGTH)),
    categoryAngle: finiteNumber(options.categoryAngle, DEFAULT_CATEGORY_ANGLE),
    causeGap: Math.max(1, finiteNumber(options.causeGap, DEFAULT_CAUSE_GAP)),
    causeLength: Math.max(1, finiteNumber(options.causeLength, DEFAULT_CAUSE_LENGTH)),
    maxCauseDepth: Math.max(0, finiteNumber(options.maxCauseDepth, Infinity)),
    spineArrowSize: Math.max(0, finiteNumber(options.spineArrowSize, DEFAULT_SPINE_ARROW_SIZE))
  };
}

function normalizeDiagram(input: CauseEffectInput, maxCauseDepth: number): NormalizedDiagram {
  const source: CauseEffectSourceItem[] = [];
  const effectRaw = input.effect ?? input.problem ?? input.outcome ?? 'Effect';
  const effectName = readName(effectRaw, 'Effect');
  const effect = {
    id: readId(effectRaw, 'effect'),
    name: effectName,
    raw: effectRaw
  };

  source.push({
    id: effect.id,
    name: effect.name,
    kind: 'effect',
    depth: 0,
    raw: effect.raw
  });

  const rawCategories = readCategories(input);
  const categories = rawCategories.map((rawCategory, categoryIndex): NormalizedCategory => {
    const categoryName = readCategoryName(rawCategory, `Category ${categoryIndex + 1}`);
    const categoryId = readId(rawCategory, slugName(categoryName, `category-${categoryIndex}`));
    const dataIndex = source.length;
    source.push({
      id: categoryId,
      name: categoryName,
      kind: 'category',
      depth: 0,
      raw: rawCategory
    });
    const causes = readCauseItems(rawCategory).flatMap((rawCause, causeIndex) => normalizeCause(
      rawCause,
      categoryId,
      undefined,
      0,
      causeIndex,
      maxCauseDepth,
      source
    ));

    return {
      id: categoryId,
      name: categoryName,
      dataIndex,
      raw: rawCategory,
      causes
    };
  });

  return { effect, categories, source };
}

function normalizeCause(
  rawCause: unknown,
  categoryId: string,
  parentId: string | undefined,
  depth: number,
  causeIndex: number,
  maxCauseDepth: number,
  source: CauseEffectSourceItem[]
): NormalizedCause[] {
  if (rawCause == null) return [];
  if (Array.isArray(rawCause)) {
    const [name, ...children] = rawCause;
    return normalizeCause({
      id: name,
      name: stringifyName(name ?? `Cause ${causeIndex + 1}`),
      children
    }, categoryId, parentId, depth, causeIndex, maxCauseDepth, source);
  }

  const name = readName(rawCause, `Cause ${causeIndex + 1}`);
  const id = readId(rawCause, `${categoryId}-cause-${source.length}`);
  const dataIndex = source.length;
  source.push({
    id,
    name,
    kind: 'cause',
    categoryId,
    parentId,
    depth,
    raw: rawCause
  });
  const children = depth >= maxCauseDepth
    ? []
    : readCauseItems(rawCause).flatMap((child, childIndex) => normalizeCause(
      child,
      categoryId,
      id,
      depth + 1,
      childIndex,
      maxCauseDepth,
      source
    ));

  return [{
    id,
    name,
    depth,
    dataIndex,
    raw: rawCause,
    children
  }];
}

function layoutCauses(
  causes: NormalizedCause[],
  context: {
    side: CauseEffectSide;
    direction: 1 | -1;
    anchor: CauseEffectPoint;
    end: CauseEffectPoint;
    padding: CauseEffectPadding;
    causeGap: number;
    causeLength: number;
    spineY: number;
  }
): CauseEffectCauseLayout[] {
  if (!causes.length) return [];
  const usable = Math.max(1, distance(context.anchor, context.end) - 28);

  return causes.map((cause, index) => {
    const t = causes.length === 1 ? 0.5 : clamp((index + 1) / (causes.length + 1), 0.16, 0.86);
    const base = interpolate(context.end, context.anchor, t);
    return layoutCause(cause, {
      ...context,
      base,
      index
    });
  });
}

function layoutCause(
  cause: NormalizedCause,
  context: {
    side: CauseEffectSide;
    direction: 1 | -1;
    anchor: CauseEffectPoint;
    end: CauseEffectPoint;
    base: CauseEffectPoint;
    padding: CauseEffectPadding;
    causeGap: number;
    causeLength: number;
    spineY: number;
    index: number;
  }
): CauseEffectCauseLayout {
  const length = context.causeLength * Math.max(0.46, 1 - cause.depth * 0.22);
  const x = clamp(context.base.x - length, context.padding.left, Number.POSITIVE_INFINITY);
  const y = context.base.y;
  const childLayouts = layoutChildCauses(cause.children, {
    ...context,
    parentStart: context.base,
    parentEnd: { x, y }
  });

  return {
    id: cause.id,
    name: cause.name,
    side: context.side,
    depth: cause.depth,
    dataIndex: cause.dataIndex,
    raw: cause.raw,
    x,
    y,
    line: {
      x1: context.base.x,
      y1: context.base.y,
      x2: x,
      y2: y
    },
    label: {
      x: x - 6,
      y,
      align: 'right',
      verticalAlign: 'middle'
    },
    children: childLayouts
  };
}

function layoutChildCauses(
  causes: NormalizedCause[],
  context: {
    side: CauseEffectSide;
    direction: 1 | -1;
    anchor: CauseEffectPoint;
    end: CauseEffectPoint;
    parentStart: CauseEffectPoint;
    parentEnd: CauseEffectPoint;
    padding: CauseEffectPadding;
    causeGap: number;
    causeLength: number;
    spineY: number;
  }
): CauseEffectCauseLayout[] {
  if (!causes.length) return [];
  const branchLength = Math.max(1, distance(context.end, context.anchor));
  const branchUnit = {
    x: (context.anchor.x - context.end.x) / branchLength,
    y: (context.anchor.y - context.end.y) / branchLength
  };

  return causes.map((cause, index) => {
    const base = {
      x: Math.max(context.padding.left, context.parentStart.x + branchUnit.x * (index + 1) * context.causeGap * 0.82),
      y: context.parentStart.y + branchUnit.y * (index + 1) * context.causeGap * 0.82
    };
    return layoutCause(cause, {
      ...context,
      base,
      index,
      causeLength: context.causeLength * 0.7
    });
  });
}

function createCategorySlots(count: number, spineX1: number, spineX2: number, categoryGap: number): number[] {
  if (count <= 0) return [];
  const available = Math.max(1, spineX2 - spineX1);
  const requested = categoryGap * count;
  const first = spineX1 + Math.min(categoryGap, available / (count + 1));
  const step = requested <= available ? categoryGap : available / (count + 1);
  return Array.from({ length: count }, (_item, index) => Math.min(spineX2 - 8, first + index * step));
}

function readCategories(input: CauseEffectInput): unknown[] {
  const categories = input.categories ?? input.causes ?? input.data;
  return Array.isArray(categories) ? categories : [];
}

function readCauseItems(raw: unknown): unknown[] {
  if (Array.isArray(raw)) {
    return raw.slice(1);
  }
  if (!isPlainObject(raw)) return [];
  const maybeCauses = raw.causes ?? raw.items ?? raw.children;
  return Array.isArray(maybeCauses) ? maybeCauses : [];
}

function readCategoryName(raw: unknown, fallback: string): string {
  if (Array.isArray(raw)) return stringifyName(raw[0] ?? fallback);
  if (!isPlainObject(raw)) return stringifyName(raw ?? fallback);
  return stringifyName(raw.name ?? raw.category ?? raw.label ?? raw.text ?? raw.id ?? fallback);
}

function readName(raw: unknown, fallback: string): string {
  if (Array.isArray(raw)) return stringifyName(raw[0] ?? fallback);
  if (!isPlainObject(raw)) return stringifyName(raw ?? fallback);
  return stringifyName(raw.name ?? raw.label ?? raw.text ?? raw.value ?? raw.id ?? fallback);
}

function readId(raw: unknown, fallback: string): string {
  if (isPlainObject(raw)) {
    const id = raw.id ?? raw.key;
    if (id != null) return stringifyName(id);
  }
  return slugName(readName(raw, fallback), fallback);
}

function slugName(value: unknown, fallback: string): string {
  const slug = stringifyName(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || fallback;
}

function stringifyName(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') return String(value);
  return '';
}

function readPaddingOption(value: unknown): CauseEffectPaddingOption | undefined {
  return typeof value === 'number' || isPlainObject(value) ? value as CauseEffectPaddingOption : undefined;
}

function normalizePadding(value: unknown): CauseEffectPadding {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const padding = Math.max(0, value);
    return { top: padding, right: padding, bottom: padding, left: padding };
  }
  if (!isPlainObject(value)) {
    return {
      top: DEFAULT_PADDING,
      right: DEFAULT_PADDING,
      bottom: DEFAULT_PADDING,
      left: DEFAULT_PADDING
    };
  }

  return {
    top: Math.max(0, finiteNumber(value.top, DEFAULT_PADDING)),
    right: Math.max(0, finiteNumber(value.right, DEFAULT_PADDING)),
    bottom: Math.max(0, finiteNumber(value.bottom, DEFAULT_PADDING)),
    left: Math.max(0, finiteNumber(value.left, DEFAULT_PADDING))
  };
}

function finiteNumber(value: unknown, fallback: number): number {
  const number = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  return typeof number === 'number' && Number.isFinite(number) ? number : fallback;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function degreesToRadians(value: number): number {
  return value / 180 * Math.PI;
}

function distance(a: CauseEffectPoint, b: CauseEffectPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function interpolate(a: CauseEffectPoint, b: CauseEffectPoint, t: number): CauseEffectPoint {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export const __test__ = {
  normalizeDiagram,
  normalizePadding,
  createCategorySlots,
  readCauseItems,
  readCategoryName
};
