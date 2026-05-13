import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { test } from 'vitest';

const root = path.resolve(import.meta.dirname, '..');
const packagesDir = path.join(root, 'packages');

test('extension bundles are built with the shared Vite 8 config', () => {
  const rootPackage = readJson(path.join(root, 'package.json'));
  const devDependencies = rootPackage.devDependencies ?? {};

  assert.match(devDependencies.vite ?? '', /^\^?8\./);
  assert.equal(devDependencies.webpack, undefined);
  assert.equal(devDependencies['webpack-cli'], undefined);
  assert.equal(devDependencies['ts-loader'], undefined);
  assert.ok(exists(path.join(root, 'vite.config.js')));

  for (const packageName of extensionPackageNames()) {
    const packageDir = path.join(packagesDir, packageName);
    const packageJson = readJson(path.join(packageDir, 'package.json'));

    assert.equal(
      exists(path.join(packageDir, 'webpack.config.cjs')),
      false,
      `${packageName} should use the shared Vite config instead of webpack`
    );
    assert.equal(packageJson.scripts?.build, 'vite build --config ../../vite.config.js --mode development');
    assert.equal(
      packageJson.scripts?.release,
      'vite build --config ../../vite.config.js --mode production && vite build --config ../../vite.config.js --mode development'
    );
  }
});

test('workspace package names use the @echarts-extension scope', () => {
  for (const packageName of readdirSync(packagesDir)) {
    const packageDir = path.join(packagesDir, packageName);
    if (!statSync(packageDir).isDirectory()) continue;
    if (!exists(path.join(packageDir, 'package.json'))) continue;

    const packageJson = readJson(path.join(packageDir, 'package.json'));
    assert.match(packageJson.name, /^@echarts-extension\//);
    assert.ok(!packageJson.name.startsWith('@echarts-extension/echarts-'));
    assert.equal(packageJson.publishConfig?.access, 'public');
  }
});

test('shared Vite config keeps scoped package names out of bundle filenames', async () => {
  const originalCwd = process.cwd();
  const { default: createConfig } = await import('../vite.config.js');

  try {
    process.chdir(path.join(packagesDir, 'echarts-radial'));
    const config = createConfig({ command: 'build', mode: 'production' });

    assert.equal(config.build.lib.name, 'echartsRadial');
    assert.equal(config.build.lib.fileName(), 'echarts-radial.min.js');
  } finally {
    process.chdir(originalCwd);
  }
});

test('test tooling runs through Vitest and browser test scripts', () => {
  const rootPackage = readJson(path.join(root, 'package.json'));
  const devDependencies = rootPackage.devDependencies ?? {};

  assert.equal(rootPackage.scripts.test, 'npm run build:ts && vitest run');
  assert.equal(
    rootPackage.scripts['test:unit'],
    'npm run build:ts && vitest run tests/*.test.ts packages/*/test/*.test.ts'
  );
  assert.equal(
    rootPackage.scripts['test:visual'],
    'npm run build:ts && vitest run tests/visual/visual-regression.test.ts'
  );
  assert.equal(
    rootPackage.scripts['test:visual:update'],
    'npm run build:ts && UPDATE_VISUAL_SNAPSHOTS=1 vitest run tests/visual/visual-regression.test.ts'
  );
  assert.equal(
    rootPackage.scripts['test:visual:browser'],
    'node --experimental-strip-types --disable-warning=ExperimentalWarning tests/browser-visual/visual-diff.ts'
  );
  assert.equal(
    rootPackage.scripts['test:visual:browser:update'],
    'UPDATE_BROWSER_VISUAL_SNAPSHOTS=1 node --experimental-strip-types --disable-warning=ExperimentalWarning tests/browser-visual/visual-diff.ts'
  );
  assert.equal(
    rootPackage.scripts['test:perf:browser'],
    'node --experimental-strip-types --disable-warning=ExperimentalWarning tests/browser-perf/perf-runner.ts'
  );
  assert.equal(rootPackage.scripts['pages:build'], 'npm run build && node scripts/build-pages.mjs');

  assert.match(devDependencies.vitest ?? '', /^\^?4\./);
  assert.ok(devDependencies.playwright);
  assert.ok(devDependencies.pixelmatch);
  assert.ok(devDependencies.pngjs);
  assert.ok(exists(path.join(root, 'vitest.config.js')));
  assert.ok(exists(path.join(root, 'tests/browser-visual/visual-diff.ts')));
  assert.ok(exists(path.join(root, 'tests/browser-perf/perf-runner.ts')));
  assert.ok(exists(path.join(root, 'scripts/build-pages.mjs')));
});

test('GitHub Pages workflow deploys built examples through a Pages artifact', () => {
  const workflow = readFileSync(path.join(root, '.github/workflows/pages.yml'), 'utf8');

  assert.match(workflow, /branches:\n\s+- main/);
  assert.match(workflow, /uses: actions\/checkout@v6/);
  assert.match(workflow, /uses: actions\/setup-node@v6/);
  assert.match(workflow, /run: npm run pages:build/);
  assert.match(workflow, /uses: actions\/configure-pages@v6/);
  assert.match(workflow, /uses: actions\/upload-pages-artifact@v5/);
  assert.match(workflow, /path: \.pages/);
  assert.match(workflow, /pages: write/);
  assert.match(workflow, /id-token: write/);
  assert.match(workflow, /uses: actions\/deploy-pages@v5/);
});

test('npm publish workflow only publishes allowlisted packages', () => {
  const workflow = readFileSync(path.join(root, '.github/workflows/npm-publish.yml'), 'utf8');
  const allowlist = readJson(path.join(root, '.github/npm-publish-allowlist.json'));
  const layoutCorePackage = readJson(path.join(root, 'packages/echarts-layout-core/package.json'));

  assert.ok(Array.isArray(allowlist));
  assert.equal(allowlist[0], '@echarts-extension/layout-core');
  assert.ok(allowlist.includes('@echarts-extension/radial'));
  assert.equal(layoutCorePackage.private, undefined);
  assert.equal(layoutCorePackage.publishConfig?.access, 'public');
  assert.match(workflow, /release:\n\s+types:\s+\[published\]/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /uses: actions\/checkout@v6/);
  assert.match(workflow, /uses: actions\/setup-node@v6/);
  assert.match(workflow, /registry-url: https:\/\/registry\.npmjs\.org/);
  assert.match(workflow, /NODE_AUTH_TOKEN: \$\{\{ secrets\.NPM_TOKEN \}\}/);
  assert.match(workflow, /id-token: write/);
  assert.match(workflow, /run: npm run test:unit/);
  assert.match(workflow, /run: npm run release/);
  assert.match(workflow, /node scripts\/npm-publish-plan\.mjs/);
  assert.match(workflow, /node scripts\/npm-publish-packages\.mjs/);
  assert.match(workflow, /--provenance/);
});

test('release builds keep minified and development bundles together', async () => {
  const { default: createConfig } = await import('../vite.config.js');
  const developmentConfig = createConfig({ command: 'build', mode: 'development' });
  const productionConfig = createConfig({ command: 'build', mode: 'production' });

  assert.equal(productionConfig.build.emptyOutDir, true);
  assert.equal(developmentConfig.build.emptyOutDir, false);
});

function extensionPackageNames() {
  return readdirSync(packagesDir)
    .filter((entry) => {
      const packageDir = path.join(packagesDir, entry);
      if (!statSync(packageDir).isDirectory()) return false;
      if (!exists(path.join(packageDir, 'package.json'))) return false;
      const packageJson = readJson(path.join(packageDir, 'package.json'));
      return Boolean(packageJson.peerDependencies?.echarts);
    })
    .sort();
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function exists(filePath) {
  try {
    statSync(filePath);
    return true;
  } catch {
    return false;
  }
}
