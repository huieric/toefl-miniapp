/**
 * 托福口语题库扩充 - 新增20题（综合题+独立题）
 * 
 * 总口语题: 30 + 20 = 50条
 * 
 * 用法: node server/src/data/seed-speaking-expansion.js
 */

const QUESTIONS = [
  // ---- Independent Questions (1-10) ----
  {
    title: "Education Preference",
    content: "Some students prefer to study in a large university with many students and diverse programs. Other students prefer to study in a small college with fewer students and more personalized attention. Which do you prefer and why? Use specific reasons and examples to support your choice.",
    type: "independent",
    difficulty: "medium",
    hint: "Consider factors like class size, resources, social opportunities, and learning environment.",
    source: "speaking-expansion",
    timeLimit: 15
  },
  {
    title: "Technology and Learning",
    content: "Do you agree or disagree with the following statement? Technology has made learning more effective than traditional methods. Use specific reasons and examples to support your answer.",
    type: "independent",
    difficulty: "hard",
    hint: "Think about online learning, educational apps, interactive tools versus textbooks and classroom instruction.",
    source: "speaking-expansion",
    timeLimit: 15
  },
  {
    title: "Travel Experience",
    content: "Some people prefer to travel to unfamiliar places, while others prefer to visit places they have been before. Which do you prefer and why? Use specific reasons and examples to support your choice.",
    type: "independent",
    difficulty: "easy",
    hint: "Consider excitement, comfort, learning opportunities, and personal growth.",
    source: "speaking-expansion",
    timeLimit: 15
  },
  {
    title: "Work and Study Balance",
    content: "Some university students take part-time jobs while studying. Others believe they should focus only on their academic studies. Which view do you agree with? Use specific reasons and examples.",
    type: "independent",
    difficulty: "medium",
    hint: "Consider financial benefits, time management, practical experience versus academic focus.",
    source: "speaking-expansion",
    timeLimit: 15
  },
  {
    title: "Environmental Protection",
    content: "Some people believe that individuals cannot make a significant difference to environmental protection, while others believe individual actions matter. Which view do you agree with? Why? Use specific reasons and examples.",
    type: "independent",
    difficulty: "hard",
    hint: "Consider individual actions like recycling, reducing waste, versus systemic change.",
    source: "speaking-expansion",
    timeLimit: 15
  },
  {
    title: "City vs Country Living",
    content: "Some people prefer to live in a big city, while others prefer to live in a small town or rural area. Which environment would you prefer to live in? Use specific reasons and examples.",
    type: "independent",
    difficulty: "medium",
    hint: "Consider job opportunities, cost of living, social life, nature access, and pace of life.",
    source: "speaking-expansion",
    timeLimit: 15
  },
  {
    title: "Group Work",
    content: "Some students prefer to complete assignments and projects in a group. Others prefer to work alone. Which do you prefer? Use specific reasons and examples to support your choice.",
    type: "independent",
    difficulty: "easy",
    hint: "Consider collaboration benefits, individual focus, accountability, and creativity.",
    source: "speaking-expansion",
    timeLimit: 15
  },
  {
    title: "Arts Education",
    content: "Some people believe that studying art, music, or drama is as important as studying math, science, or technology. Do you agree? Use specific reasons and examples.",
    type: "independent",
    difficulty: "medium",
    hint: "Consider creative skills, emotional development, practical career skills, and holistic education.",
    source: "speaking-expansion",
    timeLimit: 15
  },
  {
    title: "Social Media Impact",
    content: "Some people believe that social media has had a mostly positive impact on society, while others believe it has had a mostly negative impact. Which view do you agree with? Why?",
    type: "independent",
    difficulty: "hard",
    hint: "Consider connectivity, information access, mental health, privacy, and misinformation.",
    source: "speaking-expansion",
    timeLimit: 15
  },
  {
    title: "Early Specialization",
    content: "Some university students choose their major at a young age and focus on it from the beginning. Others prefer to explore different subjects before deciding. Which approach do you prefer and why?",
    type: "independent",
    difficulty: "medium",
    hint: "Consider career clarity, exploration benefits, time efficiency, and flexibility.",
    source: "speaking-expansion",
    timeLimit: 15
  },

  // ---- Integrated Questions (11-20) ----
  {
    title: "Campus Announcement - Library Hours",
    content: "Read the following announcement: The university library will extend its opening hours during exam periods. The library will now be open from 7 AM to midnight Sunday through Thursday, and 24 hours on Friday and Saturday nights. This change will help students have more study space and reduce crowding during peak hours. Now listen to a conversation between two students discussing this announcement. What are their opinions about the change and why?",
    type: "integrated",
    difficulty: "medium",
    hint: "Focus on the students' attitudes (agree/disagree) and their specific reasons.",
    source: "speaking-expansion",
    timeLimit: 20
  },
  {
    title: "University Plan - Textbook Policy",
    content: "Read the university announcement: Starting next semester, the university will provide all required textbooks electronically through its online platform instead of requiring students to purchase physical copies. This will reduce costs and make materials more accessible. Now listen to two students discussing this plan. What are their opinions and why?",
    type: "integrated",
    difficulty: "medium",
    hint: "Listen for specific advantages or concerns mentioned by the students.",
    source: "speaking-expansion",
    timeLimit: 20
  },
  {
    title: "Lecture - Marine Biology",
    content: "The professor discusses how some fish species change their gender during their lifetime. In many fish species, the first fish to hatch is female, but if the female population decreases significantly, some males can change to female to maintain population balance. This adaptation helps the species survive in changing conditions. Summarize the explanation and give an example of how this gender change benefits the fish population.",
    type: "integrated",
    difficulty: "hard",
    hint: "Focus on the mechanism (male-to-female change) and the evolutionary advantage.",
    source: "speaking-expansion",
    timeLimit: 20
  },
  {
    title: "Lecture - Psychology",
    content: "The professor explains the concept of cognitive dissonance. When people hold two conflicting beliefs or when their behavior contradicts their beliefs, they experience psychological discomfort. To reduce this discomfort, they may change their beliefs, change their behavior, or rationalize their actions. For example, a person who knows smoking is harmful but continues to smoke might convince themselves that the risks are exaggerated. Summarize the concept and explain the example.",
    type: "integrated",
    difficulty: "hard",
    hint: "Focus on the definition of cognitive dissonance and the three ways to reduce it.",
    source: "speaking-expansion",
    timeLimit: 20
  },
  {
    title: "Campus Decision - Cafeteria Menu",
    content: "Read the campus announcement: The university cafeteria will introduce a completely plant-based menu for one week each month to promote healthy eating and reduce environmental impact. Students can opt out if they prefer. Now listen to two students discussing this decision. What are their opinions about this plan and why?",
    type: "integrated",
    difficulty: "medium",
    hint: "Listen for specific arguments about health, environment, or student choice.",
    source: "speaking-expansion",
    timeLimit: 20
  },
  {
    title: "Lecture - Archaeology",
    content: "The professor discusses why archaeologists use ground-penetrating radar instead of excavation for discovering ancient sites. Ground-penetrating radar sends electromagnetic waves into the ground and analyzes the reflected signals to create images of underground structures. This method is non-destructive, faster, and can cover larger areas compared to traditional excavation, which requires physically digging and can damage artifacts. Summarize the advantages of this technology.",
    type: "integrated",
    difficulty: "medium",
    hint: "Focus on non-destructive nature, speed, and coverage area advantages.",
    source: "speaking-expansion",
    timeLimit: 20
  },
  {
    title: "Lecture - Business",
    content: "The professor explains the 'blue ocean strategy' in business. Traditional companies compete in 'red oceans' where many competitors fight over limited market share, leading to price wars and low profits. Blue ocean strategy involves creating new market spaces where competition is irrelevant. For example, Cirque du Soleil created a new entertainment form combining theater and circus, attracting a different audience willing to pay premium prices. Summarize this strategy and explain the example.",
    type: "integrated",
    difficulty: "hard",
    hint: "Focus on the contrast between red ocean (competition) and blue ocean (innovation).",
    source: "speaking-expansion",
    timeLimit: 20
  },
  {
    title: "University Policy - Dormitory Roommates",
    content: "Read the university policy change: Starting next year, all first-year students will be assigned roommates based on their academic interests and study habits rather than just randomly. The university believes this will create better living environments and improve academic performance. Now listen to two students discussing this new policy. What are their opinions and why?",
    type: "integrated",
    difficulty: "medium",
    hint: "Listen for arguments about academic benefits versus need for social diversity.",
    source: "speaking-expansion",
    timeLimit: 20
  },
  {
    title: "Lecture - Anthropology",
    content: "The professor discusses the 'cultural lag theory' developed by William F. Ogburn. This theory suggests that material culture (technology, tools, machines) evolves faster than non-material culture (beliefs, values, social norms). As a result, societies often experience social problems because their institutions and beliefs have not caught up with technological changes. For example, social media technology developed rapidly, but society is still struggling to establish appropriate norms for privacy and online behavior. Summarize this theory and explain the example.",
    type: "integrated",
    difficulty: "hard",
    hint: "Focus on the gap between technology and social norms, with the social media example.",
    source: "speaking-expansion",
    timeLimit: 20
  },
  {
    title: "Campus Proposal - Bike Sharing",
    content: "Read the campus proposal: The university plans to introduce a bike-sharing program where students can rent bicycles from stations located around campus. The goal is to reduce traffic congestion, promote healthy exercise, and reduce the campus carbon footprint. Membership will be included in the student activity fee. Now listen to two students discussing this proposal. What are their opinions about this plan and why?",
    type: "integrated",
    difficulty: "medium",
    hint: "Listen for arguments about convenience, health benefits, costs, or infrastructure concerns.",
    source: "speaking-expansion",
    timeLimit: 20
  }
];

module.exports = QUESTIONS;
