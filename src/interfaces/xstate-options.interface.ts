import type { AnyStateMachine } from 'xstate';
import type { StateMachinePersistence } from './persistence.interface';

export interface MachineRegistration {
  name: string;
  machine: AnyStateMachine;
  implementations?: (...deps: any[]) => Record<string, any>;
  implementationDeps?: any[];
}

export interface ForFeatureOptions {
  machines: MachineRegistration[];
  imports?: any[];
}

export interface XStateModuleOptions {
  persistence?: StateMachinePersistence;
  machines?: MachineRegistration[];
}
