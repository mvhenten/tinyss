import { test, expect } from "@playwright/test";

test.describe("blog template", () => {
	test("index page loads without errors", async ({ page }) => {
		const errors: string[] = [];
		page.on("pageerror", (err) => errors.push(err.message));

		await page.goto("/");

		expect(errors).toHaveLength(0);
	});

	test("blog header is present", async ({ page }) => {
		await page.goto("/");

		const header = page.locator("header.blog-header");
		await expect(header).toBeVisible();

		const title = page.locator("h1.blog-title");
		await expect(title).toBeVisible();
	});

	test("blog title is rendered", async ({ page }) => {
		await page.goto("/");

		await expect(page.locator("h1.blog-title")).toHaveText("The Tinyss Blog");
	});

	test("post cards are displayed on index", async ({ page }) => {
		await page.goto("/");

		const postCards = page.locator("article.post-card");
		expect(await postCards.count()).toBeGreaterThanOrEqual(3);
	});

	test("post cards show excerpts", async ({ page }) => {
		await page.goto("/");

		const excerpts = page.locator(".post-card-excerpt");
		expect(await excerpts.count()).toBeGreaterThanOrEqual(1);
	});

	test("individual post page renders", async ({ page }) => {
		await page.goto("/hello-world/index.html");

		await expect(page.locator("body")).toBeVisible();
		await expect(page).toHaveTitle(/.+/);
	});

	test("visual baseline", async ({ page }) => {
		await page.goto("/");
		await expect(page).toHaveScreenshot("blog-index.png");
	});
});
