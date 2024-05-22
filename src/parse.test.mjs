import assert from "node:assert";
import test from "node:test";
import { createFixtures } from "./create-fixtures.mjs";
import { parseToTree } from "./parse.mjs";

test("parseToTree", async () => {
	const files = ["doc/index.md", "doc/child/about.md", "doc/contact.md"];

	const { paths, cleanup } = await createFixtures(files);
	const tree = await parseToTree(paths);

	assert(tree);
	await cleanup();
});
