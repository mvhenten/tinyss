import { test, expect } from "@playwright/test";

test.describe("marketing template", () => {
	test("page loads without errors", async ({ page }) => {
		const errors: string[] = [];
		page.on("pageerror", (err) => errors.push(err.message));

		await page.goto("/");

		expect(errors).toHaveLength(0);
	});

	test("hero section is present", async ({ page }) => {
		await page.goto("/");

		const hero = page.locator("section.hero");
		await expect(hero).toBeVisible();

		const heroTitle = hero.locator("h1");
		await expect(heroTitle).toBeVisible();
		await expect(heroTitle).toHaveText(/Build Beautiful Static Sites/);
	});

	test("page content renders", async ({ page }) => {
		await page.goto("/");

		const bodyContent = page.locator("div.body-content");
		await expect(bodyContent).toBeVisible();

		const sections = bodyContent.locator("h2");
		expect(await sections.count()).toBeGreaterThanOrEqual(2);
	});

	test("footer is present", async ({ page }) => {
		await page.goto("/");

		const footer = page.locator("footer.site-footer");
		await expect(footer).toBeVisible();
	});

	test("visual baseline", async ({ page }) => {
		await page.goto("/");
		await expect(page).toHaveScreenshot("marketing-index.png");
	});
});
