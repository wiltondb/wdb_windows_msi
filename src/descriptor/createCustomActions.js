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

export default {
  actions() {
    return [{
      _attributes: {
        Id: "create_cluster_immediate",
        Property: "create_cluster_deferred",
        Value: "&quot;[System64Folder]WindowsPowerShell\\v1.0\\powershell.exe&quot;" +
          " -NoLogo -NoProfile -NonInteractive" +
          " -ExecutionPolicy Bypass" +
          " -File &quot;[INSTALLDIR]share\\installer\\wiltondb-setup.ps1&quot;" +
          " &quot;[INSTALLDIR]&quot;"
      },
    }, {
      _attributes: {
        Id: "create_cluster_deferred",
        BinaryKey: "WixCA",
        DllEntry: "WixQuietExec",
        Return: "check",
        Execute: "deferred",
        Impersonate: "no",
      },
    }, {
      _attributes: {
        Id: "postinstall",
        FileKey: "WDB_CONFIG_EXE_ID",
        Return: "asyncNoWait",
        Impersonate: "yes",
        ExeCommand: "--postinstall",
      },
    }];
  },

  executeSequence() {
    return {
      Custom: [{
        _attributes: {
          Action: "create_cluster_immediate",
          Before: "InstallInitialize",
        },
        _cdata: "(NOT Installed) AND (NOT REMOVE)",
      }, {
        _attributes: {
          Action: "create_cluster_deferred",
          Before: "InstallServices",
        },
        _cdata: "(NOT Installed) AND (NOT REMOVE)",
      }],
    };
  },
};
