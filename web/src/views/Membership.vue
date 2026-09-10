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
            <el-icon v-if="row.free === 'unlimited'" color="#23B26D"><Check /></el-icon>
            <el-icon v-else-if="row.free !== ''" color="#23B26D"><Check /></el-icon>
            <span v-else style="color: #ccc">--</span>
            <span v-if="row.free && row.free !== 'unlimited'" style="font-size: 12px; color: var(--text-secondary); margin-left: 4px;">{{ row.free }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="premium" label="VIP会员" width="120" align="center">
          <template #default="{ row }">
            <el-icon v-if="row.premium === 'unlimited'" color="#4255FF"><Check /></el-icon>
            <el-icon v-else color="#4255FF"><Check /></el-icon>
            <span style="font-size: 12px; margin-left: 4px; color: var(--primary)" v-if="row.premium !== 'unlimited'">{{ row.premium }}</span>
            <span v-else style="font-size: 12px; margin-left: 4px; color: var(--primary)">无限</span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 移动端权益卡片 -->
      <div class="benefit-cards" v-if="isMobile">
        <div v-for="(b, i) in benefits" :key="i" class="benefit-item">
          <span class="benefit-feature">{{ b.feature }}</span>
          <div class="benefit-compare">
            <span class="benefit-free">
              <el-icon v-if="b.free !== '' && b.free !== 'unlimited'" color="#23B26D" :size="14"><Check /></el-icon>
              <span v-else style="color: #ccc">--</span>
              <span v-if="b.free && b.free !== 'unlimited' && b.free !== true">{{ b.free }}</span>
              <span v-else-if="b.free === 'unlimited'" style="color: #23B26D">无限</span>
            </span>
            <span class="benefit-premium">
              <el-icon :size="14"><Check /></el-icon>
              <span v-if="b.premium !== 'unlimited'">{{ b.premium }}</span>
              <span v-else>无限</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { ArrowLeft, Trophy, UserFilled, Check } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const { isPremium, setMembership } = useUserStore()

const isMobile = ref(typeof window !== 'undefined' ? window.innerWidth < 768 : false)
let _resizeHandler = null
if (typeof window !== 'undefined') {
  _resizeHandler = () => { isMobile.value = window.innerWidth < 768 }
  window.addEventListener('resize', _resizeHandler)
  onUnmounted(() => { if (_resizeHandler) window.removeEventListener('resize', _resizeHandler) })
}

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
.page-container {
  padding: 20px 16px 48px;
  max-width: 700px;
  margin: 0 auto;
}
.page-header {
  margin-bottom: 20px;
}
.page-header h2 {
  font-size: 24px;
  font-weight: 800;
}
.subtitle {
  color: var(--text-secondary);
  font-size: 13px;
  margin-top: 4px;
}
.section-title {
  font-size: 17px;
  font-weight: 700;
  margin-bottom: 16px;
  letter-spacing: -0.01em;
}

.member-status {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 24px 28px;
  border-radius: var(--radius);
  background:
    radial-gradient(520px 200px at 100% 0%, rgba(124, 92, 255, 0.18), transparent 55%),
    linear-gradient(135deg, #F0F2FF 0%, #E7EBFF 100%);
  margin-bottom: 20px;
  border: 1px solid var(--primary-soft-2);
}
.member-status.premium {
  background: var(--grad-accent);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 16px 40px rgba(124, 92, 255, 0.28);
}
.member-status.premium .status-desc { opacity: 0.92; }
.status-icon {
  width: 68px;
  height: 68px;
  border-radius: 20px;
  background: rgba(255,255,255,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary);
  flex-shrink: 0;
}
.member-status.premium .status-icon {
  background: rgba(255,255,255,0.22);
  color: #fff;
}
.status-title {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.01em;
}
.status-desc {
  font-size: 13px;
  margin-top: 4px;
  opacity: 0.75;
}

.plan-cards {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.plan-card {
  flex: 1;
  min-width: 180px;
  background: #fff;
  border: 2px solid var(--border);
  border-radius: var(--radius);
  padding: 28px 16px 22px;
  text-align: center;
  position: relative;
  transition: all 0.2s ease;
}
.plan-card.featured {
  border-color: var(--primary);
  box-shadow: 0 12px 32px rgba(66, 85, 255, 0.16);
}
.plan-card:hover {
  border-color: var(--primary);
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}
.plan-tag {
  position: absolute;
  top: -11px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--grad-primary);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 16px;
  border-radius: 999px;
  box-shadow: 0 4px 12px rgba(66, 85, 255, 0.35);
}
.plan-name {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 14px;
}
.plan-price { margin-bottom: 6px; }
.price-symbol {
  font-size: 18px;
  font-weight: 700;
  color: var(--primary);
}
.price-value {
  font-size: 40px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--primary);
}
.price-unit {
  font-size: 14px;
  color: var(--text-secondary);
}
.plan-original {
  font-size: 12px;
  color: var(--text-muted);
  text-decoration: line-through;
  margin-bottom: 6px;
}

/* ===== 移动端全面适配 ===== */
@media (max-width: 768px) {
  .page-container {
    padding: 0 12px 76px;
    max-width: 100%;
  }
  .page-header {
    margin-bottom: 14px;
  }
  .page-header h2 {
    font-size: 20px;
  }
  .subtitle {
    font-size: 12px;
  }
  
  /* 会员状态 */
  .member-status {
    flex-direction: column;
    text-align: center;
    padding: 20px 16px;
    border-radius: var(--radius-sm);
    gap: 12px;
  }
  .status-icon {
    width: 56px;
    height: 56px;
    border-radius: 16px;
  }
  .status-icon .el-icon {
    --el-icon-size: 28px;
  }
  .status-title {
    font-size: 17px;
  }
  .status-desc {
    font-size: 12px;
  }
  
  /* 方案卡片 1 列 */
  .plan-cards {
    flex-direction: column;
    gap: 12px;
  }
  .plan-card {
    min-width: auto;
    padding: 22px 16px 18px;
    border-radius: var(--radius-sm);
  }
  .plan-name {
    font-size: 15px;
  }
  .price-value {
    font-size: 36px;
  }
  .price-symbol {
    font-size: 16px;
  }
  
  /* 权益表格降级为卡片 */
  .card :deep(.el-table) {
    display: none;
  }
  
  .benefit-cards {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 12px;
  }
  .benefit-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    background: #F8F9FC;
    border-radius: 8px;
    font-size: 13px;
  }
  .benefit-feature {
    font-weight: 500;
    color: var(--text);
  }
  .benefit-compare {
    display: flex;
    gap: 16px;
    align-items: center;
  }
  .benefit-free, .benefit-premium {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--text-secondary);
  }
  .benefit-premium {
    color: var(--primary);
    font-weight: 600;
  }
}

@media (max-width: 480px) {
  .member-status {
    padding: 16px 14px;
  }
  .status-title {
    font-size: 16px;
  }
  .price-value {
    font-size: 32px;
  }
}
</style>
