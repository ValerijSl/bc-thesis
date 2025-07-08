// Chapter 7 - Helix Geometry Generator
// Generates parametric helix geometry with proper UV mapping and normals

export class HelixGeometry {
    constructor() {
        this.defaultTurns = 3;
        this.defaultTubeRadius = 0.3;
    }
    
    /**
     * Creates a helix geometry using parametric equations
     * @param {number} radius - Main helix radius
     * @param {number} height - Total height of helix
     * @param {number} segments - Number of segments along the helix
     * @param {number} radialSegments - Number of segments around the tube
     * @param {number} turns - Number of complete turns (optional)
     * @returns {THREE.BufferGeometry}
     */
    create(radius, height, segments = 200, radialSegments = 32, turns = this.defaultTurns) {
        console.log(`🌀 Generating helix: radius=${radius}, height=${height}, segments=${segments}, radial=${radialSegments}`);
        
        const geometry = new THREE.BufferGeometry();
        
        // Arrays for geometry data
        const vertices = [];
        const normals = [];
        const uvs = [];
        const indices = [];
        const tangents = [];
        
        // Calculate parameters
        const angleStep = (Math.PI * 2 * turns) / segments;
        const heightStep = height / segments;
        const tubeRadius = this.defaultTubeRadius;
        
        // Generate vertices, normals, and UVs
        for (let i = 0; i <= segments; i++) {
            const angle = i * angleStep;
            const y = i * heightStep - height / 2;
            
            // Center point of the helix at this height
            const centerX = Math.cos(angle) * radius;
            const centerZ = Math.sin(angle) * radius;
            
            // Calculate tangent vector along the helix
            const tangentX = -Math.sin(angle) * radius;
            const tangentY = heightStep;
            const tangentZ = Math.cos(angle) * radius;
            
            // Normalize tangent
            const tangentLength = Math.sqrt(tangentX * tangentX + tangentY * tangentY + tangentZ * tangentZ);
            const tX = tangentX / tangentLength;
            const tY = tangentY / tangentLength;
            const tZ = tangentZ / tangentLength;
            
            // Calculate binormal (perpendicular to tangent, pointing outward from helix center)
            const binormalX = Math.cos(angle);
            const binormalY = 0;
            const binormalZ = Math.sin(angle);
            
            // Calculate normal (cross product of tangent and binormal)
            const normalX = tY * binormalZ - tZ * binormalY;
            const normalY = tZ * binormalX - tX * binormalZ;
            const normalZ = tX * binormalY - tY * binormalX;
            
            // Generate tube cross-section
            for (let j = 0; j <= radialSegments; j++) {
                const radialAngle = (j / radialSegments) * Math.PI * 2;
                
                // Local normal vector for tube surface
                const localNormalX = Math.cos(radialAngle) * binormalX + Math.sin(radialAngle) * normalX;
                const localNormalY = Math.cos(radialAngle) * binormalY + Math.sin(radialAngle) * normalY;
                const localNormalZ = Math.cos(radialAngle) * binormalZ + Math.sin(radialAngle) * normalZ;
                
                // Vertex position
                const x = centerX + localNormalX * tubeRadius;
                const y2 = y + localNormalY * tubeRadius;
                const z = centerZ + localNormalZ * tubeRadius;
                
                vertices.push(x, y2, z);
                normals.push(localNormalX, localNormalY, localNormalZ);
                
                // UV coordinates
                const u = i / segments * turns; // Wrap texture multiple times along helix
                const v = j / radialSegments;
                uvs.push(u, v);
                
                // Tangent for normal mapping (stored as vec4 with handedness in w)
                tangents.push(tX, tY, tZ, 1);
            }
        }
        
        // Generate indices for triangles
        for (let i = 0; i < segments; i++) {
            for (let j = 0; j < radialSegments; j++) {
                const a = i * (radialSegments + 1) + j;
                const b = a + radialSegments + 1;
                const c = a + 1;
                const d = b + 1;
                
                // Two triangles per quad
                indices.push(a, b, c);
                indices.push(b, d, c);
            }
        }
        
        // Set geometry attributes
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geometry.setAttribute('tangent', new THREE.Float32BufferAttribute(tangents, 4));
        geometry.setIndex(indices);
        
        // Compute bounding sphere for frustum culling
        geometry.computeBoundingSphere();
        
        console.log(`✅ Helix geometry created: ${vertices.length/3} vertices, ${indices.length/3} triangles`);
        
        return geometry;
    }
    
    /**
     * Creates a simplified helix for wireframe or low-detail rendering
     * @param {number} radius 
     * @param {number} height 
     * @param {number} segments 
     * @param {number} turns 
     * @returns {THREE.BufferGeometry}
     */
    createSimplified(radius, height, segments = 100, turns = this.defaultTurns) {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const indices = [];
        
        const angleStep = (Math.PI * 2 * turns) / segments;
        const heightStep = height / segments;
        
        // Generate helix curve vertices
        for (let i = 0; i <= segments; i++) {
            const angle = i * angleStep;
            const y = i * heightStep - height / 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            vertices.push(x, y, z);
            
            if (i < segments) {
                indices.push(i, i + 1);
            }
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setIndex(indices);
        
        return geometry;
    }
    
    /**
     * Generates procedural texture coordinates for enhanced UV mapping
     * @param {THREE.BufferGeometry} geometry 
     * @param {number} textureRepeats 
     */
    enhanceUVMapping(geometry, textureRepeats = 2) {
        const positions = geometry.attributes.position.array;
        const uvs = [];
        
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const y = positions[i + 1];
            const z = positions[i + 2];
            
            // Calculate cylindrical coordinates
            const angle = Math.atan2(z, x);
            const height = y;
            
            // Map to UV coordinates
            const u = (angle / (Math.PI * 2) + 0.5) * textureRepeats;
            const v = (height + 2.5) / 5.0; // Assuming height range of -2.5 to 2.5
            
            uvs.push(u, v);
        }
        
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        
        return geometry;
    }
    
    /**
     * Adds additional vertex attributes for advanced shading
     * @param {THREE.BufferGeometry} geometry 
     */
    addAdvancedAttributes(geometry) {
        const positions = geometry.attributes.position;
        const normals = geometry.attributes.normal;
        const count = positions.count;
        
        // Add vertex colors based on height
        const colors = [];
        for (let i = 0; i < count; i++) {
            const y = positions.getY(i);
            const normalizedHeight = (y + 2.5) / 5.0; // Normalize to 0-1
            
            // Color gradient from blue (bottom) to red (top)
            const r = normalizedHeight;
            const g = 0.5;
            const b = 1.0 - normalizedHeight;
            
            colors.push(r, g, b);
        }
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        
        // Add displacement attribute for vertex animation
        const displacement = [];
        for (let i = 0; i < count; i++) {
            displacement.push(Math.random() * 0.1);
        }
        geometry.setAttribute('displacement', new THREE.Float32BufferAttribute(displacement, 1));
        
        return geometry;
    }
    
    /**
     * Calculates geometry statistics for performance analysis
     * @param {THREE.BufferGeometry} geometry 
     * @returns {Object}
     */
    getStatistics(geometry) {
        const vertexCount = geometry.attributes.position.count;
        const triangleCount = geometry.index ? geometry.index.count / 3 : vertexCount / 3;
        
        // Calculate memory usage
        let memoryUsage = 0;
        
        // Position: vec3 * 4 bytes per float
        memoryUsage += vertexCount * 3 * 4;
        
        // Normal: vec3 * 4 bytes per float
        if (geometry.attributes.normal) {
            memoryUsage += vertexCount * 3 * 4;
        }
        
        // UV: vec2 * 4 bytes per float
        if (geometry.attributes.uv) {
            memoryUsage += vertexCount * 2 * 4;
        }
        
        // Tangent: vec4 * 4 bytes per float
        if (geometry.attributes.tangent) {
            memoryUsage += vertexCount * 4 * 4;
        }
        
        // Indices: uint16 or uint32
        if (geometry.index) {
            const indexSize = geometry.index.array.BYTES_PER_ELEMENT;
            memoryUsage += geometry.index.count * indexSize;
        }
        
        return {
            vertices: vertexCount,
            triangles: triangleCount,
            memoryUsage: memoryUsage,
            memoryUsageMB: (memoryUsage / 1024 / 1024).toFixed(2)
        };
    }
}