// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { consumeMediaParam, decode2331Encoding } from "./_util.ts";
/**
 * Parses the media type and any optional parameters, per
 * [RFC 1521](https://datatracker.ietf.org/doc/html/rfc1521). Media types are
 * the values in `Content-Type` and `Content-Disposition` headers. On success
 * the function returns a tuple where the first element is the media type and
 * the second element is the optional parameters or `undefined` if there are
 * none.
 *
 * The function will throw if the parsed value is invalid.
 *
 * The returned media type will be normalized to be lower case, and returned
 * params keys will be normalized to lower case, but preserves the casing of
 * the value.
 *
 * @example
 * ```ts
 * import { parseMediaType } from "https://deno.land/std@$STD_VERSION/media_types/parse_media_type.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * assertEquals(
 *   parseMediaType("application/JSON"),
 *   [
 *     "application/json",
 *     undefined
 *   ]
 * );
 *
 * assertEquals(
 *   parseMediaType("text/html; charset=UTF-8"),
 *   [
 *     "application/json",
 *     { charset: "UTF-8" },
 *   ]
 * );
 * ```
 */ export function parseMediaType(v) {
    const [base] = v.split(";");
    const mediaType = base.toLowerCase().trim();
    const params = {};
    // Map of base parameter name -> parameter name -> value
    // for parameters containing a '*' character.
    const continuation = new Map();
    v = v.slice(base.length);
    while(v.length){
        v = v.trimStart();
        if (v.length === 0) {
            break;
        }
        const [key, value, rest] = consumeMediaParam(v);
        if (!key) {
            if (rest.trim() === ";") {
                break;
            }
            throw new TypeError("Invalid media parameter.");
        }
        let pmap = params;
        const [baseName, rest2] = key.split("*");
        if (baseName && rest2 != null) {
            if (!continuation.has(baseName)) {
                continuation.set(baseName, {});
            }
            pmap = continuation.get(baseName);
        }
        if (key in pmap) {
            throw new TypeError("Duplicate key parsed.");
        }
        pmap[key] = value;
        v = rest;
    }
    // Stitch together any continuations or things with stars
    // (i.e. RFC 2231 things with stars: "foo*0" or "foo*")
    let str = "";
    for (const [key1, pieceMap] of continuation){
        const singlePartKey = `${key1}*`;
        const v1 = pieceMap[singlePartKey];
        if (v1) {
            const decv = decode2331Encoding(v1);
            if (decv) {
                params[key1] = decv;
            }
            continue;
        }
        str = "";
        let valid = false;
        for(let n = 0;; n++){
            const simplePart = `${key1}*${n}`;
            let v2 = pieceMap[simplePart];
            if (v2) {
                valid = true;
                str += v2;
                continue;
            }
            const encodedPart = `${simplePart}*`;
            v2 = pieceMap[encodedPart];
            if (!v2) {
                break;
            }
            valid = true;
            if (n === 0) {
                const decv1 = decode2331Encoding(v2);
                if (decv1) {
                    str += decv1;
                }
            } else {
                const decv2 = decodeURI(v2);
                str += decv2;
            }
        }
        if (valid) {
            params[key1] = str;
        }
    }
    return Object.keys(params).length ? [
        mediaType,
        params
    ] : [
        mediaType,
        undefined
    ];
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE3My4wL21lZGlhX3R5cGVzL3BhcnNlX21lZGlhX3R5cGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMyB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbmltcG9ydCB7IGNvbnN1bWVNZWRpYVBhcmFtLCBkZWNvZGUyMzMxRW5jb2RpbmcgfSBmcm9tIFwiLi9fdXRpbC50c1wiO1xuXG4vKipcbiAqIFBhcnNlcyB0aGUgbWVkaWEgdHlwZSBhbmQgYW55IG9wdGlvbmFsIHBhcmFtZXRlcnMsIHBlclxuICogW1JGQyAxNTIxXShodHRwczovL2RhdGF0cmFja2VyLmlldGYub3JnL2RvYy9odG1sL3JmYzE1MjEpLiBNZWRpYSB0eXBlcyBhcmVcbiAqIHRoZSB2YWx1ZXMgaW4gYENvbnRlbnQtVHlwZWAgYW5kIGBDb250ZW50LURpc3Bvc2l0aW9uYCBoZWFkZXJzLiBPbiBzdWNjZXNzXG4gKiB0aGUgZnVuY3Rpb24gcmV0dXJucyBhIHR1cGxlIHdoZXJlIHRoZSBmaXJzdCBlbGVtZW50IGlzIHRoZSBtZWRpYSB0eXBlIGFuZFxuICogdGhlIHNlY29uZCBlbGVtZW50IGlzIHRoZSBvcHRpb25hbCBwYXJhbWV0ZXJzIG9yIGB1bmRlZmluZWRgIGlmIHRoZXJlIGFyZVxuICogbm9uZS5cbiAqXG4gKiBUaGUgZnVuY3Rpb24gd2lsbCB0aHJvdyBpZiB0aGUgcGFyc2VkIHZhbHVlIGlzIGludmFsaWQuXG4gKlxuICogVGhlIHJldHVybmVkIG1lZGlhIHR5cGUgd2lsbCBiZSBub3JtYWxpemVkIHRvIGJlIGxvd2VyIGNhc2UsIGFuZCByZXR1cm5lZFxuICogcGFyYW1zIGtleXMgd2lsbCBiZSBub3JtYWxpemVkIHRvIGxvd2VyIGNhc2UsIGJ1dCBwcmVzZXJ2ZXMgdGhlIGNhc2luZyBvZlxuICogdGhlIHZhbHVlLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgcGFyc2VNZWRpYVR5cGUgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9tZWRpYV90eXBlcy9wYXJzZV9tZWRpYV90eXBlLnRzXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi90ZXN0aW5nL2Fzc2VydHMudHNcIjtcbiAqXG4gKiBhc3NlcnRFcXVhbHMoXG4gKiAgIHBhcnNlTWVkaWFUeXBlKFwiYXBwbGljYXRpb24vSlNPTlwiKSxcbiAqICAgW1xuICogICAgIFwiYXBwbGljYXRpb24vanNvblwiLFxuICogICAgIHVuZGVmaW5lZFxuICogICBdXG4gKiApO1xuICpcbiAqIGFzc2VydEVxdWFscyhcbiAqICAgcGFyc2VNZWRpYVR5cGUoXCJ0ZXh0L2h0bWw7IGNoYXJzZXQ9VVRGLThcIiksXG4gKiAgIFtcbiAqICAgICBcImFwcGxpY2F0aW9uL2pzb25cIixcbiAqICAgICB7IGNoYXJzZXQ6IFwiVVRGLThcIiB9LFxuICogICBdXG4gKiApO1xuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZU1lZGlhVHlwZShcbiAgdjogc3RyaW5nLFxuKTogW21lZGlhVHlwZTogc3RyaW5nLCBwYXJhbXM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gfCB1bmRlZmluZWRdIHtcbiAgY29uc3QgW2Jhc2VdID0gdi5zcGxpdChcIjtcIik7XG4gIGNvbnN0IG1lZGlhVHlwZSA9IGJhc2UudG9Mb3dlckNhc2UoKS50cmltKCk7XG5cbiAgY29uc3QgcGFyYW1zOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XG4gIC8vIE1hcCBvZiBiYXNlIHBhcmFtZXRlciBuYW1lIC0+IHBhcmFtZXRlciBuYW1lIC0+IHZhbHVlXG4gIC8vIGZvciBwYXJhbWV0ZXJzIGNvbnRhaW5pbmcgYSAnKicgY2hhcmFjdGVyLlxuICBjb25zdCBjb250aW51YXRpb24gPSBuZXcgTWFwPHN0cmluZywgUmVjb3JkPHN0cmluZywgc3RyaW5nPj4oKTtcblxuICB2ID0gdi5zbGljZShiYXNlLmxlbmd0aCk7XG4gIHdoaWxlICh2Lmxlbmd0aCkge1xuICAgIHYgPSB2LnRyaW1TdGFydCgpO1xuICAgIGlmICh2Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNvbnN0IFtrZXksIHZhbHVlLCByZXN0XSA9IGNvbnN1bWVNZWRpYVBhcmFtKHYpO1xuICAgIGlmICgha2V5KSB7XG4gICAgICBpZiAocmVzdC50cmltKCkgPT09IFwiO1wiKSB7XG4gICAgICAgIC8vIGlnbm9yZSB0cmFpbGluZyBzZW1pY29sb25zXG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkludmFsaWQgbWVkaWEgcGFyYW1ldGVyLlwiKTtcbiAgICB9XG5cbiAgICBsZXQgcG1hcCA9IHBhcmFtcztcbiAgICBjb25zdCBbYmFzZU5hbWUsIHJlc3QyXSA9IGtleS5zcGxpdChcIipcIik7XG4gICAgaWYgKGJhc2VOYW1lICYmIHJlc3QyICE9IG51bGwpIHtcbiAgICAgIGlmICghY29udGludWF0aW9uLmhhcyhiYXNlTmFtZSkpIHtcbiAgICAgICAgY29udGludWF0aW9uLnNldChiYXNlTmFtZSwge30pO1xuICAgICAgfVxuICAgICAgcG1hcCA9IGNvbnRpbnVhdGlvbi5nZXQoYmFzZU5hbWUpITtcbiAgICB9XG4gICAgaWYgKGtleSBpbiBwbWFwKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRHVwbGljYXRlIGtleSBwYXJzZWQuXCIpO1xuICAgIH1cbiAgICBwbWFwW2tleV0gPSB2YWx1ZTtcbiAgICB2ID0gcmVzdDtcbiAgfVxuXG4gIC8vIFN0aXRjaCB0b2dldGhlciBhbnkgY29udGludWF0aW9ucyBvciB0aGluZ3Mgd2l0aCBzdGFyc1xuICAvLyAoaS5lLiBSRkMgMjIzMSB0aGluZ3Mgd2l0aCBzdGFyczogXCJmb28qMFwiIG9yIFwiZm9vKlwiKVxuICBsZXQgc3RyID0gXCJcIjtcbiAgZm9yIChjb25zdCBba2V5LCBwaWVjZU1hcF0gb2YgY29udGludWF0aW9uKSB7XG4gICAgY29uc3Qgc2luZ2xlUGFydEtleSA9IGAke2tleX0qYDtcbiAgICBjb25zdCB2ID0gcGllY2VNYXBbc2luZ2xlUGFydEtleV07XG4gICAgaWYgKHYpIHtcbiAgICAgIGNvbnN0IGRlY3YgPSBkZWNvZGUyMzMxRW5jb2Rpbmcodik7XG4gICAgICBpZiAoZGVjdikge1xuICAgICAgICBwYXJhbXNba2V5XSA9IGRlY3Y7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBzdHIgPSBcIlwiO1xuICAgIGxldCB2YWxpZCA9IGZhbHNlO1xuICAgIGZvciAobGV0IG4gPSAwOzsgbisrKSB7XG4gICAgICBjb25zdCBzaW1wbGVQYXJ0ID0gYCR7a2V5fSoke259YDtcbiAgICAgIGxldCB2ID0gcGllY2VNYXBbc2ltcGxlUGFydF07XG4gICAgICBpZiAodikge1xuICAgICAgICB2YWxpZCA9IHRydWU7XG4gICAgICAgIHN0ciArPSB2O1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGVuY29kZWRQYXJ0ID0gYCR7c2ltcGxlUGFydH0qYDtcbiAgICAgIHYgPSBwaWVjZU1hcFtlbmNvZGVkUGFydF07XG4gICAgICBpZiAoIXYpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICB2YWxpZCA9IHRydWU7XG4gICAgICBpZiAobiA9PT0gMCkge1xuICAgICAgICBjb25zdCBkZWN2ID0gZGVjb2RlMjMzMUVuY29kaW5nKHYpO1xuICAgICAgICBpZiAoZGVjdikge1xuICAgICAgICAgIHN0ciArPSBkZWN2O1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBkZWN2ID0gZGVjb2RlVVJJKHYpO1xuICAgICAgICBzdHIgKz0gZGVjdjtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHZhbGlkKSB7XG4gICAgICBwYXJhbXNba2V5XSA9IHN0cjtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gT2JqZWN0LmtleXMocGFyYW1zKS5sZW5ndGhcbiAgICA/IFttZWRpYVR5cGUsIHBhcmFtc11cbiAgICA6IFttZWRpYVR5cGUsIHVuZGVmaW5lZF07XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLFNBQVMsaUJBQWlCLEVBQUUsa0JBQWtCLFFBQVEsYUFBYTtBQUVuRTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FtQ0MsR0FDRCxPQUFPLFNBQVMsZUFDZCxDQUFTLEVBQ3dEO0lBQ2pFLE1BQU0sQ0FBQyxLQUFLLEdBQUcsRUFBRSxLQUFLLENBQUM7SUFDdkIsTUFBTSxZQUFZLEtBQUssV0FBVyxHQUFHLElBQUk7SUFFekMsTUFBTSxTQUFpQyxDQUFDO0lBQ3hDLHdEQUF3RDtJQUN4RCw2Q0FBNkM7SUFDN0MsTUFBTSxlQUFlLElBQUk7SUFFekIsSUFBSSxFQUFFLEtBQUssQ0FBQyxLQUFLLE1BQU07SUFDdkIsTUFBTyxFQUFFLE1BQU0sQ0FBRTtRQUNmLElBQUksRUFBRSxTQUFTO1FBQ2YsSUFBSSxFQUFFLE1BQU0sS0FBSyxHQUFHO1lBQ2xCLEtBQU07UUFDUixDQUFDO1FBQ0QsTUFBTSxDQUFDLEtBQUssT0FBTyxLQUFLLEdBQUcsa0JBQWtCO1FBQzdDLElBQUksQ0FBQyxLQUFLO1lBQ1IsSUFBSSxLQUFLLElBQUksT0FBTyxLQUFLO2dCQUV2QixLQUFNO1lBQ1IsQ0FBQztZQUNELE1BQU0sSUFBSSxVQUFVLDRCQUE0QjtRQUNsRCxDQUFDO1FBRUQsSUFBSSxPQUFPO1FBQ1gsTUFBTSxDQUFDLFVBQVUsTUFBTSxHQUFHLElBQUksS0FBSyxDQUFDO1FBQ3BDLElBQUksWUFBWSxTQUFTLElBQUksRUFBRTtZQUM3QixJQUFJLENBQUMsYUFBYSxHQUFHLENBQUMsV0FBVztnQkFDL0IsYUFBYSxHQUFHLENBQUMsVUFBVSxDQUFDO1lBQzlCLENBQUM7WUFDRCxPQUFPLGFBQWEsR0FBRyxDQUFDO1FBQzFCLENBQUM7UUFDRCxJQUFJLE9BQU8sTUFBTTtZQUNmLE1BQU0sSUFBSSxVQUFVLHlCQUF5QjtRQUMvQyxDQUFDO1FBQ0QsSUFBSSxDQUFDLElBQUksR0FBRztRQUNaLElBQUk7SUFDTjtJQUVBLHlEQUF5RDtJQUN6RCx1REFBdUQ7SUFDdkQsSUFBSSxNQUFNO0lBQ1YsS0FBSyxNQUFNLENBQUMsTUFBSyxTQUFTLElBQUksYUFBYztRQUMxQyxNQUFNLGdCQUFnQixDQUFDLEVBQUUsS0FBSSxDQUFDLENBQUM7UUFDL0IsTUFBTSxLQUFJLFFBQVEsQ0FBQyxjQUFjO1FBQ2pDLElBQUksSUFBRztZQUNMLE1BQU0sT0FBTyxtQkFBbUI7WUFDaEMsSUFBSSxNQUFNO2dCQUNSLE1BQU0sQ0FBQyxLQUFJLEdBQUc7WUFDaEIsQ0FBQztZQUNELFFBQVM7UUFDWCxDQUFDO1FBRUQsTUFBTTtRQUNOLElBQUksUUFBUSxLQUFLO1FBQ2pCLElBQUssSUFBSSxJQUFJLElBQUksSUFBSztZQUNwQixNQUFNLGFBQWEsQ0FBQyxFQUFFLEtBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUNoQyxJQUFJLEtBQUksUUFBUSxDQUFDLFdBQVc7WUFDNUIsSUFBSSxJQUFHO2dCQUNMLFFBQVEsSUFBSTtnQkFDWixPQUFPO2dCQUNQLFFBQVM7WUFDWCxDQUFDO1lBQ0QsTUFBTSxjQUFjLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUNwQyxLQUFJLFFBQVEsQ0FBQyxZQUFZO1lBQ3pCLElBQUksQ0FBQyxJQUFHO2dCQUNOLEtBQU07WUFDUixDQUFDO1lBQ0QsUUFBUSxJQUFJO1lBQ1osSUFBSSxNQUFNLEdBQUc7Z0JBQ1gsTUFBTSxRQUFPLG1CQUFtQjtnQkFDaEMsSUFBSSxPQUFNO29CQUNSLE9BQU87Z0JBQ1QsQ0FBQztZQUNILE9BQU87Z0JBQ0wsTUFBTSxRQUFPLFVBQVU7Z0JBQ3ZCLE9BQU87WUFDVCxDQUFDO1FBQ0g7UUFDQSxJQUFJLE9BQU87WUFDVCxNQUFNLENBQUMsS0FBSSxHQUFHO1FBQ2hCLENBQUM7SUFDSDtJQUVBLE9BQU8sT0FBTyxJQUFJLENBQUMsUUFBUSxNQUFNLEdBQzdCO1FBQUM7UUFBVztLQUFPLEdBQ25CO1FBQUM7UUFBVztLQUFVO0FBQzVCLENBQUMifQ==