import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, test } from 'vitest';

import {
  formatGithubOutput,
  parseRequestedPackages,
  resolvePublishPlan
} from '../scripts/npm-publish-plan.mjs';
import { createPublishArgs } from '../scripts/npm-publish-packages.mjs';

const tempRoots = [];

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { force: true, recursive: true });
  }
});

test('npm publish plan expands all to the allowlisted workspace packages', () => {
  const root = createWorkspace({
    allowlist: ['@echarts-extension/radial', '@echarts-extension/venn'],
    packages: {
      'echarts-radial': { name: '@echarts-extension/radial', version: '1.0.0' },
      'echarts-venn': { name: '@echarts-extension/venn', version: '1.0.1' },
      'echarts-grid': { name: '@echarts-extension/grid', version: '1.0.2' }
    }
  });

  const plan = resolvePublishPlan({ rootDir: root, requestedPackages: 'all' });

  assert.deepEqual(
    plan.packages.map((pkg) => pkg.name),
    ['@echarts-extension/radial', '@echarts-extension/venn']
  );
  assert.deepEqual(
    plan.packages.map((pkg) => pkg.dir),
    ['packages/echarts-radial', 'packages/echarts-venn']
  );
});

test('npm publish plan accepts comma or newline separated requested packages', () => {
  const root = createWorkspace({
    allowlist: ['@echarts-extension/radial', '@echarts-extension/venn'],
    packages: {
      'echarts-radial': { name: '@echarts-extension/radial', version: '1.0.0' },
      'echarts-venn': { name: '@echarts-extension/venn', version: '1.0.1' }
    }
  });

  assert.deepEqual(parseRequestedPackages('@echarts-extension/radial,\n@echarts-extension/venn'), [
    '@echarts-extension/radial',
    '@echarts-extension/venn'
  ]);

  const plan = resolvePublishPlan({
    rootDir: root,
    requestedPackages: '@echarts-extension/venn, @echarts-extension/radial'
  });

  assert.deepEqual(
    plan.packages.map((pkg) => pkg.name),
    ['@echarts-extension/venn', '@echarts-extension/radial']
  );
});

test('npm publish plan rejects packages outside the allowlist', () => {
  const root = createWorkspace({
    allowlist: ['@echarts-extension/radial'],
    packages: {
      'echarts-radial': { name: '@echarts-extension/radial', version: '1.0.0' },
      'echarts-grid': { name: '@echarts-extension/grid', version: '1.0.2' }
    }
  });

  assert.throws(
    () => resolvePublishPlan({ rootDir: root, requestedPackages: '@echarts-extension/grid' }),
    /not in \.github\/npm-publish-allowlist\.json/
  );
});

test('npm publish plan refuses private packages even when allowlisted', () => {
  const root = createWorkspace({
    allowlist: ['@echarts-extension/layout-core'],
    packages: {
      'echarts-layout-core': {
        name: '@echarts-extension/layout-core',
        private: true,
        version: '1.0.0'
      }
    }
  });

  assert.throws(
    () => resolvePublishPlan({ rootDir: root, requestedPackages: 'all' }),
    /private package/
  );
});

test('npm publish plan writes GitHub output values for downstream steps', () => {
  const root = createWorkspace({
    allowlist: ['@echarts-extension/radial'],
    packages: {
      'echarts-radial': { name: '@echarts-extension/radial', version: '1.0.0' }
    }
  });
  const plan = resolvePublishPlan({ rootDir: root, requestedPackages: 'all' });

  assert.match(formatGithubOutput(plan), /package_count=1/);
  assert.match(formatGithubOutput(plan), /package_names=\["@echarts-extension\/radial"\]/);
  assert.match(readFileSync(path.join(root, '.github/npm-publish-allowlist.json'), 'utf8'), /@echarts-extension\/radial/);
});

test('npm publish command receives a filesystem path instead of a package spec', () => {
  const rootDir = path.join(os.tmpdir(), 'echarts-publish-root');

  assert.deepEqual(
    createPublishArgs(
      { dir: 'packages/echarts-radial', name: '@echarts-extension/radial' },
      { dryRun: true, provenance: true, rootDir }
    ),
    ['publish', path.join(rootDir, 'packages/echarts-radial'), '--provenance', '--access', 'public', '--dry-run']
  );
});

function createWorkspace({ allowlist, packages }) {
  const root = path.join(os.tmpdir(), `echarts-publish-plan-${process.pid}-${tempRoots.length}`);
  tempRoots.push(root);
  mkdirSync(path.join(root, '.github'), { recursive: true });
  mkdirSync(path.join(root, 'packages'), { recursive: true });
  writeFileSync(path.join(root, '.github/npm-publish-allowlist.json'), `${JSON.stringify(allowlist, null, 2)}\n`);

  for (const [dir, packageJson] of Object.entries(packages)) {
    const packageDir = path.join(root, 'packages', dir);
    mkdirSync(packageDir, { recursive: true });
    writeFileSync(path.join(packageDir, 'package.json'), `${JSON.stringify(packageJson, null, 2)}\n`);
  }

  writeFileSync(
    path.join(root, 'package.json'),
    `${JSON.stringify({ private: true, workspaces: ['packages/*'] }, null, 2)}\n`
  );

  return root;
}
