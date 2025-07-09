// parallax-shader.js  
// Improved parallax mapping shader with better compatibility

export class ParallaxShader {
    constructor() {
        this.vertexShader = this.getVertexShader();
        this.fragmentShader = this.getFragmentShader();
        this.textureLoader = new THREE.TextureLoader();
    }
    
    /**
     * Creates an improved parallax material
     */
    createMaterial(params = {}) {
        const textures = this.createTextures();
        
        const material = new THREE.ShaderMaterial({
            uniforms: {
                // Texture maps
                albedoMap: { value: textures.albedo },
                heightMap: { value: textures.height },
                normalMap: { value: textures.normal },
                
                // Enhanced parallax parameters
                parallaxScale: { value: params.parallaxScale || 0.08 },
                parallaxLayers: { value: params.parallaxLayers || 16 },
                steepParallax: { value: params.steepParallax || false },
                
                // Lighting
                lightPosition: { value: new THREE.Vector3(10, 15, 10) },
                lightColor: { value: new THREE.Color(0xffffff) },
                
                // Material properties
                materialColor: { value: new THREE.Color(0xffffff) },
                
                // Camera
                cameraPosition: { value: new THREE.Vector3() },
                
                // Time
                time: { value: 0.0 }
            },
            
            vertexShader: this.vertexShader,
            fragmentShader: this.fragmentShader,
            
            side: THREE.DoubleSide,
            wireframe: params.wireframe || false
        });
        
        // Store reference for easy updates
        material.isParallaxShader = true;
        
        return material;
    }
    
    /**
     * Improved vertex shader
     */
    getVertexShader() {
        return `
            uniform vec3 cameraPosition;
            uniform float time;
            
            varying vec2 vUv;
            varying vec3 vWorldPosition;
            varying vec3 vNormal;
            varying vec3 vTangent;
            varying vec3 vBitangent;
            varying vec3 vViewDir;
            varying mat3 vTBN;
            
            void main() {
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz;
                vUv = uv;
                
                // Calculate tangent space
                vec3 objectNormal = vec3(normal);
                vec3 objectTangent = vec3(1.0, 0.0, 0.0);
                
                // Create bitangent
                vec3 objectBitangent = cross(objectNormal, objectTangent);
                
                // Transform to world space
                vNormal = normalize(normalMatrix * objectNormal);
                vTangent = normalize(normalMatrix * objectTangent);
                vBitangent = normalize(normalMatrix * objectBitangent);
                
                // Create TBN matrix
                vTBN = mat3(vTangent, vBitangent, vNormal);
                
                // Calculate view direction in tangent space
                vec3 worldViewDir = normalize(cameraPosition - vWorldPosition);
                vViewDir = normalize(transpose(vTBN) * worldViewDir);
                
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
    }
    
    /**
     * Improved fragment shader with multiple parallax techniques
     */
    getFragmentShader() {
        return `
            precision mediump float;
            
            uniform sampler2D albedoMap;
            uniform sampler2D heightMap;
            uniform sampler2D normalMap;
            uniform float parallaxScale;
            uniform int parallaxLayers;
            uniform bool steepParallax;
            uniform vec3 lightPosition;
            uniform vec3 lightColor;
            uniform vec3 materialColor;
            uniform vec3 cameraPosition;
            uniform float time;
            
            varying vec2 vUv;
            varying vec3 vWorldPosition;
            varying vec3 vNormal;
            varying vec3 vTangent;
            varying vec3 vBitangent;
            varying vec3 vViewDir;
            varying mat3 vTBN;
            
            // Simple parallax mapping
            vec2 parallaxMapping(vec2 texCoords, vec3 viewDir) {
                float height = texture2D(heightMap, texCoords).r;
                vec2 p = viewDir.xy * (height * parallaxScale);
                return texCoords - p;
            }
            
            // Steep parallax mapping (approximation)
            vec2 steepParallaxMapping(vec2 texCoords, vec3 viewDir) {
                const int numLayers = 16;
                float layerDepth = 1.0 / float(numLayers);
                float currentLayerDepth = 0.0;
                
                vec2 P = viewDir.xy * parallaxScale;
                vec2 deltaTexCoords = P / float(numLayers);
                
                vec2 currentTexCoords = texCoords;
                float currentDepthMapValue = texture2D(heightMap, currentTexCoords).r;
                
                // Layer by layer search
                for(int i = 0; i < 16; i++) {
                    if(currentLayerDepth >= currentDepthMapValue) break;
                    
                    currentTexCoords -= deltaTexCoords;
                    currentDepthMapValue = texture2D(heightMap, currentTexCoords).r;
                    currentLayerDepth += layerDepth;
                }
                
                // Simple interpolation
                vec2 prevTexCoords = currentTexCoords + deltaTexCoords;
                float afterDepth = currentDepthMapValue - currentLayerDepth;
                float beforeDepth = texture2D(heightMap, prevTexCoords).r - currentLayerDepth + layerDepth;
                
                float weight = afterDepth / (afterDepth - beforeDepth + 0.001);
                return mix(currentTexCoords, prevTexCoords, weight);
            }
            
            void main() {
                vec3 viewDir = normalize(vViewDir);
                
                // Choose parallax technique
                vec2 texCoords;
                if (steepParallax) {
                    texCoords = steepParallaxMapping(vUv, viewDir);
                } else {
                    texCoords = parallaxMapping(vUv, viewDir);
                }
                
                // Clamp to prevent artifacts
                texCoords = clamp(texCoords, 0.0, 1.0);
                
                // Sample textures
                vec3 albedo = texture2D(albedoMap, texCoords).rgb * materialColor;
                vec3 normalMapSample = texture2D(normalMap, texCoords).rgb * 2.0 - 1.0;
                
                // Transform normal to world space
                vec3 normal = normalize(vTBN * normalMapSample);
                
                // Lighting calculations
                vec3 lightDir = normalize(lightPosition - vWorldPosition);
                vec3 worldViewDir = normalize(cameraPosition - vWorldPosition);
                
                // Diffuse lighting
                float NdotL = max(dot(normal, lightDir), 0.0);
                vec3 diffuse = NdotL * lightColor * albedo;
                
                // Ambient
                vec3 ambient = 0.2 * albedo;
                
                // Specular (Blinn-Phong)
                vec3 halfwayDir = normalize(lightDir + worldViewDir);
                float NdotH = max(dot(normal, halfwayDir), 0.0);
                float spec = pow(NdotH, 32.0);
                vec3 specular = spec * lightColor * 0.3;
                
                // Combine lighting
                vec3 finalColor = ambient + diffuse + specular;
                
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `;
    }
    
    /**
     * Creates improved procedural textures
     */
    createTextures() {
        return {
            albedo: this.createImprovedAlbedoTexture(),
            height: this.createImprovedHeightTexture(),
            normal: this.createImprovedNormalTexture()
        };
    }
    
    /**
     * Creates improved albedo texture
     */
    createImprovedAlbedoTexture() {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Base concrete color
        ctx.fillStyle = '#808080';
        ctx.fillRect(0, 0, size, size);
        
        // Add multi-scale noise
        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const i = (y * size + x) * 4;
                
                // Multi-octave noise
                let noise = 0;
                noise += Math.sin(x * 0.01) * Math.sin(y * 0.01) * 0.5;
                noise += Math.sin(x * 0.02) * Math.sin(y * 0.02) * 0.25;
                noise += Math.sin(x * 0.04) * Math.sin(y * 0.04) * 0.125;
                noise += Math.sin(x * 0.08) * Math.sin(y * 0.08) * 0.0625;
                
                const variation = noise * 40;
                
                data[i] = Math.max(0, Math.min(255, data[i] + variation));
                data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + variation));
                data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + variation));
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.generateMipmaps = true;
        return texture;
    }
    
    /**
     * Creates improved height map
     */
    createImprovedHeightTexture() {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        const imageData = ctx.createImageData(size, size);
        const data = imageData.data;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const i = (y * size + x) * 4;
                
                // Improved multi-octave height field
                let height = 0;
                height += Math.sin(x * 0.005) * Math.sin(y * 0.005) * 0.5;
                height += Math.sin(x * 0.01) * Math.sin(y * 0.01) * 0.25;
                height += Math.sin(x * 0.02) * Math.sin(y * 0.02) * 0.125;
                height += Math.sin(x * 0.04) * Math.sin(y * 0.04) * 0.0625;
                
                // Add some randomness
                height += (Math.random() - 0.5) * 0.1;
                
                // Normalize to 0-1
                height = (height + 1) * 0.5;
                height = Math.max(0, Math.min(1, height));
                
                const value = Math.floor(height * 255);
                data[i] = data[i + 1] = data[i + 2] = value;
                data[i + 3] = 255;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.generateMipmaps = true;
        return texture;
    }
    
    /**
     * Creates improved normal map from height field
     */
    createImprovedNormalTexture() {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // First create a height field
        const heights = new Array(size * size);
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                let height = 0;
                height += Math.sin(x * 0.01) * Math.sin(y * 0.01) * 0.5;
                height += Math.sin(x * 0.02) * Math.sin(y * 0.02) * 0.25;
                height += Math.sin(x * 0.04) * Math.sin(y * 0.04) * 0.125;
                
                heights[y * size + x] = height;
            }
        }
        
        // Calculate normals from height field
        const imageData = ctx.createImageData(size, size);
        const data = imageData.data;
        
        const strength = 2.0;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const i = (y * size + x) * 4;
                
                // Sample neighboring heights
                const hL = heights[y * size + Math.max(0, x - 1)];
                const hR = heights[y * size + Math.min(size - 1, x + 1)];
                const hD = heights[Math.max(0, y - 1) * size + x];
                const hU = heights[Math.min(size - 1, y + 1) * size + x];
                
                // Calculate normal
                const dx = (hR - hL) * strength;
                const dy = (hU - hD) * strength;
                const dz = 1.0;
                
                const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
                const nx = dx / length;
                const ny = dy / length;
                const nz = dz / length;
                
                // Convert to 0-255 range
                data[i] = Math.floor((nx * 0.5 + 0.5) * 255);
                data[i + 1] = Math.floor((ny * 0.5 + 0.5) * 255);
                data[i + 2] = Math.floor((nz * 0.5 + 0.5) * 255);
                data[i + 3] = 255;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.generateMipmaps = true;
        return texture;
    }
    
    /**
     * Updates material parameters
     */
    updateMaterial(material, params) {
        if (!material.isParallaxShader) return;
        
        const uniforms = material.uniforms;
        
        if (params.parallaxScale !== undefined) {
            uniforms.parallaxScale.value = params.parallaxScale;
        }
        if (params.steepParallax !== undefined) {
            uniforms.steepParallax.value = params.steepParallax;
        }
        if (params.wireframe !== undefined) {
            material.wireframe = params.wireframe;
        }
        
        // Update time for animations
        uniforms.time.value = performance.now() * 0.001;
        
        // Update camera position
        if (params.cameraPosition) {
            uniforms.cameraPosition.value.copy(params.cameraPosition);
        }
    }
}