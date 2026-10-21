/** Only this request's Vendure token is forwarded. Never cache session state globally. */
export function sessionHeaders(cookie?: string): Record<string, string> {
  const value = cookie
    ?.split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith("acca44-session="))
    ?.slice("acca44-session=".length);
  if (!value) return {};
  try {
    const token = decodeURIComponent(value);
    if (!token || /[\r\n]/.test(token)) return {};
    return { authorization: `Bearer ${token}` };
  } catch {
    return {};
  }
}
export function sameOrigin(
  origin: string | undefined,
  site: string | undefined,
  expected: string,
  publicUrl?: string,
) {
  return (
    site !== "cross-site" &&
    (!origin || origin === expected || origin === publicUrl)
  );
}
