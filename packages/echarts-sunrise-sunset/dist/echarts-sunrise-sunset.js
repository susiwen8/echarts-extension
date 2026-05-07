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
	var DEFAULT_WIDTH = 900;
	var DEFAULT_HEIGHT = 560;
	var DEFAULT_PADDING = 72;
	var DAY_MS = 1440 * 60 * 1e3;
	var HOUR_MS = 3600 * 1e3;
	var MINUTE_MS = 60 * 1e3;
	function resolveSunriseSunsetLayout(option = {}) {
		const dataOption = readDataOption(option.data);
		const layoutOptions = {
			...isPlainObject$1(option.layout) ? option.layout : {},
			...isPlainObject$1(option.layoutOptions) ? option.layoutOptions : {},
			width: finiteNumber$1(option.width, void 0),
			height: finiteNumber$1(option.height, void 0),
			padding: finiteNumber$1(option.padding, void 0),
			baselineY: finiteNumber$1(option.baselineY, void 0),
			dayArcHeight: finiteNumber$1(option.dayArcHeight, void 0),
			moonArcHeight: finiteNumber$1(option.moonArcHeight, void 0),
			moonStartRatio: finiteNumber$1(option.moonStartRatio, void 0),
			moonEndRatio: finiteNumber$1(option.moonEndRatio, void 0)
		};
		return layoutResolvedSunriseSunset(resolveEvents({
			...dataOption,
			...definedEventOption(option)
		}), layoutOptions);
	}
	function layoutResolvedSunriseSunset(events, options = {}) {
		const width = finiteNumber$1(options.width, DEFAULT_WIDTH);
		const height = finiteNumber$1(options.height, DEFAULT_HEIGHT);
		const padding = Math.max(0, finiteNumber$1(options.padding, Math.min(DEFAULT_PADDING, width * .1)));
		const baselineY = clamp(finiteNumber$1(options.baselineY, height * .805), height * .48, height - Math.max(56, padding * .6));
		const dayArcHeight = Math.max(24, finiteNumber$1(options.dayArcHeight, Math.min(width * .285, Math.max(height * .42, 1))));
		const moonArcHeight = Math.max(16, finiteNumber$1(options.moonArcHeight, dayArcHeight * .43));
		const dayGeometry = {
			startX: padding,
			endX: Math.max(width - padding, padding + 1),
			baselineY,
			height: dayArcHeight
		};
		const moonStartRatio = clamp(finiteNumber$1(options.moonStartRatio, .28), 0, .95);
		const moonEndRatio = clamp(finiteNumber$1(options.moonEndRatio, .72), moonStartRatio + .01, 1);
		const dayWidth = dayGeometry.endX - dayGeometry.startX;
		const moonGeometry = {
			startX: dayGeometry.startX + dayWidth * moonStartRatio,
			endX: dayGeometry.startX + dayWidth * moonEndRatio,
			baselineY,
			height: moonArcHeight
		};
		const dayCycle = resolveDayCycle(events.sunrise, events.sunset, events.currentTime);
		const moonCycle = resolveMoonCycle(events.moonrise, events.moonset, events.currentTime);
		const targetTime = dayCycle.isDaylight ? dayCycle.end : events.currentTime < dayCycle.start ? dayCycle.start : dayCycle.start + DAY_MS;
		const autoTitle = dayCycle.isDaylight ? "距离日落还剩" : "距离日出还剩";
		const remainingSeconds = Math.max(0, Math.round((targetTime - events.currentTime) / 1e3));
		return {
			width,
			height,
			padding,
			baselineY,
			title: events.title || autoTitle,
			remainingText: events.remainingText || formatDuration(remainingSeconds),
			updatedText: events.updatedText || formatUpdatedText(events.updatedAt),
			remainingSeconds,
			currentTime: events.currentTime,
			events: {
				sunrise: {
					key: "sunrise",
					label: formatTimeLabel(events.sunrise),
					value: events.sunrise,
					...pointOnArc(dayGeometry, 0)
				},
				sunset: {
					key: "sunset",
					label: formatTimeLabel(events.sunset),
					value: events.sunset,
					...pointOnArc(dayGeometry, 1)
				},
				moonrise: {
					key: "moonrise",
					label: formatTimeLabel(events.moonrise),
					value: events.moonrise,
					...pointOnArc(moonGeometry, 0)
				},
				moonset: {
					key: "moonset",
					label: formatTimeLabel(events.moonset),
					value: events.moonset,
					...pointOnArc(moonGeometry, 1)
				}
			},
			day: createArcLayout(dayGeometry, dayCycle.progress, dayCycle.isDaylight, dayCycle.wraps, dayCycle.durationMinutes),
			moon: createArcLayout(moonGeometry, moonCycle.progress, moonCycle.visible, moonCycle.wraps, moonCycle.durationMinutes)
		};
	}
	function resolveEvents(input) {
		const currentTime = parseTime(input.currentTime, void 0, Date.now());
		return {
			sunrise: parseTime(input.sunrise, currentTime, localTime(currentTime, 6, 0, 0)),
			sunset: parseTime(input.sunset, currentTime, localTime(currentTime, 18, 0, 0)),
			moonrise: parseTime(input.moonrise, currentTime, localTime(currentTime, 21, 0, 0)),
			moonset: parseTime(input.moonset, currentTime, localTime(currentTime, 7, 0, 0)),
			currentTime,
			updatedAt: input.updatedAt != null ? parseTime(input.updatedAt, currentTime, NaN) : void 0,
			title: typeof input.title === "string" && input.title ? input.title : void 0,
			remainingText: typeof input.remainingText === "string" && input.remainingText ? input.remainingText : void 0,
			updatedText: typeof input.updatedText === "string" && input.updatedText ? input.updatedText : void 0
		};
	}
	function resolveDayCycle(sunrise, sunset, currentTime) {
		let start = sunrise;
		let end = sunset;
		if (end <= start) end += DAY_MS;
		const progress = clamp((currentTime - start) / Math.max(end - start, 1), 0, 1);
		return {
			start,
			end,
			progress,
			isDaylight: currentTime >= start && currentTime <= end,
			wraps: sunset <= sunrise,
			durationMinutes: (end - start) / MINUTE_MS
		};
	}
	function resolveMoonCycle(moonrise, moonset, currentTime) {
		let start = moonrise;
		let end = moonset;
		const wraps = moonset <= moonrise;
		if (wraps) end += DAY_MS;
		if (wraps && currentTime < start && currentTime <= moonset) {
			start -= DAY_MS;
			end -= DAY_MS;
		}
		const progress = clamp((currentTime - start) / Math.max(end - start, 1), 0, 1);
		return {
			start,
			end,
			progress,
			visible: currentTime >= start && currentTime <= end,
			wraps,
			durationMinutes: (end - start) / MINUTE_MS
		};
	}
	function createArcLayout(geometry, progress, visible, wraps, durationMinutes) {
		const safeProgress = clamp(progress, 0, 1);
		return {
			start: pointOnArc(geometry, 0),
			end: pointOnArc(geometry, 1),
			current: pointOnArc(geometry, safeProgress),
			motionPoints: createMotionPoints(geometry, safeProgress),
			progress: safeProgress,
			visible,
			wraps,
			durationMinutes,
			solidPath: safeProgress > 0 ? createArcPath(geometry, 0, safeProgress) : "",
			dashedPath: safeProgress < 1 ? createArcPath(geometry, safeProgress, 1) : "",
			fullPath: createArcPath(geometry, 0, 1),
			areaPath: safeProgress > 0 ? createAreaPath(geometry, safeProgress) : ""
		};
	}
	function createArcPath(geometry, startProgress, endProgress) {
		const start = clamp(startProgress, 0, 1);
		const end = clamp(endProgress, start, 1);
		const steps = Math.max(2, Math.ceil(Math.abs(end - start) * 36));
		const points = [];
		for (let index = 0; index <= steps; index += 1) {
			const progress = start + (end - start) * index / steps;
			points.push(pointOnArc(geometry, progress));
		}
		return pointsToPath(points);
	}
	function createAreaPath(geometry, progress) {
		const end = clamp(progress, 0, 1);
		const steps = Math.max(2, Math.ceil(end * 36));
		const points = [];
		for (let index = 0; index <= steps; index += 1) points.push(pointOnArc(geometry, end * index / steps));
		const current = points[points.length - 1] || pointOnArc(geometry, 0);
		return `${pointsToPath(points)} L ${formatNumber(current.x)} ${formatNumber(geometry.baselineY)} L ${formatNumber(geometry.startX)} ${formatNumber(geometry.baselineY)} Z`;
	}
	function createMotionPoints(geometry, progress) {
		const end = clamp(progress, 0, 1);
		const steps = Math.max(1, Math.ceil(end * 24));
		const points = [];
		for (let index = 0; index <= steps; index += 1) points.push(pointOnArc(geometry, end * index / steps));
		return points;
	}
	function pointOnArc(geometry, progress) {
		const safeProgress = clamp(progress, 0, 1);
		return {
			x: geometry.startX + (geometry.endX - geometry.startX) * safeProgress,
			y: geometry.baselineY - Math.sin(Math.PI * safeProgress) * geometry.height
		};
	}
	function pointsToPath(points) {
		if (!points.length) return "";
		const [first, ...rest] = points;
		return [`M ${formatNumber(first.x)} ${formatNumber(first.y)}`, ...rest.map((point) => `L ${formatNumber(point.x)} ${formatNumber(point.y)}`)].join(" ");
	}
	function readDataOption(data) {
		if (Array.isArray(data)) {
			const first = data.find((item) => isPlainObject$1(item));
			return isPlainObject$1(first) ? first : {};
		}
		return isPlainObject$1(data) ? data : {};
	}
	function definedEventOption(option) {
		const result = {};
		[
			"sunrise",
			"sunset",
			"moonrise",
			"moonset",
			"currentTime",
			"updatedAt",
			"title",
			"remainingText",
			"updatedText"
		].forEach((key) => {
			if (option[key] !== void 0 && option[key] !== null) result[key] = option[key];
		});
		return result;
	}
	function parseTime(value, baseTime, fallback) {
		if (value instanceof Date) {
			const timestamp = value.getTime();
			return Number.isFinite(timestamp) ? timestamp : fallback;
		}
		if (typeof value === "number" && Number.isFinite(value)) {
			if (value >= 0 && value <= 1440) return localDayStart(baseTime ?? fallback) + value * MINUTE_MS;
			return value;
		}
		if (typeof value !== "string") return fallback;
		const text = value.trim();
		if (!text) return fallback;
		const timeMatch = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(text);
		if (timeMatch) {
			const hour = Number(timeMatch[1]);
			const minute = Number(timeMatch[2]);
			const second = Number(timeMatch[3] || 0);
			if (hour < 24 && minute < 60 && second < 60) return localTime(baseTime ?? fallback, hour, minute, second);
			return fallback;
		}
		const dateMatch = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/.exec(text);
		if (dateMatch) {
			const year = Number(dateMatch[1]);
			const month = Number(dateMatch[2]);
			const day = Number(dateMatch[3]);
			const hour = Number(dateMatch[4] || 0);
			const minute = Number(dateMatch[5] || 0);
			const second = Number(dateMatch[6] || 0);
			const timestamp = new Date(year, month - 1, day, hour, minute, second).getTime();
			return Number.isFinite(timestamp) ? timestamp : fallback;
		}
		const timestamp = new Date(text).getTime();
		return Number.isFinite(timestamp) ? timestamp : fallback;
	}
	function localDayStart(timestamp) {
		const date = new Date(timestamp);
		return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
	}
	function localTime(baseTimestamp, hour, minute, second) {
		return localDayStart(baseTimestamp) + hour * HOUR_MS + minute * MINUTE_MS + second * 1e3;
	}
	function formatDuration(seconds) {
		const safeSeconds = Math.max(0, Math.floor(seconds));
		const hours = Math.floor(safeSeconds / 3600);
		const minutes = Math.floor(safeSeconds % 3600 / 60);
		const restSeconds = safeSeconds % 60;
		return `${pad2(hours)}:${pad2(minutes)}:${pad2(restSeconds)}`;
	}
	function formatUpdatedText(updatedAt) {
		if (updatedAt == null || !Number.isFinite(updatedAt)) return "";
		return `更新于${formatTimeLabel(updatedAt)}`;
	}
	function formatTimeLabel(timestamp) {
		const date = new Date(timestamp);
		return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
	}
	function pad2(value) {
		return String(Math.trunc(value)).padStart(2, "0");
	}
	function formatNumber(value) {
		const rounded = Math.round(value * 1e3) / 1e3;
		return Object.is(rounded, -0) ? "0" : String(rounded);
	}
	function finiteNumber$1(value, fallback) {
		return typeof value === "number" && Number.isFinite(value) ? value : fallback;
	}
	function clamp(value, min, max) {
		return Math.min(Math.max(value, min), max);
	}
	function isPlainObject$1(value) {
		return value != null && typeof value === "object" && !Array.isArray(value);
	}
	//#endregion
	//#region src/sunrise-sunset.ts
	var echartsHost = echarts_lib_echarts;
	var optionKeys = [
		"sunrise",
		"sunset",
		"moonrise",
		"moonset",
		"currentTime",
		"updatedAt",
		"title",
		"remainingText",
		"updatedText",
		"padding",
		"baselineY",
		"dayArcHeight",
		"moonArcHeight",
		"moonStartRatio",
		"moonEndRatio"
	];
	echartsHost.extendSeriesModel({
		type: "series.sunriseSunset",
		visualDrawType: "fill",
		getInitialData(option) {
			const source = readSource(option);
			const dimensions = echartsHost.helper.createDimensions(source, { coordDimensions: ["value"] });
			const list = new echartsHost.List(dimensions, this);
			list.initData(source);
			return list;
		},
		defaultOption: {
			left: "center",
			top: "center",
			width: "100%",
			height: "100%",
			padding: 72,
			baselineY: null,
			dayArcHeight: null,
			moonArcHeight: null,
			moonStartRatio: .28,
			moonEndRatio: .72,
			sunrise: "05:12",
			sunset: "18:39",
			moonrise: "22:08",
			moonset: "07:59",
			currentTime: null,
			updatedAt: null,
			title: null,
			remainingText: null,
			updatedText: null,
			enterAnimation: true,
			sunIcon: null,
			moonIcon: null,
			backgroundStyle: {
				color: "#202124",
				opacity: 1
			},
			baselineStyle: {
				color: "#3f4245",
				width: 1.2,
				opacity: 1
			},
			dayLineStyle: {
				color: "#ffa72b",
				width: 5,
				opacity: 1
			},
			moonLineStyle: {
				color: "#5a91f2",
				width: 4,
				opacity: .72
			},
			dayAreaStyle: {
				color: "rgba(255, 167, 43, 0.2)",
				opacity: 1
			},
			titleLabel: {
				show: true,
				color: "#f5f6f7",
				fontSize: 46,
				fontWeight: 650
			},
			remainingLabel: {
				show: true,
				color: "#ffffff",
				fontSize: 76,
				fontWeight: 300
			},
			updatedLabel: {
				show: true,
				color: "#aeb0b5",
				fontSize: 34,
				fontWeight: 500
			},
			eventLabel: {
				show: true,
				color: "#eef0f2",
				fontSize: 36,
				fontWeight: 420
			},
			tooltip: { trigger: "item" }
		}
	});
	echartsHost.extendChartView({
		type: "sunriseSunset",
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
				const layout = resolveSunriseSunsetLayout(readLayoutOption(seriesModel, rect));
				if (this.__renderToken !== renderToken) return;
				const { hoverItems } = renderAlive(this, echartsHost, group, seriesModel, (targetGroup, targetSeriesModel) => drawSunriseSunset(echartsHost, targetGroup, targetSeriesModel, layout, rect));
				this.__hoverController = installElementHover(hoverItems, { zrender: api.getZr?.() });
			} catch (error) {
				if (typeof console !== "undefined") console.error("[sunriseSunset] render failed", error);
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
	function readSource(option) {
		if (Array.isArray(option.data)) return option.data;
		if (isPlainObject(option.data)) return [option.data];
		return [{
			name: "sunrise-sunset",
			value: 0,
			sunrise: option.sunrise,
			sunset: option.sunset,
			moonrise: option.moonrise,
			moonset: option.moonset
		}];
	}
	function drawSunriseSunset(echartsInstance, group, seriesModel, layout, rect) {
		const chartGroup = new echartsInstance.graphic.Group();
		chartGroup.x = rect.x;
		chartGroup.y = rect.y;
		const backgroundColor = String(readStyleValue(seriesModel, "backgroundStyle", "color", "#202124"));
		drawBackground(echartsInstance, chartGroup, seriesModel, layout);
		drawHeader(echartsInstance, chartGroup, seriesModel, layout);
		drawSky(echartsInstance, chartGroup, seriesModel, layout, backgroundColor);
		const hoverItems = drawEvents(echartsInstance, chartGroup, seriesModel, layout, backgroundColor);
		const data = seriesModel.getData();
		if (data.count() > 0) {
			data.setItemLayout(0, [layout.day.current.x, layout.day.current.y]);
			data.setItemGraphicEl(0, chartGroup);
		}
		group.add(chartGroup);
		return hoverItems;
	}
	function drawBackground(echartsInstance, group, seriesModel, layout) {
		const backgroundStyle = asRecord(seriesModel.get("backgroundStyle"));
		const color = backgroundStyle.color ?? "#202124";
		const opacity = finiteNumber(backgroundStyle.opacity, 1);
		if (!color || opacity <= 0) return;
		group.add(new echartsInstance.graphic.Rect({
			shape: {
				x: 0,
				y: 0,
				width: layout.width,
				height: layout.height
			},
			style: {
				fill: color,
				opacity
			},
			silent: true,
			z2: -10
		}));
	}
	function drawHeader(echartsInstance, group, seriesModel, layout) {
		const centerX = layout.width / 2;
		const titleModel = seriesModel.getModel("titleLabel");
		const remainingModel = seriesModel.getModel("remainingLabel");
		const updatedModel = seriesModel.getModel("updatedLabel");
		const top = Math.max(26, layout.height * .06);
		if (titleModel.get("show")) group.add(createText(echartsInstance, {
			x: centerX,
			y: top,
			text: formatHeaderText(titleModel.get("formatter"), layout.title, layout),
			fill: titleModel.get("color") || "#f5f6f7",
			fontSize: finiteNumber(titleModel.get("fontSize"), 46),
			fontWeight: titleModel.get("fontWeight") || 650,
			align: "center",
			verticalAlign: "top"
		}));
		if (remainingModel.get("show")) group.add(createText(echartsInstance, {
			x: centerX,
			y: top + layout.height * .094,
			text: formatHeaderText(remainingModel.get("formatter"), layout.remainingText, layout),
			fill: remainingModel.get("color") || "#ffffff",
			fontSize: finiteNumber(remainingModel.get("fontSize"), 76),
			fontWeight: remainingModel.get("fontWeight") || 300,
			align: "center",
			verticalAlign: "top"
		}));
		if (updatedModel.get("show") && layout.updatedText) group.add(createText(echartsInstance, {
			x: centerX,
			y: top + layout.height * .22,
			text: formatHeaderText(updatedModel.get("formatter"), layout.updatedText, layout),
			fill: updatedModel.get("color") || "#aeb0b5",
			fontSize: finiteNumber(updatedModel.get("fontSize"), 34),
			fontWeight: updatedModel.get("fontWeight") || 500,
			align: "center",
			verticalAlign: "top"
		}));
	}
	function drawSky(echartsInstance, group, seriesModel, layout, backgroundColor) {
		const dayLineStyle = readLineStyle(seriesModel, "dayLineStyle", "#ffa72b", 5, 1);
		const moonLineStyle = readLineStyle(seriesModel, "moonLineStyle", "#5a91f2", 4, .72);
		const baselineStyle = readLineStyle(seriesModel, "baselineStyle", "#3f4245", 1.2, 1);
		const dayAreaStyle = asRecord(seriesModel.get("dayAreaStyle"));
		const sunIcon = seriesModel.get("sunIcon");
		const moonIcon = seriesModel.get("moonIcon");
		const dayAreaAnimation = readEnterAnimation(seriesModel, 0);
		const dayFutureAnimation = readEnterAnimation(seriesModel, 1);
		const daySolidAnimation = readEnterAnimation(seriesModel, 2);
		const moonFullAnimation = readEnterAnimation(seriesModel, 3);
		const moonSolidAnimation = readEnterAnimation(seriesModel, 4);
		const baselineAnimation = readEnterAnimation(seriesModel, 5);
		const forceMotionGroup = isAliveRenderUpdate(seriesModel);
		if (layout.day.areaPath) addPath(echartsInstance, group, layout.day.areaPath, {
			fill: dayAreaStyle.color || "rgba(255, 167, 43, 0.2)",
			stroke: null,
			opacity: finiteNumber(dayAreaStyle.opacity, 1)
		}, true, -2, dayAreaAnimation);
		addPath(echartsInstance, group, layout.day.dashedPath || layout.day.fullPath, {
			fill: null,
			stroke: dayLineStyle.stroke,
			lineWidth: dayLineStyle.lineWidth,
			opacity: Math.max(dayLineStyle.opacity * .42, .12),
			lineDash: [7, 8],
			lineCap: "round",
			lineJoin: "round"
		}, true, 1, dayFutureAnimation);
		if (layout.day.solidPath) addPath(echartsInstance, group, layout.day.solidPath, {
			fill: null,
			stroke: dayLineStyle.stroke,
			lineWidth: dayLineStyle.lineWidth,
			opacity: dayLineStyle.opacity,
			lineCap: "round",
			lineJoin: "round"
		}, false, 3, daySolidAnimation);
		addPath(echartsInstance, group, layout.moon.fullPath, {
			fill: null,
			stroke: moonLineStyle.stroke,
			lineWidth: moonLineStyle.lineWidth,
			opacity: moonLineStyle.opacity,
			lineDash: [6, 7],
			lineCap: "round",
			lineJoin: "round"
		}, true, 0, moonFullAnimation);
		if (layout.moon.visible && layout.moon.solidPath) addPath(echartsInstance, group, layout.moon.solidPath, {
			fill: null,
			stroke: moonLineStyle.stroke,
			lineWidth: moonLineStyle.lineWidth,
			opacity: Math.min(moonLineStyle.opacity + .2, 1),
			lineCap: "round",
			lineJoin: "round"
		}, false, 2, moonSolidAnimation);
		const baseline = new echartsInstance.graphic.Line({
			shape: {
				x1: layout.padding * .08,
				y1: layout.baselineY,
				x2: layout.width - layout.padding * .08,
				y2: layout.baselineY
			},
			style: {
				fill: null,
				stroke: baselineStyle.stroke,
				lineWidth: baselineStyle.lineWidth,
				opacity: baselineStyle.opacity
			},
			silent: true,
			z2: -1
		});
		applyPathEnterAnimation(baseline, "shape", "percent", baselineAnimation);
		group.add(baseline);
		if (layout.day.visible) drawSunIcon(echartsInstance, group, layout.day.current.x, layout.day.current.y, 18, String(dayLineStyle.stroke), 1, 8, {
			animation: daySolidAnimation,
			motionPoints: layout.day.motionPoints,
			yOffset: 0,
			forceGroup: forceMotionGroup
		}, sunIcon);
		const moonPoint = layout.moon.visible ? layout.moon.current : layout.moon.start;
		drawMoonIcon(echartsInstance, group, moonPoint.x, layout.moon.visible ? moonPoint.y - 1 : moonPoint.y - 16, 19, String(moonLineStyle.stroke), backgroundColor, layout.moon.visible ? 1 : .92, 8, layout.moon.visible ? {
			animation: moonSolidAnimation,
			motionPoints: layout.moon.motionPoints,
			yOffset: -1,
			forceGroup: forceMotionGroup
		} : void 0, moonIcon);
	}
	function drawEvents(echartsInstance, group, seriesModel, layout, backgroundColor) {
		const labelModel = seriesModel.getModel("eventLabel");
		if (!labelModel.get("show")) return [];
		const fontSize = finiteNumber(labelModel.get("fontSize"), 36);
		const fontWeight = labelModel.get("fontWeight") || 420;
		const color = labelModel.get("color") || "#eef0f2";
		const iconY = Math.min(layout.height - 28, layout.baselineY + fontSize * .86);
		const textY = iconY - fontSize * .46;
		const sunColor = String(readStyleValue(seriesModel, "dayLineStyle", "color", "#ffa72b"));
		const moonColor = String(readStyleValue(seriesModel, "moonLineStyle", "color", "#5a91f2"));
		const sunIcon = seriesModel.get("sunIcon");
		const moonIcon = seriesModel.get("moonIcon");
		const hoverItems = [];
		hoverItems.push(drawEvent(echartsInstance, group, layout.events.sunrise, "rise", "sun", {
			color,
			fontSize,
			fontWeight,
			iconY,
			textY,
			iconColor: sunColor,
			backgroundColor,
			icon: sunIcon
		}));
		hoverItems.push(drawEvent(echartsInstance, group, layout.events.moonrise, "rise", "moon", {
			color,
			fontSize,
			fontWeight,
			iconY,
			textY,
			iconColor: moonColor,
			backgroundColor,
			icon: moonIcon
		}));
		hoverItems.push(drawEvent(echartsInstance, group, layout.events.moonset, "set", "moon", {
			color,
			fontSize,
			fontWeight,
			iconY,
			textY,
			iconColor: moonColor,
			backgroundColor,
			icon: moonIcon
		}));
		hoverItems.push(drawEvent(echartsInstance, group, layout.events.sunset, "set", "sun", {
			color,
			fontSize,
			fontWeight,
			iconY,
			textY,
			iconColor: sunColor,
			backgroundColor,
			icon: sunIcon
		}));
		return hoverItems;
	}
	function drawEvent(echartsInstance, group, event, direction, body, style) {
		const isRise = direction === "rise";
		const isSun = body === "sun";
		const iconOffset = isSun ? style.fontSize * 2.65 : style.fontSize * .5;
		const iconX = isRise ? event.x - iconOffset : event.x + iconOffset;
		const textGap = isSun ? style.fontSize * 1.15 : style.fontSize * .92;
		const textX = isRise ? iconX + textGap : iconX - textGap;
		const arrowY = style.iconY - style.fontSize * .78;
		const arrow = isRise ? "↑" : "↓";
		const elements = [];
		const arrowElement = createText(echartsInstance, {
			x: iconX,
			y: arrowY,
			text: arrow,
			fill: style.iconColor,
			fontSize: Math.max(18, style.fontSize * .58),
			fontWeight: 800,
			align: "center",
			verticalAlign: "middle"
		});
		setAliveRenderKey(arrowElement, `event:${event.key}:arrow`);
		elements.push(arrowElement);
		group.add(arrowElement);
		if (body === "sun") {
			const iconElements = drawSunIcon(echartsInstance, group, iconX, style.iconY, Math.max(8, style.fontSize * .27), style.iconColor, 1, 5, void 0, style.icon);
			iconElements.forEach((element, index) => setAliveRenderKey(element, `event:${event.key}:icon:${index}`));
			elements.push(...iconElements);
		} else {
			const iconElements = drawMoonIcon(echartsInstance, group, iconX, style.iconY, Math.max(8, style.fontSize * .3), style.iconColor, style.backgroundColor, 1, 5, void 0, style.icon);
			iconElements.forEach((element, index) => setAliveRenderKey(element, `event:${event.key}:icon:${index}`));
			elements.push(...iconElements);
		}
		const labelElement = createText(echartsInstance, {
			x: textX,
			y: style.textY,
			text: event.label,
			fill: style.color,
			fontSize: style.fontSize,
			fontWeight: style.fontWeight,
			align: isRise ? "left" : "right",
			verticalAlign: "top"
		});
		setAliveRenderKey(labelElement, `event:${event.key}:label`);
		elements.push(labelElement);
		group.add(labelElement);
		return {
			elements,
			triggerElements: elements
		};
	}
	function drawSunIcon(echartsInstance, group, x, y, radius, color, opacity, z2, motion, customIcon) {
		const shouldUseMotionGroup = hasIconMotion(motion) || shouldForceIconGroup(motion);
		const iconGroup = shouldUseMotionGroup ? new echartsInstance.graphic.Group() : null;
		const targetGroup = iconGroup || group;
		const centerX = shouldUseMotionGroup ? 0 : x;
		const centerY = shouldUseMotionGroup ? 0 : y;
		const elements = [];
		if (iconGroup) {
			iconGroup.x = x;
			iconGroup.y = y;
		}
		const customElements = addCustomIcon(echartsInstance, targetGroup, centerX, centerY, radius * 2.35, color, opacity, z2 + 1, customIcon);
		if (customElements) {
			finishIconGroup(group, iconGroup, motion);
			return customElements;
		}
		const rayCount = 10;
		for (let index = 0; index < rayCount; index += 1) {
			const angle = Math.PI * 2 * index / rayCount;
			const inner = radius * 1.3;
			const outer = radius * 1.72;
			const ray = new echartsInstance.graphic.Line({
				shape: {
					x1: centerX + Math.cos(angle) * inner,
					y1: centerY + Math.sin(angle) * inner,
					x2: centerX + Math.cos(angle) * outer,
					y2: centerY + Math.sin(angle) * outer
				},
				style: {
					fill: null,
					stroke: color,
					lineWidth: Math.max(2, radius * .2),
					opacity,
					lineCap: "round"
				},
				silent: true,
				z2
			});
			elements.push(ray);
			targetGroup.add(ray);
		}
		const core = new echartsInstance.graphic.Circle({
			shape: {
				cx: centerX,
				cy: centerY,
				r: radius
			},
			style: {
				fill: color,
				opacity
			},
			silent: true,
			z2: z2 + 1
		});
		elements.push(core);
		targetGroup.add(core);
		finishIconGroup(group, iconGroup, motion);
		return elements;
	}
	function drawMoonIcon(echartsInstance, group, x, y, radius, color, backgroundColor, opacity, z2, motion, customIcon) {
		const shouldUseMotionGroup = hasIconMotion(motion) || shouldForceIconGroup(motion);
		const iconGroup = shouldUseMotionGroup ? new echartsInstance.graphic.Group() : null;
		const targetGroup = iconGroup || group;
		const centerX = shouldUseMotionGroup ? 0 : x;
		const centerY = shouldUseMotionGroup ? 0 : y;
		const elements = [];
		if (iconGroup) {
			iconGroup.x = x;
			iconGroup.y = y;
		}
		const customElements = addCustomIcon(echartsInstance, targetGroup, centerX, centerY, radius * 2.1, color, opacity, z2 + 1, customIcon);
		if (customElements) {
			finishIconGroup(group, iconGroup, motion);
			return customElements;
		}
		const bodyElement = new echartsInstance.graphic.Circle({
			shape: {
				cx: centerX,
				cy: centerY,
				r: radius
			},
			style: {
				fill: color,
				opacity
			},
			silent: true,
			z2
		});
		elements.push(bodyElement);
		targetGroup.add(bodyElement);
		const cutoutElement = new echartsInstance.graphic.Circle({
			shape: {
				cx: centerX + radius * .45,
				cy: centerY - radius * .08,
				r: radius * .92
			},
			style: {
				fill: backgroundColor,
				opacity: 1
			},
			silent: true,
			z2: z2 + 1
		});
		elements.push(cutoutElement);
		targetGroup.add(cutoutElement);
		finishIconGroup(group, iconGroup, motion);
		return elements;
	}
	function finishIconGroup(group, iconGroup, motion) {
		if (!iconGroup) return;
		applyIconMotion(iconGroup, motion);
		group.add(iconGroup);
	}
	function addCustomIcon(echartsInstance, group, centerX, centerY, fallbackSize, color, opacity, z2, option) {
		if (option === false) return [];
		const icon = resolveCustomIcon(option, fallbackSize, color, opacity);
		if (!icon) return null;
		const rect = {
			x: centerX - icon.width / 2 + icon.offsetX,
			y: centerY - icon.height / 2 + icon.offsetY,
			width: icon.width,
			height: icon.height
		};
		if (icon.type === "image") {
			if (!echartsInstance.graphic.makeImage) return null;
			const image = echartsInstance.graphic.makeImage(icon.source, rect, "center");
			image.silent = true;
			image.z2 = z2;
			image.style = {
				...image.style || {},
				...icon.style
			};
			group.add(image);
			return [image];
		}
		if (!echartsInstance.graphic.makePath) return null;
		const pathElement = echartsInstance.graphic.makePath(icon.source, {
			style: icon.style,
			silent: true,
			z2
		}, rect, "center");
		group.add(pathElement);
		return [pathElement];
	}
	function resolveCustomIcon(option, fallbackSize, color, opacity) {
		const raw = normalizeIconSource(option);
		if (!raw) return void 0;
		const config = asRecord(option);
		const size = resolveIconSize(config, fallbackSize);
		const offset = resolveIconOffset(config);
		const styleOption = asRecord(config.style);
		const defaultStyle = raw.type === "path" ? {
			fill: color,
			stroke: null,
			opacity
		} : { opacity };
		return {
			type: raw.type,
			source: raw.source,
			width: size.width,
			height: size.height,
			offsetX: offset.x,
			offsetY: offset.y,
			style: {
				...defaultStyle,
				...styleOption
			}
		};
	}
	function normalizeIconSource(option) {
		if (typeof option === "string") {
			const source = option.trim();
			if (!source) return void 0;
			if (source.startsWith("image://")) return {
				type: "image",
				source: source.slice(8)
			};
			return {
				type: "path",
				source: source.startsWith("path://") ? source.slice(7) : source
			};
		}
		const config = asRecord(option);
		if (typeof config.image === "string") {
			const source = config.image.trim();
			if (!source) return void 0;
			return {
				type: "image",
				source: source.startsWith("image://") ? source.slice(8) : source
			};
		}
		if (typeof config.path === "string") {
			const source = config.path.trim();
			if (!source) return void 0;
			return {
				type: "path",
				source: source.startsWith("path://") ? source.slice(7) : source
			};
		}
	}
	function resolveIconSize(config, fallbackSize) {
		const size = config.size;
		if (Array.isArray(size)) {
			const width = finiteNumber(size[0], fallbackSize);
			const height = finiteNumber(size[1], width);
			return {
				width: Math.max(1, width),
				height: Math.max(1, height)
			};
		}
		const squareSize = Math.max(1, finiteNumber(size, fallbackSize));
		return {
			width: Math.max(1, finiteNumber(config.width, squareSize)),
			height: Math.max(1, finiteNumber(config.height, squareSize))
		};
	}
	function resolveIconOffset(config) {
		const offset = config.offset;
		if (!Array.isArray(offset)) return {
			x: finiteNumber(config.offsetX, 0),
			y: finiteNumber(config.offsetY, 0)
		};
		return {
			x: finiteNumber(offset[0], 0),
			y: finiteNumber(offset[1], 0)
		};
	}
	function createText(echartsInstance, style) {
		return new echartsInstance.graphic.Text({
			style: {
				fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
				...style
			},
			silent: true,
			z2: 10
		});
	}
	function addPath(echartsInstance, group, path, style, silent, z2, animation) {
		if (!path || !echartsInstance.graphic.makePath) return;
		const pathElement = echartsInstance.graphic.makePath(path, {
			style,
			silent,
			z2
		});
		if (animation) if (style.stroke) applyPathEnterAnimation(pathElement, "style", "strokePercent", animation);
		else applyFadeEnterAnimation(pathElement, animation);
		group.add(pathElement);
	}
	function readLineStyle(seriesModel, path, fallbackColor, fallbackWidth, fallbackOpacity) {
		const style = asRecord(seriesModel.get(path));
		return {
			stroke: style.color || fallbackColor,
			lineWidth: finiteNumber(style.width, fallbackWidth),
			opacity: finiteNumber(style.opacity, fallbackOpacity)
		};
	}
	function readStyleValue(seriesModel, path, key, fallback) {
		return asRecord(seriesModel.get(path))[key] ?? fallback;
	}
	function readEnterAnimation(seriesModel, itemIndex, animationOption = seriesModel.get("enterAnimation")) {
		if (seriesModel.get("animation") === false || animationOption === false) return disabledEnterAnimation();
		const option = animationOption == null || animationOption === true ? {} : asRecord(animationOption);
		if (option.show === false || option.enabled === false) return disabledEnterAnimation();
		const baseDelay = resolveAnimationNumber(option.delay ?? seriesModel.get("animationDelay"), itemIndex, itemIndex, 0);
		const stagger = resolveAnimationNumber(option.stagger, itemIndex, itemIndex, 80);
		return {
			enabled: true,
			duration: resolveAnimationNumber(option.duration ?? seriesModel.get("animationDuration"), itemIndex, itemIndex, 760),
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
		const target = resolveAnimationTarget(animatable, targetKey);
		target[propertyName] = 0;
		animateGraphicProperty(animatable, targetKey, animation, { [propertyName]: 1 });
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
			Object.assign(resolveAnimationTarget(element, targetKey), target);
			return;
		}
		const chain = animator.when(animation.duration, target);
		if (animation.delay > 0) chain.delay?.(animation.delay);
		chain.start(animation.easing);
	}
	function applyIconMotion(iconGroup, motion) {
		if (!hasIconMotion(motion)) return;
		const animatable = iconGroup;
		const first = motion.motionPoints[0];
		const final = motion.motionPoints[motion.motionPoints.length - 1];
		animatable.x = first.x;
		animatable.y = first.y + motion.yOffset;
		const animator = animatable.animate?.("");
		if (!animator) {
			animatable.x = final.x;
			animatable.y = final.y + motion.yOffset;
			return;
		}
		const maxIndex = motion.motionPoints.length - 1;
		motion.motionPoints.forEach((point, index) => {
			const time = index === maxIndex ? motion.animation.duration : motion.animation.duration * index / maxIndex;
			animator.when(time, {
				x: point.x,
				y: point.y + motion.yOffset
			});
		});
		if (motion.animation.delay > 0) animator.delay?.(motion.animation.delay);
		animator.start(motion.animation.easing);
	}
	function hasIconMotion(motion) {
		return !!motion?.animation.enabled && motion.motionPoints.length >= 2;
	}
	function shouldForceIconGroup(motion) {
		return motion?.forceGroup === true && motion.motionPoints.length >= 2;
	}
	function isAliveRenderUpdate(seriesModel) {
		return seriesModel.__aliveRenderUpdating === true;
	}
	function resolveAnimationTarget(element, targetKey) {
		if (!targetKey) return element;
		const target = element[targetKey] || {};
		element[targetKey] = target;
		return target;
	}
	function formatHeaderText(formatter, fallback, layout) {
		if (typeof formatter === "function") {
			const value = formatter({
				data: layout,
				title: layout.title,
				remainingText: layout.remainingText,
				updatedText: layout.updatedText
			});
			return value == null ? "" : String(value);
		}
		if (typeof formatter === "string") return formatter.replace(/\{title\}/g, layout.title).replace(/\{remaining\}/g, layout.remainingText).replace(/\{updated\}/g, layout.updatedText);
		return fallback;
	}
	function finiteNumber(value, fallback) {
		return typeof value === "number" && Number.isFinite(value) ? value : fallback;
	}
	function asRecord(value) {
		return value != null && typeof value === "object" && !Array.isArray(value) ? value : {};
	}
	function isPlainObject(value) {
		return value != null && typeof value === "object" && !Array.isArray(value);
	}
	//#endregion
});

//# sourceMappingURL=echarts-sunrise-sunset.js.map