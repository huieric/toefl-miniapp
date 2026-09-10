/**
 * 托福备考助手 — Round 11 听力扩充种子数据
 * 新增 20 题：lecture × 3(各6题) + conversation × 2(各4题)
 * 用法: node scripts/seed-listening-round11.js
 */

const LISTENING_DATA = [
  // ===== LECTURE 1: Biology - Marine Biology (6题) =====
  {
    subject: 'listening', type: 'lecture', difficulty: 'medium',
    title: 'Marine Biology: Coral Reef Ecosystems',
    content: 'What is the main topic of the lecture?',
    options: JSON.stringify([
      { label: 'A', text: 'The geological formation of coral reefs.' },
      { label: 'B', text: 'The symbiotic relationship between coral and algae.' },
      { label: 'C', text: 'The impact of climate change on ocean temperature.' },
      { label: 'D', text: 'The fishing industry in tropical regions.' }
    ]),
    answer: 'B',
    analysis: '讲座主要讨论珊瑚与藻类之间的共生关系，这是珊瑚礁生态系统维持的关键机制。',
    passage_text: '[Professor]: Coral reefs are among the most biodiverse ecosystems on Earth. Despite covering less than one percent of the ocean floor, they support approximately twenty-five percent of all marine species. But here is the remarkable part — coral itself is actually an animal, a colony of tiny creatures called polyps. These polyps have a symbiotic relationship with microscopic algae called zooxanthellae.\n\nThe algae live inside the coral tissue and perform photosynthesis, producing oxygen and helping the coral remove wastes. More importantly, the algae supply the coral with glucose, glycerol, and amino acids — the products of photosynthesis. The coral, in return, provides the algae with a protected environment and compounds they need for photosynthesis.\n\nThis relationship is so vital that when water temperatures rise too high, the algae are expelled, leading to coral bleaching. Without their algae, corals lose their major source of nutrition and can starve. This bleaching event has been increasingly common due to global warming, threatening reef ecosystems worldwide.',
    source: 'simulated', status: 'approved',
  },
  {
    subject: 'listening', type: 'detail', difficulty: 'easy',
    title: 'Marine Biology: Coral Reef Ecosystems - Q2',
    content: 'What percentage of marine species do coral reefs support?',
    options: JSON.stringify([
      { label: 'A', text: 'About five percent' },
      { label: 'B', text: 'About ten percent' },
      { label: 'C', text: 'About twenty-five percent' },
      { label: 'D', text: 'About fifty percent' }
    ]),
    answer: 'C',
    analysis: '讲座明确指出珊瑚礁虽然只覆盖不到百分之一的海底，却支持约百分之二十五的所有海洋物种。',
    source: 'simulated', status: 'approved',
    passage_id: 'bio-marine-001',
  },
  {
    subject: 'listening', type: 'detail', difficulty: 'easy',
    title: 'Marine Biology: Coral Reef Ecosystems - Q3',
    content: 'What are zooxanthellae?',
    options: JSON.stringify([
      { label: 'A', text: 'A type of coral polyp' },
      { label: 'B', text: 'Microscopic algae living inside coral tissue' },
      { label: 'C', text: 'Marine predators that eat coral' },
      { label: 'D', text: 'A chemical compound in coral skeletons' }
    ]),
    answer: 'B',
    analysis: '讲座说明藻索虫(zooxanthellae)是一种微小的藻类，生活在珊瑚组织内部，通过光合作用为珊瑚提供营养。',
    source: 'simulated', status: 'approved',
    passage_id: 'bio-marine-001',
  },
  {
    subject: 'listening', type: 'inference', difficulty: 'medium',
    title: 'Marine Biology: Coral Reef Ecosystems - Q4',
    content: 'Why does the professor mention global warming?',
    options: JSON.stringify([
      { label: 'A', text: 'To explain how coral reefs were formed.' },
      { label: 'B', text: 'To describe the diversity of marine life.' },
      { label: 'C', text: 'To illustrate a major threat to coral reef survival.' },
      { label: 'D', text: 'To compare tropical and temperate ocean temperatures.' }
    ]),
    answer: 'C',
    analysis: '教授提到全球变暖是为了说明它对珊瑚白化的影响，这是一个威胁珊瑚礁生存的主要威胁。',
    source: 'simulated', status: 'approved',
    passage_id: 'bio-marine-001',
  },
  {
    subject: 'listening', type: 'purpose', difficulty: 'medium',
    title: 'Marine Biology: Coral Reef Ecosystems - Q5',
    content: 'Why does the professor say that "the coral can starve"?',
    options: JSON.stringify([
      { label: 'A', text: 'To emphasize how critical the algae-coral relationship is.' },
      { label: 'B', text: 'To explain why corals are found in shallow water.' },
      { label: 'C', text: 'To compare coral feeding to human hunger.' },
      { label: 'D', text: 'To suggest corals should be fed by humans.' }
    ]),
    answer: 'A',
    analysis: '教授说珊瑚会"饿死"是为了强调藻类和珊瑚之间共生关系的重要性，失去了藻类就等于失去了主要营养来源。',
    source: 'simulated', status: 'approved',
    passage_id: 'bio-marine-001',
  },
  {
    subject: 'listening', type: 'negative', difficulty: 'hard',
    title: 'Marine Biology: Coral Reef Ecosystems - Q6',
    content: 'According to the professor, which of the following is NOT a product of photosynthesis that the algae supply to coral?',
    options: JSON.stringify([
      { label: 'A', text: 'Glucose' },
      { label: 'B', text: 'Glycerol' },
      { label: 'C', text: 'Amino acids' },
      { label: 'D', text: 'Chlorophyll' }
    ]),
    answer: 'D',
    analysis: '讲座提到的光合产物包括葡萄糖、甘油和氨基酸。叶绿素是藻类自身进行光合作用所需的色素，不是供给珊瑚的营养物质。',
    source: 'simulated', status: 'approved',
    passage_id: 'bio-marine-001',
  },

  // ===== LECTURE 2: Art History - Impressionism (6题) =====
  {
    subject: 'listening', type: 'lecture', difficulty: 'medium',
    title: 'Art History: The Birth of Impressionism',
    content: 'What is the lecture mainly about?',
    options: JSON.stringify([
      { label: 'A', text: 'The techniques used by Renaissance painters.' },
      { label: 'B', text: 'The revolution in 19th-century French painting.' },
      { label: 'C', text: 'The influence of photography on art.' },
      { label: 'D', text: 'The political history of France in the 1800s.' }
    ]),
    answer: 'B',
    analysis: '讲座主要讨论19世纪法国印象派画派的革命性创新及其对传统学院派艺术的挑战。',
    passage_text: '[Professor]: Impressionism emerged in the 1860s and 1870s in Paris as a radical departure from the traditions of academic art. The artists who formed this movement — Monet, Renoir, Degas, and Pissarro — rejected the polished finish and historical or mythological subjects favored by the official Salons.\n\nInstead, they painted modern life and landscapes, often en plein air — outdoors — to capture the fleeting effects of natural light. Their technique involved short, visible brushstrokes and an emphasis on accurate depiction of light. They chose ordinary subjects and sometimes even painted from unusual angles.\n\nThe name "Impressionism" actually came from a derogatory review of Monet\'s painting "Impression, Sunrise." A critic named Louis Leroy mocked the work, saying it looked like a mere sketch or impression, not a finished painting. Ironically, the insult became the name of the movement. The Impressionists embraced it and went on to transform the course of Western art, paving the way for modernism.',
    source: 'simulated', status: 'approved',
  },
  {
    subject: 'listening', type: 'detail', difficulty: 'easy',
    title: 'Art History: The Birth of Impressionism - Q2',
    content: 'When did Impressionism emerge?',
    options: JSON.stringify([
      { label: 'A', text: 'In the 1840s and 1850s' },
      { label: 'B', text: 'In the 1860s and 1870s' },
      { label: 'C', text: 'In the 1880s and 1890s' },
      { label: 'D', text: 'In the 1900s and 1910s' }
    ]),
    answer: 'B',
    analysis: '讲座明确指出印象派在1860年代和1870年代的巴黎兴起。',
    source: 'simulated', status: 'approved',
    passage_id: 'art-impressionism-001',
  },
  {
    subject: 'listening', type: 'detail', difficulty: 'easy',
    title: 'Art History: The Birth of Impressionism - Q3',
    content: 'What does "en plein air" mean?',
    options: JSON.stringify([
      { label: 'A', text: 'In the studio' },
      { label: 'B', text: 'In the gallery' },
      { label: 'C', text: 'Outdoors' },
      { label: 'D', text: 'At night' }
    ]),
    answer: 'C',
    analysis: '"en plein air"是法语，意为"在户外"。印象派画家在户外作画以捕捉自然光的瞬息效果。',
    source: 'simulated', status: 'approved',
    passage_id: 'art-impressionism-001',
  },
  {
    subject: 'listening', type: 'inference', difficulty: 'medium',
    title: 'Art History: The Birth of Impressionism - Q4',
    content: 'Why does the professor mention Louis Leroy?',
    options: JSON.stringify([
      { label: 'A', text: 'To explain how the movement got its name.' },
      { label: 'B', text: 'To describe a famous Impressionist painter.' },
      { label: 'C', text: 'To discuss photography\'s impact on art.' },
      { label: 'D', text: 'To introduce the official Salon system.' }
    ]),
    answer: 'A',
    analysis: '教授提到Louis Leroy是为了说明"印象派"这个名字的来源——原本是一句讽刺用语，后来被该运动采纳。',
    source: 'simulated', status: 'approved',
    passage_id: 'art-impressionism-001',
  },
  {
    subject: 'listening', type: 'purpose', difficulty: 'medium',
    title: 'Art History: The Birth of Impressionism - Q5',
    content: 'What is the professor\'s attitude toward the critic\'s review?',
    options: JSON.stringify([
      { label: 'A', text: 'He agrees with the criticism.' },
      { label: 'B', text: 'He finds it ironic that the insult became the movement\'s name.' },
      { label: 'C', text: 'He thinks the critic was unfairly harsh.' },
      { label: 'D', text: 'He believes the review was accurate.' }
    ]),
    answer: 'B',
    analysis: '教授用"Ironically"一词表明了讽刺的态度——原本用来贬低这个词反而成为了艺术运动的正式名称。',
    source: 'simulated', status: 'approved',
    passage_id: 'art-impressionism-001',
  },
  {
    subject: 'listening', type: 'negative', difficulty: 'hard',
    title: 'Art History: The Birth of Impressionism - Q6',
    content: 'According to the lecture, all of the following are characteristics of Impressionism EXCEPT:',
    options: JSON.stringify([
      { label: 'A', text: 'Short, visible brushstrokes' },
      { label: 'B', text: 'Historical and mythological subjects' },
      { label: 'C', text: 'Emphasis on natural light' },
      { label: 'D', text: 'Painting en plein air' }
    ]),
    answer: 'B',
    analysis: '印象派的特点是短而可见的笔触、对自然光的强调、在户外作画，以及描绘现代生活而非历史或神话题材。B项是学院派艺术的特点，正是印象派所反对的。',
    source: 'simulated', status: 'approved',
    passage_id: 'art-impressionism-001',
  },

  // ===== LECTURE 3: Environmental Science - Renewable Energy (6题) =====
  {
    subject: 'listening', type: 'lecture', difficulty: 'hard',
    title: 'Environmental Science: The Future of Renewable Energy',
    content: 'What is the main focus of the lecture?',
    options: JSON.stringify([
      { label: 'A', text: 'The history of fossil fuel consumption.' },
      { label: 'B', text: 'Challenges and innovations in renewable energy.' },
      { label: 'C', text: 'The political debate over climate policy.' },
      { label: 'D', text: 'How nuclear power works.' }
    ]),
    answer: 'B',
    analysis: '讲座主要讨论可再生能源面临的挑战（如间歇性、储存）以及相关创新（如电池技术、智能电网）。',
    passage_text: '[Professor]: Renewable energy sources like solar, wind, and hydroelectric power are growing rapidly, but they face a fundamental challenge: intermittency. The sun does not always shine, and the wind does not always blow. This variability makes it difficult to rely on renewables as a sole source of power.\n\nOne solution is energy storage. Lithium-ion batteries, the same technology used in electric vehicles, are now being deployed at the grid scale. Large battery installations can store excess energy generated during peak production times and release it when demand is high or generation is low. This is sometimes called "time-shifting" energy.\n\nAnother approach is the smart grid — an updated electricity network that uses digital technology to monitor and manage the transport of electricity from all generation sources to meet the varying demands of consumers. Smart grids can balance supply and demand more efficiently and integrate renewable sources more effectively.\n\nFinally, some scientists are looking at green hydrogen — hydrogen produced by using renewable electricity to split water molecules. This could provide a way to store vast amounts of energy for long periods and for use in industries that are hard to electrify, such as steel production and shipping.',
    source: 'simulated', status: 'approved',
  },
  {
    subject: 'listening', type: 'detail', difficulty: 'medium',
    title: 'Environmental Science: The Future of Renewable Energy - Q2',
    content: 'What is the fundamental challenge of renewable energy mentioned in the lecture?',
    options: JSON.stringify([
      { label: 'A', text: 'High cost of installation' },
      { label: 'B', text: 'Intermittency — unreliable supply' },
      { label: 'C', text: 'Insufficient technology' },
      { label: 'D', text: 'Lack of government support' }
    ]),
    answer: 'B',
    analysis: '讲座指出的根本挑战是间歇性——太阳不总是发光，风不总是吹，这导致电力供应不稳定。',
    source: 'simulated', status: 'approved',
    passage_id: 'env-renewable-001',
  },
  {
    subject: 'listening', type: 'detail', difficulty: 'easy',
    title: 'Environmental Science: The Future of Renewable Energy - Q3',
    content: 'What technology is used for large-scale energy storage?',
    options: JSON.stringify([
      { label: 'A', text: 'Pumped hydro storage' },
      { label: 'B', text: 'Lithium-ion batteries' },
      { label: 'C', text: 'Flywheel energy storage' },
      { label: 'D', text: 'Compressed air energy storage' }
    ]),
    answer: 'B',
    analysis: '讲座明确指出锂-ion电池（与电动车相同的电池技术）现在被大规模部署用于电网级别的能源储存。',
    source: 'simulated', status: 'approved',
    passage_id: 'env-renewable-001',
  },
  {
    subject: 'listening', type: 'inference', difficulty: 'hard',
    title: 'Environmental Science: The Future of Renewable Energy - Q4',
    content: 'Why does the professor mention steel production and shipping?',
    options: JSON.stringify([
      { label: 'A', text: 'To show examples of industries that are hard to electrify.' },
      { label: 'B', text: 'To argue against the use of renewable energy.' },
      { label: 'C', text: 'To compare renewable and fossil fuel energy costs.' },
      { label: 'D', text: 'To describe the history of industrialization.' }
    ]),
    answer: 'A',
    analysis: '教授提到钢铁生产和航运是为了举例说明哪些行业难以电气化，从而说明绿色氢气的潜在用途。',
    source: 'simulated', status: 'approved',
    passage_id: 'env-renewable-001',
  },
  {
    subject: 'listening', type: 'purpose', difficulty: 'medium',
    title: 'Environmental Science: The Future of Renewable Energy - Q5',
    content: 'Why does the professor explain "time-shifting" energy?',
    options: JSON.stringify([
      { label: 'A', text: 'To define a new concept in physics.' },
      { label: 'B', text: 'To illustrate how battery storage solves the intermittency problem.' },
      { label: 'C', text: 'To criticize the electricity market.' },
      { label: 'D', text: 'To introduce the concept of peak demand.' }
    ]),
    answer: 'B',
    analysis: '教授解释"时间转移"能源是为了说明电池储存如何解决间歇性问题——在发电高峰时储存，在需求高或发电量低时释放。',
    source: 'simulated', status: 'approved',
    passage_id: 'env-renewable-001',
  },
  {
    subject: 'listening', type: 'negative', difficulty: 'hard',
    title: 'Environmental Science: The Future of Renewable Energy - Q6',
    content: 'According to the lecture, all of the following are discussed as solutions to renewable energy challenges EXCEPT:',
    options: JSON.stringify([
      { label: 'A', text: 'Energy storage using batteries' },
      { label: 'B', text: 'Smart grid technology' },
      { label: 'C', text: 'Green hydrogen production' },
      { label: 'D', text: 'Fracking for natural gas' }
    ]),
    answer: 'D',
    analysis: '讲座提到的解决方案包括电池储能、智能电网和绿色氢气。水力压裂法（fracking）是化石燃料开采技术，不是可再生能源解决方案。',
    source: 'simulated', status: 'approved',
    passage_id: 'env-renewable-001',
  },

  // ===== CONVERSATION 1: Campus Dining (4题) =====
  {
    subject: 'listening', type: 'conversation', difficulty: 'easy',
    title: 'Campus Dining: Menu Complaint',
    content: 'Why does the woman go to see the man?',
    options: JSON.stringify([
      { label: 'A', text: 'To apply for a job at the dining hall.' },
      { label: 'B', text: 'To complain about the lack of vegetarian options.' },
      { label: 'C', text: 'To ask about food allergy information.' },
      { label: 'D', text: 'To request an earlier closing time.' }
    ]),
    answer: 'B',
    analysis: '学生女生去见饮食服务主管是为了反映餐厅素食选择不足的问题。',
    passage_text: '[Student]: Excuse me, I wanted to talk to you about something I\'ve been noticing.\n[Staff]: Of course, what\'s on your mind?\n[Student]: Well, I\'m a vegetarian, and I\'ve been eating at the dining hall regularly. But the vegetarian options are really limited — there\'s only one or two choices every day, and they\'re usually just salads or pasta.\n[Staff]: That\'s fair feedback. We actually surveyed students last semester and you were not alone in this concern.\n[Student]: So what\'s being done about it?\n[Staff]: We\'re planning to hire a new chef in the spring semester who specializes in plant-based cooking. Until then, we\'ve added a vegetarian label to items that meet certain criteria.\n[Student]: That\'s good to hear. But could you also consider adding more protein-rich options like beans and tofu?',
    source: 'simulated', status: 'approved',
  },
  {
    subject: 'listening', type: 'detail', difficulty: 'easy',
    title: 'Campus Dining: Menu Complaint - Q2',
    content: 'What does the student say about the current vegetarian options?',
    options: JSON.stringify([
      { label: 'A', text: 'There are too many of them.' },
      { label: 'B', text: 'There are only one or two choices daily.' },
      { label: 'C', text: 'They are too expensive.' },
      { label: 'D', text: 'They are not healthy.' }
    ]),
    answer: 'B',
    analysis: '学生说素食选择非常有限——每天只有一两个选择，而且通常只是沙拉或意面。',
    source: 'simulated', status: 'approved',
    passage_id: 'conv-dining-001',
  },
  {
    subject: 'listening', type: 'inference', difficulty: 'medium',
    title: 'Campus Dining: Menu Complaint - Q3',
    content: 'What can be inferred about the dining hall staff\'s response?',
    options: JSON.stringify([
      { label: 'A', text: 'They are indifferent to student concerns.' },
      { label: 'B', text: 'They are planning improvements.' },
      { label: 'C', text: 'They disagree with the student\'s assessment.' },
      { label: 'D', text: 'They want the student to leave immediately.' }
    ]),
    answer: 'B',
    analysis: '从工作人员承认这是合理的反馈、提到上学期调查过学生意见、并计划在春季聘请专业厨师可以看出，他们正在计划改进。',
    source: 'simulated', status: 'approved',
    passage_id: 'conv-dining-001',
  },
  {
    subject: 'listening', type: 'purpose', difficulty: 'medium',
    title: 'Campus Dining: Menu Complaint - Q4',
    content: 'Why does the student mention beans and tofu?',
    options: JSON.stringify([
      { label: 'A', text: 'To suggest specific food items to add.' },
      { label: 'B', text: 'To explain her favorite foods.' },
      { label: 'C', text: 'To complain about protein content.' },
      { label: 'D', text: 'To suggest bringing food from home.' }
    ]),
    answer: 'A',
    analysis: '学生提到豆类和豆腐是为了建议增加富含蛋白质的素食选项。',
    source: 'simulated', status: 'approved',
    passage_id: 'conv-dining-001',
  },

  // ===== CONVERSATION 2: Library Study Rooms (4题) =====
  {
    subject: 'listening', type: 'conversation', difficulty: 'medium',
    title: 'Library Study Rooms: Booking System Issue',
    content: 'What is the main problem the student has?',
    options: JSON.stringify([
      { label: 'A', text: 'The library is too noisy.' },
      { label: 'B', text: 'He cannot book a study room online.' },
      { label: 'C', text: 'The library closes too early.' },
      { label: 'D', text: 'His ID card does not work at the entrance.' }
    ]),
    answer: 'B',
    analysis: '学生遇到的主要问题是通过网络无法预订自习室。',
    passage_text: '[Student]: Hi, I\'m having trouble with the library\'s online booking system. I tried to reserve a study room for tomorrow, but the system keeps showing "all rooms full" even though I saw people walking around with empty rooms.\n[Librarian]: Oh, that happens sometimes. Our online system doesn\'t always update in real time. When someone books a room for two hours but only uses it for one, the room shows as reserved even though it\'s empty.\n[Student]: That explains it! So what can I do?\n[Librarian]: You have two options. You can come here and I\'ll manually assign you a room. Or, if you have a group project coming up, I can set up a standing reservation for you every day this week.\n[Student]: The second option would be great. We have a group presentation every Thursday.\n[Librarian]: Okay, let me get your student ID. How long does your group usually meet?',
    source: 'simulated', status: 'approved',
  },
  {
    subject: 'listening', type: 'detail', difficulty: 'easy',
    title: 'Library Study Rooms: Booking System Issue - Q2',
    content: 'Why does the online system show rooms as full?',
    options: JSON.stringify([
      { label: 'A', text: 'Too many students are booking rooms.' },
      { label: 'B', text: 'The system does not update in real time.' },
      { label: 'C', text: 'The rooms are actually all occupied.' },
      { label: 'D', text: 'The server is down.' }
    ]),
    answer: 'B',
    analysis: '图书馆员解释说在线系统不是实时更新。有人预订了2小时但只用1小时，系统仍显示该房间被预订。',
    source: 'simulated', status: 'approved',
    passage_id: 'conv-library-001',
  },
  {
    subject: 'listening', type: 'purpose', difficulty: 'medium',
    title: 'Library Study Rooms: Booking System Issue - Q3',
    content: 'What does the librarian suggest for the student\'s group project?',
    options: JSON.stringify([
      { label: 'A', text: 'To use empty rooms without booking.' },
      { label: 'B', text: 'To set up a standing reservation.' },
      { label: 'C', text: 'To meet in the library lobby instead.' },
      { label: 'D', text: 'To book only on Thursday mornings.' }
    ]),
    answer: 'B',
    analysis: '图书馆员建议为该学生的团体项目设置固定预约——每周固定几天可以使用自习室。',
    source: 'simulated', status: 'approved',
    passage_id: 'conv-library-001',
  },
  {
    subject: 'listening', type: 'negative', difficulty: 'medium',
    title: 'Library Study Rooms: Booking System Issue - Q4',
    content: 'According to the librarian, which of the following is NOT a reason the system shows rooms as reserved when they are empty?',
    options: JSON.stringify([
      { label: 'A', text: 'Students overstay their booking time.' },
      { label: 'B', text: 'The system does not update in real time.' },
      { label: 'C', text: 'Rooms are assigned manually by staff.' },
      { label: 'D', text: 'Booking duration exceeds actual usage.' }
    ]),
    answer: 'C',
    analysis: '教授提到的原因包括系统不是实时更新和学生预订时间超过实际使用时间。手动分配房间是解决方案，不是造成系统显示错误的原因。',
    source: 'simulated', status: 'approved',
    passage_id: 'conv-library-001',
  },
];

module.exports = LISTENING_DATA;
