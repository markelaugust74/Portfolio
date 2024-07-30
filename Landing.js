const earthContainer = document.querySelector('.earth-container');
const sections = document.querySelectorAll('.section-content');
let lastScrollTop = 0;

document.getElementById('logo').onclick = function() {
  window.open('https://www.example.com', '_blank');
};


window.addEventListener('scroll', () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollDirection = scrollTop > lastScrollTop ? 'down' : 'up';

  // Earth zoom effect
  const scale = 1 + scrollTop * 0.001;
  const translateX = Math.min(scrollTop * 0.1, 300);
  earthContainer.style.transform = `translateY(-50%) scale(${scale}) translateX(-${translateX}px)`;

  // Show/hide sections based on scroll position
  sections.forEach((section) => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.clientHeight;

    if (scrollTop >= sectionTop - window.innerHeight / 2 && scrollTop < sectionTop + sectionHeight - window.innerHeight / 2) {
      section.classList.add('visible');
    } else {
      section.classList.remove('visible');
    }
  });

  lastScrollTop = scrollTop;
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    document.querySelector(this.getAttribute('href')).scrollIntoView({
      behavior: 'smooth'
    });
  });
});

// Planet selector functionality
const planets = document.querySelectorAll('.planet');
planets.forEach(planet => {
  planet.addEventListener('click', () => {
    const selectedPlanet = planet.getAttribute('data-planet');
    // Here you can add logic to change the displayed planet and its information
    console.log(`Selected planet: ${selectedPlanet}`);
  });
});

import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { GLTFLoader } from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/examples/jsm/loaders/GLTFLoader.js';

let scene, camera, renderer, model;

function init() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const loader = new GLTFLoader();
    loader.load(Earth_1_12756.glb, function (gltf) {
        model = gltf.scene;
        scene.add(model);
        animate();
    });

    window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    if (model) model.rotation.y += 0.01;
    renderer.render(scene, camera);
}



document.getElementById('Start').addEventListener('click', function(e) {
  e.preventDefault();
  const aboutMeSection = document.getElementById('about-me');
  aboutMeSection.scrollIntoView({ behavior: 'smooth' });
});


document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    document.querySelector(this.getAttribute('href')).scrollIntoView({
      behavior: 'smooth'
    });
  });
});



init();

