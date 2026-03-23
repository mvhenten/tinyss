import { parseArgs } from "node:util";
import { init } from "./commands/init.ts";
import { build } from "./core/build.ts";
import { loadConfig, mergeCliOverrides } from "./core/config.ts";
import { uniqueDirs, watchAndRebuild } from "./core/watch.ts";

const runInit = async (args: string[]): Promise<void> => {
	const { values } = parseArgs({
		args,
		allowPositionals: false,
		options: {
			outputDir: { type: "string", short: "o" },
			template: { type: "string", short: "t" },
		},
	});

	await init(values);
};

const runBuild = async (args: string[]): Promise<void> => {
	const { values, positionals: pages } = parseArgs({
		args,
		allowPositionals: true,
		options: {
			json: { type: "boolean", short: "j" },
			outputDir: { type: "string", short: "o" },
			watch: { type: "boolean", short: "w" },
		},
	});

	if (pages.length === 0) {
		console.error("No input files found.");
		process.exit(1);
	}

	const fileConfig = await loadConfig(process.cwd());
	const config = mergeCliOverrides(fileConfig, values);

	const runBuildOnce = async (): Promise<void> => {
		await build({ config, pages, plugins: [] });
	};

	await runBuildOnce();

	if (config.watch) {
		const dirs = uniqueDirs(pages);
		watchAndRebuild(dirs, runBuildOnce);
	}
};

const [subcommand, ...rest] = process.argv.slice(2);

if (subcommand === "init") {
	runInit(rest);
} else {
	runBuild(process.argv.slice(2));
}
