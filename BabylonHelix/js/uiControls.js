/**
 * UI Controls Handler
 * 
 * Manages all user interface controls and interactions for the Babylon.js helix application.
 * Handles sliders, buttons, checkboxes, and keyboard controls.
 * 
 * @author [Your Name]
 * @date [Current Date]
 * @version 1.0
 */

class UIControls {
    constructor(babylonApp) {
        this.app = babylonApp;
        this.controlCallbacks = new Map();
        this.keyboardHandlers = new Map();
        
        this.init();
    }

    /**
     * Initializes all UI controls
     */
    init() {
        console.log('🎛️ Initializing UI controls...');
        
        this.setupRendererControls();
        this.setupParallaxControls();
        this.setupGeometryControls();
        this.setupTestControls();
        this.setupKeyboardControls();
        
        console.log('✅ UI controls initialized');
    }

    /**
     * Sets up renderer selection controls
     */
    setupRendererControls() {
        const rendererSelect = document.getElementById('renderer-select');
        
        rendererSelect.addEventListener('change', (e) => {
            console.log(`🔄 Renderer changed to: ${e.target.value}`);
            this.app.switchRenderer(e.target.value);
        });
        
        // Check WebGPU availability and update UI
        this.updateWebGPUAvailability();
    }

    /**
     * Sets up parallax mapping controls
     */
    setupParallaxControls() {
        // Parallax scale slider
        this.setupSliderControl('parallaxScale', (value) => {
            this.app.materialParams.parallaxScale = value;
            this.app.updateMaterial();
        });
        
        // Min layers slider
        this.setupSliderControl('minLayers', (value) => {
            this.app.materialParams.minLayers = parseInt(value);
            this.app.updateMaterial();
        });
        
        // Max layers slider
        this.setupSliderControl('maxLayers', (value) => {
            this.app.materialParams.maxLayers = parseInt(value);
            this.app.updateMaterial();
        });
        
        // Parallax occlusion checkbox
        const parallaxOcclusion = document.getElementById('parallaxOcclusion');
        parallaxOcclusion.addEventListener('change', (e) => {
            this.app.materialParams.parallaxOcclusion = e.target.checked;
            this.app.updateMaterial();
            console.log(`🔧 Parallax occlusion: ${e.target.checked ? 'enabled' : 'disabled'}`);
        });
    }

    /**
     * Sets up geometry control sliders
     */
    setupGeometryControls() {
        // Helix radius slider
        this.setupSliderControl('helixRadius', (value) => {
            this.app.helixParams.radius = value;
            this.app.recreateHelix();
        });
        
        // Helix height slider
        this.setupSliderControl('helixHeight', (value) => {
            this.app.helixParams.height = value;
            this.app.recreateHelix();
        });
        
        // Helix turns slider
        this.setupSliderControl('helixTurns', (value) => {
            this.app.helixParams.turns = value;
            this.app.recreateHelix();
        });
        
        // Wireframe checkbox
        const wireframe = document.getElementById('wireframe');
        wireframe.addEventListener('change', (e) => {
            this.app.materialParams.wireframe = e.target.checked;
            this.app.updateMaterial();
            console.log(`🔧 Wireframe: ${e.target.checked ? 'enabled' : 'disabled'}`);
        });
    }

    /**
     * Sets up performance test controls
     */
    setupTestControls() {
        // Start test button
        document.getElementById('startTest').addEventListener('click', () => {
            this.app.performanceMonitor.startTest();
        });
        
        // Export data button
        document.getElementById('exportData').addEventListener('click', () => {
            this.app.performanceMonitor.exportTestData();
        });
        
        // Clear data button
        document.getElementById('clearData').addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all test data?')) {
                this.app.performanceMonitor.clearTestData();
            }
        });
    }

    /**
     * Sets up keyboard controls
     */
    setupKeyboardControls() {
        const keyboardHandler = (event) => {
            // Prevent default for handled keys
            const handledKeys = ['Space', 'KeyR', 'KeyW', 'KeyH'];
            if (handledKeys.includes(event.code)) {
                event.preventDefault();
            }
            
            switch(event.code) {
                case 'Space':
                    this.toggleAnimation();
                    break;
                case 'KeyR':
                    this.app.recreateHelix();
                    console.log('🔄 Helix recreated via keyboard');
                    break;
                case 'KeyW':
                    this.toggleWireframe();
                    break;
                case 'KeyH':
                    this.showKeyboardHelp();
                    break;
            }
        };
        
        window.addEventListener('keydown', keyboardHandler);
        this.keyboardHandlers.set('main', keyboardHandler);
    }

    /**
     * Sets up a slider control with live updates
     * @param {string} id - Slider element ID
     * @param {Function} callback - Callback function for value changes
     */
    setupSliderControl(id, callback) {
        const slider = document.getElementById(id);
        const valueSpan = document.getElementById(id + 'Value');
        
        if (!slider || !valueSpan) {
            console.warn(`⚠️ Slider control not found: ${id}`);
            return;
        }
        
        // Add debouncing for better performance
        let debounceTimer;
        
        slider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            
            // Update display immediately
            const decimals = id.includes('Layers') ? 0 : 1;
            valueSpan.textContent = value.toFixed(decimals);
            
            // Debounce the callback for expensive operations
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                callback(value);
            }, 100); // 100ms debounce
        });
        
        // Store callback for potential cleanup
        this.controlCallbacks.set(id, callback);
    }

    /**
     * Toggles animation pause/resume
     */
    toggleAnimation() {
        this.app.isPaused = !this.app.isPaused;
        console.log(`🎬 Animation ${this.app.isPaused ? 'paused' : 'resumed'}`);
        
        // Could add visual feedback here
        this.showTemporaryMessage(
            `Animation ${this.app.isPaused ? 'paused' : 'resumed'}`,
            'info'
        );
    }

    /**
     * Toggles wireframe mode
     */
    toggleWireframe() {
        const wireframeCheckbox = document.getElementById('wireframe');
        wireframeCheckbox.checked = !wireframeCheckbox.checked;
        this.app.materialParams.wireframe = wireframeCheckbox.checked;
        this.app.updateMaterial();
        
        console.log(`🔧 Wireframe toggled: ${wireframeCheckbox.checked ? 'on' : 'off'}`);
    }

    /**
     * Shows keyboard help overlay
     */
    showKeyboardHelp() {
        const helpText = `
Keyboard Controls:
• Space: Pause/Resume animation
• R: Recreate helix geometry
• W: Toggle wireframe mode
• H: Show this help

Mouse Controls:
• Left click + drag: Orbit camera
• Right click + drag: Pan camera
• Mouse wheel: Zoom in/out
        `;
        
        alert(helpText.trim());
    }

    /**
     * Shows a temporary message
     * @param {string} message - Message to display
     * @param {string} type - Message type
     */
    showTemporaryMessage(message, type = 'info') {
        // You could implement a temporary message system here
        // For now, just log to console
        console.log(`💬 ${message}`);
    }

    /**
     * Updates WebGPU availability in the renderer dropdown
     */
    async updateWebGPUAvailability() {
        try {
            const rendererSelect = document.getElementById('renderer-select');
            const webgpuOption = rendererSelect.querySelector('option[value="webgpu"]');
            
            if (!webgpuOption) return;
            
            // Check WebGPU support
            const webgpuSupported = await this.checkWebGPUSupport();
            
            if (!webgpuSupported.supported) {
                webgpuOption.disabled = true;
                webgpuOption.textContent = 'WebGPU (Not Available)';
                console.log(`⚠️ WebGPU not available: ${webgpuSupported.reason}`);
            } else {
                webgpuOption.disabled = false;
                webgpuOption.textContent = 'WebGPU';
                console.log('✅ WebGPU available');
            }
        } catch (error) {
            console.warn('⚠️ Error checking WebGPU availability:', error);
        }
    }

    /**
     * Checks WebGPU support
     * @returns {Promise<Object>} Support status and reason
     */
    async checkWebGPUSupport() {
        try {
            if (!navigator.gpu) {
                return { supported: false, reason: 'navigator.gpu not available' };
            }
            
            const adapter = await navigator.gpu.requestAdapter();
            if (!adapter) {
                return { supported: false, reason: 'No WebGPU adapter available' };
            }
            
            return { supported: true, reason: 'WebGPU fully supported' };
            
        } catch (error) {
            return { supported: false, reason: error.message };
        }
    }

    /**
     * Updates control values from application state
     * @param {Object} params - Parameter object to sync
     */
    syncControlsWithState(params) {
        // Update slider values
        Object.keys(params).forEach(key => {
            const slider = document.getElementById(key);
            const valueSpan = document.getElementById(key + 'Value');
            
            if (slider && valueSpan) {
                slider.value = params[key];
                const decimals = key.includes('Layers') ? 0 : 1;
                valueSpan.textContent = params[key].toFixed(decimals);
            }
        });
        
        // Update checkboxes
        const wireframeCheckbox = document.getElementById('wireframe');
        if (wireframeCheckbox && params.wireframe !== undefined) {
            wireframeCheckbox.checked = params.wireframe;
        }
        
        const parallaxOcclusionCheckbox = document.getElementById('parallaxOcclusion');
        if (parallaxOcclusionCheckbox && params.parallaxOcclusion !== undefined) {
            parallaxOcclusionCheckbox.checked = params.parallaxOcclusion;
        }
    }

    /**
     * Cleanup method for removing event listeners
     */
    cleanup() {
        console.log('🧹 Cleaning up UI controls...');
        
        // Remove keyboard handlers
        this.keyboardHandlers.forEach((handler, key) => {
            window.removeEventListener('keydown', handler);
        });
        this.keyboardHandlers.clear();
        
        // Clear callbacks
        this.controlCallbacks.clear();
        
        console.log('✅ UI controls cleaned up');
    }
}

// Export for use in other modules
window.UIControls = UIControls;