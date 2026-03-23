import assert from "node:assert";
import { createHash, randomBytes } from "node:crypto";
import { createServer, request } from "node:http";
import type { Socket } from "node:net";
import { after, describe, it } from "node:test";
import { type HmrServer, createHmrServer, injectHmrScript } from "./hmr.ts";

const WEBSOCKET_GUID = "258EAFA5-E914-47DA-95CA-A5AB53DC1758";

function connectWebSocket(
	port: number,
	path: string,
): Promise<{ socket: Socket; accept: string }> {
	const key = randomBytes(16).toString("base64");
	const expectedAccept = createHash("sha1")
		.update(`${key}${WEBSOCKET_GUID}`)
		.digest("base64");

	return new Promise((resolve, reject) => {
		const req = request({
			port,
			host: "localhost",
			path,
			headers: {
				Connection: "Upgrade",
				Upgrade: "websocket",
				"Sec-WebSocket-Key": key,
				"Sec-WebSocket-Version": "13",
			},
		});

		req.on("upgrade", (res, socket) => {
			const accept = res.headers["sec-websocket-accept"] ?? "";
			resolve({ socket, accept });
		});

		req.on("error", reject);
		req.end();
	});
}

function readFrame(socket: Socket): Promise<string> {
	return new Promise((resolve) => {
		socket.once("data", (data: Buffer) => {
			const payloadLength = data[1] & 0x7f;
			const payload = data.subarray(2, 2 + payloadLength);
			resolve(payload.toString("utf-8"));
		});
	});
}

describe("clientScript", () => {
	it("returns a script tag containing the port", () => {
		const hmr = createHmrServer();
		const script = hmr.clientScript(3000);

		assert.ok(script.includes("<script>"), "should contain <script> tag");
		assert.ok(
			script.includes("</script>"),
			"should contain closing </script> tag",
		);
		assert.ok(script.includes("3000"), "should contain the port number");
		assert.ok(script.includes("/__hmr"), "should contain the HMR path");
	});
});

describe("injectHmrScript", () => {
	it("injects script before </body>", () => {
		const html = Buffer.from("<html><body><p>hello</p></body></html>");
		const result = injectHmrScript(html, 4000);
		const output = result.toString("utf-8");

		assert.ok(output.includes("<script>"), "should contain injected script");
		assert.ok(output.includes("4000"), "should contain port number");

		const scriptIndex = output.indexOf("<script>");
		const bodyCloseIndex = output.indexOf("</body>");
		assert.ok(
			scriptIndex < bodyCloseIndex,
			"script should appear before </body>",
		);
	});

	it("appends script at end when no </body> found", () => {
		const html = Buffer.from("<html><p>hello</p></html>");
		const result = injectHmrScript(html, 5000);
		const output = result.toString("utf-8");

		assert.ok(output.includes("<script>"), "should contain injected script");
		assert.ok(output.endsWith("</script>"), "script should be at the end");
	});
});

describe("WebSocket handshake", () => {
	const cleanup: Array<() => void> = [];

	after(async () => {
		for (const fn of cleanup) {
			fn();
		}
		await new Promise((r) => setTimeout(r, 50));
	});

	function startServer(): Promise<{ port: number; hmr: HmrServer }> {
		const httpServer = createServer();
		const hmr = createHmrServer();
		hmr.attach(httpServer);

		cleanup.push(() => {
			hmr.close();
			httpServer.closeAllConnections();
			httpServer.close();
		});

		return new Promise((resolve) => {
			httpServer.listen(0, () => {
				const addr = httpServer.address();
				const port = typeof addr === "object" && addr !== null ? addr.port : 0;
				resolve({ port, hmr });
			});
		});
	}

	it("completes the WebSocket handshake on /__hmr", async () => {
		const { port } = await startServer();
		const { socket, accept } = await connectWebSocket(port, "/__hmr");
		socket.destroy();

		assert.ok(accept.length > 0, "should return Sec-WebSocket-Accept header");
	});

	it("validates the Sec-WebSocket-Accept value", async () => {
		const { port } = await startServer();
		const key = randomBytes(16).toString("base64");
		const expectedAccept = createHash("sha1")
			.update(`${key}${WEBSOCKET_GUID}`)
			.digest("base64");

		const { socket, accept } = await new Promise<{
			socket: Socket;
			accept: string;
		}>((resolve, reject) => {
			const req = request({
				port,
				host: "localhost",
				path: "/__hmr",
				headers: {
					Connection: "Upgrade",
					Upgrade: "websocket",
					"Sec-WebSocket-Key": key,
					"Sec-WebSocket-Version": "13",
				},
			});

			req.on("upgrade", (res, s) => {
				resolve({
					socket: s,
					accept: res.headers["sec-websocket-accept"] ?? "",
				});
			});

			req.on("error", reject);
			req.end();
		});

		socket.destroy();
		assert.strictEqual(
			accept,
			expectedAccept,
			"accept key should match RFC 6455 computation",
		);
	});

	it("receives broadcast messages", async () => {
		const { port, hmr } = await startServer();
		const { socket } = await connectWebSocket(port, "/__hmr");

		const framePromise = readFrame(socket);

		await new Promise((r) => setTimeout(r, 50));
		hmr.broadcast("reload");

		const data = await framePromise;
		socket.destroy();
		const parsed: unknown = JSON.parse(data);

		assert.ok(
			typeof parsed === "object" && parsed !== null,
			"should be an object",
		);
		assert.strictEqual(
			(parsed as Record<string, unknown>).type,
			"reload",
			"should receive reload message",
		);
	});
});
