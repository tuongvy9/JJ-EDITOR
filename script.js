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



// =================
// BASIC THREE
// =================

const viewer =
document.getElementById("viewer");


const scene =
new THREE.Scene();

scene.background =
new THREE.Color(0x202020);



const camera =
new THREE.PerspectiveCamera(
35,
window.innerWidth / window.innerHeight,
0.1,
100
);


camera.position.set(
0,
1.4,
3
);



const renderer =
new THREE.WebGLRenderer({
    antialias:true
});


renderer.setPixelRatio(
window.devicePixelRatio
);


renderer.setSize(
window.innerWidth,
window.innerHeight
);


viewer.appendChild(
renderer.domElement
);



// Light

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



// Camera control

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



// =================
// VRM
// =================

let currentVRM = null;



const loader =
new GLTFLoader();



loader.register(
(parser)=>
new VRMLoaderPlugin(parser)
);



// Upload VRM

document
.getElementById("file")
.addEventListener(
"change",
(event)=>{


const file =
event.target.files[0];


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

console.error(
"File này không phải VRM"
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



createBlendShape();



document.getElementById(
"physics"
).innerText =
"VRM Loaded - SpringBone Ready";


},

undefined,


(error)=>{

console.error(
"VRM Error:",
error
);

}

);


}





// =================
// BLENDSHAPE
// =================


function createBlendShape(){


const box =
document.getElementById(
"blendshape"
);


box.innerHTML="";


if(
!currentVRM.expressionManager
){

box.innerHTML =
"Model không có Expression";


return;

}



const expressions =
currentVRM.expressionManager.expressionMap;



for(
const name in expressions
){


const label =
document.createElement("div");


label.innerText =
name;



const slider =
document.createElement("input");


slider.type =
"range";

slider.min = 0;

slider.max = 1;

slider.step = 0.01;



slider.oninput =
()=>{


currentVRM
.expressionManager
.setValue(
name,
Number(slider.value)
);


};



box.appendChild(label);

box.appendChild(slider);


}


}





// =================
// TEXTURE EDITOR
// =================


let texture = null;



document
.getElementById("texture")
.addEventListener(
"change",
(e)=>{


const file =
e.target.files[0];


if(!file)
return;



new THREE.TextureLoader()
.load(
URL.createObjectURL(file),
(t)=>{

texture=t;

}

);


});



document
.getElementById("applyTexture")
.onclick =
()=>{


if(!currentVRM || !texture)
return;



currentVRM.scene.traverse(
(obj)=>{


if(obj.isMesh){

obj.material.map =
texture;

obj.material.needsUpdate =
true;

}


});


};





// =================
// ANIMATION
// =================


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
