import assert from "node:assert";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import nodePath from "node:path";
import test from "node:test";
import { loadConfig, mergeCliOverrides } from "./config.ts";

async function makeTempDir(): Promise<string> {
	return mkdtemp(nodePath.join(tmpdir(), "tinyss-config-"));
}

test("loadConfig returns defaults when no config file exists", async () => {
	const dir = await makeTempDir();
	const config = await loadConfig(dir);

	assert.strictEqual(config.outputDir, "output");
	assert.strictEqual(config.watch, false);
	assert.strictEqual(config.json, false);
	assert.deepStrictEqual(config.plugins, []);
	assert.strictEqual(config.template, undefined);

	await rm(dir, { recursive: true });
});

test("loadConfig parses a valid config file", async () => {
	const dir = await makeTempDir();
	await writeFile(
		nodePath.join(dir, "tinyss.config.json"),
		JSON.stringify({
			outputDir: "dist",
			watch: true,
			plugins: ["my-plugin"],
		}),
	);

	const config = await loadConfig(dir);

	assert.strictEqual(config.outputDir, "dist");
	assert.strictEqual(config.watch, true);
	assert.deepStrictEqual(config.plugins, ["my-plugin"]);
	assert.strictEqual(config.json, false);

	await rm(dir, { recursive: true });
});

test("loadConfig throws on invalid config", async () => {
	const dir = await makeTempDir();
	await writeFile(
		nodePath.join(dir, "tinyss.config.json"),
		JSON.stringify({ outputDir: 42 }),
	);

	await assert.rejects(() => loadConfig(dir), {
		name: "ZodError",
	});

	await rm(dir, { recursive: true });
});

test("mergeCliOverrides applies CLI values over config", () => {
	const config = {
		outputDir: "output",
		plugins: [] as string[],
		watch: false,
		json: false,
		template: undefined,
	};

	const merged = mergeCliOverrides(config, {
		outputDir: "build",
		json: true,
	});

	assert.strictEqual(merged.outputDir, "build");
	assert.strictEqual(merged.json, true);
	assert.strictEqual(merged.watch, false);
});

test("mergeCliOverrides ignores undefined CLI values", () => {
	const config = {
		outputDir: "dist",
		plugins: [] as string[],
		watch: true,
		json: false,
		template: undefined,
	};

	const merged = mergeCliOverrides(config, {
		outputDir: undefined,
		json: undefined,
	});

	assert.strictEqual(merged.outputDir, "dist");
	assert.strictEqual(merged.watch, true);
});

test("default values are applied for missing fields", async () => {
	const dir = await makeTempDir();
	await writeFile(
		nodePath.join(dir, "tinyss.config.json"),
		JSON.stringify({ template: "custom.tsx" }),
	);

	const config = await loadConfig(dir);

	assert.strictEqual(config.outputDir, "output");
	assert.strictEqual(config.template, "custom.tsx");
	assert.strictEqual(config.watch, false);
	assert.strictEqual(config.json, false);
	assert.deepStrictEqual(config.plugins, []);

	await rm(dir, { recursive: true });
});
