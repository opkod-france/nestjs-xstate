import type { Snapshot } from 'xstate';

export class TransitionEvent {
  constructor(
    public readonly machineName: string,
    public readonly entityId: string,
    public readonly snapshot: Snapshot<unknown>,
  ) {}
}
