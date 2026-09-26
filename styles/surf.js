import * as THREE from "../assets/surf/three.module.min.js";
import { createBreaker } from "./surf-wave.js";

const root = document.querySelector(".surf-story");
const en = document.documentElement.lang === "en";
const text = (de, english) => (en ? english : de);
const story = root;
const stage = root.querySelector(".stage");
const canvas = document.querySelector("#surf-ocean");
const media = matchMedia("(prefers-reduced-motion: reduce)");
const narrow = () => innerWidth <= 900;
let renderer;
let reduced = media.matches,
  paused = false,
  visible = true,
  explicitMotion = false;
let progress = 0,
  wantedProgress = 0,
  time = 0,
  last = performance.now(),
  frame = 0;
const mouse = new THREE.Vector2(),
  aim = new THREE.Vector2();
const clamp = THREE.MathUtils.clamp;
const mix = THREE.MathUtils.lerp;
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
root.classList.toggle("reduced", reduced);

function go(p) {
  if ((reduced || !renderer || root.classList.contains("no-webgl")) && p > 0) {
    document.querySelector("#folio").scrollIntoView({ behavior: "auto" });
    return;
  }
  const top = story.getBoundingClientRect().top + scrollY;
  window.scrollTo({
    top:
      top -
      parseFloat(getComputedStyle(stage).top) +
      p * Math.max(0, story.offsetHeight - stage.offsetHeight),
    behavior: reduced ? "auto" : "smooth",
  });
}
root.querySelectorAll("[data-jump]").forEach((b) =>
  b.addEventListener("click", (e) => {
    e.preventDefault();
    go(Number(b.dataset.jump));
  }),
);
root.querySelectorAll('a[href^="#"]:not([data-jump])').forEach((a) =>
  a.addEventListener("click", (e) => {
    const target = document.querySelector(a.getAttribute("href"));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
    }
  }),
);
const motionButton = document.querySelector("#surf-motion");
function syncMotion() {
  root.classList.toggle("paused", paused);
  root.classList.toggle(
    "animated",
    !!renderer && !reduced && !root.classList.contains("no-webgl"),
  );
  document.querySelector(".intro .primary").innerHTML =
    reduced || !renderer || root.classList.contains("no-webgl")
      ? text("Folio ansehen", "See Folio") +
        ' <span aria-hidden="true">↓</span>'
      : text("Das Brett entdecken", "Explore the board") +
        ' <span aria-hidden="true">↓</span>';
  window.dispatchEvent(
    new CustomEvent("surf-motion", { detail: { paused, reduced } }),
  );
  motionButton.setAttribute("aria-pressed", String(paused || reduced));
  motionButton.innerHTML =
    (reduced || paused ? "▶" : "Ⅱ") +
    " <span>" +
    (reduced
      ? text("Bewegung einschalten", "Enable motion")
      : paused
        ? text("Animation fortsetzen", "Resume animation")
        : text("Animation pausieren", "Pause animation")) +
    "</span>";
  motionButton.setAttribute(
    "aria-label",
    reduced
      ? text("Bewegung einschalten", "Enable motion")
      : paused
        ? text("Animation fortsetzen", "Resume animation")
        : text("Animation pausieren", "Pause animation"),
  );
}
motionButton.addEventListener("click", () => {
  if (reduced) {
    reduced = false;
    explicitMotion = true;
    root.classList.remove("reduced");
  } else paused = !paused;
  syncMotion();
  onScroll();
  requestFrame();
});
media.addEventListener("change", (e) => {
  if (explicitMotion) return;
  reduced = e.matches;
  root.classList.toggle("reduced", reduced);
  syncMotion();
  onScroll();
  requestFrame();
});
syncMotion();
function onScroll() {
  const range = Math.max(1, story.offsetHeight - stage.offsetHeight);
  wantedProgress = reduced
    ? 0
    : clamp(
        (parseFloat(getComputedStyle(stage).top) -
          story.getBoundingClientRect().top) /
          range,
        0,
        1,
      );
  requestFrame();
}
window.addEventListener("scroll", onScroll, { passive: true });
stage.addEventListener(
  "pointermove",
  (e) => {
    if (e.pointerType !== "mouse" || reduced || paused) return;
    const r = stage.getBoundingClientRect();
    mouse.set(
      clamp((e.clientX / r.width - 0.5) * 2, -1, 1),
      clamp(((e.clientY - r.top) / r.height - 0.5) * 2, -1, 1),
    );
  },
  { passive: true },
);
stage.addEventListener("pointerleave", () => mouse.set(0, 0));

try {
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "low-power",
  });
} catch (error) {
  root.classList.add("no-webgl");
  syncMotion();
  window.__surfScene = { available: false, error: String(error) };
}

const scene = new THREE.Scene();
scene.background = new THREE.Color("#d9edfa");
scene.fog = new THREE.Fog("#d9edfa", 24, 74);
const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 170);
scene.add(new THREE.HemisphereLight("#eaf9ff", "#40628d", 2.2));
const sun = new THREE.DirectionalLight("#fff4df", 3.0);
sun.position.set(-10, 16, 10);
scene.add(sun);
const fill = new THREE.DirectionalLight("#90c6ff", 1.0);
fill.position.set(7, 5, -6);
scene.add(fill);
const sky = new THREE.Mesh(
  new THREE.SphereGeometry(115, 24, 16),
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    vertexShader: `varying vec3 p; void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `varying vec3 p;void main(){float h=smoothstep(-15.,65.,p.y);gl_FragColor=vec4(mix(vec3(.64,.83,.95),vec3(.94,.98,1.),h),1.);}`,
  }),
);
scene.add(sky);

const waterUniforms = {
  uTime: { value: 0 },
  uLight: { value: new THREE.Vector3(-0.5, 0.9, 0.4).normalize() },
};
const oceanGeometry = new THREE.PlaneGeometry(150, 160, 220, 240);
oceanGeometry.rotateX(-Math.PI / 2);
const waveGLSL = `float heightAt(vec2 p){return .7*sin(p.y*.54+p.x*.10-uTime*.68)+.22*sin(p.y*1.18-p.x*.29-uTime*.96)+.16*sin(p.x*.56+p.y*.21+uTime*.26);}`;
const oceanMaterial = new THREE.ShaderMaterial({
  uniforms: waterUniforms,
  vertexShader: `uniform float uTime; varying vec3 vWorld; varying vec3 vNormal; varying float vHeight; ${waveGLSL}
 void main(){vec3 p=position; p.y=heightAt(p.xz); float d=.035; vNormal=normalize(vec3(heightAt(p.xz-vec2(d,0.))-heightAt(p.xz+vec2(d,0.)),2.*d,heightAt(p.xz-vec2(0.,d))-heightAt(p.xz+vec2(0.,d))));vHeight=p.y;vWorld=(modelMatrix*vec4(p,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
  fragmentShader: `uniform float uTime;uniform vec3 uLight;varying vec3 vWorld;varying vec3 vNormal;varying float vHeight;
 void main(){vec3 n=normalize(vNormal);vec3 view=normalize(cameraPosition-vWorld);float shade=.64+.36*max(0.,dot(n,uLight));float fresnel=pow(1.-max(0.,dot(n,view)),3.);vec3 deep=vec3(.028,.20,.43);vec3 light=vec3(.075,.43,.72);vec3 c=mix(deep,light,smoothstep(-.85,.85,vHeight));c*=shade;c=mix(c,vec3(.36,.67,.88),fresnel*.55);float lines=sin(vWorld.x*2.8+sin(vWorld.z*2.6)+uTime*.21)*.5+.5;float foam=smoothstep(.72,1.08,vHeight)*(.4+.6*lines);c=mix(c,vec3(.80,.93,.99),foam*.78);float glint=pow(max(0.,dot(reflect(-uLight,n),view)),90.);c+=vec3(.73,.85,.93)*glint*.5;float haze=smoothstep(19.,72.,distance(cameraPosition.xz,vWorld.xz));c=mix(c,vec3(.69,.84,.94),haze);gl_FragColor=vec4(c,1.);}`,
});
const ocean = new THREE.Mesh(oceanGeometry, oceanMaterial);
ocean.position.z = -24;
scene.add(ocean);
const breaker = createBreaker(THREE);
scene.add(breaker.group);
// Match the shader's world-local surface so the board follows the water.
const heightAt = (x, z, t) =>
  0.7 * Math.sin(z * 0.54 + x * 0.1 - t * 0.68) +
  0.22 * Math.sin(z * 1.18 - x * 0.29 - t * 0.96) +
  0.16 * Math.sin(x * 0.56 + z * 0.21 + t * 0.26);
const waterY = (x, z, t) => heightAt(x, z + 24, t);

function material(color, extra = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.55,
    metalness: 0.03,
    ...extra,
  });
}
function ellipsoid(parent, scale, position, mat) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 18), mat);
  m.scale.set(...scale);
  m.position.set(...position);
  parent.add(m);
  return m;
}
function link(parent, a, b, r, mat) {
  const p = new THREE.Vector3(...a),
    q = new THREE.Vector3(...b),
    dir = q.clone().sub(p);
  const mesh = new THREE.Mesh(
    new THREE.CapsuleGeometry(r, Math.max(0.01, dir.length() - r * 2), 5, 12),
    mat,
  );
  mesh.position.copy(p.add(q).multiplyScalar(0.5));
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    dir.normalize(),
  );
  parent.add(mesh);
  return mesh;
}

// The same board remains in the scene for the entire camera movement.
const rig = new THREE.Group();
scene.add(rig);
const board = new THREE.Group();
rig.add(board);
const shape = new THREE.Shape();
shape.moveTo(0, 2.5);
shape.bezierCurveTo(0.46, 2.1, 0.74, 0.72, 0.67, -0.82);
shape.bezierCurveTo(0.63, -1.55, 0.46, -2.02, 0.34, -2.12);
shape.quadraticCurveTo(0, -2.26, -0.34, -2.12);
shape.bezierCurveTo(-0.46, -2.02, -0.63, -1.55, -0.67, -0.82);
shape.bezierCurveTo(-0.74, 0.72, -0.46, 2.1, 0, 2.5);
function boardPart(mat, scale, y) {
  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: 0.17,
    bevelEnabled: true,
    bevelThickness: 0.035,
    bevelSize: 0.045,
    bevelSegments: 4,
    steps: 1,
    curveSegments: 28,
  });
  geom.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(geom, mat);
  m.scale.set(scale, 1, scale);
  m.position.y = y;
  board.add(m);
  return m;
}
const shell = boardPart(material("#1c5dab"), 1.02, 0);
const core = boardPart(material("#427fc7"), 0.98, 0.2);
const deckMaterial = material("#f8fcff", {
  transparent: true,
  opacity: 1,
  roughness: 0.31,
});
const deck = boardPart(deckMaterial, 0.98, 0.4);
const stripeMaterial = material("#4783ca", { transparent: true, opacity: 1 });
const stripe = new THREE.Mesh(
  new THREE.BoxGeometry(0.065, 0.006, 3.68),
  stripeMaterial,
);
stripe.position.set(0.24, 0.61, -0.07);
board.add(stripe);
const fin = new THREE.Mesh(
  new THREE.ConeGeometry(0.16, 0.43, 3),
  material("#16417d"),
);
fin.rotation.x = Math.PI;
fin.position.set(0, -0.22, 1.4);
board.add(fin);
// Three real layers separate vertically; their materials remain solid.
const inner = new THREE.Group();
board.add(inner);
const layerText = en
  ? ["YOUR KNOWLEDGE", "LOCAL MODELS", "RULES & TOOLS"]
  : ["DEIN WISSEN", "LOKALE MODELLE", "REGELN & WERKZEUGE"];
function labelTexture(title, dark) {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 100;
  const ctx = c.getContext("2d");
  ctx.fillStyle = dark ? "#244d80" : "#e4f4ff";
  ctx.font = "500 52px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(title, 512, 70);
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
const labels = [deck, core, shell].map((part, i) => {
  const mat = new THREE.MeshBasicMaterial({
    map: labelTexture(layerText[i], i === 0),
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const label = new THREE.Mesh(new THREE.PlaneGeometry(2.75, 0.22), mat);
  label.rotation.y = Math.PI / 2;
  label.position.set(0.83, part.position.y + 0.1, 0);
  board.add(label);
  return { mesh: label, part };
});
// Sources on the deck, small processing nodes in the core, bounded circuits below.
const paperMaterial = material("#d4e4f5", { transparent: true, opacity: 0 });
const sourceLinesMaterial = material("#749dca", {
  transparent: true,
  opacity: 0,
});
const sources = new THREE.Group();
board.add(sources);
for (let i = 0; i < 3; i++) {
  const card = new THREE.Mesh(
    new THREE.BoxGeometry(0.68, 0.013, 0.66),
    paperMaterial,
  );
  card.position.set(0, 0.218, -1.05 + i * 1.05);
  sources.add(card);
  for (let j = 0; j < 3; j++) {
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(0.43 - j * 0.07, 0.007, 0.022),
      sourceLinesMaterial,
    );
    line.position.set(-0.03, 0.23, -1.19 + i * 1.05 + j * 0.13);
    sources.add(line);
  }
}
const nodeMaterial = material("#b5dcff", {
  emissive: "#4173a9",
  emissiveIntensity: 0.2,
  transparent: true,
  opacity: 0,
});
const network = new THREE.Group();
inner.add(network);
for (let i = 0; i < 10; i++) {
  const x = Math.sin(i * 2.4) * 0.38,
    z = -1.5 + i * 0.32;
  ellipsoid(network, [0.055, 0.03, 0.055], [x, 0.23, z], nodeMaterial);
  if (i) {
    const px = Math.sin((i - 1) * 2.4) * 0.38;
    link(network, [px, 0.226, z - 0.32], [x, 0.226, z], 0.008, nodeMaterial);
  }
}
const circuitMaterial = material("#8ac1ed", { transparent: true, opacity: 0 });
for (let i = 0; i < 12; i++) {
  const circuit = new THREE.Mesh(
    new THREE.BoxGeometry(0.54, 0.008, 0.018),
    circuitMaterial,
  );
  circuit.position.set(0, 0.212, -1.4 + i * 0.25);
  board.add(circuit);
}
const packetMaterial = material("#e4f6ff", {
  emissive: "#92cfff",
  emissiveIntensity: 0.35,
  transparent: true,
  opacity: 0,
});
const packets = Array.from({ length: 6 }, () => {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(0.065, 0.035, 0.085),
    packetMaterial,
  );
  inner.add(m);
  return m;
});
const guideGeometry = new THREE.BufferGeometry();
const guideArray = new Float32Array(4 * 2 * 3);
guideGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(guideArray, 3),
);
const guides = new THREE.LineSegments(
  guideGeometry,
  new THREE.LineBasicMaterial({
    color: "#b5d8f3",
    transparent: true,
    opacity: 0,
    depthWrite: false,
  }),
);
board.add(guides);
// Adult proportions and a coherent surf stance: chest turns toward the rail,
// the neck makes only a small further turn toward the nose of the board (-Z).
const rider = new THREE.Group();
rider.position.y = 0.585;
rig.add(rider);
const skin = material("#c58f71", {
  transparent: true,
  roughness: 0.76,
  metalness: 0,
});
const suit = material("#18374d", {
  transparent: true,
  roughness: 0.84,
  metalness: 0,
});
const panel = material("#2c546b", {
  transparent: true,
  roughness: 0.82,
  metalness: 0,
});
const hair = material("#382c26", {
  transparent: true,
  roughness: 0.95,
  metalness: 0,
});
const eye = material("#33342f", { transparent: true, roughness: 0.5 });
const white = material("#d8cbbd", { transparent: true, roughness: 0.7 });
const lips = material("#9c6e59", { transparent: true, roughness: 0.8 });
const riderMaterials = [skin, suit, panel, hair, eye, white, lips];
function limb(parent, a, b, r1, r2, mat) {
  const p = new THREE.Vector3(...a),
    q = new THREE.Vector3(...b),
    dir = q.clone().sub(p);
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(r2, r1, dir.length(), 20, 1),
    mat,
  );
  mesh.position.copy(p.add(q).multiplyScalar(0.5));
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    dir.normalize(),
  );
  parent.add(mesh);
  return mesh;
}
ellipsoid(rider, [0.22, 0.16, 0.25], [0, 0.92, 0.1], suit);
// Bent legs, with feet planted across the board rather than pointing backwards.
for (const [hip, knee, ankle] of [
  [
    [-0.11, 0.92, -0.03],
    [-0.27, 0.54, -0.67],
    [-0.14, 0.16, -0.93],
  ],
  [
    [0.12, 0.92, 0.23],
    [0.38, 0.49, 0.48],
    [0.16, 0.15, 0.87],
  ],
]) {
  limb(rider, hip, knee, 0.14, 0.105, suit);
  ellipsoid(rider, [0.105, 0.113, 0.1], knee, suit);
  limb(rider, knee, ankle, 0.104, 0.058, suit);
  ellipsoid(rider, [0.06, 0.09, 0.064], ankle, skin);
}
const frontFoot = ellipsoid(
  rider,
  [0.1, 0.046, 0.2],
  [-0.14, 0.085, -0.95],
  skin,
);
frontFoot.rotation.y = -0.92;
const rearFoot = ellipsoid(rider, [0.1, 0.047, 0.19], [0.16, 0.08, 0.88], skin);
rearFoot.rotation.y = -0.65;
const body = new THREE.Group();
body.position.set(0.025, 0.94, 0.08);
body.rotation.set(0.07, 1.9, 0.08);
rider.add(body);
const torsoProfile = [
  new THREE.Vector2(0.17, 0),
  new THREE.Vector2(0.2, 0.07),
  new THREE.Vector2(0.22, 0.25),
  new THREE.Vector2(0.275, 0.46),
  new THREE.Vector2(0.28, 0.54),
  new THREE.Vector2(0.22, 0.64),
  new THREE.Vector2(0.095, 0.69),
];
const torso = new THREE.Mesh(new THREE.LatheGeometry(torsoProfile, 32), suit);
torso.scale.z = 0.67;
body.add(torso);
const chest = ellipsoid(body, [0.206, 0.215, 0.022], [0, 0.4, 0.151], panel);
chest.rotation.x = -0.05;
limb(body, [0, 0.67, 0.01], [0, 0.83, 0.03], 0.077, 0.071, skin);
// Arms balance to either side of the chest, one leading, one trailing.
for (const [shoulder, elbow, wrist, hand] of [
  [
    [-0.255, 0.56, 0],
    [-0.52, 0.34, 0.02],
    [-0.8, 0.19, 0.19],
    [-0.85, 0.17, 0.22],
  ],
  [
    [0.255, 0.56, 0],
    [0.54, 0.36, 0.12],
    [0.84, 0.3, 0.23],
    [0.89, 0.29, 0.25],
  ],
]) {
  ellipsoid(body, [0.105, 0.12, 0.106], shoulder, suit);
  limb(body, shoulder, elbow, 0.103, 0.077, suit);
  ellipsoid(body, [0.077, 0.077, 0.077], elbow, suit);
  limb(body, elbow, wrist, 0.075, 0.046, suit);
  const palm = ellipsoid(body, [0.069, 0.035, 0.094], hand, skin);
  palm.rotation.y = 0.55;
}
const head = new THREE.Group();
head.position.set(0, 0.98, 0.035);
head.rotation.set(0.06, 0.55, 0);
body.add(head);
ellipsoid(head, [0.157, 0.215, 0.169], [0, 0, 0], skin);
ellipsoid(head, [0.124, 0.09, 0.115], [0, -0.115, 0.037], skin);
ellipsoid(head, [0.026, 0.047, 0.038], [-0.157, -0.004, -0.008], skin);
ellipsoid(head, [0.026, 0.047, 0.038], [0.157, -0.004, -0.008], skin);
ellipsoid(head, [0.025, 0.048, 0.046], [0, 0.012, 0.168], skin);
ellipsoid(head, [0.034, 0.017, 0.024], [0, -0.026, 0.193], skin);
for (const side of [-1, 1]) {
  ellipsoid(head, [0.025, 0.01, 0.01], [side * 0.061, 0.043, 0.154], white);
  ellipsoid(head, [0.009, 0.009, 0.006], [side * 0.06, 0.043, 0.163], eye);
  link(
    head,
    [side * 0.037, 0.074, 0.155],
    [side * 0.088, 0.073, 0.142],
    0.007,
    hair,
  );
}
const mouth = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-0.038, -0.081, 0.154),
  new THREE.Vector3(0, -0.085, 0.165),
  new THREE.Vector3(0.038, -0.08, 0.154),
]);
head.add(
  new THREE.Mesh(new THREE.TubeGeometry(mouth, 12, 0.0045, 5, false), lips),
);
const hairCap = new THREE.Mesh(
  new THREE.SphereGeometry(1, 32, 18, 0, Math.PI * 2, 0, Math.PI * 0.55),
  hair,
);
hairCap.scale.set(0.165, 0.139, 0.176);
hairCap.position.set(0, 0.111, -0.012);
hairCap.rotation.x = -0.13;
head.add(hairCap);
for (const side of [-1, 1])
  ellipsoid(head, [0.018, 0.047, 0.051], [side * 0.145, 0.036, -0.048], hair);

// White water leaving the tail. Particles are small and follow the same wave field.
const sprayGeometry = new THREE.BufferGeometry(),
  sprayArray = new Float32Array(90 * 3);
sprayGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(sprayArray, 3),
);
const sprayMaterial = new THREE.PointsMaterial({
  color: "#e6f8ff",
  size: 0.06,
  transparent: true,
  opacity: 0.6,
  depthWrite: false,
});
const spray = new THREE.Points(sprayGeometry, sprayMaterial);
scene.add(spray);

const cloudMaterial = material("#f7fbff", {
  roughness: 1,
  transparent: true,
  opacity: 0.85,
});
for (const [x, y, z, s] of [
  [-15, 8, -34, 2.2],
  [14, 10, -38, 3.3],
  [1, 12, -54, 4],
]) {
  const group = new THREE.Group();
  for (let j = 0; j < 5; j++)
    ellipsoid(
      group,
      [s * (0.7 + (j % 2) * 0.2), s * 0.2, s * 0.3],
      [j * s * 0.6, Math.sin(j) * s * 0.12, 0],
      cloudMaterial,
    );
  group.position.set(x, y, z);
  scene.add(group);
}
function gull() {
  const g = new THREE.Group();
  const feather = material("#f9fcff", { roughness: 0.8 });
  ellipsoid(g, [0.085, 0.075, 0.23], [0, 0, 0], feather);
  ellipsoid(g, [0.064, 0.065, 0.07], [0, 0.037, 0.22], feather);
  const beak = new THREE.Mesh(
    new THREE.ConeGeometry(0.021, 0.09, 6),
    material("#d9aa5d"),
  );
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, 0.03, 0.31);
  g.add(beak);
  const wings = [];
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    const ws = new THREE.Shape();
    ws.moveTo(0, 0);
    ws.bezierCurveTo(0.18, 0.13, 0.62, 0.2, 0.94, 0.06);
    ws.bezierCurveTo(0.79, 0.1, 0.5, -0.08, 0.13, -0.16);
    ws.lineTo(0, 0);
    const wing = new THREE.Mesh(
      new THREE.ShapeGeometry(ws, 12),
      new THREE.MeshStandardMaterial({
        color: "#f7fbff",
        side: THREE.DoubleSide,
        roughness: 0.75,
      }),
    );
    wing.rotation.x = Math.PI / 2;
    wing.scale.x = side;
    pivot.add(wing);
    g.add(pivot);
    wings.push(pivot);
  }
  scene.add(g);
  return { g, wings };
}
const birds = [gull(), gull()];

const startCamera = new THREE.Vector3(),
  closeCamera = new THREE.Vector3(),
  startTarget = new THREE.Vector3(),
  closeTarget = new THREE.Vector3(),
  look = new THREE.Vector3();
function phaseState(p) {
  const zoom = smooth(0.055, 0.395, p) * (1 - smooth(0.64, 0.89, p));
  return {
    zoom,
    intro: 1 - smooth(0.04, 0.22, p),
    board: smooth(0.3, 0.41, p) * (1 - smooth(0.61, 0.72, p)),
    return: smooth(0.82, 0.95, p),
  };
}
let currentPhase = "intro";
function updateCopy(values) {
  let active = "intro";
  if (values.board > 0.5) active = "board";
  if (values.return > 0.5) active = "return";
  for (const name of ["intro", "board", "return"]) {
    const el = document.querySelector(`[data-phase="${name}"]`);
    const opacity = values[name];
    el.style.opacity = opacity.toFixed(3);
    el.style.transform = `translateY(${(1 - opacity) * 16}px)`;
    el.style.pointerEvents = opacity > 0.85 ? "auto" : "none";
    const hidden = opacity < 0.15;
    el.inert = hidden;
    el.setAttribute("aria-hidden", String(hidden));
  }
  const phase = active === "board" ? 1 : active === "return" ? 2 : 0;
  document.querySelectorAll(".chapter-nav button").forEach((b, i) => {
    if (i === phase) b.setAttribute("aria-current", "step");
    else b.removeAttribute("aria-current");
  });
  document.querySelector("#surf-scroll-instruction").textContent =
    phase === 0
      ? text("Scrollen, um näherzukommen", "Scroll to move closer")
      : phase === 1
        ? text("Weiterscrollen, um herauszuzoomen", "Scroll to zoom out")
        : text("Weiterscrollen zu Folio", "Scroll to Folio");
  document.querySelector("#surf-progress-fill").style.width =
    `${progress * 100}%`;
  currentPhase = active;
}
function resize() {
  if (!renderer) return;
  const w = stage.clientWidth,
    h = stage.clientHeight;
  renderer.setPixelRatio(Math.min(devicePixelRatio, narrow() ? 1.5 : 1.7));
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = narrow() ? 49 : 42;
  camera.updateProjectionMatrix();
  onScroll();
  requestFrame();
}
window.addEventListener("resize", resize, { passive: true });
function requestFrame() {
  if (
    renderer &&
    !frame &&
    visible &&
    !document.hidden &&
    !root.classList.contains("no-webgl")
  )
    frame = requestAnimationFrame(draw);
}
function draw(now) {
  frame = 0;
  if (!renderer || !visible) return;
  const dt = Math.min((now - last) / 1000, 0.045);
  last = now;
  if (!paused && !reduced) time += dt;
  progress = reduced ? 0 : mix(progress, wantedProgress, 1 - Math.exp(-dt * 9));
  if (Math.abs(progress - wantedProgress) < 0.0003) progress = wantedProgress;
  const state = phaseState(progress),
    z = state.zoom;
  aim.lerp(
    paused || reduced ? new THREE.Vector2() : mouse,
    1 - Math.exp(-dt * 3),
  );
  waterUniforms.uTime.value = time;
  breaker.update(time);
  rig.position.set(2.7 + Math.sin(time * 0.24) * 0.2, 0, z * 1.3);
  rig.rotation.set(
    clamp(
      (waterY(rig.position.x, rig.position.z - 0.1, time) -
        waterY(rig.position.x, rig.position.z + 0.1, time)) *
        4,
      -0.22,
      0.22,
    ) *
      (1 - z * 0.8),
    -0.42 + aim.x * 0.12 * (1 - z),
    Math.sin(time * 0.9) * 0.035 - aim.x * 0.045 * (1 - z),
  );
  // Keep the whole hull above the curved surface, including during the reveal.
  let waterline = -Infinity;
  for (const x of [-0.45, 0.45]) {
    for (const depth of [-2.1, -1, 0, 1, 2.1]) {
      const sample = new THREE.Vector3(x, 0, depth).applyEuler(rig.rotation);
      waterline = Math.max(
        waterline,
        waterY(rig.position.x + sample.x, rig.position.z + sample.z, time) -
          sample.y,
      );
    }
  }
  rig.position.y = mix(waterline + 0.08, 1.05, z);
  rider.rotation.z = Math.sin(time * 0.9 + 0.4) * 0.017 + aim.x * 0.035;
  head.rotation.y = 0.55 + aim.x * 0.05;
  const personOpacity = 1 - smooth(0.15, 0.76, z);
  rider.visible = personOpacity > 0.005;
  riderMaterials.forEach((m) => {
    m.opacity = personOpacity;
    m.depthWrite = personOpacity > 0.99;
  });
  deck.position.y = 0.4 + z * 1.2;
  core.position.y = 0.2 + z * 0.6;
  stripe.position.y = deck.position.y + 0.21;
  stripeMaterial.opacity = 1 - z * 0.9;
  inner.position.y = core.position.y;
  sources.position.y = deck.position.y;
  const reveal = smooth(0.2, 0.8, z);
  [
    paperMaterial,
    sourceLinesMaterial,
    nodeMaterial,
    circuitMaterial,
    packetMaterial,
  ].forEach((m) => (m.opacity = reveal));
  labels.forEach(({ mesh, part }) => {
    mesh.position.y = part.position.y + 0.09;
    mesh.material.opacity = reveal;
  });
  packets.forEach((m, i) =>
    m.position.set(
      Math.sin(i * 2.4) * 0.34,
      0.24,
      ((time * 0.42 + i * 0.55) % 3.2) - 1.6,
    ),
  );
  let gi = 0;
  for (const x of [-0.5, 0.5])
    for (const depth of [-1.4, 1.4]) {
      for (const y of [0.2, deck.position.y]) {
        guideArray[gi++] = x;
        guideArray[gi++] = y;
        guideArray[gi++] = depth;
      }
    }
  guideGeometry.attributes.position.needsUpdate = true;
  guides.material.opacity = reveal * 0.27;
  for (let i = 0; i < 90; i++) {
    const age = (time * 0.48 + i / 90) % 1;
    const local = new THREE.Vector3(
      Math.sin(i * 9.12) * (0.1 + age * 0.65),
      0,
      1.7 + age * 4.5,
    );
    local.applyAxisAngle(new THREE.Vector3(0, 1, 0), rig.rotation.y);
    const x = rig.position.x + local.x,
      zz = rig.position.z + local.z;
    sprayArray[i * 3] = x;
    sprayArray[i * 3 + 1] =
      waterY(x, zz, time) + 0.035 + Math.sin(age * Math.PI) * 0.09;
    sprayArray[i * 3 + 2] = zz;
  }
  sprayGeometry.attributes.position.needsUpdate = true;
  sprayMaterial.opacity = 0.6 * (1 - z * 0.8);
  birds.forEach(({ g, wings }, i) => {
    const t = time * 0.13 + i * 2.3;
    g.position.set(
      (i ? -3.8 : 3.0) + Math.sin(t) * 1.7,
      5.3 + i * 0.15 + Math.sin(t * 0.8) * 0.24,
      -4 - i * 7,
    );
    g.rotation.set(0.05, Math.sin(t) * 0.36, 0.08 * Math.cos(t));
    g.scale.setScalar(i ? 0.85 : 1.0);
    wings.forEach(
      (w, j) =>
        (w.rotation.z =
          (j ? 1 : -1) * (0.08 + Math.sin(time * 1.8 + i) * 0.19)),
    );
  });
  if (narrow()) {
    startCamera.set(10.5, 8.4, 16);
    startTarget.set(1.8, 2.65, 0);
    closeCamera.set(10.4, 7.5, 6.2);
    closeTarget.set(3.05, 3.6, 1.3);
    closeCamera
      .sub(closeTarget)
      .multiplyScalar(1.2 * Math.max(1, 390 / innerWidth))
      .add(closeTarget);
  } else {
    startCamera.set(10, 5.5, 14);
    startTarget.set(-1.0, 1.4, 0);
    closeCamera.set(8.8, 4.1, 5.0);
    closeTarget.set(0.45, 1.75, 1.3);
  }
  camera.position.copy(startCamera).lerp(closeCamera, z);
  camera.position.x += aim.x * 0.55 * (1 - z * 0.85);
  camera.position.y += aim.y * 0.24 * (1 - z * 0.85);
  look.copy(startTarget).lerp(closeTarget, z);
  look.y += rig.position.y * 0.25 * z;
  camera.lookAt(look);
  updateCopy(state);
  renderer.render(scene, camera);
  if (!root.classList.contains("ready")) {
    root.classList.add("ready");
    document
      .querySelector(".scene-loading")
      .setAttribute("aria-hidden", "true");
  }
  window.__surfScene = {
    available: true,
    progress,
    phase: currentPhase,
    zoom: z,
    time,
    reduced,
    paused,
    birds: birds.length,
    layers: [shell.position.y, core.position.y, deck.position.y],
    breaker: true,
    headYaw: head.rotation.y,
    torsoYaw: body.rotation.y,
    drawCalls: renderer.info.render.calls,
    triangles: renderer.info.render.triangles,
    camera: camera.position.toArray(),
    target: look.toArray(),
    board: rig.position.toArray(),
    mouse: aim.toArray(),
  };
  if (
    (!paused && !reduced) ||
    Math.abs(progress - wantedProgress) > 0.0001 ||
    (aim.distanceTo(mouse) > 0.005 && !paused && !reduced)
  )
    requestFrame();
}
if (renderer) {
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const observer = new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      if (visible) {
        last = performance.now();
        requestFrame();
      } else if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    },
    { threshold: 0 },
  );
  observer.observe(stage);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    } else {
      last = performance.now();
      requestFrame();
    }
  });
  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    root.classList.add("no-webgl");
    root.classList.remove("animated");
    updateCopy(phaseState(0));
    syncMotion();
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  });
  syncMotion();
  resize();
  onScroll();
  requestFrame();
  // Preserve direct links when the enhanced scene extends the page after load.
  const anchor =
    location.hash && document.getElementById(location.hash.slice(1));
  if (anchor && !root.contains(anchor))
    requestAnimationFrame(() => anchor.scrollIntoView({ behavior: "instant" }));
}
