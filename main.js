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

import createMsiInstaller from "./src/installer/createMsiInstaller.js";

if (import.meta.main) {
  if (1 !== Deno.args.length) {
    console.log(
      "ERROR: path to dist directory must be specified as the first and only argument",
    );
    Deno.exit(1);
  }
  await createMsiInstaller(Deno.args[0]);
}
