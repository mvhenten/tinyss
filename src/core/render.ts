import {
	copyFile,
	mkdir,
	mkdtemp,
	readFile,
	writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import nodePath from "node:path";
import { build as esbuild } from "esbuild";
import { micromark } from "micromark";
import { frontmatter, frontmatterHtml } from "micromark-extension-frontmatter";
import { gfm, gfmHtml } from "micromark-extension-gfm";
import { type VNode, h } from "preact";
import renderToString from "preact-render-to-string";
import BlogTemplate from "../templates/blog.ts";
import DefaultTemplate from "../templates/default.ts";
import DocsTemplate from "../templates/docs.ts";
import MarketingTemplate from "../templates/marketing.ts";
import PortfolioTemplate from "../templates/portfolio.ts";
import type { Page, PagesTree, PathNode, TemplateProps } from "./types.ts";

type TemplateComponent = (props: TemplateProps) => VNode;

const builtinTemplates: Record<string, TemplateComponent> = {
	default: DefaultTemplate,
	docs: DocsTemplate,
	blog: BlogTemplate,
	marketing: MarketingTemplate,
	portfolio: PortfolioTemplate,
};

const templateCache = new Map<string, TemplateComponent>();

const compileTemplate = async (
	templatePath: string,
): Promise<TemplateComponent> => {
	const tmpDir = await mkdtemp(nodePath.join(tmpdir(), "tinyss-tpl-"));
	const outFile = nodePath.join(tmpDir, "template.mjs");

	await esbuild({
		entryPoints: [nodePath.resolve(templatePath)],
		outfile: outFile,
		bundle: true,
		format: "esm",
		platform: "node",
		target: "node22",
		jsx: "automatic",
		jsxImportSource: "preact",
		logLevel: "silent",
	});

	const mod = (await import(outFile)) as { default: TemplateComponent };
	return mod.default;
};

const getTemplate = async (
	templateName = "default",
): Promise<TemplateComponent> => {
	if (templateName in builtinTemplates) {
		return builtinTemplates[templateName];
	}

	if (!templateCache.has(templateName)) {
		const resolved = nodePath.resolve(templateName);

		if (resolved.endsWith(".tsx") || resolved.endsWith(".ts")) {
			templateCache.set(templateName, await compileTemplate(resolved));
		} else {
			const mod = (await import(resolved)) as {
				default: TemplateComponent;
			};
			templateCache.set(templateName, mod.default);
		}
	}

	return templateCache.get(templateName) as TemplateComponent;
};

const renderFromTree = async (
	pagesTree: PagesTree | PathNode,
	parentConfig: Record<string, unknown> = {},
): Promise<void> => {
	if (!pagesTree.children) return;

	const config = { ...parentConfig, ...pagesTree.config };

	for (const page of pagesTree.children) {
		await renderPage(config, page);
		await renderFromTree(page, config);
	}
};

const renderPage = async (
	config: Record<string, unknown>,
	page: PathNode,
): Promise<void> => {
	if (!page.href) return;

	const { source, title, mime, href, info } = page;
	const outputTarget = nodePath.join(config.outputDir as string, href);

	if (mime === "text/markdown") {
		const data = await readFile(source);
		const templatePath =
			(info?.template as string | undefined) ??
			(config.template as string | undefined);

		const body = micromark(data, {
			extensions: [gfm(), frontmatter()],
			htmlExtensions: [gfmHtml(), frontmatterHtml()],
		});

		const Template = await getTemplate(templatePath);
		const html = renderToString(
			h(Template, {
				title: title ?? "",
				body,
				config,
				pages: (config._pages as Page[]) ?? [],
				templateRoot: nodePath.dirname(templatePath ?? ""),
			}),
		);

		await mkdir(nodePath.dirname(outputTarget), { recursive: true });
		await writeFile(outputTarget, `<!doctype html>\n${html}`);
	}

	if (mime === "application/javascript" || mime === "text/css") {
		await mkdir(nodePath.dirname(outputTarget), { recursive: true });
		await copyFile(source, outputTarget);
	}

	console.log(`${source} --> ${outputTarget}`);
};

export { renderFromTree };
