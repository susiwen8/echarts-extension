export interface ElementHoverItem {
  elements: HoverGraphicElement[];
  triggerElements?: HoverGraphicElement[];
}

export interface ElementHoverOptions {
  dimOpacity?: number;
  transitionDuration?: number;
  transitionEasing?: string;
  zrender?: HoverZRender | null;
}

export interface ElementHoverController {
  dispose(): void;
}

export interface HoverGraphicElement {
  [key: string]: unknown;
}

interface HoverEventedElement extends HoverGraphicElement {
  on?: (eventName: string, handler: () => void) => void;
}

interface HoverAnimatableElement extends HoverGraphicElement {
  style?: Record<string, unknown>;
  animate?: (key: 'style', loop?: boolean) => HoverAnimator | null | undefined;
  stopAnimation?: (scope?: string, forwardToLast?: boolean) => void;
}

interface HoverAnimator {
  scope?: string;
  when(duration: number, target: Record<string, unknown>): HoverAnimator;
  done?: (callback: () => void) => HoverAnimator;
  start(easing?: string): void;
}

interface HoverZRender {
  on(eventName: string, handler: (event: HoverZRenderEvent) => void): void;
  off(eventName: string, handler: (event: HoverZRenderEvent) => void): void;
}

interface HoverZRenderEvent {
  target?: unknown;
}

const DEFAULT_HOVER_DIM_OPACITY = 0.12;
const DEFAULT_HOVER_TRANSITION_DURATION = 180;
const DEFAULT_HOVER_TRANSITION_EASING = 'cubicOut';
const HOVER_TRANSITION_SCOPE = 'element-hover';

export function installElementHover(
  items: ElementHoverItem[],
  options: ElementHoverOptions = {}
): ElementHoverController | undefined {
  const hoverItems = items
    .map((item) => ({
      elements: uniqueElements(item.elements),
      triggerElements: uniqueElements(item.triggerElements?.length ? item.triggerElements : item.elements)
    }))
    .filter((item) => item.elements.length && item.triggerElements.length);

  if (!hoverItems.length) return undefined;

  const dimOpacity = finiteNumber(options.dimOpacity, DEFAULT_HOVER_DIM_OPACITY);
  const transitionDuration = finiteNumber(options.transitionDuration, DEFAULT_HOVER_TRANSITION_DURATION);
  const transitionEasing = typeof options.transitionEasing === 'string' && options.transitionEasing
    ? options.transitionEasing
    : DEFAULT_HOVER_TRANSITION_EASING;
  const hoverTargets = new WeakSet<object>();
  const baseStyles = new Map<HoverGraphicElement, Record<string, unknown>>();
  let active = false;

  hoverItems.forEach((item, itemIndex) => {
    item.triggerElements.forEach((element) => {
      if (element && typeof element === 'object') hoverTargets.add(element);
      element.cursor = 'pointer';
      element.silent = false;
      attachHoverHandlers(
        element,
        () => {
          captureBaseStyles(hoverItems, baseStyles);
          active = true;
          applyHoverItem(hoverItems, baseStyles, itemIndex, dimOpacity, transitionDuration, transitionEasing);
        },
        () => resetHoverItems(hoverItems, baseStyles, transitionDuration, transitionEasing)
      );
    });
  });

  const reset = (eventOrImmediate: HoverZRenderEvent | boolean = false) => {
    if (!active) return;
    const immediate = eventOrImmediate === true;
    active = false;
    resetHoverItems(hoverItems, baseStyles, immediate ? 0 : transitionDuration, transitionEasing);
  };

  const handleMove = (event: HoverZRenderEvent) => {
    if (!active) return;
    if (!isHoverTarget(event.target, hoverTargets)) reset();
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

function captureBaseStyles(
  items: Array<{ elements: HoverGraphicElement[] }>,
  baseStyles: Map<HoverGraphicElement, Record<string, unknown>>
): void {
  items.forEach((item) => {
    item.elements.forEach((element) => {
      if (!baseStyles.has(element)) baseStyles.set(element, cloneStyle(element));
    });
  });
}

function applyHoverItem(
  items: Array<{ elements: HoverGraphicElement[] }>,
  baseStyles: Map<HoverGraphicElement, Record<string, unknown>>,
  activeIndex: number,
  dimOpacity: number,
  duration: number,
  easing: string
): void {
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

function resetHoverItems(
  items: Array<{ elements: HoverGraphicElement[] }>,
  baseStyles: Map<HoverGraphicElement, Record<string, unknown>>,
  duration: number,
  easing: string
): void {
  const seen = new Set<HoverGraphicElement>();
  items.forEach((item) => {
    item.elements.forEach((element) => {
      if (seen.has(element)) return;
      seen.add(element);
      transitionStyle(element, cloneRecord(baseStyles.get(element) || {}), ['opacity'], duration, easing);
    });
  });
}

function transitionStyle(
  element: HoverGraphicElement,
  nextStyle: Record<string, unknown>,
  keys: string[],
  duration: number,
  easing: string
): void {
  if (duration <= 0) {
    replaceGraphicStyle(element, nextStyle);
    return;
  }

  const target = createTransitionTarget(nextStyle, keys);
  const animatable = element as HoverAnimatableElement;
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

function createTransitionTarget(nextStyle: Record<string, unknown>, keys: string[]): Record<string, unknown> {
  const target: Record<string, unknown> = {};
  keys.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(nextStyle, key)) {
      target[key] = nextStyle[key];
    } else if (key === 'opacity') {
      target[key] = 1;
    }
  });
  return target;
}

function attachHoverHandlers(element: HoverGraphicElement, onEnter: () => void, onLeave: () => void): void {
  const evented = element as HoverEventedElement;
  evented.on?.('mouseover', onEnter);
  evented.on?.('mouseout', onLeave);
}

function isHoverTarget(target: unknown, hoverTargets: WeakSet<object>): boolean {
  let current = target;
  while (current && typeof current === 'object') {
    if (hoverTargets.has(current)) return true;
    current = (current as Record<string, unknown>).parent;
  }
  return false;
}

function uniqueElements(elements: HoverGraphicElement[] | undefined): HoverGraphicElement[] {
  if (!Array.isArray(elements)) return [];
  const result: HoverGraphicElement[] = [];
  const seen = new Set<HoverGraphicElement>();
  elements.forEach((element) => {
    if (!element || seen.has(element)) return;
    seen.add(element);
    result.push(element);
  });
  return result;
}

function replaceGraphicStyle(element: HoverGraphicElement, style: Record<string, unknown>): void {
  const target = element as HoverGraphicElement & {
    style?: Record<string, unknown>;
    attr?: (keyOrObj: unknown, value?: unknown) => void;
    setStyle?: (style: Record<string, unknown>) => void;
  };
  const next = cloneRecord(style);
  removeMissingStyleKeys(target.style, next);
  if (typeof target.setStyle === 'function') {
    target.setStyle(next);
  } else if (typeof target.attr === 'function') {
    target.attr('style', next);
  } else {
    target.style = next;
  }
}

function removeMissingStyleKeys(current: unknown, next: Record<string, unknown>): void {
  if (!current || typeof current !== 'object' || Array.isArray(current)) return;
  const style = current as Record<string, unknown>;
  Object.keys(style).forEach((key) => {
    if (!Object.prototype.hasOwnProperty.call(next, key)) delete style[key];
  });
}

function cloneStyle(element: HoverGraphicElement): Record<string, unknown> {
  return cloneRecord(asRecord((element as { style?: unknown }).style));
}

function cloneRecord(record: Record<string, unknown>): Record<string, unknown> {
  return {
    ...record
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
