import assert from "node:assert";
import test from "node:test";
import { createFile, createFixtures, makeTempDir } from "./create-fixtures.mjs";
import { parseToTree } from "./parse.mjs";

const clean = (obj) => JSON.parse(JSON.stringify(obj));

test("parseToTree returns a tree", async () => {
	const files = ["doc/index.md", "doc/child/about.md", "doc/contact.md"];

	const { paths, cleanup } = await createFixtures(files);
	const tree = await parseToTree(paths);

	assert(typeof tree === "object");
	assert(tree !== null);
	assert(tree.children.length);

	await cleanup();
});

test("parseToTree parsers recursive", async () => {
	const files = ["1/index.md", "1/2/index.md", "1/2/3/index.md"];
	const { paths, cleanup, base } = await createFixtures(files);
	const expect = {
		children: [
			{
				source: `${base}/1`,
				children: [
					{
						source: `${base}/1/2`,
						children: [
							{
								source: `${base}/1/2/3`,
								children: [
									{
										source: `${base}/1/2/3/index.md`,
										href: `${base}/1/2/3/index.html`,
										mime: "text/markdown",
										title: "index",
									},
								],
								config: {},
							},
							{
								source: `${base}/1/2/index.md`,
								href: `${base}/1/2/index.html`,
								mime: "text/markdown",
								title: "index",
							},
						],
						config: {},
					},
					{
						source: `${base}/1/index.md`,
						href: `${base}/1/index.html`,
						mime: "text/markdown",
						title: "index",
					},
				],
				config: {},
			},
		],
		config: {},
	};

	const tree = await parseToTree(paths);
	assert.deepStrictEqual(clean(tree), expect);
	await cleanup();
});

test("parseToTree detects config", async () => {
	const files = ["a/readme.md", "a/config.yaml"];
	const { paths, cleanup, base } = await createFixtures(files);

	const expect = {
		children: [
			{
				source: `${base}/a`,
				children: [
					{
						source: `${base}/a/config.yaml`,
						mime: "text/yaml",
						title: "test title",
					},
					{
						source: `${base}/a/readme.md`,
						href: `${base}/a/readme/index.html`,
						mime: "text/markdown",
						title: "readme",
					},
				],
				config: {
					key: "value",
					title: "test title",
				},
			},
		],
		config: {},
	};

	const tree = await parseToTree(paths);
	assert.deepStrictEqual(clean(tree), expect);

	await cleanup();
});

test("parseToTree detects templates", async () => {
	const files = ["a/readme.md", "a/template.hbs"];
	const { paths, cleanup, base } = await createFixtures(files);

	const expect = {
		children: [
			{
				source: `${base}/a`,
				children: [
					{
						source: `${base}/a/readme.md`,
						href: `${base}/a/readme/index.html`,
						mime: "text/markdown",
						title: "readme",
					},
					{
						source: `${base}/a/template.hbs`,
						mime: "application/handlebars",
						title: "template",
					},
				],
				config: {
					template: `${base}/a/template.hbs`,
				},
			},
		],
		config: {},
	};

	const tree = await parseToTree(paths);
	assert.deepStrictEqual(clean(tree), expect);

	await cleanup();
});

test("parseToTree detects frontmatter", async () => {
	const base = await makeTempDir();
	const file = await createFile(
		base,
		"test/index.md",
		"---\ntitle: a title\n---\n#markdown",
	);

	const expect = {
		children: [
			{
				source: `${base}/test/index.md`,
				href: `${base}/test/index.html`,
				mime: "text/markdown",
				title: "a title",
			},
		],
		config: {},
	};

	const tree = await parseToTree([file]);
	assert.deepStrictEqual(clean(tree), expect);
});

test("parseToTree conflicting paths", async () => {
	const files = ["a/b/index.md", "a/b.md"];
	const { paths, cleanup, base } = await createFixtures(files);

	await assert.rejects(async () => await parseToTree(paths), {
		message: /^Found conflicting target/,
	});

	await cleanup();
});
