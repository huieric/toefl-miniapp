<template>
  <div class="page-container">
    <div class="page-header">
      <el-button text @click="$router.back()"><el-icon><ArrowLeft /></el-icon> 返回</el-button>
      <h2>创建学习计划</h2>
    </div>

    <div class="card wizard-card">
      <el-steps :active="step" finish-status="success" align-center>
        <el-step title="目标分数" />
        <el-step title="考试日期" />
        <el-step title="每日时长" />
      </el-steps>

      <div class="step-content">
        <!-- Step 1: Target Score -->
        <div v-if="step === 0" class="step-panel">
          <h4>你的目标分数是多少？</h4>
          <div class="score-options">
            <div
              v-for="s in scoreOptions"
              :key="s"
              class="score-opt"
              :class="{ selected: form.targetScore === s }"
              @click="form.targetScore = s; nextStep()"
            >
              {{ s }}
            </div>
          </div>
        </div>

        <!-- Step 2: Exam Date -->
        <div v-if="step === 1" class="step-panel">
          <h4>计划什么时候参加考试？</h4>
          <el-date-picker
            v-model="form.examDate"
            type="date"
            placeholder="选择考试日期"
            :disabled-date="disabledDate"
            size="large"
            style="width: 100%; max-width: 320px; margin-top: 16px;"
          />
          <el-button type="primary" :disabled="!form.examDate" @click="nextStep" style="margin-top: 20px;">
            下一步
          </el-button>
        </div>

        <!-- Step 3: Daily Hours -->
        <div v-if="step === 2" class="step-panel">
          <h4>每天能投入多少时间学习？</h4>
          <div class="hours-slider">
            <el-slider v-model="form.dailyHours" :min="1" :max="8" :step="1" show-input :marks="hoursMarks" />
          </div>
          <el-button type="primary" :loading="submitting" @click="submitPlan" style="margin-top: 24px;">
            创建计划
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { planAPI } from '@/api'

const router = useRouter()
const step = ref(0)
const submitting = ref(false)

const form = reactive({
  targetScore: null,
  examDate: null,
  dailyHours: 3,
})

const scoreOptions = [60, 70, 80, 90, 100, 110, 120]
const hoursMarks = { 1: '1h', 2: '2h', 3: '3h', 4: '4h', 5: '5h', 6: '6h', 7: '7h', 8: '8h' }

const disabledDate = (time) => time.getTime() < Date.now() - 86400000

const nextStep = () => {
  if (step.value < 2) step.value++
}

const submitPlan = async () => {
  submitting.value = true
  try {
    await planAPI.create({
      targetScore: form.targetScore,
      examDate: form.examDate,
      dailyHours: form.dailyHours,
    })
    ElMessage.success('学习计划已创建')
    router.push('/plan/daily')
  } catch (e) {
    ElMessage.error('创建计划失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.wizard-card { max-width: 600px; margin: 0 auto; }
.step-content { margin-top: 32px; min-height: 200px; }
.step-panel { text-align: center; }
.step-panel h4 { font-size: 17px; margin-bottom: 20px; }
.score-options {
  display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;
}
.score-opt {
  width: 60px; height: 60px; border-radius: 12px;
  border: 2px solid var(--border); display: flex;
  align-items: center; justify-content: center;
  font-size: 18px; font-weight: 700; cursor: pointer;
  transition: all 0.2s;
}
.score-opt:hover { border-color: var(--primary-light); }
.score-opt.selected {
  border-color: var(--primary); background: var(--primary); color: #fff;
}
.hours-slider { max-width: 400px; margin: 0 auto; padding: 20px 0; }
</style>