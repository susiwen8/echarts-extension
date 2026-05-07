import * as echarts from 'echarts/lib/echarts';
import { clearAliveRender, installElementHover, renderAlive } from '@echarts-extension/layout-core';
import { DEFAULT_MOSAIC_COLORS, resolveMosaicLayout } from './layout.js';
const echartsHost = echarts;
const optionKeys = [
    'padding',
    'gap',
    'xField',
    'yField',
    'valueField',
    'dimensions',
    'xCategories',
    'yCategories',
    'colors',
    'sort'
];
echartsHost.extendSeriesModel({
    type: 'series.mosaic',
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
        height: '82%',
        padding: 12,
        gap: 2,
        xField: 'x',
        yField: 'y',
        valueField: 'value',
        xCategories: null,
        yCategories: null,
        colors: DEFAULT_MOSAIC_COLORS,
        sort: false,
        enterAnimation: true,
        itemStyle: {
            opacity: 0.92,
            borderColor: '#ffffff',
            borderWidth: 1
        },
        label: {
            show: true,
            color: '#111827',
            fontSize: 12,
            fontWeight: 600,
            lineHeight: null,
            formatter: null
        },
        emphasis: {
            itemStyle: {
                shadowBlur: 8,
                shadowColor: 'rgba(31, 41, 55, 0.2)'
            }
        }
    }
});
echartsHost.extendChartView({
    type: 'mosaic',
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
            const layout = resolveMosaicLayout(readLayoutOption(seriesModel, rect));
            if (this.__renderToken !== renderToken)
                return;
            const { hoverItems } = renderAlive(this, echartsHost, group, seriesModel, (targetGroup, targetSeriesModel) => (drawMosaic(echartsHost, targetGroup, targetSeriesModel, layout, rect)));
            this.__hoverController = installElementHover(hoverItems, {
                zrender: api.getZr?.()
            });
        }
        catch (error) {
            if (typeof console !== 'undefined') {
                console.error('[mosaic] render failed', error);
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
function drawMosaic(echartsInstance, group, seriesModel, layout, rect) {
    const data = seriesModel.getData();
    const chartGroup = new echartsInstance.graphic.Group();
    const hoverItems = [];
    const hoverItemsByDataIndex = new Map();
    chartGroup.x = rect.x;
    chartGroup.y = rect.y;
    layout.tiles.forEach((tile, index) => {
        const itemModel = tile.dataIndex >= 0 && tile.dataIndex < data.count() ? data.getItemModel(tile.dataIndex) : null;
        const rectEl = new echartsInstance.graphic.Rect({
            shape: {
                x: tile.x,
                y: tile.y,
                width: tile.width,
                height: tile.height
            },
            style: readTileStyle(data, seriesModel, itemModel, tile, index)
        });
        applyRectEnterAnimation(rectEl, tile, readEnterAnimation(seriesModel, index));
        if (itemModel && tile.dataIndex >= 0 && tile.dataIndex < data.count()) {
            data.setItemLayout(tile.dataIndex, [tile.x, tile.y, tile.width, tile.height]);
            data.setItemGraphicEl(tile.dataIndex, rectEl);
            const hoverItem = createHoverItem(rectEl);
            hoverItems.push(hoverItem);
            hoverItemsByDataIndex.set(tile.dataIndex, hoverItem);
        }
        chartGroup.add(rectEl);
    });
    drawLabels(echartsInstance, chartGroup, seriesModel, data, layout.tiles, hoverItemsByDataIndex);
    group.add(chartGroup);
    return hoverItems;
}
function drawLabels(echartsInstance, group, seriesModel, data, tiles, hoverItemsByDataIndex) {
    const seriesLabelModel = seriesModel.getModel('label');
    if (!seriesLabelModel.get('show'))
        return;
    tiles.forEach((tile) => {
        const itemModel = tile.dataIndex >= 0 && tile.dataIndex < data.count() ? data.getItemModel(tile.dataIndex) : null;
        const itemLabelModel = itemModel?.getModel('label');
        const show = itemLabelModel?.get('show') ?? seriesLabelModel.get('show');
        if (!show)
            return;
        const baseFontSize = finiteNumber(itemLabelModel?.get('fontSize') ?? seriesLabelModel.get('fontSize'), 12);
        if (tile.width < Math.max(22, baseFontSize * 2) || tile.height < Math.max(14, baseFontSize * 1.2))
            return;
        const fontSize = Math.min(baseFontSize, Math.max(8, Math.min(tile.height * 0.36, tile.width * 0.18)));
        const lineHeight = finiteNumber(itemLabelModel?.get('lineHeight') ?? seriesLabelModel.get('lineHeight'), fontSize + 3);
        const maxChars = Math.max(3, Math.floor(Math.max(tile.width - 8, 1) / Math.max(fontSize * 0.56, 1)));
        const text = formatLabel(itemLabelModel?.get('formatter') || seriesLabelModel.get('formatter'), tile);
        const labelEl = new echartsInstance.graphic.Text({
            style: {
                x: tile.x + tile.width / 2,
                y: tile.y + tile.height / 2,
                text: wrapText(String(text), maxChars, Math.max(1, Math.floor(tile.height / lineHeight))),
                fill: itemLabelModel?.get('color') || seriesLabelModel.get('color') || '#111827',
                fontSize,
                fontWeight: itemLabelModel?.get('fontWeight') || seriesLabelModel.get('fontWeight') || 600,
                lineHeight,
                align: 'center',
                verticalAlign: 'middle'
            },
            silent: true
        });
        applyFadeEnterAnimation(labelEl, readEnterAnimation(seriesModel, tile.dataIndex));
        addHoverElement(hoverItemsByDataIndex.get(tile.dataIndex), labelEl);
        group.add(labelEl);
    });
}
function readTileStyle(data, seriesModel, itemModel, tile, index) {
    const seriesStyle = asRecord(seriesModel.get('itemStyle'));
    const itemStyle = itemModel ? asRecord(itemModel.get('itemStyle')) : {};
    const visualStyle = tile.dataIndex >= 0 && tile.dataIndex < data.count()
        ? asRecord(data.getItemVisual(tile.dataIndex, 'style'))
        : {};
    return {
        fill: itemStyle.color || seriesStyle.color || visualStyle.fill || tile.color || DEFAULT_MOSAIC_COLORS[index % DEFAULT_MOSAIC_COLORS.length],
        stroke: itemStyle.borderColor || seriesStyle.borderColor || '#ffffff',
        lineWidth: finiteNumber(itemStyle.borderWidth ?? seriesStyle.borderWidth, 1),
        opacity: finiteNumber(itemStyle.opacity ?? seriesStyle.opacity, 0.92)
    };
}
function formatLabel(formatter, tile) {
    const params = {
        data: tile.raw,
        name: tile.name,
        value: tile.value,
        percent: tile.percent,
        columnPercent: tile.columnPercent,
        xCategory: tile.xCategory,
        yCategory: tile.yCategory
    };
    if (typeof formatter === 'function') {
        return formatter(params);
    }
    if (typeof formatter === 'string') {
        return formatter
            .replace(/\{b\}/g, tile.name)
            .replace(/\{c\}/g, String(tile.value))
            .replace(/\{d\}/g, String(Math.round(tile.percent * 100)))
            .replace(/\{x\}/g, tile.xCategory)
            .replace(/\{y\}/g, tile.yCategory);
    }
    return tile.name;
}
function wrapText(value, maxChars, maxLines) {
    if (maxLines <= 1)
        return value.length > maxChars ? `${value.slice(0, Math.max(1, maxChars - 1))}...` : value;
    if (value.length <= maxChars)
        return value;
    const words = value.split(/\s+/).filter(Boolean);
    const lines = [];
    let current = '';
    if (words.length <= 1) {
        for (let index = 0; index < value.length && lines.length < maxLines; index += maxChars) {
            lines.push(value.slice(index, index + maxChars));
        }
        return trimLines(lines, maxLines, maxChars);
    }
    words.forEach((word) => {
        if (lines.length >= maxLines)
            return;
        const next = current ? `${current} ${word}` : word;
        if (next.length <= maxChars) {
            current = next;
            return;
        }
        if (current)
            lines.push(current);
        current = word.length > maxChars ? word.slice(0, maxChars) : word;
    });
    if (current && lines.length < maxLines)
        lines.push(current);
    return trimLines(lines, maxLines, maxChars);
}
function trimLines(lines, maxLines, maxChars) {
    const visible = lines.slice(0, maxLines);
    if (lines.length > maxLines && visible.length) {
        const last = visible[visible.length - 1];
        visible[visible.length - 1] = `${last.slice(0, Math.max(1, maxChars - 1))}...`;
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
                fill: itemStyle.color || DEFAULT_MOSAIC_COLORS[dataIndex % DEFAULT_MOSAIC_COLORS.length],
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
function readEnterAnimation(seriesModel, itemIndex, animationOption = seriesModel.get('enterAnimation')) {
    if (seriesModel.get('animation') === false || animationOption === false)
        return disabledEnterAnimation();
    const option = animationOption == null || animationOption === true ? {} : asRecord(animationOption);
    if (option.show === false || option.enabled === false)
        return disabledEnterAnimation();
    const baseDelay = resolveAnimationNumber(option.delay ?? seriesModel.get('animationDelay'), itemIndex, itemIndex, 0);
    const stagger = resolveAnimationNumber(option.stagger, itemIndex, itemIndex, 28);
    return {
        enabled: true,
        duration: resolveAnimationNumber(option.duration ?? seriesModel.get('animationDuration'), itemIndex, itemIndex, 560),
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
function applyRectEnterAnimation(element, tile, animation) {
    if (!animation.enabled)
        return;
    const animatable = element;
    if (typeof animatable.animate !== 'function')
        return;
    const shape = animatable.shape || {};
    const style = animatable.style || {};
    const opacity = finiteNumber(style.opacity, 1);
    shape.width = 0;
    style.opacity = 0;
    animatable.shape = shape;
    animatable.style = style;
    animateGraphicProperty(animatable, 'shape', animation, { width: tile.width });
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
//# sourceMappingURL=mosaic.js.map