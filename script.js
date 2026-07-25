import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRMLoaderPlugin } from '@pixiv/three-vrm';

// 1. Basic Three.js Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 20.0);
camera.position.set(0.0, 1.4, 1.4);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 2. Configure GLTFLoader with the VRM Plugin
const loader = new GLTFLoader();
loader.register((parser) => new VRMLoaderPlugin(parser));

// 3. Load the Model
let currentVrm = null;
loader.load(
  '/path/to/your/avatar.vrm',
  (gltf) => {
    const vrm = gltf.userData.vrm;
    currentVrm = vrm;
    
    // Add avatar model to the scene
    scene.add(vrm.scene);
    
    // Un-rotate the model if necessary (VRM looks towards +Z)
    vrm.scene.rotation.y = Math.PI; 
    console.log('VRM loaded successfully:', vrm);
  },
  (progress) => console.log(`Loading: ${Math.round((progress.loaded / progress.total) * 100)}%`),
  (error) => console.error('Error loading VRM:', error)
);

// 4. Update Loop (Required for Spring Bones & Animations)
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  
  const deltaTime = clock.getDelta();
  if (currentVrm) {
    // Ticks physical simulations like hair/clothing movement
    currentVrm.update(deltaTime); 
  }
  
  renderer.render(scene, camera);
}
animate();
