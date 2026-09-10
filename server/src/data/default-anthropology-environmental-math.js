/**
 * 托福阅读题库 - 人类学/环境科学/数学史篇章
 */

const PASSAGES = [
  // ============================================
  // ANTHROPOLOGY - The Development of Early Agriculture
  // ============================================
  {
    passage_id: "anthro-anthropology-001",
    title: "The Development of Early Agriculture and Its Social Consequences",
    subject: "reading",
    difficulty: "hard",
    source: "anthro-anthropology",
    passage_text: `The transition from hunting and gathering to agriculture, often called the Neolithic Revolution, represents one of the most significant transformations in human history. For tens of thousands of years, human societies had existed as nomadic hunter-gatherers, moving across landscapes in search of wild plants and animals to consume. Around 10,000 years ago, however, independent agricultural traditions began to emerge in several regions of the world, including the Fertile Crescent of the Middle East, the Yangtze and Yellow River valleys in China, Mesoamerica, and the Andes mountains of South America.\n\nThe origins of agriculture remain a subject of intense scholarly debate. The traditional view held that agriculture emerged when groups of people deliberately began cultivating wild plants and domesticating animals, transitioning from foraging to food production. Recent evidence, however, suggests a more complex picture. Archaeological findings indicate that many hunter-gatherer societies had already begun to manipulate their environment in ways that facilitated plant growth, through practices such as controlled burning, selective harvesting, and even transplanting of useful species. This process, sometimes termed "proto-agriculture," may have gradually intensified over thousands of years before culminating in full-scale farming.\n\nOne factor that likely contributed to the emergence of agriculture was climate change at the end of the last Ice Age. As global temperatures rose and glaciers retreated, many regions experienced more stable and predictable weather patterns. In certain areas, such as the Fertile Crescent, this climate shift coincided with the natural proliferation of wild cereal grains like wheat and barley, providing a reliable food source that could potentially be cultivated. Similarly, in East Asia, the warming climate created favorable conditions for wild rice populations to expand.\n\nHowever, climate change alone cannot explain why agriculture took hold in some regions but not in others. Social and demographic factors also played a crucial role. Some researchers propose that population pressure was a key driver: as hunter-gatherer groups grew larger in areas with abundant natural resources, the pressure on those resources increased, making the labor-intensive work of farming a necessary alternative to foraging. This "push" hypothesis contrasts with the "pull" hypothesis, which suggests that agriculture was adopted because it offered tangible benefits, such as greater food security and the ability to store surplus grain for lean times.\n\nThe adoption of agriculture had profound and lasting consequences for human societies. Perhaps most significantly, it enabled populations to grow exponentially, as settled farming could support far more people per unit of land than hunting and gathering. This demographic expansion led to the emergence of larger, more complex social organizations, including permanent settlements, social stratification, specialized labor divisions, and eventually, the first cities and civilizations. Agriculture also altered the relationship between humans and their environment, as people began to actively modify landscapes through irrigation, deforestation, and selective breeding of plants and animals.`,
    questions: [
      {
        content: "What is the main purpose of the passage?",
        order: 1, type: "detail", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "To argue that climate change was the sole cause of the Neolithic Revolution" },
          { label: "B", text: "To examine the origins and consequences of early agriculture" },
          { label: "C", text: "To compare agricultural practices in different regions of the world" },
          { label: "D", text: "To describe the daily life of hunter-gatherer societies" }
        ]),
        answer: "B",
        analysis: "文章核心：探讨农业的起源（多种因素）及其对人类社会带来的深远影响（人口增长、社会复杂化、环境改变）。"
      },
      {
        content: "According to the passage, what does recent archaeological evidence suggest about the origins of agriculture?",
        order: 2, type: "detail", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "Agriculture was deliberately invented by a small group of innovative people" },
          { label: "B", text: "Hunter-gatherer societies completely avoided modifying their environment" },
          { label: "C", text: "The transition was a gradual process that began with proto-agricultural practices" },
          { label: "D", text: "Agriculture spread rapidly from a single point of origin" }
        ]),
        answer: "C",
        analysis: "第二段指出考古发现表明狩猎采集者已经通过焚烧、选择性收获等方式 manipulate 环境，这是一个渐进的 proto-agriculture 过程。"
      },
      {
        content: "The word 'intensified' in paragraph 2 is closest in meaning to:",
        order: 3, type: "vocabulary", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "simplified" },
          { label: "B", text: "become stronger or more extreme" },
          { label: "C", text: "gradually disappeared" },
          { label: "D", text: "become more widespread geographically" }
        ]),
        answer: "B",
        analysis: "'Intensified' 意为加强/加剧。文中指 proto-agriculture 实践逐渐加强最终导致全面农耕。"
      },
      {
        content: "According to the passage, why might population pressure have contributed to the adoption of agriculture?",
        order: 4, type: "inference", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "Because larger populations required more efficient food production methods" },
          { label: "B", text: "Because hunter-gatherer societies opposed any changes to traditional practices" },
          { label: "C", text: "Because climate change made hunting impossible" },
          { label: "D", text: "Because agriculture required fewer people to produce the same amount of food" }
        ]),
        answer: "A",
        analysis: "第四段提到 population pressure 假说：随着狩猎采集群体变大，对资源的压力增加，使得劳动密集的农耕成为必要替代。"
      },
      {
        content: "Which of the following can be inferred about the relationship between agriculture and social complexity?",
        order: 5, type: "inference", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "Social complexity existed before agriculture and caused farming to develop" },
          { label: "B", text: "Agriculture made it possible to support larger populations, which in turn enabled social stratification" },
          { label: "C", text: "Hunter-gatherer societies were more socially complex than farming societies" },
          { label: "D", text: "Social stratification had no impact on the development of agriculture" }
        ]),
        answer: "B",
        analysis: "第五段指出农业使人口能够指数增长，这种人口扩张导致了更复杂的社会组织，包括永久定居、社会分层、劳动分工等。"
      },
      {
        content: "Which of the following best describes the organization of the passage?",
        order: 6, type: "prose_summary", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "The passage presents a single theory about agricultural origins and supports it with evidence." },
          { label: "B", text: "The passage introduces agricultural origins, discusses multiple contributing factors, and describes its consequences." },
          { label: "C", text: "The passage compares hunter-gatherer life with farming life and concludes that farming was superior." },
          { label: "D", text: "The passage focuses primarily on the climate changes that ended the last Ice Age." }
        ]),
        answer: "B",
        analysis: "文章结构：引入农业起源话题 → 讨论多种因素（气候/人口/社会）→ 描述农业带来的深远后果。选项B最准确概括。"
      }
    ]
  },

  // ============================================
  // ENVIRONMENTAL SCIENCE - The Great Pacific Garbage Patch
  // ============================================
  {
    passage_id: "envsci-environmental-001",
    title: "Ocean Pollution and the Great Pacific Garbage Patch",
    subject: "reading",
    difficulty: "hard",
    source: "envsci-environmental",
    passage_text: `The Great Pacific Garbage Patch, located between Hawaii and California, is one of the most visible symbols of the global plastic pollution crisis. Spanning an area estimated to be twice the size of Texas, this vast accumulation of marine debris is the result of ocean currents collecting floating plastic waste from across the Pacific Ocean. The garbage patch is not a solid island of trash, as popular imagination sometimes depicts, but rather a region where microplastics — tiny plastic particles less than five millimeters in diameter — are concentrated to unusually high levels.\n\nThe problem of marine plastic pollution dates back to the mid-twentieth century, when the widespread production and use of plastics began to increase dramatically. Plastic is ideal for commercial applications because it is lightweight, durable, and inexpensive, but these same properties make it extremely problematic when it enters the marine environment. Unlike organic materials, most plastics do not biodegrade; instead, they break down into smaller and smaller pieces through a process called photodegradation, driven by ultraviolet radiation from sunlight.\n\nThe movement of plastic debris in the ocean is governed by complex systems of ocean currents and wind patterns. In the central North Pacific, two major clockwise-rotating ocean gyres — the North Pacific Current, the California Current, the North Equatorial Current, and the Kuroshio Current — create a zone of relatively calm water in the center, where floating debris tends to accumulate. This gyre system is responsible for concentrating not only plastic but also other forms of marine debris, including fishing nets, containers, and industrial waste.\n\nThe ecological consequences of marine plastic pollution are severe and multifaceted. Large debris can entangle marine animals such as sea turtles, seals, and seabirds, leading to injury or death. Microplastics, meanwhile, pose a different kind of threat. They are easily ingested by small marine organisms, from zooplankton to small fish, and enter the food chain. Studies have found microplastics in the digestive tracts of fish species that are consumed by humans, raising concerns about potential health impacts on people who eat seafood.\n\nEfforts to address the plastic pollution crisis operate at multiple levels. On the international level, countries have signed agreements to reduce plastic waste entering waterways. At the national level, governments have implemented bans on single-use plastics and extended producer responsibility laws that hold manufacturers accountable for the end-of-life disposal of their products. Community-level initiatives, such as beach cleanups and plastic reduction campaigns, have also gained momentum. However, scientists warn that without more dramatic reductions in plastic production and consumption, the problem will continue to worsen, as plastic persists in the environment for hundreds of years.`,
    questions: [
      {
        content: "What does the passage mainly discuss?",
        order: 1, type: "detail", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "The history of plastic manufacturing in the mid-twentieth century" },
          { label: "B", text: "The formation, impacts, and response efforts related to the Great Pacific Garbage Patch" },
          { label: "C", text: "A comparison of ocean gyres in different parts of the world" },
          { label: "D", text: "The biological processes of marine animal digestion" }
        ]),
        answer: "B",
        analysis: "文章核心：太平洋垃圾带的形成机制、生态影响以及各层面的应对措施。"
      },
      {
        content: "According to the passage, why does the Great Pacific Garbage Patch not appear as a solid island?",
        order: 2, type: "detail", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "Because ocean waves constantly dissolve the plastic debris" },
          { label: "B", text: "Because it consists mainly of concentrated microplastics dispersed in water" },
          { label: "C", text: "Because the plastic has sunk to the ocean floor" },
          { label: "D", text: "Because marine organisms consume most of the floating debris" }
        ]),
        answer: "B",
        analysis: "第一段指出垃圾带不是固体垃圾岛，而是微塑料（<5mm）以异常高浓度集中在海水中的区域。"
      },
      {
        content: "The word 'accumulation' in paragraph 1 is closest in meaning to:",
        order: 3, type: "vocabulary", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "gradual decrease" },
          { label: "B", text: "collection or gathering together" },
          { label: "C", text: "chemical breakdown" },
          { label: "D", text: "intentional disposal" }
        ]),
        answer: "B",
        analysis: "'Accumulation' 意为堆积/积累。文中指海洋垃圾在太平洋中央区域不断聚集。"
      },
      {
        content: "According to the passage, what process causes plastics to break down into smaller pieces?",
        order: 4, type: "detail", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "Biodegradation by marine bacteria" },
          { label: "B", text: "Photodegradation caused by ultraviolet radiation" },
          { label: "C", text: "Mechanical erosion from ocean currents" },
          { label: "D", text: "Chemical reactions with saltwater" }
        ]),
        answer: "B",
        analysis: "第二段指出塑料不会生物降解，而是通过紫外线驱动的 photodegradation 过程分解为更小的碎片。"
      },
      {
        content: "Why are microplastics considered a significant environmental threat?",
        order: 5, type: "inference", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "They are too large to be ingested by any marine organism" },
          { label: "B", text: "They accumulate in the top layer of the ocean and are harmless" },
          { label: "C", text: "They enter the marine food chain and may eventually affect human health" },
          { label: "D", text: "They prevent sunlight from penetrating the ocean surface" }
        ]),
        answer: "C",
        analysis: "第四段指出微塑料被浮游生物和小鱼摄入，进入食物链，且在被人类食用的鱼类消化系统中已被发现，引发健康担忧。"
      },
      {
        content: "Which of the following best summarizes the passage's discussion of solutions to plastic pollution?",
        order: 6, type: "prose_summary", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "The passage argues that only international agreements can solve the problem." },
          { label: "B", text: "The passage presents a single comprehensive solution that has proven effective." },
          { label: "C", text: "The passage describes multi-level efforts but warns that more dramatic action is needed." },
          { label: "D", text: "The passage suggests that community-level initiatives are the most effective approach." }
        ]),
        answer: "C",
        analysis: "第五段描述多层面的应对措施（国际协议、国家政策、社区行动），但科学家警告需要更大幅度的减少塑料生产和消费。选项C最准确。"
      }
    ]
  },

  // ============================================
  // MATHEMATICS HISTORY - The Development of Zero
  // ============================================
  {
    passage_id: "math-history-001",
    title: "The History of Zero: From Nothing to Everything",
    subject: "reading",
    difficulty: "hard",
    source: "math-history",
    passage_text: `The concept of zero as both a number and a placeholder is one of the most important innovations in the history of mathematics. Without zero, the development of algebra, calculus, and modern computing would have been impossible. Yet the idea that nothing could be represented as a quantity was so counterintuitive to ancient thinkers that it took thousands of years for zero to achieve widespread acceptance across different civilizations.\n\nEarly civilizations had no need for a symbol representing zero because they did not use positional notation systems. The ancient Egyptians, for example, used a decimal system in which each power of ten had its own distinct symbol. Numbers were written by combining these symbols, with no need for a placeholder. Similarly, the Romans developed a robust system of numerals using letters (I, V, X, L, C, D, M), but their system was not positional, meaning that the value of a symbol did not depend on its position within a number.\n\nThe first known use of zero as a placeholder appeared in Babylonian mathematics around 300 BCE. The Babylonians used a sexagesimal (base-60) number system, in which the position of a symbol determined its value. Without a placeholder, numbers like 1 and 60 would have been written identically. To solve this problem, Babylonian scribes developed a symbol to indicate an empty position, though they used it only in the middle of numbers, not at the end. This was a significant step toward the concept of zero, but it was not yet recognized as a number in its own right.\n\nThe mathematical concept of zero as a number emerged in India around the fifth century CE. Indian mathematicians, working within a fully positional decimal system, treated zero not merely as a placeholder but as a number with its own properties. The mathematician Brahmagupta, writing in 628 CE, provided the first explicit rules for arithmetic operations involving zero, including the observation that subtracting zero from any number leaves the number unchanged. Indian scholars also developed the concept of negative numbers, which were closely related to the idea of zero as a reference point between positive and negative values.\n\nThe concept of zero gradually spread from India to the Islamic world and eventually to Europe. The Persian mathematician al-Khwarizmi introduced Indian numerals, including zero, to Islamic mathematics in the ninth century, and his works were later translated into Latin, introducing European scholars to the concept. However, zero faced significant resistance in Europe, where many scholars were skeptical of the idea that nothing could be treated as a number. It was not until the fourteenth century, with the development of advanced arithmetic and the growing needs of commerce and navigation, that zero became fully integrated into European mathematics.`,
    questions: [
      {
        content: "What is the primary focus of the passage?",
        order: 1, type: "detail", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "A comparison of different ancient numeral systems" },
          { label: "B", text: "The historical development of the concept of zero across civilizations" },
          { label: "C", text: "An argument that Indian mathematicians invented zero" },
          { label: "D", text: "The mathematical operations that involve zero" }
        ]),
        answer: "B",
        analysis: "文章核心：零的概念从巴比伦占位符到印度数字概念再到欧洲接受的完整历史发展过程。"
      },
      {
        content: "According to the passage, why did early civilizations not need a symbol for zero?",
        order: 2, type: "detail", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "They did not have advanced mathematics" },
          { label: "B", text: "They did not use positional notation systems" },
          { label: "C", text: "They believed zero was an unimportant concept" },
          { label: "D", text: "Their counting systems were limited to single digits" }
        ]),
        answer: "B",
        analysis: "第二段明确指出早期文明不需要零符号是因为他们没有使用位置记数法（positional notation systems）。"
      },
      {
        content: "The word 'counterintuitive' in paragraph 1 is closest in meaning to:",
        order: 3, type: "vocabulary", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "easily understood" },
          { label: "B", text: "contrary to common sense or intuition" },
          { label: "C", text: "mathematically complex" },
          { label: "D", text: "universally accepted" }
        ]),
        answer: "B",
        analysis: "'Counterintuitive' 意为违反直觉的。文中指出将'无'表示为'数量'这一概念在古代学者看来是违反直觉的。"
      },
      {
        content: "What limitation characterized the Babylonian use of zero?",
        order: 4, type: "detail", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "They only used zero at the end of numbers" },
          { label: "B", text: "They did not recognize zero as a number in its own right" },
          { label: "C", text: "They used zero only in addition operations" },
          { label: "D", text: "They applied zero only to the number sixty" }
        ]),
        answer: "B",
        analysis: "第三段指出巴比伦人的占位符仅用于数字中间（不在末尾），且尚未被承认为独立的数字。"
      },
      {
        content: "According to the passage, what significant contribution did Indian mathematicians make to the concept of zero?",
        order: 5, type: "detail", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "They invented the first zero symbol used by the Babylonians" },
          { label: "B", text: "They treated zero as a number with defined arithmetic properties" },
          { label: "C", text: "They proved that zero was essential for computing" },
          { label: "D", text: "They rejected the use of zero in favor of Roman numerals" }
        ]),
        answer: "B",
        analysis: "第四段指出印度数学家将零视为具有自身属性的数字，婆罗摩笈多（628年）给出了涉及零的算术运算规则。"
      },
      {
        content: "Which of the following best describes the organization of the passage?",
        order: 6, type: "prose_summary", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "The passage begins with zero in Europe, then traces it backward to ancient civilizations." },
          { label: "B", text: "The passage discusses why zero was unimportant in ancient times and then explains its modern applications." },
          { label: "C", text: "The passage traces the chronological development of zero from Babylonian placeholder to Indian number to European acceptance." },
          { label: "D", text: "The passage compares Babylonian and Indian number systems and concludes that Indian mathematics was superior." }
        ]),
        answer: "C",
        analysis: "文章按时间顺序：巴比伦占位符→印度数字概念→伊斯兰世界→欧洲接受。选项C最准确概括组织结构。"
      }
    ]
  }
];

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PASSAGES };
}
