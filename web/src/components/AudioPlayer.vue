<template>
  <div class="audio-player">
    <div class="controls">
      <el-button :icon="playing ? VideoPause : VideoPlay" circle size="large" @click="toggle" />
      <div class="progress">
        <el-slider v-model="currentTime" :max="duration || 100" :show-tooltip="false" @change="seek" />
        <span class="time">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
      </div>
    </div>
    <audio ref="audioRef" :src="src" @loadedmetadata="onMeta" @timeupdate="onTime" @ended="onEnd" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { VideoPlay, VideoPause } from '@element-plus/icons-vue'

const props = defineProps({ src: { type: String, required: true } })

const audioRef = ref(null)
const playing = ref(false)
const currentTime = ref(0)
const duration = ref(0)

const toggle = () => {
  if (!audioRef.value) return
  if (playing.value) { audioRef.value.pause() } else { audioRef.value.play() }
  playing.value = !playing.value
}

const onMeta = () => { duration.value = audioRef.value.duration || 0 }
const onTime = () => { currentTime.value = audioRef.value.currentTime || 0 }
const onEnd = () => { playing.value = false; currentTime.value = 0 }
const seek = (val) => { if (audioRef.value) audioRef.value.currentTime = val }

const formatTime = (s) => {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}
</script>

<style scoped>
.audio-player {
  background: var(--card-bg);
  border-radius: var(--radius);
  padding: 12px 16px;
  box-shadow: var(--shadow);
}
.controls {
  display: flex;
  align-items: center;
  gap: 16px;
}
.progress {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}
.time {
  font-size: 13px;
  color: var(--text-secondary);
  white-space: nowrap;
}
</style>