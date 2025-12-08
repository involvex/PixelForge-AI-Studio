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
});
