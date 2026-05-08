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

test('test tooling runs through Vitest and browser visual diff scripts', () => {
  const rootPackage = readJson(path.join(root, 'package.json'));
  const devDependencies = rootPackage.devDependencies ?? {};

  assert.equal(rootPackage.scripts.test, 'npm run build:ts && vitest run');
  assert.equal(
    rootPackage.scripts['test:unit'],
    'npm run build:ts && vitest run tests/*.test.js packages/*/test/*.test.js'
  );
  assert.equal(
    rootPackage.scripts['test:visual'],
    'npm run build:ts && vitest run tests/visual/visual-regression.test.js'
  );
  assert.equal(
    rootPackage.scripts['test:visual:update'],
    'npm run build:ts && UPDATE_VISUAL_SNAPSHOTS=1 vitest run tests/visual/visual-regression.test.js'
  );
  assert.equal(rootPackage.scripts['test:visual:browser'], 'node tests/browser-visual/visual-diff.js');
  assert.equal(
    rootPackage.scripts['test:visual:browser:update'],
    'UPDATE_BROWSER_VISUAL_SNAPSHOTS=1 node tests/browser-visual/visual-diff.js'
  );
  assert.equal(rootPackage.scripts['pages:build'], 'npm run build && node scripts/build-pages.mjs');

  assert.match(devDependencies.vitest ?? '', /^\^?4\./);
  assert.ok(devDependencies.playwright);
  assert.ok(devDependencies.pixelmatch);
  assert.ok(devDependencies.pngjs);
  assert.ok(exists(path.join(root, 'vitest.config.js')));
  assert.ok(exists(path.join(root, 'tests/browser-visual/visual-diff.js')));
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
