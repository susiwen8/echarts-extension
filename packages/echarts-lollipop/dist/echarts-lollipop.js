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
	var DEFAULT_HEIGHT = 460;
	var DEFAULT_PADDING = 48;
	var DEFAULT_TICK_COUNT = 5;
	var EPSILON = 1e-9;
	function resolveLollipopLayout(option = {}) {
		const layout = isPlainObject(option.layout) ? option.layout : {};
		const layoutOptions = isPlainObject(option.layoutOptions) ? option.layoutOptions : {};
		const merged = {
			...layout,
			...layoutOptions,
			width: finiteNumber$1(option.width, finiteNumber$1(layoutOptions.width, finiteNumber$1(layout.width, DEFAULT_WIDTH))),
			height: finiteNumber$1(option.height, finiteNumber$1(layoutOptions.height, finiteNumber$1(layout.height, DEFAULT_HEIGHT))),
			padding: readPaddingOption(option.padding ?? layoutOptions.padding ?? layout.padding),
			categoryField: readFieldOption(option.categoryField ?? layoutOptions.categoryField ?? layout.categoryField),
			valueField: readFieldOption(option.valueField ?? layoutOptions.valueField ?? layout.valueField),
			nameField: readFieldOption(option.nameField ?? layoutOptions.nameField ?? layout.nameField),
			dimensions: normalizeDimensions(option.dimensions ?? layoutOptions.dimensions ?? layout.dimensions),
			categories: normalizeCategories(option.categories ?? layoutOptions.categories ?? layout.categories),
			min: finiteNumber$1(option.min, finiteNumber$1(layoutOptions.min, finiteNumber$1(layout.min, void 0))),
			max: finiteNumber$1(option.max, finiteNumber$1(layoutOptions.max, finiteNumber$1(layout.max, void 0))),
			baseline: finiteNumber$1(option.baseline, finiteNumber$1(layoutOptions.baseline, finiteNumber$1(layout.baseline, void 0))),
			tickCount: finiteNumber$1(option.tickCount, finiteNumber$1(layoutOptions.tickCount, finiteNumber$1(layout.tickCount, void 0))),
			nice: firstBoolean(option.nice, layoutOptions.nice, layout.nice)
		};
		return layoutLollipop(Array.isArray(option.data) ? option.data : [], merged);
	}
	function layoutLollipop(data, options = {}) {
		const width = Math.max(1, finiteNumber$1(options.width, DEFAULT_WIDTH));
		const height = Math.max(1, finiteNumber$1(options.height, DEFAULT_HEIGHT));
		const padding = normalizePadding(options.padding);
		const plot = createPlotRect(width, height, padding);
		const baseline = finiteNumber$1(options.baseline, 0);
		const normalized = normalizeItems(data, options);
		const categories = resolveCategories(normalized, options);
		const ordered = orderByCategory(normalized, categories);
		const valueExtent = resolveValueExtent(ordered, options, baseline);
		const tickCount = Math.max(2, Math.round(finiteNumber$1(options.tickCount, DEFAULT_TICK_COUNT)));
		const ticks = createTicks(valueExtent.min, valueExtent.max, tickCount).map((value) => ({
			value,
			x1: plot.left,
			x2: plot.right,
			y: projectValue(value, valueExtent, plot)
		}));
		const baselineY = projectValue(clamp(baseline, valueExtent.min, valueExtent.max), valueExtent, plot);
		return {
			width,
			height,
			padding,
			plot,
			categories,
			valueExtent,
			baseline,
			baselineY,
			ticks,
			categoryLabels: categories.map((category, index) => ({
				name: category,
				value: category,
				x: projectCategory(index, categories.length, plot),
				y: plot.bottom + 14,
				align: "right",
				verticalAlign: "middle"
			})),
			points: ordered.map((item) => {
				const x = projectCategory(Math.max(0, categories.indexOf(item.category)), categories.length, plot);
				const y = projectValue(item.value, valueExtent, plot);
				return {
					id: item.id,
					name: item.name,
					category: item.category,
					categoryValue: item.categoryValue,
					value: item.value,
					x,
					y,
					baseX: x,
					baseY: baselineY,
					dataIndex: item.dataIndex,
					raw: item.raw
				};
			})
		};
	}
	function normalizeItems(data, options) {
		const dimensions = normalizeDimensions(options.dimensions);
		const normalized = [];
		data.forEach((item, dataIndex) => {
			const categoryValue = readField(item, options.categoryField ?? "category", dimensions, 0, [
				"name",
				"country",
				"label"
			]);
			const value = finiteNumber$1(readField(item, options.valueField ?? "value", dimensions, 1, [
				"population",
				"amount",
				"count",
				"users",
				"total"
			]), NaN);
			if (!Number.isFinite(value)) return;
			const nameValue = readField(item, options.nameField ?? "name", dimensions, -1, []);
			const category = stringifyName(categoryValue ?? nameValue ?? `item-${dataIndex}`);
			const name = stringifyName(nameValue ?? category);
			const record = isPlainObject(item) ? item : {};
			normalized.push({
				id: stringifyName(record.id ?? `${category}-${dataIndex}`),
				name,
				category,
				categoryValue,
				value,
				dataIndex,
				raw: item
			});
		});
		return normalized;
	}
	function resolveCategories(items, options) {
		const explicit = normalizeCategories(options.categories);
		if (explicit.length) return explicit.filter((category) => items.some((item) => item.category === category));
		return unique(items.map((item) => item.category));
	}
	function orderByCategory(items, categories) {
		const order = new Map(categories.map((category, index) => [category, index]));
		return items.filter((item) => order.has(item.category)).sort((left, right) => {
			return (order.get(left.category) ?? Number.MAX_SAFE_INTEGER) - (order.get(right.category) ?? Number.MAX_SAFE_INTEGER) || left.dataIndex - right.dataIndex;
		});
	}
	function resolveValueExtent(items, options, baseline) {
		const values = items.map((item) => item.value).filter(Number.isFinite);
		values.push(baseline);
		let min = finiteNumber$1(options.min, values.length ? Math.min(...values) : 0);
		let max = finiteNumber$1(options.max, values.length ? Math.max(...values) : 1);
		if (Math.abs(max - min) < EPSILON) {
			min -= 1;
			max += 1;
		}
		if (options.nice !== false && (options.min == null || options.max == null)) {
			const nice = niceExtent(min, max, Math.max(2, Math.round(finiteNumber$1(options.tickCount, DEFAULT_TICK_COUNT))));
			if (options.min == null) min = nice.min;
			if (options.max == null) max = nice.max;
		}
		if (max < min) [min, max] = [max, min];
		if (Math.abs(max - min) < EPSILON) max = min + 1;
		return {
			min,
			max
		};
	}
	function createTicks(min, max, tickCount) {
		if (tickCount <= 1) return [cleanNumber(min), cleanNumber(max)];
		const step = (max - min) / (tickCount - 1);
		return Array.from({ length: tickCount }, (_, index) => cleanNumber(index === tickCount - 1 ? max : min + step * index));
	}
	function projectCategory(index, count, plot) {
		if (count <= 1) return plot.left + plot.width / 2;
		return plot.left + plot.width * (index / (count - 1));
	}
	function projectValue(value, extent, plot) {
		const ratio = (value - extent.min) / Math.max(extent.max - extent.min, EPSILON);
		return plot.bottom - clamp(ratio, 0, 1) * plot.height;
	}
	function createPlotRect(width, height, padding) {
		const left = clamp(padding.left, 0, Math.max(width - 1, 0));
		const top = clamp(padding.top, 0, Math.max(height - 1, 0));
		const right = Math.max(left + 1, width - Math.max(0, padding.right));
		const bottom = Math.max(top + 1, height - Math.max(0, padding.bottom));
		return {
			left,
			top,
			right,
			bottom,
			width: Math.max(1, right - left),
			height: Math.max(1, bottom - top)
		};
	}
	function normalizePadding(value) {
		if (typeof value === "number" && Number.isFinite(value)) {
			const padding = Math.max(0, value);
			return {
				top: padding,
				right: padding,
				bottom: padding,
				left: padding
			};
		}
		if (isPlainObject(value)) return {
			top: Math.max(0, finiteNumber$1(value.top, DEFAULT_PADDING)),
			right: Math.max(0, finiteNumber$1(value.right, DEFAULT_PADDING)),
			bottom: Math.max(0, finiteNumber$1(value.bottom, DEFAULT_PADDING)),
			left: Math.max(0, finiteNumber$1(value.left, DEFAULT_PADDING))
		};
		return {
			top: DEFAULT_PADDING,
			right: DEFAULT_PADDING,
			bottom: DEFAULT_PADDING,
			left: DEFAULT_PADDING
		};
	}
	function readPaddingOption(value) {
		if (typeof value === "number" && Number.isFinite(value)) return value;
		if (isPlainObject(value)) return {
			top: finiteNumber$1(value.top, void 0),
			right: finiteNumber$1(value.right, void 0),
			bottom: finiteNumber$1(value.bottom, void 0),
			left: finiteNumber$1(value.left, void 0)
		};
	}
	function readField(item, field, dimensions, fallbackIndex, fallbackNames) {
		if (Array.isArray(item)) {
			const index = typeof field === "number" ? field : dimensions?.indexOf(field);
			const resolvedIndex = index != null && index >= 0 ? index : fallbackIndex;
			return resolvedIndex >= 0 ? item[resolvedIndex] : void 0;
		}
		if (!isPlainObject(item)) return void 0;
		if (typeof field === "string" && item[field] != null) return item[field];
		if (typeof field === "number") return void 0;
		for (const fallbackName of fallbackNames) if (item[fallbackName] != null) return item[fallbackName];
	}
	function niceExtent(min, max, tickCount) {
		const step = niceStep(Math.max(max - min, EPSILON) / Math.max(1, tickCount - 1));
		return {
			min: Math.floor(min / step) * step,
			max: Math.ceil(max / step) * step
		};
	}
	function niceStep(rawStep) {
		const power = 10 ** Math.floor(Math.log10(Math.max(rawStep, EPSILON)));
		const fraction = rawStep / power;
		let niceFraction = 10;
		if (fraction <= 1) niceFraction = 1;
		else if (fraction <= 2) niceFraction = 2;
		else if (fraction <= 5) niceFraction = 5;
		return niceFraction * power;
	}
	function normalizeDimensions(value) {
		return Array.isArray(value) ? value.filter((item) => typeof item === "string") : void 0;
	}
	function normalizeCategories(value) {
		return Array.isArray(value) ? value.map((item) => stringifyName(item)) : [];
	}
	function readFieldOption(value) {
		return typeof value === "string" || typeof value === "number" ? value : void 0;
	}
	function firstBoolean(...values) {
		return values.find((value) => typeof value === "boolean");
	}
	function unique(values) {
		const result = [];
		const seen = /* @__PURE__ */ new Set();
		values.forEach((value) => {
			if (seen.has(value)) return;
			seen.add(value);
			result.push(value);
		});
		return result;
	}
	function stringifyName(value) {
		if (typeof value === "string" && value.length) return value;
		if (typeof value === "number" && Number.isFinite(value)) return String(value);
		return "";
	}
	function finiteNumber$1(value, fallback) {
		if (typeof value === "number" && Number.isFinite(value)) return value;
		if (typeof value === "string" && value.trim()) {
			const parsed = Number(value);
			if (Number.isFinite(parsed)) return parsed;
		}
		return fallback;
	}
	function cleanNumber(value) {
		const rounded = Number(value.toFixed(12));
		return Object.is(rounded, -0) ? 0 : rounded;
	}
	function clamp(value, min, max) {
		return Math.max(min, Math.min(max, value));
	}
	function isPlainObject(value) {
		return value != null && typeof value === "object" && !Array.isArray(value);
	}
	//#endregion
	//#region src/lollipop.ts
	var echartsHost = echarts_lib_echarts;
	var optionKeys = [
		"padding",
		"categoryField",
		"valueField",
		"nameField",
		"dimensions",
		"categories",
		"min",
		"max",
		"baseline",
		"tickCount",
		"nice"
	];
	var layerZ = {
		axis: 0,
		stem: 4,
		hit: 7,
		symbol: 8,
		label: 9
	};
	echartsHost.extendSeriesModel({
		type: "series.lollipop",
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
			padding: {
				top: 36,
				right: 28,
				bottom: 78,
				left: 78
			},
			categoryField: "category",
			valueField: "value",
			nameField: null,
			dimensions: null,
			categories: null,
			min: null,
			max: null,
			baseline: 0,
			tickCount: 5,
			nice: true,
			large: false,
			symbolSize: 12,
			enterAnimation: true,
			grid: { show: true },
			valueAxis: {
				show: true,
				name: null,
				label: {
					show: true,
					color: "#c8c9cf",
					fontSize: 14,
					fontWeight: 500,
					formatter: "{value}"
				},
				splitLine: {
					show: true,
					lineStyle: {
						color: "#2f3033",
						width: 1,
						opacity: 1,
						type: "solid"
					}
				},
				axisLine: {
					show: true,
					lineStyle: {
						color: "#e5e7eb",
						width: 1.2,
						opacity: 1
					}
				},
				nameTextStyle: {
					color: "#aeb0b5",
					fontSize: 14,
					fontWeight: 600
				}
			},
			categoryAxis: {
				show: true,
				label: {
					show: true,
					color: "#d4d4d8",
					fontSize: 14,
					fontWeight: 500,
					rotate: 45,
					formatter: "{value}"
				}
			},
			stemStyle: {
				color: "#28aefc",
				width: 1.4,
				opacity: .95,
				type: "solid"
			},
			itemStyle: {
				color: "#2db5ff",
				borderColor: "#2db5ff",
				borderWidth: 0,
				opacity: 1
			},
			label: {
				show: false,
				color: "#d4d4d8",
				fontSize: 12,
				fontWeight: 600,
				formatter: "{c}"
			},
			tooltip: { trigger: "item" },
			emphasis: { itemStyle: {
				borderWidth: 2,
				shadowBlur: 8,
				shadowColor: "rgba(45, 181, 255, 0.32)"
			} }
		}
	});
	echartsHost.extendChartView({
		type: "lollipop",
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
				const layout = resolveLollipopLayout(readLayoutOption(seriesModel, rect));
				if (this.__renderToken !== renderToken) return;
				const { hoverItems } = renderAlive(this, echartsHost, group, seriesModel, (targetGroup, targetSeriesModel) => drawLollipop(echartsHost, targetGroup, targetSeriesModel, layout, rect));
				this.__hoverController = installElementHover(hoverItems, { zrender: api.getZr?.() });
			} catch (error) {
				if (typeof console !== "undefined") console.error("[lollipop] render failed", error);
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
	function drawLollipop(echartsInstance, group, seriesModel, layout, rect) {
		const chartGroup = new echartsInstance.graphic.Group();
		chartGroup.x = rect.x;
		chartGroup.y = rect.y;
		drawAxes(echartsInstance, chartGroup, seriesModel, layout);
		const hoverItems = drawPoints(echartsInstance, chartGroup, seriesModel, layout, rect);
		group.add(chartGroup);
		return hoverItems;
	}
	function drawAxes(echartsInstance, group, seriesModel, layout) {
		const valueAxisModel = seriesModel.getModel("valueAxis");
		const categoryAxisModel = seriesModel.getModel("categoryAxis");
		const valueAxisVisible = valueAxisModel.get("show") !== false;
		const categoryAxisVisible = categoryAxisModel.get("show") !== false;
		if (seriesModel.getModel("grid").get("show") !== false && valueAxisVisible) {
			const splitLineModel = valueAxisModel.getModel("splitLine");
			if (splitLineModel.get("show") !== false) {
				const style = readLineStyle(splitLineModel.getModel("lineStyle"), {
					stroke: "#2f3033",
					lineWidth: 1,
					opacity: 1
				});
				layout.ticks.forEach((tick) => {
					group.add(new echartsInstance.graphic.Line({
						shape: {
							x1: tick.x1,
							y1: tick.y,
							x2: tick.x2,
							y2: tick.y
						},
						style,
						silent: true,
						z2: layerZ.axis
					}));
				});
			}
			const axisLineModel = valueAxisModel.getModel("axisLine");
			if (axisLineModel.get("show") !== false) group.add(new echartsInstance.graphic.Line({
				shape: {
					x1: layout.plot.left,
					y1: layout.baselineY,
					x2: layout.plot.right,
					y2: layout.baselineY
				},
				style: readLineStyle(axisLineModel.getModel("lineStyle"), {
					stroke: "#e5e7eb",
					lineWidth: 1.2,
					opacity: 1
				}),
				silent: true,
				z2: layerZ.axis
			}));
		}
		if (valueAxisVisible) drawValueAxisLabels(echartsInstance, group, valueAxisModel, layout);
		if (categoryAxisVisible) drawCategoryAxisLabels(echartsInstance, group, categoryAxisModel, layout);
	}
	function drawValueAxisLabels(echartsInstance, group, axisModel, layout) {
		const labelModel = axisModel.getModel("label");
		if (labelModel.get("show") === false) return;
		const fontSize = finiteNumber(labelModel.get("fontSize"), 14);
		layout.ticks.forEach((tick) => {
			group.add(new echartsInstance.graphic.Text({
				style: {
					x: layout.plot.left - 12,
					y: tick.y,
					text: formatAxisLabel(labelModel.get("formatter"), tick.value),
					fill: labelModel.get("color") || "#c8c9cf",
					fontSize,
					fontWeight: labelModel.get("fontWeight") || 500,
					align: "right",
					verticalAlign: "middle"
				},
				silent: true,
				z2: layerZ.axis
			}));
		});
		const axisName = axisModel.get("name");
		if (typeof axisName !== "string" || !axisName) return;
		const nameStyle = asRecord(axisModel.get("nameTextStyle"));
		group.add(new echartsInstance.graphic.Text({
			style: {
				x: Math.max(16, layout.plot.left - 58),
				y: layout.plot.top + layout.plot.height / 2,
				text: axisName,
				fill: nameStyle.color || "#aeb0b5",
				fontSize: finiteNumber(nameStyle.fontSize, 14),
				fontWeight: nameStyle.fontWeight || 600,
				align: "center",
				verticalAlign: "middle"
			},
			rotation: -Math.PI / 2,
			originX: Math.max(16, layout.plot.left - 58),
			originY: layout.plot.top + layout.plot.height / 2,
			silent: true,
			z2: layerZ.axis
		}));
	}
	function drawCategoryAxisLabels(echartsInstance, group, axisModel, layout) {
		const labelModel = axisModel.getModel("label");
		if (labelModel.get("show") === false) return;
		const rotateDegrees = finiteNumber(labelModel.get("rotate"), 0);
		const rotation = rotateDegrees * Math.PI / 180;
		const fontSize = finiteNumber(labelModel.get("fontSize"), 14);
		layout.categoryLabels.forEach((label) => {
			group.add(new echartsInstance.graphic.Text({
				style: {
					x: label.x,
					y: label.y,
					text: formatAxisLabel(labelModel.get("formatter"), label.name),
					fill: labelModel.get("color") || "#d4d4d8",
					fontSize,
					fontWeight: labelModel.get("fontWeight") || 500,
					align: rotateDegrees ? "right" : "center",
					verticalAlign: rotateDegrees ? "middle" : "top"
				},
				rotation,
				originX: label.x,
				originY: label.y,
				silent: true,
				z2: layerZ.axis
			}));
		});
	}
	function drawPoints(echartsInstance, group, seriesModel, layout, rect) {
		const data = seriesModel.getData();
		const symbolSize = Math.max(0, finiteNumber(seriesModel.get("symbolSize"), 12));
		const silent = seriesModel.get("silent") === true;
		const mergedStems = silent && seriesModel.get("large") === true && drawMergedStems(echartsInstance, group, seriesModel, layout.points);
		const hoverItems = [];
		const hoverItemsByDataIndex = /* @__PURE__ */ new Map();
		layout.points.forEach((point, pointIndex) => {
			if (point.dataIndex < 0 || point.dataIndex >= data.count()) return;
			let itemModel;
			const readItemModel = () => {
				itemModel = itemModel || data.getItemModel(point.dataIndex);
				return itemModel;
			};
			const animation = readEnterAnimation(seriesModel, pointIndex);
			let stem = null;
			if (!mergedStems) {
				stem = new echartsInstance.graphic.Line({
					shape: {
						x1: point.baseX,
						y1: point.baseY,
						x2: point.x,
						y2: point.y
					},
					style: readStemStyle(seriesModel, readItemModel()),
					z2: layerZ.stem
				});
				applyStemEnterAnimation(stem, point, animation);
				stem.silent = silent;
				group.add(stem);
			}
			data.setItemLayout(point.dataIndex, [point.x + rect.x, point.y + rect.y]);
			let symbol = null;
			if (symbolSize > 0) {
				symbol = new echartsInstance.graphic.Circle({
					shape: {
						cx: point.x,
						cy: point.y,
						r: symbolSize / 2
					},
					style: readPointStyle(data, seriesModel, readItemModel(), point),
					z2: layerZ.symbol
				});
				applyCircleEnterAnimation(symbol, symbolSize / 2, animation);
				symbol.silent = silent;
				if (silent) data.setItemGraphicEl(point.dataIndex, symbol);
				group.add(symbol);
			}
			if (silent) return;
			const hitCircle = new echartsInstance.graphic.Circle({
				shape: {
					cx: point.x,
					cy: point.y,
					r: Math.max(symbolSize / 2, 8)
				},
				style: {
					fill: "rgba(0,0,0,0)",
					stroke: "rgba(0,0,0,0)",
					opacity: 0
				},
				z2: layerZ.hit
			});
			data.setItemGraphicEl(point.dataIndex, hitCircle);
			group.add(hitCircle);
			const hoverItem = {
				elements: [stem, symbol].filter(Boolean),
				triggerElements: [
					hitCircle,
					stem,
					symbol
				].filter(Boolean)
			};
			hoverItems.push(hoverItem);
			hoverItemsByDataIndex.set(point.dataIndex, hoverItem);
		});
		drawPointLabels(echartsInstance, group, seriesModel, layout.points, hoverItemsByDataIndex);
		return hoverItems;
	}
	function drawMergedStems(echartsInstance, group, seriesModel, points) {
		if (!echartsInstance.graphic.makePath) return false;
		const path = points.filter((point) => point.dataIndex >= 0).map((point) => `M${pathNumber(point.baseX)} ${pathNumber(point.baseY)}L${pathNumber(point.x)} ${pathNumber(point.y)}`).join("");
		if (!path) return false;
		const stems = echartsInstance.graphic.makePath(path, {
			style: {
				...readLineStyle(seriesModel.getModel("stemStyle"), {
					stroke: "#28aefc",
					lineWidth: 1.4,
					opacity: .95
				}),
				fill: null
			},
			silent: true,
			z2: layerZ.stem
		});
		group.add(stems);
		return true;
	}
	function drawPointLabels(echartsInstance, group, seriesModel, points, hoverItemsByDataIndex) {
		const seriesLabelModel = seriesModel.getModel("label");
		if (seriesLabelModel.get("show") !== true) return;
		points.forEach((point) => {
			const itemLabelModel = seriesModel.getData().getItemModel(point.dataIndex).getModel("label");
			if ((itemLabelModel.get("show") ?? seriesLabelModel.get("show")) === false) return;
			const text = formatLabel(itemLabelModel.get("formatter") || seriesLabelModel.get("formatter"), point);
			const dy = point.y <= point.baseY ? -10 : 10;
			const label = new echartsInstance.graphic.Text({
				style: {
					x: point.x,
					y: point.y + dy,
					text: String(text),
					fill: itemLabelModel.get("color") || seriesLabelModel.get("color") || "#d4d4d8",
					fontSize: finiteNumber(itemLabelModel.get("fontSize"), finiteNumber(seriesLabelModel.get("fontSize"), 12)),
					fontWeight: itemLabelModel.get("fontWeight") || seriesLabelModel.get("fontWeight") || 600,
					align: "center",
					verticalAlign: dy < 0 ? "bottom" : "top"
				},
				silent: true,
				z2: layerZ.label
			});
			applyFadeEnterAnimation(label, readEnterAnimation(seriesModel, point.dataIndex));
			addHoverElement(hoverItemsByDataIndex.get(point.dataIndex), label);
			group.add(label);
		});
	}
	function readStemStyle(seriesModel, itemModel) {
		const seriesStemModel = seriesModel.getModel("stemStyle");
		return readLineStyle(itemModel.getModel("stemStyle"), readLineStyle(seriesStemModel, {
			stroke: "#28aefc",
			lineWidth: 1.4,
			opacity: .95
		}));
	}
	function readPointStyle(data, seriesModel, itemModel, point) {
		const itemStyleModel = itemModel.getModel("itemStyle");
		const seriesItemStyleModel = seriesModel.getModel("itemStyle");
		const visualStyle = asRecord(data.getItemVisual(point.dataIndex, "style"));
		const fill = itemStyleModel.get("color") || visualStyle.fill || seriesItemStyleModel.get("color") || "#2db5ff";
		return {
			fill,
			stroke: itemStyleModel.get("borderColor") || seriesItemStyleModel.get("borderColor") || fill,
			lineWidth: finiteNumber(itemStyleModel.get("borderWidth"), finiteNumber(seriesItemStyleModel.get("borderWidth"), 0)),
			opacity: finiteNumber(itemStyleModel.get("opacity"), finiteNumber(seriesItemStyleModel.get("opacity"), 1))
		};
	}
	function readLineStyle(model, defaults) {
		const color = model.get("color") || model.get("stroke") || defaults.stroke || defaults.color;
		const lineType = model.get("type") || defaults.type;
		return {
			stroke: color,
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
	function formatLabel(formatter, point) {
		const params = {
			data: point.raw,
			name: point.name,
			value: point.value,
			category: point.category
		};
		if (typeof formatter === "function") return formatter(params);
		if (typeof formatter === "string") return formatter.replace(/\{b\}/g, point.name).replace(/\{c\}/g, String(point.value)).replace(/\{category\}/g, point.category);
		return point.value;
	}
	function pathNumber(value) {
		return String(Math.round(value * 1e3) / 1e3);
	}
	function readEnterAnimation(seriesModel, itemIndex, animationOption = seriesModel.get("enterAnimation")) {
		if (seriesModel.get("animation") === false || animationOption === false) return disabledEnterAnimation();
		const option = animationOption == null || animationOption === true ? {} : asRecord(animationOption);
		if (option.show === false || option.enabled === false) return disabledEnterAnimation();
		const baseDelay = resolveAnimationNumber(option.delay ?? seriesModel.get("animationDelay"), itemIndex, itemIndex, 0);
		const stagger = resolveAnimationNumber(option.stagger, itemIndex, itemIndex, 36);
		return {
			enabled: true,
			duration: resolveAnimationNumber(option.duration ?? seriesModel.get("animationDuration"), itemIndex, itemIndex, 620),
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
	function applyStemEnterAnimation(element, point, animation) {
		if (!animation.enabled) return;
		const animatable = element;
		if (typeof animatable.animate !== "function") return;
		const shape = animatable.shape || {};
		shape.x2 = point.baseX;
		shape.y2 = point.baseY;
		animatable.shape = shape;
		animateGraphicProperty(animatable, "shape", animation, {
			x2: point.x,
			y2: point.y
		});
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
	function addHoverElement(item, element) {
		if (!item) return;
		item.elements.push(element);
		if (!item.triggerElements) item.triggerElements = [];
		item.triggerElements.push(element);
	}
	function finiteNumber(value, fallback) {
		return typeof value === "number" && Number.isFinite(value) ? value : fallback;
	}
	function asRecord(value) {
		return value != null && typeof value === "object" && !Array.isArray(value) ? value : {};
	}
	//#endregion
});

//# sourceMappingURL=echarts-lollipop.js.map