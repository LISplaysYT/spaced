// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { STATUS_TEXT } from "./http_status.ts";
import { deepMerge } from "../collections/deep_merge.ts";
/** Returns true if the etags match. Weak etag comparisons are handled. */ export function compareEtag(a, b) {
    if (a === b) {
        return true;
    }
    if (a.startsWith("W/") && !b.startsWith("W/")) {
        return a.slice(2) === b;
    }
    if (!a.startsWith("W/") && b.startsWith("W/")) {
        return a === b.slice(2);
    }
    return false;
}
/**
 * Internal utility for returning a standardized response, automatically defining the body, status code and status text, according to the response type.
 */ export function createCommonResponse(status, body, init) {
    if (body === undefined) {
        body = STATUS_TEXT[status];
    }
    init = deepMerge({
        status,
        statusText: STATUS_TEXT[status]
    }, init ?? {});
    return new Response(body, init);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE3My4wL2h0dHAvdXRpbC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIzIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuaW1wb3J0IHsgU3RhdHVzLCBTVEFUVVNfVEVYVCB9IGZyb20gXCIuL2h0dHBfc3RhdHVzLnRzXCI7XG5pbXBvcnQgeyBkZWVwTWVyZ2UgfSBmcm9tIFwiLi4vY29sbGVjdGlvbnMvZGVlcF9tZXJnZS50c1wiO1xuXG4vKiogUmV0dXJucyB0cnVlIGlmIHRoZSBldGFncyBtYXRjaC4gV2VhayBldGFnIGNvbXBhcmlzb25zIGFyZSBoYW5kbGVkLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXBhcmVFdGFnKGE6IHN0cmluZywgYjogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGlmIChhID09PSBiKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgaWYgKGEuc3RhcnRzV2l0aChcIlcvXCIpICYmICFiLnN0YXJ0c1dpdGgoXCJXL1wiKSkge1xuICAgIHJldHVybiBhLnNsaWNlKDIpID09PSBiO1xuICB9XG4gIGlmICghYS5zdGFydHNXaXRoKFwiVy9cIikgJiYgYi5zdGFydHNXaXRoKFwiVy9cIikpIHtcbiAgICByZXR1cm4gYSA9PT0gYi5zbGljZSgyKTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogSW50ZXJuYWwgdXRpbGl0eSBmb3IgcmV0dXJuaW5nIGEgc3RhbmRhcmRpemVkIHJlc3BvbnNlLCBhdXRvbWF0aWNhbGx5IGRlZmluaW5nIHRoZSBib2R5LCBzdGF0dXMgY29kZSBhbmQgc3RhdHVzIHRleHQsIGFjY29yZGluZyB0byB0aGUgcmVzcG9uc2UgdHlwZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUNvbW1vblJlc3BvbnNlKFxuICBzdGF0dXM6IFN0YXR1cyxcbiAgYm9keT86IEJvZHlJbml0IHwgbnVsbCxcbiAgaW5pdD86IFJlc3BvbnNlSW5pdCxcbik6IFJlc3BvbnNlIHtcbiAgaWYgKGJvZHkgPT09IHVuZGVmaW5lZCkge1xuICAgIGJvZHkgPSBTVEFUVVNfVEVYVFtzdGF0dXNdO1xuICB9XG4gIGluaXQgPSBkZWVwTWVyZ2Uoe1xuICAgIHN0YXR1cyxcbiAgICBzdGF0dXNUZXh0OiBTVEFUVVNfVEVYVFtzdGF0dXNdLFxuICB9LCBpbml0ID8/IHt9KTtcbiAgcmV0dXJuIG5ldyBSZXNwb25zZShib2R5LCBpbml0KTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUsU0FBaUIsV0FBVyxRQUFRLG1CQUFtQjtBQUN2RCxTQUFTLFNBQVMsUUFBUSwrQkFBK0I7QUFFekQsd0VBQXdFLEdBQ3hFLE9BQU8sU0FBUyxZQUFZLENBQVMsRUFBRSxDQUFTLEVBQVc7SUFDekQsSUFBSSxNQUFNLEdBQUc7UUFDWCxPQUFPLElBQUk7SUFDYixDQUFDO0lBQ0QsSUFBSSxFQUFFLFVBQVUsQ0FBQyxTQUFTLENBQUMsRUFBRSxVQUFVLENBQUMsT0FBTztRQUM3QyxPQUFPLEVBQUUsS0FBSyxDQUFDLE9BQU87SUFDeEIsQ0FBQztJQUNELElBQUksQ0FBQyxFQUFFLFVBQVUsQ0FBQyxTQUFTLEVBQUUsVUFBVSxDQUFDLE9BQU87UUFDN0MsT0FBTyxNQUFNLEVBQUUsS0FBSyxDQUFDO0lBQ3ZCLENBQUM7SUFDRCxPQUFPLEtBQUs7QUFDZCxDQUFDO0FBRUQ7O0NBRUMsR0FDRCxPQUFPLFNBQVMscUJBQ2QsTUFBYyxFQUNkLElBQXNCLEVBQ3RCLElBQW1CLEVBQ1Q7SUFDVixJQUFJLFNBQVMsV0FBVztRQUN0QixPQUFPLFdBQVcsQ0FBQyxPQUFPO0lBQzVCLENBQUM7SUFDRCxPQUFPLFVBQVU7UUFDZjtRQUNBLFlBQVksV0FBVyxDQUFDLE9BQU87SUFDakMsR0FBRyxRQUFRLENBQUM7SUFDWixPQUFPLElBQUksU0FBUyxNQUFNO0FBQzVCLENBQUMifQ==