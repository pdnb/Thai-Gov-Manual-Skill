// Generic screenshot helpers for building manuals. Configure once per project:
//   import { configure } from './lib.mjs';
//   configure({ base: 'https://app.test', out: '../../docs/manuals/images', login: async (page, user) => {...} });
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const cfg = {
  base: process.env.BASE_URL || 'http://localhost',
  out: process.env.SHOT_DIR || './out',
  viewport: { width: 1440, height: 810 },
  mobileViewport: { width: 390, height: 844 },
  // CSS injected into every page: hide dev-only chrome (debug bars, IDE widgets, demo-account pickers).
  hideCss: '.phpdebugbar,.phpdebugbar-openhandler,.phpdebugbar-openhandler-overlay,.phpdebugbar-widgets-datasets-panel,#herd-ai-host{display:none!important}',
  // Text of elements (e.g. an environment badge "ระบบทดสอบ") hidden right before each screenshot.
  hideText: [],
  hideTextSelector: '.ant-tag',
  // async (page, user) => logs `user` in on `page` (page already at base URL). null = anonymous context.
  login: null,
  browserChannel: 'chrome',
  ignoreHTTPSErrors: true,
};
export function configure(o) { Object.assign(cfg, o); }
export const config = cfg;

let browser;
const contexts = {};

export async function launch() {
  browser = await chromium.launch({ channel: cfg.browserChannel, headless: true });
  return browser;
}
export async function close() { await browser?.close(); }

/** One logged-in page per account, reused across scenes. */
export async function as(user, { mobile = false } = {}) {
  const key = (user ?? '') + (mobile ? ':m' : '');
  if (contexts[key]) return contexts[key];
  const ctx = await browser.newContext({
    ignoreHTTPSErrors: cfg.ignoreHTTPSErrors,
    viewport: mobile ? cfg.mobileViewport : cfg.viewport,
    deviceScaleFactor: 2,
    locale: 'th-TH',
    isMobile: mobile,
    hasTouch: mobile,
  });
  await ctx.addInitScript((css) => {
    const add = () => { const s = document.createElement('style'); s.textContent = css; document.head.append(s); };
    if (document.head) add(); else document.addEventListener('DOMContentLoaded', add);
  }, cfg.hideCss);
  // Track Inertia visits so click() can wait for the real end of a navigation/submit (no-op for other stacks).
  await ctx.addInitScript(() => {
    window.__iv = { started: 0, finished: 0 };
    document.addEventListener('inertia:start', () => window.__iv.started++);
    document.addEventListener('inertia:finish', () => window.__iv.finished++);
  });
  const page = await ctx.newPage();
  page.setDefaultTimeout(15000);
  if (user && cfg.login) {
    await page.goto(cfg.base);
    await cfg.login(page, user);
  }
  contexts[key] = page;
  return page;
}

export async function go(page, url) {
  await page.goto(url.startsWith('http') ? url : cfg.base + url);
  await settle(page);
}

/** Wait for network + Inertia/nprogress bar to finish. */
export async function settle(page) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForFunction(() => !document.querySelector('#nprogress'), null, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(300);
}

/** Click and wait for the resulting SPA visit (Inertia) to complete; falls back to settle(). */
export async function click(loc, { force = false } = {}) {
  const page = loc.page();
  const before = await page.evaluate(() => window.__iv?.finished ?? 0).catch(() => 0);
  await loc.click({ force });
  const started = await page.waitForFunction(() => (window.__iv && window.__iv.started > window.__iv.finished) || false, null, { timeout: 1500 }).then(() => true).catch(() => false);
  if (started || (await page.evaluate((b) => (window.__iv?.finished ?? 0) > b, before).catch(() => false))) {
    await page.waitForFunction((b) => window.__iv && window.__iv.finished > b && window.__iv.started === window.__iv.finished, before, { timeout: 30000 }).catch(() => {});
  }
  await settle(page);
}

/** Click a trigger that opens a file chooser, attach `file`, wait for the upload visit. */
export async function upload(trigger, file) {
  const page = trigger.page();
  const before = await page.evaluate(() => window.__iv?.finished ?? 0);
  const [fc] = await Promise.all([page.waitForEvent('filechooser'), trigger.click()]);
  await fc.setFiles(file);
  await page.waitForFunction((b) => window.__iv && window.__iv.finished > b && window.__iv.started === window.__iv.finished, before, { timeout: 30000 }).catch(() => {});
  await settle(page);
}

/** Dump visible interactive elements — use while writing scenes to discover labels/ids. */
export async function explore(page, label = '') {
  const items = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('a,button,input,select,textarea,[role=tab],h1,h2,h3,label')) {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      const t = (el.innerText || el.value || el.getAttribute('aria-label') || el.getAttribute('placeholder') || el.name || '').trim().replace(/\s+/g, ' ').slice(0, 70);
      out.push(`${el.tagName.toLowerCase()}${el.type ? ':' + el.type : ''}${el.name ? '[' + el.name + ']' : ''}${el.id ? '#' + el.id : ''} ${t}`);
    }
    return out;
  });
  console.log(`\n=== ${label} ${page.url()}\n` + items.join('\n'));
}

const manifestPath = () => path.join(cfg.out, 'manifest.json');
export function caption(id, text) {
  let m = {};
  try { m = JSON.parse(fs.readFileSync(manifestPath(), 'utf8')); } catch {}
  m[id] = text;
  fs.mkdirSync(cfg.out, { recursive: true });
  fs.writeFileSync(manifestPath(), JSON.stringify(m, null, 1));
}

/**
 * Screenshot with red boxes + numbered badges.
 *   marks: [{ n, loc }]        numbers must match the step numbers in the manual text
 *   clip: Locator | Locator[]  (union of boxes, padded) | {x,y,width,height}
 *   fullPage: boolean          default: viewport only
 *   caption: string            stored in manifest.json for the docx builder
 */
export async function shot(page, id, { marks = [], clip, fullPage = false, caption: cap } = {}) {
  if (cap) caption(id, cap);
  await settle(page);
  await page.evaluate(({ texts, sel }) => {
    for (const t of document.querySelectorAll(sel)) if (texts.some((x) => t.textContent.includes(x))) t.style.setProperty('display', 'none', 'important');
  }, { texts: cfg.hideText, sel: cfg.hideTextSelector });

  // Viewport shots: scroll to top BEFORE measuring, so fixed elements (modals) and page coords agree.
  const viewportShot = !clip && !fullPage;
  if (viewportShot) await page.evaluate(() => window.scrollTo(0, 0));
  const boxes = [];
  for (const m of marks) {
    const loc = m.loc.first();
    if (!viewportShot) await loc.scrollIntoViewIfNeeded().catch(() => {});
    const b = await loc.evaluate((e) => { const r = e.getBoundingClientRect(); return r.width ? { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height } : null; }).catch(() => null);
    if (!b) { console.warn(`  ! mark ${m.n} not visible in ${id}`); continue; }
    boxes.push({ n: m.n, ...b });
  }
  await page.evaluate((boxes) => {
    const root = document.createElement('div');
    root.id = '__marks';
    root.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:2147483647';
    for (const b of boxes) {
      const box = document.createElement('div');
      box.style.cssText = `position:absolute;left:${b.x - 4}px;top:${b.y - 4}px;width:${b.width + 8}px;height:${b.height + 8}px;border:3px solid #e11d2e;border-radius:8px;box-sizing:border-box`;
      const badge = document.createElement('div');
      badge.textContent = b.n;
      badge.style.cssText = `position:absolute;left:${Math.max(2, b.x - 16)}px;top:${Math.max(2, b.y - 16)}px;width:26px;height:26px;border-radius:50%;background:#e11d2e;color:#fff;font:700 15px/26px Arial,sans-serif;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.4)`;
      root.append(box, badge);
    }
    document.body.append(root);
  }, boxes);

  fs.mkdirSync(cfg.out, { recursive: true });
  const file = path.join(cfg.out, `${id}.png`);
  let clipRect;
  const list = Array.isArray(clip) ? clip : clip && typeof clip.boundingBox === 'function' ? [clip] : null;
  if (list) {
    const bs = [];
    for (const l of list) {
      const b = await l.first().evaluate((e) => { const r = e.getBoundingClientRect(); return { x: r.x + scrollX, y: r.y + scrollY, w: r.width, h: r.height }; }).catch(() => null);
      if (b) bs.push(b);
    }
    if (bs.length) {
      const x1 = Math.max(0, Math.min(...bs.map((b) => b.x)) - 16), y1 = Math.max(0, Math.min(...bs.map((b) => b.y)) - 16);
      const x2 = Math.max(...bs.map((b) => b.x + b.w)) + 16, y2 = Math.max(...bs.map((b) => b.y + b.h)) + 16;
      clipRect = { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
      fullPage = true;
    }
  } else if (clip) clipRect = clip;
  await page.screenshot({ path: file, clip: clipRect, fullPage });
  await page.evaluate(() => document.getElementById('__marks')?.remove());
  console.log(`  ✓ ${id}`);
  return file;
}

// ---------- Ant Design form helpers (adapt for other UI kits) ----------
export function field(page, label) {
  return page.locator('.ant-form-item').filter({ has: page.locator('.ant-form-item-label', { hasText: label }) }).first();
}
export function sel(page, label) { return field(page, label).locator('.ant-select').first(); }

/** antd Select: open and choose option (text/regex) or the first one. Close a multi-select by clicking elsewhere, NOT Escape. */
export async function pick(page, target, option) {
  const input = typeof target === 'string' ? page.locator(target) : target;
  await input.click({ force: true });
  const dd = page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').last();
  await dd.waitFor();
  await page.waitForTimeout(350); // let the open animation finish
  const opt = option ? dd.locator('.ant-select-item-option', { hasText: option }).first() : dd.locator('.ant-select-item-option').first();
  await opt.click();
  await page.waitForTimeout(200);
}
export async function treePick(page, target, title) {
  const input = typeof target === 'string' ? page.locator(target) : target;
  await input.click({ force: true });
  const dd = page.locator('.ant-tree-select-dropdown:not(.ant-select-dropdown-hidden)').last();
  await dd.waitFor();
  await page.waitForTimeout(350);
  await dd.locator('.ant-select-tree-node-content-wrapper').filter({ hasText: new RegExp(`^${title}$`) }).first().click();
  await page.waitForTimeout(250);
}
/** antd DatePicker with read-only input: click day N of the shown month (monthShift moves months first). */
export async function date(page, target, day = 1, monthShift = 0) {
  const input = typeof target === 'string' ? page.locator(target) : target;
  await input.click();
  const dd = page.locator('.ant-picker-dropdown:not(.ant-picker-dropdown-hidden)').last();
  await dd.waitFor();
  for (let i = 0; i < Math.abs(monthShift); i++) await dd.locator(monthShift > 0 ? '.ant-picker-header-next-btn' : '.ant-picker-header-prev-btn').first().click();
  await dd.locator('.ant-picker-cell-in-view .ant-picker-cell-inner').filter({ hasText: new RegExp(`^${day}$`) }).first().click();
  await page.waitForTimeout(250);
}
export async function options(page, target) {
  const input = typeof target === 'string' ? page.locator(target) : target;
  await input.click({ force: true });
  const dd = page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').last();
  await dd.waitFor();
  const o = await dd.locator('.ant-select-item-option').allInnerTexts();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  return o;
}
