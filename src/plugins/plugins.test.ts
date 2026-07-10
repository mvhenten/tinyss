import assert from "node:assert";
import { readFile, readdir, rm, writeFile } from "node:fs/promises";
import nodePath from "node:path";
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

test("excerpts plugin cuts content at the more marker on its own line", async () => {
	const { paths, cleanup, base } = await createFixtures(["doc/index.md"]);
	const source = paths.find((path) => path.endsWith(".md")) as string;
	await writeFile(
		source,
		"Excerpt paragraph.\n\n<!-- more -->\n\nRest of the post.",
	);

	const outputDir = `${base}-out`;
	const config = { ...baseConfig, outputDir };
	const ctx = {
		config,
		tree: { children: [], config: {} },
		pages: [{ source, href: "", title: "", mime: "", extensions: {} }],
		outputDir,
	};

	await excerptsPlugin().afterParse?.(ctx);

	assert.strictEqual(ctx.pages[0].extensions.excerpt, "Excerpt paragraph.");

	await cleanup();
});

test("excerpts plugin cuts content at a mid-paragraph more marker", async () => {
	const { paths, cleanup, base } = await createFixtures(["doc/index.md"]);
	const source = paths.find((path) => path.endsWith(".md")) as string;
	await writeFile(source, "Excerpt text <!-- more --> hidden text.");

	const outputDir = `${base}-out`;
	const config = { ...baseConfig, outputDir };
	const ctx = {
		config,
		tree: { children: [], config: {} },
		pages: [{ source, href: "", title: "", mime: "", extensions: {} }],
		outputDir,
	};

	await excerptsPlugin().afterParse?.(ctx);

	assert.strictEqual(ctx.pages[0].extensions.excerpt, "Excerpt text");

	await cleanup();
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

test("sitemap plugin excludes the pages-root directory for nested pages", async () => {
	const { cleanup, base } = await createFixtures([
		"site/index.md",
		"site/posts/foo/index.md",
	]);

	const pagesRoot = nodePath.join(base, "site");
	const entries = await readdir(pagesRoot, { recursive: true });
	const paths = entries.map((entry) => nodePath.join(pagesRoot, entry));

	const outputDir = `${base}-out`;
	const config = { ...baseConfig, outputDir, siteUrl: "https://example.com" };

	await build({ config, pages: paths, plugins: [sitemapPlugin()] });

	const sitemapPath = `${outputDir}/sitemap.xml`;
	const sitemap = await readFile(sitemapPath, "utf-8");

	assert.ok(
		sitemap.includes("<loc>https://example.com/posts/foo/index.html</loc>"),
	);
	assert.ok(!sitemap.includes("/site/"));

	await cleanup();
	await rm(outputDir, { recursive: true, force: true });
});

test("config plugins array resolves plugins by name", async () => {
	const { paths, cleanup, base } = await createFixtures([
		"doc/index.md",
		"doc/about.md",
	]);

	const outputDir = `${base}-out`;
	const config = {
		...baseConfig,
		outputDir,
		plugins: ["excerpts", "rss"],
		siteUrl: "https://example.com",
	};

	await build({ config, pages: paths, plugins: [] });

	const feed = await readFile(`${outputDir}/feed.xml`, "utf-8");

	assert.ok(feed.includes("<rss version"));
	assert.ok(feed.includes("example"));

	await cleanup();
	await rm(outputDir, { recursive: true, force: true });
});

test("config plugins merge with template plugins without duplicates", async () => {
	const { paths, cleanup, base } = await createFixtures([
		"doc/index.md",
		"doc/about.md",
	]);

	const outputDir = `${base}-out`;
	const config = {
		...baseConfig,
		outputDir,
		template: "blog",
		plugins: ["excerpts", "rss"],
		siteUrl: "https://example.com",
	};

	await build({ config, pages: paths, plugins: [] });

	const feed = await readFile(`${outputDir}/feed.xml`, "utf-8");
	assert.ok(feed.includes("<rss version"));

	await cleanup();
	await rm(outputDir, { recursive: true, force: true });
});

test("unknown config plugin name fails fast", async () => {
	const { paths, cleanup, base } = await createFixtures(["doc/index.md"]);

	const outputDir = `${base}-out`;
	const config = { ...baseConfig, outputDir, plugins: ["nope"] };

	await assert.rejects(() => build({ config, pages: paths, plugins: [] }), {
		message: /^Unknown plugin "nope"/,
	});

	await cleanup();
	await rm(outputDir, { recursive: true, force: true });
});
