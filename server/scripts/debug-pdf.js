// 调试 PDF 解析：用带布局提取 + 分段，打印每篇标题 + 正文分段结构（⏎=单换行，¶=空行）
const fs = require('fs');
const path = require('path');
const { _internals } = require('../src/services/pdf-parser');

(async () => {
  const pdfPath = process.argv[2];
  if (!pdfPath) { console.error('用法: node scripts/debug-pdf.js <pdf路径>'); process.exit(1); }

  const dataBuffer = fs.readFileSync(path.resolve(pdfPath));
  const { text: rawText, numpages } = await _internals.extractTextWithLayout(dataBuffer, 100);
  console.log(`[debug] PDF=${pdfPath} 页数=${numpages} 文本=${rawText.length}字符`);

  const segments = _internals.preProcessText(rawText);
  console.log(`[debug] 切出 ${segments.length} 段`);

  for (let i = 0; i < Math.min(segments.length, 4); i++) {
    const passages = _internals.ruleBasedParseSegment(segments[i]);
    for (const p of passages) {
      console.log('\n====================');
      console.log('标题:', p.title);
      console.log('题目数:', p.questions ? p.questions.length : 0);
      console.log('--- 正文（⏎=单换行，¶=空行）---');
      const marked = (p.passage_text || '').replace(/\n\n+/g, '¶\n').replace(/\n/g, '⏎\n');
      console.log(marked.substring(0, 1500));
    }
  }
  process.exit(0);
})().catch((e) => { console.error('[debug] 失败:', e.message); process.exit(1); });
