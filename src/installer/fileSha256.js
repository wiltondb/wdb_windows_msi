import { io, Sha256 } from "../deps.js";

export default async (filePath) => {
  const file = await Deno.open(filePath);
  const fileSize = (await file.stat()).size;
  const reader = new io.BufReader(file);
  const buf = new Uint8Array(4096);
  const digest = new Sha256();
  let read = 0;
  while (read < fileSize) {
    const remaining = fileSize - read;
    let dest = buf;
    if (remaining < buf.length) {
      dest = new Uint8Array(remaining);
    }
    const success = await reader.readFull(dest);
    if (!success) {
      throw new Error(`File read error, path: [${filePath}]`);
    }
    digest.update(dest);
    read += dest.length;
  }
  return digest.hex();
}