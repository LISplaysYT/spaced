// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
/**
 * Formats the given date to IMF date time format. (Reference:
 * https://tools.ietf.org/html/rfc7231#section-7.1.1.1).
 * IMF is the time format to use when generating times in HTTP
 * headers. The time being formatted must be in UTC for Format to
 * generate the correct format.
 *
 * @example
 * ```ts
 * import { toIMF } from "https://deno.land/std@$STD_VERSION/datetime/to_imf.ts";
 *
 * toIMF(new Date(0)); // => returns "Thu, 01 Jan 1970 00:00:00 GMT"
 * ```
 * @param date Date to parse
 * @return IMF date formatted string
 */ export function toIMF(date) {
    function dtPad(v, lPad = 2) {
        return v.padStart(lPad, "0");
    }
    const d = dtPad(date.getUTCDate().toString());
    const h = dtPad(date.getUTCHours().toString());
    const min = dtPad(date.getUTCMinutes().toString());
    const s = dtPad(date.getUTCSeconds().toString());
    const y = date.getUTCFullYear();
    const days = [
        "Sun",
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat"
    ];
    const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec"
    ];
    return `${days[date.getUTCDay()]}, ${d} ${months[date.getUTCMonth()]} ${y} ${h}:${min}:${s} GMT`;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE3My4wL2RhdGV0aW1lL3RvX2ltZi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIzIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLyoqXG4gKiBGb3JtYXRzIHRoZSBnaXZlbiBkYXRlIHRvIElNRiBkYXRlIHRpbWUgZm9ybWF0LiAoUmVmZXJlbmNlOlxuICogaHR0cHM6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzcyMzEjc2VjdGlvbi03LjEuMS4xKS5cbiAqIElNRiBpcyB0aGUgdGltZSBmb3JtYXQgdG8gdXNlIHdoZW4gZ2VuZXJhdGluZyB0aW1lcyBpbiBIVFRQXG4gKiBoZWFkZXJzLiBUaGUgdGltZSBiZWluZyBmb3JtYXR0ZWQgbXVzdCBiZSBpbiBVVEMgZm9yIEZvcm1hdCB0b1xuICogZ2VuZXJhdGUgdGhlIGNvcnJlY3QgZm9ybWF0LlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgdG9JTUYgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9kYXRldGltZS90b19pbWYudHNcIjtcbiAqXG4gKiB0b0lNRihuZXcgRGF0ZSgwKSk7IC8vID0+IHJldHVybnMgXCJUaHUsIDAxIEphbiAxOTcwIDAwOjAwOjAwIEdNVFwiXG4gKiBgYGBcbiAqIEBwYXJhbSBkYXRlIERhdGUgdG8gcGFyc2VcbiAqIEByZXR1cm4gSU1GIGRhdGUgZm9ybWF0dGVkIHN0cmluZ1xuICovXG5leHBvcnQgZnVuY3Rpb24gdG9JTUYoZGF0ZTogRGF0ZSk6IHN0cmluZyB7XG4gIGZ1bmN0aW9uIGR0UGFkKHY6IHN0cmluZywgbFBhZCA9IDIpOiBzdHJpbmcge1xuICAgIHJldHVybiB2LnBhZFN0YXJ0KGxQYWQsIFwiMFwiKTtcbiAgfVxuICBjb25zdCBkID0gZHRQYWQoZGF0ZS5nZXRVVENEYXRlKCkudG9TdHJpbmcoKSk7XG4gIGNvbnN0IGggPSBkdFBhZChkYXRlLmdldFVUQ0hvdXJzKCkudG9TdHJpbmcoKSk7XG4gIGNvbnN0IG1pbiA9IGR0UGFkKGRhdGUuZ2V0VVRDTWludXRlcygpLnRvU3RyaW5nKCkpO1xuICBjb25zdCBzID0gZHRQYWQoZGF0ZS5nZXRVVENTZWNvbmRzKCkudG9TdHJpbmcoKSk7XG4gIGNvbnN0IHkgPSBkYXRlLmdldFVUQ0Z1bGxZZWFyKCk7XG4gIGNvbnN0IGRheXMgPSBbXCJTdW5cIiwgXCJNb25cIiwgXCJUdWVcIiwgXCJXZWRcIiwgXCJUaHVcIiwgXCJGcmlcIiwgXCJTYXRcIl07XG4gIGNvbnN0IG1vbnRocyA9IFtcbiAgICBcIkphblwiLFxuICAgIFwiRmViXCIsXG4gICAgXCJNYXJcIixcbiAgICBcIkFwclwiLFxuICAgIFwiTWF5XCIsXG4gICAgXCJKdW5cIixcbiAgICBcIkp1bFwiLFxuICAgIFwiQXVnXCIsXG4gICAgXCJTZXBcIixcbiAgICBcIk9jdFwiLFxuICAgIFwiTm92XCIsXG4gICAgXCJEZWNcIixcbiAgXTtcbiAgcmV0dXJuIGAke2RheXNbZGF0ZS5nZXRVVENEYXkoKV19LCAke2R9ICR7XG4gICAgbW9udGhzW2RhdGUuZ2V0VVRDTW9udGgoKV1cbiAgfSAke3l9ICR7aH06JHttaW59OiR7c30gR01UYDtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUU7Ozs7Ozs7Ozs7Ozs7OztDQWVDLEdBQ0QsT0FBTyxTQUFTLE1BQU0sSUFBVSxFQUFVO0lBQ3hDLFNBQVMsTUFBTSxDQUFTLEVBQUUsT0FBTyxDQUFDLEVBQVU7UUFDMUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxNQUFNO0lBQzFCO0lBQ0EsTUFBTSxJQUFJLE1BQU0sS0FBSyxVQUFVLEdBQUcsUUFBUTtJQUMxQyxNQUFNLElBQUksTUFBTSxLQUFLLFdBQVcsR0FBRyxRQUFRO0lBQzNDLE1BQU0sTUFBTSxNQUFNLEtBQUssYUFBYSxHQUFHLFFBQVE7SUFDL0MsTUFBTSxJQUFJLE1BQU0sS0FBSyxhQUFhLEdBQUcsUUFBUTtJQUM3QyxNQUFNLElBQUksS0FBSyxjQUFjO0lBQzdCLE1BQU0sT0FBTztRQUFDO1FBQU87UUFBTztRQUFPO1FBQU87UUFBTztRQUFPO0tBQU07SUFDOUQsTUFBTSxTQUFTO1FBQ2I7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO0tBQ0Q7SUFDRCxPQUFPLENBQUMsRUFBRSxJQUFJLENBQUMsS0FBSyxTQUFTLEdBQUcsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQ3RDLE1BQU0sQ0FBQyxLQUFLLFdBQVcsR0FBRyxDQUMzQixDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUM7QUFDOUIsQ0FBQyJ9