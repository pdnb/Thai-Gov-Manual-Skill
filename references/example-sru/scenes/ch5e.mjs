// 5.4 ออกคำสั่งแต่งตั้งและปิดเรื่อง + 3.4 ผลที่ผู้ขอเห็น   (after ch8a)
import { as, go, shot, click, date, treePick, upload } from '../lib.mjs';
import { SAMPLES, state } from './state.mjs';
import { claimFromPool } from './ch5b.mjs';

const selOf = (p, id) => p.locator('.ant-select', { has: p.locator('#' + id) });

export default async function ch5e() {
  const h = await as('hrofficer');
  await go(h, '/appointment-orders/create');
  await h.locator('#title').fill('แต่งตั้งบุคลากรให้ดำรงตำแหน่งที่สูงขึ้น');
  await h.locator('#order_no').fill('1234/2569');
  await date(h, '#order_date', new Date().getUTCDate());
  await date(h, '#effective_date', 1, 1);
  await h.locator('#signed_by_name').fill('รองศาสตราจารย์ ดร.ประเสริฐ บริหารดี');
  await h.locator('#signed_by_position').fill('รองอธิการบดี ปฏิบัติราชการแทนอธิการบดี');
  await treePick(h, selOf(h, 'organization_id'), 'คณะวิทยาศาสตร์และเทคโนโลยี');
  await h.getByRole('checkbox', { name: 'เลือกแถว' }).first().check({ force: true });
  await shot(h, '5-21', {
    caption: 'แบบฟอร์มสร้างร่างคำสั่งแต่งตั้ง เลือกคำขอที่อนุมัติแล้ว',
    fullPage: true,
    marks: [
      { n: 1, loc: h.locator('#order_no') },
      { n: 2, loc: h.locator('#order_date') },
      { n: 3, loc: h.locator('#effective_date') },
      { n: 4, loc: h.getByRole('checkbox', { name: 'เลือกแถว' }).first() },
      { n: 5, loc: h.locator('button[type=submit]', { hasText: 'บันทึกร่าง' }) },
    ],
  });
  await click(h.locator('button[type=submit]', { hasText: 'บันทึกร่าง' }));
  state.orderUrl = h.url();
  await upload(h.getByRole('button', { name: 'แนบไฟล์คำสั่ง' }), SAMPLES + 'signed.pdf');
  await shot(h, '5-22', {
    caption: 'หน้าร่างคำสั่งแต่งตั้ง หลังแนบไฟล์คำสั่งที่ลงนามแล้ว',
    fullPage: true,
    marks: [
      { n: 1, loc: h.getByRole('button', { name: 'พิมพ์ร่างคำสั่ง' }) },
      { n: 2, loc: h.getByRole('button', { name: /แนบไฟล์/ }) },
      { n: 3, loc: h.getByRole('button', { name: 'ออกคำสั่ง' }) },
    ],
  });
  await h.getByRole('button', { name: 'ออกคำสั่ง' }).click();
  await h.waitForTimeout(500);
  await shot(h, '5-23', {
    caption: 'ยืนยันออกคำสั่ง ระบบบันทึกประวัติการดำรงตำแหน่งใหม่ให้อัตโนมัติ',
    marks: [{ n: 1, loc: h.getByRole('dialog').getByRole('button', { name: 'ออกคำสั่ง' }) }],
  });
  await click(h.getByRole('dialog').getByRole('button', { name: 'ออกคำสั่ง' }));

  await claimFromPool(h);
  await h.getByRole('button', { name: 'ออกคำสั่งแล้ว' }).click();
  await h.waitForTimeout(500);
  await click(h.getByRole('dialog').getByRole('button', { name: 'ออกคำสั่งแล้ว' }));

  await claimFromPool(h);
  await shot(h, '5-24', {
    caption: 'งาน "ตรวจความครบถ้วนและปิดเรื่อง"',
    fullPage: true,
    marks: [
      { n: 1, loc: h.getByRole('button', { name: 'เปิดคำสั่งแต่งตั้ง' }) },
      { n: 2, loc: h.getByRole('button', { name: 'ปิดเรื่อง' }) },
    ],
  });
  await h.getByRole('button', { name: 'ปิดเรื่อง' }).click();
  await h.waitForTimeout(500);
  await click(h.getByRole('dialog').getByRole('button', { name: 'ปิดเรื่อง' }));

  // ผลที่ผู้ขอเห็น
  const s = await as('staff');
  await go(s, `/applications/${state.app}`);
  await shot(s, '3-16', {
    caption: 'คำขอที่ปิดเรื่องแล้ว แสดงทุกขั้นตอนการพิจารณาที่ดำเนินการครบ',
    marks: [{ n: 1, loc: s.locator('.ant-steps').first() }],
  });
  await go(s, '/me/personnel');
  await s.getByRole('tab', { name: 'ประวัติการดำรงตำแหน่ง' }).click();
  await s.waitForTimeout(400);
  await shot(s, '3-17', {
    caption: 'ตำแหน่งใหม่ปรากฏในประวัติการดำรงตำแหน่งตามวันที่มีผลในคำสั่ง',
    clip: s.locator('.ant-tabs').first(),
  });
}
