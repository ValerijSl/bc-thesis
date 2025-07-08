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
            // Create renderer with WebGL context
            this.renderer = new THREE.WebGLRenderer({
                antialias: true,
                alpha: false,
                stencil: false,
                depth: true,
                powerPreference: "high-performance",
                preserveDrawingBuffer: false
            });
            
            // Get canvas and context
            this.canvas = this.renderer.domElement;
            this.context = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
            
            if (!this.context) {
                throw new Error('WebGL not supported');
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
        
        return {
            // Renderer info
            renderer: gl.getParameter(gl.RENDERER),
            vendor: gl.getParameter(gl.VENDOR),
            version: gl.getParameter(gl.VERSION),
            shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
            
            // Limits
            maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
            maxCubeMapTextureSize: gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE),
            maxTextureImageUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
            maxVertexTextureImageUnits: gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS),
            maxCombinedTextureImageUnits: gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS),
            maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
            maxVertexUniformVectors: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
            maxFragmentUniformVectors: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
            maxVaryingVectors: gl.getParameter(gl.MAX_VARYING_VECTORS),
            maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
            
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
    }
    
    /**
     * Get supported WebGL extensions
     */
    getSupportedExtensions() {
        if (!this.context) return [];
        
        return this.context.getSupportedExtensions() || [];
    }
    
    /**
     * Get memory information (if available)
     */
    getMemoryInfo() {
        if (!this.context) return null;
        
        const ext = this.context.getExtension('WEBGL_debug_renderer_info');
        if (ext) {
            return {
                unmaskedRenderer: this.context.getParameter(ext.UNMASKED_RENDERER_WEBGL),
                unmaskedVendor: this.context.getParameter(ext.UNMASKED_VENDOR_WEBGL)
            };
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
            frame: info.render.frame,
            calls: info.render.calls,
            triangles: info.render.triangles,
            points: info.render.points,
            lines: info.render.lines,
            
            // Memory statistics
            geometries: info.memory.geometries,
            textures: info.memory.textures,
            
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