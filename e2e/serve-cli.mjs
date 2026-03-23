import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname } from "node:path";

const MIME_TYPES = {
	".html": "text/html; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".js": "application/javascript; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".svg": "image/svg+xml",
	".png": "image/png",
	".jpg": "image/jpeg",
	".ico": "image/x-icon",
};

const [root, portStr] = process.argv.slice(2);

if (!root || !portStr) {
	console.error("Usage: node serve-cli.mjs <root> <port>");
	process.exit(1);
}

const port = Number.parseInt(portStr, 10);

const server = createServer(async (req, res) => {
	const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
	let filePath = join(root, decodeURIComponent(url.pathname));

	if (filePath.endsWith("/")) {
		filePath = join(filePath, "index.html");
	}

	if (!extname(filePath)) {
		filePath = join(filePath, "index.html");
	}

	try {
		const content = await readFile(filePath);
		res.writeHead(200, {
			"Content-Type": MIME_TYPES[extname(filePath)] ?? "application/octet-stream",
		});
		res.end(content);
	} catch {
		res.writeHead(404, { "Content-Type": "text/plain" });
		res.end("Not Found");
	}
});

server.listen(port, () => {
	console.log(`Serving ${root} on http://localhost:${port}`);
});
