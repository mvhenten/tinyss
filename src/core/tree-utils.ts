import type { Page, PagesTree, PathNode } from "./types.ts";

export function flattenPages(tree: PagesTree): Page[] {
	const pages: Page[] = [];
	collectPages(tree.children, pages);
	return pages;
}

function collectPages(nodes: PathNode[], pages: Page[]): void {
	for (const node of nodes) {
		if (node.href && node.mime === "text/markdown") {
			pages.push({
				source: node.source,
				href: node.href,
				title: node.title ?? "",
				mime: node.mime,
				extensions: node.extensions,
			});
		}
		if (node.children) {
			collectPages(node.children, pages);
		}
	}
}
