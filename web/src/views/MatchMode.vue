<template>
  <div class="match-mode">
    <!-- 顶部栏 -->
    <div class="match-header">
      <div class="match-title">
        <span class="match-icon">🎮</span>
        配对游戏
      </div>
      <div class="match-info">
        <span class="match-timer">⏱ {{ timer }}</span>
        <span class="match-matched">✅ {{ matchedCount }}/{{ total }}</span>
      </div>
    </div>

    <!-- 选择生词本 -->
    <div v-if="!started" class="match-setup">
      <div class="setup-card">
        <div class="setup-title">选择词库</div>
        <el-select v-model="selectedSet" placeholder="请选择生词本" style="width: 100%; margin-bottom: 16px">
          <el-option
            v-for="set in vocabSets"
            :key="set.id"
            :label="`${set.name} (${set.count}词)`"
            :value="set.id"
          />
        </el-select>
        <el-button type="primary" size="large" style="width: 100%" @click="startMatch">
          开始配对
        </el-button>
        <div class="match-hint">
          💡 点击左侧单词，再点击右侧对应的释义完成配对
        </div>
      </div>
    </div>

    <!-- 配对区域 -->
    <div v-else class="match-board">
      <div class="match-grid">
        <!-- 左侧：单词 -->
        <div class="match-column words">
          <div
            v-for="(word, idx) in shuffledWords"
            :key="'w-' + word.id"
            class="match-item word-item"
            :class="{
              selected: selectedWord?.id === word.id,
              matched: matchedWords.includes(word.id),
              wrong: wrongWord?.id === word.id
            }"
            @click="selectWord(word)"
          >
            {{ word.word }}
          </div>
        </div>
        <!-- 右侧：释义 -->
        <div class="match-column defs">
          <div
            v-for="(def, idx) in shuffledDefs"
            :key="'d-' + def.id"
            class="match-item def-item"
            :class="{
              selected: selectedDef?.id === def.id,
              matched: matchedDefs.includes(def.id),
              wrong: wrongDef?.id === def.id
            }"
            @click="selectDef(def)"
          >
            {{ def.meaning }}
          </div>
        </div>
      </div>
    </div>

    <!-- 完成弹窗 -->
    <el-dialog v-model="showResult" title="🎉 配对完成！" width="360px" center>
      <div class="result-content">
        <div class="result-time">
          <span class="result-icon">🏆</span>
          <div class="result-num">{{ timer }}</div>
          <div class="result-label">用时</div>
        </div>
        <div class="result-xp">
          +{{ resultXP }} XP
        </div>
        <div class="result-stats">
          <span>错误: {{ wrongCount }}</span>
          <span>正确率: {{ accuracy }}%</span>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="resetMatch">再来一局</el-button>
        <el-button @click="showResult = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { vocabAPI, achievementAPI } from '@/api'

const vocabSets = ref([])
const selectedSet = ref('')
const started = ref(false)

// 配对数据
const words = ref([])
const shuffledWords = ref([])
const shuffledDefs = ref([])
const total = ref(0)

// 状态
const selectedWord = ref(null)
const selectedDef = ref(null)
const matchedWords = ref([])
const matchedDefs = ref([])
const wrongWord = ref(null)
const wrongDef = ref(null)
const wrongCount = ref(0)

// 计时器
const seconds = ref(0)
const timer = computed(() => {
  const m = Math.floor(seconds.value / 60)
  const s = seconds.value % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})
const matchedCount = computed(() => matchedWords.value.length)
const accuracy = computed(() => total.value > 0 ? Math.round(((total.value - wrongCount.value) / total.value) * 100) : 100)

let timerInterval = null
const showResult = ref(false)
const resultXP = ref(0)

// 加载词库列表
onMounted(async () => {
  try {
    const res = await vocabAPI.listSets()
    vocabSets.value = (res.data?.data || []).map(s => ({
      id: s.id || s.name,
      name: s.name || '未命名词库',
      count: s.count || 0,
    }))
    // 如果没有词库，使用默认
    if (vocabSets.value.length === 0) {
      vocabSets.value = [{ id: 'default', name: '默认词库', count: 10 }]
    }
  } catch (e) {
    console.error('加载词库失败:', e)
  }
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})

// 开始配对游戏
async function startMatch() {
  // 获取词汇数据
  const set = vocabSets.value.find(s => s.id === selectedSet.value) || vocabSets.value[0]
  try {
    const res = await vocabAPI.list({ limit: Math.max(8, Math.min(20, set.count || 10)) })
    const vList = res.data?.data?.vocabulary || res.data?.data || []
    if (vList.length < 3) {
      alert('词库中至少有3个词才能开始游戏')
      return
    }

    words.value = vList.slice(0, 10)
    total.value = words.value.length

    // 打乱左右顺序
    shuffledWords.value = shuffleArray([...words.value])
    shuffledDefs.value = shuffleArray([...words.value])

    started.value = true
    seconds.value = 0
    wrongCount.value = 0

    if (timerInterval) clearInterval(timerInterval)
    timerInterval = setInterval(() => {
      seconds.value++
    }, 1000)
  } catch (e) {
    console.error('加载词汇失败:', e)
  }
}

// 选择单词
function selectWord(word) {
  if (matchedWords.value.includes(word.id)) return
  if (wrongWord.value?.id === word.id) wrongWord.value = null
  selectedWord.value = selectedWord.value?.id === word.id ? null : word
  tryMatch()
}

// 选择释义
function selectDef(def) {
  if (matchedDefs.value.includes(def.id)) return
  if (wrongDef.value?.id === def.id) wrongDef.value = null
  selectedDef.value = selectedDef.value?.id === def.id ? null : def
  tryMatch()
}

// 尝试匹配
function tryMatch() {
  if (!selectedWord.value || !selectedDef.value) return

  if (selectedWord.value.word === selectedDef.value.word) {
    // 匹配成功
    matchedWords.value.push(selectedWord.value.id)
    matchedDefs.value.push(selectedDef.value.id)
    selectedWord.value = null
    selectedDef.value = null

    // 检查是否全部完成
    if (matchedWords.value.length === total.value) {
      finishMatch()
    }
  } else {
    // 匹配失败
    wrongWord.value = selectedWord.value
    wrongDef.value = selectedDef.value
    wrongCount.value++
    setTimeout(() => {
      wrongWord.value = null
      wrongDef.value = null
      selectedWord.value = null
      selectedDef.value = null
    }, 600)
  }
}

// 完成配对
function finishMatch() {
  if (timerInterval) clearInterval(timerInterval)
  resultXP.value = Math.max(10, 50 - seconds.value - wrongCount.value * 2)
  showResult.value = true

  // 奖励 XP 和检查成就
  achievementAPI.award({ type: 'vocab_review', value: total.value }).catch(() => {})
}

// 重置
function resetMatch() {
  showResult.value = false
  startMatch()
}

// 工具：数组打乱
function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
</script>

<style scoped>
.match-mode {
  min-height: 100vh;
  background: #F5F7FA;
}
.match-header {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #fff;
}
.match-title {
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
}
.match-info {
  display: flex;
  gap: 12px;
  font-size: 14px;
}
.match-timer, .match-matched {
  background: rgba(255,255,255,0.2);
  padding: 4px 10px;
  border-radius: 6px;
}

.match-setup {
  padding: 40px 20px;
}
.setup-card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}
.setup-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 16px;
}
.match-hint {
  text-align: center;
  margin-top: 12px;
  color: #888;
  font-size: 13px;
}

.match-board {
  padding: 16px;
}
.match-grid {
  display: flex;
  gap: 16px;
  max-width: 700px;
  margin: 0 auto;
}
.match-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.match-item {
  padding: 12px;
  background: #fff;
  border: 2px solid #e8e8e8;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  text-align: center;
  user-select: none;
}
.match-item:hover {
  border-color: #10b981;
  transform: translateY(-1px);
}
.match-item.selected {
  border-color: #10b981;
  background: #ecfdf5;
  box-shadow: 0 0 0 2px rgba(16,185,129,0.2);
}
.match-item.matched {
  background: #d1fae5;
  border-color: #10b981;
  opacity: 0.7;
  cursor: default;
}
.match-item.wrong {
  border-color: #ef4444;
  background: #fef2f2;
  animation: shake 0.4s;
}
.word-item {
  font-weight: 700;
  color: #333;
}
.def-item {
  color: #666;
  font-size: 13px;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

.result-content {
  text-align: center;
}
.result-time {
  margin-bottom: 16px;
}
.result-icon {
  font-size: 48px;
}
.result-num {
  font-size: 32px;
  font-weight: 700;
  color: #10b981;
}
.result-label {
  font-size: 12px;
  color: #999;
}
.result-xp {
  font-size: 20px;
  font-weight: 700;
  color: #FFD700;
  margin: 12px 0;
}
.result-stats {
  display: flex;
  justify-content: center;
  gap: 20px;
  color: #666;
  font-size: 13px;
}
</style>
