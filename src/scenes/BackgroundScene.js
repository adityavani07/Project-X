import * as THREE from 'three';

export default class BackgroundScene {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.z = 5;

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Variables for mouse tracking
    this.mouseX = 0;
    this.mouseY = 0;

    this.initStars();
    this.addEventListeners();
    this.animate();
  }

  initStars() {
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 1500; // Number of stars
    const posArray = new Float32Array(particlesCount * 3);

    // Randomly scatter stars across a wide 3D space
    for(let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 20;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    
    // Material for the stars
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.015, // Tiny dots
      color: 0xffffff,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending // Gives a slight glowing effect where stars overlap
    });

    this.particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    this.scene.add(this.particlesMesh);
  }

  addEventListeners() {
    // Track normalized mouse coordinates (-0.5 to 0.5)
    window.addEventListener('mousemove', (event) => {
      this.mouseX = (event.clientX / window.innerWidth) - 0.5;
      this.mouseY = (event.clientY / window.innerHeight) - 0.5;
    });

    window.addEventListener('resize', () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    });
  }

  setVelocity(velocity) {
    // We divide by a large number so the math doesn't make it spin out of control
    this.scrollVelocity = velocity * 0.0005; 
  }

  animate = () => {
    // 1. Initialize velocity if it doesn't exist
    if (!this.scrollVelocity) this.scrollVelocity = 0;

    // 2. Add the scroll velocity to the base rotation
    // Math.abs ensures it always spins forward, whether scrolling up or down
    this.particlesMesh.rotation.y += 0.0003 + Math.abs(this.scrollVelocity);
    this.particlesMesh.rotation.x += 0.0001 + (this.scrollVelocity * 0.5);

    // 3. Smooth mouse parallax
    this.particlesMesh.position.x += (this.mouseX * 0.5 - this.particlesMesh.position.x) * 0.05;
    this.particlesMesh.position.y += (-this.mouseY * 0.5 - this.particlesMesh.position.y) * 0.05;

    // 4. Dampen the velocity (friction) so it smoothly slows down when scrolling stops
    this.scrollVelocity *= 0.9;

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate);
  }

  animate = () => {
    // 1. Base constant slow rotation
    this.particlesMesh.rotation.y += 0.0003;
    this.particlesMesh.rotation.x += 0.0001;

    // 2. Smooth parallax effect based on cursor position
    // We use linear interpolation (lerp) for that buttery smooth trailing feel
    this.particlesMesh.position.x += (this.mouseX * 0.5 - this.particlesMesh.position.x) * 0.05;
    this.particlesMesh.position.y += (-this.mouseY * 0.5 - this.particlesMesh.position.y) * 0.05;

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate);
  }
}