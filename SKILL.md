---
name: thai-gov-user-manual
description: Produce a Thai government-style system user manual (คู่มือการใช้งานระบบแบบราชการไทย) as .docx + .pdf, with real screenshots of the running web app annotated with red numbered markers that match the numbered steps in the text. Uses Playwright to walk a sample record through every workflow step per user role, then builds the book (TH Sarabun New, A4, ก ข ค / 1 2 3 page numbers, สารบัญ/สารบัญภาพ/สารบัญตาราง, ตารางควบคุมเอกสาร) and has Microsoft Word refresh the tables of contents and export PDF. Use this whenever the user asks for คู่มือการใช้งาน, คู่มือผู้ใช้, คู่มือผู้ดูแลระบบ, user/admin manual, training handbook or ภาพหน้าจอประกอบคู่มือ for a web system — especially for Thai government, university or agency deliverables — or wants to regenerate an existing manual after the UI changed, even if they don't mention screenshots or Word.
---

# คู่มือการใช้งานระบบแบบราชการไทย (พร้อมภาพหน้าจอ)

ผลลัพธ์คือเล่มคู่มือที่ผู้ใช้ทำตามได้จากภาพ: ทุกขั้นตอนมีภาพหน้าจอจริง กรอบและหมายเลขสีแดง ①②③ บนภาพตรงกับข้อ 1. 2. 3. ในเนื้อหา และใช้รูปแบบเอกสารราชการที่หน่วยงานไทยคาดหวัง

เครื่องมือที่ใช้ซ้ำได้อยู่ใน `scripts/` · รายละเอียดรูปแบบเล่มและรูปแบบไฟล์เนื้อหาอยู่ใน `references/format-and-content.md` (อ่านก่อนเขียนเนื้อหา) · ตัวอย่างงานจริงที่สมบูรณ์ (SRU Career Path: Laravel + Inertia + Ant Design, 11 ฉาก, 71 ภาพ) อยู่ใน `references/example-sru/`

## ขั้นตอนการทำงาน

### 1. เตรียมข้อมูลตั้งต้น
- หาเนื้อหาเดิมก่อน (เช่น `docs/manuals/*.md`, SRS, RBAC matrix) — เป็นต้นฉบับของเนื้อหา ไม่ต้องแต่งใหม่ทั้งหมด
- หาบัญชีทดสอบแยกตามบทบาท (seeder) และ URL ของระบบ dev
- ภาพต้องใช้**ข้อมูลจำลองเท่านั้น** (PDPA) และห้ามจับภาพจากระบบจริง
- การเดินคำขอตัวอย่างผ่านทุกขั้น**เปลี่ยนข้อมูลในฐานข้อมูล dev** — ขออนุญาตผู้ใช้ก่อนรีเซ็ต/seed ใหม่ และสำรองฐานข้อมูลเป็นจุด ๆ (`scripts/snap.sh` สำหรับ Laravel+MySQL) เพื่อรันซ้ำจากจุดที่พังได้

### 2. ตั้งเครื่องมือในโปรเจกต์
คัดลอก `scripts/` ไปไว้ใน repo (เช่น `tools/manual-screenshots/`) แล้ว `npm install` ที่นั่น — เก็บไว้ใน repo เพราะเมื่อหน้าจอเปลี่ยนจะได้รันใหม่ทั้งเล่ม และไฟล์ใน scratchpad หายได้ ใช้ Chrome ที่ติดตั้งในเครื่อง (`channel: 'chrome'`) แทนการดาวน์โหลด Chromium

เขียน `setup.mjs` เรียก `configure({ base, out, login, hideCss, hideText })` (ดู `references/example-sru/setup.mjs`) — ซ่อนของที่มีเฉพาะ dev ให้ภาพเหมือนระบบจริง: debug bar, widget ของ IDE/Herd, ตัวเลือกบัญชีทดสอบในหน้า login, ป้าย "ระบบทดสอบ"

### 3. เขียนฉาก (scenes) ทีละบท
ฉากหนึ่งไฟล์ต่อหนึ่งช่วงของ workflow (`export default async function`) ใช้ `as(user)` ได้หน้าเว็บที่ล็อกอินตามบทบาท และ `shot(page, id, { caption, marks, clip, fullPage })` จับภาพ

วิธีที่ได้ผล:
- **สำรวจก่อนเขียน**: ใช้ `explore(page)` พิมพ์ปุ่ม/ช่อง/label ที่มองเห็น แล้วจับภาพย่อ (ffmpeg scale=1100) ดู — อย่าเดา selector
- เลือก locator ตามชื่อที่ผู้ใช้เห็น (`getByRole('button', { name: 'ยื่นคำขอ' })`) ให้เนื้อหาคู่มืออ้างชื่อเดียวกันได้
- ชื่อปุ่มอาจเปลี่ยนตามสถานะ (เช่น "แนบไฟล์คำสั่ง" → "แนบไฟล์ฉบับใหม่") ใช้ regex เมื่อจำเป็น; คำเตือน `! mark n not visible` แปลว่า locator ไม่เจอ ให้แก้
- ให้ฉากเดินคำขอตัวอย่างไปข้างหน้าจริง (สร้าง → ยื่น → ส่งกลับแก้ไข 1 รอบ → อนุมัติ → ปิดเรื่อง) จะได้ภาพทุกขั้นในการรันครั้งเดียว และได้ทั้งเส้นทางปกติและเส้นทางแก้ไข
- เก็บค่าที่ฉากหลังต้องใช้ (id คำขอ, URL การประชุม) ไว้ใน state ที่เขียนลงไฟล์ (ดู `example-sru/scenes/state.mjs`) เพื่อเริ่มต่อจาก snapshot ได้
- ฟอร์มที่ตรวจเงื่อนไขเวลา (เช่น "ยังไม่ถึงวันประชุม") ให้ตรวจว่า server ใช้ timezone อะไร
- ตัวช่วย Ant Design (`pick`, `treePick`, `date`, `sel`, `field`) อยู่ใน lib — DatePicker แบบ read-only ต้องคลิกวันในปฏิทิน, Select แบบหลายค่าปิดด้วยการคลิกที่อื่น ไม่ใช่ Escape, checkbox ในตารางใช้ `getByRole('checkbox', { name }).check({ force: true })`

รัน: `node capture.mjs setup.mjs scenes ch1 ch3a ...` (ตั้ง `SNAP_CMD="bash snap.sh <project> save"` เพื่อสำรองหลังทุกฉาก) ใช้เวลาหลายนาที — รันเบื้องหลังได้

### 4. ตรวจภาพ
ทำ contact sheet (ffmpeg xstack/hstack 2×2) แล้วไล่ดูทุกภาพ: หมายเลขอยู่ตรงองค์ประกอบไหม, ภาพจับตอนหน้าโหลดเสร็จแล้วไหม (ไม่มีแถบ progress), ตารางล้นจอไหม, ไม่มีของ dev หลุดมา แก้ฉากแล้วรันใหม่จาก snapshot

### 5. เขียนเนื้อหาและสร้างเล่ม
- เขียน `content.mjs` ตาม `references/format-and-content.md` — ใช้ชื่อปุ่ม/เมนูตามหน้าจอจริงที่เห็นตอนสำรวจ (เนื้อหาเดิมใน .md มักไม่ตรงกับ UI ล่าสุด) และให้ `steps` แต่ละชุดตรงกับหมายเลขบนภาพก่อนหน้า
- ภาพที่ไม่ได้มาจาก UI (แผนภาพขั้นตอน, โลโก้ปก) เรนเดอร์จาก HTML ด้วย Playwright (ดู `example-sru/diagram.mjs`); ถ้าไม่มีตราหน่วยงาน ใช้โลโก้ระบบชั่วคราวและแจ้งผู้ใช้ — อย่าสร้างตราขึ้นเอง
- `bash optimize.sh <imagesDir>` ลดภาพเป็น PNG 256 สี (เล็กลงครึ่งหนึ่ง ตัวหนังสือยังคม)
- `node build-docx.mjs content.mjs <imagesDir> <out.docx>`
- `powershell -File word.ps1 -Docx <เต็ม> -Pdf <เต็ม>` — Word อัปเดตสารบัญทั้ง 3 ชุดและส่งออก PDF (ต้องมี Microsoft Word; ถ้าไม่มี ไฟล์ .docx ตั้ง updateFields ไว้ ผู้ใช้กด F9/อัปเดตเมื่อเปิดได้)

### 6. ตรวจเล่ม
`node pdfpages.mjs out.pdf pages 0.8` แล้วทำ contact sheet 8 หน้า/ภาพ ตรวจ: เลขหน้า ก/1, สารบัญมีเลขหน้าครบ, ภาษาไทยตัดบรรทัดปกติ (ไม่ถ่าง/ไม่ขาดกลางวลี), ภาพไม่เล็กเกินอ่าน (เรนเดอร์หน้าเดียวที่ scale 3 ดูความคม)

### 7. รายงานผู้ใช้
บอกที่อยู่ไฟล์, จำนวนหน้า/ภาพ, สิ่งที่ต้องเติมเอง (ตราหน่วยงาน, เบอร์ติดต่อ, ผู้ลงนาม), และ**ปัญหาของระบบที่พบระหว่างเดินทุกขั้น** — การจับภาพทุกหน้าจอเป็นการทดสอบ end-to-end ไปในตัว มักเจอ bug จริง (เช่น ฟอร์มไม่ส่งค่าที่เลือก, ตรวจวันที่ด้วย UTC, ฟอร์มล้างค่าหลัง error) ถ้า bug ขวางการเดินขั้นตอน ให้แก้พร้อม test และแจ้งชัดว่าแก้อะไร ส่วนที่ไม่ขวางให้รายงานไว้ให้ผู้ใช้ตัดสินใจ
