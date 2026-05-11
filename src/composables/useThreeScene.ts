import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { MoldConfig, ObjectConfig } from "@/types";

const COLOR_MOLD_EDGE = 0x2563eb;
const COLOR_MOLD_FACE = 0xffffff;
const COLOR_OBJECT_EDGE = 0xf59e0b;
const COLOR_OBJECT_FACE = 0xf59e0b;
const COLOR_GRID = 0xe2e8f0;

const FACE_OPACITY = 0.04;
const EDGE_THRESHOLD_ANGLE = 10;
const AUTO_ROTATE_RESUME_DELAY_MS = 3000;

export function useThreeScene() {
  let scene: THREE.Scene | null = null;
  let camera: THREE.PerspectiveCamera | null = null;
  let renderer: THREE.WebGLRenderer | null = null;
  let controls: OrbitControls | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let animationId: number | null = null;
  let _containerEl: HTMLDivElement | null = null;

  let moldGroup: THREE.Group | null = null;
  let objectGroup: THREE.Group | null = null;
  let gridHelper: THREE.GridHelper | null = null;

  type Silhouette =
    | {
        kind: "cylinderTangents";
        owner: THREE.Group;
        lineA: THREE.Line;
        lineB: THREE.Line;
        r: number;
        h: number;
      }
    | { kind: "sphereBillboard"; owner: THREE.Group; line: THREE.Line }
    | {
        kind: "halfSphereArc";
        owner: THREE.Group;
        line: THREE.Line;
        r: number;
      };
  let silhouettes: Silhouette[] = [];

  let lastMoldConfig: MoldConfig | null = null;
  let lastObjectConfig: ObjectConfig | null = null;

  let autoRotateTimeout: number | null = null;

  const onPointerDown = () => {
    if (!controls) return;
    controls.autoRotate = false;
    if (autoRotateTimeout !== null) {
      window.clearTimeout(autoRotateTimeout);
    }
  };

  const onPointerUp = () => {
    if (autoRotateTimeout !== null) {
      window.clearTimeout(autoRotateTimeout);
    }
    autoRotateTimeout = window.setTimeout(() => {
      if (controls) controls.autoRotate = true;
    }, AUTO_ROTATE_RESUME_DELAY_MS);
  };

  function init(container: HTMLDivElement) {
    _containerEl = container;
    const { width, height } = container.getBoundingClientRect();

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    camera.position.set(30, 22, 45);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.8;
    controls.enablePan = false;

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("wheel", onPointerDown, {
      passive: true,
    });
    renderer.domElement.addEventListener("wheel", onPointerUp, {
      passive: true,
    });

    resizeObserver = new ResizeObserver(() => {
      if (!container || !camera || !renderer) return;
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();
      renderer.setSize(rect.width, rect.height);
    });
    resizeObserver.observe(container);

    animate();
  }

  function animate() {
    animationId = requestAnimationFrame(animate);
    if (controls) controls.update();
    updateSilhouettes();
    if (renderer && scene && camera) renderer.render(scene, camera);
  }

  function updateSilhouettes() {
    if (!camera || silhouettes.length === 0) return;
    const tmpWorld = new THREE.Vector3();
    for (const s of silhouettes) {
      s.owner.getWorldPosition(tmpWorld);
      const dx = camera.position.x - tmpWorld.x;
      const dz = camera.position.z - tmpWorld.z;
      const len = Math.hypot(dx, dz) || 1;
      // tangent direction in XZ, perpendicular to camera direction
      const tx = -dz / len;
      const tz = dx / len;

      if (s.kind === "cylinderTangents") {
        const { r, h, lineA, lineB } = s;
        const px = tx * r;
        const pz = tz * r;
        lineA.geometry.dispose();
        lineA.geometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(px, h / 2, pz),
          new THREE.Vector3(px, -h / 2, pz),
        ]);
        lineB.geometry.dispose();
        lineB.geometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-px, h / 2, -pz),
          new THREE.Vector3(-px, -h / 2, -pz),
        ]);
      } else if (s.kind === "halfSphereArc") {
        const { r, line } = s;
        const N = 48;
        const pts: THREE.Vector3[] = [];
        for (let i = 0; i <= N; i++) {
          const a = (i / N) * Math.PI;
          const c = Math.cos(a);
          const sn = Math.sin(a);
          pts.push(new THREE.Vector3(tx * r * c, r * sn, tz * r * c));
        }
        line.geometry.dispose();
        line.geometry = new THREE.BufferGeometry().setFromPoints(pts);
      } else if (s.kind === "sphereBillboard") {
        s.line.quaternion.copy(camera.quaternion);
      }
    }
  }

  function makeFaceMaterial(color: number) {
    return new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: FACE_OPACITY,
      side: THREE.FrontSide,
      depthWrite: false,
    });
  }

  function makeEdges(geometry: THREE.BufferGeometry, color: number) {
    const edgesGeometry = new THREE.EdgesGeometry(
      geometry,
      EDGE_THRESHOLD_ANGLE,
    );
    const lineMaterial = new THREE.LineBasicMaterial({ color, linewidth: 1 });
    return new THREE.LineSegments(edgesGeometry, lineMaterial);
  }

  function clearGroup(group: THREE.Group | null) {
    if (!group || !scene) return;
    silhouettes = silhouettes.filter((s) => s.owner !== group);
    group.traverse((child) => {
      // THREE.LineSegments extends THREE.Line — catching Line covers both
      if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          for (const m of child.material) m.dispose();
        } else {
          child.material.dispose();
        }
      }
    });
    scene.remove(group);
  }

  function makeCircleLine(
    r: number,
    y: number,
    color: number,
    axis: "xz" | "xy" | "yz" = "xz",
  ): THREE.Line {
    const N = 64;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI * 2;
      if (axis === "xz")
        pts.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r));
      else if (axis === "xy")
        pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r + y, 0));
      else pts.push(new THREE.Vector3(0, Math.sin(a) * r + y, Math.cos(a) * r));
    }
    return new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color }),
    );
  }

  function addCylinderWireframe(
    group: THREE.Group,
    r: number,
    h: number,
    color: number,
  ) {
    // Top and bottom circles (static)
    group.add(makeCircleLine(r, h / 2, color));
    group.add(makeCircleLine(r, -h / 2, color));
    // 2 vertical tangent silhouette lines (camera-dependent, updated per frame)
    const material = new THREE.LineBasicMaterial({ color });
    const lineA = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(r, h / 2, 0),
        new THREE.Vector3(r, -h / 2, 0),
      ]),
      material,
    );
    const lineB = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-r, h / 2, 0),
        new THREE.Vector3(-r, -h / 2, 0),
      ]),
      material,
    );
    group.add(lineA);
    group.add(lineB);
    silhouettes.push({
      kind: "cylinderTangents",
      owner: group,
      lineA,
      lineB,
      r,
      h,
    });
  }

  function addSphereWireframe(group: THREE.Group, r: number, color: number) {
    // Single silhouette great-circle, billboarded toward the camera
    const N = 64;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0));
    }
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color }),
    );
    group.add(line);
    silhouettes.push({ kind: "sphereBillboard", owner: group, line });
  }

  function addHalfSphereWireframe(
    group: THREE.Group,
    r: number,
    color: number,
  ) {
    // Base circle (static)
    group.add(makeCircleLine(r, 0, color));
    // Dome silhouette arc (camera-dependent)
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(r, 0, 0),
        new THREE.Vector3(-r, 0, 0),
      ]),
      new THREE.LineBasicMaterial({ color }),
    );
    group.add(line);
    silhouettes.push({ kind: "halfSphereArc", owner: group, line, r });
  }

  function buildMoldGeometry(config: MoldConfig): THREE.BufferGeometry | null {
    const d = config.dimensions;
    if (config.shape === "box") {
      const length = d.length ?? 0;
      const width = d.width ?? 0;
      const height = d.height ?? 0;
      if (length <= 0 || width <= 0 || height <= 0) return null;
      return new THREE.BoxGeometry(length, height, width);
    }
    if (config.shape === "cylinder") {
      const diameter = d.diameter ?? 0;
      const height = d.height ?? 0;
      if (diameter <= 0 || height <= 0) return null;
      const r = diameter / 2;
      return new THREE.CylinderGeometry(r, r, height, 64);
    }
    return null;
  }

  function getMoldHeight(config: MoldConfig): number {
    return config.dimensions.height ?? 0;
  }

  function getObjectHeight(config: ObjectConfig): number {
    if (config.manualVolume !== null && config.manualVolume !== undefined) {
      const volumeCm3 = (Number(config.manualVolume) || 0) * 1000;
      return Math.cbrt(volumeCm3);
    }
    if (!config.dimensions) return 0;
    const d = config.dimensions;
    switch (config.shape) {
      case "box":
      case "cylinder":
        return d.height ?? 0;
      case "sphere":
        return d.diameter ?? 0;
      case "half-sphere":
        return (d.diameter ?? 0) / 2;
      default:
        return 0;
    }
  }

  function makeQuestionMarkSprite(color: number): THREE.Sprite {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return new THREE.Sprite();
    ctx.fillStyle = `#${color.toString(16).padStart(6, "0")}`;
    ctx.font = `bold ${size * 0.7}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", size / 2, size / 2);
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
    });
    return new THREE.Sprite(material);
  }

  function buildManualVolumeGroup(volumeLiters: number): THREE.Group | null {
    if (volumeLiters <= 0) return null;
    const volumeCm3 = volumeLiters * 1000;
    const side = Math.cbrt(volumeCm3);
    const group = new THREE.Group();
    const geometry = new THREE.BoxGeometry(side, side, side);
    group.add(new THREE.Mesh(geometry, makeFaceMaterial(COLOR_OBJECT_FACE)));
    group.add(makeEdges(geometry, COLOR_OBJECT_EDGE));
    const sprite = makeQuestionMarkSprite(COLOR_OBJECT_EDGE);
    sprite.scale.set(side * 0.7, side * 0.7, 1);
    group.add(sprite);
    return group;
  }

  function buildObjectGroup(config: ObjectConfig): THREE.Group | null {
    if (config.shape === "none") return null;
    if (config.manualVolume !== null && config.manualVolume !== undefined) {
      return buildManualVolumeGroup(Number(config.manualVolume) || 0);
    }
    if (!config.dimensions) return null;

    const d = config.dimensions;
    const group = new THREE.Group();
    const faceMaterial = makeFaceMaterial(COLOR_OBJECT_FACE);

    if (config.shape === "box") {
      const length = d.length ?? 0;
      const width = d.width ?? 0;
      const height = d.height ?? 0;
      if (length <= 0 || width <= 0 || height <= 0) return null;
      const geometry = new THREE.BoxGeometry(length, height, width);
      group.add(new THREE.Mesh(geometry, faceMaterial));
      group.add(makeEdges(geometry, COLOR_OBJECT_EDGE));
      return group;
    }

    if (config.shape === "cylinder") {
      const diameter = d.diameter ?? 0;
      const height = d.height ?? 0;
      if (diameter <= 0 || height <= 0) return null;
      const r = diameter / 2;
      const geometry = new THREE.CylinderGeometry(r, r, height, 64);
      group.add(new THREE.Mesh(geometry, faceMaterial));
      addCylinderWireframe(group, r, height, COLOR_OBJECT_EDGE);
      return group;
    }

    if (config.shape === "sphere") {
      const diameter = d.diameter ?? 0;
      if (diameter <= 0) return null;
      const r = diameter / 2;
      const geometry = new THREE.SphereGeometry(r, 32, 32);
      group.add(new THREE.Mesh(geometry, faceMaterial));
      addSphereWireframe(group, r, COLOR_OBJECT_EDGE);
      return group;
    }

    if (config.shape === "half-sphere") {
      const diameter = d.diameter ?? 0;
      if (diameter <= 0) return null;
      const r = diameter / 2;
      const domeGeometry = new THREE.SphereGeometry(
        r,
        32,
        32,
        0,
        Math.PI * 2,
        0,
        Math.PI / 2,
      );
      group.add(new THREE.Mesh(domeGeometry, faceMaterial));
      const baseGeometry = new THREE.CircleGeometry(r, 64);
      const base = new THREE.Mesh(baseGeometry, faceMaterial);
      base.rotation.x = Math.PI / 2;
      group.add(base);
      addHalfSphereWireframe(group, r, COLOR_OBJECT_EDGE);
      return group;
    }

    return null;
  }

  function rebuildGrid(maxDim: number, moldHeight: number) {
    if (!scene) return;
    if (gridHelper) {
      gridHelper.geometry.dispose();
      if (Array.isArray(gridHelper.material)) {
        for (const m of gridHelper.material) m.dispose();
      } else {
        gridHelper.material.dispose();
      }
      scene.remove(gridHelper);
      gridHelper = null;
    }
    const size = Math.max(maxDim * 2, 10);
    gridHelper = new THREE.GridHelper(size, 10, COLOR_GRID, COLOR_GRID);
    gridHelper.position.y = -moldHeight / 2;
    const mat = gridHelper.material as THREE.Material | THREE.Material[];
    if (Array.isArray(mat)) {
      for (const m of mat) {
        m.transparent = true;
        m.opacity = 0.6;
      }
    } else {
      mat.transparent = true;
      mat.opacity = 0.6;
    }
    scene.add(gridHelper);
  }

  function fitCamera(maxDim: number) {
    if (!camera || !controls) return;
    camera.position.set(maxDim * 1.2, maxDim * 0.9, maxDim * 1.8);
    camera.lookAt(0, 0, 0);
    controls.target.set(0, 0, 0);
    controls.minDistance = maxDim * 0.5;
    controls.maxDistance = maxDim * 5;
    controls.update();
  }

  function updateMold(config: MoldConfig) {
    if (!scene) return;
    lastMoldConfig = config;

    clearGroup(moldGroup);
    moldGroup = null;

    const geometry = buildMoldGeometry(config);
    if (!geometry) {
      // Still re-place object (no mold to anchor to)
      if (lastObjectConfig) updateObject(lastObjectConfig);
      return;
    }

    const group = new THREE.Group();
    const faceMaterial = makeFaceMaterial(COLOR_MOLD_FACE);
    group.add(new THREE.Mesh(geometry, faceMaterial));
    if (config.shape === "cylinder") {
      const r = (config.dimensions.diameter ?? 0) / 2;
      const h = config.dimensions.height ?? 0;
      addCylinderWireframe(group, r, h, COLOR_MOLD_EDGE);
    } else {
      group.add(makeEdges(geometry, COLOR_MOLD_EDGE));
    }
    scene.add(group);
    moldGroup = group;

    const bbox = new THREE.Box3().setFromObject(group);
    const size = bbox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z, 1);

    rebuildGrid(maxDim, getMoldHeight(config));
    fitCamera(maxDim);

    if (lastObjectConfig) updateObject(lastObjectConfig);
  }

  function updateObject(config: ObjectConfig) {
    if (!scene) return;
    lastObjectConfig = config;

    clearGroup(objectGroup);
    objectGroup = null;

    const group = buildObjectGroup(config);
    if (!group) return;

    const moldHeight = lastMoldConfig ? getMoldHeight(lastMoldConfig) : 0;
    const objectHeight = getObjectHeight(config);

    if (config.shape === "half-sphere") {
      // Flat base sits on the floor of the mold.
      group.position.y = -moldHeight / 2;
    } else {
      group.position.y = -moldHeight / 2 + objectHeight / 2;
    }

    scene.add(group);
    objectGroup = group;
  }

  function destroy() {
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    if (autoRotateTimeout !== null) {
      window.clearTimeout(autoRotateTimeout);
      autoRotateTimeout = null;
    }
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    if (renderer) {
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("wheel", onPointerDown);
      renderer.domElement.removeEventListener("wheel", onPointerUp);
    }
    if (controls) {
      controls.dispose();
      controls = null;
    }
    clearGroup(moldGroup);
    clearGroup(objectGroup);
    moldGroup = null;
    objectGroup = null;
    silhouettes = [];
    if (gridHelper && scene) {
      gridHelper.geometry.dispose();
      if (Array.isArray(gridHelper.material)) {
        for (const m of gridHelper.material) m.dispose();
      } else {
        gridHelper.material.dispose();
      }
      scene.remove(gridHelper);
      gridHelper = null;
    }
    if (renderer) {
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer = null;
    }
    scene = null;
    camera = null;
    _containerEl = null;
    lastMoldConfig = null;
    lastObjectConfig = null;
  }

  return { init, updateMold, updateObject, destroy };
}
