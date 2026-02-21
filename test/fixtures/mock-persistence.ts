import type { Snapshot } from 'xstate';
import { StateMachinePersistence } from '../../src';

export class MockPersistence extends StateMachinePersistence {
  readonly store = new Map<string, Snapshot<unknown>>();

  private key(machineName: string, entityId: string): string {
    return `${machineName}:${entityId}`;
  }

  async save(
    machineName: string,
    entityId: string,
    snapshot: Snapshot<unknown>,
  ): Promise<void> {
    this.store.set(this.key(machineName, entityId), snapshot);
  }

  async load(
    machineName: string,
    entityId: string,
  ): Promise<Snapshot<unknown> | undefined> {
    return this.store.get(this.key(machineName, entityId));
  }

  async delete(machineName: string, entityId: string): Promise<void> {
    this.store.delete(this.key(machineName, entityId));
  }
}
