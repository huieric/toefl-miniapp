const axios = require('axios');
const config = require('../config');

/**
 * AI陪练对话服务 - 调用OpenAI API生成对话
 */

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// 场景系统提示词
const SCENE_PROMPTS = {
  free_talk: `你是托福考生的AI陪练伙伴。请用英语与用户进行自然对话，话题围绕托福备考、大学生活、学术话题等。
- 语速适中，用词难度相当于托福听力lecture水平
- 每次回复控制在2-4句话
- 适时纠正用户的语法错误（用温和的方式）
- 鼓励用户多说，可以追问`,

  campus: `你是美国大学校园里的学生。请用英语与用户对话，场景设定在大学校园（图书馆、食堂、办公室等）。
- 话题包括：选课、社团活动、宿舍生活、教授办公室时间、校园设施等
- 模拟真实美国大学生说话方式
- 每次回复2-3句话`,

  academic: `你是大学讲师。请用英语与用户进行学术话题讨论，话题包括：生物学、心理学、经济学、历史学、艺术等托福常考学科。
- 用词学术但不晦涩，模拟托福听力lecture风格
- 可以解释专业概念
- 每次回复3-5句话`,

  daily: `你是日常英语陪练。请用英语与用户聊日常生活话题：兴趣爱好、旅行、食物、运动、电影、家庭等。
- 用词简单自然，适合日常交流
- 鼓励用户描述细节
- 每次回复2-3句话`,

  debate: `你是辩论陪练。请就托福口语/写作常见话题与用户进行辩论式对话。
话题如：大学生是否应该住校、网络教育vs传统教育、环保责任等。
- 提出有说服力的观点
- 适时反问用户观点
- 每次回复3-4句话`,
};

/**
 * 生成AI回复
 * @param {string} scene - 对话场景
 * @param {Array} messages - 历史消息列表
 * @returns {Promise<Object>} AI回复和评分
 */
async function generateReply(scene, messages) {
  if (!config.openaiApiKey) {
    return {
      content: "I'm your AI practice partner! Let's chat in English. What would you like to talk about today?",
      score: null,
    };
  }

  const systemPrompt = SCENE_PROMPTS[scene] || SCENE_PROMPTS.free_talk;

  // 构建OpenAI消息格式
  const openaiMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content,
    })),
  ];

  try {
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4o-mini',
        messages: openaiMessages,
        temperature: 0.7,
        max_tokens: 300,
      },
      {
        headers: {
          'Authorization': `Bearer ${config.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const aiContent = response.data.choices[0].message.content;

    // 对用户最后一条消息进行评分（如果是用户消息）
    let score = null;
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      score = await scoreUserMessage(lastUserMsg.content, scene);
    }

    return {
      content: aiContent,
      score,
    };
  } catch (err) {
    console.error('[AI-Talk] 生成回复失败:', err.message);
    return {
      content: "Sorry, I didn't catch that. Could you say it again?",
      score: null,
    };
  }
}

/**
 * 对用户的单条消息进行评分
 */
async function scoreUserMessage(message, scene) {
  const prompt = `请对以下英语口语回答进行评分（满分10分），从以下维度：
1. 语法准确性（Grammar）
2. 词汇丰富度（Vocabulary）
3. 流利度（Fluency）
4. 内容相关性（Relevance）

用户回答：${message}

输出JSON：
{"grammar": <0-10>, "vocabulary": <0-10>, "fluency": <0-10>, "relevance": <0-10>, "overall": <0-10>, "feedback": "<简短反馈>"}`;

  try {
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 200,
      },
      {
        headers: {
          'Authorization': `Bearer ${config.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const result = JSON.parse(response.data.choices[0].message.content);
    return {
      grammar: result.grammar || 7,
      vocabulary: result.vocabulary || 7,
      fluency: result.fluency || 7,
      relevance: result.relevance || 7,
      overall: result.overall || 7,
      feedback: result.feedback || '',
    };
  } catch (err) {
    return null;
  }
}

/**
 * 对整个对话进行评分
 * @param {string} messagesJson - 对话消息JSON字符串
 * @returns {Promise<Object>} 评分结果
 */
async function scoreConversation(messagesJson) {
  let messages = [];
  try {
    messages = typeof messagesJson === 'string' ? JSON.parse(messagesJson) : messagesJson;
  } catch (e) {
    return { score: null, detail: null };
  }

  const userMessages = messages.filter(m => m.role === 'user').map(m => m.content);

  if (userMessages.length === 0) {
    return { score: null, detail: null };
  }

  // 综合评分：取所有用户消息的平均分
  const scores = [];
  for (const msg of userMessages) {
    const s = await scoreUserMessage(msg, 'free_talk');
    if (s) scores.push(s.overall);
  }

  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 3)  // 转换为30分制
    : null;

  return {
    score: avgScore,
    detail: {
      totalMessages: userMessages.length,
      avgScore: avgScore ? avgScore / 3 : null,  // 回到10分制
      scores,
    },
  };
}

module.exports = { generateReply, scoreConversation };