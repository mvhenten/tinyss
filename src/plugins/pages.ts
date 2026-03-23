import type { Plugin } from "../core/plugin.ts";

export function pagesPlugin(): Plugin {
	return {
		name: "pages",
		afterParse(ctx) {
			for (const page of ctx.pages) {
				page.extensions.pages = ctx.pages;
			}
		},
	};
}
