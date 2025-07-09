/**
 * Helix Geometry Generator
 * 
 * Generates vertex data for a parametric helix suitable for parallax mapping.
 * Creates a tubular helix with proper normals, tangents, and UV coordinates.
 * 
 * @author [Your Name]
 * @date [Current Date]
 * @version 1.0
 */

class HelixGeometry {
    /**
     * Creates a helix geometry generator
     * @param {Object} params - Helix parameters
     * @param {number} params.radius - Outer radius in units
     * @param {number} params.height - Total height of the helix
     * @param {number} params.turns - Number of full rotations
     * @param {number} params.segments - Number of segments along the helix
     * @param {number} params.tubeSegments - Number of segments around the tube
     * @param {number} params.tubeRadius - Radius of the tube
     */
    constructor(params = {}) {
        this.params = {
            radius: params.radius || 2.5,
            height: params.height || 6,
            turns: params.turns || 3,
            segments: params.segments || 200,
            tubeSegments: params.tubeSegments || 32,
            tubeRadius: params.tubeRadius || 0.4
        };
    }

    /**
     * Updates helix parameters
     * @param {Object} newParams - New parameter values
     */
    updateParams(newParams) {
        this.params = { ...this.params, ...newParams };
    }

    /**
     * Generates vertex data for the helix
     * @returns {Object} Vertex data object with positions, normals, uvs, tangents, and indices
     */
    generateVertexData() {
        const { radius, height, turns, segments, tubeSegments, tubeRadius } = this.params;
        
        const positions = [];
        const normals = [];
        const uvs = [];
        const tangents = [];
        const indices = [];
        
        console.log(`🌀 Generating helix: ${segments} segments, ${tubeSegments} tube segments`);
        
        // Generate helix vertices
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const angle = t * Math.PI * 2 * turns;
            const y = (t - 0.5) * height;
            
            // Center point of helix at this height
            const centerX = Math.cos(angle) * radius;
            const centerZ = Math.sin(angle) * radius;
            
            // Calculate tangent vector (direction of helix curve)
            const tangentX = -Math.sin(angle) * radius;
            const tangentY = height / (Math.PI * 2 * turns);
            const tangentZ = Math.cos(angle) * radius;
            
            // Normalize tangent
            const tangentLength = Math.sqrt(tangentX * tangentX + tangentY * tangentY + tangentZ * tangentZ);
            const tX = tangentX / tangentLength;
            const tY = tangentY / tangentLength;
            const tZ = tangentZ / tangentLength;
            
            // Binormal (points outward from helix center)
            const binormalX = Math.cos(angle);
            const binormalZ = Math.sin(angle);
            
            // Normal (cross product of tangent and binormal)
            const normalX = tY * binormalZ;
            const normalY = -(tX * binormalZ - tZ * binormalX);
            const normalZ = -tY * binormalX;
            
            // Create tube cross-section
            for (let j = 0; j <= tubeSegments; j++) {
                const tubeAngle = (j / tubeSegments) * Math.PI * 2;
                
                // Local normal for tube surface
                const localNormalX = Math.cos(tubeAngle) * binormalX + Math.sin(tubeAngle) * normalX;
                const localNormalY = Math.sin(tubeAngle) * normalY;
                const localNormalZ = Math.cos(tubeAngle) * binormalZ + Math.sin(tubeAngle) * normalZ;
                
                // Vertex position
                const x = centerX + localNormalX * tubeRadius;
                const yPos = y + localNormalY * tubeRadius;
                const z = centerZ + localNormalZ * tubeRadius;
                
                positions.push(x, yPos, z);
                normals.push(localNormalX, localNormalY, localNormalZ);
                
                // UV coordinates with proper tiling for parallax mapping
                const u = j / tubeSegments;
                const v = t * turns; // Scale V by turns for proper texture tiling
                uvs.push(u, v);
                
                // Tangent (for normal mapping) - includes handedness
                tangents.push(tX, tY, tZ, 1);
                
                // Generate indices for triangulation
                if (i < segments && j < tubeSegments) {
                    const current = i * (tubeSegments + 1) + j;
                    const next = current + tubeSegments + 1;
                    
                    // Two triangles per quad (counter-clockwise winding)
                    indices.push(current, next, current + 1);
                    indices.push(next, next + 1, current + 1);
                }
            }
        }
        
        const vertexCount = positions.length / 3;
        const triangleCount = indices.length / 3;
        
        console.log(`✅ Helix geometry generated: ${vertexCount} vertices, ${triangleCount} triangles`);
        
        return {
            positions: new Float32Array(positions),
            normals: new Float32Array(normals),
            uvs: new Float32Array(uvs),
            tangents: new Float32Array(tangents),
            indices: new Uint32Array(indices)
        };
    }

    /**
     * Validates helix parameters
     * @param {Object} params - Parameters to validate
     * @returns {boolean} True if parameters are valid
     */
    static validateParams(params) {
        const required = ['radius', 'height', 'turns', 'segments', 'tubeSegments', 'tubeRadius'];
        
        for (const param of required) {
            if (typeof params[param] !== 'number' || params[param] <= 0) {
                console.error(`❌ Invalid parameter: ${param} must be a positive number`);
                return false;
            }
        }
        
        if (params.segments < 10) {
            console.warn('⚠️ Low segment count may result in poor geometry quality');
        }
        
        if (params.tubeSegments < 8) {
            console.warn('⚠️ Low tube segment count may result in angular tube appearance');
        }
        
        return true;
    }

    /**
     * Calculates approximate memory usage for the geometry
     * @returns {Object} Memory usage breakdown
     */
    getMemoryUsage() {
        const { segments, tubeSegments } = this.params;
        const vertexCount = (segments + 1) * (tubeSegments + 1);
        const triangleCount = segments * tubeSegments * 2;
        
        // Calculate memory usage (in bytes)
        const positionBytes = vertexCount * 3 * 4; // 3 floats per vertex
        const normalBytes = vertexCount * 3 * 4;   // 3 floats per vertex
        const uvBytes = vertexCount * 2 * 4;       // 2 floats per vertex
        const tangentBytes = vertexCount * 4 * 4;  // 4 floats per vertex
        const indexBytes = triangleCount * 3 * 4;  // 3 indices per triangle
        
        const totalBytes = positionBytes + normalBytes + uvBytes + tangentBytes + indexBytes;
        
        return {
            vertices: vertexCount,
            triangles: triangleCount,
            positions: positionBytes,
            normals: normalBytes,
            uvs: uvBytes,
            tangents: tangentBytes,
            indices: indexBytes,
            total: totalBytes,
            totalMB: (totalBytes / 1024 / 1024).toFixed(2)
        };
    }
}

// Export for use in other modules
window.HelixGeometry = HelixGeometry;