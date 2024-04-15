/*
 * Copyright 2023, WiltonDB Software
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { path } from "../deps.js";
import conf from "../conf.js";
import fileSha256 from "./fileSha256.js";

const decoder = new TextDecoder();

async function sign(filePath) {
  const cs = conf.codesign;
  const process = Deno.run({
    cmd: [
      cs.signToolPath,
      "sign",
      "/n", cs.commonName,
      "/tr", cs.timestampUrl,
      "/td", cs.hashAlg,
      "/fd", cs.hashAlg,
      "/d", cs.description,
      filePath
    ],
    stderr: "piped",
    stdout: "piped"
  });
  const [status, stdoutBin, stderrBin] = await Promise.all([
    process.status(),
    process.output(),
    process.stderrOutput()
  ]);
  process.close();
  const fileName = path.basename(filePath);
  const stdout = decoder.decode(stdoutBin).replaceAll(filePath, fileName);
  const stderr = decoder.decode(stderrBin);
  if (0 !== status.code) {
    throw new Error(`Code signing error, file: [${filePath}] code: [${status.code}],` +
        ` stdout: [${stdout}], stderr: [${stderr}]`);
  }
  return { stdout, stderr };
}

async function signWithRetry(filePath, maxAttempts) {
  let attempts = maxAttempts;
  while (attempts > 0) {
    try {
      return await sign(filePath);
    } catch(e) {
      attempts -= 1;
      console.log(e.message);
      console.log(`Remaining attempts: [${attempts}]`);
    }
  }
}

async function verify(filePath) {
  const process = Deno.run({
    cmd: [ 
      conf.codesign.signToolPath,
      "verify",
      "/pa",
      "/tw",
      filePath
    ],
    stderr: "piped",
    stdout: "piped"
  });
  const [status, stdoutBin, stderrBin] = await Promise.all([
    process.status(),
    process.output(),
    process.stderrOutput()
  ]);
  process.close();
  const stdout = decoder.decode(stdoutBin);
  const stderr = decoder.decode(stderrBin);
  if (0 !== status.code) {
    throw new Error(`Code signing verification error, file: [${filePath}], code: [${status.code}],` +
        ` stdout: [${stdout}], stderr: [${stderr}]`);
  }
}

export default async (filePath) => {
  const sha256Unsigned = await fileSha256(filePath);
  const { stdout, stderr } = await signWithRetry(filePath, 10);
  await verify(filePath);
  const sha256Signed = await fileSha256(filePath);
  if (sha256Unsigned === sha256Signed) {
    throw new Error(`Code signing hashsum error, file: [${filePath}], sha256: [${sha256Unsigned}]`);
  }
  return { stdout, stderr, sha256Unsigned, sha256Signed };
}