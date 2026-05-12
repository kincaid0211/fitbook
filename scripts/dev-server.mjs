import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const port = Number(process.env.PORT || 5173);
const host = process.env.HOST || "127.0.0.1";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

async function handleApi(req, res) {
  const apiPath = new URL(req.url || "/", `http://${host}:${port}`).pathname;
  const fileName = `${apiPath.replace(/^\/api\//, "")}.js`;
  const filePath = path.join(root, "api", fileName);
  const mod = await import(`${pathToFileURL(filePath).href}?t=${Date.now()}`);
  await mod.default(req, res);
}

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const normalized = path.normalize(decoded === "/" ? "/index.html" : decoded);
  const filePath = path.join(root, normalized);
  if (!filePath.startsWith(root)) return path.join(root, "index.html");
  return filePath;
}

const server = http.createServer(async (req, res) => {
  try {
    if ((req.url || "").startsWith("/api/")) {
      await handleApi(req, res);
      return;
    }

    const filePath = safePath(req.url || "/");
    const ext = path.extname(filePath);
    const data = await fs.readFile(filePath);
    res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
    res.end(data);
  } catch {
    const data = await fs.readFile(path.join(root, "index.html"));
    res.writeHead(200, { "Content-Type": mimeTypes[".html"] });
    res.end(data);
  }
});

server.listen(port, host, () => {
  console.log(`非书 demo running at http://${host}:${port}`);
});
