import { readFile, stat } from "node:fs/promises";
import nodePath from "node:path";
import { fromMarkdown } from "mdast-util-from-markdown";
import { frontmatterFromMarkdown } from "mdast-util-frontmatter";
import { frontmatter } from "micromark-extension-frontmatter";
import { Mime } from "mime/lite";
import standardTypes from "mime/types/standard.js";
import toml from "toml";
import { parse as parseYaml } from "yaml";
import type { PagesTree, PathNode } from "./types.ts";

const mimeLib = new Mime(standardTypes, {
	"application/handlebars": ["hbs", "handlebars"],
	"application/x-tsx-template": ["tsx"],
});

const parseFrontMatter = (doc: string): Record<string, unknown> => {
	const tree = fromMarkdown(doc, {
		extensions: [frontmatter(["yaml", "toml"])],
		mdastExtensions: [frontmatterFromMarkdown(["yaml", "toml"])],
	});

	const [firstChild] = tree.children;

	if (firstChild && firstChild.type === "yaml")
		return parseYaml(firstChild.value) as Record<string, unknown>;

	if (firstChild && firstChild.type === "toml")
		return toml.parse(firstChild.value);

	return {};
};

const mkTarget = (
	source: string,
	mime: string,
	targets: Set<string>,
): string | undefined => {
	if (mime === "application/javascript" || mime === "text/css") return source;
	if (mime !== "text/markdown") return;

	const { name, dir } = nodePath.parse(source);

	const target =
		name === "index"
			? nodePath.join(dir, "index.html")
			: nodePath.join(dir, name, "index.html");

	if (targets.has(target))
		throw new Error(`Found conflicting target ${target} for path: ${source}`);

	targets.add(target);

	return target;
};

const getConfig = async (
	source: string,
	mime: string,
): Promise<Record<string, unknown> | undefined> => {
	const data = (await readFile(source)).toString();

	if (mime === "application/json")
		return JSON.parse(data) as Record<string, unknown>;
	if (mime === "text/yaml") return parseYaml(data) as Record<string, unknown>;
	if (mime === "application/toml")
		return toml.parse(data) as Record<string, unknown>;
	if (mime === "text/markdown") return parseFrontMatter(data);
};

export const parseToTree = async (pages: string[]): Promise<PagesTree> => {
	const targets = new Set<string>();
	const lookup: Record<string, PagesTree> = {};

	for (const source of pages) {
		const { dir } = nodePath.parse(source);
		const parent: PagesTree = lookup[dir] ?? { children: [], config: {} };
		const node: PathNode = { source, extensions: {} };

		if ((await stat(source)).isFile()) {
			const mime = mimeLib.getType(source) ?? "";
			const config = await getConfig(source, mime);

			node.href = mkTarget(source, mime, targets);
			node.mime = mime;
			node.title = (config?.title as string) ?? nodePath.parse(source).name;
		}

		if (node.mime && /(yaml|json|toml)$/.test(node.mime))
			parent.config = {
				...parent.config,
				...(await getConfig(node.source, node.mime)),
			};

		if (
			node.mime === "application/handlebars" ||
			node.mime === "application/x-tsx-template"
		)
			parent.config.template = node.source;

		parent.children.push(node);
		lookup[dir] = parent;
	}

	for (const parent of Object.values(lookup)) {
		for (const node of parent.children) {
			if (lookup[node.source]) {
				const { children, config } = lookup[node.source];
				node.children = children;
				node.config = config;
				delete lookup[node.source];
			}
		}
	}

	return lookup[Object.keys(lookup)[0]];
};
