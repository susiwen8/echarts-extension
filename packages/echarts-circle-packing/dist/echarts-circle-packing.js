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
	var DEFAULT_NODE_PADDING = 2.5;
	var DEFAULT_SIBLING_GAP = 1.5;
	var EPSILON = 1e-6;
	var DEFAULT_CIRCLE_PACKING_COLORS = [
		"#356ac3",
		"#2f9a6b",
		"#c87a2a",
		"#9b5bb5",
		"#d34f5f",
		"#3f8796",
		"#8c9a24",
		"#6d78d8"
	];
	function resolveCirclePackingLayout(option = {}) {
		const layoutOptions = {
			...isPlainObject$1(option.layout) ? option.layout : {},
			...isPlainObject$1(option.layoutOptions) ? option.layoutOptions : {}
		};
		assignDefined(layoutOptions, "width", finiteNumber$1(option.width, void 0));
		assignDefined(layoutOptions, "height", finiteNumber$1(option.height, void 0));
		assignDefined(layoutOptions, "padding", resolveRawPadding(option.padding));
		assignDefined(layoutOptions, "nodePadding", finiteNumber$1(option.nodePadding, void 0));
		assignDefined(layoutOptions, "siblingGap", finiteNumber$1(option.siblingGap, void 0));
		assignDefined(layoutOptions, "center", Array.isArray(option.center) ? option.center : void 0);
		assignDefined(layoutOptions, "radius", option.radius);
		assignDefined(layoutOptions, "rootName", typeof option.rootName === "string" ? option.rootName : void 0);
		assignDefined(layoutOptions, "rootVisible", typeof option.rootVisible === "boolean" ? option.rootVisible : void 0);
		assignDefined(layoutOptions, "valueField", typeof option.valueField === "string" ? option.valueField : void 0);
		assignDefined(layoutOptions, "nameField", typeof option.nameField === "string" ? option.nameField : void 0);
		assignDefined(layoutOptions, "childrenField", typeof option.childrenField === "string" ? option.childrenField : void 0);
		assignDefined(layoutOptions, "sort", normalizeSort(option.sort));
		assignDefined(layoutOptions, "colors", Array.isArray(option.colors) ? option.colors.filter((color) => typeof color === "string") : void 0);
		return layoutCirclePacking(option.data, layoutOptions);
	}
	function layoutCirclePacking(data, options = {}) {
		const width = finiteNumber$1(options.width, DEFAULT_WIDTH);
		const height = finiteNumber$1(options.height, DEFAULT_HEIGHT);
		const inner = resolveInnerRect(width, height, resolvePadding(options.padding));
		const radius = resolveRadius(options.radius, inner);
		const center = resolveCenter(options.center, width, height, inner);
		const rootVisible = typeof options.rootVisible === "boolean" ? options.rootVisible : !Array.isArray(data);
		const colors = options.colors?.length ? options.colors : DEFAULT_CIRCLE_PACKING_COLORS;
		const root = normalizeRoot(data, options);
		computeValues(root);
		if (options.sort !== false && options.sort !== "none") sortChildren(root, options.sort);
		assignDataIndices(root);
		computeLocalPacking(root, options);
		assignColors(root, colors, rootVisible ? 0 : 1);
		assignPositions(root, center, root.localRadius > EPSILON ? radius / root.localRadius : 1);
		const publicRoot = toPublicNode(root, Math.max(root.value, EPSILON));
		return {
			width,
			height,
			center,
			radius,
			rootVisible,
			root: publicRoot,
			nodes: flattenPublic(publicRoot).filter((node) => rootVisible || node.id !== publicRoot.id)
		};
	}
	function flattenCirclePackingData(data, options = {}) {
		const root = normalizeRoot(data, options);
		computeValues(root);
		if (options.sort !== false && options.sort !== "none") sortChildren(root, options.sort);
		assignDataIndices(root);
		return flatten(root).filter((node) => !node.synthetic).sort((left, right) => left.dataIndex - right.dataIndex).map((node) => node.raw);
	}
	function normalizeRoot(data, options) {
		const valueField = normalizeField(options.valueField, "value");
		const nameField = normalizeField(options.nameField, "name");
		const childrenField = normalizeField(options.childrenField, "children");
		function createNode(raw, depth, parent, siblingIndex, forcedName, synthetic = false) {
			const record = isPlainObject$1(raw) ? raw : {};
			const label = record.label;
			const name = String(forcedName ?? readField(record, nameField) ?? record.name ?? (typeof label === "string" || typeof label === "number" ? label : void 0) ?? record.id ?? (isPlainObject$1(raw) ? `node-${siblingIndex}` : raw) ?? `node-${siblingIndex}`);
			const idPart = record.id != null ? String(record.id) : parent ? `${name}-${siblingIndex}` : name;
			const node = {
				id: parent ? `${parent.id}/${idPart}` : idPart,
				name,
				explicitValue: readNonNegativeNumber(readField(record, valueField) ?? record.value),
				value: 0,
				depth,
				parent,
				children: [],
				dataIndex: synthetic ? -1 : 0,
				localX: 0,
				localY: 0,
				localRadius: 0,
				x: 0,
				y: 0,
				r: 0,
				color: DEFAULT_CIRCLE_PACKING_COLORS[depth % DEFAULT_CIRCLE_PACKING_COLORS.length],
				raw,
				synthetic
			};
			node.children = readChildren(record, childrenField).map((child, index) => createNode(child, depth + 1, node, index));
			return node;
		}
		if (Array.isArray(data)) return createNode({
			name: options.rootName || "root",
			children: data
		}, 0, null, 0, options.rootName || "root", true);
		if (isPlainObject$1(data)) return createNode(data, 0, null, 0, options.rootName);
		return createNode({
			name: options.rootName || "root",
			value: readNonNegativeNumber(data) ?? 0
		}, 0, null, 0, options.rootName || "root");
	}
	function computeValues(node) {
		const children = [];
		let childTotal = 0;
		node.children.forEach((child) => {
			const childValue = computeValues(child);
			if (childValue <= 0) return;
			children.push(child);
			childTotal += childValue;
		});
		node.children = children;
		if (node.children.length) {
			node.value = Math.max(node.explicitValue ?? 0, childTotal);
			return node.value;
		}
		node.value = node.explicitValue ?? (node.synthetic ? 0 : 1);
		return node.value;
	}
	function sortChildren(node, sort) {
		if (sort === "name") node.children.sort((left, right) => left.name.localeCompare(right.name) || right.value - left.value);
		else if (sort === "asc") node.children.sort((left, right) => left.value - right.value || left.name.localeCompare(right.name));
		else node.children.sort((left, right) => right.value - left.value || left.name.localeCompare(right.name));
		node.children.forEach((child) => sortChildren(child, sort));
	}
	function assignDataIndices(root) {
		let nextDataIndex = 0;
		flatten(root).forEach((node) => {
			node.dataIndex = node.synthetic ? -1 : nextDataIndex++;
		});
	}
	function computeLocalPacking(node, options) {
		node.children.forEach((child) => computeLocalPacking(child, options));
		if (!node.children.length) {
			node.localRadius = Math.max(Math.sqrt(Math.max(node.value, EPSILON)), EPSILON);
			return node.localRadius;
		}
		const siblingGap = Math.max(0, finiteNumber$1(options.siblingGap, DEFAULT_SIBLING_GAP));
		const nodePadding = Math.max(0, finiteNumber$1(options.nodePadding, DEFAULT_NODE_PADDING));
		const circles = node.children.map((child) => ({
			node: child,
			x: 0,
			y: 0,
			r: child.localRadius,
			packRadius: child.localRadius
		}));
		packFrontChain(circles, siblingGap);
		resolveCollisions(circles);
		recenterCircles(circles);
		let enclosingRadius = 0;
		circles.forEach((circle) => {
			circle.node.localX = circle.x;
			circle.node.localY = circle.y;
			enclosingRadius = Math.max(enclosingRadius, Math.hypot(circle.x, circle.y) + circle.r);
		});
		node.localRadius = Math.max(Math.sqrt(Math.max(node.value, EPSILON)), enclosingRadius + nodePadding);
		return node.localRadius;
	}
	function packFrontChain(circles, gap) {
		circles.forEach((circle) => {
			circle.packRadius = circle.r + gap / 2;
		});
		if (!circles.length) return;
		circles[0].x = 0;
		circles[0].y = 0;
		if (circles.length === 1) return;
		circles[0].x = -circles[1].packRadius;
		circles[1].x = circles[0].packRadius;
		circles[1].y = 0;
		if (circles.length === 2) return;
		placeTangent(circles[1], circles[0], circles[2]);
		let a = createFrontChainNode(circles[0]);
		let b = createFrontChainNode(circles[1]);
		const c = createFrontChainNode(circles[2]);
		a.next = c;
		c.previous = a;
		c.next = b;
		b.previous = c;
		b.next = a;
		a.previous = b;
		pack: for (let index = 3; index < circles.length; index += 1) {
			const circle = circles[index];
			placeTangent(a.circle, b.circle, circle);
			const node = createFrontChainNode(circle);
			let j = b.next;
			let k = a.previous;
			let guard = 0;
			do {
				if (intersects(j.circle, node.circle)) {
					b = j;
					a.next = b;
					b.previous = a;
					index -= 1;
					continue pack;
				}
				j = j.next;
				guard += 1;
			} while (j !== k.next && guard <= circles.length * 2);
			guard = 0;
			do {
				if (intersects(k.circle, node.circle)) {
					a = k;
					a.next = b;
					b.previous = a;
					index -= 1;
					continue pack;
				}
				k = k.previous;
				guard += 1;
			} while (k !== j.previous && guard <= circles.length * 2);
			node.previous = a;
			node.next = b;
			a.next = node;
			b.previous = node;
			b = node;
			a = findBestFrontChainNode(a);
			b = a.next;
		}
	}
	function resolveCollisions(circles) {
		const maxIterations = Math.max(80, circles.length * 8);
		for (let iteration = 0; iteration < maxIterations; iteration += 1) {
			let largestOverlap = 0;
			for (let leftIndex = 0; leftIndex < circles.length; leftIndex += 1) {
				const left = circles[leftIndex];
				for (let rightIndex = leftIndex + 1; rightIndex < circles.length; rightIndex += 1) {
					const right = circles[rightIndex];
					let dx = right.x - left.x;
					let dy = right.y - left.y;
					let distance = Math.hypot(dx, dy);
					const overlap = left.packRadius + right.packRadius - distance;
					if (overlap <= 0) continue;
					if (distance <= EPSILON) {
						const angle = (leftIndex * 13 + rightIndex * 17 + 1) * Math.PI * (3 - Math.sqrt(5));
						dx = Math.cos(angle);
						dy = Math.sin(angle);
						distance = 1;
					}
					const shift = overlap / 2 + EPSILON;
					const nx = dx / distance;
					const ny = dy / distance;
					left.x -= nx * shift;
					left.y -= ny * shift;
					right.x += nx * shift;
					right.y += ny * shift;
					largestOverlap = Math.max(largestOverlap, overlap);
				}
			}
			recenterCircles(circles);
			if (largestOverlap < .01) return;
		}
	}
	function recenterCircles(circles) {
		if (!circles.length) return;
		const bounds = measureBounds(circles);
		const centerX = (bounds.minX + bounds.maxX) / 2;
		const centerY = (bounds.minY + bounds.maxY) / 2;
		circles.forEach((circle) => {
			circle.x -= centerX;
			circle.y -= centerY;
		});
	}
	function placeTangent(a, b, c) {
		const dx = b.x - a.x;
		const dy = b.y - a.y;
		const distanceSq = dx * dx + dy * dy;
		const aDistanceSq = square(a.packRadius + c.packRadius);
		const bDistanceSq = square(b.packRadius + c.packRadius);
		if (distanceSq <= EPSILON) {
			c.x = a.x + a.packRadius + c.packRadius;
			c.y = a.y;
			return;
		}
		if (aDistanceSq > bDistanceSq) {
			const x = (distanceSq + bDistanceSq - aDistanceSq) / (2 * distanceSq);
			const y = Math.sqrt(Math.max(0, bDistanceSq / distanceSq - x * x));
			c.x = b.x - x * dx - y * dy;
			c.y = b.y - x * dy + y * dx;
			return;
		}
		const x = (distanceSq + aDistanceSq - bDistanceSq) / (2 * distanceSq);
		const y = Math.sqrt(Math.max(0, aDistanceSq / distanceSq - x * x));
		c.x = a.x + x * dx - y * dy;
		c.y = a.y + x * dy + y * dx;
	}
	function intersects(left, right) {
		const dr = left.packRadius + right.packRadius - EPSILON;
		const dx = right.x - left.x;
		const dy = right.y - left.y;
		return dr > 0 && dr * dr > dx * dx + dy * dy;
	}
	function createFrontChainNode(circle) {
		const node = {};
		node.circle = circle;
		node.next = node;
		node.previous = node;
		return node;
	}
	function findBestFrontChainNode(start) {
		let best = start;
		let bestScore = scoreFrontChainNode(best);
		let current = start.next;
		let guard = 0;
		while (current !== start && guard <= 1e4) {
			const score = scoreFrontChainNode(current);
			if (score < bestScore) {
				best = current;
				bestScore = score;
			}
			current = current.next;
			guard += 1;
		}
		return best;
	}
	function scoreFrontChainNode(node) {
		const current = node.circle;
		const next = node.next.circle;
		const radiusSum = current.packRadius + next.packRadius;
		if (radiusSum <= EPSILON) return 0;
		const x = (current.x * next.packRadius + next.x * current.packRadius) / radiusSum;
		const y = (current.y * next.packRadius + next.y * current.packRadius) / radiusSum;
		return x * x + y * y;
	}
	function assignColors(node, colors, depthOffset) {
		const record = isPlainObject$1(node.raw) ? node.raw : {};
		const itemStyle = isPlainObject$1(record.itemStyle) ? record.itemStyle : {};
		const colorDepth = Math.max(0, node.depth - depthOffset);
		node.color = typeof itemStyle.color === "string" ? itemStyle.color : colors[colorDepth % colors.length];
		node.children.forEach((child) => assignColors(child, colors, depthOffset));
	}
	function assignPositions(node, origin, scale) {
		node.x = origin.x;
		node.y = origin.y;
		node.r = node.localRadius * scale;
		node.children.forEach((child) => {
			assignPositions(child, {
				x: origin.x + child.localX * scale,
				y: origin.y + child.localY * scale
			}, scale);
		});
	}
	function toPublicNode(node, rootValue) {
		const publicNode = {
			id: node.id,
			name: node.name,
			value: node.value,
			depth: node.depth,
			parentId: node.parent?.id ?? null,
			children: [],
			dataIndex: node.dataIndex,
			x: node.x,
			y: node.y,
			r: node.r,
			color: node.color,
			percent: rootValue > 0 ? node.value / rootValue : 0,
			synthetic: node.synthetic,
			raw: node.raw
		};
		publicNode.children = node.children.map((child) => toPublicNode(child, rootValue));
		return publicNode;
	}
	function flatten(root) {
		const nodes = [];
		function visit(node) {
			nodes.push(node);
			node.children.forEach(visit);
		}
		visit(root);
		return nodes;
	}
	function flattenPublic(root) {
		const nodes = [];
		function visit(node) {
			nodes.push(node);
			node.children.forEach(visit);
		}
		visit(root);
		return nodes;
	}
	function measureBounds(circles) {
		if (!circles.length) return {
			minX: 0,
			maxX: 0,
			minY: 0,
			maxY: 0,
			width: 0,
			height: 0
		};
		let minX = Infinity;
		let maxX = -Infinity;
		let minY = Infinity;
		let maxY = -Infinity;
		circles.forEach((circle) => {
			minX = Math.min(minX, circle.x - circle.packRadius);
			maxX = Math.max(maxX, circle.x + circle.packRadius);
			minY = Math.min(minY, circle.y - circle.packRadius);
			maxY = Math.max(maxY, circle.y + circle.packRadius);
		});
		return {
			minX,
			maxX,
			minY,
			maxY,
			width: maxX - minX,
			height: maxY - minY
		};
	}
	function resolvePadding(padding) {
		if (isPlainObject$1(padding)) return {
			top: Math.max(0, finiteNumber$1(padding.top, DEFAULT_PADDING)),
			right: Math.max(0, finiteNumber$1(padding.right, DEFAULT_PADDING)),
			bottom: Math.max(0, finiteNumber$1(padding.bottom, DEFAULT_PADDING)),
			left: Math.max(0, finiteNumber$1(padding.left, DEFAULT_PADDING))
		};
		const value = Math.max(0, finiteNumber$1(padding, DEFAULT_PADDING));
		return {
			top: value,
			right: value,
			bottom: value,
			left: value
		};
	}
	function resolveRawPadding(value) {
		if (typeof value === "number" && Number.isFinite(value)) return value;
		if (isPlainObject$1(value)) return value;
	}
	function resolveInnerRect(width, height, padding) {
		return {
			x: padding.left,
			y: padding.top,
			width: Math.max(width - padding.left - padding.right, 1),
			height: Math.max(height - padding.top - padding.bottom, 1)
		};
	}
	function resolveRadius(radius, inner) {
		const maxRadius = Math.max(1, Math.min(inner.width, inner.height) / 2);
		if (typeof radius === "number" && Number.isFinite(radius)) return clamp(radius, 1, maxRadius);
		if (typeof radius === "string" && radius.trim().endsWith("%")) {
			const numeric = Number.parseFloat(radius);
			if (Number.isFinite(numeric)) return clamp(numeric / 100 * maxRadius, 1, maxRadius);
		}
		return maxRadius;
	}
	function resolveCenter(center, width, height, inner) {
		if (!Array.isArray(center)) return {
			x: inner.x + inner.width / 2,
			y: inner.y + inner.height / 2
		};
		return {
			x: resolvePosition(center[0], width, inner.x + inner.width / 2),
			y: resolvePosition(center[1], height, inner.y + inner.height / 2)
		};
	}
	function resolvePosition(value, size, fallback) {
		if (typeof value === "number" && Number.isFinite(value)) return value;
		if (typeof value === "string" && value.trim().endsWith("%")) {
			const numeric = Number.parseFloat(value);
			return Number.isFinite(numeric) ? numeric / 100 * size : fallback;
		}
		return fallback;
	}
	function readChildren(record, childrenField) {
		const explicit = readField(record, childrenField);
		if (Array.isArray(explicit)) return explicit;
		if (childrenField !== "children" && Array.isArray(record.children)) return record.children;
		if (childrenField !== "items" && Array.isArray(record.items)) return record.items;
		return [];
	}
	function readField(record, field) {
		if (field in record) return record[field];
		if (!field.includes(".")) return void 0;
		let current = record;
		for (const part of field.split(".")) {
			if (!isPlainObject$1(current) || !(part in current)) return void 0;
			current = current[part];
		}
		return current;
	}
	function normalizeField(value, fallback) {
		return typeof value === "string" && value ? value : fallback;
	}
	function normalizeSort(value) {
		if (value === false || value === true || value === "none" || value === "value" || value === "name" || value === "asc" || value === "desc") return value;
	}
	function assignDefined(target, key, value) {
		if (value !== void 0) target[key] = value;
	}
	function square(value) {
		return value * value;
	}
	function clamp(value, min, max) {
		if (min > max) return (min + max) / 2;
		return Math.min(Math.max(value, min), max);
	}
	function readNonNegativeNumber(value) {
		if (typeof value !== "number" || !Number.isFinite(value)) return null;
		return Math.max(value, 0);
	}
	function finiteNumber$1(value, fallback) {
		return typeof value === "number" && Number.isFinite(value) ? value : fallback;
	}
	function isPlainObject$1(value) {
		return value != null && typeof value === "object" && !Array.isArray(value);
	}
	//#endregion
	//#region src/circle-packing.ts
	var echartsHost = echarts_lib_echarts;
	var optionKeys = [
		"padding",
		"nodePadding",
		"siblingGap",
		"center",
		"radius",
		"rootName",
		"rootVisible",
		"valueField",
		"nameField",
		"childrenField",
		"sort",
		"colors"
	];
	echartsHost.extendSeriesModel({
		type: "series.circlePacking",
		visualStyleAccessPath: "itemStyle",
		visualDrawType: "fill",
		getInitialData(option) {
			const source = flattenCirclePackingData(option.data, readInitialDataOptions(option));
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
			height: "88%",
			padding: 18,
			nodePadding: 2.5,
			siblingGap: 1.5,
			center: null,
			radius: null,
			rootName: "root",
			rootVisible: null,
			valueField: "value",
			nameField: "name",
			childrenField: "children",
			sort: true,
			colors: DEFAULT_CIRCLE_PACKING_COLORS,
			enterAnimation: true,
			itemStyle: {
				opacity: .88,
				borderColor: "#ffffff",
				borderWidth: 1.2
			},
			label: {
				show: true,
				color: "#101828",
				fontSize: 12,
				fontWeight: 650,
				lineHeight: 14,
				minRadius: 18,
				formatter: null
			},
			emphasis: { itemStyle: {
				shadowBlur: 10,
				shadowColor: "rgba(15, 23, 42, 0.22)"
			} }
		}
	});
	echartsHost.extendChartView({
		type: "circlePacking",
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
				const layout = resolveCirclePackingLayout(readLayoutOption(seriesModel, rect));
				if (this.__renderToken !== renderToken) return;
				const { hoverItems } = renderAlive(this, echartsHost, group, seriesModel, (targetGroup, targetSeriesModel) => drawCirclePacking(echartsHost, targetGroup, targetSeriesModel, layout, rect));
				this.__hoverController = installElementHover(hoverItems, { zrender: api.getZr?.() });
			} catch (error) {
				if (typeof console !== "undefined") console.error("[circlePacking] render failed", error);
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
	function readInitialDataOptions(option) {
		const layoutOption = {
			...isPlainObject(option.layout) ? option.layout : {},
			...isPlainObject(option.layoutOptions) ? option.layoutOptions : {}
		};
		optionKeys.forEach((key) => {
			const value = option[key];
			if (value !== void 0 && value !== null) layoutOption[key] = value;
		});
		return layoutOption;
	}
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
	function drawCirclePacking(echartsInstance, group, seriesModel, layout, rect) {
		const data = seriesModel.getData();
		const chartGroup = new echartsInstance.graphic.Group();
		const hoverItems = [];
		const hoverItemsByDataIndex = /* @__PURE__ */ new Map();
		chartGroup.x = rect.x;
		chartGroup.y = rect.y;
		layout.nodes.forEach((node, index) => {
			if (node.r <= 0) return;
			const itemModel = node.dataIndex >= 0 && node.dataIndex < data.count() ? data.getItemModel(node.dataIndex) : null;
			const circleEl = new echartsInstance.graphic.Circle({
				shape: {
					cx: node.x,
					cy: node.y,
					r: node.r
				},
				style: readNodeStyle(data, seriesModel, itemModel, node, index)
			});
			applyCircleEnterAnimation(circleEl, node.r, readEnterAnimation(seriesModel, index));
			if (itemModel && node.dataIndex >= 0 && node.dataIndex < data.count()) {
				data.setItemLayout(node.dataIndex, [
					node.x,
					node.y,
					node.r
				]);
				data.setItemGraphicEl(node.dataIndex, circleEl);
				const hoverItem = createHoverItem(circleEl);
				hoverItems.push(hoverItem);
				hoverItemsByDataIndex.set(node.dataIndex, hoverItem);
			}
			chartGroup.add(circleEl);
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
			const minRadius = finiteNumber(itemLabelModel?.get("minRadius") ?? seriesLabelModel.get("minRadius"), 18);
			if (!show || node.r < minRadius) return;
			const requestedFontSize = finiteNumber(itemLabelModel?.get("fontSize") ?? seriesLabelModel.get("fontSize"), 12);
			const fontSize = Math.min(requestedFontSize, Math.max(8, node.r * .32));
			const lineHeight = finiteNumber(itemLabelModel?.get("lineHeight") ?? seriesLabelModel.get("lineHeight"), fontSize + 2);
			const text = formatLabel(itemLabelModel?.get("formatter") || seriesLabelModel.get("formatter"), node);
			const textEl = new echartsInstance.graphic.Text({
				style: {
					x: node.x,
					y: node.y,
					text: wrapText(String(text), node.r * 1.5, fontSize, node.r),
					fill: itemLabelModel?.get("color") || seriesLabelModel.get("color") || "#101828",
					fontSize,
					fontWeight: itemLabelModel?.get("fontWeight") || seriesLabelModel.get("fontWeight") || 650,
					lineHeight,
					align: "center",
					verticalAlign: "middle"
				},
				silent: true
			});
			applyFadeEnterAnimation(textEl, readEnterAnimation(seriesModel, node.dataIndex));
			addHoverElement(hoverItemsByDataIndex.get(node.dataIndex), textEl);
			group.add(textEl);
		});
	}
	function readNodeStyle(data, seriesModel, itemModel, node, index) {
		const seriesStyle = asRecord(seriesModel.get("itemStyle"));
		const rawStyle = readRawItemStyle(node.raw);
		const itemStyle = itemModel ? asRecord(itemModel.get("itemStyle")) : rawStyle;
		const visualStyle = node.dataIndex >= 0 && node.dataIndex < data.count() ? asRecord(data.getItemVisual(node.dataIndex, "style")) : {};
		return {
			fill: itemStyle.color || rawStyle.color || seriesStyle.color || visualStyle.fill || node.color || DEFAULT_CIRCLE_PACKING_COLORS[index % DEFAULT_CIRCLE_PACKING_COLORS.length],
			stroke: itemStyle.borderColor || rawStyle.borderColor || seriesStyle.borderColor || "#ffffff",
			lineWidth: finiteNumber(itemStyle.borderWidth ?? rawStyle.borderWidth ?? seriesStyle.borderWidth, 1.2),
			opacity: finiteNumber(itemStyle.opacity ?? rawStyle.opacity ?? seriesStyle.opacity, .88)
		};
	}
	function formatLabel(formatter, node) {
		const params = {
			data: node.raw,
			name: node.name,
			value: node.value,
			percent: node.percent,
			depth: node.depth,
			node
		};
		if (typeof formatter === "function") return formatter(params);
		if (typeof formatter === "string") return formatter.replace(/\{b\}/g, node.name).replace(/\{c\}/g, String(node.value)).replace(/\{d\}/g, String(Math.round(node.percent * 100))).replace(/\{p\}/g, `${Math.round(node.percent * 100)}%`);
		return node.name;
	}
	function wrapText(text, maxWidth, fontSize, radius) {
		const maxChars = Math.max(3, Math.floor(maxWidth / Math.max(fontSize * .56, 1)));
		const maxLines = radius > fontSize * 3.2 ? 2 : 1;
		if (text.length <= maxChars) return text;
		const words = text.split(/\s+/).filter(Boolean);
		const lines = [];
		if (words.length > 1) {
			let current = "";
			words.forEach((word) => {
				const next = current ? `${current} ${word}` : word;
				if (next.length <= maxChars) current = next;
				else {
					if (current) lines.push(current);
					current = word;
				}
			});
			if (current) lines.push(current);
		} else for (let index = 0; index < text.length; index += maxChars) lines.push(text.slice(index, index + maxChars));
		const visible = lines.slice(0, maxLines);
		const usedText = visible.join("").replace(/\s+/g, "");
		const originalText = text.replace(/\s+/g, "");
		if (usedText.length < originalText.length && visible.length) {
			const last = visible[visible.length - 1];
			visible[visible.length - 1] = `${last.slice(0, Math.max(0, maxChars - 3))}...`;
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
					fill: itemStyle.color || DEFAULT_CIRCLE_PACKING_COLORS[dataIndex % DEFAULT_CIRCLE_PACKING_COLORS.length],
					stroke: itemStyle.borderColor || "#ffffff",
					opacity: finiteNumber(itemStyle.opacity, .88)
				};
			}
		};
	}
	function collectDataNames(data) {
		const names = [];
		for (let index = 0; index < data.count(); index++) names.push(data.getName(index));
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
		const stagger = resolveAnimationNumber(option.stagger, itemIndex, itemIndex, 24);
		return {
			enabled: true,
			duration: resolveAnimationNumber(option.duration ?? seriesModel.get("animationDuration"), itemIndex, itemIndex, 580),
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
	function finiteNumber(value, fallback) {
		return typeof value === "number" && Number.isFinite(value) ? value : fallback;
	}
	function isPlainObject(value) {
		return value != null && typeof value === "object" && !Array.isArray(value);
	}
	function asRecord(value) {
		return isPlainObject(value) ? value : {};
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

//# sourceMappingURL=echarts-circle-packing.js.map