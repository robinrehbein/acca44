import { LanguageCode, PaymentMethodHandler } from '@vendure/core';

/** Local simulation only. No funds are collected and no external gateway is contacted. */
export const demoPaymentHandler = new PaymentMethodHandler({
    code: 'demo-payment',
    description: [{ languageCode: LanguageCode.de, value: 'Demo-Zahlung (Simulation, keine Belastung)' }],
    args: {},
    createPayment: async (_ctx, order, amount) => ({
        amount, state: 'Settled', transactionId: `DEMO-${order.code}`,
        metadata: { simulated: true, public: { message: 'Demo-Zahlung – keine echte Belastung' } },
    }),
    settlePayment: async () => ({ success: true }),
    createRefund: async (_ctx, input, amount) => ({ state: 'Settled', transactionId: `DEMO-REFUND-${input.paymentId}`, metadata: { simulated: true }, }),
});
