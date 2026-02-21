import { Inject, Injectable, OnModuleDestroy, Optional } from '@nestjs/common';
import {
  createActor,
  type AnyActorRef,
  type AnyStateMachine,
  type Snapshot,
} from 'xstate';
import type { ActorFactory } from '../interfaces/actor-factory.interface';
import { StateMachinePersistence } from '../interfaces/persistence.interface';
import { XSTATE_EVENT_EMITTER, XSTATE_PERSISTENCE } from '../constants';
import { TransitionEvent } from '../events/transition.event';
import { ActorStartedEvent } from '../events/actor-started.event';
import { ActorStoppedEvent } from '../events/actor-stopped.event';

@Injectable()
export class ActorManager implements ActorFactory, OnModuleDestroy {
  private readonly actors = new Map<string, AnyActorRef>();

  constructor(
    private readonly machineName: string,
    private readonly machine: AnyStateMachine,
    @Optional()
    @Inject(XSTATE_PERSISTENCE)
    private readonly persistence?: StateMachinePersistence,
    @Optional()
    @Inject(XSTATE_EVENT_EMITTER)
    private readonly eventEmitter?: any,
  ) {}

  async getOrCreate(
    entityId: string,
    options?: { input?: unknown },
  ): Promise<AnyActorRef> {
    const existing = this.actors.get(entityId);
    if (existing) return existing;

    // Try restoring from persistence
    let snapshot: Snapshot<unknown> | undefined;
    if (this.persistence) {
      snapshot = await this.persistence.load(this.machineName, entityId);
    }

    const actor = createActor(this.machine, {
      ...(snapshot ? { snapshot } : {}),
      ...(options?.input && !snapshot ? { input: options.input } : {}),
    });

    this.actors.set(entityId, actor);

    actor.subscribe((state) => {
      this.onTransition(entityId, state as Snapshot<unknown>);
    });

    actor.start();
    this.emit(new ActorStartedEvent(this.machineName, entityId));

    return actor;
  }

  async send(
    entityId: string,
    event: { type: string; [key: string]: unknown },
  ): Promise<Snapshot<unknown>> {
    const actor = await this.getOrCreate(entityId);
    actor.send(event);
    return actor.getSnapshot() as Snapshot<unknown>;
  }

  async getSnapshot(
    entityId: string,
  ): Promise<Snapshot<unknown> | undefined> {
    const actor = this.actors.get(entityId);
    if (actor) {
      return actor.getSnapshot() as Snapshot<unknown>;
    }
    if (this.persistence) {
      return this.persistence.load(this.machineName, entityId);
    }
    return undefined;
  }

  async stop(
    entityId: string,
    options?: { deletePersisted?: boolean },
  ): Promise<void> {
    const actor = this.actors.get(entityId);
    if (actor) {
      actor.stop();
      this.actors.delete(entityId);
      this.emit(new ActorStoppedEvent(this.machineName, entityId));
    }
    if (options?.deletePersisted && this.persistence) {
      await this.persistence.delete(this.machineName, entityId);
    }
  }

  async stopAll(): Promise<void> {
    for (const [entityId, actor] of this.actors) {
      actor.stop();
      this.emit(new ActorStoppedEvent(this.machineName, entityId));
    }
    this.actors.clear();
  }

  async onModuleDestroy(): Promise<void> {
    await this.stopAll();
  }

  private onTransition(entityId: string, snapshot: Snapshot<unknown>): void {
    if (this.persistence) {
      this.persistence
        .save(this.machineName, entityId, snapshot)
        .catch(() => {});
    }
    this.emit(new TransitionEvent(this.machineName, entityId, snapshot));
  }

  private emit(event: TransitionEvent | ActorStartedEvent | ActorStoppedEvent): void {
    if (this.eventEmitter) {
      const eventName = event.constructor.name;
      this.eventEmitter.emit(eventName, event);
    }
  }
}
