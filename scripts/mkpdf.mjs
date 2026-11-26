import fs from 'node:fs';
function pdf(title) {
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    null,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  const stream = `BT /F1 20 Tf 72 760 Td (${title}) Tj ET`;
  objs[3] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  let out = '%PDF-1.4\n'; const offs = [];
  objs.forEach((o, i) => { offs.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const x = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('');
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF\n`;
  return out;
}
fs.mkdirSync('samples', { recursive: true });
for (const [f, t] of [['work-manual.pdf', 'Sample work - Operation manual'], ['work-analysis.pdf', 'Sample work - Analysis'], ['form.pdf', 'Sample application form'], ['doc.pdf', 'Sample supporting document'], ['report.pdf', 'Sample evaluation report'], ['signed.pdf', 'Sample signed document']])
  fs.writeFileSync('samples/' + f, pdf(t));
