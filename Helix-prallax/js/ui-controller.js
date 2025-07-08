// Chapter 7 - UI Controller
// Manages all UI interactions and updates

export class UIController {
    constructor(app) {
        this.app = app;
        this.elements = {};
        this.isTestRunning = false;
        
        this.initializeElements();
        this.setupEventListeners();
    }
    
    /**
     * Initialize UI element references
     */
    initializeElements() {
        // Info panel elements
        this.elements.currentRenderer = document.getElementById('current-renderer');
        this.elements.fps = document.getElementById('fps');
        this.elements.frameTime = document.getElementById('frame-time');
        this.elements.vertices = document.getElementById('vertices');
        this.elements.triangles = document.getElementById('triangles');
        this.elements.memory = document.getElementById('memory');
        
        // Control elements
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
        
        // Test control elements
        this.elements.startTest = document.getElementById('startTest');
        this.elements.exportData = document.getElementById('exportData');
        this.elements.clearData = document.getElementById('clearData');
        this.elements.testStatus = document.getElementById('test-status');
        
        // Verify all elements exist
        Object.entries(this.elements).forEach(([key, element]) => {
            if (!element) {
                console.warn(`⚠️ UI element not found: ${key}`);
            }
        });
    }
    
    /**
     * Setup event listeners for UI controls
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
        
        // Wireframe toggle
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
    }
    
    /**
     * Handle renderer change
     */
    async handleRendererChange(rendererType) {
        if (this.isTestRunning) {
            this.showError('Cannot change renderer during test');
            this.elements.rendererSelect.value = this.app.currentRenderer;
            return;
        }
        
        this.showMessage('Switching renderer...', 'info');
        
        try {
            await this.app.switchRenderer(rendererType);
            this.showMessage(`Switched to ${rendererType.toUpperCase()}`, 'success');
        } catch (error) {
            this.showError(`Failed to switch to ${rendererType}: ${error.message}`);
            this.elements.rendererSelect.value = this.app.currentRenderer;
        }
    }
    
    /**
     * Update parallax scale
     */
    updateParallaxScale(value) {
        if (this.elements.parallaxScaleValue) {
            this.elements.parallaxScaleValue.textContent = value.toFixed(2);
        }
        
        this.app.updateHelixParameters({ parallaxScale: value });
    }
    
    /**
     * Update min layers
     */
    updateMinLayers(value) {
        if (this.elements.minLayersValue) {
            this.elements.minLayersValue.textContent = value;
        }
        
        // Ensure min <= max
        const maxLayers = parseInt(this.elements.maxLayers.value);
        if (value > maxLayers) {
            this.elements.maxLayers.value = value;
            this.elements.maxLayersValue.textContent = value;
            this.app.updateHelixParameters({ minLayers: value, maxLayers: value });
        } else {
            this.app.updateHelixParameters({ minLayers: value });
        }
    }
    
    /**
     * Update max layers
     */
    updateMaxLayers(value) {
        if (this.elements.maxLayersValue) {
            this.elements.maxLayersValue.textContent = value;
        }
        
        // Ensure max >= min
        const minLayers = parseInt(this.elements.minLayers.value);
        if (value < minLayers) {
            this.elements.minLayers.value = value;
            this.elements.minLayersValue.textContent = value;
            this.app.updateHelixParameters({ minLayers: value, maxLayers: value });
        } else {
            this.app.updateHelixParameters({ maxLayers: value });
        }
    }
    
    /**
     * Update helix radius
     */
    updateHelixRadius(value) {
        if (this.elements.helixRadiusValue) {
            this.elements.helixRadiusValue.textContent = value.toFixed(1);
        }
        
        this.app.updateHelixParameters({ radius: value });
    }
    
    /**
     * Update helix height
     */
    updateHelixHeight(value) {
        if (this.elements.helixHeightValue) {
            this.elements.helixHeightValue.textContent = value.toFixed(1);
        }
        
        this.app.updateHelixParameters({ height: value });
    }
    
    /**
     * Update wireframe mode
     */
    updateWireframe(enabled) {
        this.app.updateHelixParameters({ wireframe: enabled });
    }
    
    /**
     * Handle start test button
     */
    async handleStartTest() {
        if (this.isTestRunning) {
            this.showError('Test already running');
            return;
        }
        
        this.isTestRunning = true;
        
        // Update UI
        this.elements.startTest.textContent = 'Testing... (30s)';
        this.elements.startTest.disabled = true;
        this.elements.rendererSelect.disabled = true;
        
        this.showTestStatus('Running 30-second performance test...', 'active');
        
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
            this.elements.startTest.textContent = 'Start Performance Test (30s)';
            this.elements.startTest.disabled = false;
            this.elements.rendererSelect.disabled = false;
        }
    }
    
    /**
     * Handle export data button
     */
    handleExportData() {
        try {
            this.app.exportTestData();
            this.showMessage('Data exported successfully', 'success');
        } catch (error) {
            this.showError('Failed to export data: ' + error.message);
        }
    }
    
    /**
     * Handle clear data button
     */
    handleClearData() {
        if (confirm('Are you sure you want to clear all test data?')) {
            this.app.clearTestData();
            this.showTestStatus('', '');
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
            this.elements.frameTime.textContent = metrics.frameTime || 0;
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
        
        const vertexCount = geometry.attributes.position ? geometry.attributes.position.count : 0;
        const triangleCount = geometry.index ? geometry.index.count / 3 : vertexCount / 3;
        
        if (this.elements.vertices) {
            this.elements.vertices.textContent = vertexCount.toLocaleString();
        }
        
        if (this.elements.triangles) {
            this.elements.triangles.textContent = Math.floor(triangleCount).toLocaleString();
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
        if (!this.elements.testStatus) return;
        
        this.elements.testStatus.textContent = message;
        this.elements.testStatus.className = type ? `active ${type}` : '';
        this.elements.testStatus.style.display = message ? 'block' : 'none';
    }
    
    /**
     * Show error message
     */
    showError(message) {
        console.error('❌', message);
        this.showTestStatus(message, 'error');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (this.elements.testStatus.textContent === message) {
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
                if (this.elements.testStatus.textContent === message) {
                    this.showTestStatus('', '');
                }
            }, 3000);
        }
    }
    
    /**
     * Set UI state (enabled/disabled)
     */
    setUIState(enabled) {
        const controls = [
            this.elements.rendererSelect,
            this.elements.parallaxScale,
            this.elements.minLayers,
            this.elements.maxLayers,
            this.elements.helixRadius,
            this.elements.helixHeight,
            this.elements.wireframe,
            this.elements.startTest,
            this.elements.exportData,
            this.elements.clearData
        ];
        
        controls.forEach(control => {
            if (control) {
                control.disabled = !enabled;
            }
        });
    }
    
    /**
     * Dispose of UI controller
     */
    dispose() {
        // Remove event listeners would be added here if we stored references
        // For now, just clear references
        this.elements = {};
        this.app = null;
        
        console.log('🧹 UI controller disposed');
    }
}