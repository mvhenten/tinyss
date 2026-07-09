import assert from "node:assert";
import { readdir, rm } from "node:fs/promises";
import nodePath from "node:path";
import test from "node:test";
import { buildToMap } from "./build.ts";
import type { TinyssConfig } from "./config.ts";
import { createFixtures } from "./create-fixtures.ts";
import type { Plugin } from "./plugin.ts";
import type { Page } from "./types.ts";

const baseConfig: TinyssConfig = {
	outputDir: "",
	plugins: [],
	watch: false,
	json: false,
};

test("ctx.pages hrefs are relative to the pages root and match the written output paths", async () => {
	const { cleanup, base } = await createFixtures([
		"site/index.md",
		"site/posts/foo/index.md",
	]);

	const pagesRoot = nodePath.join(base, "site");
	const entries = await readdir(pagesRoot, { recursive: true });
	const pages = entries.map((entry) => nodePath.join(pagesRoot, entry));

	const outputDir = `${base}-out`;
	const config = { ...baseConfig, outputDir };

	const capturedPagesByHook: Record<string, Page[]> = {};
	const capturePlugin: Plugin = {
		name: "capture-pages",
		afterParse(ctx) {
			capturedPagesByHook.afterParse = ctx.pages;
		},
		beforeRender(ctx) {
			capturedPagesByHook.beforeRender = ctx.pages;
		},
		afterRender(ctx) {
			capturedPagesByHook.afterRender = ctx.pages;
		},
	};

	const outputMap = await buildToMap({
		config,
		pages,
		plugins: [capturePlugin],
	});

	for (const hook of ["afterParse", "beforeRender", "afterRender"]) {
		const capturedPages = capturedPagesByHook[hook];
		assert.strictEqual(
			capturedPages.length,
			2,
			`expected 2 pages captured in ${hook}`,
		);

		const hrefs = capturedPages.map((page) => page.href).sort();
		assert.deepStrictEqual(
			hrefs,
			["index.html", "posts/foo/index.html"],
			`hrefs captured in ${hook} should not retain the pages-root prefix`,
		);

		for (const page of capturedPages) {
			assert(
				outputMap.has(page.href),
				`href "${page.href}" captured in ${hook} should match a written output path`,
			);
		}
	}

	await cleanup();
	await rm(outputDir, { recursive: true, force: true });
});
