import assert from "node:assert";
import { createHash } from "node:crypto";
import { readFile, rm } from "node:fs/promises";
import nodePath from "node:path";
import test from "node:test";
import { build } from "../core/build.ts";
import type { TinyssConfig } from "../core/config.ts";
import { createFixtures } from "../core/create-fixtures.ts";
import { aiSummarizePlugin } from "./ai-summarize.ts";

const baseConfig: TinyssConfig = {
	outputDir: "",
	plugins: [],
	watch: false,
	json: false,
};

function ollamaResponse(result: Record<string, unknown>): string {
	return JSON.stringify({ response: JSON.stringify(result) });
}

test("ai-summarize plugin skips when Ollama is not available", async () => {
	const { paths, cleanup, base } = await createFixtures(["doc/index.md"]);
	const outputDir = `${base}-out`;
	const cacheDir = `${base}-cache`;
	const config = { ...baseConfig, outputDir };

	const originalFetch = globalThis.fetch;
	const mockFetch = test.mock.fn((): Promise<Response> => {
		return Promise.reject(new Error("Connection refused"));
	});
	globalThis.fetch = mockFetch as typeof globalThis.fetch;

	const plugin = aiSummarizePlugin({
		provider: "ollama",
		cacheDir,
	});

	await build({ config, pages: paths, plugins: [plugin] });

	globalThis.fetch = originalFetch;

	await cleanup();
	await rm(outputDir, { recursive: true, force: true });
	await rm(cacheDir, { recursive: true, force: true });
});

test("ai-summarize plugin uses cache on second run", async () => {
	const { paths, cleanup, base } = await createFixtures(["doc/index.md"]);
	const outputDir = `${base}-out`;
	const cacheDir = `${base}-cache`;
	const config = { ...baseConfig, outputDir };

	const originalFetch = globalThis.fetch;
	const mockFetch = test.mock.fn((): Promise<Response> => {
		return Promise.resolve(
			new Response(
				ollamaResponse({
					excerpt: "Test excerpt",
					summary: "Test summary",
					tags: ["test"],
				}),
				{ status: 200, headers: { "Content-Type": "application/json" } },
			),
		);
	});
	globalThis.fetch = mockFetch as typeof globalThis.fetch;

	const plugin = aiSummarizePlugin({
		provider: "ollama",
		cacheDir,
	});

	await build({ config, pages: paths, plugins: [plugin] });
	assert.strictEqual(mockFetch.mock.callCount(), 1);

	const outputDir2 = `${base}-out2`;
	const config2 = { ...baseConfig, outputDir: outputDir2 };
	await build({ config: config2, pages: paths, plugins: [plugin] });
	assert.strictEqual(mockFetch.mock.callCount(), 1);

	globalThis.fetch = originalFetch;

	await cleanup();
	await rm(outputDir, { recursive: true, force: true });
	await rm(outputDir2, { recursive: true, force: true });
	await rm(cacheDir, { recursive: true, force: true });
});

test("ai-summarize plugin cache misses when content changes", async () => {
	const { paths, cleanup, base } = await createFixtures(["doc/index.md"]);
	const outputDir = `${base}-out`;
	const cacheDir = `${base}-cache`;
	const config = { ...baseConfig, outputDir };

	const originalFetch = globalThis.fetch;
	const mockFetch = test.mock.fn((): Promise<Response> => {
		return Promise.resolve(
			new Response(
				ollamaResponse({
					excerpt: "Test excerpt",
					summary: "Test summary",
					tags: ["test"],
				}),
				{ status: 200, headers: { "Content-Type": "application/json" } },
			),
		);
	});
	globalThis.fetch = mockFetch as typeof globalThis.fetch;

	const plugin = aiSummarizePlugin({
		provider: "ollama",
		cacheDir,
	});

	await build({ config, pages: paths, plugins: [plugin] });
	assert.strictEqual(mockFetch.mock.callCount(), 1);

	const mdPath = paths.find((p) => p.endsWith(".md"));
	assert.ok(mdPath, "expected a .md fixture");

	const { writeFile } = await import("node:fs/promises");
	await writeFile(mdPath, "# Changed content\nThis is completely new.");

	const outputDir2 = `${base}-out2`;
	const config2 = { ...baseConfig, outputDir: outputDir2 };
	await build({ config: config2, pages: paths, plugins: [plugin] });
	assert.strictEqual(mockFetch.mock.callCount(), 2);

	globalThis.fetch = originalFetch;

	await cleanup();
	await rm(outputDir, { recursive: true, force: true });
	await rm(outputDir2, { recursive: true, force: true });
	await rm(cacheDir, { recursive: true, force: true });
});
