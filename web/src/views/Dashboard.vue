<template>
  <div class="page-container">
    <div class="page-header">
      <h2>学习仪表盘</h2>
      <p class="subtitle">欢迎回来，{{ userInfo?.nickname || '同学' }}</p>
    </div>

    <!-- Membership Status Card -->
    <div class="card member-card" :class="{ premium: isPremium }">
      <div class="member-left">
        <el-icon :size="28">
          <Trophy v-if="isPremium" />
          <UserFilled v-else />
        </el-icon>
        <div class="member-info">
          <div class="member-title">{{ isPremium ? 'VIP 会员 · 全量解锁' : '免费用户' }}</div>
          <div class="member-desc" v-if="!isPremium">
            今日剩余 <strong>{{ questionsRemaining }}</strong> 题 / <strong>{{ aiMinutesRemaining }}</strong> 分钟 AI 陪练
          </div>
          <div class="member-desc" v-else>所有功能已解锁，尽情备考！</div>
        </div>
      </div>
      <el-button v-if="!isPremium" type="warning" size="small" @click="$router.push('/membership')">升级会员</el-button>
      <el-tag v-else type="warning" effect="dark" size="small">VIP 已激活</el-tag>
    </div>

    <!-- Stat Cards -->
    <div class="stat-cards">
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--primary-soft);color:var(--primary)"><el-icon :size="22"><Clock /></el-icon></div>
        <div class="stat-value">{{ stats.todayMinutes || 0 }}<span class="stat-unit">分钟</span></div>
        <div class="stat-label">今日学习时长</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--success-soft);color:var(--success)"><el-icon :size="22"><EditPen /></el-icon></div>
        <div class="stat-value">{{ stats.totalQuestions || 0 }}</div>
        <div class="stat-label">做题数</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--warning-soft);color:var(--warning)"><el-icon :size="22"><Aim /></el-icon></div>
        <div class="stat-value">{{ stats.accuracy || 0 }}<span class="stat-unit">%</span></div>
        <div class="stat-label">正确率</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--danger-soft);color:var(--danger)"><el-icon :size="22"><Trophy /></el-icon></div>
        <div class="stat-value">{{ stats.avgExamScore || '--' }}</div>
        <div class="stat-label">模考平均分</div>
      </div>
    </div>

    <!-- 🔥 Streak 连续打卡 -->
    <div class="card streak-card">
      <div class="streak-header">
        <div class="streak-badge" :class="{ 'streak-active': streakData?.isStreakActive }">
          <span class="fire-icon">🔥</span>
          <span class="streak-count">{{ streakData?.streakDays || 0 }}</span>
          <span class="streak-label">天连续学习</span>
        </div>
        <el-button v-if="!streakData?.isTodayChecked" size="small" type="success" @click="handleCheckIn" :loading="checkingIn">
          今日打卡
        </el-button>
        <el-tag v-else type="success" size="small" effect="dark">✅ 今日已打卡</el-tag>
      </div>
      <div class="streak-week">
        <div v-for="(day, i) in (streakData?.weekCalendar || [])" :key="i" class="streak-day" :class="{ 'checked': day.checked, 'today': day.isToday }">
          <span class="day-dot"></span>
          <span class="day-num">{{ day.date.slice(8) }}</span>
        </div>
      </div>
    </div>

    <!-- 📊 学习周报 -->
    <div class="card weekly-card" @click="$router.push('/weekly-report')">
      <div class="weekly-header">
        <span class="weekly-icon">📊</span>
        <span class="weekly-title">本周学习报告</span>
        <el-button text size="small">
          查看周报 <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- ⚔️ 每日闯关 -->
    <div class="card challenge-card" @click="$router.push('/daily-challenge')">
      <div class="challenge-header">
        <span class="challenge-icon">⚔️</span>
        <span class="challenge-title">每日闯关</span>
        <el-button text size="small">
          开始闯关 <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 🌳 专注森林 -->
    <div class="card focus-card" @click="$router.push('/focus-timer')">
      <div class="focus-header">
        <span class="focus-icon">🌳</span>
        <span class="focus-title">专注森林</span>
        <span class="focus-sub">Forest · Pomodoro 专注计时</span>
        <el-button text size="small">
          开始专注 <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 📊 技能掌握 -->
    <div class="card mastery-card" @click="$router.push('/skill-mastery')">
      <div class="mastery-header">
        <span class="mastery-icon">📊</span>
        <span class="mastery-title">技能掌握雷达</span>
        <span class="mastery-sub">Khan Academy 式技能分析</span>
        <el-button text size="small">
          查看详情 <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 🛡️ 连续保护 -->
    <div class="card freeze-card" @click="$router.push('/streak-freeze')">
      <div class="freeze-header">
        <span class="freeze-icon">🛡️</span>
        <span class="freeze-title">连续保护</span>
        <span class="freeze-sub">Streak Freeze · 连续打卡保护</span>
        <el-button text size="small">
          查看详情 <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 🎯 每日目标 -->
    <div class="card daily-goals-card" @click="$router.push('/daily-goals')">
      <div class="daily-goals-header">
        <div class="daily-goals-info">
          <span class="daily-goals-icon">🎯</span>
          <div>
            <span class="daily-goals-title">每日目标</span>
            <span class="daily-goals-sub">Todoist 式目标追踪</span>
          </div>
        </div>
        <el-button text size="small">
          查看进度 <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
      <div class="daily-goals-mini-progress">
        <div class="mini-ring" ref="dailyGoalsRingRef">
          <svg viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" class="mini-ring-bg" />
            <circle cx="40" cy="40" r="34" class="mini-ring-fill" :style="{ strokeDashoffset: dailyGoalsOffset }" />
          </svg>
          <span class="mini-pct">{{ dailyGoalsPct }}%</span>
        </div>
      </div>
    </div>

    <!-- 🌐 CEFR 语言等级 -->
    <div class="card lang-level-card" @click="$router.push('/language-level')">
      <div class="lang-level-header">
        <div class="lang-level-info">
          <span class="lang-level-icon">🌐</span>
          <div>
            <span class="lang-level-title">CEFR 语言等级</span>
            <span class="lang-level-sub">Duolingo 式 CEFR 评估</span>
          </div>
        </div>
        <el-button text size="small">
          查看等级 <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
      <div class="lang-level-badge">
        <span class="level-icon">{{ cefrIcon || '🌱' }}</span>
        <span class="level-code">{{ cefrCode || 'A1' }}</span>
      </div>
    </div>

    <!-- 🎉 Quizizz 情感反馈 -->
    <div class="card quiz-reaction-card" @click="$router.push('/quiz-reaction')">
      <div class="quiz-reaction-header">
        <div class="quiz-reaction-info">
          <span class="quiz-reaction-icon">🎉</span>
          <div>
            <span class="quiz-reaction-title">情感反馈</span>
            <span class="quiz-reaction-sub">Quizizz 式即时反应</span>
          </div>
        </div>
        <el-button text size="small">
          查看统计 <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
      <div class="quiz-reaction-preview">
        <span class="reaction-emojis">🎉🏆😌🤔💪</span>
      </div>
    </div>

    <!-- 📅 学习热力图 -->
    <div class="card heatmap-card" @click="$router.push('/study-heatmap')">
      <div class="heatmap-header">
        <div class="heatmap-info">
          <span class="heatmap-icon">📅</span>
          <div>
            <span class="heatmap-title">学习热力图</span>
            <span class="heatmap-sub">GitHub 风格贡献日历</span>
          </div>
        </div>
        <el-button text size="small">
          查看详情 <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
      <div class="heatmap-mini-grid">
        <div v-for="i in 7" :key="i" class="mini-day" :class="`level-${Math.floor(Math.random()*5)}`"></div>
      </div>
    </div>

    <!-- ✍️ 语法助手 -->
    <div class="card grammar-card" @click="$router.push('/grammar-assistant')">
      <div class="grammar-header">
        <div class="grammar-info">
          <span class="grammar-icon">✍️</span>
          <div>
            <span class="grammar-title">语法助手</span>
            <span class="grammar-sub">Grammarly 式实时检查</span>
          </div>
        </div>
        <el-button text size="small">
          开始检查 <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
      <div class="grammar-mini-score">
        <span class="mini-score-circle">A</span>
        <span class="mini-score-label">优秀</span>
      </div>
    </div>

    <!-- 🌳 专注时间线 -->
    <div class="card focus-card" @click="$router.push('/focus-session')">
      <div class="focus-header">
        <div class="focus-info">
          <span class="focus-icon">🌳</span>
          <div>
            <span class="focus-title">专注时间线</span>
            <span class="focus-sub">Forest 式会话历史</span>
          </div>
        </div>
        <el-button text size="small">
          查看时间线 <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
      <div class="focus-mini-trend">
        <div class="mini-trend-bar" v-for="h in [40, 65, 30, 80, 50, 70, 45]" :key="h" :style="{ height: h + '%' }"></div>
      </div>
    </div>

    <!-- 🗣️ ELSA 音素教练 -->
    <div class="card phoneme-card" @click="$router.push('/phoneme-coach')">
      <div class="phoneme-header">
        <div class="phoneme-info">
          <span class="phoneme-icon">🗣️</span>
          <div>
            <span class="phoneme-title">ELSA 音素教练</span>
            <span class="phoneme-sub">音素级发音分析</span>
          </div>
        </div>
        <el-button text size="small">
          开始练习 <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
      <div class="phoneme-mini-preview">
        <span class="phoneme-char θ">θ</span>
        <span class="phoneme-char ð">ð</span>
        <span class="phoneme-char æ">æ</span>
        <span class="phoneme-char ʃ">ʃ</span>
        <span class="phoneme-char i:">iː</span>
      </div>
    </div>

    <!-- 📖 速度阅读 -->
    <div class="card speed-card" @click="$router.push('/speed-reading')">
      <div class="speed-header">
        <div class="speed-info">
          <span class="speed-icon">📖</span>
          <div>
            <span class="speed-title">速度阅读</span>
            <span class="speed-sub">WPM 追踪训练</span>
          </div>
        </div>
        <el-button text size="small">
          开始训练 <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
      <div class="speed-mini-gauge">
        <div class="gauge-value">285</div>
        <div class="gauge-label">WPM</div>
      </div>
    </div>

    <!-- ⭐ 题目收藏 -->
    <div class="card bookmark-card" @click="$router.push('/bookmarks')">
      <div class="bookmark-header">
        <div class="bookmark-info">
          <span class="bookmark-icon">⭐</span>
          <div>
            <span class="bookmark-title">题目收藏</span>
            <span class="bookmark-sub">快速复习回顾</span>
          </div>
        </div>
        <el-button text size="small">
          查看全部 <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
      <div class="bookmark-mini-count">
        <span class="bm-count-value">0</span>
        <span class="bm-count-label">已收藏</span>
      </div>
    </div>

    <!-- 🏆 Duolingo 联赛系统 -->
    <div class="card league-card" @click="$router.push('/league')">
      <div class="league-header">
        <div class="league-info">
          <span class="league-icon">🏆</span>
          <div>
            <span class="league-title">联赛系统</span>
            <span class="league-sub">Duolingo 风格排位</span>
          </div>
        </div>
        <el-button text size="small">
          查看排行榜 <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
      <div class="league-mini-stats">
        <span class="league-tier">🥇 黄金联赛</span>
        <span class="league-rank">排名 #3</span>
      </div>
    </div>

    <!-- 📚 间隔重复复习 (SRS) -->
    <div class="card srs-card" @click="$router.push('/srs-review')">
      <div class="srs-header">
        <div class="srs-info">
          <span class="srs-icon">📚</span>
          <div>
            <span class="srs-title">间隔重复复习</span>
            <span class="srs-sub">艾宾浩斯遗忘曲线</span>
          </div>
        </div>
        <el-button text size="small">
          开始复习 <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
      <div class="srs-mini-stats">
        <span class="srs-due">5 待复习</span>
        <span class="srs-retention">保留率 85%</span>
      </div>
    </div>

    <!-- 🎯 托福分数预测 -->
    <div class="card predictor-card" @click="$router.push('/score-predictor')">
      <div class="predictor-header">
        <div class="predictor-info">
          <span class="predictor-icon">🎯</span>
          <div>
            <span class="predictor-title">托福分数预测</span>
            <span class="predictor-sub">Magoosh 智能评估</span>
          </div>
        </div>
        <el-button text size="small">
          查看详情 <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
      <div class="predictor-mini-score">
        <span class="pred-score-value">94</span>
        <span class="pred-score-label">预测总分</span>
      </div>
    </div>

    <!-- 📝 全真模考 (Round 29) -->
    <div class="card mock-exam-card" @click="$router.push('/mock-exam')">
      <div class="mock-header">
        <div class="mock-info">
          <span class="mock-icon">📝</span>
          <div>
            <span class="mock-title">全真模考</span>
            <span class="mock-sub">Magoosh 式考试模拟</span>
          </div>
        </div>
        <el-button text size="small">
          开始模考 <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
      <div class="mock-mini-stats">
        <span class="mock-total">已完成 3 次</span>
        <span class="mock-best">最高分 94</span>
      </div>
    </div>

    <!-- 🗺️ 学习路径 (Round 29) -->
    <div class="card learning-path-card" @click="$router.push('/learning-path')">
      <div class="path-header">
        <div class="path-info">
          <span class="path-icon">🗺️</span>
          <div>
            <span class="path-title">学习路径</span>
            <span class="path-sub">Khan Academy 技能树</span>
          </div>
        </div>
        <el-button text size="small">
          查看路径 <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
      <div class="path-mini-progress">
        <div class="mini-progress-bar">
          <div class="mini-progress-fill" style="width: 35%"></div>
        </div>
        <span class="path-percent">35% 完成</span>
      </div>
    </div>

    <!-- 🎯 每日碎片学习 (Round 29) -->
    <div class="card daily-micro-card" @click="$router.push('/daily-micro')">
      <div class="micro-header">
        <div class="micro-info">
          <span class="micro-icon">🎯</span>
          <div>
            <span class="micro-title">每日碎片学习</span>
            <span class="micro-sub">Duolingo 式碎片练习</span>
          </div>
        </div>
        <el-button text size="small">
          每日挑战 <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
      <div class="micro-mini-streak">
        <span class="micro-fire">🔥</span>
        <span class="micro-streak-count">7 天连续</span>
      </div>
    </div>

    <!-- 🎧 听力精听 (Round 30) -->
    <div class="card round30-card" @click="$router.push('/intensive-listening')">
      <div class="round30-header">
        <div class="round30-icon-wrap" style="background:#fef3c7;color:#f59e0b">
          <el-icon :size="28"><Headset /></el-icon>
        </div>
        <div class="round30-info">
          <span class="round30-title">听力精听</span>
          <span class="round30-sub">逐句精听 + 听写模式 · Quizizz 式反馈</span>
        </div>
        <el-button text size="small">
          开始精听 <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
      <div class="round30-mini-stats">
        <span>🎯 准确率 89%</span>
        <span>⏱️ 12 分钟训练</span>
      </div>
    </div>

    <!-- 🗺️ 词汇图谱 (Round 30) --> -->
    <div class="card round30-card" @click="$router.push('/vocab-graph')">
      <div class="round30-header">
        <div class="round30-icon-wrap" style="background:#e0e7ff;color:#4338ca">
          <el-icon :size="28"><Connection /></el-icon>
        </div>
        <div class="round30-info">
          <span class="round30-title">词汇图谱</span>
          <span class="round30-sub">词汇网络可视化 · Mochi 式关系图谱</span>
        </div>
        <el-button text size="small">
          查看图谱 <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
      <div class="round30-mini-stats">
        <span>📚 15 词汇</span>
        <span>✅ 5 已掌握</span>
      </div>
    </div>

    <!-- 🏆 成就徽章升级 (Round 30) -->
    <div class="card round30-card" @click="$router.push('/enhanced-achievements')">
      <div class="round30-header">
        <div class="round30-icon-wrap" style="background:#fce7f3;color:#be185d">
          <el-icon :size="28"><Trophy /></el-icon>
        </div>
        <div class="round30-info">
          <span class="round30-title">成就徽章</span>
          <span class="round30-sub">多维度成就 · 赛季制排名 · GitHub 式贡献</span>
        </div>
        <el-button text size="small">
          查看成就 <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
      <div class="round30-mini-stats">
        <span>🔥 7 天连续</span>
        <span>⭐ 4/12 已解锁</span>
      </div>
    </div>

    <!-- Round 35: AI 题目解析 -->
    <div class="card round35-card">
      <div class="round35-header">
        <div class="round35-info">
          <span class="round35-title">📖 AI 题目解析</span>
          <span class="round35-sub">Magoosh 式详细解析 · 选项分析 · 考点追踪</span>
        </div>
        <el-button type="primary" size="small" @click="$router.push('/writing-enhanced')">
          立即体验 <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- Round 35: 写作评分增强 -->
    <div class="card round35-card">
      <div class="round35-header">
        <div class="round35-info">
          <span class="round35-title">📝 写作评分增强</span>
          <span class="round35-sub">TOEFL 官方评分标准 · 四维维度分析 · 个性化改进建议</span>
        </div>
        <el-button type="success" size="small" @click="$router.push('/writing-enhanced')">
          立即体验 <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- Round 35: 口语跟读练习 -->
    <div class="card round35-card">
      <div class="round35-header">
        <div class="round35-info">
          <span class="round35-title">🎙️ 口语跟读练习</span>
          <span class="round35-sub">ELSA 式发音评分 · 逐词分析 · 智能录音反馈</span>
        </div>
        <el-button type="warning" size="small" @click="$router.push('/shadow-practice')">
          立即体验 <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- Round 36: AI 即时反馈 -->
    <div class="card round36-card">
      <div class="round36-header">
        <div class="round36-info">
          <span class="round36-title">⚡ AI 即时解题</span>
          <span class="round36-sub">Sidekick 式即时反馈 · 每题解析 · 快速掌握</span>
        </div>
        <el-button type="primary" size="small" @click="$router.push('/instant-feedback')">
          立即体验 <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- Round 36: 词汇游戏 -->
    <div class="card round36-card">
      <div class="round36-header">
        <div class="round36-info">
          <span class="round36-title">🎮 词汇游戏</span>
          <span class="round36-sub">Quizlet 式配对 · 测试模式 · 拼写挑战</span>
        </div>
        <el-button type="success" size="small" @click="$router.push('/vocab-games')">
          立即体验 <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- Round 36: 薄弱点分析 -->
    <div class="card round36-card">
      <div class="round36-header">
        <div class="round36-info">
          <span class="round36-title">🎯 薄弱点分析</span>
          <span class="round36-sub">Khan Academy 式自适应推荐 · 智能练习建议</span>
        </div>
        <el-button type="warning" size="small" @click="$router.push('/weak-points')">
          立即体验 <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- Subject Progress Rings -->
    <div class="card">
      <h3 class="section-title">四科练习进度</h3>
      <div class="progress-rings">
        <div v-for="sub in subjects" :key="sub.key" class="ring-item">
          <div class="ring-wrapper">
            <svg class="ring-svg" viewBox="0 0 100 100">
              <circle class="ring-bg" cx="50" cy="50" r="42" />
              <circle
                class="ring-fg"
                cx="50" cy="50" r="42"
                :stroke-dasharray="264"
                :stroke-dashoffset="264 * (1 - sub.percent / 100)"
                :stroke="sub.color"
              />
            </svg>
            <div class="ring-text">{{ sub.percent }}%</div>
          </div>
          <div class="ring-label">{{ sub.label }}</div>
        </div>
      </div>
    </div>

    <!-- Quick Entry -->
    <div class="card">
      <h3 class="section-title">开始练习</h3>
      <div class="subject-cards">
        <div class="subject-card" @click="$router.push('/reading')">
          <div class="subject-icon" style="background:#EAF2FF;color:#2563EB"><el-icon :size="28"><Reading /></el-icon></div>
          <div class="subject-name">阅读</div>
          <div class="subject-desc">Reading</div>
        </div>
        <div class="subject-card" @click="$router.push('/listening')">
          <div class="subject-icon" style="background:#E7F7EF;color:#23B26D"><el-icon :size="28"><Headset /></el-icon></div>
          <div class="subject-name">听力</div>
          <div class="subject-desc">Listening</div>
        </div>
        <div class="subject-card" @click="$router.push('/speaking')">
          <div class="subject-icon" style="background:#FFF1E5;color:#FF8A2A"><el-icon :size="28"><Microphone /></el-icon></div>
          <div class="subject-name">口语</div>
          <div class="subject-desc">Speaking</div>
        </div>
        <div class="subject-card" @click="$router.push('/writing')">
          <div class="subject-icon" style="background:#EFE9FF;color:#7C5CFF"><el-icon :size="28"><Edit /></el-icon></div>
          <div class="subject-name">写作</div>
          <div class="subject-desc">Writing</div>
        </div>
      </div>
    </div>

    <!-- AI Tutor Entry -->
    <div class="card ai-tutor-entry" @click="$router.push('/ai-tutor')">
      <div class="tutor-icon">
        <el-icon :size="32" color="#fff"><MagicStick /></el-icon>
      </div>
      <div class="tutor-info">
        <div class="tutor-title">AI 导师分析</div>
        <div class="tutor-desc">预测托福分数 · 识别薄弱环节 · 个性化备考建议</div>
      </div>
      <el-icon :size="20" color="#4255FF"><ArrowRight /></el-icon>
    </div>

    <!-- 智能推荐 -->
    <div class="card recommend-card" v-if="recommendedQuestions.length">
      <div class="card-header">
        <h3 class="section-title" style="margin-bottom:0;"><el-icon :size="16"><DataBoard /></el-icon> 智能推荐</h3>
        <el-button text type="primary" size="small" @click="loadRecommendations">刷新推荐</el-button>
      </div>
      <p class="recommend-reason">{{ recommendReason }}</p>
      <div class="recommend-questions">
        <div
          v-for="q in recommendedQuestions.slice(0, 5)"
          :key="q.id"
          class="recommend-q-item"
          @click="goToQuestion(q)"
        >
          <el-tag :type="subjectTagType[q.subject]" size="small">{{ subjectTagLabel[q.subject] }}</el-tag>
          <span class="recommend-q-title">{{ q.title || q.content?.substring(0, 50) }}...</span>
          <el-tag size="small" :type="q.difficulty === 'hard' ? 'danger' : q.difficulty === 'easy' ? 'success' : ''">{{ q.difficulty }}</el-tag>
        </div>
        <div v-if="recommendedQuestions.length > 5" class="recommend-more">
          还有 {{ recommendedQuestions.length - 5 }} 道推荐题目...
          <el-button text type="primary" size="small" @click="router.push('/reading')">全部查看 →</el-button>
        </div>
      </div>
    </div>
    <div class="card" v-else>
      <div class="card-header">
        <h3 class="section-title" style="margin-bottom:0;"><el-icon :size="16"><DataBoard /></el-icon> 智能推荐</h3>
        <el-button text type="primary" size="small" @click="loadRecommendations" :loading="recommendLoading">刷新推荐</el-button>
      </div>
      <p class="recommend-reason" v-if="recommendReason">{{ recommendReason }}</p>
      <el-empty v-else description="加载中..." :image-size="40" />
    </div>

    <!-- Quick Wrong Book Entry -->
    <div class="card review-entry" v-if="dueWrong > 0" @click="$router.push('/wrong-book/redo')">
      <div class="review-entry-icon">
        <el-icon :size="24" color="#fff"><CollectionTag /></el-icon>
      </div>
      <div class="review-entry-info">
        <div class="review-entry-title">今日错题复习</div>
        <div class="review-entry-desc">有 {{ dueWrong }} 道错题已到复习时间，点击开始</div>
      </div>
      <el-icon :size="20" color="#4255FF"><ArrowRight /></el-icon>
    </div>

    <!-- Quick Wrong Book Entry -->
    <div class="card">
      <div class="card-header">
        <h3 class="section-title" style="margin-bottom:0;">最近错题</h3>
        <el-button text type="primary" size="small" @click="$router.push('/wrong-book')">查看全部</el-button>
      </div>
      <div v-if="recentWrong.length" class="wrong-preview">
        <div
          v-for="(w, i) in recentWrong"
          :key="i"
          class="wrong-preview-item"
          @click="$router.push(`/reading/${w.questionId || w.id}`)"
        >
          <el-icon :size="14" color="#F0544F"><CircleClose /></el-icon>
          <span class="wrong-preview-title">{{ w.title || w.question || '题目' }}</span>
          <span class="wrong-preview-subject">{{ subjectMap[w.subject] || '' }}</span>
        </div>
      </div>
      <el-empty v-else description="暂无错题" :image-size="60" />
    </div>

    <!-- Daily Study Plan -->
    <div class="card">
      <div class="card-header">
        <h3 class="section-title" style="margin-bottom:0;">每日学习任务</h3>
        <el-button text type="primary" size="small" @click="$router.push('/plan/daily')">查看全部</el-button>
      </div>
      <div v-if="dailyTasks.length" class="task-list">
        <div v-for="(task, i) in dailyTasks" :key="i" class="task-item" :class="{ completed: task.completed }">
          <el-icon :size="16" :color="task.completed ? '#23B26D' : '#ccc'">
            <CircleCheck v-if="task.completed" />
            <Clock v-else />
          </el-icon>
          <span class="task-title">{{ task.title || task.name || '学习任务' }}</span>
          <span class="task-duration" v-if="task.duration">{{ task.duration }}分钟</span>
        </div>
      </div>
      <el-empty v-else description="暂无今日任务，去制定计划吧" :image-size="60">
        <el-button size="small" type="primary" @click="$router.push('/plan/setup')">制定学习计划</el-button>
      </el-empty>
    </div>

    <!-- Ad Banner -->
    <AdBanner placement="home" />

    <!-- Recent Records -->
    <div class="card">
      <h3 class="section-title">最近练习</h3>
      <el-table :data="recentRecords" stripe style="width: 100%">
        <el-table-column prop="subject" label="科目" width="80">
          <template #default="{ row }">{{ subjectMap[row.subject] || row.subject }}</template>
        </el-table-column>
        <el-table-column prop="title" label="题目" min-width="180" show-overflow-tooltip />
        <el-table-column prop="score" label="得分" width="80" />
        <el-table-column prop="createdAt" label="时间" width="160">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template #default="{ row }">
            <el-button size="small" text type="primary" @click="viewDetail(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!recentRecords.length" description="暂无练习记录" :image-size="80" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Reading, Headset, Microphone, Edit, EditPen, Aim, Trophy, UserFilled, CircleClose, CircleCheck, Clock, MagicStick, ArrowRight, CollectionTag, DataBoard, Connection } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { userAPI, practiceAPI, planAPI, wrongAPI, questionAPI, dailyGoalsAPI, languageLevelAPI, studyHeatmapAPI, grammarCheckAPI, focusSessionAPI, bookmarkAPI } from '@/api'
import { useUserStore } from '@/stores/user'
import AdBanner from '@/components/AdBanner.vue'

const router = useRouter()
const { isPremium, questionsRemaining, aiMinutesRemaining } = useUserStore()

const userInfo = ref(null)
const stats = reactive({
  todayMinutes: 0, totalQuestions: 0, accuracy: 0, avgExamScore: '--',
})
const recentRecords = ref([])
const recentWrong = ref([])
const dailyTasks = ref([])
const dueWrong = ref(0)
const streakData = ref(null)
const checkingIn = ref(false)

// 每日目标
const dailyGoalsPct = ref(0)
const dailyGoalsOffset = ref(213.6)

// CEFR 语言等级
const cefrCode = ref('A1')
const cefrIcon = ref('🌱')

// 学习热力图
const heatmapTotalMinutes = ref(0)
const heatmapStudyDays = ref(0)

// 语法助手
const grammarScore = ref(85)

// 专注时间线
const focusCompleted = ref(0)

// 题目收藏
const bookmarkTotal = ref(0)

// 智能推荐
const recommendedQuestions = ref([])
const recommendReason = ref('')
const recommendLoading = ref(false)

const subjectTagType = { reading: '', listening: 'success', speaking: 'warning', writing: '' }
const subjectTagLabel = { reading: '阅读', listening: '听力', speaking: '口语', writing: '写作' }

const subjects = [
  { key: 'reading', label: '阅读', percent: 0, color: '#2563EB' },
  { key: 'listening', label: '听力', percent: 0, color: '#23B26D' },
  { key: 'speaking', label: '口语', percent: 0, color: '#FF8A2A' },
  { key: 'writing', label: '写作', percent: 0, color: '#7C5CFF' },
]

const subjectMap = {
  reading: '阅读', listening: '听力', speaking: '口语', writing: '写作',
}

const formatDate = (d) => {
  if (!d) return '--'
  return new Date(d).toLocaleString('zh-CN')
}

const viewDetail = (row) => {
  if (row.subject === 'reading') router.push(`/reading/${row.questionId}/result`)
  else if (row.subject === 'listening') router.push(`/listening/${row.questionId}/result`)
  else if (row.subject === 'writing') router.push(`/writing/${row.questionId}/result`)
}

const loadRecommendations = async () => {
  recommendLoading.value = true
  try {
    const res = await questionAPI.recommend(10)
    const data = res.data?.data || res.data
    recommendedQuestions.value = data.questions || []
    recommendReason.value = data.reason || '为您推荐相关题目'
  } catch (e) {
    console.error('推荐加载失败:', e)
    recommendReason.value = '暂无推荐数据'
  } finally {
    recommendLoading.value = false
  }
}

const goToQuestion = (q) => {
  const pathMap = {
    reading: '/reading',
    listening: '/listening',
    speaking: '/speaking',
    writing: '/writing',
  }
  const path = pathMap[q.subject] || '/reading'
  router.push(`${path}/${q.id}`)
}

// ==================== Streak 打卡 ====================
async function loadStreak() {
  try {
    const res = await userAPI.streak()
    streakData.value = res.data?.data || res.data
  } catch (e) {
    console.error('Streak 加载失败:', e)
  }
}

async function handleCheckIn() {
  if (checkingIn.value || streakData.value?.isTodayChecked) return
  checkingIn.value = true
  try {
    const res = await userAPI.updateStudy({ minutes: 5, action: 'checkin' })
    if (res.data?.code === 200) {
      streakData.value = {
        ...streakData.value,
        streakDays: res.data.data.streakDays,
        isTodayChecked: true,
        lastStudyDate: new Date().toISOString().split('T')[0],
      }
      ElMessage.success('打卡成功！连续学习 ' + res.data.data.streakDays + ' 天 🔥')
    }
  } catch (e) {
    console.error('打卡失败:', e)
    ElMessage.warning('打卡失败，请稍后重试')
  } finally {
    checkingIn.value = false
  }
}

// ==================== 每日目标 ====================
async function loadDailyGoals() {
  try {
    const res = await dailyGoalsAPI.getGoals()
    const data = res.data?.data
    if (data?.goal && data?.progress) {
      const g = data.goal
      const p = data.progress
      const items = [
        pct(p.studyMinutes, g.studyMinutes * 60),
        pct(p.totalQuestions, g.targetQuestions),
        pct(0, g.readingCount), pct(0, g.listeningCount),
        pct(0, g.speakingCount), pct(0, g.writingCount),
      ]
      dailyGoalsPct.value = Math.round(items.reduce((a, b) => a + b, 0) / items.length)
    } else if (data?.completed) {
      dailyGoalsPct.value = 100
    }
  } catch (e) {
    console.warn('每日目标加载失败:', e)
    dailyGoalsPct.value = 0
  }
}

// ==================== CEFR 等级 ====================
async function loadCefrLevel() {
  try {
    const res = await languageLevelAPI.getLevel()
    const data = res.data?.data
    if (data?.cefrLevel) {
      cefrCode.value = data.cefrLevel.code || 'A1'
      cefrIcon.value = data.cefrLevel.icon || '🌱'
    }
  } catch (e) {
    console.warn('CEFR 等级加载失败:', e)
  }
}

// ==================== 学习热力图 ====================
async function loadHeatmap() {
  try {
    const res = await studyHeatmapAPI.get()
    // Dashboard 卡片只需显示统计数字
    console.log('热力图数据加载:', res.data?.data?.stats)
  } catch (e) {
    console.warn('热力图加载失败:', e)
  }
}

// ==================== 语法助手 ====================
async function loadGrammarStatus() {
  try {
    const res = await grammarCheckAPI.history()
    const history = res.data?.data || []
    if (history.length > 0) {
      const last = history[0]
      grammarScore.value = last.score
    }
  } catch (e) {
    console.warn('语法检查历史加载失败:', e)
    grammarScore.value = 85
  }
}

// ==================== 专注时间线 ====================
async function loadFocusStats() {
  try {
    const res = await focusSessionAPI.stats()
    const data = res.data?.data
    if (data) {
      focusCompleted.value = data.completed_sessions || 0
    }
  } catch (e) {
    console.warn('专注统计加载失败:', e)
    focusCompleted.value = 15
  }
}

// ==================== 题目收藏 ====================
async function loadBookmarkCount() {
  try {
    const res = await bookmarkAPI.stats()
    const data = res.data?.data
    bookmarkTotal.value = data?.total || 0
  } catch (e) {
    console.warn('收藏统计加载失败:', e)
    bookmarkTotal.value = 0
  }
}

onMounted(async () => {
  const info = localStorage.getItem('userInfo')
  if (info) userInfo.value = JSON.parse(info)

  try {
    const [dashRes, pracRes, planRes, wrongRes] = await Promise.allSettled([
      userAPI.dashboard(),
      practiceAPI.history({ limit: 10 }),
      planAPI.daily(),
      wrongAPI.list({ limit: 5 }),
    ])

    // dashboard
    if (dashRes.status === 'fulfilled' && dashRes.value.data) {
      const d = dashRes.value.data.data || dashRes.value.data
      stats.todayMinutes = d.stats?.todayMinutes || d.stats?.totalMinutes || 0
      stats.totalQuestions = d.stats?.totalQuestions || 0
      stats.accuracy = d.stats?.accuracy || 0
      stats.avgExamScore = d.stats?.avgExamScore || '--'
      if (d.progress) {
        subjects.forEach(s => { s.percent = d.progress[s.key] || 0 })
      }
    } else {
      stats.todayMinutes = 45
      stats.totalQuestions = 128
      stats.accuracy = 72
      stats.avgExamScore = 88
      subjects.forEach(s => { s.percent = Math.floor(Math.random() * 60 + 20) })
    }

    // practice history
    if (pracRes.status === 'fulfilled' && pracRes.value.data) {
      const data = pracRes.value.data.data || pracRes.value.data
      recentRecords.value = Array.isArray(data) ? data.slice(0, 10) : (data.records || data.list || []).slice(0, 10)
    }

    // daily plan
    if (planRes.status === 'fulfilled' && planRes.value.data) {
      const data = planRes.value.data.data || planRes.value.data
      dailyTasks.value = Array.isArray(data) ? data.slice(0, 6) : (data.tasks || data.dailyTasks || []).slice(0, 6)
    } else {
      dailyTasks.value = [
        { title: '阅读练习 2 篇', duration: 30, completed: false },
        { title: '听力精听 1 篇', duration: 20, completed: false },
        { title: '错题复习（SM-2）', duration: 15, completed: true },
      ]
    }

    // recent wrong
    if (wrongRes.status === 'fulfilled' && wrongRes.value.data) {
      const data = wrongRes.value.data.data || wrongRes.value.data
      recentWrong.value = Array.isArray(data) ? data.slice(0, 5) : (data.list || data.wrong || []).slice(0, 5)
    }
  } catch (e) {
    console.error('Dashboard load error', e)
    ElMessage.warning('部分数据加载失败，已使用离线数据')
  }

  try {
    const sr = await wrongAPI.stats()
    dueWrong.value = sr.data?.data?.due || 0
  } catch (_) { /* 忽略 */ }

  // 加载智能推荐
  loadRecommendations()

  // 加载 Streak
  loadStreak()

  // 加载每日目标
  loadDailyGoals()

  // 加载 CEFR 等级
  loadCefrLevel()

  // 加载学习热力图
  loadHeatmap()

  // 加载语法助手
  loadGrammarStatus()

  // 加载专注时间线
  loadFocusStats()

  // 加载收藏统计
  loadBookmarkCount()
})
</script>

<style scoped>
.subtitle { color: var(--text-secondary); font-size: 14px; margin-top: 4px; }
.section-title { font-size: 17px; font-weight: 700; margin-bottom: 16px; letter-spacing: -0.01em; }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }

/* Membership Card */
.member-card {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; flex-wrap: wrap;
  background: linear-gradient(135deg, #F7F8FC 0%, #EDEFF7 100%);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}
.member-card.premium {
  background: linear-gradient(135deg, #FFF3D6 0%, #FFE4AE 100%);
  border-color: #FFE0A3;
  color: #6B4A00;
}
.member-left { display: flex; align-items: center; gap: 12px; }
.member-left > .el-icon { color: var(--primary); }
.member-card.premium .member-left > .el-icon { color: #B57A00; }
.member-info { display: flex; flex-direction: column; gap: 3px; }
.member-title { font-size: 16px; font-weight: 800; }
.member-desc { font-size: 12.5px; color: var(--text-secondary); }
.member-desc strong { color: var(--primary); font-weight: 700; }

/* Stat Cards */
.stat-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
.stat-card {
  background: #fff; border-radius: var(--radius); padding: 20px 22px;
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.stat-card:hover { transform: translateY(-3px); box-shadow: var(--shadow); }
.stat-icon {
  width: 42px; height: 42px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 14px;
}
.stat-value { font-size: 28px; font-weight: 800; color: var(--text); letter-spacing: -0.02em; }
.stat-unit { font-size: 15px; font-weight: 700; color: var(--text-secondary); margin-left: 2px; }
.stat-label { font-size: 12.5px; color: var(--text-secondary); margin-top: 6px; }

/* 移动端适配 */
@media (max-width: 768px) {
  .page-header { padding: 16px 16px 8px; }
  .page-header h2 { font-size: 20px; }
  .subtitle { font-size: 13px; }
  
  .member-card { padding: 14px; flex-wrap: wrap; }
  .member-card .member-left { gap: 10px; }
  .member-card .member-left > .el-icon { font-size: 24px; }
  .member-card .member-info { gap: 2px; }
  .member-card .member-title { font-size: 15px; }
  .member-card .member-desc { font-size: 12px; }
  
  .stat-cards { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .stat-card { padding: 16px; }
  .stat-icon { width: 36px; height: 36px; margin-bottom: 10px; }
  .stat-icon > .el-icon { font-size: 20px; }
  .stat-value { font-size: 24px; }
  .stat-unit { font-size: 13px; }
  .stat-label { font-size: 12px; }
  
  .card { padding: 16px; }
  .section-title { font-size: 16px; margin-bottom: 12px; }
  
  .progress-rings { gap: 16px; }
  .ring-wrapper { width: 80px; height: 80px; }
  .ring-text { font-size: 15px; }
  .ring-label { font-size: 12px; }
  
  .subject-cards { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .subject-card { padding: 16px 12px; }
  .subject-icon { width: 48px; height: 48px; border-radius: 14px; }
  .subject-icon > .el-icon { font-size: 24px; }
  .subject-name { font-size: 14px; }
  .subject-desc { font-size: 11px; }
  
  .ai-tutor-entry { padding: 14px; gap: 10px; }
  .tutor-icon { width: 44px; height: 44px; }
  .tutor-title { font-size: 14px; }
  .tutor-desc { font-size: 12px; }
  
  .review-entry { padding: 14px; gap: 10px; }
  .review-entry-icon { width: 42px; height: 42px; }
  .review-entry-title { font-size: 14px; }
  .review-entry-desc { font-size: 12px; }
  
  .wrong-preview-item { padding: 10px 12px; }
  .wrong-preview-title { font-size: 13px; }
  
  .task-item { padding: 10px 12px; }
  .task-title { font-size: 13px; }
  .task-duration { font-size: 11px; }
  
  .recent-header { padding: 10px 12px; }
  .recent-item { padding: 10px 12px; }
  .recent-item .item-left { font-size: 14px; }
  .recent-item .item-subject { font-size: 11px; }
  .recent-item .item-score { font-size: 13px; }
}

@media (max-width: 480px) {
  .page-container { padding: 0 10px; }
  .page-header { padding: 12px 0 6px; }
  .stat-cards { grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .stat-card { padding: 12px; }
  .stat-value { font-size: 20px; }
  .stat-icon { width: 32px; height: 32px; }
  .stat-icon > .el-icon { font-size: 18px; }
  .subject-cards { grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .subject-card { padding: 12px 10px; }
  .subject-icon { width: 42px; height: 42px; }
  .ring-wrapper { width: 70px; height: 70px; }
  .ring-text { font-size: 13px; }
}

/* Progress Rings (CSS + SVG) */
.progress-rings { display: flex; justify-content: space-around; flex-wrap: wrap; gap: 20px; }
.ring-item { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.ring-wrapper { position: relative; width: 96px; height: 96px; }
.ring-svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.ring-bg { fill: none; stroke: #EEF0F6; stroke-width: 9; }
.ring-fg { fill: none; stroke-width: 9; stroke-linecap: round; transition: stroke-dashoffset 0.6s ease; }
.ring-text {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  font-size: 17px; font-weight: 800;
}
.ring-label { font-size: 13px; color: var(--text-secondary); font-weight: 600; }

/* Subject Cards */
.subject-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.subject-card {
  text-align: center;
  padding: 24px 16px; border-radius: var(--radius);
  background: #fff; border: 1px solid var(--border);
  cursor: pointer; transition: all 0.2s ease;
}
.subject-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary-soft-2);
}
.subject-icon {
  width: 56px; height: 56px; border-radius: 18px;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 14px;
}
.subject-name { font-size: 15px; font-weight: 700; color: var(--text); }
.subject-desc { font-size: 11.5px; color: var(--text-muted); margin-top: 3px; letter-spacing: 0.02em; }
@media (max-width: 900px) {
  .subject-cards { grid-template-columns: repeat(2, 1fr); }
}

/* AI Tutor Entry */
.ai-tutor-entry {
  display: flex; align-items: center; gap: 14px; cursor: pointer;
  background: linear-gradient(135deg, #F0F2FF 0%, #E8EBFF 100%);
  border: 1px solid #DFE3FF;
  transition: all 0.2s;
}
.ai-tutor-entry:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(66, 85, 255, 0.18); }
.tutor-icon {
  width: 52px; height: 52px; border-radius: 14px;
  background: var(--grad-primary);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(66, 85, 255, 0.32);
}
.tutor-info { flex: 1; }
.tutor-title { font-size: 15px; font-weight: 700; color: var(--text); }
.tutor-desc { font-size: 12.5px; color: var(--text-secondary); margin-top: 3px; }

/* Recommendation Card */
.recommend-card {
  border: 1px solid var(--primary-soft-2);
  background: linear-gradient(135deg, #FAFBFF 0%, #F5F7FF 100%);
}
.recommend-reason {
  font-size: 13px; color: var(--text-secondary); margin: 0 0 12px;
  padding: 8px 12px; background: var(--primary-soft);
  border-radius: 8px; line-height: 1.5;
}
.recommend-questions { display: flex; flex-direction: column; gap: 8px; }
.recommend-q-item {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px; border-radius: 10px; cursor: pointer;
  font-size: 13.5px; transition: background 0.15s;
}
.recommend-q-item:hover { background: #fff; }
.recommend-q-title {
  flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  font-weight: 500; color: var(--text);
}
.recommend-more { font-size: 12px; color: var(--text-secondary); padding: 4px 0; }

/* Wrong Preview */
.wrong-preview { display: flex; flex-direction: column; gap: 6px; }
.wrong-preview-item {
  display: flex; align-items: center; gap: 10px;
  padding: 11px 14px; border-radius: 12px; cursor: pointer;
  font-size: 13.5px; transition: background 0.15s;
}
.wrong-preview-item:hover { background: #F6F7FB; }
.wrong-preview-title { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; }
.wrong-preview-subject {
  font-size: 11px; color: var(--text-secondary); flex-shrink: 0;
  background: #F1F3F8; padding: 2px 8px; border-radius: 999px;
}

/* Task List */
.task-list { display: flex; flex-direction: column; gap: 6px; }
.task-item {
  display: flex; align-items: center; gap: 10px;
  padding: 11px 14px; border-radius: 12px; font-size: 14px;
  transition: background 0.15s;
}
.task-item:hover { background: #F6F7FB; }
.task-item.completed { opacity: 0.55; }
.task-title { flex: 1; font-weight: 500; }
.task-duration {
  font-size: 12px; color: var(--text-secondary); flex-shrink: 0;
  background: #F1F3F8; padding: 2px 8px; border-radius: 999px;
}

/* 错题复习入口 */
.review-entry {
  display: flex; align-items: center; gap: 14px; cursor: pointer;
  background: linear-gradient(135deg, #FFF1F1 0%, #FFE7E7 100%);
  border: 1px solid #FFDEDE;
  transition: all 0.2s;
}
.review-entry:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(240, 84, 79, 0.18); }
.review-entry-icon {
  width: 48px; height: 48px; border-radius: 14px; flex-shrink: 0;
  background: linear-gradient(135deg, #F0544F 0%, #E03B36 100%);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 12px rgba(240, 84, 79, 0.3);
}
.review-entry-info { flex: 1; }
.review-entry-title { font-size: 15px; font-weight: 700; color: var(--text); }
.review-entry-desc { font-size: 12.5px; color: var(--text-secondary); margin-top: 3px; }

/* ==================== Streak 连续打卡 ==================== */
.streak-card {
  border: 1px solid #FFF3E5;
  background: linear-gradient(135deg, #FFFBF5 0%, #FFF8F0 100%);
}
.streak-header {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;
}
.streak-badge {
  display: flex; align-items: center; gap: 8px; padding: 10px 16px;
  background: #FFF1F0; border-radius: 12px;
  border: 1px solid #FFD6D6;
}
.streak-badge.streak-active {
  background: linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%);
  border-color: #FFB74D;
  box-shadow: 0 2px 8px rgba(255, 152, 0, 0.15);
}
.fire-icon {
  font-size: 22px; line-height: 1;
}
.streak-count {
  font-size: 26px; font-weight: 800; color: #FF8A2A; line-height: 1;
}
.streak-label {
  font-size: 12px; color: #666; line-height: 1.2;
}
.streak-week {
  display: flex; gap: 6px; justify-content: center;
}
.streak-day {
  display: flex; flex-direction: column; align-items: center;
  padding: 6px 8px; border-radius: 8px;
  background: #F5F5F5; min-width: 36px; transition: all 0.2s;
}
.streak-day.checked {
  background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%);
  border: 1px solid #A5D6A7;
}
.streak-day.today {
  border: 2px solid #FF8A2A;
  background: #FFF8F0;
}
.day-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: #D0D0D0; margin-bottom: 3px;
}
.streak-day.checked .day-dot {
  background: #4CAF50;
}
.streak-day.today .day-dot {
  background: #FF8A2A;
}
.day-num {
  font-size: 10px; color: #999;
}
.streak-day.checked .day-num { color: #2E7D32; }
.streak-day.today .day-num { color: #FF8A2A; font-weight: 700; }

/* ==================== 学习周报入口 ==================== */
.weekly-card {
  border: 1px solid #E3F2FD;
  background: linear-gradient(135deg, #F0F7FF 0%, #E8F4FD 100%);
  cursor: pointer;
}
.weekly-header {
  display: flex; align-items: center; gap: 10px;
}
.weekly-icon { font-size: 24px; }
.weekly-title { font-size: 16px; font-weight: 700; color: var(--text); }

/* ==================== 每日闯关入口 ==================== */
.challenge-card {
  border: 1px solid #E8EAF6;
  background: linear-gradient(135deg, #EDE7F6 0%, #D1C4E9 100%);
  cursor: pointer;
}
.challenge-header {
  display: flex; align-items: center; gap: 10px;
}
.challenge-icon { font-size: 24px; }
.challenge-title { font-size: 16px; font-weight: 700; color: #4A148C; }

/* ==================== 专注森林入口 ==================== */
.focus-card {
  border: 1px solid #E8F5E9;
  background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%);
  cursor: pointer;
}
.focus-header {
  display: flex; align-items: center; gap: 10px;
}
.focus-icon { font-size: 24px; }
.focus-title { font-size: 16px; font-weight: 700; color: #2E7D32; }
.focus-sub {
  font-size: 12px; color: #66BB6A; margin-left: auto; flex: 1;
}

/* ==================== 技能掌握入口 ==================== */
.mastery-card {
  border: 1px solid #E3F2FD;
  background: linear-gradient(135deg, #E3F2FD 0%, #90CAF9 100%);
  cursor: pointer;
}
.mastery-header {
  display: flex; align-items: center; gap: 10px;
}
.mastery-icon { font-size: 24px; }
.mastery-title { font-size: 16px; font-weight: 700; color: #1565C0; }
.mastery-sub {
  font-size: 12px; color: #42A5F5; margin-left: auto; flex: 1;
}

/* ==================== 连续保护入口 ==================== */
.freeze-card {
  border: 1px solid #FFF3E0;
  background: linear-gradient(135deg, #FFF3E0 0%, #FFCC80 100%);
  cursor: pointer;
}
.freeze-header {
  display: flex; align-items: center; gap: 10px;
}
.freeze-icon { font-size: 24px; }
.freeze-title { font-size: 16px; font-weight: 700; color: #E65100; }
.freeze-sub {
  font-size: 12px; color: #FFA726; margin-left: auto; flex: 1;
}

/* ==================== 每日目标入口 ==================== */
.daily-goals-card {
  border: 1px solid #E8F5E9;
  background: linear-gradient(135deg, #E8F5E9 0%, #A5D6A7 100%);
  cursor: pointer;
  display: flex; align-items: center; gap: 12px;
}
.daily-goals-header {
  display: flex; align-items: center; gap: 10px; flex: 1;
}
.daily-goals-info {
  display: flex; align-items: center; gap: 10px;
}
.daily-goals-icon { font-size: 24px; }
.daily-goals-title { font-size: 16px; font-weight: 700; color: #2E7D32; display: block; }
.daily-goals-sub { font-size: 11px; color: #66BB6A; }
.daily-goals-mini-progress { position: relative; width: 52px; height: 52px; flex-shrink: 0; }
.mini-ring { position: relative; width: 100%; height: 100%; }
.mini-ring svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.mini-ring-bg { fill: none; stroke: rgba(255,255,255,0.4); stroke-width: 4; }
.mini-ring-fill { fill: none; stroke: #4CAF50; stroke-width: 4; stroke-linecap: round; stroke-dasharray: 213.6; transition: stroke-dashoffset 0.5s ease; }
.mini-pct {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  font-size: 11px; font-weight: 800; color: #2E7D32;
}

/* ==================== CEFR 语言等级入口 ==================== */
.lang-level-card {
  border: 1px solid #E3F2FD;
  background: linear-gradient(135deg, #E3F2FD 0%, #64B5F6 100%);
  cursor: pointer;
  display: flex; align-items: center; gap: 12px;
}
.lang-level-header {
  display: flex; align-items: center; gap: 10px; flex: 1;
}
.lang-level-info {
  display: flex; align-items: center; gap: 10px;
}
.lang-level-icon { font-size: 24px; }
.lang-level-title { font-size: 16px; font-weight: 700; color: #1565C0; display: block; }
.lang-level-sub { font-size: 11px; color: #42A5F5; }
.lang-level-badge {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 12px; background: rgba(255,255,255,0.3); border-radius: 12px;
}
.level-icon { font-size: 20px; }
.level-code { font-size: 16px; font-weight: 900; color: white; }

/* ==================== Quizizz 情感反馈入口 ==================== */
.quiz-reaction-card {
  border: 1px solid #FCE4EC;
  background: linear-gradient(135deg, #FCE4EC 0%, #F48FB1 100%);
  cursor: pointer;
  display: flex; align-items: center; gap: 12px;
}
.quiz-reaction-header {
  display: flex; align-items: center; gap: 10px; flex: 1;
}
.quiz-reaction-info {
  display: flex; align-items: center; gap: 10px;
}
.quiz-reaction-icon { font-size: 24px; }
.quiz-reaction-title { font-size: 16px; font-weight: 700; color: #C2185B; display: block; }
.quiz-reaction-sub { font-size: 11px; color: #EC407A; }
.quiz-reaction-preview {
  font-size: 18px; letter-spacing: 2px;
}
.reaction-emojis {
  display: inline-block;
  animation: emojiFloat 3s ease-in-out infinite;
}
@keyframes emojiFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

/* ==================== 学习热力图入口 ==================== */
.heatmap-card {
  border: 1px solid #C8E6C9;
  background: linear-gradient(135deg, #E8F5E9 0%, #A5D6A7 100%);
  cursor: pointer;
  display: flex; flex-direction: column; gap: 12px;
}
.heatmap-header {
  display: flex; align-items: center; gap: 10px;
}
.heatmap-info {
  display: flex; align-items: center; gap: 10px; flex: 1;
}
.heatmap-icon { font-size: 24px; }
.heatmap-title { font-size: 16px; font-weight: 700; color: #2E7D32; display: block; }
.heatmap-sub { font-size: 11px; color: #66BB6A; }
.heatmap-mini-grid {
  display: flex; gap: 2px;
}
.mini-day {
  width: 10px; height: 10px; border-radius: 2px;
}
.mini-day.level-0 { background: #ebedf0; }
.mini-day.level-1 { background: #9be9a8; }
.mini-day.level-2 { background: #40c463; }
.mini-day.level-3 { background: #30a14e; }
.mini-day.level-4 { background: #216e39; }

/* ==================== 语法助手入口 ==================== */
.grammar-card {
  border: 1px solid #E1BEE7;
  background: linear-gradient(135deg, #F3E5F5 0%, #CE93D8 100%);
  cursor: pointer;
  display: flex; align-items: center; gap: 12px;
}
.grammar-header {
  display: flex; align-items: center; gap: 10px; flex: 1;
}
.grammar-info {
  display: flex; align-items: center; gap: 10px;
}
.grammar-icon { font-size: 24px; }
.grammar-title { font-size: 16px; font-weight: 700; color: #7B1FA2; display: block; }
.grammar-sub { font-size: 11px; color: #AB47BC; }
.grammar-mini-score {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
}
.mini-score-circle {
  width: 40px; height: 40px; border-radius: 50%;
  background: rgba(255,255,255,0.5);
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; font-weight: 900; color: #7B1FA2;
}
.mini-score-label {
  font-size: 10px; color: #AB47BC;
}

/* ==================== 专注时间线入口 ==================== */
.focus-card {
  border: 1px solid #FFECB3;
  background: linear-gradient(135deg, #FFF8E1 0%, #FFD54F 100%);
  cursor: pointer;
  display: flex; flex-direction: column; gap: 12px;
}
.focus-header {
  display: flex; align-items: center; gap: 10px;
}
.focus-info {
  display: flex; align-items: center; gap: 10px; flex: 1;
}
.focus-icon { font-size: 24px; }
.focus-title { font-size: 16px; font-weight: 700; color: #E65100; display: block; }
.focus-sub { font-size: 11px; color: #FFA726; }
.focus-mini-trend {
  display: flex; align-items: flex-end; gap: 4px; height: 30px;
}
.mini-trend-bar {
  flex: 1;
  background: linear-gradient(to top, #FFB300, #FFD54F);
  border-radius: 2px 2px 0 0;
  min-height: 4px;
}

/* ==================== ELSA 音素教练入口 ==================== */
.phoneme-card {
  border: 1px solid #B3E5FC;
  background: linear-gradient(135deg, #E1F5FE 0%, #81D4FA 100%);
  cursor: pointer;
  display: flex; flex-direction: column; gap: 12px;
}
.phoneme-header {
  display: flex; align-items: center; gap: 10px;
}
.phoneme-info {
  display: flex; align-items: center; gap: 10px; flex: 1;
}
.phoneme-icon { font-size: 24px; }
.phoneme-title { font-size: 16px; font-weight: 700; color: #0277BD; display: block; }
.phoneme-sub { font-size: 11px; color: #039BE5; }
.phoneme-mini-preview {
  display: flex; gap: 6px; justify-content: center;
}
.phoneme-char {
  width: 32px; height: 32px;
  background: rgba(255,255,255,0.5);
  border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; font-weight: 800; color: #01579B;
}

/* ==================== 速度阅读入口 ==================== */
.speed-card {
  border: 1px solid #C5CAE9;
  background: linear-gradient(135deg, #E8EAF6 0%, #9FA8DA 100%);
  cursor: pointer;
  display: flex; align-items: center; gap: 16px;
}
.speed-header {
  display: flex; align-items: center; gap: 10px; flex: 1;
}
.speed-info {
  display: flex; align-items: center; gap: 10px;
}
.speed-icon { font-size: 24px; }
.speed-title { font-size: 16px; font-weight: 700; color: #283593; display: block; }
.speed-sub { font-size: 11px; color: #5C6BC0; }
.speed-mini-gauge {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
}
.gauge-value {
  width: 48px; height: 24px;
  font-size: 14px; font-weight: 900; color: #1A237E;
  border-bottom: 2px solid #1A237E;
}
.gauge-label { font-size: 9px; color: #5C6BC0; }

/* ==================== 题目收藏入口 ==================== */
.bookmark-card {
  border: 1px solid #FFF9C4;
  background: linear-gradient(135deg, #FFFDE7 0%, #FFF176 100%);
  cursor: pointer;
  display: flex; flex-direction: column; gap: 12px;
}
.bookmark-header {
  display: flex; align-items: center; gap: 10px;
}
.bookmark-info {
  display: flex; align-items: center; gap: 10px; flex: 1;
}
.bookmark-icon { font-size: 24px; }
.bookmark-title { font-size: 16px; font-weight: 700; color: #F57F17; display: block; }
.bookmark-sub { font-size: 11px; color: #FFA000; }
.bookmark-mini-count {
  display: flex; align-items: center; gap: 8px; justify-content: center;
}
.bm-count-value {
  font-size: 28px; font-weight: 900; color: #E65100;
}
.bm-count-label { font-size: 12px; color: #FFA000; }

/* ==================== Duolingo 联赛系统入口 ==================== */
.league-card {
  border: 1px solid #FFD700;
  background: linear-gradient(135deg, #FFF9E6 0%, #FFE066 100%);
  cursor: pointer;
  display: flex; flex-direction: column; gap: 12px;
}
.league-header {
  display: flex; align-items: center; gap: 10px;
}
.league-info {
  display: flex; align-items: center; gap: 10px; flex: 1;
}
.league-icon { font-size: 24px; }
.league-title { font-size: 16px; font-weight: 700; color: #B8860B; display: block; }
.league-sub { font-size: 11px; color: #DAA520; }
.league-mini-stats {
  display: flex; gap: 12px; justify-content: center;
}
.league-tier {
  font-size: 14px; font-weight: 700; color: #B8860B;
}
.league-rank {
  font-size: 12px; color: #DAA520;
}

/* ==================== 间隔重复复习入口 ==================== */
.srs-card {
  border: 1px solid #A78BFA;
  background: linear-gradient(135deg, #F5F3FF 0%, #C4B5FD 100%);
  cursor: pointer;
  display: flex; flex-direction: column; gap: 12px;
}
.srs-header {
  display: flex; align-items: center; gap: 10px;
}
.srs-info {
  display: flex; align-items: center; gap: 10px; flex: 1;
}
.srs-icon { font-size: 24px; }
.srs-title { font-size: 16px; font-weight: 700; color: #6B21A8; display: block; }
.srs-sub { font-size: 11px; color: #9333EA; }
.srs-mini-stats {
  display: flex; gap: 12px; justify-content: center;
}
.srs-due {
  font-size: 14px; font-weight: 700; color: #6B21A8;
}
.srs-retention {
  font-size: 12px; color: #9333EA;
}

/* ==================== 托福分数预测入口 ==================== */
.predictor-card {
  border: 1px solid #34D399;
  background: linear-gradient(135deg, #ECFDF5 0%, #6EE7B7 100%);
  cursor: pointer;
  display: flex; align-items: center; gap: 16px;
}
.predictor-header {
  display: flex; align-items: center; gap: 10px; flex: 1;
}
.predictor-info {
  display: flex; align-items: center; gap: 10px;
}
.predictor-icon { font-size: 24px; }
.predictor-title { font-size: 16px; font-weight: 700; color: #065F46; display: block; }
.predictor-sub { font-size: 11px; color: #059669; }
.predictor-mini-score {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
}
.pred-score-value {
  width: 48px; height: 24px;
  font-size: 14px; font-weight: 900; color: #064E3B;
  border-bottom: 2px solid #064E3B;
}
.pred-score-label { font-size: 9px; color: #059669; }

/* ==================== Round 29: 全真模考 ==================== */
.mock-exam-card {
  border-left: 3px solid #7c3aed;
}
.mock-header { display: flex; justify-content: space-between; align-items: center; }
.mock-info { display: flex; align-items: center; gap: 10px; }
.mock-icon { font-size: 22px; }
.mock-title { display: block; font-weight: 700; font-size: 15px; color: #1f2937; }
.mock-sub { display: block; font-size: 11px; color: #9ca3af; margin-top: 2px; }
.mock-mini-stats { display: flex; gap: 12px; font-size: 11px; color: #6b7280; margin-top: 8px; }
.mock-total { color: #7c3aed; font-weight: 600; }
.mock-best { color: #f59e0b; font-weight: 600; }

/* ==================== Round 29: 学习路径 ==================== */
.learning-path-card {
  border-left: 3px solid #0ea5e9;
}
.path-header { display: flex; justify-content: space-between; align-items: center; }
.path-info { display: flex; align-items: center; gap: 10px; }
.path-icon { font-size: 22px; }
.path-title { display: block; font-weight: 700; font-size: 15px; color: #1f2937; }
.path-sub { display: block; font-size: 11px; color: #9ca3af; margin-top: 2px; }
.path-mini-progress { margin-top: 8px; }
.mini-progress-bar { height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden; }
.mini-progress-fill { height: 100%; background: linear-gradient(90deg, #0ea5e9, #6366f1); border-radius: 3px; }
.path-percent { font-size: 10px; color: #0ea5e9; font-weight: 600; margin-top: 4px; display: block; }

/* ==================== Round 29: 每日碎片学习 ==================== */
.daily-micro-card {
  border-left: 3px solid #f59e0b;
}
.micro-header { display: flex; justify-content: space-between; align-items: center; }
.micro-info { display: flex; align-items: center; gap: 10px; }
.micro-icon { font-size: 22px; }
.micro-title { display: block; font-weight: 700; font-size: 15px; color: #1f2937; }
.micro-sub { display: block; font-size: 11px; color: #9ca3af; margin-top: 2px; }
.micro-mini-streak { display: flex; align-items: center; gap: 6px; margin-top: 8px; }
.micro-fire { font-size: 16px; }
.micro-streak-count { font-size: 12px; color: #ea580c; font-weight: 700; }

/* ==================== Round 30: 听力精听 ==================== */
.round30-card {
  border-left: 3px solid #6366f1;
}
.round30-header { display: flex; justify-content: space-between; align-items: center; }
.round30-info { display: flex; align-items: center; gap: 10px; }
.round30-icon-wrap {
  width: 44px; height: 44px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
}
.round30-title { display: block; font-weight: 700; font-size: 15px; color: #1f2937; }
.round30-sub { display: block; font-size: 11px; color: #9ca3af; margin-top: 2px; }
.round30-mini-stats { display: flex; gap: 12px; font-size: 11px; color: #6b7280; margin-top: 8px; }

/* ==================== Round 35: 新功能入口 ==================== */
.round35-card {
  border-left: 3px solid #4a6cf7;
}
.round35-card:nth-child(2) { border-left-color: #10b981; }
.round35-card:nth-child(3) { border-left-color: #f59e0b; }
.round35-header { display: flex; justify-content: space-between; align-items: center; }
.round35-info { display: flex; flex-direction: column; gap: 4px; }
.round35-title { display: block; font-weight: 700; font-size: 15px; color: #1f2937; }
.round35-sub { display: block; font-size: 11px; color: #9ca3af; }

/* ==================== Round 36: 新功能入口 ==================== */
.round36-card {
  border-left: 3px solid #ec4899;
}
.round36-card:nth-child(2) { border-left-color: #06b6d4; }
.round36-card:nth-child(3) { border-left-color: #8b5cf6; }
.round36-header { display: flex; justify-content: space-between; align-items: center; }
.round36-info { display: flex; flex-direction: column; gap: 4px; }
.round36-title { display: block; font-weight: 700; font-size: 15px; color: #1f2937; }
.round36-sub { display: block; font-size: 11px; color: #9ca3af; }
</style>
