import assert from "node:assert/strict";
import fs from "node:fs";
import * as THREE from "../assets/surf/three.module.min.js";
import { GLTFLoader } from "../assets/surf/GLTFLoader.js";
import { createSurferBalance } from "../styles/surf-balance.mjs";

const bytes = fs.readFileSync(new URL("../assets/surf/surfer.glb", import.meta.url));
const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "");
const model = gltf.scene, rig = new THREE.Group(), scene = new THREE.Scene();
scene.rotation.y = Math.PI; scene.position.x = 5.4;
scene.add(rig); rig.add(model);
const mixer = new THREE.AnimationMixer(model);
mixer.clipAction(gltf.animations[0]).play(); mixer.setTime(0);
model.updateMatrixWorld(true);
const bounds = new THREE.Box3().setFromObject(model, true);
model.scale.setScalar(2.25 / (bounds.max.y - bounds.min.y));
model.position.y = 0.61 - bounds.min.y * model.scale.x;
model.rotation.y = 1.55;
model.updateWorldMatrix(true, true);
const bones = {};
model.traverse((bone) => { if (bone.isBone) bones[bone.name] = bone; });
const at = (name) => model.worldToLocal(bones[name].getWorldPosition(new THREE.Vector3()));
const rotation = (name) => bones[name].getWorldQuaternion(new THREE.Quaternion())
  .premultiply(model.getWorldQuaternion(new THREE.Quaternion()).invert()).normalize();
const snapshot = () => Object.values(bones).flatMap((bone) => [...bone.position.toArray(), ...bone.quaternion.toArray()]);
const feet = ["L", "R"].map((side) => ({ side, position: at("foot" + side), rotation: rotation("foot" + side),
  upper: at("upperleg01" + side).distanceTo(at("lowerleg01" + side)),
  lower: at("lowerleg01" + side).distanceTo(at("foot" + side)),
}));
const balance = createSurferBalance(model);
let drift = 0, soleError = 0, minKnee = 180, maxKnee = 0, minBend = Infinity;
let minHeight = Infinity, maxHeight = -Infinity;
const timings = [];
for (let i = 0; i < 3600; i++) {
  const t = i / 60;
  rig.position.set(2.7 + Math.sin(t * 0.24) * 0.2, 0.9 + Math.sin(t * 0.68) * 0.45, Math.sin(t * 0.3) * 0.6);
  rig.rotation.set(Math.sin(t * 0.9) * 0.22, Math.PI + Math.sin(t * 0.11) * Math.PI / 2, Math.sin(t * 0.7) * 0.11);
  const start = performance.now();
  balance.update({ dt: 1 / 60, turn: Math.sin(t * 0.3), heading: Math.sin(t * 0.11) * Math.PI / 2 });
  timings.push(performance.now() - start);
  for (const f of feet) {
    const hip = at("upperleg01" + f.side), knee = at("lowerleg01" + f.side), ankle = at("foot" + f.side);
    const angle = hip.clone().sub(knee).angleTo(ankle.clone().sub(knee)) * 180 / Math.PI;
    drift = Math.max(drift, ankle.distanceTo(f.position));
    soleError = Math.max(soleError, rotation("foot" + f.side).angleTo(f.rotation));
    minKnee = Math.min(minKnee, angle); maxKnee = Math.max(maxKnee, angle);
    minBend = Math.min(minBend, knee.z - Math.max(hip.z, ankle.z));
    assert.ok(Math.abs(hip.distanceTo(knee) - f.upper) < 1e-5, "Thigh stretched");
    assert.ok(Math.abs(knee.distanceTo(ankle) - f.lower) < 1e-5, "Shin stretched");
  }
  const height = at("root").y;
  minHeight = Math.min(minHeight, height); maxHeight = Math.max(maxHeight, height);
  assert.ok(snapshot().every(Number.isFinite), "Invalid joint transform");
}
assert.ok(drift < 1e-5, `Feet drift: ${drift}`);
assert.ok(soleError < 1e-5, `Sole rotates: ${soleError}`);
assert.ok(minKnee > 70 && maxKnee < 155, `Knee range: ${minKnee}–${maxKnee}`);
assert.ok(minBend > 0.1, "Knee bends behind the stance");
assert.ok(maxHeight - minHeight > 0.02, "Missing crouch response");
const paused = snapshot();
for (let i = 0; i < 100; i++) balance.update({ dt: 1 / 60, turn: -1, moving: false });
assert.deepEqual(snapshot(), paused, "Pause changes the pose");
balance.update({ dt: 0, turn: 1 });
assert.deepEqual(snapshot(), paused, "Zero delta changes the pose");
balance.update({ dt: 1 / 60, visible: false });
assert.deepEqual(snapshot(), paused, "Hidden rider still animates");
timings.sort((a, b) => a - b);
console.log(JSON.stringify({ samples: 3600, maxFootDrift: drift, maxSoleRotationRadians: soleError,
  kneeDegrees: [minKnee, maxKnee], minForwardBend: minBend, crouchTravel: maxHeight - minHeight,
  controllerCpuMs: { median: timings[1800], p95: timings[3420] },
  notes: "Node CPU measurement, not browser FPS; wave, both steering directions, fixed feet, joint limits, pause and hidden rider checked." }, null, 2));
