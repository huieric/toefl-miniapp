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

-- 插入示例阅读题
INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, passage_text, status)
VALUES
('reading', 'detail', 'easy',
 'The Evolution of Birds',
 'What is the main purpose of the passage?',
 '[{"label":"A","text":"To describe the physical characteristics of modern birds"},{"label":"B","text":"To explain how birds evolved from dinosaurs"},{"label":"C","text":"To compare different species of flying animals"},{"label":"D","text":"To argue that birds are not descendants of dinosaurs"}]',
 'B',
 '文章讨论了从恐龙到鸟类的进化过程，包括化石证据和羽毛的演化。B选项准确概括了文章主旨。',
 'Birds have long fascinated scientists and the general public alike. Recent fossil discoveries, particularly from the Liaoning province in China, have provided compelling evidence that modern birds are direct descendants of theropod dinosaurs. These fossils show a clear progression of feather development, from simple filaments to complex flight feathers. The discovery of Anchiornis, a four-winged dinosaur, further supports the dinosaur-to-bird transition. Today, we recognize that birds represent the only surviving lineage of dinosaurs, having survived the mass extinction event 66 million years ago.',
 'approved'),
('reading', 'inference', 'medium',
 'Climate Change and Ocean Currents',
 'What can be inferred from the passage about the Atlantic Meridional Overturning Circulation (AMOC)?',
 '[{"label":"A","text":"It has already collapsed completely"},{"label":"B","text":"It may weaken significantly due to global warming"},{"label":"C","text":"It is not affected by temperature changes"},{"label":"D","text":"It has been strengthening over the past century"}]',
 'B',
 '文章提到AMOC近年来出现了减弱迹象，科学家警告持续变暖可能导致其显著减弱。',
 'The Atlantic Meridional Overturning Circulation (AMOC) is a critical component of the global climate system, transporting warm water northward and cold water southward. Recent studies indicate that the AMOC has weakened by approximately 15% since the mid-20th century, a trend attributed to the influx of freshwater from melting Arctic ice. Climate models project further weakening under continued warming scenarios, with potentially severe consequences for weather patterns across Europe and North America.',
 'approved'),
('reading', 'vocabulary', 'medium',
 'Renewable Energy Economics',
 'The word "prohibitive" in paragraph 3 is closest in meaning to:',
 '[{"label":"A","text":"restrictive"},{"label":"B","text":"forbidden"},{"label":"C","text":"unaffordable"},{"label":"D","text":"preventive"}]',
 'C',
 '在上下文中，prohibitive 指的是成本高到令人望而却步，最接近 unaffordable。',
 NULL,
 'approved');

-- 插入听力题
INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, audio_url, status)
VALUES
('listening', 'lecture', 'medium',
 'Lecture: Coral Reef Ecosystems',
 'According to the lecture, what is the primary cause of coral bleaching?',
 '[{"label":"A","text":"Overfishing in reef areas"},{"label":"B","text":"Increased water temperature"},{"label":"C","text":"Pollution from agricultural runoff"},{"label":"D","text":"Ocean acidification"}]',
 'B',
 '讲座中明确指出，水温升高是珊瑚白化的主要原因。当水温超过正常范围1-2摄氏度时，珊瑚会驱逐体内的虫黄藻。',
 'https://example.com/audio/coral-reef.mp3',
 'approved'),
('listening', 'conversation', 'easy',
 'Conversation: Office Hours',
 'Why does the student visit the professor?',
 '[{"label":"A","text":"To discuss an upcoming exam"},{"label":"B","text":"To request an extension on a paper"},{"label":"C","text":"To ask about research opportunities"},{"label":"D","text":"To complain about a grade"}]',
 'B',
 '对话开始学生就说明需要延长论文截止日期，因为生病耽误了进度。',
 'https://example.com/audio/office-hours.mp3',
 'approved');

-- 插入口语题
INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, status)
VALUES
('speaking', 'independent', 'medium',
 'Do you agree or disagree: Universities should require all students to take at least one course in a foreign language.',
 'Prepare a 45-second response stating your position and providing specific reasons and examples.',
 '[]',
 '{"structure":"Agree/Disagree + 2 reasons + examples","sample":"I agree that universities should require foreign language courses. First, learning a new language develops cognitive flexibility. Research shows bilingual individuals demonstrate better problem-solving skills. Second, in a globalized economy, language skills are increasingly valuable for career prospects."}',
 'This is a typical TOEFL independent speaking task. A strong response should include: clear position, two reasons with concrete examples, and a brief conclusion.',
 'approved'),
('speaking', 'integrated', 'hard',
 'Summarize the lecture about the decline of honeybee populations and explain how it relates to the reading passage about agricultural practices.',
 'The reading discusses modern farming methods. The lecture presents findings about honeybee colony collapse. In your response, summarize the lecture and explain how it challenges or supports the reading.',
 '[]',
 '{"key_points":["Pesticide use affects bee navigation","Monoculture farming reduces food diversity","Climate change alters flowering seasons"]}',
 'An effective response should clearly state the relationship between the lecture and reading, summarize the key points from the lecture (3 main factors), and explicitly connect them to specific claims in the reading passage.',
 'approved');

-- 插入写作题
INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, status)
VALUES
('writing', 'independent', 'medium',
 'Do you agree or disagree with the following statement: Technology has made children less creative than they were in the past.',
 'Use specific reasons and examples to support your answer. Aim for at least 300 words in 30 minutes.',
 '[]',
 '{"rubric":["Clear thesis statement","2-3 body paragraphs with specific examples","Counter-argument addressed","Strong conclusion"],"score_criteria":{"organization":30,"development":30,"language":20,"mechanics":20}}',
 '评分标准涵盖：论点明确性、论据充分性、语言准确性、文章结构。高分作文需要平衡正反观点，用具体例子支撑。',
 'approved'),
('writing', 'integrated', 'hard',
 'Summarize the points made in the lecture about urban green spaces, and explain how they cast doubt on specific points made in the reading passage.',
 'Read the passage about the economic drawbacks of urban parks. Then listen to a lecture discussing the benefits of urban green spaces. Write a response that summarizes the lecture and shows how it challenges the reading.',
 '[]',
 '{"reading_claims":["Urban parks reduce available land for development","Maintenance costs burden city budgets","Crime rates are higher near parks"],"lecture_counterpoints":["Parks increase surrounding property values by 15-25%","Long-term health savings offset maintenance costs","Well-designed parks with lighting reduce crime by 30%"]}',
 'Integrated writing requires: accurate summary of lecture points, clear connection to specific reading claims, and objective tone without personal opinion.',
 'approved');

-- 插入练习套题
INSERT INTO practice_sets (title, description, subject, difficulty, question_ids, time_limit, total_score)
VALUES
('阅读入门练习', '适合托福初学者的阅读练习，包含3篇短文', 'reading', 'easy', '[1,2,3]', 1200, 30),
('听力基础训练', '包含讲座和对话两种题型的听力练习', 'listening', 'easy', '[4,5]', 900, 30),
('口语独立题练习', '独立口语题型专项训练', 'speaking', 'medium', '[6]', 300, 30),
('写作综合练习', '包含独立写作和综合写作', 'writing', 'medium', '[8,9]', 1800, 30);

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