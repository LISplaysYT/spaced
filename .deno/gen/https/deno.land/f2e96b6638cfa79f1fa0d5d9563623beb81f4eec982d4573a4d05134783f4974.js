// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { fnv32, fnv32a } from "./fnv32.ts";
import { fnv64, fnv64a } from "./fnv64.ts";
export const fnv = (name, buf)=>{
    if (!buf) {
        throw new TypeError("no data provided for hashing");
    }
    switch(name){
        case "FNV32":
            return fnv32(buf);
        case "FNV64":
            return fnv64(buf);
        case "FNV32A":
            return fnv32a(buf);
        case "FNV64A":
            return fnv64a(buf);
        default:
            throw new TypeError(`unsupported fnv digest: ${name}`);
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE3My4wL2NyeXB0by9fZm52L2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjMgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbmltcG9ydCB7IGZudjMyLCBmbnYzMmEgfSBmcm9tIFwiLi9mbnYzMi50c1wiO1xuaW1wb3J0IHsgZm52NjQsIGZudjY0YSB9IGZyb20gXCIuL2ZudjY0LnRzXCI7XG5cbmV4cG9ydCBjb25zdCBmbnYgPSAobmFtZTogc3RyaW5nLCBidWY6IFVpbnQ4QXJyYXkgfCB1bmRlZmluZWQpOiBBcnJheUJ1ZmZlciA9PiB7XG4gIGlmICghYnVmKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIm5vIGRhdGEgcHJvdmlkZWQgZm9yIGhhc2hpbmdcIik7XG4gIH1cblxuICBzd2l0Y2ggKG5hbWUpIHtcbiAgICBjYXNlIFwiRk5WMzJcIjpcbiAgICAgIHJldHVybiBmbnYzMihidWYpO1xuICAgIGNhc2UgXCJGTlY2NFwiOlxuICAgICAgcmV0dXJuIGZudjY0KGJ1Zik7XG4gICAgY2FzZSBcIkZOVjMyQVwiOlxuICAgICAgcmV0dXJuIGZudjMyYShidWYpO1xuICAgIGNhc2UgXCJGTlY2NEFcIjpcbiAgICAgIHJldHVybiBmbnY2NGEoYnVmKTtcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgdW5zdXBwb3J0ZWQgZm52IGRpZ2VzdDogJHtuYW1lfWApO1xuICB9XG59O1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFFckMsU0FBUyxLQUFLLEVBQUUsTUFBTSxRQUFRLGFBQWE7QUFDM0MsU0FBUyxLQUFLLEVBQUUsTUFBTSxRQUFRLGFBQWE7QUFFM0MsT0FBTyxNQUFNLE1BQU0sQ0FBQyxNQUFjLE1BQTZDO0lBQzdFLElBQUksQ0FBQyxLQUFLO1FBQ1IsTUFBTSxJQUFJLFVBQVUsZ0NBQWdDO0lBQ3RELENBQUM7SUFFRCxPQUFRO1FBQ04sS0FBSztZQUNILE9BQU8sTUFBTTtRQUNmLEtBQUs7WUFDSCxPQUFPLE1BQU07UUFDZixLQUFLO1lBQ0gsT0FBTyxPQUFPO1FBQ2hCLEtBQUs7WUFDSCxPQUFPLE9BQU87UUFDaEI7WUFDRSxNQUFNLElBQUksVUFBVSxDQUFDLHdCQUF3QixFQUFFLEtBQUssQ0FBQyxFQUFFO0lBQzNEO0FBQ0YsRUFBRSJ9