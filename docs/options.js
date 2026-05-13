(function () {
  const LOCALE = document.documentElement.lang.toLowerCase().startsWith('zh') ? 'zh' : 'en';
  const IS_ZH = LOCALE === 'zh';
  const UI = {
    tableHeaders: IS_ZH ? ['配置项', '说明', '可选值'] : ['Option', 'Description', 'Values'],
    packageUnit: IS_ZH ? '个配置项' : 'options',
    example: IS_ZH ? '示例' : 'Example',
    expand: IS_ZH ? '展开' : 'Expand',
    collapse: IS_ZH ? '收起' : 'Collapse',
    optionsLabel: IS_ZH ? '配置项' : 'options',
    noMatches: IS_ZH ? '没有匹配的配置项。' : 'No matching options.',
    packages: IS_ZH ? '个图表。' : 'packages.',
    matchingPackage: IS_ZH ? '个匹配图表。' : 'matching package.',
    matchingPackages: IS_ZH ? '个匹配图表。' : 'matching packages.'
  };
  const DESCRIPTION_ZH = {
    Description: '说明',
    'Record id': '记录 ID',
    'Display name': '显示名称',
    'Numeric value': '数值',
    'Minimum value': '最小值',
    'Maximum value': '最大值',
    'Fill color': '填充颜色',
    'Alias for fill color': '填充颜色的别名',
    'Fill opacity': '填充透明度',
    'Border color': '边框颜色',
    'Border width': '边框宽度',
    'Corner radius': '圆角半径',
    'Shadow blur radius': '阴影模糊半径',
    'Shadow color': '阴影颜色',
    'Primary color': '主颜色',
    Opacity: '透明度',
    'Stroke color': '描边颜色',
    'Width value': '宽度值',
    'Line width': '线宽',
    'Line or item type': '线条或图元类型',
    'Label text color': '标签文字颜色',
    'Label text size': '标签文字大小',
    'Label font weight': '标签字重',
    'Label position': '标签位置',
    'Axis title text': '坐标轴标题文本',
    'Axis label text color': '坐标轴标签文字颜色',
    'Axis label text size': '坐标轴标签文字大小',
    'Axis label font weight': '坐标轴标签字重',
    'Axis label rotation': '坐标轴标签旋转',
    'Text color': '文本颜色',
    'Text size': '文本大小',
    'Text font weight': '文本字重',
    'Line color': '线条颜色',
    'Alias for line color': '线条颜色的别名',
    'Alias for line width': '线宽的别名',
    'Line opacity': '线条透明度',
    'Line dash style': '线条虚线样式',
    'Dash pattern offset': '虚线偏移量',
    'Alias for dash pattern offset': '虚线偏移量的别名',
    'Corner radius for routed lines': '折线路径圆角半径',
    'Line cap style': '线帽样式',
    'Line join style': '线连接样式',
    'Dash pattern': '虚线模式',
    'Dash pattern alias': '虚线模式别名',
    'Icon fill color': '图标填充颜色',
    'Icon stroke color': '图标描边颜色',
    'Icon stroke width': '图标描边宽度',
    'Icon opacity': '图标透明度',
    'Vector path for the icon': '图标矢量路径',
    'Image URL for the icon': '图标图片地址',
    'Icon size': '图标大小',
    'Icon width': '图标宽度',
    'Icon height': '图标高度',
    'Icon offset': '图标偏移',
    'Horizontal icon offset': '图标水平偏移',
    'Vertical icon offset': '图标垂直偏移',
    'Styles the icon graphic': '设置图标图形样式',
    'Top inset': '顶部内边距',
    'Right inset': '右侧内边距',
    'Bottom inset': '底部内边距',
    'Left inset': '左侧内边距',
    'Animation duration': '动画时长',
    'Delay before the animation starts': '动画开始前的延迟',
    'Delay added between items': '图元之间增加的延迟',
    'Animation easing name': '动画缓动名称',
    'ECharts tooltip trigger mode': 'ECharts tooltip 触发方式',
    'Tooltip background color': '提示框背景色',
    'Tooltip text color': '提示框文字颜色',
    'Tooltip text size': '提示框文字大小',
    'Tooltip line height': '提示框行高',
    'Tooltip padding': '提示框内边距',
    'Tooltip corner radius': '提示框圆角半径',
    'Tooltip border color': '提示框边框颜色',
    'Tooltip border width': '提示框边框宽度',
    'Tooltip opacity': '提示框透明度',
    'Tooltip font family': '提示框字体',
    'Source node id or name': '源节点 ID 或名称',
    'Target node id or name': '目标节点 ID 或名称',
    'Source participant or item id': '源参与者或项目 ID',
    'Target participant or item id': '目标参与者或项目 ID',
    'Displayed text': '显示文本',
    'Record type': '记录类型',
    'Category name or id': '分类名称或 ID',
    'X coordinate or category': 'X 坐标或分类',
    'Y coordinate or category': 'Y 坐标或分类',
    'Horizontal vector component': '水平向量分量',
    'Vertical vector component': '垂直向量分量',
    'Child records': '子记录',
    'Set names used by this item': '该项使用的集合名称',
    'Optional set names used by this item': '该项使用的可选集合名称',
    'Route station records': '线路站点记录',
    'Route segment records': '线路片段记录',
    'Route waypoint records': '线路路径点记录',
    'Per-record item style': '单条记录的图元样式',
    'Per-record label style': '单条记录的标签样式',
    'Per-record size': '单条记录的大小',
    'First quartile value': '第一四分位值',
    'Median value': '中位数',
    'Third quartile value': '第三四分位值',
    'Selects which graph layout algorithm to run': '选择要运行的图布局算法',
    'Graph nodes to place': '要布局的图节点',
    'Graph edges that connect source and target nodes': '连接 source 与 target 节点的图边',
    'Layout viewport width': '布局视口宽度',
    'Layout viewport height': '布局视口高度',
    'Layout center point inside the viewport': '布局视口内的中心点',
    'Extra spacing around each node': '每个节点周围的额外间距',
    'Extra gap used during overlap prevention': '防重叠处理使用的额外间距',
    'Target distance between connected nodes': '相连节点之间的目标距离',
    'Distance between radial graph levels': '径向图层级之间的距离',
    'Requested row count for grid layout': '网格布局请求的行数',
    'Requested column count for grid layout': '网格布局请求的列数',
    'Top-left starting point for grid layout': '网格布局左上角起点',
    'Horizontal gap between nodes in arc layout': '弧形布局中节点之间的水平间距',
    'Registers this package series with ECharts': '向 ECharts 注册该包的系列类型',
    'Series box width': '系列区域宽度',
    'Series box height': '系列区域高度',
    'Distance from the top of the chart container': '距离图表容器顶部的距离',
    'Distance from the right of the chart container': '距离图表容器右侧的距离',
    'Distance from the bottom of the chart container': '距离图表容器底部的距离',
    'Distance from the left of the chart container': '距离图表容器左侧的距离',
    'Names tuple columns when data rows are arrays': '当数据行为数组时，用于命名 tuple 列',
    'Inner and outer radius pair': '内外半径对',
    'Inset around the polar chart': '极坐标图周围的内边距',
    'Inset around the chart': '图表周围的内边距',
    'Inset around the map': '地图周围的内边距',
    'Explicit category order': '显式分类顺序',
    'Manual radial axis minimum': '径向轴手动最小值',
    'Manual radial axis maximum': '径向轴手动最大值',
    'Preferred radial tick count': '径向轴首选刻度数量',
    'Manual value-axis minimum': '数值轴手动最小值',
    'Manual value-axis maximum': '数值轴手动最大值',
    'Preferred value-axis tick count': '数值轴首选刻度数量',
    'Point symbol size': '点符号大小',
    'Canvas background color': '画布背景色',
    'Gradient stops for escaped points': '逃逸点的渐变色标',
    'Fractal-plane center point': '分形平面的中心点',
    'Width of the visible fractal plane': '可见分形平面的宽度',
    'Viewport scale multiplier': '视口缩放倍率',
    'Current zoom value': '当前缩放值',
    'Venn sets and intersections': '韦恩集合和交集'
  };
  const PHRASE_ZH = {
    'graph layout algorithm': '图布局算法',
    'graph nodes': '图节点',
    'graph edges': '图边',
    'venn sets and intersections': '韦恩集合和交集',
    'source and target nodes': 'source 与 target 节点',
    'layout viewport': '布局视口',
    'layout spacing and overlap prevention': '布局间距和防重叠处理',
    'overlap prevention': '防重叠处理',
    'radial refinement': '径向细化',
    'radial center': '径向中心',
    'radial graph levels': '径向图层级',
    'strict level rings': '严格的层级环',
    'strict radial rings': '严格的径向环',
    'circular layouts': '环形布局',
    'grid layout': '网格布局',
    'arc layout': '弧形布局',
    'series name': '系列名称',
    'series box': '系列区域',
    'chart container': '图表容器',
    'chart rectangle': '图表矩形区域',
    'node labels': '节点标签',
    'node id or name': '节点 ID 或名称',
    'node size': '节点大小',
    'node spacing': '节点间距',
    'nodes and edges': '节点和边',
    'connected nodes': '相连节点',
    'graph levels': '图层级',
    'edge length': '边长',
    'edge drawing': '边绘制',
    'pointer magnifier': '指针放大镜',
    'lens center': '镜头中心',
    'lens outline': '镜头轮廓',
    'ring spacing': '环间距',
    'category angles': '分类角度',
    'polar area': '极坐标面积图',
    'polar chart': '极坐标图',
    'radial axis labels and split lines': '径向轴标签和分隔线',
    'angle axis labels and split lines': '角度轴标签和分隔线',
    'radial value axis labels and split lines': '径向数值轴标签和分隔线',
    'category axis labels and split lines': '分类轴标签和分隔线',
    'axis labels': '坐标轴标签',
    'split lines': '分隔线',
    'axis baseline': '坐标轴基线',
    'axis title': '坐标轴标题',
    'value line': '数值线',
    'individual points': '单个点',
    'points while hovered': '悬停时的点',
    'boxes while hovered': '悬停时的箱体',
    'box body': '箱体主体',
    'whisker lines': '须线',
    'median lines': '中位线',
    'whisker caps': '须端帽',
    'venn circles': '韦恩图圆',
    'hollow overlay': '空心覆盖层',
    'bubble packing engine': '气泡打包引擎',
    'packed bubbles': '打包气泡',
    'packed hierarchy': '打包层级',
    'nested circles': '嵌套圆',
    'circle size': '圆大小',
    'circle labels': '圆标签',
    'rings and child items': '环和子项',
    'ring background': '环背景',
    'child circle items': '子圆项',
    'ring title labels': '环标题标签',
    'organization nodes': '组织节点',
    'connector lines': '连接线',
    'mosaic cells': '马赛克单元格',
    'cell labels': '单元格标签',
    'voronoi cells': 'Voronoi 单元格',
    'subway route records': '地铁线路记录',
    'route lines': '线路线条',
    'regular stations': '普通站点',
    'interchange stations': '换乘站',
    'station labels': '站点标签',
    'route labels': '线路标签',
    'participant headers': '参与者头部',
    'participant lifelines': '参与者生命线',
    'activation bars': '激活条',
    'message labels': '消息标签',
    'participant labels': '参与者标签',
    'timing and duration constraints': '时序和持续时间约束',
    'category branches': '分类分支',
    'category labels': '分类标签',
    'cause labels': '原因标签',
    'cause lines': '原因线',
    'category branch lines': '分类分支线',
    'main spine': '主干线',
    'effect box': '结果框',
    'effect label': '结果标签',
    'flame graph rectangles': '火焰图矩形',
    'rectangle labels': '矩形标签',
    'sun and moon elements': '太阳和月亮元素',
    'chart background area': '图表背景区域',
    'horizon baseline': '地平线基线',
    'sun path line': '太阳路径线',
    'moon path line': '月亮路径线',
    'daylight area fill': '日光区域填充',
    'moon area fill': '月亮区域填充',
    'remaining-time text': '剩余时间文本',
    'updated-time text': '更新时间文本',
    'sunrise, sunset, moonrise, and moonset labels': '日出、日落、月出和月落标签',
    'lollipop stems': '棒棒糖图竖线',
    'lollipop symbols': '棒棒糖图符号',
    'swarm symbols': '蜂群图符号',
    'collision-aware swarm': '避碰蜂群布局',
    'spiral bands': '螺旋带',
    'band labels': '带标签',
    'smith chart grid lines and labels': '史密斯圆图网格线和标签',
    'data points': '数据点',
    'connecting lines': '连接线',
    'interactive impedance cursor': '交互式阻抗光标',
    'arrow heads': '箭头头部',
    'arrows': '箭头',
    'fractal formula': '分形公式',
    'fractal plane': '分形平面',
    'worker-based rendering': '基于 worker 的渲染',
    'current progress and remaining text': '当前进度和剩余时间文本'
  };
  const PHRASE_REPLACEMENTS = Object.entries({
    'Venn': '韦恩图',
    'intersections': '交集',
    'intersection': '交集',
    'source and target': 'source 和 target',
    'top-level': '顶层',
    'five-number summary': '五数概括',
    'first quartile': '第一四分位',
    'third quartile': '第三四分位',
    'current zoom': '当前缩放',
    'pointer': '指针',
    'magnifier': '放大镜',
    'viewport': '视口',
    'layout': '布局',
    'graph': '图',
    'nodes': '节点',
    'node': '节点',
    'edges': '边',
    'edge': '边',
    'links': '连接',
    'link': '连接',
    'series': '系列',
    'chart': '图表',
    'container': '容器',
    'rectangle': '矩形',
    'label': '标签',
    'labels': '标签',
    'axis': '坐标轴',
    'category': '分类',
    'categories': '分类',
    'value': '数值',
    'values': '数值',
    'minimum': '最小值',
    'maximum': '最大值',
    'min': '最小值',
    'max': '最大值',
    'manual': '手动',
    'preferred': '首选',
    'explicit': '显式',
    'order': '顺序',
    'domain': '定义域',
    'field': '字段',
    'fields': '字段',
    'name': '名称',
    'id': 'ID',
    'text': '文本',
    'type': '类型',
    'color': '颜色',
    'colors': '颜色',
    'palette': '调色板',
    'opacity': '透明度',
    'width': '宽度',
    'height': '高度',
    'size': '大小',
    'radius': '半径',
    'gap': '间距',
    'spacing': '间距',
    'padding': '内边距',
    'inset': '内边距',
    'center': '中心点',
    'point': '点',
    'points': '点',
    'line': '线',
    'lines': '线',
    'style': '样式',
    'styles': '样式',
    'symbol': '符号',
    'symbols': '符号',
    'animation': '动画',
    'duration': '时长',
    'delay': '延迟',
    'easing': '缓动',
    'tooltip': '提示框',
    'grid': '网格',
    'row': '行',
    'rows': '行',
    'column': '列',
    'columns': '列',
    'ring': '环',
    'rings': '环',
    'angle': '角度',
    'angular': '角度',
    'radial': '径向',
    'concentric': '同心',
    'circular': '环形',
    'clockwise': '顺时针',
    'counterclockwise': '逆时针',
    'inner': '内',
    'outer': '外',
    'start': '开始',
    'end': '结束',
    'sort': '排序',
    'sorted': '排序后',
    'hovered': '悬停时',
    'interactive': '交互式',
    'background': '背景',
    'baseline': '基线',
    'fragment': '片段',
    'fragments': '片段',
    'participant': '参与者',
    'participants': '参与者',
    'optional': '可选',
    'items': '项',
    'item': '项',
    'sets': '集合',
    'set': '集合',
    'message': '消息',
    'messages': '消息',
    'record': '记录',
    'records': '记录',
    'tuple': 'tuple',
    'tuples': 'tuple',
    'array': '数组',
    'object': '对象',
    'objects': '对象',
    'children': '子项',
    'child': '子项',
    'hierarchy': '层级',
    'hierarchical': '层级',
    'root': '根',
    'visible': '可见',
    'custom': '自定义',
    'formula': '公式',
    'render': '渲染',
    'rendering': '渲染',
    'interaction': '交互',
    'coordinates': '坐标',
    'coordinate': '坐标',
    'horizontal': '水平',
    'vertical': '垂直',
    'component': '分量',
    'components': '分量'
  }).sort((a, b) => b[0].length - a[0].length);
  let activeOptionCaseId = '';

  const VALUES = {
    boolean: 'boolean',
    number: 'number',
    numberOrString: 'number | string',
    pixelOrPercent: 'number | string (pixel or percent)',
    padding: 'number | { top, right, bottom, left }',
    center: '[number | string, number | string]',
    colorArray: 'string[]',
    dimensions: 'string[]',
    field: 'string | number',
    formatter: 'string | function',
    lineStyle: "Object: color/stroke string, width/lineWidth number, opacity number, type 'solid' | 'dashed' | 'dotted' | number[]",
    itemStyle: 'Object: color string, opacity number, borderColor string, borderWidth number, shadowBlur number, shadowColor string',
    boxStyle: 'Object: color/fill string, opacity number, borderColor string, borderWidth number, borderRadius number',
    label: 'Object: show boolean, color string, fontSize number, fontWeight string | number, formatter string | function',
    axis: 'Object: show boolean, name string, label object, splitLine object, axisLine object, nameTextStyle object',
    enterAnimation: 'boolean | { show, enabled, duration, delay, stagger, easing }',
    emphasis: 'Object: itemStyle object, edgeStyle object, focus string, blurScope string'
  };

  const optionReferences = [
    {
      id: 'echarts-layout-core',
      packageName: 'echarts-layout-core',
      title: 'Layout Core',
      links: [{ href: './packages/echarts-layout-core/', label: 'Example' }],
      options: [
        ...rows([
          ['type', 'Selects which graph layout algorithm to run.', "'radial' | 'concentric' | 'grid' | 'mds' | 'arc'"],
          ['input.data / input.nodes', 'Graph nodes to place.', 'Array<object | unknown[]>'],
          ['input.links / input.edges', 'Graph edges that connect source and target nodes.', 'Array<{ source, target }>'],
          ['width', 'Layout viewport width.', 'number'],
          ['height', 'Layout viewport height.', 'number'],
          ['center', 'Layout center point inside the viewport.', VALUES.center],
          ['nodeSize', 'Node diameter used by layout spacing and overlap prevention.', 'number | number[] | function'],
          ['nodeSpacing', 'Extra spacing around each node.', 'number | function'],
          ['preventOverlap', 'Separates nodes when a layout can otherwise place them too close.', VALUES.boolean],
          ['preventOverlapPadding', 'Extra gap used during overlap prevention.', 'number'],
          ['sortBy', 'Sorts nodes before layouts that use ordering.', 'string | function'],
          ['linkDistance', 'Target distance between connected nodes.', 'number'],
          ['focusNode', 'Node id or name used as the radial center.', 'string | number'],
          ['unitRadius', 'Distance between radial graph levels.', 'number'],
          ['strictRadial', 'Keeps radial nodes on strict level rings.', VALUES.boolean],
          ['maxIteration', 'Maximum layout iterations for radial refinement.', 'number'],
          ['maxPreventOverlapIteration', 'Maximum iterations used by overlap prevention.', 'number'],
          ['sortStrength', 'Weight applied when sorted radial nodes share a ring.', 'number'],
          ['maxLevelDiff', 'Maximum score difference before concentric nodes move to a new level.', 'number'],
          ['sweep', 'Angular span used by radial or concentric placement.', 'number (radians)'],
          ['equidistant', 'Forces concentric levels to use equal ring spacing.', VALUES.boolean],
          ['startAngle', 'Starting angle for circular layouts.', 'number (radians)'],
          ['clockwise', 'Places circular nodes clockwise when true.', VALUES.boolean],
          ['rows', 'Requested row count for grid layout.', 'number'],
          ['cols', 'Requested column count for grid layout.', 'number'],
          ['begin', 'Top-left starting point for grid layout.', '[number | string, number | string]'],
          ['condense', 'Lets grid cells shrink to the minimum size needed by nodes.', VALUES.boolean],
          ['position', 'Pins grid nodes to explicit row and column cells.', 'function(node) => { row, col }'],
          ['nodeSep', 'Horizontal gap between nodes in arc layout.', 'number']
        ])
      ]
    },
    graphReference('echarts-radial', 'Radial', 'radial', './packages/echarts-radial/', radialLayoutRows()),
    graphReference('echarts-concentric', 'Concentric', 'concentric', './packages/echarts-concentric/', concentricLayoutRows()),
    graphReference('echarts-grid', 'Grid', 'grid', './packages/echarts-grid/', gridLayoutRows()),
    graphReference('echarts-mds', 'MDS', 'mds', './packages/echarts-mds/', mdsLayoutRows()),
    graphReference('echarts-arc', 'Arc', 'arc', './packages/echarts-arc/', arcLayoutRows()),
    {
      id: 'echarts-radial-area',
      packageName: 'echarts-radial-area',
      title: 'Radial Area',
      links: [{ href: './packages/echarts-radial-area/', label: 'Example' }],
      options: [
        ...seriesCoreRows('radialArea'),
        ...rows([
          ['data', 'Area records. Each record provides angle and value/range fields.', 'Array<object | unknown[]>'],
          ['dimensions', 'Names tuple columns when data rows are arrays.', VALUES.dimensions],
          ['center', 'Center point of the polar area.', VALUES.center],
          ['radius', 'Inner and outer radius pair.', '[number | string, number | string]'],
          ['innerRadius', 'Inner radius of the area band.', VALUES.pixelOrPercent],
          ['outerRadius', 'Outer radius of the area band.', VALUES.pixelOrPercent],
          ['padding', 'Inset around the polar chart.', 'number'],
          ['startAngle', 'Angle where the series starts.', 'number (degrees)'],
          ['endAngle', 'Angle where the series ends.', 'number (degrees)'],
          ['angleSpan', 'Total angular span when endAngle is not supplied.', 'number (degrees)'],
          ['clockwise', 'Draws angle values clockwise when true.', VALUES.boolean],
          ['closed', 'Closes the area path back to the start.', VALUES.boolean],
          ['angleType', 'Controls how angle values are interpreted.', "'category' | 'time' | 'value'"],
          ['angleField', 'Field used for angle/category/time values.', VALUES.field],
          ['valueField', 'Field used for the main value line.', VALUES.field],
          ['minField', 'Field used for the lower range boundary.', VALUES.field],
          ['maxField', 'Field used for the upper range boundary.', VALUES.field],
          ['nameField', 'Field used for point names.', VALUES.field],
          ['categories', 'Explicit category order for category angles.', 'Array<string | number>'],
          ['min', 'Manual radial axis minimum.', 'number'],
          ['max', 'Manual radial axis maximum.', 'number'],
          ['tickCount', 'Preferred radial tick count.', 'number'],
          ['nice', 'Rounds radial extent to nicer tick values.', VALUES.boolean],
          ['grid', 'Shows or hides the polar grid.', 'Object: show boolean'],
          ['radialAxis', 'Controls radial axis labels and split lines.', axisValues('radial axis')],
          ['angleAxis', 'Controls angle axis labels and split lines.', axisValues('angle axis')],
          ['rangeAreaStyle', 'Styles the band between min and max fields.', 'Object: show boolean, color string, opacity number, borderColor string, borderWidth number'],
          ['areaStyle', 'Styles the filled area under the value line.', 'Object: show boolean, color string, opacity number, borderColor string, borderWidth number'],
          ['lineStyle', 'Styles the value line.', VALUES.lineStyle],
          ['itemStyle', 'Styles individual points.', VALUES.itemStyle],
          ['showSymbol', 'Shows point symbols on the line.', VALUES.boolean],
          ['symbolSize', 'Point symbol size.', 'number'],
          ['emphasis', 'Styles points while hovered.', VALUES.emphasis]
        ])
      ]
    },
    {
      id: 'echarts-radial-boxplot',
      packageName: 'echarts-radial-boxplot',
      title: 'Radial Boxplot',
      links: [{ href: './packages/echarts-radial-boxplot/', label: 'Example' }],
      options: [
        ...seriesCoreRows('radialBoxplot'),
        ...rows([
          ['data', 'Boxplot records. Each record provides category plus five-number summary values.', 'Array<object | unknown[]>'],
          ['dimensions', 'Names tuple columns when data rows are arrays.', VALUES.dimensions],
          ['center', 'Center point of the radial boxplot.', VALUES.center],
          ['radius', 'Inner and outer radius pair.', '[number | string, number | string]'],
          ['innerRadius', 'Inner radius of the plot.', VALUES.pixelOrPercent],
          ['outerRadius', 'Outer radius of the plot.', VALUES.pixelOrPercent],
          ['padding', 'Inset around the polar chart.', 'number'],
          ['startAngle', 'Angle where categories start.', 'number (degrees)'],
          ['endAngle', 'Angle where categories end.', 'number (degrees)'],
          ['angleSpan', 'Total angular span when endAngle is not supplied.', 'number (degrees)'],
          ['clockwise', 'Places categories clockwise when true.', VALUES.boolean],
          ['categoryField', 'Field used for category names.', VALUES.field],
          ['nameField', 'Field used for item names.', VALUES.field],
          ['minField', 'Field used for lower whisker values.', VALUES.field],
          ['q1Field', 'Field used for first quartile values.', VALUES.field],
          ['medianField', 'Field used for median values.', VALUES.field],
          ['q3Field', 'Field used for third quartile values.', VALUES.field],
          ['maxField', 'Field used for upper whisker values.', VALUES.field],
          ['categories', 'Explicit category order.', 'Array<string | number>'],
          ['min', 'Manual radial value minimum.', 'number'],
          ['max', 'Manual radial value maximum.', 'number'],
          ['tickCount', 'Preferred radial tick count.', 'number'],
          ['nice', 'Rounds radial extent to nicer tick values.', VALUES.boolean],
          ['boxWidth', 'Angular width of each box.', 'number'],
          ['capWidth', 'Angular width of whisker caps.', 'number'],
          ['labelRadius', 'Radius used for category labels.', VALUES.pixelOrPercent],
          ['grid', 'Shows or hides the polar grid.', 'Object: show boolean'],
          ['radialAxis', 'Controls radial value axis labels and split lines.', axisValues('radial axis')],
          ['angleAxis', 'Controls category axis labels and split lines.', axisValues('angle axis')],
          ['itemStyle', 'Styles the box body.', VALUES.itemStyle],
          ['whiskerLineStyle', 'Styles whisker lines.', VALUES.lineStyle],
          ['medianLineStyle', 'Styles median lines.', VALUES.lineStyle],
          ['capLineStyle', 'Styles whisker caps.', VALUES.lineStyle],
          ['emphasis', 'Styles boxes while hovered.', VALUES.emphasis]
        ])
      ]
    },
    {
      id: 'echarts-venn',
      packageName: 'echarts-venn',
      title: 'Venn',
      links: [
        { href: './packages/echarts-venn/hollow.html', label: 'Hollow example' },
        { href: './packages/echarts-venn/bubble.html', label: 'Bubble example' }
      ],
      options: [
        ...seriesCoreRows('venn'),
        ...rows([
          ['data', 'Venn sets and intersections. Each item uses name, value, and optional sets.', 'Array<{ name, value, sets? }>'],
          ['layout', 'Selects the Venn layout mode, or passes a layout object with type.', "'hollow' | 'bubble' | { type: 'hollow' | 'bubble' }"],
          ['layoutOptions', 'Nested layout sizing options.', 'Object: padding number, minRadius number, maxRadius number'],
          ['vennType', 'Alias for selecting the Venn layout mode.', "'hollow' | 'bubble'"],
          ['mode', 'Alias for selecting the Venn layout mode.', "'hollow' | 'bubble'"],
          ['padding', 'Inset around the Venn layout.', 'number'],
          ['minRadius', 'Smallest circle radius.', 'number'],
          ['maxRadius', 'Largest circle radius.', 'number'],
          ['itemStyle', 'Styles Venn circles.', VALUES.itemStyle],
          ['hollowStyle', 'Styles the hollow overlay in hollow mode.', 'Object: color string, opacity number, borderWidth number'],
          ['label', 'Styles set and intersection labels.', VALUES.label],
          ['emphasis', 'Styles circles while hovered.', VALUES.emphasis]
        ])
      ]
    },
    {
      id: 'echarts-pack-bubble',
      packageName: 'echarts-pack-bubble',
      title: 'Pack Bubble',
      links: [{ href: './packages/echarts-pack-bubble/', label: 'Example' }],
      options: [
        ...seriesCoreRows('packBubble'),
        ...rows([
          ['data', 'Flat bubble records with value and optional category fields.', 'Array<object>'],
          ['layout', 'Nested layout options for the bubble packing engine.', packBubbleLayoutValues()],
          ['layoutOptions', 'Alias for nested layout options.', packBubbleLayoutValues()],
          ['padding', 'Inset around the packed bubbles.', VALUES.padding],
          ['gap', 'Space between packed bubbles.', 'number'],
          ['minRadius', 'Smallest bubble radius.', 'number'],
          ['maxRadius', 'Largest bubble radius.', 'number'],
          ['fillRatio', 'How densely bubbles fill the available area.', 'number'],
          ['center', 'Center point for the packed bubble layout.', VALUES.center],
          ['valueField', 'Field used for bubble size.', 'string'],
          ['nameField', 'Field used for labels and names.', 'string'],
          ['categoryField', 'Field used for color grouping.', 'string'],
          ['sort', 'Sorts bubbles before layout.', "boolean | 'asc' | 'desc' | 'none'"],
          ['colors', 'Palette used for categories.', VALUES.colorArray],
          ['enterAnimation', 'Animates bubbles into place.', VALUES.enterAnimation],
          ['itemStyle', 'Styles bubbles.', VALUES.itemStyle],
          ['label', 'Styles bubble labels.', `${VALUES.label}, lineHeight number, minRadius number`],
          ['emphasis', 'Styles bubbles while hovered.', VALUES.emphasis]
        ])
      ]
    },
    {
      id: 'echarts-circle-packing',
      packageName: 'echarts-circle-packing',
      title: 'Circle Packing',
      links: [{ href: './packages/echarts-circle-packing/', label: 'Example' }],
      options: [
        ...seriesCoreRows('circlePacking'),
        ...rows([
          ['data', 'Hierarchical records to pack into nested circles.', 'Object | Array<object>'],
          ['rootName', 'Display name for an implicit root node.', 'string'],
          ['rootVisible', 'Shows the root circle when true.', VALUES.boolean],
          ['padding', 'Inset around the circle packing layout.', VALUES.padding],
          ['nodePadding', 'Padding inside parent circles.', 'number'],
          ['siblingGap', 'Space between sibling circles.', 'number'],
          ['center', 'Center point of the packed hierarchy.', VALUES.center],
          ['radius', 'Outer radius of the packed hierarchy.', VALUES.pixelOrPercent],
          ['valueField', 'Field used for circle size.', 'string'],
          ['nameField', 'Field used for labels and names.', 'string'],
          ['childrenField', 'Field containing child nodes.', 'string'],
          ['sort', 'Sorts hierarchy nodes before layout.', "boolean | 'none' | 'value' | 'name' | 'asc' | 'desc'"],
          ['colors', 'Palette used by depth or groups.', VALUES.colorArray],
          ['layout', 'Nested hierarchy layout options.', 'Object: rootName, rootVisible, padding, nodePadding, siblingGap, center, radius, valueField, nameField, childrenField, sort'],
          ['layoutOptions', 'Alias for nested hierarchy layout options.', 'Same fields as layout'],
          ['enterAnimation', 'Animates circles into place.', VALUES.enterAnimation],
          ['itemStyle', 'Styles circles.', VALUES.itemStyle],
          ['label', 'Styles circle labels.', `${VALUES.label}, lineHeight number, minRadius number`],
          ['emphasis', 'Styles circles while hovered.', VALUES.emphasis]
        ])
      ]
    },
    {
      id: 'echarts-nested-circle',
      packageName: 'echarts-nested-circle',
      title: 'Nested Circle',
      links: [{ href: './packages/echarts-nested-circle/', label: 'Example' }],
      options: [
        ...seriesCoreRows('nestedCircle'),
        ...rows([
          ['data', 'Nested circle groups and child labels.', 'Array<object>'],
          ['padding', 'Inset around the nested circles.', 'number'],
          ['center', 'Center point of the rings.', VALUES.center],
          ['radius', 'Outer radius of the nested circle chart.', VALUES.pixelOrPercent],
          ['centerRadiusRatio', 'Relative size of the center circle.', 'number'],
          ['labelRadiusRatio', 'Relative radius used by child labels.', 'number'],
          ['titleRadiusRatio', 'Relative radius used by title labels.', 'number'],
          ['minRingThickness', 'Smallest ring thickness.', 'number'],
          ['colors', 'Palette used for rings and child items.', VALUES.colorArray],
          ['ringStyle', 'Styles the ring background.', 'Object: opacity number, borderColor string, borderWidth number'],
          ['itemStyle', 'Styles child circle items.', 'Object: opacity number, borderColor string, borderWidth number'],
          ['titleLabel', 'Styles ring title labels.', `${VALUES.label}, lineHeight number`],
          ['label', 'Styles child labels.', `${VALUES.label}, lineHeight number`]
        ])
      ]
    },
    {
      id: 'echarts-organization-chart',
      packageName: 'echarts-organization-chart',
      title: 'Organization Chart',
      links: [{ href: './packages/echarts-organization-chart/', label: 'Example' }],
      options: [
        ...seriesCoreRows('organizationChart'),
        ...rows([
          ['data', 'Tree or flat organization records.', 'Object | Array<object>'],
          ['nodes', 'Flat node records for organization charts.', 'Array<object>'],
          ['links / edges', 'Explicit parent-child links when using node/link data.', 'Array<{ source, target }>'],
          ['orient', 'Direction of the organization tree.', "'TB' | 'BT' | 'LR' | 'RL' | 'vertical' | 'horizontal'"],
          ['padding', 'Inset around the chart.', VALUES.padding],
          ['nodeWidth', 'Width of each person or group box.', 'number'],
          ['nodeHeight', 'Height of each person or group box.', 'number'],
          ['levelGap', 'Distance between hierarchy levels.', 'number'],
          ['siblingGap', 'Distance between sibling nodes.', 'number'],
          ['subtreeGap', 'Distance between separate subtrees.', 'number'],
          ['idField', 'Field used as node id.', VALUES.field],
          ['parentIdField', 'Field used as parent id in flat data.', VALUES.field],
          ['nameField', 'Field used for node labels.', VALUES.field],
          ['childrenField', 'Field containing child nodes.', VALUES.field],
          ['itemStyle', 'Styles organization nodes.', VALUES.boxStyle],
          ['lineStyle', 'Styles connector lines.', VALUES.lineStyle],
          ['label', 'Styles node labels.', VALUES.label],
          ['emphasis', 'Styles nodes while hovered.', VALUES.emphasis]
        ])
      ]
    },
    {
      id: 'echarts-mosaic',
      packageName: 'echarts-mosaic',
      title: 'Mosaic',
      links: [{ href: './packages/echarts-mosaic/', label: 'Example' }],
      options: [
        ...seriesCoreRows('mosaic'),
        ...rows([
          ['data', 'Records grouped by x category, y category, and value.', 'Array<object | unknown[]>'],
          ['dimensions', 'Names tuple columns when data rows are arrays.', VALUES.dimensions],
          ['xField', 'Field used for top-level columns.', VALUES.field],
          ['yField', 'Field used for segments inside each column.', VALUES.field],
          ['valueField', 'Field used for segment size.', VALUES.field],
          ['xCategories', 'Explicit order for x categories.', 'Array<string | number>'],
          ['yCategories', 'Explicit order for y categories.', 'Array<string | number>'],
          ['padding', 'Inset around the mosaic chart.', 'number'],
          ['gap', 'Gap between mosaic cells.', 'number'],
          ['sort', 'Sorts categories or segments.', "boolean | 'none' | 'value' | 'name'"],
          ['colors', 'Palette used for segments.', VALUES.colorArray],
          ['itemStyle', 'Styles mosaic cells.', VALUES.itemStyle],
          ['label', 'Styles cell labels.', `${VALUES.label}, lineHeight number`],
          ['emphasis', 'Styles cells while hovered.', VALUES.emphasis]
        ])
      ]
    },
    {
      id: 'echarts-voronoi-treemap',
      packageName: 'echarts-voronoi-treemap',
      title: 'Voronoi Treemap',
      links: [{ href: './packages/echarts-voronoi-treemap/', label: 'Example' }],
      options: [
        ...seriesCoreRows('voronoiTreemap'),
        ...rows([
          ['data', 'Hierarchical records to split into Voronoi cells.', 'Object | Array<object | unknown[]>'],
          ['dimensions', 'Names tuple columns when data rows are arrays.', VALUES.dimensions],
          ['nameField', 'Field used for labels and names.', VALUES.field],
          ['valueField', 'Field used for cell area.', VALUES.field],
          ['childrenField', 'Field containing child nodes.', 'string'],
          ['padding', 'Inset around the treemap.', 'number'],
          ['gap', 'Gap between cells.', 'number'],
          ['rootName', 'Display name for an implicit root node.', 'string'],
          ['rootVisible', 'Shows the root cell when true.', VALUES.boolean],
          ['sort', 'Sorts hierarchy nodes before layout.', "boolean | 'none' | 'value' | 'name'"],
          ['maxIteration', 'Maximum iterations for Voronoi relaxation.', 'number'],
          ['colors', 'Palette used by depth or groups.', VALUES.colorArray],
          ['itemStyle', 'Styles cells.', VALUES.itemStyle],
          ['label', 'Styles cell labels.', `${VALUES.label}, showInternal boolean, lineHeight number, minArea number`],
          ['emphasis', 'Styles cells while hovered.', VALUES.emphasis]
        ])
      ]
    },
    {
      id: 'echarts-subway',
      packageName: 'echarts-subway',
      title: 'Subway',
      links: [{ href: './packages/echarts-subway/', label: 'Example' }],
      options: [
        ...seriesCoreRows('subway'),
        ...rows([
          ['data', 'Subway route records. Each route can include stations, segments, and waypoints.', 'Array<object>'],
          ['routes', 'Alias for route records.', 'Array<object>'],
          ['padding', 'Inset around the map.', 'number'],
          ['stationRadius', 'Radius for regular stations.', 'number'],
          ['interchangeRadius', 'Radius for interchange stations.', 'number'],
          ['lineWidth', 'Default width for route lines.', 'number'],
          ['cornerRadius', 'Default route corner radius.', 'number'],
          ['preserveAspectRatio', 'Keeps station coordinates from stretching differently on x and y.', VALUES.boolean],
          ['colors', 'Palette used for routes.', VALUES.colorArray],
          ['lineStyle', 'Styles route lines.', "Object: color string, width number, opacity number, cornerRadius number, cap 'round' | 'butt' | 'square', join 'round' | 'bevel' | 'miter', type 'solid' | 'dashed' | 'dotted' | number[]"],
          ['stationStyle', 'Styles regular stations.', VALUES.itemStyle],
          ['interchangeStyle', 'Styles interchange stations.', VALUES.itemStyle],
          ['label', 'Styles station labels.', VALUES.label],
          ['routeLabel', "Styles route labels at the route start or end.", "Object: show boolean, position 'start' | 'end', color string, fontSize number, fontWeight string | number, formatter string | function"],
          ['emphasis', 'Styles stations or route elements while hovered.', VALUES.emphasis]
        ])
      ]
    },
    {
      id: 'echarts-sequence-diagram',
      packageName: 'echarts-sequence-diagram',
      title: 'Sequence Diagram',
      links: [{ href: './packages/echarts-sequence-diagram/', label: 'Example' }],
      options: [
        ...seriesCoreRows('sequenceDiagram'),
        ...rows([
          ['participants', 'Participants or actors that appear across the top of the diagram.', "Array<object | [id, name] | string | number>"],
          ['messages', 'Message arrows between participants.', "Array<object | [from, to, text, type]>"],
          ['data', 'Alias for message rows.', "Array<object | [from, to, text, type]>"],
          ['activations', 'Activation bars on participant lifelines.', 'Array<object>'],
          ['notes', 'Text notes attached to a participant or span.', 'Array<object>'],
          ['fragments', 'Alt, opt, loop, or other grouped interaction fragments.', 'Array<object>'],
          ['constraints', 'Timing or duration annotations.', 'Array<object>'],
          ['dsl', 'Mermaid-like sequence diagram source string.', 'string'],
          ['source', 'Alias for dsl source string.', 'string'],
          ['padding', 'Inset around the sequence diagram.', VALUES.padding],
          ['headerHeight', 'Height of the participant header area.', 'number'],
          ['headerWidth', 'Minimum width reserved for each participant header.', 'number'],
          ['messageGap', 'Vertical gap between message rows.', 'number'],
          ['selfLoopWidth', 'Width of self-loop messages.', 'number'],
          ['selfLoopHeight', 'Height of self-loop messages.', 'number'],
          ['activationWidth', 'Width of activation bars.', 'number'],
          ['activationMargin', 'Horizontal offset used for nested activations.', 'number'],
          ['participantStyle', 'Styles participant headers.', VALUES.boxStyle],
          ['lifelineStyle', 'Styles participant lifelines.', VALUES.lineStyle],
          ['activationStyle', 'Styles activation bars.', VALUES.itemStyle],
          ['noteStyle', 'Styles notes.', VALUES.boxStyle],
          ['fragmentStyle', 'Styles fragments.', VALUES.boxStyle],
          ['constraintStyle', 'Styles timing and duration constraints.', VALUES.lineStyle],
          ['lineStyle', 'Styles message lines.', VALUES.lineStyle],
          ['label', 'Styles message labels.', VALUES.label],
          ['participantLabel', 'Styles participant labels.', VALUES.label],
          ['emphasis', 'Styles diagram elements while hovered.', VALUES.emphasis]
        ])
      ]
    },
    {
      id: 'echarts-cause-effect',
      packageName: 'echarts-cause-effect',
      title: 'Cause and Effect',
      links: [{ href: './packages/echarts-cause-effect/', label: 'Example' }],
      options: [
        ...seriesCoreRows('causeEffect'),
        ...rows([
          ['effect', 'Main effect, problem, or outcome shown at the spine end.', 'string | number | object'],
          ['problem', 'Alias for the main effect box.', 'string | number | object'],
          ['outcome', 'Alias for the main effect box.', 'string | number | object'],
          ['categories', 'Cause categories with nested causes.', 'Array<object | array | string | number>'],
          ['causes', 'Alias for category data.', 'Array<object | array | string | number>'],
          ['data', 'Alias for category data.', 'Array<object | array | string | number>'],
          ['padding', 'Inset around the cause-effect diagram.', VALUES.padding],
          ['effectWidth', 'Width of the effect box.', 'number'],
          ['effectHeight', 'Height of the effect box.', 'number'],
          ['effectGap', 'Gap between the spine and effect box.', 'number'],
          ['categoryGap', 'Gap between category branches.', 'number'],
          ['categoryLength', 'Length of category branch lines.', 'number'],
          ['categoryAngle', 'Angle of category branch lines.', 'number (degrees)'],
          ['causeGap', 'Gap between causes along a branch.', 'number'],
          ['causeLength', 'Length of individual cause lines.', 'number'],
          ['maxCauseDepth', 'Maximum nested cause depth to render.', 'number'],
          ['spineArrowSize', 'Arrow size at the end of the spine.', 'number'],
          ['lineStyle', 'Styles the main spine.', VALUES.lineStyle],
          ['categoryLineStyle', 'Styles category branch lines.', VALUES.lineStyle],
          ['causeLineStyle', 'Styles cause lines.', VALUES.lineStyle],
          ['effectStyle', 'Styles the effect box.', VALUES.boxStyle],
          ['label', 'Default label style for diagram text.', VALUES.label],
          ['effectLabel', 'Styles the effect label.', VALUES.label],
          ['categoryLabel', 'Styles category labels.', VALUES.label],
          ['causeLabel', 'Styles cause labels.', VALUES.label],
          ['emphasis', 'Styles elements while hovered.', VALUES.emphasis]
        ])
      ]
    },
    {
      id: 'echarts-flame',
      packageName: 'echarts-flame',
      title: 'Flame',
      links: [{ href: './packages/echarts-flame/', label: 'Example' }],
      options: [
        ...seriesCoreRows('flame'),
        ...rows([
          ['data', 'Hierarchical flame graph records.', 'Object | Array<object>'],
          ['rootName', 'Display name for an implicit root node.', 'string'],
          ['rootVisible', 'Shows the root band when true.', VALUES.boolean],
          ['orient', 'Direction the flame graph grows.', "'up' | 'down'"],
          ['padding', 'Inset around the flame graph.', 'number'],
          ['gap', 'Gap between flame graph rectangles.', 'number'],
          ['sort', 'Sorts children before layout.', "boolean | 'none' | 'value' | 'name'"],
          ['colors', 'Palette used by depth or groups.', VALUES.colorArray],
          ['itemStyle', 'Styles flame graph rectangles.', VALUES.itemStyle],
          ['label', 'Styles rectangle labels.', VALUES.label],
          ['emphasis', 'Styles rectangles while hovered.', VALUES.emphasis]
        ])
      ]
    },
    {
      id: 'echarts-sunrise-sunset',
      packageName: 'echarts-sunrise-sunset',
      title: 'Sunrise Sunset',
      links: [{ href: './packages/echarts-sunrise-sunset/', label: 'Example' }],
      options: [
        ...seriesCoreRows('sunriseSunset'),
        ...rows([
          ['data', 'Single record or records containing sun, moon, title, and status text values.', 'Object | Array<object>'],
          ['sunrise', 'Sunrise time.', 'string | number | Date'],
          ['sunset', 'Sunset time.', 'string | number | Date'],
          ['moonrise', 'Moonrise time.', 'string | number | Date'],
          ['moonset', 'Moonset time.', 'string | number | Date'],
          ['currentTime', 'Time used to compute current progress and remaining text.', 'string | number | Date'],
          ['updatedAt', 'Timestamp shown by the updated label.', 'string | number | Date'],
          ['title', 'Title text shown above the arc.', 'string'],
          ['remainingText', 'Text shown for remaining daylight or night time.', 'string'],
          ['updatedText', 'Text shown for update status.', 'string'],
          ['enterAnimation', 'Animates sun and moon elements into place.', VALUES.enterAnimation],
          ['sunIcon', 'Custom sun icon.', 'string | false | { path, image, size, width, height, offset, style }'],
          ['moonIcon', 'Custom moon icon.', 'string | false | { path, image, size, width, height, offset, style }'],
          ['padding', 'Inset around the chart.', 'number'],
          ['baselineY', 'Vertical position of the horizon baseline.', 'number'],
          ['dayArcHeight', 'Height of the day arc.', 'number'],
          ['moonArcHeight', 'Height of the moon arc.', 'number'],
          ['moonStartRatio', 'Relative start position of the moon arc.', 'number'],
          ['moonEndRatio', 'Relative end position of the moon arc.', 'number'],
          ['backgroundStyle', 'Styles the chart background area.', 'Object: color string, opacity number'],
          ['baselineStyle', 'Styles the horizon baseline.', VALUES.lineStyle],
          ['dayLineStyle', 'Styles the sun path line.', VALUES.lineStyle],
          ['moonLineStyle', 'Styles the moon path line.', VALUES.lineStyle],
          ['dayAreaStyle', 'Styles the daylight area fill.', 'Object: color string, opacity number'],
          ['moonAreaStyle', 'Styles the moon area fill.', 'Object: color string, opacity number'],
          ['titleLabel', 'Styles title text.', VALUES.label],
          ['remainingLabel', 'Styles remaining-time text.', VALUES.label],
          ['updatedLabel', 'Styles updated-time text.', VALUES.label],
          ['eventLabel', 'Styles sunrise, sunset, moonrise, and moonset labels.', VALUES.label]
        ])
      ]
    },
    {
      id: 'echarts-lollipop',
      packageName: 'echarts-lollipop',
      title: 'Lollipop',
      links: [{ href: './packages/echarts-lollipop/', label: 'Example' }],
      options: [
        ...seriesCoreRows('lollipop'),
        ...rows([
          ['data', 'Category-value records drawn as stems and symbols.', 'Array<object | unknown[]>'],
          ['dimensions', 'Names tuple columns when data rows are arrays.', VALUES.dimensions],
          ['categoryField', 'Field used for categories.', VALUES.field],
          ['valueField', 'Field used for numeric values.', VALUES.field],
          ['nameField', 'Field used for item names.', VALUES.field],
          ['categories', 'Explicit category order.', 'Array<string | number>'],
          ['padding', 'Inset around the chart.', VALUES.padding],
          ['min', 'Manual value-axis minimum.', 'number'],
          ['max', 'Manual value-axis maximum.', 'number'],
          ['baseline', 'Value where stems begin.', 'number'],
          ['tickCount', 'Preferred value-axis tick count.', 'number'],
          ['nice', 'Rounds value extent to nicer tick values.', VALUES.boolean],
          ['large', 'Enables large-data rendering path.', VALUES.boolean],
          ['symbolSize', 'Size of lollipop symbols.', 'number'],
          ['grid', 'Shows or hides the chart grid.', 'Object: show boolean'],
          ['valueAxis', 'Controls value-axis labels and lines.', VALUES.axis],
          ['categoryAxis', 'Controls category-axis labels and lines.', VALUES.axis],
          ['stemStyle', 'Styles lollipop stems.', VALUES.lineStyle],
          ['itemStyle', 'Styles lollipop symbols.', VALUES.itemStyle],
          ['label', 'Styles data labels.', VALUES.label],
          ['emphasis', 'Styles symbols while hovered.', VALUES.emphasis]
        ])
      ]
    },
    {
      id: 'echarts-beeswarm',
      packageName: 'echarts-beeswarm',
      title: 'Beeswarm',
      links: [{ href: './packages/echarts-beeswarm/', label: 'Example' }],
      options: [
        ...seriesCoreRows('beeswarm'),
        ...rows([
          ['data', 'Point records grouped into a collision-aware swarm.', 'Array<object | unknown[]>'],
          ['dimensions', 'Names tuple columns when data rows are arrays.', VALUES.dimensions],
          ['categoryField', 'Field used for categories.', VALUES.field],
          ['valueField', 'Field used for numeric values.', VALUES.field],
          ['nameField', 'Field used for item names.', VALUES.field],
          ['categories', 'Explicit category order.', 'Array<string | number>'],
          ['orient', 'Swarm direction.', "'horizontal' | 'vertical'"],
          ['padding', 'Inset around the chart.', VALUES.padding],
          ['min', 'Manual value-axis minimum.', 'number'],
          ['max', 'Manual value-axis maximum.', 'number'],
          ['tickCount', 'Preferred value-axis tick count.', 'number'],
          ['nice', 'Rounds value extent to nicer tick values.', VALUES.boolean],
          ['symbolSize', 'Size of swarm symbols.', 'number'],
          ['collisionPadding', 'Minimum gap between colliding symbols.', 'number'],
          ['swarmRadius', 'Maximum radius used to spread a category swarm.', 'number'],
          ['grid', 'Shows or hides the chart grid.', 'Object: show boolean'],
          ['valueAxis', 'Controls value-axis labels and lines.', VALUES.axis],
          ['categoryAxis', 'Controls category-axis labels and lines.', VALUES.axis],
          ['itemStyle', 'Styles swarm symbols.', VALUES.itemStyle],
          ['label', 'Styles point labels.', VALUES.label],
          ['emphasis', 'Styles symbols while hovered.', VALUES.emphasis]
        ])
      ]
    },
    {
      id: 'echarts-spiral',
      packageName: 'echarts-spiral',
      title: 'Spiral',
      links: [{ href: './packages/echarts-spiral/', label: 'Example' }],
      options: [
        ...seriesCoreRows('spiral'),
        ...rows([
          ['data', 'Records drawn as bands along a spiral.', 'Array<object | unknown[]>'],
          ['dimensions', 'Names tuple columns when data rows are arrays.', VALUES.dimensions],
          ['nameField', 'Field used for labels and names.', VALUES.field],
          ['valueField', 'Field used for band size or color scale.', VALUES.field],
          ['center', 'Center point of the spiral.', VALUES.center],
          ['padding', 'Inset around the spiral.', 'number'],
          ['innerRadius', 'Radius where the spiral starts.', VALUES.pixelOrPercent],
          ['outerRadius', 'Radius where the spiral ends.', VALUES.pixelOrPercent],
          ['turns', 'Number of spiral turns.', 'number'],
          ['segmentsPerTurn', 'Number of segments used per turn.', 'number'],
          ['startAngle', 'Angle where the spiral starts.', 'number (degrees)'],
          ['clockwise', 'Draws the spiral clockwise when true.', VALUES.boolean],
          ['sort', 'Sorts records before placement.', "boolean | 'none' | 'asc' | 'desc'"],
          ['gapAngle', 'Angular gap between segments.', 'number'],
          ['radialGap', 'Radial gap between turns.', 'number'],
          ['bandWidth', 'Width of each spiral band.', 'number'],
          ['min', 'Manual scale minimum.', 'number'],
          ['max', 'Manual scale maximum.', 'number'],
          ['minOpacity', 'Opacity used for the smallest value.', 'number'],
          ['maxOpacity', 'Opacity used for the largest value.', 'number'],
          ['enterAnimation', 'Animates spiral bands into place.', VALUES.enterAnimation],
          ['itemStyle', 'Styles spiral bands.', VALUES.itemStyle],
          ['label', "Styles band labels and controls inside/outside placement.", `${VALUES.label}, position 'outside' | 'inside'`],
          ['emphasis', 'Styles bands while hovered.', VALUES.emphasis]
        ])
      ]
    },
    {
      id: 'echarts-smith',
      packageName: 'echarts-smith',
      title: 'Smith',
      links: [{ href: './packages/echarts-smith/', label: 'Example' }],
      options: [
        ...seriesCoreRows('smith'),
        ...rows([
          ['data', 'Impedance or reflection-coefficient records.', 'Array<object | unknown[]>'],
          ['dataType', 'How input data is interpreted.', "'impedance' | 'gamma'"],
          ['referenceImpedance', 'Reference impedance used to normalize values.', 'number'],
          ['dimensions', 'Names tuple columns when data rows are arrays.', VALUES.dimensions],
          ['nameField', 'Field used for labels and names.', VALUES.field],
          ['resistanceField', 'Field used for resistance values.', VALUES.field],
          ['reactanceField', 'Field used for reactance values.', VALUES.field],
          ['gammaField', 'Field containing a reflection coefficient pair.', VALUES.field],
          ['gammaRealField', 'Field used for gamma real values.', VALUES.field],
          ['gammaImagField', 'Field used for gamma imaginary values.', VALUES.field],
          ['resistanceValues', 'Grid resistance circles to draw.', 'number[]'],
          ['reactanceValues', 'Grid reactance arcs to draw.', 'number[]'],
          ['padding', 'Inset around the Smith chart.', VALUES.padding],
          ['showSwrCircle', 'Shows the selected SWR circle when true.', VALUES.boolean],
          ['swrMagnitude', 'Magnitude used for the SWR circle.', 'number'],
          ['swrIndex', 'Index of a data point used to derive the SWR circle.', 'number'],
          ['symbolSize', 'Point symbol size.', 'number'],
          ['grid', 'Controls Smith chart grid lines and labels.', 'Object: show, unitCircle, axisLine, resistanceLine, reactanceLine, label'],
          ['swrStyle', 'Styles the SWR circle.', VALUES.lineStyle],
          ['lineStyle', 'Styles connecting lines.', VALUES.lineStyle],
          ['itemStyle', 'Styles data points.', VALUES.itemStyle],
          ['label', 'Styles point labels.', VALUES.label],
          ['cursor', 'Controls the interactive impedance cursor.', 'Object: show, lineStyle, circleStyle, curveStyle, tooltip'],
          ['emphasis', 'Styles points while hovered.', VALUES.emphasis]
        ])
      ]
    },
    {
      id: 'echarts-vector-field',
      packageName: 'echarts-vector-field',
      title: 'Vector Field',
      links: [{ href: './packages/echarts-vector-field/', label: 'Example' }],
      options: [
        ...seriesCoreRows('vectorField'),
        ...rows([
          ['data', 'Vector rows. Objects use x/y/u/v fields; tuples use [x, y, u, v].', 'Array<object | [number, number, number, number]>'],
          ['padding', 'Inset around the vector field.', 'number'],
          ['xExtent', 'Explicit x-coordinate domain.', '[number, number]'],
          ['yExtent', 'Explicit y-coordinate domain.', '[number, number]'],
          ['xField', 'Field used for x coordinates.', 'string'],
          ['yField', 'Field used for y coordinates.', 'string'],
          ['uField', 'Field used for horizontal vector components.', 'string'],
          ['vField', 'Field used for vertical vector components.', 'string'],
          ['invertY', 'Flips y values for north-up coordinate rendering.', VALUES.boolean],
          ['samplingStep', 'Renders every nth vector for dense data.', 'number'],
          ['minLength', 'Minimum arrow length after scaling.', 'number'],
          ['maxLength', 'Maximum arrow length after scaling.', 'number | null'],
          ['lengthScale', 'Multiplier from vector magnitude to arrow length.', 'number | null'],
          ['arrowHeadLength', 'Length of arrow heads.', 'number | null'],
          ['arrowHeadAngle', 'Angle of arrow heads.', 'number | null (radians)'],
          ['layout', 'Nested layout option object.', 'Object: xExtent, yExtent, fields, invertY, samplingStep, length controls'],
          ['layoutOptions', 'Alias for nested layout options.', 'Same fields as layout'],
          ['enterAnimation', 'Animates arrows into place.', VALUES.enterAnimation],
          ['lineStyle', 'Styles arrows.', VALUES.lineStyle],
          ['emphasis', 'Styles arrows while hovered.', VALUES.emphasis],
          ['tooltip', 'Controls ECharts tooltip behavior.', 'Object: trigger string']
        ])
      ]
    },
    {
      id: 'echarts-fisheye',
      packageName: 'echarts-fisheye',
      title: 'Fisheye',
      links: [{ href: './packages/echarts-fisheye/', label: 'Example' }],
      options: [
        ...rows([
          ['fisheye', 'Top-level component option added to an ECharts option object.', 'Object | Object[]'],
          ['fisheye.type', 'Component type marker.', "'fisheye'"],
          ['fisheye.show', 'Shows and enables the magnifier when true.', VALUES.boolean],
          ['fisheye.enabled', 'Alias for enabling the magnifier.', VALUES.boolean],
          ['fisheye.radius', 'Lens radius around the pointer.', VALUES.pixelOrPercent],
          ['fisheye.scale', 'Magnification factor at the lens center.', 'number'],
          ['fisheye.magnification', 'Alias for scale.', 'number'],
          ['fisheye.stroke', 'Lens outline color.', 'string'],
          ['fisheye.borderColor', 'Alias for lens outline color.', 'string'],
          ['fisheye.strokeWidth', 'Lens outline width.', 'number'],
          ['fisheye.borderWidth', 'Alias for lens outline width.', 'number'],
          ['fisheye.opacity', 'Lens outline opacity.', 'number'],
          ['fisheye.preview', 'Runs an initial preview pulse when available.', VALUES.boolean]
        ])
      ]
    },
    {
      id: 'echarts-fractal',
      packageName: 'echarts-fractal',
      title: 'Fractal',
      links: [{ href: './packages/echarts-fractal/', label: 'Example' }],
      options: [
        ...seriesCoreRows('fractal'),
        ...rows([
          ['name', 'Series name used by ECharts.', 'string'],
          ['fractalType', 'Fractal formula to render.', "'mandelbrot' | 'julia' | 'burningShip'"],
          ['viewport', 'Nested viewport controls.', 'Object: center, viewWidth, scale, zoom'],
          ['center', 'Fractal-plane center point.', '[number, number]'],
          ['viewWidth', 'Width of the visible fractal plane.', 'number'],
          ['scale', 'Viewport scale multiplier.', 'number'],
          ['zoom', 'Current zoom value.', 'number'],
          ['roam', 'Allows pan and zoom interaction.', VALUES.boolean],
          ['minZoom', 'Minimum allowed zoom.', 'number'],
          ['maxZoom', 'Maximum allowed zoom, or unlimited when null.', 'number | null'],
          ['zoomStep', 'Zoom multiplier per wheel or control step.', 'number'],
          ['pixelRatio', 'Render pixel ratio, or auto when null.', 'number | null'],
          ['maxPixelCount', 'Maximum pixel budget for a full render.', 'number'],
          ['fallbackMaxCells', 'Fallback render cell budget when pixel budget is exceeded.', 'number'],
          ['interactivePixelRatio', 'Pixel ratio used during interaction renders.', 'number'],
          ['interactiveMaxPixelCount', 'Pixel budget used during interaction renders.', 'number'],
          ['interactiveIterationScale', 'Iteration multiplier used during interaction renders.', 'number'],
          ['minInteractiveIterations', 'Minimum iterations during interaction renders.', 'number'],
          ['refineDelay', 'Delay before refining after interaction.', 'number'],
          ['worker', 'Enables worker-based rendering when true.', VALUES.boolean],
          ['workerUrl', 'Custom worker script URL.', 'string'],
          ['baseIterations', 'Base iteration count before zoom boosts.', 'number'],
          ['iterationBoost', 'Additional iteration factor as zoom increases.', 'number'],
          ['iterationLimit', 'Hard cap for computed iteration count.', 'number'],
          ['maxIterations', 'Explicit maximum iteration count, or auto when null.', 'number | null'],
          ['escapeRadius', 'Escape radius used by the fractal formula.', 'number'],
          ['juliaConstant', 'Complex constant used by Julia sets.', '[number, number]'],
          ['insideColor', 'Color used for points inside the set.', 'string'],
          ['backgroundColor', 'Canvas background color.', 'string'],
          ['colorStops', 'Gradient stops for escaped points.', 'Array<[number, string] | { offset, color }>'],
          ['tooltip', 'Controls ECharts tooltip behavior.', 'Object: trigger string']
        ])
      ]
    }
  ];

  optionReferences.forEach((optionCase) => {
    optionCase.options = expandNestedRows(optionCase, optionCase.options);
  });

  document.addEventListener('DOMContentLoaded', renderOptionsPage);

  function renderOptionsPage() {
    const nav = document.getElementById('options-nav');
    const list = document.getElementById('options-list');
    if (!nav || !list) return;

    nav.textContent = '';
    list.textContent = '';

    optionReferences.forEach((optionCase) => {
      nav.append(createNavLink(optionCase));
      list.append(createOptionCard(optionCase));
    });

    initializeOptionSelection();
    initializeOptionSearch();
  }

  function createNavLink(optionCase) {
    const link = document.createElement('a');
    link.href = `#${optionCase.id}`;
    link.dataset.optionTarget = optionCase.id;
    link.setAttribute('aria-current', 'false');
    link.textContent = localizeTitle(optionCase.title);
    return link;
  }

  function createOptionCard(optionCase) {
    const article = document.createElement('article');
    article.className = 'option-card';
    article.id = optionCase.id;
    article.hidden = true;
    article.dataset.searchVisible = 'true';
    article.dataset.searchText = normalizeSearchText(`${optionCase.title} ${localizeTitle(optionCase.title)} ${optionCase.packageName}`);

    const header = document.createElement('header');
    header.className = 'option-card__header';

    const titleBlock = document.createElement('div');
    const title = document.createElement('h2');
    title.textContent = localizeTitle(optionCase.title);

    const meta = document.createElement('div');
    meta.className = 'option-card__meta';
    const packageName = document.createElement('span');
    packageName.textContent = optionCase.packageName;
    const count = document.createElement('span');
    count.textContent = `${optionCase.options.length} ${UI.packageUnit}`;
    meta.append(packageName, count);
    optionCase.links.forEach((linkInfo) => {
      const example = document.createElement('a');
      example.href = linkInfo.href;
      example.textContent = localizeLinkLabel(linkInfo.label);
      meta.append(example);
    });

    titleBlock.append(title, meta);
    header.append(titleBlock);

    const tableWrap = document.createElement('div');
    tableWrap.className = 'option-table-wrap';

    const table = document.createElement('table');
    table.className = 'option-table';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    UI.tableHeaders.forEach((label) => {
      const th = document.createElement('th');
      th.scope = 'col';
      th.textContent = label;
      headerRow.append(th);
    });
    thead.append(headerRow);

    const tbody = document.createElement('tbody');
    const optionTree = createOptionTree(optionCase.options);
    optionCase.options.forEach((option, index) => {
      tbody.append(createOptionRow(option, optionTree[index]));
    });
    initializeOptionTree(tbody);

    table.append(thead, tbody);
    tableWrap.append(table);
    article.append(header, tableWrap);
    return article;
  }

  function createOptionRow(option, node) {
    const tr = document.createElement('tr');
    tr.dataset.optionIndex = String(node.index);
    tr.dataset.optionName = option.option;
    tr.dataset.level = String(option.level || 0);
    const description = localizeDescription(option.description, option.option);
    const values = localizeValues(option.values);
    tr.dataset.searchText = normalizeSearchText(`${option.option} ${option.description} ${description} ${option.values} ${values}`);
    if (node.parentIndex >= 0) {
      tr.dataset.parentIndex = String(node.parentIndex);
      tr.hidden = true;
    }
    if (node.childIndexes.length) {
      tr.classList.add('option-table__row--expandable');
      tr.dataset.childIndexes = node.childIndexes.join(',');
      tr.dataset.expanded = 'false';
    }
    if (option.level) {
      tr.classList.add('option-table__row--nested', `option-table__row--level-${Math.min(option.level, 3)}`);
    }

    const optionCell = document.createElement('td');
    optionCell.className = 'option-table__name';
    const nameContent = document.createElement('span');
    nameContent.className = 'option-table__name-content';
    if (node.childIndexes.length) {
      const toggle = document.createElement('button');
      toggle.className = 'option-toggle';
      toggle.type = 'button';
      toggle.textContent = '+';
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', formatToggleLabel(false, option.option));
      nameContent.append(toggle);
    } else {
      const spacer = document.createElement('span');
      spacer.className = 'option-toggle-spacer';
      spacer.setAttribute('aria-hidden', 'true');
      nameContent.append(spacer);
    }
    const code = document.createElement('code');
    code.textContent = option.option;
    nameContent.append(code);
    optionCell.append(nameContent);

    const descriptionCell = document.createElement('td');
    descriptionCell.textContent = description;

    const valuesCell = document.createElement('td');
    valuesCell.className = 'option-table__values';
    valuesCell.textContent = values;

    tr.append(optionCell, descriptionCell, valuesCell);
    return tr;
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

    activeOptionCaseId = getHashOptionCaseId() || optionReferences[0]?.id || '';
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
      const navLink = document.querySelector(`[data-option-target="${card.id}"]`);
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
      status.textContent = IS_ZH ? `${totalCards} ${UI.packages}` : `${totalCards} ${UI.packages}`;
      return;
    }
    if (!matches && !visibleCards) {
      status.textContent = UI.noMatches;
      return;
    }
    if (!matches && packageMatches) {
      status.textContent = IS_ZH
        ? `${packageMatches} ${UI.matchingPackages}`
        : `${packageMatches} ${packageMatches === 1 ? UI.matchingPackage : UI.matchingPackages}`;
      return;
    }
    status.textContent = IS_ZH
      ? `${visibleCards} 个图表中有 ${matches} 个匹配配置项。`
      : `${matches} matching options in ${visibleCards} packages.`;
  }

  function selectOptionCase(optionCaseId, { updateHash = false } = {}) {
    const card = document.getElementById(optionCaseId);
    if (!card || card.dataset.searchVisible === 'false') return;

    activeOptionCaseId = optionCaseId;
    if (updateHash && window.location.hash !== `#${optionCaseId}`) {
      window.history.pushState(null, '', `#${optionCaseId}`);
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

  function localizeTitle(title) {
    if (!IS_ZH) return title;
    const titles = {
      'Layout Core': '布局核心',
      Radial: '径向图',
      Concentric: '同心图',
      Grid: '网格图',
      MDS: 'MDS 图',
      Arc: '弧形图',
      'Radial Area': '径向面积图',
      'Radial Boxplot': '径向箱线图',
      Venn: '韦恩图',
      'Pack Bubble': '打包气泡图',
      'Circle Packing': '圆形打包图',
      'Nested Circle': '嵌套圆图',
      'Organization Chart': '组织结构图',
      Mosaic: '马赛克图',
      'Voronoi Treemap': 'Voronoi 矩形树图',
      Subway: '地铁线路图',
      'Sequence Diagram': '时序图',
      'Cause and Effect': '因果图',
      Flame: '火焰图',
      'Sunrise Sunset': '日出日落图',
      Lollipop: '棒棒糖图',
      Beeswarm: '蜂群图',
      Spiral: '螺旋图',
      Smith: '史密斯圆图',
      'Vector Field': '向量场',
      Fisheye: '鱼眼组件',
      Fractal: '分形图'
    };
    return titles[title] || title;
  }

  function localizeLinkLabel(label) {
    if (!IS_ZH) return label;
    if (label === 'Hollow example') return '空心示例';
    if (label === 'Bubble example') return '气泡示例';
    if (label === 'Example') return UI.example;
    return label.replace(/\bexample\b/i, '示例');
  }

  function localizeDescription(description) {
    if (!IS_ZH) return description;
    return description
      .split(/(?<=\.)\s+/)
      .filter(Boolean)
      .map((sentence) => translateSentence(sentence.trim()))
      .join('');
  }

  function translateSentence(sentence) {
    const clean = sentence.replace(/\.$/, '').trim();
    if (!clean) return '';
    if (DESCRIPTION_ZH[clean]) return `${DESCRIPTION_ZH[clean]}。`;

    const samePrefix = clean.match(/^Same effect as ([A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)*)\.?\s*(.*)$/);
    if (samePrefix) {
      const rest = samePrefix[2] ? translateSentence(samePrefix[2]) : '';
      return `与 ${samePrefix[1]} 效果相同。${rest}`;
    }

    const sameSuffix = clean.match(/^(.*?)\s+Same effect as ([A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)*)$/);
    if (sameSuffix) {
      return `${translateSentence(sameSuffix[1])}与 ${sameSuffix[2]} 效果相同。`;
    }

    const alias = clean.match(/^Alias for (.+)$/);
    if (alias) return `${translatePhrase(alias[1])}的别名。`;

    const nested = clean.match(/^Nested (.+) option$/);
    if (nested) return `嵌套 ${translatePhrase(nested[1])} 选项。`;

    const eachMayInclude = clean.match(/^Each ([a-z ]+) may include (.+)$/i);
    if (eachMayInclude) return `每个${translatePhrase(eachMayInclude[1])}可以包含 ${formatFieldList(eachMayInclude[2])}。`;

    const eachUses = clean.match(/^Each ([a-z ]+) uses (.+)$/i);
    if (eachUses) return `每个${translatePhrase(eachUses[1])}使用 ${formatFieldList(eachUses[2])}。`;

    const objectsUse = clean.match(/^Objects use (.+); tuples use (.+)$/);
    if (objectsUse) return `对象使用 ${formatFieldList(objectsUse[1])}；元组使用 ${objectsUse[2]}。`;

    const whenOmitted = clean.match(/^When omitted, (.+)$/);
    if (whenOmitted) return `省略时，${translatePhrase(whenOmitted[1])}。`;

    const fieldUsedFor = clean.match(/^Field used for (.+)$/);
    if (fieldUsedFor) return `用于${translatePhrase(fieldUsedFor[1])}的字段。`;

    const usedFor = clean.match(/^(.+?) used for (.+)$/);
    if (usedFor) return `用于${translatePhrase(usedFor[2])}的${translatePhrase(usedFor[1])}。`;

    const usedBy = clean.match(/^(.+?) used by (.+)$/);
    if (usedBy) return `${translatePhrase(usedBy[2])}使用的${translatePhrase(usedBy[1])}。`;

    const requiredBefore = clean.match(/^(.+?) required before (.+)$/);
    if (requiredBefore) return `${translatePhrase(requiredBefore[1])}，用于判断何时${translatePhrase(requiredBefore[2])}。`;

    const verbPatterns = [
      [/^Selects which (.+) to run$/, '选择要运行的{0}。'],
      [/^Selects (.+)$/, '选择{0}。'],
      [/^Controls how (.+) are interpreted$/, '控制{0}的解释方式。'],
      [/^Controls (.+)$/, '控制{0}。'],
      [/^Configures (.+)$/, '配置{0}。'],
      [/^Styles (.+)$/, '设置{0}样式。'],
      [/^Shows or hides (.+)$/, '显示或隐藏{0}。'],
      [/^Shows (.+) when true$/, '为 true 时显示{0}。'],
      [/^Shows (.+)$/, '显示{0}。'],
      [/^Enables (.+) when true$/, '为 true 时启用{0}。'],
      [/^Disables (.+) when true$/, '为 true 时禁用{0}。'],
      [/^Animates (.+)$/, '为{0}添加动画。'],
      [/^Sorts (.+)$/, '对{0}排序。'],
      [/^Keeps (.+)$/, '保持{0}。'],
      [/^Forces (.+)$/, '强制{0}。'],
      [/^Places (.+)$/, '放置{0}。'],
      [/^Draws (.+)$/, '绘制{0}。'],
      [/^Closes (.+)$/, '闭合{0}。'],
      [/^Ranks (.+)$/, '对{0}排序分级。'],
      [/^Expands (.+)$/, '扩展{0}。'],
      [/^Pins (.+)$/, '固定{0}。'],
      [/^Runs (.+)$/, '运行{0}。'],
      [/^Uses (.+)$/, '使用{0}。'],
      [/^Lets (.+)$/, '允许{0}。'],
      [/^Separates (.+)$/, '分隔{0}。'],
      [/^Increases (.+)$/, '增大{0}。'],
      [/^Flips (.+)$/, '翻转{0}。'],
      [/^Renders (.+)$/, '渲染{0}。'],
      [/^Formats (.+)$/, '格式化{0}。']
    ];

    for (const [regex, template] of verbPatterns) {
      const match = clean.match(regex);
      if (match) return template.replace('{0}', translatePhrase(match[1]));
    }

    const simpleField = clean.match(/^(.+) field$/i);
    if (simpleField) return `${translatePhrase(simpleField[1])}字段。`;

    return `${translatePhrase(clean)}。`;
  }

  function translatePhrase(phrase) {
    const original = phrase.trim();
    if (!original) return '';
    const normalized = original
      .replace(/^(the|a|an|this)\s+/i, '')
      .replace(/\s+/g, ' ')
      .trim();
    const exact = PHRASE_ZH[normalized.toLowerCase()];
    if (exact) return exact;

    let translated = normalized;
    PHRASE_REPLACEMENTS.forEach(([english, chinese]) => {
      translated = translated.replace(new RegExp(escapeRegExp(english), 'gi'), chinese);
    });
    return translated
      .replace(/\s+when true$/i, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function formatFieldList(value) {
    return value
      .replace(/\band optional\b/gi, '以及可选的')
      .replace(/\bor\b/gi, '或')
      .replace(/\band\b/gi, '和')
      .trim();
  }

  function localizeValues(values) {
    if (!IS_ZH) return values;
    return values
      .replace(/^Object:/g, '对象：')
      .replace(/\bObject\b/g, '对象')
      .replace(/\bobject\b/g, '对象')
      .replace(/\bArray\b/g, '数组')
      .replace(/\bboolean\b/g, '布尔值')
      .replace(/\bnumber\b/g, '数字')
      .replace(/\bstring\b/g, '字符串')
      .replace(/\bfunction\b/g, '函数')
      .replace(/\bunknown\b/g, '未知')
      .replace(/\bDate\b/g, '日期')
      .replace(/\bpixel or percent\b/g, '像素或百分比')
      .replace(/Same fields as ([A-Za-z0-9_.]+)/g, '字段同 $1')
      .replace(/common values include/g, '常见值包括')
      .replace(/default/g, '默认值');
  }

  function formatToggleLabel(expanded, optionName) {
    return `${expanded ? UI.collapse : UI.expand} ${optionName} ${UI.optionsLabel}`;
  }

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function normalizeSearchText(value) {
    return String(value || '').trim().toLowerCase();
  }

  function expandNestedRows(optionCase, options) {
    const expandedOptions = splitAliasRows(options);
    const existing = new Set(expandedOptions.map((option) => option.option));
    const result = [];

    expandedOptions.forEach((option) => {
      appendOption(option);
    });

    return result;

    function appendOption(option) {
      const nestedRows = createNestedRows(optionCase, option);
      const row = nestedRows.length ? {
        ...option,
        values: summarizeObjectValue(option.values)
      } : option;
      result.push(row);

      nestedRows.forEach((nestedRow) => {
        if (existing.has(nestedRow.option)) return;
        existing.add(nestedRow.option);
        appendOption({
          level: (option.level || 0) + 1,
          ...nestedRow
        });
      });
    }
  }

  function createNestedRows(optionCase, row) {
    const option = row.option;
    if (option.includes(' / ')) return [];

    if (row.values === VALUES.padding) return paddingRows(option);
    if (row.values === VALUES.enterAnimation || /^boolean \| \{/.test(row.values)) return animationRows(option);
    if (/Icon$/.test(option) && row.values.includes('{')) return iconRows(option);
    if (option === 'fisheye') return fisheyeRows(option);
    if (option === 'viewport') return viewportRows(option);
    if (option === 'tooltip') return echartsTooltipRows(option);
    if (option.endsWith('.tooltip')) return cursorTooltipRows(option);
    if (isObjectArrayOption(row.values)) {
      const arrayObjectRows = objectArrayRows(optionCase, row);
      if (arrayObjectRows.length) return arrayObjectRows;
    }
    if (option === 'cursor') return cursorRows(option);
    if (option === 'grid') return gridRows(row);
    if (/Axis$/.test(option)) return axisRows(option, row);
    if (isLabelOption(option)) return labelRows(option, row.values);
    if (isLayoutOption(optionCase, option)) return layoutRowsFor(optionCase, option);
    if (row.values.startsWith('Object:')) return parseObjectRows(option, row.values);
    if (isLineStyleOption(option)) return lineStyleRows(option);
    if (isTextStyleOption(option)) return textStyleRows(option);
    if (isItemStyleOption(option)) return itemStyleRows(option, row.values);

    return [];
  }

  function splitAliasRows(options) {
    return options.flatMap((option) => {
      if (!option.option.includes(' / ')) return [option];

      const aliases = option.option.split(/\s+\/\s+/);
      return aliases.map((alias, index) => ({
        ...option,
        option: alias,
        level: alias.includes('.') ? alias.split('.').length - 1 : option.level,
        description: createAliasDescription(option.description, alias, aliases, index)
      }));
    });
  }

  function createAliasDescription(description, alias, aliases, index) {
    const otherAliases = aliases.filter((item) => item !== alias);
    const sameEffect = `Same effect as ${formatAliasList(index === 0 ? otherAliases : [aliases[0]])}.`;
    return index === 0
      ? `${description} ${sameEffect}`
      : `${sameEffect} ${description}`;
  }

  function formatAliasList(aliases) {
    if (aliases.length <= 1) return aliases[0] || '';
    return aliases.slice(0, -1).join(', ') + `, and ${aliases[aliases.length - 1]}`;
  }

  function isLabelOption(option) {
    return option === 'label'
      || option.endsWith('Label')
      || option.endsWith('.label')
      || option.endsWith('.participantLabel')
      || option.endsWith('.titleLabel')
      || option.endsWith('.remainingLabel')
      || option.endsWith('.updatedLabel')
      || option.endsWith('.eventLabel');
  }

  function isLineStyleOption(option) {
    return option === 'lineStyle'
      || option === 'edgeStyle'
      || option.endsWith('LineStyle')
      || option.endsWith('Style') && /line|stem|whisker|median|cap|baseline|swr/i.test(option)
      || option.endsWith('.lineStyle')
      || option.endsWith('.circleStyle')
      || option.endsWith('.curveStyle');
  }

  function isTextStyleOption(option) {
    return option.endsWith('.nameTextStyle');
  }

  function isItemStyleOption(option) {
    return option === 'itemStyle'
      || option.endsWith('Style')
      || option.endsWith('.itemStyle');
  }

  function isLayoutOption(optionCase, option) {
    return option === 'layout' || option === 'layoutOptions'
      ? ['echarts-pack-bubble', 'echarts-circle-packing', 'echarts-vector-field', 'echarts-venn'].includes(optionCase.packageName)
      : false;
  }

  function summarizeObjectValue(values) {
    if (values.startsWith('Object:')) return 'Object';
    return values
      .replace(/\{[^}]*\}/g, 'object')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function isObjectArrayOption(values) {
    return /\bArray<[^>]*(?:object|\{)/i.test(values);
  }

  function objectArrayRows(optionCase, row) {
    const specs = [
      ...parseExplicitObjectArrayFields(row.values),
      ...parseTupleFieldNames(row.values),
      ...fieldOptionSpecs(optionCase, row),
      ...descriptionFieldSpecs(row.description),
      ...fallbackObjectArraySpecs(row)
    ];
    const uniqueSpecs = uniqueFieldSpecs(specs);
    return childRows(row.option, uniqueSpecs.map((spec) => [
      spec.name,
      describeRecordField(spec),
      spec.values || inferRecordFieldValue(spec.name)
    ]));
  }

  function parseExplicitObjectArrayFields(values) {
    const match = values.match(/Array<\{\s*([^}]*)\s*\}>/i);
    if (!match) return [];
    return match[1].split(',').map(normalizeFieldSpec).filter(Boolean);
  }

  function parseTupleFieldNames(values) {
    const matches = Array.from(values.matchAll(/\[([A-Za-z_][A-Za-z0-9_]*(?:\s*,\s*[A-Za-z_][A-Za-z0-9_]*)+)\]/g));
    return matches.flatMap((match) => {
      const fields = match[1].split(',').map((field) => field.trim());
      if (fields.every(isTypeName)) return [];
      return fields.map(normalizeFieldSpec).filter(Boolean);
    });
  }

  function fieldOptionSpecs(optionCase, row) {
    if (!/^(data|nodes|routes|categories|causes)$/.test(row.option)) return [];
    return optionCase.options
      .filter((option) => /^[A-Za-z0-9]+Field$/.test(option.option))
      .map((option) => normalizeFieldSpec(option.option.replace(/Field$/, '')))
      .filter(Boolean);
  }

  function descriptionFieldSpecs(description) {
    const match = description.match(/\b(?:include|includes|use|uses|provide|provides)\s+([^.;]+?)\s+fields?\b/i);
    if (!match) return [];
    return fieldListSpecs(match[1]);
  }

  function fallbackObjectArraySpecs(row) {
    if (/hierarchical/i.test(row.description)) return fieldListSpecs('name, value, children');
    if (/route records/i.test(row.description)) return fieldListSpecs('name, stations, segments, waypoints');
    return [];
  }

  function fieldListSpecs(value) {
    return value
      .replace(/\bmay\b|\bcan\b|\bplus\b/gi, ' ')
      .replace(/\boptional\s+([A-Za-z_][A-Za-z0-9_]*)/gi, '$1?')
      .replace(/\bor\b|\band\b/gi, ',')
      .split(/[,\s/]+/)
      .map((field) => field.trim())
      .filter(Boolean)
      .map(normalizeFieldSpec)
      .filter(Boolean);
  }

  function normalizeFieldSpec(rawField) {
    const cleanField = rawField.trim().replace(/[.:;]+$/, '');
    const match = cleanField.match(/^([A-Za-z_][A-Za-z0-9_]*)(\?)?(?::\s*(.+))?$/);
    if (!match || isTypeName(match[1])) return null;
    const name = lowerFirst(match[1]);
    return {
      name,
      optional: Boolean(match[2]) || /^optional/i.test(cleanField),
      values: match[3] ? match[3].trim() : ''
    };
  }

  function uniqueFieldSpecs(specs) {
    const seen = new Set();
    return specs.filter((spec) => {
      if (!spec || seen.has(spec.name)) return false;
      seen.add(spec.name);
      return true;
    });
  }

  function describeRecordField(spec) {
    const descriptions = {
      id: 'Record id.',
      parentId: 'Parent record id.',
      source: 'Source node id or name.',
      target: 'Target node id or name.',
      from: 'Source participant or item id.',
      to: 'Target participant or item id.',
      name: 'Display name.',
      text: 'Displayed text.',
      type: 'Record type.',
      category: 'Category name or id.',
      x: 'X coordinate or category.',
      y: 'Y coordinate or category.',
      u: 'Horizontal vector component.',
      v: 'Vertical vector component.',
      value: 'Numeric value.',
      min: 'Minimum value.',
      max: 'Maximum value.',
      q1: 'First quartile value.',
      median: 'Median value.',
      q3: 'Third quartile value.',
      children: 'Child records.',
      sets: 'Set names used by this item.',
      stations: 'Route station records.',
      segments: 'Route segment records.',
      waypoints: 'Route waypoint records.',
      itemStyle: 'Per-record item style.',
      label: 'Per-record label style.',
      size: 'Per-record size.'
    };
    const description = descriptions[spec.name] || `${humanizeFieldName(spec.name)} field.`;
    return spec.optional ? `Optional ${lowerFirst(description)}` : description;
  }

  function inferRecordFieldValue(field) {
    if (/^(value|min|max|q1|median|q3|x|y|u|v|size|resistance|reactance|gammaReal|gammaImag)$/i.test(field)) {
      return 'number';
    }
    if (/^sets$/i.test(field)) return 'string[]';
    if (/^(children|stations|segments|waypoints)$/i.test(field)) return 'Array<object>';
    if (/^(itemStyle|label|style)$/i.test(field)) return 'Object';
    if (/^(id|parentId|source|target|from|to|category|name|type|text|gamma)$/i.test(field)) {
      return 'string | number';
    }
    return 'unknown';
  }

  function isTypeName(value) {
    return /^(string|number|boolean|object|array|unknown|null|undefined|date)$/i.test(value);
  }

  function lowerFirst(value) {
    return value ? value.charAt(0).toLowerCase() + value.slice(1) : value;
  }

  function humanizeFieldName(field) {
    return field.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase();
  }

  function paddingRows(parent) {
    return childRows(parent, [
      ['top', 'Top inset.', 'number'],
      ['right', 'Right inset.', 'number'],
      ['bottom', 'Bottom inset.', 'number'],
      ['left', 'Left inset.', 'number']
    ]);
  }

  function animationRows(parent) {
    return childRows(parent, [
      ['show', 'Shows the animation when true.', 'boolean'],
      ['enabled', 'Enables the animation when true.', 'boolean'],
      ['duration', 'Animation duration.', 'number | function'],
      ['delay', 'Delay before the animation starts.', 'number | function'],
      ['stagger', 'Delay added between items.', 'number | function'],
      ['easing', 'Animation easing name.', 'string']
    ]);
  }

  function fisheyeRows(parent) {
    return childRows(parent, [
      ['show', 'Shows and enables the magnifier when true.', 'boolean'],
      ['radius', 'Lens radius around the pointer.', VALUES.pixelOrPercent],
      ['scale', 'Magnification factor at the lens center.', 'number'],
      ['labelScale', 'Label magnification factor near the lens center.', 'number'],
      ['stroke', 'Lens outline color.', 'string'],
      ['strokeWidth', 'Lens outline width.', 'number'],
      ['opacity', 'Lens outline opacity.', 'number'],
      ['preview', 'Runs an initial preview pulse when available.', 'boolean']
    ]);
  }

  function viewportRows(parent) {
    return childRows(parent, [
      ['center', 'Fractal-plane center point.', '[number, number]'],
      ['viewWidth', 'Width of the visible fractal plane.', 'number'],
      ['scale', 'Viewport scale multiplier.', 'number'],
      ['zoom', 'Current zoom value.', 'number']
    ]);
  }

  function echartsTooltipRows(parent) {
    return childRows(parent, [
      ['trigger', 'ECharts tooltip trigger mode.', 'string']
    ]);
  }

  function cursorTooltipRows(parent) {
    return childRows(parent, [
      ['show', 'Shows this tooltip when true.', 'boolean'],
      ['backgroundColor', 'Tooltip background color.', 'string'],
      ['color', 'Tooltip text color.', 'string'],
      ['fontSize', 'Tooltip text size.', 'number'],
      ['lineHeight', 'Tooltip line height.', 'number'],
      ['padding', 'Tooltip padding.', 'number | [number, number] | [number, number, number, number]'],
      ['borderRadius', 'Tooltip corner radius.', 'number'],
      ['borderColor', 'Tooltip border color.', 'string'],
      ['borderWidth', 'Tooltip border width.', 'number'],
      ['opacity', 'Tooltip opacity.', 'number'],
      ['fontFamily', 'Tooltip font family.', 'string']
    ]);
  }

  function cursorRows(parent) {
    return [
      ...childRows(parent, [
        ['show', 'Shows the interactive cursor when true.', 'boolean'],
        ['lineStyle', 'Styles cursor guide lines.', 'Object'],
        ['circleStyle', 'Styles cursor circles.', 'Object'],
        ['curveStyle', 'Styles cursor curves.', 'Object'],
        ['tooltip', 'Styles the cursor tooltip.', 'Object']
      ]),
      ...lineStyleRows(`${parent}.lineStyle`, 2),
      ...lineStyleRows(`${parent}.circleStyle`, 2),
      ...lineStyleRows(`${parent}.curveStyle`, 2),
      ...cursorTooltipRows(`${parent}.tooltip`).map((row) => ({ ...row, level: 2 }))
    ];
  }

  function gridRows(row) {
    if (row.values.includes('unitCircle')) {
      return [
        ...childRows('grid', [
          ['show', 'Shows the Smith chart grid when true.', 'boolean'],
          ['unitCircle', 'Styles the unit circle grid line.', 'Object'],
          ['axisLine', 'Styles the horizontal axis line.', 'Object'],
          ['resistanceLine', 'Styles resistance grid circles.', 'Object'],
          ['reactanceLine', 'Styles reactance grid arcs.', 'Object'],
          ['label', 'Styles grid labels.', 'Object']
        ]),
        ...gridLineRows('grid.unitCircle', 2),
        ...gridLineRows('grid.axisLine', 2),
        ...gridLineRows('grid.resistanceLine', 2),
        ...gridLineRows('grid.reactanceLine', 2),
        ...smithGridLabelRows('grid.label', 2)
      ];
    }
    return childRows('grid', [
      ['show', 'Shows the grid when true.', 'boolean']
    ]);
  }

  function gridLineRows(parent, level) {
    return [
      ...childRows(parent, [
        ['show', 'Shows this grid line group when true.', 'boolean'],
        ['lineStyle', 'Styles this grid line group.', 'Object']
      ], level),
      ...lineStyleRows(`${parent}.lineStyle`, level + 1)
    ];
  }

  function smithGridLabelRows(parent, level) {
    return childRows(parent, [
      ['show', 'Shows Smith grid labels when true.', 'boolean'],
      ['color', 'Grid label text color.', 'string'],
      ['fontSize', 'Grid label text size.', 'number'],
      ['formatter', 'Formats all grid labels.', VALUES.formatter],
      ['resistanceFormatter', 'Formats resistance labels.', VALUES.formatter],
      ['reactanceFormatter', 'Formats reactance labels.', VALUES.formatter]
    ], level);
  }

  function axisRows(parent, row) {
    const hasAxisLine = row.values.includes('axisLine');
    const hasName = row.values.includes('name');
    const rows = childRows(parent, [
      ['show', 'Shows the axis when true.', 'boolean'],
      ...(hasName ? [['name', 'Axis title text.', 'string']] : []),
      ['label', 'Styles axis labels.', 'Object'],
      ['splitLine', 'Controls split lines.', 'Object'],
      ...(hasAxisLine ? [['axisLine', 'Controls the axis baseline.', 'Object']] : []),
      ...(hasName ? [['nameTextStyle', 'Styles the axis title.', 'Object']] : [])
    ]);

    return [
      ...rows,
      ...axisLabelRows(`${parent}.label`, 2),
      ...splitLineRows(`${parent}.splitLine`, 2),
      ...(hasAxisLine ? axisLineRows(`${parent}.axisLine`, 2) : []),
      ...(hasName ? textStyleRows(`${parent}.nameTextStyle`, 2) : [])
    ];
  }

  function axisLabelRows(parent, level) {
    return childRows(parent, [
      ['show', 'Shows axis labels when true.', 'boolean'],
      ['color', 'Axis label text color.', 'string'],
      ['fontSize', 'Axis label text size.', 'number'],
      ['fontWeight', 'Axis label font weight.', 'string | number'],
      ['rotate', 'Axis label rotation.', "number | boolean | 'tangential'"],
      ['formatter', 'Formats axis label text.', VALUES.formatter]
    ], level);
  }

  function splitLineRows(parent, level) {
    return [
      ...childRows(parent, [
        ['show', 'Shows split lines when true.', 'boolean'],
        ['lineStyle', 'Styles split lines.', 'Object']
      ], level),
      ...lineStyleRows(`${parent}.lineStyle`, level + 1)
    ];
  }

  function axisLineRows(parent, level) {
    return [
      ...childRows(parent, [
        ['show', 'Shows the axis baseline when true.', 'boolean'],
        ['lineStyle', 'Styles the axis baseline.', 'Object']
      ], level),
      ...lineStyleRows(`${parent}.lineStyle`, level + 1)
    ];
  }

  function labelRows(parent, values, level = 1) {
    const rows = [
      ['show', 'Shows labels when true.', 'boolean'],
      ['color', 'Label text color.', 'string'],
      ['fontSize', 'Label text size.', 'number'],
      ['fontWeight', 'Label font weight.', 'string | number'],
      ['formatter', 'Formats label text.', VALUES.formatter]
    ];
    if (values.includes('position')) rows.splice(1, 0, ['position', 'Label position.', extractFieldValue(values, 'position') || 'string']);
    if (values.includes('offset')) rows.push(['offset', 'Distance between label and target element.', 'number']);
    if (values.includes('rotate')) rows.push(['rotate', 'Label rotation.', "number | boolean | 'tangential'"]);
    if (values.includes('lineHeight')) rows.push(['lineHeight', 'Label line height.', 'number']);
    if (values.includes('minRadius')) rows.push(['minRadius', 'Minimum radius required before the label is shown.', 'number']);
    if (values.includes('showInternal')) rows.push(['showInternal', 'Shows labels for internal hierarchy cells when true.', 'boolean']);
    if (values.includes('minArea')) rows.push(['minArea', 'Minimum cell area required before the label is shown.', 'number']);
    return childRows(parent, rows, level);
  }

  function lineStyleRows(parent, level = 1) {
    return childRows(parent, [
      ['show', 'Shows this line group when true.', 'boolean'],
      ['color', 'Line color.', 'string'],
      ['stroke', 'Alias for line color.', 'string'],
      ['width', 'Line width.', 'number'],
      ['lineWidth', 'Alias for line width.', 'number'],
      ['opacity', 'Line opacity.', 'number'],
      ['type', 'Line dash style.', "'solid' | 'dashed' | 'dotted' | number[] | string"],
      ['dashOffset', 'Dash pattern offset.', 'number'],
      ['lineDashOffset', 'Alias for dash pattern offset.', 'number'],
      ['cornerRadius', 'Corner radius for routed lines.', 'number'],
      ['cap', 'Line cap style.', "'round' | 'butt' | 'square'"],
      ['join', 'Line join style.', "'round' | 'bevel' | 'miter'"],
      ['dashArray', 'Dash pattern.', 'number[] | string'],
      ['lineDash', 'Dash pattern alias.', 'number[]']
    ], level);
  }

  function textStyleRows(parent, level = 1) {
    return childRows(parent, [
      ['color', 'Text color.', 'string'],
      ['fontSize', 'Text size.', 'number'],
      ['fontWeight', 'Text font weight.', 'string | number']
    ], level);
  }

  function itemStyleRows(parent, values, level = 1) {
    return childRows(parent, [
      ...(values.includes('show boolean') ? [['show', 'Shows this visual element when true.', 'boolean']] : []),
      ['color', 'Fill color.', 'string'],
      ['fill', 'Alias for fill color.', 'string'],
      ['opacity', 'Fill opacity.', 'number'],
      ['borderColor', 'Border color.', 'string'],
      ['borderWidth', 'Border width.', 'number'],
      ['borderRadius', 'Corner radius.', 'number'],
      ['shadowBlur', 'Shadow blur radius.', 'number'],
      ['shadowColor', 'Shadow color.', 'string'],
      ['lineWidth', 'Stroke width used by icon or shape styles.', 'number']
    ], level);
  }

  function iconRows(parent) {
    return [
      ...childRows(parent, [
        ['path', 'Vector path for the icon.', 'string'],
        ['image', 'Image URL for the icon.', 'string'],
        ['size', 'Icon size.', 'number | [number, number]'],
        ['width', 'Icon width.', 'number'],
        ['height', 'Icon height.', 'number'],
        ['offset', 'Icon offset.', '[number, number]'],
        ['offsetX', 'Horizontal icon offset.', 'number'],
        ['offsetY', 'Vertical icon offset.', 'number'],
        ['style', 'Styles the icon graphic.', 'Object']
      ]),
      ...childRows(`${parent}.style`, [
        ['fill', 'Icon fill color.', 'string'],
        ['stroke', 'Icon stroke color.', 'string'],
        ['lineWidth', 'Icon stroke width.', 'number'],
        ['opacity', 'Icon opacity.', 'number']
      ], 2)
    ];
  }

  function layoutRowsFor(optionCase, parent) {
    if (optionCase.packageName === 'echarts-pack-bubble') {
      return childRows(parent, [
        ['padding', 'Inset around the packed bubbles.', VALUES.padding],
        ['gap', 'Space between packed bubbles.', 'number'],
        ['fast', 'Uses the fast layout path when true.', 'boolean'],
        ['fastThreshold', 'Item count threshold for the fast layout path.', 'number'],
        ['minRadius', 'Smallest bubble radius.', 'number'],
        ['maxRadius', 'Largest bubble radius.', 'number'],
        ['fillRatio', 'How densely bubbles fill the available area.', 'number'],
        ['center', 'Center point for the layout.', VALUES.center],
        ['sort', 'Sorts bubbles before layout.', "boolean | 'asc' | 'desc' | 'none'"]
      ]);
    }
    if (optionCase.packageName === 'echarts-circle-packing') {
      return childRows(parent, [
        ['rootName', 'Display name for an implicit root node.', 'string'],
        ['rootVisible', 'Shows the root circle when true.', 'boolean'],
        ['padding', 'Inset around the hierarchy.', VALUES.padding],
        ['nodePadding', 'Padding inside parent circles.', 'number'],
        ['siblingGap', 'Space between sibling circles.', 'number'],
        ['center', 'Center point of the packed hierarchy.', VALUES.center],
        ['radius', 'Outer radius of the packed hierarchy.', VALUES.pixelOrPercent],
        ['valueField', 'Field used for circle size.', 'string'],
        ['nameField', 'Field used for labels and names.', 'string'],
        ['childrenField', 'Field containing child nodes.', 'string'],
        ['sort', 'Sorts hierarchy nodes before layout.', "boolean | 'none' | 'value' | 'name' | 'asc' | 'desc'"]
      ]);
    }
    if (optionCase.packageName === 'echarts-vector-field') {
      return childRows(parent, [
        ['xExtent', 'Explicit x-coordinate domain.', '[number, number]'],
        ['yExtent', 'Explicit y-coordinate domain.', '[number, number]'],
        ['xField', 'Field used for x coordinates.', 'string'],
        ['yField', 'Field used for y coordinates.', 'string'],
        ['uField', 'Field used for horizontal vector components.', 'string'],
        ['vField', 'Field used for vertical vector components.', 'string'],
        ['invertY', 'Flips y values for north-up coordinate rendering.', 'boolean'],
        ['samplingStep', 'Renders every nth vector for dense data.', 'number'],
        ['minLength', 'Minimum arrow length after scaling.', 'number'],
        ['maxLength', 'Maximum arrow length after scaling.', 'number | null'],
        ['lengthScale', 'Multiplier from vector magnitude to arrow length.', 'number | null'],
        ['arrowHeadLength', 'Length of arrow heads.', 'number | null'],
        ['arrowHeadAngle', 'Angle of arrow heads.', 'number | null (radians)']
      ]);
    }
    if (optionCase.packageName === 'echarts-venn' && parent === 'layoutOptions') {
      return childRows(parent, [
        ['padding', 'Inset around the Venn layout.', 'number'],
        ['minRadius', 'Smallest circle radius.', 'number'],
        ['maxRadius', 'Largest circle radius.', 'number']
      ]);
    }
    return [];
  }

  function parseObjectRows(parent, values) {
    const rawFields = values.replace(/^Object:\s*/, '').split(',').map((item) => item.trim()).filter(Boolean);
    const parsedRows = [];
    rawFields.forEach((field) => {
      const match = field.match(/^([A-Za-z0-9_/]+)(?:\s+(.+))?$/);
      if (!match) return;
      const names = match[1].split('/');
      const value = match[2] || 'Object';
      names.forEach((name) => {
        parsedRows.push([name, describeNestedField(name), value]);
      });
    });
    return childRows(parent, parsedRows);
  }

  function childRows(parent, fields, level = 1) {
    return fields.map(([field, description, values]) => ({
      option: `${parent}.${field}`,
      description,
      values,
      level
    }));
  }

  function describeNestedField(field) {
    const descriptions = {
      show: 'Shows this nested element when true.',
      enabled: 'Enables this nested feature when true.',
      color: 'Primary color.',
      fill: 'Fill color.',
      stroke: 'Stroke color.',
      opacity: 'Opacity.',
      borderColor: 'Border color.',
      borderWidth: 'Border width.',
      borderRadius: 'Corner radius.',
      shadowBlur: 'Shadow blur radius.',
      shadowColor: 'Shadow color.',
      width: 'Width value.',
      lineWidth: 'Line width.',
      type: 'Line or item type.',
      formatter: 'Formats displayed text.',
      label: 'Nested label option.',
      lineStyle: 'Nested line style option.',
      itemStyle: 'Nested item style option.',
      nameTextStyle: 'Nested name text style option.',
      splitLine: 'Nested split-line option.',
      axisLine: 'Nested axis-line option.',
      padding: 'Nested padding option.',
      center: 'Nested center point.',
      sort: 'Nested sort behavior.'
    };
    return descriptions[field] || `Nested ${field} option.`;
  }

  function extractFieldValue(values, field) {
    const match = values.match(new RegExp(`${field}\\\\s+([^,]+)`));
    return match ? match[1].trim() : '';
  }

  function graphReference(packageName, title, type, href, layoutRows) {
    return {
      id: packageName,
      packageName,
      title,
      links: [{ href, label: 'Example' }],
      options: [
        ...seriesCoreRows(type),
        ...rows([
          ['data / nodes', 'Graph nodes. Each node may include id, name, value, itemStyle, label, x, y, or size fields.', 'Array<object | unknown[]>'],
          ['links / edges', 'Graph connections. Each link connects source and target node ids or names.', 'Array<{ source, target }>'],
          ['symbolSize', 'Node size. When omitted, numeric value can be used to infer size.', 'number | number[] | function'],
          ['center', 'Series center point inside the chart rectangle.', VALUES.center],
          ['layout', 'Nested graph layout options.', 'Object'],
          ['layoutOptions', 'Alias for nested graph layout options.', 'Object']
        ]),
        ...layoutRows,
        ...rows([
          ['itemStyle', 'Styles graph nodes.', VALUES.itemStyle],
          ['edgeStyle', 'Styles graph edges.', VALUES.lineStyle],
          ['label', 'Styles graph node labels.', `${VALUES.label}, position 'top' | 'bottom' | 'left' | 'right', offset number`],
          ['emphasis', 'Styles nodes and edges while hovered.', VALUES.emphasis],
          ['enterAnimation', 'Animates nodes into place.', VALUES.enterAnimation],
          ['edgeAnimation', 'Animates edge drawing.', VALUES.enterAnimation],
          ['fisheye', 'Configures the built-in pointer magnifier for this graph series.', 'false | { show, radius, scale, labelScale, stroke, strokeWidth, opacity, preview }'],
          ['layoutAnimation', 'ECharts layout animation flag for the registered series.', VALUES.boolean]
        ])
      ]
    };
  }

  function seriesCoreRows(type) {
    return rows([
      ['type', 'Registers this package series with ECharts.', `'${type}'`],
      ['silent', 'Disables mouse events for the series when true.', VALUES.boolean],
      ['width', 'Series box width.', VALUES.pixelOrPercent],
      ['height', 'Series box height.', VALUES.pixelOrPercent],
      ['top', 'Distance from the top of the chart container.', VALUES.pixelOrPercent],
      ['right', 'Distance from the right of the chart container.', VALUES.pixelOrPercent],
      ['bottom', 'Distance from the bottom of the chart container.', VALUES.pixelOrPercent],
      ['left', 'Distance from the left of the chart container.', VALUES.pixelOrPercent]
    ]);
  }

  function radialLayoutRows() {
    return layoutAliasRows([
      ['focusNode', 'Node id or name placed at the radial center.', 'string | number'],
      ['unitRadius', 'Distance between graph levels.', 'number'],
      ['linkDistance', 'Target edge length used during layout.', 'number'],
      ['strictRadial', 'Keeps nodes on exact radial rings.', VALUES.boolean],
      ['fast', 'Uses the faster radial placement path.', VALUES.boolean, { layoutOnly: true }],
      ['preventOverlap', 'Separates crowded radial nodes.', VALUES.boolean],
      ['preventOverlapPadding', 'Extra gap for overlap prevention.', 'number'],
      ['maxIteration', 'Maximum radial refinement iterations.', 'number'],
      ['maxPreventOverlapIteration', 'Maximum overlap-prevention iterations.', 'number'],
      ['sortBy', 'Sorts nodes on each ring.', "string | function; common values include 'data' and 'degree'"],
      ['sortStrength', 'Weight applied when sorted nodes share a ring.', 'number'],
      ['startAngle', 'Starting angle for fast radial placement.', 'number (radians)'],
      ['clockwise', 'Places fast radial nodes clockwise when true.', VALUES.boolean],
      ['sweep', 'Angular sweep used for ring placement.', 'number (radians)'],
      ['nodeSize', 'Node size used by layout spacing.', 'number | number[] | function'],
      ['nodeSpacing', 'Extra node spacing used by overlap prevention.', 'number | function']
    ]);
  }

  function concentricLayoutRows() {
    return layoutAliasRows([
      ['sortBy', 'Ranks nodes before assigning concentric levels.', "string | function; default 'degree'"],
      ['maxLevelDiff', 'Maximum rank difference before starting a new ring.', 'number'],
      ['preventOverlap', 'Expands rings so nodes do not overlap.', VALUES.boolean],
      ['equidistant', 'Forces every ring gap to be equal.', VALUES.boolean],
      ['sweep', 'Angular sweep used for each ring.', 'number (radians)'],
      ['startAngle', 'Starting angle for the first node on a ring.', 'number (radians)'],
      ['clockwise', 'Places nodes clockwise when true.', VALUES.boolean],
      ['nodeSize', 'Node size used by ring spacing.', 'number | number[] | function'],
      ['nodeSpacing', 'Extra node spacing used by ring spacing.', 'number | function']
    ]);
  }

  function gridLayoutRows() {
    return layoutAliasRows([
      ['rows', 'Requested grid row count.', 'number'],
      ['cols', 'Requested grid column count.', 'number'],
      ['begin', 'Top-left origin of the grid.', '[number | string, number | string]'],
      ['condense', 'Lets grid cells shrink to fit the node sizes.', VALUES.boolean],
      ['position', 'Pins a node to a row and column.', 'function(node) => { row, col }'],
      ['sortBy', 'Sorts nodes before filling free cells.', "string | function; common values include 'data' and 'degree'"],
      ['nodeSize', 'Node size used to calculate cell size.', 'number | number[] | function'],
      ['nodeSpacing', 'Extra node spacing used by the grid.', 'number | function'],
      ['preventOverlap', 'Increases cell size to avoid overlap.', VALUES.boolean],
      ['preventOverlapPadding', 'Extra gap for overlap prevention.', 'number']
    ]);
  }

  function mdsLayoutRows() {
    return layoutAliasRows([
      ['linkDistance', 'Distance represented by one graph step.', 'number'],
      ['preventOverlap', 'Separates nodes after MDS placement.', VALUES.boolean],
      ['maxPreventOverlapIteration', 'Maximum overlap-prevention iterations.', 'number'],
      ['nodeSize', 'Node size used by overlap prevention.', 'number | number[] | function'],
      ['nodeSpacing', 'Extra node spacing used by overlap prevention.', 'number | function']
    ]);
  }

  function arcLayoutRows() {
    return [
      ...layoutAliasRows([
        ['nodeSep', 'Horizontal gap between arc nodes.', 'number'],
        ['nodeSize', 'Node size used by arc spacing.', 'number | number[] | function']
      ]),
      ...rows([
      ['center', 'Center of the arc node row when a viewport is supplied.', VALUES.center]
      ])
    ];
  }

  function layoutAliasRows(items) {
    const layoutRows = [];
    const topLevelRows = [];
    items.forEach(([field, description, values, options = {}]) => {
      layoutRows.push({
        option: `layout.${field}`,
        description: options.layoutOnly ? description : `${description} Same effect as ${field}.`,
        values,
        level: 1
      });
      if (!options.layoutOnly) {
        topLevelRows.push({
          option: field,
          description: `Same effect as layout.${field}. ${description}`,
          values
        });
      }
    });
    return [...layoutRows, ...topLevelRows];
  }

  function rows(items) {
    return items.map(([option, description, values]) => ({
      option,
      description,
      values
    }));
  }

  function axisValues(name) {
    return `Object: show boolean, ${name} label object, splitLine object`;
  }

  function packBubbleLayoutValues() {
    return 'Object: padding, gap, fast, fastThreshold, minRadius, maxRadius, fillRatio, center, sort';
  }
})();
