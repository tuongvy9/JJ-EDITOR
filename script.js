import * as THREE from "./libs/three/three.module.js";

import {
    VRMLoaderPlugin
} from "./libs/three-vrm/three-vrm.module.js";

console.log("Three.js loaded:", THREE);
console.log("VRM plugin loaded:", VRMLoaderPlugin);


// Tạo scene
const scene = new THREE.Scene();

scene.background = new THREE.Color(0x222222);


// Camera
const camera = new THREE.PerspectiveCamera(
    35,
    window.innerWidth / window.innerHeight,
    0.1,
    100
);

camera.position.set(0, 1, 3);


// Renderer
const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

document.body.appendChild(
    renderer.domElement
);


// Light
const light = new THREE.DirectionalLight(
    0xffffff,
    3
);

light.position.set(
    1,
    2,
    3
);

scene.add(light);


// Animation
function animate(){

    requestAnimationFrame(
        animate
    );

    renderer.render(
        scene,
        camera
    );
}

animate();


// Resize
window.addEventListener(
    "resize",
    ()=>{

        camera.aspect =
        window.innerWidth /
        window.innerHeight;

        camera.updateProjectionMatrix();

        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );

    }
);
