<template>
  <div class="ad-banner" :class="placementClass" v-if="visible">
    <div class="ad-inner" :class="{ 'ad-desktop': !isMobile }">
      <div class="ad-content">
        <div class="ad-tag">广告</div>
        <div class="ad-text">{{ adText }}</div>
        <div class="ad-action" @click="handleClick">{{ adBtnText }}</div>
      </div>
      <div class="ad-close" @click="visible = false">
        <el-icon :size="14"><Close /></el-icon>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Close } from '@element-plus/icons-vue'

const props = defineProps({
  placement: { type: String, default: 'home' },
})

const isMobile = window.innerWidth < 768
const visible = ref(true)

const placementClass = computed(() => {
  return {
    home: 'ad-home',
    'practice-done': 'ad-practice-done',
    'wrong-book': 'ad-wrong-book',
  }[props.placement] || 'ad-home'
})

const adText = computed(() => {
  const texts = {
    home: '冲刺托福100+？精选备考资料包限时免费领',
    'practice-done': '练习完成！高分学长笔记免费领取',
    'wrong-book': '错题太多不要慌，AI 精准提分方案帮你攻克薄弱点',
  }
  return texts[props.placement] || '托福备考精选课程，限时优惠中'
})

const adBtnText = computed(() => {
  return props.placement === 'home' ? '立即领取' : '查看详情'
})

const handleClick = () => {
  // 广告点击预留埋点
  console.log('[AdBanner] click:', props.placement)
  // 预留跳转或弹窗逻辑
}
</script>

<style scoped>
.ad-banner {
  margin: 12px 16px;
}
.ad-inner {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  padding: 12px 14px;
  color: #fff;
  gap: 10px;
}
.ad-desktop {
  max-width: 700px;
}
.ad-content {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  flex-wrap: wrap;
}
.ad-tag {
  background: rgba(255, 255, 255, 0.25);
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 11px;
  flex-shrink: 0;
}
.ad-text {
  font-size: 13px;
  font-weight: 500;
  flex: 1;
  min-width: 0;
}
.ad-action {
  background: #fff;
  color: #764ba2;
  border-radius: 14px;
  padding: 4px 14px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
  white-space: nowrap;
  transition: transform 0.15s;
}
.ad-action:hover { transform: scale(1.04); }
.ad-close {
  cursor: pointer;
  opacity: 0.7;
  padding: 2px;
  flex-shrink: 0;
}
.ad-close:hover { opacity: 1; }

@media (max-width: 768px) {
  .ad-banner { margin: 10px 12px; }
  .ad-inner { padding: 10px 12px; }
  .ad-text { font-size: 12px; }
  .ad-action { padding: 3px 12px; font-size: 11px; }
}
</style>
