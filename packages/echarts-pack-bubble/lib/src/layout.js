export const DEFAULT_PACK_BUBBLE_COLORS = [
    '#2f80b7',
    '#81439a',
    '#238c48',
    '#a64a2b',
    '#4c6384',
    '#9c9417',
    '#18a06a',
    '#1f93ce',
    '#d45b2b',
    '#b657f0'
];
const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 400;
const DEFAULT_PADDING = 20;
const DEFAULT_FILL_RATIO = 0.66;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const EPSILON = 1e-6;
class FrontChainNode {
    constructor(circle) {
        this.circle = circle;
        this.next = this;
        this.previous = this;
    }
}
export function resolvePackBubbleLayout(option = {}) {
    const data = Array.isArray(option.data) ? option.data : [];
    const layoutOptions = {
        ...(isPlainObject(option.layout) ? option.layout : {}),
        ...(isPlainObject(option.layoutOptions) ? option.layoutOptions : {}),
        width: finiteNumber(option.width, undefined),
        height: finiteNumber(option.height, undefined)
    };
    assignDefined(layoutOptions, 'padding', option.padding);
    assignDefined(layoutOptions, 'gap', finiteNumber(option.gap, undefined));
    assignDefined(layoutOptions, 'minRadius', finiteNumber(option.minRadius, undefined));
    assignDefined(layoutOptions, 'maxRadius', finiteNumber(option.maxRadius, undefined));
    assignDefined(layoutOptions, 'fillRatio', finiteNumber(option.fillRatio, undefined));
    assignDefined(layoutOptions, 'center', Array.isArray(option.center) ? option.center : undefined);
    assignDefined(layoutOptions, 'valueField', typeof option.valueField === 'string' ? option.valueField : undefined);
    assignDefined(layoutOptions, 'nameField', typeof option.nameField === 'string' ? option.nameField : undefined);
    assignDefined(layoutOptions, 'categoryField', typeof option.categoryField === 'string' ? option.categoryField : undefined);
    assignDefined(layoutOptions, 'sort', option.sort);
    assignDefined(layoutOptions, 'colors', Array.isArray(option.colors) ? option.colors.filter((color) => typeof color === 'string') : undefined);
    return layoutPackBubble(data, layoutOptions);
}
export function layoutPackBubble(data, options = {}) {
    const width = finiteNumber(options.width, DEFAULT_WIDTH);
    const height = finiteNumber(options.height, DEFAULT_HEIGHT);
    const padding = resolvePadding(options.padding);
    const inner = resolveInnerRect(width, height, padding);
    const colors = options.colors?.length ? options.colors : DEFAULT_PACK_BUBBLE_COLORS;
    const items = normalizeItems(data, options, colors);
    const circles = createWorkingCircles(items, options, inner);
    const sorted = sortWorkingCircles(circles, options.sort);
    const gap = Math.max(0, finiteNumber(options.gap, 2));
    const targetCenter = resolveCenter(options.center, width, height, inner);
    const positioned = shouldUseFastPack(sorted.length, options)
        ? layoutFastGrid(sorted, gap, inner, targetCenter)
        : layoutPackedCircles(sorted, gap, inner, targetCenter);
    return {
        width,
        height,
        center: targetCenter,
        circles: positioned.map((circle) => ({
            id: circle.id,
            name: circle.name,
            value: circle.value,
            category: circle.category,
            dataIndex: circle.dataIndex,
            x: circle.x,
            y: circle.y,
            r: circle.r,
            color: circle.color,
            raw: circle.raw
        })),
        labels: positioned.map((circle) => ({
            id: circle.id,
            name: circle.name,
            value: circle.value,
            category: circle.category,
            dataIndex: circle.dataIndex,
            x: circle.x,
            y: circle.y,
            r: circle.r,
            maxWidth: circle.r * 1.62,
            raw: circle.raw
        }))
    };
}
function shouldUseFastPack(length, options) {
    if (options.fast === true)
        return true;
    if (options.fast === false)
        return false;
    return length > Math.max(1, finiteNumber(options.fastThreshold, 1200));
}
function layoutPackedCircles(circles, gap, inner, targetCenter) {
    packFrontChain(circles, gap);
    resolveCollisions(circles);
    return fitCircles(circles, inner, targetCenter);
}
function layoutFastGrid(circles, gap, inner, targetCenter) {
    if (!circles.length)
        return [];
    circles.forEach((circle) => {
        circle.packRadius = circle.r + gap / 2;
    });
    const aspect = inner.width / Math.max(inner.height, 1);
    const columns = Math.max(1, Math.ceil(Math.sqrt(circles.length * aspect)));
    const rows = Math.max(1, Math.ceil(circles.length / columns));
    const cellWidth = inner.width / columns;
    const cellHeight = inner.height / rows;
    const maxPackRadius = circles.reduce((max, circle) => Math.max(max, circle.packRadius), 0);
    const scale = maxPackRadius > 0
        ? Math.min(1, (Math.min(cellWidth, cellHeight) / 2) / maxPackRadius)
        : 1;
    const gridWidth = columns * cellWidth;
    const gridHeight = rows * cellHeight;
    const origin = resolveFastGridOrigin(inner, targetCenter, gridWidth, gridHeight);
    return circles.map((circle, index) => {
        const column = index % columns;
        const row = Math.floor(index / columns);
        const fittedRadius = circle.r * scale;
        const fittedPackRadius = circle.packRadius * scale;
        return {
            ...circle,
            x: origin.x + (column + 0.5) * cellWidth,
            y: origin.y + (row + 0.5) * cellHeight,
            r: fittedRadius,
            packRadius: fittedPackRadius
        };
    });
}
function resolveFastGridOrigin(inner, center, gridWidth, gridHeight) {
    return {
        x: clamp(center.x - gridWidth / 2, inner.x, inner.x + inner.width - gridWidth),
        y: clamp(center.y - gridHeight / 2, inner.y, inner.y + inner.height - gridHeight)
    };
}
function normalizeItems(data, options, colors) {
    const valueField = typeof options.valueField === 'string' && options.valueField ? options.valueField : 'value';
    const nameField = typeof options.nameField === 'string' && options.nameField ? options.nameField : 'name';
    const categoryField = typeof options.categoryField === 'string' && options.categoryField ? options.categoryField : 'category';
    const categoryColors = new Map();
    return data.map((item, dataIndex) => {
        const record = isPlainObject(item) ? item : { value: item };
        const rawValue = readField(record, valueField) ?? record.value;
        const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
        const name = String(readField(record, nameField) ?? record.name ?? record.label ?? record.id ?? dataIndex);
        const categoryValue = readField(record, categoryField) ?? record.category ?? record.group;
        const category = categoryValue == null ? undefined : String(categoryValue);
        const itemStyle = isPlainObject(record.itemStyle) ? record.itemStyle : {};
        const color = typeof itemStyle.color === 'string'
            ? itemStyle.color
            : resolveCategoryColor(category, dataIndex, colors, categoryColors);
        return {
            id: String(record.id ?? name),
            name,
            value,
            numericValue: positiveNumber(value, 0),
            category,
            dataIndex,
            color,
            raw: item
        };
    });
}
function resolveCategoryColor(category, dataIndex, colors, categoryColors) {
    if (!category)
        return colors[dataIndex % colors.length];
    const existing = categoryColors.get(category);
    if (existing)
        return existing;
    const color = colors[categoryColors.size % colors.length];
    categoryColors.set(category, color);
    return color;
}
function createWorkingCircles(items, options, inner) {
    const minDimension = Math.max(1, Math.min(inner.width, inner.height));
    const minRadius = Math.max(0, finiteNumber(options.minRadius, Math.max(3, minDimension * 0.012)));
    const defaultMaxRadiusRatio = items.length <= 2 ? 0.36 : items.length <= 8 ? 0.18 : 0.12;
    const maxRadius = Math.max(minRadius, finiteNumber(options.maxRadius, Math.max(minRadius, minDimension * defaultMaxRadiusRatio)));
    const fillRatio = clamp(finiteNumber(options.fillRatio, DEFAULT_FILL_RATIO), 0.12, 0.9);
    const totalValue = Math.max(items.reduce((sum, item) => sum + positiveNumber(item.numericValue, 0), 0), items.length || 1);
    const areaScale = Math.sqrt(Math.max(inner.width * inner.height * fillRatio, 1) / (Math.PI * totalValue));
    return items.map((item) => {
        const radius = item.numericValue > 0 ? Math.sqrt(item.numericValue) * areaScale : minRadius;
        const r = clamp(radius, minRadius, maxRadius);
        return {
            ...item,
            x: 0,
            y: 0,
            r,
            packRadius: r
        };
    });
}
function sortWorkingCircles(circles, sort) {
    const sorted = circles.slice();
    if (sort === false || sort === 'none')
        return sorted;
    const direction = sort === 'asc' ? 1 : -1;
    sorted.sort((left, right) => {
        const radiusDiff = left.r - right.r;
        return radiusDiff ? radiusDiff * direction : left.dataIndex - right.dataIndex;
    });
    return sorted;
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
    let a = new FrontChainNode(circles[0]);
    let b = new FrontChainNode(circles[1]);
    const c = new FrontChainNode(circles[2]);
    a.next = c;
    c.previous = a;
    c.next = b;
    b.previous = c;
    b.next = a;
    a.previous = b;
    pack: for (let index = 3; index < circles.length; index += 1) {
        const circle = circles[index];
        placeTangent(a.circle, b.circle, circle);
        const node = new FrontChainNode(circle);
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
                let distance = Math.sqrt(dx * dx + dy * dy);
                const targetDistance = left.packRadius + right.packRadius;
                const overlap = targetDistance - distance;
                if (overlap <= 0)
                    continue;
                if (distance <= EPSILON) {
                    const angle = (leftIndex * 13 + rightIndex * 17 + 1) * GOLDEN_ANGLE;
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
function square(value) {
    return value * value;
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
function fitCircles(circles, inner, center) {
    if (!circles.length)
        return [];
    const bounds = measureBounds(circles);
    const scale = Math.min(1, inner.width / Math.max(bounds.width, 1), inner.height / Math.max(bounds.height, 1));
    const boundsCenter = {
        x: (bounds.minX + bounds.maxX) / 2,
        y: (bounds.minY + bounds.maxY) / 2
    };
    const fitted = circles.map((circle) => ({
        ...circle,
        x: center.x + (circle.x - boundsCenter.x) * scale,
        y: center.y + (circle.y - boundsCenter.y) * scale,
        r: circle.r * scale,
        packRadius: circle.packRadius * scale
    }));
    const finalBounds = measureBounds(fitted);
    const offset = resolveFitOffset(finalBounds, inner);
    fitted.forEach((circle) => {
        circle.x += offset.x;
        circle.y += offset.y;
    });
    return fitted;
}
function resolveFitOffset(bounds, inner) {
    let x = 0;
    let y = 0;
    if (bounds.minX < inner.x)
        x = inner.x - bounds.minX;
    if (bounds.maxX > inner.x + inner.width)
        x = inner.x + inner.width - bounds.maxX;
    if (bounds.minY < inner.y)
        y = inner.y - bounds.minY;
    if (bounds.maxY > inner.y + inner.height)
        y = inner.y + inner.height - bounds.maxY;
    return { x, y };
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
function resolveInnerRect(width, height, padding) {
    const x = clamp(padding.left, 0, Math.max(width, 0));
    const y = clamp(padding.top, 0, Math.max(height, 0));
    return {
        x,
        y,
        width: Math.max(width - padding.left - padding.right, 1),
        height: Math.max(height - padding.top - padding.bottom, 1)
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
function assignDefined(target, key, value) {
    if (value !== undefined)
        target[key] = value;
}
function clamp(value, min, max) {
    if (min > max)
        return (min + max) / 2;
    return Math.min(Math.max(value, min), max);
}
function positiveNumber(value, fallback) {
    return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;
}
function finiteNumber(value, fallback) {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
function isPlainObject(value) {
    return value != null && typeof value === 'object' && !Array.isArray(value);
}
export function createDemoPackBubbleData() {
    const countries = [
        ['China', 1412, 'Asia'],
        ['India', 1408, 'Asia'],
        ['USA', 335, 'North America'],
        ['Indonesia', 281, 'Asia'],
        ['Pakistan', 252, 'Asia'],
        ['Nigeria', 236, 'Africa'],
        ['Brazil', 212, 'South America'],
        ['Bangladesh', 173, 'Asia'],
        ['Russia', 146, 'Europe'],
        ['Mexico', 130, 'North America'],
        ['Japan', 124, 'Asia'],
        ['Ethiopia', 132, 'Africa'],
        ['Philippines', 115, 'Asia'],
        ['Egypt', 114, 'Africa'],
        ['Vietnam', 101, 'Asia'],
        ['Germany', 84, 'Europe'],
        ['Turkey', 85, 'Europe'],
        ['Iran', 90, 'Asia'],
        ['Thailand', 72, 'Asia'],
        ['United Kingdom', 69, 'Europe'],
        ['France', 68, 'Europe'],
        ['Italy', 59, 'Europe'],
        ['South Africa', 63, 'Africa'],
        ['Tanzania', 69, 'Africa'],
        ['Myanmar', 55, 'Asia'],
        ['Kenya', 56, 'Africa'],
        ['Korea', 52, 'Asia'],
        ['Colombia', 52, 'South America'],
        ['Spain', 48, 'Europe'],
        ['Argentina', 46, 'South America'],
        ['Algeria', 46, 'Africa'],
        ['Sudan', 50, 'Africa'],
        ['Ukraine', 37, 'Europe'],
        ['Canada', 40, 'North America'],
        ['Poland', 38, 'Europe'],
        ['Morocco', 38, 'Africa'],
        ['Saudi Arabia', 37, 'Asia'],
        ['Malaysia', 34, 'Asia'],
        ['Peru', 34, 'South America'],
        ['Australia', 27, 'Oceania'],
        ['Taiwan', 24, 'Asia']
    ];
    const extra = Array.from({ length: 58 }, (_, index) => ({
        name: `City ${index + 1}`,
        value: 7 + ((index * 17) % 31),
        category: ['Europe', 'Asia', 'Africa', 'North America', 'South America'][index % 5]
    }));
    return countries
        .map(([name, value, category]) => ({
        name: String(name),
        value: Number(value),
        category: String(category)
    }))
        .concat(extra);
}
//# sourceMappingURL=layout.js.map