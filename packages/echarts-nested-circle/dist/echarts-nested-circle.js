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
	var DEFAULT_PADDING = 20;
	var DEFAULT_RING_COLORS = [
		"#d7e4ff",
		"#c4d3fb",
		"#abbcf5",
		"#94a7ee",
		"#7e92e8",
		"#697ee2",
		"#566ddd",
		"#485fd4"
	];
	function resolveNestedCircleLayout(option = {}) {
		return layoutNestedCircle(Array.isArray(option.data) ? option.data : [], {
			...isPlainObject(option.layout) ? option.layout : {},
			...isPlainObject(option.layoutOptions) ? option.layoutOptions : {},
			width: finiteNumber$1(option.width, void 0),
			height: finiteNumber$1(option.height, void 0),
			padding: finiteNumber$1(option.padding, void 0),
			center: Array.isArray(option.center) ? option.center : void 0,
			radius: option.radius,
			centerRadiusRatio: finiteNumber$1(option.centerRadiusRatio, void 0),
			labelRadiusRatio: finiteNumber$1(option.labelRadiusRatio, void 0),
			titleRadiusRatio: finiteNumber$1(option.titleRadiusRatio, void 0),
			minRingThickness: finiteNumber$1(option.minRingThickness, void 0),
			colors: Array.isArray(option.colors) ? option.colors.filter((color) => typeof color === "string") : void 0
		});
	}
	function layoutNestedCircle(data, options = {}) {
		const width = finiteNumber$1(options.width, DEFAULT_WIDTH);
		const height = finiteNumber$1(options.height, DEFAULT_HEIGHT);
		const padding = Math.max(0, finiteNumber$1(options.padding, DEFAULT_PADDING));
		const maxRadius = resolveRadius(options.radius, width, height, padding);
		const center = resolveOuterCenter(options.center, width, height, padding, maxRadius);
		const bottomY = center.y + maxRadius;
		const rings = normalizeRings(data);
		const ringCount = Math.max(rings.length, 1);
		const innerCircleRadius = resolveInnerCircleRadius(maxRadius, ringCount, clamp(finiteNumber$1(options.centerRadiusRatio, .28), .14, .74), Math.max(0, finiteNumber$1(options.minRingThickness, 0)));
		const band = ringCount <= 1 ? maxRadius : (maxRadius - innerCircleRadius) / (ringCount - 1);
		const colors = options.colors?.length ? options.colors : DEFAULT_RING_COLORS;
		const layoutRings = (rings.length ? rings : [createEmptyRing()]).map((ring, index) => {
			const innerRadius = index === 0 ? 0 : index === 1 ? innerCircleRadius : innerCircleRadius + band * (index - 1);
			const outerRadius = ringCount === 1 ? maxRadius : index === 0 ? innerCircleRadius : innerCircleRadius + band * index;
			const thickness = Math.max(outerRadius - innerRadius, 1);
			const x = center.x;
			const y = bottomY - outerRadius;
			const titleDistance = resolveTitleDistance(index, outerRadius, options.titleRadiusRatio);
			const halfChord = Math.sqrt(Math.max(outerRadius * outerRadius - titleDistance * titleDistance, 0));
			return {
				id: ring.id,
				name: ring.name,
				value: ring.value,
				dataIndex: ring.dataIndex,
				x,
				y,
				innerRadius,
				outerRadius,
				titleX: x,
				titleY: y - titleDistance,
				titleMaxWidth: Math.max(48, Math.min(halfChord * 2 - thickness * .2, outerRadius * 1.4)),
				color: ring.color || colors[index % colors.length],
				raw: ring.raw
			};
		});
		return {
			width,
			height,
			center,
			radius: maxRadius,
			rings: layoutRings,
			labels: layoutRings.flatMap((ring, ringIndex) => {
				return layoutLabelsForRing(rings[ringIndex] || createEmptyRing(), ring, layoutRings[ringIndex - 1], ringIndex, options);
			})
		};
	}
	function layoutLabelsForRing(sourceRing, ring, previousRing, ringIndex, options) {
		const count = sourceRing.children.length;
		if (!count) return [];
		if (ringIndex === 0) return layoutCenterLabels(sourceRing, ring);
		const thickness = Math.max(ring.outerRadius - ring.innerRadius, 1);
		const labelRadiusRatio = clamp(finiteNumber$1(options.labelRadiusRatio, .68), .35, .94);
		const maxWidth = Math.max(54, Math.min(Math.max(thickness * 3.15, ring.outerRadius * .32), ring.outerRadius * .92));
		const angles = distributeAngles(count, ringIndex === 0, ringIndex);
		return sourceRing.children.map((child, childIndex) => {
			const angle = angles[childIndex];
			const point = placeLabelPoint(ring, previousRing, angle, clamp(ring.outerRadius * labelRadiusRatio + (count < 4 ? 0 : (childIndex % 3 - 1) * thickness * .18), ring.outerRadius * .34, ring.outerRadius * .92));
			return {
				id: `${sourceRing.id}-${child.id}`,
				name: child.name,
				value: child.value,
				ringIndex,
				dataIndex: sourceRing.dataIndex,
				childIndex,
				x: point.x,
				y: point.y,
				angle,
				maxWidth,
				raw: child.raw
			};
		});
	}
	function layoutCenterLabels(sourceRing, ring) {
		const count = sourceRing.children.length;
		const columns = count <= 3 ? 1 : 2;
		const rows = Math.ceil(count / columns);
		const xGap = columns === 1 ? 0 : ring.outerRadius * .95;
		const yStart = count <= 2 ? .2 : .15;
		const ySpan = rows <= 1 ? 0 : count <= 4 ? .4 : .62;
		const maxWidth = Math.max(68, ring.outerRadius * (columns === 1 ? 1.08 : .78));
		return sourceRing.children.map((child, childIndex) => {
			const column = childIndex % columns;
			const row = Math.floor(childIndex / columns);
			const x = ring.x + (column - (columns - 1) / 2) * xGap;
			const y = ring.y + ring.outerRadius * (yStart + (rows <= 1 ? 0 : row / (rows - 1) * ySpan));
			return {
				id: `${sourceRing.id}-${child.id}`,
				name: child.name,
				value: child.value,
				ringIndex: 0,
				dataIndex: sourceRing.dataIndex,
				childIndex,
				x,
				y,
				angle: Math.atan2(y - ring.y, x - ring.x) / Math.PI * 180,
				maxWidth,
				raw: child.raw
			};
		});
	}
	function distributeAngles(count, isCenter, ringIndex) {
		if (count <= 1) return [90];
		if (isCenter) {
			const start = 20;
			const span = 160;
			return Array.from({ length: count }, (_, index) => start + span * index / (count - 1));
		}
		const offset = (ringIndex % 3 - 1) * 3;
		const leftCount = Math.ceil(count / 2);
		const rightCount = count - leftCount;
		const left = spreadAngles(leftCount, -176 + offset, -124 + offset);
		const right = spreadAngles(rightCount, -56 - offset, -8 - offset);
		return [...left, ...right].map(normalizeAngle);
	}
	function spreadAngles(count, start, end) {
		if (count <= 0) return [];
		if (count === 1) return [(start + end) / 2];
		return Array.from({ length: count }, (_, index) => start + (end - start) * index / (count - 1));
	}
	function placeLabelPoint(ring, previousRing, angle, radius) {
		const radians = angle / 180 * Math.PI;
		const margin = previousRing ? Math.min(Math.max(ring.outerRadius - previousRing.outerRadius, 1) * .22, 14) : 0;
		let currentRadius = radius;
		for (let attempt = 0; attempt < 9; attempt++) {
			const point = {
				x: ring.x + Math.cos(radians) * currentRadius,
				y: ring.y + Math.sin(radians) * currentRadius
			};
			if (!previousRing || Math.hypot(point.x - previousRing.x, point.y - previousRing.y) >= previousRing.outerRadius + margin) return point;
			currentRadius = Math.min(ring.outerRadius * .94, currentRadius + ring.outerRadius * .045);
		}
		return {
			x: ring.x + Math.cos(radians) * currentRadius,
			y: ring.y + Math.sin(radians) * currentRadius
		};
	}
	function normalizeAngle(angle) {
		let normalized = angle % 360;
		if (normalized > 180) normalized -= 360;
		if (normalized < -180) normalized += 360;
		return normalized;
	}
	function resolveInnerCircleRadius(maxRadius, ringCount, centerRadiusRatio, minRingThickness) {
		if (ringCount <= 1) return maxRadius;
		const preferred = maxRadius * centerRadiusRatio;
		if (!minRingThickness) return preferred;
		const largestCenter = Math.max(maxRadius - minRingThickness * (ringCount - 1), maxRadius * .14);
		return Math.min(preferred, largestCenter);
	}
	function resolveTitleDistance(index, outerRadius, explicitRatio) {
		return outerRadius * clamp(finiteNumber$1(explicitRatio, index === 0 ? .36 : .82), .08, .9);
	}
	function resolveOuterCenter(center, width, height, padding, radius) {
		if (!Array.isArray(center)) return {
			x: width / 2,
			y: height - padding - radius
		};
		return {
			x: parsePercent(center[0], width, width / 2),
			y: parsePercent(center[1], height, height - padding - radius)
		};
	}
	function resolveRadius(radius, width, height, padding) {
		const maxRadius = Math.max(Math.min(width, height) / 2 - padding, 1);
		if (typeof radius === "number" && Number.isFinite(radius) && radius > 0) return Math.min(radius, maxRadius);
		if (typeof radius === "string") return clamp(parsePercent(radius, Math.min(width, height) / 2, maxRadius), 1, maxRadius);
		return maxRadius;
	}
	function normalizeRings(data) {
		return data.map((item, dataIndex) => normalizeRing(item, dataIndex));
	}
	function normalizeRing(item, dataIndex) {
		const record = arrayToRing(item) ?? (isPlainObject(item) ? item : {});
		const name = resolveName(record, dataIndex);
		const children = normalizeChildren(record.children ?? record.items);
		const itemStyle = isPlainObject(record.itemStyle) ? record.itemStyle : {};
		return {
			id: String(record.id ?? name),
			name,
			value: Array.isArray(record.value) ? record.value[0] : record.value,
			children,
			dataIndex,
			color: typeof itemStyle.color === "string" ? itemStyle.color : void 0,
			raw: item
		};
	}
	function normalizeChildren(children) {
		if (!Array.isArray(children)) return [];
		return children.map((child, childIndex) => {
			const record = isPlainObject(child) ? child : {};
			const name = isPlainObject(child) ? resolveName(record, childIndex) : String(child);
			return {
				id: String(record.id ?? name),
				name,
				value: isPlainObject(child) ? Array.isArray(record.value) ? record.value[0] : record.value : child,
				childIndex,
				raw: child
			};
		});
	}
	function arrayToRing(item) {
		if (!Array.isArray(item)) return null;
		return {
			name: item[0],
			children: item[1],
			value: item[2]
		};
	}
	function resolveName(record, fallbackIndex) {
		const label = record.label;
		const labelName = typeof label === "string" || typeof label === "number" ? label : void 0;
		return String(record.name ?? labelName ?? record.id ?? fallbackIndex);
	}
	function createEmptyRing() {
		return {
			id: "nested-circle",
			name: "Nested Circle",
			value: void 0,
			children: [],
			dataIndex: 0,
			raw: null
		};
	}
	function parsePercent(value, max, fallback) {
		if (typeof value === "number" && Number.isFinite(value)) return value;
		if (typeof value === "string") {
			const trimmed = value.trim();
			if (trimmed.endsWith("%")) {
				const percent = Number(trimmed.slice(0, -1));
				if (Number.isFinite(percent)) return percent / 100 * max;
			}
			const parsed = Number(trimmed);
			if (Number.isFinite(parsed)) return parsed;
		}
		return fallback;
	}
	function finiteNumber$1(value, fallback) {
		return typeof value === "number" && Number.isFinite(value) ? value : fallback;
	}
	function clamp(value, min, max) {
		return Math.min(Math.max(value, min), max);
	}
	function isPlainObject(value) {
		return value != null && typeof value === "object" && !Array.isArray(value);
	}
	//#endregion
	//#region src/nested-circle.ts
	var echartsHost = echarts_lib_echarts;
	var optionKeys = [
		"padding",
		"center",
		"radius",
		"centerRadiusRatio",
		"labelRadiusRatio",
		"titleRadiusRatio",
		"minRingThickness",
		"colors"
	];
	echartsHost.extendSeriesModel({
		type: "series.nestedCircle",
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
			height: "86%",
			padding: 12,
			center: null,
			radius: null,
			centerRadiusRatio: .28,
			labelRadiusRatio: null,
			titleRadiusRatio: null,
			minRingThickness: 22,
			colors: DEFAULT_RING_COLORS,
			enterAnimation: true,
			ringStyle: {
				opacity: 1,
				borderColor: "rgba(30, 58, 138, 0.34)",
				borderWidth: 1
			},
			itemStyle: {
				opacity: 1,
				borderColor: "rgba(30, 58, 138, 0.34)",
				borderWidth: 1
			},
			titleLabel: {
				show: true,
				color: "#0f172a",
				fontSize: 18,
				fontWeight: 700,
				lineHeight: 22,
				formatter: null
			},
			label: {
				show: true,
				color: "#111827",
				fontSize: 10,
				fontWeight: 500,
				lineHeight: 12,
				formatter: null
			},
			emphasis: { itemStyle: {
				shadowBlur: 12,
				shadowColor: "rgba(30, 58, 138, 0.2)"
			} }
		}
	});
	echartsHost.extendChartView({
		type: "nestedCircle",
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
				const layout = resolveNestedCircleLayout(readLayoutOption(seriesModel, rect));
				if (this.__renderToken !== renderToken) return;
				const { hoverItems } = renderAlive(this, echartsHost, group, seriesModel, (targetGroup, targetSeriesModel) => drawNestedCircle(echartsHost, targetGroup, targetSeriesModel, layout, rect));
				this.__hoverController = installElementHover(hoverItems, { zrender: api.getZr?.() });
			} catch (error) {
				if (typeof console !== "undefined") console.error("[nestedCircle] render failed", error);
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
	function drawNestedCircle(echartsInstance, group, seriesModel, layout, rect) {
		const data = seriesModel.getData();
		const chartGroup = new echartsInstance.graphic.Group();
		const hoverItems = [];
		const hoverItemsByDataIndex = /* @__PURE__ */ new Map();
		chartGroup.x = rect.x;
		chartGroup.y = rect.y;
		for (let index = layout.rings.length - 1; index >= 0; index--) {
			const ring = layout.rings[index];
			const itemModel = getRingItemModel(data, ring);
			const circleEl = new echartsInstance.graphic.Circle({
				shape: {
					cx: ring.x,
					cy: ring.y,
					r: ring.outerRadius
				},
				style: readRingStyle(data, seriesModel, itemModel, ring, index)
			});
			applyCircleEnterAnimation(circleEl, ring.outerRadius, readEnterAnimation(seriesModel, index));
			if (ring.dataIndex >= 0 && ring.dataIndex < data.count()) {
				data.setItemLayout(ring.dataIndex, [ring.x, ring.y]);
				data.setItemGraphicEl(ring.dataIndex, circleEl);
				const hoverItem = createHoverItem(circleEl);
				hoverItems.push(hoverItem);
				hoverItemsByDataIndex.set(ring.dataIndex, hoverItem);
			}
			chartGroup.add(circleEl);
		}
		drawRingTitles(echartsInstance, chartGroup, seriesModel, data, layout.rings, hoverItemsByDataIndex);
		drawLabels(echartsInstance, chartGroup, seriesModel, layout.labels, hoverItemsByDataIndex);
		group.add(chartGroup);
		return hoverItems;
	}
	function drawRingTitles(echartsInstance, group, seriesModel, data, rings, hoverItemsByDataIndex) {
		rings.forEach((ring) => {
			const itemModel = getRingItemModel(data, ring);
			const seriesLabelModel = seriesModel.getModel("titleLabel");
			const itemLabelModel = itemModel?.getModel("titleLabel");
			if (!(itemLabelModel?.get("show") ?? seriesLabelModel.get("show"))) return;
			const text = formatLabel(itemLabelModel?.get("formatter") || seriesLabelModel.get("formatter"), {
				name: ring.name,
				value: ring.value,
				data: ring
			});
			const thickness = Math.max(ring.outerRadius - ring.innerRadius, 1);
			const requestedFontSize = finiteNumber(itemLabelModel?.get("fontSize") ?? seriesLabelModel.get("fontSize"), 18);
			const fontSize = Math.min(requestedFontSize, Math.max(12, thickness * .42));
			const maxChars = Math.max(8, Math.floor(ring.titleMaxWidth / Math.max(fontSize * .56, 1)));
			const titleEl = new echartsInstance.graphic.Text({
				style: {
					x: ring.titleX,
					y: ring.titleY,
					text: wrapText(String(text), maxChars),
					fill: itemLabelModel?.get("color") || seriesLabelModel.get("color") || "#0f172a",
					fontSize,
					fontWeight: itemLabelModel?.get("fontWeight") || seriesLabelModel.get("fontWeight") || 700,
					lineHeight: Math.min(finiteNumber(itemLabelModel?.get("lineHeight") ?? seriesLabelModel.get("lineHeight"), fontSize + 4), fontSize + 4),
					align: "center",
					verticalAlign: "middle"
				},
				silent: true
			});
			applyFadeEnterAnimation(titleEl, readEnterAnimation(seriesModel, ring.dataIndex));
			addHoverElement(hoverItemsByDataIndex.get(ring.dataIndex), titleEl);
			group.add(titleEl);
		});
	}
	function drawLabels(echartsInstance, group, seriesModel, labels, hoverItemsByDataIndex) {
		const seriesLabelModel = seriesModel.getModel("label");
		if (!seriesLabelModel.get("show")) return;
		labels.forEach((label) => {
			const rawLabel = asRecord(asRecord(label.raw).label);
			const formatter = rawLabel.formatter || seriesLabelModel.get("formatter");
			const requestedFontSize = finiteNumber(rawLabel.fontSize ?? seriesLabelModel.get("fontSize"), 10);
			const fontSize = Math.min(requestedFontSize, 10);
			const maxChars = Math.max(7, Math.min(18, Math.floor(label.maxWidth / Math.max(fontSize * .52, 1))));
			const text = formatLabel(formatter, {
				name: label.name,
				value: label.value,
				data: label
			});
			const labelEl = new echartsInstance.graphic.Text({
				style: {
					x: label.x,
					y: label.y,
					text: wrapText(String(text), maxChars),
					fill: rawLabel.color || seriesLabelModel.get("color") || "#111827",
					fontSize,
					fontWeight: rawLabel.fontWeight || seriesLabelModel.get("fontWeight") || 500,
					lineHeight: Math.min(finiteNumber(rawLabel.lineHeight ?? seriesLabelModel.get("lineHeight"), fontSize + 2), fontSize + 2),
					align: "center",
					verticalAlign: "middle"
				},
				silent: true
			});
			applyFadeEnterAnimation(labelEl, readEnterAnimation(seriesModel, label.dataIndex));
			addHoverElement(hoverItemsByDataIndex.get(label.dataIndex), labelEl);
			group.add(labelEl);
		});
	}
	function getRingItemModel(data, ring) {
		return ring.dataIndex >= 0 && ring.dataIndex < data.count() ? data.getItemModel(ring.dataIndex) : null;
	}
	function readRingStyle(data, seriesModel, itemModel, ring, index) {
		const ringStyle = asRecord(seriesModel.get("ringStyle"));
		const seriesItemStyle = asRecord(seriesModel.get("itemStyle"));
		const itemStyle = itemModel ? asRecord(itemModel.get("itemStyle")) : {};
		const visualStyle = ring.dataIndex >= 0 && ring.dataIndex < data.count() ? asRecord(data.getItemVisual(ring.dataIndex, "style")) : {};
		const colors = Array.isArray(seriesModel.get("colors")) ? seriesModel.get("colors").filter((color) => typeof color === "string") : DEFAULT_RING_COLORS;
		return {
			fill: itemStyle.color || visualStyle.fill || ring.color || colors[index % colors.length],
			stroke: itemStyle.borderColor || ringStyle.borderColor || seriesItemStyle.borderColor || "rgba(30, 58, 138, 0.34)",
			lineWidth: finiteNumber(itemStyle.borderWidth ?? ringStyle.borderWidth ?? seriesItemStyle.borderWidth, 1),
			opacity: finiteNumber(itemStyle.opacity ?? ringStyle.opacity ?? seriesItemStyle.opacity, 1)
		};
	}
	function formatLabel(formatter, params) {
		if (typeof formatter === "function") return formatter(params);
		if (typeof formatter === "string") return formatter.replace(/\{b\}/g, params.name).replace(/\{c\}/g, String(params.value ?? ""));
		return params.name;
	}
	function wrapText(value, maxChars) {
		if (value.length <= maxChars) return value;
		const words = value.split(/\s+/).filter(Boolean);
		if (words.length <= 1) return wrapLongWord(value, maxChars).join("\n");
		const lines = [];
		let current = "";
		words.forEach((word) => {
			const next = current ? `${current} ${word}` : word;
			if (next.length <= maxChars) {
				current = next;
				return;
			}
			if (current) lines.push(current);
			if (word.length > maxChars) {
				const wrapped = wrapLongWord(word, maxChars);
				lines.push(...wrapped.slice(0, -1));
				current = wrapped[wrapped.length - 1] || "";
			} else current = word;
		});
		if (current) lines.push(current);
		return lines.join("\n");
	}
	function wrapLongWord(value, maxChars) {
		const size = Math.max(maxChars, 1);
		const lines = [];
		for (let index = 0; index < value.length; index += size) lines.push(value.slice(index, index + size));
		return lines;
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
					fill: itemStyle.color || DEFAULT_RING_COLORS[dataIndex % DEFAULT_RING_COLORS.length],
					stroke: itemStyle.borderColor || "rgba(30, 58, 138, 0.34)",
					opacity: finiteNumber(itemStyle.opacity, 1)
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
		const stagger = resolveAnimationNumber(option.stagger, itemIndex, itemIndex, 70);
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

//# sourceMappingURL=echarts-nested-circle.js.map