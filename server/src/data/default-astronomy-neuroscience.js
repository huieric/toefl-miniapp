/**
 * 托福阅读题库 - 天文学/神经科学篇章
 * 
 * 用法: node server/src/data/seed-astronomy-neuroscience.js
 */

const PASSAGES = [
  // ============================================
  // ASTRONOMY - Black Holes and the Structure of Galaxies
  // ============================================
  {
    passage_id: "astro-astronomy-001",
    title: "Black Holes and the Structure of Galaxies",
    subject: "reading",
    difficulty: "hard",
    source: "astro-astronomy",
    passage_text: `Black holes represent some of the most extreme and fascinating objects in the universe, yet they play a crucial role in the formation and evolution of galaxies. A black hole forms when a massive star exhausts its nuclear fuel and collapses under its own gravity, creating a region of spacetime from which nothing, not even light, can escape. This boundary is known as the event horizon, and it marks the point of no return for anything that crosses it.\n\nThe study of black holes has revealed a surprising connection between these cosmic monsters and the galaxies that contain them. Modern astronomical observations indicate that nearly every large galaxy harbors a supermassive black hole at its center, with masses ranging from millions to billions of times that of the Sun. The Milky Way, for instance, contains a supermassive black hole known as Sagittarius A* with a mass of approximately four million solar masses. This correlation between black hole mass and galactic properties suggests that black holes and their host galaxies evolve together through a process known as co-evolution.\n\nThe mechanism by which black holes influence their host galaxies is an active area of research. As matter falls toward a black hole, it forms an accretion disk that spirals inward at increasingly high speeds. The friction within this disk heats the material to millions of degrees, causing it to emit intense radiation across the electromagnetic spectrum. Some of this material is also ejected from the poles of the black hole in powerful jets that can extend for thousands of light-years. These jets and the associated radiation can have profound effects on the surrounding interstellar medium, heating the gas and preventing it from cooling and forming new stars.\n\nThis feedback mechanism is critical to understanding why galaxies stop forming stars. In the early universe, galaxies were vigorously forming stars at rates much higher than is observed today. As the supermassive black holes at the centers of these galaxies accreted matter, their energetic outputs regulated star formation by expelling or heating the gas reservoir. This self-regulating process explains the observed correlation between the mass of a galaxy's central black hole and the properties of its stellar component. Without this feedback, galaxies would have consumed all their gas and stopped forming stars much earlier than they actually did.\n\nThe detection of gravitational waves in 2015 has opened an entirely new window onto the study of black holes. When two black holes merge, they generate ripples in the fabric of spacetime that can be detected by instruments such as LIGO. These observations have confirmed the existence of stellar-mass black hole binaries and have provided unprecedented measurements of black hole masses and spins. Future gravitational wave detectors will be able to observe the merger of supermassive black holes, which should be common events in the history of galaxy formation. Such observations will provide direct evidence of how black holes grew to their enormous sizes and how they shaped the galaxies we see today.`,
    questions: [
      {
        content: "What is the main purpose of the passage?",
        order: 1, type: "detail", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "To argue that black holes are the most important objects in the universe" },
          { label: "B", text: "To explain the relationship between black holes and galaxy evolution" },
          { label: "C", text: "To describe the process of gravitational wave detection" },
          { label: "D", text: "To compare stellar-mass black holes with supermassive black holes" }
        ]),
        answer: "B",
        analysis: "文章核心：解释黑洞与星系演化的相互关系，包括反馈机制和共同演化理论。"
      },
      {
        content: "According to the passage, what evidence supports the idea that black holes and galaxies co-evolve?",
        order: 2, type: "detail", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "Black holes emit gravitational waves that affect nearby stars" },
          { label: "B", text: "The mass of a galaxy's central black hole correlates with galactic properties" },
          { label: "C", text: "Most black holes are located at the centers of spiral galaxies" },
          { label: "D", text: "Stellar-mass black holes form at the same rate as stars" }
        ]),
        answer: "B",
        analysis: "第二段提到黑洞质量与星系特性之间存在相关性，表明两者共同演化。"
      },
      {
        content: "The word 'accretion' in paragraph 3 is closest in meaning to:",
        order: 3, type: "vocabulary", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "rapid expansion" },
          { label: "B", text: "gradual accumulation" },
          { label: "C", text: "violent explosion" },
          { label: "D", text: "sudden collapse" }
        ]),
        answer: "B",
        analysis: "'Accretion' 意为吸积/逐渐积累。文中描述物质向黑洞螺旋式内落的过程。"
      },
      {
        content: "According to the passage, how do black hole jets affect star formation in galaxies?",
        order: 4, type: "detail", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "They compress gas clouds, triggering new star formation" },
          { label: "B", text: "They cool the interstellar medium, allowing gas to condense" },
          { label: "C", text: "They heat the gas and prevent it from forming new stars" },
          { label: "D", text: "They convert gas directly into dark matter" }
        ]),
        answer: "C",
        analysis: "第三段末尾提到喷流加热星际介质，阻止气体冷却并形成新恒星。"
      },
      {
        content: "According to the passage, why did galaxies in the early universe form stars at much higher rates?",
        order: 5, type: "detail", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "Black holes had not yet begun their feedback regulation" },
          { label: "B", text: "There was more dark matter available for star formation" },
          { label: "C", text: "Galactic collisions were much more frequent" },
          { label: "D", text: "The universe was hotter, which aided gas collapse" }
        ]),
        answer: "A",
        analysis: "第四段说明早期星系恒星形成率高，后来随着超大质量黑洞吸积物质，反馈机制开始调节恒星形成。"
      },
      {
        content: "What does the passage suggest about the future of black hole research?",
        order: 6, type: "inference", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "Gravitational wave detectors will soon confirm that black holes do not exist" },
          { label: "B", text: "Merging supermassive black holes will provide evidence of galaxy formation history" },
          { label: "C", text: "LIGO will focus on studying stellar-mass black holes exclusively" },
          { label: "D", text: "Black hole jets are unlikely to have any effect on galactic evolution" }
        ]),
        answer: "B",
        analysis: "最后一段提到，未来引力波探测器将观测到超大质量黑洞的合并，这将为星系形成历史提供直接证据。"
      }
    ]
  },
  // ============================================
  // NEUROSCIENCE - Neuroplasticity and Brain Function
  // ============================================
  {
    passage_id: "neuro-neuroscience-001",
    title: "Neuroplasticity and the Adaptive Brain",
    subject: "reading",
    difficulty: "hard",
    source: "neuro-neuroscience",
    passage_text: `For decades, neuroscientists believed that the adult brain was largely fixed and incapable of significant change. This view, known as the doctrine of fixed brain architecture, held that once critical periods of development had passed, the connections between neurons were essentially set for life. However, research over the past thirty years has fundamentally overturned this assumption, revealing that the brain possesses a remarkable capacity for change throughout life — a property now known as neuroplasticity.\n\nNeuroplasticity encompasses several distinct mechanisms by which the brain can reorganize itself. At the cellular level, synapses — the connections between neurons — can strengthen or weaken in response to changes in their activity. This phenomenon, known as synaptic plasticity, is thought to underlie learning and memory. When two neurons are repeatedly activated together, the connection between them strengthens, a process famously summarized by the phrase \"neurons that fire together, wire together.\" This principle, known as Hebbian plasticity, is considered one of the fundamental mechanisms underlying all forms of learning.\n\nBeyond synaptic changes, the adult brain can also generate entirely new neurons through a process called neurogenesis. While it was once believed that neurogenesis ceased shortly after birth, research has demonstrated that new neurons continue to be produced in specific brain regions throughout life, most notably in the hippocampus, a structure critical for memory formation. The rate of adult neurogenesis varies considerably between species and is influenced by factors such as exercise, learning, stress, and aging. In humans, the extent to which adult neurogenesis contributes to cognitive function remains an active area of research.\n\nThe clinical implications of neuroplasticity have been profound, particularly in the field of rehabilitation medicine. Following a stroke, patients can recover lost functions through intensive therapy that essentially trains the brain to reorganize itself around damaged areas. Studies using functional magnetic resonance imaging have shown that after a stroke affecting the motor cortex, surrounding brain regions can assume control of movements previously controlled by the damaged area. This remarkable capacity for functional reorganization has led to the development of novel therapeutic approaches, including constraint-induced movement therapy, which forces patients to use affected limbs and thereby promotes the formation of new neural connections.\n\nHowever, neuroplasticity is a double-edged sword. While it enables recovery and learning, it can also underlie maladaptive changes that contribute to chronic pain, addiction, and psychiatric disorders. After a peripheral nerve injury, for example, the brain's sensory map can reorganize in ways that produce chronic pain. Similarly, the hijacking of reward circuits in addiction represents a pathological form of plasticity in which the brain adapts to the presence of drugs in ways that make quitting extremely difficult. Understanding both the beneficial and detrimental aspects of neuroplasticity is essential for developing effective treatments for a wide range of neurological and psychiatric conditions.\n\nRecent advances in brain imaging and molecular biology have provided unprecedented tools for studying neuroplasticity in humans. Techniques such as diffusion tensor imaging allow researchers to visualize the structural connections between brain regions, while optogenetics enables precise manipulation of specific neural circuits in animal models. These tools are beginning to reveal how neuroplasticity operates at multiple scales, from individual synapses to large-scale brain networks. This knowledge promises to transform our understanding of brain function and may lead to more effective treatments for conditions ranging from stroke recovery to depression and PTSD.`,
    questions: [
      {
        content: "What is the main purpose of the passage?",
        order: 1, type: "detail", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "To argue that the brain cannot change after childhood" },
          { label: "B", text: "To explain the concept of neuroplasticity and its clinical significance" },
          { label: "C", text: "To describe the process of synaptic transmission in detail" },
          { label: "D", text: "To compare neuroplasticity in humans and other species" }
        ]),
        answer: "B",
        analysis: "文章核心：解释神经可塑性的概念、机制及其在临床康复中的重要意义。"
      },
      {
        content: "According to the passage, what is Hebbian plasticity?",
        order: 2, type: "detail", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "The process by which new neurons are generated in the hippocampus" },
          { label: "B", text: "The strengthening of synaptic connections when neurons fire simultaneously" },
          { label: "C", text: "The brain's ability to reorganize after a stroke" },
          { label: "D", text: "The formation of chronic pain pathways after nerve injury" }
        ]),
        answer: "B",
        analysis: "第二段提到赫布可塑性：当两个神经元同时被激活时，它们之间的连接会增强。"
      },
      {
        content: "The word 'encompasses' in paragraph 2 is closest in meaning to:",
        order: 3, type: "vocabulary", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "opposes" },
          { label: "B", text: "includes" },
          { label: "C", text: "excludes" },
          { label: "D", text: "transforms" }
        ]),
        answer: "B",
        analysis: "'Encompasses' 意为包含/涵盖。文中指神经可塑性包含多种大脑自我重组机制。"
      },
      {
        content: "According to the passage, which of the following factors does NOT influence adult neurogenesis?",
        order: 4, type: "detail", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "Physical exercise" },
          { label: "B", text: "Learning new skills" },
          { label: "C", text: "High blood pressure" },
          { label: "D", text: "Chronic stress" }
        ]),
        answer: "C",
        analysis: "第三段提到运动、学习和压力影响成年神经发生，但未提及高血压。"
      },
      {
        content: "According to the passage, what has been a major clinical application of neuroplasticity research?",
        order: 5, type: "detail", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "Developing drugs that permanently alter synaptic connections" },
          { label: "B", text: "Creating therapies that help the brain reorganize after stroke damage" },
          { label: "C", text: "Eliminating all forms of chronic pain through brain surgery" },
          { label: "D", text: "Preventing all forms of addiction by blocking reward circuits" }
        ]),
        answer: "B",
        analysis: "第四段详述神经可塑性在卒中康复中的应用，包括限制诱导运动疗法等新治疗方法。"
      },
      {
        content: "The passage suggests that neuroplasticity can have negative consequences because:",
        order: 6, type: "inference", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "The brain can reorganize in maladaptive ways that cause chronic pain and addiction" },
          { label: "B", text: "New neurons are always functionally inferior to original neurons" },
          { label: "C", text: "Synaptic strengthening cannot be reversed under any circumstances" },
          { label: "D", text: "The brain loses all plasticity in adulthood" }
        ]),
        answer: "A",
        analysis: "第五段提到神经可塑性是一把双刃剑：有害重组可导致慢性疼痛、成瘾和精神疾病。"
      }
    ]
  }
];

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://toefl:toefl123@localhost:5433/toefl_db'
});

async function seed() {
  let inserted = 0;
  let updated = 0;
  let qInserted = 0;
  let qUpdated = 0;

  for (const passage of PASSAGES) {
    console.log(`\n📖 Processing: ${passage.title}`);

    // Check if passage already exists
    const existing = await pool.query(
      'SELECT id FROM questions WHERE passage_id = $1 AND subject = $2',
      [passage.passage_id, 'reading']
    );

    if (existing.rows.length > 0) {
      await pool.query(
        `UPDATE questions SET passage_text = $1, content = $2 WHERE passage_id = $3 AND subject = 'reading'`,
        [passage.passage_text, `【阅读文章】${passage.title}`, passage.passage_id]
      );
      updated++;
      console.log(`  ✓ Updated existing passage`);
    } else {
      await pool.query(
        `INSERT INTO questions (passage_id, title, subject, type, difficulty, source, content, options, answer, passage_text, status)
         VALUES ($1, $2, 'reading', 'passage', $3, $4, $5, '[]', '', $6, 'approved')`,
        [passage.passage_id, passage.title, passage.difficulty, passage.source, `【阅读文章】${passage.title}`, passage.passage_text]
      );
      inserted++;
      console.log(`  ✓ Inserted passage (${passage.passage_text.length} chars)`);
    }

    // Insert each question
    for (const q of passage.questions) {
      const qTitle = `Q${q.order} - ${passage.title.substring(0, 40)}`;
      const existingQ = await pool.query(
        'SELECT id FROM questions WHERE passage_id = $1 AND content = $2',
        [passage.passage_id, q.content]
      );

      if (existingQ.rows.length > 0) {
        await pool.query(
          `UPDATE questions SET type = $1, difficulty = $2, options = $3::jsonb, answer = $4, analysis = $5, "order" = $6
           WHERE id = $7`,
          [q.type, q.difficulty, q.options, q.answer, q.analysis, q.order, existingQ.rows[0].id]
        );
        qUpdated++;
        console.log(`  ✓ Updated question ${q.order}`);
      } else {
        await pool.query(
          `INSERT INTO questions 
            (passage_id, title, subject, type, difficulty, source, content, options, answer, analysis, "order", status)
           VALUES ($1, $2, 'reading', $3, $4, $5, $6, $7::jsonb, $8, $9, $10, 'approved')`,
          [
            passage.passage_id,
            qTitle,
            q.type,
            q.difficulty,
            'astro-neuro',
            q.content,
            q.options,
            q.answer,
            q.analysis,
            q.order
          ]
        );
        qInserted++;
        console.log(`  ✓ Inserted question ${q.order}: ${q.content.substring(0, 50)}...`);
      }
    }
  }

  const counts = await pool.query(`
    SELECT subject, COUNT(*) FROM questions 
    WHERE status = 'approved' GROUP BY subject ORDER BY subject
  `);
  console.log('\n=== Final Counts ===');
  counts.rows.forEach(r => console.log(`${r.subject}: ${r.count}`));

  const passages = await pool.query(`
    SELECT title, passage_id FROM questions WHERE type = 'passage' AND subject = 'reading' ORDER BY passage_id
  `);
  console.log('\n=== All Passages ===');
  passages.rows.forEach(r => console.log(`  ${r.passage_id}: ${r.title}`));

  await pool.end();
  console.log(`\nDone! Passages: ${inserted} new, ${updated} updated | Questions: ${qInserted} new, ${qUpdated} updated`);
}

seed().catch(e => { console.error(e); process.exit(1); });
