// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
/**
 * Extensions to the
 * [Web Crypto](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
 * supporting additional encryption APIs, but also delegating to the built-in
 * APIs when possible.
 *
 * Provides additional digest algorithms that are not part of the WebCrypto
 * standard as well as a `subtle.digest` and `subtle.digestSync` methods. It
 * also provides a `subtle.timingSafeEqual()` method to compare array buffers
 * or data views in a way that isn't prone to timing based attacks.
 *
 * The "polyfill" delegates to `WebCrypto` where possible.
 *
 * The {@linkcode KeyStack} export implements the {@linkcode KeyRing} interface
 * for managing rotatable keys for signing data to prevent tampering, like with
 * HTTP cookies.
 *
 * ## Supported algorithms
 *
 * Here is a list of supported algorithms. If the algorithm name in WebCrypto
 * and Wasm/Rust is the same, this library prefers to use algorithms that are
 * supported by WebCrypto.
 *
 * WebCrypto
 *
 * ```ts
 * // https://deno.land/std/crypto/crypto.ts
 * const webCryptoDigestAlgorithms = [
 *   "SHA-384",
 *   "SHA-256",
 *   "SHA-512",
 *   // insecure (length-extendable and collidable):
 *   "SHA-1",
 * ] as const;
 * ```
 *
 * Wasm/Rust
 *
 * ```ts
 * // https://deno.land/std/_wasm_crypto/crypto.ts
 * export const digestAlgorithms = [
 *   "BLAKE2B-256",
 *   "BLAKE2B-384",
 *   "BLAKE2B",
 *   "BLAKE2S",
 *   "BLAKE3",
 *   "KECCAK-224",
 *   "KECCAK-256",
 *   "KECCAK-384",
 *   "KECCAK-512",
 *   "SHA-384",
 *   "SHA3-224",
 *   "SHA3-256",
 *   "SHA3-384",
 *   "SHA3-512",
 *   "SHAKE128",
 *   "SHAKE256",
 *   "TIGER",
 *   // insecure (length-extendable):
 *   "RIPEMD-160",
 *   "SHA-224",
 *   "SHA-256",
 *   "SHA-512",
 *   // insecure (collidable and length-extendable):
 *   "MD5",
 *   "SHA-1",
 * ] as const;
 * ```
 *
 * ## Timing safe comparison
 *
 * When checking the values of cryptographic hashes are equal, default
 * comparisons can be susceptible to timing based attacks, where attacker is
 * able to find out information about the host system by repeatedly checking
 * response times to equality comparisons of values.
 *
 * It is likely some form of timing safe equality will make its way to the
 * WebCrypto standard (see:
 * [w3c/webcrypto#270](https://github.com/w3c/webcrypto/issues/270)), but until
 * that time, `timingSafeEqual()` is provided:
 *
 * ```ts
 * import { crypto } from "https://deno.land/std@$STD_VERSION/crypto/mod.ts";
 * import { assert } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const a = await crypto.subtle.digest(
 *   "SHA-384",
 *   new TextEncoder().encode("hello world"),
 * );
 * const b = await crypto.subtle.digest(
 *   "SHA-384",
 *   new TextEncoder().encode("hello world"),
 * );
 * const c = await crypto.subtle.digest(
 *   "SHA-384",
 *   new TextEncoder().encode("hello deno"),
 * );
 *
 * assert(crypto.subtle.timingSafeEqual(a, b));
 * assert(!crypto.subtle.timingSafeEqual(a, c));
 * ```
 *
 * In addition to the method being part of the `crypto.subtle` interface, it is
 * also loadable directly:
 *
 * ```ts
 * import { timingSafeEqual } from "https://deno.land/std@$STD_VERSION/crypto/timing_safe_equal.ts";
 * import { assert } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const a = await crypto.subtle.digest(
 *   "SHA-384",
 *   new TextEncoder().encode("hello world"),
 * );
 * const b = await crypto.subtle.digest(
 *   "SHA-384",
 *   new TextEncoder().encode("hello world"),
 * );
 *
 * assert(timingSafeEqual(a, b));
 * ```
 *
 * @example
 * ```ts
 * import { crypto } from "https://deno.land/std@$STD_VERSION/crypto/mod.ts";
 *
 * // This will delegate to the runtime's WebCrypto implementation.
 * console.log(
 *   new Uint8Array(
 *     await crypto.subtle.digest(
 *       "SHA-384",
 *       new TextEncoder().encode("hello world"),
 *     ),
 *   ),
 * );
 *
 * // This will use a bundled Wasm/Rust implementation.
 * console.log(
 *   new Uint8Array(
 *     await crypto.subtle.digest(
 *       "BLAKE3",
 *       new TextEncoder().encode("hello world"),
 *     ),
 *   ),
 * );
 * ```
 *
 * @example Convert hash to a string
 *
 * ```ts
 * import {
 *   crypto,
 *   toHashString,
 * } from "https://deno.land/std@$STD_VERSION/crypto/mod.ts";
 *
 * const hash = await crypto.subtle.digest(
 *   "SHA-384",
 *   new TextEncoder().encode("You hear that Mr. Anderson?"),
 * );
 *
 * // Hex encoding by default
 * console.log(toHashString(hash));
 *
 * // Or with base64 encoding
 * console.log(toHashString(hash, "base64"));
 * ```
 *
 * @module
 */ import { digestAlgorithms as wasmDigestAlgorithms, instantiateWasm } from "./_wasm/mod.ts";
import { timingSafeEqual } from "./timing_safe_equal.ts";
import { fnv } from "./_fnv/index.ts";
/**
 * A copy of the global WebCrypto interface, with methods bound so they're
 * safe to re-export.
 */ const webCrypto = ((crypto)=>({
        getRandomValues: crypto.getRandomValues?.bind(crypto),
        randomUUID: crypto.randomUUID?.bind(crypto),
        subtle: {
            decrypt: crypto.subtle?.decrypt?.bind(crypto.subtle),
            deriveBits: crypto.subtle?.deriveBits?.bind(crypto.subtle),
            deriveKey: crypto.subtle?.deriveKey?.bind(crypto.subtle),
            digest: crypto.subtle?.digest?.bind(crypto.subtle),
            encrypt: crypto.subtle?.encrypt?.bind(crypto.subtle),
            exportKey: crypto.subtle?.exportKey?.bind(crypto.subtle),
            generateKey: crypto.subtle?.generateKey?.bind(crypto.subtle),
            importKey: crypto.subtle?.importKey?.bind(crypto.subtle),
            sign: crypto.subtle?.sign?.bind(crypto.subtle),
            unwrapKey: crypto.subtle?.unwrapKey?.bind(crypto.subtle),
            verify: crypto.subtle?.verify?.bind(crypto.subtle),
            wrapKey: crypto.subtle?.wrapKey?.bind(crypto.subtle)
        }
    }))(globalThis.crypto);
const bufferSourceBytes = (data)=>{
    let bytes;
    if (data instanceof Uint8Array) {
        bytes = data;
    } else if (ArrayBuffer.isView(data)) {
        bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    } else if (data instanceof ArrayBuffer) {
        bytes = new Uint8Array(data);
    }
    return bytes;
};
/**
 * An wrapper for WebCrypto adding support for additional non-standard
 * algorithms, but delegating to the runtime WebCrypto implementation whenever
 * possible.
 */ const stdCrypto = ((x)=>x)({
    ...webCrypto,
    subtle: {
        ...webCrypto.subtle,
        /**
     * Polyfills stream support until the Web Crypto API does so:
     * @see {@link https://github.com/wintercg/proposal-webcrypto-streams}
     */ async digest (algorithm, data) {
            const { name , length  } = normalizeAlgorithm(algorithm);
            const bytes = bufferSourceBytes(data);
            if (FNVAlgorithms.includes(name)) {
                return fnv(name, bytes);
            }
            // We delegate to WebCrypto whenever possible,
            if (// if the algorithm is supported by the WebCrypto standard,
            webCryptoDigestAlgorithms.includes(name) && // and the data is a single buffer,
            bytes) {
                return webCrypto.subtle.digest(algorithm, bytes);
            } else if (wasmDigestAlgorithms.includes(name)) {
                if (bytes) {
                    // Otherwise, we use our bundled Wasm implementation via digestSync
                    // if it supports the algorithm.
                    return stdCrypto.subtle.digestSync(algorithm, bytes);
                } else if (data[Symbol.iterator]) {
                    return stdCrypto.subtle.digestSync(algorithm, data);
                } else if (data[Symbol.asyncIterator]) {
                    const wasmCrypto = instantiateWasm();
                    const context = new wasmCrypto.DigestContext(name);
                    for await (const chunk of data){
                        const chunkBytes = bufferSourceBytes(chunk);
                        if (!chunkBytes) {
                            throw new TypeError("data contained chunk of the wrong type");
                        }
                        context.update(chunkBytes);
                    }
                    return context.digestAndDrop(length).buffer;
                } else {
                    throw new TypeError("data must be a BufferSource or [Async]Iterable<BufferSource>");
                }
            } else if (webCrypto.subtle?.digest) {
                // (TypeScript type definitions prohibit this case.) If they're trying
                // to call an algorithm we don't recognize, pass it along to WebCrypto
                // in case it's a non-standard algorithm supported by the the runtime
                // they're using.
                return webCrypto.subtle.digest(algorithm, data);
            } else {
                throw new TypeError(`unsupported digest algorithm: ${algorithm}`);
            }
        },
        digestSync (algorithm, data) {
            algorithm = normalizeAlgorithm(algorithm);
            const bytes = bufferSourceBytes(data);
            if (FNVAlgorithms.includes(algorithm.name)) {
                return fnv(algorithm.name, bytes);
            }
            const wasmCrypto = instantiateWasm();
            if (bytes) {
                return wasmCrypto.digest(algorithm.name, bytes, algorithm.length).buffer;
            } else if (data[Symbol.iterator]) {
                const context = new wasmCrypto.DigestContext(algorithm.name);
                for (const chunk of data){
                    const chunkBytes = bufferSourceBytes(chunk);
                    if (!chunkBytes) {
                        throw new TypeError("data contained chunk of the wrong type");
                    }
                    context.update(chunkBytes);
                }
                return context.digestAndDrop(algorithm.length).buffer;
            } else {
                throw new TypeError("data must be a BufferSource or Iterable<BufferSource>");
            }
        },
        // TODO(@kitsonk): rework when https://github.com/w3c/webcrypto/issues/270 resolved
        timingSafeEqual
    }
});
const FNVAlgorithms = [
    "FNV32",
    "FNV32A",
    "FNV64",
    "FNV64A"
];
/** Digest algorithms supported by WebCrypto. */ const webCryptoDigestAlgorithms = [
    "SHA-384",
    "SHA-256",
    "SHA-512",
    // insecure (length-extendable and collidable):
    "SHA-1"
];
const normalizeAlgorithm = (algorithm)=>typeof algorithm === "string" ? {
        name: algorithm.toUpperCase()
    } : {
        ...algorithm,
        name: algorithm.name.toUpperCase()
    };
export { stdCrypto as crypto };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE3My4wL2NyeXB0by9jcnlwdG8udHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMyB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cblxuLyoqXG4gKiBFeHRlbnNpb25zIHRvIHRoZVxuICogW1dlYiBDcnlwdG9dKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9XZWJfQ3J5cHRvX0FQSSlcbiAqIHN1cHBvcnRpbmcgYWRkaXRpb25hbCBlbmNyeXB0aW9uIEFQSXMsIGJ1dCBhbHNvIGRlbGVnYXRpbmcgdG8gdGhlIGJ1aWx0LWluXG4gKiBBUElzIHdoZW4gcG9zc2libGUuXG4gKlxuICogUHJvdmlkZXMgYWRkaXRpb25hbCBkaWdlc3QgYWxnb3JpdGhtcyB0aGF0IGFyZSBub3QgcGFydCBvZiB0aGUgV2ViQ3J5cHRvXG4gKiBzdGFuZGFyZCBhcyB3ZWxsIGFzIGEgYHN1YnRsZS5kaWdlc3RgIGFuZCBgc3VidGxlLmRpZ2VzdFN5bmNgIG1ldGhvZHMuIEl0XG4gKiBhbHNvIHByb3ZpZGVzIGEgYHN1YnRsZS50aW1pbmdTYWZlRXF1YWwoKWAgbWV0aG9kIHRvIGNvbXBhcmUgYXJyYXkgYnVmZmVyc1xuICogb3IgZGF0YSB2aWV3cyBpbiBhIHdheSB0aGF0IGlzbid0IHByb25lIHRvIHRpbWluZyBiYXNlZCBhdHRhY2tzLlxuICpcbiAqIFRoZSBcInBvbHlmaWxsXCIgZGVsZWdhdGVzIHRvIGBXZWJDcnlwdG9gIHdoZXJlIHBvc3NpYmxlLlxuICpcbiAqIFRoZSB7QGxpbmtjb2RlIEtleVN0YWNrfSBleHBvcnQgaW1wbGVtZW50cyB0aGUge0BsaW5rY29kZSBLZXlSaW5nfSBpbnRlcmZhY2VcbiAqIGZvciBtYW5hZ2luZyByb3RhdGFibGUga2V5cyBmb3Igc2lnbmluZyBkYXRhIHRvIHByZXZlbnQgdGFtcGVyaW5nLCBsaWtlIHdpdGhcbiAqIEhUVFAgY29va2llcy5cbiAqXG4gKiAjIyBTdXBwb3J0ZWQgYWxnb3JpdGhtc1xuICpcbiAqIEhlcmUgaXMgYSBsaXN0IG9mIHN1cHBvcnRlZCBhbGdvcml0aG1zLiBJZiB0aGUgYWxnb3JpdGhtIG5hbWUgaW4gV2ViQ3J5cHRvXG4gKiBhbmQgV2FzbS9SdXN0IGlzIHRoZSBzYW1lLCB0aGlzIGxpYnJhcnkgcHJlZmVycyB0byB1c2UgYWxnb3JpdGhtcyB0aGF0IGFyZVxuICogc3VwcG9ydGVkIGJ5IFdlYkNyeXB0by5cbiAqXG4gKiBXZWJDcnlwdG9cbiAqXG4gKiBgYGB0c1xuICogLy8gaHR0cHM6Ly9kZW5vLmxhbmQvc3RkL2NyeXB0by9jcnlwdG8udHNcbiAqIGNvbnN0IHdlYkNyeXB0b0RpZ2VzdEFsZ29yaXRobXMgPSBbXG4gKiAgIFwiU0hBLTM4NFwiLFxuICogICBcIlNIQS0yNTZcIixcbiAqICAgXCJTSEEtNTEyXCIsXG4gKiAgIC8vIGluc2VjdXJlIChsZW5ndGgtZXh0ZW5kYWJsZSBhbmQgY29sbGlkYWJsZSk6XG4gKiAgIFwiU0hBLTFcIixcbiAqIF0gYXMgY29uc3Q7XG4gKiBgYGBcbiAqXG4gKiBXYXNtL1J1c3RcbiAqXG4gKiBgYGB0c1xuICogLy8gaHR0cHM6Ly9kZW5vLmxhbmQvc3RkL193YXNtX2NyeXB0by9jcnlwdG8udHNcbiAqIGV4cG9ydCBjb25zdCBkaWdlc3RBbGdvcml0aG1zID0gW1xuICogICBcIkJMQUtFMkItMjU2XCIsXG4gKiAgIFwiQkxBS0UyQi0zODRcIixcbiAqICAgXCJCTEFLRTJCXCIsXG4gKiAgIFwiQkxBS0UyU1wiLFxuICogICBcIkJMQUtFM1wiLFxuICogICBcIktFQ0NBSy0yMjRcIixcbiAqICAgXCJLRUNDQUstMjU2XCIsXG4gKiAgIFwiS0VDQ0FLLTM4NFwiLFxuICogICBcIktFQ0NBSy01MTJcIixcbiAqICAgXCJTSEEtMzg0XCIsXG4gKiAgIFwiU0hBMy0yMjRcIixcbiAqICAgXCJTSEEzLTI1NlwiLFxuICogICBcIlNIQTMtMzg0XCIsXG4gKiAgIFwiU0hBMy01MTJcIixcbiAqICAgXCJTSEFLRTEyOFwiLFxuICogICBcIlNIQUtFMjU2XCIsXG4gKiAgIFwiVElHRVJcIixcbiAqICAgLy8gaW5zZWN1cmUgKGxlbmd0aC1leHRlbmRhYmxlKTpcbiAqICAgXCJSSVBFTUQtMTYwXCIsXG4gKiAgIFwiU0hBLTIyNFwiLFxuICogICBcIlNIQS0yNTZcIixcbiAqICAgXCJTSEEtNTEyXCIsXG4gKiAgIC8vIGluc2VjdXJlIChjb2xsaWRhYmxlIGFuZCBsZW5ndGgtZXh0ZW5kYWJsZSk6XG4gKiAgIFwiTUQ1XCIsXG4gKiAgIFwiU0hBLTFcIixcbiAqIF0gYXMgY29uc3Q7XG4gKiBgYGBcbiAqXG4gKiAjIyBUaW1pbmcgc2FmZSBjb21wYXJpc29uXG4gKlxuICogV2hlbiBjaGVja2luZyB0aGUgdmFsdWVzIG9mIGNyeXB0b2dyYXBoaWMgaGFzaGVzIGFyZSBlcXVhbCwgZGVmYXVsdFxuICogY29tcGFyaXNvbnMgY2FuIGJlIHN1c2NlcHRpYmxlIHRvIHRpbWluZyBiYXNlZCBhdHRhY2tzLCB3aGVyZSBhdHRhY2tlciBpc1xuICogYWJsZSB0byBmaW5kIG91dCBpbmZvcm1hdGlvbiBhYm91dCB0aGUgaG9zdCBzeXN0ZW0gYnkgcmVwZWF0ZWRseSBjaGVja2luZ1xuICogcmVzcG9uc2UgdGltZXMgdG8gZXF1YWxpdHkgY29tcGFyaXNvbnMgb2YgdmFsdWVzLlxuICpcbiAqIEl0IGlzIGxpa2VseSBzb21lIGZvcm0gb2YgdGltaW5nIHNhZmUgZXF1YWxpdHkgd2lsbCBtYWtlIGl0cyB3YXkgdG8gdGhlXG4gKiBXZWJDcnlwdG8gc3RhbmRhcmQgKHNlZTpcbiAqIFt3M2Mvd2ViY3J5cHRvIzI3MF0oaHR0cHM6Ly9naXRodWIuY29tL3czYy93ZWJjcnlwdG8vaXNzdWVzLzI3MCkpLCBidXQgdW50aWxcbiAqIHRoYXQgdGltZSwgYHRpbWluZ1NhZmVFcXVhbCgpYCBpcyBwcm92aWRlZDpcbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgY3J5cHRvIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vY3J5cHRvL21vZC50c1wiO1xuICogaW1wb3J0IHsgYXNzZXJ0IH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vdGVzdGluZy9hc3NlcnRzLnRzXCI7XG4gKlxuICogY29uc3QgYSA9IGF3YWl0IGNyeXB0by5zdWJ0bGUuZGlnZXN0KFxuICogICBcIlNIQS0zODRcIixcbiAqICAgbmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKFwiaGVsbG8gd29ybGRcIiksXG4gKiApO1xuICogY29uc3QgYiA9IGF3YWl0IGNyeXB0by5zdWJ0bGUuZGlnZXN0KFxuICogICBcIlNIQS0zODRcIixcbiAqICAgbmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKFwiaGVsbG8gd29ybGRcIiksXG4gKiApO1xuICogY29uc3QgYyA9IGF3YWl0IGNyeXB0by5zdWJ0bGUuZGlnZXN0KFxuICogICBcIlNIQS0zODRcIixcbiAqICAgbmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKFwiaGVsbG8gZGVub1wiKSxcbiAqICk7XG4gKlxuICogYXNzZXJ0KGNyeXB0by5zdWJ0bGUudGltaW5nU2FmZUVxdWFsKGEsIGIpKTtcbiAqIGFzc2VydCghY3J5cHRvLnN1YnRsZS50aW1pbmdTYWZlRXF1YWwoYSwgYykpO1xuICogYGBgXG4gKlxuICogSW4gYWRkaXRpb24gdG8gdGhlIG1ldGhvZCBiZWluZyBwYXJ0IG9mIHRoZSBgY3J5cHRvLnN1YnRsZWAgaW50ZXJmYWNlLCBpdCBpc1xuICogYWxzbyBsb2FkYWJsZSBkaXJlY3RseTpcbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgdGltaW5nU2FmZUVxdWFsIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vY3J5cHRvL3RpbWluZ19zYWZlX2VxdWFsLnRzXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnQgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi90ZXN0aW5nL2Fzc2VydHMudHNcIjtcbiAqXG4gKiBjb25zdCBhID0gYXdhaXQgY3J5cHRvLnN1YnRsZS5kaWdlc3QoXG4gKiAgIFwiU0hBLTM4NFwiLFxuICogICBuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUoXCJoZWxsbyB3b3JsZFwiKSxcbiAqICk7XG4gKiBjb25zdCBiID0gYXdhaXQgY3J5cHRvLnN1YnRsZS5kaWdlc3QoXG4gKiAgIFwiU0hBLTM4NFwiLFxuICogICBuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUoXCJoZWxsbyB3b3JsZFwiKSxcbiAqICk7XG4gKlxuICogYXNzZXJ0KHRpbWluZ1NhZmVFcXVhbChhLCBiKSk7XG4gKiBgYGBcbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IGNyeXB0byB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2NyeXB0by9tb2QudHNcIjtcbiAqXG4gKiAvLyBUaGlzIHdpbGwgZGVsZWdhdGUgdG8gdGhlIHJ1bnRpbWUncyBXZWJDcnlwdG8gaW1wbGVtZW50YXRpb24uXG4gKiBjb25zb2xlLmxvZyhcbiAqICAgbmV3IFVpbnQ4QXJyYXkoXG4gKiAgICAgYXdhaXQgY3J5cHRvLnN1YnRsZS5kaWdlc3QoXG4gKiAgICAgICBcIlNIQS0zODRcIixcbiAqICAgICAgIG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShcImhlbGxvIHdvcmxkXCIpLFxuICogICAgICksXG4gKiAgICksXG4gKiApO1xuICpcbiAqIC8vIFRoaXMgd2lsbCB1c2UgYSBidW5kbGVkIFdhc20vUnVzdCBpbXBsZW1lbnRhdGlvbi5cbiAqIGNvbnNvbGUubG9nKFxuICogICBuZXcgVWludDhBcnJheShcbiAqICAgICBhd2FpdCBjcnlwdG8uc3VidGxlLmRpZ2VzdChcbiAqICAgICAgIFwiQkxBS0UzXCIsXG4gKiAgICAgICBuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUoXCJoZWxsbyB3b3JsZFwiKSxcbiAqICAgICApLFxuICogICApLFxuICogKTtcbiAqIGBgYFxuICpcbiAqIEBleGFtcGxlIENvbnZlcnQgaGFzaCB0byBhIHN0cmluZ1xuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQge1xuICogICBjcnlwdG8sXG4gKiAgIHRvSGFzaFN0cmluZyxcbiAqIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vY3J5cHRvL21vZC50c1wiO1xuICpcbiAqIGNvbnN0IGhhc2ggPSBhd2FpdCBjcnlwdG8uc3VidGxlLmRpZ2VzdChcbiAqICAgXCJTSEEtMzg0XCIsXG4gKiAgIG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShcIllvdSBoZWFyIHRoYXQgTXIuIEFuZGVyc29uP1wiKSxcbiAqICk7XG4gKlxuICogLy8gSGV4IGVuY29kaW5nIGJ5IGRlZmF1bHRcbiAqIGNvbnNvbGUubG9nKHRvSGFzaFN0cmluZyhoYXNoKSk7XG4gKlxuICogLy8gT3Igd2l0aCBiYXNlNjQgZW5jb2RpbmdcbiAqIGNvbnNvbGUubG9nKHRvSGFzaFN0cmluZyhoYXNoLCBcImJhc2U2NFwiKSk7XG4gKiBgYGBcbiAqXG4gKiBAbW9kdWxlXG4gKi9cblxuaW1wb3J0IHtcbiAgRGlnZXN0QWxnb3JpdGhtIGFzIFdhc21EaWdlc3RBbGdvcml0aG0sXG4gIGRpZ2VzdEFsZ29yaXRobXMgYXMgd2FzbURpZ2VzdEFsZ29yaXRobXMsXG4gIGluc3RhbnRpYXRlV2FzbSxcbn0gZnJvbSBcIi4vX3dhc20vbW9kLnRzXCI7XG5pbXBvcnQgeyB0aW1pbmdTYWZlRXF1YWwgfSBmcm9tIFwiLi90aW1pbmdfc2FmZV9lcXVhbC50c1wiO1xuaW1wb3J0IHsgZm52IH0gZnJvbSBcIi4vX2Zudi9pbmRleC50c1wiO1xuXG4vKipcbiAqIEEgY29weSBvZiB0aGUgZ2xvYmFsIFdlYkNyeXB0byBpbnRlcmZhY2UsIHdpdGggbWV0aG9kcyBib3VuZCBzbyB0aGV5J3JlXG4gKiBzYWZlIHRvIHJlLWV4cG9ydC5cbiAqL1xuY29uc3Qgd2ViQ3J5cHRvID0gKChjcnlwdG8pID0+ICh7XG4gIGdldFJhbmRvbVZhbHVlczogY3J5cHRvLmdldFJhbmRvbVZhbHVlcz8uYmluZChjcnlwdG8pLFxuICByYW5kb21VVUlEOiBjcnlwdG8ucmFuZG9tVVVJRD8uYmluZChjcnlwdG8pLFxuICBzdWJ0bGU6IHtcbiAgICBkZWNyeXB0OiBjcnlwdG8uc3VidGxlPy5kZWNyeXB0Py5iaW5kKGNyeXB0by5zdWJ0bGUpLFxuICAgIGRlcml2ZUJpdHM6IGNyeXB0by5zdWJ0bGU/LmRlcml2ZUJpdHM/LmJpbmQoY3J5cHRvLnN1YnRsZSksXG4gICAgZGVyaXZlS2V5OiBjcnlwdG8uc3VidGxlPy5kZXJpdmVLZXk/LmJpbmQoY3J5cHRvLnN1YnRsZSksXG4gICAgZGlnZXN0OiBjcnlwdG8uc3VidGxlPy5kaWdlc3Q/LmJpbmQoY3J5cHRvLnN1YnRsZSksXG4gICAgZW5jcnlwdDogY3J5cHRvLnN1YnRsZT8uZW5jcnlwdD8uYmluZChjcnlwdG8uc3VidGxlKSxcbiAgICBleHBvcnRLZXk6IGNyeXB0by5zdWJ0bGU/LmV4cG9ydEtleT8uYmluZChjcnlwdG8uc3VidGxlKSxcbiAgICBnZW5lcmF0ZUtleTogY3J5cHRvLnN1YnRsZT8uZ2VuZXJhdGVLZXk/LmJpbmQoY3J5cHRvLnN1YnRsZSksXG4gICAgaW1wb3J0S2V5OiBjcnlwdG8uc3VidGxlPy5pbXBvcnRLZXk/LmJpbmQoY3J5cHRvLnN1YnRsZSksXG4gICAgc2lnbjogY3J5cHRvLnN1YnRsZT8uc2lnbj8uYmluZChjcnlwdG8uc3VidGxlKSxcbiAgICB1bndyYXBLZXk6IGNyeXB0by5zdWJ0bGU/LnVud3JhcEtleT8uYmluZChjcnlwdG8uc3VidGxlKSxcbiAgICB2ZXJpZnk6IGNyeXB0by5zdWJ0bGU/LnZlcmlmeT8uYmluZChjcnlwdG8uc3VidGxlKSxcbiAgICB3cmFwS2V5OiBjcnlwdG8uc3VidGxlPy53cmFwS2V5Py5iaW5kKGNyeXB0by5zdWJ0bGUpLFxuICB9LFxufSkpKGdsb2JhbFRoaXMuY3J5cHRvKTtcblxuY29uc3QgYnVmZmVyU291cmNlQnl0ZXMgPSAoZGF0YTogQnVmZmVyU291cmNlIHwgdW5rbm93bikgPT4ge1xuICBsZXQgYnl0ZXM6IFVpbnQ4QXJyYXkgfCB1bmRlZmluZWQ7XG4gIGlmIChkYXRhIGluc3RhbmNlb2YgVWludDhBcnJheSkge1xuICAgIGJ5dGVzID0gZGF0YTtcbiAgfSBlbHNlIGlmIChBcnJheUJ1ZmZlci5pc1ZpZXcoZGF0YSkpIHtcbiAgICBieXRlcyA9IG5ldyBVaW50OEFycmF5KGRhdGEuYnVmZmVyLCBkYXRhLmJ5dGVPZmZzZXQsIGRhdGEuYnl0ZUxlbmd0aCk7XG4gIH0gZWxzZSBpZiAoZGF0YSBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XG4gICAgYnl0ZXMgPSBuZXcgVWludDhBcnJheShkYXRhKTtcbiAgfVxuICByZXR1cm4gYnl0ZXM7XG59O1xuXG4vKiogRXh0ZW5zaW9ucyB0byB0aGUgd2ViIHN0YW5kYXJkIGBTdWJ0bGVDcnlwdG9gIGludGVyZmFjZS4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU3RkU3VidGxlQ3J5cHRvIGV4dGVuZHMgU3VidGxlQ3J5cHRvIHtcbiAgLyoqXG4gICAqIFJldHVybnMgYSBuZXcgYFByb21pc2VgIG9iamVjdCB0aGF0IHdpbGwgZGlnZXN0IGBkYXRhYCB1c2luZyB0aGUgc3BlY2lmaWVkXG4gICAqIGBBbGdvcml0aG1JZGVudGlmaWVyYC5cbiAgICovXG4gIGRpZ2VzdChcbiAgICBhbGdvcml0aG06IERpZ2VzdEFsZ29yaXRobSxcbiAgICBkYXRhOiBCdWZmZXJTb3VyY2UgfCBBc3luY0l0ZXJhYmxlPEJ1ZmZlclNvdXJjZT4gfCBJdGVyYWJsZTxCdWZmZXJTb3VyY2U+LFxuICApOiBQcm9taXNlPEFycmF5QnVmZmVyPjtcblxuICAvKipcbiAgICogUmV0dXJucyBhIEFycmF5QnVmZmVyIHdpdGggdGhlIHJlc3VsdCBvZiBkaWdlc3RpbmcgYGRhdGFgIHVzaW5nIHRoZVxuICAgKiBzcGVjaWZpZWQgYEFsZ29yaXRobUlkZW50aWZpZXJgLlxuICAgKi9cbiAgZGlnZXN0U3luYyhcbiAgICBhbGdvcml0aG06IERpZ2VzdEFsZ29yaXRobSxcbiAgICBkYXRhOiBCdWZmZXJTb3VyY2UgfCBJdGVyYWJsZTxCdWZmZXJTb3VyY2U+LFxuICApOiBBcnJheUJ1ZmZlcjtcblxuICAvKiogQ29tcGFyZSB0byBhcnJheSBidWZmZXJzIG9yIGRhdGEgdmlld3MgaW4gYSB3YXkgdGhhdCB0aW1pbmcgYmFzZWQgYXR0YWNrc1xuICAgKiBjYW5ub3QgZ2FpbiBpbmZvcm1hdGlvbiBhYm91dCB0aGUgcGxhdGZvcm0uICovXG4gIHRpbWluZ1NhZmVFcXVhbChcbiAgICBhOiBBcnJheUJ1ZmZlckxpa2UgfCBEYXRhVmlldyxcbiAgICBiOiBBcnJheUJ1ZmZlckxpa2UgfCBEYXRhVmlldyxcbiAgKTogYm9vbGVhbjtcbn1cblxuLyoqIEV4dGVuc2lvbnMgdG8gdGhlIFdlYiB7QGxpbmtjb2RlIENyeXB0b30gaW50ZXJmYWNlLiAqL1xuZXhwb3J0IGludGVyZmFjZSBTdGRDcnlwdG8gZXh0ZW5kcyBDcnlwdG8ge1xuICByZWFkb25seSBzdWJ0bGU6IFN0ZFN1YnRsZUNyeXB0bztcbn1cblxuLyoqXG4gKiBBbiB3cmFwcGVyIGZvciBXZWJDcnlwdG8gYWRkaW5nIHN1cHBvcnQgZm9yIGFkZGl0aW9uYWwgbm9uLXN0YW5kYXJkXG4gKiBhbGdvcml0aG1zLCBidXQgZGVsZWdhdGluZyB0byB0aGUgcnVudGltZSBXZWJDcnlwdG8gaW1wbGVtZW50YXRpb24gd2hlbmV2ZXJcbiAqIHBvc3NpYmxlLlxuICovXG5jb25zdCBzdGRDcnlwdG86IFN0ZENyeXB0byA9ICgoeCkgPT4geCkoe1xuICAuLi53ZWJDcnlwdG8sXG4gIHN1YnRsZToge1xuICAgIC4uLndlYkNyeXB0by5zdWJ0bGUsXG5cbiAgICAvKipcbiAgICAgKiBQb2x5ZmlsbHMgc3RyZWFtIHN1cHBvcnQgdW50aWwgdGhlIFdlYiBDcnlwdG8gQVBJIGRvZXMgc286XG4gICAgICogQHNlZSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL3dpbnRlcmNnL3Byb3Bvc2FsLXdlYmNyeXB0by1zdHJlYW1zfVxuICAgICAqL1xuICAgIGFzeW5jIGRpZ2VzdChcbiAgICAgIGFsZ29yaXRobTogRGlnZXN0QWxnb3JpdGhtLFxuICAgICAgZGF0YTogQnVmZmVyU291cmNlIHwgQXN5bmNJdGVyYWJsZTxCdWZmZXJTb3VyY2U+IHwgSXRlcmFibGU8QnVmZmVyU291cmNlPixcbiAgICApOiBQcm9taXNlPEFycmF5QnVmZmVyPiB7XG4gICAgICBjb25zdCB7IG5hbWUsIGxlbmd0aCB9ID0gbm9ybWFsaXplQWxnb3JpdGhtKGFsZ29yaXRobSk7XG4gICAgICBjb25zdCBieXRlcyA9IGJ1ZmZlclNvdXJjZUJ5dGVzKGRhdGEpO1xuXG4gICAgICBpZiAoRk5WQWxnb3JpdGhtcy5pbmNsdWRlcyhuYW1lKSkge1xuICAgICAgICByZXR1cm4gZm52KG5hbWUsIGJ5dGVzKTtcbiAgICAgIH1cblxuICAgICAgLy8gV2UgZGVsZWdhdGUgdG8gV2ViQ3J5cHRvIHdoZW5ldmVyIHBvc3NpYmxlLFxuICAgICAgaWYgKFxuICAgICAgICAvLyBpZiB0aGUgYWxnb3JpdGhtIGlzIHN1cHBvcnRlZCBieSB0aGUgV2ViQ3J5cHRvIHN0YW5kYXJkLFxuICAgICAgICAod2ViQ3J5cHRvRGlnZXN0QWxnb3JpdGhtcyBhcyByZWFkb25seSBzdHJpbmdbXSkuaW5jbHVkZXMobmFtZSkgJiZcbiAgICAgICAgLy8gYW5kIHRoZSBkYXRhIGlzIGEgc2luZ2xlIGJ1ZmZlcixcbiAgICAgICAgYnl0ZXNcbiAgICAgICkge1xuICAgICAgICByZXR1cm4gd2ViQ3J5cHRvLnN1YnRsZS5kaWdlc3QoYWxnb3JpdGhtLCBieXRlcyk7XG4gICAgICB9IGVsc2UgaWYgKHdhc21EaWdlc3RBbGdvcml0aG1zLmluY2x1ZGVzKG5hbWUgYXMgV2FzbURpZ2VzdEFsZ29yaXRobSkpIHtcbiAgICAgICAgaWYgKGJ5dGVzKSB7XG4gICAgICAgICAgLy8gT3RoZXJ3aXNlLCB3ZSB1c2Ugb3VyIGJ1bmRsZWQgV2FzbSBpbXBsZW1lbnRhdGlvbiB2aWEgZGlnZXN0U3luY1xuICAgICAgICAgIC8vIGlmIGl0IHN1cHBvcnRzIHRoZSBhbGdvcml0aG0uXG4gICAgICAgICAgcmV0dXJuIHN0ZENyeXB0by5zdWJ0bGUuZGlnZXN0U3luYyhhbGdvcml0aG0sIGJ5dGVzKTtcbiAgICAgICAgfSBlbHNlIGlmICgoZGF0YSBhcyBJdGVyYWJsZTxCdWZmZXJTb3VyY2U+KVtTeW1ib2wuaXRlcmF0b3JdKSB7XG4gICAgICAgICAgcmV0dXJuIHN0ZENyeXB0by5zdWJ0bGUuZGlnZXN0U3luYyhcbiAgICAgICAgICAgIGFsZ29yaXRobSxcbiAgICAgICAgICAgIGRhdGEgYXMgSXRlcmFibGU8QnVmZmVyU291cmNlPixcbiAgICAgICAgICApO1xuICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgIChkYXRhIGFzIEFzeW5jSXRlcmFibGU8QnVmZmVyU291cmNlPilbU3ltYm9sLmFzeW5jSXRlcmF0b3JdXG4gICAgICAgICkge1xuICAgICAgICAgIGNvbnN0IHdhc21DcnlwdG8gPSBpbnN0YW50aWF0ZVdhc20oKTtcbiAgICAgICAgICBjb25zdCBjb250ZXh0ID0gbmV3IHdhc21DcnlwdG8uRGlnZXN0Q29udGV4dChuYW1lKTtcbiAgICAgICAgICBmb3IgYXdhaXQgKGNvbnN0IGNodW5rIG9mIGRhdGEgYXMgQXN5bmNJdGVyYWJsZTxCdWZmZXJTb3VyY2U+KSB7XG4gICAgICAgICAgICBjb25zdCBjaHVua0J5dGVzID0gYnVmZmVyU291cmNlQnl0ZXMoY2h1bmspO1xuICAgICAgICAgICAgaWYgKCFjaHVua0J5dGVzKSB7XG4gICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJkYXRhIGNvbnRhaW5lZCBjaHVuayBvZiB0aGUgd3JvbmcgdHlwZVwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnRleHQudXBkYXRlKGNodW5rQnl0ZXMpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gY29udGV4dC5kaWdlc3RBbmREcm9wKGxlbmd0aCkuYnVmZmVyO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgICAgICBcImRhdGEgbXVzdCBiZSBhIEJ1ZmZlclNvdXJjZSBvciBbQXN5bmNdSXRlcmFibGU8QnVmZmVyU291cmNlPlwiLFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAod2ViQ3J5cHRvLnN1YnRsZT8uZGlnZXN0KSB7XG4gICAgICAgIC8vIChUeXBlU2NyaXB0IHR5cGUgZGVmaW5pdGlvbnMgcHJvaGliaXQgdGhpcyBjYXNlLikgSWYgdGhleSdyZSB0cnlpbmdcbiAgICAgICAgLy8gdG8gY2FsbCBhbiBhbGdvcml0aG0gd2UgZG9uJ3QgcmVjb2duaXplLCBwYXNzIGl0IGFsb25nIHRvIFdlYkNyeXB0b1xuICAgICAgICAvLyBpbiBjYXNlIGl0J3MgYSBub24tc3RhbmRhcmQgYWxnb3JpdGhtIHN1cHBvcnRlZCBieSB0aGUgdGhlIHJ1bnRpbWVcbiAgICAgICAgLy8gdGhleSdyZSB1c2luZy5cbiAgICAgICAgcmV0dXJuIHdlYkNyeXB0by5zdWJ0bGUuZGlnZXN0KFxuICAgICAgICAgIGFsZ29yaXRobSxcbiAgICAgICAgICAoZGF0YSBhcyB1bmtub3duKSBhcyBVaW50OEFycmF5LFxuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgdW5zdXBwb3J0ZWQgZGlnZXN0IGFsZ29yaXRobTogJHthbGdvcml0aG19YCk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIGRpZ2VzdFN5bmMoXG4gICAgICBhbGdvcml0aG06IERpZ2VzdEFsZ29yaXRobSxcbiAgICAgIGRhdGE6IEJ1ZmZlclNvdXJjZSB8IEl0ZXJhYmxlPEJ1ZmZlclNvdXJjZT4sXG4gICAgKTogQXJyYXlCdWZmZXIge1xuICAgICAgYWxnb3JpdGhtID0gbm9ybWFsaXplQWxnb3JpdGhtKGFsZ29yaXRobSk7XG5cbiAgICAgIGNvbnN0IGJ5dGVzID0gYnVmZmVyU291cmNlQnl0ZXMoZGF0YSk7XG5cbiAgICAgIGlmIChGTlZBbGdvcml0aG1zLmluY2x1ZGVzKGFsZ29yaXRobS5uYW1lKSkge1xuICAgICAgICByZXR1cm4gZm52KGFsZ29yaXRobS5uYW1lLCBieXRlcyk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHdhc21DcnlwdG8gPSBpbnN0YW50aWF0ZVdhc20oKTtcbiAgICAgIGlmIChieXRlcykge1xuICAgICAgICByZXR1cm4gd2FzbUNyeXB0by5kaWdlc3QoYWxnb3JpdGhtLm5hbWUsIGJ5dGVzLCBhbGdvcml0aG0ubGVuZ3RoKVxuICAgICAgICAgIC5idWZmZXI7XG4gICAgICB9IGVsc2UgaWYgKChkYXRhIGFzIEl0ZXJhYmxlPEJ1ZmZlclNvdXJjZT4pW1N5bWJvbC5pdGVyYXRvcl0pIHtcbiAgICAgICAgY29uc3QgY29udGV4dCA9IG5ldyB3YXNtQ3J5cHRvLkRpZ2VzdENvbnRleHQoYWxnb3JpdGhtLm5hbWUpO1xuICAgICAgICBmb3IgKGNvbnN0IGNodW5rIG9mIGRhdGEgYXMgSXRlcmFibGU8QnVmZmVyU291cmNlPikge1xuICAgICAgICAgIGNvbnN0IGNodW5rQnl0ZXMgPSBidWZmZXJTb3VyY2VCeXRlcyhjaHVuayk7XG4gICAgICAgICAgaWYgKCFjaHVua0J5dGVzKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiZGF0YSBjb250YWluZWQgY2h1bmsgb2YgdGhlIHdyb25nIHR5cGVcIik7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnRleHQudXBkYXRlKGNodW5rQnl0ZXMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjb250ZXh0LmRpZ2VzdEFuZERyb3AoYWxnb3JpdGhtLmxlbmd0aCkuYnVmZmVyO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgICBcImRhdGEgbXVzdCBiZSBhIEJ1ZmZlclNvdXJjZSBvciBJdGVyYWJsZTxCdWZmZXJTb3VyY2U+XCIsXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIC8vIFRPRE8oQGtpdHNvbmspOiByZXdvcmsgd2hlbiBodHRwczovL2dpdGh1Yi5jb20vdzNjL3dlYmNyeXB0by9pc3N1ZXMvMjcwIHJlc29sdmVkXG4gICAgdGltaW5nU2FmZUVxdWFsLFxuICB9LFxufSk7XG5cbmNvbnN0IEZOVkFsZ29yaXRobXMgPSBbXCJGTlYzMlwiLCBcIkZOVjMyQVwiLCBcIkZOVjY0XCIsIFwiRk5WNjRBXCJdO1xuXG4vKiogRGlnZXN0IGFsZ29yaXRobXMgc3VwcG9ydGVkIGJ5IFdlYkNyeXB0by4gKi9cbmNvbnN0IHdlYkNyeXB0b0RpZ2VzdEFsZ29yaXRobXMgPSBbXG4gIFwiU0hBLTM4NFwiLFxuICBcIlNIQS0yNTZcIixcbiAgXCJTSEEtNTEyXCIsXG4gIC8vIGluc2VjdXJlIChsZW5ndGgtZXh0ZW5kYWJsZSBhbmQgY29sbGlkYWJsZSk6XG4gIFwiU0hBLTFcIixcbl0gYXMgY29uc3Q7XG5cbmV4cG9ydCB0eXBlIEZOVkFsZ29yaXRobXMgPSBcIkZOVjMyXCIgfCBcIkZOVjMyQVwiIHwgXCJGTlY2NFwiIHwgXCJGTlY2NEFcIjtcbmV4cG9ydCB0eXBlIERpZ2VzdEFsZ29yaXRobU5hbWUgPSBXYXNtRGlnZXN0QWxnb3JpdGhtIHwgRk5WQWxnb3JpdGhtcztcblxuZXhwb3J0IHR5cGUgRGlnZXN0QWxnb3JpdGhtT2JqZWN0ID0ge1xuICBuYW1lOiBEaWdlc3RBbGdvcml0aG1OYW1lO1xuICBsZW5ndGg/OiBudW1iZXI7XG59O1xuXG5leHBvcnQgdHlwZSBEaWdlc3RBbGdvcml0aG0gPSBEaWdlc3RBbGdvcml0aG1OYW1lIHwgRGlnZXN0QWxnb3JpdGhtT2JqZWN0O1xuXG5jb25zdCBub3JtYWxpemVBbGdvcml0aG0gPSAoYWxnb3JpdGhtOiBEaWdlc3RBbGdvcml0aG0pID0+XG4gICgodHlwZW9mIGFsZ29yaXRobSA9PT0gXCJzdHJpbmdcIikgPyB7IG5hbWU6IGFsZ29yaXRobS50b1VwcGVyQ2FzZSgpIH0gOiB7XG4gICAgLi4uYWxnb3JpdGhtLFxuICAgIG5hbWU6IGFsZ29yaXRobS5uYW1lLnRvVXBwZXJDYXNlKCksXG4gIH0pIGFzIERpZ2VzdEFsZ29yaXRobU9iamVjdDtcblxuZXhwb3J0IHsgc3RkQ3J5cHRvIGFzIGNyeXB0byB9O1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUUxRTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0F1S0MsR0FFRCxTQUVFLG9CQUFvQixvQkFBb0IsRUFDeEMsZUFBZSxRQUNWLGlCQUFpQjtBQUN4QixTQUFTLGVBQWUsUUFBUSx5QkFBeUI7QUFDekQsU0FBUyxHQUFHLFFBQVEsa0JBQWtCO0FBRXRDOzs7Q0FHQyxHQUNELE1BQU0sWUFBWSxDQUFDLENBQUMsU0FBVyxDQUFDO1FBQzlCLGlCQUFpQixPQUFPLGVBQWUsRUFBRSxLQUFLO1FBQzlDLFlBQVksT0FBTyxVQUFVLEVBQUUsS0FBSztRQUNwQyxRQUFRO1lBQ04sU0FBUyxPQUFPLE1BQU0sRUFBRSxTQUFTLEtBQUssT0FBTyxNQUFNO1lBQ25ELFlBQVksT0FBTyxNQUFNLEVBQUUsWUFBWSxLQUFLLE9BQU8sTUFBTTtZQUN6RCxXQUFXLE9BQU8sTUFBTSxFQUFFLFdBQVcsS0FBSyxPQUFPLE1BQU07WUFDdkQsUUFBUSxPQUFPLE1BQU0sRUFBRSxRQUFRLEtBQUssT0FBTyxNQUFNO1lBQ2pELFNBQVMsT0FBTyxNQUFNLEVBQUUsU0FBUyxLQUFLLE9BQU8sTUFBTTtZQUNuRCxXQUFXLE9BQU8sTUFBTSxFQUFFLFdBQVcsS0FBSyxP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