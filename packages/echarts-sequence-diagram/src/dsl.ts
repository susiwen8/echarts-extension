import type {
  SequenceActivationInput,
  SequenceConstraintInput,
  SequenceDiagramInput,
  SequenceFragmentInput,
  SequenceFragmentOperandInput,
  SequenceMessageInput,
  SequenceMessageType,
  SequenceNoteInput,
  SequenceParticipantInput
} from './layout.js';

type SequenceDslDialect = 'mermaid' | 'plantuml' | 'unknown';

interface ActivationStackEntry {
  participant: string;
  start: number;
  depth: number;
}

interface ParsedMessageHead {
  from: string;
  to: string;
  arrow: string;
  text: string;
  activate?: string;
  deactivate?: string;
  create?: boolean;
}

interface PendingNote {
  position: 'left' | 'right' | 'over';
  participants: string[];
  start: number;
  lines: string[];
  raw: string;
}

interface FragmentStackEntry {
  id: string;
  type: string;
  text: string;
  start: number;
  operands: SequenceFragmentOperandInput[];
  raw: string;
}

const participantKeywords = new Set([
  'actor',
  'boundary',
  'collections',
  'control',
  'database',
  'entity',
  'participant',
  'queue'
]);

export interface ParsedSequenceDiagramDsl extends SequenceDiagramInput {
  participants: SequenceParticipantInput[];
  messages: SequenceMessageInput[];
  activations: SequenceActivationInput[];
  notes: SequenceNoteInput[];
  fragments: SequenceFragmentInput[];
  constraints: SequenceConstraintInput[];
}

export function parseSequenceDiagramDsl(source: unknown): ParsedSequenceDiagramDsl {
  const text = typeof source === 'string' ? source : '';
  const participants: SequenceParticipantInput[] = [];
  const messages: SequenceMessageInput[] = [];
  const activations: SequenceActivationInput[] = [];
  const notes: SequenceNoteInput[] = [];
  const fragments: SequenceFragmentInput[] = [];
  const constraints: SequenceConstraintInput[] = [];
  const declaredParticipants = new Set<string>();
  const activationStack = new Map<string, ActivationStackEntry[]>();
  const fragmentStack: FragmentStackEntry[] = [];
  let pendingNote: PendingNote | null = null;
  let dialect: SequenceDslDialect = 'unknown';

  const addParticipant = (id: string, name = id, raw?: unknown, kind = 'participant') => {
    if (!id) return;
    if (declaredParticipants.has(id)) {
      const existing = participants.find((participant) => participant.id === id);
      if (existing && !existing.kind) existing.kind = kind;
      return;
    }
    declaredParticipants.add(id);
    participants.push({ id, name, kind, raw });
  };

  for (const originalLine of text.split(/\r?\n/)) {
    const line = stripInlineComment(originalLine).trim();
    if (pendingNote) {
      if (/^end\s+note$/i.test(line)) {
        notes.push({
          id: `dsl-note-${notes.length}`,
          text: pendingNote.lines.join('\n').trim(),
          position: pendingNote.position,
          participants: pendingNote.participants,
          start: pendingNote.start,
          end: Math.max(0, messages.length - 1),
          raw: pendingNote.raw
        });
        pendingNote = null;
      } else if (line) {
        pendingNote.lines.push(line);
      }
      continue;
    }
    if (!line) continue;

    const lower = line.toLowerCase();
    if (lower === '@startuml') {
      dialect = 'plantuml';
      continue;
    }
    if (lower === '@enduml') break;
    if (lower === 'sequencediagram') {
      dialect = 'mermaid';
      continue;
    }
    if (shouldIgnoreLine(lower)) continue;

    const declaration = parseParticipantDeclaration(line, dialect);
    if (declaration) {
      addParticipant(declaration.id, declaration.name, line, declaration.kind);
      continue;
    }

    const note = parseNote(line, messages.length);
    if (note?.pending) {
      pendingNote = note.pending;
      note.pending.participants.forEach((participant) => addParticipant(participant));
      continue;
    }
    if (note?.value) {
      notes.push({
        id: `dsl-note-${notes.length}`,
        ...note.value
      });
      const noteParticipants = Array.isArray(note.value.participants) ? note.value.participants : [];
      noteParticipants.forEach((participant) => addParticipant(String(participant)));
      continue;
    }

    const fragmentStart = parseFragmentStart(line, messages.length, fragments.length + fragmentStack.length);
    if (fragmentStart) {
      fragmentStack.push(fragmentStart);
      continue;
    }

    const fragmentOperand = parseFragmentOperand(line, messages.length);
    if (fragmentOperand && fragmentStack.length) {
      closeCurrentFragmentOperand(fragmentStack[fragmentStack.length - 1], messages.length);
      fragmentStack[fragmentStack.length - 1].operands.push(fragmentOperand);
      continue;
    }

    if (/^end$/i.test(line) && fragmentStack.length) {
      fragments.push(closeFragment(fragmentStack.pop() as FragmentStackEntry, messages.length));
      continue;
    }

    const constraint = parseConstraint(line, messages.length);
    if (constraint) {
      constraints.push({
        id: `dsl-constraint-${constraints.length}`,
        ...constraint
      });
      const constraintParticipants = Array.isArray(constraint.participants) ? constraint.participants : [];
      constraintParticipants.forEach((participant) => addParticipant(String(participant)));
      continue;
    }

    const activation = parseActivationStatement(line, messages.length);
    if (activation?.kind === 'activate') {
      pushActivation(activationStack, activation.participant, activation.start ?? Math.max(0, messages.length - 1));
      addParticipant(activation.participant);
      continue;
    }
    if (activation?.kind === 'deactivate') {
      closeActivation(activationStack, activations, activation.participant, activation.end ?? Math.max(0, messages.length - 1));
      addParticipant(activation.participant);
      continue;
    }

    const messageHead = parseMessageHead(line);
    if (!messageHead) continue;

    const messageIndex = messages.length;
    const type = messageHead.create ? 'create' : inferMessageType(messageHead.arrow, messageHead.from, messageHead.to);
    const message: SequenceMessageInput = {
      id: `dsl-message-${messageIndex}`,
      from: messageHead.from,
      to: messageHead.to,
      text: messageHead.text,
      type,
      raw: line
    };
    messages.push(message);
    addParticipant(messageHead.from);
    addParticipant(messageHead.to);

    if (messageHead.activate) {
      pushActivation(activationStack, messageHead.activate, messageIndex);
    }
    if (messageHead.deactivate) {
      closeActivation(activationStack, activations, messageHead.deactivate, messageIndex);
    }
  }

  if (pendingNote) {
    notes.push({
      id: `dsl-note-${notes.length}`,
      text: pendingNote.lines.join('\n').trim(),
      position: pendingNote.position,
      participants: pendingNote.participants,
      start: pendingNote.start,
      end: Math.max(0, messages.length - 1),
      raw: pendingNote.raw
    });
  }
  while (fragmentStack.length) {
    fragments.push(closeFragment(fragmentStack.pop() as FragmentStackEntry, messages.length));
  }
  closeRemainingActivations(activationStack, activations, Math.max(0, messages.length - 1));

  return {
    participants,
    messages,
    activations,
    notes,
    fragments,
    constraints
  };
}

function parseParticipantDeclaration(
  line: string,
  dialect: SequenceDslDialect
): { id: string; name: string; kind: string } | null {
  const createPrefix = line.match(/^create\s+(.+)$/i);
  const normalizedLine = createPrefix ? createPrefix[1].trim() : line;
  const match = normalizedLine.match(/^([A-Za-z][\w-]*)\s+(.+)$/);
  if (!match || !participantKeywords.has(match[1].toLowerCase())) return null;

  const kind = match[1].toLowerCase() === 'participant' ? 'participant' : match[1].toLowerCase();
  const body = match[2].trim();
  const asParts = splitAs(body);
  if (!asParts) {
    const id = unquote(body);
    return { id, name: id, kind };
  }

  const left = unquote(asParts.left);
  const right = unquote(asParts.right);
  if (!left || !right) return null;

  if (dialect === 'plantuml' || isQuoted(asParts.left)) {
    return { id: right, name: left, kind };
  }
  return { id: left, name: right, kind };
}

function parseActivationStatement(
  line: string,
  messageCount: number
): { kind: 'activate' | 'deactivate'; participant: string; start?: number; end?: number } | null {
  const match = line.match(/^(activate|deactivate|destroy)\s+(.+)$/i);
  if (!match) return null;
  const participant = unquote(match[2].trim());
  if (!participant) return null;
  if (match[1].toLowerCase() === 'activate') {
    return {
      kind: 'activate',
      participant,
      start: Math.max(0, messageCount - 1)
    };
  }
  return {
    kind: 'deactivate',
    participant,
    end: Math.max(0, messageCount - 1)
  };
}

function parseMessageHead(line: string): ParsedMessageHead | null {
  const colonIndex = line.indexOf(':');
  if (colonIndex < 0) return null;
  const head = line.slice(0, colonIndex).trim();
  const text = line.slice(colonIndex + 1).trim();
  const match = head.match(/^(.+?)\s*(-->>|-->|-\)|->>|->|-\]|-[xX]|\.{1,2}>>|\.{1,2}>|={1,2}>>|={1,2}>)\s*(.+)$/);
  if (!match) return null;

  const from = stripEndpointMarker(match[1].trim()).value;
  const target = stripEndpointMarker(match[3].trim());
  const to = target.value;
  if (!from || !to) return null;

  return {
    from,
    to,
    arrow: match[2],
    text,
    activate: target.activate ? to : undefined,
    deactivate: target.deactivate ? to : undefined,
    create: target.create
  };
}

function stripEndpointMarker(value: string): { value: string; activate: boolean; deactivate: boolean; create: boolean } {
  let endpoint = value.trim();
  let activate = false;
  let deactivate = false;
  let create = false;

  if (endpoint.endsWith('**')) {
    create = true;
    endpoint = endpoint.slice(0, -2).trim();
  }

  while (endpoint.startsWith('+') || endpoint.startsWith('-')) {
    const marker = endpoint[0];
    activate = activate || marker === '+';
    deactivate = deactivate || marker === '-';
    endpoint = endpoint.slice(1).trim();
  }

  while (endpoint.endsWith('+') || endpoint.endsWith('-')) {
    const marker = endpoint[endpoint.length - 1];
    activate = activate || marker === '+';
    deactivate = deactivate || marker === '-';
    endpoint = endpoint.slice(0, -1).trim();
  }

  return {
    value: unquote(endpoint),
    activate,
    deactivate,
    create
  };
}

function inferMessageType(arrow: string, from: string, to: string): SequenceMessageType {
  if (from === to) return 'self';
  if (arrow.includes('--') || arrow.startsWith('..')) return 'return';
  if (arrow.includes('>>') || arrow.includes(')') || arrow.includes(']')) return 'async';
  if (/[xX]/.test(arrow)) return 'destroy';
  return 'sync';
}

function pushActivation(stackByParticipant: Map<string, ActivationStackEntry[]>, participant: string, start = 0): void {
  const stack = stackByParticipant.get(participant) || [];
  stack.push({
    participant,
    start,
    depth: stack.length
  });
  stackByParticipant.set(participant, stack);
}

function closeActivation(
  stackByParticipant: Map<string, ActivationStackEntry[]>,
  activations: SequenceActivationInput[],
  participant: string,
  end: number
): void {
  const stack = stackByParticipant.get(participant);
  const entry = stack?.pop();
  if (!entry) return;
  activations.push({
    id: `dsl-activation-${activations.length}`,
    participant,
    start: entry.start,
    end: Math.max(entry.start, end),
    depth: entry.depth
  });
}

function closeRemainingActivations(
  stackByParticipant: Map<string, ActivationStackEntry[]>,
  activations: SequenceActivationInput[],
  fallbackEnd: number
): void {
  stackByParticipant.forEach((stack, participant) => {
    while (stack.length) closeActivation(stackByParticipant, activations, participant, fallbackEnd);
  });
}

function parseNote(
  line: string,
  messageCount: number
): { value?: Omit<SequenceNoteInput, 'id'>; pending?: PendingNote } | null {
  const match = line.match(/^note\s+(left|right|over)\s+(?:of\s+)?(.+?)(?::\s*(.*))?$/i);
  if (!match) return null;
  const position = match[1].toLowerCase() as 'left' | 'right' | 'over';
  const participants = splitParticipants(match[2]);
  const start = Math.max(0, messageCount - 1);
  const text = match[3]?.trim();
  if (text != null) {
    return {
      value: {
        text,
        position,
        participants,
        start,
        end: start,
        raw: line
      }
    };
  }
  return {
    pending: {
      position,
      participants,
      start,
      lines: [],
      raw: line
    }
  };
}

function parseFragmentStart(line: string, messageCount: number, fragmentIndex: number): FragmentStackEntry | null {
  const match = line.match(/^(alt|opt|loop|par|break|critical|ref|assert|neg|strict|seq|sd|consider|ignore)(?:\s+(.*))?$/i);
  if (!match) return null;
  const type = match[1].toLowerCase();
  const text = (match[2] || '').trim();
  return {
    id: `dsl-fragment-${fragmentIndex}`,
    type,
    text,
    start: messageCount,
    operands: [
      {
        text,
        start: messageCount
      }
    ],
    raw: line
  };
}

function parseFragmentOperand(line: string, messageCount: number): SequenceFragmentOperandInput | null {
  const match = line.match(/^(else|and|option)(?:\s+(.*))?$/i);
  if (!match) return null;
  return {
    text: (match[2] || '').trim(),
    start: messageCount
  };
}

function closeCurrentFragmentOperand(fragment: FragmentStackEntry, messageCount: number): void {
  const operand = fragment.operands[fragment.operands.length - 1];
  if (!operand) return;
  operand.end = Math.max(Number(operand.start) || 0, messageCount - 1);
}

function closeFragment(fragment: FragmentStackEntry, messageCount: number): SequenceFragmentInput {
  closeCurrentFragmentOperand(fragment, messageCount);
  const start = fragment.start;
  const end = Math.max(start, messageCount - 1);
  return {
    id: fragment.id,
    type: fragment.type,
    text: fragment.text,
    start,
    end,
    operands: fragment.operands,
    raw: fragment.raw
  };
}

function parseConstraint(line: string, messageCount: number): Omit<SequenceConstraintInput, 'id'> | null {
  const duration = line.match(/^duration\s+(.+?)\s*:\s*(.+)$/i);
  if (duration) {
    return {
      type: 'duration',
      participants: splitParticipants(duration[1]),
      text: duration[2].trim(),
      start: Math.max(0, messageCount - 2),
      end: Math.max(0, messageCount - 1),
      raw: line
    };
  }

  const constraint = line.match(/^constraint\s+(?:over\s+(.+?)\s*)?:\s*(.+)$/i);
  if (constraint) {
    return {
      type: 'timing',
      participants: constraint[1] ? splitParticipants(constraint[1]) : [],
      text: constraint[2].trim(),
      start: Math.max(0, messageCount - 1),
      end: Math.max(0, messageCount - 1),
      raw: line
    };
  }

  const delay = line.match(/^\.\.\.\s*(.*?)\s*\.\.\.$/);
  if (delay) {
    return {
      type: 'timing',
      participants: [],
      text: delay[1].trim(),
      start: Math.max(0, messageCount - 1),
      end: Math.max(0, messageCount - 1),
      raw: line
    };
  }

  const braced = line.match(/^\{(.+)\}$/);
  if (braced) {
    return {
      type: 'timing',
      participants: [],
      text: braced[1].trim(),
      start: Math.max(0, messageCount - 1),
      end: Math.max(0, messageCount - 1),
      raw: line
    };
  }

  return null;
}

function splitParticipants(value: string): string[] {
  return value
    .split(/\s*(?:,|->|-->|to)\s*/i)
    .map((participant) => unquote(participant.trim()))
    .filter(Boolean);
}

function splitAs(value: string): { left: string; right: string } | null {
  const match = value.match(/^(.+?)\s+as\s+(.+)$/i);
  if (!match) return null;
  return {
    left: match[1].trim(),
    right: match[2].trim()
  };
}

function stripInlineComment(line: string): string {
  const trimmed = line.trimStart();
  if (trimmed.startsWith('%%') || trimmed.startsWith("'") || trimmed.startsWith('//')) return '';
  return line;
}

function shouldIgnoreLine(lowercaseLine: string): boolean {
  return /^(autonumber|title|hide|skinparam|box\b|end\s+box|rect\b)/.test(lowercaseLine);
}

function isQuoted(value: string): boolean {
  const trimmed = value.trim();
  return (trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"));
}

function unquote(value: string): string {
  const trimmed = value.trim();
  if (isQuoted(trimmed)) return trimmed.slice(1, -1);
  return trimmed;
}

export const __test__ = {
  inferMessageType,
  parseMessageHead,
  parseNote,
  parseParticipantDeclaration,
  stripEndpointMarker
};
