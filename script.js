import * as THREE from 
"https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js";

import { OrbitControls }
from 
"https://cdn.jsdelivr.net/npm/three@0.160/examples/jsm/controls/OrbitControls.js";

import { GLTFLoader }
from 
"https://cdn.jsdelivr.net/npm/three@0.160/examples/jsm/loaders/GLTFLoader.js";

import { VRMLoaderPlugin }
from
"https://cdn.jsdelivr.net/npm/@pixiv/three-vrm@3.3.0/lib/three-vrm.module.js";


let scene;
let camera;
let renderer;
let controls;
let currentVRM;


// Scene

scene = new THREE.Scene();

camera = new THREE.PerspectiveCamera(
35,
window.innerWidth/window.innerHeight,
0.1,
1000
);

camera.position.set(
0,
1.4,
3
);


renderer = new THREE.WebGLRenderer({
antialias:true
});

renderer.setSize(
window.innerWidth,
window.innerHeight
);

document
.getElementById("viewer")
.appendChild(renderer.domElement);


// Light

const light =
new THREE.DirectionalLight(
0xffffff,
3
);

light.position.set(1,3,2);

scene.add(light);


// Controls

controls =
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


// Load VRM

document
.getElementById("file")
.onchange=function(e){

const file=e.target.files[0];

const url=
URL.createObjectURL(file);


const loader =
new GLTFLoader();


loader.register(
(parser)=>
new VRMLoaderPlugin(parser)
);


loader.load(
url,
(gltf)=>{


if(currentVRM)
scene.remove(
currentVRM.scene
);


currentVRM =
gltf.userData.vrm;


scene.add(
currentVRM.scene
);


console.log(
"Loaded VRM",
currentVRM
);

});

};


// Expression

function expression(name,value){

if(!currentVRM)
return;


currentVRM
.expressionManager
.setValue(
name,
value
);

}


document
.getElementById("happy")
.onclick=()=>{
expression(
"happy",
1
);
};


document
.getElementById("angry")
.onclick=()=>{
expression(
"angry",
1
);
};


document
.getElementById("blink")
.onclick=()=>{
expression(
"blink",
1
);
};



// Animation

function animate(){

requestAnimationFrame(
animate
);


if(currentVRM)
currentVRM.update(
0.016
);


renderer.render(
scene,
camera
);

}

animate();
