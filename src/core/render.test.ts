import assert from "node:assert";
import { mkdir, readdir, rm } from "node:fs/promises";
import test from "node:test";
import { createFixtures, makeTempDir } from "./create-fixtures.ts";
import { parseToTree } from "./parse.ts";
import { renderFromTree } from "./render.ts";

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
