document.getElementById("file").addEventListener("change", (event)=>{

    const file = event.target.files[0];

    if(!file) return;

    const url = URL.createObjectURL(file);

    const loader = new GLTFLoader();

    loader.register(
        (parser)=> new VRMLoaderPlugin(parser)
    );


    loader.load(
        url,
        (gltf)=>{

            const vrm = gltf.userData.vrm;

            scene.add(vrm.scene);

            console.log("VRM đã load thành công!");

        },

        undefined,

        (error)=>{
            console.error("Lỗi load VRM:", error);
        }
    );

});
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
