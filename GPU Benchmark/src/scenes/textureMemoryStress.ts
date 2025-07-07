// src/scenes/textureMemoryStress.ts
import * as THREE from 'three';

export function buildTextureMemoryStress(scene: THREE.Scene, renderer: any) {
  console.log('Building texture memory stress test...');
  
  const textureCount = 50;
  const textureSize = 2048; // 2K textures
  const materials: THREE.Material[] = [];
  
  // Create many unique textures
  for (let i = 0; i < textureCount; i++) {
    const canvas = document.createElement('canvas');
    canvas.width = textureSize;
    canvas.height = textureSize;
    const ctx = canvas.getContext('2d')!;
    
    // Generate procedural texture
    const imageData = ctx.createImageData(textureSize, textureSize);
    const data = imageData.data;
    
    for (let j = 0; j < data.length; j += 4) {
      data[j] = Math.sin(i + j * 0.01) * 127 + 128;     // R
      data[j + 1] = Math.cos(i + j * 0.01) * 127 + 128; // G
      data[j + 2] = Math.sin(i * j * 0.0001) * 127 + 128; // B
      data[j + 3] = 255; // A
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      normalMap: texture,
      roughnessMap: texture,
      metalnessMap: texture
    });
    
    materials.push(material);
  }
  
  // Create geometry grid
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const gridSize = Math.ceil(Math.sqrt(textureCount));
  
  for (let i = 0; i < textureCount; i++) {
    const mesh = new THREE.Mesh(geometry, materials[i]);
    const x = (i % gridSize) * 2 - gridSize;
    const z = Math.floor(i / gridSize) * 2 - gridSize;
    mesh.position.set(x, 0, z);
    scene.add(mesh);
  }
  
  // Lighting
  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);
  
  // Animation
  scene.userData.animate = (time: number) => {
    scene.children.forEach((child, i) => {
      if (child instanceof THREE.Mesh) {
        child.rotation.x = time * 0.001 + i * 0.1;
        child.rotation.y = time * 0.002 + i * 0.1;
      }
    });
  };
  
  // Calculate memory usage
  const textureMemory = textureCount * textureSize * textureSize * 4 * 4 / (1024 * 1024); // RGBA * 4 maps
  
  scene.userData.info = {
    textureCount: textureCount * 4, // 4 maps per material
    textureMemoryMB: Math.round(textureMemory),
    drawCalls: textureCount,
    triangles: textureCount * 12
  };
  
  console.log(`Texture stress test: ${textureCount} materials with ${textureMemory.toFixed(0)}MB of texture data`);
}

// src/scenes/shaderComplexity.ts
export function buildShaderComplexity(scene: THREE.Scene, renderer: any) {
  console.log('Building shader complexity test...');
  
  const sphereCount = 100;
  const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 16);
  
  // Complex shader with multiple effects
  const complexShader = {
    uniforms: {
      time: { value: 0 },
      resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
    },
    vertexShader: `
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec2 vUv;
      
      void main() {
        vPosition = position;
        vNormal = normal;
        vUv = uv;
        
        // Vertex displacement
        vec3 displaced = position + normal * sin(position.x * 10.0 + time) * 0.1;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec2 resolution;
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec2 vUv;
      
      // Simplex noise function
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
      
      float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        
        vec3 i = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        
        i = mod289(i);
        vec4 p = permute(permute(permute(
          i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));
          
        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;
        
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
        
        vec3 p0 = vec3(a0.xy,h.x);
        vec3 p1 = vec3(a0.zw,h.y);
        vec3 p2 = vec3(a1.xy,h.z);
        vec3 p3 = vec3(a1.zw,h.w);
        
        vec4 norm = 1.79284291400159 - 0.85373472095314 * vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;
        
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
      }
      
      void main() {
        // Multiple noise octaves
        float n1 = snoise(vPosition * 5.0 + time);
        float n2 = snoise(vPosition * 10.0 - time * 0.5);
        float n3 = snoise(vPosition * 20.0 + time * 0.25);
        
        // Combine noise
        float noise = n1 * 0.5 + n2 * 0.25 + n3 * 0.125;
        
        // Calculate fresnel
        vec3 viewDirection = normalize(cameraPosition - vPosition);
        float fresnel = pow(1.0 - dot(viewDirection, vNormal), 2.0);
        
        // Complex color calculation
        vec3 color1 = vec3(0.1, 0.5, 1.0) * (noise + 1.0) * 0.5;
        vec3 color2 = vec3(1.0, 0.3, 0.1) * fresnel;
        vec3 finalColor = mix(color1, color2, fresnel);
        
        // Add rim lighting
        float rim = 1.0 - max(0.0, dot(viewDirection, vNormal));
        finalColor += vec3(0.2, 0.4, 0.8) * pow(rim, 3.0);
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `
  };
  
  const material = new THREE.ShaderMaterial(complexShader);
  
  // Create sphere grid
  const gridSize = 10;
  for (let i = 0; i < sphereCount; i++) {
    const mesh = new THREE.Mesh(sphereGeometry, material);
    const x = (i % gridSize - gridSize / 2) * 2;
    const y = (Math.floor(i / gridSize) % gridSize - gridSize / 2) * 2;
    const z = Math.floor(i / (gridSize * gridSize)) * 2;
    mesh.position.set(x, y, z);
    scene.add(mesh);
  }
  
  // Simple light for comparison
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  // Animation
  scene.userData.animate = (time: number) => {
    material.uniforms.time.value = time * 0.001;
  };
  
  scene.userData.info = {
    shaderComplexity: 'High',
    drawCalls: sphereCount,
    triangles: sphereCount * sphereGeometry.attributes.position.count / 3,
    shaderOperations: 'Noise (3 octaves), Fresnel, Rim Lighting'
  };
}

// src/scenes/geometryComplexity.ts
export function buildGeometryComplexity(scene: THREE.Scene, renderer: any) {
  console.log('Building geometry complexity test...');
  
  // High-poly models with different LODs
  const lods = [
    { detail: 0, distance: 10 },   // Highest detail
    { detail: 1, distance: 25 },   // Medium detail
    { detail: 2, distance: 50 },   // Low detail
    { detail: 3, distance: 100 }   // Lowest detail
  ];
  
  // Create LOD objects
  for (let i = 0; i < 50; i++) {
    const lod = new THREE.LOD();
    
    // Create different detail levels
    lods.forEach(({ detail, distance }) => {
      const segments = Math.max(4, 32 >> detail); // 32, 16, 8, 4
      const geometry = new THREE.TorusKnotGeometry(1, 0.3, 256 >> detail, segments);
      const material = new THREE.MeshPhongMaterial({
        color: new THREE.Color().setHSL(i / 50, 0.7, 0.5),
        shininess: 100
      });
      const mesh = new THREE.Mesh(geometry, material);
      lod.addLevel(mesh, distance);
    });
    
    // Position in spiral
    const angle = i * 0.3;
    const radius = i * 0.5;
    lod.position.set(
      Math.cos(angle) * radius,
      (i - 25) * 0.5,
      Math.sin(angle) * radius
    );
    
    scene.add(lod);
  }
  
  // Lighting
  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);
  
  const pointLight = new THREE.PointLight(0xffffff, 1, 100);
  pointLight.position.set(0, 10, 0);
  scene.add(pointLight);
  
  // Animation
  scene.userData.animate = (time: number) => {
    // Rotate camera around scene
    const radius = 30;
    const angle = time * 0.0001;
    camera.position.x = Math.cos(angle) * radius;
    camera.position.z = Math.sin(angle) * radius;
    camera.lookAt(0, 0, 0);
    
    // Update LODs
    scene.traverse((object) => {
      if (object instanceof THREE.LOD) {
        object.update(camera);
      }
    });
  };
  
  scene.userData.info = {
    lodObjects: 50,
    lodLevels: 4,
    maxTriangles: 50 * (256 * 32 * 2), // Torus knot triangle count
    technique: 'Level of Detail (LOD)'
  };
}