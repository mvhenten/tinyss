import assert from "node:assert";
import { mkdir, mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import test from "node:test";
import { createFixtures } from "./create-fixtures.mjs";
import { parseToTree } from "./parse.mjs";
import { renderFromTree } from "./render.mjs";

test("renderFromTree", async () => {
	const outputDir = await mkdtemp(tmpdir());
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
