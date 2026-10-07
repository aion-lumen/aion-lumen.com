import * as THREE from "../assets/surf/three.module.min.js";

// Add small, wave-driven corrections to the authored pose. The two-bone leg
// solve preserves its bend direction, segment lengths and deck-relative soles.
export function createSurferBalance(model) {
  const bones = {};
  model.traverse((object) => {
    if (object.isBone) bones[object.name] = object;
  });
  const names = ["root", "spine05", "spine03", "spine01", "neck01", "neck02", "neck03", "head"];
  for (const side of ["L", "R"])
    names.push(...["upperarm01", "lowerarm01", "upperleg01", "lowerleg01", "foot"].map((name) => name + side));
  const rest = names.map((name) => ({
    bone: bones[name], position: bones[name].position.clone(), quaternion: bones[name].quaternion.clone(),
  }));
  const V = () => new THREE.Vector3();
  const Q = () => new THREE.Quaternion();
  const modelRotation = Q(), inverseRotation = Q(), parentRotation = Q(), rotation = Q(), delta = Q();
  const axis = V(), up = V(), scale = V(), location = V();
  const hip = V(), knee = V(), ankle = V(), target = V(), direction = V(), bend = V();
  const desiredKnee = V(), from = V(), to = V(), pole = V();
  model.updateWorldMatrix(true, true);
  model.getWorldQuaternion(modelRotation);
  inverseRotation.copy(modelRotation).invert();
  model.getWorldScale(scale);
  const legs = ["L", "R"].map((side) => {
    const upper = bones["upperleg01" + side], lower = bones["lowerleg01" + side], foot = bones["foot" + side];
    upper.getWorldPosition(hip); lower.getWorldPosition(knee); foot.getWorldPosition(ankle);
    return {
      upper, lower, foot,
      upperLength: hip.distanceTo(knee) / scale.x,
      lowerLength: knee.distanceTo(ankle) / scale.x,
      target: model.worldToLocal(ankle.clone()),
      pole: model.worldToLocal(knee.clone()),
      sole: foot.getWorldQuaternion(Q()).premultiply(inverseRotation).normalize(),
    };
  });
  const state = { x: 0, z: 0, crouch: 0, pitch: 0, roll: 0, arms: 0, gaze: 0 };
  let previousHeight = null;
  const clamp = THREE.MathUtils.clamp;
  const approach = (key, value, dt, speed = 6) => {
    state[key] += (value - state[key]) * (1 - Math.exp(-dt * speed));
  };
  function worldRotation(bone, quaternion) {
    bone.parent.getWorldQuaternion(parentRotation).invert();
    bone.quaternion.copy(parentRotation).multiply(quaternion).normalize();
    bone.updateWorldMatrix(false, true);
  }
  function rotate(bone, x, y, z, angle) {
    axis.set(x, y, z).applyQuaternion(modelRotation);
    delta.setFromAxisAngle(axis, angle);
    bone.getWorldQuaternion(rotation).premultiply(delta);
    worldRotation(bone, rotation);
  }
  function pointSegment(bone, end, desired) {
    bone.getWorldPosition(ankle);
    end.getWorldPosition(to).sub(ankle).normalize();
    from.copy(desired).sub(ankle).normalize();
    delta.setFromUnitVectors(to, from);
    bone.getWorldQuaternion(rotation).premultiply(delta);
    worldRotation(bone, rotation);
  }
  function solveLeg(leg) {
    leg.upper.getWorldPosition(hip);
    target.copy(leg.target).applyMatrix4(model.matrixWorld);
    pole.copy(leg.pole).applyMatrix4(model.matrixWorld);
    direction.copy(target).sub(hip);
    const distance = direction.length();
    direction.divideScalar(distance);
    const upper = leg.upperLength * scale.x, lower = leg.lowerLength * scale.x;
    const reach = clamp(distance, Math.abs(upper - lower) + 0.0001, upper + lower - 0.0001);
    const along = (upper * upper - lower * lower + reach * reach) / (2 * reach);
    bend.copy(pole).sub(hip).addScaledVector(direction, -bend.dot(direction)).normalize();
    desiredKnee.copy(hip).addScaledVector(direction, along)
      .addScaledVector(bend, Math.sqrt(Math.max(0, upper * upper - along * along)));
    pointSegment(leg.upper, leg.lower, desiredKnee);
    pointSegment(leg.lower, leg.foot, target);
    rotation.copy(modelRotation).multiply(leg.sole);
    worldRotation(leg.foot, rotation);
  }
  return {
    update({ dt, turn = 0, heading = 0, moving = true, visible = true }) {
      model.updateWorldMatrix(true, false);
      model.getWorldPosition(location);
      const height = location.y;
      const velocity = previousHeight === null || !moving || !visible || dt <= 0
        ? 0 : clamp((height - previousHeight) / dt, -2, 2);
      previousHeight = height;
      if (!moving || !visible || dt <= 0) return;
      dt = Math.min(dt, 0.045);
      model.getWorldQuaternion(modelRotation);
      model.getWorldScale(scale);
      inverseRotation.copy(modelRotation).invert();
      up.set(0, 1, 0).applyQuaternion(inverseRotation);
      const slopeX = clamp(up.x, -0.35, 0.35), slopeZ = clamp(up.z, -0.35, 0.35);
      turn = clamp(turn, -1, 1);
      approach("x", slopeX * 0.16 - turn * 0.018, dt);
      approach("z", slopeZ * 0.12 + turn * 0.012, dt);
      approach("crouch", Math.abs(velocity) * 0.022 + Math.abs(slopeX) * 0.12 + Math.abs(slopeZ) * 0.08 + Math.abs(turn) * 0.025, dt, 8);
      approach("pitch", slopeZ * 0.32, dt);
      approach("roll", -slopeX * 0.36 - turn * 0.025, dt);
      approach("arms", slopeX * 0.55 + turn * 0.12, dt, 4);
      approach("gaze", clamp(turn * 0.20 + heading * 0.055, -0.28, 0.28), dt, 7);
      for (const { bone, position, quaternion } of rest) {
        bone.position.copy(position); bone.quaternion.copy(quaternion);
      }
      // The armature root uses the exported model's Y-up coordinate frame.
      bones.root.position.add(location.set(state.x, -state.crouch, state.z));
      model.updateWorldMatrix(false, true);
      for (const name of ["spine05", "spine03", "spine01"]) {
        rotate(bones[name], 1, 0, 0, state.pitch / 3);
        rotate(bones[name], 0, 0, 1, state.roll / 3);
      }
      for (const [side, sign] of [["L", 1], ["R", -1]]) {
        rotate(bones["upperarm01" + side], 0, 0, 1, state.arms + sign * state.crouch * 0.7);
        rotate(bones["upperarm01" + side], 1, 0, 0, -state.pitch * 0.5);
        rotate(bones["lowerarm01" + side], 0, 1, 0, sign * state.crouch * 0.5);
      }
      for (const name of ["neck01", "neck02", "neck03", "head"])
        rotate(bones[name], 0, 1, 0, state.gaze / 4);
      for (const leg of legs) solveLeg(leg);
    },
  };
}
