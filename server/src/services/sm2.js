/**
 * SM-2 遗忘曲线算法实现
 *
 * SM-2 (SuperMemo 2) 是一种间隔重复算法，用于计算最佳复习时间点。
 * 参数说明：
 * - quality: 用户自评回忆质量（0-5）
 *   0: 完全忘记
 *   1: 错误回答，但看到正确答案后能想起
 *   2: 错误回答，但看到正确答案后觉得简单
 *   3: 正确回答，但回忆困难
 *   4: 正确回答，经过一些思考
 *   5: 完美回忆，毫不费力
 * - easiness (EF): 难度因子，初始值2.5，范围[1.3, 2.5]
 * - interval: 当前复习间隔（天）
 * - repetitions: 连续正确次数
 */

const DEFAULT_EASINESS = 2.50;
const MIN_EASINESS = 1.30;

/**
 * 更新SM-2参数
 * @param {number} easiness - 当前难度因子
 * @param {number} interval - 当前间隔天数
 * @param {number} repetitions - 连续正确次数
 * @param {number} quality - 本次回忆质量（0-5）
 * @returns {Object} 更新后的参数
 */
function updateSM2(easiness, interval, repetitions, quality) {
  easiness = easiness || DEFAULT_EASINESS;
  interval = interval || 0;
  repetitions = repetitions || 0;

  // quality < 3 表示遗忘，重置 repetitions
  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    // 根据 repetitions 计算新的 interval
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easiness);
    }
    repetitions += 1;
  }

  // 更新 easiness
  easiness = easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  easiness = Math.max(MIN_EASINESS, easiness);

  // 计算下次复习日期
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  return {
    easiness: Math.round(easiness * 100) / 100,
    interval,
    repetitions,
    nextReviewDate: nextReviewDate.toISOString(),
  };
}

/**
 * 根据质量评分计算是否需要当天复习
 * @param {number} quality - 回忆质量
 * @returns {boolean}
 */
function needsSameDayReview(quality) {
  return quality < 3;
}

/**
 * 获取复习优先级（按下次复习日期紧急程度排序）
 * @param {Array} items - SM-2项目列表
 * @returns {Array} 排序后的项目
 */
function sortByReviewPriority(items) {
  const now = new Date();
  return items.sort((a, b) => {
    const aDate = new Date(a.next_review_at || a.nextReviewAt);
    const bDate = new Date(b.next_review_at || b.nextReviewAt);
    return aDate - bDate;
  });
}

/**
 * 预估下次复习日期
 * @param {number} easiness
 * @param {number} interval
 * @param {number} repetitions
 * @param {number} quality
 * @returns {string} ISO日期字符串
 */
function predictNextReview(easiness, interval, repetitions, quality) {
  const result = updateSM2(easiness, interval, repetitions, quality);
  return result.nextReviewDate;
}

module.exports = { updateSM2, needsSameDayReview, sortByReviewPriority, predictNextReview };