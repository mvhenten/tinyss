import { createServer } from "node:http";
import type { Server } from "node:http";
import nodePath from "node:path";
import mime from "mime";
import { createHmrServer, injectHmrScript } from "./hmr.ts";
import type { OutputMap } from "./types.ts";
import { watchAndRebuild } from "./watch.ts";

interface ServeOptions {
	port: number;
	outputMap: OutputMap;
	onRequest?: (url: string, status: number) => void;
}

interface ServeResult {
	server: Server;
	updateMap: (map: OutputMap) => void;
	close: () => Promise<void>;
}

function resolveMapKey(urlPath: string): string {
	const stripped = urlPath.replace(/^\//, "");

	if (stripped === "" || stripped.endsWith("/")) {
		return `${stripped}index.html`;
	}

	const ext = nodePath.extname(stripped);
	if (!ext) {
		return `${stripped}/index.html`;
	}

	return stripped;
}

function createServeServer(options: ServeOptions): ServeResult {
	let outputMap = options.outputMap;

	const server = createServer((req, res) => {
		const url = new URL(req.url ?? "/", `http://localhost:${options.port}`);
		const key = resolveMapKey(url.pathname);
		const content = outputMap.get(key);

		if (!content) {
			res.writeHead(404, { "Content-Type": "text/plain" });
			res.end("Not Found");
			options.onRequest?.(url.pathname, 404);
			return;
		}

		const contentType = mime.getType(key) ?? "application/octet-stream";
		res.writeHead(200, { "Content-Type": contentType });
		res.end(content);
		options.onRequest?.(url.pathname, 200);
	});

	server.listen(options.port);

	return {
		server,
		updateMap(map: OutputMap): void {
			outputMap = map;
		},
		close(): Promise<void> {
			return new Promise((resolve, reject) => {
				server.close((err) => {
					if (err) {
						reject(err);
						return;
					}
					resolve();
				});
			});
		},
	};
}

interface ServeFullOptions {
	port: number;
	buildOnce: () => Promise<OutputMap>;
	watchDirs: string[];
}

interface ServeFullResult {
	close: () => void;
}

function injectHmrIntoMap(map: OutputMap, port: number): OutputMap {
	const result: OutputMap = new Map();
	for (const [key, value] of map) {
		if (key.endsWith(".html")) {
			result.set(key, injectHmrScript(value, port));
		} else {
			result.set(key, value);
		}
	}
	return result;
}

function detectChangeType(
	oldMap: OutputMap,
	newMap: OutputMap,
): "css-update" | "reload" {
	for (const [key, value] of newMap) {
		const oldValue = oldMap.get(key);
		if (!oldValue || !oldValue.equals(value)) {
			if (!key.endsWith(".css")) return "reload";
		}
	}
	for (const key of oldMap.keys()) {
		if (!newMap.has(key)) return "reload";
	}
	return "css-update";
}

async function serve(options: ServeFullOptions): Promise<ServeFullResult> {
	const { port, buildOnce, watchDirs } = options;

	let currentMap = await buildOnce();
	const injectedMap = injectHmrIntoMap(currentMap, port);

	const {
		server,
		updateMap,
		close: closeServer,
	} = createServeServer({
		port,
		outputMap: injectedMap,
		onRequest(url: string, status: number): void {
			console.log(`${status} ${url}`);
		},
	});

	const hmr = createHmrServer();
	hmr.attach(server);

	const stopWatcher = watchAndRebuild(watchDirs, async (): Promise<void> => {
		const newMap = await buildOnce();
		const changeType = detectChangeType(currentMap, newMap);
		currentMap = newMap;
		updateMap(injectHmrIntoMap(newMap, port));
		hmr.broadcast(changeType);
	});

	console.log(`Server running at http://localhost:${port}`);

	return {
		close(): void {
			stopWatcher();
			hmr.close();
			closeServer();
		},
	};
}

export { createServeServer, serve, injectHmrIntoMap, detectChangeType };
export type { ServeOptions, ServeResult, ServeFullOptions, ServeFullResult };
