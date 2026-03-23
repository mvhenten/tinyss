import { mkdir, writeFile } from "node:fs/promises";
import nodePath from "node:path";
import type { Plugin } from "../core/plugin.ts";

function escapeXml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

export function sitemapPlugin(): Plugin {
	return {
		name: "sitemap",
		async afterRender(ctx) {
			const siteUrl = ctx.config.siteUrl as string | undefined;
			if (!siteUrl) {
				console.warn(
					"[sitemap] siteUrl not set in config, skipping sitemap.xml",
				);
				return;
			}

			const urls = ctx.pages
				.map(
					(page) =>
						`  <url><loc>${escapeXml(`${siteUrl}/${page.href}`)}</loc></url>`,
				)
				.join("\n");

			const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

			const outPath = nodePath.join(ctx.outputDir, "sitemap.xml");
			await mkdir(nodePath.dirname(outPath), { recursive: true });
			await writeFile(outPath, sitemap);
			console.log("Generated sitemap.xml");
		},
	};
}
