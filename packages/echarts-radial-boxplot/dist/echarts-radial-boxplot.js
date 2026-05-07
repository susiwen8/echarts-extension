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
	var DEFAULT_INNER_RADIUS = "18%";
	var DEFAULT_OUTER_RADIUS = "88%";
	var DEFAULT_TICK_COUNT = 5;
	var DEFAULT_BOX_WIDTH = .58;
	var DEFAULT_CAP_WIDTH = .34;
	function resolveRadialBoxplotLayout(option = {}) {
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
			categoryField: readFieldOption(option.categoryField ?? layoutOptions.categoryField ?? layout.categoryField),
			nameField: readFieldOption(option.nameField ?? layoutOptions.nameField ?? layout.nameField),
			minField: readFieldOption(option.minField ?? layoutOptions.minField ?? layout.minField),
			q1Field: readFieldOption(option.q1Field ?? layoutOptions.q1Field ?? layout.q1Field),
			medianField: readFieldOption(option.medianField ?? layoutOptions.medianField ?? layout.medianField),
			q3Field: readFieldOption(option.q3Field ?? layoutOptions.q3Field ?? layout.q3Field),
			maxField: readFieldOption(option.maxField ?? layoutOptions.maxField ?? layout.maxField),
			dimensions: normalizeDimensions(option.dimensions ?? layoutOptions.dimensions ?? layout.dimensions),
			categories: normalizeCategories(option.categories ?? layoutOptions.categories ?? layout.categories),
			min: finiteNumber$1(option.min, finiteNumber$1(layoutOptions.min, finiteNumber$1(layout.min, void 0))),
			max: finiteNumber$1(option.max, finiteNumber$1(layoutOptions.max, finiteNumber$1(layout.max, void 0))),
			tickCount: finiteNumber$1(option.tickCount, finiteNumber$1(layoutOptions.tickCount, finiteNumber$1(layout.tickCount, void 0))),
			nice: firstBoolean(option.nice, layoutOptions.nice, layout.nice),
			boxWidth: finiteNumber$1(option.boxWidth, finiteNumber$1(layoutOptions.boxWidth, finiteNumber$1(layout.boxWidth, void 0))),
			capWidth: finiteNumber$1(option.capWidth, finiteNumber$1(layoutOptions.capWidth, finiteNumber$1(layout.capWidth, void 0))),
			labelRadius: readRadiusOption(option.labelRadius ?? layoutOptions.labelRadius ?? layout.labelRadius)
		};
		return layoutRadialBoxplot(Array.isArray(option.data) ? option.data : [], merged);
	}
	function layoutRadialBoxplot(data, options = {}) {
		const width = Math.max(1, finiteNumber$1(options.width, DEFAULT_WIDTH));
		const height = Math.max(1, finiteNumber$1(options.height, DEFAULT_HEIGHT));
		const padding = Math.max(0, finiteNumber$1(options.padding, DEFAULT_PADDING));
		const centerX = parseCenter(options.center?.[0], width, width / 2);
		const centerY = parseCenter(options.center?.[1], height, height / 2);
		const radiusLimit = Math.max(1, Math.min(width, height) / 2 - padding);
		const radiusOption = Array.isArray(options.radius) ? options.radius : void 0;
		const innerRadius = clampRadius(parseRadius(radiusOption?.[0] ?? options.innerRadius ?? DEFAULT_INNER_RADIUS, radiusLimit, parseRadius(DEFAULT_INNER_RADIUS, radiusLimit, radiusLimit * .18)), 0, radiusLimit);
		const outerRadius = clampRadius(parseRadius(radiusOption?.[1] ?? options.outerRadius ?? DEFAULT_OUTER_RADIUS, radiusLimit, parseRadius(DEFAULT_OUTER_RADIUS, radiusLimit, radiusLimit * .88)), innerRadius + 1, radiusLimit);
		const labelRadius = clampRadius(parseRadius(options.labelRadius ?? outerRadius + 28, radiusLimit + padding, outerRadius + 28), outerRadius, radiusLimit + padding);
		const startAngle = finiteNumber$1(options.startAngle, 90);
		const clockwise = options.clockwise !== false;
		const angleSpan = Math.max(0, finiteNumber$1(options.angleSpan, options.endAngle != null ? Math.abs(startAngle - finiteNumber$1(options.endAngle, startAngle - 360)) : 360));
		const normalized = normalizeItems(data, options);
		const categories = resolveCategories(normalized, options);
		const ordered = orderByCategory(normalized, categories);
		const valueExtent = resolveValueExtent(ordered, options);
		const radialTicks = createRadialTicks(valueExtent.min, valueExtent.max, Math.max(2, Math.round(finiteNumber$1(options.tickCount, DEFAULT_TICK_COUNT)))).map((value) => ({
			value,
			radius: projectRadius(value, valueExtent, innerRadius, outerRadius)
		}));
		const boxWidth = clamp(finiteNumber$1(options.boxWidth, DEFAULT_BOX_WIDTH), .04, 1);
		const capWidth = clamp(finiteNumber$1(options.capWidth, DEFAULT_CAP_WIDTH), .04, 1);
		const boxes = ordered.map((item) => createBox(item, categories, valueExtent, innerRadius, outerRadius, centerX, centerY, startAngle, angleSpan, clockwise, boxWidth, capWidth));
		return {
			width,
			height,
			padding,
			centerX,
			centerY,
			innerRadius,
			outerRadius,
			labelRadius,
			startAngle,
			angleSpan,
			clockwise,
			valueExtent,
			radialTicks,
			angleLabels: createAngleLabels(categories, centerX, centerY, labelRadius, startAngle, angleSpan, clockwise),
			boxes
		};
	}
	function normalizeItems(data, options) {
		const dimensions = normalizeDimensions(options.dimensions);
		const normalized = [];
		data.forEach((item, dataIndex) => {
			const categoryValue = readField(item, options.categoryField ?? options.nameField ?? "name", dimensions, 0, [
				"category",
				"region",
				"group"
			]);
			const rawValues = [
				finiteNumber$1(readField(item, options.minField ?? "min", dimensions, 1, [
					"low",
					"lower",
					"minimum"
				]), NaN),
				finiteNumber$1(readField(item, options.q1Field ?? "q1", dimensions, 2, ["quartile1", "lowerQuartile"]), NaN),
				finiteNumber$1(readField(item, options.medianField ?? "median", dimensions, 3, ["med", "value"]), NaN),
				finiteNumber$1(readField(item, options.q3Field ?? "q3", dimensions, 4, ["quartile3", "upperQuartile"]), NaN),
				finiteNumber$1(readField(item, options.maxField ?? "max", dimensions, 5, [
					"high",
					"upper",
					"maximum"
				]), NaN)
			];
			if (rawValues.some((value) => !Number.isFinite(value))) return;
			const [min, q1, median, q3, max] = [...rawValues].sort((left, right) => left - right);
			const name = stringifyName(readField(item, options.nameField ?? options.categoryField ?? "name", dimensions, 0, [
				"category",
				"region",
				"group"
			]) ?? categoryValue ?? `item-${dataIndex}`);
			const id = stringifyName((isPlainObject(item) ? item : {}).id ?? `${name}-${dataIndex}`);
			normalized.push({
				id,
				name,
				categoryValue: categoryValue ?? name,
				min,
				q1,
				median,
				q3,
				max,
				dataIndex,
				raw: item
			});
		});
		return normalized;
	}
	function resolveCategories(items, options) {
		const explicitCategories = normalizeCategories(options.categories);
		return explicitCategories.length ? explicitCategories : unique(items.map((item) => stringifyName(item.categoryValue ?? item.name)));
	}
	function orderByCategory(items, categories) {
		const order = new Map(categories.map((category, index) => [category, index]));
		return [...items].sort((left, right) => {
			return (order.get(stringifyName(left.categoryValue ?? left.name)) ?? Number.MAX_SAFE_INTEGER) - (order.get(stringifyName(right.categoryValue ?? right.name)) ?? Number.MAX_SAFE_INTEGER) || left.dataIndex - right.dataIndex;
		});
	}
	function resolveValueExtent(items, options) {
		const values = items.flatMap((item) => [
			item.min,
			item.q1,
			item.median,
			item.q3,
			item.max
		]);
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
	function createBox(item, categories, valueExtent, innerRadius, outerRadius, centerX, centerY, startAngle, angleSpan, clockwise, boxWidth, capWidth) {
		const category = stringifyName(item.categoryValue ?? item.name);
		const categoryIndex = Math.max(0, categories.indexOf(category));
		const categoryCount = Math.max(categories.length, 1);
		const slotSpan = angleSpan / categoryCount;
		const direction = clockwise ? -1 : 1;
		const angleRatio = (categoryIndex + .5) / categoryCount;
		const angle = startAngle + direction * angleRatio * angleSpan;
		const boxHalfSpan = slotSpan * boxWidth / 2;
		const capHalfSpan = slotSpan * capWidth / 2;
		const start = angle - direction * boxHalfSpan;
		const end = angle + direction * boxHalfSpan;
		const capStart = angle - direction * capHalfSpan;
		const capEnd = angle + direction * capHalfSpan;
		const minRadius = projectRadius(item.min, valueExtent, innerRadius, outerRadius);
		const q1Radius = projectRadius(item.q1, valueExtent, innerRadius, outerRadius);
		const medianRadius = projectRadius(item.median, valueExtent, innerRadius, outerRadius);
		const q3Radius = projectRadius(item.q3, valueExtent, innerRadius, outerRadius);
		const maxRadius = projectRadius(item.max, valueExtent, innerRadius, outerRadius);
		const minPoint = pointFromPolar(centerX, centerY, minRadius, angle);
		const q1Point = pointFromPolar(centerX, centerY, q1Radius, angle);
		const medianPoint = pointFromPolar(centerX, centerY, medianRadius, angle);
		const q3Point = pointFromPolar(centerX, centerY, q3Radius, angle);
		const maxPoint = pointFromPolar(centerX, centerY, maxRadius, angle);
		return {
			id: item.id,
			name: item.name,
			categoryValue: item.categoryValue,
			angle,
			angleRatio,
			startAngle: start,
			endAngle: end,
			capStartAngle: capStart,
			capEndAngle: capEnd,
			min: item.min,
			q1: item.q1,
			median: item.median,
			q3: item.q3,
			max: item.max,
			minRadius,
			q1Radius,
			medianRadius,
			q3Radius,
			maxRadius,
			medianX: medianPoint.x,
			medianY: medianPoint.y,
			axis: {
				x1: minPoint.x,
				y1: minPoint.y,
				x2: maxPoint.x,
				y2: maxPoint.y
			},
			lowerWhisker: {
				x1: minPoint.x,
				y1: minPoint.y,
				x2: q1Point.x,
				y2: q1Point.y
			},
			upperWhisker: {
				x1: q3Point.x,
				y1: q3Point.y,
				x2: maxPoint.x,
				y2: maxPoint.y
			},
			boxPath: sectorPath(centerX, centerY, q1Radius, q3Radius, start, end, clockwise),
			medianPath: arcPath(centerX, centerY, medianRadius, capStart, capEnd, clockwise),
			minCapPath: arcPath(centerX, centerY, minRadius, capStart, capEnd, clockwise),
			maxCapPath: arcPath(centerX, centerY, maxRadius, capStart, capEnd, clockwise),
			boxPoints: sectorPoints(centerX, centerY, q1Radius, q3Radius, start, end, clockwise),
			medianPoints: arcPoints(centerX, centerY, medianRadius, capStart, capEnd, clockwise),
			minCapPoints: arcPoints(centerX, centerY, minRadius, capStart, capEnd, clockwise),
			maxCapPoints: arcPoints(centerX, centerY, maxRadius, capStart, capEnd, clockwise),
			dataIndex: item.dataIndex,
			raw: item.raw
		};
	}
	function createAngleLabels(categories, centerX, centerY, radius, startAngle, angleSpan, clockwise) {
		const categoryCount = Math.max(categories.length, 1);
		const direction = clockwise ? -1 : 1;
		return categories.map((category, index) => {
			const angle = startAngle + direction * ((index + .5) / categoryCount) * angleSpan;
			const point = pointFromPolar(centerX, centerY, radius, angle);
			const placement = labelPlacement(angle);
			return {
				name: category,
				value: category,
				angle,
				x: point.x,
				y: point.y,
				align: placement.align,
				verticalAlign: placement.verticalAlign,
				rotation: tangentialTextRotation(angle)
			};
		});
	}
	function sectorPath(centerX, centerY, innerRadius, outerRadius, startAngle, endAngle, clockwise) {
		const outerStart = pointFromPolar(centerX, centerY, outerRadius, startAngle);
		const outerEnd = pointFromPolar(centerX, centerY, outerRadius, endAngle);
		const innerEnd = pointFromPolar(centerX, centerY, innerRadius, endAngle);
		const innerStart = pointFromPolar(centerX, centerY, innerRadius, startAngle);
		const largeArc = Math.abs(signedSweep(startAngle, endAngle, clockwise)) > 180 ? 1 : 0;
		const sweep = clockwise ? 1 : 0;
		const reverseSweep = clockwise ? 0 : 1;
		return [
			`M ${formatNumber(outerStart.x)} ${formatNumber(outerStart.y)}`,
			`A ${formatNumber(outerRadius)} ${formatNumber(outerRadius)} 0 ${largeArc} ${sweep} ${formatNumber(outerEnd.x)} ${formatNumber(outerEnd.y)}`,
			`L ${formatNumber(innerEnd.x)} ${formatNumber(innerEnd.y)}`,
			`A ${formatNumber(innerRadius)} ${formatNumber(innerRadius)} 0 ${largeArc} ${reverseSweep} ${formatNumber(innerStart.x)} ${formatNumber(innerStart.y)}`,
			"Z"
		].join(" ");
	}
	function arcPath(centerX, centerY, radius, startAngle, endAngle, clockwise) {
		const start = pointFromPolar(centerX, centerY, radius, startAngle);
		const end = pointFromPolar(centerX, centerY, radius, endAngle);
		const largeArc = Math.abs(signedSweep(startAngle, endAngle, clockwise)) > 180 ? 1 : 0;
		const sweep = clockwise ? 1 : 0;
		return [`M ${formatNumber(start.x)} ${formatNumber(start.y)}`, `A ${formatNumber(radius)} ${formatNumber(radius)} 0 ${largeArc} ${sweep} ${formatNumber(end.x)} ${formatNumber(end.y)}`].join(" ");
	}
	function sectorPoints(centerX, centerY, innerRadius, outerRadius, startAngle, endAngle, clockwise) {
		const outer = arcPoints(centerX, centerY, outerRadius, startAngle, endAngle, clockwise);
		const inner = arcPoints(centerX, centerY, innerRadius, endAngle, startAngle, !clockwise);
		return outer.concat(inner);
	}
	function arcPoints(centerX, centerY, radius, startAngle, endAngle, clockwise) {
		const sweep = signedSweep(startAngle, endAngle, clockwise);
		const steps = Math.max(4, Math.ceil(Math.abs(sweep) / 10));
		return Array.from({ length: steps + 1 }, (_, index) => {
			const point = pointFromPolar(centerX, centerY, radius, startAngle + sweep * index / steps);
			return [point.x, point.y];
		});
	}
	function signedSweep(startAngle, endAngle, clockwise) {
		let sweep = endAngle - startAngle;
		if (clockwise) while (sweep > 0) sweep -= 360;
		else while (sweep < 0) sweep += 360;
		return sweep;
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
	function tangentialTextRotation(angle) {
		let rotation = (angle - 90) * Math.PI / 180;
		const halfTurn = Math.PI;
		while (rotation > Math.PI / 2) rotation -= halfTurn;
		while (rotation < -Math.PI / 2) rotation += halfTurn;
		return rotation;
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
	function formatNumber(value) {
		return String(roundNumber(value));
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
	//#region src/radial-boxplot.ts
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
		"categoryField",
		"nameField",
		"minField",
		"q1Field",
		"medianField",
		"q3Field",
		"maxField",
		"dimensions",
		"categories",
		"min",
		"max",
		"tickCount",
		"nice",
		"boxWidth",
		"capWidth",
		"labelRadius"
	];
	var layerZ = {
		axis: 0,
		box: 3,
		whisker: 4,
		median: 5,
		hit: 8
	};
	echartsHost.extendSeriesModel({
		type: "series.radialBoxplot",
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
			padding: 36,
			center: null,
			radius: null,
			innerRadius: "18%",
			outerRadius: "82%",
			labelRadius: null,
			startAngle: 90,
			angleSpan: 360,
			clockwise: true,
			categoryField: "name",
			nameField: null,
			minField: "min",
			q1Field: "q1",
			medianField: "median",
			q3Field: "q3",
			maxField: "max",
			dimensions: null,
			categories: null,
			min: null,
			max: null,
			tickCount: 7,
			nice: true,
			boxWidth: .58,
			capWidth: .34,
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
						opacity: .62
					}
				}
			},
			angleAxis: {
				show: true,
				label: {
					show: true,
					color: "#8d949e",
					fontSize: 14,
					formatter: "{value}",
					rotate: "tangential"
				},
				splitLine: {
					show: false,
					lineStyle: {
						color: "#d8dee8",
						width: 1,
						type: "dashed",
						opacity: .5
					}
				}
			},
			itemStyle: {
				color: "#2f83ed",
				borderColor: "#111111",
				borderWidth: 1.2,
				opacity: .96
			},
			whiskerLineStyle: {
				color: "#111111",
				width: 1.2,
				opacity: 1,
				type: "solid"
			},
			medianLineStyle: {
				color: "#111111",
				width: 1.2,
				opacity: 1,
				type: "solid"
			},
			capLineStyle: {
				color: "#111111",
				width: 1.2,
				opacity: 1,
				type: "solid"
			},
			tooltip: { trigger: "item" },
			emphasis: { itemStyle: {
				borderWidth: 2,
				shadowBlur: 7,
				shadowColor: "rgba(17, 24, 39, 0.24)"
			} }
		}
	});
	echartsHost.extendChartView({
		type: "radialBoxplot",
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
				const layout = resolveRadialBoxplotLayout(readLayoutOption(seriesModel, rect));
				if (this.__renderToken !== renderToken) return;
				const { hoverItems } = renderAlive(this, echartsHost, group, seriesModel, (targetGroup, targetSeriesModel) => drawRadialBoxplot(echartsHost, targetGroup, targetSeriesModel, layout, rect));
				this.__hoverController = installElementHover(hoverItems, { zrender: api.getZr?.() });
			} catch (error) {
				if (typeof console !== "undefined") console.error("[radialBoxplot] render failed", error);
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
	function drawRadialBoxplot(echartsInstance, group, seriesModel, layout, rect) {
		const chartGroup = new echartsInstance.graphic.Group();
		const hoverItems = [];
		const hoverItemsByDataIndex = /* @__PURE__ */ new Map();
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
		const angleSplitLineVisible = nestedOptionValue(angleAxisOption, "splitLine", "show") === true || angleSplitLineModel.get("show") === true;
		const radialLabelVisible = nestedOptionValue(radialAxisOption, "label", "show") !== false && radialLabelModel.get("show") !== false;
		const angleLabelVisible = nestedOptionValue(angleAxisOption, "label", "show") !== false && angleLabelModel.get("show") !== false;
		if (radialAxisVisible && radialSplitLineVisible) {
			const style = readLineStyle(radialSplitLineModel.getModel("lineStyle"), {
				stroke: "#d8dee8",
				lineWidth: 1,
				opacity: .62,
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
			const style = readLineStyle(angleSplitLineModel.getModel("lineStyle"), {
				stroke: "#d8dee8",
				lineWidth: 1,
				opacity: .5,
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
			const rotate = angleLabelModel.get("rotate");
			const shouldRotate = rotate === true || rotate === "tangential";
			group.add(new echartsInstance.graphic.Text({
				style: {
					x: label.x,
					y: label.y,
					text: formatAxisLabel(angleLabelModel.get("formatter"), label.name),
					fill: angleLabelModel.get("color") || "#8d949e",
					fontSize: finiteNumber(angleLabelModel.get("fontSize"), 14),
					fontWeight: angleLabelModel.get("fontWeight") || 400,
					align: shouldRotate ? "center" : label.align,
					verticalAlign: shouldRotate ? "middle" : label.verticalAlign
				},
				rotation: shouldRotate ? label.rotation : 0,
				originX: label.x,
				originY: label.y,
				silent: true,
				z2: layerZ.axis
			}));
		});
	}
	function drawBoxes(echartsInstance, group, seriesModel, layout, hoverItems, hoverItemsByDataIndex) {
		const data = seriesModel.getData();
		layout.boxes.forEach((box, index) => {
			const style = readBoxStyle(data, seriesModel, data.getItemModel(box.dataIndex), box);
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
		const whiskerStyle = readLineStyle(seriesModel.getModel("whiskerLineStyle"), {
			stroke: "#111111",
			lineWidth: 1.2,
			opacity: 1
		});
		const medianStyle = readLineStyle(seriesModel.getModel("medianLineStyle"), {
			stroke: "#111111",
			lineWidth: 1.2,
			opacity: 1
		});
		const capStyle = readLineStyle(seriesModel.getModel("capLineStyle"), whiskerStyle);
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
				const cap = createPathOrPolyline(echartsInstance, path, capIndex === 0 ? box.minCapPoints : box.maxCapPoints, capStyle, true, layerZ.whisker);
				applyPathEnterAnimation(cap, "style", "strokePercent", animation);
				addHoverElement(hoverItemsByDataIndex.get(box.dataIndex), cap);
				group.add(cap);
			});
			const median = createPathOrPolyline(echartsInstance, box.medianPath, box.medianPoints, medianStyle, true, layerZ.median);
			applyPathEnterAnimation(median, "style", "strokePercent", animation);
			addHoverElement(hoverItemsByDataIndex.get(box.dataIndex), median);
			group.add(median);
		});
	}
	function drawHitAreas(echartsInstance, group, seriesModel, layout, rect, hoverItemsByDataIndex) {
		const data = seriesModel.getData();
		layout.boxes.forEach((box) => {
			if (box.dataIndex < 0 || box.dataIndex >= data.count()) return;
			data.setItemLayout(box.dataIndex, [box.medianX + rect.x, box.medianY + rect.y]);
			const hitArea = createPathOrPolygon(echartsInstance, box.boxPath, box.boxPoints, {
				fill: "rgba(0,0,0,0)",
				stroke: "rgba(0,0,0,0)",
				opacity: 0
			}, false, layerZ.hit);
			data.setItemGraphicEl(box.dataIndex, hitArea);
			addHoverElement(hoverItemsByDataIndex.get(box.dataIndex), hitArea);
			group.add(hitArea);
		});
	}
	function createPathOrPolygon(echartsInstance, path, points, style, silent, z2) {
		if (echartsInstance.graphic.makePath) return echartsInstance.graphic.makePath(path, {
			style,
			silent,
			z2
		});
		return new echartsInstance.graphic.Polygon({
			shape: { points },
			style,
			silent,
			z2
		});
	}
	function createPathOrPolyline(echartsInstance, path, points, style, silent, z2) {
		if (echartsInstance.graphic.makePath) return echartsInstance.graphic.makePath(path, {
			style: {
				...style,
				fill: null
			},
			silent,
			z2
		});
		return new echartsInstance.graphic.Polyline({
			shape: { points },
			style: {
				...style,
				fill: null
			},
			silent,
			z2
		});
	}
	function readBoxStyle(data, seriesModel, itemModel, box) {
		const itemStyleModel = itemModel.getModel("itemStyle");
		const seriesItemStyleModel = seriesModel.getModel("itemStyle");
		const visualStyle = asRecord(data.getItemVisual(box.dataIndex, "style"));
		return {
			fill: itemStyleModel.get("color") || visualStyle.fill || seriesItemStyleModel.get("color") || "#2f83ed",
			stroke: itemStyleModel.get("borderColor") || seriesItemStyleModel.get("borderColor") || "#111111",
			lineWidth: finiteNumber(itemStyleModel.get("borderWidth"), finiteNumber(seriesItemStyleModel.get("borderWidth"), 1.2)),
			opacity: finiteNumber(itemStyleModel.get("opacity"), finiteNumber(seriesItemStyleModel.get("opacity"), .96))
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
		const stagger = resolveAnimationNumber(option.stagger, itemIndex, itemIndex, 34);
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
	function applyLineEnterAnimation(element, animation) {
		if (!animation.enabled) return;
		const animatable = element;
		if (typeof animatable.animate !== "function") return;
		const shape = animatable.shape || {};
		shape.percent = 0;
		animatable.shape = shape;
		animateGraphicProperty(animatable, "shape", animation, { percent: 1 });
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

//# sourceMappingURL=echarts-radial-boxplot.js.map