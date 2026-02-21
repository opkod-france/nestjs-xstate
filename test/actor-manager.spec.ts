import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ActorManager } from '../src/services/actor-manager.service';
import { orderMachine } from './fixtures/order.machine';
import { MockPersistence } from './fixtures/mock-persistence';

describe('ActorManager', () => {
  let manager: ActorManager;
  let persistence: MockPersistence;

  beforeEach(() => {
    persistence = new MockPersistence();
    manager = new ActorManager('order', orderMachine, persistence);
  });

  it('should create a new actor', async () => {
    const actor = await manager.getOrCreate('order-1', {
      input: { orderId: 'order-1', total: 100 },
    });
    expect(actor).toBeDefined();
    expect(actor.getSnapshot().value).toBe('pending');
  });

  it('should return the same actor on subsequent calls', async () => {
    const actor1 = await manager.getOrCreate('order-1', {
      input: { orderId: 'order-1', total: 100 },
    });
    const actor2 = await manager.getOrCreate('order-1');
    expect(actor1).toBe(actor2);
  });

  it('should send events and return snapshot', async () => {
    await manager.getOrCreate('order-1', {
      input: { orderId: 'order-1', total: 100 },
    });
    const snapshot = await manager.send('order-1', { type: 'submit' });
    expect(snapshot.value).toBe('processing');
  });

  it('should auto-create actor on send if not exists', async () => {
    // getOrCreate is called internally by send, so we pass input first
    await manager.getOrCreate('order-2', {
      input: { orderId: 'order-2', total: 50 },
    });
    const snapshot = await manager.send('order-2', { type: 'submit' });
    expect(snapshot.value).toBe('processing');
  });

  it('should persist snapshots on transition', async () => {
    await manager.getOrCreate('order-1', {
      input: { orderId: 'order-1', total: 100 },
    });
    await manager.send('order-1', { type: 'submit' });

    // Give persistence a tick to complete
    await new Promise((r) => setTimeout(r, 10));

    const persisted = await persistence.load('order', 'order-1');
    expect(persisted).toBeDefined();
  });

  it('should restore actor from persistence', async () => {
    // Create and transition an actor
    await manager.getOrCreate('order-1', {
      input: { orderId: 'order-1', total: 100 },
    });
    await manager.send('order-1', { type: 'submit' });
    await new Promise((r) => setTimeout(r, 10));

    // Create a new manager (simulating restart)
    const manager2 = new ActorManager('order', orderMachine, persistence);
    const actor = await manager2.getOrCreate('order-1');
    expect(actor.getSnapshot().value).toBe('processing');
  });

  it('should get snapshot for in-memory actor', async () => {
    await manager.getOrCreate('order-1', {
      input: { orderId: 'order-1', total: 100 },
    });
    const snapshot = await manager.getSnapshot('order-1');
    expect(snapshot).toBeDefined();
    expect(snapshot!.value).toBe('pending');
  });

  it('should return undefined snapshot for unknown actor without persistence', async () => {
    const noPersistManager = new ActorManager('order', orderMachine);
    const snapshot = await noPersistManager.getSnapshot('unknown');
    expect(snapshot).toBeUndefined();
  });

  it('should stop an actor', async () => {
    const noPersistManager = new ActorManager('order', orderMachine);
    await noPersistManager.getOrCreate('order-1', {
      input: { orderId: 'order-1', total: 100 },
    });
    await noPersistManager.stop('order-1');
    const snapshot = await noPersistManager.getSnapshot('order-1');
    expect(snapshot).toBeUndefined();
  });

  it('should stop and delete persisted data', async () => {
    await manager.getOrCreate('order-1', {
      input: { orderId: 'order-1', total: 100 },
    });
    await manager.send('order-1', { type: 'submit' });
    await new Promise((r) => setTimeout(r, 10));

    await manager.stop('order-1', { deletePersisted: true });
    const persisted = await persistence.load('order', 'order-1');
    expect(persisted).toBeUndefined();
  });

  it('should stop all actors on module destroy', async () => {
    const noPersistManager = new ActorManager('order', orderMachine);
    await noPersistManager.getOrCreate('order-1', {
      input: { orderId: 'order-1', total: 100 },
    });
    await noPersistManager.getOrCreate('order-2', {
      input: { orderId: 'order-2', total: 200 },
    });
    await noPersistManager.onModuleDestroy();
    expect(await noPersistManager.getSnapshot('order-1')).toBeUndefined();
    expect(await noPersistManager.getSnapshot('order-2')).toBeUndefined();
  });

  it('should emit events when event emitter is provided', async () => {
    const emitter = { emit: vi.fn() };
    const managerWithEvents = new ActorManager(
      'order',
      orderMachine,
      persistence,
      emitter,
    );
    await managerWithEvents.getOrCreate('order-1', {
      input: { orderId: 'order-1', total: 100 },
    });

    expect(emitter.emit).toHaveBeenCalledWith(
      'ActorStartedEvent',
      expect.objectContaining({ machineName: 'order', entityId: 'order-1' }),
    );

    await managerWithEvents.send('order-1', { type: 'submit' });
    expect(emitter.emit).toHaveBeenCalledWith(
      'TransitionEvent',
      expect.objectContaining({ machineName: 'order', entityId: 'order-1' }),
    );
  });

  it('should work without persistence', async () => {
    const noPersistManager = new ActorManager('order', orderMachine);
    const actor = await noPersistManager.getOrCreate('order-1', {
      input: { orderId: 'order-1', total: 100 },
    });
    expect(actor.getSnapshot().value).toBe('pending');
    const snapshot = await noPersistManager.send('order-1', { type: 'submit' });
    expect(snapshot.value).toBe('processing');
  });
});
