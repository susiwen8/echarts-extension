import * as echarts from 'echarts/lib/echarts';
import { clearAliveRender, installElementHover, renderAlive } from '@echarts-extension/layout-core';
import { DEFAULT_PACK_BUBBLE_COLORS, resolvePackBubbleLayout } from './layout.js';
const echartsHost = echarts;
const optionKeys = [
    'padding',
    'gap',
    'minRadius',
    'maxRadius',
    'fillRatio',
    'center',
    'valueField',
    'nameField',
    'categoryField',
    'sort',
    'colors'
];
echartsHost.extendSeriesModel({
    type: 'series.packBubble',
    visualStyleAccessPath: 'itemStyle',
    visualDrawType: 'fill',
    getInitialData(option) {
        const source = Array.isArray(option.data) ? option.data : [];
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
        width: '86%',
        height: '86%',
        padding: 20,
        gap: 2,
        minRadius: null,
        maxRadius: null,
        fillRatio: 0.66,
        center: null,
        valueField: 'value',
        nameField: 'name',
        categoryField: 'category',
        sort: 'desc',
        colors: DEFAULT_PACK_BUBBLE_COLORS,
        enterAnimation: true,
        itemStyle: {
            opacity: 0.86,
            borderColor: '#ffffff',
            borderWidth: 1.4
        },
        label: {
            show: true,
            color: '#111827',
            fontSize: 12,
            fontWeight: 600,
            lineHeight: 14,
            minRadius: 22,
            formatter: null
        },
        emphasis: {
            itemStyle: {
                shadowBlur: 12,
                shadowColor: 'rgba(17, 24, 39, 0.24)'
            }
        }
    }
});
echartsHost.extendChartView({
    type: 'packBubble',
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
            const layout = resolvePackBubbleLayout(readLayoutOption(seriesModel, rect));
            if (this.__renderToken !== renderToken)
                return;
            const { hoverItems } = renderAlive(this, echartsHost, group, seriesModel, (targetGroup, targetSeriesModel) => (drawPackBubble(echartsHost, targetGroup, targetSeriesModel, layout, rect)));
            this.__hoverController = installElementHover(hoverItems, {
                zrender: api.getZr?.()
            });
        }
        catch (error) {
            if (typeof console !== 'undefined') {
                console.error('[packBubble] render failed', error);
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
function readLayoutOption(seriesModel, rect) {
    const option = seriesModel.option || {};
    const layoutOption = {
        data: Array.isArray(option.data) ? option.data : [],
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
function drawPackBubble(echartsInstance, group, seriesModel, layout, rect) {
    const data = seriesModel.getData();
    const chartGroup = new echartsInstance.graphic.Group();
    const hoverItems = [];
    const hoverItemsByDataIndex = new Map();
    chartGroup.x = rect.x;
    chartGroup.y = rect.y;
    layout.circles.forEach((circle, index) => {
        const itemModel = data.getItemModel(circle.dataIndex);
        const circleEl = new echartsInstance.graphic.Circle({
            shape: {
                cx: circle.x,
                cy: circle.y,
                r: circle.r
            },
            style: readCircleStyle(data, seriesModel, itemModel, circle, index)
        });
        applyCircleEnterAnimation(circleEl, circle.r, readEnterAnimation(seriesModel, index));
        data.setItemLayout(circle.dataIndex, [circle.x, circle.y]);
        data.setItemGraphicEl(circle.dataIndex, circleEl);
        const hoverItem = createHoverItem(circleEl);
        hoverItems.push(hoverItem);
        hoverItemsByDataIndex.set(circle.dataIndex, hoverItem);
        chartGroup.add(circleEl);
    });
    drawLabels(echartsInstance, chartGroup, seriesModel, data, layout.labels, hoverItemsByDataIndex);
    group.add(chartGroup);
    return hoverItems;
}
function drawLabels(echartsInstance, group, seriesModel, data, labels, hoverItemsByDataIndex) {
    labels.forEach((label) => {
        const itemModel = data.getItemModel(label.dataIndex);
        const labelModel = itemModel.getModel('label');
        const seriesLabelModel = seriesModel.getModel('label');
        const show = labelModel.get('show') ?? seriesLabelModel.get('show');
        const minRadius = finiteNumber(labelModel.get('minRadius') ?? seriesLabelModel.get('minRadius'), 22);
        if (!show || label.r < minRadius)
            return;
        const requestedFontSize = finiteNumber(labelModel.get('fontSize') ?? seriesLabelModel.get('fontSize'), 12);
        const fontSize = Math.min(requestedFontSize, Math.max(8, label.r * 0.34));
        const lineHeight = finiteNumber(labelModel.get('lineHeight') ?? seriesLabelModel.get('lineHeight'), fontSize + 2);
        const text = formatLabel(labelModel.get('formatter') || seriesLabelModel.get('formatter'), label);
        const textEl = new echartsInstance.graphic.Text({
            style: {
                x: label.x,
                y: label.y,
                text: wrapText(String(text), label.maxWidth, fontSize, label.r),
                fill: labelModel.get('color') || seriesLabelModel.get('color') || '#111827',
                fontSize,
                fontWeight: labelModel.get('fontWeight') || seriesLabelModel.get('fontWeight') || 600,
                lineHeight,
                align: 'center',
                verticalAlign: 'middle'
            },
            silent: true
        });
        applyFadeEnterAnimation(textEl, readEnterAnimation(seriesModel, label.dataIndex));
        addHoverElement(hoverItemsByDataIndex.get(label.dataIndex), textEl);
        group.add(textEl);
    });
}
function readCircleStyle(data, seriesModel, itemModel, circle, index) {
    const normal = asRecord(seriesModel.get('itemStyle'));
    const itemStyle = asRecord(itemModel.get('itemStyle'));
    const visualStyle = asRecord(data.getItemVisual(circle.dataIndex, 'style'));
    return {
        fill: itemStyle.color || normal.color || circle.color || visualStyle.fill || DEFAULT_PACK_BUBBLE_COLORS[index % DEFAULT_PACK_BUBBLE_COLORS.length],
        stroke: itemStyle.borderColor || normal.borderColor || '#ffffff',
        lineWidth: finiteNumber(itemStyle.borderWidth ?? normal.borderWidth, 1.4),
        opacity: finiteNumber(itemStyle.opacity ?? normal.opacity, 0.86)
    };
}
function formatLabel(formatter, label) {
    if (typeof formatter === 'function') {
        return formatter({
            data: label,
            name: label.name,
            value: label.value
        });
    }
    if (typeof formatter === 'string') {
        return formatter
            .replace(/\{b\}/g, label.name)
            .replace(/\{c\}/g, String(label.value ?? ''))
            .replace(/\{category\}/g, String(label.category ?? ''));
    }
    return label.name;
}
function wrapText(text, maxWidth, fontSize, radius) {
    const maxChars = Math.max(3, Math.floor(maxWidth / Math.max(fontSize * 0.56, 1)));
    const maxLines = radius > fontSize * 3.4 ? 2 : 1;
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
                fill: itemStyle.color || DEFAULT_PACK_BUBBLE_COLORS[dataIndex % DEFAULT_PACK_BUBBLE_COLORS.length],
                stroke: itemStyle.borderColor || '#ffffff',
                opacity: finiteNumber(itemStyle.opacity, 0.9)
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
function finiteNumber(value, fallback) {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
function readEnterAnimation(seriesModel, itemIndex, animationOption = seriesModel.get('enterAnimation')) {
    if (seriesModel.get('animation') === false || animationOption === false)
        return disabledEnterAnimation();
    const option = animationOption == null || animationOption === true ? {} : asRecord(animationOption);
    if (option.show === false || option.enabled === false)
        return disabledEnterAnimation();
    const baseDelay = resolveAnimationNumber(option.delay ?? seriesModel.get('animationDelay'), itemIndex, itemIndex, 0);
    const stagger = resolveAnimationNumber(option.stagger, itemIndex, itemIndex, 35);
    return {
        enabled: true,
        duration: resolveAnimationNumber(option.duration ?? seriesModel.get('animationDuration'), itemIndex, itemIndex, 540),
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
function asRecord(value) {
    return value != null && typeof value === 'object' && !Array.isArray(value) ? value : {};
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
//# sourceMappingURL=pack-bubble.js.map