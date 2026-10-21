import { test } from "node:test";
import assert from "node:assert/strict";
import { parseOperation, safeResponse } from "../lib/proxy";
test("accepts only fixed operations, never browser GraphQL", () => {
  assert.throws(() => parseOperation({ operation: "__proto__" }));
  assert.throws(() =>
    parseOperation({ query: "mutation { deleteEverything }" }),
  );
  assert.throws(() => parseOperation({ operation: "add", variables: [] }));
  assert.match(parseOperation({ operation: "order" }).query, /activeOrder/);
});
test("filters upstream errors and extensions", () => {
  assert.deepEqual(
    safeResponse({
      errors: [{ message: "SQL secret", extensions: { stack: "secret" } }],
    }),
    {
      errors: [
        {
          message:
            "Die Anfrage konnte nicht verarbeitet werden. Bitte erneut versuchen.",
        },
      ],
    },
  );
});
import { sessionHeaders, sameOrigin } from "../lib/session";
test("sessions are isolated per incoming request, not shared with a new browser", () => {
  assert.deepEqual(sessionHeaders("acca44-session=alice"), {
    authorization: "Bearer alice",
  });
  assert.deepEqual(sessionHeaders("acca44-session=bob"), {
    authorization: "Bearer bob",
  });
  assert.deepEqual(sessionHeaders(), {});
  assert.deepEqual(sessionHeaders("other=alice"), {});
  assert.deepEqual(sessionHeaders("acca44-session=%0D%0A"), {});
  assert.deepEqual(sessionHeaders("acca44-session=%XX"), {});
});
test("cross-site requests rejected even when origin is absent", () => {
  assert.equal(sameOrigin(undefined, "cross-site", "https://shop.test"), false);
  assert.equal(
    sameOrigin("https://evil.test", "same-site", "https://shop.test"),
    false,
  );
  assert.equal(
    sameOrigin("https://shop.test", "same-origin", "https://shop.test"),
    true,
  );
});
