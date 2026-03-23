import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import nodePath from "node:path";
import type { Plugin } from "../core/plugin.ts";

type SummaryField = "excerpt" | "summary" | "tags";

export interface AiSummarizeOptions {
	provider: "ollama" | "claude";
	model?: string;
	apiKey?: string;
	ollamaUrl?: string;
	fields?: SummaryField[];
	cacheDir?: string;
}

interface SummaryResult {
	excerpt?: string;
	summary?: string;
	tags?: string[];
}

type SummaryCache = Record<string, SummaryResult>;

function contentHash(content: string): string {
	return createHash("sha256").update(content).digest("hex");
}

async function loadCache(cachePath: string): Promise<SummaryCache> {
	try {
		const raw = await readFile(cachePath, "utf-8");
		const parsed: unknown = JSON.parse(raw);
		if (
			typeof parsed !== "object" ||
			parsed === null ||
			Array.isArray(parsed)
		) {
			return {};
		}
		return parsed as SummaryCache;
	} catch {
		return {};
	}
}

async function saveCache(
	cachePath: string,
	cache: SummaryCache,
): Promise<void> {
	await mkdir(nodePath.dirname(cachePath), { recursive: true });
	await writeFile(cachePath, JSON.stringify(cache, null, 2));
}

function buildPrompt(content: string, fields: SummaryField[]): string {
	const fieldDescriptions: Record<SummaryField, string> = {
		excerpt: '"excerpt": a 1-2 sentence short excerpt',
		summary: '"summary": a paragraph-length summary',
		tags: '"tags": an array of 3-5 relevant topic tags',
	};

	const requested = fields.map((f) => fieldDescriptions[f]).join(", ");

	return `Analyze the following content and return a JSON object with these fields: ${requested}.

Return ONLY valid JSON, no markdown fences, no explanation.

Content:
${content}`;
}

async function callOllama(
	url: string,
	model: string,
	prompt: string,
): Promise<SummaryResult> {
	const response = await fetch(`${url}/api/generate`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ model, prompt, stream: false }),
	});

	if (!response.ok) {
		throw new Error(`Ollama returned ${response.status}`);
	}

	const body: unknown = await response.json();
	const text =
		typeof body === "object" && body !== null && "response" in body
			? String((body as Record<string, unknown>).response)
			: "";

	return parseJsonResponse(text);
}

async function callClaude(
	apiKey: string,
	model: string,
	prompt: string,
): Promise<SummaryResult> {
	const response = await fetch("https://api.anthropic.com/v1/messages", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"x-api-key": apiKey,
			"anthropic-version": "2023-06-01",
		},
		body: JSON.stringify({
			model,
			max_tokens: 1024,
			messages: [{ role: "user", content: prompt }],
		}),
	});

	if (!response.ok) {
		throw new Error(`Claude API returned ${response.status}`);
	}

	const body: unknown = await response.json();
	const content =
		typeof body === "object" &&
		body !== null &&
		"content" in body &&
		Array.isArray((body as Record<string, unknown>).content)
			? (body as { content: Array<Record<string, unknown>> }).content
			: [];

	const textBlock = content.find((b) => b.type === "text");
	const text = textBlock ? String(textBlock.text) : "";

	return parseJsonResponse(text);
}

function parseJsonResponse(text: string): SummaryResult {
	const cleaned = text
		.replace(/```json\n?/g, "")
		.replace(/```\n?/g, "")
		.trim();
	const parsed: unknown = JSON.parse(cleaned);

	if (typeof parsed !== "object" || parsed === null) {
		throw new Error("LLM response is not an object");
	}

	const obj = parsed as Record<string, unknown>;
	const result: SummaryResult = {};

	if (typeof obj.excerpt === "string") {
		result.excerpt = obj.excerpt;
	}
	if (typeof obj.summary === "string") {
		result.summary = obj.summary;
	}
	if (Array.isArray(obj.tags) && obj.tags.every((t) => typeof t === "string")) {
		result.tags = obj.tags as string[];
	}

	return result;
}

export function aiSummarizePlugin(options: AiSummarizeOptions): Plugin {
	const provider = options.provider;
	const model =
		options.model ??
		(provider === "ollama" ? "llama3" : "claude-sonnet-4-20250514");
	const ollamaUrl = options.ollamaUrl ?? "http://localhost:11434";
	const fields: SummaryField[] = options.fields ?? [
		"excerpt",
		"summary",
		"tags",
	];
	const cacheDir = options.cacheDir ?? ".tinyss-cache";
	const cachePath = nodePath.join(cacheDir, "ai-summaries.json");

	return {
		name: "ai-summarize",
		async afterParse(ctx) {
			const cache = await loadCache(cachePath);
			let cacheUpdated = false;

			for (const page of ctx.pages) {
				const content = await readFile(page.source, "utf-8");
				const hash = contentHash(content);

				if (cache[hash]) {
					const cached = cache[hash];
					if (cached.excerpt !== undefined)
						page.extensions.aiExcerpt = cached.excerpt;
					if (cached.summary !== undefined)
						page.extensions.aiSummary = cached.summary;
					if (cached.tags !== undefined) page.extensions.aiTags = cached.tags;
					continue;
				}

				console.log(`Summarizing ${page.title}...`);

				const prompt = buildPrompt(content, fields);

				let result: SummaryResult;
				try {
					if (provider === "ollama") {
						result = await callOllama(ollamaUrl, model, prompt);
					} else {
						if (!options.apiKey) {
							console.warn(
								"ai-summarize: apiKey required for claude provider, skipping",
							);
							continue;
						}
						result = await callClaude(options.apiKey, model, prompt);
					}
				} catch (err) {
					const message = err instanceof Error ? err.message : String(err);
					console.warn(
						`ai-summarize: failed to summarize "${page.title}": ${message}`,
					);
					continue;
				}

				if (result.excerpt !== undefined)
					page.extensions.aiExcerpt = result.excerpt;
				if (result.summary !== undefined)
					page.extensions.aiSummary = result.summary;
				if (result.tags !== undefined) page.extensions.aiTags = result.tags;

				cache[hash] = result;
				cacheUpdated = true;
			}

			if (cacheUpdated) {
				await saveCache(cachePath, cache);
			}
		},
	};
}
