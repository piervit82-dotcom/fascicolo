/* =========================================================
   InRegola — Service Worker
   Mette in cache l'app per farla partire anche offline.
   I dati (documenti, registri, etichette) stanno in IndexedDB
   sul dispositivo: restano disponibili a prescindere dalla rete.

   AGGIORNAMENTI: quando modifichi l'app, alza il numero di
   versione qui sotto (es. da 'inregola-v17' a 'inregola-v18').
   I dispositivi scaricheranno la nuova versione e cancelleranno
   la cache vecchia al riavvio successivo.
   ========================================================= */
const CACHE = 'inregola-v22';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// installazione: precarico i file dell'app
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// attivazione: elimino le cache delle versioni precedenti
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// richieste: prima la cache (offline-first), con aggiornamento in background
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    caches.match(req).then(cached => {
      const fromNet = fetch(req).then(res => {
        // salvo in cache le risposte valide, inclusi i font di Google
        // (opaque cross-origin compresi), cosi' restano disponibili offline
        if (res && (res.status === 200 || res.type === 'opaque')) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => cached); // offline: ripiego sulla cache
      return cached || fromNet;
    })
  );
});
