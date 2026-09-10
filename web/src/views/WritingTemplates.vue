<template>
  <div class="page-container templates-page">
    <div class="page-header">
      <el-button text @click="$router.push('/writing')">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
      <h2>📝 写作模板库</h2>
      <div class="header-spacer" />
    </div>

    <div class="templates-content">
      <!-- 分类选择 -->
      <div class="categories-section" v-if="!selectedCategory">
        <h3>选择模板分类</h3>
        <div class="categories-grid">
          <div 
            v-for="cat in categories" 
            :key="cat.id"
            class="category-card"
            @click="selectCategory(cat)"
          >
            <div class="category-icon">{{ cat.icon }}</div>
            <div class="category-info">
              <h4>{{ cat.name }}</h4>
              <p>{{ cat.description }}</p>
              <span class="template-count">{{ cat.count }} 个模板</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 模板列表 -->
      <div class="templates-list" v-if="selectedCategory && !selectedTemplate">
        <div class="list-header">
          <el-button text @click="selectedCategory = null">
            <el-icon><ArrowLeft /></el-icon> 返回分类
          </el-button>
          <h3>{{ selectedCategory.name }}模板</h3>
        </div>

        <div class="template-cards">
          <div 
            v-for="template in templates" 
            :key="template.id"
            class="template-card"
            @click="selectTemplate(template)"
          >
            <div class="template-header">
              <h4>{{ template.title }}</h4>
              <el-tag :type="getDifficultyTag(template.difficulty)" size="small">
                {{ getDifficultyLabel(template.difficulty) }}
              </el-tag>
            </div>
            <p class="template-desc">{{ template.description }}</p>
            <p class="template-usage"><strong>适用：</strong>{{ template.usage }}</p>
            <div class="template-meta">
              <span>~{{ template.sampleWordCount }} 词</span>
              <span>{{ template.structure.length }} 段结构</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 模板详情 -->
      <div class="template-detail" v-if="selectedTemplate">
        <div class="detail-header">
          <el-button text @click="selectedTemplate = null">
            <el-icon><ArrowLeft /></el-icon> 返回
          </el-button>
          <h2>{{ selectedTemplate.title }}</h2>
        </div>

        <div class="detail-content">
          <div class="detail-section">
            <h3>📋 适用场景</h3>
            <p>{{ selectedTemplate.usage }}</p>
          </div>

          <div class="detail-section">
            <h3>🏗️ 文章结构</h3>
            <ol class="structure-list">
              <li v-for="(step, idx) in selectedTemplate.structure" :key="idx">
                {{ step }}
              </li>
            </ol>
          </div>

          <div class="detail-section">
            <h3>🎯 常用开头句</h3>
            <div class="phrase-box" v-for="(phrase, idx) in selectedTemplate.openingPhrases" :key="'open' + idx">
              <el-icon><Message /></el-icon>
              <span>{{ phrase }}</span>
            </div>
          </div>

          <div class="detail-section">
            <h3>📝 正文连接句</h3>
            <div class="phrase-box" v-for="(phrase, idx) in selectedTemplate.bodyPhrases" :key="'body' + idx">
              <el-icon><Message /></el-icon>
              <span>{{ phrase }}</span>
            </div>
          </div>

          <div class="detail-section">
            <h3>✅ 常用结尾句</h3>
            <div class="phrase-box" v-for="(phrase, idx) in selectedTemplate.closingPhrases" :key="'close' + idx">
              <el-icon><Message /></el-icon>
              <span>{{ phrase }}</span>
            </div>
          </div>

          <div class="detail-actions">
            <el-button type="primary" size="large" @click="copyTemplate">
              复制模板
            </el-button>
            <el-button @click="useInEditor">
              在编辑器中使用
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Message } from '@element-plus/icons-vue'
import { writingTemplatesAPI } from '@/api'

const categories = ref([])
const selectedCategory = ref(null)
const templates = ref([])
const selectedTemplate = ref(null)

onMounted(async () => {
  await loadCategories()
})

const loadCategories = async () => {
  try {
    const res = await writingTemplatesAPI.getCategories()
    categories.value = res.data?.data?.categories || []
  } catch {
    // Mock data
    categories.value = [
      { id: 'independent', name: '独立写作', icon: '📝', count: 8, description: 'TOEFL Writing Task 1 模板' },
      { id: 'integrated', name: '综合写作', icon: '📖', count: 6, description: 'TOEFL Writing Task 2 模板' },
      { id: 'academic', name: '学术写作', icon: '🎓', count: 5, description: '通用学术写作技巧' },
    ]
  }
}

const selectCategory = async (cat) => {
  selectedCategory.value = cat
  
  try {
    const res = await writingTemplatesAPI.getList({ category: cat.id })
    templates.value = res.data?.data?.templates || []
  } catch {
    // Mock templates
    templates.value = [
      {
        id: 1,
        title: '议论文经典五段式',
        description: '适用于大多数独立写作题目',
        difficulty: 'beginner',
        usage: '适用于观点选择类、建议类、同意与否同类题目',
        structure: [
          'Introduction: 背景引入 + 明确立场',
          'Body 1: 第一个理由 + 具体例子',
          'Body 2: 第二个理由 + 具体例子',
          'Body 3: 第三个理由/让步段',
          'Conclusion: 重申立场 + 总结要点',
        ],
        openingPhrases: [
          'In today\'s society, the issue of...has become increasingly debated.',
          'Whether...is a topic that warrants careful consideration.',
        ],
        bodyPhrases: [
          'First and foremost, ...',
          'Another compelling reason is that...',
          'Furthermore, ...',
        ],
        closingPhrases: [
          'In conclusion, I firmly believe that...',
          'To summarize, the evidence clearly supports...',
        ],
        sampleWordCount: 300,
      },
    ]
  }
}

const selectTemplate = (template) => {
  selectedTemplate.value = template
}

const copyTemplate = () => {
  const text = JSON.stringify(selectedTemplate.value, null, 2)
  navigator.clipboard?.writeText(text)
  ElMessage.success('模板已复制到剪贴板')
}

const useInEditor = () => {
  ElMessage.info('跳转到写作编辑器')
}

const getDifficultyTag = (d) => ({ beginner: 'success', intermediate: 'warning', advanced: 'danger' }[d] || '')
const getDifficultyLabel = (d) => ({ beginner: '初级', intermediate: '中级', advanced: '高级' }[d] || d)
</script>

<style scoped>
.templates-page {
  max-width: 900px;
  margin: 0 auto;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.category-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  gap: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: transform 0.2s;
}

.category-card:hover {
  transform: translateY(-4px);
}

.category-icon {
  font-size: 48px;
}

.category-info h4 {
  margin: 0 0 8px;
  color: #333;
}

.category-info p {
  margin: 0 0 8px;
  font-size: 13px;
  color: #666;
}

.template-count {
  font-size: 12px;
  color: #4a6cf7;
  font-weight: 500;
}

.list-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.template-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.template-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: transform 0.2s;
}

.template-card:hover {
  transform: translateX(8px);
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.template-header h4 {
  margin: 0;
  color: #333;
}

.template-desc {
  margin: 0 0 8px;
  color: #666;
  font-size: 14px;
}

.template-usage {
  margin: 0 0 12px;
  font-size: 13px;
  color: #666;
}

.template-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #909399;
}

.template-detail {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e4e7ed;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section h3 {
  margin-bottom: 12px;
  color: #333;
}

.structure-list {
  padding-left: 20px;
}

.structure-list li {
  margin-bottom: 8px;
  color: #666;
  line-height: 1.6;
}

.phrase-box {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px;
  margin-bottom: 8px;
  background: #f8f9fa;
  border-radius: 6px;
  color: #333;
  line-height: 1.6;
}

.detail-actions {
  display: flex;
  gap: 12px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e4e7ed;
}
</style>
