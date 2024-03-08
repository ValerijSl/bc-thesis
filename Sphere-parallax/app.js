import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { TessellateModifier } from 'three/examples/jsm/modifiers/TessellateModifier.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const stats = new Stats();
document.body.appendChild(stats.dom);

document.addEventListener('DOMContentLoaded', () => {

    const textureLoader = new THREE.TextureLoader();

    // Load albedo map
    const albedoTexture = textureLoader.load('assets/TCom_Rock_CliffLayered_1.5x1.5_2K_albedo.png'); 

    // Load height map
    const heightTexture = textureLoader.load('assets/TCom_Rock_CliffLayered_1.5x1.5_2K_height.png'); 

    // Load normal map
    const normalTexture = textureLoader.load('assets/TCom_Rock_CliffLayered_1.5x1.5_2K_normal.png'); 

    // Load roughness map
    //const roughnessTexture = textureLoader.load('path/to/roughness.jpg'); 

    // Load ambient occlusion map
    //const aoTexture = textureLoader.load('path/to/ao.jpg'); 

    // Set up material with textures
    /*
    const material = new THREE.MeshPhongMaterial({
    map: albedoTexture,
    displacementMap: heightTexture,
    displacementScale: 0.1, // this value controls the height of the displacement
    normalMap: normalTexture,
    //roughnessMap: roughnessTexture,
    //aoMap: aoTexture,
    });*/

    const geometry = new THREE.TorusGeometry(10, 3, 16, 100);
    const modifier = new TessellateModifier(8);
    const tessellatedGeometry = modifier.modify(geometry);
    //const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    
    var camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);

    const parallaxMaterial = new THREE.ShaderMaterial({
        uniforms: {
            albedoTexture: { type: 't', value: albedoTexture },
            heightTexture: { type: 't', value: heightTexture },
            normalTexture: { type: 't', value: normalTexture },
            parallaxScale: { value: 0.1 }, // Adjust this value to control the parallax effect intensity
            parallaxMinLayers: { value: 8.0 }, // Minimum number of layers for parallax effect
            parallaxMaxLayers: { value: 32.0 }, // Maximum number of layers for parallax effect
            cameraPosition: { value: camera.position }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform sampler2D albedoTexture;
            uniform sampler2D heightTexture;
            uniform sampler2D normalTexture;
            uniform float parallaxScale; // You should define and pass this uniform to the shader
            uniform float parallaxMinLayers; // You should define and pass this uniform to the shader
            uniform float parallaxMaxLayers; // You should define and pass this uniform to the shader
            uniform vec3 viewPosition; // You should pass the camera's position in world space to the shader
            varying vec2 vUv;
            
            void main() {
                // Calculate view direction in tangent space
                vec3 viewDir = normalize(viewPosition - vUv);
                
                // Parallax mapping
                float layerDepth = 2.0 / (parallaxMinLayers + parallaxMaxLayers);
                float currentLayerDepth = 1.0;
                vec2 P = viewDir.xy * parallaxScale;
                vec2 deltaTexCoords = P / parallaxMaxLayers;
                vec2 currentTexCoords = vUv;
                
                float currentDepthMapValue = texture2D(heightTexture, currentTexCoords).r;
                
                while(currentLayerDepth < 1.0) {
                    currentTexCoords -= deltaTexCoords;
                    currentDepthMapValue = texture2D(heightTexture, currentTexCoords).r;
                    if(currentDepthMapValue > currentLayerDepth) {
                        break;
                    }
                    currentLayerDepth += layerDepth;
                }
                
                // Fetch the final texture color using displaced texture coords
                vec3 finalColor = texture2D(albedoTexture, currentTexCoords).rgb;
                
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `
    });
    const torusMesh = new THREE.Mesh(geometry, parallaxMaterial);
    

    var scene = new THREE.Scene();
    var renderer = new THREE.WebGLRenderer();
    const controls = new OrbitControls(camera, renderer.domElement);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const loader = new GLTFLoader();

    const mesh = new THREE.Mesh(tessellatedGeometry, parallaxMaterial);
    scene.add(torusMesh);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    /*let model;
    loader.load('assets/rock_photogrammetry_scan/scene.gltf', function (gltf) {
        model = gltf.scene;
        const box = new THREE.BoxHelper(model, 0xff0000); // Create a helper with a red line color
        scene.add(box); // Add it to the scene to visualize the object's bounding box
        scene.add(model);
        }, undefined, function (error) {
        console.error('An error happened', error);
        }); */
    let debri;
    const gltfLoader = new GLTFLoader();
    gltfLoader.load('assets/debris_concrete_junk/scene.gltf', function(gltf) {
    //gltfLoader.load('assets/dead_sea_qumran/scene.gltf', function(gltf) {
    //gltfLoader.load('assets/rock_photogrammetry_scan/scene.gltf', function(gltf) {
        debri = gltf.scene;
        debri.traverse(function(child) {
            if (child.isMesh) {
                child.parallaxMaterial = parallaxMaterial; // Apply the shader material
            }
        });
        scene.add(debri);
    });

    //var geometry = new THREE.SphereGeometry(1, 32, 32);
    //var material = new THREE.MeshBasicMaterial({ color: 0x00ff09 });
    //var sphere = new THREE.Mesh(geometry, material);

    //scene.add(sphere);
    camera.position.set(0,2,5);

    /*const modifier = new SubdivisionModifier(2); // The number here represents the subdivision level
    const subdividedGeometry = modifier.modify(mesh.geometry);*/

    // Create a new mesh with the subdivided geometry
    /*const subdividedMesh = new THREE.Mesh(subdividedGeometry, mesh.material);
    scene.add(subdividedMesh);*/

    // Add a light source
    var light = new THREE.PointLight(0xffffff, 10, 10);
    light.position.set(0, 0, 5);
    light.castShadow = true;
    scene.add(light);

    
    /*const modifier = new THREE.SubdivisionModifier(subdivisionCount);
    const smoothGeometry = modifier.modify(mesh.geometry);
    const smoothMesh = new THREE.Mesh(smoothGeometry, mesh.material);
    scene.add(smoothMesh);*/

    console.log(scene.children);

    /*subdividedMesh.castShadow = true;
    subdividedMesh.receiveShadow = true;*/

    // Add a ground plane to receive shadows
    const planeGeometry = new THREE.PlaneGeometry(2000, 2000);
    const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.5 });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.position.y = -1;
    plane.rotation.x = - Math.PI / 2;
    plane.receiveShadow = true;
    scene.add(plane);

    // In your render or animation loop, make sure to render the scene with the WebGLRenderer
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    function animate() {
        stats.begin();

        controls.update();

        requestAnimationFrame(animate);
    
        if (debri) {
            //debri.rotation.y += 0.01;
        }
    
        parallaxMaterial.uniforms.cameraPosition.value = camera.position;
    
        renderer.render(scene, camera);
        stats.end();
    }    

    animate();
});
