import { mkdir, writeFile } from "node:fs/promises";
import nodePath from "node:path";
import { zodToJsonSchema } from "zod-to-json-schema";
import { TinyssConfigSchema } from "./core/config.ts";

const schema = zodToJsonSchema(TinyssConfigSchema, "TinyssConfig");
const outDir = nodePath.join(import.meta.dirname, "..", "schema");

await mkdir(outDir, { recursive: true });
await writeFile(
	nodePath.join(outDir, "tinyss.config.schema.json"),
	`${JSON.stringify(schema, null, "\t")}\n`,
);

console.log("Generated schema/tinyss.config.schema.json");
