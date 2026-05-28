<template>
  <div class="countdown" :class="{ 'is-warning': remaining <= 60 }">
    <el-icon :size="16"><Clock /></el-icon>
    <span>{{ display }}</span>
  </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'

const props = defineProps({
  seconds: { type: Number, required: true },
  running: { type: Boolean, default: true },
})

const emit = defineEmits(['timeout'])

const remaining = ref(props.seconds)
let timer = null

const display = computed(() => {
  const m = Math.floor(remaining.value / 60)
  const s = remaining.value % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

const start = () => {
  stop()
  timer = setInterval(() => {
    if (remaining.value <= 0) {
      stop()
      emit('timeout')
      return
    }
    remaining.value--
  }, 1000)
}

const stop = () => {
  if (timer) { clearInterval(timer); timer = null }
}

watch(() => props.seconds, (val) => { remaining.value = val; start() })
watch(() => props.running, (val) => { if (val) start(); else stop() })

start()
onBeforeUnmount(stop)

defineExpose({ remaining, reset: (v) => { remaining.value = v ?? props.seconds } })
</script>

<style scoped>
.countdown {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
}
.countdown.is-warning {
  color: var(--danger);
  animation: blink 1s infinite;
}
@keyframes blink {
  50% { opacity: 0.5; }
}
</style>