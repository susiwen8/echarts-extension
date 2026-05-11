import assert from 'node:assert/strict';
import { test, vi } from 'vitest';

import {
  __test__ as layoutInternals,
  applyFractalRenderProfile,
  buildFractalRaster,
  iterateFractalPoint,
  panFractalViewport,
  resolveFractalViewportImageTransform,
  resolveFractalRenderPlan,
  zoomFractalViewport
} from '../src/layout.ts';
import { __test__ as fractalRenderer } from '../src/fractal.ts';

test('maps Mandelbrot pixels to a stable complex viewport', () => {
  const plan = resolveFractalRenderPlan({
    width: 400,
    height: 240,
    pixelRatio: 1,
    maxPixelCount: 400 * 240,
    viewport: {
      center: [-0.5, 0],
      viewWidth: 3,
      scale: 1
    }
  });

  assert.equal(plan.pixelWidth, 400);
  assert.equal(plan.pixelHeight, 240);
  assert.equal(plan.iterations, 180);
  assert.deepEqual(roundViewport(plan.viewport), {
    center: [-0.5, 0],
    viewWidth: 3,
    viewHeight: 1.8,
    scale: 1
  });
  assert.deepEqual(planToCoord(plan, 200, 120).map(round6), [-0.49625, -0.00375]);
});

test('increases iteration detail as zoom grows without imposing a zoom ceiling', () => {
  const base = resolveFractalRenderPlan({
    width: 320,
    height: 240,
    viewport: { center: [-0.75, 0.1], viewWidth: 3.2, scale: 1 },
    baseIterations: 120,
    iterationBoost: 32
  });
  const zoomed = resolveFractalRenderPlan({
    width: 320,
    height: 240,
    viewport: { center: [-0.75, 0.1], viewWidth: 3.2, scale: 1_000_000 },
    baseIterations: 120,
    iterationBoost: 32
  });

  assert.ok(zoomed.iterations > base.iterations);
  assert.equal(zoomed.viewport.scale, 1_000_000);
  assert.equal(round6(zoomed.viewport.viewWidth), 0.000003);
});

test('zooms around the cursor while preserving the complex point under it', () => {
  const plan = resolveFractalRenderPlan({
    width: 400,
    height: 240,
    viewport: { center: [-0.5, 0], viewWidth: 3, scale: 1 }
  });
  const before = planToCoord(plan, 300, 72);
  const zoomedViewport = zoomFractalViewport(plan.viewport, {
    width: 400,
    height: 240,
    localX: 300.5,
    localY: 72.5,
    zoomFactor: 3,
    minZoom: 0.05
  });
  const zoomedPlan = resolveFractalRenderPlan({
    width: 400,
    height: 240,
    viewport: zoomedViewport
  });
  const after = planToCoord(zoomedPlan, 300, 72);

  assert.deepEqual(after.map(round12), before.map(round12));
  assert.equal(zoomedViewport.scale, 3);
});

test('pans in screen space and keeps raster output deterministic', () => {
  const plan = resolveFractalRenderPlan({
    width: 64,
    height: 40,
    pixelRatio: 1,
    maxPixelCount: 64 * 40,
    viewport: panFractalViewport(
      { center: [-0.5, 0], viewWidth: 3, scale: 2 },
      { width: 300, height: 180, deltaX: 30, deltaY: -18 }
    ),
    colorStops: [
      [0, '#000000'],
      [1, '#ffffff']
    ],
    insideColor: '#112233'
  });

  assert.deepEqual(plan.viewport.center.map(round6), [-0.65, -0.09]);

  const raster = buildFractalRaster(plan);
  const again = buildFractalRaster(plan);
  assert.equal(raster.width, 64);
  assert.equal(raster.height, 40);
  assert.deepEqual(raster.data, again.data);

  const center = iterateFractalPoint(-0.5, 0, {
    fractalType: 'mandelbrot',
    maxIterations: 80
  });
  const outside = iterateFractalPoint(2, 2, {
    fractalType: 'mandelbrot',
    maxIterations: 80
  });

  assert.equal(center.escaped, false);
  assert.equal(outside.escaped, true);
  assert.ok(outside.iterations < 5);
});

test('supports Julia and Burning Ship formulas plus invalid option fallbacks', () => {
  const julia = resolveFractalRenderPlan({
    width: 40,
    height: 30,
    fractalType: 'julia',
    colorStops: [
      { offset: 1, color: '#fff' },
      { offset: 0.25, color: 'rgba(10,20,30,0.5)' }
    ],
    insideColor: 'transparent'
  });
  const burningShip = resolveFractalRenderPlan({
    width: 40,
    height: 30,
    fractalType: 'burningShip'
  });
  const invalid = resolveFractalRenderPlan({
    width: -10,
    height: Number.NaN,
    pixelRatio: -1,
    maxPixelCount: -4,
    fractalType: 'unknown',
    viewport: { center: [Number.NaN, 1], viewWidth: -1, scale: -2 },
    juliaConstant: [Number.NaN, 0],
    colorStops: [{ offset: Number.NaN, color: 'nope' }],
    insideColor: 'not-a-color'
  });

  assert.deepEqual(julia.viewport.center, [0, 0]);
  assert.equal(julia.viewport.viewWidth, 3.1);
  assert.deepEqual(burningShip.viewport.center, [-0.45, -0.55]);
  assert.equal(burningShip.viewport.viewWidth, 3.6);
  assert.equal(invalid.width, 1);
  assert.equal(invalid.height, 420);
  assert.equal(invalid.fractalType, 'mandelbrot');
  assert.deepEqual(invalid.juliaConstant, [-0.8, 0.156]);
  assert.equal(invalid.colorStops[0].offset, 0);
  assert.deepEqual(invalid.insideColor, { r: 5, g: 6, b: 9, a: 255 });

  assert.equal(iterateFractalPoint(0, 0, { fractalType: 'julia', juliaConstant: [-0.8, 0.156], maxIterations: 8 }).iterations > 0, true);
  assert.equal(iterateFractalPoint(2, 2, { fractalType: 'burningShip', maxIterations: 8 }).escaped, true);
});

test('uses a bounded preview render profile while roaming', () => {
  const baseOption = {
    width: 1178,
    height: 664,
    pixelRatio: 2,
    maxPixelCount: 520000,
    viewport: {
      center: [-0.743643887037151, 0.13182590420533],
      viewWidth: 3.2,
      scale: 256
    },
    baseIterations: 180,
    iterationBoost: 48,
    iterationLimit: 3000
  };
  const finalPlan = resolveFractalRenderPlan(baseOption);
  const previewPlan = resolveFractalRenderPlan(applyFractalRenderProfile(baseOption, {
    interactive: true,
    interactiveMaxPixelCount: 90000,
    interactivePixelRatio: 0.7,
    interactiveIterationScale: 0.42,
    minInteractiveIterations: 72
  }));

  assert.ok(finalPlan.pixelWidth * finalPlan.pixelHeight > 300000);
  assert.ok(previewPlan.pixelWidth * previewPlan.pixelHeight <= 90000);
  assert.ok(previewPlan.iterations < finalPlan.iterations);
  assert.equal(previewPlan.viewport.scale, finalPlan.viewport.scale);
  assert.deepEqual(previewPlan.viewport.center, finalPlan.viewport.center);
});

test('handles render profile fixed iterations and disabled interactive mode', () => {
  const baseOption = {
    width: 100,
    height: 80,
    pixelRatio: 2,
    maxPixelCount: 1_000,
    maxIterations: 500
  };
  const untouched = applyFractalRenderProfile(baseOption, { interactive: false });
  const withoutPixelRatio = applyFractalRenderProfile({ maxPixelCount: 100 }, { interactive: true });
  const profiled = applyFractalRenderProfile(baseOption, {
    interactive: true,
    interactivePixelRatio: 0.5,
    interactiveMaxPixelCount: 200,
    interactiveIterationScale: 0.1,
    minInteractiveIterations: 80
  });

  assert.notEqual(untouched, baseOption);
  assert.deepEqual(untouched, baseOption);
  assert.equal(withoutPixelRatio.pixelRatio, undefined);
  assert.equal(profiled.pixelRatio, 0.5);
  assert.equal(profiled.maxPixelCount, 200);
  assert.equal(profiled.maxIterations, 80);
});

test('computes an immediate image transform between viewport states', () => {
  const source = resolveFractalRenderPlan({
    width: 400,
    height: 240,
    viewport: { center: [-0.5, 0], viewWidth: 3, scale: 1 }
  }).viewport;
  const target = zoomFractalViewport(source, {
    width: 400,
    height: 240,
    localX: 300,
    localY: 72,
    zoomFactor: 2
  });
  const transform = resolveFractalViewportImageTransform(source, target, 400, 240);

  assert.equal(round6(transform.x), -300);
  assert.equal(round6(transform.y), -72);
  assert.equal(round6(transform.width), 800);
  assert.equal(round6(transform.height), 480);
});

test('enables worker rendering by default with explicit fallback switches', () => {
  const enabledModel = fakeSeriesModel({});
  const disabledModel = fakeSeriesModel({ worker: false });

  assert.equal(fractalRenderer.readWorkerRenderEnabled(enabledModel, true), true);
  assert.equal(fractalRenderer.readWorkerRenderEnabled(disabledModel, true), false);
  assert.equal(fractalRenderer.readWorkerRenderEnabled(enabledModel, false), false);
});

test('accepts only the latest worker result for the active render token', () => {
  const activeToken = {};
  const staleToken = {};
  const view = {
    __fractalRenderToken: activeToken,
    __fractalWorkerRequestId: 12
  };

  assert.equal(fractalRenderer.isLatestFractalWorkerResult(view, activeToken, 12), true);
  assert.equal(fractalRenderer.isLatestFractalWorkerResult(view, activeToken, 11), false);
  assert.equal(fractalRenderer.isLatestFractalWorkerResult(view, staleToken, 12), false);
});

test('covers private layout helpers for colors, bounds, and interpolation', () => {
  assert.deepEqual(layoutInternals.parseColor('#abc'), { r: 170, g: 187, b: 204, a: 255 });
  assert.deepEqual(layoutInternals.parseColor('#abcd'), { r: 170, g: 187, b: 204, a: 221 });
  assert.deepEqual(layoutInternals.parseColor('#00112233'), { r: 0, g: 17, b: 34, a: 51 });
  assert.deepEqual(layoutInternals.parseColor('rgb(1, 2, 3)'), { r: 1, g: 2, b: 3, a: 255 });
  assert.deepEqual(layoutInternals.parseColor('rgba(300, -5, 2, 0.25)'), { r: 255, g: 0, b: 2, a: 64 });
  assert.equal(layoutInternals.parseColor(1), null);
  assert.equal(layoutInternals.parseColor('#12'), null);
  assert.equal(layoutInternals.parseColor('rgb(1,2)'), null);
  assert.equal(layoutInternals.parseColor('rgb(a,2,3)'), null);
  assert.equal(layoutInternals.readColorStop(['bad', '#fff']), null);
  assert.equal(layoutInternals.readColorStop('bad'), null);
  assert.deepEqual(layoutInternals.readColorStop({ offset: 2, color: 'white' }), {
    offset: 1,
    color: { r: 255, g: 255, b: 255, a: 255 }
  });
  assert.deepEqual(layoutInternals.resolveColorStops([[0.5, 'black']]).map((stop) => stop.offset), [0, 0.5, 1]);
  assert.deepEqual(layoutInternals.interpolateColor([
    { offset: 0, color: { r: 0, g: 0, b: 0, a: 255 } },
    { offset: 1, color: { r: 10, g: 20, b: 30, a: 255 } }
  ], 0.5), { r: 5, g: 10, b: 15, a: 255 });
  assert.deepEqual(layoutInternals.interpolateColor([
    { offset: 0, color: { r: 1, g: 1, b: 1, a: 255 } },
    { offset: 1, color: { r: 3, g: 3, b: 3, a: 255 } }
  ], 2), { r: 3, g: 3, b: 3, a: 255 });
  assert.equal(layoutInternals.readFractalType('julia'), 'julia');
  assert.equal(layoutInternals.readFractalType('burningShip'), 'burningShip');
  assert.equal(layoutInternals.readFractalType('other'), 'mandelbrot');
  assert.equal(layoutInternals.defaultViewWidth('mandelbrot'), 3.2);
  assert.deepEqual(layoutInternals.readPoint([1, 2]), [1, 2]);
  assert.equal(layoutInternals.readPoint([1]), null);
  assert.equal(layoutInternals.readPoint([Number.NaN, 2]), null);
  assert.equal(layoutInternals.isPlainObject({}), true);
  assert.equal(layoutInternals.isPlainObject(null), false);
  assert.equal(layoutInternals.finiteNumber(Number.POSITIVE_INFINITY, 7), 7);
  assert.equal(layoutInternals.clamp(5, 1, 3), 3);
  assert.equal(layoutInternals.lerp(2, 10, 0.25), 4);
});

test('covers private viewport and sizing helpers', () => {
  const fixed = layoutInternals.resolveIterationCount({ maxIterations: 3.8 }, 10);
  const limited = layoutInternals.resolveIterationCount({ baseIterations: 3, iterationBoost: 10, iterationLimit: 5 }, 64);
  const directSize = layoutInternals.resolvePixelSize(10, 5, 1, 100);
  const reducedSize = layoutInternals.resolvePixelSize(10, 10, 2, 25);
  const viewport = layoutInternals.makeViewport([1, 2], 4, 2, 200, 100);
  const ensured = layoutInternals.ensureResolvedViewport(viewport, 200, 100);
  const ensuredFallbackCenter = layoutInternals.ensureResolvedViewport({
    center: [Number.NaN, 0],
    baseViewWidth: 4,
    viewHeight: 2,
    scale: 2
  }, 200, 100);
  const fromOption = layoutInternals.ensureResolvedViewport({ center: [0, 1], viewWidth: 4, zoom: 2 }, 200, 100);
  const withBase = layoutInternals.resolveFractalViewport({
    viewport: { center: [1, 1], viewWidth: 9, scale: 3, baseViewWidth: 6 }
  }, 300, 150, 'mandelbrot');

  assert.equal(fixed, 3);
  assert.equal(limited, 5);
  assert.deepEqual(directSize, { pixelRatio: 1, pixelWidth: 10, pixelHeight: 5 });
  assert.equal(reducedSize.pixelWidth * reducedSize.pixelHeight <= 25, true);
  assert.deepEqual(ensured, viewport);
  assert.deepEqual(ensuredFallbackCenter.center, [-0.62, 0]);
  assert.equal(fromOption.scale, 2);
  assert.equal(withBase.baseViewWidth, 6);
  assert.equal(layoutInternals.scaleIterationOption(undefined, 100, 0.5, 80), 80);
  assert.equal(layoutInternals.escapedResult(2, 4, 10).escaped, true);
  assert.equal(layoutInternals.escapedResult(2, 0, 10).smoothIteration, 3);
  assert.deepEqual(layoutInternals.colorForSample({ escaped: false }, { insideColor: { r: 1, g: 2, b: 3, a: 4 } }), { r: 1, g: 2, b: 3, a: 4 });
});

test('covers renderer helpers for options, drawing, events, and cleanup', () => {
  const restoreDocument = stubCanvasDocument();
  try {
    const host = fakeGraphicHost();
    const seriesModel = fakeSeriesModel({
      fractalType: 'julia',
      pixelRatio: 1.5,
      maxPixelCount: 10,
      fallbackMaxCells: 3,
      backgroundColor: '#123456',
      interactivePixelRatio: 0.2,
      interactiveMaxPixelCount: 20,
      interactiveIterationScale: 0.4,
      minInteractiveIterations: 30,
      refineDelay: -1
    });
    const api = { getDevicePixelRatio: () => 2 };
    const option = fractalRenderer.readRenderOption(seriesModel, { x: 1, y: 2, width: 20, height: 10 }, api, true);
    const fallbackOption = fractalRenderer.readRenderOption(seriesModel, { x: 1, y: 2, width: 20, height: 10 }, api, false);
    const activeOption = fractalRenderer.readActiveRenderOption(seriesModel, { x: 1, y: 2, width: 20, height: 10 }, api, true);
    const plan = resolveFractalRenderPlan({
      width: 2,
      height: 1,
      pixelRatio: 1,
      maxPixelCount: 2,
      maxIterations: 2,
      colorStops: [[0, '#000'], [1, '#fff']]
    });
    const group = new host.graphic.Group();
    const raster = { width: 2, height: 1, data: new Uint8ClampedArray([0, 0, 0, 255, 255, 255, 255, 128]) };
    const imageResult = fractalRenderer.drawFractal(host, group, seriesModel, plan, { x: 3, y: 4, width: 20, height: 10 }, true, raster);
    const fallbackGroup = new host.graphic.Group();
    const cellResult = fractalRenderer.drawFractal(host, fallbackGroup, fakeSeriesModel({}, 0), plan, { x: 0, y: 0, width: 20, height: 10 }, false, raster);
    const view = {};

    fractalRenderer.rememberDrawResult(view, imageResult, plan);
    assert.equal(fractalRenderer.applyFractalImageTransform(view, plan.viewport, { width: 20, height: 10 }), true);
    assert.equal(imageResult.imageElement.style.width, 20);
    assert.equal(imageResult.imageElement.attrCalls.length > 0, true);
    assert.equal(fractalRenderer.applyFractalImageTransform({}, plan.viewport, { width: 20, height: 10 }), false);
    fractalRenderer.rememberDrawResult(view, imageResult, plan);
    assert.equal(fractalRenderer.applyFractalImageTransform(view, plan.viewport, { width: 0, height: 10 }), false);
    fractalRenderer.rememberDrawResult(view, {}, plan);
    assert.equal(view.__fractalImageViewport, undefined);
    const plainImage = {};
    fractalRenderer.setImageElementStyle(plainImage, { x: 1 });
    assert.deepEqual(plainImage.style, { x: 1 });

    assert.equal(option.fractalType, 'julia');
    assert.equal(activeOption.viewport, undefined);
    assert.equal(fractalRenderer.readActiveRenderOption(seriesModel, { x: 1, y: 2, width: 20, height: 10 }, api, true, plan.viewport).viewport, plan.viewport);
    assert.equal(option.pixelRatio, 1.5);
    assert.equal(fallbackOption.pixelRatio, 1.5);
    assert.equal(fallbackOption.maxPixelCount, 3);
    assert.equal(group.children.length, 1);
    assert.equal(imageResult.imageElement.type, 'image');
    assert.equal(fallbackGroup.children[0].children.length, 3);
    assert.equal(cellResult.imageElement, undefined);
    assert.equal(seriesModel.data.graphicEl.type, 'image');
    assert.deepEqual(seriesModel.data.layout, [13, 9]);
    assert.equal(fractalRenderer.readBackgroundColor(seriesModel), '#123456');
    assert.equal(fractalRenderer.readBackgroundColor(fakeSeriesModel({})), '#050609');
    assert.deepEqual(fractalRenderer.readInteractiveRenderProfile(seriesModel), {
      interactive: true,
      interactivePixelRatio: 0.2,
      interactiveMaxPixelCount: 20,
      interactiveIterationScale: 0.4,
      minInteractiveIterations: 30
    });
    assert.equal(fractalRenderer.readRefineDelay(seriesModel), 0);
    assert.equal(fractalRenderer.createRasterSource(raster).width, 2);
    assert.equal(fractalRenderer.canUseRasterCanvas(), true);
    assert.equal(fractalRenderer.readDevicePixelRatio(fakeSeriesModel({ pixelRatio: 3 }), api), 3);
    assert.equal(fractalRenderer.readDevicePixelRatio(fakeSeriesModel({}), api), 2);
    vi.stubGlobal('window', { devicePixelRatio: 4 });
    assert.equal(fractalRenderer.readDevicePixelRatio(fakeSeriesModel({}), {}), 4);
    vi.stubGlobal('window', undefined);
    assert.equal(fractalRenderer.readDevicePixelRatio(fakeSeriesModel({}), {}), 1);
    assert.match(fractalRenderer.createViewportKey(option), /julia/);
    assert.deepEqual(fractalRenderer.eventPoint({ event: { offsetX: 5, offsetY: 6 }, zrX: 1, zrY: 2 }), [5, 6]);
    assert.deepEqual(fractalRenderer.eventPoint({ zrX: 1, zrY: 2 }), [1, 2]);
    assert.equal(fractalRenderer.containsPoint({ x: 0, y: 0, width: 10, height: 10 }, [10, 10]), true);
    assert.equal(fractalRenderer.containsPoint({ x: 0, y: 0, width: 10, height: 10 }, [11, 10]), false);
    assert.equal(fractalRenderer.readWheelDirection({ event: { deltaY: -1 } }), 1);
    assert.equal(fractalRenderer.readWheelDirection({ deltaY: 1 }), -1);
    assert.equal(fractalRenderer.readWheelDirection({ wheelDelta: 1 }), 1);
    assert.equal(fractalRenderer.readWheelDirection({ wheelDelta: -1 }), -1);
    assert.equal(fractalRenderer.readWheelDirection({}), 1);
    assert.equal(fractalRenderer.formatRgba(1, 2, 3, 255), 'rgb(1,2,3)');
    assert.equal(fractalRenderer.formatRgba(1, 2, 3, 128), 'rgba(1,2,3,0.5)');
    assert.equal(fractalRenderer.finiteNumber('x', 4), 4);
    assert.equal(fractalRenderer.clamp(-1, 0, 2), 0);
  } finally {
    restoreDocument();
  }
});

test('covers worker creation, result acceptance, and fallback paths', () => {
  const restoreDocument = stubCanvasDocument();
  const restoreWorker = stubWorkerEnvironment();
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    const host = fakeGraphicHost();
    const token = {};
    const plan = resolveFractalRenderPlan({
      width: 1,
      height: 1,
      pixelRatio: 1,
      maxPixelCount: 1,
      maxIterations: 1
    });
    const seriesModel = fakeSeriesModel({});
    const api = fakeApi();
    const view = { group: new host.graphic.Group(), __fractalRenderToken: token };

    assert.equal(fractalRenderer.readWorkerUrl(fakeSeriesModel({ workerUrl: ' worker.js ' })), ' worker.js ');
    assert.equal(fractalRenderer.readWorkerUrl(fakeSeriesModel({ workerUrl: '' })), null);
    assert.equal(fractalRenderer.createInlineFractalWorkerUrl(), 'blob:test-1');
    assert.equal(fractalRenderer.createFractalWorker(fakeSeriesModel({ workerUrl: 'worker.js' })).worker.url, 'worker.js');
    assert.equal(fractalRenderer.requestFractalWorkerRender(view, host, seriesModel, plan, { x: 0, y: 0, width: 1, height: 1 }, true, token, api), true);

    const worker = FakeWorker.instances.at(-1);
    assert.deepEqual(worker.posted.requestId, 1);
    worker.onmessage({ data: { requestId: 0, width: 1, height: 1, data: new Uint8ClampedArray(4) } });
    assert.equal(view.__fractalWorker, worker);
    worker.onmessage({ data: { requestId: 1, width: 1, height: 1, data: new Uint8ClampedArray([1, 2, 3, 255]) } });
    assert.equal(worker.terminated, true);
    assert.equal(view.__fractalWorker, undefined);
    assert.equal(api.refreshCount, 1);

    const errorView = { group: new host.graphic.Group(), __fractalRenderToken: token };
    fractalRenderer.requestFractalWorkerRender(errorView, host, seriesModel, plan, { x: 0, y: 0, width: 1, height: 1 }, true, token, api);
    const errorWorker = FakeWorker.instances.at(-1);
    errorWorker.onmessage({ data: { requestId: errorView.__fractalWorkerRequestId, error: 'bad' } });
    assert.equal(consoleError.mock.calls.length > 0, true);

    const emptyView = { group: new host.graphic.Group(), __fractalRenderToken: token };
    fractalRenderer.requestFractalWorkerRender(emptyView, host, seriesModel, plan, { x: 0, y: 0, width: 1, height: 1 }, true, token, api);
    const emptyWorker = FakeWorker.instances.at(-1);
    emptyWorker.onmessage({ data: { requestId: emptyView.__fractalWorkerRequestId } });

    const throwView = { group: new host.graphic.Group(), __fractalRenderToken: token };
    fractalRenderer.requestFractalWorkerRender(throwView, host, seriesModel, plan, { x: 0, y: 0, width: 1, height: 1 }, true, token, api);
    const throwWorker = FakeWorker.instances.at(-1);
    throwWorker.onerror({ message: '' });
    assert.equal(throwWorker.terminated, true);

    const staleErrorView = { group: new host.graphic.Group(), __fractalRenderToken: token };
    fractalRenderer.requestFractalWorkerRender(staleErrorView, host, seriesModel, plan, { x: 0, y: 0, width: 1, height: 1 }, true, token, api);
    const staleErrorWorker = FakeWorker.instances.at(-1);
    staleErrorView.__fractalRenderToken = {};
    staleErrorWorker.onerror({ message: 'late' });
    assert.equal(staleErrorWorker.terminated, false);

    const staleView = { group: new host.graphic.Group(), __fractalRenderToken: token };
    fractalRenderer.drawFractalOnMainThread(staleView, host, seriesModel, plan, { x: 0, y: 0, width: 1, height: 1 }, true, {}, api);
    assert.equal(staleView.group.children.length, 0);
    fractalRenderer.drawFractalOnMainThread(staleView, host, seriesModel, plan, { x: 0, y: 0, width: 1, height: 1 }, true, token, api);
    assert.equal(staleView.group.children.length, 1);

    FakeWorker.throwOnCreate = true;
    assert.equal(fractalRenderer.createFractalWorker(fakeSeriesModel({})), null);
    assert.equal(fractalRenderer.createFractalWorker(fakeSeriesModel({ workerUrl: 'worker.js' })), null);
    FakeWorker.throwOnCreate = false;
    vi.stubGlobal('Worker', undefined);
    assert.equal(fractalRenderer.createFractalWorker(fakeSeriesModel({})), null);
    vi.stubGlobal('Worker', FakeWorker);
    vi.stubGlobal('Blob', undefined);
    assert.equal(fractalRenderer.createInlineFractalWorkerUrl(), null);
    assert.equal(fractalRenderer.createFractalWorker(fakeSeriesModel({})), null);
    assert.equal(fractalRenderer.requestFractalWorkerRender({ group: new host.graphic.Group() }, host, fakeSeriesModel({ worker: false }), plan, { x: 0, y: 0, width: 1, height: 1 }, true, token, api), false);
    assert.equal(fractalRenderer.requestFractalWorkerRender({ group: new host.graphic.Group() }, host, fakeSeriesModel({}), plan, { x: 0, y: 0, width: 1, height: 1 }, true, token, api), false);
  } finally {
    consoleError.mockRestore();
    restoreWorker();
    restoreDocument();
  }
});

test('covers roam controller event branches and timer cleanup', () => {
  const zrender = fakeZrender();
  const view = {};
  const redraws = [];
  const controller = fractalRenderer.installFractalRoam(
    view,
    fakeSeriesModel({ zoomStep: 2, minZoom: 0.5, maxZoom: 8 }),
    { getZr: () => zrender },
    { x: 10, y: 20, width: 100, height: 80 },
    (request) => redraws.push(request)
  );

  assert.equal(fractalRenderer.installFractalRoam(view, fakeSeriesModel({ roam: false }), { getZr: () => zrender }, { x: 0, y: 0, width: 1, height: 1 }, () => {}), undefined);
  assert.equal(fractalRenderer.installFractalRoam(view, fakeSeriesModel({}), { getZr: () => null }, { x: 0, y: 0, width: 1, height: 1 }, () => {}), undefined);

  zrender.handlers.mousewheel({ event: { offsetX: 60, offsetY: 60, deltaY: -1, preventDefault() { this.prevented = true; } } });
  assert.equal(view.__fractalViewport.scale, 2);
  zrender.handlers.mousewheel({ event: { offsetX: 60, offsetY: 60, deltaY: 1, preventDefault() {} } });
  assert.equal(view.__fractalViewport.scale, 1);
  zrender.handlers.mousedown({ event: { button: 1, offsetX: 60, offsetY: 60 } });
  zrender.handlers.mousemove({ event: { offsetX: 70, offsetY: 65 } });
  assert.equal(redraws.length, 2);
  zrender.handlers.mousedown({ event: { button: 0, offsetX: 0, offsetY: 0 } });
  zrender.handlers.mousedown({ button: 0, offsetX: 60, offsetY: 60 });
  zrender.handlers.mousemove({ event: { offsetX: 70, offsetY: 65 } });
  assert.equal(redraws.length, 3);
  zrender.handlers.mouseup();
  zrender.handlers.globalout();
  controller.dispose();
  assert.equal(zrender.offCalls.length, 5);

  const zrenderNoViewport = fakeZrender();
  const noViewportView = {};
  const noViewportRedraws = [];
  fractalRenderer.installFractalRoam(noViewportView, fakeSeriesModel({}), { getZr: () => zrenderNoViewport }, { x: 0, y: 0, width: 10, height: 10 }, (request) => noViewportRedraws.push(request));
  zrenderNoViewport.handlers.mousedown({ offsetX: 5, offsetY: 5 });
  zrenderNoViewport.handlers.mousemove({ offsetX: 6, offsetY: 6 });
  assert.equal(noViewportRedraws.length, 1);

  const timerView = {
    __fractalPreviewFrame: setTimeout(() => {}, 1000),
    __fractalRefineTimer: setTimeout(() => {}, 1000)
  };
  fractalRenderer.clearScheduledFractalRender(timerView);
  assert.equal(timerView.__fractalPreviewFrame, undefined);
  assert.equal(timerView.__fractalRefineTimer, undefined);
  const done = vi.fn();
  const frame = fractalRenderer.requestFractalFrame(done);
  clearTimeout(frame);

  const restoreDocument = globalThis.document;
  const restoreOffscreenCanvas = globalThis.OffscreenCanvas;
  vi.stubGlobal('document', undefined);
  vi.stubGlobal('OffscreenCanvas', class {
    constructor(width, height) {
      this.width = width;
      this.height = height;
    }
  });
  assert.equal(fractalRenderer.createCanvas(3, 4).width, 3);
  vi.stubGlobal('OffscreenCanvas', undefined);
  assert.equal(fractalRenderer.createCanvas(3, 4), null);
  assert.equal(fractalRenderer.createRasterSource({ width: 1, height: 1, data: new Uint8ClampedArray(4) }), null);
  vi.stubGlobal('document', {
    createElement() {
      return { width: 0, height: 0, getContext: () => null };
    }
  });
  assert.equal(fractalRenderer.createRasterSource({ width: 1, height: 1, data: new Uint8ClampedArray(4) }), null);
  vi.stubGlobal('document', restoreDocument);
  vi.stubGlobal('OffscreenCanvas', restoreOffscreenCanvas);
});

test('covers extracted render scheduling branches', () => {
  vi.useFakeTimers();
  const restoreDocument = stubCanvasDocument();
  try {
    const host = fakeGraphicHost();
    const plan = resolveFractalRenderPlan({ width: 2, height: 1, pixelRatio: 1, maxPixelCount: 2, maxIterations: 1 });
    const image = new host.graphic.Image({ style: { image: {}, x: 0, y: 0, width: 2, height: 1 } });
    const view = {
      __fractalViewport: plan.viewport,
      __fractalImageElement: image,
      __fractalImageViewport: zoomFractalViewport(plan.viewport, {
        width: 2,
        height: 1,
        localX: 1,
        localY: 0.5,
        zoomFactor: 0.5
      })
    };
    const api = fakeApi();
    const requests = [];

    fractalRenderer.scheduleFractalRender(view, fakeSeriesModel({ refineDelay: 5 }), api, { x: 0, y: 0, width: 2, height: 1 }, (request) => requests.push(request), { interactive: true });
    const previewFrame = view.__fractalPreviewFrame;
    fractalRenderer.scheduleFractalRender(view, fakeSeriesModel({ refineDelay: 5 }), api, { x: 0, y: 0, width: 2, height: 1 }, (request) => requests.push(request), { interactive: true });
    assert.equal(view.__fractalPreviewFrame, previewFrame);
    assert.equal(api.refreshCount, 2);
    vi.advanceTimersByTime(5);
    assert.deepEqual(requests.at(-1), { interactive: false });
    vi.advanceTimersByTime(11);
    assert.deepEqual(requests.at(-1), { interactive: true });
    fractalRenderer.scheduleFractalRender(view, fakeSeriesModel({}), api, { x: 0, y: 0, width: 2, height: 1 }, (request) => requests.push(request), {});
    assert.deepEqual(requests.at(-1), {});
  } finally {
    restoreDocument();
    vi.useRealTimers();
  }
});

test('covers registered model and view lifecycle methods', () => {
  vi.useFakeTimers();
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    const modelDefinition = fractalRenderer.fractalSeriesModelDefinition;
    const viewDefinition = fractalRenderer.fractalChartViewDefinition;
    const model = {
      getData: () => ({ count: () => 1 }),
      getBoxLayoutParams: () => ({ left: 0, top: 0, width: 12, height: 8 })
    };
    const initial = modelDefinition.getInitialData.call(model, { data: [{ value: 1 }] });
    const fallbackInitial = modelDefinition.getInitialData.call(model, {});

    assert.equal(initial.count() >= 0, true);
    assert.equal(fallbackInitial.count() >= 0, true);
    assert.deepEqual(modelDefinition.getTooltipPosition.call({ getData: () => ({ count: () => 1 }) }), [0, 0]);
    assert.equal(modelDefinition.getTooltipPosition.call({ getData: () => ({ count: () => 0 }) }), undefined);

    const zrender = fakeZrender();
    const seriesModel = fakeSeriesModel({
      worker: false,
      maxPixelCount: 4,
      fallbackMaxCells: 4,
      maxIterations: 1,
      refineDelay: 1
    });
    seriesModel.getBoxLayoutParams = () => ({ left: 0, top: 0, width: 4, height: 4 });
    const view = { group: fakeRootGroup() };
    viewDefinition.render.call(view, seriesModel, null, {
      getWidth: () => 4,
      getHeight: () => 4,
      getZr: () => zrender
    });
    assert.equal(view.group.children.length > 0, true);
    zrender.handlers.mousewheel({ event: { offsetX: 2, offsetY: 2, deltaY: -1, preventDefault() {} } });
    view.__fractalRenderToken = {};
    vi.runOnlyPendingTimers();
    assert.equal(view.group.children.length > 0, true);
    viewDefinition.render.call(view, seriesModel, null, {
      getWidth: () => 4,
      getHeight: () => 4,
      getZr: () => zrender
    });
    viewDefinition.remove.call(view);
    assert.equal(view.group.children.length, 0);
    viewDefinition.dispose.call(view);
    assert.equal(view.group.children.length, 0);

    viewDefinition.render.call({ group: fakeRootGroup() }, {
      getBoxLayoutParams() {
        throw new Error('layout failed');
      }
    }, null, { getWidth: () => 1, getHeight: () => 1 });
    assert.equal(consoleError.mock.calls.length > 0, true);

    const restoreDocument = stubCanvasDocument();
    const restoreWorker = stubWorkerEnvironment();
    try {
      const workerSeriesModel = fakeSeriesModel({
        maxPixelCount: 1,
        maxIterations: 1,
        refineDelay: 1
      });
      workerSeriesModel.getBoxLayoutParams = () => ({ left: 0, top: 0, width: 1, height: 1 });
      const workerView = { group: fakeRootGroup() };
      viewDefinition.render.call(workerView, workerSeriesModel, null, {
        getWidth: () => 1,
        getHeight: () => 1,
        getZr: () => null
      });
      assert.equal(FakeWorker.instances.length > 0, true);
    } finally {
      restoreWorker();
      restoreDocument();
    }
  } finally {
    consoleError.mockRestore();
    vi.useRealTimers();
  }
});

function planToCoord(plan, pixelX, pixelY) {
  return [
    plan.viewport.minX + (pixelX + 0.5) * plan.pixelStepX,
    plan.viewport.maxY - (pixelY + 0.5) * plan.pixelStepY
  ];
}

function roundViewport(viewport) {
  return {
    center: viewport.center.map(round6),
    viewWidth: round6(viewport.viewWidth),
    viewHeight: round6(viewport.viewHeight),
    scale: viewport.scale
  };
}

function round6(value) {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function round12(value) {
  return Math.round(value * 1_000_000_000_000) / 1_000_000_000_000;
}

function fakeSeriesModel(values, count = 1) {
  const data = fakeData(count);
  return {
    data,
    get(key) {
      return values[key];
    },
    getData() {
      return data;
    },
    getBoxLayoutParams() {
      return {};
    }
  };
}

function fakeData(count = 1) {
  return {
    layout: null,
    graphicEl: null,
    initData(source) {
      this.source = source;
    },
    count() {
      return count;
    },
    setItemLayout(index, layout) {
      this.layout = layout;
    },
    setItemGraphicEl(index, element) {
      this.graphicEl = element;
    }
  };
}

function fakeRootGroup() {
  return {
    children: [],
    add(element) {
      this.children.push(element);
    },
    removeAll() {
      this.children = [];
    }
  };
}

function fakeGraphicHost() {
  class Group {
    constructor() {
      this.children = [];
    }

    add(element) {
      this.children.push(element);
    }

    removeAll() {
      this.children = [];
    }
  }

  class Rect {
    constructor(options) {
      this.type = 'rect';
      Object.assign(this, options);
    }
  }

  class Image {
    constructor(options) {
      this.type = 'image';
      Object.assign(this, options);
      this.attrCalls = [];
      this.dirtyCount = 0;
    }

    attr(keyOrObj, value) {
      this.attrCalls.push([keyOrObj, value]);
      if (keyOrObj === 'style') this.style = value;
    }

    dirty() {
      this.dirtyCount += 1;
    }
  }

  return {
    graphic: { Group, Rect, Image }
  };
}

function stubCanvasDocument() {
  const previousDocument = globalThis.document;
  vi.stubGlobal('document', {
    createElement() {
      return {
        width: 0,
        height: 0,
        getContext(type) {
          if (type !== '2d') return null;
          return {
            imageData: null,
            createImageData(width, height) {
              return { width, height, data: new Uint8ClampedArray(width * height * 4) };
            },
            putImageData(imageData) {
              this.imageData = imageData;
            }
          };
        }
      };
    }
  });

  return () => {
    vi.stubGlobal('document', previousDocument);
  };
}

class FakeWorker {
  static instances = [];
  static throwOnCreate = false;

  constructor(url) {
    if (FakeWorker.throwOnCreate) throw new Error('worker failed');
    this.url = url;
    this.terminated = false;
    FakeWorker.instances.push(this);
  }

  postMessage(message) {
    this.posted = message;
  }

  terminate() {
    this.terminated = true;
  }
}

function stubWorkerEnvironment() {
  const previousWorker = globalThis.Worker;
  const previousURL = globalThis.URL;
  const previousBlob = globalThis.Blob;
  let objectUrlCount = 0;
  FakeWorker.instances = [];
  FakeWorker.throwOnCreate = false;

  vi.stubGlobal('Worker', FakeWorker);
  vi.stubGlobal('Blob', class {
    constructor(parts, options) {
      this.parts = parts;
      this.options = options;
    }
  });
  vi.stubGlobal('URL', {
    createObjectURL() {
      objectUrlCount += 1;
      return `blob:test-${objectUrlCount}`;
    },
    revokeObjectURL(url) {
      this.revoked = url;
    }
  });

  return () => {
    vi.stubGlobal('Worker', previousWorker);
    vi.stubGlobal('URL', previousURL);
    vi.stubGlobal('Blob', previousBlob);
    FakeWorker.instances = [];
    FakeWorker.throwOnCreate = false;
  };
}

function fakeApi() {
  return {
    refreshCount: 0,
    getZr() {
      return {
        refresh: () => {
          this.refreshCount += 1;
        }
      };
    }
  };
}

function fakeZrender() {
  return {
    handlers: {},
    offCalls: [],
    on(name, handler) {
      this.handlers[name] = handler;
    },
    off(name, handler) {
      this.offCalls.push([name, handler]);
    }
  };
}
