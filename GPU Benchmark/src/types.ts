export type RendererType = 'webgl' | 'webgpu';
export type SceneType = 'storm' | 'particles' | 'gbuffer';

export interface Metrics {
  frame: number;
  timestamp: number;
  api: RendererType;
  scene: SceneType;
  fps: number;
  cpu_ms: number;
  gpu_ms: number | null;
  vram_mb: number;
  draw_calls?: number;
  triangles?: number;
}

export interface IGpuTimer {
  begin(): void;
  end(): void;
  poll(): number | null;
}