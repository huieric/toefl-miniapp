<template>
  <div class="page-container">
    <div class="page-header">
      <el-button text @click="$router.back()"><el-icon><ArrowLeft /></el-icon> 返回</el-button>
      <h2>会员中心</h2>
      <p class="subtitle">解锁全部功能，高效备考托福</p>
    </div>

    <!-- Membership Status -->
    <div class="member-status" :class="{ premium: isPremium }">
      <div class="status-icon">
        <el-icon :size="40">
          <Trophy v-if="isPremium" />
          <UserFilled v-else />
        </el-icon>
      </div>
      <div class="status-text">
        <div class="status-title">{{ isPremium ? 'VIP 会员' : '免费用户' }}</div>
        <div class="status-desc" v-if="isPremium">全量功能已解锁，祝备考顺利！</div>
        <div class="status-desc" v-else>升级会员，解锁全部功能</div>
      </div>
    </div>

    <!-- Plan Cards -->
    <div class="plan-cards" v-if="!isPremium">
      <div class="plan-card" v-for="plan in plans" :key="plan.key" :class="{ featured: plan.featured }">
        <div class="plan-tag" v-if="plan.featured">推荐</div>
        <div class="plan-name">{{ plan.name }}</div>
        <div class="plan-price">
          <span class="price-symbol">¥</span>
          <span class="price-value">{{ plan.price }}</span>
          <span class="price-unit">/{{ plan.unit }}</span>
        </div>
        <div class="plan-original" v-if="plan.original">
          原价 ¥{{ plan.original }}/{{ plan.unit }}
        </div>
        <el-button
          :type="plan.featured ? 'primary' : 'default'"
          size="large"
          style="width: 100%; margin-top: 12px;"
          @click="handlePay(plan)"
        >
          {{ plan.btnText }}
        </el-button>
      </div>
    </div>

    <!-- Benefits -->
    <div class="card">
      <h3 class="section-title">会员权益</h3>
      <el-table :data="benefits" stripe :show-header="false" style="width: 100%">
        <el-table-column prop="feature" width="160" />
        <el-table-column prop="free" label="免费版" width="120" align="center">
          <template #default="{ row }">
            <el-icon v-if="row.free === 'unlimited'" color="#67C23A"><Check /></el-icon>
            <el-icon v-else-if="row.free !== ''" color="#67C23A"><Check /></el-icon>
            <span v-else style="color: #ccc">--</span>
            <span v-if="row.free && row.free !== 'unlimited'" style="font-size: 12px; color: var(--text-secondary); margin-left: 4px;">{{ row.free }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="premium" label="VIP会员" width="120" align="center">
          <template #default="{ row }">
            <el-icon v-if="row.premium === 'unlimited'" color="#4A90D9"><Check /></el-icon>
            <el-icon v-else color="#4A90D9"><Check /></el-icon>
            <span style="font-size: 12px; margin-left: 4px; color: var(--primary)" v-if="row.premium !== 'unlimited'">{{ row.premium }}</span>
            <span v-else style="font-size: 12px; margin-left: 4px; color: var(--primary)">无限</span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ArrowLeft, Trophy, UserFilled, Check } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const { isPremium, setMembership } = useUserStore()

const plans = [
  { key: 'monthly', name: '月卡', price: 29.9, unit: '月', original: 39.9, featured: false, btnText: '立即开通' },
  { key: 'quarterly', name: '季卡', price: 79.9, unit: '季', original: 119.7, featured: true, btnText: '立即开通' },
  { key: 'yearly', name: '年卡', price: 299, unit: '年', original: 478.8, featured: false, btnText: '立即开通' },
]

const benefits = [
  { feature: '每日做题数', free: '20 题/天', premium: 'unlimited' },
  { feature: 'AI 陪练时长', free: '10 分钟/天', premium: 'unlimited' },
  { feature: '全真模拟考试', free: '1 次/天', premium: 'unlimited' },
  { feature: 'AI 精批写作', free: '3 次/天', premium: 'unlimited' },
  { feature: 'AI 口语评分', free: '5 次/天', premium: 'unlimited' },
  { feature: '错题复习（SM-2）', free: '基础版', premium: '高级版' },
  { feature: '学习计划生成', free: '基础版', premium: 'AI 自适应' },
  { feature: 'PDF 题目上传', free: '5 份', premium: 'unlimited' },
  { feature: '广告', free: '有', premium: '无广告' },
]

const handlePay = (plan) => {
  // 预留微信支付入口
  ElMessage.info('支付功能开发中，敬请期待！')
  // 模拟支付成功（开发调试时可取消注释）
  // setMembership('premium')
  // ElMessage.success(`已开通${plan.name}会员`)
}
</script>

<style scoped>
.subtitle { color: var(--text-secondary); font-size: 13px; margin-top: 4px; }
.section-title { font-size: 16px; font-weight: 600; margin-bottom: 16px; }

.member-status {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-radius: 12px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
  margin-bottom: 20px;
}
.member-status.premium {
  background: linear-gradient(135deg, #ffd700 0%, #ffb347 100%);
  color: #5a3e00;
}
.status-icon { flex-shrink: 0; }
.status-title { font-size: 18px; font-weight: 700; }
.status-desc { font-size: 13px; margin-top: 4px; opacity: 0.8; }

.plan-cards { display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
.plan-card {
  flex: 1;
  min-width: 180px;
  background: #fff;
  border: 2px solid var(--border);
  border-radius: 12px;
  padding: 24px 16px;
  text-align: center;
  position: relative;
  transition: border-color 0.2s;
}
.plan-card.featured { border-color: var(--primary); }
.plan-card:hover { border-color: var(--primary); }
.plan-tag {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--primary);
  color: #fff;
  font-size: 11px;
  padding: 2px 14px;
  border-radius: 10px;
}
.plan-name { font-size: 16px; font-weight: 600; margin-bottom: 12px; }
.plan-price { margin-bottom: 4px; }
.price-symbol { font-size: 18px; color: var(--danger); }
.price-value { font-size: 36px; font-weight: 700; color: var(--danger); }
.price-unit { font-size: 14px; color: var(--text-secondary); }
.plan-original {
  font-size: 12px;
  color: var(--text-secondary);
  text-decoration: line-through;
}

@media (max-width: 768px) {
  .plan-cards { flex-direction: column; }
  .plan-card { min-width: auto; }
}
</style>
