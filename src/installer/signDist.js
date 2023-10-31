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
import signFile from "./signFile.js";

function sortFun(a, b) {
  if (a.isDirectory) {
    if(b.isDirectory) {
      return a.name.localeCompare(b.name);
    } else {
      return 1;
    }
  }
  if (b.isDirectory) {
    return -1;
  }
  return a.name.localeCompare(b.name);
}

async function processDirRecursive(rootDir, dirPath, logArray) {
  const children = [];
  for await (const en of Deno.readDir(dirPath)) {
    children.push(en);
  }
  children.sort(sortFun);
  for (const ch of children) {
    const chPath = path.join(dirPath, ch.name);
    if (ch.isDirectory) {
      await processDirRecursive(rootDir, chPath, logArray);
    } else {
      const nameLower = ch.name.toLowerCase();
      if (nameLower.endsWith(".dll") || nameLower.endsWith(".exe")) {
        const { stdout, stderr, sha256Unsigned, sha256Signed } = await signFile(chPath);
        const file = path.relative(rootDir, chPath).replaceAll("\\", "/");
        logArray.push({ file, sha256Unsigned, sha256Signed, stdout, stderr });
        if (0 === logArray.length % 10) {
          console.log(`Files signed count: [${logArray.length}] ...`);
        }
      }
    }
  }
}

export default async (bundleDir) => {
  console.log("Signing dist files ...");
  const logArray = [];
  await processDirRecursive(bundleDir, bundleDir, logArray);
  const logPath = path.join(bundleDir, "share", "installer", "sign_log.json");
  const logText = JSON.stringify(logArray, null, 4);
  await Deno.writeTextFile(logPath, logText);
  console.log(`Signing complete, files count: [${logArray.length}]`);
}