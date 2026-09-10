/**
 * 默认托福阅读题库 — 无需PDF即可练习
 * 
 * 安装方式:
 *   1. 部署时自动调用 POST /api/questions/seed-defaults 即可入库
 *   2. 或直接运行: node server/src/data/seed-defaults.js
 * 
 * 包含 5 篇标准托福阅读文章，每篇 5-6 道选择题
 */
const DEFAULT_PASSAGES = [
  {
    passage_id: "default-seed-001",
    title: "The Domestication of Wheat",
    subject: "reading",
    difficulty: "medium",
    source: "default",
    passage_text: `Wheat was one of the first crops to be domesticated, with archaeological evidence suggesting cultivation began around 10,000 years ago in the Fertile Crescent. The wild ancestor of modern wheat, known as emmer wheat, grew naturally across a broad region stretching from modern-day Israel to Iran. Early farmers noticed that certain plants produced larger grains that remained attached to the stalk longer—a trait that made harvesting easier and more efficient.

Over generations of selective cultivation, farmers transformed wild emmer into domesticated wheat. The most significant change was the development of a non-shattering rachis—the central stem that holds the grains. In wild wheat, the rachis shatters when ripe, dispersing seeds widely. In domesticated varieties, the rachis remains intact, allowing farmers to harvest entire heads of grain at once. This trait, while disadvantageous in the wild, was precisely what made wheat suitable for agriculture.

The spread of wheat cultivation from the Fertile Crescent was remarkably rapid. By 8,000 years ago, wheat farming had reached the Indus Valley, the Nile Delta, and southeastern Europe. Genetic studies of modern wheat varieties reveal multiple hybridization events, as domesticated wheat crossed with local wild grasses in each new region, creating locally adapted varieties. Today, wheat is grown on more land area than any other food crop, providing approximately 20% of the calories consumed by the global population.`,
    questions: [
      {
        content: "According to the passage, what trait made domesticated wheat different from wild wheat?",
        order: 1, type: "detail", difficulty: "easy",
        options: JSON.stringify([
          { label: "A", text: "It produced smaller grains" },
          { label: "B", text: "It had a non-shattering rachis" },
          { label: "C", text: "It could grow without water" },
          { label: "D", text: "It had larger leaves" }
        ]),
        answer: "B",
        analysis: "文章明确说明 domesticated wheat 的 rachis 保持完整不碎裂，使收割更高效。"
      },
      {
        content: "The word 'disadvantageous' in paragraph 2 is closest in meaning to:",
        order: 2, type: "vocabulary", difficulty: "easy",
        options: JSON.stringify([
          { label: "A", text: "beneficial" },
          { label: "B", text: "harmful or unfavorable" },
          { label: "C", text: "mysterious" },
          { label: "D", text: "temporary" }
        ]),
        answer: "B",
        analysis: "'Disadvantageous' 意为不利的、有害的。在野生环境中 non-shattering 是不利的。"
      },
      {
        content: "What does the author suggest about wheat's spread to new regions?",
        order: 3, type: "inference", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "It was slow and difficult" },
          { label: "B", text: "It occurred through hybridization with local wild grasses" },
          { label: "C", text: "It was resisted by local populations" },
          { label: "D", text: "It happened entirely through trade routes" }
        ]),
        answer: "B",
        analysis: "文章提到 domesticated wheat 与新地区的野生草种杂交，产生了适应当地的品种。"
      },
      {
        content: "According to paragraph 3, what proportion of global calories does wheat provide?",
        order: 4, type: "detail", difficulty: "easy",
        options: JSON.stringify([
          { label: "A", text: "50%" },
          { label: "B", text: "10%" },
          { label: "C", text: "20%" },
          { label: "D", text: "30%" }
        ]),
        answer: "C",
        analysis: "文章最后一句明确说 wheat 提供全球约 20% 的卡路里。"
      },
      {
        content: "Which of the following best summarizes the main idea of the passage?",
        order: 5, type: "summary", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "Wheat is the most important crop in human history because it came from the Fertile Crescent" },
          { label: "B", text: "Wheat's domestication involved key genetic changes that made it suitable for farming, enabling its rapid global spread" },
          { label: "C", text: "Modern wheat varieties are genetically identical to wild emmer wheat" },
          { label: "D", text: "The Fertile Crescent was the only place where wheat could be successfully cultivated" }
        ]),
        answer: "B",
        analysis: "全文核心：小麦驯化涉及关键的基因变化（non-shattering rachis），使之适合农业并迅速全球传播。"
      }
    ]
  },
  {
    passage_id: "default-seed-002",
    title: "The Psychology of Color in Marketing",
    subject: "reading",
    difficulty: "medium",
    source: "default",
    passage_text: `Color psychology has become an essential component of modern marketing strategy. Research indicates that consumers make subconscious judgments about products within 90 seconds of initial viewing, and between 62% and 90% of that assessment is based on color alone. Different colors evoke specific emotional responses, and marketers have learned to leverage these associations to influence consumer behavior.

Red, for instance, is associated with urgency, excitement, and appetite stimulation. This explains why red is prominently featured in the branding of fast-food chains such as McDonald's and KFC, as well as in clearance sale signage. Blue, conversely, conveys trust, stability, and professionalism, making it the most commonly used color in corporate logos and financial institutions. Studies have shown that people are 15% more likely to trust a brand that uses blue in its primary branding.

However, color perception is not universal. Cultural differences play a significant role in how colors are interpreted. While white symbolizes purity and weddings in Western cultures, it is traditionally associated with mourning in many East Asian societies. Similarly, purple represents royalty and luxury in many Western contexts, but in Thailand and Brazil, it is associated with mourning. These cultural variations present challenges for global brands, who must adapt their color strategies to different markets.

The effectiveness of color in marketing also depends on the product category and the target audience. Research published in the Journal of Consumer Research found that while consumers prefer bold, saturated colors for sports cars and energy drinks, they favor muted, natural tones for products associated with health, sustainability, or relaxation. Gender differences also emerge: studies indicate that while both men and women prefer blue as a favorite color, women show a stronger preference for purple and softer tones, while men lean toward bolder shades.`,
    questions: [
      {
        content: "According to paragraph 1, what percentage of a consumer's initial product assessment is based on color?",
        order: 1, type: "detail", difficulty: "easy",
        options: JSON.stringify([
          { label: "A", text: "50% to 70%" },
          { label: "B", text: "62% to 90%" },
          { label: "C", text: "30% to 50%" },
          { label: "D", text: "10% to 20%" }
        ]),
        answer: "B",
        analysis: "第一段说明 62%-90% 的初步判断基于颜色。"
      },
      {
        content: "Why does the author mention fast-food chains in paragraph 2?",
        order: 2, type: "purpose", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "To argue that fast food is unhealthy" },
          { label: "B", text: "To illustrate how red is used to stimulate appetite and convey urgency" },
          { label: "C", text: "To compare different restaurant branding strategies" },
          { label: "D", text: "To suggest that blue would work better for restaurants" }
        ]),
        answer: "B",
        analysis: "作者用快餐连锁店的例子说明红色如何刺激食欲和传达紧迫感。"
      },
      {
        content: "The word 'conveys' in paragraph 2 is closest in meaning to:",
        order: 3, type: "vocabulary", difficulty: "easy",
        options: JSON.stringify([
          { label: "A", text: "hides" },
          { label: "B", text: "transports" },
          { label: "C", text: "communicates or expresses" },
          { label: "D", text: "contradicts" }
        ]),
        answer: "C",
        analysis: "'Convey' 意为传达、表达。蓝色传达信任、稳定和专业感。"
      },
      {
        content: "According to paragraph 3, how does the cultural meaning of white differ between Western and East Asian cultures?",
        order: 4, type: "detail", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "Western: purity; East Asian: mourning" },
          { label: "B", text: "Western: mourning; East Asian: purity" },
          { label: "C", text: "Both cultures associate it with weddings" },
          { label: "D", text: "Neither culture has strong associations with white" }
        ]),
        answer: "A",
        analysis: "文中说西方文化中白色象征纯洁和婚礼，东亚文化中传统上与哀悼相关。"
      },
      {
        content: "Based on the passage, what can be inferred about a global brand launching a health food product in Brazil?",
        order: 5, type: "inference", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "Purple should be avoided due to its association with mourning in Brazil" },
          { label: "B", text: "Red should be the primary color because it stimulates appetite" },
          { label: "C", text: "Only blue should be used since it is universally trusted" },
          { label: "D", text: "The brand should use bold colors for health food products" }
        ]),
        answer: "A",
        analysis: "文章提到巴西将紫色与哀悼关联（paragraph 3），且健康产品适合柔和的自然色调（paragraph 4），因此紫色应避免。"
      }
    ]
  },
  {
    passage_id: "default-seed-003",
    title: "Renewable Energy Storage Technologies",
    subject: "reading",
    difficulty: "hard",
    source: "default",
    passage_text: `One of the greatest challenges facing the widespread adoption of renewable energy is the intermittent nature of sources like solar and wind power. Unlike fossil fuel plants, which can operate continuously, solar panels generate electricity only during daylight hours, and wind turbines depend on variable wind patterns. This mismatch between energy supply and demand has spurred intensive research into energy storage technologies.

Lithium-ion batteries have emerged as the dominant technology for short-term energy storage. Their high energy density, declining costs—down 89% between 2010 and 2020—and rapid response times make them ideal for smoothing out hourly fluctuations in renewable output. Grid-scale installations, such as the Hornsdale Power Reserve in South Australia, have demonstrated that battery storage can stabilize electricity grids while reducing costs for consumers.

For longer-duration storage, however, lithium-ion batteries face economic and technical limitations. The cost of storing energy for days or weeks remains prohibitively high. This has renewed interest in alternative storage methods. Pumped-storage hydroelectricity—which pumps water uphill when electricity is abundant and releases it through turbines when needed—currently accounts for over 90% of global energy storage capacity. New projects are exploring closed-loop systems that minimize environmental impact by using artificial reservoirs rather than natural waterways.

Emerging technologies offer additional promise. Flow batteries, which store energy in liquid electrolytes contained in external tanks, can be scaled independently of power output, making them potentially cheaper than lithium-ion for long-duration applications. Hydrogen produced through electrolysis—using surplus renewable electricity to split water molecules—can be stored indefinitely and used either in fuel cells or combusted directly in modified gas turbines. Pilot projects in Europe and Japan are already demonstrating the feasibility of hydrogen-based seasonal energy storage.`,
    questions: [
      {
        content: "What is the main challenge discussed in the first paragraph?",
        order: 1, type: "main_idea", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "The high cost of solar panels" },
          { label: "B", text: "The intermittent nature of renewable energy sources" },
          { label: "C", text: "The lack of government support for renewables" },
          { label: "D", text: "The environmental impact of wind turbines" }
        ]),
        answer: "B",
        analysis: "第一段直接指出最大挑战是可再生能源的间歇性。"
      },
      {
        content: "According to paragraph 2, by what percentage did lithium-ion battery costs decline between 2010 and 2020?",
        order: 2, type: "detail", difficulty: "easy",
        options: JSON.stringify([
          { label: "A", text: "50%" },
          { label: "B", text: "89%" },
          { label: "C", text: "30%" },
          { label: "D", text: "95%" }
        ]),
        answer: "B",
        analysis: "第二段明确提到锂离子电池成本在 2010-2020 年间下降了 89%。"
      },
      {
        content: "The author mentions the Hornsdale Power Reserve in order to:",
        order: 3, type: "purpose", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "Criticize Australia's energy policy" },
          { label: "B", text: "Provide an example of successful grid-scale battery storage" },
          { label: "C", text: "Compare Australian and European energy systems" },
          { label: "D", text: "Argue that batteries are better than pumped hydro" }
        ]),
        answer: "B",
        analysis: "Hornsdale Power Reserve 被用作电网级电池存储的成功案例。"
      },
      {
        content: "What advantage do flow batteries have over lithium-ion for long-duration storage?",
        order: 4, type: "detail", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "Higher energy density" },
          { label: "B", text: "Faster response time" },
          { label: "C", text: "Scalable power and energy independently, potentially cheaper" },
          { label: "D", text: "Lighter weight" }
        ]),
        answer: "C",
        analysis: "最后一段说 flow batteries 可以独立扩展功率和能量，长期存储可能更便宜。"
      },
      {
        content: "What can be inferred about pumped-storage hydroelectricity from the passage?",
        order: 5, type: "inference", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "It is a new and experimental technology" },
          { label: "B", text: "It is the most widely used form of energy storage globally" },
          { label: "C", text: "It is being replaced by lithium-ion batteries" },
          { label: "D", text: "It has no environmental impacts" }
        ]),
        answer: "B",
        analysis: "第三段说 pumped-storage 占全球储能的 90% 以上，说明它是目前最广泛使用的储能形式。"
      },
      {
        content: "The word 'prohibitively' in paragraph 3 is closest in meaning to:",
        order: 6, type: "vocabulary", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "slightly" },
          { label: "B", text: "excessively or forbiddingly" },
          { label: "C", text: "occasionally" },
          { label: "D", text: "necessarily" }
        ]),
        answer: "B",
        analysis: "'Prohibitively' 在此语境中意为代价高到令人望而却步的程度。"
      }
    ]
  },
  // ============================================
  // Reading - Additional Passages
  // ============================================
  {
    passage_id: "default-seed-004",
    title: "The Evolution of Language",
    subject: "reading",
    difficulty: "medium",
    source: "default",
    passage_text: `The origins of human language remain one of the most enduring mysteries in linguistics and evolutionary biology. Unlike any other form of communication in the animal kingdom, human language is characterized by its infinite generative capacity—the ability to produce an unlimited number of expressions from a finite set of elements. This property, known as duality of patterning, allows a small inventory of sounds to be combined into a vast lexicon of meaningful units.
    
    The debate over language evolution centers on whether it arose gradually through natural selection or appeared suddenly as a result of a genetic mutation. Early anthropologists argued for a gradual emergence, pointing to the complex communication systems observed in dolphins, whales, and certain primate species as precursors to human language. However, Noam Chomsky and his followers have proposed the "mutation theory," suggesting that a single genetic change in the human brain gave rise to the capacity for recursive syntax—the ability to embed phrases within phrases indefinitely.
    
    Modern cognitive science has moved beyond this dichotomy. Evidence from neuroscience suggests that language involves a network of brain regions, including Broca's area for production and Wernicke's area for comprehension. The FOXP2 gene, discovered in the early 2000s, appears to play a critical role in language development. Mutations in this gene result in severe speech and language disorders, yet humans and chimpanzees differ by only two nucleotides in the FOXP2 sequence. This raises the possibility that language did not arise from a single mutation but rather from the interaction of multiple genetic changes combined with cultural evolution.`,
    questions: [
      {
        content: "What is the main topic of the passage?",
        order: 1, type: "main_idea", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "The genetic differences between humans and chimpanzees" },
          { label: "B", text: "Theories about how human language evolved" },
          { label: "C", text: "The structure of primate communication systems" },
          { label: "D", text: "The role of Broca's area in speech production" }
        ]),
        answer: "B",
        analysis: "全文围绕语言起源的理论展开讨论。"
      },
      {
        content: "According to paragraph 1, what distinguishes human language from animal communication?",
        order: 2, type: "detail", difficulty: "easy",
        options: JSON.stringify([
          { label: "A", text: "The number of sounds used" },
          { label: "B", text: "Its ability to produce unlimited expressions from finite elements" },
          { label: "C", text: "Its reliance on gestures" },
          { label: "D", text: "Its use in social bonding" }
        ]),
        answer: "B",
        analysis: "第一段明确说明人类语言的无限生成能力是其区别于动物沟通的关键特征。"
      },
      {
        content: "The word 'precursors' in paragraph 2 is closest in meaning to:",
        order: 3, type: "vocabulary", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "results" },
          { label: "B", text: "early forms or forerunners" },
          { label: "C", text: "alternatives" },
          { label: "D", text: "variations" }
        ]),
        answer: "B",
        analysis: "'Precursors' 在此意为先驱、早期形式。"
      },
      {
        content: "According to paragraph 3, what evidence challenges the idea that language arose from a single mutation?",
        order: 4, type: "inference", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "The FOXP2 gene has been found in all primates" },
          { label: "B", text: "Humans and chimpanzees differ by only two nucleotides in FOXP2" },
          { label: "C", text: "Broca's area exists in other animals" },
          { label: "D", text: "Language disorders can be cured with gene therapy" }
        ]),
        answer: "B",
        analysis: "人与黑猩猩的FOXP2基因仅有两个核苷酸差异，说明语言不是单一突变的结果。"
      },
      {
        content: "What can be inferred about modern cognitive science's view of language evolution?",
        order: 5, type: "inference", difficulty: "hard",
        options: [
          { label: "A", text: "It supports only the gradual emergence theory" },
          { label: "B", text: "It rejects all theories about language origins" },
          { label: "C", text: "It suggests language arose from multiple genetic and cultural factors working together" },
          { label: "D", text: "It proves that the FOXP2 gene is the cause of language" }
        ],
        answer: "C",
        analysis: "第三段提到语言演化可能是多个基因变化与文化演化相互作用的结果。"
      }
    ]
  },
  {
    passage_id: "default-seed-005",
    title: "The Impact of Urban Green Spaces",
    subject: "reading",
    difficulty: "medium",
    source: "default",
    passage_text: `Urban green spaces—parks, community gardens, street trees, and green roofs—have become an essential component of city planning in the twenty-first century. Research has consistently demonstrated that access to green spaces improves physical health, mental well-being, and social cohesion among urban residents. A landmark study published in The Lancet found that individuals living within a ten-minute walk of a green space reported significantly better general health than those without such access, even after controlling for income, education, and other socioeconomic factors.
    
    The health benefits of green spaces are thought to operate through several mechanisms. Physical activity is one obvious pathway: parks provide safe areas for exercise, recreation, and sports. Exposure to nature also reduces cortisol levels, the hormone associated with stress. Green spaces mitigate the urban heat island effect, lowering ambient temperatures by as much as five degrees Celsius in summer months. They also improve air quality by filtering pollutants and producing oxygen.
    
    Despite these benefits, the distribution of green spaces in cities is often inequitable. Wealthier neighborhoods typically have more and larger parks, while low-income areas frequently lack adequate green infrastructure. This disparity has led to a growing movement for environmental justice, which argues that access to nature is not a luxury but a fundamental right of urban citizenship. Cities like New York, London, and Melbourne have begun implementing policies to ensure that no resident lives more than a fifteen-minute walk from a park.`,
    questions: [
      {
        content: "According to paragraph 1, what did the landmark Lancet study find?",
        order: 1, type: "detail", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "Green spaces are most effective in small towns" },
          { label: "B", text: "People near green spaces report better health regardless of socioeconomic status" },
          { label: "C", text: "Income has no effect on physical health" },
          { label: "D", text: "Education is the primary factor determining health" }
        ]),
        answer: "B",
        analysis: "第一段说明在控制收入、教育等变量后，靠近绿地的人报告健康状况显著更好。"
      },
      {
        content: "The word 'mitigate' in paragraph 2 is closest in meaning to:",
        order: 2, type: "vocabulary", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "exacerbate" },
          { label: "B", text: "reduce or make less severe" },
          { label: "C", text: "eliminate completely" },
          { label: "D", text: "monitor closely" }
        ]),
        answer: "B",
        analysis: "'Mitigate' 意为减轻、缓和。"
      },
      {
        content: "How many mechanisms for health benefits are mentioned in paragraph 2?",
        order: 3, type: "detail", difficulty: "easy",
        options: JSON.stringify([
          { label: "A", text: "2" },
          { label: "B", text: "3" },
          { label: "C", text: "4" },
          { label: "D", text: "5" }
        ]),
        answer: "C",
        analysis: "第二段提到四种机制：运动、降低皮质醇、缓解热岛效应、改善空气质量。"
      },
      {
        content: "According to paragraph 3, what is the environmental justice movement arguing?",
        order: 4, type: "purpose", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "Green spaces should be privatized" },
          { label: "B", text: "Only wealthy neighborhoods deserve parks" },
          { label: "C", text: "Access to nature is a fundamental right, not a luxury" },
          { label: "D", text: "Cities should focus only on green infrastructure" }
        ]),
        answer: "C",
        analysis: "第三段明确指出环境正义运动认为获得自然不是奢侈品而是基本权利。"
      },
      {
        content: "Which of the following best summarizes the main idea of the passage?",
        order: 5, type: "summary", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "Urban green spaces provide multiple health benefits, yet their distribution is often unequal" },
          { label: "B", text: "Cities should eliminate all parking lots to build more parks" },
          { label: "C", text: "The Lancet study is the most important research on urban health" },
          { label: "D", text: "Only wealthy neighborhoods can afford green spaces" }
        ]),
        answer: "A",
        analysis: "文章核心：绿地有多重健康益处，但分布不平等。"
      }
    ]
  },
  {
    passage_id: "default-seed-006",
    title: "Ancient Astronomy and the Solar System",
    subject: "reading",
    difficulty: "hard",
    source: "default",
    passage_text: `Long before the invention of the telescope, ancient civilizations had developed sophisticated systems for tracking the movements of celestial bodies. The Babylonians, working in Mesopotamia around 600 BCE, created detailed records of planetary positions and discovered that celestial events followed predictable patterns. Their most remarkable achievement was the identification of the Saros cycle—a period of approximately 18 years after which eclipses repeat in a similar sequence. This discovery enabled them to predict eclipses with remarkable accuracy, a capability that conferred immense political and religious authority.
    
    The Greeks built upon Babylonian observations, adding mathematical models to explain the mechanics of celestial motion. Claudius Ptolemy, working in Alexandria around 150 CE, developed the geocentric model that placed Earth at the center of the universe. Despite its fundamental error, the Ptolemaic system was remarkably successful at predicting planetary positions for over a millennium. Its complexity arose from the need to explain retrograde motion—the apparent backward movement of planets—through elaborate systems of epicycles, smaller circular orbits superimposed on larger ones.
    
    The paradigm shift came in 1543 when Nicolaus Copernicus published his heliocentric theory. Although initially resisted by both religious and scientific establishments, the Copernican model gained credibility through the observations of Galileo Galilei, who used the recently invented telescope to discover Jupiter's four largest moons. These moons orbited Jupiter, not Earth, providing direct evidence that not all celestial bodies revolved around our planet. The work of Johannes Kepler, who identified that planets move in elliptical rather than circular orbits, and Isaac Newton, who formulated the law of universal gravitation, ultimately completed the scientific revolution that had begun with Copernicus's daring hypothesis.`,
    questions: [
      {
        content: "What was the Babylonians' most significant achievement in astronomy?",
        order: 1, type: "detail", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "Discovering that Earth is at the center of the universe" },
          { label: "B", text: "Identifying the Saros cycle and predicting eclipses" },
          { label: "C", text: "Building the first observatory" },
          { label: "D", text: "Inventing the telescope" }
        ]),
        answer: "B",
        analysis: "第一段明确指出巴比伦人的最大成就是发现沙罗周期并预测日食。"
      },
      {
        content: "Why was the Ptolemaic system able to successfully predict planetary positions for so long?",
        order: 2, type: "inference", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "Because it was based on correct scientific principles" },
          { label: "B", text: "Despite its error, its elaborate system of epicycles could account for observed movements" },
          { label: "C", text: "Because Greeks had better telescopes than the Babylonians" },
          { label: "D", text: "Because Earth truly is at the center of the solar system" }
        ]),
        answer: "B",
        analysis: "第二段说明尽管托勒密体系有根本错误，但通过复杂的本轮系统成功预测了行星位置。"
      },
      {
        content: "What was Galileo's key contribution to the heliocentric theory?",
        order: 3, type: "detail", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "He proved that planets move in ellipses" },
          { label: "B", text: "He discovered that Jupiter's moons orbit Jupiter" },
          { label: "C", text: "He invented the first telescope" },
          { label: "D", text: "He wrote the heliocentric theory" }
        ]),
        answer: "B",
        analysis: "第三段说明伽利略发现木星的四颗卫星绕木星旋转，为日心说提供了直接证据。"
      },
      {
        content: "The word 'retrograde' in paragraph 2 is closest in meaning to:",
        order: 4, type: "vocabulary", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "forward" },
          { label: "B", text: "backward" },
          { label: "C", text: "circular" },
          { label: "D", text: "accelerated" }
        ]),
        answer: "B",
        analysis: "'Retrograde' 意为逆行、倒退。第二段说这是行星看似向后移动的现象。"
      },
      {
        content: "What can be inferred about the Copernican theory from the passage?",
        order: 5, type: "inference", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "It was immediately accepted by everyone" },
          { label: "B", text: "It required evidence from multiple scientists over time to gain acceptance" },
          { label: "C", text: "It was more accurate than the Ptolemaic system from the start" },
          { label: "D", text: "It eliminated the need for the law of universal gravitation" }
        ]),
        answer: "B",
        analysis: "第三段说明哥白尼理论最初遭到反对，后来通过伽利略、开普勒、牛顿的工作才获得认可。"
      },
      {
        content: "Which of the following best summarizes the evolution of astronomical thought described in the passage?",
        order: 6, type: "summary", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "Observation → Mathematical model → Paradigm shift → Confirmation" },
          { label: "B", text: "Telescope invention → Greek mathematics → Babylonian records" },
          { label: "C", text: "Geocentric theory was always correct" },
          { label: "D", text: "Only Copernicus made important contributions to astronomy" }
        ]),
        answer: "A",
        analysis: "文章展示的天文学发展脉络：观测记录→数学模型→范式转换→验证确认。"
      }
    ]
  },
  // ============================================
  // Listening Passages (Conversation + Lecture)
  // ============================================
  {
    passage_id: "default-listen-001",
    title: "Conversation: Library Book Renewal",
    subject: "listening",
    difficulty: "easy",
    source: "default",
    passage_text: "Student: Hi, I'm trying to find a copy of 'Principles of Ecology' for my biology seminar. The online catalog shows it's available, but I couldn't find it on the shelf.\n\nLibrarian: Let me check. Ah, I see—that book has been moved to the course reserve section for Professor Chen's class. You can still access it, but the loan period is only two hours instead of the usual two weeks.\n\nStudent: Two hours? That's barely enough time to read one chapter.\n\nLibrarian: I understand. But you can renew it if no one else is waiting. Also, there's a digital copy available through our e-book platform that you can access 24/7 with your student ID.",
    questions: [
      {
        content: "Why can't the student find the book on the shelf?",
        order: 1, type: "conversation", difficulty: "easy",
        options: JSON.stringify([
          { label: "A", text: "The book is out of stock" },
          { label: "B", text: "The book has been moved to the course reserve section" },
          { label: "C", text: "The book is being repaired" },
          { label: "D", text: "The online catalog was wrong" }
        ]),
        answer: "B",
        analysis: "图书馆员说书已被移至课程保留区（course reserve section）。"
      },
      {
        content: "What does the librarian suggest as an alternative to borrowing the physical book?",
        order: 2, type: "conversation", difficulty: "easy",
        options: JSON.stringify([
          { label: "A", text: "Borrow the book from another library" },
          { label: "B", text: "Access the digital copy through the e-book platform" },
          { label: "C", text: "Photocopy the entire book" },
          { label: "D", text: "Wait until the next day" }
        ]),
        answer: "B",
        analysis: "图书馆员建议通过电子书平台访问数字副本。"
      },
      {
        content: "What is the student's main concern?",
        order: 3, type: "conversation", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "The book costs too much" },
          { label: "B", text: "The two-hour loan period is too short" },
          { label: "C", text: "The professor assigned too many books" },
          { label: "D", text: "The e-book platform doesn't work" }
        ]),
        answer: "B",
        analysis: "学生说'两小时 barely enough time to read one chapter'，说明他担心借阅时间太短。"
      }
    ]
  },
  {
    passage_id: "default-listen-002",
    title: "Lecture: Marine Biology — Coral Reefs",
    subject: "listening",
    difficulty: "medium",
    source: "default",
    passage_text: "Professor: Today we're going to explore coral reefs, one of the most biodiverse ecosystems on Earth. Despite covering less than one percent of the ocean floor, coral reefs support approximately twenty-five percent of all marine species. This remarkable productivity stems from a symbiotic relationship between coral polyps and microscopic algae called zooxanthellae.\n\nThe coral polyp provides the algae with a protected environment and compounds the algae needs for photosynthesis. In return, the zooxanthellae produce oxygen and remove carbon dioxide, while supplying the coral with glucose, glycerol, and amino acids—nutrients that fuel the coral's growth and calcium carbonate skeleton formation. This relationship is so essential that when water temperatures rise too high, the algae are expelled, causing what we call coral bleaching.\n\nCoral reefs face numerous threats beyond climate change. Coastal development destroys reef habitats through sedimentation and pollution. Overfishing disrupts the ecological balance. And ocean acidification, caused by increased carbon dioxide absorption, weakens coral skeletons by reducing the availability of carbonate ions. Scientists estimate that we may have lost fifty percent of the world's coral reefs in the last thirty years.\n\nHowever, there is hope. Marine protected areas, coral reef restoration projects, and international agreements to reduce carbon emissions offer pathways for recovery. Researchers are also developing heat-resistant coral strains through selective breeding and genetic engineering, hoping to create reefs that can survive in warmer oceans.",
    questions: [
      {
        content: "According to the lecture, what percentage of marine species depend on coral reefs?",
        order: 1, type: "lecture", difficulty: "easy",
        options: JSON.stringify([
          { label: "A", text: "Five percent" },
          { label: "B", text: "Fifteen percent" },
          { label: "C", text: "Twenty-five percent" },
          { label: "D", text: "Fifty percent" }
        ]),
        answer: "C",
        analysis: "讲座第一段明确说珊瑚礁支持约25%的海洋物种。"
      },
      {
        content: "What is the symbiotic relationship described in paragraph 2?",
        order: 2, type: "lecture", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "Predator-prey between sharks and smaller fish" },
          { label: "B", text: "Coral polyps providing shelter to algae in exchange for nutrients" },
          { label: "C", text: "Competition between different coral species" },
          { label: "D", text: "Mutual defense among reef organisms" }
        ]),
        answer: "B",
        analysis: "第二段描述珊瑚虫与虫黄藻的共生关系：珊瑚提供环境，藻类提供营养。"
      },
      {
        content: "What causes coral bleaching according to the lecture?",
        order: 3, type: "lecture", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "Overfishing" },
          { label: "B", text: "Coastal development" },
          { label: "C", text: "High water temperatures causing algae expulsion" },
          { label: "D", text: "Ocean acidification" }
        ]),
        answer: "C",
        analysis: "第二段说水温过高时藻类被排出，导致珊瑚白化。"
      },
      {
        content: "How many threats to coral reefs are mentioned in paragraph 3?",
        order: 4, type: "lecture", difficulty: "easy",
        options: JSON.stringify([
          { label: "A", text: "2" },
          { label: "B", text: "3" },
          { label: "C", text: "4" },
          { label: "D", text: "5" }
        ]),
        answer: "B",
        analysis: "第三段提到三个威胁：沿海开发、过度捕捞、海洋酸化。"
      },
      {
        content: "What solution does the professor mention in the final paragraph?",
        order: 5, type: "lecture", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "Building artificial reefs in the open ocean" },
          { label: "B", text: "Developing heat-resistant coral strains" },
          { label: "C", text: "Removing all fishing boats from coastal areas" },
          { label: "D", text: "Shutting down all coastal development" }
        ]),
        answer: "B",
        analysis: "最后一段提到通过选择育种和基因工程培育耐热珊瑚品种。"
      }
    ]
  },
  {
    passage_id: "default-listen-003",
    title: "Lecture: Art History — Impressionism",
    subject: "listening",
    difficulty: "medium",
    source: "default",
    passage_text: "The Impressionist movement began in Paris in the 1860s and fundamentally transformed Western art. Before Impressionism, the French Academy of Art controlled artistic standards, favoring historical, religious, and mythological subjects rendered with smooth, almost invisible brushwork. Students spent years studying under the Academy's strict curriculum, learning to paint according to established rules about composition, color, and subject matter.\n\nA group of younger artists, led by Claude Monet, Édouard Manet, and Camille Pissarro, challenged these conventions. They took their paintings outdoors to paint en plein air, capturing the fleeting effects of light and atmosphere on the landscape. Rather than the Academy's polished finish, they used short, visible brushstrokes and applied colors side by side so that the viewer's eye would mix them optically. Their first group exhibition in 1874 was met with harsh criticism, and the term 'Impressionism'—derived from Monet's painting 'Impression, Sunrise'—was originally coined as an insult by a frustrated critic.\n\nWhat made Impressionism revolutionary was its commitment to depicting modern life. While traditional art depicted the past, the Impressionists painted contemporary Paris: railway stations, ballet scenes, café culture, and the leisure activities of the middle class. Their technique allowed them to capture a moment of perception—a snapshot of visual experience—rather than constructing an idealized, timeless scene.",
    questions: [
      {
        content: "According to the lecture, what was the role of the French Academy of Art before Impressionism?",
        order: 1, type: "lecture", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "It encouraged experimentation with new techniques" },
          { label: "B", text: "It controlled artistic standards and promoted historical subjects" },
          { label: "C", text: "It supported outdoor painting" },
          { label: "D", text: "It was a group of independent artists" }
        ]),
        answer: "B",
        analysis: "第一段说明法国艺术学院控制艺术标准，偏好历史和宗教题材。"
      },
      {
        content: "What does 'en plein air' mean in the context of the lecture?",
        order: 2, type: "vocabulary", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "In a studio" },
          { label: "B", text: "Outdoors, in open air" },
          { label: "C", text: "At night" },
          { label: "D", text: "Using only black and white" }
        ]),
        answer: "B",
        analysis: "'En plein air' 意为户外作画，第二段说他们到户外捕捉光线和氛围的变化。"
      },
      {
        content: "Why was the term 'Impressionism' originally used?",
        order: 3, type: "detail", difficulty: "easy",
        options: JSON.stringify([
          { label: "A", text: "As a compliment to the artists' work" },
          { label: "B", text: "As an insult by a critic" },
          { label: "C", text: "As a technical term for painting style" },
          { label: "D", text: "As the name of an art exhibition" }
        ]),
        answer: "B",
        analysis: "第二段明确说这个词最初是评论家用来讽刺的。"
      },
      {
        content: "What was revolutionary about Impressionism according to the lecture?",
        order: 4, type: "purpose", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "It was the first art movement in history" },
          { label: "B", text: "It depicted modern contemporary life rather than idealized historical scenes" },
          { label: "C", text: "It eliminated the use of color in painting" },
          { label: "D", text: "It required years of academic training" }
        ]),
        answer: "B",
        analysis: "最后一段说明印象派革命性在于描绘现代生活，而非理想化的历史场景。"
      }
    ]
  },
  {
    passage_id: "default-listen-004",
    title: "Conversation: Research Assistant Position",
    subject: "listening",
    difficulty: "medium",
    source: "default",
    passage_text: "Student: Professor, I'm interested in the research assistant position you mentioned for your environmental science project. Could you tell me more about it?\n\nProfessor: Sure! We're studying the impact of urban development on local water quality. The project involves collecting water samples from three sites near the river over the next eight weeks. You'd be working approximately 10 hours per week.\n\nStudent: That sounds great. What kind of qualifications are you looking for?\n\nProfessor: We need someone who has completed at least one semester of environmental chemistry and has access to a car, since you'd need to drive to the sampling sites. We also provide training on all the testing equipment.\n\nStudent: I've just completed Environmental Chemistry 201 and I have a car. What about the compensation?\n\nProfessor: The position pays $15 per hour, which should be listed on your official transcript as 'Research Assistant - Environmental Science Department' when you request it.",
    questions: [
      {
        content: "What is the main topic of the conversation?",
        order: 1, type: "conversation", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "A student asking about a research position" },
          { label: "B", text: "A professor explaining a water quality test" },
          { label: "C", text: "A discussion about river pollution" },
          { label: "D", text: "A student complaining about their transcript" }
        ]),
        answer: "A",
        analysis: "学生向教授询问环境科学项目的研究助理职位。"
      },
      {
        content: "What is the project about?",
        order: 2, type: "conversation", difficulty: "easy",
        options: JSON.stringify([
          { label: "A", text: "Studying urban development effects on water quality" },
          { label: "B", text: "Building a new water treatment plant" },
          { label: "C", text: "Cleaning up the local river" },
          { label: "D", text: "Designing a new water testing method" }
        ]),
        answer: "A",
        analysis: "教授说项目是研究城市开发对当地水质的影响。"
      },
      {
        content: "According to the professor, what qualifications are needed?",
        order: 3, type: "conversation", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "Master's degree in environmental science" },
          { label: "B", text: "One semester of environmental chemistry and access to a car" },
          { label: "C", text: "Previous research experience and a driver's license" },
          { label: "D", text: "Three semesters of biology and a laptop" }
        ]),
        answer: "B",
        analysis: "教授提到需要至少一个学期的环境化学课程和拥有车辆。"
      },
      {
        content: "What can the student expect as compensation?",
        order: 4, type: "conversation", difficulty: "easy",
        options: JSON.stringify([
          { label: "A", text: "$15 per hour plus official transcript recognition" },
          { label: "B", text: "Free access to the laboratory" },
          { label: "C", text: "A scholarship for future studies" },
          { label: "D", text: "Payment in the form of course credit only" }
        ]),
        answer: "A",
        analysis: "教授说时薪15美元，并且可以在成绩单上列为研究助理。"
      }
    ]
  },
  {
    passage_id: "default-listen-005",
    title: "Lecture: Biology — Symbiotic Relationships",
    subject: "listening",
    difficulty: "medium",
    source: "default",
    passage_text: "In nature, organisms rarely exist in isolation. Many species have developed complex relationships with other organisms that are essential to their survival. These symbiotic relationships can be classified into three main categories: mutualism, commensalism, and parasitism.\n\nMutualism is a relationship where both species benefit. The classic example is the relationship between clownfish and sea anemones. The clownfish receives protection from predators among the anemone's stinging tentacles, which it is immune to thanks to a special mucus coating. In return, the clownfish cleans the anemone of parasites, provides nutrients through its waste, and lures prey toward the anemone.\n\nCommensalism occurs when one species benefits while the other is neither helped nor harmed. A common example is barnacles attached to whales. The barnacles gain free transportation to nutrient-rich waters, while the whale is largely unaffected. The barnacles don't feed on the whale directly, and they are so light that they don't significantly impede the whale's movement.\n\nParasitism is a relationship where one organism, the parasite, benefits at the expense of the other, the host. Tapeworms living in the intestines of animals are a well-known example. The tapeworm absorbs nutrients from the host's digestive system, causing the host to lose weight and become malnourished, while the tapeworm thrives. Understanding these relationships is crucial for ecology and conservation biology.",
    questions: [
      {
        content: "According to the lecture, what are the three types of symbiotic relationships?",
        order: 1, type: "lecture", difficulty: "easy",
        options: JSON.stringify([
          { label: "A", text: "Symbiosis, mutualism, parasitism" },
          { label: "B", text: "Mutualism, commensalism, parasitism" },
          { label: "C", text: "Predation, competition, cooperation" },
          { label: "D", text: "Symbiosis, commensalism, cooperation" }
        ]),
        answer: "B",
        analysis: "讲座第二段明确列出三种共生关系：互利共生、偏利共生、寄生。"
      },
      {
        content: "Why can clownfish live among sea anemone tentacles safely?",
        order: 2, type: "lecture", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "They have a special mucus coating that makes them immune" },
          { label: "B", text: "The anemones don't sting clownfish species" },
          { label: "C", text: "They are too large for the anemones to catch" },
          { label: "D", text: "They have built up resistance through eating anemones" }
        ]),
        answer: "A",
        analysis: "第三段说小丑鱼有特殊黏液涂层使其对海葵的刺细胞免疫。"
      },
      {
        content: "What is commensalism as described in the lecture?",
        order: 3, type: "vocabulary", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "Both species benefit" },
          { label: "B", text: "One benefits, the other is harmed" },
          { label: "C", text: "One benefits, the other is unaffected" },
          { label: "D", text: "Both species are harmed" }
        ]),
        answer: "C",
        analysis: "第四段定义偏利共生为一方受益，另一方不受影响。"
      },
      {
        content: "How does the clownfish benefit the sea anemone?",
        order: 4, type: "lecture", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "By defending it from other fish" },
          { label: "B", text: "By cleaning parasites, providing nutrients, and luring prey" },
          { label: "C", text: "By providing shade from the sun" },
          { label: "D", text: "By removing excess anemone tentacles" }
        ]),
        answer: "B",
        analysis: "第三段说明小丑鱼通过清理寄生虫、提供营养和吸引猎物来帮助海葵。"
      },
      {
        content: "According to the lecture, why is understanding symbiotic relationships important?",
        order: 5, type: "lecture", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "It helps in predicting predator-prey dynamics" },
          { label: "B", text: "It is crucial for ecology and conservation biology" },
          { label: "C", text: "It explains how species evolve physically" },
          { label: "D", text: "It determines which species should be protected" }
        ]),
        answer: "B",
        analysis: "讲座最后一段说明理解这些关系对生态学和保护生物学至关重要。"
      }
    ]
  },
  // ============================================
  // Speaking Passages (Independent + Integrated)
  // ============================================
  {
    passage_id: "default-speak-001",
    title: "Independent Speaking — Education",
    subject: "speaking",
    difficulty: "easy",
    source: "default",
    passage_text: "",
    questions: [
      {
        content: "Some people prefer to study in a quiet, private library. Others prefer to study in a group setting at a coffee shop or study hall. Which do you prefer and why? Use specific reasons and examples to support your answer.",
        order: 1, type: "independent", difficulty: "easy",
        options: [],
        answer: JSON.stringify({
          structure: "State preference + 2-3 reasons + personal example",
          sample_thesis: "I prefer to study in a quiet library because it minimizes distractions, allows me to concentrate deeply, and creates a productive atmosphere where everyone is focused on their work."
        }),
        analysis: "独立口语题：准备15秒，回答45秒。建议采用：立场+2-3个理由+个人例证。"
      }
    ]
  },
  {
    passage_id: "default-speak-002",
    title: "Integrated Speaking — Campus Policy",
    subject: "speaking",
    difficulty: "medium",
    source: "default",
    passage_text: "Read: The university administration has announced a new policy requiring all students to participate in community service for at least one credit hour per semester. The university believes this will foster civic responsibility and provide students with valuable real-world experience. However, the university has also stated that students will have the flexibility to choose their service activities, which can include volunteering at local shelters, tutoring younger students, or participating in environmental clean-up projects.",
    questions: [
      {
        content: "The professor in the lecture expresses an opinion about the university's new community service policy. State the professor's opinion and explain the reasons she gives for holding that opinion.",
        order: 2, type: "integrated", difficulty: "medium",
        options: [],
        answer: JSON.stringify({
          reading_summary: "University requires community service (1 credit/semester) to foster civic responsibility and real-world experience.",
          for_points: "Increases community engagement; builds student character; provides networking opportunities.",
          against_points: "Imposes additional burden on already busy students; some students work full-time jobs; service quality may suffer if participation is mandatory rather than voluntary."
        }),
        analysis: "综合口语题：概括阅读内容，呈现讲座支持或反对的论点。"
      }
    ]
  },
  {
    passage_id: "default-speak-003",
    title: "Independent Speaking — Technology",
    subject: "speaking",
    difficulty: "easy",
    source: "default",
    passage_text: "",
    questions: [
      {
        content: "Do you agree or disagree with the following statement? Schools should require all students to learn a foreign language in high school. Use specific reasons and examples to support your answer.",
        order: 3, type: "independent", difficulty: "easy",
        options: [],
        answer: JSON.stringify({
          structure: "State position + 2 reasons + examples",
          sample_thesis: "I agree that all high school students should be required to learn a foreign language because it opens career opportunities and broadens cultural understanding."
        }),
        analysis: "独立口语题：明确立场，充分展开论证。"
      }
    ]
  },
  // ============================================
  // Writing Passages
  // ============================================
  {
    passage_id: "default-write-001",
    title: "Independent Writing — Remote Work",
    subject: "writing",
    difficulty: "medium",
    source: "default",
    passage_text: "",
    questions: [
      {
        content: "Many companies have adopted remote work policies, allowing employees to work from home. Do you think the benefits of remote work outweigh the drawbacks? Use specific reasons and examples to support your position. (Minimum 300 words)",
        order: 1, type: "independent", difficulty: "medium",
        options: [],
        answer: JSON.stringify({
          rubric: ["Clear thesis statement (agree/disagree with specific position)", "2-3 body paragraphs with specific examples", "Address counter-argument", "Strong conclusion with synthesis"],
          sample_thesis: "I believe that remote work offers significant advantages over traditional office work, including increased productivity, improved work-life balance, and reduced environmental impact."
        }),
        analysis: "独立写作题：明确立场，至少300词，使用具体论据。"
      }
    ]
  },
  {
    passage_id: "default-write-002",
    title: "Integrated Writing — Remote Work Debate",
    subject: "writing",
    difficulty: "medium",
    source: "default",
    passage_text: "Reading: Companies should adopt permanent remote work policies because it increases employee productivity, reduces operational costs for the company, and improves employee work-life balance. Studies show that remote workers are on average 13% more productive than their office-based counterparts.",
    questions: [
      {
        content: "Read the passage above about remote work benefits. Then listen to a lecture that presents counter-arguments. Write a response that summarizes the lecture and explains how it challenges the specific points in the reading. (Minimum 200 words)",
        order: 2, type: "integrated", difficulty: "medium",
        options: [],
        answer: JSON.stringify({
          reading_claims: ["Remote work increases productivity (13% more productive)", "Reduces operational costs", "Improves work-life balance"],
          lecture_counterpoints: ["Productivity gains diminish over time due to isolation and lack of supervision", "Hidden costs: cybersecurity measures, home office equipment stipends, IT support", "Blurred boundaries between work and personal life lead to burnout and longer working hours"],
          essay_structure: "Introduction (summarize both) + 3 body paragraphs (one per counterpoint) + Conclusion"
        }),
        analysis: "综合写作：逐点回应阅读材料的主张，保持客观语气。"
      }
    ]
  },
  // ============================================
  
  {
    passage_id: "default-listen-006", title: "Lecture: Black Holes", subject: "listening", difficulty: "hard", source: "default",
    passage_text: "Professor: Today we'll discuss black holes. A black hole forms when a massive star collapses under its own gravity. The gravitational pull becomes so intense that nothing—not even light—can escape from within a boundary called the event horizon.\\n\\nThe concept dates back to 1916, when Karl Schwarzschild found a solution to Einstein's relativity. Astronomers began detecting black holes in 1964 by observing effects on nearby matter. Gas forms an accretion disk emitting X-rays.\\n\\nBlack holes come in sizes. Stellar black holes have masses five to ten times the Sun. Supermassive black holes at galaxy centers have millions or billions of solar masses. Our Milky Way has Sagittarius A*, about four million solar masses. Intermediate-mass black holes between 100 and 100,000 solar masses remain debated.\\n\\nThe event horizon is not a physical surface. A distant observer sees an object slow down approaching it. Inside, matter is drawn toward the singularity.",
    questions: [{ content: "What is the event horizon?", order: 1, type: "lecture", difficulty: "easy", options: [{"l":"A","t":"The physical surface"},{"l":"B","t":"The boundary from which nothing can escape"},{"l":"C","t":"The accretion disk"},{"l":"D","t":"The central singularity"}], answer: "B", analysis: "第一段说明 event horizon 是连光也无法逃逸的边界。" }]
  },
  {
    passage_id: "default-listen-007", title: "Conversation: Research Assistant", subject: "listening", difficulty: "medium", source: "default",
    passage_text: "Professor: Welcome to discuss the research assistant position.\\n\\nStudent: I'm interested in the cognitive development project.\\n\\nProfessor: We study theory of mind. Experiments with children aged three to five.\\n\\nStudent: Isn't that when they start pretend play?\\n\\nProfessor: Linked to symbolic thinking. Duties: setting up experiments, observing, data entry. Tuesday and Thursday, two to five.\\n\\nStudent: Special training?\\n\\nProfessor: Orientation next week. Read first two chapters of my textbook. Need commitment to at least one semester.\\n\\nStudent: I'm staying all year.\\n\\nProfessor: Wonderful. I'll send the schedule.",
    questions: [{ content: "What is the project about?", order: 1, type: "conversation", difficulty: "medium", options: [{"l":"A","t":"How children learn language"},{"l":"B","t":"How children develop theory of mind"},{"l":"C","t":"Children handling stress"},{"l":"D","t":"How children form friendships"}], answer: "B", analysis: "研究心智理论发展。" }]
  },
  {
    passage_id: "default-listen-008", title: "Lecture: Soil Erosion", subject: "listening", difficulty: "medium", source: "default",
    passage_text: "Professor: Today I want to talk about soil erosion—the washing away of the fertile top layer by wind or water. Human activities have accelerated it.\\n\\nTilling exposes topsoil. Without plant roots, soil can be lost at rates up to a hundred times faster than natural formation.\\n\\nTrees and vegetation act like a net holding soil. When cleared, exposed soil is washed away.\\n\\nSolutions exist. Conservation tillage reduced erosion by up to seventy percent. Terracing. Cover crops. Reforestation.\\n\\nWhere these measures have been implemented, soil quality recovered within a few growing seasons.",
    questions: [{ content: "What is soil erosion?", order: 1, type: "lecture", difficulty: "easy", options: [{"l":"A","t":"Loss from pesticides"},{"l":"B","t":"Washing away of topsoil by wind or water"},{"l":"C","t":"Accumulation from flooding"},{"l":"D","t":"Drying in deserts"}], answer: "B", analysis: "表土被风雨冲走。" }]
  },
  {
    passage_id: "default-listen-009", title: "Lecture: Jazz in New Orleans", subject: "listening", difficulty: "medium", source: "default",
    passage_text: "Professor: Our topic is jazz origins in New Orleans at the turn of the twentieth century.\\n\\nNew Orleans was unique for its cultural diversity—French, Spanish, African, Caribbean influences. It had a more fluid social structure.\\n\\nMusical ingredients: African rhythmic tradition, European harmonic tradition, the blues, and brass band tradition.\\n\\nWhen combined in the 1890s, musicians began improvising. This is the hallmark of jazz.\\n\\nBuddy Bolden is credited as the first jazz musician. No recordings survive. Jazz spread from New Orleans to Chicago, Kansas City, and eventually the world.",
    questions: [{ content: "What made New Orleans unique for jazz?", order: 1, type: "lecture", difficulty: "medium", options: [{"l":"A","t":"Largest population"},{"l":"B","t":"Cultural diversity and fluid social structure"},{"l":"C","t":"Only city with brass bands"},{"l":"D","t":"Most music schools"}], answer: "B", analysis: "文化多样性和流动的社会结构。" }]
  },
  {
    passage_id: "default-listen-010", title: "Conversation: Internship", subject: "listening", difficulty: "easy", source: "default",
    passage_text: "Counselor: Good afternoon. How can I help?\\n\\nStudent: I'm a junior majoring in business, looking for internships.\\n\\nCounselor: 200+ listings. What kind?\\n\\nStudent: Marketing, particularly digital marketing.\\n\\nCounselor: A tech startup in San Francisco needs a digital marketing intern. Competitive pay, often converts to full-time.\\n\\nStudent: Application process?\\n\\nCounselor: Resume and cover letter through our portal. Update LinkedIn.\\n\\nStudent: Preparation services?\\n\\nCounselor: Free mock interview service. Resume workshop every Tuesday at four.\\n\\nCounselor: Start early, apply to multiple positions, and follow up.",
    questions: [{ content: "What is the student's major?", order: 1, type: "conversation", difficulty: "easy", options: [{"l":"A","t":"Computer science"},{"l":"B","t":"Business"},{"l":"C","t":"Marketing"},{"l":"D","t":"Communications"}], answer: "B", analysis: "学生是 business 专业。" }]
  },
// Speaking - Additional Topics
  // ============================================
  {
    passage_id: "default-speak-004",
    title: "Independent Speaking — Health",
    subject: "speaking",
    difficulty: "easy",
    source: "default",
    passage_text: "",
    questions: [
      {
        content: "Do you agree or disagree with the following statement? All university students should be required to take a physical education course every semester. Use specific reasons and examples to support your answer.",
        order: 4, type: "independent", difficulty: "easy",
        options: [],
        answer: JSON.stringify({
          structure: "State position + 2 reasons + examples",
          sample_thesis: "I agree that all college students should be required to take PE courses because it promotes lifelong health habits and provides a necessary break from academic stress."
        }),
        analysis: "独立口语题：健康与体育教育相关话题。"
      }
    ]
  },
  {
    passage_id: "default-speak-005",
    title: "Integrated Speaking — Library Hours",
    subject: "speaking",
    difficulty: "medium",
    source: "default",
    passage_text: "Read: The university library is planning to extend its hours to be open 24 hours a day during midterms and finals. The administration claims that the extended hours will provide students with more study space and improve academic performance. The university has stated that security guards will be stationed at all entrances.",
    questions: [
      {
        content: "The professor in the lecture expresses an opinion about the library's plan to extend hours. State the professor's opinion and explain the reasons she gives for holding that opinion.",
        order: 5, type: "integrated", difficulty: "medium",
        options: [],
        answer: JSON.stringify({
          reading_summary: "Library plans 24-hour hours during midterms/finals to improve academic performance.",
          for_points: "More study space; better academic performance; security provided.",
          against_points: "Security costs too much; noise disturbs students trying to sleep; only a small fraction of students benefit."
        }),
        analysis: "综合口语题：图书馆延长营业时间相关话题。"
      }
    ]
  },
  // ============================================
  
  {
    passage_id: "default-speak-006", title: "Independent Speaking — Technology", subject: "speaking", difficulty: "medium", source: "default",
    passage_text: "",
    questions: [
        {
          content: "Do you agree or disagree? Children under twelve should be allowed to have their own smartphones. Use specific reasons and examples.",
          order: 6, type: "independent", difficulty: "medium",
          options: [],
          answer: JSON.stringify({
            structure: "State position + reasons",
            sample_thesis: "I disagree because it impacts social development, exposes to online risks, and reduces physical activity."
          }),
          analysis: "独立口语题：未成年人手机使用。"
        }
      ]
  },
  {
    passage_id: "default-speak-007", title: "Integrated Speaking — Tuition Increase", subject: "speaking", difficulty: "hard", source: "default",
    passage_text: "Read: The university board approved a 12% tuition increase. Funds will expand financial aid, hire faculty, and upgrade labs.",
    questions: [
        {
          content: "The man expresses his opinion about the tuition increase. State his opinion and explain his reasons.",
          order: 7, type: "integrated", difficulty: "hard",
          options: [],
          answer: JSON.stringify({
            response: "12% tuition increase approved.",
            reading_claims: "Expand financial aid, hire faculty, upgrade labs.",
            lecture_opinion: "Aid won't help non-qualifying; new faculty not urgent; lab upgrades could be budgeted; hurts low-income."
          }),
          analysis: "综合口语题：学费上涨。"
        }
      ]
  },
  {
    passage_id: "default-speak-008", title: "Independent Speaking — Urban Living", subject: "speaking", difficulty: "medium", source: "default",
    passage_text: "",
    questions: [
        {
          content: "Some prefer big cities, others small towns. Which do you prefer and why?",
          order: 8, type: "independent", difficulty: "medium",
          options: [],
          answer: JSON.stringify({
            structure: "State preference + reasons",
            sample_thesis: "I prefer cities for career opportunities and cultural activities."
          }),
          analysis: "独立口语题：大城市与小镇。"
        }
      ]
  },
  {
    passage_id: "default-speak-009", title: "Integrated Speaking — Study Abroad", subject: "speaking", difficulty: "medium", source: "default",
    passage_text: "Read: The university proposes mandatory one-semester study abroad for undergrad graduation.",
    questions: [
        {
          content: "The woman expresses her opinion about the study abroad requirement. State her opinion and explain her reasons.",
          order: 9, type: "integrated", difficulty: "medium",
          options: [],
          answer: JSON.stringify({
            response: "Mandatory one-semester study abroad.",
            reading_claims: "Broaden perspectives, improve language, enhance job prospects.",
            lecture_opinion: "Takes away choice; delays graduation; expensive; programs don't match majors."
          }),
          analysis: "综合口语题：强制留学要求。"
        }
      ]
  },
  {
    passage_id: "default-speak-010", title: "Independent Speaking — Work-Life Balance", subject: "speaking", difficulty: "medium", source: "default",
    passage_text: "",
    questions: [
        {
          content: "Do you agree or disagree? Companies should require employees to work from the office at least three days a week.",
          order: 10, type: "independent", difficulty: "medium",
          options: [],
          answer: JSON.stringify({
            structure: "State position + reasons",
            sample_thesis: "I disagree because remote work increases productivity, reduces commuting stress, and shows trust."
          }),
          analysis: "独立口语题：远程工作 vs 坐班。"
        }
      ]
  },
// Writing - Additional Topics
  // ============================================
  {
    passage_id: "default-write-005", title: "Integrated Writing — Climate Change", subject: "writing", difficulty: "hard", source: "default",
    passage_text: "Reading: Some scientists argue climate change is primarily caused by natural cycles. Human activities have only a minor effect.\\n\\nLecture: The professor disagrees. Current warming of 1.1 degrees Celsius since pre-industrial times is unprecedented. CO2 levels are higher than in the last 800,000 years. Isotopic signature links it to fossil fuels.",
    questions: [
        {
          content: "Write a response explaining how the lecture casts doubt on the reading. (Minimum 200 words)",
          order: 5, type: "integrated", difficulty: "hard",
          options: [],
          answer: JSON.stringify({
            reading_claims: ["Natural cycles primary cause", "Human activities minor effect"],
            lecture_counterpoints: ["1.1C warming unprecedented", "CO2 higher than last 800,000 years", "Isotopic signature links to fossil fuels"],
            essay_structure: "Introduction (summarize both) + 3 body paragraphs (one per counterpoint) + Conclusion"
          }),
          analysis: "综合写作：气候变化。"
        }
      ]
  },
  {
    passage_id: "default-write-006", title: "Independent Writing — University Cost", subject: "writing", difficulty: "medium", source: "default",
    passage_text: "",
    questions: [
        {
          content: "Do you agree or disagree? University cost is too high and should be free for all citizens. (Minimum 300 words)",
          order: 6, type: "independent", difficulty: "medium",
          options: [],
          answer: JSON.stringify({
            rubric: ["Clear thesis (agree/disagree)", "2-3 body paragraphs with specific examples", "Acknowledge counterargument", "Strong conclusion"],
            sample_thesis: "I disagree because it devalues degrees, burdens taxpayers, and ignores student investment."
          }),
          analysis: "独立写作：大学免费教育。"
        }
      ]
  },
  {
    passage_id: "default-write-007", title: "Integrated Writing — Social Media and Politics", subject: "writing", difficulty: "medium", source: "default",
    passage_text: "Reading: Social media has spread misinformation. Governments should regulate political content.\\n\\nLecture: The professor disagrees. Regulation would be censorship. The solution is education and media literacy.",
    questions: [
        {
          content: "Write a response explaining how the lecture undermines the reading. (Minimum 200 words)",
          order: 7, type: "integrated", difficulty: "medium",
          options: [],
          answer: JSON.stringify({
            reading_claims: ["Social media spreads misinformation", "Government should regulate"],
            lecture_counterpoints: ["Regulation = censorship", "Education is better solution", "Government control risks abuse"],
            essay_structure: "Introduction (summarize both) + 3 body paragraphs (one per counterpoint) + Conclusion"
          }),
          analysis: "综合写作：社交媒体与政治。"
        }
      ]
  },
  {
    passage_id: "default-write-008", title: "Independent Writing — Gap Year", subject: "writing", difficulty: "medium", source: "default",
    passage_text: "",
    questions: [
        {
          content: "Some high school graduates take a gap year. Is this beneficial? (Minimum 300 words)",
          order: 8, type: "independent", difficulty: "medium",
          options: [],
          answer: JSON.stringify({
            rubric: ["Clear thesis (agree/disagree)", "2-3 body paragraphs with specific examples", "Acknowledge drawbacks", "Strong conclusion"],
            sample_thesis: "Beneficial because it provides real-world experience, clarifies goals, prevents burnout."
          }),
          analysis: "独立写作：间隔年。"
        }
      ]
  },
  {
    passage_id: "default-write-009", title: "Integrated Writing — Remote Work", subject: "writing", difficulty: "medium", source: "default",
    passage_text: "Reading: Full remote work harms corporate culture. Face-to-face interaction is essential.\\n\\nLecture: The professor disagrees. Remote workers are more productive. Technology enables collaboration. Global talent pool enhances innovation.",
    questions: [
        {
          content: "Write a response explaining how the lecture undermines the reading. (Minimum 200 words)",
          order: 9, type: "integrated", difficulty: "medium",
          options: [],
          answer: JSON.stringify({
            reading_claims: ["Remote work harms culture", "Face-to-face essential"],
            lecture_counterpoints: ["Remote workers more productive", "Technology enables collaboration", "Global talent enhances innovation"],
            essay_structure: "Introduction (summarize both) + 3 body paragraphs (one per counterpoint) + Conclusion"
          }),
          analysis: "综合写作：远程办公。"
        }
      ]
  },
  {
    passage_id: "default-write-010", title: "Independent Writing — Art Education", subject: "writing", difficulty: "medium", source: "default",
    passage_text: "",
    questions: [
        {
          content: "Should art, music, and PE receive equal funding as STEM subjects? (Minimum 300 words)",
          order: 10, type: "independent", difficulty: "medium",
          options: [],
          answer: JSON.stringify({
            rubric: ["Clear thesis (agree/disagree)", "2-3 body paragraphs with specific examples", "Address counterargument", "Strong conclusion"],
            sample_thesis: "Equal funding because art develops creativity, improves mental health, provides balanced education."
          }),
          analysis: "独立写作：艺术教育经费。"
        }
      ]
  },
  {
    passage_id: "default-write-003",
    title: "Independent Writing — Online Learning",
    subject: "writing",
    difficulty: "medium",
    source: "default",
    passage_text: "",
    questions: [
      {
        content: "Do you agree or disagree with the following statement? Online courses are more effective than traditional classroom courses. Use specific reasons and examples to support your position. (Minimum 300 words)",
        order: 3, type: "independent", difficulty: "medium",
        options: [],
        answer: JSON.stringify({
          rubric: ["Clear thesis (agree/disagree)", "2-3 body paragraphs with specific examples", "Address counterargument", "Strong conclusion"],
          sample_thesis: "I disagree that online courses are more effective than traditional classroom courses because they lack the interactive engagement and immediate feedback that in-person instruction provides."
        }),
        analysis: "独立写作题：在线学习与课堂教育对比。"
      }
    ]
  },
  {
    passage_id: "default-write-004",
    title: "Integrated Writing — Space Exploration Funding",
    subject: "writing",
    difficulty: "medium",
    source: "default",
    passage_text: "Reading: The government should allocate significantly more funds to space exploration programs. Space exploration leads to technological innovations that benefit daily life, inspires future generations of scientists and engineers, and provides long-term solutions for humanity as Earth's resources become depleted.",
    questions: [
      {
        content: "Read the passage above about space exploration funding. Then listen to a lecture that presents counter-arguments. Write a response that summarizes the lecture and explains how it challenges the specific points in the reading. (Minimum 200 words)",
        order: 4, type: "integrated", difficulty: "medium",
        options: [],
        answer: JSON.stringify({
          reading_claims: ["Technological innovations benefit daily life", "Inspires future scientists", "Long-term solution for resource depletion"],
          lecture_counterpoints: ["Space technology benefits are minimal compared to cost", "Inspiration can come from other sources like arts and sports", "Earth's resource problems should be addressed on Earth, not through space colonization"],
          essay_structure: "Introduction (summarize both) + 3 body paragraphs (one per counterpoint) + Conclusion"
        }),
        analysis: "综合写作：太空探索资金辩论。"
      }
    ]
  },

  // ============================================
  // 新增：Phase 0 补充阅读种子数据（5篇）
  // ============================================
  {
    passage_id: "default-read-007",
    title: "The Rise of the Information Age",
    subject: "reading",
    difficulty: "medium",
    source: "default",
    passage_text: `The transition from an industrial economy to an information economy has been one of the most profound transformations in human history. In the early twentieth century, the majority of workers in developed nations were employed in manufacturing or agriculture. By the close of the century, a majority in those same nations worked in service industries that relied on the creation, distribution, and management of information.\n\nSeveral factors contributed to this shift. The invention of the transistor in 1947 revolutionized electronics, enabling the development of smaller, faster, and more reliable computing devices. The subsequent development of the integrated circuit and the microprocessor in the 1960s and 1970s laid the foundation for personal computers, which transformed offices, homes, and educational institutions worldwide.\n\nThe internet, originally a military communications network, became publicly accessible in the 1990s and accelerated the information economy exponentially. Email, web browsers, and search engines created entirely new industries while fundamentally altering traditional ones. By 2000, the majority of economic value in developed nations was derived from information-intensive activities rather than the production of physical goods.`,
    questions: [
      {
        content: "What does the passage suggest about employment in developed nations during the early twentieth century?",
        order: 1, type: "detail", difficulty: "easy",
        options: JSON.stringify([
          { label: "A", text: "Most workers were in manufacturing or agriculture" },
          { label: "B", text: "Most workers worked in information-related industries" },
          { label: "C", text: "The majority were unemployed" },
          { label: "D", text: "Most workers were in the service industry" }
        ]),
        answer: "A",
        analysis: "第一段明确说明二十世纪初发达国家大多数工人从事制造业或农业。"
      },
      {
        content: "The word 'profound' in paragraph 1 is closest in meaning to:",
        order: 2, type: "vocabulary", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "temporary" },
          { label: "B", text: "deep and far-reaching" },
          { label: "C", text: "gradual" },
          { label: "D", text: "disappointing" }
        ]),
        answer: "B",
        analysis: "'Profound' 意为深刻的、深远的。从工业经济到信息经济的转变是人类历史上最深刻的变革之一。"
      },
      {
        content: "What was the original purpose of the internet according to the passage?",
        order: 3, type: "detail", difficulty: "easy",
        options: JSON.stringify([
          { label: "A", text: "Commercial advertising" },
          { label: "B", text: "Military communications" },
          { label: "C", text: "Entertainment" },
          { label: "D", text: "Educational research" }
        ]),
        answer: "B",
        analysis: "第三段说明互联网最初是军事通信网络。"
      },
      {
        content: "According to paragraph 2, what was the significance of the microprocessor?",
        order: 4, type: "inference", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "It replaced all other types of computers" },
          { label: "B", text: "It enabled the development of personal computers" },
          { label: "C", text: "It was primarily used for military purposes" },
          { label: "D", text: "It reduced the cost of agricultural equipment" }
        ]),
        answer: "B",
        analysis: "第二段指出微处理器的开发为个人计算机奠定了基础。"
      },
      {
        content: "Which of the following best summarizes the main idea of the passage?",
        order: 5, type: "summary", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "The invention of the transistor ended the industrial economy" },
          { label: "B", text: "Technological innovations transformed the economy from industrial to information-based" },
          { label: "C", text: "The internet was the only factor in the rise of the information economy" },
          { label: "D", text: "Developed nations are no longer interested in manufacturing" }
        ]),
        answer: "B",
        analysis: "文章主旨在说明一系列技术创新（晶体管、集成电路、微处理器、互联网）共同推动了从工业经济向信息经济的转型。"
      }
    ]
  },

  {
    passage_id: "default-read-008",
    title: "Ancient Roman Engineering and Aqueducts",
    subject: "reading",
    difficulty: "hard",
    source: "default",
    passage_text: `One of the most remarkable achievements of ancient Roman engineering was the construction of aqueducts—structures designed to transport water from distant sources into cities and towns. The first Roman aqueduct, the Aqua Appia, was built in 312 BC and consisted of a subterranean channel that carried water approximately sixteen miles from springs outside Rome to the city.\n\nThe Romans did not invent aqueducts; the Greeks and other civilizations had developed similar systems earlier. What distinguished Roman aqueducts was their scale, sophistication, and durability. At its peak in the third century AD, Rome was served by eleven aqueducts that delivered an estimated one million cubic meters of water per day—more than many modern cities provide today.\n\nThe engineering principles behind aqueduct construction were surprisingly advanced. Engineers maintained a very slight downward gradient throughout the channel—sometimes less than one meter of descent per kilometer of distance—to ensure a steady flow of water without erosion. They used concrete, an invention developed by the Romans themselves, to construct channels that have survived for nearly two millennia. Some aqueducts employed arches to carry water across valleys, while others tunneled through mountains or followed the contours of hillsides.`,
    questions: [
      {
        content: "What can be inferred about Roman engineering from the passage?",
        order: 1, type: "inference", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "They borrowed all their knowledge from the Greeks" },
          { label: "B", text: "They applied advanced mathematical principles to maintain water flow" },
          { label: "C", text: "They lacked knowledge of concrete construction" },
          { label: "D", text: "Their aqueducts were primarily decorative" }
        ]),
        answer: "B",
        analysis: "第三段说明罗马工程师使用非常精确的下沉梯度（每公里下降不到1米）来确保水流稳定，这体现了先进的数学原理。"
      },
      {
        content: "The word 'durability' in paragraph 2 is closest in meaning to:",
        order: 2, type: "vocabulary", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "beauty" },
          { label: "B", text: "long-lasting quality" },
          { label: "C", text: "speed" },
          { label: "D", text: "complexity" }
        ]),
        answer: "B",
        analysis: "'Durability' 意为耐用性、持久性。文中说这些水道使用了近两千年。"
      },
      {
        content: "According to paragraph 2, what was unusual about Rome's water supply at its peak?",
        order: 3, type: "detail", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "It was the only city with aqueducts" },
          { label: "B", text: "It had fewer aqueducts than modern cities" },
          { label: "C", text: "Its daily water volume exceeded that of many modern cities" },
          { label: "D", text: "It had only one aqueduct serving the entire population" }
        ]),
        answer: "C",
        analysis: "第二段指出罗马高峰期日供水量约100万立方米，超过许多现代城市。"
      },
      {
        content: "How many aqueducts served Rome at its peak in the third century AD?",
        order: 4, type: "detail", difficulty: "easy",
        options: JSON.stringify([
          { label: "A", text: "1" },
          { label: "B", text: "11" },
          { label: "C", text: "3" },
          { label: "D", text: "Over 50" }
        ]),
        answer: "B",
        analysis: "第二段明确指出3世纪时罗马由11条水道供水。"
      },
      {
        content: "Which of the following best summarizes the passage?",
        order: 5, type: "summary", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "The Greeks invented aqueducts and the Romans copied them" },
          { label: "B", text: "Roman aqueducts were remarkable for their scale, engineering, and longevity" },
          { label: "C", text: "Concrete was the most important Roman invention" },
          { label: "D", text: "Aqueducts were built exclusively to supply Rome" }
        ]),
        answer: "B",
        analysis: "文章重点说明罗马水道以其规模、工程技术和耐用性而著称。"
      }
    ]
  },

  {
    passage_id: "default-read-009",
    title: "The Evolution of Language",
    subject: "reading",
    difficulty: "medium",
    source: "default",
    passage_text: `The origins of human language have long been a subject of intense debate among linguists, anthropologists, and cognitive scientists. Unlike other forms of communication found in the animal kingdom—such as bird songs, bee dances, or primate calls—human language is characterized by displacement, productivity, and arbitrariness. Displacement refers to the ability to communicate about things not present in the immediate environment. Productivity, or creativity, allows speakers to generate and understand an infinite number of novel sentences. Arbitrariness means there is no inherent connection between a word's sound and its meaning.\n\nSome researchers propose that language evolved gradually over hundreds of thousands of years, beginning with simple vocalizations and gestures and developing into the complex grammatical systems we recognize today. This gradualist view is supported by evidence of increasing brain size in early human ancestors, which would have been necessary to support the neurological complexity required for language.\n\nOther scholars argue for a more sudden emergence of language, pointing to the unique FOXP2 gene mutation found in humans. This gene appears to play a crucial role in speech and language development. The genetic evidence suggests that modern language capabilities emerged relatively recently—perhaps within the last 100,000 years—representing a sudden evolutionary leap rather than a gradual process.`,
    questions: [
      {
        content: "What does 'displacement' mean in the context of human language?",
        order: 1, type: "vocabulary", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "The ability to change languages" },
          { label: "B", text: "The ability to communicate about absent objects or events" },
          { label: "C", text: "The movement of speakers between regions" },
          { label: "D", text: "The translation of spoken words into writing" }
        ]),
        answer: "B",
        analysis: "第二段定义displacement为能够交流不在眼前的事物。"
      },
      {
        content: "According to the passage, what evidence supports the gradualist theory of language evolution?",
        order: 2, type: "detail", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "The discovery of ancient written texts" },
          { label: "B", text: "Increasing brain size in early human ancestors" },
          { label: "C", text: "The existence of animal communication systems" },
          { label: "D", text: "The rapid spread of Indo-European languages" }
        ]),
        answer: "B",
        analysis: "第三段指出，早期人类祖先脑容量增加的证据支持语言逐渐演化的观点。"
      },
      {
        content: "What is the main difference between human language and animal communication?",
        order: 3, type: "inference", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "Animals cannot make sounds" },
          { label: "B", text: "Human language has displacement, productivity, and arbitrariness" },
          { label: "C", text: "Animal communication is more complex" },
          { label: "D", text: "Humans are the only species that use sound to communicate" }
        ]),
        answer: "B",
        analysis: "第二段指出人类语言具有位移性、生成性和任意性，而动物通信不具备这些特征。"
      },
      {
        content: "What role does the FOXP2 gene play according to the passage?",
        order: 4, type: "detail", difficulty: "easy",
        options: JSON.stringify([
          { label: "A", text: "It controls brain size" },
          { label: "B", text: "It influences speech and language development" },
          { label: "C", text: "It determines the number of languages a person can speak" },
          { label: "D", text: "It is found in all animals, not just humans" }
        ]),
        answer: "B",
        analysis: "第四段说明FOXP2基因在语音和语言发展中起关键作用。"
      },
      {
        content: "Which of the following best summarizes the passage?",
        order: 5, type: "summary", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "Human language evolved from animal communication" },
          { label: "B", text: "There are competing theories about how and when human language originated" },
          { label: "C", text: "The FOXP2 gene proves that language evolved suddenly" },
          { label: "D", text: "Language is the most important human trait" }
        ]),
        answer: "B",
        analysis: "文章介绍了关于人类语言起源的两种主要理论：渐进论和突变论。"
      }
    ]
  },

  {
    passage_id: "default-read-010",
    title: "The Scientific Method and Hypothesis Testing",
    subject: "reading",
    difficulty: "medium",
    source: "default",
    passage_text: `The scientific method is a systematic process for acquiring knowledge that has been used since at least the seventeenth century. At its core is the process of hypothesis formation and testing. A hypothesis is a testable prediction about how nature behaves under specific conditions. It is not merely a guess; it is an educated prediction based on prior observation, existing theory, or both.\n\nOnce a hypothesis is formulated, scientists design experiments to test it. A well-designed experiment includes a control group and an experimental group. The control group provides a baseline for comparison—it is exposed to all conditions except the one being tested. The experimental group receives the treatment or intervention under investigation. By comparing results between the two groups, scientists can determine whether changes in the dependent variable are actually caused by the independent variable.\n\nImportantly, the scientific method is not a linear process but a cyclical one. Results from testing a hypothesis may confirm, refute, or partially support the original prediction. In any case, the results lead to new questions and new hypotheses, driving the continuous cycle of scientific inquiry. A hypothesis is never proven true in an absolute sense; it can only be supported by evidence, and new evidence could always challenge the conclusion.`,
    questions: [
      {
        content: "According to the passage, what distinguishes a hypothesis from a simple guess?",
        order: 1, type: "detail", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "A hypothesis is based on prior observation or existing theory" },
          { label: "B", text: "A hypothesis is always correct" },
          { label: "C", text: "A hypothesis requires mathematical proof" },
          { label: "D", text: "A hypothesis cannot be tested" }
        ]),
        answer: "A",
        analysis: "第一段指出，假设不是简单的猜测，而是基于先前观察或现有理论的教育性预测。"
      },
      {
        content: "The word 'formulated' in paragraph 2 is closest in meaning to:",
        order: 2, type: "vocabulary", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "destroyed" },
          { label: "B", text: "developed or stated precisely" },
          { label: "C", text: "randomly generated" },
          { label: "D", text: "publicly announced" }
        ]),
        answer: "B",
        analysis: "'Formulated' 意为制定、精确表述。"
      },
      {
        content: "What is the purpose of a control group in an experiment?",
        order: 3, type: "detail", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "To receive the experimental treatment" },
          { label: "B", text: "To provide a baseline for comparison" },
          { label: "C", text: "To prove the hypothesis is correct" },
          { label: "D", text: "To eliminate the need for data analysis" }
        ]),
        answer: "B",
        analysis: "第二段说明对照组提供比较基准——它暴露于所有条件，除了正在测试的那个变量。"
      },
      {
        content: "What does the passage suggest about the nature of scientific knowledge?",
        order: 4, type: "inference", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "Scientific knowledge is permanent and unchangeable" },
          { label: "B", text: "Scientific knowledge can always be challenged by new evidence" },
          { label: "C", text: "Scientists rarely use the scientific method" },
          { label: "D", text: "Hypotheses are eventually proven absolutely true" }
        ]),
        answer: "B",
        analysis: "第三段强调假设永远不能被绝对证明为真，只能被证据支持，且新证据随时可能推翻结论。"
      },
      {
        content: "Which best describes the structure of the passage?",
        order: 5, type: "summary", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "Introduction to hypothesis definition, experimental design, and the cyclical nature of science" },
          { label: "B", text: "Critique of the scientific method and proposals for reform" },
          { label: "C", text: "Historical account of how Galileo developed the scientific method" },
          { label: "D", text: "Comparison between scientific and religious approaches to knowledge" }
        ]),
        answer: "A",
        analysis: "文章依次介绍了假设定义、实验设计（对照组和实验组）、以及科学方法的循环性质。"
      }
    ]
  },

  {
    passage_id: "default-read-011",
    title: "The Impact of Photosynthesis on Earth",
    subject: "reading",
    difficulty: "hard",
    source: "default",
    passage_text: `Photosynthesis is one of the most important biological processes on Earth, fundamentally transforming the planet's atmosphere, geology, and the potential for complex life. The process by which plants, algae, and certain bacteria convert sunlight, water, and carbon dioxide into glucose and oxygen has had far-reaching consequences that extend far beyond the organisms that perform it.\n\nThe earliest photosynthetic organisms appeared approximately 3.5 billion years ago—cyanobacteria, also known as blue-green algae, were the first to harness solar energy to produce food. Over hundreds of millions of years, these organisms gradually released oxygen as a byproduct of photosynthesis. Initially, the oxygen produced reacted with iron in the ocean, forming vast deposits of iron oxide—the rust-colored minerals that form a significant portion of Earth's mineral resources today.\n\nOnly after the iron in the oceans was saturated did oxygen begin to accumulate in the atmosphere, an event known as the Great Oxidation Event approximately 2.4 billion years ago. This fundamentally changed Earth's atmospheric composition from a reducing atmosphere to an oxidizing one. The rise of atmospheric oxygen had two major consequences. First, it made possible the evolution of aerobic organisms—organisms that use oxygen for cellular respiration, which is far more efficient than anaerobic metabolism. Second, some of the oxygen rose to the upper atmosphere and formed the ozone layer, which protects the Earth from harmful ultraviolet radiation. This protection was essential for the eventual colonization of land by plants and animals.`,
    questions: [
      {
        content: "What did the earliest photosynthetic organisms gradually add to the environment?",
        order: 1, type: "detail", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "Carbon dioxide" },
          { label: "B", text: "Oxygen" },
          { label: "C", text: "Nitrogen" },
          { label: "D", text: "Hydrogen" }
        ]),
        answer: "B",
        analysis: "第二段明确指出蓝藻作为最早的光合作用生物，逐渐释放氧气作为光合作用的副产物。"
      },
      {
        content: "The word 'saturated' in paragraph 3 is closest in meaning to:",
        order: 2, type: "vocabulary", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "completely filled or absorbed" },
          { label: "B", text: "partially contaminated" },
          { label: "C", text: "chemically unstable" },
          { label: "D", text: "rapidly changing" }
        ]),
        answer: "A",
        analysis: "'Saturated' 意为饱和的、完全吸收的。文中说当海洋中的铁被完全吸收后，氧气才开始在大气中积累。"
      },
      {
        content: "What are iron oxide deposits related to, according to the passage?",
        order: 3, type: "detail", difficulty: "easy",
        options: JSON.stringify([
          { label: "A", text: "Volcanic eruptions" },
          { label: "B", text: "Oxygen reacting with iron in ancient oceans" },
          { label: "C", text: "The formation of the ozone layer" },
          { label: "D", text: "Meteor impacts on Earth's surface" }
        ]),
        answer: "B",
        analysis: "第二段指出氧气与海洋中的铁反应形成氧化铁沉积，这些构成了地球重要矿物资源。"
      },
      {
        content: "According to the passage, what two major consequences resulted from the Great Oxidation Event?",
        order: 4, type: "detail", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "The formation of iron deposits and volcanic activity" },
          { label: "B", text: "The evolution of aerobic organisms and the ozone layer" },
          { label: "C", text: "The extinction of cyanobacteria and the cooling of oceans" },
          { label: "D", text: "The creation of photosynthesis and the first life forms" }
        ]),
        answer: "B",
        analysis: "第三段说明大氧化事件的两大后果：需氧生物的演化和臭氧层的形成。"
      },
      {
        content: "Which statement best captures the main idea of the passage?",
        order: 5, type: "summary", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "Photosynthesis is performed by many types of organisms" },
          { label: "B", text: "Photosynthesis profoundly transformed Earth's atmosphere and enabled complex life" },
          { label: "C", text: "Cyanobacteria are the most important organisms on Earth" },
          { label: "D", text: "The ozone layer protects organisms from ultraviolet radiation" }
        ]),
        answer: "B",
        analysis: "文章主旨在于说明光合作用从根本上改变了地球大气，并为复杂生命的演化创造了条件。"
      }
    ]
  }
];

module.exports = { DEFAULT_PASSAGES };
