import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export default class HeroScene {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.z = 5;

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Post-Processing: Setup the Neon Bloom
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    bloomPass.strength = 1.2; // Intensity of the glow
    bloomPass.radius = 0.5;   // Spread of the glow
    bloomPass.threshold = 0.1; 
    this.composer.addPass(bloomPass);

    this.isMobile = window.innerWidth < 768;
    this.mouseX = 0;
    this.mouseY = 0;

    this.initObjects();
    this.addEventListeners();
    this.animate();
  }

  initObjects() {
    const detail = this.isMobile ? [2, 3, 64, 16] : [2, 3, 128, 32];
    const geometry = new THREE.TorusKnotGeometry(1.5, 0.5, detail[2], detail[3]);
    
    // Changed to Cyan for maximum glow impact
    const material = new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true });
    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);

    // Subtle background dust
    const count = this.isMobile ? 200 : 600;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 20;
    }
    
    const particlesGeo = new THREE.BufferGeometry();
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particlesMat = new THREE.PointsMaterial({ color: 0x333333, size: 0.02 });
    this.particles = new THREE.Points(particlesGeo, particlesMat);
    this.scene.add(this.particles);
  }

  addEventListeners() {
    window.addEventListener('mousemove', (e) => {
      this.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    window.addEventListener('resize', () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.composer.setSize(window.innerWidth, window.innerHeight);
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    });
  }

  animate = () => {
    this.mesh.rotation.x += 0.003 + (this.mouseY * 0.003);
    this.mesh.rotation.y += 0.005 + (this.mouseX * 0.003);
    this.particles.rotation.y += 0.0003;
    
    // Using composer to render the bloom effect
    this.composer.render();
    requestAnimationFrame(this.animate);
  }
}