import { readFile, writeFile } from "node:fs/promises";
import type { Plugin } from "../core/plugin.ts";
import type { Page } from "../core/types.ts";

interface SearchOptions {
	stopWords?: string[];
	maxResults?: number;
}

interface DocEntry {
	href: string;
	title: string;
	excerpt: string;
}

interface SearchIndex {
	docs: DocEntry[];
	index: Record<string, [number, number][]>;
}

const DEFAULT_STOP_WORDS = new Set([
	"a",
	"an",
	"and",
	"are",
	"as",
	"at",
	"be",
	"but",
	"by",
	"for",
	"from",
	"had",
	"has",
	"have",
	"he",
	"her",
	"his",
	"how",
	"i",
	"if",
	"in",
	"into",
	"is",
	"it",
	"its",
	"no",
	"not",
	"of",
	"on",
	"or",
	"she",
	"so",
	"than",
	"that",
	"the",
	"their",
	"them",
	"then",
	"there",
	"these",
	"they",
	"this",
	"to",
	"was",
	"we",
	"were",
	"what",
	"when",
	"which",
	"who",
	"will",
	"with",
	"you",
]);

function stripMarkdown(content: string): string {
	return content
		.replace(/^---[\s\S]*?---/m, "")
		.replace(/^#{1,6}\s+/gm, "")
		.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
		.replace(/[*_~`]+/g, "")
		.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
		.replace(/^\s*[-*+]\s+/gm, "")
		.replace(/^\s*\d+\.\s+/gm, "")
		.replace(/^\s*>\s+/gm, "")
		.replace(/```[\s\S]*?```/g, "")
		.replace(/`[^`]+`/g, "")
		.replace(/\n{2,}/g, "\n")
		.trim();
}

function tokenize(text: string, stopWords: Set<string>): string[] {
	return text
		.toLowerCase()
		.split(/[^a-z0-9]+/)
		.filter((token) => token.length > 1 && !stopWords.has(token));
}

function extractExcerpt(text: string, maxLength = 150): string {
	const trimmed = text.replace(/\s+/g, " ").trim();
	if (trimmed.length <= maxLength) return trimmed;
	return `${trimmed.slice(0, maxLength).trimEnd()}...`;
}

function buildIndex(
	pages: Page[],
	texts: string[],
	stopWords: Set<string>,
): SearchIndex {
	const docs: DocEntry[] = [];
	const termDocFrequency = new Map<string, number>();
	const docTermFrequencies: Map<string, number>[] = [];

	for (let i = 0; i < pages.length; i++) {
		const page = pages[i];
		const text = texts[i];
		const plainText = stripMarkdown(text);
		const tokens = tokenize(plainText, stopWords);

		docs.push({
			href: page.href,
			title: page.title,
			excerpt: extractExcerpt(plainText),
		});

		const tf = new Map<string, number>();
		for (const token of tokens) {
			tf.set(token, (tf.get(token) ?? 0) + 1);
		}

		const seenTerms = new Set<string>();
		for (const token of tokens) {
			if (!seenTerms.has(token)) {
				termDocFrequency.set(token, (termDocFrequency.get(token) ?? 0) + 1);
				seenTerms.add(token);
			}
		}

		for (const [term, count] of tf) {
			tf.set(term, count / tokens.length);
		}

		docTermFrequencies.push(tf);
	}

	const totalDocs = pages.length;
	const index: Record<string, [number, number][]> = {};

	for (const [term, docFreq] of termDocFrequency) {
		const idf = Math.log(1 + totalDocs / docFreq);
		const entries: [number, number][] = [];

		for (let docIdx = 0; docIdx < docTermFrequencies.length; docIdx++) {
			const tf = docTermFrequencies[docIdx].get(term);
			if (tf === undefined) continue;

			const tfidf = Math.round(tf * idf * 1000) / 1000;
			if (tfidf > 0) {
				entries.push([docIdx, tfidf]);
			}
		}

		if (entries.length > 0) {
			index[term] = entries;
		}
	}

	return { docs, index };
}

function buildClientScript(maxResults: number): string {
	return `(function() {
	"use strict";
	var index = null;
	var STOP_WORDS = new Set(${JSON.stringify([...DEFAULT_STOP_WORDS])});

	function tokenize(text) {
		return text.toLowerCase().split(/[^a-z0-9]+/).filter(function(t) {
			return t.length > 1 && !STOP_WORDS.has(t);
		});
	}

	function loadIndex() {
		if (index) return Promise.resolve(index);
		return fetch("/search-index.json")
			.then(function(res) { return res.json(); })
			.then(function(data) { index = data; return data; });
	}

	function search(query) {
		return loadIndex().then(function(idx) {
			var tokens = tokenize(query);
			if (tokens.length === 0) return [];

			var scores = {};
			for (var i = 0; i < tokens.length; i++) {
				var term = tokens[i];
				var entries = idx.index[term];
				if (!entries) continue;
				for (var j = 0; j < entries.length; j++) {
					var docIdx = entries[j][0];
					var score = entries[j][1];
					scores[docIdx] = (scores[docIdx] || 0) + score;
				}
			}

			var results = [];
			for (var docIdx in scores) {
				var doc = idx.docs[docIdx];
				results.push({
					href: doc.href,
					title: doc.title,
					excerpt: doc.excerpt,
					score: scores[docIdx]
				});
			}

			results.sort(function(a, b) { return b.score - a.score; });
			return results.slice(0, ${maxResults});
		});
	}

	if (!window.tinyss) window.tinyss = {};
	window.tinyss.search = search;
})();
`;
}

export function searchPlugin(options?: SearchOptions): Plugin {
	const stopWords = new Set([
		...DEFAULT_STOP_WORDS,
		...(options?.stopWords ?? []),
	]);
	const maxResults = options?.maxResults ?? 10;

	return {
		name: "search",
		async afterRender(ctx) {
			const texts: string[] = [];

			for (const page of ctx.pages) {
				const content = await readFile(page.source, "utf-8");
				texts.push(content);
			}

			const searchIndex = buildIndex(ctx.pages, texts, stopWords);

			await writeFile(
				`${ctx.outputDir}/search-index.json`,
				JSON.stringify(searchIndex),
			);

			await writeFile(
				`${ctx.outputDir}/search.js`,
				buildClientScript(maxResults),
			);
		},
	};
}
