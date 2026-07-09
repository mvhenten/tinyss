import { mkdir, writeFile } from "node:fs/promises";
import nodePath from "node:path";
import type { Plugin } from "../core/plugin.ts";
import type { Page } from "../core/types.ts";

function escapeXml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

function joinUrl(base: string, path: string): string {
	return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

function asString(value: unknown): string | undefined {
	return typeof value === "string" ? value : undefined;
}

function parsePageDate(value: unknown): Date | undefined {
	if (value instanceof Date) return value;

	const raw = asString(value);
	if (!raw) return undefined;

	const date = new Date(raw);
	if (Number.isNaN(date.getTime())) return undefined;

	return date;
}

interface DatedPage {
	page: Page;
	date: Date;
}

function toDatedPages(pages: Page[]): DatedPage[] {
	const dated: DatedPage[] = [];

	for (const page of pages) {
		const date = parsePageDate(page.extensions.date);
		if (!date) continue;
		dated.push({ page, date });
	}

	return dated.sort((a, b) => b.date.getTime() - a.date.getTime());
}

function buildItem({ page, date }: DatedPage, siteUrl: string): string {
	const url = joinUrl(siteUrl, page.href);
	const description = asString(page.extensions.excerpt) ?? "";

	return `    <item>
      <title>${escapeXml(page.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${date.toUTCString()}</pubDate>
      <description>${escapeXml(description)}</description>
    </item>`;
}

function buildFeed(
	datedPages: DatedPage[],
	title: string,
	description: string,
	siteUrl: string,
): string {
	const items = datedPages
		.map((datedPage) => buildItem(datedPage, siteUrl))
		.join("\n");
	const selfUrl = joinUrl(siteUrl, "feed.xml");
	const lastBuildDate = new Date().toUTCString();

	return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>${escapeXml(description)}</description>
    <atom:link href="${escapeXml(selfUrl)}" rel="self" type="application/rss+xml" />
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
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
			const datedPages = toDatedPages(ctx.pages);

			const feed = buildFeed(datedPages, title, description, siteUrl);
			const outPath = nodePath.join(ctx.outputDir, "feed.xml");

			await mkdir(nodePath.dirname(outPath), { recursive: true });
			await writeFile(outPath, feed);
			console.log("Generated feed.xml");
		},
	};
}
