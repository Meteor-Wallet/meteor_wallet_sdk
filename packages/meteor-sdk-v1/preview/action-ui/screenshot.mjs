/**
 * Headless screenshot capture for the Meteor Connect action-UI preview.
 *
 * Builds the preview bundle, serves it, and captures every scenario (or a
 * filtered subset) with playwright-core into ./shots/. For each scenario it
 * writes `<name>-full.png` (modal in page context) and `<name>-modal.png`
 * (tight crop of the modal, with its bounds logged for the 415x556 check).
 *
 * Scenarios whose `mobileUa` flag is set are captured with a mobile user agent.
 *
 * Usage:
 *   bun run preview:action-ui:shots                 # all scenarios
 *   node ./preview/action-ui/screenshot.mjs main,pin # subset
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";
import { SCENARIOS } from "./scenarios.mjs";
import { createBuildContext, findChromiumExecutable, PREVIEW_DIR } from "./shared.mjs";

const MOBILE_USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 " +
  "(KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

const filter = process.argv[2]?.split(",").map((name) => name.trim());
const scenarios = filter ? SCENARIOS.filter((s) => filter.includes(s.name)) : SCENARIOS;
if (scenarios.length === 0) {
  console.error(`No matching scenarios. Available: ${SCENARIOS.map((s) => s.name).join(", ")}`);
  process.exit(1);
}

const outDir = path.join(PREVIEW_DIR, "shots");
fs.mkdirSync(outDir, { recursive: true });

const context = await createBuildContext();
await context.rebuild();
const served = await context.serve({ servedir: PREVIEW_DIR, port: 0 });

const executablePath = await findChromiumExecutable();
const browser = await chromium.launch({ executablePath });

try {
  for (const scenario of scenarios) {
    const page = await browser.newPage({
      viewport: { width: 800, height: 700 },
      deviceScaleFactor: 2,
      ...(scenario.mobileUa ? { userAgent: MOBILE_USER_AGENT, isMobile: true } : {}),
    });
    page.on("pageerror", (error) => console.log(`[${scenario.name}] page error:`, error.message));
    await page.goto(`http://localhost:${served.port}/index.html?scenario=${scenario.name}`);
    await page.waitForFunction(() => window.__uiReady === true, null, { timeout: 15000 });
    // Let entrance animations settle, the QR draw, and stage transitions run.
    await page.waitForTimeout(scenario.settleMs ?? 900);

    // States behind a toggle (the mobile QR reveal, the PIN stage's QR) need the toggle pressed
    // first. The control lives in a shadow root, so reach it by aria-label or button text rather
    // than a CSS path.
    if (scenario.clickLabel != null) {
      const clicked = await page.evaluate((label) => {
        const all = [];
        const walk = (node) => {
          for (const el of node.querySelectorAll("*")) {
            all.push(el);
            if (el.shadowRoot) walk(el.shadowRoot);
          }
        };
        walk(document);
        const button = all.find(
          (el) =>
            el.getAttribute?.("aria-label") === label ||
            (el.tagName === "BUTTON" && el.textContent.trim() === label),
        );
        button?.click();
        return button != null;
      }, scenario.clickLabel);
      if (!clicked) console.log(`[${scenario.name}] no control labelled "${scenario.clickLabel}"`);
      await page.waitForTimeout(500);
    }

    await page.screenshot({ path: path.join(outDir, `${scenario.name}-full.png`) });
    const modal = await page.locator(".modal-container").boundingBox();
    if (modal) {
      await page.screenshot({ path: path.join(outDir, `${scenario.name}-modal.png`), clip: modal });
      console.log(
        `[${scenario.name}] modal bounds: ${Math.round(modal.width)}x${Math.round(modal.height)}`,
      );
    }

    // Bounds guard: the modal content should not need to scroll to show itself.
    const overflow = await page.evaluate(() => {
      const host =
        document.querySelector("meteor-action-ui-container") ??
        document.querySelector("meteor-transfer-accounts-container");
      const content = host?.shadowRoot?.querySelector(".meteor-connect-content, .content");
      if (!content) return null;
      return { scroll: content.scrollHeight, client: content.clientHeight };
    });
    if (overflow && overflow.scroll > overflow.client + 1) {
      console.log(
        `[${scenario.name}] WARNING: content overflows modal by ${overflow.scroll - overflow.client}px`,
      );
    }
    await page.close();
  }
} finally {
  await browser.close();
  await context.dispose();
}

console.log(`\nScreenshots written to ${outDir}`);
