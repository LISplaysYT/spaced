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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vaG9tZS9ydW5uZXIvSGF2ZW4tRGVwbG95L3Byb3h5L3Byb3h5LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBkZWZhdWx0IGNsYXNzIHtcblx0cHJlZml4OiBzdHJpbmc7XG5cdHdzUHJlZml4OiBzdHJpbmc7XG5cdGRlYnVnOiBib29sZWFuO1xuXG5cdGNvbnN0cnVjdG9yKHByZWZpeDogc3RyaW5nLCB3c1ByZWZpeDogc3RyaW5nLCBkZWJ1Zz86IGJvb2xlYW4pIHtcblx0XHR0aGlzLnByZWZpeCA9IHByZWZpeDtcblx0XHR0aGlzLndzUHJlZml4ID0gd3NQcmVmaXg7XG5cdFx0dGhpcy5kZWJ1ZyA9IGRlYnVnID8/IGZhbHNlO1xuXHR9XG5cdHJvdXRlKHBhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xuXHRcdHJldHVybiBwYXRoID09PSB0aGlzLnByZWZpeDtcblx0fVxuXHRyb3V0ZVdzKHBhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xuXHRcdHJldHVybiBwYXRoLnN0YXJ0c1dpdGgodGhpcy53c1ByZWZpeCk7XG5cdH1cblx0YXN5bmMgaGFuZGxlKHJlcTogUmVxdWVzdCk6IFByb21pc2U8UmVzcG9uc2U+IHtcblx0XHRjb25zdCB1cmw6IHN0cmluZyA9IHJlcS5oZWFkZXJzLmdldChcIngtdXJsXCIpIHx8IFwiXCI7XG5cblx0XHQvLyBkZW5vLWxpbnQtaWdub3JlIGJhbi10eXBlc1xuXHRcdGNvbnN0IGhlYWRlcnM6IE9iamVjdCA9IEpTT04ucGFyc2UocmVxLmhlYWRlcnMuZ2V0KFwieC1oZWFkZXJzXCIpIHx8IFwiXCIpO1xuXG5cdFx0aWYgKHRoaXMuZGVidWcpIGNvbnNvbGUubG9nKGBIYW5kbGluZyAke3VybH1gKTtcblxuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCBvcHRzOiB7XG5cdFx0XHRcdG1ldGhvZDogc3RyaW5nO1xuXHRcdFx0XHQvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuXHRcdFx0XHRoZWFkZXJzOiBhbnk7XG5cdFx0XHRcdGJvZHk/OiBzdHJpbmc7XG5cdFx0XHR9ID0ge1xuXHRcdFx0XHRtZXRob2Q6IHJlcS5tZXRob2QsXG5cdFx0XHRcdGhlYWRlcnM6IGhlYWRlcnMsXG5cdFx0XHR9O1xuXG5cdFx0XHRpZiAob3B0cy5tZXRob2QgPT09IFwiUE9TVFwiKSB7XG5cdFx0XHRcdG9wdHMuYm9keSA9IGF3YWl0IHJlcS50ZXh0KCk7XG5cblx0XHRcdFx0Y29uc29sZS5sb2coYCR7cmVxLm1ldGhvZH0gJHt1cmx9YCk7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IHByb3h5UmVzcDogUmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh1cmwsIG9wdHMpO1xuXG5cdFx0XHRjb25zdCByZXNwSGVhZGVycyA9IE9iamVjdC5mcm9tRW50cmllcyhwcm94eVJlc3AuaGVhZGVycy5lbnRyaWVzKCkpO1xuXG5cdFx0XHQvLyBEb24ndCBjYWNoZVxuXHRcdFx0ZGVsZXRlIHJlc3BIZWFkZXJzW1wiYWdlXCJdO1xuXHRcdFx0ZGVsZXRlIHJlc3BIZWFkZXJzW1wiY2FjaGUtY29udHJvbFwiXTtcblx0XHRcdGRlbGV0ZSByZXNwSGVhZGVyc1tcImV4cGlyZXNcIl07XG5cblx0XHRcdHJldHVybiBuZXcgUmVzcG9uc2UoYXdhaXQgcHJveHlSZXNwLmJvZHksIHtcblx0XHRcdFx0c3RhdHVzOiBwcm94eVJlc3Auc3RhdHVzLFxuXHRcdFx0XHRoZWFkZXJzOiB7XG5cdFx0XHRcdFx0XCJjYWNoZS1jb250cm9sXCI6IFwibm8tY2FjaGVcIixcblx0XHRcdFx0XHQuLi5yZXNwSGVhZGVycyxcblx0XHRcdFx0fSxcblx0XHRcdH0pO1xuXHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0cmV0dXJuIG5ldyBSZXNwb25zZShlcnIubWVzc2FnZSwgeyBzdGF0dXM6IDUwMCB9KTtcblx0XHR9XG5cdH1cblx0aGFuZGxlV3MocmVxOiBSZXF1ZXN0KTogUmVzcG9uc2Uge1xuXHRcdGxldCByZXNwOiBSZXNwb25zZSwgc29jazogV2ViU29ja2V0O1xuXG5cdFx0Y29uc3QgcHJvdG86IHN0cmluZyA9IHJlcS5oZWFkZXJzLmdldChcInNlYy13ZWJzb2NrZXQtcHJvdG9jb2xcIikgfHwgXCJcIjtcblxuXHRcdHRyeSB7XG5cdFx0XHQoeyByZXNwb25zZTogcmVzcCwgc29ja2V0OiBzb2NrIH0gPSBEZW5vLnVwZ3JhZGVXZWJTb2NrZXQocmVxLCB7XG5cdFx0XHRcdHByb3RvY29sOiBwcm90byxcblx0XHRcdH0pKTtcblx0XHR9IGNhdGNoIHtcblx0XHRcdHJldHVybiBuZXcgUmVzcG9uc2UoXCJOb3QgYSBXUyBjb25uZWN0aW9uXCIpO1xuXHRcdH1cblxuXHRcdGNvbnN0IHVybDogc3RyaW5nID0gbmV3IFVSTChyZXEudXJsKS5zZWFyY2hQYXJhbXMuZ2V0KFwidXJsXCIpIHx8IFwiXCI7XG5cblx0XHRpZiAodGhpcy5kZWJ1ZykgY29uc29sZS5sb2coYEhhbmRsaW5nIFdTICR7dXJsfWApO1xuXG5cdFx0Y29uc3QgcHJveHlTb2NrID0gbmV3IFdlYlNvY2tldCh1cmwsIHByb3RvKTtcblxuXHRcdHNvY2sub25tZXNzYWdlID0gZSA9PiBwcm94eVNvY2suc2VuZChlLmRhdGEpO1xuXHRcdHByb3h5U29jay5vbm1lc3NhZ2UgPSBlID0+IHNvY2suc2VuZChlLmRhdGEpO1xuXG5cdFx0c29jay5vbmNsb3NlID0gKCkgPT4gcHJveHlTb2NrLmNsb3NlKCk7XG5cdFx0cHJveHlTb2NrLm9uY2xvc2UgPSAoKSA9PiBzb2NrLmNsb3NlKCk7XG5cblx0XHRyZXR1cm4gcmVzcDtcblx0fVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLGVBQWU7SUFDZCxPQUFlO0lBQ2YsU0FBaUI7SUFDakIsTUFBZTtJQUVmLFlBQVksTUFBYyxFQUFFLFFBQWdCLEVBQUUsS0FBZSxDQUFFO1FBQzlELElBQUksQ0FBQyxNQUFNLEdBQUc7UUFDZCxJQUFJLENBQUMsUUFBUSxHQUFHO1FBQ2hCLElBQUksQ0FBQyxLQUFLLEdBQUcsU0FBUyxLQUFL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