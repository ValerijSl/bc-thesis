// ui-controller.js
// Fixed UI Controller that works with your existing HTML elements

export class UIController {
    constructor(app) {
        this.app = app;
        this.elements = {};
        this.isTestRunning = false;
        
        // Wait for DOM to be ready, then initialize
        setTimeout(() => {
            this.initializeElements();
            this.setupEventListeners();
        }, 100);
    }
    
    /**
     * Initialize existing UI element references from your HTML
     */
    initializeElements() {
        // Info panel elements (from your existing HTML)
        this.elements.currentRenderer = document.getElementById('current-renderer');
        this.elements.fps = document.getElementById('fps');
        this.elements.frameTime = document.getElementById('frame-time');
        this.elements.vertices = document.getElementById('vertices');
        this.elements.triangles = document.getElementById('triangles');
        this.elements.memory = document.getElementById('memory');
        
        // Control elements (from your existing HTML)
        this.elements.rendererSelect = document.getElementById('renderer-select');
        this.elements.parallaxScale = document.getElementById('parallaxScale');
        this.elements.parallaxScaleValue = document.getElementById('parallaxScaleValue');
        this.elements.minLayers = document.getElementById('minLayers');
        this.elements.minLayersValue = document.getElementById('minLayersValue');
        this.elements.maxLayers = document.getElementById('maxLayers');
        this.elements.maxLayersValue = document.getElementById('maxLayersValue');
        this.elements.helixRadius = document.getElementById('helixRadius');
        this.elements.helixRadiusValue = document.getElementById('helixRadiusValue');
        this.elements.helixHeight = document.getElementById('helixHeight');
        this.elements.helixHeightValue = document.getElementById('helixHeightValue');
        this.elements.wireframe = document.getElementById('wireframe');
        
        // Test control elements (from your existing HTML)
        this.elements.startTest = document.getElementById('startTest');
        this.elements.exportData = document.getElementById('exportData');
        this.elements.clearData = document.getElementById('clearData');
        this.elements.testStatus = document.getElementById('test-status');
        
        // Check which elements exist
        const missingElements = [];
        Object.entries(this.elements).forEach(([key, element]) => {
            if (!element) {
                missingElements.push(key);
            }
        });
        
        if (missingElements.length > 0) {
            console.warn(`⚠️ UI elements not found: ${missingElements.join(', ')}`);
        } else {
            console.log('✅ All UI elements found and connected');
        }
        
        console.log('🎛️ UI Controller initialized with existing HTML elements');
    }
    
    /**
     * Setup event listeners for all controls
     */
    setupEventListeners() {
        // Renderer selection
        if (this.elements.rendererSelect) {
            this.elements.rendererSelect.addEventListener('change', (e) => {
                this.handleRendererChange(e.target.value);
            });
        }
        
        // Parallax controls
        if (this.elements.parallaxScale) {
            this.elements.parallaxScale.addEventListener('input', (e) => {
                this.updateParallaxScale(parseFloat(e.target.value));
            });
        }
        
        if (this.elements.minLayers) {
            this.elements.minLayers.addEventListener('input', (e) => {
                this.updateMinLayers(parseInt(e.target.value));
            });
        }
        
        if (this.elements.maxLayers) {
            this.elements.maxLayers.addEventListener('input', (e) => {
                this.updateMaxLayers(parseInt(e.target.value));
            });
        }
        
        // Geometry controls
        if (this.elements.helixRadius) {
            this.elements.helixRadius.addEventListener('input', (e) => {
                this.updateHelixRadius(parseFloat(e.target.value));
            });
        }
        
        if (this.elements.helixHeight) {
            this.elements.helixHeight.addEventListener('input', (e) => {
                this.updateHelixHeight(parseFloat(e.target.value));
            });
        }
        
        if (this.elements.wireframe) {
            this.elements.wireframe.addEventListener('change', (e) => {
                this.updateWireframe(e.target.checked);
            });
        }
        
        // Test controls
        if (this.elements.startTest) {
            this.elements.startTest.addEventListener('click', () => {
                this.handleStartTest();
            });
        }
        
        if (this.elements.exportData) {
            this.elements.exportData.addEventListener('click', () => {
                this.handleExportData();
            });
        }
        
        if (this.elements.clearData) {
            this.elements.clearData.addEventListener('click', () => {
                this.handleClearData();
            });
        }
        
        console.log('🎮 Event listeners connected to existing HTML controls');
    }
    
    /**
     * Handle renderer change
     */
    async handleRendererChange(rendererType) {
        if (this.isTestRunning) {
            this.showError('Cannot change renderer during test');
            if (this.elements.rendererSelect) {
                this.elements.rendererSelect.value = this.app.currentRenderer;
            }
            return;
        }
        
        this.showMessage('Switching renderer...', 'info');
        
        try {
            await this.app.switchRenderer(rendererType);
            this.showMessage(`Switched to ${rendererType.toUpperCase()}`, 'success');
        } catch (error) {
            this.showError(`Failed to switch to ${rendererType}: ${error.message}`);
            if (this.elements.rendererSelect) {
                this.elements.rendererSelect.value = this.app.currentRenderer;
            }
        }
    }
    
    /**
     * Update parallax scale
     */
    updateParallaxScale(value) {
        if (this.elements.parallaxScaleValue) {
            this.elements.parallaxScaleValue.textContent = value.toFixed(2);
        }
        
        if (this.app && this.app.updateHelixParameters) {
            this.app.updateHelixParameters({ parallaxScale: value });
        }
        
        console.log(`🔧 Parallax scale updated: ${value}`);
    }
    
    /**
     * Update min layers
     */
    updateMinLayers(value) {
        if (this.elements.minLayersValue) {
            this.elements.minLayersValue.textContent = value;
        }
        
        // Ensure min <= max
        if (this.elements.maxLayers) {
            const maxLayers = parseInt(this.elements.maxLayers.value);
            if (value > maxLayers) {
                this.elements.maxLayers.value = value;
                if (this.elements.maxLayersValue) {
                    this.elements.maxLayersValue.textContent = value;
                }
            }
        }
        
        if (this.app && this.app.updateHelixParameters) {
            this.app.updateHelixParameters({ minLayers: value });
        }
        
        console.log(`🔧 Min layers updated: ${value}`);
    }
    
    /**
     * Update max layers
     */
    updateMaxLayers(value) {
        if (this.elements.maxLayersValue) {
            this.elements.maxLayersValue.textContent = value;
        }
        
        // Ensure max >= min
        if (this.elements.minLayers) {
            const minLayers = parseInt(this.elements.minLayers.value);
            if (value < minLayers) {
                this.elements.minLayers.value = value;
                if (this.elements.minLayersValue) {
                    this.elements.minLayersValue.textContent = value;
                }
            }
        }
        
        if (this.app && this.app.updateHelixParameters) {
            this.app.updateHelixParameters({ maxLayers: value });
        }
        
        console.log(`🔧 Max layers updated: ${value}`);
    }
    
    /**
     * Update helix radius
     */
    updateHelixRadius(value) {
        if (this.elements.helixRadiusValue) {
            this.elements.helixRadiusValue.textContent = value.toFixed(1);
        }
        
        if (this.app && this.app.updateHelixParameters) {
            this.app.updateHelixParameters({ radius: value });
        }
        
        console.log(`🔧 Helix radius updated: ${value}`);
    }
    
    /**
     * Update helix height
     */
    updateHelixHeight(value) {
        if (this.elements.helixHeightValue) {
            this.elements.helixHeightValue.textContent = value.toFixed(1);
        }
        
        if (this.app && this.app.updateHelixParameters) {
            this.app.updateHelixParameters({ height: value });
        }
        
        console.log(`🔧 Helix height updated: ${value}`);
    }
    
    /**
     * Update wireframe mode
     */
    updateWireframe(enabled) {
        if (this.app && this.app.updateHelixParameters) {
            this.app.updateHelixParameters({ wireframe: enabled });
        }
        
        console.log(`🔧 Wireframe mode: ${enabled ? 'ON' : 'OFF'}`);
    }
    
    /**
     * Handle start test button
     */
    async handleStartTest() {
        if (this.isTestRunning) {
            this.showError('Test already running');
            return;
        }
        
        if (!this.app || !this.app.startPerformanceTest) {
            this.showError('Performance testing not available');
            return;
        }
        
        this.isTestRunning = true;
        
        // Update UI
        if (this.elements.startTest) {
            this.elements.startTest.textContent = 'Testing... (30s)';
            this.elements.startTest.disabled = true;
        }
        if (this.elements.rendererSelect) {
            this.elements.rendererSelect.disabled = true;
        }
        
        this.showTestStatus(`Running 30-second performance test with ${this.app.currentRenderer.toUpperCase()}...`, 'info');
        
        try {
            const results = await this.app.startPerformanceTest(30000);
            
            if (results) {
                this.showTestStatus(
                    `Test completed! Avg FPS: ${results.fps.avg.toFixed(1)}, Min: ${results.fps.min}, Max: ${results.fps.max}`,
                    'success'
                );
                
                console.log('📊 Test Results:', results);
            }
            
        } catch (error) {
            this.showError('Test failed: ' + error.message);
        } finally {
            // Reset UI
            this.isTestRunning = false;
            if (this.elements.startTest) {
                this.elements.startTest.textContent = 'Start Performance Test (30s)';
                this.elements.startTest.disabled = false;
            }
            if (this.elements.rendererSelect) {
                this.elements.rendererSelect.disabled = false;
            }
        }
    }
    
    /**
     * Handle export data button
     */
    handleExportData() {
        try {
            if (this.app && this.app.exportTestData) {
                this.app.exportTestData();
                this.showMessage('Data exported successfully', 'success');
            } else {
                this.showError('Export functionality not available');
            }
        } catch (error) {
            this.showError('Failed to export data: ' + error.message);
        }
    }
    
    /**
     * Handle clear data button
     */
    handleClearData() {
        if (confirm('Are you sure you want to clear all test data?')) {
            if (this.app && this.app.clearTestData) {
                this.app.clearTestData();
                this.showTestStatus('', '');
            }
        }
    }
    
    /**
     * Update renderer display
     */
    updateRendererDisplay(rendererType) {
        if (this.elements.currentRenderer) {
            this.elements.currentRenderer.textContent = rendererType.toUpperCase();
        }
        
        if (this.elements.rendererSelect) {
            this.elements.rendererSelect.value = rendererType;
        }
    }
    
    /**
     * Update performance display
     */
    updatePerformanceDisplay(metrics) {
        if (!metrics) return;
        
        if (this.elements.fps) {
            this.elements.fps.textContent = metrics.fps || 0;
        }
        
        if (this.elements.frameTime) {
            this.elements.frameTime.textContent = (metrics.frameTime || 0).toFixed(1);
        }
        
        if (this.elements.memory) {
            this.elements.memory.textContent = metrics.memoryUsage || 0;
        }
    }
    
    /**
     * Update geometry info display
     */
    updateGeometryInfo(geometry) {
        if (!geometry) return;
        
        try {
            const vertexCount = geometry.attributes.position ? geometry.attributes.position.count : 0;
            const triangleCount = geometry.index ? geometry.index.count / 3 : vertexCount / 3;
            
            if (this.elements.vertices) {
                this.elements.vertices.textContent = vertexCount.toLocaleString();
            }
            
            if (this.elements.triangles) {
                this.elements.triangles.textContent = Math.floor(triangleCount).toLocaleString();
            }
        } catch (error) {
            console.warn('Error updating geometry info:', error);
        }
    }
    
    /**
     * Get current helix parameters from UI
     */
    getHelixParameters() {
        return {
            parallaxScale: parseFloat(this.elements.parallaxScale?.value || 0.1),
            minLayers: parseInt(this.elements.minLayers?.value || 8),
            maxLayers: parseInt(this.elements.maxLayers?.value || 32),
            radius: parseFloat(this.elements.helixRadius?.value || 2),
            height: parseFloat(this.elements.helixHeight?.value || 5),
            wireframe: this.elements.wireframe?.checked || false
        };
    }
    
    /**
     * Show test status message
     */
    showTestStatus(message, type = '') {
        if (this.elements.testStatus) {
            this.elements.testStatus.textContent = message;
            this.elements.testStatus.style.display = message ? 'block' : 'none';
            
            // Set colors based on type
            if (type === 'error') {
                this.elements.testStatus.style.color = '#f44336';
                this.elements.testStatus.style.backgroundColor = 'rgba(244, 67, 54, 0.1)';
            } else if (type === 'success') {
                this.elements.testStatus.style.color = '#4CAF50';
                this.elements.testStatus.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
            } else {
                this.elements.testStatus.style.color = '#2196F3';
                this.elements.testStatus.style.backgroundColor = 'rgba(33, 150, 243, 0.1)';
            }
        }
    }
    
    /**
     * Show error message
     */
    showError(message) {
        console.error('❌', message);
        this.showTestStatus(message, 'error');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (this.elements.testStatus && this.elements.testStatus.textContent === message) {
                this.showTestStatus('', '');
            }
        }, 5000);
    }
    
    /**
     * Show success message
     */
    showMessage(message, type = 'info') {
        console.log('ℹ️', message);
        this.showTestStatus(message, type);
        
        // Auto-hide after 3 seconds for success messages
        if (type === 'success') {
            setTimeout(() => {
                if (this.elements.testStatus && this.elements.testStatus.textContent === message) {
                    this.showTestStatus('', '');
                }
            }, 3000);
        }
    }
    
    /**
     * Dispose of UI controller
     */
    dispose() {
        this.elements = {};
        this.app = null;
        
        console.log('🧹 UI controller disposed');
    }
}