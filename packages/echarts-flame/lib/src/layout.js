const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 400;
const DEFAULT_PADDING = 4;
const DEFAULT_GAP = 1;
export const DEFAULT_FLAME_COLORS = [
    '#f97316',
    '#f59e0b',
    '#ef4444',
    '#14b8a6',
    '#3b82f6',
    '#8b5cf6',
    '#22c55e'
];
export function resolveFlameLayout(option = {}) {
    const layoutOptions = {
        ...(isPlainObject(option.layout) ? option.layout : {}),
        ...(isPlainObject(option.layoutOptions) ? option.layoutOptions : {}),
        width: finiteNumber(option.width, undefined),
        height: finiteNumber(option.height, undefined),
        padding: finiteNumber(option.padding, undefined),
        gap: finiteNumber(option.gap, undefined),
        rootName: typeof option.rootName === 'string' ? option.rootName : undefined,
        rootVisible: typeof option.rootVisible === 'boolean' ? option.rootVisible : undefined,
        orient: option.orient === 'down' || option.orient === 'up' ? option.orient : undefined,
        colors: Array.isArray(option.colors) ? option.colors.filter((color) => typeof color === 'string') : undefined,
        sort: normalizeSort(option.sort)
    };
    return layoutFlame(option.data, layoutOptions);
}
export function layoutFlame(data, options = {}) {
    const width = finiteNumber(options.width, DEFAULT_WIDTH);
    const height = finiteNumber(options.height, DEFAULT_HEIGHT);
    const padding = Math.max(0, finiteNumber(options.padding, DEFAULT_PADDING));
    const gap = Math.max(0, finiteNumber(options.gap, DEFAULT_GAP));
    const orient = options.orient === 'down' ? 'down' : 'up';
    const rootVisible = typeof options.rootVisible === 'boolean' ? options.rootVisible : !Array.isArray(data);
    const colors = options.colors?.length ? options.colors : DEFAULT_FLAME_COLORS;
    const root = normalizeRoot(data, options.rootName);
    computeValues(root);
    if (options.sort !== false && options.sort !== 'none')
        sortChildren(root, options.sort);
    computeSubtreeHeights(root);
    const depthOffset = rootVisible ? 0 : 1;
    assignColors(root, colors, depthOffset);
    const innerWidth = Math.max(width - padding * 2, 1);
    const innerHeight = Math.max(height - padding * 2, 1);
    root.x = padding;
    root.width = innerWidth;
    layoutChildren(root, gap);
    const visibleNodes = flatten(root).filter((node) => node.value > 0 && (rootVisible || node !== root));
    const maxVisibleDepth = visibleNodes.reduce((max, node) => Math.max(max, node.depth - depthOffset), 0);
    const depthCount = visibleNodes.length ? maxVisibleDepth + 1 : 0;
    const rowHeight = depthCount > 0
        ? Math.max((innerHeight - gap * Math.max(0, depthCount - 1)) / depthCount, 1)
        : innerHeight;
    assignRows(root, depthOffset, depthCount, rowHeight, gap, padding, orient);
    const publicRoot = toPublicNode(root, root.value);
    return {
        width,
        height,
        padding,
        gap,
        orient,
        rootVisible,
        root: publicRoot,
        nodes: visibleNodes.map((node) => toPublicNode(node, root.value))
    };
}
export function flattenFlameData(data, rootName) {
    return flatten(normalizeRoot(data, rootName))
        .filter((node) => node.dataIndex >= 0)
        .sort((left, right) => left.dataIndex - right.dataIndex)
        .map((node) => node.raw);
}
function normalizeRoot(data, rootName) {
    let nextDataIndex = 0;
    function createNode(raw, depth, parent, siblingIndex, forcedName, synthetic = false) {
        const record = isPlainObject(raw) ? raw : {};
        const label = record.label;
        const name = String(forcedName
            ?? record.name
            ?? (typeof label === 'string' || typeof label === 'number' ? label : undefined)
            ?? record.id
            ?? `node-${siblingIndex}`);
        const idPart = record.id != null ? String(record.id) : parent ? `${name}-${siblingIndex}` : name;
        const id = parent ? `${parent.id}/${idPart}` : idPart;
        const node = {
            id,
            name,
            value: 0,
            depth,
            subtreeHeight: 0,
            parent,
            children: [],
            dataIndex: synthetic ? -1 : nextDataIndex++,
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            color: DEFAULT_FLAME_COLORS[depth % DEFAULT_FLAME_COLORS.length],
            raw,
            synthetic
        };
        const childrenSource = Array.isArray(record.children) ? record.children : [];
        node.children = childrenSource.map((child, index) => createNode(child, depth + 1, node, index));
        return node;
    }
    if (Array.isArray(data)) {
        return createNode({
            name: rootName || 'root',
            children: data
        }, 0, null, 0, rootName || 'root', true);
    }
    if (isPlainObject(data)) {
        return createNode(data, 0, null, 0, rootName);
    }
    return createNode({
        name: rootName || 'root',
        value: readNonNegativeNumber(data) ?? 0
    }, 0, null, 0, rootName || 'root');
}
function computeValues(node) {
    const children = [];
    let childTotal = 0;
    node.children.forEach((child) => {
        const childValue = computeValues(child);
        if (childValue <= 0)
            return;
        children.push(child);
        childTotal += childValue;
    });
    node.children = children;
    const record = isPlainObject(node.raw) ? node.raw : {};
    const explicitValue = readNonNegativeNumber(record.value);
    if (node.children.length) {
        node.value = Math.max(explicitValue ?? 0, childTotal);
        return node.value;
    }
    node.value = explicitValue ?? (node.synthetic ? 0 : 1);
    return node.value;
}
function sortChildren(node, sort) {
    if (sort === 'name') {
        node.children.sort((left, right) => left.name.localeCompare(right.name) || right.value - left.value);
    }
    else {
        node.children.sort((left, right) => right.value - left.value || left.name.localeCompare(right.name));
    }
    node.children.forEach((child) => sortChildren(child, sort));
}
function computeSubtreeHeights(node) {
    if (!node.children.length) {
        node.subtreeHeight = 0;
        return 0;
    }
    node.subtreeHeight = 1 + Math.max(...node.children.map(computeSubtreeHeights));
    return node.subtreeHeight;
}
function assignColors(node, colors, depthOffset) {
    const record = isPlainObject(node.raw) ? node.raw : {};
    const itemStyle = isPlainObject(record.itemStyle) ? record.itemStyle : {};
    const colorDepth = Math.max(0, node.depth - depthOffset);
    node.color = typeof itemStyle.color === 'string' ? itemStyle.color : colors[Math.min(colorDepth, colors.length - 1)];
    node.children.forEach((child) => assignColors(child, colors, depthOffset));
}
function layoutChildren(node, gap) {
    const children = node.children.filter((child) => child.value > 0);
    if (!children.length || node.value <= 0)
        return;
    const gapTotal = gap * Math.max(0, children.length - 1);
    const availableWidth = Math.max(node.width - gapTotal, 0);
    let cursorX = node.x;
    children.forEach((child) => {
        child.x = cursorX;
        child.width = availableWidth * (child.value / node.value);
        cursorX += child.width + gap;
        layoutChildren(child, gap);
    });
}
function assignRows(node, depthOffset, depthCount, rowHeight, gap, padding, orient) {
    const visibleDepth = node.depth - depthOffset;
    if (visibleDepth >= 0 && depthCount > 0) {
        node.y = orient === 'down'
            ? padding + visibleDepth * (rowHeight + gap)
            : padding + (depthCount - visibleDepth - 1) * (rowHeight + gap);
        node.height = rowHeight;
    }
    else {
        node.y = padding;
        node.height = rowHeight;
    }
    node.children.forEach((child) => assignRows(child, depthOffset, depthCount, rowHeight, gap, padding, orient));
}
function flatten(root) {
    const nodes = [];
    function visit(node) {
        nodes.push(node);
        node.children.forEach(visit);
    }
    visit(root);
    return nodes;
}
function toPublicNode(node, rootValue) {
    const publicNode = {
        id: node.id,
        name: node.name,
        value: node.value,
        depth: node.depth,
        subtreeHeight: node.subtreeHeight,
        parentId: node.parent?.id ?? null,
        children: [],
        dataIndex: node.dataIndex,
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
        color: node.color,
        percent: rootValue > 0 ? node.value / rootValue : 0,
        raw: node.raw
    };
    publicNode.children = node.children.map((child) => toPublicNode(child, rootValue));
    return publicNode;
}
function normalizeSort(value) {
    if (value === false || value === true || value === 'none' || value === 'value' || value === 'name')
        return value;
    return undefined;
}
function readNonNegativeNumber(value) {
    if (typeof value !== 'number' || !Number.isFinite(value))
        return null;
    return Math.max(value, 0);
}
function finiteNumber(value, fallback) {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
function isPlainObject(value) {
    return value != null && typeof value === 'object' && !Array.isArray(value);
}
//# sourceMappingURL=layout.js.map