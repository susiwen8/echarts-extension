import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'vitest';

import { loadDemoNamespace } from './demo-runner-test-utils.ts';

test('shared examples can delete one data item after add-data', () => {
  const namespace = loadDemoNamespace();
  const missingDelete = [];
  const nonDecreasing = [];

  for (const exampleName of Object.keys(namespace.registry)) {
    const data = namespace.cloneExampleData(namespace.data);
    const addState = namespace.createAddDataState(exampleName);
    const deleteState = namespace.createDeleteDataState(exampleName);

    namespace.addExampleData(exampleName, data, addState);
    const afterAddCount = namespace.countExampleDataItems(exampleName, data);
    const result = namespace.deleteExampleData(exampleName, data, deleteState);
    const afterDeleteCount = namespace.countExampleDataItems(exampleName, data);

    if (!result?.deleted) missingDelete.push(exampleName);
    if (afterDeleteCount >= afterAddCount) nonDecreasing.push(exampleName);

    const option = namespace.createDemoOption(exampleName, data, {}, {
      deleteDataKey: deleteState.count
    });
    assert.ok(option?.series, `${exampleName} should still create an option after deleting data`);
  }

  assert.deepEqual(missingDelete, []);
  assert.deepEqual(nonDecreasing, []);
});

test('fisheye example exposes form controls and scatter data options', () => {
  const namespace = loadDemoNamespace();
  const entry = namespace.registry.fisheye;
  assert.ok(entry);

  const data = namespace.cloneExampleData(namespace.data);
  const controlIds = entry.controls.map((control) => control.id);
  assert.ok(controlIds.includes('fisheyeRadius'));
  assert.ok(controlIds.includes('fisheyeScale'));
  assert.ok(controlIds.includes('dotScale'));
  assert.ok(controlIds.includes('legendShow'));

  const state = namespace.createControlState(entry.controls);
  state.fisheyeRadius = 260;
  state.dotScale = 0.5;
  state.legendShow = false;

  const option = namespace.createDemoOption('fisheye', data, state);
  assert.equal(option.fisheye.radius, 260);
  assert.equal(option.legend.show, false);
  assert.equal(option.series.length, 3);
  assert.ok(option.series.every((series) => series.type === 'scatter'));
  assert.ok(option.series.every((series) => series.data.length > 0));
  assert.ok(option.series[0].data[0].symbolSize > 0);
});

test('arc example exposes a horizontal and vertical layout switch', () => {
  const namespace = loadDemoNamespace();
  const entry = namespace.registry.arc;
  assert.ok(entry);

  const controlIds = entry.controls.map((control) => control.id);
  assert.ok(controlIds.includes('layoutOrient'));

  const data = namespace.cloneExampleData(namespace.data);
  const state = namespace.createControlState(entry.controls);
  assert.equal(state.layoutOrient, 'vertical');

  let option = namespace.createDemoOption('arc', data, state);
  assert.equal(option.series[0].layout.orient, 'vertical');

  state.layoutOrient = 'horizontal';
  option = namespace.createDemoOption('arc', data, state);
  assert.equal(option.series[0].layout.orient, 'horizontal');
});

test('graph examples expose a draggable control', () => {
  const namespace = loadDemoNamespace();
  const data = namespace.cloneExampleData(namespace.data);

  for (const exampleName of ['radial', 'concentric', 'grid', 'mds', 'arc']) {
    const entry = namespace.registry[exampleName];
    assert.ok(entry, `${exampleName} example should exist`);

    const control = entry.controls.find((item) => item.id === 'draggable');
    assert.ok(control, `${exampleName} should expose draggable control`);
    assert.equal(control.type, 'checkbox');
    assert.deepEqual(Array.from(control.targets), ['series.0.draggable']);
    assert.equal(control.defaultValue, true);

    const state = namespace.createControlState(entry.controls);
    let option = namespace.createDemoOption(exampleName, data, state);
    assert.equal(option.series[0].draggable, true, `${exampleName} draggable defaults on`);

    state.draggable = false;
    option = namespace.createDemoOption(exampleName, data, state);
    assert.equal(option.series[0].draggable, false, `${exampleName} draggable can be disabled`);
  }
});

test('examples do not expose hand-drawn controls or options', () => {
  const namespace = loadDemoNamespace();
  const data = namespace.cloneExampleData(namespace.data);

  for (const exampleName of Object.keys(namespace.registry)) {
    const entry = namespace.registry[exampleName];
    const control = entry.controls.find((item) => item.id === 'handDrawn');
    assert.equal(control, undefined, `${exampleName} should not expose hand-drawn control`);

    const state = namespace.createControlState(entry.controls);
    const option = namespace.createDemoOption(exampleName, data, state);
    const seriesList = Array.isArray(option.series) ? option.series : [option.series].filter(Boolean);
    assert.ok(seriesList.length > 0, `${exampleName} should render at least one series`);
    assert.ok(seriesList.every((series) => !Object.prototype.hasOwnProperty.call(series, 'handDrawn')), `${exampleName} should not write handDrawn options`);
  }
});

test('shared examples can delete an existing data item before add-data', () => {
  const namespace = loadDemoNamespace();
  const missingDelete = [];
  const nonDecreasing = [];

  for (const exampleName of Object.keys(namespace.registry)) {
    const data = namespace.cloneExampleData(namespace.data);
    const deleteState = namespace.createDeleteDataState(exampleName);
    const beforeCount = namespace.countExampleDataItems(exampleName, data);
    const result = namespace.deleteExampleData(exampleName, data, deleteState);
    const afterCount = namespace.countExampleDataItems(exampleName, data);

    if (!result?.deleted) missingDelete.push(exampleName);
    if (afterCount >= beforeCount) nonDecreasing.push(exampleName);
  }

  assert.deepEqual(missingDelete, []);
  assert.deepEqual(nonDecreasing, []);
});

test('evolution-fluid repeated deletes preserve baseline entities while reducing items', () => {
  const namespace = loadDemoNamespace();
  const data = namespace.cloneExampleData(namespace.data);
  const deleteState = namespace.createDeleteDataState('evolution-fluid');
  const beforeCount = namespace.countExampleDataItems('evolution-fluid', data);

  for (let index = 0; index < 4; index += 1) {
    const result = namespace.deleteExampleData('evolution-fluid', data, deleteState);
    assert.equal(result.deleted, true);
  }

  const remainingEntityIds = data.evolutionFluid.entities.map((entity) => entity.id);

  assert.ok(namespace.countExampleDataItems('evolution-fluid', data) < beforeCount);
  assert.ok(remainingEntityIds.includes('cao-wei'));
  assert.ok(remainingEntityIds.includes('sun-wu'));
  assert.ok(remainingEntityIds.includes('sima-jin'));
});

test('evolution-fluid time control exposes playback metadata', () => {
  const namespace = loadDemoNamespace();
  const entry = namespace.registry['evolution-fluid'];
  assert.ok(entry);

  const timeControl = entry.controls.find((control) => control.id === 'currentTime');

  assert.ok(timeControl);
  assert.equal(timeControl.type, 'range');
  assert.equal(timeControl.playback, true);
  assert.equal(timeControl.defaultValue, 180);
  assert.equal(timeControl.min, 180);
  assert.equal(timeControl.max, 280);
  assert.equal(timeControl.step, 0.01);
  assert.equal(timeControl.playbackAutoplay, false);
});

test('algorithm-sort step control autoplays through sorting frames', () => {
  const namespace = loadDemoNamespace();
  const entry = namespace.registry['algorithm-sort'];
  const data = namespace.cloneExampleData(namespace.data);
  assert.ok(entry);

  const stepControl = entry.controls.find((control) => control.id === 'currentStep');
  const option = namespace.createDemoOption('algorithm-sort', data, namespace.createControlState(entry.controls));

  assert.ok(stepControl);
  assert.equal(stepControl.type, 'range');
  assert.equal(stepControl.playback, true);
  assert.equal(stepControl.defaultValue, 0);
  assert.equal(stepControl.min, 0);
  assert.equal(stepControl.max, 220);
  assert.equal(stepControl.step, 0.01);
  assert.equal(stepControl.playbackAutoplay, true);
  assert.equal(stepControl.playbackLoop, true);
  assert.equal(option.series[0].id, 'algorithm-sort-bars');
});

test('algorithm-shortest-path step control autoplays through graph search frames', () => {
  const namespace = loadDemoNamespace();
  const entry = namespace.registry['algorithm-shortest-path'];
  const data = namespace.cloneExampleData(namespace.data);
  assert.ok(entry);

  const stepControl = entry.controls.find((control) => control.id === 'currentStep');
  const state = namespace.createControlState(entry.controls);
  const option = namespace.createDemoOption('algorithm-shortest-path', data, state);

  assert.ok(stepControl);
  assert.equal(stepControl.type, 'range');
  assert.equal(stepControl.playback, true);
  assert.equal(stepControl.defaultValue, 0);
  assert.equal(stepControl.min, 0);
  assert.equal(stepControl.max, 180);
  assert.equal(stepControl.step, 0.01);
  assert.equal(stepControl.playbackAutoplay, true);
  assert.equal(stepControl.playbackLoop, true);
  assert.equal(option.series[0].id, 'algorithm-shortest-path-graph');
  assert.equal(option.series[0].type, 'algorithmShortestPath');
  assert.ok(option.series[0].nodes.length >= 10);
  assert.ok(option.series[0].edges.length >= 12);
});


test('circle-packing demo uses the company incubation fluid playback dataset', () => {
  const namespace = loadDemoNamespace();
  const data = namespace.cloneExampleData(namespace.data);
  const entry = namespace.registry['circle-packing'];
  const state = namespace.createControlState(entry.controls);
  const option = namespace.createDemoOption('circle-packing', data, state);
  const stepControl = entry.controls.find((control) => control.id === 'currentTime');

  assert.ok(stepControl);
  assert.equal(stepControl.type, 'range');
  assert.equal(stepControl.playback, true);
  assert.equal(stepControl.defaultValue, 0.5);
  assert.equal(stepControl.min, 0);
  assert.equal(stepControl.max, 8);
  assert.equal(option.series[0].data.id, 'company-incubation-story');
  assert.equal(option.series[0].fluid.enabled, true);
  assert.equal(option.series[0].fluid.currentTime, 0.5);
  assert.ok(option.series[0].fluid.events.some((event) => event.id === 'a-reacquires-b'));
});

test('evolution-fluid uses timeline nodes to play one event window', () => {
  const namespace = loadDemoNamespace();
  const data = namespace.cloneExampleData(namespace.data);
  const entry = namespace.registry['evolution-fluid'];
  const state = namespace.createControlState(entry.controls);
  const option = namespace.createDemoOption('evolution-fluid', data, state);
  const range = namespace.resolveEvolutionFluidEventPlaybackRange(data.evolutionFluid.events, 214, {
    min: 184,
    max: 280
  });

  assert.equal(option.series[0].timeline.show, true);
  assert.equal(option.series[0].categoryField, 'region');
  assert.equal(range.start, 211.54);
  assert.equal(range.end, 214);
});

test('evolution-fluid demo data uses late-Han-to-Jin historical events', () => {
  const namespace = loadDemoNamespace();
  const data = namespace.cloneExampleData(namespace.data);
  const eventIds = data.evolutionFluid.events.map((event) => event.id);
  const earlySplits = data.evolutionFluid.events.filter((event) => (
    event.type === 'spinOff' &&
    Number(event.time) < 190 &&
    event.sources?.includes('han-court')
  ));

  assert.ok(data.evolutionFluid.historicalSources.length >= 4);
  assert.ok(data.evolutionFluid.entities.some((entity) => entity.name === '东汉王朝'));
  assert.ok(data.evolutionFluid.entities.some((entity) => entity.name === '曹操/曹魏'));
  assert.ok(data.evolutionFluid.entities.some((entity) => entity.name === '司马氏/西晋'));
  assert.ok(earlySplits.length >= 8);
  assert.ok(eventIds.includes('han-yellow-turbans-184'));
  assert.ok(eventIds.includes('han-dong-zhuo-189'));
  assert.ok(eventIds.includes('liu-liuzhang-214'));
  assert.ok(eventIds.includes('jin-conquers-wu-280'));
});

test('evolution-fluid playback frames render without queued update animation', () => {
  const namespace = loadDemoNamespace();
  const data = namespace.cloneExampleData(namespace.data);
  const entry = namespace.registry['evolution-fluid'];
  const state = namespace.createControlState(entry.controls);
  state.currentTime = 2022.5;

  const option = namespace.createDemoOption('evolution-fluid', data, state, {
    realtimeControlId: 'currentTime'
  });

  assert.equal(option.animationDurationUpdate, 0);
  assert.equal(option.animationEasingUpdate, 'linear');
  assert.equal(option.series[0].animationDurationUpdate, 0);
  assert.equal(option.series[0].animationEasingUpdate, 'linear');
});

test('delete-data controls are exposed by shared, large-data, and layout-core examples', () => {
  const demoRunner = readFileSync(new URL('../docs/shared/demo-runner.js', import.meta.url), 'utf8');
  const largeData = readFileSync(new URL('../docs/shared/large-data.js', import.meta.url), 'utf8');
  const layoutCore = readFileSync(new URL('../docs/shared/layout-core-example.js', import.meta.url), 'utf8');

  assert.match(demoRunner, /删除数据/);
  assert.match(demoRunner, /onDeleteData/);
  assert.match(largeData, /onDeleteData/);
  assert.match(largeData, /deleteDataKey/);
  assert.match(layoutCore, /删除数据/);
  assert.match(layoutCore, /deleteLayoutData/);
});

test('delete-data buttons keep their labels on one line', () => {
  const demoPageCss = readFileSync(new URL('../docs/shared/demo-page.css', import.meta.url), 'utf8');
  const layoutCoreHtml = readFileSync(new URL('../docs/templates/packages/echarts-layout-core/index.tpl', import.meta.url), 'utf8');

  assert.match(demoPageCss, /\.demo-control-button[^{]*\{[^}]*white-space:\s*nowrap/s);
  assert.match(layoutCoreHtml, /\.layout-card__button[^{]*\{[^}]*white-space:\s*nowrap/s);
});

test('demo pages hide long generated header paragraphs', () => {
  const demoPageCss = readFileSync(new URL('../docs/shared/demo-page.css', import.meta.url), 'utf8');

  assert.match(demoPageCss, /body\.demo-page\s+\.demo-header\s+p:not\(\.eyebrow\)[^{]*\{[^}]*display:\s*none/s);
});

test('standalone example pages and layout-core package do not include hand-drawn wiring', () => {
  const fractalHtml = readFileSync(new URL('../docs/templates/packages/echarts-fractal/index.tpl', import.meta.url), 'utf8');
  const sequenceHtml = readFileSync(new URL('../docs/templates/packages/echarts-sequence-diagram/index.tpl', import.meta.url), 'utf8');
  const layoutCorePackage = JSON.parse(readFileSync(new URL('../packages/echarts-layout-core/package.json', import.meta.url), 'utf8'));

  assert.doesNotMatch(fractalHtml, /hand-?drawn|handDrawn/i);
  assert.doesNotMatch(sequenceHtml, /hand-?drawn|handDrawn/i);
  assert.equal(layoutCorePackage.dependencies?.roughjs, undefined);
});
