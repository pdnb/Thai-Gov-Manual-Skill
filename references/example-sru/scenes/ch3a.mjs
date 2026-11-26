// บทที่ 3 บุคลากร: ตรวจคุณสมบัติ → สร้างร่าง → ผลงาน → เอกสาร → ยื่น   (from snapshot s0-seed)
import { as, go, shot, click, pick, date, upload } from '../lib.mjs';
import { SAMPLES, state } from './state.mjs';

export default async function ch3a() {
  const s = await as('staff');

  await go(s, '/me/personnel');
  await shot(s, '3-1', {
    caption: 'หน้าข้อมูลของฉัน ตรวจตำแหน่ง ระดับ และคุณวุฒิก่อนยื่นคำขอ',
    marks: [
      { n: 1, loc: s.getByRole('tab', { name: 'ประวัติการดำรงตำแหน่ง' }) },
      { n: 2, loc: s.getByRole('tab', { name: 'คุณวุฒิการศึกษา' }) },
    ],
  });

  await go(s, '/my-applications');
  await shot(s, '3-2', {
    caption: 'หน้าคำขอของฉัน',
    marks: [{ n: 1, loc: s.getByRole('button', { name: 'ตรวจคุณสมบัติและสร้างคำขอ' }) }],
  });

  await go(s, '/applications/create');
  await s.getByRole('radio').first().check();
  await shot(s, '3-3', {
    caption: 'เลือกหลักเกณฑ์ที่ต้องการยื่น',
    marks: [
      { n: 1, loc: s.getByRole('radio').first() },
      { n: 2, loc: s.getByRole('button', { name: 'ตรวจคุณสมบัติเบื้องต้น' }) },
    ],
  });
  await click(s.getByRole('button', { name: 'ตรวจคุณสมบัติเบื้องต้น' }));
  await shot(s, '3-4', {
    caption: 'ผลตรวจคุณสมบัติเบื้องต้นรายเงื่อนไข',
    fullPage: true,
    marks: [
      { n: 1, loc: s.locator('.ant-alert').first() },
      { n: 2, loc: s.getByRole('checkbox') },
      { n: 3, loc: s.getByRole('button', { name: 'สร้างร่างคำขอ' }) },
    ],
  });
  await s.getByRole('checkbox').check();
  await click(s.getByRole('button', { name: 'สร้างร่างคำขอ' }));
  await s.waitForURL(/\/applications\/[^/]+\/edit/);
  state.app = s.url().match(/applications\/([^/]+)\/edit/)[1];

  await shot(s, '3-5', {
    caption: 'หน้าจัดเตรียมคำขอ ขั้นที่ 1 ข้อมูลผู้ขอ (ดึงจากทะเบียนประวัติ)',
    marks: [
      { n: 1, loc: s.locator('.ant-steps').first() },
      { n: 2, loc: s.getByRole('button', { name: 'ถัดไป: ผลงาน' }) },
    ],
  });

  await click(s.getByRole('button', { name: 'ถัดไป: ผลงาน' }));
  await click(s.getByRole('button', { name: 'เพิ่มผลงาน' }));
  await pick(s, '#criteria_work_requirement_id');
  await s.locator('#title_th').fill('คู่มือการปฏิบัติงาน เรื่อง การบริหารจัดการระบบเครือข่ายคอมพิวเตอร์ของคณะ');
  await s.locator('#description').fill('อธิบายขั้นตอนการติดตั้ง ดูแล และแก้ไขปัญหาระบบเครือข่ายคอมพิวเตอร์ภายในคณะวิทยาศาสตร์และเทคโนโลยี');
  await s.locator('#publication_info').fill('ใช้งานภายในคณะวิทยาศาสตร์และเทคโนโลยี');
  await date(s, '#published_on', 1, -5);
  await pick(s, '#author_role', 'ผู้จัดทำคนเดียว');
  await s.locator('#contribution_percent').fill('100');
  await shot(s, '3-6', {
    caption: 'แบบฟอร์มเพิ่มผลงาน',
    fullPage: true,
    marks: [
      { n: 1, loc: s.locator('.ant-select', { has: s.locator('#criteria_work_requirement_id') }) },
      { n: 2, loc: s.locator('#title_th') },
      { n: 3, loc: s.locator('.ant-select', { has: s.locator('#author_role') }) },
      { n: 4, loc: s.getByRole('button', { name: 'บันทึก' }) },
    ],
  });
  await click(s.getByRole('button', { name: 'บันทึก' }));
  await upload(s.getByRole('button', { name: 'แนบไฟล์' }).first(), SAMPLES + 'work-manual.pdf');
  await shot(s, '3-7', {
    caption: 'ขั้นที่ 2 ผลงาน หลังบันทึกผลงานและแนบไฟล์แล้ว',
    marks: [
      { n: 1, loc: s.getByRole('button', { name: 'เพิ่มผลงาน' }) },
      { n: 2, loc: s.getByRole('button', { name: 'แนบไฟล์' }).first() },
      { n: 3, loc: s.getByRole('button', { name: 'ถัดไป: เอกสาร' }) },
    ],
  });

  await click(s.getByRole('button', { name: 'ถัดไป: เอกสาร' }));
  await shot(s, '3-8', {
    caption: 'ขั้นที่ 3 เอกสารประกอบคำขอ แสดงชนิด ขนาด และจำนวนไฟล์ที่กำหนด',
    marks: [{ n: 1, loc: s.getByRole('button', { name: 'แนบไฟล์' }).first() }],
  });
  await upload(s.getByRole('button', { name: 'แนบไฟล์' }).first(), SAMPLES + 'form.pdf');

  await click(s.getByRole('button', { name: 'ถัดไป: ตรวจสอบและยื่น' }));
  await s.getByRole('checkbox').check();
  await shot(s, '3-9', {
    caption: 'ขั้นที่ 4 ตรวจสอบความครบถ้วนและยื่นคำขอ',
    fullPage: true,
    marks: [
      { n: 1, loc: s.locator('.ant-card', { hasText: 'ตรวจความครบถ้วนก่อนยื่น' }).first() },
      { n: 2, loc: s.getByRole('checkbox') },
      { n: 3, loc: s.getByRole('button', { name: 'ยื่นคำขอ' }) },
    ],
  });
  await click(s.getByRole('button', { name: 'ยื่นคำขอ' }));
  await shot(s, '3-10', {
    caption: 'หน้ารายละเอียดคำขอหลังยื่น ได้รับเลขที่คำขอและแสดงขั้นตอนปัจจุบัน',
    fullPage: true,
    marks: [
      { n: 1, loc: s.locator('h3').first() },
      { n: 2, loc: s.locator('.ant-steps').first() },
      { n: 3, loc: s.getByRole('tab', { name: 'ขั้นตอนการพิจารณา' }) },
      { n: 4, loc: s.getByRole('button', { name: 'ถอนคำขอ' }) },
    ],
  });
  await s.getByRole('tab', { name: 'ประวัติสถานะ' }).click();
  await s.waitForTimeout(400);
  await shot(s, '3-11', {
    caption: 'แท็บประวัติสถานะของคำขอ',
    clip: s.locator('.ant-tabs').first(),
  });
}
