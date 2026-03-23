import { type VNode, h } from "preact";
import type { Page, TemplateProps } from "../core/types.ts";

function isIndexPage(page: Page): boolean {
	return page.source.endsWith("/index.md") || page.source === "index.md";
}

function estimateReadingTime(html: string): number {
	const text = html.replace(/<[^>]*>/g, "");
	const words = text.split(/\s+/).filter((w) => w.length > 0).length;
	return Math.max(1, Math.ceil(words / 200));
}

function isListingPage(title: string, pages: Page[]): boolean {
	const currentPage = pages.find((p) => p.title === title);
	if (!currentPage) return false;
	return isIndexPage(currentPage) || title.toLowerCase() === "index";
}

function formatDate(dateStr: unknown): string {
	if (typeof dateStr !== "string") return "";
	const d = new Date(dateStr);
	if (Number.isNaN(d.getTime())) return "";
	return d.toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

function PostCard(page: Page): VNode {
	const excerpt = (page.extensions.excerpt as string | undefined) ?? "";
	const date = page.extensions.date as string | undefined;
	const formattedDate = formatDate(date);

	return h(
		"article",
		{ class: "post-card" },
		h(
			"h2",
			{ class: "post-card-title" },
			h("a", { href: `/${page.href}` }, page.title),
		),
		formattedDate
			? h("time", { class: "post-card-date" }, formattedDate)
			: null,
		excerpt ? h("p", { class: "post-card-excerpt" }, excerpt) : null,
		h("a", { href: `/${page.href}`, class: "read-more" }, "Read more \u2192"),
	);
}

function PostListing(pages: Page[], siteTitle: string): VNode {
	const posts = pages
		.filter((p) => p.mime === "text/markdown" && !isIndexPage(p))
		.sort((a, b) => {
			const dateA = a.extensions.date as string | undefined;
			const dateB = b.extensions.date as string | undefined;
			if (!dateA && !dateB) return 0;
			if (!dateA) return 1;
			if (!dateB) return -1;
			return new Date(dateB).getTime() - new Date(dateA).getTime();
		});

	return h(
		"div",
		{ class: "listing" },
		h(
			"header",
			{ class: "blog-header" },
			h("h1", { class: "blog-title" }, siteTitle),
		),
		h("div", { class: "posts-grid" }, ...posts.map((page) => PostCard(page))),
	);
}

function PostDetail(title: string, body: string, pages: Page[]): VNode {
	const currentPage = pages.find((p) => p.title === title);
	const date = currentPage?.extensions?.date as string | undefined;
	const formattedDate = formatDate(date);
	const readingTime = estimateReadingTime(body);

	const otherPosts = pages.filter(
		(p) => p.mime === "text/markdown" && p.title !== title && !isIndexPage(p),
	);

	return h(
		"div",
		{ class: "post-detail" },
		h(
			"article",
			{ class: "post" },
			h(
				"header",
				{ class: "post-header" },
				h("h1", { class: "post-title" }, title),
				h(
					"div",
					{ class: "post-meta" },
					formattedDate ? h("time", null, formattedDate) : null,
					h("span", { class: "reading-time" }, `${readingTime} min read`),
				),
			),
			h("div", {
				class: "post-body",
				dangerouslySetInnerHTML: { __html: body },
			}),
		),
		otherPosts.length > 0
			? h(
					"nav",
					{ class: "other-posts" },
					h("h3", null, "More posts"),
					h(
						"ul",
						null,
						...otherPosts.map((p) =>
							h("li", null, h("a", { href: `/${p.href}` }, p.title)),
						),
					),
				)
			: null,
	);
}

const CSS = `
* { margin: 0; padding: 0; box-sizing: border-box; }

:root {
	--color-bg: #fdfcfa;
	--color-surface: #ffffff;
	--color-text: #2d2d2d;
	--color-text-muted: #717171;
	--color-accent: #c0392b;
	--color-accent-hover: #a93226;
	--color-border: #e8e4df;
	--color-code-bg: #f5f2ef;
	--font-serif: Georgia, "Times New Roman", Times, serif;
	--font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
	--font-mono: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
	--max-width: 720px;
}

html { font-size: 17px; }
body {
	font-family: var(--font-serif);
	color: var(--color-text);
	background: var(--color-bg);
	line-height: 1.8;
	padding: 0 1.25rem;
}

.blog-header {
	text-align: center;
	padding: 4rem 0 3rem;
	border-bottom: 1px solid var(--color-border);
	margin-bottom: 3rem;
}

.blog-title {
	font-family: var(--font-sans);
	font-size: 2.5rem;
	font-weight: 800;
	letter-spacing: -0.02em;
}

.listing { max-width: var(--max-width); margin: 0 auto; }

.posts-grid { display: flex; flex-direction: column; gap: 2.5rem; padding-bottom: 4rem; }

.post-card {
	padding: 2rem;
	background: var(--color-surface);
	border: 1px solid var(--color-border);
	border-radius: 8px;
	transition: box-shadow 0.2s ease;
}

.post-card:hover {
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.post-card-title {
	font-family: var(--font-sans);
	font-size: 1.4rem;
	margin-bottom: 0.4rem;
	font-weight: 700;
}

.post-card-title a {
	color: var(--color-text);
	text-decoration: none;
}

.post-card-title a:hover { color: var(--color-accent); }

.post-card-date {
	display: block;
	font-family: var(--font-sans);
	font-size: 0.85rem;
	color: var(--color-text-muted);
	margin-bottom: 0.75rem;
}

.post-card-excerpt {
	color: var(--color-text-muted);
	font-size: 0.95rem;
	margin-bottom: 1rem;
	line-height: 1.6;
}

.read-more {
	font-family: var(--font-sans);
	font-size: 0.875rem;
	color: var(--color-accent);
	text-decoration: none;
	font-weight: 600;
}

.read-more:hover { color: var(--color-accent-hover); }

.post-detail { max-width: var(--max-width); margin: 0 auto; padding-bottom: 4rem; }

.post-header {
	padding: 4rem 0 2rem;
	border-bottom: 1px solid var(--color-border);
	margin-bottom: 2rem;
}

.post-title {
	font-family: var(--font-sans);
	font-size: 2.4rem;
	font-weight: 800;
	letter-spacing: -0.02em;
	line-height: 1.2;
	margin-bottom: 0.75rem;
}

.post-meta {
	display: flex;
	gap: 1.5rem;
	font-family: var(--font-sans);
	font-size: 0.875rem;
	color: var(--color-text-muted);
}

.reading-time::before {
	content: "\\00b7";
	margin-right: 1.5rem;
}

.post-body h2 { font-family: var(--font-sans); font-size: 1.5rem; margin-top: 2.5rem; margin-bottom: 0.75rem; }
.post-body h3 { font-family: var(--font-sans); font-size: 1.2rem; margin-top: 2rem; margin-bottom: 0.5rem; }
.post-body p { margin-bottom: 1.25rem; }
.post-body ul, .post-body ol { margin-bottom: 1.25rem; padding-left: 1.5rem; }
.post-body li { margin-bottom: 0.3rem; }
.post-body a { color: var(--color-accent); text-decoration: underline; text-underline-offset: 2px; }
.post-body a:hover { color: var(--color-accent-hover); }

.post-body img {
	max-width: 100%;
	height: auto;
	border-radius: 6px;
	margin: 1.5rem 0;
}

.post-body code {
	background: var(--color-code-bg);
	padding: 0.15rem 0.4rem;
	border-radius: 3px;
	font-family: var(--font-mono);
	font-size: 0.85em;
}

.post-body pre {
	background: var(--color-code-bg);
	padding: 1rem 1.25rem;
	border-radius: 6px;
	overflow-x: auto;
	margin-bottom: 1.5rem;
	line-height: 1.5;
}

.post-body pre code { background: none; padding: 0; }

.post-body blockquote {
	border-left: 3px solid var(--color-accent);
	padding: 0.5rem 1.25rem;
	margin: 0 0 1.25rem;
	color: var(--color-text-muted);
	font-style: italic;
}

.other-posts {
	margin-top: 3rem;
	padding-top: 2rem;
	border-top: 1px solid var(--color-border);
}

.other-posts h3 {
	font-family: var(--font-sans);
	font-size: 1rem;
	font-weight: 700;
	margin-bottom: 0.75rem;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	color: var(--color-text-muted);
}

.other-posts ul { list-style: none; }

.other-posts li {
	margin-bottom: 0.5rem;
}

.other-posts a {
	color: var(--color-accent);
	text-decoration: none;
	font-family: var(--font-sans);
	font-size: 0.95rem;
}

.other-posts a:hover { text-decoration: underline; }

@media (max-width: 600px) {
	html { font-size: 16px; }
	.blog-header { padding: 2.5rem 0 2rem; }
	.blog-title { font-size: 1.8rem; }
	.post-header { padding: 2.5rem 0 1.5rem; }
	.post-title { font-size: 1.8rem; }
	.post-card { padding: 1.25rem; }
}
`;

export default function BlogTemplate({
	title,
	body,
	config,
	pages,
}: TemplateProps): VNode {
	const siteTitle = (config.title as string | undefined) ?? "Blog";
	const listing = isListingPage(title, pages);

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
			h("title", null, listing ? siteTitle : `${title} — ${siteTitle}`),
			h("style", null, CSS),
		),
		h(
			"body",
			null,
			listing ? PostListing(pages, siteTitle) : PostDetail(title, body, pages),
		),
	);
}
