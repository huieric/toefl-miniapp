/**
 * FSRS-4.5 间隔重复算法实现（自包含，无外部依赖）
 *
 * 参考官方算法文档：
 * https://github.com/open-spaced-repetition/awesome-fsrs/wiki/The-Algorithm
 *
 * 记忆状态由 Stability(S, 记忆稳定度/天) 与 Difficulty(D, 难度 1~10) 表示。
 * Rating G: 1=again(遗忘) 2=hard(困难) 3=good(良好) 4=easy(轻松)
 */

const DEFAULT_PARAMS = {
  requestRetention: 0.9,
  maximumInterval: 36500,
  // FSRS-4.5 官方默认参数（17 个权重）
  w: [
    0.4872, 1.4003, 3.7145, 13.8206, 5.1618, 1.2298, 0.8975, 0.031,
    1.6474, 0.1367, 1.0461, 2.1072, 0.0793, 0.3246, 1.587, 0.2272, 2.8755,
  ],
  decay: -0.5,
  factor: 19 / 81,
};

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

function round4(n) {
  return Math.round(n * 10000) / 10000;
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

/**
 * 遗忘曲线：经过 elapsedDays 天后的可回忆概率 R(t,S)
 */
function retrievability(elapsedDays, stability) {
  if (!(stability > 0)) return 0;
  const { factor, decay } = DEFAULT_PARAMS;
  return Math.pow(1 + factor * (elapsedDays / stability), decay);
}

/**
 * 给定目标可回忆率 r 与稳定度 S，计算下一次复习间隔（天）
 */
function nextInterval(requestRetention, stability) {
  const { factor, decay, maximumInterval } = DEFAULT_PARAMS;
  if (!(stability > 0)) return 1;
  const ivl = (stability / factor) * (Math.pow(requestRetention, 1 / decay) - 1);
  return clamp(ivl, 0.1, maximumInterval);
}

function initialStability(rating) {
  return DEFAULT_PARAMS.w[rating - 1]; // S0(G) = w[G-1]
}

function initialDifficulty(rating) {
  const w = DEFAULT_PARAMS.w;
  return clamp(w[4] - (rating - 3) * w[5], 1, 10); // D0(G) = w4 - (G-3)*w5
}

function nextDifficulty(difficulty, rating) {
  const w = DEFAULT_PARAMS.w;
  const d0 = w[4]; // D0(3)
  const dPrime = w[7] * d0 + (1 - w[7]) * (difficulty - w[6] * (rating - 3));
  return clamp(dPrime, 1, 10);
}

function nextRecallStability(difficulty, stability, r, rating) {
  const w = DEFAULT_PARAMS.w;
  const hardPenalty = rating === 2 ? w[15] : 1;
  const easyBonus = rating === 4 ? w[16] : 1;
  const sInc =
    Math.exp(w[8] * (11 - difficulty)) *
    Math.pow(stability, -w[9]) *
    (Math.exp(w[10] * (1 - r)) - 1) *
    hardPenalty * easyBonus + 1;
  return stability * sInc;
}

function nextForgetStability(difficulty, stability, r) {
  const w = DEFAULT_PARAMS.w;
  return (
    w[11] *
    Math.pow(difficulty, -w[12]) *
    (Math.pow(stability + 1, w[13]) - 1) *
    Math.exp(w[14] * (1 - r))
  );
}

/**
 * 复习一张卡片，返回新的记忆状态与下次复习时间。
 * @param {object|null} state - { stability, difficulty, lastReviewAt }；新卡传 null
 * @param {number} rating - 1=again 2=hard 3=good 4=easy
 * @param {Date|number} [now] - 当前时间，默认 new Date()
 */
function review(state, rating, now = new Date()) {
  const nowMs = now instanceof Date ? now.getTime() : now;
  const { requestRetention } = DEFAULT_PARAMS;

  let stability;
  let difficulty;
  let r = null;

  if (!state || state.stability == null) {
    // 新卡：首次评分，直接初始化 S/D
    stability = initialStability(rating);
    difficulty = initialDifficulty(rating);
  } else {
    stability = state.stability;
    difficulty = state.difficulty != null ? state.difficulty : initialDifficulty(rating);

    const lastMs = state.lastReviewAt ? new Date(state.lastReviewAt).getTime() : nowMs;
    const elapsedDays = Math.max(0, (nowMs - lastMs) / 86400000);
    r = retrievability(elapsedDays, stability);

    if (rating === 1) {
      stability = nextForgetStability(difficulty, stability, r);
    } else {
      stability = nextRecallStability(difficulty, stability, r, rating);
    }
    difficulty = nextDifficulty(difficulty, rating);
  }

  const interval = nextInterval(requestRetention, stability);
  const due = new Date(nowMs + interval * 86400000);

  return {
    rating,
    stability: round4(stability),
    difficulty: round4(difficulty),
    retrievability: r == null ? null : round4(r),
    interval,
    due,
  };
}

/**
 * 将旧版 quality(0~5) 映射为 FSRS rating(1~4)
 *   quality 0-2(答错) -> again
 *   quality 3(勉强对) -> hard
 *   quality 4(正确)   -> good
 *   quality 5(秒答)   -> easy
 */
function mapQualityToRating(quality) {
  const q = parseInt(quality, 10);
  if (Number.isNaN(q) || q <= 2) return 1;
  if (q === 3) return 2;
  if (q === 4) return 3;
  return 4;
}

module.exports = {
  review,
  mapQualityToRating,
  retrievability,
  nextInterval,
  DEFAULT_PARAMS,
  _internals: {
    initialStability,
    initialDifficulty,
    nextDifficulty,
    nextRecallStability,
    nextForgetStability,
  },
};
