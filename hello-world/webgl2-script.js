
var canvas = document.getElementById('webgl2-canvas');
var gl2 = canvas.getContext('webgl2');
// další kód WebGL2

if (!gl2) {
    alert('Your browser does not support WebGL2');
}

// Vertex Shader
var vertexShaderSource2 = `
attribute vec4 a_position;
attribute vec4 a_color;
varying vec4 v_color;

void main(void) {
    gl_Position = a_position;
    v_color = a_color;
}`;
var vertexShader2 = gl2.createShader(gl2.VERTEX_SHADER);
gl2.shaderSource(vertexShader2, vertexShaderSource2);
gl2.compileShader(vertexShader2);

// Fragment Shader
var fragmentShaderSource2 = `
precision mediump float;
varying vec4 v_color;

void main(void) {
    gl_FragColor = v_color;
}`;
var fragmentShader2 = gl2.createShader(gl2.FRAGMENT_SHADER);
gl2.shaderSource(fragmentShader2, fragmentShaderSource2);
gl2.compileShader(fragmentShader2);

// Link shaders to program
var program2 = gl2.createProgram();
gl2.attachShader(program2, vertexShader2);
gl2.attachShader(program2, fragmentShader2);
gl2.linkProgram(program2);
gl2.useProgram(program2);

// Define the vertices for a triangle
var verticesColors2 = new Float32Array([
// Vertex coordinates and color
0.0,  1.0,  1.0, 0.0, 0.0,
-1.0, -1.0,  0.0, 1.0, 0.0,
1.0, -1.0,  0.0, 0.0, 1.0,
]);

// Create a buffer and put the vertices in it
var vertexColorBuffer2 = gl2.createBuffer();
gl2.bindBuffer(gl2.ARRAY_BUFFER, vertexColorBuffer2);
gl2.bufferData(gl2.ARRAY_BUFFER, verticesColors2, gl2.STATIC_DRAW);

var FSIZE2 = verticesColors2.BYTES_PER_ELEMENT;
var a_position2 = gl2.getAttribLocation(program2, 'a_position');
var a_color2 = gl2.getAttribLocation(program2, 'a_color');
gl2.vertexAttribPointer(a_position2, 2, gl2.FLOAT, false, FSIZE2 * 5, 0);
gl2.vertexAttribPointer(a_color2, 3, gl2.FLOAT, false, FSIZE2 * 5, FSIZE2 * 2);
gl2.enableVertexAttribArray(a_position2);
gl2.enableVertexAttribArray(a_color2);

// Draw the triangle
gl2.clearColor(0.0, 0.0, 0.0, 1.0);
gl2.clear(gl2.COLOR_BUFFER_BIT);
gl2.drawArrays(gl2.TRIANGLES, 0, 3);