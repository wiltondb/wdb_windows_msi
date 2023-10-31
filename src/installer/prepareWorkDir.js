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

export default async () => {
  console.log("Preparing work directory ...");

  const filePath = path.fromFileUrl(import.meta.url);
  const rootDir = path.dirname(path.dirname(path.dirname(filePath)));
  const workDir = path.join(rootDir, "work");

  await fs.emptyDir(workDir);

  return workDir;
};
