import assert from "node:assert";
import { readFile, rm } from "node:fs/promises";
import test from "node:test";
import { build } from "../core/build.ts";
import type { TinyssConfig } from "../core/config.ts";
import {
	createFile,
	createFixtures,
	makeTempDir,
} from "../core/create-fixtures.ts";
import { searchPlugin } from "./search.ts";

const baseConfig: TinyssConfig = {
	outputDir: "",
	plugins: [],
	watch: false,
	json: false,
};

test("search plugin generates search-index.json in output dir", async () => {
	const base = await makeTempDir();
	const outputDir = `${base}-out`;

	await createFile(
		base,
		"doc/index.md",
		"---\ntitle: Home Page\n---\n# Welcome\nThis is the home page with some content.",
	);
	await createFile(
		base,
		"doc/about.md",
		"---\ntitle: About Us\n---\n# About\nLearn more about our team and mission.",
	);

	const paths = [`${base}/doc/index.md`, `${base}/doc/about.md`];

	const config = { ...baseConfig, outputDir };
	await build({ config, pages: paths, plugins: [searchPlugin()] });

	const indexPath = `${outputDir}/search-index.json`;
	const content = await readFile(indexPath, "utf-8");
	assert.ok(content.length > 0);

	const parsed: unknown = JSON.parse(content);
	assert.ok(typeof parsed === "object" && parsed !== null);

	await rm(base, { recursive: true, force: true });
	await rm(outputDir, { recursive: true, force: true });
});

test("search plugin generates search.js in output dir", async () => {
	const { paths, cleanup, base } = await createFixtures([
		"doc/index.md",
		"doc/about.md",
	]);

	const outputDir = `${base}-out`;
	const config = { ...baseConfig, outputDir };
	await build({ config, pages: paths, plugins: [searchPlugin()] });

	const scriptPath = `${outputDir}/search.js`;
	const content = await readFile(scriptPath, "utf-8");
	assert.ok(content.includes("tinyss"));
	assert.ok(content.includes("search"));

	await cleanup();
	await rm(outputDir, { recursive: true, force: true });
});

test("index contains expected documents", async () => {
	const base = await makeTempDir();
	const outputDir = `${base}-out`;

	await createFile(
		base,
		"doc/index.md",
		"---\ntitle: Home Page\n---\n# Welcome\nThis is the home page.",
	);
	await createFile(
		base,
		"doc/about.md",
		"---\ntitle: About Us\n---\n# About\nLearn about us.",
	);

	const paths = [`${base}/doc/index.md`, `${base}/doc/about.md`];

	const config = { ...baseConfig, outputDir };
	await build({ config, pages: paths, plugins: [searchPlugin()] });

	const indexPath = `${outputDir}/search-index.json`;
	const raw = await readFile(indexPath, "utf-8");
	const parsed = JSON.parse(raw) as {
		docs: { href: string; title: string; excerpt: string }[];
		index: Record<string, [number, number][]>;
	};

	assert.strictEqual(parsed.docs.length, 2);

	const titles = parsed.docs.map((d) => d.title);
	assert.ok(titles.includes("Home Page"));
	assert.ok(titles.includes("About Us"));

	await rm(base, { recursive: true, force: true });
	await rm(outputDir, { recursive: true, force: true });
});

test("index contains expected terms from test content", async () => {
	const base = await makeTempDir();
	const outputDir = `${base}-out`;

	await createFile(
		base,
		"doc/index.md",
		"---\ntitle: Welcome\n---\n# Welcome\nSearch functionality works great.",
	);

	const paths = [`${base}/doc/index.md`];

	const config = { ...baseConfig, outputDir };
	await build({ config, pages: paths, plugins: [searchPlugin()] });

	const indexPath = `${outputDir}/search-index.json`;
	const raw = await readFile(indexPath, "utf-8");
	const parsed = JSON.parse(raw) as {
		docs: { href: string; title: string; excerpt: string }[];
		index: Record<string, [number, number][]>;
	};

	const terms = Object.keys(parsed.index);
	assert.ok(terms.includes("welcome"));
	assert.ok(terms.includes("search"));
	assert.ok(terms.includes("functionality"));

	assert.ok(!terms.includes("the"));
	assert.ok(!terms.includes("is"));

	await rm(base, { recursive: true, force: true });
	await rm(outputDir, { recursive: true, force: true });
});
