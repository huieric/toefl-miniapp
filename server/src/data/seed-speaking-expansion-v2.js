/**
 * 托福口语题库扩充 - 新增18题
 * 独立题新增9题 + 综合题新增9题
 * 用法: node server/src/data/seed-speaking-expansion-v2.js
 */

const NEW_QUESTIONS = [
  // 独立题 (Independent) - 9题
  {
    title: "Sample S21 — Remote Learning Experience",
    type: "independent",
    content: "Some students prefer to study online, while others prefer to study in a classroom. Which do you prefer and why? Include specific reasons and examples in your explanation.",
    hint: "Focus on comparing the benefits and drawbacks of each approach based on your personal experience.",
    difficulty: "medium",
    source: "speaking-independent",
    answer: "I definitely prefer studying in a classroom. First, face-to-face interaction allows for immediate feedback from both professors and peers. When I encountered difficulties in my physics course, I could ask questions right away during class and receive clarifications. Second, the structured environment of a classroom helps me stay focused and motivated. In an online setting, distractions at home are constant. I would often find myself checking social media or household chores instead of paying attention to the lecture. Finally, classroom learning provides opportunities for collaborative work. Group discussions and projects in class have taught me valuable teamwork skills that I cannot gain from solitary online study. Therefore, the interactive and structured nature of classroom learning makes it my preferred study method."
  },
  {
    title: "Sample S22 — Public Library Usage",
    type: "independent",
    content: "Do you agree or disagree with the following statement? Public libraries should expand their services to provide free computer and internet access for all community members.",
    hint: "Consider both the benefits and potential challenges of this proposal.",
    difficulty: "hard",
    source: "speaking-independent",
    answer: "I strongly agree that public libraries should provide free computer and internet access. First, this promotes digital equality. Not everyone can afford personal computers or internet subscriptions. In today's digital society, access to technology is essential for education, employment, and civic participation. Free library access ensures that everyone has equal opportunities regardless of their economic status. Second, libraries provide guidance and training. Unlike searching the internet alone at home, librarians can help people navigate online resources, teach digital literacy skills, and assist with technical problems. For elderly individuals or those less familiar with technology, this professional support is invaluable. Therefore, expanding library services to include free technology access is both a practical and equitable solution."
  },
  {
    title: "Sample S23 — Summer Work vs Study",
    type: "independent",
    content: "Some university students spend their summer vacation studying courses or taking additional classes, while others prefer to work at a job. Which would you recommend and why?",
    hint: "Discuss the advantages of each option and justify your recommendation.",
    difficulty: "medium",
    source: "speaking-independent",
    answer: "I would recommend that university students work during the summer. While academic study has obvious benefits, working provides practical experience that cannot be learned in a classroom. First, employment helps students develop essential life skills such as time management, teamwork, and problem-solving in real-world contexts. These soft skills are often more valuable to future employers than additional coursework. Second, working allows students to earn money, which can help reduce student loan debt or fund future education. Financial independence is a valuable experience that prepares students for adult life. Third, professional experience helps students make informed career decisions. By working in a field, they can discover whether it truly interests them before investing years in specialized study. Therefore, summer employment offers more comprehensive benefits than additional academic study."
  },
  {
    title: "Sample S24 — City Parks Investment",
    type: "independent",
    content: "Some cities invest large amounts of money in building public parks and green spaces. Others believe this money should be spent on infrastructure projects like roads and bridges. Which view do you agree with?",
    hint: "Consider the economic, social, and environmental impacts of each investment priority.",
    difficulty: "hard",
    source: "speaking-independent",
    answer: "I believe cities should prioritize investment in public parks over infrastructure projects, at least to some extent. While roads and bridges are undeniably important for transportation, parks provide unique benefits that infrastructure cannot match. First, parks significantly improve public health. They offer spaces for exercise, recreation, and relaxation, which reduces stress and promotes physical activity. In densely populated urban areas, green spaces are essential for residents' mental and physical wellbeing. Second, parks contribute to environmental sustainability. Trees and vegetation help reduce air pollution, manage stormwater, and mitigate the urban heat island effect. Many cities are experiencing extreme heat, and parks provide crucial cooling relief. Third, parks boost local economies. Well-maintained parks attract visitors, support nearby businesses, and increase property values. Therefore, while infrastructure is necessary, parks offer irreplaceable social, environmental, and economic benefits that justify significant investment."
  },
  {
    title: "Sample S25 — University Sports Funding",
    type: "independent",
    content: "Some universities spend millions of dollars on athletic programs and sports facilities, while others believe this money should be redirected to academic programs. What is your opinion?",
    hint: "Weigh the value of athletics against academic investment.",
    difficulty: "medium",
    source: "speaking-independent",
    answer: "I believe universities should continue to invest in athletic programs, but within reasonable limits. Sports programs serve important functions that extend beyond entertainment. First, athletics create school spirit and community engagement. Sports events bring together students, alumni, and local residents, fostering a sense of belonging and institutional pride. This community building has social value that cannot be measured in academic terms. Second, athletic scholarships provide educational opportunities for talented students who might not otherwise afford higher education. These student-athletes contribute diverse perspectives to campus life. However, I do believe that the scale of spending should be balanced. Universities should ensure that athletic budgets do not overshadow core academic missions. The ideal approach is to maintain competitive sports programs while also making substantial investments in academics. This balance ensures that universities fulfill both their educational and community-building responsibilities."
  },
  {
    title: "Sample S26 — Single-School vs Multi-School Education",
    type: "independent",
    content: "Do you prefer attending a large comprehensive university or a small liberal arts college? Explain your choice with reasons and examples.",
    hint: "Compare the distinctive features of each type of institution.",
    difficulty: "medium",
    source: "speaking-independent",
    answer: "I would prefer attending a large comprehensive university for several reasons. First, large universities offer broader academic choices and specialized programs that small colleges simply cannot match. I can explore multiple disciplines, switch majors easily, and take advantage of diverse research opportunities. For instance, a comprehensive university might have dedicated departments in physics, biology, computer science, and engineering, allowing me to pursue interdisciplinary interests. Second, large universities typically have more extensive resources, including libraries, laboratories, and career services. They also maintain stronger connections with industries and alumni networks, which benefits students seeking internships and jobs. Finally, the diverse student population at large universities exposes me to people from different backgrounds, cultures, and viewpoints. This diversity prepares me for a globalized workforce. While small colleges offer more personalized attention, I value the breadth of opportunities and resources that a large university provides."
  },
  {
    title: "Sample S27 — Government Arts Funding",
    type: "independent",
    content: "Some people believe that governments should fund the arts, including museums, galleries, and theaters. Others believe that such funding should come from private sources. What is your opinion?",
    hint: "Consider the role of arts in society and who should support them.",
    difficulty: "hard",
    source: "speaking-independent",
    answer: "I believe governments should play a significant role in funding the arts. While private contributions are valuable, they are insufficient to sustain a vibrant cultural ecosystem. First, arts are a public good that benefits society as a whole, not just individual patrons. Museums educate the public, theaters preserve cultural heritage, and galleries promote creative expression. These contributions to public knowledge and cultural identity justify government support, similar to funding for public education. Second, without government funding, the arts would become accessible only to wealthy individuals who can afford private donations or ticket prices. Public funding ensures that artistic experiences remain democratic and available to people of all socioeconomic backgrounds. Third, governments are better positioned to support less commercially viable but culturally significant arts, such as traditional crafts, experimental performance, and community-based projects. Private donors tend to favor popular or established forms. Therefore, government arts funding is essential for maintaining cultural diversity, accessibility, and national identity."
  },
  {
    title: "Sample S28 — Online News vs Traditional News",
    type: "independent",
    content: "More people now get their news from online sources rather than traditional newspapers or television. Do you think this is a positive or negative development?",
    hint: "Discuss both the advantages and disadvantages of this shift.",
    difficulty: "medium",
    source: "speaking-independent",
    answer: "I think this trend has more positive than negative aspects. The shift toward online news brings several significant advantages. First, online sources provide immediacy that traditional media cannot match. Breaking news is available within seconds, keeping the public informed in real-time. This speed is crucial during emergencies or developing situations. Second, online news offers unprecedented access to diverse perspectives. Readers can compare coverage from multiple sources, including international outlets, gaining a more comprehensive understanding of global events. Third, digital platforms allow for interactive engagement. Readers can comment, share, and discuss news, creating a more participatory information ecosystem. However, I acknowledge concerns about misinformation and echo chambers. Nevertheless, these challenges can be addressed through digital literacy education and fact-checking initiatives. Overall, the democratization of information and increased accessibility make the shift to online news predominantly positive."
  },
  {
    title: "Sample S29 — Standardized Testing",
    type: "independent",
    content: "Some argue that standardized tests like the SAT and ACT are the best measure of student ability. Others believe they do not accurately reflect a student's potential. Which view do you support?",
    hint: "Consider both the strengths and limitations of standardized testing.",
    difficulty: "hard",
    source: "speaking-independent",
    answer: "I believe standardized tests have significant limitations and do not accurately reflect a student's full potential. While they provide an objective, comparable metric across different educational systems, they measure only a narrow range of skills. Standardized tests primarily assess test-taking abilities, memorization, and logical reasoning, but they fail to evaluate creativity, critical thinking, emotional intelligence, and practical problem-solving skills — all of which are crucial for success in higher education and life. Furthermore, test performance is strongly correlated with socioeconomic factors. Students from wealthier backgrounds can afford test preparation courses, tutors, and multiple test attempts, giving them an unfair advantage. This biases the results against students from less privileged backgrounds who may have equal or greater intellectual capacity. A holistic admissions process that considers grades, essays, extracurricular activities, and teacher recommendations provides a much more accurate and fair assessment of a student's abilities and potential."
  },
  // 综合题 (Integrated) - 9题
  {
    title: "Sample I11 — Flipped Classroom Model",
    type: "integrated",
    content: "The reading passage argues that the flipped classroom model is superior to traditional teaching because students learn new material at home and participate in class activities. The professor, however, raises several concerns. Summarize the problems the professor mentions with the flipped classroom approach.",
    hint: "Focus on the professor's arguments against the reading passage's claims.",
    difficulty: "hard",
    source: "speaking-integrated",
    reading_summary: "The reading argues that flipped classrooms improve learning by allowing students to study new material at their own pace through video lectures, while class time is used for interactive activities and problem-solving.",
    lecture_summary: "The professor argues that the flipped model requires students to have reliable technology and internet access at home, which creates equity issues. She notes that many students lack adequate study environments and tend to postpone video lectures until the last minute, resulting in superficial engagement with the material. Finally, she points out that interactive activities require significant preparation from teachers, which many are unwilling or unable to provide.",
    answer: "The reading passage promotes the flipped classroom model, arguing that it allows students to learn new material at their own pace through video lectures while using class time for interactive learning. However, the professor challenges this view by presenting three major problems. First, the professor points out that the flipped model assumes all students have access to reliable technology and internet at home, which is not true for many families. This creates an equity problem where disadvantaged students fall behind. Second, she argues that students often procrastinate on watching video lectures and rush through them immediately before class, which defeats the purpose of pre-class preparation. Without proper self-discipline, students cannot benefit from the self-paced aspect. Third, the professor notes that creating effective interactive classroom activities requires considerable time and effort from teachers, and many educators are not willing or trained to redesign their courses in this way. Therefore, the practical challenges of the flipped classroom may outweigh its theoretical benefits."
  },
  {
    title: "Sample I12 — Vertical Farming",
    type: "integrated",
    content: "The reading passage describes the benefits of vertical farming as a solution to food production challenges. The professor casts doubt on this approach. Summarize the points the professor makes to cast doubt on the benefits of vertical farming.",
    hint: "Identify the specific challenges the professor raises about vertical farming.",
    difficulty: "hard",
    source: "speaking-integrated",
    reading_summary: "The reading passage argues that vertical farming can solve food supply problems by growing crops in stacked layers indoors, using significantly less water and land than traditional farming while being unaffected by weather conditions.",
    lecture_summary: "The professor argues that vertical farming is prohibitively expensive due to high energy costs for artificial lighting and climate control. She explains that it can only grow leafy greens and herbs, not staple crops like wheat, rice, and corn that feed most of the world's population. She also notes that the technology is still experimental and unproven at commercial scale.",
    answer: "The reading passage presents vertical farming as a promising solution to global food supply challenges, claiming it uses less water and land than traditional agriculture and is immune to weather disruptions. The professor, however, raises three critical concerns that undermine these claims. First, the professor argues that vertical farming requires enormous amounts of energy for artificial lighting and climate control, making it prohibitively expensive to operate. The high energy costs would make food produced through this method unaffordable for most consumers. Second, she points out that vertical farming is currently limited to growing leafy vegetables and herbs. It cannot produce staple crops like wheat, rice, corn, and potatoes, which provide the majority of calories consumed worldwide. Therefore, even if vertical farming succeeded, it would only address a small fraction of global food needs. Third, the professor notes that the technology remains experimental and untested at large commercial scales. There is no guarantee that it can be implemented profitably in the future. These practical limitations make vertical farming an unrealistic solution to food security challenges."
  },
  {
    title: "Sample I13 — Ocean Acidification",
    type: "integrated",
    content: "The reading passage discusses the effects of ocean acidification on marine life, particularly coral reefs. The professor discusses this topic from a different perspective. Summarize the points the professor makes about the effects of ocean acidification.",
    hint: "Focus on how the professor's evidence relates to or challenges the reading passage.",
    difficulty: "hard",
    source: "speaking-integrated",
    reading_summary: "The reading passage explains that carbon dioxide emissions cause ocean acidification, which reduces the availability of carbonate ions that marine organisms need to build shells and skeletons, threatening coral reefs and other marine ecosystems.",
    lecture_summary: "The professor adds that some marine species are adapting to acidification faster than predicted, with some corals actually showing increased growth rates. She also notes that ocean acidification affects different regions at different rates, and some areas may serve as refuges for marine life. Finally, she mentions that nutrient pollution and overfishing are also major threats that compound the effects of acidification.",
    answer: "The reading passage explains that ocean acidification, caused by increased carbon dioxide absorption, reduces carbonate ion availability and threatens marine organisms that build shells and skeletons, with coral reefs being particularly vulnerable. The professor provides a more nuanced perspective with three important points. First, the professor argues that some marine species are adapting to acidification more quickly than scientists predicted. She cites research showing certain coral species actually increasing their growth rates in more acidic conditions, suggesting some resilience that the reading overlooks. Second, she explains that ocean acidification does not affect all regions equally. Some areas, particularly those with natural alkaline properties, may serve as refuges where marine life can survive despite global acidification trends. This regional variation means some ecosystems may persist longer than the reading suggests. Third, the professor emphasizes that acidification is only one of several threats to marine ecosystems. Overfishing and nutrient pollution from agricultural runoff create additional stressors that combine with acidification to accelerate ecosystem damage. Therefore, addressing ocean acidification alone would be insufficient to protect marine life without also tackling these other critical threats."
  },
  {
    title: "Sample I14 — Circular Economy",
    type: "integrated",
    content: "The reading passage describes the concept of a circular economy and its environmental benefits. The professor discusses this concept critically. Summarize the points the professor makes about the circular economy.",
    hint: "Note both the practical challenges and the professor's skepticism about implementation.",
    difficulty: "hard",
    source: "speaking-integrated",
    reading_summary: "The reading passage describes a circular economy as an economic system where resources are kept in use for as long as possible through recycling, reuse, and repair, contrasting with the traditional linear economy of make-use-dispose.",
    lecture_summary: "The professor argues that the circular economy is difficult to implement because current infrastructure and consumer habits are designed for linear systems. She also notes that some products are impossible to recycle effectively, and that the transition costs would be enormous for businesses.",
    answer: "The reading passage promotes the circular economy as an environmentally sustainable alternative to the traditional linear economy, where materials are continuously recycled, reused, and repaired rather than discarded. The professor challenges the feasibility of this model by raising several practical obstacles. First, she argues that the current global infrastructure is fundamentally designed for linear consumption. Manufacturing systems, logistics networks, and consumer habits are all optimized for producing and discarding products. Transforming this deeply entrenched system would require enormous investment and would face significant resistance from industries that profit from the current model. Second, the professor points out that not all products can be effectively recycled or reused. Some materials degrade in quality when processed, and certain complex products contain multiple materials that are too difficult and expensive to separate. This technological limitation means that some waste will always be inevitable. Finally, she emphasizes that the transition costs would be devastating for many businesses, particularly small enterprises that lack the capital to retool their operations. Therefore, while the circular economy is an admirable goal, its practical implementation faces enormous economic and technological barriers that the reading ignores."
  },
  {
    title: "Sample I15 — Space Exploration Funding",
    type: "integrated",
    content: "The reading passage argues that funding space exploration is justified because of the technological innovations it produces. The professor casts doubt on this argument. Summarize the points the professor makes.",
    hint: "Focus on the professor's counterarguments about space exploration benefits.",
    difficulty: "hard",
    source: "speaking-integrated",
    reading_summary: "The reading passage argues that government spending on space exploration is justified by the technological spin-offs it generates, including innovations in materials, communications, medicine, and computing that benefit everyday life.",
    lecture_summary: "The professor argues that most technological innovations actually come from military research, not space programs. She also contends that space exploration could be done privately without government funding, and that the number of everyday applications is actually quite small compared to the enormous costs.",
    answer: "The reading passage justifies government spending on space exploration by pointing to the numerous technological innovations it has produced, from advanced materials to medical devices and communication systems. The professor challenges this justification by making three main arguments. First, she argues that the majority of technological spin-offs actually come from military research, not space programs. Many of the technologies cited as products of space exploration, such as satellite communications and advanced materials, were initially developed for military purposes and later adapted for civilian use. Therefore, the space program itself is not the primary driver of innovation. Second, the professor contends that the actual number of everyday applications from space exploration is much smaller than the reading suggests. Most space technologies serve specialized purposes and do not significantly impact ordinary people's lives. The benefits, while real, are disproportionately small compared to the enormous budget of space programs. Third, she suggests that space exploration could be financed through private investment without government spending. With growing commercial interest in space, private companies could fund research and development that serves both scientific and business purposes. Therefore, the reading's argument that government funding is necessary to achieve technological innovation from space exploration is not well-supported."
  },
  {
    title: "Sample I16 — Urban Agriculture",
    type: "integrated",
    content: "The reading passage discusses the potential of urban agriculture to address food security issues in cities. The professor presents several concerns about this approach. Summarize the points the professor raises.",
    hint: "Identify the specific limitations of urban agriculture discussed by the professor.",
    difficulty: "medium",
    source: "speaking-integrated",
    reading_summary: "The reading passage argues that urban agriculture, including rooftop gardens, vertical farms, and community gardens in cities, can help feed growing urban populations, reduce transportation costs, and provide fresh food to areas lacking access to healthy options.",
    lecture_summary: "The professor argues that urban agriculture can only produce a small fraction of city food needs. She notes that soil contamination in urban areas is a serious concern, and that the economic returns from urban farming are generally very low compared to other business investments.",
    answer: "The reading passage promotes urban agriculture as a solution to food security in cities, arguing that rooftop gardens, vertical farms, and community gardens can provide fresh food locally, reduce transportation costs, and improve access to healthy food in urban areas. The professor, however, raises three significant concerns. First, she argues that urban agriculture can only produce a tiny fraction of what cities consume. Even with intensive farming methods, the limited space available in urban areas cannot generate enough food to feed millions of residents. Most urban agriculture would be symbolic rather than substantive. Second, the professor points out that soil contamination is a serious problem in urban environments. Industrial pollution, vehicle emissions, and other urban hazards have contaminated much urban soil, making it unsafe to grow food without extensive and expensive remediation. This safety concern undermines the health benefits that the reading emphasizes. Third, she notes that urban farming is generally not economically viable. The costs of land, labor, and infrastructure in cities far exceed the value of the food produced. Without substantial subsidies, most urban farming projects would fail financially. Therefore, while urban agriculture may provide community and educational benefits, it cannot serve as a serious solution to urban food security."
  },
  {
    title: "Sample I17 — Digital Currency",
    type: "integrated",
    content: "The reading passage discusses the advantages of digital currency over traditional money. The professor raises concerns about this transition. Summarize the professor's points.",
    hint: "Focus on the specific risks and challenges the professor identifies.",
    difficulty: "hard",
    source: "speaking-integrated",
    reading_summary: "The reading passage argues that digital currency offers significant advantages over physical money, including faster transactions, lower costs, greater convenience, and improved tracking that could reduce tax evasion and criminal activity.",
    lecture_summary: "The professor argues that digital currency threatens privacy by creating detailed records of every transaction. She also notes that digital systems are vulnerable to hacking and technical failures, and that the transition would exclude people without access to digital technology.",
    answer: "The reading passage presents digital currency as a superior alternative to physical money, emphasizing its faster transaction speeds, lower costs, convenience, and ability to track financial activity that could reduce illegal activities. The professor challenges this view by highlighting three major problems. First, she argues that digital currency fundamentally threatens personal privacy. Every transaction would be recorded in detail, creating comprehensive records of individuals' financial behavior. This surveillance capability could be abused by governments or corporations to monitor and control citizens' activities. Unlike cash, which allows anonymous transactions, digital currency eliminates the right to financial privacy. Second, the professor points out that digital payment systems are highly vulnerable to security threats. Hacking, cybercrime, and technical failures could result in massive financial losses. While physical currency can be lost or stolen, the potential consequences of a digital system compromise are far greater, affecting millions of people simultaneously. Third, she emphasizes that transitioning to digital currency would exclude populations without access to digital technology. Elderly people, low-income individuals, and residents of rural areas may lack the devices or internet connections necessary to use digital currency. This would create a new form of financial exclusion that worsens existing inequality. Therefore, the professor believes these privacy, security, and accessibility concerns outweigh the convenience benefits of digital currency."
  },
  {
    title: "Sample I18 — Early College Specialization",
    type: "integrated",
    content: "The reading passage argues that college students should choose their majors early. The professor disagrees. Summarize the points the professor makes to cast doubt on the reading passage.",
    hint: "Note the professor's arguments about the benefits of exploring broadly.",
    difficulty: "medium",
    source: "speaking-integrated",
    reading_summary: "The reading passage argues that college students should declare their majors in their first year, because early specialization allows them to focus their studies, complete degree requirements on time, and gain deeper expertise in their field of interest.",
    lecture_summary: "The professor argues that students are often too young to make informed career decisions at age 18. She notes that many students discover new interests in college that they had not previously considered, and that early specialization can limit future career flexibility.",
    answer: "The reading passage argues that students should declare their college majors early, claiming that this allows for focused study, timely degree completion, and deeper expertise in a chosen field. The professor strongly disagrees, presenting three arguments against early specialization. First, she argues that eighteen-year-old students are simply too young to make such important career decisions with confidence. Many students have limited exposure to different fields and base their choices on incomplete information. The professor notes that students who explore various disciplines in their first year are better equipped to make informed decisions about their academic direction. Second, she points out that college is precisely the time when students should discover new intellectual passions. Many students enter college with predetermined goals but discover entirely new interests through exposure to different subjects. Early specialization would prevent this valuable exploration and potentially cause students to miss fields they would genuinely excel in and enjoy. Third, the professor argues that early specialization can reduce future career flexibility. The job market changes rapidly, and students who limit their education to one narrow field may find their skills become obsolete. Students who maintain broader intellectual horizons are better positioned to adapt to changing economic conditions. Therefore, the professor believes that flexibility and exploration should be prioritized over early specialization."
  },
  {
    title: "Sample I19 — Social Media and Mental Health",
    type: "integrated",
    content: "The reading passage discusses the positive effects of social media on mental health awareness. The professor raises counterarguments. Summarize the professor's points.",
    hint: "Identify the negative effects of social media that the professor emphasizes.",
    difficulty: "hard",
    source: "speaking-integrated",
    reading_summary: "The reading passage argues that social media platforms have positively impacted mental health awareness by providing communities for people with shared experiences, reducing stigma around psychological conditions, and making mental health resources more accessible to those who need them.",
    lecture_summary: "The professor argues that social media actually exacerbates mental health problems by promoting comparison culture and unrealistic expectations. She also notes that online interactions lack the depth of face-to-face relationships and that the addictive design of social media platforms can worsen anxiety and depression.",
    answer: "The reading passage claims that social media improves mental health by creating supportive communities, reducing stigma, and increasing access to mental health resources. The professor challenges these claims by presenting three counterarguments. First, she argues that social media actually worsens mental health by promoting constant social comparison. Users constantly view carefully curated highlights of others' lives, creating unrealistic expectations and feelings of inadequacy. This comparison culture is particularly harmful to young people, who are more vulnerable to developing body image issues, anxiety, and depression as a result. Second, the professor points out that online interactions, while numerous, are generally shallower than face-to-face relationships. Social media creates an illusion of connection without the emotional depth and support that comes from in-person relationships. This substitution of digital for real-world interaction can increase feelings of loneliness and isolation, contradicting the reading's claim that social media provides genuine community support. Third, she emphasizes that social media platforms are specifically designed to be addictive, using algorithms that maximize user engagement through emotionally charged content. This addictive design creates compulsive usage patterns that can significantly worsen anxiety and depression, particularly among teenagers who spend excessive time on these platforms. Therefore, the professor concludes that the harms of social media to mental health far outweigh any potential benefits."
  },
];

// Helper function
function generateQuestionTitle(title, type) {
  return title;
}

function main() {
  console.log('New speaking questions to insert:', NEW_QUESTIONS.length);
  NEW_QUESTIONS.forEach((q, i) => {
    console.log(`  ${i+1}. ${q.title} (${q.type}, ${q.difficulty})`);
  });
}

main();

module.exports = { NEW_QUESTIONS, generateQuestionTitle };
