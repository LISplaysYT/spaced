// Copyright 2009 The Go Authors. All rights reserved.
// https://github.com/golang/go/blob/master/LICENSE
// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
/** Port of the Go
 * [encoding/hex](https://github.com/golang/go/blob/go1.12.5/src/encoding/hex/hex.go)
 * library.
 *
 * This module is browser compatible.
 *
 * @example
 * ```ts
 * import {
 *   decode,
 *   encode,
 * } from "https://deno.land/std@$STD_VERSION/encoding/hex.ts";
 *
 * const binary = new TextEncoder().encode("abc");
 * const encoded = encode(binary);
 * console.log(encoded);
 * // => Uint8Array(6) [ 54, 49, 54, 50, 54, 51 ]
 *
 * console.log(decode(encoded));
 * // => Uint8Array(3) [ 97, 98, 99 ]
 * ```
 *
 * @module
 */ const hexTable = new TextEncoder().encode("0123456789abcdef");
function errInvalidByte(byte) {
    return new TypeError(`Invalid byte '${String.fromCharCode(byte)}'`);
}
function errLength() {
    return new RangeError("Odd length hex string");
}
/** Converts a hex character into its value. */ function fromHexChar(byte) {
    // '0' <= byte && byte <= '9'
    if (48 <= byte && byte <= 57) return byte - 48;
    // 'a' <= byte && byte <= 'f'
    if (97 <= byte && byte <= 102) return byte - 97 + 10;
    // 'A' <= byte && byte <= 'F'
    if (65 <= byte && byte <= 70) return byte - 65 + 10;
    throw errInvalidByte(byte);
}
/** Encodes `src` into `src.length * 2` bytes. */ export function encode(src) {
    const dst = new Uint8Array(src.length * 2);
    for(let i = 0; i < dst.length; i++){
        const v = src[i];
        dst[i * 2] = hexTable[v >> 4];
        dst[i * 2 + 1] = hexTable[v & 0x0f];
    }
    return dst;
}
/**
 * Decodes `src` into `src.length / 2` bytes.
 * If the input is malformed, an error will be thrown.
 */ export function decode(src) {
    const dst = new Uint8Array(src.length / 2);
    for(let i = 0; i < dst.length; i++){
        const a = fromHexChar(src[i * 2]);
        const b = fromHexChar(src[i * 2 + 1]);
        dst[i] = a << 4 | b;
    }
    if (src.length % 2 == 1) {
        // Check for invalid char before reporting bad length,
        // since the invalid char (if present) is an earlier problem.
        fromHexChar(src[dst.length * 2]);
        throw errLength();
    }
    return dst;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE3My4wL2VuY29kaW5nL2hleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAwOSBUaGUgR28gQXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9nb2xhbmcvZ28vYmxvYi9tYXN0ZXIvTElDRU5TRVxuLy8gQ29weXJpZ2h0IDIwMTgtMjAyMyB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cblxuLyoqIFBvcnQgb2YgdGhlIEdvXG4gKiBbZW5jb2RpbmcvaGV4XShodHRwczovL2dpdGh1Yi5jb20vZ29sYW5nL2dvL2Jsb2IvZ28xLjEyLjUvc3JjL2VuY29kaW5nL2hleC9oZXguZ28pXG4gKiBsaWJyYXJ5LlxuICpcbiAqIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHNcbiAqIGltcG9ydCB7XG4gKiAgIGRlY29kZSxcbiAqICAgZW5jb2RlLFxuICogfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9lbmNvZGluZy9oZXgudHNcIjtcbiAqXG4gKiBjb25zdCBiaW5hcnkgPSBuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUoXCJhYmNcIik7XG4gKiBjb25zdCBlbmNvZGVkID0gZW5jb2RlKGJpbmFyeSk7XG4gKiBjb25zb2xlLmxvZyhlbmNvZGVkKTtcbiAqIC8vID0+IFVpbnQ4QXJyYXkoNikgWyA1NCwgNDksIDU0LCA1MCwgNTQsIDUxIF1cbiAqXG4gKiBjb25zb2xlLmxvZyhkZWNvZGUoZW5jb2RlZCkpO1xuICogLy8gPT4gVWludDhBcnJheSgzKSBbIDk3LCA5OCwgOTkgXVxuICogYGBgXG4gKlxuICogQG1vZHVsZVxuICovXG5cbmNvbnN0IGhleFRhYmxlID0gbmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKFwiMDEyMzQ1Njc4OWFiY2RlZlwiKTtcblxuZnVuY3Rpb24gZXJySW52YWxpZEJ5dGUoYnl0ZTogbnVtYmVyKSB7XG4gIHJldHVybiBuZXcgVHlwZUVycm9yKGBJbnZhbGlkIGJ5dGUgJyR7U3RyaW5nLmZyb21DaGFyQ29kZShieXRlKX0nYCk7XG59XG5cbmZ1bmN0aW9uIGVyckxlbmd0aCgpIHtcbiAgcmV0dXJuIG5ldyBSYW5nZUVycm9yKFwiT2RkIGxlbmd0aCBoZXggc3RyaW5nXCIpO1xufVxuXG4vKiogQ29udmVydHMgYSBoZXggY2hhcmFjdGVyIGludG8gaXRzIHZhbHVlLiAqL1xuZnVuY3Rpb24gZnJvbUhleENoYXIoYnl0ZTogbnVtYmVyKTogbnVtYmVyIHtcbiAgLy8gJzAnIDw9IGJ5dGUgJiYgYnl0ZSA8PSAnOSdcbiAgaWYgKDQ4IDw9IGJ5dGUgJiYgYnl0ZSA8PSA1NykgcmV0dXJuIGJ5dGUgLSA0ODtcbiAgLy8gJ2EnIDw9IGJ5dGUgJiYgYnl0ZSA8PSAnZidcbiAgaWYgKDk3IDw9IGJ5dGUgJiYgYnl0ZSA8PSAxMDIpIHJldHVybiBieXRlIC0gOTcgKyAxMDtcbiAgLy8gJ0EnIDw9IGJ5dGUgJiYgYnl0ZSA8PSAnRidcbiAgaWYgKDY1IDw9IGJ5dGUgJiYgYnl0ZSA8PSA3MCkgcmV0dXJuIGJ5dGUgLSA2NSArIDEwO1xuXG4gIHRocm93IGVyckludmFsaWRCeXRlKGJ5dGUpO1xufVxuXG4vKiogRW5jb2RlcyBgc3JjYCBpbnRvIGBzcmMubGVuZ3RoICogMmAgYnl0ZXMuICovXG5leHBvcnQgZnVuY3Rpb24gZW5jb2RlKHNyYzogVWludDhBcnJheSk6IFVpbnQ4QXJyYXkge1xuICBjb25zdCBkc3QgPSBuZXcgVWludDhBcnJheShzcmMubGVuZ3RoICogMik7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZHN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgdiA9IHNyY1tpXTtcbiAgICBkc3RbaSAqIDJdID0gaGV4VGFibGVbdiA+PiA0XTtcbiAgICBkc3RbaSAqIDIgKyAxXSA9IGhleFRhYmxlW3YgJiAweDBmXTtcbiAgfVxuICByZXR1cm4gZHN0O1xufVxuXG4vKipcbiAqIERlY29kZXMgYHNyY2AgaW50byBgc3JjLmxlbmd0aCAvIDJgIGJ5dGVzLlxuICogSWYgdGhlIGlucHV0IGlzIG1hbGZvcm1lZCwgYW4gZXJyb3Igd2lsbCBiZSB0aHJvd24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZWNvZGUoc3JjOiBVaW50OEFycmF5KTogVWludDhBcnJheSB7XG4gIGNvbnN0IGRzdCA9IG5ldyBVaW50OEFycmF5KHNyYy5sZW5ndGggLyAyKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBkc3QubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBhID0gZnJvbUhleENoYXIoc3JjW2kgKiAyXSk7XG4gICAgY29uc3QgYiA9IGZyb21IZXhDaGFyKHNyY1tpICogMiArIDFdKTtcbiAgICBkc3RbaV0gPSAoYSA8PCA0KSB8IGI7XG4gIH1cblxuICBpZiAoc3JjLmxlbmd0aCAlIDIgPT0gMSkge1xuICAgIC8vIENoZWNrIGZvciBpbnZhbGlkIGNoYXIgYmVmb3JlIHJlcG9ydGluZyBiYWQgbGVuZ3RoLFxuICAgIC8vIHNpbmNlIHRoZSBpbnZhbGlkIGNoYXIgKGlmIHByZXNlbnQpIGlzIGFuIGVhcmxpZXIgcHJvYmxlbS5cbiAgICBmcm9tSGV4Q2hhcihzcmNbZHN0Lmxlbmd0aCAqIDJdKTtcbiAgICB0aHJvdyBlcnJMZW5ndGgoKTtcbiAgfVxuXG4gIHJldHVybiBkc3Q7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsc0RBQXNEO0FBQ3RELG1EQUFtRDtBQUNuRCwwRUFBMEU7QUFFMUU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBdUJDLEdBRUQsTUFBTSxXQUFXLElBQUksY0FBYyxNQUFNLENBQUM7QUFFMUMsU0FBUyxlQUFlLElBQVksRUFBRTtJQUNwQyxPQUFPLElBQUksVUFBVSxDQUFDLGNBQWMsRUFBRSxPQUFPLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNwRTtBQUVBLFNBQVMsWUFBWTtJQUNuQixPQUFPLElBQUksV0FBVztBQUN4QjtBQUVBLDZDQUE2QyxHQUM3QyxTQUFTLFlBQVksSUFBWSxFQUFVO0lBQ3pDLDZCQUE2QjtJQUM3QixJQUFJLE1BQU0sUUFBUSxRQUFRLElBQUksT0FBTyxPQUFPO0lBQzVDLDZCQUE2QjtJQUM3QixJQUFJLE1BQU0sUUFBUSxRQUFRLEtBQUssT0FBTyxPQUFPLEtBQUs7SUFDbEQsNkJBQTZCO0lBQzdCLElBQUksTUFBTSxRQUFRLFFBQVEsSUFBSSxPQUFPLE9BQU8sS0FBSztJQUVqRCxNQUFNLGVBQWUsTUFBTTtBQUM3QjtBQUVBLCtDQUErQyxHQUMvQyxPQUFPLFNBQVMsT0FBTyxHQUFlLEVBQWM7SUFDbEQsTUFBTSxNQUFNLElBQUksV0FBVyxJQUFJLE1BQU0sR0FBRztJQUN4QyxJQUFLLElBQUksSUFBSSxHQUFHLElBQUksSUFBSSxNQUFNLEVBQUUsSUFBSztRQUNuQyxNQUFNLElBQUksR0FBRyxDQUFDLEVBQUU7UUFDaEIsR0FBRyxDQUFDLElBQUksRUFBRSxHQUFHLFFBQVEsQ0FBQyxLQUFLLEVBQUU7UUFDN0IsR0FBRyxDQUFDLElBQUksSUFBSSxFQUFFLEdBQUcsUUFBUSxDQUFDLElBQUksS0FBSztJQUNyQztJQUNBLE9BQU87QUFDVCxDQUFDO0FBRUQ7OztDQUdDLEdBQ0QsT0FBTyxTQUFTLE9BQU8sR0FBZSxFQUFjO0lBQ2xELE1BQU0sTUFBTSxJQUFJLFdBQVcsSUFBSSxNQUFNLEdBQUc7SUFDeEMsSUFBSyxJQUFJLElBQUksR0FBRyxJQUFJLElBQUksTUFBTSxFQUFFLElBQUs7UUFDbkMsTUFBTSxJQUFJLFlBQVksR0FBRyxDQUFDLElBQUksRUFBRTtRQUNoQyxNQUFNLElBQUksWUFBWSxHQUFHLENBQUMsSUFBSSxJQUFJLEVBQUU7UUFDcEMsR0FBRyxDQUFDLEVBQUUsR0FBRyxBQUFDLEtBQUssSUFBSztJQUN0QjtJQUVBLElBQUksSUFBSSxNQUFNLEdBQUcsS0FBSyxHQUFHO1FBQ3ZCLHNEQUFzRDtRQUN0RCw2REFBNkQ7UUFDN0QsWUFBWSxHQUFHLENBQUMsSUFBSSxNQUFNLEdBQUcsRUFBRTtRQUMvQixNQUFNLFlBQVk7SUFDcEIsQ0FBQztJQUVELE9BQU87QUFDVCxDQUFDIn0=