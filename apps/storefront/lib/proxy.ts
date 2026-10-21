import { operations } from "./operations";
export function parseOperation(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body))
    throw new Error("Invalid request");
  const value = body as Record<string, unknown>;
  if (
    typeof value.operation !== "string" ||
    !Object.hasOwn(operations, value.operation)
  )
    throw new Error("Unknown operation");
  if (
    value.variables !== undefined &&
    (!value.variables ||
      typeof value.variables !== "object" ||
      Array.isArray(value.variables))
  )
    throw new Error("Invalid variables");
  return {
    query: operations[value.operation as keyof typeof operations],
    variables: value.variables ?? {},
  };
}
export function safeResponse(value: unknown) {
  if (!value || typeof value !== "object")
    return {
      errors: [{ message: "Der Shop ist vorübergehend nicht erreichbar." }],
    };
  const response = value as { data?: unknown; errors?: unknown[] };
  return {
    ...(response.data ? { data: response.data } : {}),
    ...(response.errors?.length
      ? {
          errors: [
            {
              message:
                "Die Anfrage konnte nicht verarbeitet werden. Bitte erneut versuchen.",
            },
          ],
        }
      : {}),
  };
}
