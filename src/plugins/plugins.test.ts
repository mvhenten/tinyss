import assert from "node:assert";
import { readFile, rm } from "node:fs/promises";
import test from "node:test";
import { build } from "../core/build.ts";
import type { TinyssConfig } from "../core/config.ts";
import { createFixtures } from "../core/create-fixtures.ts";
import { excerptsPlugin } from "./excerpts.ts";
import { pagesPlugin } from "./pages.ts";
import { rssPlugin } from "./rss.ts";
import { sitemapPlugin } from "./sitemap.ts";
import { tocPlugin } from "./toc.ts";

const baseConfig: TinyssConfig = {
	outputDir: "",
	plugins: [],
	watch: false,
	json: false,
};

test("pages plugin populates pages on all page extensions", async () => {
	const { paths, cleanup, base } = await createFixtures([
		"doc/index.md",
		"doc/about.md",
	]);

	const outputDir = `${base}-out`;
	const config = { ...baseConfig, outputDir };

	await build({ config, pages: paths, plugins: [pagesPlugin()] });

	await cleanup();
	await rm(outputDir, { recursive: true, force: true });
});

test("excerpts plugin extracts first paragraph", async () => {
	const { paths, cleanup, base } = await createFixtures(["doc/index.md"]);

	const outputDir = `${base}-out`;
	const config = { ...baseConfig, outputDir };

	const plugin = excerptsPlugin();
	await build({ config, pages: paths, plugins: [plugin] });

	await cleanup();
	await rm(outputDir, { recursive: true, force: true });
});

test("toc plugin extracts headings", async () => {
	const { paths, cleanup, base } = await createFixtures(["doc/index.md"]);

	const outputDir = `${base}-out`;
	const config = { ...baseConfig, outputDir };

	const plugin = tocPlugin();
	await build({ config, pages: paths, plugins: [plugin] });

	await cleanup();
	await rm(outputDir, { recursive: true, force: true });
});

test("rss plugin generates feed.xml when siteUrl is set", async () => {
	const { paths, cleanup, base } = await createFixtures([
		"doc/index.md",
		"doc/about.md",
	]);

	const outputDir = `${base}-out`;
	const config = { ...baseConfig, outputDir, siteUrl: "https://example.com" };

	await build({
		config,
		pages: paths,
		plugins: [excerptsPlugin(), rssPlugin()],
	});

	const feedPath = `${outputDir}/feed.xml`;
	const feed = await readFile(feedPath, "utf-8");

	assert.ok(feed.includes("<rss version"));
	assert.ok(feed.includes("https://example.com"));

	await cleanup();
	await rm(outputDir, { recursive: true, force: true });
});

test("rss plugin skips when siteUrl is not set", async () => {
	const { paths, cleanup, base } = await createFixtures(["doc/index.md"]);

	const outputDir = `${base}-out`;
	const config = { ...baseConfig, outputDir };

	await build({ config, pages: paths, plugins: [rssPlugin()] });

	await cleanup();
	await rm(outputDir, { recursive: true, force: true });
});

test("sitemap plugin generates sitemap.xml when siteUrl is set", async () => {
	const { paths, cleanup, base } = await createFixtures([
		"doc/index.md",
		"doc/about.md",
	]);

	const outputDir = `${base}-out`;
	const config = { ...baseConfig, outputDir, siteUrl: "https://example.com" };

	await build({ config, pages: paths, plugins: [sitemapPlugin()] });

	const sitemapPath = `${outputDir}/sitemap.xml`;
	const sitemap = await readFile(sitemapPath, "utf-8");

	assert.ok(sitemap.includes("<urlset"));
	assert.ok(sitemap.includes("https://example.com"));

	await cleanup();
	await rm(outputDir, { recursive: true, force: true });
});
