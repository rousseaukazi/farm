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

// Track selected model and animation states
let selectedModel = null;
const modelStates = new Map(); // Store animation states for each model

// GLTF Loader for first model (pig)
const loader = new GLTFLoader();
loader.load(
    './pigColorDancing.glb',
    function (gltf) {
        const model = gltf.scene;
        scene.add(model);
        
        // Make model clickable
        model.userData.type = 'selectable';
        model.userData.id = 'pig';

        // Store model state
        modelStates.set(model, {
            mixer: null,
            isPlaying: true
        });

        // Setup animations
        if (gltf.animations.length) {
            const mixer = new THREE.AnimationMixer(model);
            const animation = mixer.clipAction(gltf.animations[0]);
            animation.play();
            modelStates.get(model).mixer = mixer;
        }
    },
    function (xhr) {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    function (error) {
        console.error('An error occurred loading the model:', error);
    }
);

// Load duck model
console.log('Attempting to load duck...'); // Add this debug line

// First attempt with original path
loader.load(
    './duckColorFlip.glb',
    onLoad,
    undefined,
    onError
);

// Animation clock
const clock = new THREE.Clock();

// Add click handling
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    for (const intersect of intersects) {
        let object = intersect.object;
        // Traverse up to find the root model
        while (object.parent && !object.userData.type) {
            object = object.parent;
        }
        
        if (object.userData.type === 'selectable') {
            selectedModel = object;
            console.log('Selected:', object.userData.id);
            break;
        }
    }
});

// Update animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();

    const delta = clock.getDelta();
    // Update all animations
    modelStates.forEach((state, model) => {
        if (state.mixer) {
            state.mixer.update(delta);
        }
    });

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

// Update keyboard controls
document.addEventListener('keydown', (event) => {
    if (!selectedModel) return;
    
    const moveSpeed = 0.1;
    const modelState = modelStates.get(selectedModel);
    
    switch(event.key) {
        case 'ArrowLeft':
            selectedModel.position.x -= moveSpeed;
            break;
        case 'ArrowRight':
            selectedModel.position.x += moveSpeed;
            break;
        case 'ArrowUp':
            selectedModel.position.y += moveSpeed;
            break;
        case 'ArrowDown':
            selectedModel.position.y -= moveSpeed;
            break;
        case ' ':
            if (modelState.mixer) {
                modelState.isPlaying = !modelState.isPlaying;
                modelState.mixer.timeScale = modelState.isPlaying ? 1 : 0;
            }
            break;
        case 'r':
        case 'R':
            if (modelState.mixer) {
                modelState.mixer.setTime(0);
                if (!modelState.isPlaying) {
                    modelState.isPlaying = true;
                    modelState.mixer.timeScale = 1;
                }
            }
            break;
    }
});

function onLoad(gltf) {
    const model = gltf.scene;
    model.position.x = 3;
    model.position.y = 0;
    model.position.z = 0;
    
    scene.add(model);
    
    model.userData.type = 'selectable';
    model.userData.id = 'duck';

    modelStates.set(model, {
        mixer: null,
        isPlaying: true
    });

    if (gltf.animations.length) {
        const mixer = new THREE.AnimationMixer(model);
        const animation = mixer.clipAction(gltf.animations[0]);
        animation.play();
        modelStates.get(model).mixer = mixer;
    }
}

function onError(error) {
    console.error('An error occurred loading the model:', error);
}

