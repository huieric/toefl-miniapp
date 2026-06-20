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
  }
];

module.exports = { DEFAULT_PASSAGES };
