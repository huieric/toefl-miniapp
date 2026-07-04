const assert = require('assert');
const { parseTOEFLReadingPDF } = require('../src/services/pdf-parser');

async function parseWithMockDb(pdfPath, maxPages) {
  const inserts = [];
  const db = {
    async query(_sql, params) {
      inserts.push({
        subject: params[0],
        type: params[1],
        difficulty: params[2],
        title: params[3],
        content: params[4],
        options: JSON.parse(params[5]),
        answer: params[6],
        analysis: params[7],
        passageText: params[8],
        passageId: params[9],
        order: params[10],
      });
      return { rows: [] };
    },
  };

  const result = await parseTOEFLReadingPDF(pdfPath, db, `test-${maxPages}`, { maxPages });
  return { result, inserts };
}

async function main() {
  const pdfPath = process.argv[2];
  if (!pdfPath) {
    throw new Error('Usage: node scripts/test-pdf-parser.js <reading-pdf>');
  }

  const first = await parseWithMockDb(pdfPath, 4);
  assert.strictEqual(first.result.insertedCount, 14, 'first passage should parse 14 questions');
  assert.strictEqual(first.inserts[0].answer, 'A', 'Q1 answer should be A');
  assert.strictEqual(first.inserts[12].answer, 'C', 'insertion question answer should be C');
  assert.strictEqual(first.inserts[13].answer, 'B,C,E', 'summary question should keep multiple answers');
  assert.strictEqual(first.inserts[13].options.length, 6, 'summary question should keep A-F options');

  const firstThree = await parseWithMockDb(pdfPath, 10);
  assert.strictEqual(firstThree.result.insertedCount, 42, 'first 10 pages should parse 3 passages / 42 questions');
  assert.strictEqual(new Set(firstThree.inserts.map(q => q.passageId)).size, 3, 'questions should be grouped into 3 passages');
  assert.strictEqual(firstThree.inserts[41].answer, 'C,D,F', 'third passage summary answers should match key');

  console.log(JSON.stringify({
    ok: true,
    checks: [
      { maxPages: 4, inserted: first.result.insertedCount, passages: first.result.passageCount },
      { maxPages: 10, inserted: firstThree.result.insertedCount, passages: firstThree.result.passageCount },
    ],
  }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
