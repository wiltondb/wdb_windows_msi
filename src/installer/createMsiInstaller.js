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

import { fs } from "../deps.js";
import conf from "../conf.js";
import bundleInstaller from "./bundleInstaller.js";
import copyDist from "./copyDist.js";
import prepareWorkDir from "./prepareWorkDir.js";
import signDist from "./signDist.js";
import signFile from "./signFile.js";
import writeDescriptor from "./writeDescriptor.js";

export default async (distDir) => {
  if (!(await fs.exists(distDir))) {
    throw new Error(`Invalid dist directory specified, path: [${distDir}]`);
  }
  const wixDir = Deno.env.get("WIX");
  if (null == wixDir) {
    throw new Error(
      "'WIX' environemnt variable must be set to WiX Toolset directory",
    );
  }
  if (!(await fs.exists(wixDir))) {
    throw new Error(`Invalid Wix directory specified, path: [${wixDir}]`);
  }

  // prepare work dir
  const workDir = await prepareWorkDir();

  // copy dist
  const bundleDir = await copyDist(distDir, workDir);

  // sign dist
  if (conf.codesign.enabled) {
    await signDist(bundleDir);
  }

  // create descriptor
  const descriptor = await writeDescriptor(workDir, bundleDir);

  // run wix
  const inst = await bundleInstaller(wixDir, descriptor);

  // sign installer
  if (conf.codesign.enabled) {
    await signFile(inst);
  }

  console.log(`Installer created successfully, path: [${inst}]`);
};
