// Render the workflow overview (ภาพที่ 2-1) to docs/manuals/images/2-1.png
import { chromium } from 'playwright';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const steps = [
  ['ร่าง', 'ผู้ขอ'],
  ['รอผู้บังคับบัญชารับรอง', 'ผู้บังคับบัญชา'],
  ['เจ้าหน้าที่ตรวจสอบ', 'เจ้าหน้าที่'],
  ['แต่งตั้งกรรมการ/ผู้ประเมิน', 'เจ้าหน้าที่'],
  ['อยู่ระหว่างประเมิน', 'กรรมการ / ผู้ประเมิน'],
  ['ประเมินเสร็จสิ้น', 'เจ้าหน้าที่รับรองผล'],
  ['รอพิจารณาในที่ประชุม', 'ที่ประชุม'],
  ['รออนุมัติ', 'ผู้บริหาร'],
  ['อนุมัติ', 'เจ้าหน้าที่'],
  ['ออกคำสั่งแล้ว', 'เจ้าหน้าที่'],
  ['ปิดเรื่อง', '—'],
];
const box = (s, i) => `<div class="box${i === steps.length - 1 ? ' end' : ''}"><span class="n">${i + 1}</span><b>${s[0]}</b><small>${s[1]}</small></div>`;
const rows = [steps.slice(0, 4), steps.slice(4, 8), steps.slice(8)];
let idx = 0;
const rowHtml = rows.map((r, ri) => `<div class="row">${r.map((s) => { const h = box(s, idx++); return h; }).join('<div class="arr">→</div>')}${ri < rows.length - 1 ? '' : ''}</div>`).join('<div class="down">↓</div>');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;font-family:'TH Sarabun New','Sarabun',sans-serif;background:#fff;color:#1f2937}
.wrap{padding:28px 32px;width:1100px}
.row{display:flex;align-items:stretch;gap:0}
.box{flex:0 0 220px;border:2px solid #1677ff;border-radius:10px;padding:10px 12px 8px;background:#eef5ff;position:relative}
.box.end{background:#e8f7ee;border-color:#16a34a}
.box b{display:block;font-size:26px;line-height:1.1}
.box small{font-size:21px;color:#4b5563}
.n{position:absolute;top:-13px;left:-13px;width:28px;height:28px;border-radius:50%;background:#1677ff;color:#fff;font:700 17px/28px Arial;text-align:center}
.end .n{background:#16a34a}
.arr{flex:0 0 52px;display:flex;align-items:center;justify-content:center;font-size:34px;color:#1677ff}
.down{font-size:34px;color:#1677ff;padding:2px 0 2px 1012px;line-height:1}
.row:nth-of-type(2){flex-direction:row}
.legend{margin-top:22px;border-top:2px dashed #9ca3af;padding-top:12px;font-size:23px;line-height:1.35}
.legend .r{color:#d97706;font-weight:700}.legend .x{color:#dc2626;font-weight:700}
</style></head><body><div class="wrap">${rowHtml}
<div class="legend">
<div><span class="r">ส่งกลับแก้ไข</span> — จากขั้นที่ 2 (ผู้บังคับบัญชา) ขั้นที่ 3 (เจ้าหน้าที่) หรือขั้นที่ 7 (ที่ประชุม) คำขอกลับไปให้ผู้ขอแก้ไข แล้วยื่นแก้ไขกลับมายังขั้นที่ส่งกลับ</div>
<div><span class="x">ไม่อนุมัติ / ไม่ผ่าน</span> — สิ้นสุดคำขอได้ที่ขั้นที่ 3 (ไม่ผ่านคุณสมบัติ) ขั้นที่ 7 (มติไม่เห็นชอบ) หรือขั้นที่ 8 (ไม่อนุมัติ)</div>
<div>ผู้ขอถอนคำขอได้ก่อนเข้าสู่ขั้นที่หลักเกณฑ์กำหนด และเจ้าหน้าที่ยกเลิกคำขอได้เมื่อมีเหตุผลตามระเบียบ</div>
</div></div></body></html>`;

const OUT = new URL('../../docs/manuals/images/', import.meta.url);
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ deviceScaleFactor: 2, viewport: { width: 1180, height: 600 } });
await p.setContent(html);
await p.evaluate(() => document.fonts.ready);
await p.locator('.wrap').screenshot({ path: fileURLToPath(new URL('2-1.png', OUT)) });
await b.close();
console.log('ok');
