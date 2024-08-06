// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Returns a new record with all entries of the given record except the ones
 * that have a value that does not match the given predicate.
 *
 * @example
 * ```ts
 * import { filterValues } from "https://deno.land/std@$STD_VERSION/collections/filter_values.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const people = {
 *   "Arnold": 37,
 *   "Sarah": 7,
 *   "Kim": 23,
 * };
 * const adults = filterValues(people, (it) => it >= 18);
 *
 * assertEquals(
 *   adults,
 *   {
 *     "Arnold": 37,
 *     "Kim": 23,
 *   },
 * );
 * ```
 */ export function filterValues(record, predicate) {
    const ret = {};
    const entries = Object.entries(record);
    for (const [key, value] of entries){
        if (predicate(value)) {
            ret[key] = value;
        }
    }
    return ret;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE3My4wL2NvbGxlY3Rpb25zL2ZpbHRlcl92YWx1ZXMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMyB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuLyoqXG4gKiBSZXR1cm5zIGEgbmV3IHJlY29yZCB3aXRoIGFsbCBlbnRyaWVzIG9mIHRoZSBnaXZlbiByZWNvcmQgZXhjZXB0IHRoZSBvbmVzXG4gKiB0aGF0IGhhdmUgYSB2YWx1ZSB0aGF0IGRvZXMgbm90IG1hdGNoIHRoZSBnaXZlbiBwcmVkaWNhdGUuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBmaWx0ZXJWYWx1ZXMgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9jb2xsZWN0aW9ucy9maWx0ZXJfdmFsdWVzLnRzXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi90ZXN0aW5nL2Fzc2VydHMudHNcIjtcbiAqXG4gKiBjb25zdCBwZW9wbGUgPSB7XG4gKiAgIFwiQXJub2xkXCI6IDM3LFxuICogICBcIlNhcmFoXCI6IDcsXG4gKiAgIFwiS2ltXCI6IDIzLFxuICogfTtcbiAqIGNvbnN0IGFkdWx0cyA9IGZpbHRlclZhbHVlcyhwZW9wbGUsIChpdCkgPT4gaXQgPj0gMTgpO1xuICpcbiAqIGFzc2VydEVxdWFscyhcbiAqICAgYWR1bHRzLFxuICogICB7XG4gKiAgICAgXCJBcm5vbGRcIjogMzcsXG4gKiAgICAgXCJLaW1cIjogMjMsXG4gKiAgIH0sXG4gKiApO1xuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaWx0ZXJWYWx1ZXM8VD4oXG4gIHJlY29yZDogUmVhZG9ubHk8UmVjb3JkPHN0cmluZywgVD4+LFxuICBwcmVkaWNhdGU6ICh2YWx1ZTogVCkgPT4gYm9vbGVhbixcbik6IFJlY29yZDxzdHJpbmcsIFQ+IHtcbiAgY29uc3QgcmV0OiBSZWNvcmQ8c3RyaW5nLCBUPiA9IHt9O1xuICBjb25zdCBlbnRyaWVzID0gT2JqZWN0LmVudHJpZXMocmVjb3JkKTtcblxuICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBlbnRyaWVzKSB7XG4gICAgaWYgKHByZWRpY2F0ZSh2YWx1ZSkpIHtcbiAgICAgIHJldFtrZXldID0gdmFsdWU7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJldDtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0F3QkMsR0FDRCxPQUFPLFNBQVMsYUFDZCxNQUFtQyxFQUNuQyxTQUFnQyxFQUNiO0lBQ25CLE1BQU0sTUFBeUIsQ0FBQztJQUNoQyxNQUFNLFVBQVUsT0FBTyxPQUFPLENBQUM7SUFFL0IsS0FBSyxNQUFNLENBQUMsS0FBSyxNQUFNLElBQUksUUFBUztRQUNsQyxJQUFJLFVBQVUsUUFBUTtZQUNwQixHQUFHLENBQUMsSUFBSSxHQUFHO1FBQ2IsQ0FBQztJQUNIO0lBRUEsT0FBTztBQUNULENBQUMifQ==