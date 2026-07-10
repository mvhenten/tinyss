import { readFile } from "node:fs/promises";
import { MORE_MARKER } from "../core/more-marker.ts";
import type { Plugin } from "../core/plugin.ts";

const FRONTMATTER_REGEX = /^---\n[\s\S]*?\n---\n/;

function stripFrontmatter(content: string): string {
	return content.replace(FRONTMATTER_REGEX, "");
}

function extractExcerpt(content: string): string {
	const body = stripFrontmatter(content);
	const moreIndex = body.indexOf(MORE_MARKER);
	if (moreIndex !== -1) {
		return body.slice(0, moreIndex).trim();
	}

	const lines = body.split("\n");
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
