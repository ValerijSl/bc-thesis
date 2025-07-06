import Stats from 'three/examples/jsm/libs/stats.module.js';
import GUI from 'lil-gui';
import { exportCsv } from './metrics/exportCsv';
import type { RendererType, SceneType, Metrics } from './types';

let stats: Stats;
let gui: GUI;
let metrics: Metrics[] = [];
let frameCount = 0;
let currentScene: SceneType = 'storm';
let currentRenderer: RendererType = 'webgl';

export function initUI(
  toggleRenderer: (type: RendererType) => void,
  switchScene: (scene: SceneType) => void,
  renderer: any
) {
  // Stats.js
  stats = new Stats();
  stats.showPanel(0); // FPS
  document.body.appendChild(stats.dom);
  
  // lil-gui
  gui = new GUI();
  
  const config = {
    renderer: 'webgl' as RendererType,
    scene: 'storm' as SceneType,
    resolution: '1080p',
    downloadCSV: () => exportCsv(metrics)
  };

  const testConfig = {
  testWebGPU: async () => {
    try {
      const { initWebGPUTest } = await import('./webgpu/webgpuTest');
      await initWebGPUTest();
    } catch (error) {
      console.error('WebGPU test failed:', error);
      alert('WebGPU test failed. Check console for details.');
    }
  }
};

// Přidej do GUI:
gui.add(testConfig, 'testWebGPU').name('Test WebGPU (New Window)');
  
  // Renderer selector
  gui.add(config, 'renderer', ['webgl', 'webgpu'])
    .name('Renderer')
    .onChange((value: RendererType) => {
      currentRenderer = value;
      toggleRenderer(value);
    });
  
  // Scene selector
  gui.add(config, 'scene', ['storm', 'particles', 'gbuffer'])
    .name('Scene')
    .onChange((value: SceneType) => {
      currentScene = value;
      switchScene(value);
      metrics = []; // Reset metrics for new scene
      frameCount = 0;
    });
  
  // Resolution selector
  gui.add(config, 'resolution', ['720p', '1080p', '4K'])
    .name('Resolution')
    .onChange((value: string) => {
      const resolutions = {
        '720p': [1280, 720],
        '1080p': [1920, 1080],
        '4K': [3840, 2160]
      };
      const [width, height] = resolutions[value as keyof typeof resolutions];
      renderer.setSize(width, height);
    });
  
  // Download button
  gui.add(config, 'downloadCSV').name('Download CSV');
  
  // Performance folder
  const perfFolder = gui.addFolder('Performance');
  const perfData = {
    fps: 0,
    cpu: 0,
    gpu: 0,
    vram: 0,
    drawCalls: 0,
    triangles: 0
  };
  
  perfFolder.add(perfData, 'fps').name('FPS').listen().disable();
  perfFolder.add(perfData, 'cpu').name('CPU (ms)').listen().disable();
  perfFolder.add(perfData, 'gpu').name('GPU (ms)').listen().disable();
  perfFolder.add(perfData, 'vram').name('VRAM (MB)').listen().disable();
  perfFolder.add(perfData, 'drawCalls').name('Draw Calls').listen().disable();
  perfFolder.add(perfData, 'triangles').name('Triangles').listen().disable();
  perfFolder.open();
  
  // Animation loop
  function animate() {
    stats.update();
    
    // Update metrics every 60 frames
    if (frameCount % 60 === 0) {
      // Use Stats module's internal FPS counter
      const currentFPS = stats.showPanel(0); // Show FPS panel
      const fps = 60; // Default fallback
      
      // Try to get actual FPS from Stats DOM
      try {
        const fpsText = stats.dom.innerText;
        const fpsMatch = fpsText.match(/(\d+)\s*FPS/);
        if (fpsMatch) {
          perfData.fps = parseInt(fpsMatch[1]);
        }
      } catch (e) {
        perfData.fps = Math.round(1000 / 16); // ~60fps fallback
      }
      
      const cpu = 1000 / perfData.fps;
      const vram = (window.performance as any).memory?.usedJSHeapSize 
        ? Math.round((window.performance as any).memory.usedJSHeapSize / 1048576) 
        : 0;
      
      // Update GUI
      perfData.fps = Math.round(fps);
      perfData.cpu = Math.round(cpu * 100) / 100;
      perfData.vram = vram;
      
      if (renderer.info) {
        perfData.drawCalls = renderer.info.render.calls;
        perfData.triangles = renderer.info.render.triangles;
      }
      
      // Log metrics
      const metric: Metrics = {
        frame: frameCount,
        timestamp: Date.now(),
        api: currentRenderer,
        scene: currentScene,
        fps: fps,
        cpu_ms: cpu,
        gpu_ms: null, // TODO: Implement GPU timer
        vram_mb: vram,
        draw_calls: perfData.drawCalls,
        triangles: perfData.triangles
      };
      
      metrics.push(metric);
    }
    
    frameCount++;
    requestAnimationFrame(animate);
  }
  
  animate();
}