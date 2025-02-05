// Ported from Go:
// https://github.com/golang/go/tree/go1.13.10/src/hash/fnv/fnv.go
// Copyright 2011 The Go Authors. All rights reserved. BSD license.
// https://github.com/golang/go/blob/master/LICENSE
// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { mul64, swap32 } from "./util.ts";
const prime64Lo = 435;
const prime64Hi = 256;
export const fnv64 = (data)=>{
    let hashLo = 2216829733;
    let hashHi = 3421674724;
    data.forEach((c)=>{
        [hashHi, hashLo] = mul64([
            hashHi,
            hashLo
        ], [
            prime64Hi,
            prime64Lo
        ]);
        hashLo ^= c;
    });
    return new Uint32Array([
        swap32(hashHi >>> 0),
        swap32(hashLo >>> 0)
    ]).buffer;
};
export const fnv64a = (data)=>{
    let hashLo = 2216829733;
    let hashHi = 3421674724;
    data.forEach((c)=>{
        hashLo ^= c;
        [hashHi, hashLo] = mul64([
            hashHi,
            hashLo
        ], [
            prime64Hi,
            prime64Lo
        ]);
    });
    return new Uint32Array([
        swap32(hashHi >>> 0),
        swap32(hashLo >>> 0)
    ]).buffer;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE3My4wL2NyeXB0by9fZm52L2ZudjY0LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIFBvcnRlZCBmcm9tIEdvOlxuLy8gaHR0cHM6Ly9naXRodWIuY29tL2dvbGFuZy9nby90cmVlL2dvMS4xMy4xMC9zcmMvaGFzaC9mbnYvZm52LmdvXG4vLyBDb3B5cmlnaHQgMjAxMSBUaGUgR28gQXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gQlNEIGxpY2Vuc2UuXG4vLyBodHRwczovL2dpdGh1Yi5jb20vZ29sYW5nL2dvL2Jsb2IvbWFzdGVyL0xJQ0VOU0Vcbi8vIENvcHlyaWdodCAyMDE4LTIwMjMgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbmltcG9ydCB7IG11bDY0LCBzd2FwMzIgfSBmcm9tIFwiLi91dGlsLnRzXCI7XG5cbmNvbnN0IHByaW1lNjRMbyA9IDQzNTtcbmNvbnN0IHByaW1lNjRIaSA9IDI1NjtcblxuZXhwb3J0IGNvbnN0IGZudjY0ID0gKGRhdGE6IFVpbnQ4QXJyYXkpOiBBcnJheUJ1ZmZlciA9PiB7XG4gIGxldCBoYXNoTG8gPSAyMjE2ODI5NzMzO1xuICBsZXQgaGFzaEhpID0gMzQyMTY3NDcyNDtcblxuICBkYXRhLmZvckVhY2goKGMpID0+IHtcbiAgICBbaGFzaEhpLCBoYXNoTG9dID0gbXVsNjQoW2hhc2hIaSwgaGFzaExvXSwgW3ByaW1lNjRIaSwgcHJpbWU2NExvXSk7XG4gICAgaGFzaExvIF49IGM7XG4gIH0pO1xuXG4gIHJldHVybiBuZXcgVWludDMyQXJyYXkoW3N3YXAzMihoYXNoSGkgPj4+IDApLCBzd2FwMzIoaGFzaExvID4+PiAwKV0pLmJ1ZmZlcjtcbn07XG5cbmV4cG9ydCBjb25zdCBmbnY2NGEgPSAoZGF0YTogVWludDhBcnJheSk6IEFycmF5QnVmZmVyID0+IHtcbiAgbGV0IGhhc2hMbyA9IDIyMTY4Mjk3MzM7XG4gIGxldCBoYXNoSGkgPSAzNDIxNjc0NzI0O1xuXG4gIGRhdGEuZm9yRWFjaCgoYykgPT4ge1xuICAgIGhhc2hMbyBePSBjO1xuICAgIFtoYXNoSGksIGhhc2hMb10gPSBtdWw2NChbaGFzaEhpLCBoYXNoTG9dLCBbcHJpbWU2NEhpLCBwcmltZTY0TG9dKTtcbiAgfSk7XG5cbiAgcmV0dXJuIG5ldyBVaW50MzJBcnJheShbc3dhcDMyKGhhc2hIaSA+Pj4gMCksIHN3YXAzMihoYXNoTG8gPj4+IDApXSkuYnVmZmVyO1xufTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxrQkFBa0I7QUFDbEIsa0VBQWtFO0FBQ2xFLG1FQUFtRTtBQUNuRSxtREFBbUQ7QUFDbkQsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUVyQyxTQUFTLEtBQUssRUFBRSxNQUFNLFFBQVEsWUFBWTtBQUUxQyxNQUFNLFlBQVk7QUFDbEIsTUFBTSxZQUFZO0FBRWxCLE9BQU8sTUFBTSxRQUFRLENBQUMsT0FBa0M7SUFDdEQsSUFBSSxTQUFTO0lBQ2IsSUFBSSxTQUFTO0lBRWIsS0FBSyxPQUFPLENBQUMsQ0FBQyxJQUFNO1FBQ2xCLENBQUMsUUFBUSxPQUFPLEdBQUcsTUFBTTtZQUFDO1lBQVE7U0FBTyxFQUFFO1lBQUM7WUFBVztTQUFVO1FBQ2pFLFVBQVU7SUFDWjtJQUVBLE9BQU8sSUFBSSxZQUFZO1FBQUMsT0FBTyxXQUFXO1FBQUksT0FBTyxXQUFXO0tBQUcsRUFBRSxNQUFNO0FBQzdFLEVBQUU7QUFFRixPQUFPLE1BQU0sU0FBUyxDQUFDLE9BQWtDO0lBQ3ZELElBQUksU0FBUztJQUNiLElBQUksU0FBUztJQUViLEtBQUssT0FBTyxDQUFDLENBQUMsSUFBTTtRQUNsQixVQUFVO1FBQ1YsQ0FBQyxRQUFRLE9BQU8sR0FBRyxNQUFNO1lBQUM7WUFBUTtTQUFPLEVBQUU7WUFBQztZQUFXO1NBQVU7SUFDbkU7SUFFQSxPQUFPLElBQUksWUFBWTtRQUFDLE9BQU8sV0FBVztRQUFJLE9BQU8sV0FBVztLQUFHLEVBQUUsTUFBTTtBQUM3RSxFQUFFIn0=