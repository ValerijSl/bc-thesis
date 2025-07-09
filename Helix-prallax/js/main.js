// main.js
// Fixed main application controller - proper helix and WebGPU fixes

import { HelixGeometry } from './helix-geometry.js';
import { WebGLRenderer } from './webgl-renderer.js';
import { WebGL2Renderer } from './webgl2-renderer.js';
import { WebGPURenderer } from './webgpu-renderer.js';
import { PerformanceMonitor } from './performance-monitor.js';
import { UIController } from './ui-controller.js';

class ParallaxHelixApp {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.helixMesh = null;
        this.helixMaterial = null;
        
        this.currentRenderer = 'webgl';
        this.rendererInstances = {
            webgl: null,
            webgl2: null,
            webgpu: null
        };
        
        this.performanceMonitor = new PerformanceMonitor();
        this.uiController = new UIController(this);
        
        this.animationId = null;
        this.isRunning = false;
        
        // Enhanced parameters for better parallax
        this.enhancedParams = {
            parallaxScale: 0.08,
            steepParallax: false,
            parallaxShadows: false,
            wireframe: false
        };
        
        // Texture loader
        this.textureLoader = new THREE.TextureLoader();
        
        // Add error handler
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
        });
    }
    
    async init() {
        console.log('🚀 Initializing Parallax Helix Application...');
        
        try {
            // Check if Three.js is loaded
            if (typeof THREE === 'undefined') {
                throw new Error('Three.js not loaded');
            }
            
            this.setupScene();
            await this.initRenderer(this.currentRenderer);
            await this.createHelix();
            this.setupEventListeners();
            this.startRenderLoop();
            
            console.log('✅ Application initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize application:', error);
            this.showError('Failed to initialize application: ' + error.message);
        }
    }
    
    setupScene() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x222222);
        this.scene.fog = new THREE.Fog(0x222222, 20, 100);
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight, 
            0.1, 
            1000
        );
        
        // Position camera to see helix
        this.camera.position.set(8, 6, 8);
        this.camera.lookAt(0, 0, 0);
        
        // Add lights
        this.setupLighting();
        
        // Add ground plane
        this.addGroundPlane();
        
        // Add coordinate helper
        const axesHelper = new THREE.AxesHelper(5);
        this.scene.add(axesHelper);
        
        console.log('📦 Scene setup complete');
    }
    
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);
        
        // Directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 15, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.camera.near = 0.1;
        directionalLight.shadow.camera.far = 100;
        directionalLight.shadow.camera.left = -20;
        directionalLight.shadow.camera.right = 20;
        directionalLight.shadow.camera.top = 20;
        directionalLight.shadow.camera.bottom = -20;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
        
        // Point light
        const pointLight = new THREE.PointLight(0x4488ff, 0.6, 30);
        pointLight.position.set(0, 8, 0);
        this.scene.add(pointLight);
        
        // Fill light
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-5, 5, -5);
        this.scene.add(fillLight);
    }
    
    addGroundPlane() {
        const groundGeometry = new THREE.PlaneGeometry(30, 30);
        const groundMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x333333,
            transparent: true,
            opacity: 0.8
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -5;
        ground.receiveShadow = true;
        this.scene.add(ground);
    }
    
    async initRenderer(type) {
        console.log(`🎨 Initializing ${type.toUpperCase()} renderer...`);
        
        // Dispose previous renderer
        if (this.renderer) {
            this.renderer.dispose();
            if (this.renderer.getDomElement && this.renderer.getDomElement()) {
                const domElement = this.renderer.getDomElement();
                if (domElement.parentNode) {
                    domElement.parentNode.removeChild(domElement);
                }
            }
        }
        
        // Dispose controls
        if (this.controls) {
            this.controls.dispose();
            this.controls = null;
        }
        
        try {
            // Create new renderer with fallback
            switch (type) {
                case 'webgl':
                    if (!this.rendererInstances.webgl) {
                        this.rendererInstances.webgl = new WebGLRenderer();
                    }
                    this.renderer = this.rendererInstances.webgl;
                    break;
                    
                case 'webgl2':
                    const canvas = document.createElement('canvas');
                    const gl2 = canvas.getContext('webgl2');
                    if (!gl2) {
                        console.warn('WebGL2 not supported, falling back to WebGL');
                        return this.initRenderer('webgl');
                    }
                    
                    if (!this.rendererInstances.webgl2) {
                        this.rendererInstances.webgl2 = new WebGL2Renderer();
                    }
                    this.renderer = this.rendererInstances.webgl2;
                    break;
                    
                case 'webgpu':
                    if (!navigator.gpu) {
                        console.warn('WebGPU not supported, falling back to WebGL');
                        return this.initRenderer('webgl');
                    }
                    
                    try {
                        if (!this.rendererInstances.webgpu) {
                            this.rendererInstances.webgpu = new WebGPURenderer();
                        }
                        this.renderer = this.rendererInstances.webgpu;
                        await this.renderer.init();
                    } catch (webgpuError) {
                        console.warn('WebGPU initialization failed:', webgpuError);
                        return this.initRenderer('webgl');
                    }
                    break;
                    
                default:
                    throw new Error(`Unknown renderer type: ${type}`);
            }
            
            // Setup renderer
            await this.renderer.setup(window.innerWidth, window.innerHeight);
            const domElement = this.renderer.getDomElement();
            if (domElement) {
                document.body.appendChild(domElement);
            }
            
            // Setup controls
            this.setupControls();
            
            this.currentRenderer = type;
            this.uiController.updateRendererDisplay(type);
            
            console.log(`✅ ${type.toUpperCase()} renderer initialized`);
            
        } catch (error) {
            console.error(`❌ Failed to initialize ${type} renderer:`, error);
            
            if (type !== 'webgl') {
                console.log('🔄 Falling back to WebGL...');
                await this.initRenderer('webgl');
                this.uiController.showError(`${type.toUpperCase()} not supported, using WebGL`);
            } else {
                this.createFallbackRenderer();
                throw error;
            }
        }
    }
    
    createFallbackRenderer() {
        console.log('Creating fallback renderer...');
        try {
            this.renderer = new THREE.WebGLRenderer({
                antialias: false,
                alpha: false
            });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            document.body.appendChild(this.renderer.domElement);
            
            this.renderer.setup = async (w, h) => {
                this.renderer.setSize(w, h);
            };
            this.renderer.getDomElement = () => this.renderer.domElement;
            this.renderer.dispose = () => {
                if (this.renderer.domElement && this.renderer.domElement.parentNode) {
                    this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
                }
            };
            
        } catch (fallbackError) {
            console.error('Even fallback renderer failed:', fallbackError);
        }
    }
    
    setupControls() {
        const domElement = this.renderer?.getDomElement();
        if (!domElement) {
            console.warn('⚠️ Cannot setup controls: renderer DOM element not available');
            return;
        }
        
        try {
            this.controls = new THREE.OrbitControls(this.camera, domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.screenSpacePanning = false;
            this.controls.minDistance = 3;
            this.controls.maxDistance = 30;
            this.controls.maxPolarAngle = Math.PI;
            this.controls.target.set(0, 0, 0);
        } catch (error) {
            console.error('Failed to setup controls:', error);
        }
    }
    
    async createHelix() {
        console.log('🌀 Creating helix geometry...');
        
        try {
            // Remove existing helix
            if (this.helixMesh) {
                this.scene.remove(this.helixMesh);
                if (this.helixMesh.geometry) this.helixMesh.geometry.dispose();
                if (this.helixMesh.material) this.helixMesh.material.dispose();
            }
            
            // Create helix geometry - FORCE SUCCESS
            let geometry;
            
            try {
                const helixGeometry = new HelixGeometry();
                geometry = helixGeometry.create(
                    2,    // radius
                    5,    // height
                    150,  // segments
                    24,   // radialSegments
                    3     // turns
                );
                console.log('✅ Helix geometry created successfully');
            } catch (geoError) {
                console.error('❌ HelixGeometry failed, creating manual helix:', geoError);
                geometry = this.createManualHelixGeometry();
            }
            
            // Create material based on renderer type and settings
            let material;
            if (this.currentRenderer === 'webgpu') {
                // Simple material for WebGPU (won't be used, but needed for Three.js mesh)
                material = new THREE.MeshBasicMaterial({
                    color: 0x888888,
                    wireframe: false
                });
                
                // Upload geometry to WebGPU
                if (this.renderer && this.renderer.uploadGeometry) {
                    this.renderer.uploadGeometry(geometry);
                }
            } else {
                // Try standard material
                material = this.createStandardMaterial();
            }
            
            // Create mesh
            this.helixMesh = new THREE.Mesh(geometry, material);
            this.helixMaterial = material;
            
            // Position the helix
            this.helixMesh.position.set(0, 0, 0);
            this.helixMesh.castShadow = true;
            this.helixMesh.receiveShadow = true;
            
            // Add to scene
            this.scene.add(this.helixMesh);
            
            // Update UI info
            this.uiController.updateGeometryInfo(geometry);
            
            // Position camera
            this.camera.position.set(8, 6, 8);
            this.camera.lookAt(0, 0, 0);
            
            console.log('✅ Helix created and positioned successfully');
            
        } catch (error) {
            console.error('❌ Complete helix creation failed:', error);
            // Don't create fallback torus - create simple helix instead
            this.createSimpleHelixFallback();
        }
    }
    
    createManualHelixGeometry() {
        console.log('🔧 Creating manual helix geometry...');
        
        const geometry = new THREE.BufferGeometry();
        const radius = 2;
        const height = 5;
        const segments = 100;
        const turns = 3;
        const tubeRadius = 0.3;
        const tubeSides = 16;
        
        const vertices = [];
        const indices = [];
        const normals = [];
        const uvs = [];
        
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const angle = t * Math.PI * 2 * turns;
            const y = (t - 0.5) * height;
            
            const centerX = Math.cos(angle) * radius;
            const centerZ = Math.sin(angle) * radius;
            
            // Calculate tangent for proper tube orientation
            const tangentX = -Math.sin(angle);
            const tangentZ = Math.cos(angle);
            const tangentY = height / (Math.PI * 2 * turns);
            
            // Normalize tangent
            const tangentLength = Math.sqrt(tangentX * tangentX + tangentY * tangentY + tangentZ * tangentZ);
            const tX = tangentX / tangentLength;
            const tY = tangentY / tangentLength;
            const tZ = tangentZ / tangentLength;
            
            // Binormal (points outward from helix center)
            const binormalX = Math.cos(angle);
            const binormalZ = Math.sin(angle);
            
            // Normal (cross product of tangent and binormal)
            const normalX = tY * binormalZ;
            const normalY = tZ * binormalX - tX * binormalZ;
            const normalZ = -tY * binormalX;
            
            for (let j = 0; j <= tubeSides; j++) {
                const tubeAngle = (j / tubeSides) * Math.PI * 2;
                
                // Calculate position on tube surface
                const localX = Math.cos(tubeAngle) * binormalX + Math.sin(tubeAngle) * normalX;
                const localY = Math.sin(tubeAngle) * normalY;
                const localZ = Math.cos(tubeAngle) * binormalZ + Math.sin(tubeAngle) * normalZ;
                
                const x = centerX + localX * tubeRadius;
                const yPos = y + localY * tubeRadius;
                const z = centerZ + localZ * tubeRadius;
                
                vertices.push(x, yPos, z);
                
                // Surface normal for lighting
                normals.push(localX, localY, localZ);
                
                // UV coordinates
                uvs.push(t * turns * 2, j / tubeSides);
                
                // Create triangles
                if (i < segments && j < tubeSides) {
                    const current = i * (tubeSides + 1) + j;
                    const next = current + tubeSides + 1;
                    
                    indices.push(
                        current, next, current + 1,
                        next, next + 1, current + 1
                    );
                }
            }
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geometry.setIndex(indices);
        geometry.computeBoundingSphere();
        
        console.log(`✅ Manual helix created: ${vertices.length/3} vertices, ${indices.length/3} triangles`);
        return geometry;
    }
    
    createSimpleHelixFallback() {
        console.log('🔄 Creating simple helix fallback...');
        
        // Create a simple helix using CylinderGeometry as base and deform it
        const geometry = new THREE.CylinderGeometry(0.3, 0.3, 5, 16, 100, false);
        const positions = geometry.attributes.position.array;
        
        // Deform cylinder into helix
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const y = positions[i + 1];
            const z = positions[i + 2];
            
            // Calculate helix parameters
            const heightRatio = (y + 2.5) / 5; // Normalize height to 0-1
            const angle = heightRatio * Math.PI * 2 * 3; // 3 turns
            const helixRadius = 2;
            
            // Apply helix transformation
            const newX = Math.cos(angle) * (helixRadius + x);
            const newZ = Math.sin(angle) * (helixRadius + x);
            
            positions[i] = newX;
            positions[i + 2] = newZ;
        }
        
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();
        
        const material = new THREE.MeshPhongMaterial({ 
            color: 0x4CAF50,
            wireframe: false,
            shininess: 100
        });
        
        this.helixMesh = new THREE.Mesh(geometry, material);
        this.helixMaterial = material;
        this.scene.add(this.helixMesh);
        
        console.log('✅ Simple helix fallback created');
    }
    
    createStandardMaterial() {
        console.log('🎨 Creating standard material...');
        
        const material = new THREE.MeshStandardMaterial({
            map: this.createProceduralTexture(),
            color: 0xffffff,
            metalness: 0.2,
            roughness: 0.8,
            wireframe: false,
            side: THREE.DoubleSide
        });
        
        console.log('✅ Standard material created');
        return material;
    }
    
    createProceduralTexture() {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Create concrete-like base
        ctx.fillStyle = '#888888';
        ctx.fillRect(0, 0, size, size);
        
        // Add texture details
        for (let i = 0; i < 300; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const radius = Math.random() * 12 + 2;
            const brightness = 0.3 + Math.random() * 0.4;
            const gray = Math.floor(brightness * 255);
            
            ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
            ctx.globalAlpha = 0.4;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.globalAlpha = 1.0;
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.generateMipmaps = true;
        
        return texture;
    }
    
    // FIX: Add the missing getHelixParameters method that UI controller expects
    getHelixParameters() {
        return {
            radius: 2,
            height: 5,
            wireframe: this.enhancedParams.wireframe
        };
    }
    
    updateHelixParameters(params) {
        console.log('🔧 Updating helix parameters...', params);
        
        // Update enhanced params
        Object.assign(this.enhancedParams, params);
        
        // Handle WebGPU-specific updates
        if (this.currentRenderer === 'webgpu' && this.renderer) {
            if (params.wireframe !== undefined && this.renderer.setWireframe) {
                this.renderer.setWireframe(params.wireframe);
            }
        }
        
        // Handle material properties for WebGL renderers
        if (this.helixMaterial && this.currentRenderer !== 'webgpu') {
            if (params.wireframe !== undefined) {
                this.helixMaterial.wireframe = params.wireframe;
            }
        }
        
        // Recreate helix if geometry parameters changed
        if (params.radius !== undefined || params.height !== undefined) {
            this.createHelix();
        }
    }
    
    async switchRenderer(type) {
        console.log(`🔄 Switching to ${type.toUpperCase()} renderer...`);
        
        try {
            await this.initRenderer(type);
            await this.createHelix();
        } catch (error) {
            console.error(`❌ Failed to switch to ${type}:`, error);
            this.uiController.showError(`Failed to switch to ${type}: ${error.message}`);
        }
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => this.handleResize());
        
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseRenderLoop();
            } else {
                this.resumeRenderLoop();
            }
        });
        
        // Keyboard shortcuts for thesis demo
        document.addEventListener('keydown', (event) => {
            switch(event.key) {
                case '1':
                    this.switchRenderer('webgl');
                    break;
                case '2':
                    this.switchRenderer('webgl2');
                    break;
                case '3':
                    this.switchRenderer('webgpu');
                    break;
                case 'p':
                case 'P':
                    this.enhancedParams.steepParallax = !this.enhancedParams.steepParallax;
                    this.updateHelixParameters({ steepParallax: this.enhancedParams.steepParallax });
                    console.log(`Parallax mode: ${this.enhancedParams.steepParallax ? 'Steep' : 'Simple'}`);
                    break;
                case 'w':
                case 'W':
                    this.enhancedParams.wireframe = !this.enhancedParams.wireframe;
                    this.updateHelixParameters({ wireframe: this.enhancedParams.wireframe });
                    break;
            }
        });
        
        console.log('🎮 Event listeners setup (Keys: 1=WebGL, 2=WebGL2, 3=WebGPU, P=Parallax, W=Wireframe)');
    }
    
    handleResize() {
        if (!this.camera || !this.renderer) return;
        
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        
        if (this.renderer.setSize) {
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        }
    }
    
    startRenderLoop() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.performanceMonitor.start();
        this.render();
        
        console.log('🎬 Render loop started');
    }
    
    pauseRenderLoop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.performanceMonitor.pause();
    }
    
    resumeRenderLoop() {
        if (!this.isRunning) {
            this.startRenderLoop();
        }
    }
    
    render() {
        if (!this.isRunning) return;
        
        this.animationId = requestAnimationFrame(() => this.render());
        
        // Update performance monitoring
        this.performanceMonitor.beginFrame();
        
        // Update controls
        if (this.controls) {
            this.controls.update();
        }
        
        // Animate helix rotation
        if (this.helixMesh) {
            this.helixMesh.rotation.y += 0.005;
        }
        
        // Render scene
        if (this.renderer && this.scene && this.camera) {
            try {
                // For WebGPU, pass the helix mesh reference for rotation
                if (this.currentRenderer === 'webgpu' && this.renderer.setHelixMesh) {
                    this.renderer.setHelixMesh(this.helixMesh);
                }
                
                this.renderer.render(this.scene, this.camera);
            } catch (renderError) {
                console.error('Render error:', renderError);
            }
        }
        
        // End performance monitoring and update UI
        const metrics = this.performanceMonitor.endFrame();
        this.uiController.updatePerformanceDisplay(metrics);
    }
    
    startPerformanceTest(duration = 30000) {
        return this.performanceMonitor.startTest(duration);
    }
    
    exportTestData() {
        return this.performanceMonitor.exportData();
    }
    
    clearTestData() {
        this.performanceMonitor.clearData();
        this.uiController.showMessage('Test data cleared', 'success');
    }
    
    showError(message) {
        console.error('❌', message);
        this.uiController.showError(message);
    }
    
    dispose() {
        console.log('🧹 Disposing application...');
        
        this.pauseRenderLoop();
        
        if (this.controls) this.controls.dispose();
        if (this.renderer && this.renderer.dispose) this.renderer.dispose();
        if (this.helixMesh) {
            if (this.helixMesh.geometry) this.helixMesh.geometry.dispose();
            if (this.helixMesh.material) this.helixMesh.material.dispose();
        }
        
        Object.values(this.rendererInstances).forEach(renderer => {
            if (renderer && renderer.dispose) {
                renderer.dispose();
            }
        });
        
        this.performanceMonitor.dispose();
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🌟 DOM loaded, starting application...');
    
    window.parallaxApp = new ParallaxHelixApp();
    
    try {
        await window.parallaxApp.init();
    } catch (error) {
        console.error('💥 Fatal error during initialization:', error);
        
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(244, 67, 54, 0.9);
            color: white;
            padding: 20px;
            border-radius: 8px;
            z-index: 1000;
            font-family: monospace;
            max-width: 80%;
            text-align: center;
        `;
        errorDiv.innerHTML = `
            <h3>Failed to initialize application</h3>
            <p>${error.message}</p>
            <p><small>Check console for more details</small></p>
        `;
        document.body.appendChild(errorDiv);
    }
});

window.addEventListener('beforeunload', () => {
    if (window.parallaxApp) {
        window.parallaxApp.dispose();
    }
});

export { ParallaxHelixApp };