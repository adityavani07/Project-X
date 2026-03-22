import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import WorkScene from './scenes/WorkScene';
import emailjs from '@emailjs/browser';
import BackgroundScene from './scenes/BackgroundScene';

gsap.registerPlugin(ScrollTrigger);

const bg = new BackgroundScene('bg-canvas');

// ============================================
// GLOBAL STATE & UTILS
// ============================================
let mouseX = 0, mouseY = 0;
const isMobile = window.innerWidth < 768;

document.addEventListener('mousemove', (e) => {
  mouseX = (e.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
});

// ============================================
// AUDIO & SOUND DESIGN
// ============================================
const soundToggle = document.getElementById('soundToggle');

// 1. Setup the Background Music (Quiet and ambient)
const bgMusic = new Audio('/sounds/ambient-loop.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.1; // Set to 10% volume so it stays quietly in the background

// 2. Setup the Hover Sound Effect (Loud and clear)
const hoverSound = new Audio('/sounds/hover.mp3');
hoverSound.volume = 0.9; // Set to 90% volume so the clicks really pop

let isSoundActive = false;

// 3. The "Ghost Mouse" Fix: Track physical mouse movement time
let lastMouseMoveTime = 0;
window.addEventListener('mousemove', () => {
  lastMouseMoveTime = Date.now();
});

if (soundToggle) {
  soundToggle.addEventListener('click', () => {
    isSoundActive = !isSoundActive;
    
    if (isSoundActive) {
      // Browsers require a direct click to play audio. This handles it!
      const playPromise = bgMusic.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => console.error("Audio block:", e));
      }
      soundToggle.innerText = 'Sound: On';
      soundToggle.style.color = 'var(--white)';
    } else {
      bgMusic.pause();
      soundToggle.innerText = 'Sound: Off';
      soundToggle.style.color = 'var(--grey)';
    }
  });
}

// 4. Attach Hover Sounds with the Movement Check
document.querySelectorAll('a, button, .hoverable, .work-card, .service-card').forEach(el => {
  if (el.id === 'soundToggle') return; 

  el.addEventListener('mouseenter', () => {
    // Check if the physical mouse actually moved in the last 100 milliseconds
    const didMouseMoveRecently = (Date.now() - lastMouseMoveTime) < 100;

    // ONLY play the sound if the audio is on AND the user actually moved the mouse
    if (isSoundActive && didMouseMoveRecently) {
      hoverSound.currentTime = 0; 
      hoverSound.play().catch(e => console.log("Hover sound failed:", e));
    }
  });
});

// Prevent right-click context menu on all images, even dynamically loaded ones
document.addEventListener('contextmenu', (e) => {
  if (e.target.tagName === 'IMG') {
    e.preventDefault();
  }
});

// Extra layer: Prevent dragging on the whole document just in case
document.addEventListener('dragstart', (e) => {
  if (e.target.tagName === 'IMG') {
    e.preventDefault();
  }
});

// ============================================
// CUSTOM SMOOTH SCROLL (Hides the URL preview)
// ============================================
document.querySelectorAll('a[data-target]').forEach(link => {
  link.addEventListener('click', () => {
    const targetId = link.getAttribute('data-target'); // Grabs "#about", etc.
    const targetSection = document.querySelector(targetId);
    
    if (targetSection) {
      targetSection.scrollIntoView({ behavior: 'smooth' });
      
      // If the mobile menu is open, close it automatically when a link is clicked
      if (hamburger && mobileNav) {
        hamburger.classList.remove('open');
        mobileNav.classList.remove('open');
      }
    }
  });
});

// ============================================
// CUSTOM CURSOR
// ============================================
const cursor = document.getElementById('cursor');
const cursorDot = document.getElementById('cursorDot');
let cursorX = 0, cursorY = 0;
let dotX = 0, dotY = 0;
let targetX = 0, targetY = 0;

if (!('ontouchstart' in window)) {
  document.addEventListener('mousemove', (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
  });

  function animateCursor() {
    cursorX += (targetX - cursorX) * 0.12;
    cursorY += (targetY - cursorY) * 0.12;
    dotX += (targetX - dotX) * 0.6;
    dotY += (targetY - dotY) * 0.6;

    cursor.style.transform = `translate(${cursorX}px, ${cursorY}px) translate(-50%, -50%)`;
    cursorDot.style.transform = `translate(${dotX}px, ${dotY}px) translate(-50%, -50%)`;
    requestAnimationFrame(animateCursor);
  }
  
  // Use transforms instead of top/left for better performance
  cursor.style.top = '0'; cursor.style.left = '0';
  cursorDot.style.top = '0'; cursorDot.style.left = '0';
  animateCursor();

  document.querySelectorAll('.hoverable, a, button').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('active'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('active'));
  });
} else {
  cursor.style.display = 'none';
  cursorDot.style.display = 'none';
  document.body.style.cursor = 'auto';
}

// ============================================
// UI INTERACTIONS (Nav, Forms, etc)
// ============================================
const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobileNav');
const navCloseBtns = document.querySelectorAll('.nav-close');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  mobileNav.classList.toggle('open');
});

navCloseBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    hamburger.classList.remove('open');
    mobileNav.classList.remove('open');
  });
});

let lastScroll = 0;
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
  const currentScroll = window.pageYOffset;
  if (currentScroll > 100) navbar.classList.add('scrolled');
  else navbar.classList.remove('scrolled');
  
  if (currentScroll > lastScroll && currentScroll > 300) navbar.classList.add('hidden');
  else navbar.classList.remove('hidden');
  
  lastScroll = currentScroll;
});

document.getElementById('contactForm').addEventListener('submit', (e) => {
  e.preventDefault();
  alert("Message sent! We'll be in touch.");
});

document.getElementById('backToTop').addEventListener('click', () => {
  window.scrollTo({top:0, behavior:'smooth'});
});

// ============================================
// THREE.JS: PRELOADER
// ============================================
function initPreloader() {
  const canvas = document.getElementById('preloader-canvas');
  if(!canvas) return;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.z = 3;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(200, 200);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const geometry = new THREE.IcosahedronGeometry(1, 1);
  const material = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  let preloaderActive = true;

  function animate() {
    if (!preloaderActive) return;
    mesh.rotation.x += 0.01;
    mesh.rotation.y += 0.015;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

  document.body.style.overflow = 'hidden';

  gsap.to(document.querySelectorAll('#preloaderText span'), {
    opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power3.out', delay: 0.3
  });

  let progress = { val: 0 };
  gsap.to(progress, {
    val: 100, duration: 2.5, ease: 'power2.inOut',
    onUpdate: () => document.getElementById('preloaderPercent').textContent = Math.round(progress.val),
    onComplete: () => {
      setTimeout(() => {
        document.getElementById('preloader').classList.add('done');
        document.body.style.overflow = 'auto';
        setTimeout(animateHeroContent, 600);
        setTimeout(() => {
          preloaderActive = false;
          document.getElementById('preloader')?.remove();
          geometry.dispose(); material.dispose(); renderer.dispose();
        }, 1500);
      }, 400);
    }
  });
}

// ============================================
// THREE.JS: HERO SCENE
// ============================================
let heroRenderer, heroCamera;
function initHero() {
  const canvas = document.getElementById('hero-canvas');
  const scene = new THREE.Scene();
  heroCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  heroCamera.position.z = 5;

  heroRenderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  heroRenderer.setSize(window.innerWidth, window.innerHeight);
  heroRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const detail = isMobile ? [2, 3, 64, 16] : [2, 3, 128, 32];
  const geometry = new THREE.TorusKnotGeometry(1.5, 0.5, detail[2], detail[3]);
  const material = new THREE.MeshBasicMaterial({ color: 0x444444, wireframe: true });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  const count = isMobile ? 200 : 600;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i++) positions[i] = (Math.random() - 0.5) * 20;
  
  const particlesGeo = new THREE.BufferGeometry();
  particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particlesMat = new THREE.PointsMaterial({ color: 0x333333, size: 0.02 });
  const particles = new THREE.Points(particlesGeo, particlesMat);
  scene.add(particles);

  function animate() {
    mesh.rotation.x += 0.003 + (mouseY * 0.003);
    mesh.rotation.y += 0.005 + (mouseX * 0.003);
    particles.rotation.y += 0.0003;
    heroRenderer.render(scene, heroCamera);
    requestAnimationFrame(animate);
  }
  animate();
}

function animateHeroContent() {
  gsap.to('.hero-label', { opacity: 1, y: 0, duration: 1, ease: 'power3.out' });
  gsap.to('.hero-title', { opacity: 1, y: 0, duration: 1.2, delay: 0.2, ease: 'power3.out' });
  gsap.to('.hero-subtitle', { opacity: 1, y: 0, duration: 1, delay: 0.5, ease: 'power3.out' });
  gsap.to('.scroll-indicator', { opacity: 1, duration: 1, delay: 1, ease: 'power2.out' });
}

// ============================================
// THREE.JS: Selected WORK SCENE (see WorkScene.js for details)
// ============================================

document.querySelectorAll('.work-card').forEach(card => {
  new WorkScene(card);
});

// ============================================
// THREE.JS: ABOUT & MULTI-CANVAS SECTIONS
// ============================================
let aboutDistortion = 0;

function initAbout() {
  const canvas = document.getElementById('about-canvas');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.z = 3.5;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  const size = isMobile ? 250 : 500;
  renderer.setSize(size, size);
  
  const detail = isMobile ? 24 : 64;
  const geometry = new THREE.SphereGeometry(1.3, detail, detail);
  const material = new THREE.MeshBasicMaterial({ color: 0x666666, wireframe: true });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  const originalPositions = geometry.attributes.position.array.slice();

  function animate() {
    const time = performance.now() * 0.001;
    const positions = geometry.attributes.position.array;

    for (let i = 0; i < positions.length; i += 3) {
      const ox = originalPositions[i], oy = originalPositions[i + 1], oz = originalPositions[i + 2];
      const noise = Math.sin(ox * 3 + time) * Math.cos(oy * 3 + time) * Math.sin(oz * 3 + time * 0.5);
      const factor = 1 + noise * aboutDistortion * 0.25;
      positions[i] = ox * factor; positions[i + 1] = oy * factor; positions[i + 2] = oz * factor;
    }
    geometry.attributes.position.needsUpdate = true;
    mesh.rotation.y += 0.005; mesh.rotation.x += 0.002;
    
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();
}

function initMiniCanvases() {
  document.querySelectorAll('.service-card').forEach(card => {

    // BAILOUT: If mobile, skip WebGL and add a fallback class
    if (isMobile) {
      card.classList.add('show-fallback');
      return; 
    }

    const canvas = card.querySelector('.service-canvas');
    if (!canvas) return;

    const shape = card.dataset.shape;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.z = 3;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(60, 60);

    let geometry;
    const seg = isMobile ? 8 : 16;
    if(shape === 'box') geometry = new THREE.BoxGeometry(1, 1, 1);
    else if(shape === 'sphere') geometry = new THREE.SphereGeometry(0.7, seg, seg);
    else if(shape === 'cone') geometry = new THREE.ConeGeometry(0.7, 1.2, seg);
    else geometry = new THREE.TorusGeometry(0.6, 0.25, seg, seg * 2);

    const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0x666666, wireframe: true }));
    scene.add(mesh);

    let hovered = false;
    card.addEventListener('mouseenter', () => hovered = true);
    card.addEventListener('mouseleave', () => hovered = false);

    function animate() {
      mesh.rotation.x += hovered ? 0.03 : 0.01;
      mesh.rotation.y += hovered ? 0.039 : 0.013;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    animate();
  });
}

// ============================================
// GSAP SCROLL ANIMATIONS & EFFECTS
// ============================================
function initScrollAnimations() {
  document.querySelectorAll('.heading-inner').forEach(heading => {
    gsap.fromTo(heading, { y: '105%' }, { y: '0%', duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: heading.parentElement, start: 'top 80%' }});
  });

  document.querySelectorAll('.reveal-up').forEach(el => {
    gsap.to(el, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 85%' }});
  });

  ScrollTrigger.create({
    trigger: '#about', start: 'top bottom', end: 'bottom top',
    onUpdate: (self) => { aboutDistortion = self.progress * 3; }
  });

  document.querySelectorAll('.count').forEach(el => {
    const target = parseInt(el.dataset.target);
    ScrollTrigger.create({
      trigger: el, start: 'top 85%', once: true,
      onEnter: () => gsap.to(el, { innerText: target, duration: 2, snap: { innerText: 1 }, ease: 'power2.out' })
    });
  });
  
  ScrollTrigger.create({
  trigger: document.body,
  start: 'top top',
  end: 'bottom bottom',
  onUpdate: (self) => {
    // self.getVelocity() grabs the exact pixel-per-second scroll speed
    if (bg) {
      bg.setVelocity(self.getVelocity());
    }
  }
});
  
  // Interactive tilts
  document.querySelectorAll('.service-card, .work-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const rotateX = (e.clientY - rect.top - rect.height/2) / (rect.height/2) * -3;
      const rotateY = (e.clientX - rect.left - rect.width/2) / (rect.width/2) * 3;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    });
    card.addEventListener('mouseleave', () => card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)');
  });
}

// ============================================
// FORM HANDLING (EmailJS)
// ============================================
// Initialize with your Public Key
emailjs.init("e332wp9Fw0c-tfmqq"); // <-- Replace with your actual public key

const contactForm = document.getElementById('contactForm');
const submitBtn = document.getElementById('submitBtn');

if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // UX: Change button text while sending
    const originalText = submitBtn.innerText;
    submitBtn.innerText = "Sending...";
    submitBtn.style.pointerEvents = "none"; // Prevent double clicks

    // Send the form
    emailjs.sendForm(
      'service_9eou85q',
      'template_3m2b5gu',
      contactForm
    )
    .then(() => {
      // Success
      submitBtn.innerText = "Message Sent!";
      contactForm.reset();
      
      // Reset button after 3 seconds
      setTimeout(() => {
        submitBtn.innerText = originalText;
        submitBtn.style.pointerEvents = "auto";
      }, 3000);
    })
    .catch((error) => {
      // Error
      console.error('EmailJS Error:', error);
      submitBtn.innerText = "Failed to Send";
      
      setTimeout(() => {
        submitBtn.innerText = originalText;
        submitBtn.style.pointerEvents = "auto";
      }, 3000);
    });
  });
}

// ============================================
// INIT & RESIZE HANDLING
// ============================================
window.addEventListener('resize', () => {
  if (heroRenderer && heroCamera) {
    heroRenderer.setSize(window.innerWidth, window.innerHeight);
    heroCamera.aspect = window.innerWidth / window.innerHeight;
    heroCamera.updateProjectionMatrix();
  }
});

// Boot up everything
initPreloader();
initHero();
initAbout();
initMiniCanvases();
initScrollAnimations();