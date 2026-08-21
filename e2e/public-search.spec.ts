import { expect, test } from "@playwright/test";

test("public job search is keyboard-accessible", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "หางานที่ใช่ จากบริษัทที่ตรวจสอบแล้ว" })).toBeVisible();
  await page.getByLabel("ตำแหน่งงาน หรือ คำค้นหา").fill("Developer");
  await page.getByRole("button", { name: "ค้นหางาน" }).click();

  await expect(page.getByText(/พบ \d+ ตำแหน่งงาน|ไม่พบงานที่ตรงกับการค้นหา/)).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus-visible")).toHaveCount(1);
});
