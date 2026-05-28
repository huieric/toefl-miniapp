<template>
  <div class="auth-page" :class="{ 'is-desktop': !isMobile }">
    <div class="auth-card">
      <h2 class="auth-title">托福备考助手</h2>
      <p class="auth-subtitle">手机号登录</p>
      <el-form :model="form" :rules="rules" ref="formRef" size="large" @submit.prevent="handleLogin">
        <el-form-item prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号" maxlength="11" />
        </el-form-item>
        <el-form-item prop="code">
          <el-input v-model="form.code" placeholder="验证码" maxlength="6">
            <template #append>
              <el-button :disabled="countdown > 0" :loading="sending" @click="sendCode" style="width: 110px;">
                {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
              </el-button>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" native-type="submit" :loading="loading" style="width: 100%">
            登录 / 注册
          </el-button>
        </el-form-item>
      </el-form>
      <p class="auth-tip">未注册手机号将自动创建账号</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { authAPI } from '@/api'

const router = useRouter()
const route = useRoute()
const isMobile = window.innerWidth < 768

const form = reactive({ phone: '', code: '' })
const formRef = ref(null)
const loading = ref(false)
const sending = ref(false)
const countdown = ref(0)

const rules = {
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }, { pattern: /^1\d{10}$/, message: '手机号格式不正确', trigger: 'blur' }],
  code: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
}

const sendCode = async () => {
  if (sending.value) return
  if (!/^1\d{10}$/.test(form.phone)) {
    ElMessage.closeAll()
    ElMessage.warning('请输入正确的手机号')
    return
  }
  sending.value = true
  try {
    await authAPI.sendCode(form.phone)
    ElMessage.closeAll()
    ElMessage.success('验证码已发送')
    countdown.value = 60
    const t = setInterval(() => { countdown.value--; if (countdown.value <= 0) clearInterval(t) }, 1000)
  } catch (e) {
    ElMessage.closeAll()
    ElMessage.error('发送验证码失败')
  } finally {
    sending.value = false
  }
}

const handleLogin = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    const res = await authAPI.login(form.phone, form.code)
    const { token, user } = res.data.data
    // 确保 membership 字段存在，默认 free
    if (user && !user.membership) user.membership = 'free'
    localStorage.setItem('token', token)
    localStorage.setItem('userInfo', JSON.stringify(user || {}))
    ElMessage.closeAll()
    ElMessage.success('登录成功')
    const redirect = route.query.redirect || '/'
    router.replace(redirect)
  } catch (e) {
    // 提取后端返回的具体错误信息
    const errMsg =
      e?.response?.data?.message ||
      e?.response?.data?.msg ||
      e?.message ||
      ''
    const needSendCode = errMsg.includes('验证码已过期') || errMsg.includes('请重新获取')
    if (needSendCode) {
      // 自动触发获取验证码，发送成功后自动重新登录
      try {
        sending.value = true
        await authAPI.sendCode(form.phone)
        ElMessage.closeAll()
        ElMessage.success('验证码已自动重新发送，正在登录...')
        // 生产环境 code=123456，等待 1 秒让后端写入 codeStore 后重新登录
        await new Promise(resolve => setTimeout(resolve, 1000))
        const retryRes = await authAPI.login(form.phone, form.code)
        const { token, user } = retryRes.data.data
        localStorage.setItem('token', token)
        localStorage.setItem('userInfo', JSON.stringify(user || {}))
        ElMessage.closeAll()
        ElMessage.success('登录成功')
        const redirect = route.query.redirect || '/'
        router.replace(redirect)
      } catch (retryErr) {
        const retryMsg =
          retryErr?.response?.data?.message ||
          retryErr?.response?.data?.msg ||
          retryErr?.message ||
          '登录失败，请检查验证码'
        ElMessage.closeAll()
        ElMessage.error(retryMsg)
      } finally {
        sending.value = false
      }
    } else {
      ElMessage.closeAll()
      ElMessage.error(errMsg || '登录失败，请检查验证码')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #4A90D9 0%, #6BA5E7 100%);
  padding: 20px;
}
.auth-card {
  background: #fff;
  border-radius: 16px;
  padding: 40px 32px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}
.auth-title { text-align: center; font-size: 24px; margin-bottom: 4px; }
.auth-subtitle { text-align: center; color: var(--text-secondary); margin-bottom: 32px; font-size: 14px; }
.auth-tip { text-align: center; color: var(--text-secondary); font-size: 12px; }
</style>