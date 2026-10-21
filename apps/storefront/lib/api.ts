import type { Operation } from "./operations";
export function unwrapShopResponse(body: any, ok: boolean): any {
  if (body.errors?.length || !ok)
    throw new Error(
      body.errors?.[0]?.message || "Die Anfrage ist fehlgeschlagen.",
    );
  if (!body.data || Object.keys(body.data).length !== 1)
    throw new Error("Die Shop-Antwort ist unvollständig.");
  const result = Object.values(body.data)[0] as any;
  if (result?.errorCode)
    throw new Error(result.message || "Bitte Eingaben überprüfen.");
  return result;
}
export async function shop(
  operation: Operation,
  variables: Record<string, unknown> = {},
) {
  const response = await fetch("/api/shop", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ operation, variables }),
  });
  return unwrapShopResponse(await response.json(), response.ok);
}
