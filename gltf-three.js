/**
 * Subset of glTF / VRM extension - THREE.js object mapper.
 * 
 * Omits some components that aren't useful for VRM.
 * i.e.:
 * - remote resource fetch (glTF in VRM always contains all resource in single blob)
 * - assume glTF V2 (no KHR_BINARY_GLTF)
 * 
 * @author Rich Tibbett / https://github.com/richtr
 * @author mrdoob / http://mrdoob.com/
 * @author Tony Parisi / http://www.tonyparisi.com/
 * @author Takahiro / https://github.com/takahirox
 * @author Don McCurdy / https://www.donmccurdy.com
 * @author xyx / https://github.com/xanxys/
 */

export class GLTFLoader {
	constructor() {
		this.manager = THREE.DefaultLoadingManager;
		this.dracoLoader = null;
		this.crossOrigin = 'anonymous';
	}

	setDRACOLoader(dracoLoader) {
		this.dracoLoader = dracoLoader;
		return this;
	}

	/**
	 * @param {Object} json: glTF main content
	 * @param {ArrayBuffer} buffer: glTF bin buffer (first one)
	 * @returns {Promise<Object>}
	 */
	parse(json, buffer) {
		if (json.asset === undefined || json.asset.version[0] < 2) {
			throw new Error('THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported. Use LegacyGLTFLoader instead.');
		}

		const extensions = {};
		extensions[EXTENSIONS.KHR_BINARY_GLTF] = new GLTFBinaryExtension(buffer);

		if (json.extensionsUsed) {
			for (var i = 0; i < json.extensionsUsed.length; ++i) {
				var extensionName = json.extensionsUsed[i];
				var extensionsRequired = json.extensionsRequired || [];

				switch (extensionName) {

					case EXTENSIONS.KHR_LIGHTS_PUNCTUAL:
						extensions[extensionName] = new GLTFLightsExtension(json);
						break;

					case EXTENSIONS.KHR_MATERIALS_UNLIT:
						extensions[extensionName] = new GLTFMaterialsUnlitExtension(json);
						break;

					case EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS:
						extensions[extensionName] = new GLTFMaterialsPbrSpecularGlossinessExtension(json);
						break;

					case EXTENSIONS.KHR_DRACO_MESH_COMPRESSION:
						extensions[extensionName] = new GLTFDracoMeshCompressionExtension(json, this.dracoLoader);
						break;

					case EXTENSIONS.MSFT_TEXTURE_DDS:
						extensions[EXTENSIONS.MSFT_TEXTURE_DDS] = new GLTFTextureDDSExtension();
						break;

					case EXTENSIONS.KHR_TEXTURE_TRANSFORM:
						extensions[EXTENSIONS.KHR_TEXTURE_TRANSFORM] = new GLTFTextureTransformExtension(json);
						break;

					default:
						if (extensionsRequired.indexOf(extensionName) >= 0) {
							console.warn('THREE.GLTFLoader: Unknown extension "' + extensionName + '".');
						}
				}
			}
		}

		return new GLTFParser(json, extensions).parse();
	}
}

// deprecated
function GLTFBinaryExtension(buffer) {
	this.name = EXTENSIONS.KHR_BINARY_GLTF;
	this.body = buffer;  // single ArrayBuffer (bin chunk data)
}


/*********************************/
/********** EXTENSIONS ***********/
/*********************************/

var EXTENSIONS = {
	KHR_BINARY_GLTF: 'KHR_binary_glTF',
	KHR_DRACO_MESH_COMPRESSION: 'KHR_draco_mesh_compression',
	KHR_LIGHTS_PUNCTUAL: 'KHR_lights_punctual',
	KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS: 'KHR_materials_pbrSpecularGlossiness',
	KHR_MATERIALS_UNLIT: 'KHR_materials_unlit',
	KHR_TEXTURE_TRANSFORM: 'KHR_texture_transform',
	MSFT_TEXTURE_DDS: 'MSFT_texture_dds'
};

/**
 * DDS Texture Extension
 *
 * Specification:
 * https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/MSFT_texture_dds
 *
 */
function GLTFTextureDDSExtension() {

	if (!THREE.DDSLoader) {

		throw new Error('THREE.GLTFLoader: Attempting to load .dds texture without importing THREE.DDSLoader');

	}

	this.name = EXTENSIONS.MSFT_TEXTURE_DDS;
	this.ddsLoader = new THREE.DDSLoader();

}

/**
 * Lights Extension
 *
 * Specification: PENDING
 */
function GLTFLightsExtension(json) {

	this.name = EXTENSIONS.KHR_LIGHTS_PUNCTUAL;

	var extension = (json.extensions && json.extensions[EXTENSIONS.KHR_LIGHTS_PUNCTUAL]) || {};
	this.lightDefs = extension.lights || [];

}

GLTFLightsExtension.prototype.loadLight = function (lightIndex) {

	var lightDef = this.lightDefs[lightIndex];
	var lightNode;

	var color = new THREE.Color(0xffffff);
	if (lightDef.color !== undefined) color.fromArray(lightDef.color);

	var range = lightDef.range !== undefined ? lightDef.range : 0;

	switch (lightDef.type) {

		case 'directional':
			lightNode = new THREE.DirectionalLight(color);
			lightNode.target.position.set(0, 0, - 1);
			lightNode.add(lightNode.target);
			break;

		case 'point':
			lightNode = new THREE.PointLight(color);
			lightNode.distance = range;
			break;

		case 'spot':
			lightNode = new THREE.SpotLight(color);
			lightNode.distance = range;
			// Handle spotlight properties.
			lightDef.spot = lightDef.spot || {};
			lightDef.spot.innerConeAngle = lightDef.spot.innerConeAngle !== undefined ? lightDef.spot.innerConeAngle : 0;
			lightDef.spot.outerConeAngle = lightDef.spot.outerConeAngle !== undefined ? lightDef.spot.outerConeAngle : Math.PI / 4.0;
			lightNode.angle = lightDef.spot.outerConeAngle;
			lightNode.penumbra = 1.0 - lightDef.spot.innerConeAngle / lightDef.spot.outerConeAngle;
			lightNode.target.position.set(0, 0, - 1);
			lightNode.add(lightNode.target);
			break;

		default:
			throw new Error('THREE.GLTFLoader: Unexpected light type, "' + lightDef.type + '".');

	}

	// Some lights (e.g. spot) default to a position other than the origin. Reset the position
	// here, because node-level parsing will only override position if explicitly specified.
	lightNode.position.set(0, 0, 0);

	lightNode.decay = 2;

	if (lightDef.intensity !== undefined) lightNode.intensity = lightDef.intensity;

	lightNode.name = lightDef.name || ('light_' + lightIndex);

	return Promise.resolve(lightNode);

};

/**
 * Unlit Materials Extension (pending)
 *
 * PR: https://github.com/KhronosGroup/glTF/pull/1163
 */
function GLTFMaterialsUnlitExtension(json) {

	this.name = EXTENSIONS.KHR_MATERIALS_UNLIT;

}

GLTFMaterialsUnlitExtension.prototype.getMaterialType = function (material) {

	return THREE.MeshBasicMaterial;

};

GLTFMaterialsUnlitExtension.prototype.extendParams = function (materialParams, material, parser) {

	var pending = [];

	materialParams.color = new THREE.Color(1.0, 1.0, 1.0);
	materialParams.opacity = 1.0;

	var metallicRoughness = material.pbrMetallicRoughness;

	if (metallicRoughness) {

		if (Array.isArray(metallicRoughness.baseColorFactor)) {

			var array = metallicRoughness.baseColorFactor;

			materialParams.color.fromArray(array);
			materialParams.opacity = array[3];

		}

		if (metallicRoughness.baseColorTexture !== undefined) {

			pending.push(parser.assignTexture(materialParams, 'map', metallicRoughness.baseColorTexture));

		}

	}

	return Promise.all(pending);

};

/**
 * DRACO Mesh Compression Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/pull/874
 */
function GLTFDracoMeshCompressionExtension(json, dracoLoader) {

	if (!dracoLoader) {

		throw new Error('THREE.GLTFLoader: No DRACOLoader instance provided.');

	}

	this.name = EXTENSIONS.KHR_DRACO_MESH_COMPRESSION;
	this.json = json;
	this.dracoLoader = dracoLoader;

}

GLTFDracoMeshCompressionExtension.prototype.decodePrimitive = function (primitive, parser) {

	var json = this.json;
	var dracoLoader = this.dracoLoader;
	var bufferViewIndex = primitive.extensions[this.name].bufferView;
	var gltfAttributeMap = primitive.extensions[this.name].attributes;
	var threeAttributeMap = {};
	var attributeNormalizedMap = {};
	var attributeTypeMap = {};

	for (var attributeName in gltfAttributeMap) {

		var threeAttributeName = ATTRIBUTES[attributeName] || attributeName.toLowerCase();

		threeAttributeMap[threeAttributeName] = gltfAttributeMap[attributeName];

	}

	for (attributeName in primitive.attributes) {

		var threeAttributeName = ATTRIBUTES[attributeName] || attributeName.toLowerCase();

		if (gltfAttributeMap[attributeName] !== undefined) {

			var accessorDef = json.accessors[primitive.attributes[attributeName]];
			var componentType = WEBGL_COMPONENT_TYPES[accessorDef.componentType];

			attributeTypeMap[threeAttributeName] = componentType;
			attributeNormalizedMap[threeAttributeName] = accessorDef.normalized === true;

		}

	}

	return parser.getDependency('bufferView', bufferViewIndex).then(bufferView => {

		return new Promise(resolve => {

			dracoLoader.decodeDracoFile(bufferView, geometry => {

				for (var attributeName in geometry.attributes) {

					var attribute = geometry.attributes[attributeName];
					var normalized = attributeNormalizedMap[attributeName];

					if (normalized !== undefined) attribute.normalized = normalized;

				}

				resolve(geometry);

			}, threeAttributeMap, attributeTypeMap);

		});

	});

};

/**
 * Texture Transform Extension
 *
 * Specification:
 */
function GLTFTextureTransformExtension(json) {

	this.name = EXTENSIONS.KHR_TEXTURE_TRANSFORM;

}

GLTFTextureTransformExtension.prototype.extendTexture = function (texture, transform) {

	texture = texture.clone();

	if (transform.offset !== undefined) {

		texture.offset.fromArray(transform.offset);

	}

	if (transform.rotation !== undefined) {

		texture.rotation = transform.rotation;

	}

	if (transform.scale !== undefined) {

		texture.repeat.fromArray(transform.scale);

	}

	if (transform.texCoord !== undefined) {

		console.warn('THREE.GLTFLoader: Custom UV sets in "' + this.name + '" extension not yet supported.');

	}

	texture.needsUpdate = true;

	return texture;

};

/**
 * Specular-Glossiness Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_pbrSpecularGlossiness
 */
function GLTFMaterialsPbrSpecularGlossinessExtension() {

	return {

		name: EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS,

		specularGlossinessParams: [
			'color',
			'map',
			'lightMap',
			'lightMapIntensity',
			'aoMap',
			'aoMapIntensity',
			'emissive',
			'emissiveIntensity',
			'emissiveMap',
			'bumpMap',
			'bumpScale',
			'normalMap',
			'displacementMap',
			'displacementScale',
			'displacementBias',
			'specularMap',
			'specular',
			'glossinessMap',
			'glossiness',
			'alphaMap',
			'envMap',
			'envMapIntensity',
			'refractionRatio',
		],

		getMaterialType: function () {

			return THREE.ShaderMaterial;

		},

		extendParams: function (params, material, parser) {

			var pbrSpecularGlossiness = material.extensions[this.name];

			var shader = THREE.ShaderLib['standard'];

			var uniforms = THREE.UniformsUtils.clone(shader.uniforms);

			var specularMapParsFragmentChunk = [
				'#ifdef USE_SPECULARMAP',
				'	uniform sampler2D specularMap;',
				'#endif'
			].join('\n');

			var glossinessMapParsFragmentChunk = [
				'#ifdef USE_GLOSSINESSMAP',
				'	uniform sampler2D glossinessMap;',
				'#endif'
			].join('\n');

			var specularMapFragmentChunk = [
				'vec3 specularFactor = specular;',
				'#ifdef USE_SPECULARMAP',
				'	vec4 texelSpecular = texture2D( specularMap, vUv );',
				'	texelSpecular = sRGBToLinear( texelSpecular );',
				'	// reads channel RGB, compatible with a glTF Specular-Glossiness (RGBA) texture',
				'	specularFactor *= texelSpecular.rgb;',
				'#endif'
			].join('\n');

			var glossinessMapFragmentChunk = [
				'float glossinessFactor = glossiness;',
				'#ifdef USE_GLOSSINESSMAP',
				'	vec4 texelGlossiness = texture2D( glossinessMap, vUv );',
				'	// reads channel A, compatible with a glTF Specular-Glossiness (RGBA) texture',
				'	glossinessFactor *= texelGlossiness.a;',
				'#endif'
			].join('\n');

			var lightPhysicalFragmentChunk = [
				'PhysicalMaterial material;',
				'material.diffuseColor = diffuseColor.rgb;',
				'material.specularRoughness = clamp( 1.0 - glossinessFactor, 0.04, 1.0 );',
				'material.specularColor = specularFactor.rgb;',
			].join('\n');

			var fragmentShader = shader.fragmentShader
				.replace('uniform float roughness;', 'uniform vec3 specular;')
				.replace('uniform float metalness;', 'uniform float glossiness;')
				.replace('#include <roughnessmap_pars_fragment>', specularMapParsFragmentChunk)
				.replace('#include <metalnessmap_pars_fragment>', glossinessMapParsFragmentChunk)
				.replace('#include <roughnessmap_fragment>', specularMapFragmentChunk)
				.replace('#include <metalnessmap_fragment>', glossinessMapFragmentChunk)
				.replace('#include <lights_physical_fragment>', lightPhysicalFragmentChunk);

			delete uniforms.roughness;
			delete uniforms.metalness;
			delete uniforms.roughnessMap;
			delete uniforms.metalnessMap;

			uniforms.specular = { value: new THREE.Color().setHex(0x111111) };
			uniforms.glossiness = { value: 0.5 };
			uniforms.specularMap = { value: null };
			uniforms.glossinessMap = { value: null };

			params.vertexShader = shader.vertexShader;
			params.fragmentShader = fragmentShader;
			params.uniforms = uniforms;
			params.defines = { 'STANDARD': '' };

			params.color = new THREE.Color(1.0, 1.0, 1.0);
			params.opacity = 1.0;

			var pending = [];

			if (Array.isArray(pbrSpecularGlossiness.diffuseFactor)) {

				var array = pbrSpecularGlossiness.diffuseFactor;

				params.color.fromArray(array);
				params.opacity = array[3];

			}

			if (pbrSpecularGlossiness.diffuseTexture !== undefined) {

				pending.push(parser.assignTexture(params, 'map', pbrSpecularGlossiness.diffuseTexture));

			}

			params.emissive = new THREE.Color(0.0, 0.0, 0.0);
			params.glossiness = pbrSpecularGlossiness.glossinessFactor !== undefined ? pbrSpecularGlossiness.glossinessFactor : 1.0;
			params.specular = new THREE.Color(1.0, 1.0, 1.0);

			if (Array.isArray(pbrSpecularGlossiness.specularFactor)) {

				params.specular.fromArray(pbrSpecularGlossiness.specularFactor);

			}

			if (pbrSpecularGlossiness.specularGlossinessTexture !== undefined) {

				var specGlossMapDef = pbrSpecularGlossiness.specularGlossinessTexture;
				pending.push(parser.assignTexture(params, 'glossinessMap', specGlossMapDef));
				pending.push(parser.assignTexture(params, 'specularMap', specGlossMapDef));

			}

			return Promise.all(pending);

		},

		createMaterial: function (params) {

			// setup material properties based on MeshStandardMaterial for Specular-Glossiness

			var material = new THREE.ShaderMaterial({
				defines: params.defines,
				vertexShader: params.vertexShader,
				fragmentShader: params.fragmentShader,
				uniforms: params.uniforms,
				fog: true,
				lights: true,
				opacity: params.opacity,
				transparent: params.transparent
			});

			material.isGLTFSpecularGlossinessMaterial = true;

			material.color = params.color;

			material.map = params.map === undefined ? null : params.map;

			material.lightMap = null;
			material.lightMapIntensity = 1.0;

			material.aoMap = params.aoMap === undefined ? null : params.aoMap;
			material.aoMapIntensity = 1.0;

			material.emissive = params.emissive;
			material.emissiveIntensity = 1.0;
			material.emissiveMap = params.emissiveMap === undefined ? null : params.emissiveMap;

			material.bumpMap = params.bumpMap === undefined ? null : params.bumpMap;
			material.bumpScale = 1;

			material.normalMap = params.normalMap === undefined ? null : params.normalMap;
			if (params.normalScale) material.normalScale = params.normalScale;

			material.displacementMap = null;
			material.displacementScale = 1;
			material.displacementBias = 0;

			material.specularMap = params.specularMap === undefined ? null : params.specularMap;
			material.specular = params.specular;

			material.glossinessMap = params.glossinessMap === undefined ? null : params.glossinessMap;
			material.glossiness = params.glossiness;

			material.alphaMap = null;

			material.envMap = params.envMap === undefined ? null : params.envMap;
			material.envMapIntensity = 1.0;

			material.refractionRatio = 0.98;

			material.extensions.derivatives = true;

			return material;

		},

		/**
		 * Clones a GLTFSpecularGlossinessMaterial instance. The ShaderMaterial.copy() method can
		 * copy only properties it knows about or inherits, and misses many properties that would
		 * normally be defined by MeshStandardMaterial.
		 *
		 * This method allows GLTFSpecularGlossinessMaterials to be cloned in the process of
		 * loading a glTF model, but cloning later (e.g. by the user) would require these changes
		 * AND also updating `.onBeforeRender` on the parent mesh.
		 *
		 * @param  {THREE.ShaderMaterial} source
		 * @return {THREE.ShaderMaterial}
		 */
		cloneMaterial: function (source) {

			var target = source.clone();

			target.isGLTFSpecularGlossinessMaterial = true;

			var params = this.specularGlossinessParams;

			for (var i = 0, il = params.length; i < il; i++) {

				target[params[i]] = source[params[i]];

			}

			return target;

		},

		// Here's based on refreshUniformsCommon() and refreshUniformsStandard() in WebGLRenderer.
		refreshUniforms: function (renderer, scene, camera, geometry, material, group) {

			if (material.isGLTFSpecularGlossinessMaterial !== true) {

				return;

			}

			var uniforms = material.uniforms;
			var defines = material.defines;

			uniforms.opacity.value = material.opacity;

			uniforms.diffuse.value.copy(material.color);
			uniforms.emissive.value.copy(material.emissive).multiplyScalar(material.emissiveIntensity);

			uniforms.map.value = material.map;
			uniforms.specularMap.value = material.specularMap;
			uniforms.alphaMap.value = material.alphaMap;

			uniforms.lightMap.value = material.lightMap;
			uniforms.lightMapIntensity.value = material.lightMapIntensity;

			uniforms.aoMap.value = material.aoMap;
			uniforms.aoMapIntensity.value = material.aoMapIntensity;

			// uv repeat and offset setting priorities
			// 1. color map
			// 2. specular map
			// 3. normal map
			// 4. bump map
			// 5. alpha map
			// 6. emissive map

			var uvScaleMap;

			if (material.map) {

				uvScaleMap = material.map;

			} else if (material.specularMap) {

				uvScaleMap = material.specularMap;

			} else if (material.displacementMap) {

				uvScaleMap = material.displacementMap;

			} else if (material.normalMap) {

				uvScaleMap = material.normalMap;

			} else if (material.bumpMap) {

				uvScaleMap = material.bumpMap;

			} else if (material.glossinessMap) {

				uvScaleMap = material.glossinessMap;

			} else if (material.alphaMap) {

				uvScaleMap = material.alphaMap;

			} else if (material.emissiveMap) {

				uvScaleMap = material.emissiveMap;

			}

			if (uvScaleMap !== undefined) {

				// backwards compatibility
				if (uvScaleMap.isWebGLRenderTarget) {

					uvScaleMap = uvScaleMap.texture;

				}

				if (uvScaleMap.matrixAutoUpdate === true) {

					uvScaleMap.updateMatrix();

				}

				uniforms.uvTransform.value.copy(uvScaleMap.matrix);

			}

			if (material.envMap) {

				uniforms.envMap.value = material.envMap;
				uniforms.envMapIntensity.value = material.envMapIntensity;

				// don't flip CubeTexture envMaps, flip everything else:
				//  WebGLRenderTargetCube will be flipped for backwards compatibility
				//  WebGLRenderTargetCube.texture will be flipped because it's a Texture and NOT a CubeTexture
				// this check must be handled differently, or removed entirely, if WebGLRenderTargetCube uses a CubeTexture in the future
				uniforms.flipEnvMap.value = material.envMap.isCubeTexture ? - 1 : 1;

				uniforms.reflectivity.value = material.reflectivity;
				uniforms.refractionRatio.value = material.refractionRatio;

				uniforms.maxMipLevel.value = renderer.properties.get(material.envMap).__maxMipLevel;

			}

			uniforms.specular.value.copy(material.specular);
			uniforms.glossiness.value = material.glossiness;

			uniforms.glossinessMap.value = material.glossinessMap;

			uniforms.emissiveMap.value = material.emissiveMap;
			uniforms.bumpMap.value = material.bumpMap;
			uniforms.normalMap.value = material.normalMap;

			uniforms.displacementMap.value = material.displacementMap;
			uniforms.displacementScale.value = material.displacementScale;
			uniforms.displacementBias.value = material.displacementBias;

			if (uniforms.glossinessMap.value !== null && defines.USE_GLOSSINESSMAP 
