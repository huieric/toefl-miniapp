<template>
  <div class="page-container pronunciation-page">
    <div class="page-header">
      <el-button text @click="$router.push('/speaking')">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
      <h2>🎙️ AI 发音对比</h2>
      <div class="header-spacer" />
    </div>

    <div class="pronunciation-content">
      <!-- 短语列表 -->
      <div class="phrases-section" v-if="!selectedPhrase">
        <h3>📖 选择练习短语</h3>
        <div class="phrases-list">
          <div 
            v-for="phrase in phrases" 
            :key="phrase.id"
            class="phrase-card"
            @click="selectPhrase(phrase)"
          >
            <div class="phrase-text">{{ phrase.text }}</div>
            <div class="phrase-tags">
              <el-tag size="small" :type="getDifficultyTag(phrase.difficulty)">
                {{ getDifficultyLabel(phrase.difficulty) }}
              </el-tag>
              <el-tag size="small" type="info">{{ phrase.category }}</el-tag>
            </div>
            <el-button size="small" type="primary" @click.stop="analyzePhrase(phrase)">
              开始对比
            </el-button>
          </div>
        </div>
      </div>

      <!-- 发音对比 -->
      <div class="comparison-section" v-if="selectedPhrase && analysis">
        <div class="phrase-display">
          <h3>{{ selectedPhrase.text }}</h3>
        </div>

        <!-- 总体评分 -->
        <div class="overall-score">
          <div class="score-circle" :style="{ borderColor: getScoreColor(analysis.overallScore) }">
            <span class="score-value">{{ analysis.overallScore.toFixed(1) }}</span>
            <span class="score-max">/ 5</span>
          </div>
          <div class="score-label">{{ getScoreLabel(analysis.overallScore) }}</div>
        </div>

        <!-- 维度评分 -->
        <div class="dimension-scores">
          <div class="dimension-item">
            <span class="dimension-name">发音</span>
            <div class="dimension-bar">
              <div class="dimension-fill" :style="{ width: (analysis.overallScore / 5 * 100) + '%' }"></div>
            </div>
            <span class="dimension-value">{{ analysis.overallScore.toFixed(1) }}</span>
          </div>
          <div class="dimension-item">
            <span class="dimension-name">节奏</span>
            <div class="dimension-bar">
              <div class="dimension-fill" :style="{ width: (analysis.rhythmScore / 5 * 100) + '%' }"></div>
            </div>
            <span class="dimension-value">{{ analysis.rhythmScore.toFixed(1) }}</span>
          </div>
          <div class="dimension-item">
            <span class="dimension-name">语调</span>
            <div class="dimension-bar">
              <div class="dimension-fill" :style="{ width: (analysis.intonationScore / 5 * 100) + '%' }"></div>
            </div>
            <span class="dimension-value">{{ analysis.intonationScore.toFixed(1) }}</span>
          </div>
        </div>

        <!-- 逐词评分 -->
        <div class="word-analysis">
          <h3>📝 逐词分析</h3>
          <div class="words-grid">
            <div 
              v-for="(word, idx) in analysis.wordScores" 
              :key="idx"
              class="word-item"
              :class="{ 'word-poor': word.score < 3.5, 'word-good': word.score >= 4.5 }"
            >
              <span class="word-text">{{ word.word }}</span>
              <span class="word-score">{{ word.score.toFixed(1) }}</span>
              <div class="phoneme-icons">
                <span v-for="(phoneme, pIdx) in word.phonemes" :key="pIdx" class="phoneme" :title="phoneme.phoneme">
                  {{ phoneme.phoneme }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 改进建议 -->
        <div class="improvement-section">
          <h3>💡 改进建议</h3>
          <p>{{ analysis.suggestion }}</p>
          <div class="needs-improvement" v-if="analysis.needsImprovement.length > 0">
            <p>需要重点练习：{{ analysis.needsImprovement.join('、') }}</p>
          </div>
        </div>

        <!-- 常见音素提示 -->
        <div class="phoneme-tips">
          <h3>🔤 常见音素练习</h3>
          <div class="tips-grid">
            <div class="tip-item" v-for="tip in analysis.phonemeAnalysis" :key="tip.phoneme">
              <span class="tip-phoneme">{{ tip.phoneme }}</span>
              <span class="tip-text">{{ tip.tip }}</span>
              <el-tag size="small" :type="getPhonemeDifficultyTag(tip.difficulty)">
                {{ getPhonemeDifficultyLabel(tip.difficulty) }}
              </el-tag>
            </div>
          </div>
        </div>

        <div class="comparison-actions">
          <el-button type="primary" @click="analyzePhrase(selectedPhrase)">
            重新录制
          </el-button>
          <el-button @click="selectedPhrase = null">
            选择新短语
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { pronunciationComparisonAPI } from '@/api'

const phrases = ref([])
const selectedPhrase = ref(null)
const analysis = ref(null)

onMounted(async () => {
  await loadPhrases()
})

const loadPhrases = async () => {
  try {
    const res = await pronunciationComparisonAPI.getPhrases()
    phrases.value = res.data?.data?.phrases || []
  } catch {
    // Use mock data
    phrases.value = [
      { id: 1, text: 'The biodiversity of the ecosystem is crucial for environmental stability.', difficulty: 'hard', category: 'academic' },
      { id: 2, text: 'Scientists have observed a correlation between habitat loss and species extinction.', difficulty: 'medium', category: 'science' },
      { id: 3, text: 'Climate change has significant impacts on global weather patterns.', difficulty: 'medium', category: 'environment' },
    ]
  }
}

const selectPhrase = (phrase) => {
  selectedPhrase.value = phrase
  analysis.value = null
}

const analyzePhrase = async (phrase) => {
  try {
    const res = await pronunciationComparisonAPI.analyze({ phraseId: phrase.id, phrase: phrase.text })
    analysis.value = res.data?.data || generateMockAnalysis(phrase.text)
    ElMessage.success('分析完成')
  } catch (e) {
    // Use mock analysis
    analysis.value = generateMockAnalysis(phrase.text)
    ElMessage.success('分析完成（模拟数据）')
  }
}

const generateMockAnalysis = (text) => {
  const words = text.split(/\s+/).filter(w => w)
  const wordScores = words.map(w => ({
    word: w.replace(/[^a-zA-Z]/g, ''),
    score: 3.0 + Math.random() * 2.0,
    confidence: 0.7 + Math.random() * 0.3,
    phonemes: [{ phoneme: w.charAt(0), score: 3.5 }],
  }))
  
  const avgScore = wordScores.reduce((s, w) => s + w.score, 0) / wordScores.length

  return {
    overallScore: avgScore,
    wordScores,
    rhythmScore: 3.5 + Math.random() * 1.5,
    intonationScore: 3.5 + Math.random() * 1.5,
    needsImprovement: wordScores.filter(w => w.score < 3.5).map(w => w.word),
    suggestion: '继续练习，注意语调和节奏。',
    phonemeAnalysis: [
      { phoneme: '/θ/', tip: '舌尖轻触上齿，送气发音', difficulty: 'hard' },
      { phoneme: '/r/', tip: '舌尖卷起，不接触上颚', difficulty: 'hard' },
      { phoneme: '/æ/', tip: '嘴巴张大，舌尖抵下齿', difficulty: 'medium' },
    ],
  }
}

const getScoreColor = (score) => {
  if (score >= 4.5) return '#10b981'
  if (score >= 3.5) return '#3b82f6'
  if (score >= 2.5) return '#f59e0b'
  return '#ef4444'
}

const getScoreLabel = (score) => {
  if (score >= 4.5) return 'Excellent'
  if (score >= 3.5) return 'Good'
  if (score >= 2.5) return 'Fair'
  return 'Needs Improvement'
}

const getDifficultyTag = (d) => ({ easy: '', medium: 'warning', hard: 'danger' }[d] || '')
const getDifficultyLabel = (d) => ({ easy: '简单', medium: '中等', hard: '困难' }[d] || d)
const getPhonemeDifficultyTag = (d) => ({ easy: 'success', medium: 'warning', hard: 'danger' }[d] || '')
const getPhonemeDifficultyLabel = (d) => ({ easy: '简单', medium: '中等', hard: '困难' }[d] || d)
</script>

<style scoped>
.pronunciation-page {
  max-width: 900px;
  margin: 0 auto;
}

.phrases-section h3,
.word-analysis h3,
.improvement-section h3,
.phoneme-tips h3 {
  margin-bottom: 16px;
  color: #333;
}

.phrases-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.phrase-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.phrase-text {
  font-size: 15px;
  line-height: 1.6;
  color: #333;
}

.phrase-tags {
  display: flex;
  gap: 8px;
}

.comparison-section {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.overall-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 24px 0;
}

.score-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 6px solid #4a6cf7;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.score-value {
  font-size: 36px;
  font-weight: 700;
  color: #333;
}

.score-max {
  font-size: 14px;
  color: #909399;
}

.score-label {
  font-size: 18px;
  font-weight: 600;
  margin-top: 8px;
}

.dimension-scores {
  margin: 24px 0;
}

.dimension-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.dimension-name {
  min-width: 60px;
  font-weight: 500;
}

.dimension-bar {
  flex: 1;
  height: 8px;
  background: #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
}

.dimension-fill {
  height: 100%;
  background: linear-gradient(90deg, #4a6cf7, #10b981);
  border-radius: 4px;
}

.dimension-value {
  min-width: 40px;
  font-weight: 600;
  color: #4a6cf7;
}

.word-analysis {
  margin: 24px 0;
}

.words-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.word-item {
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.word-item.word-poor {
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.word-item.word-good {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
}

.word-text {
  font-weight: 600;
  color: #333;
}

.word-score {
  font-size: 12px;
  color: #4a6cf7;
  font-weight: 600;
}

.phoneme-icons {
  display: flex;
  gap: 4px;
}

.phoneme {
  font-size: 11px;
  padding: 2px 4px;
  background: #eef2ff;
  border-radius: 3px;
  color: #4a6cf7;
}

.improvement-section {
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 8px;
  padding: 16px;
  margin: 24px 0;
}

.improvement-section p {
  margin: 4px 0;
}

.needs-improvement p {
  color: #f59e0b;
  font-weight: 500;
}

.phoneme-tips {
  margin: 24px 0;
}

.tips-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.tip-phoneme {
  font-size: 18px;
  font-weight: 700;
  color: #4a6cf7;
  min-width: 40px;
}

.tip-text {
  flex: 1;
}

.comparison-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}
</style>
