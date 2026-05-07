const DEFAULT_HOVER_DIM_OPACITY = 0.12;
const DEFAULT_HOVER_TRANSITION_DURATION = 180;
const DEFAULT_HOVER_TRANSITION_EASING = 'cubicOut';
const HOVER_TRANSITION_SCOPE = 'element-hover';
export function installElementHover(items, options = {}) {
    const hoverItems = items
        .map((item) => ({
        elements: uniqueElements(item.elements),
        triggerElements: uniqueElements(item.triggerElements?.length ? item.triggerElements : item.elements)
    }))
        .filter((item) => item.elements.length && item.triggerElements.length);
    if (!hoverItems.length)
        return undefined;
    const dimOpacity = finiteNumber(options.dimOpacity, DEFAULT_HOVER_DIM_OPACITY);
    const transitionDuration = finiteNumber(options.transitionDuration, DEFAULT_HOVER_TRANSITION_DURATION);
    const transitionEasing = typeof options.transitionEasing === 'string' && options.transitionEasing
        ? options.transitionEasing
        : DEFAULT_HOVER_TRANSITION_EASING;
    const hoverTargets = new WeakSet();
    const baseStyles = new Map();
    let active = false;
    hoverItems.forEach((item, itemIndex) => {
        item.triggerElements.forEach((element) => {
            if (element && typeof element === 'object')
                hoverTargets.add(element);
            element.cursor = 'pointer';
            element.silent = false;
            attachHoverHandlers(element, () => {
                captureBaseStyles(hoverItems, baseStyles);
                active = true;
                applyHoverItem(hoverItems, baseStyles, itemIndex, dimOpacity, transitionDuration, transitionEasing);
            }, () => resetHoverItems(hoverItems, baseStyles, transitionDuration, transitionEasing));
        });
    });
    const reset = (eventOrImmediate = false) => {
        if (!active)
            return;
        const immediate = eventOrImmediate === true;
        active = false;
        resetHoverItems(hoverItems, baseStyles, immediate ? 0 : transitionDuration, transitionEasing);
    };
    const handleMove = (event) => {
        if (!active)
            return;
        if (!isHoverTarget(event.target, hoverTargets))
            reset();
    };
    const zrender = options.zrender;
    zrender?.on('mousemove', handleMove);
    zrender?.on('globalout', reset);
    return {
        dispose() {
            zrender?.off('mousemove', handleMove);
            zrender?.off('globalout', reset);
            reset(true);
        }
    };
}
function captureBaseStyles(items, baseStyles) {
    items.forEach((item) => {
        item.elements.forEach((element) => {
            if (!baseStyles.has(element))
                baseStyles.set(element, cloneStyle(element));
        });
    });
}
function applyHoverItem(items, baseStyles, activeIndex, dimOpacity, duration, easing) {
    const activeElements = new Set(items[activeIndex]?.elements || []);
    items.forEach((item) => {
        item.elements.forEach((element) => {
            const baseStyle = baseStyles.get(element) || {};
            const nextStyle = activeElements.has(element)
                ? cloneRecord(baseStyle)
                : {
                    ...baseStyle,
                    opacity: dimOpacity
                };
            transitionStyle(element, nextStyle, ['opacity'], duration, easing);
        });
    });
}
function resetHoverItems(items, baseStyles, duration, easing) {
    const seen = new Set();
    items.forEach((item) => {
        item.elements.forEach((element) => {
            if (seen.has(element))
                return;
            seen.add(element);
            transitionStyle(element, cloneRecord(baseStyles.get(element) || {}), ['opacity'], duration, easing);
        });
    });
}
function transitionStyle(element, nextStyle, keys, duration, easing) {
    if (duration <= 0) {
        replaceGraphicStyle(element, nextStyle);
        return;
    }
    const target = createTransitionTarget(nextStyle, keys);
    const animatable = element;
    animatable.stopAnimation?.(HOVER_TRANSITION_SCOPE, false);
    const animator = animatable.animate?.('style');
    if (!animator || !Object.keys(target).length) {
        replaceGraphicStyle(element, nextStyle);
        return;
    }
    animator.scope = HOVER_TRANSITION_SCOPE;
    animator.when(duration, target).done?.(() => replaceGraphicStyle(element, nextStyle));
    animator.start(easing);
}
function createTransitionTarget(nextStyle, keys) {
    const target = {};
    keys.forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(nextStyle, key)) {
            target[key] = nextStyle[key];
        }
        else if (key === 'opacity') {
            target[key] = 1;
        }
    });
    return target;
}
function attachHoverHandlers(element, onEnter, onLeave) {
    const evented = element;
    evented.on?.('mouseover', onEnter);
    evented.on?.('mouseout', onLeave);
}
function isHoverTarget(target, hoverTargets) {
    let current = target;
    while (current && typeof current === 'object') {
        if (hoverTargets.has(current))
            return true;
        current = current.parent;
    }
    return false;
}
function uniqueElements(elements) {
    if (!Array.isArray(elements))
        return [];
    const result = [];
    const seen = new Set();
    elements.forEach((element) => {
        if (!element || seen.has(element))
            return;
        seen.add(element);
        result.push(element);
    });
    return result;
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
function asRecord(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}
function finiteNumber(value, fallback) {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
//# sourceMappingURL=element-hover.js.map