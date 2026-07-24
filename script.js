import * as THREE from "./libs/three/three.module.js";

import { GLTFLoader }
from "./libs/three/GLTFLoader.js";

import { OrbitControls }
from "./libs/three/OrbitControls.js";

import {
VRMLoaderPlugin,
VRMUtils
}
from "./libs/three-vrm/three-vrm.module.js";


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
0,1.3,3
);



const renderer =
new THREE.WebGLRenderer({
antialias:true
});


renderer.setSize(
innerWidth,
innerHeight
);

document.body.appendChild(
renderer.domElement
);



const light =
new THREE.DirectionalLight(
0xffffff,
3
);

light.position.set(
1,2,3
);

scene.add(light);



const controls =
new OrbitControls(
camera,
renderer.domElement
);

controls.target.set(
0,1,0
);

controls.update();



const loader =
new GLTFLoader();


loader.register(
(parser)=>
new VRMLoaderPlugin(parser)
);



let currentVRM = null;



document
.getElementById("vrmFile")
.onchange=(e)=>{


const file =
e.target.files[0];

if(!file)return;


loadVRM(
URL.createObjectURL(file)
);

};




function loadVRM(url){


loader.load(
url,

(gltf)=>{


const vrm =
gltf.userData.vrm;



if(currentVRM)
scene.remove(
currentVRM.scene
);



VRMUtils.rotateVRM0(vrm);


currentVRM =
vrm;


scene.add(
vrm.scene
);



createBlendShape(vrm);

createTextureList(vrm);

createPhysics(vrm);


console.log(
"VRM 0.0 Loaded",
vrm
);


}

);


}




// BlendShape Slider

function createBlendShape(vrm){


const box =
document.getElementById(
"expressions"
);

box.innerHTML="";


const proxy =
vrm.blendShapeProxy;


if(!proxy){

box.innerHTML=
"Không có BlendShape";

return;

}



proxy._blendShapeGroups
.forEach(
(group)=>{


const name =
group.name;


const label =
document.createElement("label");


const slider =
document.createElement("input");


slider.type="range";
slider.min=0;
slider.max=100;



slider.oninput=()=>{


label.innerText =
name+" "+slider.value+"%";


proxy.setValue(
name,
slider.value/100
);


};



label.innerText =
name+" 0%";


box.appendChild(label);

box.appendChild(
slider
);

box.appendChild(
document.createElement("br")
);


});

}



// Texture

function createTextureList(vrm){


const box =
document.getElementById(
"textureList"
);


box.innerHTML="";


vrm.scene.traverse(
(obj)=>{


if(obj.material){


box.innerHTML +=
obj.name+"<br>";

}


});


}



// Physics

function createPhysics(vrm){


const box =
document.getElementById(
"physics"
);


if(vrm.springBoneManager){

box.innerText =
"SpringBone đã có";


}else{


box.innerText =
"Không có Physics";

}


}




// Export

document
.getElementById("export")
.onclick=()=>{


alert(
"Export VRM 0.0 sẽ thêm ở bước tiếp theo"
);


};





const clock =
new THREE.Clock();


function animate(){


requestAnimationFrame(
animate
);


if(currentVRM)
currentVRM.update(
clock.getDelta()
);


renderer.render(
scene,
camera
);


}


animate();
