/* ==========================================================================
   AERO-X 3D DRONE VIEWER INITIALIZATION (app.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize the reusable 3D Drone Viewer module
  window.droneViewerInstance = new DroneViewer({
    container: 'canvas-container',  // Target HTML Container ID
    rotationSpeed: 0.1,             // Slow left-to-right rotation speed
    enableZoom: false,               // Disable mouse zoom
    hoverEnabled: true,             // Floating hover animation
    scaleFactor: 5.0,               // Scale size
    position: { x: 0, y: 0, z: 0 }, // 3D coordinates (X, Y, Z)
    cameraPos: { x: 5.1, y: 2.7, z: 6.3 } // Camera angle & distance
  });
});
