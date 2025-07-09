// webgpu-renderer.js
// WebGPU implementation that actually renders geometry

export class WebGPURenderer {
    constructor() {
        this.adapter = null;
        this.device = null;
        this.canvas = null;
        this.context = null;
        this.renderPassDescriptor = null;
        this.isInitialized = false;
        this.format = 'bgra8unorm';
        
        // Rendering pipeline
        this.renderPipeline = null;
        this.wireframePipeline = null;
        this.uniformBuffer = null;
        this.bindGroup = null;
        this.vertexBuffer = null;
        this.indexBuffer = null;
        this.indexCount = 0;
        this.wireframeMode = false;
        this.helixMeshRef = null;
    }
    
    /**
     * Initialize WebGPU renderer with maximum compatibility
     */
    async init() {
        console.log('🎨 Initializing WebGPU renderer...');
        
        // Check WebGPU support
        if (!navigator.gpu) {
            throw new Error('WebGPU not supported. Enable in Chrome with chrome://flags/#enable-unsafe-webgpu');
        }
        
        try {
            // Request adapter
            this.adapter = await navigator.gpu.requestAdapter({
                powerPreference: 'low-power'
            });
            
            if (!this.adapter) {
                throw new Error('No WebGPU adapter available');
            }
            
            console.log('✅ WebGPU adapter acquired');
            
            // Request device with minimal features
            this.device = await this.adapter.requestDevice({
                requiredFeatures: [],
                requiredLimits: {}
            });
            
            // Set up error handling
            this.device.addEventListener('uncapturederror', (event) => {
                console.error('WebGPU uncaptured error:', event.error.message);
            });
            
            console.log('✅ WebGPU device created successfully');
            this.isInitialized = true;
            
        } catch (error) {
            console.error('❌ WebGPU initialization failed:', error);
            throw new Error(`WebGPU init failed: ${error.message}`);
        }
    }

    async loadTexture(url, {srgb = false} = {}) {
  // 1. Fetch and decode
  const res   = await fetch(url);
  const blob  = await res.blob();
  const bmp   = await createImageBitmap(blob, { colorSpaceConversion: 'none' });

  // 2. Create an empty GPU texture
  const format = srgb ? 'rgba8unorm-srgb' : 'rgba8unorm';
  const texture = this.device.createTexture({
    size: [bmp.width, bmp.height, 1],
    format,
    usage:
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST        |
      GPUTextureUsage.RENDER_ATTACHMENT   // <- needed by copyExternalImageToTexture()
  });

  // 3. Copy pixel data into it (GPUQueue does the blit)
  this.device.queue.copyExternalImageToTexture(
    { source: bmp },
    { texture },
    [bmp.width, bmp.height]
  );

  return texture;
}
    
    /**
     * Setup WebGPU renderer
     */
    async setup(width, height) {
        if (!this.isInitialized) {
            await this.init();
        }
        
        console.log('🔧 Setting up WebGPU canvas...');
        
        try {
            // Create canvas
            this.canvas = document.createElement('canvas');
            this.canvas.width = width;
            this.canvas.height = height;
            this.canvas.style.display = 'block';
            
            // Get WebGPU context
            this.context = this.canvas.getContext('webgpu');
            
            if (!this.context) {
                throw new Error('Failed to get WebGPU context from canvas');
            }
            
            // Get preferred format
            this.format = navigator.gpu.getPreferredCanvasFormat();
            console.log(`Using canvas format: ${this.format}`);
            
            // Configure context
            this.context.configure({
                device: this.device,
                format: this.format,
                alphaMode: 'opaque',
                usage: GPUTextureUsage.RENDER_ATTACHMENT
            });
            
            // Create depth texture
            this.depthTexture = this.device.createTexture({
                size: { width, height, depthOrArrayLayers: 1 },
                format: 'depth24plus',
                usage: GPUTextureUsage.RENDER_ATTACHMENT
            });
            
            // Setup render pass with depth
            this.renderPassDescriptor = {
                colorAttachments: [{
                    view: null, // Will be set each frame
                    clearValue: { r: 0.13, g: 0.13, b: 0.13, a: 1.0 }, // Match WebGL background
                    loadOp: 'clear',
                    storeOp: 'store'
                }],
                depthStencilAttachment: {
                    view: this.depthTexture.createView(),
                    depthClearValue: 1.0,
                    depthLoadOp: 'clear',
                    depthStoreOp: 'store'
                }
            };
            
            // Create rendering pipeline
            await this.createRenderPipeline();
            
            console.log('✅ WebGPU canvas setup complete');
            
        } catch (error) {
            console.error('❌ WebGPU setup failed:', error);
            throw error;
        }
    }
    
    /**
     * Create rendering pipeline for helix geometry
     */
    async createRenderPipeline() {
        // Vertex shader
        const vertexShaderCode = `
            struct Uniforms {
                mvpMatrix: mat4x4<f32>,
                normalMatrix: mat4x4<f32>,
            };
            
            @group(0) @binding(0) var<uniform> uniforms: Uniforms;
            
            struct VertexInput {
                @location(0) position: vec3<f32>,
                @location(1) normal: vec3<f32>,
                @location(2) uv: vec2<f32>,
            };
            
            struct VertexOutput {
                @builtin(position) position: vec4<f32>,
                @location(0) worldPosition: vec3<f32>,
                @location(1) normal: vec3<f32>,
                @location(2) uv: vec2<f32>,
            };
            
            @vertex
            fn main(input: VertexInput) -> VertexOutput {
                var output: VertexOutput;
                
                output.worldPosition = input.position;
                output.position = uniforms.mvpMatrix * vec4<f32>(input.position, 1.0);
                output.position.z = output.position.z * 0.5 + output.position.w * 0.5;
                output.normal = (uniforms.normalMatrix * vec4<f32>(input.normal, 0.0)).xyz;
                output.uv = input.uv;
                
                return output;
            }
        `;
        
        // Fragment shader with better lighting to match WebGL exactly
        const fragmentShaderCode = `
            struct FragmentInput {
                @builtin(position) position: vec4<f32>,
                @location(0) worldPosition: vec3<f32>,
                @location(1) normal: vec3<f32>,
                @location(2) uv: vec2<f32>,
            };
            
            @fragment
            fn main(input: FragmentInput) -> @location(0) vec4<f32> {
                let normal = normalize(input.normal);
                
                // Lighting setup to match WebGL scene exactly
                // Directional light (key light)
                let dirLightDir = normalize(vec3<f32>(10.0, 15.0, 10.0) - input.worldPosition);
                let dirDiffuse = max(dot(normal, dirLightDir), 0.0) * 0.8;
                
                // Point light (blue)
                let pointLightPos = vec3<f32>(0.0, 8.0, 0.0);
                let pointLightDir = normalize(pointLightPos - input.worldPosition);
                let pointDistance = length(pointLightPos - input.worldPosition);
                let pointAttenuation = 1.0 / (1.0 + 0.09 * pointDistance + 0.032 * pointDistance * pointDistance);
                let pointDiffuse = max(dot(normal, pointLightDir), 0.0) * 0.6 * pointAttenuation;
                
                // Fill light
                let fillLightDir = normalize(vec3<f32>(-5.0, 5.0, -5.0) - input.worldPosition);
                let fillDiffuse = max(dot(normal, fillLightDir), 0.0) * 0.3;
                
                // Ambient lighting (matches WebGL)
                let ambient = 0.4;
                
                // Procedural texture to match WebGL concrete texture
                let textureScale = 20.0;
                let noise1 = sin(input.uv.x * textureScale) * sin(input.uv.y * textureScale);
                let noise2 = sin(input.uv.x * textureScale * 2.0) * sin(input.uv.y * textureScale * 2.0) * 0.5;
                let noise3 = sin(input.uv.x * textureScale * 4.0) * sin(input.uv.y * textureScale * 4.0) * 0.25;
                let totalNoise = (noise1 + noise2 + noise3) * 0.1;
                
                // Base color (concrete gray) with texture variation
                let baseColor = vec3<f32>(0.533, 0.533, 0.533) + vec3<f32>(totalNoise);
                
                // Combine all lighting
                let totalDiffuse = dirDiffuse + pointDiffuse + fillDiffuse;
                let finalColor = baseColor * (ambient + totalDiffuse);
                
                // Add specular highlight
                let viewDir = normalize(vec3<f32>(8.0, 6.0, 8.0) - input.worldPosition);
                let reflectDir = reflect(-dirLightDir, normal);
                let spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0) * 0.2;
                let specularColor = vec3<f32>(spec);
                
                return vec4<f32>(finalColor + specularColor, 1.0);
            }
        `;
        
        // Create shaders
        const vertexShader = this.device.createShaderModule({
            label: 'Helix Vertex Shader',
            code: vertexShaderCode
        });
        
        const fragmentShader = this.device.createShaderModule({
            label: 'Helix Fragment Shader',
            code: fragmentShaderCode
        });
        
        // Create uniform buffer
        this.uniformBuffer = this.device.createBuffer({
            size: 128, // Space for two 4x4 matrices
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        
        this.albedoTex = await this.loadTexture(
        'assets/TCom_Rock_CliffLayered_1.5x1.5_2K_albedo.png',
        { srgb: true }      // colour needs sRGB decode
        );
        this.normalTex = await this.loadTexture(
        'assets/TCom_Rock_CliffLayered_1.5x1.5_2K_normal.png'
        );
        this.heightTex = await this.loadTexture(
        'assets/TCom_Rock_CliffLayered_1.5x1.5_2K_height.png'
        );

        this.linearSampler = this.device.createSampler({
        magFilter:  'linear',
        minFilter:  'linear',
        addressModeU: 'repeat',
        addressModeV: 'repeat'
        });
        // Create bind group layout
        const bindGroupLayout = this.device.createBindGroupLayout({
            entries: [
    { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
      buffer: { type: 'uniform' } },

    { binding: 1, visibility: GPUShaderStage.FRAGMENT,
      texture: { sampleType: 'float' } },      // albedo

    { binding: 2, visibility: GPUShaderStage.FRAGMENT,
      texture: { sampleType: 'float' } },      // normal

    { binding: 3, visibility: GPUShaderStage.FRAGMENT,
      texture: { sampleType: 'float' } },      // height

    { binding: 4, visibility: GPUShaderStage.FRAGMENT,
      sampler: { type: 'filtering' } },        // sampler
  ]
        });
        
        // Create bind group
        this.bindGroup = this.device.createBindGroup({
            layout: bindGroupLayout,
            entries: [
    { binding: 0, resource: { buffer: uniformBuffer } },
    { binding: 1, resource:   albedoTex.createView()  },
    { binding: 2, resource:   normalTex.createView()  },
    { binding: 3, resource:   heightTex.createView()  },
    { binding: 4, resource:   linearSampler           },
  ]
        });
        
        // Create render pipeline
        this.renderPipeline = this.device.createRenderPipeline({
            label: 'Helix Render Pipeline',
            layout: this.device.createPipelineLayout({
                bindGroupLayouts: [bindGroupLayout]
            }),
            vertex: {
                module: vertexShader,
                entryPoint: 'main',
                buffers: [{
                    arrayStride: 32, // 3 floats position + 3 floats normal + 2 floats UV
                    attributes: [
                        { format: 'float32x3', offset: 0, shaderLocation: 0 }, // position
                        { format: 'float32x3', offset: 12, shaderLocation: 1 }, // normal
                        { format: 'float32x2', offset: 24, shaderLocation: 2 }  // uv
                    ]
                }]
            },
            fragment: {
                module: fragmentShader,
                entryPoint: 'main',
                targets: [{ format: this.format }]
            },
            primitive: {
                topology: 'triangle-list',
                frontFace: 'ccw',
                cullMode:  'front'
            },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: 'less',
                format: 'depth24plus'
            }
        });
        
        console.log('✅ WebGPU render pipeline created');
    }
    
    /**
     * Upload geometry data to WebGPU buffers
     */
    uploadGeometry(geometry) {
        if (!this.device || !geometry) return;
        
        console.log('📤 Uploading geometry to WebGPU...');
        
        const positions = geometry.attributes.position.array;
        const normals = geometry.attributes.normal.array;
        const uvs = geometry.attributes.uv.array;
        const indices = geometry.index.array;
        
        // Interleave vertex data (position, normal, uv)
        const vertexCount = positions.length / 3;
        const vertexData = new Float32Array(vertexCount * 8); // 3 + 3 + 2 = 8 floats per vertex
        
        for (let i = 0; i < vertexCount; i++) {
            const offset = i * 8;
            const posOffset = i * 3;
            const uvOffset = i * 2;
            
            // Position
            vertexData[offset] = positions[posOffset];
            vertexData[offset + 1] = positions[posOffset + 1];
            vertexData[offset + 2] = positions[posOffset + 2];
            
            // Normal
            vertexData[offset + 3] = normals[posOffset];
            vertexData[offset + 4] = normals[posOffset + 1];
            vertexData[offset + 5] = normals[posOffset + 2];
            
            // UV
            vertexData[offset + 6] = uvs[uvOffset];
            vertexData[offset + 7] = uvs[uvOffset + 1];
        }
        
        // Create vertex buffer
        if (this.vertexBuffer) {
            this.vertexBuffer.destroy();
        }
        
        this.vertexBuffer = this.device.createBuffer({
            size: vertexData.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
        });
        
        this.device.queue.writeBuffer(this.vertexBuffer, 0, vertexData);
        
        // Create index buffer
        if (this.indexBuffer) {
            this.indexBuffer.destroy();
        }
        
        this.indexBuffer = this.device.createBuffer({
            size: indices.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
        });
        
        this.device.queue.writeBuffer(this.indexBuffer, 0, indices);
        this.indexCount = indices.length;
        
        console.log(`✅ Geometry uploaded: ${vertexCount} vertices, ${this.indexCount / 3} triangles`);
    }
    
    /**
     * Update uniform buffer with matrices
     */
    updateUniforms(camera, helixMesh) {
        if (!this.uniformBuffer || !camera) return;
        
        // Get model matrix from the helix mesh (includes rotation)
        const modelMatrix = helixMesh ? helixMesh.matrixWorld : new THREE.Matrix4();
        const viewMatrix = camera.matrixWorldInverse;
        const projectionMatrix = camera.projectionMatrix;
        
        const mvpMatrix = new THREE.Matrix4()
            .multiplyMatrices(projectionMatrix, viewMatrix)
            .multiply(modelMatrix);
        
        // Create normal matrix from model matrix
        const normalMatrix = new THREE.Matrix3()
            .getNormalMatrix(modelMatrix);
        const normalMatrix4 = new THREE.Matrix4().setFromMatrix3(normalMatrix);
        
        // Pack matrices into uniform buffer
        const uniformData = new Float32Array(32); // 2 * 16 floats for matrices
        
        mvpMatrix.toArray(uniformData, 0);
        normalMatrix4.toArray(uniformData, 16);
        
        this.device.queue.writeBuffer(this.uniformBuffer, 0, uniformData);
    }
    
    /**
     * Render scene with geometry
     */
    render(scene, camera) {
        if (!this.device || !this.context || !this.renderPipeline) {
            return;
        }
        
        try {
            // Use direct helix mesh reference if available, otherwise search scene
            let helixMesh = this.helixMeshRef;
            if (!helixMesh) {
                scene.traverse((child) => {
                    if (child.isMesh && child.geometry && child.geometry.attributes.position) {
                        helixMesh = child;
                    }
                });
            }
            
            // Debug: log rotation if mesh found
            if (helixMesh) {
                // Make sure world matrix is up to date
                helixMesh.updateMatrixWorld();
                
                // Debug log every 60 frames
                if (Math.floor(performance.now() / 16) % 60 === 0) {
                    console.log('🔄 WebGPU Helix rotation Y:', helixMesh.rotation.y.toFixed(3));
                }
            } else {
                console.warn('⚠️ WebGPU: No helix mesh found for rotation');
            }
            
            // Update uniforms with helix transformation
            this.updateUniforms(camera, helixMesh);
            
            // Get current texture view
            const currentTexture = this.context.getCurrentTexture();
            const textureView = currentTexture.createView();
            
            // Update render pass descriptor
            this.renderPassDescriptor.colorAttachments[0].view = textureView;
            
            // Create command encoder
            const commandEncoder = this.device.createCommandEncoder({
                label: 'Render Command Encoder'
            });
            
            // Begin render pass
            const renderPass = commandEncoder.beginRenderPass(this.renderPassDescriptor);
            
            // Set pipeline based on wireframe mode
            const pipeline = this.wireframeMode ? this.wireframePipeline : this.renderPipeline;
            renderPass.setPipeline(pipeline);
            renderPass.setBindGroup(0, this.bindGroup);
            
            // Draw geometry if available
            if (this.vertexBuffer && this.indexBuffer && this.indexCount > 0) {
                renderPass.setVertexBuffer(0, this.vertexBuffer);
                renderPass.setIndexBuffer(this.indexBuffer, 'uint16');
                renderPass.drawIndexed(this.indexCount);
            }
            
            // End render pass
            renderPass.end();
            
            // Submit commands
            const commandBuffer = commandEncoder.finish();
            this.device.queue.submit([commandBuffer]);
            
        } catch (error) {
            console.error('WebGPU render error:', error);
        }
    }
    
    /**
     * Set renderer size
     */
    setSize(width, height) {
        if (this.canvas) {
            this.canvas.width = width;
            this.canvas.height = height;
            
            // Recreate depth texture
            if (this.device && this.depthTexture) {
                this.depthTexture.destroy();
                this.depthTexture = this.device.createTexture({
                    size: { width, height, depthOrArrayLayers: 1 },
                    format: 'depth24plus',
                    usage: GPUTextureUsage.RENDER_ATTACHMENT
                });
                this.renderPassDescriptor.depthStencilAttachment.view = this.depthTexture.createView();
            }
        }
    }
    
    /**
     * Get DOM element
     */
    getDomElement() {
        return this.canvas;
    }
    
    /**
     * Get capabilities
     */
    getCapabilities() {
        if (!this.adapter) {
            return {
                vendor: 'WebGPU',
                architecture: 'Unknown',
                device: 'Not Initialized',
                description: 'WebGPU Renderer (Not Ready)'
            };
        }
        
        return {
            vendor: 'WebGPU',
            architecture: this.adapter.info?.architecture || 'Unknown',
            device: this.adapter.info?.device || 'WebGPU Device', 
            description: this.adapter.info?.description || 'WebGPU Renderer',
            features: Array.from(this.adapter.features || []),
            limits: this.adapter.limits || {},
            preferredCanvasFormat: this.format,
            initialized: this.isInitialized
        };
    }
    
    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        return {
            frame: 0,
            calls: this.indexCount > 0 ? 1 : 0,
            triangles: this.indexCount / 3,
            points: 0,
            lines: 0,
            geometries: this.vertexBuffer ? 1 : 0,
            textures: 0,
            programs: 1,
            maxTextures: 'WebGPU'
        };
    }
    
    /**
     * Set helix mesh reference for rotation tracking
     */
    setHelixMesh(helixMesh) {
        this.helixMeshRef = helixMesh;
    }

    /**
     * Set wireframe mode
     */
    setWireframe(enabled) {
        this.wireframeMode = enabled;
        console.log(`🔧 WebGPU wireframe mode: ${enabled ? 'ON' : 'OFF'}`);
    }
    getDebugInfo() {
        return {
            type: 'WebGPU',
            version: '1.0',
            capabilities: this.getCapabilities(),
            performanceMetrics: this.getPerformanceMetrics(),
            errors: null,
            deviceLost: false,
            initialized: this.isInitialized,
            hasGeometry: this.indexCount > 0
        };
    }
    
    /**
     * Dispose of renderer resources
     */
    dispose() {
        console.log('🧹 Disposing WebGPU renderer...');
        
        try {
            if (this.vertexBuffer) {
                this.vertexBuffer.destroy();
                this.vertexBuffer = null;
            }
            
            if (this.indexBuffer) {
                this.indexBuffer.destroy();
                this.indexBuffer = null;
            }
            
            if (this.uniformBuffer) {
                this.uniformBuffer.destroy();
                this.uniformBuffer = null;
            }
            
            if (this.depthTexture) {
                this.depthTexture.destroy();
                this.depthTexture = null;
            }
            
            if (this.device && !this.device.lost) {
                this.device.destroy();
            }
        } catch (error) {
            console.warn('Error disposing WebGPU resources:', error);
        }
        
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        
        this.adapter = null;
        this.device = null;
        this.canvas = null;
        this.context = null;
        this.renderPassDescriptor = null;
        this.renderPipeline = null;
        this.bindGroup = null;
        this.isInitialized = false;
        this.indexCount = 0;
        
        console.log('✅ WebGPU renderer disposed');
    }
}