import assert from "node:assert";
import { mkdir, readdir, rm } from "node:fs/promises";
import test from "node:test";
import { createFixtures, makeTempDir } from "./create-fixtures.ts";
import { parseToTree } from "./parse.ts";
import { renderFromTree, renderToMap } from "./render.ts";

test("renderFromTree", async () => {
	const outputDir = await makeTempDir();
	await mkdir(outputDir, { recursive: true });

	const files = ["doc/index.md", "doc/child/about.md", "doc/contact.md"];

	const { paths, cleanup } = await createFixtures(files);
	const tree = await parseToTree(paths);

	await renderFromTree(tree, { outputDir });

	const list = await readdir(outputDir, { recursive: true });

	assert(list.length, 12);

	await cleanup();
	await rm(outputDir, { recursive: true });
});

test("renderToMap returns OutputMap with expected keys and content", async () => {
	const files = ["doc/index.md", "doc/child/about.md", "doc/contact.md"];

	const { paths, cleanup } = await createFixtures(files);
	const tree = await parseToTree(paths);

	const outputMap = await renderToMap(tree);

	assert(outputMap.size > 0, "OutputMap should not be empty");

	for (const [href, content] of outputMap) {
		assert.strictEqual(typeof href, "string", "Key should be a string");
		assert(Buffer.isBuffer(content), "Value should be a Buffer");
		assert(
			!href.startsWith("/"),
			`Key "${href}" should be a relative path, not absolute`,
		);
	}

	const keys = [...outputMap.keys()];
	const hasIndex = keys.some((k) => k.includes("index.html"));
	assert(hasIndex, "OutputMap should contain an index.html entry");

	for (const content of outputMap.values()) {
		const text = content.toString("utf-8");
		assert(
			text.startsWith("<!doctype html>"),
			"Markdown output should start with doctype",
		);
	}

	await cleanup();
});
