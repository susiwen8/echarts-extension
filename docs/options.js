(function () {
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
          ['options.width', 'Layout viewport width.', 'number'],
          ['options.height', 'Layout viewport height.', 'number'],
          ['options.center', 'Layout center point inside the viewport.', VALUES.center],
          ['options.nodeSize', 'Node diameter used by layout spacing and overlap prevention.', 'number | number[] | function'],
          ['options.nodeSpacing', 'Extra spacing around each node.', 'number | function'],
          ['options.preventOverlap', 'Separates nodes when a layout can otherwise place them too close.', VALUES.boolean],
          ['options.preventOverlapPadding', 'Extra gap used during overlap prevention.', 'number'],
          ['options.sortBy', 'Sorts nodes before layouts that use ordering.', 'string | function'],
          ['options.linkDistance', 'Target distance between connected nodes.', 'number'],
          ['options.focusNode', 'Node id or name used as the radial center.', 'string | number'],
          ['options.unitRadius', 'Distance between radial graph levels.', 'number'],
          ['options.strictRadial', 'Keeps radial nodes on strict level rings.', VALUES.boolean],
          ['options.maxIteration', 'Maximum layout iterations for radial refinement.', 'number'],
          ['options.maxPreventOverlapIteration', 'Maximum iterations used by overlap prevention.', 'number'],
          ['options.sortStrength', 'Weight applied when sorted radial nodes share a ring.', 'number'],
          ['options.maxLevelDiff', 'Maximum score difference before concentric nodes move to a new level.', 'number'],
          ['options.sweep', 'Angular span used by radial or concentric placement.', 'number (radians)'],
          ['options.equidistant', 'Forces concentric levels to use equal ring spacing.', VALUES.boolean],
          ['options.startAngle', 'Starting angle for circular layouts.', 'number (radians)'],
          ['options.clockwise', 'Places circular nodes clockwise when true.', VALUES.boolean],
          ['options.rows', 'Requested row count for grid layout.', 'number'],
          ['options.cols', 'Requested column count for grid layout.', 'number'],
          ['options.begin', 'Top-left starting point for grid layout.', '[number | string, number | string]'],
          ['options.condense', 'Lets grid cells shrink to the minimum size needed by nodes.', VALUES.boolean],
          ['options.position', 'Pins grid nodes to explicit row and column cells.', 'function(node) => { row, col }'],
          ['options.nodeSep', 'Horizontal gap between nodes in arc layout.', 'number']
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

    initializeOptionSearch();
  }

  function createNavLink(optionCase) {
    const link = document.createElement('a');
    link.href = `#${optionCase.id}`;
    link.dataset.optionTarget = optionCase.id;
    link.textContent = optionCase.title;
    return link;
  }

  function createOptionCard(optionCase) {
    const article = document.createElement('article');
    article.className = 'option-card';
    article.id = optionCase.id;
    article.dataset.searchText = normalizeSearchText(`${optionCase.title} ${optionCase.packageName}`);

    const header = document.createElement('header');
    header.className = 'option-card__header';

    const titleBlock = document.createElement('div');
    const title = document.createElement('h2');
    title.textContent = optionCase.title;

    const meta = document.createElement('div');
    meta.className = 'option-card__meta';
    const packageName = document.createElement('span');
    packageName.textContent = optionCase.packageName;
    const count = document.createElement('span');
    count.textContent = `${optionCase.options.length} options`;
    meta.append(packageName, count);
    optionCase.links.forEach((linkInfo) => {
      const example = document.createElement('a');
      example.href = linkInfo.href;
      example.textContent = linkInfo.label;
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
    ['Option', 'Description', 'Values'].forEach((label) => {
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
    tr.dataset.searchText = normalizeSearchText(`${option.option} ${option.description} ${option.values}`);
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
      toggle.setAttribute('aria-label', `Expand ${option.option} options`);
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
    descriptionCell.textContent = option.description;

    const valuesCell = document.createElement('td');
    valuesCell.className = 'option-table__values';
    valuesCell.textContent = option.values;

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
    toggle.setAttribute('aria-label', `${expanded ? 'Collapse' : 'Expand'} ${row.dataset.optionName} options`);
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

  function applyOptionSearch(rawQuery) {
    const query = normalizeSearchText(rawQuery);
    const searching = Boolean(query);
    const cards = Array.from(document.querySelectorAll('.option-card'));
    let visibleCards = 0;
    let directMatches = 0;
    let packageMatches = 0;

    document.body.classList.toggle('options-page--searching', searching);

    cards.forEach((card) => {
      const stats = searching ? filterOptionCard(card, query) : restoreOptionCard(card);
      visibleCards += stats.visible ? 1 : 0;
      directMatches += stats.matches;
      packageMatches += stats.packageMatch ? 1 : 0;
      const navLink = document.querySelector(`[data-option-target="${card.id}"]`);
      if (navLink) navLink.hidden = !stats.visible;
    });

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
    card.hidden = !visible;
    return { visible, matches: matchIndexes.size, packageMatch };
  }

  function restoreOptionCard(card) {
    const rows = Array.from(card.querySelectorAll('tbody tr'));
    const rowsByIndex = new Map(rows.map((row) => [row.dataset.optionIndex, row]));

    card.hidden = false;
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
      status.textContent = `${totalCards} packages.`;
      return;
    }
    if (!matches && !visibleCards) {
      status.textContent = 'No matching options.';
      return;
    }
    if (!matches && packageMatches) {
      status.textContent = `${packageMatches} matching ${packageMatches === 1 ? 'package' : 'packages'}.`;
      return;
    }
    status.textContent = `${matches} matching options in ${visibleCards} packages.`;
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
      .replace(/\{[^}]*\}/g, 'Object')
      .replace(/\s+/g, ' ')
      .trim();
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
