// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { parseMediaType } from "./parse_media_type.ts";
import { db } from "./_db.ts";
/**
 * Given a media type or header value, identify the encoding charset. If the
 * charset cannot be determined, the function returns `undefined`.
 *
 * @example
 * ```ts
 * import { getCharset } from "https://deno.land/std@$STD_VERSION/media_types/get_charset.ts";
 *
 * getCharset("text/plain"); // `UTF-8`
 * getCharset("application/foo"); // undefined
 * getCharset("application/news-checkgroups"); // `US-ASCII`
 * getCharset("application/news-checkgroups; charset=UTF-8"); // `UTF-8`
 * ```
 */ export function getCharset(type) {
    try {
        const [mediaType, params] = parseMediaType(type);
        if (params && params["charset"]) {
            return params["charset"];
        }
        const entry = db[mediaType];
        if (entry && entry.charset) {
            return entry.charset;
        }
        if (mediaType.startsWith("text/")) {
            return "UTF-8";
        }
    } catch  {
    // just swallow errors, returning undefined
    }
    return undefined;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE3My4wL21lZGlhX3R5cGVzL2dldF9jaGFyc2V0LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjMgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG5pbXBvcnQgeyBwYXJzZU1lZGlhVHlwZSB9IGZyb20gXCIuL3BhcnNlX21lZGlhX3R5cGUudHNcIjtcbmltcG9ydCB7IHR5cGUgREJFbnRyeSB9IGZyb20gXCIuL191dGlsLnRzXCI7XG5pbXBvcnQgeyBkYiwgdHlwZSBLZXlPZkRiIH0gZnJvbSBcIi4vX2RiLnRzXCI7XG5cbi8qKlxuICogR2l2ZW4gYSBtZWRpYSB0eXBlIG9yIGhlYWRlciB2YWx1ZSwgaWRlbnRpZnkgdGhlIGVuY29kaW5nIGNoYXJzZXQuIElmIHRoZVxuICogY2hhcnNldCBjYW5ub3QgYmUgZGV0ZXJtaW5lZCwgdGhlIGZ1bmN0aW9uIHJldHVybnMgYHVuZGVmaW5lZGAuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBnZXRDaGFyc2V0IH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vbWVkaWFfdHlwZXMvZ2V0X2NoYXJzZXQudHNcIjtcbiAqXG4gKiBnZXRDaGFyc2V0KFwidGV4dC9wbGFpblwiKTsgLy8gYFVURi04YFxuICogZ2V0Q2hhcnNldChcImFwcGxpY2F0aW9uL2Zvb1wiKTsgLy8gdW5kZWZpbmVkXG4gKiBnZXRDaGFyc2V0KFwiYXBwbGljYXRpb24vbmV3cy1jaGVja2dyb3Vwc1wiKTsgLy8gYFVTLUFTQ0lJYFxuICogZ2V0Q2hhcnNldChcImFwcGxpY2F0aW9uL25ld3MtY2hlY2tncm91cHM7IGNoYXJzZXQ9VVRGLThcIik7IC8vIGBVVEYtOGBcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2hhcnNldCh0eXBlOiBzdHJpbmcpOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICB0cnkge1xuICAgIGNvbnN0IFttZWRpYVR5cGUsIHBhcmFtc10gPSBwYXJzZU1lZGlhVHlwZSh0eXBlKTtcbiAgICBpZiAocGFyYW1zICYmIHBhcmFtc1tcImNoYXJzZXRcIl0pIHtcbiAgICAgIHJldHVybiBwYXJhbXNbXCJjaGFyc2V0XCJdO1xuICAgIH1cbiAgICBjb25zdCBlbnRyeSA9IGRiW21lZGlhVHlwZSBhcyBLZXlPZkRiXSBhcyBEQkVudHJ5O1xuICAgIGlmIChlbnRyeSAmJiBlbnRyeS5jaGFyc2V0KSB7XG4gICAgICByZXR1cm4gZW50cnkuY2hhcnNldDtcbiAgICB9XG4gICAgaWYgKG1lZGlhVHlwZS5zdGFydHNXaXRoKFwidGV4dC9cIikpIHtcbiAgICAgIHJldHVybiBcIlVURi04XCI7XG4gICAgfVxuICB9IGNhdGNoIHtcbiAgICAvLyBqdXN0IHN3YWxsb3cgZXJyb3JzLCByZXR1cm5pbmcgdW5kZWZpbmVkXG4gIH1cbiAgcmV0dXJuIHVuZGVmaW5lZDtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUsU0FBUyxjQUFjLFFBQVEsd0JBQXdCO0FBRXZELFNBQVMsRUFBRSxRQUFzQixXQUFXO0FBRTVDOzs7Ozs7Ozs7Ozs7O0NBYUMsR0FDRCxPQUFPLFNBQVMsV0FBVyxJQUFZLEVBQXNCO0lBQzNELElBQUk7UUFDRixNQUFNLENBQUMsV0FBVyxPQUFPLEdBQUcsZUFBZTtRQUMzQyxJQUFJLFVBQVUsTUFBTSxDQUFDLFVBQVUsRUFBRTtZQUMvQixPQUFPLE1BQU0sQ0FBQyxVQUFVO1FBQzFCLENBQUM7UUFDRCxNQUFNLFFBQVEsRUFBRSxDQUFDLFVBQXFCO1FBQ3RDLElBQUksU0FBUyxNQUFNLE9BQU8sRUFBRTtZQUMxQixPQUFPLE1BQU0sT0FBTztRQUN0QixDQUFDO1FBQ0QsSUFBSSxVQUFVLFVBQVUsQ0FBQyxVQUFVO1lBQ2pDLE9BQU87UUFDVCxDQUFDO0lBQ0gsRUFBRSxPQUFNO0lBQ04sMkNBQTJDO0lBQzdDO0lBQ0EsT0FBTztBQUNULENBQUMifQ==