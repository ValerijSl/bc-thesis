// src/metrics/gpuTimer.ts
import type { IGpuTimer } from '../types';

export class WebGLGpuTimer implements IGpuTimer {
  private gl: WebGL2RenderingContext;
  private ext: any;
  private queries: WebGLQuery[] = [];
  private queryPool: WebGLQuery[] = [];
  private pendingQueries: Map<WebGLQuery, number> = new Map();
  
  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
    
    if (!this.ext) {
      console.warn('GPU timing not available - EXT_disjoint_timer_query_webgl2 not supported');
    }
  }
  
  begin(): void {
    if (!this.ext) return;
    
    // Get or create query
    let query = this.queryPool.pop();
    if (!query) {
      query = this.gl.createQuery()!;
    }
    
    this.gl.beginQuery(this.ext.TIME_ELAPSED_EXT, query);
    this.queries.push(query);
  }
  
  end(): void {
    if (!this.ext || this.queries.length === 0) return;
    
    this.gl.endQuery(this.ext.TIME_ELAPSED_EXT);
    const query = this.queries[this.queries.length - 1];
    this.pendingQueries.set(query, performance.now());
  }
  
  poll(): number | null {
    if (!this.ext) return null;
    
    let totalTime = 0;
    let completedQueries = 0;
    
    // Check all pending queries
    for (const [query, startTime] of this.pendingQueries) {
      // Skip if query is too recent (give GPU time to complete)
      if (performance.now() - startTime < 2) continue;
      
      const available = this.gl.getQueryParameter(query, this.gl.QUERY_RESULT_AVAILABLE);
      const disjoint = this.gl.getParameter(this.ext.GPU_DISJOINT_EXT);
      
      if (available && !disjoint) {
        const timeElapsed = this.gl.getQueryParameter(query, this.gl.QUERY_RESULT);
        totalTime += timeElapsed / 1000000; // Convert to ms
        completedQueries++;
        
        // Return query to pool
        this.pendingQueries.delete(query);
        this.queryPool.push(query);
        this.queries = this.queries.filter(q => q !== query);
      }
      
      if (disjoint) {
        // Query was interrupted, discard it
        this.gl.deleteQuery(query);
        this.pendingQueries.delete(query);
        this.queries = this.queries.filter(q => q !== query);
      }
    }
    
    return completedQueries > 0 ? totalTime / completedQueries : null;
  }
  
  destroy(): void {
    // Clean up all queries
    [...this.queries, ...this.queryPool].forEach(query => {
      this.gl.deleteQuery(query);
    });
    this.queries = [];
    this.queryPool = [];
    this.pendingQueries.clear();
  }
}

export class WebGPUGpuTimer implements IGpuTimer {
  private device: GPUDevice | null = null;
  private hasTimestampQuery = false;
  
  constructor(device: GPUDevice) {
    this.device = device;
    this.hasTimestampQuery = device.features.has('timestamp-query');
    
    if (!this.hasTimestampQuery) {
      console.warn('GPU timing not available - timestamp-query not supported');
    }
  }
  
  begin(): void {
    // WebGPU timing requires integration with command encoder
    // This is a simplified version - real implementation would need
    // to hook into the render pipeline
  }
  
  end(): void {
    // See begin()
  }
  
  poll(): number | null {
    // For now, return null - full implementation would require
    // significant integration with WebGPU render pipeline
    return null;
  }
  
  destroy(): void {
    // Cleanup if needed
  }
}

// Factory function
export function createGpuTimer(renderer: any): IGpuTimer | null {
  if (renderer.isWebGLRenderer) {
    const gl = renderer.getContext() as WebGL2RenderingContext;
    return new WebGLGpuTimer(gl);
  } else if (renderer.isWebGPURenderer) {
    // WebGPU renderer would need to expose device
    console.warn('WebGPU GPU timing not yet implemented');
    return null;
  }
  
  return null;
}