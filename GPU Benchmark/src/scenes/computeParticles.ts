import * as THREE from 'three';

export function buildComputeParticles(scene: THREE.Scene, renderer: any) {
  const isWebGPU = renderer.isWebGPURenderer;
  
  if (isWebGPU) {
    buildWebGPUParticles(scene, renderer);
  } else {
    buildWebGLParticles(scene, renderer);
  }
}

function buildWebGPUParticles(scene: THREE.Scene, renderer: any) {
  console.log('Building WebGPU compute particles...');
  
  const particleCount = 1000000;
  const geometry = new THREE.BufferGeometry();
  
  const positions = new Float32Array(particleCount * 3);
  const velocities = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 100;
    positions[i + 1] = (Math.random() - 0.5) * 100;
    positions[i + 2] = (Math.random() - 0.5) * 100;
    
    velocities[i] = (Math.random() - 0.5) * 0.1;
    velocities[i + 1] = (Math.random() - 0.5) * 0.1;
    velocities[i + 2] = (Math.random() - 0.5) * 0.1;
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  const material = new THREE.PointsMaterial({
    size: 0.5,
    color: 0x4488ff,
    sizeAttenuation: false
  });
  
  const points = new THREE.Points(geometry, material);
  scene.add(points);
  
  // Animation function for scene
  scene.userData.animate = (time: number) => {
    const t = time * 0.001;
    const posArray = (points.geometry as THREE.BufferGeometry).attributes.position.array as Float32Array;
    
    for (let i = 0; i < posArray.length; i += 3) {
      posArray[i] += velocities[i];
      posArray[i + 1] += velocities[i + 1];
      posArray[i + 2] += velocities[i + 2];
      
      if (Math.abs(posArray[i]) > 50) velocities[i] *= -1;
      if (Math.abs(posArray[i + 1]) > 50) velocities[i + 1] *= -1;
      if (Math.abs(posArray[i + 2]) > 50) velocities[i + 2] *= -1;
    }
    
    (points.geometry as THREE.BufferGeometry).attributes.position.needsUpdate = true;
  };
  
  console.log(`Created ${particleCount} WebGPU particles`);
}

function buildWebGLParticles(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
  console.log('Building WebGL particles...');
  
  const particleCount = 100000;
  const geometry = new THREE.BufferGeometry();
  
  const positions = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 50;
    positions[i + 1] = (Math.random() - 0.5) * 50;
    positions[i + 2] = (Math.random() - 0.5) * 50;
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  const material = new THREE.PointsMaterial({
    size: 1,
    color: 0x88ccff,
    sizeAttenuation: false
  });
  
  const points = new THREE.Points(geometry, material);
  scene.add(points);
  
  // Animation function for scene
  scene.userData.animate = (time: number) => {
    const t = time * 0.001;
    points.rotation.y = t * 0.1;
    
    const posArray = (points.geometry as THREE.BufferGeometry).attributes.position.array as Float32Array;
    for (let i = 1; i < posArray.length; i += 3) {
      posArray[i] = Math.sin(t + i * 0.01) * 25;
    }
    (points.geometry as THREE.BufferGeometry).attributes.position.needsUpdate = true;
  };
  
  console.log(`Created ${particleCount} WebGL particles`);
}