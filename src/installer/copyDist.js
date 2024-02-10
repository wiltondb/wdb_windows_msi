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

import { fs, path } from "../deps.js";
import conf from "../conf.js";

export default async (distDir, workDir) => {
  console.log("Preparing dist files ...");

  const filePath = path.fromFileUrl(import.meta.url);
  const rootDir = path.dirname(path.dirname(path.dirname(filePath)));
  const resourcesDir = path.join(rootDir, "resources")
  const bundleDir = path.join(
    workDir,
    `${conf.msiFileName}_${conf.version}`,
  );
  await fs.emptyDir(bundleDir);

  const join = path.join;
  await fs.copy(join(distDir, "bin"), join(bundleDir, "bin"));
  await fs.copy(join(distDir, "include"), join(bundleDir, "include"));
  await fs.copy(join(distDir, "lib"), join(bundleDir, "lib"));
  await fs.copy(join(distDir, "share"), join(bundleDir, "share"));

  const installerDir = path.join(bundleDir, "share", "installer");
  await fs.emptyDir(installerDir);
  await fs.copy(join(resourcesDir, "wiltondb-setup.ps1"), join(installerDir, "wiltondb-setup.ps1"));
  await fs.copy(join(resourcesDir, "wiltondb-setup-01.sql"), join(installerDir, "wiltondb-setup-01.sql"));
  await fs.copy(join(resourcesDir, "wiltondb-setup-02.sql"), join(installerDir, "wiltondb-setup-02.sql"));

  return bundleDir;
};
