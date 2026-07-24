import * as THREE from "./libs/three/three.module.js";

import { GLTFLoader } from "./libs/three/GLTFLoader.js";

import {
    VRMLoaderPlugin
} from "./libs/three-vrm/three-vrm.module.js";


// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202020);


// Camera
const camera = new THREE.PerspectiveCamera(
    35,
    window.innerWidth / window.innerHeight,
    0.1,
    100
);

camera.position.set(0, 1.3, 3);


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


// VRM Loader
const loader = new GLTFLoader();

loader.register(
    (parser) => {
        return new VRMLoaderPlugin(parser);
    }
);


let currentVRM = null;


// Upload VRM
const input = document.getElementById("vrmFile");


if(input){

input.addEventListener(
"change",
(event)=>{

const file = event.target.files[0];

if(!file) return;


const url =
URL.createObjectURL(file);


loadVRM(url);

});

}



function loadVRM(url){

loader.load(

url,

(gltf)=>{


const vrm =
gltf.userData.vrm;


if(!vrm){

console.error(
"Không phải file VRM"
);

return;

}


if(currentVRM){

scene.remove(
currentVRM.scene
);

}


currentVRM = vrm;


scene.add(
vrm.scene
);


console.log(
"VRM Loaded",
vrm
);


},


undefined,


(error)=>{

console.error(
"VRM Load Error",
error
);

}

);

}



// Animation
const clock =
new THREE.Clock();


function animate(){

requestAnimationFrame(
animate
);


if(currentVRM){

currentVRM.update(
clock.getDelta()
);

}


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


});
