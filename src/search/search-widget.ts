import { type VNode, h } from "preact";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";

interface SearchResult {
	href: string;
	title: string;
	excerpt: string;
	score: number;
}

declare const tinyss: {
	search: (query: string) => Promise<SearchResult[]>;
};

const WIDGET_STYLES = `
.tinyss-search {
	position: relative;
	font-family: inherit;
}
.tinyss-search-input {
	width: 100%;
	padding: 8px 12px;
	font-size: 14px;
	border: 1px solid #ccc;
	border-radius: 4px;
	box-sizing: border-box;
}
.tinyss-search-input:focus {
	outline: none;
	border-color: #0066cc;
	box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.2);
}
.tinyss-search-results {
	position: absolute;
	top: 100%;
	left: 0;
	right: 0;
	background: #fff;
	border: 1px solid #ccc;
	border-radius: 4px;
	margin-top: 4px;
	max-height: 400px;
	overflow-y: auto;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	z-index: 1000;
	list-style: none;
	padding: 0;
	margin-left: 0;
}
.tinyss-search-result {
	padding: 0;
}
.tinyss-search-result a {
	display: block;
	padding: 10px 12px;
	text-decoration: none;
	color: inherit;
	border-bottom: 1px solid #eee;
}
.tinyss-search-result:last-child a {
	border-bottom: none;
}
.tinyss-search-result a:hover {
	background: #f5f5f5;
}
.tinyss-search-result-title {
	font-weight: 600;
	margin-bottom: 2px;
	color: #0066cc;
}
.tinyss-search-result-excerpt {
	font-size: 13px;
	color: #666;
}
`;

export function SearchWidget(): VNode {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<SearchResult[]>([]);
	const [isOpen, setIsOpen] = useState(false);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const performSearch = useCallback((value: string): void => {
		if (value.trim().length === 0) {
			setResults([]);
			setIsOpen(false);
			return;
		}

		tinyss.search(value).then((searchResults) => {
			setResults(searchResults);
			setIsOpen(searchResults.length > 0);
		});
	}, []);

	const onInput = useCallback(
		(e: Event): void => {
			const value = (e.target as HTMLInputElement).value;
			setQuery(value);

			if (timerRef.current) clearTimeout(timerRef.current);
			timerRef.current = setTimeout(() => performSearch(value), 200);
		},
		[performSearch],
	);

	useEffect(() => {
		return () => {
			if (timerRef.current) clearTimeout(timerRef.current);
		};
	}, []);

	return h(
		"div",
		{ class: "tinyss-search" },
		h("style", null, WIDGET_STYLES),
		h("input", {
			type: "text",
			class: "tinyss-search-input",
			placeholder: "Search...",
			value: query,
			onInput,
		}),
		isOpen
			? h(
					"ul",
					{ class: "tinyss-search-results" },
					...results.map((result) =>
						h(
							"li",
							{ class: "tinyss-search-result" },
							h(
								"a",
								{ href: result.href },
								h("div", { class: "tinyss-search-result-title" }, result.title),
								h(
									"div",
									{ class: "tinyss-search-result-excerpt" },
									result.excerpt,
								),
							),
						),
					),
				)
			: null,
	);
}
