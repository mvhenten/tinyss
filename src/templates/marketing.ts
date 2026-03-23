import { type VNode, h } from "preact";
import type { TemplateProps } from "../core/types.ts";

const CSS = `
* { margin: 0; padding: 0; box-sizing: border-box; }

:root {
	--color-dark: #0f172a;
	--color-dark-muted: #334155;
	--color-bg: #ffffff;
	--color-bg-alt: #f8fafc;
	--color-text: #1e293b;
	--color-text-light: #94a3b8;
	--color-text-inverse: #f1f5f9;
	--color-accent: #6366f1;
	--color-accent-hover: #4f46e5;
	--color-accent-light: rgba(99, 102, 241, 0.1);
	--color-border: #e2e8f0;
	--color-code-bg: #f1f5f9;
	--font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
	--font-mono: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
	--max-width: 1120px;
}

html { font-size: 16px; }
body {
	font-family: var(--font-sans);
	color: var(--color-text);
	background: var(--color-bg);
	line-height: 1.7;
}

.hero {
	background: var(--color-dark);
	color: var(--color-text-inverse);
	padding: 6rem 2rem;
	text-align: center;
}

.hero-inner {
	max-width: var(--max-width);
	margin: 0 auto;
}

.hero h1 {
	font-size: 3.25rem;
	font-weight: 800;
	letter-spacing: -0.03em;
	line-height: 1.15;
	margin-bottom: 1.25rem;
	background: linear-gradient(135deg, #fff 0%, #c7d2fe 100%);
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
}

.hero p {
	font-size: 1.2rem;
	color: var(--color-text-light);
	max-width: 600px;
	margin: 0 auto 2rem;
	line-height: 1.6;
}

.hero .cta-group {
	display: flex;
	gap: 1rem;
	justify-content: center;
	flex-wrap: wrap;
}

.sections {
	max-width: var(--max-width);
	margin: 0 auto;
}

.section {
	padding: 5rem 2rem;
}

.section:nth-child(even) {
	background: var(--color-bg-alt);
}

.section h2 {
	font-size: 2rem;
	font-weight: 700;
	text-align: center;
	margin-bottom: 1rem;
	letter-spacing: -0.02em;
}

.section > p {
	text-align: center;
	color: var(--color-dark-muted);
	max-width: 640px;
	margin: 0 auto 3rem;
	font-size: 1.1rem;
}

.section ul {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
	gap: 1.5rem;
	list-style: none;
	max-width: var(--max-width);
	margin: 0 auto;
}

.section li {
	background: var(--color-bg);
	border: 1px solid var(--color-border);
	border-radius: 10px;
	padding: 1.75rem;
	transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.section li:hover {
	transform: translateY(-2px);
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
}

.section li strong {
	display: block;
	font-size: 1.1rem;
	margin-bottom: 0.4rem;
}

.section a {
	display: inline-block;
	background: var(--color-accent);
	color: #fff;
	padding: 0.75rem 2rem;
	border-radius: 8px;
	text-decoration: none;
	font-weight: 600;
	font-size: 1rem;
	transition: background 0.2s ease, transform 0.1s ease;
}

.section a:hover {
	background: var(--color-accent-hover);
	transform: translateY(-1px);
}

.section a[href^="http"]::after,
.section a[href^="/"]::after {
	content: none;
}

.body-content {
	max-width: var(--max-width);
	margin: 0 auto;
}

.body-content h2 {
	font-size: 2rem;
	font-weight: 700;
	text-align: center;
	margin-bottom: 1rem;
	padding-top: 4rem;
	letter-spacing: -0.02em;
}

.body-content h3 {
	font-size: 1.35rem;
	margin-top: 2rem;
	margin-bottom: 0.75rem;
}

.body-content p {
	color: var(--color-dark-muted);
	margin-bottom: 1.25rem;
	font-size: 1.05rem;
}

.body-content ul {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
	gap: 1.5rem;
	list-style: none;
	margin-bottom: 2rem;
}

.body-content li {
	background: var(--color-bg);
	border: 1px solid var(--color-border);
	border-radius: 10px;
	padding: 1.75rem;
	transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.body-content li:hover {
	transform: translateY(-2px);
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
}

.body-content a {
	display: inline-block;
	background: var(--color-accent);
	color: #fff;
	padding: 0.75rem 2rem;
	border-radius: 8px;
	text-decoration: none;
	font-weight: 600;
	font-size: 1rem;
	transition: background 0.2s ease, transform 0.1s ease;
	margin: 0.5rem 0;
}

.body-content a:hover {
	background: var(--color-accent-hover);
	transform: translateY(-1px);
}

.body-content code {
	background: var(--color-code-bg);
	padding: 0.15rem 0.4rem;
	border-radius: 4px;
	font-family: var(--font-mono);
	font-size: 0.875em;
}

.body-content pre {
	background: var(--color-dark);
	color: var(--color-text-inverse);
	padding: 1.5rem;
	border-radius: 10px;
	overflow-x: auto;
	margin-bottom: 2rem;
	line-height: 1.5;
}

.body-content pre code {
	background: none;
	padding: 0;
	color: inherit;
}

.body-content blockquote {
	background: var(--color-accent-light);
	border-left: 4px solid var(--color-accent);
	padding: 1.25rem 1.5rem;
	margin: 0 0 1.5rem;
	border-radius: 0 8px 8px 0;
	font-size: 1.1rem;
}

.body-content img {
	max-width: 100%;
	height: auto;
	border-radius: 10px;
	margin: 1.5rem 0;
}

footer.site-footer {
	background: var(--color-dark);
	color: var(--color-text-light);
	text-align: center;
	padding: 3rem 2rem;
	font-size: 0.875rem;
}

@media (max-width: 768px) {
	.hero { padding: 4rem 1.25rem; }
	.hero h1 { font-size: 2.2rem; }
	.hero p { font-size: 1rem; }
	.section { padding: 3rem 1.25rem; }
	.section h2 { font-size: 1.6rem; }
	.body-content h2 { font-size: 1.6rem; padding-top: 2.5rem; }
	.body-content { padding: 0 1.25rem; }
}
`;

export default function MarketingTemplate({
	title,
	body,
	config,
}: TemplateProps): VNode {
	const siteTitle = (config.title as string | undefined) ?? title;
	const description = (config.description as string | undefined) ?? "";

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
			h("title", null, siteTitle),
			description
				? h("meta", { name: "description", content: description })
				: null,
			h("style", null, CSS),
		),
		h(
			"body",
			null,
			h(
				"section",
				{ class: "hero" },
				h(
					"div",
					{ class: "hero-inner" },
					h("h1", null, title),
					description ? h("p", null, description) : null,
				),
			),
			h(
				"div",
				{ class: "body-content" },
				h("div", {
					class: "sections",
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
