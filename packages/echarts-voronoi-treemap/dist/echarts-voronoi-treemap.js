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
	var DEFAULT_GAP = 1.5;
	var DEFAULT_MAX_ITERATION = 24;
	var EPSILON = 1e-6;
	var DEFAULT_VORONOI_TREEMAP_COLORS = [
		"#4f7cac",
		"#d7655b",
		"#5aa469",
		"#e5a93d",
		"#7f63b8",
		"#43a6a8",
		"#c45d89",
		"#8a8f3a",
		"#c77b35",
		"#5d7290"
	];
	function resolveVoronoiTreemapLayout(option = {}) {
		const layout = isPlainObject(option.layout) ? option.layout : {};
		const nestedLayoutOptions = isPlainObject(option.layoutOptions) ? option.layoutOptions : {};
		const resolvedOptions = {
			...layout,
			...nestedLayoutOptions,
			width: firstFiniteNumber(option.width, nestedLayoutOptions.width, layout.width),
			height: firstFiniteNumber(option.height, nestedLayoutOptions.height, layout.height),
			padding: firstFiniteNumber(option.padding, nestedLayoutOptions.padding, layout.padding),
			gap: firstFiniteNumber(option.gap, nestedLayoutOptions.gap, layout.gap),
			rootName: readStringOption(option.rootName, nestedLayoutOptions.rootName, layout.rootName),
			rootVisible: readBooleanOption(option.rootVisible, nestedLayoutOptions.rootVisible, layout.rootVisible),
			colors: normalizeColors(option.colors ?? nestedLayoutOptions.colors ?? layout.colors),
			sort: normalizeSort(option.sort ?? nestedLayoutOptions.sort ?? layout.sort),
			maxIteration: firstFiniteNumber(option.maxIteration, nestedLayoutOptions.maxIteration, layout.maxIteration),
			dimensions: normalizeDimensions(option.dimensions ?? nestedLayoutOptions.dimensions ?? layout.dimensions),
			nameField: readFieldOption(option.nameField ?? nestedLayoutOptions.nameField ?? layout.nameField),
			valueField: readFieldOption(option.valueField ?? nestedLayoutOptions.valueField ?? layout.valueField),
			childrenField: readStringOption(option.childrenField, nestedLayoutOptions.childrenField, layout.childrenField)
		};
		return layoutVoronoiTreemap(option.data, resolvedOptions);
	}
	function layoutVoronoiTreemap(data, options = {}) {
		const width = finiteNumber$1(options.width, DEFAULT_WIDTH);
		const height = finiteNumber$1(options.height, DEFAULT_HEIGHT);
		const padding = Math.max(0, finiteNumber$1(options.padding, DEFAULT_PADDING));
		const gap = Math.max(0, finiteNumber$1(options.gap, DEFAULT_GAP));
		const rootVisible = typeof options.rootVisible === "boolean" ? options.rootVisible : !Array.isArray(data);
		const colors = options.colors?.length ? options.colors : DEFAULT_VORONOI_TREEMAP_COLORS;
		const maxIteration = clamp(Math.round(finiteNumber$1(options.maxIteration, DEFAULT_MAX_ITERATION)), 1, 80);
		const root = normalizeRoot(data, options);
		computeValues(root, options);
		if (options.sort !== false && options.sort !== "none") sortChildren(root, options.sort);
		assignColors(root, colors);
		const right = Math.max(width - padding, padding + 1);
		const bottom = Math.max(height - padding, padding + 1);
		root.points = [
			{
				x: padding,
				y: padding
			},
			{
				x: right,
				y: padding
			},
			{
				x: right,
				y: bottom
			},
			{
				x: padding,
				y: bottom
			}
		];
		root.targetArea = polygonArea(root.points);
		if (root.value > 0) layoutChildren(root, {
			gap,
			maxIteration
		});
		return {
			width,
			height,
			padding,
			gap,
			rootVisible,
			root: toPublicNode(root, root.value),
			nodes: flatten(root).filter((node) => node.value > 0 && node.points.length >= 3 && (rootVisible || node !== root)).map((node) => toPublicNode(node, root.value))
		};
	}
	function flattenVoronoiTreemapData(data, options = {}) {
		return flatten(normalizeRoot(data, typeof options === "string" ? { rootName: options } : options)).filter((node) => node.dataIndex >= 0).sort((left, right) => left.dataIndex - right.dataIndex).map((node) => node.raw);
	}
	function normalizeRoot(data, options) {
		let nextDataIndex = 0;
		function createNode(raw, depth, parent, siblingIndex, forcedName, synthetic = false) {
			const record = isPlainObject(raw) ? raw : {};
			const name = normalizeName(forcedName ?? readField(raw, options.nameField ?? "name", options.dimensions, 0, ["label", "id"]), `node-${siblingIndex}`);
			const idPart = record.id != null ? String(record.id) : `${name}-${siblingIndex}`;
			const node = {
				id: parent ? `${parent.id}/${idPart}` : idPart,
				name,
				value: 0,
				depth,
				parent,
				children: [],
				dataIndex: synthetic ? -1 : nextDataIndex++,
				points: [],
				targetArea: 0,
				color: DEFAULT_VORONOI_TREEMAP_COLORS[depth % DEFAULT_VORONOI_TREEMAP_COLORS.length],
				raw,
				synthetic
			};
			node.children = readChildren(raw, options.childrenField).map((child, index) => createNode(child, depth + 1, node, index));
			return node;
		}
		if (Array.isArray(data)) return createNode({
			name: options.rootName || "root",
			children: data
		}, 0, null, 0, options.rootName || "root", true);
		if (isPlainObject(data)) return createNode(data, 0, null, 0, options.rootName);
		return createNode({
			name: options.rootName || "root",
			value: readNonNegativeNumber(data) ?? 0
		}, 0, null, 0, options.rootName || "root");
	}
	function computeValues(node, options) {
		const children = [];
		let childTotal = 0;
		node.children.forEach((child) => {
			const childValue = computeValues(child, options);
			if (childValue <= 0) return;
			children.push(child);
			childTotal += childValue;
		});
		node.children = children;
		const explicitValue = readNonNegativeNumber(readField(node.raw, options.valueField ?? "value", options.dimensions, 1, [
			"size",
			"weight",
			"amount"
		]));
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
	function assignColors(node, colors, inheritedColor) {
		const baseColor = inheritedColor || colors[0] || DEFAULT_VORONOI_TREEMAP_COLORS[0];
		node.color = readItemColor(node.raw) || baseColor;
		node.children.forEach((child, index) => {
			assignColors(child, colors, node.parent == null ? colors[index % colors.length] : adjustColor(baseColor, child.depth, index));
		});
	}
	function layoutChildren(node, options) {
		if (!node.children.length || node.points.length < 3 || polygonArea(node.points) <= EPSILON) return;
		const cells = node.children.length === 1 ? [{
			points: node.points,
			site: {
				...polygonCentroid(node.points),
				weight: 0,
				targetArea: polygonArea(node.points)
			}
		}] : partitionWeightedVoronoi(node.points, node.children, options.maxIteration);
		node.children.forEach((child, index) => {
			const cell = cells[index];
			const rawPoints = cleanPolygon(cell?.points || []);
			const fallbackPoints = rawPoints.length >= 3 ? rawPoints : createFallbackCell(node.points, cell?.site || {
				...polygonCentroid(node.points),
				weight: 0,
				targetArea: polygonArea(node.points) / node.children.length
			});
			const childPoints = shrinkPolygon(fallbackPoints, options.gap);
			child.points = childPoints.length >= 3 ? childPoints : fallbackPoints;
			child.targetArea = cell?.site.targetArea || polygonArea(child.points);
			layoutChildren(child, options);
		});
	}
	function partitionWeightedVoronoi(container, children, maxIteration) {
		const containerArea = polygonArea(container);
		const total = children.reduce((sum, child) => sum + child.value, 0);
		if (containerArea <= EPSILON || total <= 0) return children.map(() => ({
			points: [],
			site: {
				...polygonCentroid(container),
				weight: 0,
				targetArea: 0
			}
		}));
		const bounds = polygonBounds(container);
		const centroid = polygonCentroid(container);
		const diagonalSquared = Math.max((bounds.maxX - bounds.minX) ** 2 + (bounds.maxY - bounds.minY) ** 2, 1);
		let sites = children.map((child, index) => {
			const targetArea = containerArea * (child.value / total);
			const point = initialSitePoint(container, centroid, bounds, index, children.length);
			return {
				x: point.x,
				y: point.y,
				weight: targetArea / Math.PI,
				targetArea
			};
		});
		for (let iteration = 0; iteration < maxIteration; iteration += 1) {
			const cells = createPowerCells(container, sites);
			let meanWeight = 0;
			sites = sites.map((site, index) => {
				const cell = cells[index];
				const area = polygonArea(cell.points);
				const center = cell.points.length >= 3 ? polygonCentroid(cell.points) : site;
				const targetArea = site.targetArea;
				let weight = site.weight + (targetArea - area) * .82;
				if (area <= EPSILON) weight += targetArea * 1.4;
				weight = clamp(weight, -diagonalSquared * 2, diagonalSquared * 2);
				meanWeight += weight;
				return {
					x: center.x,
					y: center.y,
					weight,
					targetArea
				};
			});
			meanWeight /= Math.max(sites.length, 1);
			sites = sites.map((site) => ({
				...site,
				weight: site.weight - meanWeight
			}));
		}
		return createPowerCells(container, sites).map((cell, index) => {
			if (cell.points.length >= 3 && polygonArea(cell.points) > EPSILON) return cell;
			return {
				points: createFallbackCell(container, sites[index]),
				site: sites[index]
			};
		});
	}
	function initialSitePoint(polygon, centroid, bounds, index, count) {
		const angle = index * Math.PI * (3 - Math.sqrt(5));
		const radius = Math.sqrt((index + .5) / Math.max(count, 1)) * Math.min(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY) * .42;
		const candidate = {
			x: centroid.x + Math.cos(angle) * radius,
			y: centroid.y + Math.sin(angle) * radius
		};
		if (pointInPolygon(candidate, polygon)) return candidate;
		for (let factor = .8; factor > 0; factor -= .2) {
			const point = {
				x: centroid.x + (candidate.x - centroid.x) * factor,
				y: centroid.y + (candidate.y - centroid.y) * factor
			};
			if (pointInPolygon(point, polygon)) return point;
		}
		return centroid;
	}
	function createPowerCells(container, sites) {
		return sites.map((site, siteIndex) => {
			let cell = container.slice();
			for (let otherIndex = 0; otherIndex < sites.length && cell.length >= 3; otherIndex += 1) {
				if (siteIndex === otherIndex) continue;
				const other = sites[otherIndex];
				const a = 2 * (other.x - site.x);
				const b = 2 * (other.y - site.y);
				const c = other.x * other.x + other.y * other.y - site.x * site.x - site.y * site.y + site.weight - other.weight;
				cell = clipPolygonByHalfPlane(cell, a, b, c);
			}
			return {
				points: cleanPolygon(cell),
				site
			};
		});
	}
	function clipPolygonByHalfPlane(points, a, b, c) {
		if (points.length < 3) return [];
		const result = [];
		function signedDistance(point) {
			return a * point.x + b * point.y - c;
		}
		for (let index = 0; index < points.length; index += 1) {
			const current = points[index];
			const next = points[(index + 1) % points.length];
			const currentDistance = signedDistance(current);
			const nextDistance = signedDistance(next);
			const currentInside = currentDistance <= EPSILON;
			const nextInside = nextDistance <= EPSILON;
			if (currentInside && nextInside) result.push(next);
			else if (currentInside && !nextInside) result.push(intersection(current, next, currentDistance, nextDistance));
			else if (!currentInside && nextInside) {
				result.push(intersection(current, next, currentDistance, nextDistance));
				result.push(next);
			}
		}
		return cleanPolygon(result);
	}
	function intersection(current, next, currentDistance, nextDistance) {
		const denominator = currentDistance - nextDistance;
		if (Math.abs(denominator) <= EPSILON) return current;
		const t = currentDistance / denominator;
		return {
			x: current.x + (next.x - current.x) * t,
			y: current.y + (next.y - current.y) * t
		};
	}
	function createFallbackCell(container, site) {
		const radius = Math.max(1, Math.sqrt(Math.max(site.targetArea, 1)) * .18);
		let clipped = [
			{
				x: site.x,
				y: site.y - radius
			},
			{
				x: site.x + radius,
				y: site.y
			},
			{
				x: site.x,
				y: site.y + radius
			},
			{
				x: site.x - radius,
				y: site.y
			}
		];
		const orientation = signedPolygonArea(container) >= 0 ? 1 : -1;
		for (let index = 0; index < container.length && clipped.length >= 3; index += 1) {
			const start = container[index];
			const end = container[(index + 1) % container.length];
			const a = orientation * (start.y - end.y);
			const b = orientation * (end.x - start.x);
			const c = orientation * (start.y * end.x - start.x * end.y);
			clipped = clipPolygonByHalfPlane(clipped, a, b, c);
		}
		return cleanPolygon(clipped.length >= 3 ? clipped : container);
	}
	function shrinkPolygon(points, gap) {
		if (gap <= 0 || points.length < 3) return points;
		const centroid = polygonCentroid(points);
		const originalArea = polygonArea(points);
		const shrunk = points.map((point) => {
			const dx = point.x - centroid.x;
			const dy = point.y - centroid.y;
			const distance = Math.sqrt(dx * dx + dy * dy);
			if (distance <= EPSILON) return point;
			const offset = Math.min(gap, distance * .42);
			const scale = Math.max(0, (distance - offset) / distance);
			return {
				x: centroid.x + dx * scale,
				y: centroid.y + dy * scale
			};
		});
		return polygonArea(shrunk) >= originalArea * .08 ? cleanPolygon(shrunk) : points;
	}
	function toPublicNode(node, total) {
		const points = node.points.map((point) => [round(point.x), round(point.y)]);
		const centroid = polygonCentroid(node.points);
		const area = polygonArea(node.points);
		return {
			id: node.id,
			name: node.name,
			value: round(node.value),
			depth: node.depth,
			parentId: node.parent ? node.parent.id : null,
			children: node.children.map((child) => toPublicNode(child, total)),
			dataIndex: node.dataIndex,
			points,
			path: pointsToPath(points),
			centroidX: round(centroid.x),
			centroidY: round(centroid.y),
			area: round(area),
			targetArea: round(node.targetArea),
			percent: total > 0 ? round(node.value / total, 6) : 0,
			color: node.color,
			isLeaf: node.children.length === 0,
			raw: node.raw
		};
	}
	function pointsToPath(points) {
		if (!points.length) return "";
		const [first, ...rest] = points;
		return [
			`M ${formatPathNumber(first[0])} ${formatPathNumber(first[1])}`,
			...rest.map(([x, y]) => `L ${formatPathNumber(x)} ${formatPathNumber(y)}`),
			"Z"
		].join(" ");
	}
	function polygonArea(points) {
		return Math.abs(signedPolygonArea(points));
	}
	function signedPolygonArea(points) {
		if (points.length < 3) return 0;
		let area = 0;
		for (let index = 0; index < points.length; index += 1) {
			const current = points[index];
			const next = points[(index + 1) % points.length];
			area += current.x * next.y - next.x * current.y;
		}
		return area / 2;
	}
	function polygonCentroid(points) {
		if (!points.length) return {
			x: 0,
			y: 0
		};
		const area = signedPolygonArea(points);
		if (Math.abs(area) <= EPSILON) {
			const sum = points.reduce((acc, point) => ({
				x: acc.x + point.x,
				y: acc.y + point.y
			}), {
				x: 0,
				y: 0
			});
			return {
				x: sum.x / points.length,
				y: sum.y / points.length
			};
		}
		let x = 0;
		let y = 0;
		for (let index = 0; index < points.length; index += 1) {
			const current = points[index];
			const next = points[(index + 1) % points.length];
			const cross = current.x * next.y - next.x * current.y;
			x += (current.x + next.x) * cross;
			y += (current.y + next.y) * cross;
		}
		return {
			x: x / (6 * area),
			y: y / (6 * area)
		};
	}
	function polygonBounds(points) {
		return points.reduce((bounds, point) => ({
			minX: Math.min(bounds.minX, point.x),
			minY: Math.min(bounds.minY, point.y),
			maxX: Math.max(bounds.maxX, point.x),
			maxY: Math.max(bounds.maxY, point.y)
		}), {
			minX: Infinity,
			minY: Infinity,
			maxX: -Infinity,
			maxY: -Infinity
		});
	}
	function pointInPolygon(point, polygon) {
		let inside = false;
		for (let index = 0, previousIndex = polygon.length - 1; index < polygon.length; previousIndex = index, index += 1) {
			const current = polygon[index];
			const previous = polygon[previousIndex];
			if (current.y > point.y !== previous.y > point.y && point.x < (previous.x - current.x) * (point.y - current.y) / (previous.y - current.y || EPSILON) + current.x) inside = !inside;
		}
		return inside;
	}
	function cleanPolygon(points) {
		const result = [];
		points.forEach((point) => {
			if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return;
			const previous = result[result.length - 1];
			if (previous && distanceSquared(previous, point) <= EPSILON * EPSILON) return;
			result.push(point);
		});
		if (result.length > 1 && distanceSquared(result[0], result[result.length - 1]) <= EPSILON * EPSILON) result.pop();
		return result.length >= 3 && polygonArea(result) > EPSILON ? result : [];
	}
	function flatten(node) {
		return [node, ...node.children.flatMap(flatten)];
	}
	function readChildren(raw, childrenField = "children") {
		if (!isPlainObject(raw)) return [];
		const value = raw[childrenField];
		if (Array.isArray(value)) return value;
		if (childrenField !== "children" && Array.isArray(raw.children)) return raw.children;
		return [];
	}
	function readField(item, field, dimensions, fallbackIndex, fallbackNames) {
		if (Array.isArray(item)) {
			const index = typeof field === "number" ? field : dimensions?.indexOf(field);
			return item[index != null && index >= 0 ? index : fallbackIndex];
		}
		if (!isPlainObject(item)) return void 0;
		if (typeof field === "string") {
			const direct = readPath(item, field);
			if (direct != null) return direct;
		}
		for (const fallbackName of fallbackNames) {
			const value = readPath(item, fallbackName);
			if (value != null) return value;
		}
	}
	function readPath(item, path) {
		if (item[path] != null) return item[path];
		if (!path.includes(".")) return void 0;
		return path.split(".").reduce((current, key) => {
			if (!isPlainObject(current)) return void 0;
			return current[key];
		}, item);
	}
	function readNonNegativeNumber(value) {
		if (typeof value === "number" && Number.isFinite(value) && value >= 0) return value;
		if (typeof value === "string") {
			const parsed = Number(value);
			if (Number.isFinite(parsed) && parsed >= 0) return parsed;
		}
	}
	function readItemColor(raw) {
		if (!isPlainObject(raw) || !isPlainObject(raw.itemStyle)) return void 0;
		const color = raw.itemStyle.color;
		return typeof color === "string" && color ? color : void 0;
	}
	function normalizeName(value, fallback) {
		if (typeof value === "string" && value.length) return value;
		if (typeof value === "number" && Number.isFinite(value)) return String(value);
		return fallback;
	}
	function normalizeSort(value) {
		return value === false || value === true || value === "none" || value === "value" || value === "name" ? value : void 0;
	}
	function normalizeColors(value) {
		return Array.isArray(value) ? value.filter((color) => typeof color === "string") : void 0;
	}
	function normalizeDimensions(value) {
		return Array.isArray(value) ? value.filter((dimension) => typeof dimension === "string") : void 0;
	}
	function readFieldOption(value) {
		return typeof value === "string" || typeof value === "number" ? value : void 0;
	}
	function readStringOption(...values) {
		const value = values.find((item) => typeof item === "string" && item.length);
		return typeof value === "string" ? value : void 0;
	}
	function readBooleanOption(...values) {
		const value = values.find((item) => typeof item === "boolean");
		return typeof value === "boolean" ? value : void 0;
	}
	function adjustColor(color, depth, index) {
		const hex = parseHexColor(color);
		if (!hex) return color;
		const amount = Math.min(.22, .08 + depth * .025 + index % 3 * .025);
		return rgbToHex(mixChannel(hex.r, 255, amount), mixChannel(hex.g, 255, amount), mixChannel(hex.b, 255, amount));
	}
	function parseHexColor(color) {
		const match = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
		if (!match) return null;
		const raw = match[1];
		const value = raw.length === 3 ? raw.split("").map((part) => `${part}${part}`).join("") : raw;
		return {
			r: Number.parseInt(value.slice(0, 2), 16),
			g: Number.parseInt(value.slice(2, 4), 16),
			b: Number.parseInt(value.slice(4, 6), 16)
		};
	}
	function mixChannel(source, target, amount) {
		return Math.round(source + (target - source) * amount);
	}
	function rgbToHex(r, g, b) {
		return `#${[
			r,
			g,
			b
		].map((value) => clamp(value, 0, 255).toString(16).padStart(2, "0")).join("")}`;
	}
	function finiteNumber$1(value, fallback) {
		return typeof value === "number" && Number.isFinite(value) ? value : fallback;
	}
	function firstFiniteNumber(...values) {
		const value = values.find((item) => typeof item === "number" && Number.isFinite(item));
		return typeof value === "number" ? value : void 0;
	}
	function distanceSquared(left, right) {
		const dx = left.x - right.x;
		const dy = left.y - right.y;
		return dx * dx + dy * dy;
	}
	function clamp(value, min, max) {
		return Math.min(Math.max(value, min), max);
	}
	function round(value, digits = 3) {
		const factor = 10 ** digits;
		return Math.round((value + Number.EPSILON) * factor) / factor;
	}
	function formatPathNumber(value) {
		return Number.isInteger(value) ? String(value) : value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
	}
	function isPlainObject(value) {
		return value != null && typeof value === "object" && !Array.isArray(value);
	}
	//#endregion
	//#region src/voronoi-treemap.ts
	var echartsHost = echarts_lib_echarts;
	var optionKeys = [
		"padding",
		"gap",
		"rootName",
		"rootVisible",
		"colors",
		"sort",
		"maxIteration",
		"dimensions",
		"nameField",
		"valueField",
		"childrenField"
	];
	echartsHost.extendSeriesModel({
		type: "series.voronoiTreemap",
		visualStyleAccessPath: "itemStyle",
		visualDrawType: "fill",
		getInitialData(option) {
			const source = flattenVoronoiTreemapData(option.data, option);
			const dimensions = echartsHost.helper.createDimensions(source, { coordDimensions: ["value"] });
			const list = new echartsHost.List(dimensions, this);
			list.initData(source);
			this.legendVisualProvider = createLegendVisualProvider(this);
			return list;
		},
		defaultOption: {
			left: "center",
			top: "center",
			width: "88%",
			height: "82%",
			padding: 12,
			gap: 1.5,
			rootName: "root",
			rootVisible: false,
			colors: DEFAULT_VORONOI_TREEMAP_COLORS,
			sort: true,
			maxIteration: 24,
			nameField: "name",
			valueField: "value",
			childrenField: "children",
			enterAnimation: true,
			itemStyle: {
				opacity: .94,
				borderColor: "#ffffff",
				borderWidth: 1.2
			},
			label: {
				show: true,
				showInternal: false,
				color: "#111827",
				fontSize: 12,
				fontWeight: 650,
				lineHeight: 14,
				minArea: 760,
				formatter: null
			},
			emphasis: { itemStyle: {
				shadowBlur: 10,
				shadowColor: "rgba(31, 41, 55, 0.22)"
			} }
		}
	});
	echartsHost.extendChartView({
		type: "voronoiTreemap",
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
				const layout = resolveVoronoiTreemapLayout(readLayoutOption(seriesModel, rect));
				if (this.__renderToken !== renderToken) return;
				const { hoverItems } = renderAlive(this, echartsHost, group, seriesModel, (targetGroup, targetSeriesModel) => drawVoronoiTreemap(echartsHost, targetGroup, targetSeriesModel, layout, rect));
				this.__hoverController = installElementHover(hoverItems, { zrender: api.getZr?.() });
			} catch (error) {
				if (typeof console !== "undefined") console.error("[voronoiTreemap] render failed", error);
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
	function drawVoronoiTreemap(echartsInstance, group, seriesModel, layout, rect) {
		const data = seriesModel.getData();
		const chartGroup = new echartsInstance.graphic.Group();
		const hoverItems = [];
		const hoverItemsByDataIndex = /* @__PURE__ */ new Map();
		chartGroup.x = rect.x;
		chartGroup.y = rect.y;
		layout.nodes.forEach((node, index) => {
			if (node.points.length < 3 || node.area <= 0) return;
			const itemModel = node.dataIndex >= 0 && node.dataIndex < data.count() ? data.getItemModel(node.dataIndex) : null;
			const polygon = new echartsInstance.graphic.Polygon({
				shape: { points: node.points },
				style: readNodeStyle(data, seriesModel, itemModel, node, index),
				z2: node.depth
			});
			applyFadeEnterAnimation(polygon, readEnterAnimation(seriesModel, index));
			if (itemModel && node.dataIndex >= 0 && node.dataIndex < data.count()) {
				data.setItemLayout(node.dataIndex, [node.centroidX + rect.x, node.centroidY + rect.y]);
				data.setItemGraphicEl(node.dataIndex, polygon);
				const hoverItem = createHoverItem(polygon);
				hoverItems.push(hoverItem);
				hoverItemsByDataIndex.set(node.dataIndex, hoverItem);
			}
			chartGroup.add(polygon);
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
			const show = itemLabelModel?.get("show") ?? seriesLabelModel.get("show");
			const showInternal = itemLabelModel?.get("showInternal") ?? seriesLabelModel.get("showInternal");
			if (!show || !node.isLeaf && !showInternal) return;
			const minArea = finiteNumber(itemLabelModel?.get("minArea") ?? seriesLabelModel.get("minArea"), 760);
			if (node.area < minArea) return;
			const bounds = pointBounds(node.points);
			const boxWidth = bounds.maxX - bounds.minX;
			const boxHeight = bounds.maxY - bounds.minY;
			const baseFontSize = finiteNumber(itemLabelModel?.get("fontSize") ?? seriesLabelModel.get("fontSize"), 12);
			if (boxWidth < Math.max(24, baseFontSize * 2) || boxHeight < Math.max(14, baseFontSize * 1.15)) return;
			const fontSize = Math.min(baseFontSize, Math.max(8, Math.min(boxHeight * .3, boxWidth * .15)));
			const lineHeight = finiteNumber(itemLabelModel?.get("lineHeight") ?? seriesLabelModel.get("lineHeight"), fontSize + 3);
			const maxChars = Math.max(3, Math.floor(Math.max(boxWidth - 10, 1) / Math.max(fontSize * .56, 1)));
			const text = formatLabel(itemLabelModel?.get("formatter") || seriesLabelModel.get("formatter"), node);
			const labelEl = new echartsInstance.graphic.Text({
				style: {
					x: node.centroidX,
					y: node.centroidY,
					text: wrapText(String(text), maxChars, Math.max(1, Math.floor(boxHeight / lineHeight))),
					fill: itemLabelModel?.get("color") || seriesLabelModel.get("color") || "#111827",
					fontSize,
					fontWeight: itemLabelModel?.get("fontWeight") || seriesLabelModel.get("fontWeight") || 650,
					lineHeight,
					align: "center",
					verticalAlign: "middle"
				},
				silent: true,
				z2: node.depth + 20
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
			fill: itemStyle.color || rawStyle.color || seriesStyle.color || node.color || visualStyle.fill || DEFAULT_VORONOI_TREEMAP_COLORS[index % DEFAULT_VORONOI_TREEMAP_COLORS.length],
			stroke: itemStyle.borderColor || rawStyle.borderColor || seriesStyle.borderColor || "#ffffff",
			lineWidth: finiteNumber(itemStyle.borderWidth ?? rawStyle.borderWidth ?? seriesStyle.borderWidth, 1.2),
			opacity: finiteNumber(itemStyle.opacity ?? rawStyle.opacity ?? seriesStyle.opacity, .94)
		};
	}
	function formatLabel(formatter, node) {
		const params = {
			data: node.raw,
			name: node.name,
			value: node.value,
			percent: node.percent,
			depth: node.depth,
			isLeaf: node.isLeaf,
			parentId: node.parentId,
			node
		};
		if (typeof formatter === "function") return formatter(params);
		if (typeof formatter === "string") return formatter.replace(/\{b\}/g, node.name).replace(/\{c\}/g, String(node.value)).replace(/\{d\}/g, String(Math.round(node.percent * 100))).replace(/\{p\}/g, `${Math.round(node.percent * 100)}%`);
		return node.name;
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
					fill: itemStyle.color || DEFAULT_VORONOI_TREEMAP_COLORS[dataIndex % DEFAULT_VORONOI_TREEMAP_COLORS.length],
					stroke: itemStyle.borderColor || "#ffffff",
					opacity: finiteNumber(itemStyle.opacity, .94)
				};
			}
		};
	}
	function collectDataNames(data) {
		const names = [];
		for (let index = 0; index < data.count(); index += 1) names.push(data.getName(index));
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
		const stagger = resolveAnimationNumber(option.stagger, itemIndex, itemIndex, 18);
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
	function pointBounds(points) {
		return points.reduce((bounds, [x, y]) => ({
			minX: Math.min(bounds.minX, x),
			minY: Math.min(bounds.minY, y),
			maxX: Math.max(bounds.maxX, x),
			maxY: Math.max(bounds.maxY, y)
		}), {
			minX: Infinity,
			minY: Infinity,
			maxX: -Infinity,
			maxY: -Infinity
		});
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

//# sourceMappingURL=echarts-voronoi-treemap.js.map