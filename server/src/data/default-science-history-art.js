/**
 * 托福阅读题库 - 科学/历史/艺术三大主题补充篇章
 * 
 * 用法: node server/src/data/seed-science-history-art.js
 */

const PASSAGES = [
  // ============================================
  // SCIENCE - Photosynthesis and Plant Energy Metabolism
  // ============================================
  {
    passage_id: "sha-science-001",
    title: "Photosynthesis and Plant Energy Metabolism",
    subject: "reading",
    difficulty: "hard",
    source: "sha-science",
    passage_text: "Photosynthesis is the biological process that converts light energy into chemical energy stored in glucose molecules. This remarkable mechanism, which emerged over three billion years ago in ancient cyanobacteria, forms the foundation of nearly all life on Earth. The process occurs within specialized organelles called chloroplasts, which contain the green pigment chlorophyll that captures light energy from the sun.\n\nThe light-dependent reactions occur in the thylakoid membranes of chloroplasts. When light strikes the chlorophyll molecules, electrons are energized and transferred through an electron transport chain. This process splits water molecules -- releasing oxygen as a byproduct -- and generates two energy-carrying molecules: ATP (adenosine triphosphate) and NADPH (nicotinamide adenine dinucleotide phosphate). The oxygen released during photosynthesis is responsible for the atmospheric oxygen that most living organisms require for respiration.\n\nThe light-independent reactions, commonly known as the Calvin cycle, take place in the stroma of the chloroplasts. Using the ATP and NADPH produced in the light-dependent reactions, the Calvin cycle fixes atmospheric carbon dioxide into organic molecules through a process initiated by the enzyme RuBisCO -- arguably the most abundant protein on Earth. Through a series of approximately thirty enzymatic reactions, six molecules of carbon dioxide are converted into one molecule of glucose.\n\nWhile photosynthesis stores energy in glucose bonds, cellular respiration releases that stored energy for the organism to use. The relationship between these two processes creates a nearly perfect energy cycle: the waste products of one process serve as the raw materials for the other.\n\nInterestingly, plants perform both photosynthesis and cellular respiration simultaneously. During daylight, photosynthesis far exceeds respiration, making plants net producers of oxygen and glucose. At night, when light is unavailable, plants rely solely on cellular respiration, consuming oxygen and releasing carbon dioxide -- just like animals do.",
    questions: [
      {
        content: "According to the passage, where do the light-dependent reactions of photosynthesis occur?",
        order: 1, type: "detail", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "In the stroma of the chloroplasts" },
          { label: "B", text: "In the thylakoid membranes of chloroplasts" },
          { label: "C", text: "In the mitochondria of plant cells" },
          { label: "D", text: "In the cell wall of leaf cells" }
        ]),
        answer: "B",
        analysis: "第二段明确指出光依赖反应发生在叶绿体的类囊体膜中（thylakoid membranes）。"
      },
      {
        content: "What is the function of the enzyme RuBisCO in the Calvin cycle?",
        order: 2, type: "detail", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "To split water molecules and release oxygen" },
          { label: "B", text: "To fix atmospheric carbon dioxide into organic molecules" },
          { label: "C", text: "To produce ATP and NADPH from sunlight" },
          { label: "D", text: "To convert glucose into carbon dioxide" }
        ]),
        answer: "B",
        analysis: "第三段说明RuBisCO启动碳固定过程，将大气中的二氧化碳转化为有机分子。"
      },
      {
        content: "The word 'abundant' in paragraph 3 is closest in meaning to:",
        order: 3, type: "vocabulary", difficulty: "easy",
        options: JSON.stringify([
          { label: "A", text: "rare" },
          { label: "B", text: "plentiful" },
          { label: "C", text: "unique" },
          { label: "D", text: "synthetic" }
        ]),
        answer: "B",
        analysis: "'Abundant' 意为丰富的、大量的。文中说RuBisCO是地球上最丰富的蛋白质。"
      },
      {
        content: "What can be inferred about plants at night from the passage?",
        order: 4, type: "inference", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "They stop performing cellular respiration" },
          { label: "B", text: "They produce more glucose than during the day" },
          { label: "C", text: "They consume oxygen and release carbon dioxide" },
          { label: "D", text: "They switch to photosynthesis using stored light energy" }
        ]),
        answer: "C",
        analysis: "最后一段说夜间没有光照时，植物仅依赖细胞呼吸，消耗氧气并释放二氧化碳。"
      },
      {
        content: "Which of the following best summarizes the relationship between photosynthesis and cellular respiration?",
        order: 5, type: "summary", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "Photosynthesis and cellular respiration are independent processes that occur in different organisms" },
          { label: "B", text: "The two processes form a nearly perfect cycle where the products of each serve as inputs for the other" },
          { label: "C", text: "Cellular respiration evolved before photosynthesis to provide energy for plants" },
          { label: "D", text: "Photosynthesis is more efficient than cellular respiration in all conditions" }
        ]),
        answer: "B",
        analysis: "文章核心：光合作用与细胞呼吸互为逆过程，形成近乎完美的能量循环。"
      },
      {
        content: "What does the passage suggest about the evolutionary history of photosynthesis?",
        order: 6, type: "inference", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "It evolved recently in flowering plants" },
          { label: "B", text: "It originated in ancient cyanobacteria over three billion years ago" },
          { label: "C", text: "It developed simultaneously in plants and animals" },
          { label: "D", text: "It was first observed in red algae" }
        ]),
        answer: "B",
        analysis: "第一段明确指出光合作用起源于约30亿年前的古代蓝细菌。"
      }
    ]
  },

  // ============================================
  // HISTORY - The Silk Road and Cross-Civilization Trade
  // ============================================
  {
    passage_id: "sha-history-001",
    title: "The Silk Road and Cross-Civilization Trade",
    subject: "reading",
    difficulty: "medium",
    source: "sha-history",
    passage_text: "The Silk Road was not a single road but a vast network of trade routes connecting East Asia with the Mediterranean world. Spanning approximately 6,400 kilometers from Xi'an, China, to the Mediterranean ports of Syria and Turkey, the Silk Road facilitated the exchange of goods, ideas, religions, and technologies across continents for over a millennium. Despite its name, silk accounted for only a fraction of the trade that moved along these routes; spices, precious metals, textiles, glassware, and horses were equally important commodities.\n\nThe Silk Road's origins can be traced to the second century BCE when Emperor Wu of the Han Dynasty sent his envoy Zhang Qian westward to establish diplomatic relations with Central Asian kingdoms. Zhang Qian's journeys revealed not only new political possibilities but also the existence of powerful horse-breeding cultures in the Ferghana Valley, whose horses would revolutionize Chinese military capabilities. In response, the Han Dynasty extended the Great Wall westward to protect the emerging trade routes from nomadic incursions.\n\nWhat made the Silk Road truly transformative was not merely the exchange of material goods but the transmission of knowledge and belief systems. Buddhism, originating in India, spread eastward along these routes into China, Korea, and Japan, profoundly influencing art, philosophy, and governance across East Asia. Similarly, Islamic scholarship -- encompassing advances in mathematics, astronomy, medicine, and philosophy -- traveled westward from the Islamic Golden Age centers in Baghdad and Cordoba to eventually reach medieval Europe.\n\nThe Silk Road also played a crucial role in the spread of technological innovations. Papermaking, invented in China around the second century CE, traveled westward and was adopted by the Islamic world before reaching Europe. The printing press, gunpowder, and the compass -- collectively known as China's Four Great Inventions -- all diffused along these routes, fundamentally altering the course of world history. Conversely, glassmaking techniques, advanced metallurgy, and grape cultivation moved eastward from the Mediterranean and Middle East.\n\nThe decline of the Silk Road began in the fifteenth century with the rise of maritime trade routes. European sea powers, particularly Portugal and later the Dutch Republic and England, developed sea routes that could transport goods more efficiently and in greater quantities than overland caravan trade. However, the cultural and intellectual legacy of the Silk Road endures, shaping the cosmopolitan character of civilizations from Chang'an to Constantinople.",
    questions: [
      {
        content: "According to the passage, which of the following best describes what made the Silk Road truly transformative?",
        order: 1, type: "detail", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "The vast quantity of silk traded" },
          { label: "B", text: "The transmission of knowledge and belief systems alongside goods" },
          { label: "C", text: "The military alliances formed along the routes" },
          { label: "D", text: "The standardization of currencies across the trade network" }
        ]),
        answer: "B",
        analysis: "第三段明确指出丝绸之路的真正变革性不在于物质交换而在于知识和信仰的传播。"
      },
      {
        content: "Why did Emperor Wu of the Han Dynasty send Zhang Qian westward?",
        order: 2, type: "detail", difficulty: "easy",
        options: JSON.stringify([
          { label: "A", text: "To explore trade routes for silk production" },
          { label: "B", text: "To establish diplomatic relations with Central Asian kingdoms" },
          { label: "C", text: "To find new sources of precious metals" },
          { label: "D", text: "To spread Buddhism to Central Asia" }
        ]),
        answer: "B",
        analysis: "第二段明确说明汉武帝派遣张骞西出是为了与中亚诸国建立外交关系。"
      },
      {
        content: "The word 'commodities' in paragraph 1 is closest in meaning to:",
        order: 3, type: "vocabulary", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "luxury items" },
          { label: "B", text: "goods for trade" },
          { label: "C", text: "military supplies" },
          { label: "D", text: "cultural artifacts" }
        ]),
        answer: "B",
        analysis: "'Commodities' 意为商品、货物。文中列举香料、金属、纺织品等都是贸易商品。"
      },
      {
        content: "According to paragraph 4, which invention traveled from east to west along the Silk Road?",
        order: 4, type: "detail", difficulty: "easy",
        options: JSON.stringify([
          { label: "A", text: "Glassmaking techniques" },
          { label: "B", text: "Grape cultivation" },
          { label: "C", text: "Papermaking" },
          { label: "D", text: "Advanced metallurgy" }
        ]),
        answer: "C",
        analysis: "第四段明确说明造纸术从中国向西传播到伊斯兰世界再到欧洲。"
      },
      {
        content: "What does the passage suggest about the decline of the Silk Road?",
        order: 5, type: "inference", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "It was caused by the collapse of the Han Dynasty" },
          { label: "B", text: "It was accelerated by more efficient maritime trade routes" },
          { label: "C", text: "It resulted from the spread of Christianity" },
          { label: "D", text: "It was prevented by improved military security" }
        ]),
        answer: "B",
        analysis: "最后一段说明十五世纪海上贸易路线的兴起取代了陆路商队贸易。"
      },
      {
        content: "Which of the following best summarizes the main idea of the passage?",
        order: 6, type: "summary", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "The Silk Road was primarily a trade route for Chinese silk" },
          { label: "B", text: "The Silk Road's significance lay in its role as a conduit for the exchange of goods, ideas, and technologies across civilizations" },
          { label: "C", text: "The Silk Road declined because European sea powers outcompeted overland traders" },
          { label: "D", text: "The Silk Road only connected China and the Mediterranean" }
        ]),
        answer: "B",
        analysis: "文章核心：丝绸之路是商品、思想和技术在不同文明间交流的重要通道。"
      }
    ]
  },

  // ============================================
  // ART - Renaissance Painting Techniques
  // ============================================
  {
    passage_id: "sha-art-001",
    title: "Renaissance Painting Techniques and Artistic Innovation",
    subject: "reading",
    difficulty: "medium",
    source: "sha-art",
    passage_text: "The Renaissance, spanning roughly from the fourteenth to the seventeenth century, witnessed an unprecedented transformation in European painting techniques. Prior to this period, medieval painting was dominated by flat, stylized representations of figures, often with gold backgrounds and little concern for realistic proportion or spatial depth. The Renaissance artists, however, sought to depict the natural world with unprecedented accuracy, employing mathematical principles of perspective, anatomical study, and new materials to create images that captured the complexity of three-dimensional reality.\n\nLinear perspective, developed by the Italian architect Filippo Brunelleschi and formalized by Leon Battista Alberti in 1435, revolutionized how artists approached spatial representation. The technique involves constructing a grid of converging lines that meet at a single vanishing point on the horizon line, creating the illusion of depth on a flat surface. Fra Angelico and other early Renaissance painters were among the first to systematically apply perspective principles in their works. By 1508, the technique had become so refined that Raphael's 'The School of Athens' demonstrated a sophisticated use of multiple vanishing points to create a convincing architectural space.\n\nThe development of oil painting was equally transformative. While tempera paint -- made from pigments mixed with egg yolk -- had been the primary painting medium since the Middle Ages, it dried rapidly and produced a hard, brittle finish unsuitable for subtle gradations of tone. Oil paint, which allowed artists to work slowly, blend colors seamlessly, and build up layers of translucent glazes, offered unprecedented control over the final image. Jan van Eyck, working in the Low Countries in the early fifteenth century, is credited with perfecting oil painting techniques that would influence artists across Europe for centuries.\n\nChiaroscuro -- the use of strong contrasts between light and shadow -- emerged as another critical technique of Renaissance painting. Artists like Leonardo da Vinci developed the sfumato variant, which softens the transition between colors and tones to create a smoky, atmospheric effect. Leonardo's 'Mona Lisa' exemplifies this technique, where the absence of harsh outlines creates a sense of volume and mystery. The mastery of chiaroscuro and sfumato allowed Renaissance painters to render human forms with remarkable three-dimensional presence, contributing to the movement's goal of celebrating the beauty and complexity of the natural world.",
    questions: [
      {
        content: "According to the passage, what was the primary difference between medieval and Renaissance painting styles?",
        order: 1, type: "detail", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "Medieval paintings used oil paint while Renaissance paintings used tempera" },
          { label: "B", text: "Medieval painting favored flat representations while Renaissance artists pursued realistic spatial depth" },
          { label: "C", text: "Medieval artists focused on portraits while Renaissance artists painted landscapes" },
          { label: "D", text: "Medieval paintings were religious while Renaissance paintings were secular" }
        ]),
        answer: "B",
        analysis: "第一段指出中世纪绘画以扁平风格化为特点，而文艺复兴艺术家追求三维现实感的逼真再现。"
      },
      {
        content: "What is the function of the vanishing point in linear perspective?",
        order: 2, type: "detail", difficulty: "easy",
        options: JSON.stringify([
          { label: "A", text: "To determine the color palette of the painting" },
          { label: "B", text: "To create the illusion of depth on a flat surface through converging lines" },
          { label: "C", text: "To identify the main subject of the composition" },
          { label: "D", text: "To measure the proportions of human figures" }
        ]),
        answer: "B",
        analysis: "第二段说明消失点是汇聚线交汇的点，在平面表面上创造深度错觉。"
      },
      {
        content: "The word 'transformative' in paragraph 3 is closest in meaning to:",
        order: 3, type: "vocabulary", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "destructive" },
          { label: "B", text: "fundamentally changing" },
          { label: "C", text: "gradually improving" },
          { label: "D", text: "temporarily innovative" }
        ]),
        answer: "B",
        analysis: "'Transformative' 意为根本性地改变。油画技术的开发从根本上改变了绘画创作方式。"
      },
      {
        content: "According to paragraph 3, what was the advantage of oil paint over tempera?",
        order: 4, type: "detail", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "Oil paint dried faster and produced a harder finish" },
          { label: "B", text: "Oil paint allowed slow working, seamless blending, and translucent layering" },
          { label: "C", text: "Oil paint was cheaper and more readily available" },
          { label: "D", text: "Oil paint was easier to clean than tempera" }
        ]),
        answer: "B",
        analysis: "第三段说明油画颜料允许艺术家慢速工作、无缝混合色彩并叠加半透明釉层。"
      },
      {
        content: "What does the passage suggest about Leonardo da Vinci's contribution to painting technique?",
        order: 5, type: "inference", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "He invented linear perspective" },
          { label: "B", text: "He perfected the sfumato technique that created soft, atmospheric transitions" },
          { label: "C", text: "He was the first to use oil paint in Italy" },
          { label: "D", text: "He eliminated the need for perspective in Renaissance painting" }
        ]),
        answer: "B",
        analysis: "第四段说明达芬奇发展了晕涂法（sfumato），通过柔和的色彩过渡创造烟雾般的氛围效果。"
      },
      {
        content: "Which of the following best summarizes the main idea of the passage?",
        order: 6, type: "summary", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "Renaissance painters abandoned all medieval techniques to create purely secular art" },
          { label: "B", text: "Renaissance painting was characterized by revolutionary techniques including perspective, oil paint, and chiaroscuro that created realistic three-dimensional representation" },
          { label: "C", text: "Linear perspective was the single most important development in Renaissance art" },
          { label: "D", text: "Jan van Eyck alone was responsible for all major Renaissance painting innovations" }
        ]),
        answer: "B",
        analysis: "文章核心：文艺复兴绘画通过透视法、油画技术和明暗法等革命性技法创造了逼真的三维再现。"
      }
    ]
  }
];

module.exports = PASSAGES;
