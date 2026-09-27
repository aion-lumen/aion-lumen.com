import assert from 'node:assert/strict';
import { advanceHeading } from '../styles/surf-steering.mjs';

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
assert.ok(Math.abs(run(0, -1, 1) - 28 * Math.PI / 180) < 1e-10);
console.log('PASS: 8 steering checks — 180° arc, neutral, pause, zoom return, reversal, speed');
