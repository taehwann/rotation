function createScene(canvasId, createMeshFn) {
    const canvas = document.getElementById(canvasId);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
  
    const camera = new THREE.PerspectiveCamera(45, 2, 0.1, 100);
    camera.position.z = 5;
  
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(2, 2, 5);
    scene.add(light);
  
    const mesh = createMeshFn();
    scene.add(mesh);
  
    function resize() {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
  
    window.addEventListener('resize', resize);
    resize();
  
    function animate() {
      requestAnimationFrame(animate);
      mesh.rotation.x += 0.01;
      mesh.rotation.y += 0.01;
      renderer.render(scene, camera);
    }
  
    animate();
  }
  
  // Cube scene
  createScene('three1', () => {
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshStandardMaterial({ color: 0x6699ff });
    return new THREE.Mesh(geometry, material);
  });
  
  // Torus scene
  createScene('three2', () => {
    const geometry = new THREE.TorusGeometry(1, 0.4, 16, 100);
    const material = new THREE.MeshPhongMaterial({ color: 0xff6699 });
    return new THREE.Mesh(geometry, material);
  });
  