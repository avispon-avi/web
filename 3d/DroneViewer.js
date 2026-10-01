/* ==========================================================================
   REUSABLE 3D DRONE VIEWER MODULE (DroneViewer.js)
   --------------------------------------------------------------------------
   Easily drop this 3D Drone Viewer into ANY website!
   ========================================================================== */

class DroneViewer {
  constructor(options = {}) {
    // Configuration & Defaults
    this.container = typeof options.container === 'string' 
      ? document.getElementById(options.container) 
      : (options.container || document.getElementById('canvas-container'));

    if (!this.container) {
      console.error('DroneViewer: Target container element not found!');
      return;
    }

    this.glbData = options.glbData || window.DRONE_GLB_DATA;
    if (!this.glbData) {
      console.error('DroneViewer: GLB Data (window.DRONE_GLB_DATA) missing!');
      return;
    }

    // Custom Options with Defaults
    this.options = {
      enableZoom: options.enableZoom ?? false,
      rotationSpeed: options.rotationSpeed ?? 0.1, // Slow left-to-right rotation
      hoverEnabled: options.hoverEnabled ?? true,
      scaleFactor: options.scaleFactor ?? 5.0,
      position: options.position || { x: 0, y: 0, z: 0 },
      cameraPos: options.cameraPos || { x: 5.1, y: 2.7, z: 6.3 },
      accentColor1: options.accentColor1 || 0x00f3ff,
      accentColor2: options.accentColor2 || 0x0066ff,
      onLoaded: options.onLoaded || null
    };

    // Internal Properties
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.pivotGroup = null;
    this.droneModel = null;
    this.propellers = [];
    this.clock = new THREE.Clock();
    this.animationFrameId = null;

    // Initialize
    this.init();
  }

  init() {
    // 1. Create Scene
    this.scene = new THREE.Scene();

    // 2. Setup Camera
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 100);
    this.camera.position.set(this.options.cameraPos.x, this.options.cameraPos.y, this.options.cameraPos.z);

    // 3. Setup Renderer (Transparent Background)
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.container.appendChild(this.renderer.domElement);

    // 4. Orbit Controls
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enableZoom = this.options.enableZoom; // Enabled/Disabled Zoom
    this.controls.maxPolarAngle = Math.PI / 2 + 0.1;
    this.controls.target.set(0, 0, 0);

    // 5. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
    keyLight.position.set(5, 8, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0001;
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x80b3ff, 0.6);
    fillLight.position.set(-5, -2, -4);
    this.scene.add(fillLight);

    const accentLight1 = new THREE.PointLight(this.options.accentColor1, 3, 12);
    accentLight1.position.set(2, 2, 2);
    this.scene.add(accentLight1);

    const accentLight2 = new THREE.PointLight(this.options.accentColor2, 2.5, 12);
    accentLight2.position.set(-2, -1, -2);
    this.scene.add(accentLight2);

    // Ground Shadow Plane
    const shadowPlaneGeo = new THREE.PlaneGeometry(20, 20);
    const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.35 });
    const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -1.2;
    shadowPlane.receiveShadow = true;
    this.scene.add(shadowPlane);

    // Resize Handler
    window.addEventListener('resize', () => this.onWindowResize());

    // Load Model Data
    this.loadModel();
  }

  loadModel() {
    const loader = new THREE.GLTFLoader();

    fetch(this.glbData)
      .then(res => res.arrayBuffer())
      .then(buffer => {
        loader.parse(buffer, '', (gltf) => {
          this.droneModel = gltf.scene;

          // Center Pivot Geometry
          const box = new THREE.Box3().setFromObject(this.droneModel);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());

          this.droneModel.position.x = -center.x;
          this.droneModel.position.y = -center.y;
          this.droneModel.position.z = -center.z;

          this.pivotGroup = new THREE.Group();
          this.pivotGroup.add(this.droneModel);

          // Apply Scaling & Custom Position with Fly-In Entrance State
          const maxDim = Math.max(size.x, size.y, size.z);
          this.targetScale = this.options.scaleFactor / maxDim;
          
          // Initial Entrance Animation Parameters
          this.introProgress = 0;
          this.introDuration = 1.8; // 1.8 seconds entrance duration
          
          this.pivotGroup.scale.set(0.001, 0.001, 0.001); // Start small
          this.pivotGroup.position.set(
            this.options.position.x + 1.5, 
            this.options.position.y + 2.5, 
            this.options.position.z - 2.0
          );
          this.pivotGroup.baseY = this.options.position.y;

          this.scene.add(this.pivotGroup);

          // Detect Propellers
          this.propellers = [];
          this.droneModel.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              if (child.material) {
                child.material.metalness = Math.max(child.material.metalness, 0.4);
                child.material.roughness = Math.min(child.material.roughness, 0.5);
              }
            }
            if (child.name.toLowerCase().includes('prop') || child.name.toLowerCase().includes('rotor')) {
              this.propellers.push(child);
            }
          });

          // Callback when ready
          if (typeof this.options.onLoaded === 'function') {
            this.options.onLoaded();
          }

          // Start Render Loop
          this.animate();
        }, (err) => console.error('DroneViewer: Error parsing GLTF:', err));
      })
      .catch(err => console.error('DroneViewer: Error loading model data:', err));
  }

  animate() {
    this.animationFrameId = requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    if (this.pivotGroup) {
      // Entrance Fly-In Interpolation
      if (this.introProgress < 1) {
        this.introProgress += delta / this.introDuration;
        const t = Math.min(1, this.introProgress);
        // Ease Out Cubic function for smooth deceleration
        const easeT = 1 - Math.pow(1 - t, 3);
        
        // Scale Fly-In
        const currentScale = this.targetScale * easeT;
        this.pivotGroup.scale.set(currentScale, currentScale, currentScale);

        // Position Fly-In
        const startX = this.options.position.x + 1.5;
        const startY = this.options.position.y + 2.5;
        const startZ = this.options.position.z - 2.0;

        const targetY = this.pivotGroup.baseY + (this.options.hoverEnabled ? Math.sin(elapsedTime * 2.0) * 0.12 : 0);

        this.pivotGroup.position.x = startX * (1 - easeT) + this.options.position.x * easeT;
        this.pivotGroup.position.y = startY * (1 - easeT) + targetY * easeT;
        this.pivotGroup.position.z = startZ * (1 - easeT) + this.options.position.z * easeT;
      } else {
        // 1. Slow left-to-right Y rotation
        if (this.options.rotationSpeed) {
          this.pivotGroup.rotation.y += delta * this.options.rotationSpeed;
        }

        // 2. Hover Floating animation
        if (this.options.hoverEnabled) {
          this.pivotGroup.position.y = this.pivotGroup.baseY + Math.sin(elapsedTime * 2.0) * 0.12;
          this.pivotGroup.rotation.z = Math.sin(elapsedTime * 1.5) * 0.025;
          this.pivotGroup.rotation.x = Math.cos(elapsedTime * 1.2) * 0.015;
        }
      }
    }

    // 3. Rotate Propellers
    if (this.propellers.length > 0) {
      const propSpeed = (this.introProgress < 1) ? 55 : 35;
      this.propellers.forEach(prop => {
        prop.rotation.y += delta * propSpeed;
      });
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  // Helper Methods for Custom Controls
  setPosition(x, y, z) {
    if (this.pivotGroup) {
      this.pivotGroup.position.set(x, y, z);
      this.pivotGroup.baseY = y;
    }
  }

  setRotationSpeed(speed) {
    this.options.rotationSpeed = speed;
  }

  setZoomEnabled(enabled) {
    this.options.enableZoom = enabled;
    if (this.controls) this.controls.enableZoom = enabled;
  }

  destroy() {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.remove();
    }
  }
}

// Export for module systems or global window object
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DroneViewer;
} else {
  window.DroneViewer = DroneViewer;
}
