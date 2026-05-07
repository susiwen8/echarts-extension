import assert from 'node:assert/strict';
import { test } from 'vitest';

import {
  layoutNestedCircle,
  resolveNestedCircleLayout
} from '../lib/src/layout.js';

const roadmapData = [
  {
    name: 'Mathematics & Statistics',
    children: [
      'Probability Theory',
      'Linear Algebra',
      'Descriptive Statistics',
      'Hypothesis Testing',
      'Inferential Statistics',
      'Calculus'
    ]
  },
  {
    name: 'Python',
    children: ['Syntax', 'Data Types', 'Control Structures', 'Pandas', 'NumPy', 'Data Visualization', 'Scikit-Learn']
  },
  {
    name: 'SQL',
    children: ['Joins, Subqueries', 'Window Functions', 'Indexing', 'Optimization', 'Database Management', 'Query Optimization']
  },
  {
    name: 'Data Wrangling',
    children: ['Data Cleaning', 'Data Transformation', 'Handling missing values', 'Data Normalization', 'Data Merging & Joining']
  },
  {
    name: 'Data Visualization',
    children: ['Bokey', 'Plotly', 'Seaborn', 'Taipy', 'Tableau', 'PowerBI', 'Looker', 'Matplotlib']
  },
  {
    name: 'Machine Learning',
    children: ['Supervised Learning', 'Unsupervised Learning', 'K-Means Clustering', 'Hierarchical Clustering']
  },
  {
    name: 'Soft Skills',
    children: ['Critical Thinking', 'Problem-solving Skills', 'Communication Skills', 'Collaboration and Teamwork']
  }
];

test('computes deterministic nested rings from inner to outer', () => {
  const first = layoutNestedCircle(roadmapData, {
    width: 720,
    height: 720,
    padding: 24,
    centerRadiusRatio: 0.28
  });
  const second = layoutNestedCircle(roadmapData, {
    width: 720,
    height: 720,
    padding: 24,
    centerRadiusRatio: 0.28
  });

  assert.deepEqual(first, second);
  assert.equal(first.rings.length, roadmapData.length);
  assert.equal(first.rings[0].name, 'Mathematics & Statistics');
  assert.equal(first.rings.at(-1).name, 'Soft Skills');

  first.rings.forEach((ring, index) => {
    assert.ok(ring.outerRadius > ring.innerRadius, `${ring.name} has visible thickness`);
    assert.ok(ring.outerRadius <= first.radius, `${ring.name} stays inside chart radius`);
    if (index > 0) {
      assert.equal(ring.innerRadius, first.rings[index - 1].outerRadius);
    }
  });
});

test('uses bottom-aligned nested circles instead of concentric rings', () => {
  const result = layoutNestedCircle(roadmapData, {
    width: 720,
    height: 720,
    padding: 24,
    centerRadiusRatio: 0.28
  });
  const bottoms = result.rings.map((ring) => Math.round((ring.y + ring.outerRadius) * 1000) / 1000);
  const centers = result.rings.map((ring) => Math.round(ring.y * 1000) / 1000);

  assert.equal(new Set(bottoms).size, 1);
  assert.ok(new Set(centers).size > 1, 'nested circles should not share one center');
  result.rings.slice(1).forEach((ring, index) => {
    assert.ok(ring.y < result.rings[index].y, `${ring.name} center moves upward as radius grows`);
    assert.ok(ring.outerRadius > result.rings[index].outerRadius, `${ring.name} radius grows outward`);
  });
});

test('places child labels inside their owning ring', () => {
  const result = layoutNestedCircle(roadmapData, {
    width: 640,
    height: 520,
    padding: 20,
    centerRadiusRatio: 0.3
  });

  assert.equal(result.labels.length, roadmapData.reduce((sum, ring) => sum + ring.children.length, 0));

  result.labels.forEach((label) => {
    const ring = result.rings[label.ringIndex];
    const distance = Math.hypot(label.x - ring.x, label.y - ring.y);
    assert.ok(distance <= ring.outerRadius, `${label.name} is inside ${ring.name} outer radius`);
  });
});

test('keeps non-center labels away from the bottom tangent pinch', () => {
  const result = layoutNestedCircle(roadmapData, {
    width: 720,
    height: 720,
    padding: 24,
    centerRadiusRatio: 0.28
  });

  result.labels
    .filter((label) => label.ringIndex > 0)
    .forEach((label) => {
      const ring = result.rings[label.ringIndex];
      assert.ok(label.y < ring.y + ring.outerRadius * 0.84, `${label.name} avoids the bottom pinch`);
    });
});

test('resolves aliases for ring children and title labels', () => {
  const result = resolveNestedCircleLayout({
    data: [
      {
        name: 'Core',
        items: [{ name: 'One' }, { label: 'Two' }]
      },
      {
        label: 'Outer',
        children: ['Three']
      }
    ],
    width: 480,
    height: 480
  });

  assert.deepEqual(result.rings.map((ring) => ring.name), ['Core', 'Outer']);
  assert.deepEqual(result.labels.map((label) => label.name), ['One', 'Two', 'Three']);
});
