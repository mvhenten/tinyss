import { readFile } from "node:fs/promises";
import type { Plugin } from "../core/plugin.ts";

interface TocEntry {
	level: number;
	text: string;
	id: string;
}

function extractToc(content: string): TocEntry[] {
	const entries: TocEntry[] = [];
	const headingRegex = /^(#{1,6})\s+(.+)$/gm;

	let match = headingRegex.exec(content);
	while (match) {
		const level = match[1].length;
		const text = match[2].trim();
		const id = text
			.toLowerCase()
			.replace(/[^\w\s-]/g, "")
			.replace(/\s+/g, "-");

		entries.push({ level, text, id });
		match = headingRegex.exec(content);
	}

	return entries;
}

export function tocPlugin(): Plugin {
	return {
		name: "toc",
		async afterParse(ctx) {
			for (const page of ctx.pages) {
				const content = await readFile(page.source, "utf-8");
				page.extensions.toc = extractToc(content);
			}
		},
	};
}
