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

import conf from "../conf.js";

function collectRefsRecursive(refs, dirEl) {
  if (dirEl.Directory) {
    dirEl.Directory.forEach((el) => {
      collectRefsRecursive(refs, el);
    });
  }
  if (dirEl.Component) {
    dirEl.Component.forEach((comp) => {
      refs.push({
        _attributes: {
          Id: comp._attributes.Id,
        },
      });
    });
  }
}

export default (dirEl) => {
  const refs = [];

  collectRefsRecursive(refs, dirEl);

  return {
    _attributes: {
      Id: conf.featureName,
      Absent: "disallow",
      AllowAdvertise: "no",
      ConfigurableDirectory: "INSTALLDIR",
    },
    ComponentRef: refs,
  };
};
