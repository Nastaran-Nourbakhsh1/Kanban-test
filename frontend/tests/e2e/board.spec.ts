import { test, expect, type Page } from "@playwright/test";
async function drag(page: Page, cardId: string, targetId: string) {
  const handle = page
    .getByTestId(cardId)
    .getByRole("button", { name: /^جابه‌جایی/ });
  const target = page.getByTestId(targetId);
  await handle.scrollIntoViewIfNeeded();
  const source = await handle.boundingBox();
  const dest = await target.boundingBox();
  if (!source || !dest) throw new Error("Missing drag bounds");
  await page.mouse.move(
    source.x + source.width / 2,
    source.y + source.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    source.x + source.width / 2 + 12,
    source.y + source.height / 2,
    { steps: 3 },
  );
  await page.mouse.move(dest.x + dest.width / 2, dest.y + dest.height / 2, {
    steps: 20,
  });
  await page.mouse.up();
}
test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("column-0")).toBeVisible();
});
test("Persian board, creation validation, rename, move, delete and reload reset", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("region")).toHaveCount(5);
  await page
    .getByTestId("column-0")
    .getByRole("button", { name: "افزودن کارت" })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "افزودن کارت" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await dialog.getByLabel(/عنوان کارت/).fill("کارت تست");
  await dialog
    .getByLabel(/جزئیات/)
    .fill("خط اول\nخط دوم " + "جزئیات طولانی ".repeat(20));
  await dialog.getByRole("button", { name: "افزودن کارت" }).click();
  await expect(
    page.getByTestId("column-0").getByText("کارت تست", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "تغییر نام ایده‌ها" }).click();
  await page.getByLabel("نام ستون", { exact: true }).fill("ایده‌های جدید");
  await page.getByLabel("نام ستون", { exact: true }).press("Enter");
  await expect(
    page.getByRole("region", { name: "ایده‌های جدید" }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "انتقال کارت تست به ستون" })
    .selectOption("column-1");
  await expect(
    page.getByTestId("column-1").getByText("کارت تست", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "حذف کارت تست", exact: true }).click();
  await page.getByRole("button", { name: "انصراف" }).click();
  await expect(page.getByText("کارت تست", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "حذف کارت تست", exact: true }).click();
  await page.getByRole("button", { name: "حذف کارت", exact: true }).click();
  await expect(page.getByText("کارت تست", { exact: true })).toHaveCount(0);
  await expect(
    page.getByTestId("column-1").getByRole("button", { name: "افزودن کارت" }),
  ).toBeFocused();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "تغییر نام ایده‌ها" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("pointer drag to populated and empty columns, same-column ordering", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1500, height: 1000 });
  await drag(page, "card-0-0", "card-1-0");
  await expect(
    page.getByTestId("column-1").getByTestId("card-0-0"),
  ).toBeVisible();
  await page
    .getByTestId("card-3-0")
    .getByRole("combobox")
    .selectOption("column-4");
  await expect(
    page.getByTestId("column-3").getByText("کارت را اینجا رها کنید"),
  ).toBeVisible();
  await drag(page, "card-0-1", "column-3");
  await expect(
    page.getByTestId("column-3").getByTestId("card-0-1"),
  ).toBeVisible();
  await drag(page, "card-1-1", "card-0-0");
  await expect(
    page.getByTestId("column-1").locator("article").first(),
  ).toHaveAttribute("data-testid", "card-1-1");
});
test("keyboard drag moves cards and Escape cancels without mutation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1500, height: 1000 });
  const handle = page
    .getByTestId("card-0-0")
    .getByRole("button", { name: /^جابه‌جایی/ });
  await handle.focus();
  await page.keyboard.press("Space", { delay: 50 });
  await expect(handle).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Escape");
  await expect(handle).not.toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByTestId("column-0").locator("article").first(),
  ).toHaveAttribute("data-testid", "card-0-0");
  await handle.focus();
  await page.keyboard.press("Space", { delay: 50 });
  await expect(handle).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("ArrowLeft");
  await expect(
    page.getByText("مقصد: برای انجام", { exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Space", { delay: 50 });
  await expect(
    page.getByTestId("column-1").getByTestId("card-0-0"),
  ).toBeVisible();
});
test("dialog traps focus, supports Escape, and column rename cancels", async ({
  page,
}) => {
  const add = page
    .getByTestId("column-0")
    .getByRole("button", { name: "افزودن کارت" });
  await add.click();
  await expect(page.getByLabel(/عنوان کارت/)).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(
    page.getByRole("button", { name: "بستن", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(add).toBeFocused();
  await page.getByRole("button", { name: "تغییر نام ایده‌ها" }).click();
  await page.getByLabel("نام ستون", { exact: true }).fill("لغو");
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "تغییر نام ایده‌ها" }),
  ).toBeVisible();
});
for (const width of [375, 768, 1440])
  test(`responsive layout at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`board-${width}.png`),
      fullPage: true,
    });
    await page
      .getByTestId("column-4")
      .getByRole("button", { name: "افزودن کارت" })
      .click();
    await expect(page.getByRole("dialog")).toBeInViewport();
    await page.getByLabel(/عنوان کارت/).fill("کارت موبایل");
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "افزودن کارت" })
      .click();
    await expect(
      page.getByTestId("column-4").getByText("کارت موبایل"),
    ).toBeVisible();
  });

test("touch pointer drags a card between columns", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1500, height: 1000 },
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto("/");
  const handle = page
    .getByTestId("card-0-0")
    .getByRole("button", { name: /^جابه‌جایی/ });
  const source = await handle.boundingBox();
  const target = await page.getByTestId("card-1-0").boundingBox();
  if (!source || !target) throw new Error("Missing touch bounds");
  const session = await context.newCDPSession(page);
  const x = source.x + source.width / 2,
    y = source.y + source.height / 2;
  const tx = target.x + target.width / 2,
    ty = target.y + target.height / 2;
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y }],
  });
  for (let i = 1; i <= 15; i++)
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: x + ((tx - x) * i) / 15, y: y + ((ty - y) * i) / 15 }],
    });
  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect(
    page.getByTestId("column-1").getByTestId("card-0-0"),
  ).toBeVisible();
  await context.close();
});
