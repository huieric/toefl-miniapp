/**
 * 数据库种子脚本 - 写作扩充 18 题
 * 独立写作 9 + 综合写作 9
 */

const { Pool } = require('pg');

const INDEPENDENT_WRITING = [
  { title: "Sample W11 — Government Health Care Funding", content: "Some people believe that the government should fund healthcare for all citizens, while others believe healthcare should be provided by private companies. Discuss both views and give your own opinion.", difficulty: "hard", source: "writing-independent", answer: "The question of whether healthcare should be government-funded or privately provided is a subject of ongoing debate." },
  { title: "Sample W12 — Space Exploration Investment", content: "Some people argue that governments should invest more in space exploration, while others believe this money would be better spent on solving problems on Earth. Discuss both views and give your own opinion.", difficulty: "hard", source: "writing-independent", answer: "The allocation of government resources between space exploration and earthly problems represents a fundamental question about priorities." },
  { title: "Sample W13 — Artificial Intelligence Regulation", content: "Some people believe that artificial intelligence should be heavily regulated by governments, while others argue that regulation would stifle innovation. Discuss both views and give your own opinion.", difficulty: "hard", source: "writing-independent", answer: "The rapid advancement of artificial intelligence has sparked intense debate about the appropriate level of government regulation." },
  { title: "Sample W14 — University Tuition Costs", content: "Some people argue that university education should be free for all students, while others believe students should pay the full cost of their education. Discuss both views and give your own opinion.", difficulty: "medium", source: "writing-independent", answer: "The question of who should bear the cost of university education involves fundamental considerations about the purpose of higher education." },
  { title: "Sample W15 — Technology and Social Interaction", content: "Some people believe that modern technology has made social interactions less meaningful, while others argue it has enhanced our ability to connect with others. Discuss both views and give your own opinion.", difficulty: "medium", source: "writing-independent", answer: "The impact of modern technology on human social interaction is complex and multifaceted." },
  { title: "Sample W16 — Cultural Preservation", content: "Some people believe that in an era of globalization, it is important to preserve traditional cultures and customs. Others believe that globalization makes cultural preservation unnecessary. Discuss both views and give your own opinion.", difficulty: "medium", source: "writing-independent", answer: "The tension between globalization and cultural preservation represents one of the defining challenges of the modern era." },
  { title: "Sample W17 — Physical Education in Schools", content: "Some people believe that physical education should be a mandatory part of the school curriculum, while others argue that it is less important than academic subjects. Discuss both views and give your own opinion.", difficulty: "medium", source: "writing-independent", answer: "The role of physical education in school curricula is often debated, particularly in an era where academic achievement is increasingly emphasized." },
  { title: "Sample W18 — Work-Life Balance", content: "Some people believe that employees should prioritize their careers over their personal lives, while others believe work-life balance is more important. Discuss both views and give your own opinion.", difficulty: "medium", source: "writing-independent", answer: "The debate over whether career priorities should supersede personal life reflects fundamental questions about the meaning of success." },
  { title: "Sample W19 — Environmental Protection vs Economic Growth", content: "Some people believe that environmental protection should take priority over economic development, while others believe that economic growth should not be sacrificed for the environment. Discuss both views and give your own opinion.", difficulty: "hard", source: "writing-independent", answer: "The tension between environmental protection and economic development represents one of the most challenging policy dilemmas." },
];

const INTEGRATED_WRITING = [
  { title: "Sample WI11 — Renewable Energy Investment", content: "The reading passage discusses the advantages of investing in renewable energy sources. The professor casts doubt on some of these claims. Summarize the points the professor makes.", difficulty: "hard", source: "writing-integrated", reading_summary: "The reading argues that investing in renewable energy reduces carbon emissions, creates jobs, and provides energy independence.", lecture_summary: "The professor argues that renewable energy faces intermittency problems, has environmental costs in manufacturing, and would cause job losses in fossil fuel industries.", answer: "The reading passage advocates for investment in renewable energy..." },
  { title: "Sample WI12 — City Bike Sharing Programs", content: "The reading passage discusses the benefits of city bike sharing programs. The professor presents several concerns about this approach. Summarize the points the professor raises.", difficulty: "medium", source: "writing-integrated", reading_summary: "The reading argues that bike sharing reduces traffic, pollution, promotes health, and provides convenient transportation.", lecture_summary: "The professor argues that bike sharing creates operational challenges, worsens traffic, and only serves a narrow demographic.", answer: "The reading passage promotes bike sharing programs as solutions to urban transportation problems..." },
  { title: "Sample WI13 — Four-Day Work Week", content: "The reading passage discusses the benefits of a four-day work week. The professor casts doubt on these benefits. Summarize the points the professor makes.", difficulty: "medium", source: "writing-integrated", reading_summary: "The reading argues that a four-day work week improves health, increases productivity, and reduces costs.", lecture_summary: "The professor argues that many industries cannot operate with fewer hours, it harms low-income workers, and creates competitive disadvantages.", answer: "The reading passage advocates for a four-day work week..." },
  { title: "Sample WI14 — Teaching History Through Museums", content: "The reading passage discusses the educational value of museums for teaching history. The professor discusses this topic critically. Summarize the professor's main points.", difficulty: "medium", source: "writing-integrated", reading_summary: "The reading argues that museums provide invaluable educational experiences through authentic artifacts and hands-on engagement.", lecture_summary: "The professor argues that museums present selective narratives, most students don't visit regularly, and artifacts alone cannot convey historical complexity.", answer: "The reading passage promotes museums as essential educational tools..." },
  { title: "Sample WI15 — Plant-Based Diets", content: "The reading passage argues that plant-based diets are beneficial for health and the environment. The professor raises concerns. Summarize the professor's points.", difficulty: "hard", source: "writing-integrated", reading_summary: "The reading argues that plant-based diets reduce disease risk, lower emissions, conserve resources, and improve food security.", lecture_summary: "The professor argues that plant-based diets can cause nutritional deficiencies, environmental benefits depend on production methods, and pastoral practices can be sustainable.", answer: "The reading passage promotes plant-based diets as beneficial..." },
  { title: "Sample WI16 — Standardized Testing in College Admissions", content: "The reading passage supports standardized tests in college admissions. The professor casts doubt on their effectiveness. Summarize the points the professor makes.", difficulty: "hard", source: "writing-integrated", reading_summary: "The reading defends standardized tests as objective measures that predict success and provide fair comparison.", lecture_summary: "The professor argues that tests favor wealthy students, are poor predictors of success, and miss many capable students.", answer: "The reading passage defends standardized tests as objective measures..." },
  { title: "Sample WI17 — Animal Testing in Research", content: "The reading passage argues that animal testing is necessary for medical advancement. The professor presents counterarguments. Summarize the professor's points.", difficulty: "hard", source: "writing-integrated", reading_summary: "The reading argues that animal testing is essential for medical research and drug development.", lecture_summary: "The professor argues that animal models fail to predict human responses, modern technology provides better alternatives, and animal testing raises ethical concerns.", answer: "The reading passage defends animal testing as essential for medical progress..." },
  { title: "Sample WI18 — Remote Work Policies", content: "The reading passage supports allowing employees to work remotely. The professor presents concerns about this practice. Summarize the professor's arguments.", difficulty: "medium", source: "writing-integrated", reading_summary: "The reading argues that remote work increases productivity, reduces costs, and improves work-life balance.", lecture_summary: "The professor argues that remote work hinders collaboration, blurs work-life boundaries, and deprives juniors of mentorship.", answer: "The reading passage advocates for remote work policies..." },
  { title: "Sample WI19 — Teaching Multiple Languages", content: "The reading passage discusses the benefits of teaching multiple languages in schools. The professor presents counterarguments. Summarize the professor's points.", difficulty: "medium", source: "writing-integrated", reading_summary: "The reading argues that multiple language education improves cognitive development, career opportunities, and cultural understanding.", lecture_summary: "The professor argues that most students lack time and aptitude, technology reduces the need, and resources could be better invested in STEM.", answer: "The reading passage promotes multiple language education as essential..." },
];

const pool = new Pool({
  connectionString: 'postgresql://toefl:toefl123@localhost:5433/toefl_db',
});

async function main() {
  let inserted = 0;
  let skipped = 0;

  // 独立写作
  console.log('=== Seeding Independent Writing ===');
  for (const q of INDEPENDENT_WRITING) {
    try {
      const res = await pool.query(
        `INSERT INTO questions (title, subject, type, difficulty, source, content, answer, status)
         VALUES ($1, 'writing', 'independent', $2, $3, $4, $5, 'approved')
         ON CONFLICT DO NOTHING RETURNING id`,
        [q.title, q.difficulty, q.source, q.content, q.answer]
      );
      if (res.rows.length > 0) {
        console.log('  ✓ Inserted: ' + q.title);
        inserted++;
      } else {
        console.log('  ⏭ Skipped: ' + q.title);
        skipped++;
      }
    } catch (e) {
      console.error('  ✗ Error: ' + q.title + ' - ' + e.message);
    }
  }

  // 综合写作 — 使用 analysis 字段存储 reading_summary 和 lecture_summary
  console.log('\n=== Seeding Integrated Writing ===');
  for (const q of INTEGRATED_WRITING) {
    try {
      const analysis = `[阅读摘要] ${q.reading_summary}\n[讲座摘要] ${q.lecture_summary}`;
      const res = await pool.query(
        `INSERT INTO questions (title, subject, type, difficulty, source, content, answer, analysis, status)
         VALUES ($1, 'writing', 'integrated', $2, $3, $4, $5, $6, 'approved')
         ON CONFLICT DO NOTHING RETURNING id`,
        [q.title, q.difficulty, q.source, q.content, q.answer, analysis]
      );
      if (res.rows.length > 0) {
        console.log('  ✓ Inserted: ' + q.title);
        inserted++;
      } else {
        console.log('  ⏭ Skipped: ' + q.title);
        skipped++;
      }
    } catch (e) {
      console.error('  ✗ Error: ' + q.title + ' - ' + e.message);
    }
  }

  // 最终统计
  const result = await pool.query("SELECT subject, COUNT(*) FROM questions WHERE status = 'approved' GROUP BY subject ORDER BY subject");
  console.log('\n=== Final Counts ===');
  result.rows.forEach(r => console.log(r.subject + ': ' + r.count));

  await pool.end();
  console.log(`\nDone! Inserted: ${inserted}, Skipped: ${skipped}`);
}

main().catch(e => { console.error(e); process.exit(1); });
