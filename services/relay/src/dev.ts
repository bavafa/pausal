// Local relay on http://localhost:8787 with the keys from the repo's .env. Usage: pnpm --filter @pausal/relay dev
import { createServer } from "node:http";
import { join } from "node:path";

process.loadEnvFile(join(import.meta.dirname, "../../../.env"));
process.env.RELAY_SALT ??= "local-dev";
const { handle } = await import("./handler.ts");

createServer(async (req, res) => {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  const body = chunks.length ? Buffer.concat(chunks) : undefined;
  const headers = new Headers(Object.entries(req.headers).flatMap(([k, v]) => (typeof v === "string" ? [[k, v] as [string, string]] : [])));
  const r = await handle(new Request(`http://localhost:8787${req.url}`, { method: req.method ?? "GET", headers, ...(body && req.method !== "GET" ? { body: new Uint8Array(body) } : {}) }));
  res.writeHead(r.status, Object.fromEntries(r.headers));
  res.end(Buffer.from(await r.arrayBuffer()));
}).listen(8787, () => console.log("relay: http://localhost:8787"));
