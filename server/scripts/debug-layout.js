const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

(async () => {
  const pdfPath = process.argv[2];
  const targetPage = parseInt(process.argv[3] || '2', 10);
  const buffer = fs.readFileSync(path.resolve(pdfPath));
  const pages = [];
  await pdfParse(buffer, {
    pagerender: (pageData) => pageData.getTextContent().then((tc) => {
      pages.push(tc.items.map((it) => ({ str: it.str, x: Math.round(it.transform[4]), y: Math.round(it.transform[5]) })));
      return '';
    })
  });
  const items = (pages[targetPage - 1] || []).filter((it) => it.str.trim() !== '');
  // 按 y 聚类成行
  const lines = [];
  let cur = null;
  for (const it of items) {
    if (!cur || Math.abs(it.y - cur.y) > 3) { cur = { y: it.y, x: it.x, str: '' }; lines.push(cur); }
    if (it.x < cur.x) cur.x = it.x;
    cur.str += it.str + ' ';
  }
  console.log(`[layout] 第 ${targetPage} 页 ${lines.length} 行`);
  for (let i = 0; i < lines.length; i++) {
    const gap = i > 0 ? (lines[i - 1].y - lines[i].y) : 0;
    console.log(`y=${lines[i].y} x=${lines[i].x} gap=${gap}  ${lines[i].str.replace(/\s+/g, ' ').slice(0, 70)}`);
  }
})().catch((e) => { console.error('失败:', e.message); process.exit(1); });
