<template>
  <div class="page-container vocab-games-page">
    <div class="page-header">
      <el-button text @click="$router.push('/vocab')">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
      <h2>🎮 词汇游戏</h2>
      <div class="header-spacer" />
    </div>

    <div class="games-content">
      <!-- 游戏选择 -->
      <div class="games-selector" v-if="!activeGame">
        <div class="game-card" v-for="game in games" :key="game.id" @click="startGame(game)">
          <div class="game-icon">{{ game.icon }}</div>
          <div class="game-info">
            <h3>{{ game.name }}</h3>
            <p>{{ game.description }}</p>
            <el-tag size="small" :type="getDifficultyTag(game.difficulty)">
              {{ getDifficultyLabel(game.difficulty) }}
            </el-tag>
          </div>
          <el-button type="primary" size="small">
            开始 <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
      </div>

      <!-- 配对游戏 -->
      <div class="game-area" v-if="activeGame === 'matching'">
        <div class="game-header">
          <h3>🎯 词汇配对</h3>
          <div class="game-stats">
            <span>已配对: {{ matchedCount }} / {{ totalPairs }}</span>
          </div>
        </div>

        <div class="matching-board">
          <div class="words-column">
            <div
              v-for="word in matchingData.words"
              :key="word.id"
              class="match-item word-item"
              :class="{ selected: selectedWord === word.id, matched: word.matched }"
              @click="selectWord(word.id)"
            >
              {{ word.text }}
            </div>
          </div>

          <div class="meanings-column">
            <div
              v-for="meaning in matchingData.meanings"
              :key="meaning.id"
              class="match-item meaning-item"
              :class="{ selected: selectedMeaning === meaning.id, matched: meaning.matched }"
              @click="selectMeaning(meaning.id)"
            >
              {{ meaning.text }}
            </div>
          </div>
        </div>

        <div class="game-actions">
          <el-button @click="resetMatchingGame">重新开始</el-button>
          <el-button type="success" @click="exitGame" v-if="isGameComplete">退出</el-button>
        </div>
      </div>

      <!-- 测试模式 -->
      <div class="game-area" v-if="activeGame === 'test'">
        <div class="game-header">
          <h3>📝 词汇测试</h3>
          <div class="game-stats">
            <span>第 {{ testQuestionIndex + 1 }} / {{ testQuestions.length }}</span>
          </div>
        </div>

        <div class="test-question">
          <p class="question-text">{{ testQuestions[testQuestionIndex]?.question }}</p>
          <div class="test-options">
            <div
              v-for="(opt, idx) in testQuestions[testQuestionIndex]?.options"
              :key="idx"
              class="test-option"
              :class="{ selected: testSelectedAnswer === idx }"
              @click="submitTestAnswer(idx)"
            >
              {{ String.fromCharCode(65 + idx) }}. {{ opt }}
            </div>
          </div>
        </div>

        <div class="test-feedback" v-if="testFeedback">
          <el-tag :type="testFeedback?.correct ? 'success' : 'danger'" size="large">
            {{ testFeedback?.correct ? '✓ 正确!' : '✗ 错误' }}
          </el-tag>
          <p>{{ testFeedback?.explanation }}</p>
        </div>

        <div class="game-actions">
          <el-button type="primary" @click="nextTestQuestion" :disabled="!testFeedback">
            下一题 <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
      </div>

      <!-- 游戏结果 -->
      <div class="game-result" v-if="gameResult">
        <div class="result-card">
          <h2>🎉 游戏完成！</h2>
          <div class="result-stats">
            <div class="result-stat">
              <span class="result-value">{{ gameResult.score }}</span>
              <span class="result-label">得分</span>
            </div>
            <div class="result-stat">
              <span class="result-value">{{ gameResult.correct }}</span>
              <span class="result-label">正确</span>
            </div>
            <div class="result-stat">
              <span class="result-value">{{ gameResult.time }}s</span>
              <span class="result-label">用时</span>
            </div>
          </div>
          <el-button type="primary" @click="exitGame">返回游戏列表</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import { vocabGamesAPI } from '@/api'

const games = ref([])
const activeGame = ref(null)
const gameResult = ref(null)

// 配对游戏状态
const matchingData = ref({ words: [], meanings: [] })
const selectedWord = ref(null)
const selectedMeaning = ref(null)
const matchedCount = ref(0)
const totalPairs = ref(0)

// 测试模式状态
const testQuestions = ref([])
const testQuestionIndex = ref(0)
const testSelectedAnswer = ref(null)
const testFeedback = ref(null)

// 计时
let timer = null
let startTime = 0

onMounted(async () => {
  try {
    const res = await vocabGamesAPI.getGames()
    games.value = res.data?.data?.games || []
  } catch (e) {
    console.error('加载游戏失败:', e)
  }
})

const startGame = async (game) => {
  activeGame.value = game.id
  gameResult.value = null
  startTime = Date.now()

  if (game.id === 'matching') {
    await loadMatchingGame()
  } else if (game.id === 'test') {
    await loadTestGame()
  }
}

const loadMatchingGame = async () => {
  try {
    const res = await vocabGamesAPI.matching({ wordCount: 8 })
    matchingData.value = res.data?.data
    totalPairs.value = matchingData.value.words.length
    matchedCount.value = 0
    selectedWord.value = null
    selectedMeaning.value = null
  } catch (e) {
    ElMessage.error('加载配对游戏失败')
  }
}

const loadTestGame = async () => {
  try {
    const res = await vocabGamesAPI.test({ questionCount: 10 })
    testQuestions.value = res.data?.data?.questions || []
    testQuestionIndex.value = 0
    testSelectedAnswer.value = null
    testFeedback.value = null
  } catch (e) {
    ElMessage.error('加载测试游戏失败')
  }
}

const selectWord = (wordId) => {
  if (matchingData.value.words.find(w => w.id === wordId)?.matched) return
  selectedWord.value = wordId
  if (selectedMeaning.value) checkMatch()
}

const selectMeaning = (meaningId) => {
  if (matchingData.value.meanings.find(m => m.id === meaningId)?.matched) return
  selectedMeaning.value = meaningId
  if (selectedWord.value) checkMatch()
}

const checkMatch = () => {
  if (selectedWord.value === selectedMeaning.value) {
    // 匹配成功
    const word = matchingData.value.words.find(w => w.id === selectedWord.value)
    const meaning = matchingData.value.meanings.find(m => m.id === selectedMeaning.value)
    if (word) word.matched = true
    if (meaning) meaning.matched = true
    matchedCount.value++
    ElMessage.success('配对成功！')
  } else {
    ElMessage.warning('配对错误，请重试')
  }

  selectedWord.value = null
  selectedMeaning.value = null

  if (matchedCount.value === totalPairs.value) {
    completeGame('matching')
  }
}

const submitTestAnswer = (idx) => {
  if (testFeedback.value) return
  testSelectedAnswer.value = idx

  const question = testQuestions.value[testQuestionIndex.value]
  const correct = question.options[idx] === question.correctAnswer

  testFeedback.value = {
    correct,
    explanation: correct ? '回答正确！' : `正确答案是：${question.correctAnswer}`,
  }
}

const nextTestQuestion = () => {
  testQuestionIndex.value++
  testSelectedAnswer.value = null
  testFeedback.value = null

  if (testQuestionIndex.value >= testQuestions.value.length) {
    completeGame('test')
  }
}

const completeGame = (gameId) => {
  const elapsed = Math.round((Date.now() - startTime) / 1000)
  const correct = matchedCount.value || testQuestionIndex.value

  gameResult.value = {
    game: gameId,
    score: Math.round(correct / (gameId === 'matching' ? totalPairs.value : testQuestions.value.length) * 100),
    correct,
    total: gameId === 'matching' ? totalPairs.value : testQuestions.value.length,
    time: elapsed,
  }
}

const resetMatchingGame = async () => {
  await loadMatchingGame()
}

const exitGame = () => {
  activeGame.value = null
  gameResult.value = null
}

const getDifficultyTag = (d) => ({ easy: '', medium: 'warning', hard: 'danger' }[d] || '')
const getDifficultyLabel = (d) => ({ easy: '简单', medium: '中等', hard: '困难' }[d] || d)
</script>

<style scoped>
.vocab-games-page {
  max-width: 900px;
  margin: 0 auto;
}

.games-selector {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.game-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s;
  cursor: pointer;
}

.game-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}

.game-icon {
  font-size: 48px;
  text-align: center;
}

.game-info h3 {
  margin: 0;
  color: #333;
}

.game-info p {
  margin: 4px 0 0;
  color: #666;
  font-size: 14px;
}

.game-area {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.game-stats {
  color: #909399;
  font-size: 14px;
}

.matching-board {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.words-column,
.meanings-column {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.match-item {
  padding: 12px 16px;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.match-item:hover:not(.matched) {
  border-color: #4a6cf7;
  background: #f5f7ff;
}

.match-item.selected {
  border-color: #4a6cf7;
  background: #eef2ff;
}

.match-item.matched {
  border-color: #10b981;
  background: #ecfdf5;
  opacity: 0.7;
  cursor: not-allowed;
}

.game-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.test-question {
  margin-bottom: 24px;
}

.question-text {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
}

.test-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.test-option {
  padding: 12px 16px;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.test-option:hover {
  border-color: #4a6cf7;
  background: #f5f7ff;
}

.test-option.selected {
  border-color: #4a6cf7;
  background: #eef2ff;
}

.test-feedback {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 16px;
}

.test-feedback p {
  margin-top: 8px;
  color: #666;
}

.game-result {
  display: flex;
  justify-content: center;
  margin-top: 40px;
}

.result-card {
  background: #fff;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.result-stats {
  display: flex;
  gap: 32px;
  margin: 24px 0;
}

.result-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.result-value {
  font-size: 28px;
  font-weight: 700;
  color: #4a6cf7;
}

.result-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>
