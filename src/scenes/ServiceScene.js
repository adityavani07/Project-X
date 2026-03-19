import * as THREE from 'three';

export default class ServiceScene {
  constructor(cardElement) {
    this.card = cardElement;
    this.canvas = cardElement.querySelector('.service-canvas');
    this.shape = cardElement.dataset.shape;
    
    if (!this.canvas) return;

    this.isMobile = window.innerWidth < 768;
    this.hovered = false;

    this.initScene();
    this.addEventListeners();
    this.animate();
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    this.camera.position.z = 3;

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true });
    this.renderer.setSize(60, 60);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    let geometry;
    const seg = this.isMobile ? 8 : 16;
    
    // Check the HTML data-shape attribute to render the right object
    switch (this.shape) {
      case 'box': 
        geometry = new THREE.BoxGeometry(1, 1, 1); 
        break;
      case 'sphere': 
        geometry = new THREE.SphereGeometry(0.7, seg, seg); 
        break;
      case 'cone': 
        geometry = new THREE.ConeGeometry(0.7, 1.2, seg); 
        break;
      case 'torus': 
        geometry = new THREE.TorusGeometry(0.6, 0.25, seg, seg * 2); 
        break;
      default:
        geometry = new THREE.BoxGeometry(1, 1, 1);
    }

    const material = new THREE.MeshBasicMaterial({ color: 0x666666, wireframe: true });
    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);
  }

  addEventListeners() {
    this.card.addEventListener('mouseenter', () => this.hovered = true);
    this.card.addEventListener('mouseleave', () => this.hovered = false);
  }

  animate = () => {
    // Spin faster when the user hovers over the card
    const speed = this.hovered ? 0.03 : 0.01;
    this.mesh.rotation.x += speed;
    this.mesh.rotation.y += speed * 1.3;

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate);
  }
}