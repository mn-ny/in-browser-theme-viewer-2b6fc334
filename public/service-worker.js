
// Theme Previewer Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// This will handle requests for theme assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Only intercept requests for assets
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      (async () => {
        // Talk to the main thread to get the asset content
        const allClients = await self.clients.matchAll();
        if (allClients.length === 0) {
          return fetch(event.request);
        }
        
        const client = allClients[0];
        const assetPath = url.pathname.substring(1); // Remove leading slash
        
        // Request the asset from the main thread
        const messageChannel = new MessageChannel();
        const requestPromise = new Promise((resolve) => {
          messageChannel.port1.onmessage = (event) => {
            if (event.data && event.data.type === 'ASSET_RESPONSE') {
              if (event.data.found) {
                const { content, contentType } = event.data;
                // Create response from the asset content
                const contentArray = new Uint8Array(content).buffer;
                resolve(new Response(contentArray, {
                  headers: { 'Content-Type': contentType }
                }));
              } else {
                resolve(new Response('Asset not found', { status: 404 }));
              }
            }
          };
        });
        
        client.postMessage({
          type: 'ASSET_REQUEST',
          path: assetPath
        }, [messageChannel.port2]);
        
        return requestPromise;
      })()
    );
  }
});
