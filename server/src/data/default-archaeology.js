/**
 * 托福阅读题库 - 考古学篇章
 */

const PASSAGES = [
  // ============================================
  // ARCHAEOLOGY — The Mystery of the Ancestral Puebloans
  // ============================================
  {
    passage_id: "arch-archaeology-001",
    title: "The Mystery of the Ancestral Puebloans' Departure from Mesa Verde",
    subject: "reading",
    difficulty: "hard",
    source: "arch-archaeology",
    passage_text: `The Ancestral Puebloans, formerly known as the Anasazi, were a sophisticated Native American civilization that flourished in the southwestern United States from approximately 100 to 1600 CE. Their most impressive architectural achievement is the cliff dwellings at Mesa Verde in present-day Colorado, built between 1190 and 1260 CE. These multi-story structures, carved into the faces of towering sandstone cliffs, housed hundreds of people and included hundreds of rooms, kivas (ceremonial chambers), and sophisticated water management systems.\n\nAt its peak around 1200 CE, Mesa Verde supported an estimated 22,000 people across the region, with the cliff dwellings themselves containing approximately 150 rooms and accommodating several hundred residents. The construction was remarkably sophisticated, using wooden beams quarried from mountaintops nearly 20 kilometers away and stone mortar made from local materials. Archaeologists have identified over 4,000 archaeological sites in the Mesa Verde region, including some of the best-preserved cliff dwellings in North America.\n\nHowever, between 1270 and 1300 CE, the Ancestral Puebloans abandoned Mesa Verde and most other settlements in the Four Corners region in one of the most significant population migrations in North American history. For over a century, archaeologists puzzled over this abrupt departure, proposing various theories ranging from invasion by hostile tribes to catastrophic drought.\n\nModern archaeological evidence has largely ruled out the invasion theory. Archaeological excavations have revealed no evidence of widespread violence or battle—no mass graves, no fortifications, and very few weapons. Instead, the evidence points to environmental factors combined with social pressures. Tree-ring studies (dendrochronology) have shown that the region experienced a series of severe droughts between 1276 and 1299, known as the Great Drought. This coincided with declining agricultural productivity, as the Puebloans were already struggling with deforestation and soil depletion from centuries of intensive farming.\n\nPerhaps the most compelling evidence comes from isotopic analysis of human remains. Studies of tooth enamel have revealed that the diet of the Mesa Verde population shifted significantly in the decades before the abandonment, with increased consumption of maize varieties that require more water. This suggests that the population was under increasing stress and was experimenting with different agricultural strategies before finally deciding to leave. Additionally, archaeological evidence shows that the departure was not chaotic but carefully planned—the structures were left in remarkably orderly conditions, with tools and pottery deliberately broken or placed in specific locations, as if preparing for a return that never came.\n\nThe abandoned Puebloans migrated south to the Rio Grande valley and the Hopi and Zuni areas of present-day New Mexico and Arizona. Linguistic and cultural evidence strongly suggests that modern Pueblo peoples, including the Hopi, Zuni, and Rio Grande Pueblos, are direct descendants of the Ancestral Puebloans. Today, these descendant communities continue to maintain cultural traditions that connect them to their ancestors who once inhabited the magnificent cliff dwellings of Mesa Verde.`,

    questions: [
      {
        content: "What is the main purpose of the passage?",
        order: 1, type: "detail", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "To describe the architectural achievements of the Ancestral Puebloans" },
          { label: "B", text: "To explain the reasons behind the Ancestral Puebloans' abandonment of Mesa Verde" },
          { label: "C", text: "To compare different theories about Native American migrations" },
          { label: "D", text: "To argue that climate change was the sole cause of civilization collapse" }
        ]),
        answer: "B",
        analysis: "文章核心：解释阿纳萨齐人为何放弃梅萨维德遗址，包括环境因素（干旱/森林砍伐）和社会压力，以及他们的迁徙去向。"
      },
      {
        content: "According to the passage, what evidence rules out the invasion theory for the abandonment of Mesa Verde?",
        order: 2, type: "detail", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "Ancient written records describing peaceful conditions" },
          { label: "B", text: "Archaeological findings showing no evidence of widespread violence or fortifications" },
          { label: "C", text: "Linguistic evidence from descendant communities" },
          { label: "D", text: "Tree-ring studies showing stable weather patterns" }
        ]),
        answer: "B",
        analysis: "考古发掘未发现大规模暴力证据——没有集体墓葬、没有防御工事、几乎没有武器，这排除了入侵理论。"
      },
      {
        content: "What does the passage suggest about the departure of the Ancestral Puebloans from Mesa Verde?",
        order: 3, type: "inference", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "It was a chaotic and unplanned evacuation" },
          { label: "B", text: "It was carefully planned and orderly" },
          { label: "C", text: "It was forced by an immediate military threat" },
          { label: "D", text: "It happened over a period of several centuries" }
        ]),
        answer: "B",
        analysis: "文章提到结构物以有序状态遗留，工具和陶器被故意破坏或放置在特定位置，说明离开是精心规划的。"
      },
      {
        content: "What has isotopic analysis of human remains revealed about the Mesa Verde population?",
        order: 4, type: "detail", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "The population was suffering from malnutrition" },
          { label: "B", text: "The diet shifted toward maize varieties requiring more water, indicating stress" },
          { label: "C", text: "The population was consuming more meat than previously thought" },
          { label: "D", text: "There was no significant change in diet before the abandonment" }
        ]),
        answer: "B",
        analysis: "牙齿釉质的同位素分析显示，在放弃前的几十年里，饮食发生了显著变化，增加了对需水量更大的玉米品种的消耗，表明人口承受着日益增加的压力。"
      },
      {
        content: "According to the passage, what was the Great Drought?",
        order: 5, type: "detail", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "A period of extreme flooding in the Four Corners region" },
          { label: "B", text: "A series of severe droughts between 1276 and 1299" },
          { label: "C", text: "A volcanic eruption that covered the region in ash" },
          { label: "D", text: "A period of rapid population growth" }
        ]),
        answer: "B",
        analysis: "树木年轮研究显示，该地区在1276年至1299年间经历了多次严重干旱，被称为大干旱。"
      },
      {
        content: "What modern communities are believed to be descendants of the Ancestral Puebloans?",
        order: 6, type: "detail", difficulty: "easy",
        options: JSON.stringify([
          { label: "A", text: "The Navajo and Apache peoples" },
          { label: "B", text: "Modern Pueblo peoples, including the Hopi, Zuni, and Rio Grande Pueblos" },
          { label: "C", text: "The Cherokee and Creek peoples of the southeastern United States" },
          { label: "D", text: "The Sioux and Cheyenne peoples of the Great Plains" }
        ]),
        answer: "B",
        analysis: "语言和文化证据强烈表明，现代普韦布洛人，包括霍皮人、祖尼人和里奥格兰德普韦布洛人，是阿纳萨齐人的直系后裔。"
      }
    ]
  }
];

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PASSAGES };
}
