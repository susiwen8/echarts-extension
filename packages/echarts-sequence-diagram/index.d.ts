import 'echarts';

type SequenceMessageType = 'sync' | 'async' | 'return' | 'create' | 'destroy' | 'self';
type SequenceParticipantKind = 'participant' | 'actor' | 'boundary' | 'control' | 'entity' | 'database' | 'collections' | 'queue';
type SequenceNotePosition = 'left' | 'right' | 'over';
type SequenceConstraintType = 'timing' | 'duration';
type SequencePaddingOption = number | {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
};

interface SequenceParticipantItem {
  id?: string | number;
  name?: string;
  label?: string;
  kind?: SequenceParticipantKind | string;
  type?: SequenceParticipantKind | string;
  itemStyle?: {
    color?: string;
    opacity?: number;
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
  };
  labelStyle?: SequenceTextStyleOption;
  [key: string]: unknown;
}

type SequenceParticipantRow = [id: string | number, name?: string];

interface SequenceMessageItem {
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
  type?: SequenceMessageType | string;
  lineStyle?: SequenceLineStyleOption;
  labelStyle?: SequenceTextStyleOption;
  label?: string | (SequenceTextStyleOption & {
    show?: boolean;
    formatter?: string | ((params: SequenceMessageLabelParams) => unknown);
  });
  [key: string]: unknown;
}

type SequenceMessageRow = [
  from: string | number,
  to: string | number,
  text?: string,
  type?: SequenceMessageType | string
];

interface SequenceActivationItem {
  id?: string | number;
  participant?: string | number;
  participantId?: string | number;
  lifeline?: string | number;
  start?: number | string;
  end?: number | string;
  depth?: number;
  itemStyle?: {
    color?: string;
    opacity?: number;
    borderColor?: string;
    borderWidth?: number;
  };
  [key: string]: unknown;
}

interface SequenceNoteItem {
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
  itemStyle?: {
    color?: string;
    opacity?: number;
    borderColor?: string;
    borderWidth?: number;
  };
  labelStyle?: SequenceTextStyleOption;
  [key: string]: unknown;
}

interface SequenceFragmentOperandItem {
  text?: string;
  condition?: string;
  label?: string;
  start?: number | string;
  end?: number | string;
  [key: string]: unknown;
}

interface SequenceFragmentItem {
  id?: string | number;
  type?: string;
  operator?: string;
  text?: string;
  condition?: string;
  label?: string;
  start?: number | string;
  end?: number | string;
  operands?: SequenceFragmentOperandItem[];
  itemStyle?: {
    color?: string;
    opacity?: number;
    borderColor?: string;
    borderWidth?: number;
  };
  labelStyle?: SequenceTextStyleOption;
  [key: string]: unknown;
}

interface SequenceConstraintItem {
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
  itemStyle?: SequenceLineStyleOption;
  labelStyle?: SequenceTextStyleOption;
  [key: string]: unknown;
}

interface SequenceLineStyleOption {
  color?: string;
  stroke?: string;
  width?: number;
  lineWidth?: number;
  opacity?: number;
  type?: 'solid' | 'dashed' | 'dotted' | number[] | string;
  dashOffset?: number;
  lineDashOffset?: number;
}

interface SequenceTextStyleOption {
  color?: string;
  fontSize?: number;
  fontWeight?: string | number;
}

interface SequenceMessageLabelParams {
  data: unknown;
  name: string;
  from: string;
  to: string;
  type: SequenceMessageType;
}

interface SequenceParticipantLabelParams {
  data: unknown;
  name: string;
  id: string;
}

declare module 'echarts/types/dist/echarts' {
  export interface SequenceDiagramSeriesOption {
    mainType?: 'series';
    type?: 'sequenceDiagram';
    silent?: boolean;

    width?: number | string;
    height?: number | string;
    top?: number | string;
    right?: number | string;
    bottom?: number | string;
    left?: number | string;

    participants?: Array<SequenceParticipantItem | SequenceParticipantRow | string | number>;
    messages?: Array<SequenceMessageItem | SequenceMessageRow>;
    data?: Array<SequenceMessageItem | SequenceMessageRow>;
    activations?: SequenceActivationItem[];
    notes?: SequenceNoteItem[];
    fragments?: SequenceFragmentItem[];
    constraints?: SequenceConstraintItem[];
    dsl?: string;
    source?: string;

    padding?: SequencePaddingOption;
    headerHeight?: number;
    headerWidth?: number;
    messageGap?: number;
    selfLoopWidth?: number;
    selfLoopHeight?: number;
    activationWidth?: number;
    activationMargin?: number;

    participantStyle?: {
      color?: string;
      opacity?: number;
      borderColor?: string;
      borderWidth?: number;
      borderRadius?: number;
    };
    lifelineStyle?: SequenceLineStyleOption;
    activationStyle?: {
      color?: string;
      opacity?: number;
      borderColor?: string;
      borderWidth?: number;
    };
    noteStyle?: {
      color?: string;
      opacity?: number;
      borderColor?: string;
      borderWidth?: number;
    };
    fragmentStyle?: {
      color?: string;
      opacity?: number;
      borderColor?: string;
      borderWidth?: number;
    };
    constraintStyle?: SequenceLineStyleOption;
    lineStyle?: SequenceLineStyleOption;
    label?: SequenceTextStyleOption & {
      show?: boolean;
      formatter?: string | ((params: SequenceMessageLabelParams) => unknown);
    };
    participantLabel?: SequenceTextStyleOption & {
      show?: boolean;
      formatter?: string | ((params: SequenceParticipantLabelParams) => unknown);
    };
    emphasis?: {
      itemStyle?: {
        opacity?: number;
        shadowBlur?: number;
        shadowColor?: string;
      };
    };
  }

  interface RegisteredSeriesOption {
    sequenceDiagram: SequenceDiagramSeriesOption;
  }
}

export interface ParsedSequenceDiagramDsl {
  participants: Array<SequenceParticipantItem | SequenceParticipantRow | string | number>;
  messages: Array<SequenceMessageItem | SequenceMessageRow>;
  activations: SequenceActivationItem[];
  notes: SequenceNoteItem[];
  fragments: SequenceFragmentItem[];
  constraints: SequenceConstraintItem[];
}

export function parseSequenceDiagramDsl(source: string): ParsedSequenceDiagramDsl;
