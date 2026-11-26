# ตัวอย่าง: SRU Career Path

งานจริงที่ใช้ skill นี้ (คำขอกำหนดตำแหน่งที่สูงขึ้น, 9 บทบาท, เดินคำขอ HPA-2569-00001 ตั้งแต่ร่างถึงปิดเรื่อง)
ใน repo ของโปรเจกต์อยู่ที่ `tools/manual-screenshots/` ผลลัพธ์อยู่ที่ `docs/manuals/`

- `setup.mjs` — configure() สำหรับ Laravel + Inertia + Ant Design บน Herd
- `scenes/` — 11 ฉาก ลำดับรัน: ch1 ch3a ch4 ch5a ch5b ch6 ch5c ch5d ch8a ch5e ch8b
  (ฉากเหล่านี้ import `../lib.mjs` และ `./state.mjs` ตามโครงที่วางใน repo: scenes/ อยู่ข้าง lib.mjs)
- `content.mjs` — เนื้อหาเล่ม 9 บท + ภาคผนวก 3 ภาค ใช้เป็นแม่แบบสำนวนและโครงเล่ม
- `diagram.mjs` — แผนภาพขั้นตอนเรนเดอร์จาก HTML

ใช้เป็นแบบอย่างรูปแบบการเขียน ไม่ใช่โค้ดที่รันได้กับระบบอื่นโดยตรง
