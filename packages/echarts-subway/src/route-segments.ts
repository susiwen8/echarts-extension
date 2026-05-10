export interface RouteSegmentPoint {
  x: number;
  y: number;
  stationId?: string;
}

export interface RouteSegmentRoute {
  id: string;
  lineWidth: number;
  points: RouteSegmentPoint[];
}

export interface RouteSegmentOffset {
  routeId: string;
  segmentIndex: number;
  count: number;
  rank: number;
  offsetX: number;
  offsetY: number;
}

interface SegmentEntry {
  routeId: string;
  segmentIndex: number;
  lineWidth: number;
  start: RouteSegmentPoint;
  end: RouteSegmentPoint;
}

interface SegmentGroup {
  start: RouteSegmentPoint;
  end: RouteSegmentPoint;
  entries: SegmentEntry[];
}

const COORDINATE_PRECISION = 1000;
const PARALLEL_GAP = 2;

export function routeSegmentOffsetKey(routeId: string, segmentIndex: number): string {
  return `${routeId}\x00${segmentIndex}`;
}

export function resolveSharedSegmentOffsets(routes: RouteSegmentRoute[]): Map<string, RouteSegmentOffset> {
  const groups = new Map<string, SegmentGroup>();

  routes.forEach((route) => {
    for (let segmentIndex = 0; segmentIndex < route.points.length - 1; segmentIndex += 1) {
      const start = route.points[segmentIndex];
      const end = route.points[segmentIndex + 1];
      if (!isDrawablePoint(start) || !isDrawablePoint(end) || samePoint(start, end)) continue;
      const key = canonicalSegmentKey(start, end);
      const group = groups.get(key) || {
        ...canonicalSegmentPoints(start, end),
        entries: []
      };

      group.entries.push({
        routeId: route.id,
        segmentIndex,
        lineWidth: route.lineWidth,
        start,
        end
      });
      groups.set(key, group);
    }
  });

  const offsets = new Map<string, RouteSegmentOffset>();

  groups.forEach((group) => assignSegmentGroupOffsets(offsets, group));

  return offsets;
}

function assignSegmentGroupOffsets(offsets: Map<string, RouteSegmentOffset>, group: SegmentGroup): void {
  const entries = uniqueSegmentEntries(group.entries);
  if (entries.length <= 1) return;

  const dx = group.end.x - group.start.x;
  const dy = group.end.y - group.start.y;
  const length = Math.hypot(dx, dy);
  if (!length) return;

  const spacing = Math.max(...entries.map((entry) => entry.lineWidth), 1) + PARALLEL_GAP;
  const normalX = -dy / length;
  const normalY = dx / length;

  entries
    .sort((left, right) => left.routeId.localeCompare(right.routeId) || left.segmentIndex - right.segmentIndex)
    .forEach((entry, rank) => {
      const distance = (rank - (entries.length - 1) / 2) * spacing;
      offsets.set(routeSegmentOffsetKey(entry.routeId, entry.segmentIndex), {
        routeId: entry.routeId,
        segmentIndex: entry.segmentIndex,
        count: entries.length,
        rank,
        offsetX: normalX * distance,
        offsetY: normalY * distance
      });
    });
}

function uniqueSegmentEntries(entries: SegmentEntry[]): SegmentEntry[] {
  const seen = new Set<string>();
  const unique: SegmentEntry[] = [];

  entries.forEach((entry) => {
    const key = routeSegmentOffsetKey(entry.routeId, entry.segmentIndex);
    if (seen.has(key)) return;
    seen.add(key);
    unique.push(entry);
  });

  return unique;
}

function canonicalSegmentKey(start: RouteSegmentPoint, end: RouteSegmentPoint): string {
  const startKey = pointKey(start);
  const endKey = pointKey(end);
  return startKey <= endKey ? `${startKey}|${endKey}` : `${endKey}|${startKey}`;
}

function canonicalSegmentPoints(start: RouteSegmentPoint, end: RouteSegmentPoint): { start: RouteSegmentPoint; end: RouteSegmentPoint } {
  return pointKey(start) <= pointKey(end)
    ? { start, end }
    : { start: end, end: start };
}

function pointKey(point: RouteSegmentPoint): string {
  if (point.stationId) return `station:${point.stationId}`;
  return `coord:${roundCoordinate(point.x)},${roundCoordinate(point.y)}`;
}

function roundCoordinate(value: number): number {
  return Math.round(value * COORDINATE_PRECISION) / COORDINATE_PRECISION;
}

function samePoint(start: RouteSegmentPoint, end: RouteSegmentPoint): boolean {
  return roundCoordinate(start.x) === roundCoordinate(end.x) && roundCoordinate(start.y) === roundCoordinate(end.y);
}

function isDrawablePoint(point: RouteSegmentPoint): boolean {
  return Number.isFinite(point.x) && Number.isFinite(point.y);
}

export const __test__ = {
  assignSegmentGroupOffsets,
  uniqueSegmentEntries,
  canonicalSegmentKey,
  canonicalSegmentPoints,
  pointKey,
  roundCoordinate,
  samePoint,
  isDrawablePoint
};
