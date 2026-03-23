import { defineConfig } from "@playwright/test";

const OUTPUT_DIR = "/tmp/tinyss-e2e";

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: 0,
	workers: 1,
	reporter: "html",
	globalSetup: "./e2e/global-setup.ts",
	use: {
		screenshot: "only-on-failure",
	},
	projects: [
		{
			name: "docs",
			use: {
				baseURL: "http://localhost:3100",
			},
			testMatch: "docs.spec.ts",
		},
		{
			name: "blog",
			use: {
				baseURL: "http://localhost:3101",
			},
			testMatch: "blog.spec.ts",
		},
		{
			name: "marketing",
			use: {
				baseURL: "http://localhost:3102",
			},
			testMatch: "marketing.spec.ts",
		},
		{
			name: "portfolio",
			use: {
				baseURL: "http://localhost:3103",
			},
			testMatch: "portfolio.spec.ts",
		},
	],
	webServer: [
		{
			command: `node e2e/serve-cli.mjs ${OUTPUT_DIR}/docs-demo 3100`,
			port: 3100,
			reuseExistingServer: !process.env.CI,
		},
		{
			command: `node e2e/serve-cli.mjs ${OUTPUT_DIR}/blog-demo 3101`,
			port: 3101,
			reuseExistingServer: !process.env.CI,
		},
		{
			command: `node e2e/serve-cli.mjs ${OUTPUT_DIR}/marketing-demo 3102`,
			port: 3102,
			reuseExistingServer: !process.env.CI,
		},
		{
			command: `node e2e/serve-cli.mjs ${OUTPUT_DIR}/portfolio-demo 3103`,
			port: 3103,
			reuseExistingServer: !process.env.CI,
		},
	],
});
