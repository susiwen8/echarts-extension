export function createRoundedRoutePath(points, cornerRadius) {
    const routePoints = points.filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
    if (!routePoints.length)
        return '';
    const radius = Math.max(0, finiteNumber(cornerRadius, 0));
    const commands = [`M${formatNumber(routePoints[0].x)} ${formatNumber(routePoints[0].y)}`];
    for (let index = 1; index < routePoints.length - 1; index += 1) {
        const previous = routePoints[index - 1];
        const current = routePoints[index];
        const next = routePoints[index + 1];
        const incoming = vector(previous, current);
        const outgoing = vector(next, current);
        if (current.stationId || !radius || !incoming.length || !outgoing.length || isStraight(previous, current, next)) {
            commands.push(lineTo(current));
            continue;
        }
        const trim = Math.min(radius, incoming.length / 2, outgoing.length / 2);
        const start = {
            x: current.x + incoming.x / incoming.length * trim,
            y: current.y + incoming.y / incoming.length * trim
        };
        const end = {
            x: current.x + outgoing.x / outgoing.length * trim,
            y: current.y + outgoing.y / outgoing.length * trim
        };
        commands.push(lineTo(start));
        commands.push(`Q${formatNumber(current.x)} ${formatNumber(current.y)} ${formatNumber(end.x)} ${formatNumber(end.y)}`);
    }
    if (routePoints.length > 1) {
        commands.push(lineTo(routePoints[routePoints.length - 1]));
    }
    return commands.join('');
}
function vector(point, origin) {
    const x = point.x - origin.x;
    const y = point.y - origin.y;
    return {
        x,
        y,
        length: Math.hypot(x, y)
    };
}
function isStraight(previous, current, next) {
    const incoming = {
        x: current.x - previous.x,
        y: current.y - previous.y
    };
    const outgoing = {
        x: next.x - current.x,
        y: next.y - current.y
    };
    const cross = incoming.x * outgoing.y - incoming.y * outgoing.x;
    return Math.abs(cross) < 1e-9;
}
function lineTo(point) {
    return `L${formatNumber(point.x)} ${formatNumber(point.y)}`;
}
function formatNumber(value) {
    return String(Math.round(value * 1000) / 1000);
}
function finiteNumber(value, fallback) {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
//# sourceMappingURL=route-path.js.map