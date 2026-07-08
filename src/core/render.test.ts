import assert from "node:assert";
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import nodePath from "node:path";
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

test("renderToMap copies static assets verbatim to mirrored paths", async () => {
	const files = [
		"doc/index.md",
		"doc/posts/images/photo.png",
		"doc/fonts/body.woff2",
		"doc/script.js",
	];

	const { paths, cleanup, base } = await createFixtures(files);
	const imageBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a]);
	await writeFile(
		nodePath.join(base, "doc/posts/images/photo.png"),
		imageBytes,
	);

	const tree = await parseToTree(paths);
	const outputMap = await renderToMap(tree);

	assert.deepStrictEqual(
		outputMap.get("doc/posts/images/photo.png"),
		imageBytes,
	);
	assert(outputMap.has("doc/fonts/body.woff2"));
	assert(outputMap.has("doc/script.js"));

	await cleanup();
});

test("renderToMap consumes config files instead of copying them", async () => {
	const files = ["doc/index.md", "doc/config.yaml"];

	const { paths, cleanup } = await createFixtures(files);
	const tree = await parseToTree(paths);
	const outputMap = await renderToMap(tree);

	const keys = [...outputMap.keys()];
	assert(!keys.some((key) => key.endsWith("config.yaml")));
	assert(keys.some((key) => key.endsWith("index.html")));

	await cleanup();
});
