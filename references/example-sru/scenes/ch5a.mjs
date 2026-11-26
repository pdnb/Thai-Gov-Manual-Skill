// บทที่ 5.1 เจ้าหน้าที่: รับงานจากงานกลาง → ตรวจคุณสมบัติรายเงื่อนไข → ตรวจสอบผ่าน   (from s2-endorsed)
import { as, go, shot, click, pick } from '../lib.mjs';

export default async function ch5a() {
  const h = await as('hrofficer');
  await go(h, '/work-inbox');
  await h.getByRole('tab', { name: /งานกลาง/ }).click();
  await h.waitForTimeout(500);
  await shot(h, '5-1', {
    caption: 'แท็บงานกลาง แสดงงานของหน่วยงานที่ยังไม่มีผู้รับ',
    marks: [
      { n: 1, loc: h.getByRole('tab', { name: /งานกลาง/ }) },
      { n: 2, loc: h.getByRole('button', { name: 'เปิดงาน' }).first() },
    ],
  });
  await click(h.getByRole('button', { name: 'เปิดงาน' }).first());
  const task = h.url();
  await h.getByRole('button', { name: 'รับงาน' }).click();
  await h.waitForTimeout(500);
  await shot(h, '5-2', {
    caption: 'ยืนยันการรับงาน เพื่อป้องกันการทำงานซ้ำกับเจ้าหน้าที่คนอื่น',
    marks: [{ n: 1, loc: h.getByRole('dialog').getByRole('button', { name: 'ยืนยัน' }) }],
  });
  await click(h.getByRole('dialog').getByRole('button', { name: 'ยืนยัน' }));
  await shot(h, '5-3', {
    caption: 'หน้างานตรวจสอบคุณสมบัติและเอกสาร หลังรับงานแล้ว',
    marks: [
      { n: 1, loc: h.getByRole('button', { name: 'บันทึกผลตรวจคุณสมบัติ' }) },
      { n: 2, loc: h.getByRole('button', { name: 'ตรวจสอบผ่าน' }) },
      { n: 3, loc: h.getByRole('button', { name: 'ส่งกลับแก้ไข' }) },
      { n: 4, loc: h.getByRole('button', { name: 'ไม่ผ่านคุณสมบัติ' }) },
      { n: 5, loc: h.getByRole('button', { name: 'คืนงานเข้างานกลาง' }) },
    ],
  });

  await click(h.getByRole('button', { name: 'บันทึกผลตรวจคุณสมบัติ' }));
  for (let i = 0; i < 5; i++) {
    await pick(h, h.locator('.ant-select', { has: h.locator(`#results_${i}_manual_result`) }), 'ผ่าน');
    await h.locator(`#results_${i}_remark`).fill('ตรวจสอบหลักฐานแล้ว ถูกต้อง');
  }
  await shot(h, '5-4', {
    caption: 'หน้าตรวจสอบคุณสมบัติรายเงื่อนไข บันทึกผลและหมายเหตุทุกเงื่อนไข',
    fullPage: true,
    marks: [
      { n: 1, loc: h.locator('.ant-select', { has: h.locator('#results_0_manual_result') }) },
      { n: 2, loc: h.locator('#results_0_remark') },
      { n: 3, loc: h.locator('button[type=submit]', { hasText: 'บันทึกผลตรวจ' }) },
    ],
  });
  await click(h.locator('button[type=submit]', { hasText: 'บันทึกผลตรวจ' }));

  await go(h, task);
  await h.getByRole('button', { name: 'ตรวจสอบผ่าน' }).click();
  await h.waitForTimeout(500);
  await click(h.getByRole('dialog').getByRole('button', { name: 'ตรวจสอบผ่าน' }));
}
