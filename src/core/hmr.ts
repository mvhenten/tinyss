import { createHash } from "node:crypto";
import type { IncomingMessage, Server } from "node:http";
import type { Duplex } from "node:stream";

const WEBSOCKET_GUID = "258EAFA5-E914-47DA-95CA-A5AB53DC1758";
const HMR_PATH = "/__hmr";

type HmrMessageType = "reload" | "css-update";

interface HmrServer {
	attach: (httpServer: Server) => void;
	broadcast: (type: HmrMessageType) => void;
	clientScript: (port: number) => string;
	close: () => void;
}

function encodeFrame(message: string): Buffer {
	const payload = Buffer.from(message);
	const frame = Buffer.alloc(2 + payload.length);
	frame[0] = 0x81;
	frame[1] = payload.length;
	payload.copy(frame, 2);
	return frame;
}

function computeAcceptKey(key: string): string {
	return createHash("sha1").update(`${key}${WEBSOCKET_GUID}`).digest("base64");
}

function hmrClientScript(port: number): string {
	return `<script>(function(){function connect(){var ws=new WebSocket('ws://localhost:${port}${HMR_PATH}');ws.onmessage=function(e){var msg=JSON.parse(e.data);if(msg.type==='reload')location.reload();if(msg.type==='css-update'){document.querySelectorAll('link[rel=stylesheet]').forEach(function(link){var url=new URL(link.href);url.searchParams.set('_hmr',Date.now());link.href=url.toString();})}};ws.onclose=function(){setTimeout(connect,1000)};}connect();})()</script>`;
}

function createHmrServer(): HmrServer {
	const clients = new Set<Duplex>();

	function handleUpgrade(req: IncomingMessage, socket: Duplex): void {
		const url = new URL(req.url ?? "/", "http://localhost");

		if (url.pathname !== HMR_PATH) {
			socket.destroy();
			return;
		}

		const key = req.headers["sec-websocket-key"];

		if (!key) {
			socket.destroy();
			return;
		}

		const acceptKey = computeAcceptKey(key);
		const headers = [
			"HTTP/1.1 101 Switching Protocols",
			"Upgrade: websocket",
			"Connection: Upgrade",
			`Sec-WebSocket-Accept: ${acceptKey}`,
			"\r\n",
		];

		socket.write(headers.join("\r\n"));
		clients.add(socket);

		socket.on("close", () => {
			clients.delete(socket);
		});

		socket.on("error", () => {
			clients.delete(socket);
		});
	}

	return {
		attach(httpServer: Server): void {
			httpServer.on("upgrade", handleUpgrade);
		},

		broadcast(type: HmrMessageType): void {
			const frame = encodeFrame(JSON.stringify({ type }));

			for (const socket of clients) {
				if (socket.writable) {
					socket.write(frame);
				}
			}
		},

		close(): void {
			for (const socket of clients) {
				socket.destroy();
			}
			clients.clear();
		},

		clientScript(port: number): string {
			return hmrClientScript(port);
		},
	};
}

function injectHmrScript(html: Buffer, port: number): Buffer {
	const script = hmrClientScript(port);
	const content = html.toString("utf-8");

	if (content.includes("</body>")) {
		return Buffer.from(content.replace("</body>", `${script}</body>`));
	}

	return Buffer.from(`${content}${script}`);
}

export { createHmrServer, hmrClientScript, injectHmrScript };
export type { HmrServer, HmrMessageType };
