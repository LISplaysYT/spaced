import { serve } from "https://deno.land/std@0.173.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.173.0/http/file_server.ts";
import { getCookies } from "https://deno.land/std@0.173.0/http/cookie.ts";
import Proxy from "./proxy/proxy.ts";
const proxy = new Proxy("/fetch", "/fetchWs");
import "https://deno.land/std@0.173.0/dotenv/load.ts";
import config from "./config.json" assert {
    type: "json"
};
import { prefix } from "./site/aero/config.js";
await serve(async (req)=>{
    const { key  } = getCookies(req.headers);
    const url = new URL(req.url);
    const unlocked = key === config.key;
    const code = url.search.startsWith("?unlock");
    const usingCrOS = req.headers.get("user-agent")?.includes("CrOS") ?? false;
    const allow = !config.requireUnlock || unlocked || code || usingCrOS;
    if (!allow) {
        const resp = await serveDir(req, {
            fsRoot: config.blockedDir,
            showIndex: true,
            quiet: true
        });
        // Only block html files
        if (resp.headers.get("content-type")?.includes("text/html")) return resp;
    }
    const path = url.pathname;
    if (proxy.route(path)) return await proxy.handle(req);
    else if (proxy.routeWs(path)) return await proxy.handleWs(req);
    else {
        if (path.startsWith(prefix)) return new Response("Failed to start the service worker", {
            status: 404
        });
        const resp1 = await serveDir(req, {
            fsRoot: config.dir,
            showDirListing: true,
            showIndex: true,
            quiet: true
        });
        if (code) resp1.headers.set("set-cookie", "key=unlock; SameSite=None; Secure");
        // TODO: Set status to 404 to avoid storing history on Chromium
        return resp1;
    }
}, {
    port: config.port
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vaG9tZS9ydW5uZXIvSGF2ZW4tRGVwbG95L2FwcC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBzZXJ2ZSB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAMC4xNzMuMC9odHRwL3NlcnZlci50c1wiO1xuaW1wb3J0IHsgc2VydmVEaXIgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQDAuMTczLjAvaHR0cC9maWxlX3NlcnZlci50c1wiO1xuXG5pbXBvcnQgeyBnZXRDb29raWVzIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE3My4wL2h0dHAvY29va2llLnRzXCI7XG5cbmltcG9ydCBQcm94eSBmcm9tIFwiLi9wcm94eS9wcm94eS50c1wiO1xuXG5jb25zdCBwcm94eSA9IG5ldyBQcm94eShcIi9mZXRjaFwiLCBcIi9mZXRjaFdzXCIpO1xuXG5pbXBvcnQgXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAMC4xNzMuMC9kb3RlbnYvbG9hZC50c1wiO1xuaW1wb3J0IGNvbmZpZyBmcm9tIFwiLi9jb25maWcuanNvblwiIGFzc2VydCB7IHR5cGU6IFwianNvblwiIH07XG5cbmltcG9ydCB7IHByZWZpeCB9IGZyb20gXCIuL3NpdGUvYWVyby9jb25maWcuanNcIjtcblxuYXdhaXQgc2VydmUoXG5cdGFzeW5jIChyZXE6IFJlcXVlc3QpOiBQcm9taXNlPFJlc3BvbnNlPiA9PiB7XG5cdFx0Y29uc3QgeyBrZXkgfSA9IGdldENvb2tpZXMocmVxLmhlYWRlcnMpO1xuXG5cdFx0Y29uc3QgdXJsID0gbmV3IFVSTChyZXEudXJsKTtcblx0XHRjb25zdCB1bmxvY2tlZCA9IGtleSA9PT0gY29uZmlnLmtleTtcblx0XHRjb25zdCBjb2RlID0gdXJsLnNlYXJjaC5zdGFydHNXaXRoKFwiP3VubG9ja1wiKTtcblx0XHRjb25zdCB1c2luZ0NyT1MgPSByZXEuaGVhZGVycy5nZXQoXCJ1c2VyLWFnZW50XCIpPy5pbmNsdWRlcyhcIkNyT1NcIikgPz8gZmFsc2U7XG5cdFx0Y29uc3QgYWxsb3cgPSAhY29uZmlnLnJlcXVpcmVVbmxvY2sgfHwgdW5sb2NrZWQgfHwgY29kZSB8fCB1c2luZ0NyT1M7XG5cblx0XHRpZiAoIWFsbG93KSB7XG5cdFx0XHRjb25zdCByZXNwID0gYXdhaXQgc2VydmVEaXIocmVxLCB7XG5cdFx0XHRcdGZzUm9vdDogY29uZmlnLmJsb2NrZWREaXIsXG5cdFx0XHRcdHNob3dJbmRleDogdHJ1ZSxcblx0XHRcdFx0cXVpZXQ6IHRydWUsXG5cdFx0XHR9KTtcblxuXHRcdFx0Ly8gT25seSBibG9jayBodG1sIGZpbGVzXG5cdFx0XHRpZiAocmVzcC5oZWFkZXJzLmdldChcImNvbnRlbnQtdHlwZVwiKT8uaW5jbHVkZXMoXCJ0ZXh0L2h0bWxcIikpIHJldHVybiByZXNwO1xuXHRcdH1cblxuXHRcdGNvbnN0IHBhdGggPSB1cmwucGF0aG5hbWU7XG5cblx0XHRpZiAocHJveHkucm91dGUocGF0aCkpIHJldHVybiBhd2FpdCBwcm94eS5oYW5kbGUocmVxKTtcblx0XHRlbHNlIGlmIChwcm94eS5yb3V0ZVdzKHBhdGgpKSByZXR1cm4gYXdhaXQgcHJveHkuaGFuZGxlV3MocmVxKTtcblx0XHRlbHNlIHtcblx0XHRcdGlmIChwYXRoLnN0YXJ0c1dpdGgocHJlZml4KSlcblx0XHRcdFx0cmV0dXJuIG5ldyBSZXNwb25zZShcIkZhaWxlZCB0byBzdGFydCB0aGUgc2VydmljZSB3b3JrZXJcIiwge1xuXHRcdFx0XHRcdHN0YXR1czogNDA0LFxuXHRcdFx0XHR9KTtcblxuXHRcdFx0Y29uc3QgcmVzcCA9IGF3YWl0IHNlcnZlRGlyKHJlcSwge1xuXHRcdFx0XHRmc1Jvb3Q6IGNvbmZpZy5kaXIsXG5cdFx0XHRcdHNob3dEaXJMaXN0aW5nOiB0cnVlLFxuXHRcdFx0XHRzaG93SW5kZXg6IHRydWUsXG5cdFx0XHRcdHF1aWV0OiB0cnVlLFxuXHRcdFx0fSk7XG5cblx0XHRcdGlmIChjb2RlKVxuXHRcdFx0XHRyZXNwLmhlYWRlcnMuc2V0KFwic2V0LWNvb2tpZVwiLCBcImtleT11bmxvY2s7IFNhbWVTaXRlPU5vbmU7IFNlY3VyZVwiKTtcblxuXHRcdFx0Ly8gVE9ETzogU2V0IHN0YXR1cyB0byA0MDQgdG8gYXZvaWQgc3RvcmluZyBoaXN0b3J5IG9uIENocm9taXVtXG5cdFx0XHRyZXR1cm4gcmVzcDtcblx0XHR9XG5cdH0sXG5cdHsgcG9ydDogY29uZmlnLnBvcnQgfVxuKTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxTQUFTLEtBQUssUUFBUSwrQ0FBK0M7QUFDckUsU0FBUyxRQUFRLFFBQVEsb0RBQW9EO0FBRTdFLFNBQVMsVUFBVSxRQUFRLCtDQUErQztBQUUxRSxPQUFPLFdBQVcsbUJBQW1CO0FBRXJDLE1BQU0sUUFBUSxJQUFJLE1BQU0sVUFBVTtBQUVsQyxPQUFPLCtDQUErQztBQUN0RCxPQUFPLFlBQVksdUJBQXVCO0lBQUUsTUFBTTtBQUFPLEVBQUU7QUFFM0QsU0FBUyxNQUFNLFFBQVEsd0JBQXdCO0FBRS9DLE1BQU0sTUFDTCxPQUFPLE1BQW9DO0lBQzFDLE1BQU0sRUFBRSxJQUFHLEVBQUUsR0FBRyxXQUFXLElBQUksT0FBTztJQUV0QyxNQUFNLE1BQU0sSUFBSSxJQUFJLElBQUksR0FBRztJQUMzQixNQUFNLFdBQVcsUUFBUSxPQUFPLEdBQUc7SUFDbkMsTUFBTSxPQUFPLElBQUksTUFBTSxDQUFDLFVBQVUsQ0FBQztJQUNuQyxNQUFNLFlBQVksSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsU0FBUyxXQUFXLEtBQUs7SUFDMUUsTUFBTSxRQUFRLENBQUMsT0FBTyxhQUFhLElBQUksWUFBWSxRQUFRO0lBRTNELElBQUksQ0FBQyxPQUFPO1FBQ1gsTUFBTSxPQUFPLE1BQU0sU0FBUyxLQUFLO1lBQ2hDLFFBQVEsT0FBTyxVQUFVO1lBQ3pCLFdBQVcsSUFBSTtZQUNmLE9BQU8sSUFBSTtRQUNaO1FBRUEsd0JBQXdCO1FBQ3hCLElBQUksS0FBSyxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixTQUFTLGNBQWMsT0FBTztJQUNyRSxDQUFDO0lBRUQsTUFBTSxPQUFPLElBQUksUUFBUTtJQUV6QixJQUFJLE1BQU0sS0FBSyxDQUFDLE9BQU8sT0FBTyxNQUFNLE1BQU0sTUFBTSxDQUFDO1NBQzVDLElBQUksTUFBTSxPQUFPLENBQUMsT0FBTyxPQUFPLE1BQU0sTUFBTSxRQUFRLENBQUM7U0FDckQ7UUFDSixJQUFJLEtBQUssVUFBVSxDQUFDLFNBQ25CLE9BQU8sSUFBSSxTQUFTLHNDQUFzQztZQUN6RCxRQUFRO1FBQ1Q7UUFFRCxNQUFNLFFBQU8sTUFBTSxTQUFTLEtBQUs7WUFDaEMsUUFBUSxPQUFPLEdBQUc7WUFDbEIsZ0JBQWdCLElBQUk7WUFDcEIsV0FBVyxJQUFJO1lBQ2YsT0FBTyxJQUFJO1FBQ1o7UUFFQSxJQUFJLE1BQ0gsTUFBSyxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWM7UUFFaEMsK0RBQStEO1FBQy9ELE9BQU87SUFDUixDQUFDO0FBQ0YsR0FDQTtJQUFFLE1BQU0sT0FBTyxJQUFJO0FBQUMifQ==