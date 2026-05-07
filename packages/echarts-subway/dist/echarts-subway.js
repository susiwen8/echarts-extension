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
		const dimOpacity = finiteNumber$4(options.dimOpacity, DEFAULT_HOVER_DIM_OPACITY);
		const transitionDuration = finiteNumber$4(options.transitionDuration, DEFAULT_HOVER_TRANSITION_DURATION);
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
		return cloneRecord$1(asRecord$3(element.style));
	}
	function cloneRecord$1(record) {
		return { ...record };
	}
	function asRecord$3(value) {
		return value && typeof value === "object" && !Array.isArray(value) ? value : {};
	}
	function finiteNumber$4(value, fallback) {
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
		const explicitDuration = finiteNumber$3(options.duration, NaN);
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
			duration: finiteNumber$3(readModelValue(model, "animationDurationUpdate"), finiteNumber$3(readModelValue(model, "animationDuration"), DEFAULT_UPDATE_DURATION)),
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
		removeMissingKeys(asRecord$2(current.shape), asRecord$2(target.shape));
		removeMissingKeys(asRecord$2(current.style), asRecord$2(target.style));
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
			const targetStyle = cloneRecord(asRecord$2(displayable.style));
			const originalOpacity = finiteNumber$3(targetStyle.opacity, 1);
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
		return asRecord$2(element.style) ? [element] : [];
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
	function asRecord$2(value) {
		return value != null && typeof value === "object" && !Array.isArray(value) ? value : {};
	}
	function finiteNumber$3(value, fallback) {
		return typeof value === "number" && Number.isFinite(value) ? value : fallback;
	}
	3 / 2 * Math.PI;
	//#endregion
	//#region src/layout.ts
	var DEFAULT_WIDTH = 800;
	var DEFAULT_HEIGHT = 520;
	var DEFAULT_PADDING = 24;
	var DEFAULT_STATION_RADIUS = 4;
	var DEFAULT_INTERCHANGE_RADIUS = 8;
	var DEFAULT_LINE_WIDTH = 8;
	var DEFAULT_SUBWAY_COLORS = [
		"#d51f2a",
		"#f5a623",
		"#14a75b",
		"#1677c9",
		"#8e44ad",
		"#00a6a6",
		"#ef6c00",
		"#6f7f8f"
	];
	function resolveSubwayLayout(option = {}) {
		const layoutOptions = isPlainObject(option.layoutOptions) ? option.layoutOptions : {};
		const layout = isPlainObject(option.layout) ? option.layout : {};
		const routes = Array.isArray(option.routes) ? option.routes : Array.isArray(option.data) ? option.data : [];
		const colors = Array.isArray(option.colors) ? option.colors.filter((color) => typeof color === "string") : void 0;
		const preserveAspectRatio = firstBoolean(option.preserveAspectRatio, layoutOptions.preserveAspectRatio, layout.preserveAspectRatio);
		return layoutSubway(routes, {
			...layout,
			...layoutOptions,
			width: finiteNumber$2(option.width, finiteNumber$2(layoutOptions.width, finiteNumber$2(layout.width, DEFAULT_WIDTH))),
			height: finiteNumber$2(option.height, finiteNumber$2(layoutOptions.height, finiteNumber$2(layout.height, DEFAULT_HEIGHT))),
			padding: finiteNumber$2(option.padding, finiteNumber$2(layoutOptions.padding, finiteNumber$2(layout.padding, DEFAULT_PADDING))),
			stationRadius: finiteNumber$2(option.stationRadius, finiteNumber$2(layoutOptions.stationRadius, finiteNumber$2(layout.stationRadius, DEFAULT_STATION_RADIUS))),
			interchangeRadius: finiteNumber$2(option.interchangeRadius, finiteNumber$2(layoutOptions.interchangeRadius, finiteNumber$2(layout.interchangeRadius, DEFAULT_INTERCHANGE_RADIUS))),
			lineWidth: finiteNumber$2(option.lineWidth, finiteNumber$2(layoutOptions.lineWidth, finiteNumber$2(layout.lineWidth, DEFAULT_LINE_WIDTH))),
			preserveAspectRatio,
			colors
		});
	}
	function layoutSubway(routesInput, options = {}) {
		const width = Math.max(1, finiteNumber$2(options.width, DEFAULT_WIDTH));
		const height = Math.max(1, finiteNumber$2(options.height, DEFAULT_HEIGHT));
		const padding = Math.max(0, finiteNumber$2(options.padding, DEFAULT_PADDING));
		const stationRadius = Math.max(1, finiteNumber$2(options.stationRadius, DEFAULT_STATION_RADIUS));
		const interchangeRadius = Math.max(stationRadius, finiteNumber$2(options.interchangeRadius, DEFAULT_INTERCHANGE_RADIUS));
		const lineWidth = Math.max(1, finiteNumber$2(options.lineWidth, DEFAULT_LINE_WIDTH));
		const preserveAspectRatio = options.preserveAspectRatio !== false;
		const colors = options.colors?.length ? options.colors : DEFAULT_SUBWAY_COLORS;
		const normalizedRoutes = normalizeRoutes(routesInput);
		const mutableStations = mergeStations(normalizedRoutes);
		const extent = computeExtent(collectRawPoints(normalizedRoutes, mutableStations));
		const project = createProjector(extent, width, height, padding, preserveAspectRatio);
		const stations = Array.from(mutableStations.values()).map((station, dataIndex) => {
			const point = project(station.x, station.y);
			const interchange = station.interchange || station.lines.length > 1;
			return {
				id: station.id,
				name: station.name,
				x: point.x,
				y: point.y,
				rawX: station.x,
				rawY: station.y,
				radius: interchange ? interchangeRadius : stationRadius,
				labelPosition: station.labelPosition || autoLabelPosition(point.x, width),
				interchange,
				lines: station.lines,
				dataIndex,
				raw: station.raw
			};
		});
		return {
			width,
			height,
			padding,
			stationRadius,
			interchangeRadius,
			lineWidth,
			routes: normalizedRoutes.map((route, index) => ({
				id: route.id,
				name: route.name,
				color: route.color || colors[index % colors.length],
				lineWidth,
				points: route.points.map((point) => ({
					...project(point.x, point.y),
					rawX: point.x,
					rawY: point.y,
					stationId: point.stationId
				})),
				stationIds: route.stations.map((station) => station.id),
				raw: route.raw
			})),
			stations,
			extent
		};
	}
	function collectSubwayStationData(routesInput) {
		const stations = [];
		const seen = /* @__PURE__ */ new Set();
		normalizeRoutes(routesInput).forEach((route) => {
			route.stations.forEach((station) => {
				if (seen.has(station.id)) return;
				seen.add(station.id);
				stations.push(station.raw);
			});
		});
		return stations;
	}
	function normalizeRoutes(routesInput) {
		return routesInput.map((routeInput, routeIndex) => normalizeRoute(routeInput, routeIndex)).filter((route) => route != null && (route.stations.length > 0 || route.points.length > 0));
	}
	function normalizeRoute(routeInput, routeIndex) {
		const route = asRecord$1(routeInput);
		const routeId = normalizeId(route.id ?? route.name ?? `route-${routeIndex + 1}`);
		const routeName = normalizeName(route.name ?? route.id, routeId);
		const stations = (Array.isArray(route.stations) ? route.stations : Array.isArray(route.data) ? route.data : []).map((stationInput, stationIndex) => normalizeStation(stationInput, routeId, stationIndex)).filter((station) => station != null);
		const stationById = new Map(stations.map((station) => [station.id, station]));
		const waypointInputs = Array.isArray(route.waypoints) ? route.waypoints : [];
		const points = (waypointInputs.length ? waypointInputs : stations).map((pointInput, pointIndex) => normalizePathPoint(pointInput, stationById, routeId, pointIndex)).filter((point) => point != null);
		return {
			id: routeId,
			name: routeName,
			color: typeof route.color === "string" ? route.color : void 0,
			stations,
			points,
			raw: routeInput
		};
	}
	function normalizeStation(input, routeId, stationIndex) {
		const fallbackId = `${routeId}:${stationIndex + 1}`;
		if (Array.isArray(input)) {
			const parsed = parseArrayStation(input, fallbackId);
			return parsed ? {
				...parsed,
				raw: input
			} : null;
		}
		const item = asRecord$1(input);
		const coord = readCoord(item);
		if (!coord) return null;
		const id = normalizeId(item.id ?? item.name ?? fallbackId);
		return {
			id,
			name: normalizeName(item.name ?? item.id, id),
			x: coord[0],
			y: coord[1],
			labelPosition: normalizeLabelPosition(item.labelPosition),
			interchange: item.interchange === true,
			raw: input
		};
	}
	function parseArrayStation(input, fallbackId) {
		if (typeof input[0] === "number" && typeof input[1] === "number") {
			const name = input[2] != null ? String(input[2]) : fallbackId;
			return {
				id: normalizeId(input[3] ?? name),
				name,
				x: input[0],
				y: input[1],
				labelPosition: normalizeLabelPosition(input[4]),
				interchange: input[5] === true
			};
		}
		if ((typeof input[0] === "string" || typeof input[0] === "number") && typeof input[2] === "number" && typeof input[3] === "number") return {
			id: normalizeId(input[0]),
			name: normalizeName(input[1], normalizeId(input[0])),
			x: input[2],
			y: input[3],
			labelPosition: normalizeLabelPosition(input[4]),
			interchange: input[5] === true
		};
		return null;
	}
	function normalizePathPoint(input, stationById, routeId, pointIndex) {
		if (Array.isArray(input)) return parseArrayPathPoint(input, stationById);
		const item = asRecord$1(input);
		const stationId = normalizeOptionalId(item.stationId ?? item.id);
		const station = stationId ? stationById.get(stationId) : void 0;
		if (station) return {
			x: station.x,
			y: station.y,
			stationId: station.id
		};
		const coord = readCoord(item);
		if (!coord) return null;
		return {
			x: coord[0],
			y: coord[1],
			stationId: stationId || (stationById.has(`${routeId}:${pointIndex + 1}`) ? `${routeId}:${pointIndex + 1}` : void 0)
		};
	}
	function parseArrayPathPoint(input, stationById) {
		const stationId = normalizeOptionalId(input[0]);
		if (stationId && typeof input[1] !== "number") {
			const station = stationById.get(stationId);
			return station ? {
				x: station.x,
				y: station.y,
				stationId: station.id
			} : null;
		}
		if (stationId && typeof input[1] === "number" && typeof input[2] === "number") return {
			x: input[1],
			y: input[2],
			stationId: stationById.has(stationId) ? stationId : void 0
		};
		if (typeof input[0] === "number" && typeof input[1] === "number") return {
			x: input[0],
			y: input[1]
		};
		return null;
	}
	function mergeStations(routes) {
		const stations = /* @__PURE__ */ new Map();
		routes.forEach((route) => {
			route.stations.forEach((station) => {
				const existing = stations.get(station.id);
				if (!existing) {
					stations.set(station.id, {
						id: station.id,
						name: station.name,
						x: station.x,
						y: station.y,
						labelPosition: station.labelPosition,
						interchange: station.interchange === true,
						lines: [route.id],
						raw: station.raw
					});
					return;
				}
				if (!existing.lines.includes(route.id)) existing.lines.push(route.id);
				if (!existing.labelPosition && station.labelPosition) existing.labelPosition = station.labelPosition;
				existing.interchange = existing.interchange || station.interchange === true;
			});
		});
		return stations;
	}
	function collectRawPoints(routes, stations) {
		const points = [];
		routes.forEach((route) => {
			route.points.forEach((point) => points.push([point.x, point.y]));
		});
		stations.forEach((station) => points.push([station.x, station.y]));
		return points;
	}
	function computeExtent(points) {
		if (!points.length) return {
			minX: 0,
			minY: 0,
			maxX: 0,
			maxY: 0
		};
		return points.reduce((extent, point) => ({
			minX: Math.min(extent.minX, point[0]),
			minY: Math.min(extent.minY, point[1]),
			maxX: Math.max(extent.maxX, point[0]),
			maxY: Math.max(extent.maxY, point[1])
		}), {
			minX: Number.POSITIVE_INFINITY,
			minY: Number.POSITIVE_INFINITY,
			maxX: Number.NEGATIVE_INFINITY,
			maxY: Number.NEGATIVE_INFINITY
		});
	}
	function createProjector(extent, width, height, padding, preserveAspectRatio) {
		const innerWidth = Math.max(width - padding * 2, 1);
		const innerHeight = Math.max(height - padding * 2, 1);
		const rangeX = extent.maxX - extent.minX;
		const rangeY = extent.maxY - extent.minY;
		const scaleX = rangeX > 0 ? innerWidth / rangeX : 1;
		const scaleY = rangeY > 0 ? innerHeight / rangeY : 1;
		const scale = preserveAspectRatio ? Math.min(scaleX, scaleY) : 1;
		const finalScaleX = preserveAspectRatio ? scale : scaleX;
		const finalScaleY = preserveAspectRatio ? scale : scaleY;
		const drawnWidth = rangeX > 0 ? rangeX * finalScaleX : 0;
		const drawnHeight = rangeY > 0 ? rangeY * finalScaleY : 0;
		const offsetX = padding + (innerWidth - drawnWidth) / 2;
		const offsetY = padding + (innerHeight - drawnHeight) / 2;
		return (x, y) => ({
			x: rangeX > 0 ? offsetX + (x - extent.minX) * finalScaleX : width / 2,
			y: rangeY > 0 ? offsetY + (y - extent.minY) * finalScaleY : height / 2
		});
	}
	function readCoord(item) {
		if (Array.isArray(item.coord) && typeof item.coord[0] === "number" && typeof item.coord[1] === "number") return [item.coord[0], item.coord[1]];
		if (Array.isArray(item.value) && typeof item.value[0] === "number" && typeof item.value[1] === "number") return [item.value[0], item.value[1]];
		if (typeof item.x === "number" && typeof item.y === "number") return [item.x, item.y];
		return null;
	}
	function autoLabelPosition(x, width) {
		return x > width * .72 ? "left" : "right";
	}
	function normalizeLabelPosition(value) {
		return value === "top" || value === "bottom" || value === "left" || value === "right" ? value : void 0;
	}
	function normalizeOptionalId(value) {
		if (typeof value !== "string" && typeof value !== "number") return void 0;
		return normalizeId(value);
	}
	function normalizeId(value) {
		return String(value == null || value === "" ? "station" : value);
	}
	function normalizeName(value, fallback) {
		return typeof value === "string" && value ? value : fallback;
	}
	function finiteNumber$2(value, fallback) {
		return typeof value === "number" && Number.isFinite(value) ? value : fallback;
	}
	function firstBoolean(...values) {
		return values.find((value) => typeof value === "boolean");
	}
	function isPlainObject(value) {
		return value != null && typeof value === "object" && !Array.isArray(value);
	}
	function asRecord$1(value) {
		return isPlainObject(value) ? value : {};
	}
	//#endregion
	//#region src/route-path.ts
	function createRoundedRoutePath(points, cornerRadius) {
		const routePoints = points.filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
		if (!routePoints.length) return "";
		const radius = Math.max(0, finiteNumber$1(cornerRadius, 0));
		const commands = [`M${formatNumber(routePoints[0].x)} ${formatNumber(routePoints[0].y)}`];
		for (let index = 1; index < routePoints.length - 1; index += 1) {
			const previous = routePoints[index - 1];
			const current = routePoints[index];
			const next = routePoints[index + 1];
			const incoming = vector(previous, current);
			const outgoing = vector(next, current);
			if (current.stationId || !radius || !incoming.length || !outgoing.length || isStraight(previous, current, next)) {
				commands.push(lineTo(current));
				continue;
			}
			const trim = Math.min(radius, incoming.length / 2, outgoing.length / 2);
			const start = {
				x: current.x + incoming.x / incoming.length * trim,
				y: current.y + incoming.y / incoming.length * trim
			};
			const end = {
				x: current.x + outgoing.x / outgoing.length * trim,
				y: current.y + outgoing.y / outgoing.length * trim
			};
			commands.push(lineTo(start));
			commands.push(`Q${formatNumber(current.x)} ${formatNumber(current.y)} ${formatNumber(end.x)} ${formatNumber(end.y)}`);
		}
		if (routePoints.length > 1) commands.push(lineTo(routePoints[routePoints.length - 1]));
		return commands.join("");
	}
	function vector(point, origin) {
		const x = point.x - origin.x;
		const y = point.y - origin.y;
		return {
			x,
			y,
			length: Math.hypot(x, y)
		};
	}
	function isStraight(previous, current, next) {
		const incoming = {
			x: current.x - previous.x,
			y: current.y - previous.y
		};
		const outgoing = {
			x: next.x - current.x,
			y: next.y - current.y
		};
		const cross = incoming.x * outgoing.y - incoming.y * outgoing.x;
		return Math.abs(cross) < 1e-9;
	}
	function lineTo(point) {
		return `L${formatNumber(point.x)} ${formatNumber(point.y)}`;
	}
	function formatNumber(value) {
		return String(Math.round(value * 1e3) / 1e3);
	}
	function finiteNumber$1(value, fallback) {
		return typeof value === "number" && Number.isFinite(value) ? value : fallback;
	}
	//#endregion
	//#region src/route-segments.ts
	var COORDINATE_PRECISION = 1e3;
	var PARALLEL_GAP = 2;
	function routeSegmentOffsetKey(routeId, segmentIndex) {
		return `${routeId}\x00${segmentIndex}`;
	}
	function resolveSharedSegmentOffsets(routes) {
		const groups = /* @__PURE__ */ new Map();
		routes.forEach((route) => {
			for (let segmentIndex = 0; segmentIndex < route.points.length - 1; segmentIndex += 1) {
				const start = route.points[segmentIndex];
				const end = route.points[segmentIndex + 1];
				if (!isDrawablePoint(start) || !isDrawablePoint(end) || samePoint(start, end)) continue;
				const key = canonicalSegmentKey(start, end);
				const group = groups.get(key) || {
					...canonicalSegmentPoints(start, end),
					entries: []
				};
				group.entries.push({
					routeId: route.id,
					segmentIndex,
					lineWidth: route.lineWidth,
					start,
					end
				});
				groups.set(key, group);
			}
		});
		const offsets = /* @__PURE__ */ new Map();
		groups.forEach((group) => {
			const entries = uniqueSegmentEntries(group.entries);
			if (entries.length <= 1) return;
			const dx = group.end.x - group.start.x;
			const dy = group.end.y - group.start.y;
			const length = Math.hypot(dx, dy);
			if (!length) return;
			const spacing = Math.max(...entries.map((entry) => entry.lineWidth), 1) + PARALLEL_GAP;
			const normalX = -dy / length;
			const normalY = dx / length;
			entries.sort((left, right) => left.routeId.localeCompare(right.routeId) || left.segmentIndex - right.segmentIndex).forEach((entry, rank) => {
				const distance = (rank - (entries.length - 1) / 2) * spacing;
				offsets.set(routeSegmentOffsetKey(entry.routeId, entry.segmentIndex), {
					routeId: entry.routeId,
					segmentIndex: entry.segmentIndex,
					count: entries.length,
					rank,
					offsetX: normalX * distance,
					offsetY: normalY * distance
				});
			});
		});
		return offsets;
	}
	function uniqueSegmentEntries(entries) {
		const seen = /* @__PURE__ */ new Set();
		const unique = [];
		entries.forEach((entry) => {
			const key = routeSegmentOffsetKey(entry.routeId, entry.segmentIndex);
			if (seen.has(key)) return;
			seen.add(key);
			unique.push(entry);
		});
		return unique;
	}
	function canonicalSegmentKey(start, end) {
		const startKey = pointKey(start);
		const endKey = pointKey(end);
		return startKey <= endKey ? `${startKey}|${endKey}` : `${endKey}|${startKey}`;
	}
	function canonicalSegmentPoints(start, end) {
		return pointKey(start) <= pointKey(end) ? {
			start,
			end
		} : {
			start: end,
			end: start
		};
	}
	function pointKey(point) {
		if (point.stationId) return `station:${point.stationId}`;
		return `coord:${roundCoordinate(point.x)},${roundCoordinate(point.y)}`;
	}
	function roundCoordinate(value) {
		return Math.round(value * COORDINATE_PRECISION) / COORDINATE_PRECISION;
	}
	function samePoint(start, end) {
		return roundCoordinate(start.x) === roundCoordinate(end.x) && roundCoordinate(start.y) === roundCoordinate(end.y);
	}
	function isDrawablePoint(point) {
		return Number.isFinite(point.x) && Number.isFinite(point.y);
	}
	//#endregion
	//#region src/subway.ts
	var echartsHost = echarts_lib_echarts;
	var optionKeys = [
		"padding",
		"stationRadius",
		"interchangeRadius",
		"lineWidth",
		"cornerRadius",
		"preserveAspectRatio",
		"colors"
	];
	echartsHost.extendSeriesModel({
		type: "series.subway",
		visualDrawType: "fill",
		getInitialData(option) {
			const source = collectSubwayStationData(readRoutes(option));
			const dimensions = echartsHost.helper.createDimensions(source, { coordDimensions: ["value"] });
			const list = new echartsHost.List(dimensions, this);
			list.initData(source);
			return list;
		},
		defaultOption: {
			left: "center",
			top: "center",
			width: "92%",
			height: "86%",
			padding: 24,
			stationRadius: 4,
			interchangeRadius: 8,
			lineWidth: 8,
			cornerRadius: null,
			preserveAspectRatio: true,
			colors: DEFAULT_SUBWAY_COLORS,
			enterAnimation: true,
			lineStyle: {
				opacity: 1,
				cap: "round",
				join: "round"
			},
			stationStyle: {
				color: "#ffffff",
				borderColor: null,
				borderWidth: 2
			},
			interchangeStyle: {
				color: "#ffffff",
				borderColor: "#111827",
				borderWidth: 3
			},
			label: {
				show: true,
				color: "#111827",
				fontSize: 11,
				fontWeight: 600,
				formatter: null
			},
			routeLabel: {
				show: false,
				position: "end",
				color: null,
				fontSize: 12,
				fontWeight: 700,
				formatter: null
			},
			emphasis: { itemStyle: {
				shadowBlur: 8,
				shadowColor: "rgba(17, 24, 39, 0.22)"
			} }
		}
	});
	echartsHost.extendChartView({
		type: "subway",
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
				const layout = resolveSubwayLayout(readLayoutOption(seriesModel, rect));
				if (this.__renderToken !== renderToken) return;
				const { hoverItems } = renderAlive(this, echartsHost, group, seriesModel, (targetGroup, targetSeriesModel) => drawSubway(echartsHost, targetGroup, targetSeriesModel, layout, rect));
				this.__hoverController = installElementHover(hoverItems, { zrender: api.getZr?.() });
			} catch (error) {
				if (typeof console !== "undefined") console.error("[subway] render failed", error);
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
			data: readRoutes(seriesModel.option || {}),
			width: rect.width,
			height: rect.height
		};
		optionKeys.forEach((key) => {
			const value = seriesModel.get(key);
			if (value !== void 0 && value !== null) layoutOption[key] = value;
		});
		return layoutOption;
	}
	function readRoutes(option) {
		return Array.isArray(option.routes) ? option.routes : Array.isArray(option.data) ? option.data : [];
	}
	function drawSubway(echartsInstance, group, seriesModel, layout, rect) {
		const chartGroup = new echartsInstance.graphic.Group();
		const routeElementsById = /* @__PURE__ */ new Map();
		const stationElementsById = /* @__PURE__ */ new Map();
		chartGroup.x = rect.x;
		chartGroup.y = rect.y;
		const routeGroup = new echartsInstance.graphic.Group();
		const segmentOffsets = resolveSharedSegmentOffsets(layout.routes);
		layout.routes.forEach((route, routeIndex) => {
			const routeElements = drawRoute(echartsInstance, routeGroup, seriesModel, route, routeIndex, segmentOffsets);
			if (routeElements.length) routeElementsById.set(route.id, routeElements);
		});
		chartGroup.add(routeGroup);
		const stationGroup = new echartsInstance.graphic.Group();
		layout.stations.forEach((station, stationIndex) => {
			const stationElements = drawStation(echartsInstance, stationGroup, seriesModel, layout, station, stationIndex);
			if (stationElements.length) stationElementsById.set(station.id, stationElements);
		});
		chartGroup.add(stationGroup);
		drawRouteLabels(echartsInstance, chartGroup, seriesModel, layout.routes, routeElementsById);
		drawStationLabels(echartsInstance, chartGroup, seriesModel, layout.stations, stationElementsById);
		group.add(chartGroup);
		if (seriesModel.get("silent") === true) return [];
		return createSubwayHoverItems(layout, routeElementsById, stationElementsById);
	}
	function drawRoute(echartsInstance, group, seriesModel, route, routeIndex, segmentOffsets) {
		if (route.points.length < 2) return [];
		const elements = [];
		const style = readRouteStyle(seriesModel, route);
		const cornerRadius = readRouteCornerRadius(seriesModel, route, style);
		if (!route.points.some((point, index) => index > 0 && segmentOffsets.has(routeSegmentOffsetKey(route.id, index - 1)))) return drawRoutePath(echartsInstance, group, route.points, style, cornerRadius, readEnterAnimation(seriesModel, routeIndex));
		let normalFragment = [];
		for (let segmentIndex = 0; segmentIndex < route.points.length - 1; segmentIndex += 1) {
			const previous = route.points[segmentIndex];
			const current = route.points[segmentIndex + 1];
			const segmentOffset = segmentOffsets.get(routeSegmentOffsetKey(route.id, segmentIndex));
			if (segmentOffset) {
				elements.push(...drawRoutePath(echartsInstance, group, normalFragment, style, cornerRadius, readEnterAnimation(seriesModel, routeIndex)));
				normalFragment = [];
				elements.push(...drawRoutePath(echartsInstance, group, [offsetRoutePoint(previous, segmentOffset), offsetRoutePoint(current, segmentOffset)], style, 0, readEnterAnimation(seriesModel, routeIndex)));
				continue;
			}
			if (!normalFragment.length) normalFragment.push(previous);
			normalFragment.push(current);
		}
		elements.push(...drawRoutePath(echartsInstance, group, normalFragment, style, cornerRadius, readEnterAnimation(seriesModel, routeIndex)));
		return elements;
	}
	function drawRoutePath(echartsInstance, group, points, style, cornerRadius, animation) {
		if (points.length < 2) return [];
		const path = createRoundedRoutePath(points, cornerRadius);
		if (path && echartsInstance.graphic.makePath) {
			const pathElement = echartsInstance.graphic.makePath(path, { style });
			pathElement.silent = true;
			applyPathEnterAnimation(pathElement, "style", "strokePercent", animation);
			group.add(pathElement);
			return [pathElement];
		}
		if (echartsInstance.graphic.Polyline) {
			const polyline = new echartsInstance.graphic.Polyline({
				shape: { points: points.map((point) => [point.x, point.y]) },
				style,
				silent: true
			});
			applyPathEnterAnimation(polyline, "shape", "percent", animation);
			group.add(polyline);
			return [polyline];
		}
		const elements = [];
		for (let index = 1; index < points.length; index += 1) {
			const previous = points[index - 1];
			const current = points[index];
			const line = new echartsInstance.graphic.Line({
				shape: {
					x1: previous.x,
					y1: previous.y,
					x2: current.x,
					y2: current.y
				},
				style,
				silent: true
			});
			applyPathEnterAnimation(line, "shape", "percent", animation);
			group.add(line);
			elements.push(line);
		}
		return elements;
	}
	function offsetRoutePoint(point, offset) {
		return {
			...point,
			x: point.x + offset.offsetX,
			y: point.y + offset.offsetY
		};
	}
	function drawStation(echartsInstance, group, seriesModel, layout, station, stationIndex) {
		const data = seriesModel.getData();
		const itemModel = station.dataIndex >= 0 && station.dataIndex < data.count() ? data.getItemModel(station.dataIndex) : null;
		const circle = new echartsInstance.graphic.Circle({
			shape: {
				cx: station.x,
				cy: station.y,
				r: station.radius
			},
			style: readStationStyle(seriesModel, itemModel, data, station, layout),
			silent: seriesModel.get("silent") === true
		});
		applyCircleEnterAnimation(circle, station.radius, readEnterAnimation(seriesModel, layout.routes.length + stationIndex));
		if (itemModel && station.dataIndex >= 0 && station.dataIndex < data.count()) {
			data.setItemLayout(station.dataIndex, [station.x, station.y]);
			data.setItemGraphicEl(station.dataIndex, circle);
		}
		group.add(circle);
		return [circle];
	}
	function drawStationLabels(echartsInstance, group, seriesModel, stations, stationElementsById) {
		const seriesLabelModel = seriesModel.getModel("label");
		if (!seriesLabelModel.get("show")) return;
		stations.forEach((station) => {
			const labelPoint = getLabelPoint(station.x, station.y, station.labelPosition, station.radius + 7);
			const text = formatStationLabel(seriesLabelModel.get("formatter"), station);
			const labelEl = new echartsInstance.graphic.Text({
				style: {
					x: labelPoint.x,
					y: labelPoint.y,
					text,
					fill: seriesLabelModel.get("color") || "#111827",
					fontSize: seriesLabelModel.get("fontSize") || 11,
					fontWeight: seriesLabelModel.get("fontWeight") || 600,
					align: labelPoint.align,
					verticalAlign: labelPoint.verticalAlign
				},
				silent: true
			});
			applyFadeEnterAnimation(labelEl, readEnterAnimation(seriesModel, station.dataIndex));
			addMappedElements(stationElementsById, station.id, [labelEl]);
			group.add(labelEl);
		});
	}
	function drawRouteLabels(echartsInstance, group, seriesModel, routes, routeElementsById) {
		const routeLabelModel = seriesModel.getModel("routeLabel");
		if (!routeLabelModel.get("show")) return;
		routes.forEach((route, routeIndex) => {
			if (!route.points.length) return;
			const position = routeLabelModel.get("position") === "start" ? "start" : "end";
			const anchor = position === "start" ? route.points[0] : route.points[route.points.length - 1];
			const previous = position === "start" ? route.points[1] || anchor : route.points[route.points.length - 2] || anchor;
			const directionX = anchor.x - previous.x;
			const directionY = anchor.y - previous.y;
			const horizontal = Math.abs(directionX) >= Math.abs(directionY);
			const offset = route.lineWidth + 8;
			const labelPoint = horizontal ? {
				x: anchor.x + (directionX >= 0 ? offset : -offset),
				y: anchor.y,
				align: directionX >= 0 ? "left" : "right",
				verticalAlign: "middle"
			} : {
				x: anchor.x,
				y: anchor.y + (directionY >= 0 ? offset : -offset),
				align: "center",
				verticalAlign: directionY >= 0 ? "top" : "bottom"
			};
			const labelEl = new echartsInstance.graphic.Text({
				style: {
					x: labelPoint.x,
					y: labelPoint.y,
					text: formatRouteLabel(routeLabelModel.get("formatter"), route),
					fill: routeLabelModel.get("color") || route.color,
					fontSize: routeLabelModel.get("fontSize") || 12,
					fontWeight: routeLabelModel.get("fontWeight") || 700,
					align: labelPoint.align,
					verticalAlign: labelPoint.verticalAlign
				},
				silent: true
			});
			applyFadeEnterAnimation(labelEl, readEnterAnimation(seriesModel, routeIndex));
			addMappedElements(routeElementsById, route.id, [labelEl]);
			group.add(labelEl);
		});
	}
	function readRouteStyle(seriesModel, route) {
		const seriesStyle = asRecord(seriesModel.get("lineStyle"));
		const routeStyle = asRecord(asRecord(route.raw).lineStyle);
		return {
			stroke: routeStyle.color || route.color,
			lineWidth: finiteNumber(routeStyle.width ?? seriesStyle.width, route.lineWidth),
			opacity: finiteNumber(routeStyle.opacity ?? seriesStyle.opacity, 1),
			lineCap: routeStyle.cap || seriesStyle.cap || "round",
			lineJoin: routeStyle.join || seriesStyle.join || "round",
			fill: null
		};
	}
	function readRouteCornerRadius(seriesModel, route, routeStyle) {
		const seriesStyle = asRecord(seriesModel.get("lineStyle"));
		const rawRoute = asRecord(route.raw);
		const itemStyle = asRecord(rawRoute.lineStyle);
		return finiteNumber(rawRoute.cornerRadius ?? itemStyle.cornerRadius ?? seriesModel.get("cornerRadius") ?? seriesStyle.cornerRadius, finiteNumber(routeStyle.lineWidth, route.lineWidth) * 2);
	}
	function readStationStyle(seriesModel, itemModel, data, station, layout) {
		const normal = asRecord(seriesModel.get(station.interchange ? "interchangeStyle" : "stationStyle"));
		const itemStyle = asRecord(asRecord(station.raw).itemStyle);
		const itemModelStyle = itemModel ? asRecord(itemModel.get("itemStyle")) : {};
		const visualStyle = station.dataIndex >= 0 && station.dataIndex < data.count() ? asRecord(data.getItemVisual(station.dataIndex, "style")) : {};
		const firstRoute = layout.routes.find((route) => station.lines.includes(route.id));
		return {
			fill: itemStyle.color || itemModelStyle.color || normal.color || visualStyle.fill || "#ffffff",
			stroke: itemStyle.borderColor || itemModelStyle.borderColor || normal.borderColor || firstRoute?.color || "#111827",
			lineWidth: finiteNumber(itemStyle.borderWidth ?? itemModelStyle.borderWidth ?? normal.borderWidth, station.interchange ? 3 : 2),
			opacity: finiteNumber(itemStyle.opacity ?? itemModelStyle.opacity ?? normal.opacity, 1)
		};
	}
	function getLabelPoint(x, y, position, offset) {
		if (position === "top") return {
			x,
			y: y - offset,
			align: "center",
			verticalAlign: "bottom"
		};
		if (position === "bottom") return {
			x,
			y: y + offset,
			align: "center",
			verticalAlign: "top"
		};
		if (position === "left") return {
			x: x - offset,
			y,
			align: "right",
			verticalAlign: "middle"
		};
		return {
			x: x + offset,
			y,
			align: "left",
			verticalAlign: "middle"
		};
	}
	function formatStationLabel(formatter, station) {
		const params = {
			data: station.raw,
			name: station.name,
			lines: station.lines,
			interchange: station.interchange
		};
		if (typeof formatter === "function") return formatter(params);
		if (typeof formatter === "string") return formatter.replace(/\{b\}/g, station.name).replace(/\{line\}/g, station.lines.join("/"));
		return station.name;
	}
	function formatRouteLabel(formatter, route) {
		const params = {
			data: route.raw,
			name: route.name,
			color: route.color
		};
		if (typeof formatter === "function") return formatter(params);
		if (typeof formatter === "string") return formatter.replace(/\{b\}/g, route.name).replace(/\{color\}/g, route.color);
		return route.name;
	}
	function createSubwayHoverItems(layout, routeElementsById, stationElementsById) {
		const hoverItems = [];
		layout.routes.forEach((route) => {
			const routeElements = routeElementsById.get(route.id) || [];
			const stationElements = route.stationIds.flatMap((stationId) => stationElementsById.get(stationId) || []);
			const elements = uniqueGraphicElements([...routeElements, ...stationElements]);
			if (routeElements.length && elements.length) hoverItems.push({
				elements,
				triggerElements: uniqueGraphicElements(routeElements)
			});
		});
		layout.stations.forEach((station) => {
			const stationElements = stationElementsById.get(station.id) || [];
			if (!stationElements.length) return;
			const relatedRouteIds = new Set(station.lines);
			const routeElements = station.lines.flatMap((routeId) => routeElementsById.get(routeId) || []);
			const relatedStationElements = layout.stations.filter((candidate) => candidate.lines.some((routeId) => relatedRouteIds.has(routeId))).flatMap((candidate) => stationElementsById.get(candidate.id) || []);
			hoverItems.push({
				elements: uniqueGraphicElements([
					...stationElements,
					...routeElements,
					...relatedStationElements
				]),
				triggerElements: uniqueGraphicElements(stationElements)
			});
		});
		return hoverItems;
	}
	function addMappedElements(map, key, elements) {
		if (!elements.length) return;
		const current = map.get(key) || [];
		current.push(...elements);
		map.set(key, current);
	}
	function uniqueGraphicElements(elements) {
		const unique = [];
		const seen = /* @__PURE__ */ new Set();
		elements.forEach((element) => {
			if (!element || seen.has(element)) return;
			seen.add(element);
			unique.push(element);
		});
		return unique;
	}
	function readEnterAnimation(seriesModel, itemIndex, animationOption = seriesModel.get("enterAnimation")) {
		if (seriesModel.get("animation") === false || animationOption === false) return disabledEnterAnimation();
		const option = animationOption == null || animationOption === true ? {} : asRecord(animationOption);
		if (option.show === false || option.enabled === false) return disabledEnterAnimation();
		const baseDelay = resolveAnimationNumber(option.delay ?? seriesModel.get("animationDelay"), itemIndex, itemIndex, 0);
		const stagger = resolveAnimationNumber(option.stagger, itemIndex, itemIndex, 45);
		return {
			enabled: true,
			duration: resolveAnimationNumber(option.duration ?? seriesModel.get("animationDuration"), itemIndex, itemIndex, 640),
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
	function finiteNumber(value, fallback) {
		return typeof value === "number" && Number.isFinite(value) ? value : fallback;
	}
	function asRecord(value) {
		return value != null && typeof value === "object" && !Array.isArray(value) ? value : {};
	}
	//#endregion
});

//# sourceMappingURL=echarts-subway.js.map