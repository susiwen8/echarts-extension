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
	var DEFAULT_PALETTE = [
		"#4e79a7",
		"#f28e8c",
		"#59a14f",
		"#b07aa1",
		"#f2b447",
		"#76b7b2",
		"#e15759",
		"#8cd17d",
		"#9c755f",
		"#bab0ab"
	];
	var DEFAULT_WIDTH = 600;
	var DEFAULT_HEIGHT = 400;
	var GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
	function resolveVennLayout(option = {}) {
		const data = Array.isArray(option.data) ? option.data : [];
		const layoutOption = option.layout;
		const layoutOptions = {
			...isPlainObject(layoutOption) ? layoutOption : {},
			...isPlainObject(option.layoutOptions) ? option.layoutOptions : {},
			width: finiteNumber$1(option.width, void 0),
			height: finiteNumber$1(option.height, void 0),
			padding: finiteNumber$1(option.padding, void 0),
			minRadius: finiteNumber$1(option.minRadius, void 0),
			maxRadius: finiteNumber$1(option.maxRadius, void 0)
		};
		return resolveMode(option, data) === "bubble" ? layoutBubbleVenn(data, layoutOptions) : layoutHollowVenn(data, layoutOptions);
	}
	function layoutHollowVenn(data, options = {}) {
		const width = finiteNumber$1(options.width, DEFAULT_WIDTH);
		const height = finiteNumber$1(options.height, DEFAULT_HEIGHT);
		const padding = finiteNumber$1(options.padding, 24);
		const items = normalizeItems(data);
		const baseSets = resolveBaseSets(items).slice(0, 3);
		const circles = createHollowCircles(Math.max(1, Math.min(3, baseSets.length || items.length || 1)), baseSets, {
			width,
			height,
			padding
		});
		return {
			mode: "hollow",
			width,
			height,
			circles,
			labels: createHollowLabels(items, circles, {
				width,
				height
			})
		};
	}
	function layoutBubbleVenn(data, options = {}) {
		const width = finiteNumber$1(options.width, DEFAULT_WIDTH);
		const height = finiteNumber$1(options.height, DEFAULT_HEIGHT);
		const padding = finiteNumber$1(options.padding, 20);
		const innerWidth = Math.max(width - padding * 2, 1);
		const innerHeight = Math.max(height - padding * 2, 1);
		const minRadius = finiteNumber$1(options.minRadius, Math.max(12, Math.min(innerWidth, innerHeight) * .045));
		const maxRadius = finiteNumber$1(options.maxRadius, Math.max(minRadius, Math.min(innerWidth, innerHeight) * .22));
		const items = normalizeItems(data);
		const maxValue = Math.max(...items.map((item) => positiveNumber(item.value, 1)), 1);
		const center = {
			x: width / 2,
			y: height / 2
		};
		const circles = items.map((item) => ({
			...item,
			r: resolveBubbleRadius(item.value, maxValue, minRadius, maxRadius)
		})).sort((left, right) => {
			return positiveNumber(right.value, 0) - positiveNumber(left.value, 0) || left.dataIndex - right.dataIndex;
		}).map((item, sortedIndex) => {
			const point = placeBubble(sortedIndex, item.r, center, {
				width,
				height,
				padding,
				maxRadius
			});
			return {
				id: item.id,
				name: item.name,
				value: item.value,
				dataIndex: item.dataIndex,
				x: point.x,
				y: point.y,
				r: item.r,
				color: item.color
			};
		});
		return {
			mode: "bubble",
			width,
			height,
			circles,
			labels: circles.map((circle) => ({
				id: circle.id,
				name: circle.name,
				value: circle.value,
				dataIndex: circle.dataIndex,
				x: circle.x,
				y: circle.y
			}))
		};
	}
	function resolveMode(option, data) {
		const layout = option.layout;
		const rawMode = typeof layout === "string" ? layout : option.vennType || option.mode || (isPlainObject(layout) ? layout.type : void 0);
		if (rawMode === "bubble" || rawMode === "packed" || rawMode === "circle") return "bubble";
		if (rawMode === "hollow" || rawMode === "venn" || rawMode === "outline") return "hollow";
		return data.some((item) => isPlainObject(item) && Array.isArray(item.sets)) ? "hollow" : "bubble";
	}
	function createHollowCircles(count, baseSets, rect) {
		if (count === 1) return createOneSetCircles(baseSets, rect);
		if (count === 2) return createTwoSetCircles(baseSets, rect);
		return createThreeSetCircles(baseSets, rect);
	}
	function createOneSetCircles(baseSets, { width, height, padding }) {
		const id = baseSets[0] || "A";
		const r = Math.max(1, Math.min(width - padding * 2, height - padding * 2) / 2);
		return [{
			id,
			name: id,
			sets: [id],
			setKey: id,
			dataIndex: -1,
			x: width / 2,
			y: height / 2,
			r
		}];
	}
	function createTwoSetCircles(baseSets, { width, height, padding }) {
		const ids = fillSetNames(baseSets, 2);
		const innerWidth = Math.max(width - padding * 2, 1);
		const innerHeight = Math.max(height - padding * 2, 1);
		const r = Math.max(1, Math.min(innerWidth * .34, innerHeight * .44));
		const distance = Math.min(r * 1.15, innerWidth - r * 2);
		const cy = height / 2;
		return ids.map((id, index) => ({
			id,
			name: id,
			sets: [id],
			setKey: id,
			dataIndex: -1,
			x: width / 2 + (index === 0 ? -distance / 2 : distance / 2),
			y: cy,
			r
		}));
	}
	function createThreeSetCircles(baseSets, { width, height, padding }) {
		const ids = fillSetNames(baseSets, 3);
		const innerWidth = Math.max(width - padding * 2, 1);
		const innerHeight = Math.max(height - padding * 2, 1);
		const cx = width / 2;
		const cy = height / 2;
		const radiusBounds = [
			innerWidth * .29,
			innerHeight * .38,
			(width - padding - cx) / 1.75,
			(cx - padding) / 1.75,
			(height - padding - cy) / 1.55,
			(cy - padding) / 1.35
		];
		const r = Math.max(1, Math.min(...radiusBounds.filter((value) => value > 0)));
		const horizontal = r * .72;
		const topOffset = r * .32;
		const bottomOffset = r * .55;
		const points = [
			[cx - horizontal, cy - topOffset],
			[cx + horizontal, cy - topOffset],
			[cx, cy + bottomOffset]
		];
		return ids.map((id, index) => ({
			id,
			name: id,
			sets: [id],
			setKey: id,
			dataIndex: -1,
			x: points[index][0],
			y: points[index][1],
			r
		}));
	}
	function createHollowLabels(items, circles, { width, height }) {
		const bySetKey = new Map(circles.map((circle) => [circle.setKey, circle]));
		const circleById = new Map(circles.map((circle) => [circle.id, circle]));
		const fallbackNames = circles.map((circle) => circle.id);
		return items.map((item) => {
			const sets = item.sets.length ? item.sets : [fallbackNames[item.dataIndex] || item.name];
			const setKey = createSetKey(sets);
			const point = resolveHollowLabelPoint(sets, setKey, bySetKey, circleById, {
				width,
				height
			});
			return {
				id: item.id,
				name: item.name,
				value: item.value,
				sets,
				setKey,
				dataIndex: item.dataIndex,
				x: point.x,
				y: point.y
			};
		});
	}
	function resolveHollowLabelPoint(sets, setKey, bySetKey, circleById, rect) {
		const direct = bySetKey.get(setKey);
		if (direct) {
			if (bySetKey.size === 1) return {
				x: direct.x,
				y: direct.y
			};
			if (bySetKey.size === 2) {
				const offset = direct.x < rect.width / 2 ? -direct.r * .36 : direct.r * .36;
				return {
					x: direct.x + offset,
					y: direct.y
				};
			}
			const horizontal = direct.x < rect.width / 2 ? -direct.r * .38 : direct.x > rect.width / 2 ? direct.r * .38 : 0;
			const vertical = direct.y > rect.height / 2 ? direct.r * .42 : -direct.r * .06;
			return {
				x: direct.x + horizontal,
				y: direct.y + vertical
			};
		}
		const selected = sets.map((set) => circleById.get(set)).filter((circle) => Boolean(circle));
		if (!selected.length) return {
			x: rect.width / 2,
			y: rect.height / 2
		};
		if (selected.length === 2) {
			const x = mean(selected.map((circle) => circle.x));
			const y = mean(selected.map((circle) => circle.y));
			const [first, second] = selected;
			const minR = Math.min(first.r, second.r);
			if (bySetKey.size === 3) {
				if (first.y < rect.height / 2 && second.y < rect.height / 2) return {
					x,
					y: y - minR * .28
				};
				return {
					x: x + (x < rect.width / 2 ? -minR * .14 : minR * .14),
					y: y + minR * .1
				};
			}
			return {
				x,
				y
			};
		}
		return {
			x: mean(selected.map((circle) => circle.x)),
			y: mean(selected.map((circle) => circle.y)) + Math.min(...selected.map((circle) => circle.r)) * .08
		};
	}
	function resolveBaseSets(items) {
		const base = [];
		items.forEach((item) => {
			if (item.sets.length === 1 && !base.includes(item.sets[0])) base.push(item.sets[0]);
		});
		items.forEach((item) => {
			item.sets.forEach((set) => {
				if (!base.includes(set)) base.push(set);
			});
		});
		return base;
	}
	function normalizeItems(data) {
		return (Array.isArray(data) ? data : []).map((item, dataIndex) => {
			const record = isPlainObject(item) ? item : {};
			const name = String(record.name ?? record.id ?? dataIndex);
			const sets = normalizeSets(record.sets);
			const rawValue = record.value;
			const itemStyle = isPlainObject(record.itemStyle) ? record.itemStyle : {};
			const color = typeof itemStyle.color === "string" ? itemStyle.color : DEFAULT_PALETTE[dataIndex % DEFAULT_PALETTE.length];
			return {
				id: String(record.id ?? name),
				name,
				value: Array.isArray(rawValue) ? rawValue[0] : rawValue,
				sets,
				setKey: createSetKey(sets),
				dataIndex,
				color
			};
		});
	}
	function normalizeSets(sets) {
		if (!Array.isArray(sets)) return [];
		return Array.from(new Set(sets.map((set) => String(set))));
	}
	function createSetKey(sets) {
		return sets.slice().sort().join("&");
	}
	function fillSetNames(baseSets, count) {
		const fallback = [
			"A",
			"B",
			"C"
		];
		const names = baseSets.slice(0, count);
		while (names.length < count) names.push(fallback[names.length]);
		return names;
	}
	function resolveBubbleRadius(value, maxValue, minRadius, maxRadius) {
		const scale = Math.sqrt(positiveNumber(value, 0) / maxValue);
		return minRadius + (maxRadius - minRadius) * scale;
	}
	function placeBubble(index, radius, center, options) {
		if (index === 0) return clampCircle(center.x, center.y, radius, options);
		const distance = options.maxRadius * (.46 + Math.sqrt(index) * .38) + radius * .48;
		const angle = index * GOLDEN_ANGLE - Math.PI / 7;
		return clampCircle(center.x + Math.cos(angle) * distance, center.y + Math.sin(angle) * distance * .78, radius, options);
	}
	function clampCircle(x, y, r, { width, height, padding }) {
		return {
			x: clamp(x, padding + r, width - padding - r),
			y: clamp(y, padding + r, height - padding - r)
		};
	}
	function clamp(value, min, max) {
		if (min > max) return (min + max) / 2;
		return Math.min(Math.max(value, min), max);
	}
	function mean(values) {
		return values.reduce((sum, value) => sum + value, 0) / values.length;
	}
	function positiveNumber(value, fallback) {
		return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
	}
	function finiteNumber$1(value, fallback) {
		return typeof value === "number" && Number.isFinite(value) ? value : fallback;
	}
	function isPlainObject(value) {
		return value != null && typeof value === "object" && !Array.isArray(value);
	}
	//#endregion
	//#region src/venn.ts
	var echartsHost = echarts_lib_echarts;
	var optionKeys = [
		"padding",
		"minRadius",
		"maxRadius",
		"vennType",
		"mode"
	];
	echartsHost.extendSeriesModel({
		type: "series.venn",
		visualStyleAccessPath: "itemStyle",
		visualDrawType: "fill",
		getInitialData(option) {
			const source = Array.isArray(option.data) ? option.data : [];
			const dimensions = echartsHost.helper.createDimensions(source, { coordDimensions: ["value"] });
			const list = new echartsHost.List(dimensions, this);
			list.initData(source);
			this.legendVisualProvider = createLegendVisualProvider(this);
			return list;
		},
		defaultOption: {
			left: "center",
			top: "center",
			width: "78%",
			height: "78%",
			layout: "hollow",
			layoutOptions: null,
			padding: 20,
			minRadius: null,
			maxRadius: null,
			enterAnimation: true,
			itemStyle: {
				opacity: .62,
				borderColor: "#ffffff",
				borderWidth: 1.5
			},
			hollowStyle: {
				opacity: .92,
				borderWidth: 6,
				color: null
			},
			label: {
				show: true,
				color: "#1f2937",
				fontSize: 12,
				fontWeight: 600,
				formatter: null
			},
			emphasis: { itemStyle: {
				shadowBlur: 10,
				shadowColor: "rgba(31, 41, 55, 0.22)"
			} }
		}
	});
	echartsHost.extendChartView({
		type: "venn",
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
				const layout = resolveVennLayout(readLayoutOption(seriesModel, rect));
				if (this.__renderToken !== renderToken) return;
				const { hoverItems } = renderAlive(this, echartsHost, group, seriesModel, (targetGroup, targetSeriesModel) => drawVenn(echartsHost, targetGroup, targetSeriesModel, layout, rect));
				this.__hoverController = installElementHover(hoverItems, { zrender: api.getZr?.() });
			} catch (error) {
				if (typeof console !== "undefined") console.error("[venn] render failed", error);
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
		const option = seriesModel.option || {};
		const layoutOption = {
			data: Array.isArray(option.data) ? option.data : [],
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
	function drawVenn(echartsInstance, group, seriesModel, layout, rect) {
		const data = seriesModel.getData();
		const chartGroup = new echartsInstance.graphic.Group();
		const hoverItems = [];
		const hoverItemsByDataIndex = /* @__PURE__ */ new Map();
		chartGroup.x = rect.x;
		chartGroup.y = rect.y;
		if (layout.mode === "hollow") drawHollowVenn(echartsInstance, chartGroup, seriesModel, data, layout, hoverItems, hoverItemsByDataIndex);
		else drawBubbleVenn(echartsInstance, chartGroup, seriesModel, data, layout, hoverItems, hoverItemsByDataIndex);
		group.add(chartGroup);
		return hoverItems;
	}
	function drawHollowVenn(echartsInstance, group, seriesModel, data, layout, hoverItems, hoverItemsByDataIndex) {
		layout.circles.forEach((circle, index) => {
			const dataIndex = findDataIndexForCircle(circle, layout.labels, index);
			const itemModel = dataIndex >= 0 ? data.getItemModel(dataIndex) : null;
			const circleEl = new echartsInstance.graphic.Circle({
				shape: {
					cx: circle.x,
					cy: circle.y,
					r: circle.r
				},
				style: readHollowCircleStyle(seriesModel, itemModel, index)
			});
			applyCircleEnterAnimation(circleEl, circle.r, readEnterAnimation(seriesModel, index));
			if (dataIndex >= 0) {
				data.setItemLayout(dataIndex, [circle.x, circle.y]);
				data.setItemGraphicEl(dataIndex, circleEl);
				const hoverItem = createHoverItem(circleEl);
				hoverItems.push(hoverItem);
				hoverItemsByDataIndex.set(dataIndex, hoverItem);
			}
			group.add(circleEl);
		});
		drawLabels(echartsInstance, group, seriesModel, data, layout.labels, hoverItemsByDataIndex);
	}
	function drawBubbleVenn(echartsInstance, group, seriesModel, data, layout, hoverItems, hoverItemsByDataIndex) {
		layout.circles.forEach((circle, index) => {
			const itemModel = data.getItemModel(circle.dataIndex);
			const circleEl = new echartsInstance.graphic.Circle({
				shape: {
					cx: circle.x,
					cy: circle.y,
					r: circle.r
				},
				style: readBubbleCircleStyle(data, seriesModel, itemModel, circle.dataIndex, index)
			});
			applyCircleEnterAnimation(circleEl, circle.r, readEnterAnimation(seriesModel, index));
			data.setItemLayout(circle.dataIndex, [circle.x, circle.y]);
			data.setItemGraphicEl(circle.dataIndex, circleEl);
			const hoverItem = createHoverItem(circleEl);
			hoverItems.push(hoverItem);
			hoverItemsByDataIndex.set(circle.dataIndex, hoverItem);
			group.add(circleEl);
		});
		drawLabels(echartsInstance, group, seriesModel, data, layout.labels, hoverItemsByDataIndex);
	}
	function drawLabels(echartsInstance, group, seriesModel, data, labels, hoverItemsByDataIndex) {
		labels.forEach((label) => {
			const labelModel = data.getItemModel(label.dataIndex).getModel("label");
			const seriesLabelModel = seriesModel.getModel("label");
			if (!(labelModel.get("show") ?? seriesLabelModel.get("show"))) return;
			const textEl = new echartsInstance.graphic.Text({
				style: {
					x: label.x,
					y: label.y,
					text: formatLabel(labelModel.get("formatter") || seriesLabelModel.get("formatter"), label),
					fill: labelModel.get("color") || seriesLabelModel.get("color") || "#1f2937",
					fontSize: labelModel.get("fontSize") || seriesLabelModel.get("fontSize") || 12,
					fontWeight: labelModel.get("fontWeight") || seriesLabelModel.get("fontWeight") || 600,
					align: "center",
					verticalAlign: "middle"
				},
				silent: true
			});
			applyFadeEnterAnimation(textEl, readEnterAnimation(seriesModel, label.dataIndex));
			addHoverElement(hoverItemsByDataIndex.get(label.dataIndex), textEl);
			group.add(textEl);
		});
	}
	function findDataIndexForCircle(circle, labels, fallbackIndex) {
		return labels.find((item) => item.setKey === circle.setKey)?.dataIndex ?? fallbackIndex;
	}
	function readHollowCircleStyle(seriesModel, itemModel, index) {
		const style = asRecord(seriesModel.get("hollowStyle"));
		const itemStyle = itemModel ? asRecord(itemModel.get("itemStyle")) : {};
		return {
			fill: null,
			stroke: itemStyle.color || style.color || DEFAULT_PALETTE[index % DEFAULT_PALETTE.length],
			lineWidth: finiteNumber(itemStyle.borderWidth ?? style.borderWidth, 6),
			opacity: finiteNumber(itemStyle.opacity ?? style.opacity, .92)
		};
	}
	function readBubbleCircleStyle(data, seriesModel, itemModel, dataIndex, index) {
		const normal = asRecord(seriesModel.get("itemStyle"));
		const itemStyle = asRecord(itemModel.get("itemStyle"));
		const visualStyle = asRecord(data.getItemVisual(dataIndex, "style"));
		return {
			fill: itemStyle.color || normal.color || visualStyle.fill || DEFAULT_PALETTE[index % DEFAULT_PALETTE.length],
			stroke: itemStyle.borderColor || normal.borderColor || "#ffffff",
			lineWidth: finiteNumber(itemStyle.borderWidth ?? normal.borderWidth, 1.5),
			opacity: finiteNumber(itemStyle.opacity ?? normal.opacity, .62)
		};
	}
	function formatLabel(formatter, label) {
		if (typeof formatter === "function") return formatter({
			data: label,
			name: label.name,
			value: label.value
		});
		if (typeof formatter === "string") return formatter.replace(/\{b\}/g, label.name).replace(/\{c\}/g, String(label.value ?? ""));
		return label.name;
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
					fill: itemStyle.color || DEFAULT_PALETTE[dataIndex % DEFAULT_PALETTE.length],
					stroke: itemStyle.borderColor || "#ffffff",
					opacity: finiteNumber(itemStyle.opacity, .9)
				};
			}
		};
	}
	function collectDataNames(data) {
		const names = [];
		for (let index = 0; index < data.count(); index++) names.push(data.getName(index));
		return names;
	}
	function finiteNumber(value, fallback) {
		return typeof value === "number" && Number.isFinite(value) ? value : fallback;
	}
	function readEnterAnimation(seriesModel, itemIndex, animationOption = seriesModel.get("enterAnimation")) {
		if (seriesModel.get("animation") === false || animationOption === false) return disabledEnterAnimation();
		const option = animationOption == null || animationOption === true ? {} : asRecord(animationOption);
		if (option.show === false || option.enabled === false) return disabledEnterAnimation();
		const baseDelay = resolveAnimationNumber(option.delay ?? seriesModel.get("animationDelay"), itemIndex, itemIndex, 0);
		const stagger = resolveAnimationNumber(option.stagger, itemIndex, itemIndex, 35);
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
	function applyCircleEnterAnimation(element, radius, animation) {
		if (!animation.enabled) return;
		const animatable = element;
		if (typeof animatable.animate !== "function") return;
		const shape = animatable.shape || {};
		const style = animatable.style || {};
		const opacity = finiteNumber(style.opacity, 1);
		shape.r = 0;
		style.opacity = 0;
		animatable.shape = shape;
		animatable.style = style;
		animateGraphicProperty(animatable, "shape", animation, { r: radius });
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

//# sourceMappingURL=echarts-venn.js.map