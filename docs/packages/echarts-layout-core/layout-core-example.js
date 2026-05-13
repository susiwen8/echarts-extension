const graph = {
  data: [
    { id: 'root', name: 'Root' },
    { id: 'alpha', name: 'Alpha' },
    { id: 'beta', name: 'Beta' },
    { id: 'gamma', name: 'Gamma' },
    { id: 'delta', name: 'Delta' },
    { id: 'epsilon', name: 'Epsilon' },
    { id: 'zeta', name: 'Zeta' }
  ],
  links: [
    { source: 'root', target: 'alpha' },
    { source: 'root', target: 'beta' },
    { source: 'root', target: 'gamma' },
    { source: 'alpha', target: 'delta' },
    { source: 'alpha', target: 'epsilon' },
    { source: 'beta', target: 'zeta' },
    { source: 'gamma', target: 'epsilon' }
  ]
};

const layoutCaseDefinitions = [
  {
    id: 'radial',
    title: 'Radial',
    options: {
      unitRadius: 72,
      linkDistance: 110,
      preventOverlap: true,
      nodeSize: 22,
      sortBy: 'data'
    }
  },
  {
    id: 'concentric',
    title: 'Concentric',
    options: {
      nodeSize: 30,
      maxLevelDiff: 1,
      sortBy: 'degree',
      preventOverlap: true
    }
  },
  {
    id: 'grid',
    title: 'Grid',
    options: {
      width: 360,
      height: 220,
      cols: 4,
      rows: 2,
      nodeSize: 24,
      nodeSpacing: 8,
      preventOverlap: true,
      sortBy: 'data'
    }
  },
  {
    id: 'mds',
    title: 'MDS',
    options: {
      linkDistance: 82
    }
  },
  {
    id: 'arc',
    title: 'Arc',
    options: {
      nodeSep: 44,
      nodeSize: 18
    }
  }
];

const host = document.getElementById('layouts');
const cases = layoutCaseDefinitions.map((definition) => ({
  ...definition,
  graph: cloneGraph(graph),
  addCount: 0
}));

cases.forEach((layoutCase) => {
  const card = document.createElement('article');
  card.className = 'layout-card';
  card.innerHTML = `
    <div class="layout-card__header">
      <h2>${layoutCase.title}</h2>
      <div class="layout-card__tools">
        <span class="layout-card__zoom">100%</span>
        <button class="layout-card__button layout-card__button--primary" data-layout-add type="button">添加数据</button>
        <button class="layout-card__button" data-layout-delete type="button">删除数据</button>
        <button class="layout-card__button" data-layout-reset type="button">Reset view</button>
      </div>
    </div>
    <div class="layout-card__event">Click None</div>
    <div class="layout-card__visual">${renderLayout(layoutCase.id, computeLayoutCase(layoutCase))}</div>
  `;
  host.append(card);
  attachLayoutInteractions(card, layoutCase);
});

function renderLayout(type, layout) {
  const width = 520;
  const height = 286;
  const projected = type === 'arc'
    ? projectArc(layout.nodes, width, height)
    : project(layout.nodes, width, height);
  const byId = new Map(projected.map((node) => [node.id, node]));
  const edges = layout.edges.map((edge) => {
    const source = byId.get(edge.source);
    const target = byId.get(edge.target);
    if (!source || !target) return '';
    const name = `${source.name} -> ${target.name}`;
    const edgeId = `${edge.source}-${edge.target}`;
    if (type === 'arc') {
      return `<path class="layout-edge" data-layout-kind="edge" data-layout-id="${escapeHtml(edgeId)}" data-layout-name="${escapeHtml(name)}" d="${pathToString(createArcPath([source.x, source.y], [target.x, target.y]))}" fill="none" stroke="#9aa4b2" stroke-width="1.4"/>`;
    }
    return `<line class="layout-edge" data-layout-kind="edge" data-layout-id="${escapeHtml(edgeId)}" data-layout-name="${escapeHtml(name)}" x1="${source.x}" y1="${source.y}" x2="${target.x}" y2="${target.y}" stroke="#9aa4b2" stroke-width="1.4"/>`;
  }).join('');
  const nodes = projected.map((node, index) => {
    const color = ['#2454a6', '#248f6a', '#c77725', '#9c4f97', '#5f6fb4', '#c4554d', '#4b8f8c'][index % 7];
    return `<g class="layout-node" data-layout-kind="node" data-layout-id="${escapeHtml(node.id)}" data-layout-name="${escapeHtml(node.name)}" data-layout-index="${index}" data-layout-x="${node.x}" data-layout-y="${node.y}">
      <circle cx="${node.x}" cy="${node.y}" r="12" fill="${color}" stroke="#fff" stroke-width="2"/>
      <text x="${node.x + 16}" y="${node.y + 4}" fill="#374151" font-size="12" font-family="system-ui, sans-serif">${escapeHtml(node.name)}</text>
    </g>`;
  }).join('');

  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${type} layout example">
    <rect width="${width}" height="${height}" fill="#ffffff"/>
    <g class="layout-viewport">
      ${edges}
      ${nodes}
    </g>
  </svg>`;
}

function attachLayoutInteractions(card, layoutCase) {
  const visual = card.querySelector('.layout-card__visual');
  const eventLabel = card.querySelector('.layout-card__event');
  const zoomLabel = card.querySelector('.layout-card__zoom');
  const addButton = card.querySelector('[data-layout-add]');
  const deleteButton = card.querySelector('[data-layout-delete]');
  const resetButton = card.querySelector('[data-layout-reset]');
  if (!visual) return;

  const state = { x: 0, y: 0, scale: 1 };
  let dragging = false;
  let movedDuringDrag = false;
  let lastPointerX = 0;
  let lastPointerY = 0;
  let suppressClickUntil = 0;

  addButton?.addEventListener('click', () => {
    const before = readLayoutPositions(card);
    appendLayoutData(layoutCase);
    visual.innerHTML = renderLayout(layoutCase.id, computeLayoutCase(layoutCase));
    const viewport = card.querySelector('.layout-viewport');
    if (viewport) applySvgViewport(viewport, zoomLabel, state);
    animateLayoutUpdate(card, before);
    eventLabel.textContent = `Added ${layoutCase.addCount} · ${layoutCase.graph.data.length} nodes`;
  });

  deleteButton?.addEventListener('click', () => {
    const before = readLayoutPositions(card);
    const removed = deleteLayoutData(layoutCase);
    if (!removed) return;
    visual.innerHTML = renderLayout(layoutCase.id, computeLayoutCase(layoutCase));
    const viewport = card.querySelector('.layout-viewport');
    if (viewport) applySvgViewport(viewport, zoomLabel, state);
    animateLayoutUpdate(card, before);
    eventLabel.textContent = `Deleted ${removed.name} · ${layoutCase.graph.data.length} nodes`;
  });

  resetButton?.addEventListener('click', () => {
    state.x = 0;
    state.y = 0;
    state.scale = 1;
    const viewport = card.querySelector('.layout-viewport');
    if (viewport) applySvgViewport(viewport, zoomLabel, state);
  });

  visual.addEventListener('wheel', (event) => {
    const svg = card.querySelector('svg');
    const viewport = card.querySelector('.layout-viewport');
    if (!svg || !viewport) return;
    event.preventDefault();
    const point = svgPoint(svg, event.clientX, event.clientY);
    zoomSvgViewport(state, event.deltaY <= 0 ? 1 : -1, point.x, point.y);
    applySvgViewport(viewport, zoomLabel, state);
  }, { passive: false });

  visual.addEventListener('pointerdown', (event) => {
    const svg = card.querySelector('svg');
    if (!svg) return;
    if (event.button != null && event.button !== 0) return;
    dragging = true;
    movedDuringDrag = false;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    svg.classList.add('is-panning');
    safelySetPointerCapture(svg, event.pointerId);
  });

  visual.addEventListener('pointermove', (event) => {
    const svg = card.querySelector('svg');
    const viewport = card.querySelector('.layout-viewport');
    if (!svg || !viewport) return;
    if (!dragging) return;
    const delta = svgDelta(svg, event.clientX - lastPointerX, event.clientY - lastPointerY);
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    if (!delta.x && !delta.y) return;
    movedDuringDrag = true;
    event.preventDefault();
    state.x += delta.x;
    state.y += delta.y;
    applySvgViewport(viewport, zoomLabel, state);
  });

  const stopDragging = (event) => {
    const svg = card.querySelector('svg');
    if (!dragging) return;
    dragging = false;
    svg?.classList.remove('is-panning');
    safelyReleasePointerCapture(svg, event.pointerId);
    if (movedDuringDrag) suppressClickUntil = Date.now() + 160;
  };
  visual.addEventListener('pointerup', stopDragging);
  visual.addEventListener('pointercancel', stopDragging);
  visual.addEventListener('lostpointercapture', stopDragging);

  visual.addEventListener('mouseover', (event) => {
    const target = closestLayoutTarget(event.target);
    if (!target) return;
    target.classList.add('is-hovered');
    eventLabel.textContent = `Hover · ${target.dataset.layoutKind} · ${target.dataset.layoutName}`;
  });

  visual.addEventListener('mouseout', (event) => {
    const target = closestLayoutTarget(event.target);
    if (!target || target.contains(event.relatedTarget)) return;
    target.classList.remove('is-hovered');
    eventLabel.textContent = 'Click None';
  });

  visual.addEventListener('click', (event) => {
    if (Date.now() < suppressClickUntil) return;
    const target = closestLayoutTarget(event.target);
    if (!target) return;
    eventLabel.textContent = `Click ${formatLayoutTime(new Date())} · ${target.dataset.layoutKind} · ${target.dataset.layoutName}`;
  });
}

function computeLayoutCase(layoutCase) {
  return computeGraphLayout(layoutCase.id, layoutCase.graph, layoutCase.options);
}

function appendLayoutData(layoutCase) {
  layoutCase.addCount += 1;
  const index = layoutCase.addCount;
  const id = `added-${layoutCase.id}-${index}`;
  const parent = layoutCase.graph.data[(index * 3) % layoutCase.graph.data.length] || layoutCase.graph.data[0];
  layoutCase.graph.data.push({
    id,
    name: `Added ${index}`
  });
  if (parent) {
    layoutCase.graph.links.push({
      source: parent.id,
      target: id
    });
  }
}

function deleteLayoutData(layoutCase) {
  const nodes = layoutCase.graph.data;
  if (!Array.isArray(nodes) || nodes.length <= 1) return null;
  const index = findLayoutDeleteIndex(nodes);
  const [removed] = nodes.splice(index, 1);
  const removedId = String(removed.id);
  layoutCase.graph.links = layoutCase.graph.links.filter((link) => (
    String(link.source) !== removedId && String(link.target) !== removedId
  ));
  return removed;
}

function findLayoutDeleteIndex(nodes) {
  for (let index = nodes.length - 1; index >= 1; index -= 1) {
    if (/^added-/.test(String(nodes[index].id))) return index;
  }
  return nodes.length - 1;
}

function animateLayoutUpdate(card, previousPositions) {
  card.querySelectorAll('.layout-node').forEach((node) => {
    const id = node.dataset.layoutId;
    const previous = previousPositions.get(id);
    const next = readNodePosition(node);
    if (!next) return;

    if (previous && typeof node.animate === 'function') {
      node.animate([
        { transform: `translate(${previous.x - next.x}px, ${previous.y - next.y}px)` },
        { transform: 'translate(0, 0)' }
      ], {
        duration: 120,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
      });
      return;
    }

    if (typeof node.animate === 'function') {
      node.animate([
        { opacity: 0, transform: 'scale(0.2)' },
        { opacity: 1, transform: 'scale(1)' }
      ], {
        duration: 120,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
      });
    }
  });

  card.querySelectorAll('.layout-edge').forEach((edge) => {
    if (typeof edge.animate !== 'function') return;
    edge.animate([
      { opacity: 0 },
      { opacity: 1 }
    ], {
      duration: 120,
      easing: 'ease-out'
    });
  });
}

function readLayoutPositions(card) {
  const positions = new Map();
  card.querySelectorAll('.layout-node').forEach((node) => {
    const position = readNodePosition(node);
    if (node.dataset.layoutId && position) positions.set(node.dataset.layoutId, position);
  });
  return positions;
}

function readNodePosition(node) {
  const x = Number(node.dataset.layoutX);
  const y = Number(node.dataset.layoutY);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x, y };
}

function zoomSvgViewport(state, direction, originX, originY) {
  const nextScale = Math.min(4, Math.max(0.45, state.scale * (direction >= 0 ? 1.12 : 1 / 1.12)));
  const ratio = nextScale / state.scale;
  state.x = originX - (originX - state.x) * ratio;
  state.y = originY - (originY - state.y) * ratio;
  state.scale = nextScale;
}

function applySvgViewport(viewport, zoomLabel, state) {
  viewport.setAttribute('transform', `translate(${state.x} ${state.y}) scale(${state.scale})`);
  if (zoomLabel) zoomLabel.textContent = `${Math.round(state.scale * 100)}%`;
}

function svgPoint(svg, clientX, clientY) {
  const rect = svg.getBoundingClientRect();
  const viewBox = svg.viewBox.baseVal;
  return {
    x: viewBox.x + ((clientX - rect.left) / Math.max(rect.width, 1)) * viewBox.width,
    y: viewBox.y + ((clientY - rect.top) / Math.max(rect.height, 1)) * viewBox.height
  };
}

function svgDelta(svg, dx, dy) {
  const rect = svg.getBoundingClientRect();
  const viewBox = svg.viewBox.baseVal;
  return {
    x: (dx / Math.max(rect.width, 1)) * viewBox.width,
    y: (dy / Math.max(rect.height, 1)) * viewBox.height
  };
}

function closestLayoutTarget(target) {
  return target instanceof Element ? target.closest('.layout-node, .layout-edge') : null;
}

function formatLayoutTime(date) {
  return [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map((part) => String(part).padStart(2, '0'))
    .join(':');
}

function safelySetPointerCapture(element, pointerId) {
  try {
    element.setPointerCapture?.(pointerId);
  } catch (error) {
    // Synthetic pointer events in browser tests may not have an active pointer.
  }
}

function safelyReleasePointerCapture(element, pointerId) {
  try {
    element.releasePointerCapture?.(pointerId);
  } catch (error) {
    // Matching the guarded set call keeps non-native pointer tests quiet.
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function project(nodes, width, height) {
  const xs = nodes.map((node) => node.x);
  const ys = nodes.map((node) => node.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = Math.max(maxX - minX, 1);
  const spanY = Math.max(maxY - minY, 1);
  const padding = 46;

  return nodes.map((node) => ({
    ...node,
    x: padding + ((node.x - minX) / spanX) * (width - padding * 2),
    y: padding + ((node.y - minY) / spanY) * (height - padding * 2)
  }));
}

function projectArc(nodes, width, height) {
  const padding = 46;
  const projected = project(nodes, width, height).map((node) => ({
    ...node,
    y: height - padding
  }));
  const xs = projected.map((node) => node.x);
  const maxArcRadius = (Math.max(...xs) - Math.min(...xs)) / 2;
  const baseline = Math.min(height - padding, maxArcRadius + 24);

  return projected.map((node) => ({
    ...node,
    y: baseline
  }));
}

function computeGraphLayout(type, input, options = {}) {
  const nodes = (input.nodes || input.data || []).map((node, index) => ({
    ...node,
    id: String(node.id ?? node.name ?? index),
    name: node.name || String(node.id ?? index),
    x: 0,
    y: 0
  }));
  const edges = (input.edges || input.links || []).map((edge, index) => ({
    ...edge,
    id: String(edge.id ?? `${edge.source}-${edge.target}-${index}`),
    source: String(edge.source),
    target: String(edge.target)
  }));
  const layout = { nodes, edges };

  if (type === 'radial') return layoutRadial(layout, options);
  if (type === 'concentric') return layoutConcentric(layout);
  if (type === 'grid') return layoutGrid(layout, options);
  if (type === 'mds') return layoutMds(layout);
  if (type === 'arc') return layoutArc(layout, options);
  return layout;
}

function layoutRadial(layout) {
  layout.nodes.forEach((node, index) => {
    if (index === 0) return;
    const angle = ((index - 1) / Math.max(layout.nodes.length - 1, 1)) * Math.PI * 2 - Math.PI / 2;
    node.x = Math.cos(angle) * 110;
    node.y = Math.sin(angle) * 88;
  });
  return layout;
}

function layoutConcentric(layout) {
  layout.nodes.forEach((node, index) => {
    if (index === 0) return;
    const angle = ((index - 1) / Math.max(layout.nodes.length - 1, 1)) * Math.PI * 2 - Math.PI / 2;
    node.x = Math.cos(angle) * (index <= 3 ? 62 : 116);
    node.y = Math.sin(angle) * (index <= 3 ? 62 : 116);
  });
  return layout;
}

function layoutMds(layout) {
  layout.nodes.forEach((node, index) => {
    const angle = (index / Math.max(layout.nodes.length, 1)) * Math.PI * 2;
    const radius = 45 + (index % 3) * 36;
    node.x = Math.cos(angle) * radius;
    node.y = Math.sin(angle) * radius;
  });
  return layout;
}

function layoutGrid(layout, options) {
  const cols = Math.max(1, Math.trunc(finiteNumber(options.cols, Math.ceil(Math.sqrt(layout.nodes.length)))));
  const nodeSep = finiteNumber(options.nodeSpacing, 16) + finiteNumber(options.nodeSize, 24);
  const rows = Math.max(1, Math.ceil(layout.nodes.length / cols));
  layout.nodes.forEach((node, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    node.x = (col - (cols - 1) / 2) * nodeSep;
    node.y = (row - (rows - 1) / 2) * nodeSep;
  });
  return layout;
}

function layoutArc(layout, options) {
  const nodeSep = finiteNumber(options.nodeSep, 20);
  const nodeSize = finiteNumber(options.nodeSize, 20);
  const step = nodeSep + nodeSize;
  layout.nodes.forEach((node, index) => {
    node.x = index * step;
    node.y = 0;
  });
  return layout;
}

function createArcPath(sourcePoint, targetPoint) {
  const [sx, sy] = sourcePoint;
  const [tx, ty] = targetPoint;
  const r = Math.abs(tx - sx) / 2;
  return [
    ['M', sx, sy],
    ['A', r, r, 0, 0, sx < tx ? 1 : 0, tx, ty]
  ];
}

function pathToString(path) {
  return path.map((segment) => segment.join(' ')).join(' ');
}

function cloneGraph(input) {
  return {
    data: input.data.map((node) => ({ ...node })),
    links: input.links.map((link) => ({ ...link }))
  };
}

function finiteNumber(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}
