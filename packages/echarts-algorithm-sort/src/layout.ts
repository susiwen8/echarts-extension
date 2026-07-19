const DEFAULT_WIDTH = 720;
const DEFAULT_HEIGHT = 460;
const DEFAULT_MAX_ITEMS = 96;
const DEFAULT_MAX_FRAMES = 5000;
const DEFAULT_TICK_COUNT = 5;
const EPSILON = 1e-9;

export type AlgorithmSortKind = 'bubble' | 'selection' | 'insertion' | 'merge' | 'quick' | 'heap';
export type AlgorithmSortOrder = 'ascending' | 'descending';
export type AlgorithmSortField = string | number;
export type AlgorithmSortPaddingOption = number | Partial<AlgorithmSortPadding>;
export type AlgorithmSortFrameKind = 'initial' | 'compare' | 'swap' | 'write' | 'mark' | 'complete';
export type AlgorithmSortBarState = 'default' | 'compare' | 'swap' | 'write' | 'pivot' | 'sorted';

export interface AlgorithmSortPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface AlgorithmSortDataItem {
  id?: string | number;
  name?: string;
  label?: string | number;
  value?: unknown;
  itemStyle?: Record<string, unknown>;
  labelStyle?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface AlgorithmSortLayoutOptions {
  width?: number;
  height?: number;
  padding?: AlgorithmSortPaddingOption;
  algorithm?: AlgorithmSortKind;
  order?: AlgorithmSortOrder;
  valueField?: AlgorithmSortField;
  nameField?: AlgorithmSortField;
  dimensions?: string[];
  currentStep?: number;
  progress?: number;
  maxItems?: number;
  maxFrames?: number;
  tickCount?: number;
  barWidth?: number;
  min?: number;
  max?: number;
  nice?: boolean;
  [key: string]: unknown;
}

export interface AlgorithmSortLayoutOption extends AlgorithmSortLayoutOptions {
  data?: unknown[];
  values?: unknown[];
  layout?: unknown;
  layoutOptions?: unknown;
}

export interface AlgorithmSortItem {
  id: string;
  name: string;
  value: number;
  dataIndex: number;
  raw: unknown;
}

export interface AlgorithmSortFrame {
  step: number;
  kind: AlgorithmSortFrameKind;
  algorithm: AlgorithmSortKind;
  items: AlgorithmSortItem[];
  activeIndices: number[];
  swapIndices: number[];
  writeIndices: number[];
  sortedIndices: number[];
  pivotIndex: number | null;
  range: [number, number] | null;
  comparisons: number;
  swaps: number;
  writes: number;
  description: string;
}

export interface AlgorithmSortTick {
  value: number;
  x1: number;
  x2: number;
  y: number;
}

export interface AlgorithmSortPlotRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export interface AlgorithmSortBar {
  id: string;
  name: string;
  value: number;
  dataIndex: number;
  originalIndex: number;
  position: number;
  x: number;
  y: number;
  width: number;
  height: number;
  baseY: number;
  valueY: number;
  state: AlgorithmSortBarState;
  raw: unknown;
}

export interface AlgorithmSortLayoutResult {
  width: number;
  height: number;
  padding: AlgorithmSortPadding;
  plot: AlgorithmSortPlotRect;
  algorithm: AlgorithmSortKind;
  order: AlgorithmSortOrder;
  items: AlgorithmSortItem[];
  frames: AlgorithmSortFrame[];
  frame: AlgorithmSortFrame;
  currentStep: number;
  maxStep: number;
  valueExtent: {
    min: number;
    max: number;
  };
  ticks: AlgorithmSortTick[];
  bars: AlgorithmSortBar[];
  truncated: boolean;
}

interface SortContext {
  algorithm: AlgorithmSortKind;
  order: AlgorithmSortOrder;
  frames: AlgorithmSortFrame[];
  maxFrames: number;
  comparisons: number;
  swaps: number;
  writes: number;
}

export const ALGORITHM_SORT_LABELS: Record<AlgorithmSortKind, string> = {
  bubble: 'Bubble sort',
  selection: 'Selection sort',
  insertion: 'Insertion sort',
  merge: 'Merge sort',
  quick: 'Quick sort',
  heap: 'Heap sort'
};

export function resolveAlgorithmSortLayout(option: AlgorithmSortLayoutOption = {}): AlgorithmSortLayoutResult {
  const layout = isPlainObject(option.layout) ? option.layout : {};
  const layoutOptions = isPlainObject(option.layoutOptions) ? option.layoutOptions : {};
  const merged: AlgorithmSortLayoutOptions = {
    ...layout,
    ...layoutOptions,
    width: finiteNumber(option.width, finiteNumber(layoutOptions.width, finiteNumber(layout.width, DEFAULT_WIDTH))),
    height: finiteNumber(option.height, finiteNumber(layoutOptions.height, finiteNumber(layout.height, DEFAULT_HEIGHT))),
    padding: readPaddingOption(option.padding ?? layoutOptions.padding ?? layout.padding),
    algorithm: normalizeAlgorithm(option.algorithm ?? layoutOptions.algorithm ?? layout.algorithm),
    order: normalizeOrder(option.order ?? layoutOptions.order ?? layout.order),
    valueField: readFieldOption(option.valueField ?? layoutOptions.valueField ?? layout.valueField),
    nameField: readFieldOption(option.nameField ?? layoutOptions.nameField ?? layout.nameField),
    dimensions: normalizeDimensions(option.dimensions ?? layoutOptions.dimensions ?? layout.dimensions),
    currentStep: finiteNumber(option.currentStep, finiteNumber(layoutOptions.currentStep, finiteNumber(layout.currentStep, undefined))),
    progress: finiteNumber(option.progress, finiteNumber(layoutOptions.progress, finiteNumber(layout.progress, undefined))),
    maxItems: finiteNumber(option.maxItems, finiteNumber(layoutOptions.maxItems, finiteNumber(layout.maxItems, undefined))),
    maxFrames: finiteNumber(option.maxFrames, finiteNumber(layoutOptions.maxFrames, finiteNumber(layout.maxFrames, undefined))),
    tickCount: finiteNumber(option.tickCount, finiteNumber(layoutOptions.tickCount, finiteNumber(layout.tickCount, undefined))),
    barWidth: finiteNumber(option.barWidth, finiteNumber(layoutOptions.barWidth, finiteNumber(layout.barWidth, undefined))),
    min: finiteNumber(option.min, finiteNumber(layoutOptions.min, finiteNumber(layout.min, undefined))),
    max: finiteNumber(option.max, finiteNumber(layoutOptions.max, finiteNumber(layout.max, undefined))),
    nice: firstBoolean(option.nice, layoutOptions.nice, layout.nice)
  };

  const data = Array.isArray(option.values) ? option.values : (Array.isArray(option.data) ? option.data : []);
  return layoutAlgorithmSort(data, merged);
}

export function layoutAlgorithmSort(data: unknown[], options: AlgorithmSortLayoutOptions = {}): AlgorithmSortLayoutResult {
  const width = Math.max(1, finiteNumber(options.width, DEFAULT_WIDTH));
  const height = Math.max(1, finiteNumber(options.height, DEFAULT_HEIGHT));
  const padding = normalizePadding(options.padding);
  const plot = createPlotRect(width, height, padding);
  const algorithm = normalizeAlgorithm(options.algorithm);
  const order = normalizeOrder(options.order);
  const maxItems = Math.max(2, Math.floor(finiteNumber(options.maxItems, DEFAULT_MAX_ITEMS)));
  const maxFrames = Math.max(2, Math.floor(finiteNumber(options.maxFrames, DEFAULT_MAX_FRAMES)));
  const items = normalizeSortItems(data, options).slice(0, maxItems);
  const frames = createSortFrames(items, algorithm, {
    maxFrames,
    order
  });
  const maxStep = Math.max(0, frames.length - 1);
  const progressStep = Number.isFinite(options.progress)
    ? clamp(finiteNumber(options.progress, 0), 0, 1) * maxStep
    : undefined;
  const requestedStep = finiteNumber(options.currentStep, finiteNumber(progressStep, 0));
  const currentStep = clamp(requestedStep, 0, maxStep);
  const baseStep = Math.floor(currentStep);
  const targetStep = Math.min(maxStep, baseStep + 1);
  const frameProgress = targetStep === baseStep ? 0 : clamp(currentStep - baseStep, 0, 1);
  const baseFrame = frames[baseStep] || createInitialFrame(items, algorithm);
  const targetFrame = frames[targetStep] || baseFrame;
  const frame = frameProgress > EPSILON ? targetFrame : baseFrame;
  const valueExtent = resolveValueExtent(items, options);
  const tickCount = Math.max(2, Math.round(finiteNumber(options.tickCount, DEFAULT_TICK_COUNT)));
  const ticks = createTicks(valueExtent.min, valueExtent.max, tickCount).map((value) => ({
    value,
    x1: plot.left,
    x2: plot.right,
    y: projectValue(value, valueExtent, plot)
  }));
  const bars = layoutInterpolatedBars(baseFrame, targetFrame, frameProgress, plot, valueExtent, finiteNumber(options.barWidth, NaN));

  return {
    width,
    height,
    padding,
    plot,
    algorithm,
    order,
    items,
    frames,
    frame,
    currentStep,
    maxStep,
    valueExtent,
    ticks,
    bars,
    truncated: normalizeSortItems(data, options).length > items.length || frames.length >= maxFrames
  };
}

export function createSortFrames(
  items: AlgorithmSortItem[],
  algorithm: AlgorithmSortKind = 'bubble',
  options: Pick<AlgorithmSortLayoutOptions, 'order' | 'maxFrames'> = {}
): AlgorithmSortFrame[] {
  const normalizedAlgorithm = normalizeAlgorithm(algorithm);
  const context: SortContext = {
    algorithm: normalizedAlgorithm,
    order: normalizeOrder(options.order),
    frames: [],
    maxFrames: Math.max(2, Math.floor(finiteNumber(options.maxFrames, DEFAULT_MAX_FRAMES))),
    comparisons: 0,
    swaps: 0,
    writes: 0
  };
  const working = items.slice();
  pushFrame(context, working, {
    kind: 'initial',
    description: `${ALGORITHM_SORT_LABELS[normalizedAlgorithm]} starts with ${items.length} values.`
  });

  if (working.length <= 1) {
    pushFrame(context, working, {
      kind: 'complete',
      sortedIndices: working.map((_item, index) => index),
      description: 'The list is already sorted.'
    });
    return context.frames;
  }

  if (normalizedAlgorithm === 'bubble') sortBubble(working, context);
  else if (normalizedAlgorithm === 'selection') sortSelection(working, context);
  else if (normalizedAlgorithm === 'insertion') sortInsertion(working, context);
  else if (normalizedAlgorithm === 'merge') sortMerge(working, context);
  else if (normalizedAlgorithm === 'quick') sortQuick(working, context);
  else sortHeap(working, context);

  pushFrame(context, working, {
    kind: 'complete',
    sortedIndices: working.map((_item, index) => index),
    description: 'All values are in sorted order.'
  });
  return context.frames;
}

export function createAlgorithmSortDataSource(option: AlgorithmSortLayoutOption = {}): Array<Record<string, unknown>> {
  const data = Array.isArray(option.values) ? option.values : (Array.isArray(option.data) ? option.data : []);
  return normalizeSortItems(data, option).map((item) => ({
    ...(isPlainObject(item.raw) ? item.raw : {}),
    name: item.name,
    value: item.value
  }));
}

export function normalizeSortItems(data: unknown[], options: AlgorithmSortLayoutOptions = {}): AlgorithmSortItem[] {
  const dimensions = normalizeDimensions(options.dimensions);
  const items: AlgorithmSortItem[] = [];

  data.forEach((row, dataIndex) => {
    const value = finiteNumber(readField(row, options.valueField ?? 'value', dimensions, 0, [
      'amount',
      'score',
      'height',
      'population',
      'cost',
      'duration'
    ]), NaN);
    if (!Number.isFinite(value)) return;

    const nameValue = Array.isArray(row) || isPlainObject(row)
      ? readField(row, options.nameField ?? 'name', dimensions, -1, ['label', 'category'])
      : undefined;
    const record = isPlainObject(row) ? row : {};
    const name = stringifyName(nameValue || record.id || `Item ${dataIndex + 1}`);
    items.push({
      id: stringifyName(record.id ?? name ?? `item-${dataIndex}`),
      name,
      value,
      dataIndex,
      raw: row
    });
  });

  return items;
}

function sortBubble(items: AlgorithmSortItem[], context: SortContext): void {
  const sorted = new Set<number>();
  for (let end = items.length - 1; end > 0; end -= 1) {
    for (let index = 0; index < end; index += 1) {
      compareAt(context, items, index, index + 1, sorted, `Compare positions ${index + 1} and ${index + 2}.`);
      if (compareItems(items[index], items[index + 1], context.order) > 0) {
        swapItems(items, index, index + 1, context, sorted, `Swap ${items[index + 1].name} ahead of ${items[index].name}.`);
      }
    }
    sorted.add(end);
    pushFrame(context, items, {
      kind: 'mark',
      sortedIndices: Array.from(sorted),
      description: `Position ${end + 1} is fixed.`
    });
  }
  sorted.add(0);
}

function sortSelection(items: AlgorithmSortItem[], context: SortContext): void {
  const sorted = new Set<number>();
  for (let start = 0; start < items.length - 1; start += 1) {
    let selected = start;
    pushFrame(context, items, {
      kind: 'compare',
      activeIndices: [selected],
      sortedIndices: Array.from(sorted),
      description: `Select position ${start + 1} as the current minimum.`
    });

    for (let index = start + 1; index < items.length; index += 1) {
      compareAt(context, items, selected, index, sorted, `Scan ${items[index].name} against ${items[selected].name}.`);
      if (compareItems(items[index], items[selected], context.order) < 0) {
        selected = index;
        pushFrame(context, items, {
          kind: 'compare',
          activeIndices: [selected],
          sortedIndices: Array.from(sorted),
          description: `${items[selected].name} becomes the selected value.`
        });
      }
    }

    if (selected !== start) {
      swapItems(items, start, selected, context, sorted, `Move ${items[selected].name} into position ${start + 1}.`);
    }
    sorted.add(start);
    pushFrame(context, items, {
      kind: 'mark',
      sortedIndices: Array.from(sorted),
      description: `Position ${start + 1} is fixed.`
    });
  }
  sorted.add(items.length - 1);
}

function sortInsertion(items: AlgorithmSortItem[], context: SortContext): void {
  const sorted = new Set<number>([0]);
  for (let index = 1; index < items.length; index += 1) {
    let cursor = index;
    pushFrame(context, items, {
      kind: 'compare',
      activeIndices: [cursor],
      sortedIndices: sortedPrefix(index),
      description: `Insert ${items[cursor].name} into the sorted prefix.`
    });

    while (cursor > 0) {
      compareAt(context, items, cursor - 1, cursor, new Set(sortedPrefix(index)), `Compare adjacent values at ${cursor} and ${cursor + 1}.`);
      if (compareItems(items[cursor - 1], items[cursor], context.order) <= 0) break;
      swapItems(items, cursor - 1, cursor, context, new Set(sortedPrefix(index)), `Shift ${items[cursor].name} left.`);
      cursor -= 1;
    }

    sorted.clear();
    sortedPrefix(index + 1).forEach((position) => sorted.add(position));
    pushFrame(context, items, {
      kind: 'mark',
      sortedIndices: Array.from(sorted),
      description: `The first ${index + 1} values are sorted.`
    });
  }
}

function sortMerge(items: AlgorithmSortItem[], context: SortContext): void {
  function mergeSort(start: number, end: number): void {
    if (end - start <= 1) return;
    const middle = Math.floor((start + end) / 2);
    mergeSort(start, middle);
    mergeSort(middle, end);

    const left = items.slice(start, middle);
    const right = items.slice(middle, end);
    let leftIndex = 0;
    let rightIndex = 0;
    let writeIndex = start;

    while (leftIndex < left.length && rightIndex < right.length) {
      context.comparisons += 1;
      pushFrame(context, items, {
        kind: 'compare',
        activeIndices: [writeIndex],
        range: [start, end - 1],
        description: `Merge compares ${left[leftIndex].name} and ${right[rightIndex].name}.`
      });
      const next = compareItems(left[leftIndex], right[rightIndex], context.order) <= 0
        ? left[leftIndex++]
        : right[rightIndex++];
      items[writeIndex] = next;
      context.writes += 1;
      pushFrame(context, items, {
        kind: 'write',
        writeIndices: [writeIndex],
        range: [start, end - 1],
        description: `Write ${next.name} into position ${writeIndex + 1}.`
      });
      writeIndex += 1;
    }

    while (leftIndex < left.length) {
      const next = left[leftIndex++];
      items[writeIndex] = next;
      context.writes += 1;
      pushFrame(context, items, {
        kind: 'write',
        writeIndices: [writeIndex],
        range: [start, end - 1],
        description: `Copy ${next.name} from the left run.`
      });
      writeIndex += 1;
    }

    while (rightIndex < right.length) {
      const next = right[rightIndex++];
      items[writeIndex] = next;
      context.writes += 1;
      pushFrame(context, items, {
        kind: 'write',
        writeIndices: [writeIndex],
        range: [start, end - 1],
        description: `Copy ${next.name} from the right run.`
      });
      writeIndex += 1;
    }
  }

  mergeSort(0, items.length);
}

function sortQuick(items: AlgorithmSortItem[], context: SortContext): void {
  const sorted = new Set<number>();

  function quickSort(low: number, high: number): void {
    if (low > high) return;
    if (low === high) {
      sorted.add(low);
      pushFrame(context, items, {
        kind: 'mark',
        sortedIndices: Array.from(sorted),
        range: [low, high],
        description: `Position ${low + 1} is fixed.`
      });
      return;
    }

    const pivotIndex = high;
    let boundary = low;
    pushFrame(context, items, {
      kind: 'compare',
      pivotIndex,
      range: [low, high],
      description: `${items[pivotIndex].name} is the pivot.`
    });

    for (let scan = low; scan < high; scan += 1) {
      compareAt(context, items, scan, pivotIndex, sorted, `Partition compares ${items[scan].name} with pivot ${items[pivotIndex].name}.`, [low, high], pivotIndex);
      if (compareItems(items[scan], items[pivotIndex], context.order) <= 0) {
        if (boundary !== scan) {
          swapItems(items, boundary, scan, context, sorted, `Move ${items[scan].name} into the lower partition.`, [low, high], pivotIndex);
        }
        boundary += 1;
      }
    }

    swapItems(items, boundary, high, context, sorted, `Place pivot ${items[high].name} at position ${boundary + 1}.`, [low, high], pivotIndex);
    sorted.add(boundary);
    pushFrame(context, items, {
      kind: 'mark',
      pivotIndex: boundary,
      sortedIndices: Array.from(sorted),
      range: [low, high],
      description: `Pivot position ${boundary + 1} is fixed.`
    });
    quickSort(low, boundary - 1);
    quickSort(boundary + 1, high);
  }

  quickSort(0, items.length - 1);
}

function sortHeap(items: AlgorithmSortItem[], context: SortContext): void {
  const sorted = new Set<number>();

  function higher(left: AlgorithmSortItem, right: AlgorithmSortItem): boolean {
    return context.order === 'ascending'
      ? left.value > right.value + EPSILON
      : left.value < right.value - EPSILON;
  }

  function heapify(size: number, root: number): void {
    let best = root;
    const left = root * 2 + 1;
    const right = root * 2 + 2;

    if (left < size) {
      compareAt(context, items, best, left, sorted, `Heap compares ${items[left].name} with ${items[best].name}.`, [0, size - 1]);
      if (higher(items[left], items[best])) best = left;
    }

    if (right < size) {
      compareAt(context, items, best, right, sorted, `Heap compares ${items[right].name} with ${items[best].name}.`, [0, size - 1]);
      if (higher(items[right], items[best])) best = right;
    }

    if (best !== root) {
      swapItems(items, root, best, context, sorted, `Restore heap by swapping positions ${root + 1} and ${best + 1}.`, [0, size - 1]);
      heapify(size, best);
    }
  }

  for (let index = Math.floor(items.length / 2) - 1; index >= 0; index -= 1) {
    heapify(items.length, index);
  }

  for (let end = items.length - 1; end > 0; end -= 1) {
    swapItems(items, 0, end, context, sorted, `Move heap root into final position ${end + 1}.`);
    sorted.add(end);
    pushFrame(context, items, {
      kind: 'mark',
      sortedIndices: Array.from(sorted),
      description: `Position ${end + 1} is fixed.`
    });
    heapify(end, 0);
  }
  sorted.add(0);
}

function compareAt(
  context: SortContext,
  items: AlgorithmSortItem[],
  left: number,
  right: number,
  sorted: Set<number>,
  description: string,
  range: [number, number] | null = null,
  pivotIndex: number | null = null
): void {
  context.comparisons += 1;
  pushFrame(context, items, {
    kind: 'compare',
    activeIndices: uniqueNumbers([left, right]),
    sortedIndices: Array.from(sorted),
    range,
    pivotIndex,
    description
  });
}

function swapItems(
  items: AlgorithmSortItem[],
  left: number,
  right: number,
  context: SortContext,
  sorted: Set<number>,
  description: string,
  range: [number, number] | null = null,
  pivotIndex: number | null = null
): void {
  if (left !== right) {
    const item = items[left];
    items[left] = items[right];
    items[right] = item;
    context.swaps += 1;
  }
  pushFrame(context, items, {
    kind: 'swap',
    swapIndices: uniqueNumbers([left, right]),
    sortedIndices: Array.from(sorted),
    range,
    pivotIndex,
    description
  });
}

function pushFrame(
  context: SortContext,
  items: AlgorithmSortItem[],
  patch: Partial<Omit<AlgorithmSortFrame, 'step' | 'algorithm' | 'items' | 'comparisons' | 'swaps' | 'writes'>>
): void {
  if (context.frames.length >= context.maxFrames) return;
  context.frames.push({
    step: context.frames.length,
    kind: patch.kind || 'compare',
    algorithm: context.algorithm,
    items: items.slice(),
    activeIndices: uniqueNumbers(patch.activeIndices || []),
    swapIndices: uniqueNumbers(patch.swapIndices || []),
    writeIndices: uniqueNumbers(patch.writeIndices || []),
    sortedIndices: uniqueNumbers(patch.sortedIndices || []),
    pivotIndex: typeof patch.pivotIndex === 'number' ? patch.pivotIndex : null,
    range: patch.range || null,
    comparisons: context.comparisons,
    swaps: context.swaps,
    writes: context.writes,
    description: patch.description || ''
  });
}

function createInitialFrame(items: AlgorithmSortItem[], algorithm: AlgorithmSortKind): AlgorithmSortFrame {
  return {
    step: 0,
    kind: 'initial',
    algorithm,
    items: items.slice(),
    activeIndices: [],
    swapIndices: [],
    writeIndices: [],
    sortedIndices: [],
    pivotIndex: null,
    range: null,
    comparisons: 0,
    swaps: 0,
    writes: 0,
    description: `${ALGORITHM_SORT_LABELS[algorithm]} starts with ${items.length} values.`
  };
}

function layoutBars(
  frame: AlgorithmSortFrame,
  plot: AlgorithmSortPlotRect,
  extent: { min: number; max: number },
  configuredBarWidth: number
): AlgorithmSortBar[] {
  const count = Math.max(1, frame.items.length);
  const band = plot.width / count;
  const width = Number.isFinite(configuredBarWidth) && configuredBarWidth > 0
    ? Math.min(configuredBarWidth, band * 0.9)
    : clamp(band * 0.62, 4, Math.max(4, band * 0.84));
  const baseY = projectValue(Math.max(0, extent.min), extent, plot);
  const active = new Set(frame.activeIndices);
  const swapped = new Set(frame.swapIndices);
  const written = new Set(frame.writeIndices);
  const sorted = new Set(frame.sortedIndices);

  return frame.items.map((item, position) => {
    const centerX = plot.left + band * position + band / 2;
    const valueY = projectValue(item.value, extent, plot);
    return {
      id: item.id,
      name: item.name,
      value: item.value,
      dataIndex: item.dataIndex,
      originalIndex: item.dataIndex,
      position,
      x: centerX - width / 2,
      y: Math.min(baseY, valueY),
      width,
      height: Math.max(Math.abs(baseY - valueY), 1),
      baseY,
      valueY,
      state: barState(position, frame.pivotIndex, active, swapped, written, sorted),
      raw: item.raw
    };
  });
}

function layoutInterpolatedBars(
  baseFrame: AlgorithmSortFrame,
  targetFrame: AlgorithmSortFrame,
  progress: number,
  plot: AlgorithmSortPlotRect,
  extent: { min: number; max: number },
  configuredBarWidth: number
): AlgorithmSortBar[] {
  const targetBars = layoutBars(targetFrame, plot, extent, configuredBarWidth);
  const normalizedProgress = clamp(progress, 0, 1);
  if (normalizedProgress <= EPSILON) return layoutBars(baseFrame, plot, extent, configuredBarWidth);

  const eased = easeInOutCubic(normalizedProgress);
  const baseLookup = createBarLookup(layoutBars(baseFrame, plot, extent, configuredBarWidth));
  return targetBars.map((target) => {
    const base = takeMatchingBar(baseLookup, target);
    if (!base) return target;
    return {
      ...target,
      x: lerp(base.x, target.x, eased),
      y: lerp(base.y, target.y, eased),
      width: lerp(base.width, target.width, eased),
      height: Math.max(lerp(base.height, target.height, eased), 1),
      baseY: lerp(base.baseY, target.baseY, eased),
      valueY: lerp(base.valueY, target.valueY, eased)
    };
  });
}

function createBarLookup(bars: AlgorithmSortBar[]): Map<string, AlgorithmSortBar[]> {
  const lookup = new Map<string, AlgorithmSortBar[]>();
  bars.forEach((bar) => {
    const key = barIdentityKey(bar);
    const bucket = lookup.get(key);
    if (bucket) bucket.push(bar);
    else lookup.set(key, [bar]);
  });
  return lookup;
}

function takeMatchingBar(lookup: Map<string, AlgorithmSortBar[]>, target: AlgorithmSortBar): AlgorithmSortBar | undefined {
  const bucket = lookup.get(barIdentityKey(target));
  return bucket?.shift();
}

function barIdentityKey(bar: Pick<AlgorithmSortBar, 'dataIndex' | 'id'>): string {
  return `${bar.dataIndex}:${bar.id}`;
}

function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

function easeInOutCubic(progress: number): number {
  const t = clamp(progress, 0, 1);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function barState(
  position: number,
  pivotIndex: number | null,
  active: Set<number>,
  swapped: Set<number>,
  written: Set<number>,
  sorted: Set<number>
): AlgorithmSortBarState {
  if (position === pivotIndex) return 'pivot';
  if (swapped.has(position)) return 'swap';
  if (written.has(position)) return 'write';
  if (active.has(position)) return 'compare';
  if (sorted.has(position)) return 'sorted';
  return 'default';
}

function resolveValueExtent(items: AlgorithmSortItem[], options: AlgorithmSortLayoutOptions): { min: number; max: number } {
  const values = items.map((item) => item.value).filter(Number.isFinite);
  values.push(0);
  let min = finiteNumber(options.min, Math.min(...values));
  let max = finiteNumber(options.max, Math.max(...values));

  if (!Number.isFinite(min)) min = 0;
  if (!Number.isFinite(max)) max = 1;
  if (Math.abs(max - min) < EPSILON) {
    min -= 1;
    max += 1;
  }

  if (options.nice !== false) {
    const nice = niceExtent(min, max, Math.max(2, Math.round(finiteNumber(options.tickCount, DEFAULT_TICK_COUNT))));
    min = finiteNumber(options.min, nice.min);
    max = finiteNumber(options.max, nice.max);
  }

  return { min, max };
}

function projectValue(value: number, extent: { min: number; max: number }, plot: AlgorithmSortPlotRect): number {
  const ratio = (value - extent.min) / Math.max(extent.max - extent.min, EPSILON);
  return plot.bottom - clamp(ratio, 0, 1) * plot.height;
}

function createPlotRect(width: number, height: number, padding: AlgorithmSortPadding): AlgorithmSortPlotRect {
  const left = clamp(padding.left, 0, Math.max(width - 1, 0));
  const top = clamp(padding.top, 0, Math.max(height - 1, 0));
  const right = Math.max(left + 1, width - clamp(padding.right, 0, width));
  const bottom = Math.max(top + 1, height - clamp(padding.bottom, 0, height));
  return {
    left,
    top,
    right,
    bottom,
    width: Math.max(right - left, 1),
    height: Math.max(bottom - top, 1)
  };
}

function createTicks(min: number, max: number, count: number): number[] {
  const safeCount = Math.max(2, Math.round(count));
  const span = max - min;
  if (Math.abs(span) < EPSILON) return [min, max];
  return Array.from({ length: safeCount }, (_item, index) => cleanNumber(min + (span * index) / (safeCount - 1)));
}

function niceExtent(min: number, max: number, count: number): { min: number; max: number } {
  const span = Math.max(max - min, EPSILON);
  const step = niceStep(span / Math.max(count - 1, 1));
  return {
    min: Math.floor(min / step) * step,
    max: Math.ceil(max / step) * step
  };
}

function niceStep(value: number): number {
  const exponent = Math.floor(Math.log10(Math.max(value, EPSILON)));
  const fraction = value / 10 ** exponent;
  const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return niceFraction * 10 ** exponent;
}

function readPaddingOption(value: unknown): AlgorithmSortPaddingOption | undefined {
  if (typeof value === 'number') return value;
  if (isPlainObject(value)) return value;
  return undefined;
}

function normalizePadding(value: unknown): AlgorithmSortPadding {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const normalized = Math.max(0, value);
    return { top: normalized, right: normalized, bottom: normalized, left: normalized };
  }
  if (isPlainObject(value)) {
    return {
      top: Math.max(0, finiteNumber(value.top, 48)),
      right: Math.max(0, finiteNumber(value.right, 34)),
      bottom: Math.max(0, finiteNumber(value.bottom, 76)),
      left: Math.max(0, finiteNumber(value.left, 62))
    };
  }
  return { top: 48, right: 34, bottom: 76, left: 62 };
}

function normalizeAlgorithm(value: unknown): AlgorithmSortKind {
  return value === 'selection' || value === 'insertion' || value === 'merge' || value === 'quick' || value === 'heap'
    ? value
    : 'bubble';
}

function normalizeOrder(value: unknown): AlgorithmSortOrder {
  return value === 'descending' ? 'descending' : 'ascending';
}

function compareItems(left: AlgorithmSortItem, right: AlgorithmSortItem, order: AlgorithmSortOrder): number {
  const delta = left.value - right.value;
  const orderedDelta = order === 'ascending' ? delta : -delta;
  return Math.abs(orderedDelta) < EPSILON
    ? left.dataIndex - right.dataIndex
    : orderedDelta;
}

function readFieldOption(value: unknown): AlgorithmSortField | undefined {
  return typeof value === 'string' || typeof value === 'number' ? value : undefined;
}

function readField(
  row: unknown,
  field: AlgorithmSortField | undefined,
  dimensions: string[] | undefined,
  fallbackIndex: number,
  fallbackFields: string[]
): unknown {
  if (Array.isArray(row)) {
    if (typeof field === 'number') return row[field];
    if (typeof field === 'string' && dimensions) {
      const index = dimensions.indexOf(field);
      if (index >= 0) return row[index];
    }
    return fallbackIndex >= 0 ? row[fallbackIndex] : undefined;
  }
  if (!isPlainObject(row)) return typeof row === 'number' ? row : undefined;
  if (typeof field === 'string' && row[field] !== undefined) return row[field];
  for (const fallback of fallbackFields) {
    if (row[fallback] !== undefined) return row[fallback];
  }
  return undefined;
}

function normalizeDimensions(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const dimensions = value.filter((dimension): dimension is string => typeof dimension === 'string' && dimension.length > 0);
  return dimensions.length ? dimensions : undefined;
}

function sortedPrefix(length: number): number[] {
  return Array.from({ length: Math.max(0, length) }, (_item, index) => index);
}

function uniqueNumbers(values: number[]): number[] {
  return Array.from(new Set(values.filter((value) => Number.isInteger(value) && value >= 0))).sort((left, right) => left - right);
}

function firstBoolean(...values: unknown[]): boolean | undefined {
  return values.find((value): value is boolean => typeof value === 'boolean');
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function cleanNumber(value: number): number {
  return Math.abs(value) < EPSILON ? 0 : Number(value.toFixed(12));
}

function stringifyName(value: unknown): string {
  if (value == null) return '';
  return String(value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function finiteNumber(value: unknown, fallback: number | undefined): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
  }
  return fallback as number;
}
