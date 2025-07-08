// src/benchmark/automatedTest.ts
import type { RendererType, SceneType, Metrics } from '../types';

export interface BenchmarkConfig {
  renderers: RendererType[];
  scenes: SceneType[];
  duration: number; // seconds per test
  warmupTime: number; // seconds before collecting data
  resolutions: Array<[number, number]>;
}

export interface BenchmarkResults {
  config: BenchmarkConfig;
  startTime: Date;
  endTime: Date;
  results: TestResult[];
}

export interface TestResult {
  renderer: RendererType;
  scene: SceneType;
  resolution: [number, number];
  metrics: Metrics[];
  summary: {
    avgFps: number;
    minFps: number;
    maxFps: number;
    avgCpuMs: number;
    avgGpuMs: number | null;
    percentile95Fps: number;
    percentile99Fps: number;
  };
}

export class AutomatedBenchmark {
  private config: BenchmarkConfig;
  private onProgress: (progress: number, currentTest: string) => void;
  private results: TestResult[] = [];
  
  constructor(
    config: BenchmarkConfig,
    onProgress: (progress: number, currentTest: string) => void
  ) {
    this.config = config;
    this.onProgress = onProgress;
  }
  
  async run(
    rendererFactory: (type: RendererType) => Promise<any>,
    sceneFactory: (type: SceneType, renderer: any) => void,
    canvas: HTMLCanvasElement
  ): Promise<BenchmarkResults> {
    const startTime = new Date();
    const totalTests = this.config.renderers.length * 
                      this.config.scenes.length * 
                      this.config.resolutions.length;
    let currentTest = 0;
    
    for (const rendererType of this.config.renderers) {
      let renderer;
      
      try {
        renderer = await rendererFactory(rendererType);
      } catch (error) {
        console.error(`Failed to create ${rendererType} renderer:`, error);
        continue;
      }
      
      for (const sceneType of this.config.scenes) {
        for (const resolution of this.config.resolutions) {
          currentTest++;
          const testName = `${rendererType} - ${sceneType} - ${resolution[0]}x${resolution[1]}`;
          this.onProgress(currentTest / totalTests, testName);
          
          const result = await this.runSingleTest(
            renderer,
            rendererType,
            sceneType,
            resolution,
            sceneFactory
          );
          
          this.results.push(result);
          
          // Small delay between tests
          await this.delay(1000);
        }
      }
      
      // Cleanup renderer
      if (renderer.dispose) {
        renderer.dispose();
      }
    }
    
    return {
      config: this.config,
      startTime,
      endTime: new Date(),
      results: this.results
    };
  }
  
  private async runSingleTest(
    renderer: any,
    rendererType: RendererType,
    sceneType: SceneType,
    resolution: [number, number],
    sceneFactory: (type: SceneType, renderer: any) => void
  ): Promise<TestResult> {
    // Set resolution
    renderer.setSize(resolution[0], resolution[1]);
    
    // Create scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      resolution[0] / resolution[1],
      0.1,
      1000
    );
    camera.position.set(40, 30, 60);
    
    sceneFactory(sceneType, renderer);
    
    // Metrics collection
    const metrics: Metrics[] = [];
    let frameCount = 0;
    let lastTime = performance.now();
    let testStartTime = 0;
    
    // Run test
    await new Promise<void>((resolve) => {
      const animate = () => {
        const currentTime = performance.now();
        const deltaTime = currentTime - lastTime;
        
        // Skip warmup period
        if (testStartTime === 0) {
          if (currentTime - startTime > this.config.warmupTime * 1000) {
            testStartTime = currentTime;
          }
        } else {
          // Collect metrics
          if (frameCount % 10 === 0) { // Sample every 10 frames
            const metric: Metrics = {
              frame: frameCount,
              timestamp: Date.now(),
              api: rendererType,
              scene: sceneType,
              fps: 1000 / deltaTime,
              cpu_ms: deltaTime,
              gpu_ms: null, // TODO: GPU timer integration
              vram_mb: this.getMemoryUsage(),
              draw_calls: renderer.info?.render?.calls || 0,
              triangles: renderer.info?.render?.triangles || 0
            };
            
            metrics.push(metric);
          }
          
          // Check if test is complete
          if (currentTime - testStartTime > this.config.duration * 1000) {
            resolve();
            return;
          }
        }
        
        // Update scene
        if (scene.userData.animate) {
          scene.userData.animate(currentTime);
        }
        
        // Render
        renderer.render(scene, camera);
        
        frameCount++;
        lastTime = currentTime;
        requestAnimationFrame(animate);
      };
      
      const startTime = performance.now();
      animate();
    });
    
    // Calculate summary statistics
    const summary = this.calculateSummary(metrics);
    
    // Cleanup scene
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach(m => m.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
    
    return {
      renderer: rendererType,
      scene: sceneType,
      resolution,
      metrics,
      summary
    };
  }
  
  private calculateSummary(metrics: Metrics[]) {
    const fpsSamples = metrics.map(m => m.fps).sort((a, b) => a - b);
    const cpuSamples = metrics.map(m => m.cpu_ms);
    const gpuSamples = metrics.map(m => m.gpu_ms).filter(v => v !== null) as number[];
    
    return {
      avgFps: fpsSamples.reduce((a, b) => a + b, 0) / fpsSamples.length,
      minFps: Math.min(...fpsSamples),
      maxFps: Math.max(...fpsSamples),
      avgCpuMs: cpuSamples.reduce((a, b) => a + b, 0) / cpuSamples.length,
      avgGpuMs: gpuSamples.length > 0 
        ? gpuSamples.reduce((a, b) => a + b, 0) / gpuSamples.length 
        : null,
      percentile95Fps: fpsSamples[Math.floor(fpsSamples.length * 0.95)],
      percentile99Fps: fpsSamples[Math.floor(fpsSamples.length * 0.99)]
    };
  }
  
  private getMemoryUsage(): number {
    if ((performance as any).memory) {
      return Math.round((performance as any).memory.usedJSHeapSize / 1048576);
    }
    return 0;
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// src/benchmark/reportGenerator.ts
export class BenchmarkReportGenerator {
  static generateHTML(results: BenchmarkResults): string {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>GPU Benchmark Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .winner { background-color: #90EE90; }
        .chart { margin: 20px 0; }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <h1>GPU Benchmark Results</h1>
    <p>Test Date: ${results.startTime.toLocaleString()} - ${results.endTime.toLocaleString()}</p>
    <p>Total Duration: ${((results.endTime.getTime() - results.startTime.getTime()) / 1000 / 60).toFixed(1)} minutes</p>
    
    <h2>Configuration</h2>
    <ul>
        <li>Renderers: ${results.config.renderers.join(', ')}</li>
        <li>Scenes: ${results.config.scenes.join(', ')}</li>
        <li>Resolutions: ${results.config.resolutions.map(r => `${r[0]}x${r[1]}`).join(', ')}</li>
        <li>Test Duration: ${results.config.duration}s per test</li>
        <li>Warmup Time: ${results.config.warmupTime}s</li>
    </ul>
    
    <h2>Summary Results</h2>
    ${this.generateSummaryTable(results)}
    
    <h2>Performance Charts</h2>
    <div class="chart">
        <canvas id="fpsChart"></canvas>
    </div>
    <div class="chart">
        <canvas id="cpuChart"></canvas>
    </div>
    
    <h2>Detailed Results</h2>
    ${this.generateDetailedTable(results)}
    
    <script>
        ${this.generateChartScripts(results)}
    </script>
</body>
</html>
    `;
    
    return html;
  }
  
  private static generateSummaryTable(results: BenchmarkResults): string {
    // Group by scene and resolution
    const grouped = new Map<string, TestResult[]>();
    
    results.results.forEach(result => {
      const key = `${result.scene}_${result.resolution.join('x')}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(result);
    });
    
    let html = '<table><tr><th>Scene</th><th>Resolution</th>';
    results.config.renderers.forEach(r => {
      html += `<th>${r.toUpperCase()} Avg FPS</th>`;
    });
    html += '</tr>';
    
    grouped.forEach((tests, key) => {
      const [scene, resolution] = key.split('_');
      html += `<tr><td>${scene}</td><td>${resolution}</td>`;
      
      const maxFps = Math.max(...tests.map(t => t.summary.avgFps));
      
      results.config.renderers.forEach(renderer => {
        const test = tests.find(t => t.renderer === renderer);
        if (test) {
          const isWinner = test.summary.avgFps === maxFps;
          html += `<td class="${isWinner ? 'winner' : ''}">${test.summary.avgFps.toFixed(1)}</td>`;
        } else {
          html += '<td>-</td>';
        }
      });
      html += '</tr>';
    });
    
    html += '</table>';
    return html;
  }
  
  private static generateDetailedTable(results: BenchmarkResults): string {
    let html = '<table>';
    html += '<tr><th>Renderer</th><th>Scene</th><th>Resolution</th>';
    html += '<th>Avg FPS</th><th>Min FPS</th><th>95% FPS</th>';
    html += '<th>Avg CPU (ms)</th><th>Avg GPU (ms)</th>';
    html += '<th>Draw Calls</th><th>Triangles</th></tr>';
    
    results.results.forEach(result => {
      html += '<tr>';
      html += `<td>${result.renderer}</td>`;
      html += `<td>${result.scene}</td>`;
      html += `<td>${result.resolution.join('x')}</td>`;
      html += `<td>${result.summary.avgFps.toFixed(1)}</td>`;
      html += `<td>${result.summary.minFps.toFixed(1)}</td>`;
      html += `<td>${result.summary.percentile95Fps.toFixed(1)}</td>`;
      html += `<td>${result.summary.avgCpuMs.toFixed(2)}</td>`;
      html += `<td>${result.summary.avgGpuMs?.toFixed(2) || 'N/A'}</td>`;
      html += `<td>${result.metrics[0]?.draw_calls || 0}</td>`;
      html += `<td>${result.metrics[0]?.triangles || 0}</td>`;
      html += '</tr>';
    });
    
    html += '</table>';
    return html;
  }
  
  private static generateChartScripts(results: BenchmarkResults): string {
    // Prepare data for charts
    const labels = results.config.scenes;
    const datasets = results.config.renderers.map(renderer => {
      const data = results.config.scenes.map(scene => {
        const test = results.results.find(
          r => r.renderer === renderer && 
               r.scene === scene && 
               r.resolution[0] === 1920 // Default to 1080p
        );
        return test?.summary.avgFps || 0;
      });
      
      return {
        label: renderer.toUpperCase(),
        data: data,
        backgroundColor: renderer === 'webgl' ? 'rgba(54, 162, 235, 0.5)' : 'rgba(255, 99, 132, 0.5)',
        borderColor: renderer === 'webgl' ? 'rgb(54, 162, 235)' : 'rgb(255, 99, 132)',
        borderWidth: 1
      };
    });
    
    return `
      // FPS Chart
      new Chart(document.getElementById('fpsChart'), {
        type: 'bar',
        data: {
          labels: ${JSON.stringify(labels)},
          datasets: ${JSON.stringify(datasets)}
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Average FPS by Scene (1080p)'
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    `;
  }
}


