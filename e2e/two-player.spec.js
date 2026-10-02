import { announcement, expect, marks, score, square, status, test } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("X wins with the top row and the result is recorded", async ({ page, play }) => {
  await expect(status(page)).toHaveText("Player X’s turn");
  await play(0, 3, 1, 4);
  await expect(status(page)).toHaveText("Player X’s turn");
  await play(2);

  await expect(status(page)).toHaveText("Player X wins!");
  await expect(announcement(page)).toHaveText(/Player X played top right\. Player X wins with the top row!/);
  for (const index of [0, 1, 2]) {
    await expect(square(page, index)).toHaveAccessibleName(/, X, winning line$/);
  }
  await expect(square(page, 8)).toHaveAttribute("aria-disabled", "true");
  await expect(score(page, "X")).toHaveText("1");
  await expect(score(page, "O")).toHaveText("0");
  await expect(page.getByRole("button", { name: "Play again" })).toBeVisible();
});

test("a full board without a line is a draw", async ({ page, play }) => {
  await play(0, 1, 2, 4, 3, 5, 7, 6, 8);

  await expect(status(page)).toHaveText("It’s a draw");
  await expect(announcement(page)).toHaveText(/It’s a draw\./);
  await expect(score(page, "draw")).toHaveText("1");
  await expect(page.locator(".board-frame")).toHaveAttribute("data-status", "draw");
});

test("O can win, and Play again starts a fresh round", async ({ page, play }) => {
  await play(0, 4, 1, 2, 8, 6);
  await expect(status(page)).toHaveText("Player O wins!");
  await expect(score(page, "O")).toHaveText("1");

  await page.getByRole("button", { name: "Play again" }).click();
  await expect(status(page)).toHaveText("Player X’s turn");
  await expect.poll(() => marks(page)).toEqual(Array(9).fill(null));
  await expect(page.getByRole("button", { name: "Restart" })).toBeVisible();
  await expect(score(page, "O")).toHaveText("1");
});

test("undo, keyboard undo and restart", async ({ page, play }) => {
  const undo = page.getByRole("button", { name: "Undo" });
  await expect(undo).toBeDisabled();

  await play(4, 0, 8);
  await undo.click();
  await expect(square(page, 8)).toHaveAccessibleName("Bottom right, empty");
  await expect(status(page)).toHaveText("Player X’s turn");
  await expect(announcement(page)).toHaveText(/Move undone\. Player X’s turn\./);

  await page.keyboard.press("Control+z");
  await expect(square(page, 0)).toHaveAccessibleName("Top left, empty");
  await expect(status(page)).toHaveText("Player O’s turn");

  await page.getByRole("button", { name: "Restart" }).click();
  await expect.poll(() => marks(page)).toEqual(Array(9).fill(null));
  await expect(undo).toBeDisabled();
});

test("taken squares cannot be overwritten", async ({ page, play }) => {
  await play(4);
  // Taken squares are aria-disabled but still respond, so pointer users get feedback.
  await square(page, 4).click({ force: true });
  await expect(square(page, 4)).toHaveAccessibleName("Center, X");
  await expect(status(page)).toHaveText("Player O’s turn");
  await expect(announcement(page)).toHaveText(/Center is taken\./);
});

test("players can be renamed and names are remembered", async ({ page, play }) => {
  await page.getByRole("button", { name: "Rename Player X, player X" }).click();
  const input = page.getByRole("textbox", { name: "Name for player X" });
  await input.fill("Ada");
  await input.press("Enter");
  await expect(status(page)).toHaveText("Ada’s turn");
  await expect(page.getByRole("button", { name: "Rename Ada, player X" })).toBeFocused();

  await page.getByRole("button", { name: "Settings" }).click();
  const dialog = page.getByRole("dialog", { name: "Settings" });
  await dialog.getByRole("textbox", { name: "Player O" }).fill("Grace");
  await dialog.getByRole("button", { name: "Close" }).click();
  await expect(dialog).toBeHidden();

  await play(0, 3, 1, 4, 2);
  await expect(status(page)).toHaveText("Ada wins!");

  await page.reload();
  await expect(page.getByRole("button", { name: "Rename Ada, player X" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Rename Grace, player O" })).toBeVisible();
  await expect(score(page, "X")).toHaveText("1");
});

test("choosing who moves first", async ({ page, play }) => {
  await page.getByRole("button", { name: "Settings" }).click();
  const dialog = page.getByRole("dialog", { name: "Settings" });
  await dialog.getByRole("group", { name: "First move" }).getByRole("radio", { name: "Player O" }).check();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();

  await expect(status(page)).toHaveText("Player O’s turn");
  await play(4);
  await expect(square(page, 4)).toHaveAccessibleName("Center, O");
});

test("an unfinished round and the scores survive a reload", async ({ page, play }) => {
  await play(0, 3, 1, 4, 2);
  await page.getByRole("button", { name: "Play again" }).click();
  await play(4, 0);

  await page.reload();
  await expect(score(page, "X")).toHaveText("1");
  await expect(square(page, 4)).toHaveAccessibleName("Center, X");
  await expect(square(page, 0)).toHaveAccessibleName("Top left, O");
  await expect(status(page)).toHaveText("Player X’s turn");
});

test("finished games appear in the match history", async ({ page, play }) => {
  await play(0, 3, 1, 4, 2);
  await page.getByRole("button", { name: "Play again" }).click();
  await play(0, 1, 2, 4, 3, 5, 7, 6, 8);

  const historyButton = page.getByRole("button", { name: "Match history" });
  if (await historyButton.isVisible()) await historyButton.click();
  const list = page.getByRole("list", { name: "Recent games, newest first" });
  await expect(list.getByRole("listitem")).toHaveCount(2);
  await expect(list.getByRole("listitem").first()).toContainText("Draw");
  await expect(list.getByRole("listitem").nth(1)).toContainText("Player X won");
  await expect(page.getByRole("img", { name: "Player X: 1, Draws: 1, Player O: 0" }).first()).toBeVisible();
});
