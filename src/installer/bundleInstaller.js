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

export default async (wixDir, descriptor) => {
  console.log("Bundling installer ...");
  const name = descriptor.substring(0, descriptor.length - 4);
  const filePath = path.fromFileUrl(import.meta.url);
  const rootDir = path.dirname(path.dirname(path.dirname(filePath)));

  const codeCandle = await Deno.run({
    cmd: [
      path.join(wixDir, "bin/candle.exe"),
      "-nologo",
      "-arch",
      "x64",
      "-ext",
      "WixUtilExtension",
      "-o",
      `${name}.wixobj`,
      descriptor,
    ],
  }).status();

  if (0 !== codeCandle.code) {
    throw new Error(`Installer compiler error, code: [${codeCandle.code}]`);
  }

  const codeLight = await Deno.run({
    cmd: [
      path.join(wixDir, "bin/light.exe"),
      "-nologo",
      "-sw1076",
      "-ext",
      "WixUIExtension",
      "-ext",
      "WixUtilExtension",
      "-sval",
      "-cultures:en-US",
      "-loc",
      path.join(rootDir, "resources", "messages.wxl"),
      "-o",
      `${name}.msi`,
      `${name}.wixobj`,
    ],
  }).status();

  if (0 !== codeLight.code) {
    throw new Error(`Installer linker error, code: [${codeLight.code}]`);
  }

  return `${name}.msi`;
};
