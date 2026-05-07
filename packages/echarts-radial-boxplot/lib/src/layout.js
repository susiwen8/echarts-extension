const DEFAULT_WIDTH = 720;
const DEFAULT_HEIGHT = 720;
const DEFAULT_PADDING = 28;
const DEFAULT_INNER_RADIUS = '18%';
const DEFAULT_OUTER_RADIUS = '88%';
const DEFAULT_TICK_COUNT = 5;
const DEFAULT_BOX_WIDTH = 0.58;
const DEFAULT_CAP_WIDTH = 0.34;
export function resolveRadialBoxplotLayout(option = {}) {
    const layout = isPlainObject(option.layout) ? option.layout : {};
    const layoutOptions = isPlainObject(option.layoutOptions) ? option.layoutOptions : {};
    const merged = {
        ...layout,
        ...layoutOptions,
        width: finiteNumber(option.width, finiteNumber(layoutOptions.width, finiteNumber(layout.width, DEFAULT_WIDTH))),
        height: finiteNumber(option.height, finiteNumber(layoutOptions.height, finiteNumber(layout.height, DEFAULT_HEIGHT))),
        padding: finiteNumber(option.padding, finiteNumber(layoutOptions.padding, finiteNumber(layout.padding, DEFAULT_PADDING))),
        center: readTuple(option.center, readTuple(layoutOptions.center, readTuple(layout.center, undefined))),
        radius: readTuple(option.radius, readTuple(layoutOptions.radius, readTuple(layout.radius, undefined))),
        innerRadius: readRadiusOption(option.innerRadius ?? layoutOptions.innerRadius ?? layout.innerRadius),
        outerRadius: readRadiusOption(option.outerRadius ?? layoutOptions.outerRadius ?? layout.outerRadius),
        startAngle: finiteNumber(option.startAngle, finiteNumber(layoutOptions.startAngle, finiteNumber(layout.startAngle, undefined))),
        endAngle: finiteNumber(option.endAngle, finiteNumber(layoutOptions.endAngle, finiteNumber(layout.endAngle, undefined))),
        angleSpan: finiteNumber(option.angleSpan, finiteNumber(layoutOptions.angleSpan, finiteNumber(layout.angleSpan, undefined))),
        clockwise: firstBoolean(option.clockwise, layoutOptions.clockwise, layout.clockwise),
        categoryField: readFieldOption(option.categoryField ?? layoutOptions.categoryField ?? layout.categoryField),
        nameField: readFieldOption(option.nameField ?? layoutOptions.nameField ?? layout.nameField),
        minField: readFieldOption(option.minField ?? layoutOptions.minField ?? layout.minField),
        q1Field: readFieldOption(option.q1Field ?? layoutOptions.q1Field ?? layout.q1Field),
        medianField: readFieldOption(option.medianField ?? layoutOptions.medianField ?? layout.medianField),
        q3Field: readFieldOption(option.q3Field ?? layoutOptions.q3Field ?? layout.q3Field),
        maxField: readFieldOption(option.maxField ?? layoutOptions.maxField ?? layout.maxField),
        dimensions: normalizeDimensions(option.dimensions ?? layoutOptions.dimensions ?? layout.dimensions),
        categories: normalizeCategories(option.categories ?? layoutOptions.categories ?? layout.categories),
        min: finiteNumber(option.min, finiteNumber(layoutOptions.min, finiteNumber(layout.min, undefined))),
        max: finiteNumber(option.max, finiteNumber(layoutOptions.max, finiteNumber(layout.max, undefined))),
        tickCount: finiteNumber(option.tickCount, finiteNumber(layoutOptions.tickCount, finiteNumber(layout.tickCount, undefined))),
        nice: firstBoolean(option.nice, layoutOptions.nice, layout.nice),
        boxWidth: finiteNumber(option.boxWidth, finiteNumber(layoutOptions.boxWidth, finiteNumber(layout.boxWidth, undefined))),
        capWidth: finiteNumber(option.capWidth, finiteNumber(layoutOptions.capWidth, finiteNumber(layout.capWidth, undefined))),
        labelRadius: readRadiusOption(option.labelRadius ?? layoutOptions.labelRadius ?? layout.labelRadius)
    };
    return layoutRadialBoxplot(Array.isArray(option.data) ? option.data : [], merged);
}
export function layoutRadialBoxplot(data, options = {}) {
    const width = Math.max(1, finiteNumber(options.width, DEFAULT_WIDTH));
    const height = Math.max(1, finiteNumber(options.height, DEFAULT_HEIGHT));
    const padding = Math.max(0, finiteNumber(options.padding, DEFAULT_PADDING));
    const centerX = parseCenter(options.center?.[0], width, width / 2);
    const centerY = parseCenter(options.center?.[1], height, height / 2);
    const radiusLimit = Math.max(1, Math.min(width, height) / 2 - padding);
    const radiusOption = Array.isArray(options.radius) ? options.radius : undefined;
    const innerRadius = clampRadius(parseRadius(radiusOption?.[0] ?? options.innerRadius ?? DEFAULT_INNER_RADIUS, radiusLimit, parseRadius(DEFAULT_INNER_RADIUS, radiusLimit, radiusLimit * 0.18)), 0, radiusLimit);
    const outerRadius = clampRadius(parseRadius(radiusOption?.[1] ?? options.outerRadius ?? DEFAULT_OUTER_RADIUS, radiusLimit, parseRadius(DEFAULT_OUTER_RADIUS, radiusLimit, radiusLimit * 0.88)), innerRadius + 1, radiusLimit);
    const labelRadius = clampRadius(parseRadius(options.labelRadius ?? outerRadius + 28, radiusLimit + padding, outerRadius + 28), outerRadius, radiusLimit + padding);
    const startAngle = finiteNumber(options.startAngle, 90);
    const clockwise = options.clockwise !== false;
    const angleSpan = Math.max(0, finiteNumber(options.angleSpan, options.endAngle != null ? Math.abs(startAngle - finiteNumber(options.endAngle, startAngle - 360)) : 360));
    const normalized = normalizeItems(data, options);
    const categories = resolveCategories(normalized, options);
    const ordered = orderByCategory(normalized, categories);
    const valueExtent = resolveValueExtent(ordered, options);
    const radialTicks = createRadialTicks(valueExtent.min, valueExtent.max, Math.max(2, Math.round(finiteNumber(options.tickCount, DEFAULT_TICK_COUNT))))
        .map((value) => ({
        value,
        radius: projectRadius(value, valueExtent, innerRadius, outerRadius)
    }));
    const boxWidth = clamp(finiteNumber(options.boxWidth, DEFAULT_BOX_WIDTH), 0.04, 1);
    const capWidth = clamp(finiteNumber(options.capWidth, DEFAULT_CAP_WIDTH), 0.04, 1);
    const boxes = ordered.map((item) => createBox(item, categories, valueExtent, innerRadius, outerRadius, centerX, centerY, startAngle, angleSpan, clockwise, boxWidth, capWidth));
    const angleLabels = createAngleLabels(categories, centerX, centerY, labelRadius, startAngle, angleSpan, clockwise);
    return {
        width,
        height,
        padding,
        centerX,
        centerY,
        innerRadius,
        outerRadius,
        labelRadius,
        startAngle,
        angleSpan,
        clockwise,
        valueExtent,
        radialTicks,
        angleLabels,
        boxes
    };
}
function normalizeItems(data, options) {
    const dimensions = normalizeDimensions(options.dimensions);
    const normalized = [];
    data.forEach((item, dataIndex) => {
        const categoryValue = readField(item, options.categoryField ?? options.nameField ?? 'name', dimensions, 0, ['category', 'region', 'group']);
        const rawValues = [
            finiteNumber(readField(item, options.minField ?? 'min', dimensions, 1, ['low', 'lower', 'minimum']), NaN),
            finiteNumber(readField(item, options.q1Field ?? 'q1', dimensions, 2, ['quartile1', 'lowerQuartile']), NaN),
            finiteNumber(readField(item, options.medianField ?? 'median', dimensions, 3, ['med', 'value']), NaN),
            finiteNumber(readField(item, options.q3Field ?? 'q3', dimensions, 4, ['quartile3', 'upperQuartile']), NaN),
            finiteNumber(readField(item, options.maxField ?? 'max', dimensions, 5, ['high', 'upper', 'maximum']), NaN)
        ];
        if (rawValues.some((value) => !Number.isFinite(value)))
            return;
        const [min, q1, median, q3, max] = [...rawValues].sort((left, right) => left - right);
        const nameValue = readField(item, options.nameField ?? options.categoryField ?? 'name', dimensions, 0, ['category', 'region', 'group']);
        const name = stringifyName(nameValue ?? categoryValue ?? `item-${dataIndex}`);
        const record = isPlainObject(item) ? item : {};
        const id = stringifyName(record.id ?? `${name}-${dataIndex}`);
        normalized.push({
            id,
            name,
            categoryValue: categoryValue ?? name,
            min,
            q1,
            median,
            q3,
            max,
            dataIndex,
            raw: item
        });
    });
    return normalized;
}
function resolveCategories(items, options) {
    const explicitCategories = normalizeCategories(options.categories);
    return explicitCategories.length
        ? explicitCategories
        : unique(items.map((item) => stringifyName(item.categoryValue ?? item.name)));
}
function orderByCategory(items, categories) {
    const order = new Map(categories.map((category, index) => [category, index]));
    return [...items].sort((left, right) => {
        const leftOrder = order.get(stringifyName(left.categoryValue ?? left.name)) ?? Number.MAX_SAFE_INTEGER;
        const rightOrder = order.get(stringifyName(right.categoryValue ?? right.name)) ?? Number.MAX_SAFE_INTEGER;
        return leftOrder - rightOrder || left.dataIndex - right.dataIndex;
    });
}
function resolveValueExtent(items, options) {
    const values = items.flatMap((item) => [item.min, item.q1, item.median, item.q3, item.max]);
    let min = finiteNumber(options.min, values.length ? Math.min(...values) : 0);
    let max = finiteNumber(options.max, values.length ? Math.max(...values) : 1);
    if (min === max) {
        const delta = Math.abs(min) || 1;
        min -= delta * 0.5;
        max += delta * 0.5;
    }
    if (min > max) {
        [min, max] = [max, min];
    }
    const hasExplicitMin = Number.isFinite(options.min);
    const hasExplicitMax = Number.isFinite(options.max);
    if (options.nice !== false && (!hasExplicitMin || !hasExplicitMax)) {
        const tickCount = Math.max(2, Math.round(finiteNumber(options.tickCount, DEFAULT_TICK_COUNT)));
        const nice = niceExtent(min, max, tickCount);
        if (!hasExplicitMin)
            min = nice.min;
        if (!hasExplicitMax)
            max = nice.max;
    }
    return { min, max };
}
function createBox(item, categories, valueExtent, innerRadius, outerRadius, centerX, centerY, startAngle, angleSpan, clockwise, boxWidth, capWidth) {
    const category = stringifyName(item.categoryValue ?? item.name);
    const categoryIndex = Math.max(0, categories.indexOf(category));
    const categoryCount = Math.max(categories.length, 1);
    const slotSpan = angleSpan / categoryCount;
    const direction = clockwise ? -1 : 1;
    const angleRatio = (categoryIndex + 0.5) / categoryCount;
    const angle = startAngle + direction * angleRatio * angleSpan;
    const boxHalfSpan = slotSpan * boxWidth / 2;
    const capHalfSpan = slotSpan * capWidth / 2;
    const start = angle - direction * boxHalfSpan;
    const end = angle + direction * boxHalfSpan;
    const capStart = angle - direction * capHalfSpan;
    const capEnd = angle + direction * capHalfSpan;
    const minRadius = projectRadius(item.min, valueExtent, innerRadius, outerRadius);
    const q1Radius = projectRadius(item.q1, valueExtent, innerRadius, outerRadius);
    const medianRadius = projectRadius(item.median, valueExtent, innerRadius, outerRadius);
    const q3Radius = projectRadius(item.q3, valueExtent, innerRadius, outerRadius);
    const maxRadius = projectRadius(item.max, valueExtent, innerRadius, outerRadius);
    const minPoint = pointFromPolar(centerX, centerY, minRadius, angle);
    const q1Point = pointFromPolar(centerX, centerY, q1Radius, angle);
    const medianPoint = pointFromPolar(centerX, centerY, medianRadius, angle);
    const q3Point = pointFromPolar(centerX, centerY, q3Radius, angle);
    const maxPoint = pointFromPolar(centerX, centerY, maxRadius, angle);
    return {
        id: item.id,
        name: item.name,
        categoryValue: item.categoryValue,
        angle,
        angleRatio,
        startAngle: start,
        endAngle: end,
        capStartAngle: capStart,
        capEndAngle: capEnd,
        min: item.min,
        q1: item.q1,
        median: item.median,
        q3: item.q3,
        max: item.max,
        minRadius,
        q1Radius,
        medianRadius,
        q3Radius,
        maxRadius,
        medianX: medianPoint.x,
        medianY: medianPoint.y,
        axis: {
            x1: minPoint.x,
            y1: minPoint.y,
            x2: maxPoint.x,
            y2: maxPoint.y
        },
        lowerWhisker: {
            x1: minPoint.x,
            y1: minPoint.y,
            x2: q1Point.x,
            y2: q1Point.y
        },
        upperWhisker: {
            x1: q3Point.x,
            y1: q3Point.y,
            x2: maxPoint.x,
            y2: maxPoint.y
        },
        boxPath: sectorPath(centerX, centerY, q1Radius, q3Radius, start, end, clockwise),
        medianPath: arcPath(centerX, centerY, medianRadius, capStart, capEnd, clockwise),
        minCapPath: arcPath(centerX, centerY, minRadius, capStart, capEnd, clockwise),
        maxCapPath: arcPath(centerX, centerY, maxRadius, capStart, capEnd, clockwise),
        boxPoints: sectorPoints(centerX, centerY, q1Radius, q3Radius, start, end, clockwise),
        medianPoints: arcPoints(centerX, centerY, medianRadius, capStart, capEnd, clockwise),
        minCapPoints: arcPoints(centerX, centerY, minRadius, capStart, capEnd, clockwise),
        maxCapPoints: arcPoints(centerX, centerY, maxRadius, capStart, capEnd, clockwise),
        dataIndex: item.dataIndex,
        raw: item.raw
    };
}
function createAngleLabels(categories, centerX, centerY, radius, startAngle, angleSpan, clockwise) {
    const categoryCount = Math.max(categories.length, 1);
    const direction = clockwise ? -1 : 1;
    return categories.map((category, index) => {
        const ratio = (index + 0.5) / categoryCount;
        const angle = startAngle + direction * ratio * angleSpan;
        const point = pointFromPolar(centerX, centerY, radius, angle);
        const placement = labelPlacement(angle);
        return {
            name: category,
            value: category,
            angle,
            x: point.x,
            y: point.y,
            align: placement.align,
            verticalAlign: placement.verticalAlign,
            rotation: tangentialTextRotation(angle)
        };
    });
}
function sectorPath(centerX, centerY, innerRadius, outerRadius, startAngle, endAngle, clockwise) {
    const outerStart = pointFromPolar(centerX, centerY, outerRadius, startAngle);
    const outerEnd = pointFromPolar(centerX, centerY, outerRadius, endAngle);
    const innerEnd = pointFromPolar(centerX, centerY, innerRadius, endAngle);
    const innerStart = pointFromPolar(centerX, centerY, innerRadius, startAngle);
    const largeArc = Math.abs(signedSweep(startAngle, endAngle, clockwise)) > 180 ? 1 : 0;
    const sweep = clockwise ? 1 : 0;
    const reverseSweep = clockwise ? 0 : 1;
    return [
        `M ${formatNumber(outerStart.x)} ${formatNumber(outerStart.y)}`,
        `A ${formatNumber(outerRadius)} ${formatNumber(outerRadius)} 0 ${largeArc} ${sweep} ${formatNumber(outerEnd.x)} ${formatNumber(outerEnd.y)}`,
        `L ${formatNumber(innerEnd.x)} ${formatNumber(innerEnd.y)}`,
        `A ${formatNumber(innerRadius)} ${formatNumber(innerRadius)} 0 ${largeArc} ${reverseSweep} ${formatNumber(innerStart.x)} ${formatNumber(innerStart.y)}`,
        'Z'
    ].join(' ');
}
function arcPath(centerX, centerY, radius, startAngle, endAngle, clockwise) {
    const start = pointFromPolar(centerX, centerY, radius, startAngle);
    const end = pointFromPolar(centerX, centerY, radius, endAngle);
    const largeArc = Math.abs(signedSweep(startAngle, endAngle, clockwise)) > 180 ? 1 : 0;
    const sweep = clockwise ? 1 : 0;
    return [
        `M ${formatNumber(start.x)} ${formatNumber(start.y)}`,
        `A ${formatNumber(radius)} ${formatNumber(radius)} 0 ${largeArc} ${sweep} ${formatNumber(end.x)} ${formatNumber(end.y)}`
    ].join(' ');
}
function sectorPoints(centerX, centerY, innerRadius, outerRadius, startAngle, endAngle, clockwise) {
    const outer = arcPoints(centerX, centerY, outerRadius, startAngle, endAngle, clockwise);
    const inner = arcPoints(centerX, centerY, innerRadius, endAngle, startAngle, !clockwise);
    return outer.concat(inner);
}
function arcPoints(centerX, centerY, radius, startAngle, endAngle, clockwise) {
    const sweep = signedSweep(startAngle, endAngle, clockwise);
    const steps = Math.max(4, Math.ceil(Math.abs(sweep) / 10));
    return Array.from({ length: steps + 1 }, (_, index) => {
        const angle = startAngle + sweep * index / steps;
        const point = pointFromPolar(centerX, centerY, radius, angle);
        return [point.x, point.y];
    });
}
function signedSweep(startAngle, endAngle, clockwise) {
    let sweep = endAngle - startAngle;
    if (clockwise) {
        while (sweep > 0)
            sweep -= 360;
    }
    else {
        while (sweep < 0)
            sweep += 360;
    }
    return sweep;
}
function createRadialTicks(min, max, tickCount) {
    if (tickCount <= 1)
        return [min, max];
    const step = (max - min) / (tickCount - 1);
    return Array.from({ length: tickCount }, (_, index) => roundNumber(index === tickCount - 1 ? max : min + step * index));
}
function niceExtent(min, max, tickCount) {
    const span = Math.max(Math.abs(max - min), Number.EPSILON);
    const step = niceNumber(span / Math.max(1, tickCount - 1), true);
    return {
        min: Math.floor(min / step) * step,
        max: Math.ceil(max / step) * step
    };
}
function niceNumber(value, round) {
    const exponent = Math.floor(Math.log10(value));
    const fraction = value / 10 ** exponent;
    let niceFraction;
    if (round) {
        niceFraction = fraction < 1.5 ? 1 : fraction < 3 ? 2 : fraction < 7 ? 5 : 10;
    }
    else {
        niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
    }
    return niceFraction * 10 ** exponent;
}
function projectRadius(value, extent, innerRadius, outerRadius) {
    const ratio = clamp((value - extent.min) / (extent.max - extent.min || 1), 0, 1);
    return innerRadius + (outerRadius - innerRadius) * ratio;
}
function pointFromPolar(centerX, centerY, radius, angle) {
    const radians = angle * Math.PI / 180;
    return {
        x: centerX + Math.cos(radians) * radius,
        y: centerY - Math.sin(radians) * radius
    };
}
function labelPlacement(angle) {
    const radians = angle * Math.PI / 180;
    const x = Math.cos(radians);
    const y = Math.sin(radians);
    return {
        align: x > 0.18 ? 'left' : x < -0.18 ? 'right' : 'center',
        verticalAlign: y > 0.18 ? 'bottom' : y < -0.18 ? 'top' : 'middle'
    };
}
function tangentialTextRotation(angle) {
    let rotation = (angle - 90) * Math.PI / 180;
    const halfTurn = Math.PI;
    while (rotation > Math.PI / 2)
        rotation -= halfTurn;
    while (rotation < -Math.PI / 2)
        rotation += halfTurn;
    return rotation;
}
function readField(item, field, dimensions, fallbackIndex, fallbackNames) {
    if (Array.isArray(item)) {
        const dimensionIndex = typeof field === 'string' ? dimensions?.indexOf(field) : undefined;
        const index = typeof field === 'number'
            ? field
            : dimensionIndex != null && dimensionIndex >= 0
                ? dimensionIndex
                : fallbackIndex;
        return index >= 0 ? item[index] : undefined;
    }
    if (!isPlainObject(item))
        return undefined;
    if (typeof field === 'string' && item[field] != null)
        return item[field];
    for (const fallbackName of fallbackNames) {
        if (item[fallbackName] != null)
            return item[fallbackName];
    }
    return undefined;
}
function parseCenter(value, size, fallback) {
    if (typeof value === 'string' && value.trim().endsWith('%')) {
        return Number.parseFloat(value) / 100 * size;
    }
    return finiteNumber(value, fallback);
}
function parseRadius(value, radiusLimit, fallback) {
    if (typeof value === 'string' && value.trim().endsWith('%')) {
        return Number.parseFloat(value) / 100 * radiusLimit;
    }
    return finiteNumber(value, fallback);
}
function clampRadius(value, min, max) {
    return clamp(Number.isFinite(value) ? value : min, min, max);
}
function normalizeDimensions(value) {
    return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : undefined;
}
function normalizeCategories(value) {
    return Array.isArray(value)
        ? value.filter((item) => typeof item === 'string' || typeof item === 'number').map((item) => String(item))
        : [];
}
function unique(values) {
    return Array.from(new Set(values));
}
function readTuple(value, fallback) {
    return Array.isArray(value) && value.length >= 2 ? [value[0], value[1]] : fallback;
}
function readFieldOption(value) {
    return typeof value === 'string' || typeof value === 'number' ? value : undefined;
}
function readRadiusOption(value) {
    return typeof value === 'string' || typeof value === 'number' ? value : undefined;
}
function firstBoolean(...values) {
    for (const value of values) {
        if (typeof value === 'boolean')
            return value;
    }
    return undefined;
}
function finiteNumber(value, fallback) {
    const numberValue = typeof value === 'number'
        ? value
        : typeof value === 'string' && value.trim() !== ''
            ? Number(value)
            : NaN;
    return Number.isFinite(numberValue) ? numberValue : fallback;
}
function roundNumber(value) {
    return Number(value.toFixed(12));
}
function formatNumber(value) {
    return String(roundNumber(value));
}
function stringifyName(value) {
    if (value instanceof Date)
        return value.toISOString();
    return value == null ? '' : String(value);
}
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
function isPlainObject(value) {
    return Object.prototype.toString.call(value) === '[object Object]';
}
//# sourceMappingURL=layout.js.map