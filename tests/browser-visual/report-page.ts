import { writeFile } from 'node:fs/promises';
import path from 'node:path';

export async function writeBrowserVisualReportPage(report, options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const resultDir = options.resultDir || path.join(rootDir, 'test-results/browser-visual');
  const resultDirFromRoot = normalizePath(path.relative(rootDir, resultDir));
  const reportPath = path.join(resultDir, 'index.html');
  const html = createBrowserVisualReportHtml(report, {
    generatedAt: options.generatedAt || new Date().toISOString(),
    resultDirFromRoot
  });

  await writeFile(reportPath, html);
  return reportPath;
}

export function createBrowserVisualReportHtml(report, options = {}) {
  const rows = Array.isArray(report) ? report : [];
  const failed = rows.filter((result) => !result.ok);
  const passed = rows.length - failed.length;
  const generatedAt = options.generatedAt || new Date().toISOString();
  const resultDirFromRoot = options.resultDirFromRoot || 'test-results/browser-visual';
  const title = options.title || 'Browser Visual Diff';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f8fb;
      --panel: #ffffff;
      --ink: #1b2433;
      --muted: #667085;
      --line: #d9e1ec;
      --soft: #edf2f7;
      --danger: #b42318;
      --danger-soft: #fff0ed;
      --ok: #237a57;
      --ok-soft: #ecfdf5;
      --blue: #275ec9;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      color: var(--ink);
      background: var(--bg);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    header {
      position: sticky;
      top: 0;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
      padding: 14px 22px;
      border-bottom: 1px solid var(--line);
      background: rgba(255, 255, 255, 0.94);
      backdrop-filter: blur(10px);
    }

    h1 {
      margin: 0;
      font-size: 20px;
      line-height: 1.2;
    }

    .meta {
      color: var(--muted);
      font-size: 12px;
      line-height: 1.4;
    }

    .summary {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: flex-end;
    }

    .pill {
      display: inline-flex;
      align-items: center;
      min-height: 28px;
      padding: 0 10px;
      border: 1px solid var(--line);
      border-radius: 999px;
      background: var(--panel);
      font-size: 12px;
      font-weight: 750;
      white-space: nowrap;
    }

    .pill--failed {
      border-color: #f3b8ae;
      color: var(--danger);
      background: var(--danger-soft);
    }

    .pill--passed {
      border-color: #a9dbc6;
      color: var(--ok);
      background: var(--ok-soft);
    }

    main {
      width: min(1480px, calc(100% - 28px));
      margin: 18px auto 40px;
    }

    .case {
      overflow: hidden;
      margin-bottom: 18px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--panel);
    }

    .case__header {
      display: grid;
      grid-template-columns: minmax(180px, 1fr) auto;
      gap: 12px;
      align-items: start;
      padding: 13px 15px;
      border-bottom: 1px solid var(--line);
      background: #fbfcff;
    }

    .case__title {
      margin: 0 0 5px;
      font-size: 15px;
      line-height: 1.25;
    }

    .case__message {
      margin: 0;
      color: var(--muted);
      font-size: 12px;
      line-height: 1.45;
    }

    .case__status {
      justify-self: end;
    }

    .media-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 1px;
      background: var(--line);
    }

    figure {
      min-width: 0;
      margin: 0;
      background: #ffffff;
    }

    figcaption {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      min-height: 36px;
      padding: 8px 10px;
      border-bottom: 1px solid var(--soft);
      color: var(--muted);
      font-size: 12px;
      font-weight: 700;
    }

    figcaption a {
      overflow: hidden;
      color: var(--blue);
      font-weight: 650;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .image-frame {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 260px;
      padding: 10px;
      background:
        linear-gradient(45deg, #f8fafc 25%, transparent 25%),
        linear-gradient(-45deg, #f8fafc 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #f8fafc 75%),
        linear-gradient(-45deg, transparent 75%, #f8fafc 75%);
      background-color: #ffffff;
      background-position: 0 0, 0 8px, 8px -8px, -8px 0;
      background-size: 16px 16px;
    }

    img {
      display: block;
      max-width: 100%;
      max-height: 62vh;
      object-fit: contain;
      border: 1px solid var(--soft);
      background: #ffffff;
    }

    .empty {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 260px;
      padding: 16px;
      color: var(--muted);
      font-size: 13px;
      text-align: center;
      background: #f8fafc;
    }

    code {
      color: #324055;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 12px;
    }

    @media (max-width: 980px) {
      header {
        position: static;
        align-items: flex-start;
        flex-direction: column;
      }

      .summary {
        justify-content: flex-start;
      }

      .case__header,
      .media-grid {
        grid-template-columns: 1fr;
      }

      .case__status {
        justify-self: start;
      }
    }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>${escapeHtml(title)}</h1>
      <div class="meta">Generated ${escapeHtml(generatedAt)}</div>
    </div>
    <div class="summary">
      <span class="pill">${rows.length} total</span>
      <span class="pill pill--failed">${failed.length} failed</span>
      <span class="pill pill--passed">${passed} passed</span>
    </div>
  </header>
  <main>
    ${rows.map((result) => renderResult(result, resultDirFromRoot)).join('\n')}
  </main>
</body>
</html>
`;
}

function renderResult(result, resultDirFromRoot) {
  const statusClass = result.ok ? 'pill--passed' : 'pill--failed';
  const statusLabel = result.ok ? 'passed' : 'failed';
  const details = [
    result.message,
    result.diffPixels == null ? '' : `${result.diffPixels} diff pixels`,
    result.maxDiffPixels == null ? '' : `max ${result.maxDiffPixels}`,
    result.screenshotSelector ? `selector ${result.screenshotSelector}` : ''
  ].filter(Boolean).join(' | ');

  return `<article class="case">
      <div class="case__header">
        <div>
          <h2 class="case__title">${escapeHtml(result.name || 'unnamed')}</h2>
          <p class="case__message">${escapeHtml(details || 'No differences reported')}</p>
        </div>
        <div class="case__status">
          <span class="pill ${statusClass}">${escapeHtml(statusLabel)}</span>
        </div>
      </div>
      <div class="media-grid">
        ${renderImagePanel('Baseline', result.snapshotPath, resultDirFromRoot)}
        ${renderImagePanel('Current', result.actualPath, resultDirFromRoot)}
        ${renderImagePanel('Diff', result.diffPath, resultDirFromRoot)}
      </div>
    </article>`;
}

function renderImagePanel(label, filePath, resultDirFromRoot) {
  const caption = filePath ? escapeHtml(filePath) : 'not available';
  const body = filePath
    ? `<div class="image-frame"><a href="${escapeAttribute(assetHref(filePath, resultDirFromRoot))}"><img src="${escapeAttribute(assetHref(filePath, resultDirFromRoot))}" alt="${escapeAttribute(`${label} ${filePath}`)}"></a></div>`
    : '<div class="empty">No image was written for this column.</div>';

  return `<figure>
          <figcaption><span>${escapeHtml(label)}</span>${filePath ? `<a href="${escapeAttribute(assetHref(filePath, resultDirFromRoot))}">${caption}</a>` : `<span>${caption}</span>`}</figcaption>
          ${body}
        </figure>`;
}

function assetHref(filePath, resultDirFromRoot) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(filePath)) return filePath;
  const relativePath = path.relative(resultDirFromRoot, filePath);
  return normalizePath(relativePath) || '.';
}

function normalizePath(filePath) {
  return filePath.split(path.sep).join('/');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
