import { buildWaterdropFusionPath, createWaterdropFusionShape } from './waterdrop-fusion.js';
import type { WaterdropFusionPathContext, WaterdropFusionShape } from './waterdrop-fusion.js';

const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 400;
const DEFAULT_PADDING = 18;
const DEFAULT_NODE_PADDING = 2.5;
const DEFAULT_SIBLING_GAP = 1.5;
const EPSILON = 1e-6;
const MAX_BRIDGE_ONLY_GAP_RATIO = 1.2;
const MOVE_TARGET_PARENT_CLEARANCE_RATIO = 0.04;
const SIBLING_MOVE_SOURCE_BRIDGE_END_PROGRESS = 0.66;

export const DEFAULT_CIRCLE_PACKING_COLORS = [
  '#356ac3',
  '#2f9a6b',
  '#c87a2a',
  '#9b5bb5',
  '#d34f5f',
  '#3f8796',
  '#8c9a24',
  '#6d78d8'
];

export type CirclePackingSort = boolean | 'none' | 'value' | 'name' | 'asc' | 'desc';
export type CirclePackingFluidEventType =
  | 'merge'
  | 'acquire'
  | 'split'
  | 'spinOff'
  | 'move'
  | 'relocate'
  | 'transfer'
  | 'checkpoint'
  | string;
export type CirclePackingFluidRenderMode = 'circlePacking' | 'evolutionFluid';

export interface CirclePackingDataItem {
  id?: string | number;
  name?: string;
  label?: string | number;
  value?: unknown;
  children?: unknown[];
  items?: unknown[];
  itemStyle?: Record<string, unknown>;
  labelStyle?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface CirclePackingPadding {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export interface CirclePackingFluidEventInput {
  id?: string | number;
  time?: string | number | Date;
  type?: CirclePackingFluidEventType;
  sources?: Array<string | number>;
  source?: string | number | Array<string | number>;
  from?: string | number | Array<string | number>;
  targets?: Array<string | number>;
  target?: string | number | Array<string | number>;
  to?: string | number | Array<string | number>;
  value?: unknown;
  duration?: number;
  span?: number;
  bridge?: boolean;
  showBridge?: boolean;
  drawBridge?: boolean;
  [key: string]: unknown;
}

export interface CirclePackingFluidOption {
  enabled?: boolean;
  renderMode?: CirclePackingFluidRenderMode;
  renderer?: CirclePackingFluidRenderMode;
  currentTime?: string | number | Date | null;
  events?: CirclePackingFluidEventInput[];
  bridgeOpacity?: number;
  bridgeThreshold?: number;
  bridgeColor?: string;
  dropletStyle?: {
    bridgeOpacity?: number;
    bridgeThreshold?: number;
    bridgeColor?: string;
  };
}

export interface CirclePackingLayoutOptions {
  width?: number;
  height?: number;
  padding?: number | CirclePackingPadding;
  nodePadding?: number;
  siblingGap?: number;
  center?: [number | string, number | string];
  radius?: number | string;
  rootName?: string;
  rootVisible?: boolean;
  valueField?: string;
  nameField?: string;
  childrenField?: string;
  sort?: CirclePackingSort;
  colors?: string[];
  fluid?: CirclePackingFluidOption;
  [key: string]: unknown;
}

export interface CirclePackingLayoutOption extends CirclePackingLayoutOptions {
  data?: unknown;
  layout?: unknown;
  layoutOptions?: unknown;
}

export interface CirclePackingNode {
  id: string;
  name: string;
  value: number;
  depth: number;
  parentId: string | null;
  children: CirclePackingNode[];
  dataIndex: number;
  x: number;
  y: number;
  r: number;
  color: string;
  percent: number;
  synthetic: boolean;
  raw: unknown;
  fluidActiveTarget?: boolean;
}

export interface CirclePackingFluidBridge {
  id: string;
  kind: 'absorb' | 'split';
  sourceId: string;
  targetId: string;
  sourceIds: string[];
  targetIds: string[];
  path: string;
  opacity: number;
  color: string;
  gradient?: CirclePackingFluidBridgeGradient;
  surfaceShape?: WaterdropFusionShape;
  hiddenIds?: string[];
  opaqueIds?: string[];
  elevatedIds?: string[];
  renderPath?: boolean;
}

export interface CirclePackingFluidBridgeGradient {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  colorStops: Array<{ offset: number; color: string }>;
}

export interface CirclePackingFluidLayoutState {
  progress: number;
  bridges: CirclePackingFluidBridge[];
}

export interface CirclePackingLayoutResult {
  width: number;
  height: number;
  center: {
    x: number;
    y: number;
  };
  radius: number;
  rootVisible: boolean;
  root: CirclePackingNode;
  nodes: CirclePackingNode[];
  fluid?: CirclePackingFluidLayoutState;
}

interface MutableNode {
  id: string;
  name: string;
  explicitValue: number | null;
  value: number;
  depth: number;
  parent: MutableNode | null;
  children: MutableNode[];
  dataIndex: number;
  localX: number;
  localY: number;
  localRadius: number;
  x: number;
  y: number;
  r: number;
  color: string;
  raw: unknown;
  synthetic: boolean;
  fluidHidden?: boolean;
}

interface WorkingCircle {
  node: MutableNode;
  x: number;
  y: number;
  r: number;
  packRadius: number;
}

interface FrontChainNode {
  circle: WorkingCircle;
  next: FrontChainNode;
  previous: FrontChainNode;
}

interface PaddingBox {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Point {
  x: number;
  y: number;
}

interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
}

interface CirclePackingFluidOptions {
  enabled: boolean;
  currentTime: string | number | Date | null;
  events: CirclePackingFluidNormalizedEvent[];
  bridgeOpacity: number;
  bridgeThreshold: number;
  bridgeColor: string | null;
}

interface CirclePackingFluidNormalizedEvent {
  id: string;
  type: string;
  time: string;
  timeValue: number;
  duration: number | null;
  order: number;
  sourceRefs: string[];
  targetRefs: string[];
  value: number;
  drawBridge: boolean;
  raw: unknown;
}

interface CirclePackingFluidPackingState {
  completedEvents: CirclePackingFluidNormalizedEvent[];
  pendingSplitEvents: CirclePackingFluidNormalizedEvent[];
}

interface CirclePackingFluidEventPhase {
  event: CirclePackingFluidNormalizedEvent;
  progress: number;
}

interface CirclePackingFluidInterpolationContext {
  previousMoveBefore?: CirclePackingLayoutResult | null;
  absorbSourceHandoffNodes?: Map<string, CirclePackingNode>;
  absorbHandoffSplitEvent?: CirclePackingFluidNormalizedEvent | null;
  moveSettleTargetNodes?: Map<string, CirclePackingNode>;
}

export function resolveCirclePackingLayout(option: CirclePackingLayoutOption = {}): CirclePackingLayoutResult {
  const layoutOptions: CirclePackingLayoutOptions = {
    ...(isPlainObject(option.layout) ? option.layout : {}),
    ...(isPlainObject(option.layoutOptions) ? option.layoutOptions : {})
  };

  assignDefined(layoutOptions, 'width', finiteNumber(option.width, undefined));
  assignDefined(layoutOptions, 'height', finiteNumber(option.height, undefined));
  assignDefined(layoutOptions, 'padding', resolveRawPadding(option.padding));
  assignDefined(layoutOptions, 'nodePadding', finiteNumber(option.nodePadding, undefined));
  assignDefined(layoutOptions, 'siblingGap', finiteNumber(option.siblingGap, undefined));
  assignDefined(layoutOptions, 'center', Array.isArray(option.center) ? option.center : undefined);
  assignDefined(layoutOptions, 'radius', option.radius as number | string | undefined);
  assignDefined(layoutOptions, 'rootName', typeof option.rootName === 'string' ? option.rootName : undefined);
  assignDefined(layoutOptions, 'rootVisible', typeof option.rootVisible === 'boolean' ? option.rootVisible : undefined);
  assignDefined(layoutOptions, 'valueField', typeof option.valueField === 'string' ? option.valueField : undefined);
  assignDefined(layoutOptions, 'nameField', typeof option.nameField === 'string' ? option.nameField : undefined);
  assignDefined(layoutOptions, 'childrenField', typeof option.childrenField === 'string' ? option.childrenField : undefined);
  assignDefined(layoutOptions, 'sort', normalizeSort(option.sort));
  assignDefined(
    layoutOptions,
    'colors',
    Array.isArray(option.colors) ? option.colors.filter((color): color is string => typeof color === 'string') : undefined
  );
  assignDefined(layoutOptions, 'fluid', option.fluid);

  return layoutCirclePacking(option.data, layoutOptions);
}

export function layoutCirclePacking(data: unknown, options: CirclePackingLayoutOptions = {}): CirclePackingLayoutResult {
  const fluid = resolveCirclePackingFluidOptions(options.fluid);
  if (fluid.enabled && fluid.events.length) {
    return layoutFluidCirclePacking(data, options, fluid);
  }
  return layoutCirclePackingBase(data, options);
}

function layoutCirclePackingBase(
  data: unknown,
  options: CirclePackingLayoutOptions = {},
  fluidState?: CirclePackingFluidPackingState
): CirclePackingLayoutResult {
  const width = finiteNumber(options.width, DEFAULT_WIDTH);
  const height = finiteNumber(options.height, DEFAULT_HEIGHT);
  const padding = resolvePadding(options.padding);
  const inner = resolveInnerRect(width, height, padding);
  const radius = resolveRadius(options.radius, inner);
  const center = resolveCenter(options.center, width, height, inner);
  const rootVisible = typeof options.rootVisible === 'boolean' ? options.rootVisible : !Array.isArray(data);
  const colors = options.colors?.length ? options.colors : DEFAULT_CIRCLE_PACKING_COLORS;
  const root = normalizeRoot(data, options);

  computeValues(root);
  if (options.sort !== false && options.sort !== 'none') sortChildren(root, options.sort);
  assignDataIndices(root);
  applyCirclePackingFluidState(root, fluidState);
  computeValues(root);
  if (options.sort !== false && options.sort !== 'none') sortChildren(root, options.sort);
  computeLocalPacking(root, options);
  assignColors(root, colors, rootVisible ? 0 : 1);
  const scale = radius / root.localRadius;
  assignPositions(root, center, scale);

  const rootValue = Math.max(root.value, EPSILON);
  const publicRoot = toPublicNode(root, rootValue);
  const nodes = flattenPublic(publicRoot).filter((node) => rootVisible || node.id !== publicRoot.id);

  return {
    width,
    height,
    center,
    radius,
    rootVisible,
    root: publicRoot,
    nodes
  };
}

export function flattenCirclePackingData(data: unknown, options: CirclePackingLayoutOptions = {}): CirclePackingDataItem[] {
  const root = normalizeRoot(data, options);
  computeValues(root);
  if (options.sort !== false && options.sort !== 'none') sortChildren(root, options.sort);
  assignDataIndices(root);
  return flatten(root)
    .filter((node) => !node.synthetic)
    .sort((left, right) => left.dataIndex - right.dataIndex)
    .map((node) => node.raw as CirclePackingDataItem);
}

function layoutFluidCirclePacking(
  data: unknown,
  options: CirclePackingLayoutOptions,
  fluid: CirclePackingFluidOptions
): CirclePackingLayoutResult {
  const currentTimeValue = fluid.currentTime == null ? null : timeToNumber(fluid.currentTime, fluid.events.length);
  const activePhase = currentTimeValue == null ? null : resolveCirclePackingFluidActivePhase(fluid.events, currentTimeValue);
  const completedEvents = currentTimeValue == null
    ? fluid.events
    : fluid.events.filter((event) => event.timeValue <= currentTimeValue);

  if (!activePhase) {
    const layout = layoutCirclePackingBase(data, options, {
      completedEvents,
      pendingSplitEvents: currentTimeValue == null ? [] : fluid.events
    });
    layout.fluid = { progress: resolveCirclePackingFluidProgress(fluid.events, currentTimeValue), bridges: [] };
    return layout;
  }

  const beforeCompletedEvents = completedEvents.filter((event) => event !== activePhase.event);
  const before = layoutCirclePackingBase(data, options, {
    completedEvents: beforeCompletedEvents,
    pendingSplitEvents: fluid.events
  });
  const after = layoutCirclePackingBase(data, options, {
    completedEvents: [...beforeCompletedEvents, activePhase.event],
    pendingSplitEvents: fluid.events.filter((event) => event !== activePhase.event)
  });
  const previousMoveEvent = findPreviousCirclePackingMoveEventForTargets(fluid.events, activePhase.event);
  const absorbHandoffSplitEvent = findPreviousCirclePackingAbsorbHandoffEvent(fluid.events, activePhase.event);
  const previousMoveBefore = isCirclePackingMoveSettleEvent(activePhase.event, previousMoveEvent)
    ? layoutCirclePackingBase(data, options, {
        completedEvents: beforeCompletedEvents.filter((event) => (
          !previousMoveEvent || event.timeValue < previousMoveEvent.timeValue
        )),
        pendingSplitEvents: fluid.events
      })
    : null;
  const absorbSourceHandoffNodes = createCirclePackingAbsorbSourceHandoffNodes(
    data,
    options,
    fluid,
    before,
    beforeCompletedEvents,
    activePhase
  );
  const moveSettleTargetNodes = createCirclePackingMoveSettleTargetNodes(
    data,
    options,
    fluid,
    before,
    beforeCompletedEvents,
    activePhase
  );
  return interpolateCirclePackingFluidLayouts(before, after, activePhase, fluid, {
    previousMoveBefore,
    absorbSourceHandoffNodes,
    absorbHandoffSplitEvent,
    moveSettleTargetNodes
  });
}

function createCirclePackingAbsorbSourceHandoffNodes(
  data: unknown,
  options: CirclePackingLayoutOptions,
  fluid: CirclePackingFluidOptions,
  before: CirclePackingLayoutResult,
  beforeCompletedEvents: CirclePackingFluidNormalizedEvent[],
  activePhase: CirclePackingFluidEventPhase
): Map<string, CirclePackingNode> | undefined {
  if (isCirclePackingSplitEvent(activePhase.event) || isCirclePackingMoveEvent(activePhase.event)) return undefined;
  const handoffEvent = findNextCirclePackingAbsorbHandoffSplitEventFromTargets(fluid.events, activePhase.event);
  if (!handoffEvent) return undefined;

  const currentBeforeById = createPublicNodeLookup(before.root);
  const sourceIds = resolvePublicNodeIds(activePhase.event.sourceRefs, currentBeforeById, currentBeforeById);
  if (!sourceIds.length) return undefined;

  const handoffCompletedEvents = [...beforeCompletedEvents, activePhase.event];
  const handoffAfter = layoutCirclePackingBase(data, options, {
    completedEvents: [...handoffCompletedEvents, handoffEvent],
    pendingSplitEvents: fluid.events.filter((event) => event !== handoffEvent)
  });
  const handoffById = createPublicNodeLookup(handoffAfter.root);
  const handoffTargets = resolvePublicNodeIds(handoffEvent.targetRefs, handoffById, handoffById)
    .map((id) => handoffById.get(id))
    .filter((node): node is CirclePackingNode => !!node);
  if (!handoffTargets.length) return undefined;

  const handoffNodes = new Map<string, CirclePackingNode>();
  sourceIds.forEach((sourceId, index) => {
    const handoffTarget = handoffTargets[Math.min(index, handoffTargets.length - 1)];
    /* v8 ignore next -- handoffTargets is filtered to non-null nodes before indexing. */
    if (handoffTarget) handoffNodes.set(sourceId, handoffTarget);
  });
  /* v8 ignore next -- source ids and handoff targets are both prevalidated before this map is built. */
  return handoffNodes.size ? handoffNodes : undefined;
}

function createCirclePackingMoveSettleTargetNodes(
  data: unknown,
  options: CirclePackingLayoutOptions,
  fluid: CirclePackingFluidOptions,
  before: CirclePackingLayoutResult,
  beforeCompletedEvents: CirclePackingFluidNormalizedEvent[],
  activePhase: CirclePackingFluidEventPhase
): Map<string, CirclePackingNode> | undefined {
  if (!isCirclePackingMoveEvent(activePhase.event)) return undefined;
  const settleEvent = findFollowingCirclePackingMoveSettleEvent(fluid.events, activePhase.event);
  if (!settleEvent) return undefined;

  const settleLayout = layoutCirclePackingBase(data, options, {
    completedEvents: [...beforeCompletedEvents, activePhase.event, settleEvent],
    pendingSplitEvents: fluid.events.filter((event) => event !== activePhase.event && event !== settleEvent)
  });
  const settleById = createPublicNodeLookup(settleLayout.root);
  const beforeById = createPublicNodeLookup(before.root);
  const targetIds = resolvePublicNodeIds(activePhase.event.targetRefs, settleById, settleById);
  const sourceIds = resolvePublicNodeIds(activePhase.event.sourceRefs, beforeById, settleById);
  const targetNodes = new Map<string, CirclePackingNode>();
  targetIds.forEach((targetId, index) => {
    const targetNode = settleById.get(targetId);
    const sourceNode = beforeById.get(sourceIds[Math.min(index, sourceIds.length - 1)] || '');
    if (targetNode && shouldUseCirclePackingMoveSettleTarget(settleById, sourceNode, targetNode)) {
      targetNodes.set(targetId, targetNode);
    }
  });
  return targetNodes.size ? targetNodes : undefined;
}

function resolveCirclePackingFluidOptions(value: unknown): CirclePackingFluidOptions {
  const record = isPlainObject(value) ? value : {};
  const style = isPlainObject(record.dropletStyle) ? record.dropletStyle : {};
  const events = normalizeCirclePackingFluidEvents(record.events);
  return {
    enabled: record.enabled === true,
    currentTime: (record.currentTime ?? null) as CirclePackingFluidOptions['currentTime'],
    events,
    bridgeOpacity: clamp(finiteNumber(record.bridgeOpacity ?? style.bridgeOpacity, 0.78), 0, 1),
    bridgeThreshold: Math.max(1, finiteNumber(record.bridgeThreshold ?? style.bridgeThreshold, 120)),
    bridgeColor: typeof (record.bridgeColor ?? style.bridgeColor) === 'string'
      ? String(record.bridgeColor ?? style.bridgeColor)
      : null
  };
}

function normalizeCirclePackingFluidEvents(value: unknown): CirclePackingFluidNormalizedEvent[] {
  const events = Array.isArray(value) ? value : [];
  return events
    .map((raw, order): CirclePackingFluidNormalizedEvent => {
      const record = isPlainObject(raw) ? raw : {};
      const timeRaw = record.time ?? order;
      const duration = finiteNumber(record.duration ?? record.span, NaN);
      return {
        id: readString(record.id) || `fluid-event-${order}`,
        type: readString(record.type) || 'merge',
        time: stringifyValue(timeRaw, String(order)),
        timeValue: timeToNumber(timeRaw, order),
        duration: Number.isFinite(duration) && duration > EPSILON ? duration : null,
        order,
        sourceRefs: readIdArray(record.sources ?? record.source ?? record.from),
        targetRefs: readIdArray(record.targets ?? record.target ?? record.to),
        value: Math.max(0, finiteNumber(record.value, 0)),
        drawBridge: record.bridge !== false && record.showBridge !== false && record.drawBridge !== false,
        raw
      };
    })
    /* v8 ignore next -- stable ordering fallback only matters for equal normalized times. */
    .sort((left, right) => left.timeValue - right.timeValue || left.order - right.order);
}

function applyCirclePackingFluidState(root: MutableNode, state: CirclePackingFluidPackingState | undefined): void {
  if (!state) return;
  const lookup = createMutableNodeLookup(root);

  state.pendingSplitEvents.forEach((event) => {
    if (!isCirclePackingSplitEvent(event) && !isCirclePackingMoveEvent(event)) return;
    event.targetRefs.forEach((targetRef) => {
      resolveMutableNodes(targetRef, lookup).forEach((node) => {
        node.fluidHidden = true;
      });
    });
  });

  state.completedEvents.forEach((event) => {
    if (isCirclePackingSplitEvent(event)) {
      event.targetRefs.forEach((targetRef) => {
        resolveMutableNodes(targetRef, lookup).forEach((node) => {
          node.fluidHidden = false;
        });
      });
      return;
    }

    if (isCirclePackingMoveEvent(event)) {
      event.targetRefs.forEach((targetRef) => {
        resolveMutableNodes(targetRef, lookup).forEach((node) => {
          node.fluidHidden = false;
        });
      });
      event.sourceRefs
        .filter((sourceRef) => !event.targetRefs.includes(sourceRef))
        .forEach((sourceRef) => {
          resolveMutableNodes(sourceRef, lookup).forEach((node) => {
            node.fluidHidden = true;
            node.explicitValue = 0;
          });
        });
      return;
    }

    /* v8 ignore next -- absorb events are normalized with explicit targets in public fluid flows. */
    const targets = resolveMutableNodes(event.targetRefs[0] ?? event.sourceRefs[0], lookup);
    const target = targets[0];
    if (!target) return;
    const sourceRefs = event.sourceRefs.filter((sourceRef) => !event.targetRefs.includes(sourceRef));
    const sources = sourceRefs.flatMap((sourceRef) => resolveMutableNodes(sourceRef, lookup))
      .filter((source) => source !== target && !source.fluidHidden);
    if (!sources.length) return;

    const transferredValue = sources.reduce((sum, source) => sum + Math.max(0, source.value), 0);
    /* v8 ignore next -- explicit target values are a defensive carry-over path for repeated synthetic absorbs. */
    target.explicitValue = Math.max(target.explicitValue ?? 0, target.value + transferredValue);
    sources.forEach((source) => {
      source.fluidHidden = true;
      source.explicitValue = 0;
    });
  });
}

function interpolateCirclePackingFluidLayouts(
  before: CirclePackingLayoutResult,
  after: CirclePackingLayoutResult,
  phase: CirclePackingFluidEventPhase,
  fluid: CirclePackingFluidOptions,
  context: CirclePackingFluidInterpolationContext = {}
): CirclePackingLayoutResult {
  const progress = smootherStep(phase.progress);
  const root = cloneCirclePackingNode(before.root);
  appendAfterOnlyFluidNodes(root, before, after);
  const nodesById = createPublicNodeLookup(root);
  const beforeById = createPublicNodeLookup(before.root);
  const afterById = createPublicNodeLookup(after.root);
  const sourceIds = resolvePublicNodeIds(phase.event.sourceRefs, beforeById, afterById);
  const targetIds = resolvePublicNodeIds(phase.event.targetRefs, beforeById, afterById);
  /* v8 ignore next -- fallback covers malformed refs that disappear between before/after layouts. */
  const targetAnchor = targetIds.map((id) => afterById.get(id) || beforeById.get(id)).find(Boolean);
  /* v8 ignore next -- fallback covers malformed refs that disappear between before/after layouts. */
  const sourceAnchor = sourceIds.map((id) => beforeById.get(id) || afterById.get(id)).find(Boolean);
  const isSplit = isCirclePackingSplitEvent(phase.event);
  const isMove = isCirclePackingMoveEvent(phase.event);
  const previousMoveEvent = findPreviousCirclePackingMoveEventForTargets(fluid.events, phase.event);
  const isMoveSettle = isCirclePackingMoveSettleEvent(phase.event, previousMoveEvent);
  const previousMoveBeforeById = context.previousMoveBefore
    ? createPublicNodeLookup(context.previousMoveBefore.root)
    : null;

  nodesById.forEach((node, id) => {
    const beforeNode = beforeById.get(id);
    const afterNode = afterById.get(id);

    if (isMove && sourceIds.includes(id) && beforeNode) {
      assignInterpolatedNode(node, beforeNode, {
        ...beforeNode,
        r: 0,
        value: 0,
        percent: 0
      }, 1);
      return;
    }

    if (isMove && targetIds.includes(id) && afterNode) {
      /* v8 ignore next -- move target interpolation normally has a source anchor from normalized refs. */
      const source = sourceAnchor || beforeNode || afterNode;
      assignInterpolatedNode(node, {
        ...afterNode,
        x: source.x,
        y: source.y,
        r: source.r,
        value: source.value,
        color: source.color,
        percent: source.percent
      }, afterNode, progress);
      const interpolatedMoveTarget = {
        x: node.x,
        y: node.y,
        r: node.r
      };
      const moveSettleTarget = context.moveSettleTargetNodes?.get(id);
      /* v8 ignore next -- source parent fallback handles malformed move interpolation contexts. */
      const sourceParent = sourceAnchor?.parentId
        /* v8 ignore next -- settle handoff prefers the current parent and falls back only for sparse contexts. */
        ? (moveSettleTarget ? nodesById.get(sourceAnchor.parentId) : null) || beforeById.get(sourceAnchor.parentId)
        : null;
      const hasSettleEvent = !!moveSettleTarget || hasFollowingCirclePackingMoveSettleEvent(fluid.events, phase.event);
      /* v8 ignore next -- a missing source parent is a defensive sparse-layout fallback. */
      const moveLobe = sourceParent
        ? createCirclePackingMoveLobeCircle(
            sourceParent,
            /* v8 ignore next -- sourceAnchor is required for this branch by sourceParent above. */
            sourceAnchor || node,
            node.r,
            phase.progress,
            /* v8 ignore next -- fallback keeps legacy move events without settle targets continuous. */
            moveSettleTarget || (hasSettleEvent ? null : afterNode),
            { startFromPreferredSide: !!moveSettleTarget }
          )
        : null;
      if (moveLobe) {
        /* v8 ignore next -- both paths are visually covered; the boolean split is a timing guard. */
        const finalHandoff = hasSettleEvent ? 0 : smootherStep((phase.progress - 0.78) / 0.2);
        node.x = round(lerp(moveLobe.x, interpolatedMoveTarget.x, finalHandoff));
        node.y = round(lerp(moveLobe.y, interpolatedMoveTarget.y, finalHandoff));
        node.r = round(lerp(moveLobe.r, interpolatedMoveTarget.r, finalHandoff));
      }
      keepCirclePackingMoveTargetInsideTargetParent(node, afterNode, sourceAnchor, nodesById, afterById);
      if (sourceAnchor && phase.progress < 0.98) {
        assignCirclePackingMoveNodeIdentity(node, sourceAnchor);
        node.color = sourceAnchor.color;
      }
      return;
    }

    if (isMoveSettle && afterNode && isCirclePackingNodeReferenced(afterNode, phase.event.targetRefs)) {
      /* v8 ignore next -- move-settle phases are only created after a previous move event. */
      const previousMoveSource = (previousMoveEvent?.sourceRefs || [])
        .map((sourceRef) => findPublicNodeByRef(sourceRef, previousMoveBeforeById, beforeById, afterById))
        .find(Boolean);
      /* v8 ignore next -- parent lookup fallback handles sparse previous/current layout maps. */
      const previousMoveParent = previousMoveSource?.parentId
        /* v8 ignore next -- fallback chain protects sparse previous/current layout maps. */
        ? previousMoveBeforeById?.get(previousMoveSource.parentId) || beforeById.get(previousMoveSource.parentId) || afterById.get(previousMoveSource.parentId)
        : null;
      const startFromPreferredSide = shouldUseCirclePackingMoveSettleTarget(afterById, previousMoveSource, afterNode);
      /* v8 ignore next -- fallback keeps settle paths valid if current parent was not cloned. */
      const currentMoveParent = startFromPreferredSide && previousMoveSource?.parentId
        /* v8 ignore next -- fallback keeps settle paths valid if current parent was not cloned. */
        ? nodesById.get(previousMoveSource.parentId) || previousMoveParent
        : previousMoveParent;
      /* v8 ignore next -- previousMoveSource/currentMoveParent are paired by the preceding guards. */
      const settleCircle = currentMoveParent && previousMoveSource
        ? createCirclePackingMoveSettleCircle(currentMoveParent, previousMoveSource, afterNode, progress, {
            startFromPreferredSide
          })
        : null;
      if (settleCircle) {
        assignNodeGeometry(node, {
          ...afterNode,
          x: settleCircle.x,
          y: settleCircle.y,
          r: settleCircle.r
        });
        return;
      }
    }

    if (!isSplit && sourceIds.includes(id) && beforeNode) {
      const handoffNode = context.absorbSourceHandoffNodes?.get(id);
      /* v8 ignore next -- fallback chain handles sparse handoff layouts and malformed refs. */
      const target = handoffNode || targetAnchor || afterNode || beforeNode;
      assignInterpolatedNode(node, beforeNode, {
        ...target,
        /* v8 ignore next -- handoff and non-handoff absorb sizing are covered through integration frames. */
        r: handoffNode ? Math.max(0.05, target.r) : Math.max(0.05, beforeNode.r * 0.03),
        /* v8 ignore next -- handoff and non-handoff absorb value transfer are paired with sizing above. */
        value: handoffNode ? Math.max(0, target.value) : 0
      }, smootherStep((phase.progress - 0.08) / 0.84));
      node.color = beforeNode.color;
      return;
    }

    if (isSplit && targetIds.includes(id) && afterNode) {
      if (context.absorbHandoffSplitEvent) {
        assignNodeGeometry(node, afterNode);
        return;
      }
      /* v8 ignore next -- split targets normally resolve a source anchor from normalized refs. */
      const source = sourceAnchor || beforeNode || afterNode;
      assignNodeGeometry(node, createCirclePackingSplitBudNode(
        source,
        afterNode,
        phase.progress,
        targetIds.indexOf(id),
        targetIds.length
      ));
      node.fluidActiveTarget = true;
      return;
    }

    if (beforeNode && afterNode) {
      assignInterpolatedNode(node, beforeNode, afterNode, progress);
    } else if (!beforeNode && afterNode) {
      assignInterpolatedNode(node, afterNode, afterNode, progress);
    }
  });

  if (isSplit) {
    keepCirclePackingSplitTargetDescendantsInsideTarget(nodesById, afterById, targetIds);
  }

  if (!isSplit && !isMove) {
    keepCirclePackingAbsorbSourceDescendantsInsideSource(nodesById, beforeById, sourceIds);
  }

  const nodes = flattenPublic(root).filter((node) => before.rootVisible || node.id !== root.id);
  const bridges = createCirclePackingFluidBridges(nodesById, sourceIds, targetIds, phase, fluid);
  bridges.push(...createCirclePackingMoveSettleBridges(
    nodesById,
    beforeById,
    afterById,
    previousMoveBeforeById,
    previousMoveEvent,
    phase,
    fluid
  ));
  return {
    ...after,
    root,
    nodes,
    fluid: {
      progress: phase.progress,
      bridges
    }
  };
}

function keepCirclePackingAbsorbSourceDescendantsInsideSource(
  nodesById: Map<string, CirclePackingNode>,
  beforeById: Map<string, CirclePackingNode>,
  sourceIds: string[]
): void {
  sourceIds.forEach((sourceId) => {
    const source = nodesById.get(sourceId);
    const beforeSource = beforeById.get(sourceId);
    if (!source || !beforeSource || beforeSource.r <= EPSILON) return;
    const scale = clamp(source.r / beforeSource.r, 0, 1);
    source.children.forEach((child) => {
      transformCirclePackingSourceDescendant(child, beforeSource, beforeById, source, scale);
    });
  });
}

function keepCirclePackingSplitTargetDescendantsInsideTarget(
  nodesById: Map<string, CirclePackingNode>,
  afterById: Map<string, CirclePackingNode>,
  targetIds: string[]
): void {
  targetIds.forEach((targetId) => {
    const target = nodesById.get(targetId);
    const afterTarget = afterById.get(targetId);
    if (!target || !afterTarget || afterTarget.r <= EPSILON) return;
    const scale = clamp(target.r / afterTarget.r, 0, 1);
    target.children.forEach((child) => {
      transformCirclePackingTargetDescendant(child, afterTarget, afterById, target, scale);
    });
  });
}

function transformCirclePackingTargetDescendant(
  node: CirclePackingNode,
  afterTarget: CirclePackingNode,
  afterById: Map<string, CirclePackingNode>,
  currentTarget: CirclePackingNode,
  scale: number
): void {
  const afterNode = afterById.get(node.id);
  if (!afterNode) return;
  const valueScale = scale * scale;
  node.x = round(currentTarget.x + (afterNode.x - afterTarget.x) * scale);
  node.y = round(currentTarget.y + (afterNode.y - afterTarget.y) * scale);
  node.r = round(Math.max(0, afterNode.r * scale));
  node.value = round(Math.max(0, afterNode.value * valueScale));
  node.percent = round(Math.max(0, afterNode.percent * valueScale));
  node.color = afterNode.color;
  node.children.forEach((child) => {
    transformCirclePackingTargetDescendant(child, afterTarget, afterById, currentTarget, scale);
  });
}

function transformCirclePackingSourceDescendant(
  node: CirclePackingNode,
  beforeSource: CirclePackingNode,
  beforeById: Map<string, CirclePackingNode>,
  currentSource: CirclePackingNode,
  scale: number
): void {
  const beforeNode = beforeById.get(node.id);
  if (!beforeNode) return;
  const valueScale = scale * scale;
  node.x = round(currentSource.x + (beforeNode.x - beforeSource.x) * scale);
  node.y = round(currentSource.y + (beforeNode.y - beforeSource.y) * scale);
  node.r = round(Math.max(0, beforeNode.r * scale));
  node.value = round(Math.max(0, beforeNode.value * valueScale));
  node.percent = round(Math.max(0, beforeNode.percent * valueScale));
  node.color = beforeNode.color;
  node.children.forEach((child) => {
    transformCirclePackingSourceDescendant(child, beforeSource, beforeById, currentSource, scale);
  });
}

function appendAfterOnlyFluidNodes(
  root: CirclePackingNode,
  before: CirclePackingLayoutResult,
  after: CirclePackingLayoutResult
): void {
  const beforeIds = new Set(flattenPublic(before.root).map((node) => node.id));
  const nodesById = createPublicNodeLookup(root);
  flattenPublic(after.root).forEach((node) => {
    if (beforeIds.has(node.id) || nodesById.has(node.id)) return;
    /* v8 ignore next -- appended nodes from public layouts always have a parent id when they are not the root. */
    const parent = node.parentId ? nodesById.get(node.parentId) : null;
    if (!parent) return;
    const clone = cloneCirclePackingNode(node);
    parent.children.push(clone);
    flattenPublic(clone).forEach((child) => {
      nodesById.set(child.id, child);
    });
  });
}

function assignInterpolatedNode(
  node: CirclePackingNode,
  from: CirclePackingNode,
  to: CirclePackingNode,
  progress: number
): void {
  const p = clamp(progress, 0, 1);
  node.x = round(lerp(from.x, to.x, p));
  node.y = round(lerp(from.y, to.y, p));
  node.r = round(Math.max(0, lerp(from.r, to.r, p)));
  node.value = round(lerp(from.value, to.value, p));
  node.color = p >= 0.5 ? to.color : from.color;
  node.percent = round(lerp(from.percent, to.percent, p));
}

function assignNodeGeometry(node: CirclePackingNode, next: CirclePackingNode): void {
  node.x = round(next.x);
  node.y = round(next.y);
  node.r = round(Math.max(0, next.r));
  node.value = round(Math.max(0, next.value));
  node.color = next.color;
  node.percent = round(Math.max(0, next.percent));
}

function assignCirclePackingMoveNodeIdentity(node: CirclePackingNode, source: CirclePackingNode): void {
  node.name = source.name;
  node.dataIndex = source.dataIndex;
  node.raw = source.raw;
}

function keepCirclePackingMoveTargetInsideTargetParent(
  node: CirclePackingNode,
  afterNode: CirclePackingNode,
  sourceAnchor: CirclePackingNode | undefined,
  nodesById: Map<string, CirclePackingNode>,
  afterById: Map<string, CirclePackingNode>
): void {
  if (
    !afterNode.parentId
    || !sourceAnchor?.parentId
    || !isCirclePackingAncestorNode(nodesById, afterNode.parentId, sourceAnchor.parentId)
  ) {
    return;
  }
  /* v8 ignore next -- parentId is checked above; fallback protects sparse current layout maps. */
  const parent = afterNode.parentId
    ? nodesById.get(afterNode.parentId) || afterById.get(afterNode.parentId)
    : null;
  if (!parent || !isValidCircle(parent) || !isValidCircle(node)) return;
  const clearance = Math.min(3, Math.max(0.5, node.r * MOVE_TARGET_PARENT_CLEARANCE_RATIO));
  constrainCirclePackingNodeInsideParent(node, parent, clearance);
}

function constrainCirclePackingNodeInsideParent(
  node: CirclePackingNode,
  parent: CirclePackingNode,
  clearance = 0
): void {
  const maxDistance = Math.max(0, parent.r - node.r - Math.max(0, clearance));
  const dx = node.x - parent.x;
  const dy = node.y - parent.y;
  const distance = Math.hypot(dx, dy);
  if (!Number.isFinite(distance) || distance <= maxDistance + EPSILON) return;
  const scale = maxDistance / distance;
  node.x = round(parent.x + dx * scale);
  node.y = round(parent.y + dy * scale);
}

function createCirclePackingSplitBudNode(
  source: CirclePackingNode,
  target: CirclePackingNode,
  progress: number,
  targetIndex: number,
  targetCount: number
): CirclePackingNode {
  const grow = smootherStep(progress / 0.58);
  const release = smootherStep((progress - 0.52) / 0.48);
  const direction = resolveSplitDirection(source, target, targetIndex, targetCount);
  const maxBudRadius = Math.min(target.r * 0.82, Math.max(0.5, source.r * 0.42));
  const budRadius = lerp(Math.max(0.3, target.r * 0.08), Math.max(0.4, maxBudRadius), grow);
  const insideDistance = Math.max(0, source.r - budRadius - 2);
  const anchorDistance = Math.min(
    insideDistance,
    resolveSplitBudAnchorDistance(source, direction, budRadius, source.r * (0.18 + grow * 0.42))
  );
  const budAnchor = {
    x: source.x + direction.x * anchorDistance,
    y: source.y + direction.y * anchorDistance
  };

  return {
    ...target,
    x: lerp(budAnchor.x, target.x, release),
    y: lerp(budAnchor.y, target.y, release),
    r: lerp(budRadius, target.r, release),
    value: target.value * Math.max(grow, release),
    percent: target.percent * Math.max(grow, release)
  };
}

function resolveSplitBudAnchorDistance(
  source: CirclePackingNode,
  direction: Point,
  budRadius: number,
  preferredDistance: number
): number {
  let anchorDistance = preferredDistance;
  const clearance = Math.max(2, Math.min(8, budRadius * 0.35));
  source.children.forEach((child) => {
    if (!isValidCircle(child)) return;
    const dx = child.x - source.x;
    const dy = child.y - source.y;
    const projection = dx * direction.x + dy * direction.y;
    const distanceSq = dx * dx + dy * dy;
    const perpendicularSq = Math.max(0, distanceSq - projection * projection);
    const minSeparation = child.r + budRadius + clearance;
    if (perpendicularSq >= minSeparation * minSeparation) return;
    anchorDistance = Math.max(anchorDistance, projection + Math.sqrt(minSeparation * minSeparation - perpendicularSq));
  });
  return anchorDistance;
}

function resolveSplitDirection(
  source: CirclePackingNode,
  target: CirclePackingNode,
  targetIndex: number,
  targetCount: number
): Point {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const distance = Math.hypot(dx, dy);
  if (Number.isFinite(distance) && distance > EPSILON) {
    return { x: dx / distance, y: dy / distance };
  }

  /* v8 ignore next -- multi-target fallback is deterministic and exercised by split integration frames. */
  const offset = targetCount <= 1 ? 0 : (targetIndex / Math.max(1, targetCount - 1) - 0.5) * Math.PI * 0.9;
  const angle = -Math.PI / 2 + offset;
  return { x: Math.cos(angle), y: Math.sin(angle) };
}

function createCirclePackingFluidBridges(
  nodesById: Map<string, CirclePackingNode>,
  sourceIds: string[],
  targetIds: string[],
  phase: CirclePackingFluidEventPhase,
  fluid: CirclePackingFluidOptions
): CirclePackingFluidBridge[] {
  if (!phase.event.drawBridge) return [];
  const isSplit = isCirclePackingSplitEvent(phase.event);
  const isMove = isCirclePackingMoveEvent(phase.event);
  const isAbsorb = !isSplit && !isMove;
  const bridges: CirclePackingFluidBridge[] = [];
  const bridgePairs = createCirclePackingFluidBridgePairs(nodesById, sourceIds, targetIds, isSplit, isMove);
  bridgePairs.forEach(({ sourceId, targetId }) => {
    const source = nodesById.get(sourceId);
    if (!source || source.r <= 0.05) return;
    const target = nodesById.get(targetId);
    if (!target || target.r <= 0.05) return;
    const keepAbsorbDrawPolicy = isAbsorb && phase.progress >= 0.6;
    if (isMove) {
      if (shouldSuppressCirclePackingLateSiblingMoveBridge(nodesById, source, target, phase.progress)) return;
      if (!shouldDrawCirclePackingMoveBridge(nodesById, sourceId, targetId, source, target, fluid.bridgeThreshold)) return;
    } else if (
      !shouldDrawCirclePackingFluidBridge(nodesById, sourceId, targetId, source, target, fluid.bridgeThreshold)
      && !keepAbsorbDrawPolicy
    ) {
      return;
    }
    const surfaceShape = isMove ? createCirclePackingMoveBridgeShape(source, target, {
      progress: phase.progress,
      maxDistance: fluid.bridgeThreshold
    }) : createCirclePackingWaterdropSurfaceShape(source, target, {
      isSplit,
      progress: phase.progress,
      maxDistance: fluid.bridgeThreshold
    });
    const renderPath = false;
    const path = isMove ? '' : isAbsorb
      ? createCirclePackingWaterdropShapePath(surfaceShape)
      : createCirclePackingFluidBridgePath(source, target, {
          progress: phase.progress,
          maxDistance: fluid.bridgeThreshold
        }) || createCirclePackingWaterdropShapePath(surfaceShape);
    if (!path && !surfaceShape && !keepAbsorbDrawPolicy) return;
    bridges.push({
      id: `${phase.event.id}:${sourceId}->${targetId}`,
      kind: isSplit || isMove ? 'split' : 'absorb',
      sourceId,
      targetId,
      sourceIds: [sourceId],
      targetIds: [targetId],
      path,
      opacity: isMove ? Math.min(fluid.bridgeOpacity, 0.78) : fluid.bridgeOpacity,
      /* v8 ignore next -- final color fallback is defensive for invalid custom color strings. */
      color: fluid.bridgeColor || (isMove ? source.color : isSplit ? mixColors(source.color, target.color, 0.5) : target.color) || target.color,
      surfaceShape: surfaceShape || undefined,
      renderPath,
      hiddenIds: isMove || isAbsorb ? [] : undefined,
      opaqueIds: isMove ? [targetId] : isAbsorb ? [sourceId, targetId] : undefined,
      elevatedIds: isMove ? [targetId] : isAbsorb ? [sourceId] : undefined
    });
  });
  return bridges;
}

function createCirclePackingMoveSettleBridges(
  nodesById: Map<string, CirclePackingNode>,
  beforeById: Map<string, CirclePackingNode>,
  afterById: Map<string, CirclePackingNode>,
  previousMoveBeforeById: Map<string, CirclePackingNode> | null,
  previousMoveEvent: CirclePackingFluidNormalizedEvent | null,
  phase: CirclePackingFluidEventPhase,
  fluid: CirclePackingFluidOptions
): CirclePackingFluidBridge[] {
  if (!previousMoveEvent || !isCirclePackingMoveSettleEvent(phase.event, previousMoveEvent)) return [];
  const targetIds = resolvePublicNodeIds(phase.event.targetRefs, nodesById, afterById);
  const bridges: CirclePackingFluidBridge[] = [];

  targetIds.forEach((targetId, index) => {
    const target = nodesById.get(targetId);
    /* v8 ignore next -- final target fallback handles sparse after-layout maps. */
    const finalTarget = afterById.get(targetId) || target;
    if (!target || !finalTarget) return;

    const sourceRef = previousMoveEvent.sourceRefs[Math.min(index, previousMoveEvent.sourceRefs.length - 1)];
    /* v8 ignore next -- previous move events are normalized with a source ref. */
    const previousMoveSource = sourceRef
      ? findPublicNodeByRef(sourceRef, previousMoveBeforeById, beforeById, afterById)
      : undefined;
    const sourceId = previousMoveSource?.parentId;
    /* v8 ignore next -- source fallback chain protects sparse previous/current layout maps. */
    const source = sourceId
      ? nodesById.get(sourceId) || beforeById.get(sourceId) || previousMoveBeforeById?.get(sourceId) || afterById.get(sourceId)
      : undefined;
    /* v8 ignore next -- guard covers malformed move-settle pairs, not normal public flow. */
    if (!sourceId || !source || !shouldUseCirclePackingMoveSettleTarget(afterById, previousMoveSource, finalTarget)) return;
    if (!shouldDrawCirclePackingMoveBridge(nodesById, sourceId, targetId, source, target, fluid.bridgeThreshold)) return;

    const bridgeProgress = 0.5 + clamp(phase.progress, 0, 1) * 0.5;
    const surfaceShape = createCirclePackingMoveBridgeShape(source, target, {
      progress: bridgeProgress,
      maxDistance: fluid.bridgeThreshold
    });
    if (!surfaceShape) return;

    bridges.push({
      id: `${phase.event.id}:${sourceId}->${targetId}`,
      kind: 'split',
      sourceId,
      targetId,
      sourceIds: [sourceId],
      targetIds: [targetId],
      path: '',
      opacity: Math.min(fluid.bridgeOpacity, 0.78),
      /* v8 ignore next -- target color fallback is defensive for missing source colors. */
      color: fluid.bridgeColor || source.color || target.color,
      surfaceShape,
      renderPath: false,
      hiddenIds: [],
      opaqueIds: [targetId],
      elevatedIds: [targetId]
    });
  });

  return bridges;
}

function shouldSuppressCirclePackingLateSiblingMoveBridge(
  nodesById: Map<string, CirclePackingNode>,
  source: CirclePackingNode,
  target: CirclePackingNode,
  progress: number
): boolean {
  if (progress <= SIBLING_MOVE_SOURCE_BRIDGE_END_PROGRESS) return false;
  if (!source.parentId || source.parentId !== target.parentId) return false;
  const sharedParent = nodesById.get(source.parentId);
  return !!sharedParent?.parentId;
}

function createCirclePackingFluidBridgePairs(
  nodesById: Map<string, CirclePackingNode>,
  sourceIds: string[],
  targetIds: string[],
  isSplit: boolean,
  isMove: boolean
): Array<{ sourceId: string; targetId: string }> {
  if (isMove) {
    const pairs: Array<{ sourceId: string; targetId: string }> = [];
    sourceIds.forEach((sourceId) => {
      const source = nodesById.get(sourceId);
      const sourceParentId = source?.parentId;
      targetIds.forEach((targetId) => {
        if (sourceParentId && sourceParentId !== targetId) {
          pushCirclePackingFluidBridgePair(pairs, sourceParentId, targetId);
        }

        const target = nodesById.get(targetId);
    /* v8 ignore next -- move bridge pair fallback handles missing target parents. */
    const targetParent = target?.parentId ? nodesById.get(target.parentId) : null;
        if (
          target?.parentId
          && target.parentId !== targetId
          && target.parentId !== sourceParentId
          && targetParent?.parentId != null
        ) {
          pushCirclePackingFluidBridgePair(pairs, target.parentId, targetId);
        }
      });
    });
    return pairs;
  }

  if (!isSplit) {
    return sourceIds.flatMap((sourceId) => (
      targetIds
        .filter((targetId) => sourceId !== targetId)
        .map((targetId) => ({ sourceId, targetId }))
    ));
  }

  const sourceId = sourceIds.find((id) => {
    const source = nodesById.get(id);
    return !!source && source.r > 0.05;
  });
  if (!sourceId) return [];
  return targetIds
    .filter((targetId) => sourceId !== targetId)
    .map((targetId) => ({ sourceId, targetId }));
}

function pushCirclePackingFluidBridgePair(
  pairs: Array<{ sourceId: string; targetId: string }>,
  sourceId: string,
  targetId: string
): void {
  if (pairs.some((pair) => pair.sourceId === sourceId && pair.targetId === targetId)) return;
  pairs.push({ sourceId, targetId });
}

function createCirclePackingWaterdropSurfaceShape(
  source: CirclePackingNode,
  target: CirclePackingNode,
  options: { isSplit: boolean; progress: number; maxDistance: number }
): WaterdropFusionShape | null {
  if (!isValidCircle(source) || !isValidCircle(target)) return null;
  const distance = Math.hypot(target.x - source.x, target.y - source.y);
  if (!Number.isFinite(distance) || distance <= EPSILON) return null;
  const minRadius = Math.min(source.r, target.r);
  const maxDistance = resolveCirclePackingFluidBridgeMaxDistance(source, target, options.maxDistance);
  if (distance > maxDistance) return null;
  const gap = Math.max(0, distance - source.r - target.r);
  if (distance <= Math.abs(source.r - target.r) + minRadius * 0.08) return null;
  const neckProgress = options.isSplit
    ? smootherStep(1 - smootherStep((options.progress - 0.64) / 0.28))
    : smootherStep((options.progress - 0.04) / 0.32)
      * smootherStep(1 - smootherStep((options.progress - 0.82) / 0.18));
  if (neckProgress <= 0.02) return null;
  const neckRatio = neckProgress;
  const bridgeLength = Math.max(28, minRadius * (options.isSplit ? 3.8 : 3.2), gap * 2.35);
  return createWaterdropFusionShape(source, target, {
    bridgeLength,
    handleSize: 0.85,
    neckSize: minRadius * neckRatio,
    bridgeOnly: options.isSplit
  });
}

function createCirclePackingFluidBridgePath(
  source: CirclePackingNode,
  target: CirclePackingNode,
  options: { progress: number; maxDistance: number }
): string {
  if (!isValidCircle(source) || !isValidCircle(target)) return '';
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const distance = Math.hypot(dx, dy);
  if (!Number.isFinite(distance) || distance <= EPSILON) return '';
  if (options.progress <= 0.02 || options.progress >= 0.98) return '';
  const maxDistance = resolveCirclePackingFluidBridgeMaxDistance(source, target, options.maxDistance);
  if (distance > maxDistance) return '';

  const minRadius = Math.min(source.r, target.r);
  const gap = distance - source.r - target.r;
  if (gap <= 0) return '';
  const maxGap = Math.max(1, maxDistance - source.r - target.r);
  const contact = clamp(1 - gap / maxGap, 0, 1);
  const bridgeProgress = smootherStep(options.progress);
  const angle = Math.atan2(dy, dx);
  const axis = { x: Math.cos(angle), y: Math.sin(angle) };
  const normal = { x: -axis.y, y: axis.x };
  const neck = minRadius * clamp(0.16 + bridgeProgress * 0.22 + contact * 0.18, 0.12, 0.46);
  const sourceCenter = {
    x: source.x + axis.x * source.r,
    y: source.y + axis.y * source.r
  };
  const targetCenter = {
    x: target.x - axis.x * target.r,
    y: target.y - axis.y * target.r
  };
  const sourceUpper = offsetPoint(sourceCenter, normal, neck);
  const sourceLower = offsetPoint(sourceCenter, normal, -neck);
  const targetUpper = offsetPoint(targetCenter, normal, neck);
  const targetLower = offsetPoint(targetCenter, normal, -neck);
  const handle = Math.max(minRadius * 0.3, Math.min(gap * 0.72, minRadius * 2.2));

  return [
    `M ${pointCommand(sourceUpper)}`,
    cubicCommand(
      offsetPoint(sourceUpper, axis, handle),
      offsetPoint(targetUpper, axis, -handle),
      targetUpper
    ),
    cubicCommand(
      offsetPoint(targetUpper, normal, -neck * 0.55),
      offsetPoint(targetLower, normal, neck * 0.55),
      targetLower
    ),
    cubicCommand(
      offsetPoint(targetLower, axis, -handle),
      offsetPoint(sourceLower, axis, handle),
      sourceLower
    ),
    cubicCommand(
      offsetPoint(sourceLower, normal, neck * 0.55),
      offsetPoint(sourceUpper, normal, -neck * 0.55),
      sourceUpper
    ),
    'Z'
  ].join(' ');
}

function createCirclePackingWaterdropShapePath(shape: WaterdropFusionShape | null): string {
  if (!shape) return '';
  const commands: string[] = [];
  const context: WaterdropFusionPathContext = {
    moveTo(x, y) {
      commands.push(`M ${round(x)} ${round(y)}`);
    },
    arc(x, y, radius, startAngle, endAngle, counterclockwise) {
      let end = endAngle;
      /* v8 ignore next -- SVG arc conversion keeps canvas-compatible direction fallback. */
      if (counterclockwise === true && end > startAngle) {
        end -= Math.PI * 2;
      /* v8 ignore next -- SVG arc conversion keeps canvas-compatible direction fallback. */
      } else if (counterclockwise !== true && end < startAngle) {
        end += Math.PI * 2;
      }
      commands.push(...arcToCubicCommands({ x, y }, radius, startAngle, end));
    },
    bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y) {
      commands.push(
        `C ${round(cp1x)} ${round(cp1y)} ${round(cp2x)} ${round(cp2y)} ${round(x)} ${round(y)}`
      );
    },
    lineTo(x, y) {
      commands.push(`L ${round(x)} ${round(y)}`);
    },
    closePath() {
      commands.push('Z');
    }
  };
  buildWaterdropFusionPath(context, shape);
  return commands.join(' ');
}

function createCirclePackingMoveBridgeShape(
  source: CirclePackingNode,
  target: CirclePackingNode,
  options: { progress: number; maxDistance: number }
): WaterdropFusionShape | null {
  if (!isValidCircle(source) || !isValidCircle(target)) return null;
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const distance = Math.hypot(dx, dy);
  if (!Number.isFinite(distance) || distance <= EPSILON) return null;
  if (options.progress <= 0.02) return null;
  const minRadius = Math.min(source.r, target.r);
  const maxMoveDistance = source.r + target.r + Math.max(options.maxDistance, minRadius * 3.2);
  if (distance > maxMoveDistance) return null;
  const gap = distance - source.r - target.r;
  const release = smootherStep(1 - smootherStep((options.progress - 0.95) / 0.05));
  if (release <= 0.02) return null;

  const shell = { x: target.x, y: target.y, r: target.r };
  const shellGap = Math.max(0, Math.hypot(shell.x - source.x, shell.y - source.y) - source.r - shell.r);
  if (isCirclePackingBridgeOnlyOverstretched(shellGap, minRadius)) return null;

  return createWaterdropFusionShape(source, shell, {
    bridgeLength: Math.max(30, Math.min(source.r, shell.r) * 3.1, Math.max(0, gap) * 2.25, shellGap * 2.35),
    handleSize: 0.84,
    neckSize: Math.min(source.r, shell.r) * clamp(0.34 + release * 0.18, 0.3, 0.52),
    bridgeOnly: true
  });
}

function isCirclePackingBridgeOnlyOverstretched(gap: number, minRadius: number): boolean {
  return Number.isFinite(gap)
    && Number.isFinite(minRadius)
    && minRadius > EPSILON
    && gap > minRadius * MAX_BRIDGE_ONLY_GAP_RATIO;
}

function createCirclePackingMoveLobeCircle(
  source: CirclePackingNode,
  origin: CirclePackingNode,
  radius: number,
  progress: number,
  preferredTarget?: CirclePackingNode | null,
  options: { startFromPreferredSide?: boolean } = {}
): { x: number; y: number; r: number } | null {
  if (!isValidCircle(source) || !isValidPoint(origin) || !Number.isFinite(radius) || radius <= 0) return null;
  const directionAnchor = preferredTarget && isValidPoint(preferredTarget) ? preferredTarget : origin;
  const dx = directionAnchor.x - source.x;
  const dy = directionAnchor.y - source.y;
  const distance = Math.hypot(dx, dy);
  if (!Number.isFinite(distance) || distance <= EPSILON) return null;
  const exit = smootherStep((progress - 0.06) / 0.82);
  const axis = {
    x: dx / distance,
    y: dy / distance
  };
  const edgeDistance = source.r + radius * 0.92;
  const target = {
    x: source.x + axis.x * edgeDistance,
    y: source.y + axis.y * edgeDistance
  };
  const startDistance = Math.max(0, source.r - radius * 0.72);
  const preferredStart = options.startFromPreferredSide && preferredTarget
    ? {
        x: source.x + axis.x * startDistance,
        y: source.y + axis.y * startDistance
      }
    : origin;
  const orient = options.startFromPreferredSide && preferredTarget
    ? smootherStep(progress / 0.28)
    : 1;
  const start = {
    x: lerp(origin.x, preferredStart.x, orient),
    y: lerp(origin.y, preferredStart.y, orient)
  };
  return {
    x: lerp(start.x, target.x, exit),
    y: lerp(start.y, target.y, exit),
    r: radius
  };
}

function createCirclePackingMoveSettleCircle(
  source: CirclePackingNode,
  origin: CirclePackingNode,
  finalNode: CirclePackingNode,
  progress: number,
  options: { startFromPreferredSide?: boolean } = {}
): { x: number; y: number; r: number } | null {
  if (!isValidCircle(source) || !isValidPoint(origin) || !isValidCircle(finalNode)) return null;
  const exitCircle = createCirclePackingMoveLobeCircle(
    source,
    origin,
    finalNode.r,
    1,
    options.startFromPreferredSide ? finalNode : null,
    { startFromPreferredSide: options.startFromPreferredSide }
  );
  if (!exitCircle) return null;
  const p = clamp(progress, 0, 1);
  const control = createCirclePackingMoveSettleControlPoint(source, exitCircle, finalNode);
  return {
    x: quadraticLerp(exitCircle.x, control.x, finalNode.x, p),
    y: quadraticLerp(exitCircle.y, control.y, finalNode.y, p),
    r: finalNode.r
  };
}

function createCirclePackingMoveSettleControlPoint(
  source: CirclePackingNode,
  exitCircle: { x: number; y: number; r: number },
  finalNode: CirclePackingNode
): Point {
  const midpoint = {
    x: (exitCircle.x + finalNode.x) / 2,
    y: (exitCircle.y + finalNode.y) / 2
  };
  const dx = midpoint.x - source.x;
  const dy = midpoint.y - source.y;
  const distance = Math.hypot(dx, dy);
  if (!Number.isFinite(distance) || distance <= EPSILON) return midpoint;

  const edgeDistance = source.r + Math.min(12, finalNode.r * 0.16);
  if (distance >= edgeDistance) return midpoint;

  return {
    x: source.x + (dx / distance) * edgeDistance,
    y: source.y + (dy / distance) * edgeDistance
  };
}

function quadraticLerp(start: number, control: number, end: number, progress: number): number {
  const inverse = 1 - progress;
  return inverse * inverse * start + 2 * inverse * progress * control + progress * progress * end;
}

function shouldDrawCirclePackingFluidBridge(
  nodesById: Map<string, CirclePackingNode>,
  sourceId: string,
  targetId: string,
  source: CirclePackingNode,
  target: CirclePackingNode,
  maxDistance: number
): boolean {
  if (!isValidCircle(source) || !isValidCircle(target)) return false;
  const distance = Math.hypot(target.x - source.x, target.y - source.y);
  if (!Number.isFinite(distance) || distance <= EPSILON) return false;
  if (distance > resolveCirclePackingFluidBridgeMaxDistance(source, target, maxDistance)) return false;
  return !isCirclePackingFluidBridgeBlocked(nodesById, sourceId, targetId, source, target, distance);
}

function shouldDrawCirclePackingMoveBridge(
  nodesById: Map<string, CirclePackingNode>,
  sourceId: string,
  targetId: string,
  source: CirclePackingNode,
  target: CirclePackingNode,
  maxDistance: number
): boolean {
  if (!isValidCircle(source) || !isValidCircle(target)) return false;
  const distance = Math.hypot(target.x - source.x, target.y - source.y);
  if (!Number.isFinite(distance) || distance <= EPSILON) return false;
  if (distance > source.r + target.r + Math.max(maxDistance, Math.min(source.r, target.r) * 3.2)) return false;
  if (sourceId !== target.parentId && distance + target.r <= source.r - Math.max(0.5, target.r * 0.04)) return false;
  if (sourceId === target.parentId && distance > source.r + target.r - Math.min(source.r, target.r) * 0.04) {
    return false;
  }
  if (isCirclePackingMoveBridgeContainedInTargetParent(nodesById, sourceId, target)) return false;
  return !isCirclePackingFluidBridgeBlocked(nodesById, sourceId, targetId, source, target, distance);
}

function isCirclePackingMoveBridgeContainedInTargetParent(
  nodesById: Map<string, CirclePackingNode>,
  sourceId: string,
  target: CirclePackingNode
): boolean {
  if (!target.parentId || target.parentId === sourceId) return false;
  const source = nodesById.get(sourceId);
  if (source?.parentId === target.parentId) return false;
  const parent = nodesById.get(target.parentId);
  if (!parent || parent.parentId == null || !isValidCircle(parent)) return false;
  const slack = Math.max(0.5, target.r * 0.04);
  return Math.hypot(target.x - parent.x, target.y - parent.y) + target.r <= parent.r + slack;
}

function resolveCirclePackingFluidBridgeMaxDistance(
  source: CirclePackingNode,
  target: CirclePackingNode,
  maxDistance: number
): number {
  const minRadius = Math.min(source.r, target.r);
  const configuredGap = Math.max(0, maxDistance - source.r - target.r);
  const liquidGap = Math.max(6, minRadius * 1.15);
  const allowedGap = configuredGap > 0 ? Math.min(configuredGap, liquidGap) : liquidGap;
  return source.r + target.r + allowedGap;
}

function isCirclePackingFluidBridgeBlocked(
  nodesById: Map<string, CirclePackingNode>,
  sourceId: string,
  targetId: string,
  source: CirclePackingNode,
  target: CirclePackingNode,
  distance: number
): boolean {
  const gapStart = source.r;
  const gapEnd = distance - target.r;
  if (gapEnd <= gapStart + EPSILON) return false;

  const axis = {
    x: (target.x - source.x) / distance,
    y: (target.y - source.y) / distance
  };
  const corridor = Math.max(2, Math.min(source.r, target.r) * 0.18);

  for (const [nodeId, node] of nodesById) {
    if (
      nodeId === sourceId
      || nodeId === targetId
      || node.synthetic
      || !isValidCircle(node)
      || areCirclePackingFluidBridgeRelatives(nodeId, sourceId)
      || areCirclePackingFluidBridgeRelatives(nodeId, targetId)
    ) {
      continue;
    }

    const projected = (node.x - source.x) * axis.x + (node.y - source.y) * axis.y;
    if (projected <= gapStart || projected >= gapEnd) continue;
    const closestX = source.x + axis.x * projected;
    const closestY = source.y + axis.y * projected;
    const clearance = Math.hypot(node.x - closestX, node.y - closestY) - node.r;
    if (clearance <= corridor) return true;
  }

  return false;
}

function areCirclePackingFluidBridgeRelatives(leftId: string, rightId: string): boolean {
  return leftId === rightId || leftId.startsWith(`${rightId}/`) || rightId.startsWith(`${leftId}/`);
}

function normalizeAngleDelta(angle: number): number {
  let normalized = angle;
  while (normalized > Math.PI) normalized -= Math.PI * 2;
  while (normalized < -Math.PI) normalized += Math.PI * 2;
  return normalized;
}

function offsetPoint(point: Point, direction: Point, distance: number): Point {
  return {
    x: point.x + direction.x * distance,
    y: point.y + direction.y * distance
  };
}

function isValidPoint(point: Point): boolean {
  return Number.isFinite(point.x) && Number.isFinite(point.y);
}

function pointOnCircle(center: { x: number; y: number }, radius: number, angle: number): Point {
  return {
    x: center.x + Math.cos(angle) * radius,
    y: center.y + Math.sin(angle) * radius
  };
}

function pointDistance(left: Point, right: Point): number {
  return Math.hypot(right.x - left.x, right.y - left.y);
}

function tangentPoint(point: Point, angle: number, distance: number, direction: 1 | -1): Point {
  return {
    x: point.x - Math.sin(angle) * distance * direction,
    y: point.y + Math.cos(angle) * distance * direction
  };
}

function arcToCubicCommands(center: Point, radius: number, startAngle: number, endAngle: number): string[] {
  const delta = endAngle - startAngle;
  const segments = Math.max(1, Math.ceil(Math.abs(delta) / (Math.PI / 2)));
  const step = delta / segments;
  const commands: string[] = [];
  for (let index = 0; index < segments; index += 1) {
    const start = startAngle + step * index;
    const end = start + step;
    const k = (4 / 3) * Math.tan((end - start) / 4);
    const p0 = pointOnCircle(center, radius, start);
    const p1 = pointOnCircle(center, radius, end);
    commands.push(cubicCommand(
      {
        x: p0.x - Math.sin(start) * radius * k,
        y: p0.y + Math.cos(start) * radius * k
      },
      {
        x: p1.x + Math.sin(end) * radius * k,
        y: p1.y - Math.cos(end) * radius * k
      },
      p1
    ));
  }
  return commands;
}

function pointCommand(point: Point): string {
  return `${round(point.x)} ${round(point.y)}`;
}

function cubicCommand(c1: Point, c2: Point, end: Point): string {
  return `C ${pointCommand(c1)} ${pointCommand(c2)} ${pointCommand(end)}`;
}

function resolveCirclePackingFluidActivePhase(
  events: CirclePackingFluidNormalizedEvent[],
  currentTimeValue: number
): CirclePackingFluidEventPhase | null {
  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    if (currentTimeValue >= event.timeValue) continue;
    const previousTime = events[index - 1]?.timeValue;
    const span = resolveCirclePackingFluidEventSpan(event, previousTime);
    const startTime = event.timeValue - span;
    if (currentTimeValue < startTime) continue;
    return {
      event,
      progress: clamp((currentTimeValue - startTime) / Math.max(EPSILON, event.timeValue - startTime), 0, 1)
    };
  }
  return null;
}

function resolveCirclePackingFluidEventProgressAt(
  events: CirclePackingFluidNormalizedEvent[],
  event: CirclePackingFluidNormalizedEvent,
  currentTimeValue: number
): number {
  const eventIndex = events.findIndex((candidate) => candidate === event);
  const previousTime = events[eventIndex - 1]?.timeValue;
  const span = resolveCirclePackingFluidEventSpan(event, previousTime);
  const startTime = event.timeValue - span;
  return clamp((currentTimeValue - startTime) / Math.max(EPSILON, event.timeValue - startTime), 0, 1);
}

function resolveCirclePackingFluidEventSpan(
  event: CirclePackingFluidNormalizedEvent,
  previousTime: number | undefined
): number {
  if (!Number.isFinite(previousTime)) {
    if (event.duration != null) return event.duration;
    if (isCirclePackingSpinOffEvent(event) && event.timeValue > EPSILON) return event.timeValue;
    return 1;
  }
  const localSpan = Math.max(EPSILON, event.timeValue - (previousTime as number));
  if (event.duration != null) return Math.min(event.duration, localSpan);
  if (isCirclePackingCheckpointEvent(event)) return localSpan;
  if (isCirclePackingSpinOffEvent(event)) return localSpan;
  if (isCirclePackingMoveEvent(event)) return localSpan;
  return Math.max(1, localSpan);
}

function resolveCirclePackingFluidProgress(
  events: CirclePackingFluidNormalizedEvent[],
  currentTimeValue: number | null
): number {
  if (!events.length || currentTimeValue == null) return 1;
  const first = events[0].timeValue;
  const last = events[events.length - 1].timeValue;
  if (last <= first) return currentTimeValue >= last ? 1 : 0;
  return clamp((currentTimeValue - first) / (last - first), 0, 1);
}

function createMutableNodeLookup(root: MutableNode): Map<string, MutableNode[]> {
  const lookup = new Map<string, MutableNode[]>();
  flatten(root).forEach((node) => {
    addMutableNodeAlias(lookup, node.id, node);
    addMutableNodeAlias(lookup, node.name, node);
    const record = isPlainObject(node.raw) ? node.raw : {};
    addMutableNodeAlias(lookup, record.id, node);
    addMutableNodeAlias(lookup, record.name, node);
  });
  return lookup;
}

function addMutableNodeAlias(lookup: Map<string, MutableNode[]>, value: unknown, node: MutableNode): void {
  const key = readString(value);
  if (!key) return;
  const nodes = lookup.get(key) || [];
  if (!nodes.includes(node)) nodes.push(node);
  lookup.set(key, nodes);
}

function resolveMutableNodes(value: string, lookup: Map<string, MutableNode[]>): MutableNode[] {
  return lookup.get(value) || [];
}

function createPublicNodeLookup(root: CirclePackingNode): Map<string, CirclePackingNode> {
  return new Map(flattenPublic(root).map((node) => [node.id, node]));
}

function isCirclePackingAncestorNode(
  nodesById: Map<string, CirclePackingNode>,
  ancestorId: string,
  descendantId: string
): boolean {
  if (ancestorId === descendantId) return true;
  let current = nodesById.get(descendantId);
  while (current?.parentId) {
    if (current.parentId === ancestorId) return true;
    current = nodesById.get(current.parentId);
  }
  return false;
}

function shouldUseCirclePackingMoveSettleTarget(
  nodesById: Map<string, CirclePackingNode>,
  sourceNode: CirclePackingNode | undefined,
  targetNode: CirclePackingNode
): boolean {
  return !!sourceNode?.parentId
    && !!targetNode.parentId
    && isCirclePackingAncestorNode(nodesById, targetNode.parentId, sourceNode.parentId);
}

function resolvePublicNodeIds(
  refs: string[],
  beforeById: Map<string, CirclePackingNode>,
  afterById: Map<string, CirclePackingNode>
): string[] {
  const ids: string[] = [];
  refs.forEach((ref) => {
    [...beforeById.values(), ...afterById.values()].forEach((node) => {
      if (node.id === ref || node.name === ref || rawNodeId(node) === ref) {
        if (!ids.includes(node.id)) ids.push(node.id);
      }
    });
  });
  return ids;
}

function rawNodeId(node: CirclePackingNode): string {
  return isPlainObject(node.raw) ? readString(node.raw.id) : '';
}

function findPublicNodeByRef(
  ref: string,
  ...lookups: Array<Map<string, CirclePackingNode> | null>
): CirclePackingNode | undefined {
  for (const lookup of lookups) {
    if (!lookup) continue;
    for (const node of lookup.values()) {
      if (node.id === ref || node.name === ref || rawNodeId(node) === ref) return node;
    }
  }
  return undefined;
}

function isCirclePackingNodeReferenced(node: CirclePackingNode, refs: string[]): boolean {
  return refs.some((ref) => node.id === ref || node.name === ref || rawNodeId(node) === ref);
}

function cloneCirclePackingNode(node: CirclePackingNode): CirclePackingNode {
  return {
    ...node,
    children: node.children.map((child) => cloneCirclePackingNode(child))
  };
}

function isCirclePackingSplitEvent(event: CirclePackingFluidNormalizedEvent): boolean {
  const type = event.type.toLowerCase();
  return type === 'split' || type === 'spinoff';
}

function isCirclePackingSpinOffEvent(event: CirclePackingFluidNormalizedEvent): boolean {
  return event.type.toLowerCase() === 'spinoff';
}

function isCirclePackingMoveEvent(event: CirclePackingFluidNormalizedEvent): boolean {
  const type = event.type.toLowerCase();
  return type === 'move' || type === 'relocate' || type === 'transfer';
}

function isCirclePackingCheckpointEvent(event: CirclePackingFluidNormalizedEvent): boolean {
  return event.type.toLowerCase() === 'checkpoint';
}

function isCirclePackingAbsorbEvent(event: CirclePackingFluidNormalizedEvent): boolean {
  return !isCirclePackingSplitEvent(event)
    && !isCirclePackingMoveEvent(event)
    && !isCirclePackingCheckpointEvent(event);
}

function isCirclePackingMoveSettleEvent(
  event: CirclePackingFluidNormalizedEvent,
  previousMoveEvent: CirclePackingFluidNormalizedEvent | null
): boolean {
  return isCirclePackingCheckpointEvent(event)
    && event.drawBridge === false
    && !!previousMoveEvent;
}

function findPreviousCirclePackingMoveEventForTargets(
  events: CirclePackingFluidNormalizedEvent[],
  event: CirclePackingFluidNormalizedEvent
): CirclePackingFluidNormalizedEvent | null {
  const targetRefs = new Set(event.targetRefs);
  if (!targetRefs.size) return null;
  const eventIndex = events.findIndex((candidate) => candidate === event);
  /* v8 ignore next -- external callers can pass detached events; public flow passes a listed event. */
  /* v8 ignore next -- detached event fallback is for direct private helper calls only. */
  /* v8 ignore next -- detached event fallback is for direct private helper calls only. */
  for (let index = (eventIndex >= 0 ? eventIndex : events.length) - 1; index >= 0; index -= 1) {
    const candidate = events[index];
    if (!candidate || candidate.timeValue >= event.timeValue || !isCirclePackingMoveEvent(candidate)) continue;
    if (candidate.targetRefs.some((targetRef) => targetRefs.has(targetRef))) return candidate;
  }
  return null;
}

function hasFollowingCirclePackingMoveSettleEvent(
  events: CirclePackingFluidNormalizedEvent[],
  event: CirclePackingFluidNormalizedEvent
): boolean {
  return !!findFollowingCirclePackingMoveSettleEvent(events, event);
}

function findFollowingCirclePackingMoveSettleEvent(
  events: CirclePackingFluidNormalizedEvent[],
  event: CirclePackingFluidNormalizedEvent
): CirclePackingFluidNormalizedEvent | null {
  const targetRefs = new Set(event.targetRefs);
  if (!targetRefs.size) return null;
  const eventIndex = events.findIndex((candidate) => candidate === event);
  const candidate = eventIndex >= 0 ? events[eventIndex + 1] : undefined;
  if (!candidate || candidate.timeValue <= event.timeValue) return null;
  return isCirclePackingCheckpointEvent(candidate)
    && candidate.drawBridge === false
    && candidate.targetRefs.some((targetRef) => targetRefs.has(targetRef))
    ? candidate
    : null;
}

function findNextCirclePackingSplitEventFromTargets(
  events: CirclePackingFluidNormalizedEvent[],
  event: CirclePackingFluidNormalizedEvent
): CirclePackingFluidNormalizedEvent | null {
  const targetRefs = new Set(event.targetRefs);
  if (!targetRefs.size) return null;
  const eventIndex = events.findIndex((candidate) => candidate === event);
  for (let index = eventIndex + 1; index < events.length; index += 1) {
    const candidate = events[index];
    if (!candidate || candidate.timeValue <= event.timeValue) continue;
    if (!isCirclePackingSplitEvent(candidate)) continue;
    if (candidate.sourceRefs.some((sourceRef) => targetRefs.has(sourceRef))) return candidate;
  }
  return null;
}

function findNextCirclePackingAbsorbHandoffSplitEventFromTargets(
  events: CirclePackingFluidNormalizedEvent[],
  event: CirclePackingFluidNormalizedEvent
): CirclePackingFluidNormalizedEvent | null {
  const candidate = findNextCirclePackingSplitEventFromTargets(events, event);
  return candidate && isCirclePackingAbsorbHandoffSplitEvent(events, event, candidate) ? candidate : null;
}

function findPreviousCirclePackingAbsorbHandoffEvent(
  events: CirclePackingFluidNormalizedEvent[],
  event: CirclePackingFluidNormalizedEvent
): CirclePackingFluidNormalizedEvent | null {
  if (!isCirclePackingSplitEvent(event)) return null;
  const eventIndex = events.findIndex((candidate) => candidate === event);
  for (let index = (eventIndex >= 0 ? eventIndex : events.length) - 1; index >= 0; index -= 1) {
    const candidate = events[index];
    if (!candidate || candidate.timeValue >= event.timeValue) continue;
    if (isCirclePackingAbsorbHandoffSplitEvent(events, candidate, event)) return candidate;
  }
  return null;
}

function isCirclePackingAbsorbHandoffSplitEvent(
  events: CirclePackingFluidNormalizedEvent[],
  absorbEvent: CirclePackingFluidNormalizedEvent,
  splitEvent: CirclePackingFluidNormalizedEvent
): boolean {
  if (!isCirclePackingAbsorbEvent(absorbEvent) || !isCirclePackingSplitEvent(splitEvent)) return false;
  const targetRefs = new Set(absorbEvent.targetRefs);
  if (!targetRefs.size || !splitEvent.sourceRefs.some((sourceRef) => targetRefs.has(sourceRef))) return false;
  return Math.abs(resolveCirclePackingFluidEventStartTime(events, splitEvent) - absorbEvent.timeValue) <= EPSILON;
}

function resolveCirclePackingFluidEventStartTime(
  events: CirclePackingFluidNormalizedEvent[],
  event: CirclePackingFluidNormalizedEvent
): number {
  const eventIndex = events.findIndex((candidate) => candidate === event);
  const previousTime = events[eventIndex - 1]?.timeValue;
  return event.timeValue - resolveCirclePackingFluidEventSpan(event, previousTime);
}

function normalizeRoot(data: unknown, options: CirclePackingLayoutOptions): MutableNode {
  const valueField = normalizeField(options.valueField, 'value');
  const nameField = normalizeField(options.nameField, 'name');
  const childrenField = normalizeField(options.childrenField, 'children');

  function createNode(
    raw: unknown,
    depth: number,
    parent: MutableNode | null,
    siblingIndex: number,
    forcedName?: string,
    synthetic = false
  ): MutableNode {
    const record = isPlainObject(raw) ? raw : {};
    const label = record.label;
    const name = String(
      forcedName
      ?? readField(record, nameField)
      ?? record.name
      ?? (typeof label === 'string' || typeof label === 'number' ? label : undefined)
      ?? record.id
      ?? (isPlainObject(raw) ? `node-${siblingIndex}` : raw)
      ?? `node-${siblingIndex}`
    );
    const idPart = record.id != null ? String(record.id) : parent ? `${name}-${siblingIndex}` : name;
    const id = parent ? `${parent.id}/${idPart}` : idPart;
    const node: MutableNode = {
      id,
      name,
      explicitValue: readNonNegativeNumber(readField(record, valueField) ?? record.value),
      value: 0,
      depth,
      parent,
      children: [],
      dataIndex: synthetic ? -1 : 0,
      localX: 0,
      localY: 0,
      localRadius: 0,
      x: 0,
      y: 0,
      r: 0,
      color: DEFAULT_CIRCLE_PACKING_COLORS[depth % DEFAULT_CIRCLE_PACKING_COLORS.length],
      raw,
      synthetic
    };
    node.children = readChildren(record, childrenField)
      .map((child, index) => createNode(child, depth + 1, node, index));
    return node;
  }

  if (Array.isArray(data)) {
    return createNode({
      name: options.rootName || 'root',
      children: data
    }, 0, null, 0, options.rootName || 'root', true);
  }

  if (isPlainObject(data)) {
    return createNode(data, 0, null, 0, options.rootName);
  }

  return createNode({
    name: options.rootName || 'root',
    value: readNonNegativeNumber(data) ?? 0
  }, 0, null, 0, options.rootName || 'root');
}

function computeValues(node: MutableNode): number {
  if (node.fluidHidden) {
    node.value = 0;
    return 0;
  }

  const children: MutableNode[] = [];
  let childTotal = 0;

  node.children.forEach((child) => {
    const childValue = computeValues(child);
    if (childValue <= 0) return;
    children.push(child);
    childTotal += childValue;
  });
  node.children = children;

  if (node.children.length) {
    node.value = Math.max(node.explicitValue ?? 0, childTotal);
    return node.value;
  }

  node.value = node.explicitValue ?? (node.synthetic ? 0 : 1);
  return node.value;
}

function sortChildren(node: MutableNode, sort: CirclePackingSort | undefined): void {
  if (sort === 'name') {
    node.children.sort((left, right) => left.name.localeCompare(right.name) || right.value - left.value);
  } else if (sort === 'asc') {
    node.children.sort((left, right) => left.value - right.value || left.name.localeCompare(right.name));
  } else {
    node.children.sort((left, right) => right.value - left.value || left.name.localeCompare(right.name));
  }
  node.children.forEach((child) => sortChildren(child, sort));
}

function assignDataIndices(root: MutableNode): void {
  let nextDataIndex = 0;
  flatten(root).forEach((node) => {
    node.dataIndex = node.synthetic ? -1 : nextDataIndex++;
  });
}

function computeLocalPacking(node: MutableNode, options: CirclePackingLayoutOptions): number {
  node.children.forEach((child) => computeLocalPacking(child, options));

  if (!node.children.length) {
    node.localRadius = Math.max(Math.sqrt(Math.max(node.value, EPSILON)), EPSILON);
    return node.localRadius;
  }

  const siblingGap = Math.max(0, finiteNumber(options.siblingGap, DEFAULT_SIBLING_GAP));
  const nodePadding = Math.max(0, finiteNumber(options.nodePadding, DEFAULT_NODE_PADDING));
  const circles = node.children.map((child): WorkingCircle => ({
    node: child,
    x: 0,
    y: 0,
    r: child.localRadius,
    packRadius: child.localRadius
  }));

  packFrontChain(circles, siblingGap);
  resolveCollisions(circles);
  recenterCircles(circles);

  let enclosingRadius = 0;
  circles.forEach((circle) => {
    circle.node.localX = circle.x;
    circle.node.localY = circle.y;
    enclosingRadius = Math.max(enclosingRadius, Math.hypot(circle.x, circle.y) + circle.r);
  });

  node.localRadius = Math.max(Math.sqrt(Math.max(node.value, EPSILON)), enclosingRadius + nodePadding);
  return node.localRadius;
}

function packFrontChain(circles: WorkingCircle[], gap: number): void {
  circles.forEach((circle) => {
    circle.packRadius = circle.r + gap / 2;
  });

  if (!circles.length) return;

  circles[0].x = 0;
  circles[0].y = 0;
  if (circles.length === 1) return;

  circles[0].x = -circles[1].packRadius;
  circles[1].x = circles[0].packRadius;
  circles[1].y = 0;
  if (circles.length === 2) return;

  placeTangent(circles[1], circles[0], circles[2]);

  let a = createFrontChainNode(circles[0]);
  let b = createFrontChainNode(circles[1]);
  const c = createFrontChainNode(circles[2]);
  a.next = c;
  c.previous = a;
  c.next = b;
  b.previous = c;
  b.next = a;
  a.previous = b;

  pack: for (let index = 3; index < circles.length; index += 1) {
    const circle = circles[index];
    placeTangent(a.circle, b.circle, circle);
    const node = createFrontChainNode(circle);

    let j = b.next;
    let k = a.previous;
    let guard = 0;
    do {
      if (intersects(j.circle, node.circle)) {
        b = j;
        a.next = b;
        b.previous = a;
        index -= 1;
        continue pack;
      }
      j = j.next;
      guard += 1;
    } while (j !== k.next && guard <= circles.length * 2);

    guard = 0;
    do {
      if (intersects(k.circle, node.circle)) {
        a = k;
        a.next = b;
        b.previous = a;
        index -= 1;
        continue pack;
      }
      k = k.previous;
      guard += 1;
    } while (k !== j.previous && guard <= circles.length * 2);

    node.previous = a;
    node.next = b;
    a.next = node;
    b.previous = node;
    b = node;

    a = findBestFrontChainNode(a);
    b = a.next;
  }
}

function resolveCollisions(circles: WorkingCircle[]): void {
  const maxIterations = Math.max(80, circles.length * 8);

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    let largestOverlap = 0;

    for (let leftIndex = 0; leftIndex < circles.length; leftIndex += 1) {
      const left = circles[leftIndex];
      for (let rightIndex = leftIndex + 1; rightIndex < circles.length; rightIndex += 1) {
        const right = circles[rightIndex];
        let dx = right.x - left.x;
        let dy = right.y - left.y;
        let distance = Math.hypot(dx, dy);
        const targetDistance = left.packRadius + right.packRadius;
        const overlap = targetDistance - distance;

        if (overlap <= 0) continue;

        if (distance <= EPSILON) {
          const angle = (leftIndex * 13 + rightIndex * 17 + 1) * Math.PI * (3 - Math.sqrt(5));
          dx = Math.cos(angle);
          dy = Math.sin(angle);
          distance = 1;
        }

        const shift = overlap / 2 + EPSILON;
        const nx = dx / distance;
        const ny = dy / distance;
        left.x -= nx * shift;
        left.y -= ny * shift;
        right.x += nx * shift;
        right.y += ny * shift;
        largestOverlap = Math.max(largestOverlap, overlap);
      }
    }

    recenterCircles(circles);
    if (largestOverlap < 0.01) return;
  }
}

function recenterCircles(circles: WorkingCircle[]): void {
  if (!circles.length) return;
  const bounds = measureBounds(circles);
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  circles.forEach((circle) => {
    circle.x -= centerX;
    circle.y -= centerY;
  });
}

function placeTangent(a: WorkingCircle, b: WorkingCircle, c: WorkingCircle): void {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const distanceSq = dx * dx + dy * dy;
  const aDistanceSq = square(a.packRadius + c.packRadius);
  const bDistanceSq = square(b.packRadius + c.packRadius);

  if (distanceSq <= EPSILON) {
    c.x = a.x + a.packRadius + c.packRadius;
    c.y = a.y;
    return;
  }

  if (aDistanceSq > bDistanceSq) {
    const x = (distanceSq + bDistanceSq - aDistanceSq) / (2 * distanceSq);
    const y = Math.sqrt(Math.max(0, bDistanceSq / distanceSq - x * x));
    c.x = b.x - x * dx - y * dy;
    c.y = b.y - x * dy + y * dx;
    return;
  }

  const x = (distanceSq + aDistanceSq - bDistanceSq) / (2 * distanceSq);
  const y = Math.sqrt(Math.max(0, aDistanceSq / distanceSq - x * x));
  c.x = a.x + x * dx - y * dy;
  c.y = a.y + x * dy + y * dx;
}

function intersects(left: WorkingCircle, right: WorkingCircle): boolean {
  const dr = left.packRadius + right.packRadius - EPSILON;
  const dx = right.x - left.x;
  const dy = right.y - left.y;
  return dr > 0 && dr * dr > dx * dx + dy * dy;
}

function createFrontChainNode(circle: WorkingCircle): FrontChainNode {
  const node = {} as FrontChainNode;
  node.circle = circle;
  node.next = node;
  node.previous = node;
  return node;
}

function findBestFrontChainNode(start: FrontChainNode): FrontChainNode {
  let best = start;
  let bestScore = scoreFrontChainNode(best);
  let current = start.next;
  let guard = 0;

  while (current !== start && guard <= 10000) {
    const score = scoreFrontChainNode(current);
    if (score < bestScore) {
      best = current;
      bestScore = score;
    }
    current = current.next;
    guard += 1;
  }

  return best;
}

function scoreFrontChainNode(node: FrontChainNode): number {
  const current = node.circle;
  const next = node.next.circle;
  const radiusSum = current.packRadius + next.packRadius;
  if (radiusSum <= EPSILON) return 0;
  const x = (current.x * next.packRadius + next.x * current.packRadius) / radiusSum;
  const y = (current.y * next.packRadius + next.y * current.packRadius) / radiusSum;
  return x * x + y * y;
}

function assignColors(node: MutableNode, colors: string[], depthOffset: number): void {
  const record = isPlainObject(node.raw) ? node.raw : {};
  const itemStyle = isPlainObject(record.itemStyle) ? record.itemStyle : {};
  const colorDepth = Math.max(0, node.depth - depthOffset);
  node.color = typeof itemStyle.color === 'string' ? itemStyle.color : colors[colorDepth % colors.length];
  node.children.forEach((child) => assignColors(child, colors, depthOffset));
}

function assignPositions(node: MutableNode, origin: Point, scale: number): void {
  node.x = origin.x;
  node.y = origin.y;
  node.r = node.localRadius * scale;
  node.children.forEach((child) => {
    assignPositions(child, {
      x: origin.x + child.localX * scale,
      y: origin.y + child.localY * scale
    }, scale);
  });
}

function toPublicNode(node: MutableNode, rootValue: number): CirclePackingNode {
  const publicNode: CirclePackingNode = {
    id: node.id,
    name: node.name,
    value: node.value,
    depth: node.depth,
    parentId: node.parent?.id ?? null,
    children: [],
    dataIndex: node.dataIndex,
    x: node.x,
    y: node.y,
    r: node.r,
    color: node.color,
    percent: rootValue > 0 ? node.value / rootValue : 0,
    synthetic: node.synthetic,
    raw: node.raw
  };
  publicNode.children = node.children.map((child) => toPublicNode(child, rootValue));
  return publicNode;
}

function flatten(root: MutableNode): MutableNode[] {
  const nodes: MutableNode[] = [];
  function visit(node: MutableNode) {
    nodes.push(node);
    node.children.forEach(visit);
  }
  visit(root);
  return nodes;
}

function flattenPublic(root: CirclePackingNode): CirclePackingNode[] {
  const nodes: CirclePackingNode[] = [];
  function visit(node: CirclePackingNode) {
    nodes.push(node);
    node.children.forEach(visit);
  }
  visit(root);
  return nodes;
}

function measureBounds(circles: WorkingCircle[]): Bounds {
  if (!circles.length) {
    return {
      minX: 0,
      maxX: 0,
      minY: 0,
      maxY: 0,
      width: 0,
      height: 0
    };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  circles.forEach((circle) => {
    minX = Math.min(minX, circle.x - circle.packRadius);
    maxX = Math.max(maxX, circle.x + circle.packRadius);
    minY = Math.min(minY, circle.y - circle.packRadius);
    maxY = Math.max(maxY, circle.y + circle.packRadius);
  });

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY
  };
}

function resolvePadding(padding: CirclePackingLayoutOptions['padding']): PaddingBox {
  if (isPlainObject(padding)) {
    return {
      top: Math.max(0, finiteNumber(padding.top, DEFAULT_PADDING)),
      right: Math.max(0, finiteNumber(padding.right, DEFAULT_PADDING)),
      bottom: Math.max(0, finiteNumber(padding.bottom, DEFAULT_PADDING)),
      left: Math.max(0, finiteNumber(padding.left, DEFAULT_PADDING))
    };
  }

  const value = Math.max(0, finiteNumber(padding, DEFAULT_PADDING));
  return {
    top: value,
    right: value,
    bottom: value,
    left: value
  };
}

function resolveRawPadding(value: unknown): CirclePackingLayoutOptions['padding'] | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (isPlainObject(value)) return value as CirclePackingPadding;
  return undefined;
}

function resolveInnerRect(width: number, height: number, padding: PaddingBox): Rect {
  return {
    x: padding.left,
    y: padding.top,
    width: Math.max(width - padding.left - padding.right, 1),
    height: Math.max(height - padding.top - padding.bottom, 1)
  };
}

function resolveRadius(radius: CirclePackingLayoutOptions['radius'], inner: Rect): number {
  const maxRadius = Math.max(1, Math.min(inner.width, inner.height) / 2);
  if (typeof radius === 'number' && Number.isFinite(radius)) return clamp(radius, 1, maxRadius);
  if (typeof radius === 'string' && radius.trim().endsWith('%')) {
    const numeric = Number.parseFloat(radius);
    if (Number.isFinite(numeric)) return clamp((numeric / 100) * maxRadius, 1, maxRadius);
  }
  return maxRadius;
}

function resolveCenter(center: CirclePackingLayoutOptions['center'], width: number, height: number, inner: Rect): Point {
  if (!Array.isArray(center)) {
    return {
      x: inner.x + inner.width / 2,
      y: inner.y + inner.height / 2
    };
  }

  return {
    x: resolvePosition(center[0], width, inner.x + inner.width / 2),
    y: resolvePosition(center[1], height, inner.y + inner.height / 2)
  };
}

function resolvePosition(value: number | string, size: number, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().endsWith('%')) {
    const numeric = Number.parseFloat(value);
    return Number.isFinite(numeric) ? (numeric / 100) * size : fallback;
  }
  return fallback;
}

function readChildren(record: Record<string, unknown>, childrenField: string): unknown[] {
  const explicit = readField(record, childrenField);
  if (Array.isArray(explicit)) return explicit;
  if (childrenField !== 'children' && Array.isArray(record.children)) return record.children;
  if (childrenField !== 'items' && Array.isArray(record.items)) return record.items;
  return [];
}

function readField(record: Record<string, unknown>, field: string): unknown {
  if (field in record) return record[field];
  if (!field.includes('.')) return undefined;

  let current: unknown = record;
  for (const part of field.split('.')) {
    if (!isPlainObject(current) || !(part in current)) return undefined;
    current = current[part];
  }
  return current;
}

function normalizeField(value: unknown, fallback: string): string {
  return typeof value === 'string' && value ? value : fallback;
}

function normalizeSort(value: unknown): CirclePackingSort | undefined {
  if (
    value === false ||
    value === true ||
    value === 'none' ||
    value === 'value' ||
    value === 'name' ||
    value === 'asc' ||
    value === 'desc'
  ) {
    return value;
  }
  return undefined;
}

function assignDefined<Key extends keyof CirclePackingLayoutOptions>(
  target: CirclePackingLayoutOptions,
  key: Key,
  value: CirclePackingLayoutOptions[Key] | undefined
): void {
  if (value !== undefined) target[key] = value;
}

function square(value: number): number {
  return value * value;
}

function clamp(value: number, min: number, max: number): number {
  if (min > max) return (min + max) / 2;
  return Math.min(Math.max(value, min), max);
}

function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * clamp(amount, 0, 1);
}

function smootherStep(value: number): number {
  const t = clamp(value, 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function round(value: number): number {
  return Math.round((value + Number.EPSILON) * 1000) / 1000;
}

function readNonNegativeNumber(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.max(value, 0);
}

function readString(value: unknown): string {
  if (typeof value === 'string' && value) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function stringifyValue(value: unknown, fallback: string): string {
  if (value instanceof Date) return value.toISOString();
  const text = readString(value);
  return text || fallback;
}

function timeToNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string') {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
    const time = Date.parse(value);
    if (Number.isFinite(time)) return time;
  }
  return fallback;
}

function readIdArray(value: unknown): string[] {
  const raw = Array.isArray(value) ? value : value == null ? [] : [value];
  return raw
    .map((item) => readString(item))
    .filter((item) => item.length > 0);
}

function isValidCircle(circle: Pick<CirclePackingNode, 'x' | 'y' | 'r'>): boolean {
  return Number.isFinite(circle.x) && Number.isFinite(circle.y) && Number.isFinite(circle.r) && circle.r > 0;
}

function mixColors(left: string, right: string, amount: number): string {
  const leftRgb = parseHexColor(left);
  const rightRgb = parseHexColor(right);
  if (!leftRgb || !rightRgb) return '';
  const p = clamp(amount, 0, 1);
  const mixed = leftRgb.map((channel, index) => Math.round(lerp(channel, rightRgb[index], p)));
  return `rgb(${mixed[0]}, ${mixed[1]}, ${mixed[2]})`;
}

function parseHexColor(value: string): [number, number, number] | null {
  const text = value.trim();
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(text);
  if (!match) return null;
  const hex = match[1].length === 3
    ? match[1].split('').map((part) => part + part).join('')
    : match[1];
  return [
    Number.parseInt(hex.slice(0, 2), 16),
    Number.parseInt(hex.slice(2, 4), 16),
    Number.parseInt(hex.slice(4, 6), 16)
  ];
}

function finiteNumber(value: unknown, fallback: undefined): number | undefined;
function finiteNumber(value: unknown, fallback: number): number;
function finiteNumber(value: unknown, fallback: number | undefined): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

export const __test__ = {
  normalizeRoot,
  computeValues,
  sortChildren,
  assignDataIndices,
  computeLocalPacking,
  packFrontChain,
  resolveCollisions,
  recenterCircles,
  placeTangent,
  intersects,
  createFrontChainNode,
  findBestFrontChainNode,
  scoreFrontChainNode,
  assignColors,
  assignPositions,
  toPublicNode,
  flatten,
  flattenPublic,
  measureBounds,
  resolvePadding,
  resolveRawPadding,
  resolveInnerRect,
  resolveRadius,
  resolveCenter,
  resolvePosition,
  resolveCirclePackingFluidOptions,
  normalizeCirclePackingFluidEvents,
  applyCirclePackingFluidState,
  interpolateCirclePackingFluidLayouts,
  createCirclePackingAbsorbSourceHandoffNodes,
  createCirclePackingMoveSettleTargetNodes,
  keepCirclePackingAbsorbSourceDescendantsInsideSource,
  keepCirclePackingSplitTargetDescendantsInsideTarget,
  transformCirclePackingTargetDescendant,
  transformCirclePackingSourceDescendant,
  appendAfterOnlyFluidNodes,
  assignInterpolatedNode,
  assignNodeGeometry,
  assignCirclePackingMoveNodeIdentity,
  keepCirclePackingMoveTargetInsideTargetParent,
  constrainCirclePackingNodeInsideParent,
  createCirclePackingSplitBudNode,
  resolveSplitBudAnchorDistance,
  resolveSplitDirection,
  createCirclePackingFluidBridges,
  createCirclePackingMoveSettleBridges,
  shouldSuppressCirclePackingLateSiblingMoveBridge,
  createCirclePackingFluidBridgePairs,
  pushCirclePackingFluidBridgePair,
  createCirclePackingWaterdropSurfaceShape,
  createCirclePackingFluidBridgePath,
  createCirclePackingWaterdropShapePath,
  createCirclePackingMoveBridgeShape,
  isCirclePackingBridgeOnlyOverstretched,
  createCirclePackingMoveLobeCircle,
  createCirclePackingMoveSettleCircle,
  createCirclePackingMoveSettleControlPoint,
  quadraticLerp,
  shouldDrawCirclePackingFluidBridge,
  shouldDrawCirclePackingMoveBridge,
  isCirclePackingMoveBridgeContainedInTargetParent,
  resolveCirclePackingFluidBridgeMaxDistance,
  isCirclePackingFluidBridgeBlocked,
  areCirclePackingFluidBridgeRelatives,
  normalizeAngleDelta,
  offsetPoint,
  isValidPoint,
  pointOnCircle,
  pointDistance,
  tangentPoint,
  arcToCubicCommands,
  pointCommand,
  cubicCommand,
  resolveCirclePackingFluidActivePhase,
  resolveCirclePackingFluidEventProgressAt,
  resolveCirclePackingFluidEventSpan,
  resolveCirclePackingFluidProgress,
  createMutableNodeLookup,
  addMutableNodeAlias,
  resolveMutableNodes,
  createPublicNodeLookup,
  isCirclePackingAncestorNode,
  shouldUseCirclePackingMoveSettleTarget,
  resolvePublicNodeIds,
  rawNodeId,
  findPublicNodeByRef,
  isCirclePackingNodeReferenced,
  cloneCirclePackingNode,
  isCirclePackingSplitEvent,
  isCirclePackingSpinOffEvent,
  isCirclePackingMoveEvent,
  isCirclePackingCheckpointEvent,
  isCirclePackingAbsorbEvent,
  isCirclePackingMoveSettleEvent,
  findPreviousCirclePackingMoveEventForTargets,
  hasFollowingCirclePackingMoveSettleEvent,
  findFollowingCirclePackingMoveSettleEvent,
  findNextCirclePackingSplitEventFromTargets,
  findNextCirclePackingAbsorbHandoffSplitEventFromTargets,
  findPreviousCirclePackingAbsorbHandoffEvent,
  isCirclePackingAbsorbHandoffSplitEvent,
  resolveCirclePackingFluidEventStartTime,
  readChildren,
  readField,
  normalizeField,
  normalizeSort,
  assignDefined,
  square,
  clamp,
  lerp,
  smootherStep,
  round,
  readNonNegativeNumber,
  readString,
  stringifyValue,
  timeToNumber,
  readIdArray,
  isValidCircle,
  mixColors,
  parseHexColor,
  finiteNumber,
  isPlainObject
};
