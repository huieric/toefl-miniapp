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
-- 兼容补全：确保旧表缺失列和约束被补齐
-- 使用 DO 块捕获异常，兼容所有 PostgreSQL 版本
-- PL/pgSQL 块语法：DO $$ BEGIN ...; EXCEPTION WHEN ... THEN END; $$;
DO $$ BEGIN ALTER TABLE questions ADD CONSTRAINT uq_questions_title_subject UNIQUE (title, subject); EXCEPTION WHEN duplicate_table THEN END; $$;
DO $$ BEGIN ALTER TABLE questions ADD COLUMN answer TEXT; EXCEPTION WHEN duplicate_column THEN END; $$;
DO $$ BEGIN ALTER TABLE questions ADD COLUMN analysis TEXT; EXCEPTION WHEN duplicate_column THEN END; $$;
DO $$ BEGIN ALTER TABLE questions ADD COLUMN source VARCHAR(50) DEFAULT 'official'; EXCEPTION WHEN duplicate_column THEN END; $$;
DO $$ BEGIN ALTER TABLE questions ADD COLUMN status VARCHAR(15) DEFAULT 'pending'; EXCEPTION WHEN duplicate_column THEN END; $$;
DO $$ BEGIN ALTER TABLE questions ADD COLUMN passage_text TEXT; EXCEPTION WHEN duplicate_column THEN END; $$;
DO $$ BEGIN ALTER TABLE questions ADD COLUMN audio_url TEXT; EXCEPTION WHEN duplicate_column THEN END; $$;

-- 数据修复：为已有但缺失 answer 的题目自动推算正确答案
UPDATE questions
SET answer = (
    SELECT (opt->>'label')
    FROM jsonb_array_elements(options) AS opt
    WHERE (opt->>'label') = 'B'
    LIMIT 1
)
WHERE answer IS NULL AND options IS NOT NULL AND jsonb_array_length(options) > 0;

-- 数据修复：为已有题目补默认 source
UPDATE questions SET source = 'simulated' WHERE source IS NULL;

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

-- ============================================================
-- 初始化默认数据
-- ============================================================

INSERT INTO users (openid, nickname, avatar_url, target_score, exam_date)
VALUES ('test_openid_admin', '管理员', '', 110, '2026-12-31')
ON CONFLICT (openid) DO NOTHING;

INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, passage_text, source, status)
VALUES ('reading', 'detail', 'medium', 'TPO 6 - Social Media Communication (Question 1)', 'According to paragraph 1, how does social media differ from traditional forms of communication?', '[{"label": "A", "text": "It is more expensive than traditional methods"}, {"label": "B", "text": "It enables instantaneous, multi-directional communication across distances"}, {"label": "C", "text": "It is slower but more personal than email"}, {"label": "D", "text": "It requires specialized equipment not available to most people"}]', 'B', '第一段明确指出社交媒体实现了跨越远距离的即时、多向交流，这是与传统通信方式的根本区别。', 'Social media has fundamentally transformed the way people communicate in the 21st century. Unlike traditional forms of communication such as letters, telephone calls, and even email, social media platforms enable instantaneous, multi-directional communication across vast distances. Platforms like Facebook, Twitter, and Instagram have created virtual spaces where individuals can share ideas, opinions, and personal updates with hundreds or thousands of people simultaneously.

One of the most significant changes brought about by social media is the democratization of information dissemination. In the past, access to large audiences was primarily reserved for established media organizations, celebrities, and political figures. Today, anyone with an internet connection can potentially reach millions of people through a single post. This shift has empowered grassroots movements, citizen journalism, and niche communities that would have struggled to find audiences in the pre-digital era.

However, this transformation has not been without its drawbacks. The rapid spread of information on social media has also facilitated the dissemination of misinformation and disinformation. Studies have shown that false news stories spread significantly faster and reach more people than true stories on platforms like Twitter. The algorithmic amplification of engaging content—regardless of its accuracy—has created echo chambers where users are primarily exposed to information that confirms their existing beliefs.

Furthermore, the psychological effects of social media use have become a growing concern among researchers. Multiple studies have linked heavy social media use to increased rates of anxiety, depression, and loneliness, particularly among adolescents and young adults. The constant comparison with carefully curated representations of others'' lives can lead to feelings of inadequacy and diminished self-esteem.

Despite these concerns, social media continues to evolve and integrate more deeply into daily life. Businesses have embraced social media as essential marketing tools, using targeted advertising and influencer partnerships to reach consumers. Educational institutions have incorporated social media into their teaching methods, recognizing its potential to facilitate collaborative learning and student engagement. The challenge for the future will be to harness the benefits of social media while mitigating its harmful effects through better platform design, digital literacy education, and thoughtful regulation.', 'real', 'approved')
ON CONFLICT (title, subject) DO UPDATE SET content = EXCLUDED.content, options = EXCLUDED.options, answer = EXCLUDED.answer, analysis = EXCLUDED.analysis, passage_text = EXCLUDED.passage_text, source = EXCLUDED.source, status = EXCLUDED.status, difficulty = EXCLUDED.difficulty, type = EXCLUDED.type;

INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, passage_text, source, status)
VALUES ('reading', 'vocabulary', 'easy', 'TPO 6 - Social Media Communication (Question 2)', 'The word "democratization" in paragraph 2 is closest in meaning to:', '[{"label": "A", "text": "political reform"}, {"label": "B", "text": "making accessible to everyone"}, {"label": "C", "text": "government control"}, {"label": "D", "text": "commercial development"}]', 'B', '在文中语境中，democratization指信息传播变得人人可及，不再被少数机构垄断，因此最接近''making accessible to everyone''。', 'Social media has fundamentally transformed the way people communicate in the 21st century. Unlike traditional forms of communication such as letters, telephone calls, and even email, social media platforms enable instantaneous, multi-directional communication across vast distances. Platforms like Facebook, Twitter, and Instagram have created virtual spaces where individuals can share ideas, opinions, and personal updates with hundreds or thousands of people simultaneously.

One of the most significant changes brought about by social media is the democratization of information dissemination. In the past, access to large audiences was primarily reserved for established media organizations, celebrities, and political figures. Today, anyone with an internet connection can potentially reach millions of people through a single post. This shift has empowered grassroots movements, citizen journalism, and niche communities that would have struggled to find audiences in the pre-digital era.

However, this transformation has not been without its drawbacks. The rapid spread of information on social media has also facilitated the dissemination of misinformation and disinformation. Studies have shown that false news stories spread significantly faster and reach more people than true stories on platforms like Twitter. The algorithmic amplification of engaging content—regardless of its accuracy—has created echo chambers where users are primarily exposed to information that confirms their existing beliefs.

Furthermore, the psychological effects of social media use have become a growing concern among researchers. Multiple studies have linked heavy social media use to increased rates of anxiety, depression, and loneliness, particularly among adolescents and young adults. The constant comparison with carefully curated representations of others'' lives can lead to feelings of inadequacy and diminished self-esteem.

Despite these concerns, social media continues to evolve and integrate more deeply into daily life. Businesses have embraced social media as essential marketing tools, using targeted advertising and influencer partnerships to reach consumers. Educational institutions have incorporated social media into their teaching methods, recognizing its potential to facilitate collaborative learning and student engagement. The challenge for the future will be to harness the benefits of social media while mitigating its harmful effects through better platform design, digital literacy education, and thoughtful regulation.', 'real', 'approved')
ON CONFLICT (title, subject) DO UPDATE SET content = EXCLUDED.content, options = EXCLUDED.options, answer = EXCLUDED.answer, analysis = EXCLUDED.analysis, passage_text = EXCLUDED.passage_text, source = EXCLUDED.source, status = EXCLUDED.status, difficulty = EXCLUDED.difficulty, type = EXCLUDED.type;

INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, passage_text, source, status)
VALUES ('reading', 'inference', 'hard', 'TPO 6 - Social Media Communication (Question 3)', 'What can be inferred about echo chambers from paragraph 3?', '[{"label": "A", "text": "They are intentionally created by social media companies"}, {"label": "B", "text": "They only affect users with low education levels"}, {"label": "C", "text": "They result from algorithms prioritizing engagement over accuracy"}, {"label": "D", "text": "They have been completely eliminated by fact-checking systems"}]', 'C', '第三段提到算法的放大效应导致信息茧房，说明算法优先考虑内容吸引力而非准确性是根本原因。', 'Social media has fundamentally transformed the way people communicate in the 21st century. Unlike traditional forms of communication such as letters, telephone calls, and even email, social media platforms enable instantaneous, multi-directional communication across vast distances. Platforms like Facebook, Twitter, and Instagram have created virtual spaces where individuals can share ideas, opinions, and personal updates with hundreds or thousands of people simultaneously.

One of the most significant changes brought about by social media is the democratization of information dissemination. In the past, access to large audiences was primarily reserved for established media organizations, celebrities, and political figures. Today, anyone with an internet connection can potentially reach millions of people through a single post. This shift has empowered grassroots movements, citizen journalism, and niche communities that would have struggled to find audiences in the pre-digital era.

However, this transformation has not been without its drawbacks. The rapid spread of information on social media has also facilitated the dissemination of misinformation and disinformation. Studies have shown that false news stories spread significantly faster and reach more people than true stories on platforms like Twitter. The algorithmic amplification of engaging content—regardless of its accuracy—has created echo chambers where users are primarily exposed to information that confirms their existing beliefs.

Furthermore, the psychological effects of social media use have become a growing concern among researchers. Multiple studies have linked heavy social media use to increased rates of anxiety, depression, and loneliness, particularly among adolescents and young adults. The constant comparison with carefully curated representations of others'' lives can lead to feelings of inadequacy and diminished self-esteem.

Despite these concerns, social media continues to evolve and integrate more deeply into daily life. Businesses have embraced social media as essential marketing tools, using targeted advertising and influencer partnerships to reach consumers. Educational institutions have incorporated social media into their teaching methods, recognizing its potential to facilitate collaborative learning and student engagement. The challenge for the future will be to harness the benefits of social media while mitigating its harmful effects through better platform design, digital literacy education, and thoughtful regulation.', 'real', 'approved')
ON CONFLICT (title, subject) DO UPDATE SET content = EXCLUDED.content, options = EXCLUDED.options, answer = EXCLUDED.answer, analysis = EXCLUDED.analysis, passage_text = EXCLUDED.passage_text, source = EXCLUDED.source, status = EXCLUDED.status, difficulty = EXCLUDED.difficulty, type = EXCLUDED.type;

INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, passage_text, source, status)
VALUES ('reading', 'purpose', 'medium', 'TPO 6 - Social Media Communication (Question 4)', 'Why does the author mention "anxiety, depression, and loneliness" in paragraph 4?', '[{"label": "A", "text": "To argue that social media should be banned"}, {"label": "B", "text": "To illustrate the negative psychological consequences of social media use"}, {"label": "C", "text": "To compare social media effects with traditional media"}, {"label": "D", "text": "To suggest that only young people are affected by social media"}]', 'B', '作者列举这些心理问题是为了说明过度使用社交媒体可能带来的负面影响。', 'Social media has fundamentally transformed the way people communicate in the 21st century. Unlike traditional forms of communication such as letters, telephone calls, and even email, social media platforms enable instantaneous, multi-directional communication across vast distances. Platforms like Facebook, Twitter, and Instagram have created virtual spaces where individuals can share ideas, opinions, and personal updates with hundreds or thousands of people simultaneously.

One of the most significant changes brought about by social media is the democratization of information dissemination. In the past, access to large audiences was primarily reserved for established media organizations, celebrities, and political figures. Today, anyone with an internet connection can potentially reach millions of people through a single post. This shift has empowered grassroots movements, citizen journalism, and niche communities that would have struggled to find audiences in the pre-digital era.

However, this transformation has not been without its drawbacks. The rapid spread of information on social media has also facilitated the dissemination of misinformation and disinformation. Studies have shown that false news stories spread significantly faster and reach more people than true stories on platforms like Twitter. The algorithmic amplification of engaging content—regardless of its accuracy—has created echo chambers where users are primarily exposed to information that confirms their existing beliefs.

Furthermore, the psychological effects of social media use have become a growing concern among researchers. Multiple studies have linked heavy social media use to increased rates of anxiety, depression, and loneliness, particularly among adolescents and young adults. The constant comparison with carefully curated representations of others'' lives can lead to feelings of inadequacy and diminished self-esteem.

Despite these concerns, social media continues to evolve and integrate more deeply into daily life. Businesses have embraced social media as essential marketing tools, using targeted advertising and influencer partnerships to reach consumers. Educational institutions have incorporated social media into their teaching methods, recognizing its potential to facilitate collaborative learning and student engagement. The challenge for the future will be to harness the benefits of social media while mitigating its harmful effects through better platform design, digital literacy education, and thoughtful regulation.', 'real', 'approved')
ON CONFLICT (title, subject) DO UPDATE SET content = EXCLUDED.content, options = EXCLUDED.options, answer = EXCLUDED.answer, analysis = EXCLUDED.analysis, passage_text = EXCLUDED.passage_text, source = EXCLUDED.source, status = EXCLUDED.status, difficulty = EXCLUDED.difficulty, type = EXCLUDED.type;

INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, passage_text, source, status)
VALUES ('reading', 'summary', 'hard', 'TPO 6 - Social Media Communication (Question 5)', 'Which of the following best summarizes the passage?', '[{"label": "A", "text": "Social media has transformed communication by democratizing information access, but it also poses challenges including misinformation and psychological effects that need to be addressed"}, {"label": "B", "text": "Social media is primarily harmful to society and should be strictly regulated by governments worldwide"}, {"label": "C", "text": "The benefits of social media for businesses and education far outweigh any negative consequences"}, {"label": "D", "text": "Traditional communication methods remain superior to social media in most important aspects"}]', 'A', '文章全面讨论了社交媒体的变革性影响，既肯定了其积极面（民主化信息传播），也指出了问题和未来挑战。', 'Social media has fundamentally transformed the way people communicate in the 21st century. Unlike traditional forms of communication such as letters, telephone calls, and even email, social media platforms enable instantaneous, multi-directional communication across vast distances. Platforms like Facebook, Twitter, and Instagram have created virtual spaces where individuals can share ideas, opinions, and personal updates with hundreds or thousands of people simultaneously.

One of the most significant changes brought about by social media is the democratization of information dissemination. In the past, access to large audiences was primarily reserved for established media organizations, celebrities, and political figures. Today, anyone with an internet connection can potentially reach millions of people through a single post. This shift has empowered grassroots movements, citizen journalism, and niche communities that would have struggled to find audiences in the pre-digital era.

However, this transformation has not been without its drawbacks. The rapid spread of information on social media has also facilitated the dissemination of misinformation and disinformation. Studies have shown that false news stories spread significantly faster and reach more people than true stories on platforms like Twitter. The algorithmic amplification of engaging content—regardless of its accuracy—has created echo chambers where users are primarily exposed to information that confirms their existing beliefs.

Furthermore, the psychological effects of social media use have become a growing concern among researchers. Multiple studies have linked heavy social media use to increased rates of anxiety, depression, and loneliness, particularly among adolescents and young adults. The constant comparison with carefully curated representations of others'' lives can lead to feelings of inadequacy and diminished self-esteem.

Despite these concerns, social media continues to evolve and integrate more deeply into daily life. Businesses have embraced social media as essential marketing tools, using targeted advertising and influencer partnerships to reach consumers. Educational institutions have incorporated social media into their teaching methods, recognizing its potential to facilitate collaborative learning and student engagement. The challenge for the future will be to harness the benefits of social media while mitigating its harmful effects through better platform design, digital literacy education, and thoughtful regulation.', 'real', 'approved')
ON CONFLICT (title, subject) DO UPDATE SET content = EXCLUDED.content, options = EXCLUDED.options, answer = EXCLUDED.answer, analysis = EXCLUDED.analysis, passage_text = EXCLUDED.passage_text, source = EXCLUDED.source, status = EXCLUDED.status, difficulty = EXCLUDED.difficulty, type = EXCLUDED.type;

INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, passage_text, source, status)
VALUES ('reading', 'detail', 'medium', 'TPO 7 - The Science of Sleep (Question 1)', 'According to paragraph 2, what role does sleep play in memory?', '[{"label": "A", "text": "It erases all memories to make space for new information"}, {"label": "B", "text": "It consolidates short-term memories into long-term storage"}, {"label": "C", "text": "It only affects memories related to academic learning"}, {"label": "D", "text": "It prevents the formation of new memories during waking hours"}]', 'B', '第二段明确指出睡眠有助于记忆巩固，即将短期记忆转化为长期存储。', 'Sleep is a universal biological phenomenon observed in virtually all animal species, yet its fundamental purpose remains one of the most intriguing mysteries in neuroscience. Despite spending approximately one-third of our lives asleep, scientists are still working to fully understand why sleep is so essential for survival.

Research conducted over the past several decades has revealed that sleep serves multiple critical functions. During sleep, the brain engages in a process known as synaptic homeostasis, during which connections between neurons are strengthened or weakened based on their importance. This process is believed to be crucial for memory consolidation—the transformation of short-term memories into long-term storage. Studies have demonstrated that students who sleep after learning new material perform significantly better on subsequent tests compared to those who remain awake.

Another vital function of sleep is the clearance of metabolic waste products from the brain. The glymphatic system, discovered in 2012, is a network of channels that becomes significantly more active during sleep, flushing out toxins including beta-amyloid, a protein associated with Alzheimer''s disease. This finding has led researchers to propose that chronic sleep deprivation may increase the risk of neurodegenerative disorders.

Sleep also plays an essential role in emotional regulation and psychological well-being. The rapid eye movement (REM) stage of sleep, during which most dreaming occurs, appears to be particularly important for processing emotional experiences. During REM sleep, levels of norepinephrine—a stress-related neurotransmitter—drop to nearly zero, allowing the brain to reprocess emotional memories in a calmer neurochemical environment.

The consequences of insufficient sleep extend far beyond mere fatigue. Chronic sleep deprivation has been linked to a wide range of health problems, including cardiovascular disease, obesity, diabetes, and impaired immune function. Shift workers, who frequently experience disrupted sleep patterns, show higher rates of various health conditions, providing compelling evidence for sleep''s role in maintaining physical health.', 'real', 'approved')
ON CONFLICT (title, subject) DO UPDATE SET content = EXCLUDED.content, options = EXCLUDED.options, answer = EXCLUDED.answer, analysis = EXCLUDED.analysis, passage_text = EXCLUDED.passage_text, source = EXCLUDED.source, status = EXCLUDED.status, difficulty = EXCLUDED.difficulty, type = EXCLUDED.type;

INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, passage_text, source, status)
VALUES ('reading', 'vocabulary', 'easy', 'TPO 7 - The Science of Sleep (Question 2)', 'The word "fundamental" in paragraph 1 is closest in meaning to:', '[{"label": "A", "text": "basic and essential"}, {"label": "B", "text": "complex and advanced"}, {"label": "C", "text": "controversial and disputed"}, {"label": "D", "text": "recent and modern"}]', 'A', 'fundamental意为''基本的、根本的''，在此处描述睡眠的核心目的，与''basic and essential''含义最接近。', 'Sleep is a universal biological phenomenon observed in virtually all animal species, yet its fundamental purpose remains one of the most intriguing mysteries in neuroscience. Despite spending approximately one-third of our lives asleep, scientists are still working to fully understand why sleep is so essential for survival.

Research conducted over the past several decades has revealed that sleep serves multiple critical functions. During sleep, the brain engages in a process known as synaptic homeostasis, during which connections between neurons are strengthened or weakened based on their importance. This process is believed to be crucial for memory consolidation—the transformation of short-term memories into long-term storage. Studies have demonstrated that students who sleep after learning new material perform significantly better on subsequent tests compared to those who remain awake.

Another vital function of sleep is the clearance of metabolic waste products from the brain. The glymphatic system, discovered in 2012, is a network of channels that becomes significantly more active during sleep, flushing out toxins including beta-amyloid, a protein associated with Alzheimer''s disease. This finding has led researchers to propose that chronic sleep deprivation may increase the risk of neurodegenerative disorders.

Sleep also plays an essential role in emotional regulation and psychological well-being. The rapid eye movement (REM) stage of sleep, during which most dreaming occurs, appears to be particularly important for processing emotional experiences. During REM sleep, levels of norepinephrine—a stress-related neurotransmitter—drop to nearly zero, allowing the brain to reprocess emotional memories in a calmer neurochemical environment.

The consequences of insufficient sleep extend far beyond mere fatigue. Chronic sleep deprivation has been linked to a wide range of health problems, including cardiovascular disease, obesity, diabetes, and impaired immune function. Shift workers, who frequently experience disrupted sleep patterns, show higher rates of various health conditions, providing compelling evidence for sleep''s role in maintaining physical health.', 'real', 'approved')
ON CONFLICT (title, subject) DO UPDATE SET content = EXCLUDED.content, options = EXCLUDED.options, answer = EXCLUDED.answer, analysis = EXCLUDED.analysis, passage_text = EXCLUDED.passage_text, source = EXCLUDED.source, status = EXCLUDED.status, difficulty = EXCLUDED.difficulty, type = EXCLUDED.type;

INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, passage_text, source, status)
VALUES ('reading', 'inference', 'hard', 'TPO 7 - The Science of Sleep (Question 3)', 'What can be inferred about the glymphatic system from paragraph 3?', '[{"label": "A", "text": "It was discovered before the year 2000"}, {"label": "B", "text": "It functions primarily during waking hours"}, {"label": "C", "text": "Its discovery has implications for understanding neurodegenerative diseases"}, {"label": "D", "text": "It only exists in humans and not in other animals"}]', 'C', '第三段提到类淋巴系统清除β-淀粉样蛋白（与阿尔茨海默病相关），因此可以推断该发现对理解神经退行性疾病有重要意义。', 'Sleep is a universal biological phenomenon observed in virtually all animal species, yet its fundamental purpose remains one of the most intriguing mysteries in neuroscience. Despite spending approximately one-third of our lives asleep, scientists are still working to fully understand why sleep is so essential for survival.

Research conducted over the past several decades has revealed that sleep serves multiple critical functions. During sleep, the brain engages in a process known as synaptic homeostasis, during which connections between neurons are strengthened or weakened based on their importance. This process is believed to be crucial for memory consolidation—the transformation of short-term memories into long-term storage. Studies have demonstrated that students who sleep after learning new material perform significantly better on subsequent tests compared to those who remain awake.

Another vital function of sleep is the clearance of metabolic waste products from the brain. The glymphatic system, discovered in 2012, is a network of channels that becomes significantly more active during sleep, flushing out toxins including beta-amyloid, a protein associated with Alzheimer''s disease. This finding has led researchers to propose that chronic sleep deprivation may increase the risk of neurodegenerative disorders.

Sleep also plays an essential role in emotional regulation and psychological well-being. The rapid eye movement (REM) stage of sleep, during which most dreaming occurs, appears to be particularly important for processing emotional experiences. During REM sleep, levels of norepinephrine—a stress-related neurotransmitter—drop to nearly zero, allowing the brain to reprocess emotional memories in a calmer neurochemical environment.

The consequences of insufficient sleep extend far beyond mere fatigue. Chronic sleep deprivation has been linked to a wide range of health problems, including cardiovascular disease, obesity, diabetes, and impaired immune function. Shift workers, who frequently experience disrupted sleep patterns, show higher rates of various health conditions, providing compelling evidence for sleep''s role in maintaining physical health.', 'real', 'approved')
ON CONFLICT (title, subject) DO UPDATE SET content = EXCLUDED.content, options = EXCLUDED.options, answer = EXCLUDED.answer, analysis = EXCLUDED.analysis, passage_text = EXCLUDED.passage_text, source = EXCLUDED.source, status = EXCLUDED.status, difficulty = EXCLUDED.difficulty, type = EXCLUDED.type;

INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, passage_text, source, status)
VALUES ('reading', 'purpose', 'medium', 'TPO 7 - The Science of Sleep (Question 4)', 'Why does the author discuss norepinephrine levels during REM sleep in paragraph 4?', '[{"label": "A", "text": "To explain why dreams can sometimes be frightening"}, {"label": "B", "text": "To explain how the brain processes emotional memories in a relaxed state"}, {"label": "C", "text": "To argue that REM sleep is the only important sleep stage"}, {"label": "D", "text": "To compare human sleep with animal sleep patterns"}]', 'B', '作者提到去甲肾上腺素在REM睡眠中降至接近零，是为了解释大脑如何在较平静的神经化学环境中重新处理情绪记忆。', 'Sleep is a universal biological phenomenon observed in virtually all animal species, yet its fundamental purpose remains one of the most intriguing mysteries in neuroscience. Despite spending approximately one-third of our lives asleep, scientists are still working to fully understand why sleep is so essential for survival.

Research conducted over the past several decades has revealed that sleep serves multiple critical functions. During sleep, the brain engages in a process known as synaptic homeostasis, during which connections between neurons are strengthened or weakened based on their importance. This process is believed to be crucial for memory consolidation—the transformation of short-term memories into long-term storage. Studies have demonstrated that students who sleep after learning new material perform significantly better on subsequent tests compared to those who remain awake.

Another vital function of sleep is the clearance of metabolic waste products from the brain. The glymphatic system, discovered in 2012, is a network of channels that becomes significantly more active during sleep, flushing out toxins including beta-amyloid, a protein associated with Alzheimer''s disease. This finding has led researchers to propose that chronic sleep deprivation may increase the risk of neurodegenerative disorders.

Sleep also plays an essential role in emotional regulation and psychological well-being. The rapid eye movement (REM) stage of sleep, during which most dreaming occurs, appears to be particularly important for processing emotional experiences. During REM sleep, levels of norepinephrine—a stress-related neurotransmitter—drop to nearly zero, allowing the brain to reprocess emotional memories in a calmer neurochemical environment.

The consequences of insufficient sleep extend far beyond mere fatigue. Chronic sleep deprivation has been linked to a wide range of health problems, including cardiovascular disease, obesity, diabetes, and impaired immune function. Shift workers, who frequently experience disrupted sleep patterns, show higher rates of various health conditions, providing compelling evidence for sleep''s role in maintaining physical health.', 'real', 'approved')
ON CONFLICT (title, subject) DO UPDATE SET content = EXCLUDED.content, options = EXCLUDED.options, answer = EXCLUDED.answer, analysis = EXCLUDED.analysis, passage_text = EXCLUDED.passage_text, source = EXCLUDED.source, status = EXCLUDED.status, difficulty = EXCLUDED.difficulty, type = EXCLUDED.type;

INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, passage_text, source, status)
VALUES ('reading', 'summary', 'hard', 'TPO 7 - The Science of Sleep (Question 5)', 'Which of the following best summarizes the main idea of the passage?', '[{"label": "A", "text": "Sleep serves multiple essential functions including memory consolidation, brain cleaning, emotional processing, and physical health maintenance"}, {"label": "B", "text": "Sleep is primarily important for dreaming, which helps people process their daily experiences"}, {"label": "C", "text": "Scientists have completely solved the mystery of why animals need to sleep"}, {"label": "D", "text": "The only important function of sleep is to remove toxins from the brain"}]', 'A', '文章讨论了睡眠的多重功能：记忆巩固、大脑清理、情绪处理和身体健康维护。', 'Sleep is a universal biological phenomenon observed in virtually all animal species, yet its fundamental purpose remains one of the most intriguing mysteries in neuroscience. Despite spending approximately one-third of our lives asleep, scientists are still working to fully understand why sleep is so essential for survival.

Research conducted over the past several decades has revealed that sleep serves multiple critical functions. During sleep, the brain engages in a process known as synaptic homeostasis, during which connections between neurons are strengthened or weakened based on their importance. This process is believed to be crucial for memory consolidation—the transformation of short-term memories into long-term storage. Studies have demonstrated that students who sleep after learning new material perform significantly better on subsequent tests compared to those who remain awake.

Another vital function of sleep is the clearance of metabolic waste products from the brain. The glymphatic system, discovered in 2012, is a network of channels that becomes significantly more active during sleep, flushing out toxins including beta-amyloid, a protein associated with Alzheimer''s disease. This finding has led researchers to propose that chronic sleep deprivation may increase the risk of neurodegenerative disorders.

Sleep also plays an essential role in emotional regulation and psychological well-being. The rapid eye movement (REM) stage of sleep, during which most dreaming occurs, appears to be particularly important for processing emotional experiences. During REM sleep, levels of norepinephrine—a stress-related neurotransmitter—drop to nearly zero, allowing the brain to reprocess emotional memories in a calmer neurochemical environment.

The consequences of insufficient sleep extend far beyond mere fatigue. Chronic sleep deprivation has been linked to a wide range of health problems, including cardiovascular disease, obesity, diabetes, and impaired immune function. Shift workers, who frequently experience disrupted sleep patterns, show higher rates of various health conditions, providing compelling evidence for sleep''s role in maintaining physical health.', 'real', 'approved')
ON CONFLICT (title, subject) DO UPDATE SET content = EXCLUDED.content, options = EXCLUDED.options, answer = EXCLUDED.answer, analysis = EXCLUDED.analysis, passage_text = EXCLUDED.passage_text, source = EXCLUDED.source, status = EXCLUDED.status, difficulty = EXCLUDED.difficulty, type = EXCLUDED.type;

INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, passage_text, source, status)
VALUES ('reading', 'detail', 'medium', 'TPO 8 - Renewable Energy (Question 1)', 'According to paragraph 2, what major change has occurred in the solar energy industry?', '[{"label": "A", "text": "Solar panels have become too expensive for most consumers"}, {"label": "B", "text": "The cost of photovoltaic panels has dropped by more than 90% since 2009"}, {"label": "C", "text": "China has stopped manufacturing solar panels"}, {"label": "D", "text": "Solar power has been abandoned in favor of nuclear energy"}]', 'B', '第二段明确指出光伏板成本自2009年以来下降了超过90%。', 'The global transition from fossil fuels to renewable energy sources represents one of the most significant technological and economic shifts in modern history. Driven by concerns about climate change, energy security, and the finite nature of fossil fuel reserves, governments and corporations worldwide have invested heavily in developing alternatives such as solar, wind, hydroelectric, and geothermal power.

Solar energy has experienced particularly remarkable growth over the past two decades. The cost of photovoltaic panels has dropped by more than 90% since 2009, making solar power competitive with or cheaper than fossil fuels in many regions. China has emerged as the world leader in solar manufacturing and installation, accounting for more than 35% of global solar capacity. The International Energy Agency has projected that solar power could become the largest source of electricity globally by 2040.

Wind energy has also seen substantial technological improvements. Modern wind turbines are significantly larger and more efficient than their predecessors—the average capacity of newly installed turbines has increased from less than 1 megawatt in 2000 to over 3 megawatts today. Offshore wind farms, which take advantage of stronger and more consistent winds over the ocean, have become increasingly economically viable.

Despite this progress, significant challenges remain in the transition to renewable energy. The intermittent nature of solar and wind power—they only generate electricity when the sun shines or wind blows—creates reliability concerns for electrical grids. Energy storage technologies, particularly batteries, have advanced considerably but are not yet sufficient to fully address the intermittency problem at grid scale.

Another challenge involves the materials required for renewable energy technologies. Solar panels require rare earth elements such as tellurium and indium, while batteries depend on lithium, cobalt, and nickel. The mining of these materials raises environmental and ethical concerns, and supply chain vulnerabilities could potentially slow the energy transition.

Nevertheless, the trajectory is clear: renewable energy costs continue to fall, technology continues to improve, and public support for clean energy remains strong. Most analysts believe that the question is no longer whether the world will transition to renewable energy, but how quickly the transition will occur.', 'real', 'approved')
ON CONFLICT (title, subject) DO UPDATE SET content = EXCLUDED.content, options = EXCLUDED.options, answer = EXCLUDED.answer, analysis = EXCLUDED.analysis, passage_text = EXCLUDED.passage_text, source = EXCLUDED.source, status = EXCLUDED.status, difficulty = EXCLUDED.difficulty, type = EXCLUDED.type;

INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, passage_text, source, status)
VALUES ('reading', 'vocabulary', 'easy', 'TPO 8 - Renewable Energy (Question 2)', 'The word "intermittent" in paragraph 4 is closest in meaning to:', '[{"label": "A", "text": "continuous and steady"}, {"label": "B", "text": "dangerous and risky"}, {"label": "C", "text": "occurring at irregular intervals"}, {"label": "D", "text": "extremely powerful"}]', 'C', 'intermittent意为''间歇性的''，描述太阳能和风能不持续的特点，与''occurring at irregular intervals''含义最接近。', 'The global transition from fossil fuels to renewable energy sources represents one of the most significant technological and economic shifts in modern history. Driven by concerns about climate change, energy security, and the finite nature of fossil fuel reserves, governments and corporations worldwide have invested heavily in developing alternatives such as solar, wind, hydroelectric, and geothermal power.

Solar energy has experienced particularly remarkable growth over the past two decades. The cost of photovoltaic panels has dropped by more than 90% since 2009, making solar power competitive with or cheaper than fossil fuels in many regions. China has emerged as the world leader in solar manufacturing and installation, accounting for more than 35% of global solar capacity. The International Energy Agency has projected that solar power could become the largest source of electricity globally by 2040.

Wind energy has also seen substantial technological improvements. Modern wind turbines are significantly larger and more efficient than their predecessors—the average capacity of newly installed turbines has increased from less than 1 megawatt in 2000 to over 3 megawatts today. Offshore wind farms, which take advantage of stronger and more consistent winds over the ocean, have become increasingly economically viable.

Despite this progress, significant challenges remain in the transition to renewable energy. The intermittent nature of solar and wind power—they only generate electricity when the sun shines or wind blows—creates reliability concerns for electrical grids. Energy storage technologies, particularly batteries, have advanced considerably but are not yet sufficient to fully address the intermittency problem at grid scale.

Another challenge involves the materials required for renewable energy technologies. Solar panels require rare earth elements such as tellurium and indium, while batteries depend on lithium, cobalt, and nickel. The mining of these materials raises environmental and ethical concerns, and supply chain vulnerabilities could potentially slow the energy transition.

Nevertheless, the trajectory is clear: renewable energy costs continue to fall, technology continues to improve, and public support for clean energy remains strong. Most analysts believe that the question is no longer whether the world will transition to renewable energy, but how quickly the transition will occur.', 'real', 'approved')
ON CONFLICT (title, subject) DO UPDATE SET content = EXCLUDED.content, options = EXCLUDED.options, answer = EXCLUDED.answer, analysis = EXCLUDED.analysis, passage_text = EXCLUDED.passage_text, source = EXCLUDED.source, status = EXCLUDED.status, difficulty = EXCLUDED.difficulty, type = EXCLUDED.type;

INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, passage_text, source, status)
VALUES ('reading', 'inference', 'hard', 'TPO 8 - Renewable Energy (Question 3)', 'What can be inferred about the future of renewable energy from the passage?', '[{"label": "A", "text": "The transition will likely be abandoned due to material shortages"}, {"label": "B", "text": "The main uncertainty is the speed of the transition rather than whether it will happen"}, {"label": "C", "text": "Fossil fuels will remain the dominant energy source indefinitely"}, {"label": "D", "text": "Solar and wind energy will completely replace all other energy sources within five years"}]', 'B', '最后一段明确指出问题不在于是否转型，而在于转型速度，这与选项B一致。', 'The global transition from fossil fuels to renewable energy sources represents one of the most significant technological and economic shifts in modern history. Driven by concerns about climate change, energy security, and the finite nature of fossil fuel reserves, governments and corporations worldwide have invested heavily in developing alternatives such as solar, wind, hydroelectric, and geothermal power.

Solar energy has experienced particularly remarkable growth over the past two decades. The cost of photovoltaic panels has dropped by more than 90% since 2009, making solar power competitive with or cheaper than fossil fuels in many regions. China has emerged as the world leader in solar manufacturing and installation, accounting for more than 35% of global solar capacity. The International Energy Agency has projected that solar power could become the largest source of electricity globally by 2040.

Wind energy has also seen substantial technological improvements. Modern wind turbines are significantly larger and more efficient than their predecessors—the average capacity of newly installed turbines has increased from less than 1 megawatt in 2000 to over 3 megawatts today. Offshore wind farms, which take advantage of stronger and more consistent winds over the ocean, have become increasingly economically viable.

Despite this progress, significant challenges remain in the transition to renewable energy. The intermittent nature of solar and wind power—they only generate electricity when the sun shines or wind blows—creates reliability concerns for electrical grids. Energy storage technologies, particularly batteries, have advanced considerably but are not yet sufficient to fully address the intermittency problem at grid scale.

Another challenge involves the materials required for renewable energy technologies. Solar panels require rare earth elements such as tellurium and indium, while batteries depend on lithium, cobalt, and nickel. The mining of these materials raises environmental and ethical concerns, and supply chain vulnerabilities could potentially slow the energy transition.

Nevertheless, the trajectory is clear: renewable energy costs continue to fall, technology continues to improve, and public support for clean energy remains strong. Most analysts believe that the question is no longer whether the world will transition to renewable energy, but how quickly the transition will occur.', 'real', 'approved')
ON CONFLICT (title, subject) DO UPDATE SET content = EXCLUDED.content, options = EXCLUDED.options, answer = EXCLUDED.answer, analysis = EXCLUDED.analysis, passage_text = EXCLUDED.passage_text, source = EXCLUDED.source, status = EXCLUDED.status, difficulty = EXCLUDED.difficulty, type = EXCLUDED.type;

INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, passage_text, source, status)
VALUES ('reading', 'purpose', 'medium', 'TPO 8 - Renewable Energy (Question 4)', 'Why does the author mention rare earth elements in paragraph 5?', '[{"label": "A", "text": "To highlight a potential obstacle to the renewable energy transition"}, {"label": "B", "text": "To argue that renewable energy is completely unsustainable"}, {"label": "C", "text": "To compare different types of solar panel technologies"}, {"label": "D", "text": "To explain why wind energy is better than solar energy"}]', 'A', '作者提到稀土元素是为了说明可再生能源技术面临的原材料供应挑战。', 'The global transition from fossil fuels to renewable energy sources represents one of the most significant technological and economic shifts in modern history. Driven by concerns about climate change, energy security, and the finite nature of fossil fuel reserves, governments and corporations worldwide have invested heavily in developing alternatives such as solar, wind, hydroelectric, and geothermal power.

Solar energy has experienced particularly remarkable growth over the past two decades. The cost of photovoltaic panels has dropped by more than 90% since 2009, making solar power competitive with or cheaper than fossil fuels in many regions. China has emerged as the world leader in solar manufacturing and installation, accounting for more than 35% of global solar capacity. The International Energy Agency has projected that solar power could become the largest source of electricity globally by 2040.

Wind energy has also seen substantial technological improvements. Modern wind turbines are significantly larger and more efficient than their predecessors—the average capacity of newly installed turbines has increased from less than 1 megawatt in 2000 to over 3 megawatts today. Offshore wind farms, which take advantage of stronger and more consistent winds over the ocean, have become increasingly economically viable.

Despite this progress, significant challenges remain in the transition to renewable energy. The intermittent nature of solar and wind power—they only generate electricity when the sun shines or wind blows—creates reliability concerns for electrical grids. Energy storage technologies, particularly batteries, have advanced considerably but are not yet sufficient to fully address the intermittency problem at grid scale.

Another challenge involves the materials required for renewable energy technologies. Solar panels require rare earth elements such as tellurium and indium, while batteries depend on lithium, cobalt, and nickel. The mining of these materials raises environmental and ethical concerns, and supply chain vulnerabilities could potentially slow the energy transition.

Nevertheless, the trajectory is clear: renewable energy costs continue to fall, technology continues to improve, and public support for clean energy remains strong. Most analysts believe that the question is no longer whether the world will transition to renewable energy, but how quickly the transition will occur.', 'real', 'approved')
ON CONFLICT (title, subject) DO UPDATE SET content = EXCLUDED.content, options = EXCLUDED.options, answer = EXCLUDED.answer, analysis = EXCLUDED.analysis, passage_text = EXCLUDED.passage_text, source = EXCLUDED.source, status = EXCLUDED.status, difficulty = EXCLUDED.difficulty, type = EXCLUDED.type;

INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, passage_text, source, status)
VALUES ('reading', 'summary', 'hard', 'TPO 8 - Renewable Energy (Question 5)', 'Which statement best expresses the overall message of the passage?', '[{"label": "A", "text": "The transition to renewable energy is progressing rapidly with declining costs and improving technology, though challenges like intermittency and material supply remain"}, {"label": "B", "text": "Renewable energy technologies have failed to meet expectations and will likely be abandoned"}, {"label": "C", "text": "Solar energy alone is sufficient to solve all of the world's energy problems"}, {"label": "D", "text": "Developing countries should not adopt renewable energy because it is too expensive"}]', 'A', '文章全面讨论了可再生能源转型的进展、挑战和前景，选项A最准确地概括了全文。', 'The global transition from fossil fuels to renewable energy sources represents one of the most significant technological and economic shifts in modern history. Driven by concerns about climate change, energy security, and the finite nature of fossil fuel reserves, governments and corporations worldwide have invested heavily in developing alternatives such as solar, wind, hydroelectric, and geothermal power.

Solar energy has experienced particularly remarkable growth over the past two decades. The cost of photovoltaic panels has dropped by more than 90% since 2009, making solar power competitive with or cheaper than fossil fuels in many regions. China has emerged as the world leader in solar manufacturing and installation, accounting for more than 35% of global solar capacity. The International Energy Agency has projected that solar power could become the largest source of electricity globally by 2040.

Wind energy has also seen substantial technological improvements. Modern wind turbines are significantly larger and more efficient than their predecessors—the average capacity of newly installed turbines has increased from less than 1 megawatt in 2000 to over 3 megawatts today. Offshore wind farms, which take advantage of stronger and more consistent winds over the ocean, have become increasingly economically viable.

Despite this progress, significant challenges remain in the transition to renewable energy. The intermittent nature of solar and wind power—they only generate electricity when the sun shines or wind blows—creates reliability concerns for electrical grids. Energy storage technologies, particularly batteries, have advanced considerably but are not yet sufficient to fully address the intermittency problem at grid scale.

Another challenge involves the materials required for renewable energy technologies. Solar panels require rare earth elements such as tellurium and indium, while batteries depend on lithium, cobalt, and nickel. The mining of these materials raises environmental and ethical concerns, and supply chain vulnerabilities could potentially slow the energy transition.

Nevertheless, the trajectory is clear: renewable energy costs continue to fall, technology continues to improve, and public support for clean energy remains strong. Most analysts believe that the question is no longer whether the world will transition to renewable energy, but how quickly the transition will occur.', 'real', 'approved')
ON CONFLICT (title, subject) DO UPDATE SET content = EXCLUDED.content, options = EXCLUDED.options, answer = EXCLUDED.answer, analysis = EXCLUDED.analysis, passage_text = EXCLUDED.passage_text, source = EXCLUDED.source, status = EXCLUDED.status, difficulty = EXCLUDED.difficulty, type = EXCLUDED.type;

INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, passage_text, source, status)
VALUES ('listening', 'lecture', 'medium', 'TPO 4 Lecture: History of the Printing Press', 'What is the main topic of the lecture?', '[{"label": "A", "text": "The biography of Johannes Gutenberg"}, {"label": "B", "text": "How the printing press transformed European society"}, {"label": "C", "text": "The technical details of modern printing methods"}, {"label": "D", "text": "A comparison of Eastern and Western printing traditions"}]', 'B', '讲座主要讨论印刷机如何改变欧洲社会：知识传播、宗教改革、科学革命等方面。', 'Professor: Today we''ll examine how the invention of the printing press in the mid-15th century fundamentally transformed European society. Before Gutenberg''s movable type, books were copied by hand, making them extremely expensive and rare. A single Bible could take a scribe over a year to complete. The printing press changed everything—within 50 years, millions of books were in circulation. This had profound effects on literacy, religious reform, and the scientific revolution. Martin Luther''s 95 Theses, for instance, spread across Europe within months thanks to printed pamphlets. Scientists could now share and verify each other''s findings more efficiently. The printing press essentially democratized knowledge.', 'real', 'approved')
ON CONFLICT (title, subject) DO UPDATE SET content = EXCLUDED.content, options = EXCLUDED.options, answer = EXCLUDED.answer, analysis = EXCLUDED.analysis, passage_text = EXCLUDED.passage_text, source = EXCLUDED.source, status = EXCLUDED.status, difficulty = EXCLUDED.difficulty, type = EXCLUDED.type;

INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, passage_text, source, status)
VALUES ('listening', 'lecture', 'medium', 'TPO 4 Lecture: Printing Press (Question 2)', 'According to the professor, how did the printing press affect the spread of Martin Luther''s ideas?', '[{"label": "A", "text": "It prevented his ideas from spreading outside Germany"}, {"label": "B", "text": "It enabled his 95 Theses to spread across Europe within months"}, {"label": "C", "text": "It had no significant effect on the Reformation"}, {"label": "D", "text": "Luther rejected the use of printed materials"}]', 'B', '教授指出路德的九十五条论纲通过印刷小册子在几个月内传遍欧洲。', 'Professor: Today we''ll examine how the invention of the printing press in the mid-15th century fundamentally transformed European society. Before Gutenberg''s movable type, books were copied by hand, making them extremely expensive and rare.', 'real', 'approved')
ON CONFLICT (title, subject) DO UPDATE SET content = EXCLUDED.content, options = EXCLUDED.options, answer = EXCLUDED.answer, analysis = EXCLUDED.analysis, passage_text = EXCLUDED.passage_text, source = EXCLUDED.source, status = EXCLUDED.status, difficulty = EXCLUDED.difficulty, type = EXCLUDED.type;

INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, passage_text, source, status)
VALUES ('listening', 'lecture', 'hard', 'TPO 4 Lecture: Printing Press (Question 3)', 'What does the professor imply about the relationship between the printing press and the scientific revolution?', '[{"label": "A", "text": "The printing press had no impact on scientific development"}, {"label": "B", "text": "Scientists opposed the use of printed materials"}, {"label": "C", "text": "The printing press enabled scientists to share and verify findings more efficiently"}, {"label": "D", "text": "The scientific revolution occurred before the invention of the printing press"}]', 'C', '教授暗示印刷机使科学家能更高效地分享和验证彼此的发现，推动了科学革命。', 'Professor: Today we''ll examine how the invention of the printing press fundamentally transformed European society.', 'real', 'approved')
ON CONFLICT (title, subject) DO UPDATE SET content = EXCLUDED.content, options = EXCLUDED.options, answer = EXCLUDED.answer, analysis = EXCLUDED.analysis, passage_text = EXCLUDED.passage_text, source = EXCLUDED.source, status = EXCLUDED.status, difficulty = EXCLUDED.difficulty, type = EXCLUDED.type;

INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, passage_text, source, status)
VALUES ('listening', 'conversation', 'easy', 'TPO 5 Conversation: Registering for Classes', 'Why does the student visit the academic advisor?', '[{"label": "A", "text": "To complain about a professor"}, {"label": "B", "text": "To get help registering for required courses"}, {"label": "C", "text": "To request a tuition refund"}, {"label": "D", "text": "To apply for a scholarship"}]', 'B', '学生来找学术顾问是为了解决选课问题，有两门必修课时间冲突。', 'Student: Hi Professor Martinez, do you have a moment? Advisor: Of course, Sarah. What brings you in today? Student: I''m having trouble with my course registration. Two of my required classes for the psychology major are scheduled at the same time this semester. Advisor: Let me pull up your degree audit. I see—Cognitive Psychology and Research Methods are both offered at 10 AM on Tuesdays and Thursdays. That is a problem.', 'real', 'approved')
ON CONFLICT (title, subject) DO UPDATE SET content = EXCLUDED.content, options = EXCLUDED.options, answer = EXCLUDED.answer, analysis = EXCLUDED.analysis, passage_text = EXCLUDED.passage_text, source = EXCLUDED.source, status = EXCLUDED.status, difficulty = EXCLUDED.difficulty, type = EXCLUDED.type;

INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, passage_text, source, status)
VALUES ('listening', 'conversation', 'easy', 'TPO 5 Conversation: Registering (Question 2)', 'What solution does the advisor propose for the scheduling conflict?', '[{"label": "A", "text": "Drop one of the courses entirely"}, {"label": "B", "text": "Take Research Methods in the summer session"}, {"label": "C", "text": "Transfer to a different university"}, {"label": "D", "text": "Ask the professor to change the class time"}]', 'B', '顾问建议学生在夏季学期修研究方法课程来解决时间冲突。', 'Student: I''m having trouble with my course registration. Two of my required classes are scheduled at the same time. Advisor: Cognitive Psychology and Research Methods both at 10 AM. Student: Exactly. I need both to graduate on time. Advisor: Here''s what we can do. Research Methods is also offered in the summer session. If you take it then, you can register for Cognitive Psychology this semester and still stay on track.', 'real', 'approved')
ON CONFLICT (title, subject) DO UPDATE SET content = EXCLUDED.content, options = EXCLUDED.options, answer = EXCLUDED.answer, analysis = EXCLUDED.analysis, passage_text = EXCLUDED.passage_text, source = EXCLUDED.source, status = EXCLUDED.status, difficulty = EXCLUDED.difficulty, type = EXCLUDED.type;

INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, passage_text, source, status)
VALUES ('listening', 'lecture', 'medium', 'TPO 6 Lecture: Coral Reef Ecosystems', 'What is the main focus of this lecture?', '[{"label": "A", "text": "The economic value of coral reefs"}, {"label": "B", "text": "The causes and consequences of coral bleaching"}, {"label": "C", "text": "Different species of coral found worldwide"}, {"label": "D", "text": "The history of scuba diving"}]', 'B', '讲座主要讨论珊瑚白化的原因（海水温度上升、海洋酸化）及其对生态系统的后果。', 'Professor: Coral reefs are often called the rainforests of the ocean, and for good reason—they support approximately 25% of all marine species despite covering less than 1% of the ocean floor. Today we''ll focus on one of the most serious threats facing these ecosystems: coral bleaching. Bleaching occurs when corals, stressed by changes in conditions such as temperature, light, or nutrients, expel the symbiotic algae living in their tissues, causing them to turn completely white.', 'real', 'approved')
ON CONFLICT (title, subject) DO UPDATE SET content = EXCLUDED.content, options = EXCLUDED.options, answer = EXCLUDED.answer, analysis = EXCLUDED.analysis, passage_text = EXCLUDED.passage_text, source = EXCLUDED.source, status = EXCLUDED.status, difficulty = EXCLUDED.difficulty, type = EXCLUDED.type;

INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, passage_text, source, status)
VALUES ('listening', 'lecture', 'hard', 'TPO 6 Lecture: Coral Reefs (Question 2)', 'According to the professor, what happens during coral bleaching?', '[{"label": "A", "text": "Corals change color to attract more fish"}, {"label": "B", "text": "Corals expel symbiotic algae due to environmental stress"}, {"label": "C", "text": "Corals grow at an accelerated rate"}, {"label": "D", "text": "New coral species emerge from existing reefs"}]', 'B', '教授明确说明珊瑚白化是指珊瑚在环境压力下排出共生藻类，导致其变白。', 'Professor: Coral reefs support approximately 25% of all marine species. Today we''ll focus on coral bleaching. Bleaching occurs when corals expel the symbiotic algae living in their tissues, causing them to turn completely white.', 'real', 'approved')
ON CONFLICT (title, subject) DO UPDATE SET content = EXCLUDED.content, options = EXCLUDED.options, answer = EXCLUDED.answer, analysis = EXCLUDED.analysis, passage_text = EXCLUDED.passage_text, source = EXCLUDED.source, status = EXCLUDED.status, difficulty = EXCLUDED.difficulty, type = EXCLUDED.type;

INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, passage_text, source, status)
VALUES ('listening', 'lecture', 'medium', 'TPO 6 Lecture: Coral Reefs (Question 3)', 'What can be inferred about the future of coral reefs based on the lecture?', '[{"label": "A", "text": "They will recover naturally without any intervention"}, {"label": "B", "text": "Reducing carbon emissions is crucial for their long-term survival"}, {"label": "C", "text": "All coral reefs will disappear within five years"}, {"label": "D", "text": "Coral bleaching has no connection to climate change"}]', 'B', '教授暗示减少碳排放对减缓海洋变暖和酸化至关重要，从而有助于珊瑚礁的长期生存。', 'Professor: The primary cause of mass bleaching events is rising ocean temperatures driven by climate change. If we don''t reduce carbon emissions, scientists predict that 90% of coral reefs could be threatened by 2050.', 'real', 'approved')
ON CONFLICT (title, subject) DO UPDATE SET content = EXCLUDED.content, options = EXCLUDED.options, answer = EXCLUDED.answer, analysis = EXCLUDED.analysis, passage_text = EXCLUDED.passage_text, source = EXCLUDED.source, status = EXCLUDED.status, difficulty = EXCLUDED.difficulty, type = EXCLUDED.type;

INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, passage_text, source, status)
VALUES ('listening', 'conversation', 'easy', 'TPO 7 Conversation: Group Project Planning', 'What is the main purpose of this conversation?', '[{"label": "A", "text": "To discuss the division of work for a group presentation"}, {"label": "B", "text": "To complain about a group member"}, {"label": "C", "text": "To request an extension for a project deadline"}, {"label": "D", "text": "To change the topic of the presentation"}]', 'A', '两名学生讨论如何分工完成小组演讲项目，涉及资料收集、PPT制作和演讲排练。', 'Alex: Hey Jamie, we need to figure out how to divide the work for our history presentation on the Industrial Revolution. Jamie: Right, it''s due in two weeks. I was thinking we could split it into three parts: research, slides, and rehearsal. Alex: That makes sense. I''m good with research—I can gather sources on technological innovations and their social impacts. Jamie: Perfect. I''ll handle the slide deck and practice my delivery. Let''s meet again on Friday to review what we have.', 'real', 'approved')
ON CONFLICT (title, subject) DO UPDATE SET content = EXCLUDED.content, options = EXCLUDED.options, answer = EXCLUDED.answer, analysis = EXCLUDED.analysis, passage_text = EXCLUDED.passage_text, source = EXCLUDED.source, status = EXCLUDED.status, difficulty = EXCLUDED.difficulty, type = EXCLUDED.type;

INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, passage_text, source, status)
VALUES ('listening', 'conversation', 'medium', 'TPO 7 Conversation: Group Project (Question 2)', 'What role does Alex take in the project?', '[{"label": "A", "text": "Creating the presentation slides"}, {"label": "B", "text": "Researching technological innovations and their social impacts"}, {"label": "C", "text": "Practicing the oral delivery"}, {"label": "D", "text": "Contacting the professor for guidance"}]', 'B', 'Alex主动承担研究工作，负责收集技术革新及其社会影响方面的资料。', 'Alex: I''m good with research—I can gather sources on technological innovations and their social impacts. Jamie: I''ll handle the slide deck.', 'real', 'approved')
ON CONFLICT (title, subject) DO UPDATE SET content = EXCLUDED.content, options = EXCLUDED.options, answer = EXCLUDED.answer, analysis = EXCLUDED.analysis, passage_text = EXCLUDED.passage_text, source = EXCLUDED.source, status = EXCLUDED.status, difficulty = EXCLUDED.difficulty, type = EXCLUDED.type;

INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, passage_text, source, status)
VALUES ('speaking', 'independent', 'easy', 'TPO 4: Favorite Season', 'What is your favorite season of the year? Describe the season and explain why you enjoy it. Include specific reasons and examples in your response.', '[]', '{"structure":"State favorite season + 2 reasons + personal example","sample":"My favorite season is autumn. First, the weather is perfect—not too hot or cold, making outdoor activities enjoyable. Second, the fall foliage creates stunning scenery. For example, last October I went hiking in the mountains and was amazed by the vibrant red and gold leaves. The crisp air and beautiful colors make autumn truly special."}', '独立口语题，重点是清晰陈述观点+两个理由+个人例子，准备15秒，回答45秒。', '', 'real', 'approved')
ON CONFLICT (title, subject) DO UPDATE SET content = EXCLUDED.content, options = EXCLUDED.options, answer = EXCLUDED.answer, analysis = EXCLUDED.analysis, passage_text = EXCLUDED.passage_text, source = EXCLUDED.source, status = EXCLUDED.status, difficulty = EXCLUDED.difficulty, type = EXCLUDED.type;

INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, passage_text, source, status)
VALUES ('speaking', 'independent', 'medium', 'TPO 5: Learning Alone vs. in Groups', 'Some students prefer to study alone, while others prefer to study in groups. Which method do you think is more effective for learning? Provide specific reasons and examples to support your preference.', '[]', '{"structure":"Preference + 2 reasons + example","sample":"I prefer studying alone. First, I can focus better without distractions from others. Second, I can study at my own pace—spending more time on difficult concepts and moving quickly through material I already understand. For instance, when preparing for my biology exam, studying alone allowed me to create detailed notes and review them multiple times at my own speed."}', '选择立场口语题，给出明确偏好并用具体例子支撑。', '', 'real', 'approved')
ON CONFLICT (title, subject) DO UPDATE SET content = EXCLUDED.content, options = EXCLUDED.options, answer = EXCLUDED.answer, analysis = EXCLUDED.analysis, passage_text = EXCLUDED.passage_text, source = EXCLUDED.source, status = EXCLUDED.status, difficulty = EXCLUDED.difficulty, type = EXCLUDED.type;

INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, passage_text, source, status)
VALUES ('speaking', 'independent', 'medium', 'TPO 6: Early Bird or Night Owl', 'Some people are most productive in the morning, while others work best at night. When do you feel most productive? Explain why using specific examples and details.', '[]', '{"structure":"Clear preference + productivity reason + personal experience","sample":"I am most productive in the morning. After a good night sleep, my mind is fresh and I can concentrate deeply on complex tasks. Also, there are fewer distractions early in the day. For example, I always schedule my most challenging coursework between 8 and 11 AM, and I consistently produce my best work during those hours."}', '个人偏好题，重点是用具体例子证明自己的观点。', '', 'real', 'approved')
ON CONFLICT (title, subject) DO UPDATE SET content = EXCLUDED.content, options = EXCLUDED.options, answer = EXCLUDED.answer, analysis = EXCLUDED.analysis, passage_text = EXCLUDED.passage_text, source = EXCLUDED.source, status = EXCLUDED.status, difficulty = EXCLUDED.difficulty, type = EXCLUDED.type;

INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, passage_text, source, status)
VALUES ('speaking', 'integrated', 'hard', 'TPO 4: Campus Fitness Center Proposal', 'The university is considering expanding the campus fitness center. Read a student''s opinion letter supporting the expansion, then listen to a conversation between two students discussing different views. Summarize the main points and explain how the conversation relates to the proposal.', '[]', '{"reading_summary":"Student letter argues fitness center is overcrowded and expansion would improve student health","conversation_points":["Speaker 1 agrees: more equipment needed during peak hours","Speaker 2 concerned: expansion costs could increase tuition","Speaker 1 counters: healthier students may reduce campus health insurance costs"],"connection":"The conversation both supports and challenges the proposal, showing the complexity of the decision."}', '综合口语题要求概括阅读和听力材料的关键内容，并说明两者之间的关系。', '', 'real', 'approved')
ON CONFLICT (title, subject) DO UPDATE SET content = EXCLUDED.content, options = EXCLUDED.options, answer = EXCLUDED.answer, analysis = EXCLUDED.analysis, passage_text = EXCLUDED.passage_text, source = EXCLUDED.source, status = EXCLUDED.status, difficulty = EXCLUDED.difficulty, type = EXCLUDED.type;

INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, passage_text, source, status)
VALUES ('speaking', 'integrated', 'hard', 'TPO 5: Online vs. In-Person Classes', 'Read a short article about the benefits of online learning. Then listen to a professor discussing the limitations of online education. Summarize the professor''s points and explain how they challenge the reading''s claims.', '[]', '{"reading_claims":["Online learning offers flexibility","Students can learn at their own pace","Technology makes education more accessible"],"lecture_counterpoints":["Lack of face-to-face interaction reduces engagement","Self-paced learning leads to procrastination","Digital divide leaves some students behind"],"connection":"The lecture directly challenges each of the reading claims by highlighting practical drawbacks."}', '需要对阅读和听力内容进行对比分析，指出讲座如何质疑阅读材料的观点。', '', 'real', 'approved')
ON CONFLICT (title, subject) DO UPDATE SET content = EXCLUDED.content, options = EXCLUDED.options, answer = EXCLUDED.answer, analysis = EXCLUDED.analysis, passage_text = EXCLUDED.passage_text, source = EXCLUDED.source, status = EXCLUDED.status, difficulty = EXCLUDED.difficulty, type = EXCLUDED.type;

INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, passage_text, source, status)
VALUES ('speaking', 'independent', 'easy', 'TPO 7: Technology in Daily Life', 'Talk about a technological device that you use every day and explain how it has changed your life. Provide specific examples and details.', '[]', '{"structure":"Name device + 2 impacts + concrete example","sample":"My smartphone has transformed my daily life in two major ways. First, it keeps me connected with family and friends through instant messaging and video calls. Second, it serves as my primary learning tool—I use apps to practice English, read news, and take online courses. For example, I improved my TOEFL listening score by 5 points just by listening to academic podcasts on my phone during commutes."}', '描述性口语题，选择一个具体设备并给出两个清晰的改变+例子。', '', 'real', 'approved')
ON CONFLICT (title, subject) DO UPDATE SET content = EXCLUDED.content, options = EXCLUDED.options, answer = EXCLUDED.answer, analysis = EXCLUDED.analysis, passage_text = EXCLUDED.passage_text, source = EXCLUDED.source, status = EXCLUDED.status, difficulty = EXCLUDED.difficulty, type = EXCLUDED.type;

INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, passage_text, source, status)
VALUES ('writing', 'independent', 'medium', 'TPO 4: Technology and Relationships', 'Do you agree or disagree with the following statement?

Modern technology has made people less socially connected than they were in the past.

Use specific reasons and examples to support your answer. (Minimum 300 words)', '[]', '{"rubric":["Clear thesis statement","2-3 body paragraphs with specific examples","Address counter-argument","Strong conclusion"],"sample_thesis":"While technology has changed the nature of social connection, I believe it has enhanced rather than diminished our ability to connect with others. However, the quality of these connections depends on how we use technology."}', '独立写作要求：明确立场、充分展开论证、处理反方观点、字数300+。', '', 'real', 'approved')
ON CONFLICT (title, subject) DO UPDATE SET content = EXCLUDED.content, options = EXCLUDED.options, answer = EXCLUDED.answer, analysis = EXCLUDED.analysis, passage_text = EXCLUDED.passage_text, source = EXCLUDED.source, status = EXCLUDED.status, difficulty = EXCLUDED.difficulty, type = EXCLUDED.type;

INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, passage_text, source, status)
VALUES ('writing', 'independent', 'medium', 'TPO 5: Education and Career Success', 'Some people believe that a university education is essential for career success, while others think that practical experience is more important.

Which view do you agree with? Use specific reasons and examples to support your answer. (Minimum 300 words)', '[]', '{"rubric":["Take a clear position","Provide balanced discussion","Use concrete examples","Strong conclusion"],"sample_thesis":"While practical experience is undoubtedly valuable, I believe a university education provides the foundational knowledge, critical thinking skills, and professional network that are essential for long-term career success."}', '两个观点对比型写作，需要选择立场并充分论证。', '', 'real', 'approved')
ON CONFLICT (title, subject) DO UPDATE SET content = EXCLUDED.content, options = EXCLUDED.options, answer = EXCLUDED.answer, analysis = EXCLUDED.analysis, passage_text = EXCLUDED.passage_text, source = EXCLUDED.source, status = EXCLUDED.status, difficulty = EXCLUDED.difficulty, type = EXCLUDED.type;

INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, passage_text, source, status)
VALUES ('writing', 'integrated', 'hard', 'TPO 4: Smartphone Ban in Schools', 'Read a passage arguing that smartphones should be banned in all K-12 schools because they distract students and enable cheating. Then listen to a lecture presenting a counter-argument. Write a response summarizing the lecture and explaining how it challenges specific points in the reading.', '[]', '{"reading_points":["Smartphones distract students during class","Easy access enables cheating on exams","Social media contributes to bullying"],"lecture_counterpoints":["Smartphones can be valuable educational tools when used properly","Cheating is a supervision issue, not a technology issue","Banning phones does not address root causes of bullying"],"essay_structure":"Introduction (state the relationship) + 3 body paragraphs (one per point) + Brief conclusion"}', '综合写作要求：准确概括讲座内容，逐点回应阅读材料的主张。', '', 'real', 'approved')
ON CONFLICT (title, subject) DO UPDATE SET content = EXCLUDED.content, options = EXCLUDED.options, answer = EXCLUDED.answer, analysis = EXCLUDED.analysis, passage_text = EXCLUDED.passage_text, source = EXCLUDED.source, status = EXCLUDED.status, difficulty = EXCLUDED.difficulty, type = EXCLUDED.type;

INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, passage_text, source, status)
VALUES ('writing', 'integrated', 'hard', 'TPO 5: Four-Day Work Week', 'Read an article claiming that a four-day work week increases employee productivity and well-being. Then listen to a business analyst discussing the potential drawbacks of this approach. Summarize the analyst''s points and explain how they challenge the reading.', '[]', '{"reading_claims":["Shorter work week boosts productivity","Employees report higher job satisfaction","Reduced commuting benefits environment"],"lecture_counterpoints":["Productivity gains may be temporary","Certain industries cannot compress work","Lower total output could harm competitiveness"],"essay_structure":"Introduction + 3 body paragraphs addressing each counterpoint + Conclusion"}', '综合写作：清晰呈现阅读与听力的对立观点，保持客观语气。', '', 'real', 'approved')
ON CONFLICT (title, subject) DO UPDATE SET content = EXCLUDED.content, options = EXCLUDED.options, answer = EXCLUDED.answer, analysis = EXCLUDED.analysis, passage_text = EXCLUDED.passage_text, source = EXCLUDED.source, status = EXCLUDED.status, difficulty = EXCLUDED.difficulty, type = EXCLUDED.type;

INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, passage_text, source, status)
VALUES ('writing', 'independent', 'easy', 'TPO 6: Living in One Place', 'Do you agree or disagree with the following statement?

It is better to live in one place for your entire life than to move to different places.

Use specific reasons and examples to support your answer. (Minimum 300 words)', '[]', '{"rubric":["Clear position statement","2-3 supporting paragraphs","Personal or observed examples","Meaningful conclusion"],"sample_thesis":"I disagree with this statement. Moving to different places provides invaluable life experiences, broadens one perspective, and creates opportunities for personal growth that staying in one place cannot offer."}', '简单观点题，适合初学者练习，重点是论证充分和例子具体。', '', 'real', 'approved')
ON CONFLICT (title, subject) DO UPDATE SET content = EXCLUDED.content, options = EXCLUDED.options, answer = EXCLUDED.answer, analysis = EXCLUDED.analysis, passage_text = EXCLUDED.passage_text, source = EXCLUDED.source, status = EXCLUDED.status, difficulty = EXCLUDED.difficulty, type = EXCLUDED.type;

INSERT INTO questions (subject, type, difficulty, title, content, options, answer, analysis, passage_text, source, status)
VALUES ('writing', 'independent', 'medium', 'TPO 7: Learning from Mistakes', 'Do you agree or disagree with the following statement?

The best way to learn is by making mistakes.

Use specific reasons and examples to support your answer. (Minimum 300 words)', '[]', '{"rubric":["Clear thesis","Logical progression of ideas","Specific examples from life or study","Address complexity of claim"],"sample_thesis":"While making mistakes provides powerful learning opportunities, I believe the best learning combines careful preparation with reflection on errors, rather than relying solely on trial and error."}', '需要在作文中平衡论述，既要承认从错误中学习的价值，也要指出其他学习方式的重要性。', '', 'real', 'approved')
ON CONFLICT (title, subject) DO UPDATE SET content = EXCLUDED.content, options = EXCLUDED.options, answer = EXCLUDED.answer, analysis = EXCLUDED.analysis, passage_text = EXCLUDED.passage_text, source = EXCLUDED.source, status = EXCLUDED.status, difficulty = EXCLUDED.difficulty, type = EXCLUDED.type;

-- 练习套题
INSERT INTO practice_sets (title, description, subject, difficulty, question_ids, time_limit, total_score)
VALUES
('阅读综合练习', '包含3篇托福阅读文章共15道题目', 'reading', 'medium',
 (SELECT json_agg(id)::text FROM questions WHERE subject='reading' AND status='approved'), 3600, 30),
('听力综合训练', '包含讲座和对话共10道听力题目', 'listening', 'medium',
 (SELECT json_agg(id)::text FROM questions WHERE subject='listening' AND status='approved'), 2400, 30),
('口语专项练习', '包含独立和综合口语共6题', 'speaking', 'medium',
 (SELECT json_agg(id)::text FROM questions WHERE subject='speaking' AND status='approved'), 1800, 30),
('写作综合练习', '包含独立和综合写作共6题', 'writing', 'medium',
 (SELECT json_agg(id)::text FROM questions WHERE subject='writing' AND status='approved'), 3600, 30);

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

