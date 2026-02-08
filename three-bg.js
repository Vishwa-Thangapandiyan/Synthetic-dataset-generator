/**
 * three-bg.js — Three.js background for Synth Data
 * Subtle particle field + abstract geometry. Runs in requestAnimationFrame
 * with low poly count so it doesn't block UI or scroll.
 */
(function () {
  'use strict';

  var container = document.getElementById('three-container');
  if (!container) return;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
  var renderer = null;
  var particles = null;
  var frameId = null;

  // Colors aligned with CSS (cyan / blue / violet)
  var colorCyan = new THREE.Color(0x5ddfff);
  var colorViolet = new THREE.Color(0xa78bfa);

  function init() {
    var width = container.clientWidth;
    var height = container.clientHeight;

    renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    camera.position.z = 12;

    // Particle system: small dots in 3D space
    var particleCount = 1200;
    var geometry = new THREE.BufferGeometry();
    var positions = new Float32Array(particleCount * 3);

    for (var i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 40;
      positions[i + 1] = (Math.random() - 0.5) * 40;
      positions[i + 2] = (Math.random() - 0.5) * 25;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.computeBoundingSphere();

    var material = new THREE.PointsMaterial({
      color: colorCyan,
      size: 0.08,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Optional: subtle wireframe grid in background (very low poly)
    var gridGeo = new THREE.BufferGeometry();
    var gridPos = [];
    var step = 4;
    for (var x = -20; x <= 20; x += step) {
      gridPos.push(x, -20, -8, x, 20, -8);
    }
    for (var y = -20; y <= 20; y += step) {
      gridPos.push(-20, y, -8, 20, y, -8);
    }
    gridGeo.setAttribute('position', new THREE.Float32BufferAttribute(gridPos, 3));
    gridGeo.setDrawRange(0, gridPos.length / 3);
    var gridMat = new THREE.LineBasicMaterial({
      color: 0x63b3ed,
      transparent: true,
      opacity: 0.06
    });
    var grid = new THREE.LineSegments(gridGeo, gridMat);
    scene.add(grid);

    window.addEventListener('resize', onResize);
    onResize();
  }

  function onResize() {
    if (!container || !renderer) return;
    var width = container.clientWidth;
    var height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  function animate() {
    frameId = requestAnimationFrame(animate);

    if (particles && particles.rotation) {
      particles.rotation.y += 0.00035;
      particles.rotation.x += 0.0001;
    }

    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  }

  function start() {
    if (!renderer) init();
    if (frameId === null) animate();
  }

  function stop() {
    if (frameId !== null) {
      cancelAnimationFrame(frameId);
      frameId = null;
    }
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  // Expose for optional pause when tab hidden (save battery)
  window.synthDataThree = { start: start, stop: stop };
})();
