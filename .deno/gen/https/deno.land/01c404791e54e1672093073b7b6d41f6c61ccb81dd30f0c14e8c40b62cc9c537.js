// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Filters the given array, removing all elements that do not match the given predicate
 * **in place. This means `array` will be modified!**.
 */ export function filterInPlace(array, predicate) {
    let outputIndex = 0;
    for (const cur of array){
        if (!predicate(cur)) {
            continue;
        }
        array[outputIndex] = cur;
        outputIndex += 1;
    }
    array.splice(outputIndex);
    return array;
}
/**
 * Produces a random number between the inclusive `lower` and `upper` bounds.
 */ export function randomInteger(lower, upper) {
    return lower + Math.floor(Math.random() * (upper - lower + 1));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE3My4wL2NvbGxlY3Rpb25zL191dGlscy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIzIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG4vKipcbiAqIEZpbHRlcnMgdGhlIGdpdmVuIGFycmF5LCByZW1vdmluZyBhbGwgZWxlbWVudHMgdGhhdCBkbyBub3QgbWF0Y2ggdGhlIGdpdmVuIHByZWRpY2F0ZVxuICogKippbiBwbGFjZS4gVGhpcyBtZWFucyBgYXJyYXlgIHdpbGwgYmUgbW9kaWZpZWQhKiouXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaWx0ZXJJblBsYWNlPFQ+KFxuICBhcnJheTogQXJyYXk8VD4sXG4gIHByZWRpY2F0ZTogKGVsOiBUKSA9PiBib29sZWFuLFxuKTogQXJyYXk8VD4ge1xuICBsZXQgb3V0cHV0SW5kZXggPSAwO1xuXG4gIGZvciAoY29uc3QgY3VyIG9mIGFycmF5KSB7XG4gICAgaWYgKCFwcmVkaWNhdGUoY3VyKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgYXJyYXlbb3V0cHV0SW5kZXhdID0gY3VyO1xuICAgIG91dHB1dEluZGV4ICs9IDE7XG4gIH1cblxuICBhcnJheS5zcGxpY2Uob3V0cHV0SW5kZXgpO1xuXG4gIHJldHVybiBhcnJheTtcbn1cblxuLyoqXG4gKiBQcm9kdWNlcyBhIHJhbmRvbSBudW1iZXIgYmV0d2VlbiB0aGUgaW5jbHVzaXZlIGBsb3dlcmAgYW5kIGB1cHBlcmAgYm91bmRzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmFuZG9tSW50ZWdlcihsb3dlcjogbnVtYmVyLCB1cHBlcjogbnVtYmVyKSB7XG4gIHJldHVybiBsb3dlciArIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqICh1cHBlciAtIGxvd2VyICsgMSkpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFFckM7OztDQUdDLEdBQ0QsT0FBTyxTQUFTLGNBQ2QsS0FBZSxFQUNmLFNBQTZCLEVBQ25CO0lBQ1YsSUFBSSxjQUFjO0lBRWxCLEtBQUssTUFBTSxPQUFPLE1BQU87UUFDdkIsSUFBSSxDQUFDLFVBQVUsTUFBTTtZQUNuQixRQUFTO1FBQ1gsQ0FBQztRQUVELEtBQUssQ0FBQyxZQUFZLEdBQUc7UUFDckIsZUFBZTtJQUNqQjtJQUVBLE1BQU0sTUFBTSxDQUFDO0lBRWIsT0FBTztBQUNULENBQUM7QUFFRDs7Q0FFQyxHQUNELE9BQU8sU0FBUyxjQUFjLEtBQWEsRUFBRSxLQUFhLEVBQUU7SUFDMUQsT0FBTyxRQUFRLEtBQUssS0FBSyxDQUFDLEtBQUssTUFBTSxLQUFLLENBQUMsUUFBUSxRQUFRLENBQUM7QUFDOUQsQ0FBQyJ9