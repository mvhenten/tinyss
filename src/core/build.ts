import { mkdir, rm } from "node:fs/promises";
import nodePath from "node:path";
import {
	excerptsPlugin,
	pagesPlugin,
	rssPlugin,
	searchPlugin,
	sitemapPlugin,
	tocPlugin,
} from "../plugins/index.ts";
import type { TinyssConfig } from "./config.ts";
import { parseToTree } from "./parse.ts";
import type { Plugin, PluginContext } from "./plugin.ts";
import { createPluginRunner } from "./plugin.ts";
import { renderToMap, writeToDir } from "./render.ts";
import { findRootDir, flattenPages, relativizePages } from "./tree-utils.ts";
import type { OutputMap } from "./types.ts";

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

const pluginRegistry: Record<string, () => Plugin> = {
	pages: pagesPlugin,
	excerpts: excerptsPlugin,
	toc: tocPlugin,
	rss: rssPlugin,
	sitemap: sitemapPlugin,
	search: searchPlugin,
};

function resolveConfigPlugins(names: string[]): Plugin[] {
	return names.map((name) => {
		const factory = pluginRegistry[name];
		if (!factory) {
			throw new Error(
				`Unknown plugin "${name}". Available plugins: ${Object.keys(
					pluginRegistry,
				).join(", ")}`,
			);
		}
		return factory();
	});
}

function mergeNamedPlugins(base: Plugin[], extra: Plugin[]): Plugin[] {
	const names = new Set(base.map((plugin) => plugin.name));
	const added = extra.filter((plugin) => !names.has(plugin.name));
	return [...base, ...added];
}

export interface BuildOptions {
	config: TinyssConfig;
	pages: string[];
	plugins: Plugin[];
}

export async function buildToMap(options: BuildOptions): Promise<OutputMap> {
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

	const tree = await parseToTree(pages);
	ctx.tree = tree;
	ctx.pages = relativizePages(flattenPages(tree), findRootDir(tree));

	const templateName =
		(config.template as string | undefined) ??
		(tree.config.template as string | undefined) ??
		"default";
	const autoPlugins = pluginsForTemplate(templateName);
	const configPlugins = resolveConfigPlugins(config.plugins);
	const allPlugins = [
		...mergeNamedPlugins(autoPlugins, configPlugins),
		...plugins,
	];
	const runner = createPluginRunner(allPlugins);

	await runner.run("afterParse", ctx);

	if (config.json) {
		console.log(JSON.stringify(tree, null, 2));
		return new Map();
	}

	await runner.run("beforeRender", ctx);

	const outputMap = await renderToMap(tree, { ...config, _pages: ctx.pages });

	await runner.run("afterRender", ctx);

	return outputMap;
}

export async function build(options: BuildOptions): Promise<void> {
	const outputDir = nodePath.resolve(options.config.outputDir);
	await rm(outputDir, { recursive: true, force: true });
	await mkdir(outputDir, { recursive: true });
	const outputMap = await buildToMap(options);
	await writeToDir(outputMap, outputDir);
}
