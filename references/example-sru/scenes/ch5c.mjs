// 5.2 (ต่อ) ตรวจสอบและรับรองผลการประเมิน   (after ch6)
import { as, go, shot, click } from '../lib.mjs';
import { state } from './state.mjs';
import { claimFromPool } from './ch5b.mjs';

export default async function ch5c() {
  const h = await as('hrofficer');
  const task = await claimFromPool(h);
  await go(h, state.evalUrl);
  await shot(h, '5-11', {
    caption: 'หน้าการประเมินเมื่อกรรมการส่งผลครบ แสดงผลสรุปของรอบและผลรายบุคคล',
    fullPage: true,
    marks: [
      { n: 1, loc: h.locator('.ant-descriptions, table').filter({ hasText: 'ผลสรุปของรอบ' }).first() },
      { n: 2, loc: h.getByRole('button', { name: 'รับรองผลการประเมิน' }) },
    ],
  });
  await h.getByRole('button', { name: 'รับรองผลการประเมิน' }).click();
  await h.waitForTimeout(500);
  await shot(h, '5-12', {
    caption: 'ยืนยันรับรองผลการประเมินของรอบ',
    marks: [{ n: 1, loc: h.getByRole('dialog').getByRole('button').last() }],
  });
  await click(h.getByRole('dialog').getByRole('button').last());

  await go(h, task);
  await h.getByRole('button', { name: 'รับรองผลการประเมิน' }).click();
  await h.waitForTimeout(500);
  await click(h.getByRole('dialog').getByRole('button', { name: 'รับรองผลการประเมิน' }));
}
