// 8.2–8.3 Dashboard / รายงาน, บทที่ 9 ผู้ตรวจสอบ, ภาคผนวก ก ข้อความแจ้งเตือน   (read-only, after ch5e)
import { as, go, shot, click } from '../lib.mjs';

export default async function ch8b() {
  const e = await as('executive');
  await go(e, '/analytics');
  await shot(e, '8-3', {
    caption: 'Dashboard ผู้บริหาร',
    fullPage: true,
    marks: [
      { n: 1, loc: e.locator('.ant-select').first() },
      { n: 2, loc: e.locator('.ant-select').nth(1) },
      { n: 3, loc: e.getByRole('button', { name: 'รายงานทั้งหมด' }) },
    ],
  });
  await go(e, '/reports');
  await shot(e, '8-4', { caption: 'หน้ารวมรายงาน', fullPage: true });
  await click(e.getByRole('link', { name: /รายงานคำขอกำหนดตำแหน่ง/ }).first());
  await shot(e, '8-5', {
    caption: 'ตัวอย่างรายงานคำขอกำหนดตำแหน่ง พร้อมตัวกรองและการส่งออก',
    marks: [
      { n: 1, loc: e.getByPlaceholder('ค้นหาเลขที่คำขอ / ชื่อผู้ขอ') },
      { n: 2, loc: e.getByRole('link', { name: 'Excel' }) },
      { n: 3, loc: e.getByRole('link', { name: 'CSV' }) },
      { n: 4, loc: e.getByRole('link', { name: 'พิมพ์ / PDF' }) },
    ],
  });

  const a = await as('auditor');
  await go(a, '/audit-logs');
  await a.locator('#event').fill('application.');
  await click(a.getByRole('button', { name: 'ค้นหา' }));
  await shot(a, '9-1', {
    caption: 'หน้าประวัติการใช้งานระบบ (Audit Trail) สำหรับผู้ตรวจสอบ',
    marks: [
      { n: 1, loc: a.locator('#event') },
      { n: 2, loc: a.locator('#from') },
      { n: 3, loc: a.getByRole('button', { name: 'ค้นหา' }) },
    ],
  });
  await go(a, '/reports');
  await shot(a, '9-2', { caption: 'รายงานที่ผู้ตรวจสอบเปิดดูได้ (อ่านอย่างเดียว)' });

  // ภาคผนวก ก
  const s = await as('staff');
  await go(s, '/admin/users');
  await shot(s, 'A-1', { caption: 'ตัวอย่างหน้า "ไม่มีสิทธิ์" (403) เมื่อเปิดหน้าที่บทบาทใช้ไม่ได้' });
  await go(s, '/applications/00000000000000000000000000');
  await shot(s, 'A-2', { caption: 'ตัวอย่างหน้า "ไม่พบหน้า" (404)' });
  const h = await as('hrofficer');
  await go(h, '/meetings/create');
  await click(h.locator('button[type=submit]', { hasText: 'บันทึก' }));
  await shot(h, 'A-3', {
    caption: 'ตัวอย่างสรุปข้อผิดพลาดของแบบฟอร์ม คลิกชื่อช่องเพื่อไปยังช่องที่ต้องแก้',
    clip: h.locator('.ant-alert-error').first(),
  });
}
