export interface RoutePathPoint {
  x: number;
  y: number;
  stationId?: string;
}

export type RoutePathShapePoint = [number, number, number];

export interface RoutePathShape extends Record<string, unknown> {
  points: RoutePathShapePoint[];
  cornerRadius: number;
}

export function createRoundedRoutePath(points: RoutePathPoint[], cornerRadius: number): string {
  const routePoints = points.filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
  if (!routePoints.length) return '';

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

export function createRoutePathShape(points: RoutePathPoint[], cornerRadius: number): RoutePathShape {
  return {
    points: points
      .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
      .map((point) => [point.x, point.y, point.stationId ? 1 : 0]),
    cornerRadius: Math.max(0, finiteNumber(cornerRadius, 0))
  };
}

export function buildRoundedRoutePathShape(ctx: RoutePathContext, shape: RoutePathShape): void {
  const routePoints = shape.points
    .filter((point) => Number.isFinite(point[0]) && Number.isFinite(point[1]))
    .map((point) => ({
      x: point[0],
      y: point[1],
      stationId: point[2] ? '__station__' : undefined
    }));
  if (!routePoints.length) return;

  const radius = Math.max(0, finiteNumber(shape.cornerRadius, 0));
  ctx.moveTo(routePoints[0].x, routePoints[0].y);

  for (let index = 1; index < routePoints.length - 1; index += 1) {
    const previous = routePoints[index - 1];
    const current = routePoints[index];
    const next = routePoints[index + 1];
    const incoming = vector(previous, current);
    const outgoing = vector(next, current);

    if (current.stationId || !radius || !incoming.length || !outgoing.length || isStraight(previous, current, next)) {
      ctx.lineTo(current.x, current.y);
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

    ctx.lineTo(start.x, start.y);
    ctx.quadraticCurveTo(current.x, current.y, end.x, end.y);
  }

  if (routePoints.length > 1) {
    const last = routePoints[routePoints.length - 1];
    ctx.lineTo(last.x, last.y);
  }
}

interface RoutePathContext {
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void;
}

function vector(point: RoutePathPoint, origin: RoutePathPoint): RoutePathPoint & { length: number } {
  const x = point.x - origin.x;
  const y = point.y - origin.y;
  return {
    x,
    y,
    length: Math.hypot(x, y)
  };
}

function isStraight(previous: RoutePathPoint, current: RoutePathPoint, next: RoutePathPoint): boolean {
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

function lineTo(point: RoutePathPoint): string {
  return `L${formatNumber(point.x)} ${formatNumber(point.y)}`;
}

function formatNumber(value: number): string {
  return String(Math.round(value * 1000) / 1000);
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
