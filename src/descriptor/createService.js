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
import genId from "./genId.js";

export default {
  install() {
    return {
      _attributes: {
        Id: genId(),
        Type: "ownProcess",
        Vital: "yes",
        Name: conf.serviceName,
        DisplayName: conf.serviceDisplayName,
        Description: conf.serviceDescription,
        Start: "auto",
        Account: "NT AUTHORITY\\LocalService",
        ErrorControl: "ignore",
        Interactive: "no",
        Arguments: "runservice" +
          ` -N ${conf.serviceName}` +
          ' -D "[INSTALLDIR]data"' +
          " -w",
      },
    };
  },

  control() {
    return {
      _attributes: {
        Id: genId(),
        Name: conf.serviceName,
        Start: "install",
        Stop: "uninstall",
        Remove: "uninstall",
        Wait: "yes",
      },
    };
  },
};
