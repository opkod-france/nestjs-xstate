import { describe, it, expect } from 'vitest';
import { getMachineToken, getActorFactoryToken } from '../src/constants';

describe('Decorators / Token generation', () => {
  it('should generate machine token', () => {
    expect(getMachineToken('order')).toBe('XSTATE_MACHINE_order');
  });

  it('should generate actor factory token', () => {
    expect(getActorFactoryToken('order')).toBe('XSTATE_ACTOR_FACTORY_order');
  });

  it('should produce different tokens for different names', () => {
    expect(getMachineToken('order')).not.toBe(getMachineToken('payment'));
    expect(getActorFactoryToken('order')).not.toBe(
      getActorFactoryToken('payment'),
    );
  });
});
