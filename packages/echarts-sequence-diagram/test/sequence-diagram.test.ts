import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import * as echarts from 'echarts';
import { SVGRenderer } from 'echarts/renderers';
import { test } from 'vitest';

import '../index.ts';
import { parseSequenceDiagramDsl } from '../src/dsl.ts';
import {
  layoutSequenceDiagram,
  resolveSequenceDiagramLayout
} from '../src/layout.ts';

echarts.use([SVGRenderer]);

const sampleDiagram = {
  participants: [
    { id: 'client', name: 'Client' },
    { id: 'api', name: 'API' },
    { id: 'db', name: 'Database' }
  ],
  messages: [
    { from: 'client', to: 'api', text: 'GET /orders', type: 'sync' },
    { from: 'api', to: 'db', text: 'SELECT orders', type: 'async' },
    { from: 'db', to: 'api', text: 'rows', type: 'return' },
    { from: 'api', to: 'api', text: 'cache()', type: 'self' }
  ],
  activations: [
    { participant: 'api', start: 0, end: 3 }
  ]
};

test('does not depend on UML parser or diagram packages', () => {
  const packageJson = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8')
  );

  assert.equal(packageJson.dependencies?.mermaid, undefined);
  assert.equal(packageJson.dependencies?.plantuml, undefined);
  assert.equal(packageJson.dependencies?.['@mermaid-js/mermaid-cli'], undefined);
});

test('computes deterministic sequence diagram layout for lifelines, messages, and activations', () => {
  const first = layoutSequenceDiagram(sampleDiagram, {
    width: 600,
    height: 420,
    padding: 40,
    headerHeight: 32,
    messageGap: 44,
    selfLoopWidth: 52
  });
  const second = layoutSequenceDiagram(sampleDiagram, {
    width: 600,
    height: 420,
    padding: 40,
    headerHeight: 32,
    messageGap: 44,
    selfLoopWidth: 52
  });

  assert.deepEqual(first, second);
  assert.deepEqual(
    first.participants.map((participant) => [participant.id, Math.round(participant.x)]),
    [['client', 40], ['api', 300], ['db', 560]]
  );
  assert.deepEqual(
    first.messages.map((message) => [message.text, Math.round(message.y), message.direction]),
    [
      ['GET /orders', 108, 'right'],
      ['SELECT orders', 152, 'right'],
      ['rows', 196, 'left'],
      ['cache()', 240, 'self']
    ]
  );

  const apiActivation = first.activations.find((activation) => activation.participantId === 'api');
  assert.ok(apiActivation);
  assert.equal(Math.round(apiActivation.x), 294);
  assert.equal(Math.round(apiActivation.y), 96);
  assert.equal(Math.round(apiActivation.height), 156);

  const selfMessage = first.messages.find((message) => message.direction === 'self');
  assert.ok(selfMessage);
  assert.deepEqual(
    selfMessage.points.map((point) => [Math.round(point.x), Math.round(point.y)]),
    [[300, 240], [352, 240], [352, 262], [300, 262]]
  );
});

test('resolves participants from data messages when participants are omitted', () => {
  const result = resolveSequenceDiagramLayout({
    data: [
      { source: 'Browser', target: 'Server', name: 'request' },
      { source: 'Server', target: 'Cache', name: 'lookup' },
      { source: 'Cache', target: 'Server', name: 'hit', type: 'return' }
    ],
    width: 480,
    height: 320,
    padding: 32
  });

  assert.deepEqual(
    result.participants.map((participant) => participant.id),
    ['Browser', 'Server', 'Cache']
  );
  assert.equal(result.messages[2].type, 'return');
});

test('renders UML sequence diagram lifelines, arrows, labels, and dashed returns', () => {
  const chart = echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width: 640,
    height: 420
  });

  chart.setOption({
    animation: false,
    series: [
      {
        type: 'sequenceDiagram',
        width: 600,
        height: 380,
        left: 20,
        top: 20,
        ...sampleDiagram,
        label: {
          show: true
        }
      }
    ]
  });

  const svg = chart.renderToSVGString();
  chart.dispose();

  assert.match(svg, /Client/);
  assert.match(svg, /GET \/orders/);
  assert.match(svg, /cache\(\)/);
  assert.match(svg, /stroke-dasharray/);
});

test('parses Mermaid sequenceDiagram text into participants, messages, and activations', () => {
  const parsed = parseSequenceDiagramDsl(`
    sequenceDiagram
      participant C as Client
      participant API as Order API
      database DB as Database
      C->>+API: GET /orders
      API-)DB: queue query
      DB-->>-API: rows
      API->>API: cache()
  `);

  assert.deepEqual(
    parsed.participants?.map((participant) => [participant.id, participant.name]),
    [['C', 'Client'], ['API', 'Order API'], ['DB', 'Database']]
  );
  assert.deepEqual(
    parsed.messages?.map((message) => [message.from, message.to, message.text, message.type]),
    [
      ['C', 'API', 'GET /orders', 'async'],
      ['API', 'DB', 'queue query', 'async'],
      ['DB', 'API', 'rows', 'return'],
      ['API', 'API', 'cache()', 'self']
    ]
  );
  assert.deepEqual(parsed.activations?.map((activation) => [activation.participant, activation.start, activation.end]), [
    ['API', 0, 2]
  ]);
});

test('parses PlantUML sequence text with aliases and explicit activation blocks', () => {
  const parsed = parseSequenceDiagramDsl(`
    @startuml
    actor "Web Client" as Client
    participant "Order API" as API
    database Database as DB
    Client -> API: place order
    activate API
    API ->> DB: insert order
    DB --> API: id
    API -> API: normalize
    deactivate API
    @enduml
  `);

  assert.deepEqual(
    parsed.participants?.map((participant) => [participant.id, participant.name]),
    [['Client', 'Web Client'], ['API', 'Order API'], ['DB', 'Database']]
  );
  assert.deepEqual(parsed.messages?.map((message) => [message.from, message.to, message.type]), [
    ['Client', 'API', 'sync'],
    ['API', 'DB', 'async'],
    ['DB', 'API', 'return'],
    ['API', 'API', 'self']
  ]);
  assert.deepEqual(parsed.activations?.map((activation) => [activation.participant, activation.start, activation.end]), [
    ['API', 0, 3]
  ]);
});

test('parses advanced UML notation from Mermaid and PlantUML sequence text', () => {
  const parsed = parseSequenceDiagramDsl(`
    @startuml
    actor "Shopper" as U
    participant Checkout
    create participant "Order" as O
    U -> Checkout: submit
    Checkout -> O **: create order
    note over Checkout,O: validated request
    alt paid
      Checkout -> O: capture
    else declined
      Checkout --> U: retry
    end
    loop each item
      O -> O: reserve
    end
    ... <= 2s ...
    duration Checkout,O: <= 2s
    Checkout -x O: cancel order
    destroy O
    @enduml
  `);

  assert.deepEqual(
    parsed.participants?.map((participant) => [participant.id, participant.name, participant.kind]),
    [['U', 'Shopper', 'actor'], ['Checkout', 'Checkout', 'participant'], ['O', 'Order', 'participant']]
  );
  assert.deepEqual(
    parsed.messages?.map((message) => [message.from, message.to, message.text, message.type]),
    [
      ['U', 'Checkout', 'submit', 'sync'],
      ['Checkout', 'O', 'create order', 'create'],
      ['Checkout', 'O', 'capture', 'sync'],
      ['Checkout', 'U', 'retry', 'return'],
      ['O', 'O', 'reserve', 'self'],
      ['Checkout', 'O', 'cancel order', 'destroy']
    ]
  );
  assert.deepEqual(parsed.notes?.map((note) => [note.text, note.position, note.participants]), [
    ['validated request', 'over', ['Checkout', 'O']]
  ]);
  assert.deepEqual(
    parsed.fragments?.map((fragment) => [
      fragment.type,
      fragment.text,
      fragment.start,
      fragment.end,
      fragment.operands?.map((operand) => [operand.text, operand.start, operand.end])
    ]),
    [
      ['alt', 'paid', 2, 3, [['paid', 2, 2], ['declined', 3, 3]]],
      ['loop', 'each item', 4, 4, [['each item', 4, 4]]]
    ]
  );
  assert.deepEqual(parsed.constraints?.map((constraint) => [constraint.type, constraint.text, constraint.participants]), [
    ['timing', '<= 2s', []],
    ['duration', '<= 2s', ['Checkout', 'O']]
  ]);
});

test('lays out actor, create, destroy, notes, fragments, and constraints', () => {
  const layout = layoutSequenceDiagram({
    participants: [
      { id: 'user', name: 'User', kind: 'actor' },
      { id: 'service', name: 'Service' },
      { id: 'session', name: 'Session' }
    ],
    messages: [
      { id: 'start', from: 'user', to: 'service', text: 'login', type: 'sync' },
      { id: 'create-session', from: 'service', to: 'session', text: 'new', type: 'create' },
      { id: 'validate', from: 'service', to: 'session', text: 'validate', type: 'sync' },
      { id: 'stop', from: 'service', to: 'session', text: 'close', type: 'destroy' }
    ],
    notes: [
      { participant: 'service', position: 'right', text: 'checks credentials', start: 0 }
    ],
    fragments: [
      { type: 'opt', text: 'remember me', start: 1, end: 2 }
    ],
    constraints: [
      { type: 'duration', participants: ['service', 'session'], start: 1, end: 3, text: '< 500ms' }
    ]
  }, {
    width: 640,
    height: 420,
    padding: 40,
    messageGap: 44
  });

  const user = layout.participants.find((participant) => participant.id === 'user');
  const session = layout.participants.find((participant) => participant.id === 'session');
  const createMessage = layout.messages.find((message) => message.id === 'create-session');
  const destroyMessage = layout.messages.find((message) => message.id === 'stop');

  assert.equal(user?.kind, 'actor');
  assert.ok(session);
  assert.ok(createMessage);
  assert.ok(destroyMessage);
  assert.equal(Math.round(session.header.y), Math.round(createMessage.y - layout.headerHeight / 2));
  assert.equal(Math.round(session.lifeline.y1), Math.round(createMessage.y + layout.headerHeight / 2));
  assert.equal(Math.round(session.lifeline.y2), Math.round(destroyMessage.y));
  assert.equal(layout.notes[0]?.text, 'checks credentials');
  assert.equal(layout.fragments[0]?.type, 'opt');
  assert.equal(layout.constraints[0]?.type, 'duration');
});

test('keeps long notes away from created participant headers', () => {
  const layout = layoutSequenceDiagram({
    participants: [
      { id: 'checkout', name: 'Checkout API' },
      { id: 'session', name: 'Session' }
    ],
    messages: [
      { id: 'create-session', from: 'checkout', to: 'session', text: 'Open session', type: 'create' },
      { id: 'persist', from: 'checkout', to: 'session', text: 'persist', type: 'sync' }
    ],
    notes: [
      {
        participant: 'checkout',
        position: 'right',
        text: 'Validate cart and customer profile',
        start: 0
      }
    ]
  }, {
    width: 420,
    height: 240,
    padding: 32,
    messageGap: 48
  });

  const note = layout.notes[0];
  const session = layout.participants.find((participant) => participant.id === 'session');
  assert.ok(note);
  assert.ok(session);
  assert.ok(note.width >= 96);
  assert.ok(note.lines.length >= 1);
  assert.equal(rectanglesOverlap(note, session.header), false);
});

function rectanglesOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
): boolean {
  return a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y;
}

test('renders a sequence diagram directly from Mermaid and PlantUML DSL text', () => {
  const chart = echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width: 720,
    height: 460
  });

  chart.setOption({
    animation: false,
    series: [
      {
        type: 'sequenceDiagram',
        dsl: `
          sequenceDiagram
            participant C as Client
            participant API as API
            C->>+API: GET /orders
            API-->>-C: response
        `,
        left: 20,
        top: 20,
        width: 320,
        height: 380
      },
      {
        type: 'sequenceDiagram',
        source: `
          @startuml
          actor User as U
          participant "Order API" as API
          U -> API: submit
          API --> U: accepted
          @enduml
        `,
        left: 360,
        top: 20,
        width: 320,
        height: 380
      }
    ]
  });

  const svg = chart.renderToSVGString();
  chart.dispose();

  assert.match(svg, /GET \/orders/);
  assert.match(svg, /response/);
  assert.match(svg, /submit/);
  assert.match(svg, /accepted/);
});

test('renders advanced UML sequence diagram notation', () => {
  const chart = echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width: 760,
    height: 520
  });

  chart.setOption({
    animation: false,
    series: [
      {
        type: 'sequenceDiagram',
        left: 20,
        top: 20,
        width: 700,
        height: 460,
        dsl: `
          sequenceDiagram
            actor User
            participant Service
            create participant Session
            User->>Service: login
            Service->>Session**: create
            Note right of Service: checks credentials
            opt remember me
              Service->>Session: persist
            end
            duration Service,Session: < 500ms
            Service-xSession: destroy
        `,
        label: {
          show: true
        }
      }
    ]
  });

  const svg = chart.renderToSVGString();
  chart.dispose();

  assert.match(svg, /User/);
  assert.match(svg, /checks credentials/);
  assert.match(svg, /remember me/);
  assert.match(svg, /&lt; 500ms/);
  assert.match(svg, /destroy/);
});
