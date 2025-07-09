/**
 * Babylon.js Helix Parallax Mapping Application
 * 
 * Main application class that orchestrates the 3D helix visualization with parallax mapping.
 * Demonstrates real-time parallax occlusion mapping on a parametric helix geometry.
 * 
 * @author [Your Name]
 * @date [Current Date]
 * @version 1.0
 */

class BabylonHelixApp {
    constructor() {
        this.canvas = null;
        this.engine = null;
        this.scene = null;
        this.camera = null;
        this.helixMesh = null;
        this.material = null;
        this.shadowGenerator = null;
        
        // Components
        this.helixGeometry = null;
        this.performanceMonitor = null;
        this.uiControls = null;
        
        // Animation properties
        this.rotationSpeed = 0.01;
        this.isPaused = false;
        this.animationId = null;
        
        // Helix parameters
        this.helixParams = {
            radius: 2.5,
            height: 6,
            turns: 3,
            segments: 200,
            tubeSegments: 32,
            tubeRadius: 0.4
        };
        
        // Material parameters
        this.materialParams = {
            parallaxScale: 0.08,
            minLayers: 16,
            maxLayers: 32,
            parallaxOcclusion: true,
            wireframe: false
        };
        
        // Texture references
        this.albedoTexture = null;
        this.normalTexture = null;
        this.heightTexture = null;
    }

    /**
     * Initialize the application
     */
    async init() {
        console.log('🚀 Initializing Babylon.js Helix App...');
        
        try {
            // Initialize components
            this.helixGeometry = new HelixGeometry(this.helixParams);
            this.performanceMonitor = new PerformanceMonitor();
            
            // Setup Babylon.js
            await this.setupBabylonEngine();
            await this.setupScene();
            await this.setupCamera();
            await this.setupLighting();
            await this.createHelix();
            
            // Initialize UI controls
            this.uiControls = new UIControls(this);
            
            // Start render loop
            this.startRenderLoop();
            
            // Setup window resize handling
            this.setupWindowResize();
            
            console.log('✅ Babylon.js Helix App initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize app:', error);
            this.showError('Failed to initialize: ' + error.message);
        }
    }

    /**
     * Setup Babylon.js engine
     */
    async setupBabylonEngine() {
        this.canvas = document.getElementById('renderCanvas');
        
        if (!this.canvas) {
            throw new Error('Canvas element not found');
        }
        
        // Create engine with high-performance settings
        this.engine = new BABYLON.Engine(this.canvas, true, {
            preserveDrawingBuffer: true,
            stencil: true,
            antialias: true,
            alpha: false,
            powerPreference: "high-performance"
        });
        
        // Log engine information
        const engineType = this.engine.isWebGPU ? 'WebGPU' : 
                          this.engine._webGLVersion > 1 ? 'WebGL2' : 'WebGL1';
        console.log(`🎨 Engine initialized: ${engineType}`);
        
        // Update UI
        document.getElementById('current-engine').textContent = `Babylon.js (${engineType})`;
    }

    /**
     * Setup the 3D scene
     */
    async setupScene() {
        this.scene = new BABYLON.Scene(this.engine);
        this.scene.clearColor = new BABYLON.Color3(0.13, 0.13, 0.13);
        
        // Enable physics if needed (optional)
        // this.scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), new BABYLON.CannonJSPlugin());
        
        console.log('✅ Scene created');
    }

    /**
     * Setup the camera
     */
    async setupCamera() {
        // Create arc rotate camera for optimal viewing
        this.camera = new BABYLON.ArcRotateCamera(
            "camera",
            -Math.PI / 4,    // Alpha (horizontal rotation)
            Math.PI / 3,     // Beta (vertical rotation)
            12,              // Radius (distance from target)
            BABYLON.Vector3.Zero(),  // Target position
            this.scene
        );
        
        // Set camera target and attach controls
        this.camera.setTarget(BABYLON.Vector3.Zero());
        this.camera.attachControl(this.canvas, true);
        
        // Configure camera limits for better UX
        this.camera.wheelPrecision = 50;
        this.camera.lowerRadiusLimit = 4;
        this.camera.upperRadiusLimit = 25;
        this.camera.lowerBetaLimit = 0.1;
        this.camera.upperBetaLimit = Math.PI * 0.9;
        
        console.log('✅ Camera setup complete');
    }

    /**
     * Setup lighting system
     */
    async setupLighting() {
        // Ambient light for general illumination
        const ambientLight = new BABYLON.HemisphericLight(
            "ambientLight",
            new BABYLON.Vector3(0, 1, 0),
            this.scene
        );
        ambientLight.intensity = 0.3;
        ambientLight.diffuse = new BABYLON.Color3(1, 1, 1);
        
        // Main directional light
        const directionalLight = new BABYLON.DirectionalLight(
            "directionalLight",
            new BABYLON.Vector3(-0.5, -1, -0.5),
            this.scene
        );
        directionalLight.intensity = 1.2;
        directionalLight.diffuse = new BABYLON.Color3(1, 1, 0.9);
        
        // Setup shadow system
        this.shadowGenerator = new BABYLON.ShadowGenerator(2048, directionalLight);
        this.shadowGenerator.useExponentialShadowMap = true;
        this.shadowGenerator.darkness = 0.5;
        
        // Additional point light for accent lighting
        const pointLight = new BABYLON.PointLight(
            "pointLight",
            new BABYLON.Vector3(3, 8, 3),
            this.scene
        );
        pointLight.intensity = 0.8;
        pointLight.diffuse = new BABYLON.Color3(0.7, 0.9, 1);
        pointLight.range = 20;
        
        // Add ground plane for shadows
        this.createGround();
        
        console.log('✅ Lighting system setup complete');
    }

    /**
     * Create ground plane for shadow reception
     */
    createGround() {
        const ground = BABYLON.MeshBuilder.CreateGround(
            "ground", 
            { width: 20, height: 20 }, 
            this.scene
        );
        
        ground.position.y = -this.helixParams.height / 2 - 1;
        ground.receiveShadows = true;
        
        // Create ground material
        const groundMaterial = new BABYLON.StandardMaterial("groundMaterial", this.scene);
        groundMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.25);
        groundMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        groundMaterial.roughness = 0.8;
        ground.material = groundMaterial;
    }

    /**
     * Create the helix mesh with parallax material
     */
    async createHelix() {
        console.log('🌀 Creating helix geometry...');
        
        try {
            // Update geometry parameters
            this.helixGeometry.updateParams(this.helixParams);
            
            // Generate vertex data
            const vertexData = this.helixGeometry.generateVertexData();
            
            // Create mesh
            this.helixMesh = new BABYLON.Mesh("helix", this.scene);
            this.helixMesh.setVerticesData(BABYLON.VertexBuffer.PositionKind, vertexData.positions);
            this.helixMesh.setVerticesData(BABYLON.VertexBuffer.NormalKind, vertexData.normals);
            this.helixMesh.setVerticesData(BABYLON.VertexBuffer.UVKind, vertexData.uvs);
            this.helixMesh.setVerticesData(BABYLON.VertexBuffer.TangentKind, vertexData.tangents);
            this.helixMesh.setIndices(vertexData.indices);
            
            // Create parallax material
            await this.createParallaxMaterial();
            
            // Enable shadow casting and receiving
            this.helixMesh.receiveShadows = true;
            if (this.shadowGenerator) {
                this.shadowGenerator.addShadowCaster(this.helixMesh);
            }
            
            // Update performance monitor with geometry info
            const vertexCount = vertexData.positions.length / 3;
            const triangleCount = vertexData.indices.length / 3;
            this.performanceMonitor.updateGeometryInfo(vertexCount, triangleCount);
            
            console.log(`✅ Helix created: ${vertexCount} vertices, ${triangleCount} triangles`);
            
        } catch (error) {
            console.error('❌ Failed to create helix:', error);
            this.showError('Failed to create helix: ' + error.message);
        }
    }

    /**
     * Create parallax mapping material
     */
    async createParallaxMaterial() {
        console.log('🎨 Creating parallax material...');
        
        try {
            // Create StandardMaterial for parallax mapping
            this.material = new BABYLON.StandardMaterial("parallaxMaterial", this.scene);
            
            // Load textures
            console.log('📁 Loading texture assets...');
            
            // Load albedo texture
            this.albedoTexture = new BABYLON.Texture("assets/TCom_Rock_CliffLayered_1.5x1.5_2K_albedo.png", this.scene);
            this.setupTexture(this.albedoTexture);
            
            // Load normal map
            this.normalTexture = new BABYLON.Texture("assets/TCom_Rock_CliffLayered_1.5x1.5_2K_normal.png", this.scene);
            this.setupTexture(this.normalTexture);
            
            // Load height map (crucial for parallax)
            this.heightTexture = new BABYLON.Texture("assets/TCom_Rock_CliffLayered_1.5x1.5_2K_height.png", this.scene);
            this.setupTexture(this.heightTexture);
            
            // Wait for textures to load
            await this.waitForTextures();
            
            // Configure material
            this.material.diffuseTexture = this.albedoTexture;
            this.material.bumpTexture = this.normalTexture;
            this.material.heightTexture = this.heightTexture;
            
            // Configure parallax mapping
            this.material.useParallax = true;
            this.material.useParallaxOcclusion = this.materialParams.parallaxOcclusion;
            this.material.parallaxScaleBias = this.materialParams.parallaxScale;
            this.material.invertNormalMapX = false;
            this.material.invertNormalMapY = false;
            
            // Enhanced material properties
            this.material.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
            this.material.roughness = 0.8;
            this.material.maxSimultaneousLights = 4;
            
            // Apply to mesh
            if (this.helixMesh) {
                this.helixMesh.material = this.material;
            }
            
            console.log('✅ Parallax material created successfully');
            
        } catch (error) {
            console.warn('⚠️ Failed to load texture assets, using fallback:', error);
            await this.createFallbackMaterial();
        }
    }

    /**
     * Setup texture properties
     * @param {BABYLON.Texture} texture - Texture to configure
     */
    setupTexture(texture) {
        texture.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
        texture.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
        texture.uScale = 3;
        texture.vScale = 1;
    }

    /**
     * Wait for all textures to load
     */
    async waitForTextures() {
        const textures = [this.albedoTexture, this.normalTexture, this.heightTexture];
        
        const loadPromises = textures.map(texture => {
            return new Promise((resolve) => {
                if (texture.isReady()) {
                    resolve();
                } else {
                    texture.onLoadObservable.add(() => resolve());
                    setTimeout(() => resolve(), 5000); // 5-second timeout
                }
            });
        });
        
        await Promise.all(loadPromises);
        console.log('✅ All textures loaded');
    }

    /**
     * Create fallback material with procedural textures
     */
    async createFallbackMaterial() {
        console.log('🎨 Creating fallback material...');
        
        this.material = new BABYLON.StandardMaterial("fallbackMaterial", this.scene);
        
        // Create procedural textures
        this.createProceduralTextures();
        
        // Configure material
        this.material.diffuseTexture = this.albedoTexture;
        this.material.bumpTexture = this.normalTexture;
        this.material.heightTexture = this.heightTexture;
        
        // Enable parallax
        this.material.useParallax = true;
        this.material.useParallaxOcclusion = this.materialParams.parallaxOcclusion;
        this.material.parallaxScaleBias = this.materialParams.parallaxScale;
        
        // Apply to mesh
        if (this.helixMesh) {
            this.helixMesh.material = this.material;
        }
        
        console.log('✅ Fallback material created');
    }

    /**
     * Create procedural textures for fallback
     */
    createProceduralTextures() {
        // Create albedo texture
        this.albedoTexture = new BABYLON.DynamicTexture("proceduralAlbedo", { width: 512, height: 512 }, this.scene);
        this.generateProceduralAlbedo();
        
        // Create height texture
        this.heightTexture = new BABYLON.DynamicTexture("proceduralHeight", { width: 256, height: 256 }, this.scene);
        this.generateProceduralHeight();
        
        // Create normal texture
        this.normalTexture = new BABYLON.DynamicTexture("proceduralNormal", { width: 256, height: 256 }, this.scene);
        this.generateProceduralNormal();
    }

    /**
     * Generate procedural albedo texture
     */
    generateProceduralAlbedo() {
        const context = this.albedoTexture.getContext();
        const imageData = context.createImageData(512, 512);
        const data = imageData.data;
        
        for (let y = 0; y < 512; y++) {
            for (let x = 0; x < 512; x++) {
                const i = (y * 512 + x) * 4;
                
                // Multi-scale noise for rock texture
                let noise = 0;
                noise += Math.sin(x * 0.005) * Math.sin(y * 0.005) * 0.4;
                noise += Math.sin(x * 0.02) * Math.sin(y * 0.02) * 0.3;
                noise += Math.sin(x * 0.08) * Math.sin(y * 0.08) * 0.2;
                noise += (Math.random() - 0.5) * 0.15;
                
                // Rock color
                const baseR = 120, baseG = 100, baseB = 80;
                const variation = noise * 50;
                
                data[i] = Math.max(0, Math.min(255, baseR + variation));
                data[i + 1] = Math.max(0, Math.min(255, baseG + variation * 0.8));
                data[i + 2] = Math.max(0, Math.min(255, baseB + variation * 0.6));
                data[i + 3] = 255;
            }
        }
        
        context.putImageData(imageData, 0, 0);
        this.albedoTexture.update();
        this.setupTexture(this.albedoTexture);
    }

    /**
     * Generate procedural height texture
     */
    generateProceduralHeight() {
        const context = this.heightTexture.getContext();
        const imageData = context.createImageData(256, 256);
        const data = imageData.data;
        
        for (let y = 0; y < 256; y++) {
            for (let x = 0; x < 256; x++) {
                const i = (y * 256 + x) * 4;
                
                // Height field generation
                let height = 0;
                height += Math.sin(x * 0.01) * Math.sin(y * 0.01) * 0.5;
                height += Math.sin(x * 0.03) * Math.sin(y * 0.03) * 0.3;
                height += Math.sin(x * 0.08) * Math.sin(y * 0.08) * 0.15;
                height += (Math.random() - 0.5) * 0.1;
                
                // Normalize to 0-255 range
                const heightValue = Math.floor((height + 1) * 127.5);
                const clampedHeight = Math.max(0, Math.min(255, heightValue));
                
                data[i] = clampedHeight;
                data[i + 1] = clampedHeight;
                data[i + 2] = clampedHeight;
                data[i + 3] = 255;
            }
        }
        
        context.putImageData(imageData, 0, 0);
        this.heightTexture.update();
        this.setupTexture(this.heightTexture);
    }

    /**
     * Generate procedural normal texture
     */
    generateProceduralNormal() {
        const context = this.normalTexture.getContext();
        const imageData = context.createImageData(256, 256);
        const data = imageData.data;
        
        // Generate height field for normal calculation
        const heights = new Array(256 * 256);
        for (let y = 0; y < 256; y++) {
            for (let x = 0; x < 256; x++) {
                let height = 0;
                height += Math.sin(x * 0.01) * Math.sin(y * 0.01) * 0.5;
                height += Math.sin(x * 0.03) * Math.sin(y * 0.03) * 0.3;
                height += Math.sin(x * 0.08) * Math.sin(y * 0.08) * 0.15;
                heights[y * 256 + x] = height;
            }
        }
        
        // Calculate normals from height field
        for (let y = 0; y < 256; y++) {
            for (let x = 0; x < 256; x++) {
                const i = (y * 256 + x) * 4;
                
                // Sample neighboring heights
                const hL = heights[y * 256 + Math.max(0, x - 1)];
                const hR = heights[y * 256 + Math.min(255, x + 1)];
                const hD = heights[Math.max(0, y - 1) * 256 + x];
                const hU = heights[Math.min(255, y + 1) * 256 + x];
                
                // Calculate surface normal
                const strength = 2.0;
                const dx = (hR - hL) * strength;
                const dy = (hU - hD) * strength;
                const dz = 1.0;
                
                const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
                const nx = dx / length;
                const ny = dy / length;
                const nz = dz / length;
                
                // Store as normal map (0-255 range)
                data[i] = Math.floor((nx * 0.5 + 0.5) * 255);
                data[i + 1] = Math.floor((ny * 0.5 + 0.5) * 255);
                data[i + 2] = Math.floor((nz * 0.5 + 0.5) * 255);
                data[i + 3] = 255;
            }
        }
        
        context.putImageData(imageData, 0, 0);
        this.normalTexture.update();
        this.setupTexture(this.normalTexture);
    }

    /**
     * Update material properties
     */
    updateMaterial() {
        if (!this.material) return;
        
        // Update parallax settings
        this.material.useParallax = this.materialParams.parallaxScale > 0;
        this.material.useParallaxOcclusion = this.materialParams.parallaxOcclusion;
        this.material.parallaxScaleBias = this.materialParams.parallaxScale;
        
        // Update wireframe
        this.material.wireframe = this.materialParams.wireframe;
        
        // Force material refresh
        this.material.markDirty();
        if (this.scene) {
            this.scene.markAllMaterialsAsDirty(BABYLON.Material.AllDirtyFlag);
        }
        
        console.log(`🔧 Material updated - Parallax: ${this.materialParams.parallaxScale}, Occlusion: ${this.materialParams.parallaxOcclusion}`);
    }

    /**
     * Recreate helix with new parameters
     */
    async recreateHelix() {
        console.log('🔄 Recreating helix...');
        
        // Dispose existing mesh
        if (this.helixMesh) {
            this.helixMesh.dispose();
            this.helixMesh = null;
        }
        
        // Create new helix
        await this.createHelix();
    }

    /**
     * Switch rendering engine
     * @param {string} type - Engine type ('webgl1', 'webgl2', 'webgpu')
     */
    async switchRenderer(type) {
        console.log(`🔄 Switching to ${type}...`);
        
        try {
            // Store current parameters
            const currentMaterialParams = { ...this.materialParams };
            const currentHelixParams = { ...this.helixParams };
            
            // Stop current render loop
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
                this.animationId = null;
            }
            
            // Dispose current engine
            if (this.engine) {
                this.engine.dispose();
                this.engine = null;
            }
            
            // Dispose current scene
            if (this.scene) {
                this.scene.dispose();
                this.scene = null;
            }
            
            // Create fresh canvas for WebGPU
            if (type === 'webgpu') {
                await this.createFreshCanvas();
            }
            
            // Create new engine
            await this.createEngineForType(type);
            
            // Restore parameters
            this.materialParams = currentMaterialParams;
            this.helixParams = currentHelixParams;
            
            // Recreate scene
            await this.setupScene();
            await this.setupCamera();
            await this.setupLighting();
            await this.createHelix();
            
            // Update UI controls
            if (this.uiControls) {
                this.uiControls.syncControlsWithState(this.materialParams);
            }
            
            // Start render loop
            this.startRenderLoop();
            
            // Setup window resize handling
            this.setupWindowResize();
            
            // Update UI
            const engineType = this.engine.isWebGPU ? 'WebGPU' : 
                              this.engine._webGLVersion > 1 ? 'WebGL2' : 'WebGL1';
            document.getElementById('current-engine').textContent = `Babylon.js (${engineType})`;
            
            console.log(`✅ Successfully switched to ${engineType}`);
            
        } catch (error) {
            console.error(`❌ Failed to switch to ${type}:`, error);
            this.showError(`Failed to switch to ${type}: ${error.message}`);
            
            // Fallback to WebGL2
            if (type === 'webgpu') {
                console.log('🔄 Falling back to WebGL2...');
                setTimeout(() => {
                    document.getElementById('renderer-select').value = 'webgl2';
                    this.switchRenderer('webgl2');
                }, 500);
            }
        }
    }

    /**
     * Create fresh canvas for WebGPU
     */
    async createFreshCanvas() {
        const oldCanvas = this.canvas;
        
        // Create new canvas
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'renderCanvas';
        this.canvas.style.cssText = 'width: 100%; height: 100vh; display: block; touch-action: none;';
        
        // Replace old canvas
        if (oldCanvas && oldCanvas.parentNode) {
            oldCanvas.parentNode.replaceChild(this.canvas, oldCanvas);
        }
        
        console.log('🔄 Created fresh canvas for WebGPU');
    }

    /**
     * Create engine for specific type
     * @param {string} type - Engine type
     */
    async createEngineForType(type) {
        const commonOptions = {
            preserveDrawingBuffer: true,
            stencil: true,
            antialias: true,
            alpha: false,
            powerPreference: "high-performance"
        };
        
        switch (type) {
            case 'webgl1':
                this.engine = new BABYLON.Engine(this.canvas, true, {
                    ...commonOptions,
                    disableWebGL2Support: true
                });
                break;
                
            case 'webgl2':
                this.engine = new BABYLON.Engine(this.canvas, true, commonOptions);
                break;
                
            case 'webgpu':
                await this.createWebGPUEngine();
                break;
                
            default:
                throw new Error(`Unknown engine type: ${type}`);
        }
    }

    /**
     * Create WebGPU engine
     */
    async createWebGPUEngine() {
        if (!navigator.gpu) {
            throw new Error('WebGPU not supported. Enable in Chrome: chrome://flags/#enable-unsafe-webgpu');
        }
        
        // Test adapter
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
            throw new Error('WebGPU adapter not available');
        }
        
        // Create WebGPU engine
        this.engine = new BABYLON.WebGPUEngine(this.canvas, {
            antialias: true,
            alpha: false
        });
        
        // Initialize with timeout
        const initPromise = this.engine.initAsync();
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('WebGPU initialization timeout')), 10000);
        });
        
        await Promise.race([initPromise, timeoutPromise]);
        
        if (!this.engine.isWebGPU) {
            throw new Error('WebGPU engine creation failed');
        }
        
        console.log('✅ WebGPU engine initialized');
    }

    /**
     * Start the render loop
     */
    startRenderLoop() {
        this.engine.runRenderLoop(() => {
            // Update performance monitor
            this.performanceMonitor.update();
            
            // Animate helix rotation
            if (this.helixMesh && !this.isPaused) {
                this.helixMesh.rotation.y += this.rotationSpeed;
            }
            
            // Render scene
            this.scene.render();
        });
        
        console.log('🎬 Render loop started');
    }

    /**
     * Setup window resize handling
     */
    setupWindowResize() {
        window.addEventListener('resize', () => {
            if (this.engine) {
                this.engine.resize();
            }
        });
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        console.error('❌', message);
        if (this.performanceMonitor) {
            this.performanceMonitor.showTestStatus(message, 'error');
        }
    }

    /**
     * Dispose of all resources
     */
    dispose() {
        console.log('🧹 Disposing Babylon.js app...');
        
        // Cleanup UI controls
        if (this.uiControls) {
            this.uiControls.cleanup();
        }
        
        // Stop render loop
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // Dispose engine
        if (this.engine) {
            this.engine.dispose();
        }
        
        console.log('✅ Babylon.js app disposed');
    }
}

// Export for use in other modules
window.BabylonHelixApp = BabylonHelixApp;