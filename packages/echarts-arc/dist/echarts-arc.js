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
	//#region ../echarts-layout-core/lib/graph-utils.js
	function buildLayoutGraph(graph) {
		const nodes = graph.nodes.map((node, index) => ({
			...node,
			x: finiteNumber$2(node.x, 0),
			y: finiteNumber$2(node.y, 0),
			__index: index
		}));
		const nodeById = new Map(nodes.map((node) => [node.id, node]));
		return {
			nodes,
			edges: graph.edges.filter((edge) => nodeById.has(edge.source) && nodeById.has(edge.target)),
			nodeById,
			indexById: new Map(nodes.map((node, index) => [node.id, index]))
		};
	}
	function normalizeViewport(options = {}) {
		const width = finiteNumber$2(options.width, 0);
		const height = finiteNumber$2(options.height, 0);
		return {
			width,
			height,
			center: Array.isArray(options.center) ? [finiteNumber$2(options.center[0], width / 2), finiteNumber$2(options.center[1], height / 2)] : [width / 2, height / 2]
		};
	}
	function applySingleNodeLayout(graph, center) {
		return {
			nodes: graph.nodes.map((node) => ({
				...node,
				x: center[0],
				y: center[1]
			})),
			edges: graph.edges
		};
	}
	function degreeMap(graph) {
		const degrees = new Map(graph.nodes.map((node) => [node.id, 0]));
		graph.edges.forEach((edge) => {
			degrees.set(edge.source, (degrees.get(edge.source) || 0) + 1);
			degrees.set(edge.target, (degrees.get(edge.target) || 0) + 1);
		});
		return degrees;
	}
	function allPairsShortestPaths(graph) {
		const n = graph.nodes.length;
		const distances = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => i === j ? 0 : Infinity));
		graph.edges.forEach((edge) => {
			const source = graph.indexById.get(edge.source);
			const target = graph.indexById.get(edge.target);
			if (source == null || target == null) return;
			distances[source][target] = 1;
			distances[target][source] = 1;
		});
		for (let k = 0; k < n; k++) for (let i = 0; i < n; i++) {
			const dik = distances[i][k];
			if (dik === Infinity) continue;
			for (let j = 0; j < n; j++) {
				const next = dik + distances[k][j];
				if (next < distances[i][j]) distances[i][j] = next;
			}
		}
		return distances;
	}
	function replaceInfinity(distances, fallbackStep = 1) {
		let max = 0;
		distances.forEach((row) => {
			row.forEach((value) => {
				if (value !== Infinity && value > max) max = value;
			});
		});
		const fallback = max + fallbackStep;
		return distances.map((row, i) => row.map((value, j) => {
			if (i === j) return 0;
			return value === Infinity ? fallback : value;
		}));
	}
	function getNodeSize(node, options = {}, defaults = {}) {
		const spacing = resolveNodeSpacing(node, options.nodeSpacing, defaults.nodeSpacing);
		const data = asRecord$2(node.data);
		const value = node.symbolSize ?? node.size ?? data?.symbolSize ?? data?.size ?? options.nodeSize ?? defaults.nodeSize ?? 20;
		let size;
		if (typeof value === "function") size = value(node);
		else if (Array.isArray(value)) size = Math.max(...value.map((item) => finiteNumber$2(item, 0)));
		else size = finiteNumber$2(value, 20);
		return Math.max(0, size + spacing);
	}
	function createSorter(sortBy, degrees) {
		if (!sortBy || sortBy === "degree") return (node) => degrees.get(node.id) || 0;
		if (sortBy === "data") return (node) => -node.__index;
		if (typeof sortBy === "function") return (node) => toSortableNumber(sortBy(node));
		if (typeof sortBy === "string") return (node) => toSortableNumber(readNodeSortValue(node, sortBy));
		return () => 0;
	}
	function toPublicResult(graph) {
		return {
			nodes: graph.nodes.map((node) => {
				const { __index, __raw, ...rest } = node;
				return rest;
			}),
			edges: graph.edges
		};
	}
	function finiteNumber$2(value, fallback) {
		return Number.isFinite(value) ? value : fallback;
	}
	function toSortableNumber(value) {
		if (Number.isFinite(value)) return value;
		if (typeof value === "string") {
			let score = 0;
			for (let i = 0; i < value.length; i++) score += value.charCodeAt(i) / (i + 1);
			return score;
		}
		return 0;
	}
	function resolveNodeSpacing(node, value, fallbackValue) {
		if (typeof value === "function") return Math.max(0, finiteNumber$2(value(node), 0));
		if (Number.isFinite(value)) return Math.max(0, value);
		if (typeof fallbackValue === "function") return Math.max(0, finiteNumber$2(fallbackValue(node), 0));
		return Math.max(0, finiteNumber$2(fallbackValue, 0));
	}
	function readNodeSortValue(node, path) {
		if (path.includes(".")) return path.split(".").reduce((value, key) => {
			if (value == null || typeof value !== "object") return void 0;
			return value[key];
		}, node);
		if (Object.prototype.hasOwnProperty.call(node, path)) return node[path];
		const data = asRecord$2(node.data);
		if (data && Object.prototype.hasOwnProperty.call(data, path)) return data[path];
		return node[path];
	}
	function asRecord$2(value) {
		return value != null && typeof value === "object" && !Array.isArray(value) ? value : null;
	}
	//#endregion
	//#region ../echarts-layout-core/lib/arc.js
	function computeArcLayout(input, options = {}) {
		const graph = buildLayoutGraph(input);
		const { width, height, center } = normalizeViewport(options);
		const nodeSep = finiteNumber$2(options.nodeSep, 20);
		const nodeSize = finiteNumber$2(options.nodeSize, 20);
		const hasViewport = Array.isArray(options.center) || width > 0 || height > 0;
		if (graph.nodes.length <= 1) return hasViewport ? applySingleNodeLayout(graph, center) : toPublicResult(graph);
		const nodeSizes = graph.nodes.map((node) => getNodeSize(node, options, { nodeSize }));
		const totalWidth = nodeSizes.reduce((sum, size) => sum + size, 0) + nodeSep * (graph.nodes.length - 1);
		let cursor = hasViewport ? center[0] - totalWidth / 2 : -nodeSizes[0] / 2;
		const y = hasViewport ? center[1] : 0;
		graph.nodes.forEach((node, index) => {
			cursor += nodeSizes[index] / 2;
			node.x = cursor;
			node.y = y;
			cursor += nodeSizes[index] / 2 + nodeSep;
		});
		return toPublicResult(graph);
	}
	function createArcPath(sourcePoint, targetPoint) {
		const [sx, sy] = sourcePoint;
		const [tx, ty] = targetPoint;
		const r = Math.abs(tx - sx) / 2;
		return [[
			"M",
			sx,
			sy
		], [
			"A",
			r,
			r,
			0,
			0,
			sx < tx ? 1 : 0,
			tx,
			ty
		]];
	}
	function createArcBezierShape(sourcePoint, targetPoint) {
		const [sx, sy] = sourcePoint;
		const [tx, ty] = targetPoint;
		const dx = tx - sx;
		const lift = Math.max(Math.abs(dx) / 2, 24);
		return {
			x1: sx,
			y1: sy,
			x2: tx,
			y2: ty,
			cpx1: sx,
			cpy1: sy - lift,
			cpx2: tx,
			cpy2: ty - lift
		};
	}
	function pathToString(path) {
		return path.map((segment) => segment.join(" ")).join(" ");
	}
	//#endregion
	//#region ../echarts-layout-core/lib/data.js
	function normalizeGraphData(input = {}) {
		const nodes = (input.nodes || input.data || []).map((node, index) => normalizeNode(node, index));
		const nodeById = new Map(nodes.map((node) => [node.id, node]));
		return {
			nodes,
			edges: (input.edges || input.links || []).map((edge, index) => normalizeEdge(edge, index, nodes)).filter((edge) => edge.source && edge.target && nodeById.has(edge.source) && nodeById.has(edge.target))
		};
	}
	function normalizeNode(node, index) {
		const raw = isPlainObject(node) ? node : { value: node };
		const id = raw.id ?? raw.name ?? index;
		return {
			...raw,
			id: String(id),
			name: raw.name ?? String(id),
			__ecIndex: index,
			__raw: node
		};
	}
	function normalizeEdge(edge, index, nodes) {
		const raw = isPlainObject(edge) ? edge : {};
		const source = resolveEndpoint(raw.source, nodes);
		const target = resolveEndpoint(raw.target, nodes);
		return {
			...raw,
			id: String(raw.id ?? `${source}-${target}-${index}`),
			source,
			target
		};
	}
	function resolveEndpoint(endpoint, nodes) {
		if (endpoint == null) return "";
		if (typeof endpoint === "number" && nodes[endpoint]) return nodes[endpoint].id;
		return String(endpoint);
	}
	function isPlainObject(value) {
		return value != null && typeof value === "object" && !Array.isArray(value);
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
		const explicitDuration = finiteNumber$1(options.duration, NaN);
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
			duration: finiteNumber$1(readModelValue(model, "animationDurationUpdate"), finiteNumber$1(readModelValue(model, "animationDuration"), DEFAULT_UPDATE_DURATION)),
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
			const targetStyle = cloneRecord$1(asRecord$1(displayable.style));
			const originalOpacity = finiteNumber$1(targetStyle.opacity, 1);
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
		if (element.shape) target.shape = cloneRecord$1(element.shape);
		if (element.style) target.style = cloneRecord$1(element.style);
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
	function cloneRecord$1(record) {
		return { ...record };
	}
	function asRecord$1(value) {
		return value != null && typeof value === "object" && !Array.isArray(value) ? value : {};
	}
	function finiteNumber$1(value, fallback) {
		return typeof value === "number" && Number.isFinite(value) ? value : fallback;
	}
	//#endregion
	//#region ../echarts-layout-core/lib/concentric-layout.js
	var DEFAULT_START_ANGLE = 3 / 2 * Math.PI;
	function computeConcentricLayout(input, options = {}) {
		const graph = buildLayoutGraph(input);
		const { width, height, center } = normalizeViewport(options);
		if (graph.nodes.length <= 1) return applySingleNodeLayout(graph, center);
		const degrees = degreeMap(graph);
		const sortValue = createSorter(options.sortBy || "degree", degrees);
		const nodes = graph.nodes.slice().sort((left, right) => sortValue(right) - sortValue(left) || left.__index - right.__index);
		const maxValue = sortValue(nodes[0]);
		const configuredMaxLevelDiff = options.maxLevelDiff;
		const levels = createLevels(nodes, sortValue, typeof configuredMaxLevelDiff === "number" && Number.isFinite(configuredMaxLevelDiff) && configuredMaxLevelDiff > 0 ? configuredMaxLevelDiff : Math.max(Math.abs(maxValue) / 4, 1));
		levels.forEach((level) => {
			level.nodeSizes = level.nodes.map((node) => getNodeSize(node, options, {
				nodeSize: 30,
				nodeSpacing: 10
			}));
			level.maxNodeSize = Math.max(...level.nodeSizes, 0);
			level.dTheta = (options.sweep === void 0 ? 2 * Math.PI - 2 * Math.PI / Math.max(level.nodes.length, 1) : options.sweep) / Math.max(1, level.nodes.length - 1);
		});
		assignConcentricRadii(levels, options, width, height);
		const configuredStartAngle = options.startAngle;
		const startAngle = typeof configuredStartAngle === "number" && Number.isFinite(configuredStartAngle) ? configuredStartAngle : DEFAULT_START_ANGLE;
		const clockwise = options.clockwise !== false;
		levels.forEach((level) => {
			const radius = level.r || 0;
			level.nodes.forEach((node, index) => {
				const theta = startAngle + (clockwise ? 1 : -1) * (level.dTheta || 0) * index;
				node.x = center[0] + radius * Math.cos(theta);
				node.y = center[1] + radius * Math.sin(theta);
			});
		});
		return toPublicResult(graph);
	}
	function createLevels(nodes, sortValue, maxLevelDiff) {
		const levels = [{
			nodes: [],
			nodeSizes: [],
			maxNodeSize: 0,
			dTheta: 0,
			r: 0
		}];
		let current = levels[0];
		nodes.forEach((node) => {
			if (current.nodes.length) {
				const first = current.nodes[0];
				if (Math.abs(sortValue(first) - sortValue(node)) >= maxLevelDiff) {
					current = {
						nodes: [],
						nodeSizes: [],
						maxNodeSize: 0,
						dTheta: 0,
						r: 0
					};
					levels.push(current);
				}
			}
			current.nodes.push(node);
		});
		return levels;
	}
	function assignConcentricRadii(levels, options, width, height) {
		if (options.preventOverlap) {
			let radius = 0;
			levels.forEach((level, index) => {
				if (level.nodes.length > 1) {
					let requiredDistance = 0;
					for (let i = 0; i < level.nodeSizes.length - 1; i++) requiredDistance = Math.max(requiredDistance, (level.nodeSizes[i] + level.nodeSizes[i + 1]) / 2);
					const dcos = Math.cos(level.dTheta || 0) - 1;
					const dsin = Math.sin(level.dTheta || 0);
					const denominator = Math.sqrt(dcos * dcos + dsin * dsin);
					radius = Math.max(radius, denominator > 0 ? requiredDistance / denominator : 0);
				}
				level.r = radius;
				const nextLevel = levels[index + 1];
				if (nextLevel) radius += ((level.maxNodeSize || 0) + (nextLevel.maxNodeSize || 0)) / 2;
			});
		} else {
			let radius = 0;
			levels[0].r = 0;
			for (let index = 1; index < levels.length; index++) {
				const previous = levels[index - 1];
				const current = levels[index];
				radius += Math.max(1, ((previous.maxNodeSize || 0) + (current.maxNodeSize || 0)) / 2);
				current.r = radius;
			}
		}
		if (options.equidistant) {
			const gap = Math.max(...levels.map((level, index) => index === 0 ? level.r || 0 : (level.r || 0) - (levels[index - 1].r || 0)), 0);
			levels.forEach((level, index) => {
				level.r = index * gap;
			});
		}
		const maxHalf = Math.min(width || Infinity, height || Infinity) / 2;
		if (Number.isFinite(maxHalf) && maxHalf > 0) {
			const largest = Math.max(...levels.map((level) => (level.r || 0) + (level.maxNodeSize || 0) / 2), 0);
			if (largest > maxHalf) {
				const scale = maxHalf / largest;
				levels.forEach((level) => {
					level.r = (level.r || 0) * scale;
				});
			}
		}
	}
	//#endregion
	//#region ../echarts-layout-core/lib/grid-layout.js
	function computeGridLayout(input, options = {}) {
		const graph = buildLayoutGraph(input);
		const nodeCount = graph.nodes.length;
		if (!nodeCount) return toPublicResult(graph);
		const viewport = normalizeGridViewport(options);
		const pinned = readPinnedPositions(graph.nodes, options);
		const dimensions = resolveGridDimensions(nodeCount, options, viewport.width, viewport.height, pinned);
		const cellSize = resolveGridCellSize(graph.nodes, dimensions, viewport.width, viewport.height, options);
		const begin = resolveGridBegin(options, viewport.center, dimensions, cellSize);
		const assignments = assignGridCells(graph.nodes, graph, dimensions, pinned, options);
		graph.nodes.forEach((node) => {
			const cell = assignments.get(node.id);
			if (!cell) return;
			node.x = begin[0] + (cell.col + .5) * cellSize.width;
			node.y = begin[1] + (cell.row + .5) * cellSize.height;
		});
		return toPublicResult(graph);
	}
	function normalizeGridViewport(options) {
		const width = Math.max(0, finiteNumber$2(options.width, 300));
		const height = Math.max(0, finiteNumber$2(options.height, 300));
		return {
			width,
			height,
			center: Array.isArray(options.center) ? [finiteNumber$2(options.center[0], width / 2), finiteNumber$2(options.center[1], height / 2)] : [width / 2, height / 2]
		};
	}
	function resolveGridDimensions(nodeCount, options, width, height, pinned) {
		const requestedRows = positiveInteger(options.rows);
		const requestedCols = positiveInteger(options.cols);
		let rows = requestedRows ?? 0;
		let cols = requestedCols ?? 0;
		if (rows && cols) {
			if (rows * cols < nodeCount) rows = Math.ceil(nodeCount / cols);
		} else if (cols) rows = Math.ceil(nodeCount / cols);
		else if (rows) cols = Math.ceil(nodeCount / rows);
		else {
			const aspect = width > 0 && height > 0 ? width / height : 1;
			cols = Math.max(1, Math.ceil(Math.sqrt(nodeCount * aspect)));
			rows = Math.ceil(nodeCount / cols);
		}
		pinned.forEach((cell) => {
			rows = Math.max(rows, cell.row + 1);
			cols = Math.max(cols, cell.col + 1);
		});
		return {
			rows: Math.max(1, rows),
			cols: Math.max(1, cols)
		};
	}
	function resolveGridCellSize(nodes, dimensions, width, height, options) {
		const condense = options.condense === true;
		const baseWidth = condense ? 0 : width / dimensions.cols;
		const baseHeight = condense ? 0 : height / dimensions.rows;
		const overlapPadding = options.preventOverlap ? finiteNumber$2(options.preventOverlapPadding, 10) : 0;
		const minCellSize = Math.max(1, ...nodes.map((node) => getNodeSize(node, options, { nodeSize: 20 }) + overlapPadding));
		return {
			width: Math.max(1, baseWidth, minCellSize),
			height: Math.max(1, baseHeight, minCellSize)
		};
	}
	function resolveGridBegin(options, center, dimensions, cellSize) {
		if (Array.isArray(options.begin)) return [finiteNumber$2(options.begin[0], 0), finiteNumber$2(options.begin[1], 0)];
		return [center[0] - dimensions.cols * cellSize.width / 2, center[1] - dimensions.rows * cellSize.height / 2];
	}
	function assignGridCells(nodes, graph, dimensions, pinned, options) {
		const assignments = /* @__PURE__ */ new Map();
		const occupied = /* @__PURE__ */ new Set();
		nodes.forEach((node) => {
			const cell = pinned.get(node.id);
			if (!cell) return;
			const key = cellKey(cell);
			if (occupied.has(key)) return;
			assignments.set(node.id, cell);
			occupied.add(key);
		});
		const freeCells = createCenterFirstCells(dimensions).filter((cell) => !occupied.has(cellKey(cell)));
		const sorter = createSorter(options.sortBy, degreeMap(graph));
		nodes.filter((node) => !assignments.has(node.id)).sort((left, right) => sorter(right) - sorter(left) || left.__index - right.__index).forEach((node, index) => {
			const cell = freeCells[index];
			if (cell) assignments.set(node.id, cell);
		});
		return assignments;
	}
	function createCenterFirstCells(dimensions) {
		const centerRow = (dimensions.rows - 1) / 2;
		const centerCol = (dimensions.cols - 1) / 2;
		const cells = [];
		for (let row = 0; row < dimensions.rows; row += 1) for (let col = 0; col < dimensions.cols; col += 1) cells.push({
			row,
			col
		});
		return cells.sort((left, right) => {
			const leftDistance = squaredDistance(left, centerRow, centerCol);
			const rightDistance = squaredDistance(right, centerRow, centerCol);
			if (leftDistance !== rightDistance) return leftDistance - rightDistance;
			const leftAngle = Math.atan2(left.row - centerRow, left.col - centerCol);
			const rightAngle = Math.atan2(right.row - centerRow, right.col - centerCol);
			if (leftAngle !== rightAngle) return leftAngle - rightAngle;
			return left.row - right.row || left.col - right.col;
		});
	}
	function readPinnedPositions(nodes, options) {
		const position = typeof options.position === "function" ? options.position : null;
		const pinned = /* @__PURE__ */ new Map();
		if (!position) return pinned;
		nodes.forEach((node) => {
			const value = position(node);
			const row = positiveInteger(value?.row, true);
			const col = positiveInteger(value?.col, true);
			if (row == null || col == null) return;
			pinned.set(node.id, {
				row,
				col
			});
		});
		return pinned;
	}
	function positiveInteger(value, allowZero = false) {
		if (!Number.isFinite(value)) return null;
		const integer = Math.floor(value);
		if (integer < (allowZero ? 0 : 1)) return null;
		return integer;
	}
	function squaredDistance(cell, centerRow, centerCol) {
		return (cell.row - centerRow) ** 2 + (cell.col - centerCol) ** 2;
	}
	function cellKey(cell) {
		return `${cell.row}:${cell.col}`;
	}
	//#endregion
	//#region ../echarts-layout-core/lib/mds-layout.js
	function computeMDSLayout(input, options = {}) {
		const graph = buildLayoutGraph(input);
		const { center } = normalizeViewport(options);
		if (graph.nodes.length <= 1) return applySingleNodeLayout(graph, center);
		const configuredLinkDistance = options.linkDistance;
		const linkDistance = typeof configuredLinkDistance === "number" && Number.isFinite(configuredLinkDistance) ? configuredLinkDistance : 50;
		const positions = runMDS(replaceInfinity(allPairsShortestPaths(graph)).map((row) => row.map((value) => value * linkDistance)), 2, linkDistance);
		graph.nodes.forEach((node, index) => {
			node.x = positions[index][0] + center[0];
			node.y = positions[index][1] + center[1];
		});
		if (options.preventOverlap !== false) preventMDSOverlap(graph, center, options);
		return toPublicResult(graph);
	}
	function preventMDSOverlap(graph, center, options) {
		const sizes = graph.nodes.map((node) => getNodeSize(node, options, {
			nodeSize: 20,
			nodeSpacing: 8
		}));
		const maxIteration = Math.max(1, Math.min(finiteNumber$2(options.maxPreventOverlapIteration, 400), 800));
		const damping = .72;
		for (let iteration = 0; iteration < maxIteration; iteration += 1) {
			let maxOverlap = 0;
			const displacements = graph.nodes.map(() => ({
				x: 0,
				y: 0
			}));
			for (let i = 0; i < graph.nodes.length; i += 1) for (let j = i + 1; j < graph.nodes.length; j += 1) {
				const left = graph.nodes[i];
				const right = graph.nodes[j];
				const minDistance = (sizes[i] + sizes[j]) / 2;
				let dx = left.x - right.x;
				let dy = left.y - right.y;
				let distance = Math.hypot(dx, dy);
				if (distance < 1e-6) {
					const angle = deterministicPairAngle(i, j, graph.nodes.length);
					dx = Math.cos(angle) * .01;
					dy = Math.sin(angle) * .01;
					distance = .01;
				}
				if (distance >= minDistance) continue;
				const overlap = minDistance - distance;
				maxOverlap = Math.max(maxOverlap, overlap);
				const force = (overlap / 2 + .02) * damping;
				const fx = dx / distance * force;
				const fy = dy / distance * force;
				displacements[i].x += fx;
				displacements[i].y += fy;
				displacements[j].x -= fx;
				displacements[j].y -= fy;
			}
			graph.nodes.forEach((node, index) => {
				node.x += displacements[index].x;
				node.y += displacements[index].y;
			});
			recenterNodes(graph, center);
			if (maxOverlap < .05) break;
		}
	}
	function deterministicPairAngle(leftIndex, rightIndex, count) {
		return (((leftIndex + 1) * 73856093 ^ (rightIndex + 1) * 19349663 ^ count * 83492791) >>> 0) % 3600 / 3600 * Math.PI * 2;
	}
	function recenterNodes(graph, center) {
		if (!graph.nodes.length) return;
		const centroid = graph.nodes.reduce((sum, node) => {
			sum.x += node.x;
			sum.y += node.y;
			return sum;
		}, {
			x: 0,
			y: 0
		});
		const dx = center[0] - centroid.x / graph.nodes.length;
		const dy = center[1] - centroid.y / graph.nodes.length;
		graph.nodes.forEach((node) => {
			node.x += dx;
			node.y += dy;
		});
	}
	function runMDS(distances, dimension = 2, fallbackDistance = 50) {
		const n = distances.length;
		if (!n) return [];
		if (n === 1) return [[0, 0]];
		const squared = distances.map((row) => row.map((value) => -.5 * value * value));
		const rowMeans = squared.map((row) => mean(row));
		const colMeans = squared[0].map((_, col) => mean(squared.map((row) => row[col])));
		const totalMean = mean(rowMeans);
		const matrix = squared.map((row, i) => row.map((value, j) => value - rowMeans[i] - colMeans[j] + totalMean));
		const eigen = jacobiEigenDecomposition(matrix);
		if (!eigen.length) return fallbackCircle(n, fallbackDistance);
		const positive = eigen.filter((item) => item.value > 1e-9).slice(0, dimension);
		if (!positive.length) return fallbackCircle(n, fallbackDistance);
		return matrix.map((_, row) => {
			const point = [];
			for (let dim = 0; dim < dimension; dim++) {
				const item = positive[dim];
				point.push(item ? item.vector[row] * Math.sqrt(item.value) : 0);
			}
			return point;
		});
	}
	function jacobiEigenDecomposition(input) {
		const n = input.length;
		if (!n) return [];
		const a = input.map((row) => row.slice());
		const vectors = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => i === j ? 1 : 0));
		const maxIterations = Math.max(40, n * n * 20);
		for (let iteration = 0; iteration < maxIterations; iteration++) {
			let p = 0;
			let q = 1;
			let max = 0;
			for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
				const value = Math.abs(a[i][j]);
				if (value > max) {
					max = value;
					p = i;
					q = j;
				}
			}
			if (max < 1e-10) break;
			const app = a[p][p];
			const aqq = a[q][q];
			const apq = a[p][q];
			const theta = (aqq - app) / (2 * apq);
			const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
			const c = 1 / Math.sqrt(t * t + 1);
			const s = t * c;
			for (let k = 0; k < n; k++) {
				if (k === p || k === q) continue;
				const akp = a[k][p];
				const akq = a[k][q];
				a[k][p] = akp * c - akq * s;
				a[p][k] = a[k][p];
				a[k][q] = akp * s + akq * c;
				a[q][k] = a[k][q];
			}
			a[p][p] = app * c * c + aqq * s * s - 2 * apq * s * c;
			a[q][q] = app * s * s + aqq * c * c + 2 * apq * s * c;
			a[p][q] = 0;
			a[q][p] = 0;
			for (let k = 0; k < n; k++) {
				const vkp = vectors[k][p];
				const vkq = vectors[k][q];
				vectors[k][p] = vkp * c - vkq * s;
				vectors[k][q] = vkp * s + vkq * c;
			}
		}
		return a.map((row, index) => ({
			value: row[index],
			vector: vectors.map((vectorRow) => vectorRow[index])
		})).sort((left, right) => right.value - left.value);
	}
	function fallbackCircle(n, distance) {
		const radius = Math.max(distance, 1);
		return Array.from({ length: n }, (_, index) => {
			const angle = Math.PI * 2 * index / n;
			return [Math.cos(angle) * radius, Math.sin(angle) * radius];
		});
	}
	function mean(values) {
		if (!values.length) return 0;
		return values.reduce((sum, value) => sum + value, 0) / values.length;
	}
	//#endregion
	//#region ../echarts-layout-core/lib/radial-layout.js
	function computeRadialLayout(input, options = {}) {
		const graph = buildLayoutGraph(input);
		const { width, height, center } = normalizeViewport(options);
		if (graph.nodes.length <= 1) return applySingleNodeLayout(graph, center);
		const focusId = options.focusNode == null ? graph.nodes[0].id : String(options.focusNode);
		const focusIndex = graph.indexById.get(focusId) ?? 0;
		if (options.fast === true) return computeFastRadialLayout(graph, focusIndex, options, width, height, center);
		const rawDistances = allPairsShortestPaths(graph);
		const distances = replaceFocusInfinity(rawDistances, focusIndex, maxFinite(rawDistances[focusIndex]) + 1);
		const focusDistances = distances[focusIndex];
		const maxFocusDistance = Math.max(...focusDistances, 1);
		const maxRadius = resolveMaxRadius(width, height, center);
		const linkDistance = finiteNumber$2(options.linkDistance, 50);
		const unitRadius = options.unitRadius == null ? maxRadius > 0 ? maxRadius / maxFocusDistance : Math.max(linkDistance, 80) : finiteNumber$2(options.unitRadius, 80);
		const radii = focusDistances.map((distance) => distance * unitRadius);
		const idealDistances = radialIdealDistanceMatrix(graph, distances, radii, unitRadius, options);
		const positions = runMDS(idealDistances, 2, linkDistance);
		const focusPosition = positions[focusIndex] || [0, 0];
		graph.nodes.forEach((node, index) => {
			node.x = positions[index][0] - focusPosition[0];
			node.y = positions[index][1] - focusPosition[1];
		});
		runRadialIterations(graph.nodes, idealDistances, radii, focusIndex, finiteNumber$2(options.maxIteration, 1e3));
		applyRadialFallbacks(graph, radii, focusIndex, options);
		graph.nodes.forEach((node) => {
			node.x += center[0];
			node.y += center[1];
		});
		if (options.preventOverlap) preventRadialOverlap(graph, radii, focusIndex, options);
		return toPublicResult(graph);
	}
	function computeFastRadialLayout(graph, focusIndex, options, width, height, center) {
		const focusDistances = focusShortestPaths(graph, focusIndex);
		const fallbackDistance = Math.max(...focusDistances.filter((distance) => Number.isFinite(distance)), 1) + 1;
		const normalizedDistances = focusDistances.map((distance) => Number.isFinite(distance) ? distance : fallbackDistance);
		const maxFocusDistance = Math.max(...normalizedDistances, 1);
		const maxRadius = resolveMaxRadius(width, height, center);
		const linkDistance = finiteNumber$2(options.linkDistance, 50);
		const unitRadius = options.unitRadius == null ? maxRadius > 0 ? maxRadius / maxFocusDistance : Math.max(linkDistance, 80) : finiteNumber$2(options.unitRadius, 80);
		const radii = normalizedDistances.map((distance) => distance * unitRadius);
		const degrees = degreeMap(graph);
		const sortValue = createSorter(options.sortBy, degrees);
		const rings = /* @__PURE__ */ new Map();
		const startAngle = Number.isFinite(options.startAngle) ? options.startAngle : 3 / 2 * Math.PI;
		const clockwise = options.clockwise !== false;
		graph.nodes[focusIndex].x = center[0];
		graph.nodes[focusIndex].y = center[1];
		graph.nodes.forEach((node, index) => {
			if (index === focusIndex) return;
			const radius = radii[index];
			if (!rings.has(radius)) rings.set(radius, []);
			rings.get(radius)?.push(index);
		});
		rings.forEach((indexes, radius) => {
			indexes.sort((left, right) => sortValue(graph.nodes[right]) - sortValue(graph.nodes[left]));
			const sweep = Number.isFinite(options.sweep) ? options.sweep : 2 * Math.PI;
			indexes.forEach((nodeIndex, localIndex) => {
				const angle = startAngle + (clockwise ? 1 : -1) * (sweep * localIndex) / Math.max(indexes.length, 1);
				graph.nodes[nodeIndex].x = center[0] + Math.cos(angle) * radius;
				graph.nodes[nodeIndex].y = center[1] + Math.sin(angle) * radius;
			});
		});
		if (options.preventOverlap) preventRadialOverlap(graph, radii, focusIndex, options);
		return toPublicResult(graph);
	}
	function focusShortestPaths(graph, focusIndex) {
		const distances = Array(graph.nodes.length).fill(Infinity);
		const adjacency = Array.from({ length: graph.nodes.length }, () => []);
		graph.edges.forEach((edge) => {
			const source = graph.indexById.get(edge.source);
			const target = graph.indexById.get(edge.target);
			if (source == null || target == null) return;
			adjacency[source].push(target);
			adjacency[target].push(source);
		});
		const queue = [focusIndex];
		distances[focusIndex] = 0;
		for (let cursor = 0; cursor < queue.length; cursor += 1) {
			const nodeIndex = queue[cursor];
			const nextDistance = distances[nodeIndex] + 1;
			adjacency[nodeIndex].forEach((nextIndex) => {
				if (distances[nextIndex] <= nextDistance) return;
				distances[nextIndex] = nextDistance;
				queue.push(nextIndex);
			});
		}
		return distances;
	}
	function radialIdealDistanceMatrix(graph, distances, radii, unitRadius, options) {
		const n = distances.length;
		const linkDistance = finiteNumber$2(options.linkDistance, 50);
		const sortStrength = finiteNumber$2(options.sortStrength, 10);
		const baseLink = (linkDistance + unitRadius) / 2;
		const degrees = degreeMap(graph);
		const sortValue = createSorter(options.sortBy, degrees);
		const result = Array.from({ length: n }, () => Array(n).fill(0));
		for (let i = 0; i < n; i++) {
			const radiusScale = Math.max(radii[i] / Math.max(unitRadius, 1), 1);
			for (let j = 0; j < n; j++) {
				if (i === j) continue;
				const distance = distances[i][j];
				if (radii[i] === radii[j]) if (options.sortBy === "data") result[i][j] = distance * Math.abs(i - j) * sortStrength / radiusScale;
				else if (options.sortBy) result[i][j] = distance * Math.abs(sortValue(graph.nodes[i]) - sortValue(graph.nodes[j])) * sortStrength / radiusScale;
				else result[i][j] = distance * linkDistance / radiusScale;
				else result[i][j] = distance * baseLink;
			}
		}
		return result;
	}
	function runRadialIterations(nodes, idealDistances, radii, focusIndex, maxIteration) {
		const n = nodes.length;
		const weights = idealDistances.map((row) => row.map((value) => value === 0 ? 0 : 1 / (value * value)));
		const xs = Float64Array.from(nodes.map((node) => node.x));
		const ys = Float64Array.from(nodes.map((node) => node.y));
		const iterations = Math.max(1, Math.min(maxIteration, 1e3));
		for (let iteration = 0; iteration <= iterations; iteration++) {
			const param = iteration / iterations;
			const inverseParam = 1 - param;
			for (let i = 0; i < n; i++) {
				if (i === focusIndex) continue;
				const vx = xs[i];
				const vy = ys[i];
				const originDistance = Math.hypot(vx, vy);
				const inverseOriginDistance = originDistance === 0 ? 0 : 1 / originDistance;
				let xNumerator = 0;
				let yNumerator = 0;
				let denominator = 0;
				for (let j = 0; j < n; j++) {
					if (i === j) continue;
					const ux = xs[j];
					const uy = ys[j];
					const euclideanDistance = Math.hypot(vx - ux, vy - uy);
					const inverseEuclideanDistance = euclideanDistance === 0 ? 0 : 1 / euclideanDistance;
					const idealDistance = idealDistances[j][i];
					denominator += weights[i][j];
					xNumerator += weights[i][j] * (ux + idealDistance * (vx - ux) * inverseEuclideanDistance);
					yNumerator += weights[i][j] * (uy + idealDistance * (vy - uy) * inverseEuclideanDistance);
				}
				const inverseRadius = radii[i] === 0 ? 0 : 1 / radii[i];
				denominator = denominator * inverseParam + param * inverseRadius * inverseRadius;
				xNumerator = xNumerator * inverseParam + param * inverseRadius * vx * inverseOriginDistance;
				yNumerator = yNumerator * inverseParam + param * inverseRadius * vy * inverseOriginDistance;
				if (denominator > 0) {
					xs[i] = xNumerator / denominator;
					ys[i] = yNumerator / denominator;
				}
			}
		}
		nodes.forEach((node, index) => {
			node.x = index === focusIndex ? 0 : xs[index];
			node.y = index === focusIndex ? 0 : ys[index];
		});
	}
	function applyRadialFallbacks(graph, radii, focusIndex, options) {
		const rings = /* @__PURE__ */ new Map();
		graph.nodes.forEach((node, index) => {
			if (index === focusIndex) return;
			if (!Number.isFinite(node.x) || !Number.isFinite(node.y) || Math.hypot(node.x, node.y) < 1e-6) {
				const radius = radii[index];
				if (!rings.has(radius)) rings.set(radius, []);
				rings.get(radius)?.push(index);
			}
		});
		for (const [radius, indexes] of rings) indexes.forEach((nodeIndex, localIndex) => {
			const angle = Math.PI * 2 * localIndex / indexes.length;
			graph.nodes[nodeIndex].x = Math.cos(angle) * radius;
			graph.nodes[nodeIndex].y = Math.sin(angle) * radius;
		});
		if (options.sortBy) sortRingAngles(graph, radii, focusIndex, options);
	}
	function sortRingAngles(graph, radii, focusIndex, options) {
		const degrees = degreeMap(graph);
		const sortValue = createSorter(options.sortBy, degrees);
		const ringMap = /* @__PURE__ */ new Map();
		graph.nodes.forEach((node, index) => {
			if (index === focusIndex) return;
			const radius = radii[index];
			if (!ringMap.has(radius)) ringMap.set(radius, []);
			ringMap.get(radius)?.push(index);
		});
		for (const indexes of ringMap.values()) indexes.slice().sort((left, right) => sortValue(graph.nodes[right]) - sortValue(graph.nodes[left])).forEach((nodeIndex, localIndex) => {
			const angle = Math.PI * 2 * localIndex / indexes.length;
			const radius = radii[nodeIndex];
			graph.nodes[nodeIndex].x = Math.cos(angle) * radius;
			graph.nodes[nodeIndex].y = Math.sin(angle) * radius;
		});
	}
	function preventRadialOverlap(graph, radii, focusIndex, options) {
		const strictRadial = options.strictRadial !== false;
		const maxIteration = Math.max(1, Math.min(finiteNumber$2(options.maxPreventOverlapIteration, 200), 300));
		const k = graph.nodes.length / 4.5;
		for (let iteration = 0; iteration < maxIteration; iteration++) {
			let moved = false;
			const displacements = graph.nodes.map(() => ({
				x: 0,
				y: 0
			}));
			for (let i = 0; i < graph.nodes.length; i++) for (let j = i + 1; j < graph.nodes.length; j++) {
				if (radii[i] !== radii[j]) continue;
				const left = graph.nodes[i];
				const right = graph.nodes[j];
				let dx = left.x - right.x;
				let dy = left.y - right.y;
				let distance = Math.hypot(dx, dy);
				if (distance === 0) {
					distance = .01;
					dx = .01;
					dy = 0;
				}
				const minDistance = (getNodeSize(left, options, { nodeSize: 10 }) + getNodeSize(right, options, { nodeSize: 10 })) / 2;
				if (distance >= minDistance) continue;
				const force = k * k / distance;
				const fx = dx / distance * force;
				const fy = dy / distance * force;
				displacements[i].x += fx;
				displacements[i].y += fy;
				displacements[j].x -= fx;
				displacements[j].y -= fy;
			}
			graph.nodes.forEach((node, index) => {
				if (index === focusIndex) return;
				let { x, y } = displacements[index];
				const length = Math.hypot(x, y);
				if (!length) return;
				const limit = Math.min(length, Math.max(radii[index] / 20, 1));
				x = x / length * limit;
				y = y / length * limit;
				if (strictRadial) {
					const vx = node.x;
					const vy = node.y;
					const radialLength = Math.hypot(vx, vy);
					if (radialLength > 0) {
						const tx = vy / radialLength;
						const ty = -vx / radialLength;
						const projected = x * tx + y * ty;
						node.x += tx * projected;
						node.y += ty * projected;
						const nextLength = Math.hypot(node.x, node.y);
						if (nextLength > 0) {
							node.x = node.x / nextLength * radii[index];
							node.y = node.y / nextLength * radii[index];
						}
						moved = moved || Math.abs(projected) > .001;
					}
				} else {
					node.x += x;
					node.y += y;
					moved = true;
				}
			});
			if (!moved) break;
		}
	}
	function replaceFocusInfinity(distances, focusIndex, step) {
		const next = replaceInfinity(distances, step || 1);
		next[focusIndex].forEach((value, index) => {
			if (value === Infinity) {
				next[focusIndex][index] = step;
				next[index][focusIndex] = step;
			}
		});
		return next;
	}
	function resolveMaxRadius(width, height, center) {
		if (!width || !height) return 0;
		const semiWidth = Math.min(center[0], width - center[0]) || width / 2;
		const semiHeight = Math.min(center[1], height - center[1]) || height / 2;
		return Math.max(0, Math.min(semiWidth, semiHeight));
	}
	function maxFinite(values) {
		let max = 0;
		values.forEach((value) => {
			if (value !== Infinity && value > max) max = value;
		});
		return max;
	}
	//#endregion
	//#region ../echarts-layout-core/lib/layouts.js
	function computeGraphLayout(type, input, options = {}) {
		const graph = normalizeGraphData(input);
		if (type === "arc") return computeArcLayout(graph, options);
		if (type === "concentric") return computeConcentricLayout(graph, options);
		if (type === "grid") return computeGridLayout(graph, options);
		if (type === "mds") return computeMDSLayout(graph, options);
		if (type === "radial") return computeRadialLayout(graph, options);
		throw new Error(`Unsupported graph layout: ${type}`);
	}
	//#endregion
	//#region ../echarts-layout-core/lib/echarts.js
	var layoutOptionKeys = [
		"nodeSep",
		"nodeSize",
		"nodeSpacing",
		"linkDistance",
		"unitRadius",
		"focusNode",
		"preventOverlap",
		"strictRadial",
		"maxIteration",
		"maxPreventOverlapIteration",
		"sortBy",
		"sortStrength",
		"maxLevelDiff",
		"sweep",
		"equidistant",
		"startAngle",
		"clockwise",
		"rows",
		"cols",
		"begin",
		"condense",
		"preventOverlapPadding"
	];
	var DEFAULT_NODE_SIZE = 20;
	var DEFAULT_MIN_VALUE_NODE_SIZE = 10;
	var DEFAULT_MAX_VALUE_NODE_SIZE = 32;
	var LABEL_COLLISION_PADDING = 2;
	var LABEL_VIEWPORT_PADDING = 4;
	var GRAPH_HOVER_DIM_OPACITY = .12;
	var GRAPH_HOVER_LABEL_DIM_OPACITY = .18;
	var GRAPH_HOVER_ACTIVE_EDGE_OPACITY = .96;
	var GRAPH_HOVER_EDGE_COLOR = "#1fb6e8";
	var GRAPH_HOVER_SHADOW_COLOR = "rgba(15, 23, 42, 0.24)";
	var GRAPH_HOVER_TRANSITION_DURATION = 180;
	var GRAPH_HOVER_TRANSITION_EASING = "cubicOut";
	var GRAPH_HOVER_TRANSITION_SCOPE = "graph-hover";
	function installGraphLayout(echarts, config) {
		const echartsHost = echarts;
		const { chartType, layoutType } = config;
		echartsHost.extendSeriesModel({
			type: `series.${chartType}`,
			visualDrawType: "fill",
			getInitialData(option) {
				const nodes = Array.isArray(option.nodes) ? option.nodes : Array.isArray(option.data) ? option.data : [];
				const dimensions = echartsHost.helper.createDimensions(nodes, { coordDimensions: ["value"] });
				const list = new echartsHost.List(dimensions, this);
				list.initData(nodes);
				return list;
			},
			defaultOption: createDefaultOption(layoutType)
		});
		echartsHost.extendChartView({
			type: chartType,
			render(seriesModel, ecModel, api) {
				const group = this.group;
				const renderToken = {};
				this.__renderToken = renderToken;
				try {
					const graphOption = readGraphOption(seriesModel);
					const layoutOptions = readLayoutOptions(echartsHost, seriesModel, api, graphOption);
					const viewport = {
						x: 0,
						y: 0,
						width: api.getWidth(),
						height: api.getHeight()
					};
					const fisheye = readFisheyeOptions(seriesModel, viewport);
					const renderSignature = createGraphRenderSignature(layoutType, seriesModel, layoutOptions, viewport);
					const fisheyeSignature = stableSerialize(fisheye);
					if (this.__graphRenderState && this.__graphRenderSignature === renderSignature) {
						if (this.__fisheyeSignature !== fisheyeSignature) {
							updateFisheyeRenderState(echartsHost, group, api, this, this.__graphRenderState, fisheye);
							this.__fisheyeSignature = fisheyeSignature;
						}
						return;
					}
					this.__graphHoverController?.dispose();
					this.__graphHoverController = void 0;
					this.__fisheyeController?.dispose();
					this.__fisheyeController = void 0;
					clearFisheyePreviewTimer(this);
					this.__fisheyeSignature = void 0;
					this.__graphRenderState = void 0;
					this.__graphRenderSignature = void 0;
					const layout = computeGraphLayout(layoutType, graphOption, layoutOptions);
					if (this.__renderToken !== renderToken) return;
					const aliveRender = renderAlive(this, echartsHost, group, seriesModel, (targetGroup, targetSeriesModel) => ({ payload: drawGraph(echartsHost, targetGroup, targetSeriesModel, layoutType, layout, viewport, fisheye) }));
					if (!aliveRender.payload) return;
					const renderState = mapGraphRenderState(aliveRender.payload, aliveRender.mapElement);
					this.__graphHoverController = installGraphHover(renderState, api);
					this.__graphRenderState = renderState;
					this.__graphRenderSignature = renderSignature;
					this.__fisheyeSignature = fisheyeSignature;
					if (fisheye) {
						this.__fisheyeController = installFisheye(api, renderState, fisheye);
						scheduleInitialFisheyePreview(this, renderState, fisheye, readFisheyePreviewDelay(seriesModel, renderState.nodes.length));
					}
				} catch (error) {
					this.__fisheyeSignature = void 0;
					this.__graphRenderState = void 0;
					this.__graphRenderSignature = void 0;
					if (typeof console !== "undefined") console.error(`[${chartType}] layout failed`, error);
				}
			},
			remove() {
				this.__renderToken = null;
				this.__graphHoverController?.dispose();
				this.__graphHoverController = void 0;
				this.__fisheyeController?.dispose();
				this.__fisheyeController = void 0;
				clearFisheyePreviewTimer(this);
				this.__fisheyeSignature = void 0;
				this.__graphRenderState = void 0;
				this.__graphRenderSignature = void 0;
				clearAliveRender(this);
				this.group.removeAll();
			},
			dispose() {
				this.__renderToken = null;
				this.__graphHoverController?.dispose();
				this.__graphHoverController = void 0;
				this.__fisheyeController?.dispose();
				this.__fisheyeController = void 0;
				clearFisheyePreviewTimer(this);
				this.__fisheyeSignature = void 0;
				this.__graphRenderState = void 0;
				this.__graphRenderSignature = void 0;
				clearAliveRender(this);
				this.group.removeAll();
			}
		});
	}
	function createDefaultOption(layoutType) {
		return {
			left: "center",
			top: "center",
			width: "80%",
			height: "80%",
			symbolSize: null,
			layout: {},
			layoutAnimation: false,
			enterAnimation: true,
			edgeAnimation: null,
			fisheye: {
				show: true,
				radius: null,
				scale: 2.2,
				labelScale: 1.55,
				stroke: "rgba(17, 24, 39, 0.86)",
				strokeWidth: 3,
				opacity: .92
			},
			edgeStyle: {
				color: "#9aa4b2",
				width: 1,
				opacity: layoutType === "arc" ? .55 : .45
			},
			itemStyle: {
				color: "#5470c6",
				borderColor: "#fff",
				borderWidth: 1
			},
			label: {
				show: false,
				color: "#1f2937",
				fontSize: 12,
				position: layoutType === "arc" ? "bottom" : "right"
			},
			emphasis: {
				itemStyle: {
					shadowBlur: 8,
					shadowColor: "rgba(0, 0, 0, 0.2)"
				},
				edgeStyle: { opacity: .8 }
			}
		};
	}
	function readGraphOption(seriesModel) {
		const option = seriesModel.option || {};
		return {
			nodes: Array.isArray(option.nodes) ? option.nodes : Array.isArray(option.data) ? option.data : [],
			edges: Array.isArray(option.edges) ? option.edges : Array.isArray(option.links) ? option.links : []
		};
	}
	function readLayoutOptions(echarts, seriesModel, api, graphOption) {
		const rect = echarts.helper.getLayoutRect(seriesModel.getBoxLayoutParams(), {
			width: api.getWidth(),
			height: api.getHeight()
		});
		const layoutOptions = {
			...asRecord(seriesModel.get("layout")),
			...asRecord(seriesModel.get("layoutOptions"))
		};
		layoutOptionKeys.forEach((key) => {
			const value = seriesModel.get(key);
			if (value !== void 0 && value !== null) layoutOptions[key] = value;
		});
		if (layoutOptions.nodeSize == null) {
			const symbolSize = seriesModel.get("symbolSize");
			layoutOptions.nodeSize = symbolSize == null ? createValueNodeSizeResolver(normalizeGraphData(graphOption).nodes) : symbolSize;
		}
		layoutOptions.width = rect.width;
		layoutOptions.height = rect.height;
		layoutOptions.center = resolveCenter(echarts, seriesModel.get("center"), rect);
		return layoutOptions;
	}
	function resolveCenter(echarts, center, rect) {
		if (!Array.isArray(center)) return [rect.x + rect.width / 2, rect.y + rect.height / 2];
		return [rect.x + echarts.number.parsePercent(center[0], rect.width), rect.y + echarts.number.parsePercent(center[1], rect.height)];
	}
	function createGraphRenderSignature(layoutType, seriesModel, layoutOptions, viewport) {
		return stableSerialize({
			layoutType,
			option: omitFisheyeOption(seriesModel.option || {}),
			layoutOptions,
			viewport
		});
	}
	function omitFisheyeOption(option) {
		const copy = { ...option };
		delete copy.fisheye;
		return copy;
	}
	function stableSerialize(value, seen = /* @__PURE__ */ new WeakSet()) {
		if (value === null) return "null";
		if (typeof value === "undefined") return "\"__undefined\"";
		if (typeof value === "string") return JSON.stringify(value);
		if (typeof value === "number" || typeof value === "boolean") return JSON.stringify(value);
		if (typeof value === "function") return JSON.stringify(`__function:${value.toString()}`);
		if (typeof value === "symbol") return JSON.stringify(String(value));
		if (typeof value !== "object") return JSON.stringify(String(value));
		if (seen.has(value)) return "\"__cycle\"";
		seen.add(value);
		if (Array.isArray(value)) {
			const serialized = `[${value.map((item) => stableSerialize(item, seen)).join(",")}]`;
			seen.delete(value);
			return serialized;
		}
		const record = value;
		const serialized = `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key], seen)}`).join(",")}}`;
		seen.delete(value);
		return serialized;
	}
	function drawGraph(echarts, group, seriesModel, layoutType, layout, viewport, fisheye) {
		const data = seriesModel.getData();
		const graph = normalizeGraphData(readGraphOption(seriesModel));
		const nodeById = new Map(layout.nodes.map((node) => [node.id, node]));
		const indexById = new Map(graph.nodes.map((node, index) => [node.id, index]));
		const edgeGroup = new echarts.graphic.Group();
		const nodeGroup = new echarts.graphic.Group();
		const labelGroup = new echarts.graphic.Group();
		const edgeCount = layout.edges.length;
		const sequenceEdgesAfterNodes = shouldSequenceEdgesAfterNodes(layoutType);
		const edgeDelayOffset = sequenceEdgesAfterNodes ? readNodeEnterAnimationEnd(seriesModel, graph.nodes.length) : 0;
		const defaultNodeSize = createValueNodeSizeResolver(layout.nodes);
		const renderNodes = [];
		const renderedNodes = [];
		const renderedLabels = [];
		const renderedEdges = [];
		layout.edges.forEach((edge, edgeIndex) => {
			const source = nodeById.get(edge.source);
			const target = nodeById.get(edge.target);
			if (!source || !target) return;
			const renderedEdge = createEdgeElement(echarts, seriesModel, layoutType, edge, source, target, edgeIndex, edgeDelayOffset);
			edgeGroup.add(renderedEdge.element);
			renderedEdges.push({
				...renderedEdge,
				sourceId: edge.source,
				targetId: edge.target,
				edgeGroup,
				fisheyeElementAdded: false,
				baseStyle: cloneRecord(renderedEdge.baseStyle),
				fisheyeBaseStyle: renderedEdge.fisheyeBaseStyle ? cloneRecord(renderedEdge.fisheyeBaseStyle) : null
			});
		});
		layout.nodes.forEach((node) => {
			const dataIndex = indexById.get(node.id);
			if (dataIndex == null) return;
			const animationIndex = sequenceEdgesAfterNodes ? dataIndex : edgeCount;
			const itemModel = data.getItemModel(dataIndex);
			const size = readNodeSize(seriesModel, data, node, dataIndex, defaultNodeSize);
			renderNodes.push({
				node,
				dataIndex,
				animationIndex,
				itemModel,
				size,
				circleBox: circleBox(node, size / 2),
				labelSpec: createLabelSpec(seriesModel, itemModel, node, size)
			});
		});
		const placedLabels = placeLabels(renderNodes, layoutType, viewport);
		renderNodes.forEach((renderNode) => {
			const renderedNode = createNodeElement(echarts, seriesModel, data, renderNode);
			nodeGroup.add(renderedNode.group);
			renderedNodes.push({
				id: renderNode.node.id,
				baseX: renderNode.node.x,
				baseY: renderNode.node.y,
				baseRadius: renderNode.size / 2,
				circle: renderedNode.circle,
				baseStyle: cloneRecord(renderedNode.baseStyle),
				valueLabel: renderedNode.valueLabel,
				valueLabelBaseStyle: renderedNode.valueLabelBaseStyle ? cloneRecord(renderedNode.valueLabelBaseStyle) : null,
				valueFontSize: renderedNode.valueFontSize,
				valueLineWidth: renderedNode.valueLineWidth
			});
			const placedLabel = placedLabels.get(renderNode.node.id);
			if (placedLabel) {
				const label = createLabelElement(echarts, placedLabel);
				setAliveRenderKey(label, `node-label:${renderNode.node.id}`);
				const baseStyle = cloneStyle(label);
				applyFadeEnterAnimation(label, readEnterAnimation(seriesModel, renderNode.animationIndex));
				labelGroup.add(label);
				renderedLabels.push({
					nodeId: renderNode.node.id,
					element: label,
					baseStyle,
					baseX: placedLabel.point.x,
					baseY: placedLabel.point.y,
					baseFontSize: placedLabel.spec.fontSize,
					baseLineHeight: placedLabel.spec.lineHeight
				});
			}
		});
		group.add(edgeGroup);
		group.add(nodeGroup);
		group.add(labelGroup);
		const lens = fisheye ? createFisheyeLens(echarts, fisheye) : null;
		if (lens) group.add(lens);
		return {
			nodes: renderedNodes,
			labels: renderedLabels,
			edges: renderedEdges,
			lens,
			viewport
		};
	}
	function mapGraphRenderState(renderState, mapElement) {
		return {
			...renderState,
			nodes: renderState.nodes.map((node) => ({
				...node,
				circle: mapElement(node.circle),
				valueLabel: mapElement(node.valueLabel)
			})),
			labels: renderState.labels.map((label) => ({
				...label,
				element: mapElement(label.element)
			})),
			edges: renderState.edges.map((edge) => ({
				...edge,
				element: mapElement(edge.element),
				fisheyeElement: mapElement(edge.fisheyeElement),
				edgeGroup: mapElement(edge.edgeGroup)
			})),
			lens: mapElement(renderState.lens)
		};
	}
	function createEdgeElement(echarts, seriesModel, layoutType, edge, source, target, edgeIndex, delayOffset = 0) {
		const style = readEdgeStyle(seriesModel, edge);
		const baseStyle = cloneRecord(style);
		const animation = readEdgeAnimation(seriesModel, edge, edgeIndex, delayOffset);
		const edgeKey = `edge:${edge.id || `${edge.source}->${edge.target}`}:${edgeIndex}`;
		if (layoutType === "arc") {
			const path = createArcPath([source.x, source.y], [target.x, target.y]);
			if (echarts.graphic.makePath) {
				const edgeElement = echarts.graphic.makePath(pathToString(path), { style: cloneRecord(style) });
				setAliveRenderKey(edgeElement, edgeKey);
				edgeElement.cursor = "pointer";
				applyEdgeConnectionAnimation(edgeElement, "style", "strokePercent", animation);
				const fisheyeElement = new echarts.graphic.BezierCurve({
					shape: createArcBezierShape([source.x, source.y], [target.x, target.y]),
					style: cloneRecord(style),
					ignore: true,
					silent: true
				});
				setAliveRenderKey(fisheyeElement, `${edgeKey}:fisheye`);
				return {
					element: edgeElement,
					fisheyeElement,
					kind: "arcPath",
					baseStyle,
					fisheyeBaseStyle: cloneRecord(style)
				};
			}
			const edgeElement = new echarts.graphic.BezierCurve({
				shape: createArcBezierShape([source.x, source.y], [target.x, target.y]),
				style: cloneRecord(style)
			});
			setAliveRenderKey(edgeElement, edgeKey);
			edgeElement.cursor = "pointer";
			applyEdgeConnectionAnimation(edgeElement, "shape", "percent", animation);
			return {
				element: edgeElement,
				kind: "arcBezier",
				baseStyle,
				fisheyeBaseStyle: null
			};
		}
		const edgeElement = new echarts.graphic.Line({
			shape: {
				x1: source.x,
				y1: source.y,
				x2: target.x,
				y2: target.y
			},
			style: cloneRecord(style)
		});
		setAliveRenderKey(edgeElement, edgeKey);
		edgeElement.cursor = "pointer";
		applyEdgeConnectionAnimation(edgeElement, "shape", "percent", animation);
		return {
			element: edgeElement,
			kind: "line",
			baseStyle,
			fisheyeBaseStyle: null
		};
	}
	function createNodeElement(echarts, seriesModel, data, renderNode) {
		const { node, dataIndex, animationIndex, itemModel, size } = renderNode;
		const itemGroup = new echarts.graphic.Group();
		setAliveRenderKey(itemGroup, `node-group:${node.id}`);
		const nodeStyle = readNodeStyle(seriesModel, itemModel, data, dataIndex);
		const baseStyle = cloneRecord(nodeStyle);
		const circle = new echarts.graphic.Circle({
			shape: {
				cx: node.x,
				cy: node.y,
				r: size / 2
			},
			style: nodeStyle
		});
		setAliveRenderKey(circle, `node:${node.id}`);
		circle.cursor = "pointer";
		applyNodeEnterAnimation(circle, size, readEnterAnimation(seriesModel, animationIndex));
		data.setItemLayout(dataIndex, [node.x, node.y]);
		data.setItemGraphicEl(dataIndex, circle);
		itemGroup.add(circle);
		const valueLabel = createNodeValueElement(echarts, renderNode);
		const valueLabelBaseStyle = valueLabel ? cloneStyle(valueLabel) : null;
		const valueStyle = valueLabel ? asRecord(valueLabel.style) : {};
		if (valueLabel) {
			setAliveRenderKey(valueLabel, `node-value:${node.id}`);
			valueLabel.cursor = "pointer";
			applyFadeEnterAnimation(valueLabel, readEnterAnimation(seriesModel, animationIndex));
			itemGroup.add(valueLabel);
		}
		return {
			group: itemGroup,
			circle,
			baseStyle,
			valueLabel,
			valueLabelBaseStyle,
			valueFontSize: finiteNumber(valueStyle.fontSize, 0),
			valueLineWidth: finiteNumber(valueStyle.lineWidth, 0)
		};
	}
	function createNodeValueElement(echarts, renderNode) {
		const text = formatNodeValue(renderNode.node.value);
		if (!text) return null;
		const fontSize = resolveNodeValueFontSize(text, renderNode.size);
		return new echarts.graphic.Text({ style: {
			x: renderNode.node.x,
			y: renderNode.node.y,
			text,
			fill: "#ffffff",
			stroke: "rgba(15, 23, 42, 0.28)",
			lineWidth: Math.max(1, fontSize * .14),
			fontSize,
			fontWeight: 700,
			align: "center",
			verticalAlign: "middle"
		} });
	}
	function formatNodeValue(value) {
		if (value == null || value === "") return "";
		if (typeof value === "number") return Number.isFinite(value) ? formatCompactNumber(value) : "";
		if (typeof value === "string") return value;
		if (Array.isArray(value)) for (const item of value) {
			const text = formatNodeValue(item);
			if (text) return text;
		}
		return "";
	}
	function installGraphHover(renderState, api) {
		const adjacency = createHoverAdjacency(renderState.edges);
		const hoverTargets = /* @__PURE__ */ new WeakSet();
		let active = false;
		const registerHoverTarget = (element) => {
			if (element && typeof element === "object") hoverTargets.add(element);
		};
		const reset = (eventOrImmediate = false) => {
			if (!active) return;
			const immediate = eventOrImmediate === true;
			active = false;
			resetGraphHover(renderState, !immediate);
		};
		renderState.nodes.forEach((node) => {
			const enter = () => {
				active = true;
				applyNodeHover(renderState, adjacency, node.id);
			};
			registerHoverTarget(node.circle);
			registerHoverTarget(node.valueLabel);
			attachHoverHandlers(node.circle, enter, reset);
			if (node.valueLabel) attachHoverHandlers(node.valueLabel, enter, reset);
		});
		renderState.edges.forEach((edge, edgeIndex) => {
			registerHoverTarget(edge.element);
			registerHoverTarget(edge.fisheyeElement);
			attachHoverHandlers(edge.element, () => {
				active = true;
				applyEdgeHover(renderState, edgeIndex);
			}, reset);
		});
		const zr = api?.getZr?.();
		if (!zr) return void 0;
		const handleMove = (event) => {
			if (!active) return;
			if (!isGraphHoverTarget(event.target, hoverTargets)) reset();
		};
		zr.on("mousemove", handleMove);
		zr.on("globalout", reset);
		return { dispose() {
			zr.off("mousemove", handleMove);
			zr.off("globalout", reset);
			reset(true);
		} };
	}
	function isGraphHoverTarget(target, hoverTargets) {
		let current = target;
		while (current && typeof current === "object") {
			if (hoverTargets.has(current)) return true;
			current = current.parent;
		}
		return false;
	}
	function createHoverAdjacency(edges) {
		const adjacency = /* @__PURE__ */ new Map();
		const entryFor = (id) => {
			let entry = adjacency.get(id);
			if (!entry) {
				entry = {
					nodes: /* @__PURE__ */ new Set(),
					edges: /* @__PURE__ */ new Set()
				};
				adjacency.set(id, entry);
			}
			return entry;
		};
		edges.forEach((edge, edgeIndex) => {
			const source = entryFor(edge.sourceId);
			const target = entryFor(edge.targetId);
			source.nodes.add(edge.targetId);
			source.edges.add(edgeIndex);
			target.nodes.add(edge.sourceId);
			target.edges.add(edgeIndex);
		});
		return adjacency;
	}
	function applyNodeHover(renderState, adjacency, nodeId) {
		const relatedNodeIds = new Set([nodeId]);
		const relatedEdgeIndexes = /* @__PURE__ */ new Set();
		const adjacent = adjacency.get(nodeId);
		adjacent?.nodes.forEach((id) => relatedNodeIds.add(id));
		adjacent?.edges.forEach((edgeIndex) => relatedEdgeIndexes.add(edgeIndex));
		const focusNode = renderState.nodes.find((node) => node.id === nodeId);
		applyHoverStyles(renderState, {
			relatedNodeIds,
			relatedEdgeIndexes,
			focusNodeId: nodeId,
			edgeColor: String(asRecord(focusNode?.circle?.style).fill || GRAPH_HOVER_EDGE_COLOR),
			edgeWidthScale: 2.2
		});
	}
	function applyEdgeHover(renderState, edgeIndex) {
		const edge = renderState.edges[edgeIndex];
		if (!edge) return;
		applyHoverStyles(renderState, {
			relatedNodeIds: new Set([edge.sourceId, edge.targetId]),
			relatedEdgeIndexes: new Set([edgeIndex]),
			edgeColor: GRAPH_HOVER_EDGE_COLOR,
			edgeWidthScale: 4.2
		});
	}
	function applyHoverStyles(renderState, options) {
		renderState.nodes.forEach((node) => {
			const isRelated = options.relatedNodeIds.has(node.id);
			const isFocus = node.id === options.focusNodeId;
			applyGraphElementStyle(node.circle, node.baseStyle, {
				opacity: isRelated ? 1 : GRAPH_HOVER_DIM_OPACITY,
				shadowBlur: isFocus ? Math.max(10, node.baseRadius * .7) : void 0,
				shadowColor: isFocus ? GRAPH_HOVER_SHADOW_COLOR : void 0,
				lineWidth: isFocus ? Math.max(finiteNumber(node.baseStyle.lineWidth, 1), 2.4) : void 0
			}, [
				"opacity",
				"shadowBlur",
				"shadowColor",
				"lineWidth"
			], true);
			if (node.valueLabel && node.valueLabelBaseStyle) applyGraphElementStyle(node.valueLabel, node.valueLabelBaseStyle, { opacity: isRelated ? 1 : GRAPH_HOVER_LABEL_DIM_OPACITY }, ["opacity"], true);
		});
		renderState.labels.forEach((label) => {
			applyGraphElementStyle(label.element, label.baseStyle, { opacity: options.relatedNodeIds.has(label.nodeId) ? 1 : GRAPH_HOVER_LABEL_DIM_OPACITY }, ["opacity"], true);
		});
		renderState.edges.forEach((edge, edgeIndex) => {
			const isRelated = options.relatedEdgeIndexes.has(edgeIndex);
			const baseWidth = finiteNumber(edge.baseStyle.lineWidth, 1);
			const hoverWidth = Math.max(baseWidth * options.edgeWidthScale, options.edgeWidthScale >= 4 ? 6 : 2.6);
			applyEdgeHoverStyle(edge, isRelated ? {
				stroke: options.edgeColor,
				lineWidth: hoverWidth,
				opacity: GRAPH_HOVER_ACTIVE_EDGE_OPACITY,
				shadowBlur: 8,
				shadowColor: `${options.edgeColor}55`
			} : { opacity: GRAPH_HOVER_DIM_OPACITY }, [
				"stroke",
				"lineWidth",
				"opacity",
				"shadowBlur",
				"shadowColor"
			], true);
		});
	}
	function resetGraphHover(renderState, transition = true) {
		renderState.nodes.forEach((node) => {
			applyGraphElementStyle(node.circle, node.baseStyle, {}, [
				"opacity",
				"shadowBlur",
				"shadowColor",
				"lineWidth"
			], transition);
			if (node.valueLabel && node.valueLabelBaseStyle) applyGraphElementStyle(node.valueLabel, node.valueLabelBaseStyle, {}, ["opacity"], transition);
		});
		renderState.labels.forEach((label) => {
			applyGraphElementStyle(label.element, label.baseStyle, {}, ["opacity"], transition);
		});
		renderState.edges.forEach((edge) => {
			applyEdgeHoverStyle(edge, {}, [
				"stroke",
				"lineWidth",
				"opacity",
				"shadowBlur",
				"shadowColor"
			], transition);
		});
	}
	function applyEdgeHoverStyle(edge, style, keys, transition = false) {
		applyGraphElementStyle(edge.element, edge.baseStyle, style, keys, transition);
		if (edge.fisheyeElement && edge.fisheyeBaseStyle) applyGraphElementStyle(edge.fisheyeElement, edge.fisheyeBaseStyle, style, keys, transition);
	}
	function applyGraphElementStyle(element, baseStyle, patch, keys, transition = false) {
		const current = cloneStyle(element);
		keys.forEach((key) => {
			if (Object.prototype.hasOwnProperty.call(patch, key)) {
				const value = patch[key];
				if (value === void 0) if (Object.prototype.hasOwnProperty.call(baseStyle, key)) current[key] = baseStyle[key];
				else delete current[key];
				else current[key] = value;
			} else if (Object.prototype.hasOwnProperty.call(baseStyle, key)) current[key] = baseStyle[key];
			else delete current[key];
		});
		if (transition) transitionGraphicStyle(element, current, keys);
		else replaceGraphicStyle(element, current);
	}
	function transitionGraphicStyle(element, nextStyle, keys) {
		const target = createStyleTransitionTarget(nextStyle, keys);
		if (!Object.keys(target).length) {
			replaceGraphicStyle(element, nextStyle);
			return;
		}
		const animatable = element;
		animatable.stopAnimation?.(GRAPH_HOVER_TRANSITION_SCOPE, false);
		const animator = animatable.animate?.("style");
		if (!animator) {
			replaceGraphicStyle(element, nextStyle);
			return;
		}
		animator.scope = GRAPH_HOVER_TRANSITION_SCOPE;
		animator.when(GRAPH_HOVER_TRANSITION_DURATION, target).done?.(() => replaceGraphicStyle(element, nextStyle));
		animator.start(GRAPH_HOVER_TRANSITION_EASING);
	}
	function createStyleTransitionTarget(nextStyle, keys) {
		const target = {};
		keys.forEach((key) => {
			if (Object.prototype.hasOwnProperty.call(nextStyle, key)) {
				target[key] = nextStyle[key];
				return;
			}
			const fallback = styleTransitionFallbackValue(key);
			if (fallback !== void 0) target[key] = fallback;
		});
		return target;
	}
	function styleTransitionFallbackValue(key) {
		if (key === "opacity") return 1;
		if (key === "shadowBlur") return 0;
		if (key === "shadowColor") return "#000";
		if (key === "lineWidth") return 1;
	}
	function attachHoverHandlers(element, onEnter, onLeave) {
		const evented = element;
		evented.on?.("mouseover", onEnter);
		evented.on?.("mouseout", onLeave);
	}
	function formatCompactNumber(value) {
		const absValue = Math.abs(value);
		if (absValue >= 1e6) return trimFixed(value / 1e6, 1) + "M";
		if (absValue >= 1e3) return trimFixed(value / 1e3, 1) + "K";
		if (Number.isInteger(value)) return String(value);
		return trimFixed(value, 2);
	}
	function trimFixed(value, fractionDigits) {
		return value.toFixed(fractionDigits).replace(/\.0+$|(\.\d*[1-9])0+$/, "$1");
	}
	function resolveNodeValueFontSize(text, size) {
		const baseSize = Math.max(8, Math.min(14, size * .34));
		const maxWidth = Math.max(6, size * .78);
		const textWidth = measureText(text, baseSize, baseSize * 1.2).width;
		if (textWidth <= maxWidth) return baseSize;
		return Math.max(7, baseSize * (maxWidth / textWidth));
	}
	function createLabelSpec(seriesModel, itemModel, node, size) {
		const labelModel = itemModel.getModel("label");
		if (!(labelModel.get("show") ?? seriesModel.get(["label", "show"]))) return null;
		const rawPosition = labelModel.get("position") || seriesModel.get(["label", "position"]) || "right";
		const position = typeof rawPosition === "string" ? rawPosition : "right";
		const offset = size / 2 + 6;
		const formatter = labelModel.get("formatter") || seriesModel.get(["label", "formatter"]);
		const text = String(formatLabel(formatter, node) ?? "");
		const fontSize = finiteNumber(labelModel.get("fontSize") ?? seriesModel.get(["label", "fontSize"]), 12);
		const lineHeight = finiteNumber(labelModel.get("lineHeight") ?? seriesModel.get(["label", "lineHeight"]), fontSize * 1.2);
		const metrics = measureText(text, fontSize, lineHeight);
		return {
			node,
			text,
			color: labelModel.get("color") || seriesModel.get(["label", "color"]) || "#1f2937",
			fontSize,
			lineHeight,
			position,
			offset,
			style: {
				fontWeight: labelModel.get("fontWeight") || seriesModel.get(["label", "fontWeight"]),
				fontFamily: labelModel.get("fontFamily") || seriesModel.get(["label", "fontFamily"])
			},
			width: metrics.width,
			height: metrics.height
		};
	}
	function createLabelElement(echarts, placed) {
		return new echarts.graphic.Text({ style: {
			...placed.spec.style,
			x: placed.point.x,
			y: placed.point.y,
			text: placed.spec.text,
			fill: placed.spec.color,
			fontSize: placed.spec.fontSize,
			lineHeight: placed.spec.lineHeight,
			align: placed.point.align,
			verticalAlign: placed.point.verticalAlign
		} });
	}
	function createFisheyeLens(echarts, fisheye) {
		const lens = new echarts.graphic.Circle({
			shape: {
				cx: 0,
				cy: 0,
				r: fisheye.radius
			},
			style: {
				fill: null,
				stroke: fisheye.stroke,
				lineWidth: fisheye.strokeWidth,
				opacity: fisheye.opacity
			},
			ignore: true,
			silent: true,
			z2: 1e3
		});
		setAliveRenderKey(lens, "fisheye-lens");
		return lens;
	}
	function updateFisheyeRenderState(echarts, group, api, view, renderState, fisheye) {
		view.__fisheyeController?.dispose();
		view.__fisheyeController = void 0;
		clearFisheyePreviewTimer(view);
		if (!fisheye) {
			if (renderState.lens) setGraphicIgnore(renderState.lens, true);
			return;
		}
		if (!renderState.lens) {
			renderState.lens = createFisheyeLens(echarts, fisheye);
			group.add(renderState.lens);
		} else {
			setGraphicShape(renderState.lens, { r: fisheye.radius });
			setGraphicStyle(renderState.lens, {
				fill: null,
				stroke: fisheye.stroke,
				lineWidth: fisheye.strokeWidth,
				opacity: fisheye.opacity
			});
			setGraphicIgnore(renderState.lens, true);
		}
		view.__fisheyeController = installFisheye(api, renderState, fisheye);
		scheduleInitialFisheyePreview(view, renderState, fisheye, 0);
	}
	function readFisheyeOptions(seriesModel, viewport) {
		const raw = seriesModel.get("fisheye");
		if (raw === false) return null;
		const option = raw == null || raw === true ? {} : asRecord(raw);
		if (option.show === false || option.enabled === false) return null;
		const defaultRadius = Math.max(48, Math.min(viewport.width, viewport.height) * .32);
		const radius = resolveFisheyeNumber(option.radius, defaultRadius, Math.min(viewport.width, viewport.height));
		const scale = Math.max(1, finiteNumber(option.scale ?? option.magnification, 2.2));
		return {
			radius: Math.max(1, radius),
			scale,
			labelScale: Math.max(1, finiteNumber(option.labelScale, Math.min(scale, 1.55))),
			stroke: option.stroke || option.borderColor || "rgba(17, 24, 39, 0.86)",
			strokeWidth: Math.max(0, finiteNumber(option.strokeWidth ?? option.borderWidth, 3)),
			opacity: Math.max(0, Math.min(1, finiteNumber(option.opacity, .92))),
			preview: option.preview === true
		};
	}
	function scheduleInitialFisheyePreview(view, renderState, fisheye, delay) {
		if (!fisheye.preview) return;
		applyInitialFisheyePreview(renderState, fisheye);
		if (delay <= 0) return;
		view.__fisheyePreviewTimer = setTimeout(() => {
			view.__fisheyePreviewTimer = void 0;
			applyInitialFisheyePreview(renderState, fisheye);
		}, delay);
	}
	function applyInitialFisheyePreview(renderState, fisheye) {
		applyFisheye(renderState, fisheye, [renderState.viewport.x + renderState.viewport.width / 2, renderState.viewport.y + renderState.viewport.height / 2]);
	}
	function clearFisheyePreviewTimer(view) {
		if (view.__fisheyePreviewTimer === void 0) return;
		clearTimeout(view.__fisheyePreviewTimer);
		view.__fisheyePreviewTimer = void 0;
	}
	function readFisheyePreviewDelay(seriesModel, nodeCount) {
		return readNodeEnterAnimationEnd(seriesModel, nodeCount);
	}
	function installFisheye(api, renderState, fisheye) {
		const zr = api.getZr?.();
		if (!zr || !renderState.lens) return void 0;
		const handleMove = (event) => {
			const point = eventPoint(event);
			if (!point || !pointInRect(point, renderState.viewport)) {
				resetFisheye(renderState);
				return;
			}
			applyFisheye(renderState, fisheye, point);
		};
		const handleLeave = () => resetFisheye(renderState);
		zr.on("mousemove", handleMove);
		zr.on("globalout", handleLeave);
		zr.on("mouseout", handleLeave);
		return { dispose() {
			zr.off("mousemove", handleMove);
			zr.off("globalout", handleLeave);
			zr.off("mouseout", handleLeave);
			resetFisheye(renderState);
		} };
	}
	function applyFisheye(renderState, fisheye, focus) {
		const transforms = /* @__PURE__ */ new Map();
		const nodeById = new Map(renderState.nodes.map((node) => [node.id, node]));
		if (renderState.lens) {
			setGraphicShape(renderState.lens, {
				cx: focus[0],
				cy: focus[1],
				r: fisheye.radius
			});
			setGraphicIgnore(renderState.lens, false);
		}
		renderState.nodes.forEach((node) => {
			const transform = fisheyeTransform(node, fisheye, focus);
			transforms.set(node.id, transform);
			setGraphicShape(node.circle, {
				cx: transform.x,
				cy: transform.y,
				r: node.baseRadius * transform.scale
			});
			if (node.valueLabel) {
				const lineScale = transform.scale;
				setGraphicStyle(node.valueLabel, {
					x: transform.x,
					y: transform.y,
					fontSize: node.valueFontSize * lineScale,
					lineWidth: Math.max(1, node.valueLineWidth * lineScale)
				});
			}
		});
		renderState.labels.forEach((label) => {
			const node = nodeById.get(label.nodeId);
			const transform = transforms.get(label.nodeId);
			if (!node || !transform) return;
			const labelScale = 1 + (fisheye.labelScale - 1) * transform.influence;
			const offsetScale = 1 + (labelScale - 1) * .35;
			setGraphicStyle(label.element, {
				x: transform.x + (label.baseX - node.baseX) * offsetScale,
				y: transform.y + (label.baseY - node.baseY) * offsetScale,
				fontSize: label.baseFontSize * labelScale,
				lineHeight: label.baseLineHeight * labelScale
			});
		});
		renderState.edges.forEach((edge) => {
			const source = transforms.get(edge.sourceId);
			const target = transforms.get(edge.targetId);
			const baseSource = nodeById.get(edge.sourceId);
			const baseTarget = nodeById.get(edge.targetId);
			if (!source || !target || !baseSource || !baseTarget) return;
			updateFisheyeEdge(edge, [source.x, source.y], [target.x, target.y], true);
		});
	}
	function resetFisheye(renderState) {
		const nodeById = new Map(renderState.nodes.map((node) => [node.id, node]));
		if (renderState.lens) setGraphicIgnore(renderState.lens, true);
		renderState.nodes.forEach((node) => {
			setGraphicShape(node.circle, {
				cx: node.baseX,
				cy: node.baseY,
				r: node.baseRadius
			});
			if (node.valueLabel) setGraphicStyle(node.valueLabel, {
				x: node.baseX,
				y: node.baseY,
				fontSize: node.valueFontSize,
				lineWidth: node.valueLineWidth
			});
		});
		renderState.labels.forEach((label) => {
			setGraphicStyle(label.element, {
				x: label.baseX,
				y: label.baseY,
				fontSize: label.baseFontSize,
				lineHeight: label.baseLineHeight
			});
		});
		renderState.edges.forEach((edge) => {
			const source = nodeById.get(edge.sourceId);
			const target = nodeById.get(edge.targetId);
			if (!source || !target) return;
			updateFisheyeEdge(edge, [source.baseX, source.baseY], [target.baseX, target.baseY], false);
		});
	}
	function updateFisheyeEdge(edge, source, target, active) {
		if (edge.kind === "line") {
			setGraphicShape(edge.element, {
				x1: source[0],
				y1: source[1],
				x2: target[0],
				y2: target[1]
			});
			return;
		}
		const shape = createArcBezierShape(source, target);
		if (edge.kind === "arcPath" && edge.fisheyeElement) {
			if (!edge.fisheyeElementAdded) {
				edge.edgeGroup.add(edge.fisheyeElement);
				edge.fisheyeElementAdded = true;
			}
			setGraphicIgnore(edge.element, active);
			setGraphicIgnore(edge.fisheyeElement, !active);
			setGraphicShape(edge.fisheyeElement, shape);
			return;
		}
		setGraphicShape(edge.element, shape);
	}
	function fisheyeTransform(node, fisheye, focus) {
		const dx = node.baseX - focus[0];
		const dy = node.baseY - focus[1];
		const distance = Math.hypot(dx, dy);
		if (distance >= fisheye.radius) return {
			x: node.baseX,
			y: node.baseY,
			scale: 1,
			influence: 0
		};
		const ratio = 1 - distance / fisheye.radius;
		const influence = ratio * ratio * (3 - 2 * ratio);
		const scale = 1 + (fisheye.scale - 1) * influence;
		const distanceScale = 1 + (fisheye.scale - 1) * influence * .35;
		return {
			x: focus[0] + dx * distanceScale,
			y: focus[1] + dy * distanceScale,
			scale,
			influence
		};
	}
	function eventPoint(event) {
		const x = finiteNumber(event.offsetX, finiteNumber(event.zrX, NaN));
		const y = finiteNumber(event.offsetY, finiteNumber(event.zrY, NaN));
		return Number.isFinite(x) && Number.isFinite(y) ? [x, y] : null;
	}
	function pointInRect(point, rect) {
		return point[0] >= rect.x && point[0] <= rect.x + rect.width && point[1] >= rect.y && point[1] <= rect.y + rect.height;
	}
	function resolveFisheyeNumber(value, fallback, percentBase) {
		if (typeof value === "string" && value.endsWith("%")) {
			const ratio = Number(value.slice(0, -1));
			return Number.isFinite(ratio) ? percentBase * ratio / 100 : fallback;
		}
		return finiteNumber(value, fallback);
	}
	function getLabelPoint(node, position, offset) {
		const points = {
			top: {
				x: node.x,
				y: node.y - offset,
				align: "center",
				verticalAlign: "bottom"
			},
			bottom: {
				x: node.x,
				y: node.y + offset,
				align: "center",
				verticalAlign: "top"
			},
			left: {
				x: node.x - offset,
				y: node.y,
				align: "right",
				verticalAlign: "middle"
			},
			right: {
				x: node.x + offset,
				y: node.y,
				align: "left",
				verticalAlign: "middle"
			}
		};
		return isLabelPosition(position) ? points[position] : points.right;
	}
	function placeLabels(renderNodes, layoutType, viewport) {
		const labels = renderNodes.filter((item) => item.labelSpec);
		const placed = /* @__PURE__ */ new Map();
		if (!labels.length) return placed;
		const occupied = renderNodes.map((item) => expandRect(item.circleBox, LABEL_COLLISION_PADDING));
		const labelViewport = expandRect(viewport, -LABEL_VIEWPORT_PADDING);
		const center = graphCenter(renderNodes);
		labels.slice().sort((left, right) => {
			const leftDistance = distanceFromCenter(left.node, center);
			return distanceFromCenter(right.node, center) - leftDistance || right.size - left.size || left.dataIndex - right.dataIndex;
		}).forEach((item) => {
			const spec = item.labelSpec;
			if (!spec) return;
			const candidates = createLabelCandidates(spec, layoutType, center);
			let best = null;
			let bestScore = Infinity;
			for (const point of candidates) {
				const box = textBoxFromLabelPoint(spec, point);
				const outside = outsideArea(box, labelViewport);
				const overlap = overlapArea(box, occupied);
				const distance = Math.hypot(point.x - spec.node.x, point.y - spec.node.y);
				const score = overlap * 1e4 + outside * 1e3 + distance;
				if (score < bestScore) {
					bestScore = score;
					best = {
						spec,
						point,
						box
					};
				}
				if (overlap === 0 && outside === 0) break;
			}
			if (!best) return;
			if (outsideArea(best.box, labelViewport) > 0) best = clampPlacedLabel(best, labelViewport);
			placed.set(item.node.id, best);
			occupied.push(expandRect(best.box, LABEL_COLLISION_PADDING));
		});
		return placed;
	}
	function createLabelCandidates(spec, layoutType, center) {
		const positions = orderedLabelPositions(spec.node, spec.position, layoutType, center);
		const candidates = [];
		for (let extraOffset = 0; extraOffset <= 180; extraOffset += 12) positions.forEach((position) => {
			candidates.push(getLabelPoint(spec.node, position, spec.offset + extraOffset));
		});
		return candidates;
	}
	function orderedLabelPositions(node, configuredPosition, layoutType, center) {
		const radialPosition = outwardLabelPosition(node, center);
		const preferred = isLabelPosition(configuredPosition) ? configuredPosition : radialPosition;
		const primary = layoutType === "arc" ? preferred : radialPosition;
		const secondary = primary === preferred ? radialPosition : preferred;
		const positions = [];
		[
			primary,
			secondary,
			"right",
			"left",
			"top",
			"bottom"
		].forEach((position) => {
			if (!positions.includes(position)) positions.push(position);
		});
		return positions;
	}
	function outwardLabelPosition(node, center) {
		const dx = node.x - center[0];
		const dy = node.y - center[1];
		if (Math.abs(dx) >= Math.abs(dy)) return dx < 0 ? "left" : "right";
		return dy < 0 ? "top" : "bottom";
	}
	function textBoxFromLabelPoint(spec, point) {
		let x = point.x;
		let y = point.y;
		if (point.align === "center") x -= spec.width / 2;
		if (point.align === "right") x -= spec.width;
		if (point.verticalAlign === "middle") y -= spec.height / 2;
		if (point.verticalAlign === "bottom") y -= spec.height;
		return {
			x,
			y,
			width: spec.width,
			height: spec.height
		};
	}
	function clampPlacedLabel(label, viewport) {
		const clampedBox = {
			...label.box,
			x: Math.min(Math.max(label.box.x, viewport.x), viewport.x + viewport.width - label.box.width),
			y: Math.min(Math.max(label.box.y, viewport.y), viewport.y + viewport.height - label.box.height)
		};
		const dx = clampedBox.x - label.box.x;
		const dy = clampedBox.y - label.box.y;
		return {
			...label,
			point: {
				...label.point,
				x: label.point.x + dx,
				y: label.point.y + dy
			},
			box: clampedBox
		};
	}
	function measureText(text, fontSize, lineHeight) {
		const lines = text.split("\n");
		return {
			width: Math.max(...lines.map((line) => line.length), 1) * fontSize * .62,
			height: lines.length * lineHeight
		};
	}
	function circleBox(node, radius) {
		return {
			x: node.x - radius,
			y: node.y - radius,
			width: radius * 2,
			height: radius * 2
		};
	}
	function graphCenter(renderNodes) {
		if (!renderNodes.length) return [0, 0];
		return [renderNodes.reduce((sum, item) => sum + item.node.x, 0) / renderNodes.length, renderNodes.reduce((sum, item) => sum + item.node.y, 0) / renderNodes.length];
	}
	function distanceFromCenter(node, center) {
		return Math.hypot(node.x - center[0], node.y - center[1]);
	}
	function expandRect(rect, padding) {
		return {
			x: rect.x - padding,
			y: rect.y - padding,
			width: rect.width + padding * 2,
			height: rect.height + padding * 2
		};
	}
	function overlapArea(rect, others) {
		return others.reduce((sum, other) => sum + intersectArea(rect, other), 0);
	}
	function intersectArea(left, right) {
		const width = Math.min(left.x + left.width, right.x + right.width) - Math.max(left.x, right.x);
		const height = Math.min(left.y + left.height, right.y + right.height) - Math.max(left.y, right.y);
		return width > 0 && height > 0 ? width * height : 0;
	}
	function outsideArea(rect, bounds) {
		const horizontal = Math.max(bounds.x - rect.x, 0) + Math.max(rect.x + rect.width - (bounds.x + bounds.width), 0);
		const vertical = Math.max(bounds.y - rect.y, 0) + Math.max(rect.y + rect.height - (bounds.y + bounds.height), 0);
		return horizontal * rect.height + vertical * rect.width;
	}
	function formatLabel(formatter, node) {
		if (typeof formatter === "function") return formatter({
			data: node,
			name: node.name,
			value: node.value
		});
		if (typeof formatter === "string") return formatter.replace(/\{b\}/g, node.name).replace(/\{c\}/g, String(node.value ?? ""));
		return node.name;
	}
	function readNodeSize(seriesModel, data, node, dataIndex, defaultNodeSize) {
		const symbolSize = node.symbolSize ?? node.size ?? data.getItemVisual(dataIndex, "symbolSize") ?? seriesModel.get("symbolSize");
		if (symbolSize == null) return defaultNodeSize(node);
		if (typeof symbolSize === "function") return finiteNumber(symbolSize(node, dataIndex), DEFAULT_NODE_SIZE);
		if (Array.isArray(symbolSize)) return finiteNumber(Math.max(...symbolSize.map((item) => finiteNumber(item, 0))), DEFAULT_NODE_SIZE);
		return finiteNumber(symbolSize, DEFAULT_NODE_SIZE);
	}
	function readNodeStyle(seriesModel, itemModel, data, dataIndex) {
		const normal = asRecord(seriesModel.get("itemStyle"));
		const itemStyle = asRecord(itemModel.get("itemStyle"));
		const visualStyle = asRecord(data.getItemVisual(dataIndex, "style"));
		return {
			fill: itemStyle.color || normal.color || visualStyle.fill || "#5470c6",
			stroke: itemStyle.borderColor || normal.borderColor || "#fff",
			lineWidth: finiteNumber(itemStyle.borderWidth ?? normal.borderWidth, 1),
			opacity: finiteNumber(itemStyle.opacity ?? normal.opacity, 1)
		};
	}
	function readEdgeStyle(seriesModel, edge) {
		const normal = asRecord(seriesModel.get("edgeStyle"));
		const lineStyle = edge.lineStyle || {};
		return {
			stroke: lineStyle.color || normal.color || "#9aa4b2",
			lineWidth: finiteNumber(lineStyle.width ?? normal.width, 1),
			opacity: finiteNumber(lineStyle.opacity ?? normal.opacity, .45),
			fill: null
		};
	}
	function readEdgeAnimation(seriesModel, edge, edgeIndex, delayOffset = 0) {
		const animationOption = edge.edgeAnimation ?? seriesModel.get("edgeAnimation");
		const fallbackToEnterAnimation = animationOption == null;
		const resolvedAnimationOption = fallbackToEnterAnimation ? seriesModel.get("enterAnimation") : animationOption;
		const animation = readEnterAnimation(seriesModel, edgeIndex, resolvedAnimationOption);
		if (!animation.enabled || delayOffset <= 0) return animation;
		const repeatedBaseDelay = fallbackToEnterAnimation ? readEnterAnimationBaseDelay(seriesModel, edgeIndex, resolvedAnimationOption) : 0;
		return {
			...animation,
			delay: delayOffset + Math.max(0, animation.delay - repeatedBaseDelay)
		};
	}
	function readEnterAnimation(seriesModel, itemIndex, animationOption = seriesModel.get("enterAnimation")) {
		if (seriesModel.get("animation") === false || animationOption === false) return createDisabledEdgeAnimation();
		const option = animationOption == null || animationOption === true ? {} : asRecord(animationOption);
		if (option.show === false || option.enabled === false) return createDisabledEdgeAnimation();
		const baseDelay = resolveAnimationNumber(option.delay ?? seriesModel.get("animationDelay"), itemIndex, itemIndex, 0);
		const stagger = resolveAnimationNumber(option.stagger, itemIndex, itemIndex, 0);
		return {
			enabled: true,
			duration: resolveAnimationNumber(option.duration ?? seriesModel.get("animationDuration"), itemIndex, itemIndex, 600),
			delay: baseDelay + itemIndex * stagger,
			easing: resolveAnimationEasing(option.easing ?? seriesModel.get("animationEasing"))
		};
	}
	function readEnterAnimationBaseDelay(seriesModel, itemIndex, animationOption = seriesModel.get("enterAnimation")) {
		return resolveAnimationNumber((animationOption == null || animationOption === true ? {} : asRecord(animationOption)).delay ?? seriesModel.get("animationDelay"), itemIndex, itemIndex, 0);
	}
	function readNodeEnterAnimationEnd(seriesModel, nodeCount) {
		let end = 0;
		for (let nodeIndex = 0; nodeIndex < nodeCount; nodeIndex += 1) {
			const animation = readEnterAnimation(seriesModel, nodeIndex);
			if (animation.enabled) end = Math.max(end, animation.delay + animation.duration);
		}
		return end;
	}
	function createDisabledEdgeAnimation() {
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
	function applyEdgeConnectionAnimation(element, targetKey, propertyName, animation) {
		if (!animation.enabled) return;
		const animatable = element;
		if (typeof animatable.animate !== "function") return;
		const target = animatable[targetKey] || {};
		target[propertyName] = 0;
		animatable[targetKey] = target;
		const animator = animatable.animate(targetKey);
		if (!animator) {
			target[propertyName] = 1;
			return;
		}
		const chain = animator.when(animation.duration, { [propertyName]: 1 });
		if (animation.delay > 0) chain.delay?.(animation.delay);
		chain.start(animation.easing);
	}
	function applyNodeEnterAnimation(element, size, animation) {
		if (!animation.enabled) return;
		const animatable = element;
		if (typeof animatable.animate !== "function") return;
		const shape = animatable.shape || {};
		const style = animatable.style || {};
		const radius = finiteNumber(shape.r, size / 2);
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
	function setGraphicShape(element, shape) {
		const target = element;
		const next = {
			...asRecord(target.shape),
			...shape
		};
		if (typeof target.setShape === "function") target.setShape(next);
		else if (typeof target.attr === "function") target.attr("shape", next);
		else target.shape = next;
	}
	function setGraphicStyle(element, style) {
		const target = element;
		const next = {
			...asRecord(target.style),
			...style
		};
		if (typeof target.setStyle === "function") target.setStyle(next);
		else if (typeof target.attr === "function") target.attr("style", next);
		else target.style = next;
	}
	function replaceGraphicStyle(element, style) {
		const target = element;
		const next = cloneRecord(style);
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
		return cloneRecord(asRecord(element.style));
	}
	function cloneRecord(record) {
		return { ...record };
	}
	function setGraphicIgnore(element, ignore) {
		const target = element;
		if (typeof target.attr === "function") target.attr("ignore", ignore);
		else target.ignore = ignore;
	}
	function finiteNumber(value, fallback) {
		return typeof value === "number" && Number.isFinite(value) ? value : fallback;
	}
	function createValueNodeSizeResolver(nodes) {
		const values = nodes.map((node) => toNumericValue(readNodeValue(node))).filter((value) => value != null);
		const minValue = values.length ? Math.min(...values) : 0;
		const maxValue = values.length ? Math.max(...values) : 0;
		if (!values.length || minValue === maxValue) return () => DEFAULT_NODE_SIZE;
		return (node) => {
			const value = toNumericValue(readNodeValue(node));
			if (value == null) return DEFAULT_NODE_SIZE;
			const ratio = (value - minValue) / (maxValue - minValue);
			return DEFAULT_MIN_VALUE_NODE_SIZE + Math.max(0, Math.min(1, ratio)) * (DEFAULT_MAX_VALUE_NODE_SIZE - DEFAULT_MIN_VALUE_NODE_SIZE);
		};
	}
	function readNodeValue(node) {
		return node != null && typeof node === "object" ? node.value : void 0;
	}
	function toNumericValue(value) {
		if (typeof value === "number" && Number.isFinite(value)) return value;
		if (typeof value === "string" && value.trim()) {
			const numeric = Number(value);
			return Number.isFinite(numeric) ? numeric : void 0;
		}
		if (Array.isArray(value)) for (const item of value) {
			const numeric = toNumericValue(item);
			if (numeric != null) return numeric;
		}
	}
	function shouldSequenceEdgesAfterNodes(layoutType) {
		return layoutType === "radial" || layoutType === "concentric" || layoutType === "grid" || layoutType === "mds" || layoutType === "arc";
	}
	function isLabelPosition(value) {
		return value === "top" || value === "bottom" || value === "left" || value === "right";
	}
	function asRecord(value) {
		return value != null && typeof value === "object" && !Array.isArray(value) ? value : {};
	}
	//#endregion
	//#region src/arc.ts
	installGraphLayout(echarts_lib_echarts, {
		chartType: "arc",
		layoutType: "arc"
	});
	//#endregion
});

//# sourceMappingURL=echarts-arc.js.map