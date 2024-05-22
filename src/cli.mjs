import { rm } from "node:fs/promises";
import nodePath from "node:path";
import { parseArgs } from "node:util";
import { parseToTree } from "./parse.mjs";
import { renderFromTree } from "./render.mjs";

const run = async () => {
	const { values, positionals: pages } = parseArgs({
		allowPositionals: true,
		options: {
			json: {
				default: false,
				type: "boolean",
				short: "j",
			},
			outputDir: {
				default: nodePath.join(process.cwd(), "output"),
				type: "string",
				short: "o",
			},
		},
	});

	console.log("pages", pages);

	await rm(values.outputDir, { recursive: true, force: true });

	const tree = await parseToTree(pages, values);

	if (values.json) {
		console.log(JSON.stringify(tree, null, 2));
		return;
	}

	renderFromTree(tree, values);
};

run();
