const CACHE_NAME = 'corcho-v6.6.3';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/styles.css',
  './js/seed-zonas.js',
  './js/app.js',
  './js/db.js',
  './js/views/carne-view.js',
  './js/views/hibrido-view.js',
  './js/views/leche-view.js',
  './js/views/ganaderia-view.js',
  './js/views/explotacion-view.js',
  './js/views/helpers/modo-contexto.js',
  './js/fincas.js',
  './js/idb-local.js',
  './js/pesadas.js',
  './js/zonas.js',
  './js/gastos.js',
  './js/informes.js',
  './js/export.js',
  './js/pdf-import.js',
  './js/reportes.js',
  './js/reproduccion.js',
  './js/wizard-manager.js',
  './js/snapshot-service.js',
  './js/views/wizards/wizard-traslado.js',
  './js/views/wizards/wizard-tratamiento.js',
  './js/views/wizards/wizard-finca.js',
  './js/views/wizards/wizard-crotales.js',
  './js/views/wizards/wizard-albaran-leche.js',
  './js/views/wizards/wizard-gasto.js',
  './js/views/wizards/wizard-venta-masiva.js',
  './js/views/helpers/ayuda.js',
  './js/views/manuales-view.js',
  './js/views/documentos-view.js',
  './manual/index.html',
  './manual/ejemplo-ovino-carne.html',
  './manual/ejemplo-ovino-leche.html',
  './manual/registros-produccion.html',
  './manual/manual-comercializacion.html',
  './manual/manual-pesadas.html',
  './manual/manual-control-lechero.html',
  './manual/manual-gastos.html',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-placeholder.svg',
  './icons/logo-header.png',
  './icons/app-icon.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',
  'https://cdn.jsdelivr.net/npm/idb@8/build/umd.js',
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/legacy/build/pdf.min.js',
  'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/legacy/build/pdf.worker.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('SW: Cacheando assets iniciales');
        return Promise.allSettled(
          ASSETS.map(url => cache.add(url).catch(err => console.warn(`SW: Error cacheando ${url}`, err)))
        );
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log(`SW: Borrando caché antigua: ${key}`);
            return caches.delete(key);
          })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(event.request);
          return networkResponse;
        } catch (error) {
          console.log('SW: Fallo de red, sirviendo desde caché o fallback.');
          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = await cache.match('./index.html');
          return cachedResponse;
        }
      })()
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
