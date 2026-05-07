const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 400;
const DEFAULT_PADDING = 18;
const DEFAULT_NODE_PADDING = 2.5;
const DEFAULT_SIBLING_GAP = 1.5;
const EPSILON = 1e-6;
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
export function resolveCirclePackingLayout(option = {}) {
    const layoutOptions = {
        ...(isPlainObject(option.layout) ? option.layout : {}),
        ...(isPlainObject(option.layoutOptions) ? option.layoutOptions : {})
    };
    assignDefined(layoutOptions, 'width', finiteNumber(option.width, undefined));
    assignDefined(layoutOptions, 'height', finiteNumber(option.height, undefined));
    assignDefined(layoutOptions, 'padding', resolveRawPadding(option.padding));
    assignDefined(layoutOptions, 'nodePadding', finiteNumber(option.nodePadding, undefined));
    assignDefined(layoutOptions, 'siblingGap', finiteNumber(option.siblingGap, undefined));
    assignDefined(layoutOptions, 'center', Array.isArray(option.center) ? option.center : undefined);
    assignDefined(layoutOptions, 'radius', option.radius);
    assignDefined(layoutOptions, 'rootName', typeof option.rootName === 'string' ? option.rootName : undefined);
    assignDefined(layoutOptions, 'rootVisible', typeof option.rootVisible === 'boolean' ? option.rootVisible : undefined);
    assignDefined(layoutOptions, 'valueField', typeof option.valueField === 'string' ? option.valueField : undefined);
    assignDefined(layoutOptions, 'nameField', typeof option.nameField === 'string' ? option.nameField : undefined);
    assignDefined(layoutOptions, 'childrenField', typeof option.childrenField === 'string' ? option.childrenField : undefined);
    assignDefined(layoutOptions, 'sort', normalizeSort(option.sort));
    assignDefined(layoutOptions, 'colors', Array.isArray(option.colors) ? option.colors.filter((color) => typeof color === 'string') : undefined);
    return layoutCirclePacking(option.data, layoutOptions);
}
export function layoutCirclePacking(data, options = {}) {
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
    if (options.sort !== false && options.sort !== 'none')
        sortChildren(root, options.sort);
    assignDataIndices(root);
    computeLocalPacking(root, options);
    assignColors(root, colors, rootVisible ? 0 : 1);
    const scale = root.localRadius > EPSILON ? radius / root.localRadius : 1;
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
export function flattenCirclePackingData(data, options = {}) {
    const root = normalizeRoot(data, options);
    computeValues(root);
    if (options.sort !== false && options.sort !== 'none')
        sortChildren(root, options.sort);
    assignDataIndices(root);
    return flatten(root)
        .filter((node) => !node.synthetic)
        .sort((left, right) => left.dataIndex - right.dataIndex)
        .map((node) => node.raw);
}
function normalizeRoot(data, options) {
    const valueField = normalizeField(options.valueField, 'value');
    const nameField = normalizeField(options.nameField, 'name');
    const childrenField = normalizeField(options.childrenField, 'children');
    function createNode(raw, depth, parent, siblingIndex, forcedName, synthetic = false) {
        const record = isPlainObject(raw) ? raw : {};
        const label = record.label;
        const name = String(forcedName
            ?? readField(record, nameField)
            ?? record.name
            ?? (typeof label === 'string' || typeof label === 'number' ? label : undefined)
            ?? record.id
            ?? (isPlainObject(raw) ? `node-${siblingIndex}` : raw)
            ?? `node-${siblingIndex}`);
        const idPart = record.id != null ? String(record.id) : parent ? `${name}-${siblingIndex}` : name;
        const id = parent ? `${parent.id}/${idPart}` : idPart;
        const node = {
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
    if (node.children.length) {
        node.value = Math.max(node.explicitValue ?? 0, childTotal);
        return node.value;
    }
    node.value = node.explicitValue ?? (node.synthetic ? 0 : 1);
    return node.value;
}
function sortChildren(node, sort) {
    if (sort === 'name') {
        node.children.sort((left, right) => left.name.localeCompare(right.name) || right.value - left.value);
    }
    else if (sort === 'asc') {
        node.children.sort((left, right) => left.value - right.value || left.name.localeCompare(right.name));
    }
    else {
        node.children.sort((left, right) => right.value - left.value || left.name.localeCompare(right.name));
    }
    node.children.forEach((child) => sortChildren(child, sort));
}
function assignDataIndices(root) {
    let nextDataIndex = 0;
    flatten(root).forEach((node) => {
        node.dataIndex = node.synthetic ? -1 : nextDataIndex++;
    });
}
function computeLocalPacking(node, options) {
    node.children.forEach((child) => computeLocalPacking(child, options));
    if (!node.children.length) {
        node.localRadius = Math.max(Math.sqrt(Math.max(node.value, EPSILON)), EPSILON);
        return node.localRadius;
    }
    const siblingGap = Math.max(0, finiteNumber(options.siblingGap, DEFAULT_SIBLING_GAP));
    const nodePadding = Math.max(0, finiteNumber(options.nodePadding, DEFAULT_NODE_PADDING));
    const circles = node.children.map((child) => ({
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
function packFrontChain(circles, gap) {
    circles.forEach((circle) => {
        circle.packRadius = circle.r + gap / 2;
    });
    if (!circles.length)
        return;
    circles[0].x = 0;
    circles[0].y = 0;
    if (circles.length === 1)
        return;
    circles[0].x = -circles[1].packRadius;
    circles[1].x = circles[0].packRadius;
    circles[1].y = 0;
    if (circles.length === 2)
        return;
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
function resolveCollisions(circles) {
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
                if (overlap <= 0)
                    continue;
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
        if (largestOverlap < 0.01)
            return;
    }
}
function recenterCircles(circles) {
    if (!circles.length)
        return;
    const bounds = measureBounds(circles);
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    circles.forEach((circle) => {
        circle.x -= centerX;
        circle.y -= centerY;
    });
}
function placeTangent(a, b, c) {
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
function intersects(left, right) {
    const dr = left.packRadius + right.packRadius - EPSILON;
    const dx = right.x - left.x;
    const dy = right.y - left.y;
    return dr > 0 && dr * dr > dx * dx + dy * dy;
}
function createFrontChainNode(circle) {
    const node = {};
    node.circle = circle;
    node.next = node;
    node.previous = node;
    return node;
}
function findBestFrontChainNode(start) {
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
function scoreFrontChainNode(node) {
    const current = node.circle;
    const next = node.next.circle;
    const radiusSum = current.packRadius + next.packRadius;
    if (radiusSum <= EPSILON)
        return 0;
    const x = (current.x * next.packRadius + next.x * current.packRadius) / radiusSum;
    const y = (current.y * next.packRadius + next.y * current.packRadius) / radiusSum;
    return x * x + y * y;
}
function assignColors(node, colors, depthOffset) {
    const record = isPlainObject(node.raw) ? node.raw : {};
    const itemStyle = isPlainObject(record.itemStyle) ? record.itemStyle : {};
    const colorDepth = Math.max(0, node.depth - depthOffset);
    node.color = typeof itemStyle.color === 'string' ? itemStyle.color : colors[colorDepth % colors.length];
    node.children.forEach((child) => assignColors(child, colors, depthOffset));
}
function assignPositions(node, origin, scale) {
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
function toPublicNode(node, rootValue) {
    const publicNode = {
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
function flatten(root) {
    const nodes = [];
    function visit(node) {
        nodes.push(node);
        node.children.forEach(visit);
    }
    visit(root);
    return nodes;
}
function flattenPublic(root) {
    const nodes = [];
    function visit(node) {
        nodes.push(node);
        node.children.forEach(visit);
    }
    visit(root);
    return nodes;
}
function measureBounds(circles) {
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
function resolvePadding(padding) {
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
function resolveRawPadding(value) {
    if (typeof value === 'number' && Number.isFinite(value))
        return value;
    if (isPlainObject(value))
        return value;
    return undefined;
}
function resolveInnerRect(width, height, padding) {
    return {
        x: padding.left,
        y: padding.top,
        width: Math.max(width - padding.left - padding.right, 1),
        height: Math.max(height - padding.top - padding.bottom, 1)
    };
}
function resolveRadius(radius, inner) {
    const maxRadius = Math.max(1, Math.min(inner.width, inner.height) / 2);
    if (typeof radius === 'number' && Number.isFinite(radius))
        return clamp(radius, 1, maxRadius);
    if (typeof radius === 'string' && radius.trim().endsWith('%')) {
        const numeric = Number.parseFloat(radius);
        if (Number.isFinite(numeric))
            return clamp((numeric / 100) * maxRadius, 1, maxRadius);
    }
    return maxRadius;
}
function resolveCenter(center, width, height, inner) {
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
function resolvePosition(value, size, fallback) {
    if (typeof value === 'number' && Number.isFinite(value))
        return value;
    if (typeof value === 'string' && value.trim().endsWith('%')) {
        const numeric = Number.parseFloat(value);
        return Number.isFinite(numeric) ? (numeric / 100) * size : fallback;
    }
    return fallback;
}
function readChildren(record, childrenField) {
    const explicit = readField(record, childrenField);
    if (Array.isArray(explicit))
        return explicit;
    if (childrenField !== 'children' && Array.isArray(record.children))
        return record.children;
    if (childrenField !== 'items' && Array.isArray(record.items))
        return record.items;
    return [];
}
function readField(record, field) {
    if (field in record)
        return record[field];
    if (!field.includes('.'))
        return undefined;
    let current = record;
    for (const part of field.split('.')) {
        if (!isPlainObject(current) || !(part in current))
            return undefined;
        current = current[part];
    }
    return current;
}
function normalizeField(value, fallback) {
    return typeof value === 'string' && value ? value : fallback;
}
function normalizeSort(value) {
    if (value === false ||
        value === true ||
        value === 'none' ||
        value === 'value' ||
        value === 'name' ||
        value === 'asc' ||
        value === 'desc') {
        return value;
    }
    return undefined;
}
function assignDefined(target, key, value) {
    if (value !== undefined)
        target[key] = value;
}
function square(value) {
    return value * value;
}
function clamp(value, min, max) {
    if (min > max)
        return (min + max) / 2;
    return Math.min(Math.max(value, min), max);
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