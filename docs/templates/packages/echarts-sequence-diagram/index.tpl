<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>echarts-sequence-diagram example</title>
    <link rel="icon" href="../../../favicon.svg" type="image/svg+xml">
    <link rel="stylesheet" href="../../shared/demo-page.css?v=interactions-4">
    <style>
      html,
      body {
        height: 100%;
        overflow: hidden;
      }

      .demo-shell {
        display: flex;
        flex-direction: column;
        height: 100vh;
        min-height: 0;
        overflow: hidden;
      }

      .demo-header {
        flex: 0 0 auto;
      }

      .sequence-example-stage {
        flex: 1 1 auto;
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(340px, 420px);
        gap: 18px;
        min-height: 0;
        overflow: hidden;
        padding: clamp(16px, 3vw, 32px);
      }

      .sequence-example-stage .chart-frame {
        width: 100%;
        height: 100%;
        min-height: 0;
        margin: 0;
      }

      #chart {
        min-height: 0;
      }

      .sequence-example-stage .demo-controls {
        display: flex;
        flex-direction: column;
        height: 100%;
        max-height: none;
        min-width: 0;
        min-height: 0;
        overflow: auto;
      }

      .sequence-data-panel .demo-control-button:disabled {
        border-color: #d9e0ea;
        background: #f1f5f9;
        color: #94a3b8;
        cursor: not-allowed;
      }

      .sequence-data-panel .demo-control input[readonly],
      .sequence-data-panel .demo-control textarea[readonly],
      .sequence-data-panel .demo-option-editor__textarea[readonly] {
        background: #fbfcff;
      }

      .sequence-data-panel .demo-control__value {
        max-width: 48%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .sequence-data-panel .demo-control__textarea {
        height: min(38vh, 360px);
        min-height: 220px;
        resize: none;
        overflow: auto;
      }

      .sequence-data-panel .demo-option-editor {
        border-top: 1px solid var(--line);
      }

      .sequence-data-panel .demo-option-editor__textarea {
        height: min(34vh, 320px);
        min-height: 220px;
        resize: none;
        overflow: auto;
      }

      @media (max-width: 920px) {
        .sequence-example-stage .demo-controls {
          min-width: 280px;
        }
      }
    </style>
  </head>
  <body class="demo-page" data-example="sequence-diagram">
    <main class="demo-shell">
      <header class="demo-header">
        <div>
          <p class="eyebrow">echarts-sequence-diagram</p>
          <h1>Sequence Diagram</h1>
          <p>UML lifelines with ordered messages, fragments, notes, create/destroy lifecycles, and activation bars.</p>
        </div>
        <nav class="demo-links" aria-label="Example navigation">
          <a href="../../">All examples</a>
          <a href="../../options.html#echarts-sequence-diagram">Options</a>
          <a href="./large.html">Large data</a>
        </nav>
      </header>
      <section class="demo-stage sequence-example-stage">
        <div class="chart-frame"><div id="chart"></div></div>
        <aside class="demo-controls sequence-data-panel" aria-labelledby="sequence-controls-title">
          <div class="demo-controls__header">
            <h2 id="sequence-controls-title">Data</h2>
            <div class="demo-controls__actions">
              <button class="demo-control-button demo-control-button--primary" type="button" id="add-sequence-data">Add data</button>
            </div>
          </div>
          <form class="demo-controls__form">
            <label class="demo-control demo-control--text" for="sequence-data-summary">
              <span class="demo-control__topline">
                <span class="demo-control__label">Dataset</span>
                <span class="demo-control__value" id="sequence-data-count">0 lines added</span>
              </span>
              <input id="sequence-data-summary" type="text" readonly>
            </label>
            <label class="demo-control demo-control--json" for="sequence-source">
              <span class="demo-control__topline">
                <span class="demo-control__label">DSL</span>
                <span class="demo-control__value" id="sequence-source-summary">PlantUML / Mermaid</span>
              </span>
              <textarea id="sequence-source" class="demo-control__textarea" readonly spellcheck="false"></textarea>
            </label>
          </form>
          <details class="demo-option-editor" open>
            <summary>Complete option</summary>
            <textarea id="sequence-options" class="demo-option-editor__textarea" readonly spellcheck="false"></textarea>
          </details>
        </aside>
      </section>
    </main>
    <script src="../../../node_modules/echarts/dist/echarts.min.js"></script>
    <script src="../../../packages/echarts-sequence-diagram/dist/echarts-sequence-diagram.js"></script>
    <script>
      const baseDslLines = [
        'sequenceDiagram',
        '  actor shopper as Shopper',
        '  participant web as Web App',
        '  participant checkout as Checkout API',
        '  create participant session as Session',
        '  participant payment as Payment',
        '  shopper->>web: Place order',
        '  web->>+checkout: Create session',
        '  checkout->>session**: Open session',
        '  Note right of checkout: Validate cart and customer profile',
        '  opt saved card',
        '    checkout-->>web: reuse payment token',
        '  end',
        '  duration checkout,session: < 100ms',
        '  checkout-)payment: Authorize card',
        '  payment-->>checkout: authorization id',
        '  checkout->>checkout: reserve inventory'
      ];
      const closingDslLines = [
        '  checkout-->>-web: session ready',
        '  checkout-xsession: Close session',
        '  web-->>shopper: Show confirmation'
      ];
      const dynamicStepTemplates = [
        (index) => [
          `  checkout->>payment: Capture payment ${index}`,
          `  payment-->>checkout: capture ok ${index}`
        ],
        (index) => [
          `  checkout->>session: Write audit ${index}`,
          `  session-->>checkout: audit stored ${index}`
        ],
        (index) => [
          `  checkout->>checkout: Reprice cart ${index}`
        ]
      ];
      const dynamicDslLines = [];
      const minimumReadableMessageGap = 24;
      let sequenceDsl = buildSequenceDsl();

      const baseSeriesOption = {
        type: 'sequenceDiagram',
        animation: false,
        enterAnimation: false,
        lineStyle: {
          color: '#1e293b',
          width: 1.7
        },
        participantStyle: {
          color: '#ffffff',
          borderColor: '#2563eb'
        },
        activationStyle: {
          color: '#dbeafe',
          borderColor: '#2563eb'
        }
      };

      let chartOption = createChartOption();

      function createChartOption() {
        const adaptiveLayout = resolveAdaptiveLayout(sequenceDsl);
        return {
          backgroundColor: '#f8fafc',
          series: [
            {
              ...baseSeriesOption,
              dsl: sequenceDsl,
              left: 36,
              right: 36,
              top: adaptiveLayout.top,
              bottom: adaptiveLayout.bottom,
              padding: adaptiveLayout.padding,
              messageGap: adaptiveLayout.messageGap
            }
          ]
        };
      }

      function resolveAdaptiveLayout(source) {
        const chartElement = document.getElementById('chart');
        const width = chartElement.clientWidth || 800;
        const height = chartElement.clientHeight || 560;
        const top = Math.max(20, Math.min(38, Math.round(height * 0.06)));
        const bottom = Math.max(18, Math.min(30, Math.round(height * 0.045)));
        const horizontalPadding = Math.max(46, Math.min(64, Math.round(width * 0.08)));
        const paddingTop = Math.max(18, Math.min(24, Math.round(height * 0.04)));
        const paddingBottom = Math.max(18, Math.min(28, Math.round(height * 0.04)));
        const headerHeight = 34;
        const selfLoopHeight = 22;
        const messageCount = countDslMessages(source);
        const noteReserve = estimateDslNoteReserve(source);
        const rectHeight = Math.max(1, height - top - bottom);
        const messageTop = paddingTop + headerHeight + 36;
        const maxGap = messageCount > 1
          ? Math.floor((rectHeight - messageTop - noteReserve - selfLoopHeight - paddingBottom - 24) / (messageCount - 1))
          : 48;
        const messageGap = Math.max(minimumReadableMessageGap, Math.min(48, maxGap));

        return {
          messageCount,
          maxMessageCount: Math.max(1, Math.floor((rectHeight - messageTop - noteReserve - selfLoopHeight - paddingBottom - 24) / minimumReadableMessageGap) + 1),
          messageGap,
          top,
          bottom,
          padding: {
            top: paddingTop,
            right: horizontalPadding,
            bottom: paddingBottom,
            left: horizontalPadding
          }
        };
      }

      function buildSequenceDsl() {
        return [
          ...baseDslLines,
          ...dynamicDslLines,
          ...closingDslLines
        ].join('\n');
      }

      function addSequenceData() {
        const nextIndex = dynamicDslLines.length + 1;
        const template = dynamicStepTemplates[(nextIndex - 1) % dynamicStepTemplates.length];
        const candidateDsl = [
          ...baseDslLines,
          ...dynamicDslLines,
          ...template(nextIndex),
          ...closingDslLines
        ].join('\n');
        if (!canRenderDsl(candidateDsl)) {
          updateAddButtonState();
          return;
        }
        dynamicDslLines.push(...template(nextIndex));
        sequenceDsl = buildSequenceDsl();
        updateSourcePanels();
        renderChart();
      }

      function countDslMessages(source) {
        return source
          .split('\n')
          .filter((line) => /(-->>|-->|-\)|->>|->|-\]|-[xX]|\.{1,2}>>|\.{1,2}>|={1,2}>>|={1,2}>)/.test(line))
          .length;
      }

      function estimateDslNoteReserve(source) {
        const noteCount = source
          .split('\n')
          .filter((line) => /^\s*note\s+/i.test(line))
          .length;
        return noteCount * 42;
      }

      function renderChart() {
        chart.resize();
        chartOption = createChartOption();
        chart.setOption(chartOption, true);
        updateOptionsSource();
        updateAddButtonState();
      }

      function updateOptionsSource() {
        document.getElementById('sequence-options').value = `const option = ${formatValue(chartOption, 0)};`;
      }

      function updateSourcePanels() {
        const messageCount = countDslMessages(sequenceDsl);
        document.getElementById('sequence-source').value = sequenceDsl;
        document.getElementById('sequence-data-summary').value = `${messageCount} messages, ${dynamicDslLines.length} dynamic DSL lines`;
        document.getElementById('sequence-source-summary').textContent = `${messageCount} messages`;
        document.getElementById('sequence-data-count').textContent = `${dynamicDslLines.length} lines added`;
        updateOptionsSource();
        updateAddButtonState();
        scrollSourceToBottom();
      }

      function canRenderDsl(source) {
        const layout = resolveAdaptiveLayout(source);
        return layout.messageCount <= layout.maxMessageCount;
      }

      function updateAddButtonState() {
        const button = document.getElementById('add-sequence-data');
        const nextIndex = dynamicDslLines.length + 1;
        const template = dynamicStepTemplates[(nextIndex - 1) % dynamicStepTemplates.length];
        const candidateDsl = [
          ...baseDslLines,
          ...dynamicDslLines,
          ...template(nextIndex),
          ...closingDslLines
        ].join('\n');
        const layout = resolveAdaptiveLayout(candidateDsl);
        const canAdd = layout.messageCount <= layout.maxMessageCount;
        button.disabled = !canAdd;
        button.title = canAdd
          ? 'Append another message group to the sequence diagram'
          : 'The current chart height is full. Enlarge the window before adding more data.';
        document.getElementById('sequence-data-count').textContent = `${dynamicDslLines.length} lines added${canAdd ? '' : ' · full'}`;
      }

      function scrollSourceToBottom() {
        const source = document.getElementById('sequence-source');
        const options = document.getElementById('sequence-options');
        source.scrollTop = source.scrollHeight;
        options.scrollTop = options.scrollHeight;
      }

      const chart = echarts.init(document.getElementById('chart'));

      updateSourcePanels();

      requestAnimationFrame(renderChart);

      if ('ResizeObserver' in window) {
        const resizeObserver = new ResizeObserver(() => {
          requestAnimationFrame(renderChart);
        });
        resizeObserver.observe(document.getElementById('chart'));
      } else {
        window.addEventListener('resize', () => requestAnimationFrame(renderChart));
      }

      document.getElementById('add-sequence-data').addEventListener('click', addSequenceData);

      function formatValue(value, indent) {
        const pad = ' '.repeat(indent);
        const nextPad = ' '.repeat(indent + 2);

        if (Array.isArray(value)) {
          if (!value.length) return '[]';
          return `[\n${value.map((item) => `${nextPad}${formatValue(item, indent + 2)}`).join(',\n')}\n${pad}]`;
        }

        if (value && typeof value === 'object') {
          const entries = Object.entries(value);
          if (!entries.length) return '{}';
          return `{\n${entries.map(([key, item]) => `${nextPad}${key}: ${formatValue(item, indent + 2)}`).join(',\n')}\n${pad}}`;
        }

        if (typeof value === 'string') {
          if (value.includes('\n')) return `\`${escapeTemplateLiteral(value)}\``;
          return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
        }

        return String(value);
      }

      function escapeTemplateLiteral(value) {
        return value
          .replace(/\\/g, '\\\\')
          .replace(/`/g, '\\`')
          .replace(/\${/g, '\\${');
      }
    </script>
  </body>
</html>
