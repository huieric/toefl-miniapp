'use strict';
const { DEFAULT_PASSAGES } = require('../src/data/default-passages.js');
console.log('Total passages:', DEFAULT_PASSAGES.length);
const bySubject = {};
DEFAULT_PASSAGES.forEach(p => {
  if (!bySubject[p.subject]) bySubject[p.subject] = [];
  bySubject[p.subject].push(p.passage_id);
});
Object.keys(bySubject).sort().forEach(s => {
  console.log(s + ':', bySubject[s].join(', '));
});
// Verify all speaking/writing answers parse
let errors = 0;
DEFAULT_PASSAGES.forEach(p => {
  p.questions.forEach(q => {
    if (['speaking','writing'].includes(p.subject)) {
      try { JSON.parse(q.answer); }
      catch(e) { console.log('BAD:', p.passage_id, q.order, q.answer.substring(0,50)); errors++; }
    }
  });
});
console.log('JSON answer validation:', errors === 0 ? 'PASSED' : errors + ' errors');
// Verify all listening/reading answers are strings
let strErrors = 0;
DEFAULT_PASSAGES.forEach(p => {
  if (['reading','listening'].includes(p.subject)) {
    p.questions.forEach(q => {
      if (typeof q.answer !== 'string') { console.log('BAD TYPE:', p.passage_id, typeof q.answer); strErrors++; }
    });
  }
});
console.log('String answer validation:', strErrors === 0 ? 'PASSED' : strErrors + ' errors');
// Check passage_id uniqueness
const ids = new Set();
let dupes = 0;
DEFAULT_PASSAGES.forEach(p => { if (ids.has(p.passage_id)) { console.log('DUPE:', p.passage_id); dupes++; } ids.add(p.passage_id); });
console.log('Uniqueness check:', dupes === 0 ? 'PASSED' : dupes + ' duplicates');
console.log('\nAll validations complete.');
