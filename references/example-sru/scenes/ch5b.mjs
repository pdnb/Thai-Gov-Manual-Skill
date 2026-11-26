// 5.2 จัดการการประเมิน: เปิดรอบภายใน มอบหมายผู้ประเมิน ส่งประเมิน   (after ch5a)
import { as, go, shot, click, pick, date } from '../lib.mjs';
import { state } from './state.mjs';

const selOf = (p, id) => p.locator('.ant-select', { has: p.locator('#' + id) });

export async function claimFromPool(h) {
  await go(h, '/work-inbox');
  await h.getByRole('tab', { name: /งานกลาง/ }).click();
  await h.waitForTimeout(500);
  await click(h.getByRole('button', { name: 'เปิดงาน' }).first());
  await h.getByRole('button', { name: 'รับงาน' }).click();
  await h.waitForTimeout(500);
  await click(h.getByRole('dialog').getByRole('button', { name: 'ยืนยัน' }));
  return h.url();
}

export default async function ch5b() {
  const h = await as('hrofficer');
  const task = await claimFromPool(h);
  await shot(h, '5-5', {
    caption: 'งาน "แต่งตั้งกรรมการ/ส่งผู้ประเมิน"',
    marks: [
      { n: 1, loc: h.getByRole('button', { name: 'เปิดหน้าการประเมิน' }) },
      { n: 2, loc: h.getByRole('button', { name: 'ส่งประเมิน' }) },
    ],
  });
  await click(h.getByRole('button', { name: 'เปิดหน้าการประเมิน' }));
  state.evalUrl = h.url();
  await shot(h, '5-6', {
    caption: 'หน้าการประเมินผลงานของคำขอ',
    marks: [
      { n: 1, loc: h.getByRole('button', { name: 'เปิดรอบประเมินภายใน' }) },
      { n: 2, loc: h.getByRole('button', { name: 'เปิดรอบประเมินภายนอก' }) },
    ],
  });

  // external round form — shown only (the sample run evaluates internally)
  await click(h.getByRole('button', { name: 'เปิดรอบประเมินภายนอก' }));
  await shot(h, '5-9', { caption: 'แบบฟอร์มเปิดรอบประเมินภายนอก (ผู้ทรงคุณวุฒิ)', fullPage: true });
  await go(h, state.evalUrl);

  await click(h.getByRole('button', { name: 'เปิดรอบประเมินภายใน' }));
  await pick(h, selOf(h, 'evaluation_template_id'));
  await pick(h, selOf(h, 'committee_id'));
  await date(h, '#due_on', 28, 1);
  await h.locator('#instructions').fill('โปรดประเมินตามแบบประเมินและส่งผลภายในกำหนด');
  await shot(h, '5-7', {
    caption: 'แบบฟอร์มเปิดรอบประเมินภายใน (กรรมการ)',
    fullPage: true,
    marks: [
      { n: 1, loc: selOf(h, 'evaluation_template_id') },
      { n: 2, loc: selOf(h, 'committee_id') },
      { n: 3, loc: h.locator('#due_on') },
      { n: 4, loc: h.locator('button[type=submit]', { hasText: 'เปิดรอบ' }) },
    ],
  });
  await click(h.locator('button[type=submit]', { hasText: 'เปิดรอบ' }));
  await h.getByRole('checkbox', { name: 'เลือก ผู้ช่วยศาสตราจารย์กมล ประเมินเที่ยง' }).check({ force: true });
  await h.getByRole('checkbox', { name: 'เลือก ศาสตราจารย์ ดร.ผู้ประเมิน ภายนอก' }).check({ force: true });
  await shot(h, '5-8', {
    caption: 'มอบหมายผู้ประเมิน ระบบแสดงผลตรวจส่วนได้เสียเบื้องต้นของกรรมการแต่ละคน',
    fullPage: true,
    marks: [
      { n: 1, loc: h.locator('.ant-table').first() },
      { n: 2, loc: h.locator('button[type=submit]', { hasText: 'มอบหมาย' }) },
    ],
  });
  await click(h.locator('button[type=submit]', { hasText: 'มอบหมาย' }));

  await go(h, task);
  await h.getByRole('button', { name: 'ส่งประเมิน' }).click();
  await h.waitForTimeout(500);
  await shot(h, '5-10', {
    caption: 'ยืนยันส่งประเมิน กรรมการแต่ละคนจะได้รับงานประเมินของตนเอง',
    marks: [{ n: 1, loc: h.getByRole('dialog').getByRole('button', { name: 'ส่งประเมิน' }) }],
  });
  await click(h.getByRole('dialog').getByRole('button', { name: 'ส่งประเมิน' }));
}
