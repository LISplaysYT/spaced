#!/usr/bin/env -S deno run --allow-net --allow-read
// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This program serves files in the current directory over HTTP.
// TODO(bartlomieju): Add tests like these:
// https://github.com/indexzero/http-server/blob/master/test/http-server-test.js
import { extname, posix } from "../path/mod.ts";
import { contentType } from "../media_types/content_type.ts";
import { serve, serveTls } from "./server.ts";
import { Status } from "./http_status.ts";
import { parse } from "../flags/mod.ts";
import { assert } from "../_util/asserts.ts";
import { red } from "../fmt/colors.ts";
import { compareEtag, createCommonResponse } from "./util.ts";
import { toHashString } from "../crypto/to_hash_string.ts";
import { createHash } from "../crypto/_util.ts";
import { VERSION } from "../version.ts";
const encoder = new TextEncoder();
function modeToString(isDir, maybeMode) {
    const modeMap = [
        "---",
        "--x",
        "-w-",
        "-wx",
        "r--",
        "r-x",
        "rw-",
        "rwx"
    ];
    if (maybeMode === null) {
        return "(unknown mode)";
    }
    const mode = maybeMode.toString(8);
    if (mode.length < 3) {
        return "(unknown mode)";
    }
    let output = "";
    mode.split("").reverse().slice(0, 3).forEach((v)=>{
        output = `${modeMap[+v]} ${output}`;
    });
    output = `${isDir ? "d" : "-"} ${output}`;
    return output;
}
function fileLenToString(len) {
    const multiplier = 1024;
    let base = 1;
    const suffix = [
        "B",
        "K",
        "M",
        "G",
        "T"
    ];
    let suffixIndex = 0;
    while(base * multiplier < len){
        if (suffixIndex >= suffix.length - 1) {
            break;
        }
        base *= multiplier;
        suffixIndex++;
    }
    return `${(len / base).toFixed(2)}${suffix[suffixIndex]}`;
}
/**
 * Returns an HTTP Response with the requested file as the body.
 * @param req The server request context used to cleanup the file handle.
 * @param filePath Path of the file to serve.
 */ export async function serveFile(req, filePath, { etagAlgorithm , fileInfo  } = {}) {
    try {
        fileInfo ??= await Deno.stat(filePath);
    } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
            await req.body?.cancel();
            return createCommonResponse(Status.NotFound);
        } else {
            throw error;
        }
    }
    if (fileInfo.isDirectory) {
        await req.body?.cancel();
        return createCommonResponse(Status.NotFound);
    }
    const file = await Deno.open(filePath);
    const headers = setBaseHeaders();
    // Set mime-type using the file extension in filePath
    const contentTypeValue = contentType(extname(filePath));
    if (contentTypeValue) {
        headers.set("content-type", contentTypeValue);
    }
    // Set date header if access timestamp is available
    if (fileInfo.atime instanceof Date) {
        const date = new Date(fileInfo.atime);
        headers.set("date", date.toUTCString());
    }
    // Set last modified header if last modification timestamp is available
    if (fileInfo.mtime instanceof Date) {
        const lastModified = new Date(fileInfo.mtime);
        headers.set("last-modified", lastModified.toUTCString());
        // Create a simple etag that is an md5 of the last modified date and filesize concatenated
        const etag = toHashString(await createHash(etagAlgorithm ?? "FNV32A", `${lastModified.toJSON()}${fileInfo.size}`));
        headers.set("etag", etag);
        // If a `if-none-match` header is present and the value matches the tag or
        // if a `if-modified-since` header is present and the value is bigger than
        // the access timestamp value, then return 304
        const ifNoneMatch = req.headers.get("if-none-match");
        const ifModifiedSince = req.headers.get("if-modified-since");
        if (ifNoneMatch && compareEtag(ifNoneMatch, etag) || ifNoneMatch === null && ifModifiedSince && fileInfo.mtime.getTime() < new Date(ifModifiedSince).getTime() + 1000) {
            file.close();
            return createCommonResponse(Status.NotModified, null, {
                headers
            });
        }
    }
    // Get and parse the "range" header
    const range = req.headers.get("range");
    const rangeRe = /bytes=(\d+)-(\d+)?/;
    const parsed = rangeRe.exec(range);
    // Use the parsed value if available, fallback to the start and end of the entire file
    const start = parsed && parsed[1] ? +parsed[1] : 0;
    const end = parsed && parsed[2] ? +parsed[2] : fileInfo.size - 1;
    // If there is a range, set the status to 206, and set the "Content-range" header.
    if (range && parsed) {
        headers.set("content-range", `bytes ${start}-${end}/${fileInfo.size}`);
    }
    // Return 416 if `start` isn't less than or equal to `end`, or `start` or `end` are greater than the file's size
    const maxRange = fileInfo.size - 1;
    if (range && (!parsed || typeof start !== "number" || start > end || start > maxRange || end > maxRange)) {
        file.close();
        return createCommonResponse(Status.RequestedRangeNotSatisfiable, undefined, {
            headers
        });
    }
    // Set content length
    const contentLength = end - start + 1;
    headers.set("content-length", `${contentLength}`);
    if (range && parsed) {
        await file.seek(start, Deno.SeekMode.Start);
        return createCommonResponse(Status.PartialContent, file.readable, {
            headers
        });
    }
    return createCommonResponse(Status.OK, file.readable, {
        headers
    });
}
// TODO(bartlomieju): simplify this after deno.stat and deno.readDir are fixed
async function serveDirIndex(dirPath, options) {
    const showDotfiles = options.dotfiles;
    const dirUrl = `/${posix.relative(options.target, dirPath)}`;
    const listEntry = [];
    // if ".." makes sense
    if (dirUrl !== "/") {
        const prevPath = posix.join(dirPath, "..");
        const fileInfo = await Deno.stat(prevPath);
        listEntry.push({
            mode: modeToString(true, fileInfo.mode),
            size: "",
            name: "../",
            url: posix.join(dirUrl, "..")
        });
    }
    for await (const entry of Deno.readDir(dirPath)){
        if (!showDotfiles && entry.name[0] === ".") {
            continue;
        }
        const filePath = posix.join(dirPath, entry.name);
        const fileUrl = encodeURIComponent(posix.join(dirUrl, entry.name)).replaceAll("%2F", "/");
        const fileInfo1 = await Deno.stat(filePath);
        listEntry.push({
            mode: modeToString(entry.isDirectory, fileInfo1.mode),
            size: entry.isFile ? fileLenToString(fileInfo1.size ?? 0) : "",
            name: `${entry.name}${entry.isDirectory ? "/" : ""}`,
            url: `${fileUrl}${entry.isDirectory ? "/" : ""}`
        });
    }
    listEntry.sort((a, b)=>a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1);
    const formattedDirUrl = `${dirUrl.replace(/\/$/, "")}/`;
    const page = encoder.encode(dirViewerTemplate(formattedDirUrl, listEntry));
    const headers = setBaseHeaders();
    headers.set("content-type", "text/html");
    return createCommonResponse(Status.OK, page, {
        headers
    });
}
function serveFallback(_req, e) {
    if (e instanceof URIError) {
        return Promise.resolve(createCommonResponse(Status.BadRequest));
    } else if (e instanceof Deno.errors.NotFound) {
        return Promise.resolve(createCommonResponse(Status.NotFound));
    }
    return Promise.resolve(createCommonResponse(Status.InternalServerError));
}
function serverLog(req, status) {
    const d = new Date().toISOString();
    const dateFmt = `[${d.slice(0, 10)} ${d.slice(11, 19)}]`;
    const normalizedUrl = normalizeURL(req.url);
    const s = `${dateFmt} [${req.method}] ${normalizedUrl} ${status}`;
    // using console.debug instead of console.log so chrome inspect users can hide request logs
    console.debug(s);
}
function setBaseHeaders() {
    const headers = new Headers();
    headers.set("server", "deno");
    // Set "accept-ranges" so that the client knows it can make range requests on future requests
    headers.set("accept-ranges", "bytes");
    headers.set("date", new Date().toUTCString());
    return headers;
}
function dirViewerTemplate(dirname, entries) {
    const paths = dirname.split("/");
    return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="X-UA-Compatible" content="ie=edge" />
        <title>Deno File Server</title>
        <style>
          :root {
            --background-color: #fafafa;
            --color: rgba(0, 0, 0, 0.87);
          }
          @media (prefers-color-scheme: dark) {
            :root {
              --background-color: #292929;
              --color: #fff;
            }
            thead {
              color: #7f7f7f;
            }
          }
          @media (min-width: 960px) {
            main {
              max-width: 960px;
            }
            body {
              padding-left: 32px;
              padding-right: 32px;
            }
          }
          @media (min-width: 600px) {
            main {
              padding-left: 24px;
              padding-right: 24px;
            }
          }
          body {
            background: var(--background-color);
            color: var(--color);
            font-family: "Roboto", "Helvetica", "Arial", sans-serif;
            font-weight: 400;
            line-height: 1.43;
            font-size: 0.875rem;
          }
          a {
            color: #2196f3;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
          thead {
            text-align: left;
          }
          thead th {
            padding-bottom: 12px;
          }
          table td {
            padding: 6px 36px 6px 0px;
          }
          .size {
            text-align: right;
            padding: 6px 12px 6px 24px;
          }
          .mode {
            font-family: monospace, monospace;
          }
        </style>
      </head>
      <body>
        <main>
          <h1>Index of
          <a href="/">home</a>${paths.map((path, index, array)=>{
        if (path === "") return "";
        const link = array.slice(0, index + 1).join("/");
        return `<a href="${link}">${path}</a>`;
    }).join("/")}
          </h1>
          <table>
            <thead>
              <tr>
                <th>Mode</th>
                <th>Size</th>
                <th>Name</th>
              </tr>
            </thead>
            ${entries.map((entry)=>`
                  <tr>
                    <td class="mode">
                      ${entry.mode}
                    </td>
                    <td class="size">
                      ${entry.size}
                    </td>
                    <td>
                      <a href="${entry.url}">${entry.name}</a>
                    </td>
                  </tr>
                `).join("")}
          </table>
        </main>
      </body>
    </html>
  `;
}
/**
 * Serves the files under the given directory root (opts.fsRoot).
 *
 * ```ts
 * import { serve } from "https://deno.land/std@$STD_VERSION/http/server.ts";
 * import { serveDir } from "https://deno.land/std@$STD_VERSION/http/file_server.ts";
 *
 * serve((req) => {
 *   const pathname = new URL(req.url).pathname;
 *   if (pathname.startsWith("/static")) {
 *     return serveDir(req, {
 *       fsRoot: "path/to/static/files/dir",
 *     });
 *   }
 *   // Do dynamic responses
 *   return new Response();
 * });
 * ```
 *
 * Optionally you can pass `urlRoot` option. If it's specified that part is stripped from the beginning of the requested pathname.
 *
 * ```ts
 * import { serveDir } from "https://deno.land/std@$STD_VERSION/http/file_server.ts";
 *
 * // ...
 * serveDir(new Request("http://localhost/static/path/to/file"), {
 *   fsRoot: "public",
 *   urlRoot: "static",
 * });
 * ```
 *
 * The above example serves `./public/path/to/file` for the request to `/static/path/to/file`.
 *
 * @param req The request to handle
 */ export async function serveDir(req, opts = {}) {
    let response = undefined;
    const target = opts.fsRoot || ".";
    const urlRoot = opts.urlRoot;
    const showIndex = opts.showIndex ?? true;
    try {
        let normalizedPath = normalizeURL(req.url);
        if (urlRoot) {
            if (normalizedPath.startsWith("/" + urlRoot)) {
                normalizedPath = normalizedPath.replace(urlRoot, "");
            } else {
                throw new Deno.errors.NotFound();
            }
        }
        const fsPath = posix.join(target, normalizedPath);
        const fileInfo = await Deno.stat(fsPath);
        if (fileInfo.isDirectory) {
            if (showIndex) {
                try {
                    const path = posix.join(fsPath, "index.html");
                    const indexFileInfo = await Deno.lstat(path);
                    if (indexFileInfo.isFile) {
                        response = await serveFile(req, path, {
                            etagAlgorithm: opts.etagAlgorithm,
                            fileInfo: indexFileInfo
                        });
                    }
                } catch (e) {
                    if (!(e instanceof Deno.errors.NotFound)) {
                        throw e;
                    }
                // pass
                }
            }
            if (!response && opts.showDirListing) {
                response = await serveDirIndex(fsPath, {
                    dotfiles: opts.showDotfiles || false,
                    target
                });
            }
            if (!response) {
                throw new Deno.errors.NotFound();
            }
        } else {
            response = await serveFile(req, fsPath, {
                etagAlgorithm: opts.etagAlgorithm,
                fileInfo
            });
        }
    } catch (e1) {
        const err = e1 instanceof Error ? e1 : new Error("[non-error thrown]");
        if (!opts.quiet) console.error(red(err.message));
        response = await serveFallback(req, err);
    }
    if (opts.enableCors) {
        assert(response);
        response.headers.append("access-control-allow-origin", "*");
        response.headers.append("access-control-allow-headers", "Origin, X-Requested-With, Content-Type, Accept, Range");
    }
    if (!opts.quiet) serverLog(req, response.status);
    if (opts.headers) {
        for (const header of opts.headers){
            const headerSplit = header.split(":");
            const name = headerSplit[0];
            const value = headerSplit.slice(1).join(":");
            response.headers.append(name, value);
        }
    }
    return response;
}
function normalizeURL(url) {
    return posix.normalize(decodeURIComponent(new URL(url).pathname));
}
function main() {
    const serverArgs = parse(Deno.args, {
        string: [
            "port",
            "host",
            "cert",
            "key",
            "header"
        ],
        boolean: [
            "help",
            "dir-listing",
            "dotfiles",
            "cors",
            "verbose",
            "version"
        ],
        negatable: [
            "dir-listing",
            "dotfiles",
            "cors"
        ],
        collect: [
            "header"
        ],
        default: {
            "dir-listing": true,
            dotfiles: true,
            cors: true,
            verbose: false,
            version: false,
            host: "0.0.0.0",
            port: "4507",
            cert: "",
            key: ""
        },
        alias: {
            p: "port",
            c: "cert",
            k: "key",
            h: "help",
            v: "verbose",
            V: "version",
            H: "header"
        }
    });
    const port = Number(serverArgs.port);
    const headers = serverArgs.header || [];
    const host = serverArgs.host;
    const certFile = serverArgs.cert;
    const keyFile = serverArgs.key;
    if (serverArgs.help) {
        printUsage();
        Deno.exit();
    }
    if (serverArgs.version) {
        console.log(`Deno File Server ${VERSION}`);
        Deno.exit();
    }
    if (keyFile || certFile) {
        if (keyFile === "" || certFile === "") {
            console.log("--key and --cert are required for TLS");
            printUsage();
            Deno.exit(1);
        }
    }
    const wild = serverArgs._;
    const target = posix.resolve(wild[0] ?? "");
    const handler = (req)=>{
        return serveDir(req, {
            fsRoot: target,
            showDirListing: serverArgs["dir-listing"],
            showDotfiles: serverArgs.dotfiles,
            enableCors: serverArgs.cors,
            quiet: !serverArgs.verbose,
            headers
        });
    };
    const useTls = !!(keyFile && certFile);
    if (useTls) {
        serveTls(handler, {
            port,
            hostname: host,
            certFile,
            keyFile
        });
    } else {
        serve(handler, {
            port,
            hostname: host
        });
    }
}
function printUsage() {
    console.log(`Deno File Server ${VERSION}
  Serves a local directory in HTTP.

INSTALL:
  deno install --allow-net --allow-read https://deno.land/std/http/file_server.ts

USAGE:
  file_server [path] [options]

OPTIONS:
  -h, --help            Prints help information
  -p, --port <PORT>     Set port
  --cors                Enable CORS via the "Access-Control-Allow-Origin" header
  --host     <HOST>     Hostname (default is 0.0.0.0)
  -c, --cert <FILE>     TLS certificate file (enables TLS)
  -k, --key  <FILE>     TLS key file (enables TLS)
  -H, --header <HEADER> Sets a header on every request.
                        (e.g. --header "Cache-Control: no-cache")
                        This option can be specified multiple times.
  --no-dir-listing      Disable directory listing
  --no-dotfiles         Do not show dotfiles
  --no-cors             Disable cross-origin resource sharing
  -v, --verbose         Print request level logs
  -V, --version         Print version information

  All TLS options are required when one is provided.`);
}
if (import.meta.main) {
    main();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE3My4wL2h0dHAvZmlsZV9zZXJ2ZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgLVMgZGVubyBydW4gLS1hbGxvdy1uZXQgLS1hbGxvdy1yZWFkXG4vLyBDb3B5cmlnaHQgMjAxOC0yMDIzIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuXG4vLyBUaGlzIHByb2dyYW0gc2VydmVzIGZpbGVzIGluIHRoZSBjdXJyZW50IGRpcmVjdG9yeSBvdmVyIEhUVFAuXG4vLyBUT0RPKGJhcnRsb21pZWp1KTogQWRkIHRlc3RzIGxpa2UgdGhlc2U6XG4vLyBodHRwczovL2dpdGh1Yi5jb20vaW5kZXh6ZXJvL2h0dHAtc2VydmVyL2Jsb2IvbWFzdGVyL3Rlc3QvaHR0cC1zZXJ2ZXItdGVzdC5qc1xuXG5pbXBvcnQgeyBleHRuYW1lLCBwb3NpeCB9IGZyb20gXCIuLi9wYXRoL21vZC50c1wiO1xuaW1wb3J0IHsgY29udGVudFR5cGUgfSBmcm9tIFwiLi4vbWVkaWFfdHlwZXMvY29udGVudF90eXBlLnRzXCI7XG5pbXBvcnQgeyBzZXJ2ZSwgc2VydmVUbHMgfSBmcm9tIFwiLi9zZXJ2ZXIudHNcIjtcbmltcG9ydCB7IFN0YXR1cyB9IGZyb20gXCIuL2h0dHBfc3RhdHVzLnRzXCI7XG5pbXBvcnQgeyBwYXJzZSB9IGZyb20gXCIuLi9mbGFncy9tb2QudHNcIjtcbmltcG9ydCB7IGFzc2VydCB9IGZyb20gXCIuLi9fdXRpbC9hc3NlcnRzLnRzXCI7XG5pbXBvcnQgeyByZWQgfSBmcm9tIFwiLi4vZm10L2NvbG9ycy50c1wiO1xuaW1wb3J0IHsgY29tcGFyZUV0YWcsIGNyZWF0ZUNvbW1vblJlc3BvbnNlIH0gZnJvbSBcIi4vdXRpbC50c1wiO1xuaW1wb3J0IHsgRGlnZXN0QWxnb3JpdGhtIH0gZnJvbSBcIi4uL2NyeXB0by9jcnlwdG8udHNcIjtcbmltcG9ydCB7IHRvSGFzaFN0cmluZyB9IGZyb20gXCIuLi9jcnlwdG8vdG9faGFzaF9zdHJpbmcudHNcIjtcbmltcG9ydCB7IGNyZWF0ZUhhc2ggfSBmcm9tIFwiLi4vY3J5cHRvL191dGlsLnRzXCI7XG5pbXBvcnQgeyBWRVJTSU9OIH0gZnJvbSBcIi4uL3ZlcnNpb24udHNcIjtcbmludGVyZmFjZSBFbnRyeUluZm8ge1xuICBtb2RlOiBzdHJpbmc7XG4gIHNpemU6IHN0cmluZztcbiAgdXJsOiBzdHJpbmc7XG4gIG5hbWU6IHN0cmluZztcbn1cblxuY29uc3QgZW5jb2RlciA9IG5ldyBUZXh0RW5jb2RlcigpO1xuXG5mdW5jdGlvbiBtb2RlVG9TdHJpbmcoaXNEaXI6IGJvb2xlYW4sIG1heWJlTW9kZTogbnVtYmVyIHwgbnVsbCk6IHN0cmluZyB7XG4gIGNvbnN0IG1vZGVNYXAgPSBbXCItLS1cIiwgXCItLXhcIiwgXCItdy1cIiwgXCItd3hcIiwgXCJyLS1cIiwgXCJyLXhcIiwgXCJydy1cIiwgXCJyd3hcIl07XG5cbiAgaWYgKG1heWJlTW9kZSA9PT0gbnVsbCkge1xuICAgIHJldHVybiBcIih1bmtub3duIG1vZGUpXCI7XG4gIH1cbiAgY29uc3QgbW9kZSA9IG1heWJlTW9kZS50b1N0cmluZyg4KTtcbiAgaWYgKG1vZGUubGVuZ3RoIDwgMykge1xuICAgIHJldHVybiBcIih1bmtub3duIG1vZGUpXCI7XG4gIH1cbiAgbGV0IG91dHB1dCA9IFwiXCI7XG4gIG1vZGVcbiAgICAuc3BsaXQoXCJcIilcbiAgICAucmV2ZXJzZSgpXG4gICAgLnNsaWNlKDAsIDMpXG4gICAgLmZvckVhY2goKHYpID0+IHtcbiAgICAgIG91dHB1dCA9IGAke21vZGVNYXBbK3ZdfSAke291dHB1dH1gO1xuICAgIH0pO1xuICBvdXRwdXQgPSBgJHtpc0RpciA/IFwiZFwiIDogXCItXCJ9ICR7b3V0cHV0fWA7XG4gIHJldHVybiBvdXRwdXQ7XG59XG5cbmZ1bmN0aW9uIGZpbGVMZW5Ub1N0cmluZyhsZW46IG51bWJlcik6IHN0cmluZyB7XG4gIGNvbnN0IG11bHRpcGxpZXIgPSAxMDI0O1xuICBsZXQgYmFzZSA9IDE7XG4gIGNvbnN0IHN1ZmZpeCA9IFtcIkJcIiwgXCJLXCIsIFwiTVwiLCBcIkdcIiwgXCJUXCJdO1xuICBsZXQgc3VmZml4SW5kZXggPSAwO1xuXG4gIHdoaWxlIChiYXNlICogbXVsdGlwbGllciA8IGxlbikge1xuICAgIGlmIChzdWZmaXhJbmRleCA+PSBzdWZmaXgubGVuZ3RoIC0gMSkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGJhc2UgKj0gbXVsdGlwbGllcjtcbiAgICBzdWZmaXhJbmRleCsrO1xuICB9XG5cbiAgcmV0dXJuIGAkeyhsZW4gLyBiYXNlKS50b0ZpeGVkKDIpfSR7c3VmZml4W3N1ZmZpeEluZGV4XX1gO1xufVxuXG4vKiogSW50ZXJmYWNlIGZvciBzZXJ2ZUZpbGUgb3B0aW9ucy4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU2VydmVGaWxlT3B0aW9ucyB7XG4gIC8qKiBUaGUgYWxnb3JpdGhtIHRvIHVzZSBmb3IgZ2VuZXJhdGluZyB0aGUgRVRhZy5cbiAgICpcbiAgICogQGRlZmF1bHQge1wiZm52MWFcIn1cbiAgICovXG4gIGV0YWdBbGdvcml0aG0/OiBEaWdlc3RBbGdvcml0aG07XG4gIC8qKiBBbiBvcHRpb25hbCBGaWxlSW5mbyBvYmplY3QgcmV0dXJuZWQgYnkgRGVuby5zdGF0LiBJdCBpcyB1c2VkIGZvciBvcHRpbWl6YXRpb24gcHVycG9zZXMuICovXG4gIGZpbGVJbmZvPzogRGVuby5GaWxlSW5mbztcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGFuIEhUVFAgUmVzcG9uc2Ugd2l0aCB0aGUgcmVxdWVzdGVkIGZpbGUgYXMgdGhlIGJvZHkuXG4gKiBAcGFyYW0gcmVxIFRoZSBzZXJ2ZXIgcmVxdWVzdCBjb250ZXh0IHVzZWQgdG8gY2xlYW51cCB0aGUgZmlsZSBoYW5kbGUuXG4gKiBAcGFyYW0gZmlsZVBhdGggUGF0aCBvZiB0aGUgZmlsZSB0byBzZXJ2ZS5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNlcnZlRmlsZShcbiAgcmVxOiBSZXF1ZXN0LFxuICBmaWxlUGF0aDogc3RyaW5nLFxuICB7IGV0YWdBbGdvcml0aG0sIGZpbGVJbmZvIH06IFNlcnZlRmlsZU9wdGlvbnMgPSB7fSxcbik6IFByb21pc2U8UmVzcG9uc2U+IHtcbiAgdHJ5IHtcbiAgICBmaWxlSW5mbyA/Pz0gYXdhaXQgRGVuby5zdGF0KGZpbGVQYXRoKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBEZW5vLmVycm9ycy5Ob3RGb3VuZCkge1xuICAgICAgYXdhaXQgcmVxLmJvZHk/LmNhbmNlbCgpO1xuICAgICAgcmV0dXJuIGNyZWF0ZUNvbW1vblJlc3BvbnNlKFN0YXR1cy5Ob3RGb3VuZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxuXG4gIGlmIChmaWxlSW5mby5pc0RpcmVjdG9yeSkge1xuICAgIGF3YWl0IHJlcS5ib2R5Py5jYW5jZWwoKTtcbiAgICByZXR1cm4gY3JlYXRlQ29tbW9uUmVzcG9uc2UoU3RhdHVzLk5vdEZvdW5kKTtcbiAgfVxuXG4gIGNvbnN0IGZpbGUgPSBhd2FpdCBEZW5vLm9wZW4oZmlsZVBhdGgpO1xuXG4gIGNvbnN0IGhlYWRlcnMgPSBzZXRCYXNlSGVhZGVycygpO1xuXG4gIC8vIFNldCBtaW1lLXR5cGUgdXNpbmcgdGhlIGZpbGUgZXh0ZW5zaW9uIGluIGZpbGVQYXRoXG4gIGNvbnN0IGNvbnRlbnRUeXBlVmFsdWUgPSBjb250ZW50VHlwZShleHRuYW1lKGZpbGVQYXRoKSk7XG4gIGlmIChjb250ZW50VHlwZVZhbHVlKSB7XG4gICAgaGVhZGVycy5zZXQoXCJjb250ZW50LXR5cGVcIiwgY29udGVudFR5cGVWYWx1ZSk7XG4gIH1cblxuICAvLyBTZXQgZGF0ZSBoZWFkZXIgaWYgYWNjZXNzIHRpbWVzdGFtcCBpcyBhdmFpbGFibGVcbiAgaWYgKGZpbGVJbmZvLmF0aW1lIGluc3RhbmNlb2YgRGF0ZSkge1xuICAgIGNvbnN0IGRhdGUgPSBuZXcgRGF0ZShmaWxlSW5mby5hdGltZSk7XG4gICAgaGVhZGVycy5zZXQoXCJkYXRlXCIsIGRhdGUudG9VVENTdHJpbmcoKSk7XG4gIH1cblxuICAvLyBTZXQgbGFzdCBtb2RpZmllZCBoZWFkZXIgaWYgbGFzdCBtb2RpZmljYXRpb24gdGltZXN0YW1wIGlzIGF2YWlsYWJsZVxuICBpZiAoZmlsZUluZm8ubXRpbWUgaW5zdGFuY2VvZiBEYXRlKSB7XG4gICAgY29uc3QgbGFzdE1vZGlmaWVkID0gbmV3IERhdGUoZmlsZUluZm8ubXRpbWUpO1xuICAgIGhlYWRlcnMuc2V0KFwibGFzdC1tb2RpZmllZFwiLCBsYXN0TW9kaWZpZWQudG9VVENTdHJpbmcoKSk7XG5cbiAgICAvLyBDcmVhdGUgYSBzaW1wbGUgZXRhZyB0aGF0IGlzIGFuIG1kNSBvZiB0aGUgbGFzdCBtb2RpZmllZCBkYXRlIGFuZCBmaWxlc2l6ZSBjb25jYXRlbmF0ZWRcbiAgICBjb25zdCBldGFnID0gdG9IYXNoU3RyaW5nKFxuICAgICAgYXdhaXQgY3JlYXRlSGFzaChcbiAgICAgICAgZXRhZ0FsZ29yaXRobSA/PyBcIkZOVjMyQVwiLFxuICAgICAgICBgJHtsYXN0TW9kaWZpZWQudG9KU09OKCl9JHtmaWxlSW5mby5zaXplfWAsXG4gICAgICApLFxuICAgICk7XG4gICAgaGVhZGVycy5zZXQoXCJldGFnXCIsIGV0YWcpO1xuXG4gICAgLy8gSWYgYSBgaWYtbm9uZS1tYXRjaGAgaGVhZGVyIGlzIHByZXNlbnQgYW5kIHRoZSB2YWx1ZSBtYXRjaGVzIHRoZSB0YWcgb3JcbiAgICAvLyBpZiBhIGBpZi1tb2RpZmllZC1zaW5jZWAgaGVhZGVyIGlzIHByZXNlbnQgYW5kIHRoZSB2YWx1ZSBpcyBiaWdnZXIgdGhhblxuICAgIC8vIHRoZSBhY2Nlc3MgdGltZXN0YW1wIHZhbHVlLCB0aGVuIHJldHVybiAzMDRcbiAgICBjb25zdCBpZk5vbmVNYXRjaCA9IHJlcS5oZWFkZXJzLmdldChcImlmLW5vbmUtbWF0Y2hcIik7XG4gICAgY29uc3QgaWZNb2RpZmllZFNpbmNlID0gcmVxLmhlYWRlcnMuZ2V0KFwiaWYtbW9kaWZpZWQtc2luY2VcIik7XG4gICAgaWYgKFxuICAgICAgKGlmTm9uZU1hdGNoICYmIGNvbXBhcmVFdGFnKGlmTm9uZU1hdGNoLCBldGFnKSkgfHxcbiAgICAgIChpZk5vbmVNYXRjaCA9PT0gbnVsbCAmJlxuICAgICAgICBpZk1vZGlmaWVkU2luY2UgJiZcbiAgICAgICAgZmlsZUluZm8ubXRpbWUuZ2V0VGltZSgpIDwgbmV3IERhdGUoaWZNb2RpZmllZFNpbmNlKS5nZXRUaW1lKCkgKyAxMDAwKVxuICAgICkge1xuICAgICAgZmlsZS5jbG9zZSgpO1xuXG4gICAgICByZXR1cm4gY3JlYXRlQ29tbW9uUmVzcG9uc2UoU3RhdHVzLk5vdE1vZGlmaWVkLCBudWxsLCB7IGhlYWRlcnMgfSk7XG4gICAgfVxuICB9XG5cbiAgLy8gR2V0IGFuZCBwYXJzZSB0aGUgXCJyYW5nZVwiIGhlYWRlclxuICBjb25zdCByYW5nZSA9IHJlcS5oZWFkZXJzLmdldChcInJhbmdlXCIpIGFzIHN0cmluZztcbiAgY29uc3QgcmFuZ2VSZSA9IC9ieXRlcz0oXFxkKyktKFxcZCspPy87XG4gIGNvbnN0IHBhcnNlZCA9IHJhbmdlUmUuZXhlYyhyYW5nZSk7XG5cbiAgLy8gVXNlIHRoZSBwYXJzZWQgdmFsdWUgaWYgYXZhaWxhYmxlLCBmYWxsYmFjayB0byB0aGUgc3RhcnQgYW5kIGVuZCBvZiB0aGUgZW50aXJlIGZpbGVcbiAgY29uc3Qgc3RhcnQgPSBwYXJzZWQgJiYgcGFyc2VkWzFdID8gK3BhcnNlZFsxXSA6IDA7XG4gIGNvbnN0IGVuZCA9IHBhcnNlZCAmJiBwYXJzZWRbMl0gPyArcGFyc2VkWzJdIDogZmlsZUluZm8uc2l6ZSAtIDE7XG5cbiAgLy8gSWYgdGhlcmUgaXMgYSByYW5nZSwgc2V0IHRoZSBzdGF0dXMgdG8gMjA2LCBhbmQgc2V0IHRoZSBcIkNvbnRlbnQtcmFuZ2VcIiBoZWFkZXIuXG4gIGlmIChyYW5nZSAmJiBwYXJzZWQpIHtcbiAgICBoZWFkZXJzLnNldChcImNvbnRlbnQtcmFuZ2VcIiwgYGJ5dGVzICR7c3RhcnR9LSR7ZW5kfS8ke2ZpbGVJbmZvLnNpemV9YCk7XG4gIH1cblxuICAvLyBSZXR1cm4gNDE2IGlmIGBzdGFydGAgaXNuJ3QgbGVzcyB0aGFuIG9yIGVxdWFsIHRvIGBlbmRgLCBvciBgc3RhcnRgIG9yIGBlbmRgIGFyZSBncmVhdGVyIHRoYW4gdGhlIGZpbGUncyBzaXplXG4gIGNvbnN0IG1heFJhbmdlID0gZmlsZUluZm8uc2l6ZSAtIDE7XG5cbiAgaWYgKFxuICAgIHJhbmdlICYmXG4gICAgKCFwYXJzZWQgfHxcbiAgICAgIHR5cGVvZiBzdGFydCAhPT0gXCJudW1iZXJcIiB8fFxuICAgICAgc3RhcnQgPiBlbmQgfHxcbiAgICAgIHN0YXJ0ID4gbWF4UmFuZ2UgfHxcbiAgICAgIGVuZCA+IG1heFJhbmdlKVxuICApIHtcbiAgICBmaWxlLmNsb3NlKCk7XG5cbiAgICByZXR1cm4gY3JlYXRlQ29tbW9uUmVzcG9uc2UoXG4gICAgICBTdGF0dXMuUmVxdWVzdGVkUmFuZ2VOb3RTYXRpc2ZpYWJsZSxcbiAgICAgIHVuZGVmaW5lZCxcbiAgICAgIHtcbiAgICAgICAgaGVhZGVycyxcbiAgICAgIH0sXG4gICAgKTtcbiAgfVxuXG4gIC8vIFNldCBjb250ZW50IGxlbmd0aFxuICBjb25zdCBjb250ZW50TGVuZ3RoID0gZW5kIC0gc3RhcnQgKyAxO1xuICBoZWFkZXJzLnNldChcImNvbnRlbnQtbGVuZ3RoXCIsIGAke2NvbnRlbnRMZW5ndGh9YCk7XG4gIGlmIChyYW5nZSAmJiBwYXJzZWQpIHtcbiAgICBhd2FpdCBmaWxlLnNlZWsoc3RhcnQsIERlbm8uU2Vla01vZGUuU3RhcnQpO1xuICAgIHJldHVybiBjcmVhdGVDb21tb25SZXNwb25zZShTdGF0dXMuUGFydGlhbENvbnRlbnQsIGZpbGUucmVhZGFibGUsIHtcbiAgICAgIGhlYWRlcnMsXG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gY3JlYXRlQ29tbW9uUmVzcG9uc2UoU3RhdHVzLk9LLCBmaWxlLnJlYWRhYmxlLCB7IGhlYWRlcnMgfSk7XG59XG5cbi8vIFRPRE8oYmFydGxvbWllanUpOiBzaW1wbGlmeSB0aGlzIGFmdGVyIGRlbm8uc3RhdCBhbmQgZGVuby5yZWFkRGlyIGFyZSBmaXhlZFxuYXN5bmMgZnVuY3Rpb24gc2VydmVEaXJJbmRleChcbiAgZGlyUGF0aDogc3RyaW5nLFxuICBvcHRpb25zOiB7XG4gICAgZG90ZmlsZXM6IGJvb2xlYW47XG4gICAgdGFyZ2V0OiBzdHJpbmc7XG4gIH0sXG4pOiBQcm9taXNlPFJlc3BvbnNlPiB7XG4gIGNvbnN0IHNob3dEb3RmaWxlcyA9IG9wdGlvbnMuZG90ZmlsZXM7XG4gIGNvbnN0IGRpclVybCA9IGAvJHtwb3NpeC5yZWxhdGl2ZShvcHRpb25zLnRhcmdldCwgZGlyUGF0aCl9YDtcbiAgY29uc3QgbGlzdEVudHJ5OiBFbnRyeUluZm9bXSA9IFtdO1xuXG4gIC8vIGlmIFwiLi5cIiBtYWtlcyBzZW5zZVxuICBpZiAoZGlyVXJsICE9PSBcIi9cIikge1xuICAgIGNvbnN0IHByZXZQYXRoID0gcG9zaXguam9pbihkaXJQYXRoLCBcIi4uXCIpO1xuICAgIGNvbnN0IGZpbGVJbmZvID0gYXdhaXQgRGVuby5zdGF0KHByZXZQYXRoKTtcbiAgICBsaXN0RW50cnkucHVzaCh7XG4gICAgICBtb2RlOiBtb2RlVG9TdHJpbmcodHJ1ZSwgZmlsZUluZm8ubW9kZSksXG4gICAgICBzaXplOiBcIlwiLFxuICAgICAgbmFtZTogXCIuLi9cIixcbiAgICAgIHVybDogcG9zaXguam9pbihkaXJVcmwsIFwiLi5cIiksXG4gICAgfSk7XG4gIH1cblxuICBmb3IgYXdhaXQgKGNvbnN0IGVudHJ5IG9mIERlbm8ucmVhZERpcihkaXJQYXRoKSkge1xuICAgIGlmICghc2hvd0RvdGZpbGVzICYmIGVudHJ5Lm5hbWVbMF0gPT09IFwiLlwiKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgY29uc3QgZmlsZVBhdGggPSBwb3NpeC5qb2luKGRpclBhdGgsIGVudHJ5Lm5hbWUpO1xuICAgIGNvbnN0IGZpbGVVcmwgPSBlbmNvZGVVUklDb21wb25lbnQocG9zaXguam9pbihkaXJVcmwsIGVudHJ5Lm5hbWUpKVxuICAgICAgLnJlcGxhY2VBbGwoXCIlMkZcIiwgXCIvXCIpO1xuICAgIGNvbnN0IGZpbGVJbmZvID0gYXdhaXQgRGVuby5zdGF0KGZpbGVQYXRoKTtcbiAgICBsaXN0RW50cnkucHVzaCh7XG4gICAgICBtb2RlOiBtb2RlVG9TdHJpbmcoZW50cnkuaXNEaXJlY3RvcnksIGZpbGVJbmZvLm1vZGUpLFxuICAgICAgc2l6ZTogZW50cnkuaXNGaWxlID8gZmlsZUxlblRvU3RyaW5nKGZpbGVJbmZvLnNpemUgPz8gMCkgOiBcIlwiLFxuICAgICAgbmFtZTogYCR7ZW50cnkubmFtZX0ke2VudHJ5LmlzRGlyZWN0b3J5ID8gXCIvXCIgOiBcIlwifWAsXG4gICAgICB1cmw6IGAke2ZpbGVVcmx9JHtlbnRyeS5pc0RpcmVjdG9yeSA/IFwiL1wiIDogXCJcIn1gLFxuICAgIH0pO1xuICB9XG4gIGxpc3RFbnRyeS5zb3J0KChhLCBiKSA9PlxuICAgIGEubmFtZS50b0xvd2VyQ2FzZSgpID4gYi5uYW1lLnRvTG93ZXJDYXNlKCkgPyAxIDogLTFcbiAgKTtcbiAgY29uc3QgZm9ybWF0dGVkRGlyVXJsID0gYCR7ZGlyVXJsLnJlcGxhY2UoL1xcLyQvLCBcIlwiKX0vYDtcbiAgY29uc3QgcGFnZSA9IGVuY29kZXIuZW5jb2RlKGRpclZpZXdlclRlbXBsYXRlKGZvcm1hdHRlZERpclVybCwgbGlzdEVudHJ5KSk7XG5cbiAgY29uc3QgaGVhZGVycyA9IHNldEJhc2VIZWFkZXJzKCk7XG4gIGhlYWRlcnMuc2V0KFwiY29udGVudC10eXBlXCIsIFwidGV4dC9odG1sXCIpO1xuXG4gIHJldHVybiBjcmVhdGVDb21tb25SZXNwb25zZShTdGF0dXMuT0ssIHBhZ2UsIHsgaGVhZGVycyB9KTtcbn1cblxuZnVuY3Rpb24gc2VydmVGYWxsYmFjayhfcmVxOiBSZXF1ZXN0LCBlOiBFcnJvcik6IFByb21pc2U8UmVzcG9uc2U+IHtcbiAgaWYgKGUgaW5zdGFuY2VvZiBVUklFcnJvcikge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY3JlYXRlQ29tbW9uUmVzcG9uc2UoU3RhdHVzLkJhZFJlcXVlc3QpKTtcbiAgfSBlbHNlIGlmIChlIGluc3RhbmNlb2YgRGVuby5lcnJvcnMuTm90Rm91bmQpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGNyZWF0ZUNvbW1vblJlc3BvbnNlKFN0YXR1cy5Ob3RGb3VuZCkpO1xuICB9XG5cbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjcmVhdGVDb21tb25SZXNwb25zZShTdGF0dXMuSW50ZXJuYWxTZXJ2ZXJFcnJvcikpO1xufVxuXG5mdW5jdGlvbiBzZXJ2ZXJMb2cocmVxOiBSZXF1ZXN0LCBzdGF0dXM6IG51bWJlcikge1xuICBjb25zdCBkID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuICBjb25zdCBkYXRlRm10ID0gYFske2Quc2xpY2UoMCwgMTApfSAke2Quc2xpY2UoMTEsIDE5KX1dYDtcbiAgY29uc3Qgbm9ybWFsaXplZFVybCA9IG5vcm1hbGl6ZVVSTChyZXEudXJsKTtcbiAgY29uc3QgcyA9IGAke2RhdGVGbXR9IFske3JlcS5tZXRob2R9XSAke25vcm1hbGl6ZWRVcmx9ICR7c3RhdHVzfWA7XG4gIC8vIHVzaW5nIGNvbnNvbGUuZGVidWcgaW5zdGVhZCBvZiBjb25zb2xlLmxvZyBzbyBjaHJvbWUgaW5zcGVjdCB1c2VycyBjYW4gaGlkZSByZXF1ZXN0IGxvZ3NcbiAgY29uc29sZS5kZWJ1ZyhzKTtcbn1cblxuZnVuY3Rpb24gc2V0QmFzZUhlYWRlcnMoKTogSGVhZGVycyB7XG4gIGNvbnN0IGhlYWRlcnMgPSBuZXcgSGVhZGVycygpO1xuICBoZWFkZXJzLnNldChcInNlcnZlclwiLCBcImRlbm9cIik7XG5cbiAgLy8gU2V0IFwiYWNjZXB0LXJhbmdlc1wiIHNvIHRoYXQgdGhlIGNsaWVudCBrbm93cyBpdCBjYW4gbWFrZSByYW5nZSByZXF1ZXN0cyBvbiBmdXR1cmUgcmVxdWVzdHNcbiAgaGVhZGVycy5zZXQoXCJhY2NlcHQtcmFuZ2VzXCIsIFwiYnl0ZXNcIik7XG4gIGhlYWRlcnMuc2V0KFwiZGF0ZVwiLCBuZXcgRGF0ZSgpLnRvVVRDU3RyaW5nKCkpO1xuXG4gIHJldHVybiBoZWFkZXJzO1xufVxuXG5mdW5jdGlvbiBkaXJWaWV3ZXJUZW1wbGF0ZShkaXJuYW1lOiBzdHJpbmcsIGVudHJpZXM6IEVudHJ5SW5mb1tdKTogc3RyaW5nIHtcbiAgY29uc3QgcGF0aHMgPSBkaXJuYW1lLnNwbGl0KFwiL1wiKTtcblxuICByZXR1cm4gYFxuICAgIDwhRE9DVFlQRSBodG1sPlxuICAgIDxodG1sIGxhbmc9XCJlblwiPlxuICAgICAgPGhlYWQ+XG4gICAgICAgIDxtZXRhIGNoYXJzZXQ9XCJVVEYtOFwiIC8+XG4gICAgICAgIDxtZXRhIG5hbWU9XCJ2aWV3cG9ydFwiIGNvbnRlbnQ9XCJ3aWR0aD1kZXZpY2Utd2lkdGgsIGluaXRpYWwtc2NhbGU9MS4wXCIgLz5cbiAgICAgICAgPG1ldGEgaHR0cC1lcXVpdj1cIlgtVUEtQ29tcGF0aWJsZVwiIGNvbnRlbnQ9XCJpZT1lZGdlXCIgLz5cbiAgICAgICAgPHRpdGxlPkRlbm8gRmlsZSBTZXJ2ZXI8L3RpdGxlPlxuICAgICAgICA8c3R5bGU+XG4gICAgICAgICAgOnJvb3Qge1xuICAgICAgICAgICAgLS1iYWNrZ3JvdW5kLWNvbG9yOiAjZmFmYWZhO1xuICAgICAgICAgICAgLS1jb2xvcjogcmdiYSgwLCAwLCAwLCAwLjg3KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogZGFyaykge1xuICAgICAgICAgICAgOnJvb3Qge1xuICAgICAgICAgICAgICAtLWJhY2tncm91bmQtY29sb3I6ICMyOTI5Mjk7XG4gICAgICAgICAgICAgIC0tY29sb3I6ICNmZmY7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGVhZCB7XG4gICAgICAgICAgICAgIGNvbG9yOiAjN2Y3ZjdmO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBAbWVkaWEgKG1pbi13aWR0aDogOTYwcHgpIHtcbiAgICAgICAgICAgIG1haW4ge1xuICAgICAgICAgICAgICBtYXgtd2lkdGg6IDk2MHB4O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYm9keSB7XG4gICAgICAgICAgICAgIHBhZGRpbmctbGVmdDogMzJweDtcbiAgICAgICAgICAgICAgcGFkZGluZy1yaWdodDogMzJweDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgQG1lZGlhIChtaW4td2lkdGg6IDYwMHB4KSB7XG4gICAgICAgICAgICBtYWluIHtcbiAgICAgICAgICAgICAgcGFkZGluZy1sZWZ0OiAyNHB4O1xuICAgICAgICAgICAgICBwYWRkaW5nLXJpZ2h0OiAyNHB4O1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBib2R5IHtcbiAgICAgICAgICAgIGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQtY29sb3IpO1xuICAgICAgICAgICAgY29sb3I6IHZhcigtLWNvbG9yKTtcbiAgICAgICAgICAgIGZvbnQtZmFtaWx5OiBcIlJvYm90b1wiLCBcIkhlbHZldGljYVwiLCBcIkFyaWFsXCIsIHNhbnMtc2VyaWY7XG4gICAgICAgICAgICBmb250LXdlaWdodDogNDAwO1xuICAgICAgICAgICAgbGluZS1oZWlnaHQ6IDEuNDM7XG4gICAgICAgICAgICBmb250LXNpemU6IDAuODc1cmVtO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhIHtcbiAgICAgICAgICAgIGNvbG9yOiAjMjE5NmYzO1xuICAgICAgICAgICAgdGV4dC1kZWNvcmF0aW9uOiBub25lO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhOmhvdmVyIHtcbiAgICAgICAgICAgIHRleHQtZGVjb3JhdGlvbjogdW5kZXJsaW5lO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGVhZCB7XG4gICAgICAgICAgICB0ZXh0LWFsaWduOiBsZWZ0O1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGVhZCB0aCB7XG4gICAgICAgICAgICBwYWRkaW5nLWJvdHRvbTogMTJweDtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGFibGUgdGQge1xuICAgICAgICAgICAgcGFkZGluZzogNnB4IDM2cHggNnB4IDBweDtcbiAgICAgICAgICB9XG4gICAgICAgICAgLnNpemUge1xuICAgICAgICAgICAgdGV4dC1hbGlnbjogcmlnaHQ7XG4gICAgICAgICAgICBwYWRkaW5nOiA2cHggMTJweCA2cHggMjRweDtcbiAgICAgICAgICB9XG4gICAgICAgICAgLm1vZGUge1xuICAgICAgICAgICAgZm9udC1mYW1pbHk6IG1vbm9zcGFjZSwgbW9ub3NwYWNlO1xuICAgICAgICAgIH1cbiAgICAgICAgPC9zdHlsZT5cbiAgICAgIDwvaGVhZD5cbiAgICAgIDxib2R5PlxuICAgICAgICA8bWFpbj5cbiAgICAgICAgICA8aDE+SW5kZXggb2ZcbiAgICAgICAgICA8YSBocmVmPVwiL1wiPmhvbWU8L2E+JHtcbiAgICBwYXRoc1xuICAgICAgLm1hcCgocGF0aCwgaW5kZXgsIGFycmF5KSA9PiB7XG4gICAgICAgIGlmIChwYXRoID09PSBcIlwiKSByZXR1cm4gXCJcIjtcbiAgICAgICAgY29uc3QgbGluayA9IGFycmF5LnNsaWNlKDAsIGluZGV4ICsgMSkuam9pbihcIi9cIik7XG4gICAgICAgIHJldHVybiBgPGEgaHJlZj1cIiR7bGlua31cIj4ke3BhdGh9PC9hPmA7XG4gICAgICB9KVxuICAgICAgLmpvaW4oXCIvXCIpXG4gIH1cbiAgICAgICAgICA8L2gxPlxuICAgICAgICAgIDx0YWJsZT5cbiAgICAgICAgICAgIDx0aGVhZD5cbiAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgIDx0aD5Nb2RlPC90aD5cbiAgICAgICAgICAgICAgICA8dGg+U2l6ZTwvdGg+XG4gICAgICAgICAgICAgICAgPHRoPk5hbWU8L3RoPlxuICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgPC90aGVhZD5cbiAgICAgICAgICAgICR7XG4gICAgZW50cmllc1xuICAgICAgLm1hcChcbiAgICAgICAgKGVudHJ5KSA9PiBgXG4gICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzcz1cIm1vZGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAke2VudHJ5Lm1vZGV9XG4gICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzcz1cInNpemVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAke2VudHJ5LnNpemV9XG4gICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgICAgICAgIDx0ZD5cbiAgICAgICAgICAgICAgICAgICAgICA8YSBocmVmPVwiJHtlbnRyeS51cmx9XCI+JHtlbnRyeS5uYW1lfTwvYT5cbiAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgYCxcbiAgICAgIClcbiAgICAgIC5qb2luKFwiXCIpXG4gIH1cbiAgICAgICAgICA8L3RhYmxlPlxuICAgICAgICA8L21haW4+XG4gICAgICA8L2JvZHk+XG4gICAgPC9odG1sPlxuICBgO1xufVxuXG4vKiogSW50ZXJmYWNlIGZvciBzZXJ2ZURpciBvcHRpb25zLiAqL1xuZXhwb3J0IGludGVyZmFjZSBTZXJ2ZURpck9wdGlvbnMge1xuICAvKiogU2VydmVzIHRoZSBmaWxlcyB1bmRlciB0aGUgZ2l2ZW4gZGlyZWN0b3J5IHJvb3QuIERlZmF1bHRzIHRvIHlvdXIgY3VycmVudCBkaXJlY3RvcnkuICovXG4gIGZzUm9vdD86IHN0cmluZztcbiAgLyoqIFNwZWNpZmllZCB0aGF0IHBhcnQgaXMgc3RyaXBwZWQgZnJvbSB0aGUgYmVnaW5uaW5nIG9mIHRoZSByZXF1ZXN0ZWQgcGF0aG5hbWUuICovXG4gIHVybFJvb3Q/OiBzdHJpbmc7XG4gIC8qKiBFbmFibGUgZGlyZWN0b3J5IGxpc3RpbmcuXG4gICAqXG4gICAqIEBkZWZhdWx0IHtmYWxzZX1cbiAgICovXG4gIHNob3dEaXJMaXN0aW5nPzogYm9vbGVhbjtcbiAgLyoqIFNlcnZlcyBkb3RmaWxlcy5cbiAgICpcbiAgICogQGRlZmF1bHQge2ZhbHNlfVxuICAgKi9cbiAgc2hvd0RvdGZpbGVzPzogYm9vbGVhbjtcbiAgLyoqIFNlcnZlcyBpbmRleC5odG1sIGFzIHRoZSBpbmRleCBmaWxlIG9mIHRoZSBkaXJlY3RvcnkuICovXG4gIHNob3dJbmRleD86IGJvb2xlYW47XG4gIC8qKiBFbmFibGUgQ09SUyB2aWEgdGhlIFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCIgaGVhZGVyLlxuICAgKlxuICAgKiBAZGVmYXVsdCB7ZmFsc2V9XG4gICAqL1xuICBlbmFibGVDb3JzPzogYm9vbGVhbjtcbiAgLyoqIERvIG5vdCBwcmludCByZXF1ZXN0IGxldmVsIGxvZ3MuIERlZmF1bHRzIHRvIGZhbHNlLlxuICAgKlxuICAgKiBAZGVmYXVsdCB7ZmFsc2V9XG4gICAqL1xuICBxdWlldD86IGJvb2xlYW47XG4gIC8qKiBUaGUgYWxnb3JpdGhtIHRvIHVzZSBmb3IgZ2VuZXJhdGluZyB0aGUgRVRhZy5cbiAgICpcbiAgICogQGRlZmF1bHQge1wiZm52MWFcIn1cbiAgICovXG4gIGV0YWdBbGdvcml0aG0/OiBEaWdlc3RBbGdvcml0aG07XG4gIC8qKiBIZWFkZXJzIHRvIGFkZCB0byBlYWNoIHJlcXVlc3RcbiAgICpcbiAgICogQGRlZmF1bHQge1tdfVxuICAgKi9cbiAgaGVhZGVycz86IHN0cmluZ1tdO1xufVxuXG4vKipcbiAqIFNlcnZlcyB0aGUgZmlsZXMgdW5kZXIgdGhlIGdpdmVuIGRpcmVjdG9yeSByb290IChvcHRzLmZzUm9vdCkuXG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IHNlcnZlIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vaHR0cC9zZXJ2ZXIudHNcIjtcbiAqIGltcG9ydCB7IHNlcnZlRGlyIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vaHR0cC9maWxlX3NlcnZlci50c1wiO1xuICpcbiAqIHNlcnZlKChyZXEpID0+IHtcbiAqICAgY29uc3QgcGF0aG5hbWUgPSBuZXcgVVJMKHJlcS51cmwpLnBhdGhuYW1lO1xuICogICBpZiAocGF0aG5hbWUuc3RhcnRzV2l0aChcIi9zdGF0aWNcIikpIHtcbiAqICAgICByZXR1cm4gc2VydmVEaXIocmVxLCB7XG4gKiAgICAgICBmc1Jvb3Q6IFwicGF0aC90by9zdGF0aWMvZmlsZXMvZGlyXCIsXG4gKiAgICAgfSk7XG4gKiAgIH1cbiAqICAgLy8gRG8gZHluYW1pYyByZXNwb25zZXNcbiAqICAgcmV0dXJuIG5ldyBSZXNwb25zZSgpO1xuICogfSk7XG4gKiBgYGBcbiAqXG4gKiBPcHRpb25hbGx5IHlvdSBjYW4gcGFzcyBgdXJsUm9vdGAgb3B0aW9uLiBJZiBpdCdzIHNwZWNpZmllZCB0aGF0IHBhcnQgaXMgc3RyaXBwZWQgZnJvbSB0aGUgYmVnaW5uaW5nIG9mIHRoZSByZXF1ZXN0ZWQgcGF0aG5hbWUuXG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IHNlcnZlRGlyIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vaHR0cC9maWxlX3NlcnZlci50c1wiO1xuICpcbiAqIC8vIC4uLlxuICogc2VydmVEaXIobmV3IFJlcXVlc3QoXCJodHRwOi8vbG9jYWxob3N0L3N0YXRpYy9wYXRoL3RvL2ZpbGVcIiksIHtcbiAqICAgZnNSb290OiBcInB1YmxpY1wiLFxuICogICB1cmxSb290OiBcInN0YXRpY1wiLFxuICogfSk7XG4gKiBgYGBcbiAqXG4gKiBUaGUgYWJvdmUgZXhhbXBsZSBzZXJ2ZXMgYC4vcHVibGljL3BhdGgvdG8vZmlsZWAgZm9yIHRoZSByZXF1ZXN0IHRvIGAvc3RhdGljL3BhdGgvdG8vZmlsZWAuXG4gKlxuICogQHBhcmFtIHJlcSBUaGUgcmVxdWVzdCB0byBoYW5kbGVcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNlcnZlRGlyKHJlcTogUmVxdWVzdCwgb3B0czogU2VydmVEaXJPcHRpb25zID0ge30pIHtcbiAgbGV0IHJlc3BvbnNlOiBSZXNwb25zZSB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgY29uc3QgdGFyZ2V0ID0gb3B0cy5mc1Jvb3QgfHwgXCIuXCI7XG4gIGNvbnN0IHVybFJvb3QgPSBvcHRzLnVybFJvb3Q7XG4gIGNvbnN0IHNob3dJbmRleCA9IG9wdHMuc2hvd0luZGV4ID8/IHRydWU7XG5cbiAgdHJ5IHtcbiAgICBsZXQgbm9ybWFsaXplZFBhdGggPSBub3JtYWxpemVVUkwocmVxLnVybCk7XG4gICAgaWYgKHVybFJvb3QpIHtcbiAgICAgIGlmIChub3JtYWxpemVkUGF0aC5zdGFydHNXaXRoKFwiL1wiICsgdXJsUm9vdCkpIHtcbiAgICAgICAgbm9ybWFsaXplZFBhdGggPSBub3JtYWxpemVkUGF0aC5yZXBsYWNlKHVybFJvb3QsIFwiXCIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IERlbm8uZXJyb3JzLk5vdEZvdW5kKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgZnNQYXRoID0gcG9zaXguam9pbih0YXJnZXQsIG5vcm1hbGl6ZWRQYXRoKTtcbiAgICBjb25zdCBmaWxlSW5mbyA9IGF3YWl0IERlbm8uc3RhdChmc1BhdGgpO1xuXG4gICAgaWYgKGZpbGVJbmZvLmlzRGlyZWN0b3J5KSB7XG4gICAgICBpZiAoc2hvd0luZGV4KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgcGF0aCA9IHBvc2l4LmpvaW4oZnNQYXRoLCBcImluZGV4Lmh0bWxcIik7XG4gICAgICAgICAgY29uc3QgaW5kZXhGaWxlSW5mbyA9IGF3YWl0IERlbm8ubHN0YXQocGF0aCk7XG4gICAgICAgICAgaWYgKGluZGV4RmlsZUluZm8uaXNGaWxlKSB7XG4gICAgICAgICAgICByZXNwb25zZSA9IGF3YWl0IHNlcnZlRmlsZShyZXEsIHBhdGgsIHtcbiAgICAgICAgICAgICAgZXRhZ0FsZ29yaXRobTogb3B0cy5ldGFnQWxnb3JpdGhtLFxuICAgICAgICAgICAgICBmaWxlSW5mbzogaW5kZXhGaWxlSW5mbyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIGlmICghKGUgaW5zdGFuY2VvZiBEZW5vLmVycm9ycy5Ob3RGb3VuZCkpIHtcbiAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIHBhc3NcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKCFyZXNwb25zZSAmJiBvcHRzLnNob3dEaXJMaXN0aW5nKSB7XG4gICAgICAgIHJlc3BvbnNlID0gYXdhaXQgc2VydmVEaXJJbmRleChmc1BhdGgsIHtcbiAgICAgICAgICBkb3RmaWxlczogb3B0cy5zaG93RG90ZmlsZXMgfHwgZmFsc2UsXG4gICAgICAgICAgdGFyZ2V0LFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGlmICghcmVzcG9uc2UpIHtcbiAgICAgICAgdGhyb3cgbmV3IERlbm8uZXJyb3JzLk5vdEZvdW5kKCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3BvbnNlID0gYXdhaXQgc2VydmVGaWxlKHJlcSwgZnNQYXRoLCB7XG4gICAgICAgIGV0YWdBbGdvcml0aG06IG9wdHMuZXRhZ0FsZ29yaXRobSxcbiAgICAgICAgZmlsZUluZm8sXG4gICAgICB9KTtcbiAgICB9XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBjb25zdCBlcnIgPSBlIGluc3RhbmNlb2YgRXJyb3IgPyBlIDogbmV3IEVycm9yKFwiW25vbi1lcnJvciB0aHJvd25dXCIpO1xuICAgIGlmICghb3B0cy5xdWlldCkgY29uc29sZS5lcnJvcihyZWQoZXJyLm1lc3NhZ2UpKTtcbiAgICByZXNwb25zZSA9IGF3YWl0IHNlcnZlRmFsbGJhY2socmVxLCBlcnIpO1xuICB9XG5cbiAgaWYgKG9wdHMuZW5hYmxlQ29ycykge1xuICAgIGFzc2VydChyZXNwb25zZSk7XG4gICAgcmVzcG9uc2UuaGVhZGVycy5hcHBlbmQoXCJhY2Nlc3MtY29udHJvbC1hbGxvdy1vcmlnaW5cIiwgXCIqXCIpO1xuICAgIHJlc3BvbnNlLmhlYWRlcnMuYXBwZW5kKFxuICAgICAgXCJhY2Nlc3MtY29udHJvbC1hbGxvdy1oZWFkZXJzXCIsXG4gICAgICBcIk9yaWdpbiwgWC1SZXF1ZXN0ZWQtV2l0aCwgQ29udGVudC1UeXBlLCBBY2NlcHQsIFJhbmdlXCIsXG4gICAgKTtcbiAgfVxuXG4gIGlmICghb3B0cy5xdWlldCkgc2VydmVyTG9nKHJlcSwgcmVzcG9uc2UhLnN0YXR1cyk7XG5cbiAgaWYgKG9wdHMuaGVhZGVycykge1xuICAgIGZvciAoY29uc3QgaGVhZGVyIG9mIG9wdHMuaGVhZGVycykge1xuICAgICAgY29uc3QgaGVhZGVyU3BsaXQgPSBoZWFkZXIuc3BsaXQoXCI6XCIpO1xuICAgICAgY29uc3QgbmFtZSA9IGhlYWRlclNwbGl0WzBdO1xuICAgICAgY29uc3QgdmFsdWUgPSBoZWFkZXJTcGxpdC5zbGljZSgxKS5qb2luKFwiOlwiKTtcbiAgICAgIHJlc3BvbnNlLmhlYWRlcnMuYXBwZW5kKG5hbWUsIHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzcG9uc2UhO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVVUkwodXJsOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcG9zaXgubm9ybWFsaXplKGRlY29kZVVSSUNvbXBvbmVudChuZXcgVVJMKHVybCkucGF0aG5hbWUpKTtcbn1cblxuZnVuY3Rpb24gbWFpbigpIHtcbiAgY29uc3Qgc2VydmVyQXJncyA9IHBhcnNlKERlbm8uYXJncywge1xuICAgIHN0cmluZzogW1wicG9ydFwiLCBcImhvc3RcIiwgXCJjZXJ0XCIsIFwia2V5XCIsIFwiaGVhZGVyXCJdLFxuICAgIGJvb2xlYW46IFtcImhlbHBcIiwgXCJkaXItbGlzdGluZ1wiLCBcImRvdGZpbGVzXCIsIFwiY29yc1wiLCBcInZlcmJvc2VcIiwgXCJ2ZXJzaW9uXCJdLFxuICAgIG5lZ2F0YWJsZTogW1wiZGlyLWxpc3RpbmdcIiwgXCJkb3RmaWxlc1wiLCBcImNvcnNcIl0sXG4gICAgY29sbGVjdDogW1wiaGVhZGVyXCJdLFxuICAgIGRlZmF1bHQ6IHtcbiAgICAgIFwiZGlyLWxpc3RpbmdcIjogdHJ1ZSxcbiAgICAgIGRvdGZpbGVzOiB0cnVlLFxuICAgICAgY29yczogdHJ1ZSxcbiAgICAgIHZlcmJvc2U6IGZhbHNlLFxuICAgICAgdmVyc2lvbjogZmFsc2UsXG4gICAgICBob3N0OiBcIjAuMC4wLjBcIixcbiAgICAgIHBvcnQ6IFwiNDUwN1wiLFxuICAgICAgY2VydDogXCJcIixcbiAgICAgIGtleTogXCJcIixcbiAgICB9LFxuICAgIGFsaWFzOiB7XG4gICAgICBwOiBcInBvcnRcIixcbiAgICAgIGM6IFwiY2VydFwiLFxuICAgICAgazogXCJrZXlcIixcbiAgICAgIGg6IFwiaGVscFwiLFxuICAgICAgdjogXCJ2ZXJib3NlXCIsXG4gICAgICBWOiBcInZlcnNpb25cIixcbiAgICAgIEg6IFwiaGVhZGVyXCIsXG4gICAgfSxcbiAgfSk7XG4gIGNvbnN0IHBvcnQgPSBOdW1iZXIoc2VydmVyQXJncy5wb3J0KTtcbiAgY29uc3QgaGVhZGVycyA9IHNlcnZlckFyZ3MuaGVhZGVyIHx8IFtdO1xuICBjb25zdCBob3N0ID0gc2VydmVyQXJncy5ob3N0O1xuICBjb25zdCBjZXJ0RmlsZSA9IHNlcnZlckFyZ3MuY2VydDtcbiAgY29uc3Qga2V5RmlsZSA9IHNlcnZlckFyZ3Mua2V5O1xuXG4gIGlmIChzZXJ2ZXJBcmdzLmhlbHApIHtcbiAgICBwcmludFVzYWdlKCk7XG4gICAgRGVuby5leGl0KCk7XG4gIH1cblxuICBpZiAoc2VydmVyQXJncy52ZXJzaW9uKSB7XG4gICAgY29uc29sZS5sb2coYERlbm8gRmlsZSBTZXJ2ZXIgJHtWRVJTSU9OfWApO1xuICAgIERlbm8uZXhpdCgpO1xuICB9XG5cbiAgaWYgKGtleUZpbGUgfHwgY2VydEZpbGUpIHtcbiAgICBpZiAoa2V5RmlsZSA9PT0gXCJcIiB8fCBjZXJ0RmlsZSA9PT0gXCJcIikge1xuICAgICAgY29uc29sZS5sb2coXCItLWtleSBhbmQgLS1jZXJ0IGFyZSByZXF1aXJlZCBmb3IgVExTXCIpO1xuICAgICAgcHJpbnRVc2FnZSgpO1xuICAgICAgRGVuby5leGl0KDEpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHdpbGQgPSBzZXJ2ZXJBcmdzLl8gYXMgc3RyaW5nW107XG4gIGNvbnN0IHRhcmdldCA9IHBvc2l4LnJlc29sdmUod2lsZFswXSA/PyBcIlwiKTtcblxuICBjb25zdCBoYW5kbGVyID0gKHJlcTogUmVxdWVzdCk6IFByb21pc2U8UmVzcG9uc2U+ID0+IHtcbiAgICByZXR1cm4gc2VydmVEaXIocmVxLCB7XG4gICAgICBmc1Jvb3Q6IHRhcmdldCxcbiAgICAgIHNob3dEaXJMaXN0aW5nOiBzZXJ2ZXJBcmdzW1wiZGlyLWxpc3RpbmdcIl0sXG4gICAgICBzaG93RG90ZmlsZXM6IHNlcnZlckFyZ3MuZG90ZmlsZXMsXG4gICAgICBlbmFibGVDb3JzOiBzZXJ2ZXJBcmdzLmNvcnMsXG4gICAgICBxdWlldDogIXNlcnZlckFyZ3MudmVyYm9zZSxcbiAgICAgIGhlYWRlcnMsXG4gICAgfSk7XG4gIH07XG5cbiAgY29uc3QgdXNlVGxzID0gISEoa2V5RmlsZSAmJiBjZXJ0RmlsZSk7XG5cbiAgaWYgKHVzZVRscykge1xuICAgIHNlcnZlVGxzKGhhbmRsZXIsIHtcbiAgICAgIHBvcnQsXG4gICAgICBob3N0bmFtZTogaG9zdCxcbiAgICAgIGNlcnRGaWxlLFxuICAgICAga2V5RmlsZSxcbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICBzZXJ2ZShoYW5kbGVyLCB7IHBvcnQsIGhvc3RuYW1lOiBob3N0IH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIHByaW50VXNhZ2UoKSB7XG4gIGNvbnNvbGUubG9nKGBEZW5vIEZpbGUgU2VydmVyICR7VkVSU0lPTn1cbiAgU2VydmVzIGEgbG9jYWwgZGlyZWN0b3J5IGluIEhUVFAuXG5cbklOU1RBTEw6XG4gIGRlbm8gaW5zdGFsbCAtLWFsbG93LW5ldCAtLWFsbG93LXJlYWQgaHR0cHM6Ly9kZW5vLmxhbmQvc3RkL2h0dHAvZmlsZV9zZXJ2ZXIudHNcblxuVVNBR0U6XG4gIGZpbGVfc2VydmVyIFtwYXRoXSBbb3B0aW9uc11cblxuT1BUSU9OUzpcbiAgLWgsIC0taGVscCAgICAgICAgICAgIFByaW50cyBoZWxwIGluZm9ybWF0aW9uXG4gIC1wLCAtLXBvcnQgPFBPUlQ+ICAgICBTZXQgcG9ydFxuICAtLWNvcnMgICAgICAgICAgICAgICAgRW5hYmxlIENPUlMgdmlhIHRoZSBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiIGhlYWRlclxuICAtLWhvc3QgICAgIDxIT1NUPiAgICAgSG9zdG5hbWUgKGRlZmF1bHQgaXMgMC4wLjAuMClcbiAgLWMsIC0tY2VydCA8RklMRT4gICAgIFRMUyBjZXJ0aWZpY2F0ZSBmaWxlIChlbmFibGVzIFRMUylcbiAgLWssIC0ta2V5ICA8RklMRT4gICAgIFRMUyBrZXkgZmlsZSAoZW5hYmxlcyBUTFMpXG4gIC1ILCAtLWhlYWRlciA8SEVBREVSPiBTZXRzIGEgaGVhZGVyIG9uIGV2ZXJ5IHJlcXVlc3QuXG4gICAgICAgICAgICAgICAgICAgICAgICAoZS5nLiAtLWhlYWRlciBcIkNhY2hlLUNvbnRyb2w6IG5vLWNhY2hlXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICBUaGlzIG9wdGlvbiBjYW4gYmUgc3BlY2lmaWVkIG11bHRpcGxlIHRpbWVzLlxuICAtLW5vLWRpci1saXN0aW5nICAgICAgRGlzYWJsZSBkaXJlY3RvcnkgbGlzdGluZ1xuICAtLW5vLWRvdGZpbGVzICAgICAgICAgRG8gbm90IHNob3cgZG90ZmlsZXNcbiAgLS1uby1jb3JzICAgICAgICAgICAgIERpc2FibGUgY3Jvc3Mtb3JpZ2luIHJlc291cmNlIHNoYXJpbmdcbiAgLXYsIC0tdmVyYm9zZSAgICAgICAgIFByaW50IHJlcXVlc3QgbGV2ZWwgbG9nc1xuICAtViwgLS12ZXJzaW9uICAgICAgICAgUHJpbnQgdmVyc2lvbiBpbmZvcm1hdGlvblxuXG4gIEFsbCBUTFMgb3B0aW9ucyBhcmUgcmVxdWlyZWQgd2hlbiBvbmUgaXMgcHJvdmlkZWQuYCk7XG59XG5cbmlmIChpbXBvcnQubWV0YS5tYWluKSB7XG4gIG1haW4oKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBLDBFQUEwRTtBQUUxRSxnRUFBZ0U7QUFDaEUsMkNBQTJDO0FBQzNDLGdGQUFnRjtBQUVoRixTQUFTLE9BQU8sRUFBRSxLQUFLLFFBQVEsaUJBQWlCO0FBQ2hELFNBQVMsV0FBVyxRQUFRLGlDQUFpQztBQUM3RCxTQUFTLEtBQUssRUFBRSxRQUFRLFFBQVEsY0FBYztBQUM5QyxTQUFTLE1BQU0sUUFBUSxtQkFBbUI7QUFDMUMsU0FBUyxLQUFLLFFBQVEsa0JBQWtCO0FBQ3hDLFNBQVMsTUFBTSxRQUFRLHNCQUFzQjtBQUM3QyxTQUFTLEdBQUcsUUFBUSxtQkFBbUI7QUFDdkMsU0FBUyxXQUFXLEVBQUUsb0JBQW9CLFFBQVEsWUFBWTtBQUU5RCxTQUFTLFlBQVksUUFBUSw4QkFBOEI7QUFDM0QsU0FBUyxVQUFVLFFBQVEscUJBQXFCO0FBQ2hELFNBQVMsT0FBTyxRQUFRLGdCQUFnQjtBQVF4QyxNQUFNLFVBQVUsSUFBSTtBQUVwQixTQUFTLGFBQWEsS0FBYyxFQUFFLFNBQXdCLEVBQVU7SUFDdEUsTUFBTSxVQUFVO1FBQUM7UUFBTztRQUFPO1FBQU87UUFBTztRQUFPO1FBQU87UUFBTztLQUFNO0lBRXhFLElBQUksY0FBYyxJQUFJLEVBQUU7UUFDdEIsT0FBTztJQUNULENBQUM7SUFDRCxNQUFNLE9BQU8sVUFBVSxRQUFRLENBQUM7SUFD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