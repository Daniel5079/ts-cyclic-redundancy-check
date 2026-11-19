const TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  TABLE[n] = c >>> 0;
}

function toBytes(input) {
  if (input instanceof Uint8Array) return input;
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  if (ArrayBuffer.isView(input)) {
    return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  }
  if (Array.isArray(input)) {
    const out = new Uint8Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const v = input[i];
      if (!Number.isInteger(v) || v < 0 || v > 255) {
        throw new TypeError('byte array element out of range: ' + v);
      }
      out[i] = v;
    }
    return out;
  }
  throw new TypeError('crc32 expects Uint8Array, ArrayBuffer, typed array, or number[]');
}

function update(state, bytes) {
  let crc = state;
  for (let i = 0; i < bytes.length; i++) {
    crc = TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return crc >>> 0;
}

/**
 * Computes the CRC-32 (IEEE 802.3, reflected polynomial 0xEDB88320) of the
 * given input and returns it as an unsigned 32-bit integer.
 *
 * The input may be a Uint8Array, ArrayBuffer, any typed array view, or a
 * plain number[] whose elements are integers in [0, 255].
 */
export function crc32(input) {
  const bytes = toBytes(input);
  const crc = update(0xffffffff, bytes) ^ 0xffffffff;
  return crc >>> 0;
}

/**
 * Same as crc32, but returns the checksum as a lowercase, zero-padded hex
 * string of exactly 8 characters. This is the form usually printed by
 * `crc32` command-line tools.
 */
export function crc32Hex(input) {
  return crc32(input).toString(16).padStart(8, '0');
}

/**
 * Incremental CRC-32 calculator. Useful for streaming: feed chunks as they
 * arrive and call digest() once at the end.
 *
 * The digest() method does not reset the state, so it may be called more than
 * once; callers who need to start over should create a new instance. This is a
 * deliberate choice: it keeps the object cheap and avoids surprising the
 * caller with implicit mutation of the accumulated checksum.
 */
export function createCrc32() {
  let state = 0xffffffff;
  return {
    update(chunk) {
      state = update(state, toBytes(chunk));
      return this;
    },
    digest() {
      return (state ^ 0xffffffff) >>> 0;
    },
    digestHex() {
      return ((state ^ 0xffffffff) >>> 0).toString(16).padStart(8, '0');
    },
    reset() {
      state = 0xffffffff;
      return this;
    },
  };
}
