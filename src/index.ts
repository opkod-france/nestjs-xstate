// Module
export { XStateModule } from './xstate.module';
export { MODULE_OPTIONS_TOKEN } from './xstate.module-definition';

// Interfaces
export type { XStateModuleOptions, MachineRegistration, ForFeatureOptions } from './interfaces/xstate-options.interface';
export { StateMachinePersistence } from './interfaces/persistence.interface';
export type { ActorFactory } from './interfaces/actor-factory.interface';

// Services
export { MachineRegistryService } from './services/machine-registry.service';
export { ActorManager } from './services/actor-manager.service';

// Decorators
export { InjectMachine } from './decorators/inject-machine.decorator';
export { InjectActorFactory } from './decorators/inject-actor-factory.decorator';

// Events
export { TransitionEvent } from './events/transition.event';
export { ActorStartedEvent } from './events/actor-started.event';
export { ActorStoppedEvent } from './events/actor-stopped.event';

// Constants
export {
  XSTATE_PERSISTENCE,
  XSTATE_EVENT_EMITTER,
  getMachineToken,
  getActorFactoryToken,
} from './constants';
