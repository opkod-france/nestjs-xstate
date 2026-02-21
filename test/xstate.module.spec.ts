import { describe, it, expect } from 'vitest';
import { Test } from '@nestjs/testing';
import { Module } from '@nestjs/common';
import { XStateModule } from '../src/xstate.module';
import { MachineRegistryService } from '../src/services/machine-registry.service';
import { getActorFactoryToken, getMachineToken, XSTATE_PERSISTENCE } from '../src/constants';
import type { ActorFactory } from '../src/interfaces/actor-factory.interface';
import { orderMachine } from './fixtures/order.machine';
import { MockPersistence } from './fixtures/mock-persistence';

describe('XStateModule', () => {
  describe('forRoot', () => {
    it('should provide MachineRegistryService globally', async () => {
      const module = await Test.createTestingModule({
        imports: [XStateModule.forRoot({})],
      }).compile();

      const registry = module.get(MachineRegistryService);
      expect(registry).toBeInstanceOf(MachineRegistryService);
      await module.close();
    });

    it('should register machines passed to forRoot', async () => {
      const module = await Test.createTestingModule({
        imports: [
          XStateModule.forRoot({
            machines: [{ name: 'order', machine: orderMachine }],
          }),
        ],
      }).compile();

      const registry = module.get(MachineRegistryService);
      expect(registry.has('order')).toBe(true);
      await module.close();
    });

    it('should accept persistence option', async () => {
      const persistence = new MockPersistence();
      const module = await Test.createTestingModule({
        imports: [XStateModule.forRoot({ persistence })],
      }).compile();

      const resolved = module.get(XSTATE_PERSISTENCE);
      expect(resolved).toBe(persistence);
      await module.close();
    });
  });

  describe('forFeature', () => {
    it('should register machines and provide ActorFactory', async () => {
      const module = await Test.createTestingModule({
        imports: [
          XStateModule.forRoot({}),
          XStateModule.forFeature([
            { name: 'order', machine: orderMachine },
          ]),
        ],
      }).compile();

      const factory = module.get<ActorFactory>(
        getActorFactoryToken('order'),
      );
      expect(factory).toBeDefined();

      const machine = module.get(getMachineToken('order'));
      expect(machine).toBeDefined();

      await module.close();
    });

    it('should create working actors via ActorFactory', async () => {
      const module = await Test.createTestingModule({
        imports: [
          XStateModule.forRoot({}),
          XStateModule.forFeature([
            { name: 'order', machine: orderMachine },
          ]),
        ],
      }).compile();

      const factory = module.get<ActorFactory>(
        getActorFactoryToken('order'),
      );
      const actor = await factory.getOrCreate('order-1', {
        input: { orderId: 'order-1', total: 100 },
      });
      expect(actor.getSnapshot().value).toBe('pending');

      const snapshot = await factory.send('order-1', { type: 'submit' });
      expect(snapshot.value).toBe('processing');

      await module.close();
    });
  });

  describe('forRoot + forFeature with persistence', () => {
    it('should persist and restore actor state', async () => {
      const persistence = new MockPersistence();

      const module = await Test.createTestingModule({
        imports: [
          XStateModule.forRoot({ persistence }),
          XStateModule.forFeature([
            { name: 'order', machine: orderMachine },
          ]),
        ],
      }).compile();

      const factory = module.get<ActorFactory>(
        getActorFactoryToken('order'),
      );

      await factory.getOrCreate('order-1', {
        input: { orderId: 'order-1', total: 100 },
      });
      await factory.send('order-1', { type: 'submit' });

      // Wait for async persistence
      await new Promise((r) => setTimeout(r, 20));

      // Verify persisted
      const saved = await persistence.load('order', 'order-1');
      expect(saved).toBeDefined();

      await module.close();
    });
  });

  describe('forFeature with implementations', () => {
    it('should apply implementations to machine', async () => {
      @Module({
        providers: [{ provide: 'DISCOUNT', useValue: 0.1 }],
        exports: ['DISCOUNT'],
      })
      class DiscountModule {}

      const module = await Test.createTestingModule({
        imports: [
          XStateModule.forRoot({}),
          XStateModule.forFeature({
            machines: [
              {
                name: 'order',
                machine: orderMachine,
                implementations: (discount: number) => ({
                  guards: {
                    hasDiscount: () => discount > 0,
                  },
                }),
                implementationDeps: ['DISCOUNT'],
              },
            ],
            imports: [DiscountModule],
          }),
        ],
      }).compile();

      const machine = module.get(getMachineToken('order'));
      expect(machine).toBeDefined();

      await module.close();
    });
  });

  describe('forRootAsync', () => {
    it('should configure module asynchronously', async () => {
      const persistence = new MockPersistence();

      const module = await Test.createTestingModule({
        imports: [
          XStateModule.forRootAsync({
            useFactory: () => ({ persistence }),
          }),
          XStateModule.forFeature([
            { name: 'order', machine: orderMachine },
          ]),
        ],
      }).compile();

      const registry = module.get(MachineRegistryService);
      expect(registry).toBeDefined();
      expect(registry.has('order')).toBe(true);

      await module.close();
    });
  });
});
