import assert from "node:assert";
import { readFile, readdir, rm, writeFile } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import nodePath from "node:path";
import test from "node:test";
import { init } from "./init.ts";

async function makeTempDir(): Promise<string> {
	return mkdtemp(nodePath.join(tmpdir(), "tinyss-init-"));
}

function withCwd(dir: string, fn: () => Promise<void>): Promise<void> {
	const original = process.cwd();
	process.chdir(dir);
	return fn().finally(() => process.chdir(original));
}

test("init creates config file with correct content", async () => {
	const tmpDir = await makeTempDir();

	await withCwd(tmpDir, async () => {
		await init({ outputDir: "dist", template: "blog" });

		const configRaw = await readFile("tinyss.config.json", "utf-8");
		const config = JSON.parse(configRaw);

		assert.strictEqual(config.outputDir, "dist");
		assert.strictEqual(config.template, "blog");
	});

	await rm(tmpDir, { recursive: true });
});

test("init config includes $schema reference", async () => {
	const tmpDir = await makeTempDir();

	await withCwd(tmpDir, async () => {
		await init({ outputDir: "output", template: "default" });

		const configRaw = await readFile("tinyss.config.json", "utf-8");
		const config = JSON.parse(configRaw);

		assert.strictEqual(
			config.$schema,
			"./node_modules/create-tinyss/schema/tinyss.config.schema.json",
		);
	});

	await rm(tmpDir, { recursive: true });
});

test("init creates index.md when directory has no markdown files", async () => {
	const tmpDir = await makeTempDir();

	await withCwd(tmpDir, async () => {
		await init({ outputDir: "output", template: "default" });

		const entries = await readdir(tmpDir);
		assert.ok(entries.includes("index.md"));

		const content = await readFile("index.md", "utf-8");
		assert.ok(content.includes("Welcome"));
	});

	await rm(tmpDir, { recursive: true });
});

test("init does not create index.md when markdown files exist", async () => {
	const tmpDir = await makeTempDir();

	await withCwd(tmpDir, async () => {
		await writeFile("existing.md", "# Existing");
		await init({ outputDir: "output", template: "default" });

		const entries = await readdir(tmpDir);
		assert.ok(!entries.includes("index.md"));
	});

	await rm(tmpDir, { recursive: true });
});

test("init refuses to overwrite existing config", async () => {
	const tmpDir = await makeTempDir();
	const originalExit = process.exit;
	let exitCode: number | null = null;

	await withCwd(tmpDir, async () => {
		process.exit = ((code: number) => {
			exitCode = code;
			throw new Error("process.exit called");
		}) as never;

		await writeFile("tinyss.config.json", "{}");

		await assert.rejects(
			() => init({ outputDir: "output", template: "default" }),
			{ message: "process.exit called" },
		);

		assert.strictEqual(exitCode, 1);
	});

	process.exit = originalExit;
	await rm(tmpDir, { recursive: true });
});
