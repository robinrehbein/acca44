import express from "express";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseOperation, safeResponse } from "./lib/proxy";
import { sessionHeaders, sameOrigin } from "./lib/session";
const app = express();
app.disable("x-powered-by");
if (process.env.TRUST_PROXY === "1") app.set("trust proxy", 1);
app.use(express.json({ limit: "16kb" }));
app.post("/api/shop", async (req, res) => {
  res.set("Cache-Control", "no-store");
  const origin = req.get("origin");
  if (
    !sameOrigin(
      origin,
      req.get("sec-fetch-site"),
      `${req.protocol}://${req.get("host")}`,
      process.env.PUBLIC_STOREFRONT_URL,
    )
  ) {
    res.status(403).json({ error: "Nicht erlaubt." });
    return;
  }
  try {
    const payload = parseOperation(req.body);
    const upstream = await fetch(
      process.env.VENDURE_SHOP_API_URL || "http://localhost:3001/shop-api",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...sessionHeaders(req.get("cookie")),
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000),
      },
    );
    const nextToken = upstream.headers.get("vendure-auth-token");
    if (nextToken)
      res.cookie("acca44-session", nextToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.COOKIE_SECURE === "true",
        path: "/",
        maxAge: 604800000,
      });
    res
      .status(upstream.ok ? 200 : 502)
      .json(safeResponse(await upstream.json()));
  } catch (error) {
    const invalid =
      error instanceof Error &&
      ["Invalid request", "Invalid variables", "Unknown operation"].includes(
        error.message,
      );
    res
      .status(invalid ? 400 : 502)
      .json({
        errors: [
          {
            message: invalid
              ? "Ungültige Anfrage."
              : "Der Shop ist vorübergehend nicht erreichbar.",
          },
        ],
      });
  }
});
const root = dirname(fileURLToPath(import.meta.url));
if (process.env.NODE_ENV !== "production" && process.env.VITE_DEV === "true") {
  const { createServer } = await import("vite");
  const vite = await createServer({
    root,
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(resolve(root, "dist")));
  app.get("/{*path}", (_req, res) =>
    res.sendFile(resolve(root, "dist/index.html")),
  );
}
app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => res.status(400).json({ errors: [{ message: "Ungültige Anfrage." }] }),
);
app.listen(Number(process.env.PORT || 3000), "0.0.0.0");
