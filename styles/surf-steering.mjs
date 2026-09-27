const limit = Math.PI / 2;
const speed = 28 * Math.PI / 180;
const deadZone = 0.12;

// A 180-degree arc around the starting heading, never a full turn.
export function advanceHeading(heading, pointer, dt, zoom, moving = true) {
  if (zoom > 0.01) {
    const next = heading * Math.exp(-dt * 6 * zoom);
    return Math.abs(next) < 0.0001 ? 0 : next;
  }
  if (!moving || Math.abs(pointer) <= deadZone) return heading;
  const input = Math.sign(pointer) * (Math.min(1, Math.abs(pointer)) - deadZone) / (1 - deadZone);
  return Math.max(-limit, Math.min(limit, heading - input * speed * dt));
}
