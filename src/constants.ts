export const XSTATE_PERSISTENCE = 'XSTATE_PERSISTENCE';
export const XSTATE_EVENT_EMITTER = 'XSTATE_EVENT_EMITTER';

export function getMachineToken(name: string): string {
  return `XSTATE_MACHINE_${name}`;
}

export function getActorFactoryToken(name: string): string {
  return `XSTATE_ACTOR_FACTORY_${name}`;
}
