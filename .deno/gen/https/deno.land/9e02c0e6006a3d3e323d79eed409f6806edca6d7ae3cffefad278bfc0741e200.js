// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { encode as hexEncode } from "../encoding/hex.ts";
import { encode as base64Encode } from "../encoding/base64.ts";
const decoder = new TextDecoder();
/**
 * Converts a hash to a string with a given encoding.
 * @example
 * ```ts
 * import { crypto } from "https://deno.land/std@$STD_VERSION/crypto/crypto.ts";
 * import { toHashString } from "https://deno.land/std@$STD_VERSION/crypto/to_hash_string.ts"
 *
 * const hash = await crypto.subtle.digest("SHA-384", new TextEncoder().encode("You hear that Mr. Anderson?"));
 *
 * // Hex encoding by default
 * console.log(toHashString(hash));
 *
 * // Or with base64 encoding
 * console.log(toHashString(hash, "base64"));
 * ```
 */ export function toHashString(hash, encoding = "hex") {
    switch(encoding){
        case "hex":
            return decoder.decode(hexEncode(new Uint8Array(hash)));
        case "base64":
            return base64Encode(hash);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE3My4wL2NyeXB0by90b19oYXNoX3N0cmluZy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIzIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuaW1wb3J0IHsgZW5jb2RlIGFzIGhleEVuY29kZSB9IGZyb20gXCIuLi9lbmNvZGluZy9oZXgudHNcIjtcbmltcG9ydCB7IGVuY29kZSBhcyBiYXNlNjRFbmNvZGUgfSBmcm9tIFwiLi4vZW5jb2RpbmcvYmFzZTY0LnRzXCI7XG5cbmNvbnN0IGRlY29kZXIgPSBuZXcgVGV4dERlY29kZXIoKTtcblxuLyoqXG4gKiBDb252ZXJ0cyBhIGhhc2ggdG8gYSBzdHJpbmcgd2l0aCBhIGdpdmVuIGVuY29kaW5nLlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBjcnlwdG8gfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9jcnlwdG8vY3J5cHRvLnRzXCI7XG4gKiBpbXBvcnQgeyB0b0hhc2hTdHJpbmcgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9jcnlwdG8vdG9faGFzaF9zdHJpbmcudHNcIlxuICpcbiAqIGNvbnN0IGhhc2ggPSBhd2FpdCBjcnlwdG8uc3VidGxlLmRpZ2VzdChcIlNIQS0zODRcIiwgbmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKFwiWW91IGhlYXIgdGhhdCBNci4gQW5kZXJzb24/XCIpKTtcbiAqXG4gKiAvLyBIZXggZW5jb2RpbmcgYnkgZGVmYXVsdFxuICogY29uc29sZS5sb2codG9IYXNoU3RyaW5nKGhhc2gpKTtcbiAqXG4gKiAvLyBPciB3aXRoIGJhc2U2NCBlbmNvZGluZ1xuICogY29uc29sZS5sb2codG9IYXNoU3RyaW5nKGhhc2gsIFwiYmFzZTY0XCIpKTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gdG9IYXNoU3RyaW5nKFxuICBoYXNoOiBBcnJheUJ1ZmZlcixcbiAgZW5jb2Rpbmc6IFwiaGV4XCIgfCBcImJhc2U2NFwiID0gXCJoZXhcIixcbik6IHN0cmluZyB7XG4gIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICBjYXNlIFwiaGV4XCI6XG4gICAgICByZXR1cm4gZGVjb2Rlci5kZWNvZGUoaGV4RW5jb2RlKG5ldyBVaW50OEFycmF5KGhhc2gpKSk7XG4gICAgY2FzZSBcImJhc2U2NFwiOlxuICAgICAgcmV0dXJuIGJhc2U2NEVuY29kZShoYXNoKTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxTQUFTLFVBQVUsU0FBUyxRQUFRLHFCQUFxQjtBQUN6RCxTQUFTLFVBQVUsWUFBWSxRQUFRLHdCQUF3QjtBQUUvRCxNQUFNLFVBQVUsSUFBSTtBQUVwQjs7Ozs7Ozs7Ozs7Ozs7O0NBZUMsR0FDRCxPQUFPLFNBQVMsYUFDZCxJQUFpQixFQUNqQixXQUE2QixLQUFLLEVBQzFCO0lBQ1IsT0FBUTtRQUNOLEtBQUs7WUFDSCxPQUFPLFFBQVEsTUFBTSxDQUFDLFVBQVUsSUFBSSxXQUFXO1FBQ2pELEtBQUs7WUFDSCxPQUFPLGFBQWE7SUFDeEI7QUFDRixDQUFDIn0=