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
	var DEFAULT_PADDING = 18;
	var DEFAULT_ARROW_HEAD_ANGLE = Math.PI / 7;
	function resolveVectorFieldLayout(option = {}) {
		const layoutOptions = isPlainObject(option.layout) ? option.layout : {};
		const nestedOptions = isPlainObject(option.layoutOptions) ? option.layoutOptions : {};
		return layoutVectorField(option.data, {
			...layoutOptions,
			...nestedOptions,
			width: finiteNumber$1(option.width, void 0),
			height: finiteNumber$1(option.height, void 0),
			padding: finiteNumber$1(option.padding, void 0),
			xExtent: readExtent(option.xExtent) ?? readExtent(nestedOptions.xExtent) ?? readExtent(layoutOptions.xExtent),
			yExtent: readExtent(option.yExtent) ?? readExtent(nestedOptions.yExtent) ?? readExtent(layoutOptions.yExtent),
			xField: readString(option.xField) ?? readString(nestedOptions.xField) ?? readString(layoutOptions.xField),
			yField: readString(option.yField) ?? readString(nestedOptions.yField) ?? readString(layoutOptions.yField),
			uField: readString(option.uField) ?? readString(nestedOptions.uField) ?? readString(layoutOptions.uField),
			vField: readString(option.vField) ?? readString(nestedOptions.vField) ?? readString(layoutOptions.vField),
			invertY: readBoolean(option.invertY) ?? readBoolean(nestedOptions.invertY) ?? readBoolean(layoutOptions.invertY),
			samplingStep: finiteNumber$1(option.samplingStep, void 0) ?? finiteNumber$1(nestedOptions.samplingStep, void 0) ?? finiteNumber$1(layoutOptions.samplingStep, void 0),
			minLength: finiteNumber$1(option.minLength, void 0) ?? finiteNumber$1(nestedOptions.minLength, void 0) ?? finiteNumber$1(layoutOptions.minLength, void 0),
			maxLength: finiteNumber$1(option.maxLength, void 0) ?? finiteNumber$1(nestedOptions.maxLength, void 0) ?? finiteNumber$1(layoutOptions.maxLength, void 0),
			lengthScale: finiteNumber$1(option.lengthScale, void 0) ?? finiteNumber$1(nestedOptions.lengthScale, void 0) ?? finiteNumber$1(layoutOptions.lengthScale, void 0),
			arrowHeadLength: finiteNumber$1(option.arrowHeadLength, void 0) ?? finiteNumber$1(nestedOptions.arrowHeadLength, void 0) ?? finiteNumber$1(layoutOptions.arrowHeadLength, void 0),
			arrowHeadAngle: finiteNumber$1(option.arrowHeadAngle, void 0) ?? finiteNumber$1(nestedOptions.arrowHeadAngle, void 0) ?? finiteNumber$1(layoutOptions.arrowHeadAngle, void 0)
		});
	}
	function layoutVectorField(data, options = {}) {
		const width = finiteNumber$1(options.width, DEFAULT_WIDTH);
		const height = finiteNumber$1(options.height, DEFAULT_HEIGHT);
		const padding = Math.max(0, finiteNumber$1(options.padding, DEFAULT_PADDING));
		const invertY = options.invertY !== false;
		const points = samplePoints(normalizeVectorFieldData(data, options), Math.max(1, Math.floor(finiteNumber$1(options.samplingStep, 1))));
		const xExtent = normalizeExtent(options.xExtent ?? extent(points.map((point) => point.x)));
		const yExtent = normalizeExtent(options.yExtent ?? extent(points.map((point) => point.y)));
		const innerWidth = Math.max(width - padding * 2, 1);
		const innerHeight = Math.max(height - padding * 2, 1);
		const maxMagnitude = points.reduce((max, point) => Math.max(max, point.magnitude), 0);
		const inferredMaxLength = inferDefaultMaxLength(points, xExtent, yExtent, innerWidth, innerHeight);
		const maxLength = Math.max(0, finiteNumber$1(options.maxLength, inferredMaxLength));
		const minLength = Math.max(0, finiteNumber$1(options.minLength, 0));
		const lengthScale = finiteNumber$1(options.lengthScale, maxMagnitude > 0 ? maxLength / maxMagnitude : 0);
		const arrowHeadAngle = finiteNumber$1(options.arrowHeadAngle, DEFAULT_ARROW_HEAD_ANGLE);
		const defaultHeadLength = Math.max(2, Math.min(7, maxLength * .38));
		const arrowHeadLength = Math.max(0, finiteNumber$1(options.arrowHeadLength, defaultHeadLength));
		return {
			width,
			height,
			padding,
			xExtent,
			yExtent,
			invertY,
			maxMagnitude,
			items: points.map((point) => {
				const x = mapLinear(point.x, xExtent, padding, padding + innerWidth);
				const y = mapLinear(point.y, yExtent, invertY ? padding + innerHeight : padding, invertY ? padding : padding + innerHeight);
				const screenU = point.u;
				const screenV = invertY ? -point.v : point.v;
				const angle = Math.atan2(screenV, screenU);
				const rawLength = point.magnitude * lengthScale;
				const length = point.magnitude > 0 ? clamp(rawLength, minLength, maxLength) : 0;
				const unitX = point.magnitude > 0 ? screenU / point.magnitude : 0;
				const unitY = point.magnitude > 0 ? screenV / point.magnitude : 0;
				const dx = unitX * length;
				const dy = unitY * length;
				const startX = x - dx / 2;
				const startY = y - dy / 2;
				const endX = x + dx / 2;
				const endY = y + dy / 2;
				const headLength = Math.min(arrowHeadLength, length * .5);
				const leftAngle = angle + Math.PI - arrowHeadAngle;
				const rightAngle = angle + Math.PI + arrowHeadAngle;
				return {
					...point,
					x,
					y,
					screenU,
					screenV,
					angle,
					length,
					startX,
					startY,
					endX,
					endY,
					headLeftX: endX + Math.cos(leftAngle) * headLength,
					headLeftY: endY + Math.sin(leftAngle) * headLength,
					headRightX: endX + Math.cos(rightAngle) * headLength,
					headRightY: endY + Math.sin(rightAngle) * headLength
				};
			})
		};
	}
	function normalizeVectorFieldData(data, options = {}) {
		if (!Array.isArray(data)) return [];
		const points = [];
		data.forEach((raw, dataIndex) => {
			const record = isPlainObject(raw) ? raw : null;
			const tuple = Array.isArray(raw) ? raw : null;
			const x = tuple ? readNumber(tuple[0]) : readNumberFromRecord(record, options.xField, [
				"x",
				"longitude",
				"lng",
				"lon"
			]);
			const y = tuple ? readNumber(tuple[1]) : readNumberFromRecord(record, options.yField, [
				"y",
				"latitude",
				"lat"
			]);
			const u = tuple ? readNumber(tuple[2]) : readNumberFromRecord(record, options.uField, [
				"u",
				"dx",
				"vx"
			]);
			const v = tuple ? readNumber(tuple[3]) : readNumberFromRecord(record, options.vField, [
				"v",
				"dy",
				"vy"
			]);
			if (x == null || y == null || u == null || v == null) return;
			const magnitude = Math.hypot(u, v);
			points.push({
				dataIndex,
				x,
				y,
				u,
				v,
				coord: [x, y],
				magnitude,
				name: readName(raw, dataIndex),
				raw
			});
		});
		return points;
	}
	function samplePoints(points, samplingStep) {
		if (samplingStep <= 1) return points;
		return points.filter((point, index) => index % samplingStep === 0 || point.magnitude === 0);
	}
	function inferDefaultMaxLength(points, xExtent, yExtent, innerWidth, innerHeight) {
		const xStep = minPositiveStep(points.map((point) => point.x));
		const yStep = minPositiveStep(points.map((point) => point.y));
		const screenSteps = [xStep == null ? null : xStep / Math.max(xExtent[1] - xExtent[0], Number.EPSILON) * innerWidth, yStep == null ? null : yStep / Math.max(yExtent[1] - yExtent[0], Number.EPSILON) * innerHeight].filter((value) => value != null && Number.isFinite(value) && value > 0);
		if (screenSteps.length) return Math.max(4, Math.min(...screenSteps) * .78);
		return Math.max(6, Math.min(innerWidth, innerHeight) * .05);
	}
	function minPositiveStep(values) {
		const uniqueValues = Array.from(new Set(values.filter(Number.isFinite))).sort((left, right) => left - right);
		let step = Number.POSITIVE_INFINITY;
		for (let index = 1; index < uniqueValues.length; index += 1) {
			const delta = uniqueValues[index] - uniqueValues[index - 1];
			if (delta > 0 && delta < step) step = delta;
		}
		return Number.isFinite(step) ? step : null;
	}
	function extent(values) {
		const finiteValues = values.filter(Number.isFinite);
		if (!finiteValues.length) return [0, 1];
		return [Math.min(...finiteValues), Math.max(...finiteValues)];
	}
	function normalizeExtent(value) {
		const min = finiteNumber$1(value[0], 0);
		const max = finiteNumber$1(value[1], min + 1);
		if (max > min) return [min, max];
		const center = min;
		return [center - .5, center + .5];
	}
	function mapLinear(value, domain, rangeStart, rangeEnd) {
		return rangeStart + (value - domain[0]) / (domain[1] - domain[0]) * (rangeEnd - rangeStart);
	}
	function clamp(value, min, max) {
		return Math.max(min, Math.min(max, value));
	}
	function readExtent(value) {
		if (!Array.isArray(value) || value.length < 2) return void 0;
		const min = readNumber(value[0]);
		const max = readNumber(value[1]);
		return min == null || max == null ? void 0 : [min, max];
	}
	function readNumberFromRecord(record, preferredField, fallbackFields) {
		if (!record) return void 0;
		const fields = preferredField ? [preferredField, ...fallbackFields] : fallbackFields;
		for (const field of fields) {
			const value = readNumber(record[field]);
			if (value != null) return value;
		}
	}
	function readNumber(value) {
		const numeric = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
		return Number.isFinite(numeric) ? numeric : void 0;
	}
	function finiteNumber$1(value, fallback) {
		return typeof value === "number" && Number.isFinite(value) ? value : fallback;
	}
	function readBoolean(value) {
		return typeof value === "boolean" ? value : void 0;
	}
	function readString(value) {
		return typeof value === "string" && value ? value : void 0;
	}
	function readName(raw, dataIndex) {
		if (isPlainObject(raw)) {
			const value = raw.name ?? raw.id;
			if (typeof value === "string" || typeof value === "number") return String(value);
		}
		return `vector-${dataIndex}`;
	}
	function isPlainObject(value) {
		return typeof value === "object" && value !== null && !Array.isArray(value);
	}
	//#endregion
	//#region src/vector-field.ts
	var echartsHost = echarts_lib_echarts;
	var optionKeys = [
		"padding",
		"xExtent",
		"yExtent",
		"xField",
		"yField",
		"uField",
		"vField",
		"invertY",
		"samplingStep",
		"minLength",
		"maxLength",
		"lengthScale",
		"arrowHeadLength",
		"arrowHeadAngle"
	];
	echartsHost.extendSeriesModel({
		type: "series.vectorField",
		visualStyleAccessPath: "lineStyle",
		visualDrawType: "stroke",
		getInitialData(option) {
			const source = Array.isArray(option.data) ? option.data : [];
			const dimensions = echartsHost.helper.createDimensions(source, { coordDimensions: [
				"x",
				"y",
				"u",
				"v",
				"value"
			] });
			const list = new echartsHost.List(dimensions, this);
			list.initData(source);
			return list;
		},
		defaultOption: {
			left: "center",
			top: "center",
			width: "94%",
			height: "82%",
			padding: 18,
			xField: "longitude",
			yField: "latitude",
			uField: "u",
			vField: "v",
			invertY: true,
			samplingStep: 1,
			minLength: 0,
			maxLength: null,
			lengthScale: null,
			arrowHeadLength: null,
			arrowHeadAngle: null,
			enterAnimation: true,
			lineStyle: {
				color: "#2563eb",
				width: 1.15,
				opacity: .86
			},
			emphasis: { itemStyle: {
				opacity: 1,
				width: 1.8,
				shadowBlur: 6,
				shadowColor: "rgba(37, 99, 235, 0.28)"
			} },
			tooltip: { trigger: "item" }
		}
	});
	echartsHost.extendChartView({
		type: "vectorField",
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
				const layout = resolveVectorFieldLayout(readLayoutOption(seriesModel, rect));
				if (this.__renderToken !== renderToken) return;
				const { hoverItems } = renderAlive(this, echartsHost, group, seriesModel, (targetGroup, targetSeriesModel) => drawVectorField(echartsHost, targetGroup, targetSeriesModel, layout, rect));
				this.__hoverController = installElementHover(hoverItems, {
					dimOpacity: .2,
					zrender: api.getZr?.()
				});
			} catch (error) {
				if (typeof console !== "undefined") console.error("[vectorField] render failed", error);
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
	function drawVectorField(echartsInstance, group, seriesModel, layout, rect) {
		const data = seriesModel.getData();
		const chartGroup = new echartsInstance.graphic.Group();
		const hoverItems = [];
		chartGroup.x = rect.x;
		chartGroup.y = rect.y;
		layout.items.forEach((item, itemIndex) => {
			if (item.dataIndex < 0 || item.dataIndex >= data.count()) return;
			const itemModel = data.getItemModel(item.dataIndex);
			const element = createArrowElement(echartsInstance, item, resolveArrowStyle(data, seriesModel, itemModel, item.dataIndex, itemIndex));
			animateEnter(element, itemIndex, resolveEnterAnimation(seriesModel, itemIndex));
			data.setItemLayout(item.dataIndex, [item.x, item.y]);
			data.setItemGraphicEl(item.dataIndex, element);
			enableHover(element, itemModel);
			chartGroup.add(element);
			hoverItems.push({ elements: [element] });
		});
		group.add(chartGroup);
		return hoverItems;
	}
	function createArrowElement(echartsInstance, item, style) {
		const path = [
			`M ${formatPathNumber(item.startX)} ${formatPathNumber(item.startY)}`,
			`L ${formatPathNumber(item.endX)} ${formatPathNumber(item.endY)}`,
			`M ${formatPathNumber(item.headLeftX)} ${formatPathNumber(item.headLeftY)}`,
			`L ${formatPathNumber(item.endX)} ${formatPathNumber(item.endY)}`,
			`L ${formatPathNumber(item.headRightX)} ${formatPathNumber(item.headRightY)}`
		].join(" ");
		if (echartsInstance.graphic.makePath) {
			const element = echartsInstance.graphic.makePath(path, {
				style,
				silent: false
			});
			element.silent = false;
			return element;
		}
		return new echartsInstance.graphic.Line({
			shape: {
				x1: item.startX,
				y1: item.startY,
				x2: item.endX,
				y2: item.endY
			},
			style,
			silent: false
		});
	}
	function resolveArrowStyle(data, seriesModel, itemModel, dataIndex, itemIndex) {
		const normal = asRecord(seriesModel.get("lineStyle"));
		const itemLineStyle = asRecord(itemModel.get("lineStyle"));
		const itemStyle = asRecord(itemModel.get("itemStyle"));
		const visualStyle = asRecord(data.getItemVisual(dataIndex, "style"));
		return {
			stroke: itemLineStyle.color || itemStyle.color || normal.color || visualStyle.stroke || visualStyle.fill || DEFAULT_COLORS[itemIndex % DEFAULT_COLORS.length],
			fill: null,
			lineWidth: finiteNumber(itemLineStyle.width ?? itemStyle.width ?? normal.width, 1.15),
			opacity: finiteNumber(itemLineStyle.opacity ?? itemStyle.opacity ?? normal.opacity, .86),
			lineCap: "round",
			lineJoin: "round",
			shadowBlur: itemLineStyle.shadowBlur ?? itemStyle.shadowBlur ?? normal.shadowBlur,
			shadowColor: itemLineStyle.shadowColor ?? itemStyle.shadowColor ?? normal.shadowColor
		};
	}
	function resolveEnterAnimation(seriesModel, index) {
		if (seriesModel.get("animation") === false) return disabledAnimation();
		const raw = seriesModel.get("enterAnimation");
		if (raw === false) return disabledAnimation();
		const config = raw == null || raw === true ? {} : asRecord(raw);
		if (config.show === false || config.enabled === false) return disabledAnimation();
		return {
			enabled: true,
			duration: finiteNumber(config.duration ?? seriesModel.get("animationDuration"), 520),
			delay: resolveAnimationValue(config.delay ?? seriesModel.get("animationDelay"), index, 0) + index * finiteNumber(config.stagger, 0),
			easing: typeof (config.easing ?? seriesModel.get("animationEasing")) === "string" ? String(config.easing ?? seriesModel.get("animationEasing")) : "cubicOut"
		};
	}
	function animateEnter(element, itemIndex, animation) {
		if (!animation.enabled) return;
		const animatable = element;
		if (typeof animatable.animate !== "function") return;
		const style = animatable.style || {};
		const opacity = finiteNumber(style.opacity, 1);
		style.opacity = 0;
		animatable.style = style;
		const animator = animatable.animate("style");
		if (!animator) {
			style.opacity = opacity;
			return;
		}
		const frame = animator.when(animation.duration, { opacity });
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
	function formatPathNumber(value) {
		return Number(value.toFixed(3)).toString();
	}
	function asRecord(value) {
		return typeof value === "object" && value !== null && !Array.isArray(value) ? value : {};
	}
	function finiteNumber(value, fallback) {
		return typeof value === "number" && Number.isFinite(value) ? value : fallback;
	}
	var DEFAULT_COLORS = [
		"#2563eb",
		"#0f9f88",
		"#d97706",
		"#7c3aed",
		"#dc2626",
		"#0891b2"
	];
	//#endregion
});

//# sourceMappingURL=echarts-vector-field.js.map