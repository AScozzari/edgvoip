// Advanced Chrome Extension Blocker
(function() {
  'use strict';
  
  console.log('🛡️ Advanced extension blocker loading...');
  
  // List of problematic extension IDs and patterns
  const blockedExtensions = [
    'pejdijmoenmkgeppbflobdenhhabjlaj',
    'chrome-extension://',
    'completion_list.html',
    'utils.js',
    'extensionState.js',
    'heuristicsRedefinitions.js'
  ];
  
  // Function to check if a message/URL should be blocked
  function shouldBlock(text) {
    if (!text) return false;
    const str = text.toString().toLowerCase();
    return blockedExtensions.some(pattern => str.includes(pattern.toLowerCase()));
  }
  
  // Override console methods more aggressively
  const originalConsole = {
    error: console.error,
    warn: console.warn,
    log: console.log,
    info: console.info,
    debug: console.debug,
    trace: console.trace
  };
  
  Object.keys(originalConsole).forEach(method => {
    console[method] = function(...args) {
      const message = args.join(' ');
      if (!shouldBlock(message)) {
        originalConsole[method].apply(console, args);
      }
    };
  });
  
  // Block all network requests to extensions
  if (window.fetch) {
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const url = args[0]?.toString() || '';
      if (shouldBlock(url)) {
        console.log('🚫 Blocked fetch request to extension:', url);
        return Promise.reject(new Error('Extension request blocked'));
      }
      return originalFetch.apply(this, args);
    };
  }
  
  // Block XMLHttpRequest to extensions
  if (window.XMLHttpRequest) {
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      if (shouldBlock(url)) {
        console.log('🚫 Blocked XHR request to extension:', url);
        throw new Error('Extension request blocked');
      }
      return originalXHROpen.call(this, method, url, ...args);
    };
  }
  
  // Block all error events from extensions
  window.addEventListener('error', function(event) {
    const message = event.message || '';
    const filename = event.filename || '';
    const source = event.source || '';
    
    if (shouldBlock(message) || shouldBlock(filename) || shouldBlock(source)) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }, true);
  
  // Block unhandled promise rejections from extensions
  window.addEventListener('unhandledrejection', function(event) {
    const reason = event.reason?.toString() || '';
    if (shouldBlock(reason)) {
      event.preventDefault();
      return false;
    }
  });
  
  // Block resource loading errors
  window.addEventListener('error', function(event) {
    const target = event.target;
    if (target && (target.src || target.href)) {
      const url = (target.src || target.href).toString();
      if (shouldBlock(url)) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    }
  }, true);
  
  // Block CSP violations from extensions
  document.addEventListener('securitypolicyviolation', function(event) {
    if (shouldBlock(event.violatedDirective) || shouldBlock(event.blockedURI)) {
      event.preventDefault();
      return false;
    }
  });
  
  console.log('🛡️ Advanced extension blocker loaded successfully');
  
})();