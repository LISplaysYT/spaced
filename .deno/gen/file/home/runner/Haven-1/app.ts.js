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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vaG9tZS9ydW5uZXIvSGF2ZW4tMS9hcHAudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgc2VydmUgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQDAuMTczLjAvaHR0cC9zZXJ2ZXIudHNcIjtcbmltcG9ydCB7IHNlcnZlRGlyIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE3My4wL2h0dHAvZmlsZV9zZXJ2ZXIudHNcIjtcblxuaW1wb3J0IHsgZ2V0Q29va2llcyB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAMC4xNzMuMC9odHRwL2Nvb2tpZS50c1wiO1xuXG5pbXBvcnQgUHJveHkgZnJvbSBcImh0dHBzOi8vY2RuLmpzZGVsaXZyLm5ldC9naC9Qcm94eUhhdmVuL2Flcm8tYmFja2VuZHMvcHJveHkudHNcIjtcbmNvbnN0IHByb3h5ID0gbmV3IFByb3h5KFwiL2ZldGNoXCIsIFwiL2ZldGNoV3NcIik7XG5cbmltcG9ydCBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE3My4wL2RvdGVudi9sb2FkLnRzXCI7XG5pbXBvcnQgY29uZmlnIGZyb20gXCIuL2NvbmZpZy5qc29uXCIgYXNzZXJ0IHsgdHlwZTogXCJqc29uXCIgfTtcblxuaW1wb3J0IHsgcHJlZml4IH0gZnJvbSBcImh0dHBzOi8vY2RuLmpzZGVsaXZyLm5ldC9naC9Qcm94eUhhdmVuL2Flcm8vY29uZmlnLmpzXCI7XG5cbmF3YWl0IERlbm8ucnVuKHtcblx0Y21kOiBbXCIuL2RlcHMuc2hcIl0sXG5cdHN0ZGVycjogXCJwaXBlZFwiLFxufSk7XG5cbmF3YWl0IHNlcnZlKFxuXHRhc3luYyAocmVxOiBSZXF1ZXN0KTogUHJvbWlzZTxSZXNwb25zZT4gPT4ge1xuXHRcdGNvbnN0IHsga2V5IH0gPSBnZXRDb29raWVzKHJlcS5oZWFkZXJzKTtcblxuXHRcdGNvbnN0IHVybCA9IG5ldyBVUkwocmVxLnVybCk7XG5cdFx0Y29uc3QgdW5sb2NrZWQgPSBrZXkgPT09IGNvbmZpZy5rZXk7XG5cdFx0Y29uc3QgY29kZSA9IHVybC5zZWFyY2guc3RhcnRzV2l0aChcIj91bmxvY2tcIik7XG5cdFx0Y29uc3QgdXNpbmdDck9TID0gcmVxLmhlYWRlcnMuZ2V0KFwidXNlci1hZ2VudFwiKT8uaW5jbHVkZXMoXCJDck9TXCIpID8/IGZhbHNlO1xuXHRcdGNvbnN0IGFsbG93ID0gIWNvbmZpZy5yZXF1aXJlVW5sb2NrIHx8IHVubG9ja2VkIHx8IGNvZGUgfHwgdXNpbmdDck9TO1xuXG5cdFx0aWYgKCFhbGxvdykge1xuXHRcdFx0Y29uc3QgcmVzcCA9IGF3YWl0IHNlcnZlRGlyKHJlcSwge1xuXHRcdFx0XHRmc1Jvb3Q6IGNvbmZpZy5ibG9ja2VkRGlyLFxuXHRcdFx0XHRzaG93SW5kZXg6IHRydWUsXG5cdFx0XHRcdHF1aWV0OiB0cnVlLFxuXHRcdFx0fSk7XG5cblx0XHRcdC8vIE9ubHkgYmxvY2sgaHRtbCBmaWxlc1xuXHRcdFx0aWYgKHJlc3AuaGVhZGVycy5nZXQoXCJjb250ZW50LXR5cGVcIik/LmluY2x1ZGVzKFwidGV4dC9odG1sXCIpKSByZXR1cm4gcmVzcDtcblx0XHR9XG5cblx0XHRjb25zdCBwYXRoID0gdXJsLnBhdGhuYW1lO1xuXG5cdFx0aWYgKHByb3h5LnJvdXRlKHBhdGgpKSByZXR1cm4gYXdhaXQgcHJveHkuaGFuZGxlKHJlcSk7XG5cdFx0ZWxzZSBpZiAocHJveHkucm91dGVXcyhwYXRoKSkgcmV0dXJuIGF3YWl0IHByb3h5LmhhbmRsZVdzKHJlcSk7XG5cdFx0ZWxzZSB7XG5cdFx0XHRpZiAocGF0aC5zdGFydHNXaXRoKHByZWZpeCkpXG5cdFx0XHRcdHJldHVybiBuZXcgUmVzcG9uc2UoXCJGYWlsZWQgdG8gc3RhcnQgdGhlIHNlcnZpY2Ugd29ya2VyXCIsIHtcblx0XHRcdFx0XHRzdGF0dXM6IDQwNCxcblx0XHRcdFx0fSk7XG5cblx0XHRcdGNvbnN0IHJlc3AgPSBhd2FpdCBzZXJ2ZURpcihyZXEsIHtcblx0XHRcdFx0ZnNSb290OiBjb25maWcuZGlyLFxuXHRcdFx0XHRzaG93RGlyTGlzdGluZzogdHJ1ZSxcblx0XHRcdFx0c2hvd0luZGV4OiB0cnVlLFxuXHRcdFx0XHRxdWlldDogdHJ1ZSxcblx0XHRcdH0pO1xuXG5cdFx0XHRpZiAoY29kZSlcblx0XHRcdFx0cmVzcC5oZWFkZXJzLnNldChcInNldC1jb29raWVcIiwgXCJrZXk9dW5sb2NrOyBTYW1lU2l0ZT1Ob25lOyBTZWN1cmVcIik7XG5cblx0XHRcdC8vIFRPRE86IFNldCBzdGF0dXMgdG8gNDA0IHRvIGF2b2lkIHN0b3JpbmcgaGlzdG9yeSBvbiBDaHJvbWl1bVxuXHRcdFx0cmV0dXJuIHJlc3A7XG5cdFx0fVxuXHR9LFxuXHR7IHBvcnQ6IGNvbmZpZy5wb3J0IH1cbik7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsU0FBUyxLQUFLLFFBQVEsK0NBQStDO0FBQ3JFLFNBQVMsUUFBUSxRQUFRLG9EQUFvRDtBQUU3RSxTQUFTLFVBQVUsUUFBUSwrQ0FBK0M7QUFFMUUsT0FBTyxXQUFXLGdFQUFnRTtBQUNsRixNQUFNLFFBQVEsSUFBSSxNQUFNLFVBQVU7QUFFbEMsT0FBTywrQ0FBK0M7QUFDdEQsT0FBTyxZQUFZLHVCQUF1QjtJQUFFLE1BQU07QUFBTyxFQUFFO0FBRTNELFNBQVMsTUFBTSxRQUFRLHdEQUF3RDtBQUUvRSxNQUFNLEtBQUssR0FBRyxDQUFDO0lBQ2QsS0FBSztRQUFDO0tBQVk7SUFDbEIsUUFBUTtBQUNUO0FBRUEsTUFBTSxNQUNMLE9BQU8sTUFBb0M7SUFDMUMsTUFBTSxFQUFFLElBQUcsRUFBRSxHQUFHLFdBQVcsSUFBSSxPQUFPO0lBRXRDLE1BQU0sTUFBTSxJQUFJLElBQUksSUFBSSxHQUFHO0lBQzNCLE1BQU0sV0FBVyxRQUFRLE9BQU8sR0FBRztJQUNuQyxNQUFNLE9BQU8sSUFBSSxNQUFNLENBQUMsVUFBVSxDQUFDO0lBQ25DLE1BQU0sWUFBWSxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBZSxTQUFTLFdBQVcsS0FBSztJQUMxRSxNQUFNLFFBQVEsQ0FBQyxPQUFPLGFBQWEsSUFBSSxZQUFZLFFBQVE7SUFFM0QsSUFBSSxDQUFDLE9BQU87UUFDWCxNQUFNLE9BQU8sTUFBTSxTQUFTLEtBQUs7WUFDaEMsUUFBUSxPQUFPLFVBQVU7WUFDekIsV0FBVyxJQUFJO1lBQ2YsT0FBTyxJQUFJO1FBQ1o7UUFFQSx3QkFBd0I7UUFDeEIsSUFBSSxLQUFLLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLFNBQVMsY0FBYyxPQUFPO0lBQ3JFLENBQUM7SUFFRCxNQUFNLE9BQU8sSUFBSSxRQUFRO0lBRXpCLElBQUksTUFBTSxLQUFLLENBQUMsT0FBTyxPQUFPLE1BQU0sTUFBTSxNQUFNLENBQUM7U0FDNUMsSUFBSSxNQUFNLE9BQU8sQ0FBQyxPQUFPLE9BQU8sTUFBTSxNQUFNLFFBQVEsQ0FBQztTQUNyRDtRQUNKLElBQUksS0FBSyxVQUFVLENBQUMsU0FDbkIsT0FBTyxJQUFJLFNBQVMsc0NBQXNDO1lBQ3pELFFBQVE7UUFDVDtRQUVELE1BQU0sUUFBTyxNQUFNLFNBQVMsS0FBSztZQUNoQyxRQUFRLE9BQU8sR0FBRztZQUNsQixnQkFBZ0IsSUFBSTtZQUNwQixXQUFXLElBQUk7WUFDZixPQUFPLElBQUk7UUFDWjtRQUVBLElBQUksTUFDSCxNQUFLLE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYztRQUVoQywrREFBK0Q7UUFDL0QsT0FBTztJQUNSLENBQUM7QUFDRixHQUNBO0lBQUUsTUFBTSxPQUFPLElBQUk7QUFBQyJ9