// 批量回归：跑 pdf 目录所有 PDF，检测标题/题数/段落异常
const fs = require('fs');
const path = require('path');
const { _internals } = require('../src/services/pdf-parser');

(async () => {
  const dir = process.argv[2] || path.join(__dirname, '..', '..', '..', 'pdf');
  const files = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.pdf'));
  let ok = 0, bad = 0;
  const problems = [];
  for (const f of files) {
    try {
      const dataBuffer = fs.readFileSync(path.join(dir, f));
      const { text } = await _internals.extractTextWithLayout(dataBuffer, 100);
      const segments = _internals.preProcessText(text);
      const allPassages = [];
      for (const seg of segments) allPassages.push(..._internals.ruleBasedParseSegment(seg));
      if (allPassages.length === 0) {
        bad++; problems.push(`${f} | 未解析出文章`);
        continue;
      }
      const p0 = allPassages[0];
      const title = p0.title || '(无标题)';
      const qc = p0.questions ? p0.questions.length : 0;
      const pc = (p0.passage_text || '').split(/\n\s*\n/).filter(Boolean).length;
      const badTitle = /阅读第|TPO|Sample|学科分类|Passage|^\d|^(PDF|Unknown)/i.test(title);
      const badQ = qc < 5 || qc > 20;
      const badPara = pc < 2 || pc > 12;
      if (badTitle || badQ || badPara) {
        bad++;
        problems.push(`${f} | 标题=[${title.slice(0, 50)}] 题=${qc} 段=${pc}${badTitle ? ' [标题脏]' : ''}${badQ ? ' [题数异常]' : ''}${badPara ? ' [段落异常]' : ''}`);
      } else {
        ok++;
      }
    } catch (e) {
      bad++;
      problems.push(`${f} | 解析失败: ${e.message.slice(0, 90)}`);
    }
  }
  console.log(`\n===== 回归结果: 正常 ${ok} / 异常 ${bad} / 共 ${files.length} =====`);
  for (const p of problems) console.log('⚠️ ' + p);
  process.exit(0);
})().catch((e) => { console.error('批量回归失败:', e.message); process.exit(1); });
