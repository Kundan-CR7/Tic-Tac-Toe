import { expect, status, test } from "./fixtures";

const html = (page) => page.locator("html");
const themeColor = (page) => page.locator('meta[name="theme-color"]');

test.describe("with a dark system theme", () => {
  test.use({ colorScheme: "dark" });

  test("follows the system, then remembers a manual choice", async ({ page }) => {
    await page.goto("/");
    await expect(html(page)).toHaveAttribute("data-theme", "dark");
    await expect(themeColor(page)).toHaveAttribute("content", "#12110f");

    await page.getByRole("button", { name: "Switch to light theme" }).click();
    await expect(html(page)).toHaveAttribute("data-theme", "light");
    await expect(themeColor(page)).toHaveAttribute("content", "#f6f3ec");
    await expect(page.getByRole("button", { name: "Switch to dark theme" })).toBeVisible();

    await page.reload();
    await expect(html(page)).toHaveAttribute("data-theme", "light");

    await page.getByRole("button", { name: "Settings" }).click();
    const theme = page.getByRole("dialog", { name: "Settings" }).getByRole("group", { name: "Theme" });
    await expect(theme.getByRole("radio", { name: "Light" })).toBeChecked();
    await theme.getByRole("radio", { name: "System" }).check();
    await expect(html(page)).toHaveAttribute("data-theme", "dark");
  });

  test("applies the theme before the app script runs", async ({ page }) => {
    await page.route(/\/assets\/.*\.js$/, (route) => route.fulfill({ contentType: "text/javascript", body: "" }));
    await page.goto("/");
    await expect(page.locator("#root")).toBeEmpty();
    await expect(html(page)).toHaveAttribute("data-theme", "dark");
    await expect(themeColor(page)).toHaveAttribute("content", "#12110f");
  });
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("skips the confetti and collapses animations", async ({ page, play }) => {
    await page.goto("/");
    await expect(html(page)).toHaveAttribute("data-motion", "reduce");
    await play(0, 3, 1, 4, 2);
    await expect(status(page)).toHaveText("Player X wins!");
    await page.waitForTimeout(1000);
    await expect(page.locator("canvas.confetti")).toHaveCount(0);
    const duration = await page.locator(".cell").first().evaluate((cell) => getComputedStyle(cell).transitionDuration);
    expect(duration.split(",").every((value) => parseFloat(value) <= 0.001)).toBe(true);
  });

  test("can be overridden in settings", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Settings" }).click();
    const motion = page.getByRole("dialog", { name: "Settings" }).getByRole("group", { name: "Animations" });
    await motion.getByRole("radio", { name: "Full" }).check();
    await expect(html(page)).toHaveAttribute("data-motion", "full");
  });
});

test("a win is celebrated with confetti that cleans up after itself", async ({ page, play }) => {
  await page.goto("/");
  await expect(html(page)).toHaveAttribute("data-motion", "full");
  await play(0, 3, 1, 4, 2);
  await expect(page.locator("canvas.confetti")).toHaveCount(1);
  await expect(page.locator("canvas.confetti")).toHaveCount(0, { timeout: 8000 });
});

test("sound is off by default and the choice is remembered", async ({ page }) => {
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Sound effects" });
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");

  await page.reload();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Settings" }).click();
  await expect(page.getByRole("switch", { name: "Sound effects" })).toBeChecked();
});
