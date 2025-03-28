import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 5);

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// Add this after the lighting setup and comment out the loader.load section
// const geometry = new THREE.BoxGeometry();
// const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
// const cube = new THREE.Mesh(geometry, material);
// scene.add(cube);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// GLTF Loader
const loader = new GLTFLoader();
let mixer; // Will be used for animations
let model; // Declare model globally

loader.load(
    './pigColorDancing.glb', // Replace with your model path
    function (gltf) {
        model = gltf.scene; // Assign to global model variable
        scene.add(model);

        // If your model has animations
        if (gltf.animations.length) {
            mixer = new THREE.AnimationMixer(model);
            const animation = mixer.clipAction(gltf.animations[0]);
            animation.play();
        }
    },
    function (xhr) {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    function (error) {
        console.error('An error occurred loading the model:', error);
    }
);

// Animation clock
const clock = new THREE.Clock();

// Render loop
function animate() {
    requestAnimationFrame(animate);
    
    // Update controls
    controls.update();

    // Update animations if any
    if (mixer) {
        mixer.update(clock.getDelta());
    }

    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Start animation loop
animate();

// Track animation state
let isPlaying = true;

// Handle keyboard controls
document.addEventListener('keydown', (event) => {
    const moveSpeed = 0.1;
    
    switch(event.key) {
        case 'ArrowLeft':
            // Move model left
            model.position.x -= moveSpeed;
            break;
        case 'ArrowRight':
            // Move model right 
            model.position.x += moveSpeed;
            break;
        case 'ArrowUp':
            // Move model up
            model.position.y += moveSpeed;
            break;
        case 'ArrowDown':
            // Move model down
            model.position.y -= moveSpeed;
            break;
        case ' ':
            // Toggle animation play/pause
            if (mixer) {
                isPlaying = !isPlaying;
                mixer.timeScale = isPlaying ? 1 : 0;
            }
            break;
        case 'r':
        case 'R':
            // Reset animation
            if (mixer) {
                mixer.setTime(0);
                if (!isPlaying) {
                    isPlaying = true;
                    mixer.timeScale = 1;
                }
            }
            break;
    }
});

