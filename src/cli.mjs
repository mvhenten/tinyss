import { rm } from "node:fs/promises";
import nodePath from "node:path";
import { parseArgs } from "node:util";
import { parseToTree } from "./parse.mjs";
import { renderFromTree } from "./render.mjs";

const run = async () => {
	const { values, positionals: pages } = parseArgs({
		allowPositionals: true,
		options: {
			outputDir: {
				default: nodePath.join(process.cwd(), "output"),
				type: "string",
				short: "o",
			},
		},
	});

	await rm(values.outputDir, { recursive: true, force: true });
	const tree = await parseToTree(pages);
	renderFromTree(tree, values);
};

run();
