import { test, expect } from "@playwright/test";

test.describe("docs template", () => {
	test("page loads without errors", async ({ page }) => {
		const errors: string[] = [];
		page.on("pageerror", (err) => errors.push(err.message));

		await page.goto("/demo/docs-demo/index.html");

		expect(errors).toHaveLength(0);
	});

	test("sidebar navigation is present", async ({ page }) => {
		await page.goto("/demo/docs-demo/index.html");

		const sidebar = page.locator("nav.sidebar");
		await expect(sidebar).toBeVisible();

		const navLinks = sidebar.locator("a");
		expect(await navLinks.count()).toBeGreaterThanOrEqual(2);
	});

	test("page title is rendered", async ({ page }) => {
		await page.goto("/demo/docs-demo/index.html");

		await expect(page).toHaveTitle(/Tinyss Documentation/);
	});

	test("content body is rendered", async ({ page }) => {
		await page.goto("/demo/docs-demo/index.html");

		const main = page.locator("main.content");
		await expect(main).toBeVisible();

		const heading = main.locator("h1");
		await expect(heading).toHaveText("Getting Started");
	});

	test("navigation links work", async ({ page }) => {
		await page.goto("/demo/docs-demo/index.html");

		const installationLink = page.locator("nav.sidebar a", {
			hasText: "Installation",
		});
		await installationLink.click();

		await expect(page).toHaveURL(/installation/);
		await expect(page.locator("main.content h1")).toBeVisible();
	});

	test("visual baseline", async ({ page }) => {
		await page.goto("/demo/docs-demo/index.html");
		await expect(page).toHaveScreenshot("docs-index.png");
	});
});
