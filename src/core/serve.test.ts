import assert from "node:assert";
import type { AddressInfo } from "node:net";
import { after, before, describe, it } from "node:test";
import { createServeServer } from "./serve.ts";
import type { OutputMap } from "./types.ts";

function makeOutputMap(entries: Record<string, string>): OutputMap {
	const map: OutputMap = new Map();
	for (const [key, value] of Object.entries(entries)) {
		map.set(key, Buffer.from(value));
	}
	return map;
}

describe("createServeServer", () => {
	let baseUrl: string;
	let updateMap: (map: OutputMap) => void;
	let close: () => Promise<void>;

	before(() => {
		const outputMap = makeOutputMap({
			"index.html": "<h1>Home</h1>",
			"about/index.html": "<h1>About</h1>",
			"style.css": "body { color: red; }",
		});

		const result = createServeServer({ port: 0, outputMap });
		updateMap = result.updateMap;
		close = result.close;

		const addr = result.server.address() as AddressInfo;
		baseUrl = `http://localhost:${addr.port}`;
	});

	after(async () => {
		await close();
	});

	it("serves index.html at /", async () => {
		const res = await fetch(`${baseUrl}/`);
		assert.strictEqual(res.status, 200);
		assert.strictEqual(await res.text(), "<h1>Home</h1>");
		assert.strictEqual(res.headers.get("content-type"), "text/html");
	});

	it("serves about/index.html at /about/", async () => {
		const res = await fetch(`${baseUrl}/about/`);
		assert.strictEqual(res.status, 200);
		assert.strictEqual(await res.text(), "<h1>About</h1>");
		assert.strictEqual(res.headers.get("content-type"), "text/html");
	});

	it("resolves clean URL /about to about/index.html", async () => {
		const res = await fetch(`${baseUrl}/about`, { redirect: "manual" });
		assert.strictEqual(res.status, 200);
		assert.strictEqual(await res.text(), "<h1>About</h1>");
	});

	it("serves style.css with correct content-type", async () => {
		const res = await fetch(`${baseUrl}/style.css`);
		assert.strictEqual(res.status, 200);
		assert.strictEqual(await res.text(), "body { color: red; }");
		assert.strictEqual(res.headers.get("content-type"), "text/css");
	});

	it("returns 404 for nonexistent paths", async () => {
		const res = await fetch(`${baseUrl}/nonexistent`);
		assert.strictEqual(res.status, 404);
	});

	it("serves updated content after updateMap", async () => {
		const newMap = makeOutputMap({
			"index.html": "<h1>Updated Home</h1>",
		});

		updateMap(newMap);

		const res = await fetch(`${baseUrl}/`);
		assert.strictEqual(res.status, 200);
		assert.strictEqual(await res.text(), "<h1>Updated Home</h1>");

		const old = await fetch(`${baseUrl}/style.css`);
		assert.strictEqual(old.status, 404);
	});

	it("calls onRequest callback", async () => {
		const requests: Array<{ url: string; status: number }> = [];

		const map = makeOutputMap({ "index.html": "ok" });
		const result = createServeServer({
			port: 0,
			outputMap: map,
			onRequest(url: string, status: number) {
				requests.push({ url, status });
			},
		});

		const addr = result.server.address() as AddressInfo;
		await fetch(`http://localhost:${addr.port}/`);
		await fetch(`http://localhost:${addr.port}/missing`);
		await result.close();

		assert.strictEqual(requests.length, 2);
		assert.strictEqual(requests[0].url, "/");
		assert.strictEqual(requests[0].status, 200);
		assert.strictEqual(requests[1].url, "/missing");
		assert.strictEqual(requests[1].status, 404);
	});
});
