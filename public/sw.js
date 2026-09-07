/*
 * Deliberately cache-free.
 *
 * The only reason this worker exists is Chrome's rule for offering installation: a page
 * is installable when it has a manifest *and* a service worker with a fetch handler.
 * Caching the app here would buy very little (the app is useless without the network —
 * every figure comes from Supabase) and would cost a lot: a stale shell served after a
 * deploy is the classic PWA bug where users keep seeing yesterday's build.
 *
 * So: navigations go to the network, and only when the network is gone does the worker
 * answer at all, with a small "you are offline" page. Nothing is ever stored.
 */
const OFFLINE_PAGE = `<!doctype html>
<html lang="ru"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>Нет соединения</title>
<style>
  html,body{height:100%;margin:0}
  body{display:flex;align-items:center;justify-content:center;background:#000;color:#f5f5f7;
       font:600 15px/1.5 -apple-system,BlinkMacSystemFont,system-ui,sans-serif;text-align:center;padding:24px}
  p{margin:8px 0 0;font-weight:400;color:#a1a1aa;font-size:13px}
  @media (prefers-color-scheme: light){body{background:#fbfbfd;color:#1d1d1f}p{color:#6b7280}}
</style></head>
<body><div>Нет соединения<p>Проверьте интернет и обновите страницу.</p></div></body></html>`;

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return;
  event.respondWith(
    fetch(event.request).catch(
      () => new Response(OFFLINE_PAGE, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
    )
  );
});
