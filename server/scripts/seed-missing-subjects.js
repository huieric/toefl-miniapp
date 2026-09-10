/**
 * 托福备考助手 — 种子数据填充脚本
 * 为 listening/speaking/writing 科目补充种子数据
 * 
 * 用法: node scripts/seed-missing-subjects.js
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 5000,
});

// ============================================================
// 听力种子数据 — Conversation 类型
// ============================================================
const LISTENING_SEED = [
  {
    subject: 'listening',
    type: 'conversation',
    difficulty: 'medium',
    title: 'Sample L - Library Conversation',
    content: 'What can I help you with today?',
    options: JSON.stringify([
      { label: 'A', text: 'She wants to return a book about history.' },
      { label: 'B', text: 'She needs help finding a study room.' },
      { label: 'C', text: 'She is looking for information about library hours.' },
      { label: 'D', text: 'She wants to apply for a library card.' }
    ]),
    answer: 'A',
    analysis: '对话中图书馆馆员询问需求，学生明确说想归还一本历史书。选项A正确。',
    passage_text: '[Librarian]: What can I help you with today?\n[Student]: Hi, I\'d like to return this book about American history. I think it\'s a week overdue.\n[Librarian]: Let me check. Yes, I see it here. Don\'t worry about the late fee — our system waived it this semester.\n[Student]: Oh, that\'s great! I was worried about that. By the way, do you have any new books on 20th-century European history?\n[Librarian]: Actually, we just received a shipment of books on World War II last week. Would you like me to show you?\n[Student]: That would be wonderful, thank you!',
    audio_url: '',
    source: 'simulated',
    status: 'approved',
  },
  {
    subject: 'listening',
    type: 'conversation',
    difficulty: 'hard',
    title: 'Sample L - Professor Office Hours',
    content: 'What does the professor suggest the student do?',
    options: JSON.stringify([
      { label: 'A', text: 'Change his major to environmental science.' },
      { label: 'B', text: 'Take an additional course next semester.' },
      { label: 'C', text: 'Complete the research paper by Friday.' },
      { label: 'D', text: 'Collaborate with another student on the project.' }
    ]),
    answer: 'B',
    analysis: '教授建议学生下学期额外修一门课以补充背景知识。',
    passage_text: '[Student]: Professor Chen, I wanted to talk about my research paper topic.\n[Professor]: Of course, sit down. What topic were you considering?\n[Student]: I\'m interested in urban sustainability, but I\'m not sure if I have enough background.\n[Professor]: That\'s actually a fascinating area. However, you haven\'t taken my Urban Ecology course yet, which would be very helpful.\n[Student]: I see. That\'s next semester.\n[Professor]: Exactly. I\'d strongly recommend taking it. In the meantime, you could read some of the papers I\'ve put on reserve in the library.',
    audio_url: '',
    source: 'simulated',
    status: 'approved',
  },
  {
    subject: 'listening',
    type: 'conversation',
    difficulty: 'easy',
    title: 'Sample L - Campus Services',
    content: 'What is the main issue the student is discussing with the campus advisor?',
    options: JSON.stringify([
      { label: 'A', text: 'She wants to change her dormitory room.' },
      { label: 'B', text: 'She needs to adjust her course schedule.' },
      { label: 'C', text: 'She is planning her study abroad semester.' },
      { label: 'D', text: 'She is requesting a reduced tuition fee.' }
    ]),
    answer: 'C',
    analysis: '学生与顾问讨论出国留学学期的计划。',
    passage_text: '[Advisor]: Good morning! How can I help you today?\n[Student]: Hi, I\'m planning to study abroad next year and I wanted to make sure I\'m on track.\n[Advisor]: That\'s exciting! Which program are you considering?\n[Student]: I\'m looking at the exchange program in Australia. I need to take certain courses before I go.\n[Advisor]: Let me check your current record. You\'ve completed the English requirement and most of your general education courses. You just need one more electives course before you leave.',
    audio_url: '',
    source: 'simulated',
    status: 'approved',
  },
  {
    subject: 'listening',
    type: 'lecture',
    difficulty: 'medium',
    title: 'Sample L - Biology Lecture: Photosynthesis',
    content: 'What is the main topic of the lecture?',
    options: JSON.stringify([
      { label: 'A', text: 'The evolutionary history of plants.' },
      { label: 'B', text: 'The process of photosynthesis and its importance.' },
      { label: 'C', text: 'Different types of plant cells.' },
      { label: 'D', text: 'How plants absorb water from soil.' }
    ]),
    answer: 'B',
    analysis: '讲座主要讲解光合作用过程及其重要性。',
    passage_text: '[Professor]: Good morning, everyone. Today we\'re going to explore one of the most fundamental processes in biology — photosynthesis. Photosynthesis is the process by which plants convert light energy into chemical energy. It occurs in specialized organelles called chloroplasts, which contain a green pigment called chlorophyll.\n\nThe process can be summarized in two main stages. First, light-dependent reactions capture energy from sunlight and convert it into ATP and NADPH. Then, in the second stage known as the Calvin cycle, this energy is used to convert carbon dioxide into glucose.\n\nWhy is photosynthesis so important? Well, it is the primary source of oxygen in Earth\'s atmosphere, and it forms the foundation of almost all food chains on our planet.',
    audio_url: '',
    source: 'simulated',
    status: 'approved',
  },
  {
    subject: 'listening',
    type: 'lecture',
    difficulty: 'hard',
    title: 'Sample L - Art History: Impressionism',
    content: 'According to the professor, what distinguished Impressionist paintings from traditional art?',
    options: JSON.stringify([
      { label: 'A', text: 'The use of bright colors and visible brushstrokes to capture fleeting moments.' },
      { label: 'B', text: 'The focus on historical and mythological subjects.' },
      { label: 'C', text: 'The use of digital techniques and modern technology.' },
      { label: 'D', text: 'The preference for large-scale sculptures over paintings.' }
    ]),
    answer: 'A',
    analysis: '印象派以明亮色彩和可见笔触捕捉瞬间光影。',
    passage_text: '[Professor]: Today we\'re going to discuss Impressionism, one of the most revolutionary art movements in Western history. It emerged in France in the 1860s and was named after Claude Monet\'s painting "Impression, Sunrise."\n\nWhat made Impressionism so different? Traditional academic art valued smooth surfaces, precise detail, and historical or mythological themes. Impressionists rejected all of this. Instead, they painted outdoors, capturing fleeting impressions of light and color.\n\nThey used visible brushstrokes and bright, unmixed colors placed side by side. The viewer\'s eye would blend the colors from a distance. This technique was radical for its time, and many critics initially ridiculed these works. But today, Impressionist paintings are among the most celebrated artworks in the world.',
    audio_url: '',
    source: 'simulated',
    status: 'approved',
  },
];

// ============================================================
// 口语种子数据 — Independent Task
// ============================================================
const SPEAKING_SEED = [
  {
    subject: 'speaking',
    type: 'independent',
    difficulty: 'medium',
    title: 'Sample S1 — Preference Statement',
    content: 'Some people prefer to study alone. Others prefer to study in a group. Which do you prefer and why?',
    options: [],
    answer: '',
    analysis: '独立任务口语题，考生需表达个人观点并给出理由。',
    passage_text: 'Template response:\n\nI prefer to study alone because I can control my own pace and environment. When I study by myself, I can focus on the areas that I find most challenging without being distracted by others. For example, when preparing for my math exam, I spent extra time on calculus problems that I found difficult, and I could skip topics I already understood.\n\nAdditionally, studying alone allows me to create a personalized study schedule that fits my best learning hours. Some people are morning learners, while others, like me, are more productive in the evening.\n\nOf course, group study has its benefits, such as discussing difficult concepts with peers. But for me, the flexibility and focus that come with solo study make it the better choice.',
    audio_url: '',
    source: 'simulated',
    status: 'approved',
  },
  {
    subject: 'speaking',
    type: 'independent',
    difficulty: 'easy',
    title: 'Sample S2 — Campus Situation',
    content: 'The university plans to extend library hours until midnight. Do you think this is a good idea?',
    options: [],
    answer: '',
    analysis: '校园情境口语题，考生需就图书馆延长开放时间发表意见。',
    passage_text: 'Sample response:\n\nI think extending library hours until midnight is an excellent idea. First, many students, including myself, do our best work at night. The quiet atmosphere of the library in the evening is far superior to a noisy dormitory or coffee shop.\n\nSecond, during exam periods, students need access to resources and study spaces for extended hours. If the library closes at 10 PM, students who want to continue studying have limited options.\n\nHowever, I do think the university should ensure adequate security measures are in place. Late-night students need to feel safe walking on campus, and the library should have proper lighting and possibly security guards on duty.',
    audio_url: '',
    source: 'simulated',
    status: 'approved',
  },
  {
    subject: 'speaking',
    type: 'independent',
    difficulty: 'hard',
    title: 'Sample S3 — Academic Discussion',
    content: 'Your professor says: "Many colleges now require all students to take a foreign language. Do you agree with this requirement?"',
    options: [],
    answer: '',
    analysis: '学术讨论口语题，考生需就大学外语要求发表看法。',
    passage_text: 'Sample response:\n\nI agree with the requirement that all college students take a foreign language course, for several reasons.\n\nFirst, learning a language is not just about vocabulary and grammar. It teaches you to think differently. Each language has its own way of expressing concepts, and learning a new language broadens your perspective on the world.\n\nSecond, in our increasingly globalized world, being bilingual or multilingual is a significant advantage. Even if a student is not majoring in a language, the cognitive benefits of learning another language — improved memory, better problem-solving skills — will serve them well in any career.\n\nThird, it promotes cultural understanding. When you learn a language, you naturally learn about the culture associated with it. This can help reduce prejudice and foster global citizenship.',
    audio_url: '',
    source: 'simulated',
    status: 'approved',
  },
  {
    subject: 'speaking',
    type: 'independent',
    difficulty: 'medium',
    title: 'Sample S4 — Work Preference',
    content: 'When choosing a job, some people value a high salary more than job satisfaction. Others value job satisfaction more. Which is more important to you?',
    options: [],
    answer: '',
    analysis: '工作选择口语题，考生需权衡薪资与职业满意度。',
    passage_text: 'Sample response:\n\nI believe job satisfaction is far more important than a high salary. While money is certainly necessary to support yourself, the amount of time we spend working makes job satisfaction the priority.\n\nThink about it: we spend roughly 80,000 hours of our lives working — that is about one-third of our entire lifespan. If we are unhappy in that time, no amount of money can compensate for the daily stress and dissatisfaction.\n\nFurthermore, when you enjoy your work, you tend to be more productive, more creative, and more likely to advance in your career. In the long run, job satisfaction often leads to better financial outcomes because you become more successful at something you genuinely care about.',
    audio_url: '',
    source: 'simulated',
    status: 'approved',
  },
  {
    subject: 'speaking',
    type: 'integrated',
    difficulty: 'medium',
    title: 'Sample S5 — Integrated: Reading + Listening',
    content: 'The reading passage describes three benefits of urban green spaces. The professor discusses these benefits. Summarize the points made in the lecture.',
    options: [],
    answer: '',
    analysis: '综合口语题，需要总结听力材料中与阅读对应的三个要点。',
    passage_text: 'Reading passage summary:\n\nUrban green spaces, such as parks and community gardens, provide several benefits to city residents.\n\nFirst, they improve air quality by absorbing pollutants and producing oxygen.\n\nSecond, they reduce urban heat — cities with more trees are measurably cooler than those without greenery.\n\nThird, they provide social and psychological benefits by giving people places to relax and interact.\n\nThe professor supports all three points and adds specific evidence: a study in Los Angeles found neighborhoods with parks had 15% lower PM2.5 levels; tree canopy can reduce surface temperatures by up to 20 degrees Fahrenheit; and parks that include community gardens see 40% more neighbor interactions than those without.',
    audio_url: '',
    source: 'simulated',
    status: 'approved',
  },
];

// ============================================================
// 写作种子数据 — Independent + Integrated
// ============================================================
const WRITING_SEED = [
  {
    subject: 'writing',
    type: 'independent',
    difficulty: 'medium',
    title: 'Sample W1 — Education Policy',
    content: 'Do you agree or disagree with the following statement? Universities should require all students to take at least one course in the humanities.',
    options: [],
    answer: '',
    analysis: '独立写作题，讨论大学是否应该要求所有学生学习人文课程。',
    passage_text: 'Sample essay:\n\nI strongly agree that universities should require all students to take at least one humanities course, regardless of their major.\n\nThe primary reason is that the humanities develop essential critical thinking and communication skills that are valuable in any profession. English, history, and philosophy courses teach students how to read complex texts, construct coherent arguments, and express ideas clearly — skills that engineers, scientists, and business professionals need just as much as liberal arts majors.\n\nSecond, the humanities provide context for understanding the world. A medical student who has studied ethics is better equipped to deal with moral dilemmas in patient care. An engineer who understands history is more aware of the societal impacts of technological innovation. These perspectives are crucial for responsible professional practice.\n\nFinally, a well-educated person should be able to appreciate art, literature, and culture. Higher education is not merely vocational training; it should develop the whole person. Requiring a humanities course ensures that even STEM students gain exposure to the cultural and intellectual traditions that shape our society.',
    audio_url: '',
    source: 'simulated',
    status: 'approved',
  },
  {
    subject: 'writing',
    type: 'independent',
    difficulty: 'easy',
    title: 'Sample W2 — Technology in Education',
    content: 'Some people believe that technology has made education better. Others believe it has made education worse. Discuss both views and give your opinion.',
    options: [],
    answer: '',
    analysis: '双方观点写作题，讨论技术对教育的影响。',
    passage_text: 'Sample essay:\n\nThe impact of technology on education is a subject of ongoing debate. While some argue that technology has fundamentally improved learning, others believe it has created new problems. I believe that, on balance, technology has made education better, though it is not without drawbacks.\n\nThose who criticize technology in education point to genuine concerns. Distractions from smartphones and social media can reduce students\' focus during class. Online learning, accelerated during the pandemic, has highlighted the digital divide — students without reliable internet access fall behind. Some educators worry that over-reliance on technology reduces deep thinking and face-to-face interaction.\n\nHowever, the benefits of educational technology are substantial. Online platforms make high-quality education accessible to people in remote areas. Interactive tools, such as simulations and virtual labs, allow students to explore complex concepts in ways that textbooks cannot. Artificial intelligence can personalize learning, adapting to each student\'s pace and needs.\n\nIn my view, the benefits outweigh the drawbacks. The key is not to reject technology but to use it thoughtfully, with proper guidelines and digital literacy education.',
    audio_url: '',
    source: 'simulated',
    status: 'approved',
  },
  {
    subject: 'writing',
    type: 'integrated',
    difficulty: 'medium',
    title: 'Sample W3 — Integrated: Reading vs. Lecture',
    content: 'The reading passage presents a theory about how the Pyramids of Giza were built. The lecture casts doubt on this theory. Summarize the points made in the lecture.',
    options: [],
    answer: '',
    analysis: '综合写作题，需要总结听力对阅读理论的质疑。',
    passage_text: 'Integrated essay template:\n\nThe reading passage proposes that the Pyramids of Giza were built using a system of internal ramps — spiraling tunnels inside the pyramid structure. The reading makes three main points: (1) internal ramps would have been more efficient than external ones, (2) evidence of ramp-like structures has been found inside the pyramid, and (3) this theory explains the precision of the pyramid construction.\n\nThe lecture challenges each of these points. First, the professor argues that internal ramps would have actually hindered construction, as the narrowing interior spaces would have made it difficult to move large stone blocks. Second, the professor states that the supposed ramp structures found inside are actually natural geological formations, not human-made. Third, the professor points out that pyramid precision can be explained by well-documented external ramp techniques that Egyptologists have long accepted.\n\nIn conclusion, the lecture effectively undermines the internal ramp theory by challenging the evidence and proposing more plausible alternatives.',
    audio_url: '',
    source: 'simulated',
    status: 'approved',
  },
  {
    subject: 'writing',
    type: 'independent',
    difficulty: 'hard',
    title: 'Sample W4 — Social Media and Society',
    content: 'Do you agree or disagree? Social media has had a net negative effect on society.',
    options: [],
    answer: '',
    analysis: '独立写作题，讨论社交媒体的综合社会影响。',
    passage_text: 'Sample essay:\n\nThe impact of social media on society is complex and multifaceted. While I acknowledge that social media has introduced significant challenges, I disagree with the statement that it has had a net negative effect. The positive impacts, when properly harnessed, outweigh the negative ones.\n\nIt is true that social media has contributed to the spread of misinformation, created echo chambers, and been linked to increased rates of anxiety and depression, particularly among young people. These are serious concerns that society must address.\n\nHowever, social media has also democratized information access, empowered marginalized voices, and facilitated social movements that might otherwise have been suppressed. The Arab Spring, #MeToo, and Black Lives Matter all gained global momentum through social media platforms. These movements have led to tangible social and political change.\n\nFurthermore, social media has transformed education and professional networking. Platforms like LinkedIn have created career opportunities for millions. Educational content creators share knowledge that would otherwise cost thousands of dollars. During crises, social media enables rapid information sharing and community support.\n\nThe solution is not to reject social media but to improve digital literacy, platform design, and regulation. Used wisely, social media remains one of the most powerful tools for positive social change.',
    audio_url: '',
    source: 'simulated',
    status: 'approved',
  },
  {
    subject: 'writing',
    type: 'integrated',
    difficulty: 'hard',
    title: 'Sample W5 — Climate Change Policy',
    content: 'The reading passage discusses three proposed solutions to climate change. The lecture challenges each solution. Summarize the lecture\'s points.',
    options: [],
    answer: '',
    analysis: '综合写作题，总结听力对阅读中三种气候政策方案的质疑。',
    passage_text: 'Integrated essay template:\n\nThe reading passage outlines three solutions to climate change: (1) switching entirely to renewable energy, (2) implementing a global carbon tax, and (3) relocating coastal populations to higher ground. The lecture systematically challenges each proposal.\n\nRegarding renewable energy, the professor argues that the transition cannot happen overnight. Solar and wind energy are intermittent — they do not produce consistent power. Without adequate battery storage technology, which is still insufficient, a complete switch would cause energy crises.\n\nOn the carbon tax, the professor raises two concerns. First, it would disproportionately affect low-income households who spend a larger percentage of their income on energy. Second, without enforcement mechanisms from all countries, some nations would simply opt out and continue polluting.\n\nFinally, the professor calls the relocation proposal impractical and inhumane. Moving millions of people would require enormous resources and cause massive social disruption. Moreover, it accepts defeat rather than addressing the root causes of climate change.\n\nThe lecture suggests that none of these solutions alone is sufficient, and a combined approach with technological innovation and international cooperation is needed.',
    audio_url: '',
    source: 'simulated',
    status: 'approved',
  },
];

// ============================================================
// 写入数据库
// ============================================================
async function run() {
  try {
    // Check existing counts
    const res = await pool.query(
      `SELECT subject, COUNT(*) FROM questions GROUP BY subject ORDER BY subject`
    );
    console.log('=== 现有数据量 ===');
    res.rows.forEach(r => console.log(`  ${r.subject}: ${r.count}`));

    // Seed missing subjects
    const allSeeds = [...LISTENING_SEED, ...SPEAKING_SEED, ...WRITING_SEED];
    
    for (const seed of allSeeds) {
      const sql = `
        INSERT INTO questions (subject, type, difficulty, title, content, options, 
          answer, analysis, passage_text, audio_url, source, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (title, subject) DO UPDATE SET
          content = EXCLUDED.content,
          options = EXCLUDED.options,
          answer = EXCLUDED.answer,
          analysis = EXCLUDED.analysis,
          passage_text = EXCLUDED.passage_text,
          audio_url = EXCLUDED.audio_url,
          source = EXCLUDED.source,
          status = EXCLUDED.status,
          difficulty = EXCLUDED.difficulty,
          type = EXCLUDED.type,
          updated_at = CURRENT_TIMESTAMP
      `;
      await pool.query(sql, [
        seed.subject, seed.type, seed.difficulty, seed.title, seed.content,
        seed.options, seed.answer, seed.analysis, seed.passage_text,
        seed.audio_url, seed.source, seed.status
      ]);
      console.log(`[OK] ${seed.subject} - ${seed.title}`);
    }

    console.log(`\n=== 填充完成，共写入 ${allSeeds.length} 条数据 ===`);
    
    // Final counts
    const finalRes = await pool.query(
      `SELECT subject, COUNT(*) FROM questions GROUP BY subject ORDER BY subject`
    );
    console.log('=== 最终数据量 ===');
    finalRes.rows.forEach(r => console.log(`  ${r.subject}: ${r.count}`));
  } catch (e) {
    console.error('错误:', e.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
