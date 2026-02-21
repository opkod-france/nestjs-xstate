import { describe, it, expect, beforeEach } from 'vitest';
import { MachineRegistryService } from '../src/services/machine-registry.service';
import { orderMachine } from './fixtures/order.machine';

describe('MachineRegistryService', () => {
  let registry: MachineRegistryService;

  beforeEach(() => {
    registry = new MachineRegistryService();
  });

  it('should register and retrieve a machine', () => {
    registry.register('order', orderMachine);
    expect(registry.get('order')).toBe(orderMachine);
  });

  it('should report has() correctly', () => {
    expect(registry.has('order')).toBe(false);
    registry.register('order', orderMachine);
    expect(registry.has('order')).toBe(true);
  });

  it('should throw on duplicate registration', () => {
    registry.register('order', orderMachine);
    expect(() => registry.register('order', orderMachine)).toThrow(
      'Machine "order" is already registered',
    );
  });

  it('should throw when getting unregistered machine', () => {
    expect(() => registry.get('unknown')).toThrow(
      'Machine "unknown" not found',
    );
  });
});
