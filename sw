// Define um nome e versão para o cache
const CACHE_NAME = 'apontamento-diario-v1';
// Lista de arquivos que devem ser cacheados para o app funcionar offline
const urlsToCache = [
  '/',
  'index.html',
  'style.css',
  'script.js',
  'icon-192x192.png',
  'icon-512x512.png'
];

// Evento 'install': é disparado quando o Service Worker é instalado
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Evento 'fetch': é disparado para cada requisição que a página faz (ex: carregar CSS, JS, imagens)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se a requisição estiver no cache, retorna do cache
        if (response) {
          return response;
        }
        // Se não, faz a requisição à rede
        return fetch(event.request);
      }
    )
  );
});