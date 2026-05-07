export const DEFAULT_PALETTE = [
    '#4e79a7',
    '#f28e8c',
    '#59a14f',
    '#b07aa1',
    '#f2b447',
    '#76b7b2',
    '#e15759',
    '#8cd17d',
    '#9c755f',
    '#bab0ab'
];
const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 400;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
export function resolveVennLayout(option = {}) {
    const data = Array.isArray(option.data) ? option.data : [];
    const layoutOption = option.layout;
    const layoutOptions = {
        ...(isPlainObject(layoutOption) ? layoutOption : {}),
        ...(isPlainObject(option.layoutOptions) ? option.layoutOptions : {}),
        width: finiteNumber(option.width, undefined),
        height: finiteNumber(option.height, undefined),
        padding: finiteNumber(option.padding, undefined),
        minRadius: finiteNumber(option.minRadius, undefined),
        maxRadius: finiteNumber(option.maxRadius, undefined)
    };
    const mode = resolveMode(option, data);
    return mode === 'bubble'
        ? layoutBubbleVenn(data, layoutOptions)
        : layoutHollowVenn(data, layoutOptions);
}
export function layoutHollowVenn(data, options = {}) {
    const width = finiteNumber(options.width, DEFAULT_WIDTH);
    const height = finiteNumber(options.height, DEFAULT_HEIGHT);
    const padding = finiteNumber(options.padding, 24);
    const items = normalizeItems(data);
    const baseSets = resolveBaseSets(items).slice(0, 3);
    const circleCount = Math.max(1, Math.min(3, baseSets.length || items.length || 1));
    const circles = createHollowCircles(circleCount, baseSets, {
        width,
        height,
        padding
    });
    const labels = createHollowLabels(items, circles, {
        width,
        height
    });
    return {
        mode: 'hollow',
        width,
        height,
        circles,
        labels
    };
}
export function layoutBubbleVenn(data, options = {}) {
    const width = finiteNumber(options.width, DEFAULT_WIDTH);
    const height = finiteNumber(options.height, DEFAULT_HEIGHT);
    const padding = finiteNumber(options.padding, 20);
    const innerWidth = Math.max(width - padding * 2, 1);
    const innerHeight = Math.max(height - padding * 2, 1);
    const minRadius = finiteNumber(options.minRadius, Math.max(12, Math.min(innerWidth, innerHeight) * 0.045));
    const maxRadius = finiteNumber(options.maxRadius, Math.max(minRadius, Math.min(innerWidth, innerHeight) * 0.22));
    const items = normalizeItems(data);
    const maxValue = Math.max(...items.map((item) => positiveNumber(item.value, 1)), 1);
    const center = {
        x: width / 2,
        y: height / 2
    };
    const circles = items
        .map((item) => ({
        ...item,
        r: resolveBubbleRadius(item.value, maxValue, minRadius, maxRadius)
    }))
        .sort((left, right) => {
        const valueDiff = positiveNumber(right.value, 0) - positiveNumber(left.value, 0);
        return valueDiff || left.dataIndex - right.dataIndex;
    })
        .map((item, sortedIndex) => {
        const point = placeBubble(sortedIndex, item.r, center, {
            width,
            height,
            padding,
            maxRadius
        });
        return {
            id: item.id,
            name: item.name,
            value: item.value,
            dataIndex: item.dataIndex,
            x: point.x,
            y: point.y,
            r: item.r,
            color: item.color
        };
    });
    return {
        mode: 'bubble',
        width,
        height,
        circles,
        labels: circles.map((circle) => ({
            id: circle.id,
            name: circle.name,
            value: circle.value,
            dataIndex: circle.dataIndex,
            x: circle.x,
            y: circle.y
        }))
    };
}
function resolveMode(option, data) {
    const layout = option.layout;
    const rawMode = typeof layout === 'string'
        ? layout
        : option.vennType || option.mode || (isPlainObject(layout) ? layout.type : undefined);
    if (rawMode === 'bubble' || rawMode === 'packed' || rawMode === 'circle')
        return 'bubble';
    if (rawMode === 'hollow' || rawMode === 'venn' || rawMode === 'outline')
        return 'hollow';
    return data.some((item) => isPlainObject(item) && Array.isArray(item.sets)) ? 'hollow' : 'bubble';
}
function createHollowCircles(count, baseSets, rect) {
    if (count === 1)
        return createOneSetCircles(baseSets, rect);
    if (count === 2)
        return createTwoSetCircles(baseSets, rect);
    return createThreeSetCircles(baseSets, rect);
}
function createOneSetCircles(baseSets, { width, height, padding }) {
    const id = baseSets[0] || 'A';
    const r = Math.max(1, Math.min(width - padding * 2, height - padding * 2) / 2);
    return [
        {
            id,
            name: id,
            sets: [id],
            setKey: id,
            dataIndex: -1,
            x: width / 2,
            y: height / 2,
            r
        }
    ];
}
function createTwoSetCircles(baseSets, { width, height, padding }) {
    const ids = fillSetNames(baseSets, 2);
    const innerWidth = Math.max(width - padding * 2, 1);
    const innerHeight = Math.max(height - padding * 2, 1);
    const r = Math.max(1, Math.min(innerWidth * 0.34, innerHeight * 0.44));
    const distance = Math.min(r * 1.15, innerWidth - r * 2);
    const cy = height / 2;
    return ids.map((id, index) => ({
        id,
        name: id,
        sets: [id],
        setKey: id,
        dataIndex: -1,
        x: width / 2 + (index === 0 ? -distance / 2 : distance / 2),
        y: cy,
        r
    }));
}
function createThreeSetCircles(baseSets, { width, height, padding }) {
    const ids = fillSetNames(baseSets, 3);
    const innerWidth = Math.max(width - padding * 2, 1);
    const innerHeight = Math.max(height - padding * 2, 1);
    const cx = width / 2;
    const cy = height / 2;
    const radiusBounds = [
        innerWidth * 0.29,
        innerHeight * 0.38,
        (width - padding - cx) / 1.75,
        (cx - padding) / 1.75,
        (height - padding - cy) / 1.55,
        (cy - padding) / 1.35
    ];
    const r = Math.max(1, Math.min(...radiusBounds.filter((value) => value > 0)));
    const horizontal = r * 0.72;
    const topOffset = r * 0.32;
    const bottomOffset = r * 0.55;
    const points = [
        [cx - horizontal, cy - topOffset],
        [cx + horizontal, cy - topOffset],
        [cx, cy + bottomOffset]
    ];
    return ids.map((id, index) => ({
        id,
        name: id,
        sets: [id],
        setKey: id,
        dataIndex: -1,
        x: points[index][0],
        y: points[index][1],
        r
    }));
}
function createHollowLabels(items, circles, { width, height }) {
    const bySetKey = new Map(circles.map((circle) => [circle.setKey, circle]));
    const circleById = new Map(circles.map((circle) => [circle.id, circle]));
    const fallbackNames = circles.map((circle) => circle.id);
    return items.map((item) => {
        const sets = item.sets.length ? item.sets : [fallbackNames[item.dataIndex] || item.name];
        const setKey = createSetKey(sets);
        const point = resolveHollowLabelPoint(sets, setKey, bySetKey, circleById, {
            width,
            height
        });
        return {
            id: item.id,
            name: item.name,
            value: item.value,
            sets,
            setKey,
            dataIndex: item.dataIndex,
            x: point.x,
            y: point.y
        };
    });
}
function resolveHollowLabelPoint(sets, setKey, bySetKey, circleById, rect) {
    const direct = bySetKey.get(setKey);
    if (direct) {
        if (bySetKey.size === 1)
            return { x: direct.x, y: direct.y };
        if (bySetKey.size === 2) {
            const offset = direct.x < rect.width / 2 ? -direct.r * 0.36 : direct.r * 0.36;
            return { x: direct.x + offset, y: direct.y };
        }
        const horizontal = direct.x < rect.width / 2 ? -direct.r * 0.38 : direct.x > rect.width / 2 ? direct.r * 0.38 : 0;
        const vertical = direct.y > rect.height / 2 ? direct.r * 0.42 : -direct.r * 0.06;
        return { x: direct.x + horizontal, y: direct.y + vertical };
    }
    const selected = sets.map((set) => circleById.get(set)).filter((circle) => Boolean(circle));
    if (!selected.length)
        return { x: rect.width / 2, y: rect.height / 2 };
    if (selected.length === 2) {
        const x = mean(selected.map((circle) => circle.x));
        const y = mean(selected.map((circle) => circle.y));
        const [first, second] = selected;
        const minR = Math.min(first.r, second.r);
        if (bySetKey.size === 3) {
            if (first.y < rect.height / 2 && second.y < rect.height / 2) {
                return { x, y: y - minR * 0.28 };
            }
            return {
                x: x + (x < rect.width / 2 ? -minR * 0.14 : minR * 0.14),
                y: y + minR * 0.1
            };
        }
        return { x, y };
    }
    return {
        x: mean(selected.map((circle) => circle.x)),
        y: mean(selected.map((circle) => circle.y)) + Math.min(...selected.map((circle) => circle.r)) * 0.08
    };
}
function resolveBaseSets(items) {
    const base = [];
    items.forEach((item) => {
        if (item.sets.length === 1 && !base.includes(item.sets[0]))
            base.push(item.sets[0]);
    });
    items.forEach((item) => {
        item.sets.forEach((set) => {
            if (!base.includes(set))
                base.push(set);
        });
    });
    return base;
}
function normalizeItems(data) {
    return (Array.isArray(data) ? data : []).map((item, dataIndex) => {
        const record = isPlainObject(item) ? item : {};
        const name = String(record.name ?? record.id ?? dataIndex);
        const sets = normalizeSets(record.sets);
        const rawValue = record.value;
        const itemStyle = isPlainObject(record.itemStyle) ? record.itemStyle : {};
        const color = typeof itemStyle.color === 'string'
            ? itemStyle.color
            : DEFAULT_PALETTE[dataIndex % DEFAULT_PALETTE.length];
        return {
            id: String(record.id ?? name),
            name,
            value: Array.isArray(rawValue) ? rawValue[0] : rawValue,
            sets,
            setKey: createSetKey(sets),
            dataIndex,
            color
        };
    });
}
function normalizeSets(sets) {
    if (!Array.isArray(sets))
        return [];
    return Array.from(new Set(sets.map((set) => String(set))));
}
function createSetKey(sets) {
    return sets.slice().sort().join('&');
}
function fillSetNames(baseSets, count) {
    const fallback = ['A', 'B', 'C'];
    const names = baseSets.slice(0, count);
    while (names.length < count)
        names.push(fallback[names.length]);
    return names;
}
function resolveBubbleRadius(value, maxValue, minRadius, maxRadius) {
    const scale = Math.sqrt(positiveNumber(value, 0) / maxValue);
    return minRadius + (maxRadius - minRadius) * scale;
}
function placeBubble(index, radius, center, options) {
    if (index === 0) {
        return clampCircle(center.x, center.y, radius, options);
    }
    const distance = options.maxRadius * (0.46 + Math.sqrt(index) * 0.38) + radius * 0.48;
    const angle = index * GOLDEN_ANGLE - Math.PI / 7;
    const x = center.x + Math.cos(angle) * distance;
    const y = center.y + Math.sin(angle) * distance * 0.78;
    return clampCircle(x, y, radius, options);
}
function clampCircle(x, y, r, { width, height, padding }) {
    return {
        x: clamp(x, padding + r, width - padding - r),
        y: clamp(y, padding + r, height - padding - r)
    };
}
function clamp(value, min, max) {
    if (min > max)
        return (min + max) / 2;
    return Math.min(Math.max(value, min), max);
}
function mean(values) {
    return values.reduce((sum, value) => sum + value, 0) / values.length;
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
//# sourceMappingURL=layout.js.map