export class ActorStoppedEvent {
  constructor(
    public readonly machineName: string,
    public readonly entityId: string,
  ) {}
}
