/**
 * Advanced WebGL Performance Benchmark
 * Designed for RTX 4090 and high-end hardware testing
 * Author: Bachelor Thesis Project
 */

class AdvancedWebGLBenchmark {
    constructor(canvasId = 'canvas') {
        this.canvas = document.getElementById(canvasId);
        this.gl = null;
        this.programs = {};
        this.buffers = {};
        this.textures = {};
        this.objects = [];
        
        // Performance tracking
        this.stats = {
            fps: 0,
            frameTime: 0,
            triangles: 0,
            vertices: 0,
            drawCalls: 0,
            gpuMemory: 0,
            textureMemory: 0
        };
        
        // Settings
        this.settings = {
            objectCount: 0,
            shaderComplexity: 'medium',
            geometryDetail: 64,
            textureResolution: 1024,
            useInstancing: false,
            useComplexShaders: false,
            useHDTextures: false,
            enableShadows: true
        };
        
        // Animation state
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.frameTimes = [];
        this.isRunning = false;
        
        // Camera state
        this.camera = {
            position: [0, 5, 10],
            rotation: [0, 0, 0],
            fov: 75,
            autoRotate: true
        };
        
        this.init();
    }
    
    /**
     * Render using instanced rendering for better performance
     */
    renderInstanced(time) {
        const gl = this.gl;
        const program = this.programs.instanced;
        
        if (!program || !this.instancedArrays) return;
        
        gl.useProgram(program);
        
        // Set global uniforms
        this.setGlobalUniforms(program, time);
        
        // Create instance data
        const instanceData = this.createInstanceData();
        
        // Create instance buffers
        const instanceBuffers = this.createInstanceBuffers(instanceData);
        
        // Bind base geometry
        const geometry = this.cubeGeometry; // Use simple geometry for instancing
        this.bindGeometryForInstancing(program, geometry, instanceBuffers);
        
        // Draw instanced
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geometry.indices);
        this.instancedArrays.drawElementsInstancedANGLE(
            gl.TRIANGLES,
            geometry.indexCount,
            gl.UNSIGNED_INT,
            0,
            this.objects.length
        );
        
        // Clean up instance buffers
        Object.values(instanceBuffers).forEach(buffer => gl.deleteBuffer(buffer));
        
        console.log(`Rendered ${this.objects.length} instances`);
    }
    
    /**
     * Create instance data arrays
     */
    createInstanceData() {
        const positions = new Float32Array(this.objects.length * 3);
        const colors = new Float32Array(this.objects.length * 3);
        const scales = new Float32Array(this.objects.length * 3);
        const rotations = new Float32Array(this.objects.length * 3);
        
        this.objects.forEach((obj, index) => {
            const i3 = index * 3;
            
            // Position
            positions[i3] = obj.position[0];
            positions[i3 + 1] = obj.position[1];
            positions[i3 + 2] = obj.position[2];
            
            // Color
            colors[i3] = obj.color[0];
            colors[i3 + 1] = obj.color[1];
            colors[i3 + 2] = obj.color[2];
            
            // Scale
            scales[i3] = obj.scale;
            scales[i3 + 1] = obj.scale;
            scales[i3 + 2] = obj.scale;
            
            // Rotation
            rotations[i3] = obj.rotation[0];
            rotations[i3 + 1] = obj.rotation[1];
            rotations[i3 + 2] = obj.rotation[2];
        });
        
        return { positions, colors, scales, rotations };
    }
    
    /**
     * Create instance buffers
     */
    createInstanceBuffers(instanceData) {
        const gl = this.gl;
        
        const buffers = {};
        
        // Position buffer
        buffers.position = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.bufferData(gl.ARRAY_BUFFER, instanceData.positions, gl.DYNAMIC_DRAW);
        
        // Color buffer
        buffers.color = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
        gl.bufferData(gl.ARRAY_BUFFER, instanceData.colors, gl.DYNAMIC_DRAW);
        
        // Scale buffer
        buffers.scale = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.scale);
        gl.bufferData(gl.ARRAY_BUFFER, instanceData.scales, gl.DYNAMIC_DRAW);
        
        // Rotation buffer
        buffers.rotation = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.rotation);
        gl.bufferData(gl.ARRAY_BUFFER, instanceData.rotations, gl.DYNAMIC_DRAW);
        
        return buffers;
    }
    
    /**
     * Bind geometry for instanced rendering
     */
    bindGeometryForInstancing(program, geometry, instanceBuffers) {
        const gl = this.gl;
        const ext = this.instancedArrays;
        
        // Bind vertex attributes
        if (program.attributes.a_position !== -1) {
            gl.bindBuffer(gl.ARRAY_BUFFER, geometry.vertices);
            gl.enableVertexAttribArray(program.attributes.a_position);
            gl.vertexAttribPointer(program.attributes.a_position, 3, gl.FLOAT, false, 0, 0);
        }
        
        if (program.attributes.a_normal !== -1) {
            gl.bindBuffer(gl.ARRAY_BUFFER, geometry.normals);
            gl.enableVertexAttribArray(program.attributes.a_normal);
            gl.vertexAttribPointer(program.attributes.a_normal, 3, gl.FLOAT, false, 0, 0);
        }
        
        if (program.attributes.a_texCoord !== -1) {
            gl.bindBuffer(gl.ARRAY_BUFFER, geometry.texCoords);
            gl.enableVertexAttribArray(program.attributes.a_texCoord);
            gl.vertexAttribPointer(program.attributes.a_texCoord, 2, gl.FLOAT, false, 0, 0);
        }
        
        if (program.attributes.a_color !== -1) {
            gl.bindBuffer(gl.ARRAY_BUFFER, geometry.colors);
            gl.enableVertexAttribArray(program.attributes.a_color);
            gl.vertexAttribPointer(program.attributes.a_color, 3, gl.FLOAT, false, 0, 0);
        }
        
        // Bind instance attributes
        if (program.attributes.a_instancePos !== -1) {
            gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffers.position);
            gl.enableVertexAttribArray(program.attributes.a_instancePos);
            gl.vertexAttribPointer(program.attributes.a_instancePos, 3, gl.FLOAT, false, 0, 0);
            ext.vertexAttribDivisorANGLE(program.attributes.a_instancePos, 1);
        }
        
        if (program.attributes.a_instanceColor !== -1) {
            gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffers.color);
            gl.enableVertexAttribArray(program.attributes.a_instanceColor);
            gl.vertexAttribPointer(program.attributes.a_instanceColor, 3, gl.FLOAT, false, 0, 0);
            ext.vertexAttribDivisorANGLE(program.attributes.a_instanceColor, 1);
        }
        
        if (program.attributes.a_instanceScale !== -1) {
            gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffers.scale);
            gl.enableVertexAttribArray(program.attributes.a_instanceScale);
            gl.vertexAttribPointer(program.attributes.a_instanceScale, 3, gl.FLOAT, false, 0, 0);
            ext.vertexAttribDivisorANGLE(program.attributes.a_instanceScale, 1);
        }
        
        if (program.attributes.a_instanceRotation !== -1) {
            gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffers.rotation);
            gl.enableVertexAttribArray(program.attributes.a_instanceRotation);
            gl.vertexAttribPointer(program.attributes.a_instanceRotation, 3, gl.FLOAT, false, 0, 0);
            ext.vertexAttribDivisorANGLE(program.attributes.a_instanceRotation, 1);
        }
    }
    
    /**
     * Bind geometry buffers and draw
     */
    bindAndDrawGeometry(program, geometry) {
        const gl = this.gl;
        
        // Bind vertex attributes
        if (program.attributes.a_position !== -1) {
            gl.bindBuffer(gl.ARRAY_BUFFER, geometry.vertices);
            gl.enableVertexAttribArray(program.attributes.a_position);
            gl.vertexAttribPointer(program.attributes.a_position, 3, gl.FLOAT, false, 0, 0);
        }
        
        if (program.attributes.a_normal !== -1) {
            gl.bindBuffer(gl.ARRAY_BUFFER, geometry.normals);
            gl.enableVertexAttribArray(program.attributes.a_normal);
            gl.vertexAttribPointer(program.attributes.a_normal, 3, gl.FLOAT, false, 0, 0);
        }
        
        if (program.attributes.a_texCoord !== -1) {
            gl.bindBuffer(gl.ARRAY_BUFFER, geometry.texCoords);
            gl.enableVertexAttribArray(program.attributes.a_texCoord);
            gl.vertexAttribPointer(program.attributes.a_texCoord, 2, gl.FLOAT, false, 0, 0);
        }
        
        if (program.attributes.a_color !== -1) {
            gl.bindBuffer(gl.ARRAY_BUFFER, geometry.colors);
            gl.enableVertexAttribArray(program.attributes.a_color);
            gl.vertexAttribPointer(program.attributes.a_color, 3, gl.FLOAT, false, 0, 0);
        }
        
        // Draw
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geometry.indices);
        gl.drawElements(gl.TRIANGLES, geometry.indexCount, gl.UNSIGNED_INT, 0);
    }
    
    /**
     * Create perspective projection matrix
     */
    createPerspectiveMatrix(fov, aspect, near, far) {
        const f = Math.tan(Math.PI * 0.5 - 0.5 * fov);
        const rangeInv = 1.0 / (near - far);
        
        return new Float32Array([
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (near + far) * rangeInv, -1,
            0, 0, near * far * rangeInv * 2, 0
        ]);
    }
    
    /**
     * Create look-at view matrix
     */
    createLookAtMatrix(eye, target, up) {
        const zAxis = this.normalize(this.subtract(eye, target));
        const xAxis = this.normalize(this.cross(up, zAxis));
        const yAxis = this.normalize(this.cross(zAxis, xAxis));
        
        return new Float32Array([
            xAxis[0], xAxis[1], xAxis[2], 0,
            yAxis[0], yAxis[1], yAxis[2], 0,
            zAxis[0], zAxis[1], zAxis[2], 0,
            eye[0], eye[1], eye[2], 1
        ]);
    }
    
    /**
     * Create model matrix from position, rotation, and scale
     */
    createModelMatrix(position, rotation, scale) {
        const matrix = new Float32Array(16);
        
        // Create identity matrix
        matrix[0] = scale; matrix[5] = scale; matrix[10] = scale; matrix[15] = 1;
        
        // Apply rotation (simplified - just using scale for now)
        matrix[12] = position[0];
        matrix[13] = position[1];
        matrix[14] = position[2];
        
        return matrix;
    }
    
    /**
     * Create normal matrix from model matrix
     */
    createNormalMatrix(modelMatrix) {
        // Simplified normal matrix calculation
        return new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    }
    
    /**
     * Vector math utilities
     */
    normalize(v) {
        const length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
        return [v[0] / length, v[1] / length, v[2] / length];
    }
    
    subtract(a, b) {
        return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    }
    
    cross(a, b) {
        return [
            a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0]
        ];
    }
    
    /**
     * Resize canvas to match display size
     */
    resizeCanvas() {
        const displayWidth = this.canvas.clientWidth;
        const displayHeight = this.canvas.clientHeight;
        
        if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
            this.canvas.width = displayWidth;
            this.canvas.height = displayHeight;
            
            if (this.gl) {
                this.gl.viewport(0, 0, displayWidth, displayHeight);
            }
        }
    }
    
    /**
     * Update statistics
     */
    updateStats() {
        this.stats.triangles = 0;
        this.stats.vertices = 0;
        
        this.objects.forEach(obj => {
            if (obj.geometry && obj.geometry.indexCount) {
                this.stats.triangles += obj.geometry.indexCount / 3;
                this.stats.vertices += obj.geometry.indexCount;
            }
        });
        
        this.stats.drawCalls = this.objects.length;
        
        // Estimate memory usage
        this.stats.textureMemory = Object.keys(this.textures).length * 
            (this.settings.textureResolution * this.settings.textureResolution * 4) / (1024 * 1024);
        
        this.stats.gpuMemory = this.stats.textureMemory + 
            (this.stats.vertices * 4 * 8) / (1024 * 1024); // Approximate buffer memory
    }
    
    /**
     * Get current statistics
     */
    getStats() {
        return { ...this.stats };
    }
    
    /**
     * Get current settings
     */
    getSettings() {
        return { ...this.settings };
    }
    
    /**
     * Update settings
     */
    updateSettings(newSettings) {
        Object.assign(this.settings, newSettings);
        
        // Recreate resources if needed
        if (newSettings.textureResolution && newSettings.textureResolution !== this.settings.textureResolution) {
            this.createTextures();
        }
        
        if (newSettings.geometryDetail && newSettings.geometryDetail !== this.settings.geometryDetail) {
            this.createGeometry();
        }
        
        this.dispatchEvent('settingsUpdated', { settings: this.settings });
    }
    
    /**
     * Dispatch custom events
     */
    dispatchEvent(eventName, data = {}) {
        const event = new CustomEvent(`benchmark:${eventName}`, { detail: data });
        this.canvas.dispatchEvent(event);
    }
    
    /**
     * Error handling
     */
    handleError(error) {
        console.error('WebGL Benchmark Error:', error);
        this.dispatchEvent('error', { error: error.message });
        
        // Try to provide fallback
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 0, 0, 0.9);
            color: white;
            padding: 20px;
            border-radius: 8px;
            font-family: monospace;
            z-index: 10000;
            max-width: 400px;
            text-align: center;
        `;
        errorDiv.innerHTML = `
            <h3>⚠️ WebGL Error</h3>
            <p>${error.message}</p>
            <button onclick="location.reload()" style="
                background: white;
                color: black;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                margin-top: 10px;
            ">Reload Page</button>
        `;
        document.body.appendChild(errorDiv);
    }
    
    /**
     * Cleanup resources
     */
    cleanup() {
        this.stopRenderLoop();
        
        const gl = this.gl;
        if (!gl) return;
        
        // Delete textures
        Object.values(this.textures).forEach(texture => {
            gl.deleteTexture(texture);
        });
        
        // Delete buffers
        [this.sphereGeometry, this.cubeGeometry, this.torusGeometry].forEach(geometry => {
            if (geometry) {
                Object.values(geometry).forEach(buffer => {
                    if (buffer && typeof buffer.deleteBuffer === 'function') {
                        gl.deleteBuffer(buffer);
                    }
                });
            }
        });
        
        // Delete programs
        Object.values(this.programs).forEach(program => {
            gl.deleteProgram(program);
        });
        
        console.log('🧹 Resources cleaned up');
    }
    
    /**
     * Export performance data
     */
    exportPerformanceData() {
        const data = {
            timestamp: new Date().toISOString(),
            settings: this.getSettings(),
            stats: this.getStats(),
            hardware: {
                gpu: this.gl.getParameter(this.gl.RENDERER),
                webglVersion: this.gl.getParameter(this.gl.VERSION),
                vendor: this.gl.getParameter(this.gl.VENDOR)
            },
            frameTimes: [...this.frameTimes]
        };
        
        return data;
    }
    
    /**
     * Save performance data as JSON
     */
    savePerformanceData(filename = 'webgl-benchmark-data.json') {
        const data = this.exportPerformanceData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        
        URL.revokeObjectURL(url);
        console.log('📊 Performance data saved');
    }
    
    /**
     * Public API methods
     */
    
    // Stress testing methods
    testLowEnd() { this.runStressTest(1000); }
    testMidRange() { this.runStressTest(10000); }
    testHighEnd() { this.runStressTest(50000); }
    testExtreme() { this.runStressTest(100000); }
    testRTX4090() { this.runStressTest(500000); } // Ultimate test
    
    // Settings control
    setShaderComplexity(complexity) {
        this.settings.shaderComplexity = complexity;
        this.settings.useComplexShaders = complexity !== 'basic';
    }
    
    setGeometryDetail(detail) {
        this.settings.geometryDetail = detail;
        this.createGeometry();
    }
    
    setTextureResolution(resolution) {
        this.settings.textureResolution = resolution;
        this.createTextures();
    }
    
    // Camera control
    setCameraAutoRotate(enabled) {
        this.camera.autoRotate = enabled;
    }
    
    setCameraPosition(x, y, z) {
        this.camera.position = [x, y, z];
        this.camera.autoRotate = false;
    }
}

// Export for use as module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedWebGLBenchmark;
}

// Also make available globally
if (typeof window !== 'undefined') {
    window.AdvancedWebGLBenchmark = AdvancedWebGLBenchmark;
}
     * Initialize WebGL context and resources
     */
    async init() {
        try {
            if (!this.initWebGL()) {
                throw new Error('Failed to initialize WebGL');
            }
            
            await this.createShaders();
            this.createGeometry();
            this.createTextures();
            this.setupScene();
            this.setupEventListeners();
            
            console.log('✅ Advanced WebGL Benchmark initialized successfully');
            console.log('GPU:', this.gl.getParameter(this.gl.RENDERER));
            console.log('WebGL Version:', this.gl.getParameter(this.gl.VERSION));
            
            this.startRenderLoop();
            
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            this.handleError(error);
        }
    }
    
    /**
     * Initialize WebGL context with optimized settings
     */
    initWebGL() {
        const contextAttributes = {
            alpha: false,
            depth: true,
            stencil: false,
            antialias: false, // Disable for performance testing
            powerPreference: "high-performance",
            preserveDrawingBuffer: false
        };
        
        // Try WebGL2 first, then WebGL1
        this.gl = this.canvas.getContext('webgl2', contextAttributes) || 
                  this.canvas.getContext('webgl', contextAttributes);
        
        if (!this.gl) {
            console.error('WebGL not supported');
            return false;
        }
        
        // Set viewport
        this.resizeCanvas();
        
        // Enable necessary features
        const gl = this.gl;
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
        gl.frontFace(gl.CCW);
        
        // Check for extensions
        this.checkExtensions();
        
        return true;
    }
    
    /**
     * Check available WebGL extensions
     */
    checkExtensions() {
        const gl = this.gl;
        const extensions = [];
        
        // Important extensions for performance
        const extensionNames = [
            'ANGLE_instanced_arrays',
            'OES_vertex_array_object',
            'EXT_texture_filter_anisotropic',
            'OES_texture_float',
            'OES_texture_half_float',
            'WEBGL_depth_texture',
            'EXT_color_buffer_float'
        ];
        
        extensionNames.forEach(name => {
            const ext = gl.getExtension(name);
            if (ext) {
                extensions.push(name);
                this[name.replace(/[^a-zA-Z0-9]/g, '_')] = ext;
            }
        });
        
        console.log('Available extensions:', extensions);
        
        // Store instancing extension reference
        this.instancedArrays = this.ANGLE_instanced_arrays;
    }
    
    /**
     * Create shader programs
     */
    async createShaders() {
        try {
            // Basic shader program
            this.programs.basic = await this.createShaderProgram(
                this.getVertexShader('basic'),
                this.getFragmentShader('basic')
            );
            
            // Advanced shader program  
            this.programs.advanced = await this.createShaderProgram(
                this.getVertexShader('advanced'),
                this.getFragmentShader('advanced')
            );
            
            // Instanced rendering shader
            if (this.instancedArrays) {
                this.programs.instanced = await this.createShaderProgram(
                    this.getVertexShader('instanced'),
                    this.getFragmentShader('instanced')
                );
            }
            
            // Extreme complexity shader
            this.programs.extreme = await this.createShaderProgram(
                this.getVertexShader('extreme'),
                this.getFragmentShader('extreme')
            );
            
            console.log('✅ Shaders compiled successfully');
            
        } catch (error) {
            console.error('❌ Shader compilation failed:', error);
            throw error;
        }
    }
    
    /**
     * Get vertex shader source
     */
    getVertexShader(type) {
        const shaders = {
            basic: `
                attribute vec3 a_position;
                attribute vec3 a_normal;
                attribute vec2 a_texCoord;
                attribute vec3 a_color;
                
                uniform mat4 u_projection;
                uniform mat4 u_view;
                uniform mat4 u_model;
                uniform float u_time;
                
                varying vec3 v_position;
                varying vec3 v_normal;
                varying vec2 v_texCoord;
                varying vec3 v_color;
                varying vec3 v_worldPos;
                
                void main() {
                    v_position = a_position;
                    v_normal = a_normal;
                    v_texCoord = a_texCoord;
                    v_color = a_color;
                    v_worldPos = (u_model * vec4(a_position, 1.0)).xyz;
                    
                    gl_Position = u_projection * u_view * u_model * vec4(a_position, 1.0);
                }
            `,
            
            advanced: `
                attribute vec3 a_position;
                attribute vec3 a_normal;
                attribute vec2 a_texCoord;
                attribute vec3 a_color;
                
                uniform mat4 u_projection;
                uniform mat4 u_view;
                uniform mat4 u_model;
                uniform mat4 u_normalMatrix;
                uniform float u_time;
                
                varying vec3 v_position;
                varying vec3 v_normal;
                varying vec2 v_texCoord;
                varying vec3 v_color;
                varying vec3 v_worldPos;
                varying vec3 v_viewPos;
                
                void main() {
                    // Animated vertex displacement
                    vec3 pos = a_position;
                    pos.y += sin(u_time * 2.0 + pos.x * 4.0) * 0.1;
                    pos.x += cos(u_time * 1.5 + pos.z * 3.0) * 0.05;
                    
                    v_position = pos;
                    v_normal = normalize((u_normalMatrix * vec4(a_normal, 0.0)).xyz);
                    v_texCoord = a_texCoord;
                    v_color = a_color;
                    v_worldPos = (u_model * vec4(pos, 1.0)).xyz;
                    
                    vec4 viewPos = u_view * u_model * vec4(pos, 1.0);
                    v_viewPos = viewPos.xyz;
                    
                    gl_Position = u_projection * viewPos;
                }
            `,
            
            instanced: `
                attribute vec3 a_position;
                attribute vec3 a_normal;
                attribute vec2 a_texCoord;
                attribute vec3 a_color;
                
                // Instance attributes
                attribute vec3 a_instancePos;
                attribute vec3 a_instanceColor;
                attribute vec3 a_instanceScale;
                attribute vec3 a_instanceRotation;
                
                uniform mat4 u_projection;
                uniform mat4 u_view;
                uniform float u_time;
                
                varying vec3 v_position;
                varying vec3 v_normal;
                varying vec2 v_texCoord;
                varying vec3 v_color;
                varying vec3 v_worldPos;
                
                mat4 rotationMatrix(vec3 axis, float angle) {
                    axis = normalize(axis);
                    float s = sin(angle);
                    float c = cos(angle);
                    float oc = 1.0 - c;
                    
                    return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                                0.0,                                0.0,                                0.0,                                1.0);
                }
                
                void main() {
                    // Apply instance transformations
                    vec3 pos = a_position * a_instanceScale;
                    
                    // Apply rotation
                    mat4 rotX = rotationMatrix(vec3(1.0, 0.0, 0.0), a_instanceRotation.x + u_time);
                    mat4 rotY = rotationMatrix(vec3(0.0, 1.0, 0.0), a_instanceRotation.y + u_time * 0.7);
                    mat4 rotZ = rotationMatrix(vec3(0.0, 0.0, 1.0), a_instanceRotation.z + u_time * 0.3);
                    
                    vec4 rotatedPos = rotZ * rotY * rotX * vec4(pos, 1.0);
                    pos = rotatedPos.xyz + a_instancePos;
                    
                    // Animated movement
                    pos.y += sin(u_time + a_instancePos.x * 2.0) * 0.5;
                    
                    v_position = pos;
                    v_normal = a_normal;
                    v_texCoord = a_texCoord;
                    v_color = a_instanceColor;
                    v_worldPos = pos;
                    
                    gl_Position = u_projection * u_view * vec4(pos, 1.0);
                }
            `,
            
            extreme: `
                attribute vec3 a_position;
                attribute vec3 a_normal;
                attribute vec2 a_texCoord;
                attribute vec3 a_color;
                
                uniform mat4 u_projection;
                uniform mat4 u_view;
                uniform mat4 u_model;
                uniform mat4 u_normalMatrix;
                uniform float u_time;
                
                varying vec3 v_position;
                varying vec3 v_normal;
                varying vec2 v_texCoord;
                varying vec3 v_color;
                varying vec3 v_worldPos;
                varying float v_displacement;
                
                // Simplex noise function
                vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
                vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
                
                float snoise(vec3 v) {
                    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
                    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
                    
                    vec3 i = floor(v + dot(v, C.yyy));
                    vec3 x0 = v - i + dot(i, C.xxx);
                    
                    vec3 g = step(x0.yzx, x0.xyz);
                    vec3 l = 1.0 - g;
                    vec3 i1 = min(g.xyz, l.zxy);
                    vec3 i2 = max(g.xyz, l.zxy);
                    
                    vec3 x1 = x0 - i1 + C.xxx;
                    vec3 x2 = x0 - i2 + C.yyy;
                    vec3 x3 = x0 - D.yyy;
                    
                    i = mod289(i);
                    vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
                    
                    float n_ = 0.142857142857;
                    vec3 ns = n_ * D.wyz - D.xzx;
                    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
                    vec4 x_ = floor(j * ns.z);
                    vec4 y_ = floor(j - 7.0 * x_);
                    vec4 x = x_ *ns.x + ns.yyyy;
                    vec4 y = y_ *ns.x + ns.yyyy;
                    vec4 h = 1.0 - abs(x) - abs(y);
                    vec4 b0 = vec4(x.xy, y.xy);
                    vec4 b1 = vec4(x.zw, y.zw);
                    vec4 s0 = floor(b0)*2.0 + 1.0;
                    vec4 s1 = floor(b1)*2.0 + 1.0;
                    vec4 sh = -step(h, vec4(0.0));
                    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
                    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
                    vec3 p0 = vec3(a0.xy, h.x);
                    vec3 p1 = vec3(a0.zw, h.y);
                    vec3 p2 = vec3(a1.xy, h.z);
                    vec3 p3 = vec3(a1.zw, h.w);
                    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
                    p0 *= norm.x;
                    p1 *= norm.y;
                    p2 *= norm.z;
                    p3 *= norm.w;
                    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                    m = m * m;
                    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
                }
                
                void main() {
                    vec3 pos = a_position;
                    
                    // Complex multi-octave noise displacement
                    float displacement = 0.0;
                    displacement += snoise(pos * 2.0 + u_time * 0.5) * 0.3;
                    displacement += snoise(pos * 4.0 + u_time * 0.3) * 0.15;
                    displacement += snoise(pos * 8.0 + u_time * 0.7) * 0.075;
                    displacement += snoise(pos * 16.0 + u_time * 1.2) * 0.0375;
                    
                    pos += a_normal * displacement;
                    
                    // Multiple wave animations
                    pos.y += sin(u_time * 3.0 + pos.x * 8.0) * 0.2;
                    pos.x += cos(u_time * 2.0 + pos.z * 6.0) * 0.15;
                    pos.z += sin(u_time * 4.0 + pos.y * 10.0) * 0.1;
                    
                    v_position = pos;
                    v_normal = normalize((u_normalMatrix * vec4(a_normal, 0.0)).xyz);
                    v_texCoord = a_texCoord;
                    v_color = a_color;
                    v_worldPos = (u_model * vec4(pos, 1.0)).xyz;
                    v_displacement = displacement;
                    
                    gl_Position = u_projection * u_view * u_model * vec4(pos, 1.0);
                }
            `
        };
        
        return shaders[type] || shaders.basic;
    }
    
    /**
     * Get fragment shader source
     */
    getFragmentShader(type) {
        const precision = `
            #ifdef GL_ES
            precision highp float;
            #endif
        `;
        
        const shaders = {
            basic: precision + `
                varying vec3 v_position;
                varying vec3 v_normal;
                varying vec2 v_texCoord;
                varying vec3 v_color;
                varying vec3 v_worldPos;
                
                uniform float u_time;
                uniform sampler2D u_texture;
                uniform vec3 u_lightPos;
                uniform vec3 u_viewPos;
                
                void main() {
                    vec3 normal = normalize(v_normal);
                    vec3 lightDir = normalize(u_lightPos - v_worldPos);
                    vec3 viewDir = normalize(u_viewPos - v_worldPos);
                    
                    // Basic Phong lighting
                    float NdotL = max(dot(normal, lightDir), 0.0);
                    vec3 reflectDir = reflect(-lightDir, normal);
                    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
                    
                    vec3 ambient = v_color * 0.1;
                    vec3 diffuse = v_color * NdotL;
                    vec3 specular = vec3(1.0) * spec;
                    
                    vec3 color = ambient + diffuse + specular;
                    color *= texture2D(u_texture, v_texCoord).rgb;
                    
                    gl_FragColor = vec4(color, 1.0);
                }
            `,
            
            advanced: precision + `
                varying vec3 v_position;
                varying vec3 v_normal;
                varying vec2 v_texCoord;
                varying vec3 v_color;
                varying vec3 v_worldPos;
                varying vec3 v_viewPos;
                
                uniform float u_time;
                uniform sampler2D u_texture;
                uniform sampler2D u_normalMap;
                uniform vec3 u_lightPos;
                uniform vec3 u_viewPos;
                
                // Simple noise function
                float noise(vec2 p) {
                    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
                }
                
                float fractalNoise(vec2 p) {
                    float value = 0.0;
                    float amplitude = 0.5;
                    for(int i = 0; i < 6; i++) {
                        value += amplitude * noise(p);
                        p *= 2.0;
                        amplitude *= 0.5;
                    }
                    return value;
                }
                
                void main() {
                    vec2 uv = v_texCoord + fractalNoise(v_texCoord * 4.0 + u_time * 0.5) * 0.05;
                    
                    vec3 normal = normalize(v_normal);
                    vec3 lightDir = normalize(u_lightPos - v_worldPos);
                    vec3 viewDir = normalize(u_viewPos - v_worldPos);
                    
                    // Enhanced lighting with multiple terms
                    float NdotL = max(dot(normal, lightDir), 0.0);
                    float NdotV = max(dot(normal, viewDir), 0.0);
                    
                    vec3 H = normalize(lightDir + viewDir);
                    float NdotH = max(dot(normal, H), 0.0);
                    
                    // Fresnel effect
                    float fresnel = pow(1.0 - NdotV, 2.0);
                    
                    vec3 baseColor = v_color * texture2D(u_texture, uv).rgb;
                    
                    vec3 ambient = baseColor * 0.15;
                    vec3 diffuse = baseColor * NdotL;
                    vec3 specular = vec3(1.0) * pow(NdotH, 64.0);
                    vec3 rim = vec3(0.3, 0.6, 1.0) * fresnel * 0.5;
                    
                    vec3 color = ambient + diffuse + specular + rim;
                    
                    // Add animated effects
                    color += sin(u_time * 2.0 + v_position.x * 10.0) * 0.1 * vec3(1.0, 0.5, 0.2);
                    
                    gl_FragColor = vec4(color, 1.0);
                }
            `,
            
            instanced: precision + `
                varying vec3 v_position;
                varying vec3 v_normal;
                varying vec2 v_texCoord;
                varying vec3 v_color;
                varying vec3 v_worldPos;
                
                uniform float u_time;
                uniform sampler2D u_texture;
                
                void main() {
                    vec3 color = v_color;
                    color *= texture2D(u_texture, v_texCoord).rgb;
                    
                    // Add some instance-based variation
                    color += sin(u_time + v_worldPos.x * 5.0) * 0.2;
                    color *= 1.0 + sin(u_time * 3.0 + v_worldPos.y * 3.0) * 0.3;
                    
                    gl_FragColor = vec4(color, 1.0);
                }
            `,
            
            extreme: precision + `
                varying vec3 v_position;
                varying vec3 v_normal;
                varying vec2 v_texCoord;
                varying vec3 v_color;
                varying vec3 v_worldPos;
                varying float v_displacement;
                
                uniform float u_time;
                uniform sampler2D u_texture;
                uniform sampler2D u_normalMap;
                uniform sampler2D u_roughnessMap;
                uniform vec3 u_lightPos;
                uniform vec3 u_viewPos;
                
                // Advanced noise functions
                float hash(vec2 p) {
                    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
                    p3 += dot(p3, p3.yzx + 33.33);
                    return fract((p3.x + p3.y) * p3.z);
                }
                
                float noise(vec2 p) {
                    vec2 i = floor(p);
                    vec2 f = fract(p);
                    vec2 u = f * f * (3.0 - 2.0 * f);
                    return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
                               mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
                }
                
                float fbm(vec2 p) {
                    float value = 0.0;
                    float amplitude = 0.5;
                    for(int i = 0; i < 8; i++) {
                        value += amplitude * noise(p);
                        p *= 2.0;
                        amplitude *= 0.5;
                    }
                    return value;
                }
                
                // Simplified PBR BRDF
                vec3 calculatePBR(vec3 normal, vec3 lightDir, vec3 viewDir, vec3 albedo, float metallic, float roughness) {
                    float NdotL = max(dot(normal, lightDir), 0.0);
                    float NdotV = max(dot(normal, viewDir), 0.0);
                    
                    vec3 H = normalize(lightDir + viewDir);
                    float NdotH = max(dot(normal, H), 0.0);
                    float VdotH = max(dot(viewDir, H), 0.0);
                    
                    // Fresnel-Schlick approximation
                    vec3 F0 = mix(vec3(0.04), albedo, metallic);
                    vec3 F = F0 + (1.0 - F0) * pow(1.0 - VdotH, 5.0);
                    
                    // GGX/Trowbridge-Reitz distribution
                    float alpha = roughness * roughness;
                    float alpha2 = alpha * alpha;
                    float denom = NdotH * NdotH * (alpha2 - 1.0) + 1.0;
                    float D = alpha2 / (3.14159 * denom * denom);
                    
                    // Smith geometry function
                    float k = (roughness + 1.0) * (roughness + 1.0) / 8.0;
                    float G1L = NdotL / (NdotL * (1.0 - k) + k);
                    float G1V = NdotV / (NdotV * (1.0 - k) + k);
                    float G = G1L * G1V;
                    
                    // Cook-Torrance BRDF
                    vec3 numerator = D * G * F;
                    float denominator = 4.0 * NdotV * NdotL + 0.001;
                    vec3 specular = numerator / denominator;
                    
                    vec3 kS = F;
                    vec3 kD = (1.0 - kS) * (1.0 - metallic);
                    
                    return (kD * albedo / 3.14159 + specular) * NdotL;
                }
                
                void main() {
                    // Animated UV coordinates
                    vec2 uv = v_texCoord + fbm(v_texCoord * 8.0 + u_time * 0.3) * 0.1;
                    
                    vec3 normal = normalize(v_normal);
                    vec3 lightDir = normalize(u_lightPos - v_worldPos);
                    vec3 viewDir = normalize(u_viewPos - v_worldPos);
                    
                    // Sample textures
                    vec3 albedo = v_color * texture2D(u_texture, uv).rgb;
                    float roughness = texture2D(u_roughnessMap, uv).r;
                    float metallic = 0.1 + v_displacement * 0.8;
                    
                    // Calculate PBR lighting
                    vec3 color = calculatePBR(normal, lightDir, viewDir, albedo, metallic, roughness);
                    
                    // Add ambient lighting
                    color += albedo * 0.05;
                    
                    // Atmospheric effects
                    float distance = length(v_worldPos);
                    float fog = exp(-distance * 0.01);
                    color = mix(vec3(0.1, 0.1, 0.2), color, fog);
                    
                    // Multiple animated effects
                    vec3 glow = vec3(0.0);
                    glow += sin(u_time * 4.0 + v_position.x * 15.0) * 0.2 * vec3(1.0, 0.3, 0.1);
                    glow += cos(u_time * 3.0 + v_position.y * 12.0) * 0.15 * vec3(0.1, 0.8, 1.0);
                    glow += sin(u_time * 5.0 + v_position.z * 20.0) * 0.1 * vec3(0.8, 1.0, 0.2);
                    
                    color += glow * (0.5 + 0.5 * sin(u_time * 2.0));
                    
                    // HDR tone mapping
                    color = color / (color + vec3(1.0));
                    color = pow(color, vec3(1.0/2.2));
                    
                    gl_FragColor = vec4(color, 1.0);
                }
            `
        };
        
        return shaders[type] || shaders.basic;
    }
    
    /**
     * Create shader program from vertex and fragment sources
     */
    async createShaderProgram(vertexSource, fragmentSource) {
        const gl = this.gl;
        
        const vertexShader = this.compileShader(gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fragmentSource);
        
        if (!vertexShader || !fragmentShader) {
            throw new Error('Failed to compile shaders');
        }
        
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const error = gl.getProgramInfoLog(program);
            gl.deleteProgram(program);
            throw new Error('Program linking failed: ' + error);
        }
        
        // Get attribute and uniform locations
        program.attributes = {};
        program.uniforms = {};
        
        const numAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
        for (let i = 0; i < numAttributes; i++) {
            const attribute = gl.getActiveAttrib(program, i);
            program.attributes[attribute.name] = gl.getAttribLocation(program, attribute.name);
        }
        
        const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < numUniforms; i++) {
            const uniform = gl.getActiveUniform(program, i);
            program.uniforms[uniform.name] = gl.getUniformLocation(program, uniform.name);
        }
        
        return program;
    }
    
    /**
     * Compile individual shader
     */
    compileShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const error = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            console.error('Shader compilation failed:', error);
            console.error('Source:', source);
            return null;
        }
        
        return shader;
    }
    
    /**
     * Create geometry buffers
     */
    createGeometry() {
        // Create detailed sphere
        this.sphereGeometry = this.createSphere(1, this.settings.geometryDetail, this.settings.geometryDetail);
        
        // Create cube
        this.cubeGeometry = this.createCube();
        
        // Create torus
        this.torusGeometry = this.createTorus(1, 0.4, 32, 64);
    }
    
    /**
     * Create sphere geometry
     */
    createSphere(radius, widthSegments, heightSegments) {
        const vertices = [];
        const normals = [];
        const texCoords = [];
        const colors = [];
        const indices = [];
        
        for (let y = 0; y <= heightSegments; y++) {
            for (let x = 0; x <= widthSegments; x++) {
                const u = x / widthSegments;
                const v = y / heightSegments;
                
                const phi = u * Math.PI * 2;
                const theta = v * Math.PI;
                
                const sinTheta = Math.sin(theta);
                const cosTheta = Math.cos(theta);
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);
                
                const px = radius * sinTheta * cosPhi;
                const py = radius * cosTheta;
                const pz = radius * sinTheta * sinPhi;
                
                vertices.push(px, py, pz);
                normals.push(px / radius, py / radius, pz / radius);
                texCoords.push(u, v);
                colors.push(Math.random(), Math.random(), Math.random());
            }
        }
        
        for (let y = 0; y < heightSegments; y++) {
            for (let x = 0; x < widthSegments; x++) {
                const a = y * (widthSegments + 1) + x;
                const b = a + widthSegments + 1;
                
                indices.push(a, b, a + 1);
                indices.push(b, b + 1, a + 1);
            }
        }
        
        return this.createBuffers({
            vertices: new Float32Array(vertices),
            normals: new Float32Array(normals),
            texCoords: new Float32Array(texCoords),
            colors: new Float32Array(colors),
            indices: new Uint32Array(indices)
        });
    }
    
    /**
     * Create cube geometry
     */
    createCube() {
        const vertices = new Float32Array([
            // Front face
            -1, -1,  1,  1, -1,  1,  1,  1,  1, -1,  1,  1,
            // Back face
            -1, -1, -1, -1,  1, -1,  1,  1, -1,  1, -1, -1,
            // Top face
            -1,  1, -1, -1,  1,  1,  1,  1,  1,  1,  1, -1,
            // Bottom face
            -1, -1, -1,  1, -1, -1,  1, -1,  1, -1, -1,  1,
            // Right face
             1, -1, -1,  1,  1, -1,  1,  1,  1,  1, -1,  1,
            // Left face
            -1, -1, -1, -1, -1,  1, -1,  1,  1, -1,  1, -1
        ]);
        
        const normals = new Float32Array([
            // Front face
             0,  0,  1,  0,  0,  1,  0,  0,  1,  0,  0,  1,
            // Back face
             0,  0, -1,  0,  0, -1,  0,  0, -1,  0,  0, -1,
            // Top face
             0,  1,  0,  0,  1,  0,  0,  1,  0,  0,  1,  0,
            // Bottom face
             0, -1,  0,  0, -1,  0,  0, -1,  0,  0, -1,  0,
            // Right face
             1,  0,  0,  1,  0,  0,  1,  0,  0,  1,  0,  0,
            // Left face
            -1,  0,  0, -1,  0,  0, -1,  0,  0, -1,  0,  0
        ]);
        
        const texCoords = new Float32Array([
            0, 0,  1, 0,  1, 1,  0, 1, // Front
            1, 0,  1, 1,  0, 1,  0, 0, // Back
            0, 1,  0, 0,  1, 0,  1, 1, // Top
            1, 1,  0, 1,  0, 0,  1, 0, // Bottom
            1, 0,  1, 1,  0, 1,  0, 0, // Right
            0, 0,  1, 0,  1, 1,  0, 1  // Left
        ]);
        
        const colors = new Float32Array(72); // 24 vertices * 3 components
        for (let i = 0; i < colors.length; i += 3) {
            colors[i] = Math.random();
            colors[i + 1] = Math.random();
            colors[i + 2] = Math.random();
        }
        
        const indices = new Uint32Array([
            0,  1,  2,   0,  2,  3,    // front
            4,  5,  6,   4,  6,  7,    // back
            8,  9,  10,  8,  10, 11,   // top
            12, 13, 14,  12, 14, 15,   // bottom
            16, 17, 18,  16, 18, 19,   // right
            20, 21, 22,  20, 22, 23    // left
        ]);
        
        return this.createBuffers({
            vertices, normals, texCoords, colors, indices
        });
    }
    
    /**
     * Create torus geometry
     */
    createTorus(radius, tube, radialSegments, tubularSegments) {
        const vertices = [];
        const normals = [];
        const texCoords = [];
        const colors = [];
        const indices = [];
        
        for (let j = 0; j <= radialSegments; j++) {
            for (let i = 0; i <= tubularSegments; i++) {
                const u = i / tubularSegments * Math.PI * 2;
                const v = j / radialSegments * Math.PI * 2;
                
                const x = (radius + tube * Math.cos(v)) * Math.cos(u);
                const y = (radius + tube * Math.cos(v)) * Math.sin(u);
                const z = tube * Math.sin(v);
                
                vertices.push(x, y, z);
                
                const nx = Math.cos(v) * Math.cos(u);
                const ny = Math.cos(v) * Math.sin(u);
                const nz = Math.sin(v);
                normals.push(nx, ny, nz);
                
                texCoords.push(i / tubularSegments, j / radialSegments);
                colors.push(Math.random(), Math.random(), Math.random());
            }
        }
        
        for (let j = 1; j <= radialSegments; j++) {
            for (let i = 1; i <= tubularSegments; i++) {
                const a = (tubularSegments + 1) * j + i - 1;
                const b = (tubularSegments + 1) * (j - 1) + i - 1;
                const c = (tubularSegments + 1) * (j - 1) + i;
                const d = (tubularSegments + 1) * j + i;
                
                indices.push(a, b, d);
                indices.push(b, c, d);
            }
        }
        
        return this.createBuffers({
            vertices: new Float32Array(vertices),
            normals: new Float32Array(normals),
            texCoords: new Float32Array(texCoords),
            colors: new Float32Array(colors),
            indices: new Uint32Array(indices)
        });
    }
    
    /**
     * Create WebGL buffers from geometry data
     */
    createBuffers(data) {
        const gl = this.gl;
        
        const buffers = {
            vertices: gl.createBuffer(),
            normals: gl.createBuffer(),
            texCoords: gl.createBuffer(),
            colors: gl.createBuffer(),
            indices: gl.createBuffer(),
            indexCount: data.indices.length
        };
        
        // Vertex buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertices);
        gl.bufferData(gl.ARRAY_BUFFER, data.vertices, gl.STATIC_DRAW);
        
        // Normal buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normals);
        gl.bufferData(gl.ARRAY_BUFFER, data.normals, gl.STATIC_DRAW);
        
        // Texture coordinate buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.texCoords);
        gl.bufferData(gl.ARRAY_BUFFER, data.texCoords, gl.STATIC_DRAW);
        
        // Color buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.colors);
        gl.bufferData(gl.ARRAY_BUFFER, data.colors, gl.STATIC_DRAW);
        
        // Index buffer
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data.indices, gl.STATIC_DRAW);
        
        return buffers;
    }
    
    /**
     * Create procedural textures
     */
    createTextures() {
        this.textures.main = this.createProceduralTexture('main');
        this.textures.normal = this.createProceduralTexture('normal');
        this.textures.roughness = this.createProceduralTexture('roughness');
        
        console.log('✅ Textures created');
    }
    
    /**
     * Create procedural texture
     */
    createProceduralTexture(type) {
        const gl = this.gl;
        const size = this.settings.textureResolution;
        
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        const imageData = ctx.createImageData(size, size);
        const data = imageData.data;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const index = (y * size + x) * 4;
                const nx = x / size;
                const ny = y / size;
                
                switch (type) {
                    case 'main':
                        const noise = this.noise(nx * 8, ny * 8) * 0.5 + 0.5;
                        data[index] = noise * 200 + 55;     // R
                        data[index + 1] = noise * 180 + 65; // G
                        data[index + 2] = noise * 150 + 45; // B
                        break;
                        
                    case 'normal':
                        data[index] = 128;     // R (neutral)
                        data[index + 1] = 128; // G (neutral)
                        data[index + 2] = 255; // B (up)
                        break;
                        
                    case 'roughness':
                        const roughness = this.noise(nx * 4, ny * 4) * 0.3 + 0.7;
                        data[index] = roughness * 255;
                        data[index + 1] = roughness * 255;
                        data[index + 2] = roughness * 255;
                        break;
                }
                
                data[index + 3] = 255; // Alpha
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Create WebGL texture
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
        
        // Set texture parameters
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        
        gl.generateMipmap(gl.TEXTURE_2D);
        
        return texture;
    }
    
    /**
     * Simple noise function
     */
    noise(x, y) {
        const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        return n - Math.floor(n);
    }
    
    /**
     * Setup scene lighting and camera
     */
    setupScene() {
        // Initial camera position
        this.camera.position = [0, 5, 10];
        this.camera.target = [0, 0, 0];
        
        // Light position
        this.lightPosition = [10, 10, 10];
        
        console.log('✅ Scene setup complete');
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Canvas resize
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Mouse controls for camera
        this.setupMouseControls();
        
        // Keyboard shortcuts
        this.setupKeyboardControls();
    }
    
    /**
     * Setup mouse controls
     */
    setupMouseControls() {
        let isMouseDown = false;
        let lastMouseX = 0;
        let lastMouseY = 0;
        
        this.canvas.addEventListener('mousedown', (e) => {
            isMouseDown = true;
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
            this.camera.autoRotate = false;
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (!isMouseDown) return;
            
            const deltaX = e.clientX - lastMouseX;
            const deltaY = e.clientY - lastMouseY;
            
            this.camera.rotation[1] += deltaX * 0.01;
            this.camera.rotation[0] += deltaY * 0.01;
            
            // Clamp vertical rotation
            this.camera.rotation[0] = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.camera.rotation[0]));
            
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
        });
        
        this.canvas.addEventListener('mouseup', () => {
            isMouseDown = false;
        });
        
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
            const distance = Math.sqrt(
                this.camera.position[0] ** 2 +
                this.camera.position[1] ** 2 +
                this.camera.position[2] ** 2
            );
            
            const newDistance = Math.max(2, Math.min(50, distance * zoomFactor));
            const scale = newDistance / distance;
            
            this.camera.position[0] *= scale;
            this.camera.position[1] *= scale;
            this.camera.position[2] *= scale;
        });
    }
    
    /**
     * Setup keyboard controls
     */
    setupKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            switch (e.key.toLowerCase()) {
                case ' ':
                    e.preventDefault();
                    this.camera.autoRotate = !this.camera.autoRotate;
                    break;
                case 'r':
                    this.resetScene();
                    break;
                case '1':
                    this.runStressTest(1000);
                    break;
                case '2':
                    this.runStressTest(10000);
                    break;
                case '3':
                    this.runStressTest(50000);
                    break;
                case '4':
                    this.runStressTest(100000);
                    break;
                case 's':
                    this.toggleShaderComplexity();
                    break;
            }
        });
    }
    
    /**
     * Run stress test with specified object count
     */
    runStressTest(objectCount) {
        console.log(`🚀 Running stress test with ${objectCount.toLocaleString()} objects`);
        
        this.settings.objectCount = objectCount;
        this.createObjects(objectCount);
        this.updateStats();
        
        // Dispatch custom event
        this.dispatchEvent('stressTestStarted', { objectCount });
    }
    
    /**
     * Create objects for stress testing
     */
    createObjects(count) {
        // Clear existing objects
        this.objects = [];
        
        // Choose geometry based on count for performance
        let geometry;
        if (count > 50000) {
            geometry = this.cubeGeometry; // Simple geometry for extreme tests
        } else if (count > 10000) {
            geometry = this.torusGeometry; // Medium complexity
        } else {
            geometry = this.sphereGeometry; // High detail for lower counts
        }
        
        for (let i = 0; i < count; i++) {
            const obj = {
                geometry: geometry,
                position: [
                    (Math.random() - 0.5) * 50,
                    (Math.random() - 0.5) * 20,
                    (Math.random() - 0.5) * 50
                ],
                rotation: [
                    Math.random() * Math.PI * 2,
                    Math.random() * Math.PI * 2,
                    Math.random() * Math.PI * 2
                ],
                rotationSpeed: [
                    (Math.random() - 0.5) * 0.02,
                    (Math.random() - 0.5) * 0.02,
                    (Math.random() - 0.5) * 0.02
                ],
                scale: 0.1 + Math.random() * 0.5,
                color: [Math.random(), Math.random(), Math.random()]
            };
            
            this.objects.push(obj);
        }
        
        console.log(`Created ${count.toLocaleString()} objects`);
    }
    
    /**
     * Toggle shader complexity
     */
    toggleShaderComplexity() {
        const complexities = ['basic', 'advanced', 'extreme'];
        const currentIndex = complexities.indexOf(this.settings.shaderComplexity);
        const nextIndex = (currentIndex + 1) % complexities.length;
        
        this.settings.shaderComplexity = complexities[nextIndex];
        this.settings.useComplexShaders = this.settings.shaderComplexity !== 'basic';
        
        console.log(`Shader complexity: ${this.settings.shaderComplexity}`);
        this.dispatchEvent('shaderComplexityChanged', { complexity: this.settings.shaderComplexity });
    }
    
    /**
     * Reset scene to default state
     */
    resetScene() {
        this.objects = [];
        this.settings.objectCount = 0;
        this.settings.shaderComplexity = 'medium';
        this.settings.useComplexShaders = false;
        this.camera.autoRotate = true;
        this.camera.position = [0, 5, 10];
        this.camera.rotation = [0, 0, 0];
        
        console.log('Scene reset');
        this.dispatchEvent('sceneReset');
    }
    
    /**
     * Start render loop
     */
    startRenderLoop() {
        this.isRunning = true;
        
        const render = (time) => {
            if (!this.isRunning) return;
            
            this.render(time);
            requestAnimationFrame(render);
        };
        
        requestAnimationFrame(render);
        console.log('✅ Render loop started');
    }
    
    /**
     * Stop render loop
     */
    stopRenderLoop() {
        this.isRunning = false;
        console.log('⏹️ Render loop stopped');
    }
    
    /**
     * Main render function
     */
    render(time) {
        const gl = this.gl;
        
        // Update performance stats
        this.updatePerformanceStats(time);
        
        // Update camera
        this.updateCamera(time);
        
        // Clear buffers
        gl.clearColor(0.05, 0.05, 0.1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        // Choose shader program based on settings
        let program;
        if (this.settings.shaderComplexity === 'extreme') {
            program = this.programs.extreme;
        } else if (this.settings.shaderComplexity === 'advanced') {
            program = this.programs.advanced;
        } else {
            program = this.programs.basic;
        }
        
        if (!program) {
            console.error('No shader program available');
            return;
        }
        
        // Use shader program
        gl.useProgram(program);
        
        // Set global uniforms
        this.setGlobalUniforms(program, time);
        
        // Render objects
        if (this.settings.objectCount > 10000 && this.instancedArrays && this.programs.instanced) {
            this.renderInstanced(time);
        } else {
            this.renderObjects(program, time);
        }
        
        // Update stats
        this.stats.drawCalls = this.objects.length;
    }
    
    /**
     * Update performance statistics
     */
    updatePerformanceStats(time) {
        this.frameCount++;
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        
        this.frameTimes.push(deltaTime);
        if (this.frameTimes.length > 60) {
            this.frameTimes.shift();
        }
        
        // Update FPS every 30 frames
        if (this.frameCount % 30 === 0) {
            const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
            this.stats.fps = Math.round(1000 / avgFrameTime);
            this.stats.frameTime = avgFrameTime;
            
            // Calculate triangle count
            this.stats.triangles = 0;
            this.stats.vertices = 0;
            
            this.objects.forEach(obj => {
                if (obj.geometry && obj.geometry.indexCount) {
                    this.stats.triangles += obj.geometry.indexCount / 3;
                    this.stats.vertices += obj.geometry.indexCount;
                }
            });
            
            // Dispatch performance update event
            this.dispatchEvent('performanceUpdate', {
                fps: this.stats.fps,
                frameTime: this.stats.frameTime,
                triangles: this.stats.triangles,
                vertices: this.stats.vertices,
                drawCalls: this.stats.drawCalls,
                objectCount: this.settings.objectCount
            });
        }
        
        this.lastTime = currentTime;
    }
    
    /**
     * Update camera position and matrices
     */
    updateCamera(time) {
        if (this.camera.autoRotate) {
            const radius = 15;
            const speed = 0.0005;
            this.camera.position[0] = Math.sin(time * speed) * radius;
            this.camera.position[2] = Math.cos(time * speed) * radius;
            this.camera.position[1] = 5 + Math.sin(time * speed * 0.5) * 3;
        } else {
            // Manual camera control
            const radius = Math.sqrt(
                this.camera.position[0] ** 2 +
                this.camera.position[1] ** 2 +
                this.camera.position[2] ** 2
            );
            
            this.camera.position[0] = Math.sin(this.camera.rotation[1]) * Math.cos(this.camera.rotation[0]) * radius;
            this.camera.position[1] = Math.sin(this.camera.rotation[0]) * radius;
            this.camera.position[2] = Math.cos(this.camera.rotation[1]) * Math.cos(this.camera.rotation[0]) * radius;
        }
        
        // Create view matrix
        this.viewMatrix = this.createLookAtMatrix(
            this.camera.position,
            this.camera.target || [0, 0, 0],
            [0, 1, 0]
        );
        
        // Create projection matrix
        this.projectionMatrix = this.createPerspectiveMatrix(
            this.camera.fov * Math.PI / 180,
            this.canvas.width / this.canvas.height,
            0.1,
            1000
        );
    }
    
    /**
     * Set global shader uniforms
     */
    setGlobalUniforms(program, time) {
        const gl = this.gl;
        
        // Matrices
        if (program.uniforms.u_projection) {
            gl.uniformMatrix4fv(program.uniforms.u_projection, false, this.projectionMatrix);
        }
        if (program.uniforms.u_view) {
            gl.uniformMatrix4fv(program.uniforms.u_view, false, this.viewMatrix);
        }
        
        // Time
        if (program.uniforms.u_time) {
            gl.uniform1f(program.uniforms.u_time, time * 0.001);
        }
        
        // Lighting
        if (program.uniforms.u_lightPos) {
            gl.uniform3fv(program.uniforms.u_lightPos, this.lightPosition);
        }
        if (program.uniforms.u_viewPos) {
            gl.uniform3fv(program.uniforms.u_viewPos, this.camera.position);
        }
        
        // Bind textures
        if (program.uniforms.u_texture) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.textures.main);
            gl.uniform1i(program.uniforms.u_texture, 0);
        }
        
        if (program.uniforms.u_normalMap) {
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, this.textures.normal);
            gl.uniform1i(program.uniforms.u_normalMap, 1);
        }
        
        if (program.uniforms.u_roughnessMap) {
            gl.activeTexture(gl.TEXTURE2);
            gl.bindTexture(gl.TEXTURE_2D, this.textures.roughness);
            gl.uniform1i(program.uniforms.u_roughnessMap, 2);
        }
    }
    
    /**
     * Render objects individually
     */
    renderObjects(program, time) {
        const gl = this.gl;
        
        this.objects.forEach((obj, index) => {
            // Update object rotation
            obj.rotation[0] += obj.rotationSpeed[0];
            obj.rotation[1] += obj.rotationSpeed[1];
            obj.rotation[2] += obj.rotationSpeed[2];
            
            // Create model matrix
            const modelMatrix = this.createModelMatrix(obj.position, obj.rotation, obj.scale);
            
            // Set model matrix uniform
            if (program.uniforms.u_model) {
                gl.uniformMatrix4fv(program.uniforms.u_model, false, modelMatrix);
            }
            
            // Set normal matrix if needed
            if (program.uniforms.u_normalMatrix) {
                const normalMatrix = this.createNormalMatrix(modelMatrix);
                gl.uniformMatrix4fv(program.uniforms.u_normalMatrix, false, normalMatrix);
            }
            
            // Bind geometry buffers and draw
            this.bindAndDrawGeometry(program, obj.geometry);
        });
    }
    
    /**