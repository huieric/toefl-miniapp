/**
 * 数据库种子脚本 - 口语扩充 18 题
 * 独立题 9 + 综合题 9
 */

const { Pool } = require('pg');
const { ALL_QUESTIONS } = require('./seed-writing-expansion-v2');

const pool = new Pool({
  connectionString: 'postgresql://toefl:toefl123@localhost:5433/toefl_db',
});

// 口语独立题 9
const SPEAKING_QUESTIONS = [
  { title: "Sample S21 — Remote Learning Experience", type: "independent", content: "Some students prefer to study online, while others prefer to study in a classroom. Which do you prefer and why? Include specific reasons and examples in your explanation.", hint: "Focus on comparing the benefits and drawbacks of each approach based on your personal experience.", difficulty: "medium", source: "speaking-independent", answer: "I definitely prefer studying in a classroom..." },
  { title: "Sample S22 — Public Library Usage", type: "independent", content: "Do you agree or disagree with the following statement? Public libraries should expand their services to provide free computer and internet access for all community members.", hint: "Consider both the benefits and potential challenges of this proposal.", difficulty: "hard", source: "speaking-independent", answer: "I strongly agree that public libraries should provide free computer and internet access..." },
  { title: "Sample S23 — Summer Work vs Study", type: "independent", content: "Some university students spend their summer vacation studying courses or taking additional classes, while others prefer to work at a job. Which would you recommend and why?", hint: "Discuss the advantages of each option and justify your recommendation.", difficulty: "medium", source: "speaking-independent", answer: "I would recommend that university students work during the summer..." },
  { title: "Sample S24 — City Parks Investment", type: "independent", content: "Some cities invest large amounts of money in building public parks and green spaces. Others believe this money should be spent on infrastructure projects like roads and bridges. Which view do you agree with?", hint: "Consider the economic, social, and environmental impacts of each investment priority.", difficulty: "hard", source: "speaking-independent", answer: "I believe cities should prioritize investment in public parks over infrastructure projects..." },
  { title: "Sample S25 — University Sports Funding", type: "independent", content: "Some universities spend millions of dollars on athletic programs and sports facilities, while others believe this money should be redirected to academic programs. What is your opinion?", hint: "Weigh the value of athletics against academic investment.", difficulty: "medium", source: "speaking-independent", answer: "I believe universities should continue to invest in athletic programs, but within reasonable limits..." },
  { title: "Sample S26 — Single-School vs Multi-School Education", type: "independent", content: "Do you prefer attending a large comprehensive university or a small liberal arts college? Explain your choice with reasons and examples.", hint: "Compare the distinctive features of each type of institution.", difficulty: "medium", source: "speaking-independent", answer: "I would prefer attending a large comprehensive university for several reasons..." },
  { title: "Sample S27 — Government Arts Funding", type: "independent", content: "Some people believe that governments should fund the arts, including museums, galleries, and theaters. Others believe that such funding should come from private sources. What is your opinion?", hint: "Consider the role of arts in society and who should support them.", difficulty: "hard", source: "speaking-independent", answer: "I believe governments should play a significant role in funding the arts..." },
  { title: "Sample S28 — Online News vs Traditional News", type: "independent", content: "More people now get their news from online sources rather than traditional newspapers or television. Do you think this is a positive or negative development?", hint: "Discuss both the advantages and disadvantages of this shift.", difficulty: "medium", source: "speaking-independent", answer: "I think this trend has more positive than negative aspects..." },
  { title: "Sample S29 — Standardized Testing", type: "independent", content: "Some argue that standardized tests like the SAT and ACT are the best measure of student ability. Others believe they do not accurately reflect a student's potential. Which view do you support?", hint: "Consider both the strengths and limitations of standardized testing.", difficulty: "hard", source: "speaking-independent", answer: "I believe standardized tests have significant limitations..." },
  { title: "Sample S30 — Social Media and Identity", type: "independent", content: "Do you agree or disagree? Social media platforms have a mostly positive effect on how people see themselves and their place in the world.", hint: "Consider psychological impacts and social comparison.", difficulty: "medium", source: "speaking-independent", answer: "I disagree that social media has a mostly positive effect on self-perception..." },
  { title: "Sample S31 — Lifelong Learning", type: "independent", content: "Some people believe that learning should be a continuous process throughout life, while others believe that formal education should be completed early. Discuss both views and give your opinion.", hint: "Consider the benefits and challenges of lifelong learning.", difficulty: "medium", source: "speaking-independent", answer: "I believe lifelong learning is essential in our rapidly changing world..." },
  { title: "Sample S32 — Technology in Education", type: "independent", content: "Some educators believe that technology in the classroom is essential for modern education. Others argue that traditional teaching methods are more effective. Discuss both views and give your opinion.", hint: "Compare technology-enhanced learning with traditional approaches.", difficulty: "medium", source: "speaking-independent", answer: "I believe technology enhances but does not replace effective teaching..." },
];

// 口语综合题 9
const SPEAKING_INTEGRATED = [
  { title: "Sample I11 — Flipped Classroom Model", type: "integrated", content: "The reading passage argues that the flipped classroom model is superior to traditional teaching. The professor, however, raises several concerns. Summarize the problems the professor mentions.", hint: "Focus on the professor's arguments against the reading passage's claims.", difficulty: "hard", source: "speaking-integrated", answer: "The reading passage promotes the flipped classroom model...", reading_summary: "The reading argues that flipped classrooms improve learning by allowing students to study new material at their own pace through video lectures, while class time is used for interactive activities and problem-solving.", lecture_summary: "The professor argues that the flipped model requires students to have reliable technology and internet access at home, which creates equity issues. She notes that many students lack adequate study environments and tend to postpone video lectures until the last minute." },
  { title: "Sample I12 — Vertical Farming", type: "integrated", content: "The reading passage describes the benefits of vertical farming. The professor casts doubt on this approach. Summarize the points the professor makes.", hint: "Identify the specific challenges the professor raises about vertical farming.", difficulty: "hard", source: "speaking-integrated", answer: "The reading passage presents vertical farming as a promising solution...", reading_summary: "The reading argues that vertical farming can solve food supply problems by growing crops in stacked layers indoors, using significantly less water and land than traditional farming.", lecture_summary: "The professor argues that vertical farming is prohibitively expensive due to high energy costs for artificial lighting and climate control. She explains that it can only grow leafy greens and herbs." },
  { title: "Sample I13 — Ocean Acidification", type: "integrated", content: "The reading passage discusses the effects of ocean acidification on marine life. The professor discusses this topic from a different perspective. Summarize the points the professor makes.", hint: "Focus on how the professor's evidence relates to or challenges the reading passage.", difficulty: "hard", source: "speaking-integrated", answer: "The reading passage explains that ocean acidification, caused by increased carbon dioxide absorption...", reading_summary: "The reading explains that carbon dioxide emissions cause ocean acidification, which reduces carbonate ion availability that marine organisms need to build shells.", lecture_summary: "The professor adds that some marine species are adapting to acidification faster than predicted, and that ocean acidification affects different regions at different rates." },
  { title: "Sample I14 — Circular Economy", type: "integrated", content: "The reading passage describes the concept of a circular economy and its environmental benefits. The professor discusses this concept critically. Summarize the points the professor makes.", hint: "Note the practical challenges and the professor's skepticism about implementation.", difficulty: "hard", source: "speaking-integrated", answer: "The reading passage promotes the circular economy as an environmentally sustainable alternative...", reading_summary: "The reading describes a circular economy as an economic system where resources are kept in use through recycling, reuse, and repair.", lecture_summary: "The professor argues that the circular economy is difficult to implement because current infrastructure is designed for linear systems and some products cannot be effectively recycled." },
  { title: "Sample I15 — Space Exploration Funding", type: "integrated", content: "The reading passage argues that space exploration funding is justified by technological innovations. The professor casts doubt on this argument. Summarize the points the professor makes.", hint: "Focus on the professor's counterarguments about space exploration benefits.", difficulty: "hard", source: "speaking-integrated", answer: "The reading passage justifies government spending on space exploration by pointing to technological spin-offs...", reading_summary: "The reading argues that government spending on space exploration is justified by technological innovations in materials, communications, medicine, and computing.", lecture_summary: "The professor argues that most technological innovations come from military research, not space programs, and that space exploration could be done privately." },
  { title: "Sample I16 — Urban Agriculture", type: "integrated", content: "The reading passage discusses urban agriculture's potential to address food security. The professor presents several concerns. Summarize the points the professor raises.", hint: "Identify the specific limitations of urban agriculture discussed by the professor.", difficulty: "medium", source: "speaking-integrated", answer: "The reading passage promotes urban agriculture as a solution to food security in cities...", reading_summary: "The reading argues that urban agriculture, including rooftop gardens and community gardens, can help feed growing urban populations.", lecture_summary: "The professor argues that urban agriculture can only produce a small fraction of city food needs, and that soil contamination is a serious concern." },
  { title: "Sample I17 — Digital Currency", type: "integrated", content: "The reading passage discusses the advantages of digital currency. The professor raises concerns about this transition. Summarize the professor's points.", hint: "Focus on the specific risks and challenges the professor identifies.", difficulty: "hard", source: "speaking-integrated", answer: "The reading passage presents digital currency as a superior alternative to physical money...", reading_summary: "The reading argues that digital currency offers advantages including faster transactions, lower costs, and improved tracking.", lecture_summary: "The professor argues that digital currency threatens privacy, is vulnerable to hacking, and would exclude people without digital access." },
  { title: "Sample I18 — Early College Specialization", type: "integrated", content: "The reading passage argues that college students should choose their majors early. The professor disagrees. Summarize the points the professor makes.", hint: "Note the professor's arguments about the benefits of exploring broadly.", difficulty: "medium", source: "speaking-integrated", answer: "The reading passage argues that students should declare their majors early for focused study...", reading_summary: "The reading argues that early specialization allows students to focus studies, complete requirements on time, and gain deeper expertise.", lecture_summary: "The professor argues that students are too young to make informed decisions at 18, and that early specialization can limit future career flexibility." },
  { title: "Sample I19 — Social Media and Mental Health", type: "integrated", content: "The reading passage discusses positive effects of social media on mental health. The professor raises counterarguments. Summarize the professor's points.", hint: "Identify the negative effects of social media that the professor emphasizes.", difficulty: "hard", source: "speaking-integrated", answer: "The reading passage claims that social media improves mental health by creating supportive communities...", reading_summary: "The reading argues that social media provides communities, reduces stigma, and makes mental health resources more accessible.", lecture_summary: "The professor argues that social media exacerbates mental health problems through comparison culture, shallow interactions, and addictive design." },
];

async function main() {
  console.log('Seeding speaking questions: ' + (SPEAKING_QUESTIONS.length + SPEAKING_INTEGRATED.length) + ' total');

  let inserted = 0;
  let skipped = 0;

  // 独立题
  for (const q of SPEAKING_QUESTIONS) {
    try {
      const res = await pool.query(
        `INSERT INTO questions (title, subject, type, difficulty, source, content, answer, status)
         VALUES ($1, 'speaking', $2, $3, $4, $5, $6, 'approved')
         ON CONFLICT DO NOTHING RETURNING id`,
        [q.title, q.type, q.difficulty, q.source, q.content, q.answer]
      );
      if (res.rows.length > 0) {
        console.log('  ✓ Inserted: ' + q.title);
        inserted++;
      } else {
        console.log('  ⏭ Skipped (exists): ' + q.title);
        skipped++;
      }
    } catch (e) {
      console.error('  ✗ Error inserting ' + q.title + ': ' + e.message);
    }
  }

  // 综合题 — 使用 analysis 字段存储 reading_summary 和 lecture_summary
  for (const q of SPEAKING_INTEGRATED) {
    try {
      const analysis = `[阅读摘要] ${q.reading_summary}\n[讲座摘要] ${q.lecture_summary}`;
      const res = await pool.query(
        `INSERT INTO questions (title, subject, type, difficulty, source, content, answer, analysis, status)
         VALUES ($1, 'speaking', $2, $3, $4, $5, $6, $7, 'approved')
         ON CONFLICT DO NOTHING RETURNING id`,
        [q.title, q.type, q.difficulty, q.source, q.content, q.answer, analysis]
      );
      if (res.rows.length > 0) {
        console.log('  ✓ Inserted: ' + q.title);
        inserted++;
      } else {
        console.log('  ⏭ Skipped (exists): ' + q.title);
        skipped++;
      }
    } catch (e) {
      console.error('  ✗ Error inserting ' + q.title + ': ' + e.message);
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
