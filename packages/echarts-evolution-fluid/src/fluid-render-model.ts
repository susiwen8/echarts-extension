import type { EvolutionFluidBridgeLayout, EvolutionFluidEntityLayout } from './layout.js';
import type { FluidRuntimeFrame } from './fluid-state.js';
import { stableRound } from './fluid-state.js';
import { createWaterdropFusionShape } from './metaball.js';

export function fluidFrameToEntities(
  baseEntities: EvolutionFluidEntityLayout[],
  frame: FluidRuntimeFrame
): EvolutionFluidEntityLayout[] {
  const byId = new Map(frame.particles.map((particle) => [particle.entityId, particle]));
  return baseEntities
    .map((entity) => {
      const particle = byId.get(entity.id);
      if (!particle) return entity;
      return {
        ...entity,
        x: stableRound(particle.x),
        y: stableRound(particle.y),
        r: stableRound(particle.radius),
        opacity: stableRound(particle.opacity),
        active: particle.active,
        color: particle.color
      };
    })
    .filter((entity) => entity.active && entity.r > 0.05 && entity.opacity > 0.005);
}

export function fluidFrameToBridges(frame: FluidRuntimeFrame): EvolutionFluidBridgeLayout[] {
  const byEntityId = new Map(frame.particles.map((particle) => [particle.entityId, particle]));
  return frame.blobs.map((blob) => ({
    id: blob.id,
    kind: blob.kind,
    sourceId: blob.sourceIds[0] || blob.particleIds[0] || '',
    targetId: blob.targetIds[0] || blob.particleIds[0] || '',
    sourceIds: blob.sourceIds,
    targetIds: blob.targetIds,
    path: blob.path,
    width: 1,
    opacity: blob.opacity,
    color: blob.color,
    surfaceShape: resolveSurfaceShape(blob, byEntityId)
  }));
}

function resolveSurfaceShape(
  blob: FluidRuntimeFrame['blobs'][number],
  byEntityId: Map<string, FluidRuntimeFrame['particles'][number]>
): EvolutionFluidBridgeLayout['surfaceShape'] {
  if (blob.kind !== 'absorb' && blob.kind !== 'split') return undefined;
  const source = blob.sourceIds
    .map((id) => byEntityId.get(id))
    .find((particle) => particle?.active && particle.radius > 0.05);
  const target = blob.targetIds
    .map((id) => byEntityId.get(id))
    .find((particle) => particle?.active && particle.radius > 0.05);
  if (!source || !target || source.entityId === target.entityId) return undefined;
  const minRadius = Math.min(source.radius, target.radius);
  const distance = Math.hypot(target.x - source.x, target.y - source.y);
  const gap = Math.max(0, distance - source.radius - target.radius);
  /* v8 ignore next -- Source/target validity is checked above, so null is only a defensive type fallback. */
  return createWaterdropFusionShape(
    { x: source.x, y: source.y, r: source.radius },
    { x: target.x, y: target.y, r: target.radius },
    {
      bridgeLength: Math.max(28, minRadius * 3.2, gap * 2.35),
      handleSize: 0.85,
      neckSize: minRadius,
      bridgeOnly: true
    }
  ) || undefined;
}
