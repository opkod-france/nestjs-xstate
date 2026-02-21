import { setup } from 'xstate';

export const orderMachine = setup({
  types: {
    context: {} as { orderId: string; total: number },
    input: {} as { orderId: string; total: number },
    events: {} as
      | { type: 'submit' }
      | { type: 'complete' }
      | { type: 'fail'; reason: string },
  },
}).createMachine({
  id: 'order',
  initial: 'pending',
  context: ({ input }) => ({
    orderId: input.orderId,
    total: input.total,
  }),
  states: {
    pending: {
      on: {
        submit: { target: 'processing' },
      },
    },
    processing: {
      on: {
        complete: { target: 'completed' },
        fail: { target: 'failed' },
      },
    },
    completed: { type: 'final' },
    failed: { type: 'final' },
  },
});
