import { announcement, board, expect, square, status, test } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("a whole game can be played with the keyboard", async ({ page }) => {
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to the game board" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(square(page, 4)).toBeFocused();
  await expect(board(page)).toHaveAccessibleDescription(/arrow keys/);

  const press = async (...keys) => {
    for (const key of keys) await page.keyboard.press(key);
  };

  await press("ArrowUp", "ArrowLeft", "Enter");
  await expect(square(page, 0)).toHaveAccessibleName("Top left, X");
  await expect(announcement(page)).toHaveText(/Player X played top left\. Player O’s turn\./);

  await press("ArrowDown", " ");
  await expect(square(page, 3)).toHaveAccessibleName("Middle left, O");

  await press("ArrowUp", "ArrowRight", "Enter");
  await press("ArrowDown", "Enter");
  await expect(square(page, 4)).toHaveAccessibleName("Center, O");

  await press("ArrowUp", "ArrowRight", "Enter");
  await expect(status(page)).toHaveText("Player X wins!");
  await expect(announcement(page)).toHaveText(/Player X wins with the top row!/);

  const playAgain = page.getByRole("button", { name: "Play again" });
  await expect(playAgain).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(status(page)).toHaveText("Player X’s turn");
  await expect(square(page, 2)).toBeFocused();
  await expect(square(page, 2)).toHaveAccessibleName("Top right, empty");
});

test("arrow, Home and End keys move a single tab stop around the grid", async ({ page }) => {
  await square(page, 4).focus();
  const tabStops = board(page).locator('[tabindex="0"]');

  await page.keyboard.press("ArrowRight");
  await expect(square(page, 5)).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(square(page, 5)).toBeFocused();
  await page.keyboard.press("Home");
  await expect(square(page, 3)).toBeFocused();
  await page.keyboard.press("End");
  await expect(square(page, 5)).toBeFocused();
  await page.keyboard.press("Control+Home");
  await expect(square(page, 0)).toBeFocused();
  await page.keyboard.press("Control+End");
  await expect(square(page, 8)).toBeFocused();
  await expect(tabStops).toHaveCount(1);

  await page.keyboard.press("Shift+Tab");
  await expect(board(page).locator(":focus")).toHaveCount(0);
  await page.keyboard.press("Tab");
  await expect(square(page, 8)).toBeFocused();
});

test("occupied squares are announced instead of overwritten", async ({ page }) => {
  await square(page, 4).focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await expect(square(page, 4)).toHaveAccessibleName("Center, X");
  await expect(announcement(page)).toHaveText(/Center is taken\./);
});

test("dialogs trap focus, close with Escape and restore focus", async ({ page }) => {
  const settings = page.getByRole("button", { name: "Settings" });
  await settings.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Settings" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Close" })).toBeFocused();

  await page.keyboard.press("Tab");
  await expect(dialog.locator(":focus")).toHaveCount(1);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(settings).toBeFocused();
});

test("Ctrl+Z is ignored while typing a name", async ({ page }) => {
  await square(page, 4).click();
  await page.getByRole("button", { name: "Rename Player X, player X" }).click();
  const input = page.getByRole("textbox", { name: "Name for player X" });
  await input.fill("Ada");
  await input.press("Control+z");
  await expect(square(page, 4)).toHaveAccessibleName("Center, X");
});
