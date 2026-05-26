# Evolution Fluid Simulation Design

## Purpose

Upgrade `@echarts-extension/evolution-fluid` from hand-shaped droplet transitions to a deterministic fluid runtime that can express acquisition, merger, split, and spin-off stories with fewer visual artifacts.

The goal is an A+B hybrid:

- **A: visual fluid realism** through implicit surfaces, SDF/metaball fields, and continuous contour extraction.
- **B: lightweight physical motion** through deterministic particle state, force integration, damping, contact constraints, stick/break rules, and area transfer.

This is not a GPU fluid solver. The first production target remains ECharts/zrender-compatible SVG/Canvas paths with SSR-friendly deterministic output.

## Current Context

The current package already has the right outer shape:

- `src/layout.ts` normalizes entities and events, computes current-time state, and emits entities, event markers, bridges, and timeline data.
- `src/metaball.ts` creates sampled metaball contours and waterdrop-fusion envelope paths.
- `src/evolution-fluid.ts` registers the ECharts series and draws zrender circles, paths, text, timelines, hover state, and the custom `WaterdropFusion` shape.
- Tests cover normalization, merge/fusion stages, split detachment, SVG rendering, visual snapshots, and browser visual regression.

The current pain point is that event transitions are still mostly path recipes: source/target circles are moved along staged curves, then bridge paths are selected. This can look good for specific frames but is fragile around multi-source fusion, late absorption, and split detachment boundaries.

## Product Requirements

1. An entity remains one semantic point. The implementation may simulate one particle per entity, but it must not visually represent one entity as a swarm of small points.
2. Fusion must show these phases:
   - approach
   - contact
   - visible liquid neck
   - source shrink / target growth
   - completed absorption
3. Split must show these phases:
   - surface bulge
   - necked child droplet
   - clean detachment
   - independent child motion
4. The geometry must avoid:
   - S-shaped bridge inversion
   - stretched bridge after positive separation gap
   - abrupt one-frame disappearance of absorbed sources
   - color leaks between simultaneous bridges
   - unstable output for the same input and `currentTime`
5. The runtime must keep the existing ECharts usage model:
   - `series.type = 'evolutionFluid'`
   - `entities`
   - `events`
   - `currentTime`
   - `dropletStyle`
   - SSR-capable SVG rendering
6. The implementation must remain deterministic. A browser playback frame and an SSR test frame for the same option must produce equivalent geometry.

## Non-Goals

- No full Navier-Stokes solver in the first implementation.
- No WebGL-only renderer in the first implementation.
- No dependency on `pixi.js`, `matter-js`, `d3`, or a new physics package.
- No change to the public data model that would force existing demos to migrate.
- No visual mode where one entity becomes many visible particles.

## Proposed Architecture

Add a new internal fluid runtime under `packages/echarts-evolution-fluid/src/`.

```text
series option
  -> normalize entities/events
  -> event schedule
  -> fluid runtime
       -> fluid state
       -> lightweight solver
       -> surface grouping
       -> implicit surface contour extraction
  -> layout result
       -> entities
       -> blobs
       -> timeline
  -> zrender/ECharts view
```

### `fluid-state.ts`

Owns deterministic particle and surface state.

Primary types:

```ts
interface FluidParticle {
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

interface FluidSurfaceGroup {
  id: string;
  particleIds: string[];
  mode: 'single' | 'fusing' | 'splitting' | 'detached';
  colorPolicy: 'target' | 'source' | 'mixed';
}

interface FluidBlob {
  id: string;
  groupId: string;
  particleIds: string[];
  path: string;
  color: string;
  opacity: number;
  z2: number;
}

interface FluidRuntimeFrame {
  particles: FluidParticle[];
  groups: FluidSurfaceGroup[];
  blobs: FluidBlob[];
}
```

Each entity maps to one `FluidParticle`. A particle can belong to a surface group while it is visually connected to other particles. The group is a rendering concept, not a new semantic entity.

### `fluid-events.ts`

Translates normalized events into simulation intents.

Examples:

```ts
interface FluidIntent {
  eventId: string;
  type: 'absorb' | 'merge' | 'split' | 'custom';
  startTime: number;
  contactTime: number;
  completionTime: number;
  sourceIds: string[];
  targetIds: string[];
  value: number;
}
```

The event layer decides intent windows. It does not directly emit path commands.

### `fluid-solver.ts`

Runs a deterministic lightweight solver for a requested `currentTime`.

The solver uses fixed substeps, not wall-clock deltas. It can compute the frame by replaying from a stable baseline to `currentTime`, or by sampling closed-form event progress where possible.

Forces and constraints:

- **Attraction** pulls absorbing sources toward targets.
- **Repulsion** prevents unrelated active entities from overlapping.
- **Damping** removes jitter and makes playback stable.
- **Surface tension** keeps connected particles in rounded groups.
- **Stick constraint** joins particles into a surface group after contact.
- **Break constraint** detaches split children when the field saddle drops below threshold or when the positive gap exceeds a configured threshold.
- **Area transfer** moves source area into target area during absorption.

The solver returns particle positions, radii, velocities, and group membership. It does not draw.

### `implicit-surface.ts`

Generates blob contours from particles.

The first implementation should use a deterministic scalar field:

```text
field(x, y) = sum((radius_i ^ power) / distance_i ^ power)
```

A group is rendered as:

- one blob path when particles are connected by field strength,
- multiple blob paths when the field naturally separates,
- independent circle paths when a group is detached.

The contour extractor can start with the existing sampled radial contour approach for two-particle groups, then expand to marching squares for multi-particle groups.

Recommended staging:

1. Two-particle implicit contours for fusion/split.
2. Multi-source group contours using local sampling around the weighted center.
3. Marching squares grid for complex multi-particle groups if radial sampling is insufficient.

### `fluid-render-model.ts`

Converts `FluidRuntimeFrame` into the existing layout result shape.

It should preserve compatibility:

- `entities` still feeds labels, hover, tooltip, and current positions.
- `bridges` can be replaced or augmented by `blobs`.
- Existing `bridge.path` can serve as a temporary carrier for blob paths.

A future cleanup can rename `bridges` to a neutral internal concept, but the first implementation should avoid wide public API churn.

## Event Behavior Design

### Absorb / Acquire

1. Source particle receives attraction toward target.
2. When the signed gap approaches zero, source and target enter the same surface group.
3. The implicit surface draws one continuous group with a visible neck.
4. Source radius decays using an area-transfer curve.
5. Target radius grows by conserved area.
6. Source becomes inactive only after radius and opacity are below visual thresholds.

Invariant:

```text
target.r^2 + source.r^2 ~= initialTarget.r^2 + initialSource.r^2
```

### Merge

Merge is a multi-source absorb into either:

- an existing target entity, or
- a generated target entity if the event represents a new combined company.

When multiple sources enter the same target window, the runtime sequences contacts internally so only stable local necks are visible at one time unless a multi-source blob contour is explicitly supported for that frame.

### Split / Spin-Off

1. Child particle starts inside or near the parent surface.
2. Child radius grows from a small visible bulge.
3. Parent and child share one implicit surface while their signed gap is non-positive.
4. Once the signed gap becomes positive, the runtime detaches the child into a separate blob.
5. No stretched bridge is drawn after detachment.
6. Child receives a release velocity and damping until it reaches its target position.

This intentionally rejects the old “two circles plus a long bridge after separation” behavior because that is the source of S-shaped inversions.

### Custom / Partnership

Custom non-structural events can use weak attraction and a temporary field highlight, but they should not transfer area or permanently join groups unless explicitly configured.

## Determinism Model

The simulation must be deterministic across:

- browser playback,
- SSR SVG tests,
- browser visual tests,
- repeated calls to `chart.setOption`.

Rules:

- Use fixed substeps.
- Use seeded deterministic direction choices.
- Avoid `Date.now`, `performance.now`, random numbers, and frame-rate dependent integration in layout computation.
- Treat `currentTime` as the only time input.
- Round public layout coordinates at stable boundaries, not inside every solver step.

## Options

Add internal options first, then document public options once stable.

Suggested public surface:

```ts
fluidSimulation?: {
  enabled?: boolean;       // default true after rollout
  mode?: 'implicit' | 'physical';
  quality?: 'fast' | 'balanced' | 'smooth';
  substeps?: number;
  surfaceThreshold?: number;
  stickDistance?: number;
  breakDistance?: number;
  damping?: number;
  surfaceTension?: number;
  areaConservation?: boolean;
}
```

Rollout default:

- Initial implementation: `fluidSimulation.enabled` defaults to `false`; docs and targeted tests opt in explicitly.
- After visual parity: make it the default for absorb/split while retaining the existing path recipe as fallback.

## Error Handling

If the runtime cannot create a valid implicit contour:

1. Fall back to detached circles for split.
2. Fall back to the existing `createFusionEnvelopePath` for absorb.
3. Emit no bridge rather than emitting an invalid path.
4. Keep labels, tooltips, and timeline functional.

Invalid geometry must not crash ECharts rendering.

## Testing Strategy

### Unit Tests

Add tests for:

- deterministic output for the same option and `currentTime`,
- area conservation during absorb,
- parent/child area conservation during split,
- single blob while split child is attached,
- detached circles after positive split gap,
- no surface group with invalid or duplicate ids,
- no NaN coordinates or radii.

### Geometry Tests

Add path-level tests:

- blob count matches connected-component count,
- no path has `NaN`, `Infinity`, or unsupported commands,
- no S-shaped bridge after positive split gap,
- no deeply swallowed source before visible neck appears,
- no long bridge when field strength is below detach threshold.

### Visual Tests

Keep:

- SVG visual regression for deterministic snapshots,
- browser visual regression for docs examples,
- targeted screenshots for key times:
  - absorb contact,
  - absorb mid-swallow,
  - absorb near complete,
  - split bulge,
  - split neck,
  - split detached.

### Performance Tests

Measure frame generation time for:

- 20 entities / 8 events,
- 100 entities / 40 events,
- 300 entities / 120 events.

The first implementation should prefer stable geometry over high-density simulation. If large data is too slow, use quality fallback:

- fewer contour samples,
- no physical replay for distant inactive events,
- detached circles for low-visibility groups.

## Implementation Phases

### Phase 1: Explicit Surface Runtime

Create the new module boundaries without changing default behavior.

Deliverables:

- `fluid-state.ts`
- `fluid-events.ts`
- `implicit-surface.ts`
- tests for deterministic state and two-particle blob extraction

Default rendering remains the current path recipe.

### Phase 2: Replace Split Rendering

Use implicit surfaces for split/spinOff:

- attached child: one blob path,
- positive gap: detached circle paths,
- no WaterdropFusion bridge after separation.

This phase directly addresses the current visual artifacts.

### Phase 3: Replace Absorb Rendering

Use implicit surfaces for acquire/merge contact and mid-swallow.

Requirements:

- visible liquid neck before swallowing,
- gradual source shrink,
- area transfer into target,
- stable multi-source sequencing.

### Phase 4: Add Lightweight Physics

Introduce particle velocity and force integration.

Requirements:

- deterministic fixed-step solver,
- damping,
- attraction/repulsion,
- split impulse,
- contact stick/break constraints.

### Phase 5: Public Options and Docs

Expose the stable option surface, update README and docs examples, and keep the previous behavior as a compatibility fallback for one release cycle.

## Acceptance Criteria

The work is complete when:

1. Default docs playback shows smooth absorb and split without S-shaped artifacts.
2. Split frames with positive gap render detached droplets, not stretched bridges.
3. Absorb frames show liquid neck before source swallowing.
4. Multi-source absorption does not reveal incorrect intermediate colors.
5. Same input and `currentTime` produce deterministic SVG output.
6. Existing ECharts series usage remains compatible.
7. Unit, SVG visual, browser visual, docs check, and build checks pass.

## Risks

### Complexity

Implicit contour extraction and physical state can become difficult to debug. Mitigation: keep module boundaries small and add geometry fixtures before replacing defaults.

### Performance

Marching squares can be expensive for large groups. Mitigation: start with two-particle and small-group contours, then add quality modes.

### Visual Regressions

The current examples and snapshots will change. Mitigation: update snapshots only after browser review of representative event times.

### API Churn

Exposing physics parameters too early may create long-term compatibility constraints. Mitigation: keep early controls internal or experimental.

## Recommendation

Build the A+B hybrid in this order:

1. introduce internal fluid runtime boundaries,
2. replace split rendering with implicit attached blobs and detached circles,
3. replace absorb rendering with implicit liquid neck and area transfer,
4. add lightweight deterministic physics,
5. expose public tuning options after visual parity.

This route moves toward a complete fluid simulation while preserving the current ECharts/zrender integration, SSR testability, and existing user-facing data model.
