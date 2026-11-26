// บทที่ 6 กรรมการ / บทที่ 7 ผู้ประเมินภายนอก: ประกาศส่วนได้เสีย → ให้คะแนน → ยืนยันผล
import { as, go, shot, click } from '../lib.mjs';

async function evaluate(u, s1, s2, withShots) {
  const c = await as(u);
  await go(c, '/my-evaluations');
  if (withShots) {
    await shot(c, '6-1', {
      caption: 'หน้างานประเมินของฉัน',
      marks: [{ n: 1, loc: c.getByRole('link', { name: /HPA-/ }).first() }],
    });
  } else {
    await shot(c, '7-1', {
      caption: 'งานประเมินของฉัน (บัญชีผู้ประเมินภายนอก เห็นเฉพาะงานที่ได้รับมอบหมาย)',
      marks: [{ n: 1, loc: c.getByRole('link', { name: /HPA-/ }).first() }],
    });
  }
  await click(c.getByRole('link', { name: /HPA-/ }).first());
  await c.getByLabel('ข้าพเจ้าไม่มีส่วนได้เสียกับผู้ขอ').check();
  await c.getByLabel('ข้าพเจ้ายืนยันว่าข้อมูลที่แจ้งเป็นความจริง').check();
  if (withShots) {
    await shot(c, '6-2', {
      caption: 'ประกาศส่วนได้เสียก่อนเปิดเอกสาร',
      marks: [
        { n: 1, loc: c.getByLabel('ข้าพเจ้าไม่มีส่วนได้เสียกับผู้ขอ') },
        { n: 2, loc: c.getByLabel('ข้าพเจ้ามีส่วนได้เสีย — ขอไม่ประเมินคำขอนี้') },
        { n: 3, loc: c.getByLabel('ข้าพเจ้ายืนยันว่าข้อมูลที่แจ้งเป็นความจริง') },
        { n: 4, loc: c.getByRole('button', { name: 'บันทึกการยืนยัน' }) },
      ],
    });
  }
  await click(c.getByRole('button', { name: 'บันทึกการยืนยัน' }));
  await c.locator('#score-1').fill(s1);
  await c.locator('#comment-1').fill('เนื้อหาครบถ้วน ถูกต้องตามหลักวิชาการ');
  await c.locator('#score-2').fill(s2);
  await c.locator('#comment-2').fill('นำไปใช้ประโยชน์ได้จริงในหน่วยงาน');
  await c.locator('#overall-comment').fill('ผลงานมีคุณภาพอยู่ในระดับดี');
  if (withShots) {
    await shot(c, '6-3', {
      caption: 'แบบประเมิน เปิดดูผลงานและให้คะแนนรายข้อ',
      fullPage: true,
      marks: [
        { n: 1, loc: c.getByRole('button', { name: 'ดูตัวอย่าง' }).first() },
        { n: 2, loc: c.locator('#score-1') },
        { n: 3, loc: c.locator('#comment-1') },
        { n: 4, loc: c.locator('#overall-comment') },
        { n: 5, loc: c.getByRole('button', { name: 'บันทึกร่าง' }) },
        { n: 6, loc: c.getByRole('button', { name: 'ยืนยันผลการประเมิน' }) },
      ],
    });
  }
  await c.getByRole('button', { name: 'ยืนยันผลการประเมิน' }).click();
  await c.waitForTimeout(500);
  if (withShots) {
    await shot(c, '6-4', {
      caption: 'ยืนยันผลการประเมิน (ยืนยันแล้วแก้ไขไม่ได้)',
      marks: [
        { n: 1, loc: c.getByRole('dialog').getByRole('button', { name: 'ตรวจสอบอีกครั้ง' }) },
        { n: 2, loc: c.getByRole('dialog').getByRole('button', { name: 'ยืนยันผล' }) },
      ],
    });
  }
  await click(c.getByRole('dialog').getByRole('button', { name: 'ยืนยันผล' }));
}

export default async function ch6() {
  await evaluate('committee', '52', '34', true);
  await evaluate('external', '50', '33', false);
}
