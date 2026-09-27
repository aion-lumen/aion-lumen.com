const limit = Math.PI / 2;
const speed = 18 * Math.PI / 180;
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

// Left input turns both rider and following camera left in a fixed world.
// Keep the full half-circle on the open face of the wave.
export function followingTurn(heading, initialAzimuth, zoom) {
  return (heading - initialAzimuth * Math.abs(heading) / limit) * (1 - zoom);
}

// The wave crest runs along X. Local +Z points away from its face.
// Both end stops therefore run parallel to the crest, never into it.
export function riderYaw(heading, zoom) {
  const bounded = Math.max(-limit, Math.min(limit, heading));
  return (Math.PI + bounded) * (1 - zoom) - 0.42 * zoom;
}
