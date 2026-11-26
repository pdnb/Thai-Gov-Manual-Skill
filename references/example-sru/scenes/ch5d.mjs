// 5.3 การประชุม + 6 (รับรองมติ)   (after ch5c)
import { as, go, shot, click, pick, date, treePick } from '../lib.mjs';
import { state } from './state.mjs';
import { claimFromPool } from './ch5b.mjs';

const selOf = (p, id) => p.locator('.ant-select', { has: p.locator('#' + id) });

export default async function ch5d() {
  const h = await as('hrofficer');
  await go(h, '/meetings');
  await shot(h, '5-13', { caption: 'หน้ารายการการประชุม', marks: [{ n: 1, loc: h.getByRole('button', { name: /สร้างการประชุม/ }).first() }] });
  await go(h, '/meetings/create');
  await h.locator('#meeting_no').fill('1/2569');
  await h.locator('#title').fill('การประชุมคณะกรรมการพิจารณากำหนดตำแหน่งที่สูงขึ้น');
  await pick(h, selOf(h, 'committee_id'));
  await treePick(h, selOf(h, 'organization_id'), 'คณะวิทยาศาสตร์และเทคโนโลยี');
  // the server checks "held" against the UTC date (see notes) — use it so the sample can be held today
  await date(h, '#meeting_date', new Date().getUTCDate());
  await h.locator('#start_time').fill('09:30');
  await h.locator('#end_time').fill('12:00');
  await h.locator('#location').fill('ห้องประชุมสำนักงานคณบดี ชั้น 2');
  await shot(h, '5-14', {
    caption: 'แบบฟอร์มสร้างการประชุม',
    fullPage: true,
    marks: [
      { n: 1, loc: h.locator('#title') },
      { n: 2, loc: selOf(h, 'committee_id') },
      { n: 3, loc: selOf(h, 'organization_id') },
      { n: 4, loc: h.locator('#meeting_date') },
      { n: 5, loc: h.locator('button[type=submit]', { hasText: 'บันทึก' }) },
    ],
  });
  await click(h.locator('button[type=submit]', { hasText: 'บันทึก' }));
  state.meetingUrl = h.url();
  await shot(h, '5-15', {
    caption: 'หน้าการประชุม ระบบเพิ่มระเบียบวาระมาตรฐานและรายชื่อกรรมการให้',
    fullPage: true,
    marks: [
      { n: 1, loc: h.getByRole('button', { name: 'แจ้งเชิญประชุม' }) },
      { n: 2, loc: h.getByRole('button', { name: 'เพิ่มคำขอ' }) },
      { n: 3, loc: h.getByRole('tab', { name: /ผู้เข้าประชุม/ }) },
      { n: 4, loc: h.getByRole('button', { name: 'บันทึกว่าประชุมแล้ว' }) },
    ],
  });
  await click(h.getByRole('button', { name: 'เพิ่มคำขอ' }));
  await h.getByRole('checkbox', { name: 'เลือกแถว' }).first().check({ force: true });
  await shot(h, '5-16', {
    caption: 'เลือกคำขอที่รอพิจารณาเข้าระเบียบวาระ',
    marks: [
      { n: 1, loc: h.getByRole('checkbox', { name: 'เลือกแถว' }).first() },
      { n: 2, loc: h.getByRole('button', { name: 'เพิ่ม' }) },
    ],
  });
  await click(h.getByRole('button', { name: 'เพิ่ม' }));

  await go(h, state.meetingUrl + '/attendance');
  const att = (n) => h.locator('.ant-select', { has: h.getByLabel('การเข้าประชุมของ ' + n) });
  for (const n of ['ผู้ช่วยศาสตราจารย์กมล ประเมินเที่ยง', 'ศาสตราจารย์ ดร.ผู้ประเมิน ภายนอก', 'นายอนันต์ รอบคอบ']) await pick(h, att(n), 'มาประชุม');
  await shot(h, '5-17', {
    caption: 'บันทึกการเข้าประชุม',
    marks: [
      { n: 1, loc: att('ผู้ช่วยศาสตราจารย์กมล ประเมินเที่ยง') },
      { n: 2, loc: h.getByRole('button', { name: 'บันทึก' }) },
    ],
  });
  await click(h.getByRole('button', { name: 'บันทึก' }));
  await h.getByRole('button', { name: 'บันทึกว่าประชุมแล้ว' }).click();
  await h.waitForTimeout(500);
  await shot(h, '5-18', {
    caption: 'ยืนยันบันทึกว่าประชุมแล้ว ระบบตรวจองค์ประชุมให้',
    marks: [{ n: 1, loc: h.getByRole('dialog').getByRole('button', { name: 'ยืนยัน' }) }],
  });
  await click(h.getByRole('dialog').getByRole('button', { name: 'ยืนยัน' }));

  await click(h.getByRole('button', { name: 'บันทึกมติ' }));
  await h.getByLabel('เห็นชอบ — เสนอผู้มีอำนาจอนุมัติ').check();
  await h.locator('#resolution_text').fill('ที่ประชุมพิจารณาแล้ว มีมติเห็นชอบให้เสนอผู้มีอำนาจอนุมัติกำหนดตำแหน่ง นายธนา ขยันยิ่ง เป็นนักวิชาการคอมพิวเตอร์ ระดับชำนาญการ');
  await h.locator('#votes_for').fill('3');
  await h.locator('#votes_against').fill('0');
  await h.locator('#votes_abstain').fill('0');
  await shot(h, '5-19', {
    caption: 'แบบฟอร์มบันทึกมติที่ประชุม',
    fullPage: true,
    marks: [
      { n: 1, loc: h.getByLabel('เห็นชอบ — เสนอผู้มีอำนาจอนุมัติ') },
      { n: 2, loc: h.locator('#resolution_text') },
      { n: 3, loc: h.locator('#votes_for') },
      { n: 4, loc: h.locator('button[type=submit]', { hasText: 'บันทึกร่างมติ' }) },
    ],
  });
  await click(h.locator('button[type=submit]', { hasText: 'บันทึกร่างมติ' }));

  // ประธานรับรองมติ
  const c = await as('committee');
  await go(c, state.meetingUrl);
  await shot(c, '6-5', {
    caption: 'ประธานกรรมการเปิดหน้าการประชุมเพื่อรับรองมติ',
    marks: [{ n: 1, loc: c.getByRole('button', { name: 'รับรองมติ' }) }],
  });
  await c.getByRole('button', { name: 'รับรองมติ' }).click();
  await c.waitForTimeout(500);
  await shot(c, '6-6', {
    caption: 'ยืนยันรับรองมติ (มติที่รับรองแล้วแก้ไขไม่ได้)',
    marks: [{ n: 1, loc: c.getByRole('dialog').getByRole('button', { name: 'รับรองมติ' }) }],
  });
  await click(c.getByRole('dialog').getByRole('button', { name: 'รับรองมติ' }));

  // งาน "เสนอที่ประชุมพิจารณา"
  await claimFromPool(h);
  await shot(h, '5-20', {
    caption: 'งาน "เสนอที่ประชุมพิจารณา" เลือกผลตามมติที่รับรองแล้ว',
    marks: [
      { n: 1, loc: h.getByRole('button', { name: 'มติเห็นชอบ — เสนอขออนุมัติ' }) },
      { n: 2, loc: h.getByRole('button', { name: 'มติให้แก้ไข' }) },
      { n: 3, loc: h.getByRole('button', { name: 'มติไม่เห็นชอบ' }) },
    ],
  });
  await h.getByRole('button', { name: 'มติเห็นชอบ — เสนอขออนุมัติ' }).click();
  await h.waitForTimeout(500);
  await click(h.getByRole('dialog').getByRole('button', { name: 'มติเห็นชอบ — เสนอขออนุมัติ' }));
}
