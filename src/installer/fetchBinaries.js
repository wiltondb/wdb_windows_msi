import { fs, io, path, Sha256 } from "../deps.js";
import conf from "../conf.js";

async function fileSha256(filePath) {
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

async function checkFileSha256(filePath, expected) {
  console.log(`Checking file, path: [${filePath}] ...`);
  const actual = await fileSha256(filePath);
  if (expected !== actual) {
    throw new Error(
      `Binary file hash sum mismatch, path: [${filePath}], expected: [${expected}], actual: [${actual}]`,
    );
  }
}

async function fetchFile(url, dest) {
    console.log(`Fetching file, url: [${url}] ...` );
    const rsp = await fetch(url);
    const reader = io.readerFromStreamReader(rsp.body?.getReader());
    const file = Deno.openSync(dest, {
      create: true,
      write: true,
    });
    try {
      await io.copy(reader, file);
    } finally {
      file.close();
    }
}

export default async () => {
  return;
  /*
  const binDir = path.join(conf.appdir, "bin");
  if (!(await fs.exists(binDir))) {
    await Deno.mkdir(binDir);
  }
  const denoExe = path.join(conf.appdir, "bin/deno.exe");
  if (!(await fs.exists(denoExe))) {
    await Deno.copyFile(Deno.execPath(), denoExe);
  }
  await checkFileSha256(denoExe, conf.installer.denoExeSha256);
  */
};
