import { rm } from "node:fs/promises";
import nodePath from "node:path";
import type { TinyssConfig } from "./config.ts";
import { parseToTree } from "./parse.ts";
import type { Plugin, PluginContext } from "./plugin.ts";
import { createPluginRunner } from "./plugin.ts";
import { renderFromTree } from "./render.ts";
import { flattenPages } from "./tree-utils.ts";

export interface BuildOptions {
	config: TinyssConfig;
	pages: string[];
	plugins: Plugin[];
}

export async function build(options: BuildOptions): Promise<void> {
	const { config, pages, plugins } = options;
	const outputDir = nodePath.resolve(config.outputDir);
	const runner = createPluginRunner(plugins);

	const ctx: PluginContext = {
		config,
		tree: { children: [], config: {} },
		pages: [],
		outputDir,
	};

	await runner.run("beforeParse", ctx);

	await rm(outputDir, { recursive: true, force: true });
	const tree = await parseToTree(pages);
	ctx.tree = tree;
	ctx.pages = flattenPages(tree);

	await runner.run("afterParse", ctx);

	if (config.json) {
		console.log(JSON.stringify(tree, null, 2));
		return;
	}

	await runner.run("beforeRender", ctx);

	await renderFromTree(tree, { ...config, outputDir, _pages: ctx.pages });

	await runner.run("afterRender", ctx);
}
