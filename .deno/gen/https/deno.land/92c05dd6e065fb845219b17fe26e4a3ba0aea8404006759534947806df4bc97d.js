// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
export { DigestContext, instantiate as instantiateWasm } from "./lib/deno_std_wasm_crypto.generated.mjs";
/**
 * All cryptographic hash/digest algorithms supported by std/crypto/_wasm.
 *
 * For algorithms that are supported by WebCrypto, the name here must match the
 * one used by WebCrypto. Otherwise we should prefer the formatting used in the
 * official specification. All names are uppercase to facilitate case-insensitive
 * comparisons required by the WebCrypto spec.
 */ export const digestAlgorithms = [
    "BLAKE2B-256",
    "BLAKE2B-384",
    "BLAKE2B",
    "BLAKE2S",
    "BLAKE3",
    "KECCAK-224",
    "KECCAK-256",
    "KECCAK-384",
    "KECCAK-512",
    "SHA-384",
    "SHA3-224",
    "SHA3-256",
    "SHA3-384",
    "SHA3-512",
    "SHAKE128",
    "SHAKE256",
    "TIGER",
    // insecure (length-extendable):
    "RIPEMD-160",
    "SHA-224",
    "SHA-256",
    "SHA-512",
    // insecure (collidable and length-extendable):
    "MD4",
    "MD5",
    "SHA-1"
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE3My4wL2NyeXB0by9fd2FzbS9tb2QudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMyB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbmV4cG9ydCB7XG4gIERpZ2VzdENvbnRleHQsXG4gIGluc3RhbnRpYXRlIGFzIGluc3RhbnRpYXRlV2FzbSxcbn0gZnJvbSBcIi4vbGliL2Rlbm9fc3RkX3dhc21fY3J5cHRvLmdlbmVyYXRlZC5tanNcIjtcblxuLyoqXG4gKiBBbGwgY3J5cHRvZ3JhcGhpYyBoYXNoL2RpZ2VzdCBhbGdvcml0aG1zIHN1cHBvcnRlZCBieSBzdGQvY3J5cHRvL193YXNtLlxuICpcbiAqIEZvciBhbGdvcml0aG1zIHRoYXQgYXJlIHN1cHBvcnRlZCBieSBXZWJDcnlwdG8sIHRoZSBuYW1lIGhlcmUgbXVzdCBtYXRjaCB0aGVcbiAqIG9uZSB1c2VkIGJ5IFdlYkNyeXB0by4gT3RoZXJ3aXNlIHdlIHNob3VsZCBwcmVmZXIgdGhlIGZvcm1hdHRpbmcgdXNlZCBpbiB0aGVcbiAqIG9mZmljaWFsIHNwZWNpZmljYXRpb24uIEFsbCBuYW1lcyBhcmUgdXBwZXJjYXNlIHRvIGZhY2lsaXRhdGUgY2FzZS1pbnNlbnNpdGl2ZVxuICogY29tcGFyaXNvbnMgcmVxdWlyZWQgYnkgdGhlIFdlYkNyeXB0byBzcGVjLlxuICovXG5leHBvcnQgY29uc3QgZGlnZXN0QWxnb3JpdGhtcyA9IFtcbiAgXCJCTEFLRTJCLTI1NlwiLFxuICBcIkJMQUtFMkItMzg0XCIsXG4gIFwiQkxBS0UyQlwiLFxuICBcIkJMQUtFMlNcIixcbiAgXCJCTEFLRTNcIixcbiAgXCJLRUNDQUstMjI0XCIsXG4gIFwiS0VDQ0FLLTI1NlwiLFxuICBcIktFQ0NBSy0zODRcIixcbiAgXCJLRUNDQUstNTEyXCIsXG4gIFwiU0hBLTM4NFwiLFxuICBcIlNIQTMtMjI0XCIsXG4gIFwiU0hBMy0yNTZcIixcbiAgXCJTSEEzLTM4NFwiLFxuICBcIlNIQTMtNTEyXCIsXG4gIFwiU0hBS0UxMjhcIixcbiAgXCJTSEFLRTI1NlwiLFxuICBcIlRJR0VSXCIsXG4gIC8vIGluc2VjdXJlIChsZW5ndGgtZXh0ZW5kYWJsZSk6XG4gIFwiUklQRU1ELTE2MFwiLFxuICBcIlNIQS0yMjRcIixcbiAgXCJTSEEtMjU2XCIsXG4gIFwiU0hBLTUxMlwiLFxuICAvLyBpbnNlY3VyZSAoY29sbGlkYWJsZSBhbmQgbGVuZ3RoLWV4dGVuZGFibGUpOlxuICBcIk1ENFwiLFxuICBcIk1ENVwiLFxuICBcIlNIQS0xXCIsXG5dIGFzIGNvbnN0O1xuXG4vKiogQW4gYWxnb3JpdGhtIG5hbWUgc3VwcG9ydGVkIGJ5IHN0ZC9jcnlwdG8vX3dhc20uICovXG5leHBvcnQgdHlwZSBEaWdlc3RBbGdvcml0aG0gPSB0eXBlb2YgZGlnZXN0QWxnb3JpdGhtc1tudW1iZXJdO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxTQUNFLGFBQWEsRUFDYixlQUFlLGVBQWUsUUFDekIsMkNBQTJDO0FBRWxEOzs7Ozs7O0NBT0MsR0FDRCxPQUFPLE1BQU0sbUJBQW1CO0lBQzlCO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQSxnQ0FBZ0M7SUFDaEM7SUFDQTtJQUNBO0lBQ0E7SUFDQSwrQ0FBK0M7SUFDL0M7SUFDQTtJQUNBO0NBQ0QsQ0FBVSJ9