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

    this.mouseX = 0;
    this.mouseY = 0;
    this.scrollVelocity = 0;

    this.initStars();
    this.addEventListeners();
    this.animate();
  }

  initStars() {
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 1500;
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 20;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.015,
      color: 0xffffff,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });

    this.particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    this.scene.add(this.particlesMesh);
  }

  addEventListeners() {
    // Desktop mouse
    window.addEventListener('mousemove', (e) => {
      this.mouseX = (e.clientX / window.innerWidth) - 0.5;
      this.mouseY = (e.clientY / window.innerHeight) - 0.5;
    });

    // Gyroscope setup
    this._setupGyro();

    // Resize
    window.addEventListener('resize', () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    });
  }

  _onDeviceOrientation(e) {
    // Gamma = left/right tilt, Beta = front/back tilt
    const clampedGamma = Math.min(Math.max(e.gamma || 0, -45), 45);
    const clampedBeta  = Math.min(Math.max((e.beta  || 0) - 60, -45), 45);
    this.mouseX =  clampedGamma / 45;
    this.mouseY = -(clampedBeta  / 45);
  }

  _setupGyro() {
    if (typeof DeviceOrientationEvent === 'undefined') return;

    // iOS 13+ requires explicit permission via a user gesture
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      // Show a small banner prompting the user to enable gyro
      const banner = document.createElement('div');
      banner.id = 'gyro-banner';
      banner.innerHTML = '<span>Tap to enable gyroscope</span>';
      Object.assign(banner.style, {
        position: 'fixed',
        bottom: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(255,255,255,0.07)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.15)',
        color: '#fff',
        fontSize: '0.75rem',
        letterSpacing: '0.1em',
        padding: '10px 22px',
        borderRadius: '999px',
        cursor: 'pointer',
        zIndex: '9999',
        opacity: '0',
        transition: 'opacity 0.5s ease',
        pointerEvents: 'auto',
        textTransform: 'uppercase',
      });

      document.body.appendChild(banner);

      // Fade in after a short delay so it doesn't flash on desktop
      setTimeout(() => { banner.style.opacity = '1'; }, 2000);

      banner.addEventListener('click', () => {
        DeviceOrientationEvent.requestPermission()
          .then(state => {
            if (state === 'granted') {
              window.addEventListener('deviceorientation', (e) => this._onDeviceOrientation(e));
            }
            banner.style.opacity = '0';
            setTimeout(() => banner.remove(), 600);
          })
          .catch(() => {
            banner.style.opacity = '0';
            setTimeout(() => banner.remove(), 600);
          });
      });

    } else {
      // Android and non-permission browsers — just listen directly
      window.addEventListener('deviceorientation', (e) => this._onDeviceOrientation(e));
    }
  }

  setVelocity(velocity) {
    this.scrollVelocity = velocity * 0.0005;
  }

  animate = () => {
    // Constant slow drift
    this.particlesMesh.rotation.y += 0.0003 + Math.abs(this.scrollVelocity);
    this.particlesMesh.rotation.x += 0.0001 + (this.scrollVelocity * 0.5);

    // Smooth parallax (mouse on desktop, gyro on mobile)
    this.particlesMesh.position.x += (this.mouseX * 0.5  - this.particlesMesh.position.x) * 0.05;
    this.particlesMesh.position.y += (-this.mouseY * 0.5 - this.particlesMesh.position.y) * 0.05;

    // Dampen scroll velocity
    this.scrollVelocity *= 0.9;

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate);
  }
}
