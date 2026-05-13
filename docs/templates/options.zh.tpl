<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ECharts Extension 配置项文档</title>
  <link rel="icon" href="../favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="./shared/demo-page.css?v=interactions-4">
  <style>
    .options-page {
      background: #f5f7fb;
    }

    .options-layout {
      display: grid;
      grid-template-columns: minmax(190px, 240px) minmax(0, 1fr);
      gap: 18px;
      width: min(1360px, calc(100% - 36px));
      margin: 24px auto 64px;
    }

    .options-search {
      display: grid;
      gap: 8px;
      width: min(1360px, calc(100% - 36px));
      margin: 18px auto 0;
      padding: 14px 16px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #ffffff;
      box-shadow: 0 8px 28px rgba(23, 32, 51, 0.06);
    }

    .options-search__label {
      color: #172033;
      font-size: 12px;
      font-weight: 780;
      text-transform: uppercase;
    }

    .options-search__field {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 8px;
      align-items: center;
    }

    .options-search__field input {
      width: 100%;
      min-width: 0;
      height: 40px;
      border: 1px solid #cad4e5;
      border-radius: 6px;
      color: #172033;
      font: 13px/1.4 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      padding: 0 12px;
    }

    .options-search__field input:focus {
      border-color: #8fa6d4;
      outline: 3px solid #e7eefc;
    }

    .options-search__field button {
      height: 40px;
      border: 1px solid #cad4e5;
      border-radius: 6px;
      background: #f7f9fd;
      color: #26344d;
      cursor: pointer;
      font-size: 12px;
      font-weight: 760;
      padding: 0 12px;
    }

    .options-search__field button:hover,
    .options-search__field button:focus-visible {
      border-color: #8fa6d4;
      background: #eef3ff;
      outline: none;
    }

    .options-search__status {
      min-height: 18px;
      margin: 0;
      color: var(--muted);
      font-size: 12px;
      font-weight: 720;
    }

    .options-nav {
      position: sticky;
      top: 18px;
      display: grid;
      align-self: start;
      max-height: calc(100vh - 36px);
      overflow: auto;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #ffffff;
      box-shadow: 0 8px 28px rgba(23, 32, 51, 0.06);
    }

    .options-nav a {
      padding: 10px 12px;
      border-bottom: 1px solid var(--line);
      color: #26344d;
      font-size: 12px;
      font-weight: 740;
      text-decoration: none;
    }

    .options-nav a:hover {
      color: #163f9f;
      background: #f7f9fd;
    }

    .options-nav a[aria-current="true"] {
      color: #0f327d;
      background: #edf3ff;
      box-shadow: inset 3px 0 0 #1f5fcc;
    }

    .options-nav a:last-child {
      border-bottom: 0;
    }

    .options-list {
      display: grid;
      gap: 18px;
      min-width: 0;
    }

    .option-card {
      min-width: 0;
      overflow: hidden;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #ffffff;
      box-shadow: var(--shadow);
    }

    .option-card__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      padding: 14px 16px;
      border-bottom: 1px solid var(--line);
      background: #fbfcff;
    }

    .option-card h2 {
      margin: 0;
      color: #172033;
      font-size: 18px;
      line-height: 1.2;
      letter-spacing: 0;
    }

    .option-card__meta {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;
      color: var(--muted);
      font-size: 12px;
      font-weight: 720;
    }

    .option-card__meta a {
      color: #163f9f;
      text-decoration: none;
    }

    .option-card__meta a:hover {
      text-decoration: underline;
    }

    .option-table-wrap {
      width: 100%;
      overflow-x: auto;
    }

    .option-table {
      width: 100%;
      min-width: 780px;
      border-collapse: collapse;
      table-layout: fixed;
      color: #26344d;
      font-size: 13px;
      line-height: 1.5;
    }

    .option-table th,
    .option-table td {
      padding: 11px 14px;
      border-bottom: 1px solid var(--line);
      vertical-align: top;
      text-align: left;
    }

    .option-table th {
      background: #f7f9fd;
      color: #172033;
      font-size: 12px;
      font-weight: 780;
      text-transform: uppercase;
    }

    .option-table th:nth-child(1),
    .option-table td:nth-child(1) {
      width: 28%;
    }

    .option-table th:nth-child(2),
    .option-table td:nth-child(2) {
      width: 42%;
    }

    .option-table th:nth-child(3),
    .option-table td:nth-child(3) {
      width: 30%;
    }

    .option-table tr:last-child td {
      border-bottom: 0;
    }

    .option-table__row--nested td {
      background: #fbfcff;
    }

    .option-table__row--expandable .option-table__name {
      cursor: pointer;
    }

    .option-table__name-content {
      display: flex;
      align-items: flex-start;
      gap: 7px;
      min-width: 0;
    }

    .option-toggle,
    .option-toggle-spacer {
      flex: 0 0 18px;
      width: 18px;
      height: 18px;
      margin-top: 1px;
    }

    .option-toggle {
      display: inline-grid;
      place-items: center;
      border: 1px solid #cad4e5;
      border-radius: 4px;
      background: #ffffff;
      color: #163f9f;
      cursor: pointer;
      font: 700 13px/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      padding: 0;
    }

    .option-toggle:hover,
    .option-toggle:focus-visible {
      border-color: #8fa6d4;
      background: #f2f6ff;
      outline: none;
    }

    .options-page--searching .option-toggle {
      visibility: hidden;
    }

    .option-table__row--search-match td {
      background: #fff8e6;
    }

    .option-table__row--level-1 .option-table__name {
      padding-left: 28px;
    }

    .option-table__row--level-2 .option-table__name {
      padding-left: 42px;
    }

    .option-table__row--level-3 .option-table__name {
      padding-left: 56px;
    }

    .option-table code {
      color: #163f9f;
      font: 12px/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      overflow-wrap: anywhere;
      white-space: normal;
    }

    .option-table__row--nested code {
      color: #2f5a85;
    }

    .option-table__values {
      color: #41506a;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 12px;
      overflow-wrap: anywhere;
    }

    .option-status {
      min-height: 42px;
      padding: 12px 16px;
      color: var(--muted);
      font-size: 13px;
      font-weight: 720;
    }

    @media (max-width: 900px) {
      .options-layout {
        grid-template-columns: 1fr;
      }

      .options-search__field {
        grid-template-columns: 1fr;
      }

      .options-nav {
        position: static;
        max-height: none;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      }

      .options-nav a {
        border-right: 1px solid var(--line);
      }
    }
  </style>
</head>
<body class="options-page">
  <main class="gallery-shell">
    <header class="demo-header">
      <div>
        <p class="eyebrow">ECharts Extension</p>
        <h1>图表配置项</h1>
        <p class="lede">各图表的配置项名称、说明和可选值。</p>
      </div>
      <nav class="demo-links" aria-label="文档导航">
        <a href="./">示例</a>
        <a href="./options.html">English</a>
      </nav>
    </header>

    <section class="options-search" aria-label="搜索图表配置项">
      <label class="options-search__label" for="options-search">搜索</label>
      <div class="options-search__field">
        <input id="options-search" type="search" placeholder="图表、配置项、说明或可选值" autocomplete="off">
        <button id="options-search-clear" type="button">清空</button>
      </div>
      <p id="options-search-status" class="options-search__status" aria-live="polite"></p>
    </section>

    <section class="options-layout" aria-label="图表配置项">
      <nav id="options-nav" class="options-nav" aria-label="图表配置导航">
        <!-- OPTIONS_NAV:START -->
        <!-- OPTIONS_NAV:END -->
      </nav>
      <div id="options-list" class="options-list">
        <!-- OPTIONS_LIST:START -->
        <!-- OPTIONS_LIST:END -->
      </div>
    </section>
  </main>
  <script defer src="./options.js?v=options-ssg-1"></script>
</body>
</html>
