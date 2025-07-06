import * as THREE from 'three';
// Temporarily use webgpu import for WebGPURenderer
// import { WebGPURenderer } from 'three/webgpu';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { initUI } from './ui';
import { buildDrawCallStorm, buildComputeParticles, buildGbufferScene } from './scenes';
import type { RendererType, SceneType } from './types';
import './types/webgpu.d'; // Import WebGPU types

const canvas = document.querySelector('#canvas') as HTMLCanvasElement;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1000);
camera.position.set(40, 30, 60);
camera.lookAt(0, 0, 0);

const renderers: {
  webgl: THREE.WebGLRenderer;
  webgpu: any | null;
} = {
  webgl: new THREE.WebGLRenderer({ canvas, antialias: false }),
  webgpu: null
};

let active: THREE.WebGLRenderer | any = renderers.webgl;
let currentSceneBuilder = buildDrawCallStorm;
let currentSceneType: SceneType = 'storm';
let controls: OrbitControls;

// WebGPU Support Check
console.log('WebGPU Support Check:');
console.log('navigator.gpu:', navigator.gpu);
console.log('Browser:', navigator.userAgent);

async function testWebGPU() {
  if (!navigator.gpu) {
    console.error('WebGPU API not found');
    return null;
  }
  
  try {
    const adapter = await navigator.gpu.requestAdapter({
      powerPreference: 'high-performance'
    });
    console.log('GPU Adapter:', adapter);
    
    if (adapter) {
      const info = await adapter.requestAdapterInfo();
      console.log('GPU Info:', info);
      
      const features = [...adapter.features];
      console.log('GPU Features:', features);
      
      // Získej device pro pozdější použití
      const device = await adapter.requestDevice();
      console.log('GPU Device:', device);
      
      return { adapter, device };
    }
  } catch (error) {
    console.error('WebGPU test error:', error);
  }
  
  return null;
}

async function initWebGPU() {
  if (!navigator.gpu) {
    console.error('WebGPU not supported - navigator.gpu is undefined');
    showWebGPUNotSupportedMessage();
    return null;
  }
  
  try {
    // Dynamically import WebGPU renderer
    const WebGPUModule = await import('three/webgpu');
    const { WebGPURenderer } = WebGPUModule;
    
    console.log('Creating WebGPU renderer...');
    const renderer = new WebGPURenderer({ 
      canvas: canvas as HTMLCanvasElement,
      antialias: false,
      powerPreference: "high-performance"
    });
    
    // Initialize WebGPU
    await renderer.init();
    console.log('WebGPU Renderer initialized successfully!');
    
    return renderer;
  } catch (error) {
    console.error('WebGPU initialization error:', error);
    showWebGPUNotSupportedMessage();
    return null;
  }
}

function showWebGPUNotSupportedMessage() {
  console.warn('WebGPU renderer není dostupný, používám WebGL.');
}

function setupRenderer(r: THREE.WebGLRenderer | any) {
  r.setPixelRatio(devicePixelRatio);
  r.setSize(innerWidth, innerHeight);
  
  // Nastavení pro lepší kvalitu
  if (r.shadowMap) {
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
  }
  
  if (r.toneMapping !== undefined) {
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.2;
  }
  
  if (controls) controls.dispose();
  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
}

async function handleToggleRenderer(choice: RendererType) {
  if (choice === 'webgpu') {
    if (!renderers.webgpu) {
      const webgpuRenderer = await initWebGPU();
      if (!webgpuRenderer) {
        console.error('WebGPU renderer not available, staying with WebGL');
        
        // Resetuj GUI zpět na WebGL
        const guiElements = document.querySelectorAll('.lil-gui select');
        guiElements.forEach((select: any) => {
          if (select.value === 'webgpu') {
            select.value = 'webgl';
          }
        });
        
        return;
      }
      renderers.webgpu = webgpuRenderer;
    }
    active = renderers.webgpu;
  } else {
    active = renderers.webgl;
  }
  
  setupRenderer(active);
  handleSwitchScene(currentSceneType);
}

function handleSwitchScene(name: SceneType) {
  scene.clear();
  currentSceneType = name;
  currentSceneBuilder = {
    storm: buildDrawCallStorm,
    particles: buildComputeParticles,
    gbuffer: buildGbufferScene
  }[name];
  currentSceneBuilder(scene, active);
}

function initScene() {
  scene.background = new THREE.Color(0x111111);
  scene.fog = new THREE.Fog(0x111111, 50, 200);
  currentSceneBuilder(scene, active);
}

function resize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  active.setSize(innerWidth, innerHeight);
}

function render(time: number) {
  controls.update();
  
  // Volej animace scény
  if (scene.userData.animate) {
    scene.userData.animate(time);
  }
  
  active.render(scene, camera);
  requestAnimationFrame(render);
}

// Initialize
async function init() {
  // Test WebGPU
  await testWebGPU();
  
  setupRenderer(active);
  initScene();
  initUI(handleToggleRenderer, handleSwitchScene, active);
  
  window.addEventListener('resize', resize);
  requestAnimationFrame(render);
}

init();