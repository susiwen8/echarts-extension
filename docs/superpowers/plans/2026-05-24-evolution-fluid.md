# Evolution Fluid Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `@echarts-extension/evolution-fluid`, an event-list-driven ECharts series that animates company and industry evolution with deterministic metaball-style droplet fusion.

**Architecture:** Add a standalone workspace package with pure layout/timeline/metaball helpers and an ECharts renderer that draws droplets, bridge paths, event markers, labels, and a scrub timeline. Keep rendering deterministic, dependency-free, and compatible with the repository's existing TypeScript, docs, visual regression, and browser test workflow.

**Tech Stack:** TypeScript 6, ECharts 5/6 extension APIs, ZRender graphic primitives through ECharts, Vitest, Vite workspace builds, existing `@echarts-extension/layout-core` helpers.

---

## Execution Notes

- Before implementation work, create or switch to a feature branch such as `codex/evolution-fluid`; do not implement on `main`.
- The current worktree may contain unrelated user changes. Stage only files listed in each task.
- Preserve existing package style: side-effect `index.ts`, package-local `src/*.ts`, generated `lib` and `dist` ignored, README option tables consumed by `scripts/sync-options-from-readmes.mjs`.
- Do not add runtime dependencies.
- Use Lore commit messages for every commit.

## File Map

Create:

- `packages/echarts-evolution-fluid/package.json` - workspace package metadata and scripts.
- `packages/echarts-evolution-fluid/tsconfig.json` - package TypeScript build config.
- `packages/echarts-evolution-fluid/index.ts` - side-effect registration entry.
- `packages/echarts-evolution-fluid/index.d.ts` - ECharts type augmentation.
- `packages/echarts-evolution-fluid/src/layout.ts` - data normalization, event ordering, category layout, frame derivation, interpolation.
- `packages/echarts-evolution-fluid/src/metaball.ts` - deterministic bridge geometry.
- `packages/echarts-evolution-fluid/src/evolution-fluid.ts` - ECharts series model and chart view renderer.
- `packages/echarts-evolution-fluid/test/evolution-fluid.test.ts` - package unit tests.
- `packages/echarts-evolution-fluid/README.md` and `README_CN.md` - user docs and option tables.
- `docs/templates/packages/echarts-evolution-fluid/index.tpl` - standard demo page.
- `docs/templates/packages/echarts-evolution-fluid/large.tpl` - large demo page.

Modify:

- `package.json` - add the new workspace to `build:ts`.
- `package-lock.json` - refresh workspace lock metadata after package creation.
- `vitest.config.js` - add the workspace alias used by tests.
- `.github/npm-publish-allowlist.json` - include `@echarts-extension/evolution-fluid` when package is release-ready.
- `scripts/sync-options-from-readmes.mjs` - add `echarts-evolution-fluid` to `PACKAGE_ORDER`.
- `docs/templates/index.tpl` - add gallery card.
- `docs/shared/demo-data.js` - add standard demo data.
- `docs/shared/demo-runner.js` - add registry entry, option factory, controls, and item-count support for the new demo.
- `docs/shared/large-data.js` - add generated large demo.
- `tests/render-variants.test.ts` - import package and cover renderer option variants.
- `tests/renderer-registration.test.ts` - ensure lifecycle coverage includes the package through existing dynamic import flow.
- `tests/visual/render-fixture.ts` and `tests/visual/visual-regression.test.ts` - add deterministic SVG fixture.
- `tests/browser-visual/cases.ts` - add docs visual case.
- `tests/browser-perf/cases.ts` - add large-page performance smoke case.
- `README.md` and `README_CN.md` - add chart gallery entry after visual baseline exists.

## Task 1: Package Scaffold And Minimal Registration

**Files:**
- Create: `packages/echarts-evolution-fluid/package.json`
- Create: `packages/echarts-evolution-fluid/tsconfig.json`
- Create: `packages/echarts-evolution-fluid/index.ts`
- Create: `packages/echarts-evolution-fluid/src/evolution-fluid.ts`
- Create: `packages/echarts-evolution-fluid/src/layout.ts`
- Create: `packages/echarts-evolution-fluid/src/metaball.ts`
- Create: `packages/echarts-evolution-fluid/test/evolution-fluid.test.ts`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `vitest.config.js`

- [ ] **Step 1: Create the package manifest**

Use this exact package metadata:

```json
{
  "name": "@echarts-extension/evolution-fluid",
  "version": "0.1.0",
  "description": "ECharts extension chart for event-driven droplet evolution maps",
  "type": "module",
  "main": "lib/index.js",
  "types": "index.d.ts",
  "license": "MIT",
  "scripts": {
    "build:ts": "tsc -p tsconfig.json",
    "test": "npm run build:ts && vitest run --config ../../vitest.config.js packages/echarts-evolution-fluid/test/evolution-fluid.test.ts",
    "test:unit": "vitest run --config ../../vitest.config.js packages/echarts-evolution-fluid/test/evolution-fluid.test.ts",
    "build": "vite build --config ../../vite.config.js --mode development",
    "release": "vite build --config ../../vite.config.js --mode production && vite build --config ../../vite.config.js --mode development"
  },
  "dependencies": {
    "@echarts-extension/layout-core": "0.1.0"
  },
  "peerDependencies": {
    "echarts": "^5.0.1 || ^6.0.0"
  },
  "publishConfig": {
    "access": "public"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/susiwen8/echarts-extension.git",
    "directory": "packages/echarts-evolution-fluid"
  }
}
```

- [ ] **Step 2: Create package TypeScript config**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": ".",
    "outDir": "lib",
    "declaration": false
  },
  "include": ["../../types/**/*.d.ts", "index.ts", "src/**/*.ts"]
}
```

- [ ] **Step 3: Create side-effect entry**

```ts
import './src/evolution-fluid.js';
```

- [ ] **Step 4: Create minimal layout export**

Start `src/layout.ts` with a deterministic empty-safe result so imports compile:

```ts
export type EvolutionFluidEventType = 'found' | 'acquire' | 'merge' | 'split' | 'spinOff' | 'rename' | 'close' | string;

export interface EvolutionFluidEntityInput {
  id?: string | number;
  name?: string | number;
  label?: string | number;
  value?: unknown;
  industry?: string | number;
  category?: string | number;
  itemStyle?: Record<string, unknown>;
  label?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface EvolutionFluidEventInput {
  id?: string | number;
  time?: string | number | Date;
  type?: EvolutionFluidEventType;
  sources?: Array<string | number>;
  targets?: Array<string | number>;
  value?: unknown;
  eventStyle?: Record<string, unknown>;
  label?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface EvolutionFluidLayoutOption {
  width?: number;
  height?: number;
  entities?: unknown[];
  events?: unknown[];
  data?: unknown[];
  timeField?: string;
  entityIdField?: string;
  valueField?: string;
  categoryField?: string;
  currentTime?: string | number | Date | null;
  layout?: unknown;
  layoutOptions?: unknown;
  dropletStyle?: unknown;
  timeline?: unknown;
  [key: string]: unknown;
}

export interface EvolutionFluidEntityLayout {
  id: string;
  name: string;
  category: string;
  value: number;
  x: number;
  y: number;
  r: number;
  opacity: number;
  color: string;
  active: boolean;
  dataIndex: number;
  raw: unknown;
}

export interface EvolutionFluidEventLayout {
  id: string;
  type: string;
  time: string;
  order: number;
  sourceIds: string[];
  targetIds: string[];
  value: number;
  x: number;
  y: number;
  r: number;
  raw: unknown;
}

export interface EvolutionFluidBridgeLayout {
  id: string;
  sourceId: string;
  targetId: string;
  path: string;
  width: number;
  opacity: number;
}

export interface EvolutionFluidTimelineTick {
  time: string;
  x: number;
  active: boolean;
}

export interface EvolutionFluidLayoutResult {
  width: number;
  height: number;
  progress: number;
  entities: EvolutionFluidEntityLayout[];
  events: EvolutionFluidEventLayout[];
  bridges: EvolutionFluidBridgeLayout[];
  timeline: {
    show: boolean;
    y: number;
    startX: number;
    endX: number;
    ticks: EvolutionFluidTimelineTick[];
    handleX: number;
  };
}

export function resolveEvolutionFluidLayout(option: EvolutionFluidLayoutOption = {}): EvolutionFluidLayoutResult {
  const width = finiteNumber(option.width, 800);
  const height = finiteNumber(option.height, 480);
  const timelineY = Math.max(40, height - 34);

  return {
    width,
    height,
    progress: 0,
    entities: [],
    events: [],
    bridges: [],
    timeline: {
      show: true,
      y: timelineY,
      startX: 48,
      endX: Math.max(49, width - 48),
      ticks: [],
      handleX: 48
    }
  };
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
```

- [ ] **Step 5: Create minimal metaball export**

```ts
export interface MetaballCircle {
  x: number;
  y: number;
  r: number;
}

export interface MetaballBridgeOptions {
  maxDistance?: number;
  handleSize?: number;
}

export function createMetaballBridgePath(
  source: MetaballCircle,
  target: MetaballCircle,
  options: MetaballBridgeOptions = {}
): string {
  const maxDistance = finiteNumber(options.maxDistance, 120);
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const distance = Math.hypot(dx, dy);
  if (!Number.isFinite(distance) || distance <= 0 || distance > maxDistance) return '';

  const nx = dx / distance;
  const ny = dy / distance;
  const px = -ny;
  const py = nx;
  const bridge = Math.max(2, Math.min(source.r, target.r) * (1 - distance / maxDistance) * 0.9);
  const s1 = { x: source.x + px * bridge, y: source.y + py * bridge };
  const s2 = { x: source.x - px * bridge, y: source.y - py * bridge };
  const t1 = { x: target.x + px * bridge, y: target.y + py * bridge };
  const t2 = { x: target.x - px * bridge, y: target.y - py * bridge };
  const handle = finiteNumber(options.handleSize, distance * 0.42);
  const c1 = { x: s1.x + nx * handle, y: s1.y + ny * handle };
  const c2 = { x: t1.x - nx * handle, y: t1.y - ny * handle };
  const c3 = { x: t2.x - nx * handle, y: t2.y - ny * handle };
  const c4 = { x: s2.x + nx * handle, y: s2.y + ny * handle };

  return [
    `M ${round(s1.x)} ${round(s1.y)}`,
    `C ${round(c1.x)} ${round(c1.y)} ${round(c2.x)} ${round(c2.y)} ${round(t1.x)} ${round(t1.y)}`,
    `L ${round(t2.x)} ${round(t2.y)}`,
    `C ${round(c3.x)} ${round(c3.y)} ${round(c4.x)} ${round(c4.y)} ${round(s2.x)} ${round(s2.y)}`,
    'Z'
  ].join(' ');
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function round(value: number): number {
  return Math.round((value + Number.EPSILON) * 1000) / 1000;
}
```

- [ ] **Step 6: Create minimal ECharts registration**

`src/evolution-fluid.ts` should register a compilable empty-safe chart:

```ts
import * as echarts from 'echarts/lib/echarts';

import { resolveEvolutionFluidLayout } from './layout.js';
import type { EvolutionFluidLayoutOption } from './layout.js';

interface ViewRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface EChartsApi {
  getWidth(): number;
  getHeight(): number;
}

interface EChartsModel {
  get(path: string | string[]): unknown;
}

interface EvolutionFluidSeriesModel extends EChartsModel {
  option?: EvolutionFluidLayoutOption;
  getBoxLayoutParams(): unknown;
  getData?: () => SeriesData;
}

interface GraphicGroup {
  removeAll(): void;
}

interface EvolutionFluidView {
  group: GraphicGroup;
}

interface EChartsHost {
  extendSeriesModel(option: Record<string, unknown>): void;
  extendChartView(option: Record<string, unknown>): void;
  helper: {
    getLayoutRect(params: unknown, container: { width: number; height: number }): ViewRect;
  };
}

const echartsHost = echarts as unknown as EChartsHost;

echartsHost.extendSeriesModel({
  type: 'series.evolutionFluid',
  defaultOption: {
    left: 'center',
    top: 'center',
    width: '94%',
    height: '86%',
    entities: [],
    events: [],
    timeField: 'time',
    entityIdField: 'id',
    valueField: 'value',
    categoryField: 'industry',
    currentTime: null,
    autoplay: true,
    playSpeed: 1,
    layout: {
      clustering: 'category',
      center: ['50%', '48%'],
      categoryGap: 120,
      collisionPadding: 8
    },
    dropletStyle: {
      minRadius: 10,
      maxRadius: 58,
      opacity: 0.82,
      bridgeOpacity: 0.55,
      bridgeThreshold: 120
    },
    timeline: {
      show: true,
      bottom: 18,
      height: 36
    },
    label: {
      show: true,
      formatter: '{b}'
    },
    eventLabel: {
      show: true,
      formatter: '{type}'
    },
    tooltip: {
      trigger: 'item'
    }
  }
});

echartsHost.extendChartView({
  type: 'evolutionFluid',
  render(this: EvolutionFluidView, seriesModel: EvolutionFluidSeriesModel, ecModel: unknown, api: EChartsApi) {
    const rect = echartsHost.helper.getLayoutRect(seriesModel.getBoxLayoutParams(), {
      width: api.getWidth(),
      height: api.getHeight()
    });
    resolveEvolutionFluidLayout({
      ...(seriesModel.option || {}),
      width: rect.width,
      height: rect.height
    });
    this.group.removeAll();
  },
  remove(this: EvolutionFluidView) {
    this.group.removeAll();
  },
  dispose(this: EvolutionFluidView) {
    this.group.removeAll();
  }
});
```

- [ ] **Step 7: Add a scaffold test**

```ts
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'vitest';

import '../index.ts';
import { resolveEvolutionFluidLayout } from '../src/layout.ts';
import { createMetaballBridgePath } from '../src/metaball.ts';

test('does not add visualization runtime dependencies', () => {
  const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

  assert.equal(packageJson.dependencies?.d3, undefined);
  assert.equal(packageJson.dependencies?.['matter-js'], undefined);
  assert.equal(packageJson.dependencies?.['pixi.js'], undefined);
});

test('returns an empty-safe layout result', () => {
  const layout = resolveEvolutionFluidLayout({ width: 640, height: 360 });

  assert.equal(layout.width, 640);
  assert.equal(layout.height, 360);
  assert.deepEqual(layout.entities, []);
  assert.deepEqual(layout.events, []);
  assert.equal(layout.timeline.show, true);
});

test('creates deterministic bridge paths between nearby droplets', () => {
  assert.equal(
    createMetaballBridgePath({ x: 0, y: 0, r: 20 }, { x: 60, y: 0, r: 16 }, { maxDistance: 100 }),
    'M 0 5.76 C 25.2 5.76 34.8 5.76 60 5.76 L 60 -5.76 C 34.8 -5.76 25.2 -5.76 0 -5.76 Z'
  );
  assert.equal(createMetaballBridgePath({ x: 0, y: 0, r: 20 }, { x: 200, y: 0, r: 16 }, { maxDistance: 100 }), '');
});
```

- [ ] **Step 8: Add root build script entry**

Modify the root `build:ts` script by inserting this workspace after `@echarts-extension/subway` and before `@echarts-extension/sequence-diagram`:

```text
npm --workspace @echarts-extension/evolution-fluid run build:ts
```

- [ ] **Step 9: Add Vitest alias**

In `vitest.config.js`, add this alias after the fractal alias:

```js
'@echarts-extension/evolution-fluid': path.join(root, 'packages/echarts-evolution-fluid/index.ts'),
```

- [ ] **Step 10: Refresh lock metadata**

Run:

```bash
npm install --package-lock-only
```

Expected: `package-lock.json` records `packages/echarts-evolution-fluid` and no new third-party packages.

- [ ] **Step 11: Verify scaffold**

Run:

```bash
npm --workspace @echarts-extension/evolution-fluid run test:unit
npm run build:ts
```

Expected: both commands exit 0.

- [ ] **Step 12: Commit scaffold**

```bash
git add package.json package-lock.json vitest.config.js packages/echarts-evolution-fluid
git commit -m "Create the evolution fluid chart package scaffold" -m "The event-driven droplet chart needs its own package so layout, geometry, renderer, docs, and tests can evolve without crowding nearby chart implementations.

Constraint: Follow the existing workspace package shape and avoid runtime dependencies
Confidence: high
Scope-risk: narrow
Tested: npm --workspace @echarts-extension/evolution-fluid run test:unit; npm run build:ts
Not-tested: Full renderer behavior is added in later tasks"
```

## Task 2: Event Data Normalization And Radius Scaling

**Files:**
- Modify: `packages/echarts-evolution-fluid/src/layout.ts`
- Modify: `packages/echarts-evolution-fluid/test/evolution-fluid.test.ts`

- [ ] **Step 1: Add failing normalization tests**

Append tests that prove entity normalization, missing entity fallback, event ordering, duplicate time ordering, and invalid values:

```ts
test('normalizes entities, events, and missing event references', () => {
  const layout = resolveEvolutionFluidLayout({
    width: 800,
    height: 420,
    entities: [
      { id: 'alpha', name: 'Alpha AI', industry: 'AI', value: 120, itemStyle: { color: '#38bdf8' } },
      { id: 'beta', name: 'Beta Cloud', category: 'Cloud', value: 80 }
    ],
    events: [
      { time: '2021', type: 'acquire', sources: ['beta', 'missing'], targets: ['alpha'], value: 45 },
      { time: '2019', type: 'found', targets: ['alpha'], value: 'bad' },
      { time: '2021', type: 'rename', sources: ['alpha'], targets: ['alpha'], value: 0 }
    ],
    currentTime: '2021'
  });

  assert.deepEqual(layout.events.map((event) => `${event.time}:${event.type}:${event.order}`), [
    '2019:found:1',
    '2021:acquire:0',
    '2021:rename:2'
  ]);
  assert.ok(layout.entities.some((entity) => entity.id === 'missing'));
  assert.equal(layout.entities.find((entity) => entity.id === 'alpha')?.name, 'Alpha AI');
  assert.equal(layout.entities.find((entity) => entity.id === 'beta')?.category, 'Cloud');
  assert.ok((layout.entities.find((entity) => entity.id === 'alpha')?.r || 0) > (layout.entities.find((entity) => entity.id === 'beta')?.r || 0));
  assert.ok(layout.events.every((event) => event.value >= 0));
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
npm --workspace @echarts-extension/evolution-fluid run test:unit
```

Expected: FAIL because normalization is not implemented.

- [ ] **Step 3: Implement normalization helpers**

Replace `layout.ts` content with focused helpers. Preserve exported interfaces from Task 1 and add these implementation helpers:

```ts
const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 480;
const DEFAULT_COLORS = ['#38bdf8', '#34d399', '#a78bfa', '#f59e0b', '#fb7185', '#22c55e', '#60a5fa'];
const DEFAULT_MIN_RADIUS = 10;
const DEFAULT_MAX_RADIUS = 58;

interface NormalizedEntity {
  id: string;
  name: string;
  category: string;
  value: number;
  color: string;
  dataIndex: number;
  raw: unknown;
}

interface NormalizedEvent {
  id: string;
  type: string;
  time: string;
  timeValue: number;
  order: number;
  sourceIds: string[];
  targetIds: string[];
  value: number;
  raw: unknown;
}

function normalizeEntities(option: EvolutionFluidLayoutOption): NormalizedEntity[] {
  const rawEntities = normalizeUnknownArray(option.entities ?? option.data);
  const idField = readString(option.entityIdField) || 'id';
  const valueField = readString(option.valueField) || 'value';
  const categoryField = readString(option.categoryField) || 'industry';
  const seen = new Set<string>();
  return rawEntities.map((raw, index) => normalizeEntity(raw, index, idField, valueField, categoryField, seen));
}

function normalizeEntity(
  raw: unknown,
  index: number,
  idField: string,
  valueField: string,
  categoryField: string,
  seen: Set<string>
): NormalizedEntity {
  const record = isRecord(raw) ? raw : { value: raw };
  const baseId = readString(readField(record, idField) ?? record.id ?? record.name ?? record.label) || `entity-${index}`;
  const id = uniqueId(baseId, seen);
  const name = readString(record.name ?? record.label ?? record.id) || id;
  const category = readString(readField(record, categoryField) ?? record.category ?? record.industry) || 'default';
  return {
    id,
    name,
    category,
    value: nonNegativeNumber(readField(record, valueField) ?? record.value, 1),
    color: readItemColor(record) || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
    dataIndex: index,
    raw
  };
}

function normalizeEvents(option: EvolutionFluidLayoutOption): NormalizedEvent[] {
  const rawEvents = normalizeUnknownArray(option.events);
  const timeField = readString(option.timeField) || 'time';
  return rawEvents
    .map((raw, index) => normalizeEvent(raw, index, timeField))
    .sort((left, right) => left.timeValue - right.timeValue || left.order - right.order);
}

function normalizeEvent(raw: unknown, order: number, timeField: string): NormalizedEvent {
  const record = isRecord(raw) ? raw : {};
  const timeRaw = readField(record, timeField) ?? record.time ?? order;
  const time = stringifyValue(timeRaw, String(order));
  return {
    id: readString(record.id) || `event-${order}`,
    type: readString(record.type) || 'custom',
    time,
    timeValue: timeToNumber(timeRaw, order),
    order,
    sourceIds: readIdArray(record.sources ?? record.source ?? record.from),
    targetIds: readIdArray(record.targets ?? record.target ?? record.to),
    value: nonNegativeNumber(record.value, 0),
    raw
  };
}

function ensureReferencedEntities(entities: NormalizedEntity[], events: NormalizedEvent[]): NormalizedEntity[] {
  const byId = new Map(entities.map((entity) => [entity.id, entity]));
  const next = entities.slice();
  events.forEach((event) => {
    [...event.sourceIds, ...event.targetIds].forEach((id) => {
      if (byId.has(id)) return;
      const entity: NormalizedEntity = {
        id,
        name: id,
        category: 'default',
        value: 1,
        color: DEFAULT_COLORS[next.length % DEFAULT_COLORS.length],
        dataIndex: next.length,
        raw: { id, name: id, generated: true }
      };
      byId.set(id, entity);
      next.push(entity);
    });
  });
  return next;
}
```

Also add utility helpers in the same file:

```ts
function normalizeUnknownArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null && !Array.isArray(value);
}

function readField(record: Record<string, unknown>, field: string): unknown {
  if (Object.prototype.hasOwnProperty.call(record, field)) return record[field];
  if (!field.includes('.')) return undefined;
  return field.split('.').reduce<unknown>((value, key) => (isRecord(value) ? value[key] : undefined), record);
}

function readString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.length) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return undefined;
}

function stringifyValue(value: unknown, fallback: string): string {
  return readString(value) || fallback;
}

function nonNegativeNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  }
  return fallback;
}

function readIdArray(value: unknown): string[] {
  const raw = Array.isArray(value) ? value : value == null ? [] : [value];
  return raw.map((item) => stringifyValue(item, '')).filter(Boolean);
}

function timeToNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string') {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function uniqueId(baseId: string, seen: Set<string>): string {
  if (!seen.has(baseId)) {
    seen.add(baseId);
    return baseId;
  }
  let suffix = 2;
  while (seen.has(`${baseId}-${suffix}`)) suffix += 1;
  const id = `${baseId}-${suffix}`;
  seen.add(id);
  return id;
}

function readItemColor(record: Record<string, unknown>): string | undefined {
  const itemStyle = isRecord(record.itemStyle) ? record.itemStyle : {};
  return readString(itemStyle.color ?? record.color);
}
```

- [ ] **Step 4: Wire normalized data into result**

In `resolveEvolutionFluidLayout`, use normalized entities/events and scale radii:

```ts
export function resolveEvolutionFluidLayout(option: EvolutionFluidLayoutOption = {}): EvolutionFluidLayoutResult {
  const width = Math.max(1, finiteNumber(option.width, DEFAULT_WIDTH));
  const height = Math.max(1, finiteNumber(option.height, DEFAULT_HEIGHT));
  const rawEntities = normalizeEntities(option);
  const events = normalizeEvents(option);
  const entities = ensureReferencedEntities(rawEntities, events);
  const radiusScale = createRadiusScale(entities.map((entity) => entity.value), option);
  const positions = layoutCategories(entities, width, height);
  const publicEntities = entities.map((entity) => {
    const position = positions.get(entity.id) || { x: width / 2, y: height / 2 };
    return {
      id: entity.id,
      name: entity.name,
      category: entity.category,
      value: entity.value,
      x: position.x,
      y: position.y,
      r: radiusScale(entity.value),
      opacity: 0.82,
      color: entity.color,
      active: true,
      dataIndex: entity.dataIndex,
      raw: entity.raw
    };
  });

  return {
    width,
    height,
    progress: resolveProgress(option.currentTime, events),
    entities: publicEntities,
    events: events.map((event) => toPublicEvent(event, publicEntities)),
    bridges: [],
    timeline: createTimeline(width, height, option, events)
  };
}
```

Add the referenced helpers:

```ts
function createRadiusScale(values: number[], option: EvolutionFluidLayoutOption): (value: number) => number {
  const style = isRecord(option.dropletStyle) ? option.dropletStyle : {};
  const minRadius = Math.max(1, nonNegativeNumber(style.minRadius, DEFAULT_MIN_RADIUS));
  const maxRadius = Math.max(minRadius, nonNegativeNumber(style.maxRadius, DEFAULT_MAX_RADIUS));
  const maxValue = Math.max(1, ...values);
  return (value) => minRadius + (Math.sqrt(Math.max(0, value)) / Math.sqrt(maxValue)) * (maxRadius - minRadius);
}

function layoutCategories(entities: NormalizedEntity[], width: number, height: number): Map<string, { x: number; y: number }> {
  const categories = Array.from(new Set(entities.map((entity) => entity.category))).sort();
  const centerY = height * 0.44;
  const usableWidth = Math.max(1, width - 120);
  const byCategory = new Map<string, NormalizedEntity[]>();
  entities.forEach((entity) => {
    const list = byCategory.get(entity.category) || [];
    list.push(entity);
    byCategory.set(entity.category, list);
  });

  const positions = new Map<string, { x: number; y: number }>();
  categories.forEach((category, categoryIndex) => {
    const categoryX = categories.length === 1 ? width / 2 : 60 + (usableWidth * categoryIndex) / (categories.length - 1);
    const list = byCategory.get(category) || [];
    list.forEach((entity, entityIndex) => {
      const angle = (entityIndex / Math.max(1, list.length)) * Math.PI * 2;
      const ring = 26 + Math.floor(entityIndex / 6) * 22;
      positions.set(entity.id, {
        x: round(categoryX + Math.cos(angle) * ring),
        y: round(centerY + Math.sin(angle) * ring)
      });
    });
  });
  return positions;
}

function toPublicEvent(event: NormalizedEvent, entities: EvolutionFluidEntityLayout[]): EvolutionFluidEventLayout {
  const related = [...event.sourceIds, ...event.targetIds]
    .map((id) => entities.find((entity) => entity.id === id))
    .filter((entity): entity is EvolutionFluidEntityLayout => Boolean(entity));
  const x = related.length ? related.reduce((sum, entity) => sum + entity.x, 0) / related.length : 0;
  const y = related.length ? related.reduce((sum, entity) => sum + entity.y, 0) / related.length : 0;
  return {
    id: event.id,
    type: event.type,
    time: event.time,
    order: event.order,
    sourceIds: event.sourceIds,
    targetIds: event.targetIds,
    value: event.value,
    x: round(x),
    y: round(y),
    r: Math.max(4, Math.min(24, Math.sqrt(event.value || 1) * 2)),
    raw: event.raw
  };
}

function createTimeline(
  width: number,
  height: number,
  option: EvolutionFluidLayoutOption,
  events: NormalizedEvent[]
): EvolutionFluidLayoutResult['timeline'] {
  const timelineOption = isRecord(option.timeline) ? option.timeline : {};
  const show = timelineOption.show !== false;
  const y = height - Math.max(12, nonNegativeNumber(timelineOption.bottom, 18));
  const startX = 48;
  const endX = Math.max(startX + 1, width - 48);
  const min = events[0]?.timeValue ?? 0;
  const max = events[events.length - 1]?.timeValue ?? min;
  const progress = resolveProgress(option.currentTime, events);
  return {
    show,
    y,
    startX,
    endX,
    ticks: events.map((event) => ({
      time: event.time,
      x: round(projectTime(event.timeValue, min, max, startX, endX)),
      active: progress >= event.order / Math.max(1, events.length - 1)
    })),
    handleX: round(startX + (endX - startX) * progress)
  };
}

function resolveProgress(currentTime: unknown, events: NormalizedEvent[]): number {
  if (!events.length) return 0;
  if (currentTime == null) return 0;
  const value = timeToNumber(currentTime, events[0].timeValue);
  const min = events[0].timeValue;
  const max = events[events.length - 1].timeValue;
  if (max <= min) return 1;
  return clamp((value - min) / (max - min), 0, 1);
}

function projectTime(value: number, min: number, max: number, start: number, end: number): number {
  if (max <= min) return (start + end) / 2;
  return start + ((value - min) / (max - min)) * (end - start);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number): number {
  return Math.round((value + Number.EPSILON) * 1000) / 1000;
}
```

- [ ] **Step 5: Run tests**

Run:

```bash
npm --workspace @echarts-extension/evolution-fluid run test:unit
```

Expected: PASS.

- [ ] **Step 6: Commit normalization**

```bash
git add packages/echarts-evolution-fluid/src/layout.ts packages/echarts-evolution-fluid/test/evolution-fluid.test.ts
git commit -m "Normalize evolution fluid event timelines" -m "The chart needs a tolerant event-list model before rendering can be meaningful. Normalizing entities, missing references, event order, values, and timeline positions creates the stable contract for later animation and docs.

Constraint: Layout helpers must stay deterministic and dependency-free
Confidence: high
Scope-risk: narrow
Tested: npm --workspace @echarts-extension/evolution-fluid run test:unit
Not-tested: Renderer integration is covered in later tasks"
```

## Task 3: Event Frame Semantics And Bridge Layout

**Files:**
- Modify: `packages/echarts-evolution-fluid/src/layout.ts`
- Modify: `packages/echarts-evolution-fluid/src/metaball.ts`
- Modify: `packages/echarts-evolution-fluid/test/evolution-fluid.test.ts`

- [ ] **Step 1: Add failing tests for bridge-producing events**

Append:

```ts
test('creates bridge layouts for acquire, merge, split, spinOff, and custom events', () => {
  const layout = resolveEvolutionFluidLayout({
    width: 760,
    height: 420,
    entities: [
      { id: 'alpha', industry: 'AI', value: 120 },
      { id: 'beta', industry: 'AI', value: 60 },
      { id: 'gamma', industry: 'Cloud', value: 40 },
      { id: 'delta', industry: 'Media', value: 30 }
    ],
    events: [
      { time: 1, type: 'acquire', sources: ['beta'], targets: ['alpha'], value: 30 },
      { time: 2, type: 'merge', sources: ['alpha', 'gamma'], targets: ['alpha-gamma'], value: 80 },
      { time: 3, type: 'split', sources: ['alpha-gamma'], targets: ['delta'], value: 20 },
      { time: 4, type: 'partnership', sources: ['delta'], targets: ['alpha'], value: 10 }
    ],
    currentTime: 2,
    dropletStyle: { bridgeThreshold: 240 }
  });

  assert.ok(layout.bridges.length >= 4);
  assert.ok(layout.bridges.every((bridge) => bridge.path.startsWith('M ')));
  assert.ok(layout.bridges.some((bridge) => bridge.id.includes('acquire')));
  assert.ok(layout.bridges.some((bridge) => bridge.id.includes('partnership')));
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
npm --workspace @echarts-extension/evolution-fluid run test:unit
```

Expected: FAIL because bridges are always empty.

- [ ] **Step 3: Export bridge strength from metaball helper**

Add:

```ts
export function computeMetaballBridgeStrength(
  source: MetaballCircle,
  target: MetaballCircle,
  maxDistance = 120
): number {
  const distance = Math.hypot(target.x - source.x, target.y - source.y);
  if (!Number.isFinite(distance) || distance <= 0 || distance > maxDistance) return 0;
  return Math.max(0, Math.min(1, 1 - distance / maxDistance));
}
```

- [ ] **Step 4: Generate bridges from normalized event relationships**

Import `createMetaballBridgePath` and `computeMetaballBridgeStrength` into `layout.ts`, then replace `bridges: []` with:

```ts
const bridges = createEventBridges(events, publicEntities, option);
```

Add:

```ts
function createEventBridges(
  events: NormalizedEvent[],
  entities: EvolutionFluidEntityLayout[],
  option: EvolutionFluidLayoutOption
): EvolutionFluidBridgeLayout[] {
  const entityById = new Map(entities.map((entity) => [entity.id, entity]));
  const dropletStyle = isRecord(option.dropletStyle) ? option.dropletStyle : {};
  const maxDistance = Math.max(1, nonNegativeNumber(dropletStyle.bridgeThreshold, 120));
  const opacity = Math.min(1, nonNegativeNumber(dropletStyle.bridgeOpacity, 0.55));
  const bridges: EvolutionFluidBridgeLayout[] = [];

  events.forEach((event) => {
    const sourceIds = event.sourceIds.length ? event.sourceIds : event.targetIds;
    const targetIds = event.targetIds.length ? event.targetIds : event.sourceIds;
    sourceIds.forEach((sourceId) => {
      targetIds.forEach((targetId) => {
        if (sourceId === targetId) return;
        const source = entityById.get(sourceId);
        const target = entityById.get(targetId);
        if (!source || !target) return;
        const path = createMetaballBridgePath(source, target, { maxDistance });
        if (!path) return;
        const strength = computeMetaballBridgeStrength(source, target, maxDistance);
        bridges.push({
          id: `${event.id}:${event.type}:${sourceId}->${targetId}`,
          sourceId,
          targetId,
          path,
          width: round(Math.max(1, Math.sqrt(event.value || 1) * strength)),
          opacity: round(opacity * strength)
        });
      });
    });
  });

  return bridges;
}
```

- [ ] **Step 5: Run tests**

Run:

```bash
npm --workspace @echarts-extension/evolution-fluid run test:unit
```

Expected: PASS.

- [ ] **Step 6: Commit frame and bridge layout**

```bash
git add packages/echarts-evolution-fluid/src/layout.ts packages/echarts-evolution-fluid/src/metaball.ts packages/echarts-evolution-fluid/test/evolution-fluid.test.ts
git commit -m "Derive deterministic droplet bridge layouts" -m "Metaball bridges are the visual core of the chart, so layout now turns generic source-target events into deterministic bridge paths and strengths.

Constraint: The first version uses geometry instead of filters or fluid simulation
Confidence: high
Scope-risk: narrow
Tested: npm --workspace @echarts-extension/evolution-fluid run test:unit
Not-tested: Visual rendering is added in the next task"
```

## Task 4: Renderer For Droplets, Bridges, Labels, Events, And Timeline

**Files:**
- Modify: `packages/echarts-evolution-fluid/src/evolution-fluid.ts`
- Modify: `packages/echarts-evolution-fluid/test/evolution-fluid.test.ts`
- Modify: `tests/render-variants.test.ts`

- [ ] **Step 1: Add SVG render test**

Add this helper and test in the package test file:

```ts
import * as echarts from 'echarts';
import { SVGRenderer } from 'echarts/renderers';

echarts.use([SVGRenderer]);

test('renders droplets, bridge paths, event markers, labels, and timeline in SVG', () => {
  const chart = echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width: 720,
    height: 420
  });
  chart.setOption({
    animation: false,
    series: [{
      type: 'evolutionFluid',
      width: 720,
      height: 420,
      entities: [
        { id: 'alpha', name: 'Alpha', industry: 'AI', value: 120, itemStyle: { color: '#38bdf8' } },
        { id: 'beta', name: 'Beta', industry: 'AI', value: 80, itemStyle: { color: '#34d399' } }
      ],
      events: [
        { time: 2020, type: 'acquire', sources: ['beta'], targets: ['alpha'], value: 42 }
      ],
      currentTime: 2020,
      dropletStyle: { bridgeThreshold: 260 },
      label: { show: true },
      eventLabel: { show: true }
    }]
  });

  const svg = chart.renderToSVGString();
  assert.match(svg, /Alpha/);
  assert.match(svg, /acquire/);
  assert.match(svg, /<path/);
  assert.match(svg, /<circle/);
  chart.dispose();
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
npm --workspace @echarts-extension/evolution-fluid run test:unit
```

Expected: FAIL because renderer removes all elements.

- [ ] **Step 3: Replace renderer with drawing implementation**

Use these local interfaces in `evolution-fluid.ts`:

```ts
import { clearAliveRender, installElementHover, renderAlive, setAliveRenderKey } from '@echarts-extension/layout-core';
import type { AliveRenderState, ElementHoverController, ElementHoverItem, ElementHoverOptions } from '@echarts-extension/layout-core';
import type {
  EvolutionFluidBridgeLayout,
  EvolutionFluidEntityLayout,
  EvolutionFluidEventLayout,
  EvolutionFluidLayoutResult
} from './layout.js';

interface GraphicElement {
  [key: string]: unknown;
}

interface GraphicGroup extends GraphicElement {
  x?: number;
  y?: number;
  add(element: GraphicElement): void;
  removeAll(): void;
}

interface GraphicElementOptions {
  shape?: Record<string, unknown>;
  style?: Record<string, unknown>;
  silent?: boolean;
  z2?: number;
}
```

Extend `EChartsApi` and `EChartsHost.graphic`:

```ts
interface EChartsApi {
  getWidth(): number;
  getHeight(): number;
  getZr?(): ElementHoverOptions['zrender'];
}

interface EChartsHost {
  extendSeriesModel(option: Record<string, unknown>): void;
  extendChartView(option: Record<string, unknown>): void;
  helper: {
    createDimensions(source: unknown[], options: Record<string, unknown>): unknown;
    getLayoutRect(params: unknown, container: { width: number; height: number }): ViewRect;
  };
  List: new (dimensions: unknown, host: EvolutionFluidSeriesModel) => SeriesData;
  graphic: {
    Group: new () => GraphicGroup;
    Circle: new (options: GraphicElementOptions) => GraphicElement;
    Line: new (options: GraphicElementOptions) => GraphicElement;
    Text: new (options: GraphicElementOptions) => GraphicElement;
    makePath?: (path: string, options: GraphicElementOptions) => GraphicElement;
  };
}
```

Add `SeriesData` and update `getInitialData` so tooltip/data binding works:

```ts
interface SeriesData {
  initData(source: unknown[]): void;
  count(): number;
  getItemModel(index: number): EChartsModel;
  getItemLayout(index: number): unknown;
  setItemLayout(index: number, layout: [number, number]): void;
  setItemGraphicEl(index: number, element: GraphicElement): void;
}

getInitialData(this: EvolutionFluidSeriesModel, option: EvolutionFluidLayoutOption) {
  const source = Array.isArray(option.entities) ? option.entities : [];
  const dimensions = echartsHost.helper.createDimensions(source, { coordDimensions: ['value'] });
  const list = new echartsHost.List(dimensions, this);
  list.initData(source);
  return list;
}
```

Update view state:

```ts
interface EvolutionFluidView {
  group: GraphicGroup;
  __renderToken?: object | null;
  __hoverController?: ElementHoverController;
  __aliveRenderState?: AliveRenderState;
}
```

Use this render body:

```ts
render(this: EvolutionFluidView, seriesModel: EvolutionFluidSeriesModel, ecModel: unknown, api: EChartsApi) {
  const group = this.group;
  const renderToken = {};
  this.__renderToken = renderToken;
  this.__hoverController?.dispose();
  this.__hoverController = undefined;

  try {
    const rect = echartsHost.helper.getLayoutRect(seriesModel.getBoxLayoutParams(), {
      width: api.getWidth(),
      height: api.getHeight()
    });
    const layout = resolveEvolutionFluidLayout({
      ...(seriesModel.option || {}),
      width: rect.width,
      height: rect.height
    });
    if (this.__renderToken !== renderToken) return;
    const { hoverItems } = renderAlive(this, echartsHost, group, seriesModel, (targetGroup, targetSeriesModel) => (
      drawEvolutionFluid(echartsHost, targetGroup, targetSeriesModel, layout, rect)
    ));
    this.__hoverController = installElementHover(hoverItems, { zrender: api.getZr?.() });
  } catch (error) {
    console.error('[evolutionFluid] render failed', error);
  }
}
```

Update `remove` and `dispose`:

```ts
remove(this: EvolutionFluidView) {
  this.__renderToken = null;
  this.__hoverController?.dispose();
  this.__hoverController = undefined;
  clearAliveRender(this);
  this.group.removeAll();
},
dispose(this: EvolutionFluidView) {
  this.__renderToken = null;
  this.__hoverController?.dispose();
  this.__hoverController = undefined;
  clearAliveRender(this);
  this.group.removeAll();
}
```

- [ ] **Step 4: Add drawing helpers**

Add:

```ts
function drawEvolutionFluid(
  host: EChartsHost,
  root: GraphicGroup,
  seriesModel: EvolutionFluidSeriesModel,
  layout: EvolutionFluidLayoutResult,
  rect: ViewRect
): ElementHoverItem[] {
  const group = new host.graphic.Group();
  group.x = rect.x;
  group.y = rect.y;
  const hoverItems: ElementHoverItem[] = [];

  drawBridges(host, group, layout.bridges, seriesModel);
  drawEvents(host, group, layout.events, seriesModel, hoverItems);
  drawEntities(host, group, layout.entities, seriesModel, hoverItems);
  drawTimeline(host, group, layout, seriesModel);

  root.add(group);
  return hoverItems;
}

function drawEntities(
  host: EChartsHost,
  group: GraphicGroup,
  entities: EvolutionFluidEntityLayout[],
  seriesModel: EvolutionFluidSeriesModel,
  hoverItems: ElementHoverItem[]
) {
  const labelModel = seriesModel.getModel('label');
  const data = seriesModel.getData?.();
  entities.forEach((entity) => {
    const circle = new host.graphic.Circle({
      shape: { cx: entity.x, cy: entity.y, r: entity.r },
      style: {
        fill: entity.color,
        opacity: entity.opacity,
        stroke: '#ffffff',
        lineWidth: 1.4
      },
      z2: 5
    });
    setAliveRenderKey(circle, `entity:${entity.id}`);
    group.add(circle);
    hoverItems.push({ elements: [circle] });
    if (data && entity.dataIndex >= 0 && entity.dataIndex < data.count()) {
      data.setItemLayout(entity.dataIndex, [entity.x, entity.y]);
      data.setItemGraphicEl(entity.dataIndex, circle);
    }
    if (labelModel.get('show') !== false) {
      const text = new host.graphic.Text({
        style: {
          x: entity.x,
          y: entity.y,
          text: formatLabel(labelModel.get('formatter'), entity),
          fill: labelModel.get('color') || '#0f172a',
          fontSize: readNumber(labelModel.get('fontSize'), 12),
          fontWeight: labelModel.get('fontWeight') || 700,
          align: 'center',
          verticalAlign: 'middle'
        },
        silent: true,
        z2: 9
      });
      setAliveRenderKey(text, `entity-label:${entity.id}`);
      group.add(text);
    }
  });
}

function drawBridges(host: EChartsHost, group: GraphicGroup, bridges: EvolutionFluidBridgeLayout[], seriesModel: EvolutionFluidSeriesModel) {
  bridges.forEach((bridge) => {
    if (!bridge.path || !host.graphic.makePath) return;
    const path = host.graphic.makePath(bridge.path, {
      style: {
        fill: seriesModel.get(['dropletStyle', 'bridgeColor']) || '#38bdf8',
        opacity: bridge.opacity
      },
      silent: true,
      z2: 3
    });
    setAliveRenderKey(path, `bridge:${bridge.id}`);
    group.add(path);
  });
}

function drawEvents(
  host: EChartsHost,
  group: GraphicGroup,
  events: EvolutionFluidEventLayout[],
  seriesModel: EvolutionFluidSeriesModel,
  hoverItems: ElementHoverItem[]
) {
  const labelModel = seriesModel.getModel('eventLabel');
  events.forEach((event) => {
    const marker = new host.graphic.Circle({
      shape: { cx: event.x, cy: event.y, r: event.r },
      style: {
        fill: '#111827',
        opacity: 0.72
      },
      z2: 7
    });
    setAliveRenderKey(marker, `event:${event.id}`);
    group.add(marker);
    hoverItems.push({ elements: [marker] });
    if (labelModel.get('show') !== false) {
      const label = new host.graphic.Text({
        style: {
          x: event.x,
          y: event.y - event.r - 8,
          text: formatEventLabel(labelModel.get('formatter'), event),
          fill: labelModel.get('color') || '#111827',
          fontSize: readNumber(labelModel.get('fontSize'), 11),
          fontWeight: labelModel.get('fontWeight') || 700,
          align: 'center',
          verticalAlign: 'bottom'
        },
        silent: true,
        z2: 10
      });
      setAliveRenderKey(label, `event-label:${event.id}`);
      group.add(label);
    }
  });
}

function drawTimeline(host: EChartsHost, group: GraphicGroup, layout: EvolutionFluidLayoutResult, seriesModel: EvolutionFluidSeriesModel) {
  if (!layout.timeline.show) return;
  const line = new host.graphic.Line({
    shape: { x1: layout.timeline.startX, y1: layout.timeline.y, x2: layout.timeline.endX, y2: layout.timeline.y },
    style: { stroke: '#64748b', lineWidth: 1.4, opacity: 0.9 },
    silent: true,
    z2: 2
  });
  setAliveRenderKey(line, 'timeline:axis');
  group.add(line);
  layout.timeline.ticks.forEach((tick) => {
    const circle = new host.graphic.Circle({
      shape: { cx: tick.x, cy: layout.timeline.y, r: tick.active ? 4.5 : 3 },
      style: { fill: tick.active ? '#111827' : '#94a3b8', opacity: 1 },
      silent: false,
      z2: 4
    });
    setAliveRenderKey(circle, `timeline:${tick.time}`);
    group.add(circle);
  });
  const handle = new host.graphic.Circle({
    shape: { cx: layout.timeline.handleX, cy: layout.timeline.y, r: 7 },
    style: { fill: '#2563eb', stroke: '#ffffff', lineWidth: 2 },
    z2: 6
  });
  setAliveRenderKey(handle, 'timeline:handle');
  group.add(handle);
}
```

Add formatting helpers:

```ts
function formatLabel(formatter: unknown, entity: EvolutionFluidEntityLayout): string {
  if (typeof formatter === 'function') return String(formatter({ data: entity.raw, name: entity.name, value: entity.value, entity }));
  if (typeof formatter === 'string') return formatter.replace(/\{b\}/g, entity.name).replace(/\{c\}/g, String(entity.value));
  return entity.name;
}

function formatEventLabel(formatter: unknown, event: EvolutionFluidEventLayout): string {
  if (typeof formatter === 'function') return String(formatter({ data: event.raw, type: event.type, value: event.value, event }));
  if (typeof formatter === 'string') return formatter.replace(/\{type\}/g, event.type).replace(/\{c\}/g, String(event.value));
  return event.type;
}

function readNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
```

- [ ] **Step 5: Add render variant coverage**

In `tests/render-variants.test.ts`, import:

```ts
import '@echarts-extension/evolution-fluid';
```

Add one `renderSeries` call in the network/custom chart variant test:

```ts
renderSeries({
  type: 'evolutionFluid',
  entities: [
    { id: 'alpha', name: 'Alpha', industry: 'AI', value: 100, itemStyle: { color: '#38bdf8' } },
    { id: 'beta', name: 'Beta', industry: 'Cloud', value: 60, label: { show: false } }
  ],
  events: [
    { time: 2020, type: 'acquire', sources: ['beta'], targets: ['alpha'], value: 40 },
    { time: 2021, type: 'spinOff', sources: ['alpha'], targets: ['gamma'], value: 20 }
  ],
  currentTime: 2021,
  dropletStyle: { bridgeThreshold: 240, bridgeOpacity: 0.6 },
  label: { show: true, formatter: '{b}:{c}' },
  eventLabel: { show: true, formatter: '{type}' },
  animation: false
});
```

- [ ] **Step 6: Run focused tests**

Run:

```bash
npm --workspace @echarts-extension/evolution-fluid run test:unit
vitest run tests/render-variants.test.ts
```

Expected: both commands exit 0.

- [ ] **Step 7: Commit renderer**

```bash
git add packages/echarts-evolution-fluid/src/evolution-fluid.ts packages/echarts-evolution-fluid/test/evolution-fluid.test.ts tests/render-variants.test.ts
git commit -m "Render deterministic evolution fluid droplets" -m "The chart now turns normalized event layouts into visible droplets, bridge paths, event markers, labels, and a timeline while reusing the shared alive-render and hover helpers.

Constraint: Rendering must use deterministic ZRender primitives without SVG filter dependencies
Confidence: medium
Scope-risk: moderate
Tested: npm --workspace @echarts-extension/evolution-fluid run test:unit; vitest run tests/render-variants.test.ts
Not-tested: Browser docs and visual snapshot integration are added in later tasks"
```

## Task 5: Type Augmentation And README Option Docs

**Files:**
- Create: `packages/echarts-evolution-fluid/index.d.ts`
- Create: `packages/echarts-evolution-fluid/README.md`
- Create: `packages/echarts-evolution-fluid/README_CN.md`
- Modify: `scripts/sync-options-from-readmes.mjs`
- Modify: `docs/options.js`

- [ ] **Step 1: Create type augmentation**

```ts
import 'echarts';

type EvolutionFluidEventType = 'found' | 'acquire' | 'merge' | 'split' | 'spinOff' | 'rename' | 'close' | string;

interface EvolutionFluidEntityItem {
  id?: string | number;
  name?: string | number;
  label?: string | number;
  value?: number | string;
  industry?: string | number;
  category?: string | number;
  itemStyle?: {
    color?: string;
    opacity?: number;
    borderColor?: string;
    borderWidth?: number;
  };
  label?: {
    show?: boolean;
    color?: string;
    fontSize?: number;
    fontWeight?: string | number;
    formatter?: string | ((params: EvolutionFluidEntityLabelParams) => unknown);
  };
  [key: string]: unknown;
}

interface EvolutionFluidEventItem {
  id?: string | number;
  time?: string | number | Date;
  type?: EvolutionFluidEventType;
  sources?: Array<string | number>;
  targets?: Array<string | number>;
  value?: number | string;
  eventStyle?: {
    color?: string;
    opacity?: number;
    borderColor?: string;
    borderWidth?: number;
  };
  label?: Record<string, unknown>;
  [key: string]: unknown;
}

interface EvolutionFluidEntityLabelParams {
  data: unknown;
  name: string;
  value: number;
  entity: unknown;
}

interface EvolutionFluidEventLabelParams {
  data: unknown;
  type: string;
  value: number;
  event: unknown;
}

declare module 'echarts/types/dist/echarts' {
  export interface EvolutionFluidSeriesOption {
    mainType?: 'series';
    type?: 'evolutionFluid';
    silent?: boolean;

    width?: number | string;
    height?: number | string;
    top?: number | string;
    right?: number | string;
    bottom?: number | string;
    left?: number | string;

    entities?: EvolutionFluidEntityItem[];
    data?: EvolutionFluidEntityItem[];
    events?: EvolutionFluidEventItem[];
    timeField?: string;
    entityIdField?: string;
    valueField?: string;
    categoryField?: string;
    currentTime?: string | number | Date | null;
    autoplay?: boolean;
    playSpeed?: number;
    layout?: {
      clustering?: 'category' | 'none' | string;
      center?: [number | string, number | string];
      categoryGap?: number;
      collisionPadding?: number;
    };
    dropletStyle?: {
      minRadius?: number;
      maxRadius?: number;
      opacity?: number;
      bridgeOpacity?: number;
      bridgeThreshold?: number;
      bridgeColor?: string;
    };
    timeline?: {
      show?: boolean;
      bottom?: number;
      height?: number;
    };
    label?: {
      show?: boolean;
      color?: string;
      fontSize?: number;
      fontWeight?: string | number;
      formatter?: string | ((params: EvolutionFluidEntityLabelParams) => unknown);
    };
    eventLabel?: {
      show?: boolean;
      color?: string;
      fontSize?: number;
      fontWeight?: string | number;
      formatter?: string | ((params: EvolutionFluidEventLabelParams) => unknown);
    };
    bookmark?: {
      show?: boolean;
      data?: Array<{ time: string | number | Date; name?: string }>;
    };
    emphasis?: {
      itemStyle?: {
        shadowBlur?: number;
        shadowColor?: string;
        borderColor?: string;
        borderWidth?: number;
      };
    };
  }

  interface RegisteredSeriesOption {
    evolutionFluid: EvolutionFluidSeriesOption;
  }
}
```

- [ ] **Step 2: Create English README**

Use the same structure as nearby packages:

```markdown
# @echarts-extension/evolution-fluid

Language: English | [中文](./README_CN.md)

ECharts extension chart for event-driven droplet evolution maps.

![Evolution Fluid chart](../../visual-baseline/echarts-evolution-fluid.png)

```js
import * as echarts from 'echarts';
import '@echarts-extension/evolution-fluid';

const chart = echarts.init(document.getElementById('main'));
chart.setOption({
  series: [
    {
      type: 'evolutionFluid',
      entities: [
        { id: 'alpha', name: 'Alpha AI', industry: 'AI', value: 120 },
        { id: 'beta', name: 'Beta Cloud', industry: 'Cloud', value: 80 }
      ],
      events: [
        { time: '2019', type: 'found', targets: ['alpha'], value: 120 },
        { time: '2021', type: 'acquire', sources: ['beta'], targets: ['alpha'], value: 45 },
        { time: '2024', type: 'spinOff', sources: ['alpha'], targets: ['alpha-media'], value: 20 }
      ],
      currentTime: '2024'
    }
  ]
});
```

## Options

<!-- OPTIONS:START -->
This table is generated by `scripts/sync-options-from-readmes.mjs --write-readmes`. Update the English README option table, then run `npm run docs:sync-options` to refresh the docs page.

| Option | Description | Values |
| --- | --- | --- |
| `type` | Registers this package series with ECharts. | `'evolutionFluid'` |
| `silent` | Disables mouse events for the series when true. | `boolean` |
| `width` | Series box width. | `number \| string (pixel or percent)` |
| `height` | Series box height. | `number \| string (pixel or percent)` |
| `top` | Distance from the top of the chart container. | `number \| string (pixel or percent)` |
| `right` | Distance from the right of the chart container. | `number \| string (pixel or percent)` |
| `bottom` | Distance from the bottom of the chart container. | `number \| string (pixel or percent)` |
| `left` | Distance from the left of the chart container. | `number \| string (pixel or percent)` |
| `entities` | Long-lived droplets such as companies, industries, or business units. | `Array<object>` |
| `entities.id` | Entity id used by events. | `string \| number` |
| `entities.name` | Display name. | `string \| number` |
| `entities.value` | Current entity scale used for droplet radius. | `number \| string` |
| `entities.industry` | Category used for default clustering. | `string \| number` |
| `events` | Event-list timeline that drives droplet fusion and splitting. | `Array<object>` |
| `events.time` | Event time or discrete step. | `string \| number \| Date` |
| `events.type` | Event type. | `'found' \| 'acquire' \| 'merge' \| 'split' \| 'spinOff' \| 'rename' \| 'close' \| string` |
| `events.sources` | Source entity ids. | `Array<string \| number>` |
| `events.targets` | Target entity ids. | `Array<string \| number>` |
| `events.value` | Event scale used for markers and bridge strength. | `number \| string` |
| `currentTime` | Current playback time. | `string \| number \| Date \| null` |
| `autoplay` | Enables playback by default in demos or external controllers. | `boolean` |
| `playSpeed` | Playback speed multiplier for external controllers. | `number` |
| `layout.clustering` | Layout clustering mode. | `'category' \| 'none' \| string` |
| `layout.categoryGap` | Spacing between category clusters. | `number` |
| `dropletStyle.minRadius` | Minimum droplet radius. | `number` |
| `dropletStyle.maxRadius` | Maximum droplet radius. | `number` |
| `dropletStyle.bridgeOpacity` | Maximum metaball bridge opacity. | `number` |
| `dropletStyle.bridgeThreshold` | Maximum distance for bridge creation. | `number` |
| `timeline.show` | Shows the internal timeline when true. | `boolean` |
| `label.show` | Shows entity labels when true. | `boolean` |
| `eventLabel.show` | Shows event labels when true. | `boolean` |
| `bookmark.data` | Presentation bookmark metadata. | `Array<object>` |
<!-- OPTIONS:END -->
```

- [ ] **Step 3: Create Chinese README**

Use a matching Chinese version with the same option keys and values. Keep the generated section between `<!-- OPTIONS:START -->` and `<!-- OPTIONS:END -->`.

- [ ] **Step 4: Register package in option docs order**

In `scripts/sync-options-from-readmes.mjs`, insert:

```js
'echarts-evolution-fluid',
```

after `'echarts-subway',`.

- [ ] **Step 5: Sync option docs**

Run:

```bash
npm run docs:sync-options
```

Expected: `docs/options.js`, ignored `docs/options.html`, and ignored `docs/options.zh.html` regenerate without errors.

- [ ] **Step 6: Verify docs option sync**

Run:

```bash
npm run docs:check
```

Expected: option/doc template checks exit 0.

- [ ] **Step 7: Commit types and option docs**

```bash
git add packages/echarts-evolution-fluid/index.d.ts packages/echarts-evolution-fluid/README.md packages/echarts-evolution-fluid/README_CN.md scripts/sync-options-from-readmes.mjs docs/options.js
git commit -m "Document the evolution fluid option contract" -m "Users need a typed event-list contract and generated options docs before the chart is linked from demos and examples.

Constraint: README option tables are the source for generated options docs
Confidence: high
Scope-risk: narrow
Tested: npm run docs:sync-options; npm run docs:check
Not-tested: Browser demo pages are added in the next task"
```

## Task 6: Standard Demo, Large Demo, And Docs Pages

**Files:**
- Create: `docs/templates/packages/echarts-evolution-fluid/index.tpl`
- Create: `docs/templates/packages/echarts-evolution-fluid/large.tpl`
- Modify: `docs/shared/demo-data.js`
- Modify: `docs/shared/demo-runner.js`
- Modify: `docs/shared/large-data.js`
- Modify: `docs/templates/index.tpl`
- Modify: `tests/docs-ssg.test.ts`
- Modify: `tests/browser-visual/cases.ts`
- Modify: `tests/browser-perf/cases.ts`

- [ ] **Step 1: Add docs page templates**

Create `index.tpl`:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>echarts-evolution-fluid example</title>
  <link rel="icon" href="../../../favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="../../shared/demo-page.css?v=interactions-4">
</head>
<body class="demo-page" data-example="evolution-fluid">
  <main class="demo-shell">
    <header class="demo-header">
      <div>
        <p class="eyebrow">echarts-evolution-fluid</p>
        <h1>Evolution Fluid</h1>
        <p>An event-driven droplet map for acquisitions, mergers, spin-offs, and industry evolution.</p>
      </div>
      <nav class="demo-links" aria-label="Example navigation">
        <a href="../../">All examples</a>
        <a href="../../options.html#echarts-evolution-fluid">Options</a>
        <a href="./large.html">Large data</a>
      </nav>
    </header>
    <section class="demo-stage"><div class="chart-frame"><div id="chart"></div></div></section>
  </main>
  <script src="../../../node_modules/echarts/dist/echarts.min.js"></script>
  <script src="../../../packages/echarts-evolution-fluid/dist/echarts-evolution-fluid.js"></script>
  <script src="../../shared/demo-runner.js?v=interactions-4"></script>
</body>
</html>
```

Create `large.tpl`:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>echarts-evolution-fluid large example</title>
  <link rel="icon" href="../../../favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="../../shared/demo-page.css?v=interactions-4">
</head>
<body class="demo-page" data-large-example="evolution-fluid">
  <main class="demo-shell">
    <header class="demo-header">
      <div>
        <p class="eyebrow">echarts-evolution-fluid</p>
        <h1>Evolution Fluid Large Data</h1>
        <p>Generated companies and events for playback and layout performance checks.</p>
      </div>
      <nav class="demo-links" aria-label="Example navigation">
        <a href="./">Standard example</a>
        <a href="../../options.html#echarts-evolution-fluid">Options</a>
      </nav>
    </header>
    <section class="demo-stage"><div class="chart-frame"><div id="chart"></div></div></section>
  </main>
  <script src="../../../node_modules/echarts/dist/echarts.min.js"></script>
  <script src="../../../packages/echarts-evolution-fluid/dist/echarts-evolution-fluid.js"></script>
  <script src="../../shared/large-data.js?v=large-data-4"></script>
</body>
</html>
```

- [ ] **Step 2: Add demo data**

In `docs/shared/demo-data.js`, add `evolutionFluid` near other structured examples:

```js
evolutionFluid: {
  entities: [
    { id: 'aether', name: 'Aether AI', industry: 'AI', value: 132, itemStyle: { color: '#38bdf8' } },
    { id: 'nova', name: 'Nova Cloud', industry: 'Cloud', value: 88, itemStyle: { color: '#34d399' } },
    { id: 'pixel', name: 'PixelForge', industry: 'Media', value: 54, itemStyle: { color: '#a78bfa' } },
    { id: 'orbit', name: 'Orbit Data', industry: 'Cloud', value: 46, itemStyle: { color: '#f59e0b' } },
    { id: 'studio', name: 'Studio Labs', industry: 'Media', value: 38, itemStyle: { color: '#fb7185' } }
  ],
  events: [
    { id: 'f-aether', time: 2018, type: 'found', targets: ['aether'], value: 132 },
    { id: 'f-nova', time: 2019, type: 'found', targets: ['nova'], value: 88 },
    { id: 'a-orbit', time: 2021, type: 'acquire', sources: ['orbit'], targets: ['nova'], value: 34 },
    { id: 'm-media', time: 2023, type: 'merge', sources: ['pixel', 'studio'], targets: ['pixel-studio'], value: 64 },
    { id: 's-aether', time: 2025, type: 'spinOff', sources: ['aether'], targets: ['aether-media'], value: 28 },
    { id: 'custom', time: 2026, type: 'partnership', sources: ['aether-media'], targets: ['pixel-studio'], value: 18 }
  ]
}
```

- [ ] **Step 3: Add demo runner registry entry**

In `docs/shared/demo-runner.js`, add translations:

```js
'Evolution Fluid': '演化水滴图',
'Evolution Fluid Large Timeline': '演化水滴大规模时间线',
```

Add registry entry:

```js
'evolution-fluid': {
  controls: graphControls('Evolution Fluid', [
    rangeControl('currentTime', 'Time', 'series.0.currentTime', 2026, 2018, 2026, 1),
    rangeControl('bridgeThreshold', 'Bridge threshold', 'series.0.dropletStyle.bridgeThreshold', 240, 80, 360, 10),
    rangeControl('maxRadius', 'Max radius', 'series.0.dropletStyle.maxRadius', 58, 24, 90, 2),
    checkboxControl('eventLabels', 'Event labels', 'series.0.eventLabel.show', true)
  ], { enterDuration: 680, enterStagger: 30 }),
  option: (data) => ({
    title: { text: t('Evolution Fluid'), left: 16, top: 10 },
    tooltip: { trigger: 'item' },
    series: [{
      type: 'evolutionFluid',
      width: '94%',
      height: '82%',
      top: 48,
      entities: data.evolutionFluid.entities,
      events: data.evolutionFluid.events,
      currentTime: 2026,
      dropletStyle: {
        minRadius: 12,
        maxRadius: 58,
        bridgeThreshold: 240,
        bridgeOpacity: 0.58
      },
      label: { show: true, formatter: '{b}', fontSize: 11 },
      eventLabel: { show: true, formatter: '{type}', fontSize: 10 },
      emphasis: defaultEmphasisItemStyle
    }]
  })
}
```

If `graphControls` assumes graph-specific animation paths that do not fit, use the existing generic control helpers directly with a small controls array.

- [ ] **Step 4: Add large-data case**

In `docs/shared/large-data.js`, add a case:

```js
'evolution-fluid': {
  packageName: 'echarts-evolution-fluid',
  title: 'Evolution Fluid Large Timeline',
  defaultCount: 180,
  maxCount: ONE_MILLION,
  renderLimit: 800,
  trendLimit: 300,
  createData(count) {
    const renderCount = clampCount(count, this.renderLimit);
    const industries = ['AI', 'Cloud', 'Media', 'Fintech', 'Energy'];
    const entities = Array.from({ length: renderCount }, (_, index) => ({
      id: `entity-${index}`,
      name: `Entity ${index}`,
      industry: industries[index % industries.length],
      value: 20 + (index * 17) % 140
    }));
    const events = Array.from({ length: Math.max(1, Math.floor(renderCount * 0.8)) }, (_, index) => ({
      id: `event-${index}`,
      time: 2010 + index,
      type: index % 5 === 0 ? 'split' : index % 3 === 0 ? 'merge' : 'acquire',
      sources: [`entity-${index % renderCount}`],
      targets: [`entity-${(index + 7) % renderCount}`],
      value: 5 + (index * 11) % 60
    }));
    return withMeta({ entities, events }, count, renderCount);
  },
  option(payload) {
    return perfOption(this, payload, [{
        type: 'evolutionFluid',
        width: '94%',
        height: '82%',
        top: 48,
        entities: payload.data.entities,
        events: payload.data.events,
        currentTime: payload.data.events[payload.data.events.length - 1]?.time,
        label: { show: false },
        eventLabel: { show: false },
        dropletStyle: { maxRadius: 30, bridgeThreshold: 160 }
    }]);
  }
}
```

Use the existing `withMeta`, `clampCount`, and `perfOption` helpers in `large-data.js`; the generated schema is `{ data: { entities, events }, rawCount, renderCount }`.

- [ ] **Step 5: Add gallery and test cases**

Add a gallery card in `docs/templates/index.tpl`:

```html
<a class="chart-gallery-card" href="./packages/echarts-evolution-fluid/">
  <span class="chart-gallery-card__media"><img src="../visual-baseline/echarts-evolution-fluid.png" alt="" loading="lazy"></span>
  <span class="chart-gallery-card__title">Evolution Fluid</span>
</a>
```

Add browser case:

```ts
{
  name: 'echarts-evolution-fluid',
  path: '/docs/packages/echarts-evolution-fluid/'
}
```

Add browser perf case:

```ts
['echarts-evolution-fluid', '/docs/packages/echarts-evolution-fluid/large.html'],
```

- [ ] **Step 6: Sync docs and verify**

Run:

```bash
npm run docs:sync
npm run docs:check
```

Expected: both commands exit 0.

- [ ] **Step 7: Commit demos and docs**

```bash
git add docs/templates/packages/echarts-evolution-fluid docs/shared/demo-data.js docs/shared/demo-runner.js docs/shared/large-data.js docs/templates/index.tpl tests/docs-ssg.test.ts tests/browser-visual/cases.ts tests/browser-perf/cases.ts
git commit -m "Expose evolution fluid demos in the docs" -m "The new chart needs standard and large examples so users can inspect the event-list model, droplet fusion, and playback-oriented controls in the same docs system as other extension charts.

Constraint: Docs pages are generated from templates and shared demo registries
Confidence: medium
Scope-risk: moderate
Tested: npm run docs:sync; npm run docs:check
Not-tested: Browser screenshots are added after bundle and visual baseline generation"
```

## Task 7: Visual Snapshot, Baseline Image, And Gallery Readmes

**Files:**
- Modify: `tests/visual/render-fixture.ts`
- Modify: `tests/visual/visual-regression.test.ts`
- Create: `tests/visual/__snapshots__/evolution-fluid.svg`
- Create: `visual-baseline/echarts-evolution-fluid.png`
- Modify: `README.md`
- Modify: `README_CN.md`

- [ ] **Step 1: Add visual fixture renderer**

In `tests/visual/render-fixture.ts`, import:

```ts
import '@echarts-extension/evolution-fluid';
```

Add paths:

```ts
export const evolutionFluidSnapshotPath = path.resolve('tests/visual/__snapshots__/evolution-fluid.svg');
export const evolutionFluidActualPath = path.resolve('test-results/visual/evolution-fluid.actual.svg');
```

Add data and render function:

```ts
const evolutionFluidData = {
  entities: [
    { id: 'aether', name: 'Aether', industry: 'AI', value: 132, itemStyle: { color: '#38bdf8' } },
    { id: 'nova', name: 'Nova', industry: 'Cloud', value: 88, itemStyle: { color: '#34d399' } },
    { id: 'pixel', name: 'Pixel', industry: 'Media', value: 54, itemStyle: { color: '#a78bfa' } },
    { id: 'orbit', name: 'Orbit', industry: 'Cloud', value: 46, itemStyle: { color: '#f59e0b' } }
  ],
  events: [
    { id: 'a-orbit', time: 2021, type: 'acquire', sources: ['orbit'], targets: ['nova'], value: 34 },
    { id: 'm-ai-cloud', time: 2024, type: 'merge', sources: ['aether', 'nova'], targets: ['aether-cloud'], value: 72 },
    { id: 's-media', time: 2026, type: 'spinOff', sources: ['aether-cloud'], targets: ['pixel'], value: 24 }
  ]
};

export function renderEvolutionFluidFixture() {
  return renderSvg({
    width: 520,
    height: 360,
    animation: false,
    series: [{
      type: 'evolutionFluid',
      width: '94%',
      height: '82%',
      top: 24,
      entities: evolutionFluidData.entities,
      events: evolutionFluidData.events,
      currentTime: 2026,
      dropletStyle: { bridgeThreshold: 240, bridgeOpacity: 0.62, maxRadius: 46 },
      label: { show: true, fontSize: 10 },
      eventLabel: { show: true, fontSize: 9 }
    }]
  });
}
```

- [ ] **Step 2: Register visual regression case**

In `tests/visual/visual-regression.test.ts`, import the new paths and renderer, then add:

```ts
{
  actualPath: evolutionFluidActualPath,
  name: 'Evolution fluid',
  render: renderEvolutionFluidFixture,
  snapshotPath: evolutionFluidSnapshotPath
}
```

- [ ] **Step 3: Generate SVG snapshot**

Run:

```bash
npm run test:visual:update
```

Expected: `tests/visual/__snapshots__/evolution-fluid.svg` is created and existing snapshots only change if prior unrelated local changes already altered them. Stage only the evolution-fluid snapshot unless current task intentionally updated others.

- [ ] **Step 4: Generate visual baseline PNG**

Run the browser visual update command after the new docs page is buildable:

```bash
npm run build
npm run docs:sync
npm run test:visual:browser:update
```

Expected: `visual-baseline/echarts-evolution-fluid.png` is created by `tests/browser-visual/visual-diff.ts`. Stage only that new PNG unless the browser visual update reveals intentional changes for this feature.

- [ ] **Step 5: Add root README gallery entries**

In `README.md`, add the card near Subway/Sequence Diagram:

```html
<td align="center" width="50%">
  <a href="./packages/echarts-evolution-fluid/README.md"><strong>Evolution Fluid</strong></a><br>
  <img src="./visual-baseline/echarts-evolution-fluid.png" alt="Evolution Fluid" width="520">
</td>
```

In `README_CN.md`, add:

```html
<td align="center" width="50%">
  <a href="./packages/echarts-evolution-fluid/README_CN.md"><strong>Evolution Fluid</strong></a><br>
  <img src="./visual-baseline/echarts-evolution-fluid.png" alt="Evolution Fluid" width="520">
</td>
```

- [ ] **Step 6: Verify visuals**

Run:

```bash
npm run test:visual
```

Expected: all SVG visual baselines match.

- [ ] **Step 7: Commit visuals and gallery**

```bash
git add tests/visual/render-fixture.ts tests/visual/visual-regression.test.ts tests/visual/__snapshots__/evolution-fluid.svg visual-baseline/echarts-evolution-fluid.png README.md README_CN.md
git commit -m "Add evolution fluid visual baselines" -m "The gallery and regression suite need a stable reference image for the new deterministic droplet renderer before browser-level verification.

Constraint: Visual snapshots must remain deterministic
Confidence: medium
Scope-risk: moderate
Tested: npm run test:visual
Not-tested: Full browser visual suite is run in the final verification task"
```

## Task 8: Renderer Registration And Lifecycle Coverage

**Files:**
- Modify: `tests/renderer-registration.test.ts`
- Modify: `tests/alive-render.test.ts`

- [ ] **Step 1: Add alive-render import and case**

In `tests/alive-render.test.ts`, add:

```ts
import '@echarts-extension/evolution-fluid';
```

after the neighboring custom chart imports. Add this object to `aliveRenderCases` before `subway`:

```ts
{
  name: 'evolutionFluid',
  series: {
    type: 'evolutionFluid',
    entities: [
      { id: 'alpha', name: 'Alpha', industry: 'AI', value: 100 },
      { id: 'beta', name: 'Beta', industry: 'AI', value: 60 }
    ],
    events: [
      { time: 2020, type: 'acquire', sources: ['beta'], targets: ['alpha'], value: 40 }
    ],
    currentTime: 2020,
    dropletStyle: { bridgeThreshold: 240 },
    label: { show: true },
    eventLabel: { show: true }
  }
}
```

- [ ] **Step 2: Add renderer registration lifecycle case**

In `tests/renderer-registration.test.ts`, add this object to the `cases` array in `captured renderer registrations cover lifecycle across the remaining custom series` before the subway case:

```ts
{
  path: '../packages/echarts-evolution-fluid/src/evolution-fluid.ts?registration',
  option: {
    entities: [
      { id: 'alpha', name: 'Alpha Long Label', industry: 'AI', value: 100, itemStyle: { color: '#38bdf8' } },
      { id: 'beta', name: 'Beta', industry: 'AI', value: 60, itemStyle: { color: '#34d399' } },
      { id: 'gamma', name: 'Gamma', industry: 'Cloud', value: 42 }
    ],
    events: [
      { time: 2020, type: 'acquire', sources: ['beta'], targets: ['alpha'], value: 40 },
      { time: 2021, type: 'spinOff', sources: ['alpha'], targets: ['gamma'], value: 20 }
    ],
    currentTime: 2021,
    dropletStyle: { bridgeThreshold: 260, bridgeOpacity: 0.6 },
    label: { show: true, formatter: '{b} {c}' },
    eventLabel: { show: true, formatter: '{type}' }
  }
}
```

- [ ] **Step 3: Verify no other lifecycle lists need changes**

Run this inspection command:

```bash
rg "evolutionFluid|echarts-evolution-fluid|custom chart packages|remaining custom series" tests/renderer-registration.test.ts tests/alive-render.test.ts tests/animations.test.ts tests/hand-drawn-render.test.ts
```

Expected: `tests/renderer-registration.test.ts` and `tests/alive-render.test.ts` contain the new package. `tests/animations.test.ts` and `tests/hand-drawn-render.test.ts` do not require changes because they cover narrower renderer capabilities, not every package.

- [ ] **Step 4: Run lifecycle tests**

Run:

```bash
vitest run tests/renderer-registration.test.ts tests/alive-render.test.ts
```

Expected: all selected tests exit 0.

- [ ] **Step 5: Commit lifecycle coverage**

```bash
git add tests/renderer-registration.test.ts tests/alive-render.test.ts
git commit -m "Cover evolution fluid renderer lifecycle" -m "The shared renderer suites should exercise the new chart alongside the existing custom chart packages so registration, updates, animation gates, and alive-render behavior stay consistent.

Constraint: Shared tests enumerate custom chart packages explicitly
Confidence: medium
Scope-risk: moderate
Tested: vitest run tests/renderer-registration.test.ts tests/alive-render.test.ts
Not-tested: Full repository test suite is run in the final verification task"
```

## Task 9: Build, Browser, Performance, And Final Verification

**Files:**
- Modify: `.github/npm-publish-allowlist.json`
- Verify: ignored build outputs under `packages/echarts-evolution-fluid/lib` and `packages/echarts-evolution-fluid/dist`

- [ ] **Step 1: Add publish allowlist entry**

In `.github/npm-publish-allowlist.json`, insert:

```json
"@echarts-extension/evolution-fluid"
```

near the neighboring chart packages.

- [ ] **Step 2: Build all packages**

Run:

```bash
npm run build
```

Expected: exit 0, with `packages/echarts-evolution-fluid/lib` and `dist` generated but ignored.

- [ ] **Step 3: Run docs checks**

Run:

```bash
npm run docs:check
```

Expected: exit 0.

- [ ] **Step 4: Run unit and visual suites**

Run:

```bash
npm run test:unit
npm run test:visual
```

Expected: both commands exit 0.

- [ ] **Step 5: Run browser visual check**

Run:

```bash
npm run test:visual:browser
```

Expected: exit 0. If the new `echarts-evolution-fluid` baseline is missing, run:

```bash
npm run test:visual:browser:update
```

Then re-run:

```bash
npm run test:visual:browser
```

Stage only new or intentionally updated evolution-fluid browser artifacts.

- [ ] **Step 6: Run performance smoke**

Run:

```bash
npm run test:perf:browser:ci
```

Expected: exit 0. The performance runner writes `test-results/browser-perf/latest.json`, which is ignored and should not be staged. If the new case exceeds the smoke budget, reduce `renderLimit` in the `evolution-fluid` large-data definition and rerun:

```bash
npm run test:perf:browser:ci
```

Do not stage `test-results/browser-perf/latest.json`.

- [ ] **Step 7: Final full test**

Run:

```bash
npm test
```

Expected: exit 0.

- [ ] **Step 8: Commit final integration**

```bash
git add .github/npm-publish-allowlist.json tests/browser-visual tests/browser-perf
git commit -m "Verify evolution fluid across docs and release gates" -m "The new package is now wired into publish allowlists, browser visual checks, performance smoke coverage, and the full repository verification path.

Constraint: Release workflow publishes only allowlisted packages
Confidence: high
Scope-risk: moderate
Tested: npm run build; npm run docs:check; npm run test:unit; npm run test:visual; npm run test:visual:browser; npm run test:perf:browser:ci; npm test
Not-tested: Manual inspection beyond automated browser captures"
```

## Self-Review Checklist

- Spec coverage:
  - Event-list input: Tasks 2, 3, 5, 6.
  - Hybrid ecosystem map plus timeline: Tasks 2, 4, 6, 7.
  - Deterministic metaball bridge geometry: Tasks 1 and 3.
  - Playback/scrubbing state: Tasks 2, 4, 6.
  - Tooltip/labels/event markers/focus foundation: Tasks 4, 6, 8.
  - Docs, standard demo, large demo: Tasks 5, 6, 7.
  - Unit, renderer, visual, browser, performance tests: Tasks 1 through 9.
- Staging boundary:
  - The first implementation includes the option model for bookmarks/export state but does not build an in-chart event editor or external presentation UI.
  - Real fluid simulation, particles, bitmap rendering, and SVG filter dependencies remain out of scope.
- Type consistency:
  - Package name is `@echarts-extension/evolution-fluid`.
  - Folder name is `packages/echarts-evolution-fluid`.
  - Series type is `evolutionFluid`.
  - Main layout function is `resolveEvolutionFluidLayout`.
  - Main bridge helper is `createMetaballBridgePath`.
