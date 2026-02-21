export class ActorStartedEvent {
  constructor(
    public readonly machineName: string,
    public readonly entityId: string,
  ) {}
}
