/* 大邱×福岡 行程 PWA Service Worker
 * 策略：
 *  - HTML / manifest：network-first（盡量拿最新，沒網就回快取）
 *  - 字型 / 圖片 / 同源資源：cache-first
 *  - 天氣 / 匯率 API：stale-while-revalidate（先給快取再背景更新）
 */
const BUILD = '20260504-054055';
const CACHE_VERSION = 'dftrip-' + BUILD;
const CORE = [
  './',
  './index.html',
  './manifest.json',
  './og.png'
];
const RUNTIME = 'dftrip-runtime-' + BUILD;
const API_CACHE = 'dftrip-api-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  const allowed = new Set([CACHE_VERSION, RUNTIME, API_CACHE]);
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => !allowed.has(k)).map((k) => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

const isApi = (url) => /open-meteo\.com|er-api\.com/i.test(url.hostname);
const isFont = (url) => /fonts\.(googleapis|gstatic)\.com/i.test(url.hostname);
const isHtml = (req) => req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // HTML：network-first
  if (isHtml(request)) {
    event.respondWith(
      fetch(request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
        return res;
      }).catch(() => caches.match(request).then((c) => c || caches.match('./index.html')))
    );
    return;
  }

  // API：stale-while-revalidate（5 分鐘新鮮度提示）
  if (isApi(url)) {
    event.respondWith(
      caches.open(API_CACHE).then((cache) => cache.match(request).then((cached) => {
        const network = fetch(request).then((res) => {
          if (res && res.status === 200) cache.put(request, res.clone());
          return res;
        }).catch(() => cached);
        return cached || network;
      }))
    );
    return;
  }

  // 字型 / 圖片：cache-first
  if (isFont(url) || /\.(?:woff2?|ttf|otf|png|jpg|jpeg|webp|svg|ico)$/i.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(RUNTIME).then((cache) => cache.put(request, copy));
        }
        return res;
      }).catch(() => cached || Response.error()))
    );
    return;
  }

  // 其他同源：cache-first → network
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(RUNTIME).then((cache) => cache.put(request, copy));
        }
        return res;
      }).catch(() => cached || Response.error()))
    );
  }
});
