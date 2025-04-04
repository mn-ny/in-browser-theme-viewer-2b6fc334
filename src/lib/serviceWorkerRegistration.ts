
import { vfs } from './vfs';

export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('ServiceWorker registration successful with scope:', registration.scope);
      
      // Set up message handling for asset requests
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'ASSET_REQUEST') {
          const { path } = event.data;
          const asset = vfs.getFile(path);
          
          if (asset && event.ports && event.ports[0]) {
            // Determine content type based on file extension
            let contentType = 'text/plain';
            if (path.endsWith('.css')) contentType = 'text/css';
            else if (path.endsWith('.js')) contentType = 'application/javascript';
            else if (path.endsWith('.json')) contentType = 'application/json';
            else if (path.endsWith('.png')) contentType = 'image/png';
            else if (path.endsWith('.jpg') || path.endsWith('.jpeg')) contentType = 'image/jpeg';
            else if (path.endsWith('.gif')) contentType = 'image/gif';
            else if (path.endsWith('.svg')) contentType = 'image/svg+xml';
            
            // Send the asset content back to the service worker
            event.ports[0].postMessage({
              type: 'ASSET_RESPONSE',
              found: true,
              content: asset.content,
              contentType
            });
          } else if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({
              type: 'ASSET_RESPONSE',
              found: false
            });
          }
        }
      });
      
      return registration;
    } catch (error) {
      console.error('ServiceWorker registration failed:', error);
      return null;
    }
  }
  
  console.warn('ServiceWorker is not supported in this browser');
  return null;
};
