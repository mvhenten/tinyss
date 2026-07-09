import nodePath from "node:path";
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

export function findRootDir(pagesTree: PagesTree | PathNode): string {
	if (!pagesTree.children?.length) return "";
	const firstChild = pagesTree.children[0];
	return nodePath.dirname(firstChild.source);
}

export function relativizePages(pages: Page[], rootDir: string): Page[] {
	return pages.map((p) => ({
		...p,
		href: nodePath.relative(rootDir, p.href),
	}));
}
