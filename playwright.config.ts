import { defineConfig } from "@playwright/test";

// Story 5.5: pauses the production build served locally. Run `pnpm -r build` first.
// Chrome (not Playwright's Chromium) because the sample videos are H.264; GitHub's Ubuntu runners ship Chrome.
export default defineConfig({
  testDir: "tests/browser",
  testMatch: "*.browser.ts",
  reporter: "list",
  use: { baseURL: "http://localhost:4173/pausall/", channel: "chrome", headless: true },
  webServer: {
    command: "node node_modules/vite/bin/vite.js preview --port 4173 --strictPort",
    cwd: "apps/web",
    url: "http://localhost:4173/pausall/",
    reuseExistingServer: false,
  },
});
