// 缓存名称
const CACHE_NAME = 'majiang-app-v1';

// 需要缓存的资源
const filesToCache = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './logo.jpg',
  './manifest.json'
];

// 安装事件处理
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(filesToCache);
      })
  );
});

// 激活事件处理
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 请求拦截
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果找到缓存的响应，则返回缓存
        if (response) {
          return response;
        }
        
        // 否则进行网络请求
        return fetch(event.request)
          .then(response => {
            // 对于HTTP URLs的响应进行缓存
            if (!event.request.url.startsWith('http')) {
              return response;
            }

            // 复制响应以便缓存
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // 如果网络请求失败且是HTML文档的请求，返回缓存的首页
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('./index.html');
            }
          });
      })
  );
}); 