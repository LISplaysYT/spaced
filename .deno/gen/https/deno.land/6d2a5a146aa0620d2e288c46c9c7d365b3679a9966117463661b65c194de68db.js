// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
/**
 * Load environment variables from `.env` files.
 * Inspired by the node module [`dotenv`](https://github.com/motdotla/dotenv) and
 * [`dotenv-expand`](https://github.com/motdotla/dotenv-expand).
 *
 * ```sh
 * # .env
 * GREETING=hello world
 * ```
 *
 * Then import the configuration using the `config` function.
 *
 * ```ts
 * // app.ts
 * import { config } from "https://deno.land/std@$STD_VERSION/dotenv/mod.ts";
 *
 * console.log(await config());
 * ```
 *
 * Then run your app.
 *
 * ```sh
 * > deno run --allow-env --allow-read app.ts
 * { GREETING: "hello world" }
 * ```
 *
 * ## Auto loading
 *
 * `load.ts` automatically loads the local `.env` file on import and exports it to
 * the process environment:
 *
 * ```sh
 * # .env
 * GREETING=hello world
 * ```
 *
 * ```ts
 * // app.ts
 * import "https://deno.land/std@$STD_VERSION/dotenv/load.ts";
 *
 * console.log(Deno.env.get("GREETING"));
 * ```
 *
 * ```sh
 * > deno run --allow-env --allow-read app.ts
 * hello world
 * ```
 *
 * ## Parsing Rules
 *
 * The parsing engine currently supports the following rules:
 *
 * - Variables that already exist in the environment are not overridden with
 *   `export: true`
 * - `BASIC=basic` becomes `{ BASIC: "basic" }`
 * - empty lines are skipped
 * - lines beginning with `#` are treated as comments
 * - empty values become empty strings (`EMPTY=` becomes `{ EMPTY: "" }`)
 * - single and double quoted values are escaped (`SINGLE_QUOTE='quoted'` becomes
 *   `{ SINGLE_QUOTE: "quoted" }`)
 * - new lines are expanded in double quoted values (`MULTILINE="new\nline"`
 *   becomes
 *
 * ```
 * { MULTILINE: "new\nline" }
 * ```
 *
 * - inner quotes are maintained (think JSON) (`JSON={"foo": "bar"}` becomes
 *   `{ JSON: "{\"foo\": \"bar\"}" }`)
 * - whitespace is removed from both ends of unquoted values (see more on
 *   [`trim`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim))
 *   (`FOO= some value` becomes `{ FOO: "some value" }`)
 * - whitespace is preserved on both ends of quoted values (`FOO=" some value "`
 *   becomes `{ FOO: " some value " }`)
 * - dollar sign with an environment key in or without curly braces in unquoted
 *   values will expand the environment key (`KEY=$KEY` or `KEY=${KEY}` becomes
 *   `{ KEY: "<KEY_VALUE_FROM_ENV>" }`)
 * - escaped dollar sign with an environment key in unquoted values will escape the
 *   environment key rather than expand (`KEY=\$KEY` becomes `{ KEY: "\\$KEY" }`)
 * - colon and a minus sign with a default value(which can also be another expand
 *   value) in expanding construction in unquoted values will first attempt to
 *   expand the environment key. If it’s not found, then it will return the default
 *   value (`KEY=${KEY:-default}` If KEY exists it becomes
 *   `{ KEY: "<KEY_VALUE_FROM_ENV>" }` If not, then it becomes
 *   `{ KEY: "default" }`. Also there is possible to do this case
 *   `KEY=${NO_SUCH_KEY:-${EXISTING_KEY:-default}}` which becomes
 *   `{ KEY: "<EXISTING_KEY_VALUE_FROM_ENV>" }`)
 *
 * @module
 */ import { filterValues } from "../collections/filter_values.ts";
import { withoutAll } from "../collections/without_all.ts";
const RE_KeyValue = /^\s*(?:export\s+)?(?<key>[a-zA-Z_]+[a-zA-Z0-9_]*?)\s*=[\ \t]*('\n?(?<notInterpolated>(.|\n)*?)\n?'|"\n?(?<interpolated>(.|\n)*?)\n?"|(?<unquoted>[^\n#]*)) *#*.*$/gm;
const RE_ExpandValue = /(\${(?<inBrackets>.+?)(\:-(?<inBracketsDefault>.+))?}|(?<!\\)\$(?<notInBrackets>\w+)(\:-(?<notInBracketsDefault>.+))?)/g;
export function parse(rawDotenv, restrictEnvAccessTo = []) {
    const env = {};
    let match;
    const keysForExpandCheck = [];
    while((match = RE_KeyValue.exec(rawDotenv)) != null){
        const { key , interpolated , notInterpolated , unquoted  } = match?.groups;
        if (unquoted) {
            keysForExpandCheck.push(key);
        }
        env[key] = typeof notInterpolated === "string" ? notInterpolated : typeof interpolated === "string" ? expandCharacters(interpolated) : unquoted.trim();
    }
    //https://github.com/motdotla/dotenv-expand/blob/ed5fea5bf517a09fd743ce2c63150e88c8a5f6d1/lib/main.js#L23
    const variablesMap = {
        ...env,
        ...readEnv(restrictEnvAccessTo)
    };
    keysForExpandCheck.forEach((key)=>{
        env[key] = expand(env[key], variablesMap);
    });
    return env;
}
export function configSync(options = {}) {
    const r = {
        restrictEnvAccessTo: options.restrictEnvAccessTo
    };
    return loadSync({
        ...r,
        envPath: options.path,
        examplePath: options.safe ? options.example : undefined,
        defaultsPath: options.defaults,
        export: options.export,
        allowEmptyValues: options.allowEmptyValues
    });
}
export function loadSync({ envPath =".env" , examplePath =".env.example" , defaultsPath =".env.defaults" , export: _export = false , allowEmptyValues =false , restrictEnvAccessTo =[]  } = {}) {
    const conf = parseFileSync(envPath, restrictEnvAccessTo);
    if (defaultsPath) {
        const confDefaults = parseFileSync(defaultsPath, restrictEnvAccessTo);
        for(const key in confDefaults){
            if (!(key in conf)) {
                conf[key] = confDefaults[key];
            }
        }
    }
    if (examplePath) {
        const confExample = parseFileSync(examplePath, restrictEnvAccessTo);
        assertSafe(conf, confExample, allowEmptyValues, restrictEnvAccessTo);
    }
    if (_export) {
        for(const key1 in conf){
            if (Deno.env.get(key1) !== undefined) continue;
            Deno.env.set(key1, conf[key1]);
        }
    }
    return conf;
}
export async function config(options = {}) {
    const r = {
        restrictEnvAccessTo: options.restrictEnvAccessTo
    };
    return await load({
        ...r,
        envPath: options.path,
        examplePath: options.safe ? options.example : undefined,
        defaultsPath: options.defaults,
        export: options.export,
        allowEmptyValues: options.allowEmptyValues
    });
}
export async function load({ envPath =".env" , examplePath =".env.example" , defaultsPath =".env.defaults" , export: _export = false , allowEmptyValues =false , restrictEnvAccessTo =[]  } = {}) {
    const conf = await parseFile(envPath, restrictEnvAccessTo);
    if (defaultsPath) {
        const confDefaults = await parseFile(defaultsPath, restrictEnvAccessTo);
        for(const key in confDefaults){
            if (!(key in conf)) {
                conf[key] = confDefaults[key];
            }
        }
    }
    if (examplePath) {
        const confExample = await parseFile(examplePath, restrictEnvAccessTo);
        assertSafe(conf, confExample, allowEmptyValues, restrictEnvAccessTo);
    }
    if (_export) {
        for(const key1 in conf){
            if (Deno.env.get(key1) !== undefined) continue;
            Deno.env.set(key1, conf[key1]);
        }
    }
    return conf;
}
function parseFileSync(filepath, restrictEnvAccessTo = []) {
    try {
        return parse(Deno.readTextFileSync(filepath), restrictEnvAccessTo);
    } catch (e) {
        if (e instanceof Deno.errors.NotFound) return {};
        throw e;
    }
}
async function parseFile(filepath, restrictEnvAccessTo = []) {
    try {
        return parse(await Deno.readTextFile(filepath), restrictEnvAccessTo);
    } catch (e) {
        if (e instanceof Deno.errors.NotFound) return {};
        throw e;
    }
}
function expandCharacters(str) {
    const charactersMap = {
        "\\n": "\n",
        "\\r": "\r",
        "\\t": "\t"
    };
    return str.replace(/\\([nrt])/g, ($1)=>charactersMap[$1]);
}
function assertSafe(conf, confExample, allowEmptyValues, restrictEnvAccessTo = []) {
    const currentEnv = readEnv(restrictEnvAccessTo);
    // Not all the variables have to be defined in .env, they can be supplied externally
    const confWithEnv = Object.assign({}, currentEnv, conf);
    const missing = withoutAll(Object.keys(confExample), // If allowEmptyValues is false, filter out empty values from configuration
    Object.keys(allowEmptyValues ? confWithEnv : filterValues(confWithEnv, Boolean)));
    if (missing.length > 0) {
        const errorMessages = [
            `The following variables were defined in the example file but are not present in the environment:\n  ${missing.join(", ")}`,
            `Make sure to add them to your env file.`,
            !allowEmptyValues && `If you expect any of these variables to be empty, you can set the allowEmptyValues option to true.`
        ];
        throw new MissingEnvVarsError(errorMessages.filter(Boolean).join("\n\n"), missing);
    }
}
// a guarded env access, that reads only a subset from the Deno.env object,
// if `restrictEnvAccessTo` property is passed.
function readEnv(restrictEnvAccessTo) {
    if (restrictEnvAccessTo && Array.isArray(restrictEnvAccessTo) && restrictEnvAccessTo.length > 0) {
        return restrictEnvAccessTo.reduce((accessedEnvVars, envVarName)=>{
            if (Deno.env.get(envVarName)) {
                accessedEnvVars[envVarName] = Deno.env.get(envVarName);
            }
            return accessedEnvVars;
        }, {});
    }
    return Deno.env.toObject();
}
export class MissingEnvVarsError extends Error {
    missing;
    constructor(message, missing){
        super(message);
        this.name = "MissingEnvVarsError";
        this.missing = missing;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
function expand(str, variablesMap) {
    if (RE_ExpandValue.test(str)) {
        return expand(str.replace(RE_ExpandValue, function(...params) {
            const { inBrackets , inBracketsDefault , notInBrackets , notInBracketsDefault  } = params[params.length - 1];
            const expandValue = inBrackets || notInBrackets;
            const defaultValue = inBracketsDefault || notInBracketsDefault;
            return variablesMap[expandValue] || expand(defaultValue, variablesMap);
        }), variablesMap);
    } else {
        return str;
    }
}
/**
 * @example
 * ```ts
 * import { stringify } from "https://deno.land/std@$STD_VERSION/dotenv/mod.ts";
 *
 * const object = { GREETING: "hello world" };
 * const string = stringify(object); // GREETING='hello world'
 * ```
 *
 * @param object object to be stringified
 * @returns string of object
 */ export function stringify(object) {
    const lines = [];
    for (const [key, value] of Object.entries(object)){
        let quote;
        let escapedValue = value ?? "";
        if (key.startsWith("#")) {
            console.warn(`key starts with a '#' indicates a comment and is ignored: '${key}'`);
            continue;
        } else if (escapedValue.includes("\n")) {
            // escape inner new lines
            escapedValue = escapedValue.replaceAll("\n", "\\n");
            quote = `"`;
        } else if (escapedValue.match(/\W/)) {
            quote = "'";
        }
        if (quote) {
            // escape inner quotes
            escapedValue = escapedValue.replaceAll(quote, `\\${quote}`);
            escapedValue = `${quote}${escapedValue}${quote}`;
        }
        const line = `${key}=${escapedValue}`;
        lines.push(line);
    }
    return lines.join("\n");
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE3My4wL2RvdGVudi9tb2QudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMyB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8qKlxuICogTG9hZCBlbnZpcm9ubWVudCB2YXJpYWJsZXMgZnJvbSBgLmVudmAgZmlsZXMuXG4gKiBJbnNwaXJlZCBieSB0aGUgbm9kZSBtb2R1bGUgW2Bkb3RlbnZgXShodHRwczovL2dpdGh1Yi5jb20vbW90ZG90bGEvZG90ZW52KSBhbmRcbiAqIFtgZG90ZW52LWV4cGFuZGBdKGh0dHBzOi8vZ2l0aHViLmNvbS9tb3Rkb3RsYS9kb3RlbnYtZXhwYW5kKS5cbiAqXG4gKiBgYGBzaFxuICogIyAuZW52XG4gKiBHUkVFVElORz1oZWxsbyB3b3JsZFxuICogYGBgXG4gKlxuICogVGhlbiBpbXBvcnQgdGhlIGNvbmZpZ3VyYXRpb24gdXNpbmcgdGhlIGBjb25maWdgIGZ1bmN0aW9uLlxuICpcbiAqIGBgYHRzXG4gKiAvLyBhcHAudHNcbiAqIGltcG9ydCB7IGNvbmZpZyB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2RvdGVudi9tb2QudHNcIjtcbiAqXG4gKiBjb25zb2xlLmxvZyhhd2FpdCBjb25maWcoKSk7XG4gKiBgYGBcbiAqXG4gKiBUaGVuIHJ1biB5b3VyIGFwcC5cbiAqXG4gKiBgYGBzaFxuICogPiBkZW5vIHJ1biAtLWFsbG93LWVudiAtLWFsbG93LXJlYWQgYXBwLnRzXG4gKiB7IEdSRUVUSU5HOiBcImhlbGxvIHdvcmxkXCIgfVxuICogYGBgXG4gKlxuICogIyMgQXV0byBsb2FkaW5nXG4gKlxuICogYGxvYWQudHNgIGF1dG9tYXRpY2FsbHkgbG9hZHMgdGhlIGxvY2FsIGAuZW52YCBmaWxlIG9uIGltcG9ydCBhbmQgZXhwb3J0cyBpdCB0b1xuICogdGhlIHByb2Nlc3MgZW52aXJvbm1lbnQ6XG4gKlxuICogYGBgc2hcbiAqICMgLmVudlxuICogR1JFRVRJTkc9aGVsbG8gd29ybGRcbiAqIGBgYFxuICpcbiAqIGBgYHRzXG4gKiAvLyBhcHAudHNcbiAqIGltcG9ydCBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vZG90ZW52L2xvYWQudHNcIjtcbiAqXG4gKiBjb25zb2xlLmxvZyhEZW5vLmVudi5nZXQoXCJHUkVFVElOR1wiKSk7XG4gKiBgYGBcbiAqXG4gKiBgYGBzaFxuICogPiBkZW5vIHJ1biAtLWFsbG93LWVudiAtLWFsbG93LXJlYWQgYXBwLnRzXG4gKiBoZWxsbyB3b3JsZFxuICogYGBgXG4gKlxuICogIyMgUGFyc2luZyBSdWxlc1xuICpcbiAqIFRoZSBwYXJzaW5nIGVuZ2luZSBjdXJyZW50bHkgc3VwcG9ydHMgdGhlIGZvbGxvd2luZyBydWxlczpcbiAqXG4gKiAtIFZhcmlhYmxlcyB0aGF0IGFscmVhZHkgZXhpc3QgaW4gdGhlIGVudmlyb25tZW50IGFyZSBub3Qgb3ZlcnJpZGRlbiB3aXRoXG4gKiAgIGBleHBvcnQ6IHRydWVgXG4gKiAtIGBCQVNJQz1iYXNpY2AgYmVjb21lcyBgeyBCQVNJQzogXCJiYXNpY1wiIH1gXG4gKiAtIGVtcHR5IGxpbmVzIGFyZSBza2lwcGVkXG4gKiAtIGxpbmVzIGJlZ2lubmluZyB3aXRoIGAjYCBhcmUgdHJlYXRlZCBhcyBjb21tZW50c1xuICogLSBlbXB0eSB2YWx1ZXMgYmVjb21lIGVtcHR5IHN0cmluZ3MgKGBFTVBUWT1gIGJlY29tZXMgYHsgRU1QVFk6IFwiXCIgfWApXG4gKiAtIHNpbmdsZSBhbmQgZG91YmxlIHF1b3RlZCB2YWx1ZXMgYXJlIGVzY2FwZWQgKGBTSU5HTEVfUVVPVEU9J3F1b3RlZCdgIGJlY29tZXNcbiAqICAgYHsgU0lOR0xFX1FVT1RFOiBcInF1b3RlZFwiIH1gKVxuICogLSBuZXcgbGluZXMgYXJlIGV4cGFuZGVkIGluIGRvdWJsZSBxdW90ZWQgdmFsdWVzIChgTVVMVElMSU5FPVwibmV3XFxubGluZVwiYFxuICogICBiZWNvbWVzXG4gKlxuICogYGBgXG4gKiB7IE1VTFRJTElORTogXCJuZXdcXG5saW5lXCIgfVxuICogYGBgXG4gKlxuICogLSBpbm5lciBxdW90ZXMgYXJlIG1haW50YWluZWQgKHRoaW5rIEpTT04pIChgSlNPTj17XCJmb29cIjogXCJiYXJcIn1gIGJlY29tZXNcbiAqICAgYHsgSlNPTjogXCJ7XFxcImZvb1xcXCI6IFxcXCJiYXJcXFwifVwiIH1gKVxuICogLSB3aGl0ZXNwYWNlIGlzIHJlbW92ZWQgZnJvbSBib3RoIGVuZHMgb2YgdW5xdW90ZWQgdmFsdWVzIChzZWUgbW9yZSBvblxuICogICBbYHRyaW1gXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9TdHJpbmcvVHJpbSkpXG4gKiAgIChgRk9PPSBzb21lIHZhbHVlYCBiZWNvbWVzIGB7IEZPTzogXCJzb21lIHZhbHVlXCIgfWApXG4gKiAtIHdoaXRlc3BhY2UgaXMgcHJlc2VydmVkIG9uIGJvdGggZW5kcyBvZiBxdW90ZWQgdmFsdWVzIChgRk9PPVwiIHNvbWUgdmFsdWUgXCJgXG4gKiAgIGJlY29tZXMgYHsgRk9POiBcIiBzb21lIHZhbHVlIFwiIH1gKVxuICogLSBkb2xsYXIgc2lnbiB3aXRoIGFuIGVudmlyb25tZW50IGtleSBpbiBvciB3aXRob3V0IGN1cmx5IGJyYWNlcyBpbiB1bnF1b3RlZFxuICogICB2YWx1ZXMgd2lsbCBleHBhbmQgdGhlIGVudmlyb25tZW50IGtleSAoYEtFWT0kS0VZYCBvciBgS0VZPSR7S0VZfWAgYmVjb21lc1xuICogICBgeyBLRVk6IFwiPEtFWV9WQUxVRV9GUk9NX0VOVj5cIiB9YClcbiAqIC0gZXNjYXBlZCBkb2xsYXIgc2lnbiB3aXRoIGFuIGVudmlyb25tZW50IGtleSBpbiB1bnF1b3RlZCB2YWx1ZXMgd2lsbCBlc2NhcGUgdGhlXG4gKiAgIGVudmlyb25tZW50IGtleSByYXRoZXIgdGhhbiBleHBhbmQgKGBLRVk9XFwkS0VZYCBiZWNvbWVzIGB7IEtFWTogXCJcXFxcJEtFWVwiIH1gKVxuICogLSBjb2xvbiBhbmQgYSBtaW51cyBzaWduIHdpdGggYSBkZWZhdWx0IHZhbHVlKHdoaWNoIGNhbiBhbHNvIGJlIGFub3RoZXIgZXhwYW5kXG4gKiAgIHZhbHVlKSBpbiBleHBhbmRpbmcgY29uc3RydWN0aW9uIGluIHVucXVvdGVkIHZhbHVlcyB3aWxsIGZpcnN0IGF0dGVtcHQgdG9cbiAqICAgZXhwYW5kIHRoZSBlbnZpcm9ubWVudCBrZXkuIElmIGl04oCZcyBub3QgZm91bmQsIHRoZW4gaXQgd2lsbCByZXR1cm4gdGhlIGRlZmF1bHRcbiAqICAgdmFsdWUgKGBLRVk9JHtLRVk6LWRlZmF1bHR9YCBJZiBLRVkgZXhpc3RzIGl0IGJlY29tZXNcbiAqICAgYHsgS0VZOiBcIjxLRVlfVkFMVUVfRlJPTV9FTlY+XCIgfWAgSWYgbm90LCB0aGVuIGl0IGJlY29tZXNcbiAqICAgYHsgS0VZOiBcImRlZmF1bHRcIiB9YC4gQWxzbyB0aGVyZSBpcyBwb3NzaWJsZSB0byBkbyB0aGlzIGNhc2VcbiAqICAgYEtFWT0ke05PX1NVQ0hfS0VZOi0ke0VYSVNUSU5HX0tFWTotZGVmYXVsdH19YCB3aGljaCBiZWNvbWVzXG4gKiAgIGB7IEtFWTogXCI8RVhJU1RJTkdfS0VZX1ZBTFVFX0ZST01fRU5WPlwiIH1gKVxuICpcbiAqIEBtb2R1bGVcbiAqL1xuXG5pbXBvcnQgeyBmaWx0ZXJWYWx1ZXMgfSBmcm9tIFwiLi4vY29sbGVjdGlvbnMvZmlsdGVyX3ZhbHVlcy50c1wiO1xuaW1wb3J0IHsgd2l0aG91dEFsbCB9IGZyb20gXCIuLi9jb2xsZWN0aW9ucy93aXRob3V0X2FsbC50c1wiO1xuXG4vKipcbiAqIEBkZXByZWNhdGVkICh3aWxsIGJlIHJlbW92ZWQgYWZ0ZXIgMC4xNzIuMCkuIFVzZSBgUmVjb3JkPHN0cmluZywgc3RyaW5nPmAgaW5zdGVhZFxuICovXG5leHBvcnQgaW50ZXJmYWNlIERvdGVudkNvbmZpZyB7XG4gIFtrZXk6IHN0cmluZ106IHN0cmluZztcbn1cblxudHlwZSBTdHJpY3REb3RlbnZDb25maWc8VCBleHRlbmRzIFJlYWRvbmx5QXJyYXk8c3RyaW5nPj4gPVxuICAmIHtcbiAgICBba2V5IGluIFRbbnVtYmVyXV06IHN0cmluZztcbiAgfVxuICAmIERvdGVudkNvbmZpZztcblxudHlwZSBTdHJpY3RFbnZWYXJMaXN0PFQgZXh0ZW5kcyBzdHJpbmc+ID1cbiAgfCBBcnJheTxFeHRyYWN0PFQsIHN0cmluZz4+XG4gIHwgUmVhZG9ubHlBcnJheTxFeHRyYWN0PFQsIHN0cmluZz4+O1xuXG50eXBlIFN0cmluZ0xpc3QgPSBBcnJheTxzdHJpbmc+IHwgUmVhZG9ubHlBcnJheTxzdHJpbmc+IHwgdW5kZWZpbmVkO1xuXG4vKipcbiAqIEBkZXByZWNhdGVkICh3aWxsIGJlIHJlbW92ZWQgYWZ0ZXIgMC4xNzIuMCkuIFVzZSBgTG9hZE9wdGlvbnNgIGluc3RlYWRcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBDb25maWdPcHRpb25zIHtcbiAgLyoqIE9wdGlvbmFsIHBhdGggdG8gYC5lbnZgIGZpbGUuXG4gICAqXG4gICAqIEBkZWZhdWx0IHtcIi4vLmVudlwifVxuICAgKi9cbiAgcGF0aD86IHN0cmluZztcbiAgLyoqXG4gICAqIFNldCB0byBgdHJ1ZWAgdG8gZXhwb3J0IGFsbCBgLmVudmAgdmFyaWFibGVzIHRvIHRoZSBjdXJyZW50IHByb2Nlc3Nlc1xuICAgKiBlbnZpcm9ubWVudC4gVmFyaWFibGVzIGFyZSB0aGVuIGFjY2Vzc2FibGUgdmlhIGBEZW5vLmVudi5nZXQoPGtleT4pYC5cbiAgICpcbiAgICogQGRlZmF1bHQge2ZhbHNlfVxuICAgKi9cbiAgZXhwb3J0PzogYm9vbGVhbjtcbiAgLyoqXG4gICAqIFNldCB0byBgdHJ1ZWAgdG8gZW5zdXJlIHRoYXQgYWxsIG5lY2Vzc2FyeSBlbnZpcm9ubWVudCB2YXJpYWJsZXMgYXJlXG4gICAqIGRlZmluZWQgYWZ0ZXIgcmVhZGluZyBmcm9tIGAuZW52YC4gSXQgd2lsbCByZWFkIHtAbGlua2NvZGUgZXhhbXBsZX0gdG8gZ2V0IHRoZVxuICAgKiBsaXN0IG9mIG5lZWRlZCB2YXJpYWJsZXMuXG4gICAqXG4gICAqIElmIGFueSBvZiB0aGUgZGVmaW5lZCB2YXJpYWJsZXMgaXMgbm90IGluIGAuZW52YCwgYW4gZXJyb3Igd2lsbCBvY2N1ci4gVGhpc1xuICAgKiBtZXRob2QgaXMgcHJlZmVycmVkIGJlY2F1c2UgaXQgcHJldmVudHMgcnVudGltZSBlcnJvcnMgaW4gYSBwcm9kdWN0aW9uXG4gICAqIGFwcGxpY2F0aW9uIGR1ZSB0byBpbXByb3BlciBjb25maWd1cmF0aW9uLlxuICAgKiBBbm90aGVyIHdheSB0byBzdXBwbHkgcmVxdWlyZWQgdmFyaWFibGVzIGlzIGV4dGVybmFsbHksIGxpa2Ugc286XG4gICAqXG4gICAqIGBgYHNoXG4gICAqIEdSRUVUSU5HPVwiaGVsbG8gd29ybGRcIiBkZW5vIHJ1biAtLWFsbG93LWVudiBhcHAudHNcbiAgICogYGBgXG4gICAqL1xuICBzYWZlPzogYm9vbGVhbjtcbiAgLyoqIE9wdGlvbmFsIHBhdGggdG8gYC5lbnYuZXhhbXBsZWAgZmlsZS5cbiAgICpcbiAgICogQGRlZmF1bHQge1wiLi8uZW52LmV4YW1wbGVcIn1cbiAgICovXG4gIGV4YW1wbGU/OiBzdHJpbmc7XG4gIC8qKlxuICAgKiBTZXQgdG8gYHRydWVgIHRvIGFsbG93IHJlcXVpcmVkIGVudiB2YXJpYWJsZXMgdG8gYmUgZW1wdHkuIE90aGVyd2lzZSwgaXRcbiAgICogd2lsbCB0aHJvdyBhbiBlcnJvciBpZiBhbnkgdmFyaWFibGUgaXMgZW1wdHkuXG4gICAqXG4gICAqIEBkZWZhdWx0IHtmYWxzZX1cbiAgICovXG4gIGFsbG93RW1wdHlWYWx1ZXM/OiBib29sZWFuO1xuICAvKipcbiAgICogUGF0aCB0byBgLmVudi5kZWZhdWx0c2AgZmlsZSB3aGljaCBpcyB1c2VkIHRvIGRlZmluZSBkZWZhdWx0IHZhbHVlcy5cbiAgICpcbiAgICogYGBgc2hcbiAgICogIyAuZW52LmRlZmF1bHRzXG4gICAqICMgV2lsbCBub3QgYmUgc2V0IGlmIEdSRUVUSU5HIGlzIHNldCBpbiBiYXNlIC5lbnYgZmlsZVxuICAgKiBHUkVFVElORz1cImEgc2VjcmV0IHRvIGV2ZXJ5Ym9keVwiXG4gICAqIGBgYFxuICAgKlxuICAgKiBAZGVmYXVsdCB7XCIuLy5lbnYuZGVmYXVsdHNcIn1cbiAgICovXG4gIGRlZmF1bHRzPzogc3RyaW5nO1xuICAvKipcbiAgICogTGlzdCBvZiBFbnYgdmFyaWFibGVzIHRvIHJlYWQgZnJvbSBwcm9jZXNzLiBCeSBkZWZhdWx0LCB0aGUgY29tcGxldGUgRW52IGlzXG4gICAqIGxvb2tlZCB1cC4gVGhpcyBhbGxvd3MgdG8gcGVybWl0IGFjY2VzcyB0byBvbmx5IHNwZWNpZmljIEVudiB2YXJpYWJsZXMgd2l0aFxuICAgKiBgLS1hbGxvdy1lbnY9RU5WX1ZBUl9OQU1FYC5cbiAgICovXG4gIHJlc3RyaWN0RW52QWNjZXNzVG8/OiBTdHJpbmdMaXN0O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIExvYWRPcHRpb25zIHtcbiAgLyoqIE9wdGlvbmFsIHBhdGggdG8gYC5lbnZgIGZpbGUuXG4gICAqXG4gICAqIEBkZWZhdWx0IHtcIi4vLmVudlwifVxuICAgKi9cbiAgZW52UGF0aD86IHN0cmluZztcbiAgLyoqXG4gICAqIFNldCB0byBgdHJ1ZWAgdG8gZXhwb3J0IGFsbCBgLmVudmAgdmFyaWFibGVzIHRvIHRoZSBjdXJyZW50IHByb2Nlc3Nlc1xuICAgKiBlbnZpcm9ubWVudC4gVmFyaWFibGVzIGFyZSB0aGVuIGFjY2Vzc2FibGUgdmlhIGBEZW5vLmVudi5nZXQoPGtleT4pYC5cbiAgICpcbiAgICogQGRlZmF1bHQge2ZhbHNlfVxuICAgKi9cbiAgZXhwb3J0PzogYm9vbGVhbjtcbiAgLyoqIE9wdGlvbmFsIHBhdGggdG8gYC5lbnYuZXhhbXBsZWAgZmlsZS5cbiAgICpcbiAgICogQGRlZmF1bHQge1wiLi8uZW52LmV4YW1wbGVcIn1cbiAgICovXG4gIGV4YW1wbGVQYXRoPzogc3RyaW5nO1xuICAvKipcbiAgICogU2V0IHRvIGB0cnVlYCB0byBhbGxvdyByZXF1aXJlZCBlbnYgdmFyaWFibGVzIHRvIGJlIGVtcHR5LiBPdGhlcndpc2UsIGl0XG4gICAqIHdpbGwgdGhyb3cgYW4gZXJyb3IgaWYgYW55IHZhcmlhYmxlIGlzIGVtcHR5LlxuICAgKlxuICAgKiBAZGVmYXVsdCB7ZmFsc2V9XG4gICAqL1xuICBhbGxvd0VtcHR5VmFsdWVzPzogYm9vbGVhbjtcbiAgLyoqXG4gICAqIFBhdGggdG8gYC5lbnYuZGVmYXVsdHNgIGZpbGUgd2hpY2ggaXMgdXNlZCB0byBkZWZpbmUgZGVmYXVsdCB2YWx1ZXMuXG4gICAqXG4gICAqIGBgYHNoXG4gICAqICMgLmVudi5kZWZhdWx0c1xuICAgKiAjIFdpbGwgbm90IGJlIHNldCBpZiBHUkVFVElORyBpcyBzZXQgaW4gYmFzZSAuZW52IGZpbGVcbiAgICogR1JFRVRJTkc9XCJhIHNlY3JldCB0byBldmVyeWJvZHlcIlxuICAgKiBgYGBcbiAgICpcbiAgICogQGRlZmF1bHQge1wiLi8uZW52LmRlZmF1bHRzXCJ9XG4gICAqL1xuICBkZWZhdWx0c1BhdGg/OiBzdHJpbmc7XG4gIC8qKlxuICAgKiBMaXN0IG9mIEVudiB2YXJpYWJsZXMgdG8gcmVhZCBmcm9tIHByb2Nlc3MuIEJ5IGRlZmF1bHQsIHRoZSBjb21wbGV0ZSBFbnYgaXNcbiAgICogbG9va2VkIHVwLiBUaGlzIGFsbG93cyB0byBwZXJtaXQgYWNjZXNzIHRvIG9ubHkgc3BlY2lmaWMgRW52IHZhcmlhYmxlcyB3aXRoXG4gICAqIGAtLWFsbG93LWVudj1FTlZfVkFSX05BTUVgLlxuICAgKi9cbiAgcmVzdHJpY3RFbnZBY2Nlc3NUbz86IFN0cmluZ0xpc3Q7XG59XG50eXBlIExpbmVQYXJzZVJlc3VsdCA9IHtcbiAga2V5OiBzdHJpbmc7XG4gIHVucXVvdGVkOiBzdHJpbmc7XG4gIGludGVycG9sYXRlZDogc3RyaW5nO1xuICBub3RJbnRlcnBvbGF0ZWQ6IHN0cmluZztcbn07XG5cbnR5cGUgQ2hhcmFjdGVyc01hcCA9IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH07XG5cbmNvbnN0IFJFX0tleVZhbHVlID1cbiAgL15cXHMqKD86ZXhwb3J0XFxzKyk/KD88a2V5PlthLXpBLVpfXStbYS16QS1aMC05X10qPylcXHMqPVtcXCBcXHRdKignXFxuPyg/PG5vdEludGVycG9sYXRlZD4oLnxcXG4pKj8pXFxuPyd8XCJcXG4/KD88aW50ZXJwb2xhdGVkPigufFxcbikqPylcXG4/XCJ8KD88dW5xdW90ZWQ+W15cXG4jXSopKSAqIyouKiQvZ207XG5cbmNvbnN0IFJFX0V4cGFuZFZhbHVlID1cbiAgLyhcXCR7KD88aW5CcmFja2V0cz4uKz8pKFxcOi0oPzxpbkJyYWNrZXRzRGVmYXVsdD4uKykpP318KD88IVxcXFwpXFwkKD88bm90SW5CcmFja2V0cz5cXHcrKShcXDotKD88bm90SW5CcmFja2V0c0RlZmF1bHQ+LispKT8pL2c7XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZShcbiAgcmF3RG90ZW52OiBzdHJpbmcsXG4gIHJlc3RyaWN0RW52QWNjZXNzVG86IFN0cmluZ0xpc3QgPSBbXSxcbik6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4ge1xuICBjb25zdCBlbnY6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fTtcblxuICBsZXQgbWF0Y2g7XG4gIGNvbnN0IGtleXNGb3JFeHBhbmRDaGVjayA9IFtdO1xuXG4gIHdoaWxlICgobWF0Y2ggPSBSRV9LZXlWYWx1ZS5leGVjKHJhd0RvdGVudikpICE9IG51bGwpIHtcbiAgICBjb25zdCB7IGtleSwgaW50ZXJwb2xhdGVkLCBub3RJbnRlcnBvbGF0ZWQsIHVucXVvdGVkIH0gPSBtYXRjaFxuICAgICAgPy5ncm91cHMgYXMgTGluZVBhcnNlUmVzdWx0O1xuXG4gICAgaWYgKHVucXVvdGVkKSB7XG4gICAgICBrZXlzRm9yRXhwYW5kQ2hlY2sucHVzaChrZXkpO1xuICAgIH1cblxuICAgIGVudltrZXldID0gdHlwZW9mIG5vdEludGVycG9sYXRlZCA9PT0gXCJzdHJpbmdcIlxuICAgICAgPyBub3RJbnRlcnBvbGF0ZWRcbiAgICAgIDogdHlwZW9mIGludGVycG9sYXRlZCA9PT0gXCJzdHJpbmdcIlxuICAgICAgPyBleHBhbmRDaGFyYWN0ZXJzKGludGVycG9sYXRlZClcbiAgICAgIDogdW5xdW90ZWQudHJpbSgpO1xuICB9XG5cbiAgLy9odHRwczovL2dpdGh1Yi5jb20vbW90ZG90bGEvZG90ZW52LWV4cGFuZC9ibG9iL2VkNWZlYTViZjUxN2EwOWZkNzQzY2UyYzYzMTUwZTg4YzhhNWY2ZDEvbGliL21haW4uanMjTDIzXG4gIGNvbnN0IHZhcmlhYmxlc01hcCA9IHsgLi4uZW52LCAuLi5yZWFkRW52KHJlc3RyaWN0RW52QWNjZXNzVG8pIH07XG4gIGtleXNGb3JFeHBhbmRDaGVjay5mb3JFYWNoKChrZXkpID0+IHtcbiAgICBlbnZba2V5XSA9IGV4cGFuZChlbnZba2V5XSwgdmFyaWFibGVzTWFwKTtcbiAgfSk7XG5cbiAgcmV0dXJuIGVudjtcbn1cblxuLyoqXG4gKiBAZGVwcmVjYXRlZCAod2lsbCBiZSByZW1vdmVkIGFmdGVyIDAuMTcyLjApLiBVc2UgYGxvYWRTeW5jYCBpbnN0ZWFkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb25maWdTeW5jKFxuICBvcHRpb25zPzogT21pdDxDb25maWdPcHRpb25zLCBcInJlc3RyaWN0RW52QWNjZXNzVG9cIj4sXG4pOiBEb3RlbnZDb25maWc7XG5leHBvcnQgZnVuY3Rpb24gY29uZmlnU3luYzxURW52VmFyIGV4dGVuZHMgc3RyaW5nPihcbiAgb3B0aW9uczogT21pdDxDb25maWdPcHRpb25zLCBcInJlc3RyaWN0RW52QWNjZXNzVG9cIj4gJiB7XG4gICAgcmVzdHJpY3RFbnZBY2Nlc3NUbzogU3RyaWN0RW52VmFyTGlzdDxURW52VmFyPjtcbiAgfSxcbik6IFN0cmljdERvdGVudkNvbmZpZzxTdHJpY3RFbnZWYXJMaXN0PFRFbnZWYXI+PjtcbmV4cG9ydCBmdW5jdGlvbiBjb25maWdTeW5jKG9wdGlvbnM6IENvbmZpZ09wdGlvbnMgPSB7fSk6IERvdGVudkNvbmZpZyB7XG4gIGNvbnN0IHIgPSB7IHJlc3RyaWN0RW52QWNjZXNzVG86IG9wdGlvbnMucmVzdHJpY3RFbnZBY2Nlc3NUbyB9O1xuICByZXR1cm4gbG9hZFN5bmMoe1xuICAgIC4uLnIsXG4gICAgZW52UGF0aDogb3B0aW9ucy5wYXRoLFxuICAgIGV4YW1wbGVQYXRoOiBvcHRpb25zLnNhZmUgPyBvcHRpb25zLmV4YW1wbGUgOiB1bmRlZmluZWQsXG4gICAgZGVmYXVsdHNQYXRoOiBvcHRpb25zLmRlZmF1bHRzLFxuICAgIGV4cG9ydDogb3B0aW9ucy5leHBvcnQsXG4gICAgYWxsb3dFbXB0eVZhbHVlczogb3B0aW9ucy5hbGxvd0VtcHR5VmFsdWVzLFxuICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxvYWRTeW5jKFxuICBvcHRpb25zPzogT21pdDxMb2FkT3B0aW9ucywgXCJyZXN0cmljdEVudkFjY2Vzc1RvXCI+LFxuKTogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbmV4cG9ydCBmdW5jdGlvbiBsb2FkU3luYzxURW52VmFyIGV4dGVuZHMgc3RyaW5nPihcbiAgb3B0aW9uczogT21pdDxMb2FkT3B0aW9ucywgXCJyZXN0cmljdEVudkFjY2Vzc1RvXCI+ICYge1xuICAgIHJlc3RyaWN0RW52QWNjZXNzVG86IFN0cmljdEVudlZhckxpc3Q8VEVudlZhcj47XG4gIH0sXG4pOiBTdHJpY3REb3RlbnZDb25maWc8U3RyaWN0RW52VmFyTGlzdDxURW52VmFyPj47XG5leHBvcnQgZnVuY3Rpb24gbG9hZFN5bmMoXG4gIHtcbiAgICBlbnZQYXRoID0gXCIuZW52XCIsXG4gICAgZXhhbXBsZVBhdGggPSBcIi5lbnYuZXhhbXBsZVwiLFxuICAgIGRlZmF1bHRzUGF0aCA9IFwiLmVudi5kZWZhdWx0c1wiLFxuICAgIGV4cG9ydDogX2V4cG9ydCA9IGZhbHNlLFxuICAgIGFsbG93RW1wdHlWYWx1ZXMgPSBmYWxzZSxcbiAgICByZXN0cmljdEVudkFjY2Vzc1RvID0gW10sXG4gIH06IExvYWRPcHRpb25zID0ge30sXG4pOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+IHtcbiAgY29uc3QgY29uZiA9IHBhcnNlRmlsZVN5bmMoZW52UGF0aCwgcmVzdHJpY3RFbnZBY2Nlc3NUbyk7XG5cbiAgaWYgKGRlZmF1bHRzUGF0aCkge1xuICAgIGNvbnN0IGNvbmZEZWZhdWx0cyA9IHBhcnNlRmlsZVN5bmMoZGVmYXVsdHNQYXRoLCByZXN0cmljdEVudkFjY2Vzc1RvKTtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBjb25mRGVmYXVsdHMpIHtcbiAgICAgIGlmICghKGtleSBpbiBjb25mKSkge1xuICAgICAgICBjb25mW2tleV0gPSBjb25mRGVmYXVsdHNba2V5XTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAoZXhhbXBsZVBhdGgpIHtcbiAgICBjb25zdCBjb25mRXhhbXBsZSA9IHBhcnNlRmlsZVN5bmMoZXhhbXBsZVBhdGgsIHJlc3RyaWN0RW52QWNjZXNzVG8pO1xuICAgIGFzc2VydFNhZmUoY29uZiwgY29uZkV4YW1wbGUsIGFsbG93RW1wdHlWYWx1ZXMsIHJlc3RyaWN0RW52QWNjZXNzVG8pO1xuICB9XG5cbiAgaWYgKF9leHBvcnQpIHtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBjb25mKSB7XG4gICAgICBpZiAoRGVuby5lbnYuZ2V0KGtleSkgIT09IHVuZGVmaW5lZCkgY29udGludWU7XG4gICAgICBEZW5vLmVudi5zZXQoa2V5LCBjb25mW2tleV0pO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBjb25mO1xufVxuXG4vKipcbiAqIEBkZXByZWNhdGVkICh3aWxsIGJlIHJlbW92ZWQgYWZ0ZXIgMC4xNzIuMCkuIFVzZSBgbG9hZGAgaW5zdGVhZFxuICovXG5leHBvcnQgZnVuY3Rpb24gY29uZmlnKFxuICBvcHRpb25zPzogT21pdDxDb25maWdPcHRpb25zLCBcInJlc3RyaWN0RW52QWNjZXNzVG9cIj4sXG4pOiBQcm9taXNlPERvdGVudkNvbmZpZz47XG5leHBvcnQgZnVuY3Rpb24gY29uZmlnPFRFbnZWYXIgZXh0ZW5kcyBzdHJpbmc+KFxuICBvcHRpb25zOiBPbWl0PENvbmZpZ09wdGlvbnMsIFwicmVzdHJpY3RFbnZBY2Nlc3NUb1wiPiAmIHtcbiAgICByZXN0cmljdEVudkFjY2Vzc1RvOiBTdHJpY3RFbnZWYXJMaXN0PFRFbnZWYXI+O1xuICB9LFxuKTogUHJvbWlzZTxTdHJpY3REb3RlbnZDb25maWc8U3RyaWN0RW52VmFyTGlzdDxURW52VmFyPj4+O1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNvbmZpZyhcbiAgb3B0aW9uczogQ29uZmlnT3B0aW9ucyA9IHt9LFxuKTogUHJvbWlzZTxEb3RlbnZDb25maWc+IHtcbiAgY29uc3QgciA9IHsgcmVzdHJpY3RFbnZBY2Nlc3NUbzogb3B0aW9ucy5yZXN0cmljdEVudkFjY2Vzc1RvIH07XG4gIHJldHVybiBhd2FpdCBsb2FkKHtcbiAgICAuLi5yLFxuICAgIGVudlBhdGg6IG9wdGlvbnMucGF0aCxcbiAgICBleGFtcGxlUGF0aDogb3B0aW9ucy5zYWZlID8gb3B0aW9ucy5leGFtcGxlIDogdW5kZWZpbmVkLFxuICAgIGRlZmF1bHRzUGF0aDogb3B0aW9ucy5kZWZhdWx0cyxcbiAgICBleHBvcnQ6IG9wdGlvbnMuZXhwb3J0LFxuICAgIGFsbG93RW1wdHlWYWx1ZXM6IG9wdGlvbnMuYWxsb3dFbXB0eVZhbHVlcyxcbiAgfSk7XG59XG5leHBvcnQgZnVuY3Rpb24gbG9hZChcbiAgb3B0aW9ucz86IE9taXQ8TG9hZE9wdGlvbnMsIFwicmVzdHJpY3RFbnZBY2Nlc3NUb1wiPixcbik6IFByb21pc2U8UmVjb3JkPHN0cmluZywgc3RyaW5nPj47XG5leHBvcnQgZnVuY3Rpb24gbG9hZDxURW52VmFyIGV4dGVuZHMgc3RyaW5nPihcbiAgb3B0aW9uczogT21pdDxMb2FkT3B0aW9ucywgXCJyZXN0cmljdEVudkFjY2Vzc1RvXCI+ICYge1xuICAgIHJlc3RyaWN0RW52QWNjZXNzVG86IFN0cmljdEVudlZhckxpc3Q8VEVudlZhcj47XG4gIH0sXG4pOiBQcm9taXNlPFN0cmljdERvdGVudkNvbmZpZzxTdHJpY3RFbnZWYXJMaXN0PFRFbnZWYXI+Pj47XG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbG9hZChcbiAge1xuICAgIGVudlBhdGggPSBcIi5lbnZcIixcbiAgICBleGFtcGxlUGF0aCA9IFwiLmVudi5leGFtcGxlXCIsXG4gICAgZGVmYXVsdHNQYXRoID0gXCIuZW52LmRlZmF1bHRzXCIsXG4gICAgZXhwb3J0OiBfZXhwb3J0ID0gZmFsc2UsXG4gICAgYWxsb3dFbXB0eVZhbHVlcyA9IGZhbHNlLFxuICAgIHJlc3RyaWN0RW52QWNjZXNzVG8gPSBbXSxcbiAgfTogTG9hZE9wdGlvbnMgPSB7fSxcbik6IFByb21pc2U8UmVjb3JkPHN0cmluZywgc3RyaW5nPj4ge1xuICBjb25zdCBjb25mID0gYXdhaXQgcGFyc2VGaWxlKGVudlBhdGgsIHJlc3RyaWN0RW52QWNjZXNzVG8pO1xuXG4gIGlmIChkZWZhdWx0c1BhdGgpIHtcbiAgICBjb25zdCBjb25mRGVmYXVsdHMgPSBhd2FpdCBwYXJzZUZpbGUoXG4gICAgICBkZWZhdWx0c1BhdGgsXG4gICAgICByZXN0cmljdEVudkFjY2Vzc1RvLFxuICAgICk7XG4gICAgZm9yIChjb25zdCBrZXkgaW4gY29uZkRlZmF1bHRzKSB7XG4gICAgICBpZiAoIShrZXkgaW4gY29uZikpIHtcbiAgICAgICAgY29uZltrZXldID0gY29uZkRlZmF1bHRzW2tleV07XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKGV4YW1wbGVQYXRoKSB7XG4gICAgY29uc3QgY29uZkV4YW1wbGUgPSBhd2FpdCBwYXJzZUZpbGUoXG4gICAgICBleGFtcGxlUGF0aCxcbiAgICAgIHJlc3RyaWN0RW52QWNjZXNzVG8sXG4gICAgKTtcbiAgICBhc3NlcnRTYWZlKGNvbmYsIGNvbmZFeGFtcGxlLCBhbGxvd0VtcHR5VmFsdWVzLCByZXN0cmljdEVudkFjY2Vzc1RvKTtcbiAgfVxuXG4gIGlmIChfZXhwb3J0KSB7XG4gICAgZm9yIChjb25zdCBrZXkgaW4gY29uZikge1xuICAgICAgaWYgKERlbm8uZW52LmdldChrZXkpICE9PSB1bmRlZmluZWQpIGNvbnRpbnVlO1xuICAgICAgRGVuby5lbnYuc2V0KGtleSwgY29uZltrZXldKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gY29uZjtcbn1cblxuZnVuY3Rpb24gcGFyc2VGaWxlU3luYyhcbiAgZmlsZXBhdGg6IHN0cmluZyxcbiAgcmVzdHJpY3RFbnZBY2Nlc3NUbzogU3RyaW5nTGlzdCA9IFtdLFxuKTogUmVjb3JkPHN0cmluZywgc3RyaW5nPiB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIHBhcnNlKERlbm8ucmVhZFRleHRGaWxlU3luYyhmaWxlcGF0aCksIHJlc3RyaWN0RW52QWNjZXNzVG8pO1xuICB9IGNhdGNoIChlKSB7XG4gICAgaWYgKGUgaW5zdGFuY2VvZiBEZW5vLmVycm9ycy5Ob3RGb3VuZCkgcmV0dXJuIHt9O1xuICAgIHRocm93IGU7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gcGFyc2VGaWxlKFxuICBmaWxlcGF0aDogc3RyaW5nLFxuICByZXN0cmljdEVudkFjY2Vzc1RvOiBTdHJpbmdMaXN0ID0gW10sXG4pOiBQcm9taXNlPFJlY29yZDxzdHJpbmcsIHN0cmluZz4+IHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gcGFyc2UoYXdhaXQgRGVuby5yZWFkVGV4dEZpbGUoZmlsZXBhdGgpLCByZXN0cmljdEVudkFjY2Vzc1RvKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGlmIChlIGluc3RhbmNlb2YgRGVuby5lcnJvcnMuTm90Rm91bmQpIHJldHVybiB7fTtcbiAgICB0aHJvdyBlO1xuICB9XG59XG5cbmZ1bmN0aW9uIGV4cGFuZENoYXJhY3RlcnMoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBjaGFyYWN0ZXJzTWFwOiBDaGFyYWN0ZXJzTWFwID0ge1xuICAgIFwiXFxcXG5cIjogXCJcXG5cIixcbiAgICBcIlxcXFxyXCI6IFwiXFxyXCIsXG4gICAgXCJcXFxcdFwiOiBcIlxcdFwiLFxuICB9O1xuXG4gIHJldHVybiBzdHIucmVwbGFjZShcbiAgICAvXFxcXChbbnJ0XSkvZyxcbiAgICAoJDE6IGtleW9mIENoYXJhY3RlcnNNYXApOiBzdHJpbmcgPT4gY2hhcmFjdGVyc01hcFskMV0sXG4gICk7XG59XG5cbmZ1bmN0aW9uIGFzc2VydFNhZmUoXG4gIGNvbmY6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4sXG4gIGNvbmZFeGFtcGxlOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+LFxuICBhbGxvd0VtcHR5VmFsdWVzOiBib29sZWFuLFxuICByZXN0cmljdEVudkFjY2Vzc1RvOiBTdHJpbmdMaXN0ID0gW10sXG4pIHtcbiAgY29uc3QgY3VycmVudEVudiA9IHJlYWRFbnYocmVzdHJpY3RFbnZBY2Nlc3NUbyk7XG5cbiAgLy8gTm90IGFsbCB0aGUgdmFyaWFibGVzIGhhdmUgdG8gYmUgZGVmaW5lZCBpbiAuZW52LCB0aGV5IGNhbiBiZSBzdXBwbGllZCBleHRlcm5hbGx5XG4gIGNvbnN0IGNvbmZXaXRoRW52ID0gT2JqZWN0LmFzc2lnbih7fSwgY3VycmVudEVudiwgY29uZik7XG5cbiAgY29uc3QgbWlzc2luZyA9IHdpdGhvdXRBbGwoXG4gICAgT2JqZWN0LmtleXMoY29uZkV4YW1wbGUpLFxuICAgIC8vIElmIGFsbG93RW1wdHlWYWx1ZXMgaXMgZmFsc2UsIGZpbHRlciBvdXQgZW1wdHkgdmFsdWVzIGZyb20gY29uZmlndXJhdGlvblxuICAgIE9iamVjdC5rZXlzKFxuICAgICAgYWxsb3dFbXB0eVZhbHVlcyA/IGNvbmZXaXRoRW52IDogZmlsdGVyVmFsdWVzKGNvbmZXaXRoRW52LCBCb29sZWFuKSxcbiAgICApLFxuICApO1xuXG4gIGlmIChtaXNzaW5nLmxlbmd0aCA+IDApIHtcbiAgICBjb25zdCBlcnJvck1lc3NhZ2VzID0gW1xuICAgICAgYFRoZSBmb2xsb3dpbmcgdmFyaWFibGVzIHdlcmUgZGVmaW5lZCBpbiB0aGUgZXhhbXBsZSBmaWxlIGJ1dCBhcmUgbm90IHByZXNlbnQgaW4gdGhlIGVudmlyb25tZW50OlxcbiAgJHtcbiAgICAgICAgbWlzc2luZy5qb2luKFxuICAgICAgICAgIFwiLCBcIixcbiAgICAgICAgKVxuICAgICAgfWAsXG4gICAgICBgTWFrZSBzdXJlIHRvIGFkZCB0aGVtIHRvIHlvdXIgZW52IGZpbGUuYCxcbiAgICAgICFhbGxvd0VtcHR5VmFsdWVzICYmXG4gICAgICBgSWYgeW91IGV4cGVjdCBhbnkgb2YgdGhlc2UgdmFyaWFibGVzIHRvIGJlIGVtcHR5LCB5b3UgY2FuIHNldCB0aGUgYWxsb3dFbXB0eVZhbHVlcyBvcHRpb24gdG8gdHJ1ZS5gLFxuICAgIF07XG5cbiAgICB0aHJvdyBuZXcgTWlzc2luZ0VudlZhcnNFcnJvcihcbiAgICAgIGVycm9yTWVzc2FnZXMuZmlsdGVyKEJvb2xlYW4pLmpvaW4oXCJcXG5cXG5cIiksXG4gICAgICBtaXNzaW5nLFxuICAgICk7XG4gIH1cbn1cblxuLy8gYSBndWFyZGVkIGVudiBhY2Nlc3MsIHRoYXQgcmVhZHMgb25seSBhIHN1YnNldCBmcm9tIHRoZSBEZW5vLmVudiBvYmplY3QsXG4vLyBpZiBgcmVzdHJpY3RFbnZBY2Nlc3NUb2AgcHJvcGVydHkgaXMgcGFzc2VkLlxuZnVuY3Rpb24gcmVhZEVudihyZXN0cmljdEVudkFjY2Vzc1RvOiBTdHJpbmdMaXN0KSB7XG4gIGlmIChcbiAgICByZXN0cmljdEVudkFjY2Vzc1RvICYmIEFycmF5LmlzQXJyYXkocmVzdHJpY3RFbnZBY2Nlc3NUbykgJiZcbiAgICByZXN0cmljdEVudkFjY2Vzc1RvLmxlbmd0aCA+IDBcbiAgKSB7XG4gICAgcmV0dXJuIHJlc3RyaWN0RW52QWNjZXNzVG8ucmVkdWNlKFxuICAgICAgKFxuICAgICAgICBhY2Nlc3NlZEVudlZhcnM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4sXG4gICAgICAgIGVudlZhck5hbWU6IHN0cmluZyxcbiAgICAgICk6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPT4ge1xuICAgICAgICBpZiAoRGVuby5lbnYuZ2V0KGVudlZhck5hbWUpKSB7XG4gICAgICAgICAgYWNjZXNzZWRFbnZWYXJzW2VudlZhck5hbWVdID0gRGVuby5lbnYuZ2V0KGVudlZhck5hbWUpIGFzIHN0cmluZztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYWNjZXNzZWRFbnZWYXJzO1xuICAgICAgfSxcbiAgICAgIHt9LFxuICAgICk7XG4gIH1cblxuICByZXR1cm4gRGVuby5lbnYudG9PYmplY3QoKTtcbn1cblxuZXhwb3J0IGNsYXNzIE1pc3NpbmdFbnZWYXJzRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIG1pc3Npbmc6IHN0cmluZ1tdO1xuICBjb25zdHJ1Y3RvcihtZXNzYWdlOiBzdHJpbmcsIG1pc3Npbmc6IHN0cmluZ1tdKSB7XG4gICAgc3VwZXIobWVzc2FnZSk7XG4gICAgdGhpcy5uYW1lID0gXCJNaXNzaW5nRW52VmFyc0Vycm9yXCI7XG4gICAgdGhpcy5taXNzaW5nID0gbWlzc2luZztcbiAgICBPYmplY3Quc2V0UHJvdG90eXBlT2YodGhpcywgbmV3LnRhcmdldC5wcm90b3R5cGUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGV4cGFuZChzdHI6IHN0cmluZywgdmFyaWFibGVzTWFwOiB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9KTogc3RyaW5nIHtcbiAgaWYgKFJFX0V4cGFuZFZhbHVlLnRlc3Qoc3RyKSkge1xuICAgIHJldHVybiBleHBhbmQoXG4gICAgICBzdHIucmVwbGFjZShSRV9FeHBhbmRWYWx1ZSwgZnVuY3Rpb24gKC4uLnBhcmFtcykge1xuICAgICAgICBjb25zdCB7XG4gICAgICAgICAgaW5CcmFja2V0cyxcbiAgICAgICAgICBpbkJyYWNrZXRzRGVmYXVsdCxcbiAgICAgICAgICBub3RJbkJyYWNrZXRzLFxuICAgICAgICAgIG5vdEluQnJhY2tldHNEZWZhdWx0LFxuICAgICAgICB9ID0gcGFyYW1zW3BhcmFtcy5sZW5ndGggLSAxXTtcbiAgICAgICAgY29uc3QgZXhwYW5kVmFsdWUgPSBpbkJyYWNrZXRzIHx8IG5vdEluQnJhY2tldHM7XG4gICAgICAgIGNvbnN0IGRlZmF1bHRWYWx1ZSA9IGluQnJhY2tldHNEZWZhdWx0IHx8IG5vdEluQnJhY2tldHNEZWZhdWx0O1xuXG4gICAgICAgIHJldHVybiB2YXJpYWJsZXNNYXBbZXhwYW5kVmFsdWVdIHx8XG4gICAgICAgICAgZXhwYW5kKGRlZmF1bHRWYWx1ZSwgdmFyaWFibGVzTWFwKTtcbiAgICAgIH0pLFxuICAgICAgdmFyaWFibGVzTWFwLFxuICAgICk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHN0cjtcbiAgfVxufVxuXG4vKipcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgc3RyaW5naWZ5IH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vZG90ZW52L21vZC50c1wiO1xuICpcbiAqIGNvbnN0IG9iamVjdCA9IHsgR1JFRVRJTkc6IFwiaGVsbG8gd29ybGRcIiB9O1xuICogY29uc3Qgc3RyaW5nID0gc3RyaW5naWZ5KG9iamVjdCk7IC8vIEdSRUVUSU5HPSdoZWxsbyB3b3JsZCdcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSBvYmplY3Qgb2JqZWN0IHRvIGJlIHN0cmluZ2lmaWVkXG4gKiBAcmV0dXJucyBzdHJpbmcgb2Ygb2JqZWN0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdHJpbmdpZnkob2JqZWN0OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KSB7XG4gIGNvbnN0IGxpbmVzOiBzdHJpbmdbXSA9IFtdO1xuICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhvYmplY3QpKSB7XG4gICAgbGV0IHF1b3RlO1xuXG4gICAgbGV0IGVzY2FwZWRWYWx1ZSA9IHZhbHVlID8/IFwiXCI7XG4gICAgaWYgKGtleS5zdGFydHNXaXRoKFwiI1wiKSkge1xuICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICBga2V5IHN0YXJ0cyB3aXRoIGEgJyMnIGluZGljYXRlcyBhIGNvbW1lbnQgYW5kIGlzIGlnbm9yZWQ6ICcke2tleX0nYCxcbiAgICAgICk7XG4gICAgICBjb250aW51ZTtcbiAgICB9IGVsc2UgaWYgKGVzY2FwZWRWYWx1ZS5pbmNsdWRlcyhcIlxcblwiKSkge1xuICAgICAgLy8gZXNjYXBlIGlubmVyIG5ldyBsaW5lc1xuICAgICAgZXNjYXBlZFZhbHVlID0gZXNjYXBlZFZhbHVlLnJlcGxhY2VBbGwoXCJcXG5cIiwgXCJcXFxcblwiKTtcbiAgICAgIHF1b3RlID0gYFwiYDtcbiAgICB9IGVsc2UgaWYgKGVzY2FwZWRWYWx1ZS5tYXRjaCgvXFxXLykpIHtcbiAgICAgIHF1b3RlID0gXCInXCI7XG4gICAgfVxuXG4gICAgaWYgKHF1b3RlKSB7XG4gICAgICAvLyBlc2NhcGUgaW5uZXIgcXVvdGVzXG4gICAgICBlc2NhcGVkVmFsdWUgPSBlc2NhcGVkVmFsdWUucmVwbGFjZUFsbChxdW90ZSwgYFxcXFwke3F1b3RlfWApO1xuICAgICAgZXNjYXBlZFZhbHVlID0gYCR7cXVvdGV9JHtlc2NhcGVkVmFsdWV9JHtxdW90ZX1gO1xuICAgIH1cbiAgICBjb25zdCBsaW5lID0gYCR7a2V5fT0ke2VzY2FwZWRWYWx1ZX1gO1xuICAgIGxpbmVzLnB1c2gobGluZSk7XG4gIH1cbiAgcmV0dXJuIGxpbmVzLmpvaW4oXCJcXG5cIik7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQXlGQyxHQUVELFNBQVMsWUFBWSxRQUFRLGtDQUFrQztBQUMvRCxTQUFTLFVBQVUsUUFBUSxnQ0FBZ0M7QUF5STNELE1BQU0sY0FDSjtBQUVGLE1BQU0saUJBQ0o7QUFFRixPQUFPLFNBQVMsTUFDZCxTQUFpQixFQUNqQixzQkFB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