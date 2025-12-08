import { expect, test } from "@playwright/test";

test("test", async ({ page }) => {
  await page.goto("http://localhost:3005/");
  await expect(page.locator("#root")).toMatchAriaSnapshot(`
    - heading "Settings" [level=2]
    - button
    - button "General"
    - button "Themes"
    - button "Hotkeys"
    - button "API Configuration"
    - button "Plugins"
    - button "Repository"
    - button "About"
    - img "logo"
    - heading "PixelForge AI" [level=2]
    - paragraph: Studio Edition
    - text: /Version 0\\.\\d+\\.\\d+ Build Dev/
    - link "Author GitHub Profile":
      - /url: https://github.com/involvex
      - text: ""
    - link "Support on GitHub Sponsor":
      - /url: https://github.com/sponsors/involvex
    - link "Support on PayPal":
      - /url: https://paypal.me/involvex
    - link "Support on BuyMeACoffee":
      - /url: https://buymeacoffee.com/involvex
    - text: /© \\d+ Involvex\\. All rights reserved\\. Made with ❤️ and 🤖\\./
    `);
  await expect(page.getByRole("button", { name: "PixelForge" })).toBeVisible();

  await page.getByText("PIXELFORGEFileEditView").click();
  await page.getByText("PIXELFORGEFileEditView").click();
  await page.getByText("PIXELFORGEFileEditView").click();
  await expect(page.locator("#root")).toMatchAriaSnapshot(`
    - text: PIXELFORGE
    - button "File"
    - button "Edit"
    - button "View"
    `);
  await page.getByText("PixelForgeGridpxx15xLayersPalettesAI").click();
  await page.getByRole("button", { name: "File" }).click();
  await expect(
    page.getByRole("button", { name: "New Project... Ctrl+N" }),
  ).toBeVisible();

  page.once("dialog", dialog => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  await page.getByText("New Project...Ctrl+NOpen").click();
  await page.locator(".flex-1.flex.items-center").first().click();
  await page.locator("div").filter({ hasText: /^1$/ }).first().click();
  await page.locator("body").press("F5");
  await page
    .locator("canvas")
    .first()
    .click({
      position: {
        x: 102,
        y: 109,
      },
    });
  await page.locator("body").press("ControlOrMeta+a");
  await page.locator("body").click();
  await expect(page.getByRole("button", { name: "PixelForge" })).toBeVisible();

  await page.getByText("PIXELFORGEFileEditView").click();
  await expect(
    page.getByRole("button", { name: "New Project... Ctrl+N" }),
  ).toBeVisible();

  page.once("dialog", dialog => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  await page.getByText("New Project...Ctrl+NOpen").click();
  await page.getByRole("button", { name: "Edit" }).click();
  await expect(page.getByRole("button", { name: "Undo Ctrl+Z" })).toBeVisible();

  await page.locator("div:nth-child(7)").first().click();
  await page.getByText("UndoCtrl+ZRedoCtrl+YCutCtrl+").click();
  await page.getByRole("button", { name: "View" }).click();
  await expect(
    page.getByRole("button", { name: "Zoom In Ctrl++" }),
  ).toBeVisible();

  await page.getByText("Zoom InCtrl++Zoom OutCtrl+-").click();
  await page.getByText("PixelForgeGridpxx22xLayersPalettesAI").click();
  await page.locator("div").filter({ hasText: "PRISEC" }).nth(4).click();
  await expect(page.getByRole("button", { name: "Box" })).toBeVisible();

  await page.getByText("PLAYFPS:").click();
  await page.getByText("x 32px--2200%").click();
  await page.locator("div").filter({ hasText: "1" }).nth(5).click();
  await page
    .locator("div")
    .filter({ hasText: /^Layer 1100%$/ })
    .first()
    .click();
  await page
    .locator("div")
    .filter({ hasText: /^Layers$/ })
    .click();
  await page.getByRole("button", { name: "AI Studio" }).click();
  await expect(
    page.getByRole("button", { name: "Generate", exact: true }),
  ).toBeVisible();

  await page.getByText("1:19:1616:91K2KStyleDefault").click();
  await page.getByRole("textbox", { name: "A cute 8-bit dragon..." }).click();
  await page.getByRole("button", { name: "Generate Asset" }).click();
  await page.getByRole("button", { name: "Magic Edit" }).click();
  await expect(page.getByRole("button", { name: "Free" })).toBeVisible();

  await page.getByText("FreeObjectBgTrans Remove BackgroundMagic Edit").click();
  await page.getByRole("button", { name: "Search" }).click();
  await expect(
    page.getByRole("textbox", { name: "What do dungeon tiles look" }),
  ).toBeVisible();

  await page
    .locator("div")
    .filter({ hasText: /^Use Gemini to assist your workflow\.$/ })
    .first()
    .click();
  await page
    .locator("div")
    .filter({ hasText: /^Search$/ })
    .first()
    .click();
  await page.getByRole("button", { name: "Analyze" }).click();
  await expect(
    page.getByRole("textbox", { name: "Optional context for analysis" }),
  ).toBeVisible();

  await page
    .locator("div")
    .filter({ hasText: /^Analyze$/ })
    .first()
    .click();
  await page.getByText("Layers").click();
  await expect(page.getByRole("heading", { name: "Layers" })).toBeVisible();

  await page
    .locator("div")
    .filter({ hasText: /^Layer 1100%$/ })
    .first()
    .click();
  await page.getByRole("button", { name: "AI Studio" }).click();
  await expect(
    page.getByRole("button", { name: "Generate", exact: true }),
  ).toBeVisible();

  await page.getByText("Palettes").click();
  await expect(
    page.getByRole("heading", { name: "Color Palettes" }),
  ).toBeVisible();

  await page
    .getByText(
      "Active PaletteDefault (Pico-8)#FFFFFFAdd to Palette Create New Palette",
    )
    .click();
  await page.getByRole("button", { name: "Edit" }).click();
  await expect(page.getByRole("button", { name: "Undo Ctrl+Z" })).toBeVisible();

  await page.getByRole("button", { name: "Preferences" }).click();
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

  await page.getByRole("button", { name: "Themes" }).click();
  await expect(
    page.getByRole("heading", { name: "Editor Theme" }),
  ).toBeVisible();

  await page
    .locator("div")
    .filter({ hasText: "Editor ThemeDefault (Dark)" })
    .nth(5)
    .click();
  await page.getByRole("button", { name: "API Configuration" }).click();
  await expect(page.getByRole("heading", { name: "Gemini API" })).toBeVisible();

  await page.getByRole("textbox", { name: "AIzaSy..." }).click();
  page.once("dialog", dialog => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  await page.getByRole("button", { name: "Save Key" }).click();
  await page.getByRole("button", { name: "Plugins" }).click();
  await expect(
    page.getByRole("heading", { name: "Plugin Manager Download" }),
  ).toBeVisible();

  await page
    .locator("div")
    .filter({ hasText: "Plugin ManagerDownload" })
    .nth(5)
    .click();
  await page.getByRole("button", { name: "Repository" }).click();
  await expect(
    page.getByRole("heading", { name: "Repository & Docs" }),
  ).toBeVisible();

  await page
    .locator("div")
    .filter({ hasText: "Repository & DocsPixelForge" })
    .nth(5)
    .click();
  await page.locator(".h-14 > .text-gray-400").click();
  await page.getByText("PixelForge", { exact: true }).click();
});
