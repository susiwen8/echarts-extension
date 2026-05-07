import * as echarts from 'echarts/lib/echarts';
import { clearAliveRender, installElementHover, renderAlive } from '@echarts-extension/layout-core';
import { DEFAULT_CIRCLE_PACKING_COLORS, flattenCirclePackingData, resolveCirclePackingLayout } from './layout.js';
const echartsHost = echarts;
const optionKeys = [
    'padding',
    'nodePadding',
    'siblingGap',
    'center',
    'radius',
    'rootName',
    'rootVisible',
    'valueField',
    'nameField',
    'childrenField',
    'sort',
    'colors'
];
echartsHost.extendSeriesModel({
    type: 'series.circlePacking',
    visualStyleAccessPath: 'itemStyle',
    visualDrawType: 'fill',
    getInitialData(option) {
        const source = flattenCirclePackingData(option.data, readInitialDataOptions(option));
        const dimensions = echartsHost.helper.createDimensions(source, {
            coordDimensions: ['value']
        });
        const list = new echartsHost.List(dimensions, this);
        list.initData(source);
        this.legendVisualProvider = createLegendVisualProvider(this);
        return list;
    },
    defaultOption: {
        left: 'center',
        top: 'center',
        width: '88%',
        height: '88%',
        padding: 18,
        nodePadding: 2.5,
        siblingGap: 1.5,
        center: null,
        radius: null,
        rootName: 'root',
        rootVisible: null,
        valueField: 'value',
        nameField: 'name',
        childrenField: 'children',
        sort: true,
        colors: DEFAULT_CIRCLE_PACKING_COLORS,
        enterAnimation: true,
        itemStyle: {
            opacity: 0.88,
            borderColor: '#ffffff',
            borderWidth: 1.2
        },
        label: {
            show: true,
            color: '#101828',
            fontSize: 12,
            fontWeight: 650,
            lineHeight: 14,
            minRadius: 18,
            formatter: null
        },
        emphasis: {
            itemStyle: {
                shadowBlur: 10,
                shadowColor: 'rgba(15, 23, 42, 0.22)'
            }
        }
    }
});
echartsHost.extendChartView({
    type: 'circlePacking',
    render(seriesModel, ecModel, api) {
        const group = this.group;
        const renderToken = {};
        this.__renderToken = renderToken;
        this.__hoverController?.dispose();
        this.__hoverController = undefined;
        try {
            const rect = echartsHost.helper.getLayoutRect(seriesModel.getBoxLayoutParams(), {
                width: api.getWidth(),
                height: api.getHeight()
            });
            const layout = resolveCirclePackingLayout(readLayoutOption(seriesModel, rect));
            if (this.__renderToken !== renderToken)
                return;
            const { hoverItems } = renderAlive(this, echartsHost, group, seriesModel, (targetGroup, targetSeriesModel) => (drawCirclePacking(echartsHost, targetGroup, targetSeriesModel, layout, rect)));
            this.__hoverController = installElementHover(hoverItems, {
                zrender: api.getZr?.()
            });
        }
        catch (error) {
            if (typeof console !== 'undefined') {
                console.error('[circlePacking] render failed', error);
            }
        }
    },
    remove() {
        this.__renderToken = null;
        this.__hoverController?.dispose();
        this.__hoverController = undefined;
        clearAliveRender(this);
        this.group.removeAll();
    },
    dispose() {
        this.__renderToken = null;
        this.__hoverController?.dispose();
        this.__hoverController = undefined;
        clearAliveRender(this);
        this.group.removeAll();
    }
});
function readInitialDataOptions(option) {
    const layoutOption = {
        ...(isPlainObject(option.layout) ? option.layout : {}),
        ...(isPlainObject(option.layoutOptions) ? option.layoutOptions : {})
    };
    optionKeys.forEach((key) => {
        const value = option[key];
        if (value !== undefined && value !== null)
            layoutOption[key] = value;
    });
    return layoutOption;
}
function readLayoutOption(seriesModel, rect) {
    const option = seriesModel.option || {};
    const layoutOption = {
        data: option.data,
        layout: seriesModel.get('layout'),
        layoutOptions: seriesModel.get('layoutOptions') || {},
        width: rect.width,
        height: rect.height
    };
    optionKeys.forEach((key) => {
        const value = seriesModel.get(key);
        if (value !== undefined && value !== null)
            layoutOption[key] = value;
    });
    return layoutOption;
}
function drawCirclePacking(echartsInstance, group, seriesModel, layout, rect) {
    const data = seriesModel.getData();
    const chartGroup = new echartsInstance.graphic.Group();
    const hoverItems = [];
    const hoverItemsByDataIndex = new Map();
    chartGroup.x = rect.x;
    chartGroup.y = rect.y;
    layout.nodes.forEach((node, index) => {
        if (node.r <= 0)
            return;
        const itemModel = node.dataIndex >= 0 && node.dataIndex < data.count() ? data.getItemModel(node.dataIndex) : null;
        const circleEl = new echartsInstance.graphic.Circle({
            shape: {
                cx: node.x,
                cy: node.y,
                r: node.r
            },
            style: readNodeStyle(data, seriesModel, itemModel, node, index)
        });
        applyCircleEnterAnimation(circleEl, node.r, readEnterAnimation(seriesModel, index));
        if (itemModel && node.dataIndex >= 0 && node.dataIndex < data.count()) {
            data.setItemLayout(node.dataIndex, [node.x, node.y, node.r]);
            data.setItemGraphicEl(node.dataIndex, circleEl);
            const hoverItem = createHoverItem(circleEl);
            hoverItems.push(hoverItem);
            hoverItemsByDataIndex.set(node.dataIndex, hoverItem);
        }
        chartGroup.add(circleEl);
    });
    drawLabels(echartsInstance, chartGroup, seriesModel, data, layout.nodes, hoverItemsByDataIndex);
    group.add(chartGroup);
    return hoverItems;
}
function drawLabels(echartsInstance, group, seriesModel, data, nodes, hoverItemsByDataIndex) {
    const seriesLabelModel = seriesModel.getModel('label');
    if (!seriesLabelModel.get('show'))
        return;
    nodes.forEach((node) => {
        const itemModel = node.dataIndex >= 0 && node.dataIndex < data.count() ? data.getItemModel(node.dataIndex) : null;
        const itemLabelModel = itemModel?.getModel('label');
        const show = itemLabelModel?.get('show') ?? seriesLabelModel.get('show');
        const minRadius = finiteNumber(itemLabelModel?.get('minRadius') ?? seriesLabelModel.get('minRadius'), 18);
        if (!show || node.r < minRadius)
            return;
        const requestedFontSize = finiteNumber(itemLabelModel?.get('fontSize') ?? seriesLabelModel.get('fontSize'), 12);
        const fontSize = Math.min(requestedFontSize, Math.max(8, node.r * 0.32));
        const lineHeight = finiteNumber(itemLabelModel?.get('lineHeight') ?? seriesLabelModel.get('lineHeight'), fontSize + 2);
        const text = formatLabel(itemLabelModel?.get('formatter') || seriesLabelModel.get('formatter'), node);
        const textEl = new echartsInstance.graphic.Text({
            style: {
                x: node.x,
                y: node.y,
                text: wrapText(String(text), node.r * 1.5, fontSize, node.r),
                fill: itemLabelModel?.get('color') || seriesLabelModel.get('color') || '#101828',
                fontSize,
                fontWeight: itemLabelModel?.get('fontWeight') || seriesLabelModel.get('fontWeight') || 650,
                lineHeight,
                align: 'center',
                verticalAlign: 'middle'
            },
            silent: true
        });
        applyFadeEnterAnimation(textEl, readEnterAnimation(seriesModel, node.dataIndex));
        addHoverElement(hoverItemsByDataIndex.get(node.dataIndex), textEl);
        group.add(textEl);
    });
}
function readNodeStyle(data, seriesModel, itemModel, node, index) {
    const seriesStyle = asRecord(seriesModel.get('itemStyle'));
    const rawStyle = readRawItemStyle(node.raw);
    const itemStyle = itemModel ? asRecord(itemModel.get('itemStyle')) : rawStyle;
    const visualStyle = node.dataIndex >= 0 && node.dataIndex < data.count()
        ? asRecord(data.getItemVisual(node.dataIndex, 'style'))
        : {};
    return {
        fill: itemStyle.color || rawStyle.color || seriesStyle.color || visualStyle.fill || node.color || DEFAULT_CIRCLE_PACKING_COLORS[index % DEFAULT_CIRCLE_PACKING_COLORS.length],
        stroke: itemStyle.borderColor || rawStyle.borderColor || seriesStyle.borderColor || '#ffffff',
        lineWidth: finiteNumber(itemStyle.borderWidth ?? rawStyle.borderWidth ?? seriesStyle.borderWidth, 1.2),
        opacity: finiteNumber(itemStyle.opacity ?? rawStyle.opacity ?? seriesStyle.opacity, 0.88)
    };
}
function formatLabel(formatter, node) {
    const params = {
        data: node.raw,
        name: node.name,
        value: node.value,
        percent: node.percent,
        depth: node.depth,
        node
    };
    if (typeof formatter === 'function') {
        return formatter(params);
    }
    if (typeof formatter === 'string') {
        return formatter
            .replace(/\{b\}/g, node.name)
            .replace(/\{c\}/g, String(node.value))
            .replace(/\{d\}/g, String(Math.round(node.percent * 100)))
            .replace(/\{p\}/g, `${Math.round(node.percent * 100)}%`);
    }
    return node.name;
}
function wrapText(text, maxWidth, fontSize, radius) {
    const maxChars = Math.max(3, Math.floor(maxWidth / Math.max(fontSize * 0.56, 1)));
    const maxLines = radius > fontSize * 3.2 ? 2 : 1;
    if (text.length <= maxChars)
        return text;
    const words = text.split(/\s+/).filter(Boolean);
    const lines = [];
    if (words.length > 1) {
        let current = '';
        words.forEach((word) => {
            const next = current ? `${current} ${word}` : word;
            if (next.length <= maxChars) {
                current = next;
            }
            else {
                if (current)
                    lines.push(current);
                current = word;
            }
        });
        if (current)
            lines.push(current);
    }
    else {
        for (let index = 0; index < text.length; index += maxChars) {
            lines.push(text.slice(index, index + maxChars));
        }
    }
    const visible = lines.slice(0, maxLines);
    const usedText = visible.join('').replace(/\s+/g, '');
    const originalText = text.replace(/\s+/g, '');
    if (usedText.length < originalText.length && visible.length) {
        const last = visible[visible.length - 1];
        visible[visible.length - 1] = `${last.slice(0, Math.max(0, maxChars - 3))}...`;
    }
    return visible.join('\n');
}
function createLegendVisualProvider(seriesModel) {
    return {
        getAllNames() {
            return collectDataNames(seriesModel.getRawData());
        },
        containName(name) {
            return seriesModel.getRawData().indexOfName(name) >= 0;
        },
        indexOfName(name) {
            return collectDataNames(seriesModel.getData()).indexOf(name);
        },
        getItemVisual(dataIndex, key) {
            if (key === 'legendIcon')
                return null;
            if (key !== 'style')
                return seriesModel.getData().getItemVisual(dataIndex, key);
            const itemModel = seriesModel.getData().getItemModel(dataIndex);
            const itemStyle = asRecord(itemModel.get('itemStyle'));
            return {
                fill: itemStyle.color || DEFAULT_CIRCLE_PACKING_COLORS[dataIndex % DEFAULT_CIRCLE_PACKING_COLORS.length],
                stroke: itemStyle.borderColor || '#ffffff',
                opacity: finiteNumber(itemStyle.opacity, 0.88)
            };
        }
    };
}
function collectDataNames(data) {
    const names = [];
    for (let index = 0; index < data.count(); index++) {
        names.push(data.getName(index));
    }
    return names;
}
function readRawItemStyle(raw) {
    const record = asRecord(raw);
    return asRecord(record.itemStyle);
}
function readEnterAnimation(seriesModel, itemIndex, animationOption = seriesModel.get('enterAnimation')) {
    if (seriesModel.get('animation') === false || animationOption === false)
        return disabledEnterAnimation();
    const option = animationOption == null || animationOption === true ? {} : asRecord(animationOption);
    if (option.show === false || option.enabled === false)
        return disabledEnterAnimation();
    const baseDelay = resolveAnimationNumber(option.delay ?? seriesModel.get('animationDelay'), itemIndex, itemIndex, 0);
    const stagger = resolveAnimationNumber(option.stagger, itemIndex, itemIndex, 24);
    return {
        enabled: true,
        duration: resolveAnimationNumber(option.duration ?? seriesModel.get('animationDuration'), itemIndex, itemIndex, 580),
        delay: baseDelay + itemIndex * stagger,
        easing: resolveAnimationEasing(option.easing ?? seriesModel.get('animationEasing'))
    };
}
function disabledEnterAnimation() {
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
function applyCircleEnterAnimation(element, radius, animation) {
    if (!animation.enabled)
        return;
    const animatable = element;
    if (typeof animatable.animate !== 'function')
        return;
    const shape = animatable.shape || {};
    const style = animatable.style || {};
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
function finiteNumber(value, fallback) {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
function isPlainObject(value) {
    return value != null && typeof value === 'object' && !Array.isArray(value);
}
function asRecord(value) {
    return isPlainObject(value) ? value : {};
}
function createHoverItem(element) {
    return {
        elements: [element],
        triggerElements: [element]
    };
}
function addHoverElement(item, element) {
    if (!item)
        return;
    item.elements.push(element);
    if (!item.triggerElements)
        item.triggerElements = [];
    item.triggerElements.push(element);
}
//# sourceMappingURL=circle-packing.js.map