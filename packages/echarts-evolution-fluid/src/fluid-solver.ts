import { contactProgress, createFluidIntents, intentProgress } from './fluid-events.js';
import type { FluidIntent } from './fluid-events.js';
import type { EvolutionFluidEntityLayout, EvolutionFluidNormalizedEvent } from './layout.js';
import type { FluidParticle, FluidRuntimeFrame, FluidSimulationOptions, FluidSurfaceGroup } from './fluid-state.js';
import { particleArea, radiusFromArea, stableRound } from './fluid-state.js';
import { createImplicitSurfaceBlobs } from './implicit-surface.js';

export function resolveFluidRuntimeFrame(
  entities: EvolutionFluidEntityLayout[],
  events: EvolutionFluidNormalizedEvent[],
  currentTimeValue: number | null,
  options: FluidSimulationOptions
): FluidRuntimeFrame {
  const particles = entities.map((entity) => toParticle(entity));
  const byEntityId = new Map(particles.map((particle) => [particle.entityId, particle]));
  const intents = createFluidIntents(events);
  const groups: FluidSurfaceGroup[] = [];
  const blobs: FluidRuntimeFrame['blobs'] = [];

  hidePendingSplitTargets(particles, intents, currentTimeValue);

  intents.forEach((intent) => {
    if (!isIntentVisible(intent, currentTimeValue)) return;
    if (intent.type === 'split') {
      const group = applySplitIntent(intent, byEntityId, currentTimeValue, options);
      if (group && isIntentSurfaceActive(intent, currentTimeValue)) groups.push(group);
      return;
    }
    if (intent.type === 'absorb' || intent.type === 'merge') {
      const group = applyAbsorbIntent(intent, byEntityId, currentTimeValue, options);
      if (group && isIntentSurfaceActive(intent, currentTimeValue)) groups.push(group);
    }
  });

  if (options.mode === 'physical') {
    applyPhysicalRepulsion(particles, groups, options);
  }

  groups.forEach((group) => {
    if (group.mode === 'detached') return;
    const target = group.particleIds.map((id) => particles.find((particle) => particle.id === id)).find(Boolean);
    if (!target) return;
    const intent = intents.find((item) => `fluid-group:${item.eventId}` === group.id);
    if (!intent) return;
    blobs.push(...createImplicitSurfaceBlobs(particles, [group], {
      sourceIds: intent.sourceIds,
      targetIds: intent.targetIds,
      kind: intent.type === 'split' ? 'split' : 'absorb',
      color: target.color,
      opacity: Math.min(1, Math.max(0, target.opacity)),
      surfaceThreshold: options.surfaceThreshold,
      quality: options.quality
    }));
  });

  return { particles, groups, blobs };
}

function applyAbsorbIntent(
  intent: FluidIntent,
  byEntityId: Map<string, FluidParticle>,
  currentTimeValue: number | null,
  options: FluidSimulationOptions
): FluidSurfaceGroup | null {
  const target = byEntityId.get(intent.targetIds[0] || intent.sourceIds[0]);
  const sources = intent.sourceIds
    .filter((id) => id !== target?.entityId)
    .map((id) => byEntityId.get(id))
    .filter((particle): particle is FluidParticle => Boolean(particle));
  if (!target || !sources.length) return null;
  const contact = contactProgress(intent, currentTimeValue);
  const localIndex = Math.min(sources.length - 1, Math.floor(contact * sources.length));
  const source = sources[localIndex];
  const global = intentProgress(intent, currentTimeValue);
  const local = clamp(contact * sources.length - localIndex, 0, 1);
  const approach = smootherStep(Math.min(1, global / 0.58));
  const shrink = smootherStep((local - 0.18) / 0.78);
  const swallow = smootherStep((local - 0.62) / 0.34);
  const initialTargetArea = particleArea(target.radius);
  const initialSourceRadius = source.radius;
  const initialSourceArea = particleArea(initialSourceRadius);
  const transferredArea = options.areaConservation ? initialSourceArea * shrink : 0;
  const direction = normalizedVector(target, source) || radialDirection(localIndex, sources.length);
  const contactDistance = Math.max(0, target.radius + initialSourceRadius - 1);
  const contactPoint = {
    x: target.x + direction.x * contactDistance,
    y: target.y + direction.y * contactDistance
  };
  const approachPoint = {
    x: lerp(source.x, contactPoint.x, approach),
    y: lerp(source.y, contactPoint.y, approach)
  };

  target.radius = stableRound(radiusFromArea(initialTargetArea + transferredArea));
  source.radius = stableRound(Math.max(0.08, radiusFromArea(initialSourceArea - transferredArea)));
  const nextPoint = {
    x: lerp(approachPoint.x, target.x, swallow),
    y: lerp(approachPoint.y, target.y, swallow)
  };
  if (options.mode === 'physical') {
    integrateParticleToward(source, nextPoint, Math.max(global, local), options);
  } else {
    source.x = stableRound(nextPoint.x);
    source.y = stableRound(nextPoint.y);
  }
  source.opacity = stableRound(Math.max(0.05, Math.min(source.opacity, source.radius / Math.max(1, initialSourceRadius * 0.45))));
  source.groupId = `fluid-group:${intent.eventId}`;
  target.groupId = source.groupId;

  if (local >= 1 || source.radius <= 0.1) {
    source.active = false;
    source.opacity = 0;
  }

  return {
    id: `fluid-group:${intent.eventId}`,
    particleIds: [target.id, source.id],
    mode: source.active ? 'fusing' : 'single',
    colorPolicy: 'target'
  };
}

function applySplitIntent(
  intent: FluidIntent,
  byEntityId: Map<string, FluidParticle>,
  currentTimeValue: number | null,
  options: FluidSimulationOptions
): FluidSurfaceGroup | null {
  const parent = byEntityId.get(intent.sourceIds[0]);
  const child = byEntityId.get(intent.targetIds[0]);
  if (!parent || !child) return null;
  const progress = intentProgress(intent, currentTimeValue);
  const grow = smootherStep(Math.min(1, progress / 0.62));
  const release = smootherStep((progress - 0.64) / 0.28);
  const direction = normalizedVector(parent, child) || { x: 1, y: 0 };
  child.active = true;
  child.radius = stableRound(Math.max(0.4, child.targetRadius * grow));
  child.opacity = stableRound(Math.max(0.08, grow));
  const attachedDistance = Math.max(0, parent.radius + child.radius - child.radius * 0.45);
  const detachedDistance = parent.radius + child.radius + Math.max(3, child.radius * 1.4);
  const centerDistance = lerp(attachedDistance, detachedDistance, release);
  child.x = stableRound(parent.x + direction.x * centerDistance);
  child.y = stableRound(parent.y + direction.y * centerDistance);
  if (options.mode === 'physical') {
    const impulse = release * child.radius * (0.35 + options.surfaceTension * 0.35);
    child.vx = stableRound(direction.x * impulse);
    child.vy = stableRound(direction.y * impulse);
  }
  const groupId = `fluid-group:${intent.eventId}`;
  parent.groupId = groupId;
  child.groupId = groupId;
  const gap = centerDistance - parent.radius - child.radius;
  return {
    id: groupId,
    particleIds: [parent.id, child.id],
    mode: gap > options.breakDistance ? 'detached' : 'splitting',
    colorPolicy: 'source'
  };
}

function hidePendingSplitTargets(
  particles: FluidParticle[],
  intents: FluidIntent[],
  currentTimeValue: number | null
): void {
  if (currentTimeValue == null) return;
  const byEntityId = new Map(particles.map((particle) => [particle.entityId, particle]));
  intents.forEach((intent) => {
    if (intent.type !== 'split' || currentTimeValue >= intent.startTime) return;
    intent.targetIds.forEach((id) => {
      if (hasEarlierVisibleIntent(id, intent, intents, currentTimeValue)) return;
      const particle = byEntityId.get(id);
      if (!particle) return;
      particle.active = false;
      particle.opacity = 0;
      particle.radius = 0;
    });
  });
}

function hasEarlierVisibleIntent(
  entityId: string,
  intent: FluidIntent,
  intents: FluidIntent[],
  currentTimeValue: number
): boolean {
  return intents.some((candidate) => (
    candidate !== intent
    && candidate.completionTime <= currentTimeValue
    && candidate.completionTime < intent.completionTime
    && (candidate.sourceIds.includes(entityId) || candidate.targetIds.includes(entityId))
  ));
}

function integrateParticleToward(
  particle: FluidParticle,
  destination: { x: number; y: number },
  progress: number,
  options: FluidSimulationOptions
): void {
  const steps = Math.max(1, Math.round(options.substeps * (1 + clamp(progress, 0, 1) * 3)));
  const force = (0.45 + options.surfaceTension * 0.55) / steps;
  let x = particle.x;
  let y = particle.y;
  let vx = particle.vx;
  let vy = particle.vy;

  for (let step = 0; step < steps; step += 1) {
    vx = (vx + (destination.x - x) * force) * options.damping;
    vy = (vy + (destination.y - y) * force) * options.damping;
    x += vx;
    y += vy;
  }

  particle.x = stableRound(x);
  particle.y = stableRound(y);
  particle.vx = stableRound(vx);
  particle.vy = stableRound(vy);
}

function applyPhysicalRepulsion(
  particles: FluidParticle[],
  groups: FluidSurfaceGroup[],
  options: FluidSimulationOptions
): void {
  const connectedPairs = new Set<string>();
  groups.forEach((group) => {
    group.particleIds.forEach((leftId, leftIndex) => {
      group.particleIds.slice(leftIndex + 1).forEach((rightId) => {
        connectedPairs.add(pairKey(leftId, rightId));
      });
    });
  });

  for (let iteration = 0; iteration < Math.max(1, options.substeps); iteration += 1) {
    for (let leftIndex = 0; leftIndex < particles.length; leftIndex += 1) {
      const left = particles[leftIndex];
      if (!left.active) continue;
      for (let rightIndex = leftIndex + 1; rightIndex < particles.length; rightIndex += 1) {
        const right = particles[rightIndex];
        if (!right.active || connectedPairs.has(pairKey(left.id, right.id))) continue;
        const dx = right.x - left.x;
        const dy = right.y - left.y;
        const rawDistance = Math.hypot(dx, dy);
        const fallback = stablePairDirection(left.id, right.id);
        const distance = rawDistance || 1;
        const minimumDistance = left.radius + right.radius + Math.max(0, options.stickDistance);
        if (distance >= minimumDistance) continue;
        const nx = rawDistance > 1e-6 ? dx / rawDistance : fallback.x;
        const ny = rawDistance > 1e-6 ? dy / rawDistance : fallback.y;
        const push = ((minimumDistance - distance) / 2) * (0.55 + options.surfaceTension * 0.25);
        left.x = stableRound(left.x - nx * push);
        left.y = stableRound(left.y - ny * push);
        right.x = stableRound(right.x + nx * push);
        right.y = stableRound(right.y + ny * push);
        left.vx = stableRound((left.vx - nx * push) * options.damping);
        left.vy = stableRound((left.vy - ny * push) * options.damping);
        right.vx = stableRound((right.vx + nx * push) * options.damping);
        right.vy = stableRound((right.vy + ny * push) * options.damping);
      }
    }
  }
}

function pairKey(leftId: string, rightId: string): string {
  return leftId < rightId ? `${leftId}\0${rightId}` : `${rightId}\0${leftId}`;
}

function stablePairDirection(leftId: string, rightId: string): { x: number; y: number } {
  const key = pairKey(leftId, rightId);
  let hash = 2166136261;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  const angle = ((hash >>> 0) / 4294967295) * Math.PI * 2;
  return {
    x: Math.cos(angle),
    y: Math.sin(angle)
  };
}

function toParticle(entity: EvolutionFluidEntityLayout): FluidParticle {
  return {
    id: entity.id,
    entityId: entity.id,
    kind: 'entity',
    x: entity.x,
    y: entity.y,
    vx: 0,
    vy: 0,
    radius: entity.r,
    targetRadius: entity.r,
    mass: Math.max(1, entity.r ** 2),
    color: entity.color,
    opacity: entity.opacity,
    active: entity.active,
    groupId: entity.id
  };
}

function isIntentVisible(intent: FluidIntent, currentTimeValue: number | null): boolean {
  if (currentTimeValue == null) return true;
  return currentTimeValue >= intent.startTime;
}

function isIntentSurfaceActive(intent: FluidIntent, currentTimeValue: number | null): boolean {
  if (currentTimeValue == null || currentTimeValue >= intent.completionTime) return false;
  if (intent.type === 'absorb' || intent.type === 'merge') {
    return currentTimeValue >= intent.contactTime;
  }
  return currentTimeValue >= intent.startTime;
}

function normalizedVector(from: { x: number; y: number }, to: { x: number; y: number }): { x: number; y: number } | null {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  if (!Number.isFinite(len) || len <= 1e-6) return null;
  return { x: dx / len, y: dy / len };
}

function radialDirection(index: number, total: number): { x: number; y: number } {
  const angle = (index / Math.max(1, total)) * Math.PI * 2;
  return { x: Math.cos(angle), y: Math.sin(angle) };
}

function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * clamp(amount, 0, 1);
}

function smootherStep(value: number): number {
  const t = clamp(value, 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
