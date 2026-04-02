import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import WorkScene from './scenes/WorkScene';
import emailjs from '@emailjs/browser';
import BackgroundScene from './scenes/BackgroundScene';

gsap.registerPlugin(ScrollTrigger);

const bg = new BackgroundScene('bg-canvas');

// ============================================
// GLOBAL STATE
// ============================================
let mouseX = 0, mouseY = 0;
const isMobile = window.innerWidth < 768;
let heroMesh = null;

document.addEventListener('mousemove', (e) => {
  mouseX = (e.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
});

// ============================================
// AUDIO & SOUND DESIGN
// ============================================
const soundToggle = document.getElementById('soundToggle');
const bgMusic = new Audio('/sounds/ambient-loop.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.1;
const hoverSound = new Audio('/sounds/hover.mp3');
hoverSound.volume = 0.9;
let isSoundActive = false;

let lastMouseMoveTime = 0;
window.addEventListener('mousemove', () => { lastMouseMoveTime = Date.now(); });

if (soundToggle) {
  soundToggle.addEventListener('click', () => {
    isSoundActive = !isSoundActive;
    if (isSoundActive) {
      const p = bgMusic.play();
      if (p !== undefined) p.catch(e => console.error('Audio block:', e));
      soundToggle.innerText = 'Sound: On';
      soundToggle.style.color = 'var(--white)';
    } else {
      bgMusic.pause();
      soundToggle.innerText = 'Sound: Off';
      soundToggle.style.color = 'var(--grey)';
    }
  });
}

document.querySelectorAll('a, button, .hoverable, .work-card, .service-card').forEach(el => {
  if (el.id === 'soundToggle') return;
  el.addEventListener('mouseenter', () => {
    if (isSoundActive && (Date.now() - lastMouseMoveTime) < 100) {
      hoverSound.currentTime = 0;
      hoverSound.play().catch(() => {});
    }
  });
});

document.addEventListener('contextmenu', (e) => { if (e.target.tagName === 'IMG') e.preventDefault(); });
document.addEventListener('dragstart',    (e) => { if (e.target.tagName === 'IMG') e.preventDefault(); });

// ============================================
// CUSTOM SMOOTH SCROLL
// ============================================
document.querySelectorAll('a[data-target]').forEach(link => {
  link.addEventListener('click', () => {
    const targetSection = document.querySelector(link.getAttribute('data-target'));
    if (targetSection) {
      targetSection.scrollIntoView({ behavior: 'smooth' });
      if (hamburger && mobileNav) {
        hamburger.classList.remove('open');
        mobileNav.classList.remove('open');
      }
    }
  });
});

// ============================================
// CUSTOM CURSOR WITH VELOCITY STRETCH
// ============================================
const cursor    = document.getElementById('cursor');
const cursorDot = document.getElementById('cursorDot');
let cursorX = 0, cursorY = 0, dotX = 0, dotY = 0;
let targetX = 0, targetY = 0, prevX = 0, prevY = 0;
let velX = 0, velY = 0;

if (!('ontouchstart' in window)) {
  document.addEventListener('mousemove', (e) => {
    prevX = targetX; prevY = targetY;
    targetX = e.clientX; targetY = e.clientY;
    velX = targetX - prevX;
    velY = targetY - prevY;
  });

  function animateCursor() {
    cursorX += (targetX - cursorX) * 0.12;
    cursorY += (targetY - cursorY) * 0.12;
    dotX   += (targetX - dotX)    * 0.6;
    dotY   += (targetY - dotY)    * 0.6;

    const speed   = Math.sqrt(velX * velX + velY * velY);
    const stretch = Math.min(1 + speed * 0.045, 2.5);
    const angle   = Math.atan2(velY, velX) * (180 / Math.PI);

    cursor.style.transform    = `translate(${cursorX}px,${cursorY}px) translate(-50%,-50%) rotate(${angle}deg) scaleX(${stretch})`;
    cursorDot.style.transform = `translate(${dotX}px,${dotY}px) translate(-50%,-50%)`;

    velX *= 0.72; velY *= 0.72;
    requestAnimationFrame(animateCursor);
  }

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
// CURSOR PARTICLE TRAIL
// ============================================
function initCursorTrail() {
  if ('ontouchstart' in window) return;
  let lastSpawn = 0;
  document.addEventListener('mousemove', (e) => {
    const now = Date.now();
    if (now - lastSpawn < 55) return;
    lastSpawn = now;
    const p = document.createElement('div');
    p.className = 'cursor-particle';
    p.style.left = e.clientX + 'px';
    p.style.top  = e.clientY + 'px';
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 750);
  });
}

// ============================================
// TEXT SCRAMBLE ON SCROLL
// ============================================
function initTextScramble() {
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#&*';
  function scramble(el) {
    const original = el.textContent;
    let iteration = 0;
    clearInterval(el._scramble);
    el._scramble = setInterval(() => {
      el.textContent = original.split('').map((char, i) => {
        if (char === ' ') return ' ';
        if (i < iteration) return original[i];
        return CHARS[Math.floor(Math.random() * CHARS.length)];
      }).join('');
      iteration += 0.45;
      if (iteration > original.length) {
        el.textContent = original;
        clearInterval(el._scramble);
      }
    }, 35);
  }

  document.querySelectorAll('.heading-inner').forEach(el => {
    ScrollTrigger.create({
      trigger: el, start: 'top 85%', once: true,
      onEnter: () => scramble(el),
    });
  });
}

// ============================================
// MAGNETIC BUTTONS
// ============================================
function initMagnetic() {
  document.querySelectorAll('.nav-links a, .submit-btn, .back-to-top').forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      gsap.to(el, {
        x: (e.clientX - (rect.left + rect.width  / 2)) * 0.3,
        y: (e.clientY - (rect.top  + rect.height / 2)) * 0.3,
        duration: 0.4, ease: 'power2.out',
      });
    });
    el.addEventListener('mouseleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' });
    });
  });
}

// ============================================
// WORK CARD HOVER OVERLAYS
// ============================================
function initWorkOverlays() {
  document.querySelectorAll('.work-card').forEach(card => {
    const visual = card.querySelector('.work-visual');
    if (!visual) return;
    const overlay = document.createElement('div');
    overlay.className = 'work-overlay';
    overlay.innerHTML = '<span class="work-overlay-label">View Project</span>';
    visual.appendChild(overlay);
  });
}

// ============================================
// UI INTERACTIONS (Nav, hamburger, back-to-top)
// ============================================
const hamburger   = document.getElementById('hamburger');
const mobileNav   = document.getElementById('mobileNav');
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
const navbar        = document.getElementById('navbar');
const scrollProgress = document.getElementById('scroll-progress');
window.addEventListener('scroll', () => {
  const s = window.pageYOffset;
  navbar.classList.toggle('scrolled', s > 100);
  navbar.classList.toggle('hidden', s > lastScroll && s > 300);
  lastScroll = s;
  if (scrollProgress) {
    const pct = s / (document.body.scrollHeight - window.innerHeight);
    scrollProgress.style.transform = `scaleX(${Math.min(pct, 1)})`;
  }
});

document.getElementById('backToTop').addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ============================================
// THREE.JS: PRELOADER
// ============================================
function initPreloader() {
  const canvas = document.getElementById('preloader-canvas');
  if (!canvas) return;
  const scene    = new THREE.Scene();
  const camera   = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.z = 3;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(200, 200);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const geometry = new THREE.IcosahedronGeometry(1, 1);
  const material = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
  const mesh     = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  let active = true;
  function animateLoader() {
    if (!active) return;
    mesh.rotation.x += 0.01;
    mesh.rotation.y += 0.015;
    renderer.render(scene, camera);
    requestAnimationFrame(animateLoader);
  }
  animateLoader();
  document.body.style.overflow = 'hidden';

  gsap.to('#preloaderText span', {
    opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power3.out', delay: 0.3,
  });

  let progress = { val: 0 };
  gsap.to(progress, {
    val: 100, duration: 2.5, ease: 'power2.inOut',
    onUpdate: () => { document.getElementById('preloaderPercent').textContent = Math.round(progress.val); },
    onComplete: () => {
      setTimeout(() => {
        document.getElementById('preloader').classList.add('done');
        document.body.style.overflow = 'auto';
        setTimeout(animateHeroContent, 600);
        setTimeout(() => {
          active = false;
          document.getElementById('preloader')?.remove();
          geometry.dispose(); material.dispose(); renderer.dispose();
        }, 1500);
      }, 400);
    },
  });
}

// ============================================
// THREE.JS: HERO SCENE
// ============================================
let heroRenderer, heroCamera;
function initHero() {
  const canvas = document.getElementById('hero-canvas');
  const scene  = new THREE.Scene();
  heroCamera   = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  heroCamera.position.z = 5;
  heroRenderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  heroRenderer.setSize(window.innerWidth, window.innerHeight);
  heroRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const detail   = isMobile ? [2, 3, 64, 16] : [2, 3, 128, 32];
  const geometry = new THREE.TorusKnotGeometry(1.5, 0.5, detail[2], detail[3]);
  const material = new THREE.MeshBasicMaterial({ color: 0x444444, wireframe: true });
  heroMesh = new THREE.Mesh(geometry, material);
  scene.add(heroMesh);

  const count     = isMobile ? 200 : 600;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i++) positions[i] = (Math.random() - 0.5) * 20;
  const pgeo = new THREE.BufferGeometry();
  pgeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(pgeo, new THREE.PointsMaterial({ color: 0x333333, size: 0.02 }));
  scene.add(particles);

  function animate() {
    heroMesh.rotation.x += 0.003 + mouseY * 0.003;
    heroMesh.rotation.y += 0.005 + mouseX * 0.003;
    particles.rotation.y += 0.0003;
    heroRenderer.render(scene, heroCamera);
    requestAnimationFrame(animate);
  }
  animate();
}

function animateHeroContent() {
  gsap.to('.hero-label',    { opacity: 1, y: 0, duration: 1,   ease: 'power3.out' });
  gsap.to('.hero-title',    { opacity: 1, y: 0, duration: 1.2, delay: 0.2, ease: 'power3.out' });
  gsap.to('.hero-subtitle', { opacity: 1, y: 0, duration: 1,   delay: 0.5, ease: 'power3.out' });
  gsap.to('.scroll-indicator', { opacity: 1, duration: 1, delay: 1, ease: 'power2.out' });
}

// ============================================
// THREE.JS: SELECTED WORK SCENES
// ============================================
document.querySelectorAll('.work-card').forEach(card => new WorkScene(card));

// ============================================
// THREE.JS: ABOUT SCENE
// ============================================
let aboutDistortion = 0;
function initAbout() {
  const canvas   = document.getElementById('about-canvas');
  const scene    = new THREE.Scene();
  const camera   = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.z = 3.5;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(isMobile ? 250 : 500, isMobile ? 250 : 500);

  const detail   = isMobile ? 24 : 64;
  const geometry = new THREE.SphereGeometry(1.3, detail, detail);
  const material = new THREE.MeshBasicMaterial({ color: 0x666666, wireframe: true });
  const mesh     = new THREE.Mesh(geometry, material);
  scene.add(mesh);
  const orig = geometry.attributes.position.array.slice();

  function animate() {
    const t   = performance.now() * 0.001;
    const pos = geometry.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      const [ox, oy, oz] = [orig[i], orig[i+1], orig[i+2]];
      const noise  = Math.sin(ox*3+t) * Math.cos(oy*3+t) * Math.sin(oz*3+t*0.5);
      const factor = 1 + noise * aboutDistortion * 0.25;
      pos[i] = ox*factor; pos[i+1] = oy*factor; pos[i+2] = oz*factor;
    }
    geometry.attributes.position.needsUpdate = true;
    mesh.rotation.y += 0.005; mesh.rotation.x += 0.002;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();
}

// ============================================
// THREE.JS: SERVICE MINI CANVASES
// ============================================
function initMiniCanvases() {
  document.querySelectorAll('.service-card').forEach(card => {
    if (isMobile) { card.classList.add('show-fallback'); return; }
    const canvas = card.querySelector('.service-canvas');
    if (!canvas) return;
    const shape = card.dataset.shape;
    const scene = new THREE.Scene();
    const cam   = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    cam.position.z = 3;
    const ren = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    ren.setSize(60, 60);
    const seg = 16;
    let geo;
    if (shape === 'box')    geo = new THREE.BoxGeometry(1, 1, 1);
    else if (shape === 'sphere') geo = new THREE.SphereGeometry(0.7, seg, seg);
    else if (shape === 'cone')   geo = new THREE.ConeGeometry(0.7, 1.2, seg);
    else                         geo = new THREE.TorusGeometry(0.6, 0.25, seg, seg*2);
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x666666, wireframe: true }));
    scene.add(mesh);
    let hovered = false;
    card.addEventListener('mouseenter', () => hovered = true);
    card.addEventListener('mouseleave', () => hovered = false);
    function animate() {
      mesh.rotation.x += hovered ? 0.03 : 0.01;
      mesh.rotation.y += hovered ? 0.039 : 0.013;
      ren.render(scene, cam);
      requestAnimationFrame(animate);
    }
    animate();
  });
}

// ============================================
// THREE.JS: CONTACT GLOBE
// ============================================
function initContactGlobe() {
  const canvas = document.getElementById('contact-globe-canvas');
  if (!canvas) return;
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.z = 3.5;
  const size = isMobile ? 300 : 500;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(size, size);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const globe = new THREE.Mesh(
    new THREE.SphereGeometry(1.5, 28, 28),
    new THREE.MeshBasicMaterial({ color: 0x2a2a2a, wireframe: true })
  );
  scene.add(globe);

  const inner = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.75, 2),
    new THREE.MeshBasicMaterial({ color: 0x1a1a1a, wireframe: true })
  );
  scene.add(inner);

  function animate() {
    globe.rotation.y += 0.003;
    globe.rotation.x += 0.001;
    inner.rotation.y -= 0.005;
    inner.rotation.z += 0.002;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();
}

// ============================================
// GSAP SCROLL ANIMATIONS
// ============================================
function initScrollAnimations() {
  document.querySelectorAll('.heading-inner').forEach(heading => {
    gsap.fromTo(heading, { y: '105%' }, {
      y: '0%', duration: 1.2, ease: 'power3.out',
      scrollTrigger: { trigger: heading.parentElement, start: 'top 80%' },
    });
  });

  document.querySelectorAll('.reveal-up').forEach(el => {
    gsap.to(el, {
      opacity: 1, y: 0, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
  });

  ScrollTrigger.create({
    trigger: '#about', start: 'top bottom', end: 'bottom top',
    onUpdate: (self) => { aboutDistortion = self.progress * 3; },
  });

  document.querySelectorAll('.count').forEach(el => {
    const target = parseInt(el.dataset.target);
    ScrollTrigger.create({
      trigger: el, start: 'top 85%', once: true,
      onEnter: () => gsap.to(el, { innerText: target, duration: 2, snap: { innerText: 1 }, ease: 'power2.out' }),
    });
  });

  ScrollTrigger.create({
    trigger: document.body, start: 'top top', end: 'bottom bottom',
    onUpdate: (self) => { if (bg) bg.setVelocity(self.getVelocity()); },
  });

  // Hero shape grows and fades as you scroll away
  ScrollTrigger.create({
    trigger: '#hero', start: 'top top', end: 'bottom top',
    scrub: 1,
    onUpdate: (self) => {
      if (!heroMesh) return;
      heroMesh.scale.setScalar(1 + self.progress * 1.3);
      heroMesh.material.transparent = true;
      heroMesh.material.opacity = 1 - self.progress * 0.6;
    },
  });

  // Card 3D tilt on mouse move
  document.querySelectorAll('.service-card, .work-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const rx   = ((e.clientY - rect.top)  / rect.height - 0.5) * -6;
      const ry   = ((e.clientX - rect.left) / rect.width  - 0.5) *  6;
      card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.02)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
    });
  });
}

// ============================================
// FORM HANDLING (EmailJS)
// ============================================
emailjs.init('e332wp9Fw0c-tfmqq');
const contactForm = document.getElementById('contactForm');
const submitBtn   = document.getElementById('submitBtn');

if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const originalText = submitBtn.innerText;
    submitBtn.innerText = 'Sending...';
    submitBtn.style.pointerEvents = 'none';
    emailjs.sendForm('service_9eou85q', 'template_3m2b5gu', contactForm)
      .then(() => {
        submitBtn.innerText = 'Message Sent!';
        contactForm.reset();
        setTimeout(() => { submitBtn.innerText = originalText; submitBtn.style.pointerEvents = 'auto'; }, 3000);
      })
      .catch((err) => {
        console.error('EmailJS Error:', err);
        submitBtn.innerText = 'Failed to Send';
        setTimeout(() => { submitBtn.innerText = originalText; submitBtn.style.pointerEvents = 'auto'; }, 3000);
      });
  });
}

// ============================================
// RESIZE
// ============================================
window.addEventListener('resize', () => {
  if (heroRenderer && heroCamera) {
    heroRenderer.setSize(window.innerWidth, window.innerHeight);
    heroCamera.aspect = window.innerWidth / window.innerHeight;
    heroCamera.updateProjectionMatrix();
  }
});

// ============================================
// SECTION GHOST NUMBERS
// ============================================
function initSectionNumbers() {
  const map = [
    ['#services', '01'],
    ['#work',     '02'],
    ['#team',     '03'],
    ['#contact',  '04'],
  ];
  map.forEach(([sel, num]) => {
    const section = document.querySelector(sel);
    if (!section) return;
    const ghost = document.createElement('div');
    ghost.className = 'section-ghost-num';
    ghost.textContent = num;
    section.insertBefore(ghost, section.firstChild);
  });
}

// ============================================
// BOOT
// ============================================
initPreloader();
initHero();
initAbout();
initMiniCanvases();
initScrollAnimations();
initTextScramble();
initMagnetic();
initCursorTrail();
initWorkOverlays();
initContactGlobe();
initSectionNumbers();

// Active nav highlight via IntersectionObserver
const navLinks = document.querySelectorAll('.nav-links a[data-target]');
const ioObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => {
        link.classList.toggle('active', link.dataset.target === `#${entry.target.id}`);
      });
    }
  });
}, { threshold: 0.35 });
document.querySelectorAll('section[id]').forEach(s => ioObserver.observe(s));
