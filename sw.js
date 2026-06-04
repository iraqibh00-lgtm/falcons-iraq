// ==============================
// Service Worker - صقور العراق
// غيّر CACHE_VERSION عند كل تحديث
// ==============================
const CACHE_VERSION = 'falcons-v1.0';
const CACHE_NAME = CACHE_VERSION;

// الملفات التي تُحفظ محلياً
const STATIC_ASSETS = [
  '/'
];

// عند التثبيت - حفظ الملفات الأساسية
self.addEventListener('install', function(event) {
  self.skipWaiting(); // يبدأ فوراً بدون انتظار
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// عند التفعيل - احذف الكاش القديم تلقائياً
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function(name) { return name !== CACHE_NAME; })
          .map(function(name) {
            console.log('حذف كاش قديم:', name);
            return caches.delete(name);
          })
      );
    }).then(function() {
      return self.clients.claim(); // يسيطر على كل التبويبات فوراً
    })
  );
});

// استراتيجية: Network First مع Fallback للكاش
// يحاول الإنترنت أولاً → عند الفشل يستخدم الكاش
self.addEventListener('fetch', function(event) {
  // تجاهل طلبات Firebase والـ APIs الخارجية
  if (
    event.request.url.includes('firebase') ||
    event.request.url.includes('googleapis') ||
    event.request.url.includes('fonts') ||
    event.request.url.includes('cdnjs') ||
    event.request.url.includes('unpkg') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        // حفظ النسخة الجديدة في الكاش
        if (response && response.status === 200) {
          var responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(function() {
        // عند انقطاع الإنترنت → استخدم الكاش
        return caches.match(event.request);
      })
  );
});
