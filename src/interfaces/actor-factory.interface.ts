import type { AnyActorRef, Snapshot } from 'xstate';

export interface ActorFactory {
  getOrCreate(
    entityId: string,
    options?: { input?: unknown },
  ): Promise<AnyActorRef>;

  send(
    entityId: string,
    event: { type: string; [key: string]: unknown },
  ): Promise<Snapshot<unknown>>;

  getSnapshot(entityId: string): Promise<Snapshot<unknown> | undefined>;

  stop(
    entityId: string,
    options?: { deletePersisted?: boolean },
  ): Promise<void>;

  stopAll(): Promise<void>;
}
