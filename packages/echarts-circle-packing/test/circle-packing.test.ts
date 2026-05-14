import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'vitest';

import * as echarts from 'echarts/lib/echarts';
import { SVGRenderer } from 'echarts/renderers';
import { installElementHover, setElementHoverDimOpacity } from '@echarts-extension/layout-core';

import { __test__ as circlePackingInternals } from '../src/circle-packing.ts';
import {
  flattenCirclePackingData,
  layoutCirclePacking,
  resolveCirclePackingLayout
} from '../src/layout.ts';

echarts.use([SVGRenderer]);

const portfolio = {
  name: 'Portfolio',
  children: [
    {
      name: 'Core',
      value: 120,
      children: [
        { name: 'Search', value: 54 },
        { name: 'Editor', value: 38 },
        { name: 'Storage', value: 28 }
      ]
    },
    {
      name: 'Growth',
      children: [
        { name: 'Campaigns', value: 32 },
        { name: 'Referrals', value: 22 },
        { name: 'Activation', value: 18 }
      ]
    },
    {
      name: 'Platform',
      children: [
        { name: 'API', value: 42 },
        { name: 'Billing', value: 24 }
      ]
    }
  ]
};

const productData = {
  name: 'root',
  children: [
    {
      name: 'Core Experience',
      value: 120,
      children: [
        { name: 'Sync', value: 18 },
        { name: 'Center Experience', value: 54 },
        { name: 'Search', value: 38 },
        { name: 'Other', value: 20 }
      ]
    },
    {
      name: 'Platform',
      children: [
        { name: 'API', value: 42 },
        { name: 'Billing', value: 24 }
      ]
    }
  ]
};

const drilldownData = {
  name: 'root',
  children: [
    {
      name: 'Core',
      children: [
        {
          name: 'Creation',
          children: [
            {
              name: 'Editor',
              children: [
                { name: 'Blocks', value: 18 },
                { name: 'Shortcuts', value: 12 }
              ]
            }
          ]
        }
      ]
    }
  ]
};

test('does not depend on external hierarchy layout packages', () => {
  const packageJson = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8')
  );

  assert.equal(packageJson.dependencies?.['@antv/layout'], undefined);
  assert.equal(packageJson.dependencies?.d3, undefined);
  assert.equal(packageJson.dependencies?.['d3-hierarchy'], undefined);
});

test('computes deterministic nested circle packing with contained children', () => {
  const first = layoutCirclePacking(portfolio, {
    width: 640,
    height: 520,
    padding: 24,
    siblingGap: 2,
    nodePadding: 4,
    sort: false
  });
  const second = layoutCirclePacking(portfolio, {
    width: 640,
    height: 520,
    padding: 24,
    siblingGap: 2,
    nodePadding: 4,
    sort: false
  });

  assert.deepEqual(first, second);
  assert.equal(first.root.name, 'Portfolio');
  assert.equal(first.rootVisible, true);
  assert.equal(first.nodes.length, 12);

  const byName = new Map(first.nodes.map((node) => [node.name, node]));
  assert.ok(byName.get('Core').r > byName.get('Growth').r);
  assert.ok(byName.get('Search').r > byName.get('Storage').r);

  assertNodeWithinChart(first.root, first);
  first.nodes.forEach((node) => {
    assert.equal(Number.isFinite(node.x), true, `${node.name} x`);
    assert.equal(Number.isFinite(node.y), true, `${node.name} y`);
    assert.equal(Number.isFinite(node.r), true, `${node.name} radius`);
    if (!node.parentId) return;
    const parent = first.nodes.find((candidate) => candidate.id === node.parentId);
    assert.ok(parent, `${node.name} has parent`);
    assertNodeInsideParent(node, parent);
  });
  assertSiblingCirclesDoNotOverlap(first.nodes, 0.001);
});

test('supports hidden synthetic roots for array data', () => {
  const result = resolveCirclePackingLayout({
    data: [
      { name: 'A', value: 16 },
      { name: 'B', value: 9 },
      { name: 'C', value: 4 }
    ],
    width: 360,
    height: 300,
    padding: 10,
    rootVisible: false,
    sort: false
  });

  assert.equal(result.root.synthetic, true);
  assert.equal(result.rootVisible, false);
  assert.deepEqual(result.nodes.map((node) => node.name), ['A', 'B', 'C']);
  result.nodes.forEach((node) => {
    assert.ok(node.parentId === result.root.id, `${node.name} stays under hidden root`);
    assertNodeWithinChart(node, result);
  });
  assertSiblingCirclesDoNotOverlap(result.nodes, 0.001);
});

test('resolves layout aliases and flattened raw data order', () => {
  const result = resolveCirclePackingLayout({
    layout: {
      width: 500,
      height: 420,
      valueField: 'metrics.size',
      childrenField: 'items',
      nameField: 'label',
      sort: 'name'
    },
    data: {
      label: 'Root',
      items: [
        {
          label: 'Beta',
          metrics: { size: 7 },
          items: [{ label: 'Beta leaf', metrics: { size: 7 } }]
        },
        {
          label: 'Alpha',
          metrics: { size: 9 },
          items: [{ label: 'Alpha leaf', metrics: { size: 9 } }]
        }
      ]
    }
  });

  assert.deepEqual(
    result.root.children.map((node) => node.name),
    ['Alpha', 'Beta']
  );
  assert.deepEqual(
    result.nodes.map((node) => node.name),
    ['Root', 'Alpha', 'Alpha leaf', 'Beta', 'Beta leaf']
  );
  assert.deepEqual(
    flattenCirclePackingData(result.root.raw, {
      valueField: 'metrics.size',
      childrenField: 'items',
      nameField: 'label',
      sort: 'name'
    }).map((item) => item.label),
    ['Root', 'Alpha', 'Alpha leaf', 'Beta', 'Beta leaf']
  );
});

test('keeps descendant circles highlighted when hovering a parent circle', () => {
  const chart = createSsrChart();

  chart.setOption({
    animation: false,
    series: [{
      type: 'circlePacking',
      data: portfolio,
      sort: false,
      label: {
        show: true,
        minRadius: 0
      },
      itemStyle: {
        opacity: 0.88
      }
    }]
  });

  const circles = chart.getZr().storage.getDisplayList().filter((element) => element.type === 'circle');
  assert.equal(circles.length, 12);

  const core = circles[1];
  const platform = circles[9];
  const api = circles[10];
  const billing = circles[11];

  platform.trigger('mouseover', {
    target: platform
  });

  assert.equal(lastHoverTargetOpacity(platform), 0.88);
  assert.equal(lastHoverTargetOpacity(api), 0.88);
  assert.equal(lastHoverTargetOpacity(billing), 0.88);
  assert.equal(lastHoverTargetOpacity(core), 0.12);

  platform.trigger('mouseout', {
    target: platform
  });

  assert.equal(lastHoverTargetOpacity(api), 0.88);
  assert.equal(lastHoverTargetOpacity(billing), 0.88);
  assert.equal(lastHoverTargetOpacity(core), 0.88);

  chart.dispose();
});

test('places parent labels away from child circles', () => {
  const chart = createSsrChart();

  chart.setOption({
    animation: false,
    series: [{
      type: 'circlePacking',
      data: productData,
      sort: false,
      label: {
        show: true,
        minRadius: 0
      }
    }]
  });

  const circles = chart.getZr().storage.getDisplayList().filter((element) => element.type === 'circle');
  const parentLabel = collectTextElements(chart)
    .find((element) => element.style.text === 'Core Experience');
  assert.ok(parentLabel);

  const parentLabelBox = textBoxFromStyle(parentLabel.style);
  const childCircles = circles.slice(2, 6);
  childCircles.forEach((childCircle, childIndex) => {
    assert.equal(
      boxIntersectsCircle(parentLabelBox, childCircle.shape),
      false,
      `parent label overlaps child circle ${childIndex}`
    );
  });

  chart.dispose();
});

test('clicking a descendant zooms to its parent and the next click restores the root view', () => {
  const chart = createSsrChart();

  chart.setOption({
    animation: true,
    series: [{
      type: 'circlePacking',
      data: portfolio,
      sort: false,
      focusAnimation: false,
      label: {
        show: false
      }
    }]
  });

  const circles = chart.getZr().storage.getDisplayList().filter((element) => element.type === 'circle');
  const rootGroup = circles[0].parent;
  const api = circles[10];
  const rootX = rootGroup.x;
  const rootY = rootGroup.y;

  api.trigger('mousedown', {
    target: api
  });

  assert.equal(rootGroup.scaleX > 1, true);
  assert.equal(rootGroup.scaleY, rootGroup.scaleX);
  assert.notEqual(rootGroup.x, 0);

  api.trigger('mousedown', {
    target: api
  });

  assert.equal(rootGroup.scaleX, 1);
  assert.equal(rootGroup.scaleY, 1);
  assert.equal(rootGroup.x, rootX);
  assert.equal(rootGroup.y, rootY);

  chart.dispose();
});

test('clicking a top-level branch zooms into that branch instead of no-oping on the root', () => {
  const chart = createSsrChart();

  chart.setOption({
    animation: true,
    series: [{
      type: 'circlePacking',
      data: portfolio,
      sort: false,
      focusAnimation: false,
      label: {
        show: false
      }
    }]
  });

  const circles = chart.getZr().storage.getDisplayList().filter((element) => element.type === 'circle');
  const rootGroup = circles[0].parent;
  const core = circles[1];

  core.trigger('mousedown', {
    target: core
  });

  assert.equal(rootGroup.scaleX > 1, true);
  assert.equal(rootGroup.scaleY, rootGroup.scaleX);

  chart.dispose();
});

test('clicking a visible label zooms like clicking its data circle', () => {
  const chart = createSsrChart();

  chart.setOption({
    animation: true,
    series: [{
      type: 'circlePacking',
      data: portfolio,
      sort: false,
      focusAnimation: false,
      label: {
        show: true,
        minRadius: 0
      }
    }]
  });

  const circles = chart.getZr().storage.getDisplayList().filter((element) => element.type === 'circle');
  const rootGroup = circles[0].parent;
  const coreLabel = collectTextElements(chart)
    .find((element) => element.style.text === 'Core');
  assert.ok(coreLabel);

  coreLabel.trigger('mousedown', {
    target: coreLabel
  });

  assert.equal(rootGroup.scaleX > 1, true);
  assert.equal(rootGroup.scaleY, rootGroup.scaleX);

  coreLabel.trigger('mousedown', {
    target: coreLabel
  });

  assert.equal(rootGroup.scaleX, 1);
  assert.equal(rootGroup.scaleY, 1);

  chart.dispose();
});

test('focused labels recompute wrapping and stay visually readable after zooming', () => {
  const node = circleNode({
    name: 'Center Experience',
    x: 40,
    y: 36,
    r: 16
  });
  const element = {
    style: {}
  };
  const labelItem = {
    element,
    node,
    text: 'Center Experience',
    requestedFontSize: 12,
    requestedLineHeight: 14,
    minRadius: 18
  };

  circlePackingInternals.updateCirclePackingFocusLabels([labelItem], 1, circlePackingInternals.disabledEnterAnimation());

  assert.equal(element.ignore, true);
  assert.match(element.style.text, /\.\.\./);

  circlePackingInternals.updateCirclePackingFocusLabels([labelItem], 4, circlePackingInternals.disabledEnterAnimation());

  assert.equal(element.ignore, false);
  assert.equal(element.style.text.includes('...'), false);
  assert.equal(element.style.text.replace(/\s+/g, ''), 'CenterExperience');
  assert.equal(element.style.fontSize * 4, 12);
  assert.equal(element.style.lineHeight * 4, 14);
});

test('hover keeps focused label sizing instead of restoring the pre-focus label style', () => {
  const trigger = createHoverableElement({ opacity: 1 });
  const other = createHoverableElement({ opacity: 1 });
  const label = createHoverableElement({
    text: 'Center...',
    fontSize: 12,
    lineHeight: 14,
    opacity: 1
  });
  const node = circleNode({
    name: 'Center Experience',
    x: 40,
    y: 36,
    r: 16
  });

  const hoverItem = circlePackingInternals.createHoverItem(trigger);
  circlePackingInternals.addHoverElement(hoverItem, label);
  setElementHoverDimOpacity(label, 0.42);
  installElementHover([hoverItem, circlePackingInternals.createHoverItem(other)], {
    transitionDuration: 0
  });

  trigger.trigger('mouseover');
  trigger.trigger('mouseout');

  circlePackingInternals.updateCirclePackingFocusLabels([{
    element: label,
    node,
    text: 'Center Experience',
    requestedFontSize: 12,
    requestedLineHeight: 14,
    minRadius: 18
  }], 4, circlePackingInternals.disabledEnterAnimation());
  const focusedStyle = { ...label.style };

  other.trigger('mouseover');

  assert.equal(label.style.text, focusedStyle.text);
  assert.equal(label.style.fontSize, focusedStyle.fontSize);
  assert.equal(label.style.lineHeight, focusedStyle.lineHeight);
  assert.equal(label.style.opacity, 0.42);
});

test('label focus state drops transient hover opacity from the stored label style', () => {
  const label = createHoverableElement({
    text: 'Center...',
    fontSize: 12,
    lineHeight: 14,
    opacity: 0.12
  });
  const node = circleNode({
    name: 'Center Experience',
    x: 40,
    y: 36,
    r: 16
  });

  circlePackingInternals.updateCirclePackingFocusLabels([{
    element: label,
    node,
    text: 'Center Experience',
    requestedFontSize: 12,
    requestedLineHeight: 14,
    minRadius: 18
  }], 4, circlePackingInternals.disabledEnterAnimation());

  assert.equal(label.style.text.includes('...'), false);
  assert.equal(label.style.opacity, undefined);
  assert.deepEqual(circlePackingInternals.createCirclePackingLabelHoverBaseStyle({
    text: 'Center Experience',
    fontSize: 3,
    opacity: 0.12
  }), {
    text: 'Center Experience',
    fontSize: 3
  });
});

test('clicking a deeper descendant while focused drills into its parent instead of restoring root', () => {
  const chart = createSsrChart();

  chart.setOption({
    animation: true,
    series: [{
      type: 'circlePacking',
      data: drilldownData,
      sort: false,
      focusAnimation: false,
      label: {
        show: false
      }
    }]
  });

  const circles = chart.getZr().storage.getDisplayList().filter((element) => element.type === 'circle');
  const rootGroup = circles[0].parent;
  const core = circles[1];
  const blocks = circles[4];

  core.trigger('mousedown', {
    target: core
  });
  const topLevelScale = rootGroup.scaleX;

  blocks.trigger('mousedown', {
    target: blocks
  });

  assert.equal(rootGroup.scaleX > topLevelScale, true);
  assert.equal(rootGroup.scaleY, rootGroup.scaleX);

  blocks.trigger('mousedown', {
    target: blocks
  });

  assert.equal(rootGroup.scaleX, 1);
  assert.equal(rootGroup.scaleY, 1);

  chart.dispose();
});

test('focus target resolves branch nodes to themselves and leaf nodes to their parent', () => {
  const root = circleNode({ id: 'root', name: 'Root', x: 50, y: 40, r: 20 });
  const parent = circleNode({ id: 'parent', name: 'Parent', parentId: 'root', x: 30, y: 40, r: 10 });
  const child = circleNode({ id: 'child', name: 'Child', parentId: 'parent', x: 28, y: 40, r: 4 });
  const leaf = circleNode({ id: 'leaf', name: 'Leaf', parentId: 'child', x: 27, y: 40, r: 2 });
  root.children = [parent];
  parent.children = [child];
  child.children = [leaf];
  const nodesById = new Map([
    [root.id, root],
    [parent.id, parent],
    [child.id, child],
    [leaf.id, leaf]
  ]);

  assert.equal(circlePackingInternals.resolveCirclePackingFocusTarget(parent, nodesById, root), parent);
  assert.equal(circlePackingInternals.resolveCirclePackingFocusTarget(child, nodesById, root), child);
  assert.equal(circlePackingInternals.resolveCirclePackingFocusTarget(leaf, nodesById, root), child);
});

test('focus transforms animate with the configured duration and easing', () => {
  const group = createAnimatableGroup();
  const transform = {
    x: -24,
    y: 18,
    scaleX: 2.5,
    scaleY: 2.5
  };

  circlePackingInternals.applyCirclePackingFocus(group, transform, {
    enabled: true,
    duration: 640,
    delay: 0,
    easing: 'quarticOut'
  });

  assert.equal(group.stopAnimationCalls[0].scope, 'circle-packing-focus');
  assert.deepEqual(group.animateToCalls[0].target, transform);
  assert.equal(group.animateToCalls[0].config.duration, 640);
  assert.equal(group.animateToCalls[0].config.easing, 'quarticOut');
  assert.equal(group.animateToCalls[0].config.scope, 'circle-packing-focus');

  group.animateToCalls[0].config.done();

  assert.equal(group.x, -24);
  assert.equal(group.y, 18);
  assert.equal(group.scaleX, 2.5);
  assert.equal(group.scaleY, 2.5);
});

test('label focus state follows focus animation and hides ignored labels immediately', () => {
  const visibleLabel = createAnimatableLabel({
    text: 'Old',
    fontSize: 12,
    lineHeight: 14
  });
  const animation = {
    enabled: true,
    duration: 320,
    delay: 0,
    easing: 'quadraticOut'
  };

  circlePackingInternals.assignCirclePackingLabelState(visibleLabel, {
    ignore: false,
    style: {
      x: 8,
      y: 9,
      text: 'Readable Label',
      fontSize: 4,
      lineHeight: 5
    }
  }, animation);

  assert.equal(visibleLabel.ignore, false);
  assert.equal(visibleLabel.style.text, 'Readable Label');
  assert.equal(visibleLabel.stopAnimationCalls[0].scope, 'circle-packing-focus');
  assert.equal(visibleLabel.animateToCalls[0].config.duration, 320);
  assert.equal(visibleLabel.animateToCalls[0].config.easing, 'quadraticOut');
  assert.deepEqual(visibleLabel.animateToCalls[0].target.style, {
    text: 'Readable Label',
    fontSize: 4,
    lineHeight: 5,
    x: 8,
    y: 9
  });

  visibleLabel.animateToCalls[0].config.done();

  assert.equal(visibleLabel.style.fontSize, 4);
  assert.equal(visibleLabel.style.lineHeight, 5);

  const bareLabel = createAnimatableLabel();
  delete bareLabel.style;
  circlePackingInternals.assignCirclePackingLabelState(bareLabel, {
    ignore: false,
    style: {
      text: 'Bare Label',
      fontSize: 6
    }
  }, animation);

  bareLabel.animateToCalls[0].config.done();

  assert.equal(bareLabel.style.text, 'Bare Label');
  assert.equal(bareLabel.style.fontSize, 6);

  const ignoredLabel = createAnimatableLabel({ text: 'Hidden' });
  circlePackingInternals.assignCirclePackingLabelState(ignoredLabel, {
    ignore: true,
    style: {
      text: 'Hidden',
      fontSize: 3,
      lineHeight: 4
    }
  }, animation);

  assert.equal(ignoredLabel.ignore, true);
  assert.equal(ignoredLabel.style.fontSize, 3);
  assert.equal(ignoredLabel.animateToCalls.length, 0);
});

test('label geometry helpers handle missing children and duplicate candidates', () => {
  assert.deepEqual(
    circlePackingInternals.resolveLabelPosition(
      { ...circleNode({ x: 12, y: 18 }), children: undefined },
      'Leaf',
      12,
      14
    ),
    {
      x: 12,
      y: 18
    }
  );

  assert.deepEqual(circlePackingInternals.dedupeLabelCandidates([
    { x: 1, y: 2 },
    { x: 1, y: 2 },
    { x: 3, y: 4 }
  ]), [
    { x: 1, y: 2 },
    { x: 3, y: 4 }
  ]);
});

test('focus animation options resolve defaults, overrides, and disabled states', () => {
  assert.deepEqual(circlePackingInternals.readFocusAnimation(seriesModelValues({
    focusAnimation: true,
    animationDurationUpdate: 610,
    animationEasingUpdate: 'linear'
  })), {
    enabled: true,
    duration: 610,
    delay: 0,
    easing: 'linear'
  });
  assert.deepEqual(circlePackingInternals.readFocusAnimation(seriesModelValues({
    focusAnimation: {
      duration: -20,
      easing: 'quarticOut'
    }
  })), {
    enabled: true,
    duration: 0,
    delay: 0,
    easing: 'quarticOut'
  });
  assert.deepEqual(circlePackingInternals.readFocusAnimation(seriesModelValues({
    focusAnimation: null,
    animationDuration: 430,
    animationEasing: 'bounceOut'
  })), {
    enabled: true,
    duration: 430,
    delay: 0,
    easing: 'bounceOut'
  });
  assert.equal(circlePackingInternals.readFocusAnimation(seriesModelValues({ animation: false })).enabled, false);
  assert.equal(circlePackingInternals.readFocusAnimation(seriesModelValues({ focusAnimation: false })).enabled, false);
  assert.equal(circlePackingInternals.readFocusAnimation(seriesModelValues({ focusAnimation: { show: false } })).enabled, false);
  assert.equal(circlePackingInternals.readFocusAnimation(seriesModelValues({ focusAnimation: { enabled: false } })).enabled, false);
});

test('focus helpers resolve fallback targets and unmapped elements', () => {
  const root = circleNode({ id: 'root', name: 'Root', x: 50, y: 40, r: 20 });
  const parent = circleNode({ id: 'parent', name: 'Parent', parentId: 'root', x: 30, y: 40, r: 10 });
  const child = circleNode({ id: 'child', name: 'Child', parentId: 'parent', x: 28, y: 40, r: 4 });
  root.children = [parent];
  parent.children = [child];
  const nodesById = new Map([
    [root.id, root],
    [parent.id, parent],
    [child.id, child]
  ]);

  assert.equal(circlePackingInternals.resolveCurrentFocusTarget(parent.id, nodesById, root), parent);
  assert.equal(circlePackingInternals.resolveCurrentFocusTarget('missing', nodesById, root), root);
  assert.equal(circlePackingInternals.resolveCurrentFocusTarget(null, nodesById, root), root);
  assert.equal(circlePackingInternals.resolveCirclePackingFocusTarget(child, nodesById, root), parent);
  assert.equal(circlePackingInternals.resolveCirclePackingFocusTarget(undefined, nodesById, root), root);
  assert.equal(circlePackingInternals.resolveCirclePackingFocusTarget(root, nodesById, root), root);
  assert.equal(
    circlePackingInternals.resolveCirclePackingFocusTarget(
      circleNode({ id: 'solo', name: 'Solo', x: 50, y: 40, r: 20 }),
      nodesById,
      root
    ),
    root
  );
  assert.equal(
    circlePackingInternals.resolveCirclePackingFocusTarget({ ...child, parentId: 'missing' }, nodesById, root),
    root
  );

  const element = {};
  const mappedElement = {};
  const mapped = circlePackingInternals.mapCirclePackingNodeElements(new Map([
    ['kept', [element, element]],
    ['single', element],
    ['dropped', [{}]]
  ]), (candidate) => (candidate === element ? mappedElement : null));
  assert.deepEqual([...mapped.entries()], [
    ['kept', [mappedElement]],
    ['single', [mappedElement]]
  ]);
  assert.deepEqual(circlePackingInternals.mapCirclePackingLabelItems([
    {
      element,
      node: root,
      text: 'Root',
      requestedFontSize: 12,
      requestedLineHeight: 14,
      minRadius: 0
    },
    {
      element: {},
      node: child,
      text: 'Child',
      requestedFontSize: 12,
      requestedLineHeight: 14,
      minRadius: 0
    }
  ], (candidate) => (candidate === element ? mappedElement : null)), [
    {
      element: mappedElement,
      node: root,
      text: 'Root',
      requestedFontSize: 12,
      requestedLineHeight: 14,
      minRadius: 0
    }
  ]);

  const childFocusElement = {};
  const parentFocusElement = {
    children: () => [childFocusElement]
  };
  const focusElementsByNodeId = new Map();
  circlePackingInternals.appendCirclePackingFocusElement(focusElementsByNodeId, 'parent', parentFocusElement);
  circlePackingInternals.appendCirclePackingFocusElement(focusElementsByNodeId, 'parent', parentFocusElement);
  assert.deepEqual(focusElementsByNodeId.get('parent'), [parentFocusElement, childFocusElement]);

  const hoverOnlyItem = { elements: [] };
  const hoverWithTriggerItem = { elements: [], triggerElements: [] };
  circlePackingInternals.addHoverElement(hoverOnlyItem, element);
  circlePackingInternals.addHoverElement(hoverWithTriggerItem, mappedElement);
  assert.deepEqual(hoverOnlyItem, {
    elements: [element],
    triggerElements: [element]
  });
  assert.deepEqual(hoverWithTriggerItem, {
    elements: [mappedElement],
    triggerElements: [mappedElement]
  });

  const transform = circlePackingInternals.createCirclePackingFocusTransform(
    { ...root, r: 0 },
    { center: { x: 50, y: 40 }, radius: 20 },
    { x: 2, y: 3 }
  );
  assert.deepEqual(transform, {
    x: 2,
    y: 3,
    scaleX: 1,
    scaleY: 1
  });
});

function assertNodeInsideParent(node, parent) {
  const distance = Math.hypot(node.x - parent.x, node.y - parent.y);
  assert.ok(
    distance + node.r <= parent.r + 0.001,
    `${node.name} is outside ${parent.name}`
  );
}

function createSsrChart(width = 640, height = 420) {
  return echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width,
    height
  });
}

function createAnimatableGroup() {
  return {
    stopAnimationCalls: [],
    animateToCalls: [],
    stopAnimation(scope, forwardToLast) {
      this.stopAnimationCalls.push({ scope, forwardToLast });
    },
    animateTo(target, config, animationProps) {
      this.animateToCalls.push({ target, config, animationProps });
    }
  };
}

function createAnimatableLabel(style = {}) {
  return {
    style: { ...style },
    stopAnimationCalls: [],
    animateToCalls: [],
    stopAnimation(scope, forwardToLast) {
      this.stopAnimationCalls.push({ scope, forwardToLast });
    },
    animateTo(target, config) {
      this.animateToCalls.push({ target, config });
    }
  };
}

function createHoverableElement(style = {}) {
  return {
    style: { ...style },
    handlers: {},
    on(eventName, handler) {
      if (!this.handlers[eventName]) this.handlers[eventName] = new Set();
      this.handlers[eventName].add(handler);
    },
    trigger(eventName, payload = {}) {
      this.handlers[eventName]?.forEach((handler) => handler({ target: this, ...payload }));
    },
    stopAnimation() {}
  };
}

function seriesModelValues(values = {}) {
  return {
    get(path) {
      return values[path];
    }
  };
}

function circleNode(overrides = {}) {
  return {
    id: 'node',
    name: 'Node',
    value: 1,
    percent: 1,
    depth: 0,
    parentId: null,
    children: [],
    dataIndex: 0,
    x: 0,
    y: 0,
    r: 1,
    color: '#000',
    synthetic: false,
    raw: {},
    ...overrides
  };
}

function lastHoverTargetOpacity(element) {
  const animator = element.animators
    ?.filter((item) => item.scope === 'element-hover')
    .at(-1);
  return animator?._tracks?.opacity?.keyframes?.at(-1)?.value;
}

function collectTextElements(chart) {
  const elements = [];
  chart.getZr().storage.getRoots().forEach((root) => visitTextElements(root, elements));
  return elements;
}

function visitTextElements(element, elements) {
  if (element.style?.text != null) elements.push(element);
  element.children?.().forEach((child) => visitTextElements(child, elements));
}

function textBoxFromStyle(style) {
  const fontSize = Number(style.fontSize) || 12;
  const lineHeight = Number(style.lineHeight) || fontSize + 2;
  const lines = String(style.text).split('\n');
  const width = Math.max(...lines.map((line) => line.length), 1) * fontSize * 0.56;
  const height = lines.length * lineHeight;
  let x = Number(style.x) || 0;
  let y = Number(style.y) || 0;
  if (style.align === 'center') x -= width / 2;
  if (style.align === 'right') x -= width;
  if (style.verticalAlign === 'middle') y -= height / 2;
  if (style.verticalAlign === 'bottom') y -= height;
  return {
    x,
    y,
    width,
    height
  };
}

function boxIntersectsCircle(box, circle) {
  const closestX = Math.max(box.x, Math.min(circle.cx, box.x + box.width));
  const closestY = Math.max(box.y, Math.min(circle.cy, box.y + box.height));
  return Math.hypot(closestX - circle.cx, closestY - circle.cy) < circle.r;
}

function assertNodeWithinChart(node, layout) {
  assert.ok(node.x - node.r >= -0.001, `${node.name} left bound`);
  assert.ok(node.x + node.r <= layout.width + 0.001, `${node.name} right bound`);
  assert.ok(node.y - node.r >= -0.001, `${node.name} top bound`);
  assert.ok(node.y + node.r <= layout.height + 0.001, `${node.name} bottom bound`);
}

function assertSiblingCirclesDoNotOverlap(nodes, gap) {
  const byParent = new Map();
  nodes.forEach((node) => {
    if (!node.parentId) return;
    const siblings = byParent.get(node.parentId) || [];
    siblings.push(node);
    byParent.set(node.parentId, siblings);
  });

  for (const siblings of byParent.values()) {
    for (let leftIndex = 0; leftIndex < siblings.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < siblings.length; rightIndex += 1) {
        const left = siblings[leftIndex];
        const right = siblings[rightIndex];
        const distance = Math.hypot(right.x - left.x, right.y - left.y);
        assert.ok(
          distance + 0.001 >= left.r + right.r + gap,
          `${left.name} overlaps ${right.name}`
        );
      }
    }
  }
}
