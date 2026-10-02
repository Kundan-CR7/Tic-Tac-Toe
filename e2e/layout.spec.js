import { board, expect, test } from "./fixtures";

const VIEWPORTS = [
  { name: "small phone", width: 360, height: 640, touch: true },
  { name: "phone", width: 390, height: 844, touch: true },
  { name: "phone landscape", width: 844, height: 390, touch: true },
  { name: "tablet", width: 820, height: 1180, touch: true },
  { name: "laptop", width: 1280, height: 720 },
  { name: "desktop", width: 1440, height: 900 },
];

/** Board squares, toolbar and game controls. */
const PRIMARY_TARGET = 44;
/** WCAG 2.5.8 minimum, for compact controls such as segmented options. */
const MIN_TARGET = 24;

const inViewport = (box, viewport) =>
  box.x >= 0 && box.y >= 0 && box.x + box.width <= viewport.width + 0.5 && box.y + box.height <= viewport.height + 0.5;

for (const viewport of VIEWPORTS) {
  test.describe(`${viewport.name} (${viewport.width}×${viewport.height})`, () => {
    test.use({
      viewport: { width: viewport.width, height: viewport.height },
      isMobile: Boolean(viewport.touch),
      hasTouch: Boolean(viewport.touch),
    });

    test("fits the board and controls on screen without overflow", async ({ page }) => {
      await page.goto("/");
      await expect(board(page)).toBeVisible();

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, "horizontal overflow in px").toBeLessThanOrEqual(0);

      for (const locator of [
        page.locator(".board-frame"),
        page.locator(".status-pill"),
        page.getByRole("button", { name: "Undo" }),
        page.getByRole("button", { name: "Restart" }),
      ]) {
        const box = await locator.boundingBox();
        expect(box, "element is rendered").not.toBeNull();
        expect(inViewport(box, viewport), `${await locator.evaluate((el) => el.className)} is fully visible`).toBe(true);
      }
    });

    test("keeps touch targets comfortably large", async ({ page }) => {
      await page.goto("/");
      const measure = (selector) =>
        page.locator(selector).evaluateAll((elements) =>
          elements
            .filter((element) => element.getClientRects().length > 0)
            .map((element) => {
              const { width, height } = element.getBoundingClientRect();
              const label = element.getAttribute("aria-label") ?? element.textContent.trim();
              return { label, width: Math.round(width), height: Math.round(height) };
            }),
        );
      const below = (targets, min) => targets.filter((target) => target.width < min || target.height < min);

      const primary = await measure(".cell, .icon-btn, .controls .btn");
      expect(primary.length).toBeGreaterThanOrEqual(13);
      expect(below(primary, PRIMARY_TARGET), `primary targets under ${PRIMARY_TARGET}px`).toEqual([]);

      const secondary = await measure(".segmented-option, .name-button, .choice");
      expect(below(secondary, MIN_TARGET), `targets under ${MIN_TARGET}px`).toEqual([]);
    });
  });
}

test.describe("phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test("opens the match history as a sheet", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Match history" }).tap();
    const dialog = page.getByRole("dialog", { name: "Match history" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Finished games will show up here")).toBeVisible();
    await dialog.evaluate((element) => Promise.all(element.getAnimations().map((animation) => animation.finished)));
    const box = await dialog.boundingBox();
    expect(Math.round(box.y + box.height)).toBe(844);
    await dialog.getByRole("button", { name: "Close" }).tap();
    await expect(dialog).toBeHidden();
  });
});
