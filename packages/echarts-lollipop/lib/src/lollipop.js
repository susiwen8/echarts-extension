import * as echarts from 'echarts/lib/echarts';
import { clearAliveRender, installElementHover, renderAlive } from '@echarts-extension/layout-core';
import { resolveLollipopLayout } from './layout.js';
const echartsHost = echarts;
const optionKeys = [
    'padding',
    'categoryField',
    'valueField',
    'nameField',
    'dimensions',
    'categories',
    'min',
    'max',
    'baseline',
    'tickCount',
    'nice'
];
const layerZ = {
    axis: 0,
    stem: 4,
    hit: 7,
    symbol: 8,
    label: 9
};
echartsHost.extendSeriesModel({
    type: 'series.lollipop',
    visualStyleAccessPath: 'itemStyle',
    visualDrawType: 'fill',
    getInitialData(option) {
        const source = Array.isArray(option.data) ? option.data : [];
        const dimensions = echartsHost.helper.createDimensions(source, {
            coordDimensions: ['value']
        });
        const list = new echartsHost.List(dimensions, this);
        list.initData(source);
        return list;
    },
    getTooltipPosition(dataIndex) {
        const layout = this.getData().getItemLayout(dataIndex);
        return Array.isArray(layout) ? layout : undefined;
    },
    defaultOption: {
        left: 'center',
        top: 'center',
        width: '94%',
        height: '84%',
        padding: {
            top: 36,
            right: 28,
            bottom: 78,
            left: 78
        },
        categoryField: 'category',
        valueField: 'value',
        nameField: null,
        dimensions: null,
        categories: null,
        min: null,
        max: null,
        baseline: 0,
        tickCount: 5,
        nice: true,
        large: false,
        symbolSize: 12,
        enterAnimation: true,
        grid: {
            show: true
        },
        valueAxis: {
            show: true,
            name: null,
            label: {
                show: true,
                color: '#c8c9cf',
                fontSize: 14,
                fontWeight: 500,
                formatter: '{value}'
            },
            splitLine: {
                show: true,
                lineStyle: {
                    color: '#2f3033',
                    width: 1,
                    opacity: 1,
                    type: 'solid'
                }
            },
            axisLine: {
                show: true,
                lineStyle: {
                    color: '#e5e7eb',
                    width: 1.2,
                    opacity: 1
                }
            },
            nameTextStyle: {
                color: '#aeb0b5',
                fontSize: 14,
                fontWeight: 600
            }
        },
        categoryAxis: {
            show: true,
            label: {
                show: true,
                color: '#d4d4d8',
                fontSize: 14,
                fontWeight: 500,
                rotate: 45,
                formatter: '{value}'
            }
        },
        stemStyle: {
            color: '#28aefc',
            width: 1.4,
            opacity: 0.95,
            type: 'solid'
        },
        itemStyle: {
            color: '#2db5ff',
            borderColor: '#2db5ff',
            borderWidth: 0,
            opacity: 1
        },
        label: {
            show: false,
            color: '#d4d4d8',
            fontSize: 12,
            fontWeight: 600,
            formatter: '{c}'
        },
        tooltip: {
            trigger: 'item'
        },
        emphasis: {
            itemStyle: {
                borderWidth: 2,
                shadowBlur: 8,
                shadowColor: 'rgba(45, 181, 255, 0.32)'
            }
        }
    }
});
echartsHost.extendChartView({
    type: 'lollipop',
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
            const layout = resolveLollipopLayout(readLayoutOption(seriesModel, rect));
            if (this.__renderToken !== renderToken)
                return;
            const { hoverItems } = renderAlive(this, echartsHost, group, seriesModel, (targetGroup, targetSeriesModel) => (drawLollipop(echartsHost, targetGroup, targetSeriesModel, layout, rect)));
            this.__hoverController = installElementHover(hoverItems, {
                zrender: api.getZr?.()
            });
        }
        catch (error) {
            if (typeof console !== 'undefined') {
                console.error('[lollipop] render failed', error);
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
function drawLollipop(echartsInstance, group, seriesModel, layout, rect) {
    const chartGroup = new echartsInstance.graphic.Group();
    chartGroup.x = rect.x;
    chartGroup.y = rect.y;
    drawAxes(echartsInstance, chartGroup, seriesModel, layout);
    const hoverItems = drawPoints(echartsInstance, chartGroup, seriesModel, layout, rect);
    group.add(chartGroup);
    return hoverItems;
}
function drawAxes(echartsInstance, group, seriesModel, layout) {
    const valueAxisModel = seriesModel.getModel('valueAxis');
    const categoryAxisModel = seriesModel.getModel('categoryAxis');
    const valueAxisVisible = valueAxisModel.get('show') !== false;
    const categoryAxisVisible = categoryAxisModel.get('show') !== false;
    if (seriesModel.getModel('grid').get('show') !== false && valueAxisVisible) {
        const splitLineModel = valueAxisModel.getModel('splitLine');
        if (splitLineModel.get('show') !== false) {
            const style = readLineStyle(splitLineModel.getModel('lineStyle'), {
                stroke: '#2f3033',
                lineWidth: 1,
                opacity: 1
            });
            layout.ticks.forEach((tick) => {
                group.add(new echartsInstance.graphic.Line({
                    shape: {
                        x1: tick.x1,
                        y1: tick.y,
                        x2: tick.x2,
                        y2: tick.y
                    },
                    style,
                    silent: true,
                    z2: layerZ.axis
                }));
            });
        }
        const axisLineModel = valueAxisModel.getModel('axisLine');
        if (axisLineModel.get('show') !== false) {
            group.add(new echartsInstance.graphic.Line({
                shape: {
                    x1: layout.plot.left,
                    y1: layout.baselineY,
                    x2: layout.plot.right,
                    y2: layout.baselineY
                },
                style: readLineStyle(axisLineModel.getModel('lineStyle'), {
                    stroke: '#e5e7eb',
                    lineWidth: 1.2,
                    opacity: 1
                }),
                silent: true,
                z2: layerZ.axis
            }));
        }
    }
    if (valueAxisVisible) {
        drawValueAxisLabels(echartsInstance, group, valueAxisModel, layout);
    }
    if (categoryAxisVisible) {
        drawCategoryAxisLabels(echartsInstance, group, categoryAxisModel, layout);
    }
}
function drawValueAxisLabels(echartsInstance, group, axisModel, layout) {
    const labelModel = axisModel.getModel('label');
    if (labelModel.get('show') === false)
        return;
    const fontSize = finiteNumber(labelModel.get('fontSize'), 14);
    layout.ticks.forEach((tick) => {
        group.add(new echartsInstance.graphic.Text({
            style: {
                x: layout.plot.left - 12,
                y: tick.y,
                text: formatAxisLabel(labelModel.get('formatter'), tick.value),
                fill: labelModel.get('color') || '#c8c9cf',
                fontSize,
                fontWeight: labelModel.get('fontWeight') || 500,
                align: 'right',
                verticalAlign: 'middle'
            },
            silent: true,
            z2: layerZ.axis
        }));
    });
    const axisName = axisModel.get('name');
    if (typeof axisName !== 'string' || !axisName)
        return;
    const nameStyle = asRecord(axisModel.get('nameTextStyle'));
    group.add(new echartsInstance.graphic.Text({
        style: {
            x: Math.max(16, layout.plot.left - 58),
            y: layout.plot.top + layout.plot.height / 2,
            text: axisName,
            fill: nameStyle.color || '#aeb0b5',
            fontSize: finiteNumber(nameStyle.fontSize, 14),
            fontWeight: nameStyle.fontWeight || 600,
            align: 'center',
            verticalAlign: 'middle'
        },
        rotation: -Math.PI / 2,
        originX: Math.max(16, layout.plot.left - 58),
        originY: layout.plot.top + layout.plot.height / 2,
        silent: true,
        z2: layerZ.axis
    }));
}
function drawCategoryAxisLabels(echartsInstance, group, axisModel, layout) {
    const labelModel = axisModel.getModel('label');
    if (labelModel.get('show') === false)
        return;
    const rotateDegrees = finiteNumber(labelModel.get('rotate'), 0);
    const rotation = rotateDegrees * Math.PI / 180;
    const fontSize = finiteNumber(labelModel.get('fontSize'), 14);
    layout.categoryLabels.forEach((label) => {
        group.add(new echartsInstance.graphic.Text({
            style: {
                x: label.x,
                y: label.y,
                text: formatAxisLabel(labelModel.get('formatter'), label.name),
                fill: labelModel.get('color') || '#d4d4d8',
                fontSize,
                fontWeight: labelModel.get('fontWeight') || 500,
                align: rotateDegrees ? 'right' : 'center',
                verticalAlign: rotateDegrees ? 'middle' : 'top'
            },
            rotation,
            originX: label.x,
            originY: label.y,
            silent: true,
            z2: layerZ.axis
        }));
    });
}
function drawPoints(echartsInstance, group, seriesModel, layout, rect) {
    const data = seriesModel.getData();
    const symbolSize = Math.max(0, finiteNumber(seriesModel.get('symbolSize'), 12));
    const silent = seriesModel.get('silent') === true;
    const mergedStems = silent && seriesModel.get('large') === true && drawMergedStems(echartsInstance, group, seriesModel, layout.points);
    const hoverItems = [];
    const hoverItemsByDataIndex = new Map();
    layout.points.forEach((point, pointIndex) => {
        if (point.dataIndex < 0 || point.dataIndex >= data.count())
            return;
        let itemModel;
        const readItemModel = () => {
            itemModel = itemModel || data.getItemModel(point.dataIndex);
            return itemModel;
        };
        const animation = readEnterAnimation(seriesModel, pointIndex);
        let stem = null;
        if (!mergedStems) {
            stem = new echartsInstance.graphic.Line({
                shape: {
                    x1: point.baseX,
                    y1: point.baseY,
                    x2: point.x,
                    y2: point.y
                },
                style: readStemStyle(seriesModel, readItemModel()),
                z2: layerZ.stem
            });
            applyStemEnterAnimation(stem, point, animation);
            stem.silent = silent;
            group.add(stem);
        }
        data.setItemLayout(point.dataIndex, [point.x + rect.x, point.y + rect.y]);
        let symbol = null;
        if (symbolSize > 0) {
            symbol = new echartsInstance.graphic.Circle({
                shape: {
                    cx: point.x,
                    cy: point.y,
                    r: symbolSize / 2
                },
                style: readPointStyle(data, seriesModel, readItemModel(), point),
                z2: layerZ.symbol
            });
            applyCircleEnterAnimation(symbol, symbolSize / 2, animation);
            symbol.silent = silent;
            if (silent)
                data.setItemGraphicEl(point.dataIndex, symbol);
            group.add(symbol);
        }
        if (silent)
            return;
        const hitCircle = new echartsInstance.graphic.Circle({
            shape: {
                cx: point.x,
                cy: point.y,
                r: Math.max(symbolSize / 2, 8)
            },
            style: {
                fill: 'rgba(0,0,0,0)',
                stroke: 'rgba(0,0,0,0)',
                opacity: 0
            },
            z2: layerZ.hit
        });
        data.setItemGraphicEl(point.dataIndex, hitCircle);
        group.add(hitCircle);
        const hoverItem = {
            elements: [stem, symbol].filter(Boolean),
            triggerElements: [hitCircle, stem, symbol].filter(Boolean)
        };
        hoverItems.push(hoverItem);
        hoverItemsByDataIndex.set(point.dataIndex, hoverItem);
    });
    drawPointLabels(echartsInstance, group, seriesModel, layout.points, hoverItemsByDataIndex);
    return hoverItems;
}
function drawMergedStems(echartsInstance, group, seriesModel, points) {
    if (!echartsInstance.graphic.makePath)
        return false;
    const path = points
        .filter((point) => point.dataIndex >= 0)
        .map((point) => `M${pathNumber(point.baseX)} ${pathNumber(point.baseY)}L${pathNumber(point.x)} ${pathNumber(point.y)}`)
        .join('');
    if (!path)
        return false;
    const stems = echartsInstance.graphic.makePath(path, {
        style: {
            ...readLineStyle(seriesModel.getModel('stemStyle'), {
                stroke: '#28aefc',
                lineWidth: 1.4,
                opacity: 0.95
            }),
            fill: null
        },
        silent: true,
        z2: layerZ.stem
    });
    group.add(stems);
    return true;
}
function drawPointLabels(echartsInstance, group, seriesModel, points, hoverItemsByDataIndex) {
    const seriesLabelModel = seriesModel.getModel('label');
    if (seriesLabelModel.get('show') !== true)
        return;
    points.forEach((point) => {
        const itemModel = seriesModel.getData().getItemModel(point.dataIndex);
        const itemLabelModel = itemModel.getModel('label');
        const show = itemLabelModel.get('show') ?? seriesLabelModel.get('show');
        if (show === false)
            return;
        const text = formatLabel(itemLabelModel.get('formatter') || seriesLabelModel.get('formatter'), point);
        const dy = point.y <= point.baseY ? -10 : 10;
        const label = new echartsInstance.graphic.Text({
            style: {
                x: point.x,
                y: point.y + dy,
                text: String(text),
                fill: itemLabelModel.get('color') || seriesLabelModel.get('color') || '#d4d4d8',
                fontSize: finiteNumber(itemLabelModel.get('fontSize'), finiteNumber(seriesLabelModel.get('fontSize'), 12)),
                fontWeight: itemLabelModel.get('fontWeight') || seriesLabelModel.get('fontWeight') || 600,
                align: 'center',
                verticalAlign: dy < 0 ? 'bottom' : 'top'
            },
            silent: true,
            z2: layerZ.label
        });
        applyFadeEnterAnimation(label, readEnterAnimation(seriesModel, point.dataIndex));
        addHoverElement(hoverItemsByDataIndex.get(point.dataIndex), label);
        group.add(label);
    });
}
function readStemStyle(seriesModel, itemModel) {
    const seriesStemModel = seriesModel.getModel('stemStyle');
    const itemStemModel = itemModel.getModel('stemStyle');
    return readLineStyle(itemStemModel, readLineStyle(seriesStemModel, {
        stroke: '#28aefc',
        lineWidth: 1.4,
        opacity: 0.95
    }));
}
function readPointStyle(data, seriesModel, itemModel, point) {
    const itemStyleModel = itemModel.getModel('itemStyle');
    const seriesItemStyleModel = seriesModel.getModel('itemStyle');
    const visualStyle = asRecord(data.getItemVisual(point.dataIndex, 'style'));
    const fill = itemStyleModel.get('color') || visualStyle.fill || seriesItemStyleModel.get('color') || '#2db5ff';
    return {
        fill,
        stroke: itemStyleModel.get('borderColor') || seriesItemStyleModel.get('borderColor') || fill,
        lineWidth: finiteNumber(itemStyleModel.get('borderWidth'), finiteNumber(seriesItemStyleModel.get('borderWidth'), 0)),
        opacity: finiteNumber(itemStyleModel.get('opacity'), finiteNumber(seriesItemStyleModel.get('opacity'), 1))
    };
}
function readLineStyle(model, defaults) {
    const color = model.get('color') || model.get('stroke') || defaults.stroke || defaults.color;
    const lineType = model.get('type') || defaults.type;
    return {
        stroke: color,
        lineWidth: finiteNumber(model.get('width'), finiteNumber(model.get('lineWidth'), finiteNumber(defaults.lineWidth, 1))),
        opacity: finiteNumber(model.get('opacity'), finiteNumber(defaults.opacity, 1)),
        lineDash: readLineDash(lineType)
    };
}
function readLineDash(type) {
    if (Array.isArray(type))
        return type.filter((item) => typeof item === 'number');
    if (type === 'dashed')
        return [5, 6];
    if (type === 'dotted')
        return [1.5, 5];
    return null;
}
function formatAxisLabel(formatter, value) {
    if (typeof formatter === 'function') {
        return String(formatter(value));
    }
    if (typeof formatter === 'string') {
        return formatter.replace(/\{value\}/g, String(value));
    }
    return String(value);
}
function formatLabel(formatter, point) {
    const params = {
        data: point.raw,
        name: point.name,
        value: point.value,
        category: point.category
    };
    if (typeof formatter === 'function') {
        return formatter(params);
    }
    if (typeof formatter === 'string') {
        return formatter
            .replace(/\{b\}/g, point.name)
            .replace(/\{c\}/g, String(point.value))
            .replace(/\{category\}/g, point.category);
    }
    return point.value;
}
function pathNumber(value) {
    return String(Math.round(value * 1000) / 1000);
}
function readEnterAnimation(seriesModel, itemIndex, animationOption = seriesModel.get('enterAnimation')) {
    if (seriesModel.get('animation') === false || animationOption === false)
        return disabledEnterAnimation();
    const option = animationOption == null || animationOption === true ? {} : asRecord(animationOption);
    if (option.show === false || option.enabled === false)
        return disabledEnterAnimation();
    const baseDelay = resolveAnimationNumber(option.delay ?? seriesModel.get('animationDelay'), itemIndex, itemIndex, 0);
    const stagger = resolveAnimationNumber(option.stagger, itemIndex, itemIndex, 36);
    return {
        enabled: true,
        duration: resolveAnimationNumber(option.duration ?? seriesModel.get('animationDuration'), itemIndex, itemIndex, 620),
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
function applyStemEnterAnimation(element, point, animation) {
    if (!animation.enabled)
        return;
    const animatable = element;
    if (typeof animatable.animate !== 'function')
        return;
    const shape = animatable.shape || {};
    shape.x2 = point.baseX;
    shape.y2 = point.baseY;
    animatable.shape = shape;
    animateGraphicProperty(animatable, 'shape', animation, {
        x2: point.x,
        y2: point.y
    });
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
function addHoverElement(item, element) {
    if (!item)
        return;
    item.elements.push(element);
    if (!item.triggerElements)
        item.triggerElements = [];
    item.triggerElements.push(element);
}
function finiteNumber(value, fallback) {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
function asRecord(value) {
    return value != null && typeof value === 'object' && !Array.isArray(value) ? value : {};
}
//# sourceMappingURL=lollipop.js.map