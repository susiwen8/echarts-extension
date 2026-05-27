import {
  computeMetaballBridgeStrength,
  createMetaballBridgePath,
  createFusionEnvelopePath,
  createSplitEnvelopePath,
  createWaterdropFusionShape,
  createWaterdropSurfacePath,
  createWaterdropSurfaceShape
} from './metaball.js';
import type { WaterdropSurfaceShape } from './metaball.js';
import { resolveFluidSimulationOptions } from './fluid-state.js';
import { resolveFluidRuntimeFrame } from './fluid-solver.js';
import { fluidFrameToBridges, fluidFrameToEntities } from './fluid-render-model.js';

const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 480;
const DEFAULT_COLORS = ['#38bdf8', '#34d399', '#a78bfa', '#f59e0b', '#fb7185', '#22c55e', '#60a5fa'];
const DEFAULT_MIN_RADIUS = 4;
const DEFAULT_MAX_RADIUS = 12;
const DEFAULT_OPACITY = 0.82;

export type EvolutionFluidEventType =
  | 'found'
  | 'acquire'
  | 'merge'
  | 'split'
  | 'spinOff'
  | 'rename'
  | 'close'
  | string;

export interface EvolutionFluidEntityInput {
  id?: string | number;
  name?: string | number;
  value?: unknown;
  industry?: string | number;
  category?: string | number;
  itemStyle?: Record<string, unknown>;
  label?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface EvolutionFluidEventInput {
  id?: string | number;
  time?: string | number | Date;
  type?: EvolutionFluidEventType;
  sources?: Array<string | number>;
  targets?: Array<string | number>;
  value?: unknown;
  eventStyle?: Record<string, unknown>;
  label?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface EvolutionFluidLayoutOption {
  width?: number;
  height?: number;
  entities?: unknown[];
  events?: unknown[];
  data?: unknown[];
  timeField?: string;
  entityIdField?: string;
  valueField?: string;
  categoryField?: string;
  currentTime?: string | number | Date | null;
  layout?: unknown;
  layoutOptions?: unknown;
  dropletStyle?: unknown;
  fluidSimulation?: unknown;
  timeline?: unknown;
  [key: string]: unknown;
}

export interface EvolutionFluidEntityLayout {
  id: string;
  name: string;
  category: string;
  value: number;
  x: number;
  y: number;
  r: number;
  opacity: number;
  color: string;
  active: boolean;
  z2?: number;
  dataIndex: number;
  raw: unknown;
}

export interface EvolutionFluidEventLayout {
  id: string;
  type: string;
  time: string;
  order: number;
  sourceIds: string[];
  targetIds: string[];
  value: number;
  x: number;
  y: number;
  r: number;
  raw: unknown;
}

export interface EvolutionFluidBridgeLayout {
  id: string;
  kind: 'absorb' | 'split' | 'surface';
  sourceId: string;
  targetId: string;
  sourceIds: string[];
  targetIds: string[];
  path: string;
  width: number;
  opacity: number;
  color: string;
  surfaceShape?: WaterdropSurfaceShape;
}

export interface EvolutionFluidTimelineTick {
  time: string;
  x: number;
  active: boolean;
}

export interface EvolutionFluidLayoutResult {
  width: number;
  height: number;
  progress: number;
  entities: EvolutionFluidEntityLayout[];
  events: EvolutionFluidEventLayout[];
  bridges: EvolutionFluidBridgeLayout[];
  timeline: {
    show: boolean;
    y: number;
    startX: number;
    endX: number;
    ticks: EvolutionFluidTimelineTick[];
    handleX: number;
  };
}

interface NormalizedEntity {
  id: string;
  name: string;
  category: string;
  value: number;
  color: string;
  dataIndex: number;
  raw: unknown;
}

export interface EvolutionFluidNormalizedEvent {
  id: string;
  type: string;
  time: string;
  timeValue: number;
  order: number;
  sourceIds: string[];
  targetIds: string[];
  value: number;
  raw: unknown;
}

interface EventPhase {
  kind: 'approach' | 'fusion' | 'complete';
  progress: number;
  fusionProgress: number;
}

type MutableEntityLayout = EvolutionFluidEntityLayout & {
  hidden?: boolean;
};

interface SurfaceShape {
  x: number;
  y: number;
  r: number;
}

type SurfaceSegment =
  | {
      type: 'move';
      dropIndex: number;
      startTime: number;
      duration: number;
      endTime: number;
      x0: number;
      y0: number;
      x1: number;
      y1: number;
      cx: number;
      cy: number;
      r: number;
    }
  | {
      type: 'merge';
      dropIndex: number;
      startTime: number;
      duration: number;
      endTime: number;
      x0: number;
      y0: number;
      r0: number;
      r1: number;
      x1: number;
      y1: number;
      dropRadius: number;
    };

interface SurfaceDropState extends SurfaceShape {
  id: string;
  currentX: number;
  currentY: number;
  currentRadius: number;
  absorbed: boolean;
}

const SURFACE_REFERENCE_WIDTH = 420;
const SURFACE_REFERENCE_HEIGHT = 300;
const SURFACE_BRIDGE_LENGTH = 38;
const SURFACE_ACTIVE_START: SurfaceShape = { x: 34, y: 260, r: 13 };
const SURFACE_TARGET_SHAPES: SurfaceShape[] = [
  { x: 74, y: 58, r: 12 },
  { x: 143, y: 43, r: 10 },
  { x: 224, y: 66, r: 14 },
  { x: 318, y: 48, r: 12 },
  { x: 372, y: 98, r: 11 },
  { x: 52, y: 127, r: 13 },
  { x: 125, y: 139, r: 16 },
  { x: 195, y: 116, r: 11 },
  { x: 271, y: 144, r: 15 },
  { x: 350, y: 171, r: 13 },
  { x: 81, y: 229, r: 15 },
  { x: 153, y: 242, r: 12 },
  { x: 228, y: 219, r: 16 },
  { x: 306, y: 236, r: 11 },
  { x: 372, y: 248, r: 14 }
];

export function resolveEvolutionFluidLayout(option: EvolutionFluidLayoutOption = {}): EvolutionFluidLayoutResult {
  const width = Math.max(1, finiteNumber(option.width, DEFAULT_WIDTH));
  const height = Math.max(1, finiteNumber(option.height, DEFAULT_HEIGHT));
  if (isSurfaceMode(option)) return resolveSurfaceLayout(option, width, height);
  const rawEntities = normalizeEntities(option);
  const events = normalizeEvents(option);
  const currentTimeValue = resolveCurrentTimeValue(option.currentTime, events);
  const visibleEvents = filterVisibleEvents(events, currentTimeValue);
  const materializedEvents = materializedLayoutEvents(events, currentTimeValue);
  const entities = ensureReferencedEntities(rawEntities, materializedEvents);
  const radiusScale = createRadiusScale(entities.map((entity) => entity.value), option);
  const positions = layoutCategories(entities, width, height, option);
  const dropletStyle = isRecord(option.dropletStyle) ? option.dropletStyle : {};
  const opacity = clamp(nonNegativeNumber(dropletStyle.opacity, DEFAULT_OPACITY), 0, 1);
  const fluidSimulation = resolveFluidSimulationOptions(option.fluidSimulation);
  const baseEntities = entities.map((entity) => {
    const position = positions.get(entity.id) || { x: width / 2, y: height / 2 };
    return {
      id: entity.id,
      name: entity.name,
      category: entity.category,
      value: entity.value,
      x: position.x,
      y: position.y,
      r: radiusScale(entity.value),
      opacity,
      color: entity.color,
      active: true,
      dataIndex: entity.dataIndex,
      raw: entity.raw
    };
  });
  const stagedEntities = applyEventStages(baseEntities.map((entity) => ({ ...entity })), events, currentTimeValue);
  const publicEntities = stagedEntities.filter((entity) => !entity.hidden && entity.r > 0.05 && entity.opacity > 0.005);
  const progress = resolveProgress(option.currentTime, events);

  if (fluidSimulation.enabled) {
    const frame = resolveFluidRuntimeFrame(baseEntities, events, currentTimeValue, fluidSimulation);
    const fluidEntities = fluidFrameToEntities(baseEntities, frame);
    return {
      width,
      height,
      progress,
      entities: fluidEntities,
      events: visibleEvents.map((event) => toPublicEvent(event, fluidEntities)),
      bridges: fluidFrameToBridges(frame),
      timeline: createTimeline(width, height, option, events, progress)
    };
  }

  return {
    width,
    height,
    progress,
    entities: publicEntities,
    events: visibleEvents.map((event) => toPublicEvent(event, publicEntities)),
    bridges: createEventBridges(events, publicEntities, option, currentTimeValue),
    timeline: createTimeline(width, height, option, events, progress)
  };
}

function isSurfaceMode(option: EvolutionFluidLayoutOption): boolean {
  const layout = isRecord(option.layout) ? option.layout : {};
  const surface = isRecord(option.surface) ? option.surface : {};
  const dropletStyle = isRecord(option.dropletStyle) ? option.dropletStyle : {};
  return surface.enabled === true
    || readString(option.mode) === 'surface'
    || readString(layout.mode) === 'surface'
    || readString(dropletStyle.mode) === 'surface';
}

function resolveSurfaceLayout(
  option: EvolutionFluidLayoutOption,
  width: number,
  height: number
): EvolutionFluidLayoutResult {
  const surface = isRecord(option.surface) ? option.surface : {};
  const dropletStyle = isRecord(option.dropletStyle) ? option.dropletStyle : {};
  const bridgeLength = Math.max(0, nonNegativeNumber(surface.bridgeLength, SURFACE_BRIDGE_LENGTH));
  const color = readString(surface.color ?? dropletStyle.color ?? dropletStyle.bridgeColor) || '#ffffff';
  const opacity = clamp(nonNegativeNumber(dropletStyle.opacity ?? surface.opacity, 1), 0, 1);
  const seed = Math.max(1, Math.floor(nonNegativeNumber(surface.seed, 1)));
  const activeStart = readSurfaceShape(surface.activeStart, SURFACE_ACTIVE_START) || SURFACE_ACTIVE_START;
  const targetShapes = readSurfaceShapes(surface.targets, SURFACE_TARGET_SHAPES);
  const timeline = buildSurfaceTimeline(targetShapes, activeStart, seed);
  const progress = resolveSurfaceProgress(option.currentTime);
  const state = renderSurfaceAt(progress, timeline.segments, timeline.totalDuration, activeStart, targetShapes, bridgeLength);
  const transform = surfaceTransform(width, height);
  const entities: EvolutionFluidEntityLayout[] = state.drops
    .filter((drop) => !drop.absorbed && drop.currentRadius > 2)
    .map((drop, index) => {
      const shape = scaleSurfaceShape(
        { x: drop.currentX, y: drop.currentY, r: drop.currentRadius },
        transform
      );
      return {
        id: drop.id,
        name: drop.id,
        category: 'surface',
        value: round(drop.currentRadius ** 2),
        x: shape.x,
        y: shape.y,
        r: shape.r,
        opacity,
        color,
        active: true,
        z2: 1,
        dataIndex: -1,
        raw: { id: drop.id, surface: true, index }
      };
    });
  const activeShape = scaleSurfaceShape(state.active, transform);
  const activeEntity: EvolutionFluidEntityLayout = {
    id: '__surface_active',
    name: 'Active',
    category: 'surface',
    value: round(state.active.r ** 2),
    x: activeShape.x,
    y: activeShape.y,
    r: activeShape.r,
    opacity,
    color,
    active: true,
    z2: 3,
    dataIndex: -1,
    raw: { id: '__surface_active', surface: true }
  };
  entities.push(activeEntity);

  const bridges: EvolutionFluidBridgeLayout[] = [];
  if (
    state.bridgeDrop
    && state.bridgeDrop.r > 2
    && distanceBetween(state.active, state.bridgeDrop) + state.bridgeDrop.r > state.active.r + 1
  ) {
    const bridgeTarget = scaleSurfaceShape(state.bridgeDrop, transform);
    const surfaceShape = createWaterdropSurfaceShape(activeShape, bridgeTarget, {
      bridgeLength: bridgeLength * transform.scale,
      handleSize: 0.85
    }) || undefined;
    const path = createWaterdropSurfacePath(activeShape, bridgeTarget, {
      bridgeLength: bridgeLength * transform.scale,
      handleSize: 0.85
    });
    if (path || surfaceShape) {
      bridges.push({
        id: `surface:${state.bridgeDrop.id}`,
        kind: 'surface',
        sourceId: activeEntity.id,
        targetId: state.bridgeDrop.id,
        sourceIds: [activeEntity.id],
        targetIds: [state.bridgeDrop.id],
        path,
        width: 1,
        opacity,
        color,
        surfaceShape
      });
    }
  }

  return {
    width,
    height,
    progress,
    entities,
    events: [],
    bridges,
    timeline: createSurfaceControlTimeline(width, height, option, progress)
  };
}

function readSurfaceShapes(value: unknown, fallback: SurfaceShape[]): SurfaceShape[] {
  const items = Array.isArray(value) ? value : fallback;
  const shapes = items
    .map((item) => readSurfaceShape(item, null))
    .filter((shape): shape is SurfaceShape => Boolean(shape));
  return shapes.length ? shapes : fallback.map((shape) => ({ ...shape }));
}

function readSurfaceShape(value: unknown, fallback: SurfaceShape | null): SurfaceShape | null {
  const record = isRecord(value) ? value : {};
  const shape = {
    x: finiteNumber(record.x, fallback?.x ?? 0),
    y: finiteNumber(record.y, fallback?.y ?? 0),
    r: finiteNumber(record.r ?? record.radius, fallback?.r ?? 0)
  };
  if (shape.r > 0) return shape;
  return fallback ? { ...fallback } : null;
}

function buildSurfaceTimeline(
  drops: SurfaceShape[],
  activeStart: SurfaceShape,
  seed: number
): { segments: SurfaceSegment[]; totalDuration: number } {
  const rng = seededRandom(seed);
  const remaining = drops.map((_, index) => index);
  const segments: SurfaceSegment[] = [];
  const active = { ...activeStart };
  let time = 0;

  while (remaining.length) {
    const remainingIndex = Math.floor(rng() * remaining.length);
    const dropIndex = remaining.splice(remainingIndex, 1)[0];
    const drop = drops[dropIndex];
    const dx = drop.x - active.x;
    const dy = drop.y - active.y;
    const len = Math.max(distanceBetween(active, drop), 1);
    const contactDistance = Math.max(active.r + drop.r - 1, 0);
    const endX = drop.x - (dx / len) * contactDistance;
    const endY = drop.y - (dy / len) * contactDistance;
    const moveLen = Math.max(distanceBetween(active, { x: endX, y: endY }), 1);
    const bend = (rng() - 0.5) * Math.min(90, moveLen * 0.7);
    const moveDuration = clamp(moveLen * 7, 520, 1250);
    const moveSegment: SurfaceSegment = {
      type: 'move',
      dropIndex,
      startTime: time,
      duration: moveDuration,
      endTime: time + moveDuration,
      x0: active.x,
      y0: active.y,
      x1: endX,
      y1: endY,
      cx: (active.x + endX) / 2 - (dy / len) * bend,
      cy: (active.y + endY) / 2 + (dx / len) * bend,
      r: active.r
    };
    segments.push(moveSegment);
    time = moveSegment.endTime;
    active.x = endX;
    active.y = endY;
    active.r = moveSegment.r;

    const mergeSegment = createSurfaceMergeSegment(dropIndex, active, drop, time);
    segments.push(mergeSegment);
    time = mergeSegment.endTime;
    active.x = mergeSegment.x1;
    active.y = mergeSegment.y1;
    active.r = mergeSegment.r1;
  }

  return { segments, totalDuration: time };
}

function createSurfaceMergeSegment(
  dropIndex: number,
  active: SurfaceShape,
  drop: SurfaceShape,
  startTime: number
): Extract<SurfaceSegment, { type: 'merge' }> {
  const activeArea = active.r ** 2;
  const dropArea = drop.r ** 2;
  const totalArea = Math.max(1e-9, activeArea + dropArea);
  return {
    type: 'merge',
    dropIndex,
    startTime,
    duration: 460,
    endTime: startTime + 460,
    x0: active.x,
    y0: active.y,
    r0: active.r,
    r1: Math.sqrt(totalArea),
    x1: (active.x * activeArea + drop.x * dropArea) / totalArea,
    y1: (active.y * activeArea + drop.y * dropArea) / totalArea,
    dropRadius: drop.r
  };
}

function renderSurfaceAt(
  progress: number,
  segments: SurfaceSegment[],
  totalDuration: number,
  activeStart: SurfaceShape,
  targetShapes: SurfaceShape[],
  bridgeLength: number
): {
  active: SurfaceShape;
  drops: SurfaceDropState[];
  bridgeDrop: (SurfaceShape & { id: string }) | null;
} {
  const time = clamp(progress, 0, 1) * totalDuration;
  const drops: SurfaceDropState[] = targetShapes.map((shape, index) => ({
    id: `__surface_drop_${index}`,
    x: shape.x,
    y: shape.y,
    r: shape.r,
    currentX: shape.x,
    currentY: shape.y,
    currentRadius: shape.r,
    absorbed: false
  }));
  const active = { ...activeStart };
  let activeSegment: SurfaceSegment | null = null;

  for (const segment of segments) {
    if (time < segment.startTime) break;
    if (time <= segment.endTime) {
      activeSegment = segment;
      break;
    }
    if (segment.type === 'move') {
      active.x = segment.x1;
      active.y = segment.y1;
      active.r = segment.r;
    } else {
      const drop = drops[segment.dropIndex];
      drop.absorbed = true;
      drop.currentRadius = 0;
      active.x = segment.x1;
      active.y = segment.y1;
      active.r = segment.r1;
    }
  }

  let bridgeDrop: (SurfaceShape & { id: string }) | null = null;
  if (activeSegment) {
    if (activeSegment.type === 'move') {
      sampleSurfaceMove(active, activeSegment, (time - activeSegment.startTime) / activeSegment.duration);
      const drop = findSurfaceBridgeDrop(active, drops, bridgeLength);
      bridgeDrop = drop && {
        id: drop.id,
        x: drop.currentX,
        y: drop.currentY,
        r: drop.currentRadius
      };
    } else {
      bridgeDrop = applySurfaceMergeFrame(active, drops[activeSegment.dropIndex], activeSegment, time);
    }
  }

  return { active, drops, bridgeDrop };
}

function sampleSurfaceMove(active: SurfaceShape, segment: Extract<SurfaceSegment, { type: 'move' }>, percent: number): void {
  const p = smootherStep(percent);
  const inv = 1 - p;
  active.x = inv * inv * segment.x0 + 2 * inv * p * segment.cx + p * p * segment.x1;
  active.y = inv * inv * segment.y0 + 2 * inv * p * segment.cy + p * p * segment.y1;
  active.r = segment.r;
}

function findSurfaceBridgeDrop(
  active: SurfaceShape,
  drops: SurfaceDropState[],
  bridgeLength: number
): SurfaceDropState | null {
  let closest: SurfaceDropState | null = null;
  let closestGap = bridgeLength;
  drops.forEach((drop) => {
    if (drop.absorbed) return;
    const gap = distanceBetween(active, drop) - active.r - drop.currentRadius;
    if (gap <= closestGap) {
      closest = drop;
      closestGap = gap;
    }
  });
  return closest;
}

function applySurfaceMergeFrame(
  active: SurfaceShape,
  drop: SurfaceDropState,
  segment: Extract<SurfaceSegment, { type: 'merge' }>,
  time: number
): (SurfaceShape & { id: string }) | null {
  const p = clamp((time - segment.startTime) / segment.duration, 0, 1);
  const eased = smootherStep(p);
  const swallow = smootherStep((p - 0.2) / 0.65);
  const shrink = smootherStep((p - 0.28) / 0.58);
  active.x = lerp(segment.x0, segment.x1, eased);
  active.y = lerp(segment.y0, segment.y1, eased);
  active.r = lerp(segment.r0, segment.r1, eased);
  drop.currentRadius = segment.dropRadius * (1 - shrink);
  drop.currentX = lerp(drop.x, active.x, swallow);
  drop.currentY = lerp(drop.y, active.y, swallow);
  drop.absorbed = drop.currentRadius <= 2;
  if (drop.currentRadius <= 2) return null;
  return {
    id: drop.id,
    x: drop.currentX,
    y: drop.currentY,
    r: drop.currentRadius
  };
}

function surfaceTransform(width: number, height: number): { scale: number; offsetX: number; offsetY: number } {
  const scale = Math.min(width / SURFACE_REFERENCE_WIDTH, height / SURFACE_REFERENCE_HEIGHT);
  return {
    scale,
    offsetX: (width - SURFACE_REFERENCE_WIDTH * scale) / 2,
    offsetY: (height - SURFACE_REFERENCE_HEIGHT * scale) / 2
  };
}

function scaleSurfaceShape(shape: SurfaceShape, transform: { scale: number; offsetX: number; offsetY: number }): SurfaceShape {
  return {
    x: round(transform.offsetX + shape.x * transform.scale),
    y: round(transform.offsetY + shape.y * transform.scale),
    r: round(shape.r * transform.scale)
  };
}

function resolveSurfaceProgress(currentTime: unknown): number {
  if (currentTime == null) return 0;
  const value = timeToNumber(currentTime, 0);
  return value > 1 ? clamp(value / 1000, 0, 1) : clamp(value, 0, 1);
}

function createSurfaceControlTimeline(
  width: number,
  height: number,
  option: EvolutionFluidLayoutOption,
  progress: number
): EvolutionFluidLayoutResult['timeline'] {
  const timelineOption = isRecord(option.timeline) ? option.timeline : {};
  const show = timelineOption.show === true;
  const y = height - Math.max(12, nonNegativeNumber(timelineOption.bottom, 18));
  const startX = 48;
  const endX = Math.max(startX + 1, width - 48);
  return {
    show,
    y,
    startX,
    endX,
    ticks: [0, 0.25, 0.5, 0.75, 1].map((tick) => ({
      time: String(Math.round(tick * 1000)),
      x: round(startX + (endX - startX) * tick),
      active: progress >= tick
    })),
    handleX: round(startX + (endX - startX) * progress)
  };
}

function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function normalizeEntities(option: EvolutionFluidLayoutOption): NormalizedEntity[] {
  const rawEntities = normalizeUnknownArray(option.entities ?? option.data);
  const idField = readString(option.entityIdField) || 'id';
  const valueField = readString(option.valueField) || 'value';
  const categoryField = readString(option.categoryField) || 'industry';
  const seen = new Set<string>();
  return rawEntities.map((raw, index) => normalizeEntity(raw, index, idField, valueField, categoryField, seen));
}

function normalizeEntity(
  raw: unknown,
  index: number,
  idField: string,
  valueField: string,
  categoryField: string,
  seen: Set<string>
): NormalizedEntity {
  const record = isRecord(raw) ? raw : { value: raw };
  const baseId = readString(readField(record, idField) ?? record.id ?? record.name ?? record.label) || `entity-${index}`;
  const id = uniqueId(baseId, seen);
  const name = readString(record.name ?? record.label ?? record.id) || id;
  const category = readString(readField(record, categoryField) ?? record.category ?? record.industry) || 'default';
  return {
    id,
    name,
    category,
    value: nonNegativeNumber(readField(record, valueField) ?? record.value, 1),
    color: readItemColor(record) || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
    dataIndex: index,
    raw
  };
}

function normalizeEvents(option: EvolutionFluidLayoutOption): EvolutionFluidNormalizedEvent[] {
  const rawEvents = normalizeUnknownArray(option.events);
  const timeField = readString(option.timeField) || 'time';
  return rawEvents
    .map((raw, index) => normalizeEvent(raw, index, timeField))
    .sort((left, right) => left.timeValue - right.timeValue || left.order - right.order);
}

function normalizeEvent(raw: unknown, order: number, timeField: string): EvolutionFluidNormalizedEvent {
  const record = isRecord(raw) ? raw : {};
  const timeRaw = readField(record, timeField) ?? record.time ?? order;
  const time = stringifyValue(timeRaw, String(order));
  return {
    id: readString(record.id) || `event-${order}`,
    type: readString(record.type) || 'custom',
    time,
    timeValue: timeToNumber(timeRaw, order),
    order,
    sourceIds: readIdArray(record.sources ?? record.source ?? record.from),
    targetIds: readIdArray(record.targets ?? record.target ?? record.to),
    value: nonNegativeNumber(record.value, 0),
    raw
  };
}

function ensureReferencedEntities(entities: NormalizedEntity[], events: EvolutionFluidNormalizedEvent[]): NormalizedEntity[] {
  const byId = new Map(entities.map((entity) => [entity.id, entity]));
  const next = entities.slice();
  events.forEach((event) => {
    const relatedCategory = inferRelatedCategory(event, byId);
    [...event.sourceIds, ...event.targetIds].forEach((id) => {
      if (byId.has(id)) return;
      const entity: NormalizedEntity = {
        id,
        name: id,
        category: relatedCategory,
        value: Math.max(1, event.value),
        color: DEFAULT_COLORS[next.length % DEFAULT_COLORS.length],
        dataIndex: next.length,
        raw: { id, name: id, generated: true }
      };
      byId.set(id, entity);
      next.push(entity);
    });
  });
  return next;
}

function filterVisibleEvents(events: EvolutionFluidNormalizedEvent[], currentTimeValue: number | null): EvolutionFluidNormalizedEvent[] {
  if (currentTimeValue == null) return events;
  return events.filter((event) => event.timeValue <= currentTimeValue);
}

function inferRelatedCategory(event: EvolutionFluidNormalizedEvent, byId: Map<string, NormalizedEntity>): string {
  const related = [...event.sourceIds, ...event.targetIds].map((id) => byId.get(id)).filter(Boolean) as NormalizedEntity[];
  return related[0]?.category || 'default';
}

function createRadiusScale(values: number[], option: EvolutionFluidLayoutOption): (value: number) => number {
  const style = isRecord(option.dropletStyle) ? option.dropletStyle : {};
  const minRadius = Math.max(1, nonNegativeNumber(style.minRadius, DEFAULT_MIN_RADIUS));
  const maxRadius = Math.max(minRadius, nonNegativeNumber(style.maxRadius, DEFAULT_MAX_RADIUS));
  const maxValue = Math.max(1, ...values);
  return (value) => round(minRadius + (Math.sqrt(Math.max(0, value)) / Math.sqrt(maxValue)) * (maxRadius - minRadius));
}

function layoutCategories(
  entities: NormalizedEntity[],
  width: number,
  height: number,
  option: EvolutionFluidLayoutOption
): Map<string, { x: number; y: number }> {
  const layout = isRecord(option.layout) ? option.layout : {};
  const clustering = readString(layout.clustering) === 'none' ? 'none' : 'category';
  const categories = clustering === 'none'
    ? ['__all__']
    : Array.from(new Set(entities.map((entity) => entity.category))).sort();
  const categoryGap = Math.max(1, nonNegativeNumber(layout.categoryGap, 120));
  const centerX = width * readPercent(layout.center, 0, 0.5);
  const centerY = height * readPercent(layout.center, 1, 0.44);
  const margin = Math.min(90, Math.max(48, width * 0.08));
  const usableWidth = Math.max(1, width - margin * 2);
  const byCategory = new Map<string, NormalizedEntity[]>();
  entities.forEach((entity) => {
    const key = clustering === 'none' ? '__all__' : entity.category;
    const list = byCategory.get(key) || [];
    list.push(entity);
    byCategory.set(key, list);
  });

  const positions = new Map<string, { x: number; y: number }>();
  const effectiveCategoryGap = categories.length <= 1
    ? 0
    : Math.min(categoryGap, usableWidth / (categories.length - 1));
  const categoryStartX = centerX - (effectiveCategoryGap * (categories.length - 1)) / 2;
  categories.forEach((category, categoryIndex) => {
    const rawCategoryX = categories.length === 1 ? centerX : categoryStartX + effectiveCategoryGap * categoryIndex;
    const categoryX = clamp(rawCategoryX, margin, width - margin);
    const list = byCategory.get(category) || [];
    list.forEach((entity, entityIndex) => {
      const angle = (entityIndex / Math.max(1, list.length)) * Math.PI * 2;
      const ring = 44 + Math.floor(entityIndex / 6) * 26;
      positions.set(entity.id, {
        x: round(clamp(categoryX + Math.cos(angle) * ring, 24, width - 24)),
        y: round(clamp(centerY + Math.sin(angle) * ring, 24, height - 70))
      });
    });
  });
  return positions;
}

function toPublicEvent(event: EvolutionFluidNormalizedEvent, entities: EvolutionFluidEntityLayout[]): EvolutionFluidEventLayout {
  const related = [...event.sourceIds, ...event.targetIds]
    .map((id) => entities.find((entity) => entity.id === id))
    .filter((entity): entity is EvolutionFluidEntityLayout => Boolean(entity));
  const x = related.length ? related.reduce((sum, entity) => sum + entity.x, 0) / related.length : 0;
  const y = related.length ? related.reduce((sum, entity) => sum + entity.y, 0) / related.length : 0;
  return {
    id: event.id,
    type: event.type,
    time: event.time,
    order: event.order,
    sourceIds: event.sourceIds,
    targetIds: event.targetIds,
    value: event.value,
    x: round(x),
    y: round(y),
    r: round(Math.max(4, Math.min(24, Math.sqrt(event.value || 1) * 2))),
    raw: event.raw
  };
}

function materializedLayoutEvents(events: EvolutionFluidNormalizedEvent[], currentTimeValue: number | null): EvolutionFluidNormalizedEvent[] {
  if (currentTimeValue == null) return events;
  return events.filter((event) => event.timeValue <= currentTimeValue || Boolean(resolveEventPhase(event, events, currentTimeValue)));
}

function applyEventStages(
  entities: EvolutionFluidEntityLayout[],
  events: EvolutionFluidNormalizedEvent[],
  currentTimeValue: number | null
): MutableEntityLayout[] {
  const byId = new Map<string, MutableEntityLayout>(
    entities.map((entity) => [entity.id, { ...entity }])
  );
  const originalById = new Map<string, EvolutionFluidEntityLayout>(
    entities.map((entity) => [entity.id, { ...entity }])
  );

  hidePendingSplitTargets(byId, events, currentTimeValue);

  events.forEach((event) => {
    if (isSplittingEvent(event)) {
      applySplitStage(event, events, currentTimeValue, byId, originalById);
      return;
    }
    if (!isAbsorbingEvent(event)) return;
    const phase = currentTimeValue == null
      ? { kind: 'complete', progress: 1, fusionProgress: 1 } satisfies EventPhase
      : resolveEventPhase(event, events, currentTimeValue);
    if (!phase) return;

    const sourceIds = event.sourceIds.filter((id) => !event.targetIds.includes(id));
    const targetIds = event.targetIds.length ? event.targetIds : sourceIds.slice(0, 1);
    if (!sourceIds.length || !targetIds.length) return;

    const targets = targetIds.map((id) => byId.get(id)).filter((entity): entity is MutableEntityLayout => Boolean(entity));
    const sources = sourceIds.map((id) => byId.get(id)).filter((entity): entity is MutableEntityLayout => Boolean(entity));
    if (!targets.length || !sources.length) return;

    const target = targets[0];

    if (phase.kind === 'complete') {
      const sourceArea = sources.reduce((sum, source) => sum + source.r ** 2, 0);
      const sourceValue = sources.reduce((sum, source) => sum + source.value, 0);
      const mergedCenter = weightedMergeCenter(target, target.r ** 2, sources);
      target.r = mergedSurfaceRadius(target.r, sourceArea, 1);
      target.value = round(target.value + sourceValue);
      target.x = mergedCenter.x;
      target.y = mergedCenter.y;
      sources.forEach((source) => {
        source.hidden = true;
        source.active = false;
        source.opacity = 0;
        source.r = 0;
      });
      return;
    }

    sources.forEach((source, index) => {
      const localProgress = localFusionProgress(phase.fusionProgress, index, sources.length);
      if (localProgress <= 0) {
        if (phase.kind === 'approach' && index === 0) {
          const approach = smootherStep(phase.progress / 0.58);
          const direction = normalizedVector(target, source) || radialDirection(index, sources.length);
          const contactDistance = Math.max(0, target.r + source.r - 1);
          source.x = round(lerp(source.x, target.x + direction.x * contactDistance, approach));
          source.y = round(lerp(source.y, target.y + direction.y * contactDistance, approach));
        }
        return;
      }
      if (localProgress >= 1) {
        const mergedCenter = weightedMergeCenter(target, target.r ** 2, [source]);
        target.r = mergedSurfaceRadius(target.r, source.r ** 2, 1);
        target.value = round(target.value + source.value);
        target.x = mergedCenter.x;
        target.y = mergedCenter.y;
        hideEntity(source);
        return;
      }
      const targetStart = { x: target.x, y: target.y, r: target.r };
      const surfaceFusion = smootherStep(localProgress);
      const shrink = absorbedRadiusLoss(localProgress);
      const swallow = fusionSwallow(localProgress);
      const centerMotion = fusionCenterMotion(localProgress);
      const startRadius = source.r;
      const sourceRadius = Math.max(0.08, startRadius * (1 - shrink));
      const mergedCenter = weightedMergeCenter(targetStart, targetStart.r ** 2, [source]);
      const direction = normalizedVector(targetStart, source) || radialDirection(index, sources.length);
      const contactDistance = Math.max(0, targetStart.r + startRadius - 1);
      const contactPoint = {
        x: targetStart.x + direction.x * contactDistance,
        y: targetStart.y + direction.y * contactDistance
      };
      const approach = smootherStep(Math.min(1, phase.progress / 0.58));
      const approachPoint = {
        x: lerp(source.x, contactPoint.x, approach),
        y: lerp(source.y, contactPoint.y, approach)
      };
      target.r = mergedSurfaceRadius(targetStart.r, startRadius ** 2, surfaceFusion);
      target.value = round(target.value + source.value * surfaceFusion);
      target.x = round(lerp(targetStart.x, mergedCenter.x, centerMotion));
      target.y = round(lerp(targetStart.y, mergedCenter.y, centerMotion));
      const bridgeDistance = Math.max(0, target.r + sourceRadius + liquidBridgeGap(localProgress, sourceRadius, target.r));
      const bridgePoint = {
        x: target.x + direction.x * bridgeDistance,
        y: target.y + direction.y * bridgeDistance
      };
      const stagedPoint = {
        x: lerp(approachPoint.x, bridgePoint.x, surfaceFusion),
        y: lerp(approachPoint.y, bridgePoint.y, surfaceFusion)
      };
      const visuallySwallowed = sourceRadius <= Math.max(0.1, startRadius * 0.02) || swallow > 0.96;
      source.x = round(visuallySwallowed ? target.x : lerp(stagedPoint.x, target.x, swallow));
      source.y = round(visuallySwallowed ? target.y : lerp(stagedPoint.y, target.y, swallow));
      source.r = round(sourceRadius);
      source.opacity = round(source.opacity * Math.max(0.08, Math.min(1, sourceRadius / Math.max(1, startRadius * 0.45))));
      source.color = mixColors(source.color, target.color, smoothStep(0.16, 0.78, phase.fusionProgress)) || source.color;
      source.active = true;
    });
  });

  return Array.from(byId.values());
}

function mergedSurfaceRadius(currentRadius: number, sourceArea: number, amount: number): number {
  return round(Math.sqrt(currentRadius ** 2 + Math.max(0, sourceArea) * clamp(amount, 0, 1)));
}

function absorbedRadiusLoss(progress: number): number {
  return smootherStep((progress - 0.18) / 0.78);
}

function fusionSwallow(progress: number): number {
  return smootherStep((progress - 0.62) / 0.34);
}

function fusionCenterMotion(progress: number): number {
  return smootherStep((progress - 0.42) / 0.46);
}

function liquidBridgeGap(progress: number, sourceRadius: number, targetRadius: number): number {
  const minRadius = Math.min(sourceRadius, targetRadius);
  const earlyGap = Math.max(2, minRadius * 0.28);
  const lateOverlap = Math.min(minRadius * 0.45, targetRadius * 0.2);
  return lerp(earlyGap, -lateOverlap, smootherStep((progress - 0.04) / 0.58));
}

function delayedAbsorption(progress: number): number {
  return smoothStep(0.72, 1, progress);
}

function splitNeckRelease(progress: number): number {
  return smootherStep((progress - 0.64) / 0.28);
}

function localFusionProgress(progress: number, index: number, total: number): number {
  if (total <= 1) return clamp(progress, 0, 1);
  const slot = clamp(progress, 0, 1) * total - index;
  return clamp(slot, 0, 1);
}

function hidePendingSplitTargets(
  byId: Map<string, MutableEntityLayout>,
  events: EvolutionFluidNormalizedEvent[],
  currentTimeValue: number | null
) {
  if (currentTimeValue == null) return;
  events.forEach((event) => {
    if (!isSplittingEvent(event) || currentTimeValue >= event.timeValue) return;
    if (resolveEventPhase(event, events, currentTimeValue)) return;
    event.targetIds.forEach((id) => {
      if (hasEarlierMaterializedEvent(id, event, events, currentTimeValue)) return;
      hideEntity(byId.get(id));
    });
  });
}

function hasEarlierMaterializedEvent(
  id: string,
  event: EvolutionFluidNormalizedEvent,
  events: EvolutionFluidNormalizedEvent[],
  currentTimeValue: number
): boolean {
  return events.some((candidate) => (
    candidate !== event &&
    candidate.timeValue <= currentTimeValue &&
    candidate.timeValue < event.timeValue &&
    (candidate.sourceIds.includes(id) || candidate.targetIds.includes(id))
  ));
}

function applySplitStage(
  event: EvolutionFluidNormalizedEvent,
  events: EvolutionFluidNormalizedEvent[],
  currentTimeValue: number | null,
  byId: Map<string, MutableEntityLayout>,
  originalById: Map<string, EvolutionFluidEntityLayout>
) {
  const phase = currentTimeValue == null
    ? { kind: 'complete', progress: 1, fusionProgress: 1 } satisfies EventPhase
    : resolveEventPhase(event, events, currentTimeValue);
  if (!phase) return;

  const sources = event.sourceIds.map((id) => byId.get(id)).filter((entity): entity is MutableEntityLayout => Boolean(entity));
  const targets = event.targetIds.map((id) => byId.get(id)).filter((entity): entity is MutableEntityLayout => Boolean(entity));
  if (!sources.length || !targets.length) return;

  const sourcePoint = averagePoint(sources);
  const progress = easeInOutCubic(phase.progress);
  const surfaceFusion = easeInOutCubic(phase.fusionProgress);
  const release = delayedAbsorption(phase.fusionProgress);
  targets.forEach((target, index) => {
    const original = originalById.get(target.id) || target;
    const fallbackDirection = radialDirection(index, targets.length);
    const naturalDirection = normalizedVector(sourcePoint, original) || fallbackDirection;
    const separation = Math.max(56, sources[0].r * 4 + target.r * 4);
    const endPoint = distanceBetween(sourcePoint, original) > 24
      ? original
      : {
          x: sourcePoint.x + naturalDirection.x * separation,
          y: sourcePoint.y + naturalDirection.y * separation
        };
    const emergingRadius = Math.max(1, original.r * (0.28 + progress * 0.72));
    const sourceRadius = sources[0].r;
    const innerDistance = Math.abs(sourceRadius - emergingRadius) + emergingRadius * 0.35;
    const neckDistance = sourceRadius + emergingRadius - Math.min(emergingRadius * 0.55, sourceRadius * 0.32) * surfaceFusion;
    const bridgePoint = {
      x: sourcePoint.x + naturalDirection.x * lerp(innerDistance, neckDistance, surfaceFusion),
      y: sourcePoint.y + naturalDirection.y * lerp(innerDistance, neckDistance, surfaceFusion)
    };

    target.hidden = false;
    target.active = true;
    target.x = round(lerp(bridgePoint.x, endPoint.x, release));
    target.y = round(lerp(bridgePoint.y, endPoint.y, release));
    target.r = round(emergingRadius);
    target.opacity = round(original.opacity * (0.12 + progress * 0.88));
  });
}

function createEventBridges(
  events: EvolutionFluidNormalizedEvent[],
  entities: EvolutionFluidEntityLayout[],
  option: EvolutionFluidLayoutOption,
  currentTimeValue: number | null
): EvolutionFluidBridgeLayout[] {
  const entityById = new Map(entities.map((entity) => [entity.id, entity]));
  const dropletStyle = isRecord(option.dropletStyle) ? option.dropletStyle : {};
  const maxDistance = Math.max(1, nonNegativeNumber(dropletStyle.bridgeThreshold, 120));
  const opacity = Math.min(1, nonNegativeNumber(dropletStyle.bridgeOpacity, 0.78));
  const bridges: EvolutionFluidBridgeLayout[] = [];

  events.forEach((event) => {
    if (!isAbsorbingEvent(event) && !isSplittingEvent(event)) return;
    const phase = currentTimeValue == null ? null : resolveEventPhase(event, events, currentTimeValue);
    if (!phase || phase.kind !== 'fusion' || phase.fusionProgress <= 0 || phase.fusionProgress >= 1) return;
    const sourceIds = event.sourceIds.length ? event.sourceIds : event.targetIds;
    const targetIds = event.targetIds.length ? event.targetIds : event.sourceIds;
    const pathSegments: string[] = [];
    const bridgeSourceIds: string[] = [];
    const bridgeTargetIds: string[] = [];
    let surfaceShape: WaterdropSurfaceShape | undefined;
    let bridgeWidth = 1;
    let bridgeOpacity = 0;
    let bridgeColor = '';
    let bridgeStrength = 0;

    sourceIds.forEach((sourceId) => {
      const localProgress = isAbsorbingEvent(event)
        ? localFusionProgress(phase.fusionProgress, sourceIds.indexOf(sourceId), sourceIds.length)
        : phase.fusionProgress;
      if (localProgress <= 0 || localProgress >= 1) return;
      const absorption = isAbsorbingEvent(event)
        ? absorbedRadiusLoss(localProgress)
        : splitNeckRelease(localProgress);
      targetIds.forEach((targetId) => {
        if (sourceId === targetId) return;
        const source = entityById.get(sourceId);
        const target = entityById.get(targetId);
        if (!source || !target) return;
        const distance = Math.hypot(target.x - source.x, target.y - source.y);
        const bridgeDistance = Math.max(maxDistance, distance + maxDistance * 0.55);
        const rawStrength = computeMetaballBridgeStrength(source, target, maxDistance);
        const extendedStrength = computeMetaballBridgeStrength(source, target, bridgeDistance);
        const strength = Math.max(
          rawStrength,
          extendedStrength * 0.95,
          Math.max(0.28, Math.min(0.45, maxDistance / Math.max(distance, maxDistance) * 0.42))
        ) * (0.35 + easeInOutCubic(localProgress) * 0.65) * (1 - absorption * 0.68);
        const bridgeRender = createBridgeRenderForEvent(event, source, target, localProgress, absorption, bridgeDistance);
        if (!bridgeRender.path) return;
        pushUnique(bridgeSourceIds, sourceId);
        pushUnique(bridgeTargetIds, targetId);
        pathSegments.push(bridgeRender.path);
        surfaceShape = pathSegments.length === 1 ? bridgeRender.surfaceShape : undefined;
        bridgeWidth = Math.max(bridgeWidth, Math.sqrt(event.value || 1) * strength);
        bridgeOpacity = Math.max(bridgeOpacity, opacity * (0.72 + strength * 0.28));
        if (!bridgeColor || strength > bridgeStrength) {
          bridgeColor = isSplittingEvent(event) ? mixColors(source.color, target.color, 0.5) || source.color : target.color;
          bridgeStrength = strength;
        }
      });
    });
    if (!pathSegments.length) return;
    bridges.push({
      id: `${event.id}:${event.type}:${bridgeSourceIds.join('+')}->${bridgeTargetIds.join('+')}`,
      kind: isSplittingEvent(event) ? 'split' : 'absorb',
      sourceId: bridgeSourceIds[0] || '',
      targetId: bridgeTargetIds[0] || '',
      sourceIds: bridgeSourceIds,
      targetIds: bridgeTargetIds,
      path: pathSegments.join(' '),
      width: round(Math.max(1, bridgeWidth)),
      opacity: round(bridgeOpacity),
      color: bridgeColor || '#38bdf8',
      surfaceShape
    });
  });

  return bridges;
}

function createBridgeRenderForEvent(
  event: EvolutionFluidNormalizedEvent,
  source: EvolutionFluidEntityLayout,
  target: EvolutionFluidEntityLayout,
  fusionProgress: number,
  absorption: number,
  bridgeDistance: number
): { path: string; surfaceShape?: WaterdropSurfaceShape } {
  const bridgeLength = Math.min(54, Math.max(24, bridgeDistance * 0.16));
  if (isSplittingEvent(event)) {
    const neckSize = Math.min(source.r, target.r) * smootherStep(1 - absorption);
    if (splitGap(source, target) > 0) {
      return {
        path: createSplitEnvelopePath(source, target, {
          releaseProgress: 1,
          bridgeLength
        })
      };
    }
    const continuousPath = createSplitContinuousPath(source, target, bridgeDistance);
    if (continuousPath) {
      return {
        path: continuousPath
      };
    }
    return {
      path: createSplitEnvelopePath(source, target, {
        releaseProgress: absorption,
        bridgeLength
      }),
      surfaceShape: createWaterdropFusionShape(source, target, {
        neckSize,
        bridgeLength,
        handleSize: 0.85
      }) || undefined
    };
  }
  const neckSize = Math.min(source.r, target.r) * smootherStep((fusionProgress - 0.04) / 0.5);
  return {
    path: createFusionEnvelopePath(source, target, {
      fusionProgress,
      bridgeLength
    }),
    surfaceShape: createWaterdropFusionShape(source, target, {
      neckSize,
      bridgeLength,
      handleSize: 0.85
    }) || undefined
  };
}

function createSplitContinuousPath(
  source: EvolutionFluidEntityLayout,
  target: EvolutionFluidEntityLayout,
  bridgeDistance: number
): string {
  const minRadius = Math.min(source.r, target.r);
  const gap = splitGap(source, target);
  if (!Number.isFinite(gap) || gap > minRadius * 0.85) return '';
  return createMetaballBridgePath(source, target, {
    maxDistance: bridgeDistance,
    handleSize: 0.62,
    viscosity: 0.7
  });
}

function splitGap(source: EvolutionFluidEntityLayout, target: EvolutionFluidEntityLayout): number {
  return Math.hypot(target.x - source.x, target.y - source.y) - source.r - target.r;
}

function pushUnique(list: string[], value: string): void {
  if (!list.includes(value)) list.push(value);
}

function isAbsorbingEvent(event: EvolutionFluidNormalizedEvent): boolean {
  const type = event.type.toLowerCase();
  return type !== 'found' && type !== 'rename' && type !== 'close' && type !== 'split' && type !== 'spinoff';
}

function isSplittingEvent(event: EvolutionFluidNormalizedEvent): boolean {
  const type = event.type.toLowerCase();
  return type === 'split' || type === 'spinoff';
}

function hideEntity(entity: MutableEntityLayout | undefined) {
  if (!entity) return;
  entity.hidden = true;
  entity.active = false;
  entity.opacity = 0;
  entity.r = 0;
}

function resolveEventPhase(
  event: EvolutionFluidNormalizedEvent,
  events: EvolutionFluidNormalizedEvent[],
  currentTimeValue: number
): EventPhase | null {
  if (currentTimeValue >= event.timeValue) {
    return { kind: 'complete', progress: 1, fusionProgress: 1 };
  }
  const window = transitionWindowForEvent(event, events);
  const start = event.timeValue - window;
  if (currentTimeValue < start) return null;
  const fusionStart = event.timeValue - window * 0.42;
  const progress = clamp((currentTimeValue - start) / Math.max(1e-9, event.timeValue - start), 0, 1);
  const fusionProgress = clamp((currentTimeValue - fusionStart) / Math.max(1e-9, event.timeValue - fusionStart), 0, 1);
  return {
    kind: fusionProgress > 0 ? 'fusion' : 'approach',
    progress,
    fusionProgress
  };
}

function transitionWindowForEvent(event: EvolutionFluidNormalizedEvent, events: EvolutionFluidNormalizedEvent[]): number {
  const times = Array.from(new Set(events.map((item) => item.timeValue).filter((value) => Number.isFinite(value)))).sort((left, right) => left - right);
  const index = times.findIndex((time) => time === event.timeValue);
  const previousGap = index > 0 ? event.timeValue - times[index - 1] : 0;
  const nextGap = index >= 0 && index < times.length - 1 ? times[index + 1] - event.timeValue : 0;
  const fallbackGap = previousGap || nextGap || 1;
  return Math.max(1e-6, Math.max(previousGap || 0, fallbackGap) * 0.82);
}

function createTimeline(
  width: number,
  height: number,
  option: EvolutionFluidLayoutOption,
  events: EvolutionFluidNormalizedEvent[],
  progress: number
): EvolutionFluidLayoutResult['timeline'] {
  const timelineOption = isRecord(option.timeline) ? option.timeline : {};
  const show = timelineOption.show !== false;
  const y = height - Math.max(12, nonNegativeNumber(timelineOption.bottom, 18));
  const startX = 48;
  const endX = Math.max(startX + 1, width - 48);
  const min = events[0]?.timeValue ?? 0;
  const max = events[events.length - 1]?.timeValue ?? min;
  return {
    show,
    y,
    startX,
    endX,
    ticks: events.map((event) => ({
      time: event.time,
      x: round(projectTime(event.timeValue, min, max, startX, endX)),
      active: progress >= progressForTime(event.timeValue, min, max)
    })),
    handleX: round(startX + (endX - startX) * progress)
  };
}

function resolveProgress(currentTime: unknown, events: EvolutionFluidNormalizedEvent[]): number {
  if (!events.length) return 0;
  if (currentTime == null) return 1;
  const value = timeToNumber(currentTime, events[0].timeValue);
  const min = events[0].timeValue;
  const max = events[events.length - 1].timeValue;
  if (max <= min) return value < min ? 0 : 1;
  return progressForTime(value, min, max);
}

function resolveCurrentTimeValue(currentTime: unknown, events: EvolutionFluidNormalizedEvent[]): number | null {
  if (currentTime == null) return null;
  return timeToNumber(currentTime, events[0]?.timeValue ?? 0);
}

function progressForTime(value: number, min: number, max: number): number {
  if (max <= min) return 1;
  return clamp((value - min) / (max - min), 0, 1);
}

function projectTime(value: number, min: number, max: number, start: number, end: number): number {
  if (max <= min) return (start + end) / 2;
  return start + ((value - min) / (max - min)) * (end - start);
}

function normalizeUnknownArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null && !Array.isArray(value);
}

function readField(record: Record<string, unknown>, field: string): unknown {
  if (Object.prototype.hasOwnProperty.call(record, field)) return record[field];
  if (!field.includes('.')) return undefined;
  return field.split('.').reduce<unknown>((value, key) => (isRecord(value) ? value[key] : undefined), record);
}

function readString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.length) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return undefined;
}

function stringifyValue(value: unknown, fallback: string): string {
  return readString(value) || fallback;
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function nonNegativeNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  }
  return fallback;
}

function readIdArray(value: unknown): string[] {
  const raw = Array.isArray(value) ? value : value == null ? [] : [value];
  return raw.map((item) => stringifyValue(item, '')).filter(Boolean);
}

function timeToNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string') {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function uniqueId(baseId: string, seen: Set<string>): string {
  if (!seen.has(baseId)) {
    seen.add(baseId);
    return baseId;
  }
  let suffix = 2;
  while (seen.has(`${baseId}-${suffix}`)) suffix += 1;
  const id = `${baseId}-${suffix}`;
  seen.add(id);
  return id;
}

function readItemColor(record: Record<string, unknown>): string | undefined {
  const itemStyle = isRecord(record.itemStyle) ? record.itemStyle : {};
  return readString(itemStyle.color ?? record.color);
}

function mixColors(left: string, right: string, amount: number): string | undefined {
  const leftRgb = parseHexColor(left);
  const rightRgb = parseHexColor(right);
  if (!leftRgb || !rightRgb) return undefined;
  const ratio = clamp(amount, 0, 1);
  const red = Math.round(leftRgb[0] * (1 - ratio) + rightRgb[0] * ratio);
  const green = Math.round(leftRgb[1] * (1 - ratio) + rightRgb[1] * ratio);
  const blue = Math.round(leftRgb[2] * (1 - ratio) + rightRgb[2] * ratio);
  return `rgb(${red}, ${green}, ${blue})`;
}

function parseHexColor(value: string): [number, number, number] | undefined {
  const normalized = value.trim();
  const short = /^#([\da-f])([\da-f])([\da-f])$/i.exec(normalized);
  if (short) {
    return [
      Number.parseInt(short[1] + short[1], 16),
      Number.parseInt(short[2] + short[2], 16),
      Number.parseInt(short[3] + short[3], 16)
    ];
  }
  const long = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(normalized);
  if (!long) return undefined;
  return [
    Number.parseInt(long[1], 16),
    Number.parseInt(long[2], 16),
    Number.parseInt(long[3], 16)
  ];
}

function averagePoint(entities: Array<{ x: number; y: number }>): { x: number; y: number } {
  return {
    x: round(entities.reduce((sum, entity) => sum + entity.x, 0) / Math.max(1, entities.length)),
    y: round(entities.reduce((sum, entity) => sum + entity.y, 0) / Math.max(1, entities.length))
  };
}

function weightedMergeCenter(
  targetPoint: { x: number; y: number },
  targetArea: number,
  sources: Array<{ x: number; y: number; r: number }>
): { x: number; y: number } {
  const totalArea = Math.max(1e-9, targetArea + sources.reduce((sum, source) => sum + source.r ** 2, 0));
  const x = sources.reduce((sum, source) => sum + source.x * source.r ** 2, targetPoint.x * targetArea) / totalArea;
  const y = sources.reduce((sum, source) => sum + source.y * source.r ** 2, targetPoint.y * targetArea) / totalArea;
  return { x: round(x), y: round(y) };
}

function normalizedVector(from: { x: number; y: number }, to: { x: number; y: number }): { x: number; y: number } | null {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy);
  if (!Number.isFinite(distance) || distance <= 1e-6) return null;
  return { x: dx / distance, y: dy / distance };
}

function distanceBetween(left: { x: number; y: number }, right: { x: number; y: number }): number {
  return Math.hypot(right.x - left.x, right.y - left.y);
}

function radialDirection(index: number, total: number): { x: number; y: number } {
  const angle = (index / Math.max(1, total)) * Math.PI * 2;
  return { x: Math.cos(angle), y: Math.sin(angle) };
}

function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * clamp(amount, 0, 1);
}

function easeInOutCubic(value: number): number {
  const t = clamp(value, 0, 1);
  return t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2;
}

function smoothStep(edge0: number, edge1: number, value: number): number {
  const t = clamp((value - edge0) / Math.max(1e-9, edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function smootherStep(value: number): number {
  const t = clamp(value, 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function readPercent(value: unknown, index: number, fallback: number): number {
  if (!Array.isArray(value)) return fallback;
  const item = value[index];
  if (typeof item === 'number' && Number.isFinite(item)) return item > 1 ? item / 100 : item;
  if (typeof item === 'string' && item.endsWith('%')) {
    const parsed = Number(item.slice(0, -1));
    if (Number.isFinite(parsed)) return parsed / 100;
  }
  return fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number): number {
  return Math.round((value + Number.EPSILON) * 1000) / 1000;
}
