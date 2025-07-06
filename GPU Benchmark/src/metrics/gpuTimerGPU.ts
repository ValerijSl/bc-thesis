import type { IGpuTimer } from '../types';

export class WebGPUGpuTimer implements IGpuTimer {
  private device: GPUDevice;
  private querySet: GPUQuerySet | null = null;
  private resolveBuffer: GPUBuffer | null = null;
  private resultBuffer: GPUBuffer | null = null;
  private isPolling = false;
  
  constructor(device: GPUDevice) {
    this.device = device;
    
    // Check if timestamp queries are supported
    if (!device.features.has('timestamp-query')) {
      console.warn('Timestamp queries not supported on this device');
    }
  }
  
  begin(): void {
    if (!this.device.features.has('timestamp-query') || this.isPolling) return;
    
    // Create query set for 2 timestamps (begin and end)
    this.querySet = this.device.createQuerySet({
      type: 'timestamp',
      count: 2
    });
    
    // Create buffers for query results
    this.resolveBuffer = this.device.createBuffer({
      size: 16, // 2 * 8 bytes for 2 timestamps
      usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC
    });
    
    this.resultBuffer = this.device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });
  }
  
  end(): void {
    if (!this.querySet || !this.resolveBuffer || !this.resultBuffer) return;
    
    // In a real implementation, you'd write timestamps in command encoder
    // This is a simplified version
    this.isPolling = true;
  }
  
  async poll(): Promise<number | null> {
    if (!this.isPolling || !this.resultBuffer) return null;
    
    try {
      // Map the result buffer to read timestamps
      await this.resultBuffer.mapAsync(GPUMapMode.READ);
      const arrayBuffer = this.resultBuffer.getMappedRange();
      const timestamps = new BigUint64Array(arrayBuffer);
      
      const startTime = Number(timestamps[0]);
      const endTime = Number(timestamps[1]);
      
      this.resultBuffer.unmap();
      
      // Clean up
      if (this.querySet) this.querySet.destroy();
      if (this.resolveBuffer) this.resolveBuffer.destroy();
      if (this.resultBuffer) this.resultBuffer.destroy();
      
      this.querySet = null;
      this.resolveBuffer = null;
      this.resultBuffer = null;
      this.isPolling = false;
      
      // Convert nanoseconds to milliseconds
      return (endTime - startTime) / 1000000;
    } catch (error) {
      console.error('Error reading GPU timestamps:', error);
      this.isPolling = false;
      return null;
    }
  }
}