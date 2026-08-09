import { test, expect, type Page } from "@playwright/test";

// Golden path: address → insights → shareable URL renders identically in a fresh context.
// Uses a well-known urban address so Nominatim + Overpass return meaningful data.

const KNOWN_ADDRESS = "Times Square, New York";

test("search → insights → shareable URL", async ({ page, context }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/three scores/i);

  const input = page.getByPlaceholder(/street address/i);
  await input.click();
  await input.fill(KNOWN_ADDRESS);

  // Wait for the autocomplete popover
  const suggestion = page.locator("[role=listbox] button").first();
  await expect(suggestion).toBeVisible({ timeout: 20_000 });
  await suggestion.click();

  // Wait for redirect to insights page and scores to render
  await page.waitForURL(/\/a\/[a-z0-9]{8}$/i, { timeout: 60_000 });
  const walk = page.getByTestId("score-walking-score-value");
  const drive = page.getByTestId("score-driving-score-value");
  const urban = page.getByTestId("urban-label");

  await expect(walk).toBeVisible({ timeout: 30_000 });
  await expect(drive).toBeVisible();
  await expect(urban).toBeVisible();

  const original = await snapshotScores(page);
  expect(original.walk).toBeGreaterThanOrEqual(0);
  expect(original.walk).toBeLessThanOrEqual(100);
  expect(original.drive).toBeGreaterThanOrEqual(0);
  expect(original.drive).toBeLessThanOrEqual(100);
  expect(["urban", "suburban", "rural"]).toContain(original.urban);

  // Grab the current URL and re-open it in a fresh context
  const shareUrl = page.url();
  const freshContext = await context.browser()!.newContext({
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const freshPage = await freshContext.newPage();
  await freshPage.goto(shareUrl);

  await expect(freshPage.getByTestId("score-walking-score-value")).toBeVisible({ timeout: 30_000 });
  const reopened = await snapshotScores(freshPage);
  expect(reopened).toEqual(original);

  await freshContext.close();
});

async function snapshotScores(page: Page): Promise<{ walk: number; drive: number; urban: string }> {
  const parseScore = async (id: string) => {
    const t = (await page.getByTestId(id).textContent()) ?? "";
    return parseInt(t.replace(/[^0-9-].*$/, ""), 10);
  };
  return {
    walk: await parseScore("score-walking-score-value"),
    drive: await parseScore("score-driving-score-value"),
    urban: ((await page.getByTestId("urban-label").textContent()) ?? "").trim().toLowerCase(),
  };
}
