import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { test } from 'vitest';

import {
  layoutOrganizationChart,
  resolveOrganizationChartLayout
} from '../src/layout.ts';

const company = {
  name: 'CEO',
  children: [
    {
      name: 'Product',
      children: [
        { name: 'Design' },
        { name: 'Research' }
      ]
    },
    {
      name: 'Engineering',
      children: [
        { name: 'Frontend' },
        { name: 'Platform' }
      ]
    }
  ]
};

function loadDemoNamespace() {
  const window = {};
  const document = { addEventListener() {} };
  runInNewContext(readFileSync(new URL('../../../docs/shared/demo-data.js', import.meta.url), 'utf8'), { window });
  runInNewContext(readFileSync(new URL('../../../docs/shared/demo-runner.js', import.meta.url), 'utf8'), { window, document });
  return window.EChartsExtensionExamples;
}

test('does not depend on external layout packages', () => {
  const packageJson = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8')
  );

  assert.equal(packageJson.dependencies?.['@antv/layout'], undefined);
  assert.equal(packageJson.dependencies?.d3, undefined);
});

test('demo runner appends organization chart nodes from the add data control', () => {
  const namespace = loadDemoNamespace();
  const data = namespace.cloneExampleData(namespace.data);
  const state = namespace.createAddDataState('organization-chart');

  const beforeCount = namespace.countExampleDataItems('organization-chart', data);
  const firstOption = namespace.createDemoOption('organization-chart', data, {});
  const result = namespace.addExampleData('organization-chart', data, state);
  const afterCount = namespace.countExampleDataItems('organization-chart', data);
  const updatedOption = namespace.createDemoOption('organization-chart', data, {}, result);
  const addedNode = findTreeNode(data.organizationChart, 'added-organization-chart-1');

  assert.equal(firstOption.series[0].type, 'organizationChart');
  assert.equal(firstOption.series[0].data, data.organizationChart);
  assert.equal(result.added, true);
  assert.equal(result.count, 1);
  assert.equal(afterCount, beforeCount + 1);
  assert.equal(addedNode?.name, 'Added 1');
  assert.equal(updatedOption.series[0].data, data.organizationChart);
});

function findTreeNode(node, id) {
  if (!node || typeof node !== 'object') return null;
  if (node.id === id) return node;
  if (!Array.isArray(node.children)) return null;
  for (const child of node.children) {
    const match = findTreeNode(child, id);
    if (match) return match;
  }
  return null;
}

test('computes deterministic top-down organization chart layout', () => {
  const first = layoutOrganizationChart(company, {
    width: 720,
    height: 420,
    padding: 20,
    nodeWidth: 120,
    nodeHeight: 44,
    levelGap: 72,
    siblingGap: 24,
    subtreeGap: 36,
    orient: 'TB'
  });
  const second = layoutOrganizationChart(company, {
    width: 720,
    height: 420,
    padding: 20,
    nodeWidth: 120,
    nodeHeight: 44,
    levelGap: 72,
    siblingGap: 24,
    subtreeGap: 36,
    orient: 'TB'
  });

  assert.deepEqual(first, second);
  assert.equal(first.nodes.length, 7);
  assert.equal(first.links.length, 6);
  assert.equal(first.rootIds[0], 'CEO');

  const ceo = first.nodes.find((node) => node.name === 'CEO');
  const product = first.nodes.find((node) => node.name === 'Product');
  const engineering = first.nodes.find((node) => node.name === 'Engineering');
  const design = first.nodes.find((node) => node.name === 'Design');
  const research = first.nodes.find((node) => node.name === 'Research');

  assert.equal(Math.round(ceo.x), 300);
  assert.equal(Math.round(ceo.y), 20);
  assert.equal(Math.round(product.y), 136);
  assert.equal(Math.round(engineering.y), 136);
  assert.equal(Math.round(design.y), 252);
  assert.equal(Math.round(research.x - design.x), 144);
  assert.ok(product.x < ceo.x, 'left branch sits before root center');
  assert.ok(engineering.x > ceo.x, 'right branch sits after root center');

  first.nodes.forEach((node) => {
    assert.ok(node.x >= 20, `${node.name} left bound`);
    assert.ok(node.x + node.width <= 700.000001, `${node.name} right bound`);
    assert.ok(node.y >= 20, `${node.name} top bound`);
    assert.ok(node.y + node.height <= 400.000001, `${node.name} bottom bound`);
  });
});

test('supports flat parentId data and left-to-right orientation', () => {
  const result = resolveOrganizationChartLayout({
    data: [
      { id: 'ceo', name: 'CEO' },
      { id: 'ops', parentId: 'ceo', name: 'Operations' },
      { id: 'finance', parentId: 'ceo', name: 'Finance' },
      { id: 'payroll', parentId: 'finance', name: 'Payroll' }
    ],
    width: 520,
    height: 360,
    padding: { top: 24, right: 30, bottom: 24, left: 30 },
    nodeWidth: 112,
    nodeHeight: 42,
    levelGap: 68,
    siblingGap: 22,
    subtreeGap: 30,
    orient: 'LR'
  });

  assert.deepEqual(result.rootIds, ['ceo']);
  assert.deepEqual(result.nodes.map((node) => node.id), ['ceo', 'ops', 'finance', 'payroll']);
  assert.deepEqual(result.links.map((link) => [link.source, link.target]), [
    ['ceo', 'ops'],
    ['ceo', 'finance'],
    ['finance', 'payroll']
  ]);

  const ceo = result.nodes.find((node) => node.id === 'ceo');
  const finance = result.nodes.find((node) => node.id === 'finance');
  const payroll = result.nodes.find((node) => node.id === 'payroll');

  assert.equal(Math.round(ceo.x), 30);
  assert.equal(Math.round(finance.x), 210);
  assert.equal(Math.round(payroll.x), 390);
  assert.ok(finance.y > ceo.y, 'second sibling is placed below first sibling');
  assert.equal(result.links[0].points.length, 4);
});
