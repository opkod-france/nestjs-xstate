import { Injectable } from '@nestjs/common';
import type { AnyStateMachine } from 'xstate';

@Injectable()
export class MachineRegistryService {
  private readonly machines = new Map<string, AnyStateMachine>();

  register(name: string, machine: AnyStateMachine): void {
    if (this.machines.has(name)) {
      throw new Error(`Machine "${name}" is already registered`);
    }
    this.machines.set(name, machine);
  }

  get(name: string): AnyStateMachine {
    const machine = this.machines.get(name);
    if (!machine) {
      throw new Error(
        `Machine "${name}" not found. Did you register it with XStateModule.forFeature()?`,
      );
    }
    return machine;
  }

  has(name: string): boolean {
    return this.machines.has(name);
  }
}
