import { expect, test } from "@playwright/test";

function uniqueEmail(role: string) {
  return `e2e-${role}-${Date.now()}-${Math.random().toString(16).slice(2)}@example.test`;
}

test("candidate can register and is denied employer data", async ({ page }) => {
  await page.goto("/");
  const registration = await page.evaluate(async (email) => {
    const response = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: "candidate", displayName: "E2E Candidate", email, password: "correct-password" }) });
    return { status: response.status, body: await response.json() };
  }, uniqueEmail("candidate"));
  expect(registration.status).toBe(201);
  await page.goto("/candidate");
  await expect(page).toHaveURL(/\/candidate$/);
  const response = await page.evaluate(async () => (await fetch("/api/employer/applications")).status);
  expect(response).toBe(403);
});

test("employer can register and access employer applications", async ({ page }) => {
  await page.goto("/");
  const registration = await page.evaluate(async (email) => {
    const response = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: "employer", companyName: "E2E Company", email, password: "correct-password" }) });
    return { status: response.status, body: await response.json() };
  }, uniqueEmail("employer"));
  expect(registration.status).toBe(201);
  await page.goto("/employer");
  await expect(page).toHaveURL(/\/employer$/);
  const response = await page.evaluate(async () => (await fetch("/api/employer/applications")).status);
  expect(response).toBe(200);
});
