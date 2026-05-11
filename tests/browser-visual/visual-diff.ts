import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

import pixelmatch from 'pixelmatch';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';

import { browserVisualCases } from './cases.ts';
import { resolveScreenshotSelector } from './visual-target.ts';

const root = path.resolve(import.meta.dirname, '../..');
const snapshotDir = path.join(root, 'tests/browser-visual/__snapshots__');
const resultDir = path.join(root, 'test-results/browser-visual');
const shouldUpdate = process.env.UPDATE_BROWSER_VISUAL_SNAPSHOTS === '1' || process.argv.includes('--update');
const skipBuild = process.env.SKIP_BROWSER_VISUAL_BUILD === '1';
const maxDiffPixels = Number.parseInt(process.env.BROWSER_VISUAL_MAX_DIFF_PIXELS || '50', 10);
const pixelThreshold = Number.parseFloat(process.env.BROWSER_VISUAL_PIXEL_THRESHOLD || '0.1');
const caseFilter = process.env.BROWSER_VISUAL_CASE;

const selectedCases = caseFilter
  ? browserVisualCases.filter((visualCase) => visualCase.name.includes(caseFilter))
  : browserVisualCases;

if (selectedCases.length === 0) {
  throw new Error(`No browser visual cases matched BROWSER_VISUAL_CASE=${caseFilter}`);
}

if (!skipBuild) {
  await run('npm', ['run', 'build']);
}

await mkdir(snapshotDir, { recursive: true });
await mkdir(resultDir, { recursive: true });

const server = await startStaticServer(root);
const baseUrl = `http://127.0.0.1:${server.port}`;
const browser = await chromium.launch({ headless: true });
const report = [];
const failures = [];

try {
  const context = await browser.newContext({
    colorScheme: 'light',
    deviceScaleFactor: 1,
    viewport: { width: 1280, height: 900 }
  });

  await context.route('**/*', async (route) => {
    const url = route.request().url();
    if (url.startsWith(baseUrl)) {
      await route.continue();
    } else {
      await route.abort();
    }
  });

  for (const visualCase of selectedCases) {
    const result = await runVisualCase(context, visualCase, baseUrl);
    report.push(result);
    if (!result.ok) failures.push(result);
  }
} finally {
  await browser.close();
  await server.close();
}

await writeFile(path.join(resultDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);

if (failures.length > 0) {
  const details = failures
    .map((failure) => `- ${failure.name}: ${failure.message}`)
    .join('\n');
  throw new Error(`Browser visual diff failed:\n${details}`);
}

for (const result of report) {
  console.log(
    shouldUpdate
      ? `Updated browser visual baseline: ${result.snapshotPath}`
      : `Browser visual baseline matched: ${result.snapshotPath}`
  );
}

async function runVisualCase(context, visualCase, baseUrl) {
  const page = await context.newPage();
  const snapshotPath = path.join(snapshotDir, `${visualCase.name}.png`);
  const actualPath = path.join(resultDir, `${visualCase.name}.actual.png`);
  const diffPath = path.join(resultDir, `${visualCase.name}.diff.png`);

  try {
    await page.goto(`${baseUrl}${visualCase.path}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    await page.waitForSelector(visualCase.readySelector, { state: 'visible', timeout: 15000 });
    if (visualCase.disableAnimations !== false) {
      await disableAnimationControls(page);
    }
    await page.waitForTimeout(visualCase.waitAfterRenderMs ?? 1400);

    const screenshotTarget = await screenshotVisualTarget(page, visualCase);
    const screenshot = screenshotTarget.screenshot;

    if (shouldUpdate) {
      await writeFile(snapshotPath, screenshot);
      return {
        name: visualCase.name,
        ok: true,
        screenshotSelector: screenshotTarget.selector,
        snapshotPath: relative(snapshotPath),
        url: `${baseUrl}${visualCase.path}`,
        updated: true
      };
    }

    if (!(await exists(snapshotPath))) {
      await writeFile(actualPath, screenshot);
      return {
        name: visualCase.name,
        ok: false,
        actualPath: relative(actualPath),
        message: `missing baseline ${relative(snapshotPath)}; run npm run test:visual:browser:update`,
        screenshotSelector: screenshotTarget.selector,
        snapshotPath: relative(snapshotPath),
        url: `${baseUrl}${visualCase.path}`
      };
    }

    const expected = PNG.sync.read(await readFile(snapshotPath));
    const actual = PNG.sync.read(screenshot);
    if (actual.width !== expected.width || actual.height !== expected.height) {
      await writeFile(actualPath, screenshot);
      return {
        name: visualCase.name,
        ok: false,
        actualPath: relative(actualPath),
        message: `size changed from ${expected.width}x${expected.height} to ${actual.width}x${actual.height}`,
        screenshotSelector: screenshotTarget.selector,
        snapshotPath: relative(snapshotPath),
        url: `${baseUrl}${visualCase.path}`
      };
    }

    const diff = new PNG({ width: actual.width, height: actual.height });
    const diffPixels = pixelmatch(expected.data, actual.data, diff.data, actual.width, actual.height, {
      threshold: pixelThreshold
    });
    const allowedDiffPixels = visualCase.maxDiffPixels ?? maxDiffPixels;

    if (diffPixels > allowedDiffPixels) {
      await writeFile(actualPath, screenshot);
      await writeFile(diffPath, PNG.sync.write(diff));
      return {
        name: visualCase.name,
        ok: false,
        actualPath: relative(actualPath),
        diffPath: relative(diffPath),
        diffPixels,
        maxDiffPixels: allowedDiffPixels,
        message: `${diffPixels} pixels differ; expected at most ${allowedDiffPixels}`,
        screenshotSelector: screenshotTarget.selector,
        snapshotPath: relative(snapshotPath),
        url: `${baseUrl}${visualCase.path}`
      };
    }

    return {
      name: visualCase.name,
      ok: true,
      diffPixels,
      maxDiffPixels: allowedDiffPixels,
      screenshotSelector: screenshotTarget.selector,
      snapshotPath: relative(snapshotPath),
      url: `${baseUrl}${visualCase.path}`
    };
  } finally {
    await page.close();
  }
}

async function screenshotVisualTarget(page, visualCase) {
  const selector = resolveScreenshotSelector(visualCase);
  const locator = page.locator(selector);
  const count = await locator.count();
  if (count === 0) {
    throw new Error(`No browser visual screenshot target matched ${selector}`);
  }

  const regions = [];
  for (let index = 0; index < count; index += 1) {
    const target = locator.nth(index);
    const box = await target.boundingBox();
    if (box && box.width > 0 && box.height > 0) {
      regions.push({ box, index });
    }
  }

  if (regions.length === 0) {
    throw new Error(`Browser visual screenshot target ${selector} has no visible region`);
  }

  if (regions.length === 1) {
    return {
      screenshot: await locator.nth(regions[0].index).screenshot({ animations: 'disabled' }),
      selector
    };
  }

  const clip = unionClip(regions.map((region) => region.box));
  return {
    screenshot: await page.screenshot({ animations: 'disabled', clip }),
    selector
  };
}

function unionClip(boxes) {
  const minX = Math.min(...boxes.map((box) => box.x));
  const minY = Math.min(...boxes.map((box) => box.y));
  const maxX = Math.max(...boxes.map((box) => box.x + box.width));
  const maxY = Math.max(...boxes.map((box) => box.y + box.height));
  const x = Math.max(0, Math.floor(minX));
  const y = Math.max(0, Math.floor(minY));
  return {
    x,
    y,
    width: Math.ceil(maxX) - x,
    height: Math.ceil(maxY) - y
  };
}

async function disableAnimationControls(page) {
  const controls = page.locator('[data-control-id="animationEnabled"]');
  const count = await controls.count();
  if (count === 0) return;

  for (let index = 0; index < count; index += 1) {
    const control = controls.nth(index);
    if (await control.isChecked()) {
      await control.uncheck({ force: true });
    }
  }

  await page.waitForTimeout(180);
}

function startStaticServer(rootDir) {
  const server = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url || '/', 'http://127.0.0.1');
      let pathname = decodeURIComponent(requestUrl.pathname);
      if (pathname.endsWith('/')) pathname += 'index.html';

      let filePath = path.resolve(rootDir, `.${pathname}`);
      if (!isInsideRoot(filePath, rootDir)) {
        response.writeHead(403).end('Forbidden');
        return;
      }

      const fileStat = await stat(filePath);
      if (fileStat.isDirectory()) filePath = path.join(filePath, 'index.html');

      response.writeHead(200, { 'content-type': contentType(filePath) });
      response.end(await readFile(filePath));
    } catch {
      response.writeHead(404).end('Not found');
    }
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject);
      resolve({
        close: () => new Promise((closeResolve, closeReject) => {
          server.close((error) => (error ? closeReject(error) : closeResolve()));
        }),
        port: server.address().port
      });
    });
  });
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      env: process.env,
      stdio: 'inherit'
    });
    child.once('error', reject);
    child.once('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(' ')} exited with ${code}`));
      }
    });
  });
}

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

function isInsideRoot(filePath, rootDir) {
  const relativePath = path.relative(rootDir, filePath);
  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
}

function contentType(filePath) {
  const extension = path.extname(filePath);
  if (extension === '.html') return 'text/html; charset=utf-8';
  if (extension === '.js') return 'text/javascript; charset=utf-8';
  if (extension === '.css') return 'text/css; charset=utf-8';
  if (extension === '.svg') return 'image/svg+xml';
  if (extension === '.json' || extension === '.map') return 'application/json; charset=utf-8';
  if (extension === '.png') return 'image/png';
  return 'application/octet-stream';
}

function relative(filePath) {
  return path.relative(root, filePath);
}
