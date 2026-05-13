import { parseSequenceDiagramDsl } from './dsl.js';

const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 480;
const DEFAULT_PADDING = 40;
const DEFAULT_HEADER_HEIGHT = 34;
const DEFAULT_HEADER_WIDTH = 112;
const DEFAULT_MESSAGE_GAP = 48;
const DEFAULT_SELF_LOOP_WIDTH = 56;
const DEFAULT_SELF_LOOP_HEIGHT = 22;
const DEFAULT_ACTIVATION_WIDTH = 12;
const DEFAULT_ACTIVATION_MARGIN = 12;
const NOTE_TOP_MARGIN = 8;
const NOTE_VERTICAL_CLEARANCE = 42;

export type SequenceMessageType = 'sync' | 'async' | 'return' | 'create' | 'destroy' | 'self';
export type SequenceMessageDirection = 'left' | 'right' | 'self';
export type SequenceParticipantKind = 'participant' | 'actor' | 'boundary' | 'control' | 'entity' | 'database' | 'collections' | 'queue';
export type SequenceNotePosition = 'left' | 'right' | 'over';
export type SequenceConstraintType = 'timing' | 'duration';
export type SequencePaddingOption = number | Partial<SequencePadding>;

export interface SequencePadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface SequenceParticipantInput {
  id?: string | number;
  name?: string;
  label?: string;
  kind?: SequenceParticipantKind | string;
  type?: SequenceParticipantKind | string;
  itemStyle?: Record<string, unknown>;
  labelStyle?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface SequenceMessageInput {
  id?: string | number;
  from?: string | number;
  to?: string | number;
  source?: string | number;
  target?: string | number;
  sender?: string | number;
  receiver?: string | number;
  name?: string;
  text?: string;
  message?: string;
  label?: string;
  type?: SequenceMessageType | string;
  lineStyle?: Record<string, unknown>;
  labelStyle?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface SequenceActivationInput {
  id?: string | number;
  participant?: string | number;
  participantId?: string | number;
  lifeline?: string | number;
  start?: number | string;
  end?: number | string;
  depth?: number;
  itemStyle?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface SequenceNoteInput {
  id?: string | number;
  text?: string;
  message?: string;
  label?: string;
  participant?: string | number;
  participantId?: string | number;
  lifeline?: string | number;
  participants?: Array<string | number>;
  position?: SequenceNotePosition | string;
  start?: number | string;
  end?: number | string;
  itemStyle?: Record<string, unknown>;
  labelStyle?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface SequenceFragmentOperandInput {
  text?: string;
  condition?: string;
  label?: string;
  start?: number | string;
  end?: number | string;
  [key: string]: unknown;
}

export interface SequenceFragmentInput {
  id?: string | number;
  type?: string;
  operator?: string;
  text?: string;
  condition?: string;
  label?: string;
  start?: number | string;
  end?: number | string;
  operands?: SequenceFragmentOperandInput[];
  itemStyle?: Record<string, unknown>;
  labelStyle?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface SequenceConstraintInput {
  id?: string | number;
  type?: SequenceConstraintType | string;
  text?: string;
  constraint?: string;
  label?: string;
  participant?: string | number;
  participantId?: string | number;
  lifeline?: string | number;
  participants?: Array<string | number>;
  start?: number | string;
  end?: number | string;
  from?: number | string;
  to?: number | string;
  itemStyle?: Record<string, unknown>;
  labelStyle?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface SequenceDiagramInput {
  participants?: unknown[];
  messages?: unknown[];
  data?: unknown[];
  activations?: unknown[];
  notes?: unknown[];
  fragments?: unknown[];
  constraints?: unknown[];
  dsl?: string;
  source?: string;
}

export interface SequenceDiagramLayoutOptions {
  width?: number;
  height?: number;
  padding?: SequencePaddingOption;
  headerHeight?: number;
  headerWidth?: number;
  messageGap?: number;
  selfLoopWidth?: number;
  selfLoopHeight?: number;
  activationWidth?: number;
  activationMargin?: number;
  [key: string]: unknown;
}

export interface SequenceDiagramLayoutOption extends SequenceDiagramInput, SequenceDiagramLayoutOptions {
  layout?: unknown;
  layoutOptions?: unknown;
}

export interface SequencePoint {
  x: number;
  y: number;
}

export interface SequenceParticipantLayout {
  id: string;
  name: string;
  kind: SequenceParticipantKind;
  x: number;
  y: number;
  dataIndex: number;
  raw: unknown;
  createdAt: number | null;
  destroyedAt: number | null;
  header: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  lifeline: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
}

export interface SequenceMessageLayout {
  id: string;
  name: string;
  text: string;
  from: string;
  to: string;
  type: SequenceMessageType;
  direction: SequenceMessageDirection;
  x1: number;
  x2: number;
  y: number;
  points: SequencePoint[];
  dataIndex: number;
  raw: unknown;
}

export interface SequenceActivationLayout {
  id: string;
  participantId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  start: number;
  end: number;
  raw: unknown;
}

export interface SequenceNoteLayout {
  id: string;
  text: string;
  lines: string[];
  position: SequenceNotePosition;
  participants: string[];
  x: number;
  y: number;
  width: number;
  height: number;
  start: number;
  end: number;
  raw: unknown;
}

export interface SequenceFragmentOperandLayout {
  text: string;
  start: number;
  end: number;
  separatorY: number | null;
}

export interface SequenceFragmentLayout {
  id: string;
  type: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  start: number;
  end: number;
  operands: SequenceFragmentOperandLayout[];
  raw: unknown;
}

export interface SequenceConstraintLayout {
  id: string;
  type: SequenceConstraintType;
  text: string;
  participants: string[];
  x1: number;
  x2: number;
  y1: number;
  y2: number;
  labelX: number;
  labelY: number;
  start: number;
  end: number;
  raw: unknown;
}

export interface SequenceDiagramLayoutResult {
  width: number;
  height: number;
  padding: SequencePadding;
  headerHeight: number;
  headerWidth: number;
  messageGap: number;
  selfLoopWidth: number;
  selfLoopHeight: number;
  activationWidth: number;
  participants: SequenceParticipantLayout[];
  messages: SequenceMessageLayout[];
  activations: SequenceActivationLayout[];
  notes: SequenceNoteLayout[];
  fragments: SequenceFragmentLayout[];
  constraints: SequenceConstraintLayout[];
}

interface NormalizedParticipant {
  id: string;
  name: string;
  kind: SequenceParticipantKind;
  dataIndex: number;
  raw: unknown;
}

interface NormalizedMessage {
  id: string;
  name: string;
  text: string;
  from: string;
  to: string;
  type: SequenceMessageType;
  dataIndex: number;
  raw: unknown;
}

interface NormalizedActivation {
  id: string;
  participantId: string;
  start: number;
  end: number;
  depth: number;
  raw: unknown;
}

interface NormalizedNote {
  id: string;
  text: string;
  position: SequenceNotePosition;
  participants: string[];
  start: number;
  end: number;
  raw: unknown;
}

interface NormalizedFragmentOperand {
  text: string;
  start: number;
  end: number;
}

interface NormalizedFragment {
  id: string;
  type: string;
  text: string;
  start: number;
  end: number;
  operands: NormalizedFragmentOperand[];
  raw: unknown;
}

interface NormalizedConstraint {
  id: string;
  type: SequenceConstraintType;
  text: string;
  participants: string[];
  start: number;
  end: number;
  raw: unknown;
}

export function resolveSequenceDiagramLayout(option: SequenceDiagramLayoutOption = {}): SequenceDiagramLayoutResult {
  const layout = isPlainObject(option.layout) ? option.layout : {};
  const layoutOptions = isPlainObject(option.layoutOptions) ? option.layoutOptions : {};
  const parsed = readParsedDsl(option);
  const input: SequenceDiagramInput = {
    participants: readParticipants(option, parsed),
    messages: readMessages(option, parsed),
    activations: readActivations(option, parsed),
    notes: readNotes(option, parsed),
    fragments: readFragments(option, parsed),
    constraints: readConstraints(option, parsed)
  };
  const padding = (option.padding ?? layoutOptions.padding ?? layout.padding) as SequencePaddingOption | undefined;

  return layoutSequenceDiagram(input, {
    ...layout,
    ...layoutOptions,
    width: finiteNumber(option.width, finiteNumber(layoutOptions.width, finiteNumber(layout.width, DEFAULT_WIDTH))),
    height: finiteNumber(option.height, finiteNumber(layoutOptions.height, finiteNumber(layout.height, DEFAULT_HEIGHT))),
    padding,
    headerHeight: finiteNumber(
      option.headerHeight,
      finiteNumber(layoutOptions.headerHeight, finiteNumber(layout.headerHeight, DEFAULT_HEADER_HEIGHT))
    ),
    headerWidth: finiteNumber(
      option.headerWidth,
      finiteNumber(layoutOptions.headerWidth, finiteNumber(layout.headerWidth, DEFAULT_HEADER_WIDTH))
    ),
    messageGap: finiteNumber(
      option.messageGap,
      finiteNumber(layoutOptions.messageGap, finiteNumber(layout.messageGap, DEFAULT_MESSAGE_GAP))
    ),
    selfLoopWidth: finiteNumber(
      option.selfLoopWidth,
      finiteNumber(layoutOptions.selfLoopWidth, finiteNumber(layout.selfLoopWidth, DEFAULT_SELF_LOOP_WIDTH))
    ),
    selfLoopHeight: finiteNumber(
      option.selfLoopHeight,
      finiteNumber(layoutOptions.selfLoopHeight, finiteNumber(layout.selfLoopHeight, DEFAULT_SELF_LOOP_HEIGHT))
    ),
    activationWidth: finiteNumber(
      option.activationWidth,
      finiteNumber(layoutOptions.activationWidth, finiteNumber(layout.activationWidth, DEFAULT_ACTIVATION_WIDTH))
    ),
    activationMargin: finiteNumber(
      option.activationMargin,
      finiteNumber(layoutOptions.activationMargin, finiteNumber(layout.activationMargin, DEFAULT_ACTIVATION_MARGIN))
    )
  });
}

export function layoutSequenceDiagram(
  input: SequenceDiagramInput | unknown[] = {},
  options: SequenceDiagramLayoutOptions = {}
): SequenceDiagramLayoutResult {
  const diagramInput = Array.isArray(input) ? { messages: input } : input;
  const parsed = readParsedDsl(diagramInput);
  const width = Math.max(1, finiteNumber(options.width, DEFAULT_WIDTH));
  const height = Math.max(1, finiteNumber(options.height, DEFAULT_HEIGHT));
  const padding = normalizePadding(options.padding);
  const headerHeight = Math.max(1, finiteNumber(options.headerHeight, DEFAULT_HEADER_HEIGHT));
  const headerWidth = Math.max(1, finiteNumber(options.headerWidth, DEFAULT_HEADER_WIDTH));
  const messageGap = Math.max(1, finiteNumber(options.messageGap, DEFAULT_MESSAGE_GAP));
  const selfLoopWidth = Math.max(1, finiteNumber(options.selfLoopWidth, DEFAULT_SELF_LOOP_WIDTH));
  const selfLoopHeight = Math.max(1, finiteNumber(options.selfLoopHeight, DEFAULT_SELF_LOOP_HEIGHT));
  const activationWidth = Math.max(1, finiteNumber(options.activationWidth, DEFAULT_ACTIVATION_WIDTH));
  const activationMargin = Math.max(0, finiteNumber(options.activationMargin, DEFAULT_ACTIVATION_MARGIN));
  const normalizedMessages = normalizeMessages(readMessages(diagramInput, parsed));
  const normalizedParticipants = normalizeParticipants(
    readParticipants(diagramInput, parsed),
    normalizedMessages
  );
  const messageTop = padding.top + headerHeight + 36;
  const baseLastMessageY = normalizedMessages.length ? messageTop + (normalizedMessages.length - 1) * messageGap : messageTop;
  const baseContentHeight = Math.max(height, baseLastMessageY + selfLoopHeight + padding.bottom + 24);
  const baseParticipants = layoutParticipants(normalizedParticipants, {
    width,
    height: baseContentHeight,
    padding,
    headerHeight,
    headerWidth,
    messages: normalizedMessages,
    messageTop,
    messageGap,
    messageOffsets: []
  });
  const baseParticipantById = new Map(baseParticipants.map((participant) => [participant.id, participant]));
  const baseMessages = normalizedMessages
    .map((message, index) => layoutMessage(message, index, baseParticipantById, messageTop, messageGap, selfLoopWidth, selfLoopHeight, []))
    .filter((message): message is SequenceMessageLayout => message != null);
  const normalizedNotes = normalizeNotes(readNotes(diagramInput, parsed), baseMessages, baseParticipantById);
  const messageOffsets = buildMessageOffsets(normalizedNotes, baseMessages, baseParticipantById, width, padding, messageGap);
  const lastMessageY = normalizedMessages.length
    ? messageTop + (normalizedMessages.length - 1) * messageGap + messageOffsetAt(normalizedMessages.length - 1, messageOffsets)
    : messageTop;
  const contentHeight = Math.max(height, lastMessageY + selfLoopHeight + padding.bottom + 24);
  const participants = layoutParticipants(normalizedParticipants, {
    width,
    height: contentHeight,
    padding,
    headerHeight,
    headerWidth,
    messages: normalizedMessages,
    messageTop,
    messageGap,
    messageOffsets
  });
  const participantById = new Map(participants.map((participant) => [participant.id, participant]));
  const messages = normalizedMessages
    .map((message, index) => layoutMessage(message, index, participantById, messageTop, messageGap, selfLoopWidth, selfLoopHeight, messageOffsets))
    .filter((message): message is SequenceMessageLayout => message != null);
  const activations = normalizeActivations(
    readActivations(diagramInput, parsed),
    messages,
    participantById
  ).map((activation) => layoutActivation(activation, messages, participantById, activationWidth, activationMargin));
  const notes = normalizedNotes.map((note) => layoutNote(note, messages, participantById, width, padding));
  const fragments = normalizeFragments(readFragments(diagramInput, parsed), messages)
    .map((fragment) => layoutFragment(fragment, messages, participants, messageGap, headerWidth));
  const constraints = normalizeConstraints(readConstraints(diagramInput, parsed), messages, participantById)
    .map((constraint) => layoutConstraint(constraint, messages, participants, participantById));

  return {
    width,
    height: contentHeight,
    padding,
    headerHeight,
    headerWidth,
    messageGap,
    selfLoopWidth,
    selfLoopHeight,
    activationWidth,
    participants,
    messages,
    activations,
    notes,
    fragments,
    constraints
  };
}

export function collectSequenceMessageData(option: SequenceDiagramInput): unknown[] {
  return readMessages(option, readParsedDsl(option));
}

function readParticipants(input: SequenceDiagramInput, parsed?: SequenceDiagramInput): unknown[] {
  if (Array.isArray(input.participants) && input.participants.length) return input.participants;
  if (Array.isArray(parsed?.participants)) return parsed.participants;
  return [];
}

function readMessages(input: SequenceDiagramInput, parsed?: SequenceDiagramInput): unknown[] {
  if (Array.isArray(input.messages)) return input.messages;
  if (Array.isArray(input.data)) return input.data;
  if (Array.isArray(parsed?.messages)) return parsed.messages;
  return [];
}

function readActivations(input: SequenceDiagramInput, parsed?: SequenceDiagramInput): unknown[] {
  if (Array.isArray(input.activations) && input.activations.length) return input.activations;
  if (Array.isArray(parsed?.activations)) return parsed.activations;
  return [];
}

function readNotes(input: SequenceDiagramInput, parsed?: SequenceDiagramInput): unknown[] {
  if (Array.isArray(input.notes) && input.notes.length) return input.notes;
  if (Array.isArray(parsed?.notes)) return parsed.notes;
  return [];
}

function readFragments(input: SequenceDiagramInput, parsed?: SequenceDiagramInput): unknown[] {
  if (Array.isArray(input.fragments) && input.fragments.length) return input.fragments;
  if (Array.isArray(parsed?.fragments)) return parsed.fragments;
  return [];
}

function readConstraints(input: SequenceDiagramInput, parsed?: SequenceDiagramInput): unknown[] {
  if (Array.isArray(input.constraints) && input.constraints.length) return input.constraints;
  if (Array.isArray(parsed?.constraints)) return parsed.constraints;
  return [];
}

function readParsedDsl(input: SequenceDiagramInput): SequenceDiagramInput | undefined {
  const source = typeof input.dsl === 'string'
    ? input.dsl
    : typeof input.source === 'string'
      ? input.source
      : '';
  return source ? parseSequenceDiagramDsl(source) : undefined;
}

function layoutParticipants(
  participants: NormalizedParticipant[],
  options: {
    width: number;
    height: number;
    padding: SequencePadding;
    headerHeight: number;
    headerWidth: number;
    messages: NormalizedMessage[];
    messageTop: number;
    messageGap: number;
    messageOffsets: number[];
  }
): SequenceParticipantLayout[] {
  const left = options.padding.left;
  const right = Math.max(left, options.width - options.padding.right);
  const span = Math.max(0, right - left);
  const headerY = options.padding.top;
  const lifelineY1 = headerY + options.headerHeight;
  const lifelineY2 = Math.max(lifelineY1, options.height - options.padding.bottom);

  return participants.map((participant, index) => {
    const x = participants.length <= 1
      ? left + span / 2
      : left + span * (index / Math.max(1, participants.length - 1));
    const createdAt = firstLifecycleMessageIndex(options.messages, participant.id, 'create');
    const destroyedAt = firstLifecycleMessageIndex(options.messages, participant.id, 'destroy');
    const createdY = createdAt == null ? null : options.messageTop + createdAt * options.messageGap + messageOffsetAt(createdAt, options.messageOffsets);
    const destroyedY = destroyedAt == null ? null : options.messageTop + destroyedAt * options.messageGap + messageOffsetAt(destroyedAt, options.messageOffsets);
    const participantHeaderY = createdY == null ? headerY : createdY - options.headerHeight / 2;
    const participantLifelineY1 = createdY == null ? lifelineY1 : createdY + options.headerHeight / 2;
    const participantLifelineY2 = destroyedY == null ? lifelineY2 : Math.max(participantLifelineY1, destroyedY);

    return {
      id: participant.id,
      name: participant.name,
      kind: participant.kind,
      x,
      y: participantHeaderY,
      dataIndex: participant.dataIndex,
      raw: participant.raw,
      createdAt,
      destroyedAt,
      header: {
        x: x - options.headerWidth / 2,
        y: participantHeaderY,
        width: options.headerWidth,
        height: options.headerHeight
      },
      lifeline: {
        x1: x,
        y1: participantLifelineY1,
        x2: x,
        y2: participantLifelineY2
      }
    };
  });
}

function layoutMessage(
  message: NormalizedMessage,
  index: number,
  participantById: Map<string, SequenceParticipantLayout>,
  messageTop: number,
  messageGap: number,
  selfLoopWidth: number,
  selfLoopHeight: number,
  messageOffsets: number[]
): SequenceMessageLayout | null {
  const source = participantById.get(message.from);
  const target = participantById.get(message.to);
  if (!source || !target) return null;

  const y = messageTop + index * messageGap + messageOffsetAt(index, messageOffsets);
  const self = message.from === message.to || message.type === 'self';
  const direction: SequenceMessageDirection = self ? 'self' : source.x <= target.x ? 'right' : 'left';
  const x1 = source.x;
  const x2 = self ? source.x + selfLoopWidth : target.x;
  const points = self
    ? [
        { x: source.x, y },
        { x: source.x + selfLoopWidth, y },
        { x: source.x + selfLoopWidth, y: y + selfLoopHeight },
        { x: source.x, y: y + selfLoopHeight }
      ]
    : [
        { x: source.x, y },
        { x: target.x, y }
      ];

  return {
    id: message.id,
    name: message.name,
    text: message.text,
    from: message.from,
    to: message.to,
    type: self ? 'self' : message.type,
    direction,
    x1,
    x2,
    y,
    points,
    dataIndex: message.dataIndex,
    raw: message.raw
  };
}

function layoutActivation(
  activation: NormalizedActivation,
  messages: SequenceMessageLayout[],
  participantById: Map<string, SequenceParticipantLayout>,
  width: number,
  margin: number
): SequenceActivationLayout {
  const participant = participantById.get(activation.participantId) as SequenceParticipantLayout;
  const startMessage = messages[Math.max(0, Math.min(messages.length - 1, activation.start))];
  const endMessage = messages[Math.max(0, Math.min(messages.length - 1, activation.end))] || startMessage;
  const startY = startMessage ? startMessage.y : participant.lifeline.y1;
  const endY = endMessage ? endMessage.y : startY;
  const depthOffset = Math.max(0, activation.depth) * (width + 2);

  return {
    id: activation.id,
    participantId: activation.participantId,
    x: participant.x - width / 2 + depthOffset,
    y: startY - margin,
    width,
    height: Math.max(width, endY - startY + margin * 2),
    depth: activation.depth,
    start: activation.start,
    end: activation.end,
    raw: activation.raw
  };
}

function buildMessageOffsets(
  notes: NormalizedNote[],
  messages: SequenceMessageLayout[],
  participantById: Map<string, SequenceParticipantLayout>,
  width: number,
  padding: SequencePadding,
  messageGap: number
): number[] {
  const insertedAfter = Array.from({ length: messages.length }, () => 0);
  notes.forEach((note) => {
    const preview = layoutNote(note, messages, participantById, width, padding);
    const insertIndex = Math.max(0, Math.min(Math.max(0, messages.length - 1), note.start));
    insertedAfter[insertIndex] += Math.max(0, preview.height + NOTE_VERTICAL_CLEARANCE - messageGap);
  });

  const offsets: number[] = [];
  let runningOffset = 0;
  for (let index = 0; index < messages.length; index += 1) {
    offsets[index] = runningOffset;
    runningOffset += insertedAfter[index] || 0;
  }
  return offsets;
}

function layoutNote(
  note: NormalizedNote,
  messages: SequenceMessageLayout[],
  participantById: Map<string, SequenceParticipantLayout>,
  width: number,
  padding: SequencePadding
): SequenceNoteLayout {
  const participants = [...participantById.values()].sort((a, b) => a.x - b.x);
  const participantXs = note.participants
    .map((participantId) => participantById.get(participantId)?.x)
    .filter((x): x is number => typeof x === 'number');
  const anchorMessage = messages[Math.max(0, Math.min(messages.length - 1, note.start))];
  const centerX = participantXs.length
    ? participantXs.reduce((sum, x) => sum + x, 0) / participantXs.length
    : width / 2;
  const span = participantXs.length > 1 ? Math.max(...participantXs) - Math.min(...participantXs) : 0;
  const preferredWidth = Math.max(140, Math.min(300, Math.max(span + 96, estimateNoteTextWidth(note.text) + 20)));
  const placement = placeNoteHorizontally(note.position, centerX, preferredWidth, participants, width, padding);
  const lines = wrapNoteText(note.text, placement.width - 20);
  const noteHeight = Math.max(38, lines.length * 15 + 20);
  const rawY = placeNoteVertically(note.start, noteHeight, messages, padding);
  const y = avoidHeaderOverlap({
    x: placement.x,
    y: rawY,
    width: placement.width,
    height: noteHeight
  }, participants);

  return {
    id: note.id,
    text: note.text,
    lines,
    position: note.position,
    participants: note.participants,
    x: placement.x,
    y,
    width: placement.width,
    height: noteHeight,
    start: note.start,
    end: note.end,
    raw: note.raw
  };
}

function placeNoteHorizontally(
  position: SequenceNotePosition,
  centerX: number,
  preferredWidth: number,
  participants: SequenceParticipantLayout[],
  chartWidth: number,
  padding: SequencePadding
): { x: number; width: number } {
  if (position === 'over') {
    const noteWidth = Math.min(preferredWidth, Math.max(120, chartWidth - padding.left - padding.right));
    return {
      x: clamp(centerX - noteWidth / 2, padding.left, chartWidth - padding.right - noteWidth),
      width: noteWidth
    };
  }

  const previous = [...participants].reverse().find((participant) => participant.header.x + participant.header.width < centerX);
  const next = participants.find((participant) => participant.header.x > centerX);
  const rightX = centerX + 28;
  const rightSpace = chartWidth - padding.right - rightX;
  const leftLimit = padding.left;
  const leftSpace = centerX - 28 - leftLimit;
  const rightHitsNextHeader = Boolean(next && rightX < next.header.x + next.header.width && rightX + preferredWidth > next.header.x);
  const leftHitsPreviousHeader = Boolean(previous && centerX - 28 - preferredWidth < previous.header.x + previous.header.width && centerX - 28 > previous.header.x);
  const side = position === 'right' && (rightSpace < Math.min(140, preferredWidth) || rightHitsNextHeader) && leftSpace > Math.min(rightSpace, 180)
    ? 'left'
    : position === 'left' && leftHitsPreviousHeader && rightSpace > leftSpace
      ? 'right'
      : position;

  if (side === 'left') {
    const noteWidth = Math.max(96, Math.min(preferredWidth, Math.max(0, leftSpace)));
    return {
      x: clamp(centerX - 28 - noteWidth, padding.left, chartWidth - padding.right - noteWidth),
      width: noteWidth
    };
  }

  const noteWidth = Math.max(96, Math.min(preferredWidth, Math.max(0, rightSpace)));
  return {
    x: clamp(rightX, padding.left, chartWidth - padding.right - noteWidth),
    width: noteWidth
  };
}

function placeNoteVertically(
  start: number,
  noteHeight: number,
  messages: SequenceMessageLayout[],
  padding: SequencePadding
): number {
  const index = Math.max(0, Math.min(messages.length - 1, start));
  const previous = messages[index - 1];
  const current = messages[index];
  const next = messages[index + 1];
  const nextGapY = placeNoteInMessageGap(current, next, noteHeight);
  if (nextGapY != null) return nextGapY;
  const previousGapY = placeNoteInMessageGap(previous, current, noteHeight);
  if (previousGapY != null) return previousGapY;
  return current ? current.y + 10 : padding.top + 72;
}

function placeNoteInMessageGap(
  upper: SequenceMessageLayout | undefined,
  lower: SequenceMessageLayout | undefined,
  noteHeight: number
): number | null {
  if (!upper || !lower || lower.y <= upper.y) return null;
  const gap = lower.y - upper.y;
  if (gap < noteHeight + NOTE_VERTICAL_CLEARANCE) return null;
  return upper.y + Math.min(NOTE_TOP_MARGIN, Math.max(0, gap - noteHeight));
}

function avoidHeaderOverlap(
  rect: { x: number; y: number; width: number; height: number },
  participants: SequenceParticipantLayout[]
): number {
  let y = rect.y;
  for (let pass = 0; pass < 4; pass += 1) {
    const overlap = participants.find((participant) => rectanglesOverlap(
      { ...rect, y },
      participant.header
    ));
    if (!overlap) return y;
    const above = overlap.header.y - rect.height - 8;
    const below = overlap.header.y + overlap.header.height + 8;
    y = y < overlap.header.y ? above : below;
  }
  return y;
}

function rectanglesOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
): boolean {
  return a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y;
}

function estimateNoteTextWidth(text: string): number {
  return Math.max(...splitNoteText(text).map((line) => line.length), 1) * 7.2;
}

function wrapNoteText(text: string, width: number): string[] {
  const maxChars = Math.max(8, Math.floor(width / 7.2));
  return splitNoteText(text).flatMap((line) => wrapLine(line, maxChars));
}

function splitNoteText(text: string): string[] {
  return text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function wrapLine(line: string, maxChars: number): string[] {
  if (line.length <= maxChars) return [line];
  const words = line.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  words.forEach((word) => {
    if (!current) {
      current = word;
    } else if (`${current} ${word}`.length <= maxChars) {
      current = `${current} ${word}`;
    } else {
      lines.push(current);
      current = word;
    }

    while (current.length > maxChars) {
      lines.push(current.slice(0, maxChars));
      current = current.slice(maxChars);
    }
  });

  if (current) lines.push(current);
  return lines;
}

function layoutFragment(
  fragment: NormalizedFragment,
  messages: SequenceMessageLayout[],
  participants: SequenceParticipantLayout[],
  messageGap: number,
  headerWidth: number
): SequenceFragmentLayout {
  const startMessage = messages[Math.max(0, Math.min(messages.length - 1, fragment.start))];
  const endMessage = messages[Math.max(0, Math.min(messages.length - 1, fragment.end))] || startMessage;
  const participantLeft = participants.length
    ? Math.min(...participants.map((participant) => participant.header.x))
    : 0;
  const participantRight = participants.length
    ? Math.max(...participants.map((participant) => participant.header.x + participant.header.width))
    : headerWidth;
  const x = participantLeft - 14;
  const y = (startMessage?.y ?? 0) - messageGap / 2;
  const endY = (endMessage?.y ?? startMessage?.y ?? y) + messageGap / 2;
  const operands = fragment.operands.map((operand, index) => {
    const separatorMessage = messages[Math.max(0, Math.min(messages.length - 1, operand.start))];
    return {
      text: operand.text,
      start: operand.start,
      end: operand.end,
      separatorY: index === 0 || !separatorMessage ? null : separatorMessage.y - messageGap / 2
    };
  });

  return {
    id: fragment.id,
    type: fragment.type,
    text: fragment.text,
    x,
    y,
    width: participantRight - participantLeft + 28,
    height: Math.max(44, endY - y),
    start: fragment.start,
    end: fragment.end,
    operands,
    raw: fragment.raw
  };
}

function layoutConstraint(
  constraint: NormalizedConstraint,
  messages: SequenceMessageLayout[],
  participants: SequenceParticipantLayout[],
  participantById: Map<string, SequenceParticipantLayout>
): SequenceConstraintLayout {
  const startMessage = messages[Math.max(0, Math.min(messages.length - 1, constraint.start))];
  const endMessage = messages[Math.max(0, Math.min(messages.length - 1, constraint.end))] || startMessage;
  const participantXs = constraint.participants
    .map((participantId) => participantById.get(participantId)?.x)
    .filter((x): x is number => typeof x === 'number');
  const allXs = participants.map((participant) => participant.x);
  const centerX = participantXs.length
    ? participantXs.reduce((sum, x) => sum + x, 0) / participantXs.length
    : allXs.length
      ? (Math.min(...allXs) + Math.max(...allXs)) / 2
      : 0;
  const y1 = startMessage?.y ?? 0;
  const y2 = constraint.type === 'duration' ? endMessage?.y ?? y1 : y1;
  const x = constraint.type === 'duration' ? centerX + 24 : centerX;

  return {
    id: constraint.id,
    type: constraint.type,
    text: constraint.text,
    participants: constraint.participants,
    x1: x,
    x2: x,
    y1,
    y2,
    labelX: constraint.type === 'duration' ? x + 10 : x,
    labelY: constraint.type === 'duration' ? (y1 + y2) / 2 : y1 - 16,
    start: constraint.start,
    end: constraint.end,
    raw: constraint.raw
  };
}

function normalizeParticipants(input: unknown[], messages: NormalizedMessage[]): NormalizedParticipant[] {
  const participants: NormalizedParticipant[] = [];
  const seen = new Set<string>();
  const addParticipant = (participant: NormalizedParticipant) => {
    if (!participant.id || seen.has(participant.id)) return;
    seen.add(participant.id);
    participants.push(participant);
  };

  input.forEach((item, index) => {
    const participant = normalizeParticipant(item, index);
    if (participant) addParticipant(participant);
  });

  messages.forEach((message) => {
    addParticipant({
      id: message.from,
      name: message.from,
      kind: 'participant',
      dataIndex: -1,
      raw: { id: message.from, name: message.from }
    });
    addParticipant({
      id: message.to,
      name: message.to,
      kind: 'participant',
      dataIndex: -1,
      raw: { id: message.to, name: message.to }
    });
  });

  return participants.length ? participants : [
    {
      id: 'participant-0',
      name: 'Participant',
      kind: 'participant',
      dataIndex: -1,
      raw: { id: 'participant-0', name: 'Participant' }
    }
  ];
}

function normalizeParticipant(input: unknown, index: number): NormalizedParticipant | null {
  if (typeof input === 'string' || typeof input === 'number') {
    const id = stringifyName(input);
    return {
      id,
      name: id,
      kind: 'participant',
      dataIndex: index,
      raw: input
    };
  }

  if (Array.isArray(input)) {
    const id = stringifyName(input[0] ?? `participant-${index}`);
    return {
      id,
      name: stringifyName(input[1] ?? id),
      kind: normalizeParticipantKind(input[2]),
      dataIndex: index,
      raw: input
    };
  }

  if (!isPlainObject(input)) return null;
  const id = stringifyName(input.id ?? input.name ?? input.label ?? `participant-${index}`);
  return {
    id,
    name: stringifyName(input.name ?? input.label ?? id),
    kind: normalizeParticipantKind(input.kind ?? input.type),
    dataIndex: index,
    raw: input
  };
}

function normalizeMessages(input: unknown[]): NormalizedMessage[] {
  return input
    .map((item, index) => normalizeMessage(item, index))
    .filter((message): message is NormalizedMessage => message != null);
}

function normalizeMessage(input: unknown, index: number): NormalizedMessage | null {
  let record: Record<string, unknown>;

  if (Array.isArray(input)) {
    record = {
      from: input[0],
      to: input[1],
      text: input[2],
      type: input[3]
    };
  } else if (isPlainObject(input)) {
    record = input;
  } else {
    return null;
  }

  const from = stringifyName(firstDefined(record.from, record.source, record.sender));
  const explicitType = normalizeMessageType(record.type, from, stringifyName(firstDefined(record.to, record.target, record.receiver)));
  const to = stringifyName(firstDefined(record.to, record.target, record.receiver, explicitType === 'self' ? from : undefined));
  if (!from || !to) return null;

  const type = normalizeMessageType(record.type, from, to);
  const text = stringifyName(firstDefined(record.text, record.message, record.name, record.label, `${from} -> ${to}`));
  const id = stringifyName(record.id ?? `message-${index}`);

  return {
    id,
    name: text,
    text,
    from,
    to,
    type,
    dataIndex: index,
    raw: input
  };
}

function normalizeActivations(
  input: unknown[],
  messages: SequenceMessageLayout[],
  participantById: Map<string, SequenceParticipantLayout>
): NormalizedActivation[] {
  return input
    .map((item, index) => normalizeActivation(item, index, messages, participantById))
    .filter((activation): activation is NormalizedActivation => activation != null);
}

function normalizeActivation(
  input: unknown,
  index: number,
  messages: SequenceMessageLayout[],
  participantById: Map<string, SequenceParticipantLayout>
): NormalizedActivation | null {
  if (!isPlainObject(input)) return null;
  const participantId = stringifyName(firstDefined(input.participant, input.participantId, input.lifeline, input.id));
  if (!participantById.has(participantId)) return null;

  const start = resolveMessageIndex(input.start, messages, 0);
  const end = resolveMessageIndex(input.end, messages, messages.length ? messages.length - 1 : 0);
  const clampedStart = Math.max(0, Math.min(Math.max(0, messages.length - 1), start));
  const clampedEnd = Math.max(clampedStart, Math.min(Math.max(0, messages.length - 1), end));

  return {
    id: stringifyName(input.id ?? `activation-${index}`),
    participantId,
    start: clampedStart,
    end: clampedEnd,
    depth: Math.max(0, Math.round(finiteNumber(input.depth, 0))),
    raw: input
  };
}

function normalizeNotes(
  input: unknown[],
  messages: SequenceMessageLayout[],
  participantById: Map<string, SequenceParticipantLayout>
): NormalizedNote[] {
  return input
    .map((item, index) => normalizeNote(item, index, messages, participantById))
    .filter((note): note is NormalizedNote => note != null);
}

function normalizeNote(
  input: unknown,
  index: number,
  messages: SequenceMessageLayout[],
  participantById: Map<string, SequenceParticipantLayout>
): NormalizedNote | null {
  if (!isPlainObject(input)) return null;
  const participants = normalizeParticipantIds(input, participantById);
  const start = resolveMessageIndex(input.start, messages, messages.length ? messages.length - 1 : 0);
  const end = resolveMessageIndex(input.end, messages, start);
  const clampedStart = clampMessageIndex(start, messages);
  const clampedEnd = Math.max(clampedStart, clampMessageIndex(end, messages));
  const position = normalizeNotePosition(input.position);
  const text = stringifyName(firstDefined(input.text, input.message, input.label));
  if (!text) return null;

  return {
    id: stringifyName(input.id ?? `note-${index}`),
    text,
    position,
    participants,
    start: clampedStart,
    end: clampedEnd,
    raw: input
  };
}

function normalizeFragments(input: unknown[], messages: SequenceMessageLayout[]): NormalizedFragment[] {
  return input
    .map((item, index) => normalizeFragment(item, index, messages))
    .filter((fragment): fragment is NormalizedFragment => fragment != null);
}

function normalizeFragment(input: unknown, index: number, messages: SequenceMessageLayout[]): NormalizedFragment | null {
  if (!isPlainObject(input)) return null;
  const start = clampMessageIndex(resolveMessageIndex(input.start, messages, 0), messages);
  const end = Math.max(start, clampMessageIndex(resolveMessageIndex(input.end, messages, messages.length ? messages.length - 1 : start), messages));
  const type = stringifyName(firstDefined(input.type, input.operator, 'fragment')).toLowerCase() || 'fragment';
  const text = stringifyName(firstDefined(input.text, input.condition, input.label));
  const rawOperands = Array.isArray(input.operands) ? input.operands : [];
  const operands = rawOperands
    .map((operand, operandIndex) => normalizeFragmentOperand(operand, operandIndex, messages, start, end, text))
    .filter((operand): operand is NormalizedFragmentOperand => operand != null);

  return {
    id: stringifyName(input.id ?? `fragment-${index}`),
    type,
    text,
    start,
    end,
    operands: operands.length ? operands : [{ text, start, end }],
    raw: input
  };
}

function normalizeFragmentOperand(
  input: unknown,
  index: number,
  messages: SequenceMessageLayout[],
  fallbackStart: number,
  fallbackEnd: number,
  fallbackText: string
): NormalizedFragmentOperand | null {
  if (!isPlainObject(input)) return null;
  const start = clampMessageIndex(resolveMessageIndex(input.start, messages, index === 0 ? fallbackStart : fallbackEnd), messages);
  const end = Math.max(start, clampMessageIndex(resolveMessageIndex(input.end, messages, fallbackEnd), messages));
  return {
    text: stringifyName(firstDefined(input.text, input.condition, input.label, index === 0 ? fallbackText : '')),
    start,
    end
  };
}

function normalizeConstraints(
  input: unknown[],
  messages: SequenceMessageLayout[],
  participantById: Map<string, SequenceParticipantLayout>
): NormalizedConstraint[] {
  return input
    .map((item, index) => normalizeConstraint(item, index, messages, participantById))
    .filter((constraint): constraint is NormalizedConstraint => constraint != null);
}

function normalizeConstraint(
  input: unknown,
  index: number,
  messages: SequenceMessageLayout[],
  participantById: Map<string, SequenceParticipantLayout>
): NormalizedConstraint | null {
  if (!isPlainObject(input)) return null;
  const fallback = messages.length ? messages.length - 1 : 0;
  const start = clampMessageIndex(resolveMessageIndex(firstDefined(input.start, input.from), messages, fallback), messages);
  const end = Math.max(start, clampMessageIndex(resolveMessageIndex(firstDefined(input.end, input.to), messages, start), messages));
  const text = stringifyName(firstDefined(input.text, input.constraint, input.label));
  if (!text) return null;

  return {
    id: stringifyName(input.id ?? `constraint-${index}`),
    type: normalizeConstraintType(input.type),
    text,
    participants: normalizeParticipantIds(input, participantById),
    start,
    end,
    raw: input
  };
}

function resolveMessageIndex(value: unknown, messages: SequenceMessageLayout[], fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.round(value);
  if (typeof value === 'string') {
    const byId = messages.findIndex((message) => message.id === value || message.text === value || message.name === value);
    if (byId >= 0) return byId;
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return Math.round(numeric);
  }
  return fallback;
}

function messageOffsetAt(index: number, offsets: number[]): number {
  return offsets[index] || 0;
}

function clampMessageIndex(value: number, messages: SequenceMessageLayout[]): number {
  return Math.max(0, Math.min(Math.max(0, messages.length - 1), value));
}

function firstLifecycleMessageIndex(
  messages: NormalizedMessage[],
  participantId: string,
  type: 'create' | 'destroy'
): number | null {
  const index = messages.findIndex((message) => message.to === participantId && message.type === type);
  return index >= 0 ? index : null;
}

function normalizeParticipantIds(
  input: Record<string, unknown>,
  participantById: Map<string, SequenceParticipantLayout>
): string[] {
  const ids = Array.isArray(input.participants)
    ? input.participants.map(stringifyName)
    : [stringifyName(firstDefined(input.participant, input.participantId, input.lifeline))].filter(Boolean);
  return ids.filter((id, index) => id && participantById.has(id) && ids.indexOf(id) === index);
}

function normalizeParticipantKind(value: unknown): SequenceParticipantKind {
  if (typeof value !== 'string') return 'participant';
  const normalized = value.toLowerCase();
  if (
    normalized === 'actor' ||
    normalized === 'boundary' ||
    normalized === 'control' ||
    normalized === 'entity' ||
    normalized === 'database' ||
    normalized === 'collections' ||
    normalized === 'queue'
  ) {
    return normalized;
  }
  return 'participant';
}

function normalizeNotePosition(value: unknown): SequenceNotePosition {
  if (value === 'left' || value === 'right' || value === 'over') return value;
  return 'over';
}

function normalizeConstraintType(value: unknown): SequenceConstraintType {
  return typeof value === 'string' && value.toLowerCase() === 'duration' ? 'duration' : 'timing';
}

function normalizeMessageType(value: unknown, from: string, to: string): SequenceMessageType {
  if (from && to && from === to) return 'self';
  if (typeof value !== 'string') return 'sync';
  const normalized = value.toLowerCase();
  if (normalized === 'async' || normalized === 'asynchronous') return 'async';
  if (normalized === 'return' || normalized === 'reply' || normalized === 'response') return 'return';
  if (normalized === 'create' || normalized === 'creation') return 'create';
  if (normalized === 'destroy' || normalized === 'delete') return 'destroy';
  if (normalized === 'self' || normalized === 'loop') return 'self';
  return 'sync';
}

function normalizePadding(value: unknown): SequencePadding {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const padding = Math.max(0, value);
    return {
      top: padding,
      right: padding,
      bottom: padding,
      left: padding
    };
  }

  if (isPlainObject(value)) {
    return {
      top: Math.max(0, finiteNumber(value.top, DEFAULT_PADDING)),
      right: Math.max(0, finiteNumber(value.right, DEFAULT_PADDING)),
      bottom: Math.max(0, finiteNumber(value.bottom, DEFAULT_PADDING)),
      left: Math.max(0, finiteNumber(value.left, DEFAULT_PADDING))
    };
  }

  return {
    top: DEFAULT_PADDING,
    right: DEFAULT_PADDING,
    bottom: DEFAULT_PADDING,
    left: DEFAULT_PADDING
  };
}

function finiteNumber(value: unknown, fallback: number): number {
  const numeric = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  return Number.isFinite(numeric) ? numeric : fallback;
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.max(min, Math.min(max, value));
}

function stringifyName(value: unknown): string {
  if (value == null) return '';
  return String(value);
}

function firstDefined(...values: unknown[]): unknown {
  return values.find((value) => value !== undefined && value !== null);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

export const __test__ = {
  buildMessageOffsets,
  clamp,
  clampMessageIndex,
  estimateNoteTextWidth,
  finiteNumber,
  firstDefined,
  firstLifecycleMessageIndex,
  isPlainObject,
  layoutActivation,
  layoutConstraint,
  layoutFragment,
  layoutMessage,
  layoutNote,
  layoutParticipants,
  messageOffsetAt,
  normalizeActivation,
  normalizeActivations,
  normalizeConstraint,
  normalizeConstraints,
  normalizeConstraintType,
  normalizeFragment,
  normalizeFragmentOperand,
  normalizeFragments,
  normalizeMessageType,
  normalizeMessage,
  normalizeMessages,
  normalizeNote,
  normalizeNotePosition,
  normalizeNotes,
  normalizeParticipant,
  normalizeParticipantIds,
  normalizeParticipantKind,
  normalizeParticipants,
  normalizePadding,
  placeNoteHorizontally,
  placeNoteInMessageGap,
  placeNoteVertically,
  readActivations,
  readConstraints,
  readFragments,
  readMessages,
  readNotes,
  readParsedDsl,
  readParticipants,
  rectanglesOverlap,
  resolveMessageIndex,
  splitNoteText,
  stringifyName,
  wrapLine,
  wrapNoteText,
  avoidHeaderOverlap
};
