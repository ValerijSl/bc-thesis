// WebGPU Type Definitions
interface Navigator {
  gpu?: GPU;
}

interface GPU {
  requestAdapter(options?: GPURequestAdapterOptions): Promise<GPUAdapter | null>;
  getPreferredCanvasFormat(): GPUTextureFormat;
}

interface GPUAdapter {
  requestDevice(descriptor?: GPUDeviceDescriptor): Promise<GPUDevice>;
  requestAdapterInfo(): Promise<GPUAdapterInfo>;
  features: GPUSupportedFeatures;
  limits: GPUSupportedLimits;
}

interface GPUAdapterInfo {
  vendor?: string;
  architecture?: string;
  device?: string;
  description?: string;
}

interface GPUSupportedFeatures extends ReadonlySet<string> {}

interface GPUSupportedLimits {
  [key: string]: number;
}

interface GPUDevice {
  features: GPUSupportedFeatures;
  limits: GPUSupportedLimits;
  createQuerySet(descriptor: GPUQuerySetDescriptor): GPUQuerySet;
  createBuffer(descriptor: GPUBufferDescriptor): GPUBuffer;
  queue: GPUQueue;
}

interface GPURequestAdapterOptions {
  powerPreference?: 'low-power' | 'high-performance';
  forceFallbackAdapter?: boolean;
}

interface GPUDeviceDescriptor {
  label?: string;
  requiredFeatures?: string[];
  requiredLimits?: Record<string, number>;
}

interface GPUTextureFormat {}

interface GPUQuerySet {}
interface GPUQuerySetDescriptor {
  type: string;
  count: number;
}

interface GPUBuffer {
  mapAsync(mode: number): Promise<void>;
  getMappedRange(): ArrayBuffer;
  unmap(): void;
  destroy(): void;
}

interface GPUBufferDescriptor {
  size: number;
  usage: number;
}

interface GPUQueue {
  submit(commandBuffers: GPUCommandBuffer[]): void;
}

interface GPUCommandBuffer {}

declare const GPUBufferUsage: {
  MAP_READ: number;
  COPY_DST: number;
  QUERY_RESOLVE: number;
  COPY_SRC: number;
};

declare const GPUMapMode: {
  READ: number;
};

export {};