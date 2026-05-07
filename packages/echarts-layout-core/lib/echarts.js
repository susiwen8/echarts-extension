import { createArcBezierShape, createArcPath, pathToString } from './arc.js';
import { normalizeGraphData } from './data.js';
import { computeGraphLayout } from './layouts.js';
import { clearAliveRender, renderAlive, setAliveRenderKey } from './render-transition.js';
const layoutOptionKeys = [
    'nodeSep',
    'nodeSize',
    'nodeSpacing',
    'linkDistance',
    'unitRadius',
    'focusNode',
    'preventOverlap',
    'strictRadial',
    'maxIteration',
    'maxPreventOverlapIteration',
    'sortBy',
    'sortStrength',
    'maxLevelDiff',
    'sweep',
    'equidistant',
    'startAngle',
    'clockwise',
    'rows',
    'cols',
    'begin',
    'condense',
    'preventOverlapPadding'
];
const DEFAULT_NODE_SIZE = 20;
const DEFAULT_MIN_VALUE_NODE_SIZE = 10;
const DEFAULT_MAX_VALUE_NODE_SIZE = 32;
const LABEL_COLLISION_PADDING = 2;
const LABEL_VIEWPORT_PADDING = 4;
const GRAPH_HOVER_DIM_OPACITY = 0.12;
const GRAPH_HOVER_LABEL_DIM_OPACITY = 0.18;
const GRAPH_HOVER_ACTIVE_EDGE_OPACITY = 0.96;
const GRAPH_HOVER_EDGE_COLOR = '#1fb6e8';
const GRAPH_HOVER_SHADOW_COLOR = 'rgba(15, 23, 42, 0.24)';
const GRAPH_HOVER_TRANSITION_DURATION = 180;
const GRAPH_HOVER_TRANSITION_EASING = 'cubicOut';
const GRAPH_HOVER_TRANSITION_SCOPE = 'graph-hover';
export function installGraphLayout(echarts, config) {
    const echartsHost = echarts;
    const { chartType, layoutType } = config;
    echartsHost.extendSeriesModel({
        type: `series.${chartType}`,
        visualDrawType: 'fill',
        getInitialData(option) {
            const nodes = Array.isArray(option.nodes) ? option.nodes : Array.isArray(option.data) ? option.data : [];
            const dimensions = echartsHost.helper.createDimensions(nodes, {
                coordDimensions: ['value']
            });
            const list = new echartsHost.List(dimensions, this);
            list.initData(nodes);
            return list;
        },
        defaultOption: createDefaultOption(layoutType)
    });
    echartsHost.extendChartView({
        type: chartType,
        render(seriesModel, ecModel, api) {
            const group = this.group;
            const renderToken = {};
            this.__renderToken = renderToken;
            try {
                const graphOption = readGraphOption(seriesModel);
                const layoutOptions = readLayoutOptions(echartsHost, seriesModel, api, graphOption);
                const viewport = {
                    x: 0,
                    y: 0,
                    width: api.getWidth(),
                    height: api.getHeight()
                };
                const fisheye = readFisheyeOptions(seriesModel, viewport);
                const renderSignature = createGraphRenderSignature(layoutType, seriesModel, layoutOptions, viewport);
                const fisheyeSignature = stableSerialize(fisheye);
                if (this.__graphRenderState && this.__graphRenderSignature === renderSignature) {
                    if (this.__fisheyeSignature !== fisheyeSignature) {
                        updateFisheyeRenderState(echartsHost, group, api, this, this.__graphRenderState, fisheye);
                        this.__fisheyeSignature = fisheyeSignature;
                    }
                    return;
                }
                this.__graphHoverController?.dispose();
                this.__graphHoverController = undefined;
                this.__fisheyeController?.dispose();
                this.__fisheyeController = undefined;
                clearFisheyePreviewTimer(this);
                this.__fisheyeSignature = undefined;
                this.__graphRenderState = undefined;
                this.__graphRenderSignature = undefined;
                const layout = computeGraphLayout(layoutType, graphOption, layoutOptions);
                if (this.__renderToken !== renderToken)
                    return;
                const aliveRender = renderAlive(this, echartsHost, group, seriesModel, (targetGroup, targetSeriesModel) => ({
                    payload: drawGraph(echartsHost, targetGroup, targetSeriesModel, layoutType, layout, viewport, fisheye)
                }));
                if (!aliveRender.payload)
                    return;
                const renderState = mapGraphRenderState(aliveRender.payload, aliveRender.mapElement);
                this.__graphHoverController = installGraphHover(renderState, api);
                this.__graphRenderState = renderState;
                this.__graphRenderSignature = renderSignature;
                this.__fisheyeSignature = fisheyeSignature;
                if (fisheye) {
                    this.__fisheyeController = installFisheye(api, renderState, fisheye);
                    scheduleInitialFisheyePreview(this, renderState, fisheye, readFisheyePreviewDelay(seriesModel, renderState.nodes.length));
                }
            }
            catch (error) {
                this.__fisheyeSignature = undefined;
                this.__graphRenderState = undefined;
                this.__graphRenderSignature = undefined;
                if (typeof console !== 'undefined') {
                    console.error(`[${chartType}] layout failed`, error);
                }
            }
        },
        remove() {
            this.__renderToken = null;
            this.__graphHoverController?.dispose();
            this.__graphHoverController = undefined;
            this.__fisheyeController?.dispose();
            this.__fisheyeController = undefined;
            clearFisheyePreviewTimer(this);
            this.__fisheyeSignature = undefined;
            this.__graphRenderState = undefined;
            this.__graphRenderSignature = undefined;
            clearAliveRender(this);
            this.group.removeAll();
        },
        dispose() {
            this.__renderToken = null;
            this.__graphHoverController?.dispose();
            this.__graphHoverController = undefined;
            this.__fisheyeController?.dispose();
            this.__fisheyeController = undefined;
            clearFisheyePreviewTimer(this);
            this.__fisheyeSignature = undefined;
            this.__graphRenderState = undefined;
            this.__graphRenderSignature = undefined;
            clearAliveRender(this);
            this.group.removeAll();
        }
    });
}
function createDefaultOption(layoutType) {
    return {
        left: 'center',
        top: 'center',
        width: '80%',
        height: '80%',
        symbolSize: null,
        layout: {},
        layoutAnimation: false,
        enterAnimation: true,
        edgeAnimation: null,
        fisheye: {
            show: true,
            radius: null,
            scale: 2.2,
            labelScale: 1.55,
            stroke: 'rgba(17, 24, 39, 0.86)',
            strokeWidth: 3,
            opacity: 0.92
        },
        edgeStyle: {
            color: '#9aa4b2',
            width: 1,
            opacity: layoutType === 'arc' ? 0.55 : 0.45
        },
        itemStyle: {
            color: '#5470c6',
            borderColor: '#fff',
            borderWidth: 1
        },
        label: {
            show: false,
            color: '#1f2937',
            fontSize: 12,
            position: layoutType === 'arc' ? 'bottom' : 'right'
        },
        emphasis: {
            itemStyle: {
                shadowBlur: 8,
                shadowColor: 'rgba(0, 0, 0, 0.2)'
            },
            edgeStyle: {
                opacity: 0.8
            }
        }
    };
}
function readGraphOption(seriesModel) {
    const option = seriesModel.option || {};
    return {
        nodes: Array.isArray(option.nodes) ? option.nodes : Array.isArray(option.data) ? option.data : [],
        edges: Array.isArray(option.edges) ? option.edges : Array.isArray(option.links) ? option.links : []
    };
}
function readLayoutOptions(echarts, seriesModel, api, graphOption) {
    const rect = echarts.helper.getLayoutRect(seriesModel.getBoxLayoutParams(), {
        width: api.getWidth(),
        height: api.getHeight()
    });
    const layoutOptions = {
        ...asRecord(seriesModel.get('layout')),
        ...asRecord(seriesModel.get('layoutOptions'))
    };
    layoutOptionKeys.forEach((key) => {
        const value = seriesModel.get(key);
        if (value !== undefined && value !== null)
            layoutOptions[key] = value;
    });
    if (layoutOptions.nodeSize == null) {
        const symbolSize = seriesModel.get('symbolSize');
        layoutOptions.nodeSize = symbolSize == null
            ? createValueNodeSizeResolver(normalizeGraphData(graphOption).nodes)
            : symbolSize;
    }
    layoutOptions.width = rect.width;
    layoutOptions.height = rect.height;
    layoutOptions.center = resolveCenter(echarts, seriesModel.get('center'), rect);
    return layoutOptions;
}
function resolveCenter(echarts, center, rect) {
    if (!Array.isArray(center)) {
        return [rect.x + rect.width / 2, rect.y + rect.height / 2];
    }
    return [
        rect.x + echarts.number.parsePercent(center[0], rect.width),
        rect.y + echarts.number.parsePercent(center[1], rect.height)
    ];
}
function createGraphRenderSignature(layoutType, seriesModel, layoutOptions, viewport) {
    return stableSerialize({
        layoutType,
        option: omitFisheyeOption(seriesModel.option || {}),
        layoutOptions,
        viewport
    });
}
function omitFisheyeOption(option) {
    const copy = {
        ...option
    };
    delete copy.fisheye;
    return copy;
}
function stableSerialize(value, seen = new WeakSet()) {
    if (value === null)
        return 'null';
    if (typeof value === 'undefined')
        return '"__undefined"';
    if (typeof value === 'string')
        return JSON.stringify(value);
    if (typeof value === 'number' || typeof value === 'boolean')
        return JSON.stringify(value);
    if (typeof value === 'function')
        return JSON.stringify(`__function:${value.toString()}`);
    if (typeof value === 'symbol')
        return JSON.stringify(String(value));
    if (typeof value !== 'object')
        return JSON.stringify(String(value));
    if (seen.has(value))
        return '"__cycle"';
    seen.add(value);
    if (Array.isArray(value)) {
        const serialized = `[${value.map((item) => stableSerialize(item, seen)).join(',')}]`;
        seen.delete(value);
        return serialized;
    }
    const record = value;
    const serialized = `{${Object.keys(record)
        .sort()
        .map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key], seen)}`)
        .join(',')}}`;
    seen.delete(value);
    return serialized;
}
function drawGraph(echarts, group, seriesModel, layoutType, layout, viewport, fisheye) {
    const data = seriesModel.getData();
    const graph = normalizeGraphData(readGraphOption(seriesModel));
    const nodeById = new Map(layout.nodes.map((node) => [node.id, node]));
    const indexById = new Map(graph.nodes.map((node, index) => [node.id, index]));
    const edgeGroup = new echarts.graphic.Group();
    const nodeGroup = new echarts.graphic.Group();
    const labelGroup = new echarts.graphic.Group();
    const edgeCount = layout.edges.length;
    const sequenceEdgesAfterNodes = shouldSequenceEdgesAfterNodes(layoutType);
    const edgeDelayOffset = sequenceEdgesAfterNodes ? readNodeEnterAnimationEnd(seriesModel, graph.nodes.length) : 0;
    const defaultNodeSize = createValueNodeSizeResolver(layout.nodes);
    const renderNodes = [];
    const renderedNodes = [];
    const renderedLabels = [];
    const renderedEdges = [];
    layout.edges.forEach((edge, edgeIndex) => {
        const source = nodeById.get(edge.source);
        const target = nodeById.get(edge.target);
        if (!source || !target)
            return;
        const renderedEdge = createEdgeElement(echarts, seriesModel, layoutType, edge, source, target, edgeIndex, edgeDelayOffset);
        edgeGroup.add(renderedEdge.element);
        renderedEdges.push({
            ...renderedEdge,
            sourceId: edge.source,
            targetId: edge.target,
            edgeGroup,
            fisheyeElementAdded: false,
            baseStyle: cloneRecord(renderedEdge.baseStyle),
            fisheyeBaseStyle: renderedEdge.fisheyeBaseStyle ? cloneRecord(renderedEdge.fisheyeBaseStyle) : null
        });
    });
    layout.nodes.forEach((node) => {
        const dataIndex = indexById.get(node.id);
        if (dataIndex == null)
            return;
        const animationIndex = sequenceEdgesAfterNodes ? dataIndex : edgeCount;
        const itemModel = data.getItemModel(dataIndex);
        const size = readNodeSize(seriesModel, data, node, dataIndex, defaultNodeSize);
        renderNodes.push({
            node,
            dataIndex,
            animationIndex,
            itemModel,
            size,
            circleBox: circleBox(node, size / 2),
            labelSpec: createLabelSpec(seriesModel, itemModel, node, size)
        });
    });
    const placedLabels = placeLabels(renderNodes, layoutType, viewport);
    renderNodes.forEach((renderNode) => {
        const renderedNode = createNodeElement(echarts, seriesModel, data, renderNode);
        nodeGroup.add(renderedNode.group);
        renderedNodes.push({
            id: renderNode.node.id,
            baseX: renderNode.node.x,
            baseY: renderNode.node.y,
            baseRadius: renderNode.size / 2,
            circle: renderedNode.circle,
            baseStyle: cloneRecord(renderedNode.baseStyle),
            valueLabel: renderedNode.valueLabel,
            valueLabelBaseStyle: renderedNode.valueLabelBaseStyle ? cloneRecord(renderedNode.valueLabelBaseStyle) : null,
            valueFontSize: renderedNode.valueFontSize,
            valueLineWidth: renderedNode.valueLineWidth
        });
        const placedLabel = placedLabels.get(renderNode.node.id);
        if (placedLabel) {
            const label = createLabelElement(echarts, placedLabel);
            setAliveRenderKey(label, `node-label:${renderNode.node.id}`);
            const baseStyle = cloneStyle(label);
            applyFadeEnterAnimation(label, readEnterAnimation(seriesModel, renderNode.animationIndex));
            labelGroup.add(label);
            renderedLabels.push({
                nodeId: renderNode.node.id,
                element: label,
                baseStyle,
                baseX: placedLabel.point.x,
                baseY: placedLabel.point.y,
                baseFontSize: placedLabel.spec.fontSize,
                baseLineHeight: placedLabel.spec.lineHeight
            });
        }
    });
    group.add(edgeGroup);
    group.add(nodeGroup);
    group.add(labelGroup);
    const lens = fisheye ? createFisheyeLens(echarts, fisheye) : null;
    if (lens)
        group.add(lens);
    const renderState = {
        nodes: renderedNodes,
        labels: renderedLabels,
        edges: renderedEdges,
        lens,
        viewport
    };
    return renderState;
}
function mapGraphRenderState(renderState, mapElement) {
    return {
        ...renderState,
        nodes: renderState.nodes.map((node) => ({
            ...node,
            circle: mapElement(node.circle),
            valueLabel: mapElement(node.valueLabel)
        })),
        labels: renderState.labels.map((label) => ({
            ...label,
            element: mapElement(label.element)
        })),
        edges: renderState.edges.map((edge) => ({
            ...edge,
            element: mapElement(edge.element),
            fisheyeElement: mapElement(edge.fisheyeElement),
            edgeGroup: mapElement(edge.edgeGroup)
        })),
        lens: mapElement(renderState.lens)
    };
}
function createEdgeElement(echarts, seriesModel, layoutType, edge, source, target, edgeIndex, delayOffset = 0) {
    const style = readEdgeStyle(seriesModel, edge);
    const baseStyle = cloneRecord(style);
    const animation = readEdgeAnimation(seriesModel, edge, edgeIndex, delayOffset);
    const edgeKey = `edge:${edge.id || `${edge.source}->${edge.target}`}:${edgeIndex}`;
    if (layoutType === 'arc') {
        const path = createArcPath([source.x, source.y], [target.x, target.y]);
        if (echarts.graphic.makePath) {
            const edgeElement = echarts.graphic.makePath(pathToString(path), {
                style: cloneRecord(style)
            });
            setAliveRenderKey(edgeElement, edgeKey);
            edgeElement.cursor = 'pointer';
            applyEdgeConnectionAnimation(edgeElement, 'style', 'strokePercent', animation);
            const fisheyeElement = new echarts.graphic.BezierCurve({
                shape: createArcBezierShape([source.x, source.y], [target.x, target.y]),
                style: cloneRecord(style),
                ignore: true,
                silent: true
            });
            setAliveRenderKey(fisheyeElement, `${edgeKey}:fisheye`);
            return {
                element: edgeElement,
                fisheyeElement,
                kind: 'arcPath',
                baseStyle,
                fisheyeBaseStyle: cloneRecord(style)
            };
        }
        const edgeElement = new echarts.graphic.BezierCurve({
            shape: createArcBezierShape([source.x, source.y], [target.x, target.y]),
            style: cloneRecord(style)
        });
        setAliveRenderKey(edgeElement, edgeKey);
        edgeElement.cursor = 'pointer';
        applyEdgeConnectionAnimation(edgeElement, 'shape', 'percent', animation);
        return {
            element: edgeElement,
            kind: 'arcBezier',
            baseStyle,
            fisheyeBaseStyle: null
        };
    }
    const edgeElement = new echarts.graphic.Line({
        shape: {
            x1: source.x,
            y1: source.y,
            x2: target.x,
            y2: target.y
        },
        style: cloneRecord(style)
    });
    setAliveRenderKey(edgeElement, edgeKey);
    edgeElement.cursor = 'pointer';
    applyEdgeConnectionAnimation(edgeElement, 'shape', 'percent', animation);
    return {
        element: edgeElement,
        kind: 'line',
        baseStyle,
        fisheyeBaseStyle: null
    };
}
function createNodeElement(echarts, seriesModel, data, renderNode) {
    const { node, dataIndex, animationIndex, itemModel, size } = renderNode;
    const itemGroup = new echarts.graphic.Group();
    setAliveRenderKey(itemGroup, `node-group:${node.id}`);
    const nodeStyle = readNodeStyle(seriesModel, itemModel, data, dataIndex);
    const baseStyle = cloneRecord(nodeStyle);
    const circle = new echarts.graphic.Circle({
        shape: {
            cx: node.x,
            cy: node.y,
            r: size / 2
        },
        style: nodeStyle
    });
    setAliveRenderKey(circle, `node:${node.id}`);
    circle.cursor = 'pointer';
    applyNodeEnterAnimation(circle, size, readEnterAnimation(seriesModel, animationIndex));
    data.setItemLayout(dataIndex, [node.x, node.y]);
    data.setItemGraphicEl(dataIndex, circle);
    itemGroup.add(circle);
    const valueLabel = createNodeValueElement(echarts, renderNode);
    const valueLabelBaseStyle = valueLabel ? cloneStyle(valueLabel) : null;
    const valueStyle = valueLabel ? asRecord(valueLabel.style) : {};
    if (valueLabel) {
        setAliveRenderKey(valueLabel, `node-value:${node.id}`);
        valueLabel.cursor = 'pointer';
        applyFadeEnterAnimation(valueLabel, readEnterAnimation(seriesModel, animationIndex));
        itemGroup.add(valueLabel);
    }
    return {
        group: itemGroup,
        circle,
        baseStyle,
        valueLabel,
        valueLabelBaseStyle,
        valueFontSize: finiteNumber(valueStyle.fontSize, 0),
        valueLineWidth: finiteNumber(valueStyle.lineWidth, 0)
    };
}
function createNodeValueElement(echarts, renderNode) {
    const text = formatNodeValue(renderNode.node.value);
    if (!text)
        return null;
    const fontSize = resolveNodeValueFontSize(text, renderNode.size);
    return new echarts.graphic.Text({
        style: {
            x: renderNode.node.x,
            y: renderNode.node.y,
            text,
            fill: '#ffffff',
            stroke: 'rgba(15, 23, 42, 0.28)',
            lineWidth: Math.max(1, fontSize * 0.14),
            fontSize,
            fontWeight: 700,
            align: 'center',
            verticalAlign: 'middle'
        }
    });
}
function formatNodeValue(value) {
    if (value == null || value === '')
        return '';
    if (typeof value === 'number')
        return Number.isFinite(value) ? formatCompactNumber(value) : '';
    if (typeof value === 'string')
        return value;
    if (Array.isArray(value)) {
        for (const item of value) {
            const text = formatNodeValue(item);
            if (text)
                return text;
        }
    }
    return '';
}
function installGraphHover(renderState, api) {
    const adjacency = createHoverAdjacency(renderState.edges);
    const hoverTargets = new WeakSet();
    let active = false;
    const registerHoverTarget = (element) => {
        if (element && typeof element === 'object')
            hoverTargets.add(element);
    };
    const reset = (eventOrImmediate = false) => {
        if (!active)
            return;
        const immediate = eventOrImmediate === true;
        active = false;
        resetGraphHover(renderState, !immediate);
    };
    renderState.nodes.forEach((node) => {
        const enter = () => {
            active = true;
            applyNodeHover(renderState, adjacency, node.id);
        };
        registerHoverTarget(node.circle);
        registerHoverTarget(node.valueLabel);
        attachHoverHandlers(node.circle, enter, reset);
        if (node.valueLabel)
            attachHoverHandlers(node.valueLabel, enter, reset);
    });
    renderState.edges.forEach((edge, edgeIndex) => {
        registerHoverTarget(edge.element);
        registerHoverTarget(edge.fisheyeElement);
        attachHoverHandlers(edge.element, () => {
            active = true;
            applyEdgeHover(renderState, edgeIndex);
        }, reset);
    });
    const zr = api?.getZr?.();
    if (!zr)
        return undefined;
    const handleMove = (event) => {
        if (!active)
            return;
        if (!isGraphHoverTarget(event.target, hoverTargets))
            reset();
    };
    zr.on('mousemove', handleMove);
    zr.on('globalout', reset);
    return {
        dispose() {
            zr.off('mousemove', handleMove);
            zr.off('globalout', reset);
            reset(true);
        }
    };
}
function isGraphHoverTarget(target, hoverTargets) {
    let current = target;
    while (current && typeof current === 'object') {
        if (hoverTargets.has(current))
            return true;
        current = current.parent;
    }
    return false;
}
function createHoverAdjacency(edges) {
    const adjacency = new Map();
    const entryFor = (id) => {
        let entry = adjacency.get(id);
        if (!entry) {
            entry = {
                nodes: new Set(),
                edges: new Set()
            };
            adjacency.set(id, entry);
        }
        return entry;
    };
    edges.forEach((edge, edgeIndex) => {
        const source = entryFor(edge.sourceId);
        const target = entryFor(edge.targetId);
        source.nodes.add(edge.targetId);
        source.edges.add(edgeIndex);
        target.nodes.add(edge.sourceId);
        target.edges.add(edgeIndex);
    });
    return adjacency;
}
function applyNodeHover(renderState, adjacency, nodeId) {
    const relatedNodeIds = new Set([nodeId]);
    const relatedEdgeIndexes = new Set();
    const adjacent = adjacency.get(nodeId);
    adjacent?.nodes.forEach((id) => relatedNodeIds.add(id));
    adjacent?.edges.forEach((edgeIndex) => relatedEdgeIndexes.add(edgeIndex));
    const focusNode = renderState.nodes.find((node) => node.id === nodeId);
    const focusColor = String(asRecord(focusNode?.circle?.style).fill || GRAPH_HOVER_EDGE_COLOR);
    applyHoverStyles(renderState, {
        relatedNodeIds,
        relatedEdgeIndexes,
        focusNodeId: nodeId,
        edgeColor: focusColor,
        edgeWidthScale: 2.2
    });
}
function applyEdgeHover(renderState, edgeIndex) {
    const edge = renderState.edges[edgeIndex];
    if (!edge)
        return;
    applyHoverStyles(renderState, {
        relatedNodeIds: new Set([edge.sourceId, edge.targetId]),
        relatedEdgeIndexes: new Set([edgeIndex]),
        edgeColor: GRAPH_HOVER_EDGE_COLOR,
        edgeWidthScale: 4.2
    });
}
function applyHoverStyles(renderState, options) {
    renderState.nodes.forEach((node) => {
        const isRelated = options.relatedNodeIds.has(node.id);
        const isFocus = node.id === options.focusNodeId;
        applyGraphElementStyle(node.circle, node.baseStyle, {
            opacity: isRelated ? 1 : GRAPH_HOVER_DIM_OPACITY,
            shadowBlur: isFocus ? Math.max(10, node.baseRadius * 0.7) : undefined,
            shadowColor: isFocus ? GRAPH_HOVER_SHADOW_COLOR : undefined,
            lineWidth: isFocus ? Math.max(finiteNumber(node.baseStyle.lineWidth, 1), 2.4) : undefined
        }, ['opacity', 'shadowBlur', 'shadowColor', 'lineWidth'], true);
        if (node.valueLabel && node.valueLabelBaseStyle) {
            applyGraphElementStyle(node.valueLabel, node.valueLabelBaseStyle, {
                opacity: isRelated ? 1 : GRAPH_HOVER_LABEL_DIM_OPACITY
            }, ['opacity'], true);
        }
    });
    renderState.labels.forEach((label) => {
        applyGraphElementStyle(label.element, label.baseStyle, {
            opacity: options.relatedNodeIds.has(label.nodeId) ? 1 : GRAPH_HOVER_LABEL_DIM_OPACITY
        }, ['opacity'], true);
    });
    renderState.edges.forEach((edge, edgeIndex) => {
        const isRelated = options.relatedEdgeIndexes.has(edgeIndex);
        const baseWidth = finiteNumber(edge.baseStyle.lineWidth, 1);
        const hoverWidth = Math.max(baseWidth * options.edgeWidthScale, options.edgeWidthScale >= 4 ? 6 : 2.6);
        const style = isRelated
            ? {
                stroke: options.edgeColor,
                lineWidth: hoverWidth,
                opacity: GRAPH_HOVER_ACTIVE_EDGE_OPACITY,
                shadowBlur: 8,
                shadowColor: `${options.edgeColor}55`
            }
            : {
                opacity: GRAPH_HOVER_DIM_OPACITY
            };
        applyEdgeHoverStyle(edge, style, ['stroke', 'lineWidth', 'opacity', 'shadowBlur', 'shadowColor'], true);
    });
}
function resetGraphHover(renderState, transition = true) {
    renderState.nodes.forEach((node) => {
        applyGraphElementStyle(node.circle, node.baseStyle, {}, ['opacity', 'shadowBlur', 'shadowColor', 'lineWidth'], transition);
        if (node.valueLabel && node.valueLabelBaseStyle) {
            applyGraphElementStyle(node.valueLabel, node.valueLabelBaseStyle, {}, ['opacity'], transition);
        }
    });
    renderState.labels.forEach((label) => {
        applyGraphElementStyle(label.element, label.baseStyle, {}, ['opacity'], transition);
    });
    renderState.edges.forEach((edge) => {
        applyEdgeHoverStyle(edge, {}, ['stroke', 'lineWidth', 'opacity', 'shadowBlur', 'shadowColor'], transition);
    });
}
function applyEdgeHoverStyle(edge, style, keys, transition = false) {
    applyGraphElementStyle(edge.element, edge.baseStyle, style, keys, transition);
    if (edge.fisheyeElement && edge.fisheyeBaseStyle) {
        applyGraphElementStyle(edge.fisheyeElement, edge.fisheyeBaseStyle, style, keys, transition);
    }
}
function applyGraphElementStyle(element, baseStyle, patch, keys, transition = false) {
    const current = cloneStyle(element);
    keys.forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(patch, key)) {
            const value = patch[key];
            if (value === undefined) {
                if (Object.prototype.hasOwnProperty.call(baseStyle, key)) {
                    current[key] = baseStyle[key];
                }
                else {
                    delete current[key];
                }
            }
            else {
                current[key] = value;
            }
        }
        else if (Object.prototype.hasOwnProperty.call(baseStyle, key)) {
            current[key] = baseStyle[key];
        }
        else {
            delete current[key];
        }
    });
    if (transition) {
        transitionGraphicStyle(element, current, keys);
    }
    else {
        replaceGraphicStyle(element, current);
    }
}
function transitionGraphicStyle(element, nextStyle, keys) {
    const target = createStyleTransitionTarget(nextStyle, keys);
    if (!Object.keys(target).length) {
        replaceGraphicStyle(element, nextStyle);
        return;
    }
    const animatable = element;
    animatable.stopAnimation?.(GRAPH_HOVER_TRANSITION_SCOPE, false);
    const animator = animatable.animate?.('style');
    if (!animator) {
        replaceGraphicStyle(element, nextStyle);
        return;
    }
    animator.scope = GRAPH_HOVER_TRANSITION_SCOPE;
    animator
        .when(GRAPH_HOVER_TRANSITION_DURATION, target)
        .done?.(() => replaceGraphicStyle(element, nextStyle));
    animator.start(GRAPH_HOVER_TRANSITION_EASING);
}
function createStyleTransitionTarget(nextStyle, keys) {
    const target = {};
    keys.forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(nextStyle, key)) {
            target[key] = nextStyle[key];
            return;
        }
        const fallback = styleTransitionFallbackValue(key);
        if (fallback !== undefined)
            target[key] = fallback;
    });
    return target;
}
function styleTransitionFallbackValue(key) {
    if (key === 'opacity')
        return 1;
    if (key === 'shadowBlur')
        return 0;
    if (key === 'shadowColor')
        return '#000';
    if (key === 'lineWidth')
        return 1;
    return undefined;
}
function attachHoverHandlers(element, onEnter, onLeave) {
    const evented = element;
    evented.on?.('mouseover', onEnter);
    evented.on?.('mouseout', onLeave);
}
function formatCompactNumber(value) {
    const absValue = Math.abs(value);
    if (absValue >= 1000000)
        return trimFixed(value / 1000000, 1) + 'M';
    if (absValue >= 1000)
        return trimFixed(value / 1000, 1) + 'K';
    if (Number.isInteger(value))
        return String(value);
    return trimFixed(value, 2);
}
function trimFixed(value, fractionDigits) {
    return value.toFixed(fractionDigits).replace(/\.0+$|(\.\d*[1-9])0+$/, '$1');
}
function resolveNodeValueFontSize(text, size) {
    const baseSize = Math.max(8, Math.min(14, size * 0.34));
    const maxWidth = Math.max(6, size * 0.78);
    const textWidth = measureText(text, baseSize, baseSize * 1.2).width;
    if (textWidth <= maxWidth)
        return baseSize;
    return Math.max(7, baseSize * (maxWidth / textWidth));
}
function createLabelSpec(seriesModel, itemModel, node, size) {
    const labelModel = itemModel.getModel('label');
    const show = labelModel.get('show') ?? seriesModel.get(['label', 'show']);
    if (!show)
        return null;
    const rawPosition = labelModel.get('position') || seriesModel.get(['label', 'position']) || 'right';
    const position = typeof rawPosition === 'string' ? rawPosition : 'right';
    const offset = size / 2 + 6;
    const formatter = labelModel.get('formatter') || seriesModel.get(['label', 'formatter']);
    const text = String(formatLabel(formatter, node) ?? '');
    const fontSize = finiteNumber(labelModel.get('fontSize') ?? seriesModel.get(['label', 'fontSize']), 12);
    const lineHeight = finiteNumber(labelModel.get('lineHeight') ?? seriesModel.get(['label', 'lineHeight']), fontSize * 1.2);
    const metrics = measureText(text, fontSize, lineHeight);
    return {
        node,
        text,
        color: labelModel.get('color') || seriesModel.get(['label', 'color']) || '#1f2937',
        fontSize,
        lineHeight,
        position,
        offset,
        style: {
            fontWeight: labelModel.get('fontWeight') || seriesModel.get(['label', 'fontWeight']),
            fontFamily: labelModel.get('fontFamily') || seriesModel.get(['label', 'fontFamily'])
        },
        width: metrics.width,
        height: metrics.height
    };
}
function createLabelElement(echarts, placed) {
    return new echarts.graphic.Text({
        style: {
            ...placed.spec.style,
            x: placed.point.x,
            y: placed.point.y,
            text: placed.spec.text,
            fill: placed.spec.color,
            fontSize: placed.spec.fontSize,
            lineHeight: placed.spec.lineHeight,
            align: placed.point.align,
            verticalAlign: placed.point.verticalAlign
        }
    });
}
function createFisheyeLens(echarts, fisheye) {
    const lens = new echarts.graphic.Circle({
        shape: {
            cx: 0,
            cy: 0,
            r: fisheye.radius
        },
        style: {
            fill: null,
            stroke: fisheye.stroke,
            lineWidth: fisheye.strokeWidth,
            opacity: fisheye.opacity
        },
        ignore: true,
        silent: true,
        z2: 1000
    });
    setAliveRenderKey(lens, 'fisheye-lens');
    return lens;
}
function updateFisheyeRenderState(echarts, group, api, view, renderState, fisheye) {
    view.__fisheyeController?.dispose();
    view.__fisheyeController = undefined;
    clearFisheyePreviewTimer(view);
    if (!fisheye) {
        if (renderState.lens)
            setGraphicIgnore(renderState.lens, true);
        return;
    }
    if (!renderState.lens) {
        renderState.lens = createFisheyeLens(echarts, fisheye);
        group.add(renderState.lens);
    }
    else {
        setGraphicShape(renderState.lens, {
            r: fisheye.radius
        });
        setGraphicStyle(renderState.lens, {
            fill: null,
            stroke: fisheye.stroke,
            lineWidth: fisheye.strokeWidth,
            opacity: fisheye.opacity
        });
        setGraphicIgnore(renderState.lens, true);
    }
    view.__fisheyeController = installFisheye(api, renderState, fisheye);
    scheduleInitialFisheyePreview(view, renderState, fisheye, 0);
}
function readFisheyeOptions(seriesModel, viewport) {
    const raw = seriesModel.get('fisheye');
    if (raw === false)
        return null;
    const option = raw == null || raw === true ? {} : asRecord(raw);
    if (option.show === false || option.enabled === false)
        return null;
    const defaultRadius = Math.max(48, Math.min(viewport.width, viewport.height) * 0.32);
    const radius = resolveFisheyeNumber(option.radius, defaultRadius, Math.min(viewport.width, viewport.height));
    const scale = Math.max(1, finiteNumber(option.scale ?? option.magnification, 2.2));
    return {
        radius: Math.max(1, radius),
        scale,
        labelScale: Math.max(1, finiteNumber(option.labelScale, Math.min(scale, 1.55))),
        stroke: option.stroke || option.borderColor || 'rgba(17, 24, 39, 0.86)',
        strokeWidth: Math.max(0, finiteNumber(option.strokeWidth ?? option.borderWidth, 3)),
        opacity: Math.max(0, Math.min(1, finiteNumber(option.opacity, 0.92))),
        preview: option.preview === true
    };
}
function scheduleInitialFisheyePreview(view, renderState, fisheye, delay) {
    if (!fisheye.preview)
        return;
    applyInitialFisheyePreview(renderState, fisheye);
    if (delay <= 0)
        return;
    view.__fisheyePreviewTimer = setTimeout(() => {
        view.__fisheyePreviewTimer = undefined;
        applyInitialFisheyePreview(renderState, fisheye);
    }, delay);
}
function applyInitialFisheyePreview(renderState, fisheye) {
    applyFisheye(renderState, fisheye, [
        renderState.viewport.x + renderState.viewport.width / 2,
        renderState.viewport.y + renderState.viewport.height / 2
    ]);
}
function clearFisheyePreviewTimer(view) {
    if (view.__fisheyePreviewTimer === undefined)
        return;
    clearTimeout(view.__fisheyePreviewTimer);
    view.__fisheyePreviewTimer = undefined;
}
function readFisheyePreviewDelay(seriesModel, nodeCount) {
    return readNodeEnterAnimationEnd(seriesModel, nodeCount);
}
function installFisheye(api, renderState, fisheye) {
    const zr = api.getZr?.();
    if (!zr || !renderState.lens)
        return undefined;
    const handleMove = (event) => {
        const point = eventPoint(event);
        if (!point || !pointInRect(point, renderState.viewport)) {
            resetFisheye(renderState);
            return;
        }
        applyFisheye(renderState, fisheye, point);
    };
    const handleLeave = () => resetFisheye(renderState);
    zr.on('mousemove', handleMove);
    zr.on('globalout', handleLeave);
    zr.on('mouseout', handleLeave);
    return {
        dispose() {
            zr.off('mousemove', handleMove);
            zr.off('globalout', handleLeave);
            zr.off('mouseout', handleLeave);
            resetFisheye(renderState);
        }
    };
}
function applyFisheye(renderState, fisheye, focus) {
    const transforms = new Map();
    const nodeById = new Map(renderState.nodes.map((node) => [node.id, node]));
    if (renderState.lens) {
        setGraphicShape(renderState.lens, {
            cx: focus[0],
            cy: focus[1],
            r: fisheye.radius
        });
        setGraphicIgnore(renderState.lens, false);
    }
    renderState.nodes.forEach((node) => {
        const transform = fisheyeTransform(node, fisheye, focus);
        transforms.set(node.id, transform);
        setGraphicShape(node.circle, {
            cx: transform.x,
            cy: transform.y,
            r: node.baseRadius * transform.scale
        });
        if (node.valueLabel) {
            const lineScale = transform.scale;
            setGraphicStyle(node.valueLabel, {
                x: transform.x,
                y: transform.y,
                fontSize: node.valueFontSize * lineScale,
                lineWidth: Math.max(1, node.valueLineWidth * lineScale)
            });
        }
    });
    renderState.labels.forEach((label) => {
        const node = nodeById.get(label.nodeId);
        const transform = transforms.get(label.nodeId);
        if (!node || !transform)
            return;
        const labelScale = 1 + (fisheye.labelScale - 1) * transform.influence;
        const offsetScale = 1 + (labelScale - 1) * 0.35;
        setGraphicStyle(label.element, {
            x: transform.x + (label.baseX - node.baseX) * offsetScale,
            y: transform.y + (label.baseY - node.baseY) * offsetScale,
            fontSize: label.baseFontSize * labelScale,
            lineHeight: label.baseLineHeight * labelScale
        });
    });
    renderState.edges.forEach((edge) => {
        const source = transforms.get(edge.sourceId);
        const target = transforms.get(edge.targetId);
        const baseSource = nodeById.get(edge.sourceId);
        const baseTarget = nodeById.get(edge.targetId);
        if (!source || !target || !baseSource || !baseTarget)
            return;
        updateFisheyeEdge(edge, [source.x, source.y], [target.x, target.y], true);
    });
}
function resetFisheye(renderState) {
    const nodeById = new Map(renderState.nodes.map((node) => [node.id, node]));
    if (renderState.lens)
        setGraphicIgnore(renderState.lens, true);
    renderState.nodes.forEach((node) => {
        setGraphicShape(node.circle, {
            cx: node.baseX,
            cy: node.baseY,
            r: node.baseRadius
        });
        if (node.valueLabel) {
            setGraphicStyle(node.valueLabel, {
                x: node.baseX,
                y: node.baseY,
                fontSize: node.valueFontSize,
                lineWidth: node.valueLineWidth
            });
        }
    });
    renderState.labels.forEach((label) => {
        setGraphicStyle(label.element, {
            x: label.baseX,
            y: label.baseY,
            fontSize: label.baseFontSize,
            lineHeight: label.baseLineHeight
        });
    });
    renderState.edges.forEach((edge) => {
        const source = nodeById.get(edge.sourceId);
        const target = nodeById.get(edge.targetId);
        if (!source || !target)
            return;
        updateFisheyeEdge(edge, [source.baseX, source.baseY], [target.baseX, target.baseY], false);
    });
}
function updateFisheyeEdge(edge, source, target, active) {
    if (edge.kind === 'line') {
        setGraphicShape(edge.element, {
            x1: source[0],
            y1: source[1],
            x2: target[0],
            y2: target[1]
        });
        return;
    }
    const shape = createArcBezierShape(source, target);
    if (edge.kind === 'arcPath' && edge.fisheyeElement) {
        if (!edge.fisheyeElementAdded) {
            edge.edgeGroup.add(edge.fisheyeElement);
            edge.fisheyeElementAdded = true;
        }
        setGraphicIgnore(edge.element, active);
        setGraphicIgnore(edge.fisheyeElement, !active);
        setGraphicShape(edge.fisheyeElement, shape);
        return;
    }
    setGraphicShape(edge.element, shape);
}
function fisheyeTransform(node, fisheye, focus) {
    const dx = node.baseX - focus[0];
    const dy = node.baseY - focus[1];
    const distance = Math.hypot(dx, dy);
    if (distance >= fisheye.radius) {
        return {
            x: node.baseX,
            y: node.baseY,
            scale: 1,
            influence: 0
        };
    }
    const ratio = 1 - distance / fisheye.radius;
    const influence = ratio * ratio * (3 - 2 * ratio);
    const scale = 1 + (fisheye.scale - 1) * influence;
    const distanceScale = 1 + (fisheye.scale - 1) * influence * 0.35;
    return {
        x: focus[0] + dx * distanceScale,
        y: focus[1] + dy * distanceScale,
        scale,
        influence
    };
}
function eventPoint(event) {
    const x = finiteNumber(event.offsetX, finiteNumber(event.zrX, NaN));
    const y = finiteNumber(event.offsetY, finiteNumber(event.zrY, NaN));
    return Number.isFinite(x) && Number.isFinite(y) ? [x, y] : null;
}
function pointInRect(point, rect) {
    return point[0] >= rect.x
        && point[0] <= rect.x + rect.width
        && point[1] >= rect.y
        && point[1] <= rect.y + rect.height;
}
function resolveFisheyeNumber(value, fallback, percentBase) {
    if (typeof value === 'string' && value.endsWith('%')) {
        const ratio = Number(value.slice(0, -1));
        return Number.isFinite(ratio) ? percentBase * ratio / 100 : fallback;
    }
    return finiteNumber(value, fallback);
}
function getLabelPoint(node, position, offset) {
    const points = {
        top: { x: node.x, y: node.y - offset, align: 'center', verticalAlign: 'bottom' },
        bottom: { x: node.x, y: node.y + offset, align: 'center', verticalAlign: 'top' },
        left: { x: node.x - offset, y: node.y, align: 'right', verticalAlign: 'middle' },
        right: { x: node.x + offset, y: node.y, align: 'left', verticalAlign: 'middle' }
    };
    return isLabelPosition(position) ? points[position] : points.right;
}
function placeLabels(renderNodes, layoutType, viewport) {
    const labels = renderNodes.filter((item) => item.labelSpec);
    const placed = new Map();
    if (!labels.length)
        return placed;
    const occupied = renderNodes.map((item) => expandRect(item.circleBox, LABEL_COLLISION_PADDING));
    const labelViewport = expandRect(viewport, -LABEL_VIEWPORT_PADDING);
    const center = graphCenter(renderNodes);
    labels
        .slice()
        .sort((left, right) => {
        const leftDistance = distanceFromCenter(left.node, center);
        const rightDistance = distanceFromCenter(right.node, center);
        return rightDistance - leftDistance || right.size - left.size || left.dataIndex - right.dataIndex;
    })
        .forEach((item) => {
        const spec = item.labelSpec;
        if (!spec)
            return;
        const candidates = createLabelCandidates(spec, layoutType, center);
        let best = null;
        let bestScore = Infinity;
        for (const point of candidates) {
            const box = textBoxFromLabelPoint(spec, point);
            const outside = outsideArea(box, labelViewport);
            const overlap = overlapArea(box, occupied);
            const distance = Math.hypot(point.x - spec.node.x, point.y - spec.node.y);
            const score = overlap * 10000 + outside * 1000 + distance;
            if (score < bestScore) {
                bestScore = score;
                best = { spec, point, box };
            }
            if (overlap === 0 && outside === 0)
                break;
        }
        if (!best)
            return;
        if (outsideArea(best.box, labelViewport) > 0) {
            best = clampPlacedLabel(best, labelViewport);
        }
        placed.set(item.node.id, best);
        occupied.push(expandRect(best.box, LABEL_COLLISION_PADDING));
    });
    return placed;
}
function createLabelCandidates(spec, layoutType, center) {
    const positions = orderedLabelPositions(spec.node, spec.position, layoutType, center);
    const candidates = [];
    for (let extraOffset = 0; extraOffset <= 180; extraOffset += 12) {
        positions.forEach((position) => {
            candidates.push(getLabelPoint(spec.node, position, spec.offset + extraOffset));
        });
    }
    return candidates;
}
function orderedLabelPositions(node, configuredPosition, layoutType, center) {
    const radialPosition = outwardLabelPosition(node, center);
    const preferred = isLabelPosition(configuredPosition) ? configuredPosition : radialPosition;
    const primary = layoutType === 'arc' ? preferred : radialPosition;
    const secondary = primary === preferred ? radialPosition : preferred;
    const positions = [];
    const candidates = [primary, secondary, 'right', 'left', 'top', 'bottom'];
    candidates.forEach((position) => {
        if (!positions.includes(position))
            positions.push(position);
    });
    return positions;
}
function outwardLabelPosition(node, center) {
    const dx = node.x - center[0];
    const dy = node.y - center[1];
    if (Math.abs(dx) >= Math.abs(dy))
        return dx < 0 ? 'left' : 'right';
    return dy < 0 ? 'top' : 'bottom';
}
function textBoxFromLabelPoint(spec, point) {
    let x = point.x;
    let y = point.y;
    if (point.align === 'center')
        x -= spec.width / 2;
    if (point.align === 'right')
        x -= spec.width;
    if (point.verticalAlign === 'middle')
        y -= spec.height / 2;
    if (point.verticalAlign === 'bottom')
        y -= spec.height;
    return { x, y, width: spec.width, height: spec.height };
}
function clampPlacedLabel(label, viewport) {
    const clampedBox = {
        ...label.box,
        x: Math.min(Math.max(label.box.x, viewport.x), viewport.x + viewport.width - label.box.width),
        y: Math.min(Math.max(label.box.y, viewport.y), viewport.y + viewport.height - label.box.height)
    };
    const dx = clampedBox.x - label.box.x;
    const dy = clampedBox.y - label.box.y;
    return {
        ...label,
        point: {
            ...label.point,
            x: label.point.x + dx,
            y: label.point.y + dy
        },
        box: clampedBox
    };
}
function measureText(text, fontSize, lineHeight) {
    const lines = text.split('\n');
    const maxLength = Math.max(...lines.map((line) => line.length), 1);
    return {
        width: maxLength * fontSize * 0.62,
        height: lines.length * lineHeight
    };
}
function circleBox(node, radius) {
    return {
        x: node.x - radius,
        y: node.y - radius,
        width: radius * 2,
        height: radius * 2
    };
}
function graphCenter(renderNodes) {
    if (!renderNodes.length)
        return [0, 0];
    return [
        renderNodes.reduce((sum, item) => sum + item.node.x, 0) / renderNodes.length,
        renderNodes.reduce((sum, item) => sum + item.node.y, 0) / renderNodes.length
    ];
}
function distanceFromCenter(node, center) {
    return Math.hypot(node.x - center[0], node.y - center[1]);
}
function expandRect(rect, padding) {
    return {
        x: rect.x - padding,
        y: rect.y - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2
    };
}
function overlapArea(rect, others) {
    return others.reduce((sum, other) => sum + intersectArea(rect, other), 0);
}
function intersectArea(left, right) {
    const width = Math.min(left.x + left.width, right.x + right.width) - Math.max(left.x, right.x);
    const height = Math.min(left.y + left.height, right.y + right.height) - Math.max(left.y, right.y);
    return width > 0 && height > 0 ? width * height : 0;
}
function outsideArea(rect, bounds) {
    const horizontal = Math.max(bounds.x - rect.x, 0) + Math.max(rect.x + rect.width - (bounds.x + bounds.width), 0);
    const vertical = Math.max(bounds.y - rect.y, 0) + Math.max(rect.y + rect.height - (bounds.y + bounds.height), 0);
    return horizontal * rect.height + vertical * rect.width;
}
function formatLabel(formatter, node) {
    if (typeof formatter === 'function') {
        return formatter({
            data: node,
            name: node.name,
            value: node.value
        });
    }
    if (typeof formatter === 'string') {
        return formatter.replace(/\{b\}/g, node.name).replace(/\{c\}/g, String(node.value ?? ''));
    }
    return node.name;
}
function readNodeSize(seriesModel, data, node, dataIndex, defaultNodeSize) {
    const symbolSize = node.symbolSize
        ?? node.size
        ?? data.getItemVisual(dataIndex, 'symbolSize')
        ?? seriesModel.get('symbolSize');
    if (symbolSize == null)
        return defaultNodeSize(node);
    if (typeof symbolSize === 'function') {
        return finiteNumber(symbolSize(node, dataIndex), DEFAULT_NODE_SIZE);
    }
    if (Array.isArray(symbolSize)) {
        return finiteNumber(Math.max(...symbolSize.map((item) => finiteNumber(item, 0))), DEFAULT_NODE_SIZE);
    }
    return finiteNumber(symbolSize, DEFAULT_NODE_SIZE);
}
function readNodeStyle(seriesModel, itemModel, data, dataIndex) {
    const normal = asRecord(seriesModel.get('itemStyle'));
    const itemStyle = asRecord(itemModel.get('itemStyle'));
    const visualStyle = asRecord(data.getItemVisual(dataIndex, 'style'));
    return {
        fill: itemStyle.color || normal.color || visualStyle.fill || '#5470c6',
        stroke: itemStyle.borderColor || normal.borderColor || '#fff',
        lineWidth: finiteNumber(itemStyle.borderWidth ?? normal.borderWidth, 1),
        opacity: finiteNumber(itemStyle.opacity ?? normal.opacity, 1)
    };
}
function readEdgeStyle(seriesModel, edge) {
    const normal = asRecord(seriesModel.get('edgeStyle'));
    const lineStyle = edge.lineStyle || {};
    return {
        stroke: lineStyle.color || normal.color || '#9aa4b2',
        lineWidth: finiteNumber(lineStyle.width ?? normal.width, 1),
        opacity: finiteNumber(lineStyle.opacity ?? normal.opacity, 0.45),
        fill: null
    };
}
function readEdgeAnimation(seriesModel, edge, edgeIndex, delayOffset = 0) {
    const animationOption = edge.edgeAnimation ?? seriesModel.get('edgeAnimation');
    const fallbackToEnterAnimation = animationOption == null;
    const resolvedAnimationOption = fallbackToEnterAnimation ? seriesModel.get('enterAnimation') : animationOption;
    const animation = readEnterAnimation(seriesModel, edgeIndex, resolvedAnimationOption);
    if (!animation.enabled || delayOffset <= 0)
        return animation;
    const repeatedBaseDelay = fallbackToEnterAnimation
        ? readEnterAnimationBaseDelay(seriesModel, edgeIndex, resolvedAnimationOption)
        : 0;
    return {
        ...animation,
        delay: delayOffset + Math.max(0, animation.delay - repeatedBaseDelay)
    };
}
function readEnterAnimation(seriesModel, itemIndex, animationOption = seriesModel.get('enterAnimation')) {
    if (seriesModel.get('animation') === false || animationOption === false) {
        return createDisabledEdgeAnimation();
    }
    const option = animationOption == null || animationOption === true ? {} : asRecord(animationOption);
    if (option.show === false || option.enabled === false) {
        return createDisabledEdgeAnimation();
    }
    const baseDelay = resolveAnimationNumber(option.delay ?? seriesModel.get('animationDelay'), itemIndex, itemIndex, 0);
    const stagger = resolveAnimationNumber(option.stagger, itemIndex, itemIndex, 0);
    return {
        enabled: true,
        duration: resolveAnimationNumber(option.duration ?? seriesModel.get('animationDuration'), itemIndex, itemIndex, 600),
        delay: baseDelay + itemIndex * stagger,
        easing: resolveAnimationEasing(option.easing ?? seriesModel.get('animationEasing'))
    };
}
function readEnterAnimationBaseDelay(seriesModel, itemIndex, animationOption = seriesModel.get('enterAnimation')) {
    const option = animationOption == null || animationOption === true ? {} : asRecord(animationOption);
    return resolveAnimationNumber(option.delay ?? seriesModel.get('animationDelay'), itemIndex, itemIndex, 0);
}
function readNodeEnterAnimationEnd(seriesModel, nodeCount) {
    let end = 0;
    for (let nodeIndex = 0; nodeIndex < nodeCount; nodeIndex += 1) {
        const animation = readEnterAnimation(seriesModel, nodeIndex);
        if (animation.enabled) {
            end = Math.max(end, animation.delay + animation.duration);
        }
    }
    return end;
}
function createDisabledEdgeAnimation() {
    return {
        enabled: false,
        duration: 0,
        delay: 0,
        easing: 'cubicOut'
    };
}
function resolveAnimationNumber(value, item, itemIndex, fallback) {
    const resolved = typeof value === 'function'
        ? value(item, itemIndex)
        : value;
    return finiteNumber(resolved, fallback);
}
function resolveAnimationEasing(value) {
    return typeof value === 'string' && value ? value : 'cubicOut';
}
function applyEdgeConnectionAnimation(element, targetKey, propertyName, animation) {
    if (!animation.enabled)
        return;
    const animatable = element;
    if (typeof animatable.animate !== 'function')
        return;
    const target = animatable[targetKey] || {};
    target[propertyName] = 0;
    animatable[targetKey] = target;
    const animator = animatable.animate(targetKey);
    if (!animator) {
        target[propertyName] = 1;
        return;
    }
    const chain = animator.when(animation.duration, {
        [propertyName]: 1
    });
    if (animation.delay > 0)
        chain.delay?.(animation.delay);
    chain.start(animation.easing);
}
function applyNodeEnterAnimation(element, size, animation) {
    if (!animation.enabled)
        return;
    const animatable = element;
    if (typeof animatable.animate !== 'function')
        return;
    const shape = animatable.shape || {};
    const style = animatable.style || {};
    const radius = finiteNumber(shape.r, size / 2);
    const opacity = finiteNumber(style.opacity, 1);
    shape.r = 0;
    style.opacity = 0;
    animatable.shape = shape;
    animatable.style = style;
    animateGraphicProperty(animatable, 'shape', animation, { r: radius });
    animateGraphicProperty(animatable, 'style', animation, { opacity });
}
function applyFadeEnterAnimation(element, animation) {
    if (!animation.enabled)
        return;
    const animatable = element;
    if (typeof animatable.animate !== 'function')
        return;
    const style = animatable.style || {};
    const opacity = finiteNumber(style.opacity, 1);
    style.opacity = 0;
    animatable.style = style;
    animateGraphicProperty(animatable, 'style', animation, { opacity });
}
function animateGraphicProperty(element, targetKey, animation, target) {
    const animator = element.animate?.(targetKey);
    if (!animator) {
        Object.assign(element[targetKey] || {}, target);
        return;
    }
    const chain = animator.when(animation.duration, target);
    if (animation.delay > 0)
        chain.delay?.(animation.delay);
    chain.start(animation.easing);
}
function setGraphicShape(element, shape) {
    const target = element;
    const next = {
        ...asRecord(target.shape),
        ...shape
    };
    if (typeof target.setShape === 'function') {
        target.setShape(next);
    }
    else if (typeof target.attr === 'function') {
        target.attr('shape', next);
    }
    else {
        target.shape = next;
    }
}
function setGraphicStyle(element, style) {
    const target = element;
    const next = {
        ...asRecord(target.style),
        ...style
    };
    if (typeof target.setStyle === 'function') {
        target.setStyle(next);
    }
    else if (typeof target.attr === 'function') {
        target.attr('style', next);
    }
    else {
        target.style = next;
    }
}
function replaceGraphicStyle(element, style) {
    const target = element;
    const next = cloneRecord(style);
    removeMissingStyleKeys(target.style, next);
    if (typeof target.setStyle === 'function') {
        target.setStyle(next);
    }
    else if (typeof target.attr === 'function') {
        target.attr('style', next);
    }
    else {
        target.style = next;
    }
}
function removeMissingStyleKeys(current, next) {
    if (!current || typeof current !== 'object' || Array.isArray(current))
        return;
    const style = current;
    Object.keys(style).forEach((key) => {
        if (!Object.prototype.hasOwnProperty.call(next, key))
            delete style[key];
    });
}
function cloneStyle(element) {
    return cloneRecord(asRecord(element.style));
}
function cloneRecord(record) {
    return {
        ...record
    };
}
function setGraphicIgnore(element, ignore) {
    const target = element;
    if (typeof target.attr === 'function') {
        target.attr('ignore', ignore);
    }
    else {
        target.ignore = ignore;
    }
}
function finiteNumber(value, fallback) {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
function createValueNodeSizeResolver(nodes) {
    const values = nodes
        .map((node) => toNumericValue(readNodeValue(node)))
        .filter((value) => value != null);
    const minValue = values.length ? Math.min(...values) : 0;
    const maxValue = values.length ? Math.max(...values) : 0;
    if (!values.length || minValue === maxValue) {
        return () => DEFAULT_NODE_SIZE;
    }
    return (node) => {
        const value = toNumericValue(readNodeValue(node));
        if (value == null)
            return DEFAULT_NODE_SIZE;
        const ratio = (value - minValue) / (maxValue - minValue);
        const clampedRatio = Math.max(0, Math.min(1, ratio));
        return DEFAULT_MIN_VALUE_NODE_SIZE
            + clampedRatio * (DEFAULT_MAX_VALUE_NODE_SIZE - DEFAULT_MIN_VALUE_NODE_SIZE);
    };
}
function readNodeValue(node) {
    return node != null && typeof node === 'object' ? node.value : undefined;
}
function toNumericValue(value) {
    if (typeof value === 'number' && Number.isFinite(value))
        return value;
    if (typeof value === 'string' && value.trim()) {
        const numeric = Number(value);
        return Number.isFinite(numeric) ? numeric : undefined;
    }
    if (Array.isArray(value)) {
        for (const item of value) {
            const numeric = toNumericValue(item);
            if (numeric != null)
                return numeric;
        }
    }
    return undefined;
}
function shouldSequenceEdgesAfterNodes(layoutType) {
    return layoutType === 'radial' || layoutType === 'concentric' || layoutType === 'grid' || layoutType === 'mds' || layoutType === 'arc';
}
function isLabelPosition(value) {
    return value === 'top' || value === 'bottom' || value === 'left' || value === 'right';
}
function asRecord(value) {
    return value != null && typeof value === 'object' && !Array.isArray(value) ? value : {};
}
//# sourceMappingURL=echarts.js.map