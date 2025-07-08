// Chapter 7 - Parallax Mapping Shader
// Implements Parallax Occlusion Mapping (POM) with adaptive layer count

export class ParallaxShader {
    constructor() {
        this.vertexShader = this.getVertexShader();
        this.fragmentShader = this.getFragmentShader();
        this.textureLoader = new THREE.TextureLoader();
    }
    
    /**
     * Creates a parallax mapping material
     * @param {Object} params - Material parameters
     * @returns {THREE.ShaderMaterial}
     */
    createMaterial(params = {}) {
        const textures = this.createTextures();
        
        const material = new THREE.ShaderMaterial({
            uniforms: {
                // Texture maps
                albedoMap: { value: textures.albedo },
                heightMap: { value: textures.height },
                normalMap: { value: textures.normal },
                roughnessMap: { value: textures.roughness },
                
                // Parallax parameters
                parallaxScale: { value: params.parallaxScale || 0.1 },
                minLayers: { value: params.minLayers || 8.0 },
                maxLayers: { value: params.maxLayers || 32.0 },
                
                // Lighting
                lightPosition: { value: new THREE.Vector3(5, 10, 5) },
                lightColor: { value: new THREE.Color(0xffffff) },
                lightIntensity: { value: 1.0 },
                
                // Material properties
                materialColor: { value: new THREE.Color(0xffffff) },
                roughness: { value: 0.5 },
                metalness: { value: 0.1 },
                
                // Camera
                cameraPosition: { value: new THREE.Vector3() },
                
                // Time for animations
                time: { value: 0.0 }
            },
            
            vertexShader: this.vertexShader,
            fragmentShader: this.fragmentShader,
            
            // Render state
            side: THREE.DoubleSide,
            transparent: false,
            
            // Enable derivatives for normal mapping
            extensions: {
                derivatives: true
            }
        });
        
        // Mark for updates
        material.needsUpdate = true;
        
        return material;
    }
    
    /**
     * Vertex shader for parallax mapping
     * Calculates tangent space matrix for fragment shader
     */
    getVertexShader() {
        return `
            // Attributes
            attribute vec3 position;
            attribute vec3 normal;
            attribute vec2 uv;
            attribute vec4 tangent;
            
            // Uniforms
            uniform mat4 modelMatrix;
            uniform mat4 modelViewMatrix;
            uniform mat4 projectionMatrix;
            uniform mat3 normalMatrix;
            uniform vec3 cameraPosition;
            
            // Varyings to fragment shader
            varying vec2 vUv;
            varying vec3 vWorldPosition;
            varying vec3 vViewPosition;
            varying vec3 vNormal;
            varying vec3 vTangent;
            varying vec3 vBitangent;
            varying mat3 vTBN;
            varying vec3 vViewDir;
            
            void main() {
                // Transform position
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                
                vWorldPosition = worldPosition.xyz;
                vViewPosition = mvPosition.xyz;
                vUv = uv;
                
                // Transform normals and tangents to world space
                vNormal = normalize(normalMatrix * normal);
                vTangent = normalize(normalMatrix * tangent.xyz);
                
                // Calculate bitangent using cross product
                // tangent.w contains handedness (+1 or -1)
                vBitangent = normalize(cross(vNormal, vTangent) * tangent.w);
                
                // Create TBN matrix for tangent space calculations
                vTBN = mat3(vTangent, vBitangent, vNormal);
                
                // Calculate view direction in tangent space
                vec3 worldViewDir = normalize(cameraPosition - vWorldPosition);
                vViewDir = normalize(transpose(vTBN) * worldViewDir);
                
                gl_Position = projectionMatrix * mvPosition;
            }
        `;
    }
    
    /**
     * Fragment shader implementing Parallax Occlusion Mapping
     * Uses adaptive layer count based on viewing angle
     */
    getFragmentShader() {
        return `
            #extension GL_OES_standard_derivatives : enable
            
            precision highp float;
            
            // Texture samplers
            uniform sampler2D albedoMap;
            uniform sampler2D heightMap;
            uniform sampler2D normalMap;
            uniform sampler2D roughnessMap;
            
            // Parallax parameters
            uniform float parallaxScale;
            uniform float minLayers;
            uniform float maxLayers;
            
            // Lighting
            uniform vec3 lightPosition;
            uniform vec3 lightColor;
            uniform float lightIntensity;
            
            // Material properties
            uniform vec3 materialColor;
            uniform float roughness;
            uniform float metalness;
            
            // Camera
            uniform vec3 cameraPosition;
            
            // Time for animations
            uniform float time;
            
            // Varyings from vertex shader
            varying vec2 vUv;
            varying vec3 vWorldPosition;
            varying vec3 vViewPosition;
            varying vec3 vNormal;
            varying vec3 vTangent;
            varying vec3 vBitangent;
            varying mat3 vTBN;
            varying vec3 vViewDir;
            
            /**
             * Parallax Occlusion Mapping implementation
             * Returns displaced texture coordinates
             */
            vec2 parallaxOcclusionMapping(vec2 texCoords, vec3 viewDir) {
                // Early exit if parallax is disabled
                if (parallaxScale <= 0.0) {
                    return texCoords;
                }
                
                // Adaptive layer count based on viewing angle
                float numLayers = mix(maxLayers, minLayers, abs(dot(vec3(0.0, 0.0, 1.0), viewDir)));
                
                // Ray marching parameters
                float layerDepth = 1.0 / numLayers;
                float currentLayerDepth = 0.0;
                
                // Calculate offset direction and step size
                vec2 P = viewDir.xy * parallaxScale;
                vec2 deltaTexCoords = P / numLayers;
                
                // Start ray marching
                vec2 currentTexCoords = texCoords;
                float currentDepthMapValue = texture2D(heightMap, currentTexCoords).r;
                
                // March along the ray until we hit a surface
                while (currentLayerDepth < currentDepthMapValue) {
                    currentTexCoords -= deltaTexCoords;
                    currentDepthMapValue = texture2D(heightMap, currentTexCoords).r;
                    currentLayerDepth += layerDepth;
                }
                
                // Parallax occlusion refinement using linear interpolation
                vec2 prevTexCoords = currentTexCoords + deltaTexCoords;
                
                float afterDepth = currentDepthMapValue - currentLayerDepth;
                float beforeDepth = texture2D(heightMap, prevTexCoords).r - currentLayerDepth + layerDepth;
                
                float weight = afterDepth / (afterDepth - beforeDepth);
                vec2 finalTexCoords = prevTexCoords * weight + currentTexCoords * (1.0 - weight);
                
                return finalTexCoords;
            }
            
            /**
             * Normal mapping with proper tangent space transformation
             */
            vec3 getNormalFromMap(vec2 texCoords) {
                vec3 normal = texture2D(normalMap, texCoords).rgb;
                normal = normal * 2.0 - 1.0; // Convert from [0,1] to [-1,1]
                
                // Transform from tangent space to world space
                return normalize(vTBN * normal);
            }
            
            /**
             * Simple Blinn-Phong lighting model
             */
            vec3 calculateLighting(vec3 normal, vec3 albedo, vec2 texCoords) {
                // Material properties
                float roughnessValue = texture2D(roughnessMap, texCoords).r * roughness;
                
                // Light calculations
                vec3 lightDir = normalize(lightPosition - vWorldPosition);
                vec3 viewDir = normalize(cameraPosition - vWorldPosition);
                vec3 halfwayDir = normalize(lightDir + viewDir);
                
                // Attenuation
                float distance = length(lightPosition - vWorldPosition);
                float attenuation = 1.0 / (1.0 + 0.09 * distance + 0.032 * distance * distance);
                
                // Ambient
                vec3 ambient = 0.15 * albedo;
                
                // Diffuse
                float diff = max(dot(normal, lightDir), 0.0);
                vec3 diffuse = diff * lightColor * albedo;
                
                // Specular (Blinn-Phong)
                float spec = pow(max(dot(normal, halfwayDir), 0.0), 32.0 / (roughnessValue + 0.001));
                vec3 specular = spec * lightColor * (1.0 - roughnessValue);
                
                // Combine with attenuation
                return ambient + (diffuse + specular) * attenuation * lightIntensity;
            }
            
            /**
             * Fresnel effect calculation
             */
            float fresnel(vec3 normal, vec3 viewDir, float power) {
                return pow(1.0 - max(dot(normal, viewDir), 0.0), power);
            }
            
            void main() {
                // Apply parallax occlusion mapping
                vec2 texCoords = parallaxOcclusionMapping(vUv, vViewDir);
                
                // Discard fragments outside texture bounds (prevents tile artifacts)
                if (texCoords.x > 1.0 || texCoords.y > 1.0 || texCoords.x < 0.0 || texCoords.y < 0.0) {
                    discard;
                }
                
                // Sample textures with displaced coordinates
                vec3 albedo = texture2D(albedoMap, texCoords).rgb * materialColor;
                vec3 normal = getNormalFromMap(texCoords);
                
                // Calculate lighting
                vec3 finalColor = calculateLighting(normal, albedo, texCoords);
                
                // Add rim lighting effect
                vec3 viewDir = normalize(cameraPosition - vWorldPosition);
                float rim = fresnel(normal, viewDir, 2.0);
                finalColor += rim * 0.2 * lightColor;
                
                // Gamma correction
                finalColor = pow(finalColor, vec3(1.0 / 2.2));
                
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `;
    }
    
    /**
     * Creates procedural textures for the parallax mapping demo
     * @returns {Object} Texture maps
     */
    createTextures() {
        const textures = {};
        
        // Albedo texture (rock-like surface)
        textures.albedo = this.createAlbedoTexture();
        
        // Height map for parallax displacement
        textures.height = this.createHeightTexture();
        
        // Normal map for surface details
        textures.normal = this.createNormalTexture();
        
        // Roughness map for material variation
        textures.roughness = this.createRoughnessTexture();
        
        return textures;
    }
    
    /**
     * Creates a procedural albedo texture
     */
    createAlbedoTexture() {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Base color
        ctx.fillStyle = '#666';
        ctx.fillRect(0, 0, size, size);
        
        // Add rock-like texture
        for (let i = 0; i < 300; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const radius = Math.random() * 20 + 5;
            
            const grd = ctx.createRadialGradient(x, y, 0, x, y, radius);
            grd.addColorStop(0, `rgb(${80 + Math.random() * 60}, ${70 + Math.random() * 50}, ${60 + Math.random() * 40})`);
            grd.addColorStop(1, 'transparent');
            
            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.generateMipmaps = true;
        
        return texture;
    }
    
    /**
     * Creates a procedural height map
     */
    createHeightTexture() {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        const imageData = ctx.createImageData(size, size);
        const data = imageData.data;
        
        // Generate height map using noise
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const i = (y * size + x) * 4;
                
                // Multi-octave noise
                let height = 0;
                let amplitude = 1;
                let frequency = 0.01;
                
                for (let octave = 0; octave < 4; octave++) {
                    height += amplitude * (Math.sin(x * frequency) * Math.sin(y * frequency) + 1) * 0.5;
                    amplitude *= 0.5;
                    frequency *= 2;
                }
                
                // Add some random variation
                height += (Math.random() - 0.5) * 0.2;
                
                // Clamp and convert to grayscale
                const value = Math.max(0, Math.min(255, height * 255));
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
     * Creates a basic normal map (blue-tinted)
     */
    createNormalTexture() {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Default normal (pointing up in tangent space)
        ctx.fillStyle = '#8080ff';
        ctx.fillRect(0, 0, size, size);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        
        return texture;
    }
    
    /**
     * Creates a procedural roughness map
     */
    createRoughnessTexture() {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        const imageData = ctx.createImageData(size, size);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const roughness = Math.random() * 128 + 64; // Random roughness
            data[i] = data[i + 1] = data[i + 2] = roughness;
            data[i + 3] = 255;
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        
        return texture;
    }
    
    /**
     * Updates shader uniforms
     * @param {THREE.ShaderMaterial} material 
     * @param {Object} params 
     */
    updateUniforms(material, params) {
        if (!material.uniforms) return;
        
        Object.keys(params).forEach(key => {
            if (material.uniforms[key]) {
                material.uniforms[key].value = params[key];
            }
        });
    }
    
    /**
     * Disposes of shader resources
     * @param {THREE.ShaderMaterial} material 
     */
    dispose(material) {
        if (material.uniforms) {
            Object.values(material.uniforms).forEach(uniform => {
                if (uniform.value && uniform.value.dispose) {
                    uniform.value.dispose();
                }
            });
        }
        
        if (material.dispose) {
            material.dispose();
        }
    }
}