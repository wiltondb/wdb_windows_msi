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

import { js2xml, path } from "../deps.js";
import conf from "../conf.js";
import createDeclaration from "../descriptor/createDeclaration.js";
import createWix from "../descriptor/createWix.js";

export default async (workDir, distDir, debug=false) => {
  console.log("Creating installer descriptor ...");
  let descPrefix = conf.msiFileName;
  if (debug) {
    descPrefix = `${descPrefix}_debug`;
  }
  const descPath = path.join(
    workDir,
    `${descPrefix}_${conf.version}.wxs`,
  );

  // create elements
  const declarationEl = createDeclaration();
  const wixEl = await createWix(distDir);

  // serialize
  const declaration = js2xml(declarationEl, {
    compact: true,
  });
  const wix = js2xml(wixEl, {
    compact: true,
    spaces: 4,
  });
  const xml = `${declaration}\n${wix}`;

  // write
  await Deno.writeTextFile(descPath, xml);

  console.log(`Descriptor written, path: [${descPath}]`);
  return descPath;
};
