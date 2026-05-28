# Function Analysis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `@echarts-extension/function-analysis`, a formal ECharts extension that safely parses mathematical expressions, performs deterministic numerical analysis, renders function curves and analysis markers, and provides a MATLAB-like docs workbench.

**Architecture:** Add a focused package under `packages/echarts-function-analysis` with four source units: `expression.ts` for safe parsing/evaluation, `numerics.ts` for sampling and analysis, `layout.ts` for screen geometry, and `function-analysis.ts` for ECharts/zrender registration. Keep the core pure and dependency-free so future MATLAB-like workbench features can reuse it outside the renderer.

**Tech Stack:** TypeScript, ECharts 5/6 extension APIs, zrender primitives through ECharts, Vitest, SVG SSR tests, existing Vite workspace build and docs SSG.

---

## Execution Notes

- Work inside `/Users/susiwen8/Documents/github/echarts-extension`.
- The worktree already contains unrelated user changes. Stage only files listed in each task.
- Do not add runtime dependencies.
- Use TDD: add or update tests first, run the targeted failing test, implement, run the same test, then commit the task.
- Keep generated `lib` and `dist` outputs out of normal source commits unless the repo release flow explicitly asks for them.
- Use the existing root `vite.config.js` for package builds.
- Use the existing `vitest.config.js` alias pattern for package tests.

## File Structure

Create package files:

- `packages/echarts-function-analysis/package.json` - workspace metadata, scripts, peer dependency.
- `packages/echarts-function-analysis/tsconfig.json` - package TypeScript build config.
- `packages/echarts-function-analysis/index.ts` - side-effect import for registration.
- `packages/echarts-function-analysis/index.d.ts` - ECharts option augmentation.
- `packages/echarts-function-analysis/src/expression.ts` - tokenizer, parser, AST evaluator, structured diagnostics.
- `packages/echarts-function-analysis/src/numerics.ts` - deterministic sampling, roots, extrema, derivative, tangent, integral, discontinuity helpers.
- `packages/echarts-function-analysis/src/layout.ts` - option normalization, data-to-layout projection, axes, curve segments, analysis geometry.
- `packages/echarts-function-analysis/src/function-analysis.ts` - ECharts series model, chart view, tooltip formatting, zrender drawing.
- `packages/echarts-function-analysis/test/function-analysis.test.ts` - parser, numerics, layout, and SVG SSR tests.
- `packages/echarts-function-analysis/README.md` - English package docs.
- `packages/echarts-function-analysis/README_CN.md` - Chinese package docs.
- `docs/templates/packages/echarts-function-analysis/index.tpl` - interactive docs workbench page.

Modify integration files:

- `package.json` - add the new workspace to root scripts.
- `package-lock.json` - update workspace package metadata.
- `vitest.config.js` - add `@echarts-extension/function-analysis` alias.
- `docs/templates/index.tpl` - add gallery card.
- `docs/shared/demo-runner.js` - add registry entry and controls for `functionAnalysis`.
- `docs/shared/demo-data.js` - add default function-analysis expression data only if the demo runner needs shared data.
- `README.md` and `README_CN.md` - add package listing and visual baseline reference after docs render is stable.

## Task 1: Scaffold Package And Parser Test Harness

**Files:**
- Create: `packages/echarts-function-analysis/package.json`
- Create: `packages/echarts-function-analysis/tsconfig.json`
- Create: `packages/echarts-function-analysis/index.ts`
- Create: `packages/echarts-function-analysis/src/function-analysis.ts`
- Create: `packages/echarts-function-analysis/src/expression.ts`
- Create: `packages/echarts-function-analysis/test/function-analysis.test.ts`
- Modify: `vitest.config.js`

- [ ] **Step 1: Create the package metadata**

Create `packages/echarts-function-analysis/package.json`:

```json
{
  "name": "@echarts-extension/function-analysis",
  "version": "0.1.0",
  "description": "ECharts extension chart for mathematical function analysis",
  "type": "module",
  "main": "lib/index.js",
  "types": "index.d.ts",
  "license": "MIT",
  "scripts": {
    "build:ts": "tsc -p tsconfig.json",
    "test": "npm run build:ts && vitest run --config ../../vitest.config.js packages/echarts-function-analysis/test/function-analysis.test.ts",
    "test:unit": "vitest run --config ../../vitest.config.js packages/echarts-function-analysis/test/function-analysis.test.ts",
    "build": "vite build --config ../../vite.config.js --mode development",
    "release": "vite build --config ../../vite.config.js --mode production && vite build --config ../../vite.config.js --mode development"
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
    "directory": "packages/echarts-function-analysis"
  }
}
```

- [ ] **Step 2: Create the TypeScript package config**

Create `packages/echarts-function-analysis/tsconfig.json`:

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

- [ ] **Step 3: Create minimal registration files**

Create `packages/echarts-function-analysis/index.ts`:

```ts
import './src/function-analysis.js';
```

Create `packages/echarts-function-analysis/src/function-analysis.ts`:

```ts
import * as echarts from 'echarts/lib/echarts';

const echartsHost = echarts as unknown as {
  extendSeriesModel(option: Record<string, unknown>): void;
  extendChartView(option: Record<string, unknown>): void;
};

echartsHost.extendSeriesModel({
  type: 'series.functionAnalysis',
  defaultOption: {
    left: 'center',
    top: 'center',
    width: '94%',
    height: '82%',
    expression: 'sin(x)',
    variable: 'x',
    domain: [-10, 10],
    samples: 600,
    analysis: {
      roots: true,
      extrema: true,
      derivative: true,
      discontinuities: true
    },
    tooltip: {
      trigger: 'item'
    }
  }
});

echartsHost.extendChartView({
  type: 'functionAnalysis',
  render() {
    this.group.removeAll();
  }
});
```

- [ ] **Step 4: Create the initial expression API stub**

Create `packages/echarts-function-analysis/src/expression.ts`:

```ts
export interface ExpressionDiagnostic {
  message: string;
  position: number;
}

export interface CompiledExpression {
  expression: string;
  variable: string;
  diagnostics: ExpressionDiagnostic[];
  evaluate(scope: Record<string, number>): number;
}

export function compileExpression(expression: string, variable = 'x'): CompiledExpression {
  return {
    expression,
    variable,
    diagnostics: [{ message: 'Expression parser is not implemented', position: 0 }],
    evaluate() {
      return Number.NaN;
    }
  };
}
```

- [ ] **Step 5: Add parser tests that fail against the stub**

Create `packages/echarts-function-analysis/test/function-analysis.test.ts`:

```ts
import assert from 'node:assert/strict';
import { test } from 'vitest';

import { compileExpression } from '../src/expression.ts';

test('evaluates supported arithmetic, constants, functions, and precedence', () => {
  const compiled = compileExpression('sin(pi / 2) + x^2 / 4 - sqrt(9)', 'x');

  assert.deepEqual(compiled.diagnostics, []);
  assert.equal(round6(compiled.evaluate({ x: 4 })), 2);
});

test('supports unary operators and custom variable names', () => {
  const compiled = compileExpression('-t^2 + +abs(-3)', 't');

  assert.deepEqual(compiled.diagnostics, []);
  assert.equal(compiled.evaluate({ t: 2 }), -1);
});

test('rejects unsafe or unknown expression syntax', () => {
  const unsafe = compileExpression('globalThis.process.exit()');
  const unknown = compileExpression('sin(x) + secret');
  const empty = compileExpression('   ');

  assert.equal(unsafe.diagnostics.length > 0, true);
  assert.equal(unknown.diagnostics.length > 0, true);
  assert.equal(empty.diagnostics.length > 0, true);
});

function round6(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
```

- [ ] **Step 6: Add the Vitest alias**

Modify `vitest.config.js` by adding this alias with the other package aliases:

```ts
'@echarts-extension/function-analysis': path.join(root, 'packages/echarts-function-analysis/index.ts'),
```

- [ ] **Step 7: Run the targeted test and confirm parser tests fail**

Run:

```bash
npm --workspace @echarts-extension/function-analysis run test:unit
```

Expected: FAIL because `compileExpression` reports a diagnostic and returns `NaN` for supported expressions.

- [ ] **Step 8: Commit the scaffold and failing tests**

Run:

```bash
git add packages/echarts-function-analysis/package.json \
  packages/echarts-function-analysis/tsconfig.json \
  packages/echarts-function-analysis/index.ts \
  packages/echarts-function-analysis/src/function-analysis.ts \
  packages/echarts-function-analysis/src/expression.ts \
  packages/echarts-function-analysis/test/function-analysis.test.ts \
  vitest.config.js
git commit -m "Start the function analysis package"
```

## Task 2: Implement Safe Expression Parsing

**Files:**
- Modify: `packages/echarts-function-analysis/src/expression.ts`
- Test: `packages/echarts-function-analysis/test/function-analysis.test.ts`

- [ ] **Step 1: Replace the expression stub with tokenizer, parser, and evaluator**

Implement `src/expression.ts` with these exported contracts:

```ts
export interface ExpressionDiagnostic {
  message: string;
  position: number;
}

export interface CompiledExpression {
  expression: string;
  variable: string;
  diagnostics: ExpressionDiagnostic[];
  evaluate(scope: Record<string, number>): number;
}
```

Use these internal shapes:

```ts
type TokenType = 'number' | 'identifier' | 'operator' | 'leftParen' | 'rightParen' | 'comma' | 'end';

interface Token {
  type: TokenType;
  value: string;
  position: number;
}

type AstNode =
  | { type: 'number'; value: number }
  | { type: 'variable'; name: string }
  | { type: 'unary'; operator: '+' | '-'; argument: AstNode }
  | { type: 'binary'; operator: '+' | '-' | '*' | '/' | '^'; left: AstNode; right: AstNode }
  | { type: 'call'; name: string; args: AstNode[] };
```

Allowed functions table:

```ts
const functions: Record<string, { min: number; max: number; call: (...values: number[]) => number }> = {
  sin: { min: 1, max: 1, call: Math.sin },
  cos: { min: 1, max: 1, call: Math.cos },
  tan: { min: 1, max: 1, call: Math.tan },
  asin: { min: 1, max: 1, call: Math.asin },
  acos: { min: 1, max: 1, call: Math.acos },
  atan: { min: 1, max: 1, call: Math.atan },
  sinh: { min: 1, max: 1, call: Math.sinh },
  cosh: { min: 1, max: 1, call: Math.cosh },
  tanh: { min: 1, max: 1, call: Math.tanh },
  sqrt: { min: 1, max: 1, call: Math.sqrt },
  abs: { min: 1, max: 1, call: Math.abs },
  log: { min: 1, max: 1, call: Math.log },
  ln: { min: 1, max: 1, call: Math.log },
  log10: { min: 1, max: 1, call: Math.log10 },
  exp: { min: 1, max: 1, call: Math.exp },
  floor: { min: 1, max: 1, call: Math.floor },
  ceil: { min: 1, max: 1, call: Math.ceil },
  round: { min: 1, max: 1, call: Math.round },
  min: { min: 2, max: Number.POSITIVE_INFINITY, call: Math.min },
  max: { min: 2, max: Number.POSITIVE_INFINITY, call: Math.max },
  pow: { min: 2, max: 2, call: Math.pow }
};
```

Parser requirements:

- Parse exponentiation as right-associative.
- Parse unary operators with higher precedence than multiplication and lower precedence than function calls.
- Require full input consumption.
- Add one diagnostic per parse failure and return an evaluator that yields `NaN`.
- During evaluation, return `NaN` when the evaluated result is not finite.

- [ ] **Step 2: Run parser tests**

Run:

```bash
npm --workspace @echarts-extension/function-analysis run test:unit
```

Expected: PASS for the three parser tests.

- [ ] **Step 3: Add parser edge-case tests**

Append:

```ts
test('handles function arity and invalid characters with diagnostics', () => {
  assert.equal(compileExpression('min(x)').diagnostics.length > 0, true);
  assert.equal(compileExpression('sin()').diagnostics.length > 0, true);
  assert.equal(compileExpression('x[0]').diagnostics.length > 0, true);
  assert.equal(compileExpression('x; 1').diagnostics.length > 0, true);
});

test('normalizes non-finite expression results to NaN', () => {
  assert.equal(Number.isNaN(compileExpression('1 / 0').evaluate({ x: 0 })), true);
  assert.equal(Number.isNaN(compileExpression('sqrt(-1)').evaluate({ x: 0 })), true);
});
```

- [ ] **Step 4: Run parser edge-case tests**

Run:

```bash
npm --workspace @echarts-extension/function-analysis run test:unit
```

Expected: PASS.

- [ ] **Step 5: Commit expression parsing**

Run:

```bash
git add packages/echarts-function-analysis/src/expression.ts \
  packages/echarts-function-analysis/test/function-analysis.test.ts
git commit -m "Add safe function expression parsing"
```

## Task 3: Add Numerical Analysis Core

**Files:**
- Create: `packages/echarts-function-analysis/src/numerics.ts`
- Modify: `packages/echarts-function-analysis/test/function-analysis.test.ts`

- [ ] **Step 1: Add numerical tests before implementation**

Add imports:

```ts
import {
  buildTangent,
  estimateIntegral,
  findExtrema,
  findRoots,
  sampleFunction
} from '../src/numerics.ts';
```

Append tests:

```ts
test('samples valid segments and splits invalid function domains', () => {
  const compiled = compileExpression('1 / x');
  const sampled = sampleFunction(compiled.evaluate, [-1, 1], { samples: 9, variable: 'x' });

  assert.equal(sampled.samples.length, 9);
  assert.equal(sampled.segments.length, 2);
  assert.equal(sampled.samples.some((point) => !point.valid), true);
});

test('finds roots for a quadratic function', () => {
  const compiled = compileExpression('x^2 - 4');
  const sampled = sampleFunction(compiled.evaluate, [-5, 5], { samples: 401, variable: 'x' });
  const roots = findRoots(sampled, compiled.evaluate, { variable: 'x' });

  assert.deepEqual(roots.map((root) => round3(root.x)), [-2, 2]);
});

test('finds extrema and derivative estimates for smooth functions', () => {
  const parabola = compileExpression('x^2');
  const sampled = sampleFunction(parabola.evaluate, [-3, 3], { samples: 301, variable: 'x' });
  const extrema = findExtrema(sampled, parabola.evaluate, { variable: 'x' });
  const tangent = buildTangent(parabola.evaluate, 3, { variable: 'x', domain: [-3, 3] });

  assert.equal(round2(extrema[0].x), 0);
  assert.equal(extrema[0].kind, 'min');
  assert.equal(round2(tangent.slope), 6);
});

test('estimates definite integrals over finite ranges', () => {
  const compiled = compileExpression('sin(x)');
  const integral = estimateIntegral(compiled.evaluate, [0, Math.PI], { variable: 'x', intervals: 240 });

  assert.equal(round3(integral.value), 2);
  assert.equal(integral.valid, true);
});

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}
```

- [ ] **Step 2: Run tests and confirm numerics imports fail**

Run:

```bash
npm --workspace @echarts-extension/function-analysis run test:unit
```

Expected: FAIL because `src/numerics.ts` does not exist.

- [ ] **Step 3: Create `numerics.ts`**

Create `packages/echarts-function-analysis/src/numerics.ts` with these exports:

```ts
export interface FunctionSamplePoint {
  x: number;
  y: number;
  valid: boolean;
}

export interface FunctionSampleSegment {
  points: FunctionSamplePoint[];
}

export interface SampledFunction {
  samples: FunctionSamplePoint[];
  segments: FunctionSampleSegment[];
}

export interface RootCandidate {
  x: number;
  y: number;
  kind: 'crossing' | 'touch' | 'near-zero';
}

export interface ExtremaCandidate {
  x: number;
  y: number;
  kind: 'min' | 'max';
}

export interface TangentResult {
  x: number;
  y: number;
  slope: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  valid: boolean;
}

export interface IntegralResult {
  range: [number, number];
  value: number;
  valid: boolean;
}
```

Implementation rules:

- `sampleFunction` uses `samples` clamped to `[16, 5000]`.
- `safeEval` calls the evaluator with `{ [variable]: x }` and returns `NaN` on exceptions or non-finite output.
- `segments` split whenever a point is invalid.
- `findRoots` detects sign changes and near-zero samples with `epsilon = 1e-7`.
- `refineRoot` uses 48 bisection iterations when endpoints bracket a root.
- `findExtrema` compares neighboring valid samples and classifies min/max by y values.
- `estimateDerivative` uses central difference with `h = max(1e-5, domainWidth * 1e-5)`.
- `buildTangent` returns a line spanning 18 percent of the domain width around `x`.
- `estimateIntegral` uses trapezoids over `intervals` clamped to `[8, 10000]`; invalid subintervals mark the result invalid.

- [ ] **Step 4: Run numerical tests**

Run:

```bash
npm --workspace @echarts-extension/function-analysis run test:unit
```

Expected: PASS.

- [ ] **Step 5: Commit numerical core**

Run:

```bash
git add packages/echarts-function-analysis/src/numerics.ts \
  packages/echarts-function-analysis/test/function-analysis.test.ts
git commit -m "Add deterministic function analysis numerics"
```

## Task 4: Add Layout Projection

**Files:**
- Create: `packages/echarts-function-analysis/src/layout.ts`
- Modify: `packages/echarts-function-analysis/test/function-analysis.test.ts`

- [ ] **Step 1: Add layout tests**

Add import:

```ts
import { resolveFunctionAnalysisLayout } from '../src/layout.ts';
```

Append tests:

```ts
test('projects sampled function analysis into deterministic chart geometry', () => {
  const first = resolveFunctionAnalysisLayout({
    width: 640,
    height: 420,
    expression: 'x^2 - 4',
    domain: [-5, 5],
    samples: 401,
    analysis: {
      roots: true,
      extrema: true,
      tangent: { enabled: true, at: 1 },
      integral: { enabled: true, range: [-2, 2] }
    }
  });
  const second = resolveFunctionAnalysisLayout({
    width: 640,
    height: 420,
    expression: 'x^2 - 4',
    domain: [-5, 5],
    samples: 401,
    analysis: {
      roots: true,
      extrema: true,
      tangent: { enabled: true, at: 1 },
      integral: { enabled: true, range: [-2, 2] }
    }
  });

  assert.deepEqual(first, second);
  assert.equal(first.curves.length, 1);
  assert.deepEqual(first.roots.map((root) => round3(root.xValue)), [-2, 2]);
  assert.equal(first.extrema[0].kind, 'min');
  assert.equal(first.tangent?.valid, true);
  assert.equal(first.integral?.valid, true);
});

test('returns diagnostics without throwing for invalid expressions', () => {
  const layout = resolveFunctionAnalysisLayout({
    width: 500,
    height: 320,
    expression: 'sin('
  });

  assert.equal(layout.curves.length, 0);
  assert.equal(layout.diagnostics.length > 0, true);
});
```

- [ ] **Step 2: Run tests and confirm layout import fails**

Run:

```bash
npm --workspace @echarts-extension/function-analysis run test:unit
```

Expected: FAIL because `src/layout.ts` does not exist.

- [ ] **Step 3: Create layout contracts and option normalization**

Create `packages/echarts-function-analysis/src/layout.ts` with exports:

```ts
export interface FunctionAnalysisOption {
  width?: number;
  height?: number;
  expression?: string;
  variable?: string;
  domain?: [number, number];
  yExtent?: [number, number] | null;
  samples?: number;
  analysis?: FunctionAnalysisFlags;
}

export interface FunctionAnalysisFlags {
  roots?: boolean;
  extrema?: boolean;
  derivative?: boolean;
  discontinuities?: boolean;
  tangent?: boolean | { enabled?: boolean; at?: number };
  integral?: boolean | { enabled?: boolean; range?: [number, number] };
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ScreenPoint {
  x: number;
  y: number;
  xValue: number;
  yValue: number;
}

export interface FunctionCurveLayout {
  id: string;
  points: ScreenPoint[];
}

export interface AnalysisPointLayout extends ScreenPoint {
  id: string;
  kind: string;
  label: string;
}

export interface FunctionAnalysisLayoutResult {
  width: number;
  height: number;
  plotRect: Rect;
  xExtent: [number, number];
  yExtent: [number, number];
  curves: FunctionCurveLayout[];
  roots: AnalysisPointLayout[];
  extrema: AnalysisPointLayout[];
  discontinuities: AnalysisPointLayout[];
  tangent?: {
    valid: boolean;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    slope: number;
    label: string;
  };
  integral?: {
    valid: boolean;
    value: number;
    polygon: ScreenPoint[];
    label: string;
  };
  diagnostics: string[];
}
```

Implementation rules:

- Default width `600`, height `400`, plot padding `{ top: 28, right: 28, bottom: 44, left: 56 }`.
- Default expression `sin(x)`, variable `x`, domain `[-10, 10]`, samples `600`.
- Normalize reversed or invalid domains to `[-10, 10]`.
- Compute `yExtent` from valid samples with 8 percent padding.
- Use explicit `yExtent` when both values are finite and different.
- Map data x/y into `plotRect`.
- If expression diagnostics exist, return empty curves with diagnostics.
- Build integral polygon from valid sampled points inside the integral range plus baseline y=0 when visible.

- [ ] **Step 4: Run layout tests**

Run:

```bash
npm --workspace @echarts-extension/function-analysis run test:unit
```

Expected: PASS.

- [ ] **Step 5: Commit layout projection**

Run:

```bash
git add packages/echarts-function-analysis/src/layout.ts \
  packages/echarts-function-analysis/test/function-analysis.test.ts
git commit -m "Project function analysis into chart layout"
```

## Task 5: Render ECharts Series And SVG SSR Output

**Files:**
- Modify: `packages/echarts-function-analysis/src/function-analysis.ts`
- Modify: `packages/echarts-function-analysis/test/function-analysis.test.ts`

- [ ] **Step 1: Add renderer tests**

Add imports:

```ts
import * as echarts from 'echarts';
import '@echarts-extension/function-analysis';
```

Append tests:

```ts
test('renders function analysis curve and analysis markers in SVG SSR mode', () => {
  const chart = echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width: 640,
    height: 420
  });

  try {
    chart.setOption({
      animation: false,
      series: [
        {
          type: 'functionAnalysis',
          expression: 'x^2 - 4',
          domain: [-5, 5],
          samples: 401,
          analysis: {
            roots: true,
            extrema: true,
            tangent: { enabled: true, at: 1 },
            integral: { enabled: true, range: [-2, 2] }
          },
          label: { show: true }
        }
      ]
    });

    const svg = chart.renderToSVGString();
    assert.match(svg, /<polyline|<path/);
    assert.match(svg, /root|x=/);
    assert.match(svg, /integral|area|slope/);
  } finally {
    chart.dispose();
  }
});

test('renders invalid expression diagnostics in SVG SSR mode', () => {
  const chart = echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width: 480,
    height: 320
  });

  try {
    chart.setOption({
      animation: false,
      series: [{ type: 'functionAnalysis', expression: 'sin(' }]
    });
    const svg = chart.renderToSVGString();
    assert.match(svg, /Invalid expression|Expected|Unexpected/);
  } finally {
    chart.dispose();
  }
});
```

- [ ] **Step 2: Run tests and confirm renderer is incomplete**

Run:

```bash
npm --workspace @echarts-extension/function-analysis run test:unit
```

Expected: FAIL because render currently removes all elements.

- [ ] **Step 3: Implement renderer option reading**

In `src/function-analysis.ts`, add local host interfaces matching nearby packages:

```ts
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
  getModel(path: string | string[]): EChartsModel;
}

interface FunctionAnalysisSeriesModel extends EChartsModel {
  option?: FunctionAnalysisOption;
  getBoxLayoutParams(): unknown;
}
```

Read options using `seriesModel.get(...)` for `expression`, `variable`, `domain`, `samples`, `yExtent`, and `analysis`, then pass width and height from `helper.getLayoutRect`.

- [ ] **Step 4: Draw grid, axes, curves, markers, tangent, integral, and diagnostics**

Use zrender primitives:

```ts
graphic: {
  Group: new () => GraphicGroup;
  Circle: new (options: GraphicElementOptions) => GraphicElement;
  Line: new (options: GraphicElementOptions) => GraphicElement;
  Polyline: new (options: GraphicElementOptions) => GraphicElement;
  Polygon: new (options: GraphicElementOptions) => GraphicElement;
  Text: new (options: GraphicElementOptions) => GraphicElement;
}
```

Drawing rules:

- Clear the group at the start of render.
- Offset child coordinates by the layout rect.
- Draw a light grid inside `plotRect`.
- Draw x=0 and y=0 axes when they are inside extents; otherwise draw bottom and left axes.
- Draw each curve segment as `Polyline`.
- Draw integral polygon before curve segments.
- Draw tangent as `Line`.
- Draw roots and extrema as `Circle` plus labels when `label.show !== false`.
- Draw diagnostics as a compact text element at the top-left of the plot.

- [ ] **Step 5: Add tooltip formatter**

Add `formatTooltip` on the series model. It should return section markup with x/y values for markers where possible and a fallback header `Function analysis`.

- [ ] **Step 6: Run renderer tests**

Run:

```bash
npm --workspace @echarts-extension/function-analysis run test:unit
```

Expected: PASS.

- [ ] **Step 7: Commit renderer**

Run:

```bash
git add packages/echarts-function-analysis/src/function-analysis.ts \
  packages/echarts-function-analysis/test/function-analysis.test.ts
git commit -m "Render function analysis as an ECharts series"
```

## Task 6: Add Public Types And Workspace Build Wiring

**Files:**
- Create: `packages/echarts-function-analysis/index.d.ts`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `packages/echarts-function-analysis/README.md`
- Modify: `packages/echarts-function-analysis/README_CN.md`

- [ ] **Step 1: Add public type declarations**

Create `packages/echarts-function-analysis/index.d.ts`:

```ts
import 'echarts';

type FunctionAnalysisRange = [number, number];

interface FunctionAnalysisFunctionOption {
  id?: string | number;
  name?: string;
  expression: string;
  lineStyle?: FunctionAnalysisLineStyleOption;
}

interface FunctionAnalysisLineStyleOption {
  color?: string;
  width?: number;
  opacity?: number;
}

interface FunctionAnalysisItemStyleOption {
  color?: string;
  opacity?: number;
  borderColor?: string;
  borderWidth?: number;
}

interface FunctionAnalysisAreaStyleOption {
  color?: string;
  opacity?: number;
}

interface FunctionAnalysisOptionFlags {
  roots?: boolean;
  extrema?: boolean;
  derivative?: boolean;
  discontinuities?: boolean;
  intersections?: boolean;
  tangent?: boolean | { enabled?: boolean; at?: number };
  integral?: boolean | { enabled?: boolean; range?: FunctionAnalysisRange };
}

declare module 'echarts/types/dist/echarts' {
  export interface FunctionAnalysisSeriesOption {
    mainType?: 'series';
    type?: 'functionAnalysis';
    silent?: boolean;

    width?: number | string;
    height?: number | string;
    top?: number | string;
    right?: number | string;
    bottom?: number | string;
    left?: number | string;

    expression?: string;
    functions?: FunctionAnalysisFunctionOption[];
    variable?: string;
    domain?: FunctionAnalysisRange;
    yExtent?: FunctionAnalysisRange | null;
    samples?: number;
    analysis?: FunctionAnalysisOptionFlags;
    axis?: {
      show?: boolean;
      grid?: boolean;
      tickCount?: number;
    };
    lineStyle?: FunctionAnalysisLineStyleOption;
    itemStyle?: FunctionAnalysisItemStyleOption;
    areaStyle?: FunctionAnalysisAreaStyleOption;
    label?: {
      show?: boolean;
      color?: string;
      fontSize?: number;
    };
    emphasis?: {
      itemStyle?: FunctionAnalysisItemStyleOption;
      lineStyle?: FunctionAnalysisLineStyleOption;
    };
  }

  interface RegisteredSeriesOption {
    functionAnalysis: FunctionAnalysisSeriesOption;
  }
}
```

- [ ] **Step 2: Add README files**

Create `README.md` and `README_CN.md` with:

- install command
- basic `series.type = 'functionAnalysis'` example
- note that evaluation is parser-based and does not use arbitrary JavaScript execution
- option table for `expression`, `variable`, `domain`, `samples`, `analysis`, `lineStyle`, `itemStyle`, `areaStyle`, `label`

- [ ] **Step 3: Wire root scripts**

Modify root `package.json`:

- Add `npm --workspace @echarts-extension/function-analysis run build:ts` to `scripts.build:ts`.
- Workspaces already include `packages/*`, so no workspace array change is needed.

- [ ] **Step 4: Update lockfile metadata**

Run:

```bash
npm install --package-lock-only
```

Expected: `package-lock.json` gains `node_modules/@echarts-extension/function-analysis` and `packages/echarts-function-analysis`.

- [ ] **Step 5: Run package build**

Run:

```bash
npm --workspace @echarts-extension/function-analysis run build:ts
```

Expected: PASS.

- [ ] **Step 6: Commit public package wiring**

Run:

```bash
git add package.json package-lock.json \
  packages/echarts-function-analysis/index.d.ts \
  packages/echarts-function-analysis/README.md \
  packages/echarts-function-analysis/README_CN.md
git commit -m "Expose function analysis package types and build wiring"
```

## Task 7: Add MATLAB-Like Docs Workbench

**Files:**
- Create: `docs/templates/packages/echarts-function-analysis/index.tpl`
- Modify: `docs/shared/demo-runner.js`
- Modify: `docs/templates/index.tpl`
- Modify: `README.md`
- Modify: `README_CN.md`

- [ ] **Step 1: Add docs template**

Create `docs/templates/packages/echarts-function-analysis/index.tpl` with a first-viewport tool:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Function Analysis - ECharts Extension</title>
  <link rel="icon" href="../../../favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="../../shared/demo-page.css?v=interactions-4">
</head>
<body data-example="functionAnalysis">
  <main class="demo-shell">
    <header class="demo-header">
      <div>
        <p class="eyebrow">ECharts Extension</p>
        <h1>Function Analysis</h1>
        <p class="lede">Explore curves, roots, extrema, tangents, and integral area from a safe math expression.</p>
      </div>
      <nav class="demo-links" aria-label="Documentation navigation">
        <a href="../../">Examples</a>
        <a href="../../options.html">Options</a>
      </nav>
    </header>

    <section class="demo-stage demo-stage--with-panel" aria-label="Function analysis workbench">
      <div id="chart" class="demo-chart"></div>
      <aside id="controls" class="demo-controls"></aside>
    </section>
  </main>
  <script src="../../../node_modules/echarts/dist/echarts.min.js"></script>
  <script src="../../../packages/echarts-function-analysis/dist/echarts-function-analysis.js"></script>
  <script src="../../shared/demo-runner.js?v=function-analysis-1"></script>
</body>
</html>
```

- [ ] **Step 2: Add demo runner registry entry**

In `docs/shared/demo-runner.js`, add translation labels for:

- `Function Analysis`
- `Expression`
- `Domain min`
- `Domain max`
- `Samples`
- `Roots`
- `Extrema`
- `Tangent`
- `Tangent x`
- `Integral`
- `Integral min`
- `Integral max`

Add registry entry:

```js
functionAnalysis: {
  controls: [
    textControl('expression', 'Expression', 'series.0.expression', 'sin(x) + x^2 / 10'),
    rangeControl('domainMin', 'Domain min', 'series.0.domain.0', -10, -50, 0, 1),
    rangeControl('domainMax', 'Domain max', 'series.0.domain.1', 10, 1, 50, 1),
    rangeControl('samples', 'Samples', 'series.0.samples', 900, 100, 2400, 100),
    checkboxControl('roots', 'Roots', 'series.0.analysis.roots', true),
    checkboxControl('extrema', 'Extrema', 'series.0.analysis.extrema', true),
    checkboxControl('tangentEnabled', 'Tangent', 'series.0.analysis.tangent.enabled', true),
    rangeControl('tangentAt', 'Tangent x', 'series.0.analysis.tangent.at', 1.5, -10, 10, 0.5),
    checkboxControl('integralEnabled', 'Integral', 'series.0.analysis.integral.enabled', true),
    rangeControl('integralMin', 'Integral min', 'series.0.analysis.integral.range.0', -2, -10, 10, 0.5),
    rangeControl('integralMax', 'Integral max', 'series.0.analysis.integral.range.1', 3, -10, 10, 0.5)
  ],
  option: () => ({
    animation: false,
    series: [{
      type: 'functionAnalysis',
      expression: 'sin(x) + x^2 / 10',
      domain: [-10, 10],
      samples: 900,
      analysis: {
        roots: true,
        extrema: true,
        tangent: { enabled: true, at: 1.5 },
        integral: { enabled: true, range: [-2, 3] },
        discontinuities: true
      },
      label: { show: true }
    }]
  })
}
```

If `textControl` does not exist, add it near other control factories with the same state shape used by `rangeControl` and `checkboxControl`.

- [ ] **Step 3: Add gallery card**

Modify `docs/templates/index.tpl` and add a card:

```html
<a class="chart-gallery-card" href="./packages/echarts-function-analysis/">
  <span class="chart-gallery-card__media"><img src="../visual-baseline/echarts-function-analysis.png" alt="" loading="lazy"></span>
  <span class="chart-gallery-card__title">Function Analysis</span>
</a>
```

- [ ] **Step 4: Generate docs pages**

Run:

```bash
npm run docs:sync
```

Expected: generated docs include `docs/packages/echarts-function-analysis/index.html` and `index.zh.html`.

- [ ] **Step 5: Run docs check**

Run:

```bash
npm run docs:check
```

Expected: PASS.

- [ ] **Step 6: Commit docs workbench**

Run:

```bash
git add docs/templates/packages/echarts-function-analysis/index.tpl \
  docs/templates/index.tpl \
  docs/packages/echarts-function-analysis/index.html \
  docs/packages/echarts-function-analysis/index.zh.html \
  docs/shared/demo-runner.js \
  README.md README_CN.md
git commit -m "Add the function analysis docs workbench"
```

## Task 8: Final Verification And Completion Audit

**Files:**
- Verify all files touched by Tasks 1-7.

- [ ] **Step 1: Run package unit tests**

Run:

```bash
npm --workspace @echarts-extension/function-analysis run test:unit
```

Expected: PASS.

- [ ] **Step 2: Run package TypeScript build**

Run:

```bash
npm --workspace @echarts-extension/function-analysis run build:ts
```

Expected: PASS.

- [ ] **Step 3: Run package Vite build**

Run:

```bash
npm --workspace @echarts-extension/function-analysis run build
```

Expected: PASS and `packages/echarts-function-analysis/dist/echarts-function-analysis.js` exists.

- [ ] **Step 4: Run docs check**

Run:

```bash
npm run docs:check
```

Expected: PASS.

- [ ] **Step 5: Run targeted root unit test selection**

Run:

```bash
npm run test:unit -- packages/echarts-function-analysis/test/function-analysis.test.ts
```

Expected: PASS. If this command runs all unit tests because of the root script shape, read the output and confirm the function-analysis test file passes.

- [ ] **Step 6: Inspect changed files**

Run:

```bash
git status --short
git diff --stat HEAD
```

Expected: only function-analysis package, docs integration, root build/test wiring, generated docs, and README changes are present for this feature. Existing unrelated dirty files remain unstaged.

- [ ] **Step 7: Commit final build/docs adjustments**

If verification required small follow-up fixes, commit them:

```bash
git add <function-analysis-files-only>
git commit -m "Stabilize function analysis package verification"
```

- [ ] **Step 8: Completion audit**

Before claiming the active goal complete, check against the original objective:

- Formal package exists and registers `functionAnalysis`.
- Expression parser is safe and dependency-free.
- Curve plotting works in ECharts.
- Numerical analysis covers roots, extrema, derivative/tangent, integral, and discontinuity gaps.
- SVG SSR test proves renderer output.
- Docs workbench gives a MATLAB-like first tool surface.
- Future MATLAB-like expansion remains documented.

This audit will prove meaningful progress, not full MATLAB parity. Keep the active goal open unless the user explicitly scopes completion to this first formal package slice.
