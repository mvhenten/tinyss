import { type VNode, h } from "preact";
import type { Page, TemplateProps } from "../core/types.ts";

interface TocEntry {
	level: number;
	text: string;
	id: string;
}

function NavItem(page: Page, currentTitle: string): VNode {
	const isActive = page.title === currentTitle;
	return h(
		"li",
		{ class: isActive ? "nav-item active" : "nav-item" },
		h("a", { href: `/${page.href}` }, page.title),
	);
}

function TableOfContents(entries: TocEntry[]): VNode {
	return h(
		"aside",
		{ class: "toc" },
		h("h3", null, "On this page"),
		h(
			"ul",
			null,
			...entries.map((entry) =>
				h(
					"li",
					{ class: `toc-level-${entry.level}` },
					h("a", { href: `#${entry.id}` }, entry.text),
				),
			),
		),
	);
}

const CSS = `
* { margin: 0; padding: 0; box-sizing: border-box; }

:root {
	--sidebar-width: 260px;
	--toc-width: 220px;
	--content-max: 780px;
	--color-bg: #ffffff;
	--color-sidebar-bg: #f8f9fa;
	--color-border: #e2e6ea;
	--color-text: #1a1a2e;
	--color-text-muted: #6c757d;
	--color-link: #2563eb;
	--color-link-hover: #1d4ed8;
	--color-active-bg: #eff6ff;
	--color-active-border: #2563eb;
	--color-code-bg: #f1f3f5;
	--font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
	--font-mono: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
}

html { font-size: 16px; }
body {
	font-family: var(--font-sans);
	color: var(--color-text);
	background: var(--color-bg);
	line-height: 1.7;
	display: flex;
	min-height: 100vh;
}

nav.sidebar {
	position: fixed;
	top: 0;
	left: 0;
	bottom: 0;
	width: var(--sidebar-width);
	background: var(--color-sidebar-bg);
	border-right: 1px solid var(--color-border);
	padding: 2rem 0;
	overflow-y: auto;
	z-index: 10;
}

nav.sidebar .site-title {
	padding: 0 1.5rem 1.5rem;
	font-size: 1.1rem;
	font-weight: 700;
	color: var(--color-text);
	border-bottom: 1px solid var(--color-border);
	margin-bottom: 1rem;
}

nav.sidebar ul { list-style: none; }

nav.sidebar .nav-item a {
	display: block;
	padding: 0.45rem 1.5rem;
	color: var(--color-text-muted);
	text-decoration: none;
	font-size: 0.9rem;
	border-left: 3px solid transparent;
	transition: all 0.15s ease;
}

nav.sidebar .nav-item a:hover {
	color: var(--color-link);
	background: var(--color-active-bg);
}

nav.sidebar .nav-item.active a {
	color: var(--color-active-border);
	border-left-color: var(--color-active-border);
	background: var(--color-active-bg);
	font-weight: 600;
}

.content-wrapper {
	margin-left: var(--sidebar-width);
	flex: 1;
	display: flex;
	justify-content: center;
	min-width: 0;
}

main.content {
	flex: 1;
	max-width: var(--content-max);
	padding: 3rem 2.5rem;
}

main.content h1 { font-size: 2rem; margin-bottom: 0.5rem; font-weight: 700; }
main.content h2 { font-size: 1.5rem; margin-top: 2.5rem; margin-bottom: 0.75rem; padding-bottom: 0.4rem; border-bottom: 1px solid var(--color-border); }
main.content h3 { font-size: 1.2rem; margin-top: 2rem; margin-bottom: 0.5rem; }
main.content p { margin-bottom: 1rem; }
main.content ul, main.content ol { margin-bottom: 1rem; padding-left: 1.5rem; }
main.content li { margin-bottom: 0.3rem; }
main.content a { color: var(--color-link); text-decoration: none; }
main.content a:hover { color: var(--color-link-hover); text-decoration: underline; }

main.content code {
	background: var(--color-code-bg);
	padding: 0.15rem 0.4rem;
	border-radius: 4px;
	font-family: var(--font-mono);
	font-size: 0.875em;
}

main.content pre {
	background: var(--color-code-bg);
	padding: 1rem 1.25rem;
	border-radius: 6px;
	overflow-x: auto;
	margin-bottom: 1.5rem;
	line-height: 1.5;
}

main.content pre code {
	background: none;
	padding: 0;
	border-radius: 0;
}

main.content table {
	width: 100%;
	border-collapse: collapse;
	margin-bottom: 1.5rem;
}

main.content th, main.content td {
	padding: 0.6rem 1rem;
	border: 1px solid var(--color-border);
	text-align: left;
}

main.content th {
	background: var(--color-sidebar-bg);
	font-weight: 600;
}

main.content blockquote {
	border-left: 4px solid var(--color-link);
	padding: 0.5rem 1rem;
	margin: 0 0 1rem;
	background: var(--color-active-bg);
	color: var(--color-text-muted);
}

.toc {
	position: sticky;
	top: 2rem;
	width: var(--toc-width);
	padding: 1.5rem 1rem;
	align-self: flex-start;
	flex-shrink: 0;
}

.toc h3 {
	font-size: 0.75rem;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	color: var(--color-text-muted);
	margin-bottom: 0.75rem;
}

.toc ul { list-style: none; }

.toc li a {
	display: block;
	padding: 0.2rem 0;
	color: var(--color-text-muted);
	text-decoration: none;
	font-size: 0.825rem;
	transition: color 0.15s ease;
}

.toc li a:hover { color: var(--color-link); }

.toc .toc-level-3 { padding-left: 0.75rem; }
.toc .toc-level-4 { padding-left: 1.5rem; }

@media (max-width: 1100px) {
	.toc { display: none; }
}

@media (max-width: 768px) {
	nav.sidebar {
		position: static;
		width: 100%;
		border-right: none;
		border-bottom: 1px solid var(--color-border);
		padding: 1rem 0;
	}

	nav.sidebar .site-title {
		padding: 0 1rem 0.75rem;
		margin-bottom: 0.5rem;
	}

	nav.sidebar ul {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		padding: 0 1rem;
	}

	nav.sidebar .nav-item a {
		padding: 0.35rem 0.75rem;
		border-left: none;
		border-radius: 4px;
	}

	nav.sidebar .nav-item.active a {
		border-left: none;
	}

	body { flex-direction: column; }

	.content-wrapper { margin-left: 0; }

	main.content { padding: 2rem 1.25rem; }
}
`;

export default function DocsTemplate({
	title,
	body,
	config,
	pages,
}: TemplateProps): VNode {
	const siteTitle = (config.title as string | undefined) ?? "Documentation";
	const tocEntries = (pages.find((p) => p.title === title)?.extensions?.toc ??
		[]) as TocEntry[];
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
			h("title", null, `${title} — ${siteTitle}`),
			h("style", null, CSS),
		),
		h(
			"body",
			null,
			h(
				"nav",
				{ class: "sidebar" },
				h("div", { class: "site-title" }, siteTitle),
				h("ul", null, ...navPages.map((page) => NavItem(page, title))),
			),
			h(
				"div",
				{ class: "content-wrapper" },
				h(
					"main",
					{ class: "content" },
					h("h1", null, title),
					h("article", { dangerouslySetInnerHTML: { __html: body } }),
				),
				tocEntries.length > 0 ? TableOfContents(tocEntries) : null,
			),
		),
	);
}
