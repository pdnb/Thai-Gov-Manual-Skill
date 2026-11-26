// 8.1 ผู้บริหารพิจารณาอนุมัติ   (after ch5d)
import { as, go, shot, click } from '../lib.mjs';

export default async function ch8a() {
  const e = await as('executive');
  await go(e, '/approvals');
  await shot(e, '8-1', {
    caption: 'หน้าการอนุมัติ แท็บรอการอนุมัติของฉัน',
    marks: [
      { n: 1, loc: e.getByRole('tab', { name: /รอการอนุมัติของฉัน/ }) },
      { n: 2, loc: e.getByRole('button', { name: 'พิจารณา' }).first() },
    ],
  });
  await click(e.getByRole('button', { name: 'พิจารณา' }).first());
  await e.getByText('อนุมัติ', { exact: true }).click();
  await e.locator('#comment').fill('อนุมัติตามมติที่ประชุม');
  await shot(e, '8-2', {
    caption: 'หน้าพิจารณาอนุมัติ แสดงมติที่ประชุมและผลการประเมินที่รับรองแล้ว',
    marks: [
      { n: 1, loc: e.locator('.ant-card').filter({ hasText: 'คำขออนุมัติล่าสุด' }).first() },
      { n: 2, loc: e.locator('.ant-segmented, .ant-radio-group').first() },
      { n: 3, loc: e.locator('#comment') },
      { n: 4, loc: e.locator('button[type=submit]', { hasText: 'บันทึกผลการพิจารณา' }) },
    ],
  });
  await click(e.locator('button[type=submit]', { hasText: 'บันทึกผลการพิจารณา' }));
}
