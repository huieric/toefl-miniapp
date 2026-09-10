<template>
  <div class="learning-path-page">
    <!-- 概览卡片 -->
    <div class="path-overview">
      <div class="path-hero">
        <div class="path-info">
          <h2>🗺️ 学习路径</h2>
          <p class="path-desc">个性化技能树，科学规划每一步提升</p>
          <div class="path-stats">
            <div class="stat">
              <span class="stat-value">{{ overview.completedSkills }}</span>
              <span class="stat-label">已掌握</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ overview.inProgressSkills }}</span>
              <span class="stat-label">学习中</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ overview.lockedSkills }}</span>
              <span class="stat-label">待解锁</span>
            </div>
          </div>
        </div>
        <div class="path-progress-ring">
          <svg viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" fill="none" stroke="#f0f0f0" stroke-width="10" />
            <circle cx="60" cy="60" r="50" fill="none" stroke="#667eea" stroke-width="10"
              :stroke-dasharray="circumference" :stroke-dashoffset="circumference - (circumference * overview.overall / 100)"
              transform="rotate(-90 60 60)" stroke-linecap="round" />
            <text x="60" y="56" text-anchor="middle" font-size="24" font-weight="700" fill="#667eea">
              {{ overview.overall }}%
            </text>
            <text x="60" y="72" text-anchor="middle" font-size="10" fill="#999">
              总进度
            </text>
          </svg>
        </div>
      </div>
    </div>

    <!-- 推荐下一步 -->
    <div class="recommend-section" v-if="recommendations.length > 0">
      <h3>📌 推荐学习</h3>
      <div class="recommend-cards">
        <div class="recommend-card" v-for="rec in recommendations.slice(0, 3)" :key="rec.skill.id">
          <div class="rec-icon">{{ SECTION_CONFIG[rec.section].icon }}</div>
          <div class="rec-info">
            <span class="rec-section">{{ SECTION_CONFIG[rec.section].name }}</span>
            <span class="rec-skill-name">{{ rec.skill.name }}</span>
            <span class="rec-desc">{{ rec.skill.description }}</span>
          </div>
          <button class="start-learning-btn" @click="goToSkill(rec.section, rec.skill.id)">
            开始学习
          </button>
        </div>
      </div>
    </div>

    <!-- 技能树切换 -->
    <div class="section-tabs">
      <button class="tab" :class="{ active: activeSection === s }"
        v-for="s in ['reading', 'listening', 'speaking', 'writing']" :key="s"
        @click="activeSection = s">
        {{ SECTION_CONFIG[s].icon }} {{ SECTION_CONFIG[s].name }}
      </button>
    </div>

    <!-- 技能树可视化 -->
    <div class="skill-tree">
      <div class="tree-level" v-for="level in [1, 2, 3]" :key="level">
        <div class="level-label">Level {{ level }}</div>
        <div class="skill-nodes">
          <div class="skill-node" v-for="skill in filteredSkills(level)" :key="skill.id"
            :class="{ 
              'mastered': skill.status === 'mastered',
              'in-progress': skill.status === 'in-progress',
              'learning': skill.status === 'learning',
              'locked': skill.status === 'locked',
            }"
            @click="skill.status !== 'locked' && showSkillDetail(skill)">
            <div class="node-icon">{{ SECTION_CONFIG[activeSection].icon }}</div>
            <div class="node-info">
              <span class="node-name">{{ skill.name }}</span>
              <span class="node-mastery">{{ skill.mastery }}%</span>
            </div>
            <div class="node-progress">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: skill.mastery + '%' }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 学习路径模板 -->
    <div class="path-templates">
      <h3>📚 学习路径模板</h3>
      <div class="template-cards">
        <div class="template-card" v-for="tpl in templates" :key="tpl.id">
          <div class="template-header">
            <span class="template-name">{{ tpl.name }}</span>
            <span class="template-difficulty" :class="tpl.difficulty">
              {{ tpl.difficulty === 'intensive' ? '🔥 高强度' : tpl.difficulty === 'moderate' ? '⚡ 中等' : '🌱 轻松' }}
            </span>
          </div>
          <p class="template-desc">{{ tpl.description }}</p>
          <div class="template-meta">
            <span>📅 {{ tpl.duration }}天</span>
            <span>⏰ 每天{{ tpl.dailyHours }}小时</span>
            <span>🎯 {{ tpl.targetScore }}+</span>
          </div>
          <button class="select-template-btn" @click="selectTemplate(tpl)">选择此路径</button>
        </div>
      </div>
    </div>

    <!-- 技能详情弹窗 -->
    <div class="modal-overlay" v-if="selectedSkill" @click="selectedSkill = null">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ SECTION_CONFIG[selectedSkill.section]?.icon || '📊' }} {{ selectedSkill.name }}</h3>
          <button class="close-btn" @click="selectedSkill = null">✕</button>
        </div>
        <div class="modal-body">
          <p class="skill-description">{{ selectedSkill.description }}</p>
          <div class="skill-mastery-bar">
            <div class="bar-track">
              <div class="bar-fill" :style="{ width: selectedSkill.mastery + '%' }"></div>
            </div>
            <span class="bar-text">{{ selectedSkill.mastery }}% 掌握</span>
          </div>
          <div class="skill-stats">
            <div class="skill-stat">
              <span class="stat-icon">📝</span>
              <span class="stat-text">已练习 {{ selectedSkill.mastered }}/{{ selectedSkill.questions }} 题</span>
            </div>
            <div class="skill-stat">
              <span class="stat-icon">🔓</span>
              <span class="stat-text">{{ skillStatusText(selectedSkill.status) }}</span>
            </div>
          </div>
          <div class="skill-prerequisites" v-if="selectedSkill.prerequisite?.length > 0">
            <p class="prereq-title">前置技能：</p>
            <div class="prereq-list">
              <span class="prereq-tag" v-for="preId in selectedSkill.prerequisite" :key="preId">
                {{ getSkillName(preId) }}
              </span>
            </div>
          </div>
          <button class="practice-btn" @click="startPractice(selectedSkill)">
            开始练习
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { learningPathAPI } from '@/api'

const SECTION_CONFIG = {
  reading: { name: '阅读', icon: '📖', color: '#FF6B6B' },
  listening: { name: '听力', icon: '🎧', color: '#4ECDC4' },
  speaking: { name: '口语', icon: '🗣️', color: '#FFD93D' },
  writing: { name: '写作', icon: '✍️', color: '#6C5CE7' },
}

const SKILL_STATUS_MAP = {
  'mastered': '已掌握',
  'in-progress': '练习中',
  'learning': '学习中',
  'locked': '未解锁',
}

export default {
  name: 'LearningPath',
  setup() {
    const activeSection = ref('reading')
    const skills = ref([])
    const recommendations = ref([])
    const templates = ref([])
    const overview = ref({ overall: 0, completedSkills: 0, inProgressSkills: 0, lockedSkills: 0 })
    const selectedSkill = ref(null)
    const circumference = 2 * Math.PI * 50

    async function loadSkillTree() {
      try {
        const res = await learningPathAPI.getTree(activeSection.value)
        const data = res.data?.data
        if (data) {
          skills.value = data.skills.map(s => ({
            ...s,
            section: activeSection.value,
          }))
        }
      } catch (e) {
        console.error('加载技能树失败:', e)
        skills.value = getDefaultSkills()
      }
    }

    async function loadRecommendations() {
      try {
        const res = await learningPathAPI.getRecommend()
        const data = res.data?.data
        if (data) {
          recommendations.value = data.recommendations
        }
      } catch (e) {
        console.error('加载推荐失败:', e)
        recommendations.value = []
      }
    }

    async function loadTemplates() {
      try {
        const res = await learningPathAPI.getTemplates()
        const data = res.data?.data
        if (data) {
          templates.value = data.templates
        }
      } catch (e) {
        console.error('加载模板失败:', e)
        templates.value = []
      }
    }

    async function loadOverview() {
      try {
        const res = await learningPathAPI.getOverview()
        const data = res.data?.data
        if (data) {
          overview.value = data.progress
        }
      } catch (e) {
        overview.value = {
          overall: 35,
          completedSkills: 12,
          inProgressSkills: 8,
          lockedSkills: 12,
        }
      }
    }

    function getDefaultSkills() {
      return [
        { id: 'read-001', name: '主旨题', description: '掌握文章主旨和大意', level: 1, status: 'in-progress', mastery: 72, mastered: 18, questions: 25, prerequisite: [], section: 'reading' },
        { id: 'read-002', name: '细节题', description: '定位和提取具体信息', level: 1, status: 'in-progress', mastery: 83, mastered: 25, questions: 30, prerequisite: [], section: 'reading' },
        { id: 'read-003', name: '推理题', description: '基于文本进行合理推断', level: 2, status: 'learning', mastery: 60, mastered: 12, questions: 20, prerequisite: ['read-001'], section: 'reading' },
        { id: 'read-004', name: '词汇题', description: '根据上下文推断词义', level: 1, status: 'in-progress', mastery: 80, mastered: 28, questions: 35, prerequisite: [], section: 'reading' },
        { id: 'read-005', name: '句子简化', description: '理解长难句并简化', level: 2, status: 'learning', mastery: 53, mastered: 8, questions: 15, prerequisite: ['read-001'], section: 'reading' },
      ]
    }

    function filteredSkills(level) {
      return skills.value.filter(s => s.level === level)
    }

    function skillStatusText(status) {
      return SKILL_STATUS_MAP[status] || '未知'
    }

    function getSkillName(skillId) {
      const skill = skills.value.find(s => s.id === skillId)
      return skill?.name || skillId
    }

    function showSkillDetail(skill) {
      selectedSkill.value = skill
    }

    function goToSkill(section, skillId) {
      activeSection.value = section
      loadSkillTree()
      setTimeout(() => {
        const skill = skills.value.find(s => s.id === skillId)
        if (skill) showSkillDetail(skill)
      }, 100)
    }

    function startPractice(skill) {
      selectedSkill.value = null
      // 导航到对应练习页面
    }

    function selectTemplate(tpl) {
      // 选择路径模板
    }

    watch(activeSection, () => {
      loadSkillTree()
    })

    onMounted(() => {
      loadSkillTree()
      loadRecommendations()
      loadTemplates()
      loadOverview()
    })

    return {
      SECTION_CONFIG,
      activeSection,
      skills,
      recommendations,
      templates,
      overview,
      selectedSkill,
      circumference,
      filteredSkills,
      skillStatusText,
      getSkillName,
      showSkillDetail,
      goToSkill,
      startPractice,
      selectTemplate,
    }
  },
}
</script>

<style scoped>
.learning-path-page {
  padding: 24px;
  max-width: 1000px;
  margin: 0 auto;
}

/* 概览 */
.path-hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 32px;
  color: white;
  margin-bottom: 24px;
}

.path-info h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
}

.path-desc {
  margin: 0 0 16px 0;
  opacity: 0.9;
}

.path-stats {
  display: flex;
  gap: 24px;
}

.stat {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 28px;
  font-weight: 700;
}

.stat-label {
  font-size: 12px;
  opacity: 0.8;
}

.path-progress-ring svg {
  width: 120px;
  height: 120px;
}

/* 推荐 */
.recommend-section {
  margin-bottom: 24px;
}

.recommend-section h3 {
  margin-bottom: 16px;
}

.recommend-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.recommend-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 12px;
}

.rec-icon {
  font-size: 32px;
}

.rec-info {
  flex: 1;
}

.rec-section {
  font-size: 11px;
  color: #999;
  display: block;
}

.rec-skill-name {
  font-size: 14px;
  font-weight: 600;
  display: block;
  margin: 2px 0;
}

.rec-desc {
  font-size: 12px;
  color: #666;
}

.start-learning-btn {
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
}

/* 标签页 */
.section-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
}

.tab {
  flex: 1;
  padding: 12px;
  background: white;
  border: 2px solid #f0f0f0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.tab.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: #667eea;
}

/* 技能树 */
.skill-tree {
  margin-bottom: 32px;
}

.tree-level {
  margin-bottom: 24px;
}

.level-label {
  font-size: 14px;
  font-weight: 600;
  color: #999;
  margin-bottom: 12px;
  text-transform: uppercase;
}

.skill-nodes {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.skill-node {
  background: white;
  border-radius: 12px;
  padding: 16px;
  width: calc(50% - 6px);
  min-width: 200px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s;
  border-left: 4px solid #f0f0f0;
}

.skill-node:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.skill-node.mastered {
  border-left-color: #10b981;
  background: #ecfdf5;
}

.skill-node.in-progress {
  border-left-color: #667eea;
  background: #f0f7ff;
}

.skill-node.learning {
  border-left-color: #f59e0b;
  background: #fffbeb;
}

.skill-node.locked {
  border-left-color: #d1d5db;
  background: #f9fafb;
  opacity: 0.6;
  cursor: not-allowed;
}

.node-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.node-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.node-name {
  font-weight: 600;
  font-size: 14px;
}

.node-mastery {
  font-size: 13px;
  color: #667eea;
  font-weight: 700;
}

.progress-bar {
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 3px;
  transition: width 0.5s ease;
}

/* 模板 */
.path-templates {
  margin-bottom: 24px;
}

.path-templates h3 {
  margin-bottom: 16px;
}

.template-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.template-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.template-name {
  font-weight: 600;
  font-size: 16px;
}

.template-difficulty {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 12px;
}

.template-difficulty.intensive {
  background: #fee2e2;
  color: #dc2626;
}

.template-difficulty.moderate {
  background: #fef3c7;
  color: #d97706;
}

.template-difficulty.gentle {
  background: #ecfdf5;
  color: #059669;
}

.template-desc {
  font-size: 13px;
  color: #666;
  margin-bottom: 12px;
}

.template-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #999;
  margin-bottom: 12px;
}

.select-template-btn {
  width: 100%;
  padding: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 16px;
  padding: 24px;
  max-width: 480px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.modal-header h3 {
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #999;
}

.skill-description {
  color: #666;
  margin-bottom: 16px;
}

.skill-mastery-bar {
  margin-bottom: 16px;
}

.bar-track {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 4px;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 4px;
}

.bar-text {
  font-size: 12px;
  color: #666;
}

.skill-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.skill-stat {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #666;
}

.skill-prerequisites {
  margin-bottom: 16px;
}

.prereq-title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
}

.prereq-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.prereq-tag {
  padding: 4px 12px;
  background: #f0f7ff;
  color: #667eea;
  border-radius: 12px;
  font-size: 12px;
}

.practice-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
}

/* 响应式 */
@media (max-width: 768px) {
  .path-hero {
    flex-direction: column;
    text-align: center;
  }
  
  .skill-node {
    width: 100%;
  }
}
</style>
