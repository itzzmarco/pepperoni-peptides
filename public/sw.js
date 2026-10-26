// Network-first for pages so updates arrive promptly; cache-first for hashed build assets.
// The personal log lives in localStorage and is never touched here.
const CACHE = 'peptide-ledger-v1';

// Precache the app shell on install: index.html, the hashed JS/CSS it references, and the
// latin fonts the CSS references, so the app opens offline after the first visit.
async function precache() {
  const c = await caches.open(CACHE);
  const res = await fetch('./index.html', { cache: 'reload' });
  if (!res.ok) return;
  const html = await res.clone().text();
  await c.put('./index.html', res);
  const shell = [...html.matchAll(/(?:src|href)="(\.\/[^"]+)"/g)].map(m => new URL(m[1], self.location).href);
  await c.addAll(shell);
  for (const css of shell.filter(u => u.endsWith('.css'))) {
    const text = await (await c.match(css)).text();
    const fonts = [...text.matchAll(/url\(([^)]+-latin-[^)]+\.woff2)\)/g)].map(m => new URL(m[1].replace(/["']/g, ''), css).href);
    await c.addAll([...new Set(fonts)]);
  }
}

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(precache().catch(() => {}));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  const isAsset = new URL(req.url).pathname.includes('/assets/');
  if (isAsset) {
    e.respondWith(
      caches.match(req, { ignoreVary: true }).then(hit => hit || fetch(req).then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      })),
    );
    return;
  }
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreVary: true }).then(hit => hit || caches.match('./index.html'))),
  );
});
