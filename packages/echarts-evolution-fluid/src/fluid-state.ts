export type FluidSimulationMode = 'implicit' | 'physical';
export type FluidSimulationQuality = 'fast' | 'balanced' | 'smooth';

export interface FluidSimulationOptions {
  enabled: boolean;
  mode: FluidSimulationMode;
  quality: FluidSimulationQuality;
  substeps: number;
  surfaceThreshold: number;
  stickDistance: number;
  breakDistance: number;
  damping: number;
  surfaceTension: number;
  areaConservation: boolean;
}

export interface FluidParticle {
  id: string;
  entityId: string;
  kind: 'entity';
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  targetRadius: number;
  mass: number;
  color: string;
  opacity: number;
  active: boolean;
  groupId: string;
}

export interface FluidSurfaceGroup {
  id: string;
  particleIds: string[];
  mode: 'single' | 'fusing' | 'splitting' | 'detached';
  colorPolicy: 'target' | 'source' | 'mixed';
}

export interface FluidBlob {
  id: string;
  groupId: string;
  particleIds: string[];
  sourceIds: string[];
  targetIds: string[];
  kind: 'absorb' | 'split' | 'surface';
  path: string;
  color: string;
  opacity: number;
  z2: number;
}

export interface FluidRuntimeFrame {
  particles: FluidParticle[];
  groups: FluidSurfaceGroup[];
  blobs: FluidBlob[];
}

const DEFAULT_OPTIONS: FluidSimulationOptions = {
  enabled: false,
  mode: 'implicit',
  quality: 'balanced',
  substeps: 6,
  surfaceThreshold: 1,
  stickDistance: 0,
  breakDistance: 0,
  damping: 0.82,
  surfaceTension: 0.34,
  areaConservation: true
};

export function resolveFluidSimulationOptions(value: unknown): FluidSimulationOptions {
  const record = isRecord(value) ? value : {};
  return {
    enabled: record.enabled === true,
    mode: readMode(record.mode),
    quality: readQuality(record.quality),
    substeps: clampInteger(record.substeps, 1, 32, DEFAULT_OPTIONS.substeps),
    surfaceThreshold: finiteNumber(record.surfaceThreshold, DEFAULT_OPTIONS.surfaceThreshold),
    stickDistance: Math.max(0, finiteNumber(record.stickDistance, DEFAULT_OPTIONS.stickDistance)),
    breakDistance: Math.max(0, finiteNumber(record.breakDistance, DEFAULT_OPTIONS.breakDistance)),
    damping: clamp(finiteNumber(record.damping, DEFAULT_OPTIONS.damping), 0, 1),
    surfaceTension: clamp(finiteNumber(record.surfaceTension, DEFAULT_OPTIONS.surfaceTension), 0, 1),
    areaConservation: record.areaConservation !== false
  };
}

export function stableRound(value: number, precision = 1000): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * precision) / precision;
}

export function hasValidPath(path: string): boolean {
  return path.startsWith('M ')
    && !/\b(?:NaN|Infinity|-Infinity)\b/.test(path)
    && !/\s[AQ]\s/.test(path);
}

export function particleArea(radius: number): number {
  return Math.max(0, radius) ** 2;
}

export function radiusFromArea(area: number): number {
  return Math.sqrt(Math.max(0, area));
}

function readMode(value: unknown): FluidSimulationMode {
  return value === 'physical' ? 'physical' : 'implicit';
}

function readQuality(value: unknown): FluidSimulationQuality {
  if (value === 'fast' || value === 'smooth') return value;
  return 'balanced';
}

function clampInteger(value: unknown, min: number, max: number, fallback: number): number {
  return Math.min(max, Math.max(min, Math.round(finiteNumber(value, fallback))));
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
