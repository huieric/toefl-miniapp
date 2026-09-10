/**
 * 托福阅读题库 - 地质学/心理学篇章
 * 
 * 用法: node server/src/data/seed-geology-psychology.js
 */

const PASSAGES = [
  // ============================================
  // GEOLOGY - Plate Tectonics and Earth's Structure
  // ============================================
  {
    passage_id: "geo-geology-001",
    title: "Plate Tectonics and Earth's Dynamic Surface",
    subject: "reading",
    difficulty: "hard",
    source: "geo-geology",
    passage_text: "Plate tectonics is the unifying theory of geology that explains the large-scale movements of Earth's lithosphere. The lithosphere is divided into several large and small plates that float on the semi-fluid asthenosphere beneath. This theory, which emerged in the 1960s, revolutionized our understanding of how Earth's surface changes over geological time.\n\nThere are three main types of plate boundaries, each associated with distinctive geological features. Convergent boundaries occur where plates move toward each other. When an oceanic plate collides with a continental plate, the denser oceanic plate subducts beneath the continental plate, creating deep ocean trenches and volcanic mountain ranges. The Andes Mountains of South America are a classic example of this type of boundary. When two continental plates collide, neither can subduct due to their similar densities, resulting in massive mountain building. The Himalayas, rising to over eight thousand meters, formed from the ongoing collision of the Indian and Eurasian plates.\n\nDivergent boundaries occur where plates move apart from each other. As the plates separate, magma from the mantle rises to fill the gap, creating new crust. This process is most visible along mid-ocean ridges, such as the Mid-Atlantic Ridge, where continuous volcanic activity builds underwater mountain ranges. On continents, divergent boundaries create rift valleys, such as the East African Rift, where the African Plate is slowly splitting into two separate plates.\n\nTransform boundaries occur where plates slide horizontally past each other. Unlike convergent and divergent boundaries, transform boundaries neither create nor destroy crust. The most famous transform boundary is the San Andreas Fault in California, where the Pacific Plate slides past the North American Plate. This movement is responsible for frequent earthquakes in the region, as the plates occasionally lock and then suddenly slip, releasing stored energy.\n\nThe theory of plate tectonics also explains the distribution of earthquakes, volcanoes, and mineral deposits around the world. Most seismic and volcanic activity occurs along plate boundaries, while the interiors of plates are relatively stable. This understanding has profound implications for hazard assessment, resource exploration, and understanding the long-term evolution of Earth's surface features.",
    questions: [
      {
        content: "What is the main purpose of the passage?",
        order: 1, type: "detail", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "To argue that plate tectonics is the most important geological discovery" },
          { label: "B", text: "To explain the theory of plate tectonics and its three types of boundaries" },
          { label: "C", text: "To describe the formation of the Himalayas in detail" },
          { label: "D", text: "To discuss the dangers of living near plate boundaries" }
        ]),
        answer: "B",
        analysis: "文章核心：解释板块构造理论的三种边界类型及其地质特征。"
      },
      {
        content: "According to the passage, why do the Himalayas continue to rise in height?",
        order: 2, type: "detail", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "Oceanic subduction pushes them upward" },
          { label: "B", text: "The Indian and Eurasian plates are still colliding" },
          { label: "C", text: "Magma rising from the mantle lifts the mountains" },
          { label: "D", text: "The plates are sliding past each other horizontally" }
        ]),
        answer: "B",
        analysis: "第二段说明喜马拉雅山脉由印度板块和欧亚板块持续碰撞形成。"
      },
      {
        content: "The word 'subducts' in paragraph 2 is closest in meaning to:",
        order: 3, type: "vocabulary", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "rises above" },
          { label: "B", text: "slides beneath" },
          { label: "C", text: "splits from" },
          { label: "D", text: "collides with" }
        ]),
        answer: "B",
        analysis: "'Subducts' 意为俯冲/滑到下面。文中描述密度较大的大洋板块滑到大陆板块之下。"
      },
      {
        content: "What distinguishes transform boundaries from convergent and divergent boundaries?",
        order: 4, type: "detail", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "Transform boundaries are found only in the ocean" },
          { label: "B", text: "Transform boundaries create new crust" },
          { label: "C", text: "Transform boundaries neither create nor destroy crust" },
          { label: "D", text: "Transform boundaries only occur in continental plates" }
        ]),
        answer: "C",
        analysis: "第四段明确指出变换断层既不创造也不破坏地壳，这是它与其他两种边界的区别。"
      },
      {
        content: "What does the passage suggest about the practical importance of plate tectonics theory?",
        order: 5, type: "inference", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "It only helps geologists understand past events" },
          { label: "B", text: "It has no practical application for modern society" },
          { label: "C", text: "It aids in earthquake prediction, resource exploration, and hazard assessment" },
          { label: "D", text: "It proves that earthquakes cannot be predicted" }
        ]),
        answer: "C",
        analysis: "最后一段指出板块构造理论对灾害评估、资源勘探和理解地球表面长期演化有深远影响。"
      },
      {
        content: "Which of the following best describes the organization of the passage?",
        order: 6, type: "summary", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "Introduction to plate tectonics, followed by detailed discussion of three boundary types" },
          { label: "B", text: "Chronological history of geological discoveries" },
          { label: "C", text: "Argument for why plate tectonics is more important than other theories" },
          { label: "D", text: "Comparison of mountain formation in different continents" }
        ]),
        answer: "A",
        analysis: "文章结构：先介绍板块构造理论，然后分别详细讨论三种边界类型（汇聚/离散/变换）。"
      }
    ]
  },

  // ============================================
  // PSYCHOLOGY - Cognitive Behavioral Therapy
  // ============================================
  {
    passage_id: "psy-psychology-001",
    title: "Cognitive Behavioral Therapy and the Psychology of Change",
    subject: "reading",
    difficulty: "medium",
    source: "psy-psychology",
    passage_text: "Cognitive behavioral therapy, or CBT, is one of the most widely studied and practiced forms of psychotherapy. Developed in the 1960s by psychiatrist Aaron Beck, CBT is based on the premise that our thoughts, feelings, and behaviors are interconnected, and that changing negative or irrational thought patterns can lead to improvements in emotional state and behavior.\n\nThe fundamental principle of CBT is that it is not events themselves that cause emotional distress, but rather our interpretation of those events. For example, two people might experience the same criticism at work. One might interpret it as constructive feedback and feel motivated to improve, while the other might interpret it as a personal attack and feel depressed or angry. According to CBT theory, the difference in emotional response stems not from the criticism itself, but from each person's cognitive appraisal of the situation.\n\nCBT typically involves several key techniques. Cognitive restructuring helps patients identify and challenge their automatic negative thoughts. Patients learn to recognize thinking errors such as all-or-nothing thinking, catastrophizing, and overgeneralization, and replace them with more balanced and realistic thoughts. Behavioral activation encourages patients to engage in activities they have been avoiding due to depression or anxiety. By gradually increasing positive activities, patients can break the cycle of withdrawal and negative mood that often maintains depression.\n\nResearch has demonstrated the effectiveness of CBT for a wide range of psychological disorders, including depression, anxiety disorders, post-traumatic stress disorder, eating disorders, and substance abuse. Multiple studies have shown that CBT is often as effective as medication for mild to moderate depression, and the benefits tend to be more long-lasting because patients learn skills they can continue using after therapy ends.\n\nDespite its effectiveness, CBT is not a cure-all. It requires active participation from patients and can be demanding, as it involves confronting uncomfortable thoughts and situations. It may be less suitable for individuals who struggle with abstract thinking or who are in acute crisis and need immediate symptom relief. Nevertheless, CBT remains one of the most evidence-based and versatile approaches in modern psychology.",
    questions: [
      {
        content: "According to the passage, what is the core idea behind CBT?",
        order: 1, type: "detail", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "Changing past traumatic experiences to heal present problems" },
          { label: "B", text: "The connection between thoughts, feelings, and behaviors, and the ability to change emotional states by modifying thoughts" },
          { label: "C", text: "The importance of medication in treating psychological disorders" },
          { label: "D", text: "The role of childhood experiences in adult mental health" }
        ]),
        answer: "B",
        analysis: "第二段核心：CBT认为思想、情感和行為相互关联，通过改变负面思维模式可以改善情绪和行为。"
      },
      {
        content: "What does the passage suggest about the criticism example in paragraph 2?",
        order: 2, type: "detail", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "The criticism itself determines the emotional response" },
          { label: "B", text: "Different interpretations of the same event lead to different emotional responses" },
          { label: "C", text: "Only negative interpretations cause emotional distress" },
          { label: "D", text: "CBT eliminates the need to process criticism" }
        ]),
        answer: "B",
        analysis: "第二段通过批评的例子说明：不同人对同一事件的解释不同，导致不同的情绪反应。"
      },
      {
        content: "The word 'catastrophizing' in paragraph 3 is closest in meaning to:",
        order: 3, type: "vocabulary", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "making things more complicated than necessary" },
          { label: "B", text: "expecting the worst possible outcome" },
          { label: "C", text: "ignoring potential problems" },
          { label: "D", text: "focusing on positive aspects of situations" }
        ]),
        answer: "B",
        analysis: "'Catastrophizing' 意为灾难化思维，即预期最糟糕的结果。这是一种认知错误。"
      },
      {
        content: "What advantage does CBT have over medication for depression, according to the passage?",
        order: 4, type: "detail", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "CBT works faster than medication" },
          { label: "B", text: "CBT requires no effort from the patient" },
          { label: "C", text: "The benefits of CBT tend to be more long-lasting" },
          { label: "D", text: "CBT is always more effective than medication" }
        ]),
        answer: "C",
        analysis: "第四段指出CBT的效果往往更持久，因为患者在治疗后能继续运用学到的技能。"
      },
      {
        content: "According to the passage, who might CBT be less suitable for?",
        order: 5, type: "detail", difficulty: "medium",
        options: JSON.stringify([
          { label: "A", text: "People with mild anxiety" },
          { label: "B", text: "Individuals who enjoy social activities" },
          { label: "C", text: "People in acute crisis who need immediate symptom relief" },
          { label: "D", text: "People who have never had therapy before" }
        ]),
        answer: "C",
        analysis: "最后一段指出急性危机中需要即时症状缓解的人可能不太适合CBT。"
      },
      {
        content: "Which of the following best summarizes the main idea of the passage?",
        order: 6, type: "summary", difficulty: "hard",
        options: JSON.stringify([
          { label: "A", text: "CBT is a popular therapy that works by changing thought patterns and has proven effectiveness for many disorders" },
          { label: "B", text: "CBT is the only effective form of psychotherapy available today" },
          { label: "C", text: "Medication is always superior to CBT for treating depression" },
          { label: "D", text: "CBT is only effective for anxiety disorders" }
        ]),
        answer: "A",
        analysis: "文章核心：CBT通过改变思维模式来治疗心理问题，对多种心理障碍有效，是循证心理学的重要方法。"
      }
    ]
  }
];

module.exports = PASSAGES;
