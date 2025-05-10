function createScene(canvasId, createMeshFn, updateFn, controlsId, extraSetup = () => {}, animateExtra = () => {}) {
  const canvas = document.getElementById(canvasId);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);

  const camera = new THREE.PerspectiveCamera(45, 2, 0.1, 100);
  camera.position.set(5, 5, 5);
  camera.lookAt(scene.position);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(3, 3, 5);
  scene.add(light);

  const mesh = createMeshFn();
  scene.add(mesh);

  addBaseVectors(scene);
  addBasePlanes(scene);

  const controls = document.getElementById(controlsId);
  const inputs = controls.querySelectorAll('input[type="range"]');
  const context = { scene, mesh, extra: {} };

  extraSetup(context);

  function getParams() {
    const values = {};
    inputs.forEach(input => {
      values[input.name] = parseFloat(input.value);
    });
    return values;
  }

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
    const params = getParams();
    updateFn(mesh, params);
    animateExtra(context, params);
    renderer.render(scene, camera);
  }

  animate();
}

function addBaseVectors(scene) {
  const origin = new THREE.Vector3(0, 0, 0);
  scene.add(new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), origin, 2, 0xff0000)); // X
  scene.add(new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), origin, 2, 0x00ff00)); // Y
  scene.add(new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), origin, 2, 0x0000ff)); // Z
}

function addBasePlanes(scene) {
  const size = 2.5;
  const geo = new THREE.PlaneGeometry(size, size);
  const matXY = new THREE.MeshBasicMaterial({ color: 0xffcccc, side: THREE.DoubleSide, transparent: true, opacity: 0.2 });
  const matXZ = new THREE.MeshBasicMaterial({ color: 0xccccff, side: THREE.DoubleSide, transparent: true, opacity: 0.2 });
  const matYZ = new THREE.MeshBasicMaterial({ color: 0xccffcc, side: THREE.DoubleSide, transparent: true, opacity: 0.2 });

  const pXY = new THREE.Mesh(geo, matXY);
  const pXZ = new THREE.Mesh(geo, matXZ);
  const pYZ = new THREE.Mesh(geo, matYZ);
  pXZ.rotation.x = Math.PI / 2;
  pYZ.rotation.y = Math.PI / 2;
  scene.add(pXY, pXZ, pYZ);
}

// Quaternion utility functions
function quaternionFromAxisAngle(axis, angle) {
  const rad = angle * Math.PI / 180;
  const q = new THREE.Quaternion();
  q.setFromAxisAngle(axis, rad);
  return q;
}

function slerpQuaternions(q1, q2, t) {
  return new THREE.Quaternion().slerpQuaternions(q1, q2, t);
}

function squadQuaternions(q1, q2, q3, q4, t) {
  const slerp1 = slerpQuaternions(q1, q2, t);
  const slerp2 = slerpQuaternions(q3, q4, t);
  return slerpQuaternions(slerp1, slerp2, 2 * t * (1 - t));
}

// Scene 1: Euler rotation matrix
createScene(
  'three1',
  () => new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial({ color: 0x6699ff })),
  (mesh, { rx = 0, ry = 0, rz = 0 }) => {
    const deg = Math.PI / 180;
    const mx = new THREE.Matrix4().makeRotationX(rx * deg);
    const my = new THREE.Matrix4().makeRotationY(ry * deg);
    const mz = new THREE.Matrix4().makeRotationZ(rz * deg);
    mesh.matrix.copy(mz).multiply(my).multiply(mx);
    mesh.matrixAutoUpdate = false;
  },
  'controls1'
);

// Scene 2: Rodrigues rotation
createScene(
  'three2',
  () => new THREE.Mesh(new THREE.TorusGeometry(1, 0.4, 16, 100), new THREE.MeshPhongMaterial({ color: 0xff6699 })),
  (mesh, { ax = 1, ay = 0, az = 0, angle = 0 }) => {
    const axis = new THREE.Vector3(ax, ay, az);
    if (axis.lengthSq() === 0) return;
    axis.normalize();
    const rot = new THREE.Matrix4().makeRotationAxis(axis, angle * Math.PI / 180);
    mesh.matrix.copy(rot);
    mesh.matrixAutoUpdate = false;
  },
  'controls2',
  ({ scene, extra }) => {
    const arrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 2, 0x00aa00);
    scene.add(arrow);
    extra.axisArrow = arrow;
  },
  ({ extra }, { ax, ay, az }) => {
    const dir = new THREE.Vector3(ax, ay, az);
    if (dir.lengthSq() === 0) return;
    dir.normalize();
    extra.axisArrow.setDirection(dir);
  }
);

// Scene 3: Quaternion SLERP
createScene(
  'three4',
  () => new THREE.Mesh(new THREE.SphereGeometry(0.3), new THREE.MeshStandardMaterial({ color: 0x6699ff })),
  (mesh, { t = 0 }) => {
    const q1 = quaternionFromAxisAngle(new THREE.Vector3(0, 1, 0), 0);
    const q2 = quaternionFromAxisAngle(new THREE.Vector3(0, 1, 0), 90);
    const q = slerpQuaternions(q1, q2, t);

    mesh.position.set(2 * Math.sin(q.y), 0, 2 * Math.cos(q.y));
    mesh.setRotationFromQuaternion(q);
  },
  'controls4',
  ({ extra }) => {
    // Extra setup, if needed
  },
  ({ extra }, { t }) => {
    document.getElementById('t4Value').textContent = `t = ${t.toFixed(2)}`;
  }
);

// Scene 4: Quaternion SQUAD
createScene(
  'three5',
  () => new THREE.Mesh(new THREE.SphereGeometry(0.3), new THREE.MeshStandardMaterial({ color: 0x6699ff })),
  (mesh, { t = 0 }) => {
    const q1 = quaternionFromAxisAngle(new THREE.Vector3(1, 0, 0), 0);
    const q2 = quaternionFromAxisAngle(new THREE.Vector3(0, 1, 0), 45);
    const q3 = quaternionFromAxisAngle(new THREE.Vector3(1, 0, 0), 90);
    const q4 = quaternionFromAxisAngle(new THREE.Vector3(0, 1, 0), 135);
    const q = squadQuaternions(q1, q2, q3, q4, t);

    mesh.position.set(2 * Math.sin(q.y), 0, 2 * Math.cos(q.y));
    mesh.setRotationFromQuaternion(q);
  },
  'controls5',
  ({ extra }) => {
    // Extra setup, if needed
  },
  ({ extra }, { t }) => {
    document.getElementById('t5Value').textContent = `t = ${t.toFixed(2)}`;
  }
);
