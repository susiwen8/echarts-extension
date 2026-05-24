# Evolution Fluid Chart Design

## Purpose

Add a new ECharts extension chart for event-driven evolution stories where companies, industries, or other entities grow, absorb, merge, split, disappear, or spin off over time. The chart should make the history feel like droplets moving through an ecosystem: entities approach each other, form visible metaball-style bridges, fuse into larger droplets, or separate into new droplets.

The primary use cases are:

- A company development history, including acquisitions, mergers, spin-offs, renames, and closures.
- An industry or ecosystem evolution map, including consolidation, fragmentation, and movement between categories.
- Presentation-oriented playback where users can scrub, annotate, bookmark, and explain key events.

## Package Shape

Create a standalone workspace package:

- Package name: `@echarts-extension/evolution-fluid`
- ECharts series type: `evolutionFluid`
- Main source files:
  - `src/layout.ts` for pure data normalization, event ordering, timeline state derivation, and interpolatable layout frames.
  - `src/evolution-fluid.ts` for ECharts registration, option reading, ZRender drawing, hover/focus behavior, and playback rendering.
  - `index.ts` for side-effect registration.

The package should follow the existing extension pattern in the repository: TypeScript source, generated `lib`/`dist` outputs, local README files, docs templates, demo data, unit tests, renderer registration tests, and visual regression coverage.

## Data Model

The first version uses an event-list input model.

```js
series: [{
  type: 'evolutionFluid',
  entities: [
    {
      id: 'alpha',
      name: 'Alpha AI',
      industry: 'AI',
      value: 120,
      itemStyle: { color: '#38bdf8' }
    },
    {
      id: 'beta',
      name: 'Beta Cloud',
      industry: 'Cloud',
      value: 80
    }
  ],
  events: [
    {
      time: '2019',
      type: 'found',
      targets: ['alpha'],
      value: 120
    },
    {
      time: '2021',
      type: 'acquire',
      sources: ['beta'],
      targets: ['alpha'],
      value: 45
    },
    {
      time: '2024',
      type: 'split',
      sources: ['alpha'],
      targets: ['alpha-media'],
      value: 20
    }
  ]
}]
```

Entities describe the long-lived subjects. Events describe changes between subjects. Entity size represents current scale, such as revenue, market cap, employees, or industry size. Event value represents the impact of the event, such as deal size, influence, or transferred share.

Built-in event types:

- `found`
- `acquire`
- `merge`
- `split`
- `spinOff`
- `rename`
- `close`

Custom event types are allowed. A custom event uses the same generic shape: optional `sources`, optional `targets`, optional `value`, optional `eventStyle`, and optional metadata for tooltip/label formatting. The renderer does not need to understand custom business semantics; it draws them as source-to-target droplet transitions with user-provided style and labels.

The layout layer should be tolerant:

- Missing referenced entities are converted into placeholder entities.
- Duplicate times are ordered by input sequence.
- Unparseable times remain valid discrete timeline steps.
- Invalid or negative values fall back to a minimum radius.
- Empty data renders without throwing.

## Layout And Animation

Use a hybrid layout:

- The main canvas is a fluid ecosystem map.
- A bottom timeline controls playback and scrubbing.
- Entities cluster by `industry`/`category` by default.
- Related entities can move toward an event center during an event keyframe.

The layout layer generates deterministic timeline frames:

- Before-event state.
- Event-active state.
- After-event state.

The renderer interpolates between frames for `x`, `y`, `r`, `opacity`, label opacity, bridge width, event marker size, and ripple opacity.

Event animation semantics:

- `found`: droplet scales and fades in at its category cluster.
- `acquire`: source droplets approach the target, form a bridge, then shrink into or become owned by the target droplet.
- `merge`: multiple sources approach a shared event center, bridge together, then become one or more targets.
- `split` and `spinOff`: source droplet extends a bridge, then target droplets separate outward.
- `rename`: droplet remains spatially stable while label and metadata transition.
- `close`: droplet shrinks and fades out.
- Custom events: sources and targets connect through the generic bridge animation.

## Metaball Rendering

The first implementation should use deterministic metaball geometry rather than real fluid simulation or SVG filters.

Droplets are rendered as circles or smooth paths. When two droplets are close enough, a bridge path is constructed from tangent/control points between the two shapes. The bridge becomes wider as distance decreases and disappears when distance exceeds the configured threshold.

Reasons for this choice:

- It matches the desired "droplet fusion" visual language.
- It remains deterministic enough for unit tests and SVG visual snapshots.
- It works across ECharts SVG and Canvas renderers better than SVG filter-based goo effects.
- It fits the repository's existing TypeScript layout plus renderer architecture.

## Interaction Scope

The target user experience includes:

- Play and pause.
- Timeline scrubber.
- Playback speed control.
- Hover tooltip for entities and event markers.
- Click-to-focus a company, industry, or event path.
- Event annotations.
- Keyframe bookmarks.
- Exportable presentation state.

The first implementation may be staged. The core version must include event-list playback, deterministic metaball bridges, hybrid layout, timeline scrubbing, tooltip, event labels, and basic focus. Bookmarks and exportable presentation state should be specified in the option model and can be implemented in a follow-up phase if needed to keep the initial implementation reviewable.

## Option Shape

Proposed series options:

```js
{
  type: 'evolutionFluid',
  entities,
  events,
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
  bookmark: {
    show: false,
    data: []
  },
  emphasis: {}
}
```

The option shape should keep required data small (`entities`, `events`) while allowing familiar ECharts-style overrides for labels, item styles, line/bridge styles, emphasis, and tooltip formatting.

## Rendering Components

Renderer components:

- Entity droplet: `Circle` or smooth `Path`.
- Metaball bridge: `Path`.
- Event ripple: translucent `Circle`.
- Timeline axis: `Line`, `Circle`, and `Text`.
- Event marker: small symbol plus optional label.
- Entity/event labels: `Text`.
- Focus overlays: dim unrelated droplets and emphasize related paths.

The renderer should use existing shared helpers where they fit:

- `renderAlive` for stable update transitions.
- `installElementHover` for hover dimming and pointer behavior.
- Existing style-reading patterns from nearby packages.

## Documentation And Demos

Add documentation in the same style as existing packages:

- `README.md`
- `README_CN.md`
- `index.d.ts`
- docs template page
- options documentation generated from README option tables
- standard demo
- large demo

The standard demo should show a company and industry evolution story across AI, Cloud, and Media. It should include acquisitions, mergers, spin-offs, renames, and a closure/custom event so users can see the full event vocabulary.

The large demo should generate many entities and events to exercise playback performance, label degradation, focus behavior, and timeline scrubbing.

## Testing

Test layers:

- Layout unit tests for event sorting, placeholder entities, state derivation, radius scaling, category clustering, merge/acquire/split/spin-off transitions, custom events, duplicate times, and invalid values.
- Renderer registration tests for `extendSeriesModel`, `extendChartView`, empty data, style variants, labels, emphasis, disabled animation, and error containment.
- Visual regression tests for one deterministic SVG fixture showing droplet bridges, event markers, labels, and timeline.
- Browser visual tests for the docs page, playback controls, hover, focus, and dark/light viewing context.
- Performance smoke tests for large generated timelines.

All geometry should be deterministic. Random layout jitter should either be avoided or seeded so snapshots remain stable.

## Boundaries

In scope for the design:

- Event-list input.
- Hybrid ecosystem map plus timeline.
- Deterministic metaball-style bridge geometry.
- Playback and scrubbing.
- Tooltip, labels, event markers, and focus.
- A staged path for bookmarks and presentation state export.

Out of scope for the first implementation:

- Real fluid simulation.
- Particle or bitmap field rendering.
- Dependency on SVG filters for core rendering.
- Editing events inside the chart.
- Remote data fetching.

## Open Implementation Notes

- Prefer a narrow first implementation plan that lands the package, core layout, renderer, docs, and tests before expanding presentation helpers.
- Keep option names close to existing package style.
- Avoid adding new runtime dependencies.
- Preserve current repository behavior and avoid touching unrelated packages except for shared docs/test registration points required for a new chart.
