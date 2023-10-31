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