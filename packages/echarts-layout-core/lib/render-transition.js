const ALIVE_KEY = '__aliveRenderKey';
const TRANSITION_SCOPE = 'alive-render';
const DEFAULT_UPDATE_DURATION = 420;
const DEFAULT_UPDATE_EASING = 'cubicOut';
const TRANSFORM_KEYS = [
    'x',
    'y',
    'scaleX',
    'scaleY',
    'rotation',
    'originX',
    'originY',
    'skewX',
    'skewY',
    'z',
    'z2',
    'zlevel',
    'ignore',
    'silent',
    'invisible',
    'cursor'
];
export function setAliveRenderKey(element, key) {
    if (!element || typeof element !== 'object')
        return;
    element[ALIVE_KEY] = key;
    element.anid = element.anid || key;
}
export function renderAlive(view, echartsHost, group, seriesModel, render, options = {}) {
    const isUpdate = view.__aliveRenderState?.rendered === true;
    const capturedBindings = [];
    const renderSeriesModel = createSeriesModelProxy(seriesModel, isUpdate, capturedBindings);
    const targetGroup = isUpdate ? new echartsHost.graphic.Group() : group;
    const rendered = render(targetGroup, renderSeriesModel, isUpdate);
    const frame = normalizeFrame(rendered);
    if (!isUpdate) {
        stampImplicitKeys(group);
        view.__aliveRenderState = {
            rendered: true
        };
        return {
            hoverItems: frame.hoverItems,
            payload: frame.payload,
            mapElement: (element) => element
        };
    }
    stampImplicitKeys(group);
    stampImplicitKeys(targetGroup);
    const transitionOptions = resolveAliveTransitionOptions(seriesModel, options);
    const context = {
        duration: transitionOptions.duration,
        easing: transitionOptions.easing,
        elementMap: new Map()
    };
    reconcileGroup(group, targetGroup, context);
    applyCapturedGraphicBindings(capturedBindings, context.elementMap);
    view.__aliveRenderState = {
        rendered: true
    };
    return {
        hoverItems: remapHoverItems(frame.hoverItems, context.elementMap),
        payload: frame.payload,
        mapElement: (element) => mapElement(element, context.elementMap)
    };
}
export function clearAliveRender(view) {
    view.__aliveRenderState = undefined;
}
function normalizeFrame(rendered) {
    if (Array.isArray(rendered)) {
        return {
            hoverItems: rendered
        };
    }
    return {
        hoverItems: rendered?.hoverItems || [],
        payload: rendered?.payload
    };
}
function createSeriesModelProxy(seriesModel, isUpdate, capturedBindings) {
    if (!seriesModel || typeof seriesModel !== 'object')
        return seriesModel;
    const dataProxyCache = new WeakMap();
    return new Proxy(seriesModel, {
        get(target, property, receiver) {
            if (property === '__aliveRenderUpdating')
                return isUpdate;
            if (property === 'get') {
                const get = Reflect.get(target, property, receiver);
                if (typeof get !== 'function')
                    return get;
                return (path) => {
                    if (isUpdate && isAnimationPath(path))
                        return false;
                    return get.call(target, path);
                };
            }
            if (property === 'getData') {
                const getData = Reflect.get(target, property, receiver);
                if (typeof getData !== 'function')
                    return getData;
                return (...args) => {
                    const data = getData.apply(target, args);
                    return createDataProxy(data, isUpdate, capturedBindings, dataProxyCache);
                };
            }
            const value = Reflect.get(target, property, receiver);
            return typeof value === 'function' ? value.bind(target) : value;
        }
    });
}
function createDataProxy(data, isUpdate, capturedBindings, dataProxyCache) {
    if (!data || typeof data !== 'object')
        return data;
    const cached = dataProxyCache.get(data);
    if (cached)
        return cached;
    const proxy = new Proxy(data, {
        get(target, property, receiver) {
            if (property === 'setItemGraphicEl') {
                const setItemGraphicEl = Reflect.get(target, property, receiver);
                if (typeof setItemGraphicEl !== 'function')
                    return setItemGraphicEl;
                return (dataIndex, element) => {
                    setAliveRenderKey(element, dataGraphicKey(data, dataIndex));
                    if (isUpdate) {
                        capturedBindings.push({
                            data,
                            dataIndex,
                            element
                        });
                        return;
                    }
                    setItemGraphicEl.call(data, dataIndex, element);
                };
            }
            const value = Reflect.get(target, property, receiver);
            return typeof value === 'function' ? value.bind(target) : value;
        }
    });
    dataProxyCache.set(data, proxy);
    return proxy;
}
function isAnimationPath(path) {
    if (path === 'enterAnimation' || path === 'edgeAnimation')
        return true;
    return Array.isArray(path) && path.length === 1 && (path[0] === 'enterAnimation' || path[0] === 'edgeAnimation');
}
function dataGraphicKey(data, dataIndex) {
    const name = typeof data.getName === 'function' ? data.getName(dataIndex) : '';
    return name ? `data:${name}` : `data-index:${dataIndex}`;
}
function resolveAliveTransitionOptions(seriesModel, options) {
    const explicitDuration = finiteNumber(options.duration, NaN);
    const explicitEasing = typeof options.easing === 'string' && options.easing ? options.easing : '';
    if (Number.isFinite(explicitDuration)) {
        return {
            duration: explicitDuration,
            easing: explicitEasing || DEFAULT_UPDATE_EASING
        };
    }
    const model = seriesModel;
    if (readModelValue(model, 'animation') === false) {
        return {
            duration: 0,
            easing: explicitEasing || DEFAULT_UPDATE_EASING
        };
    }
    return {
        duration: finiteNumber(readModelValue(model, 'animationDurationUpdate'), finiteNumber(readModelValue(model, 'animationDuration'), DEFAULT_UPDATE_DURATION)),
        easing: explicitEasing || readStringModelValue(model, 'animationEasingUpdate') || readStringModelValue(model, 'animationEasing') || DEFAULT_UPDATE_EASING
    };
}
function readModelValue(model, path) {
    return typeof model?.get === 'function' ? model.get(path) : undefined;
}
function readStringModelValue(model, path) {
    const value = readModelValue(model, path);
    return typeof value === 'string' && value ? value : '';
}
function reconcileGroup(currentGroup, nextGroup, context) {
    context.elementMap.set(nextGroup, currentGroup);
    transitionElement(currentGroup, nextGroup, context, false);
    const currentChildren = childrenOf(currentGroup);
    const nextChildren = childrenOf(nextGroup);
    const usedCurrent = new Set();
    const keyedCurrent = createKeyedElementMap(currentChildren);
    nextChildren.forEach((nextChild, index) => {
        const currentChild = findCurrentMatch(nextChild, index, currentChildren, keyedCurrent, usedCurrent);
        if (!currentChild || !sameElementKind(currentChild, nextChild)) {
            addEnteringChild(currentGroup, nextChild, context);
            context.elementMap.set(nextChild, nextChild);
            return;
        }
        usedCurrent.add(currentChild);
        context.elementMap.set(nextChild, currentChild);
        if (isGroup(currentChild) && isGroup(nextChild)) {
            reconcileGroup(currentChild, nextChild, context);
        }
        else {
            transitionElement(currentChild, nextChild, context, true);
        }
    });
    currentChildren.forEach((currentChild) => {
        if (usedCurrent.has(currentChild))
            return;
        removeLeavingChild(currentGroup, currentChild, context);
    });
}
function createKeyedElementMap(children) {
    const keyed = new Map();
    children.forEach((child, index) => {
        const key = transitionKey(child, index);
        if (key && !keyed.has(key))
            keyed.set(key, child);
    });
    return keyed;
}
function findCurrentMatch(nextChild, index, currentChildren, keyedCurrent, usedCurrent) {
    const key = transitionKey(nextChild, index);
    const keyedMatch = key ? keyedCurrent.get(key) : undefined;
    if (keyedMatch && !usedCurrent.has(keyedMatch))
        return keyedMatch;
    const indexMatch = currentChildren[index];
    if (indexMatch && !usedCurrent.has(indexMatch) && sameElementKind(indexMatch, nextChild))
        return indexMatch;
    return currentChildren.find((candidate) => !usedCurrent.has(candidate) && sameElementKind(candidate, nextChild));
}
function transitionElement(current, next, context, animate) {
    const target = elementTarget(next);
    removeMissingKeys(asRecord(current.shape), asRecord(target.shape));
    removeMissingKeys(asRecord(current.style), asRecord(target.style));
    if (!animate || context.duration <= 0 || typeof current.animateTo !== 'function') {
        applyElementTarget(current, target);
        return;
    }
    current.stopAnimation?.(TRANSITION_SCOPE, false);
    current.animateTo(target, {
        duration: context.duration,
        easing: context.easing,
        scope: TRANSITION_SCOPE,
        done: () => applyElementTarget(current, target)
    }, animationProps(target));
}
function addEnteringChild(parent, child, context) {
    parent.add(child);
    fadeElementTree(child, 0, context);
}
function removeLeavingChild(parent, child, context) {
    const animated = fadeElementTree(child, 0, context, () => {
        if (child.parent === parent)
            parent.remove?.(child);
    });
    if (!animated && child.parent === parent)
        parent.remove?.(child);
}
function fadeElementTree(element, opacity, context, done) {
    const displayables = collectDisplayables(element);
    if (!displayables.length) {
        done?.();
        return false;
    }
    let remaining = displayables.length;
    const finish = () => {
        remaining -= 1;
        if (remaining === 0)
            done?.();
    };
    displayables.forEach((displayable) => {
        const targetStyle = cloneRecord(asRecord(displayable.style));
        const originalOpacity = finiteNumber(targetStyle.opacity, 1);
        if (opacity === 0 && !done) {
            setStyle(displayable, {
                ...targetStyle,
                opacity: 0
            });
            targetStyle.opacity = originalOpacity;
        }
        else {
            targetStyle.opacity = opacity;
        }
        if (context.duration <= 0 || typeof displayable.animateTo !== 'function') {
            setStyle(displayable, targetStyle);
            finish();
            return;
        }
        displayable.stopAnimation?.(TRANSITION_SCOPE, false);
        displayable.animateTo({
            style: targetStyle
        }, {
            duration: context.duration,
            easing: context.easing,
            scope: TRANSITION_SCOPE,
            done: finish
        }, {
            style: true
        });
    });
    return true;
}
function collectDisplayables(element) {
    if (isGroup(element)) {
        return childrenOf(element).flatMap((child) => collectDisplayables(child));
    }
    return asRecord(element.style) ? [element] : [];
}
function remapHoverItems(items, elementMap) {
    return items
        .map((item) => ({
        elements: remapHoverElements(item.elements, elementMap),
        triggerElements: item.triggerElements ? remapHoverElements(item.triggerElements, elementMap) : undefined
    }))
        .filter((item) => item.elements.length);
}
function remapHoverElements(elements, elementMap) {
    const result = [];
    const seen = new Set();
    elements.forEach((element) => {
        const mapped = mapElement(element, elementMap);
        if (!mapped || seen.has(mapped))
            return;
        seen.add(mapped);
        result.push(mapped);
    });
    return result;
}
function applyCapturedGraphicBindings(bindings, elementMap) {
    bindings.forEach((binding) => {
        const mapped = mapElement(binding.element, elementMap);
        if (mapped)
            binding.data.setItemGraphicEl?.(binding.dataIndex, mapped);
    });
}
function mapElement(element, elementMap) {
    if (!element)
        return element;
    return (elementMap.get(element) || element);
}
function stampImplicitKeys(group) {
    stampElement(group, 'root');
}
function stampElement(element, path) {
    if (!element[ALIVE_KEY]) {
        element[ALIVE_KEY] = `implicit:${path}`;
    }
    if (!isGroup(element))
        return;
    childrenOf(element).forEach((child, index) => {
        stampElement(child, `${path}/${elementKind(child)}:${index}`);
    });
}
function transitionKey(element, index) {
    const explicitKey = element[ALIVE_KEY] || element.anid || element.id || element.name || `index:${index}`;
    return `${elementKind(element)}:${String(explicitKey)}`;
}
function sameElementKind(left, right) {
    return elementKind(left) === elementKind(right);
}
function elementKind(element) {
    if (isGroup(element))
        return 'group';
    return element.type || Object.getPrototypeOf(element)?.constructor?.name || 'element';
}
function isGroup(element) {
    return element.isGroup === true || typeof element.childrenRef === 'function' || typeof element.children === 'function';
}
function childrenOf(group) {
    if (typeof group.childrenRef === 'function')
        return group.childrenRef();
    if (typeof group.children === 'function')
        return group.children();
    return [];
}
function elementTarget(element) {
    const target = {};
    TRANSFORM_KEYS.forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(element, key))
            target[key] = element[key];
    });
    if (element.shape)
        target.shape = cloneRecord(element.shape);
    if (element.style)
        target.style = cloneRecord(element.style);
    return target;
}
function animationProps(target) {
    const props = {};
    Object.keys(target).forEach((key) => {
        props[key] = key === 'shape' || key === 'style' ? true : true;
    });
    return props;
}
function applyElementTarget(element, target) {
    if (typeof element.attr === 'function') {
        element.attr(target);
        return;
    }
    Object.assign(element, target);
}
function setStyle(element, style) {
    if (typeof element.attr === 'function') {
        element.attr('style', style);
    }
    else {
        element.style = style;
    }
}
function removeMissingKeys(current, next) {
    Object.keys(current).forEach((key) => {
        if (!Object.prototype.hasOwnProperty.call(next, key))
            delete current[key];
    });
}
function cloneRecord(record) {
    return {
        ...record
    };
}
function asRecord(value) {
    return value != null && typeof value === 'object' && !Array.isArray(value) ? value : {};
}
function finiteNumber(value, fallback) {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
//# sourceMappingURL=render-transition.js.map