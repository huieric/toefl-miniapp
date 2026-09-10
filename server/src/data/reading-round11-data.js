/**
 * 托福备考助手 — Round 11 阅读扩充种子数据
 * 新增 3 篇阅读长篇章：心理学/天文学/生态学
 * 每篇 1 passage + 6 题 = 7 条记录 × 3篇 = 21 条记录
 * 用法: node scripts/seed-reading-round11.js
 */

const READING_DATA = [
  // ===== PASSAGE 1: Psychology - Cognitive Dissonance (6题) =====
  {
    subject: 'reading', type: 'passage', difficulty: 'hard',
    title: 'Cognitive Dissonance and the Psychology of Belief',
    content: '',
    options: '[]',
    answer: '-',
    analysis: 'Cognitive dissonance theory, developed by Leon Festinger in 1957, explains how people deal with conflicting beliefs and behaviors. When people hold two contradictory ideas or when their behavior conflicts with their beliefs, they experience psychological discomfort. To reduce this discomfort, people either change their beliefs, change their behavior, or rationalize the conflict. The theory has been applied to understanding political polarization, health decisions, and consumer behavior.',
    passage_text: '',
    source: 'simulated', status: 'approved',
    passage_id: 'psy-cognitive-001',
    question_order: 0,
  },
  {
    subject: 'reading', type: 'detail', difficulty: 'easy',
    title: 'Psychology: Cognitive Dissonance - Q1',
    content: 'According to the passage, what is cognitive dissonance?',
    options: JSON.stringify([
      { label: 'A', text: 'The process of changing one\'s behavior to match new information.' },
      { label: 'B', text: 'The psychological discomfort caused by holding conflicting beliefs or acting contrary to one\'s beliefs.' },
      { label: 'C', text: 'The ability to remember information that supports one\'s existing views.' },
      { label: 'D', text: 'A mental technique used to improve decision-making.' }
    ]),
    answer: 'B',
    analysis: '认知失调理论指人们持有相互矛盾的信念或行为与信念不一致时产生的心理不适。',
    source: 'simulated', status: 'approved',
    passage_id: 'psy-cognitive-001',
  },
  {
    subject: 'listening', type: 'detail', difficulty: 'easy',
    title: 'Psychology: Cognitive Dissonance - Q2',
    content: 'What are the three ways people try to reduce cognitive dissonance?',
    options: JSON.stringify([
      { label: 'A', text: 'Ignore the conflict, talk to others, or write about it.' },
      { label: 'B', text: 'Change beliefs, change behavior, or rationalize the conflict.' },
      { label: 'C', text: 'Seek more information, wait for resolution, or accept discomfort.' },
      { label: 'D', text: 'Blame others, make excuses, or withdraw from the situation.' }
    ]),
    answer: 'B',
    analysis: '人们减少认知失调的三种方式：改变信念、改变行为、或合理化冲突。',
    source: 'simulated', status: 'approved',
    passage_id: 'psy-cognitive-001',
  },
  {
    subject: 'reading', type: 'inference', difficulty: 'medium',
    title: 'Psychology: Cognitive Dissonance - Q3',
    content: 'It can be inferred from the passage that cognitive dissonance is most likely to occur when:',
    options: JSON.stringify([
      { label: 'A', text: 'A person receives new information that contradicts a well-held belief.' },
      { label: 'B', text: 'A person makes a simple everyday choice.' },
      { label: 'C', text: 'A person follows instructions from an authority figure.' },
      { label: 'D', text: 'A person spends time alone without any social interaction.' }
    ]),
    answer: 'A',
    analysis: '从文章内容可以推断，认知失调最可能发生在人们收到与自己固有信念相矛盾的新信息时。',
    source: 'simulated', status: 'approved',
    passage_id: 'psy-cognitive-001',
  },
  {
    subject: 'reading', type: 'purpose', difficulty: 'medium',
    title: 'Psychology: Cognitive Dissonance - Q4',
    content: 'Why does the passage mention political polarization?',
    options: JSON.stringify([
      { label: 'A', text: 'To illustrate one application of cognitive dissonance theory.' },
      { label: 'B', text: 'To argue that political views should never change.' },
      { label: 'C', text: 'To compare different political systems.' },
      { label: 'D', text: 'To explain how elections work.' }
    ]),
    answer: 'A',
    analysis: '作者提到政治极化是为了说明认知失调理论在实际生活中的一个应用——人们倾向于寻找支持自己政治观点的信息，拒绝相反证据。',
    source: 'simulated', status: 'approved',
    passage_id: 'psy-cognitive-001',
  },
  {
    subject: 'reading', type: 'vocabulary', difficulty: 'medium',
    title: 'Psychology: Cognitive Dissonance - Q5',
    content: 'The word "rationalize" in the passage is closest in meaning to:',
    options: JSON.stringify([
      { label: 'A', text: 'To explain something using logical reasons, often to make it seem acceptable.' },
      { label: 'B', text: 'To make something more rational and reasonable.' },
      { label: 'C', text: 'To argue against an idea forcefully.' },
      { label: 'D', text: 'To ignore an unpleasant truth.' }
    ]),
    answer: 'A',
    analysis: '"rationalize"在此处意为"合理化"，即用看似合理的理由来解释，使其看起来可以接受。',
    source: 'simulated', status: 'approved',
    passage_id: 'psy-cognitive-001',
  },
  {
    subject: 'reading', type: 'negative', difficulty: 'hard',
    title: 'Psychology: Cognitive Dissonance - Q6',
    content: 'According to the passage, all of the following are applications of cognitive dissonance theory EXCEPT:',
    options: JSON.stringify([
      { label: 'A', text: 'Political polarization.' },
      { label: 'B', text: 'Health decisions.' },
      { label: 'C', text: 'Consumer behavior.' },
      { label: 'D', text: 'Mathematical problem-solving.' }
    ]),
    answer: 'D',
    analysis: '文章提到的应用领域包括政治极化、健康决策和消费者行为。数学解题不是认知失调理论的应用领域。',
    source: 'simulated', status: 'approved',
    passage_id: 'psy-cognitive-001',
  },

  // ===== PASSAGE 2: Astronomy - Black Holes (6题) =====
  {
    subject: 'reading', type: 'passage', difficulty: 'hard',
    title: 'Understanding Black Holes and Their Detection',
    content: '',
    options: '[]',
    answer: '-',
    analysis: 'Black holes are regions of spacetime where gravity is so strong that nothing, not even light, can escape. They form when massive stars collapse at the end of their life cycle. Astronomers detect black holes indirectly through their effects on nearby matter, including gravitational waves from merging black holes and the radiation emitted by accretion disks. The first image of a black hole\'s event horizon was captured in 2019 by the Event Horizon Telescope collaboration.',
    passage_text: '',
    source: 'simulated', status: 'approved',
    passage_id: 'astro-blackhole-001',
    question_order: 0,
  },
  {
    subject: 'reading', type: 'detail', difficulty: 'easy',
    title: 'Astronomy: Black Holes - Q1',
    content: 'What defines a black hole?',
    options: JSON.stringify([
      { label: 'A', text: 'A region of spacetime with extremely strong gravity that traps everything, including light.' },
      { label: 'B', text: 'A star that has burned all its fuel and appears dark.' },
      { label: 'C', text: 'A massive planet made primarily of dense iron.' },
      { label: 'D', text: 'A cloud of gas that absorbs all visible light.' }
    ]),
    answer: 'A',
    analysis: '黑洞是时空中的一个区域，其引力极其强大，连光都无法逃脱。',
    source: 'simulated', status: 'approved',
    passage_id: 'astro-blackhole-001',
  },
  {
    subject: 'reading', type: 'detail', difficulty: 'easy',
    title: 'Astronomy: Black Holes - Q2',
    content: 'How do black holes typically form?',
    options: JSON.stringify([
      { label: 'A', text: 'Through the collision of two neutron stars.' },
      { label: 'B', text: 'When massive stars collapse at the end of their life cycle.' },
      { label: 'C', text: 'During the Big Bang explosion.' },
      { label: 'D', text: 'When planets gather enough mass through accretion.' }
    ]),
    answer: 'B',
    analysis: '黑洞通常在 massive stars 在其生命周期结束时坍缩形成。',
    source: 'simulated', status: 'approved',
    passage_id: 'astro-blackhole-001',
  },
  {
    subject: 'reading', type: 'inference', difficulty: 'medium',
    title: 'Astronomy: Black Holes - Q3',
    content: 'Why can astronomers not see black holes directly?',
    options: JSON.stringify([
      { label: 'A', text: 'Black holes are too small to be detected by telescopes.' },
      { label: 'B', text: 'Black holes emit no visible light.' },
      { label: 'C', text: 'Black holes are located too far from Earth.' },
      { label: 'D', text: 'Black holes only exist in theoretical models.' }
    ]),
    answer: 'B',
    analysis: '黑洞不发出可见光，因为其引力强大到连光都无法逃脱，因此无法直接看到。',
    source: 'simulated', status: 'approved',
    passage_id: 'astro-blackhole-001',
  },
  {
    subject: 'reading', type: 'purpose', difficulty: 'medium',
    title: 'Astronomy: Black Holes - Q4',
    content: 'Why does the passage mention the Event Horizon Telescope?',
    options: JSON.stringify([
      { label: 'A', text: 'To describe how black holes are detected indirectly.' },
      { label: 'B', text: 'To explain the theory of relativity.' },
      { label: 'C', text: 'To describe one method of detecting stars.' },
      { label: 'D', text: 'To discuss the formation of neutron stars.' }
    ]),
    answer: 'A',
    analysis: '提到事件视界望远镜是为了说明科学家如何间接检测黑洞——通过拍摄黑洞事件视界的影像。',
    source: 'simulated', status: 'approved',
    passage_id: 'astro-blackhole-001',
  },
  {
    subject: 'reading', type: 'negative', difficulty: 'hard',
    title: 'Astronomy: Black Holes - Q5',
    content: 'According to the passage, which of the following are mentioned as ways astronomers detect black holes?',
    options: JSON.stringify([
      { label: 'A', text: 'Observing gravitational waves from merging black holes.' },
      { label: 'B', text: 'Detecting radiation from accretion disks.' },
      { label: 'C', text: 'Capturing images of event horizons.' },
      { label: 'D', text: 'Measuring the temperature of the black hole itself.' }
    ]),
    answer: 'D',
    analysis: '文章提到的黑洞检测方法包括：观测合并黑洞产生的引力波、检测吸积盘辐射、以及拍摄事件视界影像。测量黑洞本身的温度并未提及，因为黑洞本身不发出辐射。',
    source: 'simulated', status: 'approved',
    passage_id: 'astro-blackhole-001',
  },
  {
    subject: 'reading', type: 'vocabulary', difficulty: 'medium',
    title: 'Astronomy: Black Holes - Q6',
    content: 'The word "accretion" in the context of the passage refers to:',
    options: JSON.stringify([
      { label: 'A', text: 'The process by which matter accumulates around a massive object.' },
      { label: 'B', text: 'The rapid expansion of space.' },
      { label: 'C', text: 'The collapse of a star\'s core.' },
      { label: 'D', text: 'The formation of new elements through fusion.' }
    ]),
    answer: 'A',
    analysis: '"accretion disk"（吸积盘）是指物质向大质量天体聚集时形成的盘状结构。',
    source: 'simulated', status: 'approved',
    passage_id: 'astro-blackhole-001',
  },

  // ===== PASSAGE 3: Ecology - Ecosystem Services (6题) =====
  {
    subject: 'reading', type: 'passage', difficulty: 'hard',
    title: 'Ecosystem Services and the Value of Biodiversity',
    content: '',
    options: '[]',
    answer: '-',
    analysis: 'Ecosystem services are the benefits that humans receive from natural ecosystems. These services are categorized into four types: provisioning services (food, water, timber), regulating services (climate regulation, flood control), cultural services (recreation, spiritual benefits), and supporting services (nutrient cycling, soil formation). The economic value of these services is enormous — the Millennium Ecosystem Assessment estimated them at trillions of dollars annually. Understanding and protecting these services is crucial for sustainable development.',
    passage_text: '',
    source: 'simulated', status: 'approved',
    passage_id: 'eco-ecosystem-001',
    question_order: 0,
  },
  {
    subject: 'reading', type: 'detail', difficulty: 'easy',
    title: 'Ecology: Ecosystem Services - Q1',
    content: 'What are ecosystem services?',
    options: JSON.stringify([
      { label: 'A', text: 'Government programs designed to protect the environment.' },
      { label: 'B', text: 'The benefits that humans receive from natural ecosystems.' },
      { label: 'C', text: 'Economic markets for trading environmental credits.' },
      { label: 'D', text: 'Technologies used to restore damaged ecosystems.' }
    ]),
    answer: 'B',
    analysis: '生态系统服务是指人类从自然生态系统中获得的益处。',
    source: 'simulated', status: 'approved',
    passage_id: 'eco-ecosystem-001',
  },
  {
    subject: 'reading', type: 'detail', difficulty: 'medium',
    title: 'Ecology: Ecosystem Services - Q2',
    content: 'Which of the following is an example of a regulating service?',
    options: JSON.stringify([
      { label: 'A', text: 'Harvesting timber from a forest.' },
      { label: 'B', text: 'Flood control provided by wetlands.' },
      { label: 'C', text: 'Ecotourism in national parks.' },
      { label: 'D', text: 'Soil formation by decomposers.' }
    ]),
    answer: 'B',
    analysis: '调节服务包括气候调节和洪水控制。湿地提供的洪水控制是调节服务的典型例子。',
    source: 'simulated', status: 'approved',
    passage_id: 'eco-ecosystem-001',
  },
  {
    subject: 'reading', type: 'inference', difficulty: 'medium',
    title: 'Ecology: Ecosystem Services - Q3',
    content: 'It can be inferred from the passage that ecosystem services:',
    options: JSON.stringify([
      { label: 'A', text: 'Are only valuable in developing countries.' },
      { label: 'B', text: 'Have significant economic value that often goes unrecognized.' },
      { label: 'C', text: 'Can be easily replaced by human-made alternatives.' },
      { label: 'D', text: 'Are decreasing in importance due to technological advances.' }
    ]),
    answer: 'B',
    analysis: '从文章可以看出生态系统服务具有巨大的经济价值——每年数万亿美元——但这种价值往往被忽视。',
    source: 'simulated', status: 'approved',
    passage_id: 'eco-ecosystem-001',
  },
  {
    subject: 'reading', type: 'purpose', difficulty: 'medium',
    title: 'Ecology: Ecosystem Services - Q4',
    content: 'Why does the passage mention the Millennium Ecosystem Assessment?',
    options: JSON.stringify([
      { label: 'A', text: 'To provide a quantitative estimate of ecosystem services\' economic value.' },
      { label: 'B', text: 'To describe the history of environmental organizations.' },
      { label: 'C', text: 'To compare different ecosystem types.' },
      { label: 'D', text: 'To explain why biodiversity is decreasing.' }
    ]),
    answer: 'A',
    analysis: '提到千年生态系统评估是为了提供生态系统服务经济价值的量化估算——每年数万亿美元。',
    source: 'simulated', status: 'approved',
    passage_id: 'eco-ecosystem-001',
  },
  {
    subject: 'reading', type: 'vocabulary', difficulty: 'medium',
    title: 'Ecology: Ecosystem Services - Q5',
    content: 'The word "sustainable" in the passage is closest in meaning to:',
    options: JSON.stringify([
      { label: 'A', text: 'Capable of being maintained at a steady level without depleting resources.' },
      { label: 'B', text: 'Achieving rapid growth in economic output.' },
      { label: 'C', text: 'Using natural resources as quickly as possible.' },
      { label: 'D', text: 'Focusing exclusively on environmental protection.' }
    ]),
    answer: 'A',
    analysis: '"sustainable"在此处意为"可持续的"——能够在不耗尽资源的情况下以稳定水平维持。',
    source: 'simulated', status: 'approved',
    passage_id: 'eco-ecosystem-001',
  },
  {
    subject: 'reading', type: 'negative', difficulty: 'hard',
    title: 'Ecology: Ecosystem Services - Q6',
    content: 'According to the passage, which of the following is NOT one of the four categories of ecosystem services?',
    options: JSON.stringify([
      { label: 'A', text: 'Provisioning services.' },
      { label: 'B', text: 'Manufacturing services.' },
      { label: 'C', text: 'Regulating services.' },
      { label: 'D', text: 'Supporting services.' }
    ]),
    answer: 'B',
    analysis: '生态系统服务的四个类别：供给服务、调节服务、文化服务和支持服务。制造服务不是其中之一。',
    source: 'simulated', status: 'approved',
    passage_id: 'eco-ecosystem-001',
  },
];

module.exports = READING_DATA;
