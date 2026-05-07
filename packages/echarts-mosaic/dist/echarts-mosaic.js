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
	var DEFAULT_PADDING = 12;
	var DEFAULT_GAP = 1;
	var EMPTY_VALUE = "(empty)";
	var DEFAULT_MOSAIC_COLORS = [
		"#4e79a7",
		"#f28e8c",
		"#59a14f",
		"#f2b447",
		"#76b7b2",
		"#b07aa1",
		"#e15759",
		"#8cd17d",
		"#9c755f",
		"#bab0ab"
	];
	function resolveMosaicLayout(option = {}) {
		const layoutOptions = {
			...isPlainObject(option.layout) ? option.layout : {},
			...isPlainObject(option.layoutOptions) ? option.layoutOptions : {},
			width: finiteNumber$1(option.width, void 0),
			height: finiteNumber$1(option.height, void 0),
			padding: finiteNumber$1(option.padding, void 0),
			gap: finiteNumber$1(option.gap, void 0),
			xField: option.xField,
			yField: option.yField,
			valueField: option.valueField,
			dimensions: Array.isArray(option.dimensions) ? option.dimensions.filter((item) => typeof item === "string") : void 0,
			xCategories: normalizeExplicitCategories(option.xCategories),
			yCategories: normalizeExplicitCategories(option.yCategories),
			colors: Array.isArray(option.colors) ? option.colors.filter((color) => typeof color === "string") : void 0,
			sort: option.sort
		};
		return layoutMosaic(Array.isArray(option.data) ? option.data : [], layoutOptions);
	}
	function layoutMosaic(data, options = {}) {
		const width = finiteNumber$1(options.width, DEFAULT_WIDTH);
		const height = finiteNumber$1(options.height, DEFAULT_HEIGHT);
		const padding = Math.max(0, finiteNumber$1(options.padding, DEFAULT_PADDING));
		const gap = Math.max(0, finiteNumber$1(options.gap, DEFAULT_GAP));
		const colors = options.colors?.length ? options.colors : DEFAULT_MOSAIC_COLORS;
		const cells = mergeCells(normalizeItems(data, options).filter((item) => item.value > 0));
		const grandTotal = cells.reduce((sum, item) => sum + item.value, 0);
		const xTotals = sumBy(cells, "xCategory");
		const yTotals = sumBy(cells, "yCategory");
		const xCategories = resolveCategories("xCategory", cells, normalizeExplicitCategories(options.xCategories), xTotals, options.sort);
		const yCategories = resolveCategories("yCategory", cells, normalizeExplicitCategories(options.yCategories), yTotals, options.sort);
		const tiles = [];
		if (grandTotal <= 0 || !xCategories.length || !yCategories.length) return {
			width,
			height,
			padding,
			gap,
			total: 0,
			xCategories,
			yCategories,
			xTotals,
			yTotals,
			tiles
		};
		const innerWidth = Math.max(width - padding * 2, 1);
		const innerHeight = Math.max(height - padding * 2, 1);
		const activeXCategories = xCategories.filter((category) => positiveNumber(xTotals[category], 0) > 0);
		const xGapTotal = gap * Math.max(0, activeXCategories.length - 1);
		const availableWidth = Math.max(innerWidth - xGapTotal, 1);
		let cursorX = padding;
		activeXCategories.forEach((xCategory) => {
			const columnTotal = xTotals[xCategory] || 0;
			const columnWidth = availableWidth * (columnTotal / grandTotal);
			const columnCells = yCategories.map((yCategory) => cells.find((cell) => cell.xCategory === xCategory && cell.yCategory === yCategory)).filter((cell) => cell != null && cell.value > 0);
			const yGapTotal = gap * Math.max(0, columnCells.length - 1);
			const availableHeight = Math.max(innerHeight - yGapTotal, 1);
			let cursorY = padding;
			columnCells.forEach((cell) => {
				const tileHeight = availableHeight * (cell.value / columnTotal);
				tiles.push({
					id: cell.id,
					name: cell.name,
					xCategory: cell.xCategory,
					yCategory: cell.yCategory,
					value: cell.value,
					total: grandTotal,
					percent: grandTotal > 0 ? cell.value / grandTotal : 0,
					columnPercent: columnTotal > 0 ? cell.value / columnTotal : 0,
					dataIndex: cell.dataIndex,
					x: cursorX,
					y: cursorY,
					width: Math.max(columnWidth, 0),
					height: Math.max(tileHeight, 0),
					color: colors[yCategories.indexOf(cell.yCategory) % colors.length],
					raw: cell.raw
				});
				cursorY += tileHeight + gap;
			});
			cursorX += columnWidth + gap;
		});
		return {
			width,
			height,
			padding,
			gap,
			total: grandTotal,
			xCategories: activeXCategories,
			yCategories,
			xTotals,
			yTotals,
			tiles
		};
	}
	function normalizeItems(data, options) {
		return data.map((item, dataIndex) => {
			const xCategory = normalizeCategory(readField(item, options.xField ?? "x", options.dimensions, 0, ["category", "group"]));
			const yCategory = normalizeCategory(readField(item, options.yField ?? "y", options.dimensions, 1, ["segment", "series"]));
			const value = positiveNumber(readField(item, options.valueField ?? "value", options.dimensions, 2, ["count", "size"]), 0);
			const record = isPlainObject(item) ? item : {};
			const name = typeof record.name === "string" && record.name ? record.name : `${xCategory} / ${yCategory}`;
			return {
				id: `${xCategory}\x00${yCategory}`,
				name,
				xCategory,
				yCategory,
				value,
				dataIndex,
				raw: item
			};
		});
	}
	function mergeCells(items) {
		const byId = /* @__PURE__ */ new Map();
		items.forEach((item) => {
			const existing = byId.get(item.id);
			if (!existing) {
				byId.set(item.id, {
					...item,
					rawItems: [item.raw]
				});
				return;
			}
			existing.value += item.value;
			existing.rawItems.push(item.raw);
		});
		return Array.from(byId.values()).map((cell) => ({
			...cell,
			raw: cell.rawItems.length === 1 ? cell.rawItems[0] : cell.rawItems
		}));
	}
	function readField(item, field, dimensions, fallbackIndex, fallbackNames) {
		if (Array.isArray(item)) {
			const index = typeof field === "number" ? field : dimensions?.indexOf(field);
			return item[index != null && index >= 0 ? index : fallbackIndex];
		}
		if (!isPlainObject(item)) return void 0;
		if (typeof field === "string" && item[field] != null) return item[field];
		if (typeof field === "number") return void 0;
		for (const fallbackName of fallbackNames) if (item[fallbackName] != null) return item[fallbackName];
	}
	function resolveCategories(key, cells, explicitCategories, totals, sort) {
		const categories = explicitCategories?.length ? explicitCategories.filter((category) => positiveNumber(totals[category], 0) > 0) : unique(cells.map((cell) => cell[key]));
		if (sort === true || sort === "value") return [...categories].sort((left, right) => (totals[right] || 0) - (totals[left] || 0) || left.localeCompare(right));
		if (sort === "name") return [...categories].sort((left, right) => left.localeCompare(right));
		return categories;
	}
	function sumBy(cells, key) {
		const totals = {};
		cells.forEach((cell) => {
			totals[cell[key]] = (totals[cell[key]] || 0) + cell.value;
		});
		return totals;
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
	function normalizeExplicitCategories(value) {
		if (!Array.isArray(value)) return void 0;
		return value.map(normalizeCategory);
	}
	function normalizeCategory(value) {
		if (typeof value === "string" && value.length) return value;
		if (typeof value === "number" && Number.isFinite(value)) return String(value);
		return EMPTY_VALUE;
	}
	function positiveNumber(value, fallback) {
		if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
		if (typeof value === "string") {
			const parsed = Number(value);
			if (Number.isFinite(parsed) && parsed > 0) return parsed;
		}
		return fallback;
	}
	function finiteNumber$1(value, fallback) {
		return typeof value === "number" && Number.isFinite(value) ? value : fallback;
	}
	function isPlainObject(value) {
		return value != null && typeof value === "object" && !Array.isArray(value);
	}
	//#endregion
	//#region src/mosaic.ts
	var echartsHost = echarts_lib_echarts;
	var optionKeys = [
		"padding",
		"gap",
		"xField",
		"yField",
		"valueField",
		"dimensions",
		"xCategories",
		"yCategories",
		"colors",
		"sort"
	];
	echartsHost.extendSeriesModel({
		type: "series.mosaic",
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
			width: "86%",
			height: "82%",
			padding: 12,
			gap: 2,
			xField: "x",
			yField: "y",
			valueField: "value",
			xCategories: null,
			yCategories: null,
			colors: DEFAULT_MOSAIC_COLORS,
			sort: false,
			enterAnimation: true,
			itemStyle: {
				opacity: .92,
				borderColor: "#ffffff",
				borderWidth: 1
			},
			label: {
				show: true,
				color: "#111827",
				fontSize: 12,
				fontWeight: 600,
				lineHeight: null,
				formatter: null
			},
			emphasis: { itemStyle: {
				shadowBlur: 8,
				shadowColor: "rgba(31, 41, 55, 0.2)"
			} }
		}
	});
	echartsHost.extendChartView({
		type: "mosaic",
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
				const layout = resolveMosaicLayout(readLayoutOption(seriesModel, rect));
				if (this.__renderToken !== renderToken) return;
				const { hoverItems } = renderAlive(this, echartsHost, group, seriesModel, (targetGroup, targetSeriesModel) => drawMosaic(echartsHost, targetGroup, targetSeriesModel, layout, rect));
				this.__hoverController = installElementHover(hoverItems, { zrender: api.getZr?.() });
			} catch (error) {
				if (typeof console !== "undefined") console.error("[mosaic] render failed", error);
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
	function drawMosaic(echartsInstance, group, seriesModel, layout, rect) {
		const data = seriesModel.getData();
		const chartGroup = new echartsInstance.graphic.Group();
		const hoverItems = [];
		const hoverItemsByDataIndex = /* @__PURE__ */ new Map();
		chartGroup.x = rect.x;
		chartGroup.y = rect.y;
		layout.tiles.forEach((tile, index) => {
			const itemModel = tile.dataIndex >= 0 && tile.dataIndex < data.count() ? data.getItemModel(tile.dataIndex) : null;
			const rectEl = new echartsInstance.graphic.Rect({
				shape: {
					x: tile.x,
					y: tile.y,
					width: tile.width,
					height: tile.height
				},
				style: readTileStyle(data, seriesModel, itemModel, tile, index)
			});
			applyRectEnterAnimation(rectEl, tile, readEnterAnimation(seriesModel, index));
			if (itemModel && tile.dataIndex >= 0 && tile.dataIndex < data.count()) {
				data.setItemLayout(tile.dataIndex, [
					tile.x,
					tile.y,
					tile.width,
					tile.height
				]);
				data.setItemGraphicEl(tile.dataIndex, rectEl);
				const hoverItem = createHoverItem(rectEl);
				hoverItems.push(hoverItem);
				hoverItemsByDataIndex.set(tile.dataIndex, hoverItem);
			}
			chartGroup.add(rectEl);
		});
		drawLabels(echartsInstance, chartGroup, seriesModel, data, layout.tiles, hoverItemsByDataIndex);
		group.add(chartGroup);
		return hoverItems;
	}
	function drawLabels(echartsInstance, group, seriesModel, data, tiles, hoverItemsByDataIndex) {
		const seriesLabelModel = seriesModel.getModel("label");
		if (!seriesLabelModel.get("show")) return;
		tiles.forEach((tile) => {
			const itemLabelModel = (tile.dataIndex >= 0 && tile.dataIndex < data.count() ? data.getItemModel(tile.dataIndex) : null)?.getModel("label");
			if (!(itemLabelModel?.get("show") ?? seriesLabelModel.get("show"))) return;
			const baseFontSize = finiteNumber(itemLabelModel?.get("fontSize") ?? seriesLabelModel.get("fontSize"), 12);
			if (tile.width < Math.max(22, baseFontSize * 2) || tile.height < Math.max(14, baseFontSize * 1.2)) return;
			const fontSize = Math.min(baseFontSize, Math.max(8, Math.min(tile.height * .36, tile.width * .18)));
			const lineHeight = finiteNumber(itemLabelModel?.get("lineHeight") ?? seriesLabelModel.get("lineHeight"), fontSize + 3);
			const maxChars = Math.max(3, Math.floor(Math.max(tile.width - 8, 1) / Math.max(fontSize * .56, 1)));
			const text = formatLabel(itemLabelModel?.get("formatter") || seriesLabelModel.get("formatter"), tile);
			const labelEl = new echartsInstance.graphic.Text({
				style: {
					x: tile.x + tile.width / 2,
					y: tile.y + tile.height / 2,
					text: wrapText(String(text), maxChars, Math.max(1, Math.floor(tile.height / lineHeight))),
					fill: itemLabelModel?.get("color") || seriesLabelModel.get("color") || "#111827",
					fontSize,
					fontWeight: itemLabelModel?.get("fontWeight") || seriesLabelModel.get("fontWeight") || 600,
					lineHeight,
					align: "center",
					verticalAlign: "middle"
				},
				silent: true
			});
			applyFadeEnterAnimation(labelEl, readEnterAnimation(seriesModel, tile.dataIndex));
			addHoverElement(hoverItemsByDataIndex.get(tile.dataIndex), labelEl);
			group.add(labelEl);
		});
	}
	function readTileStyle(data, seriesModel, itemModel, tile, index) {
		const seriesStyle = asRecord(seriesModel.get("itemStyle"));
		const itemStyle = itemModel ? asRecord(itemModel.get("itemStyle")) : {};
		const visualStyle = tile.dataIndex >= 0 && tile.dataIndex < data.count() ? asRecord(data.getItemVisual(tile.dataIndex, "style")) : {};
		return {
			fill: itemStyle.color || seriesStyle.color || visualStyle.fill || tile.color || DEFAULT_MOSAIC_COLORS[index % DEFAULT_MOSAIC_COLORS.length],
			stroke: itemStyle.borderColor || seriesStyle.borderColor || "#ffffff",
			lineWidth: finiteNumber(itemStyle.borderWidth ?? seriesStyle.borderWidth, 1),
			opacity: finiteNumber(itemStyle.opacity ?? seriesStyle.opacity, .92)
		};
	}
	function formatLabel(formatter, tile) {
		const params = {
			data: tile.raw,
			name: tile.name,
			value: tile.value,
			percent: tile.percent,
			columnPercent: tile.columnPercent,
			xCategory: tile.xCategory,
			yCategory: tile.yCategory
		};
		if (typeof formatter === "function") return formatter(params);
		if (typeof formatter === "string") return formatter.replace(/\{b\}/g, tile.name).replace(/\{c\}/g, String(tile.value)).replace(/\{d\}/g, String(Math.round(tile.percent * 100))).replace(/\{x\}/g, tile.xCategory).replace(/\{y\}/g, tile.yCategory);
		return tile.name;
	}
	function wrapText(value, maxChars, maxLines) {
		if (maxLines <= 1) return value.length > maxChars ? `${value.slice(0, Math.max(1, maxChars - 1))}...` : value;
		if (value.length <= maxChars) return value;
		const words = value.split(/\s+/).filter(Boolean);
		const lines = [];
		let current = "";
		if (words.length <= 1) {
			for (let index = 0; index < value.length && lines.length < maxLines; index += maxChars) lines.push(value.slice(index, index + maxChars));
			return trimLines(lines, maxLines, maxChars);
		}
		words.forEach((word) => {
			if (lines.length >= maxLines) return;
			const next = current ? `${current} ${word}` : word;
			if (next.length <= maxChars) {
				current = next;
				return;
			}
			if (current) lines.push(current);
			current = word.length > maxChars ? word.slice(0, maxChars) : word;
		});
		if (current && lines.length < maxLines) lines.push(current);
		return trimLines(lines, maxLines, maxChars);
	}
	function trimLines(lines, maxLines, maxChars) {
		const visible = lines.slice(0, maxLines);
		if (lines.length > maxLines && visible.length) {
			const last = visible[visible.length - 1];
			visible[visible.length - 1] = `${last.slice(0, Math.max(1, maxChars - 1))}...`;
		}
		return visible.join("\n");
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
					fill: itemStyle.color || DEFAULT_MOSAIC_COLORS[dataIndex % DEFAULT_MOSAIC_COLORS.length],
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
	function readEnterAnimation(seriesModel, itemIndex, animationOption = seriesModel.get("enterAnimation")) {
		if (seriesModel.get("animation") === false || animationOption === false) return disabledEnterAnimation();
		const option = animationOption == null || animationOption === true ? {} : asRecord(animationOption);
		if (option.show === false || option.enabled === false) return disabledEnterAnimation();
		const baseDelay = resolveAnimationNumber(option.delay ?? seriesModel.get("animationDelay"), itemIndex, itemIndex, 0);
		const stagger = resolveAnimationNumber(option.stagger, itemIndex, itemIndex, 28);
		return {
			enabled: true,
			duration: resolveAnimationNumber(option.duration ?? seriesModel.get("animationDuration"), itemIndex, itemIndex, 560),
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
	function applyRectEnterAnimation(element, tile, animation) {
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
		animateGraphicProperty(animatable, "shape", animation, { width: tile.width });
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

//# sourceMappingURL=echarts-mosaic.js.map