import { defineConfig } from "@playwright/test";

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
			command: "./bin/cli.mjs serve demo/docs-demo/* --port 3100",
			port: 3100,
			reuseExistingServer: !process.env.CI,
		},
		{
			command: "./bin/cli.mjs serve demo/blog-demo/* --port 3101",
			port: 3101,
			reuseExistingServer: !process.env.CI,
		},
		{
			command: "./bin/cli.mjs serve demo/marketing-demo/* --port 3102",
			port: 3102,
			reuseExistingServer: !process.env.CI,
		},
		{
			command: "./bin/cli.mjs serve demo/portfolio-demo/* --port 3103",
			port: 3103,
			reuseExistingServer: !process.env.CI,
		},
	],
});
