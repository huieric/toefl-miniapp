/**
 * 托福写作题库扩充 - 新增20题（独立+综合）
 * 
 * 总写作题: 30 + 20 = 50条
 * 
 * 用法: node server/src/data/seed-writing-expansion.js
 */

const QUESTIONS = [
  // ---- Independent Writing (1-10) ----
  {
    title: "Government Funding for Arts",
    content: "Some people believe that government should fund art projects (museums, galleries, opera houses, etc.) even if it means reducing funding for other public services. Others believe government funding for art should only be a low priority when money is limited. Discuss both views and give your own opinion.",
    type: "independent",
    difficulty: "hard",
    source: "writing-expansion",
    wordLimit: 300
  },
  {
    title: "Remote Work",
    content: "Many companies now allow employees to work from home using technology. Do the advantages of this development outweigh the disadvantages? Give reasons for your answer and include any relevant examples from your own knowledge or experience.",
    type: "independent",
    difficulty: "medium",
    source: "writing-expansion",
    wordLimit: 300
  },
  {
    title: "University Entrance Age",
    content: "Some people believe that students should begin university education at a younger age, while others believe they should wait until they are older and have more life experience. Discuss both views and give your own opinion.",
    type: "independent",
    difficulty: "medium",
    source: "writing-expansion",
    wordLimit: 300
  },
  {
    title: "Global Languages",
    content: "Some people believe that learning international languages like English is more important than learning native/local languages. To what extent do you agree or disagree?",
    type: "independent",
    difficulty: "medium",
    source: "writing-expansion",
    wordLimit: 300
  },
  {
    title: "Space Exploration",
    content: "Some people think that spending money on space exploration is a waste of resources that could be better used to solve problems on Earth. Others believe space exploration is essential for the future of humanity. Discuss both views and give your opinion.",
    type: "independent",
    difficulty: "hard",
    source: "writing-expansion",
    wordLimit: 300
  },
  {
    title: "Advertising and Society",
    content: "Some people argue that advertising has a negative impact on society by promoting consumerism and creating unrealistic expectations. Others believe advertising provides essential information and supports media. Discuss both views and give your opinion.",
    type: "independent",
    difficulty: "medium",
    source: "writing-expansion",
    wordLimit: 300
  },
  {
    title: "Physical Education in Schools",
    content: "Some educators believe that physical education should be a mandatory part of the school curriculum, while others think it should be optional. Discuss both views and give your own opinion.",
    type: "independent",
    difficulty: "easy",
    source: "writing-expansion",
    wordLimit: 300
  },
  {
    title: "Genetic Engineering",
    content: "Some people believe that genetic engineering of plants and animals is a beneficial advancement for science and agriculture. Others believe it is unethical and could have dangerous consequences. Discuss both views and give your opinion.",
    type: "independent",
    difficulty: "hard",
    source: "writing-expansion",
    wordLimit: 300
  },
  {
    title: "Life in the Future",
    content: "Some people think that life in the future will be better than life today. Others think that life today will be better than life in the future. Discuss both views and give your opinion.",
    type: "independent",
    difficulty: "easy",
    source: "writing-expansion",
    wordLimit: 300
  },
  {
    title: "International Tourism",
    content: "Some people believe that international tourism has had a positive impact on the world, while others believe it has had negative effects. Discuss both views and give your own opinion.",
    type: "independent",
    difficulty: "medium",
    source: "writing-expansion",
    wordLimit: 300
  },

  // ---- Integrated Writing (11-20) ----
  {
    title: "Integrated - Renewable Energy",
    content: "Read the passage about the benefits of solar energy as a renewable resource. Then listen to a lecture that challenges some of the points made in the reading. Summarize the points made in the lecture, explaining how they cast doubt on specific points in the reading passage.",
    type: "integrated",
    difficulty: "hard",
    source: "writing-expansion",
    wordLimit: 150
  },
  {
    title: "Integrated - Urban Gardening",
    content: "Read the passage arguing that urban community gardens improve city life by providing fresh food, reducing crime, and building community. Then listen to a lecture that presents counterarguments. Summarize the lecture points and explain how they challenge the reading.",
    type: "integrated",
    difficulty: "medium",
    source: "writing-expansion",
    wordLimit: 150
  },
  {
    title: "Integrated - Fourteenth Amendment",
    content: "Read the passage explaining the original intent of the Fourteenth Amendment regarding women's voting rights. Then listen to a lecture presenting a different interpretation. Summarize the lecture and explain how it challenges the reading.",
    type: "integrated",
    difficulty: "hard",
    source: "writing-expansion",
    wordLimit: 150
  },
  {
    title: "Integrated - Animal Intelligence",
    content: "Read the passage about evidence of animal intelligence in primates. Then listen to a lecture challenging these claims. Summarize the lecture points and explain how they cast doubt on the reading.",
    type: "integrated",
    difficulty: "hard",
    source: "writing-expansion",
    wordLimit: 150
  },
  {
    title: "Integrated - Space Tourism",
    content: "Read the passage supporting the development of commercial space tourism. Then listen to a lecture presenting concerns about space tourism. Summarize the lecture and explain how it challenges the reading passage.",
    type: "integrated",
    difficulty: "medium",
    source: "writing-expansion",
    wordLimit: 150
  },
  {
    title: "Integrated - Ocean Conservation",
    content: "Read the passage about establishing marine protected areas. Then listen to a lecture expressing concerns about this approach. Summarize the lecture and explain how it challenges the reading.",
    type: "integrated",
    difficulty: "medium",
    source: "writing-expansion",
    wordLimit: 150
  },
  {
    title: "Integrated - Standardized Testing",
    content: "Read the passage supporting standardized testing as an objective measure of student ability. Then listen to a lecture critiquing standardized testing. Summarize the lecture and explain how it challenges the reading.",
    type: "integrated",
    difficulty: "medium",
    source: "writing-expansion",
    wordLimit: 150
  },
  {
    title: "Integrated - Animal Migration",
    content: "Read the passage about bird migration patterns. Then listen to a lecture presenting alternative explanations for observed migration behavior. Summarize the lecture and explain how it challenges the reading.",
    type: "integrated",
    difficulty: "hard",
    source: "writing-expansion",
    wordLimit: 150
  },
  {
    title: "Integrated - Economic Systems",
    content: "Read the passage comparing capitalism and socialism. Then listen to a lecture challenging the advantages of capitalism presented in the reading. Summarize the lecture and explain how it challenges the reading.",
    type: "integrated",
    difficulty: "hard",
    source: "writing-expansion",
    wordLimit: 150
  },
  {
    title: "Integrated - Ancient Civilizations",
    content: "Read the passage about theories of why the Mayan civilization declined. Then listen to a lecture that challenges one of the theories presented in the reading. Summarize the lecture and explain how it challenges the reading.",
    type: "integrated",
    difficulty: "hard",
    source: "writing-expansion",
    wordLimit: 150
  }
];

module.exports = QUESTIONS;
