import { readFile } from "node:fs/promises";
import type { Plugin } from "../core/plugin.ts";

const MORE_MARKER = "<!-- more -->";

function extractExcerpt(content: string): string {
	const moreIndex = content.indexOf(MORE_MARKER);
	if (moreIndex !== -1) {
		return content.slice(0, moreIndex).trim();
	}

	const lines = content.split("\n");
	const paragraphs: string[] = [];
	let current = "";

	for (const line of lines) {
		if (line.startsWith("#") || line.startsWith("---")) continue;

		if (line.trim() === "") {
			if (current.trim()) {
				paragraphs.push(current.trim());
				if (paragraphs.length === 1) break;
			}
			current = "";
		} else {
			current += ` ${line}`;
		}
	}

	if (current.trim() && paragraphs.length === 0) {
		paragraphs.push(current.trim());
	}

	return paragraphs[0] ?? "";
}

export function excerptsPlugin(): Plugin {
	return {
		name: "excerpts",
		async afterParse(ctx) {
			for (const page of ctx.pages) {
				const content = await readFile(page.source, "utf-8");
				page.extensions.excerpt = extractExcerpt(content);
			}
		},
	};
}
