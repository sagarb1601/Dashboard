import React from 'react';
import ReactDOM from 'react-dom/client';
import 'antd/dist/antd.css';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { setupGlobalErrorHandling } from './utils/resizeObserverFix';

// TEMPORARILY DISABLED - Selective ResizeObserver fix - allow dropdowns to work
/*
if (typeof window !== 'undefined') {
  const OriginalResizeObserver = window.ResizeObserver;
  window.ResizeObserver = class SafeResizeObserver extends OriginalResizeObserver {
    constructor(callback: any) {
      super((entries: any, observer: any) => {
        try {
          // Allow the callback to execute normally for dropdown positioning
          callback(entries, observer);
        } catch (error: any) {
          // Only suppress actual ResizeObserver loop errors
          if (error.message && error.message.includes('ResizeObserver loop')) {
            return;
          }
          // Re-throw other errors
          throw error;
        }
      });
    }
  } as any;

  // Only suppress ResizeObserver loop errors in console
  const originalError = console.error;
  console.error = (...args) => {
    if (args[0]?.includes?.('ResizeObserver loop')) {
      return;
    }
    originalError.apply(console, args);
  };

  // Ensure MUI menus can be positioned correctly
  const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = function() {
    const rect = originalGetBoundingClientRect.call(this);
    // Ensure MUI menu positioning works
    if (this.classList && this.classList.contains('MuiMenu-root')) {
      // Force reflow to ensure proper positioning
      void (this as HTMLElement).offsetHeight;
    }
    return rect;
  };
}
*/

// Setup global error handling including ResizeObserver fixes
setupGlobalErrorHandling();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
