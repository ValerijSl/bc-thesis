import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


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
    const material = new THREE.MeshPhongMaterial({
    map: albedoTexture,
    displacementMap: heightTexture,
    displacementScale: 0.1, // this value controls the height of the displacement
    normalMap: normalTexture,
    //roughnessMap: roughnessTexture,
    //aoMap: aoTexture,
    });

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    var renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    var geometry = new THREE.SphereGeometry(1, 32, 32);
    //var material = new THREE.MeshBasicMaterial({ color: 0x00ff09 });
    var sphere = new THREE.Mesh(geometry, material);

    scene.add(sphere);
    camera.position.z = 5;

    // Add a light source
    var light = new THREE.PointLight(0xffffff, 10, 100);
    light.position.set(0, 0, 5);
    scene.add(light);

    const loader = new GLTFLoader();


    /*const modifier = new THREE.SubdivisionModifier(subdivisionCount);
    const smoothGeometry = modifier.modify(mesh.geometry);
    const smoothMesh = new THREE.Mesh(smoothGeometry, mesh.material);
    scene.add(smoothMesh);*/

    function animate() {
        requestAnimationFrame(animate);
        sphere.rotation.x += 0.01;
        sphere.rotation.y += 0.01;
        renderer.render(scene, camera);
    }

    animate();
});
