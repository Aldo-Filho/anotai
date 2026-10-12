import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/web",
  timeout: 20000,
  expect: { timeout: 10000 },
  workers: 1,
  fullyParallel: false,
  use: {
    baseURL: "http://localhost:8081",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command:
        "npm run build --workspace backend && npm start --workspace backend",
      url: "http://localhost:3000/api/users/me",
      reuseExistingServer: !process.env.CI,
      timeout: 60000,
    },
    {
      command: "npm run dev --workspace mobile -- --port 8081",
      url: "http://localhost:8081",
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      env: { EXPO_PUBLIC_API_URL: "http://localhost:3000/api", CI: "1" },
    },
  ],
});
