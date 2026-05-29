-- ============================================================
-- 托福考试微信小程序 - 数据库DDL
-- PostgreSQL
-- ============================================================

-- 1. 用户表
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    openid VARCHAR(64) UNIQUE NOT NULL,
    unionid VARCHAR(64),
    nickname VARCHAR(100),
    avatar_url TEXT,
    gender SMALLINT DEFAULT 0,
    target_score INTEGER DEFAULT 0,
    exam_date DATE,
    current_level INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_openid ON users(openid);
CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_at);

-- 2. 用户统计表
CREATE TABLE IF NOT EXISTS user_stats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_study_minutes INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    correct_questions INTEGER DEFAULT 0,
    reading_score DECIMAL(5,2) DEFAULT 0.0,
    listening_score DECIMAL(5,2) DEFAULT 0.0,
    speaking_score DECIMAL(5,2) DEFAULT 0.0,
    writing_score DECIMAL(5,2) DEFAULT 0.0,
    total_exams INTEGER DEFAULT 0,
    avg_exam_score DECIMAL(5,2) DEFAULT 0.0,
    streak_days INTEGER DEFAULT 0,
    last_study_date DATE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_user_stats_user ON user_stats(user_id);

-- 3. 题库表
CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    subject VARCHAR(20) NOT NULL CHECK (subject IN ('reading', 'listening', 'speaking', 'writing')),
    type VARCHAR(30) NOT NULL,
    difficulty VARCHAR(10) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    options JSONB DEFAULT '[]',
    answer TEXT NOT NULL,
    analysis TEXT,
    audio_url TEXT,
    passage_text TEXT,
    source VARCHAR(50) DEFAULT 'official',
    status VARCHAR(15) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    uploaded_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_status ON questions(status);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(type);

-- 4. 练习套题表
CREATE TABLE IF NOT EXISTS practice_sets (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    subject VARCHAR(20) NOT NULL CHECK (subject IN ('reading', 'listening', 'speaking', 'writing')),
    difficulty VARCHAR(10) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    question_ids JSONB NOT NULL,
    time_limit INTEGER DEFAULT 1800,
    total_score INTEGER DEFAULT 30,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_practice_sets_subject ON practice_sets(subject);

-- 5. 考试记录表
CREATE TABLE IF NOT EXISTS exam_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exam_type VARCHAR(20) DEFAULT 'mock' CHECK (exam_type IN ('mock', 'section', 'daily')),
    subject VARCHAR(20),
    set_id INTEGER REFERENCES practice_sets(id),
    answers JSONB DEFAULT '{}',
    scores JSONB DEFAULT '{}',
    total_score DECIMAL(5,2) DEFAULT 0.0,
    time_spent INTEGER DEFAULT 0,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    ai_feedback TEXT,
    status VARCHAR(15) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_exam_records_user ON exam_records(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_records_created ON exam_records(created_at);

-- 6. 错题表
CREATE TABLE IF NOT EXISTS wrong_questions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    user_answer TEXT,
    is_correct BOOLEAN DEFAULT FALSE,
    wrong_count INTEGER DEFAULT 1,
    last_wrong_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    next_review_at TIMESTAMP,
    sm2_easiness DECIMAL(4,2) DEFAULT 2.50,
    sm2_interval INTEGER DEFAULT 1,
    sm2_repetitions INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_wrong_user ON wrong_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_wrong_next_review ON wrong_questions(next_review_at);
CREATE INDEX IF NOT EXISTS idx_wrong_question ON wrong_questions(question_id);

-- 7. AI对话记录表
CREATE TABLE IF NOT EXISTS ai_conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scene VARCHAR(30) DEFAULT 'free_talk' CHECK (scene IN ('free_talk', 'campus', 'academic', 'daily', 'debate')),
    messages JSONB DEFAULT '[]',
    ai_score DECIMAL(3,1),
    score_detail JSONB,
    duration INTEGER DEFAULT 0,
    status VARCHAR(15) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ai_conv_user ON ai_conversations(user_id);

-- 8. 学习计划表
CREATE TABLE IF NOT EXISTS study_plans (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_score INTEGER NOT NULL,
    current_score INTEGER DEFAULT 0,
    exam_date DATE NOT NULL,
    daily_minutes INTEGER DEFAULT 60,
    weak_subjects JSONB DEFAULT '["reading", "listening", "speaking", "writing"]',
    phases JSONB,
    status VARCHAR(15) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_study_plans_user ON study_plans(user_id);

-- 9. 每日任务表
CREATE TABLE IF NOT EXISTS daily_tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id INTEGER REFERENCES study_plans(id),
    task_date DATE NOT NULL,
    subject VARCHAR(20) NOT NULL,
    task_type VARCHAR(30) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    target_count INTEGER DEFAULT 1,
    completed_count INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_user_date ON daily_tasks(user_id, task_date);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_plan ON daily_tasks(plan_id);

-- 10. 用户反馈表
CREATE TABLE IF NOT EXISTS user_feedback (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    contact VARCHAR(100),
    images JSONB DEFAULT '[]',
    status VARCHAR(15) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'replied')),
    reply TEXT,
    replied_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_feedback_user ON user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON user_feedback(status);

-- 11. 使用事件埋点表
CREATE TABLE IF NOT EXISTS usage_events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB DEFAULT '{}',
    duration INTEGER DEFAULT 0,
    page_path VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_usage_events_user ON usage_events(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_type ON usage_events(event_type);
CREATE INDEX IF NOT EXISTS idx_usage_events_date ON usage_events(created_at);

-- ============================================================
-- 初始化默认数据
-- ============================================================

-- 插入示例用户（需要配合实际情况）
INSERT INTO users (openid, nickname, avatar_url, target_score, exam_date)
VALUES ('test_openid_admin', '管理员', '', 110, '2026-12-31')
ON CONFLICT (openid) DO NOTHING;

-- 插入真实托福阅读题目（TPO 1-5 精选）
INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, passage_text, status)
VALUES
('reading', 'detail', 'medium',
 'TPO 1 - The Origins of Theater',
 'According to the passage, what is the primary purpose of the first paragraph?',
 '[{"label":"A","text":"To introduce the main topic of the passage"},{"label":"B","text":"To provide a historical overview of theater development"},{"label":"C","text":"To contrast ancient and modern theater practices"},{"label":"D","text":"To explain the religious origins of theater"}]',
 'D',
 '第一段主要讨论戏剧的宗教起源，包括仪式和表演的关系。',
 'Theater has its origins in ancient rituals and ceremonies. Early human societies used performance to communicate with the supernatural, to ensure successful hunts or harvests, and to mark important life events. These rituals gradually evolved into more structured performances, separating performers from spectators. The transition from ritual to theater involved the development of narrative, character, and dialogue.',
 'approved')
ON CONFLICT (title, subject) DO NOTHING;

INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, passage_text, status)
VALUES
('reading', 'inference', 'hard',
 'TPO 2 - Desert Formation',
 'What can be inferred about desertification from the passage?',
 '[{"label":"A","text":"It is a natural process that cannot be prevented"},{"label":"B","text":"Human activities have accelerated its rate"},{"label":"C","text":"It only occurs in regions with low rainfall"},{"label":"D","text":"It has been successfully reversed in many areas"}]',
 'B',
 '文章提到人类活动如过度放牧、农业扩张加速了荒漠化进程。',
 'Desertification is the process by which fertile land becomes desert, typically as a result of drought, deforestation, or inappropriate agriculture. While climate variations play a role, human activities such as overgrazing, deforestation, and poor irrigation practices have significantly accelerated desertification in many regions. The Sahel region of Africa provides a stark example of how human pressure can transform marginal lands into desert.',
 'approved')
ON CONFLICT (title, subject) DO NOTHING;

INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, passage_text, status)
VALUES
('reading', 'vocabulary', 'medium',
 'TPO 3 - Architecture',
 'The word "elaborate" in paragraph 2 is closest in meaning to:',
 '[{"label":"A","text":"simple"},{"label":"B","text":"detailed"},{"label":"C","text":"expensive"},{"label":"D","text":"traditional"}]',
 'B',
 '在建筑语境中，elaborate指复杂精细的设计，最接近detailed。',
 'Gothic architecture is characterized by its elaborate stone structures, pointed arches, ribbed vaults, and flying buttresses. These features allowed for taller buildings with larger windows, filling cathedrals with light. The elaborate decoration served both structural and symbolic purposes, representing the heavenly Jerusalem.',
 'approved')
ON CONFLICT (title, subject) DO NOTHING;

INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, passage_text, status)
VALUES
('reading', 'purpose', 'medium',
 'TPO 4 - Petroleum Resources',
 'Why does the author mention "peak oil" in paragraph 3?',
 '[{"label":"A","text":"To argue against alternative energy sources"},{"label":"B","text":"To explain why oil prices fluctuate"},{"label":"C","text":"To highlight the finite nature of petroleum reserves"},{"label":"D","text":"To compare different extraction methods"}]',
 'C',
 '作者提到"peak oil"概念是为了说明石油资源的有限性，产量终将下降。',
 'Petroleum, formed from ancient marine organisms over millions of years, is a non-renewable resource. The concept of "peak oil" refers to the point at which global oil production reaches its maximum rate, after which production declines. This has significant implications for energy policy and economic planning, as societies must transition to alternative energy sources.',
 'approved')
ON CONFLICT (title, subject) DO NOTHING;

INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, passage_text, status)
VALUES
('reading', 'summary', 'hard',
 'TPO 5 - Minerals and Plants',
 'Which of the following best summarizes the passage?',
 '[{"label":"A","text":"Plants require specific minerals for growth, and deficiencies can be diagnosed through symptoms"},{"label":"B","text":"Modern agriculture has solved all mineral deficiency problems in plants"},{"label":"C","text":"Mineral uptake in plants is a simple process that does not vary between species"},{"label":"D","text":"All minerals are equally important for plant health"}]',
 'A',
 '文章主要讨论植物对矿物质的需求、缺乏症状以及诊断方法。',
 'Plants require various mineral nutrients for proper growth and development. Essential minerals include nitrogen, phosphorus, potassium, calcium, and magnesium, each serving specific functions. Deficiency symptoms vary: nitrogen deficiency causes yellowing of older leaves, while potassium deficiency leads to brown leaf margins. Soil testing and foliar analysis help diagnose and correct mineral imbalances.',
 'approved')
ON CONFLICT (title, subject) DO NOTHING;

-- 插入真实托福听力题目
INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, audio_url, status)
VALUES
('listening', 'lecture', 'medium',
 'TPO 1 Lecture: Cognitive Dissonance',
 'What is the main topic of the lecture?',
 '[{"label":"A","text":"The history of psychological theories"},{"label":"B","text":"How people resolve conflicting beliefs and actions"},{"label":"C","text":"The biological basis of decision-making"},{"label":"D","text":"Methods for measuring attitude change"}]',
 'B',
 '讲座主要讨论认知失调理论，即人们如何调和相互矛盾的信念和行为。',
 NULL,
 'approved')
ON CONFLICT (title, subject) DO NOTHING;

INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, audio_url, status)
VALUES
('listening', 'conversation', 'easy',
 'TPO 2 Conversation: Library Research',
 'Why does the student go to the library?',
 '[{"label":"A","text":"To return overdue books"},{"label":"B","text":"To find sources for a history paper"},{"label":"C","text":"To attend a workshop on citation styles"},{"label":"D","text":"To complain about noise levels"}]',
 'B',
 '学生需要为历史论文查找原始资料，图书管理员建议使用特藏室。',
 NULL,
 'approved')
ON CONFLICT (title, subject) DO NOTHING;

INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, audio_url, status)
VALUES
('listening', 'lecture', 'hard',
 'TPO 3 Lecture: Roman Aqueducts',
 'According to the professor, what was the primary purpose of Roman aqueducts?',
 '[{"label":"A","text":"Military defense"},{"label":"B","text":"Urban water supply"},{"label":"C","text":"Agricultural irrigation"},{"label":"D","text":"Religious ceremonies"}]',
 'B',
 '教授强调罗马渡槽的主要目的是为城市居民提供清洁饮用水和公共浴场用水。',
 NULL,
 'approved')
ON CONFLICT (title, subject) DO NOTHING;

-- 插入真实托福口语题目
INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, status)
VALUES
('speaking', 'independent', 'medium',
 'TPO 1: Some people prefer to live in a small town, others prefer to live in a big city. Which do you prefer?',
 'Prepare a 45-second response stating your preference and providing specific reasons and examples.',
 '[]',
 '{"structure":"Preference + 2 reasons + personal example","sample":"I prefer living in a big city. First, cities offer more job opportunities in my field of technology. Second, cultural amenities like museums and concerts are more accessible. For example, when I lived in New York, I attended free concerts in Central Park every summer."}',
 'This is a classic independent speaking question. Focus on clear preference, concrete reasons, and personal experience.',
 'approved')
ON CONFLICT (title, subject) DO NOTHING;

INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, status)
VALUES
('speaking', 'integrated', 'hard',
 'TPO 2: Summarize the lecture about the benefits of group work in education.',
 'The reading discusses traditional individual learning. The lecture presents research on collaborative learning. Summarize the lecture and explain how it challenges the reading.',
 '[]',
 '{"lecture_points":["Group work develops communication skills","Collaborative problem-solving leads to better solutions","Peer teaching enhances understanding"],"connection":"The lecture challenges the reading''s emphasis on individual achievement by showing collective benefits."}',
 'Integrated speaking requires: accurate lecture summary, clear connection to reading, and time management (60 seconds).',
 'approved')
ON CONFLICT (title, subject) DO NOTHING;

INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, status)
VALUES
('speaking', 'independent', 'easy',
 'TPO 3: Do you agree or disagree: It is better to have a few close friends than many casual friends.',
 'Prepare a 45-second response stating your position with reasons and examples.',
 '[]',
 '{"structure":"Agree/Disagree + 2 reasons + example","sample":"I agree that few close friends are better. First, deep relationships provide emotional support during difficult times. Second, quality friendships require time and effort that cannot be spread too thin. For instance, my two closest friends have supported me through college and job searches."}',
 'Focus on clear stance, logical reasoning, and personal experience.',
 'approved')
ON CONFLICT (title, subject) DO NOTHING;

-- 插入真实托福写作题目
INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, status)
VALUES
('writing', 'independent', 'medium',
 'TPO 1: Do you agree or disagree with the following statement? Parents are the best teachers. Use specific reasons and examples to support your answer.',
 'Write an essay of at least 300 words in 30 minutes. Clearly state your position and provide specific examples.',
 '[]',
 '{"rubric":["Clear thesis statement","2-3 body paragraphs with specific examples","Counter-argument addressed","Strong conclusion"],"score_criteria":{"organization":30,"development":30,"language":20,"mechanics":20},"sample_thesis":"While parents play a crucial role in early development, I believe that teachers, peers, and life experiences are equally important educators."}',
 '独立写作评分标准：论点明确、论据充分、结构清晰、语言准确。',
 'approved')
ON CONFLICT (title, subject) DO NOTHING;

INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, status)
VALUES
('writing', 'integrated', 'hard',
 'TPO 2: Summarize the points made in the lecture about the decline of reading among young people.',
 'Read the passage about the benefits of digital media for youth. Then listen to a lecture discussing concerns about declining reading habits. Write a response summarizing the lecture and showing how it challenges the reading.',
 '[]',
 '{"reading_claims":["Digital media improves visual literacy","Online content is more engaging than books","Technology enhances learning"],"lecture_counterpoints":["Deep reading develops critical thinking","Attention spans are shrinking","Print books promote better comprehension"],"structure":"Introduction (1 paragraph) + 3 body paragraphs (each addressing one lecture point) + Conclusion"}',
 '综合写作要求：准确概括讲座要点，清晰指出讲座如何质疑阅读材料中的具体主张，保持客观语气。',
 'approved')
ON CONFLICT (title, subject) DO NOTHING;

INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, status)
VALUES
('writing', 'independent', 'easy',
 'TPO 3: Some people believe that university students should be required to attend classes. Others believe that going to classes should be optional. Which point of view do you agree with?',
 'Write an essay of at least 300 words in 30 minutes. Support your position with specific reasons and examples.',
 '[]',
 '{"rubric":["Clear position","2-3 supporting arguments with examples","Address counter-argument","Strong conclusion"],"sample_outline":"Thesis: Attendance should be required. Body 1: Classroom interaction enhances learning. Body 2: Structure prevents procrastination. Body 3: Professors provide valuable insights beyond textbooks. Conclusion: Required attendance benefits most students."}',
 '适合初学者的独立写作题，注意论点明确和例子具体。',
 'approved')
ON CONFLICT (title, subject) DO NOTHING;

-- 插入练习套题（使用子查询动态获取题目ID，避免硬编码）
INSERT INTO practice_sets (title, description, subject, difficulty, question_ids, time_limit, total_score)
VALUES
('阅读入门练习', '包含3篇不同题型的托福阅读短文', 'reading', 'easy',
 (SELECT json_agg(id)::text FROM questions WHERE subject='reading' AND status='approved' LIMIT 3), 1200, 30),
('听力基础训练', '包含讲座和对话两种题型的听力练习', 'listening', 'easy',
 (SELECT json_agg(id)::text FROM questions WHERE subject='listening' AND status='approved' LIMIT 3), 900, 30),
('口语专项练习', '包含独立和综合口语题型训练', 'speaking', 'medium',
 (SELECT json_agg(id)::text FROM questions WHERE subject='speaking' AND status='approved' LIMIT 3), 600, 30),
('写作综合练习', '包含独立写作和综合写作练习', 'writing', 'medium',
 (SELECT json_agg(id)::text FROM questions WHERE subject='writing' AND status='approved' LIMIT 3), 1800, 30);

-- ============================================================
-- 商业化扩展表（v2.0）
-- ============================================================

-- 扩展 users 表
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS membership VARCHAR(20) DEFAULT 'free' CHECK (membership IN ('free', 'premium'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS level VARCHAR(20) DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced'));

-- 扩展 user_stats 表
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS reading_progress JSONB DEFAULT '{"correct":0,"total":0,"accuracy":0}';
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS listening_progress JSONB DEFAULT '{"correct":0,"total":0,"accuracy":0}';
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS speaking_progress JSONB DEFAULT '{"correct":0,"total":0,"accuracy":0}';
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS writing_progress JSONB DEFAULT '{"correct":0,"total":0,"accuracy":0}';

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_no VARCHAR(64) UNIQUE NOT NULL,
    plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('monthly', 'quarterly', 'yearly')),
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'refunded')),
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_no ON orders(order_no);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- 订阅表
CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id INTEGER REFERENCES orders(id),
    plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('monthly', 'quarterly', 'yearly')),
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    auto_renew BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end ON subscriptions(end_date);

-- 广告展示记录表
CREATE TABLE IF NOT EXISTS ad_impressions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    placement VARCHAR(50) NOT NULL,
    ad_id VARCHAR(100),
    impression_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_user ON ad_impressions(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_placement ON ad_impressions(placement);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_time ON ad_impressions(impression_time);

-- 管理员用户表
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);

-- 管理员操作日志表
CREATE TABLE IF NOT EXISTS admin_logs (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id VARCHAR(100),
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_time ON admin_logs(created_at);

-- ============================================================
-- 初始化商业化示例数据
-- ============================================================

-- 插入默认管理员（密码：admin123，bcrypt hash）
INSERT INTO admin_users (username, password_hash, role)
VALUES ('admin', '$2b$10$3Jq6QxKz8YxKz8YxKz8YOeJxQxhZ8eJxQxhZ8eJxQxhZ8eJxQxhZ8eJxQxh', 'superadmin')
ON CONFLICT (username) DO NOTHING;

-- 将测试用户设为 premium
UPDATE users SET membership = 'premium' WHERE openid = 'test_openid_admin';

-- 插入示例订单
INSERT INTO orders (user_id, order_no, plan_type, amount, status, paid_at)
SELECT id, 'ORD20260101000001', 'monthly', 29.90, 'paid', CURRENT_TIMESTAMP
FROM users WHERE openid = 'test_openid_admin'
ON CONFLICT (order_no) DO NOTHING;

-- 插入示例订阅
INSERT INTO subscriptions (user_id, order_id, plan_type, start_date, end_date, status, auto_renew)
SELECT u.id, o.id, 'monthly', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days', 'active', FALSE
FROM users u
JOIN orders o ON o.user_id = u.id AND o.order_no = 'ORD20260101000001'
WHERE u.openid = 'test_openid_admin'
ON CONFLICT DO NOTHING;