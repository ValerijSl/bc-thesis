async function initWebGPU() {
    const canvas = document.getElementById('webgpu-canvas');
    const adapter = await navigator.gpu?.requestAdapter();
    if (!adapter) return;
    
    const device = await adapter.requestDevice();
    const context = canvas.getContext('webgpu');
    const format = navigator.gpu.getPreferredCanvasFormat();
    
    context.configure({ device, format });
    
    const shader = device.createShaderModule({
        code: `
        struct VertexOut {
            @builtin(position) pos: vec4f,
            @location(0) color: vec3f
        }
        
        @vertex fn vs(@builtin(vertex_index) i: u32) -> VertexOut {
            var pos = array(vec2f(0,.5), vec2f(-.5,-.5), vec2f(.5,-.5));
            var col = array(vec3f(1,0,0), vec3f(0,1,0), vec3f(0,0,1));
            return VertexOut(vec4f(pos[i], 0, 1), col[i]);
        }
        
        @fragment fn fs(in: VertexOut) -> @location(0) vec4f {
            return vec4f(in.color, 1);
        }`
    });
    
    const pipeline = device.createRenderPipeline({
        layout: 'auto',
        vertex: { module: shader, entryPoint: 'vs' },
        fragment: { module: shader, entryPoint: 'fs', targets: [{ format }] },
        primitive: { topology: 'triangle-list' }
    });
    
    const encoder = device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
        colorAttachments: [{
            view: context.getCurrentTexture().createView(),
            loadOp: 'clear',
            storeOp: 'store'
        }]
    });
    
    pass.setPipeline(pipeline);
    pass.draw(3);
    pass.end();
    device.queue.submit([encoder.finish()]);
}

initWebGPU();