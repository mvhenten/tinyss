import { rm } from "node:fs/promises";
import nodePath from "node:path";
import { excerptsPlugin, pagesPlugin, tocPlugin } from "../plugins/index.ts";
import type { TinyssConfig } from "./config.ts";
import { parseToTree } from "./parse.ts";
import type { Plugin, PluginContext } from "./plugin.ts";
import { createPluginRunner } from "./plugin.ts";
import { renderFromTree } from "./render.ts";
import { flattenPages } from "./tree-utils.ts";

const templatePlugins: Record<string, () => Plugin[]> = {
	docs: () => [pagesPlugin(), tocPlugin()],
	blog: () => [pagesPlugin(), excerptsPlugin()],
	marketing: () => [pagesPlugin()],
	portfolio: () => [pagesPlugin(), excerptsPlugin()],
};

function pluginsForTemplate(templateName: string): Plugin[] {
	const factory = templatePlugins[templateName];
	if (!factory) return [];
	return factory();
}

export interface BuildOptions {
	config: TinyssConfig;
	pages: string[];
	plugins: Plugin[];
}

export async function build(options: BuildOptions): Promise<void> {
	const { config, pages, plugins } = options;
	const outputDir = nodePath.resolve(config.outputDir);
	const userRunner = createPluginRunner(plugins);

	const ctx: PluginContext = {
		config,
		tree: { children: [], config: {} },
		pages: [],
		outputDir,
	};

	await userRunner.run("beforeParse", ctx);

	await rm(outputDir, { recursive: true, force: true });
	const tree = await parseToTree(pages);
	ctx.tree = tree;
	ctx.pages = flattenPages(tree);

	const templateName =
		(config.template as string | undefined) ??
		(tree.config.template as string | undefined) ??
		"default";
	const autoPlugins = pluginsForTemplate(templateName);
	const allPlugins = [...autoPlugins, ...plugins];
	const runner = createPluginRunner(allPlugins);

	await runner.run("afterParse", ctx);

	if (config.json) {
		console.log(JSON.stringify(tree, null, 2));
		return;
	}

	await runner.run("beforeRender", ctx);

	await renderFromTree(tree, { ...config, outputDir, _pages: ctx.pages });

	await runner.run("afterRender", ctx);
}
