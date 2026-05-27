import type { EvolutionFluidNormalizedEvent } from './layout.js';

export interface FluidIntent {
  eventId: string;
  type: 'absorb' | 'merge' | 'split' | 'custom';
  startTime: number;
  contactTime: number;
  completionTime: number;
  sourceIds: string[];
  targetIds: string[];
  value: number;
}

export function createFluidIntents(events: EvolutionFluidNormalizedEvent[]): FluidIntent[] {
  return events
    .map((event) => toFluidIntent(event))
    .filter((intent): intent is FluidIntent => Boolean(intent));
}

export function activeFluidIntents(intents: FluidIntent[], currentTimeValue: number | null): FluidIntent[] {
  if (currentTimeValue == null) return intents;
  return intents.filter((intent) => currentTimeValue >= intent.startTime && currentTimeValue <= intent.completionTime);
}

export function intentProgress(intent: FluidIntent, currentTimeValue: number | null): number {
  if (currentTimeValue == null) return 1;
  const span = Math.max(1e-9, intent.completionTime - intent.startTime);
  return clamp((currentTimeValue - intent.startTime) / span, 0, 1);
}

export function contactProgress(intent: FluidIntent, currentTimeValue: number | null): number {
  if (currentTimeValue == null) return 1;
  const span = Math.max(1e-9, intent.completionTime - intent.contactTime);
  return clamp((currentTimeValue - intent.contactTime) / span, 0, 1);
}

function toFluidIntent(event: EvolutionFluidNormalizedEvent): FluidIntent | null {
  const type = normalizeType(event.type);
  if (!event.sourceIds.length && !event.targetIds.length) return null;
  return {
    eventId: event.id,
    type,
    startTime: round(event.timeValue - 1),
    contactTime: round(event.timeValue - 0.42),
    completionTime: event.timeValue,
    sourceIds: event.sourceIds,
    targetIds: event.targetIds,
    value: event.value
  };
}

function normalizeType(type: string): FluidIntent['type'] {
  if (type === 'acquire') return 'absorb';
  if (type === 'merge') return 'merge';
  if (type === 'split' || type === 'spinOff') return 'split';
  return 'custom';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number): number {
  return Math.round((value + Number.EPSILON) * 1000) / 1000;
}
