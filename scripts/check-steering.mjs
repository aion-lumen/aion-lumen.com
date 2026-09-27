import assert from 'node:assert/strict';
import { advanceHeading, followingTurn } from '../styles/surf-steering.mjs';

function run(heading, pointer, seconds, zoom = 0, moving = true) {
  for (let i = 0; i < seconds * 60; i++) {
    heading = advanceHeading(heading, pointer, 1 / 60, zoom, moving);
  }
  return heading;
}
assert.equal(run(0, -1, 30), Math.PI / 2);
assert.equal(run(0, 1, 30), -Math.PI / 2);
assert.equal(run(0.7, 0, 5), 0.7);
assert.equal(run(0.7, 0.1, 5), 0.7);
assert.equal(run(0.7, 1, 5, 0, false), 0.7);
assert.equal(run(Math.PI / 2, 0, 5, 1), 0);
assert.ok(run(Math.PI / 2, 1, 1) < Math.PI / 2);
assert.ok(Math.abs(run(0, -1, 1) - 18 * Math.PI / 180) < 1e-10);
console.log('PASS: 8 steering checks — 180° arc, neutral, pause, zoom return, reversal, speed');

const azimuth = Math.atan2(7.3, 14);
const left = followingTurn(Math.PI / 2, azimuth, 0);
const right = followingTurn(-Math.PI / 2, azimuth, 0);
assert.ok(left > 0 && right < 0, 'left input must turn the following view left');
assert.ok(Math.abs(left - right - Math.PI) < 1e-10);
assert.ok(Math.abs(azimuth + left - Math.PI / 2) < 1e-10);
assert.ok(Math.abs(azimuth + right + Math.PI / 2) < 1e-10);
assert.equal(followingTurn(1, azimuth, 1), 0);
// The coast is left of the initial camera bearing: a small left turn
// must reduce its angular distance from the forward direction.
const coastBearing = Math.atan2(21.7, 33);
const smallLeft = followingTurn(0.15, azimuth, 0);
assert.ok(Math.abs(coastBearing - azimuth - smallLeft) < Math.abs(coastBearing - azimuth));
console.log('PASS: following-camera direction, coast bearing, 180° bounds and zoom reset');
