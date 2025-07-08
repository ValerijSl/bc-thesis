// Chapter 7 - WebGL2 Renderer
// Wrapper for Three.js WebGL2 renderer with enhanced features

export class WebGL2Renderer {
    constructor() {
        this.renderer = null;
        this.canvas = null;
        this.context = null;
        this.capabilities = null;
    }
    
    /**
     * Initialize WebGL2 renderer
     */
    async setup(width, height) {
        console.log('🎨 Setting up WebGL2 renderer...');
        
        try {
            // Check WebGL2 support
            const testCanvas = document.createElement('canvas');
            const testContext = testCanvas.getContext('webgl2');
            
            if (!testContext) {
                throw new Error('WebGL2 not supported');
            }
            
            // Create renderer with WebGL2 context
            this.renderer = new THREE.WebGLRenderer({
                canvas: testCanvas,
                context: testContext,
                antialias: true,
                alpha: false,
                stencil: false,
                depth: true,
                powerPreference: "high-performance",
                preserveDrawingBuffer: false
            });
            
            // Get canvas and context
            this.canvas = this.renderer.domElement;
            this.context = testContext;
            
            // Configure renderer
            this.renderer.setSize(width, height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            
            // Enable shadows with better quality
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            
            // Set tone mapping
            this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
            this.renderer.toneMappingExposure = 1.0;
            
            // Output encoding
            this.renderer.outputEncoding = THREE.sRGBEncoding;
            
            // Enable WebGL2 specific features
            this.enableWebGL2Features();
            
            // Get capabilities
            this.capabilities = this.getCapabilities();
            
            console.log('✅ WebGL2 renderer initialized');
            console.log('📊 WebGL2 Capabilities:', this.capabilities);
            
        } catch (error) {
            console.error('❌ Failed to setup WebGL2 renderer:', error);
            throw error;
        }
    }
    
    /**
     * Enable WebGL2 specific features
     */
    enableWebGL2Features() {
        if (!this.context) return;
        
        const gl = this.context;
        
        // Enable multisampling if available
        if (gl.getExtension('EXT_color_buffer_float')) {
            console.log('✅ EXT_color_buffer_float enabled');
        }
        
        // Enable texture compression if available
        if (gl.getExtension('WEBGL_compressed_texture_s3tc')) {
            console.log('✅ S3TC texture compression enabled');
        }
        
        if (gl.getExtension('WEBGL_compressed_texture_etc')) {
            console.log('✅ ETC texture compression enabled');
        }
        
        // Enable debug renderer info if available
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
            console.log('✅ Debug renderer info enabled');
        }
        
        // Enable lose context extension for testing
        const loseContext = gl.getExtension('WEBGL_lose_context');
        if (loseContext) {
            console.log('✅ Lose context extension available');
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
     * Get WebGL2 capabilities and extensions
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
            
            // Limits (WebGL2 specific)
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
            
            // WebGL2 specific limits
            max3DTextureSize: gl.getParameter(gl.MAX_3D_TEXTURE_SIZE),
            maxArrayTextureLayers: gl.getParameter(gl.MAX_ARRAY_TEXTURE_LAYERS),
            maxColorAttachments: gl.getParameter(gl.MAX_COLOR_ATTACHMENTS),
            maxDrawBuffers: gl.getParameter(gl.MAX_DRAW_BUFFERS),
            maxElementIndex: gl.getParameter(gl.MAX_ELEMENT_INDEX),
            maxElementsIndices: gl.getParameter(gl.MAX_ELEMENTS_INDICES),
            maxElementsVertices: gl.getParameter(gl.MAX_ELEMENTS_VERTICES),
            maxFragmentInputComponents: gl.getParameter(gl.MAX_FRAGMENT_INPUT_COMPONENTS),
            maxFragmentUniformComponents: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_COMPONENTS),
            maxFragmentUniformBlocks: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_BLOCKS),
            maxProgramTexelOffset: gl.getParameter(gl.MAX_PROGRAM_TEXEL_OFFSET),
            maxSamples: gl.getParameter(gl.MAX_SAMPLES),
            maxServerWaitTimeout: gl.getParameter(gl.MAX_SERVER_WAIT_TIMEOUT),
            maxTextureImageUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
            maxTextureLodBias: gl.getParameter(gl.MAX_TEXTURE_LOD_BIAS),
            maxTransformFeedbackInterleavedComponents: gl.getParameter(gl.MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS),
            maxTransformFeedbackSeparateAttribs: gl.getParameter(gl.MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS),
            maxTransformFeedbackSeparateComponents: gl.getParameter(gl.MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS),
            maxUniformBlockSize: gl.getParameter(gl.MAX_UNIFORM_BLOCK_SIZE),
            maxUniformBufferBindings: gl.getParameter(gl.MAX_UNIFORM_BUFFER_BINDINGS),
            maxVaryingComponents: gl.getParameter(gl.MAX_VARYING_COMPONENTS),
            maxVertexOutputComponents: gl.getParameter(gl.MAX_VERTEX_OUTPUT_COMPONENTS),
            maxVertexUniformComponents: gl.getParameter(gl.MAX_VERTEX_UNIFORM_COMPONENTS),
            maxVertexUniformBlocks: gl.getParameter(gl.MAX_VERTEX_UNIFORM_BLOCKS),
            minProgramTexelOffset: gl.getParameter(gl.MIN_PROGRAM_TEXEL_OFFSET),
            
            // Extensions
            extensions: this.getSupportedExtensions(),
            
            // WebGL2 Features
            transformFeedback: true,
            uniformBufferObjects: true,
            vertexArrayObjects: true,
            multipleRenderTargets: true,
            texture3D: true,
            textureArray: true,
            integerTextures: true,
            instancing: true,
            
            // Memory info (if available)
            memoryInfo: this.getMemoryInfo()
        };
    }
    
    /**
     * Get supported WebGL2 extensions
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
            
            // WebGL2 specific metrics
            transformFeedbackUsage: this.getTransformFeedbackUsage(),
            uniformBufferUsage: this.getUniformBufferUsage(),
            
            // Capabilities
            maxTextures: this.capabilities ? this.capabilities.maxTextureImageUnits : 'unknown'
        };
    }
    
    /**
     * Get transform feedback usage (WebGL2 specific)
     */
    getTransformFeedbackUsage() {
        // This would require tracking transform feedback objects
        // For now, return basic info
        return {
            activeTransformFeedbacks: 0,
            maxTransformFeedbackBuffers: this.capabilities ? this.capabilities.maxTransformFeedbackSeparateAttribs : 0
        };
    }
    
    /**
     * Get uniform buffer usage (WebGL2 specific)
     */
    getUniformBufferUsage() {
        // This would require tracking UBO usage
        // For now, return basic info
        return {
            activeUniformBuffers: 0,
            maxUniformBufferBindings: this.capabilities ? this.capabilities.maxUniformBufferBindings : 0
        };
    }
    
    /**
     * Reset performance counters
     */
    resetPerformanceCounters() {
        if (this.renderer && this.renderer.info) {
            this.renderer.info.reset();
        }
    }
    
    /**
     * Check for WebGL2 errors
     */
    checkForErrors() {
        if (!this.context) return null;
        
        const error = this.context.getError();
        if (error !== this.context.NO_ERROR) {
            let errorString = 'Unknown WebGL2 error';
            
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
            
            console.error('🚨 WebGL2 Error:', errorString, error);
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
            console.warn('⚠️ WebGL2 context lost');
            event.preventDefault();
        });
        
        this.canvas.addEventListener('webglcontextrestored', () => {
            console.log('🔄 WebGL2 context restored, reinitializing...');
        });
    }
    
    /**
     * Get debug information
     */
    getDebugInfo() {
        return {
            type: 'WebGL2',
            version: '2.0',
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
        console.log('🧹 Disposing WebGL2 renderer...');
        
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
        
        console.log('✅ WebGL2 renderer disposed');
    }
}