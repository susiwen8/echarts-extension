import { allPairsShortestPaths, applySingleNodeLayout, buildLayoutGraph, finiteNumber, getNodeSize, normalizeViewport, replaceInfinity, toPublicResult } from './graph-utils.js';
export function computeMDSLayout(input, options = {}) {
    const graph = buildLayoutGraph(input);
    const { center } = normalizeViewport(options);
    if (graph.nodes.length <= 1)
        return applySingleNodeLayout(graph, center);
    const configuredLinkDistance = options.linkDistance;
    const linkDistance = typeof configuredLinkDistance === 'number' && Number.isFinite(configuredLinkDistance)
        ? configuredLinkDistance
        : 50;
    const distances = replaceInfinity(allPairsShortestPaths(graph)).map((row) => row.map((value) => value * linkDistance));
    const positions = runMDS(distances, 2, linkDistance);
    graph.nodes.forEach((node, index) => {
        node.x = positions[index][0] + center[0];
        node.y = positions[index][1] + center[1];
    });
    if (options.preventOverlap !== false) {
        preventMDSOverlap(graph, center, options);
    }
    return toPublicResult(graph);
}
function preventMDSOverlap(graph, center, options) {
    const sizes = graph.nodes.map((node) => getNodeSize(node, options, { nodeSize: 20, nodeSpacing: 8 }));
    const maxIteration = Math.max(1, Math.min(finiteNumber(options.maxPreventOverlapIteration, 400), 800));
    const damping = 0.72;
    for (let iteration = 0; iteration < maxIteration; iteration += 1) {
        let maxOverlap = 0;
        const displacements = graph.nodes.map(() => ({ x: 0, y: 0 }));
        for (let i = 0; i < graph.nodes.length; i += 1) {
            for (let j = i + 1; j < graph.nodes.length; j += 1) {
                const left = graph.nodes[i];
                const right = graph.nodes[j];
                const minDistance = (sizes[i] + sizes[j]) / 2;
                let dx = left.x - right.x;
                let dy = left.y - right.y;
                let distance = Math.hypot(dx, dy);
                if (distance < 1e-6) {
                    const angle = deterministicPairAngle(i, j, graph.nodes.length);
                    dx = Math.cos(angle) * 0.01;
                    dy = Math.sin(angle) * 0.01;
                    distance = 0.01;
                }
                if (distance >= minDistance)
                    continue;
                const overlap = minDistance - distance;
                maxOverlap = Math.max(maxOverlap, overlap);
                const force = (overlap / 2 + 0.02) * damping;
                const fx = (dx / distance) * force;
                const fy = (dy / distance) * force;
                displacements[i].x += fx;
                displacements[i].y += fy;
                displacements[j].x -= fx;
                displacements[j].y -= fy;
            }
        }
        graph.nodes.forEach((node, index) => {
            node.x += displacements[index].x;
            node.y += displacements[index].y;
        });
        recenterNodes(graph, center);
        if (maxOverlap < 0.05)
            break;
    }
}
function deterministicPairAngle(leftIndex, rightIndex, count) {
    const seed = ((leftIndex + 1) * 73856093) ^ ((rightIndex + 1) * 19349663) ^ (count * 83492791);
    return ((seed >>> 0) % 3600) / 3600 * Math.PI * 2;
}
function recenterNodes(graph, center) {
    if (!graph.nodes.length)
        return;
    const centroid = graph.nodes.reduce((sum, node) => {
        sum.x += node.x;
        sum.y += node.y;
        return sum;
    }, { x: 0, y: 0 });
    const dx = center[0] - centroid.x / graph.nodes.length;
    const dy = center[1] - centroid.y / graph.nodes.length;
    graph.nodes.forEach((node) => {
        node.x += dx;
        node.y += dy;
    });
}
export function runMDS(distances, dimension = 2, fallbackDistance = 50) {
    const n = distances.length;
    if (!n)
        return [];
    if (n === 1)
        return [[0, 0]];
    const squared = distances.map((row) => row.map((value) => -0.5 * value * value));
    const rowMeans = squared.map((row) => mean(row));
    const colMeans = squared[0].map((_, col) => mean(squared.map((row) => row[col])));
    const totalMean = mean(rowMeans);
    const matrix = squared.map((row, i) => row.map((value, j) => value - rowMeans[i] - colMeans[j] + totalMean));
    const eigen = jacobiEigenDecomposition(matrix);
    if (!eigen.length)
        return fallbackCircle(n, fallbackDistance);
    const positive = eigen.filter((item) => item.value > 1e-9).slice(0, dimension);
    if (!positive.length)
        return fallbackCircle(n, fallbackDistance);
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
    if (!n)
        return [];
    const a = input.map((row) => row.slice());
    const vectors = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
    const maxIterations = Math.max(40, n * n * 20);
    for (let iteration = 0; iteration < maxIterations; iteration++) {
        let p = 0;
        let q = 1;
        let max = 0;
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const value = Math.abs(a[i][j]);
                if (value > max) {
                    max = value;
                    p = i;
                    q = j;
                }
            }
        }
        if (max < 1e-10)
            break;
        const app = a[p][p];
        const aqq = a[q][q];
        const apq = a[p][q];
        const theta = (aqq - app) / (2 * apq);
        const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        const c = 1 / Math.sqrt(t * t + 1);
        const s = t * c;
        for (let k = 0; k < n; k++) {
            if (k === p || k === q)
                continue;
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
    return a
        .map((row, index) => ({
        value: row[index],
        vector: vectors.map((vectorRow) => vectorRow[index])
    }))
        .sort((left, right) => right.value - left.value);
}
function fallbackCircle(n, distance) {
    const radius = Math.max(distance, 1);
    return Array.from({ length: n }, (_, index) => {
        const angle = (Math.PI * 2 * index) / n;
        return [Math.cos(angle) * radius, Math.sin(angle) * radius];
    });
}
function mean(values) {
    if (!values.length)
        return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}
//# sourceMappingURL=mds-layout.js.map