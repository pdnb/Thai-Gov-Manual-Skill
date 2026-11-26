// บทที่ 4 ผู้บังคับบัญชา (+ บทที่ 3 ส่วนแก้ไขตามที่ส่งกลับ)   (from snapshot s1-submitted)
import { as, go, shot, click, pick, sel, date } from '../lib.mjs';

export default async function ch4() {
  const v = await as('supervisor');
  await go(v, '/work-inbox');
  await shot(v, '4-1', {
    caption: 'งานของฉันของผู้บังคับบัญชา แสดงคำขอที่รอรับรอง',
    marks: [
      { n: 1, loc: v.getByRole('tab', { name: /งานของฉัน/ }) },
      { n: 2, loc: v.getByRole('button', { name: 'เปิดงาน' }).first() },
    ],
  });
  await click(v.getByRole('button', { name: 'เปิดงาน' }).first());
  const taskUrl = v.url();
  await shot(v, '4-2', {
    caption: 'หน้างาน "ผู้บังคับบัญชารับรอง"',
    fullPage: true,
    marks: [
      { n: 1, loc: v.getByRole('button', { name: 'เปิดหน้าคำขอ' }) },
      { n: 2, loc: v.getByRole('button', { name: 'รับรอง' }) },
      { n: 3, loc: v.getByRole('button', { name: 'ส่งกลับแก้ไข' }) },
    ],
  });

  // --- ส่งกลับแก้ไข
  await click(v.getByRole('button', { name: 'ส่งกลับแก้ไข' }));
  await pick(v, sel(v, 'ส่วนที่ให้แก้ไข'), 'ผลงาน');
  await v.locator('h3').first().click();
  await v.locator('#reason').fill('กรุณาระบุรายละเอียดโดยย่อของผลงานให้ครบถ้วน (ขอบเขตของคู่มือและกลุ่มผู้ใช้)');
  await shot(v, '4-3', {
    caption: 'แบบฟอร์มส่งกลับแก้ไข เลือกส่วนที่ให้แก้ไขและระบุเหตุผล',
    fullPage: true,
    marks: [
      { n: 1, loc: sel(v, 'ส่วนที่ให้แก้ไข') },
      { n: 2, loc: sel(v, 'เอกสารที่ให้แก้ไข') },
      { n: 3, loc: v.locator('#reason') },
      { n: 4, loc: v.locator('button[type=submit]', { hasText: 'ส่งกลับแก้ไข' }) },
    ],
  });
  await click(v.locator('button[type=submit]', { hasText: 'ส่งกลับแก้ไข' }));

  // --- บุคลากรแก้ไขตามที่ส่งกลับ (บทที่ 3)
  const s = await as('staff');
  await go(s, '/notifications');
  await shot(s, '3-12', { caption: 'หน้าการแจ้งเตือน เมื่อคำขอถูกส่งกลับแก้ไข', marks: [{ n: 1, loc: s.locator('header a[aria-label="การแจ้งเตือน"]') }] });
  await go(s, '/my-applications');
  await click(s.getByRole('link', { name: /HPA-/ }).first());
  await s.getByRole('tab', { name: /การส่งกลับแก้ไข/ }).click();
  await s.waitForTimeout(400);
  await shot(s, '3-13', {
    caption: 'คำขอสถานะ "ส่งกลับแก้ไข" แท็บการส่งกลับแก้ไขแสดงเหตุผลและส่วนที่ต้องแก้',
    fullPage: true,
    marks: [
      { n: 1, loc: s.getByRole('button', { name: 'แก้ไขตามที่ส่งกลับ' }) },
      { n: 2, loc: s.getByRole('tab', { name: /การส่งกลับแก้ไข/ }) },
    ],
  });
  await click(s.getByRole('button', { name: 'แก้ไขตามที่ส่งกลับ' }));
  await click(s.locator('.ant-steps-item', { hasText: 'ผลงาน' }).first());
  await shot(s, '3-14', {
    caption: 'หน้าแก้ไขคำขอ แสดงเหตุผลการส่งกลับ แก้ได้เฉพาะส่วนที่ระบุ',
    marks: [
      { n: 1, loc: s.locator('.ant-alert-warning').last() },
      { n: 2, loc: s.getByRole('button', { name: 'แก้ไข' }).first() },
    ],
  });
  await click(s.getByRole('button', { name: 'แก้ไข' }).first());
  await s.locator('#description').fill('คู่มือสำหรับเจ้าหน้าที่ดูแลระบบเครือข่ายของคณะ ครอบคลุมการติดตั้ง การดูแลประจำวัน การสำรองค่า และการแก้ไขปัญหาที่พบบ่อย');
  await click(s.getByRole('button', { name: 'บันทึก' }));
  await click(s.locator('.ant-steps-item', { hasText: 'ตรวจสอบและยื่น' }).first());
  await s.getByRole('checkbox').check();
  await shot(s, '3-15', {
    caption: 'ยื่นแก้ไขคำขอ',
    clip: s.locator('.ant-card', { hasText: 'ยื่นแก้ไขคำขอ' }).last(),
    marks: [
      { n: 1, loc: s.getByRole('checkbox') },
      { n: 2, loc: s.getByRole('button', { name: 'ยื่นแก้ไขคำขอ' }) },
    ],
  });
  await click(s.getByRole('button', { name: 'ยื่นแก้ไขคำขอ' }));

  // --- ผู้บังคับบัญชารับรอง
  await go(v, '/work-inbox');
  await click(v.getByRole('button', { name: 'เปิดงาน' }).first());
  await v.getByRole('button', { name: 'รับรอง' }).click();
  await v.waitForTimeout(600);
  await v.locator('#reason-endorse').fill('ผลงานมีคุณภาพ เหมาะสมกับตำแหน่งที่ขอ');
  await shot(v, '4-4', {
    caption: 'หน้าต่างยืนยันการรับรอง ใส่ความเห็นประกอบได้',
    clip: v.getByRole('dialog'),
    marks: [
      { n: 1, loc: v.locator('#reason-endorse') },
      { n: 2, loc: v.getByRole('dialog').getByRole('button', { name: 'รับรอง' }) },
    ],
  });
  await click(v.getByRole('dialog').getByRole('button', { name: 'รับรอง' }));

  // --- มอบหมายงานแทน (form only, not submitted)
  await go(v, '/workflow/delegations/create');
  await pick(v, '#delegate_user_id');
  await date(v, '#ends_on', 28);
  await v.locator('#reason').fill('ลาพักผ่อน');
  await shot(v, '4-5', {
    caption: 'แบบฟอร์มมอบหมายงานแทน',
    fullPage: true,
    marks: [
      { n: 1, loc: v.locator('.ant-select', { has: v.locator('#delegate_user_id') }) },
      { n: 2, loc: v.locator('#starts_on') },
      { n: 3, loc: v.locator('#ends_on') },
      { n: 4, loc: v.locator('button[type=submit]', { hasText: 'มอบหมาย' }) },
    ],
  });
  void taskUrl;
}
