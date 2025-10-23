// Service Worker for blocking extension requests
self.addEventListener('fetch', function(event) {
  const url = event.request.url;
  
  // Block all chrome-extension requests
  if (url.includes('chrome-extension://') || 
      url.includes('pejdijmoenmkgeppbflobdenhhabjlaj') ||
      url.includes('completion_list.html') ||
      url.includes('utils.js') ||
      url.includes('extensionState.js') ||
      url.includes('heuristicsRedefinitions.js')) {
    
    console.log('🚫 Blocked extension request:', url);
    
    // Return a 404 response to prevent the error
    event.respondWith(
      new Response('', {
        status: 404,
        statusText: 'Not Found',
        headers: {
          'Content-Type': 'text/plain'
        }
      })
    );
    return;
  }
  
  // Allow all other requests to proceed normally
  event.respondWith(fetch(event.request));
});

// Handle service worker installation
self.addEventListener('install', function(event) {
  console.log('🛡️ Extension blocking service worker installed');
  self.skipWaiting();
});

// Handle service worker activation
self.addEventListener('activate', function(event) {
  console.log('🛡️ Extension blocking service worker activated');
  event.waitUntil(self.clients.claim());
});