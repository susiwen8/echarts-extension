import * as echarts from 'echarts/lib/echarts';
import { clearAliveRender, installElementHover, renderAlive } from '@echarts-extension/layout-core';
import { resolveVectorFieldLayout } from './layout.js';
const echartsHost = echarts;
const optionKeys = [
    'padding',
    'xExtent',
    'yExtent',
    'xField',
    'yField',
    'uField',
    'vField',
    'invertY',
    'samplingStep',
    'minLength',
    'maxLength',
    'lengthScale',
    'arrowHeadLength',
    'arrowHeadAngle'
];
echartsHost.extendSeriesModel({
    type: 'series.vectorField',
    visualStyleAccessPath: 'lineStyle',
    visualDrawType: 'stroke',
    getInitialData(option) {
        const source = Array.isArray(option.data) ? option.data : [];
        const dimensions = echartsHost.helper.createDimensions(source, {
            coordDimensions: ['x', 'y', 'u', 'v', 'value']
        });
        const list = new echartsHost.List(dimensions, this);
        list.initData(source);
        return list;
    },
    defaultOption: {
        left: 'center',
        top: 'center',
        width: '94%',
        height: '82%',
        padding: 18,
        xField: 'longitude',
        yField: 'latitude',
        uField: 'u',
        vField: 'v',
        invertY: true,
        samplingStep: 1,
        minLength: 0,
        maxLength: null,
        lengthScale: null,
        arrowHeadLength: null,
        arrowHeadAngle: null,
        enterAnimation: true,
        lineStyle: {
            color: '#2563eb',
            width: 1.15,
            opacity: 0.86
        },
        emphasis: {
            itemStyle: {
                opacity: 1,
                width: 1.8,
                shadowBlur: 6,
                shadowColor: 'rgba(37, 99, 235, 0.28)'
            }
        },
        tooltip: {
            trigger: 'item'
        }
    }
});
echartsHost.extendChartView({
    type: 'vectorField',
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
            const layout = resolveVectorFieldLayout(readLayoutOption(seriesModel, rect));
            if (this.__renderToken !== renderToken)
                return;
            const { hoverItems } = renderAlive(this, echartsHost, group, seriesModel, (targetGroup, targetSeriesModel) => (drawVectorField(echartsHost, targetGroup, targetSeriesModel, layout, rect)));
            this.__hoverController = installElementHover(hoverItems, {
                dimOpacity: 0.2,
                zrender: api.getZr?.()
            });
        }
        catch (error) {
            if (typeof console !== 'undefined') {
                console.error('[vectorField] render failed', error);
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
function drawVectorField(echartsInstance, group, seriesModel, layout, rect) {
    const data = seriesModel.getData();
    const chartGroup = new echartsInstance.graphic.Group();
    const hoverItems = [];
    chartGroup.x = rect.x;
    chartGroup.y = rect.y;
    layout.items.forEach((item, itemIndex) => {
        if (item.dataIndex < 0 || item.dataIndex >= data.count())
            return;
        const itemModel = data.getItemModel(item.dataIndex);
        const element = createArrowElement(echartsInstance, item, resolveArrowStyle(data, seriesModel, itemModel, item.dataIndex, itemIndex));
        animateEnter(element, itemIndex, resolveEnterAnimation(seriesModel, itemIndex));
        data.setItemLayout(item.dataIndex, [item.x, item.y]);
        data.setItemGraphicEl(item.dataIndex, element);
        enableHover(element, itemModel);
        chartGroup.add(element);
        hoverItems.push({
            elements: [element]
        });
    });
    group.add(chartGroup);
    return hoverItems;
}
function createArrowElement(echartsInstance, item, style) {
    const path = [
        `M ${formatPathNumber(item.startX)} ${formatPathNumber(item.startY)}`,
        `L ${formatPathNumber(item.endX)} ${formatPathNumber(item.endY)}`,
        `M ${formatPathNumber(item.headLeftX)} ${formatPathNumber(item.headLeftY)}`,
        `L ${formatPathNumber(item.endX)} ${formatPathNumber(item.endY)}`,
        `L ${formatPathNumber(item.headRightX)} ${formatPathNumber(item.headRightY)}`
    ].join(' ');
    if (echartsInstance.graphic.makePath) {
        const element = echartsInstance.graphic.makePath(path, {
            style,
            silent: false
        });
        element.silent = false;
        return element;
    }
    return new echartsInstance.graphic.Line({
        shape: {
            x1: item.startX,
            y1: item.startY,
            x2: item.endX,
            y2: item.endY
        },
        style,
        silent: false
    });
}
function resolveArrowStyle(data, seriesModel, itemModel, dataIndex, itemIndex) {
    const normal = asRecord(seriesModel.get('lineStyle'));
    const itemLineStyle = asRecord(itemModel.get('lineStyle'));
    const itemStyle = asRecord(itemModel.get('itemStyle'));
    const visualStyle = asRecord(data.getItemVisual(dataIndex, 'style'));
    const color = itemLineStyle.color
        || itemStyle.color
        || normal.color
        || visualStyle.stroke
        || visualStyle.fill
        || DEFAULT_COLORS[itemIndex % DEFAULT_COLORS.length];
    return {
        stroke: color,
        fill: null,
        lineWidth: finiteNumber(itemLineStyle.width ?? itemStyle.width ?? normal.width, 1.15),
        opacity: finiteNumber(itemLineStyle.opacity ?? itemStyle.opacity ?? normal.opacity, 0.86),
        lineCap: 'round',
        lineJoin: 'round',
        shadowBlur: itemLineStyle.shadowBlur ?? itemStyle.shadowBlur ?? normal.shadowBlur,
        shadowColor: itemLineStyle.shadowColor ?? itemStyle.shadowColor ?? normal.shadowColor
    };
}
function resolveEnterAnimation(seriesModel, index) {
    if (seriesModel.get('animation') === false)
        return disabledAnimation();
    const raw = seriesModel.get('enterAnimation');
    if (raw === false)
        return disabledAnimation();
    const config = raw == null || raw === true ? {} : asRecord(raw);
    if (config.show === false || config.enabled === false)
        return disabledAnimation();
    const duration = finiteNumber(config.duration ?? seriesModel.get('animationDuration'), 520);
    const delay = resolveAnimationValue(config.delay ?? seriesModel.get('animationDelay'), index, 0)
        + index * finiteNumber(config.stagger, 0);
    const easing = typeof (config.easing ?? seriesModel.get('animationEasing')) === 'string'
        ? String(config.easing ?? seriesModel.get('animationEasing'))
        : 'cubicOut';
    return {
        enabled: true,
        duration,
        delay,
        easing
    };
}
function animateEnter(element, itemIndex, animation) {
    if (!animation.enabled)
        return;
    const animatable = element;
    if (typeof animatable.animate !== 'function')
        return;
    const style = animatable.style || {};
    const opacity = finiteNumber(style.opacity, 1);
    style.opacity = 0;
    animatable.style = style;
    const animator = animatable.animate('style');
    if (!animator) {
        style.opacity = opacity;
        return;
    }
    const frame = animator.when(animation.duration, { opacity });
    if (animation.delay > 0)
        frame.delay?.(animation.delay);
    frame.start(animation.easing);
}
function enableHover(element, itemModel) {
    echartsHost.helper.enableHoverEmphasis?.(element, itemModel.get(['emphasis', 'focus']), itemModel.get(['emphasis', 'blurScope']));
}
function resolveAnimationValue(value, index, fallback) {
    if (typeof value === 'function') {
        return finiteNumber(value(index), fallback);
    }
    return finiteNumber(value, fallback);
}
function disabledAnimation() {
    return {
        enabled: false,
        duration: 0,
        delay: 0,
        easing: 'cubicOut'
    };
}
function formatPathNumber(value) {
    return Number(value.toFixed(3)).toString();
}
function asRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value) ? value : {};
}
function finiteNumber(value, fallback) {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
const DEFAULT_COLORS = [
    '#2563eb',
    '#0f9f88',
    '#d97706',
    '#7c3aed',
    '#dc2626',
    '#0891b2'
];
//# sourceMappingURL=vector-field.js.map