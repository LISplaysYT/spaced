// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { types } from "./_db.ts";
/**
 * Returns the media type associated with the file extension. Values are
 * normalized to lower case and matched irrespective of a leading `.`.
 *
 * When `extension` has no associated type, the function returns `undefined`.
 *
 * @example
 * ```ts
 * import { typeByExtension } from "https://deno.land/std@$STD_VERSION/media_types/type_by_extension.ts";
 *
 * typeByExtension("js"); // `application/json`
 * typeByExtension(".HTML"); // `text/html`
 * typeByExtension("foo"); // undefined
 * typeByExtension("file.json"); // undefined
 * ```
 */ export function typeByExtension(extension) {
    extension = extension.startsWith(".") ? extension.slice(1) : extension;
    // @ts-ignore workaround around denoland/dnt#148
    return types.get(extension.toLowerCase());
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE3My4wL21lZGlhX3R5cGVzL3R5cGVfYnlfZXh0ZW5zaW9uLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjMgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG5pbXBvcnQgeyB0eXBlcyB9IGZyb20gXCIuL19kYi50c1wiO1xuXG4vKipcbiAqIFJldHVybnMgdGhlIG1lZGlhIHR5cGUgYXNzb2NpYXRlZCB3aXRoIHRoZSBmaWxlIGV4dGVuc2lvbi4gVmFsdWVzIGFyZVxuICogbm9ybWFsaXplZCB0byBsb3dlciBjYXNlIGFuZCBtYXRjaGVkIGlycmVzcGVjdGl2ZSBvZiBhIGxlYWRpbmcgYC5gLlxuICpcbiAqIFdoZW4gYGV4dGVuc2lvbmAgaGFzIG5vIGFzc29jaWF0ZWQgdHlwZSwgdGhlIGZ1bmN0aW9uIHJldHVybnMgYHVuZGVmaW5lZGAuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyB0eXBlQnlFeHRlbnNpb24gfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9tZWRpYV90eXBlcy90eXBlX2J5X2V4dGVuc2lvbi50c1wiO1xuICpcbiAqIHR5cGVCeUV4dGVuc2lvbihcImpzXCIpOyAvLyBgYXBwbGljYXRpb24vanNvbmBcbiAqIHR5cGVCeUV4dGVuc2lvbihcIi5IVE1MXCIpOyAvLyBgdGV4dC9odG1sYFxuICogdHlwZUJ5RXh0ZW5zaW9uKFwiZm9vXCIpOyAvLyB1bmRlZmluZWRcbiAqIHR5cGVCeUV4dGVuc2lvbihcImZpbGUuanNvblwiKTsgLy8gdW5kZWZpbmVkXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHR5cGVCeUV4dGVuc2lvbihleHRlbnNpb246IHN0cmluZyk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gIGV4dGVuc2lvbiA9IGV4dGVuc2lvbi5zdGFydHNXaXRoKFwiLlwiKSA/IGV4dGVuc2lvbi5zbGljZSgxKSA6IGV4dGVuc2lvbjtcbiAgLy8gQHRzLWlnbm9yZSB3b3JrYXJvdW5kIGFyb3VuZCBkZW5vbGFuZC9kbnQjMTQ4XG4gIHJldHVybiB0eXBlcy5nZXQoZXh0ZW5zaW9uLnRvTG93ZXJDYXNlKCkpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxTQUFTLEtBQUssUUFBUSxXQUFXO0FBRWpDOzs7Ozs7Ozs7Ozs7Ozs7Q0FlQyxHQUNELE9BQU8sU0FBUyxnQkFBZ0IsU0FBaUIsRUFBc0I7SUFDckUsWUFBWSxVQUFVLFVBQVUsQ0FBQyxPQUFPLFVBQVUsS0FBSyxDQUFDLEtBQUssU0FBUztJQUN0RSxnREFBZ0Q7SUFDaEQsT0FBTyxNQUFNLEdBQUcsQ0FBQyxVQUFVLFdBQVc7QUFDeEMsQ0FBQyJ9