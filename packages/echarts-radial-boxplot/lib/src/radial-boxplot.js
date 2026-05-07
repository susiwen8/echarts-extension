import * as echarts from 'echarts/lib/echarts';
import { clearAliveRender, installElementHover, renderAlive } from '@echarts-extension/layout-core';
import { resolveRadialBoxplotLayout } from './layout.js';
const echartsHost = echarts;
const optionKeys = [
    'padding',
    'center',
    'radius',
    'innerRadius',
    'outerRadius',
    'startAngle',
    'endAngle',
    'angleSpan',
    'clockwise',
    'categoryField',
    'nameField',
    'minField',
    'q1Field',
    'medianField',
    'q3Field',
    'maxField',
    'dimensions',
    'categories',
    'min',
    'max',
    'tickCount',
    'nice',
    'boxWidth',
    'capWidth',
    'labelRadius'
];
const layerZ = {
    axis: 0,
    box: 3,
    whisker: 4,
    median: 5,
    hit: 8
};
echartsHost.extendSeriesModel({
    type: 'series.radialBoxplot',
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
        width: '96%',
        height: '96%',
        padding: 36,
        center: null,
        radius: null,
        innerRadius: '18%',
        outerRadius: '82%',
        labelRadius: null,
        startAngle: 90,
        angleSpan: 360,
        clockwise: true,
        categoryField: 'name',
        nameField: null,
        minField: 'min',
        q1Field: 'q1',
        medianField: 'median',
        q3Field: 'q3',
        maxField: 'max',
        dimensions: null,
        categories: null,
        min: null,
        max: null,
        tickCount: 7,
        nice: true,
        boxWidth: 0.58,
        capWidth: 0.34,
        enterAnimation: true,
        grid: {
            show: true
        },
        radialAxis: {
            show: true,
            label: {
                show: true,
                color: '#9aa0a6',
                fontSize: 13,
                formatter: '{value}'
            },
            splitLine: {
                show: true,
                lineStyle: {
                    color: '#d8dee8',
                    width: 1,
                    type: 'dashed',
                    opacity: 0.62
                }
            }
        },
        angleAxis: {
            show: true,
            label: {
                show: true,
                color: '#8d949e',
                fontSize: 14,
                formatter: '{value}',
                rotate: 'tangential'
            },
            splitLine: {
                show: false,
                lineStyle: {
                    color: '#d8dee8',
                    width: 1,
                    type: 'dashed',
                    opacity: 0.5
                }
            }
        },
        itemStyle: {
            color: '#2f83ed',
            borderColor: '#111111',
            borderWidth: 1.2,
            opacity: 0.96
        },
        whiskerLineStyle: {
            color: '#111111',
            width: 1.2,
            opacity: 1,
            type: 'solid'
        },
        medianLineStyle: {
            color: '#111111',
            width: 1.2,
            opacity: 1,
            type: 'solid'
        },
        capLineStyle: {
            color: '#111111',
            width: 1.2,
            opacity: 1,
            type: 'solid'
        },
        tooltip: {
            trigger: 'item'
        },
        emphasis: {
            itemStyle: {
                borderWidth: 2,
                shadowBlur: 7,
                shadowColor: 'rgba(17, 24, 39, 0.24)'
            }
        }
    }
});
echartsHost.extendChartView({
    type: 'radialBoxplot',
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
            const layout = resolveRadialBoxplotLayout(readLayoutOption(seriesModel, rect));
            if (this.__renderToken !== renderToken)
                return;
            const { hoverItems } = renderAlive(this, echartsHost, group, seriesModel, (targetGroup, targetSeriesModel) => (drawRadialBoxplot(echartsHost, targetGroup, targetSeriesModel, layout, rect)));
            this.__hoverController = installElementHover(hoverItems, {
                zrender: api.getZr?.()
            });
        }
        catch (error) {
            if (typeof console !== 'undefined') {
                console.error('[radialBoxplot] render failed', error);
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
function drawRadialBoxplot(echartsInstance, group, seriesModel, layout, rect) {
    const chartGroup = new echartsInstance.graphic.Group();
    const hoverItems = [];
    const hoverItemsByDataIndex = new Map();
    chartGroup.x = rect.x;
    chartGroup.y = rect.y;
    drawGrid(echartsInstance, chartGroup, seriesModel, layout);
    drawBoxes(echartsInstance, chartGroup, seriesModel, layout, hoverItems, hoverItemsByDataIndex);
    drawWhiskers(echartsInstance, chartGroup, seriesModel, layout, hoverItemsByDataIndex);
    drawHitAreas(echartsInstance, chartGroup, seriesModel, layout, rect, hoverItemsByDataIndex);
    group.add(chartGroup);
    return hoverItems;
}
function drawGrid(echartsInstance, group, seriesModel, layout) {
    const gridModel = seriesModel.getModel('grid');
    if (gridModel.get('show') === false)
        return;
    const radialAxisModel = seriesModel.getModel('radialAxis');
    const angleAxisModel = seriesModel.getModel('angleAxis');
    const radialSplitLineModel = radialAxisModel.getModel('splitLine');
    const angleSplitLineModel = angleAxisModel.getModel('splitLine');
    const radialLabelModel = radialAxisModel.getModel('label');
    const angleLabelModel = angleAxisModel.getModel('label');
    const option = seriesModel.option || {};
    const radialAxisOption = asRecord(option.radialAxis);
    const angleAxisOption = asRecord(option.angleAxis);
    const radialAxisVisible = radialAxisOption.show !== false && radialAxisModel.get('show') !== false;
    const angleAxisVisible = angleAxisOption.show !== false && angleAxisModel.get('show') !== false;
    const radialSplitLineVisible = nestedOptionValue(radialAxisOption, 'splitLine', 'show') !== false && radialSplitLineModel.get('show') !== false;
    const angleSplitLineVisible = nestedOptionValue(angleAxisOption, 'splitLine', 'show') === true || angleSplitLineModel.get('show') === true;
    const radialLabelVisible = nestedOptionValue(radialAxisOption, 'label', 'show') !== false && radialLabelModel.get('show') !== false;
    const angleLabelVisible = nestedOptionValue(angleAxisOption, 'label', 'show') !== false && angleLabelModel.get('show') !== false;
    if (radialAxisVisible && radialSplitLineVisible) {
        const style = readLineStyle(radialSplitLineModel.getModel('lineStyle'), {
            stroke: '#d8dee8',
            lineWidth: 1,
            opacity: 0.62,
            lineDash: [5, 7]
        });
        layout.radialTicks.forEach((tick) => {
            group.add(new echartsInstance.graphic.Circle({
                shape: {
                    cx: layout.centerX,
                    cy: layout.centerY,
                    r: tick.radius
                },
                style: {
                    ...style,
                    fill: null
                },
                silent: true,
                z2: layerZ.axis
            }));
        });
    }
    if (angleAxisVisible && angleSplitLineVisible) {
        const style = readLineStyle(angleSplitLineModel.getModel('lineStyle'), {
            stroke: '#d8dee8',
            lineWidth: 1,
            opacity: 0.5,
            lineDash: [5, 7]
        });
        layout.angleLabels.forEach((label) => {
            const inner = polarPoint(layout.centerX, layout.centerY, Math.max(layout.innerRadius - 2, 0), label.angle);
            const outer = polarPoint(layout.centerX, layout.centerY, layout.outerRadius, label.angle);
            group.add(new echartsInstance.graphic.Line({
                shape: {
                    x1: inner.x,
                    y1: inner.y,
                    x2: outer.x,
                    y2: outer.y
                },
                style,
                silent: true,
                z2: layerZ.axis
            }));
        });
    }
    if (radialAxisVisible && radialLabelVisible) {
        layout.radialTicks.forEach((tick) => {
            const point = polarPoint(layout.centerX, layout.centerY, tick.radius, layout.startAngle);
            group.add(new echartsInstance.graphic.Text({
                style: {
                    x: point.x + 8,
                    y: point.y,
                    text: formatAxisLabel(radialLabelModel.get('formatter'), tick.value),
                    fill: radialLabelModel.get('color') || '#9aa0a6',
                    fontSize: finiteNumber(radialLabelModel.get('fontSize'), 13),
                    fontWeight: radialLabelModel.get('fontWeight') || 400,
                    align: 'left',
                    verticalAlign: 'middle'
                },
                silent: true,
                z2: layerZ.axis
            }));
        });
    }
    if (angleAxisVisible && angleLabelVisible) {
        layout.angleLabels.forEach((label) => {
            const rotate = angleLabelModel.get('rotate');
            const shouldRotate = rotate === true || rotate === 'tangential';
            group.add(new echartsInstance.graphic.Text({
                style: {
                    x: label.x,
                    y: label.y,
                    text: formatAxisLabel(angleLabelModel.get('formatter'), label.name),
                    fill: angleLabelModel.get('color') || '#8d949e',
                    fontSize: finiteNumber(angleLabelModel.get('fontSize'), 14),
                    fontWeight: angleLabelModel.get('fontWeight') || 400,
                    align: shouldRotate ? 'center' : label.align,
                    verticalAlign: shouldRotate ? 'middle' : label.verticalAlign
                },
                rotation: shouldRotate ? label.rotation : 0,
                originX: label.x,
                originY: label.y,
                silent: true,
                z2: layerZ.axis
            }));
        });
    }
}
function drawBoxes(echartsInstance, group, seriesModel, layout, hoverItems, hoverItemsByDataIndex) {
    const data = seriesModel.getData();
    layout.boxes.forEach((box, index) => {
        const itemModel = data.getItemModel(box.dataIndex);
        const style = readBoxStyle(data, seriesModel, itemModel, box);
        const boxElement = createPathOrPolygon(echartsInstance, box.boxPath, box.boxPoints, {
            fill: style.fill,
            stroke: style.stroke,
            lineWidth: style.lineWidth,
            opacity: style.opacity
        }, true, layerZ.box);
        const hoverItem = createHoverItem(boxElement);
        hoverItems.push(hoverItem);
        hoverItemsByDataIndex.set(box.dataIndex, hoverItem);
        group.add(boxElement);
    });
}
function drawWhiskers(echartsInstance, group, seriesModel, layout, hoverItemsByDataIndex) {
    const whiskerStyle = readLineStyle(seriesModel.getModel('whiskerLineStyle'), {
        stroke: '#111111',
        lineWidth: 1.2,
        opacity: 1
    });
    const medianStyle = readLineStyle(seriesModel.getModel('medianLineStyle'), {
        stroke: '#111111',
        lineWidth: 1.2,
        opacity: 1
    });
    const capStyle = readLineStyle(seriesModel.getModel('capLineStyle'), whiskerStyle);
    layout.boxes.forEach((box, index) => {
        const animation = readEnterAnimation(seriesModel, index);
        [box.lowerWhisker, box.upperWhisker].forEach((lineShape) => {
            const line = new echartsInstance.graphic.Line({
                shape: { ...lineShape },
                style: whiskerStyle,
                silent: true,
                z2: layerZ.whisker
            });
            applyLineEnterAnimation(line, animation);
            addHoverElement(hoverItemsByDataIndex.get(box.dataIndex), line);
            group.add(line);
        });
        [box.minCapPath, box.maxCapPath].forEach((path, capIndex) => {
            const points = capIndex === 0 ? box.minCapPoints : box.maxCapPoints;
            const cap = createPathOrPolyline(echartsInstance, path, points, capStyle, true, layerZ.whisker);
            applyPathEnterAnimation(cap, 'style', 'strokePercent', animation);
            addHoverElement(hoverItemsByDataIndex.get(box.dataIndex), cap);
            group.add(cap);
        });
        const median = createPathOrPolyline(echartsInstance, box.medianPath, box.medianPoints, medianStyle, true, layerZ.median);
        applyPathEnterAnimation(median, 'style', 'strokePercent', animation);
        addHoverElement(hoverItemsByDataIndex.get(box.dataIndex), median);
        group.add(median);
    });
}
function drawHitAreas(echartsInstance, group, seriesModel, layout, rect, hoverItemsByDataIndex) {
    const data = seriesModel.getData();
    layout.boxes.forEach((box) => {
        if (box.dataIndex < 0 || box.dataIndex >= data.count())
            return;
        data.setItemLayout(box.dataIndex, [box.medianX + rect.x, box.medianY + rect.y]);
        const hitArea = createPathOrPolygon(echartsInstance, box.boxPath, box.boxPoints, {
            fill: 'rgba(0,0,0,0)',
            stroke: 'rgba(0,0,0,0)',
            opacity: 0
        }, false, layerZ.hit);
        data.setItemGraphicEl(box.dataIndex, hitArea);
        addHoverElement(hoverItemsByDataIndex.get(box.dataIndex), hitArea);
        group.add(hitArea);
    });
}
function createPathOrPolygon(echartsInstance, path, points, style, silent, z2) {
    if (echartsInstance.graphic.makePath) {
        return echartsInstance.graphic.makePath(path, {
            style,
            silent,
            z2
        });
    }
    return new echartsInstance.graphic.Polygon({
        shape: {
            points
        },
        style,
        silent,
        z2
    });
}
function createPathOrPolyline(echartsInstance, path, points, style, silent, z2) {
    if (echartsInstance.graphic.makePath) {
        return echartsInstance.graphic.makePath(path, {
            style: {
                ...style,
                fill: null
            },
            silent,
            z2
        });
    }
    return new echartsInstance.graphic.Polyline({
        shape: {
            points
        },
        style: {
            ...style,
            fill: null
        },
        silent,
        z2
    });
}
function readBoxStyle(data, seriesModel, itemModel, box) {
    const itemStyleModel = itemModel.getModel('itemStyle');
    const seriesItemStyleModel = seriesModel.getModel('itemStyle');
    const visualStyle = asRecord(data.getItemVisual(box.dataIndex, 'style'));
    return {
        fill: itemStyleModel.get('color') || visualStyle.fill || seriesItemStyleModel.get('color') || '#2f83ed',
        stroke: itemStyleModel.get('borderColor') || seriesItemStyleModel.get('borderColor') || '#111111',
        lineWidth: finiteNumber(itemStyleModel.get('borderWidth'), finiteNumber(seriesItemStyleModel.get('borderWidth'), 1.2)),
        opacity: finiteNumber(itemStyleModel.get('opacity'), finiteNumber(seriesItemStyleModel.get('opacity'), 0.96))
    };
}
function readLineStyle(model, defaults) {
    const lineType = model.get('type') || defaults.type;
    return {
        stroke: model.get('color') || model.get('stroke') || defaults.stroke,
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
function polarPoint(centerX, centerY, radius, angle) {
    const radians = angle * Math.PI / 180;
    return {
        x: centerX + Math.cos(radians) * radius,
        y: centerY - Math.sin(radians) * radius
    };
}
function readEnterAnimation(seriesModel, itemIndex, animationOption = seriesModel.get('enterAnimation')) {
    if (seriesModel.get('animation') === false || animationOption === false)
        return disabledEnterAnimation();
    const option = animationOption == null || animationOption === true ? {} : asRecord(animationOption);
    if (option.show === false || option.enabled === false)
        return disabledEnterAnimation();
    const baseDelay = resolveAnimationNumber(option.delay ?? seriesModel.get('animationDelay'), itemIndex, itemIndex, 0);
    const stagger = resolveAnimationNumber(option.stagger, itemIndex, itemIndex, 34);
    return {
        enabled: true,
        duration: resolveAnimationNumber(option.duration ?? seriesModel.get('animationDuration'), itemIndex, itemIndex, 680),
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
function applyPathEnterAnimation(element, targetKey, propertyName, animation) {
    if (!animation.enabled)
        return;
    const animatable = element;
    if (typeof animatable.animate !== 'function')
        return;
    const target = animatable[targetKey] || {};
    target[propertyName] = 0;
    animatable[targetKey] = target;
    animateGraphicProperty(animatable, targetKey, animation, { [propertyName]: 1 });
}
function applyLineEnterAnimation(element, animation) {
    if (!animation.enabled)
        return;
    const animatable = element;
    if (typeof animatable.animate !== 'function')
        return;
    const shape = animatable.shape || {};
    shape.percent = 0;
    animatable.shape = shape;
    animateGraphicProperty(animatable, 'shape', animation, { percent: 1 });
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
    return Object.prototype.toString.call(value) === '[object Object]' ? value : {};
}
function nestedOptionValue(record, parentKey, childKey) {
    return asRecord(record[parentKey])[childKey];
}
function finiteNumber(value, fallback) {
    const numberValue = typeof value === 'number'
        ? value
        : typeof value === 'string' && value.trim() !== ''
            ? Number(value)
            : NaN;
    return Number.isFinite(numberValue) ? numberValue : fallback;
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
//# sourceMappingURL=radial-boxplot.js.map