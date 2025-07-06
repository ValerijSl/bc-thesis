import * as THREE from 'three';

export function buildGbufferScene(scene: THREE.Scene, renderer: any) {
  console.log('Building G-buffer deferred rendering scene...');
  
  // Many lights for deferred rendering benefit
  const lightCount = 100;
  const lights: THREE.PointLight[] = [];
  
  for (let i = 0; i < lightCount; i++) {
    const light = new THREE.PointLight(
      new THREE.Color().setHSL(Math.random(), 1, 0.5),
      2,
      15
    );
    
    light.position.set(
      (Math.random() - 0.5) * 50,
      Math.random() * 20,
      (Math.random() - 0.5) * 50
    );
    
    scene.add(light);
    lights.push(light);
    
    // Add light helper spheres
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.2),
      new THREE.MeshBasicMaterial({ color: light.color })
    );
    sphere.position.copy(light.position);
    scene.add(sphere);
  }
  
  // Complex geometry
  const material = new THREE.MeshStandardMaterial({
    color: 0x808080,
    metalness: 0.5,
    roughness: 0.3
  });
  
  // Add many spheres
  const sphereGeometry = new THREE.SphereGeometry(1, 32, 16);
  for (let i = 0; i < 500; i++) {
    const mesh = new THREE.Mesh(sphereGeometry, material);
    mesh.position.set(
      (Math.random() - 0.5) * 40,
      Math.random() * 10,
      (Math.random() - 0.5) * 40
    );
    mesh.scale.setScalar(0.5 + Math.random() * 1.5);
    scene.add(mesh);
  }
  
  // Ground plane
  const groundGeometry = new THREE.PlaneGeometry(100, 100);
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x404040,
    metalness: 0,
    roughness: 1
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1;
  ground.receiveShadow = true;
  scene.add(ground);
  
  // Animate lights
  scene.userData.animateLights = (time: number) => {
    lights.forEach((light, i) => {
      const angle = time * 0.001 + i * 0.1;
      light.position.x = Math.sin(angle) * 25;
      light.position.z = Math.cos(angle) * 25;
      light.position.y = 5 + Math.sin(angle * 2) * 5;
      
      // Update helper sphere position
      const helper = scene.children.find(child => 
        child instanceof THREE.Mesh && 
        child.position.equals(light.position)
      );
      if (helper) {
        helper.position.copy(light.position);
      }
    });
  };
  
  // Setup animation
  scene.userData.animate = scene.userData.animateLights;
  
  console.log(`G-buffer scene created with ${lightCount} lights and ${500} spheres`);
}