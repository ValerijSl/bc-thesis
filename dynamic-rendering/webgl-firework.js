function compileShader(gl, source, type) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function linkProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(program));
    return null;
  }

  return program;
}


class FireworkScene {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      this.gl = this.canvas.getContext('webgl');
      this.particles = [];
      this.init();
    }
  
    init() {
      // Initialize shaders
      this.initShaders();
  
      // Initialize particle buffer
      this.initBuffers();
  
      // Initialize particles
      this.initParticles();
    }
  
    initShaders() {
      // The above shader source as strings
      const vertexSource = `
      attribute vec4 aParticlePosition;
      void main(void) {
        gl_Position = aParticlePosition;
        gl_PointSize = 4.0;
      }`;
  
    const fragmentSource = `
      void main(void) {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
      }`;
  
      
      const vertexShader = compileShader(this.gl, vertexSource, this.gl.VERTEX_SHADER);
      const fragmentShader = compileShader(this.gl, fragmentSource, this.gl.FRAGMENT_SHADER);
      this.program = linkProgram(this.gl, vertexShader, fragmentShader);
      
      this.gl.useProgram(this.program);
    }
    
  
    initBuffers() {
      this.buffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
    }
  
    initParticles() {
      for (let i = 0; i < 100; i++) {
        this.particles.push(0, 0, 0); // x, y, z
      }
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.particles), this.gl.DYNAMIC_DRAW);
    }
    
  
    render() {
      // Update particle positions here based on some logic
      // ...
    
      // Update the buffer data
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.particles), this.gl.DYNAMIC_DRAW);
    
      // Associate buffer with shader attribute
      const position = this.gl.getAttribLocation(this.program, 'aParticlePosition');
      this.gl.enableVertexAttribArray(position);
      this.gl.vertexAttribPointer(position, 3, this.gl.FLOAT, false, 0, 0);
    
      // Draw particles
      this.gl.drawArrays(this.gl.POINTS, 0, this.particles.length / 3);
    }
    
  }
  
  // Example usage:
  const fireworkScene = new FireworkScene('fireworkCanvas');
  fireworkScene.render();
  