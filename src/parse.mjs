import { readFile, stat } from "node:fs/promises";
import nodePath from "node:path";
import { fromMarkdown } from "mdast-util-from-markdown";
import { frontmatterFromMarkdown } from "mdast-util-frontmatter";
import { frontmatter } from "micromark-extension-frontmatter";
import { Mime } from "mime/lite";
import standardTypes from "mime/types/standard.js";
import toml from "toml";
import { parse as parseYaml } from "yaml";

const mimeLib = new Mime(standardTypes, {
	"application/handlebars": ["hbs", "handlebars"],
});

/**
 * @param {string} doc
 * @returns {Record<string, unknown>}
 */
const parseFrontMatter = (doc) => {
	const tree = fromMarkdown(doc, {
		extensions: [frontmatter(["yaml", "toml"])],
		mdastExtensions: [frontmatterFromMarkdown(["yaml", "toml"])],
	});

	const [firstChild] = tree.children;

	if (firstChild && firstChild.type === "yaml")
		return parseYaml(firstChild.value);

	if (firstChild && firstChild.type === "toml")
		return toml.parse(firstChild.value);

	return {};
};

/**
 *
 * @param {{source: string, mime: string}} param0
 * @returns {string}
 */
const mkTarget = ({ source, mime }) => {
	const { ext, name, dir } = nodePath.parse(source);
	const target = [dir];

	if (mime === "application/javascript" || mime === "text/css")
		return nodePath.join(...target, `${name}${ext}`);

	if (mime !== "text/markdown") return;
	if (name !== "index") target.push(name);
	return nodePath.join(...target, "index.html");
};

/**
 *
 * @param {{ source: string, mime: string }} param0
 * @returns {Promise<string>}
 */
const getConfig = async ({ source, mime }) => {
	const data = (await readFile(source)).toString();
	if (mime === "application/json") return JSON.parse(data);
	if (mime === "text/yaml") return parseYaml(data);
	if (mime === "application/toml") return toml.parse(data);
	if (mime === "text/markdown") return parseFrontMatter(data);
};

/**
 * @param {string} outputDir
 * @param {string[]} pages
 * @returns {PagesTree}
 */
export const parseToTree = async (pages) => {
	/** @type { Record<string, PathNode> } */
	const lookup = {};

	for (const source of pages) {
		const { name, dir } = nodePath.parse(source);
		const parent = lookup[dir] ?? { children: [], config: {} };
		const node = { source };

		if ((await stat(source)).isFile()) {
			const mime = mimeLib.getType(source);
			const config = await getConfig({ source, mime });
			node.href = mkTarget({ source, mime });
			node.mime = mime;
			node.title = config?.title ?? name;
		}

		if (/(yaml|json|toml)$/.test(node.mime))
			parent.config = { ...parent.config, ...(await getConfig(node)) };

		if (node.mime === "application/handlebars")
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
