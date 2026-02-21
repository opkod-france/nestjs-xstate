import { Module, type DynamicModule, type Provider } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN,
  OPTIONS_TYPE,
  ASYNC_OPTIONS_TYPE,
} from './xstate.module-definition';
import type { XStateModuleOptions, MachineRegistration, ForFeatureOptions } from './interfaces/xstate-options.interface';
import { MachineRegistryService } from './services/machine-registry.service';
import { ActorManager } from './services/actor-manager.service';
import {
  XSTATE_PERSISTENCE,
  XSTATE_EVENT_EMITTER,
  getMachineToken,
  getActorFactoryToken,
} from './constants';

const eventEmitterProvider: Provider = {
  provide: XSTATE_EVENT_EMITTER,
  useFactory: (moduleRef: ModuleRef) => {
    try {
      return moduleRef.get('EventEmitter2', { strict: false });
    } catch {
      return undefined;
    }
  },
  inject: [ModuleRef],
};

function createMachineProviders(
  registrations: MachineRegistration[],
): Provider[] {
  const providers: Provider[] = [];

  for (const reg of registrations) {
    // Provider 1: the machine itself (optionally with implementations applied)
    const machineToken = getMachineToken(reg.name);
    if (reg.implementations) {
      providers.push({
        provide: machineToken,
        useFactory: (registry: MachineRegistryService, ...deps: any[]) => {
          const impls = reg.implementations!(...deps);
          const machine = reg.machine.provide(impls);
          registry.register(reg.name, machine);
          return machine;
        },
        inject: [MachineRegistryService, ...(reg.implementationDeps ?? [])],
      });
    } else {
      providers.push({
        provide: machineToken,
        useFactory: (registry: MachineRegistryService) => {
          registry.register(reg.name, reg.machine);
          return reg.machine;
        },
        inject: [MachineRegistryService],
      });
    }

    // Provider 2: ActorFactory for this machine
    providers.push({
      provide: getActorFactoryToken(reg.name),
      useFactory: (
        machine: any,
        persistence: any,
        eventEmitter: any,
      ) => {
        return new ActorManager(
          reg.name,
          machine,
          persistence ?? undefined,
          eventEmitter ?? undefined,
        );
      },
      inject: [
        machineToken,
        { token: XSTATE_PERSISTENCE, optional: true },
        { token: XSTATE_EVENT_EMITTER, optional: true },
      ],
    });
  }

  return providers;
}

@Module({})
class XStateFeatureModule {}

@Module({})
export class XStateModule extends ConfigurableModuleClass {
  static forRoot(options: typeof OPTIONS_TYPE): DynamicModule {
    const base = super.forRoot(options);
    const machineProviders = options.machines
      ? createMachineProviders(options.machines)
      : [];

    const persistenceProvider: Provider | undefined = options.persistence
      ? { provide: XSTATE_PERSISTENCE, useValue: options.persistence }
      : undefined;

    return {
      ...base,
      global: true,
      providers: [
        ...(base.providers ?? []),
        MachineRegistryService,
        eventEmitterProvider,
        ...(persistenceProvider ? [persistenceProvider] : []),
        ...machineProviders,
      ],
      exports: [
        ...(base.exports ?? []),
        MachineRegistryService,
        XSTATE_EVENT_EMITTER,
        ...(persistenceProvider ? [XSTATE_PERSISTENCE] : []),
        MODULE_OPTIONS_TOKEN,
        ...machineProviders.map((p) => (p as any).provide),
      ],
    };
  }

  static forRootAsync(options: typeof ASYNC_OPTIONS_TYPE): DynamicModule {
    const base = super.forRootAsync(options);

    return {
      ...base,
      global: true,
      providers: [
        ...(base.providers ?? []),
        MachineRegistryService,
        eventEmitterProvider,
        {
          provide: XSTATE_PERSISTENCE,
          useFactory: (moduleOptions: XStateModuleOptions) =>
            moduleOptions.persistence ?? undefined,
          inject: [MODULE_OPTIONS_TOKEN],
        },
      ],
      exports: [
        ...(base.exports ?? []),
        MachineRegistryService,
        XSTATE_EVENT_EMITTER,
        XSTATE_PERSISTENCE,
        MODULE_OPTIONS_TOKEN,
      ],
    };
  }

  static forFeature(
    machinesOrOptions: MachineRegistration[] | ForFeatureOptions,
  ): DynamicModule {
    const options = Array.isArray(machinesOrOptions)
      ? { machines: machinesOrOptions }
      : machinesOrOptions;
    const machineProviders = createMachineProviders(options.machines);

    return {
      module: XStateFeatureModule,
      imports: options.imports ?? [],
      providers: machineProviders,
      exports: machineProviders.map((p) => (p as any).provide),
    };
  }
}
