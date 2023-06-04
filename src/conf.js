import { path } from "./deps.js";

const filePath = path.fromFileUrl(import.meta.url);
const rootDir = path.dirname(path.dirname(filePath));
const txt = await Deno.readTextFile(path.join(rootDir, "config.json"));
export default JSON.parse(txt);
