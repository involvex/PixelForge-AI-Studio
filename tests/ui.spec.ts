import { expect, test } from "@playwright/test";

test.describe("PixelForge UI Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Log console messages
    page.on("console", msg => console.log(`BROWSER LOG: ${msg.text()}`));

    // Go to home and wait for network idle to ensure resources loaded
    await page.goto("/");
    try {
      await page.waitForLoadState("networkidle", { timeout: 10000 });
    } catch {
      console.log("Network idle timeout, proceeding anyway");
    }
  });

  test("should verify application title", async ({ page }) => {
    console.log("Checking title...");
    const title = await page.title();
    console.log(`Current title: ${title}`);
    await expect(page).toHaveTitle(/PixelForge/);
  });

  test("should toggle panel visibility via View menu", async ({ page }) => {
    // 1. Open View Menu
    await page.getByText("View").click();

    // 2. Check if "Tools" is visible (should be checked)
    const toolsOption = page.getByRole("menuitem", { name: "Tools" });
    await expect(toolsOption).toBeVisible();

    // 3. Click "Tools" to toggle OFF
    await toolsOption.click();

    // Wait for UI update
    await page.waitForTimeout(500);

    // 4. Verify Tools panel is hidden
    // We look for the "Pencil" tool button which should be in the Tools panel
    const pencilButton = page.getByTitle("Pencil");
    if ((await pencilButton.count()) > 0) {
      await expect(pencilButton).not.toBeVisible();
    }

    // 5. Toggle ON again
    await page.getByText("View").click();
    await toolsOption.click();
    await page.waitForTimeout(500);
    await expect(page.getByTitle("Pencil")).toBeVisible();
  });

  test("should open Settings modal", async ({ page }) => {
    // Edit -> Preferences
    await page.getByText("Edit").click();
    await page.getByRole("menuitem", { name: "Preferences" }).click();

    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();
    await expect(modal).toContainText("Settings");

    // Close it
    await page.keyboard.press("Escape");
    await expect(modal).not.toBeVisible();
  });
});
