import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { test } from 'vitest';

function loadDemoNamespace() {
  const window = {};
  const document = { addEventListener() {} };
  runInNewContext(readFileSync(new URL('../docs/shared/demo-data.js', import.meta.url), 'utf8'), { window });
  runInNewContext(readFileSync(new URL('../docs/shared/demo-runner.js', import.meta.url), 'utf8'), { window, document });
  return window.EChartsExtensionExamples;
}

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
