import * as THREE from 'three';

export default class AboutScene {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    this.camera.position.z = 3.5;

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true });
    this.isMobile = window.innerWidth < 768;
    const size = this.isMobile ? 250 : 500;
    this.renderer.setSize(size, size);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.distortion = 0; // Will be updated by GSAP

    this.initObject();
    this.animate();
  }

  initObject() {
    const detail = this.isMobile ? 24 : 64;
    this.geometry = new THREE.SphereGeometry(1.3, detail, detail);
    const material = new THREE.MeshBasicMaterial({ color: 0x666666, wireframe: true });
    this.mesh = new THREE.Mesh(this.geometry, material);
    this.scene.add(this.mesh);

    // Save original vertices to calculate distortion math against
    this.originalPositions = this.geometry.attributes.position.array.slice();
  }

  // Method called by GSAP onUpdate
  setDistortion(value) {
    this.distortion = value;
  }

  animate = () => {
    const time = performance.now() * 0.001;
    const positions = this.geometry.attributes.position.array;

    for (let i = 0; i < positions.length; i += 3) {
      const ox = this.originalPositions[i];
      const oy = this.originalPositions[i + 1];
      const oz = this.originalPositions[i + 2];
      
      const noise = Math.sin(ox * 3 + time) * Math.cos(oy * 3 + time) * Math.sin(oz * 3 + time * 0.5);
      const factor = 1 + noise * this.distortion * 0.25;
      
      positions[i] = ox * factor; 
      positions[i + 1] = oy * factor; 
      positions[i + 2] = oz * factor;
    }
    
    this.geometry.attributes.position.needsUpdate = true;
    this.mesh.rotation.y += 0.005; 
    this.mesh.rotation.x += 0.002;
    
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate);
  }
}