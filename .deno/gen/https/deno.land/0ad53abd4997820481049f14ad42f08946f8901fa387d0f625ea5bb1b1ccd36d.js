// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Returns an array excluding all given values.
 *
 * @example
 * ```ts
 * import { withoutAll } from "https://deno.land/std@$STD_VERSION/collections/without_all.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const withoutList = withoutAll([2, 1, 2, 3], [1, 2]);
 *
 * assertEquals(withoutList, [3]);
 * ```
 */ export function withoutAll(array, values) {
    const toExclude = new Set(values);
    return array.filter((it)=>!toExclude.has(it));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE3My4wL2NvbGxlY3Rpb25zL3dpdGhvdXRfYWxsLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjMgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbi8qKlxuICogUmV0dXJucyBhbiBhcnJheSBleGNsdWRpbmcgYWxsIGdpdmVuIHZhbHVlcy5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IHdpdGhvdXRBbGwgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9jb2xsZWN0aW9ucy93aXRob3V0X2FsbC50c1wiO1xuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vdGVzdGluZy9hc3NlcnRzLnRzXCI7XG4gKlxuICogY29uc3Qgd2l0aG91dExpc3QgPSB3aXRob3V0QWxsKFsyLCAxLCAyLCAzXSwgWzEsIDJdKTtcbiAqXG4gKiBhc3NlcnRFcXVhbHMod2l0aG91dExpc3QsIFszXSk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdpdGhvdXRBbGw8VD4oYXJyYXk6IHJlYWRvbmx5IFRbXSwgdmFsdWVzOiByZWFkb25seSBUW10pOiBUW10ge1xuICBjb25zdCB0b0V4Y2x1ZGUgPSBuZXcgU2V0KHZhbHVlcyk7XG4gIHJldHVybiBhcnJheS5maWx0ZXIoKGl0KSA9PiAhdG9FeGNsdWRlLmhhcyhpdCkpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFFckM7Ozs7Ozs7Ozs7OztDQVlDLEdBQ0QsT0FBTyxTQUFTLFdBQWMsS0FBbUIsRUFBRSxNQUFvQixFQUFPO0lBQzVFLE1BQU0sWUFBWSxJQUFJLElBQUk7SUFDMUIsT0FBTyxNQUFNLE1BQU0sQ0FBQyxDQUFDLEtBQU8sQ0FBQyxVQUFVLEdBQUcsQ0FBQztBQUM3QyxDQUFDIn0=