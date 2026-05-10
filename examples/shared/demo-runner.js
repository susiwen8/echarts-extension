(function (root) {
  const namespace = root.EChartsExtensionExamples = root.EChartsExtensionExamples || {};
  const remoteCache = new Map();
  const clusterColors = {
    a: '#3f6fd8',
    b: '#248f6a',
    c: '#c77725',
    d: '#9c4f97'
  };
  const graphPalette = ['#2454a6', '#248f6a', '#c77725', '#9c4f97', '#5f6fb4', '#c4554d', '#4b8f8c'];
  const easingOptions = ['cubicOut', 'linear', 'quadraticOut', 'quarticOut', 'elasticOut'];
  const viewportZoomStep = 1.12;
  const minViewportScale = 0.45;
  const maxViewportScale = 4;
  const shortestAnimationDuration = 120;
  const addDataPalette = ['#2454a6', '#248f6a', '#c77725', '#9c4f97', '#5f6fb4', '#c4554d', '#4b8f8c'];
  const addDataCategories = ['Growth', 'Platform', 'Insights', 'Research', 'Operations'];
  const addDataStages = ['New', 'Returning', 'Dormant'];
  const addDataTeams = ['Design', 'Engineering', 'Operations', 'Support'];
  const defaultEmphasisItemStyle = {
    shadowBlur: 12,
    shadowColor: 'rgba(23, 32, 51, 0.24)',
    borderColor: '#111827',
    borderWidth: 2.4
  };
  const sunriseSunsetDemoDate = '2026-05-05';
  const sunriseSunsetSunIcon = {
    path: 'M 0 -18 L 4.2 -7.2 L 15.6 -11 L 10.2 -1.8 L 20 5 L 8.4 6.3 L 9.6 18 L 0 11.2 L -9.6 18 L -8.4 6.3 L -20 5 L -10.2 -1.8 L -15.6 -11 L -4.2 -7.2 Z',
    style: { fill: '#ffa72b' }
  };
  const sunriseSunsetMoonIcon = {
    path: 'M -13 0 C -10 -13 4 -19 16 -11 C 7 -10 1 -4 1 5 C 1 11 5 16 11 18 C 0 19 -11 12 -13 0 Z',
    style: { fill: '#5a91f2' }
  };
  const fallbackRadialBoxplotData = [
    { name: 'Oceania', min: 1, q1: 8, median: 13, q3: 21, max: 24, itemStyle: { color: '#2f83ed' } },
    { name: 'East Europe', min: 4, q1: 9, median: 12, q3: 15, max: 19, itemStyle: { color: '#28c3c7' } },
    { name: 'Australia', min: 8, q1: 13, median: 16, q3: 20, max: 26, itemStyle: { color: '#fb8b50' } },
    { name: 'South America', min: 7, q1: 11, median: 14, q3: 22, max: 28, itemStyle: { color: '#c973ee' } },
    { name: 'North Africa', min: 6, q1: 11, median: 15, q3: 18, max: 23, itemStyle: { color: '#7566f1' } },
    { name: 'North America', min: 9, q1: 15, median: 22, q3: 28, max: 31, itemStyle: { color: '#64c933' } },
    { name: 'West Europe', min: 6, q1: 11, median: 14, q3: 18, max: 24, itemStyle: { color: '#c89b2f' } },
    { name: 'West Africa', min: 1, q1: 5, median: 8, q3: 12, max: 16, itemStyle: { color: '#f070be' } }
  ];

  const registry = {
    radial: {
      controls: graphControls('Radial', [
        rangeControl('layoutUnitRadius', 'Unit radius', 'series.0.layout.unitRadius', 72, 24, 160, 4),
        rangeControl('layoutLinkDistance', 'Link distance', 'series.0.layout.linkDistance', 118, 40, 220, 4),
        checkboxControl('layoutPreventOverlap', 'Prevent overlap', 'series.0.layout.preventOverlap', true),
        selectControl('layoutSortBy', 'Sort by', 'series.0.layout.sortBy', 'data', ['data', 'degree'])
      ], { enterDuration: 720, enterStagger: 45 }),
      option: (data) => graphOption('radial', data.radialGraph || data.graph, {
        animation: true,
        enterAnimation: {
          duration: 720,
          stagger: 45,
          easing: 'cubicOut'
        },
        layout: {
          center: ['50%', '52%'],
          unitRadius: 72,
          linkDistance: 118,
          preventOverlap: true,
          sortBy: 'data'
        }
      }, 'Radial')
    },
    concentric: {
      controls: graphControls('Concentric', [
        rangeControl('layoutMaxLevelDiff', 'Max level diff', 'series.0.layout.maxLevelDiff', 1, 0.25, 6, 0.25),
        checkboxControl('layoutPreventOverlap', 'Prevent overlap', 'series.0.layout.preventOverlap', true),
        checkboxControl('layoutEquidistant', 'Equidistant rings', 'series.0.layout.equidistant', false),
        selectControl('layoutSortBy', 'Sort by', 'series.0.layout.sortBy', 'degree', ['degree', 'data'])
      ], { enterDuration: 700, enterStagger: 35 }),
      option: (data) => graphOption('concentric', data.concentricGraph || data.graph, {
        animation: true,
        enterAnimation: {
          duration: 700,
          stagger: 35,
          easing: 'cubicOut'
        },
        label: {
          show: false
        },
        layout: {
          center: ['50%', '52%'],
          maxLevelDiff: 1,
          sortBy: 'degree',
          preventOverlap: true
        }
      }, 'Concentric')
    },
    grid: {
      controls: graphControls('Grid', [
        rangeControl('layoutCols', 'Columns', 'series.0.layout.cols', 7, 2, 12, 1),
        rangeControl('layoutRows', 'Rows', 'series.0.layout.rows', 5, 2, 10, 1),
        rangeControl('layoutNodeSpacing', 'Node spacing', 'series.0.layout.nodeSpacing', 8, 0, 32, 1),
        rangeControl('layoutPreventOverlapPadding', 'Overlap padding', 'series.0.layout.preventOverlapPadding', 12, 0, 40, 1),
        checkboxControl('layoutPreventOverlap', 'Prevent overlap', 'series.0.layout.preventOverlap', true),
        checkboxControl('layoutCondense', 'Condense', 'series.0.layout.condense', false),
        selectControl('layoutSortBy', 'Sort by', 'series.0.layout.sortBy', 'cluster', ['cluster', 'value', 'degree', 'data'])
      ], { enterDuration: 680, enterStagger: 24 }),
      option: (data) => graphOption('grid', data.gridGraph || data.graph, {
        animation: true,
        enterAnimation: {
          duration: 680,
          stagger: 24,
          easing: 'cubicOut'
        },
        layout: {
          center: ['50%', '52%'],
          cols: 7,
          rows: 5,
          nodeSpacing: 8,
          preventOverlap: true,
          preventOverlapPadding: 12,
          sortBy: 'cluster'
        }
      }, 'Grid')
    },
    mds: {
      controls: graphControls('MDS', [
        rangeControl('layoutLinkDistance', 'Link distance', 'series.0.layout.linkDistance', 88, 30, 180, 2),
        checkboxControl('layoutPreventOverlap', 'Prevent overlap', 'series.0.layout.preventOverlap', true),
        rangeControl('layoutNodeSpacing', 'Node spacing', 'series.0.layout.nodeSpacing', 10, 0, 36, 1)
      ], { enterDuration: 760, enterStagger: 40 }),
      option: (data) => graphOption('mds', data.mdsGraph || data.graph, {
        animation: true,
        enterAnimation: {
          duration: 760,
          stagger: 40,
          easing: 'cubicOut'
        },
        layout: {
          center: ['50%', '52%'],
          linkDistance: 88,
          preventOverlap: true,
          nodeSpacing: 10
        }
      }, 'MDS')
    },
    arc: {
      controls: graphControls('Arc', [
        rangeControl('layoutNodeSep', 'Node separation', 'series.0.layout.nodeSep', 58, 12, 120, 2),
        rangeControl('edgeDuration', 'Edge duration', 'series.0.edgeAnimation.duration', 720, 120, 1800, 20),
        rangeControl('edgeStagger', 'Edge stagger', 'series.0.edgeAnimation.stagger', 80, 0, 220, 5),
        selectControl('edgeEasing', 'Edge easing', 'series.0.edgeAnimation.easing', 'cubicOut', easingOptions)
      ], { enterDuration: 620, enterStagger: 55 }),
      option: (data) => graphOption('arc', data.graph, {
        animation: true,
        label: {
          show: true,
          position: 'bottom',
          fontSize: 12,
          color: '#374151'
        },
        layout: {
          nodeSep: 58
        },
        fisheye: {
          preview: true
        },
        edgeAnimation: {
          duration: 720,
          stagger: 80,
          easing: 'cubicOut'
        },
        enterAnimation: {
          duration: 620,
          stagger: 55,
          easing: 'cubicOut'
        }
      }, 'Arc')
    },
    'radial-area': {
      controls: [
        ...commonChartControls('Radial Range Area', [0, 1]),
        rangeControl('enterDuration', 'Enter duration', ['series.0.enterAnimation.duration', 'series.1.enterAnimation.duration'], 760, 120, 1800, 20),
        rangeControl('enterStagger', 'Enter stagger', ['series.0.enterAnimation.stagger', 'series.1.enterAnimation.stagger'], 36, 0, 180, 3),
        rangeControl('innerRadius', 'Inner radius %', ['series.0.innerRadius', 'series.1.innerRadius'], 36, 8, 72, 1, percentValue),
        rangeControl('outerRadius', 'Outer radius %', ['series.0.outerRadius', 'series.1.outerRadius'], 91, 42, 100, 1, percentValue),
        rangeControl('padding', 'Padding', ['series.0.padding', 'series.1.padding'], 34, 0, 90, 2),
        rangeControl('valueMin', 'Value min', ['series.0.min', 'series.1.min'], 20, 0, 80, 1),
        rangeControl('valueMax', 'Value max', ['series.0.max', 'series.1.max'], 90, 40, 130, 1),
        rangeControl('tickCount', 'Tick count', ['series.0.tickCount', 'series.1.tickCount'], 5, 2, 10, 1),
        rangeControl('bandOpacity', 'Band opacity', ['series.0.rangeAreaStyle.opacity', 'series.1.rangeAreaStyle.opacity'], 0.84, 0.1, 1, 0.02),
        rangeControl('lineWidth', 'Line width', 'series.1.lineStyle.width', 2.4, 0, 8, 0.2),
        checkboxControl('showSymbol', 'Show symbols', 'series.1.showSymbol', false)
      ],
      option: (data) => ({
        animation: true,
        backgroundColor: '#ffffff',
        title: title('Radial Range Area'),
        series: [
          radialAreaBase(data, 'minmin', 'maxmax', {
            enterAnimation: {
              duration: 820,
              stagger: 45,
              easing: 'cubicOut'
            },
            radialAxis: {
              label: { color: '#8892a6', fontSize: 13 },
              splitLine: { lineStyle: { color: '#dbe3ef', width: 1, opacity: 0.74, type: 'dashed' } }
            },
            rangeAreaStyle: { color: '#e8eff7', opacity: 0.98 },
            lineStyle: { width: 0, opacity: 0 }
          }),
          radialAreaBase(data, 'min', 'max', {
            enterAnimation: {
              duration: 760,
              stagger: 36,
              easing: 'cubicOut'
            },
            grid: { show: false },
            radialAxis: { show: false },
            rangeAreaStyle: { color: '#c9dceb', opacity: 0.84 },
            lineStyle: { color: '#3f86bd', width: 2.4 },
            showSymbol: false,
            itemStyle: { color: '#3f86bd', borderColor: '#ffffff', borderWidth: 1.3 }
          })
        ]
      })
    },
    'radial-boxplot': {
      controls: [
        ...commonChartControls('Radial Boxplot', [0]),
        rangeControl('enterDuration', 'Enter duration', 'series.0.enterAnimation.duration', 680, 120, 1800, 20),
        rangeControl('enterStagger', 'Enter stagger', 'series.0.enterAnimation.stagger', 34, 0, 180, 2),
        rangeControl('innerRadius', 'Inner radius %', 'series.0.innerRadius', 18, 0, 62, 1, percentValue),
        rangeControl('outerRadius', 'Outer radius %', 'series.0.outerRadius', 82, 38, 100, 1, percentValue),
        rangeControl('padding', 'Padding', 'series.0.padding', 42, 0, 100, 2),
        rangeControl('valueMin', 'Value min', 'series.0.min', 0, 0, 20, 1),
        rangeControl('valueMax', 'Value max', 'series.0.max', 32, 20, 50, 1),
        rangeControl('tickCount', 'Tick count', 'series.0.tickCount', 7, 2, 10, 1),
        rangeControl('boxWidth', 'Box width', 'series.0.boxWidth', 0.58, 0.12, 0.96, 0.02),
        rangeControl('capWidth', 'Cap width', 'series.0.capWidth', 0.34, 0.08, 0.9, 0.02),
        rangeControl('boxOpacity', 'Box opacity', 'series.0.itemStyle.opacity', 0.96, 0.1, 1, 0.02),
        rangeControl('lineWidth', 'Line width', [
          'series.0.whiskerLineStyle.width',
          'series.0.medianLineStyle.width',
          'series.0.capLineStyle.width'
        ], 1.2, 0.4, 5, 0.1),
        checkboxControl('angleLabels', 'Angle labels', 'series.0.angleAxis.label.show', true),
        checkboxControl('radialLabels', 'Value labels', 'series.0.radialAxis.label.show', true)
      ],
      option: (data) => {
        const boxplotData = Array.isArray(data.radialBoxplot) && data.radialBoxplot.length
          ? data.radialBoxplot
          : fallbackRadialBoxplotData;
        return {
          animation: true,
          backgroundColor: '#ffffff',
          title: title('Radial Boxplot'),
          series: [
            {
              type: 'radialBoxplot',
              top: 58,
              width: '94%',
              height: '88%',
              padding: 42,
              innerRadius: '18%',
              outerRadius: '82%',
              startAngle: 90,
              clockwise: true,
              categoryField: 'name',
              categories: boxplotData.map((item) => item.name),
              min: 0,
              max: 32,
              tickCount: 7,
              boxWidth: 0.58,
              capWidth: 0.34,
              data: boxplotData,
              enterAnimation: { duration: 680, stagger: 34, easing: 'cubicOut' },
              radialAxis: {
                label: { color: '#9aa0a6', fontSize: 13 },
                splitLine: { lineStyle: { color: '#d8dee8', width: 1, opacity: 0.62, type: 'dashed' } }
              },
              angleAxis: {
                label: { color: '#8d949e', fontSize: 14, rotate: 'tangential' },
                splitLine: { show: false }
              },
              itemStyle: { opacity: 0.96, borderColor: '#111111', borderWidth: 1.2 },
              whiskerLineStyle: { color: '#111111', width: 1.2 },
              medianLineStyle: { color: '#111111', width: 1.2 },
              capLineStyle: { color: '#111111', width: 1.2 }
            }
          ]
        };
      }
    },
    'venn-hollow': {
      controls: [
        ...commonChartControls('Hollow Venn', [0]),
        rangeControl('enterDuration', 'Enter duration', 'series.0.enterAnimation.duration', 620, 120, 1800, 20),
        rangeControl('enterStagger', 'Enter stagger', 'series.0.enterAnimation.stagger', 80, 0, 220, 5),
        rangeControl('borderWidth', 'Border width', 'series.0.hollowStyle.borderWidth', 7, 1, 18, 1),
        rangeControl('hollowOpacity', 'Hollow opacity', 'series.0.hollowStyle.opacity', 0.9, 0.1, 1, 0.02),
        checkboxControl('labelShow', 'Labels', 'series.0.label.show', true),
        rangeControl('labelFontSize', 'Label size', 'series.0.label.fontSize', 13, 8, 24, 1)
      ],
      option: (data) => ({
        animation: true,
        backgroundColor: '#ffffff',
        title: title('Hollow Venn'),
        legend: {
          data: data.hollowVenn.map((item) => item.name),
          top: 58,
          left: 'center',
          itemWidth: 12,
          itemHeight: 8,
          textStyle: { color: '#374151', fontSize: 12 }
        },
        series: [
          {
            type: 'venn',
            layout: 'hollow',
            top: 92,
            width: '86%',
            height: '72%',
            data: data.hollowVenn,
            enterAnimation: { duration: 620, stagger: 80, easing: 'cubicOut' },
            hollowStyle: { borderWidth: 7, opacity: 0.9 },
            label: { show: true, fontSize: 13, color: '#111827', fontWeight: 650 }
          }
        ]
      })
    },
    'venn-bubble': {
      controls: [
        ...commonChartControls('Bubble Venn', [0]),
        rangeControl('enterDuration', 'Enter duration', 'series.0.enterAnimation.duration', 620, 120, 1800, 20),
        rangeControl('enterStagger', 'Enter stagger', 'series.0.enterAnimation.stagger', 55, 0, 220, 5),
        rangeControl('padding', 'Padding', 'series.0.padding', 20, 0, 80, 2),
        rangeControl('minRadius', 'Min radius', 'series.0.minRadius', 20, 4, 80, 1),
        rangeControl('maxRadius', 'Max radius', 'series.0.maxRadius', 92, 24, 150, 2),
        rangeControl('itemOpacity', 'Bubble opacity', 'series.0.itemStyle.opacity', 0.62, 0.1, 1, 0.02),
        checkboxControl('labelShow', 'Labels', 'series.0.label.show', true),
        rangeControl('labelFontSize', 'Label size', 'series.0.label.fontSize', 12, 8, 24, 1)
      ],
      option: (data) => ({
        animation: true,
        backgroundColor: '#ffffff',
        title: title('Bubble Venn'),
        series: [
          {
            type: 'venn',
            layout: 'bubble',
            top: 60,
            width: '92%',
            height: '82%',
            padding: 20,
            minRadius: 20,
            maxRadius: 92,
            data: data.bubbleVenn,
            enterAnimation: { duration: 620, stagger: 55, easing: 'cubicOut' },
            itemStyle: { opacity: 0.62, borderColor: '#ffffff', borderWidth: 1.5 },
            label: { show: true, fontSize: 12, color: '#1f2937', fontWeight: 650 }
          }
        ]
      })
    },
    'pack-bubble': {
      controls: [
        textControl('titleText', 'Title', 'title.text', 'Population Pack Bubble'),
        colorControl('backgroundColor', 'Background', 'backgroundColor', '#151515'),
        checkboxControl('animationEnabled', 'Animation', ['animation', 'series.0.animation'], true),
        rangeControl('enterDuration', 'Enter duration', 'series.0.enterAnimation.duration', 680, 120, 1800, 20),
        rangeControl('enterStagger', 'Enter stagger', 'series.0.enterAnimation.stagger', 14, 0, 120, 2),
        rangeControl('padding', 'Padding', 'series.0.padding', 10, 0, 80, 2),
        rangeControl('gap', 'Gap', 'series.0.gap', 2, 0, 12, 0.5),
        rangeControl('maxRadius', 'Max radius', 'series.0.maxRadius', 88, 24, 130, 2),
        rangeControl('fillRatio', 'Fill ratio', 'series.0.fillRatio', 0.84, 0.3, 0.9, 0.01),
        rangeControl('itemOpacity', 'Bubble opacity', 'series.0.itemStyle.opacity', 0.9, 0.1, 1, 0.02),
        checkboxControl('labelShow', 'Labels', 'series.0.label.show', true),
        rangeControl('labelFontSize', 'Label size', 'series.0.label.fontSize', 13, 8, 24, 1),
        rangeControl('labelMinRadius', 'Label min radius', 'series.0.label.minRadius', 30, 10, 70, 1)
      ],
      option: (data) => ({
        animation: true,
        backgroundColor: '#151515',
        title: {
          text: 'Population Pack Bubble',
          left: 'center',
          top: 18,
          textStyle: {
            color: '#f4f4f5',
            fontSize: 22,
            fontWeight: 720
          }
        },
        series: [
          {
            type: 'packBubble',
            top: 48,
            width: '98%',
            height: '90%',
            padding: 10,
            gap: 2,
            maxRadius: 88,
            fillRatio: 0.84,
            categoryField: 'category',
            data: data.packBubble,
            enterAnimation: { duration: 680, stagger: 14, easing: 'cubicOut' },
            itemStyle: {
              opacity: 0.9,
              borderColor: 'rgba(255, 255, 255, 0.56)',
              borderWidth: 1.3
            },
            label: {
              show: true,
              color: '#06070a',
              fontSize: 13,
              fontWeight: 650,
              lineHeight: 15,
              minRadius: 30
            },
            emphasis: {
              itemStyle: {
                opacity: 1,
                borderColor: '#ffffff',
                borderWidth: 2,
                shadowBlur: 14,
                shadowColor: 'rgba(255, 255, 255, 0.22)'
              }
            }
          }
        ]
      })
    },
    'circle-packing': {
      controls: [
        textControl('titleText', 'Title', 'title.text', 'Product Circle Packing'),
        colorControl('backgroundColor', 'Background', 'backgroundColor', '#f8fafc'),
        checkboxControl('animationEnabled', 'Animation', ['animation', 'series.0.animation'], true),
        rangeControl('enterDuration', 'Enter duration', 'series.0.enterAnimation.duration', 720, 120, 1800, 20),
        rangeControl('enterStagger', 'Enter stagger', 'series.0.enterAnimation.stagger', 28, 0, 160, 2),
        rangeControl('padding', 'Padding', 'series.0.padding', 12, 0, 80, 2),
        rangeControl('nodePadding', 'Node padding', 'series.0.nodePadding', 4, 0, 14, 0.5),
        rangeControl('siblingGap', 'Sibling gap', 'series.0.siblingGap', 2, 0, 12, 0.5),
        rangeControl('itemOpacity', 'Circle opacity', 'series.0.itemStyle.opacity', 0.88, 0.1, 1, 0.02),
        checkboxControl('labelShow', 'Labels', 'series.0.label.show', true),
        rangeControl('labelFontSize', 'Label size', 'series.0.label.fontSize', 12, 8, 24, 1),
        rangeControl('labelMinRadius', 'Label min radius', 'series.0.label.minRadius', 20, 8, 70, 1)
      ],
      option: (data) => ({
        animation: true,
        backgroundColor: '#f8fafc',
        title: title('Product Circle Packing'),
        series: [
          {
            type: 'circlePacking',
            top: 68,
            width: '94%',
            height: '84%',
            padding: 12,
            nodePadding: 4,
            siblingGap: 2,
            data: data.circlePacking,
            enterAnimation: { duration: 720, stagger: 28, easing: 'cubicOut' },
            itemStyle: {
              opacity: 0.88,
              borderColor: '#ffffff',
              borderWidth: 1.4
            },
            label: {
              show: true,
              color: '#111827',
              fontSize: 12,
              fontWeight: 680,
              lineHeight: 14,
              minRadius: 20
            },
            emphasis: {
              itemStyle: {
                opacity: 1,
                borderColor: '#0f172a',
                borderWidth: 2,
                shadowBlur: 12,
                shadowColor: 'rgba(15, 23, 42, 0.2)'
              }
            }
          }
        ]
      })
    },
    'nested-circle': {
      controls: [
        ...commonChartControls('Data Skill Roadmap', [0]),
        rangeControl('enterDuration', 'Enter duration', 'series.0.enterAnimation.duration', 760, 120, 1800, 20),
        rangeControl('enterStagger', 'Enter stagger', 'series.0.enterAnimation.stagger', 110, 0, 240, 5),
        rangeControl('padding', 'Padding', 'series.0.padding', 8, 0, 60, 1),
        rangeControl('centerRadiusRatio', 'Center radius', 'series.0.centerRadiusRatio', 0.3, 0.1, 0.65, 0.01),
        rangeControl('ringBorderWidth', 'Ring border', 'series.0.ringStyle.borderWidth', 1, 0, 6, 0.2),
        rangeControl('ringOpacity', 'Ring opacity', 'series.0.ringStyle.opacity', 0.98, 0.1, 1, 0.02),
        checkboxControl('titleShow', 'Ring titles', 'series.0.titleLabel.show', true),
        rangeControl('titleFontSize', 'Title size', 'series.0.titleLabel.fontSize', 18, 10, 30, 1),
        checkboxControl('labelShow', 'Child labels', 'series.0.label.show', true),
        rangeControl('labelFontSize', 'Child label size', 'series.0.label.fontSize', 10, 7, 18, 1)
      ],
      option: (data) => ({
        animation: true,
        backgroundColor: '#ffffff',
        title: title('Data Skill Roadmap'),
        series: [
          {
            type: 'nestedCircle',
            top: 76,
            width: '94%',
            height: '84%',
            padding: 8,
            centerRadiusRatio: 0.3,
            data: data.nestedCircle,
            enterAnimation: { duration: 760, stagger: 110, easing: 'cubicOut' },
            ringStyle: { borderColor: 'rgba(30, 58, 138, 0.42)', borderWidth: 1, opacity: 0.98 },
            titleLabel: { show: true, color: '#0f172a', fontSize: 18, fontWeight: 750, lineHeight: 22 },
            label: { show: true, color: '#111827', fontSize: 10, fontWeight: 500, lineHeight: 12 }
          }
        ]
      })
    },
    mosaic: {
      controls: [
        ...commonChartControls('Acquisition Cohorts', [0]),
        rangeControl('enterDuration', 'Enter duration', 'series.0.enterAnimation.duration', 700, 120, 1800, 20),
        rangeControl('enterStagger', 'Enter stagger', 'series.0.enterAnimation.stagger', 35, 0, 160, 5),
        rangeControl('padding', 'Padding', 'series.0.padding', 10, 0, 60, 1),
        rangeControl('tileGap', 'Tile gap', 'series.0.gap', 3, 0, 14, 1),
        rangeControl('borderWidth', 'Border width', 'series.0.itemStyle.borderWidth', 1.5, 0, 6, 0.25),
        rangeControl('itemOpacity', 'Tile opacity', 'series.0.itemStyle.opacity', 0.94, 0.1, 1, 0.02),
        checkboxControl('labelShow', 'Labels', 'series.0.label.show', true),
        rangeControl('labelFontSize', 'Label size', 'series.0.label.fontSize', 12, 8, 22, 1)
      ],
      option: (data) => ({
        animation: true,
        backgroundColor: '#ffffff',
        title: title('Acquisition Cohorts'),
        series: [
          {
            type: 'mosaic',
            top: 70,
            width: '90%',
            height: '80%',
            padding: 10,
            gap: 3,
            xField: 'channel',
            yField: 'stage',
            valueField: 'users',
            yCategories: ['New', 'Returning', 'Dormant'],
            data: data.mosaic,
            enterAnimation: { duration: 700, stagger: 35, easing: 'cubicOut' },
            itemStyle: { borderColor: '#ffffff', borderWidth: 1.5, opacity: 0.94 },
            label: { show: true, color: '#172033', fontSize: 12, fontWeight: 650, formatter: '{x}\n{y}: {c}' }
          }
        ]
      })
    },
    'voronoi-treemap': {
      controls: [
        ...commonChartControls('Product Portfolio', [0]),
        rangeControl('enterDuration', 'Enter duration', 'series.0.enterAnimation.duration', 640, 120, 1800, 20),
        rangeControl('enterStagger', 'Enter stagger', 'series.0.enterAnimation.stagger', 18, 0, 120, 2),
        rangeControl('padding', 'Padding', 'series.0.padding', 12, 0, 64, 1),
        rangeControl('cellGap', 'Cell gap', 'series.0.gap', 2, 0, 10, 0.5),
        rangeControl('maxIteration', 'Iterations', 'series.0.maxIteration', 24, 4, 48, 1),
        rangeControl('borderWidth', 'Border width', 'series.0.itemStyle.borderWidth', 1.2, 0, 6, 0.2),
        rangeControl('itemOpacity', 'Cell opacity', 'series.0.itemStyle.opacity', 0.94, 0.1, 1, 0.02),
        checkboxControl('labelShow', 'Labels', 'series.0.label.show', true),
        checkboxControl('labelInternal', 'Group labels', 'series.0.label.showInternal', false),
        rangeControl('labelFontSize', 'Label size', 'series.0.label.fontSize', 12, 8, 22, 1)
      ],
      option: (data) => ({
        animation: true,
        backgroundColor: '#ffffff',
        title: title('Product Portfolio'),
        series: [
          {
            type: 'voronoiTreemap',
            top: 70,
            width: '90%',
            height: '80%',
            padding: 12,
            gap: 2,
            rootVisible: false,
            sort: true,
            maxIteration: 24,
            data: data.voronoiTreemap,
            enterAnimation: { duration: 640, stagger: 18, easing: 'cubicOut' },
            itemStyle: { borderColor: '#ffffff', borderWidth: 1.2, opacity: 0.94 },
            label: { show: true, showInternal: false, color: '#172033', fontSize: 12, fontWeight: 650, formatter: '{b}' }
          }
        ]
      })
    },
    subway: {
      controls: [
        ...commonChartControls('Subway Schematic', [0]),
        rangeControl('enterDuration', 'Enter duration', 'series.0.enterAnimation.duration', 760, 120, 1800, 20),
        rangeControl('enterStagger', 'Enter stagger', 'series.0.enterAnimation.stagger', 65, 0, 220, 5),
        rangeControl('padding', 'Padding', 'series.0.padding', 34, 0, 100, 2),
        rangeControl('lineWidth', 'Line width', 'series.0.lineWidth', 9, 2, 20, 1),
        rangeControl('stationRadius', 'Station radius', 'series.0.stationRadius', 4, 1, 12, 0.5),
        rangeControl('interchangeRadius', 'Interchange radius', 'series.0.interchangeRadius', 8, 2, 18, 0.5),
        checkboxControl('labelShow', 'Station labels', 'series.0.label.show', true),
        rangeControl('labelFontSize', 'Station label size', 'series.0.label.fontSize', 11, 7, 20, 1),
        checkboxControl('routeLabelShow', 'Route labels', 'series.0.routeLabel.show', true)
      ],
      option: (data) => ({
        animation: true,
        backgroundColor: '#ffffff',
        title: title('Subway Schematic'),
        series: [
          {
            type: 'subway',
            top: 68,
            width: '92%',
            height: '82%',
            padding: 34,
            lineWidth: 9,
            stationRadius: 4,
            interchangeRadius: 8,
            data: data.subway,
            enterAnimation: { duration: 760, stagger: 65, easing: 'cubicOut' },
            label: { show: true, color: '#151b2b', fontSize: 11, fontWeight: 600 },
            routeLabel: { show: true, position: 'end', fontSize: 12, fontWeight: 800 },
            stationStyle: { color: '#ffffff', borderWidth: 2 },
            interchangeStyle: { color: '#ffffff', borderColor: '#1f2937', borderWidth: 3 }
          }
        ]
      })
    },
    flame: {
      controls: [
        ...commonChartControls('Profile Flame Graph', [0]),
        rangeControl('enterDuration', 'Enter duration', 'series.0.enterAnimation.duration', 620, 120, 1800, 20),
        rangeControl('enterStagger', 'Enter stagger', 'series.0.enterAnimation.stagger', 12, 0, 80, 1),
        rangeControl('padding', 'Padding', 'series.0.padding', 4, 0, 40, 1),
        rangeControl('tileGap', 'Tile gap', 'series.0.gap', 1, 0, 8, 0.5),
        selectControl('orient', 'Orientation', 'series.0.orient', 'up', ['up', 'down']),
        checkboxControl('sort', 'Sort by value', 'series.0.sort', false),
        checkboxControl('rootVisible', 'Root visible', 'series.0.rootVisible', false),
        rangeControl('itemOpacity', 'Tile opacity', 'series.0.itemStyle.opacity', 0.96, 0.1, 1, 0.02),
        checkboxControl('labelShow', 'Labels', 'series.0.label.show', true),
        rangeControl('labelFontSize', 'Label size', 'series.0.label.fontSize', 12, 8, 22, 1)
      ],
      option: (data) => ({
        animation: true,
        backgroundColor: '#ffffff',
        title: title('Profile Flame Graph'),
        series: [
          {
            type: 'flame',
            top: 70,
            width: '94%',
            height: '82%',
            padding: 4,
            gap: 1,
            orient: 'up',
            sort: false,
            rootVisible: false,
            data: data.flame,
            enterAnimation: { duration: 620, stagger: 12, easing: 'cubicOut' },
            itemStyle: { borderColor: '#ffffff', borderWidth: 1.2, opacity: 0.96 },
            label: { show: true, color: '#172033', fontSize: 12, fontWeight: 650, formatter: '{b}' }
          }
        ]
      })
    },
    'sunrise-sunset': {
      controls: [
        textControl('titleText', 'Title', 'series.0.title', 'Until sunset'),
        colorControl('backgroundColor', 'Background', ['backgroundColor', 'series.0.backgroundStyle.color'], '#202124'),
        colorControl('dayLineColor', 'Sun line', 'series.0.dayLineStyle.color', '#ffa72b'),
        colorControl('moonLineColor', 'Moon line', 'series.0.moonLineStyle.color', '#5a91f2'),
        colorControl('dayAreaColor', 'Day area', 'series.0.dayAreaStyle.color', '#ffa72b'),
        rangeControl('dayAreaOpacity', 'Day area opacity', 'series.0.dayAreaStyle.opacity', 0.2, 0, 1, 0.02),
        checkboxControl('animationEnabled', 'Animation', ['animation', 'series.0.animation'], true),
        rangeControl('enterDuration', 'Enter duration', 'series.0.enterAnimation.duration', 860, 120, 1800, 20),
        rangeControl('enterStagger', 'Enter stagger', 'series.0.enterAnimation.stagger', 90, 0, 240, 5),
        rangeControl('padding', 'Padding', 'series.0.padding', 150, 40, 220, 5),
        rangeControl('dayArcHeight', 'Day arc height', 'series.0.dayArcHeight', 220, 80, 320, 5),
        rangeControl('moonArcHeight', 'Moon arc height', 'series.0.moonArcHeight', 95, 32, 180, 5),
        rangeControl('moonStartRatio', 'Moon start', 'series.0.moonStartRatio', 0.28, 0, 0.86, 0.01),
        rangeControl('moonEndRatio', 'Moon end', 'series.0.moonEndRatio', 0.72, 0.14, 1, 0.01),
        textControl('sunrise', 'Sunrise', 'series.0.sunrise', '05:12'),
        textControl('sunset', 'Sunset', 'series.0.sunset', '18:39'),
        textControl('moonrise', 'Moonrise', 'series.0.moonrise', '22:08'),
        textControl('moonset', 'Moonset', 'series.0.moonset', '07:59'),
        timeOfDayControl(10 * 60 + 47),
        jsonControl('sunIcon', 'Sun icon', 'series.0.sunIcon', sunriseSunsetSunIcon),
        jsonControl('moonIcon', 'Moon icon', 'series.0.moonIcon', sunriseSunsetMoonIcon),
        rangeControl('titleFontSize', 'Title size', 'series.0.titleLabel.fontSize', 38, 18, 64, 1),
        rangeControl('remainingFontSize', 'Time size', 'series.0.remainingLabel.fontSize', 66, 28, 96, 1),
        rangeControl('eventFontSize', 'Event label size', 'series.0.eventLabel.fontSize', 24, 12, 42, 1),
        checkboxControl('eventLabelShow', 'Event labels', 'series.0.eventLabel.show', true)
      ],
      option: (data) => {
        const current = currentSunriseSunsetData(data);
        return {
          animation: true,
          backgroundColor: '#202124',
          series: [
            {
              type: 'sunriseSunset',
              enterAnimation: { duration: 860, stagger: 90, easing: 'cubicOut' },
              data: Array.isArray(data.sunriseSunset) ? data.sunriseSunset : undefined,
              sunrise: current.sunrise,
              sunset: current.sunset,
              moonrise: current.moonrise,
              moonset: current.moonset,
              currentTime: current.currentTime,
              updatedAt: current.updatedAt,
              title: current.title,
              remainingText: current.remainingText,
              updatedText: current.updatedText,
              padding: 150,
              moonStartRatio: 0.28,
              moonEndRatio: 0.72,
              backgroundStyle: { color: '#202124' },
              dayLineStyle: { color: '#ffa72b' },
              moonLineStyle: { color: '#5a91f2' },
              dayAreaStyle: { color: '#ffa72b', opacity: 0.2 },
              sunIcon: cloneJsonValue(sunriseSunsetSunIcon),
              moonIcon: cloneJsonValue(sunriseSunsetMoonIcon),
              titleLabel: { fontSize: 38, fontWeight: 650 },
              remainingLabel: { fontSize: 66, fontWeight: 300 },
              updatedLabel: { fontSize: 24 },
              eventLabel: { fontSize: 24 }
            }
          ]
        };
      }
    },
    lollipop: {
      controls: [
        textControl('titleText', 'Title', 'title.text', '2024'),
        colorControl('backgroundColor', 'Background', 'backgroundColor', '#141414'),
        checkboxControl('animationEnabled', 'Animation', [
          'animation',
          'series.0.animation'
        ], true),
        rangeControl('enterDuration', 'Enter duration', 'series.0.enterAnimation.duration', 680, 120, 1800, 20),
        rangeControl('enterStagger', 'Enter stagger', 'series.0.enterAnimation.stagger', 38, 0, 180, 2),
        rangeControl('valueMax', 'Value max', 'series.0.max', 2000, 500, 2600, 50),
        rangeControl('tickCount', 'Tick count', 'series.0.tickCount', 5, 2, 9, 1),
        rangeControl('symbolSize', 'Dot size', 'series.0.symbolSize', 13, 4, 28, 1),
        rangeControl('stemWidth', 'Stem width', 'series.0.stemStyle.width', 1.4, 0.5, 8, 0.1),
        rangeControl('categoryRotate', 'Category rotate', 'series.0.categoryAxis.label.rotate', 45, 0, 75, 1),
        checkboxControl('labelShow', 'Value labels', 'series.0.label.show', false)
      ],
      option: (data) => {
        const lollipopData = Array.isArray(data.lollipop) ? data.lollipop : [];
        return {
          animation: true,
          backgroundColor: '#141414',
          title: {
            text: '2024',
            left: 'center',
            top: 10,
            textStyle: {
              color: '#aaaab0',
              fontSize: 20,
              fontWeight: 600
            }
          },
          series: [
            {
              type: 'lollipop',
              top: 42,
              width: '92%',
              height: '84%',
              padding: { top: 12, right: 34, bottom: 88, left: 88 },
              categoryField: 'country',
              valueField: 'population',
              categories: lollipopData.map((item) => item.country),
              min: 0,
              max: 2000,
              baseline: 0,
              tickCount: 5,
              symbolSize: 13,
              data: lollipopData,
              enterAnimation: { duration: 680, stagger: 38, easing: 'cubicOut' },
              valueAxis: {
                name: 'Population',
                label: { color: '#d7d7dc', fontSize: 15, formatter: formatMillions },
                splitLine: {
                  lineStyle: { color: '#303033', width: 1, opacity: 1 }
                },
                axisLine: {
                  lineStyle: { color: '#eeeeee', width: 1.2, opacity: 1 }
                },
                nameTextStyle: { color: '#aeb0b5', fontSize: 15, fontWeight: 600 }
              },
              categoryAxis: {
                label: { color: '#d7d7dc', fontSize: 15, rotate: 45, formatter: '{value}' }
              },
              stemStyle: { color: '#1aa8f2', width: 1.4, opacity: 0.95 },
              itemStyle: { color: '#2db5ff', borderColor: '#2db5ff', borderWidth: 0 },
              label: { show: false, color: '#d7d7dc', fontSize: 12, formatter: '{c}M' }
            }
          ]
        };
      }
    },
    beeswarm: {
      controls: [
        ...commonChartControls('Team Score Beeswarm', [0]),
        selectControl('orient', 'Orientation', 'series.0.orient', 'horizontal', ['horizontal', 'vertical']),
        rangeControl('valueMin', 'Value min', 'series.0.min', 40, 20, 70, 1),
        rangeControl('valueMax', 'Value max', 'series.0.max', 90, 70, 110, 1),
        rangeControl('tickCount', 'Tick count', 'series.0.tickCount', 6, 2, 10, 1),
        rangeControl('symbolSize', 'Dot size', 'series.0.symbolSize', 14, 5, 28, 1),
        rangeControl('collisionPadding', 'Collision padding', 'series.0.collisionPadding', 2, 0, 8, 0.5),
        rangeControl('swarmRadius', 'Swarm radius', 'series.0.swarmRadius', 28, 0, 80, 1),
        checkboxControl('labelShow', 'Labels', 'series.0.label.show', false),
        rangeControl('enterDuration', 'Enter duration', 'series.0.enterAnimation.duration', 560, 120, 1800, 20),
        rangeControl('enterStagger', 'Enter stagger', 'series.0.enterAnimation.stagger', 18, 0, 120, 2)
      ],
      option: (data) => {
        const beeswarmData = Array.isArray(data.beeswarm) ? data.beeswarm : [];
        const categories = ['Design', 'Engineering', 'Operations', 'Support'];
        return {
          animation: true,
          backgroundColor: '#f8fafc',
          title: title('Team Score Beeswarm'),
          series: [
            {
              type: 'beeswarm',
              top: 68,
              width: '92%',
              height: '78%',
              padding: { top: 24, right: 32, bottom: 66, left: 96 },
              categoryField: 'team',
              valueField: 'score',
              nameField: 'name',
              categories,
              orient: 'horizontal',
              min: 40,
              max: 90,
              tickCount: 6,
              symbolSize: 14,
              collisionPadding: 2,
              swarmRadius: 28,
              data: beeswarmData,
              enterAnimation: { duration: 560, stagger: 18, easing: 'cubicOut' },
              valueAxis: {
                name: 'Score',
                label: { color: '#64748b', fontSize: 13, formatter: '{value}' },
                splitLine: {
                  lineStyle: { color: '#d8e0ea', width: 1, opacity: 0.9, type: 'dashed' }
                },
                axisLine: {
                  lineStyle: { color: '#94a3b8', width: 1.1, opacity: 1 }
                },
                nameTextStyle: { color: '#475569', fontSize: 13, fontWeight: 650 }
              },
              categoryAxis: {
                label: { color: '#1f2937', fontSize: 14, fontWeight: 700, formatter: '{value}' }
              },
              itemStyle: { borderColor: '#ffffff', borderWidth: 1.5, opacity: 0.9 },
              label: { show: false, color: '#111827', fontSize: 11, formatter: '{b}' },
              emphasis: {
                itemStyle: {
                  opacity: 1,
                  borderWidth: 2.2,
                  shadowBlur: 8,
                  shadowColor: 'rgba(15, 23, 42, 0.2)'
                }
              }
            }
          ]
        };
      }
    },
    spiral: {
      controls: [
        ...commonChartControls('Spiral Heatmap', [0]),
        rangeControl('enterDuration', 'Enter duration', 'series.0.enterAnimation.duration', 180, 80, 1200, 20),
        rangeControl('enterStagger', 'Enter stagger', 'series.0.enterAnimation.stagger', 80, 0, 240, 5),
        rangeControl('turns', 'Turns', 'series.0.turns', 5, 1, 8, 1),
        rangeControl('segmentsPerTurn', 'Segments/turn', 'series.0.segmentsPerTurn', 20, 6, 32, 1),
        rangeControl('startAngle', 'Start angle', 'series.0.startAngle', -90, -180, 180, 5),
        rangeControl('padding', 'Padding', 'series.0.padding', 18, 0, 80, 2),
        rangeControl('innerRadius', 'Inner radius %', 'series.0.innerRadius', 24, 0, 60, 1, percentValue),
        rangeControl('outerRadius', 'Outer radius %', 'series.0.outerRadius', 94, 40, 100, 1, percentValue),
        rangeControl('radialGap', 'Ring gap', 'series.0.radialGap', 10, 0, 28, 1),
        rangeControl('gapAngle', 'Segment gap', 'series.0.gapAngle', 3.2, 0, 12, 0.2),
        rangeControl('minOpacity', 'Min opacity', 'series.0.minOpacity', 0.16, 0.02, 0.8, 0.02),
        rangeControl('maxOpacity', 'Max opacity', 'series.0.maxOpacity', 0.9, 0.2, 1, 0.02),
        checkboxControl('labelShow', 'Labels', 'series.0.label.show', false)
      ],
      option: (data) => {
        const spiralData = Array.isArray(data.spiral) ? data.spiral : [];
        return {
          animation: true,
          backgroundColor: '#ffffff',
          title: title('Spiral Heatmap'),
          series: [
            {
              type: 'spiral',
              top: 66,
              width: '92%',
              height: '80%',
              padding: 18,
              innerRadius: '24%',
              outerRadius: '94%',
              turns: 5,
              segmentsPerTurn: 20,
              radialGap: 10,
              gapAngle: 3.2,
              startAngle: -90,
              clockwise: true,
              nameField: 'name',
              valueField: 'value',
              data: spiralData,
              minOpacity: 0.16,
              maxOpacity: 0.9,
              enterAnimation: { duration: 180, stagger: 80, easing: 'cubicOut' },
              itemStyle: { color: '#f04438', borderColor: '#ffffff', borderWidth: 0 },
              label: { show: false, color: '#1f2937', fontSize: 11, fontWeight: 650, formatter: '{b}' },
              emphasis: {
                itemStyle: {
                  opacity: 1,
                  borderWidth: 1.2,
                  shadowBlur: 10,
                  shadowColor: 'rgba(239, 68, 68, 0.24)'
                }
              }
            }
          ]
        };
      }
    },
    'vector-field': {
      controls: [
        ...commonChartControls('Wind Vector Field', [0]),
        rangeControl('samplingStep', 'Sample step', 'series.0.samplingStep', 3, 1, 8, 1),
        rangeControl('padding', 'Padding', 'series.0.padding', 22, 0, 80, 2),
        rangeControl('maxLength', 'Max arrow length', 'series.0.maxLength', 13, 4, 32, 1),
        rangeControl('arrowHeadLength', 'Arrow head', 'series.0.arrowHeadLength', 4.5, 1, 12, 0.5),
        rangeControl('lineWidth', 'Line width', 'series.0.lineStyle.width', 1.15, 0.4, 4, 0.05),
        rangeControl('lineOpacity', 'Arrow opacity', 'series.0.lineStyle.opacity', 0.88, 0.1, 1, 0.02),
        colorControl('arrowColor', 'Arrow color', 'series.0.lineStyle.color', '#1d4ed8')
      ],
      option: (data) => ({
        animation: true,
        backgroundColor: '#ffffff',
        title: title('Wind Vector Field'),
        series: [
          {
            type: 'vectorField',
            top: 68,
            width: '94%',
            height: '80%',
            padding: 22,
            data: data.wind,
            samplingStep: 3,
            minLength: 1.5,
            maxLength: 13,
            arrowHeadLength: 4.5,
            xField: 'longitude',
            yField: 'latitude',
            uField: 'u',
            vField: 'v',
            invertY: true,
            enterAnimation: { duration: 540, stagger: 0, easing: 'cubicOut' },
            lineStyle: { color: '#1d4ed8', width: 1.15, opacity: 0.88 },
            emphasis: {
              itemStyle: {
                opacity: 1,
                width: 1.8,
                shadowBlur: 6,
                shadowColor: 'rgba(29, 78, 216, 0.28)'
              }
            }
          }
        ]
      })
    },
    smith: {
      controls: [
        ...commonChartControls('Smith Chart', [0]),
        rangeControl('referenceImpedance', 'Reference ohms', 'series.0.referenceImpedance', 50, 25, 100, 1),
        rangeControl('symbolSize', 'Point size', 'series.0.symbolSize', 9, 3, 22, 1),
        rangeControl('lineWidth', 'Trace width', 'series.0.lineStyle.width', 2.2, 0, 7, 0.1),
        rangeControl('lineOpacity', 'Trace opacity', 'series.0.lineStyle.opacity', 0.96, 0.1, 1, 0.02),
        checkboxControl('swrShow', 'SWR circle', 'series.0.showSwrCircle', false),
        rangeControl('swrIndex', 'SWR point', 'series.0.swrIndex', 1, 0, 6, 1),
        checkboxControl('cursorShow', 'Cursor readout', 'series.0.cursor.show', true),
        checkboxControl('labelShow', 'Point labels', 'series.0.label.show', false),
        checkboxControl('gridLabels', 'Grid labels', 'series.0.grid.label.show', true),
        rangeControl('enterDuration', 'Enter duration', 'series.0.enterAnimation.duration', 620, 120, 1800, 20),
        rangeControl('enterStagger', 'Enter stagger', 'series.0.enterAnimation.stagger', 46, 0, 180, 2)
      ],
      option: (data) => {
        const smithData = Array.isArray(data.smith) ? data.smith : [];
        return {
          animation: true,
          backgroundColor: '#ffffff',
          title: title('Smith Chart'),
          series: [
            {
              type: 'smith',
              top: 66,
              width: '88%',
              height: '82%',
              padding: 24,
              referenceImpedance: 50,
              resistanceField: 'resistance',
              reactanceField: 'reactance',
              resistanceValues: [0, 0.2, 0.5, 1, 2, 4, 10],
              reactanceValues: [-10, -4, -2, -1, -0.5, -0.2, 0.2, 0.5, 1, 2, 4, 10],
              data: smithData,
              symbolSize: 9,
              showSwrCircle: false,
              swrIndex: 1,
              enterAnimation: { duration: 620, stagger: 46, easing: 'cubicOut' },
              grid: {
                label: {
                  show: true,
                  color: '#111827',
                  fontSize: 12,
                  resistanceFormatter: '{ohms}',
                  reactanceFormatter: '{ohms}j'
                },
                unitCircle: { lineStyle: { color: '#303030', width: 1.35 } },
                axisLine: { lineStyle: { color: '#303030', width: 1 } },
                resistanceLine: { lineStyle: { color: '#353535', width: 1, opacity: 0.9 } },
                reactanceLine: { lineStyle: { color: '#353535', width: 1, opacity: 0.9 } }
              },
              swrStyle: { color: '#f97316', width: 1.3, opacity: 0.86, type: 'dashed' },
              lineStyle: { show: true, color: '#2563eb', width: 2.2, opacity: 0.96 },
              itemStyle: { color: '#2563eb', borderColor: '#ffffff', borderWidth: 1.6, opacity: 0.96 },
              label: { show: false, color: '#0f172a', fontSize: 12, fontWeight: 650, formatter: '{b}' },
              cursor: {
                show: true,
                lineStyle: { color: '#111111', width: 1.2, opacity: 1, type: 'dashed' },
                tooltip: {
                  show: true,
                  backgroundColor: '#000000',
                  color: '#ffffff',
                  fontSize: 14,
                  lineHeight: 22,
                  padding: [10, 12],
                  borderRadius: 4
                }
              },
              emphasis: {
                itemStyle: {
                  opacity: 1,
                  borderWidth: 2.4,
                  shadowBlur: 9,
                  shadowColor: 'rgba(37, 99, 235, 0.28)'
                }
              }
            }
          ]
        };
      }
    }
  };

  function commonChartControls(defaultTitle, seriesIndexes) {
    return [
      textControl('titleText', 'Title', 'title.text', defaultTitle),
      colorControl('backgroundColor', 'Background', 'backgroundColor', '#ffffff'),
      checkboxControl('animationEnabled', 'Animation', [
        'animation',
        ...seriesIndexes.map((index) => `series.${index}.animation`)
      ], true)
    ];
  }

  function graphControls(defaultTitle, layoutControls, defaults = {}) {
    const graphDefaults = {
      enterDuration: 720,
      enterStagger: 45,
      ...defaults
    };
    return [
      ...commonChartControls(defaultTitle, [0]),
      checkboxControl('labelShow', 'Labels', 'series.0.label.show', true),
      rangeControl('labelFontSize', 'Label size', 'series.0.label.fontSize', 12, 8, 24, 1),
      checkboxControl('fisheyeShow', 'Fisheye', 'series.0.fisheye.show', false),
      rangeControl('fisheyeRadius', 'Fisheye radius', 'series.0.fisheye.radius', 220, 60, 420, 5),
      rangeControl('fisheyeScale', 'Fisheye scale', 'series.0.fisheye.scale', 2.2, 1, 4, 0.1),
      rangeControl('edgeWidth', 'Edge width', 'series.0.edgeStyle.width', 1.4, 0.2, 6, 0.1),
      rangeControl('edgeOpacity', 'Edge opacity', 'series.0.edgeStyle.opacity', 0.66, 0.05, 1, 0.02),
      rangeControl('borderWidth', 'Node border', 'series.0.itemStyle.borderWidth', 1.6, 0, 6, 0.2),
      rangeControl('enterDuration', 'Enter duration', 'series.0.enterAnimation.duration', graphDefaults.enterDuration, 120, 1800, 20),
      rangeControl('enterStagger', 'Enter stagger', 'series.0.enterAnimation.stagger', graphDefaults.enterStagger, 0, 180, 5),
      selectControl('enterEasing', 'Enter easing', 'series.0.enterAnimation.easing', 'cubicOut', easingOptions),
      ...layoutControls
    ];
  }

  function rangeControl(id, label, targets, defaultValue, min, max, step, mapValue) {
    const normalizedTargets = normalizeTargets(targets);
    return {
      id,
      label,
      type: 'range',
      targets: normalizedTargets,
      defaultValue: isAnimationTimingTarget(normalizedTargets) ? min : defaultValue,
      min,
      max,
      step,
      mapValue
    };
  }

  function isAnimationTimingTarget(targets) {
    return targets.some((target) => (
      target.endsWith('enterAnimation.duration') ||
      target.endsWith('enterAnimation.stagger') ||
      target.endsWith('edgeAnimation.duration') ||
      target.endsWith('edgeAnimation.stagger')
    ));
  }

  function checkboxControl(id, label, targets, defaultValue) {
    return {
      id,
      label,
      type: 'checkbox',
      targets: normalizeTargets(targets),
      defaultValue
    };
  }

  function selectControl(id, label, targets, defaultValue, options) {
    return {
      id,
      label,
      type: 'select',
      targets: normalizeTargets(targets),
      defaultValue,
      options
    };
  }

  function colorControl(id, label, targets, defaultValue) {
    return {
      id,
      label,
      type: 'color',
      targets: normalizeTargets(targets),
      defaultValue
    };
  }

  function textControl(id, label, targets, defaultValue) {
    return {
      id,
      label,
      type: 'text',
      targets: normalizeTargets(targets),
      defaultValue
    };
  }

  function jsonControl(id, label, targets, defaultValue) {
    return {
      id,
      label,
      type: 'json',
      targets: normalizeTargets(targets),
      defaultValue
    };
  }

  function timeOfDayControl(defaultValue) {
    return {
      id: 'timeOfDay',
      label: 'Time',
      type: 'range',
      targets: [],
      defaultValue,
      min: 0,
      max: 23 * 60 + 59,
      step: 1,
      formatValue: formatClockMinutes,
      applyValue: applySunriseSunsetTimeControl
    };
  }

  function normalizeTargets(targets) {
    return Array.isArray(targets) ? targets : [targets];
  }

  function percentValue(value) {
    return `${value}%`;
  }

  function formatMillions(value) {
    const numeric = finiteNumber(Number(value), 0);
    return `${numeric.toLocaleString('en-US')}M`;
  }

  function createControlState(controls) {
    return controls.reduce((state, control) => {
      state[control.id] = control.type === 'json'
        ? stringifyJsonControlValue(control.defaultValue)
        : control.defaultValue;
      return state;
    }, {});
  }

  function createDemoOption(exampleName, data, controlValues, context = {}) {
    const entry = registry[exampleName];
    if (!entry) return null;
    const option = entry.option(data);
    applyControlValues(option, entry.controls || [], controlValues || {}, context);
    applyDataAppendAnimation(option, context);
    return applyDemoInteractionDefaults(option);
  }

  function applyControlValues(option, controls, controlValues, context = {}) {
    controls.forEach((control) => {
      const value = readControlValue(control, controlValues[control.id]);
      const mapped = typeof control.mapValue === 'function' ? control.mapValue(value) : value;
      if (typeof control.applyValue === 'function') {
        control.applyValue(option, mapped, control, controlValues, context);
      } else {
        control.targets.forEach((target) => setPath(option, target, mapped));
      }
    });
    return option;
  }

  function readControlValue(control, rawValue) {
    const value = rawValue === undefined
      ? control.type === 'json' ? stringifyJsonControlValue(control.defaultValue) : control.defaultValue
      : rawValue;
    if (control.type === 'range') return finiteNumber(Number(value), control.defaultValue);
    if (control.type === 'checkbox') return Boolean(value);
    if (control.type === 'select') {
      return control.options.includes(value) ? value : control.defaultValue;
    }
    if (control.type === 'json') return parseJsonControlValue(value, control.defaultValue);
    return value == null ? '' : String(value);
  }

  function applyDemoInteractionDefaults(option) {
    if (!option || typeof option !== 'object') return option;
    if (option.tooltip === undefined) {
      option.tooltip = {
        trigger: 'item',
        confine: true
      };
    } else if (option.tooltip && typeof option.tooltip === 'object') {
      if (option.tooltip.trigger == null) option.tooltip.trigger = 'item';
      if (option.tooltip.confine == null) option.tooltip.confine = true;
    }

    const seriesList = Array.isArray(option.series) ? option.series : [option.series].filter(Boolean);
    seriesList.forEach(applySeriesInteractionDefaults);
    return option;
  }

  function applySeriesInteractionDefaults(seriesOption) {
    if (!seriesOption || typeof seriesOption !== 'object') return;
    const emphasis = ensureObject(seriesOption, 'emphasis');
    if (emphasis.focus == null) emphasis.focus = 'self';
    mergeMissing(ensureObject(emphasis, 'itemStyle'), defaultEmphasisItemStyle);
    if (seriesOption.edgeStyle) {
      mergeMissing(ensureObject(emphasis, 'edgeStyle'), {
        opacity: 1,
        width: Math.max(2.2, finiteNumber(seriesOption.edgeStyle.width, 1.4) + 0.8)
      });
    }
  }

  function ensureObject(target, key) {
    if (!target[key] || typeof target[key] !== 'object' || Array.isArray(target[key])) {
      target[key] = {};
    }
    return target[key];
  }

  function mergeMissing(target, defaults) {
    Object.entries(defaults).forEach(([key, value]) => {
      if (target[key] == null) target[key] = value;
    });
    return target;
  }

  function setPath(target, path, value) {
    const parts = String(path).split('.');
    let current = target;
    for (let index = 0; index < parts.length - 1; index += 1) {
      const key = pathKey(parts[index]);
      if (current[key] == null || typeof current[key] !== 'object') {
        current[key] = Number.isInteger(pathKey(parts[index + 1])) ? [] : {};
      }
      current = current[key];
    }
    current[pathKey(parts[parts.length - 1])] = value;
  }

  function pathKey(part) {
    const numeric = Number(part);
    return Number.isInteger(numeric) && String(numeric) === part ? numeric : part;
  }

  async function mount(exampleName, targetId = 'chart') {
    const chartElement = document.getElementById(targetId);
    const entry = registry[exampleName];
    if (!chartElement || !entry) return;
    if (!root.echarts) {
      chartElement.textContent = 'ECharts failed to load.';
      return;
    }

    const chart = root.echarts.init(chartElement);
    chart.showLoading('default', {
      text: 'Loading data',
      color: '#3f6fd8',
      textColor: '#647085',
      maskColor: 'rgba(255, 255, 255, 0.82)'
    });
    const data = cloneExampleData(await loadExampleData(exampleName));
    chart.hideLoading();
    const state = createControlState(entry.controls || []);
    const addDataState = createAddDataState(exampleName);
    let customOption = null;
    let replayKey = 0;
    const controlsPanel = createControlsPanel(entry.controls || [], state, {
      onChange(control) {
        customOption = null;
        render({ interactionControlId: control?.id });
      },
      onReset() {
        Object.assign(state, createControlState(entry.controls || []));
        customOption = null;
        syncControlElements(controlsPanel, entry.controls || [], state);
        render();
      },
      onReplay() {
        replayKey += 1;
        render({ replayKey });
      },
      onAddData() {
        customOption = null;
        const addDataInfo = addExampleData(exampleName, data, addDataState);
        render({ addDataKey: addDataState.count, addDataInfo });
      },
      onJsonApply(option) {
        customOption = option;
        render();
      }
    });
    mountControlsPanel(chartElement, controlsPanel);
    const interactions = attachDemoInteractions(chart, chartElement, controlsPanel);
    render();
    root.addEventListener('resize', () => {
      chart.resize();
      interactions.applyViewport();
    });

    function render(context = {}) {
      const option = applyDemoInteractionDefaults(customOption || createDemoOption(exampleName, data, state, context));
      applyReplayContext(option, context);
      chart.resize();
      const afterSet = () => {
        interactions.applyViewport();
        updateOptionEditor(controlsPanel, option);
      };
      setDemoOption(chart, option, context, afterSet);
    }
  }

  function setDemoOption(chart, option, context = {}, afterSet = () => {}) {
    if (context.replayKey != null) {
      setReplayOption(chart, option, afterSet);
      return;
    }

    chart.setOption(option, {
      notMerge: false,
      lazyUpdate: false
    });
    afterSet();
  }

  function setReplayOption(chart, option, afterSet = () => {}) {
    chart.setOption({ series: [] }, {
      replaceMerge: ['series'],
      lazyUpdate: false
    });

    const raf = root.requestAnimationFrame || ((callback) => root.setTimeout(callback, 16));
    raf(() => {
      chart.setOption(option, {
        notMerge: false,
        lazyUpdate: false
      });
      afterSet();
    });
  }

  function applyReplayContext(option, context = {}) {
    if (!option || context.replayKey == null) return option;
    const series = Array.isArray(option.series) ? option.series : option.series ? [option.series] : [];
    series.forEach((_, seriesIndex) => {
      setPath(option, `series.${seriesIndex}.enterAnimation.replayKey`, context.replayKey);
    });
    return option;
  }

  function createAddDataState(exampleName) {
    return {
      exampleName,
      count: 0
    };
  }

  function addExampleData(exampleName, data, state = createAddDataState(exampleName)) {
    if (!data || typeof data !== 'object') return { added: false, count: state.count || 0 };
    const index = advanceAddDataState(state);
    const added = appendExampleData(exampleName, data, index);
    return {
      added,
      count: state.count,
      exampleName
    };
  }

  function appendExampleData(exampleName, data, index) {
    if (['radial', 'concentric', 'grid', 'mds', 'arc'].includes(exampleName)) {
      appendGraphExampleData(exampleName, data, index);
      return true;
    }

    if (exampleName === 'radial-area') return appendRadialAreaData(data, index);
    if (exampleName === 'radial-boxplot') return appendRadialBoxplotData(data, index);
    if (exampleName === 'venn-hollow') return appendHollowVennData(data, index);
    if (exampleName === 'venn-bubble') return appendBubbleVennData(data, index);
    if (exampleName === 'pack-bubble') return appendPackBubbleData(data, index);
    if (exampleName === 'circle-packing') return appendCirclePackingData(data, index);
    if (exampleName === 'nested-circle') return appendNestedCircleData(data, index);
    if (exampleName === 'mosaic') return appendMosaicData(data, index);
    if (exampleName === 'voronoi-treemap') return appendVoronoiTreemapData(data, index);
    if (exampleName === 'subway') return appendSubwayData(data, index);
    if (exampleName === 'flame') return appendFlameData(data, index);
    if (exampleName === 'sunrise-sunset') return appendSunriseSunsetData(data, index);
    if (exampleName === 'lollipop') return appendLollipopData(data, index);
    if (exampleName === 'beeswarm') return appendBeeswarmData(data, index);
    if (exampleName === 'spiral') return appendSpiralData(data, index);
    if (exampleName === 'smith') return appendSmithData(data, index);
    if (exampleName === 'vector-field') return appendVectorFieldData(data, index);
    return false;
  }

  function countExampleDataItems(exampleName, data) {
    if (!data || typeof data !== 'object') return 0;
    if (['radial', 'concentric', 'grid', 'mds', 'arc'].includes(exampleName)) {
      return graphNodes(graphDataForExample(exampleName, data)).length;
    }
    if (exampleName === 'radial-area') return arrayLength(data.radialArea);
    if (exampleName === 'radial-boxplot') return arrayLength(data.radialBoxplot);
    if (exampleName === 'venn-hollow') return arrayLength(data.hollowVenn);
    if (exampleName === 'venn-bubble') return arrayLength(data.bubbleVenn);
    if (exampleName === 'pack-bubble') return arrayLength(data.packBubble);
    if (exampleName === 'circle-packing') return countTreeItems(data.circlePacking);
    if (exampleName === 'nested-circle') return (data.nestedCircle || []).reduce((total, ring) => total + 1 + arrayLength(ring.children), 0);
    if (exampleName === 'mosaic') return arrayLength(data.mosaic);
    if (exampleName === 'voronoi-treemap') return countTreeItems(data.voronoiTreemap);
    if (exampleName === 'subway') return (data.subway || []).reduce((total, route) => total + arrayLength(route.stations), 0);
    if (exampleName === 'flame') return countTreeItems(data.flame);
    if (exampleName === 'sunrise-sunset') return arrayLength(data.sunriseSunset);
    if (exampleName === 'lollipop') return arrayLength(data.lollipop);
    if (exampleName === 'beeswarm') return arrayLength(data.beeswarm);
    if (exampleName === 'spiral') return arrayLength(data.spiral);
    if (exampleName === 'smith') return arrayLength(data.smith);
    if (exampleName === 'vector-field') return arrayLength(data.wind);
    return 0;
  }

  function cloneExampleData(data) {
    return cloneJsonValue(data || {});
  }

  function applyDataAppendAnimation(option, context = {}) {
    if (!option || context.addDataKey == null) return option;
    if (option.animation !== false) option.animation = true;
    const seriesList = Array.isArray(option.series) ? option.series : [option.series].filter(Boolean);
    seriesList.forEach((seriesOption) => {
      if (!seriesOption || typeof seriesOption !== 'object') return;
      if (seriesOption.animation !== false) seriesOption.animation = true;
      if (seriesOption.animationDurationUpdate == null) seriesOption.animationDurationUpdate = shortestAnimationDuration;
      if (seriesOption.animationEasingUpdate == null) seriesOption.animationEasingUpdate = 'cubicOut';
    });
    return option;
  }

  function advanceAddDataState(state) {
    state.count = Math.max(0, Math.trunc(finiteNumber(Number(state.count), 0))) + 1;
    return state.count;
  }

  function appendGraphExampleData(exampleName, data, index) {
    const graph = graphDataForExample(exampleName, data) || (data.graph = { data: [], links: [] });
    const nodes = ensureGraphNodes(graph);
    const edges = ensureGraphEdges(graph);
    const id = `added-${exampleName}-${index}`;
    const parent = chooseGraphAppendParent(exampleName, nodes, index);
    const parentId = parent ? String(parent.id ?? parent.name ?? 0) : null;
    nodes.push({
      id,
      name: `Added ${index}`,
      value: 4 + (index % 9),
      itemStyle: { color: addDataColor(index) }
    });
    if (parentId) edges.push({ source: parentId, target: id });
  }

  function chooseGraphAppendParent(exampleName, nodes, index) {
    if (!nodes.length) return null;
    if (exampleName === 'arc') return nodes[nodes.length - 1];
    return nodes[(index * 3) % nodes.length];
  }

  function appendRadialAreaData(data, index) {
    const list = ensureArrayData(data, 'radialArea');
    const previous = list[list.length - 1] || {};
    const nextDate = nextMonthDate(previous.date, list.length);
    const avg = Math.round(54 + Math.sin((list.length + index) * 0.52) * 16 + (index % 5) * 2);
    list.push({
      date: nextDate.toISOString(),
      avg,
      min: avg - 8 - (index % 4),
      max: avg + 9 + (index % 5),
      minmin: avg - 14 - (index % 3),
      maxmax: avg + 15 + (index % 4)
    });
    return true;
  }

  function appendRadialBoxplotData(data, index) {
    const list = ensureArrayData(data, 'radialBoxplot');
    const median = 10 + (index * 3) % 15;
    list.push({
      name: `Added ${index}`,
      min: Math.max(0, median - 9),
      q1: median - 4,
      median,
      q3: median + 5,
      max: median + 10,
      itemStyle: { color: addDataColor(index) }
    });
    return true;
  }

  function appendHollowVennData(data, index) {
    const list = ensureArrayData(data, 'hollowVenn');
    const setName = `Added ${index}`;
    const baseSet = list.find((item) => Array.isArray(item.sets) && item.sets.length === 1)?.sets?.[0] || 'A';
    list.push({
      name: setName,
      sets: [setName],
      value: 42 + (index % 38),
      itemStyle: { color: addDataColor(index) }
    });
    list.push({
      name: `${baseSet}&${setName}`,
      sets: [baseSet, setName],
      value: 8 + (index % 18)
    });
    return true;
  }

  function appendBubbleVennData(data, index) {
    const list = ensureArrayData(data, 'bubbleVenn');
    list.push({
      name: `Added ${index}`,
      value: 18 + (index * 11) % 86,
      itemStyle: { color: addDataColor(index) }
    });
    return true;
  }

  function appendPackBubbleData(data, index) {
    const list = ensureArrayData(data, 'packBubble');
    const category = addDataCategories[(index - 1) % addDataCategories.length];
    list.push({
      name: `Added ${index}`,
      value: 12 + (index * 17) % 72,
      category,
      itemStyle: { color: addDataColor(index) }
    });
    return true;
  }

  function appendCirclePackingData(data, index) {
    const root = data.circlePacking || (data.circlePacking = { name: 'Product Suite', children: [] });
    const group = ensureTreeGroup(root, index);
    group.children.push({
      name: `Added ${index}`,
      value: 10 + (index * 7) % 34,
      itemStyle: { color: addDataColor(index) }
    });
    return true;
  }

  function appendNestedCircleData(data, index) {
    const list = ensureArrayData(data, 'nestedCircle');
    list.push({
      id: `added-nested-circle-${index}`,
      name: `Added ${index}`,
      children: [],
      itemStyle: { color: addDataColor(index) }
    });
    return true;
  }

  function appendMosaicData(data, index) {
    const list = ensureArrayData(data, 'mosaic');
    list.push({
      channel: `Added ${index}`,
      stage: addDataStages[(index - 1) % addDataStages.length],
      users: 8 + (index * 9) % 38,
      itemStyle: { color: addDataColor(index) }
    });
    return true;
  }

  function appendVoronoiTreemapData(data, index) {
    const root = data.voronoiTreemap || (data.voronoiTreemap = { name: 'Product Portfolio', children: [] });
    const group = ensureTreeGroup(root, index);
    group.children.push({
      name: `Added ${index}`,
      value: 8 + (index * 5) % 42,
      itemStyle: { color: addDataColor(index) }
    });
    return true;
  }

  function appendSubwayData(data, index) {
    const routes = ensureArrayData(data, 'subway');
    if (!routes.length) {
      routes.push({ id: 'line-added', name: 'Line Added', color: addDataColor(index), stations: [], waypoints: [] });
    }
    const route = routes[(index - 1) % routes.length];
    if (!Array.isArray(route.stations)) route.stations = [];
    if (!Array.isArray(route.waypoints)) route.waypoints = [];
    const previous = route.stations[route.stations.length - 1] || { coord: [60, 120] };
    const previousCoord = Array.isArray(previous.coord) ? previous.coord : [60, 120];
    const id = `${route.id || 'line'}-added-${index}`;
    const coord = [
      finiteNumber(Number(previousCoord[0]), 60) + 70,
      finiteNumber(Number(previousCoord[1]), 120) + ((index % 3) - 1) * 34
    ];
    route.stations.push({
      id,
      name: `Added ${index}`,
      coord,
      labelPosition: index % 2 ? 'right' : 'bottom'
    });
    route.waypoints.push([id, coord[0], coord[1]]);
    return true;
  }

  function appendFlameData(data, index) {
    const root = data.flame || (data.flame = { name: 'root', children: [] });
    const group = ensureTreeGroup(root, index);
    group.children.push({
      name: `added-${index}`,
      value: 6 + (index * 5) % 30
    });
    return true;
  }

  function appendSunriseSunsetData(data, index) {
    const list = ensureArrayData(data, 'sunriseSunset');
    const date = `2026-05-${pad2(5 + index)}`;
    const sunrise = 5 * 60 + 8 + (index % 8);
    const sunset = 18 * 60 + 32 + (index % 18);
    const currentTime = 9 * 60 + 45 + (index * 37) % 360;
    list.unshift({
      name: date,
      value: index,
      sunrise: formatClockMinutes(sunrise),
      sunset: formatClockMinutes(sunset),
      moonrise: formatClockMinutes(21 * 60 + 40 + (index * 9) % 90),
      moonset: formatClockMinutes(6 * 60 + 50 + (index * 13) % 70),
      currentTime: `${date} ${formatClockMinutes(currentTime)}:00`,
      updatedAt: `${date} ${formatClockMinutes(currentTime)}:00`,
      remainingText: formatDurationSeconds(Math.max(0, (sunset - currentTime) * 60)),
      updatedText: `Updated ${formatClockMinutes(currentTime)}`,
      title: currentTime < sunset ? 'Until sunset' : 'After sunset'
    });
    return true;
  }

  function appendLollipopData(data, index) {
    const list = ensureArrayData(data, 'lollipop');
    const insertIndex = list.length ? (index * 3) % (list.length + 1) : 0;
    list.splice(insertIndex, 0, {
      id: `added-lollipop-${index}`,
      country: `Added ${index}`,
      population: 90 + (index * 41) % 520,
      itemStyle: { color: '#2db5ff' }
    });
    return true;
  }

  function appendBeeswarmData(data, index) {
    const list = ensureArrayData(data, 'beeswarm');
    const team = addDataTeams[(index - 1) % addDataTeams.length];
    list.push({
      team,
      score: 45 + (index * 7) % 42,
      name: `${team.charAt(0)}-${String(index).padStart(2, '0')}`,
      itemStyle: { color: addDataColor(index) }
    });
    return true;
  }

  function appendSpiralData(data, index) {
    const list = ensureArrayData(data, 'spiral');
    list.push({
      name: `Added ${index}`,
      value: 28 + (index * 13) % 82
    });
    return true;
  }

  function appendSmithData(data, index) {
    const list = ensureArrayData(data, 'smith');
    list.push({
      name: `Load ${list.length + 1}`,
      resistance: 20 + (index * 19) % 130,
      reactance: ((index * 37) % 120) - 60,
      itemStyle: { color: addDataColor(index) }
    });
    return true;
  }

  function appendVectorFieldData(data, index) {
    const list = ensureArrayData(data, 'wind');
    const cols = 17;
    const position = list.length;
    const col = position % cols;
    const row = Math.floor(position / cols);
    list.push({
      longitude: Number((col * 0.25).toFixed(3)),
      latitude: Number((45 + row * 0.25).toFixed(3)),
      u: Number((Math.cos((col + index) * 0.4) * 2.2).toFixed(4)),
      v: Number((Math.sin((row + index) * 0.32) * 2.4).toFixed(4))
    });
    return true;
  }

  function graphDataForExample(exampleName, data) {
    if (exampleName === 'radial') return data.radialGraph || data.graph;
    if (exampleName === 'concentric') return data.concentricGraph || data.graph;
    if (exampleName === 'grid') return data.gridGraph || data.graph;
    if (exampleName === 'mds') return data.mdsGraph || data.graph;
    return data.graph;
  }

  function ensureGraphNodes(graph) {
    if (Array.isArray(graph.nodes)) return graph.nodes;
    if (!Array.isArray(graph.data)) graph.data = [];
    return graph.data;
  }

  function ensureGraphEdges(graph) {
    if (Array.isArray(graph.edges)) return graph.edges;
    if (!Array.isArray(graph.links)) graph.links = [];
    return graph.links;
  }

  function graphNodes(graph) {
    if (!graph || typeof graph !== 'object') return [];
    return Array.isArray(graph.nodes) ? graph.nodes : Array.isArray(graph.data) ? graph.data : [];
  }

  function ensureArrayData(data, key) {
    if (!Array.isArray(data[key])) data[key] = [];
    return data[key];
  }

  function ensureTreeGroup(root, index) {
    if (!Array.isArray(root.children)) root.children = [];
    if (!root.children.length) {
      root.children.push({
        name: 'Added Group',
        itemStyle: { color: addDataColor(index) },
        children: []
      });
    }
    const group = root.children[(index - 1) % root.children.length];
    if (!Array.isArray(group.children)) group.children = [];
    return group;
  }

  function countTreeItems(node) {
    if (!node || typeof node !== 'object') return 0;
    return 1 + (Array.isArray(node.children)
      ? node.children.reduce((total, child) => total + countTreeItems(child), 0)
      : 0);
  }

  function currentSunriseSunsetData(data) {
    const fallback = {
      sunrise: '05:12',
      sunset: '18:39',
      moonrise: '22:08',
      moonset: '07:59',
      currentTime: '2026-05-05 10:47:33',
      updatedAt: '2026-05-05 10:47:33',
      title: 'Until sunset',
      remainingText: '07:51:27',
      updatedText: 'Updated 10:46'
    };
    const item = Array.isArray(data?.sunriseSunset) && data.sunriseSunset.length ? data.sunriseSunset[0] : {};
    return {
      ...fallback,
      ...(item && typeof item === 'object' ? item : {})
    };
  }

  function nextMonthDate(value, offset) {
    const date = new Date(value || Date.UTC(2000, offset, 1));
    if (Number.isNaN(date.getTime())) return new Date(Date.UTC(2000, offset, 1));
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
  }

  function addDataColor(index) {
    return addDataPalette[(index - 1) % addDataPalette.length];
  }

  function arrayLength(value) {
    return Array.isArray(value) ? value.length : 0;
  }

  function createControlsPanel(controls, state, handlers) {
    if (!document.createElement) return null;

    const panel = document.createElement('aside');
    panel.className = 'demo-controls';

    const header = document.createElement('div');
    header.className = 'demo-controls__header';
    const title = document.createElement('h2');
    title.textContent = 'Options';
    const actions = document.createElement('div');
    actions.className = 'demo-controls__actions';
    if (typeof handlers.onAddData === 'function') {
      const addDataButton = controlButton('添加数据');
      addDataButton.classList.add('demo-control-button--primary');
      addDataButton.addEventListener('click', handlers.onAddData);
      actions.append(addDataButton);
    }
    const replayButton = controlButton('Replay');
    replayButton.addEventListener('click', handlers.onReplay);
    const resetButton = controlButton('Reset');
    resetButton.addEventListener('click', handlers.onReset);
    actions.append(replayButton, resetButton);
    header.append(title, actions);

    const form = document.createElement('form');
    form.className = 'demo-controls__form';
    controls.forEach((control) => {
      form.append(createControlField(control, state, handlers.onChange));
    });

    const interactions = createInteractionPanel();
    const editor = createOptionEditor(handlers.onJsonApply);
    panel.append(header, interactions, form, editor);
    return panel;
  }

  function createInteractionPanel() {
    const section = document.createElement('section');
    section.className = 'demo-interactions';

    const title = document.createElement('h3');
    title.className = 'demo-interactions__title';
    title.textContent = 'Interactions';

    const viewRow = document.createElement('div');
    viewRow.className = 'demo-interactions__view';
    const zoomLabel = document.createElement('span');
    zoomLabel.className = 'demo-interactions__zoom';
    zoomLabel.dataset.demoInteraction = 'zoom';
    zoomLabel.textContent = '100%';
    const resetViewButton = controlButton('Reset view');
    resetViewButton.dataset.demoInteraction = 'reset-view';
    viewRow.append(zoomLabel, resetViewButton);

    section.append(
      title,
      viewRow,
      createInteractionStatusRow('Hover', 'None', 'hover'),
      createInteractionStatusRow('Click', 'None', 'click')
    );
    return section;
  }

  function createInteractionStatusRow(labelText, valueText, key) {
    const row = document.createElement('div');
    row.className = 'demo-interactions__row';
    const label = document.createElement('span');
    label.className = 'demo-interactions__label';
    label.textContent = labelText;
    const value = document.createElement('span');
    value.className = 'demo-interactions__value';
    value.dataset.demoInteraction = key;
    value.textContent = valueText;
    row.append(label, value);
    return row;
  }

  function createControlField(control, state, onChange) {
    const field = document.createElement('label');
    field.className = `demo-control demo-control--${control.type}`;

    const name = document.createElement('span');
    name.className = 'demo-control__label';
    name.textContent = control.label;

    const value = document.createElement('span');
    value.className = 'demo-control__value';

    const input = createControlInput(control, state[control.id]);
    input.dataset.controlId = control.id;
    value.textContent = formatControlValue(control, state[control.id]);
    input.addEventListener(control.type === 'range' ? 'input' : 'change', () => {
      state[control.id] = readInputValue(control, input);
      value.textContent = formatControlValue(control, state[control.id]);
      onChange(control);
    });

    const row = document.createElement('span');
    row.className = 'demo-control__topline';
    row.append(name, value);
    field.append(row, input);
    return field;
  }

  function createControlInput(control, value) {
    if (control.type === 'json') {
      const input = document.createElement('textarea');
      input.className = 'demo-control__textarea';
      input.spellcheck = false;
      input.rows = 5;
      input.value = String(value);
      return input;
    }

    if (control.type === 'select') {
      const input = document.createElement('select');
      control.options.forEach((option) => {
        const item = document.createElement('option');
        item.value = option;
        item.textContent = option;
        input.append(item);
      });
      input.value = String(value);
      return input;
    }

    const input = document.createElement('input');
    if (control.type === 'range') {
      input.type = 'range';
      input.min = String(control.min);
      input.max = String(control.max);
      input.step = String(control.step);
      input.value = String(value);
    } else if (control.type === 'checkbox') {
      input.type = 'checkbox';
      input.checked = Boolean(value);
    } else if (control.type === 'color') {
      input.type = 'color';
      input.value = String(value);
    } else {
      input.type = 'text';
      input.value = String(value);
    }
    return input;
  }

  function createOptionEditor(onJsonApply) {
    const details = document.createElement('details');
    details.className = 'demo-option-editor';

    const summary = document.createElement('summary');
    summary.textContent = 'Option JSON';

    const textarea = document.createElement('textarea');
    textarea.className = 'demo-option-editor__textarea';
    textarea.spellcheck = false;

    const footer = document.createElement('div');
    footer.className = 'demo-option-editor__footer';
    const error = document.createElement('span');
    error.className = 'demo-option-editor__error';
    const applyButton = controlButton('Apply JSON');
    applyButton.addEventListener('click', () => {
      try {
        error.textContent = '';
        onJsonApply(JSON.parse(textarea.value));
      } catch (parseError) {
        error.textContent = 'Invalid JSON';
      }
    });
    footer.append(error, applyButton);
    details.append(summary, textarea, footer);
    return details;
  }

  function controlButton(label) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'demo-control-button';
    button.textContent = label;
    return button;
  }

  function mountControlsPanel(chartElement, panel) {
    if (!panel) return;
    const stage = chartElement.closest('.demo-stage');
    if (!stage) return;
    stage.classList.add('demo-stage--with-controls');
    const existing = stage.querySelector('.demo-controls');
    if (existing) existing.remove();
    stage.append(panel);
  }

  function syncControlElements(panel, controls, state) {
    if (!panel) return;
    controls.forEach((control) => {
      const input = panel.querySelector(`[data-control-id="${control.id}"]`);
      if (!input) return;
      const value = state[control.id];
      if (control.type === 'checkbox') {
        input.checked = Boolean(value);
      } else {
        input.value = String(value);
      }
      const label = input.closest('.demo-control')?.querySelector('.demo-control__value');
      if (label) label.textContent = formatControlValue(control, value);
    });
  }

  function updateOptionEditor(panel, option) {
    if (!panel) return;
    const textarea = panel.querySelector('.demo-option-editor__textarea');
    if (!textarea || document.activeElement === textarea) return;
    textarea.value = JSON.stringify(option, null, 2);
  }

  function attachDemoInteractions(chart, chartElement, panel, options = {}) {
    const viewport = createViewportState();
    const status = createInteractionStatus(panel);
    let activeHoverTarget = null;
    let activeZrHoverTarget = null;
    let lastZrHoverTarget = null;
    let dragging = false;
    let movedDuringDrag = false;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let suppressClickUntil = 0;

    const applyViewport = () => {
      applyViewportTransform(chart, chartElement, viewport);
      updateInteractionZoom(status, viewport);
    };

    const resetView = () => {
      resetViewport(viewport);
      applyViewport();
      notifyViewportChange('reset');
    };

    status.resetViewButton?.addEventListener('click', resetView);
    chartElement.classList.add('demo-chart--interactive');
    chartElement.addEventListener('wheel', onWheel, { passive: false });
    chartElement.addEventListener('pointerdown', onPointerDown);
    chartElement.addEventListener('pointermove', onPointerMove);
    chartElement.addEventListener('pointerup', onPointerUp);
    chartElement.addEventListener('pointercancel', onPointerUp);
    chartElement.addEventListener('lostpointercapture', onPointerUp);
    chartElement.addEventListener('click', onDomClickFallback);
    chart.on('mouseover', onMouseOver);
    chart.on('mouseout', onMouseOut);
    chart.on('click', onClick);
    chart.getZr?.().on?.('mouseover', onZrMouseOver);
    chart.getZr?.().on?.('mouseout', onZrMouseOut);
    chart.getZr?.().on?.('click', onZrClick);
    applyViewport();

    return {
      viewport,
      applyViewport,
      resetView
    };

    function onWheel(event) {
      event.preventDefault();
      const rect = chartElement.getBoundingClientRect();
      const direction = readWheelDirection(event);
      zoomViewport(viewport, direction, event.clientX - rect.left, event.clientY - rect.top);
      applyViewport();
      notifyViewportChange('zoom');
    }

    function onPointerDown(event) {
      if (event.button != null && event.button !== 0) return;
      dragging = true;
      movedDuringDrag = false;
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
      chartElement.classList.add('is-panning');
      safelySetPointerCapture(chartElement, event.pointerId);
    }

    function onPointerMove(event) {
      if (!dragging) return;
      const dx = event.clientX - lastPointerX;
      const dy = event.clientY - lastPointerY;
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
      if (!dx && !dy) return;
      movedDuringDrag = true;
      event.preventDefault();
      panViewport(viewport, dx, dy);
      applyViewport();
    }

    function onPointerUp(event) {
      if (!dragging) return;
      dragging = false;
      chartElement.classList.remove('is-panning');
      safelyReleasePointerCapture(chartElement, event.pointerId);
      if (movedDuringDrag) {
        suppressClickUntil = Date.now() + 160;
        notifyViewportChange('pan');
      }
    }

    function onMouseOver(params) {
      updateInteractionValue(status.hoverValue, formatInteractionEvent('hover', params));
      const target = eventActionTarget(params);
      if (!target || sameActionTarget(activeHoverTarget, target)) return;
      if (activeHoverTarget) chart.dispatchAction({ type: 'downplay', ...activeHoverTarget });
      activeHoverTarget = target;
      chart.dispatchAction({ type: 'highlight', ...target });
    }

    function onMouseOut() {
      updateInteractionValue(status.hoverValue, 'None');
      if (!activeHoverTarget) return;
      chart.dispatchAction({ type: 'downplay', ...activeHoverTarget });
      activeHoverTarget = null;
    }

    function onClick(params) {
      if (Date.now() < suppressClickUntil) return;
      updateInteractionValue(status.clickValue, formatInteractionEvent('click', params));
    }

    function onZrMouseOver(event) {
      if (!event?.target) return;
      activeZrHoverTarget = event.target;
      lastZrHoverTarget = event.target;
      updateInteractionValue(status.hoverValue, formatZrInteractionEvent('hover', event.target));
    }

    function onZrMouseOut(event) {
      if (!event?.target) return;
      if (activeZrHoverTarget === event.target) activeZrHoverTarget = null;
      updateInteractionValue(status.hoverValue, 'None');
    }

    function onZrClick(event) {
      if (Date.now() < suppressClickUntil || !event?.target) return;
      updateInteractionValue(status.clickValue, formatZrInteractionEvent('click', event.target));
    }

    function onDomClickFallback() {
      const target = activeZrHoverTarget || lastZrHoverTarget;
      if (Date.now() < suppressClickUntil || !target) return;
      updateInteractionValue(status.clickValue, formatZrInteractionEvent('click', target));
    }

    function notifyViewportChange(reason) {
      options.onViewportChange?.({
        x: viewport.x,
        y: viewport.y,
        scale: viewport.scale
      }, reason);
    }
  }

  function createInteractionStatus(panel) {
    if (!panel || !panel.querySelector) return {};
    return {
      zoomValue: panel.querySelector('[data-demo-interaction="zoom"]'),
      hoverValue: panel.querySelector('[data-demo-interaction="hover"]'),
      clickValue: panel.querySelector('[data-demo-interaction="click"]'),
      resetViewButton: panel.querySelector('[data-demo-interaction="reset-view"]')
    };
  }

  function safelySetPointerCapture(element, pointerId) {
    try {
      element.setPointerCapture?.(pointerId);
    } catch (error) {
      // Synthetic pointer events in browser tests may not have an active pointer.
    }
  }

  function safelyReleasePointerCapture(element, pointerId) {
    try {
      element.releasePointerCapture?.(pointerId);
    } catch (error) {
      // Matching the guarded set call keeps non-native pointer tests quiet.
    }
  }

  function updateInteractionZoom(status, viewport) {
    updateInteractionValue(status.zoomValue, `${Math.round(viewport.scale * 100)}%`);
  }

  function updateInteractionValue(element, value) {
    if (element) element.textContent = value;
  }

  function createViewportState() {
    return { x: 0, y: 0, scale: 1 };
  }

  function zoomViewport(viewport, direction, originX = 0, originY = 0) {
    const currentScale = finiteNumber(viewport.scale, 1) || 1;
    const nextScale = clamp(
      currentScale * (direction >= 0 ? viewportZoomStep : 1 / viewportZoomStep),
      minViewportScale,
      maxViewportScale
    );
    const ratio = nextScale / currentScale;
    viewport.x = cleanViewportNumber(originX - (originX - finiteNumber(viewport.x, 0)) * ratio);
    viewport.y = cleanViewportNumber(originY - (originY - finiteNumber(viewport.y, 0)) * ratio);
    viewport.scale = cleanViewportNumber(nextScale);
    return viewport;
  }

  function panViewport(viewport, dx, dy) {
    viewport.x = cleanViewportNumber(finiteNumber(viewport.x, 0) + finiteNumber(dx, 0));
    viewport.y = cleanViewportNumber(finiteNumber(viewport.y, 0) + finiteNumber(dy, 0));
    viewport.scale = finiteNumber(viewport.scale, 1) || 1;
    return viewport;
  }

  function resetViewport(viewport) {
    viewport.x = 0;
    viewport.y = 0;
    viewport.scale = 1;
    return viewport;
  }

  function applyViewportTransform(chart, chartElement, viewport) {
    clearCssViewportTransform(chart, chartElement);
    const roots = getSeriesViewportRoots(chart);
    if (!roots.length) {
      applyCssViewportTransform(chart, chartElement, viewport);
      return;
    }

    roots.forEach((rootElement) => {
      rootElement.attr?.({
        x: viewport.x,
        y: viewport.y,
        scaleX: viewport.scale,
        scaleY: viewport.scale,
        originX: 0,
        originY: 0
      });
      rootElement.dirty?.();
    });
    chart.getZr?.().refresh?.();
  }

  function getSeriesViewportRoots(chart) {
    const roots = chart.getZr?.().storage?.getRoots?.() || [];
    return roots.filter((rootElement) => rootElement.__ecComponentInfo?.mainType === 'series');
  }

  function clearCssViewportTransform(chart, chartElement) {
    const rootElement = getChartViewportRoot(chart, chartElement);
    if (!rootElement?.style) return;
    rootElement.style.transformOrigin = '';
    rootElement.style.willChange = '';
    rootElement.style.transform = '';
  }

  function applyCssViewportTransform(chart, chartElement, viewport) {
    const rootElement = getChartViewportRoot(chart, chartElement);
    if (!rootElement?.style) return;
    rootElement.style.transformOrigin = '0 0';
    rootElement.style.willChange = 'transform';
    rootElement.style.transform = viewport.scale === 1 && viewport.x === 0 && viewport.y === 0
      ? ''
      : `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`;
  }

  function getChartViewportRoot(chart, chartElement) {
    const painter = chart.getZr?.().painter;
    const viewportRoot = painter?.getViewportRoot?.();
    if (viewportRoot?.style) return viewportRoot;
    const chartDom = chart.getDom?.() || chartElement;
    return chartDom.querySelector?.('canvas, svg')?.parentElement || chartDom.firstElementChild || chartDom;
  }

  function readWheelDirection(event) {
    if (Number.isFinite(event.deltaY)) return event.deltaY <= 0 ? 1 : -1;
    if (Number.isFinite(event.wheelDelta)) return event.wheelDelta >= 0 ? 1 : -1;
    return 1;
  }

  function eventActionTarget(params) {
    if (!params || !Number.isInteger(params.seriesIndex)) return null;
    const target = { seriesIndex: params.seriesIndex };
    if (Number.isInteger(params.dataIndex) && params.dataIndex >= 0) target.dataIndex = params.dataIndex;
    return target;
  }

  function sameActionTarget(left, right) {
    return Boolean(left && right && left.seriesIndex === right.seriesIndex && left.dataIndex === right.dataIndex);
  }

  function formatInteractionEvent(kind, params = {}, now = new Date()) {
    const prefix = kind === 'click' ? `Click ${formatInteractionTime(now)}` : 'Hover';
    const parts = [prefix];
    const seriesType = params.seriesType || params.componentSubType || params.seriesName;
    const name = params.name || params.data?.name;
    if (seriesType) parts.push(String(seriesType));
    if (name) parts.push(String(name));
    if (Number.isInteger(params.dataIndex) && params.dataIndex >= 0) parts.push(`#${params.dataIndex}`);
    const value = formatEventValue(params.value);
    if (value) parts.push(value);
    return parts.join(' · ');
  }

  function formatZrInteractionEvent(kind, target, now = new Date()) {
    const prefix = kind === 'click' ? `Click ${formatInteractionTime(now)}` : 'Hover';
    const parts = [prefix];
    const type = target?.type;
    const key = readGraphicElementKey(target);
    if (type) parts.push(String(type));
    if (key) parts.push(key);
    return parts.join(' · ');
  }

  function readGraphicElementKey(target) {
    let current = target;
    while (current) {
      const key = current.__aliveRenderKey || current.name || current.id;
      if (key) return String(key);
      current = current.parent;
    }
    return '';
  }

  function formatInteractionTime(date) {
    return [date.getHours(), date.getMinutes(), date.getSeconds()]
      .map((part) => String(part).padStart(2, '0'))
      .join(':');
  }

  function formatEventValue(value) {
    if (value == null || value === '') return '';
    if (Array.isArray(value)) return value.slice(0, 3).map(formatEventValue).filter(Boolean).join(', ');
    if (typeof value === 'object') return '';
    return String(value);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function cleanViewportNumber(value) {
    return Math.abs(value) < 0.0001 ? 0 : value;
  }

  function readInputValue(control, input) {
    if (control.type === 'range') return finiteNumber(Number(input.value), control.defaultValue);
    if (control.type === 'checkbox') return Boolean(input.checked);
    return input.value;
  }

  function formatControlValue(control, value) {
    if (typeof control.formatValue === 'function') return control.formatValue(value);
    if (control.type === 'checkbox') return value ? 'On' : 'Off';
    if (control.type === 'color') return String(value).toUpperCase();
    if (control.type === 'json') return isValidJsonControlValue(value) ? 'JSON' : 'Invalid JSON';
    if (control.type === 'range') {
      const numeric = finiteNumber(Number(value), control.defaultValue);
      return Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
    }
    return String(value);
  }

  function stringifyJsonControlValue(value) {
    return JSON.stringify(value, null, 2);
  }

  function parseJsonControlValue(value, fallback) {
    try {
      return JSON.parse(String(value));
    } catch (error) {
      return cloneJsonValue(fallback);
    }
  }

  function isValidJsonControlValue(value) {
    try {
      JSON.parse(String(value));
      return true;
    } catch (error) {
      return false;
    }
  }

  function cloneJsonValue(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function applySunriseSunsetTimeControl(option, value, control, controlValues, context = {}) {
    const minutes = clamp(Math.round(finiteNumber(Number(value), control.defaultValue)), 0, 23 * 60 + 59);
    const timeText = formatClockMinutes(minutes);
    const currentTime = `${sunriseSunsetDemoDate} ${timeText}:00`;
    const series = Array.isArray(option.series) ? option.series[0] : option.series;
    const sunrise = parseClockMinutes(series?.sunrise, 5 * 60 + 12);
    const sunset = parseClockMinutes(series?.sunset, 18 * 60 + 39);
    const daylight = isDaylightMinutes(minutes, sunrise, sunset);
    const target = daylight
      ? normalizeTargetMinutes(minutes, sunset)
      : minutes < sunrise
        ? sunrise
        : sunrise + 24 * 60;

    setPath(option, 'series.0.currentTime', currentTime);
    setPath(option, 'series.0.updatedAt', currentTime);
    setPath(option, 'series.0.updatedText', `Updated ${timeText}`);
    setPath(option, 'series.0.remainingText', formatDurationSeconds(Math.max(0, target - minutes) * 60));
    if (shouldUseDynamicSunriseSunsetTitle(controlValues?.titleText)) {
      setPath(option, 'series.0.title', daylight ? 'Until sunset' : 'Until sunrise');
    }
    if (context.interactionControlId === control.id) {
      setPath(option, 'series.0.enterAnimation', false);
      setPath(option, 'series.0.animationDurationUpdate', 0);
    }
  }

  function shouldUseDynamicSunriseSunsetTitle(value) {
    return value == null || value === 'Until sunset' || value === 'Until sunrise';
  }

  function isDaylightMinutes(minutes, sunrise, sunset) {
    if (sunset >= sunrise) return minutes >= sunrise && minutes <= sunset;
    return minutes >= sunrise || minutes <= sunset;
  }

  function normalizeTargetMinutes(minutes, target) {
    return target >= minutes ? target : target + 24 * 60;
  }

  function parseClockMinutes(value, fallback) {
    const match = String(value ?? '').match(/(?:^|\s)(\d{1,2}):(\d{2})/);
    if (!match) return fallback;
    const hours = clamp(Number(match[1]), 0, 23);
    const minutes = clamp(Number(match[2]), 0, 59);
    return hours * 60 + minutes;
  }

  function formatClockMinutes(value) {
    const minutes = clamp(Math.round(finiteNumber(Number(value), 0)), 0, 23 * 60 + 59);
    const hours = Math.floor(minutes / 60);
    return `${pad2(hours)}:${pad2(minutes % 60)}`;
  }

  function formatDurationSeconds(seconds) {
    const safeSeconds = Math.max(0, Math.floor(finiteNumber(seconds, 0)));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    return `${pad2(hours)}:${pad2(minutes)}:${pad2(safeSeconds % 60)}`;
  }

  function pad2(value) {
    return String(Math.trunc(value)).padStart(2, '0');
  }

  async function loadExampleData(exampleName) {
    const data = {
      ...namespace.data
    };
    const remoteKey = remoteKeyByExample(exampleName);
    if (!remoteKey) return data;

    const remoteData = await fetchRemoteJson(remoteKey);
    if (!remoteData) return data;

    if (remoteKey === 'radialGraph') {
      data.radialGraph = decorateGraph(remoteData, 'radial');
    } else if (remoteKey === 'concentricGraph') {
      data.concentricGraph = decorateGraph(remoteData, 'concentric');
    } else if (remoteKey === 'gridGraph') {
      data.gridGraph = decorateGraph(remoteData, 'grid');
    } else if (remoteKey === 'mdsGraph') {
      data.mdsGraph = decorateGraph(remoteData, 'mds');
    } else {
      data[remoteKey] = remoteData;
    }

    return data;
  }

  function remoteKeyByExample(exampleName) {
    if (exampleName === 'radial') return 'radialGraph';
    if (exampleName === 'concentric') return 'concentricGraph';
    if (exampleName === 'grid') return 'gridGraph';
    if (exampleName === 'mds') return 'mdsGraph';
    if (exampleName === 'flame') return 'flame';
    if (exampleName === 'radial-area') return 'radialArea';
    if (exampleName === 'vector-field') return 'wind';
    return null;
  }

  async function fetchRemoteJson(remoteKey) {
    const url = namespace.remoteUrls && namespace.remoteUrls[remoteKey];
    if (!url) return null;
    if (!remoteCache.has(remoteKey)) {
      remoteCache.set(remoteKey, fetch(url)
        .then((response) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.json();
        })
        .catch(() => null));
    }
    return remoteCache.get(remoteKey);
  }

  function decorateGraph(rawGraph, type) {
    const nodes = Array.isArray(rawGraph.nodes) ? rawGraph.nodes : Array.isArray(rawGraph.data) ? rawGraph.data : [];
    const edges = Array.isArray(rawGraph.edges) ? rawGraph.edges : Array.isArray(rawGraph.links) ? rawGraph.links : [];

    return {
      nodes: nodes.map((node, index) => {
        const record = node && typeof node === 'object' ? node : { id: String(index) };
        const cluster = record.data && typeof record.data === 'object' ? record.data.cluster : null;
        const color = clusterColors[cluster] || graphPalette[index % graphPalette.length];
        return {
          ...record,
          name: record.name || record.label || record.id || String(index),
          itemStyle: {
            color,
            ...(record.itemStyle || {})
          }
        };
      }),
      edges
    };
  }

  function graphOption(type, graph, patch, titleText) {
    return {
      animation: false,
      backgroundColor: '#ffffff',
      title: title(titleText),
      series: [
        {
          ...graph,
          type,
          top: 76,
          width: '88%',
          height: '78%',
          label: { show: true, position: 'right', fontSize: 12, color: '#374151' },
          edgeStyle: { color: '#8a94a6', width: 1.4, opacity: 0.66 },
          itemStyle: { borderColor: '#ffffff', borderWidth: 1.6 },
          ...patch
        }
      ]
    };
  }

  function radialAreaBase(data, minField, maxField, patch) {
    return {
      type: 'radialArea',
      top: 62,
      width: '94%',
      height: '86%',
      padding: 34,
      angleField: 'date',
      angleType: 'time',
      valueField: 'avg',
      minField,
      maxField,
      min: 20,
      max: 90,
      tickCount: 5,
      innerRadius: '36%',
      outerRadius: '91%',
      data: data.radialArea,
      angleAxis: { show: false, label: { show: false }, splitLine: { show: false } },
      ...patch
    };
  }

  function title(text) {
    return {
      text,
      left: 'center',
      top: 20,
      textStyle: { color: '#111827', fontSize: 22, fontWeight: 720 }
    };
  }

  function finiteNumber(value, fallback) {
    return Number.isFinite(value) ? value : fallback;
  }

  namespace.registry = registry;
  namespace.mount = mount;
  namespace.createControlState = createControlState;
  namespace.createDemoOption = createDemoOption;
  namespace.applyControlValues = applyControlValues;
  namespace.applyDemoInteractionDefaults = applyDemoInteractionDefaults;
  namespace.createAddDataState = createAddDataState;
  namespace.addExampleData = addExampleData;
  namespace.countExampleDataItems = countExampleDataItems;
  namespace.cloneExampleData = cloneExampleData;
  namespace.createControlsPanel = createControlsPanel;
  namespace.mountControlsPanel = mountControlsPanel;
  namespace.syncControlElements = syncControlElements;
  namespace.updateOptionEditor = updateOptionEditor;
  namespace.attachDemoInteractions = attachDemoInteractions;
  namespace.createViewportState = createViewportState;
  namespace.zoomViewport = zoomViewport;
  namespace.panViewport = panViewport;
  namespace.resetViewport = resetViewport;
  namespace.formatInteractionEvent = formatInteractionEvent;
  namespace.formatZrInteractionEvent = formatZrInteractionEvent;

  document.addEventListener('DOMContentLoaded', () => {
    const exampleName = document.body.dataset.example;
    if (exampleName) mount(exampleName);
  });
})(window);
