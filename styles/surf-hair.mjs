import * as THREE from "../assets/surf/three.module.min.js";

// A fuller crown and a single mesh of tapered locks. Wind bends the tips in
// the vertex shader before skinning; roots stay attached to the existing head.
export function createWindHair(model) {
  const hair = model.getObjectByName("Short_swept_hair");
  const headIndex = hair.skeleton.bones.findIndex((bone) => bone.name === "head");
  const head = hair.skeleton.bones[headIndex];
  const smooth = THREE.MathUtils.smoothstep;
  hair.geometry = hair.geometry.clone();
  const points = hair.geometry.getAttribute("position");
  const crownWeight = new Float32Array(points.count), crownPhase = new Float32Array(points.count);
  for (let i = 0; i < points.count; i++) {
    const x = points.getX(i), y = points.getY(i), z = points.getZ(i);
    const crown = smooth(y, 1.665, 1.765);
    points.setXYZ(i, x * (1 + crown * 0.10), y + crown * 0.022, z - crown * 0.006);
    crownWeight[i] = crown * 0.035;
    crownPhase[i] = x * 39 + z * 28;
  }
  points.needsUpdate = true;
  hair.geometry.computeVertexNormals();
  hair.geometry.computeBoundingBox();
  hair.geometry.computeBoundingSphere();
  hair.geometry.setAttribute("hairWeight", new THREE.BufferAttribute(crownWeight, 1));
  hair.geometry.setAttribute("hairPhase", new THREE.BufferAttribute(crownPhase, 1));

  const position = [], color = [], uv = [], skinIndex = [], skinWeight = [], weight = [], phase = [], indices = [];
  const scalp = new THREE.Mesh(hair.geometry, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
  const ray = new THREE.Raycaster(), tangent = new THREE.Vector3(), side = new THREE.Vector3(), normal = new THREE.Vector3();
  const down = new THREE.Vector3(0, -1, 0), cross = new THREE.Vector3(1, 0, 0);
  const base = new THREE.Color("#302017"), highlight = new THREE.Color("#58402c");
  let locks = 0;
  for (let row = 0; row < 6; row++) for (let col = 0; col < 8; col++) {
    const x = -0.061 + col * (0.122 / 7), z = -0.020 + row * 0.0264;
    ray.set(new THREE.Vector3(x, 1.95, z), down);
    const hit = ray.intersectObject(scalp, false)[0];
    if (!hit) continue;
    const variation = 0.5 + 0.5 * Math.sin(row * 9.17 + col * 4.31);
    const root = hit.point.clone(); root.y -= 0.004;
    const sweep = 0.038 + variation * 0.023, lift = 0.016 + variation * 0.014;
    const curve = new THREE.CubicBezierCurve3(root,
      root.clone().add(new THREE.Vector3(0.005, lift, -0.015)),
      root.clone().add(new THREE.Vector3(0.016, lift * 1.12, -sweep * 0.65)),
      root.clone().add(new THREE.Vector3(0.019, lift * 0.30, -sweep)));
    const offset = position.length / 3, rings = 8, sides = 5;
    for (let ring = 0; ring <= rings; ring++) {
      const t = ring / rings, centre = curve.getPoint(t);
      tangent.copy(curve.getTangent(t)).normalize();
      side.crossVectors(tangent, cross).normalize(); normal.crossVectors(side, tangent).normalize();
      const radius = (0.0060 + variation * 0.0018) * (0.88 + Math.sin(t * Math.PI) * 0.35) * (1 - t * 0.96);
      for (let j = 0; j < sides; j++) {
        const angle = j / sides * Math.PI * 2;
        const vertex = centre.clone().addScaledVector(side, Math.cos(angle) * radius)
          .addScaledVector(normal, Math.sin(angle) * radius * 0.70);
        position.push(...vertex.toArray());
        const tint = base.clone().lerp(highlight, 0.12 + variation * 0.16 + Math.max(0, Math.sin(angle)) * 0.10);
        color.push(tint.r, tint.g, tint.b); uv.push(t, j / sides);
        skinIndex.push(headIndex, 0, 0, 0); skinWeight.push(1, 0, 0, 0);
        weight.push(t * t); phase.push(row * 1.71 + col * 2.43);
        if (ring < rings) {
          const a = offset + ring * sides + j, b = offset + ring * sides + (j + 1) % sides;
          indices.push(a, a + sides, b, b, a + sides, b + sides);
        }
      }
    }
    locks++;
  }
  scalp.material.dispose();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(position, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(color, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geometry.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(skinIndex, 4));
  geometry.setAttribute("skinWeight", new THREE.Float32BufferAttribute(skinWeight, 4));
  geometry.setAttribute("hairWeight", new THREE.Float32BufferAttribute(weight, 1));
  geometry.setAttribute("hairPhase", new THREE.Float32BufferAttribute(phase, 1));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  const uniforms = { hairTime: { value: 0 }, hairWind: { value: new THREE.Vector3(0, 0.05, -1) } };
  // Clone so eyebrows, which use the same base material, stay completely still.
  const material = hair.material.clone();
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = "uniform float hairTime;\nuniform vec3 hairWind;\nattribute float hairWeight;\nattribute float hairPhase;\n" + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", `
      #include <begin_vertex>
      float gust = 0.70 + 0.30 * sin(hairTime * 1.35 + hairPhase * 0.23);
      float flutter = sin(hairTime * 6.4 + hairPhase);
      transformed += hairWind * hairWeight * (0.011 * gust + 0.004 * flutter);
      transformed.y += hairWeight * 0.0025 * sin(hairTime * 4.7 + hairPhase * 1.3);
    `);
  };
  material.customProgramCacheKey = () => "folio-wind-hair-v1";
  hair.material = material;
  const tufts = new THREE.SkinnedMesh(geometry, material);
  tufts.name = "Wind_swept_locks";
  tufts.position.copy(hair.position); tufts.quaternion.copy(hair.quaternion); tufts.scale.copy(hair.scale);
  hair.parent.add(tufts); tufts.bind(hair.skeleton, hair.bindMatrix);
  tufts.frustumCulled = false;
  const inverseHead = new THREE.Quaternion(), bindHead = new THREE.Quaternion();
  new THREE.Matrix4().copy(hair.skeleton.boneInverses[headIndex]).invert()
    .decompose(new THREE.Vector3(), bindHead, new THREE.Vector3());
  const direction = new THREE.Vector3();
  return {
    locks,
    update(time, moving) {
      if (!moving) return;
      uniforms.hairTime.value = time;
      head.getWorldQuaternion(inverseHead).invert();
      direction.set(-1, 0.08, 0.2).applyQuaternion(inverseHead).applyQuaternion(bindHead).normalize();
      uniforms.hairWind.value.copy(direction);
    },
  };
}
