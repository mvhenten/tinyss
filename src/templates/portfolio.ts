import { type VNode, h } from "preact";
import type { Page, TemplateProps } from "../core/types.ts";

function isIndexPage(page: Page): boolean {
	return page.source.endsWith("/index.md") || page.source === "index.md";
}

function isOverviewPage(title: string, pages: Page[]): boolean {
	const currentPage = pages.find((p) => p.title === title);
	if (!currentPage) return false;
	return isIndexPage(currentPage) || title.toLowerCase() === "index";
}

function ProjectCard(page: Page): VNode {
	const excerpt = (page.extensions.excerpt as string | undefined) ?? "";

	return h(
		"article",
		{ class: "project-card" },
		h(
			"div",
			{ class: "card-content" },
			h("h3", null, h("a", { href: `/${page.href}` }, page.title)),
			excerpt ? h("p", null, excerpt) : null,
			h("a", { href: `/${page.href}`, class: "view-project" }, "View project"),
		),
	);
}

const CSS = `
* { margin: 0; padding: 0; box-sizing: border-box; }

:root {
	--color-bg: #ffffff;
	--color-bg-alt: #fafafa;
	--color-text: #111111;
	--color-text-muted: #666666;
	--color-border: #e5e5e5;
	--color-accent: #111111;
	--color-accent-hover: #333333;
	--font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
	--font-mono: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
	--max-width: 1100px;
}

html { font-size: 16px; }
body {
	font-family: var(--font-sans);
	color: var(--color-text);
	background: var(--color-bg);
	line-height: 1.7;
}

header.site-header {
	padding: 2rem 2rem;
	max-width: var(--max-width);
	margin: 0 auto;
}

header.site-header h1 {
	font-size: 1.1rem;
	font-weight: 700;
	letter-spacing: 0.08em;
	text-transform: uppercase;
}

header.site-header nav {
	margin-top: 0.5rem;
}

header.site-header nav a {
	color: var(--color-text-muted);
	text-decoration: none;
	font-size: 0.875rem;
	margin-right: 1.5rem;
}

header.site-header nav a:hover {
	color: var(--color-text);
}

.overview {
	max-width: var(--max-width);
	margin: 0 auto;
	padding: 2rem 2rem 6rem;
}

.overview-header {
	padding: 3rem 0 4rem;
	border-bottom: 1px solid var(--color-border);
	margin-bottom: 3rem;
}

.overview-header h2 {
	font-size: 2.8rem;
	font-weight: 800;
	letter-spacing: -0.03em;
	line-height: 1.1;
	max-width: 600px;
}

.overview-header p {
	margin-top: 1rem;
	color: var(--color-text-muted);
	font-size: 1.1rem;
	max-width: 500px;
}

.projects-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
	gap: 2rem;
}

.project-card {
	border: 1px solid var(--color-border);
	border-radius: 8px;
	overflow: hidden;
	transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.project-card:hover {
	transform: translateY(-3px);
	box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
}

.card-content {
	padding: 1.75rem;
}

.card-content h3 {
	font-size: 1.25rem;
	margin-bottom: 0.5rem;
}

.card-content h3 a {
	color: var(--color-text);
	text-decoration: none;
}

.card-content h3 a:hover {
	text-decoration: underline;
	text-underline-offset: 3px;
}

.card-content p {
	color: var(--color-text-muted);
	font-size: 0.9rem;
	margin-bottom: 1rem;
	line-height: 1.5;
}

.view-project {
	display: inline-block;
	color: var(--color-text);
	font-size: 0.85rem;
	font-weight: 600;
	text-decoration: none;
	border-bottom: 2px solid var(--color-text);
	padding-bottom: 1px;
	transition: opacity 0.15s ease;
}

.view-project:hover {
	opacity: 0.6;
}

.project-detail {
	max-width: 860px;
	margin: 0 auto;
	padding: 2rem 2rem 6rem;
}

.project-detail .back-link {
	display: inline-block;
	color: var(--color-text-muted);
	font-size: 0.875rem;
	text-decoration: none;
	margin-bottom: 2rem;
}

.project-detail .back-link:hover { color: var(--color-text); }

.project-detail .back-link::before {
	content: "\\2190 ";
}

.project-detail h1 {
	font-size: 2.4rem;
	font-weight: 800;
	letter-spacing: -0.03em;
	line-height: 1.15;
	margin-bottom: 2rem;
	padding-bottom: 2rem;
	border-bottom: 1px solid var(--color-border);
}

.project-body h2 {
	font-size: 1.5rem;
	margin-top: 2.5rem;
	margin-bottom: 0.75rem;
}

.project-body h3 {
	font-size: 1.2rem;
	margin-top: 2rem;
	margin-bottom: 0.5rem;
}

.project-body p { margin-bottom: 1.25rem; }

.project-body ul, .project-body ol {
	margin-bottom: 1.25rem;
	padding-left: 1.5rem;
}

.project-body li { margin-bottom: 0.3rem; }

.project-body a {
	color: var(--color-text);
	text-decoration: underline;
	text-underline-offset: 2px;
}

.project-body img {
	max-width: 100%;
	height: auto;
	border-radius: 6px;
	margin: 1.5rem 0;
}

.project-body code {
	background: var(--color-bg-alt);
	padding: 0.15rem 0.4rem;
	border-radius: 3px;
	font-family: var(--font-mono);
	font-size: 0.85em;
}

.project-body pre {
	background: var(--color-text);
	color: var(--color-bg);
	padding: 1.25rem 1.5rem;
	border-radius: 8px;
	overflow-x: auto;
	margin-bottom: 1.5rem;
	line-height: 1.5;
}

.project-body pre code {
	background: none;
	padding: 0;
	color: inherit;
}

.project-body blockquote {
	border-left: 3px solid var(--color-border);
	padding: 0.5rem 1.25rem;
	margin: 0 0 1.25rem;
	color: var(--color-text-muted);
}

.image-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
	gap: 1rem;
	margin: 2rem 0;
}

.image-grid img {
	width: 100%;
	height: 200px;
	object-fit: cover;
	border-radius: 6px;
	margin: 0;
}

footer.site-footer {
	border-top: 1px solid var(--color-border);
	padding: 2rem;
	text-align: center;
	font-size: 0.825rem;
	color: var(--color-text-muted);
}

@media (max-width: 768px) {
	.overview-header h2 { font-size: 2rem; }
	.projects-grid { grid-template-columns: 1fr; }
	.project-detail h1 { font-size: 1.8rem; }
	.project-detail { padding: 1rem 1.25rem 4rem; }
	.overview { padding: 1rem 1.25rem 4rem; }
	header.site-header { padding: 1.5rem 1.25rem; }
}
`;

export default function PortfolioTemplate({
	title,
	body,
	config,
	pages,
}: TemplateProps): VNode {
	const siteTitle = (config.title as string | undefined) ?? "Portfolio";
	const overview = isOverviewPage(title, pages);
	const projects = pages.filter(
		(p) => p.mime === "text/markdown" && !isIndexPage(p),
	);

	const navPages = pages.filter((p) => p.mime === "text/markdown");

	return h(
		"html",
		{ lang: "en" },
		h(
			"head",
			null,
			h("meta", { charset: "utf-8" }),
			h("meta", {
				name: "viewport",
				content: "width=device-width,initial-scale=1",
			}),
			h("title", null, overview ? siteTitle : `${title} — ${siteTitle}`),
			h("style", null, CSS),
		),
		h(
			"body",
			null,
			h(
				"header",
				{ class: "site-header" },
				h("h1", null, siteTitle),
				h(
					"nav",
					null,
					...navPages.map((p) => h("a", { href: `/${p.href}` }, p.title)),
				),
			),
			overview
				? h(
						"div",
						{ class: "overview" },
						h(
							"div",
							{ class: "overview-header" },
							h("h2", null, title),
							body
								? h("div", {
										dangerouslySetInnerHTML: { __html: body },
									})
								: null,
						),
						h(
							"div",
							{ class: "projects-grid" },
							...projects.map((p) => ProjectCard(p)),
						),
					)
				: h(
						"div",
						{ class: "project-detail" },
						h("a", { href: "/", class: "back-link" }, "All projects"),
						h("h1", null, title),
						h("div", {
							class: "project-body",
							dangerouslySetInnerHTML: { __html: body },
						}),
					),
			h(
				"footer",
				{ class: "site-footer" },
				h("p", null, `\u00a9 ${new Date().getFullYear()} ${siteTitle}`),
			),
		),
	);
}
