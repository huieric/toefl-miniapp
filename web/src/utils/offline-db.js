/**
 * 托福备考助手 — IndexedDB 离线数据层
 *
 * 功能：
 *   1. offlineWrongQuestions — 离线错题缓存（用于离线复习）
 *   2. offlinePracticeLogs — 离线练习日志（联网后同步到服务器）
 *   3. cachedPassages — 已浏览阅读篇章缓存
 *   4. syncQueue — 同步队列管理
 */

const DB_NAME = 'toefl-offline';
const DB_VERSION = 2;

// ── 数据库初始化 ────────────────────────────────────────────

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // 离线错题表
      if (!db.objectStoreNames.contains('wrong-questions')) {
        const ws = db.createObjectStore('wrong-questions', { keyPath: 'questionId' });
        ws.createIndex('subject', 'subject', { unique: false });
        ws.createIndex('synced', 'synced', { unique: false });
      }

      // 练习日志表
      if (!db.objectStoreNames.contains('practice-logs')) {
        const ls = db.createObjectStore('practice-logs', { keyPath: 'id', autoIncrement: true });
        ls.createIndex('synced', 'synced', { unique: false });
        ls.createIndex('userId', 'userId', { unique: false });
      }

      // 阅读篇章缓存
      if (!db.objectStoreNames.contains('passages')) {
        const ps = db.createObjectStore('passages', { keyPath: 'passageId' });
        ps.createIndex('subject', 'subject', { unique: false });
      }

      // 同步队列表
      if (!db.objectStoreNames.contains('sync-queue')) {
        const sqs = db.createObjectStore('sync-queue', { keyPath: 'id', autoIncrement: true });
        sqs.createIndex('type', 'type', { unique: false });
        sqs.createIndex('status', 'status', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ── 通用存储方法 ────────────────────────────────────────────

async function getAll(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function put(storeName, data) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(data);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function get(storeName, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function remove(storeName, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function clear(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function count(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ── 离线错题管理 ────────────────────────────────────────────

/**
 * 缓存错题（供离线复习使用）
 * @param {Object} question - 题目对象
 */
async function cacheWrongQuestion(question) {
  if (!question) return;
  await put('wrong-questions', {
    questionId: question.id,
    subject: question.subject,
    type: question.type,
    difficulty: question.difficulty,
    title: question.title,
    content: question.content,
    options: question.options,
    answer: question.answer,
    analysis: question.analysis,
    passage_text: question.passage_text,
    wrongCount: question.wrongCount || 1,
    synced: false,
    cachedAt: new Date().toISOString(),
  });
}

/**
 * 批量缓存错题
 */
async function cacheWrongQuestions(questions) {
  if (!Array.isArray(questions)) return;
  for (const q of questions) {
    await cacheWrongQuestion(q);
  }
}

/**
 * 获取所有离线错题
 */
async function getOfflineWrongQuestions() {
  return await getAll('wrong-questions');
}

/**
 * 按科目筛选离线错题
 */
async function getOfflineWrongBySubject(subject) {
  const all = await getAll('wrong-questions');
  return all.filter(q => q.subject === subject);
}

/**
 * 移除离线错题
 */
async function removeOfflineWrongQuestion(questionId) {
  await remove('wrong-questions', questionId);
}

/**
 * 标记错题已同步
 */
async function markWrongQuestionSynced(questionId) {
  const item = await get('wrong-questions', questionId);
  if (item) {
    item.synced = true;
    item.syncedAt = new Date().toISOString();
    await put('wrong-questions', item);
  }
}

/**
 * 获取离线错题统计
 */
async function getWrongQuestionStats() {
  const all = await getAll('wrong-questions');
  return {
    total: all.length,
    bySubject: (() => {
      const stats = {};
      for (const q of all) {
        stats[q.subject] = (stats[q.subject] || 0) + 1;
      }
      return stats;
    })(),
    unsynced: all.filter(q => !q.synced).length,
  };
}

// ── 离线练习日志 ────────────────────────────────────────────

/**
 * 记录离线练习日志
 */
async function logPractice(practiceData) {
  if (!practiceData) return;
  await put('practice-logs', {
    ...practiceData,
    synced: false,
    syncedAt: null,
    cachedAt: new Date().toISOString(),
  });
}

/**
 * 获取未同步的练习日志
 */
async function getUnsyncedPracticeLogs() {
  const all = await getAll('practice-logs');
  return all.filter(l => !l.synced);
}

/**
 * 标记练习日志已同步
 */
async function markPracticeLogSynced(logId) {
  const item = await get('practice-logs', logId);
  if (item) {
    item.synced = true;
    item.syncedAt = new Date().toISOString();
    await put('practice-logs', item);
  }
}

// ── 阅读篇章缓存 ────────────────────────────────────────────

/**
 * 缓存阅读篇章
 */
async function cachePassage(passageData) {
  if (!passageData) return;
  await put('passages', {
    passageId: passageData.id || passageData.passageId,
    subject: passageData.subject,
    title: passageData.title,
    passageText: passageData.passage_text || passageData.text,
    questions: passageData.questions || [],
    cachedAt: new Date().toISOString(),
  });
}

/**
 * 获取离线篇章
 */
async function getOfflinePassages() {
  return await getAll('passages');
}

/**
 * 检查篇章是否已缓存
 */
async function isPassageCached(passageId) {
  const item = await get('passages', passageId);
  return !!item;
}

// ── 同步队列 ────────────────────────────────────────────────

/**
 * 添加同步任务到队列
 */
async function addToSyncQueue(task) {
  if (!task) return;
  await put('sync-queue', {
    type: task.type,
    data: task.data,
    status: 'pending',
    retries: 0,
    maxRetries: 3,
    createdAt: new Date().toISOString(),
  });
}

/**
 * 获取待同步任务
 */
async function getPendingSyncTasks() {
  const all = await getAll('sync-queue');
  return all.filter(t => t.status === 'pending');
}

/**
 * 标记同步任务完成
 */
async function markSyncTaskDone(taskId) {
  await remove('sync-queue', taskId);
}

/**
 * 清除过期的同步任务（超过7天的失败任务）
 */
async function cleanupStaleSyncTasks() {
  const all = await getAll('sync-queue');
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  for (const task of all) {
    if (task.status === 'failed' && task.createdAt < cutoff) {
      await remove('sync-queue', task.id);
    }
  }
}

// ── 维护 ────────────────────────────────────────────────────

/**
 * 获取数据库状态
 */
async function getDbStatus() {
  const db = await openDB();
  return {
    version: db.version,
    stores: Array.from(db.objectStoreNames),
  };
}

/**
 * 清除所有离线数据
 */
async function clearAllOffline() {
  await Promise.all([
    clear('wrong-questions'),
    clear('practice-logs'),
    clear('passages'),
    clear('sync-queue'),
  ]);
}

export default {
  // 通用
  openDB, getAll, put, get, remove, clear, count,
  // 离线错题
  cacheWrongQuestion,
  cacheWrongQuestions,
  getOfflineWrongQuestions,
  getOfflineWrongBySubject,
  removeOfflineWrongQuestion,
  markWrongQuestionSynced,
  getWrongQuestionStats,
  // 练习日志
  logPractice,
  getUnsyncedPracticeLogs,
  markPracticeLogSynced,
  // 篇章缓存
  cachePassage,
  getOfflinePassages,
  isPassageCached,
  // 同步
  addToSyncQueue,
  getPendingSyncTasks,
  markSyncTaskDone,
  cleanupStaleSyncTasks,
  // 维护
  getDbStatus,
  clearAllOffline,
};
