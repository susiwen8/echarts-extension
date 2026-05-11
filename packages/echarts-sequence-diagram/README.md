# echarts-sequence-diagram

ECharts extension chart for UML sequence diagrams.

```js
import * as echarts from 'echarts';
import 'echarts-sequence-diagram';

const chart = echarts.init(document.getElementById('main'));
chart.setOption({
  series: [
    {
      type: 'sequenceDiagram',
      participants: [
        { id: 'browser', name: 'Browser' },
        { id: 'api', name: 'API' },
        { id: 'db', name: 'Database' }
      ],
      messages: [
        { from: 'browser', to: 'api', text: 'GET /orders', type: 'sync' },
        { from: 'api', to: 'db', text: 'SELECT orders', type: 'async' },
        { from: 'db', to: 'api', text: 'rows', type: 'return' },
        { from: 'api', to: 'api', text: 'cache()', type: 'self' }
      ],
      activations: [
        { participant: 'api', start: 0, end: 3 }
      ]
    }
  ]
});
```

Text DSL can be passed directly with `dsl` or `source`:

```js
chart.setOption({
  series: [
    {
      type: 'sequenceDiagram',
      dsl: `
        sequenceDiagram
          actor C as Client
          participant API as Order API
          create participant Session
          C->>+API: GET /orders
          API->>Session**: create session
          Note right of API: validate token
          opt cached
            API-->>-C: response
          end
          duration API,Session: < 100ms
          API-xSession: close
      `
    }
  ]
});
```

## Options

- `participants`: optional ordered lifelines. Omit it to infer participants from `messages` or `data`.
- `messages` / `data`: ordered message rows or objects. Objects accept `from`/`to` or `source`/`target`, plus `text`, `name`, `message`, or `label`.
- `dsl` / `source`: Mermaid `sequenceDiagram` or PlantUML `@startuml` text. The parser supports participant/actor declarations, common message arrows, return arrows, self calls, create/destroy markers, notes, activation shortcuts, combined fragments such as `alt`/`opt`/`loop`/`par`, and simple timing/duration constraints.
- `type`: `sync`, `async`, `return`, `create`, `destroy`, or `self`.
- `activations`: activation bars using `{ participant, start, end, depth }`, where `start` and `end` are message indexes or message ids.
- `notes`: note boxes using `{ text, participant | participants, position, start, end }`.
- `fragments`: combined fragment frames using `{ type, text, start, end, operands }`.
- `constraints`: timing or duration annotations using `{ type: 'timing' | 'duration', text, participants, start, end }`.
- Layout controls: `padding`, `headerWidth`, `headerHeight`, `messageGap`, `selfLoopWidth`, `selfLoopHeight`, `activationWidth`.
