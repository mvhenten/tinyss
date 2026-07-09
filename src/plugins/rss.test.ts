import assert from "node:assert";
import { readFile, readdir, rm } from "node:fs/promises";
import nodePath from "node:path";
import test from "node:test";
import { build } from "../core/build.ts";
import type { TinyssConfig } from "../core/config.ts";
import { createFile, makeTempDir } from "../core/create-fixtures.ts";
import { excerptsPlugin } from "./excerpts.ts";
import { rssPlugin } from "./rss.ts";

const baseConfig: TinyssConfig = {
	outputDir: "",
	plugins: [],
	watch: false,
	json: false,
};

const RFC822_DATE =
	/^[A-Za-z]{3}, \d{2} [A-Za-z]{3} \d{4} \d{2}:\d{2}:\d{2} GMT$/;

test("rss plugin only includes pages with a date, sorted newest first", async () => {
	const base = await makeTempDir();
	const outputDir = `${base}-out`;

	await createFile(
		base,
		"doc/oldest.md",
		'---\ntitle: Oldest\ndate: "2024-01-01"\n---\nOldest post.',
	);
	await createFile(
		base,
		"doc/newest.md",
		'---\ntitle: Newest\ndate: "2024-06-01"\n---\nNewest post.',
	);
	await createFile(
		base,
		"doc/undated.md",
		"---\ntitle: Undated\n---\nNo date.",
	);

	const paths = [
		`${base}/doc/oldest.md`,
		`${base}/doc/newest.md`,
		`${base}/doc/undated.md`,
	];

	const config = { ...baseConfig, outputDir, siteUrl: "https://example.com" };
	await build({ config, pages: paths, plugins: [rssPlugin()] });

	const feed = await readFile(`${outputDir}/feed.xml`, "utf-8");

	assert.ok(!feed.includes("Undated"));
	assert.ok(feed.indexOf("Newest") < feed.indexOf("Oldest"));

	await rm(base, { recursive: true, force: true });
	await rm(outputDir, { recursive: true, force: true });
});

test("rss plugin emits RFC 822 pubDate and permalink guid", async () => {
	const base = await makeTempDir();
	const outputDir = `${base}-out`;

	await createFile(
		base,
		"doc/post.md",
		'---\ntitle: Post\ndate: "2024-03-15"\n---\nBody.',
	);

	const paths = [`${base}/doc/post.md`];

	const config = { ...baseConfig, outputDir, siteUrl: "https://example.com/" };
	await build({ config, pages: paths, plugins: [rssPlugin()] });

	const feed = await readFile(`${outputDir}/feed.xml`, "utf-8");

	const pubDateMatch = feed.match(/<pubDate>(.+)<\/pubDate>/);
	assert.ok(pubDateMatch);
	assert.match(pubDateMatch[1], RFC822_DATE);

	const lastBuildDateMatch = feed.match(/<lastBuildDate>(.+)<\/lastBuildDate>/);
	assert.ok(lastBuildDateMatch);
	assert.match(lastBuildDateMatch[1], RFC822_DATE);

	assert.match(
		feed,
		/<guid isPermaLink="true">https:\/\/example\.com\/post\/index\.html<\/guid>/,
	);
	assert.ok(!feed.includes("example.com//"));

	await rm(base, { recursive: true, force: true });
	await rm(outputDir, { recursive: true, force: true });
});

test("rss plugin escapes XML special characters", async () => {
	const base = await makeTempDir();
	const outputDir = `${base}-out`;

	const frontmatter = [
		"---",
		"title: 'Tom & Jerry''s <\"Cat\">'",
		'date: "2024-03-15"',
		"---",
		"Body.",
	].join("\n");

	await createFile(base, "doc/post.md", frontmatter);

	const paths = [`${base}/doc/post.md`];

	const config = { ...baseConfig, outputDir, siteUrl: "https://example.com" };
	await build({ config, pages: paths, plugins: [rssPlugin()] });

	const feed = await readFile(`${outputDir}/feed.xml`, "utf-8");

	assert.ok(feed.includes("Tom &amp; Jerry&apos;s &lt;&quot;Cat&quot;&gt;"));
	assert.ok(!feed.includes('<"Cat">'));

	await rm(base, { recursive: true, force: true });
	await rm(outputDir, { recursive: true, force: true });
});

test("rss plugin includes excerpt as item description", async () => {
	const base = await makeTempDir();
	const outputDir = `${base}-out`;

	await createFile(
		base,
		"doc/post.md",
		'---\ntitle: Post\ndate: "2024-03-15"\n---\nThis is the excerpt text.\n\n<!-- more -->\n\nMore content below.',
	);

	const paths = [`${base}/doc/post.md`];

	const config = { ...baseConfig, outputDir, siteUrl: "https://example.com" };
	await build({
		config,
		pages: paths,
		plugins: [excerptsPlugin(), rssPlugin()],
	});

	const feed = await readFile(`${outputDir}/feed.xml`, "utf-8");
	assert.ok(
		feed.includes("<description>This is the excerpt text.</description>"),
	);

	await rm(base, { recursive: true, force: true });
	await rm(outputDir, { recursive: true, force: true });
});

test("rss plugin link and guid exclude the pages-root directory for nested pages", async () => {
	const base = await makeTempDir();
	const outputDir = `${base}-out`;

	await createFile(
		base,
		"site/index.md",
		'---\ntitle: Home\ndate: "2024-01-01"\n---\nHome.',
	);
	await createFile(
		base,
		"site/posts/foo/index.md",
		'---\ntitle: Foo\ndate: "2024-03-15"\n---\nFoo post.',
	);

	const pagesRoot = `${base}/site`;
	const entries = await readdir(pagesRoot, { recursive: true });
	const paths = entries.map((entry) => nodePath.join(pagesRoot, entry));

	const config = { ...baseConfig, outputDir, siteUrl: "https://example.com" };
	await build({ config, pages: paths, plugins: [rssPlugin()] });

	const feed = await readFile(`${outputDir}/feed.xml`, "utf-8");

	assert.ok(
		feed.includes(
			'<guid isPermaLink="true">https://example.com/posts/foo/index.html</guid>',
		),
	);
	assert.ok(!feed.includes("/site/"));

	await rm(base, { recursive: true, force: true });
	await rm(outputDir, { recursive: true, force: true });
});

test("rss plugin includes atom self link and channel metadata", async () => {
	const base = await makeTempDir();
	const outputDir = `${base}-out`;

	await createFile(
		base,
		"doc/post.md",
		'---\ntitle: Post\ndate: "2024-03-15"\n---\nBody.',
	);

	const paths = [`${base}/doc/post.md`];

	const config = { ...baseConfig, outputDir, siteUrl: "https://example.com" };
	await build({ config, pages: paths, plugins: [rssPlugin()] });

	const feed = await readFile(`${outputDir}/feed.xml`, "utf-8");

	assert.ok(feed.includes('xmlns:atom="http://www.w3.org/2005/Atom"'));
	assert.ok(
		feed.includes(
			'<atom:link href="https://example.com/feed.xml" rel="self" type="application/rss+xml" />',
		),
	);

	await rm(base, { recursive: true, force: true });
	await rm(outputDir, { recursive: true, force: true });
});
