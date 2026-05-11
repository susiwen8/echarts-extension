import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

import * as echarts from 'echarts';
import { SVGRenderer } from 'echarts/renderers';
import { test } from 'vitest';

import '../index.ts';
import {
  collectCauseEffectData,
  layoutCauseEffect,
  resolveCauseEffectLayout
} from '../src/layout.ts';

echarts.use([SVGRenderer]);

const sampleDiagram = {
  effect: 'Late delivery',
  categories: [
    {
      id: 'people',
      name: 'People',
      causes: [
        { name: 'handoff gaps' },
        { name: 'unclear owner', children: [{ name: 'no escalation path' }] }
      ]
    },
    {
      id: 'process',
      name: 'Process',
      causes: [
        { name: 'manual approval' },
        { name: 'batch release' }
      ]
    },
    {
      id: 'tools',
      name: 'Tools',
      causes: [
        { name: 'slow build' }
      ]
    }
  ]
};

function loadDemoNamespace() {
  const window = {};
  const document = { addEventListener() {} };
  runInNewContext(readFileSync(new URL('../../../examples/shared/demo-data.js', import.meta.url), 'utf8'), { window });
  runInNewContext(readFileSync(new URL('../../../examples/shared/demo-runner.js', import.meta.url), 'utf8'), { window, document });
  return window.EChartsExtensionExamples;
}

test('example uses the shared form controls and add data flow', () => {
  const html = readFileSync(new URL('../examples/index.html', import.meta.url), 'utf8');
  const namespace = loadDemoNamespace();
  const data = namespace.cloneExampleData(namespace.data);
  const state = namespace.createAddDataState('cause-effect');

  const beforeCount = namespace.countExampleDataItems('cause-effect', data);
  const firstOption = namespace.createDemoOption('cause-effect', data, {});
  const result = namespace.addExampleData('cause-effect', data, state);
  const afterCount = namespace.countExampleDataItems('cause-effect', data);
  const updatedOption = namespace.createDemoOption('cause-effect', data, {}, result);

  assert.match(html, /data-example="cause-effect"/);
  assert.match(html, /examples\/shared\/demo-data\.js/);
  assert.match(html, /examples\/shared\/demo-runner\.js/);
  assert.equal(firstOption.series[0].type, 'causeEffect');
  assert.equal(firstOption.series[0].categories, data.causeEffect.categories);
  assert.equal(firstOption.series[0].enterAnimation, false);
  assert.equal(firstOption.series[0].animationDurationUpdate, 0);
  assert.equal(result.added, true);
  assert.equal(result.count, 1);
  assert.ok(afterCount > beforeCount);
  assert.equal(data.causeEffect.categories.at(-1).name, 'Measurement');
  assert.equal(updatedOption.series[0].categories, data.causeEffect.categories);
});

test('computes deterministic fishbone layout with alternating category sides', () => {
  const first = layoutCauseEffect(sampleDiagram, {
    width: 760,
    height: 460,
    padding: 40,
    effectWidth: 132,
    effectHeight: 58,
    categoryGap: 112,
    causeGap: 30
  });
  const second = layoutCauseEffect(sampleDiagram, {
    width: 760,
    height: 460,
    padding: 40,
    effectWidth: 132,
    effectHeight: 58,
    categoryGap: 112,
    causeGap: 30
  });

  assert.deepEqual(first, second);
  assert.equal(first.effect.name, 'Late delivery');
  assert.deepEqual(
    first.categories.map((category) => [category.id, category.side, Math.round(category.anchor.x)]),
    [['people', 'top', 152], ['process', 'bottom', 264], ['tools', 'top', 376]]
  );
  assert.deepEqual(
    first.categories.flatMap((category) => flattenCauses(category.causes).map((cause) => [category.id, cause.name, cause.depth])),
    [
      ['people', 'handoff gaps', 0],
      ['people', 'unclear owner', 0],
      ['people', 'no escalation path', 1],
      ['process', 'manual approval', 0],
      ['process', 'batch release', 0],
      ['tools', 'slow build', 0]
    ]
  );

  const nested = flattenCauses(first.categories[0].causes).find((cause) => cause.name === 'no escalation path');
  assert.ok(nested);
  assert.equal(nested.depth, 1);
  assert.equal(nested.side, 'top');
  assert.equal(Number.isFinite(nested.x), true);
  assert.equal(Number.isFinite(nested.y), true);
});

test('keeps fishbone branches straight with horizontal cause ribs', () => {
  const layout = layoutCauseEffect(sampleDiagram, {
    width: 760,
    height: 460,
    padding: 40,
    effectWidth: 132,
    effectHeight: 58,
    categoryGap: 112,
    categoryLength: 128,
    causeLength: 76
  });

  layout.categories.forEach((category) => {
    assert.ok(category.end.x < category.anchor.x, `${category.name} branch should angle outward to the left`);
  });

  flattenCauses(layout.categories.flatMap((category) => category.causes)).forEach((cause) => {
    assert.equal(Math.round(cause.line.y1), Math.round(cause.line.y2), `${cause.name} cause rib should be horizontal`);
    assert.ok(cause.line.x2 < cause.line.x1, `${cause.name} cause rib should run left from the branch`);
    assert.equal(cause.label.align, 'right');
  });
});

function flattenCauses(causes) {
  return causes.flatMap((cause) => [cause, ...flattenCauses(cause.children || [])]);
}

test('resolves categories from common aliases and creates tooltip data for effect, categories, and causes', () => {
  const result = resolveCauseEffectLayout({
    effect: { name: 'Low NPS' },
    data: [
      ['People', 'missed follow-up', 'thin onboarding'],
      {
        category: 'Product',
        items: [
          { label: 'confusing setup' },
          { label: 'missing template' }
        ]
      }
    ],
    width: 520,
    height: 320,
    padding: 32
  });
  const source = collectCauseEffectData({
    effect: { name: 'Low NPS' },
    data: [
      ['People', 'missed follow-up'],
      { category: 'Product', items: [{ label: 'confusing setup' }] }
    ]
  });

  assert.deepEqual(result.categories.map((category) => category.name), ['People', 'Product']);
  assert.deepEqual(result.categories[1].causes.map((cause) => cause.name), ['confusing setup', 'missing template']);
  assert.deepEqual(source.map((item) => [item.kind, item.name]), [
    ['effect', 'Low NPS'],
    ['category', 'People'],
    ['cause', 'missed follow-up'],
    ['category', 'Product'],
    ['cause', 'confusing setup']
  ]);
});

test('renders cause and effect diagram spine, branches, effect box, and labels', () => {
  const chart = echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width: 760,
    height: 460
  });

  chart.setOption({
    animation: false,
    series: [
      {
        type: 'causeEffect',
        width: 720,
        height: 420,
        left: 20,
        top: 20,
        ...sampleDiagram,
        label: {
          show: true
        }
      }
    ]
  });

  const svg = chart.renderToSVGString();
  chart.dispose();

  assert.match(svg, /Late delivery/);
  assert.match(svg, /People/);
  assert.match(svg, /handoff gaps/);
  assert.match(svg, /no escalation path/);
  assert.match(svg, /<path|<line|<polyline/);
});

test('updates added categories without collapsing existing target elements', () => {
  const chart = echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width: 760,
    height: 460
  });
  const baseSeries = {
    type: 'causeEffect',
    width: 720,
    height: 420,
    left: 20,
    top: 20,
    effect: 'Late delivery',
    categories: [
      { name: 'People', causes: ['handoff gaps'] }
    ],
    label: { show: true },
    enterAnimation: false
  };

  chart.setOption({
    animation: true,
    series: [baseSeries]
  });
  chart.setOption({
    animation: true,
    series: [
      {
        ...baseSeries,
        enterAnimation: true,
        categories: [
          ...baseSeries.categories,
          { name: 'Tools', causes: ['slow build'] }
        ]
      }
    ]
  });

  const svg = chart.renderToSVGString();
  chart.dispose();

  assert.match(svg, /People/);
  assert.match(svg, /Tools/);
  assert.doesNotMatch(svg, /fill-opacity="0">People<\/text>/);
  assert.doesNotMatch(svg, /fill-opacity="0">handoff gaps<\/text>/);
});
