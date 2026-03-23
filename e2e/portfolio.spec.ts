import { test, expect } from "@playwright/test";

test.describe("portfolio template", () => {
	test("page loads without errors", async ({ page }) => {
		const errors: string[] = [];
		page.on("pageerror", (err) => errors.push(err.message));

		await page.goto("/demo/portfolio-demo/index.html");

		expect(errors).toHaveLength(0);
	});

	test("site header is present", async ({ page }) => {
		await page.goto("/demo/portfolio-demo/index.html");

		const header = page.locator("header.site-header");
		await expect(header).toBeVisible();

		const navLinks = header.locator("nav a");
		expect(await navLinks.count()).toBeGreaterThanOrEqual(1);
	});

	test("overview section is present", async ({ page }) => {
		await page.goto("/demo/portfolio-demo/index.html");

		const overview = page.locator("div.overview");
		await expect(overview).toBeVisible();

		const heading = overview.locator("h2");
		await expect(heading).toHaveText("Selected Work");
	});

	test("project cards are displayed in grid", async ({ page }) => {
		await page.goto("/demo/portfolio-demo/index.html");

		const projectCards = page.locator("article.project-card");
		expect(await projectCards.count()).toBeGreaterThanOrEqual(3);
	});

	test("project detail page renders", async ({ page }) => {
		await page.goto("/demo/portfolio-demo/project-alpha/index.html");

		await expect(page.locator("body")).toBeVisible();
		await expect(page.locator("header.site-header")).toBeVisible();
	});

	test("navigation links work", async ({ page }) => {
		await page.goto("/demo/portfolio-demo/index.html");

		const projectLink = page.locator("header.site-header nav a", {
			hasText: "Project Alpha",
		});
		await projectLink.click();

		await expect(page).toHaveURL(/project-alpha/);
	});

	test("visual baseline", async ({ page }) => {
		await page.goto("/demo/portfolio-demo/index.html");
		await expect(page).toHaveScreenshot("portfolio-index.png");
	});
});
