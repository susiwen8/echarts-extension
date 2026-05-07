const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 420;
const DEFAULT_PADDING = 24;
const DEFAULT_TURNS = 4;
const DEFAULT_GAP_ANGLE = 3;
const DEFAULT_RADIAL_GAP = 10;
const EPSILON = 1e-9;
export function resolveSpiralLayout(option = {}) {
    const layout = isPlainObject(option.layout) ? option.layout : {};
    const layoutOptions = isPlainObject(option.layoutOptions) ? option.layoutOptions : {};
    return layoutSpiral(Array.isArray(option.data) ? option.data : [], {
        ...layout,
        ...layoutOptions,
        width: finiteNumber(option.width, finiteNumber(layoutOptions.width, finiteNumber(layout.width, DEFAULT_WIDTH))),
        height: finiteNumber(option.height, finiteNumber(layoutOptions.height, finiteNumber(layout.height, DEFAULT_HEIGHT))),
        padding: finiteNumber(option.padding, finiteNumber(layoutOptions.padding, finiteNumber(layout.padding, DEFAULT_PADDING))),
        center: readCenterOption(option.center ?? layoutOptions.center ?? layout.center),
        innerRadius: readLengthOption(option.innerRadius ?? layoutOptions.innerRadius ?? layout.innerRadius),
        outerRadius: readLengthOption(option.outerRadius ?? layoutOptions.outerRadius ?? layout.outerRadius),
        turns: finiteNumber(option.turns, finiteNumber(layoutOptions.turns, finiteNumber(layout.turns, DEFAULT_TURNS))),
        segmentsPerTurn: firstFiniteNumber(option.segmentsPerTurn, layoutOptions.segmentsPerTurn, layout.segmentsPerTurn),
        startAngle: finiteNumber(option.startAngle, finiteNumber(layoutOptions.startAngle, finiteNumber(layout.startAngle, -90))),
        clockwise: readBoolean(option.clockwise) ?? readBoolean(layoutOptions.clockwise) ?? readBoolean(layout.clockwise),
        sort: readSortOption(option.sort ?? layoutOptions.sort ?? layout.sort),
        gapAngle: finiteNumber(option.gapAngle, finiteNumber(layoutOptions.gapAngle, finiteNumber(layout.gapAngle, DEFAULT_GAP_ANGLE))),
        radialGap: finiteNumber(option.radialGap, finiteNumber(layoutOptions.radialGap, finiteNumber(layout.radialGap, DEFAULT_RADIAL_GAP))),
        bandWidth: firstFiniteNumber(option.bandWidth, layoutOptions.bandWidth, layout.bandWidth),
        min: firstFiniteNumber(option.min, layoutOptions.min, layout.min),
        max: firstFiniteNumber(option.max, layoutOptions.max, layout.max),
        nameField: readFieldOption(option.nameField ?? layoutOptions.nameField ?? layout.nameField),
        valueField: readFieldOption(option.valueField ?? layoutOptions.valueField ?? layout.valueField),
        dimensions: normalizeDimensions(option.dimensions ?? layoutOptions.dimensions ?? layout.dimensions)
    });
}
export function layoutSpiral(data, options = {}) {
    const width = Math.max(1, finiteNumber(options.width, DEFAULT_WIDTH));
    const height = Math.max(1, finiteNumber(options.height, DEFAULT_HEIGHT));
    const padding = Math.max(0, finiteNumber(options.padding, DEFAULT_PADDING));
    const radiusLimit = Math.max(1, Math.min(width, height) / 2);
    const center = resolveCenter(options.center, width, height);
    const normalized = sortPoints(normalizeSpiralData(data, options), options.sort);
    const requestedTurns = Math.max(1, finiteNumber(options.turns, DEFAULT_TURNS));
    const turnCount = Math.max(1, Math.ceil(requestedTurns));
    const segmentsPerTurn = Math.max(1, Math.ceil(finiteNumber(options.segmentsPerTurn, normalized.length ? normalized.length / turnCount : 1)));
    const requiredTurnCount = normalized.length ? Math.ceil(normalized.length / segmentsPerTurn) : turnCount;
    const finalTurnCount = Math.max(turnCount, requiredTurnCount);
    const outerRadius = clamp(readLength(options.outerRadius, radiusLimit, radiusLimit - padding), 0, radiusLimit);
    const innerRadius = clamp(readLength(options.innerRadius, radiusLimit, radiusLimit * 0.22), 0, outerRadius);
    const radiusSpan = Math.max(outerRadius - innerRadius, 1);
    const requestedRadialGap = Math.max(0, finiteNumber(options.radialGap, DEFAULT_RADIAL_GAP));
    const maxRadialGap = Math.max(0, (radiusSpan - finalTurnCount - 1) / finalTurnCount);
    const radialGap = Math.min(requestedRadialGap, maxRadialGap);
    const maxBandWidth = Math.max(1, (radiusSpan - finalTurnCount * radialGap) / (finalTurnCount + 1));
    const bandWidth = Math.max(1, Math.min(finiteNumber(options.bandWidth, maxBandWidth), maxBandWidth));
    const radialStep = (bandWidth + radialGap) / 360;
    const startAngle = finiteNumber(options.startAngle, -90);
    const clockwise = options.clockwise !== false;
    const valueExtent = resolveValueExtent(normalized, options);
    const angleStep = 360 / segmentsPerTurn;
    const gapAngle = Math.max(0, Math.min(finiteNumber(options.gapAngle, DEFAULT_GAP_ANGLE), angleStep * 0.88));
    const direction = clockwise ? 1 : -1;
    const segments = normalized.map((point, index) => {
        const turnIndex = Math.floor(index / segmentsPerTurn);
        const segmentIndex = index % segmentsPerTurn;
        const rawStart = index * angleStep + gapAngle / 2;
        const rawEnd = (index + 1) * angleStep - gapAngle / 2;
        const midProgress = (rawStart + rawEnd) / 2;
        const startAngleDegree = startAngle + direction * rawStart;
        const endAngleDegree = startAngle + direction * rawEnd;
        const midAngleDegree = (startAngleDegree + endAngleDegree) / 2;
        const startInnerPoint = spiralEdgePoint(center.x, center.y, rawStart, startAngle, direction, innerRadius, bandWidth, radialStep, -bandWidth / 2);
        const endInnerPoint = spiralEdgePoint(center.x, center.y, rawEnd, startAngle, direction, innerRadius, bandWidth, radialStep, -bandWidth / 2);
        const startOuterPoint = spiralEdgePoint(center.x, center.y, rawStart, startAngle, direction, innerRadius, bandWidth, radialStep, bandWidth / 2);
        const endOuterPoint = spiralEdgePoint(center.x, center.y, rawEnd, startAngle, direction, innerRadius, bandWidth, radialStep, bandWidth / 2);
        const midInnerPoint = spiralEdgePoint(center.x, center.y, midProgress, startAngle, direction, innerRadius, bandWidth, radialStep, -bandWidth / 2);
        const midOuterPoint = spiralEdgePoint(center.x, center.y, midProgress, startAngle, direction, innerRadius, bandWidth, radialStep, bandWidth / 2);
        const midCenterPoint = spiralCenterPoint(center.x, center.y, midProgress, startAngle, direction, innerRadius, bandWidth, radialStep);
        const startInnerRadius = distanceFromCenter(center.x, center.y, startInnerPoint);
        const endInnerRadius = distanceFromCenter(center.x, center.y, endInnerPoint);
        const startOuterRadius = distanceFromCenter(center.x, center.y, startOuterPoint);
        const endOuterRadius = distanceFromCenter(center.x, center.y, endOuterPoint);
        const segmentInnerRadius = distanceFromCenter(center.x, center.y, midInnerPoint);
        const segmentOuterRadius = distanceFromCenter(center.x, center.y, midOuterPoint);
        const centerRadius = distanceFromCenter(center.x, center.y, midCenterPoint);
        const midAngle = midAngleDegree * Math.PI / 180;
        const x = midCenterPoint.x;
        const y = midCenterPoint.y;
        const labelOffset = Math.max(8, bandWidth * 0.32);
        const labelX = x + Math.cos(midAngle) * labelOffset;
        const labelY = y + Math.sin(midAngle) * labelOffset;
        return {
            ...point,
            index,
            turnIndex,
            segmentIndex,
            startAngle: startAngleDegree * Math.PI / 180,
            endAngle: endAngleDegree * Math.PI / 180,
            midAngle,
            startAngleDegree: cleanNumber(startAngleDegree),
            endAngleDegree: cleanNumber(endAngleDegree),
            midAngleDegree: cleanNumber(midAngleDegree),
            startProgress: cleanNumber(rawStart),
            endProgress: cleanNumber(rawEnd),
            midProgress: cleanNumber(midProgress),
            startInnerRadius: cleanNumber(startInnerRadius),
            endInnerRadius: cleanNumber(endInnerRadius),
            startOuterRadius: cleanNumber(startOuterRadius),
            endOuterRadius: cleanNumber(endOuterRadius),
            innerRadius: cleanNumber(segmentInnerRadius),
            outerRadius: cleanNumber(segmentOuterRadius),
            centerRadius: cleanNumber(centerRadius),
            valueRatio: cleanNumber(valueRatio(point.value, valueExtent)),
            x: cleanNumber(x),
            y: cleanNumber(y),
            labelX: cleanNumber(labelX),
            labelY: cleanNumber(labelY),
            labelAlign: labelAlignForAngle(midAngle),
            labelVerticalAlign: labelVerticalAlignForAngle(midAngle),
            path: createSegmentPath(center.x, center.y, rawStart, rawEnd, startAngle, direction, innerRadius, bandWidth, radialStep)
        };
    });
    return {
        width,
        height,
        padding,
        centerX: cleanNumber(center.x),
        centerY: cleanNumber(center.y),
        innerRadius: cleanNumber(innerRadius),
        outerRadius: cleanNumber(outerRadius),
        turns: requestedTurns,
        turnCount: finalTurnCount,
        segmentsPerTurn,
        startAngle,
        clockwise,
        gapAngle: cleanNumber(gapAngle),
        radialGap: cleanNumber(radialGap),
        bandWidth: cleanNumber(bandWidth),
        valueExtent,
        segments
    };
}
export function normalizeSpiralData(data, options = {}) {
    const dimensions = normalizeDimensions(options.dimensions);
    const points = [];
    data.forEach((raw, dataIndex) => {
        const value = readNumber(readField(raw, options.valueField ?? 'value', dimensions, 1, [
            'value',
            'amount',
            'count',
            'score',
            'users',
            'total'
        ]));
        if (value == null)
            return;
        const nameValue = readField(raw, options.nameField ?? 'name', dimensions, 0, [
            'name',
            'id',
            'category',
            'label'
        ]);
        const record = isPlainObject(raw) ? raw : {};
        const name = stringifyName(nameValue ?? `spiral-${dataIndex}`);
        points.push({
            id: stringifyName(record.id ?? name),
            name,
            value,
            dataIndex,
            raw
        });
    });
    return points;
}
function createSegmentPath(centerX, centerY, startProgress, endProgress, startAngle, direction, innerRadius, bandWidth, radialStep) {
    const outerPoints = sampleSpiralEdge(centerX, centerY, startProgress, endProgress, startAngle, direction, innerRadius, bandWidth, bandWidth / 2, radialStep);
    const innerPoints = sampleSpiralEdge(centerX, centerY, endProgress, startProgress, startAngle, direction, innerRadius, bandWidth, -bandWidth / 2, radialStep);
    return [
        `M ${formatPathNumber(outerPoints[0].x)} ${formatPathNumber(outerPoints[0].y)}`,
        ...outerPoints.slice(1).map((point) => `L ${formatPathNumber(point.x)} ${formatPathNumber(point.y)}`),
        ...innerPoints.map((point) => `L ${formatPathNumber(point.x)} ${formatPathNumber(point.y)}`),
        'Z'
    ].join(' ');
}
function sampleSpiralEdge(centerX, centerY, startProgress, endProgress, startAngle, direction, innerRadius, bandWidth, normalOffset, radialStep) {
    const steps = Math.max(2, Math.ceil(Math.abs(endProgress - startProgress) / 6));
    const points = [];
    for (let index = 0; index <= steps; index += 1) {
        const progress = startProgress + (endProgress - startProgress) * index / steps;
        points.push(spiralEdgePoint(centerX, centerY, progress, startAngle, direction, innerRadius, bandWidth, radialStep, normalOffset));
    }
    return points;
}
function spiralEdgePoint(centerX, centerY, progress, startAngle, direction, innerRadius, bandWidth, radialStep, normalOffset) {
    const centerPoint = spiralCenterPoint(centerX, centerY, progress, startAngle, direction, innerRadius, bandWidth, radialStep);
    return {
        x: centerPoint.x + centerPoint.normalX * normalOffset,
        y: centerPoint.y + centerPoint.normalY * normalOffset
    };
}
function spiralCenterPoint(centerX, centerY, progress, startAngle, direction, innerRadius, bandWidth, radialStep) {
    const radius = innerRadius + bandWidth / 2 + radialStep * progress;
    const angle = (startAngle + direction * progress) * Math.PI / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const angleStep = direction * Math.PI / 180;
    const tangentX = radialStep * cos - radius * sin * angleStep;
    const tangentY = radialStep * sin + radius * cos * angleStep;
    const tangentLength = Math.hypot(tangentX, tangentY) || 1;
    let normalX = -tangentY / tangentLength;
    let normalY = tangentX / tangentLength;
    const radialDot = normalX * cos + normalY * sin;
    if (radialDot < 0) {
        normalX = -normalX;
        normalY = -normalY;
    }
    return {
        x: centerX + cos * radius,
        y: centerY + sin * radius,
        normalX,
        normalY
    };
}
function distanceFromCenter(centerX, centerY, point) {
    return Math.hypot(point.x - centerX, point.y - centerY);
}
function sortPoints(points, sort) {
    const normalizedSort = readSortOption(sort);
    if (normalizedSort === 'none')
        return points;
    return points.slice().sort((left, right) => {
        const valueOrder = normalizedSort === 'asc'
            ? left.value - right.value
            : right.value - left.value;
        return valueOrder || left.dataIndex - right.dataIndex;
    });
}
function resolveValueExtent(points, options) {
    const values = points.map((point) => point.value).filter(Number.isFinite);
    let min = finiteNumber(options.min, values.length ? Math.min(...values) : 0);
    let max = finiteNumber(options.max, values.length ? Math.max(...values) : 1);
    if (max < min)
        [min, max] = [max, min];
    if (Math.abs(max - min) < EPSILON)
        max = min + 1;
    return { min, max };
}
function valueRatio(value, extent) {
    return clamp((value - extent.min) / Math.max(extent.max - extent.min, EPSILON), 0, 1);
}
function readField(item, field, dimensions, fallbackIndex, fallbackFields) {
    if (Array.isArray(item)) {
        const fieldIndex = typeof field === 'number'
            ? field
            : dimensions.indexOf(field);
        if (fieldIndex >= 0 && fieldIndex < item.length)
            return item[fieldIndex];
        if (fallbackIndex >= 0 && fallbackIndex < item.length)
            return item[fallbackIndex];
        return undefined;
    }
    if (!isPlainObject(item))
        return undefined;
    const fields = typeof field === 'string' ? [field, ...fallbackFields] : fallbackFields;
    for (const candidate of fields) {
        if (item[candidate] != null)
            return item[candidate];
    }
    return undefined;
}
function resolveCenter(center, width, height) {
    if (!center) {
        return {
            x: width / 2,
            y: height / 2
        };
    }
    return {
        x: readCoordinate(center[0], width, width / 2),
        y: readCoordinate(center[1], height, height / 2)
    };
}
function readCoordinate(value, size, fallback) {
    if (typeof value === 'number' && Number.isFinite(value))
        return value;
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed.endsWith('%')) {
            const percent = Number(trimmed.slice(0, -1));
            return Number.isFinite(percent) ? size * percent / 100 : fallback;
        }
        const numeric = Number(trimmed);
        if (Number.isFinite(numeric))
            return numeric;
    }
    return fallback;
}
function readLength(value, relative, fallback) {
    if (typeof value === 'number' && Number.isFinite(value))
        return value;
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed.endsWith('%')) {
            const percent = Number(trimmed.slice(0, -1));
            return Number.isFinite(percent) ? relative * percent / 100 : fallback;
        }
        const numeric = Number(trimmed);
        if (Number.isFinite(numeric))
            return numeric;
    }
    return fallback;
}
function readCenterOption(value) {
    if (!Array.isArray(value) || value.length < 2)
        return undefined;
    const [x, y] = value;
    const validX = typeof x === 'number' || typeof x === 'string';
    const validY = typeof y === 'number' || typeof y === 'string';
    return validX && validY ? [x, y] : undefined;
}
function readLengthOption(value) {
    return typeof value === 'number' || typeof value === 'string' ? value : undefined;
}
function readSortOption(value) {
    if (value === true)
        return 'desc';
    if (value === 'asc' || value === 'desc')
        return value;
    return 'none';
}
function readFieldOption(value) {
    return typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value)) ? value : undefined;
}
function normalizeDimensions(value) {
    return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [];
}
function labelAlignForAngle(angle) {
    const cosine = Math.cos(angle);
    if (cosine > 0.25)
        return 'left';
    if (cosine < -0.25)
        return 'right';
    return 'center';
}
function labelVerticalAlignForAngle(angle) {
    const sine = Math.sin(angle);
    if (sine > 0.25)
        return 'top';
    if (sine < -0.25)
        return 'bottom';
    return 'middle';
}
function readNumber(value) {
    const numeric = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
    return Number.isFinite(numeric) ? numeric : undefined;
}
function finiteNumber(value, fallback) {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
function firstFiniteNumber(...values) {
    return values.find((value) => typeof value === 'number' && Number.isFinite(value));
}
function readBoolean(value) {
    return typeof value === 'boolean' ? value : undefined;
}
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
function cleanNumber(value) {
    return Number(value.toFixed(6));
}
function formatPathNumber(value) {
    return Number(value.toFixed(3)).toString();
}
function stringifyName(value) {
    return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}
function isPlainObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
//# sourceMappingURL=layout.js.map