<template>
  <div class="skeleton-block">
    <!-- 标题骨架 -->
    <div v-if="title" class="skeleton-title" />
    
    <!-- 卡片骨架 -->
    <div v-if="type === 'card'" class="skeleton-card" v-bind="$attrs">
      <div class="skeleton-rect w-60 h-24" />
      <div class="skeleton-rect w-80" />
      <div class="skeleton-rect w-100" />
      <div class="skeleton-rect w-90" />
    </div>

    <!-- 列表骨架 -->
    <div v-if="type === 'list'" class="skeleton-list" v-bind="$attrs">
      <div v-for="i in count" :key="i" class="skeleton-list-item">
        <div class="skeleton-avatar" />
        <div class="skeleton-texts">
          <div class="skeleton-rect w-70" />
          <div class="skeleton-rect w-50" />
        </div>
      </div>
    </div>

    <!-- 统计卡片骨架 -->
    <div v-if="type === 'stats'" class="skeleton-stats" v-bind="$attrs">
      <div v-for="i in 4" :key="i" class="skeleton-stat-card">
        <div class="skeleton-rect w-40 h-28" />
        <div class="skeleton-rect w-80 h-14" />
        <div class="skeleton-rect w-50 h-10" />
      </div>
    </div>

    <!-- 表格骨架 -->
    <div v-if="type === 'table'" class="skeleton-table" v-bind="$attrs">
      <div v-for="i in 5" :key="i" class="skeleton-table-row">
        <div v-for="j in 3" :key="j" class="skeleton-rect w-60" />
      </div>
    </div>

    <!-- 默认：通用骨架 -->
    <div v-if="!type || type === 'default'" class="skeleton-default" v-bind="$attrs">
      <div class="skeleton-rect w-40 h-24" />
      <div class="skeleton-rect w-100 h-16" />
      <div class="skeleton-rect w-80 h-16" />
      <div class="skeleton-rect w-100" />
      <div class="skeleton-rect w-90" />
    </div>

    <!-- 文章骨架 -->
    <div v-if="type === 'article'" class="skeleton-article" v-bind="$attrs">
      <div class="skeleton-rect w-50 h-28" />
      <div class="skeleton-rect w-100" />
      <div class="skeleton-rect w-100" />
      <div class="skeleton-rect w-100" />
      <div class="skeleton-rect w-100 h-4" />
      <div class="skeleton-rect w-100" />
      <div class="skeleton-rect w-100" />
      <div class="skeleton-rect w-80" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  type: {
    type: String,
    default: 'default',
  },
  count: {
    type: Number,
    default: 3,
  },
  title: {
    type: Boolean,
    default: false,
  },
})
</script>

<style scoped>
.skeleton-block {
  padding: 20px 0;
}

/* 通用骨架矩形 */
.skeleton-rect {
  height: 14px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 6px;
  margin-bottom: 12px;
}
.skeleton-rect.w-30 { width: 30%; }
.skeleton-rect.w-40 { width: 40%; }
.skeleton-rect.w-50 { width: 50%; }
.skeleton-rect.w-60 { width: 60%; }
.skeleton-rect.w-70 { width: 70%; }
.skeleton-rect.w-80 { width: 80%; }
.skeleton-rect.w-90 { width: 90%; }
.skeleton-rect.w-100 { width: 100%; }
.skeleton-rect.h-10 { height: 10px; }
.skeleton-rect.h-14 { height: 14px; }
.skeleton-rect.h-16 { height: 16px; }
.skeleton-rect.h-24 { height: 24px; }
.skeleton-rect.h-28 { height: 28px; }
.skeleton-rect.h-40 { height: 40px; }

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* 标题骨架 */
.skeleton-title {
  height: 28px;
  width: 40%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8px;
  margin-bottom: 20px;
}

/* 卡片骨架 */
.skeleton-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  border: 1px solid #e5e7eb;
}

/* 列表骨架 */
.skeleton-list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid #f0f0f0;
}
.skeleton-list-item:last-child { border-bottom: none; }
.skeleton-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  flex-shrink: 0;
}
.skeleton-texts {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 统计卡片骨架 */
.skeleton-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.skeleton-stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 表格骨架 */
.skeleton-table-row {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}
.skeleton-table-row:last-child { border-bottom: none; }
.skeleton-table-row .skeleton-rect { margin-bottom: 0; }

/* 文章骨架 */
.skeleton-article {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
