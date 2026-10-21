import { test } from "node:test";
import assert from "node:assert/strict";
import { unwrapShopResponse } from "../lib/api";
test("checkout refuses Vendure error unions rather than displaying success", () => {
  assert.throws(
    () =>
      unwrapShopResponse(
        {
          data: {
            addPaymentToOrder: {
              errorCode: "PAYMENT_DECLINED_ERROR",
              message: "Demo-Zahlung abgelehnt.",
            },
          },
        },
        true,
      ),
    /abgelehnt/,
  );
  assert.throws(
    () =>
      unwrapShopResponse(
        {
          data: {
            transitionOrderToState: {
              errorCode: "ORDER_STATE_TRANSITION_ERROR",
              message: "Adresse fehlt.",
            },
          },
        },
        true,
      ),
    /Adresse fehlt/,
  );
});
test("checkout refuses transport and GraphQL failures", () => {
  assert.throws(
    () =>
      unwrapShopResponse({ errors: [{ message: "Nicht erreichbar." }] }, true),
    /Nicht erreichbar/,
  );
  assert.throws(() => unwrapShopResponse({}, false));
  assert.throws(() => unwrapShopResponse({}, true));
});
test("empty cart query remains valid and successful payment returns order", () => {
  assert.equal(unwrapShopResponse({ data: { activeOrder: null } }, true), null);
  assert.equal(
    unwrapShopResponse(
      { data: { addPaymentToOrder: { code: "DEMO123" } } },
      true,
    ).code,
    "DEMO123",
  );
});
