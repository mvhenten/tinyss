import type { TinyssConfig } from "./config.ts";
import type { Page, PagesTree } from "./types.ts";

export interface PluginContext {
	config: TinyssConfig;
	tree: PagesTree;
	pages: Page[];
	outputDir: string;
}

export type HookName =
	| "beforeParse"
	| "afterParse"
	| "beforeRender"
	| "afterRender";

export interface Plugin {
	name: string;
	beforeParse?: (ctx: PluginContext) => Promise<void> | void;
	afterParse?: (ctx: PluginContext) => Promise<void> | void;
	beforeRender?: (ctx: PluginContext) => Promise<void> | void;
	afterRender?: (ctx: PluginContext) => Promise<void> | void;
}

export interface PluginRunner {
	run(hook: HookName, ctx: PluginContext): Promise<void>;
}

export function createPluginRunner(plugins: Plugin[]): PluginRunner {
	return {
		async run(hook: HookName, ctx: PluginContext): Promise<void> {
			for (const plugin of plugins) {
				const hookFn = plugin[hook];
				if (!hookFn) continue;

				try {
					await hookFn(ctx);
				} catch (err) {
					const message = err instanceof Error ? err.message : String(err);
					throw new Error(
						`Plugin "${plugin.name}" failed in ${hook}: ${message}`,
					);
				}
			}
		},
	};
}
