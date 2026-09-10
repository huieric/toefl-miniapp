/**
 * 托福阅读题库 - 经济学篇章
 * 
 * 用法: node server/src/data/seed-economics.js
 */

const PASSAGES = [
  {
    passage_id: "eco-economics-001",
    title: "The Theory of Comparative Advantage and International Trade",
    subject: "reading",
    difficulty: "hard",
    source: "eco-economics",
    passage_text: "The theory of comparative advantage, first articulated by David Ricardo in 1817, remains one of the most important and counterintuitive concepts in economics. It demonstrates that even when one country can produce every good more efficiently than another, both countries can still benefit from trade by specializing in the goods for which they have a comparative advantage.\n\nThe key insight is that what matters for trade is not absolute advantage -- the ability to produce a good using fewer resources than someone else -- but comparative advantage, which is determined by opportunity cost. A country has a comparative advantage in producing a good if it can produce that good at a lower opportunity cost than other countries. Opportunity cost refers to what must be given up to produce something; in this context, it means the quantity of one good that must be sacrificed to produce one additional unit of another good.\n\nTo illustrate this principle, consider a simplified example with two countries and two goods. Suppose Country A can produce either 100 units of wheat or 50 units of cloth with the same amount of resources, while Country B can produce either 60 units of wheat or 60 units of cloth. Country A has an absolute advantage in both goods, requiring fewer resources per unit. However, the opportunity costs reveal a different picture. In Country A, producing one unit of cloth costs two units of wheat (since 100 wheat = 50 cloth). In Country B, producing one unit of cloth costs only one unit of wheat (since 60 wheat = 60 cloth). Therefore, Country B has a comparative advantage in cloth production.\n\nConversely, Country A has a comparative advantage in wheat production. In Country A, producing one unit of wheat costs only one-half unit of cloth. In Country B, producing one unit of wheat costs one unit of cloth. When each country specializes in its comparative advantage good and trades with the other, both can consume more than if they were self-sufficient.\n\nCritics of free trade have challenged the theory of comparative advantage on several grounds. Some argue that it leads to over-specialization in certain industries, leaving economies vulnerable to external shocks. Others contend that the theory assumes constant costs and perfect competition, conditions that rarely exist in the real world. Despite these criticisms, the theory of comparative advantage has withstood the test of time and continues to provide the fundamental justification for international trade.\n\nModern economists have extended Ricardo's original insight to explain patterns of trade in more complex economies. Factors such as differences in technology, natural resources, labor skills, and capital availability all contribute to comparative advantage. Furthermore, the theory helps explain why countries with similar economic structures, such as the United States and Germany, still engage in substantial trade by exchanging differentiated products within the same industries -- a phenomenon known as intra-industry trade.\n\nThe implications of comparative advantage extend beyond international trade to regional economics within countries. Just as nations benefit from specializing according to comparative advantage, so do states, cities, and even individual workers. This principle underlies the concept of regional specialization, where certain areas become centers for particular industries based on their unique advantages. Understanding comparative advantage is therefore essential for policymakers seeking to promote economic growth and efficient resource allocation.\n\nHowever, the benefits of specialization and trade are not evenly distributed. While the nation as a whole gains from trade, certain groups within the country may lose. Workers in industries that face foreign competition may experience job losses or wage reductions. This distributional effect has led to ongoing debates about the appropriate pace of trade liberalization and the need for policies to compensate those adversely affected by trade.",
    questions: [
      {
        content: "What is the main purpose of the passage?",
        order: 1, type: "detail", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "To argue that free trade benefits everyone equally" },
          { label: "B", text: "To explain the theory of comparative advantage and its implications" },
          { label: "C", text: "To criticize David Ricardo's economic theories" },
          { label: "D", text: "To describe the economic systems of the United States and Germany" }
        ]),
        answer: "B",
        analysis: "文章核心：解释比较优势理论及其对国际贸易的影响。"
      },
      {
        content: "According to the passage, what is the difference between absolute advantage and comparative advantage?",
        order: 2, type: "detail", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "Absolute advantage is determined by opportunity cost, while comparative advantage is determined by resource efficiency" },
          { label: "B", text: "Absolute advantage refers to producing more with fewer resources, while comparative advantage is based on lower opportunity cost" },
          { label: "C", text: "Absolute advantage applies to individual workers, while comparative advantage applies to nations" },
          { label: "D", text: "Absolute advantage is a modern concept, while comparative advantage was developed by David Ricardo" }
        ]),
        answer: "B",
        analysis: "第二段明确区分了绝对优势（使用更少资源生产）和比较优势（基于更低的机会成本）。"
      },
      {
        content: "The word 'articulated' in paragraph 1 is closest in meaning to:",
        order: 3, type: "vocabulary", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "criticized" },
          { label: "B", text: "explained" },
          { label: "C", text: "rejected" },
          { label: "D", text: "complicated" }
        ]),
        answer: "B",
        analysis: "articulated在此处意为'阐述、表达'，与explained意思最接近。"
      },
      {
        content: "Why does the author include the example of Country A and Country B in the passage?",
        order: 4, type: "rhetorical", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "To prove that Country A is economically superior to Country B" },
          { label: "B", text: "To illustrate how comparative advantage works with a concrete numerical example" },
          { label: "C", text: "To show that absolute advantage always determines trade patterns" },
          { label: "D", text: "To demonstrate why free trade should be restricted" }
        ]),
        answer: "B",
        analysis: "作者用这个简化例子来具体说明比较优势如何通过机会成本来运作。"
      },
      {
        content: "According to the passage, what is intra-industry trade?",
        order: 5, type: "detail", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "Trade between countries with different economic structures" },
          { label: "B", text: "Trade involving only agricultural products" },
          { label: "C", text: "Trade between countries with similar structures where they exchange differentiated products within the same industries" },
          { label: "D", text: "Trade that is restricted by government policies" }
        ]),
        answer: "C",
        analysis: "第六段说明intra-industry trade指经济结构相似的国家在同一产业内交换差异化产品。"
      },
      {
        content: "The passage suggests that the benefits of international trade are:",
        order: 6, type: "inference", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "Equally distributed among all citizens of trading nations" },
          { label: "B", text: "Nonexistent, as critics correctly point out" },
          { label: "C", text: "Unevenly distributed, with some groups potentially losing" },
          { label: "D", text: "Limited only to developed nations" }
        ]),
        answer: "C",
        analysis: "最后一段明确指出贸易利益并非平均分配，某些群体可能会受损。"
      }
    ]
  }
];

// Generate unique question titles to avoid unique constraint conflicts
function generateQuestionTitle(question, passageTitle) {
  const shortTitle = passageTitle.substring(0, 40).replace(/[^\w\s]/g, '');
  return `Q${question.order} - ${shortTitle}`;
}

module.exports = { PASSAGES };
