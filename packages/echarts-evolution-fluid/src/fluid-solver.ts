import { contactProgress, createFluidIntents, intentProgress } from './fluid-events.js';
import type { FluidIntent } from './fluid-events.js';
import type { EvolutionFluidEntityLayout, EvolutionFluidNormalizedEvent } from './layout.js';
import type { FluidParticle, FluidRuntimeFrame, FluidSimulationOptions, FluidSurfaceGroup } from './fluid-state.js';
import { particleArea, radiusFromArea, stableRound } from './fluid-state.js';
import { createImplicitSurfaceBlobs } from './implicit-surface.js';

const GENERATED_TARGET_EMERGENCE_CONTACT = 0.22;
const GENERATED_TARGET_SEED_AREA_RATIO = 0.14;

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

  hidePendingGeneratedParticles(particles, intents, currentTimeValue);
  hidePendingSplitTargets(particles, intents, currentTimeValue);

  intents.forEach((intent) => {
    if (!isIntentVisible(intent, currentTimeValue)) return;
    if (intent.type === 'split') {
      if (isSplitIntentComplete(intent, currentTimeValue)) return;
      const group = applySplitIntent(intent, byEntityId, currentTimeValue, options);
      if (group && isIntentSurfaceActive(intent, currentTimeValue)) groups.push(group);
      return;
    }
    if (intent.type === 'absorb' || intent.type === 'merge') {
      const group = applyAbsorbIntent(intent, byEntityId, currentTimeValue, options);
      if (group && isIntentSurfaceActive(intent, currentTimeValue)) groups.push(group);
    }
  });

  if (!options.disableRuntimeRepulsion) {
    applyPhysicalRepulsion(particles, groups, options);
  }
  enforceConnectedSurfaceContact(particles, groups);

  groups.forEach((group) => {
    if (group.mode === 'detached') return;
    const target = group.particleIds.map((id) => particles.find((particle) => particle.id === id)).find(Boolean);
    /* v8 ignore next -- Groups are built from live particles; this protects hand-built frame data only. */
    if (!target) return;
    const intent = intents.find((item) => `fluid-group:${item.eventId}` === group.id);
    /* v8 ignore next -- Groups are created from intents in this function, so missing intent is defensive. */
    if (!intent) return;
    /* v8 ignore next -- Runtime groups are created with source ids. */
    const sourceIds = group.sourceIds ?? intent.sourceIds;
    if ((intent.type === 'absorb' || intent.type === 'merge') && !sourceIds.length) return;
    blobs.push(...createImplicitSurfaceBlobs(particles, [group], {
      sourceIds,
      /* v8 ignore next -- Runtime groups are created with target ids. */
      targetIds: group.targetIds ?? intent.targetIds,
      kind: intent.type === 'split' ? 'split' : 'absorb',
      color: target.color,
      opacity: Math.min(1, Math.max(0, target.opacity)),
      surfaceThreshold: options.surfaceThreshold,
      quality: options.quality
    }));
  });

  return { particles, groups, blobs };
}

export function resolveStableFluidCollisionLayout(
  entities: EvolutionFluidEntityLayout[],
  options: FluidSimulationOptions
): EvolutionFluidEntityLayout[] {
  const particles = entities.map((entity) => toParticle(entity));
  applyPhysicalRepulsion(particles, [], options);
  const byEntityId = new Map(particles.map((particle) => [particle.entityId, particle]));
  return entities.map((entity) => {
    const particle = byEntityId.get(entity.id);
    /* v8 ignore next -- Particles are created one-to-one from the same entity list above. */
    if (!particle) return entity;
    return {
      ...entity,
      x: particle.x,
      y: particle.y
    };
  });
}

function applyAbsorbIntent(
  intent: FluidIntent,
  byEntityId: Map<string, FluidParticle>,
  currentTimeValue: number | null,
  options: FluidSimulationOptions
): FluidSurfaceGroup | null {
  /* v8 ignore next -- Absorb/merge intents normally carry target ids; source fallback supports loose data. */
  const target = byEntityId.get(intent.targetIds[0] || intent.sourceIds[0]);
  const sources = intent.sourceIds
    .filter((id) => id !== target?.entityId)
    .map((id) => byEntityId.get(id))
    .filter((particle): particle is FluidParticle => Boolean(particle));
  if (!target || !sources.length) return null;

  const contact = contactProgress(intent, currentTimeValue);
  const global = intentProgress(intent, currentTimeValue);
  const groupId = `fluid-group:${intent.eventId}`;
  const sourceProgress = target.generated
    ? clamp((contact - GENERATED_TARGET_EMERGENCE_CONTACT) / (1 - GENERATED_TARGET_EMERGENCE_CONTACT), 0, 1)
    : contact;
  const cursor = sourceProgress * sources.length;
  const initialTargetArea = target.generated ? 0 : particleArea(target.radius);
  /* v8 ignore next -- Particles are initialized with targetRadius. */
  const targetFullArea = particleArea(target.targetRadius || target.radius);
  /* v8 ignore next -- Generated and non-generated target paths are covered separately at layout level. */
  const seedTargetArea = target.generated ? targetFullArea * GENERATED_TARGET_SEED_AREA_RATIO : initialTargetArea;
  const sourceAreas = sources.map((source) => particleArea(source.radius));
  const totalSourceArea = sourceAreas.reduce((sum, area) => sum + area, 0);
  let absorbedSourceArea = 0;
  const activeSourceIds: string[] = [];
  const activeParticleIds = [target.id];
  const activeApproachIndex = Math.min(sources.length - 1, Math.floor(cursor));

  sources.forEach((source, index) => {
    const local = clamp(cursor - index, 0, 1);
    const shrink = sourceAbsorptionProgress(local, target.generated === true);
    absorbedSourceArea += sourceAreas[index] * shrink;
  });

  if (target.generated) {
    const emergence = smootherStep(contact / GENERATED_TARGET_EMERGENCE_CONTACT);
    /* v8 ignore next -- Generated-target no-conservation fallback is defensive; default conservation is covered. */
    const absorptionFill = options.areaConservation && totalSourceArea > 0
      ? clamp(absorbedSourceArea / totalSourceArea, 0, 1)
      : smootherStep(sourceProgress);
    target.radius = stableRound(radiusFromArea(
      seedTargetArea * emergence + (targetFullArea - seedTargetArea) * absorptionFill
    ));
  } else {
    /* v8 ignore next -- Runtime simulations use the default area-conserving path in covered behavior. */
    const transferredArea = options.areaConservation ? absorbedSourceArea : 0;
    target.radius = stableRound(radiusFromArea(initialTargetArea + transferredArea));
  }
  target.opacity = target.generated
    ? stableRound(Math.min(target.opacity, target.radius / Math.max(1, target.targetRadius * 0.75)))
    : target.opacity;
  target.active = !target.generated || (target.radius > 0.05 && target.opacity > 0.005);
  target.groupId = groupId;

  sources.forEach((source, index) => {
    const local = clamp(cursor - index, 0, 1);
    if (local >= 1) {
      source.active = false;
      source.opacity = 0;
      source.radius = 0;
      source.groupId = groupId;
      return;
    }

    const initialSourceRadius = source.targetRadius || source.radius;
    const initialSourceArea = sourceAreas[index];
    const rawSlot = cursor - index;

    if (local <= 0) {
      if (!target.generated && index === activeApproachIndex) {
        const approach = smootherStep(Math.min(1, global / 0.58))
          * smootherStep((rawSlot + 0.58) / 0.58);
        /* v8 ignore next -- Solver approach inputs are separated by precomputed layout. */
        const direction = normalizedVector(target, source) || radialDirection(index, sources.length);
        const contactDistance = Math.max(0, target.radius + initialSourceRadius - 1);
        const approachPoint = {
          x: lerp(source.x, target.x + direction.x * contactDistance, approach),
          y: lerp(source.y, target.y + direction.y * contactDistance, approach)
        };
        if (options.mode === 'physical') {
          integrateParticleToward(source, approachPoint, Math.max(global, approach), options);
        } else {
          source.x = stableRound(approachPoint.x);
          source.y = stableRound(approachPoint.y);
        }
      }
      return;
    }

    const shrink = sourceAbsorptionProgress(local, target.generated === true);
    source.radius = stableRound(Math.max(0.08, radiusFromArea(initialSourceArea * (1 - shrink))));
    let nextPoint = {
      x: lerp(source.x, target.x, local),
      y: lerp(source.y, target.y, local)
    };
    if (!target.generated) {
      const swallow = sourceSwallowProgress(local);
      const approach = sourceApproachProgress(rawSlot, global);
      const direction = normalizedVector(target, source) || radialDirection(index, sources.length);
      const contactDistance = Math.max(0, target.radius + initialSourceRadius - 1);
      const contactPoint = {
        x: target.x + direction.x * contactDistance,
        y: target.y + direction.y * contactDistance
      };
      const approachPoint = {
        x: lerp(source.x, contactPoint.x, approach),
        y: lerp(source.y, contactPoint.y, approach)
      };
      nextPoint = {
        x: lerp(approachPoint.x, target.x, swallow),
        y: lerp(approachPoint.y, target.y, swallow)
      };
    }
    if (options.mode === 'physical') {
      integrateParticleToward(source, nextPoint, Math.max(global, local), options);
    } else {
      source.x = stableRound(nextPoint.x);
      source.y = stableRound(nextPoint.y);
    }
    source.opacity = stableRound(Math.max(0.05, Math.min(source.opacity, source.radius / Math.max(1, initialSourceRadius * 0.45))));
    source.groupId = groupId;

    activeSourceIds.push(source.entityId);
    activeParticleIds.push(source.id);
  });

  return {
    id: groupId,
    particleIds: activeParticleIds,
    sourceIds: activeSourceIds,
    targetIds: intent.targetIds,
    mode: activeSourceIds.length ? 'fusing' : 'single',
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
    sourceIds: intent.sourceIds,
    targetIds: intent.targetIds,
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
      /* v8 ignore next -- Covered layout keeps earlier targets visible; this is a solver-level mirror guard. */
      if (hasEarlierVisibleIntent(id, intent, intents, currentTimeValue)) return;
      const particle = byEntityId.get(id);
      if (!particle) return;
      particle.active = false;
      particle.opacity = 0;
      particle.radius = 0;
    });
  });
}

function hidePendingGeneratedParticles(
  particles: FluidParticle[],
  intents: FluidIntent[],
  currentTimeValue: number | null
): void {
  if (currentTimeValue == null) return;
  const byEntityId = new Map(particles.map((particle) => [particle.entityId, particle]));
  intents.forEach((intent) => {
    if (currentTimeValue >= intent.startTime) return;
    [...intent.sourceIds, ...intent.targetIds].forEach((id) => {
      if (hasEarlierVisibleIntent(id, intent, intents, currentTimeValue)) return;
      const particle = byEntityId.get(id);
      if (!particle?.generated) return;
      /* v8 ignore next 2 -- Generated pending particles are normally hidden by layout staging before solver input. */
      particle.active = false;
      /* v8 ignore next -- Same generated pending guard as above. */
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

function enforceConnectedSurfaceContact(particles: FluidParticle[], groups: FluidSurfaceGroup[]): void {
  const byId = new Map(particles.map((particle) => [particle.id, particle]));
  const byEntityId = new Map(particles.map((particle) => [particle.entityId, particle]));
  groups.forEach((group) => {
    if (group.mode !== 'fusing' && group.mode !== 'splitting') return;
    const anchorIds = group.mode === 'fusing' ? group.targetIds : group.sourceIds;
    const movingIds = group.mode === 'fusing' ? group.sourceIds : group.targetIds;
    const anchor = anchorIds?.map((id) => byEntityId.get(id)).find((particle) => particle?.active);
    if (!anchor || anchor.generated) return;
    movingIds?.forEach((id, index) => {
      const moving = byEntityId.get(id);
      /* v8 ignore next -- Active connected groups are built from visible nonzero particles. */
      if (!moving?.active || moving.radius <= 0.05) return;
      clampConnectedPairDistance(anchor, moving, group.id, index);
    });
    if (movingIds?.length) return;
    /* v8 ignore start -- Runtime-created groups always carry moving ids; fallback supports hand-built frames. */
    const fallback = group.particleIds
      .map((id) => byId.get(id))
      .filter((particle): particle is FluidParticle => Boolean(particle?.active && particle !== anchor));
    fallback.forEach((moving, index) => clampConnectedPairDistance(anchor, moving, group.id, index));
    /* v8 ignore stop */
  });
}

function clampConnectedPairDistance(
  anchor: FluidParticle,
  moving: FluidParticle,
  groupId: string,
  index: number
): void {
  const dx = moving.x - anchor.x;
  const dy = moving.y - anchor.y;
  const rawDistance = Math.hypot(dx, dy);
  /* v8 ignore next -- Connected particles are separated before this clamp in normal solver output. */
  const fallback = stablePairDirection(groupId, moving.id || String(index));
  /* v8 ignore next 2 -- Same defensive zero-distance fallback as above. */
  const nx = rawDistance > 1e-6 ? dx / rawDistance : fallback.x;
  /* v8 ignore next -- Same defensive zero-distance fallback as above. */
  const ny = rawDistance > 1e-6 ? dy / rawDistance : fallback.y;
  const desiredDistance = Math.max(0, anchor.radius + moving.radius - Math.min(anchor.radius, moving.radius) * 0.08);
  if (rawDistance <= desiredDistance + 0.5) return;
  moving.x = stableRound(anchor.x + nx * desiredDistance);
  moving.y = stableRound(anchor.y + ny * desiredDistance);
  moving.vx = 0;
  moving.vy = 0;
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
    groupId: entity.id,
    generated: isGeneratedEntity(entity.raw)
  };
}

function isGeneratedEntity(raw: unknown): boolean {
  return typeof raw === 'object' && raw != null && !Array.isArray(raw) && (raw as { generated?: unknown }).generated === true;
}

function isIntentVisible(intent: FluidIntent, currentTimeValue: number | null): boolean {
  if (currentTimeValue == null) return true;
  return currentTimeValue >= intent.startTime;
}

function isSplitIntentComplete(intent: FluidIntent, currentTimeValue: number | null): boolean {
  return currentTimeValue == null || currentTimeValue >= intent.completionTime;
}

function isIntentSurfaceActive(intent: FluidIntent, currentTimeValue: number | null): boolean {
  if (currentTimeValue == null || currentTimeValue >= intent.completionTime) return false;
  if (intent.type === 'absorb' || intent.type === 'merge') {
    return currentTimeValue >= intent.contactTime;
  }
  return currentTimeValue >= intent.startTime;
}

function sourceApproachProgress(slot: number, global: number): number {
  return smootherStep(Math.min(1, global / 0.58)) * smootherStep((slot + 0.58) / 0.58);
}

function sourceAbsorptionProgress(local: number, generatedTarget: boolean): number {
  return generatedTarget
    ? smootherStep((local - 0.32) / 0.62)
    : smootherStep((local - 0.18) / 0.78);
}

function sourceSwallowProgress(local: number): number {
  return smootherStep((local - 0.62) / 0.34);
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
