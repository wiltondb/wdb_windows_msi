/*
 * Copyright 2024, WiltonDB Software
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

import { fs, path } from "../deps.js";
import conf from "../conf.js";

export default async (bundleDir) => {
  console.log("Bundling debuginfo ZIP ...");

  const sevenZipDir = Deno.env.get("SEVEN_ZIP");
  if (null == sevenZipDir) {
    throw new Error(
      "'SEVEN_ZIP' environemnt variable must be set to 7-Zip installation directory",
    );
  }
  if (!(await fs.exists(sevenZipDir))) {
    throw new Error(`Invalid 7-Zip directory specified, path: [${sevenZipDir}]`);
  }

  const bundleName = path.basename(bundleDir);
  const parentDir = path.dirname(bundleDir);
  const bundleSymbolsDir = path.join(bundleDir, "symbols");
  const symbolsDirName = `debuginfo_${bundleName}`;
  const symbolsDir = path.join(parentDir, symbolsDirName);

  await fs.copy(bundleSymbolsDir, symbolsDir);

  const status = await Deno.run({
    cmd: [
      path.join(sevenZipDir, "7z.exe"),
      "a",
      "-tzip",
      `-mx${conf.zipBundleCompressionLevel}`,
      "-bd",
      `${symbolsDirName}.zip`,
      symbolsDirName,
    ],
    cwd: parentDir
  }).status();

  if (0 !== status.code) {
    throw new Error(`7-Zip error, code: [${status.code}]`);
  }

  return `${symbolsDir}.zip`;
};