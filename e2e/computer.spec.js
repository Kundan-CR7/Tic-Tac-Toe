import { announcement, expect, marks, score, square, status, test } from "./fixtures";

const PREFERENCE = [4, 0, 2, 6, 8, 1, 3, 5, 7];

async function chooseComputer(page, difficulty) {
  await page.getByRole("radio", { name: "vs Computer" }).check();
  await page.getByRole("radio", { name: difficulty }).check();
  await expect(page.getByRole("radio", { name: difficulty })).toBeChecked();
}

/** Plays the first free square in a fixed preference order until the game ends. */
async function playOut(page, play) {
  for (let turn = 0; turn < 5; turn++) {
    await expect(status(page)).toHaveText(/Your turn|win|draw/, { timeout: 5000 });
    if ((await status(page).textContent()) !== "Your turn") return;
    const board = await marks(page);
    await play(PREFERENCE.find((cell) => board[cell] === null));
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("hard computer thinks before moving and never loses", async ({ page, play }) => {
  await chooseComputer(page, "Hard");
  await expect(status(page)).toHaveText("Your turn");
  await expect(page.getByText("Perfect play. It never loses", { exact: false }).first()).toBeAttached();

  await play(4);
  await expect(status(page)).toHaveText("Computer is thinking");
  await expect(page.locator('.score-card[data-player="O"]')).toHaveAttribute("data-thinking");
  await expect(square(page, 0)).toHaveAttribute("aria-disabled", "true");
  await expect(status(page)).toHaveText("Your turn");
  await expect(announcement(page)).toHaveText(/^Computer played .+\. Your turn\./);
  expect((await marks(page)).filter(Boolean)).toHaveLength(2);

  await playOut(page, play);
  await expect(status(page)).toHaveText(/^(It’s a draw|Computer wins)$/);
  await expect(score(page, "X")).toHaveText("0");
});

test("easy computer plays a full game to a result", async ({ page, play }) => {
  await chooseComputer(page, "Easy");
  await playOut(page, play);
  await expect(status(page)).toHaveText(/^(You win!|Computer wins|It’s a draw)$/);
  const total = await Promise.all(["X", "O", "draw"].map((kind) => score(page, kind).textContent()));
  expect(total.map(Number).reduce((sum, value) => sum + value, 0)).toBe(1);
});

test("hard computer answers a corner with the center and blocks each threat", async ({ page, play }) => {
  await chooseComputer(page, "Hard");
  await play(0);
  await expect(square(page, 4)).toHaveAccessibleName("Center, O");
  await play(1);
  await expect(square(page, 2)).toHaveAccessibleName("Top right, O");
  await play(6);
  await expect(square(page, 3)).toHaveAccessibleName("Middle left, O");
});

test("undo against the computer returns to your turn", async ({ page, play }) => {
  await chooseComputer(page, "Medium");
  await play(4);
  await expect(status(page)).toHaveText("Your turn");
  expect((await marks(page)).filter(Boolean)).toHaveLength(2);

  await page.getByRole("button", { name: "Undo" }).click();
  await expect.poll(() => marks(page)).toEqual(Array(9).fill(null));
  await expect(status(page)).toHaveText("Your turn");
});

test("the computer opens when it moves first", async ({ page }) => {
  await chooseComputer(page, "Hard");
  await page.getByRole("button", { name: "Settings" }).click();
  const dialog = page.getByRole("dialog", { name: "Settings" });
  await dialog.getByRole("group", { name: "First move" }).getByRole("radio", { name: "Computer" }).check();
  await dialog.getByRole("button", { name: "Close" }).click();

  await expect(status(page)).toHaveText("Your turn");
  expect((await marks(page)).filter((mark) => mark === "O")).toHaveLength(1);
});
