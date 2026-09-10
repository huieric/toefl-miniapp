/**
 * 托福备考助手 — PWA Service Worker v2
 *
 * 缓存策略：
 *   1. 静态资源（CSS/JS/字体/图标）: cache-first + stale-while-revalidate
 *   2. API 请求: network-first（在线时更新缓存）
 *   3. 练习/错题数据: network-first（首次加载时缓存）
 *   4. 页面导航: network-first + cache fallback
 *   5. 离线页面: 缓存 fallback
 *
 * 版本: v2 | 增量更新: 每次 sw.js 变更自动触发
 */
const CACHE_NAME = 'toefl-prep-v5';
const ASSETS_CACHE = 'toefl-assets-v5';
const DATA_CACHE = 'toefl-data-v5';
const OFFLINE_CACHE = 'toefl-offline-v5';
const BASE_PATH = '/toefl-miniapp/web';
const OFFLINE_URL = BASE_PATH + '/offline.html';

// 精确匹配的静态资源列表（构建产物 hash 由 Vite 管理）
const PRECACHE_ASSETS = [
  OFFLINE_URL,
  BASE_PATH + '/index.html',
  BASE_PATH + '/manifest.json',
  BASE_PATH + '/icons/icon-192.png',
  BASE_PATH + '/icons/icon-512.png',
  BASE_PATH + '/icons/icon-192.svg',
  BASE_PATH + '/icons/icon-512.svg',
];

// ── 工具函数 ────────────────────────────────────────────────

/** 判断是否为静态资源请求 */
function isAssetRequest(url) {
  return /\.(css|js|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|ico|webp)(\?.*)?$/i.test(url);
}

/** 判断是否为 API 请求 */
function isApiRequest(url) {
  return url.includes('/api/') || url.includes('/uploads/');
}

/** 判断是否为重点数据接口（需要缓存） */
function isDataApiRequest(url) {
  return /\/api\/(questions|wrong|practice|vocab|review|reading|listening|speaking|writing)\b/i.test(url);
}

/** 安全地缓存响应 */
async function cacheResponse(cache, request, response) {
  try {
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
  } catch (e) {
    console.warn('[SW] 缓存响应失败:', e.message);
  }
}

/** 获取离线页面 */
async function getOfflinePage() {
  const cache = await caches.open(OFFLINE_CACHE);
  const cached = await cache.match(OFFLINE_URL);
  if (cached) return cached;
  return new Response(
    `<html><head><meta charset="utf-8"><title>离线</title></head>
     <body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;">
       <div style="text-align:center"><h2>📡 暂无网络连接</h2><p>请检查网络后刷新页面</p></div>
     </body></html>`,
    { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

// ── Install ─────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate ────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // 清理旧缓存
      caches.keys().then((names) =>
        Promise.all(names.filter((n) => !n.includes('v5')).map((n) => caches.delete(n)))
      ),
      // 立即接管页面
      self.clients.claim(),
    ])
  );
});

// ── Fetch ───────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // 只处理 GET 请求
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 1. 静态资源：cache-first + stale-while-revalidate
  if (isAssetRequest(url.pathname)) {
    event.respondWith(
      caches.open(ASSETS_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) {
          // 命中缓存，后台更新
          fetch(request).then((resp) => {
            if (resp.ok) cache.put(request, resp.clone());
          }).catch(() => {});
          return cached;
        }
        // 未命中，网络获取并缓存
        const networkResp = await fetch(request);
        if (networkResp.ok) cache.put(request, networkResp.clone());
        return networkResp;
      }).catch(() => caches.match(request))
    );
    return;
  }

  // 2. API 请求：network-first
  if (isApiRequest(url.pathname)) {
    event.respondWith(
      fetch(request)
        .then((resp) => {
          // API 成功时缓存数据接口
          if (isDataApiRequest(url.pathname) && resp.ok) {
            const clone = resp.clone();
            caches.open(DATA_CACHE).then((cache) => cache.put(request, clone)).catch(() => {});
          }
          return resp;
        })
        .catch(async () => {
          // 离线时尝试从缓存获取数据接口
          if (isDataApiRequest(url.pathname)) {
            const cache = await caches.open(DATA_CACHE);
            const cached = await cache.match(request);
            if (cached) return cached;
          }
          // 普通 API 请求离线时返回 503
          if (url.pathname.startsWith('/api/')) {
            return new Response(JSON.stringify({ code: 503, message: '离线，请稍后重试' }), {
              status: 503, headers: { 'Content-Type': 'application/json' }
            });
          }
          return getOfflinePage();
        })
    );
    return;
  }

  // 3. 页面导航：network-first + cache fallback
  if (request.destination === 'document' || url.pathname.startsWith('/toefl')) {
    event.respondWith(
      fetch(request)
        .then((resp) => {
          if (resp.ok) {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {});
          }
          return resp;
        })
        .catch(async () => caches.match(request).then((c) => c || getOfflinePage()))
    );
    return;
  }

  // 4. 其他请求：直接网络
  event.respondWith(fetch(request).catch(() => caches.match(request)));
});

// ── Background Sync ─────────────────────────────────────────

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-practice-logs') {
    event.waitUntil(syncPracticeLogs());
  }
});

async function syncPracticeLogs() {
  // 后台同步：将本地 practice_logs 队列同步到服务器
  const clients = await self.clients.matchAll();
  for (const client of clients) {
    client.postMessage({ type: 'SYNC_STARTED' });
  }
}

// ─- Push Notification (预留) ────────────────────────────────

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: '托福备考助手', body: '新内容更新' };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: BASE_PATH + '/icons/icon-192.png',
      badge: BASE_PATH + '/icons/icon-192.png',
      vibrate: [200, 100, 200],
    })
  );
});
