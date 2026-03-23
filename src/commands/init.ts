import { access, readdir, writeFile } from "node:fs/promises";
import nodePath from "node:path";
import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";

const TEMPLATES = ["default", "docs", "blog", "marketing", "portfolio"];

const WELCOME_MARKDOWN = `---
title: Welcome
---

# Welcome to your tinyss site

This is your first page. Edit this file or add more \`.md\` files to build your site.

Run \`tinyss *.md\` to generate your site.
`;

const CONFIG_FILENAME = "tinyss.config.json";

interface InitOptions {
	outputDir?: string;
	template?: string;
}

const hasMarkdownFiles = async (cwd: string): Promise<boolean> => {
	const entries = await readdir(cwd);
	return entries.some((entry) => entry.endsWith(".md"));
};

const configExists = async (cwd: string): Promise<boolean> => {
	const configPath = nodePath.join(cwd, CONFIG_FILENAME);
	return access(configPath)
		.then(() => true)
		.catch(() => false);
};

const promptForOptions = async (
	options: InitOptions,
): Promise<{ outputDir: string; template: string }> => {
	if (options.outputDir && options.template) {
		return { outputDir: options.outputDir, template: options.template };
	}

	const rl = createInterface({ input: stdin, output: stdout });

	const outputDir =
		options.outputDir ||
		(await rl.question("Output directory [output]: ")) ||
		"output";

	const templatePrompt = `Template (${TEMPLATES.join("/")}) [default]: `;
	const templateAnswer =
		options.template || (await rl.question(templatePrompt)) || "default";

	const template = TEMPLATES.includes(templateAnswer)
		? templateAnswer
		: "default";

	rl.close();

	return { outputDir, template };
};

export const init = async (options: InitOptions = {}): Promise<void> => {
	const cwd = process.cwd();

	if (await configExists(cwd)) {
		console.error(
			`${CONFIG_FILENAME} already exists. Remove it first to re-initialize.`,
		);
		process.exit(1);
	}

	const { outputDir, template } = await promptForOptions(options);

	const config = {
		$schema: "./node_modules/create-tinyss/schema/tinyss.config.schema.json",
		outputDir,
		template,
	};

	const configPath = nodePath.join(cwd, CONFIG_FILENAME);
	await writeFile(configPath, `${JSON.stringify(config, null, "\t")}\n`);

	if (!(await hasMarkdownFiles(cwd))) {
		const indexPath = nodePath.join(cwd, "index.md");
		await writeFile(indexPath, WELCOME_MARKDOWN);
		console.log("Created index.md");
	}

	console.log(`Created ${CONFIG_FILENAME}`);
	console.log("");
	console.log("Next steps:");
	console.log("  1. Add or edit .md files in this directory");
	console.log(`  2. Run: tinyss *.md --outputDir ${outputDir}`);
};
