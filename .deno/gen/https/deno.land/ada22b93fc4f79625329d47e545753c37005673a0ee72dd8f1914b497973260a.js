// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { parseMediaType } from "./parse_media_type.ts";
import { typeByExtension } from "./type_by_extension.ts";
import { getCharset } from "./get_charset.ts";
import { formatMediaType } from "./format_media_type.ts";
/**
 * Given an extension or media type, return a full `Content-Type` or
 * `Content-Disposition` header value.
 *
 * The function will treat the `extensionOrType` as a media type when it
 * contains a `/`, otherwise it will process it as an extension, with or without
 * the leading `.`.
 *
 * Returns `undefined` if unable to resolve the media type.
 *
 * > Note: a side effect of `deno/x/media_types` was that you could pass a file
 * > name (e.g. `file.json`) and it would return the content type. This behavior
 * > is intentionally not supported here. If you want to get an extension for a
 * > file name, use `extname()` from `std/path/mod.ts` to determine the
 * > extension and pass it here.
 *
 * @example
 * ```ts
 * import { contentType } from "https://deno.land/std@$STD_VERSION/media_types/content_type.ts";
 *
 * contentType(".json"); // `application/json; charset=UTF-8`
 * contentType("text/html"); // `text/html; charset=UTF-8`
 * contentType("text/html; charset=UTF-8"); // `text/html; charset=UTF-8`
 * contentType("txt"); // `text/plain; charset=UTF-8`
 * contentType("foo"); // undefined
 * contentType("file.json"); // undefined
 * ```
 */ export function contentType(extensionOrType) {
    try {
        const [mediaType, params = {}] = extensionOrType.includes("/") ? parseMediaType(extensionOrType) : [
            typeByExtension(extensionOrType),
            undefined
        ];
        if (!mediaType) {
            return undefined;
        }
        if (!("charset" in params)) {
            const charset = getCharset(mediaType);
            if (charset) {
                params.charset = charset;
            }
        }
        return formatMediaType(mediaType, params);
    } catch  {
    // just swallow returning undefined
    }
    return undefined;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE3My4wL21lZGlhX3R5cGVzL2NvbnRlbnRfdHlwZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIzIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuaW1wb3J0IHsgcGFyc2VNZWRpYVR5cGUgfSBmcm9tIFwiLi9wYXJzZV9tZWRpYV90eXBlLnRzXCI7XG5pbXBvcnQgeyB0eXBlQnlFeHRlbnNpb24gfSBmcm9tIFwiLi90eXBlX2J5X2V4dGVuc2lvbi50c1wiO1xuaW1wb3J0IHsgZ2V0Q2hhcnNldCB9IGZyb20gXCIuL2dldF9jaGFyc2V0LnRzXCI7XG5pbXBvcnQgeyBmb3JtYXRNZWRpYVR5cGUgfSBmcm9tIFwiLi9mb3JtYXRfbWVkaWFfdHlwZS50c1wiO1xuaW1wb3J0IHR5cGUgeyBkYiB9IGZyb20gXCIuL19kYi50c1wiO1xuXG50eXBlIERCID0gdHlwZW9mIGRiO1xudHlwZSBDb250ZW50VHlwZVRvRXh0ZW5zaW9uID0ge1xuICBbSyBpbiBrZXlvZiBEQl06IERCW0tdIGV4dGVuZHMgeyBcImV4dGVuc2lvbnNcIjogcmVhZG9ubHkgc3RyaW5nW10gfVxuICAgID8gREJbS11bXCJleHRlbnNpb25zXCJdW251bWJlcl1cbiAgICA6IG5ldmVyO1xufTtcblxudHlwZSBLbm93bkV4dGVuc2lvbk9yVHlwZSA9XG4gIHwga2V5b2YgQ29udGVudFR5cGVUb0V4dGVuc2lvblxuICB8IENvbnRlbnRUeXBlVG9FeHRlbnNpb25ba2V5b2YgQ29udGVudFR5cGVUb0V4dGVuc2lvbl1cbiAgfCBgLiR7Q29udGVudFR5cGVUb0V4dGVuc2lvbltrZXlvZiBDb250ZW50VHlwZVRvRXh0ZW5zaW9uXX1gO1xuXG4vKipcbiAqIEdpdmVuIGFuIGV4dGVuc2lvbiBvciBtZWRpYSB0eXBlLCByZXR1cm4gYSBmdWxsIGBDb250ZW50LVR5cGVgIG9yXG4gKiBgQ29udGVudC1EaXNwb3NpdGlvbmAgaGVhZGVyIHZhbHVlLlxuICpcbiAqIFRoZSBmdW5jdGlvbiB3aWxsIHRyZWF0IHRoZSBgZXh0ZW5zaW9uT3JUeXBlYCBhcyBhIG1lZGlhIHR5cGUgd2hlbiBpdFxuICogY29udGFpbnMgYSBgL2AsIG90aGVyd2lzZSBpdCB3aWxsIHByb2Nlc3MgaXQgYXMgYW4gZXh0ZW5zaW9uLCB3aXRoIG9yIHdpdGhvdXRcbiAqIHRoZSBsZWFkaW5nIGAuYC5cbiAqXG4gKiBSZXR1cm5zIGB1bmRlZmluZWRgIGlmIHVuYWJsZSB0byByZXNvbHZlIHRoZSBtZWRpYSB0eXBlLlxuICpcbiAqID4gTm90ZTogYSBzaWRlIGVmZmVjdCBvZiBgZGVuby94L21lZGlhX3R5cGVzYCB3YXMgdGhhdCB5b3UgY291bGQgcGFzcyBhIGZpbGVcbiAqID4gbmFtZSAoZS5nLiBgZmlsZS5qc29uYCkgYW5kIGl0IHdvdWxkIHJldHVybiB0aGUgY29udGVudCB0eXBlLiBUaGlzIGJlaGF2aW9yXG4gKiA+IGlzIGludGVudGlvbmFsbHkgbm90IHN1cHBvcnRlZCBoZXJlLiBJZiB5b3Ugd2FudCB0byBnZXQgYW4gZXh0ZW5zaW9uIGZvciBhXG4gKiA+IGZpbGUgbmFtZSwgdXNlIGBleHRuYW1lKClgIGZyb20gYHN0ZC9wYXRoL21vZC50c2AgdG8gZGV0ZXJtaW5lIHRoZVxuICogPiBleHRlbnNpb24gYW5kIHBhc3MgaXQgaGVyZS5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IGNvbnRlbnRUeXBlIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vbWVkaWFfdHlwZXMvY29udGVudF90eXBlLnRzXCI7XG4gKlxuICogY29udGVudFR5cGUoXCIuanNvblwiKTsgLy8gYGFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9VVRGLThgXG4gKiBjb250ZW50VHlwZShcInRleHQvaHRtbFwiKTsgLy8gYHRleHQvaHRtbDsgY2hhcnNldD1VVEYtOGBcbiAqIGNvbnRlbnRUeXBlKFwidGV4dC9odG1sOyBjaGFyc2V0PVVURi04XCIpOyAvLyBgdGV4dC9odG1sOyBjaGFyc2V0PVVURi04YFxuICogY29udGVudFR5cGUoXCJ0eHRcIik7IC8vIGB0ZXh0L3BsYWluOyBjaGFyc2V0PVVURi04YFxuICogY29udGVudFR5cGUoXCJmb29cIik7IC8vIHVuZGVmaW5lZFxuICogY29udGVudFR5cGUoXCJmaWxlLmpzb25cIik7IC8vIHVuZGVmaW5lZFxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb250ZW50VHlwZTxcbiAgLy8gV29ya2Fyb3VuZCB0byBhdXRvY29tcGxldGUgZm9yIHBhcmFtZXRlcnM6IGh0dHBzOi8vZ2l0aHViLmNvbS9taWNyb3NvZnQvVHlwZVNjcmlwdC9pc3N1ZXMvMjk3MjkjaXNzdWVjb21tZW50LTU2Nzg3MTkzOVxuICAvLyBkZW5vLWxpbnQtaWdub3JlIGJhbi10eXBlc1xuICBUIGV4dGVuZHMgKHN0cmluZyAmIHt9KSB8IEtub3duRXh0ZW5zaW9uT3JUeXBlLFxuPihcbiAgZXh0ZW5zaW9uT3JUeXBlOiBULFxuKTogTG93ZXJjYXNlPFQ+IGV4dGVuZHMgS25vd25FeHRlbnNpb25PclR5cGUgPyBzdHJpbmcgOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICB0cnkge1xuICAgIGNvbnN0IFttZWRpYVR5cGUsIHBhcmFtcyA9IHt9XSA9IGV4dGVuc2lvbk9yVHlwZS5pbmNsdWRlcyhcIi9cIilcbiAgICAgID8gcGFyc2VNZWRpYVR5cGUoZXh0ZW5zaW9uT3JUeXBlKVxuICAgICAgOiBbdHlwZUJ5RXh0ZW5zaW9uKGV4dGVuc2lvbk9yVHlwZSksIHVuZGVmaW5lZF07XG4gICAgaWYgKCFtZWRpYVR5cGUpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQgYXMgTG93ZXJjYXNlPFQ+IGV4dGVuZHMgS25vd25FeHRlbnNpb25PclR5cGUgPyBzdHJpbmdcbiAgICAgICAgOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGlmICghKFwiY2hhcnNldFwiIGluIHBhcmFtcykpIHtcbiAgICAgIGNvbnN0IGNoYXJzZXQgPSBnZXRDaGFyc2V0KG1lZGlhVHlwZSk7XG4gICAgICBpZiAoY2hhcnNldCkge1xuICAgICAgICBwYXJhbXMuY2hhcnNldCA9IGNoYXJzZXQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmb3JtYXRNZWRpYVR5cGUobWVkaWFUeXBlLCBwYXJhbXMpO1xuICB9IGNhdGNoIHtcbiAgICAvLyBqdXN0IHN3YWxsb3cgcmV0dXJuaW5nIHVuZGVmaW5lZFxuICB9XG4gIHJldHVybiB1bmRlZmluZWQgYXMgTG93ZXJjYXNlPFQ+IGV4dGVuZHMgS25vd25FeHRlbnNpb25PclR5cGUgPyBzdHJpbmdcbiAgICA6IHN0cmluZyB8IHVuZGVmaW5lZDtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUsU0FBUyxjQUFjLFFBQVEsd0JBQXdCO0FBQ3ZELFNBQVMsZUFBZSxRQUFRLHlCQUF5QjtBQUN6RCxTQUFTLFVBQVUsUUFBUSxtQkFBbUI7QUFDOUMsU0FBUyxlQUFlLFFBQVEseUJBQXlCO0FBZXpEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0EyQkMsR0FDRCxPQUFPLFNBQVMsWUFLZCxlQUFrQixFQUN1RDtJQUN6RSxJQUFJO1FBQ0YsTUFBTSxDQUFDLFdBQVcsU0FBUyxDQUFDLENBQUMsQ0FBQyxHQUFHLGdCQUFnQixRQUFRLENBQUMsT0FDdEQsZUFBZSxtQkFDZjtZQUFDLGdCQUFnQjtZQUFrQjtTQUFVO1FBQ2pELElBQUksQ0FBQyxXQUFXO1lBQ2QsT0FBTztRQUVULENBQUM7UUFDRCxJQUFJLENBQUMsQ0FBQyxhQUFhLE1BQU0sR0FBRztZQUMxQixNQUFNLFVBQVUsV0FBVztZQUMzQixJQUFJLFNBQVM7Z0JBQ1gsT0FBTyxPQUFPLEdBQUc7WUFDbkIsQ0FBQztRQUNILENBQUM7UUFDRCxPQUFPLGdCQUFnQixXQUFXO0lBQ3BDLEVBQUUsT0FBTTtJQUNOLG1DQUFtQztJQUNyQztJQUNBLE9BQU87QUFFVCxDQUFDIn0=