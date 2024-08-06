// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { isIterator, isToken, needsEncoding } from "./_util.ts";
/** Serializes the media type and the optional parameters as a media type
 * conforming to RFC 2045 and RFC 2616.
 *
 * The type and parameter names are written in lower-case.
 *
 * When any of the arguments results in a standard violation then the return
 * value will be an empty string (`""`).
 *
 * @example
 * ```ts
 * import { formatMediaType } from "https://deno.land/std@$STD_VERSION/media_types/format_media_type.ts";
 *
 * formatMediaType("text/plain", { charset: "UTF-8" }); // `text/plain; charset=UTF-8`
 * ```
 */ export function formatMediaType(type, param) {
    let b = "";
    const [major, sub] = type.split("/");
    if (!sub) {
        if (!isToken(type)) {
            return "";
        }
        b += type.toLowerCase();
    } else {
        if (!isToken(major) || !isToken(sub)) {
            return "";
        }
        b += `${major.toLowerCase()}/${sub.toLowerCase()}`;
    }
    if (param) {
        param = isIterator(param) ? Object.fromEntries(param) : param;
        const attrs = Object.keys(param);
        attrs.sort();
        for (const attribute of attrs){
            if (!isToken(attribute)) {
                return "";
            }
            const value = param[attribute];
            b += `; ${attribute.toLowerCase()}`;
            const needEnc = needsEncoding(value);
            if (needEnc) {
                b += "*";
            }
            b += "=";
            if (needEnc) {
                b += `utf-8''${encodeURIComponent(value)}`;
                continue;
            }
            if (isToken(value)) {
                b += value;
                continue;
            }
            b += `"${value.replace(/["\\]/gi, (m)=>`\\${m}`)}"`;
        }
    }
    return b;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE3My4wL21lZGlhX3R5cGVzL2Zvcm1hdF9tZWRpYV90eXBlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjMgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG5pbXBvcnQgeyBpc0l0ZXJhdG9yLCBpc1Rva2VuLCBuZWVkc0VuY29kaW5nIH0gZnJvbSBcIi4vX3V0aWwudHNcIjtcblxuLyoqIFNlcmlhbGl6ZXMgdGhlIG1lZGlhIHR5cGUgYW5kIHRoZSBvcHRpb25hbCBwYXJhbWV0ZXJzIGFzIGEgbWVkaWEgdHlwZVxuICogY29uZm9ybWluZyB0byBSRkMgMjA0NSBhbmQgUkZDIDI2MTYuXG4gKlxuICogVGhlIHR5cGUgYW5kIHBhcmFtZXRlciBuYW1lcyBhcmUgd3JpdHRlbiBpbiBsb3dlci1jYXNlLlxuICpcbiAqIFdoZW4gYW55IG9mIHRoZSBhcmd1bWVudHMgcmVzdWx0cyBpbiBhIHN0YW5kYXJkIHZpb2xhdGlvbiB0aGVuIHRoZSByZXR1cm5cbiAqIHZhbHVlIHdpbGwgYmUgYW4gZW1wdHkgc3RyaW5nIChgXCJcImApLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgZm9ybWF0TWVkaWFUeXBlIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vbWVkaWFfdHlwZXMvZm9ybWF0X21lZGlhX3R5cGUudHNcIjtcbiAqXG4gKiBmb3JtYXRNZWRpYVR5cGUoXCJ0ZXh0L3BsYWluXCIsIHsgY2hhcnNldDogXCJVVEYtOFwiIH0pOyAvLyBgdGV4dC9wbGFpbjsgY2hhcnNldD1VVEYtOGBcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0TWVkaWFUeXBlKFxuICB0eXBlOiBzdHJpbmcsXG4gIHBhcmFtPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPiB8IEl0ZXJhYmxlPFtzdHJpbmcsIHN0cmluZ10+LFxuKTogc3RyaW5nIHtcbiAgbGV0IGIgPSBcIlwiO1xuICBjb25zdCBbbWFqb3IsIHN1Yl0gPSB0eXBlLnNwbGl0KFwiL1wiKTtcbiAgaWYgKCFzdWIpIHtcbiAgICBpZiAoIWlzVG9rZW4odHlwZSkpIHtcbiAgICAgIHJldHVybiBcIlwiO1xuICAgIH1cbiAgICBiICs9IHR5cGUudG9Mb3dlckNhc2UoKTtcbiAgfSBlbHNlIHtcbiAgICBpZiAoIWlzVG9rZW4obWFqb3IpIHx8ICFpc1Rva2VuKHN1YikpIHtcbiAgICAgIHJldHVybiBcIlwiO1xuICAgIH1cbiAgICBiICs9IGAke21ham9yLnRvTG93ZXJDYXNlKCl9LyR7c3ViLnRvTG93ZXJDYXNlKCl9YDtcbiAgfVxuXG4gIGlmIChwYXJhbSkge1xuICAgIHBhcmFtID0gaXNJdGVyYXRvcihwYXJhbSkgPyBPYmplY3QuZnJvbUVudHJpZXMocGFyYW0pIDogcGFyYW07XG4gICAgY29uc3QgYXR0cnMgPSBPYmplY3Qua2V5cyhwYXJhbSk7XG4gICAgYXR0cnMuc29ydCgpO1xuXG4gICAgZm9yIChjb25zdCBhdHRyaWJ1dGUgb2YgYXR0cnMpIHtcbiAgICAgIGlmICghaXNUb2tlbihhdHRyaWJ1dGUpKSB7XG4gICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgfVxuICAgICAgY29uc3QgdmFsdWUgPSBwYXJhbVthdHRyaWJ1dGVdO1xuICAgICAgYiArPSBgOyAke2F0dHJpYnV0ZS50b0xvd2VyQ2FzZSgpfWA7XG5cbiAgICAgIGNvbnN0IG5lZWRFbmMgPSBuZWVkc0VuY29kaW5nKHZhbHVlKTtcbiAgICAgIGlmIChuZWVkRW5jKSB7XG4gICAgICAgIGIgKz0gXCIqXCI7XG4gICAgICB9XG4gICAgICBiICs9IFwiPVwiO1xuXG4gICAgICBpZiAobmVlZEVuYykge1xuICAgICAgICBiICs9IGB1dGYtOCcnJHtlbmNvZGVVUklDb21wb25lbnQodmFsdWUpfWA7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoaXNUb2tlbih2YWx1ZSkpIHtcbiAgICAgICAgYiArPSB2YWx1ZTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBiICs9IGBcIiR7dmFsdWUucmVwbGFjZSgvW1wiXFxcXF0vZ2ksIChtKSA9PiBgXFxcXCR7bX1gKX1cImA7XG4gICAgfVxuICB9XG4gIHJldHVybiBiO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxTQUFTLFVBQVUsRUFBRSxPQUFPLEVBQUUsYUFBYSxRQUFRLGFBQWE7QUFFaEU7Ozs7Ozs7Ozs7Ozs7O0NBY0MsR0FDRCxPQUFPLFNBQVMsZ0JBQ2QsSUFBWSxFQUNaLEtBQTJELEVBQ25EO0lBQ1IsSUFBSSxJQUFJO0lBQ1IsTUFBTSxDQUFDLE9BQU8sSUFBSSxHQUFHLEtBQUssS0FBSyxDQUFDO0lBQ2hDLElBQUksQ0FBQyxLQUFLO1FBQ1IsSUFBSSxDQUFDLFFBQVEsT0FBTztZQUNsQixPQUFPO1FBQ1QsQ0FBQztRQUNELEtBQUssS0FBSyxXQUFXO0lBQ3ZCLE9BQU87UUFDTCxJQUFJLENBQUMsUUFBUSxVQUFVLENBQUMsUUFBUSxNQUFNO1lBQ3BDLE9BQU87UUFDVCxDQUFDO1FBQ0QsS0FBSyxDQUFDLEVBQUUsTUFBTSxXQUFXLEdBQUcsQ0FBQyxFQUFFLElBQUksV0FBVyxHQUFHLENBQUM7SUFDcEQsQ0FBQztJQUVELElBQUksT0FBTztRQUNULFFBQVEsV0FBVyxTQUFTLE9BQU8sV0FBVyxDQUFDLFNBQVMsS0FBSztRQUM3RCxNQUFNLFFBQVEsT0FBTyxJQUFJLENBQUM7UUFDMUIsTUFBTSxJQUFJO1FBRVYsS0FBSyxNQUFNLGFBQWEsTUFBTztZQUM3QixJQUFJLENBQUMsUUFBUSxZQUFZO2dCQUN2QixPQUFPO1lBQ1QsQ0FBQztZQUNELE1BQU0sUUFBUSxLQUFLLENBQUMsVUFBVTtZQUM5QixLQUFLLENBQUMsRUFBRSxFQUFFLFVBQVUsV0FBVyxHQUFHLENBQUM7WUFFbkMsTUFBTSxVQUFVLGNBQWM7WUFDOUIsSUFBSSxTQUFTO2dCQUNYLEtBQUs7WUFDUCxDQUFDO1lBQ0QsS0FBSztZQUVMLElBQUksU0FBUztnQkFDWCxLQUFLLENBQUMsT0FBTyxFQUFFLG1CQUFtQixPQUFPLENBQUM7Z0JBQzFDLFFBQVM7WUFDWCxDQUFDO1lBRUQsSUFBSSxRQUFRLFFBQVE7Z0JBQ2xCLEtBQUs7Z0JBQ0wsUUFBUztZQUNYLENBQUM7WUFDRCxLQUFLLENBQUMsQ0FBQyxFQUFFLE1BQU0sT0FBTyxDQUFDLFdBQVcsQ0FBQyxJQUFNLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUN2RDtJQUNGLENBQUM7SUFDRCxPQUFPO0FBQ1QsQ0FBQyJ9