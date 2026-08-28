import { ElMessage } from 'element-plus'
import { questionAPI } from '@/api'

/**
 * 上传后后台解析的增量展示：轮询解析状态，每解析出内容就刷新一次列表
 * @param {Function} refresh 列表刷新函数（如 fetchList）
 */
export function useUploadPolling(refresh) {
  const pollUpload = async (uploadId) => {
    if (!uploadId) return
    await refresh() // 立即刷新一次
    ElMessage.info('开始后台解析，题目会逐步显示，你可以先继续使用')
    let resolved = false
    let lastParsed = 0
    for (let i = 0; i < 240; i++) {
      await new Promise((r) => setTimeout(r, 3000))
      try {
        const s = await questionAPI.uploadStatus(uploadId)
        const st = s.data?.data
        if (st?.status === 'completed') {
          resolved = true
          await refresh()
          const n = st.parsedCount || 0
          if (n > 0) {
            ElMessage.success(`解析完成！共入库 ${n} 道题`)
          } else if (st.meta?.skippedCount > 0) {
            ElMessage.info('这些题目之前已导入过，已刷新列表')
          } else {
            ElMessage.warning('未提取到题目：可能是扫描图片型 PDF（无文字层）')
          }
          break
        }
        if (st?.status === 'failed') {
          resolved = true
          ElMessage.error(`解析失败: ${st.error || '未知错误'}`)
          break
        }
        if (st?.status === 'processing') {
          await refresh() // 增量展示：解析出多少显示多少
          const pp = st.meta?.parsedPassages || 0
          if (pp > 0 && pp !== lastParsed) {
            lastParsed = pp
            ElMessage.info(`已解析 ${pp} 篇，后台继续中...`)
          }
        }
      } catch (_) { /* 忽略单次轮询失败 */ }
    }
    if (!resolved) ElMessage.info('解析仍在后台进行，稍后刷新即可看到新题目')
  }
  return { pollUpload }
}
