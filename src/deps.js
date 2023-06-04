// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

const osType = (()=>{
    const { Deno: Deno1  } = globalThis;
    if (typeof Deno1?.build?.os === "string") {
        return Deno1.build.os;
    }
    const { navigator  } = globalThis;
    if (navigator?.appVersion?.includes?.("Win") ?? false) {
        return "windows";
    }
    return "linux";
})();
const isWindows = osType === "windows";
const CHAR_FORWARD_SLASH = 47;
function assertPath(path) {
    if (typeof path !== "string") {
        throw new TypeError(`Path must be a string. Received ${JSON.stringify(path)}`);
    }
}
function isPosixPathSeparator(code) {
    return code === 47;
}
function isPathSeparator(code) {
    return isPosixPathSeparator(code) || code === 92;
}
function isWindowsDeviceRoot(code) {
    return code >= 97 && code <= 122 || code >= 65 && code <= 90;
}
function normalizeString(path, allowAboveRoot, separator, isPathSeparator) {
    let res = "";
    let lastSegmentLength = 0;
    let lastSlash = -1;
    let dots = 0;
    let code;
    for(let i = 0, len = path.length; i <= len; ++i){
        if (i < len) code = path.charCodeAt(i);
        else if (isPathSeparator(code)) break;
        else code = CHAR_FORWARD_SLASH;
        if (isPathSeparator(code)) {
            if (lastSlash === i - 1 || dots === 1) {} else if (lastSlash !== i - 1 && dots === 2) {
                if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 || res.charCodeAt(res.length - 2) !== 46) {
                    if (res.length > 2) {
                        const lastSlashIndex = res.lastIndexOf(separator);
                        if (lastSlashIndex === -1) {
                            res = "";
                            lastSegmentLength = 0;
                        } else {
                            res = res.slice(0, lastSlashIndex);
                            lastSegmentLength = res.length - 1 - res.lastIndexOf(separator);
                        }
                        lastSlash = i;
                        dots = 0;
                        continue;
                    } else if (res.length === 2 || res.length === 1) {
                        res = "";
                        lastSegmentLength = 0;
                        lastSlash = i;
                        dots = 0;
                        continue;
                    }
                }
                if (allowAboveRoot) {
                    if (res.length > 0) res += `${separator}..`;
                    else res = "..";
                    lastSegmentLength = 2;
                }
            } else {
                if (res.length > 0) res += separator + path.slice(lastSlash + 1, i);
                else res = path.slice(lastSlash + 1, i);
                lastSegmentLength = i - lastSlash - 1;
            }
            lastSlash = i;
            dots = 0;
        } else if (code === 46 && dots !== -1) {
            ++dots;
        } else {
            dots = -1;
        }
    }
    return res;
}
function _format(sep, pathObject) {
    const dir = pathObject.dir || pathObject.root;
    const base = pathObject.base || (pathObject.name || "") + (pathObject.ext || "");
    if (!dir) return base;
    if (dir === pathObject.root) return dir + base;
    return dir + sep + base;
}
const WHITESPACE_ENCODINGS = {
    "\u0009": "%09",
    "\u000A": "%0A",
    "\u000B": "%0B",
    "\u000C": "%0C",
    "\u000D": "%0D",
    "\u0020": "%20"
};
function encodeWhitespace(string) {
    return string.replaceAll(/[\s]/g, (c)=>{
        return WHITESPACE_ENCODINGS[c] ?? c;
    });
}
class DenoStdInternalError extends Error {
    constructor(message){
        super(message);
        this.name = "DenoStdInternalError";
    }
}
function assert(expr, msg = "") {
    if (!expr) {
        throw new DenoStdInternalError(msg);
    }
}
const sep = "\\";
const delimiter = ";";
function resolve(...pathSegments) {
    let resolvedDevice = "";
    let resolvedTail = "";
    let resolvedAbsolute = false;
    for(let i = pathSegments.length - 1; i >= -1; i--){
        let path;
        const { Deno: Deno1  } = globalThis;
        if (i >= 0) {
            path = pathSegments[i];
        } else if (!resolvedDevice) {
            if (typeof Deno1?.cwd !== "function") {
                throw new TypeError("Resolved a drive-letter-less path without a CWD.");
            }
            path = Deno1.cwd();
        } else {
            if (typeof Deno1?.env?.get !== "function" || typeof Deno1?.cwd !== "function") {
                throw new TypeError("Resolved a relative path without a CWD.");
            }
            path = Deno1.env.get(`=${resolvedDevice}`) || Deno1.cwd();
            if (path === undefined || path.slice(0, 3).toLowerCase() !== `${resolvedDevice.toLowerCase()}\\`) {
                path = `${resolvedDevice}\\`;
            }
        }
        assertPath(path);
        const len = path.length;
        if (len === 0) continue;
        let rootEnd = 0;
        let device = "";
        let isAbsolute = false;
        const code = path.charCodeAt(0);
        if (len > 1) {
            if (isPathSeparator(code)) {
                isAbsolute = true;
                if (isPathSeparator(path.charCodeAt(1))) {
                    let j = 2;
                    let last = j;
                    for(; j < len; ++j){
                        if (isPathSeparator(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        const firstPart = path.slice(last, j);
                        last = j;
                        for(; j < len; ++j){
                            if (!isPathSeparator(path.charCodeAt(j))) break;
                        }
                        if (j < len && j !== last) {
                            last = j;
                            for(; j < len; ++j){
                                if (isPathSeparator(path.charCodeAt(j))) break;
                            }
                            if (j === len) {
                                device = `\\\\${firstPart}\\${path.slice(last)}`;
                                rootEnd = j;
                            } else if (j !== last) {
                                device = `\\\\${firstPart}\\${path.slice(last, j)}`;
                                rootEnd = j;
                            }
                        }
                    }
                } else {
                    rootEnd = 1;
                }
            } else if (isWindowsDeviceRoot(code)) {
                if (path.charCodeAt(1) === 58) {
                    device = path.slice(0, 2);
                    rootEnd = 2;
                    if (len > 2) {
                        if (isPathSeparator(path.charCodeAt(2))) {
                            isAbsolute = true;
                            rootEnd = 3;
                        }
                    }
                }
            }
        } else if (isPathSeparator(code)) {
            rootEnd = 1;
            isAbsolute = true;
        }
        if (device.length > 0 && resolvedDevice.length > 0 && device.toLowerCase() !== resolvedDevice.toLowerCase()) {
            continue;
        }
        if (resolvedDevice.length === 0 && device.length > 0) {
            resolvedDevice = device;
        }
        if (!resolvedAbsolute) {
            resolvedTail = `${path.slice(rootEnd)}\\${resolvedTail}`;
            resolvedAbsolute = isAbsolute;
        }
        if (resolvedAbsolute && resolvedDevice.length > 0) break;
    }
    resolvedTail = normalizeString(resolvedTail, !resolvedAbsolute, "\\", isPathSeparator);
    return resolvedDevice + (resolvedAbsolute ? "\\" : "") + resolvedTail || ".";
}
function normalize(path) {
    assertPath(path);
    const len = path.length;
    if (len === 0) return ".";
    let rootEnd = 0;
    let device;
    let isAbsolute = false;
    const code = path.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator(code)) {
            isAbsolute = true;
            if (isPathSeparator(path.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator(path.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    const firstPart = path.slice(last, j);
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator(path.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            return `\\\\${firstPart}\\${path.slice(last)}\\`;
                        } else if (j !== last) {
                            device = `\\\\${firstPart}\\${path.slice(last, j)}`;
                            rootEnd = j;
                        }
                    }
                }
            } else {
                rootEnd = 1;
            }
        } else if (isWindowsDeviceRoot(code)) {
            if (path.charCodeAt(1) === 58) {
                device = path.slice(0, 2);
                rootEnd = 2;
                if (len > 2) {
                    if (isPathSeparator(path.charCodeAt(2))) {
                        isAbsolute = true;
                        rootEnd = 3;
                    }
                }
            }
        }
    } else if (isPathSeparator(code)) {
        return "\\";
    }
    let tail;
    if (rootEnd < len) {
        tail = normalizeString(path.slice(rootEnd), !isAbsolute, "\\", isPathSeparator);
    } else {
        tail = "";
    }
    if (tail.length === 0 && !isAbsolute) tail = ".";
    if (tail.length > 0 && isPathSeparator(path.charCodeAt(len - 1))) {
        tail += "\\";
    }
    if (device === undefined) {
        if (isAbsolute) {
            if (tail.length > 0) return `\\${tail}`;
            else return "\\";
        } else if (tail.length > 0) {
            return tail;
        } else {
            return "";
        }
    } else if (isAbsolute) {
        if (tail.length > 0) return `${device}\\${tail}`;
        else return `${device}\\`;
    } else if (tail.length > 0) {
        return device + tail;
    } else {
        return device;
    }
}
function isAbsolute(path) {
    assertPath(path);
    const len = path.length;
    if (len === 0) return false;
    const code = path.charCodeAt(0);
    if (isPathSeparator(code)) {
        return true;
    } else if (isWindowsDeviceRoot(code)) {
        if (len > 2 && path.charCodeAt(1) === 58) {
            if (isPathSeparator(path.charCodeAt(2))) return true;
        }
    }
    return false;
}
function join(...paths) {
    const pathsCount = paths.length;
    if (pathsCount === 0) return ".";
    let joined;
    let firstPart = null;
    for(let i = 0; i < pathsCount; ++i){
        const path = paths[i];
        assertPath(path);
        if (path.length > 0) {
            if (joined === undefined) joined = firstPart = path;
            else joined += `\\${path}`;
        }
    }
    if (joined === undefined) return ".";
    let needsReplace = true;
    let slashCount = 0;
    assert(firstPart != null);
    if (isPathSeparator(firstPart.charCodeAt(0))) {
        ++slashCount;
        const firstLen = firstPart.length;
        if (firstLen > 1) {
            if (isPathSeparator(firstPart.charCodeAt(1))) {
                ++slashCount;
                if (firstLen > 2) {
                    if (isPathSeparator(firstPart.charCodeAt(2))) ++slashCount;
                    else {
                        needsReplace = false;
                    }
                }
            }
        }
    }
    if (needsReplace) {
        for(; slashCount < joined.length; ++slashCount){
            if (!isPathSeparator(joined.charCodeAt(slashCount))) break;
        }
        if (slashCount >= 2) joined = `\\${joined.slice(slashCount)}`;
    }
    return normalize(joined);
}
function relative(from, to) {
    assertPath(from);
    assertPath(to);
    if (from === to) return "";
    const fromOrig = resolve(from);
    const toOrig = resolve(to);
    if (fromOrig === toOrig) return "";
    from = fromOrig.toLowerCase();
    to = toOrig.toLowerCase();
    if (from === to) return "";
    let fromStart = 0;
    let fromEnd = from.length;
    for(; fromStart < fromEnd; ++fromStart){
        if (from.charCodeAt(fromStart) !== 92) break;
    }
    for(; fromEnd - 1 > fromStart; --fromEnd){
        if (from.charCodeAt(fromEnd - 1) !== 92) break;
    }
    const fromLen = fromEnd - fromStart;
    let toStart = 0;
    let toEnd = to.length;
    for(; toStart < toEnd; ++toStart){
        if (to.charCodeAt(toStart) !== 92) break;
    }
    for(; toEnd - 1 > toStart; --toEnd){
        if (to.charCodeAt(toEnd - 1) !== 92) break;
    }
    const toLen = toEnd - toStart;
    const length = fromLen < toLen ? fromLen : toLen;
    let lastCommonSep = -1;
    let i = 0;
    for(; i <= length; ++i){
        if (i === length) {
            if (toLen > length) {
                if (to.charCodeAt(toStart + i) === 92) {
                    return toOrig.slice(toStart + i + 1);
                } else if (i === 2) {
                    return toOrig.slice(toStart + i);
                }
            }
            if (fromLen > length) {
                if (from.charCodeAt(fromStart + i) === 92) {
                    lastCommonSep = i;
                } else if (i === 2) {
                    lastCommonSep = 3;
                }
            }
            break;
        }
        const fromCode = from.charCodeAt(fromStart + i);
        const toCode = to.charCodeAt(toStart + i);
        if (fromCode !== toCode) break;
        else if (fromCode === 92) lastCommonSep = i;
    }
    if (i !== length && lastCommonSep === -1) {
        return toOrig;
    }
    let out = "";
    if (lastCommonSep === -1) lastCommonSep = 0;
    for(i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i){
        if (i === fromEnd || from.charCodeAt(i) === 92) {
            if (out.length === 0) out += "..";
            else out += "\\..";
        }
    }
    if (out.length > 0) {
        return out + toOrig.slice(toStart + lastCommonSep, toEnd);
    } else {
        toStart += lastCommonSep;
        if (toOrig.charCodeAt(toStart) === 92) ++toStart;
        return toOrig.slice(toStart, toEnd);
    }
}
function toNamespacedPath(path) {
    if (typeof path !== "string") return path;
    if (path.length === 0) return "";
    const resolvedPath = resolve(path);
    if (resolvedPath.length >= 3) {
        if (resolvedPath.charCodeAt(0) === 92) {
            if (resolvedPath.charCodeAt(1) === 92) {
                const code = resolvedPath.charCodeAt(2);
                if (code !== 63 && code !== 46) {
                    return `\\\\?\\UNC\\${resolvedPath.slice(2)}`;
                }
            }
        } else if (isWindowsDeviceRoot(resolvedPath.charCodeAt(0))) {
            if (resolvedPath.charCodeAt(1) === 58 && resolvedPath.charCodeAt(2) === 92) {
                return `\\\\?\\${resolvedPath}`;
            }
        }
    }
    return path;
}
function dirname(path) {
    assertPath(path);
    const len = path.length;
    if (len === 0) return ".";
    let rootEnd = -1;
    let end = -1;
    let matchedSlash = true;
    let offset = 0;
    const code = path.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator(code)) {
            rootEnd = offset = 1;
            if (isPathSeparator(path.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator(path.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator(path.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            return path;
                        }
                        if (j !== last) {
                            rootEnd = offset = j + 1;
                        }
                    }
                }
            }
        } else if (isWindowsDeviceRoot(code)) {
            if (path.charCodeAt(1) === 58) {
                rootEnd = offset = 2;
                if (len > 2) {
                    if (isPathSeparator(path.charCodeAt(2))) rootEnd = offset = 3;
                }
            }
        }
    } else if (isPathSeparator(code)) {
        return path;
    }
    for(let i = len - 1; i >= offset; --i){
        if (isPathSeparator(path.charCodeAt(i))) {
            if (!matchedSlash) {
                end = i;
                break;
            }
        } else {
            matchedSlash = false;
        }
    }
    if (end === -1) {
        if (rootEnd === -1) return ".";
        else end = rootEnd;
    }
    return path.slice(0, end);
}
function basename(path, ext = "") {
    if (ext !== undefined && typeof ext !== "string") {
        throw new TypeError('"ext" argument must be a string');
    }
    assertPath(path);
    let start = 0;
    let end = -1;
    let matchedSlash = true;
    let i;
    if (path.length >= 2) {
        const drive = path.charCodeAt(0);
        if (isWindowsDeviceRoot(drive)) {
            if (path.charCodeAt(1) === 58) start = 2;
        }
    }
    if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
        if (ext.length === path.length && ext === path) return "";
        let extIdx = ext.length - 1;
        let firstNonSlashEnd = -1;
        for(i = path.length - 1; i >= start; --i){
            const code = path.charCodeAt(i);
            if (isPathSeparator(code)) {
                if (!matchedSlash) {
                    start = i + 1;
                    break;
                }
            } else {
                if (firstNonSlashEnd === -1) {
                    matchedSlash = false;
                    firstNonSlashEnd = i + 1;
                }
                if (extIdx >= 0) {
                    if (code === ext.charCodeAt(extIdx)) {
                        if (--extIdx === -1) {
                            end = i;
                        }
                    } else {
                        extIdx = -1;
                        end = firstNonSlashEnd;
                    }
                }
            }
        }
        if (start === end) end = firstNonSlashEnd;
        else if (end === -1) end = path.length;
        return path.slice(start, end);
    } else {
        for(i = path.length - 1; i >= start; --i){
            if (isPathSeparator(path.charCodeAt(i))) {
                if (!matchedSlash) {
                    start = i + 1;
                    break;
                }
            } else if (end === -1) {
                matchedSlash = false;
                end = i + 1;
            }
        }
        if (end === -1) return "";
        return path.slice(start, end);
    }
}
function extname(path) {
    assertPath(path);
    let start = 0;
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let preDotState = 0;
    if (path.length >= 2 && path.charCodeAt(1) === 58 && isWindowsDeviceRoot(path.charCodeAt(0))) {
        start = startPart = 2;
    }
    for(let i = path.length - 1; i >= start; --i){
        const code = path.charCodeAt(i);
        if (isPathSeparator(code)) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        return "";
    }
    return path.slice(startDot, end);
}
function format(pathObject) {
    if (pathObject === null || typeof pathObject !== "object") {
        throw new TypeError(`The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`);
    }
    return _format("\\", pathObject);
}
function parse(path) {
    assertPath(path);
    const ret = {
        root: "",
        dir: "",
        base: "",
        ext: "",
        name: ""
    };
    const len = path.length;
    if (len === 0) return ret;
    let rootEnd = 0;
    let code = path.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator(code)) {
            rootEnd = 1;
            if (isPathSeparator(path.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator(path.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator(path.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            rootEnd = j;
                        } else if (j !== last) {
                            rootEnd = j + 1;
                        }
                    }
                }
            }
        } else if (isWindowsDeviceRoot(code)) {
            if (path.charCodeAt(1) === 58) {
                rootEnd = 2;
                if (len > 2) {
                    if (isPathSeparator(path.charCodeAt(2))) {
                        if (len === 3) {
                            ret.root = ret.dir = path;
                            return ret;
                        }
                        rootEnd = 3;
                    }
                } else {
                    ret.root = ret.dir = path;
                    return ret;
                }
            }
        }
    } else if (isPathSeparator(code)) {
        ret.root = ret.dir = path;
        return ret;
    }
    if (rootEnd > 0) ret.root = path.slice(0, rootEnd);
    let startDot = -1;
    let startPart = rootEnd;
    let end = -1;
    let matchedSlash = true;
    let i = path.length - 1;
    let preDotState = 0;
    for(; i >= rootEnd; --i){
        code = path.charCodeAt(i);
        if (isPathSeparator(code)) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        if (end !== -1) {
            ret.base = ret.name = path.slice(startPart, end);
        }
    } else {
        ret.name = path.slice(startPart, startDot);
        ret.base = path.slice(startPart, end);
        ret.ext = path.slice(startDot, end);
    }
    if (startPart > 0 && startPart !== rootEnd) {
        ret.dir = path.slice(0, startPart - 1);
    } else ret.dir = ret.root;
    return ret;
}
function fromFileUrl(url) {
    url = url instanceof URL ? url : new URL(url);
    if (url.protocol != "file:") {
        throw new TypeError("Must be a file URL.");
    }
    let path = decodeURIComponent(url.pathname.replace(/\//g, "\\").replace(/%(?![0-9A-Fa-f]{2})/g, "%25")).replace(/^\\*([A-Za-z]:)(\\|$)/, "$1\\");
    if (url.hostname != "") {
        path = `\\\\${url.hostname}${path}`;
    }
    return path;
}
function toFileUrl(path) {
    if (!isAbsolute(path)) {
        throw new TypeError("Must be an absolute path.");
    }
    const [, hostname, pathname] = path.match(/^(?:[/\\]{2}([^/\\]+)(?=[/\\](?:[^/\\]|$)))?(.*)/);
    const url = new URL("file:///");
    url.pathname = encodeWhitespace(pathname.replace(/%/g, "%25"));
    if (hostname != null && hostname != "localhost") {
        url.hostname = hostname;
        if (!url.hostname) {
            throw new TypeError("Invalid hostname.");
        }
    }
    return url;
}
const mod = {
    sep: sep,
    delimiter: delimiter,
    resolve: resolve,
    normalize: normalize,
    isAbsolute: isAbsolute,
    join: join,
    relative: relative,
    toNamespacedPath: toNamespacedPath,
    dirname: dirname,
    basename: basename,
    extname: extname,
    format: format,
    parse: parse,
    fromFileUrl: fromFileUrl,
    toFileUrl: toFileUrl
};
const sep1 = "/";
const delimiter1 = ":";
function resolve1(...pathSegments) {
    let resolvedPath = "";
    let resolvedAbsolute = false;
    for(let i = pathSegments.length - 1; i >= -1 && !resolvedAbsolute; i--){
        let path;
        if (i >= 0) path = pathSegments[i];
        else {
            const { Deno: Deno1  } = globalThis;
            if (typeof Deno1?.cwd !== "function") {
                throw new TypeError("Resolved a relative path without a CWD.");
            }
            path = Deno1.cwd();
        }
        assertPath(path);
        if (path.length === 0) {
            continue;
        }
        resolvedPath = `${path}/${resolvedPath}`;
        resolvedAbsolute = path.charCodeAt(0) === CHAR_FORWARD_SLASH;
    }
    resolvedPath = normalizeString(resolvedPath, !resolvedAbsolute, "/", isPosixPathSeparator);
    if (resolvedAbsolute) {
        if (resolvedPath.length > 0) return `/${resolvedPath}`;
        else return "/";
    } else if (resolvedPath.length > 0) return resolvedPath;
    else return ".";
}
function normalize1(path) {
    assertPath(path);
    if (path.length === 0) return ".";
    const isAbsolute = path.charCodeAt(0) === 47;
    const trailingSeparator = path.charCodeAt(path.length - 1) === 47;
    path = normalizeString(path, !isAbsolute, "/", isPosixPathSeparator);
    if (path.length === 0 && !isAbsolute) path = ".";
    if (path.length > 0 && trailingSeparator) path += "/";
    if (isAbsolute) return `/${path}`;
    return path;
}
function isAbsolute1(path) {
    assertPath(path);
    return path.length > 0 && path.charCodeAt(0) === 47;
}
function join1(...paths) {
    if (paths.length === 0) return ".";
    let joined;
    for(let i = 0, len = paths.length; i < len; ++i){
        const path = paths[i];
        assertPath(path);
        if (path.length > 0) {
            if (!joined) joined = path;
            else joined += `/${path}`;
        }
    }
    if (!joined) return ".";
    return normalize1(joined);
}
function relative1(from, to) {
    assertPath(from);
    assertPath(to);
    if (from === to) return "";
    from = resolve1(from);
    to = resolve1(to);
    if (from === to) return "";
    let fromStart = 1;
    const fromEnd = from.length;
    for(; fromStart < fromEnd; ++fromStart){
        if (from.charCodeAt(fromStart) !== 47) break;
    }
    const fromLen = fromEnd - fromStart;
    let toStart = 1;
    const toEnd = to.length;
    for(; toStart < toEnd; ++toStart){
        if (to.charCodeAt(toStart) !== 47) break;
    }
    const toLen = toEnd - toStart;
    const length = fromLen < toLen ? fromLen : toLen;
    let lastCommonSep = -1;
    let i = 0;
    for(; i <= length; ++i){
        if (i === length) {
            if (toLen > length) {
                if (to.charCodeAt(toStart + i) === 47) {
                    return to.slice(toStart + i + 1);
                } else if (i === 0) {
                    return to.slice(toStart + i);
                }
            } else if (fromLen > length) {
                if (from.charCodeAt(fromStart + i) === 47) {
                    lastCommonSep = i;
                } else if (i === 0) {
                    lastCommonSep = 0;
                }
            }
            break;
        }
        const fromCode = from.charCodeAt(fromStart + i);
        const toCode = to.charCodeAt(toStart + i);
        if (fromCode !== toCode) break;
        else if (fromCode === 47) lastCommonSep = i;
    }
    let out = "";
    for(i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i){
        if (i === fromEnd || from.charCodeAt(i) === 47) {
            if (out.length === 0) out += "..";
            else out += "/..";
        }
    }
    if (out.length > 0) return out + to.slice(toStart + lastCommonSep);
    else {
        toStart += lastCommonSep;
        if (to.charCodeAt(toStart) === 47) ++toStart;
        return to.slice(toStart);
    }
}
function toNamespacedPath1(path) {
    return path;
}
function dirname1(path) {
    assertPath(path);
    if (path.length === 0) return ".";
    const hasRoot = path.charCodeAt(0) === 47;
    let end = -1;
    let matchedSlash = true;
    for(let i = path.length - 1; i >= 1; --i){
        if (path.charCodeAt(i) === 47) {
            if (!matchedSlash) {
                end = i;
                break;
            }
        } else {
            matchedSlash = false;
        }
    }
    if (end === -1) return hasRoot ? "/" : ".";
    if (hasRoot && end === 1) return "//";
    return path.slice(0, end);
}
function basename1(path, ext = "") {
    if (ext !== undefined && typeof ext !== "string") {
        throw new TypeError('"ext" argument must be a string');
    }
    assertPath(path);
    let start = 0;
    let end = -1;
    let matchedSlash = true;
    let i;
    if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
        if (ext.length === path.length && ext === path) return "";
        let extIdx = ext.length - 1;
        let firstNonSlashEnd = -1;
        for(i = path.length - 1; i >= 0; --i){
            const code = path.charCodeAt(i);
            if (code === 47) {
                if (!matchedSlash) {
                    start = i + 1;
                    break;
                }
            } else {
                if (firstNonSlashEnd === -1) {
                    matchedSlash = false;
                    firstNonSlashEnd = i + 1;
                }
                if (extIdx >= 0) {
                    if (code === ext.charCodeAt(extIdx)) {
                        if (--extIdx === -1) {
                            end = i;
                        }
                    } else {
                        extIdx = -1;
                        end = firstNonSlashEnd;
                    }
                }
            }
        }
        if (start === end) end = firstNonSlashEnd;
        else if (end === -1) end = path.length;
        return path.slice(start, end);
    } else {
        for(i = path.length - 1; i >= 0; --i){
            if (path.charCodeAt(i) === 47) {
                if (!matchedSlash) {
                    start = i + 1;
                    break;
                }
            } else if (end === -1) {
                matchedSlash = false;
                end = i + 1;
            }
        }
        if (end === -1) return "";
        return path.slice(start, end);
    }
}
function extname1(path) {
    assertPath(path);
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let preDotState = 0;
    for(let i = path.length - 1; i >= 0; --i){
        const code = path.charCodeAt(i);
        if (code === 47) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        return "";
    }
    return path.slice(startDot, end);
}
function format1(pathObject) {
    if (pathObject === null || typeof pathObject !== "object") {
        throw new TypeError(`The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`);
    }
    return _format("/", pathObject);
}
function parse1(path) {
    assertPath(path);
    const ret = {
        root: "",
        dir: "",
        base: "",
        ext: "",
        name: ""
    };
    if (path.length === 0) return ret;
    const isAbsolute = path.charCodeAt(0) === 47;
    let start;
    if (isAbsolute) {
        ret.root = "/";
        start = 1;
    } else {
        start = 0;
    }
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let i = path.length - 1;
    let preDotState = 0;
    for(; i >= start; --i){
        const code = path.charCodeAt(i);
        if (code === 47) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        if (end !== -1) {
            if (startPart === 0 && isAbsolute) {
                ret.base = ret.name = path.slice(1, end);
            } else {
                ret.base = ret.name = path.slice(startPart, end);
            }
        }
    } else {
        if (startPart === 0 && isAbsolute) {
            ret.name = path.slice(1, startDot);
            ret.base = path.slice(1, end);
        } else {
            ret.name = path.slice(startPart, startDot);
            ret.base = path.slice(startPart, end);
        }
        ret.ext = path.slice(startDot, end);
    }
    if (startPart > 0) ret.dir = path.slice(0, startPart - 1);
    else if (isAbsolute) ret.dir = "/";
    return ret;
}
function fromFileUrl1(url) {
    url = url instanceof URL ? url : new URL(url);
    if (url.protocol != "file:") {
        throw new TypeError("Must be a file URL.");
    }
    return decodeURIComponent(url.pathname.replace(/%(?![0-9A-Fa-f]{2})/g, "%25"));
}
function toFileUrl1(path) {
    if (!isAbsolute1(path)) {
        throw new TypeError("Must be an absolute path.");
    }
    const url = new URL("file:///");
    url.pathname = encodeWhitespace(path.replace(/%/g, "%25").replace(/\\/g, "%5C"));
    return url;
}
const mod1 = {
    sep: sep1,
    delimiter: delimiter1,
    resolve: resolve1,
    normalize: normalize1,
    isAbsolute: isAbsolute1,
    join: join1,
    relative: relative1,
    toNamespacedPath: toNamespacedPath1,
    dirname: dirname1,
    basename: basename1,
    extname: extname1,
    format: format1,
    parse: parse1,
    fromFileUrl: fromFileUrl1,
    toFileUrl: toFileUrl1
};
const SEP = isWindows ? "\\" : "/";
const SEP_PATTERN = isWindows ? /[\\/]+/ : /\/+/;
function common(paths, sep = SEP) {
    const [first = "", ...remaining] = paths;
    if (first === "" || remaining.length === 0) {
        return first.substring(0, first.lastIndexOf(sep) + 1);
    }
    const parts = first.split(sep);
    let endOfPrefix = parts.length;
    for (const path of remaining){
        const compare = path.split(sep);
        for(let i = 0; i < endOfPrefix; i++){
            if (compare[i] !== parts[i]) {
                endOfPrefix = i;
            }
        }
        if (endOfPrefix === 0) {
            return "";
        }
    }
    const prefix = parts.slice(0, endOfPrefix).join(sep);
    return prefix.endsWith(sep) ? prefix : `${prefix}${sep}`;
}
const path = isWindows ? mod : mod1;
const { join: join2 , normalize: normalize2  } = path;
const regExpEscapeChars = [
    "!",
    "$",
    "(",
    ")",
    "*",
    "+",
    ".",
    "=",
    "?",
    "[",
    "\\",
    "^",
    "{",
    "|"
];
const rangeEscapeChars = [
    "-",
    "\\",
    "]"
];
function globToRegExp(glob, { extended =true , globstar: globstarOption = true , os =osType , caseInsensitive =false  } = {}) {
    if (glob == "") {
        return /(?!)/;
    }
    const sep = os == "windows" ? "(?:\\\\|/)+" : "/+";
    const sepMaybe = os == "windows" ? "(?:\\\\|/)*" : "/*";
    const seps = os == "windows" ? [
        "\\",
        "/"
    ] : [
        "/"
    ];
    const globstar = os == "windows" ? "(?:[^\\\\/]*(?:\\\\|/|$)+)*" : "(?:[^/]*(?:/|$)+)*";
    const wildcard = os == "windows" ? "[^\\\\/]*" : "[^/]*";
    const escapePrefix = os == "windows" ? "`" : "\\";
    let newLength = glob.length;
    for(; newLength > 1 && seps.includes(glob[newLength - 1]); newLength--);
    glob = glob.slice(0, newLength);
    let regExpString = "";
    for(let j = 0; j < glob.length;){
        let segment = "";
        const groupStack = [];
        let inRange = false;
        let inEscape = false;
        let endsWithSep = false;
        let i = j;
        for(; i < glob.length && !seps.includes(glob[i]); i++){
            if (inEscape) {
                inEscape = false;
                const escapeChars = inRange ? rangeEscapeChars : regExpEscapeChars;
                segment += escapeChars.includes(glob[i]) ? `\\${glob[i]}` : glob[i];
                continue;
            }
            if (glob[i] == escapePrefix) {
                inEscape = true;
                continue;
            }
            if (glob[i] == "[") {
                if (!inRange) {
                    inRange = true;
                    segment += "[";
                    if (glob[i + 1] == "!") {
                        i++;
                        segment += "^";
                    } else if (glob[i + 1] == "^") {
                        i++;
                        segment += "\\^";
                    }
                    continue;
                } else if (glob[i + 1] == ":") {
                    let k = i + 1;
                    let value = "";
                    while(glob[k + 1] != null && glob[k + 1] != ":"){
                        value += glob[k + 1];
                        k++;
                    }
                    if (glob[k + 1] == ":" && glob[k + 2] == "]") {
                        i = k + 2;
                        if (value == "alnum") segment += "\\dA-Za-z";
                        else if (value == "alpha") segment += "A-Za-z";
                        else if (value == "ascii") segment += "\x00-\x7F";
                        else if (value == "blank") segment += "\t ";
                        else if (value == "cntrl") segment += "\x00-\x1F\x7F";
                        else if (value == "digit") segment += "\\d";
                        else if (value == "graph") segment += "\x21-\x7E";
                        else if (value == "lower") segment += "a-z";
                        else if (value == "print") segment += "\x20-\x7E";
                        else if (value == "punct") {
                            segment += "!\"#$%&'()*+,\\-./:;<=>?@[\\\\\\]^_‘{|}~";
                        } else if (value == "space") segment += "\\s\v";
                        else if (value == "upper") segment += "A-Z";
                        else if (value == "word") segment += "\\w";
                        else if (value == "xdigit") segment += "\\dA-Fa-f";
                        continue;
                    }
                }
            }
            if (glob[i] == "]" && inRange) {
                inRange = false;
                segment += "]";
                continue;
            }
            if (inRange) {
                if (glob[i] == "\\") {
                    segment += `\\\\`;
                } else {
                    segment += glob[i];
                }
                continue;
            }
            if (glob[i] == ")" && groupStack.length > 0 && groupStack[groupStack.length - 1] != "BRACE") {
                segment += ")";
                const type = groupStack.pop();
                if (type == "!") {
                    segment += wildcard;
                } else if (type != "@") {
                    segment += type;
                }
                continue;
            }
            if (glob[i] == "|" && groupStack.length > 0 && groupStack[groupStack.length - 1] != "BRACE") {
                segment += "|";
                continue;
            }
            if (glob[i] == "+" && extended && glob[i + 1] == "(") {
                i++;
                groupStack.push("+");
                segment += "(?:";
                continue;
            }
            if (glob[i] == "@" && extended && glob[i + 1] == "(") {
                i++;
                groupStack.push("@");
                segment += "(?:";
                continue;
            }
            if (glob[i] == "?") {
                if (extended && glob[i + 1] == "(") {
                    i++;
                    groupStack.push("?");
                    segment += "(?:";
                } else {
                    segment += ".";
                }
                continue;
            }
            if (glob[i] == "!" && extended && glob[i + 1] == "(") {
                i++;
                groupStack.push("!");
                segment += "(?!";
                continue;
            }
            if (glob[i] == "{") {
                groupStack.push("BRACE");
                segment += "(?:";
                continue;
            }
            if (glob[i] == "}" && groupStack[groupStack.length - 1] == "BRACE") {
                groupStack.pop();
                segment += ")";
                continue;
            }
            if (glob[i] == "," && groupStack[groupStack.length - 1] == "BRACE") {
                segment += "|";
                continue;
            }
            if (glob[i] == "*") {
                if (extended && glob[i + 1] == "(") {
                    i++;
                    groupStack.push("*");
                    segment += "(?:";
                } else {
                    const prevChar = glob[i - 1];
                    let numStars = 1;
                    while(glob[i + 1] == "*"){
                        i++;
                        numStars++;
                    }
                    const nextChar = glob[i + 1];
                    if (globstarOption && numStars == 2 && [
                        ...seps,
                        undefined
                    ].includes(prevChar) && [
                        ...seps,
                        undefined
                    ].includes(nextChar)) {
                        segment += globstar;
                        endsWithSep = true;
                    } else {
                        segment += wildcard;
                    }
                }
                continue;
            }
            segment += regExpEscapeChars.includes(glob[i]) ? `\\${glob[i]}` : glob[i];
        }
        if (groupStack.length > 0 || inRange || inEscape) {
            segment = "";
            for (const c of glob.slice(j, i)){
                segment += regExpEscapeChars.includes(c) ? `\\${c}` : c;
                endsWithSep = false;
            }
        }
        regExpString += segment;
        if (!endsWithSep) {
            regExpString += i < glob.length ? sep : sepMaybe;
            endsWithSep = true;
        }
        while(seps.includes(glob[i]))i++;
        if (!(i > j)) {
            throw new Error("Assertion failure: i > j (potential infinite loop)");
        }
        j = i;
    }
    regExpString = `^${regExpString}$`;
    return new RegExp(regExpString, caseInsensitive ? "i" : "");
}
function isGlob(str) {
    const chars = {
        "{": "}",
        "(": ")",
        "[": "]"
    };
    const regex = /\\(.)|(^!|\*|\?|[\].+)]\?|\[[^\\\]]+\]|\{[^\\}]+\}|\(\?[:!=][^\\)]+\)|\([^|]+\|[^\\)]+\))/;
    if (str === "") {
        return false;
    }
    let match;
    while(match = regex.exec(str)){
        if (match[2]) return true;
        let idx = match.index + match[0].length;
        const open = match[1];
        const close = open ? chars[open] : null;
        if (open && close) {
            const n = str.indexOf(close, idx);
            if (n !== -1) {
                idx = n + 1;
            }
        }
        str = str.slice(idx);
    }
    return false;
}
function normalizeGlob(glob, { globstar =false  } = {}) {
    if (glob.match(/\0/g)) {
        throw new Error(`Glob contains invalid characters: "${glob}"`);
    }
    if (!globstar) {
        return normalize2(glob);
    }
    const s = SEP_PATTERN.source;
    const badParentPattern = new RegExp(`(?<=(${s}|^)\\*\\*${s})\\.\\.(?=${s}|$)`, "g");
    return normalize2(glob.replace(badParentPattern, "\0")).replace(/\0/g, "..");
}
function joinGlobs(globs, { extended =false , globstar =false  } = {}) {
    if (!globstar || globs.length == 0) {
        return join2(...globs);
    }
    if (globs.length === 0) return ".";
    let joined;
    for (const glob of globs){
        const path = glob;
        if (path.length > 0) {
            if (!joined) joined = path;
            else joined += `${SEP}${path}`;
        }
    }
    if (!joined) return ".";
    return normalizeGlob(joined, {
        extended,
        globstar
    });
}
const path1 = isWindows ? mod : mod1;
const { basename: basename2 , delimiter: delimiter2 , dirname: dirname2 , extname: extname2 , format: format2 , fromFileUrl: fromFileUrl2 , isAbsolute: isAbsolute2 , join: join3 , normalize: normalize3 , parse: parse2 , relative: relative2 , resolve: resolve2 , sep: sep2 , toFileUrl: toFileUrl2 , toNamespacedPath: toNamespacedPath2 ,  } = path1;
const mod2 = {
    SEP: SEP,
    SEP_PATTERN: SEP_PATTERN,
    win32: mod,
    posix: mod1,
    basename: basename2,
    delimiter: delimiter2,
    dirname: dirname2,
    extname: extname2,
    format: format2,
    fromFileUrl: fromFileUrl2,
    isAbsolute: isAbsolute2,
    join: join3,
    normalize: normalize3,
    parse: parse2,
    relative: relative2,
    resolve: resolve2,
    sep: sep2,
    toFileUrl: toFileUrl2,
    toNamespacedPath: toNamespacedPath2,
    common,
    globToRegExp,
    isGlob,
    normalizeGlob,
    joinGlobs
};
async function emptyDir(dir) {
    try {
        const items = [];
        for await (const dirEntry of Deno.readDir(dir)){
            items.push(dirEntry);
        }
        while(items.length){
            const item = items.shift();
            if (item && item.name) {
                const filepath = join3(dir, item.name);
                await Deno.remove(filepath, {
                    recursive: true
                });
            }
        }
    } catch (err) {
        if (!(err instanceof Deno.errors.NotFound)) {
            throw err;
        }
        await Deno.mkdir(dir, {
            recursive: true
        });
    }
}
function emptyDirSync(dir) {
    try {
        const items = [
            ...Deno.readDirSync(dir)
        ];
        while(items.length){
            const item = items.shift();
            if (item && item.name) {
                const filepath = join3(dir, item.name);
                Deno.removeSync(filepath, {
                    recursive: true
                });
            }
        }
    } catch (err) {
        if (!(err instanceof Deno.errors.NotFound)) {
            throw err;
        }
        Deno.mkdirSync(dir, {
            recursive: true
        });
        return;
    }
}
function isSubdir(src, dest, sep = sep2) {
    if (src === dest) {
        return false;
    }
    const srcArray = src.split(sep);
    const destArray = dest.split(sep);
    return srcArray.every((current, i)=>destArray[i] === current);
}
function getFileInfoType(fileInfo) {
    return fileInfo.isFile ? "file" : fileInfo.isDirectory ? "dir" : fileInfo.isSymlink ? "symlink" : undefined;
}
async function ensureDir(dir) {
    try {
        const fileInfo = await Deno.lstat(dir);
        if (!fileInfo.isDirectory) {
            throw new Error(`Ensure path exists, expected 'dir', got '${getFileInfoType(fileInfo)}'`);
        }
    } catch (err) {
        if (err instanceof Deno.errors.NotFound) {
            await Deno.mkdir(dir, {
                recursive: true
            });
            return;
        }
        throw err;
    }
}
function ensureDirSync(dir) {
    try {
        const fileInfo = Deno.lstatSync(dir);
        if (!fileInfo.isDirectory) {
            throw new Error(`Ensure path exists, expected 'dir', got '${getFileInfoType(fileInfo)}'`);
        }
    } catch (err) {
        if (err instanceof Deno.errors.NotFound) {
            Deno.mkdirSync(dir, {
                recursive: true
            });
            return;
        }
        throw err;
    }
}
async function ensureFile(filePath) {
    try {
        const stat = await Deno.lstat(filePath);
        if (!stat.isFile) {
            throw new Error(`Ensure path exists, expected 'file', got '${getFileInfoType(stat)}'`);
        }
    } catch (err) {
        if (err instanceof Deno.errors.NotFound) {
            await ensureDir(dirname2(filePath));
            await Deno.writeFile(filePath, new Uint8Array());
            return;
        }
        throw err;
    }
}
function ensureFileSync(filePath) {
    try {
        const stat = Deno.lstatSync(filePath);
        if (!stat.isFile) {
            throw new Error(`Ensure path exists, expected 'file', got '${getFileInfoType(stat)}'`);
        }
    } catch (err) {
        if (err instanceof Deno.errors.NotFound) {
            ensureDirSync(dirname2(filePath));
            Deno.writeFileSync(filePath, new Uint8Array());
            return;
        }
        throw err;
    }
}
async function exists(filePath) {
    try {
        await Deno.lstat(filePath);
        return true;
    } catch (err) {
        if (err instanceof Deno.errors.NotFound) {
            return false;
        }
        throw err;
    }
}
function existsSync(filePath) {
    try {
        Deno.lstatSync(filePath);
        return true;
    } catch (err) {
        if (err instanceof Deno.errors.NotFound) {
            return false;
        }
        throw err;
    }
}
async function ensureLink(src, dest) {
    if (await exists(dest)) {
        const destStatInfo = await Deno.lstat(dest);
        const destFilePathType = getFileInfoType(destStatInfo);
        if (destFilePathType !== "file") {
            throw new Error(`Ensure path exists, expected 'file', got '${destFilePathType}'`);
        }
        return;
    }
    await ensureDir(dirname2(dest));
    await Deno.link(src, dest);
}
function ensureLinkSync(src, dest) {
    if (existsSync(dest)) {
        const destStatInfo = Deno.lstatSync(dest);
        const destFilePathType = getFileInfoType(destStatInfo);
        if (destFilePathType !== "file") {
            throw new Error(`Ensure path exists, expected 'file', got '${destFilePathType}'`);
        }
        return;
    }
    ensureDirSync(dirname2(dest));
    Deno.linkSync(src, dest);
}
async function ensureSymlink(src, dest) {
    const srcStatInfo = await Deno.lstat(src);
    const srcFilePathType = getFileInfoType(srcStatInfo);
    if (await exists(dest)) {
        const destStatInfo = await Deno.lstat(dest);
        const destFilePathType = getFileInfoType(destStatInfo);
        if (destFilePathType !== "symlink") {
            throw new Error(`Ensure path exists, expected 'symlink', got '${destFilePathType}'`);
        }
        return;
    }
    await ensureDir(dirname2(dest));
    const options = isWindows ? {
        type: srcFilePathType === "dir" ? "dir" : "file"
    } : undefined;
    await Deno.symlink(src, dest, options);
}
function ensureSymlinkSync(src, dest) {
    const srcStatInfo = Deno.lstatSync(src);
    const srcFilePathType = getFileInfoType(srcStatInfo);
    if (existsSync(dest)) {
        const destStatInfo = Deno.lstatSync(dest);
        const destFilePathType = getFileInfoType(destStatInfo);
        if (destFilePathType !== "symlink") {
            throw new Error(`Ensure path exists, expected 'symlink', got '${destFilePathType}'`);
        }
        return;
    }
    ensureDirSync(dirname2(dest));
    const options = isWindows ? {
        type: srcFilePathType === "dir" ? "dir" : "file"
    } : undefined;
    Deno.symlinkSync(src, dest, options);
}
function _createWalkEntrySync(path) {
    path = normalize3(path);
    const name = basename2(path);
    const info = Deno.statSync(path);
    return {
        path,
        name,
        isFile: info.isFile,
        isDirectory: info.isDirectory,
        isSymlink: info.isSymlink
    };
}
async function _createWalkEntry(path) {
    path = normalize3(path);
    const name = basename2(path);
    const info = await Deno.stat(path);
    return {
        path,
        name,
        isFile: info.isFile,
        isDirectory: info.isDirectory,
        isSymlink: info.isSymlink
    };
}
function include(path, exts, match, skip) {
    if (exts && !exts.some((ext)=>path.endsWith(ext))) {
        return false;
    }
    if (match && !match.some((pattern)=>!!path.match(pattern))) {
        return false;
    }
    if (skip && skip.some((pattern)=>!!path.match(pattern))) {
        return false;
    }
    return true;
}
function wrapErrorWithRootPath(err, root) {
    if (err instanceof Error && "root" in err) return err;
    const e = new Error();
    e.root = root;
    e.message = err instanceof Error ? `${err.message} for path "${root}"` : `[non-error thrown] for path "${root}"`;
    e.stack = err instanceof Error ? err.stack : undefined;
    e.cause = err instanceof Error ? err.cause : undefined;
    return e;
}
async function* walk(root, { maxDepth =Infinity , includeFiles =true , includeDirs =true , followSymlinks =false , exts =undefined , match =undefined , skip =undefined  } = {}) {
    if (maxDepth < 0) {
        return;
    }
    if (includeDirs && include(root, exts, match, skip)) {
        yield await _createWalkEntry(root);
    }
    if (maxDepth < 1 || !include(root, undefined, undefined, skip)) {
        return;
    }
    try {
        for await (const entry of Deno.readDir(root)){
            assert(entry.name != null);
            let path = join3(root, entry.name);
            if (entry.isSymlink) {
                if (followSymlinks) {
                    path = await Deno.realPath(path);
                } else {
                    continue;
                }
            }
            if (entry.isFile) {
                if (includeFiles && include(path, exts, match, skip)) {
                    yield {
                        path,
                        ...entry
                    };
                }
            } else {
                yield* walk(path, {
                    maxDepth: maxDepth - 1,
                    includeFiles,
                    includeDirs,
                    followSymlinks,
                    exts,
                    match,
                    skip
                });
            }
        }
    } catch (err) {
        throw wrapErrorWithRootPath(err, normalize3(root));
    }
}
function* walkSync(root, { maxDepth =Infinity , includeFiles =true , includeDirs =true , followSymlinks =false , exts =undefined , match =undefined , skip =undefined  } = {}) {
    if (maxDepth < 0) {
        return;
    }
    if (includeDirs && include(root, exts, match, skip)) {
        yield _createWalkEntrySync(root);
    }
    if (maxDepth < 1 || !include(root, undefined, undefined, skip)) {
        return;
    }
    let entries;
    try {
        entries = Deno.readDirSync(root);
    } catch (err) {
        throw wrapErrorWithRootPath(err, normalize3(root));
    }
    for (const entry of entries){
        assert(entry.name != null);
        let path = join3(root, entry.name);
        if (entry.isSymlink) {
            if (followSymlinks) {
                path = Deno.realPathSync(path);
            } else {
                continue;
            }
        }
        if (entry.isFile) {
            if (includeFiles && include(path, exts, match, skip)) {
                yield {
                    path,
                    ...entry
                };
            }
        } else {
            yield* walkSync(path, {
                maxDepth: maxDepth - 1,
                includeFiles,
                includeDirs,
                followSymlinks,
                exts,
                match,
                skip
            });
        }
    }
}
function split(path) {
    const s = SEP_PATTERN.source;
    const segments = path.replace(new RegExp(`^${s}|${s}$`, "g"), "").split(SEP_PATTERN);
    const isAbsolute_ = isAbsolute2(path);
    return {
        segments,
        isAbsolute: isAbsolute_,
        hasTrailingSep: !!path.match(new RegExp(`${s}$`)),
        winRoot: isWindows && isAbsolute_ ? segments.shift() : undefined
    };
}
function throwUnlessNotFound(error) {
    if (!(error instanceof Deno.errors.NotFound)) {
        throw error;
    }
}
function comparePath(a, b) {
    if (a.path < b.path) return -1;
    if (a.path > b.path) return 1;
    return 0;
}
async function* expandGlob(glob, { root =Deno.cwd() , exclude =[] , includeDirs =true , extended =false , globstar =false , caseInsensitive  } = {}) {
    const globOptions = {
        extended,
        globstar,
        caseInsensitive
    };
    const absRoot = isAbsolute2(root) ? normalize3(root) : joinGlobs([
        Deno.cwd(),
        root
    ], globOptions);
    const resolveFromRoot = (path)=>isAbsolute2(path) ? normalize3(path) : joinGlobs([
            absRoot,
            path
        ], globOptions);
    const excludePatterns = exclude.map(resolveFromRoot).map((s)=>globToRegExp(s, globOptions));
    const shouldInclude = (path)=>!excludePatterns.some((p)=>!!path.match(p));
    const { segments , hasTrailingSep , winRoot  } = split(resolveFromRoot(glob));
    let fixedRoot = winRoot != undefined ? winRoot : "/";
    while(segments.length > 0 && !isGlob(segments[0])){
        const seg = segments.shift();
        assert(seg != null);
        fixedRoot = joinGlobs([
            fixedRoot,
            seg
        ], globOptions);
    }
    let fixedRootInfo;
    try {
        fixedRootInfo = await _createWalkEntry(fixedRoot);
    } catch (error) {
        return throwUnlessNotFound(error);
    }
    async function* advanceMatch(walkInfo, globSegment) {
        if (!walkInfo.isDirectory) {
            return;
        } else if (globSegment == "..") {
            const parentPath = joinGlobs([
                walkInfo.path,
                ".."
            ], globOptions);
            try {
                if (shouldInclude(parentPath)) {
                    return yield await _createWalkEntry(parentPath);
                }
            } catch (error) {
                throwUnlessNotFound(error);
            }
            return;
        } else if (globSegment == "**") {
            return yield* walk(walkInfo.path, {
                includeFiles: false,
                skip: excludePatterns
            });
        }
        yield* walk(walkInfo.path, {
            maxDepth: 1,
            match: [
                globToRegExp(joinGlobs([
                    walkInfo.path,
                    globSegment
                ], globOptions), globOptions), 
            ],
            skip: excludePatterns
        });
    }
    let currentMatches = [
        fixedRootInfo
    ];
    for (const segment of segments){
        const nextMatchMap = new Map();
        for (const currentMatch of currentMatches){
            for await (const nextMatch of advanceMatch(currentMatch, segment)){
                nextMatchMap.set(nextMatch.path, nextMatch);
            }
        }
        currentMatches = [
            ...nextMatchMap.values()
        ].sort(comparePath);
    }
    if (hasTrailingSep) {
        currentMatches = currentMatches.filter((entry)=>entry.isDirectory);
    }
    if (!includeDirs) {
        currentMatches = currentMatches.filter((entry)=>!entry.isDirectory);
    }
    yield* currentMatches;
}
function* expandGlobSync(glob, { root =Deno.cwd() , exclude =[] , includeDirs =true , extended =false , globstar =false , caseInsensitive  } = {}) {
    const globOptions = {
        extended,
        globstar,
        caseInsensitive
    };
    const absRoot = isAbsolute2(root) ? normalize3(root) : joinGlobs([
        Deno.cwd(),
        root
    ], globOptions);
    const resolveFromRoot = (path)=>isAbsolute2(path) ? normalize3(path) : joinGlobs([
            absRoot,
            path
        ], globOptions);
    const excludePatterns = exclude.map(resolveFromRoot).map((s)=>globToRegExp(s, globOptions));
    const shouldInclude = (path)=>!excludePatterns.some((p)=>!!path.match(p));
    const { segments , hasTrailingSep , winRoot  } = split(resolveFromRoot(glob));
    let fixedRoot = winRoot != undefined ? winRoot : "/";
    while(segments.length > 0 && !isGlob(segments[0])){
        const seg = segments.shift();
        assert(seg != null);
        fixedRoot = joinGlobs([
            fixedRoot,
            seg
        ], globOptions);
    }
    let fixedRootInfo;
    try {
        fixedRootInfo = _createWalkEntrySync(fixedRoot);
    } catch (error) {
        return throwUnlessNotFound(error);
    }
    function* advanceMatch(walkInfo, globSegment) {
        if (!walkInfo.isDirectory) {
            return;
        } else if (globSegment == "..") {
            const parentPath = joinGlobs([
                walkInfo.path,
                ".."
            ], globOptions);
            try {
                if (shouldInclude(parentPath)) {
                    return yield _createWalkEntrySync(parentPath);
                }
            } catch (error) {
                throwUnlessNotFound(error);
            }
            return;
        } else if (globSegment == "**") {
            return yield* walkSync(walkInfo.path, {
                includeFiles: false,
                skip: excludePatterns
            });
        }
        yield* walkSync(walkInfo.path, {
            maxDepth: 1,
            match: [
                globToRegExp(joinGlobs([
                    walkInfo.path,
                    globSegment
                ], globOptions), globOptions), 
            ],
            skip: excludePatterns
        });
    }
    let currentMatches = [
        fixedRootInfo
    ];
    for (const segment of segments){
        const nextMatchMap = new Map();
        for (const currentMatch of currentMatches){
            for (const nextMatch of advanceMatch(currentMatch, segment)){
                nextMatchMap.set(nextMatch.path, nextMatch);
            }
        }
        currentMatches = [
            ...nextMatchMap.values()
        ].sort(comparePath);
    }
    if (hasTrailingSep) {
        currentMatches = currentMatches.filter((entry)=>entry.isDirectory);
    }
    if (!includeDirs) {
        currentMatches = currentMatches.filter((entry)=>!entry.isDirectory);
    }
    yield* currentMatches;
}
async function move(src, dest, { overwrite =false  } = {}) {
    const srcStat = await Deno.stat(src);
    if (srcStat.isDirectory && isSubdir(src, dest)) {
        throw new Error(`Cannot move '${src}' to a subdirectory of itself, '${dest}'.`);
    }
    if (overwrite) {
        if (await exists(dest)) {
            await Deno.remove(dest, {
                recursive: true
            });
        }
    } else {
        if (await exists(dest)) {
            throw new Error("dest already exists.");
        }
    }
    await Deno.rename(src, dest);
    return;
}
function moveSync(src, dest, { overwrite =false  } = {}) {
    const srcStat = Deno.statSync(src);
    if (srcStat.isDirectory && isSubdir(src, dest)) {
        throw new Error(`Cannot move '${src}' to a subdirectory of itself, '${dest}'.`);
    }
    if (overwrite) {
        if (existsSync(dest)) {
            Deno.removeSync(dest, {
                recursive: true
            });
        }
    } else {
        if (existsSync(dest)) {
            throw new Error("dest already exists.");
        }
    }
    Deno.renameSync(src, dest);
}
async function ensureValidCopy(src, dest, options) {
    let destStat;
    try {
        destStat = await Deno.lstat(dest);
    } catch (err) {
        if (err instanceof Deno.errors.NotFound) {
            return;
        }
        throw err;
    }
    if (options.isFolder && !destStat.isDirectory) {
        throw new Error(`Cannot overwrite non-directory '${dest}' with directory '${src}'.`);
    }
    if (!options.overwrite) {
        throw new Error(`'${dest}' already exists.`);
    }
    return destStat;
}
function ensureValidCopySync(src, dest, options) {
    let destStat;
    try {
        destStat = Deno.lstatSync(dest);
    } catch (err) {
        if (err instanceof Deno.errors.NotFound) {
            return;
        }
        throw err;
    }
    if (options.isFolder && !destStat.isDirectory) {
        throw new Error(`Cannot overwrite non-directory '${dest}' with directory '${src}'.`);
    }
    if (!options.overwrite) {
        throw new Error(`'${dest}' already exists.`);
    }
    return destStat;
}
async function copyFile(src, dest, options) {
    await ensureValidCopy(src, dest, options);
    await Deno.copyFile(src, dest);
    if (options.preserveTimestamps) {
        const statInfo = await Deno.stat(src);
        assert(statInfo.atime instanceof Date, `statInfo.atime is unavailable`);
        assert(statInfo.mtime instanceof Date, `statInfo.mtime is unavailable`);
        await Deno.utime(dest, statInfo.atime, statInfo.mtime);
    }
}
function copyFileSync(src, dest, options) {
    ensureValidCopySync(src, dest, options);
    Deno.copyFileSync(src, dest);
    if (options.preserveTimestamps) {
        const statInfo = Deno.statSync(src);
        assert(statInfo.atime instanceof Date, `statInfo.atime is unavailable`);
        assert(statInfo.mtime instanceof Date, `statInfo.mtime is unavailable`);
        Deno.utimeSync(dest, statInfo.atime, statInfo.mtime);
    }
}
async function copySymLink(src, dest, options) {
    await ensureValidCopy(src, dest, options);
    const originSrcFilePath = await Deno.readLink(src);
    const type = getFileInfoType(await Deno.lstat(src));
    if (isWindows) {
        await Deno.symlink(originSrcFilePath, dest, {
            type: type === "dir" ? "dir" : "file"
        });
    } else {
        await Deno.symlink(originSrcFilePath, dest);
    }
    if (options.preserveTimestamps) {
        const statInfo = await Deno.lstat(src);
        assert(statInfo.atime instanceof Date, `statInfo.atime is unavailable`);
        assert(statInfo.mtime instanceof Date, `statInfo.mtime is unavailable`);
        await Deno.utime(dest, statInfo.atime, statInfo.mtime);
    }
}
function copySymlinkSync(src, dest, options) {
    ensureValidCopySync(src, dest, options);
    const originSrcFilePath = Deno.readLinkSync(src);
    const type = getFileInfoType(Deno.lstatSync(src));
    if (isWindows) {
        Deno.symlinkSync(originSrcFilePath, dest, {
            type: type === "dir" ? "dir" : "file"
        });
    } else {
        Deno.symlinkSync(originSrcFilePath, dest);
    }
    if (options.preserveTimestamps) {
        const statInfo = Deno.lstatSync(src);
        assert(statInfo.atime instanceof Date, `statInfo.atime is unavailable`);
        assert(statInfo.mtime instanceof Date, `statInfo.mtime is unavailable`);
        Deno.utimeSync(dest, statInfo.atime, statInfo.mtime);
    }
}
async function copyDir(src, dest, options) {
    const destStat = await ensureValidCopy(src, dest, {
        ...options,
        isFolder: true
    });
    if (!destStat) {
        await ensureDir(dest);
    }
    if (options.preserveTimestamps) {
        const srcStatInfo = await Deno.stat(src);
        assert(srcStatInfo.atime instanceof Date, `statInfo.atime is unavailable`);
        assert(srcStatInfo.mtime instanceof Date, `statInfo.mtime is unavailable`);
        await Deno.utime(dest, srcStatInfo.atime, srcStatInfo.mtime);
    }
    for await (const entry of Deno.readDir(src)){
        const srcPath = join3(src, entry.name);
        const destPath = join3(dest, basename2(srcPath));
        if (entry.isSymlink) {
            await copySymLink(srcPath, destPath, options);
        } else if (entry.isDirectory) {
            await copyDir(srcPath, destPath, options);
        } else if (entry.isFile) {
            await copyFile(srcPath, destPath, options);
        }
    }
}
function copyDirSync(src, dest, options) {
    const destStat = ensureValidCopySync(src, dest, {
        ...options,
        isFolder: true
    });
    if (!destStat) {
        ensureDirSync(dest);
    }
    if (options.preserveTimestamps) {
        const srcStatInfo = Deno.statSync(src);
        assert(srcStatInfo.atime instanceof Date, `statInfo.atime is unavailable`);
        assert(srcStatInfo.mtime instanceof Date, `statInfo.mtime is unavailable`);
        Deno.utimeSync(dest, srcStatInfo.atime, srcStatInfo.mtime);
    }
    for (const entry of Deno.readDirSync(src)){
        assert(entry.name != null, "file.name must be set");
        const srcPath = join3(src, entry.name);
        const destPath = join3(dest, basename2(srcPath));
        if (entry.isSymlink) {
            copySymlinkSync(srcPath, destPath, options);
        } else if (entry.isDirectory) {
            copyDirSync(srcPath, destPath, options);
        } else if (entry.isFile) {
            copyFileSync(srcPath, destPath, options);
        }
    }
}
async function copy(src, dest, options = {}) {
    src = resolve2(src);
    dest = resolve2(dest);
    if (src === dest) {
        throw new Error("Source and destination cannot be the same.");
    }
    const srcStat = await Deno.lstat(src);
    if (srcStat.isDirectory && isSubdir(src, dest)) {
        throw new Error(`Cannot copy '${src}' to a subdirectory of itself, '${dest}'.`);
    }
    if (srcStat.isSymlink) {
        await copySymLink(src, dest, options);
    } else if (srcStat.isDirectory) {
        await copyDir(src, dest, options);
    } else if (srcStat.isFile) {
        await copyFile(src, dest, options);
    }
}
function copySync(src, dest, options = {}) {
    src = resolve2(src);
    dest = resolve2(dest);
    if (src === dest) {
        throw new Error("Source and destination cannot be the same.");
    }
    const srcStat = Deno.lstatSync(src);
    if (srcStat.isDirectory && isSubdir(src, dest)) {
        throw new Error(`Cannot copy '${src}' to a subdirectory of itself, '${dest}'.`);
    }
    if (srcStat.isSymlink) {
        copySymlinkSync(src, dest, options);
    } else if (srcStat.isDirectory) {
        copyDirSync(src, dest, options);
    } else if (srcStat.isFile) {
        copyFileSync(src, dest, options);
    }
}
var EOL;
(function(EOL) {
    EOL["LF"] = "\n";
    EOL["CRLF"] = "\r\n";
})(EOL || (EOL = {}));
const regDetect = /(?:\r?\n)/g;
function detect(content) {
    const d = content.match(regDetect);
    if (!d || d.length === 0) {
        return null;
    }
    const hasCRLF = d.some((x)=>x === EOL.CRLF);
    return hasCRLF ? EOL.CRLF : EOL.LF;
}
function format3(content, eol) {
    return content.replace(regDetect, eol);
}
const mod3 = {
    emptyDir,
    emptyDirSync,
    ensureDir,
    ensureDirSync,
    ensureFile,
    ensureFileSync,
    ensureLink,
    ensureLinkSync,
    exists,
    existsSync,
    ensureSymlink,
    ensureSymlinkSync,
    expandGlob,
    expandGlobSync,
    _createWalkEntrySync,
    _createWalkEntry,
    walk,
    walkSync,
    move,
    moveSync,
    copy,
    copySync,
    EOL,
    detect,
    format: format3
};
function concat(...buf) {
    let length = 0;
    for (const b of buf){
        length += b.length;
    }
    const output = new Uint8Array(length);
    let index = 0;
    for (const b1 of buf){
        output.set(b1, index);
        index += b1.length;
    }
    return output;
}
function copy1(src, dst, off = 0) {
    off = Math.max(0, Math.min(off, dst.byteLength));
    const dstBytesAvailable = dst.byteLength - off;
    if (src.byteLength > dstBytesAvailable) {
        src = src.subarray(0, dstBytesAvailable);
    }
    dst.set(src, off);
    return src.byteLength;
}
const MIN_READ = 32 * 1024;
const MAX_SIZE = 2 ** 32 - 2;
class Buffer {
    #buf;
    #off = 0;
    constructor(ab){
        this.#buf = ab === undefined ? new Uint8Array(0) : new Uint8Array(ab);
    }
    bytes(options = {
        copy: true
    }) {
        if (options.copy === false) return this.#buf.subarray(this.#off);
        return this.#buf.slice(this.#off);
    }
    empty() {
        return this.#buf.byteLength <= this.#off;
    }
    get length() {
        return this.#buf.byteLength - this.#off;
    }
    get capacity() {
        return this.#buf.buffer.byteLength;
    }
    truncate(n) {
        if (n === 0) {
            this.reset();
            return;
        }
        if (n < 0 || n > this.length) {
            throw Error("bytes.Buffer: truncation out of range");
        }
        this.#reslice(this.#off + n);
    }
    reset() {
        this.#reslice(0);
        this.#off = 0;
    }
    #tryGrowByReslice(n) {
        const l = this.#buf.byteLength;
        if (n <= this.capacity - l) {
            this.#reslice(l + n);
            return l;
        }
        return -1;
    }
    #reslice(len) {
        assert(len <= this.#buf.buffer.byteLength);
        this.#buf = new Uint8Array(this.#buf.buffer, 0, len);
    }
    readSync(p) {
        if (this.empty()) {
            this.reset();
            if (p.byteLength === 0) {
                return 0;
            }
            return null;
        }
        const nread = copy1(this.#buf.subarray(this.#off), p);
        this.#off += nread;
        return nread;
    }
    read(p) {
        const rr = this.readSync(p);
        return Promise.resolve(rr);
    }
    writeSync(p) {
        const m = this.#grow(p.byteLength);
        return copy1(p, this.#buf, m);
    }
    write(p) {
        const n = this.writeSync(p);
        return Promise.resolve(n);
    }
    #grow(n1) {
        const m = this.length;
        if (m === 0 && this.#off !== 0) {
            this.reset();
        }
        const i = this.#tryGrowByReslice(n1);
        if (i >= 0) {
            return i;
        }
        const c = this.capacity;
        if (n1 <= Math.floor(c / 2) - m) {
            copy1(this.#buf.subarray(this.#off), this.#buf);
        } else if (c + n1 > MAX_SIZE) {
            throw new Error("The buffer cannot be grown beyond the maximum size.");
        } else {
            const buf = new Uint8Array(Math.min(2 * c + n1, MAX_SIZE));
            copy1(this.#buf.subarray(this.#off), buf);
            this.#buf = buf;
        }
        this.#off = 0;
        this.#reslice(Math.min(m + n1, MAX_SIZE));
        return m;
    }
    grow(n) {
        if (n < 0) {
            throw Error("Buffer.grow: negative count");
        }
        const m = this.#grow(n);
        this.#reslice(m);
    }
    async readFrom(r) {
        let n = 0;
        const tmp = new Uint8Array(MIN_READ);
        while(true){
            const shouldGrow = this.capacity - this.length < MIN_READ;
            const buf = shouldGrow ? tmp : new Uint8Array(this.#buf.buffer, this.length);
            const nread = await r.read(buf);
            if (nread === null) {
                return n;
            }
            if (shouldGrow) this.writeSync(buf.subarray(0, nread));
            else this.#reslice(this.length + nread);
            n += nread;
        }
    }
    readFromSync(r) {
        let n = 0;
        const tmp = new Uint8Array(MIN_READ);
        while(true){
            const shouldGrow = this.capacity - this.length < MIN_READ;
            const buf = shouldGrow ? tmp : new Uint8Array(this.#buf.buffer, this.length);
            const nread = r.readSync(buf);
            if (nread === null) {
                return n;
            }
            if (shouldGrow) this.writeSync(buf.subarray(0, nread));
            else this.#reslice(this.length + nread);
            n += nread;
        }
    }
}
class BytesList {
    len = 0;
    chunks = [];
    constructor(){}
    size() {
        return this.len;
    }
    add(value, start = 0, end = value.byteLength) {
        if (value.byteLength === 0 || end - start === 0) {
            return;
        }
        checkRange(start, end, value.byteLength);
        this.chunks.push({
            value,
            end,
            start,
            offset: this.len
        });
        this.len += end - start;
    }
    shift(n) {
        if (n === 0) {
            return;
        }
        if (this.len <= n) {
            this.chunks = [];
            this.len = 0;
            return;
        }
        const idx = this.getChunkIndex(n);
        this.chunks.splice(0, idx);
        const [chunk] = this.chunks;
        if (chunk) {
            const diff = n - chunk.offset;
            chunk.start += diff;
        }
        let offset = 0;
        for (const chunk1 of this.chunks){
            chunk1.offset = offset;
            offset += chunk1.end - chunk1.start;
        }
        this.len = offset;
    }
    getChunkIndex(pos) {
        let max = this.chunks.length;
        let min = 0;
        while(true){
            const i = min + Math.floor((max - min) / 2);
            if (i < 0 || this.chunks.length <= i) {
                return -1;
            }
            const { offset , start , end  } = this.chunks[i];
            const len = end - start;
            if (offset <= pos && pos < offset + len) {
                return i;
            } else if (offset + len <= pos) {
                min = i + 1;
            } else {
                max = i - 1;
            }
        }
    }
    get(i) {
        if (i < 0 || this.len <= i) {
            throw new Error("out of range");
        }
        const idx = this.getChunkIndex(i);
        const { value , offset , start  } = this.chunks[idx];
        return value[start + i - offset];
    }
    *iterator(start = 0) {
        const startIdx = this.getChunkIndex(start);
        if (startIdx < 0) return;
        const first = this.chunks[startIdx];
        let firstOffset = start - first.offset;
        for(let i = startIdx; i < this.chunks.length; i++){
            const chunk = this.chunks[i];
            for(let j = chunk.start + firstOffset; j < chunk.end; j++){
                yield chunk.value[j];
            }
            firstOffset = 0;
        }
    }
    slice(start, end = this.len) {
        if (end === start) {
            return new Uint8Array();
        }
        checkRange(start, end, this.len);
        const result = new Uint8Array(end - start);
        const startIdx = this.getChunkIndex(start);
        const endIdx = this.getChunkIndex(end - 1);
        let written = 0;
        for(let i = startIdx; i < endIdx; i++){
            const chunk = this.chunks[i];
            const len = chunk.end - chunk.start;
            result.set(chunk.value.subarray(chunk.start, chunk.end), written);
            written += len;
        }
        const last = this.chunks[endIdx];
        const rest = end - start - written;
        result.set(last.value.subarray(last.start, last.start + rest), written);
        return result;
    }
    concat() {
        const result = new Uint8Array(this.len);
        let sum = 0;
        for (const { value , start , end  } of this.chunks){
            result.set(value.subarray(start, end), sum);
            sum += end - start;
        }
        return result;
    }
}
function checkRange(start, end, len) {
    if (start < 0 || len < start || end < 0 || len < end || end < start) {
        throw new Error("invalid range");
    }
}
const { Deno: Deno1  } = globalThis;
typeof Deno1?.noColor === "boolean" ? Deno1.noColor : true;
new RegExp([
    "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))", 
].join("|"), "g");
var DiffType;
(function(DiffType) {
    DiffType["removed"] = "removed";
    DiffType["common"] = "common";
    DiffType["added"] = "added";
})(DiffType || (DiffType = {}));
class AssertionError extends Error {
    name = "AssertionError";
    constructor(message){
        super(message);
    }
}
function assert1(expr, msg = "") {
    if (!expr) {
        throw new AssertionError(msg);
    }
}
const DEFAULT_BUFFER_SIZE = 32 * 1024;
async function readAll(r) {
    const buf = new Buffer();
    await buf.readFrom(r);
    return buf.bytes();
}
function readAllSync(r) {
    const buf = new Buffer();
    buf.readFromSync(r);
    return buf.bytes();
}
async function readRange(r, range) {
    let length = range.end - range.start + 1;
    assert1(length > 0, "Invalid byte range was passed.");
    await r.seek(range.start, Deno.SeekMode.Start);
    const result = new Uint8Array(length);
    let off = 0;
    while(length){
        const p = new Uint8Array(Math.min(length, DEFAULT_BUFFER_SIZE));
        const nread = await r.read(p);
        assert1(nread !== null, "Unexpected EOF reach while reading a range.");
        assert1(nread > 0, "Unexpected read of 0 bytes while reading a range.");
        copy1(p, result, off);
        off += nread;
        length -= nread;
        assert1(length >= 0, "Unexpected length remaining after reading range.");
    }
    return result;
}
function readRangeSync(r, range) {
    let length = range.end - range.start + 1;
    assert1(length > 0, "Invalid byte range was passed.");
    r.seekSync(range.start, Deno.SeekMode.Start);
    const result = new Uint8Array(length);
    let off = 0;
    while(length){
        const p = new Uint8Array(Math.min(length, DEFAULT_BUFFER_SIZE));
        const nread = r.readSync(p);
        assert1(nread !== null, "Unexpected EOF reach while reading a range.");
        assert1(nread > 0, "Unexpected read of 0 bytes while reading a range.");
        copy1(p, result, off);
        off += nread;
        length -= nread;
        assert1(length >= 0, "Unexpected length remaining after reading range.");
    }
    return result;
}
async function writeAll(w, arr) {
    let nwritten = 0;
    while(nwritten < arr.length){
        nwritten += await w.write(arr.subarray(nwritten));
    }
}
function writeAllSync(w, arr) {
    let nwritten = 0;
    while(nwritten < arr.length){
        nwritten += w.writeSync(arr.subarray(nwritten));
    }
}
async function* iter(r, options) {
    const bufSize = options?.bufSize ?? DEFAULT_BUFFER_SIZE;
    const b = new Uint8Array(bufSize);
    while(true){
        const result = await r.read(b);
        if (result === null) {
            break;
        }
        yield b.subarray(0, result);
    }
}
function* iterSync(r, options) {
    const bufSize = options?.bufSize ?? DEFAULT_BUFFER_SIZE;
    const b = new Uint8Array(bufSize);
    while(true){
        const result = r.readSync(b);
        if (result === null) {
            break;
        }
        yield b.subarray(0, result);
    }
}
async function copy2(src, dst, options) {
    let n = 0;
    const bufSize = options?.bufSize ?? DEFAULT_BUFFER_SIZE;
    const b = new Uint8Array(bufSize);
    let gotEOF = false;
    while(gotEOF === false){
        const result = await src.read(b);
        if (result === null) {
            gotEOF = true;
        } else {
            let nwritten = 0;
            while(nwritten < result){
                nwritten += await dst.write(b.subarray(nwritten, result));
            }
            n += nwritten;
        }
    }
    return n;
}
const DEFAULT_BUF_SIZE = 4096;
const MIN_BUF_SIZE = 16;
const CR = "\r".charCodeAt(0);
const LF = "\n".charCodeAt(0);
class BufferFullError extends Error {
    name;
    constructor(partial){
        super("Buffer full");
        this.partial = partial;
        this.name = "BufferFullError";
    }
    partial;
}
class PartialReadError extends Error {
    name = "PartialReadError";
    partial;
    constructor(){
        super("Encountered UnexpectedEof, data only partially read");
    }
}
class BufReader {
    buf;
    rd;
    r = 0;
    w = 0;
    eof = false;
    static create(r, size = 4096) {
        return r instanceof BufReader ? r : new BufReader(r, size);
    }
    constructor(rd, size = 4096){
        if (size < 16) {
            size = MIN_BUF_SIZE;
        }
        this._reset(new Uint8Array(size), rd);
    }
    size() {
        return this.buf.byteLength;
    }
    buffered() {
        return this.w - this.r;
    }
    async _fill() {
        if (this.r > 0) {
            this.buf.copyWithin(0, this.r, this.w);
            this.w -= this.r;
            this.r = 0;
        }
        if (this.w >= this.buf.byteLength) {
            throw Error("bufio: tried to fill full buffer");
        }
        for(let i = 100; i > 0; i--){
            const rr = await this.rd.read(this.buf.subarray(this.w));
            if (rr === null) {
                this.eof = true;
                return;
            }
            assert(rr >= 0, "negative read");
            this.w += rr;
            if (rr > 0) {
                return;
            }
        }
        throw new Error(`No progress after ${100} read() calls`);
    }
    reset(r) {
        this._reset(this.buf, r);
    }
    _reset(buf, rd) {
        this.buf = buf;
        this.rd = rd;
        this.eof = false;
    }
    async read(p) {
        let rr = p.byteLength;
        if (p.byteLength === 0) return rr;
        if (this.r === this.w) {
            if (p.byteLength >= this.buf.byteLength) {
                const rr1 = await this.rd.read(p);
                const nread = rr1 ?? 0;
                assert(nread >= 0, "negative read");
                return rr1;
            }
            this.r = 0;
            this.w = 0;
            rr = await this.rd.read(this.buf);
            if (rr === 0 || rr === null) return rr;
            assert(rr >= 0, "negative read");
            this.w += rr;
        }
        const copied = copy1(this.buf.subarray(this.r, this.w), p, 0);
        this.r += copied;
        return copied;
    }
    async readFull(p) {
        let bytesRead = 0;
        while(bytesRead < p.length){
            try {
                const rr = await this.read(p.subarray(bytesRead));
                if (rr === null) {
                    if (bytesRead === 0) {
                        return null;
                    } else {
                        throw new PartialReadError();
                    }
                }
                bytesRead += rr;
            } catch (err) {
                if (err instanceof PartialReadError) {
                    err.partial = p.subarray(0, bytesRead);
                } else if (err instanceof Error) {
                    const e = new PartialReadError();
                    e.partial = p.subarray(0, bytesRead);
                    e.stack = err.stack;
                    e.message = err.message;
                    e.cause = err.cause;
                    throw err;
                }
                throw err;
            }
        }
        return p;
    }
    async readByte() {
        while(this.r === this.w){
            if (this.eof) return null;
            await this._fill();
        }
        const c = this.buf[this.r];
        this.r++;
        return c;
    }
    async readString(delim) {
        if (delim.length !== 1) {
            throw new Error("Delimiter should be a single character");
        }
        const buffer = await this.readSlice(delim.charCodeAt(0));
        if (buffer === null) return null;
        return new TextDecoder().decode(buffer);
    }
    async readLine() {
        let line = null;
        try {
            line = await this.readSlice(LF);
        } catch (err) {
            if (err instanceof Deno.errors.BadResource) {
                throw err;
            }
            let partial;
            if (err instanceof PartialReadError) {
                partial = err.partial;
                assert(partial instanceof Uint8Array, "bufio: caught error from `readSlice()` without `partial` property");
            }
            if (!(err instanceof BufferFullError)) {
                throw err;
            }
            if (!this.eof && partial && partial.byteLength > 0 && partial[partial.byteLength - 1] === CR) {
                assert(this.r > 0, "bufio: tried to rewind past start of buffer");
                this.r--;
                partial = partial.subarray(0, partial.byteLength - 1);
            }
            if (partial) {
                return {
                    line: partial,
                    more: !this.eof
                };
            }
        }
        if (line === null) {
            return null;
        }
        if (line.byteLength === 0) {
            return {
                line,
                more: false
            };
        }
        if (line[line.byteLength - 1] == LF) {
            let drop = 1;
            if (line.byteLength > 1 && line[line.byteLength - 2] === CR) {
                drop = 2;
            }
            line = line.subarray(0, line.byteLength - drop);
        }
        return {
            line,
            more: false
        };
    }
    async readSlice(delim) {
        let s = 0;
        let slice;
        while(true){
            let i = this.buf.subarray(this.r + s, this.w).indexOf(delim);
            if (i >= 0) {
                i += s;
                slice = this.buf.subarray(this.r, this.r + i + 1);
                this.r += i + 1;
                break;
            }
            if (this.eof) {
                if (this.r === this.w) {
                    return null;
                }
                slice = this.buf.subarray(this.r, this.w);
                this.r = this.w;
                break;
            }
            if (this.buffered() >= this.buf.byteLength) {
                this.r = this.w;
                const oldbuf = this.buf;
                const newbuf = this.buf.slice(0);
                this.buf = newbuf;
                throw new BufferFullError(oldbuf);
            }
            s = this.w - this.r;
            try {
                await this._fill();
            } catch (err) {
                if (err instanceof PartialReadError) {
                    err.partial = slice;
                } else if (err instanceof Error) {
                    const e = new PartialReadError();
                    e.partial = slice;
                    e.stack = err.stack;
                    e.message = err.message;
                    e.cause = err.cause;
                    throw err;
                }
                throw err;
            }
        }
        return slice;
    }
    async peek(n) {
        if (n < 0) {
            throw Error("negative count");
        }
        let avail = this.w - this.r;
        while(avail < n && avail < this.buf.byteLength && !this.eof){
            try {
                await this._fill();
            } catch (err) {
                if (err instanceof PartialReadError) {
                    err.partial = this.buf.subarray(this.r, this.w);
                } else if (err instanceof Error) {
                    const e = new PartialReadError();
                    e.partial = this.buf.subarray(this.r, this.w);
                    e.stack = err.stack;
                    e.message = err.message;
                    e.cause = err.cause;
                    throw err;
                }
                throw err;
            }
            avail = this.w - this.r;
        }
        if (avail === 0 && this.eof) {
            return null;
        } else if (avail < n && this.eof) {
            return this.buf.subarray(this.r, this.r + avail);
        } else if (avail < n) {
            throw new BufferFullError(this.buf.subarray(this.r, this.w));
        }
        return this.buf.subarray(this.r, this.r + n);
    }
}
class AbstractBufBase {
    buf;
    usedBufferBytes = 0;
    err = null;
    size() {
        return this.buf.byteLength;
    }
    available() {
        return this.buf.byteLength - this.usedBufferBytes;
    }
    buffered() {
        return this.usedBufferBytes;
    }
}
class BufWriter extends AbstractBufBase {
    static create(writer, size = 4096) {
        return writer instanceof BufWriter ? writer : new BufWriter(writer, size);
    }
    constructor(writer, size = 4096){
        super();
        this.writer = writer;
        if (size <= 0) {
            size = DEFAULT_BUF_SIZE;
        }
        this.buf = new Uint8Array(size);
    }
    reset(w) {
        this.err = null;
        this.usedBufferBytes = 0;
        this.writer = w;
    }
    async flush() {
        if (this.err !== null) throw this.err;
        if (this.usedBufferBytes === 0) return;
        try {
            await writeAll(this.writer, this.buf.subarray(0, this.usedBufferBytes));
        } catch (e) {
            if (e instanceof Error) {
                this.err = e;
            }
            throw e;
        }
        this.buf = new Uint8Array(this.buf.length);
        this.usedBufferBytes = 0;
    }
    async write(data) {
        if (this.err !== null) throw this.err;
        if (data.length === 0) return 0;
        let totalBytesWritten = 0;
        let numBytesWritten = 0;
        while(data.byteLength > this.available()){
            if (this.buffered() === 0) {
                try {
                    numBytesWritten = await this.writer.write(data);
                } catch (e) {
                    if (e instanceof Error) {
                        this.err = e;
                    }
                    throw e;
                }
            } else {
                numBytesWritten = copy1(data, this.buf, this.usedBufferBytes);
                this.usedBufferBytes += numBytesWritten;
                await this.flush();
            }
            totalBytesWritten += numBytesWritten;
            data = data.subarray(numBytesWritten);
        }
        numBytesWritten = copy1(data, this.buf, this.usedBufferBytes);
        this.usedBufferBytes += numBytesWritten;
        totalBytesWritten += numBytesWritten;
        return totalBytesWritten;
    }
    writer;
}
class BufWriterSync extends AbstractBufBase {
    static create(writer, size = 4096) {
        return writer instanceof BufWriterSync ? writer : new BufWriterSync(writer, size);
    }
    constructor(writer, size = 4096){
        super();
        this.writer = writer;
        if (size <= 0) {
            size = DEFAULT_BUF_SIZE;
        }
        this.buf = new Uint8Array(size);
    }
    reset(w) {
        this.err = null;
        this.usedBufferBytes = 0;
        this.writer = w;
    }
    flush() {
        if (this.err !== null) throw this.err;
        if (this.usedBufferBytes === 0) return;
        try {
            writeAllSync(this.writer, this.buf.subarray(0, this.usedBufferBytes));
        } catch (e) {
            if (e instanceof Error) {
                this.err = e;
            }
            throw e;
        }
        this.buf = new Uint8Array(this.buf.length);
        this.usedBufferBytes = 0;
    }
    writeSync(data) {
        if (this.err !== null) throw this.err;
        if (data.length === 0) return 0;
        let totalBytesWritten = 0;
        let numBytesWritten = 0;
        while(data.byteLength > this.available()){
            if (this.buffered() === 0) {
                try {
                    numBytesWritten = this.writer.writeSync(data);
                } catch (e) {
                    if (e instanceof Error) {
                        this.err = e;
                    }
                    throw e;
                }
            } else {
                numBytesWritten = copy1(data, this.buf, this.usedBufferBytes);
                this.usedBufferBytes += numBytesWritten;
                this.flush();
            }
            totalBytesWritten += numBytesWritten;
            data = data.subarray(numBytesWritten);
        }
        numBytesWritten = copy1(data, this.buf, this.usedBufferBytes);
        this.usedBufferBytes += numBytesWritten;
        totalBytesWritten += numBytesWritten;
        return totalBytesWritten;
    }
    writer;
}
function createLPS(pat) {
    const lps = new Uint8Array(pat.length);
    lps[0] = 0;
    let prefixEnd = 0;
    let i = 1;
    while(i < lps.length){
        if (pat[i] == pat[prefixEnd]) {
            prefixEnd++;
            lps[i] = prefixEnd;
            i++;
        } else if (prefixEnd === 0) {
            lps[i] = 0;
            i++;
        } else {
            prefixEnd = lps[prefixEnd - 1];
        }
    }
    return lps;
}
async function* readDelim(reader, delim) {
    const delimLen = delim.length;
    const delimLPS = createLPS(delim);
    const chunks = new BytesList();
    const bufSize = Math.max(1024, delimLen + 1);
    let inspectIndex = 0;
    let matchIndex = 0;
    while(true){
        const inspectArr = new Uint8Array(bufSize);
        const result = await reader.read(inspectArr);
        if (result === null) {
            yield chunks.concat();
            return;
        } else if (result < 0) {
            return;
        }
        chunks.add(inspectArr, 0, result);
        let localIndex = 0;
        while(inspectIndex < chunks.size()){
            if (inspectArr[localIndex] === delim[matchIndex]) {
                inspectIndex++;
                localIndex++;
                matchIndex++;
                if (matchIndex === delimLen) {
                    const matchEnd = inspectIndex - delimLen;
                    const readyBytes = chunks.slice(0, matchEnd);
                    yield readyBytes;
                    chunks.shift(inspectIndex);
                    inspectIndex = 0;
                    matchIndex = 0;
                }
            } else {
                if (matchIndex === 0) {
                    inspectIndex++;
                    localIndex++;
                } else {
                    matchIndex = delimLPS[matchIndex - 1];
                }
            }
        }
    }
}
async function* readStringDelim(reader, delim, decoderOpts) {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder(decoderOpts?.encoding, decoderOpts);
    for await (const chunk of readDelim(reader, encoder.encode(delim))){
        yield decoder.decode(chunk);
    }
}
async function* readLines(reader, decoderOpts) {
    const bufReader = new BufReader(reader);
    let chunks = [];
    const decoder = new TextDecoder(decoderOpts?.encoding, decoderOpts);
    while(true){
        const res = await bufReader.readLine();
        if (!res) {
            if (chunks.length > 0) {
                yield decoder.decode(concat(...chunks));
            }
            break;
        }
        chunks.push(res.line);
        if (!res.more) {
            yield decoder.decode(concat(...chunks));
            chunks = [];
        }
    }
}
const DEFAULT_BUFFER_SIZE1 = 32 * 1024;
async function copyN(r, dest, size) {
    let bytesRead = 0;
    let buf = new Uint8Array(DEFAULT_BUFFER_SIZE1);
    while(bytesRead < size){
        if (size - bytesRead < DEFAULT_BUFFER_SIZE1) {
            buf = new Uint8Array(size - bytesRead);
        }
        const result = await r.read(buf);
        const nread = result ?? 0;
        bytesRead += nread;
        if (nread > 0) {
            let n = 0;
            while(n < nread){
                n += await dest.write(buf.slice(n, nread));
            }
            assert(n === nread, "could not write");
        }
        if (result === null) {
            break;
        }
    }
    return bytesRead;
}
async function readShort(buf) {
    const high = await buf.readByte();
    if (high === null) return null;
    const low = await buf.readByte();
    if (low === null) throw new Deno.errors.UnexpectedEof();
    return high << 8 | low;
}
async function readInt(buf) {
    const high = await readShort(buf);
    if (high === null) return null;
    const low = await readShort(buf);
    if (low === null) throw new Deno.errors.UnexpectedEof();
    return high << 16 | low;
}
const MAX_SAFE_INTEGER = BigInt(Number.MAX_SAFE_INTEGER);
async function readLong(buf) {
    const high = await readInt(buf);
    if (high === null) return null;
    const low = await readInt(buf);
    if (low === null) throw new Deno.errors.UnexpectedEof();
    const big = BigInt(high) << 32n | BigInt(low);
    if (big > MAX_SAFE_INTEGER) {
        throw new RangeError("Long value too big to be represented as a JavaScript number.");
    }
    return Number(big);
}
function sliceLongToBytes(d, dest = new Array(8)) {
    let big = BigInt(d);
    for(let i = 0; i < 8; i++){
        dest[7 - i] = Number(big & 0xffn);
        big >>= 8n;
    }
    return dest;
}
class StringReader extends Buffer {
    constructor(s){
        super(new TextEncoder().encode(s).buffer);
    }
}
class MultiReader {
    readers;
    currentIndex = 0;
    constructor(...readers){
        this.readers = readers;
    }
    async read(p) {
        const r = this.readers[this.currentIndex];
        if (!r) return null;
        const result = await r.read(p);
        if (result === null) {
            this.currentIndex++;
            return 0;
        }
        return result;
    }
}
class LimitedReader {
    constructor(reader, limit){
        this.reader = reader;
        this.limit = limit;
    }
    async read(p) {
        if (this.limit <= 0) {
            return null;
        }
        if (p.length > this.limit) {
            p = p.subarray(0, this.limit);
        }
        const n = await this.reader.read(p);
        if (n == null) {
            return null;
        }
        this.limit -= n;
        return n;
    }
    reader;
    limit;
}
function isCloser(value) {
    return typeof value === "object" && value != null && "close" in value && typeof value["close"] === "function";
}
function readerFromIterable(iterable) {
    const iterator = iterable[Symbol.asyncIterator]?.() ?? iterable[Symbol.iterator]?.();
    const buffer = new Buffer();
    return {
        async read (p) {
            if (buffer.length == 0) {
                const result = await iterator.next();
                if (result.done) {
                    return null;
                } else {
                    if (result.value.byteLength <= p.byteLength) {
                        p.set(result.value);
                        return result.value.byteLength;
                    }
                    p.set(result.value.subarray(0, p.byteLength));
                    await writeAll(buffer, result.value.subarray(p.byteLength));
                    return p.byteLength;
                }
            } else {
                const n = await buffer.read(p);
                if (n == null) {
                    return this.read(p);
                }
                return n;
            }
        }
    };
}
function writerFromStreamWriter(streamWriter) {
    return {
        async write (p) {
            await streamWriter.ready;
            await streamWriter.write(p);
            return p.length;
        }
    };
}
function readerFromStreamReader(streamReader) {
    const buffer = new Buffer();
    return {
        async read (p) {
            if (buffer.empty()) {
                const res = await streamReader.read();
                if (res.done) {
                    return null;
                }
                await writeAll(buffer, res.value);
            }
            return buffer.read(p);
        }
    };
}
function writableStreamFromWriter(writer, options = {}) {
    const { autoClose =true  } = options;
    return new WritableStream({
        async write (chunk, controller) {
            try {
                await writeAll(writer, chunk);
            } catch (e) {
                controller.error(e);
                if (isCloser(writer) && autoClose) {
                    writer.close();
                }
            }
        },
        close () {
            if (isCloser(writer) && autoClose) {
                writer.close();
            }
        },
        abort () {
            if (isCloser(writer) && autoClose) {
                writer.close();
            }
        }
    });
}
function readableStreamFromIterable(iterable) {
    const iterator = iterable[Symbol.asyncIterator]?.() ?? iterable[Symbol.iterator]?.();
    return new ReadableStream({
        async pull (controller) {
            const { value , done  } = await iterator.next();
            if (done) {
                controller.close();
            } else {
                controller.enqueue(value);
            }
        },
        async cancel (reason) {
            if (typeof iterator.throw == "function") {
                try {
                    await iterator.throw(reason);
                } catch  {}
            }
        }
    });
}
function readableStreamFromReader(reader, options = {}) {
    const { autoClose =true , chunkSize =16_640 , strategy ,  } = options;
    return new ReadableStream({
        async pull (controller) {
            const chunk = new Uint8Array(chunkSize);
            try {
                const read = await reader.read(chunk);
                if (read === null) {
                    if (isCloser(reader) && autoClose) {
                        reader.close();
                    }
                    controller.close();
                    return;
                }
                controller.enqueue(chunk.subarray(0, read));
            } catch (e) {
                controller.error(e);
                if (isCloser(reader)) {
                    reader.close();
                }
            }
        },
        cancel () {
            if (isCloser(reader) && autoClose) {
                reader.close();
            }
        }
    }, strategy);
}
const decoder = new TextDecoder();
class StringWriter {
    chunks;
    byteLength;
    cache;
    constructor(base = ""){
        this.base = base;
        this.chunks = [];
        this.byteLength = 0;
        const c = new TextEncoder().encode(base);
        this.chunks.push(c);
        this.byteLength += c.byteLength;
    }
    write(p) {
        return Promise.resolve(this.writeSync(p));
    }
    writeSync(p) {
        this.chunks.push(p);
        this.byteLength += p.byteLength;
        this.cache = undefined;
        return p.byteLength;
    }
    toString() {
        if (this.cache) {
            return this.cache;
        }
        const buf = new Uint8Array(this.byteLength);
        let offs = 0;
        for (const chunk of this.chunks){
            buf.set(chunk, offs);
            offs += chunk.byteLength;
        }
        this.cache = decoder.decode(buf);
        return this.cache;
    }
    base;
}
const mod4 = {
    Buffer,
    BufferFullError,
    PartialReadError,
    BufReader,
    BufWriter,
    BufWriterSync,
    readDelim,
    readStringDelim,
    readLines,
    readAll,
    readAllSync,
    readRange,
    readRangeSync,
    writeAll,
    writeAllSync,
    iter,
    iterSync,
    copy: copy2,
    copyN,
    readShort,
    readInt,
    readLong,
    sliceLongToBytes,
    StringReader,
    MultiReader,
    LimitedReader,
    readerFromIterable,
    writerFromStreamWriter,
    readerFromStreamReader,
    writableStreamFromWriter,
    readableStreamFromIterable,
    readableStreamFromReader,
    StringWriter
};
const HEX_CHARS = "0123456789abcdef".split("");
const EXTRA = [
    -2147483648,
    8388608,
    32768,
    128
];
const SHIFT = [
    24,
    16,
    8,
    0
];
const K = [
    0x428a2f98,
    0x71374491,
    0xb5c0fbcf,
    0xe9b5dba5,
    0x3956c25b,
    0x59f111f1,
    0x923f82a4,
    0xab1c5ed5,
    0xd807aa98,
    0x12835b01,
    0x243185be,
    0x550c7dc3,
    0x72be5d74,
    0x80deb1fe,
    0x9bdc06a7,
    0xc19bf174,
    0xe49b69c1,
    0xefbe4786,
    0x0fc19dc6,
    0x240ca1cc,
    0x2de92c6f,
    0x4a7484aa,
    0x5cb0a9dc,
    0x76f988da,
    0x983e5152,
    0xa831c66d,
    0xb00327c8,
    0xbf597fc7,
    0xc6e00bf3,
    0xd5a79147,
    0x06ca6351,
    0x14292967,
    0x27b70a85,
    0x2e1b2138,
    0x4d2c6dfc,
    0x53380d13,
    0x650a7354,
    0x766a0abb,
    0x81c2c92e,
    0x92722c85,
    0xa2bfe8a1,
    0xa81a664b,
    0xc24b8b70,
    0xc76c51a3,
    0xd192e819,
    0xd6990624,
    0xf40e3585,
    0x106aa070,
    0x19a4c116,
    0x1e376c08,
    0x2748774c,
    0x34b0bcb5,
    0x391c0cb3,
    0x4ed8aa4a,
    0x5b9cca4f,
    0x682e6ff3,
    0x748f82ee,
    0x78a5636f,
    0x84c87814,
    0x8cc70208,
    0x90befffa,
    0xa4506ceb,
    0xbef9a3f7,
    0xc67178f2, 
];
const blocks = [];
class Sha256 {
    #block;
    #blocks;
    #bytes;
    #finalized;
    #first;
    #h0;
    #h1;
    #h2;
    #h3;
    #h4;
    #h5;
    #h6;
    #h7;
    #hashed;
    #hBytes;
    #is224;
    #lastByteIndex = 0;
    #start;
    constructor(is224 = false, sharedMemory = false){
        this.init(is224, sharedMemory);
    }
    init(is224, sharedMemory) {
        if (sharedMemory) {
            blocks[0] = blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
            this.#blocks = blocks;
        } else {
            this.#blocks = [
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0
            ];
        }
        if (is224) {
            this.#h0 = 0xc1059ed8;
            this.#h1 = 0x367cd507;
            this.#h2 = 0x3070dd17;
            this.#h3 = 0xf70e5939;
            this.#h4 = 0xffc00b31;
            this.#h5 = 0x68581511;
            this.#h6 = 0x64f98fa7;
            this.#h7 = 0xbefa4fa4;
        } else {
            this.#h0 = 0x6a09e667;
            this.#h1 = 0xbb67ae85;
            this.#h2 = 0x3c6ef372;
            this.#h3 = 0xa54ff53a;
            this.#h4 = 0x510e527f;
            this.#h5 = 0x9b05688c;
            this.#h6 = 0x1f83d9ab;
            this.#h7 = 0x5be0cd19;
        }
        this.#block = this.#start = this.#bytes = this.#hBytes = 0;
        this.#finalized = this.#hashed = false;
        this.#first = true;
        this.#is224 = is224;
    }
    update(message) {
        if (this.#finalized) {
            return this;
        }
        let msg;
        if (message instanceof ArrayBuffer) {
            msg = new Uint8Array(message);
        } else {
            msg = message;
        }
        let index = 0;
        const length = msg.length;
        const blocks = this.#blocks;
        while(index < length){
            let i;
            if (this.#hashed) {
                this.#hashed = false;
                blocks[0] = this.#block;
                blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
            }
            if (typeof msg !== "string") {
                for(i = this.#start; index < length && i < 64; ++index){
                    blocks[i >> 2] |= msg[index] << SHIFT[i++ & 3];
                }
            } else {
                for(i = this.#start; index < length && i < 64; ++index){
                    let code = msg.charCodeAt(index);
                    if (code < 0x80) {
                        blocks[i >> 2] |= code << SHIFT[i++ & 3];
                    } else if (code < 0x800) {
                        blocks[i >> 2] |= (0xc0 | code >> 6) << SHIFT[i++ & 3];
                        blocks[i >> 2] |= (0x80 | code & 0x3f) << SHIFT[i++ & 3];
                    } else if (code < 0xd800 || code >= 0xe000) {
                        blocks[i >> 2] |= (0xe0 | code >> 12) << SHIFT[i++ & 3];
                        blocks[i >> 2] |= (0x80 | code >> 6 & 0x3f) << SHIFT[i++ & 3];
                        blocks[i >> 2] |= (0x80 | code & 0x3f) << SHIFT[i++ & 3];
                    } else {
                        code = 0x10000 + ((code & 0x3ff) << 10 | msg.charCodeAt(++index) & 0x3ff);
                        blocks[i >> 2] |= (0xf0 | code >> 18) << SHIFT[i++ & 3];
                        blocks[i >> 2] |= (0x80 | code >> 12 & 0x3f) << SHIFT[i++ & 3];
                        blocks[i >> 2] |= (0x80 | code >> 6 & 0x3f) << SHIFT[i++ & 3];
                        blocks[i >> 2] |= (0x80 | code & 0x3f) << SHIFT[i++ & 3];
                    }
                }
            }
            this.#lastByteIndex = i;
            this.#bytes += i - this.#start;
            if (i >= 64) {
                this.#block = blocks[16];
                this.#start = i - 64;
                this.hash();
                this.#hashed = true;
            } else {
                this.#start = i;
            }
        }
        if (this.#bytes > 4294967295) {
            this.#hBytes += this.#bytes / 4294967296 << 0;
            this.#bytes = this.#bytes % 4294967296;
        }
        return this;
    }
    finalize() {
        if (this.#finalized) {
            return;
        }
        this.#finalized = true;
        const blocks = this.#blocks;
        const i = this.#lastByteIndex;
        blocks[16] = this.#block;
        blocks[i >> 2] |= EXTRA[i & 3];
        this.#block = blocks[16];
        if (i >= 56) {
            if (!this.#hashed) {
                this.hash();
            }
            blocks[0] = this.#block;
            blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
        }
        blocks[14] = this.#hBytes << 3 | this.#bytes >>> 29;
        blocks[15] = this.#bytes << 3;
        this.hash();
    }
    hash() {
        let a = this.#h0;
        let b = this.#h1;
        let c = this.#h2;
        let d = this.#h3;
        let e = this.#h4;
        let f = this.#h5;
        let g = this.#h6;
        let h = this.#h7;
        const blocks = this.#blocks;
        let s0;
        let s1;
        let maj;
        let t1;
        let t2;
        let ch;
        let ab;
        let da;
        let cd;
        let bc;
        for(let j = 16; j < 64; ++j){
            t1 = blocks[j - 15];
            s0 = (t1 >>> 7 | t1 << 25) ^ (t1 >>> 18 | t1 << 14) ^ t1 >>> 3;
            t1 = blocks[j - 2];
            s1 = (t1 >>> 17 | t1 << 15) ^ (t1 >>> 19 | t1 << 13) ^ t1 >>> 10;
            blocks[j] = blocks[j - 16] + s0 + blocks[j - 7] + s1 << 0;
        }
        bc = b & c;
        for(let j1 = 0; j1 < 64; j1 += 4){
            if (this.#first) {
                if (this.#is224) {
                    ab = 300032;
                    t1 = blocks[0] - 1413257819;
                    h = t1 - 150054599 << 0;
                    d = t1 + 24177077 << 0;
                } else {
                    ab = 704751109;
                    t1 = blocks[0] - 210244248;
                    h = t1 - 1521486534 << 0;
                    d = t1 + 143694565 << 0;
                }
                this.#first = false;
            } else {
                s0 = (a >>> 2 | a << 30) ^ (a >>> 13 | a << 19) ^ (a >>> 22 | a << 10);
                s1 = (e >>> 6 | e << 26) ^ (e >>> 11 | e << 21) ^ (e >>> 25 | e << 7);
                ab = a & b;
                maj = ab ^ a & c ^ bc;
                ch = e & f ^ ~e & g;
                t1 = h + s1 + ch + K[j1] + blocks[j1];
                t2 = s0 + maj;
                h = d + t1 << 0;
                d = t1 + t2 << 0;
            }
            s0 = (d >>> 2 | d << 30) ^ (d >>> 13 | d << 19) ^ (d >>> 22 | d << 10);
            s1 = (h >>> 6 | h << 26) ^ (h >>> 11 | h << 21) ^ (h >>> 25 | h << 7);
            da = d & a;
            maj = da ^ d & b ^ ab;
            ch = h & e ^ ~h & f;
            t1 = g + s1 + ch + K[j1 + 1] + blocks[j1 + 1];
            t2 = s0 + maj;
            g = c + t1 << 0;
            c = t1 + t2 << 0;
            s0 = (c >>> 2 | c << 30) ^ (c >>> 13 | c << 19) ^ (c >>> 22 | c << 10);
            s1 = (g >>> 6 | g << 26) ^ (g >>> 11 | g << 21) ^ (g >>> 25 | g << 7);
            cd = c & d;
            maj = cd ^ c & a ^ da;
            ch = g & h ^ ~g & e;
            t1 = f + s1 + ch + K[j1 + 2] + blocks[j1 + 2];
            t2 = s0 + maj;
            f = b + t1 << 0;
            b = t1 + t2 << 0;
            s0 = (b >>> 2 | b << 30) ^ (b >>> 13 | b << 19) ^ (b >>> 22 | b << 10);
            s1 = (f >>> 6 | f << 26) ^ (f >>> 11 | f << 21) ^ (f >>> 25 | f << 7);
            bc = b & c;
            maj = bc ^ b & d ^ cd;
            ch = f & g ^ ~f & h;
            t1 = e + s1 + ch + K[j1 + 3] + blocks[j1 + 3];
            t2 = s0 + maj;
            e = a + t1 << 0;
            a = t1 + t2 << 0;
        }
        this.#h0 = this.#h0 + a << 0;
        this.#h1 = this.#h1 + b << 0;
        this.#h2 = this.#h2 + c << 0;
        this.#h3 = this.#h3 + d << 0;
        this.#h4 = this.#h4 + e << 0;
        this.#h5 = this.#h5 + f << 0;
        this.#h6 = this.#h6 + g << 0;
        this.#h7 = this.#h7 + h << 0;
    }
    hex() {
        this.finalize();
        const h0 = this.#h0;
        const h1 = this.#h1;
        const h2 = this.#h2;
        const h3 = this.#h3;
        const h4 = this.#h4;
        const h5 = this.#h5;
        const h6 = this.#h6;
        const h7 = this.#h7;
        let hex = HEX_CHARS[h0 >> 28 & 0x0f] + HEX_CHARS[h0 >> 24 & 0x0f] + HEX_CHARS[h0 >> 20 & 0x0f] + HEX_CHARS[h0 >> 16 & 0x0f] + HEX_CHARS[h0 >> 12 & 0x0f] + HEX_CHARS[h0 >> 8 & 0x0f] + HEX_CHARS[h0 >> 4 & 0x0f] + HEX_CHARS[h0 & 0x0f] + HEX_CHARS[h1 >> 28 & 0x0f] + HEX_CHARS[h1 >> 24 & 0x0f] + HEX_CHARS[h1 >> 20 & 0x0f] + HEX_CHARS[h1 >> 16 & 0x0f] + HEX_CHARS[h1 >> 12 & 0x0f] + HEX_CHARS[h1 >> 8 & 0x0f] + HEX_CHARS[h1 >> 4 & 0x0f] + HEX_CHARS[h1 & 0x0f] + HEX_CHARS[h2 >> 28 & 0x0f] + HEX_CHARS[h2 >> 24 & 0x0f] + HEX_CHARS[h2 >> 20 & 0x0f] + HEX_CHARS[h2 >> 16 & 0x0f] + HEX_CHARS[h2 >> 12 & 0x0f] + HEX_CHARS[h2 >> 8 & 0x0f] + HEX_CHARS[h2 >> 4 & 0x0f] + HEX_CHARS[h2 & 0x0f] + HEX_CHARS[h3 >> 28 & 0x0f] + HEX_CHARS[h3 >> 24 & 0x0f] + HEX_CHARS[h3 >> 20 & 0x0f] + HEX_CHARS[h3 >> 16 & 0x0f] + HEX_CHARS[h3 >> 12 & 0x0f] + HEX_CHARS[h3 >> 8 & 0x0f] + HEX_CHARS[h3 >> 4 & 0x0f] + HEX_CHARS[h3 & 0x0f] + HEX_CHARS[h4 >> 28 & 0x0f] + HEX_CHARS[h4 >> 24 & 0x0f] + HEX_CHARS[h4 >> 20 & 0x0f] + HEX_CHARS[h4 >> 16 & 0x0f] + HEX_CHARS[h4 >> 12 & 0x0f] + HEX_CHARS[h4 >> 8 & 0x0f] + HEX_CHARS[h4 >> 4 & 0x0f] + HEX_CHARS[h4 & 0x0f] + HEX_CHARS[h5 >> 28 & 0x0f] + HEX_CHARS[h5 >> 24 & 0x0f] + HEX_CHARS[h5 >> 20 & 0x0f] + HEX_CHARS[h5 >> 16 & 0x0f] + HEX_CHARS[h5 >> 12 & 0x0f] + HEX_CHARS[h5 >> 8 & 0x0f] + HEX_CHARS[h5 >> 4 & 0x0f] + HEX_CHARS[h5 & 0x0f] + HEX_CHARS[h6 >> 28 & 0x0f] + HEX_CHARS[h6 >> 24 & 0x0f] + HEX_CHARS[h6 >> 20 & 0x0f] + HEX_CHARS[h6 >> 16 & 0x0f] + HEX_CHARS[h6 >> 12 & 0x0f] + HEX_CHARS[h6 >> 8 & 0x0f] + HEX_CHARS[h6 >> 4 & 0x0f] + HEX_CHARS[h6 & 0x0f];
        if (!this.#is224) {
            hex += HEX_CHARS[h7 >> 28 & 0x0f] + HEX_CHARS[h7 >> 24 & 0x0f] + HEX_CHARS[h7 >> 20 & 0x0f] + HEX_CHARS[h7 >> 16 & 0x0f] + HEX_CHARS[h7 >> 12 & 0x0f] + HEX_CHARS[h7 >> 8 & 0x0f] + HEX_CHARS[h7 >> 4 & 0x0f] + HEX_CHARS[h7 & 0x0f];
        }
        return hex;
    }
    toString() {
        return this.hex();
    }
    digest() {
        this.finalize();
        const h0 = this.#h0;
        const h1 = this.#h1;
        const h2 = this.#h2;
        const h3 = this.#h3;
        const h4 = this.#h4;
        const h5 = this.#h5;
        const h6 = this.#h6;
        const h7 = this.#h7;
        const arr = [
            h0 >> 24 & 0xff,
            h0 >> 16 & 0xff,
            h0 >> 8 & 0xff,
            h0 & 0xff,
            h1 >> 24 & 0xff,
            h1 >> 16 & 0xff,
            h1 >> 8 & 0xff,
            h1 & 0xff,
            h2 >> 24 & 0xff,
            h2 >> 16 & 0xff,
            h2 >> 8 & 0xff,
            h2 & 0xff,
            h3 >> 24 & 0xff,
            h3 >> 16 & 0xff,
            h3 >> 8 & 0xff,
            h3 & 0xff,
            h4 >> 24 & 0xff,
            h4 >> 16 & 0xff,
            h4 >> 8 & 0xff,
            h4 & 0xff,
            h5 >> 24 & 0xff,
            h5 >> 16 & 0xff,
            h5 >> 8 & 0xff,
            h5 & 0xff,
            h6 >> 24 & 0xff,
            h6 >> 16 & 0xff,
            h6 >> 8 & 0xff,
            h6 & 0xff, 
        ];
        if (!this.#is224) {
            arr.push(h7 >> 24 & 0xff, h7 >> 16 & 0xff, h7 >> 8 & 0xff, h7 & 0xff);
        }
        return arr;
    }
    array() {
        return this.digest();
    }
    arrayBuffer() {
        this.finalize();
        const buffer = new ArrayBuffer(this.#is224 ? 28 : 32);
        const dataView = new DataView(buffer);
        dataView.setUint32(0, this.#h0);
        dataView.setUint32(4, this.#h1);
        dataView.setUint32(8, this.#h2);
        dataView.setUint32(12, this.#h3);
        dataView.setUint32(16, this.#h4);
        dataView.setUint32(20, this.#h5);
        dataView.setUint32(24, this.#h6);
        if (!this.#is224) {
            dataView.setUint32(28, this.#h7);
        }
        return buffer;
    }
}
const __default = {
    copyOptions: function(options) {
        const copy = {};
        for(const key in options){
            if (options.hasOwnProperty(key)) {
                copy[key] = options[key];
            }
        }
        return copy;
    },
    ensureFlagExists: function(item, options) {
        if (!(item in options) || typeof options[item] !== "boolean") {
            options[item] = false;
        }
    },
    ensureSpacesExists: function(options) {
        if (!("spaces" in options) || typeof options.spaces !== "number" && typeof options.spaces !== "string") {
            options.spaces = 0;
        }
    },
    ensureAlwaysArrayExists: function(options) {
        if (!("alwaysArray" in options) || typeof options.alwaysArray !== "boolean" && !Array.isArray(options.alwaysArray)) {
            options.alwaysArray = false;
        }
    },
    ensureKeyExists: function(key, options) {
        if (!(key + "Key" in options) || typeof options[key + "Key"] !== "string") {
            options[key + "Key"] = options.compact ? "_" + key : key;
        }
    }
};
let currentElementName;
function validateOptions(userOptions) {
    const options = __default.copyOptions(userOptions);
    __default.ensureFlagExists("ignoreDeclaration", options);
    __default.ensureFlagExists("ignoreInstruction", options);
    __default.ensureFlagExists("ignoreAttributes", options);
    __default.ensureFlagExists("ignoreText", options);
    __default.ensureFlagExists("ignoreComment", options);
    __default.ensureFlagExists("ignoreCdata", options);
    __default.ensureFlagExists("ignoreDoctype", options);
    __default.ensureFlagExists("compact", options);
    __default.ensureFlagExists("indentText", options);
    __default.ensureFlagExists("indentCdata", options);
    __default.ensureFlagExists("indentAttributes", options);
    __default.ensureFlagExists("indentInstruction", options);
    __default.ensureFlagExists("fullTagEmptyElement", options);
    __default.ensureFlagExists("noQuotesForNativeAttributes", options);
    __default.ensureSpacesExists(options);
    if (typeof options.spaces === "number") {
        options.spaces = Array(options.spaces + 1).join(" ");
    }
    __default.ensureKeyExists("declaration", options);
    __default.ensureKeyExists("instruction", options);
    __default.ensureKeyExists("attributes", options);
    __default.ensureKeyExists("text", options);
    __default.ensureKeyExists("comment", options);
    __default.ensureKeyExists("cdata", options);
    __default.ensureKeyExists("doctype", options);
    __default.ensureKeyExists("type", options);
    __default.ensureKeyExists("name", options);
    __default.ensureKeyExists("elements", options);
    return options;
}
function writeIndentation(options, depth, firstLine) {
    return (!firstLine && options.spaces ? "\n" : "") + Array(depth + 1).join(options.spaces);
}
function writeAttributes(attributes, options, depth) {
    if (options.ignoreAttributes) {
        return "";
    }
    let key, attr, attrName, quote;
    const result = [];
    for(key in attributes){
        if (attributes.hasOwnProperty(key) && attributes[key] !== null && attributes[key] !== undefined) {
            quote = options.noQuotesForNativeAttributes && typeof attributes[key] !== "string" ? "" : '"';
            attr = "" + attributes[key];
            attr = attr.replace(/"/g, "&quot;");
            attrName = key;
            result.push(options.spaces && options.indentAttributes ? writeIndentation(options, depth + 1, false) : " ");
            result.push(attrName + "=" + quote + attr + quote);
        }
    }
    if (attributes && Object.keys(attributes).length && options.spaces && options.indentAttributes) {
        result.push(writeIndentation(options, depth, false));
    }
    return result.join("");
}
function writeDeclaration(declaration, options, depth) {
    declaration;
    "xml";
    return options.ignoreDeclaration ? "" : "<?" + "xml" + writeAttributes(declaration[options.attributesKey], options, depth) + "?>";
}
function writeInstruction(instruction, options, depth) {
    if (options.ignoreInstruction) {
        return "";
    }
    let key;
    for(key in instruction){
        if (instruction.hasOwnProperty(key)) {
            break;
        }
    }
    const instructionName = key;
    if (typeof instruction[key] === "object") {
        instruction;
        instructionName;
        return "<?" + instructionName + writeAttributes(instruction[key][options.attributesKey], options, depth) + "?>";
    } else {
        const instructionValue = instruction[key] ? instruction[key] : "";
        return "<?" + instructionName + (instructionValue ? " " + instructionValue : "") + "?>";
    }
}
function writeComment(comment, options) {
    return options.ignoreComment ? "" : "<!--" + comment + "-->";
}
function writeCdata(cdata, options) {
    return options.ignoreCdata ? "" : "<![CDATA[" + cdata.replace("]]>", "]]]]><![CDATA[>") + "]]>";
}
function writeDoctype(doctype, options) {
    return options.ignoreDoctype ? "" : "<!DOCTYPE " + doctype + ">";
}
function writeText(text, options) {
    if (options.ignoreText) return "";
    text = "" + text;
    text = text.replace(/&amp;/g, "&");
    text = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return text;
}
function hasContent(element, options) {
    let i;
    if (element.elements && element.elements.length) {
        for(i = 0; i < element.elements.length; ++i){
            switch(element.elements[i][options.typeKey]){
                case "text":
                    if (options.indentText) {
                        return true;
                    }
                    break;
                case "cdata":
                    if (options.indentCdata) {
                        return true;
                    }
                    break;
                case "instruction":
                    if (options.indentInstruction) {
                        return true;
                    }
                    break;
                case "doctype":
                case "comment":
                case "element":
                    return true;
                default:
                    return true;
            }
        }
    }
    return false;
}
function writeElement(element, options, depth) {
    element;
    currentElementName = element.name;
    const xml = [], elementName = element.name;
    xml.push("<" + elementName);
    if (element[options.attributesKey]) {
        xml.push(writeAttributes(element[options.attributesKey], options, depth));
    }
    let withClosingTag = element[options.elementsKey] && element[options.elementsKey].length || element[options.attributesKey] && element[options.attributesKey]["xml:space"] === "preserve";
    if (!withClosingTag) {
        withClosingTag = options.fullTagEmptyElement;
    }
    if (withClosingTag) {
        xml.push(">");
        if (element[options.elementsKey] && element[options.elementsKey].length) {
            xml.push(writeElements(element[options.elementsKey], options, depth + 1, false));
            element;
            currentElementName = element.name;
        }
        xml.push(options.spaces && hasContent(element, options) ? "\n" + Array(depth + 1).join(options.spaces) : "");
        xml.push("</" + elementName + ">");
    } else {
        xml.push("/>");
    }
    return xml.join("");
}
function writeElements(elements, options, depth, firstLine) {
    return elements.reduce(function(xml, element) {
        const indent = writeIndentation(options, depth, firstLine && !xml);
        switch(element.type){
            case "element":
                return xml + indent + writeElement(element, options, depth);
            case "comment":
                return xml + indent + writeComment(element[options.commentKey], options);
            case "doctype":
                return xml + indent + writeDoctype(element[options.doctypeKey], options);
            case "cdata":
                return xml + (options.indentCdata ? indent : "") + writeCdata(element[options.cdataKey], options);
            case "text":
                return xml + (options.indentText ? indent : "") + writeText(element[options.textKey], options);
            case "instruction":
                {
                    const instruction = {};
                    instruction[element[options.nameKey]] = element[options.attributesKey] ? element : element[options.instructionKey];
                    return xml + (options.indentInstruction ? indent : "") + writeInstruction(instruction, options, depth);
                }
        }
    }, "");
}
function hasContentCompact(element, options, anyContent) {
    let key;
    for(key in element){
        if (element.hasOwnProperty(key)) {
            switch(key){
                case options.parentKey:
                case options.attributesKey:
                    break;
                case options.textKey:
                    if (options.indentText || anyContent) {
                        return true;
                    }
                    break;
                case options.cdataKey:
                    if (options.indentCdata || anyContent) {
                        return true;
                    }
                    break;
                case options.instructionKey:
                    if (options.indentInstruction || anyContent) {
                        return true;
                    }
                    break;
                case options.doctypeKey:
                case options.commentKey:
                    return true;
                default:
                    return true;
            }
        }
    }
    return false;
}
function writeElementCompact(element, name, options, depth, indent) {
    element;
    name;
    const elementName = name;
    if (typeof element === "undefined" || element === null || element === "") {
        return options.fullTagEmptyElement ? "<" + elementName + "></" + elementName + ">" : "<" + elementName + "/>";
    }
    const xml = [];
    if (name) {
        xml.push("<" + elementName);
        if (typeof element !== "object") {
            xml.push(">" + writeText(element, options) + "</" + elementName + ">");
            return xml.join("");
        }
        if (element[options.attributesKey]) {
            xml.push(writeAttributes(element[options.attributesKey], options, depth));
        }
        let withClosingTag = hasContentCompact(element, options, true) || element[options.attributesKey] && element[options.attributesKey]["xml:space"] === "preserve";
        if (!withClosingTag) {
            withClosingTag = options.fullTagEmptyElement;
        }
        if (withClosingTag) {
            xml.push(">");
        } else {
            xml.push("/>");
            return xml.join("");
        }
    }
    xml.push(writeElementsCompact(element, options, depth + 1, false));
    element;
    name;
    if (name) {
        xml.push((indent ? writeIndentation(options, depth, false) : "") + "</" + elementName + ">");
    }
    return xml.join("");
}
function writeElementsCompact(element, options, depth, firstLine) {
    let i, key, nodes, xml = [];
    for(key in element){
        if (element.hasOwnProperty(key)) {
            nodes = Array.isArray(element[key]) ? element[key] : [
                element[key]
            ];
            for(i = 0; i < nodes.length; ++i){
                switch(key){
                    case options.declarationKey:
                        xml.push(writeDeclaration(nodes[i], options, depth));
                        break;
                    case options.instructionKey:
                        xml.push((options.indentInstruction ? writeIndentation(options, depth, firstLine) : "") + writeInstruction(nodes[i], options, depth));
                        break;
                    case options.attributesKey:
                    case options.parentKey:
                        break;
                    case options.textKey:
                        xml.push((options.indentText ? writeIndentation(options, depth, firstLine) : "") + writeText(nodes[i], options));
                        break;
                    case options.cdataKey:
                        xml.push((options.indentCdata ? writeIndentation(options, depth, firstLine) : "") + writeCdata(nodes[i], options));
                        break;
                    case options.doctypeKey:
                        xml.push(writeIndentation(options, depth, firstLine) + writeDoctype(nodes[i], options));
                        break;
                    case options.commentKey:
                        xml.push(writeIndentation(options, depth, firstLine) + writeComment(nodes[i], options));
                        break;
                    default:
                        xml.push(writeIndentation(options, depth, firstLine) + writeElementCompact(nodes[i], key, options, depth, hasContentCompact(nodes[i], options, undefined)));
                }
                firstLine = firstLine && !xml.length;
            }
        }
    }
    return xml.join("");
}
function __default1(js, options) {
    options = validateOptions(options);
    const xml = [];
    js;
    "_root_";
    if (options.compact) {
        xml.push(writeElementsCompact(js, options, 0, true));
    } else {
        if (js[options.declarationKey]) {
            xml.push(writeDeclaration(js[options.declarationKey], options, 0));
        }
        if (js[options.elementsKey] && js[options.elementsKey].length) {
            xml.push(writeElements(js[options.elementsKey], options, 0, !xml.length));
        }
    }
    return xml.join("");
}
export { Sha256 as Sha256 };
export { __default1 as js2xml };
export { mod3 as fs };
export { mod4 as io };
export { mod2 as path };
