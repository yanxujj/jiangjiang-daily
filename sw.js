// Service Worker - 网络优先策略（HTML 总是最新，JS/CSS 缓存加速）
const VERSION = 'v1.0.0-' + Date.now();

self.addEventListener('install', (event) => {
  // 立即激活新版本
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // 清除所有旧缓存
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 只处理同源请求
  if (url.origin !== location.origin) return;

  // HTML 文件：网络优先（确保总是最新）
  if (event.request.mode === 'navigate' || event.request.destination === 'document' || url.pathname.endsWith('/')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-cache' })
        .then((response) => {
          const clone = response.clone();
          caches.open('jj-html').then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request).then((r) => r || caches.match('/jiangjiang-daily/')))
    );
    return;
  }

  // JS/CSS/图片：缓存优先（快），后台更新
  if (event.request.destination === 'script' || event.request.destination === 'style' ||
      event.request.destination === 'image' || event.request.destination === 'font') {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open('jj-static').then((cache) => cache.put(event.request, clone));
          return response;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }
});
