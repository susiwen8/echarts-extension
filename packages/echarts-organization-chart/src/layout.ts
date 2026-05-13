const DEFAULT_WIDTH = 720;
const DEFAULT_HEIGHT = 420;
const DEFAULT_PADDING = 24;
const DEFAULT_NODE_WIDTH = 132;
const DEFAULT_NODE_HEIGHT = 48;
const DEFAULT_LEVEL_GAP = 78;
const DEFAULT_SIBLING_GAP = 24;
const DEFAULT_SUBTREE_GAP = 36;

export type OrganizationChartOrient = 'TB' | 'BT' | 'LR' | 'RL' | 'vertical' | 'horizontal';
export type OrganizationChartField = string | number;
export type OrganizationChartPaddingOption = number | Partial<OrganizationChartPadding>;

export interface OrganizationChartPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface OrganizationChartInputNode {
  id?: string | number;
  parentId?: string | number | null;
  parent?: string | number | null;
  managerId?: string | number | null;
  name?: string | number;
  label?: string | number;
  value?: unknown;
  children?: unknown[];
  itemStyle?: Record<string, unknown>;
  labelStyle?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface OrganizationChartInputLink {
  source?: string | number;
  target?: string | number;
  from?: string | number;
  to?: string | number;
  [key: string]: unknown;
}

export interface OrganizationChartLayoutOptions {
  width?: number;
  height?: number;
  padding?: OrganizationChartPaddingOption;
  nodeWidth?: number;
  nodeHeight?: number;
  levelGap?: number;
  siblingGap?: number;
  subtreeGap?: number;
  orient?: OrganizationChartOrient | string;
  idField?: OrganizationChartField;
  parentIdField?: OrganizationChartField;
  nameField?: OrganizationChartField;
  childrenField?: OrganizationChartField;
  nodes?: unknown[];
  links?: unknown[];
  [key: string]: unknown;
}

export interface OrganizationChartLayoutOption extends OrganizationChartLayoutOptions {
  data?: unknown;
  layout?: unknown;
  layoutOptions?: unknown;
}

export interface OrganizationChartPoint {
  x: number;
  y: number;
}

export interface OrganizationChartNode {
  id: string;
  name: string;
  depth: number;
  parentId: string | null;
  childIds: string[];
  x: number;
  y: number;
  width: number;
  height: number;
  dataIndex: number;
  raw: unknown;
}

export interface OrganizationChartLink {
  id: string;
  source: string;
  target: string;
  points: OrganizationChartPoint[];
  raw: unknown;
}

export interface OrganizationChartLayoutResult {
  width: number;
  height: number;
  padding: OrganizationChartPadding;
  orient: Exclude<OrganizationChartOrient, 'vertical' | 'horizontal'>;
  nodeWidth: number;
  nodeHeight: number;
  levelGap: number;
  siblingGap: number;
  subtreeGap: number;
  rootIds: string[];
  nodes: OrganizationChartNode[];
  links: OrganizationChartLink[];
}

interface MutableOrgNode {
  id: string;
  name: string;
  depth: number;
  parent: MutableOrgNode | null;
  children: MutableOrgNode[];
  dataIndex: number;
  raw: unknown;
  breadth: number;
  depthPos: number;
  subtreeBreadth: number;
}

interface NormalizedTree {
  roots: MutableOrgNode[];
  nodes: MutableOrgNode[];
  links: Array<{ source: MutableOrgNode; target: MutableOrgNode; raw: unknown }>;
}

interface LayoutContext {
  orient: Exclude<OrganizationChartOrient, 'vertical' | 'horizontal'>;
  horizontal: boolean;
  width: number;
  height: number;
  padding: OrganizationChartPadding;
  nodeWidth: number;
  nodeHeight: number;
  levelGap: number;
  siblingGap: number;
  subtreeGap: number;
  breadthSize: number;
  depthSize: number;
  breadthStart: number;
  breadthEnd: number;
  depthStart: number;
  depthEnd: number;
}

export function resolveOrganizationChartLayout(option: OrganizationChartLayoutOption = {}): OrganizationChartLayoutResult {
  const layout = isPlainObject(option.layout) ? option.layout : {};
  const layoutOptions = isPlainObject(option.layoutOptions) ? option.layoutOptions : {};
  const dataEnvelope = isPlainObject(option.data) ? option.data : {};
  const merged: OrganizationChartLayoutOptions = {
    ...layout,
    ...layoutOptions,
    width: finiteNumber(option.width, finiteNumber(layoutOptions.width, finiteNumber(layout.width, DEFAULT_WIDTH))),
    height: finiteNumber(option.height, finiteNumber(layoutOptions.height, finiteNumber(layout.height, DEFAULT_HEIGHT))),
    padding: readPaddingOption(option.padding ?? layoutOptions.padding ?? layout.padding),
    nodeWidth: finiteNumber(option.nodeWidth, finiteNumber(layoutOptions.nodeWidth, finiteNumber(layout.nodeWidth, undefined))),
    nodeHeight: finiteNumber(option.nodeHeight, finiteNumber(layoutOptions.nodeHeight, finiteNumber(layout.nodeHeight, undefined))),
    levelGap: finiteNumber(option.levelGap, finiteNumber(layoutOptions.levelGap, finiteNumber(layout.levelGap, undefined))),
    siblingGap: finiteNumber(option.siblingGap, finiteNumber(layoutOptions.siblingGap, finiteNumber(layout.siblingGap, undefined))),
    subtreeGap: finiteNumber(option.subtreeGap, finiteNumber(layoutOptions.subtreeGap, finiteNumber(layout.subtreeGap, undefined))),
    orient: readString(option.orient ?? layoutOptions.orient ?? layout.orient),
    idField: readFieldOption(option.idField ?? layoutOptions.idField ?? layout.idField),
    parentIdField: readFieldOption(option.parentIdField ?? layoutOptions.parentIdField ?? layout.parentIdField),
    nameField: readFieldOption(option.nameField ?? layoutOptions.nameField ?? layout.nameField),
    childrenField: readFieldOption(option.childrenField ?? layoutOptions.childrenField ?? layout.childrenField),
    nodes: normalizeUnknownArray(option.nodes ?? layoutOptions.nodes ?? layout.nodes ?? dataEnvelope.nodes),
    links: normalizeUnknownArray(option.links ?? layoutOptions.links ?? layout.links ?? dataEnvelope.links ?? dataEnvelope.edges)
  };

  return layoutOrganizationChart(option.data, merged);
}

export function layoutOrganizationChart(
  data: unknown,
  options: OrganizationChartLayoutOptions = {}
): OrganizationChartLayoutResult {
  const width = Math.max(1, finiteNumber(options.width, DEFAULT_WIDTH));
  const height = Math.max(1, finiteNumber(options.height, DEFAULT_HEIGHT));
  const padding = normalizePadding(options.padding);
  const orient = normalizeOrient(options.orient);
  const horizontal = orient === 'LR' || orient === 'RL';
  const nodeWidth = Math.max(1, finiteNumber(options.nodeWidth, DEFAULT_NODE_WIDTH));
  const nodeHeight = Math.max(1, finiteNumber(options.nodeHeight, DEFAULT_NODE_HEIGHT));
  const levelGap = Math.max(0, finiteNumber(options.levelGap, DEFAULT_LEVEL_GAP));
  const siblingGap = Math.max(0, finiteNumber(options.siblingGap, DEFAULT_SIBLING_GAP));
  const subtreeGap = Math.max(0, finiteNumber(options.subtreeGap, DEFAULT_SUBTREE_GAP));
  const context: LayoutContext = {
    orient,
    horizontal,
    width,
    height,
    padding,
    nodeWidth,
    nodeHeight,
    levelGap,
    siblingGap,
    subtreeGap,
    breadthSize: horizontal ? nodeHeight : nodeWidth,
    depthSize: horizontal ? nodeWidth : nodeHeight,
    breadthStart: horizontal ? padding.top : padding.left,
    breadthEnd: horizontal ? height - padding.bottom : width - padding.right,
    depthStart: horizontal ? padding.left : padding.top,
    depthEnd: horizontal ? width - padding.right : height - padding.bottom
  };
  const normalized = normalizeOrganizationData(data, options);

  assignDepths(normalized.roots, 0);
  normalized.roots.forEach((root) => computeSubtreeBreadth(root, context));
  assignForestBreadth(normalized.roots, context);
  normalized.nodes.forEach((node) => {
    node.depthPos = context.depthStart + node.depth * (context.depthSize + levelGap);
  });

  const publicNodes = normalized.nodes
    .slice()
    .sort((left, right) => left.dataIndex - right.dataIndex)
    .map((node) => toPublicNode(node, context));
  const publicById = new Map(publicNodes.map((node) => [node.id, node]));
  const publicLinks = normalized.links
    .map((link, index) => toPublicLink(link, index, publicById, context.orient))
    .filter((link): link is OrganizationChartLink => Boolean(link));

  return {
    width,
    height,
    padding,
    orient,
    nodeWidth,
    nodeHeight,
    levelGap,
    siblingGap,
    subtreeGap,
    rootIds: normalized.roots.map((root) => root.id),
    nodes: publicNodes,
    links: publicLinks
  };
}

export function flattenOrganizationChartData(option: OrganizationChartLayoutOption = {}): unknown[] {
  return normalizeOrganizationData(option.data, option)
    .nodes
    .slice()
    .sort((left, right) => left.dataIndex - right.dataIndex)
    .map((node) => node.raw);
}

function normalizeOrganizationData(data: unknown, options: OrganizationChartLayoutOptions): NormalizedTree {
  const dataRecord = isPlainObject(data) ? data : {};
  const explicitNodes = normalizeUnknownArray(options.nodes);
  const explicitLinks = normalizeUnknownArray(options.links);
  const envelopeNodes = normalizeUnknownArray(dataRecord.nodes ?? dataRecord.data);
  const envelopeLinks = normalizeUnknownArray(dataRecord.links ?? dataRecord.edges);
  const flatNodes = explicitNodes.length ? explicitNodes : envelopeNodes;
  const flatLinks = explicitLinks.length ? explicitLinks : envelopeLinks;

  if (flatNodes.length) return normalizeFlatNodes(flatNodes, flatLinks, options);
  if (Array.isArray(data) && (flatLinks.length || containsParentReferences(data, options))) {
    return normalizeFlatNodes(data, flatLinks, options);
  }

  return normalizeNestedData(data, options);
}

function normalizeNestedData(data: unknown, options: OrganizationChartLayoutOptions): NormalizedTree {
  const rootsInput = Array.isArray(data) ? data : data == null ? [] : [data];
  let nextDataIndex = 0;
  const nodes: MutableOrgNode[] = [];
  const links: NormalizedTree['links'] = [];

  function createNode(raw: unknown, parent: MutableOrgNode | null, siblingIndex: number): MutableOrgNode {
    const record = isPlainObject(raw) ? raw : {};
    const nameValue = readField(raw, options.nameField ?? 'name', -1)
      ?? record.label
      ?? record.id
      ?? (isPrimitive(raw) ? raw : undefined)
      ?? `node-${siblingIndex + 1}`;
    const name = stringifyName(nameValue);
    const idValue = readField(raw, options.idField ?? 'id', -1);
    const idPart = stringifyName(idValue ?? name);
    const id = parent ? ensureUniqueId(`${parent.id}/${idPart}`, nodes) : ensureUniqueId(idPart, nodes);
    const node: MutableOrgNode = {
      id,
      name,
      depth: parent ? parent.depth + 1 : 0,
      parent,
      children: [],
      dataIndex: nextDataIndex++,
      raw,
      breadth: 0,
      depthPos: 0,
      subtreeBreadth: 0
    };
    nodes.push(node);

    const childSource = readField(raw, options.childrenField ?? 'children', -1);
    const children = Array.isArray(childSource) ? childSource : [];
    node.children = children.map((child, index) => {
      const childNode = createNode(child, node, index);
      links.push({ source: node, target: childNode, raw: child });
      return childNode;
    });
    return node;
  }

  const roots = rootsInput.map((root, index) => createNode(root, null, index));
  return { roots, nodes, links };
}

function normalizeFlatNodes(data: unknown[], explicitLinks: unknown[], options: OrganizationChartLayoutOptions): NormalizedTree {
  const nodes: MutableOrgNode[] = [];
  const nodesById = new Map<string, MutableOrgNode>();
  const links: NormalizedTree['links'] = [];
  const idField = options.idField ?? 'id';
  const parentIdField = options.parentIdField ?? 'parentId';

  data.forEach((raw, index) => {
    const id = ensureUniqueId(stringifyName(
      readField(raw, idField, 0)
      ?? readField(raw, 'key', -1)
      ?? readField(raw, 'name', -1)
      ?? `node-${index + 1}`
    ), nodes);
    const name = stringifyName(
      readField(raw, options.nameField ?? 'name', 2)
      ?? readField(raw, 'label', -1)
      ?? id
    );
    const node: MutableOrgNode = {
      id,
      name,
      depth: 0,
      parent: null,
      children: [],
      dataIndex: index,
      raw,
      breadth: 0,
      depthPos: 0,
      subtreeBreadth: 0
    };
    nodes.push(node);
    nodesById.set(id, node);
  });

  if (explicitLinks.length) {
    explicitLinks.forEach((raw) => {
      const sourceId = stringifyMaybe(readField(raw, 'source', 0) ?? readField(raw, 'from', -1));
      const targetId = stringifyMaybe(readField(raw, 'target', 1) ?? readField(raw, 'to', -1));
      if (!sourceId || !targetId || sourceId === targetId) return;
      const source = nodesById.get(sourceId);
      const target = nodesById.get(targetId);
      if (!source || !target || target.parent) return;
      target.parent = source;
      source.children.push(target);
      links.push({ source, target, raw });
    });
  } else {
    nodes.forEach((node) => {
      const parentId = stringifyMaybe(
        readField(node.raw, parentIdField, 1)
        ?? readField(node.raw, 'parent', -1)
        ?? readField(node.raw, 'managerId', -1)
        ?? readField(node.raw, 'pid', -1)
      );
      if (!parentId || parentId === node.id) return;
      const parent = nodesById.get(parentId);
      if (!parent) return;
      node.parent = parent;
      parent.children.push(node);
      links.push({ source: parent, target: node, raw: node.raw });
    });
  }

  const roots = nodes.filter((node) => !node.parent);
  return { roots: roots.length ? roots : nodes, nodes, links };
}

function containsParentReferences(data: unknown[], options: OrganizationChartLayoutOptions): boolean {
  const parentIdField = options.parentIdField ?? 'parentId';
  return data.some((item) => stringifyMaybe(
    readField(item, parentIdField, 1)
    ?? readField(item, 'parent', -1)
    ?? readField(item, 'managerId', -1)
    ?? readField(item, 'pid', -1)
  ));
}

function assignDepths(roots: MutableOrgNode[], depth: number): void {
  roots.forEach((root) => {
    root.depth = depth;
    root.children.forEach((child) => {
      child.parent = root;
    });
    assignDepths(root.children, depth + 1);
  });
}

function computeSubtreeBreadth(node: MutableOrgNode, context: LayoutContext): number {
  if (!node.children.length) {
    node.subtreeBreadth = context.breadthSize;
    return node.subtreeBreadth;
  }

  let breadth = 0;
  node.children.forEach((child, index) => {
    breadth += computeSubtreeBreadth(child, context);
    if (index < node.children.length - 1) breadth += gapBetween(child, node.children[index + 1], context);
  });
  node.subtreeBreadth = Math.max(context.breadthSize, breadth);
  return node.subtreeBreadth;
}

function assignForestBreadth(roots: MutableOrgNode[], context: LayoutContext): void {
  if (!roots.length) return;
  let totalBreadth = 0;
  roots.forEach((root, index) => {
    totalBreadth += root.subtreeBreadth;
    if (index < roots.length - 1) totalBreadth += context.subtreeGap;
  });
  const innerBreadth = Math.max(context.breadthEnd - context.breadthStart, context.breadthSize);
  let cursor = context.breadthStart + Math.max((innerBreadth - totalBreadth) / 2, 0);
  roots.forEach((root, index) => {
    assignBreadth(root, cursor, context);
    cursor += root.subtreeBreadth + (index < roots.length - 1 ? context.subtreeGap : 0);
  });
}

function assignBreadth(node: MutableOrgNode, start: number, context: LayoutContext): void {
  if (!node.children.length) {
    node.breadth = start + Math.max((node.subtreeBreadth - context.breadthSize) / 2, 0);
    return;
  }

  let childrenBreadth = 0;
  node.children.forEach((child, index) => {
    childrenBreadth += child.subtreeBreadth;
    if (index < node.children.length - 1) childrenBreadth += gapBetween(child, node.children[index + 1], context);
  });

  let cursor = start + Math.max((node.subtreeBreadth - childrenBreadth) / 2, 0);
  node.children.forEach((child, index) => {
    assignBreadth(child, cursor, context);
    cursor += child.subtreeBreadth + (index < node.children.length - 1 ? gapBetween(child, node.children[index + 1], context) : 0);
  });

  const first = node.children[0];
  const last = node.children[node.children.length - 1];
  const firstCenter = first.breadth + context.breadthSize / 2;
  const lastCenter = last.breadth + context.breadthSize / 2;
  node.breadth = (firstCenter + lastCenter) / 2 - context.breadthSize / 2;
}

function gapBetween(left: MutableOrgNode, right: MutableOrgNode, context: LayoutContext): number {
  return left.children.length || right.children.length ? context.subtreeGap : context.siblingGap;
}

function toPublicNode(node: MutableOrgNode, context: LayoutContext): OrganizationChartNode {
  const transformed = transformNodePosition(node, context);
  return {
    id: node.id,
    name: node.name,
    depth: node.depth,
    parentId: node.parent?.id ?? null,
    childIds: node.children.map((child) => child.id),
    x: transformed.x,
    y: transformed.y,
    width: context.nodeWidth,
    height: context.nodeHeight,
    dataIndex: node.dataIndex,
    raw: node.raw
  };
}

function transformNodePosition(node: MutableOrgNode, context: LayoutContext): { x: number; y: number } {
  if (!context.horizontal) {
    const yOffset = node.depthPos - context.padding.top;
    const y = context.orient === 'BT'
      ? context.height - context.padding.bottom - yOffset - context.nodeHeight
      : node.depthPos;
    return { x: node.breadth, y };
  }

  const xOffset = node.depthPos - context.padding.left;
  const x = context.orient === 'RL'
    ? context.width - context.padding.right - xOffset - context.nodeWidth
    : node.depthPos;
  return { x, y: node.breadth };
}

function toPublicLink(
  link: NormalizedTree['links'][number],
  index: number,
  publicById: Map<string, OrganizationChartNode>,
  orient: Exclude<OrganizationChartOrient, 'vertical' | 'horizontal'>
): OrganizationChartLink | null {
  const source = publicById.get(link.source.id);
  const target = publicById.get(link.target.id);
  if (!source || !target) return null;
  return {
    id: `${source.id}->${target.id}`,
    source: source.id,
    target: target.id,
    points: createLinkPoints(source, target, orient),
    raw: link.raw ?? index
  };
}

function createLinkPoints(
  source: OrganizationChartNode,
  target: OrganizationChartNode,
  orient: Exclude<OrganizationChartOrient, 'vertical' | 'horizontal'>
): OrganizationChartPoint[] {
  if (orient === 'LR' || orient === 'RL') {
    const startX = orient === 'LR' ? source.x + source.width : source.x;
    const endX = orient === 'LR' ? target.x : target.x + target.width;
    const startY = source.y + source.height / 2;
    const endY = target.y + target.height / 2;
    const midX = (startX + endX) / 2;
    return [
      { x: startX, y: startY },
      { x: midX, y: startY },
      { x: midX, y: endY },
      { x: endX, y: endY }
    ];
  }

  const startX = source.x + source.width / 2;
  const endX = target.x + target.width / 2;
  const startY = orient === 'TB' ? source.y + source.height : source.y;
  const endY = orient === 'TB' ? target.y : target.y + target.height;
  const midY = (startY + endY) / 2;
  return [
    { x: startX, y: startY },
    { x: startX, y: midY },
    { x: endX, y: midY },
    { x: endX, y: endY }
  ];
}

function normalizeOrient(value: unknown): Exclude<OrganizationChartOrient, 'vertical' | 'horizontal'> {
  if (value === 'BT' || value === 'bottom-top' || value === 'bottomToTop') return 'BT';
  if (value === 'LR' || value === 'horizontal' || value === 'left-right' || value === 'leftToRight') return 'LR';
  if (value === 'RL' || value === 'right-left' || value === 'rightToLeft') return 'RL';
  return 'TB';
}

function normalizePadding(value: unknown): OrganizationChartPadding {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const normalized = Math.max(0, value);
    return {
      top: normalized,
      right: normalized,
      bottom: normalized,
      left: normalized
    };
  }

  const record = isPlainObject(value) ? value : {};
  return {
    top: Math.max(0, finiteNumber(record.top, DEFAULT_PADDING)),
    right: Math.max(0, finiteNumber(record.right, DEFAULT_PADDING)),
    bottom: Math.max(0, finiteNumber(record.bottom, DEFAULT_PADDING)),
    left: Math.max(0, finiteNumber(record.left, DEFAULT_PADDING))
  };
}

function readPaddingOption(value: unknown): OrganizationChartPaddingOption | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (!isPlainObject(value)) return undefined;

  const padding: Partial<OrganizationChartPadding> = {};
  (['top', 'right', 'bottom', 'left'] as const).forEach((key) => {
    const nextValue = value[key];
    if (typeof nextValue === 'number' && Number.isFinite(nextValue)) padding[key] = nextValue;
  });
  return padding;
}

function readField(item: unknown, field: OrganizationChartField, arrayFallbackIndex: number): unknown {
  if (Array.isArray(item)) {
    if (typeof field === 'number') return item[field];
    if (arrayFallbackIndex >= 0) return item[arrayFallbackIndex];
    return undefined;
  }
  if (!isPlainObject(item)) return undefined;
  return item[String(field)];
}

function readFieldOption(value: unknown): OrganizationChartField | undefined {
  if (typeof value === 'string' || typeof value === 'number') return value;
  return undefined;
}

function normalizeUnknownArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function ensureUniqueId(id: string, nodes: MutableOrgNode[]): string {
  const base = id || `node-${nodes.length + 1}`;
  const existing = new Set(nodes.map((node) => node.id));
  if (!existing.has(base)) return base;
  let suffix = 2;
  while (existing.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

function stringifyMaybe(value: unknown): string | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  return String(value);
}

function stringifyName(value: unknown): string {
  const stringValue = stringifyMaybe(value);
  return stringValue ?? '';
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function isPrimitive(value: unknown): value is string | number | boolean {
  return ['string', 'number', 'boolean'].includes(typeof value);
}

function finiteNumber(value: unknown, fallback: number | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback ?? NaN;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

export const __test__ = {
  normalizeOrganizationData,
  normalizePadding,
  readPaddingOption,
  normalizeOrient,
  createLinkPoints,
  toPublicLink,
  readField,
  readFieldOption,
  normalizeUnknownArray,
  ensureUniqueId,
  stringifyMaybe,
  stringifyName,
  readString,
  isPrimitive,
  finiteNumber
};
