(function (root) {
  const namespace = root.EChartsExtensionLargeData = root.EChartsExtensionLargeData || {};
  const ONE_MILLION = 1000000;
  const DEFAULT_LARGE_THRESHOLD = 10000;
  const countPresets = [300, 1000, 10000, 100000, ONE_MILLION];
  const palette = ['#2454a6', '#248f6a', '#c77725', '#9c4f97', '#5f6fb4', '#c4554d', '#4b8f8c'];
  const detailZoomBreakpoints = [1, 1.35, 2.1, 3.1];

  const cases = {
    radial: graphCase('radial', 'Radial Large Graph', 100000, 4200, {
      trendLimit: 900,
      layout: { center: ['50%', '51%'], unitRadius: 18, linkDistance: 36, preventOverlap: false, sortBy: 'data', fast: true }
    }),
    concentric: graphCase('concentric', 'Concentric Large Graph', 100000, 5200, {
      trendLimit: 1000,
      layout: { center: ['50%', '51%'], maxLevelDiff: 1, preventOverlap: false, sortBy: 'degree' }
    }),
    grid: graphCase('grid', 'Grid Large Graph', 100000, 10000, {
      trendLimit: 1600,
      layout: { center: ['50%', '51%'], cols: 120, nodeSpacing: 0, preventOverlap: false, condense: false, sortBy: 'data' }
    }),
    mds: graphCase('mds', 'MDS Sampled Large Graph', 100000, 90, {
      layout: { center: ['50%', '51%'], linkDistance: 24, preventOverlap: false, nodeSpacing: 0 }
    }),
    arc: graphCase('arc', 'Arc Large Graph', 100000, 5000, {
      trendLimit: 1000,
      layout: { nodeSep: 6, nodeSize: 4 },
      edgeAnimation: false
    }),
    'radial-area': {
      packageName: 'echarts-radial-area',
      title: 'Radial Area Large Series',
      defaultCount: 100000,
      maxCount: ONE_MILLION,
      renderLimit: 6000,
      trendLimit: 1200,
      createData(count, seed) {
        return createFlatItems(count, this.renderLimit, (index) => {
          const seasonal = Math.sin(index * 0.017 + seed) * 15;
          const trend = (index % 365) / 365 * 18;
          const avg = 52 + seasonal + trend;
          return {
            date: new Date(Date.UTC(2020, 0, 1 + index)).toISOString(),
            avg,
            min: avg - 7 - (index % 5),
            max: avg + 8 + (index % 7),
            minmin: avg - 13 - (index % 4),
            maxmax: avg + 14 + (index % 6)
          };
        }, this.sampling);
      },
      createOption(payload) {
        const common = {
          top: 52,
          width: '94%',
          height: '88%',
          padding: 18,
          innerRadius: '24%',
          outerRadius: '95%',
          angleField: 'date',
          angleType: 'time',
          valueField: 'avg',
          min: 15,
          max: 95,
          tickCount: 5,
          data: payload.data,
          animation: false,
          enterAnimation: false,
          angleAxis: { show: false, label: { show: false }, splitLine: { show: false } },
          radialAxis: { show: false, label: { show: false }, splitLine: { show: false } },
          label: { show: false }
        };
        return perfOption(this, payload, [
          {
            ...common,
            type: 'radialArea',
            minField: 'minmin',
            maxField: 'maxmax',
            rangeAreaStyle: { color: '#e7edf7', opacity: 0.9 },
            lineStyle: { width: 0, opacity: 0 },
            showSymbol: false
          },
          {
            ...common,
            type: 'radialArea',
            minField: 'min',
            maxField: 'max',
            rangeAreaStyle: { color: '#b8d2ec', opacity: 0.7 },
            lineStyle: { color: '#2454a6', width: 1.2, opacity: 0.8 },
            itemStyle: { color: '#2454a6', opacity: 0.9 },
            showSymbol: false
          }
        ]);
      }
    },
    'radial-boxplot': {
      packageName: 'echarts-radial-boxplot',
      title: 'Radial Boxplot Large Categories',
      defaultCount: 20000,
      maxCount: ONE_MILLION,
      renderLimit: 2500,
      trendLimit: 700,
      createData(count, seed) {
        return createFlatItems(count, this.renderLimit, (index) => {
          const base = 18 + Math.sin(index * 0.09 + seed) * 5;
          return {
            name: `B${index}`,
            min: Math.max(0, base - 12),
            q1: base - 5,
            median: base,
            q3: base + 5,
            max: base + 12,
            itemStyle: { color: palette[index % palette.length] }
          };
        }, this.sampling);
      },
      createOption(payload) {
        return perfOption(this, payload, [{
          type: 'radialBoxplot',
          top: 50,
          width: '94%',
          height: '88%',
          padding: 10,
          innerRadius: '12%',
          outerRadius: '96%',
          min: 0,
          max: 42,
          tickCount: 4,
          data: payload.data,
          categories: payload.data.map((item) => item.name),
          animation: false,
          enterAnimation: false,
          angleAxis: { label: { show: false }, splitLine: { show: false } },
          radialAxis: { label: { show: false }, splitLine: { show: false } },
          itemStyle: { opacity: 0.72, borderWidth: 0 },
          whiskerLineStyle: { width: 0.6 },
          medianLineStyle: { width: 0.6 },
          capLineStyle: { width: 0.6 },
          label: { show: false }
        }]);
      }
    },
    venn: {
      packageName: 'echarts-venn',
      title: 'Venn Bubble Large Items',
      defaultCount: 50000,
      maxCount: ONE_MILLION,
      renderLimit: 2500,
      trendLimit: 700,
      createData(count, seed) {
        return createFlatItems(count, this.renderLimit, (index) => ({
          name: `Audience ${index}`,
          value: 10 + ((index * 37 + seed) % 900),
          itemStyle: { color: palette[index % palette.length] }
        }), this.sampling);
      },
      createOption(payload) {
        return perfOption(this, payload, [{
          type: 'venn',
          layout: 'bubble',
          top: 50,
          width: '94%',
          height: '88%',
          padding: 4,
          minRadius: 2,
          maxRadius: 20,
          data: payload.data,
          animation: false,
          enterAnimation: false,
          itemStyle: { opacity: 0.45, borderWidth: 0 },
          label: { show: false }
        }]);
      }
    },
    'pack-bubble': bubbleCase('echarts-pack-bubble', 'packBubble', 'Pack Bubble Large Items', 100000, 4000),
    'circle-packing': treeCase('echarts-circle-packing', 'circlePacking', 'Circle Packing Large Tree', 100000, 3500),
    'nested-circle': {
      packageName: 'echarts-nested-circle',
      title: 'Nested Circle Large Rings',
      defaultCount: 100000,
      maxCount: ONE_MILLION,
      renderLimit: 6000,
      trendLimit: 1400,
      createData(count) {
        const renderCount = clampCount(count, this.renderLimit);
        const ringCount = Math.max(8, Math.min(120, Math.ceil(Math.sqrt(renderCount))));
        const childCount = Math.max(1, Math.ceil(renderCount / ringCount));
        const data = Array.from({ length: ringCount }, (_, ring) => ({
          name: `Ring ${ring + 1}`,
          children: Array.from({ length: childCount }, (_, child) => `N${ring}-${child}`)
        }));
        return withMeta(data, count, ringCount * childCount);
      },
      createOption(payload) {
        return perfOption(this, payload, [{
          type: 'nestedCircle',
          top: 50,
          width: '94%',
          height: '88%',
          padding: 2,
          centerRadiusRatio: 0.12,
          data: payload.data,
          animation: false,
          enterAnimation: false,
          ringStyle: { borderWidth: 0.4, opacity: 0.68 },
          titleLabel: { show: false },
          label: { show: false }
        }]);
      }
    },
    mosaic: {
      packageName: 'echarts-mosaic',
      title: 'Mosaic Million Row Aggregate',
      defaultCount: ONE_MILLION,
      maxCount: ONE_MILLION,
      renderLimit: 240,
      createData(count) {
        const channels = Array.from({ length: 24 }, (_, index) => `C${index + 1}`);
        const stages = Array.from({ length: 10 }, (_, index) => `S${index + 1}`);
        const buckets = new Map();
        for (let index = 0; index < count; index += 1) {
          const channel = channels[index % channels.length];
          const stage = stages[(index * 7) % stages.length];
          const key = `${channel}\0${stage}`;
          buckets.set(key, (buckets.get(key) || 0) + 1 + (index % 5));
        }
        const data = [];
        buckets.forEach((users, key) => {
          const [channel, stage] = key.split('\0');
          data.push({ channel, stage, users });
        });
        return withMeta(data, count, data.length);
      },
      createOption(payload) {
        return perfOption(this, payload, [{
          type: 'mosaic',
          top: 50,
          width: '94%',
          height: '88%',
          padding: 2,
          gap: 1,
          xField: 'channel',
          yField: 'stage',
          valueField: 'users',
          data: payload.data,
          animation: false,
          enterAnimation: false,
          itemStyle: { borderWidth: 0, opacity: 0.9 },
          label: { show: false }
        }]);
      }
    },
    'voronoi-treemap': treeCase('echarts-voronoi-treemap', 'voronoiTreemap', 'Voronoi Treemap Sampled Tree', 50000, 900),
    subway: {
      packageName: 'echarts-subway',
      title: 'Subway Large Network',
      defaultCount: 100000,
      maxCount: ONE_MILLION,
      renderLimit: 5000,
      trendLimit: 1200,
      createData(count) {
        const renderCount = clampCount(count, this.renderLimit);
        const routeCount = Math.max(4, Math.min(24, Math.ceil(Math.sqrt(renderCount / 20))));
        const stationsPerRoute = Math.max(8, Math.ceil(renderCount / routeCount));
        const routes = Array.from({ length: routeCount }, (_, routeIndex) => {
          const stations = Array.from({ length: stationsPerRoute }, (_, stationIndex) => ({
            id: `r${routeIndex}-s${stationIndex}`,
            name: `S${stationIndex}`,
            coord: [stationIndex * 10, routeIndex * 28 + Math.sin(stationIndex * 0.35) * 16]
          }));
          return {
            id: `route-${routeIndex}`,
            name: `Route ${routeIndex + 1}`,
            color: palette[routeIndex % palette.length],
            stations,
            waypoints: stations.map((station) => [station.id, station.coord[0], station.coord[1]])
          };
        });
        return withMeta(routes, count, routeCount * stationsPerRoute);
      },
      createOption(payload) {
        return perfOption(this, payload, [{
          type: 'subway',
          top: 42,
          width: '96%',
          height: '90%',
          padding: 8,
          lineWidth: 2,
          stationRadius: 0.9,
          interchangeRadius: 1.2,
          data: payload.data,
          animation: false,
          enterAnimation: false,
          label: { show: false },
          routeLabel: { show: false },
          stationStyle: { color: '#ffffff', borderWidth: 0.5 },
          interchangeStyle: { borderWidth: 0.5 }
        }]);
      }
    },
    flame: treeCase('echarts-flame', 'flame', 'Flame Large Profile', 100000, 6000),
    'sunrise-sunset': {
      packageName: 'echarts-sunrise-sunset',
      title: 'Sunrise Sunset Large Data Parse',
      defaultCount: 100000,
      maxCount: ONE_MILLION,
      renderLimit: 5000,
      trendLimit: 1000,
      createData(count, seed) {
        return createFlatItems(count, this.renderLimit, (index) => ({
          name: `Day ${index}`,
          value: index,
          sunrise: `${pad2(5 + (index % 2))}:${pad2(10 + (index % 40))}`,
          sunset: `${pad2(18 + (index % 2))}:${pad2((30 + index + seed) % 60)}`,
          moonrise: `${pad2(20 + (index % 3))}:${pad2((index * 7) % 60)}`,
          moonset: `${pad2(6 + (index % 2))}:${pad2((index * 11) % 60)}`,
          currentTime: '2026-05-05 10:47:33',
          remainingText: '07:51:27',
          updatedText: 'Updated 10:46'
        }), this.sampling);
      },
      createOption(payload) {
        return perfOption(this, payload, [{
          type: 'sunriseSunset',
          top: 0,
          width: '100%',
          height: '100%',
          padding: 120,
          data: payload.data,
          animation: false,
          enterAnimation: false,
          backgroundStyle: { color: '#202124' },
          titleLabel: { fontSize: 34 },
          remainingLabel: { fontSize: 58 },
          updatedLabel: { fontSize: 20 },
          eventLabel: { fontSize: 22, show: true }
        }], { backgroundColor: '#202124' });
      }
    },
    lollipop: {
      packageName: 'echarts-lollipop',
      title: 'Lollipop Large Categories',
      defaultCount: 100000,
      maxCount: ONE_MILLION,
      renderLimit: 7000,
      trendLimit: 1200,
      createData(count, seed) {
        return createFlatItems(count, this.renderLimit, (index) => ({
          country: `Item ${index}`,
          population: 100 + ((index * 29 + seed) % 1900)
        }), this.sampling);
      },
      createOption(payload) {
        return perfOption(this, payload, [{
          type: 'lollipop',
          top: 42,
          width: '94%',
          height: '86%',
          padding: { top: 8, right: 18, bottom: 20, left: 52 },
          categoryField: 'country',
          valueField: 'population',
          categories: payload.data.map((item) => item.country),
          min: 0,
          max: 2100,
          tickCount: 4,
          symbolSize: 0,
          data: payload.data,
          animation: false,
          enterAnimation: false,
          valueAxis: { label: { show: false }, splitLine: { show: false }, axisLine: { show: false } },
          categoryAxis: { label: { show: false } },
          stemStyle: { color: '#1aa8f2', width: 0.5, opacity: 0.42 },
          itemStyle: { color: '#2db5ff', borderWidth: 0, opacity: 0.72 },
          label: { show: false }
        }]);
      }
    },
    beeswarm: {
      packageName: 'echarts-beeswarm',
      title: 'Beeswarm Large Points',
      defaultCount: 100000,
      maxCount: ONE_MILLION,
      renderLimit: 8000,
      trendLimit: 1600,
      createData(count, seed) {
        const teams = ['Design', 'Engineering', 'Operations', 'Support', 'Growth', 'Platform'];
        return createFlatItems(count, this.renderLimit, (index) => ({
          team: teams[index % teams.length],
          score: 35 + ((index * 17 + seed) % 65),
          name: `P${index}`
        }), this.sampling);
      },
      createOption(payload) {
        return perfOption(this, payload, [{
          type: 'beeswarm',
          top: 42,
          width: '94%',
          height: '86%',
          padding: { top: 8, right: 18, bottom: 24, left: 64 },
          categoryField: 'team',
          valueField: 'score',
          nameField: 'name',
          categories: ['Design', 'Engineering', 'Operations', 'Support', 'Growth', 'Platform'],
          min: 30,
          max: 105,
          tickCount: 5,
          symbolSize: 3,
          collisionPadding: 0,
          swarmRadius: 20,
          data: payload.data,
          animation: false,
          enterAnimation: false,
          valueAxis: { label: { show: false }, splitLine: { show: false }, axisLine: { show: false } },
          categoryAxis: { label: { show: false } },
          itemStyle: { borderWidth: 0, opacity: 0.48 },
          label: { show: false }
        }]);
      }
    },
    spiral: {
      packageName: 'echarts-spiral',
      title: 'Spiral Large Segments',
      defaultCount: 100000,
      maxCount: ONE_MILLION,
      renderLimit: 12000,
      trendLimit: 1800,
      createData(count, seed) {
        return createFlatItems(count, this.renderLimit, (index) => ({
          name: `Segment ${index}`,
          value: 10 + ((index * 13 + seed) % 100)
        }), this.sampling);
      },
      createOption(payload) {
        return perfOption(this, payload, [{
          type: 'spiral',
          top: 42,
          width: '94%',
          height: '88%',
          padding: 8,
          innerRadius: '8%',
          outerRadius: '96%',
          turns: 18,
          segmentsPerTurn: 160,
          radialGap: 1,
          gapAngle: 0.2,
          valueField: 'value',
          nameField: 'name',
          data: payload.data,
          minOpacity: 0.12,
          maxOpacity: 0.9,
          showLine: false,
          animation: false,
          enterAnimation: false,
          itemStyle: { color: '#f04438', borderWidth: 0 },
          label: { show: false }
        }]);
      }
    },
    'vector-field': {
      packageName: 'echarts-vector-field',
      title: 'Vector Field Large Grid',
      defaultCount: 100000,
      maxCount: ONE_MILLION,
      renderLimit: 16000,
      trendLimit: 2400,
      createData(count, seed) {
        const renderCount = clampCount(count, this.renderLimit);
        const cols = Math.ceil(Math.sqrt(renderCount * 1.6));
        const rows = Math.ceil(renderCount / cols);
        const data = [];
        for (let row = 0; row < rows && data.length < renderCount; row += 1) {
          for (let col = 0; col < cols && data.length < renderCount; col += 1) {
            data.push({
              longitude: col / cols * 120,
              latitude: row / rows * 60,
              u: Math.cos((col + seed) * 0.13) * 3 + Math.sin(row * 0.07),
              v: Math.sin((row + seed) * 0.11) * 3 + Math.cos(col * 0.05)
            });
          }
        }
        return withMeta(data, count, data.length);
      },
      createOption(payload) {
        return perfOption(this, payload, [{
          type: 'vectorField',
          top: 42,
          width: '94%',
          height: '88%',
          padding: 8,
          data: payload.data,
          samplingStep: 1,
          minLength: 0.6,
          maxLength: 6,
          arrowHeadLength: 1.4,
          xField: 'longitude',
          yField: 'latitude',
          uField: 'u',
          vField: 'v',
          invertY: true,
          animation: false,
          enterAnimation: false,
          lineStyle: { color: '#1d4ed8', width: 0.55, opacity: 0.55 }
        }]);
      }
    }
  };

  function graphCase(type, titleText, defaultCount, renderLimit, patch) {
    const { trendLimit, ...seriesPatch } = patch || {};
    return {
      packageName: `echarts-${type}`,
      title: titleText,
      defaultCount,
      maxCount: ONE_MILLION,
      renderLimit,
      trendLimit,
      createData(count) {
        return createGraphData(count, this.renderLimit);
      },
      createOption(payload) {
        const nodes = payload.data.nodes;
        const cols = Math.ceil(Math.sqrt(nodes.length));
        const patchOption = cloneJsonValue(seriesPatch);
        const series = {
          ...payload.data,
          type,
          top: 42,
          width: '94%',
          height: '88%',
          symbolSize: 4,
          animation: false,
          enterAnimation: false,
          progressive: 2000,
          progressiveThreshold: 3000,
          label: { show: false },
          edgeStyle: { color: '#8a94a6', width: 0.45, opacity: 0.22 },
          itemStyle: { borderWidth: 0, opacity: 0.72 },
          layout: {
            cols,
            rows: Math.ceil(nodes.length / cols),
            nodeSize: 4,
            preventOverlap: false
          },
          fisheye: { show: false, preview: false },
          ...patchOption
        };
        return perfOption(this, payload, [series]);
      }
    };
  }

  function bubbleCase(packageName, type, titleText, defaultCount, renderLimit) {
    return {
      packageName,
      title: titleText,
      defaultCount,
      maxCount: ONE_MILLION,
      renderLimit,
      createData(count, seed) {
        return createFlatItems(count, this.renderLimit, (index) => ({
          name: `Item ${index}`,
          value: 5 + ((index * 31 + seed) % 1000),
          category: `G${index % 12}`,
          itemStyle: { color: palette[index % palette.length] }
        }), this.sampling);
      },
      createOption(payload) {
        return perfOption(this, payload, [{
          type,
          top: 42,
          width: '94%',
          height: '88%',
          padding: 2,
          gap: 0,
          layout: { fast: true, fastThreshold: 600 },
          maxRadius: 18,
          fillRatio: 0.86,
          categoryField: 'category',
          data: payload.data,
          animation: false,
          enterAnimation: false,
          itemStyle: { opacity: 0.48, borderWidth: 0 },
          label: { show: false }
        }]);
      }
    };
  }

  function treeCase(packageName, type, titleText, defaultCount, renderLimit) {
    return {
      packageName,
      title: titleText,
      defaultCount,
      maxCount: ONE_MILLION,
      renderLimit,
      createData(count, seed) {
        return createTreeData(count, this.renderLimit, seed);
      },
      createOption(payload) {
        const base = {
          type,
          top: 42,
          width: '94%',
          height: '88%',
          padding: 2,
          gap: 0,
          rootVisible: false,
          sort: false,
          data: payload.data,
          animation: false,
          enterAnimation: false,
          itemStyle: { opacity: 0.72, borderWidth: 0 },
          label: { show: false, showInternal: false }
        };
        if (type === 'circlePacking') {
          base.nodePadding = 0;
          base.siblingGap = 0;
        }
        if (type === 'voronoiTreemap') {
          base.maxIteration = 4;
        }
        if (type === 'flame') {
          base.orient = 'up';
        }
        return perfOption(this, payload, [base]);
      }
    };
  }

  function createLargeOption(caseName, count, seed = 0, renderContext = {}) {
    const definition = cases[caseName];
    if (!definition) throw new Error(`Unknown large data case: ${caseName}`);
    const safeCount = clampCount(count ?? definition.defaultCount, definition.maxCount);
    const sampling = createSamplingPlan(definition, safeCount, renderContext);
    const dataStart = now();
    const payload = definition.createData.call({
      ...definition,
      renderLimit: sampling.renderLimit,
      sampling
    }, safeCount, seed, sampling);
    decoratePayloadSampling(payload, definition, sampling);
    const dataEnd = now();
    const optionStart = now();
    const option = definition.createOption(payload, seed);
    applyLargeControlValues(caseName, option, renderContext);
    applyLargeInteractionDefaults(option);
    const optionEnd = now();
    return {
      caseName,
      definition,
      payload,
      option,
      timings: {
        dataMs: dataEnd - dataStart,
        optionMs: optionEnd - optionStart
      }
    };
  }

  async function mount(caseName, targetId = 'chart') {
    const definition = cases[caseName];
    const chartElement = root.document?.getElementById?.(targetId);
    if (!definition || !chartElement || !root.echarts) return null;

    const state = {
      count: readCountFromLocation(definition.defaultCount),
      seed: readNumericQuery('seed', 0),
      runId: 0,
      detailLevel: 0,
      replayKey: 0
    };
    const chart = root.echarts.init(chartElement, null, {
      renderer: 'canvas',
      useDirtyRect: true
    });
    const initialPrepared = createLargeOption(caseName, state.count, state.seed);
    const controls = createLargeControls(caseName, initialPrepared.option);
    const controlState = createLargeControlState(controls);
    let customOption = null;
    const demoApi = getDemoApi();
    const controlsPanel = createLargeControlsPanel(chartElement, controls, controlState, {
      onChange(control) {
        customOption = null;
        run({ interactionControlId: control?.id });
      },
      onReset() {
        Object.assign(controlState, createLargeControlState(controls));
        customOption = null;
        demoApi.syncControlElements?.(controlsPanel, controls, controlState);
        run();
      },
      onReplay() {
        state.replayKey += 1;
        run({ replayKey: state.replayKey });
      },
      onJsonApply(option) {
        customOption = option;
        run({ customOption });
      }
    });
    const panel = mountPerfPanel(chartElement, definition, state, () => {
      customOption = null;
      run();
    }, controlsPanel);
    let detailRunTimer = 0;
    const interactions = demoApi.attachDemoInteractions?.(chart, chartElement, controlsPanel || panel, {
      onViewportChange(viewport, reason) {
        scheduleDetailRun(viewport, reason);
      }
    }) || {
      viewport: { scale: 1 },
      applyViewport() {}
    };
    root.__ECHARTS_EXTENSION_PERF__ = {
      caseName,
      chart,
      lastResult: null,
      ready: null,
      run
    };

    root.addEventListener?.('resize', () => {
      chart.resize();
      interactions.applyViewport();
    });
    root.__ECHARTS_EXTENSION_PERF__.ready = run();
    return root.__ECHARTS_EXTENSION_PERF__.ready;

    async function run(context = {}) {
      const phase = state.runId === 0 ? 'initial' : 'update';
      const result = await runPerformanceCase(chart, caseName, state.count, state.seed + state.runId, phase, {
        controls,
        controlValues: controlState,
        zoomScale: interactions.viewport?.scale || 1,
        viewport: createSamplingViewport(chartElement, interactions.viewport),
        detailLevel: state.detailLevel,
        customOption,
        ...context,
        onOption(option) {
          demoApi.updateOptionEditor?.(controlsPanel, option);
        }
      });
      state.runId += 1;
      root.__ECHARTS_EXTENSION_PERF__.lastResult = result;
      updatePerfPanel(panel, result);
      interactions.applyViewport();
      return result;
    }

    function scheduleDetailRun(viewport, reason) {
      if (!isLargeOptimizationActive(definition, state.count, controlState)) return;
      const nextDetailLevel = detailLevelForScale(viewport?.scale);
      if (nextDetailLevel === state.detailLevel && !shouldRefreshDetailForViewport(reason, nextDetailLevel)) return;
      state.detailLevel = nextDetailLevel;
      root.clearTimeout?.(detailRunTimer);
      detailRunTimer = root.setTimeout?.(() => {
        customOption = null;
        run({ viewportReason: reason, viewport: createSamplingViewport(chartElement, viewport) });
      }, 90);
    }
  }

  async function runPerformanceCase(chart, caseName, count, seed = 0, phase = 'run', renderContext = {}) {
    const totalStart = now();
    const initStart = now();
    if (phase !== 'update') {
      chart.resize();
    }
    const initEnd = now();
    const prepared = renderContext.customOption
      ? createCustomPreparedOption(caseName, count, renderContext.customOption)
      : createLargeOption(caseName, count, seed, renderContext);
    renderContext.onOption?.(prepared.option);
    const setOptionStart = now();
    if (renderContext.replayKey != null) {
      chart.setOption({ series: [] }, {
        replaceMerge: ['series'],
        lazyUpdate: false
      });
      await nextFrame();
    }
    const finishedPromise = waitForFinished(chart);
    chart.setOption(prepared.option, {
      notMerge: false,
      lazyUpdate: false
    });
    const setOptionEnd = now();
    await nextFrame();
    const frameEnd = now();
    await finishedPromise;
    const finishedEnd = now();
    const renderEnd = now();
    const inspectStart = now();
    const displayableCount = countDisplayables(chart);
    const inspectEnd = now();
    const payload = prepared.payload;
    const result = {
      caseName,
      title: prepared.definition.title,
      rawCount: payload.rawCount,
      renderCount: payload.renderCount,
      reductionRatio: payload.rawCount > 0 ? payload.renderCount / payload.rawCount : 1,
      displayableCount,
      renderLimit: payload.renderLimit ?? prepared.definition.renderLimit,
      sampleMode: payload.sampleMode || 'detail',
      large: payload.large !== false,
      largeThreshold: payload.largeThreshold ?? DEFAULT_LARGE_THRESHOLD,
      optimized: payload.optimized === true,
      detailLevel: payload.detailLevel ?? 0,
      zoomScale: payload.zoomScale ?? 1,
      sampleWindow: payload.sampleWindow || null,
      phase,
      budgetMs: 1000,
      overBudget: renderEnd - totalStart > 1000,
      steps: {
        initMs: initEnd - initStart,
        dataMs: prepared.timings.dataMs,
        optionMs: prepared.timings.optionMs,
        setOptionMs: setOptionEnd - setOptionStart,
        firstFrameMs: frameEnd - setOptionStart,
        finishedMs: finishedEnd - setOptionStart,
        totalMs: renderEnd - totalStart,
        inspectMs: inspectEnd - inspectStart,
        wallMs: inspectEnd - totalStart
      },
      timestamp: new Date().toISOString()
    };
    return roundResult(result);
  }

  function createCustomPreparedOption(caseName, count, customOption) {
    const definition = cases[caseName];
    const option = applyLargeInteractionDefaults(cloneJsonValue(customOption));
    const perfMeta = option.largeDataPerf || {};
    const rawCount = clampCount(perfMeta.rawCount ?? count ?? definition.defaultCount, definition.maxCount);
    const renderCount = clampCount(perfMeta.renderCount ?? rawCount, Math.max(rawCount, 1));

    return {
      caseName,
      definition,
      payload: {
        data: null,
        rawCount,
        renderCount,
        renderLimit: perfMeta.renderLimit ?? definition.renderLimit,
        sampleMode: perfMeta.sampleMode || 'custom',
        large: perfMeta.large !== false,
        largeThreshold: perfMeta.largeThreshold ?? DEFAULT_LARGE_THRESHOLD,
        optimized: perfMeta.optimized === true,
        detailLevel: perfMeta.detailLevel ?? 0,
        zoomScale: perfMeta.zoomScale ?? 1,
        sampleWindow: perfMeta.sampleWindow || null
      },
      option,
      timings: {
        dataMs: 0,
        optionMs: 0
      }
    };
  }

  function createLargeControls(caseName, option) {
    const demoApi = getDemoApi();
    const entry = demoApi.registry?.[standardExampleName(caseName)];
    const controls = Array.isArray(entry?.controls) ? entry.controls : [];

    return [
      ...createLargeOptimizationControls(option),
      ...controls.map((control) => retuneControlForLargeData(control, option))
    ];
  }

  function createLargeOptimizationControls(option) {
    const seriesList = Array.isArray(option?.series) ? option.series : [option?.series].filter(Boolean);
    const seriesTargets = (key) => seriesList.map((_, index) => `series.${index}.${key}`);
    const perfMeta = option?.largeDataPerf || {};
    return [
      {
        id: 'large',
        label: 'large',
        type: 'checkbox',
        targets: ['largeDataPerf.large', ...seriesTargets('large')],
        defaultValue: perfMeta.large !== false,
        largeTargetsPresent: true
      },
      {
        id: 'largeThreshold',
        label: 'largeThreshold',
        type: 'range',
        targets: ['largeDataPerf.largeThreshold', ...seriesTargets('largeThreshold')],
        defaultValue: clampLargeThreshold(perfMeta.largeThreshold),
        min: 0,
        max: ONE_MILLION,
        step: 1000,
        largeTargetsPresent: true
      }
    ];
  }

  function createLargeControlState(controls) {
    const demoApi = getDemoApi();
    if (typeof demoApi.createControlState === 'function') {
      return demoApi.createControlState(controls);
    }

    return controls.reduce((state, control) => {
      state[control.id] = control.type === 'json'
        ? JSON.stringify(control.defaultValue, null, 2)
        : control.defaultValue;
      return state;
    }, {});
  }

  function createLargeControlsPanel(chartElement, controls, controlState, handlers) {
    const demoApi = getDemoApi();
    if (typeof demoApi.createControlsPanel !== 'function') return null;

    const panel = demoApi.createControlsPanel(controls, controlState, handlers);
    demoApi.mountControlsPanel?.(chartElement, panel);
    chartElement.closest?.('.demo-stage')?.classList.add('demo-stage--large');
    return panel;
  }

  function retuneControlForLargeData(control, option) {
    const largeControl = {
      ...control,
      targets: Array.isArray(control.targets) ? [...control.targets] : []
    };
    const optionValue = readFirstTargetValue(option, largeControl.targets);
    largeControl.largeTargetsPresent = optionValue !== undefined;

    if (optionValue !== undefined) {
      largeControl.defaultValue = normalizeControlDefault(control, optionValue);
    }

    if (largeControl.type === 'range') {
      const numericDefault = finiteNumber(Number(largeControl.defaultValue), finiteNumber(Number(control.defaultValue), 0));
      largeControl.defaultValue = numericDefault;
      largeControl.min = Math.min(finiteNumber(Number(control.min), numericDefault), numericDefault);
      largeControl.max = Math.max(finiteNumber(Number(control.max), numericDefault), numericDefault);
    }

    return largeControl;
  }

  function normalizeControlDefault(control, value) {
    if (control.type === 'range') {
      if (typeof value === 'string' && value.endsWith('%')) return finiteNumber(Number.parseFloat(value), control.defaultValue);
      return finiteNumber(Number(value), control.defaultValue);
    }
    if (control.type === 'checkbox') return Boolean(value);
    if (control.type === 'select') return control.options?.includes(value) ? value : control.defaultValue;
    if (control.type === 'json') return value == null ? control.defaultValue : value;
    return value == null ? '' : String(value);
  }

  function applyLargeControlValues(caseName, option, renderContext = {}) {
    const controls = Array.isArray(renderContext.controls) ? renderContext.controls : [];
    const controlValues = renderContext.controlValues;
    if (!controls.length || !controlValues) return option;

    const activeControls = controls.filter((control) => shouldApplyLargeControl(option, control, controlValues));
    const demoApi = getDemoApi();
    if (typeof demoApi.applyControlValues === 'function') {
      demoApi.applyControlValues(option, activeControls, controlValues, renderContext);
    }
    return option;
  }

  function shouldApplyLargeControl(option, control, controlValues) {
    if (typeof control.applyValue === 'function') return true;
    if (control.largeTargetsPresent || control.targets?.some((target) => getPath(option, target) !== undefined)) return true;
    return !sameControlValue(control, controlValues[control.id], control.defaultValue);
  }

  function sameControlValue(control, left, right) {
    if (control.type === 'json') {
      return String(left) === JSON.stringify(right, null, 2);
    }
    return String(left) === String(right);
  }

  function applyLargeInteractionDefaults(option) {
    if (!option || typeof option !== 'object') return option;
    if (!option.tooltip) {
      option.tooltip = {
        trigger: 'item',
        confine: true
      };
    }

    const seriesList = Array.isArray(option.series) ? option.series : [option.series].filter(Boolean);
    seriesList.forEach((seriesOption) => {
      if (seriesOption && typeof seriesOption === 'object' && seriesOption.silent == null) {
        seriesOption.silent = false;
      }
    });

    const demoApi = getDemoApi();
    return typeof demoApi.applyDemoInteractionDefaults === 'function'
      ? demoApi.applyDemoInteractionDefaults(option)
      : option;
  }

  function readFirstTargetValue(target, paths) {
    for (const path of paths || []) {
      const value = getPath(target, path);
      if (value !== undefined) return value;
    }
    return undefined;
  }

  function getPath(target, path) {
    if (!target || !path) return undefined;
    const parts = String(path).split('.');
    let current = target;
    for (const part of parts) {
      if (current == null) return undefined;
      current = current[pathKey(part)];
    }
    return current;
  }

  function pathKey(part) {
    const numeric = Number(part);
    return Number.isInteger(numeric) && String(numeric) === part ? numeric : part;
  }

  function standardExampleName(caseName) {
    return caseName === 'venn' ? 'venn-bubble' : caseName;
  }

  function getDemoApi() {
    return root.EChartsExtensionExamples || {};
  }

  function createSamplingPlan(definition, count, renderContext = {}) {
    const largeSettings = readLargeOptimizationSettings(definition, count, renderContext);
    const maxRenderLimit = largeSettings.optimized
      ? clampCount(definition.renderLimit || count, count)
      : count;
    const zoomScale = finiteNumber(Number(renderContext.zoomScale ?? renderContext.viewport?.scale), 1);
    const detailLevel = largeSettings.optimized
      ? clampDetailLevel(renderContext.detailLevel ?? detailLevelForScale(zoomScale))
      : 0;
    const trendLimit = Math.min(maxRenderLimit, definition.trendLimit || defaultTrendLimit(maxRenderLimit));
    const ratioByLevel = [0, 0.42, 0.68, 1];
    const renderLimit = largeSettings.optimized
      ? detailLevel === 0
        ? trendLimit
        : Math.min(maxRenderLimit, Math.max(trendLimit, Math.round(maxRenderLimit * ratioByLevel[detailLevel])))
      : maxRenderLimit;
    const viewport = renderContext.viewport || {};
    const sampleWindow = largeSettings.optimized
      ? createViewportSampleWindow(count, {
        ...viewport,
        scale: zoomScale
      }, renderContext.viewportSize)
      : null;

    return {
      ...largeSettings,
      detailLevel,
      zoomScale,
      renderLimit,
      maxRenderLimit,
      sampleMode: largeSettings.optimized && renderLimit < maxRenderLimit ? 'trend' : 'detail',
      sampleWindow
    };
  }

  function decoratePayloadSampling(payload, definition, sampling) {
    payload.renderLimit = sampling.renderLimit;
    payload.maxRenderLimit = sampling.maxRenderLimit ?? definition.renderLimit;
    payload.sampleMode = sampling.sampleMode;
    payload.large = sampling.large;
    payload.largeThreshold = sampling.largeThreshold;
    payload.optimized = sampling.optimized;
    payload.detailLevel = sampling.detailLevel;
    payload.zoomScale = sampling.zoomScale;
    payload.sampleWindow = sampling.sampleWindow;
    return payload;
  }

  function readLargeOptimizationSettings(definition, count, renderContext = {}) {
    const controlValues = renderContext.controlValues || {};
    const large = readBooleanSetting(controlValues.large ?? renderContext.large ?? definition.large, true);
    const largeThreshold = clampLargeThreshold(controlValues.largeThreshold ?? renderContext.largeThreshold ?? definition.largeThreshold);
    return {
      large,
      largeThreshold,
      optimized: large && count > largeThreshold
    };
  }

  function isLargeOptimizationActive(definition, count, controlValues) {
    return readLargeOptimizationSettings(definition, count, { controlValues }).optimized;
  }

  function readBooleanSetting(value, fallback) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      if (value === 'true') return true;
      if (value === 'false') return false;
    }
    return fallback;
  }

  function detailLevelForScale(scale) {
    const safeScale = finiteNumber(Number(scale), 1);
    if (safeScale >= detailZoomBreakpoints[3]) return 3;
    if (safeScale >= detailZoomBreakpoints[2]) return 2;
    if (safeScale >= detailZoomBreakpoints[1]) return 1;
    return 0;
  }

  function clampDetailLevel(value) {
    const numeric = Math.trunc(finiteNumber(Number(value), 0));
    return Math.max(0, Math.min(3, numeric));
  }

  function defaultTrendLimit(maxRenderLimit) {
    if (maxRenderLimit <= 1000) return maxRenderLimit;
    if (maxRenderLimit <= 3000) return Math.min(maxRenderLimit, 700);
    if (maxRenderLimit <= 6000) return Math.min(maxRenderLimit, 1200);
    if (maxRenderLimit <= 10000) return Math.min(maxRenderLimit, 1600);
    return Math.min(maxRenderLimit, 2200);
  }

  function shouldRefreshDetailForViewport(reason, detailLevel) {
    return detailLevel > 0 && (reason === 'zoom' || reason === 'pan' || reason === 'reset');
  }

  function createSamplingViewport(chartElement, viewport = {}) {
    const rect = chartElement?.getBoundingClientRect?.();
    const width = finiteNumber(Number(rect?.width || chartElement?.clientWidth), finiteNumber(Number(viewport?.width), 0));
    const height = finiteNumber(Number(rect?.height || chartElement?.clientHeight), finiteNumber(Number(viewport?.height), 0));
    return {
      x: finiteNumber(Number(viewport?.x), 0),
      y: finiteNumber(Number(viewport?.y), 0),
      scale: finiteNumber(Number(viewport?.scale), 1),
      width,
      height
    };
  }

  function createViewportSampleWindow(count, viewport = {}, viewportSize = {}) {
    const scale = finiteNumber(Number(viewport?.scale), 1);
    const width = finiteNumber(Number(viewport?.width ?? viewportSize?.width), 0);
    if (scale <= 1.01 || width <= 0 || count <= 1) return null;

    const translateX = finiteNumber(Number(viewport?.x), 0);
    const visibleStart = -translateX / scale;
    const visibleEnd = (width - translateX) / scale;
    const startFraction = clampFraction(Math.min(visibleStart, visibleEnd) / width);
    const endFraction = clampFraction(Math.max(visibleStart, visibleEnd) / width);
    const visibleFraction = endFraction - startFraction;
    if (visibleFraction <= 0 || visibleFraction >= 0.98) return null;

    const overscan = Math.max(0.012, visibleFraction * 0.18);
    const windowStart = clampFraction(startFraction - overscan);
    const windowEnd = clampFraction(endFraction + overscan);
    const maxIndex = Math.max(0, count - 1);

    return {
      startIndex: Math.floor(windowStart * maxIndex),
      endIndex: Math.ceil(windowEnd * maxIndex),
      startFraction,
      endFraction
    };
  }

  function createGraphData(count, renderLimit) {
    const renderCount = clampCount(count, renderLimit);
    const nodes = Array.from({ length: renderCount }, (_, index) => ({
      id: `n${index}`,
      name: `N${index}`,
      value: 1 + (index % 20),
      itemStyle: { color: palette[index % palette.length] }
    }));
    const links = [];
    for (let index = 1; index < renderCount; index += 1) {
      links.push({ source: `n${Math.floor((index - 1) / 2)}`, target: `n${index}` });
      if (index > 2 && index % 7 === 0) {
        links.push({ source: `n${Math.max(0, index - 7)}`, target: `n${index}` });
      }
    }
    return withMeta({ nodes, links }, count, renderCount);
  }

  function createTreeData(count, renderLimit, seed) {
    const renderCount = clampCount(count, renderLimit);
    const groupCount = Math.max(8, Math.min(120, Math.ceil(Math.sqrt(renderCount))));
    const leavesPerGroup = Math.max(1, Math.ceil(renderCount / groupCount));
    let leafIndex = 0;
    const children = Array.from({ length: groupCount }, (_, groupIndex) => ({
      name: `Group ${groupIndex + 1}`,
      itemStyle: { color: palette[groupIndex % palette.length] },
      children: Array.from({ length: leavesPerGroup }, () => {
        const current = leafIndex;
        leafIndex += 1;
        return {
          name: `Leaf ${current}`,
          value: 1 + ((current * 19 + seed) % 100)
        };
      })
    }));
    return withMeta({ name: 'root', children }, count, leafIndex);
  }

  function createFlatItems(count, renderLimit, factory, sampling = null) {
    const indexes = createTrendSampleIndexes(count, renderLimit, factory, sampling);
    const data = indexes.map((rawIndex, sampleIndex) => factory(rawIndex, sampleIndex));
    return withMeta(data, count, data.length);
  }

  function createTrendSampleIndexes(count, renderLimit, factory, sampling = null) {
    const safeCount = clampCount(count, ONE_MILLION);
    const safeRenderLimit = clampCount(renderLimit, safeCount);
    if (safeCount <= safeRenderLimit) {
      return Array.from({ length: safeCount }, (_, index) => index);
    }

    if (sampling?.sampleWindow && sampling.detailLevel > 0) {
      return createFocusedTrendSampleIndexes(safeCount, safeRenderLimit, factory, sampling);
    }

    return createRangeTrendSampleIndexes(0, safeCount - 1, safeRenderLimit, factory);
  }

  function createFocusedTrendSampleIndexes(count, renderLimit, factory, sampling) {
    const window = normalizeSampleWindow(sampling.sampleWindow, count);
    if (!window) return createRangeTrendSampleIndexes(0, count - 1, renderLimit, factory);
    if (renderLimit <= 4) return createRangeTrendSampleIndexes(0, count - 1, renderLimit, factory);

    const detailRatioByLevel = [0, 0.58, 0.7, 0.82];
    const detailRatio = detailRatioByLevel[clampDetailLevel(sampling.detailLevel)] || 0.58;
    const detailLimit = Math.max(2, Math.min(renderLimit - 2, Math.round(renderLimit * detailRatio)));
    const contextLimit = Math.max(2, renderLimit - detailLimit);
    const contextIndexes = createRangeTrendSampleIndexes(0, count - 1, contextLimit, factory);
    const detailIndexes = createRangeTrendSampleIndexes(window.startIndex, window.endIndex, detailLimit, factory);

    return mergeSampleIndexes(contextIndexes, detailIndexes, renderLimit);
  }

  function createRangeTrendSampleIndexes(startIndex, endIndex, renderLimit, factory) {
    const safeStart = Math.max(0, Math.floor(startIndex));
    const safeEnd = Math.max(safeStart, Math.floor(endIndex));
    const rangeCount = safeEnd - safeStart + 1;
    const safeRenderLimit = clampCount(renderLimit, rangeCount);
    if (rangeCount <= safeRenderLimit) {
      return Array.from({ length: rangeCount }, (_, index) => safeStart + index);
    }

    const bucketCount = Math.max(1, Math.ceil(safeRenderLimit / 4));
    const bucketSize = rangeCount / bucketCount;
    const selected = new Set([safeStart, safeEnd]);

    for (let bucketIndex = 0; bucketIndex < bucketCount; bucketIndex += 1) {
      const start = safeStart + Math.floor(bucketIndex * bucketSize);
      const end = Math.min(safeEnd, safeStart + Math.floor((bucketIndex + 1) * bucketSize) - 1);
      if (end < start) continue;
      const middle = Math.floor((start + end) / 2);
      selected.add(start);
      selected.add(middle);
      selected.add(end);

      const extrema = sampleBucketExtrema(start, end, factory);
      selected.add(extrema.minIndex);
      selected.add(extrema.maxIndex);
    }

    return thinSampleIndexes([...selected].sort((left, right) => left - right), safeRenderLimit);
  }

  function normalizeSampleWindow(window, count) {
    if (!window || count <= 1) return null;
    const maxIndex = count - 1;
    const startIndex = Math.max(0, Math.min(maxIndex, Math.floor(window.startIndex)));
    const endIndex = Math.max(startIndex, Math.min(maxIndex, Math.ceil(window.endIndex)));
    if (endIndex <= startIndex) return null;
    return {
      ...window,
      startIndex,
      endIndex
    };
  }

  function mergeSampleIndexes(contextIndexes, detailIndexes, limit) {
    const detailSet = new Set(detailIndexes);
    const merged = [...new Set([...contextIndexes, ...detailIndexes])].sort((left, right) => left - right);
    if (merged.length <= limit) return merged;

    const detail = [...detailSet].sort((left, right) => left - right);
    const contextBudget = Math.max(0, limit - detail.length);
    if (contextBudget === 0) return thinSampleIndexes(detail, limit);

    const context = contextIndexes.filter((index) => !detailSet.has(index));
    return [...new Set([
      ...thinSampleIndexes(context, contextBudget),
      ...detail
    ])].sort((left, right) => left - right);
  }

  function sampleBucketExtrema(start, end, factory) {
    let minIndex = start;
    let maxIndex = start;
    let minValue = Infinity;
    let maxValue = -Infinity;
    const probeStep = Math.max(1, Math.floor((end - start + 1) / 24));

    for (let index = start; index <= end; index += probeStep) {
      const value = extractSignalValue(factory(index, 0));
      if (value < minValue) {
        minValue = value;
        minIndex = index;
      }
      if (value > maxValue) {
        maxValue = value;
        maxIndex = index;
      }
    }

    const endValue = extractSignalValue(factory(end, 0));
    if (endValue < minValue) minIndex = end;
    if (endValue > maxValue) maxIndex = end;

    return { minIndex, maxIndex };
  }

  function extractSignalValue(item) {
    if (!item || typeof item !== 'object') return 0;
    if (Number.isFinite(item.value)) return Number(item.value);
    if (Number.isFinite(item.avg)) return Number(item.avg);
    if (Number.isFinite(item.population)) return Number(item.population);
    if (Number.isFinite(item.score)) return Number(item.score);
    if (Number.isFinite(item.users)) return Number(item.users);
    if (Number.isFinite(item.median)) return Number(item.median);
    if (Number.isFinite(item.u) || Number.isFinite(item.v)) {
      return Math.hypot(finiteNumber(Number(item.u), 0), finiteNumber(Number(item.v), 0));
    }
    if (Number.isFinite(item.min) && Number.isFinite(item.max)) {
      return (Number(item.min) + Number(item.max)) / 2;
    }
    return 0;
  }

  function thinSampleIndexes(indexes, limit) {
    if (indexes.length <= limit) return indexes;
    const result = [];
    const step = (indexes.length - 1) / Math.max(1, limit - 1);
    for (let index = 0; index < limit; index += 1) {
      result.push(indexes[Math.round(index * step)]);
    }
    return [...new Set(result)].sort((left, right) => left - right);
  }

  function perfOption(definition, payload, series, patch = {}) {
    const large = payload.large !== false;
    const largeThreshold = payload.largeThreshold ?? DEFAULT_LARGE_THRESHOLD;
    const option = {
      animation: false,
      backgroundColor: '#ffffff',
      tooltip: {
        trigger: 'item',
        confine: true
      },
      title: {
        text: definition.title,
        left: 'center',
        top: 10,
        textStyle: { color: '#111827', fontSize: 16, fontWeight: 720 }
      },
      series: series.map((seriesOption) => ({
        ...seriesOption,
        large: seriesOption.large ?? large,
        largeThreshold: seriesOption.largeThreshold ?? largeThreshold,
        silent: seriesOption.silent ?? false
      })),
      largeDataPerf: {
        rawCount: payload.rawCount,
        renderCount: payload.renderCount,
        renderLimit: payload.renderLimit ?? definition.renderLimit,
        maxRenderLimit: payload.maxRenderLimit ?? definition.renderLimit,
        sampleMode: payload.sampleMode || 'detail',
        large,
        largeThreshold,
        optimized: payload.optimized === true,
        detailLevel: payload.detailLevel ?? 0,
        zoomScale: payload.zoomScale ?? 1,
        sampleWindow: payload.sampleWindow || null,
        targetMs: 1000
      },
      ...patch
    };
    return option;
  }

  function mountPerfPanel(chartElement, definition, state, run, controlsPanel = null) {
    const stage = chartElement.closest?.('.demo-stage');
    if (!stage || !root.document?.createElement) return null;
    stage.classList.add('demo-stage--with-controls', 'demo-stage--large');

    const panel = root.document.createElement(controlsPanel ? 'section' : 'aside');
    panel.className = controlsPanel ? 'demo-perf-panel' : 'demo-controls demo-perf-panel';
    panel.innerHTML = [
      '<div class="demo-controls__header">',
      '<h2>Performance</h2>',
      '<div class="demo-controls__actions"><button class="demo-control-button" type="button" data-perf-run>Run</button></div>',
      '</div>',
      '<section class="demo-perf-summary">',
      `<div><span>Target</span><strong>1000ms</strong></div>`,
      `<div><span>Max data</span><strong>${formatNumber(definition.maxCount)}</strong></div>`,
      `<div><span>Render cap</span><strong>${formatNumber(definition.renderLimit)}</strong></div>`,
      '</section>',
      '<label class="demo-control demo-control--select">',
      '<span class="demo-control__topline"><span class="demo-control__label">Raw rows</span><span class="demo-control__value" data-perf-count-label></span></span>',
      '<select data-perf-count></select>',
      '</label>',
      '<section class="demo-perf-results" data-perf-results>Waiting...</section>'
    ].join('');

    const select = panel.querySelector('[data-perf-count]');
    const label = panel.querySelector('[data-perf-count-label]');
    countPresets.forEach((value) => {
      const option = root.document.createElement('option');
      option.value = String(value);
      option.textContent = formatNumber(value);
      select.append(option);
    });
    select.value = String(nearestPreset(state.count));
    state.count = Number(select.value);
    label.textContent = formatNumber(state.count);
    select.addEventListener('change', () => {
      state.count = Number(select.value);
      label.textContent = formatNumber(state.count);
      run();
    });
    panel.querySelector('[data-perf-run]')?.addEventListener('click', run);

    const existing = stage.querySelector('.demo-perf-panel');
    if (existing) existing.remove();
    if (controlsPanel) {
      const form = controlsPanel.querySelector?.('.demo-controls__form');
      controlsPanel.insertBefore(panel, form || null);
    } else {
      stage.append(panel);
    }
    return panel;
  }

  function updatePerfPanel(panel, result) {
    if (!panel) return;
    const target = panel.querySelector('[data-perf-results]');
    if (!target) return;
    const rows = [
      ['Raw', formatNumber(result.rawCount)],
      ['Rendered', formatNumber(result.renderCount)],
      ['Optimize', formatLargeOptimization(result)],
      ['Sample', `${result.sampleMode} L${result.detailLevel}`],
      ['Focus', formatSampleWindow(result.sampleWindow)],
      ['Zoom', `${Math.round(finiteNumber(Number(result.zoomScale), 1) * 100)}%`],
      ['Displayables', formatNumber(result.displayableCount)],
      ['Data', `${result.steps.dataMs}ms`],
      ['Option', `${result.steps.optionMs}ms`],
      ['setOption', `${result.steps.setOptionMs}ms`],
      ['First frame', `${result.steps.firstFrameMs}ms`],
      ['Finished', `${result.steps.finishedMs}ms`],
      ['Total', `${result.steps.totalMs}ms`],
      ['Inspect', `${result.steps.inspectMs}ms`]
    ];
    target.innerHTML = rows
      .map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`)
      .join('');
    target.dataset.overBudget = result.overBudget ? 'true' : 'false';
  }

  function waitForFinished(chart) {
    return new Promise((resolve) => {
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        chart.off?.('finished', done);
        resolve();
      };
      chart.on?.('finished', done);
      root.setTimeout?.(done, 4000);
    });
  }

  function nextFrame() {
    return new Promise((resolve) => {
      const raf = root.requestAnimationFrame || ((callback) => root.setTimeout(callback, 16));
      raf(() => resolve());
    });
  }

  function countDisplayables(chart) {
    const list = chart.getZr?.().storage?.getDisplayList?.() || [];
    return list.filter((element) => element.type !== 'group').length;
  }

  function roundResult(result) {
    Object.keys(result.steps).forEach((key) => {
      result.steps[key] = Math.round(result.steps[key] * 10) / 10;
    });
    result.reductionRatio = Math.round(result.reductionRatio * 100000) / 100000;
    return result;
  }

  function withMeta(data, rawCount, renderCount, meta = {}) {
    return {
      data,
      rawCount: clampCount(rawCount, ONE_MILLION),
      renderCount,
      ...meta
    };
  }

  function clampCount(value, max) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return Math.min(1000, max);
    return Math.max(1, Math.min(Math.floor(numeric), max));
  }

  function clampLargeThreshold(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return DEFAULT_LARGE_THRESHOLD;
    return Math.max(0, Math.min(Math.floor(numeric), ONE_MILLION));
  }

  function readCountFromLocation(fallback) {
    return readNumericQuery('count', fallback);
  }

  function readNumericQuery(key, fallback) {
    try {
      const params = new URLSearchParams(root.location?.search || '');
      const value = Number(params.get(key));
      return Number.isFinite(value) && value > 0 ? value : fallback;
    } catch {
      return fallback;
    }
  }

  function nearestPreset(value) {
    return countPresets.reduce((best, next) => (
      Math.abs(next - value) < Math.abs(best - value) ? next : best
    ), countPresets[0]);
  }

  function now() {
    return root.performance?.now ? root.performance.now() : Date.now();
  }

  function formatNumber(value) {
    return Math.round(Number(value) || 0).toLocaleString('en-US');
  }

  function formatSampleWindow(window) {
    if (!window) return 'All';
    const start = Math.round(finiteNumber(Number(window.startFraction), 0) * 100);
    const end = Math.round(finiteNumber(Number(window.endFraction), 1) * 100);
    return `${start}-${end}%`;
  }

  function formatLargeOptimization(result) {
    const mode = result.optimized ? 'on' : 'off';
    return `${mode} >${formatNumber(result.largeThreshold)}`;
  }

  function finiteNumber(value, fallback) {
    return Number.isFinite(value) ? value : fallback;
  }

  function clampFraction(value) {
    const numeric = finiteNumber(Number(value), 0);
    return Math.max(0, Math.min(1, numeric));
  }

  function cloneJsonValue(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function pad2(value) {
    return String(Math.trunc(value)).padStart(2, '0');
  }

  namespace.ONE_MILLION = ONE_MILLION;
  namespace.countPresets = countPresets;
  namespace.cases = cases;
  namespace.createSamplingPlan = createSamplingPlan;
  namespace.detailLevelForScale = detailLevelForScale;
  namespace.shouldRefreshDetailForViewport = shouldRefreshDetailForViewport;
  namespace.createLargeControls = createLargeControls;
  namespace.createLargeControlState = createLargeControlState;
  namespace.createLargeOption = createLargeOption;
  namespace.runPerformanceCase = runPerformanceCase;
  namespace.mount = mount;

  root.document?.addEventListener?.('DOMContentLoaded', () => {
    const caseName = root.document.body?.dataset.largeExample;
    if (caseName) mount(caseName);
  });
})(window);
