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
	var DEFAULT_WIDTH = 720;
	var DEFAULT_HEIGHT = 720;
	var DEFAULT_PADDING = 28;
	var DEFAULT_INNER_RADIUS = "42%";
	var DEFAULT_OUTER_RADIUS = "88%";
	var DEFAULT_TICK_COUNT = 5;
	function resolveRadialAreaLayout(option = {}) {
		const layout = isPlainObject(option.layout) ? option.layout : {};
		const layoutOptions = isPlainObject(option.layoutOptions) ? option.layoutOptions : {};
		const merged = {
			...layout,
			...layoutOptions,
			width: finiteNumber$1(option.width, finiteNumber$1(layoutOptions.width, finiteNumber$1(layout.width, DEFAULT_WIDTH))),
			height: finiteNumber$1(option.height, finiteNumber$1(layoutOptions.height, finiteNumber$1(layout.height, DEFAULT_HEIGHT))),
			padding: finiteNumber$1(option.padding, finiteNumber$1(layoutOptions.padding, finiteNumber$1(layout.padding, DEFAULT_PADDING))),
			center: readTuple(option.center, readTuple(layoutOptions.center, readTuple(layout.center, void 0))),
			radius: readTuple(option.radius, readTuple(layoutOptions.radius, readTuple(layout.radius, void 0))),
			innerRadius: readRadiusOption(option.innerRadius ?? layoutOptions.innerRadius ?? layout.innerRadius),
			outerRadius: readRadiusOption(option.outerRadius ?? layoutOptions.outerRadius ?? layout.outerRadius),
			startAngle: finiteNumber$1(option.startAngle, finiteNumber$1(layoutOptions.startAngle, finiteNumber$1(layout.startAngle, void 0))),
			endAngle: finiteNumber$1(option.endAngle, finiteNumber$1(layoutOptions.endAngle, finiteNumber$1(layout.endAngle, void 0))),
			angleSpan: finiteNumber$1(option.angleSpan, finiteNumber$1(layoutOptions.angleSpan, finiteNumber$1(layout.angleSpan, void 0))),
			clockwise: firstBoolean(option.clockwise, layoutOptions.clockwise, layout.clockwise),
			closed: firstBoolean(option.closed, layoutOptions.closed, layout.closed),
			angleType: readAngleType(option.angleType ?? layoutOptions.angleType ?? layout.angleType),
			angleField: readFieldOption(option.angleField ?? layoutOptions.angleField ?? layout.angleField),
			valueField: readFieldOption(option.valueField ?? layoutOptions.valueField ?? layout.valueField),
			minField: readFieldOption(option.minField ?? layoutOptions.minField ?? layout.minField),
			maxField: readFieldOption(option.maxField ?? layoutOptions.maxField ?? layout.maxField),
			nameField: readFieldOption(option.nameField ?? layoutOptions.nameField ?? layout.nameField),
			dimensions: normalizeDimensions(option.dimensions ?? layoutOptions.dimensions ?? layout.dimensions),
			categories: normalizeCategories(option.categories ?? layoutOptions.categories ?? layout.categories),
			min: finiteNumber$1(option.min, finiteNumber$1(layoutOptions.min, finiteNumber$1(layout.min, void 0))),
			max: finiteNumber$1(option.max, finiteNumber$1(layoutOptions.max, finiteNumber$1(layout.max, void 0))),
			tickCount: finiteNumber$1(option.tickCount, finiteNumber$1(layoutOptions.tickCount, finiteNumber$1(layout.tickCount, void 0))),
			nice: firstBoolean(option.nice, layoutOptions.nice, layout.nice)
		};
		return layoutRadialArea(Array.isArray(option.data) ? option.data : [], merged);
	}
	function layoutRadialArea(data, options = {}) {
		const width = Math.max(1, finiteNumber$1(options.width, DEFAULT_WIDTH));
		const height = Math.max(1, finiteNumber$1(options.height, DEFAULT_HEIGHT));
		const padding = Math.max(0, finiteNumber$1(options.padding, DEFAULT_PADDING));
		const centerX = parseCenter(options.center?.[0], width, width / 2);
		const centerY = parseCenter(options.center?.[1], height, height / 2);
		const radiusLimit = Math.max(1, Math.min(width, height) / 2 - padding);
		const radiusOption = Array.isArray(options.radius) ? options.radius : void 0;
		const innerRadius = clampRadius(parseRadius(radiusOption?.[0] ?? options.innerRadius ?? DEFAULT_INNER_RADIUS, radiusLimit, parseRadius(DEFAULT_INNER_RADIUS, radiusLimit, radiusLimit * .42)), 0, radiusLimit);
		const outerRadius = clampRadius(parseRadius(radiusOption?.[1] ?? options.outerRadius ?? DEFAULT_OUTER_RADIUS, radiusLimit, parseRadius(DEFAULT_OUTER_RADIUS, radiusLimit, radiusLimit * .88)), innerRadius + 1, radiusLimit);
		const startAngle = finiteNumber$1(options.startAngle, 90);
		const clockwise = options.clockwise !== false;
		const closed = options.closed !== false;
		const angleSpan = Math.max(0, finiteNumber$1(options.angleSpan, options.endAngle != null ? Math.abs(startAngle - finiteNumber$1(options.endAngle, startAngle - 360)) : 360));
		const normalized = normalizeItems(data, options);
		const angleDomain = resolveAngleDomain(normalized, options);
		const ordered = orderByAngle(normalized, angleDomain, options);
		const valueExtent = resolveValueExtent(ordered, options);
		const radialTicks = createRadialTicks(valueExtent.min, valueExtent.max, Math.max(2, Math.round(finiteNumber$1(options.tickCount, DEFAULT_TICK_COUNT)))).map((value) => ({
			value,
			radius: projectRadius(value, valueExtent, innerRadius, outerRadius)
		}));
		const points = ordered.map((item) => createPoint(item, angleDomain, valueExtent, innerRadius, outerRadius, centerX, centerY, startAngle, angleSpan, clockwise));
		const valuePolygon = points.map((point) => ({
			name: point.name,
			angle: point.angle,
			value: point.value,
			radius: point.radius,
			x: point.x,
			y: point.y,
			dataIndex: point.dataIndex
		}));
		const rangePolygon = createRangePolygon(points, closed);
		const angleLabels = createAngleLabels(angleDomain, points, centerX, centerY, Math.max(innerRadius - 18, 0), startAngle, angleSpan, clockwise);
		return {
			width,
			height,
			padding,
			centerX,
			centerY,
			innerRadius,
			outerRadius,
			startAngle,
			angleSpan,
			clockwise,
			closed,
			angleType: angleDomain.type,
			valueExtent,
			radialTicks,
			angleLabels,
			points,
			valuePolygon,
			rangePolygon
		};
	}
	function normalizeItems(data, options) {
		const dimensions = normalizeDimensions(options.dimensions);
		const normalized = [];
		data.forEach((item, dataIndex) => {
			const angleValue = readField(item, options.angleField ?? "angle", dimensions, 0, [
				"time",
				"date",
				"month",
				"category",
				"name"
			]);
			const value = finiteNumber$1(readField(item, options.valueField ?? "value", dimensions, 1, [
				"mean",
				"avg",
				"median"
			]), NaN);
			if (!Number.isFinite(value)) return;
			const rangeValues = normalizeRange(finiteNumber$1(readField(item, options.minField ?? "min", dimensions, 2, [
				"low",
				"lower",
				"minValue"
			]), NaN), finiteNumber$1(readField(item, options.maxField ?? "max", dimensions, 3, [
				"high",
				"upper",
				"maxValue"
			]), NaN));
			const name = stringifyName(readField(item, options.nameField ?? "name", dimensions, -1, []) ?? angleValue ?? `item-${dataIndex}`);
			const id = stringifyName((isPlainObject(item) ? item : {}).id ?? `${name}-${dataIndex}`);
			normalized.push({
				id,
				name,
				angleValue,
				angleNumeric: numericAngleValue(angleValue),
				value,
				min: rangeValues?.min,
				max: rangeValues?.max,
				dataIndex,
				raw: item
			});
		});
		return normalized;
	}
	function resolveAngleDomain(items, options) {
		const type = readAngleType(options.angleType) || inferAngleType(items);
		if (type === "category") {
			const explicitCategories = normalizeCategories(options.categories);
			const categories = explicitCategories.length ? explicitCategories : unique(items.map((item) => stringifyName(item.angleValue ?? item.name)));
			return {
				type,
				categories,
				min: 0,
				max: Math.max(categories.length, 1)
			};
		}
		const values = items.map((item) => item.angleNumeric).filter((value) => Number.isFinite(value));
		const min = values.length ? Math.min(...values) : 0;
		const max = values.length ? Math.max(...values) : 1;
		return {
			type,
			categories: [],
			min,
			max: max === min ? min + 1 : max
		};
	}
	function orderByAngle(items, domain, options) {
		if (domain.type === "category") {
			const order = new Map(domain.categories.map((category, index) => [category, index]));
			return [...items].sort((left, right) => {
				return (order.get(stringifyName(left.angleValue ?? left.name)) ?? Number.MAX_SAFE_INTEGER) - (order.get(stringifyName(right.angleValue ?? right.name)) ?? Number.MAX_SAFE_INTEGER) || left.dataIndex - right.dataIndex;
			});
		}
		return [...items].sort((left, right) => left.angleNumeric - right.angleNumeric || left.dataIndex - right.dataIndex);
	}
	function resolveValueExtent(items, options) {
		const values = [];
		items.forEach((item) => {
			values.push(item.value);
			if (item.min != null) values.push(item.min);
			if (item.max != null) values.push(item.max);
		});
		let min = finiteNumber$1(options.min, values.length ? Math.min(...values) : 0);
		let max = finiteNumber$1(options.max, values.length ? Math.max(...values) : 1);
		if (min === max) {
			const delta = Math.abs(min) || 1;
			min -= delta * .5;
			max += delta * .5;
		}
		if (min > max) [min, max] = [max, min];
		const hasExplicitMin = Number.isFinite(options.min);
		const hasExplicitMax = Number.isFinite(options.max);
		if (options.nice !== false && (!hasExplicitMin || !hasExplicitMax)) {
			const tickCount = Math.max(2, Math.round(finiteNumber$1(options.tickCount, DEFAULT_TICK_COUNT)));
			const nice = niceExtent(min, max, tickCount);
			if (!hasExplicitMin) min = nice.min;
			if (!hasExplicitMax) max = nice.max;
		}
		return {
			min,
			max
		};
	}
	function createPoint(item, domain, valueExtent, innerRadius, outerRadius, centerX, centerY, startAngle, angleSpan, clockwise) {
		const ratio = resolveAngleRatio(item, domain);
		const angle = startAngle + (clockwise ? -1 : 1) * ratio * angleSpan;
		const radius = projectRadius(item.value, valueExtent, innerRadius, outerRadius);
		const valuePoint = pointFromPolar(centerX, centerY, radius, angle);
		const minRadius = item.min == null ? void 0 : projectRadius(item.min, valueExtent, innerRadius, outerRadius);
		const maxRadius = item.max == null ? void 0 : projectRadius(item.max, valueExtent, innerRadius, outerRadius);
		const minPoint = minRadius == null ? void 0 : pointFromPolar(centerX, centerY, minRadius, angle);
		const maxPoint = maxRadius == null ? void 0 : pointFromPolar(centerX, centerY, maxRadius, angle);
		return {
			id: item.id,
			name: item.name,
			angleValue: item.angleValue,
			angle,
			angleRatio: ratio,
			value: item.value,
			min: item.min,
			max: item.max,
			radius,
			minRadius,
			maxRadius,
			x: valuePoint.x,
			y: valuePoint.y,
			minX: minPoint?.x,
			minY: minPoint?.y,
			maxX: maxPoint?.x,
			maxY: maxPoint?.y,
			dataIndex: item.dataIndex,
			raw: item.raw
		};
	}
	function resolveAngleRatio(item, domain) {
		if (domain.type === "category") {
			const category = stringifyName(item.angleValue ?? item.name);
			const index = Math.max(0, domain.categories.indexOf(category));
			return domain.categories.length > 0 ? index / domain.categories.length : 0;
		}
		return clamp((item.angleNumeric - domain.min) / (domain.max - domain.min || 1), 0, 1);
	}
	function createRangePolygon(points, closed) {
		const ranged = points.filter((point) => point.minRadius != null && point.maxRadius != null);
		const outer = ranged.map((point) => ({
			name: point.name,
			angle: point.angle,
			value: point.max,
			radius: point.maxRadius,
			x: point.maxX,
			y: point.maxY,
			dataIndex: point.dataIndex
		}));
		const inner = [...ranged].reverse().map((point) => ({
			name: point.name,
			angle: point.angle,
			value: point.min,
			radius: point.minRadius,
			x: point.minX,
			y: point.minY,
			dataIndex: point.dataIndex
		}));
		if (closed && outer.length > 2 && inner.length > 2) return outer.concat([outer[0], inner[inner.length - 1]], inner);
		return outer.concat(inner);
	}
	function createAngleLabels(domain, points, centerX, centerY, radius, startAngle, angleSpan, clockwise) {
		return (domain.type === "category" ? domain.categories.map((category, index) => ({
			name: category,
			value: category,
			ratio: domain.categories.length ? index / domain.categories.length : 0
		})) : points.map((point) => ({
			name: point.name,
			value: point.angleValue,
			ratio: point.angleRatio
		}))).map((label) => {
			const angle = startAngle + (clockwise ? -1 : 1) * label.ratio * angleSpan;
			const point = pointFromPolar(centerX, centerY, radius, angle);
			const placement = labelPlacement(angle);
			return {
				name: label.name,
				value: label.value,
				angle,
				x: point.x,
				y: point.y,
				align: placement.align,
				verticalAlign: placement.verticalAlign
			};
		});
	}
	function createRadialTicks(min, max, tickCount) {
		if (tickCount <= 1) return [min, max];
		const step = (max - min) / (tickCount - 1);
		return Array.from({ length: tickCount }, (_, index) => roundNumber(index === tickCount - 1 ? max : min + step * index));
	}
	function niceExtent(min, max, tickCount) {
		const step = niceNumber(Math.max(Math.abs(max - min), Number.EPSILON) / Math.max(1, tickCount - 1), true);
		return {
			min: Math.floor(min / step) * step,
			max: Math.ceil(max / step) * step
		};
	}
	function niceNumber(value, round) {
		const exponent = Math.floor(Math.log10(value));
		const fraction = value / 10 ** exponent;
		let niceFraction;
		if (round) niceFraction = fraction < 1.5 ? 1 : fraction < 3 ? 2 : fraction < 7 ? 5 : 10;
		else niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
		return niceFraction * 10 ** exponent;
	}
	function projectRadius(value, extent, innerRadius, outerRadius) {
		const ratio = clamp((value - extent.min) / (extent.max - extent.min || 1), 0, 1);
		return innerRadius + (outerRadius - innerRadius) * ratio;
	}
	function pointFromPolar(centerX, centerY, radius, angle) {
		const radians = angle * Math.PI / 180;
		return {
			x: centerX + Math.cos(radians) * radius,
			y: centerY - Math.sin(radians) * radius
		};
	}
	function labelPlacement(angle) {
		const radians = angle * Math.PI / 180;
		const x = Math.cos(radians);
		const y = Math.sin(radians);
		return {
			align: x > .18 ? "left" : x < -.18 ? "right" : "center",
			verticalAlign: y > .18 ? "bottom" : y < -.18 ? "top" : "middle"
		};
	}
	function readField(item, field, dimensions, fallbackIndex, fallbackNames) {
		if (Array.isArray(item)) {
			const dimensionIndex = typeof field === "string" ? dimensions?.indexOf(field) : void 0;
			const index = typeof field === "number" ? field : dimensionIndex != null && dimensionIndex >= 0 ? dimensionIndex : fallbackIndex;
			return index >= 0 ? item[index] : void 0;
		}
		if (!isPlainObject(item)) return void 0;
		if (typeof field === "string" && item[field] != null) return item[field];
		for (const fallbackName of fallbackNames) if (item[fallbackName] != null) return item[fallbackName];
	}
	function normalizeRange(minValue, maxValue) {
		if (!Number.isFinite(minValue) || !Number.isFinite(maxValue)) return void 0;
		return minValue <= maxValue ? {
			min: minValue,
			max: maxValue
		} : {
			min: maxValue,
			max: minValue
		};
	}
	function numericAngleValue(value) {
		const numberValue = finiteNumber$1(value, NaN);
		if (Number.isFinite(numberValue)) return numberValue;
		if (value instanceof Date) return value.getTime();
		if (typeof value === "string") {
			const timestamp = Date.parse(value);
			if (Number.isFinite(timestamp)) return timestamp;
		}
		return NaN;
	}
	function inferAngleType(items) {
		if (!items.length) return "category";
		if (items.every((item) => Number.isFinite(item.angleNumeric))) return items.some((item) => item.angleValue instanceof Date || typeof item.angleValue === "string" && Number.isFinite(Date.parse(item.angleValue))) ? "time" : "value";
		return "category";
	}
	function parseCenter(value, size, fallback) {
		if (typeof value === "string" && value.trim().endsWith("%")) return Number.parseFloat(value) / 100 * size;
		return finiteNumber$1(value, fallback);
	}
	function parseRadius(value, radiusLimit, fallback) {
		if (typeof value === "string" && value.trim().endsWith("%")) return Number.parseFloat(value) / 100 * radiusLimit;
		return finiteNumber$1(value, fallback);
	}
	function clampRadius(value, min, max) {
		return clamp(Number.isFinite(value) ? value : min, min, max);
	}
	function normalizeDimensions(value) {
		return Array.isArray(value) ? value.filter((item) => typeof item === "string") : void 0;
	}
	function normalizeCategories(value) {
		return Array.isArray(value) ? value.filter((item) => typeof item === "string" || typeof item === "number").map((item) => String(item)) : [];
	}
	function unique(values) {
		return Array.from(new Set(values));
	}
	function readTuple(value, fallback) {
		return Array.isArray(value) && value.length >= 2 ? [value[0], value[1]] : fallback;
	}
	function readAngleType(value) {
		return value === "category" || value === "time" || value === "value" ? value : void 0;
	}
	function readFieldOption(value) {
		return typeof value === "string" || typeof value === "number" ? value : void 0;
	}
	function readRadiusOption(value) {
		return typeof value === "string" || typeof value === "number" ? value : void 0;
	}
	function firstBoolean(...values) {
		for (const value of values) if (typeof value === "boolean") return value;
	}
	function finiteNumber$1(value, fallback) {
		const numberValue = typeof value === "number" ? value : typeof value === "string" && value.trim() !== "" ? Number(value) : NaN;
		return Number.isFinite(numberValue) ? numberValue : fallback;
	}
	function roundNumber(value) {
		return Number(value.toFixed(12));
	}
	function stringifyName(value) {
		if (value instanceof Date) return value.toISOString();
		return value == null ? "" : String(value);
	}
	function clamp(value, min, max) {
		return Math.min(Math.max(value, min), max);
	}
	function isPlainObject(value) {
		return Object.prototype.toString.call(value) === "[object Object]";
	}
	//#endregion
	//#region src/radial-area.ts
	var echartsHost = echarts_lib_echarts;
	var optionKeys = [
		"padding",
		"center",
		"radius",
		"innerRadius",
		"outerRadius",
		"startAngle",
		"endAngle",
		"angleSpan",
		"clockwise",
		"closed",
		"angleType",
		"angleField",
		"valueField",
		"minField",
		"maxField",
		"nameField",
		"dimensions",
		"categories",
		"min",
		"max",
		"tickCount",
		"nice"
	];
	var layerZ = {
		rangeArea: -4,
		valueArea: -3,
		axis: 0,
		line: 4,
		hitSymbol: 7,
		symbol: 8
	};
	echartsHost.extendSeriesModel({
		type: "series.radialArea",
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
			width: "96%",
			height: "96%",
			padding: 30,
			center: null,
			radius: null,
			innerRadius: "38%",
			outerRadius: "88%",
			startAngle: 90,
			angleSpan: 360,
			clockwise: true,
			closed: true,
			angleType: null,
			angleField: "time",
			valueField: "value",
			minField: "min",
			maxField: "max",
			nameField: null,
			dimensions: null,
			categories: null,
			min: null,
			max: null,
			tickCount: 5,
			nice: true,
			enterAnimation: true,
			grid: { show: true },
			radialAxis: {
				show: true,
				label: {
					show: true,
					color: "#9aa0a6",
					fontSize: 13,
					formatter: "{value}"
				},
				splitLine: {
					show: true,
					lineStyle: {
						color: "#d8dee8",
						width: 1,
						type: "dashed",
						opacity: .72
					}
				}
			},
			angleAxis: {
				show: true,
				label: {
					show: true,
					color: "#9aa0a6",
					fontSize: 13,
					formatter: "{value}"
				},
				splitLine: {
					show: true,
					lineStyle: {
						color: "#d8dee8",
						width: 1,
						type: "dashed",
						opacity: .72
					}
				}
			},
			rangeAreaStyle: {
				show: true,
				color: "#c8dbea",
				opacity: .82
			},
			areaStyle: {
				show: false,
				color: "#c8dbea",
				opacity: .28
			},
			lineStyle: {
				color: "#3f86bd",
				width: 2,
				opacity: 1,
				type: "solid"
			},
			itemStyle: {
				color: "#3f86bd",
				borderColor: "#ffffff",
				borderWidth: 1.5,
				opacity: 1
			},
			showSymbol: false,
			symbolSize: 5,
			tooltip: { trigger: "item" },
			emphasis: { itemStyle: {
				borderWidth: 2,
				shadowBlur: 6,
				shadowColor: "rgba(63, 134, 189, 0.32)"
			} }
		}
	});
	echartsHost.extendChartView({
		type: "radialArea",
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
				const layout = resolveRadialAreaLayout(readLayoutOption(seriesModel, rect));
				if (this.__renderToken !== renderToken) return;
				const { hoverItems } = renderAlive(this, echartsHost, group, seriesModel, (targetGroup, targetSeriesModel) => drawRadialArea(echartsHost, targetGroup, targetSeriesModel, layout, rect));
				this.__hoverController = installElementHover(hoverItems, { zrender: api.getZr?.() });
			} catch (error) {
				if (typeof console !== "undefined") console.error("[radialArea] render failed", error);
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
	function drawRadialArea(echartsInstance, group, seriesModel, layout, rect) {
		const chartGroup = new echartsInstance.graphic.Group();
		chartGroup.x = rect.x;
		chartGroup.y = rect.y;
		drawAreas(echartsInstance, chartGroup, seriesModel, layout);
		drawGrid(echartsInstance, chartGroup, seriesModel, layout);
		drawLine(echartsInstance, chartGroup, seriesModel, layout);
		const hoverItems = drawSymbols(echartsInstance, chartGroup, seriesModel, layout, rect);
		group.add(chartGroup);
		return hoverItems;
	}
	function drawGrid(echartsInstance, group, seriesModel, layout) {
		if (seriesModel.getModel("grid").get("show") === false) return;
		const radialAxisModel = seriesModel.getModel("radialAxis");
		const angleAxisModel = seriesModel.getModel("angleAxis");
		const radialSplitLineModel = radialAxisModel.getModel("splitLine");
		const angleSplitLineModel = angleAxisModel.getModel("splitLine");
		const radialLabelModel = radialAxisModel.getModel("label");
		const angleLabelModel = angleAxisModel.getModel("label");
		const option = seriesModel.option || {};
		const radialAxisOption = asRecord(option.radialAxis);
		const angleAxisOption = asRecord(option.angleAxis);
		const radialAxisVisible = radialAxisOption.show !== false && radialAxisModel.get("show") !== false;
		const angleAxisVisible = angleAxisOption.show !== false && angleAxisModel.get("show") !== false;
		const radialSplitLineVisible = nestedOptionValue(radialAxisOption, "splitLine", "show") !== false && radialSplitLineModel.get("show") !== false;
		const angleSplitLineVisible = nestedOptionValue(angleAxisOption, "splitLine", "show") !== false && angleSplitLineModel.get("show") !== false;
		const radialLabelVisible = nestedOptionValue(radialAxisOption, "label", "show") !== false && radialLabelModel.get("show") !== false;
		const angleLabelVisible = nestedOptionValue(angleAxisOption, "label", "show") !== false && angleLabelModel.get("show") !== false;
		if (radialAxisVisible && radialSplitLineVisible) {
			const style = readLineStyle(radialSplitLineModel.getModel("lineStyle"), {
				stroke: "#d8dee8",
				lineWidth: 1,
				opacity: .72,
				lineDash: [5, 6]
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
			const style = readLineStyle(angleSplitLineModel.getModel("lineStyle"), {
				stroke: "#d8dee8",
				lineWidth: 1,
				opacity: .72,
				lineDash: [5, 6]
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
		if (radialAxisVisible && radialLabelVisible) layout.radialTicks.forEach((tick) => {
			const point = polarPoint(layout.centerX, layout.centerY, tick.radius, layout.startAngle);
			group.add(new echartsInstance.graphic.Text({
				style: {
					x: point.x + 8,
					y: point.y,
					text: formatAxisLabel(radialLabelModel.get("formatter"), tick.value),
					fill: radialLabelModel.get("color") || "#9aa0a6",
					fontSize: finiteNumber(radialLabelModel.get("fontSize"), 13),
					fontWeight: radialLabelModel.get("fontWeight") || 400,
					align: "left",
					verticalAlign: "middle"
				},
				silent: true,
				z2: layerZ.axis
			}));
		});
		if (angleAxisVisible && angleLabelVisible) layout.angleLabels.forEach((label) => {
			group.add(new echartsInstance.graphic.Text({
				style: {
					x: label.x,
					y: label.y,
					text: formatAxisLabel(angleLabelModel.get("formatter"), label.name),
					fill: angleLabelModel.get("color") || "#9aa0a6",
					fontSize: finiteNumber(angleLabelModel.get("fontSize"), 13),
					fontWeight: angleLabelModel.get("fontWeight") || 400,
					align: label.align,
					verticalAlign: label.verticalAlign
				},
				silent: true,
				z2: layerZ.axis
			}));
		});
	}
	function drawAreas(echartsInstance, group, seriesModel, layout) {
		const rangeAreaModel = seriesModel.getModel("rangeAreaStyle");
		if (rangeAreaModel.get("show") !== false && layout.rangePolygon.length >= 4) {
			const rangeArea = new echartsInstance.graphic.Polygon({
				shape: { points: pointsToTuples(layout.rangePolygon, layout.closed) },
				style: readAreaStyle(rangeAreaModel, {
					fill: "#c8dbea",
					opacity: .82
				}),
				silent: true,
				z2: layerZ.rangeArea
			});
			applyFadeEnterAnimation(rangeArea, readEnterAnimation(seriesModel, 0));
			group.add(rangeArea);
		}
		const areaModel = seriesModel.getModel("areaStyle");
		if (areaModel.get("show") === true && layout.valuePolygon.length >= 2) {
			const valueArea = new echartsInstance.graphic.Polygon({
				shape: { points: createValueAreaPoints(layout) },
				style: readAreaStyle(areaModel, {
					fill: "#c8dbea",
					opacity: .28
				}),
				silent: true,
				z2: layerZ.valueArea
			});
			applyFadeEnterAnimation(valueArea, readEnterAnimation(seriesModel, 1));
			group.add(valueArea);
		}
	}
	function drawLine(echartsInstance, group, seriesModel, layout) {
		if (layout.valuePolygon.length < 2) return;
		const lineStyle = readLineStyle(seriesModel.getModel("lineStyle"), {
			stroke: "#3f86bd",
			lineWidth: 2,
			opacity: 1
		});
		if (!lineStyle.stroke || finiteNumber(lineStyle.lineWidth, 1) <= 0 || finiteNumber(lineStyle.opacity, 1) <= 0) return;
		const line = new echartsInstance.graphic.Polyline({
			shape: { points: pointsToTuples(layout.valuePolygon, layout.closed) },
			style: {
				...lineStyle,
				fill: null
			},
			silent: true,
			z2: layerZ.line
		});
		applyPathEnterAnimation(line, "shape", "percent", readEnterAnimation(seriesModel, 2));
		group.add(line);
	}
	function drawSymbols(echartsInstance, group, seriesModel, layout, rect) {
		const data = seriesModel.getData();
		const showSymbol = seriesModel.get("showSymbol") === true;
		const symbolSize = Math.max(0, finiteNumber(seriesModel.get("symbolSize"), 5));
		const silent = seriesModel.get("silent") === true;
		const hoverItems = [];
		layout.points.forEach((point) => {
			if (point.dataIndex < 0 || point.dataIndex >= data.count()) return;
			data.setItemLayout(point.dataIndex, [point.x + rect.x, point.y + rect.y]);
			if (silent) {
				if (showSymbol && symbolSize > 0) {
					const itemModel = data.getItemModel(point.dataIndex);
					const symbol = new echartsInstance.graphic.Circle({
						shape: {
							cx: point.x,
							cy: point.y,
							r: symbolSize / 2
						},
						style: readPointStyle(data, seriesModel, itemModel, point),
						silent: true,
						z2: layerZ.symbol
					});
					data.setItemGraphicEl(point.dataIndex, symbol);
					group.add(symbol);
				}
				return;
			}
			const itemModel = data.getItemModel(point.dataIndex);
			const hitCircle = new echartsInstance.graphic.Circle({
				shape: {
					cx: point.x,
					cy: point.y,
					r: Math.max(symbolSize / 2, 6)
				},
				style: {
					fill: "rgba(0,0,0,0)",
					stroke: "rgba(0,0,0,0)",
					opacity: 0
				},
				z2: layerZ.hitSymbol
			});
			data.setItemGraphicEl(point.dataIndex, hitCircle);
			const hoverItem = createHoverItem(hitCircle);
			hoverItems.push(hoverItem);
			group.add(hitCircle);
			if (!showSymbol || symbolSize <= 0) return;
			const symbol = new echartsInstance.graphic.Circle({
				shape: {
					cx: point.x,
					cy: point.y,
					r: symbolSize / 2
				},
				style: readPointStyle(data, seriesModel, itemModel, point),
				z2: layerZ.symbol
			});
			applyCircleEnterAnimation(symbol, symbolSize / 2, readEnterAnimation(seriesModel, point.dataIndex));
			addHoverElement(hoverItem, symbol);
			group.add(symbol);
		});
		return hoverItems;
	}
	function createValueAreaPoints(layout) {
		const upper = pointsToTuples(layout.valuePolygon, false);
		const lower = [...layout.points].reverse().map((point) => {
			const base = polarPoint(layout.centerX, layout.centerY, layout.innerRadius, point.angle);
			return [base.x, base.y];
		});
		if (layout.closed && upper.length > 2 && lower.length > 2) {
			const firstBase = polarPoint(layout.centerX, layout.centerY, layout.innerRadius, layout.points[0].angle);
			return upper.concat([upper[0], [firstBase.x, firstBase.y]], lower);
		}
		return upper.concat(lower);
	}
	function pointsToTuples(points, closed) {
		const tuples = points.map((point) => [point.x, point.y]);
		if (closed && tuples.length > 2) tuples.push(tuples[0]);
		return tuples;
	}
	function readAreaStyle(model, defaults) {
		return {
			fill: model.get("color") || model.get("fill") || defaults.fill,
			opacity: finiteNumber(model.get("opacity"), finiteNumber(defaults.opacity, 1)),
			stroke: model.get("borderColor") || model.get("stroke") || defaults.stroke || null,
			lineWidth: finiteNumber(model.get("borderWidth"), finiteNumber(defaults.lineWidth, 0))
		};
	}
	function readLineStyle(model, defaults) {
		const lineType = model.get("type") || defaults.type;
		return {
			stroke: model.get("color") || model.get("stroke") || defaults.stroke,
			lineWidth: finiteNumber(model.get("width"), finiteNumber(model.get("lineWidth"), finiteNumber(defaults.lineWidth, 1))),
			opacity: finiteNumber(model.get("opacity"), finiteNumber(defaults.opacity, 1)),
			lineDash: readLineDash(lineType)
		};
	}
	function readLineDash(type) {
		if (Array.isArray(type)) return type.filter((item) => typeof item === "number");
		if (type === "dashed") return [5, 6];
		if (type === "dotted") return [1.5, 5];
		return null;
	}
	function readPointStyle(data, seriesModel, itemModel, point) {
		const itemStyleModel = itemModel.getModel("itemStyle");
		const seriesItemStyleModel = seriesModel.getModel("itemStyle");
		const visualStyle = asRecord(data.getItemVisual(point.dataIndex, "style"));
		return {
			fill: itemStyleModel.get("color") || visualStyle.fill || seriesItemStyleModel.get("color") || "#3f86bd",
			stroke: itemStyleModel.get("borderColor") || seriesItemStyleModel.get("borderColor") || "#ffffff",
			lineWidth: finiteNumber(itemStyleModel.get("borderWidth"), finiteNumber(seriesItemStyleModel.get("borderWidth"), 1.5)),
			opacity: finiteNumber(itemStyleModel.get("opacity"), finiteNumber(seriesItemStyleModel.get("opacity"), 1))
		};
	}
	function formatAxisLabel(formatter, value) {
		if (typeof formatter === "function") return String(formatter(value));
		if (typeof formatter === "string") return formatter.replace(/\{value\}/g, String(value));
		return String(value);
	}
	function polarPoint(centerX, centerY, radius, angle) {
		const radians = angle * Math.PI / 180;
		return {
			x: centerX + Math.cos(radians) * radius,
			y: centerY - Math.sin(radians) * radius
		};
	}
	function readEnterAnimation(seriesModel, itemIndex, animationOption = seriesModel.get("enterAnimation")) {
		if (seriesModel.get("animation") === false || animationOption === false) return disabledEnterAnimation();
		const option = animationOption == null || animationOption === true ? {} : asRecord(animationOption);
		if (option.show === false || option.enabled === false) return disabledEnterAnimation();
		const baseDelay = resolveAnimationNumber(option.delay ?? seriesModel.get("animationDelay"), itemIndex, itemIndex, 0);
		const stagger = resolveAnimationNumber(option.stagger, itemIndex, itemIndex, 40);
		return {
			enabled: true,
			duration: resolveAnimationNumber(option.duration ?? seriesModel.get("animationDuration"), itemIndex, itemIndex, 680),
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
	function applyPathEnterAnimation(element, targetKey, propertyName, animation) {
		if (!animation.enabled) return;
		const animatable = element;
		if (typeof animatable.animate !== "function") return;
		const target = animatable[targetKey] || {};
		target[propertyName] = 0;
		animatable[targetKey] = target;
		animateGraphicProperty(animatable, targetKey, animation, { [propertyName]: 1 });
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
		return Object.prototype.toString.call(value) === "[object Object]" ? value : {};
	}
	function nestedOptionValue(record, parentKey, childKey) {
		return asRecord(record[parentKey])[childKey];
	}
	function finiteNumber(value, fallback) {
		const numberValue = typeof value === "number" ? value : typeof value === "string" && value.trim() !== "" ? Number(value) : NaN;
		return Number.isFinite(numberValue) ? numberValue : fallback;
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

//# sourceMappingURL=echarts-radial-area.js.map