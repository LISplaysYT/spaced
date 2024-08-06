// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * All internal non-test code, that is files that do not have `test` or `bench` in the name, must use the assertion functions within `_utils/asserts.ts` and not `testing/asserts.ts`. This is to create a separation of concerns between internal and testing assertions.
 */ export class DenoStdInternalError extends Error {
    constructor(message){
        super(message);
        this.name = "DenoStdInternalError";
    }
}
/** Make an assertion, if not `true`, then throw. */ export function assert(expr, msg = "") {
    if (!expr) {
        throw new DenoStdInternalError(msg);
    }
}
/** Use this to assert unreachable code. */ export function unreachable() {
    throw new DenoStdInternalError("unreachable");
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE3My4wL191dGlsL2Fzc2VydHMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMyB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuLyoqXG4gKiBBbGwgaW50ZXJuYWwgbm9uLXRlc3QgY29kZSwgdGhhdCBpcyBmaWxlcyB0aGF0IGRvIG5vdCBoYXZlIGB0ZXN0YCBvciBgYmVuY2hgIGluIHRoZSBuYW1lLCBtdXN0IHVzZSB0aGUgYXNzZXJ0aW9uIGZ1bmN0aW9ucyB3aXRoaW4gYF91dGlscy9hc3NlcnRzLnRzYCBhbmQgbm90IGB0ZXN0aW5nL2Fzc2VydHMudHNgLiBUaGlzIGlzIHRvIGNyZWF0ZSBhIHNlcGFyYXRpb24gb2YgY29uY2VybnMgYmV0d2VlbiBpbnRlcm5hbCBhbmQgdGVzdGluZyBhc3NlcnRpb25zLlxuICovXG5cbmV4cG9ydCBjbGFzcyBEZW5vU3RkSW50ZXJuYWxFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3IobWVzc2FnZTogc3RyaW5nKSB7XG4gICAgc3VwZXIobWVzc2FnZSk7XG4gICAgdGhpcy5uYW1lID0gXCJEZW5vU3RkSW50ZXJuYWxFcnJvclwiO1xuICB9XG59XG5cbi8qKiBNYWtlIGFuIGFzc2VydGlvbiwgaWYgbm90IGB0cnVlYCwgdGhlbiB0aHJvdy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnQoZXhwcjogdW5rbm93biwgbXNnID0gXCJcIik6IGFzc2VydHMgZXhwciB7XG4gIGlmICghZXhwcikge1xuICAgIHRocm93IG5ldyBEZW5vU3RkSW50ZXJuYWxFcnJvcihtc2cpO1xuICB9XG59XG5cbi8qKiBVc2UgdGhpcyB0byBhc3NlcnQgdW5yZWFjaGFibGUgY29kZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1bnJlYWNoYWJsZSgpOiBuZXZlciB7XG4gIHRocm93IG5ldyBEZW5vU3RkSW50ZXJuYWxFcnJvcihcInVucmVhY2hhYmxlXCIpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFFckM7O0NBRUMsR0FFRCxPQUFPLE1BQU0sNkJBQTZCO0lBQ3hDLFlBQVksT0FBZSxDQUFFO1FBQzNCLEtBQUssQ0FBQztRQUNOLElBQUksQ0FBQyxJQUFJLEdBQUc7SUFDZDtBQUNGLENBQUM7QUFFRCxrREFBa0QsR0FDbEQsT0FBTyxTQUFTLE9BQU8sSUFBYSxFQUFFLE1BQU0sRUFBRSxFQUFnQjtJQUM1RCxJQUFJLENBQUMsTUFBTTtRQUNULE1BQU0sSUFBSSxxQkFBcUIsS0FBSztJQUN0QyxDQUFDO0FBQ0gsQ0FBQztBQUVELHlDQUF5QyxHQUN6QyxPQUFPLFNBQVMsY0FBcUI7SUFDbkMsTUFBTSxJQUFJLHFCQUFxQixlQUFlO0FBQ2hELENBQUMifQ==