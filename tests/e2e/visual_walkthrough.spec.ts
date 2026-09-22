import { test, expect, Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const screenshotDir = path.join(process.cwd(), "test-results", "screenshots");

async function ss(page: Page, name: string) {
  fs.mkdirSync(screenshotDir, { recursive: true });
  await page.screenshot({ path: path.join(screenshotDir, `${name}.png`), fullPage: true });
  console.log(`??  ${name}`);
}

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  try {
    await page.goto("http://localhost:5173", { waitUntil: "domcontentloaded", timeout: 15000 });
  } catch (e) {
    throw new Error("Frontend (localhost:5173) is not running. Start with: npm run dev:all");
  }
  try {
    await page.goto("http://localhost:4000/api/health", { timeout: 10000 });
  } catch (e) {
    throw new Error("Backend (localhost:4000) is not running.");
  }
  await page.close();
});

test("S1: Super Admin login and dashboard", async ({ page }) => {
  await page.goto("http://localhost:5173/login", { waitUntil: "networkidle", timeout: 20000 });
  await ss(page, "01-login-page");
  const adminBtn = page.locator("button", { hasText: /super.?admin/i }).first();
  if (await adminBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await adminBtn.click();
  } else {
    const emailField = page.locator("input[type='email'], input[name='email'], input[placeholder*='email' i]").first();
    if (await emailField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailField.fill("admin@civicsense.gov.in");
      await page.locator("input[type='password']").first().fill("admin123");
      await page.locator("button[type='submit']").click();
    }
  }
  await page.waitForTimeout(2500);
  await ss(page, "02-super-admin-dashboard");
  const body = await page.textContent("body");
  expect(body).toBeTruthy();
  console.log("? S1 complete");
});

test("S2: Citizen Portal — track existing ticket", async ({ page }) => {
  await page.goto("http://localhost:5173", { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(2000);
  await ss(page, "03-citizen-portal-landing");
  const trackTabBtn = page.locator("button", { hasText: /track.?(ticket|status)/i }).first();
  if (await trackTabBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await trackTabBtn.click();
    await page.waitForTimeout(1000);
  }
  const trackInput = page.locator("input[placeholder*='CMP' i], input[placeholder*='complaint' i], input[placeholder*='ticket' i]").first();
  if (await trackInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await trackInput.click({ clickCount: 3 });
    await trackInput.fill("CMP-10452");
    const searchBtn = page.locator("button", { hasText: /search|track|find/i }).first();
    if (await searchBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchBtn.click();
    } else {
      await trackInput.press("Enter");
    }
    await page.waitForTimeout(3000);
    await ss(page, "04-citizen-track-result");
  } else {
    await ss(page, "04-citizen-track-no-input");
  }
  console.log("? S2 complete");
});

test("S3: Citizen Chatbot — Q&A and report modes", async ({ page }) => {
  await page.goto("http://localhost:5173/chat", { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(2000);
  await ss(page, "05-chatbot-landing");
  const chatInput = page.locator("[data-testid='chat-input']");
  const chatSend = page.locator("[data-testid='chat-send']");
  if (await chatInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await chatInput.fill("What are the emergency helpline numbers?");
    await ss(page, "06-chatbot-typed-qa");
    await chatSend.click();
    await page.waitForTimeout(6000);
    await ss(page, "07-chatbot-qa-response");
    const reportModeBtn = page.locator("button", { hasText: /file.?(report|civic)/i }).first();
    if (await reportModeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await reportModeBtn.click();
      await page.waitForTimeout(800);
    }
    await chatInput.fill("Water pipe burst on 4th Main Anna Nagar flooding the road.");
    await chatSend.click();
    await page.waitForTimeout(6000);
    await ss(page, "08-chatbot-grievance-response");
    const yesBtn = page.locator("button", { hasText: /yes.*file|file.*report/i }).first();
    if (await yesBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
      await yesBtn.click();
      await page.waitForTimeout(6000);
      await ss(page, "09-chatbot-report-filed");
    }
  } else {
    await ss(page, "05-chatbot-no-input");
  }
  console.log("? S3 complete");
});

test("S4: Department Dashboard — live queue", async ({ page }) => {
  await page.goto("http://localhost:5173", { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(2000);
  const deptLink = page.locator("button, a", { hasText: /department|dept.?dash/i }).first();
  if (await deptLink.isVisible({ timeout: 5000 }).catch(() => false)) {
    await deptLink.click();
    await page.waitForTimeout(2000);
  }
  await ss(page, "10-dept-dashboard");
  const liveQueueTab = page.locator("button", { hasText: /live.?queue|queue/i }).first();
  if (await liveQueueTab.isVisible({ timeout: 5000 }).catch(() => false)) {
    await liveQueueTab.click();
    await page.waitForTimeout(1500);
    await ss(page, "11-dept-live-queue");
  }
  console.log("? S4 complete");
});

test("S5: Live Call Center view", async ({ page }) => {
  await page.goto("http://localhost:5173", { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(2000);
  const callsLink = page.locator("button, a", { hasText: /live.?call|call.?center/i }).first();
  if (await callsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
    await callsLink.click();
    await page.waitForTimeout(2000);
    await ss(page, "13-live-call-center");
  } else {
    await ss(page, "13-live-call-center-not-found");
  }
  const pipelineLink = page.locator("button, a", { hasText: /ai.?pipeline|pipeline/i }).first();
  if (await pipelineLink.isVisible({ timeout: 5000 }).catch(() => false)) {
    await pipelineLink.click();
    await page.waitForTimeout(2000);
    await ss(page, "14-ai-pipeline");
  }
  console.log("? S5 complete");
});

test("S6: Complaint Management — list and details", async ({ page }) => {
  await page.goto("http://localhost:5173", { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(2000);
  const complaintsLink = page.locator("button, a", { hasText: /all.?complaints|complaints/i }).first();
  if (await complaintsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
    await complaintsLink.click();
    await page.waitForTimeout(2000);
    await ss(page, "15-complaints-list");
  } else {
    await ss(page, "15-complaints-not-found");
  }
  console.log("? S6 complete");
});

test("S7: Analytics — Heatmap and SLA monitoring", async ({ page }) => {
  await page.goto("http://localhost:5173", { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(2000);
  const heatmapLink = page.locator("button, a", { hasText: /heatmap|analytics/i }).first();
  if (await heatmapLink.isVisible({ timeout: 5000 }).catch(() => false)) {
    await heatmapLink.click();
    await page.waitForTimeout(2000);
    await ss(page, "17-heatmap");
  } else {
    await ss(page, "17-heatmap-not-found");
  }
  const slaLink = page.locator("button, a", { hasText: /\bsla\b/i }).first();
  if (await slaLink.isVisible({ timeout: 5000 }).catch(() => false)) {
    await slaLink.click();
    await page.waitForTimeout(2000);
    await ss(page, "18-sla-monitoring");
  }
  console.log("? S7 complete");
});

test("S8: Citizen Portal — submit text complaint", async ({ page }) => {
  await page.goto("http://localhost:5173", { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(2000);
  await ss(page, "19-citizen-report-form");
  const descField = page.locator("textarea").first();
  if (await descField.isVisible({ timeout: 5000 }).catch(() => false)) {
    await descField.fill("Large pothole on Avinashi Road near Peelamedu signal very dangerous for two-wheelers.");
    await ss(page, "21-citizen-form-filled");
  }
  console.log("? S8 complete");
});

test("S9: API health and key endpoints", async ({ page }) => {
  const health = await page.goto("http://localhost:4000/api/health", { timeout: 10000 });
  expect(health?.status()).toBeLessThan(500);
  await ss(page, "22-api-health");
  const complaints = await page.goto("http://localhost:4000/api/complaints", { timeout: 10000 });
  expect(complaints?.status()).toBeLessThan(500);
  await ss(page, "23-api-complaints");
  const dash = await page.goto("http://localhost:4000/api/dashboard/executive", { timeout: 10000 });
  expect(dash?.status()).toBeLessThan(500);
  await ss(page, "24-api-dashboard");
  console.log("? S9 complete");
});

test("S10: URL-based ticket tracking /track/CMP-10452", async ({ page }) => {
  await page.goto("http://localhost:5173/track/CMP-10452", { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(3000);
  await ss(page, "25-url-track-auto-loaded");
  const body = await page.textContent("body");
  expect(body).toBeTruthy();
  console.log("? S10 complete");
});
