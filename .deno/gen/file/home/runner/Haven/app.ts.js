import { serve } from "https://deno.land/std@0.173.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.173.0/http/file_server.ts";
import { getCookies } from "https://deno.land/std@0.173.0/http/cookie.ts";
import Proxy from "https://cdn.jsdelivr.net/gh/ProxyHaven/aero-backends/proxy.ts";
const proxy = new Proxy("/fetch", "/fetchWs");
import "https://deno.land/std@0.173.0/dotenv/load.ts";
import config from "./config.json" assert {
    type: "json"
};
import { prefix } from "https://cdn.jsdelivr.net/gh/ProxyHaven/aero/config.js";
await Deno.run({
    cmd: [
        "./deps.sh"
    ],
    stderr: "piped"
});
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vaG9tZS9ydW5uZXIvSGF2ZW4vYXBwLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHNlcnZlIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE3My4wL2h0dHAvc2VydmVyLnRzXCI7XG5pbXBvcnQgeyBzZXJ2ZURpciB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAMC4xNzMuMC9odHRwL2ZpbGVfc2VydmVyLnRzXCI7XG5cbmltcG9ydCB7IGdldENvb2tpZXMgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQDAuMTczLjAvaHR0cC9jb29raWUudHNcIjtcblxuaW1wb3J0IFByb3h5IGZyb20gXCJodHRwczovL2Nkbi5qc2RlbGl2ci5uZXQvZ2gvUHJveHlIYXZlbi9hZXJvLWJhY2tlbmRzL3Byb3h5LnRzXCI7XG5jb25zdCBwcm94eSA9IG5ldyBQcm94eShcIi9mZXRjaFwiLCBcIi9mZXRjaFdzXCIpO1xuXG5pbXBvcnQgXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAMC4xNzMuMC9kb3RlbnYvbG9hZC50c1wiO1xuaW1wb3J0IGNvbmZpZyBmcm9tIFwiLi9jb25maWcuanNvblwiIGFzc2VydCB7IHR5cGU6IFwianNvblwiIH07XG5cbmltcG9ydCB7IHByZWZpeCB9IGZyb20gXCJodHRwczovL2Nkbi5qc2RlbGl2ci5uZXQvZ2gvUHJveHlIYXZlbi9hZXJvL2NvbmZpZy5qc1wiO1xuXG5hd2FpdCBEZW5vLnJ1bih7XG5cdGNtZDogW1wiLi9kZXBzLnNoXCJdLFxuXHRzdGRlcnI6IFwicGlwZWRcIixcbn0pO1xuXG5hd2FpdCBzZXJ2ZShcblx0YXN5bmMgKHJlcTogUmVxdWVzdCk6IFByb21pc2U8UmVzcG9uc2U+ID0+IHtcblx0XHRjb25zdCB7IGtleSB9ID0gZ2V0Q29va2llcyhyZXEuaGVhZGVycyk7XG5cblx0XHRjb25zdCB1cmwgPSBuZXcgVVJMKHJlcS51cmwpO1xuXHRcdGNvbnN0IHVubG9ja2VkID0ga2V5ID09PSBjb25maWcua2V5O1xuXHRcdGNvbnN0IGNvZGUgPSB1cmwuc2VhcmNoLnN0YXJ0c1dpdGgoXCI/dW5sb2NrXCIpO1xuXHRcdGNvbnN0IHVzaW5nQ3JPUyA9IHJlcS5oZWFkZXJzLmdldChcInVzZXItYWdlbnRcIik/LmluY2x1ZGVzKFwiQ3JPU1wiKSA/PyBmYWxzZTtcblx0XHRjb25zdCBhbGxvdyA9ICFjb25maWcucmVxdWlyZVVubG9jayB8fCB1bmxvY2tlZCB8fCBjb2RlIHx8IHVzaW5nQ3JPUztcblxuXHRcdGlmICghYWxsb3cpIHtcblx0XHRcdGNvbnN0IHJlc3AgPSBhd2FpdCBzZXJ2ZURpcihyZXEsIHtcblx0XHRcdFx0ZnNSb290OiBjb25maWcuYmxvY2tlZERpcixcblx0XHRcdFx0c2hvd0luZGV4OiB0cnVlLFxuXHRcdFx0XHRxdWlldDogdHJ1ZSxcblx0XHRcdH0pO1xuXG5cdFx0XHQvLyBPbmx5IGJsb2NrIGh0bWwgZmlsZXNcblx0XHRcdGlmIChyZXNwLmhlYWRlcnMuZ2V0KFwiY29udGVudC10eXBlXCIpPy5pbmNsdWRlcyhcInRleHQvaHRtbFwiKSkgcmV0dXJuIHJlc3A7XG5cdFx0fVxuXG5cdFx0Y29uc3QgcGF0aCA9IHVybC5wYXRobmFtZTtcblxuXHRcdGlmIChwcm94eS5yb3V0ZShwYXRoKSkgcmV0dXJuIGF3YWl0IHByb3h5LmhhbmRsZShyZXEpO1xuXHRcdGVsc2UgaWYgKHByb3h5LnJvdXRlV3MocGF0aCkpIHJldHVybiBhd2FpdCBwcm94eS5oYW5kbGVXcyhyZXEpO1xuXHRcdGVsc2Uge1xuXHRcdFx0aWYgKHBhdGguc3RhcnRzV2l0aChwcmVmaXgpKVxuXHRcdFx0XHRyZXR1cm4gbmV3IFJlc3BvbnNlKFwiRmFpbGVkIHRvIHN0YXJ0IHRoZSBzZXJ2aWNlIHdvcmtlclwiLCB7XG5cdFx0XHRcdFx0c3RhdHVzOiA0MDQsXG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRjb25zdCByZXNwID0gYXdhaXQgc2VydmVEaXIocmVxLCB7XG5cdFx0XHRcdGZzUm9vdDogY29uZmlnLmRpcixcblx0XHRcdFx0c2hvd0Rpckxpc3Rpbmc6IHRydWUsXG5cdFx0XHRcdHNob3dJbmRleDogdHJ1ZSxcblx0XHRcdFx0cXVpZXQ6IHRydWUsXG5cdFx0XHR9KTtcblxuXHRcdFx0aWYgKGNvZGUpXG5cdFx0XHRcdHJlc3AuaGVhZGVycy5zZXQoXCJzZXQtY29va2llXCIsIFwia2V5PXVubG9jazsgU2FtZVNpdGU9Tm9uZTsgU2VjdXJlXCIpO1xuXG5cdFx0XHQvLyBUT0RPOiBTZXQgc3RhdHVzIHRvIDQwNCB0byBhdm9pZCBzdG9yaW5nIGhpc3Rvcnkgb24gQ2hyb21pdW1cblx0XHRcdHJldHVybiByZXNwO1xuXHRcdH1cblx0fSxcblx0eyBwb3J0OiBjb25maWcucG9ydCB9XG4pO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFNBQVMsS0FBSyxRQUFRLCtDQUErQztBQUNyRSxTQUFTLFFBQVEsUUFBUSxvREFBb0Q7QUFFN0UsU0FBUyxVQUFVLFFBQVEsK0NBQStDO0FBRTFFLE9BQU8sV0FBVyxnRUFBZ0U7QUFDbEYsTUFBTSxRQUFRLElBQUksTUFBTSxVQUFVO0FBRWxDLE9BQU8sK0NBQStDO0FBQ3RELE9BQU8sWUFBWSx1QkFBdUI7SUFBRSxNQUFNO0FBQU8sRUFBRTtBQUUzRCxTQUFTLE1BQU0sUUFBUSx3REFBd0Q7QUFFL0UsTUFBTSxLQUFLLEdBQUcsQ0FBQztJQUNkLEtBQUs7UUFBQztLQUFZO0lBQ2xCLFFBQVE7QUFDVDtBQUVBLE1BQU0sTUFDTCxPQUFPLE1BQW9DO0lBQzFDLE1BQU0sRUFBRSxJQUFHLEVBQUUsR0FBRyxXQUFXLElBQUksT0FBTztJQUV0QyxNQUFNLE1BQU0sSUFBSSxJQUFJLElBQUksR0FBRztJQUMzQixNQUFNLFdBQVcsUUFBUSxPQUFPLEdBQUc7SUFDbkMsTUFBTSxPQUFPLElBQUksTUFBTSxDQUFDLFVBQVUsQ0FBQztJQUNuQyxNQUFNLFlBQVksSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsU0FBUyxXQUFXLEtBQUs7SUFDMUUsTUFBTSxRQUFRLENBQUMsT0FBTyxhQUFhLElBQUksWUFBWSxRQUFRO0lBRTNELElBQUksQ0FBQyxPQUFPO1FBQ1gsTUFBTSxPQUFPLE1BQU0sU0FBUyxLQUFLO1lBQ2hDLFFBQVEsT0FBTyxVQUFVO1lBQ3pCLFdBQVcsSUFBSTtZQUNmLE9BQU8sSUFBSTtRQUNaO1FBRUEsd0JBQXdCO1FBQ3hCLElBQUksS0FBSyxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixTQUFTLGNBQWMsT0FBTztJQUNyRSxDQUFDO0lBRUQsTUFBTSxPQUFPLElBQUksUUFBUTtJQUV6QixJQUFJLE1BQU0sS0FBSyxDQUFDLE9BQU8sT0FBTyxNQUFNLE1BQU0sTUFBTSxDQUFDO1NBQzVDLElBQUksTUFBTSxPQUFPLENBQUMsT0FBTyxPQUFPLE1BQU0sTUFBTSxRQUFRLENBQUM7U0FDckQ7UUFDSixJQUFJLEtBQUssVUFBVSxDQUFDLFNBQ25CLE9BQU8sSUFBSSxTQUFTLHNDQUFzQztZQUN6RCxRQUFRO1FBQ1Q7UUFFRCxNQUFNLFFBQU8sTUFBTSxTQUFTLEtBQUs7WUFDaEMsUUFBUSxPQUFPLEdBQUc7WUFDbEIsZ0JBQWdCLElBQUk7WUFDcEIsV0FBVyxJQUFJO1lBQ2YsT0FBTyxJQUFJO1FBQ1o7UUFFQSxJQUFJLE1BQ0gsTUFBSyxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWM7UUFFaEMsK0RBQStEO1FBQy9ELE9BQU87SUFDUixDQUFDO0FBQ0YsR0FDQTtJQUFFLE1BQU0sT0FBTyxJQUFJO0FBQUMifQ==