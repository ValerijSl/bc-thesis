async function initWebGPU() {
    const canvas = document.getElementById('webgpu-canvas');
    const adapter = await navigator.gpu.requestAdapter();
    const device = await adapter.requestDevice();
    const context = canvas.getContext('webgpu');

    const swapChainFormat = 'bgra8unorm';

    const swapChain = context.configureSwapChain({
        device: device,
        format: swapChainFormat,
    });

    // Vertex Shader
    const vertexShaderSource = `
        [[stage(vertex)]]
        fn main([[location(0)]] position: vec4<f32>, [[location(1)]] color: vec4<f32>) -> [[builtin(position)]] vec4<f32> {
            return position;
        }`;

    // Fragment Shader
    const fragmentShaderSource = `
        [[stage(fragment)]]
        fn main() -> [[location(0)]] vec4<f32> {
            return vec4<f32>(1.0, 0.0, 0.0, 1.0);
        }`;

    // Rest of the code for creating pipeline, buffers, and drawing the triangle
    // ...

    function frame() {
        // Code for rendering each frame
        // ...

        requestAnimationFrame(frame);
    }

    frame();
}

initWebGPU();
