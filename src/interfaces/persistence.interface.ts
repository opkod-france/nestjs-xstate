import type { Snapshot } from 'xstate';

export abstract class StateMachinePersistence {
  abstract save(
    machineName: string,
    entityId: string,
    snapshot: Snapshot<unknown>,
  ): Promise<void>;

  abstract load(
    machineName: string,
    entityId: string,
  ): Promise<Snapshot<unknown> | undefined>;

  abstract delete(machineName: string, entityId: string): Promise<void>;
}
