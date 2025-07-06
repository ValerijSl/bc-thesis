// src/webgpu/webgpuTest.ts
import * as THREE from 'three/webgpu';
import { MeshBasicNodeMaterial } from 'three/webgpu';
import { uniform, vec3, positionLocal, Fn, length, float, vec4 } from 'three/tsl';

export async function initWebGPUTest() {
  console.log('Initializing Three.js WebGPU test...');
  
  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.zIndex = '1000';
  document.body.appendChild(canvas);
  
  // Scene setup
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  
  // Camera
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 30;
  
  // WebGPU Renderer
  const renderer = new THREE.WebGPURenderer({ 
    canvas,
    antialias: true 
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  
  // Initialize WebGPU
  await renderer.init();
  console.log('WebGPU Renderer initialized!');
  
  // Create instanced mesh with WebGPU
  const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  const count = 10000;
  
  // WebGPU Node Material
  const material = new MeshBasicNodeMaterial();
  
  // Custom shader using TSL
  const colorShader = Fn(() => {
    const time = uniform(0);
    const pos = positionLocal;
    
    // Animated color based on position and time
    const r = pos.x.add(time).sin().mul(0.5).add(0.5);
    const g = pos.y.add(time.mul(1.3)).sin().mul(0.5).add(0.5);
    const b = pos.z.add(time.mul(0.7)).sin().mul(0.5).add(0.5);
    
    return vec4(r, g, b, 1);
  });
  
  material.colorNode = colorShader();
  
  // Create InstancedMesh
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  
  // Set random positions
  const dummy = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    dummy.position.set(
      (Math.random() - 0.5) * 50,
      (Math.random() - 0.5) * 50,
      (Math.random() - 0.5) * 50
    );
    dummy.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    dummy.scale.setScalar(0.5 + Math.random());
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  
  scene.add(mesh);
  
  // Info overlay
  const info = document.createElement('div');
  info.style.position = 'fixed';
  info.style.top = '10px';
  info.style.left = '10px';
  info.style.color = 'white';
  info.style.background = 'rgba(0,0,0,0.7)';
  info.style.padding = '10px';
  info.style.fontFamily = 'monospace';
  info.style.zIndex = '1001';
  info.innerHTML = `
    <h3>Three.js WebGPU Renderer</h3>
    <div>Objects: ${count}</div>
    <div>Renderer: WebGPU</div>
    <div>Press ESC to close</div>
  `;
  document.body.appendChild(info);
  
  // FPS counter
  let fps = 0;
  let frames = 0;
  let lastTime = performance.now();
  
  // Animation
  function animate() {
    requestAnimationFrame(animate);
    
    // Update FPS
    frames++;
    const currentTime = performance.now();
    if (currentTime >= lastTime + 1000) {
      fps = Math.round((frames * 1000) / (currentTime - lastTime));
      info.innerHTML = `
        <h3>Three.js WebGPU Renderer</h3>
        <div>Objects: ${count}</div>
        <div>Renderer: WebGPU</div>
        <div>FPS: ${fps}</div>
        <div>Press ESC to close</div>
      `;
      frames = 0;
      lastTime = currentTime;
    }
    
    // Rotate mesh
    mesh.rotation.x += 0.001;
    mesh.rotation.y += 0.002;
    
    // Update time uniform
    if (material.colorNode && material.colorNode.parameters) {
      const timeUniform = material.colorNode.parameters.time;
      if (timeUniform) {
        timeUniform.value = currentTime * 0.001;
      }
    }
    
    renderer.render(scene, camera);
  }
  
  animate();
  
  // Handle resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
  
  // Close on ESC
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      canvas.remove();
      info.remove();
    }
  });
  
  return renderer;
}