import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import nodePath from "node:path";
import Handlebars from "handlebars";
import { micromark } from "micromark";
import { frontmatter, frontmatterHtml } from "micromark-extension-frontmatter";
import { gfm, gfmHtml } from "micromark-extension-gfm";

const defaultTemplate = `<!doctype html>
<!--[if lt IE 7]> <html class="ie6 oldie" lang="en"> <![endif]-->
<!--[if IE 7]>    <html class="ie7 oldie" lang="en"> <![endif]-->
<!--[if IE 8]>    <html class="ie8 oldie" lang="en"> <![endif]-->
<!--[if gt IE 8]><!--> <html lang="en"> <!--<![endif]-->
<head>
    <meta charset="utf-8">
    <title>{{title}}</title>
    <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body>
{{{body}}}
</body>
</html>`;

/** @type { Map<string, unknown> } */
const templateCache = new Map();

/**
 * @param {string} templateName
 * @returns {Promise<Handlebars.TemplateDelegate>}
 */
const getTemplate = async (templateName = "default") => {
	if (!templateCache.has(templateName)) {
		const source =
			templateName === "default"
				? defaultTemplate
				: (await readFile(templateName)).toString();

		templateCache.set(templateName, Handlebars.compile(source));
	}

	return templateCache.get(templateName);
};

/**
 * @typedef {Object} PathNode
 * @property {string} source
 * @property {string} ext
 * @property {string} name
 * @property {string} dir
 * @property {string} mime
 * @property {PathNode[]} children
 */

/**
 * @typedef {Object} PagesTree
 * @property {PathNode[]} children
 * @property {Record<string, unknown>} config
 */

/**
 * @param {string} outputPath
 * @param {PagesTree} pagesTree
 */
const renderFromTree = async (pagesTree, parentConfig = {}) => {
	if (!pagesTree.children) return;

	const config = { ...pagesTree.config, ...parentConfig };

	for (const page of pagesTree.children) {
		await renderPage(config, page);
		await renderFromTree(page, config);
	}
};

/**
 * @param {string} outputPath
 * @param {Record<string, unknown>} config
 * @param {PathNode} page
 */
const renderPage = async (config, page) => {
	if (!page.href) return;

	const { source, title, mime, href, info } = page;
	const outputTarget = nodePath.join(config.outputDir, href);

	if (mime === "text/markdown") {
		const data = await readFile(source);
		const templatePath = info?.template ?? config.template;

		const body = micromark(data, {
			extensions: [gfm(), frontmatter()],
			htmlExtensions: [gfmHtml(), frontmatterHtml()],
		});

		const html = await getTemplate(templatePath);

		await mkdir(nodePath.dirname(outputTarget), { recursive: true });
		await writeFile(
			outputTarget,
			html({
				title,
				body,
				info,
				templateRoot: nodePath.dirname(templatePath ?? ""),
			}),
		);
	}

	if (mime === "application/javascript" || mime === "text/css") {
		await mkdir(nodePath.dirname(outputTarget), { recursive: true });
		await copyFile(source, outputTarget);
	}

	console.log(`${source} --> ${outputTarget}`);
};

export { renderFromTree };
