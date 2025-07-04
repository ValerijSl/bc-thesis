// WebGPU inicializace vyžaduje asynchronní přístup
async function initWebGPU() {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
        throw new Error('WebGPU není podporováno');
    }
    
    const device = await adapter.requestDevice();
    const context = canvas.getContext('webgpu');
    
    // Konfigurace canvas
    const swapChainFormat = 'bgra8unorm';
    context.configure({
        device: device,
        format: swapChainFormat,
    });
}