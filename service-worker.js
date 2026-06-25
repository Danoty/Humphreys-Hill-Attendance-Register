const CACHE='humphreys-eventpro-v1';
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./','./index.html','./login.html','./dashboard.html','./register.html','./css/styles.css','./css/login.css','./css/dashboard.css','./css/register.css','./js/storage.js','./js/auth.js','./js/qr.js','./js/events.js','./js/registration.js','./js/reports.js','./js/dashboard.js','./js/register.js','./manifest.json']))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
