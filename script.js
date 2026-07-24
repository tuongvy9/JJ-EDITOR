import * as THREE from
"https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js";

import { GLTFLoader } from
"https://cdn.jsdelivr.net/npm/three@0.160/examples/jsm/loaders/GLTFLoader.js";

import { OrbitControls } from
"https://cdn.jsdelivr.net/npm/three@0.160/examples/jsm/controls/OrbitControls.js";

import {
    VRMLoaderPlugin
} from
"https://cdn.jsdelivr.net/npm/@pixiv/three-vrm@2.1.0/lib/three-vrm.module.js";


// =====================
// SCENE
// =====================

const viewer =
document.getElementById("viewer");


const scene =
new THREE.Scene();


scene.background =
new THREE.Color(0x202020);



// CAMERA

const camera =
new THREE.PerspectiveCamera(
35,
window.innerWidth /
window.innerHeight,
0.1,
100
);


camera.position.set(
0,
1.4,
3
);



// RENDERER

const renderer =
new THREE.WebGLRenderer({
    antialias:true
});


renderer.setSize(
window.innerWidth,
window.innerHeight
);


viewer.appendChild(
renderer.domElement
);



// LIGHT

const light =
new THREE.DirectionalLight(
0xffffff,
3
);


light.position.set(
1,
2,
3
);


scene.add(light);



// CONTROL

const controls =
new OrbitControls(
camera,
renderer.domElement
);


controls.target.set(
0,
1,
0
);


controls.update();



// =====================
// VRM LOAD
// =====================

let currentVRM = null;


const loader =
new GLTFLoader();


loader.register(
(parser)=>
new VRMLoaderPlugin(parser)
);



const fileInput =
document.getElementById("file");


fileInput.addEventListener(
"change",
(e)=>{


const file =
e.target.files[0];


if(!file)
return;


const url =
URL.createObjectURL(file);


loadVRM(url);


});





function loadVRM(url){


loader.load(
url,

(gltf)=>{


const vrm =
gltf.userData.vrm;



if(!vrm){

alert(
"Không phải file VRM"
);

return;

}



if(currentVRM){

scene.remove(
currentVRM.scene
);

}



currentVRM =
vrm;


scene.add(
vrm.scene
);



console.log(
"VRM Loaded:",
vrm
);


},

undefined,


(error)=>{

console.error(
error
);

}

);

}



// =====================
// ANIMATION
// =====================

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



// =====================
// RESIZE
// =====================

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
