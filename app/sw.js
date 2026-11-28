// Offline support: cache the app shell on install, serve cache-first, refresh in the background.
// Bump VERSION when shipping so old caches are dropped.
const VERSION = 'pta-v11';
const SHELL = [
  './', 'index.html', 'style.css', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
  'game/main.js', 'game/engine.js', 'game/art.js', 'game/input.js', 'game/ui.js', 'game/say.js',
  'audio/core.js', 'audio/synth.js', 'audio/babble.js', 'audio/radio.js', 'audio/stations.js', 'audio/sfx.js', 'audio/music.js',
  'missions/beat1.js', 'missions/beat2.js', 'missions/beat3.js', 'missions/beat4.js', 'missions/beat5.js', 'missions/beat6.js', 'missions/beat7.js', 'missions/beat8.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.open(VERSION).then(async cache => {
    const hit = await cache.match(e.request);
    const net = fetch(e.request).then(res => {
      if (res.ok || res.type === 'opaque') cache.put(e.request, res.clone());
      return res;
    }).catch(() => hit);
    return hit || net;
  }));
});
