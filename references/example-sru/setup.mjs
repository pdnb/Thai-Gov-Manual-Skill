// Example setup for SRU Career Path (Laravel + Inertia + Ant Design, Herd HTTPS).
// Passed as the first argument to capture.mjs.
import { configure } from '../lib.mjs';

configure({
  base: 'https://sru-career-path.test',
  out: new URL('../../docs/manuals/images', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'),
  // dev-only chrome: Laravel Debugbar, Herd widget, the login page's demo-account picker
  hideCss: '.phpdebugbar,.phpdebugbar-openhandler,.phpdebugbar-openhandler-overlay,.phpdebugbar-widgets-datasets-panel,#herd-ai-host,.ant-card-body>.ant-select.mb-4{display:none!important}',
  hideText: ['ระบบทดสอบ'], // environment badge in the header
  login: async (page, user) => {
    await page.goto('https://sru-career-path.test/login');
    await page.locator('#email').fill(`${user}@sru-hpams.test`);
    await page.locator('#password').fill('Password1234!'); // DemoSeeder password (dev only)
    await page.getByRole('button', { name: /^เข้าสู่ระบบ$/ }).click();
    await page.waitForURL((u) => !u.pathname.startsWith('/login'));
  },
});
