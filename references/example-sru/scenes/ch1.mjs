// บทที่ 1 เริ่มต้นใช้งาน — read-only screens (no DB mutation)
import { as, go, shot, click } from '../lib.mjs';

export default async function ch1() {
  const anon = await as(null);
  await go(anon, '/login');
  await shot(anon, '1-1', {
    caption: 'หน้าจอเข้าสู่ระบบ',
    clip: [anon.locator('h3').first(), anon.locator('.ant-card').first()],
    marks: [
      { n: 1, loc: anon.locator('#email') },
      { n: 2, loc: anon.locator('#password') },
      { n: 3, loc: anon.getByRole('button', { name: 'เข้าสู่ระบบ' }) },
      { n: 4, loc: anon.getByRole('link', { name: 'ลืมรหัสผ่าน?' }) },
    ],
  });

  await click(anon.getByRole('link', { name: 'ลืมรหัสผ่าน?' }));
  await shot(anon, '1-2', { caption: 'หน้าจอลืมรหัสผ่าน (ขอลิงก์ตั้งรหัสผ่านใหม่ทางอีเมล)', clip: [anon.locator('h3').first(), anon.locator('.ant-card').first()] });

  const hr = await as('hrofficer');
  await go(hr, '/');
  await shot(hr, '1-3', {
    caption: 'หน้าหลักหลังเข้าสู่ระบบ (ตัวอย่างบทบาทเจ้าหน้าที่กองบริหารงานบุคคล)',
    marks: [
      { n: 1, loc: hr.locator('aside, .ant-layout-sider').first() },
      { n: 2, loc: hr.locator('header a[aria-label="การแจ้งเตือน"]') },
      { n: 3, loc: hr.locator('header button').last() },
    ],
  });

  await go(hr, '/work-inbox');
  await shot(hr, '1-4', {
    caption: 'หน้างานของฉัน แยกแท็บ งานของฉัน / งานกลาง / ปฏิบัติแทน / ดำเนินการแล้ว / งานในหน่วยงาน',
    marks: [
      { n: 1, loc: hr.getByRole('tab', { name: 'งานของฉัน' }) },
      { n: 2, loc: hr.getByRole('tab', { name: 'งานกลาง' }) },
      { n: 3, loc: hr.getByRole('tab', { name: 'ปฏิบัติแทน' }) },
      { n: 4, loc: hr.getByPlaceholder('ค้นหาเลขที่คำขอ ชื่อผู้ขอ หรือขั้นตอน') },
    ],
  });

  await go(hr, '/');
  await hr.locator('header button').last().click();
  await hr.waitForTimeout(400);
  await shot(hr, '1-5', {
    caption: 'เมนูผู้ใช้มุมขวาบน',
    marks: [{ n: 1, loc: hr.getByRole('menuitem', { name: 'บัญชีของฉัน' }) }],
    clip: { x: 866, y: 0, width: 500, height: 260 },
  });
  await hr.keyboard.press('Escape');

  await go(hr, '/profile');
  await shot(hr, '1-6', {
    caption: 'หน้าบัญชีของฉัน: เปลี่ยนรหัสผ่าน และออกจากระบบอุปกรณ์อื่น',
    fullPage: true,
    marks: [
      { n: 1, loc: hr.getByRole('button', { name: 'บันทึกรหัสผ่าน' }) },
      { n: 2, loc: hr.getByRole('button', { name: 'ออกจากระบบอุปกรณ์อื่นทั้งหมด' }) },
    ],
  });

  // Mobile layout
  const m = await as('staff', { mobile: true });
  await go(m, '/');
  await shot(m, '1-7', { caption: 'หน้าหลักบนโทรศัพท์มือถือ', marks: [{ n: 1, loc: m.locator('header button').first() }] });
  await m.locator('header button').first().click();
  await m.waitForTimeout(600);
  await shot(m, '1-8', { caption: 'เมนูบนโทรศัพท์มือถือ (กดปุ่ม ☰)', clip: { x: 0, y: 0, width: 390, height: 420 } });
}
