<template>
  <div class="vocab-graph-page">
    <!-- 概览 -->
    <div class="graph-overview">
      <div class="hero-section">
        <h2>🗺️ 词汇关系图谱</h2>
        <p class="desc">可视化词汇网络，掌握词汇之间的关联</p>
        <div class="overview-stats">
          <div class="overview-stat">
            <span class="value">{{ graphData.totalNodes }}</span>
            <span class="label">总词汇</span>
          </div>
          <div class="overview-stat">
            <span class="value">{{ graphData.totalMastered }}</span>
            <span class="label">已掌握</span>
          </div>
          <div class="overview-stat">
            <span class="value">{{ graphData.overallProgress }}%</span>
            <span class="label">掌握度</span>
          </div>
        </div>
      </div>
      
      <!-- 词频分布 -->
      <div class="frequency-chart">
        <h4>📊 词频分布</h4>
        <div class="freq-bars">
          <div class="freq-bar" v-for="node in graphData.nodes.slice(0, 10)" :key="node.id">
            <span class="freq-word">{{ node.word }}</span>
            <div class="freq-track">
              <div class="freq-fill" :style="{ width: node.frequency + '%' }"></div>
            </div>
            <span class="freq-value">{{ node.frequency }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 主题筛选 -->
    <div class="topic-filters">
      <button class="topic-btn" :class="{ active: activeTopic === 'all' }" @click="activeTopic = 'all'">全部</button>
      <button class="topic-btn" :class="{ active: activeTopic === t.id }" v-for="t in graphData.topics" :key="t.id" @click="filterByTopic(t)">
        {{ t.icon }} {{ t.name }}
      </button>
    </div>

    <!-- 词汇网格 -->
    <div class="vocab-grid">
      <div class="vocab-card" v-for="node in filteredNodes" :key="node.id"
        :class="{ mastered: node.mastered, ['difficulty-' + node.difficulty]: true }"
        @click="showWordDetail(node)">
        <div class="word-header">
          <span class="word-main">{{ node.word }}</span>
          <span class="word-freq" :style="{ background: getFreqColor(node.frequency) }">{{ node.frequency }}</span>
        </div>
        <div class="word-phonetic">{{ getPhonetic(node) }}</div>
        <div class="word-meaning">{{ node.meaning }}</div>
        <div class="word-footer">
          <span class="difficulty-badge" :class="node.difficulty">{{ node.difficulty }}</span>
          <span class="mastery-icon" v-if="node.mastered">✅</span>
          <span class="mastery-icon locked" v-else>🔒</span>
        </div>
      </div>
    </div>

    <!-- 词汇关系网络图 -->
    <div class="relation-network">
      <h3>🔗 词汇关系网络</h3>
      <div class="network-svg">
        <svg viewBox="0 0 600 400">
          <!-- 关系连线 -->
          <line v-for="edge in graphData.edges" :key="edge.source + '-' + edge.target"
            :x1="getNodeX(edge.source)" :y1="getNodeY(edge.source)"
            :x2="getNodeX(edge.target)" :y2="getNodeY(edge.target)"
            stroke="#cbd5e1" stroke-width="1" opacity="0.5" />
          <!-- 节点 -->
          <circle v-for="node in filteredNodes" :key="node.id"
            :cx="getNodeX(node.id)" :cy="getNodeY(node.id)"
            :r="20" :fill="getTopicColor(getNodeTopic(node.id))"
            opacity="0.8" />
          <text v-for="node in filteredNodes" :key="'label-'+node.id"
            :x="getNodeX(node.id)" :y="getNodeY(node.id) + 30"
            text-anchor="middle" font-size="10" fill="#334155">{{ node.word }}</text>
        </svg>
      </div>
    </div>

    <!-- 主题进度 -->
    <div class="topic-progress">
      <h3>📚 主题进度</h3>
      <div class="topic-progress-grid">
        <div class="topic-progress-card" v-for="tp in topicProgress" :key="tp.id">
          <span class="tp-icon">{{ tp.icon }}</span>
          <span class="tp-name">{{ tp.name }}</span>
          <div class="tp-bar">
            <div class="tp-fill" :style="{ width: tp.percentage + '%' }"></div>
          </div>
          <span class="tp-percent">{{ tp.percentage }}%</span>
        </div>
      </div>
    </div>

    <!-- 词汇详情弹窗 -->
    <div class="modal-overlay" v-if="selectedWord" @click="selectedWord = null">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedWord.word }}</h3>
          <button class="close-btn" @click="selectedWord = null">✕</button>
        </div>
        <div class="modal-body">
          <div class="word-detail-main">
            <span class="detail-phonetic">{{ getPhonetic(selectedWord) }}</span>
            <span class="detail-meaning">{{ selectedWord.meaning }}</span>
            <span class="detail-freq">词频: {{ selectedWord.frequency }}%</span>
            <span class="detail-difficulty" :class="selectedWord.difficulty">{{ selectedWord.difficulty }}</span>
          </div>
          <div class="related-words">
            <h4>相关词汇</h4>
            <div class="related-list">
              <div class="related-item" v-for="rel in getRelatedWords(selectedWord.id)" :key="rel.id">
                <span class="rel-word">{{ rel.word }}</span>
                <span class="rel-relation">{{ rel.relation }}</span>
                <span class="rel-weight">{{ (rel.weight * 100).toFixed(0) }}%</span>
              </div>
            </div>
          </div>
          <button class="master-btn" @click="toggleMaster(selectedWord.id)">
            {{ selectedWord.mastered ? '取消掌握' : '标记掌握' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { vocabGraphAPI } from '@/api'

// 模拟节点位置
const nodePositions = {
  'n1': { x: 100, y: 80 }, 'n2': { x: 200, y: 120 }, 'n3': { x: 80, y: 200 },
  'n4': { x: 300, y: 100 }, 'n5': { x: 380, y: 80 }, 'n6': { x: 350, y: 180 },
  'n7': { x: 450, y: 60 }, 'n8': { x: 480, y: 140 }, 'n9': { x: 150, y: 300 },
  'n10': { x: 250, y: 320 }, 'n11': { x: 350, y: 280 }, 'n12': { x: 420, y: 260 },
  'n13': { x: 100, y: 150 }, 'n14': { x: 180, y: 250 }, 'n15': { x: 280, y: 220 },
}

const topicColors = {
  'environment': '#10b981', 'biology': '#8b5cf6', 'campus': '#f59e0b',
  'change': '#ef4444', 'general': '#6366f1', 'science': '#06b6d4',
}

export default {
  name: 'VocabGraph',
  setup() {
    const graphData = ref({ nodes: [], edges: [], topics: [], totalNodes: 15, totalMastered: 5, overallProgress: 33 })
    const activeTopic = ref('all')
    const selectedWord = ref(null)
    const topicProgress = ref([])

    const filteredNodes = computed(() => {
      if (activeTopic.value === 'all') return graphData.value.nodes
      return graphData.value.nodes.filter(n => n.topic === activeTopic.value)
    })

    async function loadGraph() {
      try {
        const res = await vocabGraphAPI.getOverview()
        const data = res.data?.data
        if (data) {
          graphData.value = data
          topicProgress.value = data.topics.map(t => {
            const nodes = data.nodes.filter(n => n.topic === t.id)
            return {
              ...t,
              total: nodes.length,
              mastered: nodes.filter(n => n.mastered).length,
              percentage: Math.round((nodes.filter(n => n.mastered).length / nodes.length) * 100),
            }
          })
        }
      } catch (e) {
        // 使用模拟数据
        graphData.value.totalNodes = 15
        graphData.value.totalMastered = 5
        graphData.value.overallProgress = 33
      }
    }

    function getNodeX(id) { return nodePositions[id]?.x || 300 }
    function getNodeY(id) { return nodePositions[id]?.y || 200 }
    function getNodeTopic(node) { return node.topic || 'general' }
    function getTopicColor(topic) { return topicColors[topic] || '#6366f1' }
    function getFreqColor(freq) { return freq > 90 ? '#10b981' : freq > 70 ? '#f59e0b' : '#ef4444' }
    function getPhonetic(node) {
      const phonetics = { 'biodiversity': '/ˌbaɪoʊdaɪˈvɜːrsəti/', 'ecosystem': '/ˈiːkoʊsɪstəm/' }
      return phonetics[node.word] || '/.../'
    }

    function getRelatedWords(wordId) {
      const edges = graphData.value.edges.filter(e => e.source === wordId || e.target === wordId)
      return edges.map(edge => {
        const relatedId = edge.source === wordId ? edge.target : edge.source
        const node = graphData.value.nodes.find(n => n.id === relatedId)
        return { ...node, relation: edge.relation, weight: edge.weight }
      })
    }

    function filterByTopic(topic) {
      activeTopic.value = topic.id
    }

    function showWordDetail(node) {
      selectedWord.value = node
    }

    function toggleMaster(wordId) {
      // 切换掌握状态
    }

    onMounted(() => loadGraph())

    return {
      graphData,
      activeTopic,
      selectedWord,
      topicProgress,
      filteredNodes,
      getNodeX,
      getNodeY,
      getNodeTopic,
      getTopicColor,
      getFreqColor,
      getPhonetic,
      getRelatedWords,
      filterByTopic,
      showWordDetail,
      toggleMaster,
    }
  },
}
</script>

<style scoped>
.vocab-graph-page { padding: 24px; max-width: 1100px; margin: 0 auto; }

/* 概览 */
.graph-overview { background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 16px; padding: 32px; color: white; margin-bottom: 24px; }
.hero-section h2 { margin: 0 0 8px 0; font-size: 24px; }
.desc { opacity: 0.9; margin-bottom: 20px; }
.overview-stats { display: flex; gap: 32px; margin-bottom: 24px; }
.overview-stat { text-align: center; }
.overview-stat .value { display: block; font-size: 32px; font-weight: 700; }
.overview-stat .label { font-size: 13px; opacity: 0.8; }

.frequency-chart { background: rgba(255,255,255,0.1); border-radius: 12px; padding: 16px; }
.freq-bars { display: flex; flex-direction: column; gap: 8px; }
.freq-bar { display: flex; align-items: center; gap: 8px; }
.freq-word { width: 100px; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.freq-track { flex: 1; height: 8px; background: rgba(255,255,255,0.2); border-radius: 4px; overflow: hidden; }
.freq-fill { height: 100%; background: #10b981; border-radius: 4px; }
.freq-value { width: 30px; font-size: 12px; font-weight: 600; }

/* 主题筛选 */
.topic-filters { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; }
.topic-btn { padding: 8px 16px; background: white; border: 2px solid #e5e7eb; border-radius: 20px; cursor: pointer; font-size: 13px; }
.topic-btn.active { background: #6366f1; color: white; border-color: #6366f1; }

/* 词汇网格 */
.vocab-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; margin-bottom: 32px; }
.vocab-card { background: white; border-radius: 12px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); cursor: pointer; transition: all 0.3s; border-left: 4px solid #e5e7eb; }
.vocab-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
.vocab-card.mastered { border-left-color: #10b981; background: #f0fdf4; }
.vocab-card.difficulty-hard { border-left-color: #ef4444; }
.vocab-card.difficulty-medium { border-left-color: #f59e0b; }
.vocab-card.difficulty-easy { border-left-color: #10b981; }

.word-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
.word-main { font-size: 16px; font-weight: 700; color: #1e293b; }
.word-freq { padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 700; color: white; }
.word-phonetic { font-size: 12px; color: #6366f1; margin-bottom: 4px; }
.word-meaning { font-size: 13px; color: #64748b; margin-bottom: 8px; }
.word-footer { display: flex; justify-content: space-between; align-items: center; }
.difficulty-badge { padding: 2px 8px; border-radius: 8px; font-size: 10px; font-weight: 600; }
.difficulty-badge.easy { background: #d1fae5; color: #065f46; }
.difficulty-badge.medium { background: #fef3c7; color: #92400e; }
.difficulty-badge.hard { background: #fee2e2; color: #991b1b; }
.mastery-icon { font-size: 16px; }
.mastery-icon.locked { opacity: 0.3; }

/* 关系网络图 */
.relation-network { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 32px; }
.network-svg { width: 100%; height: 300px; background: #f8fafc; border-radius: 12px; }

/* 主题进度 */
.topic-progress { margin-bottom: 32px; }
.topic-progress-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }
.topic-progress-card { background: white; border-radius: 12px; padding: 16px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.tp-icon { font-size: 24px; display: block; }
.tp-name { font-size: 13px; font-weight: 600; display: block; margin: 4px 0; }
.tp-bar { height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden; margin: 8px 0; }
.tp-fill { height: 100%; background: #6366f1; border-radius: 3px; }
.tp-percent { font-size: 12px; color: #6366f1; font-weight: 600; }

/* 弹窗 */
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-content { background: white; border-radius: 16px; padding: 24px; max-width: 480px; width: 90%; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.modal-header h3 { margin: 0; }
.close-btn { background: none; border: none; font-size: 20px; cursor: pointer; }
.word-detail-main { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; }
.detail-phonetic { color: #6366f1; font-size: 14px; }
.detail-meaning { font-size: 18px; font-weight: 600; }
.detail-freq { font-size: 12px; color: #64748b; }
.detail-difficulty { padding: 2px 8px; border-radius: 8px; font-size: 11px; font-weight: 600; }
.related-words { margin-bottom: 16px; }
.related-list { display: flex; flex-direction: column; gap: 8px; }
.related-item { display: flex; justify-content: space-between; padding: 8px; background: #f8fafc; border-radius: 8px; font-size: 13px; }
.rel-relation { color: #64748b; font-size: 11px; }
.master-btn { width: 100%; padding: 12px; background: #6366f1; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; }
</style>
