import { execSync } from "node:child_process";
import { rm } from "node:fs/promises";

const OUTPUT_DIR = "/tmp/tinyss-e2e";

const DEMOS = ["docs-demo", "blog-demo", "marketing-demo", "portfolio-demo"];

async function globalSetup(): Promise<void> {
	await rm(OUTPUT_DIR, { recursive: true, force: true });

	execSync("npm run build", { stdio: "inherit" });

	for (const demo of DEMOS) {
		execSync(`./bin/cli.mjs demo/${demo}/* -o ${OUTPUT_DIR}/${demo}`, {
			stdio: "inherit",
		});
	}
}

export default globalSetup;
