import { chromium } from "playwright";

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
page.on("console", (m) => {
  if (m.type() === "error") console.log("CONSOLE", m.text());
});
await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
await page.getByRole("button", { name: /Signal Album/i }).click();
await page.waitForTimeout(800);
await page.screenshot({ path: "/workspace/screenshots/studio-desktop.png", fullPage: false });
const canvas = page.locator("canvas").first();
const box = await canvas.boundingBox();
if (box) {
  await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.45);
  await page.waitForTimeout(200);
}
await page.getByRole("button", { name: "Rectangle" }).click();
if (box) {
  await page.mouse.move(box.x + 120, box.y + 140);
  await page.mouse.down();
  await page.mouse.move(box.x + 280, box.y + 280);
  await page.mouse.up();
}
await page.waitForTimeout(300);
await page.screenshot({ path: "/workspace/screenshots/studio-draw.png" });
const body = await page.locator("body").innerText();
console.log("TEXT", body.slice(0, 400));
await browser.close();
