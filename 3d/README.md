# 🛸 Reusable 3D Drone Viewer Setup Guide

Easily add this interactive 3D Drone Viewer to **any website or application** with full customization.

---

## 📁 Files Needed for Integration

Copy these files to your new website project:

1. `droneData.js` — Contains the 3D GLB Drone model data.
2. `DroneViewer.js` — The reusable 3D Viewer module class.
3. `three.min.js`, `GLTFLoader.js`, `OrbitControls.js` (Loaded via CDN script tags).

---

## 🚀 How to Add to Any HTML Page

### Step 1: Add a Container Element
Place an HTML container anywhere in your HTML page where you want the drone to appear:

```html
<div id="my-drone-container" style="width: 100%; height: 500px;"></div>
```

---

### Step 2: Include the Script Tags
Add these scripts before the closing `</body>` tag of your HTML file:

```html
<!-- 1. Three.js Libraries -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>

<!-- 2. Drone Model & Viewer Module -->
<script src="droneData.js"></script>
<script src="DroneViewer.js"></script>

<!-- 3. Initialize the Drone -->
<script>
  document.addEventListener('DOMContentLoaded', () => {
    const drone = new DroneViewer({
      container: 'my-drone-container', // Container ID
      rotationSpeed: 0.1,              // Slow rotation speed (left to right)
      enableZoom: false,               // Disable/Enable mouse zoom (true/false)
      hoverEnabled: true,              // Floating hover animation (true/false)
      scaleFactor: 5.0,                // Model size
      position: { x: 0, y: 0, z: 0 },  // Position coordinates (X, Y, Z)
      cameraPos: { x: 5.1, y: 2.7, z: 6.3 } // Camera angle & distance
    });
  });
</script>
```

---

## 🛠️ Configuration Options

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `container` | `String` / `Element` | `'canvas-container'` | HTML container ID or element |
| `rotationSpeed` | `Number` | `0.1` | Speed of left-to-right rotation (`0` to stop) |
| `enableZoom` | `Boolean` | `false` | Enable/Disable mouse scroll zoom |
| `hoverEnabled` | `Boolean` | `true` | Enable/Disable floating hover animation |
| `scaleFactor` | `Number` | `5.0` | Size scale factor of the drone model |
| `position` | `Object` | `{ x: 0, y: 0, z: 0 }` | 3D Coordinates `(X, Y, Z)` |
| `cameraPos` | `Object` | `{ x: 5.1, y: 2.7, z: 6.3 }` | Camera distance & view angle |

---

## ⚡ Dynamic Runtime Methods

You can change settings dynamically anytime via JavaScript:

```javascript
// Change position dynamically
drone.setPosition(1.5, 0, 0);

// Change rotation speed
drone.setRotationSpeed(0.2);

// Enable zoom
drone.setZoomEnabled(true);
```
