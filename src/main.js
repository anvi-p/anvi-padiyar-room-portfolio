import * as THREE from 'three';
import './style.scss'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const canvas = document.querySelector("#experience-canvas");
const sizes = {
  height: window.innerHeight,
  width: window.innerWidth
};

const textureLoader = new THREE.TextureLoader();
const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/'); 
loader.setDRACOLoader(dracoLoader);

const textureMap = {
  items: textureLoader.load("/textures/denoised_items.webp"),
  foundation: textureLoader.load("/textures/denoised_foundation.webp"),
  photos: textureLoader.load("/textures/denoised_photos.webp"),
};
Object.keys(textureMap).forEach((key) => {
  textureMap[key].flipY = false;
  textureMap[key].colorSpace = THREE.SRGBColorSpace;
});

const scene = new THREE.Scene();

loader.load("/models/Room_Portfolio-v1.glb", (glb) => {
  glb.scene.traverse((child) => {
    if(child.isMesh){
      let matchedTexture = textureMap.items;
      if(child.name.includes("Foundation_Merged")){
        matchedTexture = textureMap.foundation;
      }
      else if(child.name.includes("Paintings")){
        matchedTexture = textureMap.photos;
      }
      child.material = new THREE.MeshBasicMaterial({
        map: matchedTexture,
      });
      if(child.material.map){
        child.material.map.minFilter = THREE.LinearFilter;
      }
      if(child.name.includes("PC_Glass")){
        child.material = new THREE.MeshPhysicalMaterial({
          transmission: 1,
          opacity: 1,
          metalness: 0,
          roughness: 0,
          ior: 1.5,
          thickness: 0.01,
          specularIntensity: 1,
          envMapIntensity: 1,
          lightIntensity: 1,
          exposure: 1,
        });
       
      }
    }
  }); 
    scene.add(glb.scene);
});

const camera = new THREE.PerspectiveCamera( 
  45, 
  sizes.width / sizes.height, 
  0.1, 
  1000
);
camera.position.set(7.036097392892918, 8.213745395146738, 10.39337474092737);

const renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));  

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; 
controls.dampingFactor = 0.05;
controls.update();
controls.target.set(-0.25703681057082406, 3.973847682284066, 0.17571800447129535);

window.addEventListener("resize", () => {
  controls.update();

  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); 
});

const render = () => {
  controls.update();
  renderer.render(scene, camera);
  window.requestAnimationFrame(render);
}

render();