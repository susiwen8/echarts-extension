const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 400;
const DEFAULT_PADDING = 18;
const DEFAULT_ARROW_HEAD_ANGLE = Math.PI / 7;
export function resolveVectorFieldLayout(option = {}) {
    const layoutOptions = isPlainObject(option.layout) ? option.layout : {};
    const nestedOptions = isPlainObject(option.layoutOptions) ? option.layoutOptions : {};
    return layoutVectorField(option.data, {
        ...layoutOptions,
        ...nestedOptions,
        width: finiteNumber(option.width, undefined),
        height: finiteNumber(option.height, undefined),
        padding: finiteNumber(option.padding, undefined),
        xExtent: readExtent(option.xExtent) ?? readExtent(nestedOptions.xExtent) ?? readExtent(layoutOptions.xExtent),
        yExtent: readExtent(option.yExtent) ?? readExtent(nestedOptions.yExtent) ?? readExtent(layoutOptions.yExtent),
        xField: readString(option.xField) ?? readString(nestedOptions.xField) ?? readString(layoutOptions.xField),
        yField: readString(option.yField) ?? readString(nestedOptions.yField) ?? readString(layoutOptions.yField),
        uField: readString(option.uField) ?? readString(nestedOptions.uField) ?? readString(layoutOptions.uField),
        vField: readString(option.vField) ?? readString(nestedOptions.vField) ?? readString(layoutOptions.vField),
        invertY: readBoolean(option.invertY) ?? readBoolean(nestedOptions.invertY) ?? readBoolean(layoutOptions.invertY),
        samplingStep: finiteNumber(option.samplingStep, undefined)
            ?? finiteNumber(nestedOptions.samplingStep, undefined)
            ?? finiteNumber(layoutOptions.samplingStep, undefined),
        minLength: finiteNumber(option.minLength, undefined)
            ?? finiteNumber(nestedOptions.minLength, undefined)
            ?? finiteNumber(layoutOptions.minLength, undefined),
        maxLength: finiteNumber(option.maxLength, undefined)
            ?? finiteNumber(nestedOptions.maxLength, undefined)
            ?? finiteNumber(layoutOptions.maxLength, undefined),
        lengthScale: finiteNumber(option.lengthScale, undefined)
            ?? finiteNumber(nestedOptions.lengthScale, undefined)
            ?? finiteNumber(layoutOptions.lengthScale, undefined),
        arrowHeadLength: finiteNumber(option.arrowHeadLength, undefined)
            ?? finiteNumber(nestedOptions.arrowHeadLength, undefined)
            ?? finiteNumber(layoutOptions.arrowHeadLength, undefined),
        arrowHeadAngle: finiteNumber(option.arrowHeadAngle, undefined)
            ?? finiteNumber(nestedOptions.arrowHeadAngle, undefined)
            ?? finiteNumber(layoutOptions.arrowHeadAngle, undefined)
    });
}
export function layoutVectorField(data, options = {}) {
    const width = finiteNumber(options.width, DEFAULT_WIDTH);
    const height = finiteNumber(options.height, DEFAULT_HEIGHT);
    const padding = Math.max(0, finiteNumber(options.padding, DEFAULT_PADDING));
    const invertY = options.invertY !== false;
    const points = samplePoints(normalizeVectorFieldData(data, options), Math.max(1, Math.floor(finiteNumber(options.samplingStep, 1))));
    const xExtent = normalizeExtent(options.xExtent ?? extent(points.map((point) => point.x)));
    const yExtent = normalizeExtent(options.yExtent ?? extent(points.map((point) => point.y)));
    const innerWidth = Math.max(width - padding * 2, 1);
    const innerHeight = Math.max(height - padding * 2, 1);
    const maxMagnitude = points.reduce((max, point) => Math.max(max, point.magnitude), 0);
    const inferredMaxLength = inferDefaultMaxLength(points, xExtent, yExtent, innerWidth, innerHeight);
    const maxLength = Math.max(0, finiteNumber(options.maxLength, inferredMaxLength));
    const minLength = Math.max(0, finiteNumber(options.minLength, 0));
    const lengthScale = finiteNumber(options.lengthScale, maxMagnitude > 0 ? maxLength / maxMagnitude : 0);
    const arrowHeadAngle = finiteNumber(options.arrowHeadAngle, DEFAULT_ARROW_HEAD_ANGLE);
    const defaultHeadLength = Math.max(2, Math.min(7, maxLength * 0.38));
    const arrowHeadLength = Math.max(0, finiteNumber(options.arrowHeadLength, defaultHeadLength));
    const items = points.map((point) => {
        const x = mapLinear(point.x, xExtent, padding, padding + innerWidth);
        const y = mapLinear(point.y, yExtent, invertY ? padding + innerHeight : padding, invertY ? padding : padding + innerHeight);
        const screenU = point.u;
        const screenV = invertY ? -point.v : point.v;
        const angle = Math.atan2(screenV, screenU);
        const rawLength = point.magnitude * lengthScale;
        const length = point.magnitude > 0 ? clamp(rawLength, minLength, maxLength) : 0;
        const unitX = point.magnitude > 0 ? screenU / point.magnitude : 0;
        const unitY = point.magnitude > 0 ? screenV / point.magnitude : 0;
        const dx = unitX * length;
        const dy = unitY * length;
        const startX = x - dx / 2;
        const startY = y - dy / 2;
        const endX = x + dx / 2;
        const endY = y + dy / 2;
        const headLength = Math.min(arrowHeadLength, length * 0.5);
        const leftAngle = angle + Math.PI - arrowHeadAngle;
        const rightAngle = angle + Math.PI + arrowHeadAngle;
        return {
            ...point,
            x,
            y,
            screenU,
            screenV,
            angle,
            length,
            startX,
            startY,
            endX,
            endY,
            headLeftX: endX + Math.cos(leftAngle) * headLength,
            headLeftY: endY + Math.sin(leftAngle) * headLength,
            headRightX: endX + Math.cos(rightAngle) * headLength,
            headRightY: endY + Math.sin(rightAngle) * headLength
        };
    });
    return {
        width,
        height,
        padding,
        xExtent,
        yExtent,
        invertY,
        maxMagnitude,
        items
    };
}
export function normalizeVectorFieldData(data, options = {}) {
    if (!Array.isArray(data))
        return [];
    const points = [];
    data.forEach((raw, dataIndex) => {
        const record = isPlainObject(raw) ? raw : null;
        const tuple = Array.isArray(raw) ? raw : null;
        const x = tuple
            ? readNumber(tuple[0])
            : readNumberFromRecord(record, options.xField, ['x', 'longitude', 'lng', 'lon']);
        const y = tuple
            ? readNumber(tuple[1])
            : readNumberFromRecord(record, options.yField, ['y', 'latitude', 'lat']);
        const u = tuple
            ? readNumber(tuple[2])
            : readNumberFromRecord(record, options.uField, ['u', 'dx', 'vx']);
        const v = tuple
            ? readNumber(tuple[3])
            : readNumberFromRecord(record, options.vField, ['v', 'dy', 'vy']);
        if (x == null || y == null || u == null || v == null)
            return;
        const magnitude = Math.hypot(u, v);
        points.push({
            dataIndex,
            x,
            y,
            u,
            v,
            coord: [x, y],
            magnitude,
            name: readName(raw, dataIndex),
            raw
        });
    });
    return points;
}
function samplePoints(points, samplingStep) {
    if (samplingStep <= 1)
        return points;
    return points.filter((point, index) => index % samplingStep === 0 || point.magnitude === 0);
}
function inferDefaultMaxLength(points, xExtent, yExtent, innerWidth, innerHeight) {
    const xStep = minPositiveStep(points.map((point) => point.x));
    const yStep = minPositiveStep(points.map((point) => point.y));
    const screenSteps = [
        xStep == null ? null : xStep / Math.max(xExtent[1] - xExtent[0], Number.EPSILON) * innerWidth,
        yStep == null ? null : yStep / Math.max(yExtent[1] - yExtent[0], Number.EPSILON) * innerHeight
    ].filter((value) => value != null && Number.isFinite(value) && value > 0);
    if (screenSteps.length)
        return Math.max(4, Math.min(...screenSteps) * 0.78);
    return Math.max(6, Math.min(innerWidth, innerHeight) * 0.05);
}
function minPositiveStep(values) {
    const uniqueValues = Array.from(new Set(values.filter(Number.isFinite))).sort((left, right) => left - right);
    let step = Number.POSITIVE_INFINITY;
    for (let index = 1; index < uniqueValues.length; index += 1) {
        const delta = uniqueValues[index] - uniqueValues[index - 1];
        if (delta > 0 && delta < step)
            step = delta;
    }
    return Number.isFinite(step) ? step : null;
}
function extent(values) {
    const finiteValues = values.filter(Number.isFinite);
    if (!finiteValues.length)
        return [0, 1];
    return [Math.min(...finiteValues), Math.max(...finiteValues)];
}
function normalizeExtent(value) {
    const min = finiteNumber(value[0], 0);
    const max = finiteNumber(value[1], min + 1);
    if (max > min)
        return [min, max];
    const center = min;
    return [center - 0.5, center + 0.5];
}
function mapLinear(value, domain, rangeStart, rangeEnd) {
    return rangeStart + (value - domain[0]) / (domain[1] - domain[0]) * (rangeEnd - rangeStart);
}
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
function readExtent(value) {
    if (!Array.isArray(value) || value.length < 2)
        return undefined;
    const min = readNumber(value[0]);
    const max = readNumber(value[1]);
    return min == null || max == null ? undefined : [min, max];
}
function readNumberFromRecord(record, preferredField, fallbackFields) {
    if (!record)
        return undefined;
    const fields = preferredField ? [preferredField, ...fallbackFields] : fallbackFields;
    for (const field of fields) {
        const value = readNumber(record[field]);
        if (value != null)
            return value;
    }
    return undefined;
}
function readNumber(value) {
    const numeric = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
    return Number.isFinite(numeric) ? numeric : undefined;
}
function finiteNumber(value, fallback) {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
function readBoolean(value) {
    return typeof value === 'boolean' ? value : undefined;
}
function readString(value) {
    return typeof value === 'string' && value ? value : undefined;
}
function readName(raw, dataIndex) {
    if (isPlainObject(raw)) {
        const value = raw.name ?? raw.id;
        if (typeof value === 'string' || typeof value === 'number')
            return String(value);
    }
    return `vector-${dataIndex}`;
}
function isPlainObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
//# sourceMappingURL=layout.js.map