export interface PathNode {
	source: string;
	href?: string;
	mime?: string;
	title?: string;
	children?: PathNode[];
	config?: Record<string, unknown>;
	info?: Record<string, unknown>;
	extensions: Record<string, unknown>;
}

export interface PagesTree {
	children: PathNode[];
	config: Record<string, unknown>;
}

export interface Page {
	source: string;
	href: string;
	title: string;
	mime: string;
	extensions: Record<string, unknown>;
}

export interface TemplateProps {
	title: string;
	body: string;
	config: Record<string, unknown>;
	pages: Page[];
	templateRoot: string;
}
