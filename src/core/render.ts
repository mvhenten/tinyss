import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
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
import type {
	OutputMap,
	Page,
	PagesTree,
	PathNode,
	TemplateProps,
} from "./types.ts";

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

const renderPageToBuffer = async (
	config: Record<string, unknown>,
	page: PathNode,
): Promise<{ href: string; content: Buffer } | undefined> => {
	if (!page.href) return undefined;

	const { source, title, mime, href, info } = page;

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

		return { href, content: Buffer.from(`<!doctype html>\n${html}`) };
	}

	if (mime === "application/javascript" || mime === "text/css") {
		const content = await readFile(source);
		return { href, content };
	}

	return undefined;
};

const findRootDir = (pagesTree: PagesTree | PathNode): string => {
	if (!pagesTree.children?.length) return "";
	const firstChild = pagesTree.children[0];
	return nodePath.dirname(firstChild.source);
};

const collectPages = async (
	pagesTree: PagesTree | PathNode,
	parentConfig: Record<string, unknown>,
	output: OutputMap,
	rootDir: string,
): Promise<void> => {
	if (!pagesTree.children) return;

	const config = { ...parentConfig, ...pagesTree.config };

	for (const page of pagesTree.children) {
		const result = await renderPageToBuffer(config, page);
		if (result) {
			const relativeHref = nodePath.relative(rootDir, result.href);
			output.set(relativeHref, result.content);
		}
		await collectPages(page, config, output, rootDir);
	}
};

const relativizePages = (pages: Page[], rootDir: string): Page[] =>
	pages.map((p) => ({
		...p,
		href: nodePath.relative(rootDir, p.href),
	}));

const renderToMap = async (
	pagesTree: PagesTree | PathNode,
	parentConfig: Record<string, unknown> = {},
): Promise<OutputMap> => {
	const output: OutputMap = new Map();
	const rootDir = findRootDir(pagesTree);
	const pages = (parentConfig._pages as Page[] | undefined) ?? [];
	const config = { ...parentConfig, _pages: relativizePages(pages, rootDir) };
	await collectPages(pagesTree, config, output, rootDir);
	return output;
};

const writeToDir = async (
	outputMap: OutputMap,
	outputDir: string,
): Promise<void> => {
	for (const [href, content] of outputMap) {
		const outputTarget = nodePath.join(outputDir, href);
		await mkdir(nodePath.dirname(outputTarget), { recursive: true });
		await writeFile(outputTarget, content);
	}
};

const renderFromTree = async (
	pagesTree: PagesTree | PathNode,
	parentConfig: Record<string, unknown> = {},
): Promise<void> => {
	const outputDir = parentConfig.outputDir as string;
	const output = await renderToMap(pagesTree, parentConfig);
	await writeToDir(output, outputDir);
};

export { renderFromTree, renderToMap, writeToDir };
