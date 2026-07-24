import * as THREE from
"https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js";


import { OrbitControls } from
"https://cdn.jsdelivr.net/npm/three@0.160/examples/jsm/controls/OrbitControls.js";


import { GLTFLoader } from
"https://cdn.jsdelivr.net/npm/three@0.160/examples/jsm/loaders/GLTFLoader.js";


import { VRMLoaderPlugin } from
"https://cdn.jsdelivr.net/npm/@pixiv/three-vrm@3.3.0/lib/three-vrm.module.js";



const viewer =
document.getElementById("viewer");



const scene =
new THREE.Scene();


scene.background =
new THREE.Color(0x202020);



const camera =
new THREE.PerspectiveCamera(
35,
innerWidth/innerHeight,
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


renderer.setSize(
innerWidth,
innerHeight
);


viewer.appendChild(
renderer.domElement
);



const light =
new THREE.DirectionalLight(
0xffffff,
3
);


light.position.set(
2,
3,
2
);


scene.add(light);



const controls =
new OrbitControls(
camera,
renderer.domElement
);



let currentVRM=null;



// LOAD VRM


document
.getElementById("file")
.onchange=(e)=>{


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


if(currentVRM){

scene.remove(
currentVRM.scene
);

}



currentVRM =
gltf.userData.vrm;



scene.add(
currentVRM.scene
);



console.log(
"VRM loaded",
currentVRM
);



createExpressionEditor();


showPhysics();



});

};





// EXPRESSION EDITOR


function createExpressionEditor(){


const box=
document.getElementById(
"blendshape"
);


box.innerHTML="";



const map =
currentVRM
.expressionManager
.expressionMap;



for(
let name in map
){


let text =
document.createElement("div");


text.innerText=name;



let slider =
document.createElement("input");


slider.type="range";
slider.min=0;
slider.max=1;
slider.step=0.01;



slider.oninput=()=>{


currentVRM
.expressionManager
.setValue(
name,
Number(slider.value)
);


};



box.appendChild(text);

box.appendChild(slider);


}



}





// TEXTURE


let newTexture=null;



document
.getElementById("texture")
.onchange=(e)=>{


const file=e.target.files[0];


const url=
URL.createObjectURL(file);



new THREE.TextureLoader()
.load(
url,
(t)=>{

newTexture=t;

}

);


};



document
.getElementById("applyTexture")
.onclick=()=>{


if(!currentVRM || !newTexture)
return;



currentVRM.scene.traverse(
(obj)=>{


if(obj.isMesh){


obj.material.map =
newTexture;


obj.material.needsUpdate=true;


}


});


};





// PHYSICS INFO


function showPhysics(){


document
.getElementById("physics")
.innerText=
"SpringBone detected (VRM physics ready)";


}




// LOOP


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


animate();});

renderer.setSize(
window.innerWidth,
window.innerHeight
);

viewer.appendChild(
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


// Camera control

const controls = new OrbitControls(
camera,
renderer.domElement
);

controls.target.set(
0,
1,
0
);

controls.update();


// VRM

let currentVRM = null;


// Load VRM

const fileInput =
document.getElementById("file");


fileInput.addEventListener(
"change",
(event)=>{


const file =
event.target.files[0];


if(!file)
return;


const url =
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


// Xóa model cũ

if(currentVRM){

scene.remove(
currentVRM.scene
);

}



// Model mới

currentVRM =
gltf.userData.vrm;



scene.add(
currentVRM.scene
);



console.log(
"VRM loaded!",
currentVRM
);



},
undefined,


(error)=>{

console.error(
"VRM Load Error:",
error
);

}


);


});


// Expression

function setExpression(
name,
value
){

if(!currentVRM)
return;


currentVRM.expressionManager.setValue(
name,
value
);

}



// Buttons

document
.getElementById("happy")
.onclick=()=>{

setExpression(
"happy",
1
);

};


document
.getElementById("angry")
.onclick=()=>{

setExpression(
"angry",
1
);

};


document
.getElementById("blink")
.onclick=()=>{

setExpression(
"blink",
1
);

};



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


// Animation

const clock =
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
