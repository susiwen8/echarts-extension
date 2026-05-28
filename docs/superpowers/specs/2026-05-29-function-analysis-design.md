# Function Analysis Chart Design

## Purpose

Create a formal ECharts extension package for mathematical function analysis:

- Package name: `@echarts-extension/function-analysis`
- ECharts series type: `functionAnalysis`
- Primary import: `import '@echarts-extension/function-analysis'`

The long-term product direction is a MATLAB-like function analysis tool inside the ECharts extension ecosystem. The first implementation should not pretend to be all of MATLAB. It should establish the right package shape and a reusable numerical core so future work can add richer MATLAB-style features such as parameter sweeps, workspaces, equation solving, optimization, ODE tools, FFT views, and multiple linked plot panes.

The first production target is a dependable function plot and analysis series:

- Parse and evaluate user-provided expressions safely.
- Sample one or more functions over a domain.
- Detect roots, extrema, derivative behavior, discontinuities, and integral area.
- Render the curve, axes, analysis markers, tangent lines, area fills, labels, and tooltips through ECharts/zrender.
- Provide a docs demo that behaves like a small MATLAB-style function explorer.

## Current Context

The repository is a TypeScript monorepo of ECharts extension packages. Existing packages follow a repeatable shape:

- `packages/echarts-*/package.json`
- `index.ts` for side-effect registration
- `src/layout.ts` for deterministic pure geometry and data normalization
- `src/<chart>.ts` for ECharts series registration and zrender rendering
- `index.d.ts` for ECharts option augmentation
- `test/*.test.ts` for pure layout tests and SSR SVG rendering tests
- `README.md`, `README_CN.md`, docs templates, generated docs pages, gallery cards, root package build wiring, and Vitest aliases

The new function analysis package should follow this local pattern. It should not add runtime dependencies in the first implementation. This matters because a math parser dependency would make the package larger and create API/version concerns before the package has proven its own option model.

The current worktree has many unrelated uncommitted changes. The implementation should keep the function analysis files isolated and stage only files that belong to this feature.

## Product Requirements

1. The package must register `series.type = 'functionAnalysis'`.
2. The primary input must support an expression string, for example `sin(x) + x^2 / 10`.
3. The package must avoid JavaScript `eval`, `Function`, or arbitrary global access when evaluating expressions.
4. The first implementation must support these expression features:
   - operators: `+`, `-`, `*`, `/`, `^`
   - parentheses
   - unary plus and unary minus
   - constants: `pi`, `e`
   - variable name defaulting to `x`
   - functions: `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `sinh`, `cosh`, `tanh`, `sqrt`, `abs`, `log`, `ln`, `log10`, `exp`, `floor`, `ceil`, `round`, `min`, `max`, `pow`
5. The layout layer must sample functions deterministically over a finite domain.
6. The analysis layer must produce:
   - valid sampled curve segments
   - invalid or discontinuous gaps
   - root candidates
   - local extrema candidates
   - derivative estimates
   - optional tangent line at a requested point
   - optional definite integral estimate over a range
   - optional area polygon for the integral range
7. The renderer must work with ECharts SVG SSR so unit tests can verify output without a browser.
8. The renderer must show meaningful output for empty, invalid, or partially invalid expressions without throwing.
9. The public option model must support single-function input first and reserve a compatible shape for multi-function comparison.
10. The docs demo must expose interactive controls for expression, domain, samples, analysis toggles, tangent point, and integral range.
11. The first implementation must leave a clear path to MATLAB-like workbench features instead of locking the package into a single static chart.

## Non-Goals For The First Implementation

- No symbolic algebra engine.
- No CAS-style exact simplification.
- No matrix workspace or command language yet.
- No new runtime dependency such as `mathjs`.
- No WebGL renderer.
- No arbitrary JavaScript execution.
- No claim that this first package alone reaches full MATLAB scope.

These are non-goals for the first implementation, not for the overall product direction.

## Recommended Architecture

Use a two-layer package: a reusable math/numerical core plus an ECharts renderer.

```text
series option
  -> option normalization
  -> safe expression parser
  -> compiled expression evaluator
  -> numerical sampler
  -> analysis detectors
  -> layout projection
  -> zrender/ECharts view
```

### Source File Map

Create:

- `packages/echarts-function-analysis/package.json`
- `packages/echarts-function-analysis/tsconfig.json`
- `packages/echarts-function-analysis/index.ts`
- `packages/echarts-function-analysis/index.d.ts`
- `packages/echarts-function-analysis/src/expression.ts`
- `packages/echarts-function-analysis/src/numerics.ts`
- `packages/echarts-function-analysis/src/layout.ts`
- `packages/echarts-function-analysis/src/function-analysis.ts`
- `packages/echarts-function-analysis/test/function-analysis.test.ts`
- `packages/echarts-function-analysis/README.md`
- `packages/echarts-function-analysis/README_CN.md`
- `docs/templates/packages/echarts-function-analysis/index.tpl`

Modify:

- `package.json`
- `package-lock.json`
- `vitest.config.js`
- `docs/templates/index.tpl`
- `docs/shared/demo-runner.js`
- `docs/shared/demo-data.js` if the demo needs shared default expressions
- `scripts/sync-docs-ssg.mjs` only if the current SSG payload path cannot support this demo without changes
- `README.md`
- `README_CN.md`

Generated docs and visual baselines can be added after the package renders a stable first frame.

## Public Option Model

Single-function first:

```js
series: [
  {
    type: 'functionAnalysis',
    expression: 'sin(x) + x^2 / 10',
    variable: 'x',
    domain: [-10, 10],
    samples: 1200,
    yExtent: null,
    analysis: {
      roots: true,
      extrema: true,
      derivative: true,
      discontinuities: true,
      tangent: { enabled: true, at: 1.5 },
      integral: { enabled: true, range: [-2, 3] }
    },
    axis: {
      show: true,
      grid: true,
      tickCount: 7
    },
    lineStyle: {
      color: '#2563eb',
      width: 2
    },
    itemStyle: {
      color: '#ef4444'
    },
    areaStyle: {
      color: 'rgba(37, 99, 235, 0.16)'
    },
    label: {
      show: true
    },
    tooltip: {
      trigger: 'item'
    }
  }
]
```

Reserved multi-function shape:

```js
series: [
  {
    type: 'functionAnalysis',
    functions: [
      { id: 'f', name: 'f(x)', expression: 'sin(x)', lineStyle: { color: '#2563eb' } },
      { id: 'g', name: 'g(x)', expression: 'cos(x)', lineStyle: { color: '#16a34a' } }
    ],
    variable: 'x',
    domain: [-6.28, 6.28],
    analysis: {
      intersections: true,
      roots: true,
      extrema: true
    }
  }
]
```

The first implementation may fully support one function and parse the first function from `functions` as a compatibility bridge. Multi-function intersections should be part of the next implementation slice unless the first slice remains small.

## Expression Parser

`src/expression.ts` owns expression parsing and evaluation.

Responsibilities:

- Tokenize numbers, identifiers, operators, commas, and parentheses.
- Parse with a shunting-yard or Pratt parser into a compact AST.
- Distinguish variables, constants, and function calls.
- Compile the AST into a pure evaluator `(scope) => number`.
- Return structured errors with position and message.

The parser must reject:

- unknown identifiers except the configured variable and allowed constants/functions
- property access
- brackets
- string literals
- assignment
- semicolons
- JavaScript keywords
- empty expressions
- invalid function arity

Evaluation must normalize impossible results:

- finite numbers are usable samples
- `NaN`, `Infinity`, and `-Infinity` mark sample gaps
- exceptions during function calls become invalid samples for that x value

## Numerical Analysis

`src/numerics.ts` owns numerical algorithms.

Core functions:

- `sampleFunction(evaluator, domain, options)`
- `estimateDerivative(samples, x)`
- `findRoots(samples, evaluator, options)`
- `findExtrema(samples, evaluator, options)`
- `estimateIntegral(evaluator, range, options)`
- `detectDiscontinuities(samples, options)`
- `buildTangent(evaluator, x, options)`

Initial algorithms:

- Uniform sampling with deterministic `x` spacing.
- Optional local refinement around sign changes and derivative sign changes.
- Root detection through sign changes plus near-zero samples, refined by bisection when endpoints are finite.
- Extrema detection through derivative sign changes and neighbor comparison, refined by ternary/parabolic local sampling where stable.
- Derivative via central finite difference with domain-aware fallback.
- Definite integral through composite Simpson when sample count is even enough, with trapezoid fallback over invalid subranges.
- Discontinuity detection through invalid samples, large finite jumps, and asymptote-like slope spikes.

The analysis should favor useful deterministic hints over false precision. Results need a `confidence` or `kind` field when they are approximate.

## Layout Model

`src/layout.ts` converts analysis output into chart geometry.

Important types:

```ts
interface FunctionAnalysisLayoutResult {
  width: number;
  height: number;
  plotRect: Rect;
  xExtent: [number, number];
  yExtent: [number, number];
  curves: FunctionCurveLayout[];
  roots: AnalysisPointLayout[];
  extrema: AnalysisPointLayout[];
  discontinuities: AnalysisPointLayout[];
  tangent?: TangentLayout;
  integral?: IntegralLayout;
  axes: AxisLayout;
  diagnostics: FunctionAnalysisDiagnostic[];
}
```

Rules:

- Invalid samples split curves into separate polyline segments.
- Auto `yExtent` ignores invalid samples and clamps extreme outliers caused by likely asymptotes.
- The origin axes are shown when zero lies inside the visible extent.
- Analysis markers are clipped to the plot rect.
- Empty or invalid expressions still return a layout with diagnostics so the renderer can show a compact error label.

## ECharts Renderer

`src/function-analysis.ts` registers the series and draws with zrender primitives.

Renderer elements:

- grid lines: `Line`
- axes: `Line`
- curve segments: `Polyline`
- root/extrema/discontinuity markers: `Circle` and `Text`
- tangent: `Line`
- integral area: `Polygon` or `Polyline` with fill
- diagnostics: `Text`
- hover targets: transparent hit circles/lines where useful

Follow existing repository patterns:

- `extendSeriesModel`
- `extendChartView`
- `helper.createDimensions`
- `helper.getLayoutRect`
- `renderAlive` and `installElementHover` if they fit the chart update model
- SSR SVG tests through `echarts.init(null, null, { renderer: 'svg', ssr: true })`

## Docs Demo

Add a docs page for the package with a compact MATLAB-like workbench:

- expression input
- domain min/max controls
- sample count control
- toggles for roots, extrema, derivative/tangent, integral, discontinuities
- tangent x input
- integral range inputs
- result panel listing roots, extrema, derivative at tangent, integral value, and diagnostics
- option JSON panel, consistent with existing docs demos where feasible

The page should remain a package example, not a marketing landing page. The first viewport should be the usable analysis tool.

## Testing Strategy

Unit tests:

- Parser accepts supported expressions and rejects unsafe syntax.
- Evaluator handles unary operators, precedence, function calls, constants, and custom variable names.
- Sampler splits invalid domains for expressions like `1 / x` and `sqrt(x)`.
- Roots are found for `x^2 - 4`.
- Extrema are found for `x^2` and `sin(x)`.
- Derivative estimate is close for `x^2` at `x = 3`.
- Integral estimate is close for `sin(x)` over `[0, pi]`.
- Tangent line is stable for a known function.
- Layout is deterministic for repeated calls.
- Invalid expression produces diagnostics without throwing.

Renderer tests:

- ECharts can register `type: 'functionAnalysis'`.
- SVG SSR output contains curve paths or polylines.
- SVG SSR output contains analysis labels for roots/extrema when enabled.
- Empty/invalid expression renders a diagnostic text instead of throwing.

Docs/build checks:

- Package `build:ts`.
- Package `build`.
- Relevant unit test file.
- `npm run docs:check` after docs integration.

## Milestones

### Milestone 1: Formal Package Foundation

- Package scaffold.
- Parser and evaluator.
- Basic sampling.
- Single curve rendering.
- Unit tests and SSR render test.

### Milestone 2: Core Analysis

- Roots.
- Extrema.
- Derivative/tangent.
- Integral area.
- Discontinuity detection.
- Public types.

### Milestone 3: MATLAB-like Demo

- Interactive docs workbench.
- Result panel.
- Option JSON integration.
- README and README_CN examples.
- Gallery card and visual baseline.

### Milestone 4: Next MATLAB-like Expansion

- Multi-function comparison.
- Intersections.
- Parameter sliders.
- Workspace-style named expressions.
- Command-like presets.
- Numerical solve and optimization helpers.
- ODE/vector-field bridge.
- FFT/signal analysis page or sibling series.

## Risks And Decisions

- A custom parser is smaller and safer than `eval`, but it must be tested thoroughly.
- Numerical analysis can produce approximate results that look more exact than they are. The UI and data model should label estimates as approximate.
- Discontinuity detection is heuristic. It should prevent bad rendering first and expose diagnostics second.
- Full MATLAB scope is a product program, not a single package patch. The package architecture must make the next slices natural instead of pretending the first slice finishes the whole ambition.

## Acceptance Criteria For This Design

- The first implementation can be planned as a focused package without changing existing package APIs.
- The first package still moves toward the full MATLAB-like goal by creating a reusable parser, numerical core, and interactive docs workbench.
- The API shape leaves room for multi-function, workspace, and solver features.
- The implementation can be verified with deterministic unit and SVG SSR tests.
