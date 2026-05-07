(function(global, factory) {
	typeof exports === "object" && typeof module !== "undefined" ? factory(require("echarts/lib/echarts")) : typeof define === "function" && define.amd ? define(["echarts/lib/echarts"], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, factory(global.echarts));
})(this, function(echarts_lib_echarts) {
	//#region \0rolldown/runtime.js
	var __create = Object.create;
	var __defProp = Object.defineProperty;
	var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
	var __getOwnPropNames = Object.getOwnPropertyNames;
	var __getProtoOf = Object.getPrototypeOf;
	var __hasOwnProp = Object.prototype.hasOwnProperty;
	var __copyProps = (to, from, except, desc) => {
		if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
			key = keys[i];
			if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
				get: ((k) => from[k]).bind(null, key),
				enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
			});
		}
		return to;
	};
	var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
		value: mod,
		enumerable: true
	}) : target, mod));
	//#endregion
	echarts_lib_echarts = __toESM(echarts_lib_echarts);
	//#region ../echarts-layout-core/lib/element-hover.js
	var DEFAULT_HOVER_DIM_OPACITY = .12;
	var DEFAULT_HOVER_TRANSITION_DURATION = 180;
	var DEFAULT_HOVER_TRANSITION_EASING = "cubicOut";
	var HOVER_TRANSITION_SCOPE = "element-hover";
	function installElementHover(items, options = {}) {
		const hoverItems = items.map((item) => ({
			elements: uniqueElements(item.elements),
			triggerElements: uniqueElements(item.triggerElements?.length ? item.triggerElements : item.elements)
		})).filter((item) => item.elements.length && item.triggerElements.length);
		if (!hoverItems.length) return void 0;
		const dimOpacity = finiteNumber$3(options.dimOpacity, DEFAULT_HOVER_DIM_OPACITY);
		const transitionDuration = finiteNumber$3(options.transitionDuration, DEFAULT_HOVER_TRANSITION_DURATION);
		const transitionEasing = typeof options.transitionEasing === "string" && options.transitionEasing ? options.transitionEasing : DEFAULT_HOVER_TRANSITION_EASING;
		const hoverTargets = /* @__PURE__ */ new WeakSet();
		const baseStyles = /* @__PURE__ */ new Map();
		let active = false;
		hoverItems.forEach((item, itemIndex) => {
			item.triggerElements.forEach((element) => {
				if (element && typeof element === "object") hoverTargets.add(element);
				element.cursor = "pointer";
				element.silent = false;
				attachHoverHandlers(element, () => {
					captureBaseStyles(hoverItems, baseStyles);
					active = true;
					applyHoverItem(hoverItems, baseStyles, itemIndex, dimOpacity, transitionDuration, transitionEasing);
				}, () => resetHoverItems(hoverItems, baseStyles, transitionDuration, transitionEasing));
			});
		});
		const reset = (eventOrImmediate = false) => {
			if (!active) return;
			const immediate = eventOrImmediate === true;
			active = false;
			resetHoverItems(hoverItems, baseStyles, immediate ? 0 : transitionDuration, transitionEasing);
		};
		const handleMove = (event) => {
			if (!active) return;
			if (!isHoverTarget(event.target, hoverTargets)) reset();
		};
		const zrender = options.zrender;
		zrender?.on("mousemove", handleMove);
		zrender?.on("globalout", reset);
		return { dispose() {
			zrender?.off("mousemove", handleMove);
			zrender?.off("globalout", reset);
			reset(true);
		} };
	}
	function captureBaseStyles(items, baseStyles) {
		items.forEach((item) => {
			item.elements.forEach((element) => {
				if (!baseStyles.has(element)) baseStyles.set(element, cloneStyle(element));
			});
		});
	}
	function applyHoverItem(items, baseStyles, activeIndex, dimOpacity, duration, easing) {
		const activeElements = new Set(items[activeIndex]?.elements || []);
		items.forEach((item) => {
			item.elements.forEach((element) => {
				const baseStyle = baseStyles.get(element) || {};
				transitionStyle(element, activeElements.has(element) ? cloneRecord$1(baseStyle) : {
					...baseStyle,
					opacity: dimOpacity
				}, ["opacity"], duration, easing);
			});
		});
	}
	function resetHoverItems(items, baseStyles, duration, easing) {
		const seen = /* @__PURE__ */ new Set();
		items.forEach((item) => {
			item.elements.forEach((element) => {
				if (seen.has(element)) return;
				seen.add(element);
				transitionStyle(element, cloneRecord$1(baseStyles.get(element) || {}), ["opacity"], duration, easing);
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
		const animator = animatable.animate?.("style");
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
			if (Object.prototype.hasOwnProperty.call(nextStyle, key)) target[key] = nextStyle[key];
			else if (key === "opacity") target[key] = 1;
		});
		return target;
	}
	function attachHoverHandlers(element, onEnter, onLeave) {
		const evented = element;
		evented.on?.("mouseover", onEnter);
		evented.on?.("mouseout", onLeave);
	}
	function isHoverTarget(target, hoverTargets) {
		let current = target;
		while (current && typeof current === "object") {
			if (hoverTargets.has(current)) return true;
			current = current.parent;
		}
		return false;
	}
	function uniqueElements(elements) {
		if (!Array.isArray(elements)) return [];
		const result = [];
		const seen = /* @__PURE__ */ new Set();
		elements.forEach((element) => {
			if (!element || seen.has(element)) return;
			seen.add(element);
			result.push(element);
		});
		return result;
	}
	function replaceGraphicStyle(element, style) {
		const target = element;
		const next = cloneRecord$1(style);
		removeMissingStyleKeys(target.style, next);
		if (typeof target.setStyle === "function") target.setStyle(next);
		else if (typeof target.attr === "function") target.attr("style", next);
		else target.style = next;
	}
	function removeMissingStyleKeys(current, next) {
		if (!current || typeof current !== "object" || Array.isArray(current)) return;
		const style = current;
		Object.keys(style).forEach((key) => {
			if (!Object.prototype.hasOwnProperty.call(next, key)) delete style[key];
		});
	}
	function cloneStyle(element) {
		return cloneRecord$1(asRecord$2(element.style));
	}
	function cloneRecord$1(record) {
		return { ...record };
	}
	function asRecord$2(value) {
		return value && typeof value === "object" && !Array.isArray(value) ? value : {};
	}
	function finiteNumber$3(value, fallback) {
		return typeof value === "number" && Number.isFinite(value) ? value : fallback;
	}
	//#endregion
	//#region ../echarts-layout-core/lib/render-transition.js
	var ALIVE_KEY = "__aliveRenderKey";
	var TRANSITION_SCOPE = "alive-render";
	var DEFAULT_UPDATE_DURATION = 420;
	var DEFAULT_UPDATE_EASING = "cubicOut";
	var TRANSFORM_KEYS = [
		"x",
		"y",
		"scaleX",
		"scaleY",
		"rotation",
		"originX",
		"originY",
		"skewX",
		"skewY",
		"z",
		"z2",
		"zlevel",
		"ignore",
		"silent",
		"invisible",
		"cursor"
	];
	function setAliveRenderKey(element, key) {
		if (!element || typeof element !== "object") return;
		element[ALIVE_KEY] = key;
		element.anid = element.anid || key;
	}
	function renderAlive(view, echartsHost, group, seriesModel, render, options = {}) {
		const isUpdate = view.__aliveRenderState?.rendered === true;
		const capturedBindings = [];
		const renderSeriesModel = createSeriesModelProxy(seriesModel, isUpdate, capturedBindings);
		const targetGroup = isUpdate ? new echartsHost.graphic.Group() : group;
		const frame = normalizeFrame(render(targetGroup, renderSeriesModel, isUpdate));
		if (!isUpdate) {
			stampImplicitKeys(group);
			view.__aliveRenderState = { rendered: true };
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
			elementMap: /* @__PURE__ */ new Map()
		};
		reconcileGroup(group, targetGroup, context);
		applyCapturedGraphicBindings(capturedBindings, context.elementMap);
		view.__aliveRenderState = { rendered: true };
		return {
			hoverItems: remapHoverItems(frame.hoverItems, context.elementMap),
			payload: frame.payload,
			mapElement: (element) => mapElement(element, context.elementMap)
		};
	}
	function clearAliveRender(view) {
		view.__aliveRenderState = void 0;
	}
	function normalizeFrame(rendered) {
		if (Array.isArray(rendered)) return { hoverItems: rendered };
		return {
			hoverItems: rendered?.hoverItems || [],
			payload: rendered?.payload
		};
	}
	function createSeriesModelProxy(seriesModel, isUpdate, capturedBindings) {
		if (!seriesModel || typeof seriesModel !== "object") return seriesModel;
		const dataProxyCache = /* @__PURE__ */ new WeakMap();
		return new Proxy(seriesModel, { get(target, property, receiver) {
			if (property === "__aliveRenderUpdating") return isUpdate;
			if (property === "get") {
				const get = Reflect.get(target, property, receiver);
				if (typeof get !== "function") return get;
				return (path) => {
					if (isUpdate && isAnimationPath(path)) return false;
					return get.call(target, path);
				};
			}
			if (property === "getData") {
				const getData = Reflect.get(target, property, receiver);
				if (typeof getData !== "function") return getData;
				return (...args) => {
					return createDataProxy(getData.apply(target, args), isUpdate, capturedBindings, dataProxyCache);
				};
			}
			const value = Reflect.get(target, property, receiver);
			return typeof value === "function" ? value.bind(target) : value;
		} });
	}
	function createDataProxy(data, isUpdate, capturedBindings, dataProxyCache) {
		if (!data || typeof data !== "object") return data;
		const cached = dataProxyCache.get(data);
		if (cached) return cached;
		const proxy = new Proxy(data, { get(target, property, receiver) {
			if (property === "setItemGraphicEl") {
				const setItemGraphicEl = Reflect.get(target, property, receiver);
				if (typeof setItemGraphicEl !== "function") return setItemGraphicEl;
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
			return typeof value === "function" ? value.bind(target) : value;
		} });
		dataProxyCache.set(data, proxy);
		return proxy;
	}
	function isAnimationPath(path) {
		if (path === "enterAnimation" || path === "edgeAnimation") return true;
		return Array.isArray(path) && path.length === 1 && (path[0] === "enterAnimation" || path[0] === "edgeAnimation");
	}
	function dataGraphicKey(data, dataIndex) {
		const name = typeof data.getName === "function" ? data.getName(dataIndex) : "";
		return name ? `data:${name}` : `data-index:${dataIndex}`;
	}
	function resolveAliveTransitionOptions(seriesModel, options) {
		const explicitDuration = finiteNumber$2(options.duration, NaN);
		const explicitEasing = typeof options.easing === "string" && options.easing ? options.easing : "";
		if (Number.isFinite(explicitDuration)) return {
			duration: explicitDuration,
			easing: explicitEasing || DEFAULT_UPDATE_EASING
		};
		const model = seriesModel;
		if (readModelValue(model, "animation") === false) return {
			duration: 0,
			easing: explicitEasing || DEFAULT_UPDATE_EASING
		};
		return {
			duration: finiteNumber$2(readModelValue(model, "animationDurationUpdate"), finiteNumber$2(readModelValue(model, "animationDuration"), DEFAULT_UPDATE_DURATION)),
			easing: explicitEasing || readStringModelValue(model, "animationEasingUpdate") || readStringModelValue(model, "animationEasing") || DEFAULT_UPDATE_EASING
		};
	}
	function readModelValue(model, path) {
		return typeof model?.get === "function" ? model.get(path) : void 0;
	}
	function readStringModelValue(model, path) {
		const value = readModelValue(model, path);
		return typeof value === "string" && value ? value : "";
	}
	function reconcileGroup(currentGroup, nextGroup, context) {
		context.elementMap.set(nextGroup, currentGroup);
		transitionElement(currentGroup, nextGroup, context, false);
		const currentChildren = childrenOf(currentGroup);
		const nextChildren = childrenOf(nextGroup);
		const usedCurrent = /* @__PURE__ */ new Set();
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
			if (isGroup(currentChild) && isGroup(nextChild)) reconcileGroup(currentChild, nextChild, context);
			else transitionElement(currentChild, nextChild, context, true);
		});
		currentChildren.forEach((currentChild) => {
			if (usedCurrent.has(currentChild)) return;
			removeLeavingChild(currentGroup, currentChild, context);
		});
	}
	function createKeyedElementMap(children) {
		const keyed = /* @__PURE__ */ new Map();
		children.forEach((child, index) => {
			const key = transitionKey(child, index);
			if (key && !keyed.has(key)) keyed.set(key, child);
		});
		return keyed;
	}
	function findCurrentMatch(nextChild, index, currentChildren, keyedCurrent, usedCurrent) {
		const key = transitionKey(nextChild, index);
		const keyedMatch = key ? keyedCurrent.get(key) : void 0;
		if (keyedMatch && !usedCurrent.has(keyedMatch)) return keyedMatch;
		const indexMatch = currentChildren[index];
		if (indexMatch && !usedCurrent.has(indexMatch) && sameElementKind(indexMatch, nextChild)) return indexMatch;
		return currentChildren.find((candidate) => !usedCurrent.has(candidate) && sameElementKind(candidate, nextChild));
	}
	function transitionElement(current, next, context, animate) {
		const target = elementTarget(next);
		removeMissingKeys(asRecord$1(current.shape), asRecord$1(target.shape));
		removeMissingKeys(asRecord$1(current.style), asRecord$1(target.style));
		if (!animate || context.duration <= 0 || typeof current.animateTo !== "function") {
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
		if (!fadeElementTree(child, 0, context, () => {
			if (child.parent === parent) parent.remove?.(child);
		}) && child.parent === parent) parent.remove?.(child);
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
			if (remaining === 0) done?.();
		};
		displayables.forEach((displayable) => {
			const targetStyle = cloneRecord(asRecord$1(displayable.style));
			const originalOpacity = finiteNumber$2(targetStyle.opacity, 1);
			if (opacity === 0 && !done) {
				setStyle(displayable, {
					...targetStyle,
					opacity: 0
				});
				targetStyle.opacity = originalOpacity;
			} else targetStyle.opacity = opacity;
			if (context.duration <= 0 || typeof displayable.animateTo !== "function") {
				setStyle(displayable, targetStyle);
				finish();
				return;
			}
			displayable.stopAnimation?.(TRANSITION_SCOPE, false);
			displayable.animateTo({ style: targetStyle }, {
				duration: context.duration,
				easing: context.easing,
				scope: TRANSITION_SCOPE,
				done: finish
			}, { style: true });
		});
		return true;
	}
	function collectDisplayables(element) {
		if (isGroup(element)) return childrenOf(element).flatMap((child) => collectDisplayables(child));
		return asRecord$1(element.style) ? [element] : [];
	}
	function remapHoverItems(items, elementMap) {
		return items.map((item) => ({
			elements: remapHoverElements(item.elements, elementMap),
			triggerElements: item.triggerElements ? remapHoverElements(item.triggerElements, elementMap) : void 0
		})).filter((item) => item.elements.length);
	}
	function remapHoverElements(elements, elementMap) {
		const result = [];
		const seen = /* @__PURE__ */ new Set();
		elements.forEach((element) => {
			const mapped = mapElement(element, elementMap);
			if (!mapped || seen.has(mapped)) return;
			seen.add(mapped);
			result.push(mapped);
		});
		return result;
	}
	function applyCapturedGraphicBindings(bindings, elementMap) {
		bindings.forEach((binding) => {
			const mapped = mapElement(binding.element, elementMap);
			if (mapped) binding.data.setItemGraphicEl?.(binding.dataIndex, mapped);
		});
	}
	function mapElement(element, elementMap) {
		if (!element) return element;
		return elementMap.get(element) || element;
	}
	function stampImplicitKeys(group) {
		stampElement(group, "root");
	}
	function stampElement(element, path) {
		if (!element[ALIVE_KEY]) element[ALIVE_KEY] = `implicit:${path}`;
		if (!isGroup(element)) return;
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
		if (isGroup(element)) return "group";
		return element.type || Object.getPrototypeOf(element)?.constructor?.name || "element";
	}
	function isGroup(element) {
		return element.isGroup === true || typeof element.childrenRef === "function" || typeof element.children === "function";
	}
	function childrenOf(group) {
		if (typeof group.childrenRef === "function") return group.childrenRef();
		if (typeof group.children === "function") return group.children();
		return [];
	}
	function elementTarget(element) {
		const target = {};
		TRANSFORM_KEYS.forEach((key) => {
			if (Object.prototype.hasOwnProperty.call(element, key)) target[key] = element[key];
		});
		if (element.shape) target.shape = cloneRecord(element.shape);
		if (element.style) target.style = cloneRecord(element.style);
		return target;
	}
	function animationProps(target) {
		const props = {};
		Object.keys(target).forEach((key) => {
			props[key] = key === "shape" || key === "style" ? true : true;
		});
		return props;
	}
	function applyElementTarget(element, target) {
		if (typeof element.attr === "function") {
			element.attr(target);
			return;
		}
		Object.assign(element, target);
	}
	function setStyle(element, style) {
		if (typeof element.attr === "function") element.attr("style", style);
		else element.style = style;
	}
	function removeMissingKeys(current, next) {
		Object.keys(current).forEach((key) => {
			if (!Object.prototype.hasOwnProperty.call(next, key)) delete current[key];
		});
	}
	function cloneRecord(record) {
		return { ...record };
	}
	function asRecord$1(value) {
		return value != null && typeof value === "object" && !Array.isArray(value) ? value : {};
	}
	function finiteNumber$2(value, fallback) {
		return typeof value === "number" && Number.isFinite(value) ? value : fallback;
	}
	3 / 2 * Math.PI;
	//#endregion
	//#region src/layout.ts
	var DEFAULT_WIDTH = 600;
	var DEFAULT_HEIGHT = 400;
	var DEFAULT_PADDING = 4;
	var DEFAULT_GAP = 1;
	var DEFAULT_FLAME_COLORS = [
		"#f97316",
		"#f59e0b",
		"#ef4444",
		"#14b8a6",
		"#3b82f6",
		"#8b5cf6",
		"#22c55e"
	];
	function resolveFlameLayout(option = {}) {
		const layoutOptions = {
			...isPlainObject(option.layout) ? option.layout : {},
			...isPlainObject(option.layoutOptions) ? option.layoutOptions : {},
			width: finiteNumber$1(option.width, void 0),
			height: finiteNumber$1(option.height, void 0),
			padding: finiteNumber$1(option.padding, void 0),
			gap: finiteNumber$1(option.gap, void 0),
			rootName: typeof option.rootName === "string" ? option.rootName : void 0,
			rootVisible: typeof option.rootVisible === "boolean" ? option.rootVisible : void 0,
			orient: option.orient === "down" || option.orient === "up" ? option.orient : void 0,
			colors: Array.isArray(option.colors) ? option.colors.filter((color) => typeof color === "string") : void 0,
			sort: normalizeSort(option.sort)
		};
		return layoutFlame(option.data, layoutOptions);
	}
	function layoutFlame(data, options = {}) {
		const width = finiteNumber$1(options.width, DEFAULT_WIDTH);
		const height = finiteNumber$1(options.height, DEFAULT_HEIGHT);
		const padding = Math.max(0, finiteNumber$1(options.padding, DEFAULT_PADDING));
		const gap = Math.max(0, finiteNumber$1(options.gap, DEFAULT_GAP));
		const orient = options.orient === "down" ? "down" : "up";
		const rootVisible = typeof options.rootVisible === "boolean" ? options.rootVisible : !Array.isArray(data);
		const colors = options.colors?.length ? options.colors : DEFAULT_FLAME_COLORS;
		const root = normalizeRoot(data, options.rootName);
		computeValues(root);
		if (options.sort !== false && options.sort !== "none") sortChildren(root, options.sort);
		computeSubtreeHeights(root);
		const depthOffset = rootVisible ? 0 : 1;
		assignColors(root, colors, depthOffset);
		const innerWidth = Math.max(width - padding * 2, 1);
		const innerHeight = Math.max(height - padding * 2, 1);
		root.x = padding;
		root.width = innerWidth;
		layoutChildren(root, gap);
		const visibleNodes = flatten(root).filter((node) => node.value > 0 && (rootVisible || node !== root));
		const maxVisibleDepth = visibleNodes.reduce((max, node) => Math.max(max, node.depth - depthOffset), 0);
		const depthCount = visibleNodes.length ? maxVisibleDepth + 1 : 0;
		assignRows(root, depthOffset, depthCount, depthCount > 0 ? Math.max((innerHeight - gap * Math.max(0, depthCount - 1)) / depthCount, 1) : innerHeight, gap, padding, orient);
		return {
			width,
			height,
			padding,
			gap,
			orient,
			rootVisible,
			root: toPublicNode(root, root.value),
			nodes: visibleNodes.map((node) => toPublicNode(node, root.value))
		};
	}
	function flattenFlameData(data, rootName) {
		return flatten(normalizeRoot(data, rootName)).filter((node) => node.dataIndex >= 0).sort((left, right) => left.dataIndex - right.dataIndex).map((node) => node.raw);
	}
	function normalizeRoot(data, rootName) {
		let nextDataIndex = 0;
		function createNode(raw, depth, parent, siblingIndex, forcedName, synthetic = false) {
			const record = isPlainObject(raw) ? raw : {};
			const label = record.label;
			const name = String(forcedName ?? record.name ?? (typeof label === "string" || typeof label === "number" ? label : void 0) ?? record.id ?? `node-${siblingIndex}`);
			const idPart = record.id != null ? String(record.id) : parent ? `${name}-${siblingIndex}` : name;
			const node = {
				id: parent ? `${parent.id}/${idPart}` : idPart,
				name,
				value: 0,
				depth,
				subtreeHeight: 0,
				parent,
				children: [],
				dataIndex: synthetic ? -1 : nextDataIndex++,
				x: 0,
				y: 0,
				width: 0,
				height: 0,
				color: DEFAULT_FLAME_COLORS[depth % DEFAULT_FLAME_COLORS.length],
				raw,
				synthetic
			};
			node.children = (Array.isArray(record.children) ? record.children : []).map((child, index) => createNode(child, depth + 1, node, index));
			return node;
		}
		if (Array.isArray(data)) return createNode({
			name: rootName || "root",
			children: data
		}, 0, null, 0, rootName || "root", true);
		if (isPlainObject(data)) return createNode(data, 0, null, 0, rootName);
		return createNode({
			name: rootName || "root",
			value: readNonNegativeNumber(data) ?? 0
		}, 0, null, 0, rootName || "root");
	}
	function computeValues(node) {
		const children = [];
		let childTotal = 0;
		node.children.forEach((child) => {
			const childValue = computeValues(child);
			if (childValue <= 0) return;
			children.push(child);
			childTotal += childValue;
		});
		node.children = children;
		const explicitValue = readNonNegativeNumber((isPlainObject(node.raw) ? node.raw : {}).value);
		if (node.children.length) {
			node.value = Math.max(explicitValue ?? 0, childTotal);
			return node.value;
		}
		node.value = explicitValue ?? (node.synthetic ? 0 : 1);
		return node.value;
	}
	function sortChildren(node, sort) {
		if (sort === "name") node.children.sort((left, right) => left.name.localeCompare(right.name) || right.value - left.value);
		else node.children.sort((left, right) => right.value - left.value || left.name.localeCompare(right.name));
		node.children.forEach((child) => sortChildren(child, sort));
	}
	function computeSubtreeHeights(node) {
		if (!node.children.length) {
			node.subtreeHeight = 0;
			return 0;
		}
		node.subtreeHeight = 1 + Math.max(...node.children.map(computeSubtreeHeights));
		return node.subtreeHeight;
	}
	function assignColors(node, colors, depthOffset) {
		const record = isPlainObject(node.raw) ? node.raw : {};
		const itemStyle = isPlainObject(record.itemStyle) ? record.itemStyle : {};
		const colorDepth = Math.max(0, node.depth - depthOffset);
		node.color = typeof itemStyle.color === "string" ? itemStyle.color : colors[Math.min(colorDepth, colors.length - 1)];
		node.children.forEach((child) => assignColors(child, colors, depthOffset));
	}
	function layoutChildren(node, gap) {
		const children = node.children.filter((child) => child.value > 0);
		if (!children.length || node.value <= 0) return;
		const gapTotal = gap * Math.max(0, children.length - 1);
		const availableWidth = Math.max(node.width - gapTotal, 0);
		let cursorX = node.x;
		children.forEach((child) => {
			child.x = cursorX;
			child.width = availableWidth * (child.value / node.value);
			cursorX += child.width + gap;
			layoutChildren(child, gap);
		});
	}
	function assignRows(node, depthOffset, depthCount, rowHeight, gap, padding, orient) {
		const visibleDepth = node.depth - depthOffset;
		if (visibleDepth >= 0 && depthCount > 0) {
			node.y = orient === "down" ? padding + visibleDepth * (rowHeight + gap) : padding + (depthCount - visibleDepth - 1) * (rowHeight + gap);
			node.height = rowHeight;
		} else {
			node.y = padding;
			node.height = rowHeight;
		}
		node.children.forEach((child) => assignRows(child, depthOffset, depthCount, rowHeight, gap, padding, orient));
	}
	function flatten(root) {
		const nodes = [];
		function visit(node) {
			nodes.push(node);
			node.children.forEach(visit);
		}
		visit(root);
		return nodes;
	}
	function toPublicNode(node, rootValue) {
		const publicNode = {
			id: node.id,
			name: node.name,
			value: node.value,
			depth: node.depth,
			subtreeHeight: node.subtreeHeight,
			parentId: node.parent?.id ?? null,
			children: [],
			dataIndex: node.dataIndex,
			x: node.x,
			y: node.y,
			width: node.width,
			height: node.height,
			color: node.color,
			percent: rootValue > 0 ? node.value / rootValue : 0,
			raw: node.raw
		};
		publicNode.children = node.children.map((child) => toPublicNode(child, rootValue));
		return publicNode;
	}
	function normalizeSort(value) {
		if (value === false || value === true || value === "none" || value === "value" || value === "name") return value;
	}
	function readNonNegativeNumber(value) {
		if (typeof value !== "number" || !Number.isFinite(value)) return null;
		return Math.max(value, 0);
	}
	function finiteNumber$1(value, fallback) {
		return typeof value === "number" && Number.isFinite(value) ? value : fallback;
	}
	function isPlainObject(value) {
		return value != null && typeof value === "object" && !Array.isArray(value);
	}
	//#endregion
	//#region src/flame.ts
	var echartsHost = echarts_lib_echarts;
	var optionKeys = [
		"padding",
		"gap",
		"rootName",
		"rootVisible",
		"orient",
		"colors",
		"sort"
	];
	echartsHost.extendSeriesModel({
		type: "series.flame",
		visualStyleAccessPath: "itemStyle",
		visualDrawType: "fill",
		getInitialData(option) {
			const source = flattenFlameData(option.data, option.rootName);
			const dimensions = echartsHost.helper.createDimensions(source, { coordDimensions: ["value"] });
			const list = new echartsHost.List(dimensions, this);
			list.initData(source);
			this.legendVisualProvider = createLegendVisualProvider(this);
			return list;
		},
		defaultOption: {
			left: "center",
			top: "center",
			width: "92%",
			height: "84%",
			padding: 4,
			gap: 1,
			rootName: "root",
			rootVisible: null,
			orient: "up",
			colors: DEFAULT_FLAME_COLORS,
			sort: true,
			enterAnimation: true,
			itemStyle: {
				opacity: .95,
				borderColor: "#ffffff",
				borderWidth: 1
			},
			label: {
				show: true,
				color: "#111827",
				fontSize: 12,
				fontWeight: 600,
				formatter: null
			},
			emphasis: { itemStyle: {
				shadowBlur: 8,
				shadowColor: "rgba(31, 41, 55, 0.2)"
			} }
		}
	});
	echartsHost.extendChartView({
		type: "flame",
		render(seriesModel, ecModel, api) {
			const group = this.group;
			const renderToken = {};
			this.__renderToken = renderToken;
			this.__hoverController?.dispose();
			this.__hoverController = void 0;
			try {
				const rect = echartsHost.helper.getLayoutRect(seriesModel.getBoxLayoutParams(), {
					width: api.getWidth(),
					height: api.getHeight()
				});
				const layout = resolveFlameLayout(readLayoutOption(seriesModel, rect));
				if (this.__renderToken !== renderToken) return;
				const { hoverItems } = renderAlive(this, echartsHost, group, seriesModel, (targetGroup, targetSeriesModel) => drawFlame(echartsHost, targetGroup, targetSeriesModel, layout, rect));
				this.__hoverController = installElementHover(hoverItems, { zrender: api.getZr?.() });
			} catch (error) {
				if (typeof console !== "undefined") console.error("[flame] render failed", error);
			}
		},
		remove() {
			this.__renderToken = null;
			this.__hoverController?.dispose();
			this.__hoverController = void 0;
			clearAliveRender(this);
			this.group.removeAll();
		},
		dispose() {
			this.__renderToken = null;
			this.__hoverController?.dispose();
			this.__hoverController = void 0;
			clearAliveRender(this);
			this.group.removeAll();
		}
	});
	function readLayoutOption(seriesModel, rect) {
		const layoutOption = {
			data: (seriesModel.option || {}).data,
			layout: seriesModel.get("layout"),
			layoutOptions: seriesModel.get("layoutOptions") || {},
			width: rect.width,
			height: rect.height
		};
		optionKeys.forEach((key) => {
			const value = seriesModel.get(key);
			if (value !== void 0 && value !== null) layoutOption[key] = value;
		});
		return layoutOption;
	}
	function drawFlame(echartsInstance, group, seriesModel, layout, rect) {
		const data = seriesModel.getData();
		const chartGroup = new echartsInstance.graphic.Group();
		const hoverItems = [];
		const hoverItemsByDataIndex = /* @__PURE__ */ new Map();
		chartGroup.x = rect.x;
		chartGroup.y = rect.y;
		layout.nodes.forEach((node, index) => {
			if (node.width <= 0 || node.height <= 0) return;
			const itemModel = node.dataIndex >= 0 && node.dataIndex < data.count() ? data.getItemModel(node.dataIndex) : null;
			const rectEl = new echartsInstance.graphic.Rect({
				shape: {
					x: node.x,
					y: node.y,
					width: node.width,
					height: node.height
				},
				style: readNodeStyle(data, seriesModel, itemModel, node, index)
			});
			applyRectEnterAnimation(rectEl, node, readEnterAnimation(seriesModel, index));
			if (itemModel && node.dataIndex >= 0 && node.dataIndex < data.count()) {
				data.setItemLayout(node.dataIndex, [
					node.x,
					node.y,
					node.width,
					node.height
				]);
				data.setItemGraphicEl(node.dataIndex, rectEl);
				const hoverItem = createHoverItem(rectEl);
				hoverItems.push(hoverItem);
				hoverItemsByDataIndex.set(node.dataIndex, hoverItem);
			}
			chartGroup.add(rectEl);
		});
		drawLabels(echartsInstance, chartGroup, seriesModel, data, layout.nodes, hoverItemsByDataIndex);
		group.add(chartGroup);
		return hoverItems;
	}
	function drawLabels(echartsInstance, group, seriesModel, data, nodes, hoverItemsByDataIndex) {
		const seriesLabelModel = seriesModel.getModel("label");
		if (!seriesLabelModel.get("show")) return;
		nodes.forEach((node) => {
			const itemLabelModel = (node.dataIndex >= 0 && node.dataIndex < data.count() ? data.getItemModel(node.dataIndex) : null)?.getModel("label");
			if (!(itemLabelModel?.get("show") ?? seriesLabelModel.get("show"))) return;
			const baseFontSize = finiteNumber(itemLabelModel?.get("fontSize") ?? seriesLabelModel.get("fontSize"), 12);
			if (node.width < Math.max(24, baseFontSize * 2) || node.height < Math.max(12, baseFontSize * 1.1)) return;
			const fontSize = Math.min(baseFontSize, Math.max(8, Math.min(node.height * .48, node.width * .18)));
			const maxChars = Math.max(3, Math.floor(Math.max(node.width - 8, 1) / Math.max(fontSize * .56, 1)));
			const text = formatLabel(itemLabelModel?.get("formatter") || seriesLabelModel.get("formatter"), node);
			const labelEl = new echartsInstance.graphic.Text({
				style: {
					x: node.x + 4,
					y: node.y + node.height / 2,
					text: ellipsize(String(text), maxChars),
					fill: itemLabelModel?.get("color") || seriesLabelModel.get("color") || "#111827",
					fontSize,
					fontWeight: itemLabelModel?.get("fontWeight") || seriesLabelModel.get("fontWeight") || 600,
					align: "left",
					verticalAlign: "middle"
				},
				silent: true
			});
			applyFadeEnterAnimation(labelEl, readEnterAnimation(seriesModel, node.dataIndex));
			addHoverElement(hoverItemsByDataIndex.get(node.dataIndex), labelEl);
			group.add(labelEl);
		});
	}
	function readNodeStyle(data, seriesModel, itemModel, node, index) {
		const seriesStyle = asRecord(seriesModel.get("itemStyle"));
		const rawStyle = readRawItemStyle(node.raw);
		const itemStyle = itemModel ? asRecord(itemModel.get("itemStyle")) : rawStyle;
		const visualStyle = node.dataIndex >= 0 && node.dataIndex < data.count() ? asRecord(data.getItemVisual(node.dataIndex, "style")) : {};
		return {
			fill: itemStyle.color || rawStyle.color || seriesStyle.color || visualStyle.fill || node.color || DEFAULT_FLAME_COLORS[index % DEFAULT_FLAME_COLORS.length],
			stroke: itemStyle.borderColor || rawStyle.borderColor || seriesStyle.borderColor || "#ffffff",
			lineWidth: finiteNumber(itemStyle.borderWidth ?? rawStyle.borderWidth ?? seriesStyle.borderWidth, 1),
			opacity: finiteNumber(itemStyle.opacity ?? rawStyle.opacity ?? seriesStyle.opacity, .95)
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
		if (typeof formatter === "function") return formatter(params);
		if (typeof formatter === "string") return formatter.replace(/\{b\}/g, node.name).replace(/\{c\}/g, String(node.value)).replace(/\{d\}/g, String(Math.round(node.percent * 100))).replace(/\{p\}/g, `${Math.round(node.percent * 100)}%`);
		return node.name;
	}
	function ellipsize(value, maxChars) {
		if (value.length <= maxChars) return value;
		return `${value.slice(0, Math.max(1, maxChars - 1))}...`;
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
				if (key === "legendIcon") return null;
				if (key !== "style") return seriesModel.getData().getItemVisual(dataIndex, key);
				const itemStyle = asRecord(seriesModel.getData().getItemModel(dataIndex).get("itemStyle"));
				return {
					fill: itemStyle.color || DEFAULT_FLAME_COLORS[dataIndex % DEFAULT_FLAME_COLORS.length],
					stroke: itemStyle.borderColor || "#ffffff",
					opacity: finiteNumber(itemStyle.opacity, .95)
				};
			}
		};
	}
	function collectDataNames(data) {
		const names = [];
		for (let index = 0; index < data.count(); index++) names.push(data.getName(index));
		return names;
	}
	function readRawItemStyle(raw) {
		return asRecord(asRecord(raw).itemStyle);
	}
	function readEnterAnimation(seriesModel, itemIndex, animationOption = seriesModel.get("enterAnimation")) {
		if (seriesModel.get("animation") === false || animationOption === false) return disabledEnterAnimation();
		const option = animationOption == null || animationOption === true ? {} : asRecord(animationOption);
		if (option.show === false || option.enabled === false) return disabledEnterAnimation();
		const baseDelay = resolveAnimationNumber(option.delay ?? seriesModel.get("animationDelay"), itemIndex, itemIndex, 0);
		const stagger = resolveAnimationNumber(option.stagger, itemIndex, itemIndex, 10);
		return {
			enabled: true,
			duration: resolveAnimationNumber(option.duration ?? seriesModel.get("animationDuration"), itemIndex, itemIndex, 520),
			delay: baseDelay + itemIndex * stagger,
			easing: resolveAnimationEasing(option.easing ?? seriesModel.get("animationEasing"))
		};
	}
	function disabledEnterAnimation() {
		return {
			enabled: false,
			duration: 0,
			delay: 0,
			easing: "cubicOut"
		};
	}
	function resolveAnimationNumber(value, item, itemIndex, fallback) {
		return finiteNumber(typeof value === "function" ? value(item, itemIndex) : value, fallback);
	}
	function resolveAnimationEasing(value) {
		return typeof value === "string" && value ? value : "cubicOut";
	}
	function applyRectEnterAnimation(element, node, animation) {
		if (!animation.enabled) return;
		const animatable = element;
		if (typeof animatable.animate !== "function") return;
		const shape = animatable.shape || {};
		const style = animatable.style || {};
		const opacity = finiteNumber(style.opacity, 1);
		shape.width = 0;
		style.opacity = 0;
		animatable.shape = shape;
		animatable.style = style;
		animateGraphicProperty(animatable, "shape", animation, { width: node.width });
		animateGraphicProperty(animatable, "style", animation, { opacity });
	}
	function applyFadeEnterAnimation(element, animation) {
		if (!animation.enabled) return;
		const animatable = element;
		if (typeof animatable.animate !== "function") return;
		const style = animatable.style || {};
		const opacity = finiteNumber(style.opacity, 1);
		style.opacity = 0;
		animatable.style = style;
		animateGraphicProperty(animatable, "style", animation, { opacity });
	}
	function animateGraphicProperty(element, targetKey, animation, target) {
		const animator = element.animate?.(targetKey);
		if (!animator) {
			Object.assign(element[targetKey] || {}, target);
			return;
		}
		const chain = animator.when(animation.duration, target);
		if (animation.delay > 0) chain.delay?.(animation.delay);
		chain.start(animation.easing);
	}
	function finiteNumber(value, fallback) {
		return typeof value === "number" && Number.isFinite(value) ? value : fallback;
	}
	function asRecord(value) {
		return value != null && typeof value === "object" && !Array.isArray(value) ? value : {};
	}
	function createHoverItem(element) {
		return {
			elements: [element],
			triggerElements: [element]
		};
	}
	function addHoverElement(item, element) {
		if (!item) return;
		item.elements.push(element);
		if (!item.triggerElements) item.triggerElements = [];
		item.triggerElements.push(element);
	}
	//#endregion
});

//# sourceMappingURL=echarts-flame.js.map