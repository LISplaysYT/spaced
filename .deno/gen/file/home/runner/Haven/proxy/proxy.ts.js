export default class {
    prefix;
    wsPrefix;
    debug;
    constructor(prefix, wsPrefix, debug){
        this.prefix = prefix;
        this.wsPrefix = wsPrefix;
        this.debug = debug ?? false;
    }
    route(path) {
        return path === this.prefix;
    }
    routeWs(path) {
        return path.startsWith(this.wsPrefix);
    }
    async handle(req) {
        const url = req.headers.get("x-url") || "";
        // deno-lint-ignore ban-types
        const headers = JSON.parse(req.headers.get("x-headers") || "");
        if (this.debug) console.log(`Handling ${url}`);
        try {
            const opts = {
                method: req.method,
                headers: headers
            };
            if (opts.method === "POST") {
                opts.body = await req.text();
                console.log(`${req.method} ${url}`);
            }
            const proxyResp = await fetch(url, opts);
            const respHeaders = Object.fromEntries(proxyResp.headers.entries());
            // Don't cache
            delete respHeaders["age"];
            delete respHeaders["cache-control"];
            delete respHeaders["expires"];
            return new Response(await proxyResp.body, {
                status: proxyResp.status,
                headers: {
                    "cache-control": "no-cache",
                    ...respHeaders
                }
            });
        } catch (err) {
            return new Response(err.message, {
                status: 500
            });
        }
    }
    handleWs(req) {
        let resp, sock;
        const proto = req.headers.get("sec-websocket-protocol") || "";
        try {
            ({ response: resp , socket: sock  } = Deno.upgradeWebSocket(req, {
                protocol: proto
            }));
        } catch  {
            return new Response("Not a WS connection");
        }
        const url = new URL(req.url).searchParams.get("url") || "";
        if (this.debug) console.log(`Handling WS ${url}`);
        const proxySock = new WebSocket(url, proto);
        sock.onmessage = (e)=>proxySock.send(e.data);
        proxySock.onmessage = (e)=>sock.send(e.data);
        sock.onclose = ()=>proxySock.close();
        proxySock.onclose = ()=>sock.close();
        return resp;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vaG9tZS9ydW5uZXIvSGF2ZW4vcHJveHkvcHJveHkudHMiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGRlZmF1bHQgY2xhc3Mge1xuXHRwcmVmaXg6IHN0cmluZztcblx0d3NQcmVmaXg6IHN0cmluZztcblx0ZGVidWc6IGJvb2xlYW47XG5cblx0Y29uc3RydWN0b3IocHJlZml4OiBzdHJpbmcsIHdzUHJlZml4OiBzdHJpbmcsIGRlYnVnPzogYm9vbGVhbikge1xuXHRcdHRoaXMucHJlZml4ID0gcHJlZml4O1xuXHRcdHRoaXMud3NQcmVmaXggPSB3c1ByZWZpeDtcblx0XHR0aGlzLmRlYnVnID0gZGVidWcgPz8gZmFsc2U7XG5cdH1cblx0cm91dGUocGF0aDogc3RyaW5nKTogYm9vbGVhbiB7XG5cdFx0cmV0dXJuIHBhdGggPT09IHRoaXMucHJlZml4O1xuXHR9XG5cdHJvdXRlV3MocGF0aDogc3RyaW5nKTogYm9vbGVhbiB7XG5cdFx0cmV0dXJuIHBhdGguc3RhcnRzV2l0aCh0aGlzLndzUHJlZml4KTtcblx0fVxuXHRhc3luYyBoYW5kbGUocmVxOiBSZXF1ZXN0KTogUHJvbWlzZTxSZXNwb25zZT4ge1xuXHRcdGNvbnN0IHVybDogc3RyaW5nID0gcmVxLmhlYWRlcnMuZ2V0KFwieC11cmxcIikgfHwgXCJcIjtcblxuXHRcdC8vIGRlbm8tbGludC1pZ25vcmUgYmFuLXR5cGVzXG5cdFx0Y29uc3QgaGVhZGVyczogT2JqZWN0ID0gSlNPTi5wYXJzZShyZXEuaGVhZGVycy5nZXQoXCJ4LWhlYWRlcnNcIikgfHwgXCJcIik7XG5cblx0XHRpZiAodGhpcy5kZWJ1ZykgY29uc29sZS5sb2coYEhhbmRsaW5nICR7dXJsfWApO1xuXG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IG9wdHM6IHtcblx0XHRcdFx0bWV0aG9kOiBzdHJpbmc7XG5cdFx0XHRcdC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG5cdFx0XHRcdGhlYWRlcnM6IGFueTtcblx0XHRcdFx0Ym9keT86IHN0cmluZztcblx0XHRcdH0gPSB7XG5cdFx0XHRcdG1ldGhvZDogcmVxLm1ldGhvZCxcblx0XHRcdFx0aGVhZGVyczogaGVhZGVycyxcblx0XHRcdH07XG5cblx0XHRcdGlmIChvcHRzLm1ldGhvZCA9PT0gXCJQT1NUXCIpIHtcblx0XHRcdFx0b3B0cy5ib2R5ID0gYXdhaXQgcmVxLnRleHQoKTtcblxuXHRcdFx0XHRjb25zb2xlLmxvZyhgJHtyZXEubWV0aG9kfSAke3VybH1gKTtcblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgcHJveHlSZXNwOiBSZXNwb25zZSA9IGF3YWl0IGZldGNoKHVybCwgb3B0cyk7XG5cblx0XHRcdGNvbnN0IHJlc3BIZWFkZXJzID0gT2JqZWN0LmZyb21FbnRyaWVzKHByb3h5UmVzcC5oZWFkZXJzLmVudHJpZXMoKSk7XG5cblx0XHRcdC8vIERvbid0IGNhY2hlXG5cdFx0XHRkZWxldGUgcmVzcEhlYWRlcnNbXCJhZ2VcIl07XG5cdFx0XHRkZWxldGUgcmVzcEhlYWRlcnNbXCJjYWNoZS1jb250cm9sXCJdO1xuXHRcdFx0ZGVsZXRlIHJlc3BIZWFkZXJzW1wiZXhwaXJlc1wiXTtcblxuXHRcdFx0cmV0dXJuIG5ldyBSZXNwb25zZShhd2FpdCBwcm94eVJlc3AuYm9keSwge1xuXHRcdFx0XHRzdGF0dXM6IHByb3h5UmVzcC5zdGF0dXMsXG5cdFx0XHRcdGhlYWRlcnM6IHtcblx0XHRcdFx0XHRcImNhY2hlLWNvbnRyb2xcIjogXCJuby1jYWNoZVwiLFxuXHRcdFx0XHRcdC4uLnJlc3BIZWFkZXJzLFxuXHRcdFx0XHR9LFxuXHRcdFx0fSk7XG5cdFx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0XHRyZXR1cm4gbmV3IFJlc3BvbnNlKGVyci5tZXNzYWdlLCB7IHN0YXR1czogNTAwIH0pO1xuXHRcdH1cblx0fVxuXHRoYW5kbGVXcyhyZXE6IFJlcXVlc3QpOiBSZXNwb25zZSB7XG5cdFx0bGV0IHJlc3A6IFJlc3BvbnNlLCBzb2NrOiBXZWJTb2NrZXQ7XG5cblx0XHRjb25zdCBwcm90bzogc3RyaW5nID0gcmVxLmhlYWRlcnMuZ2V0KFwic2VjLXdlYnNvY2tldC1wcm90b2NvbFwiKSB8fCBcIlwiO1xuXG5cdFx0dHJ5IHtcblx0XHRcdCh7IHJlc3BvbnNlOiByZXNwLCBzb2NrZXQ6IHNvY2sgfSA9IERlbm8udXBncmFkZVdlYlNvY2tldChyZXEsIHtcblx0XHRcdFx0cHJvdG9jb2w6IHByb3RvLFxuXHRcdFx0fSkpO1xuXHRcdH0gY2F0Y2gge1xuXHRcdFx0cmV0dXJuIG5ldyBSZXNwb25zZShcIk5vdCBhIFdTIGNvbm5lY3Rpb25cIik7XG5cdFx0fVxuXG5cdFx0Y29uc3QgdXJsOiBzdHJpbmcgPSBuZXcgVVJMKHJlcS51cmwpLnNlYXJjaFBhcmFtcy5nZXQoXCJ1cmxcIikgfHwgXCJcIjtcblxuXHRcdGlmICh0aGlzLmRlYnVnKSBjb25zb2xlLmxvZyhgSGFuZGxpbmcgV1MgJHt1cmx9YCk7XG5cblx0XHRjb25zdCBwcm94eVNvY2sgPSBuZXcgV2ViU29ja2V0KHVybCwgcHJvdG8pO1xuXG5cdFx0c29jay5vbm1lc3NhZ2UgPSBlID0+IHByb3h5U29jay5zZW5kKGUuZGF0YSk7XG5cdFx0cHJveHlTb2NrLm9ubWVzc2FnZSA9IGUgPT4gc29jay5zZW5kKGUuZGF0YSk7XG5cblx0XHRzb2NrLm9uY2xvc2UgPSAoKSA9PiBwcm94eVNvY2suY2xvc2UoKTtcblx0XHRwcm94eVNvY2sub25jbG9zZSA9ICgpID0+IHNvY2suY2xvc2UoKTtcblxuXHRcdHJldHVybiByZXNwO1xuXHR9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsZUFBZTtJQUNkLE9BQWU7SUFDZixTQUFpQjtJQUNqQixNQUFlO0lBRWYsWUFBWSxNQUFjLEVBQUUsUUFBZ0IsRUFBRSxLQUFlLENBQUU7UUFDOUQsSUFBSSxDQUFDLE1BQU0sR0FBRztRQUNkLElBQUksQ0FBQyxRQUFRLEdBQUc7UUFDaEIsSUFBSSxDQUFDLEtBQUssR0FBRyxTQUFTLEtBQUs7SUFDNUI7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