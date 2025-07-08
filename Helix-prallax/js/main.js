// Chapter 7 - Main Application Controller
// Coordinates all modules and manages the application lifecycle

import { HelixGeometry } from './helix-geometry.js';
import { ParallaxShader } from './parallax-shader.js';
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
    }
    
    async init() {
        console.log('🚀 Initializing Parallax Helix Application...');
        
        try {
            this.setupScene();
            await this.initRenderer(this.currentRenderer);
            this.createHelix();
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
        this.scene.background = new THREE.Color(0x111111);
        this.scene.fog = new THREE.Fog(0x111111, 10, 50);
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75, 
            window.innerWidth / window.innerHeight, 
            0.1, 
            1000
        );
        this.camera.position.set(5, 5, 5);
        
        // Add lights
        this.setupLighting();
        
        // Add ground plane
        this.addGroundPlane();
        
        console.log('📦 Scene setup complete');
    }
    
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(ambientLight);
        
        // Directional light with shadows
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.camera.near = 0.1;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -10;
        directionalLight.shadow.camera.right = 10;
        directionalLight.shadow.camera.top = 10;
        directionalLight.shadow.camera.bottom = -10;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
        
        // Point light for accent
        const pointLight = new THREE.PointLight(0x4488ff, 0.5, 20);
        pointLight.position.set(0, 5, 0);
        this.scene.add(pointLight);
    }
    
    addGroundPlane() {
        const groundGeometry = new THREE.PlaneGeometry(20, 20);
        const groundMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x222222,
            transparent: true,
            opacity: 0.8
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -3;
        ground.receiveShadow = true;
        this.scene.add(ground);
    }
    
    async initRenderer(type) {
        console.log(`🎨 Initializing ${type.toUpperCase()} renderer...`);
        
        // Dispose previous renderer
        if (this.renderer) {
            this.renderer.dispose();
            if (this.renderer.domElement && this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
        }
        
        // Dispose controls
        if (this.controls) {
            this.controls.dispose();
            this.controls = null;
        }
        
        try {
            // Create new renderer
            switch (type) {
                case 'webgl':
                    if (!this.rendererInstances.webgl) {
                        this.rendererInstances.webgl = new WebGLRenderer();
                    }
                    this.renderer = this.rendererInstances.webgl;
                    break;
                    
                case 'webgl2':
                    if (!this.rendererInstances.webgl2) {
                        this.rendererInstances.webgl2 = new WebGL2Renderer();
                    }
                    this.renderer = this.rendererInstances.webgl2;
                    break;
                    
                case 'webgpu':
                    if (!this.rendererInstances.webgpu) {
                        this.rendererInstances.webgpu = new WebGPURenderer();
                    }
                    this.renderer = this.rendererInstances.webgpu;
                    await this.renderer.init();
                    break;
                    
                default:
                    throw new Error(`Unknown renderer type: ${type}`);
            }
            
            // Setup renderer
            await this.renderer.setup(window.innerWidth, window.innerHeight);
            document.body.appendChild(this.renderer.getDomElement());
            
            // Setup controls
            this.setupControls();
            
            this.currentRenderer = type;
            this.uiController.updateRendererDisplay(type);
            
            console.log(`✅ ${type.toUpperCase()} renderer initialized`);
            
        } catch (error) {
            console.error(`❌ Failed to initialize ${type} renderer:`, error);
            
            // Fallback to WebGL if other renderers fail
            if (type !== 'webgl') {
                console.log('🔄 Falling back to WebGL...');
                await this.initRenderer('webgl');
                this.uiController.showError(`${type.toUpperCase()} not supported, using WebGL`);
            } else {
                throw error;
            }
        }
    }
    
    setupControls() {
        if (!this.renderer || !this.renderer.getDomElement()) {
            console.warn('⚠️ Cannot setup controls: renderer not ready');
            return;
        }
        
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.getDomElement());
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 3;
        this.controls.maxDistance = 20;
        this.controls.maxPolarAngle = Math.PI / 2;
    }
    
    createHelix() {
        console.log('🌀 Creating helix geometry...');
        
        // Remove existing helix
        if (this.helixMesh) {
            this.scene.remove(this.helixMesh);
            if (this.helixMesh.geometry) this.helixMesh.geometry.dispose();
            if (this.helixMesh.material) this.helixMesh.material.dispose();
        }
        
        // Get parameters from UI
        const params = this.uiController.getHelixParameters();
        
        // Create geometry
        const helixGeometry = new HelixGeometry();
        const geometry = helixGeometry.create(
            params.radius, 
            params.height, 
            200, // segments
            32   // radial segments
        );
        
        // Create material
        const parallaxShader = new ParallaxShader();
        this.helixMaterial = parallaxShader.createMaterial(params);
        
        // Create mesh
        this.helixMesh = new THREE.Mesh(geometry, this.helixMaterial);
        this.helixMesh.castShadow = true;
        this.helixMesh.receiveShadow = true;
        this.scene.add(this.helixMesh);
        
        // Update UI info
        this.uiController.updateGeometryInfo(geometry);
        
        console.log('✅ Helix created successfully');
    }
    
    updateHelixParameters(params) {
        if (this.helixMaterial && this.helixMaterial.uniforms) {
            if (params.parallaxScale !== undefined) {
                this.helixMaterial.uniforms.parallaxScale.value = params.parallaxScale;
            }
            if (params.minLayers !== undefined) {
                this.helixMaterial.uniforms.minLayers.value = params.minLayers;
            }
            if (params.maxLayers !== undefined) {
                this.helixMaterial.uniforms.maxLayers.value = params.maxLayers;
            }
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
            
            // Recreate helix with new renderer
            this.createHelix();
            
        } catch (error) {
            console.error(`❌ Failed to switch to ${type}:`, error);
            this.uiController.showError(`Failed to switch to ${type}: ${error.message}`);
        }
    }
    
    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => this.handleResize());
        
        // Visibility change (pause when tab is not visible)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseRenderLoop();
            } else {
                this.resumeRenderLoop();
            }
        });
    }
    
    handleResize() {
        if (!this.camera || !this.renderer) return;
        
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
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
            this.renderer.render(this.scene, this.camera);
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
        if (this.renderer) this.renderer.dispose();
        if (this.helixMesh) {
            if (this.helixMesh.geometry) this.helixMesh.geometry.dispose();
            if (this.helixMesh.material) this.helixMesh.material.dispose();
        }
        
        // Dispose all renderer instances
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
        alert('Failed to initialize application. Please check console for details.');
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.parallaxApp) {
        window.parallaxApp.dispose();
    }
});

export { ParallaxHelixApp };