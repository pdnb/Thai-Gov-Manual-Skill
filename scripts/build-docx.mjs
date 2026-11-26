// Build a Thai-government-style manual (.docx) from a content module + screenshots.
// usage: node build-docx.mjs <content.mjs> <imagesDir> <out.docx>
//   imagesDir holds <id>.png (2x screenshots), manifest.json (id -> caption) and optional cover-logo.png.
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import {
  AlignmentType, BorderStyle, Document, Footer, Header, HeadingLevel, ImageRun, LevelFormat, NumberFormat,
  Packer, PageBreak, PageNumber, Paragraph, ShadingType, StyleLevel, Table, TableCell, TableLayoutType,
  TableOfContents, TableRow, TextRun, VerticalAlign, WidthType,
} from 'docx';

const [contentFile, imgDir, outFile] = process.argv.slice(2);
if (!contentFile || !imgDir || !outFile) { console.error('usage: node build-docx.mjs <content.mjs> <imagesDir> <out.docx>'); process.exit(1); }
const { appendices = [], chapters, control = [], meta, preface = [], extraCaptions = {} } = await import(pathToFileURL(path.resolve(contentFile)).href);
const extraDir = imgDir;
const FONT = 'TH Sarabun New';
const PT = (n) => n * 2; // half-points
const CONTENT_W = 9071; // A4 21cm − 3cm − 2cm, DXA
const APPX = ['ก', 'ข', 'ค', 'ง', 'จ'];

// ---------- helpers ----------
// Word only wraps Thai at dictionary word breaks when Thai proofing is installed; insert U+200B between
// Thai words so lines wrap correctly on any machine (invisible when printed).
const seg = new Intl.Segmenter('th', { granularity: 'word' });
const THAI = /[฀-๿]/;
function thaiBreaks(text) {
  let out = '', prevThai = false;
  for (const { segment } of seg.segment(text)) {
    const isThai = THAI.test(segment);
    if (isThai && prevThai) out += '​';
    out += segment;
    prevThai = isThai;
  }
  return out;
}
const run = (text, o = {}) => new TextRun({ text: thaiBreaks(text), font: FONT, language: { value: 'th-TH', eastAsia: 'th-TH', bidirectional: 'th-TH' }, ...o });
const para = (children, o = {}) => new Paragraph({ children: Array.isArray(children) ? children : [children], ...o });
const body = (text) => para(run(text), { alignment: AlignmentType.JUSTIFIED, indent: { firstLine: 720 }, spacing: { after: 80 } });
const blank = (n = 1) => Array.from({ length: n }, () => para(run('')));

function pngSize(file) {
  const b = fs.readFileSync(file);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), data: b };
}
function imgFile(id) {
  for (const d of [imgDir, extraDir]) {
    const f = path.join(d, `${id}.png`);
    if (fs.existsSync(f)) return f;
  }
  throw new Error(`missing image ${id}`);
}
/** Display size in px (96 dpi) for a 2× screenshot. */
function displaySize(id, maxW = 567, maxH = 790) {
  const { w, h, data } = pngSize(imgFile(id));
  const cssW = w / 2, cssH = h / 2;
  let dw = cssH < 260 ? cssW * 0.6 : cssW <= 800 ? Math.min(cssW * 0.62, 430) : Math.min(cssW * 0.394, maxW);
  dw = Math.min(dw, maxW);
  let dh = (dw * cssH) / cssW;
  if (dh > maxH) { dw = (dw * maxH) / dh; dh = maxH; }
  return { data, width: Math.round(dw), height: Math.round(dh) };
}

const captions = JSON.parse(fs.readFileSync(path.join(imgDir, 'manifest.json'), 'utf8'));
Object.assign(captions, extraCaptions); // captions for images not produced by shot(), e.g. diagrams

const thin = { style: BorderStyle.SINGLE, size: 4, color: '9CA3AF' };
const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };

function imageCell(id, maxW) {
  const s = displaySize(id, maxW);
  return { s, run: new ImageRun({ type: 'png', data: s.data, transformation: { width: s.width, height: s.height } }) };
}

function figureCaption(label, id) {
  return para([run(`ภาพที่ ${label} `, { bold: true }), run(captions[id] ?? '')], {
    style: 'FigureCaption', alignment: AlignmentType.CENTER, spacing: { before: 60, after: 200 },
  });
}

function figureBlock(id, label) {
  const { s, run: img } = imageCell(id);
  const wDxa = Math.round(s.width * 15) + 120; // px → dxa (1px = 15 dxa)
  const t = new Table({
    alignment: AlignmentType.CENTER,
    layout: TableLayoutType.FIXED,
    width: { size: wDxa, type: WidthType.DXA },
    columnWidths: [wDxa],
    rows: [new TableRow({ cantSplit: true, children: [new TableCell({
      width: { size: wDxa, type: WidthType.DXA },
      borders: { top: thin, bottom: thin, left: thin, right: thin },
      margins: { top: 40, bottom: 40, left: 40, right: 40 },
      children: [para(img, { alignment: AlignmentType.CENTER, keepNext: true })],
    })] })],
  });
  return [para(run(''), { spacing: { before: 60, after: 0 }, keepNext: true }), t, figureCaption(label, id)];
}

function figurePair(ids, labels) {
  const colW = Math.floor(CONTENT_W / 2);
  const cells = ids.map((id, i) => {
    const { run: img } = imageCell(id, 270);
    return new TableCell({
      width: { size: colW, type: WidthType.DXA },
      borders: { top: none, bottom: none, left: none, right: none },
      verticalAlign: VerticalAlign.BOTTOM,
      children: [para(img, { alignment: AlignmentType.CENTER, keepNext: true }), figureCaption(labels[i], id)],
    });
  });
  return [new Table({
    width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: [colW, colW], layout: TableLayoutType.FIXED,
    borders: { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none },
    rows: [new TableRow({ cantSplit: true, children: cells })],
  })];
}

function dataTable(t, label) {
  const headRow = new TableRow({
    tableHeader: true,
    children: t.head.map((h, i) => new TableCell({
      width: { size: t.widths[i], type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, fill: 'E5E7EB', color: 'auto' },
      verticalAlign: VerticalAlign.CENTER,
      children: [para(run(h, { bold: true }), { alignment: AlignmentType.CENTER })],
    })),
  });
  const rows = t.rows.map((r) => new TableRow({
    cantSplit: true,
    children: r.map((c, i) => new TableCell({
      width: { size: t.widths[i], type: WidthType.DXA },
      margins: { left: 100, right: 100 },
      children: [para(run(c))],
    })),
  }));
  return [
    para([run(`ตารางที่ ${label} `, { bold: true }), run(t.caption)], { style: 'TableCaption', keepNext: true, spacing: { before: 160, after: 60 } }),
    new Table({
      width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: t.widths, layout: TableLayoutType.FIXED,
      borders: { top: thin, bottom: thin, left: thin, right: thin, insideHorizontal: thin, insideVertical: thin },
      rows: [headRow, ...rows],
    }),
    para(run(''), { spacing: { after: 80 } }),
  ];
}

let listInstance = 0;
function steps(items) {
  listInstance++;
  return items.map((t) => para(run(t), { numbering: { reference: 'steps', level: 0, instance: listInstance }, spacing: { after: 40 } }));
}
const bullets = (items) => items.map((t) => para(run(t), { numbering: { reference: 'bullets', level: 0 }, spacing: { after: 40 } }));

function note(text) {
  return para([run('หมายเหตุ ', { bold: true }), run(text)], {
    shading: { type: ShadingType.CLEAR, fill: 'FFF7E6', color: 'auto' },
    border: { left: { style: BorderStyle.SINGLE, size: 18, color: 'F59E0B', space: 8 } },
    indent: { left: 240, right: 120 },
    spacing: { before: 120, after: 160 },
  });
}

// ---------- render chapters ----------
function renderPart(part, chapterKey, chapterHeading) {
  const out = [];
  let h2 = 0, h3 = 0, fig = 0, tbl = 0;
  out.push(para([run(chapterHeading.label, { bold: true, size: PT(20) }), run(chapterHeading.title, { bold: true, size: PT(20), break: 1 })], {
    heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, pageBreakBefore: true, spacing: { after: 360 },
  }));
  for (const b of part.blocks) {
    if (b.h2) { h2++; h3 = 0; out.push(para(run(`${chapterKey}.${h2} ${b.h2}`), { heading: HeadingLevel.HEADING_2 })); }
    else if (b.h3) { h3++; out.push(para(run(`${chapterKey}.${h2}.${h3} ${b.h3}`), { heading: HeadingLevel.HEADING_3 })); }
    else if (b.p) out.push(body(b.p));
    else if (b.steps) out.push(...steps(b.steps));
    else if (b.bullets) out.push(...bullets(b.bullets));
    else if (b.note) out.push(note(b.note));
    else if (b.fig) { fig++; out.push(...figureBlock(b.fig, `${chapterKey}-${fig}`)); }
    else if (b.figs) { const labels = b.figs.map(() => `${chapterKey}-${++fig}`); out.push(...figurePair(b.figs, labels)); }
    else if (b.table) { tbl++; out.push(...dataTable(b.table, `${chapterKey}-${tbl}`)); }
  }
  return out;
}

const mainChildren = [];
chapters.forEach((c, i) => mainChildren.push(...renderPart(c, String(i + 1), { label: `บทที่ ${i + 1}`, title: c.title })));
appendices.forEach((a, i) => mainChildren.push(...renderPart(a, APPX[i], { label: `ภาคผนวก ${APPX[i]}`, title: a.title })));

// ---------- front matter ----------
const logo = fs.existsSync(path.join(imgDir, 'cover-logo.png')) ? pngSize(path.join(imgDir, 'cover-logo.png')) : null;
const cover = [
  ...blank(3),
  ...(logo ? [para(new ImageRun({ type: 'png', data: logo.data, transformation: { width: 120, height: Math.round((120 * logo.h) / logo.w) } }), { alignment: AlignmentType.CENTER, spacing: { after: 480 } })] : blank(4)),
  para(run(meta.title, { bold: true, size: PT(36) }), { alignment: AlignmentType.CENTER }),
  para(run(meta.system, { bold: true, size: PT(24) }), { alignment: AlignmentType.CENTER }),
  para(run(`(${meta.systemEn})`, { bold: true, size: PT(22) }), { alignment: AlignmentType.CENTER }),
  para(run(meta.subtitle, { size: PT(20) }), { alignment: AlignmentType.CENTER, spacing: { before: 240 } }),
  ...blank(8),
  para(run(`ฉบับที่ ${meta.version}`, { size: PT(18) }), { alignment: AlignmentType.CENTER }),
  para(run(meta.dateTh, { size: PT(18) }), { alignment: AlignmentType.CENTER }),
  ...blank(2),
  para(run(meta.org, { bold: true, size: PT(20) }), { alignment: AlignmentType.CENTER }),
  para(run(meta.university, { bold: true, size: PT(20) }), { alignment: AlignmentType.CENTER }),
];

const centeredTitle = (t, first = false) => para(run(t, { bold: true, size: PT(20) }), { alignment: AlignmentType.CENTER, spacing: { after: 240 }, pageBreakBefore: !first });

const signW = [3023, 3024, 3024];
const signTable = new Table({
  width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: signW, layout: TableLayoutType.FIXED,
  borders: { top: thin, bottom: thin, left: thin, right: thin, insideHorizontal: thin, insideVertical: thin },
  rows: [
    new TableRow({ children: ['ผู้จัดทำ', 'ผู้ตรวจสอบ', 'ผู้อนุมัติ'].map((h, i) => new TableCell({ width: { size: signW[i], type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, fill: 'E5E7EB', color: 'auto' }, children: [para(run(h, { bold: true }), { alignment: AlignmentType.CENTER })] })) }),
    new TableRow({ children: signW.map((w) => new TableCell({ width: { size: w, type: WidthType.DXA }, children: [para(run('')), para(run('ลงชื่อ ..................................'), { alignment: AlignmentType.CENTER }), para(run('(..................................)'), { alignment: AlignmentType.CENTER }), para(run('วันที่ ........./........./.........'), { alignment: AlignmentType.CENTER })] })) }),
  ],
});
const ctlW = [1300, 2200, 5571];
const ctlTable = new Table({
  width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: ctlW, layout: TableLayoutType.FIXED,
  borders: { top: thin, bottom: thin, left: thin, right: thin, insideHorizontal: thin, insideVertical: thin },
  rows: [
    new TableRow({ tableHeader: true, children: ['ฉบับที่', 'วันที่', 'รายละเอียดการปรับปรุง'].map((h, i) => new TableCell({ width: { size: ctlW[i], type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, fill: 'E5E7EB', color: 'auto' }, children: [para(run(h, { bold: true }), { alignment: AlignmentType.CENTER })] })) }),
    ...control.map((r) => new TableRow({ children: r.map((c, i) => new TableCell({ width: { size: ctlW[i], type: WidthType.DXA }, margins: { left: 100, right: 100 }, children: [para(run(c), { alignment: i < 2 ? AlignmentType.CENTER : AlignmentType.LEFT })] })) })),
  ],
});

const front = [
  centeredTitle('การควบคุมเอกสาร', true),
  para(run('ประวัติการปรับปรุงเอกสาร', { bold: true }), { spacing: { after: 80 } }),
  ctlTable,
  ...blank(1),
  para(run('การตรวจสอบและอนุมัติเอกสาร', { bold: true }), { spacing: { after: 80 } }),
  signTable,
  centeredTitle('คำนำ'),
  ...preface.map(body),
  ...blank(2),
  para(run(meta.org), { alignment: AlignmentType.RIGHT }),
  para(run(meta.dateTh), { alignment: AlignmentType.RIGHT }),
  centeredTitle('สารบัญ'),
  para([run('เรื่อง', { bold: true }), run('\tหน้า', { bold: true })], { tabStops: [{ type: 'right', position: CONTENT_W }] }),
  new TableOfContents('สารบัญ', { hyperlink: true, headingStyleRange: '1-2' }),
  centeredTitle('สารบัญภาพ'),
  para([run('ภาพ', { bold: true }), run('\tหน้า', { bold: true })], { tabStops: [{ type: 'right', position: CONTENT_W }] }),
  new TableOfContents('สารบัญภาพ', { hyperlink: true, stylesWithLevels: [new StyleLevel('FigureCaption', 1)] }),
  centeredTitle('สารบัญตาราง'),
  para([run('ตาราง', { bold: true }), run('\tหน้า', { bold: true })], { tabStops: [{ type: 'right', position: CONTENT_W }] }),
  new TableOfContents('สารบัญตาราง', { hyperlink: true, stylesWithLevels: [new StyleLevel('TableCaption', 1)] }),
];

const pageNumberHeader = () => new Header({ children: [para(new TextRun({ children: [PageNumber.CURRENT], font: FONT }), { alignment: AlignmentType.CENTER })] });
const page = {
  size: { width: 11906, height: 16838 },
  margin: { top: 1418, bottom: 1134, left: 1701, right: 1134, header: 709, footer: 567 },
};
const footer = () => new Footer({ children: [para(run(`${meta.title} ${meta.systemEn} ฉบับที่ ${meta.version}`, { size: PT(12), color: '6B7280' }), { alignment: AlignmentType.RIGHT })] });

const runDefaults = { font: FONT, size: PT(16), language: { value: 'th-TH', eastAsia: 'th-TH', bidirectional: 'th-TH' } };
const doc = new Document({
  creator: meta.org,
  title: `${meta.title} ${meta.systemEn}`,
  description: meta.system,
  features: { updateFields: true },
  styles: {
    default: {
      document: { run: runDefaults, paragraph: { spacing: { line: 240 } } },
      heading1: { run: { font: FONT, size: PT(20), bold: true, color: '000000' }, paragraph: { spacing: { before: 0, after: 360 }, keepNext: true, alignment: AlignmentType.CENTER } },
      heading2: { run: { font: FONT, size: PT(18), bold: true, color: '000000' }, paragraph: { spacing: { before: 240, after: 80 }, keepNext: true } },
      heading3: { run: { font: FONT, size: PT(16), bold: true, color: '000000' }, paragraph: { spacing: { before: 160, after: 60 }, keepNext: true } },
    },
    paragraphStyles: [
      { id: 'FigureCaption', name: 'FigureCaption', basedOn: 'Normal', quickFormat: true, run: { font: FONT, size: PT(16) }, paragraph: { alignment: AlignmentType.CENTER } },
      { id: 'TableCaption', name: 'TableCaption', basedOn: 'Normal', quickFormat: true, run: { font: FONT, size: PT(16) }, paragraph: { keepNext: true } },
    ],
  },
  numbering: {
    config: [
      { reference: 'steps', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } }, run: { font: FONT } } }] },
      { reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } }, run: { font: FONT } } }] },
    ],
  },
  sections: [
    { properties: { page }, children: cover },
    { properties: { page: { ...page, pageNumbers: { start: 1, formatType: NumberFormat.THAI_LETTERS } } }, headers: { default: pageNumberHeader() }, children: front },
    { properties: { page: { ...page, pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } } }, headers: { default: pageNumberHeader() }, footers: { default: footer() }, children: mainChildren },
  ],
});

fs.writeFileSync(outFile, await Packer.toBuffer(doc));
console.log('written', outFile);
void PageBreak;
