import { useEffect } from 'react';

/**
 * ResizeObserver polyfill for better browser compatibility
 */
const setupResizeObserverPolyfill = () => {
  if (typeof window !== 'undefined' && !window.ResizeObserver) {
    // Simple polyfill for ResizeObserver
    window.ResizeObserver = class ResizeObserver {
      private callback: any;
      
      constructor(callback: any) {
        this.callback = callback;
      }
      
      observe() {
        // No-op for polyfill
      }
      
      unobserve() {
        // No-op for polyfill
      }
      
      disconnect() {
        // No-op for polyfill
      }
    } as any;
  }
};

/**
 * Enhanced ResizeObserver error suppression specifically for Ant Design
 */
const setupAntDesignResizeObserverFix = () => {
  if (typeof window === 'undefined') return;

  // Override ResizeObserver to prevent errors
  const OriginalResizeObserver = window.ResizeObserver;
  
  window.ResizeObserver = class SafeResizeObserver extends OriginalResizeObserver {
    constructor(callback: any) {
      super((entries: any, observer: any) => {
        try {
          callback(entries, observer);
        } catch (error: any) {
          // Silently ignore ResizeObserver errors
          if (error?.message?.includes?.('ResizeObserver')) {
            return;
          }
          throw error;
        }
      });
    }
  } as any;

  // Also override the global error handler to catch any remaining ResizeObserver errors
  const originalAddEventListener = window.addEventListener;
  window.addEventListener = function(type: string, listener: any, options?: any) {
    if (type === 'error') {
      const wrappedListener = (event: any) => {
        if (event.message && event.message.includes('ResizeObserver')) {
          return;
        }
        return listener(event);
      };
      return originalAddEventListener.call(this, type, wrappedListener, options);
    }
    return originalAddEventListener.call(this, type, listener, options);
  };
};

/**
 * Hook to suppress ResizeObserver errors in the console
 * This is a common issue with UI libraries that use ResizeObserver
 */
export const useResizeObserverFix = () => {
  useEffect(() => {
    // Setup polyfill first
    setupResizeObserverPolyfill();
    
    // Setup Ant Design specific fix
    setupAntDesignResizeObserverFix();
    
    const originalError = console.error;
    console.error = (...args) => {
      if (args[0]?.includes?.('ResizeObserver')) {
        return;
      }
      originalError.apply(console, args);
    };
    return () => {
      console.error = originalError;
    };
  }, []);
};

/**
 * Global function to suppress ResizeObserver errors
 * Call this once in your app's entry point
 */
export const suppressResizeObserverErrors = () => {
  // Setup polyfill first
  setupResizeObserverPolyfill();
  
  // Setup Ant Design specific fix
  setupAntDesignResizeObserverFix();
  
  const originalError = console.error;
  console.error = (...args) => {
    if (args[0]?.includes?.('ResizeObserver')) {
      return;
    }
    originalError.apply(console, args);
  };
};

/**
 * Enhanced error handler that also handles ResizeObserver errors
 */
export const setupGlobalErrorHandling = () => {
  // Setup polyfill
  setupResizeObserverPolyfill();
  
  // Setup Ant Design specific fix
  setupAntDesignResizeObserverFix();
  
  // Suppress ResizeObserver errors
  suppressResizeObserverErrors();
  
  // Handle unhandled promise rejections that might be related to ResizeObserver
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.message?.includes?.('ResizeObserver')) {
      event.preventDefault();
      return;
    }
  });
  
  // Additional error handling for Ant Design components
  window.addEventListener('error', (event) => {
    if (event.message?.includes?.('ResizeObserver')) {
      event.preventDefault();
      return false;
    }
  });
};

/**
 * Hook specifically for Ant Design Dropdown components
 * Use this in components that have Ant Design Dropdown menus
 */
export const useAntDesignDropdownFix = () => {
  useEffect(() => {
    // Setup all fixes
    setupResizeObserverPolyfill();
    setupAntDesignResizeObserverFix();
    
    // Additional fix for Ant Design Dropdown positioning
    const originalError = console.error;
    console.error = (...args) => {
      if (args[0]?.includes?.('ResizeObserver')) {
        return;
      }
      originalError.apply(console, args);
    };

    // Fix for Ant Design Dropdown positioning issues
    const fixDropdownPositioning = () => {
      const dropdowns = document.querySelectorAll('.ant-dropdown');
      dropdowns.forEach((dropdown: any) => {
        if (dropdown.style) {
          dropdown.style.position = 'fixed';
          dropdown.style.zIndex = '1050';
        }
      });
    };

    // Fix for Ant Design Menu positioning issues
    const fixMenuPositioning = () => {
      const menus = document.querySelectorAll('.ant-menu');
      menus.forEach((menu: any) => {
        if (menu.style) {
          menu.style.position = 'relative';
        }
      });
    };

    // Apply fixes immediately and on DOM changes
    fixDropdownPositioning();
    fixMenuPositioning();
    
    const observer = new MutationObserver(() => {
      fixDropdownPositioning();
      fixMenuPositioning();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Additional error prevention for Ant Design components
    const preventResizeObserverErrors = () => {
      const originalResizeObserver = window.ResizeObserver;
      window.ResizeObserver = class SafeResizeObserver extends originalResizeObserver {
        constructor(callback: any) {
          super((entries: any, observer: any) => {
            try {
              callback(entries, observer);
            } catch (error: any) {
              // Completely ignore ResizeObserver errors
              return;
            }
          });
        }
      } as any;
    };

    preventResizeObserverErrors();

    return () => {
      console.error = originalError;
      observer.disconnect();
    };
  }, []);
}; 