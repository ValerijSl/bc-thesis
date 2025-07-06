var canvas = document.getElementById('webgl-canvas');
var gl = canvas.getContext('webgl');


if (!gl) {
    console.log('WebGL not supported, falling back on experimental-webgl');
    gl = canvas.getContext('experimental-webgl');
}

if (!gl) {
    alert('Your browser does not support WebGL');
}
let vertexShaderSource = `
    attribute vec4 a_position;
    attribute vec4 a_color;
    varying vec4 v_color;

    void main(void) {
        gl_Position = a_position;
        v_color = a_color;
    }`;
let vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertexShader, vertexShaderSource);
gl.compileShader(vertexShader);

// Fragment Shader
let fragmentShaderSource = `
    precision mediump float;
    varying vec4 v_color;

    void main(void) {
        gl_FragColor = v_color;
    }`;
let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShader, fragmentShaderSource);
gl.compileShader(fragmentShader);

// Link shaders to program
let program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
gl.useProgram(program);

// Define the vertices for a triangle
let verticesColors = new Float32Array([
    0.0,  1.0,  1.0, 0.0, 0.0,
    -1.0, -1.0,  0.0, 1.0, 0.0,
    1.0, -1.0,  0.0, 0.0, 1.0,
]);

// Create a buffer and put the vertices in it
let vertexColorBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

let FSIZE = verticesColors.BYTES_PER_ELEMENT;
let a_position = gl.getAttribLocation(program, 'a_position');
let a_color = gl.getAttribLocation(program, 'a_color');
gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, FSIZE * 5, 0);
gl.vertexAttribPointer(a_color, 3, gl.FLOAT, false, FSIZE * 5, FSIZE * 2);
gl.enableVertexAttribArray(a_position);
gl.enableVertexAttribArray(a_color);

// Draw the triangle
gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);
gl.drawArrays(gl.TRIANGLES, 0, 3);