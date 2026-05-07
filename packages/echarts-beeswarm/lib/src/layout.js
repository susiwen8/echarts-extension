const DEFAULT_WIDTH = 720;
const DEFAULT_HEIGHT = 460;
const DEFAULT_PADDING = 48;
const DEFAULT_TICK_COUNT = 5;
const DEFAULT_SYMBOL_SIZE = 12;
const DEFAULT_COLLISION_PADDING = 1;
const EPSILON = 1e-9;
export function resolveBeeswarmLayout(option = {}) {
    const layout = isPlainObject(option.layout) ? option.layout : {};
    const layoutOptions = isPlainObject(option.layoutOptions) ? option.layoutOptions : {};
    const merged = {
        ...layout,
        ...layoutOptions,
        width: finiteNumber(option.width, finiteNumber(layoutOptions.width, finiteNumber(layout.width, DEFAULT_WIDTH))),
        height: finiteNumber(option.height, finiteNumber(layoutOptions.height, finiteNumber(layout.height, DEFAULT_HEIGHT))),
        padding: readPaddingOption(option.padding ?? layoutOptions.padding ?? layout.padding),
        categoryField: readFieldOption(option.categoryField ?? layoutOptions.categoryField ?? layout.categoryField),
        valueField: readFieldOption(option.valueField ?? layoutOptions.valueField ?? layout.valueField),
        nameField: readFieldOption(option.nameField ?? layoutOptions.nameField ?? layout.nameField),
        dimensions: normalizeDimensions(option.dimensions ?? layoutOptions.dimensions ?? layout.dimensions),
        categories: normalizeCategories(option.categories ?? layoutOptions.categories ?? layout.categories),
        orient: readOrient(option.orient ?? layoutOptions.orient ?? layout.orient),
        min: finiteNumber(option.min, finiteNumber(layoutOptions.min, finiteNumber(layout.min, undefined))),
        max: finiteNumber(option.max, finiteNumber(layoutOptions.max, finiteNumber(layout.max, undefined))),
        tickCount: finiteNumber(option.tickCount, finiteNumber(layoutOptions.tickCount, finiteNumber(layout.tickCount, undefined))),
        nice: firstBoolean(option.nice, layoutOptions.nice, layout.nice),
        symbolSize: finiteNumber(option.symbolSize, finiteNumber(layoutOptions.symbolSize, finiteNumber(layout.symbolSize, undefined))),
        collisionPadding: finiteNumber(option.collisionPadding, finiteNumber(layoutOptions.collisionPadding, finiteNumber(layout.collisionPadding, undefined))),
        swarmRadius: finiteNumber(option.swarmRadius, finiteNumber(layoutOptions.swarmRadius, finiteNumber(layout.swarmRadius, undefined)))
    };
    return layoutBeeswarm(Array.isArray(option.data) ? option.data : [], merged);
}
export function layoutBeeswarm(data, options = {}) {
    const width = Math.max(1, finiteNumber(options.width, DEFAULT_WIDTH));
    const height = Math.max(1, finiteNumber(options.height, DEFAULT_HEIGHT));
    const padding = normalizePadding(options.padding);
    const orient = readOrient(options.orient) ?? 'horizontal';
    const plot = createPlotRect(width, height, padding);
    const normalized = normalizeItems(data, options);
    const categories = resolveCategories(normalized, options);
    const ordered = orderByCategory(normalized, categories);
    const valueExtent = resolveValueExtent(ordered, options);
    const tickCount = Math.max(2, Math.round(finiteNumber(options.tickCount, DEFAULT_TICK_COUNT)));
    const ticks = createTicks(valueExtent.min, valueExtent.max, tickCount).map((value) => createTick(value, valueExtent, plot, orient));
    const categoryLabels = categories.map((category, index) => createCategoryLabel(category, index, categories.length, plot, orient));
    const points = layoutPoints(ordered, categories, valueExtent, plot, orient, options);
    return {
        width,
        height,
        padding,
        orient,
        plot,
        categories,
        valueExtent,
        ticks,
        categoryLabels,
        points
    };
}
function normalizeItems(data, options) {
    const dimensions = normalizeDimensions(options.dimensions);
    const defaultRadius = Math.max(0, finiteNumber(options.symbolSize, DEFAULT_SYMBOL_SIZE)) / 2;
    const normalized = [];
    data.forEach((item, dataIndex) => {
        const categoryValue = readField(item, options.categoryField ?? 'category', dimensions, 0, ['group', 'region', 'name', 'label']);
        const value = finiteNumber(readField(item, options.valueField ?? 'value', dimensions, 1, [
            'score',
            'amount',
            'count',
            'population',
            'users',
            'total'
        ]), NaN);
        if (!Number.isFinite(value))
            return;
        const nameValue = readField(item, options.nameField ?? 'name', dimensions, 2, ['label']);
        const category = stringifyName(categoryValue ?? nameValue ?? `item-${dataIndex}`);
        if (!category)
            return;
        const name = stringifyName(nameValue ?? category);
        const record = isPlainObject(item) ? item : {};
        const itemSymbolSize = finiteNumber(record.symbolSize, defaultRadius * 2);
        normalized.push({
            id: stringifyName(record.id ?? `${category}-${dataIndex}`),
            name,
            category,
            categoryValue,
            value,
            radius: Math.max(0, itemSymbolSize / 2),
            dataIndex,
            raw: item
        });
    });
    return normalized;
}
function resolveCategories(items, options) {
    const explicit = normalizeCategories(options.categories);
    if (explicit.length)
        return explicit.filter((category) => items.some((item) => item.category === category));
    return unique(items.map((item) => item.category));
}
function orderByCategory(items, categories) {
    const order = new Map(categories.map((category, index) => [category, index]));
    return items
        .filter((item) => order.has(item.category))
        .sort((left, right) => {
        const leftOrder = order.get(left.category) ?? Number.MAX_SAFE_INTEGER;
        const rightOrder = order.get(right.category) ?? Number.MAX_SAFE_INTEGER;
        return leftOrder - rightOrder || left.dataIndex - right.dataIndex;
    });
}
function resolveValueExtent(items, options) {
    const values = items.map((item) => item.value).filter(Number.isFinite);
    let min = finiteNumber(options.min, values.length ? Math.min(...values) : 0);
    let max = finiteNumber(options.max, values.length ? Math.max(...values) : 1);
    if (Math.abs(max - min) < EPSILON) {
        min -= 1;
        max += 1;
    }
    if (options.nice !== false && (options.min == null || options.max == null)) {
        const nice = niceExtent(min, max, Math.max(2, Math.round(finiteNumber(options.tickCount, DEFAULT_TICK_COUNT))));
        if (options.min == null)
            min = nice.min;
        if (options.max == null)
            max = nice.max;
    }
    if (max < min)
        [min, max] = [max, min];
    if (Math.abs(max - min) < EPSILON)
        max = min + 1;
    return { min, max };
}
function createTicks(min, max, tickCount) {
    if (tickCount <= 1)
        return [cleanNumber(min), cleanNumber(max)];
    const step = (max - min) / (tickCount - 1);
    return Array.from({ length: tickCount }, (_, index) => cleanNumber(index === tickCount - 1 ? max : min + step * index));
}
function createTick(value, extent, plot, orient) {
    if (orient === 'vertical') {
        const y = projectValueToY(value, extent, plot);
        return {
            value,
            x: plot.left,
            y,
            x1: plot.left,
            x2: plot.right,
            y1: y,
            y2: y
        };
    }
    const x = projectValueToX(value, extent, plot);
    return {
        value,
        x,
        y: plot.bottom,
        x1: x,
        x2: x,
        y1: plot.top,
        y2: plot.bottom
    };
}
function createCategoryLabel(category, index, count, plot, orient) {
    if (orient === 'vertical') {
        return {
            name: category,
            value: category,
            x: projectCategory(index, count, plot, orient),
            y: plot.bottom + 14,
            align: 'center',
            verticalAlign: 'top'
        };
    }
    return {
        name: category,
        value: category,
        x: plot.left - 14,
        y: projectCategory(index, count, plot, orient),
        align: 'right',
        verticalAlign: 'middle'
    };
}
function layoutPoints(items, categories, extent, plot, orient, options) {
    const byCategory = new Map();
    items.forEach((item) => {
        const group = byCategory.get(item.category) || [];
        group.push(item);
        byCategory.set(item.category, group);
    });
    const result = [];
    const categoryBand = orient === 'vertical'
        ? plot.width / Math.max(categories.length, 1)
        : plot.height / Math.max(categories.length, 1);
    const defaultSwarmRadius = Math.max(0, categoryBand * 0.44 - maxRadius(items));
    const swarmRadius = Math.max(0, finiteNumber(options.swarmRadius, defaultSwarmRadius));
    const collisionPadding = Math.max(0, finiteNumber(options.collisionPadding, DEFAULT_COLLISION_PADDING));
    categories.forEach((category, categoryIndex) => {
        const group = (byCategory.get(category) || [])
            .slice()
            .sort((left, right) => left.value - right.value || left.dataIndex - right.dataIndex);
        const placed = [];
        const categoryCoord = projectCategory(categoryIndex, categories.length, plot, orient);
        group.forEach((item) => {
            const valueCoord = orient === 'vertical'
                ? projectValueToY(item.value, extent, plot)
                : projectValueToX(item.value, extent, plot);
            const minDistance = item.radius * 2 + collisionPadding;
            const offset = chooseSwarmOffset(valueCoord, item.radius, minDistance, swarmRadius, placed);
            const centerX = orient === 'vertical' ? categoryCoord : valueCoord;
            const centerY = orient === 'vertical' ? valueCoord : categoryCoord;
            const point = {
                id: item.id,
                name: item.name,
                category: item.category,
                categoryValue: item.categoryValue,
                value: item.value,
                radius: item.radius,
                x: orient === 'vertical' ? centerX + offset : centerX,
                y: orient === 'vertical' ? centerY : centerY + offset,
                centerX,
                centerY,
                offset,
                dataIndex: item.dataIndex,
                raw: item.raw,
                axisCoord: valueCoord
            };
            placed.push(point);
            result.push(point);
        });
    });
    return result;
}
function chooseSwarmOffset(valueCoord, radius, minDistance, maxOffset, placed) {
    const candidates = createOffsetCandidates(maxOffset, Math.max(1, Math.min(minDistance, Math.max(radius, 1))));
    let fallback = candidates[0] ?? 0;
    let fallbackScore = Number.POSITIVE_INFINITY;
    for (const candidate of candidates) {
        const score = collisionScore(valueCoord, candidate, radius, minDistance, placed);
        if (score <= EPSILON)
            return candidate;
        if (score < fallbackScore - EPSILON || (Math.abs(score - fallbackScore) <= EPSILON && Math.abs(candidate) < Math.abs(fallback))) {
            fallback = candidate;
            fallbackScore = score;
        }
    }
    return fallback;
}
function createOffsetCandidates(maxOffset, step) {
    const limit = Math.max(0, maxOffset);
    const candidates = [0];
    if (limit <= EPSILON)
        return candidates;
    for (let offset = step; offset <= limit + EPSILON; offset += step) {
        const cleanOffset = cleanNumber(Math.min(offset, limit));
        candidates.push(cleanOffset, -cleanOffset);
        if (cleanOffset >= limit - EPSILON)
            break;
    }
    return candidates;
}
function collisionScore(valueCoord, offset, radius, minDistance, placed) {
    let score = 0;
    placed.forEach((point) => {
        const requiredDistance = Math.max(minDistance, radius + point.radius);
        const axisDelta = Math.abs(valueCoord - point.axisCoord);
        if (axisDelta >= requiredDistance)
            return;
        const requiredOffset = Math.sqrt(Math.max(0, requiredDistance ** 2 - axisDelta ** 2));
        const offsetDelta = Math.abs(offset - point.offset);
        const overlap = Math.max(0, requiredOffset - offsetDelta);
        score += overlap ** 2;
    });
    return score;
}
function maxRadius(items) {
    return items.reduce((max, item) => Math.max(max, item.radius), 0);
}
function projectCategory(index, count, plot, orient) {
    const span = orient === 'vertical' ? plot.width : plot.height;
    const start = orient === 'vertical' ? plot.left : plot.top;
    if (count <= 0)
        return start + span / 2;
    return start + span * ((index + 0.5) / count);
}
function projectValueToX(value, extent, plot) {
    const ratio = (value - extent.min) / Math.max(extent.max - extent.min, EPSILON);
    return plot.left + clamp(ratio, 0, 1) * plot.width;
}
function projectValueToY(value, extent, plot) {
    const ratio = (value - extent.min) / Math.max(extent.max - extent.min, EPSILON);
    return plot.bottom - clamp(ratio, 0, 1) * plot.height;
}
function createPlotRect(width, height, padding) {
    const left = clamp(padding.left, 0, Math.max(width - 1, 0));
    const top = clamp(padding.top, 0, Math.max(height - 1, 0));
    const right = Math.max(left + 1, width - Math.max(0, padding.right));
    const bottom = Math.max(top + 1, height - Math.max(0, padding.bottom));
    return {
        left,
        top,
        right,
        bottom,
        width: Math.max(1, right - left),
        height: Math.max(1, bottom - top)
    };
}
function normalizePadding(value) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        const padding = Math.max(0, value);
        return {
            top: padding,
            right: padding,
            bottom: padding,
            left: padding
        };
    }
    if (isPlainObject(value)) {
        return {
            top: Math.max(0, finiteNumber(value.top, DEFAULT_PADDING)),
            right: Math.max(0, finiteNumber(value.right, DEFAULT_PADDING)),
            bottom: Math.max(0, finiteNumber(value.bottom, DEFAULT_PADDING)),
            left: Math.max(0, finiteNumber(value.left, DEFAULT_PADDING))
        };
    }
    return {
        top: DEFAULT_PADDING,
        right: DEFAULT_PADDING,
        bottom: DEFAULT_PADDING,
        left: DEFAULT_PADDING
    };
}
function readPaddingOption(value) {
    if (typeof value === 'number' && Number.isFinite(value))
        return value;
    if (isPlainObject(value)) {
        return {
            top: finiteNumber(value.top, undefined),
            right: finiteNumber(value.right, undefined),
            bottom: finiteNumber(value.bottom, undefined),
            left: finiteNumber(value.left, undefined)
        };
    }
    return undefined;
}
function readField(item, field, dimensions, fallbackIndex, fallbackNames) {
    if (Array.isArray(item)) {
        const index = typeof field === 'number' ? field : dimensions?.indexOf(field);
        const resolvedIndex = index != null && index >= 0 ? index : fallbackIndex;
        return resolvedIndex >= 0 ? item[resolvedIndex] : undefined;
    }
    if (!isPlainObject(item))
        return undefined;
    if (typeof field === 'string' && item[field] != null)
        return item[field];
    if (typeof field === 'number')
        return undefined;
    for (const fallbackName of fallbackNames) {
        if (item[fallbackName] != null)
            return item[fallbackName];
    }
    return undefined;
}
function niceExtent(min, max, tickCount) {
    const span = Math.max(max - min, EPSILON);
    const step = niceStep(span / Math.max(1, tickCount - 1));
    return {
        min: Math.floor(min / step) * step,
        max: Math.ceil(max / step) * step
    };
}
function niceStep(rawStep) {
    const exponent = Math.floor(Math.log10(Math.max(rawStep, EPSILON)));
    const power = 10 ** exponent;
    const fraction = rawStep / power;
    let niceFraction = 10;
    if (fraction <= 1)
        niceFraction = 1;
    else if (fraction <= 2)
        niceFraction = 2;
    else if (fraction <= 5)
        niceFraction = 5;
    return niceFraction * power;
}
function normalizeDimensions(value) {
    return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : undefined;
}
function normalizeCategories(value) {
    return Array.isArray(value) ? value.map((item) => stringifyName(item)).filter(Boolean) : [];
}
function readFieldOption(value) {
    return typeof value === 'string' || typeof value === 'number' ? value : undefined;
}
function readOrient(value) {
    return value === 'vertical' || value === 'horizontal' ? value : undefined;
}
function firstBoolean(...values) {
    return values.find((value) => typeof value === 'boolean');
}
function unique(values) {
    const result = [];
    const seen = new Set();
    values.forEach((value) => {
        if (seen.has(value))
            return;
        seen.add(value);
        result.push(value);
    });
    return result;
}
function stringifyName(value) {
    if (typeof value === 'string' && value.length)
        return value;
    if (typeof value === 'number' && Number.isFinite(value))
        return String(value);
    return '';
}
function finiteNumber(value, fallback) {
    if (typeof value === 'number' && Number.isFinite(value))
        return value;
    if (typeof value === 'string' && value.trim()) {
        const parsed = Number(value);
        if (Number.isFinite(parsed))
            return parsed;
    }
    return fallback;
}
function cleanNumber(value) {
    const rounded = Number(value.toFixed(12));
    return Object.is(rounded, -0) ? 0 : rounded;
}
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
function isPlainObject(value) {
    return value != null && typeof value === 'object' && !Array.isArray(value);
}
//# sourceMappingURL=layout.js.map