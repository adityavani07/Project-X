import * as THREE from 'three';

export default class WorkScene {
  constructor(cardElement) {
    this.card = cardElement;
    this.canvas = cardElement.querySelector('.work-canvas');
    this.visual = cardElement.querySelector('.work-visual');
    this.shape = cardElement.dataset.workShape;
    this.isMobile = window.innerWidth < 768;

    if (!this.canvas || !this.visual) return;

    this.initScene();
    this.addEventListeners();
    this.animate();
  }

  initScene() {
    this.scene = new THREE.Scene();
    // 16/10 aspect ratio to match your CSS aspect-ratio
    this.camera = new THREE.PerspectiveCamera(50, 16 / 10, 0.1, 100);
    this.camera.position.z = 3;

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true });
    
    // Get initial dimensions from the parent container
    const rect = this.visual.getBoundingClientRect();
    this.renderer.setSize(rect.width || 400, rect.height || 250);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Map the dataset shape to Three.js Geometries
    let geometry;
    const seg = this.isMobile ? 1 : 2;
    switch (this.shape) {
      case 'icosa': geometry = new THREE.IcosahedronGeometry(1, seg); break;
      case 'octa': geometry = new THREE.OctahedronGeometry(1, seg); break;
      case 'torusknot': geometry = new THREE.TorusKnotGeometry(0.7, 0.3, this.isMobile ? 32 : 64, 8); break;
      case 'dodeca': geometry = new THREE.DodecahedronGeometry(1, seg); break;
      default: geometry = new THREE.BoxGeometry(1, 1, 1);
    }

    const material = new THREE.MeshBasicMaterial({ color: 0x555555, wireframe: true });
    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);

    this.hovered = false;
  }

  addEventListeners() {
    // Speed up rotation on hover
    this.card.addEventListener('mouseenter', () => this.hovered = true);
    this.card.addEventListener('mouseleave', () => this.hovered = false);

    // Watch the container for size changes (crucial for grid layouts)
    this.resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        if (width && height) {
          this.renderer.setSize(width, height);
          this.camera.aspect = width / height;
          this.camera.updateProjectionMatrix();
        }
      }
    });
    
    this.resizeObserver.observe(this.visual);
  }

  animate = () => {
    // Dynamic speed based on hover state
    const speed = this.hovered ? 0.04 : 0.008;
    this.mesh.rotation.x += speed;
    this.mesh.rotation.y += speed * 1.2;

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate);
  }
}