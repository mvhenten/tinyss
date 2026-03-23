interface SearchDoc {
	href: string;
	title: string;
	excerpt: string;
}

interface SearchIndexData {
	docs: SearchDoc[];
	index: Record<string, [number, number][]>;
}

interface SearchResult {
	href: string;
	title: string;
	excerpt: string;
	score: number;
}

const STOP_WORDS = new Set([
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

function tokenize(text: string): string[] {
	return text
		.toLowerCase()
		.split(/[^a-z0-9]+/)
		.filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

let indexCache: SearchIndexData | null = null;

async function loadIndex(): Promise<SearchIndexData> {
	if (indexCache) return indexCache;
	const res = await fetch("/search-index.json");
	indexCache = (await res.json()) as SearchIndexData;
	return indexCache;
}

export async function search(
	query: string,
	maxResults = 10,
): Promise<SearchResult[]> {
	const idx = await loadIndex();
	const tokens = tokenize(query);
	if (tokens.length === 0) return [];

	const scores = new Map<number, number>();

	for (const term of tokens) {
		const entries = idx.index[term];
		if (!entries) continue;
		for (const [docIdx, score] of entries) {
			scores.set(docIdx, (scores.get(docIdx) ?? 0) + score);
		}
	}

	const results: SearchResult[] = [];

	for (const [docIdx, score] of scores) {
		const doc = idx.docs[docIdx];
		results.push({
			href: doc.href,
			title: doc.title,
			excerpt: doc.excerpt,
			score,
		});
	}

	results.sort((a, b) => b.score - a.score);
	return results.slice(0, maxResults);
}
