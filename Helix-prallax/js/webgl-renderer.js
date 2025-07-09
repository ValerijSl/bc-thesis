// Chapter 7 - WebGL Renderer
// Wrapper for Three.js WebGL renderer with performance monitoring

export class WebGLRenderer {
    constructor() {
        this.renderer = null;
        this.canvas = null;
        this.context = null;
        this.capabilities = null;
    }
    
    /**
     * Initialize WebGL renderer
     */
    async setup(width, height) {
        console.log('🎨 Setting up WebGL renderer...');
        
        try {
            // Test WebGL support first
            const testCanvas = document.createElement('canvas');
            const testContext = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
            
            if (!testContext) {
                throw new Error('WebGL not supported in this browser');
            }
            
            console.log('✅ WebGL context test successful');
            
            // Create renderer with WebGL context
            this.renderer = new THREE.WebGLRenderer({
                antialias: true,
                alpha: false,
                stencil: false,
                depth: true,
                powerPreference: "high-performance",
                preserveDrawingBuffer: false,
                failIfMajorPerformanceCaveat: false
            });
            
            // Get canvas and context
            this.canvas = this.renderer.domElement;
            this.context = this.renderer.getContext();
            
            if (!this.context) {
                throw new Error('Failed to get WebGL context from renderer');
            }
            
            // Configure renderer
            this.renderer.setSize(width, height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            
            // Enable shadows
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            
            // Set tone mapping
            this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
            this.renderer.toneMappingExposure = 1.0;
            
            // Output encoding
            this.renderer.outputEncoding = THREE.sRGBEncoding;
            
            // Get capabilities
            this.capabilities = this.getCapabilities();
            
            // Setup context loss handling
            this.setupContextLossHandling();
            
            console.log('✅ WebGL renderer initialized');
            console.log('📊 WebGL Capabilities:', this.capabilities);
            
        } catch (error) {
            console.error('❌ Failed to setup WebGL renderer:', error);
            throw error;
        }
    }
    
    /**
     * Render a scene with camera
     */
    render(scene, camera) {
        if (!this.renderer) {
            console.warn('⚠️ Renderer not initialized');
            return;
        }
        
        try {
            this.renderer.render(scene, camera);
        } catch (error) {
            console.error('❌ Render error:', error);
        }
    }
    
    /**
     * Set renderer size
     */
    setSize(width, height) {
        if (this.renderer) {
            this.renderer.setSize(width, height);
        }
    }
    
    /**
     * Get DOM element
     */
    getDomElement() {
        return this.renderer ? this.renderer.domElement : null;
    }
    
    /**
     * Get WebGL capabilities and extensions
     */
    getCapabilities() {
        if (!this.context) return null;
        
        const gl = this.context;
        
        try {
            return {
                // Renderer info
                renderer: gl.getParameter(gl.RENDERER) || 'Unknown',
                vendor: gl.getParameter(gl.VENDOR) || 'Unknown',
                version: gl.getParameter(gl.VERSION) || 'Unknown',
                shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION) || 'Unknown',
                
                // Limits
                maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE) || 0,
                maxCubeMapTextureSize: gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE) || 0,
                maxTextureImageUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS) || 0,
                maxVertexTextureImageUnits: gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) || 0,
                maxCombinedTextureImageUnits: gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS) || 0,
                maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS) || 0,
                maxVertexUniformVectors: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS) || 0,
                maxFragmentUniformVectors: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS) || 0,
                maxVaryingVectors: gl.getParameter(gl.MAX_VARYING_VECTORS) || 0,
                maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS) || [0, 0],
                
                // Extensions
                extensions: this.getSupportedExtensions(),
                
                // Features
                depthTexture: !!gl.getExtension('WEBGL_depth_texture'),
                textureFloat: !!gl.getExtension('OES_texture_float'),
                textureHalfFloat: !!gl.getExtension('OES_texture_half_float'),
                vertexArrayObject: !!gl.getExtension('OES_vertex_array_object'),
                instancedArrays: !!gl.getExtension('ANGLE_instanced_arrays'),
                
                // Memory info (if available)
                memoryInfo: this.getMemoryInfo()
            };
        } catch (error) {
            console.warn('Error getting WebGL capabilities:', error);
            return {
                renderer: 'Unknown',
                vendor: 'Unknown',
                version: 'Unknown',
                error: error.message
            };
        }
    }
    
    /**
     * Get supported WebGL extensions
     */
    getSupportedExtensions() {
        if (!this.context) return [];
        
        try {
            return this.context.getSupportedExtensions() || [];
        } catch (error) {
            console.warn('Error getting extensions:', error);
            return [];
        }
    }
    
    /**
     * Get memory information (if available)
     */
    getMemoryInfo() {
        if (!this.context) return null;
        
        try {
            const ext = this.context.getExtension('WEBGL_debug_renderer_info');
            if (ext) {
                return {
                    unmaskedRenderer: this.context.getParameter(ext.UNMASKED_RENDERER_WEBGL),
                    unmaskedVendor: this.context.getParameter(ext.UNMASKED_VENDOR_WEBGL)
                };
            }
        } catch (error) {
            console.warn('Error getting memory info:', error);
        }
        
        return null;
    }
    
    /**
     * Get current performance metrics
     */
    getPerformanceMetrics() {
        if (!this.renderer || !this.renderer.info) {
            return null;
        }
        
        const info = this.renderer.info;
        
        return {
            // Render statistics
            frame: info.render.frame || 0,
            calls: info.render.calls || 0,
            triangles: info.render.triangles || 0,
            points: info.render.points || 0,
            lines: info.render.lines || 0,
            
            // Memory statistics
            geometries: info.memory.geometries || 0,
            textures: info.memory.textures || 0,
            
            // Programs
            programs: info.programs ? info.programs.length : 0,
            
            // Capabilities
            maxTextures: this.capabilities ? this.capabilities.maxTextureImageUnits : 'unknown'
        };
    }
    
    /**
     * Reset performance counters
     */
    resetPerformanceCounters() {
        if (this.renderer && this.renderer.info) {
            // Reset render info
            this.renderer.info.reset();
        }
    }
    
    /**
     * Check for WebGL errors
     */
    checkForErrors() {
        if (!this.context) return null;
        
        try {
            const error = this.context.getError();
            if (error !== this.context.NO_ERROR) {
                let errorString = 'Unknown WebGL error';
                
                switch (error) {
                    case this.context.INVALID_ENUM:
                        errorString = 'INVALID_ENUM';
                        break;
                    case this.context.INVALID_VALUE:
                        errorString = 'INVALID_VALUE';
                        break;
                    case this.context.INVALID_OPERATION:
                        errorString = 'INVALID_OPERATION';
                        break;
                    case this.context.INVALID_FRAMEBUFFER_OPERATION:
                        errorString = 'INVALID_FRAMEBUFFER_OPERATION';
                        break;
                    case this.context.OUT_OF_MEMORY:
                        errorString = 'OUT_OF_MEMORY';
                        break;
                    case this.context.CONTEXT_LOST_WEBGL:
                        errorString = 'CONTEXT_LOST_WEBGL';
                        break;
                }
                
                console.error('🚨 WebGL Error:', errorString, error);
                return { error: errorString, code: error };
            }
        } catch (e) {
            console.warn('Error checking for WebGL errors:', e);
        }
        
        return null;
    }
    
    /**
     * Handle context lost
     */
    setupContextLossHandling() {
        if (!this.canvas) return;
        
        this.canvas.addEventListener('webglcontextlost', (event) => {
            console.warn('⚠️ WebGL context lost');
            event.preventDefault();
        });
        
        this.canvas.addEventListener('webglcontextrestored', () => {
            console.log('🔄 WebGL context restored, reinitializing...');
            // Note: This would require reinitializing the entire renderer
        });
    }
    
    /**
     * Get debug information
     */
    getDebugInfo() {
        return {
            type: 'WebGL',
            version: '1.0',
            capabilities: this.capabilities,
            performanceMetrics: this.getPerformanceMetrics(),
            errors: this.checkForErrors(),
            contextLost: this.canvas ? this.canvas.isContextLost() : false
        };
    }
    
    /**
     * Dispose of renderer resources
     */
    dispose() {
        console.log('🧹 Disposing WebGL renderer...');
        
        if (this.renderer) {
            // Dispose of renderer
            this.renderer.dispose();
            
            // Remove from DOM
            if (this.renderer.domElement && this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
            
            this.renderer = null;
        }
        
        this.canvas = null;
        this.context = null;
        this.capabilities = null;
        
        console.log('✅ WebGL renderer disposed');
    }
}