import * as THREE from 'three';

export function buildDrawCallStorm(scene: THREE.Scene, renderer: any) {
  const INSTANCE_COUNT = 100000; // 100,000 objektů!
  
  console.log(`Creating ${INSTANCE_COUNT} instanced cubes...`);
  
  // Lighting
  const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(10, 10, 5);
  scene.add(directionalLight);
  
  // Create instanced mesh
  const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  const material = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    vertexColors: true // Pro různé barvy instancí
  });
  
  // Create InstancedMesh - magie je zde!
  const instancedMesh = new THREE.InstancedMesh(geometry, material, INSTANCE_COUNT);
  instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); // Pro animaci
  
  // Temporary objects pro transformace
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  
  // Nastavíme pozice a barvy pro každou instanci
  const positions = new Float32Array(INSTANCE_COUNT * 3);
  const colors = new Float32Array(INSTANCE_COUNT * 3);
  const scales = new Float32Array(INSTANCE_COUNT);
  const rotationSpeeds = new Float32Array(INSTANCE_COUNT * 3);
  
  for (let i = 0; i < INSTANCE_COUNT; i++) {
    // Pozice ve sférickém tvaru
    const radius = 20 + Math.random() * 80;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);
    
    // Nastavíme transformaci
    dummy.position.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
    dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    dummy.scale.setScalar(0.5 + Math.random() * 0.5);
    dummy.updateMatrix();
    
    // Aplikujeme matrix na instanci
    instancedMesh.setMatrixAt(i, dummy.matrix);
    
    // Nastavíme barvu
    color.setHSL(i / INSTANCE_COUNT, 0.7, 0.5);
    instancedMesh.setColorAt(i, color);
    
    // Uložíme data pro animaci
    scales[i] = dummy.scale.x;
    rotationSpeeds[i * 3] = (Math.random() - 0.5) * 0.01;
    rotationSpeeds[i * 3 + 1] = (Math.random() - 0.5) * 0.01;
    rotationSpeeds[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
  }
  
  // Musíme říct Three.js, že jsme změnili data
  instancedMesh.instanceMatrix.needsUpdate = true;
  if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true;
  
  scene.add(instancedMesh);
  
  // Přidáme centrální světelný objekt
  const coreGeometry = new THREE.IcosahedronGeometry(5, 2);
  const coreMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    wireframe: true,
    opacity: 0.5,
    transparent: true
  });
  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  scene.add(core);
  
  // Animace
  let time = 0;
  scene.userData.animate = (deltaTime: number) => {
    time += deltaTime * 0.001;
    
    // Animace jádra
    core.rotation.x = time * 0.5;
    core.rotation.y = time * 0.3;
    core.scale.setScalar(1 + Math.sin(time * 2) * 0.1);
    
    // Animace instancí (optimalizovaná - animujeme jen část)
    const animatedCount = Math.min(10000, INSTANCE_COUNT); // Animuj max 10k pro výkon
    
    for (let i = 0; i < animatedCount; i++) {
      // Získáme aktuální matrix
      instancedMesh.getMatrixAt(i, dummy.matrix);
      dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
      
      // Rotace
      dummy.rotation.x += rotationSpeeds[i * 3];
      dummy.rotation.y += rotationSpeeds[i * 3 + 1];
      dummy.rotation.z += rotationSpeeds[i * 3 + 2];
      
      // Pulzování
      const scaleFactor = scales[i] * (1 + Math.sin(time + i * 0.01) * 0.1);
      dummy.scale.setScalar(scaleFactor);
      
      // Update matrix
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(i, dummy.matrix);
    }
    
    instancedMesh.instanceMatrix.needsUpdate = true;
    
    // Celková rotace
    instancedMesh.rotation.y = time * 0.05;
  };
  
  console.log(`Scene created with 1 InstancedMesh containing ${INSTANCE_COUNT} instances`);
  console.log(`Draw calls: 1 (místo ${INSTANCE_COUNT}!)`);
  
  // Info pro UI
  scene.userData.info = {
    instances: INSTANCE_COUNT,
    drawCalls: 1,
    triangles: 12 * INSTANCE_COUNT,
    technique: 'Instanced Rendering'
  };
}