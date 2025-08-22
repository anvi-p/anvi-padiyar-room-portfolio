import * as THREE from 'three';
import './style.scss'
import { OrbitControls } from './utils/OrbitControls.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import gsap from "gsap";

const canvas = document.querySelector("#experience-canvas");
const container = document.getElementById('experience');

const sizes = {
  width: container.clientWidth,
  height: container.clientHeight
};

const raycasterObjs = [];
let currentIntersects = [];
let currActiveObject = null;

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const textureLoader = new THREE.TextureLoader();
const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/'); 
loader.setDRACOLoader(dracoLoader);

const environmentMap = new THREE.CubeTextureLoader()
	.setPath( 'textures/skybox/' )
	.load( [
				'px.webp',
				'nx.webp',
				'py.webp',
				'ny.webp',
				'pz.webp',
				'nz.webp'
			] );

const textureMap = {
  items: textureLoader.load("/textures/room/denoised_items.webp"),
  foundation: textureLoader.load("/textures/room/denoised_foundation.webp"),
  photos: textureLoader.load("/textures/room/denoised_photos.webp"),
  domain: textureLoader.load("/textures/room/denoised_domain.webp"),
};

Object.keys(textureMap).forEach((key) => {
  textureMap[key].flipY = false;
  textureMap[key].colorSpace = THREE.SRGBColorSpace;
});

const scene = new THREE.Scene();

window.addEventListener("mousemove", (event) => {
  pointer.x = (event.clientX / sizes.width) * 2 - 1;
	pointer.y = -(event.clientY / sizes.height) * 2 + 1;
});

window.addEventListener("click", (event) => { ///// TODO
  if(currentIntersects.length > 0){
    const object = currentIntersects[0].object;
  }
  pointer.x = (event.clientX / sizes.width) * 2 - 1;
	pointer.y = -(event.clientY / sizes.height) * 2 + 1;
});

/* Load all textures into the scene */
loader.load("/models/Room_Portfolio-v2.glb", (glb) => {
  glb.scene.traverse((child) => {
    if(child.isMesh){
      if(child.name.includes("PC_Glass")){
        child.material = new THREE.MeshPhysicalMaterial({
          transmission: 1,
          opacity: 0.5,
          metalness: 0,
          roughness: 0,
          ior: 1.5,
          thickness: 0.1,
          specularIntensity: 1,
          envMap: environmentMap,
          envMapIntensity: 1,
        });
      }
      else{
        let matchedTexture = textureMap.items;
        if(child.name.includes("Foundation_Merged")){
          matchedTexture = textureMap.foundation;
        }
        else if(child.name.includes("Paintings")){
          matchedTexture = textureMap.photos;
        }
        else if(child.name.includes("Domain")){
          matchedTexture = textureMap.domain;
        }
        else if(!child.name.includes("Items_Merged")  || child.name.includes("Button")){
          raycasterObjs.push(child); // add interactivity to some objects
          child.userData.initialScale = new THREE.Vector3().copy(child.scale);
          child.userData.initialRotation  = new THREE.Euler().copy(child.rotation);
          child.userData.initialPosition = new THREE.Vector3().copy(child.position);
        }
        child.material = new THREE.MeshBasicMaterial({
          map: matchedTexture,
        });
      }
      if(child.material.map){
        child.material.map.minFilter = THREE.LinearFilter;
      } 
    }
  }); 
  scene.add(glb.scene);
});

const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 1000);
camera.position.set(12, 6, 16);

const renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));  

const controls = new OrbitControls(camera, renderer.domElement);
controls.minDistance = 5;
controls.maxDistance = 30;

controls.minPolarAngle = 0;
controls.maxPolarAngle = Math.PI / 2;
controls.minAzimuthAngle = 0;
controls.maxAzimuthAngle = Math.PI / 2;

controls.enableDamping = true; 
controls.dampingFactor = 0.05;
controls.target.set(1, 2, 0);
controls.update();

window.addEventListener("resize", () => {
  controls.update();

  sizes.width =  container.clientWidth;
  sizes.height = container.clientHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); 
});

function animate(object, isActive){
  gsap.killTweensOf(object.scale);
  gsap.killTweensOf(object.rotation);
  gsap.killTweensOf(object.position);

  if(isActive){
    if (object.name.includes("Chair")) {
      gsap.to(object.rotation, {
        y: object.userData.initialRotation.y + Math.PI / 5,
        duration: 0.5,
        ease: "bounce.out(2)",
      });
    }
    else{
      if(object.name.includes("Button")){ // scale and hover
        gsap.to(object.position, { 
          y: object.userData.initialPosition.y + 0.2,
          duration: 0.5,
          ease: "bounce.out(1.8)",
        });
      }
      gsap.to(object.scale, {
        x: object.userData.initialScale.x * 1.2, 
        y: object.userData.initialScale.y * 1.2, 
        z: object.userData.initialScale.z * 1.2, 
        duration: 0.5,
        ease: "bounce.out(1.8)",
      });
    }
  }
  else{
    if(object.name.includes("Chair")) {
      gsap.to(object.rotation, {
        y: object.userData.initialRotation.y,
        duration: 0.3,
        ease: "bounce.out(1.8)",
      });
    }
    else{
      if(object.name.includes("Button")){
        gsap.to(object.position, {
          y: object.userData.initialPosition.y,
          duration: 0.3,
          ease: "bounce.out(1.8)",
        });
      } 
      gsap.to(object.scale, {
        x: object.userData.initialScale.x, 
        y: object.userData.initialScale.y, 
        z: object.userData.initialScale.z, 
        duration: 0.3,
        ease: "bounce.out(1.8)",
      });
    }
  }
}

const render = () => {
  controls.update();
  raycaster.setFromCamera( pointer, camera );
  currentIntersects = raycaster.intersectObjects(raycasterObjs);

  if(currentIntersects.length > 0){
    let currIntersectObj = currentIntersects[0].object;

    if(!currIntersectObj.name.includes("Items_Merged")){
      if(currIntersectObj !== currActiveObject){
        if(currActiveObject){ // on another object, move first one down
          animate(currActiveObject, false);
        }
        animate(currIntersectObj, true);
        currActiveObject = currIntersectObj;
      }
    }

    if(currIntersectObj.name.includes("Button")){
      document.body.style.cursor = "pointer";
    }
    else{
      document.body.style.cursor = "default";
    }
  }
  else{
    if(currActiveObject){ // on another object, move first one down
      animate(currActiveObject, false);
      currActiveObject = null;
    }
      document.body.style.cursor = "default";
    }
  renderer.render(scene, camera);
  window.requestAnimationFrame(render);
}

render();

const textSection = document.querySelector('.text-section');
const backToTop = document.getElementById('backToTop');
function isMobileLayout() {
  return window.innerWidth <= 768; // same breakpoint as CSS
}

// Show/hide button depending on scroll position
function updateButtonVisibility() {
  if (isMobileLayout()) {
    if (window.scrollY > 200) {
      backToTop.classList.add('show');
    } else {
      backToTop.classList.remove('show');
    }
  } else {
    if (textSection.scrollTop > 200) {
      backToTop.classList.add('show');
    } else {
      backToTop.classList.remove('show');
    }
  }
}

// Scroll to top
backToTop.addEventListener('click', () => {
  if (isMobileLayout()) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    textSection.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

// Listeners
textSection.addEventListener('scroll', updateButtonVisibility);
window.addEventListener('scroll', updateButtonVisibility);
window.addEventListener('resize', updateButtonVisibility);

// Initial check
updateButtonVisibility();