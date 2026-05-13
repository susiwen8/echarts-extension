import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packagesDir = path.join(rootDir, 'packages');
const docsDir = path.join(rootDir, 'docs');
const templatesDir = path.join(docsDir, 'templates');
const optionsJsPath = path.join(docsDir, 'options.js');
const rawArgs = process.argv.slice(2);
const args = new Set(rawArgs);
const outputDirArg = readArgValue(rawArgs, '--out');
const outputDir = path.resolve(rootDir, outputDirArg || 'docs');
const writesExternalOutput = outputDir !== docsDir;
const shouldCompareHtmlOutput = Boolean(outputDirArg);
const optionsHtmlPath = path.join(outputDir, 'options.html');
const optionsZhHtmlPath = path.join(outputDir, 'options.zh.html');
const optionsHtmlTemplatePath = path.join(templatesDir, 'options.tpl');
const optionsZhHtmlTemplatePath = path.join(templatesDir, 'options.zh.tpl');

const START_MARKER = '<!-- OPTIONS:START -->';
const END_MARKER = '<!-- OPTIONS:END -->';
const OPTIONS_NAV_START = '<!-- OPTIONS_NAV:START -->';
const OPTIONS_NAV_END = '<!-- OPTIONS_NAV:END -->';
const OPTIONS_LIST_START = '<!-- OPTIONS_LIST:START -->';
const OPTIONS_LIST_END = '<!-- OPTIONS_LIST:END -->';
const PACKAGE_ORDER = [
  'echarts-layout-core',
  'echarts-radial',
  'echarts-concentric',
  'echarts-grid',
  'echarts-mds',
  'echarts-arc',
  'echarts-radial-area',
  'echarts-radial-boxplot',
  'echarts-venn',
  'echarts-pack-bubble',
  'echarts-circle-packing',
  'echarts-nested-circle',
  'echarts-organization-chart',
  'echarts-mosaic',
  'echarts-voronoi-treemap',
  'echarts-subway',
  'echarts-sequence-diagram',
  'echarts-cause-effect',
  'echarts-flame',
  'echarts-sunrise-sunset',
  'echarts-lollipop',
  'echarts-beeswarm',
  'echarts-spiral',
  'echarts-smith',
  'echarts-vector-field',
  'echarts-fisheye',
  'echarts-fractal'
];

const shouldWriteReadmes = args.has('--write-readmes');
const shouldCheck = args.has('--check');

if (shouldCheck && shouldWriteReadmes) {
  throw new Error('--check and --write-readmes cannot be used together.');
}

if (args.has('--help')) {
  console.log(`Usage:
  node scripts/sync-options-from-readmes.mjs
  node scripts/sync-options-from-readmes.mjs --out .pages/docs
  node scripts/sync-options-from-readmes.mjs --write-readmes
  node scripts/sync-options-from-readmes.mjs --check

Default mode parses generated Options tables from package README.md and README_CN.md files, then rewrites docs/options.html, docs/options.zh.html, and the lightweight docs/options.js interaction script.
--out writes only the generated HTML files to another docs output directory, leaving docs/options.js untouched.
--write-readmes normalizes README.md and README_CN.md option tables from their current generated sections.
--check validates README option data and tracked docs/options.js without writing ignored HTML files. When --out is provided, --check also compares the generated HTML with that output directory.
`);
  process.exit(0);
}

if (shouldWriteReadmes) {
  await writePackageReadmes();
}

const optionReferences = await readOptionReferencesFromReadmes('en');
const zhOptionReferences = await readOptionReferencesFromReadmes('zh');
const nextOptionsJs = buildOptionsJs();
const nextOptionsHtml = await buildOptionsHtml(optionReferences, 'en');
const nextOptionsZhHtml = await buildOptionsHtml(zhOptionReferences, 'zh', optionReferences);

if (shouldCheck) {
  const staleFiles = [];
  if (!writesExternalOutput) await collectStaleFile(optionsJsPath, nextOptionsJs, staleFiles);
  if (shouldCompareHtmlOutput) {
    await collectStaleFile(optionsHtmlPath, nextOptionsHtml, staleFiles);
    await collectStaleFile(optionsZhHtmlPath, nextOptionsZhHtml, staleFiles);
  }

  if (staleFiles.length) {
    throw new Error(`Options docs are stale. Regenerate tracked files or the checked output directory. Stale: ${staleFiles.join(', ')}`);
  }
  console.log(shouldCompareHtmlOutput
    ? 'Options docs are in sync with package README option tables.'
    : 'Option README data can generate docs pages.');
} else {
  await mkdir(outputDir, { recursive: true });
  if (!writesExternalOutput) await writeFile(optionsJsPath, nextOptionsJs);
  await writeFile(optionsHtmlPath, nextOptionsHtml);
  await writeFile(optionsZhHtmlPath, nextOptionsZhHtml);
  console.log('Generated SSG options docs from package README option tables.');
}

async function collectStaleFile(filePath, nextContent, staleFiles) {
  let currentContent = '';
  try {
    currentContent = await readFile(filePath, 'utf8');
  } catch {
    staleFiles.push(path.relative(rootDir, filePath));
    return;
  }
  if (currentContent !== nextContent) staleFiles.push(path.relative(rootDir, filePath));
}

async function writePackageReadmes() {
  const optionReferencesByLocale = {
    en: new Map((await readOptionReferencesFromReadmes('en')).map((optionCase) => [optionCase.packageName, optionCase])),
    zh: new Map((await readOptionReferencesFromReadmes('zh')).map((optionCase) => [optionCase.packageName, optionCase]))
  };
  const available = new Set(await packageNamesFromDisk());

  for (const packageName of orderedPackageNames(available)) {
    const packageDir = path.join(packagesDir, packageName);
    const readmePath = path.join(packageDir, 'README.md');
    const readmeCnPath = path.join(packageDir, 'README_CN.md');
    const optionCase = optionReferencesByLocale.en.get(packageName);
    const zhOptionCase = optionReferencesByLocale.zh.get(packageName);
    if (!optionCase) throw new Error(`No English options data found for ${packageName}`);

    await updateReadmeOptionsSection(readmePath, createOptionsSection(optionCase, 'en'));
    if (existsSync(readmeCnPath)) {
      await updateReadmeOptionsSection(readmeCnPath, createOptionsSection(zhOptionCase || optionCase, 'zh'));
    }
  }

  console.log('Normalized package README option tables from current generated sections.');
}

async function updateReadmeOptionsSection(readmePath, section) {
  const readme = await readFile(readmePath, 'utf8');
  const next = replaceMarkedSection(readme, section)
    ?? replaceLegacyOptionsSection(readme, section)
    ?? `${readme.trimEnd()}\n\n${section}\n`;

  await writeFile(readmePath, next);
}

function replaceMarkedSection(readme, section) {
  const start = readme.indexOf(START_MARKER);
  const end = readme.indexOf(END_MARKER);
  if (start < 0 || end < 0 || end < start) return null;
  const before = readme.slice(0, start).trimEnd();
  const after = readme.slice(end + END_MARKER.length).trimStart();
  return `${before}\n\n${section}\n${after ? `\n${after}` : ''}`;
}

function replaceLegacyOptionsSection(readme, section) {
  const legacyHeading = /^## (Useful Options|Options|选项|常用配置|配置项)\s*$/m.exec(readme);
  if (!legacyHeading) return null;

  const start = legacyHeading.index;
  const afterHeading = start + legacyHeading[0].length;
  const nextHeading = readme.slice(afterHeading).search(/^## /m);
  const end = nextHeading < 0 ? readme.length : afterHeading + nextHeading;
  const before = readme.slice(0, start).trimEnd();
  const after = readme.slice(end).trimStart();
  return `${before}\n\n${section}\n${after ? `\n${after}` : ''}`;
}

function createOptionsSection(optionCase, locale) {
  const isZh = locale === 'zh';
  const heading = isZh ? '## 配置项' : '## Options';
  const intro = isZh
    ? '此表由 `scripts/sync-options-from-readmes.mjs --write-readmes` 生成。更新 README 的配置表后，运行 `npm run docs:sync-options` 可刷新静态文档页。'
    : 'This table is generated by `scripts/sync-options-from-readmes.mjs --write-readmes`. Update the README option table, then run `npm run docs:sync-options` to refresh the static docs page.';
  const headers = isZh ? ['配置项', '说明', '可选值'] : ['Option', 'Description', 'Values'];
  const rows = optionCase.options.map((option) => [
    inlineCode(option.option),
    option.description,
    inlineCode(option.values)
  ]);

  return [
    heading,
    '',
    START_MARKER,
    intro,
    '',
    markdownTable(headers, rows),
    END_MARKER
  ].join('\n');
}

function markdownTable(headers, rows) {
  const header = `| ${headers.map(escapeTableCell).join(' | ')} |`;
  const divider = `| ${headers.map(() => '---').join(' | ')} |`;
  const body = rows.map((row) => `| ${row.map(escapeTableCell).join(' | ')} |`);
  return [header, divider, ...body].join('\n');
}

function inlineCode(value) {
  const text = String(value);
  if (!text) return '';
  if (!text.includes('`')) return `\`${text}\``;
  return text;
}

function escapeTableCell(value) {
  return String(value)
    .replace(/\n/g, '<br>')
    .replace(/\\/g, '\\\\')
    .replace(/\|/g, '\\|');
}

async function readOptionReferencesFromReadmes(locale) {
  const available = new Set(await packageNamesFromDisk());
  const packageNamesToRead = orderedPackageNames(available);
  const readmeFileName = locale === 'zh' ? 'README_CN.md' : 'README.md';

  return Promise.all(packageNamesToRead.map(async (packageName) => {
    const readmePath = path.join(packagesDir, packageName, readmeFileName);
    if (!existsSync(readmePath)) {
      throw new Error(`Missing ${readmeFileName} for ${packageName}`);
    }
    const readme = await readFile(readmePath, 'utf8');
    return {
      id: packageName,
      packageName,
      title: titleForPackage(packageName, locale),
      links: linksForPackage(packageName, locale),
      options: parseOptionsTable(readme, readmePath, locale)
    };
  }));
}

function parseOptionsTable(readme, readmePath, locale) {
  const start = readme.indexOf(START_MARKER);
  const end = readme.indexOf(END_MARKER);
  if (start < 0 || end < 0 || end < start) {
    throw new Error(`Missing generated options section in ${path.relative(rootDir, readmePath)}`);
  }

  const lines = readme.slice(start + START_MARKER.length, end)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const headerIndex = lines.findIndex((line) => isOptionsTableHeader(line, locale));
  if (headerIndex < 0 || headerIndex + 1 >= lines.length) {
    throw new Error(`Missing options table header in ${path.relative(rootDir, readmePath)}`);
  }

  return lines.slice(headerIndex + 2)
    .filter((line) => line.startsWith('|'))
    .map((line) => splitMarkdownTableRow(line))
    .filter((cells) => cells.length >= 3)
    .map(([option, description, values]) => {
      const optionName = stripInlineCode(option);
      return {
        option: optionName,
        description: stripTrailingSentence(description),
        values: stripInlineCode(values),
        level: inferLevel(optionName)
      };
    });
}

function isOptionsTableHeader(line, locale) {
  if (!line.startsWith('|')) return false;
  if (locale === 'zh') return /配置项/.test(line) && /说明/.test(line) && /可选值/.test(line);
  return /Option/.test(line) && /Description/.test(line) && /Values/.test(line);
}

function splitMarkdownTableRow(line) {
  const trimmed = line.replace(/^\|/, '').replace(/\|$/, '');
  const cells = [];
  let cell = '';
  let escaped = false;
  let inCode = false;

  for (const char of trimmed) {
    if (escaped) {
      cell += char;
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (char === '`') {
      inCode = !inCode;
      cell += char;
      continue;
    }
    if (char === '|' && !inCode) {
      cells.push(cell.trim());
      cell = '';
      continue;
    }
    cell += char;
  }
  cells.push(cell.trim());
  return cells.map((value) => value.replace(/<br\s*\/?>/gi, '\n'));
}

function stripInlineCode(value) {
  const text = value.trim();
  if (text.startsWith('`') && text.endsWith('`')) {
    return text.slice(1, -1);
  }
  return text;
}

function stripTrailingSentence(value) {
  const text = value.trim();
  return text && !/[.!?。]$/.test(text) ? `${text}.` : text;
}

function inferLevel(optionName) {
  return optionName.includes('.') ? optionName.split('.').length - 1 : undefined;
}

async function buildOptionsHtml(optionReferences, locale, fallbackOptionReferences = []) {
  const htmlPath = locale === 'zh' ? optionsZhHtmlTemplatePath : optionsHtmlTemplatePath;
  const current = await readFile(htmlPath, 'utf8');
  const navMarkup = renderNav(optionReferences);
  const listMarkup = renderOptionsList(optionReferences, locale, fallbackOptionReferences);

  return replaceOptionsList(
    replaceOptionsNav(current, navMarkup),
    listMarkup,
    locale
  ).replace(/options\.js\?v=[A-Za-z0-9_.-]+/g, 'options.js?v=options-ssg-1');
}

function replaceOptionsNav(html, navMarkup) {
  const next = [
    '<nav id="options-nav" class="options-nav" aria-label="$1">',
    `        ${OPTIONS_NAV_START}`,
    navMarkup,
    `        ${OPTIONS_NAV_END}`,
    '      </nav>'
  ].join('\n');
  return html.replace(
    /<nav id="options-nav" class="options-nav" aria-label="([^"]+)">[\s\S]*?<\/nav>/,
    next
  );
}

function replaceOptionsList(html, listMarkup, locale) {
  const marked = new RegExp(`${escapeRegExp(OPTIONS_LIST_START)}[\\s\\S]*?${escapeRegExp(OPTIONS_LIST_END)}`);
  const nextMarked = [
    OPTIONS_LIST_START,
    listMarkup,
    `        ${OPTIONS_LIST_END}`
  ].join('\n');
  if (marked.test(html)) return html.replace(marked, nextMarked);

  const loadingText = locale === 'zh' ? '正在加载配置项文档...' : 'Loading option reference...';
  const loadingBlock = [
    '      <div id="options-list" class="options-list">',
    `        <p class="option-status">${loadingText}</p>`,
    '      </div>'
  ].join('\n');
  const nextBlock = [
    '      <div id="options-list" class="options-list">',
    `        ${OPTIONS_LIST_START}`,
    listMarkup,
    `        ${OPTIONS_LIST_END}`,
    '      </div>'
  ].join('\n');

  if (!html.includes(loadingBlock)) {
    throw new Error(`Unable to locate options list block in ${locale === 'zh' ? 'docs/options.zh.html' : 'docs/options.html'}`);
  }
  return html.replace(loadingBlock, nextBlock);
}

function renderNav(optionReferences) {
  return optionReferences.map((optionCase, index) => {
    const activeClass = index === 0 ? ' class="options-nav__link--active"' : '';
    return `        <a href="#${escapeAttribute(optionCase.id)}" data-option-target="${escapeAttribute(optionCase.id)}" aria-current="${index === 0 ? 'true' : 'false'}"${activeClass}>${escapeHtml(optionCase.title)}</a>`;
  }).join('\n');
}

function renderOptionsList(optionReferences, locale, fallbackOptionReferences) {
  const fallbackById = new Map(fallbackOptionReferences.map((optionCase) => [optionCase.id, optionCase]));
  return optionReferences.map((optionCase, index) => (
    renderOptionCard(optionCase, locale, index === 0, fallbackById.get(optionCase.id))
  )).join('\n');
}

function renderOptionCard(optionCase, locale, visible, fallbackOptionCase) {
  const fallbackTitle = fallbackOptionCase?.title || titleForPackage(optionCase.packageName, 'en');
  const searchText = normalizeSearchText(uniqueTextParts([optionCase.title, fallbackTitle, optionCase.packageName]).join(' '));
  const fallbackOptionsByName = new Map((fallbackOptionCase?.options || []).map((option) => [option.option, option]));
  const tree = createOptionTree(optionCase.options);

  return [
    `        <article class="option-card" id="${escapeAttribute(optionCase.id)}"${visible ? '' : ' hidden'} data-search-visible="true" data-search-text="${escapeAttribute(searchText)}">`,
    '          <header class="option-card__header">',
    '            <div>',
    `              <h2>${escapeHtml(optionCase.title)}</h2>`,
    '              <div class="option-card__meta">',
    `                <span>${escapeHtml(optionCase.packageName)}</span>`,
    `                <span>${optionCase.options.length} ${locale === 'zh' ? '个配置项' : 'options'}</span>`,
    ...optionCase.links.map((link) => `                <a href="${escapeAttribute(link.href)}">${escapeHtml(link.label)}</a>`),
    '              </div>',
    '            </div>',
    '          </header>',
    '          <div class="option-table-wrap">',
    '            <table class="option-table">',
    '              <thead>',
    '                <tr>',
    ...(locale === 'zh' ? ['配置项', '说明', '可选值'] : ['Option', 'Description', 'Values']).map((label) => `                  <th scope="col">${label}</th>`),
    '                </tr>',
    '              </thead>',
    '              <tbody>',
    ...optionCase.options.map((option, rowIndex) => renderOptionRow(option, tree[rowIndex], fallbackOptionsByName.get(option.option), locale)),
    '              </tbody>',
    '            </table>',
    '          </div>',
    '        </article>'
  ].join('\n');
}

function renderOptionRow(option, node, fallbackOption, locale) {
  const classes = [];
  if (node.childIndexes.length) classes.push('option-table__row--expandable');
  if (option.level) {
    classes.push('option-table__row--nested', `option-table__row--level-${Math.min(option.level, 3)}`);
  }
  const attributes = [
    `data-option-index="${node.index}"`,
    `data-option-name="${escapeAttribute(option.option)}"`,
    `data-level="${option.level || 0}"`,
    `data-search-text="${escapeAttribute(searchTextForOption(option, fallbackOption))}"`
  ];
  if (node.parentIndex >= 0) attributes.push(`data-parent-index="${node.parentIndex}"`, 'hidden');
  if (node.childIndexes.length) {
    attributes.push(`data-child-indexes="${node.childIndexes.join(',')}"`, 'data-expanded="false"');
  }
  if (classes.length) attributes.push(`class="${classes.join(' ')}"`);

  return [
    `                <tr ${attributes.join(' ')}>`,
    '                  <td class="option-table__name">',
    '                    <span class="option-table__name-content">',
    renderOptionToggle(node, option.option, locale),
    `                      <code>${escapeHtml(option.option)}</code>`,
    '                    </span>',
    '                  </td>',
    `                  <td>${escapeHtml(option.description)}</td>`,
    `                  <td class="option-table__values">${escapeHtml(option.values)}</td>`,
    '                </tr>'
  ].join('\n');
}

function renderOptionToggle(node, optionName, locale) {
  if (!node.childIndexes.length) {
    return '                      <span class="option-toggle-spacer" aria-hidden="true"></span>';
  }
  return `                      <button class="option-toggle" type="button" aria-expanded="false" aria-label="${escapeAttribute(formatToggleLabel(false, optionName, locale))}">+</button>`;
}

function searchTextForOption(option, fallbackOption) {
  return normalizeSearchText(uniqueTextParts([
    option.option,
    option.description,
    option.values,
    fallbackOption?.description,
    fallbackOption?.values
  ]).join(' '));
}

function uniqueTextParts(parts) {
  const seen = new Set();
  return parts.filter((part) => {
    const text = String(part || '').trim();
    const key = text.toLowerCase();
    if (!text || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function createOptionTree(options) {
  const lastIndexByName = new Map();
  const nodes = options.map((option, index) => ({
    index,
    optionName: option.option,
    parentIndex: -1,
    childIndexes: []
  }));

  options.forEach((option, index) => {
    const parentIndex = findParentIndex(option.option, lastIndexByName);
    nodes[index].parentIndex = parentIndex;
    if (parentIndex >= 0) nodes[parentIndex].childIndexes.push(index);
    lastIndexByName.set(option.option, index);
  });

  return nodes;
}

function findParentIndex(optionName, indexByName) {
  const parts = optionName.split('.');
  while (parts.length > 1) {
    parts.pop();
    const parentName = parts.join('.');
    if (indexByName.has(parentName)) return indexByName.get(parentName);
  }
  return -1;
}

function formatToggleLabel(expanded, optionName, locale) {
  if (locale === 'zh') return `${expanded ? '收起' : '展开'} ${optionName} 配置项`;
  return `${expanded ? 'Collapse' : 'Expand'} ${optionName} options`;
}

function buildOptionsJs() {
  return `(function () {
  const LOCALE = document.documentElement.lang.toLowerCase().startsWith('zh') ? 'zh' : 'en';
  const IS_ZH = LOCALE === 'zh';
  const UI = {
    expand: IS_ZH ? '展开' : 'Expand',
    collapse: IS_ZH ? '收起' : 'Collapse',
    optionsLabel: IS_ZH ? '配置项' : 'options',
    noMatches: IS_ZH ? '没有匹配的配置项。' : 'No matching options.',
    packages: IS_ZH ? '个图表。' : 'packages.',
    matchingPackage: IS_ZH ? '个匹配图表。' : 'matching package.',
    matchingPackages: IS_ZH ? '个匹配图表。' : 'matching packages.'
  };
  let activeOptionCaseId = '';

  document.addEventListener('DOMContentLoaded', initializeOptionsPage);

  function initializeOptionsPage() {
    document.querySelectorAll('.option-card tbody').forEach(initializeOptionTree);
    initializeOptionSelection();
    initializeOptionSearch();
  }

  function initializeOptionTree(tbody) {
    const rowsByIndex = new Map(Array.from(tbody.rows).map((row) => [row.dataset.optionIndex, row]));
    tbody.addEventListener('click', (event) => {
      if (document.body.classList.contains('options-page--searching')) return;

      const target = event.target instanceof Element ? event.target : event.target.parentElement;
      if (!target) return;

      const toggle = target.closest('.option-toggle');
      const nameCell = target.closest('.option-table__name');
      if (!toggle && !nameCell) return;

      const row = (toggle || nameCell).closest('tr');
      if (!row || row.dataset.expanded === undefined) return;
      toggleOptionRow(row, rowsByIndex);
    });
  }

  function toggleOptionRow(row, rowsByIndex) {
    const expanded = row.dataset.expanded !== 'true';
    setOptionRowExpanded(row, expanded);
    if (expanded) {
      showDirectChildren(row, rowsByIndex);
    } else {
      collapseDescendants(row, rowsByIndex);
    }
  }

  function showDirectChildren(row, rowsByIndex) {
    getDirectChildren(row, rowsByIndex).forEach((child) => {
      child.hidden = false;
      if (child.dataset.expanded === 'true') showDirectChildren(child, rowsByIndex);
    });
  }

  function collapseDescendants(row, rowsByIndex) {
    getDirectChildren(row, rowsByIndex).forEach((child) => {
      child.hidden = true;
      if (child.dataset.expanded !== undefined) setOptionRowExpanded(child, false);
      collapseDescendants(child, rowsByIndex);
    });
  }

  function getDirectChildren(row, rowsByIndex) {
    return (row.dataset.childIndexes || '')
      .split(',')
      .filter(Boolean)
      .map((index) => rowsByIndex.get(index))
      .filter(Boolean);
  }

  function setOptionRowExpanded(row, expanded) {
    row.dataset.expanded = expanded ? 'true' : 'false';
    const toggle = row.querySelector('.option-toggle');
    if (!toggle) return;
    toggle.textContent = expanded ? '-' : '+';
    toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    toggle.setAttribute('aria-label', formatToggleLabel(expanded, row.dataset.optionName));
  }

  function initializeOptionSearch() {
    const input = document.getElementById('options-search');
    const clear = document.getElementById('options-search-clear');
    if (!(input instanceof HTMLInputElement) || !(clear instanceof HTMLButtonElement)) return;

    input.addEventListener('input', () => {
      applyOptionSearch(input.value);
    });
    input.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || !input.value) return;
      input.value = '';
      applyOptionSearch('');
    });
    clear.addEventListener('click', () => {
      input.value = '';
      applyOptionSearch('');
      input.focus();
    });

    applyOptionSearch(input.value);
  }

  function initializeOptionSelection() {
    const nav = document.getElementById('options-nav');
    if (!nav) return;

    nav.addEventListener('click', (event) => {
      const target = event.target instanceof Element ? event.target : event.target.parentElement;
      const link = target ? target.closest('[data-option-target]') : null;
      if (!(link instanceof HTMLAnchorElement) || link.hidden) return;

      event.preventDefault();
      selectOptionCase(link.dataset.optionTarget, { updateHash: true });
    });

    window.addEventListener('hashchange', () => {
      const hashId = getHashOptionCaseId();
      if (hashId) selectOptionCase(hashId, { updateHash: false });
    });

    activeOptionCaseId = getHashOptionCaseId() || getFirstSelectableOptionCaseId();
    applyActiveOptionCase();
  }

  function applyOptionSearch(rawQuery) {
    const query = normalizeSearchText(rawQuery);
    const searching = Boolean(query);
    const cards = Array.from(document.querySelectorAll('.option-card'));
    let visibleCards = 0;
    let directMatches = 0;
    let packageMatches = 0;

    document.body.classList.toggle('options-page--searching', searching);

    const selectableIds = [];

    cards.forEach((card) => {
      const stats = searching ? filterOptionCard(card, query) : restoreOptionCard(card);
      visibleCards += stats.visible ? 1 : 0;
      directMatches += stats.matches;
      packageMatches += stats.packageMatch ? 1 : 0;
      card.dataset.searchVisible = stats.visible ? 'true' : 'false';
      if (stats.visible) selectableIds.push(card.id);
      const navLink = document.querySelector(\`[data-option-target="\${card.id}"]\`);
      if (navLink) navLink.hidden = !stats.visible;
    });

    if (!selectableIds.includes(activeOptionCaseId)) {
      activeOptionCaseId = selectableIds[0] || '';
    }
    applyActiveOptionCase();
    updateSearchStatus(searching, directMatches, packageMatches, visibleCards, cards.length);
  }

  function filterOptionCard(card, query) {
    const rows = Array.from(card.querySelectorAll('tbody tr'));
    const rowsByIndex = new Map(rows.map((row) => [row.dataset.optionIndex, row]));
    const visibleIndexes = new Set();
    const matchIndexes = new Set();
    const cardMatches = (card.dataset.searchText || '').includes(query);

    rows.forEach((row) => {
      if ((row.dataset.searchText || '').includes(query)) {
        matchIndexes.add(row.dataset.optionIndex);
        includeSearchContext(row, rowsByIndex, visibleIndexes);
      }
    });

    const packageMatch = cardMatches && !matchIndexes.size;
    if (packageMatch) {
      rows.forEach((row) => {
        if (!row.dataset.parentIndex) visibleIndexes.add(row.dataset.optionIndex);
      });
    }

    rows.forEach((row) => {
      row.hidden = !visibleIndexes.has(row.dataset.optionIndex);
      row.classList.toggle('option-table__row--search-match', matchIndexes.has(row.dataset.optionIndex));
      const toggle = row.querySelector('.option-toggle');
      if (toggle) toggle.disabled = true;
    });

    const visible = visibleIndexes.size > 0;
    return { visible, matches: matchIndexes.size, packageMatch };
  }

  function restoreOptionCard(card) {
    const rows = Array.from(card.querySelectorAll('tbody tr'));
    const rowsByIndex = new Map(rows.map((row) => [row.dataset.optionIndex, row]));

    rows.forEach((row) => {
      row.hidden = row.dataset.parentIndex ? !areAncestorsExpanded(row, rowsByIndex) : false;
      row.classList.remove('option-table__row--search-match');
      const toggle = row.querySelector('.option-toggle');
      if (toggle) toggle.disabled = false;
    });

    return { visible: true, matches: 0, packageMatch: false };
  }

  function includeSearchContext(row, rowsByIndex, visibleIndexes) {
    visibleIndexes.add(row.dataset.optionIndex);
    includeAncestors(row, rowsByIndex, visibleIndexes);
    includeDescendants(row, rowsByIndex, visibleIndexes);
  }

  function includeAncestors(row, rowsByIndex, visibleIndexes) {
    let parent = rowsByIndex.get(row.dataset.parentIndex);
    while (parent) {
      visibleIndexes.add(parent.dataset.optionIndex);
      parent = rowsByIndex.get(parent.dataset.parentIndex);
    }
  }

  function includeDescendants(row, rowsByIndex, visibleIndexes) {
    getDirectChildren(row, rowsByIndex).forEach((child) => {
      visibleIndexes.add(child.dataset.optionIndex);
      includeDescendants(child, rowsByIndex, visibleIndexes);
    });
  }

  function areAncestorsExpanded(row, rowsByIndex) {
    let parent = rowsByIndex.get(row.dataset.parentIndex);
    while (parent) {
      if (parent.dataset.expanded !== 'true') return false;
      parent = rowsByIndex.get(parent.dataset.parentIndex);
    }
    return true;
  }

  function updateSearchStatus(searching, matches, packageMatches, visibleCards, totalCards) {
    const status = document.getElementById('options-search-status');
    if (!status) return;

    if (!searching) {
      status.textContent = IS_ZH ? \`\${totalCards} \${UI.packages}\` : \`\${totalCards} \${UI.packages}\`;
      return;
    }
    if (!matches && !visibleCards) {
      status.textContent = UI.noMatches;
      return;
    }
    if (!matches && packageMatches) {
      status.textContent = IS_ZH
        ? \`\${packageMatches} \${UI.matchingPackages}\`
        : \`\${packageMatches} \${packageMatches === 1 ? UI.matchingPackage : UI.matchingPackages}\`;
      return;
    }
    status.textContent = IS_ZH
      ? \`\${visibleCards} 个图表中有 \${matches} 个匹配配置项。\`
      : \`\${matches} matching options in \${visibleCards} packages.\`;
  }

  function selectOptionCase(optionCaseId, { updateHash = false } = {}) {
    const card = document.getElementById(optionCaseId);
    if (!card || card.dataset.searchVisible === 'false') return;

    activeOptionCaseId = optionCaseId;
    if (updateHash && window.location.hash !== \`#\${optionCaseId}\`) {
      window.history.pushState(null, '', \`#\${optionCaseId}\`);
    }
    applyActiveOptionCase();
  }

  function applyActiveOptionCase() {
    const cards = Array.from(document.querySelectorAll('.option-card'));
    if (!activeOptionCaseId) {
      cards.forEach((card) => {
        card.hidden = true;
      });
      updateActiveNavLink('');
      return;
    }

    cards.forEach((card) => {
      card.hidden = card.id !== activeOptionCaseId || card.dataset.searchVisible === 'false';
    });
    updateActiveNavLink(activeOptionCaseId);
  }

  function updateActiveNavLink(optionCaseId) {
    document.querySelectorAll('[data-option-target]').forEach((link) => {
      const active = link.dataset.optionTarget === optionCaseId;
      link.classList.toggle('options-nav__link--active', active);
      link.setAttribute('aria-current', active ? 'true' : 'false');
    });
  }

  function getHashOptionCaseId() {
    const id = window.location.hash ? decodeURIComponent(window.location.hash.slice(1)) : '';
    return id && document.getElementById(id) ? id : '';
  }

  function getFirstSelectableOptionCaseId() {
    const link = Array.from(document.querySelectorAll('[data-option-target]')).find((item) => !item.hidden);
    return link?.dataset.optionTarget || document.querySelector('.option-card')?.id || '';
  }

  function formatToggleLabel(expanded, optionName) {
    return \`\${expanded ? UI.collapse : UI.expand} \${optionName} \${UI.optionsLabel}\`;
  }

  function normalizeSearchText(value) {
    return String(value || '').trim().toLowerCase();
  }
})();
`;
}

async function packageNamesFromDisk() {
  const entries = await readdir(packagesDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && existsSync(path.join(packagesDir, entry.name, 'README.md')))
    .map((entry) => entry.name);
}

function orderedPackageNames(available) {
  return [
    ...PACKAGE_ORDER.filter((packageName) => available.has(packageName)),
    ...Array.from(available).filter((packageName) => !PACKAGE_ORDER.includes(packageName)).sort()
  ];
}

function titleForPackage(packageName, locale) {
  const titles = {
    en: {
      'echarts-layout-core': 'Layout Core',
      'echarts-cause-effect': 'Cause and Effect',
      'echarts-mds': 'MDS'
    },
    zh: {
      'echarts-layout-core': '布局核心',
      'echarts-radial': '径向图',
      'echarts-concentric': '同心图',
      'echarts-grid': '网格图',
      'echarts-mds': 'MDS 图',
      'echarts-arc': '弧形图',
      'echarts-radial-area': '径向面积图',
      'echarts-radial-boxplot': '径向箱线图',
      'echarts-venn': '韦恩图',
      'echarts-pack-bubble': '打包气泡图',
      'echarts-circle-packing': '圆形打包图',
      'echarts-nested-circle': '嵌套圆图',
      'echarts-organization-chart': '组织结构图',
      'echarts-mosaic': '马赛克图',
      'echarts-voronoi-treemap': 'Voronoi 矩形树图',
      'echarts-subway': '地铁线路图',
      'echarts-sequence-diagram': '时序图',
      'echarts-cause-effect': '因果图',
      'echarts-flame': '火焰图',
      'echarts-sunrise-sunset': '日出日落图',
      'echarts-lollipop': '棒棒糖图',
      'echarts-beeswarm': '蜂群图',
      'echarts-spiral': '螺旋图',
      'echarts-smith': '史密斯圆图',
      'echarts-vector-field': '向量场',
      'echarts-fisheye': '鱼眼组件',
      'echarts-fractal': '分形图'
    }
  };
  if (titles[locale]?.[packageName]) return titles[locale][packageName];
  return packageName
    .replace(/^echarts-/, '')
    .split('-')
    .map((part) => part.toUpperCase() === 'MDS' ? 'MDS' : part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function linksForPackage(packageName, locale) {
  const exampleLabel = locale === 'zh' ? '示例' : 'Example';
  if (packageName === 'echarts-venn') {
    return [
      { href: './packages/echarts-venn/hollow.html', label: locale === 'zh' ? '空心示例' : 'Hollow example' },
      { href: './packages/echarts-venn/bubble.html', label: locale === 'zh' ? '气泡示例' : 'Bubble example' }
    ];
  }
  return [{ href: `./packages/${packageName}/`, label: exampleLabel }];
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeSearchText(value) {
  return String(value || '').trim().toLowerCase();
}

function readArgValue(values, name) {
  const index = values.indexOf(name);
  if (index < 0) return '';
  const value = values[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`${name} requires a value.`);
  }
  return value;
}
