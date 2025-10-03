// Simple proxy to import manual-emitter source without circular workspace deps in tests
export function proxy() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const emit = require('../../packages/manual-emitter/src/emit');
  return emit;
}


