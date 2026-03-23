import assert from "node:assert";
import test from "node:test";
import type { TinyssConfig } from "./config.ts";
import type { HookName, Plugin, PluginContext } from "./plugin.ts";
import { createPluginRunner } from "./plugin.ts";

const ALL_HOOKS: HookName[] = [
	"beforeParse",
	"afterParse",
	"beforeRender",
	"afterRender",
];

function makeContext(): PluginContext {
	return {
		config: {
			outputDir: "output",
			plugins: [],
			watch: false,
			json: false,
		} satisfies TinyssConfig,
		tree: { children: [], config: {} },
		outputDir: "/tmp/test",
	};
}

test("all hooks fire in correct order", async () => {
	const calls: string[] = [];

	const plugin: Plugin = {
		name: "test-plugin",
		beforeParse: () => {
			calls.push("beforeParse");
		},
		afterParse: () => {
			calls.push("afterParse");
		},
		beforeRender: () => {
			calls.push("beforeRender");
		},
		afterRender: () => {
			calls.push("afterRender");
		},
	};

	const runner = createPluginRunner([plugin]);
	const ctx = makeContext();

	for (const hook of ALL_HOOKS) {
		await runner.run(hook, ctx);
	}

	assert.deepStrictEqual(calls, ALL_HOOKS);
});

test("async hooks are awaited", async () => {
	const calls: string[] = [];

	const plugin: Plugin = {
		name: "async-plugin",
		beforeParse: async () => {
			await new Promise<void>((resolve) => setTimeout(resolve, 10));
			calls.push("async-done");
		},
	};

	const runner = createPluginRunner([plugin]);
	await runner.run("beforeParse", makeContext());

	assert.deepStrictEqual(calls, ["async-done"]);
});

test("plugin errors include plugin name", async () => {
	const plugin: Plugin = {
		name: "broken-plugin",
		afterParse: () => {
			throw new Error("something went wrong");
		},
	};

	const runner = createPluginRunner([plugin]);

	await assert.rejects(() => runner.run("afterParse", makeContext()), {
		message:
			'Plugin "broken-plugin" failed in afterParse: something went wrong',
	});
});

test("plugins with missing hooks are skipped gracefully", async () => {
	const calls: string[] = [];

	const plugin: Plugin = {
		name: "partial-plugin",
		afterRender: () => {
			calls.push("afterRender");
		},
	};

	const runner = createPluginRunner([plugin]);
	const ctx = makeContext();

	for (const hook of ALL_HOOKS) {
		await runner.run(hook, ctx);
	}

	assert.deepStrictEqual(calls, ["afterRender"]);
});

test("multiple plugins fire in array order", async () => {
	const calls: string[] = [];

	const pluginA: Plugin = {
		name: "plugin-a",
		beforeParse: () => {
			calls.push("a");
		},
	};

	const pluginB: Plugin = {
		name: "plugin-b",
		beforeParse: () => {
			calls.push("b");
		},
	};

	const pluginC: Plugin = {
		name: "plugin-c",
		beforeParse: () => {
			calls.push("c");
		},
	};

	const runner = createPluginRunner([pluginA, pluginB, pluginC]);
	await runner.run("beforeParse", makeContext());

	assert.deepStrictEqual(calls, ["a", "b", "c"]);
});
