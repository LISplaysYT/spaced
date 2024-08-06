// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
/**
 * Command line arguments parser based on
 * [minimist](https://github.com/minimistjs/minimist).
 *
 * This module is browser compatible.
 *
 * @example
 * ```ts
 * import { parse } from "https://deno.land/std@$STD_VERSION/flags/mod.ts";
 *
 * console.dir(parse(Deno.args));
 * ```
 *
 * ```sh
 * $ deno run https://deno.land/std/examples/flags.ts -a beep -b boop
 * { _: [], a: 'beep', b: 'boop' }
 * ```
 *
 * ```sh
 * $ deno run https://deno.land/std/examples/flags.ts -x 3 -y 4 -n5 -abc --beep=boop foo bar baz
 * { _: [ 'foo', 'bar', 'baz' ],
 *   x: 3,
 *   y: 4,
 *   n: 5,
 *   a: true,
 *   b: true,
 *   c: true,
 *   beep: 'boop' }
 * ```
 *
 * @module
 */ import { assert } from "../_util/asserts.ts";
const { hasOwn  } = Object;
function get(obj, key) {
    if (hasOwn(obj, key)) {
        return obj[key];
    }
}
function getForce(obj, key) {
    const v = get(obj, key);
    assert(v != null);
    return v;
}
function isNumber(x) {
    if (typeof x === "number") return true;
    if (/^0x[0-9a-f]+$/i.test(String(x))) return true;
    return /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(e[-+]?\d+)?$/.test(String(x));
}
function hasKey(obj, keys) {
    let o = obj;
    keys.slice(0, -1).forEach((key)=>{
        o = get(o, key) ?? {};
    });
    const key = keys[keys.length - 1];
    return hasOwn(o, key);
}
/** Take a set of command line arguments, optionally with a set of options, and
 * return an object representing the flags found in the passed arguments.
 *
 * By default, any arguments starting with `-` or `--` are considered boolean
 * flags. If the argument name is followed by an equal sign (`=`) it is
 * considered a key-value pair. Any arguments which could not be parsed are
 * available in the `_` property of the returned object.
 *
 * By default, the flags module tries to determine the type of all arguments
 * automatically and the return type of the `parse` method will have an index
 * signature with `any` as value (`{ [x: string]: any }`).
 *
 * If the `string`, `boolean` or `collect` option is set, the return value of
 * the `parse` method will be fully typed and the index signature of the return
 * type will change to `{ [x: string]: unknown }`.
 *
 * Any arguments after `'--'` will not be parsed and will end up in `parsedArgs._`.
 *
 * Numeric-looking arguments will be returned as numbers unless `options.string`
 * or `options.boolean` is set for that argument name.
 *
 * @example
 * ```ts
 * import { parse } from "https://deno.land/std@$STD_VERSION/flags/mod.ts";
 * const parsedArgs = parse(Deno.args);
 * ```
 *
 * @example
 * ```ts
 * import { parse } from "https://deno.land/std@$STD_VERSION/flags/mod.ts";
 * const parsedArgs = parse(["--foo", "--bar=baz", "./quux.txt"]);
 * // parsedArgs: { foo: true, bar: "baz", _: ["./quux.txt"] }
 * ```
 */ export function parse(args, { "--": doubleDash = false , alias ={} , boolean =false , default: defaults = {} , stopEarly =false , string =[] , collect =[] , negatable =[] , unknown =(i)=>i  } = {}) {
    const aliases = {};
    const flags = {
        bools: {},
        strings: {},
        unknownFn: unknown,
        allBools: false,
        collect: {},
        negatable: {}
    };
    if (alias !== undefined) {
        for(const key in alias){
            const val = getForce(alias, key);
            if (typeof val === "string") {
                aliases[key] = [
                    val
                ];
            } else {
                aliases[key] = val;
            }
            for (const alias1 of getForce(aliases, key)){
                aliases[alias1] = [
                    key
                ].concat(aliases[key].filter((y)=>alias1 !== y));
            }
        }
    }
    if (boolean !== undefined) {
        if (typeof boolean === "boolean") {
            flags.allBools = !!boolean;
        } else {
            const booleanArgs = typeof boolean === "string" ? [
                boolean
            ] : boolean;
            for (const key1 of booleanArgs.filter(Boolean)){
                flags.bools[key1] = true;
                const alias2 = get(aliases, key1);
                if (alias2) {
                    for (const al of alias2){
                        flags.bools[al] = true;
                    }
                }
            }
        }
    }
    if (string !== undefined) {
        const stringArgs = typeof string === "string" ? [
            string
        ] : string;
        for (const key2 of stringArgs.filter(Boolean)){
            flags.strings[key2] = true;
            const alias3 = get(aliases, key2);
            if (alias3) {
                for (const al1 of alias3){
                    flags.strings[al1] = true;
                }
            }
        }
    }
    if (collect !== undefined) {
        const collectArgs = typeof collect === "string" ? [
            collect
        ] : collect;
        for (const key3 of collectArgs.filter(Boolean)){
            flags.collect[key3] = true;
            const alias4 = get(aliases, key3);
            if (alias4) {
                for (const al2 of alias4){
                    flags.collect[al2] = true;
                }
            }
        }
    }
    if (negatable !== undefined) {
        const negatableArgs = typeof negatable === "string" ? [
            negatable
        ] : negatable;
        for (const key4 of negatableArgs.filter(Boolean)){
            flags.negatable[key4] = true;
            const alias5 = get(aliases, key4);
            if (alias5) {
                for (const al3 of alias5){
                    flags.negatable[al3] = true;
                }
            }
        }
    }
    const argv = {
        _: []
    };
    function argDefined(key, arg) {
        return flags.allBools && /^--[^=]+$/.test(arg) || get(flags.bools, key) || !!get(flags.strings, key) || !!get(aliases, key);
    }
    function setKey(obj, name, value, collect = true) {
        let o = obj;
        const keys = name.split(".");
        keys.slice(0, -1).forEach(function(key) {
            if (get(o, key) === undefined) {
                o[key] = {};
            }
            o = get(o, key);
        });
        const key = keys[keys.length - 1];
        const collectable = collect && !!get(flags.collect, name);
        if (!collectable) {
            o[key] = value;
        } else if (get(o, key) === undefined) {
            o[key] = [
                value
            ];
        } else if (Array.isArray(get(o, key))) {
            o[key].push(value);
        } else {
            o[key] = [
                get(o, key),
                value
            ];
        }
    }
    function setArg(key, val, arg = undefined, collect) {
        if (arg && flags.unknownFn && !argDefined(key, arg)) {
            if (flags.unknownFn(arg, key, val) === false) return;
        }
        const value = !get(flags.strings, key) && isNumber(val) ? Number(val) : val;
        setKey(argv, key, value, collect);
        const alias = get(aliases, key);
        if (alias) {
            for (const x of alias){
                setKey(argv, x, value, collect);
            }
        }
    }
    function aliasIsBoolean(key) {
        return getForce(aliases, key).some((x)=>typeof get(flags.bools, x) === "boolean");
    }
    let notFlags = [];
    // all args after "--" are not parsed
    if (args.includes("--")) {
        notFlags = args.slice(args.indexOf("--") + 1);
        args = args.slice(0, args.indexOf("--"));
    }
    for(let i = 0; i < args.length; i++){
        const arg = args[i];
        if (/^--.+=/.test(arg)) {
            const m = arg.match(/^--([^=]+)=(.*)$/s);
            assert(m != null);
            const [, key5, value] = m;
            if (flags.bools[key5]) {
                const booleanValue = value !== "false";
                setArg(key5, booleanValue, arg);
            } else {
                setArg(key5, value, arg);
            }
        } else if (/^--no-.+/.test(arg) && get(flags.negatable, arg.replace(/^--no-/, ""))) {
            const m1 = arg.match(/^--no-(.+)/);
            assert(m1 != null);
            setArg(m1[1], false, arg, false);
        } else if (/^--.+/.test(arg)) {
            const m2 = arg.match(/^--(.+)/);
            assert(m2 != null);
            const [, key6] = m2;
            const next = args[i + 1];
            if (next !== undefined && !/^-/.test(next) && !get(flags.bools, key6) && !flags.allBools && (get(aliases, key6) ? !aliasIsBoolean(key6) : true)) {
                setArg(key6, next, arg);
                i++;
            } else if (/^(true|false)$/.test(next)) {
                setArg(key6, next === "true", arg);
                i++;
            } else {
                setArg(key6, get(flags.strings, key6) ? "" : true, arg);
            }
        } else if (/^-[^-]+/.test(arg)) {
            const letters = arg.slice(1, -1).split("");
            let broken = false;
            for(let j = 0; j < letters.length; j++){
                const next1 = arg.slice(j + 2);
                if (next1 === "-") {
                    setArg(letters[j], next1, arg);
                    continue;
                }
                if (/[A-Za-z]/.test(letters[j]) && /=/.test(next1)) {
                    setArg(letters[j], next1.split(/=(.+)/)[1], arg);
                    broken = true;
                    break;
                }
                if (/[A-Za-z]/.test(letters[j]) && /-?\d+(\.\d*)?(e-?\d+)?$/.test(next1)) {
                    setArg(letters[j], next1, arg);
                    broken = true;
                    break;
                }
                if (letters[j + 1] && letters[j + 1].match(/\W/)) {
                    setArg(letters[j], arg.slice(j + 2), arg);
                    broken = true;
                    break;
                } else {
                    setArg(letters[j], get(flags.strings, letters[j]) ? "" : true, arg);
                }
            }
            const [key7] = arg.slice(-1);
            if (!broken && key7 !== "-") {
                if (args[i + 1] && !/^(-|--)[^-]/.test(args[i + 1]) && !get(flags.bools, key7) && (get(aliases, key7) ? !aliasIsBoolean(key7) : true)) {
                    setArg(key7, args[i + 1], arg);
                    i++;
                } else if (args[i + 1] && /^(true|false)$/.test(args[i + 1])) {
                    setArg(key7, args[i + 1] === "true", arg);
                    i++;
                } else {
                    setArg(key7, get(flags.strings, key7) ? "" : true, arg);
                }
            }
        } else {
            if (!flags.unknownFn || flags.unknownFn(arg) !== false) {
                argv._.push(flags.strings["_"] ?? !isNumber(arg) ? arg : Number(arg));
            }
            if (stopEarly) {
                argv._.push(...args.slice(i + 1));
                break;
            }
        }
    }
    for (const [key8, value1] of Object.entries(defaults)){
        if (!hasKey(argv, key8.split("."))) {
            setKey(argv, key8, value1);
            if (aliases[key8]) {
                for (const x of aliases[key8]){
                    setKey(argv, x, value1);
                }
            }
        }
    }
    for (const key9 of Object.keys(flags.bools)){
        if (!hasKey(argv, key9.split("."))) {
            const value2 = get(flags.collect, key9) ? [] : false;
            setKey(argv, key9, value2, false);
        }
    }
    for (const key10 of Object.keys(flags.strings)){
        if (!hasKey(argv, key10.split(".")) && get(flags.collect, key10)) {
            setKey(argv, key10, [], false);
        }
    }
    if (doubleDash) {
        argv["--"] = [];
        for (const key11 of notFlags){
            argv["--"].push(key11);
        }
    } else {
        for (const key12 of notFlags){
            argv._.push(key12);
        }
    }
    return argv;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE3My4wL2ZsYWdzL21vZC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIzIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLyoqXG4gKiBDb21tYW5kIGxpbmUgYXJndW1lbnRzIHBhcnNlciBiYXNlZCBvblxuICogW21pbmltaXN0XShodHRwczovL2dpdGh1Yi5jb20vbWluaW1pc3Rqcy9taW5pbWlzdCkuXG4gKlxuICogVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgcGFyc2UgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9mbGFncy9tb2QudHNcIjtcbiAqXG4gKiBjb25zb2xlLmRpcihwYXJzZShEZW5vLmFyZ3MpKTtcbiAqIGBgYFxuICpcbiAqIGBgYHNoXG4gKiAkIGRlbm8gcnVuIGh0dHBzOi8vZGVuby5sYW5kL3N0ZC9leGFtcGxlcy9mbGFncy50cyAtYSBiZWVwIC1iIGJvb3BcbiAqIHsgXzogW10sIGE6ICdiZWVwJywgYjogJ2Jvb3AnIH1cbiAqIGBgYFxuICpcbiAqIGBgYHNoXG4gKiAkIGRlbm8gcnVuIGh0dHBzOi8vZGVuby5sYW5kL3N0ZC9leGFtcGxlcy9mbGFncy50cyAteCAzIC15IDQgLW41IC1hYmMgLS1iZWVwPWJvb3AgZm9vIGJhciBiYXpcbiAqIHsgXzogWyAnZm9vJywgJ2JhcicsICdiYXonIF0sXG4gKiAgIHg6IDMsXG4gKiAgIHk6IDQsXG4gKiAgIG46IDUsXG4gKiAgIGE6IHRydWUsXG4gKiAgIGI6IHRydWUsXG4gKiAgIGM6IHRydWUsXG4gKiAgIGJlZXA6ICdib29wJyB9XG4gKiBgYGBcbiAqXG4gKiBAbW9kdWxlXG4gKi9cbmltcG9ydCB7IGFzc2VydCB9IGZyb20gXCIuLi9fdXRpbC9hc3NlcnRzLnRzXCI7XG5cbi8qKiBDb21iaW5lcyByZWN1cnNpdmVseSBhbGwgaW50ZXJzZWN0aW9uIHR5cGVzIGFuZCByZXR1cm5zIGEgbmV3IHNpbmdsZSB0eXBlLiAqL1xudHlwZSBJZDxUUmVjb3JkPiA9IFRSZWNvcmQgZXh0ZW5kcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPlxuICA/IFRSZWNvcmQgZXh0ZW5kcyBpbmZlciBJbmZlcnJlZFJlY29yZFxuICAgID8geyBbS2V5IGluIGtleW9mIEluZmVycmVkUmVjb3JkXTogSWQ8SW5mZXJyZWRSZWNvcmRbS2V5XT4gfVxuICA6IG5ldmVyXG4gIDogVFJlY29yZDtcblxuLyoqIENvbnZlcnRzIGEgdW5pb24gdHlwZSBgQSB8IEIgfCBDYCBpbnRvIGFuIGludGVyc2VjdGlvbiB0eXBlIGBBICYgQiAmIENgLiAqL1xudHlwZSBVbmlvblRvSW50ZXJzZWN0aW9uPFRWYWx1ZT4gPVxuICAoVFZhbHVlIGV4dGVuZHMgdW5rbm93biA/IChhcmdzOiBUVmFsdWUpID0+IHVua25vd24gOiBuZXZlcikgZXh0ZW5kc1xuICAgIChhcmdzOiBpbmZlciBSKSA9PiB1bmtub3duID8gUiBleHRlbmRzIFJlY29yZDxzdHJpbmcsIHVua25vd24+ID8gUiA6IG5ldmVyXG4gICAgOiBuZXZlcjtcblxudHlwZSBCb29sZWFuVHlwZSA9IGJvb2xlYW4gfCBzdHJpbmcgfCB1bmRlZmluZWQ7XG50eXBlIFN0cmluZ1R5cGUgPSBzdHJpbmcgfCB1bmRlZmluZWQ7XG50eXBlIEFyZ1R5cGUgPSBTdHJpbmdUeXBlIHwgQm9vbGVhblR5cGU7XG5cbnR5cGUgQ29sbGVjdGFibGUgPSBzdHJpbmcgfCB1bmRlZmluZWQ7XG50eXBlIE5lZ2F0YWJsZSA9IHN0cmluZyB8IHVuZGVmaW5lZDtcblxudHlwZSBVc2VUeXBlczxcbiAgVEJvb2xlYW5zIGV4dGVuZHMgQm9vbGVhblR5cGUsXG4gIFRTdHJpbmdzIGV4dGVuZHMgU3RyaW5nVHlwZSxcbiAgVENvbGxlY3RhYmxlIGV4dGVuZHMgQ29sbGVjdGFibGUsXG4+ID0gdW5kZWZpbmVkIGV4dGVuZHMgKFxuICAmIChmYWxzZSBleHRlbmRzIFRCb29sZWFucyA/IHVuZGVmaW5lZCA6IFRCb29sZWFucylcbiAgJiBUQ29sbGVjdGFibGVcbiAgJiBUU3RyaW5nc1xuKSA/IGZhbHNlXG4gIDogdHJ1ZTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgcmVjb3JkIHdpdGggYWxsIGF2YWlsYWJsZSBmbGFncyB3aXRoIHRoZSBjb3JyZXNwb25kaW5nIHR5cGUgYW5kXG4gKiBkZWZhdWx0IHR5cGUuXG4gKi9cbnR5cGUgVmFsdWVzPFxuICBUQm9vbGVhbnMgZXh0ZW5kcyBCb29sZWFuVHlwZSxcbiAgVFN0cmluZ3MgZXh0ZW5kcyBTdHJpbmdUeXBlLFxuICBUQ29sbGVjdGFibGUgZXh0ZW5kcyBDb2xsZWN0YWJsZSxcbiAgVE5lZ2F0YWJsZSBleHRlbmRzIE5lZ2F0YWJsZSxcbiAgVERlZmF1bHQgZXh0ZW5kcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IHVuZGVmaW5lZCxcbiAgVEFsaWFzZXMgZXh0ZW5kcyBBbGlhc2VzIHwgdW5kZWZpbmVkLFxuPiA9IFVzZVR5cGVzPFRCb29sZWFucywgVFN0cmluZ3MsIFRDb2xsZWN0YWJsZT4gZXh0ZW5kcyB0cnVlID8gXG4gICAgJiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPlxuICAgICYgQWRkQWxpYXNlczxcbiAgICAgIFNwcmVhZERlZmF1bHRzPFxuICAgICAgICAmIENvbGxlY3RWYWx1ZXM8VFN0cmluZ3MsIHN0cmluZywgVENvbGxlY3RhYmxlLCBUTmVnYXRhYmxlPlxuICAgICAgICAmIFJlY3Vyc2l2ZVJlcXVpcmVkPENvbGxlY3RWYWx1ZXM8VEJvb2xlYW5zLCBib29sZWFuLCBUQ29sbGVjdGFibGU+PlxuICAgICAgICAmIENvbGxlY3RVbmtub3duVmFsdWVzPFxuICAgICAgICAgIFRCb29sZWFucyxcbiAgICAgICAgICBUU3RyaW5ncyxcbiAgICAgICAgICBUQ29sbGVjdGFibGUsXG4gICAgICAgICAgVE5lZ2F0YWJsZVxuICAgICAgICA+LFxuICAgICAgICBEZWRvdFJlY29yZDxURGVmYXVsdD5cbiAgICAgID4sXG4gICAgICBUQWxpYXNlc1xuICAgID5cbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgOiBSZWNvcmQ8c3RyaW5nLCBhbnk+O1xuXG50eXBlIEFsaWFzZXM8VEFyZ05hbWVzID0gc3RyaW5nLCBUQWxpYXNOYW1lcyBleHRlbmRzIHN0cmluZyA9IHN0cmluZz4gPSBQYXJ0aWFsPFxuICBSZWNvcmQ8RXh0cmFjdDxUQXJnTmFtZXMsIHN0cmluZz4sIFRBbGlhc05hbWVzIHwgUmVhZG9ubHlBcnJheTxUQWxpYXNOYW1lcz4+XG4+O1xuXG50eXBlIEFkZEFsaWFzZXM8XG4gIFRBcmdzLFxuICBUQWxpYXNlcyBleHRlbmRzIEFsaWFzZXMgfCB1bmRlZmluZWQsXG4+ID0ge1xuICBbVEFyZ05hbWUgaW4ga2V5b2YgVEFyZ3MgYXMgQWxpYXNOYW1lczxUQXJnTmFtZSwgVEFsaWFzZXM+XTogVEFyZ3NbVEFyZ05hbWVdO1xufTtcblxudHlwZSBBbGlhc05hbWVzPFxuICBUQXJnTmFtZSxcbiAgVEFsaWFzZXMgZXh0ZW5kcyBBbGlhc2VzIHwgdW5kZWZpbmVkLFxuPiA9IFRBcmdOYW1lIGV4dGVuZHMga2V5b2YgVEFsaWFzZXNcbiAgPyBzdHJpbmcgZXh0ZW5kcyBUQWxpYXNlc1tUQXJnTmFtZV0gPyBUQXJnTmFtZVxuICA6IFRBbGlhc2VzW1RBcmdOYW1lXSBleHRlbmRzIHN0cmluZyA/IFRBcmdOYW1lIHwgVEFsaWFzZXNbVEFyZ05hbWVdXG4gIDogVEFsaWFzZXNbVEFyZ05hbWVdIGV4dGVuZHMgQXJyYXk8c3RyaW5nPlxuICAgID8gVEFyZ05hbWUgfCBUQWxpYXNlc1tUQXJnTmFtZV1bbnVtYmVyXVxuICA6IFRBcmdOYW1lXG4gIDogVEFyZ05hbWU7XG5cbi8qKlxuICogU3ByZWFkcyBhbGwgZGVmYXVsdCB2YWx1ZXMgb2YgUmVjb3JkIGBURGVmYXVsdHNgIGludG8gUmVjb3JkIGBUQXJnc2BcbiAqIGFuZCBtYWtlcyBkZWZhdWx0IHZhbHVlcyByZXF1aXJlZC5cbiAqXG4gKiAqKkV4YW1wbGU6KipcbiAqIGBTcHJlYWRWYWx1ZXM8eyBmb28/OiBib29sZWFuLCBiYXI/OiBudW1iZXIgfSwgeyBmb286IG51bWJlciB9PmBcbiAqXG4gKiAqKlJlc3VsdDoqKiBgeyBmb286IGJvb2xlYW4gfCBudW1iZXIsIGJhcj86IG51bWJlciB9YFxuICovXG50eXBlIFNwcmVhZERlZmF1bHRzPFRBcmdzLCBURGVmYXVsdHM+ID0gVERlZmF1bHRzIGV4dGVuZHMgdW5kZWZpbmVkID8gVEFyZ3NcbiAgOiBUQXJncyBleHRlbmRzIFJlY29yZDxzdHJpbmcsIHVua25vd24+ID8gXG4gICAgICAmIE9taXQ8VEFyZ3MsIGtleW9mIFREZWZhdWx0cz5cbiAgICAgICYge1xuICAgICAgICBbRGVmYXVsdCBpbiBrZXlvZiBURGVmYXVsdHNdOiBEZWZhdWx0IGV4dGVuZHMga2V5b2YgVEFyZ3NcbiAgICAgICAgICA/IChUQXJnc1tEZWZhdWx0XSAmIFREZWZhdWx0c1tEZWZhdWx0XSB8IFREZWZhdWx0c1tEZWZhdWx0XSkgZXh0ZW5kc1xuICAgICAgICAgICAgUmVjb3JkPHN0cmluZywgdW5rbm93bj5cbiAgICAgICAgICAgID8gTm9uTnVsbGFibGU8U3ByZWFkRGVmYXVsdHM8VEFyZ3NbRGVmYXVsdF0sIFREZWZhdWx0c1tEZWZhdWx0XT4+XG4gICAgICAgICAgOiBURGVmYXVsdHNbRGVmYXVsdF0gfCBOb25OdWxsYWJsZTxUQXJnc1tEZWZhdWx0XT5cbiAgICAgICAgICA6IHVua25vd247XG4gICAgICB9XG4gIDogbmV2ZXI7XG5cbi8qKlxuICogRGVmaW5lcyB0aGUgUmVjb3JkIGZvciB0aGUgYGRlZmF1bHRgIG9wdGlvbiB0byBhZGRcbiAqIGF1dG8tc3VnZ2VzdGlvbiBzdXBwb3J0IGZvciBJREUncy5cbiAqL1xudHlwZSBEZWZhdWx0czxUQm9vbGVhbnMgZXh0ZW5kcyBCb29sZWFuVHlwZSwgVFN0cmluZ3MgZXh0ZW5kcyBTdHJpbmdUeXBlPiA9IElkPFxuICBVbmlvblRvSW50ZXJzZWN0aW9uPFxuICAgICYgUmVjb3JkPHN0cmluZywgdW5rbm93bj5cbiAgICAvLyBEZWRvdHRlZCBhdXRvIHN1Z2dlc3Rpb25zOiB7IGZvbzogeyBiYXI6IHVua25vd24gfSB9XG4gICAgJiBNYXBUeXBlczxUU3RyaW5ncywgdW5rbm93bj5cbiAgICAmIE1hcFR5cGVzPFRCb29sZWFucywgdW5rbm93bj5cbiAgICAvLyBGbGF0IGF1dG8gc3VnZ2VzdGlvbnM6IHsgXCJmb28uYmFyXCI6IHVua25vd24gfVxuICAgICYgTWFwRGVmYXVsdHM8VEJvb2xlYW5zPlxuICAgICYgTWFwRGVmYXVsdHM8VFN0cmluZ3M+XG4gID5cbj47XG5cbnR5cGUgTWFwRGVmYXVsdHM8VEFyZ05hbWVzIGV4dGVuZHMgQXJnVHlwZT4gPSBQYXJ0aWFsPFxuICBSZWNvcmQ8VEFyZ05hbWVzIGV4dGVuZHMgc3RyaW5nID8gVEFyZ05hbWVzIDogc3RyaW5nLCB1bmtub3duPlxuPjtcblxudHlwZSBSZWN1cnNpdmVSZXF1aXJlZDxUUmVjb3JkPiA9IFRSZWNvcmQgZXh0ZW5kcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA/IHtcbiAgICBbS2V5IGluIGtleW9mIFRSZWNvcmRdLT86IFJlY3Vyc2l2ZVJlcXVpcmVkPFRSZWNvcmRbS2V5XT47XG4gIH1cbiAgOiBUUmVjb3JkO1xuXG4vKiogU2FtZSBhcyBgTWFwVHlwZXNgIGJ1dCBhbHNvIHN1cHBvcnRzIGNvbGxlY3RhYmxlIG9wdGlvbnMuICovXG50eXBlIENvbGxlY3RWYWx1ZXM8XG4gIFRBcmdOYW1lcyBleHRlbmRzIEFyZ1R5cGUsXG4gIFRUeXBlLFxuICBUQ29sbGVjdGFibGUgZXh0ZW5kcyBDb2xsZWN0YWJsZSxcbiAgVE5lZ2F0YWJsZSBleHRlbmRzIE5lZ2F0YWJsZSA9IHVuZGVmaW5lZCxcbj4gPSBVbmlvblRvSW50ZXJzZWN0aW9uPFxuICBFeHRyYWN0PFRBcmdOYW1lcywgVENvbGxlY3RhYmxlPiBleHRlbmRzIHN0cmluZyA/IFxuICAgICAgJiAoRXhjbHVkZTxUQXJnTmFtZXMsIFRDb2xsZWN0YWJsZT4gZXh0ZW5kcyBuZXZlciA/IFJlY29yZDxuZXZlciwgbmV2ZXI+XG4gICAgICAgIDogTWFwVHlwZXM8RXhjbHVkZTxUQXJnTmFtZXMsIFRDb2xsZWN0YWJsZT4sIFRUeXBlLCBUTmVnYXRhYmxlPilcbiAgICAgICYgKEV4dHJhY3Q8VEFyZ05hbWVzLCBUQ29sbGVjdGFibGU+IGV4dGVuZHMgbmV2ZXIgPyBSZWNvcmQ8bmV2ZXIsIG5ldmVyPlxuICAgICAgICA6IFJlY3Vyc2l2ZVJlcXVpcmVkPFxuICAgICAgICAgIE1hcFR5cGVzPEV4dHJhY3Q8VEFyZ05hbWVzLCBUQ29sbGVjdGFibGU+LCBBcnJheTxUVHlwZT4sIFROZWdhdGFibGU+XG4gICAgICAgID4pXG4gICAgOiBNYXBUeXBlczxUQXJnTmFtZXMsIFRUeXBlLCBUTmVnYXRhYmxlPlxuPjtcblxuLyoqIFNhbWUgYXMgYFJlY29yZGAgYnV0IGFsc28gc3VwcG9ydHMgZG90dGVkIGFuZCBuZWdhdGFibGUgb3B0aW9ucy4gKi9cbnR5cGUgTWFwVHlwZXM8XG4gIFRBcmdOYW1lcyBleHRlbmRzIEFyZ1R5cGUsXG4gIFRUeXBlLFxuICBUTmVnYXRhYmxlIGV4dGVuZHMgTmVnYXRhYmxlID0gdW5kZWZpbmVkLFxuPiA9IHVuZGVmaW5lZCBleHRlbmRzIFRBcmdOYW1lcyA/IFJlY29yZDxuZXZlciwgbmV2ZXI+XG4gIDogVEFyZ05hbWVzIGV4dGVuZHMgYCR7aW5mZXIgTmFtZX0uJHtpbmZlciBSZXN0fWAgPyB7XG4gICAgICBbS2V5IGluIE5hbWVdPzogTWFwVHlwZXM8XG4gICAgICAgIFJlc3QsXG4gICAgICAgIFRUeXBlLFxuICAgICAgICBUTmVnYXRhYmxlIGV4dGVuZHMgYCR7TmFtZX0uJHtpbmZlciBOZWdhdGV9YCA/IE5lZ2F0ZSA6IHVuZGVmaW5lZFxuICAgICAgPjtcbiAgICB9XG4gIDogVEFyZ05hbWVzIGV4dGVuZHMgc3RyaW5nID8gUGFydGlhbDxcbiAgICAgIFJlY29yZDxUQXJnTmFtZXMsIFROZWdhdGFibGUgZXh0ZW5kcyBUQXJnTmFtZXMgPyBUVHlwZSB8IGZhbHNlIDogVFR5cGU+XG4gICAgPlxuICA6IFJlY29yZDxuZXZlciwgbmV2ZXI+O1xuXG50eXBlIENvbGxlY3RVbmtub3duVmFsdWVzPFxuICBUQm9vbGVhbnMgZXh0ZW5kcyBCb29sZWFuVHlwZSxcbiAgVFN0cmluZ3MgZXh0ZW5kcyBTdHJpbmdUeXBlLFxuICBUQ29sbGVjdGFibGUgZXh0ZW5kcyBDb2xsZWN0YWJsZSxcbiAgVE5lZ2F0YWJsZSBleHRlbmRzIE5lZ2F0YWJsZSxcbj4gPSBVbmlvblRvSW50ZXJzZWN0aW9uPFxuICBUQ29sbGVjdGFibGUgZXh0ZW5kcyBUQm9vbGVhbnMgJiBUU3RyaW5ncyA/IFJlY29yZDxuZXZlciwgbmV2ZXI+XG4gICAgOiBEZWRvdFJlY29yZDxcbiAgICAgIC8vIFVua25vd24gY29sbGVjdGFibGUgJiBub24tbmVnYXRhYmxlIGFyZ3MuXG4gICAgICAmIFJlY29yZDxcbiAgICAgICAgRXhjbHVkZTxcbiAgICAgICAgICBFeHRyYWN0PEV4Y2x1ZGU8VENvbGxlY3RhYmxlLCBUTmVnYXRhYmxlPiwgc3RyaW5nPixcbiAgICAgICAgICBFeHRyYWN0PFRTdHJpbmdzIHwgVEJvb2xlYW5zLCBzdHJpbmc+XG4gICAgICAgID4sXG4gICAgICAgIEFycmF5PHVua25vd24+XG4gICAgICA+XG4gICAgICAvLyBVbmtub3duIGNvbGxlY3RhYmxlICYgbmVnYXRhYmxlIGFyZ3MuXG4gICAgICAmIFJlY29yZDxcbiAgICAgICAgRXhjbHVkZTxcbiAgICAgICAgICBFeHRyYWN0PEV4dHJhY3Q8VENvbGxlY3RhYmxlLCBUTmVnYXRhYmxlPiwgc3RyaW5nPixcbiAgICAgICAgICBFeHRyYWN0PFRTdHJpbmdzIHwgVEJvb2xlYW5zLCBzdHJpbmc+XG4gICAgICAgID4sXG4gICAgICAgIEFycmF5PHVua25vd24+IHwgZmFsc2VcbiAgICAgID5cbiAgICA+XG4+O1xuXG4vKiogQ29udmVydHMgYHsgXCJmb28uYmFyLmJhelwiOiB1bmtub3duIH1gIGludG8gYHsgZm9vOiB7IGJhcjogeyBiYXo6IHVua25vd24gfSB9IH1gLiAqL1xudHlwZSBEZWRvdFJlY29yZDxUUmVjb3JkPiA9IFJlY29yZDxzdHJpbmcsIHVua25vd24+IGV4dGVuZHMgVFJlY29yZCA/IFRSZWNvcmRcbiAgOiBUUmVjb3JkIGV4dGVuZHMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPyBVbmlvblRvSW50ZXJzZWN0aW9uPFxuICAgICAgVmFsdWVPZjxcbiAgICAgICAge1xuICAgICAgICAgIFtLZXkgaW4ga2V5b2YgVFJlY29yZF06IEtleSBleHRlbmRzIHN0cmluZyA/IERlZG90PEtleSwgVFJlY29yZFtLZXldPlxuICAgICAgICAgICAgOiBuZXZlcjtcbiAgICAgICAgfVxuICAgICAgPlxuICAgID5cbiAgOiBUUmVjb3JkO1xuXG50eXBlIERlZG90PFRLZXkgZXh0ZW5kcyBzdHJpbmcsIFRWYWx1ZT4gPSBUS2V5IGV4dGVuZHNcbiAgYCR7aW5mZXIgTmFtZX0uJHtpbmZlciBSZXN0fWAgPyB7IFtLZXkgaW4gTmFtZV06IERlZG90PFJlc3QsIFRWYWx1ZT4gfVxuICA6IHsgW0tleSBpbiBUS2V5XTogVFZhbHVlIH07XG5cbnR5cGUgVmFsdWVPZjxUVmFsdWU+ID0gVFZhbHVlW2tleW9mIFRWYWx1ZV07XG5cbi8qKiBUaGUgdmFsdWUgcmV0dXJuZWQgZnJvbSBgcGFyc2VgLiAqL1xuZXhwb3J0IHR5cGUgQXJnczxcbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgVEFyZ3MgZXh0ZW5kcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IFJlY29yZDxzdHJpbmcsIGFueT4sXG4gIFREb3VibGVEYXNoIGV4dGVuZHMgYm9vbGVhbiB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcbj4gPSBJZDxcbiAgJiBUQXJnc1xuICAmIHtcbiAgICAvKiogQ29udGFpbnMgYWxsIHRoZSBhcmd1bWVudHMgdGhhdCBkaWRuJ3QgaGF2ZSBhbiBvcHRpb24gYXNzb2NpYXRlZCB3aXRoXG4gICAgICogdGhlbS4gKi9cbiAgICBfOiBBcnJheTxzdHJpbmcgfCBudW1iZXI+O1xuICB9XG4gICYgKGJvb2xlYW4gZXh0ZW5kcyBURG91YmxlRGFzaCA/IERvdWJsZURhc2hcbiAgICA6IHRydWUgZXh0ZW5kcyBURG91YmxlRGFzaCA/IFJlcXVpcmVkPERvdWJsZURhc2g+XG4gICAgOiBSZWNvcmQ8bmV2ZXIsIG5ldmVyPilcbj47XG5cbnR5cGUgRG91YmxlRGFzaCA9IHtcbiAgLyoqIENvbnRhaW5zIGFsbCB0aGUgYXJndW1lbnRzIHRoYXQgYXBwZWFyIGFmdGVyIHRoZSBkb3VibGUgZGFzaDogXCItLVwiLiAqL1xuICBcIi0tXCI/OiBBcnJheTxzdHJpbmc+O1xufTtcblxuLyoqIFRoZSBvcHRpb25zIGZvciB0aGUgYHBhcnNlYCBjYWxsLiAqL1xuZXhwb3J0IGludGVyZmFjZSBQYXJzZU9wdGlvbnM8XG4gIFRCb29sZWFucyBleHRlbmRzIEJvb2xlYW5UeXBlID0gQm9vbGVhblR5cGUsXG4gIFRTdHJpbmdzIGV4dGVuZHMgU3RyaW5nVHlwZSA9IFN0cmluZ1R5cGUsXG4gIFRDb2xsZWN0YWJsZSBleHRlbmRzIENvbGxlY3RhYmxlID0gQ29sbGVjdGFibGUsXG4gIFROZWdhdGFibGUgZXh0ZW5kcyBOZWdhdGFibGUgPSBOZWdhdGFibGUsXG4gIFREZWZhdWx0IGV4dGVuZHMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCB1bmRlZmluZWQgPVxuICAgIHwgUmVjb3JkPHN0cmluZywgdW5rbm93bj5cbiAgICB8IHVuZGVmaW5lZCxcbiAgVEFsaWFzZXMgZXh0ZW5kcyBBbGlhc2VzIHwgdW5kZWZpbmVkID0gQWxpYXNlcyB8IHVuZGVmaW5lZCxcbiAgVERvdWJsZURhc2ggZXh0ZW5kcyBib29sZWFuIHwgdW5kZWZpbmVkID0gYm9vbGVhbiB8IHVuZGVmaW5lZCxcbj4ge1xuICAvKipcbiAgICogV2hlbiBgdHJ1ZWAsIHBvcHVsYXRlIHRoZSByZXN1bHQgYF9gIHdpdGggZXZlcnl0aGluZyBiZWZvcmUgdGhlIGAtLWAgYW5kXG4gICAqIHRoZSByZXN1bHQgYFsnLS0nXWAgd2l0aCBldmVyeXRoaW5nIGFmdGVyIHRoZSBgLS1gLlxuICAgKlxuICAgKiBAZGVmYXVsdCB7ZmFsc2V9XG4gICAqXG4gICAqICBAZXhhbXBsZVxuICAgKiBgYGB0c1xuICAgKiAvLyAkIGRlbm8gcnVuIGV4YW1wbGUudHMgLS0gYSBhcmcxXG4gICAqIGltcG9ydCB7IHBhcnNlIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vZmxhZ3MvbW9kLnRzXCI7XG4gICAqIGNvbnNvbGUuZGlyKHBhcnNlKERlbm8uYXJncywgeyBcIi0tXCI6IGZhbHNlIH0pKTtcbiAgICogLy8gb3V0cHV0OiB7IF86IFsgXCJhXCIsIFwiYXJnMVwiIF0gfVxuICAgKiBjb25zb2xlLmRpcihwYXJzZShEZW5vLmFyZ3MsIHsgXCItLVwiOiB0cnVlIH0pKTtcbiAgICogLy8gb3V0cHV0OiB7IF86IFtdLCAtLTogWyBcImFcIiwgXCJhcmcxXCIgXSB9XG4gICAqIGBgYFxuICAgKi9cbiAgXCItLVwiPzogVERvdWJsZURhc2g7XG5cbiAgLyoqXG4gICAqIEFuIG9iamVjdCBtYXBwaW5nIHN0cmluZyBuYW1lcyB0byBzdHJpbmdzIG9yIGFycmF5cyBvZiBzdHJpbmcgYXJndW1lbnRcbiAgICogbmFtZXMgdG8gdXNlIGFzIGFsaWFzZXMuXG4gICAqL1xuICBhbGlhcz86IFRBbGlhc2VzO1xuXG4gIC8qKlxuICAgKiBBIGJvb2xlYW4sIHN0cmluZyBvciBhcnJheSBvZiBzdHJpbmdzIHRvIGFsd2F5cyB0cmVhdCBhcyBib29sZWFucy4gSWZcbiAgICogYHRydWVgIHdpbGwgdHJlYXQgYWxsIGRvdWJsZSBoeXBoZW5hdGVkIGFyZ3VtZW50cyB3aXRob3V0IGVxdWFsIHNpZ25zIGFzXG4gICAqIGBib29sZWFuYCAoZS5nLiBhZmZlY3RzIGAtLWZvb2AsIG5vdCBgLWZgIG9yIGAtLWZvbz1iYXJgKS5cbiAgICogIEFsbCBgYm9vbGVhbmAgYXJndW1lbnRzIHdpbGwgYmUgc2V0IHRvIGBmYWxzZWAgYnkgZGVmYXVsdC5cbiAgICovXG4gIGJvb2xlYW4/OiBUQm9vbGVhbnMgfCBSZWFkb25seUFycmF5PEV4dHJhY3Q8VEJvb2xlYW5zLCBzdHJpbmc+PjtcblxuICAvKiogQW4gb2JqZWN0IG1hcHBpbmcgc3RyaW5nIGFyZ3VtZW50IG5hbWVzIHRvIGRlZmF1bHQgdmFsdWVzLiAqL1xuICBkZWZhdWx0PzogVERlZmF1bHQgJiBEZWZhdWx0czxUQm9vbGVhbnMsIFRTdHJpbmdzPjtcblxuICAvKipcbiAgICogV2hlbiBgdHJ1ZWAsIHBvcHVsYXRlIHRoZSByZXN1bHQgYF9gIHdpdGggZXZlcnl0aGluZyBhZnRlciB0aGUgZmlyc3RcbiAgICogbm9uLW9wdGlvbi5cbiAgICovXG4gIHN0b3BFYXJseT86IGJvb2xlYW47XG5cbiAgLyoqIEEgc3RyaW5nIG9yIGFycmF5IG9mIHN0cmluZ3MgYXJndW1lbnQgbmFtZXMgdG8gYWx3YXlzIHRyZWF0IGFzIHN0cmluZ3MuICovXG4gIHN0cmluZz86IFRTdHJpbmdzIHwgUmVhZG9ubHlBcnJheTxFeHRyYWN0PFRTdHJpbmdzLCBzdHJpbmc+PjtcblxuICAvKipcbiAgICogQSBzdHJpbmcgb3IgYXJyYXkgb2Ygc3RyaW5ncyBhcmd1bWVudCBuYW1lcyB0byBhbHdheXMgdHJlYXQgYXMgYXJyYXlzLlxuICAgKiBDb2xsZWN0YWJsZSBvcHRpb25zIGNhbiBiZSB1c2VkIG11bHRpcGxlIHRpbWVzLiBBbGwgdmFsdWVzIHdpbGwgYmVcbiAgICogY29sbGVjdGVkIGludG8gb25lIGFycmF5LiBJZiBhIG5vbi1jb2xsZWN0YWJsZSBvcHRpb24gaXMgdXNlZCBtdWx0aXBsZVxuICAgKiB0aW1lcywgdGhlIGxhc3QgdmFsdWUgaXMgdXNlZC5cbiAgICogQWxsIENvbGxlY3RhYmxlIGFyZ3VtZW50cyB3aWxsIGJlIHNldCB0byBgW11gIGJ5IGRlZmF1bHQuXG4gICAqL1xuICBjb2xsZWN0PzogVENvbGxlY3RhYmxlIHwgUmVhZG9ubHlBcnJheTxFeHRyYWN0PFRDb2xsZWN0YWJsZSwgc3RyaW5nPj47XG5cbiAgLyoqXG4gICAqIEEgc3RyaW5nIG9yIGFycmF5IG9mIHN0cmluZ3MgYXJndW1lbnQgbmFtZXMgd2hpY2ggY2FuIGJlIG5lZ2F0ZWRcbiAgICogYnkgcHJlZml4aW5nIHRoZW0gd2l0aCBgLS1uby1gLCBsaWtlIGAtLW5vLWNvbmZpZ2AuXG4gICAqL1xuICBuZWdhdGFibGU/OiBUTmVnYXRhYmxlIHwgUmVhZG9ubHlBcnJheTxFeHRyYWN0PFROZWdhdGFibGUsIHN0cmluZz4+O1xuXG4gIC8qKlxuICAgKiBBIGZ1bmN0aW9uIHdoaWNoIGlzIGludm9rZWQgd2l0aCBhIGNvbW1hbmQgbGluZSBwYXJhbWV0ZXIgbm90IGRlZmluZWQgaW5cbiAgICogdGhlIGBvcHRpb25zYCBjb25maWd1cmF0aW9uIG9iamVjdC4gSWYgdGhlIGZ1bmN0aW9uIHJldHVybnMgYGZhbHNlYCwgdGhlXG4gICAqIHVua25vd24gb3B0aW9uIGlzIG5vdCBhZGRlZCB0byBgcGFyc2VkQXJnc2AuXG4gICAqL1xuICB1bmtub3duPzogKGFyZzogc3RyaW5nLCBrZXk/OiBzdHJpbmcsIHZhbHVlPzogdW5rbm93bikgPT4gdW5rbm93bjtcbn1cblxuaW50ZXJmYWNlIEZsYWdzIHtcbiAgYm9vbHM6IFJlY29yZDxzdHJpbmcsIGJvb2xlYW4+O1xuICBzdHJpbmdzOiBSZWNvcmQ8c3RyaW5nLCBib29sZWFuPjtcbiAgY29sbGVjdDogUmVjb3JkPHN0cmluZywgYm9vbGVhbj47XG4gIG5lZ2F0YWJsZTogUmVjb3JkPHN0cmluZywgYm9vbGVhbj47XG4gIHVua25vd25GbjogKGFyZzogc3RyaW5nLCBrZXk/OiBzdHJpbmcsIHZhbHVlPzogdW5rbm93bikgPT4gdW5rbm93bjtcbiAgYWxsQm9vbHM6IGJvb2xlYW47XG59XG5cbmludGVyZmFjZSBOZXN0ZWRNYXBwaW5nIHtcbiAgW2tleTogc3RyaW5nXTogTmVzdGVkTWFwcGluZyB8IHVua25vd247XG59XG5cbmNvbnN0IHsgaGFzT3duIH0gPSBPYmplY3Q7XG5cbmZ1bmN0aW9uIGdldDxUVmFsdWU+KFxuICBvYmo6IFJlY29yZDxzdHJpbmcsIFRWYWx1ZT4sXG4gIGtleTogc3RyaW5nLFxuKTogVFZhbHVlIHwgdW5kZWZpbmVkIHtcbiAgaWYgKGhhc093bihvYmosIGtleSkpIHtcbiAgICByZXR1cm4gb2JqW2tleV07XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0Rm9yY2U8VFZhbHVlPihvYmo6IFJlY29yZDxzdHJpbmcsIFRWYWx1ZT4sIGtleTogc3RyaW5nKTogVFZhbHVlIHtcbiAgY29uc3QgdiA9IGdldChvYmosIGtleSk7XG4gIGFzc2VydCh2ICE9IG51bGwpO1xuICByZXR1cm4gdjtcbn1cblxuZnVuY3Rpb24gaXNOdW1iZXIoeDogdW5rbm93bik6IGJvb2xlYW4ge1xuICBpZiAodHlwZW9mIHggPT09IFwibnVtYmVyXCIpIHJldHVybiB0cnVlO1xuICBpZiAoL14weFswLTlhLWZdKyQvaS50ZXN0KFN0cmluZyh4KSkpIHJldHVybiB0cnVlO1xuICByZXR1cm4gL15bLStdPyg/OlxcZCsoPzpcXC5cXGQqKT98XFwuXFxkKykoZVstK10/XFxkKyk/JC8udGVzdChTdHJpbmcoeCkpO1xufVxuXG5mdW5jdGlvbiBoYXNLZXkob2JqOiBOZXN0ZWRNYXBwaW5nLCBrZXlzOiBzdHJpbmdbXSk6IGJvb2xlYW4ge1xuICBsZXQgbyA9IG9iajtcbiAga2V5cy5zbGljZSgwLCAtMSkuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgbyA9IChnZXQobywga2V5KSA/PyB7fSkgYXMgTmVzdGVkTWFwcGluZztcbiAgfSk7XG5cbiAgY29uc3Qga2V5ID0ga2V5c1trZXlzLmxlbmd0aCAtIDFdO1xuICByZXR1cm4gaGFzT3duKG8sIGtleSk7XG59XG5cbi8qKiBUYWtlIGEgc2V0IG9mIGNvbW1hbmQgbGluZSBhcmd1bWVudHMsIG9wdGlvbmFsbHkgd2l0aCBhIHNldCBvZiBvcHRpb25zLCBhbmRcbiAqIHJldHVybiBhbiBvYmplY3QgcmVwcmVzZW50aW5nIHRoZSBmbGFncyBmb3VuZCBpbiB0aGUgcGFzc2VkIGFyZ3VtZW50cy5cbiAqXG4gKiBCeSBkZWZhdWx0LCBhbnkgYXJndW1lbnRzIHN0YXJ0aW5nIHdpdGggYC1gIG9yIGAtLWAgYXJlIGNvbnNpZGVyZWQgYm9vbGVhblxuICogZmxhZ3MuIElmIHRoZSBhcmd1bWVudCBuYW1lIGlzIGZvbGxvd2VkIGJ5IGFuIGVxdWFsIHNpZ24gKGA9YCkgaXQgaXNcbiAqIGNvbnNpZGVyZWQgYSBrZXktdmFsdWUgcGFpci4gQW55IGFyZ3VtZW50cyB3aGljaCBjb3VsZCBub3QgYmUgcGFyc2VkIGFyZVxuICogYXZhaWxhYmxlIGluIHRoZSBgX2AgcHJvcGVydHkgb2YgdGhlIHJldHVybmVkIG9iamVjdC5cbiAqXG4gKiBCeSBkZWZhdWx0LCB0aGUgZmxhZ3MgbW9kdWxlIHRyaWVzIHRvIGRldGVybWluZSB0aGUgdHlwZSBvZiBhbGwgYXJndW1lbnRzXG4gKiBhdXRvbWF0aWNhbGx5IGFuZCB0aGUgcmV0dXJuIHR5cGUgb2YgdGhlIGBwYXJzZWAgbWV0aG9kIHdpbGwgaGF2ZSBhbiBpbmRleFxuICogc2lnbmF0dXJlIHdpdGggYGFueWAgYXMgdmFsdWUgKGB7IFt4OiBzdHJpbmddOiBhbnkgfWApLlxuICpcbiAqIElmIHRoZSBgc3RyaW5nYCwgYGJvb2xlYW5gIG9yIGBjb2xsZWN0YCBvcHRpb24gaXMgc2V0LCB0aGUgcmV0dXJuIHZhbHVlIG9mXG4gKiB0aGUgYHBhcnNlYCBtZXRob2Qgd2lsbCBiZSBmdWxseSB0eXBlZCBhbmQgdGhlIGluZGV4IHNpZ25hdHVyZSBvZiB0aGUgcmV0dXJuXG4gKiB0eXBlIHdpbGwgY2hhbmdlIHRvIGB7IFt4OiBzdHJpbmddOiB1bmtub3duIH1gLlxuICpcbiAqIEFueSBhcmd1bWVudHMgYWZ0ZXIgYCctLSdgIHdpbGwgbm90IGJlIHBhcnNlZCBhbmQgd2lsbCBlbmQgdXAgaW4gYHBhcnNlZEFyZ3MuX2AuXG4gKlxuICogTnVtZXJpYy1sb29raW5nIGFyZ3VtZW50cyB3aWxsIGJlIHJldHVybmVkIGFzIG51bWJlcnMgdW5sZXNzIGBvcHRpb25zLnN0cmluZ2BcbiAqIG9yIGBvcHRpb25zLmJvb2xlYW5gIGlzIHNldCBmb3IgdGhhdCBhcmd1bWVudCBuYW1lLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgcGFyc2UgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9mbGFncy9tb2QudHNcIjtcbiAqIGNvbnN0IHBhcnNlZEFyZ3MgPSBwYXJzZShEZW5vLmFyZ3MpO1xuICogYGBgXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBwYXJzZSB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2ZsYWdzL21vZC50c1wiO1xuICogY29uc3QgcGFyc2VkQXJncyA9IHBhcnNlKFtcIi0tZm9vXCIsIFwiLS1iYXI9YmF6XCIsIFwiLi9xdXV4LnR4dFwiXSk7XG4gKiAvLyBwYXJzZWRBcmdzOiB7IGZvbzogdHJ1ZSwgYmFyOiBcImJhelwiLCBfOiBbXCIuL3F1dXgudHh0XCJdIH1cbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2U8XG4gIFRBcmdzIGV4dGVuZHMgVmFsdWVzPFxuICAgIFRCb29sZWFucyxcbiAgICBUU3RyaW5ncyxcbiAgICBUQ29sbGVjdGFibGUsXG4gICAgVE5lZ2F0YWJsZSxcbiAgICBURGVmYXVsdHMsXG4gICAgVEFsaWFzZXNcbiAgPixcbiAgVERvdWJsZURhc2ggZXh0ZW5kcyBib29sZWFuIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxuICBUQm9vbGVhbnMgZXh0ZW5kcyBCb29sZWFuVHlwZSA9IHVuZGVmaW5lZCxcbiAgVFN0cmluZ3MgZXh0ZW5kcyBTdHJpbmdUeXBlID0gdW5kZWZpbmVkLFxuICBUQ29sbGVjdGFibGUgZXh0ZW5kcyBDb2xsZWN0YWJsZSA9IHVuZGVmaW5lZCxcbiAgVE5lZ2F0YWJsZSBleHRlbmRzIE5lZ2F0YWJsZSA9IHVuZGVmaW5lZCxcbiAgVERlZmF1bHRzIGV4dGVuZHMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXG4gIFRBbGlhc2VzIGV4dGVuZHMgQWxpYXNlczxUQWxpYXNBcmdOYW1lcywgVEFsaWFzTmFtZXM+IHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxuICBUQWxpYXNBcmdOYW1lcyBleHRlbmRzIHN0cmluZyA9IHN0cmluZyxcbiAgVEFsaWFzTmFtZXMgZXh0ZW5kcyBzdHJpbmcgPSBzdHJpbmcsXG4+KFxuICBhcmdzOiBzdHJpbmdbXSxcbiAge1xuICAgIFwiLS1cIjogZG91YmxlRGFzaCA9IGZhbHNlLFxuICAgIGFsaWFzID0ge30gYXMgTm9uTnVsbGFibGU8VEFsaWFzZXM+LFxuICAgIGJvb2xlYW4gPSBmYWxzZSxcbiAgICBkZWZhdWx0OiBkZWZhdWx0cyA9IHt9IGFzIFREZWZhdWx0cyAmIERlZmF1bHRzPFRCb29sZWFucywgVFN0cmluZ3M+LFxuICAgIHN0b3BFYXJseSA9IGZhbHNlLFxuICAgIHN0cmluZyA9IFtdLFxuICAgIGNvbGxlY3QgPSBbXSxcbiAgICBuZWdhdGFibGUgPSBbXSxcbiAgICB1bmtub3duID0gKGk6IHN0cmluZyk6IHVua25vd24gPT4gaSxcbiAgfTogUGFyc2VPcHRpb25zPFxuICAgIFRCb29sZWFucyxcbiAgICBUU3RyaW5ncyxcbiAgICBUQ29sbGVjdGFibGUsXG4gICAgVE5lZ2F0YWJsZSxcbiAgICBURGVmYXVsdHMsXG4gICAgVEFsaWFzZXMsXG4gICAgVERvdWJsZURhc2hcbiAgPiA9IHt9LFxuKTogQXJnczxUQXJncywgVERvdWJsZURhc2g+IHtcbiAgY29uc3QgYWxpYXNlczogUmVjb3JkPHN0cmluZywgc3RyaW5nW10+ID0ge307XG4gIGNvbnN0IGZsYWdzOiBGbGFncyA9IHtcbiAgICBib29sczoge30sXG4gICAgc3RyaW5nczoge30sXG4gICAgdW5rbm93bkZuOiB1bmtub3duLFxuICAgIGFsbEJvb2xzOiBmYWxzZSxcbiAgICBjb2xsZWN0OiB7fSxcbiAgICBuZWdhdGFibGU6IHt9LFxuICB9O1xuXG4gIGlmIChhbGlhcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgZm9yIChjb25zdCBrZXkgaW4gYWxpYXMpIHtcbiAgICAgIGNvbnN0IHZhbCA9IGdldEZvcmNlKGFsaWFzLCBrZXkpO1xuICAgICAgaWYgKHR5cGVvZiB2YWwgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgYWxpYXNlc1trZXldID0gW3ZhbF07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhbGlhc2VzW2tleV0gPSB2YWwgYXMgQXJyYXk8c3RyaW5nPjtcbiAgICAgIH1cbiAgICAgIGZvciAoY29uc3QgYWxpYXMgb2YgZ2V0Rm9yY2UoYWxpYXNlcywga2V5KSkge1xuICAgICAgICBhbGlhc2VzW2FsaWFzXSA9IFtrZXldLmNvbmNhdChhbGlhc2VzW2tleV0uZmlsdGVyKCh5KSA9PiBhbGlhcyAhPT0geSkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmIChib29sZWFuICE9PSB1bmRlZmluZWQpIHtcbiAgICBpZiAodHlwZW9mIGJvb2xlYW4gPT09IFwiYm9vbGVhblwiKSB7XG4gICAgICBmbGFncy5hbGxCb29scyA9ICEhYm9vbGVhbjtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgYm9vbGVhbkFyZ3M6IFJlYWRvbmx5QXJyYXk8c3RyaW5nPiA9IHR5cGVvZiBib29sZWFuID09PSBcInN0cmluZ1wiXG4gICAgICAgID8gW2Jvb2xlYW5dXG4gICAgICAgIDogYm9vbGVhbjtcblxuICAgICAgZm9yIChjb25zdCBrZXkgb2YgYm9vbGVhbkFyZ3MuZmlsdGVyKEJvb2xlYW4pKSB7XG4gICAgICAgIGZsYWdzLmJvb2xzW2tleV0gPSB0cnVlO1xuICAgICAgICBjb25zdCBhbGlhcyA9IGdldChhbGlhc2VzLCBrZXkpO1xuICAgICAgICBpZiAoYWxpYXMpIHtcbiAgICAgICAgICBmb3IgKGNvbnN0IGFsIG9mIGFsaWFzKSB7XG4gICAgICAgICAgICBmbGFncy5ib29sc1thbF0gPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmIChzdHJpbmcgIT09IHVuZGVmaW5lZCkge1xuICAgIGNvbnN0IHN0cmluZ0FyZ3M6IFJlYWRvbmx5QXJyYXk8c3RyaW5nPiA9IHR5cGVvZiBzdHJpbmcgPT09IFwic3RyaW5nXCJcbiAgICAgID8gW3N0cmluZ11cbiAgICAgIDogc3RyaW5nO1xuXG4gICAgZm9yIChjb25zdCBrZXkgb2Ygc3RyaW5nQXJncy5maWx0ZXIoQm9vbGVhbikpIHtcbiAgICAgIGZsYWdzLnN0cmluZ3Nba2V5XSA9IHRydWU7XG4gICAgICBjb25zdCBhbGlhcyA9IGdldChhbGlhc2VzLCBrZXkpO1xuICAgICAgaWYgKGFsaWFzKSB7XG4gICAgICAgIGZvciAoY29uc3QgYWwgb2YgYWxpYXMpIHtcbiAgICAgICAgICBmbGFncy5zdHJpbmdzW2FsXSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAoY29sbGVjdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgY29uc3QgY29sbGVjdEFyZ3M6IFJlYWRvbmx5QXJyYXk8c3RyaW5nPiA9IHR5cGVvZiBjb2xsZWN0ID09PSBcInN0cmluZ1wiXG4gICAgICA/IFtjb2xsZWN0XVxuICAgICAgOiBjb2xsZWN0O1xuXG4gICAgZm9yIChjb25zdCBrZXkgb2YgY29sbGVjdEFyZ3MuZmlsdGVyKEJvb2xlYW4pKSB7XG4gICAgICBmbGFncy5jb2xsZWN0W2tleV0gPSB0cnVlO1xuICAgICAgY29uc3QgYWxpYXMgPSBnZXQoYWxpYXNlcywga2V5KTtcbiAgICAgIGlmIChhbGlhcykge1xuICAgICAgICBmb3IgKGNvbnN0IGFsIG9mIGFsaWFzKSB7XG4gICAgICAgICAgZmxhZ3MuY29sbGVjdFthbF0gPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKG5lZ2F0YWJsZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgY29uc3QgbmVnYXRhYmxlQXJnczogUmVhZG9ubHlBcnJheTxzdHJpbmc+ID0gdHlwZW9mIG5lZ2F0YWJsZSA9PT0gXCJzdHJpbmdcIlxuICAgICAgPyBbbmVnYXRhYmxlXVxuICAgICAgOiBuZWdhdGFibGU7XG5cbiAgICBmb3IgKGNvbnN0IGtleSBvZiBuZWdhdGFibGVBcmdzLmZpbHRlcihCb29sZWFuKSkge1xuICAgICAgZmxhZ3MubmVnYXRhYmxlW2tleV0gPSB0cnVlO1xuICAgICAgY29uc3QgYWxpYXMgPSBnZXQoYWxpYXNlcywga2V5KTtcbiAgICAgIGlmIChhbGlhcykge1xuICAgICAgICBmb3IgKGNvbnN0IGFsIG9mIGFsaWFzKSB7XG4gICAgICAgICAgZmxhZ3MubmVnYXRhYmxlW2FsXSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBjb25zdCBhcmd2OiBBcmdzID0geyBfOiBbXSB9O1xuXG4gIGZ1bmN0aW9uIGFyZ0RlZmluZWQoa2V5OiBzdHJpbmcsIGFyZzogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIChcbiAgICAgIChmbGFncy5hbGxCb29scyAmJiAvXi0tW149XSskLy50ZXN0KGFyZykpIHx8XG4gICAgICBnZXQoZmxhZ3MuYm9vbHMsIGtleSkgfHxcbiAgICAgICEhZ2V0KGZsYWdzLnN0cmluZ3MsIGtleSkgfHxcbiAgICAgICEhZ2V0KGFsaWFzZXMsIGtleSlcbiAgICApO1xuICB9XG5cbiAgZnVuY3Rpb24gc2V0S2V5KFxuICAgIG9iajogTmVzdGVkTWFwcGluZyxcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgdmFsdWU6IHVua25vd24sXG4gICAgY29sbGVjdCA9IHRydWUsXG4gICkge1xuICAgIGxldCBvID0gb2JqO1xuICAgIGNvbnN0IGtleXMgPSBuYW1lLnNwbGl0KFwiLlwiKTtcbiAgICBrZXlzLnNsaWNlKDAsIC0xKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgIGlmIChnZXQobywga2V5KSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIG9ba2V5XSA9IHt9O1xuICAgICAgfVxuICAgICAgbyA9IGdldChvLCBrZXkpIGFzIE5lc3RlZE1hcHBpbmc7XG4gICAgfSk7XG5cbiAgICBjb25zdCBrZXkgPSBrZXlzW2tleXMubGVuZ3RoIC0gMV07XG4gICAgY29uc3QgY29sbGVjdGFibGUgPSBjb2xsZWN0ICYmICEhZ2V0KGZsYWdzLmNvbGxlY3QsIG5hbWUpO1xuXG4gICAgaWYgKCFjb2xsZWN0YWJsZSkge1xuICAgICAgb1trZXldID0gdmFsdWU7XG4gICAgfSBlbHNlIGlmIChnZXQobywga2V5KSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBvW2tleV0gPSBbdmFsdWVdO1xuICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShnZXQobywga2V5KSkpIHtcbiAgICAgIChvW2tleV0gYXMgdW5rbm93bltdKS5wdXNoKHZhbHVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb1trZXldID0gW2dldChvLCBrZXkpLCB2YWx1ZV07XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc2V0QXJnKFxuICAgIGtleTogc3RyaW5nLFxuICAgIHZhbDogdW5rbm93bixcbiAgICBhcmc6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcbiAgICBjb2xsZWN0PzogYm9vbGVhbixcbiAgKSB7XG4gICAgaWYgKGFyZyAmJiBmbGFncy51bmtub3duRm4gJiYgIWFyZ0RlZmluZWQoa2V5LCBhcmcpKSB7XG4gICAgICBpZiAoZmxhZ3MudW5rbm93bkZuKGFyZywga2V5LCB2YWwpID09PSBmYWxzZSkgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHZhbHVlID0gIWdldChmbGFncy5zdHJpbmdzLCBrZXkpICYmIGlzTnVtYmVyKHZhbCkgPyBOdW1iZXIodmFsKSA6IHZhbDtcbiAgICBzZXRLZXkoYXJndiwga2V5LCB2YWx1ZSwgY29sbGVjdCk7XG5cbiAgICBjb25zdCBhbGlhcyA9IGdldChhbGlhc2VzLCBrZXkpO1xuICAgIGlmIChhbGlhcykge1xuICAgICAgZm9yIChjb25zdCB4IG9mIGFsaWFzKSB7XG4gICAgICAgIHNldEtleShhcmd2LCB4LCB2YWx1ZSwgY29sbGVjdCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gYWxpYXNJc0Jvb2xlYW4oa2V5OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gZ2V0Rm9yY2UoYWxpYXNlcywga2V5KS5zb21lKFxuICAgICAgKHgpID0+IHR5cGVvZiBnZXQoZmxhZ3MuYm9vbHMsIHgpID09PSBcImJvb2xlYW5cIixcbiAgICApO1xuICB9XG5cbiAgbGV0IG5vdEZsYWdzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIC8vIGFsbCBhcmdzIGFmdGVyIFwiLS1cIiBhcmUgbm90IHBhcnNlZFxuICBpZiAoYXJncy5pbmNsdWRlcyhcIi0tXCIpKSB7XG4gICAgbm90RmxhZ3MgPSBhcmdzLnNsaWNlKGFyZ3MuaW5kZXhPZihcIi0tXCIpICsgMSk7XG4gICAgYXJncyA9IGFyZ3Muc2xpY2UoMCwgYXJncy5pbmRleE9mKFwiLS1cIikpO1xuICB9XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgYXJnID0gYXJnc1tpXTtcblxuICAgIGlmICgvXi0tLis9Ly50ZXN0KGFyZykpIHtcbiAgICAgIGNvbnN0IG0gPSBhcmcubWF0Y2goL14tLShbXj1dKyk9KC4qKSQvcyk7XG4gICAgICBhc3NlcnQobSAhPSBudWxsKTtcbiAgICAgIGNvbnN0IFssIGtleSwgdmFsdWVdID0gbTtcblxuICAgICAgaWYgKGZsYWdzLmJvb2xzW2tleV0pIHtcbiAgICAgICAgY29uc3QgYm9vbGVhblZhbHVlID0gdmFsdWUgIT09IFwiZmFsc2VcIjtcbiAgICAgICAgc2V0QXJnKGtleSwgYm9vbGVhblZhbHVlLCBhcmcpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0QXJnKGtleSwgdmFsdWUsIGFyZyk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChcbiAgICAgIC9eLS1uby0uKy8udGVzdChhcmcpICYmIGdldChmbGFncy5uZWdhdGFibGUsIGFyZy5yZXBsYWNlKC9eLS1uby0vLCBcIlwiKSlcbiAgICApIHtcbiAgICAgIGNvbnN0IG0gPSBhcmcubWF0Y2goL14tLW5vLSguKykvKTtcbiAgICAgIGFzc2VydChtICE9IG51bGwpO1xuICAgICAgc2V0QXJnKG1bMV0sIGZhbHNlLCBhcmcsIGZhbHNlKTtcbiAgICB9IGVsc2UgaWYgKC9eLS0uKy8udGVzdChhcmcpKSB7XG4gICAgICBjb25zdCBtID0gYXJnLm1hdGNoKC9eLS0oLispLyk7XG4gICAgICBhc3NlcnQobSAhPSBudWxsKTtcbiAgICAgIGNvbnN0IFssIGtleV0gPSBtO1xuICAgICAgY29uc3QgbmV4dCA9IGFyZ3NbaSArIDFdO1xuICAgICAgaWYgKFxuICAgICAgICBuZXh0ICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgIS9eLS8udGVzdChuZXh0KSAmJlxuICAgICAgICAhZ2V0KGZsYWdzLmJvb2xzLCBrZXkpICYmXG4gICAgICAgICFmbGFncy5hbGxCb29scyAmJlxuICAgICAgICAoZ2V0KGFsaWFzZXMsIGtleSkgPyAhYWxpYXNJc0Jvb2xlYW4oa2V5KSA6IHRydWUpXG4gICAgICApIHtcbiAgICAgICAgc2V0QXJnKGtleSwgbmV4dCwgYXJnKTtcbiAgICAgICAgaSsrO1xuICAgICAgfSBlbHNlIGlmICgvXih0cnVlfGZhbHNlKSQvLnRlc3QobmV4dCkpIHtcbiAgICAgICAgc2V0QXJnKGtleSwgbmV4dCA9PT0gXCJ0cnVlXCIsIGFyZyk7XG4gICAgICAgIGkrKztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldEFyZyhrZXksIGdldChmbGFncy5zdHJpbmdzLCBrZXkpID8gXCJcIiA6IHRydWUsIGFyZyk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICgvXi1bXi1dKy8udGVzdChhcmcpKSB7XG4gICAgICBjb25zdCBsZXR0ZXJzID0gYXJnLnNsaWNlKDEsIC0xKS5zcGxpdChcIlwiKTtcblxuICAgICAgbGV0IGJyb2tlbiA9IGZhbHNlO1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBsZXR0ZXJzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGNvbnN0IG5leHQgPSBhcmcuc2xpY2UoaiArIDIpO1xuXG4gICAgICAgIGlmIChuZXh0ID09PSBcIi1cIikge1xuICAgICAgICAgIHNldEFyZyhsZXR0ZXJzW2pdLCBuZXh0LCBhcmcpO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKC9bQS1aYS16XS8udGVzdChsZXR0ZXJzW2pdKSAmJiAvPS8udGVzdChuZXh0KSkge1xuICAgICAgICAgIHNldEFyZyhsZXR0ZXJzW2pdLCBuZXh0LnNwbGl0KC89KC4rKS8pWzFdLCBhcmcpO1xuICAgICAgICAgIGJyb2tlbiA9IHRydWU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoXG4gICAgICAgICAgL1tBLVphLXpdLy50ZXN0KGxldHRlcnNbal0pICYmXG4gICAgICAgICAgLy0/XFxkKyhcXC5cXGQqKT8oZS0/XFxkKyk/JC8udGVzdChuZXh0KVxuICAgICAgICApIHtcbiAgICAgICAgICBzZXRBcmcobGV0dGVyc1tqXSwgbmV4dCwgYXJnKTtcbiAgICAgICAgICBicm9rZW4gPSB0cnVlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGxldHRlcnNbaiArIDFdICYmIGxldHRlcnNbaiArIDFdLm1hdGNoKC9cXFcvKSkge1xuICAgICAgICAgIHNldEFyZyhsZXR0ZXJzW2pdLCBhcmcuc2xpY2UoaiArIDIpLCBhcmcpO1xuICAgICAgICAgIGJyb2tlbiA9IHRydWU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2V0QXJnKGxldHRlcnNbal0sIGdldChmbGFncy5zdHJpbmdzLCBsZXR0ZXJzW2pdKSA/IFwiXCIgOiB0cnVlLCBhcmcpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IFtrZXldID0gYXJnLnNsaWNlKC0xKTtcbiAgICAgIGlmICghYnJva2VuICYmIGtleSAhPT0gXCItXCIpIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIGFyZ3NbaSArIDFdICYmXG4gICAgICAgICAgIS9eKC18LS0pW14tXS8udGVzdChhcmdzW2kgKyAxXSkgJiZcbiAgICAgICAgICAhZ2V0KGZsYWdzLmJvb2xzLCBrZXkpICYmXG4gICAgICAgICAgKGdldChhbGlhc2VzLCBrZXkpID8gIWFsaWFzSXNCb29sZWFuKGtleSkgOiB0cnVlKVxuICAgICAgICApIHtcbiAgICAgICAgICBzZXRBcmcoa2V5LCBhcmdzW2kgKyAxXSwgYXJnKTtcbiAgICAgICAgICBpKys7XG4gICAgICAgIH0gZWxzZSBpZiAoYXJnc1tpICsgMV0gJiYgL14odHJ1ZXxmYWxzZSkkLy50ZXN0KGFyZ3NbaSArIDFdKSkge1xuICAgICAgICAgIHNldEFyZyhrZXksIGFyZ3NbaSArIDFdID09PSBcInRydWVcIiwgYXJnKTtcbiAgICAgICAgICBpKys7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2V0QXJnKGtleSwgZ2V0KGZsYWdzLnN0cmluZ3MsIGtleSkgPyBcIlwiIDogdHJ1ZSwgYXJnKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoIWZsYWdzLnVua25vd25GbiB8fCBmbGFncy51bmtub3duRm4oYXJnKSAhPT0gZmFsc2UpIHtcbiAgICAgICAgYXJndi5fLnB1c2goZmxhZ3Muc3RyaW5nc1tcIl9cIl0gPz8gIWlzTnVtYmVyKGFyZykgPyBhcmcgOiBOdW1iZXIoYXJnKSk7XG4gICAgICB9XG4gICAgICBpZiAoc3RvcEVhcmx5KSB7XG4gICAgICAgIGFyZ3YuXy5wdXNoKC4uLmFyZ3Muc2xpY2UoaSArIDEpKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMoZGVmYXVsdHMpKSB7XG4gICAgaWYgKCFoYXNLZXkoYXJndiwga2V5LnNwbGl0KFwiLlwiKSkpIHtcbiAgICAgIHNldEtleShhcmd2LCBrZXksIHZhbHVlKTtcblxuICAgICAgaWYgKGFsaWFzZXNba2V5XSkge1xuICAgICAgICBmb3IgKGNvbnN0IHggb2YgYWxpYXNlc1trZXldKSB7XG4gICAgICAgICAgc2V0S2V5KGFyZ3YsIHgsIHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGZsYWdzLmJvb2xzKSkge1xuICAgIGlmICghaGFzS2V5KGFyZ3YsIGtleS5zcGxpdChcIi5cIikpKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IGdldChmbGFncy5jb2xsZWN0LCBrZXkpID8gW10gOiBmYWxzZTtcbiAgICAgIHNldEtleShcbiAgICAgICAgYXJndixcbiAgICAgICAga2V5LFxuICAgICAgICB2YWx1ZSxcbiAgICAgICAgZmFsc2UsXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGZsYWdzLnN0cmluZ3MpKSB7XG4gICAgaWYgKCFoYXNLZXkoYXJndiwga2V5LnNwbGl0KFwiLlwiKSkgJiYgZ2V0KGZsYWdzLmNvbGxlY3QsIGtleSkpIHtcbiAgICAgIHNldEtleShcbiAgICAgICAgYXJndixcbiAgICAgICAga2V5LFxuICAgICAgICBbXSxcbiAgICAgICAgZmFsc2UsXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIGlmIChkb3VibGVEYXNoKSB7XG4gICAgYXJndltcIi0tXCJdID0gW107XG4gICAgZm9yIChjb25zdCBrZXkgb2Ygbm90RmxhZ3MpIHtcbiAgICAgIGFyZ3ZbXCItLVwiXS5wdXNoKGtleSk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGZvciAoY29uc3Qga2V5IG9mIG5vdEZsYWdzKSB7XG4gICAgICBhcmd2Ll8ucHVzaChrZXkpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBhcmd2IGFzIEFyZ3M8VEFyZ3MsIFREb3VibGVEYXNoPjtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0ErQkMsR0FDRCxTQUFTLE1BQU0sUUFBUSxzQkFBc0I7QUFzVTdDLE1BQU0sRUFBRSxPQUFNLEVBQUUsR0FBRztBQUVuQixTQUFTLElBQ1AsR0FBMkIsRUFDM0IsR0FBVyxFQUNTO0lBQ3BCLElBQUksT0FBTyxLQUFLLE1BQU07UUFDcEIsT0FBTyxHQUFHLENBQUMsSUFBSTtJQUNqQixDQUFDO0FBQ0g7QUFFQSxTQUFTLFNBQWlCLEdBQTJCLEVBQUUsR0FBVyxFQUFVO0lBQzFFLE1BQU0sSUFBSSxJQUFJLEtBQUs7SUFDbkIsT0FBTyxLQUFLLElBQUk7SUFDaEIsT0FBTztBQUNUO0FBRUEsU0FBUyxTQUFTLENBQVUsRUFBVztJQUNyQyxJQUFJLE9BQU8sTUFBTSxVQUFVLE9BQU8sSUFBSTtJQUN0QyxJQUFJLGlCQUFpQixJQUFJLENBQUMsT0FBTyxLQUFLLE9BQU8sSUFBSTtJQUNqRCxPQUFPLDZDQUE2QyxJQUFJLENBQUMsT0FBTztBQUNsRTtBQUVBLFNBQVMsT0FBTyxHQUFrQixFQUFFLElBQWMsRUFBVztJQUMzRCxJQUFJLElBQUk7SUFDUixLQUFLLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQyxNQUFRO1FBQ2pDLElBQUssSUFBSSxHQUFHLFFBQVEsQ0FBQztJQUN2QjtJQUVBLE1BQU0sTUFBTSxJQUFJLENBQUMsS0FBSyxNQUFNLEdBQUcsRUFBRTtJQUNqQyxPQUFPLE9BQU8sR0FBRztBQUNuQjtBQUVBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7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