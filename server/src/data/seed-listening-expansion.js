/**
 * 托福听力题库扩充 - 讲座 + 对话
 * 用法: node src/data/seed-listening-expansion.js
 */

const PASSAGES = [
  // ============================================
  // LISTENING LECTURE: Archaeology — The Indus Valley Civilization
  // ============================================
  {
    passage_id: "default-listen-011",
    title: "Lecture: Archaeological Discoveries in the Indus Valley",
    subject: "listening",
    difficulty: "medium",
    source: "default",
    passage_text: `Professor: Today we're going to examine one of the world's oldest urban civilizations — the Indus Valley Civilization, which flourished in what is now Pakistan and northwest India between 2600 and 1900 BCE. For many years, this civilization was overshadowed by its contemporaries in Mesopotamia and Egypt, but archaeological discoveries over the past century have revealed a remarkably sophisticated society.

The first major discovery came in 1921, when archaeologists unearthed the ruins of two large cities — Harappa and Mohenjo-Daro. What impressed researchers most was the cities' advanced urban planning. Unlike the irregular street layouts of Mesopotamian cities, the Indus cities featured a grid system with wide, straight streets running in north-south and east-west directions. Houses were built from standardized fired bricks, and most homes had their own wells and bathing areas.

Perhaps the most remarkable feature of Indus cities was their sophisticated drainage system. Every house was connected to a covered drainage system that ran beneath the main streets. The cities also had large public baths, the most famous being the Great Bath at Mohenjo-Daro, a massive waterproof tank measuring about twelve by seven meters. This suggests that water played an important role in the civilization's religious or cultural practices.

However, the Indus Valley Civilization also presents mysteries that archaeologists are still trying to solve. Unlike Mesopotamia and Egypt, no grand temples, palaces, or monumental tombs have been found. This has led some scholars to suggest that the Indus society may have been more egalitarian — that is, less hierarchical — than its contemporaries. Additionally, the Indus script, found on thousands of seals and artifacts, remains undeciphered. Without written records, much about their political structure, religion, and daily life remains unknown.

Around 1900 BCE, the civilization began to decline. The traditional explanation blamed invasion by Indo-European nomads, but recent evidence suggests a more complex picture. Climate change and shifting river patterns appear to have played a significant role. As the Ghaggar-Hakra river system dried up, the civilization's agricultural base weakened, leading people to migrate eastward and southeastward toward the Ganges plain and Gujarat.`,

    questions: [
      {
        content: "What is the main topic of the lecture?",
        order: 1, type: "lecture", difficulty: "easy",
        options: JSON.stringify([
          { label: "A", text: "The comparison between Mesopotamian and Egyptian civilizations" },
          { label: "B", text: "Archaeological discoveries about the Indus Valley Civilization" },
          { label: "C", text: "The process of deciphering ancient scripts" },
          { label: "D", text: "The role of rivers in ancient agricultural societies" }
        ]),
        answer: "B",
        analysis: "讲座核心：印度河流域文明的考古发现，包括城市布局、排水系统、未解之谜和衰落原因。"
      },
      {
        content: "What feature distinguished Indus Valley cities from Mesopotamian cities?",
        order: 2, type: "lecture", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "Indus cities had no walls while Mesopotamian cities were fortified" },
          { label: "B", text: "Indus cities used a grid street system while Mesopotamian cities had irregular layouts" },
          { label: "C", text: "Indus cities were smaller than Mesopotamian cities" },
          { label: "D", text: "Mesopotamian cities had drainage systems while Indus cities did not" }
        ]),
        answer: "B",
        analysis: "教授指出印度河城市采用网格状街道系统，而美索不达米亚城市街道布局不规则。"
      },
      {
        content: "According to the lecture, what does the absence of grand temples and palaces suggest about Indus society?",
        order: 3, type: "lecture", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "The civilization lacked religious beliefs" },
          { label: "B", text: "The society may have been more egalitarian and less hierarchical" },
          { label: "C", text: "The buildings were made of wood and have decayed" },
          { label: "D", text: "The civilization was focused primarily on military defense" }
        ]),
        answer: "B",
        analysis: "教授提到未发现宏伟的寺庙和宫殿，一些学者认为这可能表明印度河社会更加平等、等级制度较弱。"
      },
      {
        content: "According to recent evidence, what was a likely cause of the Indus Valley Civilization's decline?",
        order: 4, type: "lecture", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "Conquest by foreign invaders" },
          { label: "B", text: "A massive earthquake that destroyed the cities" },
          { label: "C", text: "Climate change and drying of river systems" },
          { label: "D", text: "A volcanic eruption that covered the region in ash" }
        ]),
        answer: "C",
        analysis: "教授指出气候变化和河流模式改变可能是衰落的主要原因，传统的外族入侵理论受到质疑。"
      },
      {
        content: "Why does the professor mention the Great Bath at Mohenjo-Daro?",
        order: 5, type: "lecture", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "To illustrate the importance of water in Indus religious or cultural practices" },
          { label: "B", text: "To show that the civilization had advanced swimming technology" },
          { label: "C", text: "To compare it with Egyptian pyramids in size" },
          { label: "D", text: "To explain how the civilization was destroyed by flooding" }
        ]),
        answer: "A",
        analysis: "教授提到大浴池是为了说明水在印度河文明宗教或文化实践中扮演重要角色。"
      },
      {
        content: "What remains one of the greatest mysteries about the Indus Valley Civilization?",
        order: 6, type: "lecture", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "The location of the civilization's largest city" },
          { label: "B", text: "The content and meaning of the Indus script" },
          { label: "C", text: "The method they used to construct buildings" },
          { label: "D", text: "The trade routes they used to exchange goods" }
        ]),
        answer: "B",
        analysis: "教授指出印度河文字至今尚未被破译，这使得我们对他们的政治结构、宗教和日常生活知之甚少。"
      }
    ]
  },

  // ============================================
  // LISTENING CONVERSATION: Student + Professor — Research Paper Topic
  // ============================================
  {
    passage_id: "default-listen-012",
    title: "Conversation: Choosing a Research Paper Topic",
    subject: "listening",
    difficulty: "easy",
    source: "default",
    passage_text: `Student: Professor Johnson, do you have a moment? I'm supposed to choose a topic for my environmental science research paper, and I'm having trouble narrowing it down.\n\nProfessor Johnson: Of course, come in. What are you considering?\n\nStudent: Well, I'm interested in renewable energy, specifically solar power. But I'm not sure whether to focus on the technology itself or on the policy aspects of solar energy adoption.\n\nProfessor Johnson: Those are both valid approaches. The technological angle could be interesting — you could examine how solar panel efficiency has improved over the decades. But that might be quite technical. Have you considered the policy angle?\n\nStudent: I was thinking about that. The federal government has been expanding tax credits for solar installation, and I'm curious about how effective those incentives have been.\n\nProfessor Johnson: That's a very timely topic. There's actually a lot of data available on that. One thing I'd suggest is focusing on a specific time period, say the past ten years, rather than trying to cover everything. Also, you might want to compare federal policy with state-level policies, like the rebates offered in California.\n\nStudent: That's a great idea. A comparison between federal and state approaches would give me a clear framework for analysis.\n\nProfessor Johnson: Exactly. And make sure you find some peer-reviewed studies — the government reports alone won't be enough for a research paper of this level. I can point you toward the environmental economics database in the library if you'd like.\n\nStudent: That would be really helpful, thank you. I think I have enough direction now to move forward.\n\nProfessor Johnson: Excellent. I look forward to seeing your proposal next week.`,

    questions: [
      {
        content: "Why does the student go to see the professor?",
        order: 1, type: "conversation", difficulty: "easy",
        options: JSON.stringify([
          { label: "A", text: "To complain about the research paper assignment" },
          { label: "B", text: "To get help choosing a research paper topic" },
          { label: "C", text: "To request an extension on the paper deadline" },
          { label: "D", text: "To discuss his grade in the environmental science class" }
        ]),
        answer: "B",
        analysis: "学生说需要为环境科学论文选题寻求帮助，正在纠结如何缩小范围。"
      },
      {
        content: "What are the two approaches the student initially considers for his paper?",
        order: 2, type: "conversation", difficulty: "easy",
        options: JSON.stringify([
          { label: "A", text: "Solar technology vs. wind energy" },
          { label: "B", text: "Government policy vs. private industry" },
          { label: "C", text: "The technology of solar power vs. policy aspects of adoption" },
          { label: "D", text: "Historical development vs. future predictions" }
        ]),
        answer: "C",
        analysis: "学生最初考虑的两个方向是：太阳能技术本身 vs. 太阳能采用的政策方面。"
      },
      {
        content: "What suggestion does the professor give about narrowing the topic?",
        order: 3, type: "conversation", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "Focus only on state-level policies, not federal" },
          { label: "B", text: "Choose a specific time period and compare federal with state policies" },
          { label: "C", text: "Study only the technological improvements of solar panels" },
          { label: "D", text: "Limit the paper to a single case study in California" }
        ]),
        answer: "B",
        analysis: "教授建议聚焦特定时间段（过去十年），并比较联邦与州级政策。"
      },
      {
        content: "What does the professor advise the student to include in his research?",
        order: 4, type: "conversation", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "Only government reports on solar energy" },
          { label: "B", text: "Peer-reviewed studies in addition to government reports" },
          { label: "C", text: "Interviews with solar panel manufacturers" },
          { label: "D", text: "Data from international solar energy programs" }
        ]),
        answer: "B",
        analysis: "教授强调仅靠政府报告不够，需要包含同行评审的学术研究。"
      },
      {
        content: "What does the professor offer to do at the end of the conversation?",
        order: 5, type: "conversation", difficulty: "easy",
        options: JSON.stringify([
          { label: "A", text: "Write a recommendation letter for the student" },
          { label: "B", text: "Show the student where to find relevant resources in the library" },
          { label: "C", text: "Assign the student a research assistant position" },
          { label: "D", text: "Extend the deadline for the research proposal" }
        ]),
        answer: "B",
        analysis: "教授提议带学生去图书馆的环境经济学数据库查找相关资源。"
      },
      {
        content: "What can be inferred about the student's preparation for the meeting?",
        order: 6, type: "conversation", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "He had already written a full proposal but needed approval." },
          { label: "B", text: "He had explored multiple interests but needed guidance to focus." },
          { label: "C", text: "He had no idea what topic to choose." },
          { label: "D", text: "He had completed the research but needed help with writing." }
        ]),
        answer: "B",
        analysis: "从对话可以看出学生对可再生能源感兴趣，在技术角度和政策角度之间犹豫，说明他已经探索了多个方向，需要教授帮助聚焦。"
      }
    ]
  }
];

// 直接运行
if (require.main === module) {
  const db = require('../config/db');
  (async () => {
    console.log('[Seed] 开始导入听力扩充...');
    let inserted = 0;
    let skipped = 0;

    for (const pg of PASSAGES) {
      const existing = await db.query(
        `SELECT COUNT(*) FROM questions WHERE passage_id = $1 AND source = $2`,
        [pg.passage_id, pg.source]
      );
      if (parseInt(existing.rows[0].count) > 0) {
        console.log(`[Seed] 跳过已存在: ${pg.title}`);
        skipped++;
        continue;
      }

      for (const q of pg.questions) {
        try {
          await db.query(
            `INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, passage_text, source, status, passage_id, question_order)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'approved', $11, $12)`,
            [pg.subject, q.type, q.difficulty, `${pg.title} - Q${q.order}`, q.content, q.options, q.answer, q.analysis, pg.passage_text, pg.source, pg.passage_id, q.order]
          );
          inserted++;
        } catch (err) {
          console.error(`[Seed] 失败 [${pg.title} Q${q.order}]:`, err.message);
        }
      }
    }

    const result = await db.query(`SELECT subject, COUNT(*) as total FROM questions WHERE status = 'approved' GROUP BY subject ORDER BY subject`);
    console.log(`\n=== Seed Complete ===`);
    console.log(`Inserted: ${inserted} | Skipped: ${skipped}`);
    result.rows.forEach(r => console.log(`  ${r.subject}: ${r.total}`));
    process.exit(0);
  })();
}
