// Error handler utility to suppress browser extension errors
export const suppressExtensionErrors = () => {
  // Suppress Chrome extension errors
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalLog = console.log;
  
  console.error = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    
    // Filter out common extension errors
    if (
      message.includes('runtime.lastError') ||
      message.includes('message port closed') ||
      message.includes('FrameDoesNotExistError') ||
      message.includes('chrome-extension://') ||
      message.includes('background.js') ||
      message.includes('Could not establish connection') ||
      message.includes('disconnected port object') ||
      message.includes('back/forward cache') ||
      message.includes('completion_list.html') ||
      message.includes('utils.js') ||
      message.includes('extensionState.js') ||
      message.includes('heuristicsRedefinitions.js') ||
      message.includes('net::ERR_FILE_NOT_FOUND') ||
      message.includes('pejdijmoenmkgeppbflobdenhhabjlaj') ||
      message.includes('chrome-extension://pejdijmoenmkgeppbflobdenhhabjlaj')
    ) {
      return; // Suppress these errors
    }
    
    // Log other errors normally
    originalError.apply(console, args);
  };

  console.warn = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    
    if (
      message.includes('chrome-extension://') ||
      message.includes('completion_list.html') ||
      message.includes('utils.js') ||
      message.includes('extensionState.js') ||
      message.includes('heuristicsRedefinitions.js') ||
      message.includes('pejdijmoenmkgeppbflobdenhhabjlaj')
    ) {
      return; // Suppress these warnings
    }
    
    originalWarn.apply(console, args);
  };

  console.log = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    
    if (
      message.includes('chrome-extension://') ||
      message.includes('completion_list.html') ||
      message.includes('pejdijmoenmkgeppbflobdenhhabjlaj')
    ) {
      return; // Suppress these logs
    }
    
    originalLog.apply(console, args);
  };

  // Suppress unhandled promise rejections from extensions
  window.addEventListener('unhandledrejection', (event) => {
    const message = event.reason?.toString() || '';
    
    if (
      message.includes('runtime.lastError') ||
      message.includes('message port closed') ||
      message.includes('FrameDoesNotExistError') ||
      message.includes('chrome-extension://') ||
      message.includes('background.js') ||
      message.includes('Could not establish connection') ||
      message.includes('disconnected port object') ||
      message.includes('completion_list.html') ||
      message.includes('utils.js') ||
      message.includes('extensionState.js') ||
      message.includes('heuristicsRedefinitions.js') ||
      message.includes('net::ERR_FILE_NOT_FOUND')
    ) {
      event.preventDefault(); // Suppress these errors
    }
  });

  // Block network requests to extensions completely
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const url = args[0]?.toString() || '';
    
    // Block all requests to chrome extensions
    if (
      url.includes('chrome-extension://') ||
      url.includes('pejdijmoenmkgeppbflobdenhhabjlaj') ||
      url.includes('completion_list.html') ||
      url.includes('utils.js') ||
      url.includes('extensionState.js') ||
      url.includes('heuristicsRedefinitions.js')
    ) {
      // Return a mock response to prevent errors
      return new Response('', { 
        status: 404, 
        statusText: 'Not Found',
        headers: { 'Content-Type': 'text/plain' }
      });
    }
    
    try {
      return await originalFetch(...args);
    } catch (error: any) {
      const message = error?.message || '';
      if (
        message.includes('chrome-extension://') ||
        message.includes('net::ERR_FILE_NOT_FOUND') ||
        message.includes('completion_list.html') ||
        message.includes('utils.js') ||
        message.includes('extensionState.js') ||
        message.includes('heuristicsRedefinitions.js') ||
        message.includes('pejdijmoenmkgeppbflobdenhhabjlaj')
      ) {
        // Suppress these network errors silently
        return new Response('', { 
          status: 404, 
          statusText: 'Not Found',
          headers: { 'Content-Type': 'text/plain' }
        });
      }
      throw error;
    }
  };

  // Block XMLHttpRequest to extensions
  const originalXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...args: any[]) {
    const urlString = url.toString();
    
    if (
      urlString.includes('chrome-extension://') ||
      urlString.includes('pejdijmoenmkgeppbflobdenhhabjlaj') ||
      urlString.includes('completion_list.html') ||
      urlString.includes('utils.js') ||
      urlString.includes('extensionState.js') ||
      urlString.includes('heuristicsRedefinitions.js')
    ) {
      // Block the request by throwing an error that will be caught
      throw new Error('Blocked extension request');
    }
    
    return originalXHROpen.call(this, method, url, ...(args as any));
  };
};

// Initialize error suppression
if (typeof window !== 'undefined') {
  suppressExtensionErrors();
}
