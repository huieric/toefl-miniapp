/**
 * 托福备考助手 — 第二批种子数据 (扩大 listening/speaking/writing)
 * 用法: node scripts/seed-more-data.js
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 5000,
});

const BATCH2 = [
  // ===== LISTENING =====
  {
    subject: 'listening', type: 'lecture', difficulty: 'medium',
    title: 'Sample L2 - Chemistry: Periodic Table',
    content: 'What is the main purpose of the lecture?',
    options: JSON.stringify([
      { label: 'A', text: 'To explain the structure of the atom.' },
      { label: 'B', text: 'To discuss the organization of the periodic table.' },
      { label: 'C', text: 'To describe the discovery of new elements.' },
      { label: 'D', text: 'To compare chemical properties of metals and nonmetals.' }
    ]),
    answer: 'B',
    analysis: '讲座主要讨论元素周期表的组织方式。',
    passage_text: '[Professor]: Today we are going to explore the periodic table, one of the most useful tools in chemistry. You may have seen this chart of elements many times, but have you ever wondered how it is organized?\n\nThe periodic table is organized by atomic number — that is, the number of protons in the nucleus of an atom. Elements are arranged in order from left to right, top to bottom. But the table also has a clever structure that groups elements with similar properties together.\n\nThe vertical columns are called groups, and elements in the same group share similar chemical behavior. For example, Group 1 contains the alkali metals — lithium, sodium, potassium — all of which react violently with water. The horizontal rows are called periods.\n\nOne of the most interesting features of the periodic table is the staircase line that separates metals from nonmetals. Elements to the left are metals, those to the right are nonmetals, and those along the staircase — such as silicon and germanium — are metalloids, which have properties of both.',
    source: 'simulated', status: 'approved',
  },
  {
    subject: 'listening', type: 'conversation', difficulty: 'medium',
    title: 'Sample L6 - Dining Services',
    content: 'What does the student want to do?',
    options: JSON.stringify([
      { label: 'A', text: 'Request a change in the dining hall menu.' },
      { label: 'B', text: 'Get a refund for unused meal plan days.' },
      { label: 'C', text: 'Ask about food allergy options at the dining hall.' },
      { label: 'D', text: 'Suggest adding a new dining location on campus.' }
    ]),
    answer: 'C',
    analysis: '学生询问餐厅对食物过敏的饮食选择。',
    passage_text: '[Student]: Hi, I have a question about the dining hall.\n[Dining Staff]: Sure, what can I help you with?\n[Student]: I have a severe peanut allergy. I want to know what precautions the kitchen takes.\n[Dining Staff]: That\'s a great question. Our kitchen has a dedicated allergen-free preparation area. Staff are trained in handling allergens, and all ingredients are clearly labeled.\n[Student]: That\'s really reassuring. Are there allergen-free options at every meal?\n[Dining Staff]: Yes, we have a separate section for allergen-free meals. You can find our allergen menu posted online and also at the dining hall entrance.',
    source: 'simulated', status: 'approved',
  },
  {
    subject: 'listening', type: 'lecture', difficulty: 'easy',
    title: 'Sample L7 - Psychology: Sleep',
    content: 'What does the professor mainly discuss?',
    options: JSON.stringify([
      { label: 'A', text: 'The different stages of sleep and their functions.' },
      { label: 'B', text: 'The history of sleep research.' },
      { label: 'C', text: 'How sleep affects academic performance.' },
      { label: 'D', text: 'Common sleep disorders among college students.' }
    ]),
    answer: 'A',
    analysis: '教授主要讨论睡眠的不同阶段及其功能。',
    passage_text: '[Professor]: Let\'s talk about sleep tonight — one of the most important but most neglected aspects of health. When you sleep, your brain doesn\'t just shut off. It goes through several distinct stages, each with a unique function.\n\nStage 1 is the lightest sleep, where your muscles relax and your breathing slows. Stage 2 is where you spend most of your sleep time — your heart rate drops and your body temperature decreases.\n\nThen comes Stage 3, known as deep sleep, which is crucial for physical recovery. During this stage, your body repairs tissues, builds bone and muscle, and strengthens the immune system.\n\nThe final stage is REM — Rapid Eye Movement — where most vivid dreaming occurs. REM sleep is essential for memory consolidation, which is why students who sleep well before exams tend to perform better.',
    source: 'simulated', status: 'approved',
  },
  {
    subject: 'listening', type: 'lecture', difficulty: 'hard',
    title: 'Sample L8 - Economics: Supply and Demand',
    content: 'What point does the professor make about elasticity?',
    options: JSON.stringify([
      { label: 'A', text: 'All goods have the same elasticity regardless of their nature.' },
      { label: 'B', text: 'Elasticity measures how responsive quantity is to price changes.' },
      { label: 'C', text: 'Price elasticity only applies to luxury goods.' },
      { label: 'D', text: 'Demand is always more elastic than supply.' }
    ]),
    answer: 'B',
    analysis: '教授指出弹性衡量数量对价格变化的敏感程度。',
    passage_text: '[Professor]: Today we\'re going to discuss price elasticity of demand, one of the most important concepts in economics. Elasticity measures how responsive consumers are to a change in price.\n\nIf demand is elastic, a small price increase leads to a large drop in quantity demanded. Think of restaurant meals — if a restaurant raises prices by 20%, many people will simply eat elsewhere. But if demand is inelastic, price changes don\'t affect quantity much. A classic example is medicine — if your life depends on a medication, you\'ll pay almost any price.\n\nSeveral factors determine elasticity: the availability of substitutes, whether the good is a necessity or luxury, the proportion of income spent on the good, and the time horizon. Goods with many substitutes tend to be more elastic.',
    source: 'simulated', status: 'approved',
  },
  {
    subject: 'listening', type: 'conversation', difficulty: 'hard',
    title: 'Sample L9 - Research Collaboration',
    content: 'Why does the student visit the professor?',
    options: JSON.stringify([
      { label: 'A', text: 'To request an extension on an upcoming assignment.' },
      { label: 'B', text: 'To propose a research topic for the semester project.' },
      { label: 'C', text: 'To ask for a recommendation letter for graduate school.' },
      { label: 'D', text: 'To discuss grades from the previous semester.' }
    ]),
    answer: 'B',
    analysis: '学生拜访教授是为了提出学期项目的研究选题。',
    passage_text: '[Student]: Dr. Williams, do you have a moment?\n[Professor]: Of course, please come in. What\'s on your mind?\n[Student]: I\'ve been thinking about my semester project, and I have an idea I wanted to discuss with you.\n[Professor]: That\'s great. What topic did you have in mind?\n[Student]: I\'m interested in studying the impact of urban green spaces on community health. I think it combines environmental science with public health, which I find really fascinating.\n[Professor]: That\'s an excellent topic — timely and relevant. I think it would work well as a collaborative project. I\'ll put together some reading materials for you.',
    source: 'simulated', status: 'approved',
  },
  {
    subject: 'listening', type: 'lecture', difficulty: 'medium',
    title: 'Sample L10 - Music History: Jazz',
    content: 'What is the main topic of the professor\'s lecture?',
    options: JSON.stringify([
      { label: 'A', text: 'The origins and evolution of jazz music.' },
      { label: 'B', text: 'The technical aspects of playing the trumpet.' },
      { label: 'C', text: 'Famous jazz musicians of the 21st century.' },
      { label: 'D', text: 'The difference between jazz and blues music.' }
    ]),
    answer: 'A',
    analysis: '讲座主题是爵士乐的起源与发展。',
    passage_text: '[Professor]: Today we\'re going to explore jazz, arguably the most original American art form. Jazz emerged in the late 19th and early 20th centuries in New Orleans, a city with a unique cultural mix of African, Caribbean, and European influences.\n\nJazz has its roots in African rhythmic traditions, blues, and spirituals. What made jazz unique was improvisation — the ability of musicians to create music spontaneously. Unlike classical music, which follows a fixed score, jazz musicians compose in the moment, reacting to each other in real time.\n\nThe evolution of jazz can be divided into several key periods: Early jazz and swing in the 1920s-30s, bebop in the 1940s which emphasized complex harmonies and fast tempos, cool jazz in the 1950s, and then fusion in the 1960s-70s which incorporated rock and R&B elements.\n\nEach era reflected the social and cultural changes of its time, making jazz not just music but a living history of America.',
    source: 'simulated', status: 'approved',
  },
  // ===== SPEAKING =====
  {
    subject: 'speaking', type: 'integrated', difficulty: 'hard',
    title: 'Sample S6 — Integrated: Academic Reading + Listening',
    content: 'The reading discusses three advantages of space exploration. The lecture challenges these points. Summarize.',
    options: [],
    answer: '',
    analysis: '综合口语，总结听力对阅读中太空探索三个优势的质疑。',
    passage_text: 'Reading: The reading argues that space exploration provides: (1) technological innovations that benefit life on Earth, (2) economic returns through satellite communications and Earth observation, and (3) inspiration for future generations.\n\nLecture: The professor disagrees with all three points. She argues that most technological spin-offs from space programs are minimal and could be achieved through other research. Satellite technology benefits are concentrated in wealthy nations and corporations, not the general public. And while space exploration may inspire some students, it does not address the fundamental educational challenges facing the country.',
    source: 'simulated', status: 'approved',
  },
  {
    subject: 'speaking', type: 'independent', difficulty: 'medium',
    title: 'Sample S7 — Travel Preference',
    content: 'When you travel to a new place, do you prefer to plan every detail in advance or explore without a fixed schedule?',
    options: [],
    answer: '',
    analysis: '旅行偏好口语题。',
    passage_text: 'Sample response:\n\nI prefer to plan every detail in advance because it reduces stress and maximizes my experience. When I have a clear plan, I know where I\'m going, what I\'m doing, and how much I\'ll spend. This allows me to focus on enjoying the trip rather than worrying about logistics.\n\nFor example, when I visited Japan last year, I booked my hotels, trains, and restaurant reservations weeks in advance. This meant I never had to worry about availability and could spend my time exploring temples, tasting local cuisine, and discovering hidden gems.\n\nThat said, I do leave room for spontaneity. I\'ll always reserve one or two days without a plan, which often leads to the most memorable experiences. But overall, advance planning gives me the confidence and flexibility to truly enjoy my travels.',
    source: 'simulated', status: 'approved',
  },
  // ===== WRITING =====
  {
    subject: 'writing', type: 'independent', difficulty: 'medium',
    title: 'Sample W6 — Working Abroad',
    content: 'Some people prefer to work in their home country. Others prefer to work abroad. Which do you prefer?',
    options: [],
    answer: '',
    analysis: '工作选择写作题：留在本国 vs 出国工作。',
    passage_text: 'Sample essay:\n\nI believe working abroad offers greater personal and professional growth than working in one\'s home country. While staying home has obvious advantages — familiarity, family proximity, lower cost of living — the benefits of international work experience are far more valuable.\n\nFirst, living and working in a different country develops adaptability and independence. You are forced to navigate unfamiliar systems, languages, and social norms. These experiences build resilience and problem-solving skills that employers highly value.\n\nSecond, working abroad expands your professional network globally. You build relationships with colleagues from diverse backgrounds, which opens doors to international opportunities that would not be available if you stayed home.\n\nThird, experiencing a different culture broadens your worldview. You gain perspectives that shape not only how you work but how you think. This cultural intelligence is increasingly important in our interconnected world.\n\nOf course, working abroad is not without challenges — homesickness, cultural differences, and career uncertainty can be daunting. But the investment in international experience pays dividends throughout your career and personal life.',
    source: 'simulated', status: 'approved',
  },
  {
    subject: 'writing', type: 'integrated', difficulty: 'easy',
    title: 'Sample W6 — Integrated: Reading vs. Lecture (Renewable Energy)',
    content: 'The reading passage presents three arguments for building nuclear power plants. The lecture challenges these arguments.',
    options: [],
    answer: '',
    analysis: '综合写作：听力质疑阅读的核电论点。',
    passage_text: 'Integrated essay template:\n\nThe reading argues in favor of building nuclear power plants, making three points: (1) nuclear energy produces no carbon emissions, (2) it is cost-effective in the long run, and (3) modern plants are safe.\n\nThe lecture challenges each point. First, the professor acknowledges that nuclear plants do not emit carbon during operation, but points out that the entire nuclear fuel cycle — mining, enrichment, transportation, and waste disposal — does produce significant greenhouse gases.\n\nSecond, regarding cost-effectiveness, the professor notes that nuclear plants have huge upfront construction costs, often running billions over budget. These costs are ultimately borne by taxpayers, making nuclear far from cost-effective.\n\nFinally, on safety, the professor cites historical accidents at Three Mile Island, Chernobyl, and Fukushima, arguing that even a small probability of catastrophic failure makes nuclear power too risky.',
    source: 'simulated', status: 'approved',
  },
];

async function run() {
  try {
    const res = await pool.query(
      `SELECT subject, COUNT(*) FROM questions GROUP BY subject ORDER BY subject`
    );
    console.log('=== 现有数据量 ===');
    res.rows.forEach(r => console.log(`  ${r.subject}: ${r.count}`));

    for (const seed of BATCH2) {
      const sql = `
        INSERT INTO questions (subject, type, difficulty, title, content, options, 
          answer, analysis, passage_text, source, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (title, subject) DO UPDATE SET
          content = EXCLUDED.content,
          options = EXCLUDED.options,
          answer = EXCLUDED.answer,
          analysis = EXCLUDED.analysis,
          passage_text = EXCLUDED.passage_text,
          source = EXCLUDED.source,
          status = EXCLUDED.status,
          difficulty = EXCLUDED.difficulty,
          type = EXCLUDED.type
      `;
      await pool.query(sql, [
        seed.subject, seed.type, seed.difficulty, seed.title, seed.content,
        seed.options, seed.answer, seed.analysis, seed.passage_text,
        seed.source, seed.status
      ]);
      console.log(`[OK] ${seed.subject} - ${seed.title}`);
    }

    console.log(`\n=== 填充完成 ===`);
    const final = await pool.query(
      `SELECT subject, COUNT(*) FROM questions GROUP BY subject ORDER BY subject`
    );
    console.log('=== 最终数据量 ===');
    final.rows.forEach(r => console.log(`  ${r.subject}: ${r.count}`));
  } catch (e) {
    console.error('错误:', e.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
