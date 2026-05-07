import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { test } from 'vitest';
import { runInNewContext } from 'node:vm';

const root = path.resolve(import.meta.dirname, '..');
const packagesDir = path.join(root, 'packages');

const expectedExamples = {
  'echarts-layout-core': ['examples/index.html', 'examples/layout-core-example.js'],
  'echarts-radial': ['examples/index.html', 'examples/large.html'],
  'echarts-concentric': ['examples/index.html', 'examples/large.html'],
  'echarts-grid': ['examples/index.html', 'examples/large.html'],
  'echarts-lollipop': ['examples/index.html', 'examples/large.html'],
  'echarts-mds': ['examples/index.html', 'examples/large.html'],
  'echarts-arc': ['examples/index.html', 'examples/large.html'],
  'echarts-radial-area': ['examples/index.html', 'examples/large.html'],
  'echarts-radial-boxplot': ['examples/index.html', 'examples/large.html'],
  'echarts-venn': ['examples/index.html', 'examples/hollow.html', 'examples/bubble.html', 'examples/large.html'],
  'echarts-pack-bubble': ['examples/index.html', 'examples/large.html'],
  'echarts-circle-packing': ['examples/index.html', 'examples/large.html'],
  'echarts-nested-circle': ['examples/index.html', 'examples/large.html'],
  'echarts-mosaic': ['examples/index.html', 'examples/large.html'],
  'echarts-voronoi-treemap': ['examples/index.html', 'examples/large.html'],
  'echarts-subway': ['examples/index.html', 'examples/large.html'],
  'echarts-flame': ['examples/index.html', 'examples/large.html'],
  'echarts-sunrise-sunset': ['examples/index.html', 'examples/large.html'],
  'echarts-beeswarm': ['examples/index.html', 'examples/large.html'],
  'echarts-spiral': ['examples/index.html', 'examples/large.html'],
  'echarts-vector-field': ['examples/index.html', 'examples/large.html']
};

const visualCaseExamples = {
  'Graph layouts radial': 'packages/echarts-radial/examples/index.html',
  'Graph layouts concentric': 'packages/echarts-concentric/examples/index.html',
  'Graph layouts grid': 'packages/echarts-grid/examples/index.html',
  'Graph layouts mds': 'packages/echarts-mds/examples/index.html',
  'Graph layouts arc': 'packages/echarts-arc/examples/index.html',
  'Radial area': 'packages/echarts-radial-area/examples/index.html',
  'Radial boxplot': 'packages/echarts-radial-boxplot/examples/index.html',
  'Venn hollow': 'packages/echarts-venn/examples/hollow.html',
  'Venn bubble': 'packages/echarts-venn/examples/bubble.html',
  'Pack bubble': 'packages/echarts-pack-bubble/examples/index.html',
  'Circle packing': 'packages/echarts-circle-packing/examples/index.html',
  'Nested circle': 'packages/echarts-nested-circle/examples/index.html',
  'Mosaic': 'packages/echarts-mosaic/examples/index.html',
  'Voronoi treemap': 'packages/echarts-voronoi-treemap/examples/index.html',
  'Subway': 'packages/echarts-subway/examples/index.html',
  'Flame': 'packages/echarts-flame/examples/index.html',
  'Sunrise sunset': 'packages/echarts-sunrise-sunset/examples/index.html',
  'Lollipop': 'packages/echarts-lollipop/examples/index.html',
  'Beeswarm': 'packages/echarts-beeswarm/examples/index.html',
  'Spiral': 'packages/echarts-spiral/examples/index.html',
  'Vector field': 'packages/echarts-vector-field/examples/index.html'
};

test('every workspace package has package examples', () => {
  const packageNames = readdirSync(packagesDir)
    .filter((entry) => {
      const packageDir = path.join(packagesDir, entry);
      return statSync(packageDir).isDirectory() && exists(path.join(packageDir, 'package.json'));
    })
    .sort();

  assert.deepEqual(packageNames, Object.keys(expectedExamples).sort());

  const missing = [];
  for (const [packageName, files] of Object.entries(expectedExamples)) {
    for (const file of files) {
      const filePath = path.join(packagesDir, packageName, file);
      if (!exists(filePath)) missing.push(path.relative(root, filePath));
    }
  }

  assert.deepEqual(missing, []);
});

test('every visual case has a browser example', () => {
  const missing = Object.entries(visualCaseExamples)
    .filter(([, file]) => !exists(path.join(root, file)))
    .map(([name]) => name);

  assert.deepEqual(missing, []);
});

test('example pages reference existing local assets', () => {
  const htmlFiles = collectFiles(path.join(root, 'examples'), '.html')
    .concat(collectFiles(packagesDir, '.html'));
  const missing = [];

  for (const htmlFile of htmlFiles) {
    const content = readFileSync(htmlFile, 'utf8');
    const references = readLocalReferences(content);
    for (const reference of references) {
      const assetPath = path.resolve(path.dirname(htmlFile), reference);
      if (!exists(assetPath)) missing.push(`${path.relative(root, htmlFile)} -> ${reference}`);
    }
  }

  assert.deepEqual(missing, []);
});

test('large data examples are linked from their chart examples', () => {
  const gallery = readFileSync(path.join(root, 'examples/index.html'), 'utf8');
  const missingLargeLinks = [];
  const missingReturnLinks = [];
  const missingRunnerLinks = [];

  assert.doesNotMatch(gallery, /Performance/);
  assert.doesNotMatch(gallery, /Large data examples/);
  assert.doesNotMatch(gallery, /\/large\.html/);

  for (const [packageName, files] of Object.entries(expectedExamples)) {
    if (!files.includes('examples/large.html')) continue;

    const packageExamplesDir = path.join(packagesDir, packageName, 'examples');
    if (packageName === 'echarts-venn') {
      for (const fileName of ['hollow.html', 'bubble.html']) {
        const content = readFileSync(path.join(packageExamplesDir, fileName), 'utf8');
        if (!content.includes('href="./large.html"')) {
          missingLargeLinks.push(`${packageName}/examples/${fileName}`);
        }
      }

      const largeContent = readFileSync(path.join(packageExamplesDir, 'large.html'), 'utf8');
      if (!largeContent.includes('href="./hollow.html"')) missingReturnLinks.push(`${packageName}/examples/large.html -> hollow`);
      if (!largeContent.includes('href="./bubble.html"')) missingReturnLinks.push(`${packageName}/examples/large.html -> bubble`);
      if (!largeContent.includes('../../../examples/shared/demo-runner.js')) missingRunnerLinks.push(`${packageName}/examples/large.html`);
      continue;
    }

    const standardContent = readFileSync(path.join(packageExamplesDir, 'index.html'), 'utf8');
    const largeContent = readFileSync(path.join(packageExamplesDir, 'large.html'), 'utf8');
    if (!standardContent.includes('href="./large.html"')) missingLargeLinks.push(`${packageName}/examples/index.html`);
    if (!largeContent.includes('href="./"')) missingReturnLinks.push(`${packageName}/examples/large.html`);
    if (!largeContent.includes('../../../examples/shared/demo-runner.js')) missingRunnerLinks.push(`${packageName}/examples/large.html`);
  }

  assert.deepEqual(missingLargeLinks, []);
  assert.deepEqual(missingReturnLinks, []);
  assert.deepEqual(missingRunnerLinks, []);
});

test('remote data examples reference the requested source URLs', () => {
  const dataScript = readFileSync(path.join(root, 'examples/shared/demo-data.js'), 'utf8');
  const expectedUrls = [
    'https://gw.alipayobjects.com/os/basement_prod/8dacf27e-e1bc-4522-b6d3-4b6d9b9ed7df.json',
    'https://assets.antv.antgroup.com/g6/radial.json',
    'https://assets.antv.antgroup.com/g6/cluster.json',
    'https://raw.githubusercontent.com/antvis/G2/refs/heads/v5/__tests__/data/partition.json',
    'https://assets.antv.antgroup.com/g2/seasonal-weather.json',
    'https://gw.alipayobjects.com/os/antfincdn/F5VcgnqRku/wind.json'
  ];

  const missing = expectedUrls.filter((url) => !dataScript.includes(url));

  assert.deepEqual(missing, []);
});

test('radial area browser example keeps dense time labels hidden', () => {
  const namespace = loadDemoNamespace();
  const option = namespace.registry['radial-area'].option({
    radialArea: Array.from({ length: 365 }, (_, index) => ({
      date: new Date(Date.UTC(2020, 0, index + 1)).toISOString(),
      avg: 50,
      min: 42,
      max: 58,
      minmin: 36,
      maxmax: 64
    }))
  });
  const radialAreaSeries = option.series.filter((series) => series.type === 'radialArea');

  assert.equal(radialAreaSeries.length, 2);
  radialAreaSeries.forEach((series) => {
    assert.equal(series.angleAxis?.show, false);
    assert.equal(series.angleAxis?.label?.show, false);
  });
});

test('radial boxplot browser example falls back when cached demo data is stale', () => {
  const namespace = loadDemoNamespace();
  const option = namespace.registry['radial-boxplot'].option({});
  const series = option.series[0];

  assert.equal(series.type, 'radialBoxplot');
  assert.ok(Array.isArray(series.data));
  assert.ok(series.data.length > 0);
  assert.deepEqual(series.categories, series.data.map((item) => item.name));
});

test('chart examples expose interactive option controls', () => {
  const namespace = loadDemoNamespace();
  const chartExamples = Object.keys(namespace.registry);
  const missingControls = chartExamples.filter((exampleName) => {
    const controls = namespace.registry[exampleName].controls;
    return !Array.isArray(controls) || controls.length === 0;
  });

  assert.deepEqual(missingControls, []);
  assert.equal(typeof namespace.createControlState, 'function');
  assert.equal(typeof namespace.createDemoOption, 'function');
  assert.equal(typeof namespace.applyControlValues, 'function');
});

test('large data examples expose per-chart million-row performance options', () => {
  const namespace = loadLargeDataNamespace();
  const caseNames = Object.keys(namespace.cases).sort();

  assert.deepEqual(caseNames, [
    'arc',
    'beeswarm',
    'circle-packing',
    'concentric',
    'flame',
    'grid',
    'lollipop',
    'mds',
    'mosaic',
    'nested-circle',
    'pack-bubble',
    'radial',
    'radial-area',
    'radial-boxplot',
    'spiral',
    'subway',
    'sunrise-sunset',
    'vector-field',
    'venn',
    'voronoi-treemap'
  ]);

  for (const caseName of caseNames) {
    const definition = namespace.cases[caseName];
    const prepared = namespace.createLargeOption(caseName, 1000);

    assert.equal(definition.maxCount, namespace.ONE_MILLION);
    assert.ok(prepared.payload.rawCount >= 1, `${caseName} should report raw data count`);
    assert.ok(prepared.payload.renderCount >= 1, `${caseName} should report render data count`);
    assert.ok(Array.isArray(prepared.option.series), `${caseName} should create series options`);
    assert.equal(prepared.option.animation, false);
    assert.equal(prepared.option.tooltip.trigger, 'item');
    assert.equal(prepared.option.tooltip.confine, true);
    prepared.option.series.forEach((seriesOption) => {
      assert.equal(seriesOption.silent, false, `${caseName} should keep large-data interactions enabled`);
      assert.equal(seriesOption.large, true, `${caseName} should enable large-data render shortcuts`);
    });
    assert.equal(prepared.option.largeDataPerf.rawCount, prepared.payload.rawCount);
    assert.equal(prepared.option.largeDataPerf.renderCount, prepared.payload.renderCount);
    assert.equal(prepared.option.largeDataPerf.sampleMode, prepared.payload.sampleMode);
  }
});

test('large data performance helper records whether a run is initial or update', () => {
  const source = readFileSync(path.join(root, 'examples/shared/large-data.js'), 'utf8');

  assert.match(source, /state\.runId === 0 \? 'initial' : 'update'/);
  assert.match(source, /phase,/);
});

test('large data examples cap expensive render counts while preserving raw-count metadata', () => {
  const namespace = loadLargeDataNamespace();
  const sampled = namespace.createLargeOption('mds', namespace.ONE_MILLION);
  const aggregated = namespace.createLargeOption('mosaic', namespace.ONE_MILLION);
  const packBubble = namespace.createLargeOption('pack-bubble', namespace.ONE_MILLION);
  const radialArea = namespace.createLargeOption('radial-area', namespace.ONE_MILLION);
  const subway = namespace.createLargeOption('subway', namespace.ONE_MILLION);

  assert.equal(sampled.payload.rawCount, namespace.ONE_MILLION);
  assert.ok(sampled.payload.renderCount < sampled.payload.rawCount);
  assert.equal(aggregated.payload.rawCount, namespace.ONE_MILLION);
  assert.ok(aggregated.payload.renderCount < aggregated.payload.rawCount);
  assert.equal(packBubble.option.series[0].layout.fast, true);
  assert.ok(radialArea.payload.renderCount <= 10000);
  assert.ok(subway.payload.renderCount <= 5100);
});

test('large data examples progressively fill detail as users zoom in', () => {
  const namespace = loadLargeDataNamespace();
  const trend = namespace.createLargeOption('radial-area', namespace.ONE_MILLION);
  const detail = namespace.createLargeOption('radial-area', namespace.ONE_MILLION, 0, {
    zoomScale: 3.4
  });
  const lollipopTrend = namespace.createLargeOption('lollipop', namespace.ONE_MILLION);

  assert.equal(namespace.detailLevelForScale(1), 0);
  assert.equal(namespace.detailLevelForScale(1.4), 1);
  assert.equal(namespace.detailLevelForScale(2.2), 2);
  assert.equal(namespace.detailLevelForScale(3.4), 3);
  assert.equal(trend.payload.sampleMode, 'trend');
  assert.equal(trend.payload.detailLevel, 0);
  assert.ok(trend.payload.renderCount < trend.definition.renderLimit);
  assert.equal(detail.payload.sampleMode, 'detail');
  assert.equal(detail.payload.detailLevel, 3);
  assert.equal(detail.payload.renderCount, detail.definition.renderLimit);
  assert.equal(detail.option.largeDataPerf.zoomScale, 3.4);
  assert.ok(lollipopTrend.option.series[0].data.at(-1).country.includes('Item 999'));
});

test('large data optimization follows ECharts-style large and largeThreshold controls', () => {
  const namespace = loadLargeDataNamespace({ withDemoRunner: true });
  const optimized = namespace.createLargeOption('lollipop', 12000);
  const controls = namespace.createLargeControls('lollipop', optimized.option);
  const controlState = namespace.createLargeControlState(controls);

  assert.equal(optimized.payload.large, true);
  assert.equal(optimized.payload.largeThreshold, 10000);
  assert.equal(optimized.payload.optimized, true);
  assert.equal(optimized.option.largeDataPerf.large, true);
  assert.equal(optimized.option.largeDataPerf.largeThreshold, 10000);
  assert.equal(optimized.option.largeDataPerf.optimized, true);
  assert.equal(optimized.option.series[0].large, true);
  assert.equal(optimized.option.series[0].largeThreshold, 10000);
  assert.equal(controls.slice(0, 2).map((control) => control.id).join(','), 'large,largeThreshold');
  assert.equal(controlState.large, true);
  assert.equal(controlState.largeThreshold, 10000);

  const disabled = namespace.createLargeOption('lollipop', 12000, 0, {
    controls,
    controlValues: {
      ...controlState,
      large: false
    }
  });
  const underThreshold = namespace.createLargeOption('lollipop', 12000, 0, {
    controls,
    controlValues: {
      ...controlState,
      largeThreshold: 20000
    }
  });

  assert.equal(disabled.payload.large, false);
  assert.equal(disabled.payload.optimized, false);
  assert.equal(disabled.payload.sampleMode, 'detail');
  assert.equal(disabled.payload.renderCount, 12000);
  assert.equal(disabled.option.series[0].large, false);
  assert.equal(disabled.option.largeDataPerf.optimized, false);
  assert.equal(underThreshold.payload.large, true);
  assert.equal(underThreshold.payload.optimized, false);
  assert.equal(underThreshold.payload.renderCount, 12000);
  assert.equal(underThreshold.option.series[0].large, true);
  assert.equal(underThreshold.option.series[0].largeThreshold, 20000);
});

test('large data sampling prioritizes the zoomed viewport without losing trend anchors', () => {
  const namespace = loadLargeDataNamespace();
  const focused = namespace.createLargeOption('lollipop', namespace.ONE_MILLION, 0, {
    zoomScale: 2.4,
    viewport: {
      x: -360,
      y: 0,
      scale: 2.4,
      width: 1200,
      height: 760
    }
  });

  const window = focused.payload.sampleWindow;
  const rawIndexes = focused.option.series[0].data.map((item) => Number(item.country.replace('Item ', '')));
  const focusedCount = rawIndexes.filter((index) => index >= window.startIndex && index <= window.endIndex).length;

  assert.equal(focused.payload.detailLevel, 2);
  assert.equal(focused.payload.sampleMode, 'trend');
  assert.ok(window.startIndex > 0);
  assert.ok(window.endIndex < namespace.ONE_MILLION - 1);
  assert.ok(focusedCount / rawIndexes.length > 0.6);
  assert.ok(rawIndexes.includes(0));
  assert.ok(rawIndexes.includes(namespace.ONE_MILLION - 1));
  assert.equal(namespace.shouldRefreshDetailForViewport('pan', 2), true);
  assert.equal(namespace.shouldRefreshDetailForViewport('zoom', 2), true);
  assert.equal(namespace.shouldRefreshDetailForViewport('pan', 0), false);
});

test('large data examples reuse standard option controls with large-data defaults', () => {
  const namespace = loadLargeDataNamespace({ withDemoRunner: true });
  const prepared = namespace.createLargeOption('grid', 1000);
  const controls = namespace.createLargeControls('grid', prepared.option);
  const controlState = namespace.createLargeControlState(controls);
  const updated = namespace.createLargeOption('grid', 1000, 0, {
    controls,
    controlValues: {
      ...controlState,
      labelShow: true,
      layoutCols: 24
    }
  });

  assert.ok(controls.some((control) => control.id === 'layoutCols'));
  assert.ok(controls.some((control) => control.id === 'labelShow'));
  assert.equal(controlState.layoutCols, prepared.option.series[0].layout.cols);
  assert.equal(controlState.labelShow, false);
  assert.equal(updated.option.series[0].layout.cols, 24);
  assert.equal(updated.option.series[0].label.show, true);
});

test('chart examples expose shared zoom hover and click helpers', () => {
  const namespace = loadDemoNamespace();
  assert.equal(typeof namespace.createViewportState, 'function');
  assert.equal(typeof namespace.zoomViewport, 'function');
  assert.equal(typeof namespace.panViewport, 'function');
  assert.equal(typeof namespace.resetViewport, 'function');
  assert.equal(typeof namespace.formatInteractionEvent, 'function');
  assert.equal(typeof namespace.formatZrInteractionEvent, 'function');

  const viewport = namespace.createViewportState();
  namespace.zoomViewport(viewport, 1, 100, 50);
  assert.equal(Number(viewport.scale.toFixed(2)), 1.12);
  assert.equal(Number(viewport.x.toFixed(2)), -12);
  assert.equal(Number(viewport.y.toFixed(2)), -6);

  namespace.panViewport(viewport, 18, -8);
  assert.equal(Number(viewport.x.toFixed(2)), 6);
  assert.equal(Number(viewport.y.toFixed(2)), -14);

  namespace.resetViewport(viewport);
  assert.equal(viewport.x, 0);
  assert.equal(viewport.y, 0);
  assert.equal(viewport.scale, 1);

  const eventText = namespace.formatInteractionEvent('click', {
    seriesType: 'mosaic',
    seriesName: 'Acquisition Cohorts',
    name: 'Paid / New',
    dataIndex: 2,
    value: 42
  }, new Date(2026, 4, 6, 9, 8, 7));
  assert.match(eventText, /Click 09:08:07/);
  assert.match(eventText, /mosaic/);
  assert.match(eventText, /Paid \/ New/);
  assert.match(eventText, /#2/);

  const zrEventText = namespace.formatZrInteractionEvent('hover', {
    type: 'tspan',
    parent: {
      __aliveRenderKey: 'node-label:root'
    }
  }, new Date(2026, 4, 6, 9, 8, 7));
  assert.match(zrEventText, /Hover/);
  assert.match(zrEventText, /tspan/);
  assert.match(zrEventText, /node-label:root/);
});

test('chart demo options include hover emphasis defaults', () => {
  const namespace = loadDemoNamespace();
  const missingInteractionDefaults = [];

  for (const exampleName of Object.keys(namespace.registry)) {
    const option = namespace.createDemoOption(exampleName, namespace.data, {});
    if (!option.tooltip) missingInteractionDefaults.push(`${exampleName}:tooltip`);
    const series = Array.isArray(option.series) ? option.series : [option.series].filter(Boolean);
    series.forEach((seriesOption, seriesIndex) => {
      if (!seriesOption.emphasis?.itemStyle) {
        missingInteractionDefaults.push(`${exampleName}:series.${seriesIndex}.emphasis`);
      }
    });
  }

  assert.deepEqual(missingInteractionDefaults, []);
});

test('interactive controls update demo options before render', () => {
  const namespace = loadDemoNamespace();
  const graphOption = namespace.createDemoOption('radial', {
    graph: {
      data: [{ id: 'root', value: 10 }, { id: 'leaf', value: 2 }],
      links: [{ source: 'root', target: 'leaf' }]
    }
  }, {
    symbolSize: 32,
    labelShow: false,
    fisheyeShow: false,
    fisheyeRadius: 180,
    fisheyeScale: 2.8,
    layoutUnitRadius: 96,
    enterDuration: 480
  });
  const mosaicOption = namespace.createDemoOption('mosaic', {
    mosaic: [
      { channel: 'Organic', stage: 'New', users: 42 },
      { channel: 'Paid', stage: 'Returning', users: 18 }
    ]
  }, {
    tileGap: 8,
    labelShow: false,
    itemOpacity: 0.52
  });

  assert.equal(graphOption.series[0].symbolSize, undefined);
  assert.equal(graphOption.series[0].layout.nodeSize, undefined);
  assert.equal(graphOption.series[0].label.show, false);
  assert.equal(graphOption.series[0].fisheye.show, false);
  assert.equal(graphOption.series[0].fisheye.radius, 180);
  assert.equal(graphOption.series[0].fisheye.scale, 2.8);
  assert.equal(graphOption.series[0].layout.unitRadius, 96);
  assert.equal(graphOption.series[0].enterAnimation.duration, 480);
  assert.equal(namespace.createDemoOption('arc', namespace.data, {}).series[0].fisheye.preview, true);
  assert.equal(mosaicOption.series[0].gap, 8);
  assert.equal(mosaicOption.series[0].label.show, false);
  assert.equal(mosaicOption.series[0].itemStyle.opacity, 0.52);
});

test('graph example fisheye controls default to disabled', () => {
  const namespace = loadDemoNamespace();
  const graphExamples = ['radial', 'concentric', 'grid', 'mds', 'arc'];

  graphExamples.forEach((exampleName) => {
    const entry = namespace.registry[exampleName];
    const controlState = namespace.createControlState(entry.controls);
    const option = namespace.createDemoOption(exampleName, namespace.data, controlState);

    assert.equal(controlState.fisheyeShow, false);
    assert.equal(option.series[0].fisheye.show, false);
  });
});

test('demo control renders update charts without clearing instances', () => {
  const runnerSource = readFileSync(path.join(root, 'examples/shared/demo-runner.js'), 'utf8');

  assert.doesNotMatch(runnerSource, /chart\.clear\(\)/);
  assert.doesNotMatch(runnerSource, /setOption\(option,\s*true\)/);
  assert.match(runnerSource, /setOption\(option,\s*\{\s*notMerge:\s*false/);
});

test('sunrise sunset icon controls update the demo option', () => {
  const namespace = loadDemoNamespace();
  const option = namespace.createDemoOption('sunrise-sunset', {}, {
    sunIcon: JSON.stringify({
      path: 'M -8 -8 L 8 -8 L 0 9 Z',
      size: 30,
      style: { fill: '#f97316' }
    }),
    moonIcon: JSON.stringify(false)
  });

  assert.equal(option.series[0].sunIcon.path, 'M -8 -8 L 8 -8 L 0 9 Z');
  assert.equal(option.series[0].sunIcon.size, 30);
  assert.equal(option.series[0].sunIcon.style.fill, '#f97316');
  assert.equal(option.series[0].moonIcon, false);
});

test('sunrise sunset background control updates the painted panel background', () => {
  const namespace = loadDemoNamespace();
  const option = namespace.createDemoOption('sunrise-sunset', {}, {
    backgroundColor: '#123456'
  });

  assert.equal(option.backgroundColor, '#123456');
  assert.equal(option.series[0].backgroundStyle.color, '#123456');
});

test('sunrise sunset style controls update lines and day area', () => {
  const namespace = loadDemoNamespace();
  const option = namespace.createDemoOption('sunrise-sunset', {}, {
    dayLineColor: '#f97316',
    moonLineColor: '#60a5fa',
    dayAreaColor: '#fde68a',
    dayAreaOpacity: 0.36
  });

  assert.equal(option.series[0].dayLineStyle.color, '#f97316');
  assert.equal(option.series[0].moonLineStyle.color, '#60a5fa');
  assert.equal(option.series[0].dayAreaStyle.color, '#fde68a');
  assert.equal(option.series[0].dayAreaStyle.opacity, 0.36);
});

test('sunrise sunset time slider updates current time and countdown text', () => {
  const namespace = loadDemoNamespace();
  const option = namespace.createDemoOption('sunrise-sunset', {}, {
    timeOfDay: 16 * 60 + 30
  });

  assert.equal(option.series[0].currentTime, '2026-05-05 16:30:00');
  assert.equal(option.series[0].updatedAt, '2026-05-05 16:30:00');
  assert.equal(option.series[0].updatedText, 'Updated 16:30');
  assert.equal(option.series[0].remainingText, '02:09:00');
  assert.equal(option.series[0].title, 'Until sunset');
});

test('sunrise sunset time slider updates do not replay enter animation', () => {
  const namespace = loadDemoNamespace();
  const replayOption = namespace.createDemoOption('sunrise-sunset', {}, {
    timeOfDay: 16 * 60 + 30
  });
  const dragOption = namespace.createDemoOption('sunrise-sunset', {}, {
    timeOfDay: 16 * 60 + 30
  }, {
    interactionControlId: 'timeOfDay'
  });

  assert.equal(typeof replayOption.series[0].enterAnimation, 'object');
  assert.equal(dragOption.series[0].enterAnimation, false);
});

test('layout core svg example wires zoom hover and click interactions', () => {
  const script = readFileSync(path.join(root, 'packages/echarts-layout-core/examples/layout-core-example.js'), 'utf8');

  assert.match(script, /attachLayoutInteractions/);
  assert.match(script, /addEventListener\('wheel'/);
  assert.match(script, /addEventListener\('click'/);
  assert.match(script, /layout-node/);
  assert.match(script, /layout-card__event/);
});

function readLocalReferences(content) {
  const references = [];
  const pattern = /\b(?:href|src)=["']([^"']+)["']/g;
  let match;
  while ((match = pattern.exec(content))) {
    const value = match[1];
    if (
      value.startsWith('http:') ||
      value.startsWith('https:') ||
      value.startsWith('#') ||
      value.startsWith('data:') ||
      value.startsWith('mailto:') ||
      value.startsWith('tel:') ||
      value.startsWith('javascript:') ||
      value.includes('://')
    ) {
      continue;
    }
    references.push(value.split(/[?#]/)[0]);
  }
  return references;
}

function collectFiles(dir, extension) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const filePath = path.join(dir, entry);
    const stat = statSync(filePath);
    if (stat.isDirectory()) {
      files.push(...collectFiles(filePath, extension));
    } else if (filePath.endsWith(extension)) {
      files.push(filePath);
    }
  }
  return files;
}

function exists(filePath) {
  try {
    statSync(filePath);
    return true;
  } catch {
    return false;
  }
}

function loadDemoNamespace() {
  const window = {};
  const document = {
    addEventListener() {}
  };
  window.window = window;
  window.document = document;

  const context = {
    window,
    document,
    console,
    fetch: async () => {
      throw new Error('network should not be used while reading demo options');
    }
  };

  runInNewContext(readFileSync(path.join(root, 'examples/shared/demo-data.js'), 'utf8'), context);
  runInNewContext(readFileSync(path.join(root, 'examples/shared/demo-runner.js'), 'utf8'), context);

  return window.EChartsExtensionExamples;
}

function loadLargeDataNamespace(options = {}) {
  const window = {
    performance: {
      now: () => Date.now()
    },
    document: {
      addEventListener() {}
    }
  };
  window.window = window;

  const context = {
    window,
    document: window.document,
    console,
    Date,
    Math,
    URLSearchParams
  };

  if (options.withDemoRunner) {
    runInNewContext(readFileSync(path.join(root, 'examples/shared/demo-runner.js'), 'utf8'), context);
  }
  runInNewContext(readFileSync(path.join(root, 'examples/shared/large-data.js'), 'utf8'), context);

  return window.EChartsExtensionLargeData;
}
