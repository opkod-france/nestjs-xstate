# @opkod-france/nestjs-xstate

NestJS workflow engine integrating XState v5 — machine registration, actor lifecycle management, persistence abstraction, and event bridging.

## Installation

```bash
npm install @opkod-france/nestjs-xstate xstate
```

## Usage

### 1. Register the module

```ts
import { XStateModule } from '@opkod-france/nestjs-xstate';

@Module({
  imports: [XStateModule.forRoot({})],
})
export class AppModule {}
```

With persistence:

```ts
XStateModule.forRoot({ persistence: new MyPersistenceAdapter() })
```

### 2. Register machines per feature

```ts
import { XStateModule } from '@opkod-france/nestjs-xstate';
import { orderMachine } from './order.machine';

@Module({
  imports: [
    XStateModule.forFeature([
      { name: 'order', machine: orderMachine },
    ]),
  ],
})
export class OrderModule {}
```

With DI-powered implementations:

```ts
XStateModule.forFeature({
  machines: [
    {
      name: 'order',
      machine: orderMachine,
      implementations: (svc: OrderService) => ({
        actors: {
          charge: fromPromise(({ input }) => svc.charge(input.id)),
        },
      }),
      implementationDeps: [OrderService],
    },
  ],
  imports: [OrderServiceModule],
})
```

### 3. Inject and use

```ts
import { InjectActorFactory, ActorFactory } from '@opkod-france/nestjs-xstate';

@Injectable()
export class OrderService {
  constructor(
    @InjectActorFactory('order') private readonly orders: ActorFactory,
  ) {}

  async submit(orderId: string) {
    return this.orders.send(orderId, { type: 'submit' });
  }

  async create(orderId: string, total: number) {
    return this.orders.getOrCreate(orderId, {
      input: { orderId, total },
    });
  }
}
```

## Persistence

Implement the `StateMachinePersistence` abstract class:

```ts
import { StateMachinePersistence } from '@opkod-france/nestjs-xstate';

export class DatabasePersistence extends StateMachinePersistence {
  async save(machineName: string, entityId: string, snapshot: Snapshot<unknown>) { /* ... */ }
  async load(machineName: string, entityId: string) { /* ... */ }
  async delete(machineName: string, entityId: string) { /* ... */ }
}
```

## Events

When `@nestjs/event-emitter` is installed, these events are emitted automatically:

- `ActorStartedEvent` — when an actor is created and started
- `TransitionEvent` — on every state transition
- `ActorStoppedEvent` — when an actor is stopped

## License

MIT
