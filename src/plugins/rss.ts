import { mkdir, writeFile } from "node:fs/promises";
import nodePath from "node:path";
import type { Plugin } from "../core/plugin.ts";
import type { Page } from "../core/types.ts";

function escapeXml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function buildItem(page: Page, siteUrl: string): string {
	const url = `${siteUrl}/${page.href}`;
	const excerpt = (page.extensions.excerpt as string) ?? "";

	return `    <item>
      <title>${escapeXml(page.title)}</title>
      <link>${escapeXml(url)}</link>
      <description>${escapeXml(excerpt)}</description>
    </item>`;
}

function buildFeed(
	pages: Page[],
	title: string,
	description: string,
	siteUrl: string,
): string {
	const items = pages.map((page) => buildItem(page, siteUrl)).join("\n");

	return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>${escapeXml(description)}</description>
${items}
  </channel>
</rss>`;
}

export function rssPlugin(): Plugin {
	return {
		name: "rss",
		async afterRender(ctx) {
			const siteUrl = ctx.config.siteUrl as string | undefined;
			if (!siteUrl) {
				console.warn("[rss] siteUrl not set in config, skipping feed.xml");
				return;
			}

			const title = (ctx.config.title as string) ?? "Untitled";
			const description = (ctx.config.description as string) ?? "";

			const feed = buildFeed(ctx.pages, title, description, siteUrl);
			const outPath = nodePath.join(ctx.outputDir, "feed.xml");

			await mkdir(nodePath.dirname(outPath), { recursive: true });
			await writeFile(outPath, feed);
			console.log("Generated feed.xml");
		},
	};
}
