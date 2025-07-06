import type { IGpuTimer } from '../types';

export class WebGLGpuTimer implements IGpuTimer {
  private gl: WebGL2RenderingContext;
  private ext: any;
  private query: WebGLQuery | null = null;
  private isPolling = false;
  
  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
    
    if (!this.ext) {
      console.warn('EXT_disjoint_timer_query_webgl2 not available');
    }
  }
  
  begin(): void {
    if (!this.ext || this.isPolling) return;
    
    this.query = this.gl.createQuery();
    if (this.query) {
      this.gl.beginQuery(this.ext.TIME_ELAPSED_EXT, this.query);
    }
  }
  
  end(): void {
    if (!this.ext || !this.query) return;
    
    this.gl.endQuery(this.ext.TIME_ELAPSED_EXT);
    this.isPolling = true;
  }
  
  poll(): number | null {
    if (!this.ext || !this.query || !this.isPolling) return null;
    
    const available = this.gl.getQueryParameter(
      this.query,
      this.gl.QUERY_RESULT_AVAILABLE
    );
    
    const disjoint = this.gl.getParameter(this.ext.GPU_DISJOINT_EXT);
    
    if (available && !disjoint) {
      const timeElapsed = this.gl.getQueryParameter(
        this.query,
        this.gl.QUERY_RESULT
      );
      
      this.gl.deleteQuery(this.query);
      this.query = null;
      this.isPolling = false;
      
      // Convert nanoseconds to milliseconds
      return timeElapsed / 1000000;
    }
    
    if (disjoint) {
      this.gl.deleteQuery(this.query);
      this.query = null;
      this.isPolling = false;
    }
    
    return null;
  }
}