/**
 * 托福阅读题库 - 生物学/社会学篇章
 * 
 * 用法: node server/src/data/seed-biology-sociology.js
 */

const PASSAGES = [
  // ============================================
  // BIOLOGY - Symbiosis and Mutualistic Relationships
  // ============================================
  {
    passage_id: "bio-biology-001",
    title: "Symbiosis and Mutualistic Relationships in Nature",
    subject: "reading",
    difficulty: "hard",
    source: "bio-biology",
    passage_text: "Symbiosis refers to close biological interactions between two different species living together. The term encompasses a wide range of relationships, from mutual benefit to outright exploitation. Among these relationships, mutualism -- where both species derive advantages -- has fascinated biologists for centuries because it challenges the notion of nature as purely competitive.\n\nThe most classic example of mutualism is the relationship between flowering plants and their pollinators. Bees, butterflies, hummingbirds, and bats have all evolved specialized mechanisms to collect nectar and pollen from flowers, while simultaneously facilitating the transfer of pollen between plants. This relationship is so specialized that some orchid species can only be pollinated by a single species of moth, and that moth depends entirely on the orchid for its larvae food supply. Such co-evolution has produced remarkable adaptations on both sides.\n\nAnother fascinating mutualistic relationship exists between certain fungi and plant roots, known as mycorrhizae. The fungal hyphae extend far beyond the plant root system, dramatically increasing the surface area available for water and mineral absorption. In return, the plant provides the fungus with carbohydrates produced through photosynthesis. Studies suggest that approximately ninety percent of all terrestrial plant species form mycorrhizal associations, making this one of the most widespread mutualistic relationships in the natural world.\n\nPerhaps the most extreme example of mutualism is found in coral reefs, where zooxanthellae -- microscopic algae -- live inside coral polyps. The algae photosynthesize, providing the coral with up to ninety percent of its energy needs through glucose, glycerol, and amino acids. In return, the coral provides the algae with a protected environment and the compounds they need for photosynthesis. This relationship is so sensitive that even small increases in water temperature can cause corals to expel their zooxanthellae, resulting in the devastating phenomenon known as coral bleaching.\n\nThe study of mutualism has important implications for conservation biology. Many species that appear to survive independently are actually dependent on their mutualistic partners. When one species declines due to habitat loss, pollution, or climate change, its mutualistic partner may also face extinction, creating cascading effects throughout entire ecosystems.",
    questions: [
      {
        content: "What is the main purpose of the first paragraph of the passage?",
        order: 1, type: "detail", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "To argue that competition is the primary force in nature" },
          { label: "B", text: "To define symbiosis and introduce the concept of mutualism as a challenge to competitive views of nature" },
          { label: "C", text: "To describe specific examples of mutualistic relationships" },
          { label: "D", text: "To explain how co-evolution occurs between species" }
        ]),
        answer: "B",
        analysis: "第一段定义共生关系，并提出互利共生挑战了自然界纯竞争的观点。"
      },
      {
        content: "According to the passage, what makes the relationship between certain orchids and moths particularly remarkable?",
        order: 2, type: "detail", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "The orchid can be pollinated by many different species" },
          { label: "B", text: "The moth can survive without the orchid in different environments" },
          { label: "C", text: "The relationship is highly specialized, with each species depending entirely on the other" },
          { label: "D", text: "The relationship has remained unchanged for millions of years" }
        ]),
        answer: "C",
        analysis: "第二段明确指出某些兰花只能由单一蛾种传粉，而这种蛾完全依赖兰花养育幼虫。"
      },
      {
        content: "The word 'widespread' in paragraph 3 is closest in meaning to:",
        order: 3, type: "vocabulary", difficulty: "easy",
        options: JSON.stringify([
          { label: "A", text: "rare and localized" },
          { label: "B", text: "extensively distributed" },
          { label: "C", text: "recently discovered" },
          { label: "D", text: "only found in tropical regions" }
        ]),
        answer: "B",
        analysis: "'Widespread' 意为广泛分布的。文中说约90%的陆生植物都形成菌根关系。"
      },
      {
        content: "What happens when water temperature increases slightly in coral reef ecosystems?",
        order: 4, type: "detail", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "Coral polyps grow faster and produce more zooxanthellae" },
          { label: "B", text: "Zooxanthellae increase photosynthesis and produce more energy" },
          { label: "C", text: "Corals expel their zooxanthellae, causing coral bleaching" },
          { label: "D", text: "The mutualistic relationship becomes stronger" }
        ]),
        answer: "C",
        analysis: "第四段说明水温升高会导致珊瑚排出虫黄藻，造成珊瑚白化。"
      },
      {
        content: "What does the passage suggest about the conservation implications of studying mutualism?",
        order: 5, type: "inference", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "Conservation efforts should focus only on individually endangered species" },
          { label: "B", text: "Protecting one species may be insufficient if its mutualistic partner is threatened" },
          { label: "C", text: "Mutualistic relationships are too fragile to be preserved" },
          { label: "D", text: "Conservation biology does not need to consider species interactions" }
        ]),
        answer: "B",
        analysis: "最后一段指出保护一个物种是不够的，还需要保护其互利共生伙伴，否则会产生连锁灭绝效应。"
      },
      {
        content: "Which of the following best summarizes the main idea of the passage?",
        order: 6, type: "summary", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "Coral reefs are the most important example of mutualism in nature" },
          { label: "B", text: "Mutualism is a rare phenomenon that occurs only in specific ecosystems" },
          { label: "C", text: "Mutualistic relationships are diverse, widespread, and ecologically critical, with important conservation implications" },
          { label: "D", text: "Competition is more important than mutualism in determining species survival" }
        ]),
        answer: "C",
        analysis: "文章核心：互利共生关系多样化、广泛分布且生态重要，具有深远保护意义。"
      }
    ]
  },

  // ============================================
  // SOCIOLOGY - Urbanization and Social Change
  // ============================================
  {
    passage_id: "soc-sociology-001",
    title: "Urbanization and Its Impact on Traditional Communities",
    subject: "reading",
    difficulty: "medium",
    source: "soc-sociology",
    passage_text: "Urbanization -- the migration of people from rural to urban areas -- has been one of the most significant demographic transformations in human history. Over the past two centuries, the global urban population has grown from approximately two percent in 1800 to nearly fifty-five percent today. This massive demographic shift has profoundly transformed not only the physical landscape but also social structures, cultural practices, and economic systems across the world.\n\nSociologists have identified several key factors driving urbanization. The industrial revolution of the eighteenth and nineteenth centuries created unprecedented demand for factory labor in cities. Agricultural mechanization reduced the need for rural workers, while urban centers offered higher wages, better education, and improved healthcare. In developing countries today, rural poverty and limited economic opportunities continue to drive mass migration to urban areas, often resulting in the growth of informal settlements and slums.\n\nThe social consequences of rapid urbanization are complex and multifaceted. On one hand, cities concentrate economic opportunity, cultural diversity, and innovation. They serve as centers of education, healthcare, and technological advancement. Urban dwellers generally have higher incomes and better access to services than their rural counterparts. Cities also tend to be more tolerant of diverse lifestyles and ethnic groups, fostering greater social mixing.\n\nOn the other hand, rapid urbanization often strains existing infrastructure and social services. Many rapidly growing cities face severe housing shortages, inadequate public transportation, environmental pollution, and rising inequality. The breakdown of traditional community structures can lead to social isolation, crime, and mental health problems. Sociologist Louis Wirth argued in 1938 that the sheer size, density, and heterogeneity of urban populations fundamentally alter the character of human interaction, creating what he termed 'urbanism as a way of life' -- a more impersonal, transient, and utilitarian social relationship compared to rural communities.\n\nDespite these challenges, urbanization is an irreversible trend. The future lies in sustainable urban planning that preserves social cohesion while accommodating growth. Cities that invest in affordable housing, public transportation, green spaces, and community facilities are better positioned to create inclusive, resilient urban environments that benefit all residents.",
    questions: [
      {
        content: "According to the passage, what percentage of the global population lived in urban areas around the year 1800?",
        order: 1, type: "detail", difficulty: "easy",
        options: JSON.stringify([
          { label: "A", text: "About ten percent" },
          { label: "B", text: "About two percent" },
          { label: "C", text: "About twenty-five percent" },
          { label: "D", text: "About fifty percent" }
        ]),
        answer: "B",
        analysis: "第一段明确指出1800年全球城市化率约为百分之二。"
      },
      {
        content: "Which of the following is NOT mentioned as a factor driving urbanization?",
        order: 2, type: "detail", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "Agricultural mechanization reducing rural labor needs" },
          { label: "B", text: "Higher wages in urban centers" },
          { label: "C", text: "Government policies mandating population relocation" },
          { label: "D", text: "Better education and healthcare in cities" }
        ]),
        answer: "C",
        analysis: "第二段提到的因素包括工业革命、农业机械化、更高工资、更好教育和医疗，未提及政府强制迁移政策。"
      },
      {
        content: "The word 'multifaceted' in paragraph 3 is closest in meaning to:",
        order: 3, type: "vocabulary", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "simple and straightforward" },
          { label: "B", text: "having many aspects or dimensions" },
          { label: "C", text: "negative and harmful" },
          { label: "D", text: "easily measured and quantified" }
        ]),
        answer: "B",
        analysis: "'Multifaceted' 意为多方面的、多层次的。文中说城市化的社会后果具有复杂性。"
      },
      {
        content: "What did Louis Wirth argue about urban populations in 1938?",
        order: 4, type: "detail", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "Urban populations are inherently more criminal than rural populations" },
          { label: "B", text: "The size, density, and diversity of cities create a more impersonal way of life" },
          { label: "C", text: "Urban planning should prioritize agricultural development" },
          { label: "D", text: "Traditional rural communities are superior in all social aspects" }
        ]),
        answer: "B",
        analysis: "第四段指出Wirth认为城市人口的数量、密度和多样性从根本上改变了人类互动特征，形成了更非人格化的生活方式。"
      },
      {
        content: "According to the passage, what is considered the key to managing future urbanization?",
        order: 5, type: "inference", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "Preventing rural-to-urban migration entirely" },
          { label: "B", text: "Relocating urban populations back to rural areas" },
          { label: "C", text: "Sustainable urban planning that preserves social cohesion" },
          { label: "D", text: "Focusing only on economic development in cities" }
        ]),
        answer: "C",
        analysis: "最后一段指出未来在于可持续的城市规划，在容纳增长的同时保持社会凝聚力。"
      },
      {
        content: "Which of the following best summarizes the main idea of the passage?",
        order: 6, type: "summary", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "Urbanization is solely a negative phenomenon that destroys traditional communities" },
          { label: "B", text: "Urbanization is a complex demographic transformation with both benefits and challenges that requires sustainable planning" },
          { label: "C", text: "The industrial revolution was the only factor responsible for urbanization" },
          { label: "D", text: "Rural communities are inherently superior to urban environments" }
        ]),
        answer: "B",
        analysis: "文章核心：城市化是复杂的人口转变，既有收益也有挑战，需要可持续规划。"
      }
    ]
  }
];

module.exports = PASSAGES;
