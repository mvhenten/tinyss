import { test, expect } from "@playwright/test";

test.describe("blog template", () => {
	test("index page loads without errors", async ({ page }) => {
		const errors: string[] = [];
		page.on("pageerror", (err) => errors.push(err.message));

		await page.goto("/demo/blog-demo/index.html");

		expect(errors).toHaveLength(0);
	});

	test("blog header is present", async ({ page }) => {
		await page.goto("/demo/blog-demo/index.html");

		const header = page.locator("header.blog-header");
		await expect(header).toBeVisible();

		const title = page.locator("h1.blog-title");
		await expect(title).toBeVisible();
	});

	test("blog title is rendered", async ({ page }) => {
		await page.goto("/demo/blog-demo/index.html");

		await expect(page.locator("h1.blog-title")).toHaveText("The Tinyss Blog");
	});

	test("individual post page renders", async ({ page }) => {
		await page.goto("/demo/blog-demo/hello-world/index.html");

		await expect(page.locator("body")).toBeVisible();
		await expect(page).toHaveTitle(/.+/);
	});

	test("visual baseline", async ({ page }) => {
		await page.goto("/demo/blog-demo/index.html");
		await expect(page).toHaveScreenshot("blog-index.png");
	});
});
