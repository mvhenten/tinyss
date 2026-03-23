import { readFile } from "node:fs/promises";
import nodePath from "node:path";
import { z } from "zod";

export const TinyssConfigSchema = z
	.object({
		outputDir: z.string().default("output"),
		template: z.string().optional(),
		plugins: z.array(z.string()).default([]),
		watch: z.boolean().default(false),
		json: z.boolean().default(false),
	})
	.passthrough();

export type TinyssConfig = z.infer<typeof TinyssConfigSchema>;

const CONFIG_FILENAME = "tinyss.config.json";

export async function loadConfig(cwd: string): Promise<TinyssConfig> {
	const configPath = nodePath.join(cwd, CONFIG_FILENAME);

	let raw: string;
	try {
		raw = await readFile(configPath, "utf-8");
	} catch {
		return TinyssConfigSchema.parse({});
	}

	const parsed: unknown = JSON.parse(raw);
	return TinyssConfigSchema.parse(parsed);
}

export function mergeCliOverrides(
	config: TinyssConfig,
	cliValues: Record<string, unknown>,
): TinyssConfig {
	const merged: Record<string, unknown> = { ...config };

	for (const [key, value] of Object.entries(cliValues)) {
		if (value !== undefined) {
			merged[key] = value;
		}
	}

	return TinyssConfigSchema.parse(merged);
}
