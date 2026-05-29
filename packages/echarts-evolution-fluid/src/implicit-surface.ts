import type { FluidBlob, FluidParticle, FluidSimulationQuality, FluidSurfaceGroup } from './fluid-state.js';
import { hasValidPath, stableRound } from './fluid-state.js';

interface SurfaceContext {
  sourceIds: string[];
  targetIds: string[];
  kind: FluidBlob['kind'];
  color: string;
  opacity: number;
  surfaceThreshold: number;
  quality: FluidSimulationQuality;
}

interface Point {
  x: number;
  y: number;
}

export function createImplicitSurfaceBlobs(
  particles: FluidParticle[],
  groups: FluidSurfaceGroup[],
  context: SurfaceContext
): FluidBlob[] {
  const byId = new Map(
    particles
      .filter((particle) => particle.active && particle.radius > 0.05)
      .map((particle) => [particle.id, particle])
  );
  const blobs: FluidBlob[] = [];
  groups.forEach((group) => {
    const groupParticles = group.particleIds
      .map((id) => byId.get(id))
      .filter((particle): particle is FluidParticle => Boolean(particle));
    if (!groupParticles.length) return;
    const path = group.mode === 'detached'
      ? groupParticles.map((particle) => createCirclePath(particle.x, particle.y, particle.radius)).join(' ')
      : createConnectedContourPath(groupParticles, context);
    /* v8 ignore next -- Paths are produced by the helpers in this module; invalid path rejection is a defensive boundary. */
    if (!hasValidPath(path)) return;
    blobs.push({
      id: `fluid:${context.kind}:${group.id}`,
      groupId: group.id,
      particleIds: groupParticles.map((particle) => particle.id),
      sourceIds: context.sourceIds,
      targetIds: context.targetIds,
      kind: context.kind,
      path,
      color: context.color,
      opacity: context.opacity,
      z2: context.kind === 'split' ? 2 : 3
    });
  });
  return blobs;
}

function createConnectedContourPath(particles: FluidParticle[], context: SurfaceContext): string {
  if (particles.length === 1) return createCirclePath(particles[0].x, particles[0].y, particles[0].radius);
  const sampleCount = context.quality === 'smooth' ? 96 : context.quality === 'balanced' ? 72 : 48;
  const center = weightedCenter(particles);
  const isoValue = Math.max(0.66, context.surfaceThreshold);
  const maxRadius = particles.reduce((sum, particle) => sum + particle.radius, 0)
    + Math.max(...particles.map((particle) => distance(center, particle)));
  const points: Point[] = [];
  for (let index = 0; index < sampleCount; index += 1) {
    const angle = (index / sampleCount) * Math.PI * 2;
    const point = sampleContourPoint(center, angle, maxRadius, isoValue, particles);
    /* v8 ignore next 3 -- maxRadius is chosen to enclose the implicit field for valid active particles. */
    if (!point) {
      return particles.map((particle) => createCirclePath(particle.x, particle.y, particle.radius)).join(' ');
    }
    points.push(point);
  }
  return contourToCubicPath(points, 0.62);
}

function sampleContourPoint(
  center: Point,
  angle: number,
  maxRadius: number,
  isoValue: number,
  particles: FluidParticle[]
): Point | null {
  const direction = { x: Math.cos(angle), y: Math.sin(angle) };
  let low = 0;
  let high = Math.max(...particles.map((particle) => particle.radius), 1);
  while (high < maxRadius && fieldAt(rayPoint(center, direction, high), particles) > isoValue) {
    high *= 1.45;
  }
  /* v8 ignore next -- See createConnectedContourPath: valid particle groups should be enclosed by maxRadius. */
  if (fieldAt(rayPoint(center, direction, high), particles) > isoValue) return null;
  for (let iteration = 0; iteration < 24; iteration += 1) {
    const mid = (low + high) / 2;
    if (fieldAt(rayPoint(center, direction, mid), particles) > isoValue) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return rayPoint(center, direction, (low + high) / 2);
}

function fieldAt(point: Point, particles: FluidParticle[]): number {
  return particles.reduce((sum, particle) => {
    const dx = point.x - particle.x;
    const dy = point.y - particle.y;
    return sum + (particle.radius * particle.radius) / Math.max(1e-6, dx * dx + dy * dy);
  }, 0);
}

function weightedCenter(particles: FluidParticle[]): Point {
  /* v8 ignore next -- Caller filters to active particles with radius > 0.05, so total cannot be zero. */
  const total = particles.reduce((sum, particle) => sum + particle.radius * particle.radius, 0) || 1;
  return {
    x: particles.reduce((sum, particle) => sum + particle.x * particle.radius * particle.radius, 0) / total,
    y: particles.reduce((sum, particle) => sum + particle.y * particle.radius * particle.radius, 0) / total
  };
}

function contourToCubicPath(points: Point[], smoothness: number): string {
  const commands = [`M ${stableRound(points[0].x)} ${stableRound(points[0].y)}`];
  const tension = smoothness / 6;
  points.forEach((point, index) => {
    const previous = points[(index - 1 + points.length) % points.length];
    const next = points[(index + 1) % points.length];
    const afterNext = points[(index + 2) % points.length];
    commands.push([
      'C',
      stableRound(point.x + (next.x - previous.x) * tension),
      stableRound(point.y + (next.y - previous.y) * tension),
      stableRound(next.x - (afterNext.x - point.x) * tension),
      stableRound(next.y - (afterNext.y - point.y) * tension),
      stableRound(next.x),
      stableRound(next.y)
    ].join(' '));
  });
  commands.push('Z');
  return commands.join(' ');
}

function createCirclePath(cx: number, cy: number, radius: number): string {
  const k = 0.5522847498307936;
  const r = Math.max(0, radius);
  const c = r * k;
  return [
    `M ${stableRound(cx + r)} ${stableRound(cy)}`,
    `C ${stableRound(cx + r)} ${stableRound(cy + c)} ${stableRound(cx + c)} ${stableRound(cy + r)} ${stableRound(cx)} ${stableRound(cy + r)}`,
    `C ${stableRound(cx - c)} ${stableRound(cy + r)} ${stableRound(cx - r)} ${stableRound(cy + c)} ${stableRound(cx - r)} ${stableRound(cy)}`,
    `C ${stableRound(cx - r)} ${stableRound(cy - c)} ${stableRound(cx - c)} ${stableRound(cy - r)} ${stableRound(cx)} ${stableRound(cy - r)}`,
    `C ${stableRound(cx + c)} ${stableRound(cy - r)} ${stableRound(cx + r)} ${stableRound(cy - c)} ${stableRound(cx + r)} ${stableRound(cy)}`,
    'Z'
  ].join(' ');
}

function rayPoint(center: Point, direction: Point, radius: number): Point {
  return {
    x: center.x + direction.x * radius,
    y: center.y + direction.y * radius
  };
}

function distance(left: Point, right: Point): number {
  return Math.hypot(right.x - left.x, right.y - left.y);
}
