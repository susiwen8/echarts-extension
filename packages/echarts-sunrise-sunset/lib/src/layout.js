const DEFAULT_WIDTH = 900;
const DEFAULT_HEIGHT = 560;
const DEFAULT_PADDING = 72;
const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
export function resolveSunriseSunsetLayout(option = {}) {
    const dataOption = readDataOption(option.data);
    const layoutOptions = {
        ...(isPlainObject(option.layout) ? option.layout : {}),
        ...(isPlainObject(option.layoutOptions) ? option.layoutOptions : {}),
        width: finiteNumber(option.width, undefined),
        height: finiteNumber(option.height, undefined),
        padding: finiteNumber(option.padding, undefined),
        baselineY: finiteNumber(option.baselineY, undefined),
        dayArcHeight: finiteNumber(option.dayArcHeight, undefined),
        moonArcHeight: finiteNumber(option.moonArcHeight, undefined),
        moonStartRatio: finiteNumber(option.moonStartRatio, undefined),
        moonEndRatio: finiteNumber(option.moonEndRatio, undefined)
    };
    const events = resolveEvents({
        ...dataOption,
        ...definedEventOption(option)
    });
    return layoutResolvedSunriseSunset(events, layoutOptions);
}
export function layoutSunriseSunset(input = {}, options = {}) {
    const events = resolveEvents(input);
    return layoutResolvedSunriseSunset(events, options);
}
function layoutResolvedSunriseSunset(events, options = {}) {
    const width = finiteNumber(options.width, DEFAULT_WIDTH);
    const height = finiteNumber(options.height, DEFAULT_HEIGHT);
    const padding = Math.max(0, finiteNumber(options.padding, Math.min(DEFAULT_PADDING, width * 0.1)));
    const baselineY = clamp(finiteNumber(options.baselineY, height * 0.805), height * 0.48, height - Math.max(56, padding * 0.6));
    const dayArcHeight = Math.max(24, finiteNumber(options.dayArcHeight, Math.min(width * 0.285, Math.max(height * 0.42, 1))));
    const moonArcHeight = Math.max(16, finiteNumber(options.moonArcHeight, dayArcHeight * 0.43));
    const dayGeometry = {
        startX: padding,
        endX: Math.max(width - padding, padding + 1),
        baselineY,
        height: dayArcHeight
    };
    const moonStartRatio = clamp(finiteNumber(options.moonStartRatio, 0.28), 0, 0.95);
    const moonEndRatio = clamp(finiteNumber(options.moonEndRatio, 0.72), moonStartRatio + 0.01, 1);
    const dayWidth = dayGeometry.endX - dayGeometry.startX;
    const moonGeometry = {
        startX: dayGeometry.startX + dayWidth * moonStartRatio,
        endX: dayGeometry.startX + dayWidth * moonEndRatio,
        baselineY,
        height: moonArcHeight
    };
    const dayCycle = resolveDayCycle(events.sunrise, events.sunset, events.currentTime);
    const moonCycle = resolveMoonCycle(events.moonrise, events.moonset, events.currentTime);
    const targetTime = dayCycle.isDaylight
        ? dayCycle.end
        : events.currentTime < dayCycle.start
            ? dayCycle.start
            : dayCycle.start + DAY_MS;
    const autoTitle = dayCycle.isDaylight ? '距离日落还剩' : '距离日出还剩';
    const remainingSeconds = Math.max(0, Math.round((targetTime - events.currentTime) / 1000));
    return {
        width,
        height,
        padding,
        baselineY,
        title: events.title || autoTitle,
        remainingText: events.remainingText || formatDuration(remainingSeconds),
        updatedText: events.updatedText || formatUpdatedText(events.updatedAt),
        remainingSeconds,
        currentTime: events.currentTime,
        events: {
            sunrise: {
                key: 'sunrise',
                label: formatTimeLabel(events.sunrise),
                value: events.sunrise,
                ...pointOnArc(dayGeometry, 0)
            },
            sunset: {
                key: 'sunset',
                label: formatTimeLabel(events.sunset),
                value: events.sunset,
                ...pointOnArc(dayGeometry, 1)
            },
            moonrise: {
                key: 'moonrise',
                label: formatTimeLabel(events.moonrise),
                value: events.moonrise,
                ...pointOnArc(moonGeometry, 0)
            },
            moonset: {
                key: 'moonset',
                label: formatTimeLabel(events.moonset),
                value: events.moonset,
                ...pointOnArc(moonGeometry, 1)
            }
        },
        day: createArcLayout(dayGeometry, dayCycle.progress, dayCycle.isDaylight, dayCycle.wraps, dayCycle.durationMinutes),
        moon: createArcLayout(moonGeometry, moonCycle.progress, moonCycle.visible, moonCycle.wraps, moonCycle.durationMinutes)
    };
}
function resolveEvents(input) {
    const currentTime = parseTime(input.currentTime, undefined, Date.now());
    const sunrise = parseTime(input.sunrise, currentTime, localTime(currentTime, 6, 0, 0));
    const sunset = parseTime(input.sunset, currentTime, localTime(currentTime, 18, 0, 0));
    const moonrise = parseTime(input.moonrise, currentTime, localTime(currentTime, 21, 0, 0));
    const moonset = parseTime(input.moonset, currentTime, localTime(currentTime, 7, 0, 0));
    const updatedAt = input.updatedAt != null ? parseTime(input.updatedAt, currentTime, NaN) : undefined;
    return {
        sunrise,
        sunset,
        moonrise,
        moonset,
        currentTime,
        updatedAt,
        title: typeof input.title === 'string' && input.title ? input.title : undefined,
        remainingText: typeof input.remainingText === 'string' && input.remainingText ? input.remainingText : undefined,
        updatedText: typeof input.updatedText === 'string' && input.updatedText ? input.updatedText : undefined
    };
}
function resolveDayCycle(sunrise, sunset, currentTime) {
    let start = sunrise;
    let end = sunset;
    if (end <= start)
        end += DAY_MS;
    const progress = clamp((currentTime - start) / Math.max(end - start, 1), 0, 1);
    return {
        start,
        end,
        progress,
        isDaylight: currentTime >= start && currentTime <= end,
        wraps: sunset <= sunrise,
        durationMinutes: (end - start) / MINUTE_MS
    };
}
function resolveMoonCycle(moonrise, moonset, currentTime) {
    let start = moonrise;
    let end = moonset;
    const wraps = moonset <= moonrise;
    if (wraps)
        end += DAY_MS;
    if (wraps && currentTime < start && currentTime <= moonset) {
        start -= DAY_MS;
        end -= DAY_MS;
    }
    const progress = clamp((currentTime - start) / Math.max(end - start, 1), 0, 1);
    return {
        start,
        end,
        progress,
        visible: currentTime >= start && currentTime <= end,
        wraps,
        durationMinutes: (end - start) / MINUTE_MS
    };
}
function createArcLayout(geometry, progress, visible, wraps, durationMinutes) {
    const safeProgress = clamp(progress, 0, 1);
    return {
        start: pointOnArc(geometry, 0),
        end: pointOnArc(geometry, 1),
        current: pointOnArc(geometry, safeProgress),
        motionPoints: createMotionPoints(geometry, safeProgress),
        progress: safeProgress,
        visible,
        wraps,
        durationMinutes,
        solidPath: safeProgress > 0 ? createArcPath(geometry, 0, safeProgress) : '',
        dashedPath: safeProgress < 1 ? createArcPath(geometry, safeProgress, 1) : '',
        fullPath: createArcPath(geometry, 0, 1),
        areaPath: safeProgress > 0 ? createAreaPath(geometry, safeProgress) : ''
    };
}
function createArcPath(geometry, startProgress, endProgress) {
    const start = clamp(startProgress, 0, 1);
    const end = clamp(endProgress, start, 1);
    const steps = Math.max(2, Math.ceil(Math.abs(end - start) * 36));
    const points = [];
    for (let index = 0; index <= steps; index += 1) {
        const progress = start + ((end - start) * index) / steps;
        points.push(pointOnArc(geometry, progress));
    }
    return pointsToPath(points);
}
function createAreaPath(geometry, progress) {
    const end = clamp(progress, 0, 1);
    const steps = Math.max(2, Math.ceil(end * 36));
    const points = [];
    for (let index = 0; index <= steps; index += 1) {
        points.push(pointOnArc(geometry, (end * index) / steps));
    }
    const current = points[points.length - 1] || pointOnArc(geometry, 0);
    return `${pointsToPath(points)} L ${formatNumber(current.x)} ${formatNumber(geometry.baselineY)} L ${formatNumber(geometry.startX)} ${formatNumber(geometry.baselineY)} Z`;
}
function createMotionPoints(geometry, progress) {
    const end = clamp(progress, 0, 1);
    const steps = Math.max(1, Math.ceil(end * 24));
    const points = [];
    for (let index = 0; index <= steps; index += 1) {
        points.push(pointOnArc(geometry, (end * index) / steps));
    }
    return points;
}
function pointOnArc(geometry, progress) {
    const safeProgress = clamp(progress, 0, 1);
    return {
        x: geometry.startX + (geometry.endX - geometry.startX) * safeProgress,
        y: geometry.baselineY - Math.sin(Math.PI * safeProgress) * geometry.height
    };
}
function pointsToPath(points) {
    if (!points.length)
        return '';
    const [first, ...rest] = points;
    return [
        `M ${formatNumber(first.x)} ${formatNumber(first.y)}`,
        ...rest.map((point) => `L ${formatNumber(point.x)} ${formatNumber(point.y)}`)
    ].join(' ');
}
function readDataOption(data) {
    if (Array.isArray(data)) {
        const first = data.find((item) => isPlainObject(item));
        return isPlainObject(first) ? first : {};
    }
    return isPlainObject(data) ? data : {};
}
function definedEventOption(option) {
    const result = {};
    const keys = ['sunrise', 'sunset', 'moonrise', 'moonset', 'currentTime', 'updatedAt', 'title', 'remainingText', 'updatedText'];
    keys.forEach((key) => {
        if (option[key] !== undefined && option[key] !== null)
            result[key] = option[key];
    });
    return result;
}
function parseTime(value, baseTime, fallback) {
    if (value instanceof Date) {
        const timestamp = value.getTime();
        return Number.isFinite(timestamp) ? timestamp : fallback;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
        if (value >= 0 && value <= 24 * 60) {
            return localDayStart(baseTime ?? fallback) + value * MINUTE_MS;
        }
        return value;
    }
    if (typeof value !== 'string')
        return fallback;
    const text = value.trim();
    if (!text)
        return fallback;
    const timeMatch = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(text);
    if (timeMatch) {
        const hour = Number(timeMatch[1]);
        const minute = Number(timeMatch[2]);
        const second = Number(timeMatch[3] || 0);
        if (hour < 24 && minute < 60 && second < 60) {
            return localTime(baseTime ?? fallback, hour, minute, second);
        }
        return fallback;
    }
    const dateMatch = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/.exec(text);
    if (dateMatch) {
        const year = Number(dateMatch[1]);
        const month = Number(dateMatch[2]);
        const day = Number(dateMatch[3]);
        const hour = Number(dateMatch[4] || 0);
        const minute = Number(dateMatch[5] || 0);
        const second = Number(dateMatch[6] || 0);
        const timestamp = new Date(year, month - 1, day, hour, minute, second).getTime();
        return Number.isFinite(timestamp) ? timestamp : fallback;
    }
    const timestamp = new Date(text).getTime();
    return Number.isFinite(timestamp) ? timestamp : fallback;
}
function localDayStart(timestamp) {
    const date = new Date(timestamp);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}
function localTime(baseTimestamp, hour, minute, second) {
    return localDayStart(baseTimestamp) + hour * HOUR_MS + minute * MINUTE_MS + second * 1000;
}
function formatDuration(seconds) {
    const safeSeconds = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const restSeconds = safeSeconds % 60;
    return `${pad2(hours)}:${pad2(minutes)}:${pad2(restSeconds)}`;
}
function formatUpdatedText(updatedAt) {
    if (updatedAt == null || !Number.isFinite(updatedAt))
        return '';
    return `更新于${formatTimeLabel(updatedAt)}`;
}
function formatTimeLabel(timestamp) {
    const date = new Date(timestamp);
    return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}
function pad2(value) {
    return String(Math.trunc(value)).padStart(2, '0');
}
function formatNumber(value) {
    const rounded = Math.round(value * 1000) / 1000;
    return Object.is(rounded, -0) ? '0' : String(rounded);
}
function finiteNumber(value, fallback) {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
function isPlainObject(value) {
    return value != null && typeof value === 'object' && !Array.isArray(value);
}
//# sourceMappingURL=layout.js.map