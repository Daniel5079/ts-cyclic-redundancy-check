# ts-cyclic-redundancy-check

Computes CRC-32 (IEEE 802.3) checksums over byte buffers for data integrity verification.

```js
import { crc32, crc32Hex, createCrc32 } from 'ts-cyclic-redundancy-check';

const bytes = new TextEncoder().encode('123456789');

crc32(bytes);        // 3421780262  (0xcbf43926)
crc32Hex(bytes);     // 'cbf43926'

// Streaming form, for data that arrives in pieces:
const crc = createCrc32();
crc.update(bytes.subarray(0, 4));
crc.update(bytes.subarray(4));
crc.digestHex();     // 'cbf43926'
```

## Why this exists

CRC-32 is small enough to write from scratch, but the details are easy to get
wrong: the polynomial is reflected, the initial register is all ones, and the
final value is XORed with all ones. This library implements the standard
IEEE 802.3 variant (reflected polynomial `0xEDB88320`) that matches `crc32`,
`gzip`, and `zlib` — not the non-reflected CRC-32 used by some older protocols.

It has no dependencies and works on any byte-like input. The trade-off is
scope: this is a single algorithm with a single, fixed polynomial. If you need
CRC-16, CRC-64, or a configurable polynomial, this library will not do it.

## The awkward edge

`crc32('hello')` throws. A JavaScript string is not a byte buffer — its
characters may be multi-byte — so the library refuses to guess an encoding.
Encode first with `new TextEncoder().encode(...)` (UTF-8) or a `Buffer` if you
are in Node. Plain `number[]` input is accepted, but every element must be an
integer in `[0, 255]`; anything else throws a `TypeError` rather than silently
masking the value.

The incremental `createCrc32()` object does not reset after `digest()`, so
digesting twice returns the same value. Call `reset()` if you want to reuse the
instance.

## API

- `crc32(input)` — returns the checksum as an unsigned 32-bit integer.
- `crc32Hex(input)` — returns the checksum as an 8-character lowercase hex string.
- `createCrc32()` — returns an incremental calculator with `update(chunk)`
  (chainable), `digest()`, `digestHex()`, and `reset()`.

`input` may be a `Uint8Array`, an `ArrayBuffer`, any typed-array view, or a
`number[]` of byte values.
