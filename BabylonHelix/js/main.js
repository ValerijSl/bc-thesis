/**
 * Main Application Entry Point
 * 
 * Initializes and manages the Babylon.js Helix Parallax Mapping application.
 * Handles application lifecycle, error handling, and cleanup.
 * 
 * @author [Your Name]
 * @date [Current Date]
 * @version 1.0
 */

// Application instance
let app = null;

/**
 * Initialize the application when DOM is ready
 */
async function initializeApplication() {
    console.log('🌟 DOM loaded, starting Babylon.js Helix App...');
    
    try {
        // Show loading state
        showLoadingState(true);
        
        // Create and initialize application
        app = new BabylonHelixApp();
        await app.init();
        
        // Hide loading state
        showLoadingState(false);
        
        console.log('🎉 Application initialized successfully');
        
    } catch (error) {
        console.error('💥 Fatal error during initialization:', error);
        
        // Hide loading state
        showLoadingState(false);
        
        // Show error to user
        showFatalError(error);
    }
}

/**
 * Show/hide loading state
 * @param {boolean} show - Whether to show loading state
 */
function showLoadingState(show) {
    const canvas = document.getElementById('renderCanvas');
    const controls = document.getElementById('controls');
    const info = document.getElementById('info');
    
    if (show) {
        // Add loading class
        document.body.classList.add('loading');
        
        // Show loading message
        canvas.style.background = '#1a1a1a url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgIDxnIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCIgc3Ryb2tlPSIjNENBRjUwIiBzdHJva2Utd2lkdGg9IjIiPgogICAgICAgIDxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjE4Ij4KICAgICAgICAgICAgPGFuaW1hdGUgYXR0cmlidXRlTmFtZT0icjogYmVnaW49IjBzIiBkdXI9IjJzIiB2YWx1ZXM9IjE4OzE4OzE4IiByZXBlYXRDb3VudD0iaW5kZWZpbml0ZSIvPgogICAgICAgIDwvY2lyY2xlPgogICAgPC9nPgo8L3N2Zz4=") center no-repeat';
        
        // Update info panel
        if (info) {
            info.style.opacity = '0.5';
        }
        
        // Update controls panel
        if (controls) {
            controls.style.opacity = '0.5';
        }
        
    } else {
        // Remove loading class
        document.body.classList.remove('loading');
        
        // Reset canvas background
        canvas.style.background = '';
        
        // Reset panel opacity
        if (info) {
            info.style.opacity = '1';
        }
        
        if (controls) {
            controls.style.opacity = '1';
        }
    }
}

/**
 * Show fatal error to user
 * @param {Error} error - The error that occurred
 */
function showFatalError(error) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(244, 67, 54, 0.95);
        color: white;
        padding: 30px;
        border-radius: 12px;
        z-index: 10000;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        max-width: 500px;
        text-align: center;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(10px);
    `;
    
    errorDiv.innerHTML = `
        <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
        <h2 style="margin: 0 0 15px 0; font-size: 24px;">Application Failed to Initialize</h2>
        <p style="margin: 0 0 20px 0; font-size: 16px; opacity: 0.9;">
            ${error.message || 'An unknown error occurred'}
        </p>
        <div style="margin: 20px 0; padding: 15px; background: rgba(0, 0, 0, 0.3); border-radius: 8px; font-family: monospace; font-size: 14px; text-align: left;">
            <strong>Technical Details:</strong><br>
            ${error.stack ? error.stack.substring(0, 300) + '...' : 'No stack trace available'}
        </div>
        <button onclick="location.reload()" style="
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            margin-right: 10px;
            transition: all 0.3s ease;
        " onmouseover="this.style.background='rgba(255, 255, 255, 0.3)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.2)'">
            🔄 Reload Page
        </button>
        <button onclick="this.parentElement.remove()" style="
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.3s ease;
        " onmouseover="this.style.background='rgba(255, 255, 255, 0.2)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.1)'">
            ❌ Close
        </button>
        <p style="margin: 20px 0 0 0; font-size: 12px; opacity: 0.7;">
            Check the browser console for more detailed error information
        </p>
    `;
    
    document.body.appendChild(errorDiv);
    
    // Auto-remove after 30 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 30000);
}

/**
 * Handle application cleanup before page unload
 */
function cleanupApplication() {
    console.log('🧹 Cleaning up application...');
    
    if (app) {
        app.dispose();
        app = null;
    }
    
    console.log('✅ Application cleanup complete');
}

/**
 * Handle visibility changes (tab switching)
 */
function handleVisibilityChange() {
    if (app && app.performanceMonitor) {
        if (document.hidden) {
            console.log('📱 Tab hidden, pausing performance monitoring');
            // Could pause monitoring here if needed
        } else {
            console.log('📱 Tab visible, resuming performance monitoring');
            // Could resume monitoring here if needed
        }
    }
}

/**
 * Handle browser back/forward navigation
 */
function handlePopState(event) {
    console.log('🔄 Navigation detected');
    // Could handle state restoration here if needed
}

/**
 * Setup error handling
 */
function setupErrorHandling() {
    // Global error handler
    window.addEventListener('error', (event) => {
        console.error('🚨 Global error:', event.error);
        
        // Don't show error overlay for script loading errors
        if (event.filename && event.filename.includes('.js')) {
            console.error('📜 Script loading error:', event.filename);
        }
    });
    
    // Global unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
        console.error('🚨 Unhandled promise rejection:', event.reason);
        
        // Prevent default browser behavior
        event.preventDefault();
    });
}

/**
 * Setup performance monitoring
 */
function setupPerformanceMonitoring() {
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
        try {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.duration > 50) { // Tasks longer than 50ms
                        console.warn(`⚠️ Long task detected: ${entry.duration.toFixed(2)}ms`);
                    }
                }
            });
            
            observer.observe({ entryTypes: ['longtask'] });
        } catch (error) {
            console.warn('Performance monitoring not available:', error);
        }
    }
    
    // Monitor memory usage
    if (window.performance && window.performance.memory) {
        setInterval(() => {
            const memory = window.performance.memory;
            const used = Math.round(memory.usedJSHeapSize / 1024 / 1024);
            const total = Math.round(memory.totalJSHeapSize / 1024 / 1024);
            
            // Warn if memory usage is high
            if (used > 100) {
                console.warn(`⚠️ High memory usage: ${used}MB / ${total}MB`);
            }
        }, 10000); // Check every 10 seconds
    }
}

/**
 * Check system requirements
 */
function checkSystemRequirements() {
    const requirements = {
        webgl: !!window.WebGLRenderingContext,
        webgl2: !!window.WebGL2RenderingContext,
        webgpu: !!navigator.gpu,
        worker: !!window.Worker,
        blob: !!window.Blob,
        arraybuffer: !!window.ArrayBuffer
    };
    
    console.log('🔍 System requirements check:', requirements);
    
    // Check for critical requirements
    if (!requirements.webgl) {
        throw new Error('WebGL is not supported in this browser');
    }
    
    if (!requirements.blob || !requirements.arraybuffer) {
        throw new Error('Required browser features are not available');
    }
    
    // Log WebGPU availability
    if (requirements.webgpu) {
        console.log('✅ WebGPU is available');
    } else {
        console.log('⚠️ WebGPU is not available, falling back to WebGL');
    }
    
    return requirements;
}

// Event listeners
document.addEventListener('DOMContentLoaded', initializeApplication);
window.addEventListener('beforeunload', cleanupApplication);
document.addEventListener('visibilitychange', handleVisibilityChange);
window.addEventListener('popstate', handlePopState);

// Initialize error handling and performance monitoring
setupErrorHandling();
setupPerformanceMonitoring();

// Check system requirements early
try {
    checkSystemRequirements();
} catch (error) {
    console.error('❌ System requirements check failed:', error);
    document.addEventListener('DOMContentLoaded', () => {
        showFatalError(error);
    });
}

// Export for debugging
window.app = app;

console.log('📋 Main.js loaded - Application ready to initialize');