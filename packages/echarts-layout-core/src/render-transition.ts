import type { ElementHoverItem, HoverGraphicElement } from './element-hover.js';

export interface AliveRenderState {
  rendered: boolean;
}

export interface AliveRenderView {
  __aliveRenderState?: AliveRenderState;
}

export interface AliveRenderOptions {
  duration?: number;
  easing?: string;
}

export interface AliveGraphicElement extends HoverGraphicElement {
  type?: string;
  id?: string | number;
  name?: string;
  parent?: AliveGraphicGroup | null;
  isGroup?: boolean;
  shape?: Record<string, unknown>;
  style?: Record<string, unknown>;
  x?: number;
  y?: number;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
  originX?: number;
  originY?: number;
  skewX?: number;
  skewY?: number;
  z?: number;
  z2?: number;
  zlevel?: number;
  ignore?: boolean;
  silent?: boolean;
  invisible?: boolean;
  cursor?: unknown;
  anid?: string;
  children?: () => AliveGraphicElement[];
  childrenRef?: () => AliveGraphicElement[];
  attr?: (keyOrObj: unknown, value?: unknown) => void;
  animateTo?: (
    target: Record<string, unknown>,
    config?: Record<string, unknown>,
    animationProps?: Record<string, unknown>
  ) => void;
  stopAnimation?: (scope?: string, forwardToLast?: boolean) => void;
  getClipPath?: () => AliveGraphicElement | null | undefined;
  setClipPath?: (clipPath: AliveGraphicElement) => void;
  removeClipPath?: () => void;
  dirty?: () => void;
}

export interface AliveGraphicGroup extends AliveGraphicElement {
  add(element: AliveGraphicElement): void;
  remove?: (element: AliveGraphicElement) => void;
  removeAll(): void;
}

export interface AliveRenderHost {
  graphic: {
    Group: new () => AliveGraphicGroup;
  };
}

export interface AliveRenderFrame<TPayload> {
  hoverItems?: ElementHoverItem[];
  payload?: TPayload;
}

export interface AliveRenderResult<TPayload> {
  hoverItems: ElementHoverItem[];
  payload?: TPayload;
  mapElement<TElement extends AliveGraphicElement | null | undefined>(element: TElement): TElement;
}

interface AliveSeriesData {
  getName?: (index: number) => string;
  setItemGraphicEl?: (dataIndex: number, element: AliveGraphicElement) => void;
  [key: string]: unknown;
}

interface AliveSeriesModelLike {
  get?: (path: string | string[]) => unknown;
  [key: string]: unknown;
}

interface CapturedGraphicBinding {
  data: AliveSeriesData;
  dataIndex: number;
  element: AliveGraphicElement;
}

interface RenderContext {
  duration: number;
  easing: string;
  elementMap: Map<AliveGraphicElement, AliveGraphicElement>;
}

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
] as const;

export function setAliveRenderKey(element: AliveGraphicElement | null | undefined, key: string): void {
  if (!element || typeof element !== 'object') return;
  element[ALIVE_KEY] = key;
  element.anid = element.anid || key;
}

export function renderAlive<TSeriesModel, TPayload = undefined>(
  view: AliveRenderView,
  echartsHost: AliveRenderHost,
  group: AliveGraphicGroup,
  seriesModel: TSeriesModel,
  render: (targetGroup: AliveGraphicGroup, seriesModel: TSeriesModel, isUpdate: boolean) => ElementHoverItem[] | AliveRenderFrame<TPayload> | void,
  options: AliveRenderOptions = {}
): AliveRenderResult<TPayload> {
  const isUpdate = view.__aliveRenderState?.rendered === true;
  const capturedBindings: CapturedGraphicBinding[] = [];
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
  const context: RenderContext = {
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

export function clearAliveRender(view: AliveRenderView): void {
  view.__aliveRenderState = undefined;
}

function normalizeFrame<TPayload>(
  rendered: ElementHoverItem[] | AliveRenderFrame<TPayload> | void
): AliveRenderFrame<TPayload> & { hoverItems: ElementHoverItem[] } {
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

function createSeriesModelProxy<TSeriesModel>(
  seriesModel: TSeriesModel,
  isUpdate: boolean,
  capturedBindings: CapturedGraphicBinding[]
): TSeriesModel {
  if (!seriesModel || typeof seriesModel !== 'object') return seriesModel;

  const dataProxyCache = new WeakMap<object, AliveSeriesData>();
  return new Proxy(seriesModel as Record<string, unknown>, {
    get(target, property, receiver) {
      if (property === '__aliveRenderUpdating') return isUpdate;

      if (property === 'get') {
        const get = Reflect.get(target, property, receiver);
        if (typeof get !== 'function') return get;
        return (path: unknown) => {
          if (isUpdate && isAnimationPath(path)) return false;
          return get.call(target, path);
        };
      }

      if (property === 'getData') {
        const getData = Reflect.get(target, property, receiver);
        if (typeof getData !== 'function') return getData;
        return (...args: unknown[]) => {
          const data = getData.apply(target, args) as AliveSeriesData;
          return createDataProxy(data, isUpdate, capturedBindings, dataProxyCache);
        };
      }

      const value = Reflect.get(target, property, receiver);
      return typeof value === 'function' ? value.bind(target) : value;
    }
  }) as TSeriesModel;
}

function createDataProxy(
  data: AliveSeriesData,
  isUpdate: boolean,
  capturedBindings: CapturedGraphicBinding[],
  dataProxyCache: WeakMap<object, AliveSeriesData>
): AliveSeriesData {
  if (!data || typeof data !== 'object') return data;
  const cached = dataProxyCache.get(data);
  if (cached) return cached;

  const proxy = new Proxy(data as Record<string, unknown>, {
    get(target, property, receiver) {
      if (property === 'setItemGraphicEl') {
        const setItemGraphicEl = Reflect.get(target, property, receiver);
        if (typeof setItemGraphicEl !== 'function') return setItemGraphicEl;
        return (dataIndex: number, element: AliveGraphicElement) => {
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
  }) as AliveSeriesData;

  dataProxyCache.set(data, proxy);
  return proxy;
}

function isAnimationPath(path: unknown): boolean {
  if (path === 'enterAnimation' || path === 'edgeAnimation') return true;
  return Array.isArray(path) && path.length === 1 && (path[0] === 'enterAnimation' || path[0] === 'edgeAnimation');
}

function dataGraphicKey(data: AliveSeriesData, dataIndex: number): string {
  const name = typeof data.getName === 'function' ? data.getName(dataIndex) : '';
  return name ? `data:${name}` : `data-index:${dataIndex}`;
}

function resolveAliveTransitionOptions(seriesModel: unknown, options: AliveRenderOptions): Required<AliveRenderOptions> {
  const explicitDuration = finiteNumber(options.duration, NaN);
  const explicitEasing = typeof options.easing === 'string' && options.easing ? options.easing : '';
  if (Number.isFinite(explicitDuration)) {
    return {
      duration: explicitDuration,
      easing: explicitEasing || DEFAULT_UPDATE_EASING
    };
  }

  const model = seriesModel as AliveSeriesModelLike;
  if (readModelValue(model, 'animation') === false) {
    return {
      duration: 0,
      easing: explicitEasing || DEFAULT_UPDATE_EASING
    };
  }

  return {
    duration: finiteNumber(
      readModelValue(model, 'animationDurationUpdate'),
      finiteNumber(readModelValue(model, 'animationDuration'), DEFAULT_UPDATE_DURATION)
    ),
    easing: explicitEasing || readStringModelValue(model, 'animationEasingUpdate') || readStringModelValue(model, 'animationEasing') || DEFAULT_UPDATE_EASING
  };
}

function readModelValue(model: AliveSeriesModelLike, path: string): unknown {
  return typeof model?.get === 'function' ? model.get(path) : undefined;
}

function readStringModelValue(model: AliveSeriesModelLike, path: string): string {
  const value = readModelValue(model, path);
  return typeof value === 'string' && value ? value : '';
}

function reconcileGroup(currentGroup: AliveGraphicGroup, nextGroup: AliveGraphicGroup, context: RenderContext): void {
  context.elementMap.set(nextGroup, currentGroup);
  transitionElement(currentGroup, nextGroup, context, false);

  const currentChildren = childrenOf(currentGroup);
  const nextChildren = childrenOf(nextGroup);
  const usedCurrent = new Set<AliveGraphicElement>();
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
      reconcileGroup(currentChild as AliveGraphicGroup, nextChild as AliveGraphicGroup, context);
    } else {
      transitionElement(currentChild, nextChild, context, true);
    }
  });

  currentChildren.forEach((currentChild) => {
    if (usedCurrent.has(currentChild)) return;
    removeLeavingChild(currentGroup, currentChild, context);
  });
}

function createKeyedElementMap(children: AliveGraphicElement[]): Map<string, AliveGraphicElement> {
  const keyed = new Map<string, AliveGraphicElement>();
  children.forEach((child, index) => {
    const key = transitionKey(child, index);
    if (key && !keyed.has(key)) keyed.set(key, child);
  });
  return keyed;
}

function findCurrentMatch(
  nextChild: AliveGraphicElement,
  index: number,
  currentChildren: AliveGraphicElement[],
  keyedCurrent: Map<string, AliveGraphicElement>,
  usedCurrent: Set<AliveGraphicElement>
): AliveGraphicElement | undefined {
  const key = transitionKey(nextChild, index);
  const keyedMatch = key ? keyedCurrent.get(key) : undefined;
  if (keyedMatch && !usedCurrent.has(keyedMatch)) return keyedMatch;
  if (hasExplicitTransitionKey(nextChild)) return undefined;

  const indexMatch = currentChildren[index];
  if (indexMatch && !usedCurrent.has(indexMatch) && sameElementKind(indexMatch, nextChild)) return indexMatch;

  return currentChildren.find((candidate) => !usedCurrent.has(candidate) && sameElementKind(candidate, nextChild));
}

function transitionElement(
  current: AliveGraphicElement,
  next: AliveGraphicElement,
  context: RenderContext,
  animate: boolean
): void {
  const target = elementTarget(next);
  removeMissingKeys(asRecord(current.shape), asRecord(target.shape));
  removeMissingKeys(asRecord(current.style), asRecord(target.style));
  transitionClipPath(current, next, context, animate);

  if (animate) current.stopAnimation?.(undefined, false);

  if (!animate || context.duration <= 0 || typeof current.animateTo !== 'function') {
    applyElementTarget(current, target);
    return;
  }

  current.animateTo(target, {
    duration: context.duration,
    easing: context.easing,
    scope: TRANSITION_SCOPE,
    done: () => applyElementTarget(current, target)
  }, animationProps(target));
}

function transitionClipPath(
  current: AliveGraphicElement,
  next: AliveGraphicElement,
  context: RenderContext,
  animate: boolean
): void {
  const nextClipPath = getClipPath(next);
  const currentClipPath = getClipPath(current);

  if (!nextClipPath) {
    if (currentClipPath) current.removeClipPath?.();
    return;
  }

  if (!currentClipPath || !sameElementKind(currentClipPath, nextClipPath)) {
    current.setClipPath?.(nextClipPath);
    return;
  }

  transitionElement(currentClipPath, nextClipPath, context, animate);
}

function addEnteringChild(parent: AliveGraphicGroup, child: AliveGraphicElement, context: RenderContext): void {
  parent.add(child);
  fadeElementTree(child, 0, context);
}

function removeLeavingChild(parent: AliveGraphicGroup, child: AliveGraphicElement, context: RenderContext): void {
  const animated = fadeElementTree(child, 0, context, () => {
    if (child.parent === parent) parent.remove?.(child);
  });
  if (!animated && child.parent === parent) parent.remove?.(child);
}

function fadeElementTree(
  element: AliveGraphicElement,
  opacity: number,
  context: RenderContext,
  done?: () => void
): boolean {
  const displayables = collectDisplayables(element);
  if (!displayables.length) {
    done?.();
    return false;
  }

  let remaining = displayables.length;
  const finish = () => {
    remaining -= 1;
    if (remaining === 0) done?.();
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
    } else {
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

function collectDisplayables(element: AliveGraphicElement): AliveGraphicElement[] {
  if (isGroup(element)) {
    return childrenOf(element as AliveGraphicGroup).flatMap((child) => collectDisplayables(child));
  }
  return asRecord(element.style) ? [element] : [];
}

function remapHoverItems(items: ElementHoverItem[], elementMap: Map<AliveGraphicElement, AliveGraphicElement>): ElementHoverItem[] {
  return items
    .map((item) => ({
      elements: remapHoverElements(item.elements, elementMap),
      triggerElements: item.triggerElements ? remapHoverElements(item.triggerElements, elementMap) : undefined
    }))
    .filter((item) => item.elements.length);
}

function remapHoverElements(
  elements: HoverGraphicElement[],
  elementMap: Map<AliveGraphicElement, AliveGraphicElement>
): HoverGraphicElement[] {
  const result: HoverGraphicElement[] = [];
  const seen = new Set<HoverGraphicElement>();
  elements.forEach((element) => {
    const mapped = mapElement(element as AliveGraphicElement, elementMap);
    if (!mapped || seen.has(mapped)) return;
    seen.add(mapped);
    result.push(mapped);
  });
  return result;
}

function applyCapturedGraphicBindings(
  bindings: CapturedGraphicBinding[],
  elementMap: Map<AliveGraphicElement, AliveGraphicElement>
): void {
  bindings.forEach((binding) => {
    const mapped = mapElement(binding.element, elementMap);
    if (mapped) binding.data.setItemGraphicEl?.(binding.dataIndex, mapped);
  });
}

function mapElement<TElement extends AliveGraphicElement | null | undefined>(
  element: TElement,
  elementMap: Map<AliveGraphicElement, AliveGraphicElement>
): TElement {
  if (!element) return element;
  return (elementMap.get(element) || element) as TElement;
}

function stampImplicitKeys(group: AliveGraphicGroup): void {
  stampElement(group, 'root');
}

function stampElement(element: AliveGraphicElement, path: string): void {
  if (!element[ALIVE_KEY]) {
    element[ALIVE_KEY] = `implicit:${path}`;
  }
  if (!isGroup(element)) return;
  childrenOf(element as AliveGraphicGroup).forEach((child, index) => {
    stampElement(child, `${path}/${elementKind(child)}:${index}`);
  });
}

function transitionKey(element: AliveGraphicElement, index: number): string {
  const explicitKey = element[ALIVE_KEY] || element.anid || element.id || element.name || `index:${index}`;
  return `${elementKind(element)}:${String(explicitKey)}`;
}

function sameElementKind(left: AliveGraphicElement, right: AliveGraphicElement): boolean {
  return elementKind(left) === elementKind(right);
}

function hasExplicitTransitionKey(element: AliveGraphicElement): boolean {
  const key = element[ALIVE_KEY];
  return key != null && !String(key).startsWith('implicit:');
}

function elementKind(element: AliveGraphicElement): string {
  if (isGroup(element)) return 'group';
  return element.type || Object.getPrototypeOf(element)?.constructor?.name || 'element';
}

function isGroup(element: AliveGraphicElement): boolean {
  const group = element as AliveGraphicGroup;
  return element.isGroup === true || (typeof group.add === 'function' && typeof group.removeAll === 'function');
}

function childrenOf(group: AliveGraphicGroup): AliveGraphicElement[] {
  if (typeof group.childrenRef === 'function') return group.childrenRef().slice();
  if (typeof group.children === 'function') return group.children().slice();
  return [];
}

function getClipPath(element: AliveGraphicElement): AliveGraphicElement | null | undefined {
  return typeof element.getClipPath === 'function' ? element.getClipPath() : undefined;
}

function elementTarget(element: AliveGraphicElement): Record<string, unknown> {
  const target: Record<string, unknown> = {};
  TRANSFORM_KEYS.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(element, key)) target[key] = element[key];
  });
  if (element.shape) target.shape = cloneRecord(element.shape);
  if (element.style) target.style = cloneRecord(element.style);
  return target;
}

function animationProps(target: Record<string, unknown>): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  Object.keys(target).forEach((key) => {
    props[key] = key === 'shape' || key === 'style' ? true : true;
  });
  return props;
}

function applyElementTarget(element: AliveGraphicElement, target: Record<string, unknown>): void {
  if (typeof element.attr === 'function') {
    element.attr(target);
    return;
  }
  Object.assign(element, target);
}

function setStyle(element: AliveGraphicElement, style: Record<string, unknown>): void {
  if (typeof element.attr === 'function') {
    element.attr('style', style);
  } else {
    element.style = style;
  }
}

function removeMissingKeys(current: Record<string, unknown>, next: Record<string, unknown>): void {
  Object.keys(current).forEach((key) => {
    if (!Object.prototype.hasOwnProperty.call(next, key)) delete current[key];
  });
}

function cloneRecord(record: Record<string, unknown>): Record<string, unknown> {
  return {
    ...record
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
