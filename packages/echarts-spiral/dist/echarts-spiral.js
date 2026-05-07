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
	var DEFAULT_HEIGHT = 420;
	var DEFAULT_PADDING = 24;
	var DEFAULT_TURNS = 4;
	var DEFAULT_GAP_ANGLE = 3;
	var DEFAULT_RADIAL_GAP = 10;
	var EPSILON = 1e-9;
	function resolveSpiralLayout(option = {}) {
		const layout = isPlainObject(option.layout) ? option.layout : {};
		const layoutOptions = isPlainObject(option.layoutOptions) ? option.layoutOptions : {};
		return layoutSpiral(Array.isArray(option.data) ? option.data : [], {
			...layout,
			...layoutOptions,
			width: finiteNumber$1(option.width, finiteNumber$1(layoutOptions.width, finiteNumber$1(layout.width, DEFAULT_WIDTH))),
			height: finiteNumber$1(option.height, finiteNumber$1(layoutOptions.height, finiteNumber$1(layout.height, DEFAULT_HEIGHT))),
			padding: finiteNumber$1(option.padding, finiteNumber$1(layoutOptions.padding, finiteNumber$1(layout.padding, DEFAULT_PADDING))),
			center: readCenterOption(option.center ?? layoutOptions.center ?? layout.center),
			innerRadius: readLengthOption(option.innerRadius ?? layoutOptions.innerRadius ?? layout.innerRadius),
			outerRadius: readLengthOption(option.outerRadius ?? layoutOptions.outerRadius ?? layout.outerRadius),
			turns: finiteNumber$1(option.turns, finiteNumber$1(layoutOptions.turns, finiteNumber$1(layout.turns, DEFAULT_TURNS))),
			segmentsPerTurn: firstFiniteNumber(option.segmentsPerTurn, layoutOptions.segmentsPerTurn, layout.segmentsPerTurn),
			startAngle: finiteNumber$1(option.startAngle, finiteNumber$1(layoutOptions.startAngle, finiteNumber$1(layout.startAngle, -90))),
			clockwise: readBoolean(option.clockwise) ?? readBoolean(layoutOptions.clockwise) ?? readBoolean(layout.clockwise),
			sort: readSortOption(option.sort ?? layoutOptions.sort ?? layout.sort),
			gapAngle: finiteNumber$1(option.gapAngle, finiteNumber$1(layoutOptions.gapAngle, finiteNumber$1(layout.gapAngle, DEFAULT_GAP_ANGLE))),
			radialGap: finiteNumber$1(option.radialGap, finiteNumber$1(layoutOptions.radialGap, finiteNumber$1(layout.radialGap, DEFAULT_RADIAL_GAP))),
			bandWidth: firstFiniteNumber(option.bandWidth, layoutOptions.bandWidth, layout.bandWidth),
			min: firstFiniteNumber(option.min, layoutOptions.min, layout.min),
			max: firstFiniteNumber(option.max, layoutOptions.max, layout.max),
			nameField: readFieldOption(option.nameField ?? layoutOptions.nameField ?? layout.nameField),
			valueField: readFieldOption(option.valueField ?? layoutOptions.valueField ?? layout.valueField),
			dimensions: normalizeDimensions(option.dimensions ?? layoutOptions.dimensions ?? layout.dimensions)
		});
	}
	function layoutSpiral(data, options = {}) {
		const width = Math.max(1, finiteNumber$1(options.width, DEFAULT_WIDTH));
		const height = Math.max(1, finiteNumber$1(options.height, DEFAULT_HEIGHT));
		const padding = Math.max(0, finiteNumber$1(options.padding, DEFAULT_PADDING));
		const radiusLimit = Math.max(1, Math.min(width, height) / 2);
		const center = resolveCenter(options.center, width, height);
		const normalized = sortPoints(normalizeSpiralData(data, options), options.sort);
		const requestedTurns = Math.max(1, finiteNumber$1(options.turns, DEFAULT_TURNS));
		const turnCount = Math.max(1, Math.ceil(requestedTurns));
		const segmentsPerTurn = Math.max(1, Math.ceil(finiteNumber$1(options.segmentsPerTurn, normalized.length ? normalized.length / turnCount : 1)));
		const requiredTurnCount = normalized.length ? Math.ceil(normalized.length / segmentsPerTurn) : turnCount;
		const finalTurnCount = Math.max(turnCount, requiredTurnCount);
		const outerRadius = clamp$1(readLength(options.outerRadius, radiusLimit, radiusLimit - padding), 0, radiusLimit);
		const innerRadius = clamp$1(readLength(options.innerRadius, radiusLimit, radiusLimit * .22), 0, outerRadius);
		const radiusSpan = Math.max(outerRadius - innerRadius, 1);
		const requestedRadialGap = Math.max(0, finiteNumber$1(options.radialGap, DEFAULT_RADIAL_GAP));
		const maxRadialGap = Math.max(0, (radiusSpan - finalTurnCount - 1) / finalTurnCount);
		const radialGap = Math.min(requestedRadialGap, maxRadialGap);
		const maxBandWidth = Math.max(1, (radiusSpan - finalTurnCount * radialGap) / (finalTurnCount + 1));
		const bandWidth = Math.max(1, Math.min(finiteNumber$1(options.bandWidth, maxBandWidth), maxBandWidth));
		const radialStep = (bandWidth + radialGap) / 360;
		const startAngle = finiteNumber$1(options.startAngle, -90);
		const clockwise = options.clockwise !== false;
		const valueExtent = resolveValueExtent(normalized, options);
		const angleStep = 360 / segmentsPerTurn;
		const gapAngle = Math.max(0, Math.min(finiteNumber$1(options.gapAngle, DEFAULT_GAP_ANGLE), angleStep * .88));
		const direction = clockwise ? 1 : -1;
		const segments = normalized.map((point, index) => {
			const turnIndex = Math.floor(index / segmentsPerTurn);
			const segmentIndex = index % segmentsPerTurn;
			const rawStart = index * angleStep + gapAngle / 2;
			const rawEnd = (index + 1) * angleStep - gapAngle / 2;
			const midProgress = (rawStart + rawEnd) / 2;
			const startAngleDegree = startAngle + direction * rawStart;
			const endAngleDegree = startAngle + direction * rawEnd;
			const midAngleDegree = (startAngleDegree + endAngleDegree) / 2;
			const startInnerPoint = spiralEdgePoint(center.x, center.y, rawStart, startAngle, direction, innerRadius, bandWidth, radialStep, -bandWidth / 2);
			const endInnerPoint = spiralEdgePoint(center.x, center.y, rawEnd, startAngle, direction, innerRadius, bandWidth, radialStep, -bandWidth / 2);
			const startOuterPoint = spiralEdgePoint(center.x, center.y, rawStart, startAngle, direction, innerRadius, bandWidth, radialStep, bandWidth / 2);
			const endOuterPoint = spiralEdgePoint(center.x, center.y, rawEnd, startAngle, direction, innerRadius, bandWidth, radialStep, bandWidth / 2);
			const midInnerPoint = spiralEdgePoint(center.x, center.y, midProgress, startAngle, direction, innerRadius, bandWidth, radialStep, -bandWidth / 2);
			const midOuterPoint = spiralEdgePoint(center.x, center.y, midProgress, startAngle, direction, innerRadius, bandWidth, radialStep, bandWidth / 2);
			const midCenterPoint = spiralCenterPoint(center.x, center.y, midProgress, startAngle, direction, innerRadius, bandWidth, radialStep);
			const startInnerRadius = distanceFromCenter(center.x, center.y, startInnerPoint);
			const endInnerRadius = distanceFromCenter(center.x, center.y, endInnerPoint);
			const startOuterRadius = distanceFromCenter(center.x, center.y, startOuterPoint);
			const endOuterRadius = distanceFromCenter(center.x, center.y, endOuterPoint);
			const segmentInnerRadius = distanceFromCenter(center.x, center.y, midInnerPoint);
			const segmentOuterRadius = distanceFromCenter(center.x, center.y, midOuterPoint);
			const centerRadius = distanceFromCenter(center.x, center.y, midCenterPoint);
			const midAngle = midAngleDegree * Math.PI / 180;
			const x = midCenterPoint.x;
			const y = midCenterPoint.y;
			const labelOffset = Math.max(8, bandWidth * .32);
			const labelX = x + Math.cos(midAngle) * labelOffset;
			const labelY = y + Math.sin(midAngle) * labelOffset;
			return {
				...point,
				index,
				turnIndex,
				segmentIndex,
				startAngle: startAngleDegree * Math.PI / 180,
				endAngle: endAngleDegree * Math.PI / 180,
				midAngle,
				startAngleDegree: cleanNumber(startAngleDegree),
				endAngleDegree: cleanNumber(endAngleDegree),
				midAngleDegree: cleanNumber(midAngleDegree),
				startProgress: cleanNumber(rawStart),
				endProgress: cleanNumber(rawEnd),
				midProgress: cleanNumber(midProgress),
				startInnerRadius: cleanNumber(startInnerRadius),
				endInnerRadius: cleanNumber(endInnerRadius),
				startOuterRadius: cleanNumber(startOuterRadius),
				endOuterRadius: cleanNumber(endOuterRadius),
				innerRadius: cleanNumber(segmentInnerRadius),
				outerRadius: cleanNumber(segmentOuterRadius),
				centerRadius: cleanNumber(centerRadius),
				valueRatio: cleanNumber(valueRatio(point.value, valueExtent)),
				x: cleanNumber(x),
				y: cleanNumber(y),
				labelX: cleanNumber(labelX),
				labelY: cleanNumber(labelY),
				labelAlign: labelAlignForAngle(midAngle),
				labelVerticalAlign: labelVerticalAlignForAngle(midAngle),
				path: createSegmentPath(center.x, center.y, rawStart, rawEnd, startAngle, direction, innerRadius, bandWidth, radialStep)
			};
		});
		return {
			width,
			height,
			padding,
			centerX: cleanNumber(center.x),
			centerY: cleanNumber(center.y),
			innerRadius: cleanNumber(innerRadius),
			outerRadius: cleanNumber(outerRadius),
			turns: requestedTurns,
			turnCount: finalTurnCount,
			segmentsPerTurn,
			startAngle,
			clockwise,
			gapAngle: cleanNumber(gapAngle),
			radialGap: cleanNumber(radialGap),
			bandWidth: cleanNumber(bandWidth),
			valueExtent,
			segments
		};
	}
	function normalizeSpiralData(data, options = {}) {
		const dimensions = normalizeDimensions(options.dimensions);
		const points = [];
		data.forEach((raw, dataIndex) => {
			const value = readNumber(readField(raw, options.valueField ?? "value", dimensions, 1, [
				"value",
				"amount",
				"count",
				"score",
				"users",
				"total"
			]));
			if (value == null) return;
			const nameValue = readField(raw, options.nameField ?? "name", dimensions, 0, [
				"name",
				"id",
				"category",
				"label"
			]);
			const record = isPlainObject(raw) ? raw : {};
			const name = stringifyName(nameValue ?? `spiral-${dataIndex}`);
			points.push({
				id: stringifyName(record.id ?? name),
				name,
				value,
				dataIndex,
				raw
			});
		});
		return points;
	}
	function createSegmentPath(centerX, centerY, startProgress, endProgress, startAngle, direction, innerRadius, bandWidth, radialStep) {
		const outerPoints = sampleSpiralEdge(centerX, centerY, startProgress, endProgress, startAngle, direction, innerRadius, bandWidth, bandWidth / 2, radialStep);
		const innerPoints = sampleSpiralEdge(centerX, centerY, endProgress, startProgress, startAngle, direction, innerRadius, bandWidth, -bandWidth / 2, radialStep);
		return [
			`M ${formatPathNumber(outerPoints[0].x)} ${formatPathNumber(outerPoints[0].y)}`,
			...outerPoints.slice(1).map((point) => `L ${formatPathNumber(point.x)} ${formatPathNumber(point.y)}`),
			...innerPoints.map((point) => `L ${formatPathNumber(point.x)} ${formatPathNumber(point.y)}`),
			"Z"
		].join(" ");
	}
	function sampleSpiralEdge(centerX, centerY, startProgress, endProgress, startAngle, direction, innerRadius, bandWidth, normalOffset, radialStep) {
		const steps = Math.max(2, Math.ceil(Math.abs(endProgress - startProgress) / 6));
		const points = [];
		for (let index = 0; index <= steps; index += 1) {
			const progress = startProgress + (endProgress - startProgress) * index / steps;
			points.push(spiralEdgePoint(centerX, centerY, progress, startAngle, direction, innerRadius, bandWidth, radialStep, normalOffset));
		}
		return points;
	}
	function spiralEdgePoint(centerX, centerY, progress, startAngle, direction, innerRadius, bandWidth, radialStep, normalOffset) {
		const centerPoint = spiralCenterPoint(centerX, centerY, progress, startAngle, direction, innerRadius, bandWidth, radialStep);
		return {
			x: centerPoint.x + centerPoint.normalX * normalOffset,
			y: centerPoint.y + centerPoint.normalY * normalOffset
		};
	}
	function spiralCenterPoint(centerX, centerY, progress, startAngle, direction, innerRadius, bandWidth, radialStep) {
		const radius = innerRadius + bandWidth / 2 + radialStep * progress;
		const angle = (startAngle + direction * progress) * Math.PI / 180;
		const cos = Math.cos(angle);
		const sin = Math.sin(angle);
		const angleStep = direction * Math.PI / 180;
		const tangentX = radialStep * cos - radius * sin * angleStep;
		const tangentY = radialStep * sin + radius * cos * angleStep;
		const tangentLength = Math.hypot(tangentX, tangentY) || 1;
		let normalX = -tangentY / tangentLength;
		let normalY = tangentX / tangentLength;
		if (normalX * cos + normalY * sin < 0) {
			normalX = -normalX;
			normalY = -normalY;
		}
		return {
			x: centerX + cos * radius,
			y: centerY + sin * radius,
			normalX,
			normalY
		};
	}
	function distanceFromCenter(centerX, centerY, point) {
		return Math.hypot(point.x - centerX, point.y - centerY);
	}
	function sortPoints(points, sort) {
		const normalizedSort = readSortOption(sort);
		if (normalizedSort === "none") return points;
		return points.slice().sort((left, right) => {
			return (normalizedSort === "asc" ? left.value - right.value : right.value - left.value) || left.dataIndex - right.dataIndex;
		});
	}
	function resolveValueExtent(points, options) {
		const values = points.map((point) => point.value).filter(Number.isFinite);
		let min = finiteNumber$1(options.min, values.length ? Math.min(...values) : 0);
		let max = finiteNumber$1(options.max, values.length ? Math.max(...values) : 1);
		if (max < min) [min, max] = [max, min];
		if (Math.abs(max - min) < EPSILON) max = min + 1;
		return {
			min,
			max
		};
	}
	function valueRatio(value, extent) {
		return clamp$1((value - extent.min) / Math.max(extent.max - extent.min, EPSILON), 0, 1);
	}
	function readField(item, field, dimensions, fallbackIndex, fallbackFields) {
		if (Array.isArray(item)) {
			const fieldIndex = typeof field === "number" ? field : dimensions.indexOf(field);
			if (fieldIndex >= 0 && fieldIndex < item.length) return item[fieldIndex];
			if (fallbackIndex >= 0 && fallbackIndex < item.length) return item[fallbackIndex];
			return;
		}
		if (!isPlainObject(item)) return void 0;
		const fields = typeof field === "string" ? [field, ...fallbackFields] : fallbackFields;
		for (const candidate of fields) if (item[candidate] != null) return item[candidate];
	}
	function resolveCenter(center, width, height) {
		if (!center) return {
			x: width / 2,
			y: height / 2
		};
		return {
			x: readCoordinate(center[0], width, width / 2),
			y: readCoordinate(center[1], height, height / 2)
		};
	}
	function readCoordinate(value, size, fallback) {
		if (typeof value === "number" && Number.isFinite(value)) return value;
		if (typeof value === "string") {
			const trimmed = value.trim();
			if (trimmed.endsWith("%")) {
				const percent = Number(trimmed.slice(0, -1));
				return Number.isFinite(percent) ? size * percent / 100 : fallback;
			}
			const numeric = Number(trimmed);
			if (Number.isFinite(numeric)) return numeric;
		}
		return fallback;
	}
	function readLength(value, relative, fallback) {
		if (typeof value === "number" && Number.isFinite(value)) return value;
		if (typeof value === "string") {
			const trimmed = value.trim();
			if (trimmed.endsWith("%")) {
				const percent = Number(trimmed.slice(0, -1));
				return Number.isFinite(percent) ? relative * percent / 100 : fallback;
			}
			const numeric = Number(trimmed);
			if (Number.isFinite(numeric)) return numeric;
		}
		return fallback;
	}
	function readCenterOption(value) {
		if (!Array.isArray(value) || value.length < 2) return void 0;
		const [x, y] = value;
		return (typeof x === "number" || typeof x === "string") && (typeof y === "number" || typeof y === "string") ? [x, y] : void 0;
	}
	function readLengthOption(value) {
		return typeof value === "number" || typeof value === "string" ? value : void 0;
	}
	function readSortOption(value) {
		if (value === true) return "desc";
		if (value === "asc" || value === "desc") return value;
		return "none";
	}
	function readFieldOption(value) {
		return typeof value === "string" || typeof value === "number" && Number.isFinite(value) ? value : void 0;
	}
	function normalizeDimensions(value) {
		return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
	}
	function labelAlignForAngle(angle) {
		const cosine = Math.cos(angle);
		if (cosine > .25) return "left";
		if (cosine < -.25) return "right";
		return "center";
	}
	function labelVerticalAlignForAngle(angle) {
		const sine = Math.sin(angle);
		if (sine > .25) return "top";
		if (sine < -.25) return "bottom";
		return "middle";
	}
	function readNumber(value) {
		const numeric = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
		return Number.isFinite(numeric) ? numeric : void 0;
	}
	function finiteNumber$1(value, fallback) {
		return typeof value === "number" && Number.isFinite(value) ? value : fallback;
	}
	function firstFiniteNumber(...values) {
		return values.find((value) => typeof value === "number" && Number.isFinite(value));
	}
	function readBoolean(value) {
		return typeof value === "boolean" ? value : void 0;
	}
	function clamp$1(value, min, max) {
		return Math.max(min, Math.min(max, value));
	}
	function cleanNumber(value) {
		return Number(value.toFixed(6));
	}
	function formatPathNumber(value) {
		return Number(value.toFixed(3)).toString();
	}
	function stringifyName(value) {
		return typeof value === "string" || typeof value === "number" ? String(value) : "";
	}
	function isPlainObject(value) {
		return typeof value === "object" && value !== null && !Array.isArray(value);
	}
	//#endregion
	//#region src/spiral.ts
	var echartsHost = echarts_lib_echarts;
	var optionKeys = [
		"padding",
		"center",
		"innerRadius",
		"outerRadius",
		"turns",
		"segmentsPerTurn",
		"startAngle",
		"clockwise",
		"sort",
		"gapAngle",
		"radialGap",
		"bandWidth",
		"min",
		"max",
		"nameField",
		"valueField",
		"dimensions"
	];
	var layerZ = {
		segment: 6,
		label: 8
	};
	echartsHost.extendSeriesModel({
		type: "series.spiral",
		visualStyleAccessPath: "itemStyle",
		visualDrawType: "fill",
		getInitialData(option) {
			const source = Array.isArray(option.data) ? option.data : [];
			const dimensions = echartsHost.helper.createDimensions(source, { coordDimensions: ["value"] });
			const list = new echartsHost.List(dimensions, this);
			list.initData(source);
			return list;
		},
		getTooltipPosition(dataIndex) {
			const layout = this.getData().getItemLayout(dataIndex);
			return Array.isArray(layout) ? layout : void 0;
		},
		defaultOption: {
			left: "center",
			top: "center",
			width: "94%",
			height: "84%",
			padding: 28,
			center: null,
			innerRadius: null,
			outerRadius: null,
			turns: 4,
			segmentsPerTurn: null,
			startAngle: -90,
			clockwise: true,
			sort: false,
			gapAngle: 3,
			radialGap: 10,
			bandWidth: null,
			min: null,
			max: null,
			nameField: "name",
			valueField: "value",
			dimensions: null,
			minOpacity: .18,
			maxOpacity: .92,
			enterAnimation: true,
			itemStyle: {
				color: "#ef4444",
				borderColor: "#ffffff",
				borderWidth: 0,
				opacity: null
			},
			label: {
				show: false,
				position: "outside",
				color: "#334155",
				fontSize: 12,
				fontWeight: 600,
				formatter: "{b}"
			},
			emphasis: { itemStyle: {
				opacity: 1,
				borderColor: "#111827",
				borderWidth: 2.2,
				shadowBlur: 12,
				shadowColor: "rgba(37, 99, 235, 0.22)"
			} },
			tooltip: { trigger: "item" }
		}
	});
	echartsHost.extendChartView({
		type: "spiral",
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
				const layout = resolveSpiralLayout(readLayoutOption(seriesModel, rect));
				if (this.__renderToken !== renderToken) return;
				const { hoverItems } = renderAlive(this, echartsHost, group, seriesModel, (targetGroup, targetSeriesModel) => drawSpiral(echartsHost, targetGroup, targetSeriesModel, layout, rect));
				this.__hoverController = installElementHover(hoverItems, {
					dimOpacity: .2,
					zrender: api.getZr?.()
				});
			} catch (error) {
				if (typeof console !== "undefined") console.error("[spiral] render failed", error);
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
			width: rect.width,
			height: rect.height
		};
		optionKeys.forEach((key) => {
			const value = seriesModel.get(key);
			if (value !== void 0 && value !== null) layoutOption[key] = value;
		});
		return layoutOption;
	}
	function drawSpiral(echartsInstance, group, seriesModel, layout, rect) {
		const data = seriesModel.getData();
		const chartGroup = new echartsInstance.graphic.Group();
		const hoverItems = [];
		chartGroup.x = rect.x;
		chartGroup.y = rect.y;
		layout.segments.forEach((segment, itemIndex) => {
			if (segment.dataIndex < 0 || segment.dataIndex >= data.count()) return;
			const itemModel = data.getItemModel(segment.dataIndex);
			const itemGroup = new echartsInstance.graphic.Group();
			const segmentElement = createSegmentElement(echartsInstance, segment, readSegmentStyle(data, seriesModel, itemModel, segment, itemIndex));
			const hoverItem = { elements: [segmentElement] };
			applyFadeEnterAnimation(segmentElement, resolveEnterAnimation(seriesModel, itemIndex));
			enableHover(segmentElement, itemModel);
			itemGroup.add(segmentElement);
			const label = createLabelElement(echartsInstance, seriesModel, itemModel, segment);
			if (label) {
				applyFadeEnterAnimation(label, resolveEnterAnimation(seriesModel, itemIndex));
				itemGroup.add(label);
				hoverItem.elements.push(label);
			}
			data.setItemLayout(segment.dataIndex, [segment.x, segment.y]);
			data.setItemGraphicEl(segment.dataIndex, itemGroup);
			chartGroup.add(itemGroup);
			hoverItems.push(hoverItem);
		});
		group.add(chartGroup);
		return hoverItems;
	}
	function createSegmentElement(echartsInstance, segment, style) {
		if (echartsInstance.graphic.makePath) {
			const element = echartsInstance.graphic.makePath(segment.path, {
				style,
				silent: false,
				z2: layerZ.segment
			});
			element.silent = false;
			return element;
		}
		return new echartsInstance.graphic.Circle({
			shape: {
				cx: segment.x,
				cy: segment.y,
				r: Math.max(1, (segment.outerRadius - segment.innerRadius) / 2)
			},
			style,
			silent: false,
			z2: layerZ.segment
		});
	}
	function createLabelElement(echartsInstance, seriesModel, itemModel, segment) {
		const seriesLabelModel = seriesModel.getModel("label");
		const itemLabelModel = itemModel.getModel("label");
		if ((itemLabelModel.get("show") ?? seriesLabelModel.get("show")) !== true) return null;
		const inside = (itemLabelModel.get("position") || seriesLabelModel.get("position")) === "inside";
		const text = formatLabel(itemLabelModel.get("formatter") || seriesLabelModel.get("formatter"), segment);
		return new echartsInstance.graphic.Text({
			style: {
				x: inside ? segment.x : segment.labelX,
				y: inside ? segment.y : segment.labelY,
				text: String(text),
				fill: itemLabelModel.get("color") || seriesLabelModel.get("color") || "#334155",
				fontSize: finiteNumber(itemLabelModel.get("fontSize"), finiteNumber(seriesLabelModel.get("fontSize"), 12)),
				fontWeight: itemLabelModel.get("fontWeight") || seriesLabelModel.get("fontWeight") || 600,
				align: inside ? "center" : segment.labelAlign,
				verticalAlign: inside ? "middle" : segment.labelVerticalAlign
			},
			silent: true,
			z2: layerZ.label
		});
	}
	function readSegmentStyle(data, seriesModel, itemModel, segment, itemIndex) {
		const itemStyleModel = itemModel.getModel("itemStyle");
		const seriesItemStyleModel = seriesModel.getModel("itemStyle");
		const visualStyle = asRecord(data.getItemVisual(segment.dataIndex, "style"));
		const fill = itemStyleModel.get("color") || visualStyle.fill || seriesItemStyleModel.get("color") || DEFAULT_COLORS[itemIndex % DEFAULT_COLORS.length];
		const opacity = itemStyleModel.get("opacity") ?? seriesItemStyleModel.get("opacity");
		return {
			fill,
			stroke: itemStyleModel.get("borderColor") || seriesItemStyleModel.get("borderColor") || "#ffffff",
			lineWidth: finiteNumber(itemStyleModel.get("borderWidth"), finiteNumber(seriesItemStyleModel.get("borderWidth"), 0)),
			opacity: finiteNumber(opacity, scaledOpacity(seriesModel, segment.valueRatio)),
			shadowBlur: itemStyleModel.get("shadowBlur") || seriesItemStyleModel.get("shadowBlur"),
			shadowColor: itemStyleModel.get("shadowColor") || seriesItemStyleModel.get("shadowColor")
		};
	}
	function scaledOpacity(seriesModel, valueRatio) {
		const minOpacity = clamp(finiteNumber(seriesModel.get("minOpacity"), .18), 0, 1);
		return minOpacity + valueRatio * (clamp(finiteNumber(seriesModel.get("maxOpacity"), .92), minOpacity, 1) - minOpacity);
	}
	function formatLabel(formatter, point) {
		const params = {
			data: point.raw,
			name: point.name,
			value: point.value,
			dataIndex: point.dataIndex
		};
		if (typeof formatter === "function") return formatter(params);
		if (typeof formatter === "string") return formatter.replace(/\{b\}/g, point.name).replace(/\{c\}/g, String(point.value)).replace(/\{value\}/g, String(point.value)).replace(/\{name\}/g, point.name);
		return point.name;
	}
	function resolveEnterAnimation(seriesModel, index) {
		if (seriesModel.get("animation") === false) return disabledAnimation();
		const raw = seriesModel.get("enterAnimation");
		if (raw === false) return disabledAnimation();
		const config = raw == null || raw === true ? {} : asRecord(raw);
		if (config.show === false || config.enabled === false) return disabledAnimation();
		return {
			enabled: true,
			duration: finiteNumber(config.duration ?? seriesModel.get("animationDuration"), 560),
			delay: resolveAnimationValue(config.delay ?? seriesModel.get("animationDelay"), index, 0) + index * finiteNumber(config.stagger, 22),
			easing: typeof (config.easing ?? seriesModel.get("animationEasing")) === "string" ? String(config.easing ?? seriesModel.get("animationEasing")) : "cubicOut"
		};
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
	function animateGraphicProperty(element, key, animation, target) {
		const animator = element.animate?.(key);
		if (!animator) return;
		const frame = animator.when(animation.duration, target);
		if (animation.delay > 0) frame.delay?.(animation.delay);
		frame.start(animation.easing);
	}
	function enableHover(element, itemModel) {
		echartsHost.helper.enableHoverEmphasis?.(element, itemModel.get(["emphasis", "focus"]), itemModel.get(["emphasis", "blurScope"]));
	}
	function resolveAnimationValue(value, index, fallback) {
		if (typeof value === "function") return finiteNumber(value(index), fallback);
		return finiteNumber(value, fallback);
	}
	function disabledAnimation() {
		return {
			enabled: false,
			duration: 0,
			delay: 0,
			easing: "cubicOut"
		};
	}
	function asRecord(value) {
		return typeof value === "object" && value !== null && !Array.isArray(value) ? value : {};
	}
	function finiteNumber(value, fallback) {
		return typeof value === "number" && Number.isFinite(value) ? value : fallback;
	}
	function clamp(value, min, max) {
		return Math.max(min, Math.min(max, value));
	}
	var DEFAULT_COLORS = [
		"#ef4444",
		"#f87171",
		"#fca5a5",
		"#fb7185",
		"#dc2626"
	];
	//#endregion
});

//# sourceMappingURL=echarts-spiral.js.map