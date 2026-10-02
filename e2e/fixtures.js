import { test as base, expect } from "@playwright/test";

const SQUARES = [
  "Top left",
  "Top center",
  "Top right",
  "Middle left",
  "Center",
  "Middle right",
  "Bottom left",
  "Bottom center",
  "Bottom right",
];

export const board = (page) => page.getByRole("grid", { name: "Game board" });

/** A square by index (0-8, row by row), found by its accessible name. */
export const square = (page, index) =>
  board(page).getByRole("button", { name: new RegExp(`^${SQUARES[index]},`) });

export const status = (page) => page.locator(".status-text");

export const announcement = (page) => page.getByRole("status");

export const score = (page, kind) =>
  page.locator(kind === "draw" ? ".score-draws .score-count" : `.score-card[data-player="${kind}"] .score-count`);

export const marks = (page) =>
  page.locator(".cell").evaluateAll((cells) => cells.map((cell) => cell.dataset.mark ?? null));

export const test = base.extend({
  /** Fails the test if the page logs an error, throws, or a request fails. */
  page: async ({ page }, use) => {
    const problems = [];
    page.on("console", (message) => {
      if (message.type() === "error") problems.push(`console: ${message.text()}`);
    });
    page.on("pageerror", (error) => problems.push(`page error: ${error.message}`));
    page.on("response", (response) => {
      if (response.status() >= 400) problems.push(`${response.status()} ${response.url()}`);
    });
    await use(page);
    expect(problems, "console errors, page errors or failed requests").toEqual([]);
  },

  /**
   * Places marks on the given squares in order, tapping on touch devices.
   * Each square is first awaited until playable, which also waits out the
   * computer's move and the board-clearing animation.
   */
  play: async ({ page, hasTouch }, use) => {
    await use(async (...cells) => {
      for (const index of cells) {
        const target = square(page, index);
        await expect(target).not.toHaveAttribute("aria-disabled");
        await (hasTouch ? target.tap() : target.click());
        await expect(target).toHaveAccessibleName(new RegExp(`^${SQUARES[index]}, [XO]`));
      }
    });
  },
});

export { expect };
